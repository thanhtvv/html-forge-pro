// ─────────────────────────────────────────────
// FILE I/O — Open / Save HTML files
// ─────────────────────────────────────────────

import { textarea, getFd, setLastSavedValue } from '../core/refs.js';
import { pushUndo, applyValueToAll } from '../core/undo-redo.js';
import { toast } from './toast.js';

export function openFile() {
  document.getElementById('file-input').click();
}

export function handleFileOpen(e) {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = ev => {
    let c = ev.target.result;
    const bm = c.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bm) c = bm[1].trim();
    pushUndo(); applyValueToAll(c);
    toast('Đã mở: ' + f.name);
  };
  r.readAsText(f,'UTF-8'); e.target.value='';
}

export function saveFile() {
  setLastSavedValue(textarea.value);
  const fd = getFd();
  const body = textarea.value || (fd ? fd.body.innerHTML : '');
  const html = `<!DOCTYPE html>\n<html lang="vi">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Document</title>\n<style>\nbody{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px;line-height:1.8;color:#1a1a2e;padding:20px 24px;margin:0}\nimg{max-width:100%;height:auto}\n<\/style>\n<\/head>\n<body>\n${body}\n<\/body>\n<\/html>`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
  a.download='document.html'; a.click(); URL.revokeObjectURL(a.href);
  toast('Đã lưu document.html ✓');
}
