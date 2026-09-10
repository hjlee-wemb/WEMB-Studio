/* ── 상단 바 · 레일 · 페이지 전환 · 뒤로가기 ── */

/* ============================================================
 *  index5 — 왼쪽 아이콘 레일 · 상단 바 배선
 *  실제 컨트롤은 그대로 두고, 레일/상단 바는 기존 요소를 프록시로 호출한다.
 * ============================================================ */
(function initChrome() {
  const app = document.getElementById('app');
  const sbtab = (tab) => document.querySelector('.sbtabs .sbtab[data-tab="' + tab + '"]');
  const scrollTo = (el) => {
    if (!el) return;
    try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
  };
  function syncTabUI(tab) {
    /* 상단 탭은 이제 '페이지'라 여기서 건드리지 않는다. 레일의 테마/대시보드 표시만 동기화 */
    document
      .querySelectorAll('.siderail .railbtn[data-rail="theme"], .siderail .railbtn[data-rail="dash"]')
      .forEach((r) => r.classList.toggle('on', r.dataset.rail === tab));
  }
  function activateTab(tab) {
    const b = sbtab(tab);
    if (b) b.click();
    syncTabUI(tab);
  }
  /* ── 작업 페이지 — PRD · 기능명세서 · 유저플로우 · 와이어프레임 · 스튜디오 ──
     페이지 전환은 곧 주소 이동이다: setPage('spec') → #/spec → 아래 라우트가 showPage 로 그린다.
     'wire' 는 스튜디오(.app), 나머지는 스튜디오 위를 덮는 오버레이 페이지. */
  const PAGE_ORDER = ['prd', 'spec', 'flow', 'wireframe', 'wire'];
  const PAGE_PATH = { prd: '/prd', spec: '/spec', flow: '/flow', wireframe: '/wireframe', wire: '/studio' };
  function showPage(page) {
    document.querySelectorAll('.tb-tab').forEach((t) => {
      const on = t.dataset.page === page;
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      /* roving tabindex — tablist 는 Tab 한 번으로 진입하고 내부는 화살표로 옮긴다 */
      t.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.page').forEach((p) => { p.hidden = p.dataset.page !== page; });
    /* 가이드 파이프라인 페이지는 최신 PRD 답변으로 다시 그린다 */
    if (typeof window.__guideOnPage === 'function') window.__guideOnPage(page);
    /* 탭 잠금 상태(스텝) 다시 반영 */
    if (window.__wembStep) window.__wembStep.refresh();
    /* 페이지 위에 떠 있던 레일 플라이아웃은 닫는다 */
    if (typeof closeFly === 'function') closeFly();
  }
  function setPage(page) {
    WEMB.router.navigate(PAGE_PATH[page] || PAGE_PATH.wire);
  }
  window.__setPage = setPage;
  window.__showPage = showPage;
  PAGE_ORDER.forEach((page, i) => {
    WEMB.router.add('page:' + page, PAGE_PATH[page], (params, query, prev) => {
      /* 잠긴 단계 주소로 들어오면(뒤로가기 · 직접 입력) 열려 있는 마지막 단계로 돌린다.
         스튜디오만 예외 — 저장된 화면을 연 경우(프로젝트 열기 · 템플릿)와 공유 링크(?t=)는 단계와 무관하게 연다. */
      const lvl = window.__wembStep ? window.__wembStep.level() : PAGE_ORDER.length - 1;
      let hasScreen = false;
      try { hasScreen = !!localStorage.getItem('wemb-current-proj'); } catch (e) {}
      if (i > lvl && !(page === 'wire' && (hasScreen || query.t))) {
        if (prev && typeof toast === 'function') toast('이전 단계를 먼저 완료해 주세요', { type: 'warn' });
        return PAGE_PATH[PAGE_ORDER[lvl]];
      }
      document.getElementById('flowHome')?.classList.remove('show');
      showPage(page);
      /* 스튜디오 주소로 '처음' 열렸을 때(프로젝트 열기 · 새로고침) — 배경 스튜디오는 초기화로 이미 복원돼 있다.
         enterStudio 를 다시 부르면 레이아웃 프리셋이 수동 편집을 덮으므로 부르지 않고,
         단계 잠금 해제 · 상단 내비 반영 · 옵션창 '대시보드 편집 → 콘텐츠 추가'만 맞춘다. */
      if (page === 'wire' && !prev) {
        try { if (window.__wembStep) window.__wembStep.advance(4); } catch (e) {}
        try { if (window.__setStudioNav && typeof window.__WEMBFlowMenu === 'function') window.__setStudioNav(window.__WEMBFlowMenu()); } catch (e) {}
        try { if (window.__showSection) window.__showSection('dash-panels'); } catch (e) {}
      }
    });
  });
  /* ── 상단 탭 조작 ──
     잠긴 탭은 disabled 로 빼지 않고 초점만 받게 두므로(refreshSteps 참고),
     실제 차단은 여기서 aria-disabled 로 한다. 막을 때는 왜 막혔는지 말해 준다. */
  const tbTabsEl = document.getElementById('tbTabs');
  const tbTabList = () => Array.from(document.querySelectorAll('.tb-tab'));
  function tryPage(b) {
    if (!b) return;
    if (b.getAttribute('aria-disabled') === 'true') {
      if (typeof toast === 'function') toast(b.title || '이전 단계를 먼저 완료해 주세요', { type: 'warn' });
      return;
    }
    setPage(b.dataset.page);
  }
  tbTabsEl?.addEventListener('click', (e) => tryPage(e.target.closest('.tb-tab')));
  /* 화살표·Home·End 로 탭 사이를 옮긴다(WAI-ARIA tablist 표준 조작).
     이동은 초점만 옮기고, 실제 전환은 Enter/Space 또는 클릭에서 한다 —
     잠긴 단계를 지나쳐 볼 수 있어야 '무엇이 남았는지' 파악할 수 있다. */
  tbTabsEl?.addEventListener('keydown', (e) => {
    const tabs = tbTabList();
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    let j = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = tabs.length - 1;
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tryPage(tabs[i]); return; }
    if (j === null) return;
    e.preventDefault();
    tabs.forEach((t, k) => { t.tabIndex = k === j ? 0 : -1; });
    tabs[j].focus();
  });

  /* 상단 좌측 브랜드 클릭 → 로고(tb-mark)만 스튜디오 홈(런처)으로.
     'Studio' 이름 글씨·프로젝트명 클릭은 아무 동작도 하지 않는다(스튜디오로 튀지 않게). */
  document.querySelector('.tb-left')?.addEventListener('click', (e) => {
    if (e.target.closest('.tb-mark')) {
      document.getElementById('quickHome')?.click();
    }
  });
  /* 상단 우측 액션 → 기존 버튼 프록시 */
  document.querySelector('.tb-actions')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const map = { undo: 'histUndo', redo: 'histRedo', export: 'exportOpen' };
    document.getElementById(map[b.dataset.act])?.click();
  });
  /* ── 왼쪽 아이콘 레일 → 오른쪽 옆으로 펼쳐지는 플라이아웃 메뉴 ── */
  const ic = (p) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';
  const IC = {
    home: ic('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
    plus: ic('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),
    screen: ic('<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'),
    palette: ic('<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17" cy="12" r="1.2"/><circle cx="8.5" cy="7" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 3a9 9 0 1 0 0 18c1.6 0 1.7-1.3 1-2.1-.7-.9 0-2.1 1.2-2.1H17a4 4 0 0 0 4-4c0-4.4-4-7.8-9-7.8z"/>'),
    check: ic('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
    save: ic('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>'),
    upload: ic('<path d="M12 15V3"/><polyline points="7 8 12 3 17 8"/><path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/>'),
    grid: ic('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>'),
    columns: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>'),
    addpanel: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/>'),
    move: ic('<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>'),
    sliders: ic('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'),
    layout: ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
    undo: ic('<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>'),
    redo: ic('<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>'),
    reset: ic('<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>'),
    trash: ic('<polyline points="3 6 5 6 21 6"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/>'),
  };
  /* 옵션창을 선택한 섹션만 보이게 필터 (data-section) */
  function showSection(sec) {
    /* '레이아웃'(layout)은 '대시보드 편집'에 속하는 섹션이라 dash 탭·아이콘을 켜야 한다.
       예전엔 'dash'로 시작하지 않아 theme 탭(테마 만들기 아이콘)이 잘못 활성화됐다. */
    const isDash = sec.indexOf('dash') === 0 || sec === 'layout';
    activateTab(isDash ? 'dash' : 'theme');
    const p = document.querySelector('.sidepanel');
    if (p) { p.dataset.section = sec; p.scrollTop = 0; }
  }
  /* 스튜디오 진입 시 옵션창 섹션을 밖에서 지정할 수 있게 노출 (새 화면 진입 → 대시보드 편집 바로 열기용) */
  window.__showSection = showSection;
  function showStep(sec, id) {
    showSection(sec);
    const s = document.getElementById(id);
    if (s && s.tagName === 'DETAILS') s.open = true;
  }
  /* ── 테마 만들기 단계 이동(이전/다음) ──
     각 단계 카드 하단에 '이전 · 다음' 버튼을 넣는다.
     마지막(내보내기)엔 다음 없음, 첫(화면 정하기)엔 이전 없음.
     '다음'은 **처음부터 보인다.** 예전엔 그 단계를 한 번이라도 조작해야 나타났는데,
     고를 게 없거나 옵션이 잠긴 화면에서는 영영 안 나왔다(SK하이닉스 시안은 버전·화면
     테마가 둘 다 잠겨 있어 카드 안에 누를 것이 없다). 단계 이동은 옵션을 골랐는지와
     무관한 동작이라 감출 이유가 없다. */
  const THEME_STEPS = [['screen', 'stepScreen'], ['color', 'stepColor'], ['verify', 'stepVerify'], ['save', 'stepSave'], ['export', 'stepExport']];
  (function initThemeNav() {
    THEME_STEPS.forEach(([sec, id], i) => {
      const card = document.getElementById(id); if (!card) return;
      if (card.querySelector(':scope > .stepnav')) return;
      const nav = document.createElement('div');
      nav.className = 'stepnav';
      nav.innerHTML = '<button type="button" class="snav-prev">← 이전</button><button type="button" class="snav-next">다음 →</button>';
      card.appendChild(nav);
      const prev = nav.querySelector('.snav-prev'), next = nav.querySelector('.snav-next');
      if (i === 0) prev.style.visibility = 'hidden';
      if (i === THEME_STEPS.length - 1) next.style.display = 'none';
      prev.addEventListener('click', (e) => { e.preventDefault(); const p = THEME_STEPS[i - 1]; if (p) showStep(p[0], p[1]); });
      next.addEventListener('click', (e) => { e.preventDefault(); const n = THEME_STEPS[i + 1]; if (n) showStep(n[0], n[1]); });
    });
  })();
  function openLayoutGroup(label) {
    showSection('layout');
    document.querySelectorAll('#layList .laygrp').forEach((h) => {
      const lbl = h.querySelector('.laygrp-lbl');
      if (lbl && lbl.textContent.trim() === label) {
        const secEl = h.closest('.laygrp-sec');
        if (secEl && !secEl.classList.contains('open')) h.click();
        scrollTo(h);
      }
    });
  }
  const clickId = (id) => document.getElementById(id)?.click();
  const RAIL_MENUS = {
    /* 홈은 메뉴 없이 곧바로 런처로 이동하므로 여기 항목이 없다(레일 클릭 핸들러에서 직접 처리) */
    theme: [
      { label: '화면 정하기', icon: IC.screen, run: () => showStep('screen', 'stepScreen') },
      { label: '색 정하기', icon: IC.palette, run: () => showStep('color', 'stepColor') },
      { label: '접근성 검증', icon: IC.check, run: () => showStep('verify', 'stepVerify') },
      { label: '저장 · 스냅샷', icon: IC.save, run: () => showStep('save', 'stepSave') },
      { label: '내보내기', icon: IC.upload, run: () => showStep('export', 'stepExport') },
    ],
    dash: [
      { label: '레이아웃', icon: IC.layout, run: () => showSection('layout') },
      { label: '콘텐츠 추가', icon: IC.addpanel, run: () => showSection('dash-panels') },
      { label: '디자인 편집', icon: IC.sliders, run: () => showSection('dash-design') },
    ],
    layout: [
      { label: '2단', icon: IC.layout, run: () => openLayoutGroup('2단') },
      { label: '3단', icon: IC.layout, run: () => openLayoutGroup('3단') },
      { label: '모듈', icon: IC.layout, run: () => openLayoutGroup('모듈') },
    ],
    history: [
      { label: '되돌리기', icon: IC.undo, run: () => clickId('histUndo') },
      { label: '다시 실행', icon: IC.redo, run: () => clickId('histRedo') },
      { sep: true },
      { label: '색 정하기 초기화', icon: IC.reset, run: () => clickId('quickReset') },
      { label: '전체 옵션 초기화', icon: IC.trash, run: () => window.__wembResetAll && window.__wembResetAll() },
    ],
  };
  let flyEl = null, flyOpenFor = null;
  function ensureFly() {
    if (flyEl) return flyEl;
    flyEl = document.createElement('div');
    flyEl.className = 'railflyout';
    document.body.appendChild(flyEl);
    return flyEl;
  }
  function closeFly() {
    if (flyEl) flyEl.classList.remove('show');
    document.querySelectorAll('.siderail .railbtn.menuon').forEach((b) => b.classList.remove('menuon'));
    flyOpenFor = null;
  }
  function openFly(btn, key) {
    const items = RAIL_MENUS[key];
    if (!items) return;
    document.querySelectorAll('.siderail .railbtn.menuon').forEach((x) => x.classList.remove('menuon'));
    const el = ensureFly();
    el.innerHTML = '';
    items.forEach((it) => {
      if (it.sep) {
        const s = document.createElement('div');
        s.className = 'railfly-sep';
        el.appendChild(s);
        return;
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'railfly-item';
      b.innerHTML = (it.icon || '') + '<span>' + it.label + '</span>';
      b.addEventListener('click', () => { closeFly(); try { it.run(); } catch (e) {} });
      el.appendChild(b);
    });
    el.classList.add('show');
    const r = btn.getBoundingClientRect();
    const fh = el.offsetHeight;
    let top = r.top - 2;
    if (top + fh > window.innerHeight - 8) top = window.innerHeight - 8 - fh;
    el.style.left = r.right + 8 + 'px';
    el.style.top = Math.max(8, top) + 'px';
    btn.classList.add('menuon');
    flyOpenFor = key;
  }
  document.getElementById('siderail')?.addEventListener('click', (e) => {
    const b = e.target.closest('.railbtn');
    if (!b) return;
    const key = b.dataset.rail;
    if (key === 'collapse') { closeFly(); if (window.__setSidebarCollapsed) window.__setSidebarCollapsed(!app.classList.contains('collapsed')); else app.classList.toggle('collapsed'); return; }
    /* 홈 버튼은 메뉴 없이 곧바로 스튜디오 홈(런처)으로 이동 */
    if (key === 'home') { closeFly(); document.getElementById('quickHome')?.click(); return; }
    if (flyOpenFor === key) { closeFly(); return; }
    openFly(b, key);
  });
  /* 바깥 클릭 · Esc · 스크롤 → 플라이아웃 닫기 */
  document.addEventListener('click', (e) => {
    if (!flyOpenFor) return;
    if (e.target.closest('.railflyout') || e.target.closest('.siderail')) return;
    closeFly();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFly(); });
  window.addEventListener('resize', closeFly);
  /* 사이드바 탭을 다른 경로로 눌러도 상단/레일 표시 동기화 */
  document.querySelectorAll('.sbtabs .sbtab').forEach((t) => {
    t.addEventListener('click', () => syncTabUI(t.dataset.tab));
  });
  /* 상단 바에 현재 프로젝트명 표시 — brandName 입력과 동기화 */
  const bn = document.getElementById('brandName');
  const proj = document.getElementById('tbProj');
  const syncProj = () => { if (proj) proj.textContent = ((bn && bn.value) || '').trim(); };
  bn?.addEventListener('input', syncProj);
  syncProj();

  /* 초기 옵션창은 '화면 정하기' 섹션부터 노출 — 이후 rail 메뉴로 섹션을 바꾼다 */
  showStep('screen', 'stepScreen');

  /* 초기 표시는 스튜디오 — 실제로 열 화면은 모든 초기화가 끝난 뒤 주소가 정한다(shell/routes.js).
     flyEl 등 플라이아웃 상태가 초기화된 뒤(이 위치)에 불러야 showPage 안의 closeFly()가
     TDZ 에러를 내지 않는다(레일 메뉴가 죽던 원인). */
  showPage('wire');
})();
