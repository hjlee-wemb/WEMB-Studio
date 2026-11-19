/* ── 스마트팩토리 에너지관리 디지털트윈 템플릿 연결 ── */

/* ── Digital Twin: Smart Factory Energy Management — Figma 화면 5장(종합 현황 + 그 위 팝업 4장)을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma FwLj96v9IlQSHRPURiJouD (REM 섹션, 가상 데이터 반영본) · 생성기 src/fems/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/fems/).
   원본이 라이트 시안이라 처음엔 라이트로 연다(다크는 생성기가 파생, _gen/dark.js · mk-dark-svgs.js · mk-dark-png.ps1 · mk-dark-scene.ps1).
   인터랙션 · 라이브 · 반응형 · 이벤트 로그 펼침 · 차트 바꾸기 · 패널 옮기기는 src/fems-live.js(window.initFems). */
/* px = 장면 뿌리(팝업도 종합 현황 뿌리 .fmm-root 안에 얹힌다) · sheets = 꽂을 시트 [전역 이름, 시트 id] */
const FM_SCREENS = {
  'main': { px: 'fmm', build: 'build_fmm', sheets: [['FMM_CSS', 'fmm-style'], ['FMM_LIGHT_CSS', 'fmm-light-style']], title: '스마트팩토리 에너지관리 — 종합 현황' },
  'diagram': { px: 'fmm', build: 'build_fmm_diagram', sheets: [['FMM_CSS', 'fmm-style'], ['FMM_LIGHT_CSS', 'fmm-light-style'], ['FMD_CSS', 'fmd-style'], ['FMD_LIGHT_CSS', 'fmd-light-style']], title: '스마트팩토리 에너지관리 — 계통도' },
  'event': { px: 'fmm', build: 'build_fmm_event', sheets: [['FMM_CSS', 'fmm-style'], ['FMM_LIGHT_CSS', 'fmm-light-style'], ['FME_CSS', 'fme-style'], ['FME_LIGHT_CSS', 'fme-light-style']], title: '스마트팩토리 에너지관리 — 이벤트 브라우저' },
  'solar': { px: 'fmm', build: 'build_fmm_solar', sheets: [['FMM_CSS', 'fmm-style'], ['FMM_LIGHT_CSS', 'fmm-light-style'], ['FMS_CSS', 'fms-style'], ['FMS_LIGHT_CSS', 'fms-light-style']], title: '스마트팩토리 에너지관리 — 태양광 PV' },
  'equipment': { px: 'fmm', build: 'build_fmm_equipment', sheets: [['FMM_CSS', 'fmm-style'], ['FMM_LIGHT_CSS', 'fmm-light-style'], ['FMQ_CSS', 'fmq-style'], ['FMQ_LIGHT_CSS', 'fmq-light-style']], title: '스마트팩토리 에너지관리 — 장비 상세' },
};
const FM_ROOTS = '.fmm-root, .fmd-root, .fme-root, .fms-root, .fmq-root, .fmx-root';
/* 시안 자신의 주조색 — 하늘 파랑(#009DFF). '색 정하기'의 시작값 */
const FM_SEED = '#009DFF';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyFemsCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-fems-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-fems-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'dark' ? 'dark' : 'light';
      localStorage.setItem('wemb-fems-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || FM_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(FM_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyFemsDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = FM_SCREENS[which] ? which : (localStorage.getItem('wemb-fems-screen') || 'main');
  const S = FM_SCREENS[key] || FM_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyFemsDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-fems-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/fems-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'fems');
  try { syncSkxControls(); } catch (e) {}
  seedFemsBaseColor();
  applyFemsCarry();
  try {
    const want = localStorage.getItem('wemb-fems-mode') === 'dark' ? 'dark' : 'light';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(FM_ROOTS).forEach((e) => {
    try { window.disposeFems && window.disposeFems(e); } catch (err) {}
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
  try { window.initFems && window.initFems(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyFemsDT = applyFemsDT;

function clearFemsDT() {
  document.querySelectorAll(FM_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeFems && window.disposeFems(e); } catch (err) {}
    e.remove();
  });
}
window.__clearFemsDT = clearFemsDT;

window.__femsSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'fems' && FM_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-fems-screen');
  return FM_SCREENS[v] ? v : 'main';
};
const FM_BUILDS = (k) => [(FM_SCREENS[k] || FM_SCREENS.main).build];
WEMB.screenSwitch.register('fems', { sceneOf: (s) => s.tplScene || 'main', draw: applyFemsDT, builds: FM_BUILDS });
window.__openFemsScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'fems'); } catch (e) {}
  const key = FM_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyFemsDT(key), FM_BUILDS(key));
};

/* 화면끼리 잇기 — 상세보기 · 레일 · 이벤트 줄이 그 장면으로 간다(붙이는 쪽은 src/fems-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveFems(url, name) {
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
window.__gotoFemsScene = function (scene) {
  const key = FM_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'fems') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'fems' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-fems-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveFems(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openFemsScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedFemsBaseColor() {
  try {
    if (localStorage.getItem('wemb-fems-seeded')) return;
    localStorage.setItem('wemb-fems-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = FM_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
