// ─────────────────────────────────────────────
// IMAGE MODAL — Insert / Edit images
// ─────────────────────────────────────────────

import { textarea, frame, getFd, getInitFrame } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML } from '../core/sanitizer.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { toast } from '../ui/toast.js';
import { saveSel, restSel } from './link-modal.js';

let editingImg = null;
export function setEditingImg(val) { editingImg = val; }

function ensureFrame() { if (!getFd()) { const fn = getInitFrame(); if (fn) fn(); } }

export function buildImgHTML() {
  const src = document.getElementById('im-src').value.trim();
  const alt = document.getElementById('im-alt').value.trim();
  const title = document.getElementById('im-title').value.trim();
  const lazy = document.getElementById('im-lazy').checked;
  const fig = document.getElementById('im-figure').checked;
  const cap = document.getElementById('im-caption').value.trim();
  if (!src) return '';
  let attrs = `src="${src}" alt="${alt.replace(/"/g,'&quot;')}"`;
  if (title) attrs += ` title="${title.replace(/"/g,'&quot;')}"`;
  attrs += ' style="max-width:100%"';
  if (lazy) attrs += ' loading="lazy"';
  const imgTag = `<img ${attrs}>`;
  if (fig) {
    return cap ? `<figure>\n  ${imgTag}\n  <figcaption>${cap}</figcaption>\n</figure>` : `<figure>\n  ${imgTag}\n</figure>`;
  }
  return imgTag;
}

function updateImgPreview() {
  const src = document.getElementById('im-src').value.trim();
  const box = document.getElementById('im-preview-box');
  const pi = document.getElementById('im-preview-img');
  if (src) { pi.src = src; box.style.display = 'block'; }
  else { box.style.display = 'none'; pi.src = ''; }
  document.getElementById('im-code-preview').textContent = buildImgHTML();
}

function getSelectedImg() {
  const fd = getFd();
  if (!fd) return null;
  const sel = frame.contentWindow.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (r.startContainer.nodeType === 1 && r.startContainer.childNodes[r.startOffset]) {
    const el = r.startContainer.childNodes[r.startOffset];
    if (el.tagName === 'IMG') return el;
    if (el.tagName === 'FIGURE') return el.querySelector('img');
  }
  let n = r.commonAncestorContainer;
  if (n.nodeType === 3) n = n.parentNode;
  if (n && n.closest) {
    if (n.closest('img')) return n.closest('img');
    if (n.closest('figure')) return n.closest('figure').querySelector('img');
  }
  return null;
}

export function openImageModal(prefill) {
  ensureFrame();
  editingImg = null; saveSel();
  if (prefill && prefill.el) {
    editingImg = prefill.el;
  } else {
    const existingImg = getSelectedImg();
    if (existingImg) {
      const fig = existingImg.closest('figure');
      const cap = fig ? (fig.querySelector('figcaption') || {}).textContent || '' : '';
      editingImg = fig || existingImg;
      prefill = { src: existingImg.getAttribute('src')||'', alt: existingImg.getAttribute('alt')||'', title: existingImg.getAttribute('title')||'', lazy: existingImg.getAttribute('loading')==='lazy', fig: !!fig, cap };
    }
  }
  const p = prefill || {};
  document.getElementById('im-src').value = p.src || '';
  document.getElementById('im-alt').value = p.alt || '';
  document.getElementById('im-title').value = p.title || '';
  document.getElementById('im-lazy').checked = p.lazy !== false;
  const useFig = p.fig !== undefined ? p.fig : true;
  document.getElementById('im-figure').checked = useFig;
  document.getElementById('im-caption').value = p.cap || '';
  document.getElementById('im-caption-wrap').style.display = useFig ? 'block' : 'none';
  document.getElementById('im-code-preview').textContent = '';
  document.getElementById('im-preview-box').style.display = p.src ? 'block' : 'none';
  if (p.src) document.getElementById('im-preview-img').src = p.src;
  document.getElementById('img-modal-title').textContent = editingImg ? 'Chỉnh sửa hình ảnh' : 'Chèn hình ảnh';
  document.getElementById('im-ok-btn').textContent = editingImg ? 'Lưu thay đổi' : 'Chèn hình ảnh';
  document.getElementById('img-modal').classList.add('show');
  setTimeout(() => document.getElementById('im-src').focus(), 60);
  updateImgPreview();
}

export function closeImageModal() {
  document.getElementById('img-modal').classList.remove('show');
  editingImg = null;
}

export function insertImage() {
  const fd = getFd();
  const markup = buildImgHTML();
  if (!markup) {
    document.getElementById('im-src').style.borderColor = '#ff453a';
    setTimeout(() => document.getElementById('im-src').style.borderColor = '', 1500);
    return;
  }
  const targetImg = editingImg;
  closeImageModal(); ensureFrame(); pushUndo();
  if (targetImg) {
    const tmp = fd.createElement('span');
    tmp.innerHTML = markup;
    targetImg.parentNode.replaceChild(tmp.firstChild, targetImg);
    toast('Đã cập nhật hình ảnh ✓');
  } else {
    restSel();
    const sel = frame.contentWindow.getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      if (!r.collapsed) r.deleteContents();
      const tmp = fd.createElement('span');
      tmp.innerHTML = markup;
      const frag = fd.createDocumentFragment();
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      r.insertNode(frag); r.collapse(false);
      sel.removeAllRanges(); sel.addRange(r);
    } else {
      frame.contentWindow.focus();
      fd.execCommand('insertHTML', false, markup);
    }
    toast('Đã chèn hình ảnh ✓');
  }
  withSyncLock(() => {
    const fd2 = getFd();
    sanitizeDOMAttrs(fd2.body);
    const newVal = cleanHTML(fd2.body.innerHTML);
    pushUndo(newVal); textarea.value = newVal; updateHL();
  });
}

export function initImageModalEvents() {
  document.getElementById('im-figure').addEventListener('change', function() {
    document.getElementById('im-caption-wrap').style.display = this.checked ? 'block' : 'none';
    updateImgPreview();
  });
  ['im-src','im-alt','im-title','im-lazy','im-caption'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateImgPreview);
  });
  document.getElementById('img-modal').addEventListener('click', function(e) {
    if (e.target === this) closeImageModal();
  });
  document.getElementById('img-modal').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') insertImage();
    if (e.key === 'Escape') closeImageModal();
  });
}
