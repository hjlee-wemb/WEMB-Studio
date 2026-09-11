/* ── 와이어프레임 선택(구 시작 진입점) ── */

/* ── 와이어프레임 선택(시작 진입점) ──
   시작 시 3가지 레이아웃(2단/3단/모듈=4열 타일)을 보여주고, 고르면 그 배치로 대시보드를 구성한다.
   레이아웃 적용은 화면 구성의 열 수 세그먼트를 재사용(setColumns). */
function initWireframePicker() {
  const modal = document.getElementById('wfModal');
  if (!modal) return;
  /* 진입 화면으로 먼저 표시 — 기존 온보딩은 잠시 가림 */
  document.getElementById('onbd')?.classList.remove('show');
  modal.classList.add('show');
  const applyCols = (nCols) => {
    const btn = document.querySelector('#colCount button[data-c="' + nCols + '"]');
    if (btn) btn.click(); /* 화면 구성의 setColumns 재사용 */
  };
  const close = () => modal.classList.remove('show');
  modal.querySelector('.wfgrid')?.addEventListener('click', (e) => {
    const opt = e.target.closest('.wfopt');
    if (!opt) return;
    applyCols(opt.dataset.cols);
    close();
    if (typeof toast === 'function') toast('선택한 레이아웃으로 화면을 구성했어요. 이제 색을 정해보세요.', { type: 'ok' });
  });
  document.getElementById('wfSkip')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) close();
  });
}
