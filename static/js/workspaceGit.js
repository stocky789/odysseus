// static/js/workspaceGit.js
//
// Git Workspace Panel: review changes, edit files, and run common git
// operations against the active workspace folder. The panel reuses the app's
// modal shell, .lib-tabs vocabulary, compact toolbar buttons, toast/confirm
// helpers, and the shared draggable-window framework so it feels native.

import uiModule from './ui.js';
import workspaceModule from './workspace.js';
import sessionModule from './sessions.js';
import { makeWindowDraggable } from './windowDrag.js';

const TABS = [
  { id: 'changes', label: 'Changes' },
  { id: 'files', label: 'Files' },
  { id: 'history', label: 'History' },
  { id: 'blame', label: 'Blame' },
  { id: 'conflicts', label: 'Conflicts' },
];

// ── Inline icons (feather-style, currentColor) ──────────────────────────────
const ICON = {
  git: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M6 8.5v7"/><circle cx="17" cy="7" r="2.5"/><path d="M17 9.5a6 6 0 0 1-6 6H8.5"/></svg>',
  branch: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  fetch: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8"/><path d="M8.5 12.5 12 16l3.5-3.5"/></svg>',
  pull: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  push: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
  folder: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  file: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>',
  wrap: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M3 12h15a3 3 0 1 1 0 6h-4"/><path d="m15 15-2 3 2 3"/><path d="M3 18h6"/></svg>',
  caret: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 16l-1.7-4.9L6 9.3l4.3-1.7z"/><path d="M19 14l.9 2.3L22 17l-2.1.7L19 20l-.9-2.3L16 17l2.1-.7z"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  close: '✖',
};

// ── Backend endpoints (centralized so the contract is in one place) ─────────
const EP = {
  status: '/api/workspace/git/status',
  diff: '/api/workspace/git/diff',
  stage: '/api/workspace/git/stage',
  unstage: '/api/workspace/git/unstage',
  discard: '/api/workspace/git/discard',
  hunkStage: '/api/workspace/git/hunks/stage',
  hunkUnstage: '/api/workspace/git/hunks/unstage',
  commit: '/api/workspace/git/commit',
  commitSelected: '/api/workspace/git/commit-selected',
  branches: '/api/workspace/git/branches',
  checkout: '/api/workspace/git/checkout',
  checkoutStash: '/api/workspace/git/checkout-stash',
  branchCreate: '/api/workspace/git/branch/create',
  commitMessage: '/api/workspace/git/commit-message',
  fetch: '/api/workspace/git/fetch',
  pull: '/api/workspace/git/pull',
  push: '/api/workspace/git/push',
  init: '/api/workspace/git/init',
  clone: '/api/workspace/git/clone',
  history: '/api/workspace/git/history',
  blame: '/api/workspace/git/blame',
  conflicts: '/api/workspace/git/conflicts',
  conflictResolve: '/api/workspace/git/conflict/resolve',
  // Workspace file browse/read/save (not under the /git prefix).
  files: '/api/workspace/files',
  file: '/api/workspace/file',
  fileSave: '/api/workspace/file/save',
};

// Error that carries the backend's stable error code so callers can branch on
// `not_git_repo`, `dirty_worktree`, `merge_conflict`, … instead of string matching.
class GitApiError extends Error {
  constructor(code, message, status) {
    super(message || code);
    this.name = 'GitApiError';
    this.code = code || 'git_failed';
    this.status = status || 0;
  }
}

// Single fetch wrapper for both the git and workspace-file endpoints. `opts`:
//   { method, body, query } — body is JSON-encoded, query becomes a querystring.
async function gitApi(path, opts = {}) {
  const { method = 'GET', body, query } = opts;
  let url = window.location.origin + path;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      // Empty strings are intentionally elided so the backend's default applies —
      // callers rely on this (e.g. `staged: '1' | ''` and `path: '' `) to fall back.
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    }
    const s = qs.toString();
    if (s) url += (path.includes('?') ? '&' : '?') + s;
  }
  const init = { method, credentials: 'same-origin', headers: {} };
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, init);
  } catch (_) {
    throw new GitApiError('network_error', 'Network error — is the server reachable?', 0);
  }
  let data = null;
  try { data = await res.json(); } catch (_) { /* non-JSON or empty body */ }
  if (!res.ok || (data && data.ok === false)) {
    const code = (data && data.code) || 'git_failed';
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new GitApiError(code, message, res.status);
  }
  return data || {};
}

// ── Panel state ─────────────────────────────────────────────────────────────
const state = {
  workspace: '',       // active workspace abs path (from the workspace module)
  status: null,        // last /status payload
  activeTab: 'changes',
  selectedPath: null,  // file selected in Changes/Files/History/Blame
  selectedStaged: false, // whether the selected diff is the staged side
  branches: null,      // last /branches payload (cached while the menu is open)
  branchMenuOpen: false,
  branchFilter: '',
  editor: null,        // { path, original, value, dirty, binary, editable, mode, wrap }
  filesPath: '',       // current directory in the Files browser (workspace-relative)
  commitMessage: '',   // in-progress commit message (preserved across renders)
  loading: false,
  error: null,         // { code, message } from the last failed call
};

let _modal = null;
let _lastFocus = null; // element focused before the panel opened; restored on close

function _basename(p) {
  if (!p) return '';
  const parts = String(p).replace(/[\\/]+$/, '').split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

// Tiny safe DOM builder. Repo-derived strings go in as text nodes / {text:…}.
// The innerHTML sink is named `unsafeHtml` so any use is self-flagging in review;
// only trusted icon constants from the static ICON map are ever passed to it.
function _h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'unsafeHtml') node.innerHTML = v;
    else if (k === 'dataset') Object.assign(node.dataset, v);
    // `onActivate` turns a non-button element into a keyboard-operable control:
    // role=button + tabindex, activated by click, Enter, or Space.
    else if (k === 'onActivate' && typeof v === 'function') {
      if (!node.getAttribute('role')) node.setAttribute('role', 'button');
      if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '0');
      node.addEventListener('click', v);
      node.addEventListener('keydown', (e) => {
        // Only the row itself responds to Enter/Space — keystrokes bubbling up from
        // an inner focusable control (e.g. a Stage/Discard button) keep their own
        // native activation and must not also trigger the row.
        if (e.target !== node) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); v(e); }
      });
    }
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  return node;
}

// Porcelain change kinds → short letter + readable name.
const KIND_LETTER = {
  modified: 'M', added: 'A', deleted: 'D', renamed: 'R', copied: 'C',
  untracked: 'U', unmerged: '!', ignored: 'I',
};
const KIND_NAME = {
  modified: 'Modified', added: 'Added', deleted: 'Deleted', renamed: 'Renamed',
  copied: 'Copied', untracked: 'Untracked', unmerged: 'Conflicted', ignored: 'Ignored',
};

// ── Modal shell ─────────────────────────────────────────────────────────────

function _tabBar() {
  // Full ARIA tab pattern: each tab controls its panel and uses a roving tabindex
  // (only the active tab is in the tab order; arrows move between the rest).
  return TABS.map((t) => {
    const on = t.id === state.activeTab;
    return `<button type="button" class="lib-tab wgit-tab" id="wgit-tab-${t.id}" data-tab="${t.id}"` +
      ` role="tab" aria-controls="wgit-panel-${t.id}" aria-selected="${on ? 'true' : 'false'}"` +
      ` tabindex="${on ? '0' : '-1'}">${t.label}</button>`;
  }).join('');
}

function _tabPanels() {
  return TABS.map((t) =>
    `<section class="wgit-panel" id="wgit-panel-${t.id}" data-tab="${t.id}"` +
    ` role="tabpanel" aria-labelledby="wgit-tab-${t.id}" tabindex="0"` +
    `${t.id === state.activeTab ? '' : ' hidden'}></section>`
  ).join('');
}

function _getModal() {
  if (_modal) return _modal;
  _modal = document.createElement('div');
  _modal.id = 'workspace-git-modal';
  _modal.className = 'modal';
  _modal.style.display = 'none';
  _modal.innerHTML = `
    <div class="modal-content wgit-content" role="dialog" aria-modal="true" aria-labelledby="wgit-ws-name">
      <div class="modal-header wgit-header">
        <h4 class="wgit-title">
          ${ICON.git}
          <span class="wgit-ws-name" id="wgit-ws-name">No workspace</span>
          <span class="wgit-badge" id="wgit-repo-badge" hidden></span>
        </h4>
        <button class="close-btn" id="workspace-git-close" aria-label="Close">${ICON.close}</button>
      </div>
      <div class="wgit-toolbar">
        <button type="button" class="wgit-branch" id="wgit-branch-btn" title="Switch branch" aria-haspopup="menu" aria-expanded="false" disabled>${ICON.branch}<span class="wgit-branch-name">—</span><span class="wgit-branch-caret" aria-hidden="true">${ICON.caret}</span></button>
        <div class="wgit-toolbar-actions">
          <button type="button" class="wgit-icon-btn" id="wgit-refresh" title="Refresh status" aria-label="Refresh status">${ICON.refresh}</button>
          <button type="button" class="wgit-icon-btn" id="wgit-fetch" title="Fetch" aria-label="Fetch">${ICON.fetch}</button>
          <button type="button" class="wgit-icon-btn" id="wgit-pull" title="Pull" aria-label="Pull">${ICON.pull}</button>
          <button type="button" class="wgit-icon-btn" id="wgit-push" title="Push" aria-label="Push">${ICON.push}</button>
          <span class="wgit-toolbar-sep" aria-hidden="true"></span>
          <button type="button" class="memory-toolbar-btn" id="wgit-clone">Clone</button>
          <button type="button" class="memory-toolbar-btn" id="wgit-init">Initialize</button>
        </div>
      </div>
      <div class="lib-tabs wgit-tabs" role="tablist">${_tabBar()}</div>
      <div class="modal-body wgit-body">${_tabPanels()}</div>
    </div>`;
  document.body.appendChild(_modal);

  _modal.querySelector('#workspace-git-close').addEventListener('click', () => closeWorkspaceGitPanel());
  _modal.querySelectorAll('.wgit-tab').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (await _guardUnsaved()) _selectTab(btn.dataset.tab);
    });
  });
  const tablist = _modal.querySelector('.wgit-tabs');
  if (tablist) tablist.addEventListener('keydown', _onTablistKeydown);
  // Keep keyboard focus inside the dialog while it is open.
  _modal.addEventListener('keydown', _trapFocus);
  _modal.querySelector('#wgit-refresh').addEventListener('click', () => refreshWorkspaceGitStatus());
  _modal.querySelector('#wgit-fetch').addEventListener('click', () => _remoteAction('fetch'));
  _modal.querySelector('#wgit-pull').addEventListener('click', () => _remoteAction('pull'));
  _modal.querySelector('#wgit-push').addEventListener('click', () => _remoteAction('push'));
  _modal.querySelector('#wgit-clone').addEventListener('click', () => _openCloneDialog());
  _modal.querySelector('#wgit-init').addEventListener('click', () => _initRepo());
  _modal.querySelector('#wgit-branch-btn').addEventListener('click', (e) => { e.stopPropagation(); _toggleBranchMenu(); });

  const content = _modal.querySelector('.modal-content');
  const header = _modal.querySelector('.modal-header');
  if (content && header) makeWindowDraggable(_modal, { content, header });
  return _modal;
}

