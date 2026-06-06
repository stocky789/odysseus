"""Static contract tests for inline (auto-expanded) edit diffs in the main chat.

Edit/write_file tool results carry a unified `diff`; the chat should render that
diff expanded inline (red/green visible without a click) as each edit lands, via
a single shared renderer used by both the live stream and history reload.
"""

from pathlib import Path

REPO = Path(__file__).resolve().parent.parent


def read(rel):
    return (REPO / rel).read_text(encoding='utf-8')


# ── shared renderer ─────────────────────────────────────────────────────────

def test_tool_diff_module_exists_and_exports():
    assert (REPO / 'static/js/toolDiff.js').exists(), 'static/js/toolDiff.js missing'
    src = read('static/js/toolDiff.js')
    assert 'export function renderToolDiffHTML' in src, 'renderToolDiffHTML not exported'
    assert 'export function hasToolDiff' in src, 'hasToolDiff not exported'


def test_tool_diff_renders_expanded_with_colored_rows():
    src = read('static/js/toolDiff.js')
    # Expanded by default — the diff is open, not a click-to-reveal summary.
    assert 'open' in src, 'diff should render expanded (open) by default'
    for cls in ('diff-add', 'diff-del', 'diff-hunk', 'diff-meta', 'diff-pre', 'diff-summary-stats'):
        assert cls in src, f'shared diff renderer missing {cls}'


# ── both call sites use the shared renderer (no duplicated builder) ──────────

def test_chat_live_uses_shared_renderer():
    src = read('static/js/chat.js')
    assert "from './toolDiff.js'" in src, 'chat.js must import the shared diff renderer'
    assert 'renderToolDiffHTML' in src, 'chat.js live stream must use renderToolDiffHTML'


def test_history_uses_shared_renderer():
    src = read('static/js/chatRenderer.js')
    assert "from './toolDiff.js'" in src, 'chatRenderer.js must import the shared diff renderer'
    assert 'renderToolDiffHTML' in src, 'chatRenderer.js history must use renderToolDiffHTML'


def test_diff_builder_not_duplicated_in_call_sites():
    # The diff-building markup should live only in toolDiff.js now.
    for rel in ('static/js/chat.js', 'static/js/chatRenderer.js'):
        assert 'diff-summary-stats' not in read(rel), (
            f'{rel} still builds the diff inline; it should call renderToolDiffHTML'
        )


# ── the tool node auto-opens when it carries a diff ─────────────────────────

def test_live_node_opens_when_diff_present():
    src = read('static/js/chat.js')
    assert 'hasToolDiff' in src, 'chat.js should open the node when a diff is present'


def test_history_node_opens_when_diff_present():
    src = read('static/js/chatRenderer.js')
    assert 'hasToolDiff' in src, 'chatRenderer.js should open the node when a diff is present'


# ── capped height so long edits do not flood the transcript ─────────────────

def test_diff_capped_height_css():
    css = read('static/style.css')
    idx = css.find('.agent-tool-diff .diff-pre')
    assert idx != -1, 'missing capped-height rule for .agent-tool-diff .diff-pre'
    block = css[idx:idx + 160]
    assert 'max-height' in block and 'overflow' in block, 'diff body must cap height + scroll'
