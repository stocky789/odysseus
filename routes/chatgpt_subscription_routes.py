"""ChatGPT Subscription device-flow setup routes."""

import json
import logging
import threading
import time
import uuid
from typing import Dict, Optional

from fastapi import APIRouter, Form, HTTPException, Request

from core.database import ModelEndpoint, ProviderAuthSession, SessionLocal, utcnow_naive
from core.middleware import require_admin
from src.auth_helpers import get_current_user
from src import chatgpt_subscription

logger = logging.getLogger(__name__)

_PENDING: Dict[str, Dict] = {}
_PENDING_LOCK = threading.Lock()


def _prune_expired() -> None:
    now = time.time()
    with _PENDING_LOCK:
        for key in [k for k, v in _PENDING.items() if v.get("expires_at", 0) < now]:
            _PENDING.pop(key, None)


def _provision_endpoint(tokens: Dict, owner: Optional[str]) -> Dict:
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    if not access_token or not refresh_token:
        raise ValueError("ChatGPT token response was missing access_token or refresh_token")

    base = chatgpt_subscription.DEFAULT_CHATGPT_SUBSCRIPTION_BASE_URL
    models = chatgpt_subscription.fetch_available_models(access_token)
    if not models:
        raise ValueError("ChatGPT Subscription connected, but no usable Codex models were discovered for this account.")
    db = SessionLocal()
    try:
        auth = (
            db.query(ProviderAuthSession)
            .filter(
                ProviderAuthSession.provider == chatgpt_subscription.CHATGPT_SUBSCRIPTION_PROVIDER,
                ProviderAuthSession.owner == owner,
            )
            .first()
        )
        if auth is None:
            auth = ProviderAuthSession(
                id=str(uuid.uuid4())[:8],
                provider=chatgpt_subscription.CHATGPT_SUBSCRIPTION_PROVIDER,
                owner=owner,
                label="ChatGPT Subscription",
                base_url=base,
                auth_mode="chatgpt",
            )
            db.add(auth)
        auth.base_url = base
        auth.access_token = access_token
        auth.refresh_token = refresh_token
        auth.last_refresh = utcnow_naive()
        auth.auth_mode = "chatgpt"

        ep = (
            db.query(ModelEndpoint)
            .filter(
                ModelEndpoint.base_url == base,
                ModelEndpoint.provider_auth_id == auth.id,
                ModelEndpoint.owner == owner,
            )
            .first()
        )
        if ep is None:
            ep = ModelEndpoint(
                id=str(uuid.uuid4())[:8],
                name="ChatGPT Subscription",
                base_url=base,
                model_type="llm",
                endpoint_kind="api",
                owner=owner,
            )
            db.add(ep)
        ep.name = "ChatGPT Subscription"
        ep.base_url = base
        ep.api_key = None
        ep.provider_auth_id = auth.id
        ep.is_enabled = True
        ep.supports_tools = False
        ep.model_type = "llm"
        ep.endpoint_kind = "api"
        ep.model_refresh_mode = "manual"
        ep.cached_models = json.dumps(models)
        db.commit()
        result = {
            "id": ep.id,
            "name": ep.name,
            "base_url": ep.base_url,
            "models": models,
        }
    finally:
        db.close()

    try:
        from routes.model_routes import _invalidate_models_cache

        _invalidate_models_cache()
    except Exception:
        pass
    return result


def setup_chatgpt_subscription_routes() -> APIRouter:
    router = APIRouter(prefix="/api/chatgpt-subscription", tags=["chatgpt-subscription"])

    @router.post("/device/start")
    def device_start(request: Request):
        require_admin(request)
        _prune_expired()
        try:
            data = chatgpt_subscription.request_device_code()
        except Exception as exc:
            raise chatgpt_subscription.to_http_exception(exc)

        device_auth_id = data.get("device_auth_id")
        user_code = data.get("user_code")
        if not device_auth_id or not user_code:
            raise HTTPException(502, "ChatGPT did not return a complete device code")
        interval = int(data.get("interval") or 5)
        expires_in = int(data.get("expires_in") or 900)
        poll_id = uuid.uuid4().hex
        verification_uri = data.get("verification_uri") or f"{chatgpt_subscription.CHATGPT_OAUTH_ISSUER}/codex/device"
        with _PENDING_LOCK:
            _PENDING[poll_id] = {
                "device_auth_id": device_auth_id,
                "user_code": user_code,
                "owner": get_current_user(request) or None,
                "expires_at": time.time() + expires_in,
                "interval": interval,
                "next_poll_at": 0.0,
            }
        return {
            "poll_id": poll_id,
            "user_code": user_code,
            "verification_uri": verification_uri,
            "interval": interval,
            "expires_in": expires_in,
        }

    @router.post("/device/poll")
    def device_poll(request: Request, poll_id: str = Form(...)):
        require_admin(request)
        _prune_expired()
        with _PENDING_LOCK:
            pending = _PENDING.get(poll_id)
        if not pending:
            raise HTTPException(404, "Unknown or expired login session")

        now = time.time()
        if now < pending.get("next_poll_at", 0):
            return {"status": "pending"}

        try:
            data = chatgpt_subscription.poll_device_auth(pending["device_auth_id"], pending["user_code"])
        except Exception as exc:
            logger.debug("ChatGPT device poll failed: %s", exc)
            return {"status": "pending", "detail": str(exc)}

        authorization_code = data.get("authorization_code")
        code_verifier = data.get("code_verifier")
        if authorization_code and code_verifier:
            try:
                tokens = chatgpt_subscription.exchange_authorization_code(authorization_code, code_verifier)
                result = _provision_endpoint(tokens, pending["owner"])
            except Exception as exc:
                logger.exception("ChatGPT Subscription endpoint provisioning failed")
                with _PENDING_LOCK:
                    _PENDING.pop(poll_id, None)
                raise chatgpt_subscription.to_http_exception(exc)
            with _PENDING_LOCK:
                _PENDING.pop(poll_id, None)
            return {"status": "authorized", "endpoint": result}

        err = data.get("error") or data.get("status")
        if err in ("authorization_pending", "pending", None):
            with _PENDING_LOCK:
                if poll_id in _PENDING:
                    _PENDING[poll_id]["next_poll_at"] = now + pending["interval"]
            return {"status": "pending"}
        if err == "slow_down":
            new_interval = int(data.get("interval") or (pending["interval"] + 5))
            with _PENDING_LOCK:
                if poll_id in _PENDING:
                    _PENDING[poll_id]["interval"] = new_interval
                    _PENDING[poll_id]["next_poll_at"] = now + new_interval
            return {"status": "pending"}
        if err in ("expired_token", "access_denied", "denied"):
            with _PENDING_LOCK:
                _PENDING.pop(poll_id, None)
            return {"status": "failed", "error": err}
        return {"status": "pending", "detail": err or "unknown"}

    @router.post("/device/cancel")
    def device_cancel(request: Request, poll_id: str = Form(...)):
        require_admin(request)
        with _PENDING_LOCK:
            _PENDING.pop(poll_id, None)
        return {"status": "cancelled"}

    return router