// ── Tab switching ───────────────────────────────────────────────────────────

function _selectTab(tab) {
  if (!_modal || !tab) return;
  _closeBranchMenu();
  state.activeTab = tab;
  _modal.querySelectorAll('.wgit-tab').forEach((btn) => {
    const on = btn.dataset.tab === tab;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
    btn.setAttribute('tabindex', on ? '0' : '-1'); // roving tabindex
  });
  _modal.querySelectorAll('.wgit-panel').forEach((panel) => {
    const on = panel.dataset.tab === tab;
    panel.hidden = !on;
    // Clear inactive panels so reused ids (e.g. the editor surface, shared by
    // Files and Conflicts) never coexist. Each tab rebuilds from state on entry.
    if (!on) panel.innerHTML = '';
  });
  _renderActiveTab();
}

// Arrow/Home/End move between tabs (WAI-ARIA tablist keyboard pattern).
async function _onTablistKeydown(e) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
  e.preventDefault();
  const ids = TABS.map((t) => t.id);
  let idx = ids.indexOf(state.activeTab);
  if (e.key === 'ArrowLeft') idx = (idx - 1 + ids.length) % ids.length;
  else if (e.key === 'ArrowRight') idx = (idx + 1) % ids.length;
  else if (e.key === 'Home') idx = 0;
  else if (e.key === 'End') idx = ids.length - 1;
  const next = ids[idx];
  if (next === state.activeTab || !(await _guardUnsaved())) return;
  _selectTab(next);
  const btn = _modal && _modal.querySelector(`#wgit-tab-${next}`);
  if (btn) btn.focus();
}

// Visible, focusable controls inside the dialog, in DOM order.
function _focusables() {
  if (!_modal) return [];
  const sel = 'button:not([disabled]), [href], input:not([disabled]), ' +
    'textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(_modal.querySelectorAll(sel)).filter((el) => el.offsetParent !== null);
}

// Wrap Tab/Shift+Tab within the dialog. Skips when another handler already took
// Tab (the editor uses Tab to indent and calls preventDefault first).
function _trapFocus(e) {
  if (e.key !== 'Tab' || e.defaultPrevented) return;
  const items = _focusables();
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// Build a .wgit-empty block with a title + sub line, always via textContent — the
// single safe path, so no branch can accidentally innerHTML a dynamic message.
function _emptyState(title, sub) {
  return _h('div', { class: 'wgit-empty' }, [
    _h('p', { class: 'wgit-empty-title', text: title }),
    _h('p', { class: 'wgit-empty-sub', text: sub }),
  ]);
}

// Shared empty/error states shown in place of tab content when the panel can't
// render real data yet. Returns true when it handled (occupied) the panel.
function _renderPanelGate(panel) {
  if (!state.workspace) {
    panel.innerHTML = '';
    const wrap = _emptyState('No workspace selected',
      'Choose a folder to review changes, edit files, and run git.');
    wrap.appendChild(_h('button', {
      type: 'button', class: 'confirm-btn confirm-btn-primary', text: 'Select workspace',
      onclick: () => { if (workspaceModule.openWorkspaceBrowser) workspaceModule.openWorkspaceBrowser(); },
    }));
    panel.appendChild(wrap);
    return true;
  }
  if (state.error && state.error.code === 'not_git_repo') {
    panel.innerHTML = '';
    panel.appendChild(_emptyState('Not a git repository',
      'Initialize this folder or clone a repository to get started.'));
    return true;
  }
  if (state.error) {
    panel.innerHTML = '';
    panel.appendChild(_emptyState('Could not load', state.error.message || 'Something went wrong.'));
    return true;
  }
  return false;
}

// Per-tab rendering. Later tasks fill in Files, History, Blame, and Conflicts.
function _renderActiveTab() {
  if (!_modal) return;
  const panel = _modal.querySelector(`#wgit-panel-${state.activeTab}`);
  if (!panel) return;
  if (_renderPanelGate(panel)) return;
  if (state.activeTab === 'changes') { _renderChanges(panel); return; }
  if (state.activeTab === 'files') { _renderFiles(panel); return; }
  if (state.activeTab === 'history') { _renderHistory(panel); return; }
  if (state.activeTab === 'blame') { _renderBlame(panel); return; }
  if (state.activeTab === 'conflicts') { _renderConflicts(panel); return; }
  panel.innerHTML = '<div class="wgit-placeholder">Coming soon.</div>';
}

// ── Mutations (each refreshes status afterward) ─────────────────────────────

async function _mutate(fn, { busy = true } = {}) {
  if (busy) _setBusy(true);
  try {
    await fn();
  } catch (err) {
    uiModule.showError(err && err.message ? err.message : 'Git operation failed');
    return false;
  } finally {
    if (busy) _setBusy(false);
  }
  await refreshWorkspaceGitStatus();
  return true;
}

// Run `fn` with the busy indicator on, surfacing any error as a toast. Returns
// { ok, data } so callers keep their own bespoke success handling (toast text,
// editor-mode transitions, …) without each re-implementing the busy/try/catch.
async function _withBusy(fn, errMsg) {
  _setBusy(true);
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    uiModule.showError(err && err.message ? err.message : errMsg);
    return { ok: false };
  } finally {
    _setBusy(false);
  }
}

// Single source of truth for the discard-unsaved confirm (text + options), so the
// prompt can't drift between the guard and the editor's Escape/Cancel paths.
function _confirmDiscard() {
  return uiModule.styledConfirm('Discard unsaved changes to this file?', {
    confirmText: 'Discard', cancelText: 'Keep editing', danger: true,
  });
}

// Revert the editor to its last-saved content and drop back to read mode.
function _resetEditorToSaved(ed) {
  if (!ed) return;
  ed.value = ed.original;
  ed.dirty = false;
  ed.mode = 'read';
}

function _stagePaths(paths) {
  return _mutate(async () => {
    await gitApi(EP.stage, { method: 'POST', body: { workspace: state.workspace, paths } });
  });
}

function _unstagePaths(paths) {
  return _mutate(async () => {
    await gitApi(EP.unstage, { method: 'POST', body: { workspace: state.workspace, paths } });
  });
}

async function _discardPaths(paths, { conflicted = false } = {}) {
  const many = paths.length > 1;
  const what = conflicted
    ? `Discard conflict resolution for ${many ? paths.length + ' files' : _basename(paths[0])}?`
    : `Discard changes to ${many ? paths.length + ' files' : _basename(paths[0])}? This cannot be undone.`;
  const ok = await uiModule.styledConfirm(what, { confirmText: 'Discard', cancelText: 'Keep', danger: true });
  if (!ok) return false;
  return _mutate(async () => {
    await gitApi(EP.discard, {
      method: 'POST',
      body: { workspace: state.workspace, paths, confirmConflict: conflicted },
    });
    if (paths.includes(state.selectedPath)) state.selectedPath = null;
  });
}

async function _stageHunk(path, hunkId) {
  const ok = await _mutate(async () => {
    await gitApi(EP.hunkStage, { method: 'POST', body: { workspace: state.workspace, path, hunkId } });
  });
  return ok;
}

async function _unstageHunk(path, hunkId) {
  const ok = await _mutate(async () => {
    await gitApi(EP.hunkUnstage, { method: 'POST', body: { workspace: state.workspace, path, hunkId } });
  });
  return ok;
}

async function _commitStaged() {
  const message = (state.commitMessage || '').trim();
  if (!message) { uiModule.showError('Enter a commit message'); return; }
  const ok = await _mutate(async () => {
    await gitApi(EP.commit, { method: 'POST', body: { workspace: state.workspace, message } });
  });
  if (ok) { state.commitMessage = ''; uiModule.showToast('Committed'); }
}

async function _commitSelected() {
  const message = (state.commitMessage || '').trim();
  if (!message) { uiModule.showError('Enter a commit message'); return; }
  if (!state.selectedPath) { uiModule.showError('Select a file to commit'); return; }
  const path = state.selectedPath;
  const ok = await _mutate(async () => {
    await gitApi(EP.commitSelected, { method: 'POST', body: { workspace: state.workspace, paths: [path], message } });
  });
  if (ok) { state.commitMessage = ''; uiModule.showToast('Committed selected file'); }
}

// Draft a commit message from the staged diff using the model selected in chat.
async function _generateCommitMessage() {
  if (!state.workspace) { uiModule.showError('Select a workspace first'); return; }
  const btn = _modal && _modal.querySelector('#wgit-commit-gen');
  const label = btn && btn.querySelector('.wgit-gen-label');
  if (btn) btn.disabled = true;
  if (label) label.textContent = 'Generating…';
  let data;
  try {
    const sessionId = (sessionModule.getCurrentSessionId && sessionModule.getCurrentSessionId()) || null;
    data = await gitApi(EP.commitMessage, { method: 'POST', body: { workspace: state.workspace, sessionId } });
  } catch (err) {
    if (btn) btn.disabled = false;
    if (label) label.textContent = 'Generate';
    uiModule.showError(err.message || 'Could not generate a commit message');
    return;
  }
  if (btn) btn.disabled = false;
  if (label) label.textContent = 'Generate';
  const message = (data && data.message) || '';
  if (!message) { uiModule.showError('The model returned an empty message'); return; }
  // Replace the commit box with the fresh draft (user can edit before committing).
  state.commitMessage = message;
  const ta = _modal && _modal.querySelector('#wgit-commit-msg');
  if (ta) ta.value = message;
  _syncCommitButtons();
  if (data && data.truncated) uiModule.showToast('Message drafted (large diff was truncated)');
}

// ── Changes tab ─────────────────────────────────────────────────────────────

function _groupChanges(files) {
  const g = { conflicted: [], staged: [], unstaged: [], untracked: [] };
  for (const f of files || []) {
    if (f.index === 'unmerged' || f.worktree === 'unmerged') { g.conflicted.push(f); continue; }
    if (f.worktree === 'untracked') { g.untracked.push(f); continue; }
    if (f.index && f.index !== 'untracked') g.staged.push(f);
    if (f.worktree && f.worktree !== 'untracked') g.unstaged.push(f);
  }
  return g;
}

