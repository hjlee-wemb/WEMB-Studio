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
    ['new', 'group', 'screen'].forEach((k) => q.delete(k));
    write('#/prd');
    return;
  }

  const want = q.get('screen');
  if (want) {
    if (want !== current && !P.activateScreen(want)) {
      q.delete('screen'); /* 이 브라우저에 없는 화면 — 다른 기기에서 받은 주소 */
      write();
    }
    return;
  }
  if (current && P.loadProjects().some((s) => s.id === current)) {
    q.set('screen', current);
    write();
  }
})();
