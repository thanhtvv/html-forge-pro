// ─────────────────────────────────────────────
// CLIPBOARD — Copy output HTML
// ─────────────────────────────────────────────

import { textarea, getFd } from '../core/refs.js';
import { toast } from './toast.js';

export function copyOutput() {
  const fd = getFd();
  const textToCopy = textarea.value || (fd ? fd.body.innerHTML : '');
  if (!textToCopy) return;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,6 5,9 10,3"/></svg> Đã copy!';
    setTimeout(() => {
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><path d="M8 4V2.5A1.5 1.5 0 006.5 1h-4A1.5 1.5 0 001 2.5v4A1.5 1.5 0 002.5 8H4"/></svg>Copy';
    }, 2200);
    toast('Đã copy vào clipboard!');
  });
}
