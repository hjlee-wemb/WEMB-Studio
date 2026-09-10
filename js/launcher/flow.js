/* ── 런처 — 프로젝트 · 템플릿 · 새 프로젝트 흐름 ── */

/* ============================================================
   온보딩 플로우 — 런처(프로젝트 목록) → 새 프로젝트(화면 종류)
   → 레이아웃 선택 → 스튜디오 진입. 레이아웃 정의는 Figma Studio
   119:x 카드(2단/3단/모듈) 구조를 그대로 옮긴 것.
   ============================================================ */
function initFlow() {
  const home = document.getElementById('flowHome');
  const layout = document.getElementById('flowLayout');
  const modal = document.getElementById('npModal');
  if (!home || !layout || !modal) return;
  /* 이 플로우가 진입점이므로 기존 와이어프레임 피커·온보딩은 접어둔다 */
  document.getElementById('wfModal')?.classList.remove('show');
  document.getElementById('onbd')?.classList.remove('show');

  const LS_PROJ = 'wemb-projects';
  const SCREEN_LABEL = { dash: '대시보드', dt: '디지털 트윈', portal: '포탈' };
  const L = (cols, rows, cells) => ({ cols, rows, cells });
  const grid = (c, r) => {
    const a = [];
    for (let y = 1; y <= r; y++) for (let x = 1; x <= c; x++) a.push([x, y, 1, 1]);
    return a;
  };
  /* cells: [colStart, rowStart, colSpan, rowSpan] (1-based) */
  const LAYOUTS = {
    g2: [
      { id: 'g2-2r', name: '2단 · 2행', desc: '큰 카드 4개 (2×2)', ...L(2, 2, grid(2, 2)) },
      { id: 'g2-3r', name: '2단 · 3행', desc: '카드 6개 (2×3)', ...L(2, 3, grid(2, 3)) },
      { id: 'g2-4r', name: '2단 · 4행', desc: '카드 8개 (2×4)', ...L(2, 4, grid(2, 4)) },
    ],
    /* Figma Studio 119:172 / 119:198 / 119:228 구조 그대로 */
    g3: [
      { id: 'g3-2r', name: '3단 · 2행', desc: '카드 6개 (3×2)', ...L(3, 2, grid(3, 2)) },
      /* 119:198 — 열마다 다른 행 분할(3·2·3) */
      { id: 'g3-3r', name: '3단 · 3행', desc: '3열 혼합 (3·2·3행)', ...L(3, 6, [[1, 1, 1, 2], [1, 3, 1, 2], [1, 5, 1, 2], [2, 1, 1, 3], [2, 4, 1, 3], [3, 1, 1, 2], [3, 3, 1, 2], [3, 5, 1, 2]]) },
      { id: 'g3-4r', name: '3단 · 4행', desc: '3×3 + 하단 와이드 바', ...L(3, 4, [...grid(3, 3), [1, 4, 3, 1]]) },
    ],
    /* 모듈 — Figma 119:293 / 119:266 / 119:278 (혼합 벤토, 캡션 2R/3R/4R Mix) */
    mod: [
      /* 119:293 — 상단 풀폭 배너 + 하단 4열 */
      { id: 'mod-2mix', name: '모듈 · 2열 혼합', desc: '상단 배너 + 4열', ...L(4, 5, [[1, 1, 4, 2], [1, 3, 1, 3], [2, 3, 1, 3], [3, 3, 1, 3], [4, 3, 1, 3]]) },
      /* 119:266 — 2열 구성, 일부 행이 2칸으로 분할된 혼합 */
      { id: 'mod-3mix', name: '모듈 · 3열 혼합', desc: '2열 · 일부 분할', ...L(4, 3, [[1, 1, 2, 1], [1, 2, 2, 1], [1, 3, 1, 1], [2, 3, 1, 1], [3, 1, 1, 1], [4, 1, 1, 1], [3, 2, 2, 1], [3, 3, 2, 1]]) },
      /* 119:278 — 좌(2열)·우(1열) 3행 + 하단 배너 */
      { id: 'mod-4mix', name: '모듈 · 4열 혼합', desc: '좌2·우1 + 하단 배너', ...L(3, 4, [[1, 1, 2, 1], [1, 2, 2, 1], [1, 3, 2, 1], [3, 1, 1, 1], [3, 2, 1, 1], [3, 3, 1, 1], [1, 4, 3, 1]]) },
    ],
  };
  const GROUPS = [
    { key: 'g2', label: '2단', hint: '좌우 2열 — 큼직하게' },
    { key: 'g3', label: '3단', hint: '3열 — 정보를 촘촘하게' },
    { key: 'mod', label: '모듈', hint: '크기가 다른 타일의 모자이크 — Figma 모듈 프레임 그대로' },
  ];
  /* ── 디지털 트윈 전용 레이아웃 — Figma Studio 'Digital Twin' 섹션(147:756) 그대로.
     대시보드와 달리 가운데는 3D 씬이 비치도록 비우고 패널을 가장자리·코너에 배치한다.
     level = 패널 열 수(2/3/4), R = 세로 분할 정도(2/3/4). */
  const DT_LAYOUTS = {
    dt2: [
      { id: 'dt-2l-2r', name: '2레벨 · 2R', desc: '좌 1 · 우 2 패널', ...L(4, 3, [[1, 1, 1, 1], [4, 1, 1, 2], [4, 3, 1, 1]]) },
      { id: 'dt-2l-3r', name: '2레벨 · 3R', desc: '좌 세로 1 · 우 3 패널', ...L(4, 3, [[1, 1, 1, 3], [4, 1, 1, 1], [4, 2, 1, 1], [4, 3, 1, 1]]) },
      { id: 'dt-2l-4r', name: '2레벨 · 4R', desc: '좌 3 · 우 4 패널', ...L(4, 12, [[1, 1, 1, 4], [1, 5, 1, 4], [1, 9, 1, 4], [4, 1, 1, 3], [4, 4, 1, 3], [4, 7, 1, 3], [4, 10, 1, 3]]) },
    ],
    dt3: [
      { id: 'dt-3l-2r', name: '3레벨 · 2R', desc: '상단 3분할 · 하단 와이드', ...L(3, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1], [1, 4, 3, 1]]) },
      { id: 'dt-3l-3r', name: '3레벨 · 3R', desc: '우측 2 · 하단 3분할', ...L(3, 3, [[3, 1, 1, 1], [3, 2, 1, 1], [1, 3, 1, 1], [2, 3, 1, 1], [3, 3, 1, 1]]) },
      { id: 'dt-3l-4r', name: '3레벨 · 4R', desc: '좌 2 · 우 3 · 하단 와이드', ...L(4, 7, [[1, 1, 1, 3], [1, 4, 1, 3], [4, 1, 1, 2], [4, 3, 1, 2], [4, 5, 1, 2], [1, 7, 4, 1]]) },
    ],
    dt4: [
      { id: 'dt-4l-2r', name: '4레벨 · 2R', desc: '좌상 2 · 우 세로 · 하단 2', ...L(4, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [4, 1, 1, 3], [3, 4, 1, 1], [4, 4, 1, 1]]) },
      { id: 'dt-4l-3r', name: '4레벨 · 3R', desc: '상단 4 · 양측 1 · 하단 와이드', ...L(4, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1], [4, 1, 1, 1], [1, 2, 1, 1], [4, 2, 1, 1], [1, 4, 4, 1]]) },
      { id: 'dt-4l-4r', name: '4레벨 · 4R', desc: '상·하단 4열 · 양측 3', ...L(4, 4, [[1, 1, 1, 1], [2, 1, 1, 1], [3, 1, 1, 1], [4, 1, 1, 1], [1, 2, 1, 1], [1, 3, 1, 1], [4, 2, 1, 1], [4, 3, 1, 1], [1, 4, 1, 1], [2, 4, 1, 1], [3, 4, 1, 1], [4, 4, 1, 1]]) },
    ],
  };
  const DT_GROUPS = [
    { key: 'dt2', label: '2레벨', hint: '좌·우 양쪽 패널 · 가운데 3D 씬' },
    { key: 'dt3', label: '3레벨', hint: '삼분할·상하 배치 · 넓은 씬 확보' },
    { key: 'dt4', label: '4레벨', hint: '가장자리를 촘촘히 · 정보 밀도 높게' },
  ];
  /* 화면 종류에 맞는 레이아웃/그룹 세트 (디지털 트윈이면 DT 전용) */
  const layoutsFor = (screen) => (screen === 'dt' ? DT_LAYOUTS : LAYOUTS);
  const groupsFor = (screen) => (screen === 'dt' ? DT_GROUPS : GROUPS);
  const findLayout = (id) => {
    for (const set of [LAYOUTS, DT_LAYOUTS]) {
      for (const k in set) {
        const f = set[k].find((l) => l.id === id);
        if (f) return f;
      }
    }
    return null;
  };
  function wfEl(lay) {
    const wf = document.createElement('div');
    wf.className = 'wf';
    wf.style.gridTemplateColumns = 'repeat(' + lay.cols + ',1fr)';
    wf.style.gridTemplateRows = 'repeat(' + lay.rows + ',1fr)';
    lay.cells.forEach(([x, y, w, h]) => {
      const c = document.createElement('div');
      c.className = 'wf-c';
      c.style.gridColumn = x + ' / span ' + w;
      c.style.gridRow = y + ' / span ' + h;
      wf.appendChild(c);
    });
    return wf;
  }

  /* ── 선택한 레이아웃을 실제 대시보드 미리보기에 반영 ──
     .cols를 CSS grid로 바꾸고 기존 패널을 셀에 배치(스팬 포함). 패널이
     셀보다 많으면 남는 패널은 숨기고, 되돌릴 땐 4열 기둥으로 복원한다. */
  const dashCols = () =>
    document.querySelector('.stage .dashpage:not([hidden]) .cols') || document.querySelector('.stage .cols');
  function ensurePanels(cols) {
    if (!cols.__panels || !cols.__panels.length) cols.__panels = [...cols.querySelectorAll('.panel')];
    return cols.__panels;
  }
  function restoreCols(cols, panels) {
    panels.forEach((p) => {
      if (p.parentElement !== cols) cols.appendChild(p);
    });
    [...cols.querySelectorAll(':scope > .col')].forEach((c) => c.remove());
    cols.classList.remove('gridmode');
    cols.style.gridTemplateColumns = '';
    cols.style.gridTemplateRows = '';
    const N = 4;
    const colEls = [];
    for (let i = 0; i < N; i++) {
      const c = document.createElement('div');
      c.className = 'col';
      cols.appendChild(c);
      colEls.push(c);
    }
    panels.forEach((p, i) => {
      p.style.gridColumn = '';
      p.style.gridRow = '';
      p.style.display = '';
      colEls[i % N].appendChild(p);
    });
  }
  function applyDashLayout(layoutId) {
    const cols = dashCols();
    if (!cols) return;
    const panels = ensurePanels(cols);
    /* 어느 경로로 빠져나가든 내용은 PRD 어휘로 맞춘다 — 배치만 바꾸고 끝나면 은행 데모가 남는다 */
    const paintPrd = () => { try { if (window.__applyPrdToPanels) window.__applyPrdToPanels(cols); } catch (e) {} };
    /* 디지털 트윈 전용 레이아웃은 대시보드 미리보기에 적용하지 않는다(3D 씬 유지) */
    if (typeof layoutId === 'string' && layoutId.startsWith('dt-')) { restoreCols(cols, panels); paintPrd(); return; }
    const lay = findLayout(layoutId);
    if (!lay) {
      restoreCols(cols, panels);
      paintPrd();
      return;
    }
    /* 패널을 .cols 직속으로 옮긴 뒤 빈 .col 제거 → grid 배치 */
    panels.forEach((p) => {
      if (p.parentElement !== cols) cols.appendChild(p);
    });
    [...cols.querySelectorAll(':scope > .col')].forEach((c) => c.remove());
    cols.classList.add('gridmode');
    cols.style.gridTemplateColumns = 'repeat(' + lay.cols + ',1fr)';
    cols.style.gridTemplateRows = 'repeat(' + lay.rows + ',minmax(0,1fr))';
    lay.cells.forEach((cell, i) => {
      const p = panels[i];
      if (!p) return;
      p.style.display = '';
      p.style.gridColumn = cell[0] + ' / span ' + cell[2];
      p.style.gridRow = cell[1] + ' / span ' + cell[3];
    });
    for (let i = lay.cells.length; i < panels.length; i++) {
      panels[i].style.display = 'none';
      panels[i].style.gridColumn = '';
      panels[i].style.gridRow = '';
    }
    /* 배치만 바꾸고 내용은 은행 데모 그대로 두면, PRD 6단계를 채운 사용자가
       발전소를 골라도 '타 기관 지연 TOP5 · 국민은행'을 보게 된다.
       디지털 트윈 경로가 이미 쓰는 엔진(__prdPanelSpec)을 여기서도 태운다. */
    paintPrd();
  }
  window.__applyDashLayout = applyDashLayout;

  let pending = { name: '새 프로젝트', screen: 'dash', layout: null };

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
  const timeago = (ts) => {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return '방금 전';
    if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    return Math.floor(s / 86400) + '일 전';
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
  /* 현재 열어 둔 프로젝트(폴더) id. null 이면 폴더 목록, 값이 있으면 그 폴더의 화면 목록 */
  let curGroup = null;

  /* 런처 좌측 메뉴(뷰) 상태 */
  let view = 'all';
  /* 휴지통에서 선택삭제로 고른 프로젝트 id 집합 */
  const trashSel = new Set();
  function updateTrashSelUI() {
    const btn = document.getElementById('lcSelDel');
    if (!btn) return;
    const n = trashSel.size;
    btn.disabled = n === 0;
    const c = btn.querySelector('.lc-selcount');
    if (c) c.textContent = n ? ' (' + n + ')' : '';
  }
  /* ── 템플릿 갤러리 데이터 — Figma Studio(169:150)의 카드/카테고리 그대로 ──
     썸네일은 src/templates/tpl-01..18.jpg. 화면 종류는 제목 접두어로 판별. */
  /* 카테고리 — 2단 계층: 화면 유형(상위) → 업무 영역(하위, 화면 유형 종속) */
  const TPL_SCREENS = ['2D 대시보드', '3D 디지털트윈'];
  const TPL_AREAS = {
    '2D 대시보드': ['종합현황', '인프라', '서비스·거래', '비즈니스', '이벤트·장애', '안전·보안', '에너지·환경', 'AI·예측', '운영·SOP'],
    '3D 디지털트윈': ['부지·건물·층', '시설·설비', 'IT·데이터센터', '발전·에너지', '안전·소방', '물리보안', '환경·기상', '이벤트', '2D 정보패널', 'SOP·운영'],
  };
  /* ── 템플릿 원본(카탈로그) — UI Library 1.0 썸네일을 프로젝트 단위로 묶은 것 ──
     한 프로젝트에 화면이 여럿이면 slides 로 묶어 카드 한 장으로 올린다.
     (상세에서 슬라이드로 넘겨 보고, '스튜디오 열기'를 누르면 그 화면들이 한 폴더 안의 화면들로 만들어진다)
     썸네일은 src/templates/lib/<이름>.jpg(1200×675), 스튜디오에 얹히는 원본은 <이름>-hi.jpg(1920폭). */
  const TPL_LIB = 'src/templates/lib/';
  const TL = (name, label) => ({ img: TPL_LIB + name + '.jpg', label });
  /* [제목, 업무 영역, 등록일, 화면들] — 제목 접두어(Digital Twin / Dashboard)로 화면 유형이 갈린다 */
  const TPL_DEFS = [
    { title: 'Digital Twin: SKHynix Icheon 1level', area: '부지·건물·층', date: 'February 12, 2024', slides: [
      TL('skhynix-icheon-1level', '1level 전경'), TL('skhynix-icheon-2level', '2level 전경')] },
    { title: 'Digital Twin: Gammania', area: '부지·건물·층', date: 'April 3, 2024', slides: [
      TL('gammania-overviewb', '종합 전경'), TL('gammania-floorscreen', '층별 화면')] },
    { title: 'Dashboard: Icheon main', area: '종합현황', date: 'November 3, 2025', slides: [
      TL('icheon-main', '메인')] },
    { title: 'Dashboard: NH-DCIM', area: '인프라', date: 'June 18, 2025', slides: [
      TL('nh-dcim', 'DCIM 현황')] },
    { title: 'Dashboard: KB', area: '종합현황', date: 'September 27, 2026', slides: [
      TL('kb-main', '메인'), TL('kb-main02', '메인 02')] },
    { title: 'Dashboard: Hyundai Capital', area: '서비스·거래', date: 'March 9, 2025', slides: [
      TL('hyundaicapital-p01-service-map', '서비스 맵'), TL('hyundaicapital-p03-monitoring', '모니터링'),
      TL('hyundaicapital-p07-it-kpi', 'IT KPI'), TL('hyundaicapital-p08-it-status', 'IT 현황')] },
    { title: 'Dashboard: Hana Card', area: '서비스·거래', date: 'December 14, 2025', slides: [
      TL('hanacard-main', '메인'), TL('hanacard-approval-text', '승인 현황')] },
    { title: 'Dashboard: Shinhan Card Security', area: '안전·보안', date: 'July 19, 2024', slides: [
      TL('shinhan-card-security', '보안 현황')] },
    { title: 'Dashboard: PSIM', area: '안전·보안', date: 'August 30, 2024', slides: [
      TL('psim-dashboard-ic', 'PSIM 현황')] },
    { title: 'Dashboard: SHOneView', area: '종합현황', date: 'August 1, 2026', slides: [
      TL('shoneview-main01', '메인 01'), TL('shoneview-main02', '메인 02'), TL('shoneview-main03', '메인 03'),
      TL('shoneview-network', '네트워크'), TL('shoneview-p03-was', 'WAS'), TL('shoneview-p05-db', 'DB'),
      TL('shoneview-p06-01-systemstatus01', '시스템현황 P06-01 · 01'), TL('shoneview-p06-01-systemstatus02', '시스템현황 P06-01 · 02'),
      TL('shoneview-p06-02-systemstatus01', '시스템현황 P06-02 · 01'), TL('shoneview-p06-02-systemstatus02', '시스템현황 P06-02 · 02'),
      TL('shoneview-p06-02-systemstatus03', '시스템현황 P06-02 · 03'), TL('shoneview-p06-02-systemstatus04', '시스템현황 P06-02 · 04'),
      TL('shoneview-login', '로그인')] },
    { title: 'Dashboard: Hanbit', area: '에너지·환경', date: 'January 22, 2025', slides: [
      TL('hanbit', '발전소 현황')] },
    { title: 'Dashboard: HC Approval', area: '서비스·거래', date: 'March 28, 2024', slides: [
      TL('hc-approval', '승인 현황')] },
    { title: 'Dashboard: KOEN', area: '에너지·환경', date: 'May 22, 2024', slides: [
      TL('koen-dashboard01', '발전 현황')] },
    { title: 'Dashboard: DCMS', area: '에너지·환경', date: 'February 6, 2026', slides: [
      TL('dcms-energystatus', '에너지 현황'), TL('dcms-electricty', '전력 현황')] },
    { title: 'Dashboard: Figma LottieFiles', area: '종합현황', date: 'April 25, 2025', slides: [
      TL('figma-lottiefiles', '모션 컴포넌트')] },
    { title: 'Dashboard: KISED', area: '비즈니스', date: 'July 11, 2025', slides: [
      TL('kised01', '현황 01'), TL('kised02', '현황 02')] },
    { title: 'Digital Twin: Digicentre DCIM', area: 'IT·데이터센터', date: 'October 30, 2025', slides: [
      TL('digicentre-dcim', '센터 전경')] },
    { title: 'Dashboard: Global Status', area: '종합현황', date: 'January 16, 2026', slides: [
      TL('global-status-1', '글로벌 현황 01'), TL('global-status-2', '글로벌 현황 02')] },
    { title: 'Dashboard: SW Security', area: '안전·보안', date: 'July 5, 2024', slides: [
      TL('swsecurrity', '통합보안 현황')] },
    { title: 'Dashboard: Korea Status', area: '종합현황', date: 'April 11, 2026', slides: [
      TL('korea-status-1', '국내 현황')] },
    { title: 'Dashboard: KORAIL Concept', area: '인프라', date: 'February 28, 2025', slides: [
      TL('korail-concept', '노선 현황')] },
    { title: 'Dashboard: Sewerage System Concept', area: '에너지·환경', date: 'June 9, 2024', slides: [
      TL('seweragesys-concept', '하수처리 현황')] },
    { title: 'Dashboard: NRTEC Concept', area: '종합현황', date: 'September 14, 2025', slides: [
      TL('nrtec-concept-2dmap', '2D 맵'), TL('nrtec-concept-3dmap', '3D 맵')] },
    { title: 'Digital Twin: Facility Status', area: '시설·설비', date: 'November 24, 2026', slides: [
      TL('facility-status-1', '설비 현황 01'), TL('facility-status-2', '설비 현황 02')] },
    { title: 'Dashboard: Port Status', area: '종합현황', date: 'March 2, 2026', slides: [
      TL('portstatus-overalloperation', '종합 운영'), TL('portstatus-vesselinfo', '선박 정보'), TL('portstatus-login-concept', '로그인')] },
    { title: 'Digital Twin: Solar Concept (FEMS)', area: '발전·에너지', date: 'August 18, 2025', slides: [
      TL('solor-concept-fems', '발전 단지')] },
    { title: 'Digital Twin: LSE Demo', area: '시설·설비', date: 'June 2, 2026', slides: [
      TL('lse-demo-main', '메인'), TL('lse-demo-floor', '층 현황'), TL('lse-demo-electricroom', '전기실'),
      TL('lse-demo-detail-vcb', 'VCB 상세'), TL('lse-demo-pop-facilitystatus', '팝업 · 설비 현황'),
      TL('lse-demo-pop-generator', '팝업 · 발전기'), TL('lse-demo-pop-vcb-safe', '팝업 · VCB 안전')] },
    { title: 'Digital Twin: Hanjin main', area: '부지·건물·층', date: 'September 8, 2024', slides: [
      TL('hanjin-main', '메인')] },
    { title: 'Dashboard: Woori Bank', area: '서비스·거래', date: 'December 1, 2026', slides: [
      TL('wooribank-transaction', '거래 현황'), TL('wooribank-performance', '성능 현황'), TL('wooribank-event', '이벤트 현황')] },
    { title: 'Dashboard: Army Prototype', area: '안전·보안', date: 'October 17, 2024', slides: [
      TL('army-prototype01', '프로토타입 01'), TL('army-prototype02', '프로토타입 02')] },
    { title: 'Dashboard: NH Biometrics', area: '서비스·거래', date: 'May 6, 2026', slides: [
      TL('nh-biometrics', '생체인증 현황')] },
    { title: 'Dashboard: HuaNan Bank', area: '서비스·거래', date: 'July 30, 2026', slides: [
      TL('huananbank-main', '메인'), TL('huananbank-corebiz01-01', '핵심업무 01-1'), TL('huananbank-corebiz01-02', '핵심업무 01-2'),
      TL('huananbank-corebiz02', '핵심업무 02'), TL('huananbank-banking', '뱅킹'), TL('huananbank-atm', 'ATM'),
      TL('huananbank-payment-status', '결제 현황'), TL('huananbank-internet', '인터넷뱅킹'),
      TL('huananbank-domestic-branch', '국내 지점'), TL('huananbank-overseas-branch', '해외 지점'), TL('huananbank-itinfra', 'IT 인프라')] },
    { title: 'Digital Twin: Handok GridSol Cube', area: '발전·에너지', date: 'January 9, 2025', slides: [
      TL('handok-gridsol-cube', '단지 전경')] },
    { title: 'Dashboard: Incheon Monitoring', area: '인프라', date: 'March 20, 2026', slides: [
      TL('new-incheon01', '모니터링 01'), TL('new-incheon02', '모니터링 02'), TL('new02-incheon02', '모니터링 03')] },
    { title: 'Digital Twin: BioTech D-BT', area: '부지·건물·층', date: 'November 12, 2025', slides: [
      TL('biotech-d-bt-main', '메인'), TL('biotech-d-bt-overview', '전경'), TL('biotech-d-bt-2f', '2층')] },
    { title: 'Dashboard: SKH Security', area: '안전·보안', date: 'August 7, 2025', slides: [
      TL('skh-security', '보안 현황')] },
    { title: 'Dashboard: SHCard Smart Channel', area: '종합현황', date: 'May 15, 2026', slides: [
      TL('shcard-overall', '종합현황'), TL('shcard-smartchannel-general-board', '종합 보드'),
      TL('shcard-smartchannel-system-status', '시스템 현황'), TL('shcard-smartchannel-service-homepage', '서비스 · 홈페이지'),
      TL('shcard-smartchannel-iinfra-dbms', '인프라 · DBMS')] },
    { title: 'Dashboard: HANA Bank H.I.T', area: '종합현황', date: 'June 30, 2025', slides: [
      { img: 'src/templates/hana-overview-02.jpg', label: '종합현황02' }] },
  ];
  const TEMPLATES = TPL_DEFS.map((d, i) => {
    const n = i + 1;
    const dt = d.title.startsWith('Digital Twin');
    const screenType = dt ? '3D 디지털트윈' : '2D 대시보드';
    return {
      img: d.slides[0].img,
      title: d.title,
      date: d.date,
      /* 정렬용 값 — ts(최신순): 표시 날짜에서 직접 파싱, pop(인기순): 안정적 의사 조회수 */
      ts: Date.parse(d.date),
      pop: ((n * 7919) % 900) + 100,
      screen: dt ? 'dt' : 'dash',
      screenType, /* 화면 유형 필터용 */
      area: d.area, /* 업무 영역 필터용 */
      year: String(new Date(Date.parse(d.date)).getFullYear()), /* 연도 필터용 */
      badges: [[screenType, 'sol'], [d.area, 'con']],
      /* 화면이 둘 이상일 때만 슬라이드 — 한 장짜리는 상세에서 큰 그림 하나로 보여 준다 */
      slides: d.slides.length > 1 ? d.slides.slice() : null,
    };
  });
  /* SKHynix Icheon 1level — '스튜디오 열기' 시 Figma(1:139)를 HTML/CSS DOM으로 구현한 화면으로 연다
     (src/skhynix-screen.js). 갤러리·상세 미리보기 썸네일은 그 화면을 캡처한 이미지다. */
  (function () {
    const sk = TEMPLATES.find((t) => t.title === 'Digital Twin: SKHynix Icheon 1level');
    if (sk) {
      sk.tpl = 'skhynix';
      sk.img = 'src/templates/skhynix-1.jpg';
      /* 앞 두 장은 실제 화면(Figma 64:1782 메인 · 64:2658 UPS 전력 상세),
         세 번째 2level 은 아직 카탈로그 그림뿐이라 이미지 화면(imageOnly)으로 함께 만든다. */
      sk.slides = [
        { img: 'src/templates/skhynix-1.jpg', label: '메인' },
        { img: 'src/templates/skhynix-2.jpg', label: 'UPS 전력 상세' },
        { img: TPL_LIB + 'skhynix-icheon-2level.jpg', label: '2level 전경', imageOnly: true },
      ];
    }
  })();
  /* Icheon main — '스튜디오 열기' 시 Figma(64:3367 "Screen/FMS Hub")를 순수 HTML/CSS DOM 으로
     재구축한 화면으로 연다(src/skhynix-hub.js). 상세 미리보기도 그 화면을 그대로 캡처한 이미지다. */
  (function () {
    const ic = TEMPLATES.find((t) => t.title === 'Dashboard: Icheon main');
    if (ic) {
      ic.tpl = 'skhynix-hub';
      ic.img = 'src/templates/icheon-hub.jpg';
      /* 두 장 — [0] 메인(64:3367 Screen/FMS Hub), [1] 항온항습기 상세(64:4059 Screen/HVAC Detail).
         두 번째 장은 '스튜디오 열기' 시 같은 프로젝트의 두 번째 화면으로 함께 만들어진다. */
      ic.slides = [
        { img: 'src/templates/icheon-hub.jpg', label: '메인' },
        { img: 'src/templates/icheon-hvac.jpg', label: '항온항습기 상세' },
      ];
    }
  })();
  /* Hanjin main — 상세 페이지에서 3장(메인·입출문현황·하차현황)을 슬라이드로 보여준다. 메인이 첫 장. */
  (function () {
    const hj = TEMPLATES.find((t) => t.title === 'Digital Twin: Hanjin main');
    if (hj) {
      hj.tpl = 'hanjin'; /* 스튜디오 열기 시 한진 디지털 트윈 페이지로 재현 */
      hj.img = 'src/templates/hanjin-1.jpg';
      /* 앞 세 장은 실제 화면, 상차현황은 아직 카탈로그 그림뿐이라 이미지 화면(imageOnly)으로 함께 만든다 */
      hj.slides = [
        { img: 'src/templates/hanjin-1.jpg', label: '메인' },
        { img: 'src/templates/hanjin-2.jpg', label: '입출문현황' },
        { img: 'src/templates/hanjin-3.jpg', label: '하차현황' },
        { img: TPL_LIB + 'hanjin-2d-ld.jpg', label: '상차현황', imageOnly: true },
      ];
    }
  })();
  /* HANA Bank H.I.T — '스튜디오 열기' 시 Figma(H3S2M7DUCvuJgi75oBqg6W) 화면 15장을
     순수 HTML/CSS DOM 으로 재구축한 것(src/hana-*.js)으로 연다. 상세 미리보기도 그 화면을 그대로 캡처한 것이다. */
  (function () {
    const hn = TEMPLATES.find((t) => t.title === 'Dashboard: HANA Bank H.I.T');
    if (hn) {
      hn.tpl = 'hana';
      hn.img = 'src/templates/hana-overview-02.jpg';
      hn.slides = [
        { img: 'src/templates/hana-overview-02.jpg', label: '종합현황02' },
        { img: 'src/templates/hana-cloud-01.jpg', label: '클라우드현황01' },
        { img: 'src/templates/hana-cloud-02.jpg', label: '클라우드현황02' },
        { img: 'src/templates/hana-middleware.jpg', label: '미들웨어현황' },
        { img: 'src/templates/hana-infra-main.jpg', label: '인프라 메인' },
        { img: 'src/templates/hana-infra-detail.jpg', label: '인프라 상세' },
        { img: 'src/templates/hana-event.jpg', label: '이벤트현황' },
        { img: 'src/templates/hana-network-01.jpg', label: '네트워크현황01' },
        { img: 'src/templates/hana-network-02.jpg', label: '네트워크현황02' },
        { img: 'src/templates/hana-network-03.jpg', label: '네트워크현황03' },
        { img: 'src/templates/hana-facility.jpg', label: '상면관리' },
        { img: 'src/templates/hana-security-01.jpg', label: '보안시스템01' },
        { img: 'src/templates/hana-security-02.jpg', label: '보안시스템02' },
        { img: 'src/templates/hana-login.jpg', label: '로그인' },
      ];
    }
  })();
  /* 실제 화면이 붙어 있는 템플릿인지 — Figma를 HTML/CSS DOM(+SVG)으로 재구축해 두어
     '스튜디오 열기'를 누르면 그 화면이 그대로 열리는 것들이다.
     나머지는 아직 카탈로그 그림 한 장뿐이라 갤러리에서 '제작중'으로 표시한다.
     openTemplate() 도 같은 함수를 써서 표시와 실제 동작이 어긋나지 않게 한다. */
  /* 템플릿 데이터의 날짜는 영문('November 3, 2025')이다. 한국어 UI에 그대로 노출되면
     제목만 영어인 카드에서 날짜까지 영어가 되어 이질감이 커진다.
     데이터는 건드리지 않고 표시할 때만 한국어로 바꾼다(파싱 실패 시 원문 유지). */
  function tplDate(v) {
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }
  const tplIsLive = (t) => !!t && (t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub');
  let tplScreen = 'all'; /* 화면 유형 필터(all | 2D 대시보드 | 3D 디지털트윈) */
  let tplArea = 'all';   /* 업무 영역 필터(화면 유형 종속) */
  let tplYear = 'all';   /* 등록 연도 필터 — 화면 유형·업무 영역과 나란한 별개 축이다 */
  let tplQuery = ''; /* 템플릿 갤러리 검색어(제목·배지 대상) */
  let tplSelected = null; /* 상세 페이지로 열어 둔 템플릿(null이면 갤러리) */
  /* ── 전역 뒤로가기용 — 현재 화면 상태 읽기 / 복원 ──
     상태: {t:'launcher',v} 런처 뷰 · {t:'tpl',tpl:제목} 템플릿 상세 · {t:'page',p} 스튜디오 페이지 */
  window.__navState = function () {
    if (home && home.classList.contains('show')) {
      if (tplSelected) return { t: 'tpl', tpl: tplSelected.title };
      /* 폴더(프로젝트 그룹) 안에 들어가 있으면 그 상태도 히스토리에 남긴다 → 크롬 뒤로가기가 폴더 목록으로 정확히 복귀 */
      if (curGroup && view !== 'trash') return { t: 'group', g: curGroup, v: view };
      return { t: 'launcher', v: view };
    }
    const op = [...document.querySelectorAll('.page')].find((p) => !p.hidden);
    return { t: 'page', p: op ? op.dataset.page : ((function () { try { return localStorage.getItem('wemb-view'); } catch (e) { return null; } })() || 'wire') };
  };
  window.__navRestore = function (st) {
    if (!st) return;
    if (st.t === 'launcher') {
      tplSelected = null;
      setView(st.v || 'all'); /* setView가 curGroup=null로 폴더 밖(목록)으로 되돌린다 */
      if (home) home.classList.add('show');
      try { localStorage.setItem('wemb-view', 'home'); } catch (e) {}
    } else if (st.t === 'group') {
      /* 폴더 안(화면 목록)으로 복원 */
      tplSelected = null;
      view = st.v || 'all';
      document.querySelectorAll('.lc-navi').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
      curGroup = st.g || null;
      renderProjects();
      if (home) home.classList.add('show');
      try { localStorage.setItem('wemb-view', 'home'); } catch (e) {}
    } else if (st.t === 'tpl') {
      tplSelected = TEMPLATES.find((x) => x.title === st.tpl) || null;
      renderProjects();
      if (home) home.classList.add('show');
    } else if (st.t === 'page') {
      if (home) home.classList.remove('show');
      if (window.__setPage) window.__setPage(st.p, { noHistory: true });
    }
  };
  /* 템플릿 정렬 — 최신순(날짜)·이름순(제목)·인기순(조회수) */
  const TPL_SORTS = { recent: '최신순', name: '이름순', pop: '인기순' };
  let tplSort = 'recent';
  function sortTemplates(arr) {
    const a = arr.slice();
    if (tplSort === 'name') a.sort((x, y) => x.title.localeCompare(y.title, 'en'));
    else if (tplSort === 'pop') a.sort((x, y) => (y.pop || 0) - (x.pop || 0));
    else a.sort((x, y) => (y.ts || 0) - (x.ts || 0));
    return a;
  }

  const VIEW_META = {
    all: { title: '전체', count: (n) => '프로젝트 ' + n + '개' },
    recent: { title: '최근 편집', count: (n) => n + '개 · 최근 편집순' },
    fav: { title: '즐겨찾기', count: (n) => '즐겨찾기 ' + n + '개' },
    trash: { title: '휴지통', count: (n) => '휴지통 ' + n + '개' },
    tpl: { title: '템플릿', count: () => '템플릿 ' + TEMPLATES.length + '개' },
  };
  const searchTerm = () => (document.getElementById('lcSearch')?.value || '').trim().toLowerCase();

  /* 현재 뷰·검색어에 해당하는 프로젝트 목록 */
  function projectsForView() {
    const all = loadProjects();
    let list;
    if (view === 'trash') list = all.filter((p) => p.deleted);
    else {
      const live = all.filter((p) => !p.deleted);
      if (view === 'fav') list = live.filter((p) => p.fav);
      else if (view === 'recent') list = live.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
      else list = live;
    }
    const q = searchTerm();
    if (q) list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    return list;
  }

  /* 현재 뷰·검색어에 해당하는 프로젝트(폴더) 목록 */
  function groupsForView() {
    const all = loadGroups();
    let list;
    if (view === 'trash') list = all.filter((g) => g.deleted);
    else {
      const live = all.filter((g) => !g.deleted);
      if (view === 'fav') list = live.filter((g) => g.fav);
      else if (view === 'recent') list = live.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
      else list = live.slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    }
    const q = searchTerm();
    if (q) list = list.filter((g) => (g.name || '').toLowerCase().includes(q));
    return list;
  }

  const emptyState = (html) => {
    const d = document.createElement('div');
    d.className = 'lc-empty';
    d.innerHTML = html;
    return d;
  };

  /* 템플릿 갤러리 렌더 — 상단 카테고리 링크(필터) + 3열 카드 그리드.
     카드 클릭 → 해당 화면 종류(대시보드/디지털 트윈)로 새 프로젝트를 만들어 스튜디오 진입. */
  function renderTemplates(g) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const gal = document.createElement('div');
    gal.className = 'tplgal';

    /* 카테고리 — 2단 계층: 윗줄 화면 유형, 아랫줄 업무 영역(화면 유형 종속) */
    const mkCat = (label, on, onClick) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tplcat' + (on ? ' on' : '');
      b.textContent = label;
      b.onclick = onClick;
      return b;
    };
    /* 1단 — 화면 유형 */
    const cats = document.createElement('div');
    cats.className = 'tplcats';
    cats.appendChild(mkCat('전체', tplScreen === 'all', () => { tplScreen = 'all'; tplArea = 'all'; renderProjects(); }));
    TPL_SCREENS.forEach((s) => {
      cats.appendChild(mkCat(s, tplScreen === s, () => { tplScreen = s; tplArea = 'all'; renderProjects(); }));
    });
    gal.appendChild(cats);
    /* 2단 — 업무 영역 (특정 화면 유형을 골랐을 때만 노출) */
    if (tplScreen !== 'all') {
      const areas = document.createElement('div');
      areas.className = 'tplcats tplsubcats';
      areas.appendChild(mkCat('전체', tplArea === 'all', () => { tplArea = 'all'; renderProjects(); }));
      (TPL_AREAS[tplScreen] || []).forEach((a) => {
        areas.appendChild(mkCat(a, tplArea === a, () => { tplArea = a; renderProjects(); }));
      });
      gal.appendChild(areas);
    }

    /* 연도 — 화면 유형·업무 영역과 나란한 별개 축이다.
       다만 **분류가 아니라 추리는 도구**라, 카테고리 줄이 아니라 아래 검색·정렬 줄에 둔다.
       고를 수 있는 해는 **지금 고른 유형·영역에 실제로 있는 것만** 뽑는다 —
       눌렀는데 빈 화면이 나오는 죽은 선택지가 없다. */
    const inScope = TEMPLATES.filter((t) =>
      (tplScreen === 'all' || t.screenType === tplScreen) && (tplArea === 'all' || t.area === tplArea));
    const years = [...new Set(inScope.map((t) => t.year))].sort((a, b) => b.localeCompare(a));
    const yearCnt = {};
    inScope.forEach((t) => { yearCnt[t.year] = (yearCnt[t.year] || 0) + 1; });
    /* 고른 해가 지금 범위에서 사라졌으면(유형을 바꿔서) 조용히 전체로 되돌린다.
       고를 해가 하나뿐이면 드롭다운을 숨기는데, 그때 걸러 둔 채로 두면 풀 방법이 없으니 같이 푼다. */
    if (years.length <= 1 || years.indexOf(tplYear) < 0) tplYear = 'all';

    /* 정렬 드롭다운 — 카테고리 바 '아래' 행 오른쪽(최신순·이름순·인기순) */
    const sortIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h13"/><path d="M4 12h9"/><path d="M4 18h5"/><path d="M16 9l3-3 3 3"/><path d="M19 6v12"/></svg>';
    const chevIcon = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
    const ckIcon = '<svg class="ck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const sortBar = document.createElement('div');
    sortBar.className = 'tplsortbar';

    /* 검색창 — 정렬 바 왼쪽. 제목·배지를 대상으로 실시간 필터 */
    const searchIcon = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
    const clearIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    const searchWrap = document.createElement('div');
    searchWrap.className = 'tplsearch' + (tplQuery ? ' has-val' : '');
    searchWrap.innerHTML =
      searchIcon +
      '<input type="text" class="tplsearch-input" placeholder="템플릿 검색" aria-label="템플릿 검색">' +
      '<button type="button" class="tplsearch-clear" aria-label="검색어 지우기">' + clearIcon + '</button>';
    const searchInput = searchWrap.querySelector('.tplsearch-input');
    searchInput.value = tplQuery;
    searchInput.addEventListener('input', () => {
      tplQuery = searchInput.value;
      searchWrap.classList.toggle('has-val', !!tplQuery.trim());
      renderGrid();
    });
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tplQuery) { tplQuery = ''; searchInput.value = ''; searchWrap.classList.remove('has-val'); renderGrid(); }
    });
    searchWrap.querySelector('.tplsearch-clear').onclick = () => {
      tplQuery = ''; searchInput.value = ''; searchWrap.classList.remove('has-val'); renderGrid(); searchInput.focus();
    };
    sortBar.appendChild(searchWrap);

    /* 오른쪽 묶음 — 연도 · 정렬. 둘 다 '목록을 추리고 고르는' 같은 성격이라 나란히 둔다. */
    const right = document.createElement('div');
    right.className = 'tplbarright';

    /* 연도 드롭다운 — 정렬과 똑같은 부품을 쓴다(생김새를 새로 들이지 않는다).
       메뉴에 해마다 개수를 적어 두어, 열어 보면 어느 해에 자료가 있는지 바로 보인다. */
    if (years.length > 1) {
      const yIcon = '<svg class="yico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4"/><path d="M16 3v4"/><path d="M3 11h18"/></svg>';
      const yWrap = document.createElement('div');
      yWrap.className = 'tplsort';
      const opt = (key, label, count) =>
        '<button type="button" class="tplsort-opt' + (key === tplYear ? ' on' : '') + '" role="option" data-y="' + key + '">' +
        label + '<span class="num">' + count + '</span>' + ckIcon + '</button>';
      yWrap.innerHTML =
        '<button type="button" class="tplsort-btn' + (tplYear === 'all' ? '' : ' filtered') + '" aria-haspopup="listbox">' + yIcon +
          '<span class="tplsort-lbl">' + (tplYear === 'all' ? '전체 연도' : tplYear + '년') + '</span>' + chevIcon + '</button>' +
        '<div class="tplsort-menu" role="listbox">' +
          opt('all', '전체 연도', inScope.length) +
          years.map((y) => opt(y, y + '년', yearCnt[y])).join('') +
        '</div>';
      yWrap.querySelector('.tplsort-btn').onclick = (e) => { e.stopPropagation(); yWrap.classList.toggle('open'); };
      yWrap.querySelectorAll('.tplsort-opt').forEach((op) => {
        op.onclick = (e) => {
          e.stopPropagation();
          if (tplYear === op.dataset.y) { yWrap.classList.remove('open'); return; }
          tplYear = op.dataset.y;
          renderProjects();
        };
      });
      right.appendChild(yWrap);
    }

    const sortWrap = document.createElement('div');
    sortWrap.className = 'tplsort';
    sortWrap.innerHTML =
      '<button type="button" class="tplsort-btn" aria-haspopup="listbox">' + sortIcon +
        '<span class="tplsort-lbl">' + TPL_SORTS[tplSort] + '</span>' + chevIcon + '</button>' +
      '<div class="tplsort-menu" role="listbox">' +
        Object.keys(TPL_SORTS).map((k) => '<button type="button" class="tplsort-opt' + (k === tplSort ? ' on' : '') + '" role="option" data-sort="' + k + '">' + TPL_SORTS[k] + ckIcon + '</button>').join('') +
      '</div>';
    sortWrap.querySelector('.tplsort-btn').onclick = (e) => { e.stopPropagation(); sortWrap.classList.toggle('open'); };
    sortWrap.querySelectorAll('.tplsort-opt').forEach((op) => {
      op.onclick = (e) => { e.stopPropagation(); tplSort = op.dataset.sort; renderProjects(); };
    });
    right.appendChild(sortWrap);
    sortBar.appendChild(right);
    gal.appendChild(sortBar);
    /* 바깥 클릭 시 정렬 메뉴 닫기(한 번만 등록) */
    if (!window.__tplSortDocClose) {
      window.__tplSortDocClose = true;
      document.addEventListener('click', () => {
        document.querySelectorAll('.tplsort.open').forEach((s) => s.classList.remove('open'));
      });
    }

    /* 카드 그리드 — 카테고리·검색어에 맞는 템플릿만 그린다.
       검색 중 타이핑마다 이 함수만 다시 돌려 입력 포커스를 유지한다. */
    const grid = document.createElement('div');
    grid.className = 'tplgrid';
    gal.appendChild(grid);
    g.appendChild(gal);

    const arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
    function renderGrid() {
      grid.innerHTML = '';
      const q = tplQuery.trim().toLowerCase();
      const list = sortTemplates(TEMPLATES.filter((t) => {
        if (tplScreen !== 'all' && t.screenType !== tplScreen) return false;
        if (tplArea !== 'all' && t.area !== tplArea) return false;
        if (tplYear !== 'all' && t.year !== tplYear) return false;
        if (!q) return true;
        return t.title.toLowerCase().includes(q) || t.badges.some((bd) => bd[0].toLowerCase().includes(q));
      }));
      if (!list.length) {
        const e = document.createElement('div');
        e.className = 'tplempty';
        e.textContent = q
          ? '‘' + tplQuery.trim() + '’ 검색 결과가 없어요.'
          : tplYear !== 'all'
            ? tplYear + '년에 등록된 템플릿이 아직 없어요.'
            : '해당 카테고리에 맞는 템플릿이 아직 없어요.';
        grid.appendChild(e);
      }
      list.forEach((t) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'tplcard';
        /* 아직 화면이 없는 템플릿만 표시한다 — 준비된 쪽은 아무것도 붙이지 않는다.
           흐려진 것들 사이에서 **밝은 썸네일 자체가** 준비됐다는 신호다. */
        const live = tplIsLive(t);
        /* 배지를 뒤집었다. 38개 중 34개(89%)에 '제작중'을 붙이면 변별력이 0이고,
           그 배지가 썸네일 한가운데를 덮어 정작 보여줄 그림을 가렸다.
           지금은 실제로 열리는 4개에만 '열기 가능'을 붙이고, 위치도 모서리로 뺀다. */
        card.innerHTML =
          '<div class="tplthumb' + (live ? '' : ' wip') + '">' +
            '<img loading="lazy" src="' + t.img + '" alt="' + esc(t.title) + '">' +
            (live ? '<span class="tplstate ready">열기 가능</span>' : '') +
          '</div>' +
          '<div class="tplbox">' +
            '<div class="tplsec1">' +
              '<div class="tplbadges">' +
                t.badges.map((bd) => '<span class="tplbadge ' + bd[1] + '">' + esc(bd[0]) + '</span>').join('') +
              '</div>' +
              '<div class="tpltitle">' + esc(t.title) + '</div>' +
            '</div>' +
            '<div class="tplsec2">' +
              '<span class="tpldate">' + esc(tplDate(t.date)) + '</span>' +
              '<span class="tplmore">자세히 보기' + arrow + '</span>' +
            '</div>' +
          '</div>';
        card.onclick = () => { tplSelected = t; renderProjects(); if (window.__navOnNavigate) window.__navOnNavigate({ t: 'tpl', tpl: t.title }); };
        grid.appendChild(card);
      });

      const cnt = document.getElementById('lcCount');
      if (cnt) {
        if (q) cnt.textContent = list.length + '개 · ‘' + tplQuery.trim() + '’ 검색';
        else if (tplScreen === 'all' && tplArea === 'all') cnt.textContent = VIEW_META.tpl.count();
        else cnt.textContent = list.length + '개 · ' + [tplScreen !== 'all' ? tplScreen : null, tplArea !== 'all' ? tplArea : null].filter(Boolean).join(' · ');
      }
    }
    renderGrid();
  }

  /* 템플릿 상세 페이지 — Figma Studio(170:593): 배지 · 제목/날짜 · 큰 프리뷰 이미지.
     맨 위 '목록으로'로 갤러리에 복귀, 아래 CTA로 이 구성을 스튜디오에 반영한다. */
  function renderTemplateDetail(g, t) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const backIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    const goIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';
    const chevL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    const chevR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

    /* 프리뷰 영역 — 슬라이드가 여러 장이면 캐러셀, 아니면 단일 이미지 */
    const heroHTML = t.slides
      ? '<div class="tpld-sliderwrap">' +
          '<div class="tpld-hero tpld-slider">' +
            '<div class="tpld-track">' +
              t.slides.map((s) => '<img class="tpld-slide" src="' + s.img + '" alt="' + esc(t.title + ' · ' + s.label) + '">').join('') +
            '</div>' +
            '<span class="tpld-caption"></span>' +
          '</div>' +
          '<button type="button" class="tpld-nav prev" aria-label="이전">' + chevL + '</button>' +
          '<button type="button" class="tpld-nav next" aria-label="다음">' + chevR + '</button>' +
        '</div>' +
        '<div class="tpld-dots">' +
          t.slides.map((s, i) => '<button type="button" class="tpld-dot" data-i="' + i + '" aria-label="' + esc(s.label) + '"></button>').join('') +
        '</div>'
      : '<div class="tpld-hero"><img src="' + t.img + '" alt="' + esc(t.title) + '"></div>';

    const det = document.createElement('div');
    det.className = 'tpldetail';
    det.innerHTML =
      '<button type="button" class="tpld-back">' + backIcon + '목록으로</button>' +
      '<div class="tpld-head">' +
        '<div class="tplbadges">' +
          t.badges.map((bd) => '<span class="tplbadge ' + bd[1] + '">' + esc(bd[0]) + '</span>').join('') +
        '</div>' +
        '<div class="tpld-titlerow">' +
          '<div class="tpld-title">' + esc(t.title) + '</div>' +
          '<div class="tpld-date">' + esc(tplDate(t.date)) + '</div>' +
        '</div>' +
      '</div>' +
      heroHTML +
      '<div class="tpld-cta"><button type="button" class="tpld-start">이 구성으로 스튜디오 열기' + goIcon + '</button></div>';
    g.appendChild(det);
    /* 지금 보고 있는 슬라이드 번호(0=메인). CTA는 '보고 있는 그 시안'으로 스튜디오를 연다 */
    let curSlide = 0;
    det.querySelector('.tpld-back').onclick = () => { tplSelected = null; renderProjects(); if (window.__navOnNavigate) window.__navOnNavigate({ t: 'launcher', v: view }); };
    const startBtn = det.querySelector('.tpld-start');
    startBtn.onclick = () => openTemplate(t, curSlide);

    /* 슬라이더 배선 — 화살표/점으로 이동, 메인(0번)이 첫 장 */
    if (t.slides) {
      const track = det.querySelector('.tpld-track');
      const dots = [...det.querySelectorAll('.tpld-dot')];
      const cap = det.querySelector('.tpld-caption');
      const n = t.slides.length;
      let idx = 0;
      const go = (i) => {
        idx = (i + n) % n;
        curSlide = idx;
        track.style.transform = 'translateX(' + -idx * 100 + '%)';
        dots.forEach((d, k) => d.classList.toggle('on', k === idx));
        cap.textContent = (idx + 1) + ' / ' + n + '  ·  ' + t.slides[idx].label;
        /* 버튼도 지금 장면을 말해 준다 — '메인 시안으로 스튜디오 열기' */
        startBtn.innerHTML = '‘' + esc(t.slides[idx].label) + '’ 시안으로 스튜디오 열기' + goIcon;
      };
      det.querySelector('.tpld-nav.prev').onclick = () => go(idx - 1);
      det.querySelector('.tpld-nav.next').onclick = () => go(idx + 1);
      dots.forEach((d) => (d.onclick = () => go(+d.dataset.i)));
      go(0);
    }

    const cnt = document.getElementById('lcCount');
    if (cnt) cnt.textContent = t.title;
  }

  /* 상세 페이지 CTA / 스튜디오 진입 → 그 화면 종류로 새 프로젝트를 만들고 스튜디오로 진입.
     tpl이 붙은 템플릿(한진)은 디지털 트윈 페이지로 재현하므로 DT 화면으로 연다. */
  function openTemplate(t, slideIndex) {
    const isDT = t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix-hub' || t.screen === 'dt';
    /* Figma로 구현된 템플릿(한진·SK하이닉스·HANA)은 실제 화면으로, 아직 미연결이면 임시 이미지로 연다.
       갤러리의 '제작중' 표시와 같은 판정을 쓴다(tplIsLive) — 표시와 동작이 어긋나면 안 된다. */
    const connected = tplIsLive(t);
    const useTpl = connected ? t.tpl : 'image';
    pending = {
      name: t.title,
      screen: isDT ? 'dt' : 'dash',
      layout: isDT ? 'dt-3l-2r' : 'g3-2r',
      tpl: useTpl,
      img: connected ? null : t.img,
      /* 미리보기 썸네일의 장면들을 그대로 '프로젝트 안의 화면들'로 만든다 */
      slides: Array.isArray(t.slides) ? t.slides.slice() : null,
      /* 상세에서 보고 있던 장면 번호(0=메인, 1=팝업…) — 스튜디오가 그 시안으로 바로 열린다 */
      slideIndex: Math.max(0, slideIndex || 0),
    };
    startStudio();
  }

  function renderProjects() {
    const g = document.getElementById('lcGrid');
    if (!g) return;
    g.innerHTML = '';
    g.classList.toggle('tplmode', view === 'tpl');
    if (view !== 'tpl') tplSelected = null;

    /* 도구 줄 — 뷰별로 버튼을 켜고 끈다
       · 새 프로젝트: 전체·최근 편집에서만
       · 전체삭제: 휴지통에서만
       · 검색: 전체·최근·즐겨찾기에서 (템플릿·휴지통 제외) */
    const tools = document.getElementById('lcTools');
    if (tools) tools.hidden = view === 'tpl';
    const newBtn = document.getElementById('lcNew');
    if (newBtn) newBtn.hidden = !(view === 'all' || view === 'recent');
    const searchWrap = document.getElementById('lcSearchWrap');
    if (searchWrap) searchWrap.hidden = !(view === 'all' || view === 'recent' || view === 'fav');
    const delAll = document.getElementById('lcEmptyTrash');
    if (delAll) {
      delAll.hidden = view !== 'trash';
      delAll.disabled = !loadGroups().some((g) => g.deleted);
    }
    const selDel = document.getElementById('lcSelDel');
    if (selDel) selDel.hidden = view !== 'trash';
    updateTrashSelUI();

    /* 템플릿 — 선택한 카드가 있으면 상세 페이지, 없으면 갤러리(169:150) */
    if (view === 'tpl') {
      if (tplSelected) renderTemplateDetail(g, tplSelected);
      else renderTemplates(g);
      return;
    }

    /* 폴더 계층: 폴더(프로젝트) 목록 ↔ 폴더 내부(화면 목록). 휴지통은 폴더 단위. */
    const inGroup = !!curGroup && view !== 'trash';
    const backBtn = document.getElementById('lcBack');
    if (backBtn) { backBtn.hidden = !inGroup; backBtn.disabled = !inGroup; }
    if (newBtn) {
      newBtn.hidden = !(view === 'all' || view === 'recent' || inGroup);
      newBtn.querySelector('svg')?.nextSibling && (newBtn.lastChild.textContent = inGroup ? '새 화면' : '새 프로젝트');
      newBtn.onclick = inGroup ? () => startNewScreen(curGroup) : startNewProject;
    }

    const count = inGroup ? renderScreens(g, curGroup) : renderFolders(g);

    const gname = inGroup ? (groupById(curGroup)?.name || '프로젝트') : '';
    const title = document.getElementById('lcTitle');
    if (title) {
      /* 프로젝트 안에서는 폴더 아이콘 + 프로젝트명으로 '들어와 있음'을 분명히 한다 */
      title.innerHTML = '';
      if (inGroup) {
        const ic = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        ic.setAttribute('class', 'lc-titleico');
        ic.setAttribute('viewBox', '0 0 24 24');
        ic.setAttribute('fill', 'none');
        ic.setAttribute('stroke', 'currentColor');
        ic.setAttribute('stroke-width', '2');
        ic.setAttribute('stroke-linecap', 'round');
        ic.setAttribute('stroke-linejoin', 'round');
        ic.innerHTML = '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>';
        title.appendChild(ic);
      }
      title.appendChild(document.createTextNode(inGroup ? gname : (VIEW_META[view] || VIEW_META.all).title));
    }
    const cnt = document.getElementById('lcCount');
    if (cnt) cnt.textContent = inGroup ? ('이 프로젝트의 화면 ' + count + '개') : (VIEW_META[view] || VIEW_META.all).count(count);
    /* 경로 표시(브레드크럼) — 프로젝트 안에서만 노출 */
    const crumb = document.getElementById('lcCrumb');
    const crumbCur = document.getElementById('lcCrumbCur');
    if (crumb) crumb.hidden = !inGroup;
    if (crumbCur) crumbCur.textContent = gname;
    g.classList.toggle('inproject', inGroup);
  }

  /* 화면 썸네일 요소 — 작업된 실제 시안 이미지(screen.thumb: dataURL 또는 템플릿 이미지 경로)가 있으면 그걸,
     없으면 레이아웃 와이어프레임으로 폴백. */
  function screenThumbEl(s) {
    if (s && s.thumb) {
      const img = document.createElement('img');
      img.className = 'lc-shot'; img.alt = ''; img.loading = 'lazy'; img.src = s.thumb;
      img.addEventListener('error', function onErr() { img.removeEventListener('error', onErr); const wf = wfEl(findLayout(s.layout) || LAYOUTS.g3[1]); img.replaceWith(wf); }, { once: true });
      return img;
    }
    return wfEl(findLayout(s && s.layout) || LAYOUTS.g3[1]);
  }
  /* 현재 스튜디오 화면을 캡처해 그 화면의 썸네일(작은 JPEG)로 저장.
     홈으로 나갈 때 호출. 실패해도 조용히 넘어가고 와이어프레임 폴백을 쓴다.

     ── 왜 html2canvas 를 기본으로 쓰지 않는가 (실측) ──
     SK하이닉스 같은 템플릿 화면은 통째로 인라인 SVG(약 1.4MB·필터 88개·그라데이션 211개)다.
     html2canvas 는 이걸 iframe 으로 복제해 처음부터 다시 그리기 때문에 1920×1080 기준
     캡처 13.3초 + toDataURL 1.0초, 총 14초가 걸렸다. 홈으로 나간 직후 이 작업이 돌면서
     메인 스레드를 붙잡아, 런처에서 누르는 모든 동작이 멈춘 것처럼 느껴졌다.
     브라우저는 SVG 를 직접 래스터화할 수 있으므로 직렬화해 <img> 로 그리면 같은 그림이
     0.2~0.3초에 나온다(약 40배). 그래서 아래 순서로 시도한다.
       1) 인라인 SVG 시안  → SVG 직렬화 래스터
       2) 통짜 이미지 시안 → 그 <img> 를 캔버스에 바로 그림(즉시)
       3) 그 밖의 대시보드 → html2canvas (가벼운 DOM 이라 부담이 작다)
     시안 위에 얹은 '추가 패널'은 그 레이어만 따로 잡아 합성한다. */
  const THUMB_W = 480;
  /* html2canvas 폴백이 이 기기에서 '지나치게' 느리면 기억해 뒀다가 갱신 캡처를 건너뛴다.
     ── 기준값을 4초로 올린 이유(실측) ──
     예전 기준은 1.5초였는데, 이 앱의 보통 대시보드가 1,221노드에 **2.55초**다. 즉 첫 캡처에서
     거의 항상 '느림'으로 찍히고, 그 플래그가 localStorage 에 영구 저장돼 **그 뒤로 만든 모든
     일반 대시보드가 썸네일 없이 와이어프레임으로만 보였다**(템플릿 화면은 SVG 직렬화 경로라
     멀쩡했으므로 "새로 만든 화면만 안 나온다"로 보였다).
     1.5초 기준이 원래 노렸던 건 6.5초짜리 트윈 대시보드인데, 그건 이제 SVG 경로(0.3초)로 빠진다.
     → 보통 대시보드는 정상 통과시키고, 정말 느린 기기만 걸리도록 4초로 둔다.
     키 이름도 바꿔 이미 '1' 로 굳어 버린 옛 플래그를 무시한다(기준이 달라졌으므로 재측정). */
  const SLOW_KEY = 'wemb-thumb-slowpath2';
  const SLOW_MS = 4000;
  let __slowPath = false; try { __slowPath = localStorage.getItem(SLOW_KEY) === '1'; } catch (e) {}
  try { localStorage.removeItem('wemb-thumb-slowpath'); } catch (e) {} /* 옛 키 정리 */
  let __capturing = false;
  /* file:// 로 열면 로컬 이미지 때문에 캔버스가 '오염'되어 toDataURL 이 차단된다(브라우저 보안).
     이 경우 캡처는 매번 실패하면서 3초씩 메인 스레드를 잡아먹으므로, 한 번 실패하면 더 시도하지 않는다.
     (http/https 로 열거나 배포본에서는 정상 동작한다.) */
  let __captureBlocked = false;

  /* .skx-svg 를 겨냥한 CSS 규칙 모음(모드별 캐시). 직렬화한 SVG 안에 <style> 로 심어야
     theme.css 의 [fill="#…"]→var(--skx-c…) 매핑이 살아나 '지금 화면 색' 그대로 찍힌다.
     바깥 스타일시트는 <img> 로 그린 SVG 안까지 따라 들어가지 않기 때문이다. */
  const __shotCss = {};
  function shotCssFor(mode) {
    if (__shotCss[mode] != null) return __shotCss[mode];
    let css = '';
    for (const sh of document.styleSheets) {
      let rs; try { rs = sh.cssRules; } catch (e) { continue; }
      for (const r of rs || []) {
        const sel = r.selectorText;
        if (!sel || sel.indexOf('.skx-svg') < 0) continue;
        if (/:hover|:focus|:active/.test(sel)) continue;                    /* 상호작용 상태는 캡처에 불필요 */
        if (/data-mode/.test(sel) && sel.indexOf(mode) < 0) continue;        /* 지금 모드의 규칙만 */
        const parts = sel.split(',').map((s) => {
          const i = s.lastIndexOf('.skx-svg'); if (i < 0) return null;
          const rest = s.slice(i + 8).trim(); return rest || ':root';        /* 복제본의 루트가 곧 .skx-svg */
        }).filter(Boolean);
        if (parts.length) css += parts.join(',') + '{' + r.style.cssText + '}';
      }
    }
    return (__shotCss[mode] = css);
  }
  /* 인라인 SVG → 캔버스. 브라우저가 직접 래스터화하므로 빠르다. */
  async function svgToCanvas(svg, W, H) {
    const clone = svg.cloneNode(true);
    /* 호스트에 걸린 CSS 변수(--skx-c*·--skx-accent 등)를 복제본으로 옮겨야 시안 색이 유지된다 */
    const cs = getComputedStyle(svg);
    let vars = '';
    for (let i = 0; i < cs.length; i++) { const n = cs[i]; if (n.indexOf('--') === 0) vars += n + ':' + cs.getPropertyValue(n) + ';'; }
    clone.setAttribute('style', (svg.getAttribute('style') || '') + vars);
    clone.setAttribute('width', W); clone.setAttribute('height', H);
    const css = shotCssFor(document.querySelector('.main')?.dataset.mode || 'dark');
    if (css) {
      const st = document.createElementNS('http://www.w3.org/2000/svg', 'style');
      st.textContent = css; clone.insertBefore(st, clone.firstChild);
    }
    const xml = new XMLSerializer().serializeToString(clone);
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res; img.onerror = () => rej(new Error('svg raster fail'));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    });
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    cv.getContext('2d').drawImage(img, 0, 0, W, H);
    return cv;
  }
  /* 시안 위에 얹은 '추가 패널'만 따로 캡처해 합성. 패널 몇 개뿐이라 html2canvas 라도 가볍다. */
  async function overlayAdded(stage, cv, W) {
    try {
      const layer = stage.querySelector('.dt-added');
      if (!layer || !layer.offsetWidth || !layer.querySelector('.panel')) return cv;
      if (!(window.html2canvas || window.html2canvasPro)) { try { await loadH2C(); } catch (e) {} }
      const render = window.html2canvas || window.html2canvasPro;
      if (!render) return cv;
      const sc = W / stage.offsetWidth;
      const oc = await render(layer, { scale: sc, backgroundColor: null, logging: false, useCORS: true });
      const sr = stage.getBoundingClientRect(), lr = layer.getBoundingClientRect();
      cv.getContext('2d').drawImage(oc, (lr.left - sr.left) * sc, (lr.top - sr.top) * sc);
    } catch (e) {}
    return cv;
  }
  async function captureScreenThumb() {
    if (__capturing || __captureBlocked) return;
    let id = null; try { id = localStorage.getItem(CUR_PROJ); } catch (e) {}
    if (!id) return;
    /* 이 화면에 아직 썸네일이 없으면 무슨 일이 있어도 한 번은 만든다 — 런처에 와이어프레임으로
       남지 않게. '느린 기기' 판정은 **이미 있는 썸네일을 다시 찍는** 경우에만 건너뛰는 근거다. */
    let hasThumb = false;
    try { hasThumb = !!(loadProjects().find((x) => x.id === id) || {}).thumb; } catch (e) {}
    /* 캡처 대상은 실제 대시보드 캔버스(.stage) — 디지털 트윈이면 #dtStage. 보이는 쪽을 고른다.
       (예전엔 .main 전체를 잡아 편집 크롬·여백까지 들어갔다.) 없으면 .main으로 폴백. */
    const dtStage = document.getElementById('dtStage');
    const dashStage = document.querySelector('.stage');
    const el = (dtStage && !dtStage.hidden) ? dtStage
             : (dashStage && !dashStage.hidden) ? dashStage
             : document.querySelector('.main');
    if (!el || !el.offsetWidth) return;
    __capturing = true;
    /* 런처가 덮고 있으면 스튜디오는 content-visibility:hidden 이라 레이아웃이 없다 —
       그대로 찍으면 빈 그림이 나온다. 찍는 동안만 되살린다(끝나면 finally 에서 되돌린다). */
    document.body.classList.add('wemb-capturing');
    try {
      const W = THUMB_W, H = Math.max(1, Math.round(W * (el.offsetHeight / el.offsetWidth)));
      let bg = '#0a0a0e'; try { const cb = getComputedStyle(el).backgroundColor; if (cb && cb !== 'rgba(0, 0, 0, 0)' && cb !== 'transparent') bg = cb; } catch (e) {}
      let canvas = null;

      /* 1) 인라인 SVG 시안 — 가장 빠른 길 */
      const svg = el.querySelector('svg.skx-svg');
      if (svg && svg.getBoundingClientRect().width > 1) {
        try { canvas = await overlayAdded(el, await svgToCanvas(svg, W, H), W); } catch (e) { canvas = null; }
      }
      /* 2) 통짜 이미지 시안(한진·이미지 템플릿) — 이미 로드된 그림이라 그리기만 하면 된다 */
      if (!canvas) {
        const shot = el.querySelector('img.tplimg-shot, img.hj-studioimg');
        if (shot && shot.complete && shot.naturalWidth) {
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          const cx = cv.getContext('2d'); cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
          const sc = W / el.offsetWidth, sr = el.getBoundingClientRect(), ir = shot.getBoundingClientRect();
          cx.drawImage(shot, (ir.left - sr.left) * sc, (ir.top - sr.top) * sc, ir.width * sc, ir.height * sc);
          canvas = await overlayAdded(el, cv, W);
        }
      }
      /* 2-b) FMS Hub 시안(HTML/CSS DOM 635노드) — html2canvas 로는 실측 4.9초가 걸려 홈 전환이 멈춘 것처럼 보인다.
              형상이 고정된 시안이므로 같은 화면을 그대로 캡처해 둔 이미지를 대신 그린다(추가 패널만 따로 합성). */
      if (!canvas && (el.querySelector('.skh-root') || el.querySelector('.skv-root'))) {
        try {
          const shotSrc = el.querySelector('.skv-root') ? 'src/templates/icheon-hvac.jpg' : 'src/templates/icheon-hub.jpg';
          const im = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = shotSrc; });
          const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
          const cx = cv.getContext('2d'); cx.fillStyle = bg; cx.fillRect(0, 0, W, H);
          /* 시안은 16:9, 스테이지는 그렇지 않을 수 있다 → 늘이지 말고 cover 로 채운다 */
          const sc = Math.max(W / im.naturalWidth, H / im.naturalHeight);
          const dw = im.naturalWidth * sc, dh = im.naturalHeight * sc;
          cx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
          canvas = await overlayAdded(el, cv, W);
        } catch (e) { canvas = null; }
      }
      /* 3) 일반 대시보드 — DOM 이라 html2canvas 로 그린다.
            이 경로는 화면 하나에 수 초가 걸린다(실측: 1,227노드 대시보드에 6.5초). 그래서
            한 번 시간을 재 보고 느리면 그 뒤로는 자동 캡처를 하지 않는다 — 이미 만들어 둔
            썸네일(없으면 배치 와이어프레임)을 그대로 쓰고, 조작 중에 다시 멈추지 않게 한다. */
      if (!canvas) {
        /* ── 무거운 길(html2canvas)은 **썸네일이 아직 없을 때만** 간다 ──
           이미 있는 썸네일을 홈으로 나갈 때마다 다시 찍느라, 런처가 뜬 직후 메인 스레드가
           통째로 멈췄다(실측: 한 프레임 4.8초 · 막힌 시간 합 5.4초). 목록이 떠 있는데 스크롤도
           호버도 몇 초간 안 먹는 게 '스튜디오 홈이 버벅인다' 의 정체였다.
           갱신해서 얻는 건 '조금 더 최신인 그림' 하나뿐이라 바꿀 값이 아니다.
           · 시안(인라인 SVG·통짜 이미지·이천 FMS)은 위쪽 빠른 길이 밀리초에 끝내므로 매번 갱신된다.
           · 썸네일이 없는 화면은 scheduleThumbCapture 가 **스튜디오에 있는 동안 유휴 시점에**
             한 번 찍어 두므로, 홈으로 나갈 때는 대개 여기까지 오지도 않는다. */
        if (hasThumb) return;
        /* 런처가 떠 있는 동안에도 가지 않는다 — 목록이 뜬 채로 몇 초씩 얼어붙는다.
           썸네일이 없는 화면은 다음에 그 화면을 열 때 enterStudio 가 걸어 둔 유휴 캡처
           (scheduleThumbCapture)가 스튜디오 안에서 조용히 찍는다. */
        if (document.getElementById('flowHome')?.classList.contains('show')) return;
        const h2c = () => window.html2canvas || window.html2canvasPro;
        if (!h2c()) { try { await loadH2C(); } catch (e) {} }
        const render = h2c();
        if (!render) return;
        const tSlow = (window.performance && performance.now) ? performance.now() : 0;
        /* html2canvas는 캡처 대상을 iframe으로 '복제'해 그리는데, 복제본에선 진입 애니메이션(panelIn: opacity 0→1)이
           처음부터 다시 시작된다. 스태거 지연(animation-delay)까지 겹쳐 패널이 opacity:0(backwards 채움) 상태로 찍혀
           썸네일이 빈(어두운) 사각형이 됐다. onclone에서 복제본의 애니메이션·트랜지션을 끄고 최종 표시 상태로 고정한다. */
        canvas = await render(el, {
          scale: W / el.offsetWidth, logging: false, useCORS: true, backgroundColor: bg,
          onclone: (doc) => {
            try {
              const s = doc.createElement('style');
              s.textContent = '*,*::before,*::after{animation:none !important;transition:none !important;}'
                + '.kpi,.col .panel,.panel,.dashpage{opacity:1 !important;transform:none !important;}';
              (doc.head || doc.documentElement).appendChild(s);
            } catch (e) {}
          },
        });
        if (tSlow && performance.now() - tSlow > SLOW_MS) {
          __slowPath = true;
          try { localStorage.setItem(SLOW_KEY, '1'); } catch (e) {}
        }
      }
      if (!canvas) return;
      const dataURL = canvas.toDataURL('image/jpeg', 0.72);
      if (dataURL && dataURL.length > 100) {
        const arr = loadProjects(); const s = arr.find((x) => x.id === id);
        if (s) {
          s.thumb = dataURL; try { saveProjects(arr); } catch (e) {} if (s.projectId) touchGroup(s.projectId);
          /* 런처가 보이는 중이면 새 썸네일이 바로 반영되도록 다시 그린다 */
          try { if (document.getElementById('flowHome')?.classList.contains('show')) renderProjects(); } catch (e) {}
        }
      }
    } catch (e) {
      /* 캔버스 오염(SecurityError) 이면 이후 캡처를 중단 — 무의미한 3초 멈춤 방지 */
      if (e && (e.name === 'SecurityError' || /[Tt]ainted/.test(String(e.message || e)))) __captureBlocked = true;
    } finally { __capturing = false; document.body.classList.remove('wemb-capturing'); }
  }
  window.__wembCaptureThumb = captureScreenThumb;
  /* 캡처 라이브러리(html2canvas-pro)를 미리 받아둔다 — 나중 캡처가 지연 없이 즉시 되게 */
  function preloadThumbLib() {
    try { if (!(window.html2canvas || window.html2canvasPro)) loadH2C().catch(() => {}); } catch (e) {}
  }
  /* 스튜디오가 화면에 보일 때(런처 홈이 아닐 때) 현재 화면을 자동 캡처 — 단, '사용자가 조작을 멈춘 뒤'에만.
     html2canvas 캡처는 메인 스레드를 수 초 붙잡는데, 예전엔 고정 시간(1.2초)에 무조건 실행돼서
     그 순간 메뉴 클릭이 '멈춘 것처럼' 느껴졌다(딜레이). 이제 클릭·키·스크롤이 있을 때마다 타이머를 미뤄,
     실제로 손을 뗀 뒤에만 조용히 캡처한다 → 조작 중엔 멈춤이 생기지 않는다. */
  let __thumbCleanup = null;
  function scheduleThumbCapture(delay) {
    preloadThumbLib();
    if (__thumbCleanup) __thumbCleanup(); /* 이전 예약 취소(중복 방지) */
    const IDLE = Math.max(1600, delay || 1600);
    let timer = null;
    const events = ['pointerdown', 'keydown', 'wheel'];
    const cleanup = () => { clearTimeout(timer); events.forEach((t) => window.removeEventListener(t, arm, true)); __thumbCleanup = null; };
    function run() {
      cleanup();
      try {
        const home = document.getElementById('flowHome');
        if (home && home.classList.contains('show')) return;
        let id = null; try { id = localStorage.getItem(CUR_PROJ); } catch (e) {}
        if (!id) return;
        /* 자동(유휴) 캡처는 **아직 썸네일이 없는 화면**에만 — 이미 있는 화면까지 매번 다시 찍으면
           편집 중에 수 초씩 멈춘다. 이미 있는 썸네일의 갱신은 홈으로 나갈 때(goHome)가 맡는다. */
        let has = false;
        try { has = !!(loadProjects().find((x) => x.id === id) || {}).thumb; } catch (e) {}
        if (!has) captureScreenThumb();
      } catch (e) {}
    }
    function arm() { clearTimeout(timer); timer = setTimeout(run, IDLE); }
    __thumbCleanup = cleanup;
    events.forEach((t) => window.addEventListener(t, arm, true));
    arm();
  }
  window.__wembScheduleThumb = scheduleThumbCapture;
  /* 스튜디오에서 '작업하는 동안'에는 썸네일을 캡처하지 않는다.
     썸네일은 홈(런처)으로 나갈 때만 만들면 충분하므로 그때만 캡처한다(goHome).
     예전엔 여기서 html2canvas(211KB)를 매 로드마다 미리 받아 뒀는데, 이제 시안 화면은
     SVG 직렬화로 잡아서 그 라이브러리를 아예 쓰지 않는다. 폴백(일반 대시보드)이 필요할 때만
     그 자리에서 로컬 번들을 읽어 오므로, 페이지 로드에서 이 비용을 뺀다. */

  /* 프로젝트(폴더) 썸네일 — 대표 화면 1개를 보여주고, 화면이 여러 개면 마우스 오버 시
     좌·우 화살표가 나타나 눌러서 화면을 넘겨볼 수 있다(점 인디케이터 동기). */
  function folderThumb(screens) {
    const raw = screens.length ? screens : [{ layout: null }];
    /* 대표(첫 슬라이드)는 실제 이미지가 있는 화면을 우선 — 커버가 와이어프레임 대신 실이미지로 보이게 */
    const shots = raw.slice().sort((a, b) => (a && a.thumb ? 0 : 1) - (b && b.thumb ? 0 : 1));
    const n = shots.length;
    const thumb = document.createElement('div');
    thumb.className = 'lc-thumb lc-foldercover';

    const track = document.createElement('div');
    track.className = 'lc-thumbtrack';
    shots.forEach((s) => {
      const slide = document.createElement('div');
      slide.className = 'lc-thumbslide';
      slide.appendChild(screenThumbEl(s));
      track.appendChild(slide);
    });
    thumb.appendChild(track);

    if (n > 1) {
      let idx = 0;
      const dots = document.createElement('div');
      dots.className = 'lc-thumbdots';
      shots.forEach((_, i) => { const d = document.createElement('span'); if (i === 0) d.className = 'on'; dots.appendChild(d); });
      thumb.appendChild(dots);
      const go = (i) => {
        idx = (i + n) % n;
        track.style.transform = 'translateX(' + (-idx * 100) + '%)';
        [...dots.children].forEach((c, k) => c.classList.toggle('on', k === idx));
      };
      const mkArrow = (dir) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lc-thumbarrow ' + dir;
        b.setAttribute('aria-label', dir === 'prev' ? '이전 화면' : '다음 화면');
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="' + (dir === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6') + '"/></svg>';
        b.addEventListener('pointerdown', (e) => e.stopPropagation());
        b.onclick = (e) => { e.stopPropagation(); e.preventDefault(); go(idx + (dir === 'prev' ? -1 : 1)); };
        return b;
      };
      thumb.appendChild(mkArrow('prev'));
      thumb.appendChild(mkArrow('next'));
    }
    return thumb;
  }

  /* 작은 아이콘 버튼 헬퍼 */
  function iconBtn(cls, title, svg, onClick) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.title = title;
    b.setAttribute('aria-label', title);
    b.innerHTML = svg;
    b.onclick = (e) => { e.stopPropagation(); onClick(e); };
    return b;
  }
  const SVG_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>';
  const SVG_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
  const SVG_RESTORE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';

  /* ── 복제 ── */
  function dupScreen(sid) {
    const arr = loadProjects();
    const src = arr.find((x) => x.id === sid); if (!src) return;
    const c = JSON.parse(JSON.stringify(src));
    c.id = newId(); c.name = (src.name || '화면') + ' 사본'; c.ts = Date.now();
    arr.unshift(c); saveProjects(arr);
    if (c.projectId) touchGroup(c.projectId);
    renderProjects();
    if (typeof toast === 'function') toast('"' + src.name + '" 화면을 복제했어요.', { type: 'ok' });
  }
  function dupGroup(gid) {
    const groups = loadGroups();
    const src = groups.find((x) => x.id === gid); if (!src) return;
    const ng = { id: newGid(), name: (src.name || '프로젝트') + ' 사본', fav: false, ts: Date.now() };
    groups.unshift(ng); saveGroups(groups);
    const screens = loadProjects();
    screens.filter((s) => s.projectId === gid).forEach((s) => {
      const c = JSON.parse(JSON.stringify(s)); c.id = newId(); c.projectId = ng.id; c.ts = Date.now(); screens.unshift(c);
    });
    saveProjects(screens);
    renderProjects();
    if (typeof toast === 'function') toast('"' + src.name + '" 프로젝트를 복제했어요.', { type: 'ok' });
  }

  /* ── 폴더(프로젝트) 목록 ── */
  function renderFolders(g) {
    const list = groupsForView();
    if (view === 'all') {
      const add = document.createElement('button');
      add.className = 'lc-card lc-cardnew';
      add.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>새 프로젝트 만들기</span>';
      add.onclick = startNewProject;
      g.appendChild(add);
    }
    if (!list.length) g.appendChild(launcherEmpty());
    /* 화면 목록은 한 번만 읽어 폴더별로 묶어 넘긴다.
       예전엔 folderCard 마다 screensOfGroup() → loadProjects() 가 돌아, 썸네일(base64)까지
       들어 있는 localStorage JSON 을 폴더 수만큼 되풀이해 파싱했다(폴더가 늘수록 홈이 느려짐). */
    const byGroup = {};
    loadProjects().forEach((s) => { (byGroup[s.projectId] || (byGroup[s.projectId] = [])).push(s); });
    list.forEach((grp) => g.appendChild(folderCard(grp, byGroup[grp.id] || [])));
    return list.length;
  }

  function folderCard(grp, preloaded) {
    const screens = preloaded || screensOfGroup(grp.id);
    const card = document.createElement('div');
    card.className = 'lc-card lc-folder' + (view === 'trash' ? ' trashed' : '');
    card.appendChild(folderThumb(screens));
    const body = document.createElement('div');
    body.className = 'lc-cardbody';
    const ttl = document.createElement('div'); ttl.className = 'lc-cardttl';
    const fico = document.createElement('span'); fico.className = 'lc-folderico';
    fico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
    ttl.appendChild(fico); ttl.appendChild(document.createTextNode(grp.name));
    const meta = document.createElement('div'); meta.className = 'lc-cardmeta';
    const s1 = document.createElement('span'); s1.textContent = '화면 ' + screens.length + '개';
    const s2 = document.createElement('span'); s2.textContent = view === 'trash' ? timeago(grp.deletedTs || grp.ts) + ' 삭제' : timeago(grp.ts);
    meta.appendChild(s1); meta.appendChild(s2);
    body.appendChild(ttl); body.appendChild(meta);
    card.appendChild(body);

    if (view === 'trash') {
      card.classList.toggle('sel', trashSel.has(grp.id));
      const toggleSel = () => {
        if (trashSel.has(grp.id)) trashSel.delete(grp.id); else trashSel.add(grp.id);
        card.classList.toggle('sel', trashSel.has(grp.id)); updateTrashSelUI();
      };
      const check = iconBtn('lc-check', '"' + grp.name + '" 선택',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>', toggleSel);
      const acts = document.createElement('div'); acts.className = 'lc-cardacts';
      acts.appendChild(iconBtn('lc-restore', '"' + grp.name + '" 복원', SVG_RESTORE, () => {
        trashSel.delete(grp.id);
        const gs = loadGroups(); const t = gs.find((x) => x.id === grp.id);
        if (t) { delete t.deleted; delete t.deletedTs; saveGroups(gs); }
        renderProjects();
        if (typeof toast === 'function') toast('"' + grp.name + '" 프로젝트를 복원했어요.', { type: 'ok' });
      }));
      acts.appendChild(iconBtn('lc-del', '"' + grp.name + '" 영구 삭제', SVG_TRASH, async () => {
        if (!(await askConfirm({
          title: '“' + grp.name + '” 프로젝트를 영구 삭제할까요?',
          body: '이 프로젝트와 그 안의 화면이 모두 지워져요.',
          confirmLabel: '영구 삭제',
          irreversible: true,
        }))) return;
        trashSel.delete(grp.id);
        saveGroups(loadGroups().filter((x) => x.id !== grp.id));
        saveProjects(loadProjects().filter((s) => s.projectId !== grp.id));
        renderProjects();
        if (typeof toast === 'function') toast('프로젝트를 영구 삭제했어요.', { type: 'ok' });
      }));
      card.appendChild(check); card.appendChild(acts);
      card.setAttribute('role', 'button'); card.tabIndex = 0; card.onclick = toggleSel;
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSel(); } });
    } else {
      const fav = iconBtn('lc-fav' + (grp.fav ? ' on' : ''), '"' + grp.name + '" 즐겨찾기' + (grp.fav ? ' 해제' : ''),
        '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .7-4.4 4 1.2 6-5.4-3-5.4 3 1.2-6-4.4-4 6-.7z"/></svg>', () => {
          const gs = loadGroups(); const t = gs.find((x) => x.id === grp.id); if (t) { t.fav = !t.fav; saveGroups(gs); } renderProjects();
        });
      const acts = document.createElement('div'); acts.className = 'lc-cardacts';
      acts.appendChild(iconBtn('lc-dup', '"' + grp.name + '" 프로젝트 복제', SVG_COPY, () => dupGroup(grp.id)));
      acts.appendChild(iconBtn('lc-del', '"' + grp.name + '" 휴지통으로 이동', SVG_TRASH, () => {
        const gs = loadGroups(); const t = gs.find((x) => x.id === grp.id);
        if (t) { t.deleted = true; t.deletedTs = Date.now(); saveGroups(gs); }
        renderProjects();
        if (typeof toast === 'function') toast('"' + grp.name + '" 프로젝트를 휴지통으로 옮겼어요.', { type: 'ok' });
      }));
      card.appendChild(fav); card.appendChild(acts);
      card.setAttribute('role', 'button'); card.tabIndex = 0;
      const open = () => {
        curGroup = grp.id;
        renderProjects();
        /* 폴더 진입을 히스토리에 쌓아 크롬 뒤로가기가 스튜디오 화면이 아니라 폴더 목록으로 돌아가게 */
        if (window.__navOnNavigate) window.__navOnNavigate({ t: 'group', g: grp.id, v: view });
      };
      card.onclick = open;
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    }
    return card;
  }

  /* ── 폴더 내부: 화면 목록 ── */
  function renderScreens(g, gid) {
    const screens = loadProjects().filter((s) => s.projectId === gid);
    const q = searchTerm();
    const list = q ? screens.filter((s) => (s.name || '').toLowerCase().includes(q)) : screens;
    const addCard = document.createElement('button');
    addCard.className = 'lc-card lc-cardnew';
    addCard.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>새 화면 만들기</span>';
    addCard.onclick = () => startNewScreen(gid);
    g.appendChild(addCard);
    if (!list.length && !q) g.appendChild(emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg><b>화면이 없어요</b><p>‘새 화면 만들기’로 이 프로젝트에 화면을 추가하세요.</p>'));
    list.forEach((s) => g.appendChild(screenCard(s, gid)));
    return list.length;
  }

  function screenCard(s, gid) {
    const card = document.createElement('div');
    card.className = 'lc-card lc-screencard';
    const thumb = document.createElement('div'); thumb.className = 'lc-thumb';
    thumb.appendChild(screenThumbEl(s));
    const body = document.createElement('div'); body.className = 'lc-cardbody';
    const ttl = document.createElement('div'); ttl.className = 'lc-cardttl';
    const sico = document.createElement('span'); sico.className = 'lc-screenico';
    sico.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/></svg>';
    ttl.appendChild(sico); ttl.appendChild(document.createTextNode(s.name));
    const meta = document.createElement('div'); meta.className = 'lc-cardmeta';
    const s1 = document.createElement('span'); s1.textContent = SCREEN_LABEL[s.screen] || '대시보드';
    const s2 = document.createElement('span'); s2.textContent = timeago(s.ts);
    meta.appendChild(s1); meta.appendChild(s2);
    body.appendChild(ttl); body.appendChild(meta);
    card.appendChild(thumb); card.appendChild(body);

    const acts = document.createElement('div'); acts.className = 'lc-cardacts';
    acts.appendChild(iconBtn('lc-dup', '"' + s.name + '" 화면 복제', SVG_COPY, () => dupScreen(s.id)));
    acts.appendChild(iconBtn('lc-del', '"' + s.name + '" 화면 삭제', SVG_TRASH, async () => {
      if (!(await askConfirm({
        title: '“' + s.name + '” 화면을 삭제할까요?',
        body: '이 화면의 배치와 내용이 지워져요.',
        confirmLabel: '삭제',
        irreversible: true,
      }))) return;
      saveProjects(loadProjects().filter((x) => x.id !== s.id));
      renderProjects();
      if (typeof toast === 'function') toast('화면을 삭제했어요.', { type: 'ok' });
    }));
    card.appendChild(acts);
    card.setAttribute('role', 'button'); card.tabIndex = 0;
    const open = () => openProject(s);
    card.onclick = open;
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    return card;
  }

  /* 빈 상태(폴더 목록용) */
  function launcherEmpty() {
    const q = searchTerm();
    if (q) return emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg><b>검색 결과가 없어요</b><p>다른 이름으로 검색해 보세요.</p>');
    if (view === 'trash') return emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/></svg><b>휴지통이 비어 있어요</b><p>삭제한 프로젝트가 여기로 옮겨져요. 언제든 다시 복원할 수 있습니다.</p>');
    if (view === 'fav') return emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.4 4 1.2 6-5.4-3-5.4 3 1.2-6-4.4-4 6-.7z"/></svg><b>즐겨찾기한 프로젝트가 없어요</b><p>카드 왼쪽 위의 ☆ 버튼으로 자주 여는 프로젝트를 모아두세요.</p>');
    if (view === 'recent') return emptyState('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><b>최근 편집한 프로젝트가 없어요</b><p>‘전체’에서 새 프로젝트를 만들어 시작하세요.</p>');
    /* view === 'all' — 첫 사용자가 착지하는 기본 뷰다.
       여기가 비어 있으면 제품과의 첫 대면이 '문구 없는 점선 상자'가 된다.
       다른 뷰와 같은 짜임(아이콘 + 헤드라인 + 안내 + 다음 행동)으로 채운다. */
    return emptyState(
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>' +
        '<b>아직 프로젝트가 없어요</b>' +
        '<p>‘새 프로젝트’를 누르면 몇 가지 질문에 답하는 것만으로 관제 대시보드 시안이 만들어져요.</p>' +
        '<button type="button" class="lc-tplbadge" data-view="tpl">만들어 둔 시안 먼저 둘러보기</button>'
    );
  }

  /* 좌측 메뉴 전환 */
  function setView(v) {
    view = v;
    curGroup = null; /* 뷰를 바꾸면 폴더 밖(프로젝트 목록)으로 */
    trashSel.clear(); /* 뷰를 바꾸면 휴지통 선택 초기화 */
    document.querySelectorAll('.lc-navi').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
    renderProjects();
  }
  /* 경로 표시의 '프로젝트 목록' 클릭 → 폴더 밖으로 (뒤로가기와 동일) */
  document.getElementById('lcCrumbRoot')?.addEventListener('click', () => {
    if (curGroup) { curGroup = null; renderProjects(); if (window.__navOnNavigate) window.__navOnNavigate({ t: 'launcher', v: view }); }
  });
  /* 뒤로가기 — 폴더 내부(화면 목록)에서 프로젝트 목록으로 */
  document.getElementById('lcBack')?.addEventListener('click', () => {
    if (curGroup) { curGroup = null; renderProjects(); }
  });
  document.querySelector('.lc-nav')?.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-navi');
    if (!b || !b.dataset.view) return;
    setView(b.dataset.view);
    if (window.__navOnNavigate) window.__navOnNavigate({ t: 'launcher', v: b.dataset.view });
  });
  /* 빈 상태 안의 '만들어 둔 시안 먼저 둘러보기' — 왼쪽 메뉴를 거치지 않는 두 번째 진입로.
     빈 상태는 매 렌더마다 다시 만들어지므로 그리드에 위임해 붙인다. */
  document.querySelector('.lc-grid')?.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-tplbadge');
    if (!b || !b.dataset.view) return;
    setView(b.dataset.view);
    if (window.__navOnNavigate) window.__navOnNavigate({ t: 'launcher', v: b.dataset.view });
  });
  document.getElementById('lcSearch')?.addEventListener('input', renderProjects);
  /* 휴지통 전체삭제 — 휴지통의 모든 프로젝트를 영구 삭제 */
  document.getElementById('lcEmptyTrash')?.addEventListener('click', async () => {
    const trashed = loadGroups().filter((g) => g.deleted);
    if (!trashed.length) return;
    if (!(await askConfirm({
      title: '휴지통을 비울까요?',
      body: '프로젝트 <b>' + trashed.length + '개</b>와 그 안의 화면이 모두 지워져요.',
      confirmLabel: '전체 삭제',
      irreversible: true,
    }))) return;
    trashSel.clear();
    const ids = new Set(trashed.map((g) => g.id));
    saveGroups(loadGroups().filter((g) => !g.deleted));
    saveProjects(loadProjects().filter((s) => !ids.has(s.projectId)));
    renderProjects();
    if (typeof toast === 'function') toast('휴지통을 비웠어요.', { type: 'ok' });
  });
  /* 휴지통 선택삭제 — 선택한 프로젝트만 영구 삭제 */
  document.getElementById('lcSelDel')?.addEventListener('click', async () => {
    if (!trashSel.size) return;
    const n = trashSel.size;
    if (!(await askConfirm({
      title: '선택한 프로젝트를 영구 삭제할까요?',
      body: '프로젝트 <b>' + n + '개</b>와 그 안의 화면이 모두 지워져요.',
      confirmLabel: '영구 삭제',
      irreversible: true,
    }))) return;
    const ids = new Set(trashSel);
    saveGroups(loadGroups().filter((g) => !ids.has(g.id)));
    saveProjects(loadProjects().filter((s) => !ids.has(s.projectId)));
    trashSel.clear();
    renderProjects();
    if (typeof toast === 'function') toast(n + '개 프로젝트를 영구 삭제했어요.', { type: 'ok' });
  });

  /* ── 새 프로젝트 모달 ── */
  function openModal() {
    pending = { name: '새 프로젝트', screen: 'dash', layout: null };
    const nm = document.getElementById('npName');
    if (nm) nm.value = '새 프로젝트';
    document.querySelectorAll('#npOpts .np-opt').forEach((b) => b.classList.toggle('on', b.dataset.s === 'dash'));
    modal.classList.add('show');
    setTimeout(() => nm && nm.select(), 30);
  }
  const closeModal = () => modal.classList.remove('show');
  /* index2 — 새 프로젝트 진입점: 팝업 대신 PRD 화면으로.
     런처(.flow)는 z-index가 PRD 페이지(.page)보다 높으므로 반드시 닫아야 PRD가 보인다. */
  /* 새 프로젝트 = 지금 프로젝트를 저장한 뒤, 상태를 깨끗이 비우고 PRD 위저드로 새로 시작(새로고침) */
  /* 새 화면 만들기 — gid 폴더에 넣을 예약(gid=null이면 새 프로젝트=새 폴더). PRD 위저드로 새로 시작. */
  function beginNewScreen(gid) {
    persistCurrentProjectData();
    clearProjectState();
    try {
      if (gid) localStorage.setItem(PENDING_GROUP, gid); else localStorage.removeItem(PENDING_GROUP);
      localStorage.removeItem(CUR_PROJ);
      localStorage.setItem('wemb-view', 'prd');
    } catch (e) {}
    location.reload();
  }
  const startNewProject = () => beginNewScreen(null);
  function startNewScreen(gid) { beginNewScreen(gid || null); }
  document.getElementById('lcNew').onclick = startNewProject;
  document.getElementById('npX').onclick = closeModal;
  document.getElementById('npCancel').onclick = closeModal;
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.getElementById('npOpts').addEventListener('click', (e) => {
    const b = e.target.closest('.np-opt');
    if (!b || b.disabled) return;
    document.querySelectorAll('#npOpts .np-opt').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
  });
  document.getElementById('npOk').onclick = () => {
    const sel = document.querySelector('#npOpts .np-opt.on');
    pending.screen = sel ? sel.dataset.s : 'dash';
    const nm = document.getElementById('npName');
    pending.name = ((nm && nm.value) || '새 프로젝트').trim().slice(0, 40) || '새 프로젝트';
    closeModal();
    /* 대시보드·디지털 트윈 모두 레이아웃 선택 단계를 거친다(포탈은 비활성) */
    openLayout();
  };

  /* ── 레이아웃 선택 ── */
  function openLayout() {
    document.getElementById('lpProjName').textContent = pending.name + ' · ' + (SCREEN_LABEL[pending.screen] || '대시보드');
    const body = document.getElementById('lpBody');
    body.innerHTML = '';
    const groups = groupsFor(pending.screen);
    const sets = layoutsFor(pending.screen);
    groups.forEach((grp) => {
      const sec = document.createElement('div');
      sec.className = 'lp-group';
      const gh = document.createElement('div');
      gh.className = 'lp-gh';
      gh.innerHTML = '<b></b><span></span>';
      gh.querySelector('b').textContent = grp.label;
      gh.querySelector('span').textContent = grp.hint;
      sec.appendChild(gh);
      const cards = document.createElement('div');
      cards.className = 'lp-cards';
      sets[grp.key].forEach((lay) => {
        const c = document.createElement('button');
        c.className = 'lp-card';
        c.dataset.lid = lay.id;
        c.appendChild(wfEl(lay));
        const nm = document.createElement('div');
        nm.className = 'lp-name';
        nm.textContent = lay.name;
        const ds = document.createElement('div');
        ds.className = 'lp-desc';
        ds.textContent = lay.desc;
        c.appendChild(nm);
        c.appendChild(ds);
        c.onclick = () => {
          body.querySelectorAll('.lp-card').forEach((x) => x.classList.remove('on'));
          c.classList.add('on');
          pending.layout = lay.id;
          document.getElementById('lpStart').disabled = false;
        };
        cards.appendChild(c);
      });
      sec.appendChild(cards);
      body.appendChild(sec);
    });
    document.getElementById('lpStart').disabled = true;
    pending.layout = null;
    /* 팝업(모달)이므로 런처를 뒤에 그대로 두고 위에 띄운다 */
    layout.classList.add('show');
  }
  document.getElementById('lpBack').onclick = () => {
    layout.classList.remove('show');
    home.classList.add('show');
    try { localStorage.setItem('wemb-view', 'home'); } catch (e) {}
    openModal();
  };
  /* 바깥(백드롭) 클릭 시 이전 단계로 — npModal과 동일한 모달 동작 */
  layout.addEventListener('click', (e) => {
    if (e.target === layout) document.getElementById('lpBack').click();
  });
  document.getElementById('lpStart').onclick = startStudio;

  /* ── 스튜디오 진입 ── */
  function enterStudio(screen, layoutId) {
    try {
      if (typeof state !== 'undefined' && (screen === 'dash' || screen === 'dt')) state.screen = screen;
    } catch (e) {}
    if (typeof applyScreen === 'function') applyScreen();
    try {
      localStorage.setItem('wemb-layout', layoutId || '');
    } catch (e) {}
    /* 대시보드는 선택 레이아웃대로 패널 재배치, 디지털 트윈은 씬 위 유리 패널로 재현 */
    if (screen === 'dash') applyDashLayout(layoutId);
    if (typeof syncSideLayout === 'function') syncSideLayout();
    home.classList.remove('show');
    layout.classList.remove('show');
    modal.classList.remove('show');
    /* 오버레이를 걷어 스튜디오가 실제 크기를 갖게 된 뒤 DT 레이아웃을 반영해야
       유리 패널 보드가 화면 크기에 맞게 축소된다(캔버스 0 크기면 fitBoard가 대기). */
    if (typeof window.__applyDtLayout === 'function') window.__applyDtLayout(screen === 'dt' ? findLayout(layoutId) : null);
    if (screen === 'dt' && layoutId && typeof toast === 'function')
      toast('선택한 레이아웃을 디지털 트윈 화면에 반영했어요.', { type: 'info' });
    /* 스튜디오에 들어왔으면 모든 단계 잠금 해제 + 유저플로우 메뉴를 상단 내비에 반영 */
    try { if (window.__wembStep) window.__wembStep.advance(4); } catch (e) {}
    try { if (window.__setStudioNav && typeof window.__WEMBFlowMenu === 'function') window.__setStudioNav(window.__WEMBFlowMenu()); } catch (e) {}
    /* 썸네일이 없는 화면이면 '손을 뗀 뒤'에 조용히 한 번 찍어 둔다.
       예전엔 홈으로 나갈 때(goHome)만 찍었는데, 그 버튼을 거치지 않고 런처에 도착하는 길이 많다
       — 새로고침, 와이어프레임 단계에서 바로 홈, 브라우저 뒤로가기. 그 화면들은 런처에서
       영영 와이어프레임으로 남았다(사용자 신고: "새 프로젝트로 만든 화면만 레이아웃으로 보인다").
       유휴 감지(포인터·키·스크롤이 멈춘 뒤)라 조작 중에는 돌지 않고, 썸네일이 이미 있으면 건너뛴다. */
    try { if (window.__wembScheduleThumb) window.__wembScheduleThumb(1800); } catch (e) {}
    /* 새로 만든 화면으로 들어오면 옵션창을 '대시보드 편집 → 콘텐츠 추가'로 열어 둔다 —
       여기에 '패널편집' 버튼이 있어 카드(위젯)를 바로 끌어 옮길 수 있다.
       예전엔 '화면 정하기' 섹션에 머물러 패널편집 버튼이 숨겨진 채라 이동을 시작할 방법이 없었다. */
    try { if (window.__showSection) window.__showSection('dash-panels'); } catch (e) {}
  }
  /* PRD→명세서→플로우→와이어프레임 가이드(initGuide)가 레이아웃 정의와 스튜디오 진입을
     재사용할 수 있도록 노출한다. */
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
  window.__WEMBLayouts = { LAYOUTS, DT_LAYOUTS, GROUPS, DT_GROUPS, findLayout, wfEl, enterStudio, saveGuideProject, setProjectName: (n) => { pending.name = n || pending.name; } };
  function startStudio() {
    persistCurrentProjectData(); /* 이전 프로젝트 상태 저장 후 새로 시작 */
    const projs = loadProjects();
    const tplThumb = pending.tpl === 'image' ? (pending.img || null)
      : pending.tpl === 'skhynix' ? 'src/templates/skhynix-1.jpg'
      : pending.tpl === 'skhynix-hub' ? 'src/templates/icheon-hub.jpg'
      : pending.tpl === 'hanjin' ? 'src/templates/hanjin-studio.jpg'
      : pending.tpl === 'hana' ? 'src/templates/hana-overview-02.jpg' : null;
    const proj = { id: newId(), name: pending.name, screen: pending.screen, layout: pending.layout, tpl: pending.tpl || null, img: pending.img || null, thumb: tplThumb, ts: Date.now(), fav: false, projectId: resolvePendingGroup(pending.name) };
    projs.unshift(proj);
    /* 템플릿 미리보기가 여러 장이면, 2번째 장부터 같은 프로젝트(폴더)의 화면으로 함께 만든다.
       예) SK하이닉스: [메인, UPS 전력 상세] → 화면 2개. 목록에서 모든 화면을 바로 볼 수 있다. */
    const extra = (pending.slides || []).slice(1);
    /* 이 템플릿으로 만든 화면들 — [0]=메인, 그다음부터 슬라이드 순서대로 */
    const screens = [proj];
    extra.forEach((sl, i) => {
      /* 이 장면이 '그림 한 장'인지 — 미연결 템플릿 전체(tpl='image')이거나,
         실제 화면이 붙은 템플릿에 카탈로그 그림만 있는 장면(imageOnly)이 섞인 경우다.
         그럴 땐 화면마다 자기 그림을 들고 있어야 한다(안 그러면 전부 첫 장만 보인다). */
      const asImage = proj.tpl === 'image' || !!(sl && sl.imageOnly);
      const sp = {
        id: newId(),
        name: (sl && sl.label) || ('화면 ' + (i + 2)),
        screen: proj.screen,
        layout: proj.layout,
        tpl: asImage ? 'image' : proj.tpl,
        img: asImage ? ((sl && sl.img) || proj.img) : proj.img,
        thumb: (sl && sl.img) || null,
        /* 이 화면이 템플릿의 몇 번째 장면인지 — 열 때 해당 시안을 그린다 */
        /* 한진은 세 장(메인 · 입/출문현황 · 하차현황)이라 슬라이드 순서를 화면 이름에 맞춘다 */
        /* 그림 한 장짜리 장면은 그릴 시안이 없으니 장면 이름을 붙이지 않는다 */
        tplScene: asImage ? ('scene' + (i + 2))
          : proj.tpl === 'skhynix' && i === 0 ? 'popup'
            : proj.tpl === 'skhynix-hub' && i === 0 ? 'hvac'
              : proj.tpl === 'hanjin' ? (i === 0 ? 'gate' : 'unload')
                : proj.tpl === 'hana' ? ['cloud-01', 'cloud-02', 'middleware', 'infra-main', 'infra-detail', 'event', 'network-01', 'network-02', 'network-03', 'facility', 'security-01', 'security-02', 'login'][i]
                  : ('scene' + (i + 2)),
        ts: Date.now() - (i + 1),
        fav: false,
        projectId: proj.projectId,
      };
      projs.push(sp);
      screens.push(sp);
    });
    if (projs.length > 48) projs.length = 48;
    saveProjects(projs);
    /* 상세에서 보고 있던 장면을 그대로 연다 — 메인이면 [0], 팝업 슬라이드였으면 그 화면 */
    const openProj = screens[Math.min(pending.slideIndex || 0, screens.length - 1)] || proj;
    /* 열 장면 — skhynix 는 'popup', Icheon main 은 'hvac'(항온항습기 상세), 그 외는 메인 */
    const openScene = openProj.tpl === 'hana' ? (openProj.tplScene || 'overview-02')
      : openProj.tplScene === 'popup' ? 'popup' : openProj.tplScene === 'hvac' ? 'hvac' : 'main';
    try { localStorage.setItem(CUR_PROJ, openProj.id); } catch (e) {}
    /* 새 프로젝트는 '처음 상태'에서 시작해야 한다(이전 프로젝트의 색·대시보드 편집이 남지 않게).
       색/대시보드 설정은 프로젝트별 저장이 아니라 하나의 전역 상태를 공유하므로,
       디자인 관련 wemb-* 키를 비우고 새로고침한 뒤 이 프로젝트로 바로 진입한다.
       (프로젝트 목록·저장 스냅샷·둘러보기 여부는 유지) */
    try {
      sessionStorage.setItem('wemb-fresh-open', JSON.stringify({ screen: openProj.screen, layout: openProj.layout, name: proj.name, tpl: openProj.tpl, img: openProj.img, scene: openScene }));
      const KEEP = new Set([LS_PROJ, LS_GROUP, CUR_PROJ, 'wemb-theme-snapshots', 'wemb-onboarded', 'wemb-previewhint', 'wemb-skx-hinted']);
      Object.keys(localStorage)
        .filter((k) => k.startsWith('wemb-') && !KEEP.has(k))
        .forEach((k) => localStorage.removeItem(k));
      /* 열 장면(메인/팝업) 표시 — 위 정리에서 지워지므로 정리가 끝난 뒤에 쓴다 */
      if (openProj.tpl === 'skhynix') localStorage.setItem('wemb-skx-screen', openScene);
      if (openProj.tpl === 'skhynix-hub') localStorage.setItem('wemb-hub-screen', openScene === 'hvac' ? 'hvac' : 'main');
      if (openProj.tpl === 'hana') localStorage.setItem('wemb-hana-screen', openScene);
      history.replaceState(null, '', location.pathname + location.search); /* 공유 해시 제거 */
    } catch (e) {}
    location.reload();
  }
  function openProject(p) {
    /* (1) 지금 보고 있던 프로젝트의 상태를 먼저 저장 */
    persistCurrentProjectData();
    const arr = loadProjects();
    const t = arr.find((x) => x.id === p.id) || p;
    t.ts = Date.now();
    if (t.deleted) { delete t.deleted; delete t.deletedTs; }
    saveProjects(arr);
    /* (2) 이 프로젝트를 '현재 프로젝트'로 지정하고 저장된 상태 묶음을 전역 키에 복원 */
    try { localStorage.setItem(CUR_PROJ, p.id); } catch (e) {}
    applyProjectData(t);
    /* 템플릿 장면(메인/팝업) 지정 — 새로고침 후 그 장면으로 그린다 */
    try { localStorage.setItem('wemb-skx-screen', t.tplScene === 'popup' ? 'popup' : 'main'); } catch (e) {}
    try { localStorage.setItem('wemb-hub-screen', t.tplScene === 'hvac' ? 'hvac' : 'main'); } catch (e) {}
    try { localStorage.setItem('wemb-hanjin-screen', (t.tplScene === 'gate' || t.tplScene === 'unload') ? t.tplScene : 'main'); } catch (e) {}
    try { if (t.tpl === 'hana') localStorage.setItem('wemb-hana-screen', t.tplScene || 'overview-02'); } catch (e) {}
    /* (3) 새로고침 시 런처가 아니라 이 프로젝트 스튜디오로 바로 열리도록 */
    try { localStorage.setItem('wemb-view', 'wire'); } catch (e) {}
    /* 저장된 상태가 없던(구버전) 프로젝트는 화면 종류·레이아웃만이라도 반영 */
    if (!t.data) {
      try { localStorage.setItem('wemb-layout', t.layout || ''); } catch (e) {}
      try { if (t.screen === 'dash' || t.screen === 'dt') localStorage.setItem('wemb-screen', t.screen); } catch (e) {}
      try {
        if (t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') localStorage.setItem('wemb-tpl-dt', t.tpl);
        else localStorage.removeItem('wemb-tpl-dt');
      } catch (e) {}
    }
    /* 템플릿 마커 동기화 — 이 프로젝트가 미연결 이미지 템플릿이면 이미지 오버레이가, 아니면
       이전 프로젝트에서 남은 오버레이가 제거되도록 새로고침 전에 플래그를 맞춘다. */
    try {
      if (t.tpl === 'image' && t.img) { localStorage.setItem('wemb-tpl-img', t.img); localStorage.removeItem('wemb-tpl-dt'); }
      else if (t.tpl === 'hanjin' || t.tpl === 'hana' || t.tpl === 'skhynix' || t.tpl === 'skhynix-hub') { localStorage.setItem('wemb-tpl-dt', t.tpl); localStorage.removeItem('wemb-tpl-img'); }
      else { localStorage.removeItem('wemb-tpl-img'); localStorage.removeItem('wemb-tpl-dt'); }
    } catch (e) {}
    location.reload();
  }

  /* 사이드바 '새 프로젝트' → 완전히 새 프로젝트로 시작(현재 프로젝트는 저장) */
  const sideNew = document.getElementById('newProject');
  if (sideNew)
    sideNew.onclick = startNewProject;

  /* 사이드바 홈 버튼 · 브랜드 로고 → 프로젝트 목록(런처) 다시 열기(현재 프로젝트 저장) */
  const goHome = () => {
    const wasInStudio = !home.classList.contains('show');
    persistCurrentProjectData();
    /* 홈으로 '즉시' 전환 — 로고 클릭이 곧바로 반응하게(예전엔 썸네일 캡처를 최대 1.5초 기다렸음). */
    setView('all');
    renderProjects();
    home.classList.add('show');
    try { localStorage.setItem('wemb-view', 'home'); } catch (e) {}
    if (window.__navOnNavigate) window.__navOnNavigate({ t: 'launcher', v: 'all' });
    /* 썸네일 캡처는 '홈 화면이 실제로 그려진 뒤'에 시작한다.
       캡처는 메인 스레드를 수 초 잡아먹는데, 예전엔 페인트 전에 시작해 홈 전환이 3초 넘게 걸려 보였다.
       두 번의 rAF(=페인트 완료 보장) + 약간의 여유 뒤에 돌린다. */
    if (wasInStudio) {
      /* 탭이 백그라운드로 가 있으면 requestAnimationFrame 은 아예 실행되지 않는다.
         그러면 썸네일이 영영 안 만들어지므로(홈으로 나가자마자 창을 옮기면 그렇게 된다)
         타이머로도 한 번 더 걸어 둔다. 먼저 오는 쪽이 실행하고, 중복은 __capturing 가드가 막는다. */
      let fired = false;
      const go = () => { if (fired) return; fired = true; try { captureScreenThumb(); } catch (e) {} };
      requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(go, 250)));
      setTimeout(go, 600);
    }
  };
  const quickHome = document.getElementById('quickHome');
  if (quickHome) quickHome.onclick = goHome;
  const brandHome = document.getElementById('brandHome');
  if (brandHome) brandHome.onclick = goHome;
  /* 탭을 닫거나 새로고침해도 현재 프로젝트 상태가 남도록 마지막에 한 번 저장 */
  window.addEventListener('beforeunload', () => { try { persistCurrentProjectData(); } catch (e) {} });

  /* Esc — 모달만 닫는다(런처/레이아웃은 진입 화면이라 유지) */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });

  /* ── 사이드바 레이아웃 메뉴 — 이전 '구성 화면'처럼 인라인 행 목록(.fignav-row).
     화면 종류는 새 프로젝트에서 정하므로 스튜디오에선 레이아웃만 바꾼다. ── */
  const NS = 'http://www.w3.org/2000/svg';
  function layGlyph(lay) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', 'laygl');
    const pad = 3,
      area = 18,
      gap = 1.4;
    lay.cells.forEach(([x, y, w, h]) => {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('x', (pad + ((x - 1) / lay.cols) * area + gap / 2).toFixed(2));
      r.setAttribute('y', (pad + ((y - 1) / lay.rows) * area + gap / 2).toFixed(2));
      r.setAttribute('width', ((w / lay.cols) * area - gap).toFixed(2));
      r.setAttribute('height', ((h / lay.rows) * area - gap).toFixed(2));
      r.setAttribute('rx', '1');
      svg.appendChild(r);
    });
    return svg;
  }
  function buildSideLayouts(screen) {
    const list = document.getElementById('layList');
    if (!list) return;
    const scr = screen || (typeof state !== 'undefined' && state.screen ? state.screen : 'dash');
    const isDt = scr === 'dt';
    const groups = groupsFor(scr);
    const sets = layoutsFor(scr);
    list.innerHTML = '';
    groups.forEach((grp) => {
      const sec = document.createElement('div');
      sec.className = 'laygrp-sec';
      /* 카테고리 헤더 — 접기/펴기 + 유일한 화살표 */
      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'laygrp';
      header.setAttribute('aria-expanded', 'false');
      const chev = document.createElement('span');
      chev.className = 'laygrp-chev';
      chev.textContent = '›';
      const lbl = document.createElement('span');
      lbl.className = 'laygrp-lbl';
      lbl.textContent = grp.label;
      const cnt = document.createElement('span');
      cnt.className = 'laygrp-count';
      cnt.textContent = sets[grp.key].length + '종';
      header.appendChild(chev);
      header.appendChild(lbl);
      header.appendChild(cnt);
      /* 하위 레이아웃 행 묶음 — 처음엔 접힘 */
      const rows = document.createElement('div');
      rows.className = 'laygrp-rows';
      rows.hidden = true;
      sets[grp.key].forEach((lay) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'fignav-row';
        row.dataset.lid = lay.id;
        row.setAttribute('role', 'option');
        const ic = document.createElement('span');
        ic.className = 'ficon';
        ic.appendChild(layGlyph(lay));
        const txt = document.createElement('span');
        txt.className = 'txt';
        const b = document.createElement('b');
        b.textContent = lay.name;
        const sub = document.createElement('span');
        sub.className = 'sub';
        sub.textContent = lay.desc;
        txt.appendChild(b);
        txt.appendChild(sub);
        row.appendChild(ic); /* 화살표 없음 — 아이콘 + 제목·설명만 */
        row.appendChild(txt);
        row.onclick = () => {
          /* 디지털 트윈이면 3D 씬 위 유리 패널 배치로, 대시보드면 패널 그리드로 반영 */
          if (isDt) { if (window.__applyDtLayout) window.__applyDtLayout(findLayout(lay.id)); }
          else applyDashLayout(lay.id);
          try {
            localStorage.setItem('wemb-layout', lay.id);
          } catch (e) {}
          markSideLayout();
        };
        rows.appendChild(row);
      });
      header.onclick = () => {
        const open = !sec.classList.contains('open');
        sec.classList.toggle('open', open);
        rows.hidden = !open;
        header.setAttribute('aria-expanded', open ? 'true' : 'false');
      };
      sec.appendChild(header);
      sec.appendChild(rows);
      list.appendChild(sec);
    });
    markSideLayout();
  }
  function markSideLayout() {
    let cur = '';
    try {
      cur = localStorage.getItem('wemb-layout') || '';
    } catch (e) {}
    document.querySelectorAll('#layList .fignav-row').forEach((x) => {
      const on = x.dataset.lid === cur;
      x.classList.toggle('on', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  function syncSideLayout() {
    const sec = document.getElementById('sideLayoutSec');
    if (!sec) return;
    sec.hidden = false; /* 대시보드·디지털 트윈 모두 레이아웃 사용 */
    const scr = (typeof state !== 'undefined' && state.screen) ? state.screen : 'dash';
    buildSideLayouts(scr); /* 화면 종류에 맞는 레이아웃 목록으로 다시 구성 */
  }
  buildSideLayouts();
  window.__syncSideLayout = syncSideLayout;

  setView('all');
  home.classList.add('show');
  /* 마지막 선택 레이아웃을 대시보드 미리보기에 복원(런처 뒤에서 준비) */
  try {
    const sv = localStorage.getItem('wemb-layout');
    if (sv) applyDashLayout(sv);
  } catch (e) {}
  syncSideLayout();
  window.__openLauncher = () => {
    setView('all');
    home.classList.add('show');
    try { localStorage.setItem('wemb-view', 'home'); } catch (e) {}
    if (window.__navOnNavigate) window.__navOnNavigate({ t: 'launcher', v: 'all' });
  };

  /* 새 프로젝트로 새로고침해 진입한 경우 — 깨끗한 기본 상태에서 이 프로젝트로 바로 들어간다 */
  try {
    const fresh = sessionStorage.getItem('wemb-fresh-open');
    if (fresh) {
      sessionStorage.removeItem('wemb-fresh-open');
      const f = JSON.parse(fresh);
      const bn = document.getElementById('brandName');
      if (bn && f.name) {
        bn.value = f.name;
        bn.dispatchEvent(new Event('input', { bubbles: true }));
      }
      enterStudio(f.screen || 'dash', f.layout);
      /* 템플릿 재현 — 한진/SK하이닉스는 실제 화면, 미연결 템플릿은 임시 이미지.
         (새로고침 후에도 유지되게 플래그를 localStorage에 저장) */
      try {
        if (f.tpl === 'hana') {
          localStorage.setItem('wemb-tpl-dt', 'hana'); localStorage.removeItem('wemb-tpl-img');
          /* 템플릿 상세에서 고른 장면(화면 15장 중 하나)을 그대로 연다 */
          const wantHn = (typeof HN_SCREENS !== 'undefined' && HN_SCREENS[f.scene]) ? f.scene
            : (localStorage.getItem('wemb-hana-screen') || 'overview-02');
          try { localStorage.setItem('wemb-hana-screen', wantHn); } catch (e3) {}
          if (typeof applyHanaDT === 'function') applyHanaDT(wantHn);
        }
        else if (f.tpl === 'hanjin') {
          localStorage.setItem('wemb-tpl-dt', 'hanjin'); localStorage.removeItem('wemb-tpl-img');
          /* 템플릿 상세에서 고른 장면(메인 · 입/출문현황 · 하차현황)을 그대로 연다 */
          const wantHj = (f.scene === 'gate' || f.scene === 'unload') ? f.scene
            : (localStorage.getItem('wemb-hanjin-screen') || 'main');
          try { localStorage.setItem('wemb-hanjin-screen', wantHj); } catch (e3) {}
          if (typeof applyHanjinDT === 'function') applyHanjinDT(wantHj);
        }
        else if (f.tpl === 'skhynix') { localStorage.setItem('wemb-tpl-dt', 'skhynix'); localStorage.removeItem('wemb-tpl-img'); if (typeof applySkhynixDT === 'function') applySkhynixDT();
          /* 템플릿 상세에서 팝업(UPS 전력 상세) 장면을 보고 들어왔으면 그 시안을 그린다 */
          try { const wantPopup = f.scene === 'popup' || localStorage.getItem('wemb-skx-screen') === 'popup';
                localStorage.setItem('wemb-skx-screen', wantPopup ? 'popup' : 'main');
                if (wantPopup) setTimeout(() => { try { window.__openSkxScreen && window.__openSkxScreen('popup'); } catch (e3) {} }, 300); } catch (e2) {} }
        else if (f.tpl === 'skhynix-hub') {
          localStorage.setItem('wemb-tpl-dt', 'skhynix-hub'); localStorage.removeItem('wemb-tpl-img');
          /* 템플릿 상세에서 '항온항습기 상세' 장면을 보고 들어왔으면 그 시안을 그린다 */
          const wantHvac = f.scene === 'hvac' || localStorage.getItem('wemb-hub-screen') === 'hvac';
          try { localStorage.setItem('wemb-hub-screen', wantHvac ? 'hvac' : 'main'); } catch (e3) {}
          if (wantHvac) { if (typeof applySkhynixHvac === 'function') applySkhynixHvac(); }
          else if (typeof applySkhynixHub === 'function') applySkhynixHub();
        }
        else if (f.tpl === 'image' && f.img) { localStorage.setItem('wemb-tpl-img', f.img); localStorage.removeItem('wemb-tpl-dt'); if (typeof applyImageTemplate === 'function') applyImageTemplate(f.img, f.screen); }
        /* 시안 없는 프로젝트 — 1920x1080 고정 캔버스를 풀어 준다.
           (하이닉스·한진 시안을 보다가 이 프로젝트로 넘어오면 고정 캔버스가 그대로 남아
            작업 영역을 다 못 쓰고 축소된 채로 열렸다) */
        else { localStorage.removeItem('wemb-tpl-dt'); localStorage.removeItem('wemb-tpl-img'); try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e3) {} try { syncSkxControls(); } catch (e3) {} }
      } catch (e2) {}
    }
  } catch (e) {}
}
