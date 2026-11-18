/* ── 복합화력 설비정보 디지털트윈 템플릿 연결 ── */

/* ── Digital Twin: Combined Cycle Power Plant — Figma 화면 5장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma r7V2rTKcUto2Yd1qL4XSfZ (REM 섹션, 가상 데이터 반영본) · 생성기 src/ccpp/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/ccpp/).
   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js · mk-dark-svgs.js · mk-dark-diagram.ps1).
   인터랙션 · 라이브 · 반응형 · 탭 조각 · 차트 바꾸기 · 패널 옮기기는 src/ccpp-live.js(window.initCcpp). */
const CC_SCREENS = {
  'main': { px: 'ccm', build: 'build_ccm', css: 'CCM_CSS', light: 'CCM_LIGHT_CSS', title: '복합화력 설비정보 — 설비 맵' },
  'library': { px: 'ccl', build: 'build_ccl', css: 'CCL_CSS', light: 'CCL_LIGHT_CSS', title: '복합화력 설비정보 — 도서관리' },
  'diagram': { px: 'ccd', build: 'build_ccd', css: 'CCD_CSS', light: 'CCD_LIGHT_CSS', title: '복합화력 설비정보 — 계통도' },
  'detail': { px: 'cce', build: 'build_cce', css: 'CCE_CSS', light: 'CCE_LIGHT_CSS', title: '복합화력 설비정보 — 태그 · 상세정보' },
  'file-open': { px: 'ccf', build: 'build_ccf', css: 'CCF_CSS', light: 'CCF_LIGHT_CSS', title: '복합화력 설비정보 — 파일 열기' },
};
const CC_ROOTS = '.ccm-root, .ccl-root, .ccd-root, .cce-root, .ccf-root';
/* 시안 자신의 주조색 — 파랑(#0073FF). '색 정하기'의 시작값 */
const CC_SEED = '#0073FF';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyCcppCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-ccpp-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-ccpp-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'dark' ? 'dark' : 'light';
      localStorage.setItem('wemb-ccpp-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || CC_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(CC_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyCcppDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = CC_SCREENS[which] ? which : (localStorage.getItem('wemb-ccpp-screen') || 'main');
  const S = CC_SCREENS[key] || CC_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyCcppDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-ccpp-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/ccpp-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'ccpp');
  try { syncSkxControls(); } catch (e) {}
  seedCcppBaseColor();
  applyCcppCarry();
  try {
    const want = localStorage.getItem('wemb-ccpp-mode') === 'dark' ? 'dark' : 'light';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(CC_ROOTS).forEach((e) => {
    try { window.disposeCcpp && window.disposeCcpp(e); } catch (err) {}
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
  try { window.initCcpp && window.initCcpp(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyCcppDT = applyCcppDT;

function clearCcppDT() {
  document.querySelectorAll(CC_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeCcpp && window.disposeCcpp(e); } catch (err) {}
    e.remove();
  });
}
window.__clearCcppDT = clearCcppDT;

window.__ccppSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'ccpp' && CC_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-ccpp-screen');
  return CC_SCREENS[v] ? v : 'main';
};
const CC_BUILDS = (k) => [(CC_SCREENS[k] || CC_SCREENS.main).build];
WEMB.screenSwitch.register('ccpp', { sceneOf: (s) => s.tplScene || 'main', draw: applyCcppDT, builds: CC_BUILDS });
window.__openCcppScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'ccpp'); } catch (e) {}
  const key = CC_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyCcppDT(key), CC_BUILDS(key));
};

/* 화면끼리 잇기 — 상세보기 · 레일 · 이벤트 줄이 그 장면으로 간다(붙이는 쪽은 src/ccpp-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveCcpp(url, name) {
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
window.__gotoCcppScene = function (scene) {
  const key = CC_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'ccpp') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'ccpp' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-ccpp-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveCcpp(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openCcppScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedCcppBaseColor() {
  try {
    if (localStorage.getItem('wemb-ccpp-seeded')) return;
    localStorage.setItem('wemb-ccpp-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = CC_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
