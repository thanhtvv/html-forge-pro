// ─────────────────────────────────────────────
// THEME — Light / Dark toggle
// ─────────────────────────────────────────────

export function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.getElementById('btn-light').classList.toggle('active', t === 'light');
  document.getElementById('btn-dark').classList.toggle('active', t === 'dark');
  localStorage.setItem('hf-theme', t);
}
