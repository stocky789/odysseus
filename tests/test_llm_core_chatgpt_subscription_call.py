"""llm_call (synchronous) must speak the Codex Responses API for ChatGPT
Subscription endpoints, not chat-completions.

A codex /responses endpoint rejects a chat-completions ``{messages: [...]}``
body with ``400: "Instructions are required"``. The synchronous helper must
build a Responses-API payload (``instructions`` + ``input``), POST to
``/responses``, and accumulate the ``response.output_text.delta`` events.
"""

import src.llm_core as llm_core


class _FakeStreamResponse:
    def __init__(self, status_code, lines):
        self.status_code = status_code
        self._lines = lines

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def iter_lines(self):
        for line in self._lines:
            yield line

    def read(self):
        return b'{"detail":"error body"}'


def test_llm_call_codex_uses_responses_api(monkeypatch):
    captured = {}

    def _fake_stream(method, url, json=None, headers=None, timeout=None, **kw):
        captured["method"] = method
        captured["url"] = url
        captured["payload"] = json
        captured["headers"] = headers
        lines = [
            "event: response.output_text.delta",
            'data: {"type":"response.output_text.delta","delta":"feat: add "}',
            'data: {"type":"response.output_text.delta","delta":"a thing"}',
            "event: response.completed",
            'data: {"type":"response.completed","response":{}}',
        ]
        return _FakeStreamResponse(200, lines)

    def _fail_post(*args, **kwargs):
        raise AssertionError("llm_call sent a chat-completions POST for a codex URL")

    monkeypatch.setattr(llm_core.httpx, "stream", _fake_stream)
    monkeypatch.setattr(llm_core.httpx, "post", _fail_post)

    out = llm_core.llm_call(
        "https://chatgpt.com/backend-api/codex",
        "gpt-5-codex",
        [
            {"role": "system", "content": "You write commit messages."},
            {"role": "user", "content": "diff body"},
        ],
        temperature=0.3,
        max_tokens=512,
        headers={"Authorization": "Bearer fresh"},
    )

    assert out == "feat: add a thing"
    assert captured["method"] == "POST"
    assert captured["url"].endswith("/responses")
    payload = captured["payload"]
    assert payload.get("instructions"), "responses payload must carry instructions"
    assert "input" in payload, "responses payload must carry input"
    assert "messages" not in payload, "must not send a chat-completions body to /responses"
    assert captured["headers"].get("Authorization") == "Bearer fresh"


def test_llm_call_codex_surfaces_upstream_error(monkeypatch):
    """A non-200 from the codex endpoint becomes a clean 502, not a silent pass."""
    from fastapi import HTTPException

    def _fake_stream(method, url, json=None, headers=None, timeout=None, **kw):
        return _FakeStreamResponse(400, [])

    monkeypatch.setattr(llm_core.httpx, "stream", _fake_stream)

    try:
        llm_core.llm_call(
            "https://chatgpt.com/backend-api/codex",
            "gpt-5-codex",
            [{"role": "system", "content": "sys"}, {"role": "user", "content": "u"}],
        )
    except HTTPException as exc:
        assert exc.status_code == 502
    else:
        raise AssertionError("expected an HTTPException for a non-200 codex response")
