// ─────────────────────────────────────────────
// HTMLForge Pro — Entry Point
// Imports all modules & wires everything together
// ─────────────────────────────────────────────
'use strict';

// ── Core ──
import { textarea, frame, getLastSavedValue, setInitFrame } from './core/refs.js';

// ── UI ──
import { toast } from './ui/toast.js';
import { setTheme } from './ui/theme.js';
import { setLayout } from './ui/layout.js';
import { initResizer } from './ui/resizer.js';
import { openFile, handleFileOpen, saveFile } from './ui/file-io.js';
import { copyOutput } from './ui/clipboard.js';

// ── Core operations ──
import { doUndo, doRedo } from './core/undo-redo.js';

// ── Editor ──
import { initTextareaEvents } from './editor/textarea-events.js';

// ── Preview ──
import { initFrame } from './preview/iframe.js';
import { applyHtml } from './preview/sync.js';

// ── Toolbar ──
import { fmt, fmtBlock, setAlign } from './toolbar/format-commands.js';
import { initFontHandlers } from './toolbar/font-size.js';

// ── Modals ──
import { openLinkModal, closeLinkModal, insertLink, initLinkModalEvents } from './modals/link-modal.js';
import { applyLinkPopup, removeLinkPopup, closeLinkPopup, openLinkModalFromPopup, initLinkPopupEvents } from './modals/link-popup.js';
import { openAllLinksModal, closeAllLinksModal, saveAllLinksModal } from './modals/all-links-modal.js';
import { openImageModal, closeImageModal, insertImage, initImageModalEvents } from './modals/image-modal.js';
import { applyImgPopup, removeImgPopup, closeImgPopup, openImageModalFromPopup, initImgPopupEvents } from './modals/image-popup.js';

// ─────────────────────────────────────────────
// WIRE: Register initFrame to break circular deps
// ─────────────────────────────────────────────
setInitFrame(initFrame);

// ─────────────────────────────────────────────
// EXPOSE TO WINDOW (for onclick handlers in HTML)
// ─────────────────────────────────────────────
Object.assign(window, {
  // Theme & Layout
  setTheme, setLayout,
  // File I/O
  openFile, handleFileOpen, saveFile,
  // Clipboard
  copyOutput,
  // Toolbar format
  fmt, fmtBlock, setAlign,
  // Undo/Redo
  doUndo, doRedo,
  // Preview
  applyHtml,
  // Link modal
  openLinkModal, closeLinkModal, insertLink,
  // Link popup
  applyLinkPopup, removeLinkPopup, closeLinkPopup, openLinkModalFromPopup,
  // All links
  openAllLinksModal, closeAllLinksModal, saveAllLinksModal,
  // Image modal
  openImageModal, closeImageModal, insertImage,
  // Image popup
  applyImgPopup, removeImgPopup, closeImgPopup, openImageModalFromPopup,
});

// ─────────────────────────────────────────────
// INIT: Boot sequence
// ─────────────────────────────────────────────

// 1. Apply saved theme
setTheme(localStorage.getItem('hf-theme') || 'light');

// 2. Initialize textarea events
initTextareaEvents();

// 3. Initialize font select handlers
initFontHandlers();

// 4. Initialize resizer
initResizer();

// 5. Initialize modal event listeners
initLinkModalEvents();
initLinkPopupEvents();
initImageModalEvents();
initImgPopupEvents();

// 6. Boot iframe preview
initFrame();

// 7. Keyboard shortcuts (global)
document.addEventListener('keydown', e => {
  const inTA = e.target === textarea;
  if ((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key==='z' && inTA) { e.preventDefault(); doUndo(); }
  if ((e.ctrlKey||e.metaKey) && e.key==='y' && inTA) { e.preventDefault(); doRedo(); }
  if ((e.ctrlKey||e.metaKey) && e.shiftKey && e.key==='z' && inTA) { e.preventDefault(); doRedo(); }
  if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); openLinkModal(); }
});

frame.addEventListener('load', () => {
  if (!frame.contentWindow) return;
  frame.contentWindow.addEventListener('keydown', e => {
    if ((e.ctrlKey||e.metaKey) && !e.shiftKey && e.key==='z') { e.preventDefault(); doUndo(); }
    if ((e.ctrlKey||e.metaKey) && (e.key==='y'||(e.shiftKey&&e.key==='z'))) { e.preventDefault(); doRedo(); }
    if ((e.ctrlKey||e.metaKey) && e.key==='k') { e.preventDefault(); openLinkModal(); }
  });
});

// 8. Unsaved changes warning
window.addEventListener('beforeunload', e => {
  if (textarea.value !== getLastSavedValue()) {
    e.preventDefault(); e.returnValue=''; return '';
  }
});
