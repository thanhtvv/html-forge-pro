// ─────────────────────────────────────────────
// SYNC: textarea ↔ iframe
// ─────────────────────────────────────────────

import { textarea, getFd, getInitFrame } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML } from '../core/sanitizer.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { toast } from '../ui/toast.js';

let _sTimer = null;

export function scheduleSync() {
  clearTimeout(_sTimer);
  _sTimer = setTimeout(() => {
    const fd = getFd();
    if (!fd || !fd.body) return;
    withSyncLock(() => {
      fd.body.innerHTML = textarea.value;
      sanitizeDOMAttrs(fd.body);
    });
  }, 450);
}

export function applyHtml() {
  const fd = getFd();
  if (!fd) {
    const initFrame = getInitFrame();
    if (initFrame) initFrame();
    return;
  }
  pushUndo();
  withSyncLock(() => {
    fd.body.innerHTML = textarea.value;
    sanitizeDOMAttrs(fd.body);
  });
  toast('Đã apply vào preview ✓');
}

export function pullFromFrame() {
  const fd = getFd();
  if (!fd) return;
  sanitizeDOMAttrs(fd.body);
  const newVal = cleanHTML(fd.body.innerHTML);
  if (newVal !== textarea.value) {
    pushUndo(newVal);
    textarea.value = newVal;
    updateHL();
  }
}