function _kindChip(kind) {
  const letter = KIND_LETTER[kind] || '•';
  return _h('span', {
    class: `wgit-kind is-${kind || 'other'}`,
    title: KIND_NAME[kind] || kind || 'Changed',
    text: letter,
  });
}

// One file row. `side` is 'staged' | 'unstaged' | 'untracked' | 'conflicted'.
function _changeRow(file, side) {
  const kind = side === 'staged' ? file.index : (side === 'untracked' ? 'untracked' : file.worktree);
  const selected = state.selectedPath === file.path && state.selectedStaged === (side === 'staged');
  const label = file.origPath && file.origPath !== file.path
    ? `${file.origPath} → ${file.path}`
    : file.path;

  const actions = _h('div', { class: 'wgit-row-actions' });
  const iconBtn = (cls, title, icon, onclick) => _h('button', {
    type: 'button', class: `wgit-row-btn ${cls}`, title, 'aria-label': title, unsafeHtml: icon,
    onclick: (e) => { e.stopPropagation(); onclick(); },
  });

  if (side === 'staged') {
    actions.appendChild(iconBtn('wgit-act-unstage', 'Unstage', ICON.minus, () => _unstagePaths([file.path])));
  } else if (side === 'conflicted') {
    actions.appendChild(_h('button', {
      type: 'button', class: 'wgit-row-btn wgit-act-resolve', title: 'Resolve conflict',
      text: 'Resolve', onclick: (e) => { e.stopPropagation(); state.selectedPath = file.path; _selectTab('conflicts'); },
    }));
  } else {
    actions.appendChild(iconBtn('wgit-act-stage', 'Stage', ICON.plus, () => _stagePaths([file.path])));
    actions.appendChild(iconBtn('wgit-act-discard wgit-danger', 'Discard', ICON.trash, () => _discardPaths([file.path])));
  }

  const row = _h('div', {
    class: `wgit-change-row${selected ? ' is-selected' : ''}`,
    dataset: { path: file.path, side },
    onActivate: () => _selectChange(file, side),
  }, [
    _kindChip(kind),
    _h('span', { class: 'wgit-row-path', title: label, text: label }),
    actions,
  ]);
  return row;
}

function _changeGroup(title, files, side) {
  if (!files.length) return null;
  const head = _h('div', { class: 'wgit-group-head' }, [
    _h('span', { class: 'wgit-group-title', text: title }),
    _h('span', { class: 'wgit-group-count', text: String(files.length) }),
  ]);
  // Bulk action per group.
  if (side === 'unstaged' || side === 'untracked') {
    head.appendChild(_h('button', {
      type: 'button', class: 'wgit-group-action', text: 'Stage all',
      onclick: () => _stagePaths(files.map((f) => f.path)),
    }));
  } else if (side === 'staged') {
    head.appendChild(_h('button', {
      type: 'button', class: 'wgit-group-action', text: 'Unstage all',
      onclick: () => _unstagePaths(files.map((f) => f.path)),
    }));
  }
  const group = _h('div', { class: `wgit-group wgit-group-${side}` }, [head]);
  files.forEach((f) => group.appendChild(_changeRow(f, side)));
  return group;
}

function _renderChanges(panel) {
  panel.innerHTML = '';
  const status = state.status || {};
  const groups = _groupChanges(status.files);
  const total = (status.files || []).length;

  const layout = _h('div', { class: 'wgit-changes' });
  const list = _h('div', { class: 'wgit-changes-list', id: 'wgit-changes-list' });
  if (!total) {
    list.appendChild(_h('div', { class: 'wgit-clean-note', text: 'Working tree clean.' }));
  } else {
    const blocks = [
      _changeGroup('Conflicts', groups.conflicted, 'conflicted'),
      _changeGroup('Staged', groups.staged, 'staged'),
      _changeGroup('Changes', groups.unstaged, 'unstaged'),
      _changeGroup('Untracked', groups.untracked, 'untracked'),
    ].filter(Boolean);
    blocks.forEach((b) => list.appendChild(b));
  }
  const diffPane = _h('div', { class: 'wgit-diff-pane', id: 'wgit-diff-pane' });
  layout.append(list, diffPane);

  // Commit box.
  const msg = _h('textarea', {
    class: 'wgit-commit-msg', id: 'wgit-commit-msg', rows: '2',
    placeholder: 'Commit message',
    oninput: (e) => { state.commitMessage = e.target.value; _syncCommitButtons(); },
  });
  msg.value = state.commitMessage || '';
  const commitBtn = _h('button', {
    type: 'button', class: 'confirm-btn confirm-btn-primary wgit-commit-btn', id: 'wgit-commit-btn',
    text: 'Commit', onclick: () => _commitStaged(),
  });
  const commitSelBtn = _h('button', {
    type: 'button', class: 'memory-toolbar-btn wgit-commit-selected-btn', id: 'wgit-commit-selected-btn',
    text: 'Commit selected', onclick: () => _commitSelected(),
  });
  // AI draft using the model selected in chat. Left-aligned (margin-right:auto
  // in CSS) so the commit buttons stay on the right.
  const genBtn = _h('button', {
    type: 'button', class: 'memory-toolbar-btn wgit-commit-gen', id: 'wgit-commit-gen',
    title: 'Generate a commit message with the chat model',
    onclick: () => _generateCommitMessage(),
  }, [_h('span', { class: 'wgit-gen-icon', unsafeHtml: ICON.sparkle }), _h('span', { class: 'wgit-gen-label', text: 'Generate' })]);
  const commit = _h('div', { class: 'wgit-commit' }, [
    msg,
    _h('div', { class: 'wgit-commit-actions' }, [genBtn, commitSelBtn, commitBtn]),
  ]);

  panel.append(layout, commit);
  _syncCommitButtons();

  // Restore the diff for the previously-selected file, if it still exists.
  if (state.selectedPath) {
    const still = (status.files || []).some((f) => f.path === state.selectedPath);
    if (still) _showDiff(state.selectedPath, state.selectedStaged);
    else { state.selectedPath = null; _diffHint('Select a file to view its diff.'); }
  } else {
    _diffHint('Select a file to view its diff.');
  }
}

function _syncCommitButtons() {
  if (!_modal) return;
  const status = state.status || {};
  const hasStaged = (status.files || []).some((f) => f.index && f.index !== 'untracked' && f.index !== 'unmerged');
  const msg = (state.commitMessage || '').trim();
  const commitBtn = _modal.querySelector('#wgit-commit-btn');
  const commitSelBtn = _modal.querySelector('#wgit-commit-selected-btn');
  if (commitBtn) commitBtn.disabled = !msg || !hasStaged;
  if (commitSelBtn) commitSelBtn.disabled = !msg || !state.selectedPath;
}

function _diffHint(text) {
  const pane = _modal && _modal.querySelector('#wgit-diff-pane');
  if (pane) { pane.innerHTML = ''; pane.appendChild(_h('div', { class: 'wgit-diff-hint', text })); }
}

function _selectChange(file, side) {
  if (side === 'untracked') {
    state.selectedPath = file.path;
    state.selectedStaged = false;
    _markSelectedRow();
    _diffHint('Untracked file. Stage it to start tracking, or open it in the Files tab.');
    _syncCommitButtons();
    return;
  }
  _showDiff(file.path, side === 'staged');
}

function _markSelectedRow() {
  if (!_modal) return;
  _modal.querySelectorAll('.wgit-change-row').forEach((row) => {
    const on = row.dataset.path === state.selectedPath
      && (row.dataset.side === 'staged') === !!state.selectedStaged;
    row.classList.toggle('is-selected', on);
  });
}

async function _showDiff(path, staged) {
  state.selectedPath = path;
  state.selectedStaged = !!staged;
  _markSelectedRow();
  _syncCommitButtons();
  const pane = _modal && _modal.querySelector('#wgit-diff-pane');
  if (!pane) return;
  pane.innerHTML = '';
  pane.appendChild(_h('div', { class: 'wgit-diff-hint', role: 'status', text: 'Loading diff…' }));
  let data;
  try {
    // staged='1' is truthy to the backend; '' is elided by gitApi() so the
    // backend default (staged=False) applies — see the query builder in gitApi().
    data = await gitApi(EP.diff, { query: { workspace: state.workspace, path, staged: staged ? '1' : '' } });
  } catch (err) {
    pane.innerHTML = '';
    pane.appendChild(_h('div', { class: 'wgit-diff-hint', text: err.message || 'Could not load diff' }));
    return;
  }
  if (state.selectedPath !== path || state.selectedStaged !== !!staged) return; // superseded
  _renderDiff(pane, data, path, staged);
}

function _renderDiff(pane, data, path, staged) {
  pane.innerHTML = '';
  const files = (data && data.files) || [];
  const file = files.find((f) => f.path === path) || files[0];
  const header = _h('div', { class: 'wgit-diff-head' }, [
    _h('span', { class: 'wgit-diff-path', title: path, text: path }),
    _h('span', { class: 'wgit-diff-side', text: staged ? 'Staged' : 'Working tree' }),
  ]);
  pane.appendChild(header);
  if (!file || !file.hunks || !file.hunks.length) {
    pane.appendChild(_h('div', { class: 'wgit-diff-hint', text: 'No textual diff to show.' }));
    return;
  }
  if (data.truncated) {
    pane.appendChild(_h('div', { class: 'wgit-diff-hint', text: 'Diff truncated (large file).' }));
  }
  const frag = document.createDocumentFragment();
  file.hunks.forEach((hunk) => frag.appendChild(_renderHunk(hunk, path, staged)));
  pane.appendChild(frag);
}

function _renderHunk(hunk, path, staged) {
  const headBtn = staged
    ? _h('button', {
        type: 'button', class: 'wgit-hunk-btn wgit-hunk-unstage', text: 'Unstage',
        title: 'Unstage this hunk', onclick: () => _unstageHunk(path, hunk.id),
      })
    : _h('button', {
        type: 'button', class: 'wgit-hunk-btn wgit-hunk-stage', text: 'Stage',
        title: 'Stage this hunk', onclick: () => _stageHunk(path, hunk.id),
      });
  const head = _h('div', { class: 'wgit-hunk-head' }, [
    _h('span', { class: 'wgit-hunk-header', text: hunk.header }),
    headBtn,
  ]);
  const body = _h('div', { class: 'wgit-hunk-lines' });
  (hunk.lines || []).forEach((line) => {
    const c = line[0];
    const cls = c === '+' ? 'is-add' : c === '-' ? 'is-del' : (c === '\\' ? 'is-meta' : 'is-ctx');
    body.appendChild(_h('div', { class: `wgit-diff-line ${cls}`, text: line || ' ' }));
  });
  return _h('div', { class: 'wgit-hunk' }, [head, body]);
}

