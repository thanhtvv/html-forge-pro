// ─────────────────────────────────────────────
// TOOLBAR FORMAT COMMANDS
// ─────────────────────────────────────────────

import { textarea, frame, getFd, getInitFrame } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML } from '../core/sanitizer.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { pullFromFrame } from '../preview/sync.js';

function ensureFrame() {
  const fd = getFd();
  if (!fd) {
    const initFrame = getInitFrame();
    if (initFrame) initFrame();
  }
}

export function fmt(cmd, val) {
  ensureFrame();
  const fd = getFd();
  frame.contentWindow.focus();
  fd.execCommand(cmd, false, val || null);
  setTimeout(() => { withSyncLock(pullFromFrame); }, 20);
}

export function fmtBlock(tag) {
  if (!tag) return;
  ensureFrame();
  const fd = getFd();
  frame.contentWindow.focus();
  fd.execCommand('formatBlock', false, tag);
  setTimeout(() => { withSyncLock(pullFromFrame); }, 20);
}

export function setAlign(dir) {
  ensureFrame();
  const fd = getFd();
  frame.contentWindow.focus();
  const win = frame.contentWindow;
  const sel = win.getSelection();
  if (!sel || !sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const BL = ['P','H1','H2','H3','H4','H5','H6','LI','DIV','TD','TH','BLOCKQUOTE','PRE'];
  const getB = node => {
    if (!node) return null;
    if (node.nodeType===1 && BL.includes(node.nodeName)) return node;
    return getB(node.parentNode);
  };
  const applyToBlock = b => { if (b) b.style.textAlign = dir; };
  if (range.collapsed) {
    applyToBlock(getB(range.commonAncestorContainer));
  } else {
    const sb = getB(range.startContainer), eb = getB(range.endContainer);
    if (sb === eb) {
      applyToBlock(sb);
    } else {
      const root = range.commonAncestorContainer.nodeType===3
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;
      const w = fd.createTreeWalker(root, NodeFilter.SHOW_ELEMENT,
        { acceptNode: n => BL.includes(n.nodeName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
      let n;
      while ((n = w.nextNode())) if (range.intersectsNode(n)) n.style.textAlign = dir;
      applyToBlock(sb); applyToBlock(eb);
    }
  }
  withSyncLock(() => {
    sanitizeDOMAttrs(fd.body);
    const newVal = cleanHTML(fd.body.innerHTML);
    pushUndo(newVal);
    textarea.value = newVal;
    updateHL();
  });
  ['jl','jc','jr','jj'].forEach(id => document.getElementById('tb-'+id).classList.remove('hl'));
  const map = {left:'jl',center:'jc',right:'jr',justify:'jj'};
  if (map[dir]) document.getElementById('tb-'+map[dir]).classList.add('hl');
}

export function updateToolbarState() {
  const fd = getFd();
  if (!fd) return;
  try {
    ['bold','italic','underline'].forEach((c,i) =>
      document.getElementById(['tb-bold','tb-italic','tb-under'][i]).classList.toggle('hl', fd.queryCommandState(c))
    );
  } catch(e) {}
}
