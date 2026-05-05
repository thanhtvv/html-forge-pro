// ─────────────────────────────────────────────
// LINK QUICK POPUP
// ─────────────────────────────────────────────

import { textarea, frame, getFd } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML } from '../core/sanitizer.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { toast } from '../ui/toast.js';
import { setEditingAnchor, openLinkModal } from './link-modal.js';

let currentPopupAnchor = null;

export function openLinkPopup(anchor, ev) {
  currentPopupAnchor = anchor;
  const pp = document.getElementById('link-popup');
  document.getElementById('pop-url').value = anchor.getAttribute('href') || '';
  document.getElementById('pop-text').value = anchor.textContent.trim();
  const fr = frame.getBoundingClientRect();
  const px = Math.min(fr.left + (ev ? ev.clientX : fr.width / 2), window.innerWidth - 390);
  const py = Math.min(fr.top + (ev ? ev.clientY : fr.height / 2) + 20, window.innerHeight - 170);
  pp.style.left = px + 'px';
  pp.style.top = py + 'px';
  pp.classList.add('show');
}

export function closeLinkPopup() {
  document.getElementById('link-popup').classList.remove('show');
  currentPopupAnchor = null;
}

export function applyLinkPopup() {
  if (!currentPopupAnchor) return;
  const fd = getFd();
  const url = document.getElementById('pop-url').value.trim();
  const text = document.getElementById('pop-text').value.trim();
  if (!url) return;
  pushUndo();
  currentPopupAnchor.setAttribute('href', url);
  if (text) {
    const hasStrong = !!currentPopupAnchor.querySelector('strong');
    currentPopupAnchor.innerHTML = hasStrong ? `<strong>${text}</strong>` : text;
  }
  withSyncLock(() => {
    sanitizeDOMAttrs(fd.body);
    const newVal = cleanHTML(fd.body.innerHTML);
    pushUndo(newVal);
    textarea.value = newVal;
    updateHL();
  });
  toast('Đã cập nhật link ✓');
  closeLinkPopup();
}

export function removeLinkPopup() {
  if (!currentPopupAnchor) return;
  const fd = getFd();
  pushUndo();
  const anchor = currentPopupAnchor, p = anchor.parentNode;
  while(anchor.firstChild) p.insertBefore(anchor.firstChild, anchor);
  p.removeChild(anchor);
  withSyncLock(() => {
    sanitizeDOMAttrs(fd.body);
    const newVal = cleanHTML(fd.body.innerHTML);
    pushUndo(newVal); textarea.value = newVal; updateHL();
  });
  toast('Đã xóa liên kết'); closeLinkPopup();
}

export function openLinkModalFromPopup() {
  if (!currentPopupAnchor) return;
  const anchor = currentPopupAnchor;
  setEditingAnchor(anchor);
  closeLinkPopup();
  document.getElementById('m-url').value = anchor.getAttribute('href') || '';
  document.getElementById('m-text').value = anchor.textContent.trim();
  document.getElementById('m-title').value = anchor.getAttribute('title') || '';
  document.getElementById('m-blank').checked = anchor.getAttribute('target') === '_blank';
  document.getElementById('m-strong').checked = !!anchor.querySelector('strong');
  // Trigger preview update
  document.getElementById('m-url').dispatchEvent(new Event('input'));
  document.getElementById('modal-title-text').textContent = 'Chỉnh sửa liên kết';
  document.querySelector('#link-modal .mbtn.ok').textContent = 'Lưu thay đổi';
  document.getElementById('link-modal').classList.add('show');
  setTimeout(() => document.getElementById('m-url').focus(), 60);
}

export function initLinkPopupEvents() {
  document.addEventListener('click', e => {
    const pp = document.getElementById('link-popup');
    if(pp.classList.contains('show') && !pp.contains(e.target) && e.target !== frame) closeLinkPopup();
  });
  ['pop-url', 'pop-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') applyLinkPopup();
        if (e.key === 'Escape') closeLinkPopup();
      });
    }
  });
}