// ── Files tab + editor ──────────────────────────────────────────────────────

const INDENT = '  '; // two spaces — matches the project's web sources

// Confirm before discarding unsaved editor changes. On discard, the editor is
// reverted to its last-saved content so re-entry is consistent.
async function _guardUnsaved() {
  if (!state.editor || !state.editor.dirty) return true;
  const ok = await _confirmDiscard();
  if (ok && state.editor) {
    state.editor.value = state.editor.original;
    state.editor.dirty = false;
  }
  return ok;
}

function _renderFiles(panel) {
  panel.innerHTML = '';
  const layout = _h('div', { class: 'wgit-files' }, [
    _h('div', { class: 'wgit-file-browser', id: 'wgit-file-browser' }),
    _h('div', { class: 'wgit-editor', id: 'wgit-editor' }),
  ]);
  panel.appendChild(layout);
  _renderFileBrowser();
  _renderEditor();
}

async function _renderFileBrowser() {
  const browser = _modal && _modal.querySelector('#wgit-file-browser');
  if (!browser) return;
  // Capture the requested directory so a slow response can't overwrite a newer
  // navigation (last-request-wins, mirroring the diff/blame loaders).
  const reqPath = state.filesPath || '';
  browser.innerHTML = '';
  browser.appendChild(_h('div', { class: 'wgit-file-loading', role: 'status', text: 'Loading…' }));
  let data;
  try {
    data = await gitApi(EP.files, { query: { workspace: state.workspace, path: reqPath } });
  } catch (err) {
    if ((state.filesPath || '') !== reqPath) return; // superseded by newer navigation
    browser.innerHTML = '';
    browser.appendChild(_h('div', { class: 'wgit-file-loading', text: err.message || 'Could not list files' }));
    return;
  }
  if ((state.filesPath || '') !== reqPath) return; // superseded by newer navigation
  state.filesPath = data.path || '';
  browser.innerHTML = '';
  browser.appendChild(_h('div', {
    class: 'wgit-file-crumb', title: data.path || state.workspace,
    text: data.path ? data.path : '/',
  }));
  if (data.path) {
    browser.appendChild(_h('div', {
      class: 'wgit-file-row wgit-file-up',
      onActivate: () => { state.filesPath = data.parent || ''; _renderFileBrowser(); },
    }, [
      _h('span', { class: 'wgit-file-icon', unsafeHtml: ICON.up }),
      _h('span', { class: 'wgit-file-name', text: '..' }),
    ]));
  }
  (data.dirs || []).forEach((d) => {
    browser.appendChild(_h('div', {
      class: 'wgit-file-row wgit-file-dir',
      onActivate: () => { state.filesPath = d.path; _renderFileBrowser(); },
    }, [
      _h('span', { class: 'wgit-file-icon', unsafeHtml: ICON.folder }),
      _h('span', { class: 'wgit-file-name', text: d.name }),
    ]));
  });
  (data.files || []).forEach((f) => {
    const active = state.editor && state.editor.path === f.path;
    browser.appendChild(_h('div', {
      class: `wgit-file-row wgit-file-file${active ? ' is-active' : ''}`,
      dataset: { path: f.path },
      onActivate: async () => { if (await _guardUnsaved()) _openFile(f.path); },
    }, [
      _h('span', { class: 'wgit-file-icon', unsafeHtml: ICON.file }),
      _h('span', { class: 'wgit-file-name', text: f.name }),
    ]));
  });
  if (!(data.dirs || []).length && !(data.files || []).length) {
    browser.appendChild(_h('div', { class: 'wgit-file-loading', text: 'Empty folder.' }));
  }
}

async function _openFile(path, { conflict = false } = {}) {
  let data;
  try {
    data = await gitApi(EP.file, { query: { workspace: state.workspace, path } });
  } catch (err) {
    uiModule.showError(err.message || 'Could not open file');
    return;
  }
  // Editor state machine — legal flag combinations:
  //   binary:true   → no actions, not editable, never enters 'edit' (renders a notice).
  //   conflict:true → text only; opens in 'edit' and stays there after Save until staged.
  //   editable:false (non-binary) → 'read' only; the Edit button is hidden and Save is gated.
  //   otherwise     → 'read' ⇄ 'edit' via Edit / Cancel / Escape.
  // mode is only ever 'read' | 'edit'; keep these invariants when changing modes.
  state.editor = {
    path: data.path,
    original: data.binary ? '' : (data.content || ''),
    value: data.binary ? '' : (data.content || ''),
    dirty: false,
    binary: !!data.binary,
    editable: !!data.editable && !data.binary,
    mode: conflict && !data.binary ? 'edit' : 'read',
    conflict: !!conflict,
    wrap: state.editor ? state.editor.wrap : false,
  };
  _markActiveFile();
  _renderEditor();
}

function _markActiveFile() {
  if (!_modal) return;
  const path = state.editor && state.editor.path;
  _modal.querySelectorAll('.wgit-file-file').forEach((row) => {
    row.classList.toggle('is-active', !!path && row.dataset.path === path);
  });
}

function _renderEditor() {
  const host = _modal && _modal.querySelector('#wgit-editor');
  if (!host) return;
  host.innerHTML = '';
  const ed = state.editor;
  if (!ed) {
    host.appendChild(_h('div', { class: 'wgit-editor-empty', text: 'Select a file to view or edit.' }));
    return;
  }

  const wrapToggle = () => _h('button', {
    type: 'button', class: `wgit-icon-btn wgit-wrap-toggle${ed.wrap ? ' is-on' : ''}`,
    title: 'Soft wrap', 'aria-label': 'Toggle soft wrap', 'aria-pressed': ed.wrap ? 'true' : 'false',
    unsafeHtml: ICON.wrap,
    onclick: (e) => {
      ed.wrap = !ed.wrap; _applyWrap();
      const b = e.currentTarget;
      b.classList.toggle('is-on', ed.wrap);
      b.setAttribute('aria-pressed', ed.wrap ? 'true' : 'false');
    },
  });

  const actions = _h('div', { class: 'wgit-editor-actions' });
  if (ed.binary) {
    // no actions for binary files
  } else if (ed.conflict) {
    actions.append(
      wrapToggle(),
      _h('button', {
        type: 'button', class: 'memory-toolbar-btn wgit-accept-current', text: 'Accept current',
        title: 'Keep the current side of every conflict block', onclick: () => _acceptSide('current'),
      }),
      _h('button', {
        type: 'button', class: 'memory-toolbar-btn wgit-accept-incoming', text: 'Accept incoming',
        title: 'Keep the incoming side of every conflict block', onclick: () => _acceptSide('incoming'),
      }),
      _h('button', {
        type: 'button', class: 'memory-toolbar-btn wgit-editor-save', text: 'Save',
        title: 'Save without staging', onclick: () => _saveFile(),
      }),
      _h('button', {
        type: 'button', class: 'confirm-btn confirm-btn-primary wgit-stage-resolved', text: 'Stage resolved',
        onclick: () => _stageResolved(),
      }),
    );
  } else if (ed.mode === 'read') {
    // Only offer Edit when the backend marked the file editable; otherwise show a
    // read-only indicator so the contract is honored (and _saveFile is gated too).
    if (ed.editable) {
      actions.appendChild(_h('button', {
        type: 'button', class: 'memory-toolbar-btn wgit-editor-edit', text: 'Edit',
        onclick: () => { ed.mode = 'edit'; _renderEditor(); _focusEditor(); },
      }));
    } else {
      actions.appendChild(_h('span', { class: 'wgit-editor-readonly', text: 'Read-only' }));
    }
  } else {
    actions.append(
      wrapToggle(),
      _h('button', {
        type: 'button', class: 'memory-toolbar-btn wgit-editor-cancel', text: 'Cancel',
        onclick: () => _cancelEdit(),
      }),
      _h('button', {
        type: 'button', class: 'confirm-btn confirm-btn-primary wgit-editor-save', text: 'Save',
        onclick: () => _saveFile(),
      }),
    );
  }

  host.appendChild(_h('div', { class: 'wgit-editor-head' }, [
    _h('div', { class: 'wgit-editor-title' }, [
      _h('span', { class: 'wgit-file-icon', unsafeHtml: ICON.file }),
      _h('span', { class: 'wgit-editor-path', title: ed.path, text: ed.path }),
      _h('span', { class: 'wgit-dirty-dot', title: 'Unsaved changes', text: '●', hidden: !ed.dirty }),
    ]),
    actions,
  ]));

  if (ed.binary) {
    host.appendChild(_h('div', { class: 'wgit-editor-empty', text: 'Binary file — not editable.' }));
    return;
  }

  const gutter = _h('div', { class: 'wgit-gutter', id: 'wgit-gutter', 'aria-hidden': 'true' });
  const area = _h('textarea', {
    class: 'wgit-editor-area', id: 'wgit-editor-area', spellcheck: 'false',
    autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
    wrap: ed.wrap ? 'soft' : 'off',
    readonly: ed.mode === 'read' ? '' : null,
    // Tab is captured for indentation, so advertise the Escape exit to AT and on hover.
    'aria-keyshortcuts': ed.mode === 'edit' ? 'Escape' : null,
    title: ed.mode === 'edit' ? 'Tab indents · Shift+Tab outdents · Escape exits edit mode' : null,
  });
  area.value = ed.value;
  area.addEventListener('input', () => {
    ed.value = area.value;
    // Length check short-circuits the common keystroke before the full O(n) compare.
    ed.dirty = ed.value.length !== ed.original.length || ed.value !== ed.original;
    _updateDirtyDot();
    _updateGutter(ed.value);
  });
  area.addEventListener('keydown', _editorKeydown);
  const onCursor = () => _updateCursorStatus(area);
  area.addEventListener('keyup', onCursor);
  area.addEventListener('click', onCursor);
  area.addEventListener('scroll', () => { gutter.scrollTop = area.scrollTop; });
  host.appendChild(_h('div', { class: 'wgit-editor-main' }, [gutter, area]));
  host.appendChild(_h('div', { class: 'wgit-editor-status', id: 'wgit-editor-status', text: 'Ln 1, Col 1' }));
  if (ed.mode === 'edit') {
    host.appendChild(_h('div', {
      class: 'wgit-editor-hint',
      text: 'Tab indents · Shift+Tab outdents · Esc exits edit mode',
    }));
  }

  _applyWrap();
  _updateGutter();
  _updateCursorStatus(area);
}

function _focusEditor() {
  const area = _modal && _modal.querySelector('#wgit-editor-area');
  if (area) { area.focus(); _updateCursorStatus(area); }
}

