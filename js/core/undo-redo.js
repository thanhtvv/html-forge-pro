// ─────────────────────────────────────────────
// UNDO / REDO
// ─────────────────────────────────────────────

import { textarea, getFd } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { toast } from '../ui/toast.js';

let undoStack = [''];
let redoStack = [];

export function pushUndo(val) {
  const v = val !== undefined ? val : textarea.value;
  if (!undoStack.length || undoStack[undoStack.length - 1] !== v) {
    undoStack.push(v);
    if (undoStack.length > 200) undoStack.shift();
    redoStack = [];
  }
}

let _undoTimer = null;
export function debouncedPushUndo() {
  clearTimeout(_undoTimer);
  _undoTimer = setTimeout(() => pushUndo(), 500);
}

export function doUndo() {
  if (undoStack.length <= 1) return;
  redoStack.push(undoStack.pop());
  const prev = undoStack[undoStack.length - 1];
  applyValueToAll(prev);
  toast('Undo ✓');
}

export function doRedo() {
  if (!redoStack.length) return;
  const next = redoStack.pop();
  undoStack.push(next);
  applyValueToAll(next);
  toast('Redo ✓');
}

export function applyValueToAll(val) {
  const fd = getFd();
  withSyncLock(() => {
    textarea.value = val;
    updateHL();
    if (fd && fd.body) fd.body.innerHTML = val;
  });
}
