"""Static contract tests for the workspace git frontend skeleton.

These tests assert file existence and structural invariants without running a browser.
"""

from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def read(rel):
    return (REPO / rel).read_text(encoding='utf-8')


# ---------------------------------------------------------------------------
# workspaceGit.js — existence and exported symbols
# ---------------------------------------------------------------------------

def test_workspace_git_js_exists():
    assert (REPO / 'static/js/workspaceGit.js').exists(), (
        'static/js/workspaceGit.js does not exist'
    )


def test_workspace_git_exports_init():
    src = read('static/js/workspaceGit.js')
    assert 'export function initWorkspaceGitPanel' in src, (
        'initWorkspaceGitPanel is not exported from workspaceGit.js'
    )


def test_workspace_git_exports_open():
    src = read('static/js/workspaceGit.js')
    assert 'export function openWorkspaceGitPanel' in src, (
        'openWorkspaceGitPanel is not exported from workspaceGit.js'
    )


def test_workspace_git_exports_refresh():
    src = read('static/js/workspaceGit.js')
    assert ('export function refreshWorkspaceGitStatus' in src
            or 'export async function refreshWorkspaceGitStatus' in src), (
        'refreshWorkspaceGitStatus is not exported from workspaceGit.js'
    )


# ---------------------------------------------------------------------------
# app.js — import and initialisation
# ---------------------------------------------------------------------------

def test_app_js_imports_workspace_git():
    src = read('static/app.js')
    assert "from './js/workspaceGit.js'" in src, (
        "app.js does not import from './js/workspaceGit.js'"
    )


def test_app_js_calls_init_workspace_git_panel():
    src = read('static/app.js')
    assert 'initWorkspaceGitPanel(' in src, (
        'app.js does not call initWorkspaceGitPanel()'
    )


# ---------------------------------------------------------------------------
# Forbidden product references — none of these strings may appear in our files
# ---------------------------------------------------------------------------

_FORBIDDEN = [
    'vscode',
    'vs code',
    'visual studio',
    'gitlens',
    'sourcetree',
    'github desktop',
    'intellij',
    'sublime',
]

_CHECK_FILES = [
    'static/js/workspaceGit.js',
    'static/index.html',
    'static/style.css',
]


def test_no_forbidden_product_references():
    failures = []
    for rel in _CHECK_FILES:
        content_lower = read(rel).lower()
        for forbidden in _FORBIDDEN:
            if forbidden in content_lower:
                failures.append(f'Found "{forbidden}" in {rel}')
    assert not failures, 'Forbidden product references found:\n' + '\n'.join(failures)


# ---------------------------------------------------------------------------
# Task 2 — panel trigger, modal shell, tabs, draggable
# ---------------------------------------------------------------------------

def test_index_has_git_panel_trigger():
    src = read('static/index.html')
    assert 'workspace-git-panel-btn' in src, (
        'index.html is missing the git panel trigger #workspace-git-panel-btn'
    )


def test_git_modal_id_defined():
    src = read('static/js/workspaceGit.js')
    assert 'workspace-git-modal' in src, (
        'workspaceGit.js does not define the #workspace-git-modal shell'
    )


def test_git_modal_uses_shared_modal_shell():
    src = read('static/js/workspaceGit.js')
    # Reuse the app modal vocabulary rather than a one-off surface.
    for cls in ("'modal'", 'modal-content', 'modal-header', 'modal-body'):
        assert cls in src, f'workspaceGit.js modal shell missing {cls}'


def test_git_modal_tab_ids_present():
    src = read('static/js/workspaceGit.js')
    # Stable id prefixes the runtime renders one per tab (wgit-tab-<id> /
    # wgit-panel-<id>), plus each of the five tab ids defined in the module.
    assert 'wgit-tab-' in src, 'missing wgit-tab- id prefix'
    assert 'wgit-panel-' in src, 'missing wgit-panel- id prefix'
    for tab in ('changes', 'files', 'history', 'blame', 'conflicts'):
        assert f"'{tab}'" in src or f'"{tab}"' in src, f'tab id {tab!r} not defined'


def test_git_modal_uses_lib_tabs_vocabulary():
    src = read('static/js/workspaceGit.js')
    assert 'lib-tabs' in src and 'lib-tab' in src, (
        'git panel should reuse the .lib-tabs tab vocabulary'
    )


