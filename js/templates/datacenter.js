/* ── 데이터센터 통합 모니터링 디지털트윈 템플릿 연결 ──

   Digital Twin: Data Center Integrated Monitoring — Figma HzfsAmSQbpqIhAYebEkOWr(REM 페이지, 익명화 · 가상 데이터 반영본)의
   화면 4장(통합모니터링 · 전력 계통도 · 작업자안전관리 · 자산관리) + 전력 계통도 위에 얹는 팝업 5장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다.
   생성기 src/datacenter/_gen. 글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/datacenter/).
   원본이 다크 시안이라 처음엔 다크로 연다(라이트는 생성기가 파생, _gen/light.js · mk-light-datacenter.js).
   인터랙션 · 라이브 · 반응형 · 이벤트 목록 접기 · 차트 바꾸기 · 패널 옮기기는 src/datacenter-live.js(window.initDatacenter). */
/* px = 장면 뿌리(팝업도 전력 계통도 뿌리 .dmp-root 안에 얹힌다) · sheets = 꽂을 시트 [전역 이름, 시트 id] */
const DC_SCREENS = {
  'main': { px: 'dmm', build: 'build_dmm', sheets: [['DMM_CSS', 'dmm-style'], ['DMM_LIGHT_CSS', 'dmm-light-style']], title: '데이터센터 통합 모니터링 — 통합모니터링' },
  'power': { px: 'dmp', build: 'build_dmp', sheets: [['DMP_CSS', 'dmp-style'], ['DMP_LIGHT_CSS', 'dmp-light-style']], title: '데이터센터 통합 모니터링 — 통합전력계통도' },
  'worker': { px: 'dmw', build: 'build_dmw', sheets: [['DMW_CSS', 'dmw-style'], ['DMW_LIGHT_CSS', 'dmw-light-style']], title: '데이터센터 통합 모니터링 — 작업자안전관리' },
  'asset': { px: 'dma', build: 'build_dma', sheets: [['DMA_CSS', 'dma-style'], ['DMA_LIGHT_CSS', 'dma-light-style']], title: '데이터센터 통합 모니터링 — 자산관리' },
  'equipment': { px: 'dmp', build: 'build_dmp_equipment', sheets: [['DMP_CSS', 'dmp-style'], ['DMP_LIGHT_CSS', 'dmp-light-style'], ['DME_CSS', 'dme-style'], ['DME_LIGHT_CSS', 'dme-light-style']], title: '데이터센터 통합 모니터링 — 설비정보' },
  'card': { px: 'dmp', build: 'build_dmp_cardset', sheets: [['DMP_CSS', 'dmp-style'], ['DMP_LIGHT_CSS', 'dmp-light-style'], ['DMC_CSS', 'dmc-style'], ['DMC_LIGHT_CSS', 'dmc-light-style'], ['DMI_CSS', 'dmi-style'], ['DMI_LIGHT_CSS', 'dmi-light-style']], title: '데이터센터 통합 모니터링 — 설비 카드' },
  'search': { px: 'dmp', build: 'build_dmp_search', sheets: [['DMP_CSS', 'dmp-style'], ['DMP_LIGHT_CSS', 'dmp-light-style'], ['DMS_CSS', 'dms-style'], ['DMS_LIGHT_CSS', 'dms-light-style']], title: '데이터센터 통합 모니터링 — 설비정보팝업' },
  'scenario': { px: 'dmp', build: 'build_dmp_scenario', sheets: [['DMP_CSS', 'dmp-style'], ['DMP_LIGHT_CSS', 'dmp-light-style'], ['DMX_CSS', 'dmx-style'], ['DMX_LIGHT_CSS', 'dmx-light-style']], title: '데이터센터 통합 모니터링 — 시나리오설명' },
};
/* 설비 카드 장면 — Figma 에서 카드(설비 메뉴)와 간이 설비정보 창이 함께 떠 있다 → 카드 위에 간이 창을 하나 더 얹는다 */
window.build_dmp_cardset = function (base) {
  if (typeof window.build_dmp_card !== 'function' || typeof window.build_dmi !== 'function') return '';
  var d = document.createElement('div');
  d.innerHTML = window.build_dmp_card(base);
  var frame = d.querySelector('[data-name^="Screen/"]') || d.firstElementChild;
  var m = document.createElement('div');
  m.className = 'dmi-mount sh-popmount';
  m.setAttribute('data-name', 'Popup/Equipment Info (Compact)');
  m.innerHTML = '<div class="dmi-root sh-pop">' + window.build_dmi(base) + '</div>';
  frame.appendChild(m);
  return d.innerHTML;
};

const DC_ROOTS = '.dmm-root, .dmp-root, .dmw-root, .dma-root, .dme-root, .dmc-root, .dmi-root, .dms-root, .dmx-root';
/* 시안 자신의 주조색 — 시안 파랑(#2575D5, 표 머리글 · 강조). '색 정하기'의 시작값 */
const DC_SEED = '#2575D5';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyDatacenterCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-datacenter-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-datacenter-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'light' ? 'light' : 'dark';
      localStorage.setItem('wemb-datacenter-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || DC_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(DC_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyDatacenterDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = DC_SCREENS[which] ? which : (localStorage.getItem('wemb-datacenter-screen') || 'main');
  const S = DC_SCREENS[key] || DC_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait(DC_BUILDS(key), () => applyDatacenterDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-datacenter-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/datacenter-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'datacenter');
  try { syncSkxControls(); } catch (e) {}
  seedDatacenterBaseColor();
  applyDatacenterCarry();
  try {
    const want = localStorage.getItem('wemb-datacenter-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(DC_ROOTS).forEach((e) => {
    try { window.disposeDatacenter && window.disposeDatacenter(e); } catch (err) {}
    e.remove();
  });
  /* 시트 id = 'wrt-style' · 'wrt-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
  S.sheets.forEach(function (a) {
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
  try { window.initDatacenter && window.initDatacenter(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyDatacenterDT = applyDatacenterDT;

function clearDatacenterDT() {
  document.querySelectorAll(DC_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeDatacenter && window.disposeDatacenter(e); } catch (err) {}
    e.remove();
  });
}
window.__clearDatacenterDT = clearDatacenterDT;

window.__datacenterSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'datacenter' && DC_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-datacenter-screen');
  return DC_SCREENS[v] ? v : 'main';
};
const DC_BUILDS = (k) => (k === 'card' ? ['build_dmp_card', 'build_dmi'] : [(DC_SCREENS[k] || DC_SCREENS.main).build]);
WEMB.screenSwitch.register('datacenter', { sceneOf: (s) => s.tplScene || 'main', draw: applyDatacenterDT, builds: DC_BUILDS });
window.__openDatacenterScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'datacenter'); } catch (e) {}
  const key = DC_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyDatacenterDT(key), DC_BUILDS(key));
};

/* 화면끼리 잇기 — 상세보기 · 레일 · 이벤트 줄이 그 장면으로 간다(붙이는 쪽은 src/datacenter-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveDatacenter(url, name) {
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
window.__gotoDatacenterScene = function (scene) {
  const key = DC_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'datacenter') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'datacenter' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-datacenter-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveDatacenter(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openDatacenterScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedDatacenterBaseColor() {
  try {
    if (localStorage.getItem('wemb-datacenter-seeded')) return;
    localStorage.setItem('wemb-datacenter-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = DC_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
