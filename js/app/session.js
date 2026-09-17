/* ── 작업 세션 — 주소가 정한 화면으로 전역 상태를 맞춘다 ── */

/* studio.html 의 <head> 에서, 앱 스크립트가 localStorage 를 읽기 전에 돈다.
   스튜디오의 모든 작업 상태는 wemb-* 전역 키에 살고, 화면(프로젝트)마다 그 묶음을 따로 보관한다
   (js/core/projects.js). 그래서 '어느 화면을 열지'는 앱이 뜨기 전에 전역 키를 그 화면 것으로 바꿔 두면 된다.

   ?screen=<id>          그 화면을 연다. 다른 화면이 열려 있었으면 그 상태를 저장한 뒤 교체한다.
                         홈에서 열기 · 새로고침 · 북마크가 모두 이 한 길을 탄다.
   ?new=1[&group=<gid>]  새 화면 — 지금 화면을 저장하고 상태를 비운 뒤 PRD 부터. (group 이 있으면 그 프로젝트 안에)
                         새로고침에 다시 비우지 않도록 주소에서 지운다.
   (없음)                 지금 열려 있는 화면을 주소에 적어 둔다 — 복사한 주소가 같은 화면을 가리키게. */
(function openSessionFromURL() {
  const P = WEMB.projects;
  const url = new URL(location.href);
  const q = url.searchParams;
  const write = (hash) => {
    const qs = q.toString();
    try { history.replaceState(history.state, '', url.pathname + (qs ? '?' + qs : '') + (hash != null ? hash : url.hash)); } catch (e) {}
  };
  let current = null;
  try { current = localStorage.getItem(P.CUR_PROJ); } catch (e) {}

  if (q.has('new')) {
    P.persistCurrentProjectData();
    P.clearProjectState();
    try {
      const gid = q.get('group');
      if (gid) localStorage.setItem(P.PENDING_GROUP, gid);
      else localStorage.removeItem(P.PENDING_GROUP);
      localStorage.removeItem(P.CUR_PROJ);
    } catch (e) {}
    /* _ 는 '새 프로젝트' 이동을 매번 다른 주소로 만들어 옛 studio.html 캐시를 못 쓰게 하는 표식 — 주소창엔 남기지 않는다 */
    ['new', 'group', 'screen', '_'].forEach((k) => q.delete(k));
    write('#/prd');
    return;
  }

  const want = q.get('screen');
  if (want) {
    if (want !== current && !P.activateScreen(want)) {
      q.delete('screen'); /* 이 브라우저에 없는 화면 — 다른 기기에서 받은 주소 */
      /* 조용히 다른 화면을 띄우면 받은 시안으로 오해한다. 무엇이 열렸는지는 앱이 뜬 뒤 알린다(js/shell/routes.js). */
      const hasCurrent = !!current && P.loadProjects().some((s) => s.id === current);
      try { sessionStorage.setItem('wemb-missing-screen', hasCurrent ? 'current' : 'none'); } catch (e) {}
      write();
    }
    return;
  }
  if (current && P.loadProjects().some((s) => s.id === current)) {
    q.set('screen', current);
    write();
  }
})();

/* ── 첫 페인트에 보일 페이지 ──
   라우터는 본문 맨 끝 스크립트라, 그 전에 브라우저가 한 번 그리면 기본으로 보이는 스튜디오 작업공간(.app)이 먼저 비친 뒤
   PRD 로 바뀌었다 — '새 프로젝트'를 누르면 스튜디오가 잠깐 나왔다가 질문지가 뜨던 원인.
   주소가 문서 페이지(PRD · 기능명세서 · 유저플로우 · 와이어프레임)를 가리키면 <html data-boot> 로 그 페이지를 처음부터 덮어 두고
   (css/guide/pages.css), 라우터가 첫 화면을 그리면 걷는다(js/shell/routes.js).
   저장된 화면(#/studio)도 같은 문제였다 — 기본 대시보드 · 기본 색이 먼저 그려졌다가 저장된 시안 · 색으로 바뀌었다.
   그래서 data-boot="studio" 로 '프로젝트 열기' 막을 처음부터 띄우고, 제목에 여는 화면 이름을 넣는다(--boot-name). */
(function markBootPage() {
  const root = document.documentElement;
  const m = /^#\/(prd|spec|flow|wireframe|studio)(?:[?/]|$)/.exec(location.hash);
  let page = m ? m[1] : null;
  let cur = null;
  try { cur = localStorage.getItem(WEMB.projects.CUR_PROJ); } catch (e) {}
  /* 주소가 비었으면 열린 화면이 있을 때 스튜디오, 없을 때 PRD — js/shell/routes.js 폴백과 같은 판단 */
  if (!page && !location.hash.replace(/^#\/?/, '')) page = cur ? 'studio' : 'prd';
  if (!page) return;
  root.setAttribute('data-boot', page);
  if (page === 'studio' && cur) {
    const s = WEMB.projects.loadProjects().find((x) => x.id === cur);
    /* JSON 문자열 표기는 따옴표 · 역슬래시를 이스케이프해 CSS 문자열로도 그대로 쓸 수 있다 */
    if (s && s.name) root.style.setProperty('--boot-name', JSON.stringify(String(s.name)));
  }
})();
