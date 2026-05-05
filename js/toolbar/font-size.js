// ─────────────────────────────────────────────
// FONT FAMILY & SIZE SELECT HANDLERS
// ─────────────────────────────────────────────

import { frame, getFd, getInitFrame } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { pullFromFrame } from '../preview/sync.js';

function ensureFrame() {
  if (!getFd()) {
    const initFrame = getInitFrame();
    if (initFrame) initFrame();
  }
}

export function initFontHandlers() {
  document.getElementById('sel-font').addEventListener('change', function() {
    ensureFrame();
    frame.contentWindow.focus();
    getFd().execCommand('fontName', false, this.value);
    setTimeout(() => { withSyncLock(pullFromFrame); }, 20);
  });

  document.getElementById('sel-size').addEventListener('change', function() {
    ensureFrame();
    frame.contentWindow.focus();
    getFd().execCommand('fontSize', false, this.value);
    setTimeout(() => { withSyncLock(pullFromFrame); }, 20);
  });
}