def test_git_modal_is_draggable():
    src = read('static/js/workspaceGit.js')
    assert 'makeWindowDraggable' in src, (
        'git panel modal must be wired with makeWindowDraggable'
    )


def test_git_modal_has_close_control():
    src = read('static/js/workspaceGit.js')
    assert 'workspace-git-close' in src, (
        'git panel modal is missing its close control #workspace-git-close'
    )


def test_git_panel_trigger_wired_in_module():
    src = read('static/js/workspaceGit.js')
    assert 'workspace-git-panel-btn' in src, (
        'workspaceGit.js does not bind the #workspace-git-panel-btn trigger'
    )


def test_style_has_git_panel_styles():
    src = read('static/style.css')
    assert 'workspace-git-modal' in src or 'wgit-' in src, (
        'style.css has no git panel styles'
    )


# ---------------------------------------------------------------------------
# Task 3 — API client + state model
# ---------------------------------------------------------------------------

_GIT_ENDPOINTS = [
    '/api/workspace/git/status',
    '/api/workspace/git/diff',
    '/api/workspace/git/stage',
    '/api/workspace/git/unstage',
    '/api/workspace/git/discard',
    '/api/workspace/git/hunks/stage',
    '/api/workspace/git/hunks/unstage',
    '/api/workspace/git/commit',
    '/api/workspace/git/commit-selected',
    '/api/workspace/git/branches',
    '/api/workspace/git/checkout',
    '/api/workspace/git/checkout-stash',
    '/api/workspace/git/fetch',
    '/api/workspace/git/pull',
    '/api/workspace/git/push',
    '/api/workspace/git/init',
    '/api/workspace/git/clone',
    '/api/workspace/git/history',
    '/api/workspace/git/blame',
    '/api/workspace/git/conflicts',
    '/api/workspace/git/conflict/resolve',
]


def test_git_endpoints_match_backend():
    src = read('static/js/workspaceGit.js')
    missing = [ep for ep in _GIT_ENDPOINTS if ep not in src]
    assert not missing, 'workspaceGit.js is missing endpoints:\n' + '\n'.join(missing)


def test_git_api_helper_defined():
    src = read('static/js/workspaceGit.js')
    assert 'function gitApi' in src, 'gitApi(path, opts) is not defined'


def test_git_api_uses_same_origin_credentials():
    src = read('static/js/workspaceGit.js')
    assert "credentials: 'same-origin'" in src or 'credentials: "same-origin"' in src, (
        'gitApi must send same-origin credentials'
    )


def test_git_api_structured_error_handling():
    src = read('static/js/workspaceGit.js')
    # Surfaces the backend's stable error code, not just a generic failure.
    assert '.code' in src and ('GitApiError' in src or 'data.error' in src), (
        'gitApi should propagate the backend error code/message'
    )


def test_panel_state_has_required_keys():
    src = read('static/js/workspaceGit.js')
    for key in ('workspace', 'status', 'activeTab', 'selectedPath',
                'editor', 'loading', 'error'):
        assert key in src, f'panel state is missing the {key!r} field'


def test_reads_workspace_via_module():
    src = read('static/js/workspaceGit.js')
    assert "from './workspace.js'" in src, 'must import the workspace module'
    assert 'getWorkspace' in src, 'must read the active workspace via getWorkspace()'
    # Should not duplicate localStorage access for the workspace.
    assert 'localStorage' not in src, 'do not duplicate localStorage; use the workspace module'


def test_refreshes_status_on_open():
    src = read('static/js/workspaceGit.js')
    # openWorkspaceGitPanel should trigger a status refresh.
    open_idx = src.find('function openWorkspaceGitPanel')
    assert open_idx != -1
    after_open = src[open_idx:open_idx + 600]
    assert 'refreshWorkspaceGitStatus' in after_open, (
        'opening the panel should refresh git status'
    )


# ---------------------------------------------------------------------------
# Task 4 — Changes tab
# ---------------------------------------------------------------------------

def test_changes_renders_status_groups():
    src = read('static/js/workspaceGit.js')
    for group in ('conflicted', 'staged', 'unstaged', 'untracked'):
        assert group in src, f'Changes tab is missing the {group} group'
    # Deleted and renamed kinds are surfaced (porcelain change types).
    assert 'deleted' in src and 'renamed' in src, (
        'Changes rows must label deleted and renamed kinds'
    )


