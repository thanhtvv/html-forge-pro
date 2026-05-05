// ─────────────────────────────────────────────
// LAYOUT — Split / Code / Preview modes
// ─────────────────────────────────────────────

export function setLayout(m) {
  const lp = document.getElementById('lp');
  const rp = document.getElementById('rp');
  const res = document.getElementById('resizer');
  ['split','code','prev'].forEach(id => document.getElementById('pill-'+id).classList.remove('on'));
  document.getElementById('pill-'+m).classList.add('on');
  if (m==='split') {
    lp.style.display=''; rp.style.display=''; res.style.display='';
    lp.style.width='50%'; lp.style.flex='none'; rp.style.flex='1';
  } else if (m==='code') {
    lp.style.display=''; rp.style.display='none'; res.style.display='none';
    lp.style.width='100%'; lp.style.flex='1';
  } else {
    lp.style.display='none'; rp.style.display=''; res.style.display='none';
    rp.style.flex='1';
  }
}
