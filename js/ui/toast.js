/* ── 토스트 알림 ── */

/* ============================================================
 *  index2 개선 동작 — 위 UI에 로직 연결
 * ============================================================ */

/* (2) 토스트 — 액션 결과 피드백 (alert 대체, 여러 곳에서 재사용) */
const TOAST_ICONS = {
  ok: '<polyline points="20 6 9 17 4 12"/>',
  warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  err: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
};
function toast(msg, opts) {
  opts = opts || {};
  const type = opts.type || 'info';
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const ico = `<svg class="tico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${TOAST_ICONS[type] || TOAST_ICONS.info}</svg>`;
  t.innerHTML = ico + `<span class="tmsg">${msg}</span>` + (opts.kbd ? `<span class="tkbd">${opts.kbd}</span>` : '');
  if (opts.undo) {
    const u = document.createElement('button');
    u.className = 'tundo';
    u.textContent = '되돌리기';
    u.onclick = () => {
      opts.undo();
      dismiss();
    };
    t.appendChild(u);
  }
  wrap.appendChild(t);
  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    t.classList.add('out');
    setTimeout(() => t.remove(), 220);
  };
  setTimeout(dismiss, opts.dur || 3600);
}