def test_changes_stage_unstage_discard_controls():
    src = read('static/js/workspaceGit.js')
    for cls in ('wgit-act-stage', 'wgit-act-unstage', 'wgit-act-discard'):
        assert cls in src, f'Changes rows missing control {cls}'
    for ep in ('/api/workspace/git/stage', '/api/workspace/git/unstage',
               '/api/workspace/git/discard'):
        assert ep in src, f'Changes tab does not call {ep}'


def test_changes_hunk_controls_send_hunk_ids():
    src = read('static/js/workspaceGit.js')
    for cls in ('wgit-hunk-stage', 'wgit-hunk-unstage'):
        assert cls in src, f'diff view missing hunk control {cls}'
    # Hunk operations send the stable hunk id, never raw patch text.
    assert 'hunkId' in src, 'hunk staging must send a hunkId'
    assert 'patch:' not in src.replace(' ', ''), (
        'hunk staging must not POST raw patch text from the client'
    )


def test_changes_discard_confirms():
    src = read('static/js/workspaceGit.js')
    assert 'styledConfirm' in src, 'discard must confirm via uiModule.styledConfirm'


def test_changes_commit_box():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-commit-msg' in src, 'commit message textarea is missing'
    assert '/api/workspace/git/commit' in src, 'commit staged action is missing'
    assert '/api/workspace/git/commit-selected' in src, 'commit selected action is missing'


def test_changes_commit_selected_control():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-commit-selected-btn' in src, 'commit-selected control is missing'


# ---------------------------------------------------------------------------
# Task 5 — Files tab + text editor
# ---------------------------------------------------------------------------

def test_files_tab_uses_file_endpoints():
    src = read('static/js/workspaceGit.js')
    for ep in ('/api/workspace/files', '/api/workspace/file', '/api/workspace/file/save'):
        assert ep in src, f'Files tab does not use {ep}'


def test_files_browser_rendered():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-file-browser' in src, 'file browser container missing'
    assert 'wgit-file-row' in src, 'file browser rows missing'


def test_editor_textarea_and_gutter():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-editor-area' in src, 'editor textarea missing'
    assert 'wgit-gutter' in src, 'editor line gutter missing'


def test_editor_save_and_cancel_controls():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-editor-save' in src, 'editor save control missing'
    assert 'wgit-editor-cancel' in src, 'editor cancel control missing'


def test_editor_soft_wrap_toggle():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-wrap-toggle' in src, 'soft wrap toggle missing'


def test_editor_dirty_tracking():
    src = read('static/js/workspaceGit.js')
    assert 'dirty' in src, 'editor must track a dirty state'


def test_editor_tab_indentation():
    src = read('static/js/workspaceGit.js')
    assert "'Tab'" in src or '"Tab"' in src, 'editor must handle the Tab key for indent/outdent'


def test_editor_enter_preserves_indent():
    src = read('static/js/workspaceGit.js')
    assert "'Enter'" in src or '"Enter"' in src, 'editor must handle Enter for indentation'


def test_editor_escape_discards_when_dirty():
    src = read('static/js/workspaceGit.js')
    assert "'Escape'" in src or '"Escape"' in src, 'editor must handle Escape'


def test_editor_binary_message():
    src = read('static/js/workspaceGit.js')
    assert 'binary' in src, 'binary files must be shown as non-editable'


def test_editor_cursor_position():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-editor-status' in src, 'editor must show cursor line/column status'


def test_editor_unsaved_guard():
    src = read('static/js/workspaceGit.js')
    # A guard used before switching files/tabs/closing.
    assert 'Unsaved' in src or 'unsaved' in src or 'Discard' in src, (
        'editor must guard against losing unsaved changes'
    )


def test_save_refreshes_status_and_view():
    src = read('static/js/workspaceGit.js')
    save_idx = src.find('EP.fileSave')
    assert save_idx != -1, 'save must call the file save endpoint via EP.fileSave'
    assert 'refreshWorkspaceGitStatus' in src, 'save must refresh git status'


# ---------------------------------------------------------------------------
# Task 6 — History + Blame tabs
# ---------------------------------------------------------------------------

def test_history_uses_endpoint():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/history' in src, 'History tab must call the history endpoint'


def test_blame_uses_endpoint():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/blame' in src, 'Blame tab must call the blame endpoint'


