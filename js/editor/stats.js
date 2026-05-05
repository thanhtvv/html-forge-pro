// ─────────────────────────────────────────────
// STATS — Word count, char count, link counter
// ─────────────────────────────────────────────

import { textarea, getFd } from '../core/refs.js';

export function updateStats() {
  const val = textarea.value;
  const text = val.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const chars = text.length;

  let linkCount = 0;
  const re = /<a\s+[^>]*href=["']([^"']*)['""][^>]*>/gi;
  while (re.exec(val) !== null) linkCount++;

  const lc = document.getElementById('link-counter');
  if (lc) {
    lc.innerHTML = `
      <span style="color:var(--text2);margin-right:8px;font-size:11px">Từ: <b style="color:var(--text)">${words}</b></span>
      <span style="color:var(--glass-border2);margin:0 8px">|</span>
      <span style="color:var(--text2);margin-right:8px;font-size:11px">Ký tự: <b style="color:var(--text)">${chars}</b></span>
      <span style="color:var(--glass-border2);margin:0 8px">|</span>
      <button onclick="openAllLinksModal()" style="background:var(--accent-glass);color:var(--accent);border:1px solid rgba(10,132,255,.3);border-radius:4px;padding:3px 8px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px">
        <svg width="12" height="12" viewBox="0 0 15 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 4.5H9"/><path d="M1.5 4.5a3 3 0 003 3h1"/><path d="M10 7.5h1a3 3 0 000-6h-1"/><path d="M5 1.5H4a3 3 0 000 6h1"/></svg>
        ${linkCount} Links
      </button>
    `;
  }
}
