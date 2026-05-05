// ─────────────────────────────────────────────
// SYNC LOCK — prevents bidirectional loop
// ─────────────────────────────────────────────

let _syncLocked = false;

export function withSyncLock(fn) {
  if (_syncLocked) return;
  _syncLocked = true;
  try { fn(); } finally { setTimeout(() => { _syncLocked = false; }, 0); }
}

export function isSyncLocked() {
  return _syncLocked;
}
