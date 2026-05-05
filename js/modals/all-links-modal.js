// ─────────────────────────────────────────────
// ALL LINKS MODAL — Manage all links at once
// ─────────────────────────────────────────────

import { textarea, getFd } from '../core/refs.js';
import { withSyncLock } from '../core/sync-lock.js';
import { sanitizeDOMAttrs, cleanHTML } from '../core/sanitizer.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from '../editor/syntax-highlight.js';
import { toast } from '../ui/toast.js';

let allLinksCache = [];

export function openAllLinksModal() {
  const fd = getFd();
  if (!fd) return;
  const listContainer = document.getElementById('all-links-list');
  listContainer.innerHTML = '';
  const links = fd.body.querySelectorAll('a');
  allLinksCache = [];
  if (links.length === 0) {
    listContainer.innerHTML = '<div style="color:var(--text3);font-size:12px;text-align:center;padding:20px">Không có liên kết nào trong bài viết.</div>';
  } else {
    links.forEach((a, idx) => {
      allLinksCache.push(a);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;flex-direction:column;gap:8px;background:var(--glass-subtle);border:1px solid var(--glass-border2);padding:14px;border-radius:var(--radius-lg)';
      const href = a.getAttribute('href') || '';
      const text = a.textContent.trim();
      const title = a.getAttribute('title') || '';
      const isBlank = a.getAttribute('target') === '_blank';
      const isStrong = !!a.querySelector('strong');
      row.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><div style="font-size:11px;color:var(--text3);font-weight:700;text-transform:uppercase;letter-spacing:0.05em">Liên kết #${idx+1}</div><div style="display:flex;gap:12px"><label style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text2);cursor:pointer"><input type="checkbox" class="mck all-link-blank" data-idx="${idx}" ${isBlank?'checked':''}> _blank</label><label style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text2);cursor:pointer"><input type="checkbox" class="mck all-link-strong" data-idx="${idx}" ${isStrong?'checked':''}> bold</label></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label class="mlabel" style="font-size:9px;margin-bottom:3px">Văn bản</label><input type="text" class="minput all-link-text" data-idx="${idx}" value="${text.replace(/"/g,'&quot;')}" placeholder="Văn bản hiển thị..." style="margin-bottom:0;padding:6px 10px;font-size:12px"></div><div><label class="mlabel" style="font-size:9px;margin-bottom:3px">URL</label><input type="url" class="minput all-link-url" data-idx="${idx}" value="${href.replace(/"/g,'&quot;')}" placeholder="https://..." style="margin-bottom:0;padding:6px 10px;font-size:12px"></div></div><div><label class="mlabel" style="font-size:9px;margin-bottom:3px">Tiêu đề (title)</label><input type="text" class="minput all-link-title" data-idx="${idx}" value="${title.replace(/"/g,'&quot;')}" placeholder="Mô tả khi hover..." style="margin-bottom:0;padding:6px 10px;font-size:12px"></div>`;
      listContainer.appendChild(row);
    });
    listContainer.querySelectorAll('.all-link-url').forEach(input => {
      input.addEventListener('input', checkDups);
    });
    checkDups();
  }
  document.getElementById('all-links-modal').classList.add('show');
}

function checkDups() {
  const inputs = document.querySelectorAll('.all-link-url');
  const urls = Array.from(inputs).map(i => i.value.trim().toLowerCase()).filter(v => v !== '' && v !== '#');
  const counts = {};
  urls.forEach(u => counts[u] = (counts[u] || 0) + 1);
  inputs.forEach(input => {
    const val = input.value.trim().toLowerCase();
    const row = input.parentElement.parentElement.parentElement;
    if (val !== '' && val !== '#' && counts[val] > 1) {
      row.style.borderColor = '#ff453a';
      row.style.background = 'rgba(255, 69, 58, 0.08)';
      if (!row.querySelector('.dup-tag')) {
        const tag = document.createElement('div');
        tag.className = 'dup-tag';
        tag.style.cssText = 'font-size:10px;color:#ff453a;font-weight:700;margin-top:4px;display:flex;align-items:center;gap:4px';
        tag.innerHTML = '<svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="5"/><line x1="6" y1="4" x2="6" y2="6"/><line x1="6" y1="8" x2="6.01" y2="8"/></svg> Trùng liên kết';
        input.parentElement.appendChild(tag);
      }
    } else {
      row.style.borderColor = 'var(--glass-border2)';
      row.style.background = 'var(--glass-subtle)';
      const t = row.querySelector('.dup-tag');
      if (t) t.remove();
    }
  });
}

export function closeAllLinksModal() {
  document.getElementById('all-links-modal').classList.remove('show');
  allLinksCache = [];
}

export function saveAllLinksModal() {
  const fd = getFd();
  if (!fd) return;
  let changed = false;
  pushUndo();
  allLinksCache.forEach((a, idx) => {
    const href = document.querySelector(`.all-link-url[data-idx="${idx}"]`).value.trim();
    const text = document.querySelector(`.all-link-text[data-idx="${idx}"]`).value.trim();
    const title = document.querySelector(`.all-link-title[data-idx="${idx}"]`).value.trim();
    const isBlank = document.querySelector(`.all-link-blank[data-idx="${idx}"]`).checked;
    const isStrong = document.querySelector(`.all-link-strong[data-idx="${idx}"]`).checked;
    if (a) {
      if (href !== (a.getAttribute('href')||'')) { if (href) a.setAttribute('href', href); else a.removeAttribute('href'); changed = true; }
      if (title !== (a.getAttribute('title')||'')) { if (title) a.setAttribute('title', title); else a.removeAttribute('title'); changed = true; }
      if (isBlank !== (a.getAttribute('target')==='_blank')) { if (isBlank) a.setAttribute('target','_blank'); else a.removeAttribute('target'); changed = true; }
      const inner = isStrong ? `<strong>${text||href}</strong>` : (text||href);
      if (a.innerHTML !== inner) { a.innerHTML = inner; changed = true; }
    }
  });
  if (changed) {
    withSyncLock(() => {
      sanitizeDOMAttrs(fd.body);
      const newVal = cleanHTML(fd.body.innerHTML);
      pushUndo(newVal); textarea.value = newVal; updateHL();
    });
    toast('Đã cập nhật tất cả links ✓');
  }
  closeAllLinksModal();
}
