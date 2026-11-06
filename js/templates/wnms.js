/* ── 무선망 통합관리 대시보드 템플릿 연결 ── */

/* ── Dashboard: Wireless Network Management — Figma 화면 8장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma WdpL1qGqIo76WQavOsDvp6 (page "Light-시안01") · 생성기 src/wnms/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/wnms/).
   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js).
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/wnms-live.js(window.initWnms). */
const WN_SCREENS = {
  'main': { px: 'wnm', build: 'build_wnm', css: 'WNM_CSS', light: 'WNM_LIGHT_CSS', title: '무선망 통합관리 — 무선망 통합관리 메인' },
  'main-open': { px: 'wno', build: 'build_wno', css: 'WNO_CSS', light: 'WNO_LIGHT_CSS', title: '무선망 통합관리 — 메인 · 메뉴 열림' },
  'main-expanded': { px: 'wnx', build: 'build_wnx', css: 'WNX_CSS', light: 'WNX_LIGHT_CSS', title: '무선망 통합관리 — 메인 · 메뉴 펼침' },
  'room-top': { px: 'wnt', build: 'build_wnt', css: 'WNT_CSS', light: 'WNT_LIGHT_CSS', title: '무선망 통합관리 — 3D 통신실 · 평면' },
  'room-view': { px: 'wnv', build: 'build_wnv', css: 'WNV_CSS', light: 'WNV_LIGHT_CSS', title: '무선망 통합관리 — 3D 통신실 · 투시' },
  'equipment': { px: 'wne', build: 'build_wne', css: 'WNE_CSS', light: 'WNE_LIGHT_CSS', title: '무선망 통합관리 — NMS 설비 계통도' },
  'detail': { px: 'wnd', build: 'build_wnd', css: 'WND_CSS', light: 'WND_LIGHT_CSS', title: '무선망 통합관리 — NMS 세부 계통도' },
  'login': { px: 'wnl', build: 'build_wnl', css: 'WNL_CSS', light: 'WNL_LIGHT_CSS', title: '무선망 통합관리 — 로그인' },
};
const WN_ROOTS = '.wnm-root, .wno-root, .wnx-root, .wnt-root, .wnv-root, .wne-root, .wnd-root, .wnl-root';
/* 시안 자신의 주조색 — 남색(#0C4DA1). '색 정하기'의 시작값 */
const WN_SEED = '#0C4DA1';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyWnmsCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-wnms-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-wnms-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'dark' ? 'dark' : 'light';
      localStorage.setItem('wemb-wnms-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || WN_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(WN_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyWnmsDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = WN_SCREENS[which] ? which : (localStorage.getItem('wemb-wnms-screen') || 'main');
  const S = WN_SCREENS[key] || WN_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyWnmsDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-wnms-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/wnms-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'wnms');
  try { syncSkxControls(); } catch (e) {}
  seedWnmsBaseColor();
  applyWnmsCarry();
  try {
    const want = localStorage.getItem('wemb-wnms-mode') === 'dark' ? 'dark' : 'light';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(WN_ROOTS).forEach((e) => {
    try { window.disposeWnms && window.disposeWnms(e); } catch (err) {}
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
  try { window.initWnms && window.initWnms(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyWnmsDT = applyWnmsDT;

function clearWnmsDT() {
  document.querySelectorAll(WN_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeWnms && window.disposeWnms(e); } catch (err) {}
    e.remove();
  });
}
window.__clearWnmsDT = clearWnmsDT;

window.__wnmsSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'wnms' && WN_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-wnms-screen');
  return WN_SCREENS[v] ? v : 'main';
};
const WN_BUILDS = (k) => [(WN_SCREENS[k] || WN_SCREENS.main).build];
WEMB.screenSwitch.register('wnms', { sceneOf: (s) => s.tplScene || 'main', draw: applyWnmsDT, builds: WN_BUILDS });
window.__openWnmsScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'wnms'); } catch (e) {}
  const key = WN_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyWnmsDT(key), WN_BUILDS(key));
};

/* 화면끼리 잇기 — GNB 메뉴 · 장비 타일이 그 장면으로 간다(붙이는 쪽은 src/wnms-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveWnms(url, name) {
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
window.__gotoWnmsScene = function (scene) {
  const key = WN_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'wnms') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'wnms' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-wnms-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveWnms(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openWnmsScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedWnmsBaseColor() {
  try {
    if (localStorage.getItem('wemb-wnms-seeded')) return;
    localStorage.setItem('wemb-wnms-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = WN_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
