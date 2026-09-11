/* ── 주소 라우팅 시작 ── */

/* 작업공간(studio.html)의 페이지 라우트는 shell/chrome.js 가 등록한다. 여기서는 맨 마지막에 시작만 한다.
   · 홈 쪽 주소(#/projects · #/templates …)로 오면 홈 문서로 넘긴다
   · 주소가 없거나 모르는 주소면 — 예전 공유 링크(#t=…)는 그 시안으로, 열린 화면이 있으면 스튜디오, 없으면 PRD
   · 예전 새로고침 복원 기록(wemb-view)은 이제 주소가 대신하므로 지운다 */
(function startRouting() {
  const R = WEMB.router;
  const toHome = () => { location.replace('index.html' + location.hash); };
  ['/projects', '/projects/:gid', '/recent', '/favorites', '/trash', '/templates', '/templates/:slug'].forEach((p) => R.add('home' + p, p, toHome));
  R.setFallback((hash) => {
    try { localStorage.removeItem('wemb-view'); } catch (e) {}
    const share = /^#(?:.*&)?t=([^&]+)/.exec(hash || '');
    if (share) return R.href('/studio', { t: share[1] });
    let cur = null;
    try { cur = localStorage.getItem('wemb-current-proj'); } catch (e) {}
    return cur ? '/studio' : '/prd';
  });
  R.start();
})();
