/* ── 작업공간의 회의 모드 — 화면 · 상단 바 · 옵션 패널의 고객사 이름을 가린다(js/core/meeting.js) ──
   켜고 끄는 곳은 홈의 템플릿 갤러리와 발표 화면이다. 여기서는 설정을 따라 가리기만 한다.
   글자를 고치는 중(패널 편집 · 내용 수정)에는 가리지 않는다 — 가린 글자가 시안에 저장되지 않게. */
(function meetingStudio() {
  const M = WEMB.meeting;
  if (!M) return;
  const main = document.querySelector('.main');
  const stage = document.getElementById('dtStage');
  const editing = () =>
    !!((main && (main.classList.contains('editing') || main.classList.contains('content-editing'))) || (stage && stage.classList.contains('dt-content-editing')));
  /* 지금 열어 둔 프로젝트가 곧 만나는 고객사다 — PRD 프로젝트명 · 화면 이름 · 폴더 이름은 가리지 않는다.
     PRD 를 새로 저장하면 brand.js 가 이 함수를 다시 부른다. */
  function syncCustomer() {
    const names = [];
    try { const r = JSON.parse(localStorage.getItem('wemb-prd') || 'null'); if (r && r.site) names.push(r.site); } catch (e) {}
    try {
      const id = localStorage.getItem('wemb-current-proj');
      const p = WEMB.projects.loadProjects().find((x) => x.id === id);
      if (p && !p.tpl) {
        names.push(p.name);
        const g = p.projectId && WEMB.projects.loadGroups().find((x) => x.id === p.projectId);
        if (g) names.push(g.name);
      }
    } catch (e) {}
    if (names.length) M.setCustomer(names);
  }
  window.__meetingSyncCustomer = syncCustomer;
  syncCustomer();
  M.watch(document.body, editing);
})();
