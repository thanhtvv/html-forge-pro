// ─────────────────────────────────────────────
// TEXTAREA EVENT HANDLERS
// ─────────────────────────────────────────────

import { textarea } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { deepCleanHTML } from '../core/sanitizer.js';
import { pushUndo, debouncedPushUndo } from '../core/undo-redo.js';
import { updateHL } from './syntax-highlight.js';
import { showAC, hideAC, moveAC, applyAC, getTyping } from './autocomplete.js';
import { scheduleSync } from '../preview/sync.js';
import { getFd } from '../core/refs.js';
import { toast } from '../ui/toast.js';

const acDrop = document.getElementById('ac-drop');

export function initTextareaEvents() {
  textarea.addEventListener('keydown', e => {
    if (acDrop.classList.contains('show')) {
      if (e.key==='ArrowDown'){e.preventDefault();moveAC(1);return}
      if (e.key==='ArrowUp'){e.preventDefault();moveAC(-1);return}
      if (e.key==='Enter'||e.key==='Tab'){e.preventDefault();applyAC();return}
      if (e.key==='Escape'){hideAC();return}
    }
    if (e.key==='Tab'&&!acDrop.classList.contains('show')){
      e.preventDefault();
      const s=textarea.selectionStart,end=textarea.selectionEnd;
      pushUndo();
      textarea.value=textarea.value.slice(0,s)+'  '+textarea.value.slice(end);
      textarea.setSelectionRange(s+2,s+2); updateHL();
    }
  });

  textarea.addEventListener('input', () => {
    debouncedPushUndo(); updateHL(); scheduleSync();
    const q = getTyping();
    const ch = textarea.value[textarea.selectionStart-1-(q?q.length:0)];
    if (q!==null && ch==='<') showAC(q);
    else if (q!==null && acDrop.classList.contains('show')) showAC(q);
    else hideAC();
  });

  document.addEventListener('click', e => {
    if (!acDrop.contains(e.target) && e.target!==textarea) hideAC();
  });

  // Paste vào textarea: deep clean HTML
  textarea.addEventListener('paste', () => {
    setTimeout(() => {
      const original = textarea.value;
      const cleaned = deepCleanHTML(original);
      if (cleaned !== original) {
        const fd = getFd();
        withSyncLock(() => {
          pushUndo(cleaned);
          textarea.value = cleaned;
          updateHL();
          if (fd && fd.body) fd.body.innerHTML = cleaned;
        });
        toast('Tự động chuẩn hóa HTML ✓');
      }
    }, 50);
  });
}