function _applyWrap() {
  const ed = state.editor;
  const area = _modal && _modal.querySelector('#wgit-editor-area');
  const main = _modal && _modal.querySelector('.wgit-editor-main');
  if (!area || !ed) return;
  area.wrap = ed.wrap ? 'soft' : 'off';
  area.style.whiteSpace = ed.wrap ? 'pre-wrap' : 'pre';
  if (main) main.classList.toggle('is-wrap', ed.wrap);
}

// Count lines without allocating (split('\n') would build an array of every line).
function _countLines(s) {
  let n = 1;
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
  return n;
}

function _updateGutter(value) {
  const gutter = _modal && _modal.querySelector('#wgit-gutter');
  const area = _modal && _modal.querySelector('#wgit-editor-area');
  if (!gutter || !area) return;
  const count = _countLines(value != null ? value : area.value);
  // Most keystrokes don't change the line count — skip the full text-node rebuild
  // (and the O(n) join) unless the count actually changed.
  if (gutter.dataset.count !== String(count)) {
    const nums = new Array(count);
    for (let i = 0; i < count; i++) nums[i] = i + 1;
    gutter.textContent = nums.join('\n');
    gutter.dataset.count = String(count);
  }
  gutter.scrollTop = area.scrollTop;
}

function _updateDirtyDot() {
  const dot = _modal && _modal.querySelector('.wgit-dirty-dot');
  if (dot) dot.hidden = !(state.editor && state.editor.dirty);
}

function _updateCursorStatus(area) {
  const status = _modal && _modal.querySelector('#wgit-editor-status');
  if (!status || !area) return;
  const pos = area.selectionStart;
  const v = area.value;
  // Walk the prefix once, counting newlines without allocating a slice + split.
  let line = 1;
  let lastNl = -1;
  for (let i = 0; i < pos; i++) {
    if (v.charCodeAt(i) === 10) { line++; lastNl = i; }
  }
  status.textContent = `Ln ${line}, Col ${pos - lastNl}`;
}

function _editorKeydown(e) {
  const ed = state.editor;
  if (!ed || ed.mode !== 'edit') return;
  const area = e.target;
  if (e.key === 'Tab') {
    e.preventDefault();
    _indent(area, e.shiftKey);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    _enterPreserveIndent(area);
  } else if (e.key === 'Escape') {
    e.preventDefault();
    _escapeEditor();
  }
}

function _indent(area, outdent) {
  const v = area.value;
  const s = area.selectionStart;
  const eend = area.selectionEnd;
  const lineStart = v.lastIndexOf('\n', s - 1) + 1;
  const multiline = v.slice(s, eend).includes('\n');
  if (!multiline && !outdent) {
    area.value = v.slice(0, s) + INDENT + v.slice(eend);
    area.selectionStart = area.selectionEnd = s + INDENT.length;
  } else {
    const before = v.slice(0, lineStart);
    const region = v.slice(lineStart, eend);
    const after = v.slice(eend);
    // A selection ending exactly at a line boundary (eend right after a '\n')
    // makes the final split element '' for the *next*, unselected line — leave it
    // untouched so indent/outdent never modifies a line the user didn't select.
    const lines = region.split('\n');
    const skipLast = lines.length > 1 && region.endsWith('\n');
    let firstDelta = 0;
    let totalDelta = 0;
    const newLines = lines.map((ln, i) => {
      if (skipLast && i === lines.length - 1) return ln;
      if (outdent) {
        let removed = 0;
        const m = ln.match(/^( {1,2}|\t)/);
        if (m) { ln = ln.slice(m[0].length); removed = m[0].length; }
        if (i === 0) firstDelta = -removed;
        totalDelta -= removed;
      } else {
        ln = INDENT + ln;
        if (i === 0) firstDelta = INDENT.length;
        totalDelta += INDENT.length;
      }
      return ln;
    });
    area.value = before + newLines.join('\n') + after;
    area.selectionStart = Math.max(lineStart, s + firstDelta);
    area.selectionEnd = eend + totalDelta;
  }
  area.dispatchEvent(new Event('input'));
}

function _enterPreserveIndent(area) {
  const v = area.value;
  const s = area.selectionStart;
  const e2 = area.selectionEnd;
  const lineStart = v.lastIndexOf('\n', s - 1) + 1;
  const indent = (v.slice(lineStart, s).match(/^[ \t]*/) || [''])[0];
  const insert = '\n' + indent;
  area.value = v.slice(0, s) + insert + v.slice(e2);
  area.selectionStart = area.selectionEnd = s + insert.length;
  area.dispatchEvent(new Event('input'));
}

async function _escapeEditor() {
  const ed = state.editor;
  if (!ed) return;
  if (ed.dirty && !(await _confirmDiscard())) { _focusEditor(); return; }
  _resetEditorToSaved(ed);
  _renderEditor();
}

function _cancelEdit() {
  const ed = state.editor;
  if (!ed) return;
  _resetEditorToSaved(ed);
  _renderEditor();
}

async function _saveFile() {
  const ed = state.editor;
  if (!ed || ed.binary || !ed.editable) return;
  const res = await _withBusy(
    () => gitApi(EP.fileSave, { method: 'POST', body: { workspace: state.workspace, path: ed.path, content: ed.value } }),
    'Could not save file',
  );
  if (!res.ok) return;
  ed.original = ed.value; ed.dirty = false;
  // Conflict files keep editing (resolution isn't finished until staged); plain
  // files return to read mode.
  if (!ed.conflict) ed.mode = 'read';
  uiModule.showToast('Saved');
  // Saving changes git status and the active file view; refresh both.
  await refreshWorkspaceGitStatus();
}

// ── Conflicts tab ───────────────────────────────────────────────────────────

// Mirrors the backend's _CONFLICT_MARKER_RE: a line that is exactly seven marker
// chars, optionally followed by a label (e.g. "<<<<<<< HEAD"). Exact-7 anchoring
// keeps legitimate content (an 8+ char "========" underline, a long "====" rule,
// or inline text) from false-positiving. The "|||||||" alternative is the
// diff3/zdiff3 base separator, so a leaked base section can't pass as resolved.
const _CONFLICT_MARKER_RE = /^(?:<{7}|\|{7}|={7}|>{7})(?:[ \t].*)?$/m;

function _hasConflictMarkers(text) {
  return _CONFLICT_MARKER_RE.test(text);
}

// Resolve every conflict block by keeping one side. `side` is 'current' (ours,
// above =======) or 'incoming' (theirs, below). Diff3/zdiff3 blocks also carry a
// `||||||| base` section between ours and =======; its base lines belong to
// NEITHER side and must be dropped — leaking them was a silent corruption bug.
function _resolveMarkers(text, side) {
  const out = [];
  let region = 'normal'; // normal | ours | base | theirs
  for (const line of text.split('\n')) {
    if (line.startsWith('<<<<<<<')) { region = 'ours'; continue; }
    if (region !== 'normal' && line.startsWith('|||||||')) { region = 'base'; continue; }
    if (region !== 'normal' && line.startsWith('=======')) { region = 'theirs'; continue; }
    if (line.startsWith('>>>>>>>')) { region = 'normal'; continue; }
    if (region === 'ours') { if (side === 'current') out.push(line); continue; }
    if (region === 'base') { continue; } // diff3 base — never kept on either side
    if (region === 'theirs') { if (side === 'incoming') out.push(line); continue; }
    out.push(line);
  }
  return out.join('\n');
}

function _acceptSide(side) {
  const ed = state.editor;
  if (!ed) return;
  const area = _modal && _modal.querySelector('#wgit-editor-area');
  const current = area ? area.value : ed.value;
  const resolved = _resolveMarkers(current, side);
  ed.value = resolved;
  ed.dirty = ed.value !== ed.original;
  if (area) area.value = resolved;
  _updateDirtyDot();
  _updateGutter();
}

async function _stageResolved() {
  const ed = state.editor;
  if (!ed) return;
  if (_hasConflictMarkers(ed.value)) {
    uiModule.showError('Conflict markers remain — resolve every block first.');
    return;
  }
  const res = await _withBusy(
    // `stage: true` documents intent; the resolve endpoint always stages, so it is
    // not a toggle the backend reads — staging is intrinsic to resolving.
    () => gitApi(EP.conflictResolve, {
      method: 'POST',
      body: { workspace: state.workspace, path: ed.path, content: ed.value, stage: true },
    }),
    'Could not stage resolution',
  );
  if (!res.ok) return;
  uiModule.showToast('Marked resolved');
  state.editor = null; // resolution complete; close the editor surface
  await refreshWorkspaceGitStatus(); // refreshes status; conflicts list rebuilds
}

function _renderConflicts(panel) {
  panel.innerHTML = '';
  const layout = _h('div', { class: 'wgit-conflicts' }, [
    _h('div', { class: 'wgit-conflict-list', id: 'wgit-conflict-list' }, [
      _h('div', { class: 'wgit-file-loading', role: 'status', text: 'Loading…' }),
    ]),
    _h('div', { class: 'wgit-editor', id: 'wgit-editor' }),
  ]);
  panel.appendChild(layout);
  // Show the editor surface only for an actively-open conflict file; otherwise a
  // hint. A non-conflict editor (open in the Files tab) is left untouched.
  if (state.editor && state.editor.conflict) {
    _renderEditor();
  } else {
    const host = panel.querySelector('#wgit-editor');
    host.appendChild(_h('div', { class: 'wgit-editor-empty', text: 'Select a conflicted file to resolve.' }));
  }
  _loadConflicts();
}

async function _loadConflicts() {
  const list = _modal && _modal.querySelector('#wgit-conflict-list');
  if (!list) return;
  const reqWorkspace = state.workspace;
  let data;
  try {
    data = await gitApi(EP.conflicts, { query: { workspace: state.workspace } });
  } catch (err) {
    if (state.workspace !== reqWorkspace || state.activeTab !== 'conflicts') return; // superseded
    list.innerHTML = '';
    list.appendChild(_h('div', { class: 'wgit-file-loading', text: err.message || 'Could not load conflicts' }));
    return;
  }
  if (state.workspace !== reqWorkspace || state.activeTab !== 'conflicts') return; // superseded
  list.innerHTML = '';
  const files = data.files || [];
  if (!files.length) {
    list.appendChild(_h('div', { class: 'wgit-clean-note', text: 'No conflicts.' }));
    return;
  }
  if (data.truncated) {
    list.appendChild(_h('div', { class: 'wgit-file-loading', text: 'List truncated (many files scanned).' }));
  }
  files.forEach((f) => {
    const active = state.editor && state.editor.path === f.path;
    list.appendChild(_h('div', {
      class: `wgit-file-row wgit-conflict-row${active ? ' is-active' : ''}`,
      dataset: { path: f.path },
      onActivate: async () => { if (await _guardUnsaved()) _openConflictFile(f.path); },
    }, [
      _h('span', { class: 'wgit-file-icon', unsafeHtml: ICON.file }),
      _h('span', { class: 'wgit-file-name', title: f.path, text: f.path }),
    ]));
  });
}

