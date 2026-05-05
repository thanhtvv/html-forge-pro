// ─────────────────────────────────────────────
// RESIZER — Drag to resize panels
// ─────────────────────────────────────────────

import { toast } from './toast.js';

export function initResizer() {
  const res = document.getElementById('resizer');
  const lp  = document.getElementById('lp');
  const mainEl = document.getElementById('main');
  let drag=false, startX=0, startW=0;
  const overlay = document.createElement('div');
  overlay.style.cssText='display:none;position:fixed;inset:0;z-index:99999;cursor:col-resize';
  document.body.appendChild(overlay);
  res.addEventListener('mousedown', e => {
    e.preventDefault(); drag=true; startX=e.clientX;
    startW=lp.getBoundingClientRect().width;
    res.classList.add('dragging'); overlay.style.display='block';
    document.body.style.userSelect='none';
  });
  function onMove(e) {
    if (!drag) return;
    const mw = mainEl.getBoundingClientRect().width;
    const newW = Math.max(160, Math.min(mw-160-res.offsetWidth, startW+e.clientX-startX));
    lp.style.width=newW+'px'; lp.style.flex='none';
  }
  function onUp() {
    if (!drag) return;
    drag=false; res.classList.remove('dragging');
    overlay.style.display='none'; document.body.style.userSelect='';
  }
  overlay.addEventListener('mousemove', onMove); overlay.addEventListener('mouseup', onUp);
  document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  res.addEventListener('dblclick', () => { lp.style.width='50%'; lp.style.flex='none'; toast('Reset 50/50 ✓'); });
}
