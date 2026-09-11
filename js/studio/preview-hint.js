/* ── 미리보기 편집 힌트 ── */

/* (6) 미리보기 편집 힌트 — 닫거나 '대시보드 편집' 탭에 들어가면 숨김(한 번 닫으면 기억) */
(function initPreviewHint() {
  const hint = document.getElementById('previewHint');
  if (!hint) return;
  let dismissed = false;
  try {
    dismissed = localStorage.getItem('wemb-previewhint') === '1';
  } catch (e) {}
  if (dismissed) hint.classList.add('hide');
  const hide = () => {
    hint.classList.add('hide');
    try {
      localStorage.setItem('wemb-previewhint', '1');
    } catch (e) {}
  };
  document.getElementById('previewHintX').addEventListener('click', hide);
  const dashTab = document.querySelector('.sbtab[data-tab="dash"]');
  if (dashTab) dashTab.addEventListener('click', hide);
})();