async function _openConflictFile(path) {
  await _openFile(path, { conflict: true });
  _markActiveConflict();
}

function _markActiveConflict() {
  if (!_modal) return;
  const path = state.editor && state.editor.path;
  _modal.querySelectorAll('.wgit-conflict-row').forEach((row) => {
    row.classList.toggle('is-active', !!path && row.dataset.path === path);
  });
}

// ── Clone, init, and remote actions ─────────────────────────────────────────

// Shown only in clone/init helper text.
const DOCKER_HINT = 'In Docker, choose a mounted path for persistence.';

function _firstLine(text) {
  const line = String(text || '').split('\n').map((s) => s.trim()).find(Boolean) || '';
  return line.length > 80 ? line.slice(0, 79) + '…' : line;
}

async function _remoteAction(action) {
  if (!state.workspace) { uiModule.showError('Select a workspace first'); return; }
  const res = await _withBusy(
    () => gitApi(EP[action], { method: 'POST', body: { workspace: state.workspace } }),
    `${action} failed`,
  );
  if (!res.ok) return;
  const verb = action.charAt(0).toUpperCase() + action.slice(1);
  const out = _firstLine(res.data && res.data.output);
  uiModule.showToast(out ? `${verb}: ${out}` : `${verb} complete`);
  await refreshWorkspaceGitStatus();
}

async function _initRepo() {
  if (!state.workspace) { uiModule.showError('Select a workspace first'); return; }
  const ok = await uiModule.styledConfirm(
    `Initialize a git repository in "${_basename(state.workspace)}"? ${DOCKER_HINT}`,
    { confirmText: 'Initialize', cancelText: 'Cancel' },
  );
  if (!ok) return;
  const res = await _withBusy(
    () => gitApi(EP.init, { method: 'POST', body: { workspace: state.workspace } }),
    'Could not initialize repository',
  );
  if (!res.ok) return;
  uiModule.showToast('Initialized repository');
  await refreshWorkspaceGitStatus();
}

let _cloneModal = null;

