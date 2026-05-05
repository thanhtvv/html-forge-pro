// ─────────────────────────────────────────────
// SYNTAX HIGHLIGHTING
// ─────────────────────────────────────────────

import { textarea, hlPre } from '../core/refs.js';
import { updateStats } from './stats.js';

export function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export function highlight(code) {
  const parts = [], re = new RegExp('<!--[\\s\\S]*?--\\>', 'g');
  let last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) parts.push({ t:'c', s: code.slice(last, m.index) });
    parts.push({ t:'k', s: m[0] });
    last = m.index + m[0].length;
  }
  parts.push({ t:'c', s: code.slice(last) });
  return parts.map(p => p.t === 'k'
    ? `<span class="hl-cmt">${esc(p.s)}</span>`
    : hlTags(p.s)
  ).join('');
}

export function hlTags(code) {
  return code.replace(/(<\/?)([\w][a-zA-Z0-9:-]*)([^>]*?)(\/?>)/g,
    (full, open, tag, attrs, close) => {
      const hA = attrs.replace(
        /(\s+)([a-zA-Z:_][a-zA-Z0-9:_\-.]*)((?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*))?)/g,
        (a, sp, name, val) => {
          if (!val) return `${esc(sp)}<span class="hl-attr">${esc(name)}</span>`;
          const eq = val.match(/^(\s*=\s*)([\s\S]*)$/);
          return `${esc(sp)}<span class="hl-attr">${esc(name)}</span>${esc(eq[1])}<span class="hl-val">${esc(eq[2])}</span>`;
        });
      return `<span class="hl-tag">${esc(open)}${esc(tag)}</span>${hA}<span class="hl-tag">${esc(close)}</span>`;
    });
}

export function updateHL() {
  hlPre.innerHTML = highlight(textarea.value) + '\n';
  hlPre.scrollTop  = textarea.scrollTop;
  hlPre.scrollLeft = textarea.scrollLeft;
  updateStats();
}

// Keep highlight layer in sync with textarea scroll
textarea.addEventListener('scroll', () => {
  hlPre.scrollTop  = textarea.scrollTop;
  hlPre.scrollLeft = textarea.scrollLeft;
});