def test_history_repo_and_file_scope():
    src = read('static/js/workspaceGit.js')
    # History honors the selected file (file history) and can show repo history.
    assert 'selectedPath' in src
    assert 'wgit-history' in src, 'History tab container missing'
    assert 'wgit-scope' in src, 'History should offer repo vs file scope'


def test_history_commit_rows_fields():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-commit-row' in src, 'commit rows missing'
    for field in ('sha', 'author', 'date'):
        assert field in src, f'commit rows must surface {field}'


def test_history_commit_readonly_detail():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-commit-detail' in src, 'commit selection must open a read-only detail view'


def test_blame_rows_fields():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-blame' in src, 'Blame container missing'
    assert 'wgit-blame-row' in src, 'Blame rows missing'
    for cls in ('wgit-blame-num', 'wgit-blame-sha', 'wgit-blame-author', 'wgit-blame-text'):
        assert cls in src, f'Blame row missing {cls}'


# ---------------------------------------------------------------------------
# Task 7 — Conflicts tab
# ---------------------------------------------------------------------------

def test_conflicts_uses_endpoints():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/conflicts' in src, 'must list conflicts'
    assert '/api/workspace/git/conflict/resolve' in src, 'must call conflict resolve'


def test_conflicts_list_rendered():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-conflict-list' in src, 'conflict list container missing'
    assert 'wgit-conflict-row' in src, 'conflict file rows missing'


def test_conflicts_open_in_editor_surface():
    src = read('static/js/workspaceGit.js')
    # Conflict files reuse the editor surface.
    assert 'wgit-editor' in src
    assert '_openConflictFile' in src or 'conflict' in src.lower()


def test_conflicts_accept_actions():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-accept-current' in src, 'accept-current action missing'
    assert 'wgit-accept-incoming' in src, 'accept-incoming action missing'


def test_conflicts_manual_save_uses_file_save():
    src = read('static/js/workspaceGit.js')
    # Manual save (keep working) writes via file save, which does not stage.
    assert 'EP.fileSave' in src, 'manual conflict save should use the file save endpoint'


def test_conflicts_stage_resolved_sends_stage_flag():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-stage-resolved' in src, 'Stage resolved control missing'
    idx = src.find('EP.conflictResolve')
    assert idx != -1, 'must call the conflict resolve endpoint'
    segment = src[idx:idx + 200]
    assert 'stage' in segment, 'Stage resolved must send stage: true to the resolve endpoint'


def test_conflicts_refresh_after_resolve():
    src = read('static/js/workspaceGit.js')
    assert 'refreshWorkspaceGitStatus' in src, 'resolving must refresh status and the conflict list'


# ---------------------------------------------------------------------------
# Task 8 — clone, init, and remote actions
# ---------------------------------------------------------------------------

_DOCKER_COPY = 'In Docker, choose a mounted path for persistence.'


def test_remote_actions_wired():
    src = read('static/js/workspaceGit.js')
    for ep in ('/api/workspace/git/fetch', '/api/workspace/git/pull', '/api/workspace/git/push'):
        assert ep in src, f'remote action {ep} not wired'
    for ctrl in ('wgit-fetch', 'wgit-pull', 'wgit-push'):
        assert ctrl in src, f'toolbar control {ctrl} missing'


def test_init_action_confirms():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/init' in src, 'init endpoint not called'
    assert 'wgit-init' in src, 'init control missing'
    assert 'styledConfirm' in src, 'init must confirm'


def test_clone_flow_inputs():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/clone' in src, 'clone endpoint not called'
    assert 'wgit-clone-url' in src, 'clone URL field missing'
    # optional target parent / name
    assert 'wgit-clone-target' in src and 'wgit-clone-name' in src, (
        'clone should offer optional target parent and name'
    )


def test_clone_sets_active_workspace_on_success():
    src = read('static/js/workspaceGit.js')
    assert 'setWorkspace' in src, 'clone success must set the active workspace via the workspace module'


def test_docker_guidance_copy_present():
    src = read('static/js/workspaceGit.js')
    assert _DOCKER_COPY in src, 'clone/init helper text must include the Docker guidance copy'


def test_docker_guidance_only_in_js():
    # The Docker copy belongs to clone/init helper text only — not chrome elsewhere.
    assert _DOCKER_COPY not in read('static/index.html')
    assert _DOCKER_COPY not in read('static/style.css')


