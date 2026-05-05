// ─────────────────────────────────────────────
// IFRAME — Preview frame management
// ─────────────────────────────────────────────

import { textarea, frame, getFd, setFd } from '../core/refs.js';
import { withSyncLock, isSyncLocked } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML, deepCleanHTML } from '../core/sanitizer.js';
import { pushUndo, debouncedPushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { attachMutationObserver } from './mutation-observer.js';
import { toast } from '../ui/toast.js';
import { openLinkPopup, closeLinkPopup } from '../modals/link-popup.js';
import { openImgPopup, closeImgPopup } from '../modals/image-popup.js';
import { updateToolbarState } from '../toolbar/format-commands.js';

export function buildDoc(body) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.8;color:#1a1a2e;padding:20px 24px;margin:0;word-wrap:break-word;background:#fff;min-height:100vh}
h1,h2,h3,h4,h5,h6{line-height:1.3;margin:.8em 0 .4em;font-weight:700}h2{font-size:1.25em}h3{font-size:1.1em}
p{margin:.5em 0}a{color:#2563eb;text-decoration:none;cursor:pointer}a:hover{text-decoration:underline}
strong{font-weight:700}img{max-width:100%;height:auto;display:block;margin:8px auto;border-radius:4px}
figure{margin:16px 0;text-align:center}figcaption{font-size:13px;color:#6b7280;margin-top:6px;font-style:italic}
ul,ol{padding-left:1.6em;margin:.5em 0}li{margin:.25em 0}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #e5e7eb;padding:8px 12px}th{background:#f9fafb;font-weight:600}
pre,code{font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px}pre{padding:12px;overflow-x:auto}
blockquote{border-left:3px solid #6366f1;margin:1em 0;padding:4px 16px;color:#6b7280}
<\/style><\/head><body contenteditable="true" spellcheck="false">${body||''}<\/body><\/html>`;
}

export function initFrame() {
  frame.srcdoc = buildDoc('');
  frame.onload = () => {
    const fd = frame.contentDocument || frame.contentWindow.document;
    setFd(fd);
    fd.execCommand('defaultParagraphSeparator', false, 'p');
    fd.execCommand('styleWithCSS', false, false);

    // iframe → textarea (with lock + DOM sanitize + cleanHTML)
    fd.body.addEventListener('input', () => {
      if (isSyncLocked()) return;
      withSyncLock(() => {
        sanitizeDOMAttrs(fd.body);
        const newVal = cleanHTML(fd.body.innerHTML);
        if (newVal !== textarea.value) {
          debouncedPushUndo();
          textarea.value = newVal;
          updateHL();
        }
      });
    });

    attachMutationObserver();
    attachFrameEvents();

    if (textarea.value) {
      withSyncLock(() => { fd.body.innerHTML = textarea.value; });
    }
  };
}

export function attachFrameEvents() {
  const fd = getFd();
  if (!fd) return;

  fd.body.addEventListener('click', function(e) {
    const img = e.target.closest('img');
    if (img) {
      e.preventDefault(); e.stopPropagation();
      closeLinkPopup();
      openImgPopup(img, e);
      return;
    }
    const a = e.target.closest('a');
    if (a) {
      e.preventDefault(); e.stopPropagation();
      closeImgPopup();
      try {
        const win = frame.contentWindow;
        const sel = win.getSelection();
        const r = fd.createRange();
        r.selectNodeContents(a);
        sel.removeAllRanges();
        sel.addRange(r);
      } catch(_) {}
      openLinkPopup(a, e);
      updateToolbarState();
      return;
    }
    closeLinkPopup();
    closeImgPopup();
  }, true);

  fd.addEventListener('selectionchange', () => {
    updateToolbarState();
  });

  // Paste vào preview: intercept HTML và ảnh
  fd.body.addEventListener('paste', function(e) {
    const cd = e.clipboardData || e.originalEvent.clipboardData;
    const items = Array.from(cd.items);

    // 1. Ảnh → paste base64
    const imgItem = items.find(i => i.type.startsWith('image/'));
    if (imgItem) {
      e.preventDefault();
      const file = imgItem.getAsFile();
      if (!file) return;
      if (file.size > 3 * 1024 * 1024) { toast('⚠️ Hình quá lớn (tối đa 3MB)'); return; }
      const reader = new FileReader();
      reader.onload = function(ev) {
        const base64 = ev.target.result;
        pushUndo();
        const imgTag = `<img src="${base64}" alt="" style="max-width:100%" loading="lazy">`;
        const sel = frame.contentWindow.getSelection();
        if (sel && sel.rangeCount) {
          const r = sel.getRangeAt(0);
          if (!r.collapsed) r.deleteContents();
          const tmp = fd.createElement('span');
          tmp.innerHTML = imgTag;
          const frag = fd.createDocumentFragment();
          while (tmp.firstChild) frag.appendChild(tmp.firstChild);
          r.insertNode(frag); r.collapse(false);
          sel.removeAllRanges(); sel.addRange(r);
        } else { fd.execCommand('insertHTML', false, imgTag); }
        withSyncLock(() => {
          sanitizeDOMAttrs(fd.body);
          const newVal = cleanHTML(fd.body.innerHTML);
          pushUndo(newVal); textarea.value = newVal; updateHL();
        });
        toast('Đã paste hình ảnh ✓');
      };
      reader.readAsDataURL(file);
      return;
    }

    // 2. HTML text → intercept, clean, insert sạch
    const htmlData = cd.getData('text/html');
    if (htmlData && htmlData.trim()) {
      e.preventDefault();
      pushUndo();
      const cleaned = deepCleanHTML(htmlData);
      const sel = frame.contentWindow.getSelection();
      if (sel && sel.rangeCount) {
        const r = sel.getRangeAt(0);
        if (!r.collapsed) r.deleteContents();
        const tmp = fd.createElement('div');
        tmp.innerHTML = cleaned;
        const frag = fd.createDocumentFragment();
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
        r.insertNode(frag); r.collapse(false);
        sel.removeAllRanges(); sel.addRange(r);
      } else { fd.execCommand('insertHTML', false, cleaned); }
      withSyncLock(() => {
        sanitizeDOMAttrs(fd.body);
        const newVal = cleanHTML(fd.body.innerHTML);
        pushUndo(newVal); textarea.value = newVal; updateHL();
      });
      toast('Tự động chuẩn hóa HTML ✓');
      return;
    }
    // 3. Plain text → để browser xử lý tự nhiên
  });
}
