/* ── 홈 — 프로젝트 · 폴더 · 휴지통 · 템플릿 화면과 주소 ── */

(function () {
  const { CUR_PROJ, LS_GROUP, LS_PROJ, groupById, loadGroups, loadProjects, newGid, newId, persistCurrentProjectData, resolvePendingGroup, saveGroups, saveProjects, screensOfGroup, touchGroup } = WEMB.projects;
  const { TEMPLATES, TPL_AREAS, TPL_SCREENS, tplDate, tplIsLive } = WEMB.templates;
  const { LAYOUTS, findLayout, wfEl } = WEMB.layouts;

  const home = document.getElementById('flowHome');
  const SCREEN_LABEL = { dash: '대시보드', dt: '디지털 트윈', portal: '포탈' };

  let pending = { name: '새 프로젝트', screen: 'dash', layout: null };
  const timeago = (ts) => {
    const s = (Date.now() - ts) / 1000;
    if (s < 60) return '방금 전';
    if (s < 3600) return Math.floor(s / 60) + '분 전';
    if (s < 86400) return Math.floor(s / 3600) + '시간 전';
    return Math.floor(s / 86400) + '일 전';
  };
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
  let tplScreen = 'all'; /* 화면 유형 필터(all | 2D 대시보드 | 3D 디지털트윈) */
  let tplArea = 'all';   /* 업무 영역 필터(화면 유형 종속) */
  let tplYear = 'all';   /* 등록 연도 필터 — 화면 유형·업무 영역과 나란한 별개 축이다 */
  let tplQuery = ''; /* 템플릿 갤러리 검색어(제목·배지 대상) */
  let tplSelected = null; /* 상세 페이지로 열어 둔 템플릿(null이면 갤러리) */
  /* ── 주소 ↔ 런처 화면 ──
     좌측 메뉴: /projects · /recent · /favorites · /trash · /templates
     프로젝트(폴더) 안: /projects/:gid   템플릿 상세: /templates/:slug
     화면을 바꾸는 코드는 주소만 바꾸고(router.navigate), 실제로 그리는 건 아래 라우트다. */
  const router = WEMB.router;
  const VIEW_PATH = { all: '/projects', recent: '/recent', fav: '/favorites', trash: '/trash', tpl: '/templates' };
  const goView = (v) => router.navigate(VIEW_PATH[v] || VIEW_PATH.all);
  /* 작업공간(studio.html)으로 — 무엇을 열지는 쿼리(?screen · ?new · ?group), 어느 단계인지는 해시가 말한다 */
  const studioURL = (params, hashPath) => {
    const qs = new URLSearchParams();
    Object.keys(params || {}).forEach((k) => { if (params[k] != null && params[k] !== '') qs.set(k, params[k]); });
    return 'studio.html' + (qs.toString() ? '?' + qs.toString() : '') + router.href(hashPath);
  };
  const markNav = () => document.querySelectorAll('.lc-navi').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
  function showLauncher() {
    home.classList.add('show');
  }
  Object.keys(VIEW_PATH).forEach((v) => {
    router.add('launcher:' + v, VIEW_PATH[v], (params, query, prev) => {
      tplSelected = null;
      setView(v);
      showLauncher(prev);
    });
  });
  router.add('launcher:folder', '/projects/:gid', (params, query, prev) => {
    const grp = groupById(params.gid);
    if (!grp || grp.deleted) return VIEW_PATH.all; /* 없어졌거나 휴지통으로 간 프로젝트 */
    tplSelected = null;
    if (view === 'trash' || view === 'tpl') view = 'all'; /* 폴더는 살아 있는 프로젝트 뷰에서만 연다 */
    curGroup = grp.id;
    trashSel.clear();
    markNav();
    renderProjects();
    showLauncher(prev);
  });
  router.add('launcher:template', '/templates/:slug', (params, query, prev) => {
    const t = TEMPLATES.find((x) => x.slug === params.slug);
    if (!t) return VIEW_PATH.tpl;
    view = 'tpl';
    curGroup = null;
    trashSel.clear();
    tplSelected = t;
    markNav();
    renderProjects();
    showLauncher(prev);
  });
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
        card.onclick = () => router.navigate('/templates/' + t.slug);
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
    det.querySelector('.tpld-back').onclick = () => router.navigate(VIEW_PATH.tpl);
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
      const open = () => router.navigate('/projects/' + encodeURIComponent(grp.id));
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
    if (curGroup) goView(view);
  });
  /* 뒤로가기 — 폴더 내부(화면 목록)에서 프로젝트 목록으로. 목록에서 들어왔으면 브라우저 뒤로가기와 같고,
     폴더 주소로 바로 들어왔으면 목록 주소로 대체 이동한다. */
  document.getElementById('lcBack')?.addEventListener('click', () => {
    if (curGroup) router.back(VIEW_PATH[view] || VIEW_PATH.all);
  });
  document.querySelector('.lc-nav')?.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-navi');
    if (!b || !b.dataset.view) return;
    goView(b.dataset.view);
  });
  /* 빈 상태 안의 '만들어 둔 시안 먼저 둘러보기' — 왼쪽 메뉴를 거치지 않는 두 번째 진입로.
     빈 상태는 매 렌더마다 다시 만들어지므로 그리드에 위임해 붙인다. */
  document.querySelector('.lc-grid')?.addEventListener('click', (e) => {
    const b = e.target.closest('.lc-tplbadge');
    if (!b || !b.dataset.view) return;
    goView(b.dataset.view);
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
  /* 새 화면 만들기 — gid 폴더에 넣을 예약(gid 가 없으면 새 프로젝트 = 새 폴더).
     지금 화면 저장 · 상태 비우기는 작업공간이 열리면서 한다(js/app/session.js) — 주소로 바로 열어도 같은 결과. */
  function beginNewScreen(gid) {
    location.href = studioURL({ new: 1, group: gid }, '/prd');
  }
  const startNewProject = () => beginNewScreen(null);
  function startNewScreen(gid) { beginNewScreen(gid || null); }
  document.getElementById('lcNew').onclick = startNewProject;
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
    } catch (e) {}
    location.href = studioURL({ screen: openProj.id }, '/studio');
  }
  /* 저장된 화면 열기 — 작업공간 주소로 간다. 상태 교체는 작업공간이 부팅하며 한다(js/app/session.js). */
  function openProject(p) {
    location.href = studioURL({ screen: p.id }, '/studio');
  }

  setView('all');
  home.classList.add('show');

  /* ── 주소 시작 ──
     작업공간 쪽 주소(#/prd … #/studio)나 예전 공유 링크(#t=…)로 홈에 오면 작업공간 문서로 넘긴다.
     그 밖에 모르는 주소는 프로젝트 목록. 예전 새로고침 복원 기록(wemb-view)은 이제 쓰지 않으니 지운다. */
  ['/prd', '/spec', '/flow', '/wireframe', '/studio'].forEach((p) => {
    router.add('studio' + p.replace('/', ':'), p, () => { location.replace('studio.html' + location.hash); });
  });
  router.setFallback((hash) => {
    try { localStorage.removeItem('wemb-view'); } catch (e) {}
    if (/^#(?:.*&)?t=/.test(hash || '')) location.replace('studio.html' + hash);
    return VIEW_PATH.all;
  });
  router.start();
})();