# ---------------------------------------------------------------------------
# Task 9 — responsive + visual polish
# ---------------------------------------------------------------------------

def test_css_key_classes_present():
    css = read('static/style.css')
    for cls in ('.wgit-change-row', '.wgit-diff-line', '.wgit-file-row', '.wgit-gutter',
                '.wgit-editor-area', '.wgit-hunk', '.wgit-commit-row', '.wgit-blame-row',
                '.wgit-conflict-list', '.wgit-badge'):
        assert cls in css, f'style.css is missing {cls}'


def test_css_has_mobile_media_query():
    css = read('static/style.css')
    assert '@media (max-width: 768px)' in css, 'no mobile media query for the git panel'
    # The mobile rules must scope to the git panel.
    idx = css.find('@media (max-width: 768px)')
    assert 'wgit' in css[idx:], 'mobile media query does not adjust the git panel'


def test_tabs_are_scrollable_or_wrap():
    css = read('static/style.css')
    # Reuses .lib-tabs (which scrolls) and/or sets overflow on the git tabs.
    assert '.wgit-tabs' in css


def test_destructive_uses_danger_styling():
    css = read('static/style.css')
    assert 'wgit-danger' in css, 'destructive row buttons need danger styling'
    js = read('static/js/workspaceGit.js')
    assert 'danger: true' in js, 'discard/destructive confirms must use danger styling'


def test_reduced_motion_supported():
    css = read('static/style.css')
    assert 'prefers-reduced-motion' in css, 'panel must honor reduced motion'


# ---------------------------------------------------------------------------
# Branch switcher (dropdown)
# ---------------------------------------------------------------------------

def test_branch_control_is_a_button_menu():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-branch-btn' in src, 'branch control must be a button trigger'
    assert 'aria-haspopup' in src, 'branch button should advertise a menu'
    assert 'wgit-branch-menu' in src, 'branch dropdown menu missing'


def test_branch_menu_uses_branches_endpoint():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/branches' in src


def test_branch_menu_has_search_and_sections():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-branch-search' in src, 'branch menu needs a search/filter input'
    assert 'Local branches' in src and 'Remote branches' in src, 'branch sections missing'


def test_branch_checkout_uses_checkout_endpoint():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/checkout' in src


def test_branch_switch_is_seamless_autostash_restore():
    src = read('static/js/workspaceGit.js')
    # Switching always uses the per-branch auto-stash + restore checkout path
    # (no dirty prompt): leaving parks the branch's changes, arriving restores
    # that branch's previously-parked changes.
    assert '/api/workspace/git/checkout-stash' in src, 'switch must use the autostash+restore path'
    idx = src.find('async function _checkoutBranch')
    assert idx != -1
    body = src[idx:idx + 1200]
    assert 'EP.checkoutStash' in body, 'checkout must go through the autostash+restore endpoint'
    assert 'restored' in body, 'switch toast should surface restored changes'


def test_branch_checkout_guards_unsaved_and_refreshes():
    src = read('static/js/workspaceGit.js')
    # The checkout flow guards unsaved editor changes and refreshes after.
    idx = src.find('async function _checkoutBranch')
    assert idx != -1, '_checkoutBranch missing'
    body = src[idx:idx + 1400]
    assert '_guardUnsaved' in body
    assert '_afterBranchChange' in body or 'refreshWorkspaceGitStatus' in body


def test_branch_remote_checks_out_local_tracking_name():
    src = read('static/js/workspaceGit.js')
    assert '_remoteLocalName' in src, 'remote branches must map to their local tracking name'


def test_branch_create_uses_endpoint():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/branch/create' in src
    assert 'wgit-branch-create' in src, 'create-branch row missing'


def test_branch_menu_portaled_fixed_to_avoid_clipping():
    css = read('static/style.css')
    idx = css.find('.wgit-branch-menu')
    assert idx != -1, 'branch menu styles missing'
    assert 'position: fixed' in css[idx:idx + 200], 'branch menu must be fixed-position (portaled) to avoid clipping'


# ---------------------------------------------------------------------------
# AI commit-message generation (chat-selected model)
# ---------------------------------------------------------------------------

def test_commit_message_endpoint_used():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/commit-message' in src, 'commit-message endpoint not called'


def test_commit_generate_button_present():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-commit-gen' in src, 'Generate commit-message button missing'