function _getCloneModal() {
  if (_cloneModal) return _cloneModal;
  _cloneModal = document.createElement('div');
  _cloneModal.id = 'workspace-git-clone-modal';
  _cloneModal.className = 'modal';
  _cloneModal.style.display = 'none';
  const field = (labelText, id, placeholder) => _h('label', { class: 'wgit-clone-field' }, [
    _h('span', { class: 'wgit-clone-label', text: labelText }),
    _h('input', { type: 'text', id, class: 'styled-prompt-input', spellcheck: 'false',
      autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', placeholder }),
  ]);
  const content = _h('div', { class: 'modal-content wgit-clone-content' }, [
    _h('div', { class: 'modal-header' }, [
      _h('h4', { text: 'Clone repository' }),
      _h('button', { class: 'close-btn', 'aria-label': 'Close', unsafeHtml: ICON.close, onclick: () => _closeCloneDialog() }),
    ]),
    _h('div', { class: 'modal-body wgit-clone-body' }, [
      field('Repository URL', 'wgit-clone-url', 'https://… or git@…'),
      field('Target parent (optional)', 'wgit-clone-target', 'Defaults to the standard clone folder'),
      field('Folder name (optional)', 'wgit-clone-name', 'Defaults to the repository name'),
      _h('p', { class: 'wgit-clone-hint', text: DOCKER_HINT }),
      _h('p', { class: 'wgit-clone-error', id: 'wgit-clone-error', hidden: true }),
    ]),
    _h('div', { class: 'modal-footer' }, [
      _h('button', { type: 'button', class: 'confirm-btn confirm-btn-secondary', text: 'Cancel', onclick: () => _closeCloneDialog() }),
      _h('button', { type: 'button', class: 'confirm-btn confirm-btn-primary wgit-clone-submit', id: 'wgit-clone-submit', text: 'Clone', onclick: () => _doClone() }),
    ]),
  ]);
  _cloneModal.appendChild(content);
  document.body.appendChild(_cloneModal);
  _cloneModal.addEventListener('click', (e) => { if (e.target === _cloneModal) _closeCloneDialog(); });
  _cloneModal.querySelector('#wgit-clone-url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); _doClone(); }
  });
  const header = content.querySelector('.modal-header');
  if (header) makeWindowDraggable(_cloneModal, { content, header });
  return _cloneModal;
}

function _openCloneDialog() {
  const modal = _getCloneModal();
  ['wgit-clone-url', 'wgit-clone-target', 'wgit-clone-name'].forEach((id) => {
    const inp = modal.querySelector('#' + id); if (inp) inp.value = '';
  });
  _cloneError('');
  modal.style.display = 'flex';
  const url = modal.querySelector('#wgit-clone-url');
  if (url) requestAnimationFrame(() => url.focus());
}

function _closeCloneDialog() {
  if (_cloneModal) _cloneModal.style.display = 'none';
}

function _cloneError(message) {
  const el = _cloneModal && _cloneModal.querySelector('#wgit-clone-error');
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
}

async function _doClone() {
  const modal = _getCloneModal();
  const url = (modal.querySelector('#wgit-clone-url').value || '').trim();
  const target = (modal.querySelector('#wgit-clone-target').value || '').trim();
  const name = (modal.querySelector('#wgit-clone-name').value || '').trim();
  if (!url) { _cloneError('Enter a repository URL.'); return; }
  _cloneError('');
  const submit = modal.querySelector('#wgit-clone-submit');
  if (submit) { submit.disabled = true; submit.textContent = 'Cloning…'; }
  let data;
  try {
    data = await gitApi(EP.clone, {
      method: 'POST',
      body: { workspace: state.workspace || null, url, target: target || null, name: name || null },
    });
  } catch (err) {
    if (submit) { submit.disabled = false; submit.textContent = 'Clone'; }
    _cloneError(err.message || 'Clone failed');
    return;
  }
  if (submit) { submit.disabled = false; submit.textContent = 'Clone'; }
  _closeCloneDialog();
  // Adopt the cloned repo as the active workspace, then refresh the panel.
  if (data && data.path) {
    if (workspaceModule.setWorkspace) workspaceModule.setWorkspace(data.path);
    state.workspace = data.path;
    _syncHeader();
  }
  uiModule.showToast('Repository cloned');
  await refreshWorkspaceGitStatus();
}

// ── History tab ─────────────────────────────────────────────────────────────

// Two scopes: 'file' follows the selected file (falling back to repo history when
// nothing is selected), 'repo' forces whole-repo history.
let _historyScope = 'file';
let _selectedCommit = null;

function _shortSha(sha) { return (sha || '').slice(0, 7); }

function _relativeTime(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso || '';
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

function _historyPath() {
  if (_historyScope === 'repo') return null;
  return state.selectedPath || null; // 'auto' and 'file' both follow selection
}

// ── Commit graph: lane layout ───────────────────────────────────────────────
// A bounded multi-lane DAG. Lanes are reused as branches end; the count is
// capped so a pathological repo can never blow out the gutter — overflow folds
// into the last lane. Pure data in, pure data out: no DOM and no theme
// knowledge (colors are applied later via .wgit-lane-{n} classes in CSS).
const MAX_LANES = 8;
const LANE_COLORS = 8; // palette size; colorIndex = lane % LANE_COLORS

function _firstFreeLane(lanes) {
  for (let i = 0; i < lanes.length; i++) if (lanes[i] == null) return i;
  if (lanes.length < MAX_LANES) return lanes.length;
  return MAX_LANES - 1; // cap reached: fold overflow into the last lane
}

// Allocate a lane per commit (newest-first) and emit the inter-row edge
// segments needed to draw the rail. Returns { nodes, segments, usedLanes }:
//   nodes:    [{ row, lane, colorIndex, sha, isHead }]
//   segments: [{ row, topLane, bottomLane, colorIndex }]  (row = gap below `row`)
function _computeGraph(commits) {
  const lanes = [];        // frontier: lanes[k] = sha that lane k expects next
  const nodes = [];
  const frontiers = [];    // per row: active lanes in the gap below it

  commits.forEach((commit, row) => {
    const parents = commit.parents || [];
    let myLane = lanes.indexOf(commit.sha);
    if (myLane === -1) myLane = _firstFreeLane(lanes);
    lanes[myLane] = null;  // resolved at this row

    // Multi-child merge: free any *other* lane that was also waiting for us.
    for (let k = 0; k < lanes.length; k++) {
      if (k !== myLane && lanes[k] === commit.sha) lanes[k] = null;
    }

    // First parent keeps this lane; extra (merge) parents take other lanes.
    const parentLanes = [];
    parents.forEach((parentSha, idx) => {
      let pLane = myLane;
      if (idx > 0) {
        pLane = lanes.indexOf(parentSha);
        if (pLane === -1) pLane = _firstFreeLane(lanes);
      }
      lanes[pLane] = parentSha;
      parentLanes.push(pLane);
    });

    const isHead = (commit.refs || []).some((r) => r.type === 'head' && r.current);
    nodes.push({ row, lane: myLane, colorIndex: myLane % LANE_COLORS, sha: commit.sha, isHead });

    const snap = [];
    for (let k = 0; k < lanes.length; k++) {
      if (lanes[k] == null) continue;
      snap.push({ lane: k, sha: lanes[k], fromNode: (k === myLane) || parentLanes.includes(k) });
    }
    frontiers.push(snap);
  });

  // Second pass: with both gap endpoints known, route each lane's segment —
  // straight where it passes through, bending into a node where it converges.
  const segments = [];
  for (let i = 0; i < frontiers.length; i++) {
    const next = commits[i + 1];
    for (const entry of frontiers[i]) {
      const topLane = entry.fromNode ? nodes[i].lane : entry.lane;
      let bottomLane = entry.lane;
      if (next && next.sha === entry.sha && nodes[i + 1].lane !== entry.lane) {
        bottomLane = nodes[i + 1].lane; // converge into the next node
      }
      segments.push({ row: i, topLane, bottomLane, colorIndex: entry.lane % LANE_COLORS });
    }
  }

  let usedLanes = 1;
  for (const n of nodes) usedLanes = Math.max(usedLanes, n.lane + 1);
  for (const s of segments) usedLanes = Math.max(usedLanes, s.topLane + 1, s.bottomLane + 1);
  return { nodes, segments, usedLanes };
}

function _renderHistory(panel) {
  panel.innerHTML = '';
  const path = _historyPath();
  const scopeRow = _h('div', { class: 'wgit-scope' }, [
    _h('button', {
      type: 'button', class: `wgit-scope-btn${!path ? ' is-on' : ''}`, text: 'Repository',
      onclick: () => { _historyScope = 'repo'; _selectedCommit = null; _renderHistory(panel); },
    }),
    state.selectedPath
      ? _h('button', {
          type: 'button', class: `wgit-scope-btn${path ? ' is-on' : ''}`,
          title: state.selectedPath, text: _basename(state.selectedPath),
          onclick: () => { _historyScope = 'file'; _selectedCommit = null; _renderHistory(panel); },
        })
      : null,
  ]);
  const layout = _h('div', { class: 'wgit-history' }, [
    _h('div', { class: 'wgit-history-list', id: 'wgit-history-list' }, [
      _h('div', { class: 'wgit-file-loading', role: 'status', text: 'Loading…' }),
    ]),
    _h('div', { class: 'wgit-commit-detail', id: 'wgit-commit-detail' }, [
      _h('div', { class: 'wgit-diff-hint', text: 'Select a commit to view its details.' }),
    ]),
  ]);
  panel.append(scopeRow, layout);
  _loadHistory(path);
}

async function _loadHistory(path) {
  const list = _modal && _modal.querySelector('#wgit-history-list');
  if (!list) return;
  let data;
  try {
    data = await gitApi(EP.history, { query: { workspace: state.workspace, path: path || '', limit: 100 } });
  } catch (err) {
    if (_historyPath() !== path) return; // superseded by a newer scope/selection
    list.innerHTML = '';
    list.appendChild(_h('div', { class: 'wgit-file-loading', text: err.message || 'Could not load history' }));
    return;
  }
  if (_historyPath() !== path) return; // superseded by a newer scope/selection
  list.innerHTML = '';
  const commits = data.commits || [];
  if (!commits.length) {
    list.appendChild(_h('div', { class: 'wgit-file-loading', text: 'No commits yet.' }));
    return;
  }
  commits.forEach((c) => {
    const row = _h('div', {
      class: `wgit-commit-row${_selectedCommit && _selectedCommit.sha === c.sha ? ' is-selected' : ''}`,
      dataset: { sha: c.sha },
      onActivate: () => _showCommitDetail(c),
    }, [
      _h('div', { class: 'wgit-commit-subject', title: c.message, text: c.message || '(no message)' }),
      _h('div', { class: 'wgit-commit-meta' }, [
        _h('span', { class: 'wgit-commit-sha', text: _shortSha(c.sha) }),
        _h('span', { class: 'wgit-commit-author', text: c.author || '' }),
        _h('span', { class: 'wgit-commit-date', title: c.date || '', text: _relativeTime(c.date) }),
      ]),
    ]);
    list.appendChild(row);
  });
}

// Read-only commit view. The backend exposes commit metadata (not a per-commit
// file diff), so this surface shows the full commit details and never offers
// edit/stage controls.
function _showCommitDetail(commit) {
  _selectedCommit = commit;
  if (_modal) {
    _modal.querySelectorAll('.wgit-commit-row').forEach((r) => {
      r.classList.toggle('is-selected', r.dataset.sha === commit.sha);
    });
  }
  const pane = _modal && _modal.querySelector('#wgit-commit-detail');
  if (!pane) return;
  pane.innerHTML = '';
  pane.append(
    _h('div', { class: 'wgit-commit-detail-head' }, [
      _h('span', { class: 'wgit-commit-detail-sha', text: _shortSha(commit.sha) }),
      _h('span', { class: 'wgit-commit-detail-ro', text: 'Read-only' }),
    ]),
    _h('div', { class: 'wgit-commit-detail-subject', text: commit.message || '(no message)' }),
    _h('dl', { class: 'wgit-commit-detail-meta' }, [
      _h('dt', { text: 'Author' }),
      _h('dd', { text: `${commit.author || ''}${commit.email ? ` <${commit.email}>` : ''}` }),
      _h('dt', { text: 'Date' }),
      _h('dd', { text: commit.date || '' }),
      _h('dt', { text: 'Commit' }),
      _h('dd', { class: 'wgit-mono', text: commit.sha || '' }),
    ]),
  );
}

// ── Blame tab ───────────────────────────────────────────────────────────────

function _renderBlame(panel) {
  panel.innerHTML = '';
  if (!state.selectedPath) {
    panel.appendChild(_h('div', { class: 'wgit-empty' }, [
      _h('p', { class: 'wgit-empty-title', text: 'No file selected' }),
      _h('p', { class: 'wgit-empty-sub', text: 'Select a text file in Changes or Files to see line-by-line blame.' }),
    ]));
    return;
  }
  panel.appendChild(_h('div', { class: 'wgit-blame-head' }, [
    _h('span', { class: 'wgit-blame-path', title: state.selectedPath, text: state.selectedPath }),
  ]));
  const body = _h('div', { class: 'wgit-blame', id: 'wgit-blame' }, [
    _h('div', { class: 'wgit-file-loading', role: 'status', text: 'Loading blame…' }),
  ]);
  panel.appendChild(body);
  _loadBlame(state.selectedPath, body);
}

async function _loadBlame(path, body) {
  let data;
  try {
    data = await gitApi(EP.blame, { query: { workspace: state.workspace, path } });
  } catch (err) {
    body.innerHTML = '';
    body.appendChild(_h('div', { class: 'wgit-file-loading', text: err.message || 'Could not load blame' }));
    return;
  }
  if (state.selectedPath !== path) return; // selection changed while loading
  body.innerHTML = '';
  const lines = data.lines || [];
  if (!lines.length) {
    body.appendChild(_h('div', { class: 'wgit-file-loading', text: 'No blame data.' }));
    return;
  }
  // Build into a fragment and insert once — a 1 MB file is ~20k lines × 5 nodes,
  // so per-row appends to the live tree would thrash layout.
  const frag = document.createDocumentFragment();
  lines.forEach((ln, i) => {
    const sha = String(ln.sha || '');
    // git uses an all-zero SHA for lines not in any commit yet.
    const uncommitted = /^0+$/.test(sha);
    frag.appendChild(_h('div', { class: `wgit-blame-row${uncommitted ? ' is-uncommitted' : ''}` }, [
      _h('span', { class: 'wgit-blame-num', text: String(i + 1) }),
      _h('span', {
        class: 'wgit-blame-sha',
        title: uncommitted ? 'Uncommitted — not in any commit yet' : sha,
        text: uncommitted ? 'U' : _shortSha(sha),
      }),
      _h('span', { class: 'wgit-blame-author', title: ln.author || '', text: uncommitted ? 'Uncommitted' : (ln.author || '') }),
      _h('span', { class: 'wgit-blame-text', text: ln.text != null ? ln.text : '' }),
    ]));
  });
  body.appendChild(frag);
}

function _syncHeader() {
  if (!_modal) return;
  const nameEl = _modal.querySelector('#wgit-ws-name');
  if (nameEl) {
    nameEl.textContent = state.workspace ? _basename(state.workspace) : 'No workspace';
    nameEl.title = state.workspace || 'Select a workspace folder first';
  }
}

const _BADGE_LABEL = {
  nongit: 'Not a repo',
  clean: 'Clean',
  changed: 'Changed',
  conflicted: 'Conflicts',
  ahead: 'Ahead',
  behind: 'Behind',
};

function _setBadge(kind) {
  if (!_modal) return;
  const badge = _modal.querySelector('#wgit-repo-badge');
  if (!badge) return;
  badge.className = 'wgit-badge';
  if (!kind) { badge.hidden = true; badge.textContent = ''; return; }
  badge.hidden = false;
  badge.classList.add(`is-${kind}`);
  badge.textContent = _BADGE_LABEL[kind] || kind;
}

function _setBranch(text, ahead = 0, behind = 0) {
  if (!_modal) return;
  const nameEl = _modal.querySelector('.wgit-branch-name');
  if (!nameEl) return;
  let label = text || '—';
  if (ahead) label += ` ↑${ahead}`;
  if (behind) label += ` ↓${behind}`;
  nameEl.textContent = label;
  nameEl.title = text || '';
}

function _setBusy(on) {
  if (!_modal) return;
  // aria-busy lets assistive tech announce in-flight work; disabling the toolbar
  // buttons also debounces fetch/pull/push so a double-click can't fire concurrent
  // remote operations.
  _modal.setAttribute('aria-busy', on ? 'true' : 'false');
  _modal.querySelectorAll('.wgit-icon-btn').forEach((b) => {
    b.classList.toggle('is-busy', !!on);
    b.disabled = !!on;
  });
}

// Reduce a /status payload to the dominant repo-state badge.
function _statusBadgeKind(status) {
  if (!status) return null;
  const files = status.files || [];
  if (files.some((f) => f.index === 'unmerged' || f.worktree === 'unmerged')) return 'conflicted';
  if (files.length) return 'changed';
  if (status.ahead) return 'ahead';
  if (status.behind) return 'behind';
  return 'clean';
}

function _applyStatusToHeader(status) {
  _setBadge(_statusBadgeKind(status));
  _setBranch(status.branch || '(detached)', status.ahead || 0, status.behind || 0);
}

// ── Branch switcher ─────────────────────────────────────────────────────────
// The menu is portaled to document.body and positioned fixed: the modal-content
// carries a transform (open animation) + overflow:auto, which would otherwise
// clip a dropdown rendered inside it.

let _branchMenuEl = null;
let _branchMenuCleanup = null;

function _setBranchButtonEnabled(on) {
  const btn = _modal && _modal.querySelector('#wgit-branch-btn');
  if (btn) btn.disabled = !on;
}

function _toggleBranchMenu() {
  if (state.branchMenuOpen) _closeBranchMenu();
  else _openBranchMenu();
}

async function _openBranchMenu() {
  if (!state.workspace || (state.error && state.error.code)) return;
  state.branchMenuOpen = true;
  state.branchFilter = '';
  const btn = _modal && _modal.querySelector('#wgit-branch-btn');
  if (btn) btn.setAttribute('aria-expanded', 'true');
  _renderBranchMenu();
  const onDocDown = (e) => {
    if (_branchMenuEl && !_branchMenuEl.contains(e.target) && !(btn && btn.contains(e.target))) _closeBranchMenu();
  };
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); _closeBranchMenu(); if (btn) btn.focus(); } };
  const onReflow = () => _positionBranchMenu();
  const scroller = _modal && _modal.querySelector('.modal-content');
  document.addEventListener('mousedown', onDocDown, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', onReflow, true);
  if (scroller) scroller.addEventListener('scroll', onReflow, true);
  _branchMenuCleanup = () => {
    document.removeEventListener('mousedown', onDocDown, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onReflow, true);
    if (scroller) scroller.removeEventListener('scroll', onReflow, true);
  };
  if (!state.branches) await _loadBranches();
}

