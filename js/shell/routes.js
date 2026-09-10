/* ── 주소 라우팅 시작 ── */

/* 모든 모듈이 자기 라우트를 등록한 뒤(런처: launcher/flow.js · 작업 페이지: shell/chrome.js)
   맨 마지막에 시작한다. 주소가 없거나 모르는 주소면 아래 순서로 정한다.
   · 예전 공유 링크(#t=…)             → 스튜디오에서 그 시안을 연다
   · 예전 새로고침 복원 기록(wemb-view) → 그 작업 화면. 한 번 쓰고 지운다 — 이제 주소가 기록이다
   · 그 밖                            → 프로젝트 목록 */
(function startRouting() {
  const PAGE_PATH = { prd: '/prd', spec: '/spec', flow: '/flow', wireframe: '/wireframe', wire: '/studio' };
  WEMB.router.setFallback((hash) => {
    const share = /^#(?:.*&)?t=([^&]+)/.exec(hash || '');
    if (share) return WEMB.router.href('/studio', { t: share[1] });
    let legacy = null;
    try {
      legacy = localStorage.getItem('wemb-view');
      localStorage.removeItem('wemb-view');
    } catch (e) {}
    return PAGE_PATH[legacy] || '/projects';
  });
  WEMB.router.start();
})();