def test_commit_generate_uses_chat_session_model():
    src = read('static/js/workspaceGit.js')
    assert "from './sessions.js'" in src, 'must import the sessions module'
    assert 'getCurrentSessionId' in src, 'must send the current chat session id'


def test_commit_generate_fills_textarea():
    src = read('static/js/workspaceGit.js')
    idx = src.find('async function _generateCommitMessage')
    assert idx != -1, '_generateCommitMessage missing'
    body = src[idx:idx + 1200]
    assert 'commitMessage' in body, 'generated message should populate the commit box'


# ---------------------------------------------------------------------------
# Commit graph — lane layout engine + rail + ref chips + commit detail
# ---------------------------------------------------------------------------

def test_history_has_lane_layout_engine():
    src = read('static/js/workspaceGit.js')
    assert 'function _computeGraph' in src, 'commit graph needs a _computeGraph lane allocator'


def test_lane_layout_consumes_parents_and_refs():
    src = read('static/js/workspaceGit.js')
    assert '.parents' in src, 'graph must consume commit.parents'
    assert '.refs' in src, 'history must consume commit.refs'


def test_lane_layout_caps_lane_count():
    src = read('static/js/workspaceGit.js')
    assert 'MAX_LANES' in src, 'lane allocator must define a MAX_LANES cap'
    idx = src.find('MAX_LANES')
    assert '8' in src[idx:idx + 40], 'MAX_LANES should be 8 (overflow folds into the last lane)'


def test_history_renders_svg_rail():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-graph' in src, 'history rows need a graph gutter'
    assert 'wgit-graph-svg' in src, 'continuous SVG rail missing'
    assert 'aria-hidden' in src, 'decorative rail must be aria-hidden'


def test_history_renders_typed_ref_chips():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-ref' in src, 'ref chips missing'
    for cls in ('wgit-ref-head', 'wgit-ref-local', 'wgit-ref-remote', 'wgit-ref-tag'):
        assert cls in src, f'ref chip type {cls} missing'


def test_history_row_hooks_survive_restructure():
    src = read('static/js/workspaceGit.js')
    for hook in ('wgit-history-list', 'wgit-scope', 'selectedPath',
                 'wgit-commit-row', 'wgit-commit-subject', 'wgit-commit-meta',
                 'wgit-commit-sha', 'wgit-commit-author', 'wgit-commit-date'):
        assert hook in src, f'{hook} must survive the row restructure'


def test_history_fixed_row_height_token():
    css = read('static/style.css')
    assert '--wgit-row-h' in css, 'fixed row-height token missing (node Y math needs it)'


def test_history_lane_palette_themed_both_modes():
    css = read('static/style.css')
    for n in range(8):
        assert f'--wgit-lane-{n}' in css, f'lane color --wgit-lane-{n} missing'
    # Defined for dark + light so the rail themes through CSS, not getComputedStyle.
    assert css.count('--wgit-lane-0:') >= 2, 'lane palette must be defined for both themes'


def test_history_graph_node_and_chip_css():
    css = read('static/style.css')
    assert '.wgit-graph-svg' in css, 'graph svg styles missing'
    assert '.wgit-lane-0' in css, 'lane color class missing'
    assert '.wgit-node' in css, 'node styles missing'
    assert 'wgit-node-head' in css, 'HEAD node ring missing'
    assert '.wgit-ref' in css, 'ref chip styles missing'


def test_commit_detail_loads_changed_files():
    src = read('static/js/workspaceGit.js')
    assert '/api/workspace/git/commit' in src, 'commit detail must call the commit stat endpoint'
    idx = src.find('function _showCommitDetail')
    assert idx != -1, '_showCommitDetail missing'
    body = src[idx:idx + 1600]
    assert 'EP.commit' in body or '_loadCommitFiles' in body, 'detail must fetch the commit stat'


def test_commit_detail_renders_files_and_summary():
    src = read('static/js/workspaceGit.js')
    assert 'wgit-commit-detail' in src, 'detail container hook must survive'
    for cls in ('wgit-commit-summary', 'wgit-commit-file'):
        assert cls in src, f'{cls} missing from commit detail'
    assert 'files changed' in src or 'file changed' in src, 'summary line missing'


def test_commit_detail_files_css_present():
    css = read('static/style.css')
    for cls in ('.wgit-commit-summary', '.wgit-commit-file'):
        assert cls in css, f'{cls} CSS missing'
