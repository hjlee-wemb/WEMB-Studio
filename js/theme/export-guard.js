/* ── 내보내기 대비 가드 ── */

/* (2-b) 내보내기 대비 가드 — 미달이 있으면 모달 상단에 경고 */
function updateExportGuard() {
  const guard = document.getElementById('exGuard');
  if (!guard) return;
  let fails = 0;
  try {
    fails = contrastRows(captureTheme()).filter((r) => !r.pass).length;
  } catch (e) {}
  if (fails > 0) {
    document.getElementById('exGuardMsg').textContent = `이 테마는 대비 기준 미달 ${fails}곳이 있어요.`;
    guard.classList.add('show');
  } else {
    guard.classList.remove('show');
  }
}
document.getElementById('exGuardFix').onclick = () => {
  const before = Object.assign({}, state.overrides);
  let r;
  try {
    r = fixThemeContrast(captureTheme());
  } catch (e) {
    return;
  }
  if (!r || !r.changes.length) {
    updateExportGuard();
    return;
  }
  state.overrides = r.overrides;
  apply();
  commitHistory();
  renderExport();
  updateExportGuard();
  toast(`색 <b>${r.changes.length}개</b>를 보정하고 내보낼 준비를 마쳤어요.`, {
    type: 'ok',
    kbd: 'Ctrl Z',
    undo: () => {
      state.overrides = before;
      apply();
      commitHistory();
      updateExportGuard();
    },
  });
};