function _closeBranchMenu() {
  state.branchMenuOpen = false;
  const btn = _modal && _modal.querySelector('#wgit-branch-btn');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (_branchMenuCleanup) { _branchMenuCleanup(); _branchMenuCleanup = null; }
  if (_branchMenuEl) { _branchMenuEl.remove(); _branchMenuEl = null; }
}

async function _loadBranches() {
  try {
    state.branches = await gitApi(EP.branches, { query: { workspace: state.workspace } });
  } catch (err) {
    state.branches = { error: err.message || 'Could not load branches', local: [], remote: [] };
  }
  if (state.branchMenuOpen) _renderBranchList();
}

function _positionBranchMenu() {
  if (!_branchMenuEl) return;
  const btn = _modal && _modal.querySelector('#wgit-branch-btn');
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  const width = Math.max(260, Math.round(r.width));
  let left = r.left;
  const maxLeft = window.innerWidth - width - 8;
  if (left > maxLeft) left = Math.max(8, maxLeft);
  _branchMenuEl.style.left = `${left}px`;
  _branchMenuEl.style.top = `${Math.round(r.bottom + 4)}px`;
  _branchMenuEl.style.width = `${width}px`;
}

function _remoteLocalName(name) {
  const parts = String(name).split('/');
  return parts.length > 1 ? parts.slice(1).join('/') : name;
}

function _branchRows() {
  const b = state.branches || {};
  const current = b.current || (state.status && state.status.branch) || '';
  const q = (state.branchFilter || '').trim().toLowerCase();
  const matches = (name) => !q || String(name).toLowerCase().includes(q);
  const local = (b.local || []).filter((it) => it.name !== current && matches(it.name));
  const remote = (b.remote || [])
    .filter((it) => it.name && it.name.includes('/') && !it.name.endsWith('/HEAD') && matches(it.name));
  return { current, local, remote, query: q };
}

function _renderBranchMenu() {
  if (!state.branchMenuOpen) return;
  if (!_branchMenuEl) {
    _branchMenuEl = _h('div', { class: 'wgit-branch-menu', id: 'wgit-branch-menu', role: 'menu' });
    document.body.appendChild(_branchMenuEl);
  }
  const el = _branchMenuEl;
  el.innerHTML = '';
  const search = _h('input', {
    type: 'text', class: 'wgit-branch-search', id: 'wgit-branch-search',
    placeholder: 'Switch or create branch…', spellcheck: 'false', autocomplete: 'off',
  });
  search.value = state.branchFilter || '';
  search.addEventListener('input', () => { state.branchFilter = search.value; _renderBranchList(); });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); _closeBranchMenu(); return; }
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const rows = _branchRows();
    const firstLocal = rows.local[0];
    const firstRemote = rows.remote[0];
    if (firstLocal) _checkoutBranch(firstLocal.name, 'local');
    else if (firstRemote) _checkoutBranch(firstRemote.name, 'remote');
    else if (rows.query) _createBranch(search.value.trim());
  });
  el.appendChild(_h('div', { class: 'wgit-branch-search-wrap' }, [search]));
  el.appendChild(_h('div', { class: 'wgit-branch-list', id: 'wgit-branch-list' }));
  _positionBranchMenu();
  _renderBranchList();
  requestAnimationFrame(() => { const s = document.getElementById('wgit-branch-search'); if (s) s.focus(); });
}

function _renderBranchList() {
  const list = _branchMenuEl && _branchMenuEl.querySelector('#wgit-branch-list');
  if (!list) return;
  list.innerHTML = '';
  const b = state.branches;
  if (!b) { list.appendChild(_h('div', { class: 'wgit-branch-empty', text: 'Loading…' })); return; }
  if (b.error) { list.appendChild(_h('div', { class: 'wgit-branch-empty', text: b.error })); return; }
  const rows = _branchRows();

  const section = (title, items, mode) => {
    if (!items.length) return;
    list.appendChild(_h('div', { class: 'wgit-branch-section-title', text: title }));
    items.forEach((it) => {
      // Keep rows readable: show only divergence (↑/↓), not the (usually
      // redundant) full upstream ref which would crowd out the branch name.
      const meta = [];
      if (it.ahead) meta.push(`↑${it.ahead}`);
      if (it.behind) meta.push(`↓${it.behind}`);
      list.appendChild(_h('button', {
        type: 'button', class: 'wgit-branch-item', role: 'menuitem',
        onclick: () => _checkoutBranch(it.name, mode),
      }, [
        _h('span', { class: 'wgit-branch-check' }),
        _h('span', { class: 'wgit-branch-item-name', title: it.name, text: it.name }),
        meta.length ? _h('span', { class: 'wgit-branch-item-meta', text: meta.join(' ') }) : null,
      ]));
    });
  };

  if (rows.current && (!rows.query || rows.current.toLowerCase().includes(rows.query))) {
    list.appendChild(_h('div', { class: 'wgit-branch-section-title', text: 'Current' }));
    list.appendChild(_h('div', { class: 'wgit-branch-item is-current' }, [
      _h('span', { class: 'wgit-branch-check', unsafeHtml: ICON.check }),
      _h('span', { class: 'wgit-branch-item-name', text: rows.current }),
    ]));
  }
  section('Local branches', rows.local, 'local');
  section('Remote branches', rows.remote, 'remote');

  const name = (state.branchFilter || '').trim();
  if (name) {
    const exists = rows.current === name
      || (b.local || []).some((it) => it.name === name)
      || (b.remote || []).some((it) => _remoteLocalName(it.name) === name);
    if (!exists) {
      list.appendChild(_h('button', {
        type: 'button', class: 'wgit-branch-create', onclick: () => _createBranch(name),
      }, [`Create branch “${name}”`]));
    }
  }

  if (!list.children.length) {
    list.appendChild(_h('div', { class: 'wgit-branch-empty', text: 'No branches' }));
  }
}

async function _checkoutBranch(ref, mode) {
  if (!(await _guardUnsaved())) return;
  // Remote refs (origin/foo) check out as their local tracking name; git creates
  // the tracking branch automatically when exactly one remote has it.
  const target = mode === 'remote' ? _remoteLocalName(ref) : ref;
  _closeBranchMenu();
  _setBusy(true);
  let data;
  try {
    // Seamless per-branch switch: auto-parks the current branch's uncommitted
    // changes (tagged to that branch) and restores the target branch's
    // previously-parked changes on arrival. See git_checkout (backend).
    data = await gitApi(EP.checkoutStash, { method: 'POST', body: { workspace: state.workspace, branch: target } });
  } catch (err) {
    _setBusy(false);
    uiModule.showError(err.message || 'Could not switch branch');
    return;
  }
  _setBusy(false);
  const note = [];
  if (data && data.stashed) note.push('parked your changes');
  if (data && data.restored) note.push('restored changes here');
  if (data && data.restoreFailed) note.push('restore conflict — check git stash');
  _afterBranchChange(target, note.length ? ` · ${note.join(' · ')}` : '');
}

async function _createBranch(name) {
  name = String(name || '').trim();
  if (!name) return;
  if (!(await _guardUnsaved())) return;
  _closeBranchMenu();
  _setBusy(true);
  let data;
  try {
    data = await gitApi(EP.branchCreate, { method: 'POST', body: { workspace: state.workspace, branch: name } });
  } catch (err) {
    _setBusy(false);
    uiModule.showError(err.message || 'Could not create branch');
    return;
  }
  _setBusy(false);
  _afterBranchChange((data && data.branch) || name, ' · created');
}

// After any branch change the working tree differs: drop the open file/diff so
// nothing stale lingers, then refresh status (which re-renders the active tab).
function _afterBranchChange(branch, note) {
  state.editor = null;
  state.selectedPath = null;
  uiModule.showToast(`Switched to ${branch}${note || ''}`);
  refreshWorkspaceGitStatus();
}

// ── Public API ──────────────────────────────────────────────────────────────

let _inited = false;

export function initWorkspaceGitPanel() {
  // app.js wires init from two startup paths; bind the trigger only once.
  if (_inited) return;
  const trigger = document.getElementById('workspace-git-panel-btn');
  if (!trigger) return;
  trigger.addEventListener('click', () => openWorkspaceGitPanel());
  _inited = true;
}

export function openWorkspaceGitPanel() {
  const modal = _getModal();
  _lastFocus = document.activeElement; // restore focus here on close
  state.workspace = workspaceModule.getWorkspace ? workspaceModule.getWorkspace() : '';
  _syncHeader();
  modal.style.display = 'flex';
  _selectTab(state.activeTab);
  // Move focus into the dialog so keyboard/AT users land inside it, not on the
  // now-hidden trigger menu.
  const closeBtn = modal.querySelector('#workspace-git-close');
  if (closeBtn) requestAnimationFrame(() => closeBtn.focus());
  refreshWorkspaceGitStatus();
}

export async function closeWorkspaceGitPanel() {
  if (!(await _guardUnsaved())) return;
  _closeBranchMenu();
  if (_modal) _modal.style.display = 'none';
  // Return focus to whatever opened the panel (typically the Git trigger button).
  if (_lastFocus && typeof _lastFocus.focus === 'function') _lastFocus.focus();
  _lastFocus = null;
}

// Re-read the active workspace, fetch /status, update the header, and re-render
// the active tab. Called on open and after save/stage/commit/checkout/clone/init.
export async function refreshWorkspaceGitStatus() {
  if (!_modal) return;
  state.workspace = workspaceModule.getWorkspace ? workspaceModule.getWorkspace() : '';
  _syncHeader();
  // A status refresh invalidates the cached branch list and closes the menu.
  state.branches = null;
  _closeBranchMenu();
  if (!state.workspace) {
    state.status = null;
    state.error = { code: 'invalid_workspace', message: 'No workspace selected' };
    _setBadge(null);
    _setBranch('—');
    _setBranchButtonEnabled(false);
    _renderActiveTab();
    return;
  }
  state.loading = true;
  _setBusy(true);
  try {
    const data = await gitApi(EP.status, { query: { workspace: state.workspace } });
    state.status = data;
    state.error = null;
    _applyStatusToHeader(data);
    _setBranchButtonEnabled(true);
  } catch (err) {
    state.status = null;
    state.error = { code: err.code, message: err.message };
    _setBadge(err.code === 'not_git_repo' ? 'nongit' : null);
    _setBranch('—');
    _setBranchButtonEnabled(false);
  } finally {
    state.loading = false;
    _setBusy(false);
    _renderActiveTab();
  }
}

export default {
  initWorkspaceGitPanel,
  openWorkspaceGitPanel,
  closeWorkspaceGitPanel,
  refreshWorkspaceGitStatus,
};
