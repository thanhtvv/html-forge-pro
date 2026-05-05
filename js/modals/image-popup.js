// ─────────────────────────────────────────────
// IMAGE QUICK POPUP
// ─────────────────────────────────────────────

import { textarea, frame, getFd } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML } from '../core/sanitizer.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { toast } from '../ui/toast.js';
import { openImageModal } from './image-modal.js';

let currentPopupImg = null;

export function openImgPopup(img, ev) {
  currentPopupImg = img;
  document.getElementById('ip-src').value = img.getAttribute('src') || '';
  document.getElementById('ip-alt').value = img.getAttribute('alt') || '';
  const fr = frame.getBoundingClientRect();
  const px = Math.min(fr.left + (ev ? ev.clientX : fr.width / 2), window.innerWidth - 320);
  const py = Math.min(fr.top + (ev ? ev.clientY : fr.height / 2) + 20, window.innerHeight - 200);
  const pp = document.getElementById('img-popup');
  pp.style.left = px + 'px';
  pp.style.top  = py + 'px';
  pp.classList.add('show');
}

export function closeImgPopup() {
  document.getElementById('img-popup').classList.remove('show');
  currentPopupImg = null;
}

export function applyImgPopup() {
  if (!currentPopupImg) return;
  const fd = getFd();
  const src = document.getElementById('ip-src').value.trim();
  const alt = document.getElementById('ip-alt').value.trim();
  if (!src) return;
  pushUndo();
  currentPopupImg.setAttribute('src', src);
  currentPopupImg.setAttribute('alt', alt);
  withSyncLock(() => {
    sanitizeDOMAttrs(fd.body);
    const newVal = cleanHTML(fd.body.innerHTML);
    pushUndo(newVal); textarea.value = newVal; updateHL();
  });
  toast('Đã cập nhật hình ✓');
  closeImgPopup();
}

export function removeImgPopup() {
  if (!currentPopupImg) return;
  const fd = getFd();
  pushUndo();
  const img = currentPopupImg;
  const fig = img.closest('figure');
  const target = fig || img;
  target.parentNode.removeChild(target);
  withSyncLock(() => {
    sanitizeDOMAttrs(fd.body);
    const newVal = cleanHTML(fd.body.innerHTML);
    pushUndo(newVal); textarea.value = newVal; updateHL();
  });
  toast('Đã xóa hình ảnh');
  closeImgPopup();
}

export function openImageModalFromPopup() {
  if (!currentPopupImg) return;
  const img = currentPopupImg;
  const fig = img.closest('figure');
  const cap = fig ? (fig.querySelector('figcaption') || {}).textContent || '' : '';
  closeImgPopup();
  openImageModal({
    el: fig || img,
    src: img.getAttribute('src') || '',
    alt: img.getAttribute('alt') || '',
    title: img.getAttribute('title') || '',
    lazy: img.getAttribute('loading') === 'lazy',
    fig: !!fig,
    cap: cap
  });
}

export function initImgPopupEvents() {
  ['ip-src','ip-alt'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => {
      if (e.key === 'Enter') applyImgPopup();
      if (e.key === 'Escape') closeImgPopup();
    });
  });
  document.addEventListener('click', e => {
    const pp = document.getElementById('img-popup');
    if (pp.classList.contains('show') && !pp.contains(e.target) && e.target !== frame) closeImgPopup();
  });
}
