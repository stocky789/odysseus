// static/js/toolDiff.js
//
// Single source of truth for rendering a tool result's unified `diff` (from
// edit_file / write_file, etc.) as an inline red/green block in the chat.
// Used by both the live stream (chat.js) and history reload (chatRenderer.js)
// so the two always match.
//
// The block renders EXPANDED by default (a <details open>) so the red/green is
// visible the moment an edit lands — no click needed — while staying manually
// collapsible. Long diffs are height-capped + scrolled via CSS
// (.agent-tool-diff .diff-pre) so a big edit doesn't flood the transcript.

import uiModule from './ui.js';

const esc = uiModule.esc;

/** True when a tool result carries a renderable unified diff. */
export function hasToolDiff(diff) {
  return !!(diff && diff.text);
}

/**
 * Build the inline diff block HTML for a tool result's diff object
 * ({ text, added, removed, new_file, file }). Returns '' when there's no diff.
 */
export function renderToolDiffHTML(diff) {
  if (!hasToolDiff(diff)) return '';
  const d = diff;
  // Summary: filename + +adds (green) / −dels (red) / new badge.
  const stat = [
    d.new_file ? '<span class="diff-stat-new">new</span>' : '',
    d.added ? `<span class="diff-stat-add">+${d.added}</span>` : '',
    d.removed ? `<span class="diff-stat-del">−${d.removed}</span>` : '',
  ].filter(Boolean).join(' ');
  const rows = String(d.text).split('\n').map((line) => {
    let cls = 'diff-ctx';
    let text = line;
    if (line.startsWith('+++') || line.startsWith('---')) cls = 'diff-meta';
    else if (line.startsWith('@@')) cls = 'diff-hunk';
    // Drop the leading marker (+/-/space) — colour already encodes add/del, and
    // keeping it doubles up with markdown "- " bullets (reads as "+-"/"--").
    else if (line.startsWith('+')) { cls = 'diff-add'; text = line.slice(1); }
    else if (line.startsWith('-')) { cls = 'diff-del'; text = line.slice(1); }
    else if (line.startsWith(' ')) { text = line.slice(1); }
    // spans are display:block — a literal \n here would double-space the diff.
    return `<span class="${cls}">${esc(text) || '&nbsp;'}</span>`;
  }).join('');
  return `<details class="agent-tool-output agent-tool-diff" open>`
    + `<summary><span class="diff-file">${esc(d.file || 'diff')}</span> `
    + `<span class="diff-summary-stats">${stat}</span></summary>`
    + `<pre class="diff-pre">${rows}</pre></details>`;
}

export default { renderToolDiffHTML, hasToolDiff };
