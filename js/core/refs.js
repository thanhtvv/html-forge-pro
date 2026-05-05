// ─────────────────────────────────────────────
// DOM References & Shared Mutable State
// ─────────────────────────────────────────────

export const textarea = document.getElementById('html-input');
export const frame    = document.getElementById('preview-frame');
export const odisplay = document.getElementById('odisplay');
export const hlPre    = document.getElementById('hl-pre');
export const acDrop   = document.getElementById('ac-drop');

// Mutable shared state — use setters to modify
let _fd = null;
let _lastMin = '';
let _lastSavedValue = '';

export function getFd() { return _fd; }
export function setFd(val) { _fd = val; }

export function getLastMin() { return _lastMin; }
export function setLastMin(val) { _lastMin = val; }

export function getLastSavedValue() { return _lastSavedValue; }
export function setLastSavedValue(val) { _lastSavedValue = val; }

// Late-bound reference for initFrame (breaks circular deps)
let _initFrameFn = null;
export function getInitFrame() { return _initFrameFn; }
export function setInitFrame(fn) { _initFrameFn = fn; }
