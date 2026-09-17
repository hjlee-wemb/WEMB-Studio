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
  /* 부팅 막(css/base/splash.css) — 첫 페인트엔 data-boot 로 떠 있다(js/app/session.js).
     라우터가 첫 화면을 그리며 data-boot 를 걷기 전에 .show 로 붙잡아 두고, 다 그려진 뒤 부드럽게 걷는다.
     · PRD 스플래시: 질문지는 라우터가 곧바로 그리므로 라우터 직후에 걷는다.
     · 프로젝트 열기 막: 저장된 화면은 템플릿 그림 · 폰트 · 차트가 늦게 자리를 잡는다. 기본 화면이 비쳤다가 바뀌지 않게
       페이지 로드(load)가 끝나고 두 프레임 뒤에 걷고, 로드가 늦어도 2.5초면 걷는다.
     너무 빨리 사라지면 깜빡임처럼 보여 문서 시작부터 최소 0.9초는 둔다. */
  const bootKind = document.documentElement.getAttribute('data-boot');
  const curtain = bootKind === 'studio' ? document.getElementById('openSplash')
    : bootKind === 'prd' ? document.getElementById('prdSplash') : null;
  if (curtain) curtain.classList.add('show');
  R.start();
  /* 안전망 — 어떤 라우트도 페이지를 그리지 않았어도 부팅 덮개가 남아 스튜디오를 가리지 않게 */
  document.documentElement.removeAttribute('data-boot');
  if (curtain) {
    let lifted = false;
    const lift = () => {
      if (lifted) return;
      lifted = true;
      setTimeout(() => {
        curtain.classList.add('out');
        setTimeout(() => curtain.classList.remove('show', 'enter', 'out'), 320);
      }, Math.max(0, 900 - performance.now()));
    };
    if (bootKind === 'studio') {
      const afterPaint = () => requestAnimationFrame(() => requestAnimationFrame(lift));
      if (document.readyState === 'complete') afterPaint();
      else window.addEventListener('load', afterPaint, { once: true });
      setTimeout(lift, 2500);
    } else lift();
  }

  /* 주소의 화면을 이 브라우저에서 못 찾았으면(js/app/session.js 가 표시해 둔다) 무엇이 열렸는지 말해 준다.
     화면은 만든 브라우저에만 저장되므로, 받은 주소가 다른 사람의 화면이면 늘 이 경우다. */
  let missing = null;
  try {
    missing = sessionStorage.getItem('wemb-missing-screen');
    sessionStorage.removeItem('wemb-missing-screen');
  } catch (e) {}
  if (missing && typeof toast === 'function') {
    toast(
      '이 주소의 화면을 이 브라우저에서 찾지 못했어요' + (missing === 'current' ? ' — 마지막으로 작업하던 화면을 대신 열었어요.' : '.') +
        ' 화면은 만든 브라우저에만 저장돼요. 다른 사람에게 보여 줄 땐 <b>내보내기 → 공유 링크</b>를 쓰세요.',
      { type: 'warn', dur: 9000 }
    );
  }
})();
