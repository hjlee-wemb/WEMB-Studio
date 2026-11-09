/* ── 스마트 도면관리 템플릿 연결 ── */

/* ── Dashboard: Smart Drawing Management — Figma 화면 19장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma hfgGjtOuOsX3wdxk33ldyv (page "Light-시안01") · 생성기 src/drawing/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/drawing/).
   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js).
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/drawing-live.js(window.initDrawing). */
const DG_SCREENS = {
  'main': { px: 'dwm', build: 'build_dwm', css: 'DWM_CSS', light: 'DWM_LIGHT_CSS', title: '스마트 도면관리 — 메인' },
  'main-menu': { px: 'dwn', build: 'build_dwn', css: 'DDG_CSS', light: 'DDG_LIGHT_CSS', title: '스마트 도면관리 — 메인 · 메뉴' },
  'main-select': { px: 'dws', build: 'build_dws', css: 'DWS_CSS', light: 'DWS_LIGHT_CSS', title: '스마트 도면관리 — 메인 · 사업소 선택' },
  'main-popup': { px: 'dwp', build: 'build_dwp', css: 'DWP_CSS', light: 'DWP_LIGHT_CSS', title: '스마트 도면관리 — 메인 · 사업소 변경' },
  'search': { px: 'dwa', build: 'build_dwa', css: 'DWA_CSS', light: 'DWA_LIGHT_CSS', title: '스마트 도면관리 — 도면조회' },
  'search-detail': { px: 'dwb', build: 'build_dwb', css: 'DWB_CSS', light: 'DWB_LIGHT_CSS', title: '스마트 도면관리 — 도면조회 · 상세검색' },
  'preview': { px: 'dwv', build: 'build_dwv', css: 'DWV_CSS', light: 'DWV_LIGHT_CSS', title: '스마트 도면관리 — 도면조회 · 미리보기' },
  'preview-popup': { px: 'dwo', build: 'build_dwo', css: 'DWO_CSS', light: 'DWO_LIGHT_CSS', title: '스마트 도면관리 — 도면조회 · 미리보기 팝업' },
  'register': { px: 'dwr', build: 'build_dwr', css: 'DWR_CSS', light: 'DWR_LIGHT_CSS', title: '스마트 도면관리 — 도면 등록' },
  'equipment': { px: 'dwe', build: 'build_dwe', css: 'DWE_CSS', light: 'DWE_LIGHT_CSS', title: '스마트 도면관리 — 설비 마스터 팝업' },
  'help': { px: 'dwh', build: 'build_dwh', css: 'DWH_CSS', light: 'DWH_LIGHT_CSS', title: '스마트 도면관리 — 도움말 팝업' },
  'checkin': { px: 'dwi', build: 'build_dwi', css: 'DWI_CSS', light: 'DWI_LIGHT_CSS', title: '스마트 도면관리 — 도면수정(체크인)' },
  'cctv': { px: 'dwc', build: 'build_dwc', css: 'DWC_CSS', light: 'DWC_LIGHT_CSS', title: '스마트 도면관리 — CCTV 조회' },
  'desk': { px: 'dwk', build: 'build_dwk', css: 'DWK_CSS', light: 'DWK_LIGHT_CSS', title: '스마트 도면관리 — Help Desk 조회' },
  'desk-write': { px: 'dww', build: 'build_dww', css: 'DWW_CSS', light: 'DWW_LIGHT_CSS', title: '스마트 도면관리 — Help Desk 등록' },
  'desk-detail': { px: 'dwd', build: 'build_dwd', css: 'DWD_CSS', light: 'DWD_LIGHT_CSS', title: '스마트 도면관리 — Help Desk 상세보기' },
  'total-search': { px: 'dwt', build: 'build_dwt', css: 'DWT_CSS', light: 'DWT_LIGHT_CSS', title: '스마트 도면관리 — 통합검색' },
  'total-result': { px: 'dwu', build: 'build_dwu', css: 'DWU_CSS', light: 'DWU_LIGHT_CSS', title: '스마트 도면관리 — 통합검색 결과' },
  'login': { px: 'dwl', build: 'build_dwl', css: 'DWL_CSS', light: 'DWL_LIGHT_CSS', title: '스마트 도면관리 — 로그인' },
};
const DG_ROOTS = '.dwm-root, .dwn-root, .dws-root, .dwp-root, .dwa-root, .dwb-root, .dwv-root, .dwo-root, .dwr-root, .dwe-root, .dwh-root, .dwi-root, .dwc-root, .dwk-root, .dww-root, .dwd-root, .dwt-root, .dwu-root, .dwl-root';
/* 시안 자신의 주조색 — 파랑(#3967FD). '색 정하기'의 시작값 */
const DG_SEED = '#3967FD';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyDrawingCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-drawing-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-drawing-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'dark' ? 'dark' : 'light';
      localStorage.setItem('wemb-drawing-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || DG_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(DG_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyDrawingDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = DG_SCREENS[which] ? which : (localStorage.getItem('wemb-drawing-screen') || 'main');
  const S = DG_SCREENS[key] || DG_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyDrawingDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-drawing-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/drawing-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'drawing');
  try { syncSkxControls(); } catch (e) {}
  seedDrawingBaseColor();
  applyDrawingCarry();
  try {
    const want = localStorage.getItem('wemb-drawing-mode') === 'dark' ? 'dark' : 'light';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(DG_ROOTS).forEach((e) => {
    try { window.disposeDrawing && window.disposeDrawing(e); } catch (err) {}
    e.remove();
  });
  /* 시트 id = 'wrt-style' · 'wrt-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
  [[S.css, S.px + '-style'], [S.light, S.px + '-light-style']].forEach(function (a) {
    if (!window[a[0]] || document.getElementById(a[1])) return;
    const st = document.createElement('style');
    st.id = a[1];
    st.textContent = window[a[0]];
    document.head.appendChild(st);
  });
  const scr = document.createElement('div');
  scr.className = S.px + '-root';
  scr.dataset.theme = (typeof state !== 'undefined' && state.mode === 'light') ? 'light' : 'dark';
  scr.innerHTML = window[S.build]();
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  try { window.initDrawing && window.initDrawing(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyDrawingDT = applyDrawingDT;

function clearDrawingDT() {
  document.querySelectorAll(DG_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeDrawing && window.disposeDrawing(e); } catch (err) {}
    e.remove();
  });
}
window.__clearDrawingDT = clearDrawingDT;

window.__drawingSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'drawing' && DG_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-drawing-screen');
  return DG_SCREENS[v] ? v : 'main';
};
const DG_BUILDS = (k) => [(DG_SCREENS[k] || DG_SCREENS.main).build];
WEMB.screenSwitch.register('drawing', { sceneOf: (s) => s.tplScene || 'main', draw: applyDrawingDT, builds: DG_BUILDS });
window.__openDrawingScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'drawing'); } catch (e) {}
  const key = DG_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyDrawingDT(key), DG_BUILDS(key));
};

/* 화면끼리 잇기 — 헤더 메뉴 · 단추가 그 장면으로 간다(붙이는 쪽은 src/drawing-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveDrawing(url, name) {
  const sp = document.getElementById('openSplash');
  if (!sp) { location.href = url; return; }
  if (name) document.documentElement.style.setProperty('--boot-name', JSON.stringify(String(name)));
  sp.classList.remove('out');
  sp.classList.add('show', 'enter');
  let gone = false;
  const go = () => { if (gone) return; gone = true; location.href = url; };
  requestAnimationFrame(() => requestAnimationFrame(go));
  setTimeout(go, 120);
}
window.__gotoDrawingScene = function (scene) {
  const key = DG_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'drawing') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'drawing' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-drawing-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveDrawing(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openDrawingScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedDrawingBaseColor() {
  try {
    if (localStorage.getItem('wemb-drawing-seeded')) return;
    localStorage.setItem('wemb-drawing-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = DG_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
