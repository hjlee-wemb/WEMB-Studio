/* ── 토스트 알림 ── */

/* ============================================================
 *  index2 개선 동작 — 위 UI에 로직 연결
 * ============================================================ */

/* (2) 토스트 — 액션 결과 피드백 (alert 대체, 여러 곳에서 재사용)
   · 오류·경고는 읽을 시간을 더 준다(8초 · 5.2초). 예전엔 모두 3.6초라 긴 오류 문장을 다 읽기 전에 사라졌다.
   · 오류·경고는 role=alert — 화면낭독기가 하던 말을 끊고 바로 읽는다.
   · 마우스를 올리거나 초점이 들어가 있는 동안에는 사라지지 않고, ×로 직접 닫을 수 있다. */
const TOAST_ICONS = {
  ok: '<polyline points="20 6 9 17 4 12"/>',
  warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  err: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
};
/* 사용자가 입력한 이름(프로젝트 · 스냅샷 · 패널 제목)을 메시지에 넣을 때 반드시 거친다.
   토스트 본문은 <b> 강조 때문에 HTML 로 들어가서, 이름에 < 가 있으면 화면이 깨지거나 스크립트가 끼어든다. */
function escHTML(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg, opts) {
  opts = opts || {};
  const type = opts.type || 'info';
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return null;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  if (type === 'err' || type === 'warn') t.setAttribute('role', 'alert');
  const ico = `<svg class="tico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${TOAST_ICONS[type] || TOAST_ICONS.info}</svg>`;
  t.innerHTML = ico + `<span class="tmsg">${msg}</span>` + (opts.kbd ? `<span class="tkbd">${opts.kbd}</span>` : '');
  let done = false;
  let timer = null;
  const dismiss = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    t.classList.add('out');
    setTimeout(() => t.remove(), 300); /* css/base/toast.css 의 퇴장 전환(300ms)이 끝난 뒤 */
  };
  if (opts.undo) {
    const u = document.createElement('button');
    u.type = 'button';
    u.className = 'tundo';
    u.textContent = '되돌리기';
    u.onclick = () => {
      opts.undo();
      dismiss();
    };
    t.appendChild(u);
  }
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'tclose';
  x.setAttribute('aria-label', '알림 닫기');
  x.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  x.onclick = dismiss;
  t.appendChild(x);
  wrap.appendChild(t);
  const dur = opts.dur || (type === 'err' ? 8000 : type === 'warn' ? 5200 : 3600);
  const arm = (ms) => {
    clearTimeout(timer);
    if (!done) timer = setTimeout(dismiss, ms);
  };
  const hold = () => clearTimeout(timer);
  t.addEventListener('mouseenter', hold);
  t.addEventListener('focusin', hold);
  t.addEventListener('mouseleave', () => { if (!t.contains(document.activeElement)) arm(1800); });
  t.addEventListener('focusout', (e) => { if (!t.contains(e.relatedTarget) && !t.matches(':hover')) arm(1800); });
  arm(dur);
  return { dismiss };
}
