// ─────────────────────────────────────────────
// LINK MODAL — Insert / Edit link
// ─────────────────────────────────────────────

import { frame, getFd, getInitFrame } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML } from '../core/sanitizer.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { toast } from '../ui/toast.js';

let editingAnchor = null;
let _savedSelData = null;

export function setEditingAnchor(val) { editingAnchor = val; }
export function getEditingAnchor() { return editingAnchor; }

function ensureFrame() {
  if (!getFd()) { const fn = getInitFrame(); if (fn) fn(); }
}

export function saveSel() {
  const fd = getFd();
  if (!fd) return;
  const s = frame.contentWindow.getSelection();
  if (!s || !s.rangeCount) { _savedSelData=null; return; }
  const r = s.getRangeAt(0);
  _savedSelData = { sc:r.startContainer, so:r.startOffset, ec:r.endContainer, eo:r.endOffset };
}

export function restSel() {
  const fd = getFd();
  if (!fd || !_savedSelData) return;
  try {
    frame.contentWindow.focus();
    const s = frame.contentWindow.getSelection();
    s.removeAllRanges();
    const r = fd.createRange();
    r.setStart(_savedSelData.sc, _savedSelData.so);
    r.setEnd(_savedSelData.ec, _savedSelData.eo);
    s.addRange(r);
  } catch(e) { _savedSelData=null; }
}

function updLP() {
  const url=document.getElementById('m-url').value.trim();
  const text=document.getElementById('m-text').value.trim();
  const title=document.getElementById('m-title').value.trim();
  const blank=document.getElementById('m-blank').checked;
  const strong=document.getElementById('m-strong').checked;
  const pr=document.getElementById('m-preview');
  if (!url&&!text){pr.textContent='—';return}
  const inner=strong?`&lt;strong&gt;${text||url}&lt;/strong&gt;`:(text||url);
  pr.innerHTML=`&lt;a href="${url||'#'}"${title?` title="${title}"`:''}${blank?' target="_blank"':''}&gt;${inner}&lt;/a&gt;`;
}

function getSelectedAnchor() {
  const fd = getFd();
  if (!fd) return null;
  const sel = frame.contentWindow.getSelection();
  if (!sel||!sel.rangeCount) return null;
  let n = sel.getRangeAt(0).commonAncestorContainer;
  if (n.nodeType===3) n=n.parentNode;
  return (n&&n.closest)?n.closest('a'):null;
}

export function openLinkModal() {
  ensureFrame();
  const fd = getFd();
  editingAnchor=null; saveSel();
  const existingA=getSelectedAnchor();
  if (existingA) {
    editingAnchor=existingA;
    document.getElementById('m-text').value=existingA.textContent.trim();
    document.getElementById('m-url').value=existingA.getAttribute('href')||'';
    document.getElementById('m-title').value=existingA.getAttribute('title')||'';
    document.getElementById('m-blank').checked=existingA.getAttribute('target')==='_blank';
    document.getElementById('m-strong').checked=!!existingA.querySelector('strong');
  } else {
    const sel=frame.contentWindow.getSelection();
    const st=sel?sel.toString().trim():'';
    document.getElementById('m-text').value=st;
    document.getElementById('m-url').value='';
    document.getElementById('m-title').value='';
    document.getElementById('m-blank').checked=true;
    document.getElementById('m-strong').checked=false;
  }
  updLP();
  const isEdit=!!editingAnchor;
  document.getElementById('modal-title-text').textContent=isEdit?'Chỉnh sửa liên kết':'Chèn liên kết';
  document.querySelector('#link-modal .mbtn.ok').textContent=isEdit?'Lưu thay đổi':'Chèn liên kết';
  document.getElementById('link-modal').classList.add('show');
  setTimeout(()=>document.getElementById('m-url').focus(),60);
}

export function closeLinkModal() {
  document.getElementById('link-modal').classList.remove('show');
  editingAnchor=null;
}

export function insertLink() {
  const fd = getFd();
  const url=document.getElementById('m-url').value.trim();
  const text=document.getElementById('m-text').value.trim();
  const title=document.getElementById('m-title').value.trim();
  const blank=document.getElementById('m-blank').checked;
  const strong=document.getElementById('m-strong').checked;
  if (!url) {
    document.getElementById('m-url').style.borderColor='#ff453a';
    setTimeout(()=>document.getElementById('m-url').style.borderColor='',1500);
    return;
  }
  closeLinkModal(); ensureFrame(); pushUndo();
  if (editingAnchor) {
    editingAnchor.setAttribute('href', url);
    if (title) editingAnchor.setAttribute('title', title); else editingAnchor.removeAttribute('title');
    if (blank) editingAnchor.setAttribute('target', '_blank'); else editingAnchor.removeAttribute('target');
    const d = text || url;
    editingAnchor.innerHTML = strong ? `<strong>${d}</strong>` : d;
    editingAnchor = null;
    toast('Đã cập nhật liên kết ✓');
  } else {
    restSel();
    const inner = strong ? `<strong>${text||url}</strong>` : (text||url);
    const titleAttr = title ? ` title="${title.replace(/"/g,'&quot;')}"` : '';
    const blankAttr = blank ? ' target="_blank"' : '';
    const lh = `<a href="${url}"${titleAttr}${blankAttr}>${inner}</a>`;
    const sel = frame.contentWindow.getSelection();
    if (sel && sel.rangeCount) {
      const r = sel.getRangeAt(0);
      let n = r.commonAncestorContainer;
      if (n.nodeType === 3) n = n.parentNode;
      const existA = n.closest ? n.closest('a') : null;
      if (existA) {
        existA.setAttribute('href', url);
        if (title) existA.setAttribute('title', title); else existA.removeAttribute('title');
        if (blank) existA.setAttribute('target', '_blank'); else existA.removeAttribute('target');
        const d2 = text || url;
        existA.innerHTML = strong ? `<strong>${d2}</strong>` : d2;
      } else {
        if (!r.collapsed) r.deleteContents();
        const tmp = fd.createElement('span');
        tmp.innerHTML = lh;
        const frag = fd.createDocumentFragment();
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
        r.insertNode(frag);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    } else {
      frame.contentWindow.focus();
      fd.execCommand('insertHTML', false, lh);
    }
    toast('Đã chèn liên kết ✓');
  }
  withSyncLock(() => {
    const fd = getFd();
    sanitizeDOMAttrs(fd.body);
    const newVal = cleanHTML(fd.body.innerHTML);
    pushUndo(newVal); textarea.value = newVal; updateHL();
  });
}

// Event listeners for link modal
export function initLinkModalEvents() {
  ['m-url','m-text','m-title'].forEach(id=>document.getElementById(id).addEventListener('input',updLP));
  ['m-blank','m-strong'].forEach(id=>document.getElementById(id).addEventListener('change',updLP));

  document.getElementById('link-modal').addEventListener('click',function(e){if(e.target===this)closeLinkModal()});
  document.getElementById('link-modal').addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.tagName!=='BUTTON')insertLink();
    if(e.key==='Escape')closeLinkModal();
  });
}
