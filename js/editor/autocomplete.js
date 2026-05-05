// ─────────────────────────────────────────────
// AUTOCOMPLETE — Tag snippet suggestions
// ─────────────────────────────────────────────

import { textarea, acDrop } from '../core/refs.js';
import { pushUndo } from '../core/undo-redo.js';
import { updateHL } from './syntax-highlight.js';
import { scheduleSync } from '../preview/sync.js';

// Positioning constants (match CSS: padding 14px 16px, font 12.5px, line-height 1.75)
const PL = 16;
const CH = 7.5;
const LH = 21.875;

export const SNIPS = [
  {tag:'p',snip:'<p>$</p>',hint:'Đoạn văn'},
  {tag:'h1',snip:'<h1>$</h1>',hint:'Tiêu đề 1'},{tag:'h2',snip:'<h2>$</h2>',hint:'Tiêu đề 2'},
  {tag:'h3',snip:'<h3>$</h3>',hint:'Tiêu đề 3'},{tag:'h4',snip:'<h4>$</h4>',hint:'Tiêu đề 4'},
  {tag:'a',snip:'<a href="$">text</a>',hint:'Liên kết'},
  {tag:'img',snip:'<img src="$" alt="">',hint:'Hình ảnh'},
  {tag:'strong',snip:'<strong>$</strong>',hint:'In đậm'},{tag:'em',snip:'<em>$</em>',hint:'In nghiêng'},
  {tag:'mark',snip:'<mark>$</mark>',hint:'Highlight'},
  {tag:'ul',snip:'<ul>\n  <li>$</li>\n</ul>',hint:'Danh sách'},
  {tag:'ol',snip:'<ol>\n  <li>$</li>\n</ol>',hint:'Danh sách số'},
  {tag:'li',snip:'<li>$</li>',hint:'Mục list'},
  {tag:'div',snip:'<div>$</div>',hint:'Khối div'},{tag:'span',snip:'<span>$</span>',hint:'Inline span'},
  {tag:'table',snip:'<table>\n  <tr>\n    <th>$</th>\n  </tr>\n  <tr>\n    <td></td>\n  </tr>\n</table>',hint:'Bảng'},
  {tag:'blockquote',snip:'<blockquote>\n  $\n</blockquote>',hint:'Trích dẫn'},
  {tag:'pre',snip:'<pre>$</pre>',hint:'Code khối'},{tag:'code',snip:'<code>$</code>',hint:'Code inline'},
  {tag:'br',snip:'<br>',hint:'Xuống dòng'},{tag:'hr',snip:'<hr>',hint:'Đường kẻ'},
  {tag:'figure',snip:'<figure class="image">\n  <img src="$" alt="">\n  <figcaption></figcaption>\n</figure>',hint:'Hình+chú thích'},
  {tag:'section',snip:'<section>\n  $\n</section>',hint:'Section'},
  {tag:'article',snip:'<article>\n  $\n</article>',hint:'Article'},
  {tag:'nav',snip:'<nav>\n  $\n</nav>',hint:'Navigation'},
  {tag:'header',snip:'<header>\n  $\n</header>',hint:'Header'},
  {tag:'footer',snip:'<footer>\n  $\n</footer>',hint:'Footer'},
  {tag:'button',snip:'<button>$</button>',hint:'Nút bấm'},
  {tag:'input',snip:'<input type="text" placeholder="$">',hint:'Ô nhập liệu'},
  {tag:'iframe',snip:'<iframe src="$" width="600" height="400"></iframe>',hint:'Nhúng iframe'},
  {tag:'video',snip:'<video src="$" controls></video>',hint:'Video'},
  {tag:'sup',snip:'<sup>$</sup>',hint:'Chỉ số trên'},{tag:'sub',snip:'<sub>$</sub>',hint:'Chỉ số dưới'},
];

let acList = [], acIdx = -1;

export function getTyping() {
  const pos = textarea.selectionStart;
  const m = textarea.value.slice(0, pos).match(/<([a-zA-Z0-9-]*)$/);
  return m ? m[1].toLowerCase() : null;
}

export function showAC(q) {
  const f = SNIPS.filter(s => s.tag.startsWith(q));
  if (!f.length) { hideAC(); return; }
  acList = f; acIdx = 0;
  acDrop.innerHTML = f.map((s, i) =>
    `<div class="ac-item${i===0?' sel':''}" data-i="${i}"><span class="ac-tag">&lt;${s.tag}&gt;</span><span class="ac-hint">${s.hint}</span></div>`
  ).join('');
  const r = textarea.getBoundingClientRect();
  const lines = textarea.value.slice(0, textarea.selectionStart).split('\n');
  const cx = Math.min(r.left + PL + lines[lines.length-1].length * CH, window.innerWidth - 320);
  const cy = Math.min(r.top + lines.length * LH - textarea.scrollTop + 4, window.innerHeight - 240);
  acDrop.style.left = cx + 'px'; acDrop.style.top = cy + 'px';
  acDrop.classList.add('show');
  acDrop.querySelectorAll('.ac-item').forEach((el,i) =>
    el.addEventListener('mousedown', e => { e.preventDefault(); applyAC(i); })
  );
}

export function hideAC() { acDrop.classList.remove('show'); acList = []; acIdx = -1; }

export function moveAC(d) {
  if (!acList.length) return;
  acIdx = (acIdx + d + acList.length) % acList.length;
  acDrop.querySelectorAll('.ac-item').forEach((el,i) => el.classList.toggle('sel', i===acIdx));
  acDrop.querySelectorAll('.ac-item')[acIdx]?.scrollIntoView({block:'nearest'});
}

export function applyAC(i) {
  if (i === undefined) i = acIdx;
  if (i < 0 || !acList[i]) { hideAC(); return; }
  const snip = acList[i].snip;
  const pos = textarea.selectionStart;
  const before = textarea.value.slice(0, pos), after = textarea.value.slice(pos);
  const lt = before.lastIndexOf('<');
  if (lt === -1) { hideAC(); return; }
  const ci = snip.indexOf('$'), clean = snip.replace('$','');
  pushUndo();
  textarea.value = before.slice(0, lt) + clean + after;
  const nc = lt + (ci >= 0 ? ci : clean.length);
  textarea.setSelectionRange(nc, nc);
  updateHL(); scheduleSync(); hideAC(); textarea.focus();
}
