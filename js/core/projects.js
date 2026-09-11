/* ── 프로젝트 저장소 — 화면 · 폴더 목록, 화면별 상태 묶음 ── */

(function () {
  const LS_PROJ = 'wemb-projects';

  /* ── 런처 프로젝트 카드 ── */
  const loadProjects = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_PROJ) || '[]');
    } catch (e) {
      return [];
    }
  };
  const saveProjects = (a) => {
    try {
      localStorage.setItem(LS_PROJ, JSON.stringify(a));
    } catch (e) {}
  };
  /* 프로젝트에 안정적인 id·즐겨찾기 필드 보강 (구버전 데이터 마이그레이션) */
  const newId = () => 'p' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  (function migrateProjects() {
    const a = loadProjects();
    let changed = false;
    a.forEach((p) => {
      if (!p.id) { p.id = newId(); changed = true; }
      if (typeof p.fav !== 'boolean') { p.fav = false; changed = true; }
    });
    if (changed) saveProjects(a);
  })();

  /* ==== 프로젝트(폴더) 계층 ====
     'wemb-projects'는 이제 '화면(screen)' 목록이고, 각 화면은 projectId 로 소속 프로젝트(폴더)를
     가리킨다. 프로젝트 메타(이름·즐겨찾기·휴지통)는 'wemb-project-groups'에 둔다.
     스튜디오의 화면 열기/저장(openProject·persist·saveGuideProject)은 '화면' 단위 그대로 동작. */
  const LS_GROUP = 'wemb-project-groups';
  const PENDING_GROUP = 'wemb-pending-group';
  const newGid = () => 'g' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  const loadGroups = () => { try { return JSON.parse(localStorage.getItem(LS_GROUP) || '[]'); } catch (e) { return []; } };
  const saveGroups = (a) => { try { localStorage.setItem(LS_GROUP, JSON.stringify(a)); } catch (e) {} };
  /* 마이그레이션 — projectId 없는 기존 화면은 각자 새 프로젝트(폴더)로 감싼다(폴더=화면 1개).
     휴지통/즐겨찾기 상태는 폴더로 옮기고 화면에서는 제거(트래시·즐겨찾기는 폴더 단위). */
  (function migrateGroups() {
    const screens = loadProjects();
    const groups = loadGroups();
    const byId = {}; groups.forEach((g) => (byId[g.id] = g));
    let sChanged = false, gChanged = false;
    screens.forEach((s) => {
      if (!s.projectId || !byId[s.projectId]) {
        const g = { id: newGid(), name: s.name || '새 프로젝트', fav: !!s.fav, ts: s.ts || Date.now(), deleted: !!s.deleted, deletedTs: s.deletedTs };
        groups.push(g); byId[g.id] = g; gChanged = true;
        s.projectId = g.id; sChanged = true;
      }
      if ('deleted' in s || 'deletedTs' in s) { delete s.deleted; delete s.deletedTs; sChanged = true; }
    });
    if (sChanged) saveProjects(screens);
    if (gChanged) saveGroups(groups);
  })();
  const groupById = (gid) => loadGroups().find((g) => g.id === gid) || null;
  const screensOfGroup = (gid) => loadProjects().filter((s) => s.projectId === gid);
  const touchGroup = (gid) => { const gs = loadGroups(); const g = gs.find((x) => x.id === gid); if (g) { g.ts = Date.now(); saveGroups(gs); } };
  /* 가이드(PRD→…→스튜디오) 완료 시 프로젝트를 목록에 저장/갱신한다.
     같은 프로젝트 세션에서 다시 진입하면 중복 생성하지 않고 갱신(wemb-current-proj로 추적). */
  const CUR_PROJ = 'wemb-current-proj';
  /* ── 프로젝트별 상태 저장(번들) ──
     스튜디오의 모든 작업 상태는 wemb-* 로컬스토리지 키에 자동 저장된다. 그중 프로젝트 공용(목록·자산·UI)
     키를 제외한 나머지를 한 프로젝트의 상태 묶음(project.data)으로 스냅샷한다.
     프로젝트를 열 때 그 묶음을 전역 키에 되돌려 쓴 뒤 새로고침하면, 평소 새로고침처럼 그 프로젝트가 복원된다. */
  const PROJ_GLOBAL = new Set([LS_PROJ, LS_GROUP, PENDING_GROUP, CUR_PROJ, 'wemb-theme-snapshots', 'wemb-onboarded', 'wemb-previewhint', 'wemb-skx-hinted', 'wemb-view']);
  const projStateKeys = () => { try { return Object.keys(localStorage).filter((k) => k.startsWith('wemb-') && !PROJ_GLOBAL.has(k)); } catch (e) { return []; } };
  function collectProjectState() { const d = {}; projStateKeys().forEach((k) => { const v = localStorage.getItem(k); if (v != null) d[k] = v; }); return d; }
  function clearProjectState() { projStateKeys().forEach((k) => { try { localStorage.removeItem(k); } catch (e) {} }); }
  function applyProjectData(p) {
    clearProjectState();
    if (p && p.data) { Object.keys(p.data).forEach((k) => { try { localStorage.setItem(k, p.data[k]); } catch (e) {} }); }
  }
  function persistCurrentProjectData() {
    let id = null; try { id = localStorage.getItem(CUR_PROJ); } catch (e) {}
    if (!id) return;
    const arr = loadProjects(); const p = arr.find((x) => x.id === id);
    if (!p) return;
    p.data = collectProjectState();
    p.ts = Date.now();
    saveProjects(arr);
    if (p.projectId) touchGroup(p.projectId);
  }
  /* 새 화면이 들어갈 프로젝트(폴더) id를 정한다. 예약된(PENDING_GROUP) 폴더가 있으면 그걸,
     없으면 새 폴더를 만든다. 기본 이름('새 프로젝트')인 폴더는 첫 화면 이름으로 갱신. */
  function resolvePendingGroup(name) {
    let pg = null;
    try { pg = localStorage.getItem(PENDING_GROUP); } catch (e) {}
    const gs = loadGroups();
    let grp = pg ? gs.find((x) => x.id === pg) : null;
    if (!grp) { grp = { id: newGid(), name: name || '새 프로젝트', fav: false, ts: Date.now() }; gs.unshift(grp); }
    if (name && (!grp.name || grp.name === '새 프로젝트')) grp.name = name;
    grp.ts = Date.now();
    saveGroups(gs);
    try { localStorage.removeItem(PENDING_GROUP); } catch (e) {}
    return grp.id;
  }
  function saveGuideProject(data) {
    const projs = loadProjects();
    let id = null;
    try { id = localStorage.getItem(CUR_PROJ); } catch (e) {}
    let p = id ? projs.find((x) => x.id === id) : null;
    if (p) {
      p.name = data.name || p.name;
      p.screen = data.screen || p.screen;
      p.layout = data.layout || p.layout;
      p.ts = Date.now();
      if (p.deleted) { delete p.deleted; delete p.deletedTs; }
      if (p.projectId) touchGroup(p.projectId);
    } else {
      p = { id: newId(), name: data.name || '새 프로젝트', screen: data.screen || 'dash', layout: data.layout || '', tpl: null, ts: Date.now(), fav: false, projectId: resolvePendingGroup(data.name) };
      projs.unshift(p);
      if (projs.length > 48) projs.length = 48;
      try { localStorage.setItem(CUR_PROJ, p.id); } catch (e) {}
    }
    saveProjects(projs);
    return p.id;
  }

  /* 저장된 화면을 '지금 작업 중인 화면'으로 — 지금 화면 상태를 저장하고, 대상 화면의 상태 묶음과
     템플릿 장면 표시를 전역 키에 되돌려 쓴다. 작업공간이 부팅할 때 앱 스크립트보다 먼저 불린다(js/app/session.js). */
  function activateScreen(id) {
    persistCurrentProjectData();
    const arr = loadProjects();
    const t = arr.find((x) => x.id === id);
    if (!t) return false;
    t.ts = Date.now();
    if (t.deleted) { delete t.deleted; delete t.deletedTs; }
    saveProjects(arr);
    try { localStorage.setItem(CUR_PROJ, id); } catch (e) {}
    applyProjectData(t);
    /* 템플릿 장면(메인/팝업 · 상세) 지정 — 이 화면이 그 장면으로 그려진다 */
    try { localStorage.setItem('wemb-skx-screen', t.tplScene === 'popup' ? 'popup' : 'main'); } catch (e) {}
    try { localStorage.setItem('wemb-hub-screen', t.tplScene === 'hvac' ? 'hvac' : 'main'); } catch (e) {}
    try { localStorage.setItem('wemb-hanjin-screen', (t.tplScene === 'gate' || t.tplScene === 'unload') ? t.tplScene : 'main'); } catch (e) {}
    try { if (t.tpl === 'hana') localStorage.setItem('wemb-hana-screen', t.tplScene || 'overview-02'); } catch (e) {}
    /* 저장된 상태가 없던(구버전) 화면은 화면 종류 · 레이아웃만이라도 반영 */
    if (!t.data) {
      try { localStorage.setItem('wemb-layout', t.layout || ''); } catch (e) {}
      try { if (t.screen === 'dash' || t.screen === 'dt') localStorage.setItem('wemb-screen', t.screen); } catch (e) {}
      try {
        if (t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') localStorage.setItem('wemb-tpl-dt', t.tpl);
        else localStorage.removeItem('wemb-tpl-dt');
      } catch (e) {}
    }
    /* 템플릿 표시 동기화 — 미연결 이미지 템플릿이면 이미지 오버레이가, 아니면 이전 화면에서 남은 오버레이가 걷히도록 */
    try {
      if (t.tpl === 'image' && t.img) { localStorage.setItem('wemb-tpl-img', t.img); localStorage.removeItem('wemb-tpl-dt'); }
      else if (t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') { localStorage.setItem('wemb-tpl-dt', t.tpl); localStorage.removeItem('wemb-tpl-img'); }
      else { localStorage.removeItem('wemb-tpl-img'); localStorage.removeItem('wemb-tpl-dt'); }
    } catch (e) {}
    return true;
  }

  window.WEMB = window.WEMB || {};
  WEMB.projects = { CUR_PROJ, LS_GROUP, LS_PROJ, PENDING_GROUP, activateScreen, clearProjectState, groupById, loadGroups, loadProjects, newGid, newId, persistCurrentProjectData, resolvePendingGroup, saveGroups, saveGuideProject, saveProjects, screensOfGroup, touchGroup };
})();
