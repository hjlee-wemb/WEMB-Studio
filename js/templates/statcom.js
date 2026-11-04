/* ── STATCOM HMI 디지털 트윈 템플릿 연결 ── */

/* ── Digital Twin: STATCOM HMI — Figma 화면 11장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma lyDJkcOlrznLKWo7mD7C2n (page "Dark-시안01") · 생성기 src/statcom/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/statcom/).
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/statcom-live.js(window.initStatcom). */
const SC_SCREENS = {
  'main': { px: 'tcm', build: 'build_tcm', css: 'TCM_CSS', light: 'TCM_LIGHT_CSS', title: 'STATCOM HMI — 메인 화면' },
  'statcom': { px: 'tcs', build: 'build_tcs', css: 'TCS_CSS', light: 'TCS_LIGHT_CSS', title: 'STATCOM HMI — STATCOM' },
  'power': { px: 'tcp', build: 'build_tcp', css: 'TCP_CSS', light: 'TCP_LIGHT_CSS', title: 'STATCOM HMI — 전력설비' },
  'valve': { px: 'tcv', build: 'build_tcv', css: 'TCV_CSS', light: 'TCV_LIGHT_CSS', title: 'STATCOM HMI — VSC 밸브실' },
  'cooling': { px: 'tcc', build: 'build_tcc', css: 'TCC_CSS', light: 'TCC_LIGHT_CSS', title: 'STATCOM HMI — VSC 냉각실' },
  'supply': { px: 'tce', build: 'build_tce', css: 'TCE_CSS', light: 'TCE_LIGHT_CSS', title: 'STATCOM HMI — 전원 설비' },
  'safety': { px: 'tcn', build: 'build_tcn', css: 'TCN_CSS', light: 'TCN_LIGHT_CSS', title: 'STATCOM HMI — 제어 안전' },
  'simulation': { px: 'tcu', build: 'build_tcu', css: 'TCU_CSS', light: 'TCU_LIGHT_CSS', title: 'STATCOM HMI — 시뮬레이션' },
  'alarm': { px: 'tca', build: 'build_tca', css: 'TCA_CSS', light: 'TCA_LIGHT_CSS', title: 'STATCOM HMI — 알람 메세지' },
  'cards': { px: 'tcq', build: 'build_tcq', css: 'TCQ_CSS', light: 'TCQ_LIGHT_CSS', title: 'STATCOM HMI — 설비 요약 정보' },
  'vr-topic': { px: 'tvt', build: 'build_tvt', css: 'TVT_CSS', light: 'TVT_LIGHT_CSS', title: 'STATCOM HMI — VR 교육 주제 선택' },
  'vr-overview': { px: 'tvo', build: 'build_tvo', css: 'TVO_CSS', light: 'TVO_LIGHT_CSS', title: 'STATCOM HMI — VR 교육 개요' },
  'vr-step': { px: 'tvs', build: 'build_tvs', css: 'TVS_CSS', light: 'TVS_LIGHT_CSS', title: 'STATCOM HMI — VR 교육 단계 안내' },
  'vr-menu': { px: 'tvm', build: 'build_tvm', css: 'TVM_CSS', light: 'TVM_LIGHT_CSS', title: 'STATCOM HMI — VR 교육 메뉴' },
  'login': { px: 'tcl', build: 'build_tcl', css: 'TCL_CSS', light: 'TCL_LIGHT_CSS', title: 'STATCOM HMI — 로그인' },
};
const SC_ROOTS = '.tcm-root, .tcs-root, .tcp-root, .tcv-root, .tcc-root, .tce-root, .tcn-root, .tcu-root, .tca-root, .tcq-root, .tvt-root, .tvo-root, .tvs-root, .tvm-root, .tcl-root';
/* 시안 자신의 주조색 — 시안 파랑(#00B9F0). '색 정하기'의 시작값 */
const SC_SEED = '#00B9F0';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyStatcomCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-statcom-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-statcom-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'light' ? 'light' : 'dark';
      localStorage.setItem('wemb-statcom-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || SC_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(SC_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyStatcomDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = SC_SCREENS[which] ? which : (localStorage.getItem('wemb-statcom-screen') || 'main');
  const S = SC_SCREENS[key] || SC_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyStatcomDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-statcom-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/statcom-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'statcom');
  try { syncSkxControls(); } catch (e) {}
  seedStatcomBaseColor();
  applyStatcomCarry();
  try {
    const want = localStorage.getItem('wemb-statcom-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(SC_ROOTS).forEach((e) => {
    try { window.disposeStatcom && window.disposeStatcom(e); } catch (err) {}
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
  try { window.initStatcom && window.initStatcom(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyStatcomDT = applyStatcomDT;

function clearStatcomDT() {
  document.querySelectorAll(SC_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeStatcom && window.disposeStatcom(e); } catch (err) {}
    e.remove();
  });
}
window.__clearStatcomDT = clearStatcomDT;

window.__statcomSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'statcom' && SC_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-statcom-screen');
  return SC_SCREENS[v] ? v : 'main';
};
const SC_BUILDS = (k) => [(SC_SCREENS[k] || SC_SCREENS.main).build];
WEMB.screenSwitch.register('statcom', { sceneOf: (s) => s.tplScene || 'main', draw: applyStatcomDT, builds: SC_BUILDS });
window.__openStatcomScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'statcom'); } catch (e) {}
  const key = SC_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyStatcomDT(key), SC_BUILDS(key));
};

/* 화면끼리 잇기 — 사이드 메뉴가 그 장면으로 간다(붙이는 쪽은 src/statcom-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveStatcom(url, name) {
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
window.__gotoStatcomScene = function (scene) {
  const key = SC_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'statcom') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'statcom' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-statcom-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveStatcom(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openStatcomScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedStatcomBaseColor() {
  try {
    if (localStorage.getItem('wemb-statcom-seeded')) return;
    localStorage.setItem('wemb-statcom-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = SC_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
