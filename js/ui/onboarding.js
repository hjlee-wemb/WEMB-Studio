/* ── 첫 실행 온보딩 ── */

/* (3) 첫 실행 온보딩 — 핵심 3단계, 한 번만 표시 */
(function initOnboarding() {
  const KEY = 'wemb-onboarded';
  const ov = document.getElementById('onbd');
  if (!ov) return;
  let seen = false;
  try {
    seen = localStorage.getItem(KEY) === '1';
  } catch (e) {}
  if (!seen) ov.classList.add('show');
  const close = (startTour) => {
    ov.classList.remove('show');
    if (document.getElementById('onbdDont').checked) {
      try {
        localStorage.setItem(KEY, '1');
      } catch (e) {}
    }
    /* '시작하기'로 닫으면 실제 UI를 짚어주는 스포트라이트 투어로 이어짐 */
    if (startTour && typeof window.__startCoach === 'function') setTimeout(window.__startCoach, 60);
  };
  document.getElementById('onbdStart').addEventListener('click', () => close(true));
  ov.addEventListener('click', (e) => {
    if (e.target === ov) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && ov.classList.contains('show')) close();
  });
  /* (3-b) 사이드바 도움말 버튼에서 다시 열 수 있도록 노출 */
  window.__showOnboarding = () => ov.classList.add('show');
})();
