/* ── 신사업 관리 대시보드 템플릿 연결 ── */

/* ── Dashboard: New Business Management — Figma 화면 11장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma cES6X45zHjsaabaXL1cdrt (page "Dark-시안01") · 생성기 src/newbiz/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/newbiz/).
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/newbiz-live.js(window.initNewbiz). */
const NB_SCREENS = {
  'wind': { px: 'nbw', build: 'build_nbw', css: 'NBW_CSS', light: 'NBW_LIGHT_CSS', title: '신사업 관리 — 재생에너지 · 풍향' },
  'solar': { px: 'nbs', build: 'build_nbs', css: 'NBS_CSS', light: 'NBS_LIGHT_CSS', title: '신사업 관리 — 재생에너지 · 태양광' },
  'energy': { px: 'nbe', build: 'build_nbe', css: 'NBE_CSS', light: 'NBE_LIGHT_CSS', title: '신사업 관리 — 재생에너지 · 에너지' },
  'wind-input': { px: 'nbk', build: 'build_nbk', css: 'NBK_CSS', light: 'NBK_LIGHT_CSS', title: '신사업 관리 — 풍향 · 툴팁 인풋' },
  'solar-input': { px: 'nbl', build: 'build_nbl', css: 'NBL_CSS', light: 'NBL_LIGHT_CSS', title: '신사업 관리 — 태양광 · 툴팁 인풋' },
  'energy-input': { px: 'nbg', build: 'build_nbg', css: 'NBG_CSS', light: 'NBG_LIGHT_CSS', title: '신사업 관리 — 에너지 · 툴팁 인풋' },
  'measure': { px: 'nbm', build: 'build_nbm', css: 'NBM_CSS', light: 'NBM_LIGHT_CSS', title: '신사업 관리 — 계측현황' },
  'measure-wind': { px: 'nbt', build: 'build_nbt', css: 'NBT_CSS', light: 'NBT_LIGHT_CSS', title: '신사업 관리 — 계측현황 · 풍력 툴팁' },
  'measure-solar': { px: 'nbu', build: 'build_nbu', css: 'NBU_CSS', light: 'NBU_LIGHT_CSS', title: '신사업 관리 — 계측현황 · 태양광 툴팁' },
  'measure-popup': { px: 'nbp', build: 'build_nbp', css: 'NBP_CSS', light: 'NBP_LIGHT_CSS', title: '신사업 관리 — 계측현황 · 사업 팝업' },
  'overseas': { px: 'nbo', build: 'build_nbo', css: 'NBO_CSS', light: 'NBO_LIGHT_CSS', title: '신사업 관리 — 해외사업' },
};
const NB_ROOTS = '.nbw-root, .nbs-root, .nbe-root, .nbk-root, .nbl-root, .nbg-root, .nbm-root, .nbt-root, .nbu-root, .nbp-root, .nbo-root';
/* 시안 자신의 주조색 — 시안 하늘색(#7FD3FA). '색 정하기'의 시작값 */
const NB_SEED = '#7FD3FA';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyNewbizCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-newbiz-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-newbiz-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'light' ? 'light' : 'dark';
      localStorage.setItem('wemb-newbiz-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || NB_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(NB_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyNewbizDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = NB_SCREENS[which] ? which : (localStorage.getItem('wemb-newbiz-screen') || 'wind');
  const S = NB_SCREENS[key] || NB_SCREENS['wind'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyNewbizDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-newbiz-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/newbiz-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'newbiz');
  try { syncSkxControls(); } catch (e) {}
  seedNewbizBaseColor();
  applyNewbizCarry();
  try {
    const want = localStorage.getItem('wemb-newbiz-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(NB_ROOTS).forEach((e) => {
    try { window.disposeNewbiz && window.disposeNewbiz(e); } catch (err) {}
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
  try { window.initNewbiz && window.initNewbiz(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyNewbizDT = applyNewbizDT;

function clearNewbizDT() {
  document.querySelectorAll(NB_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeNewbiz && window.disposeNewbiz(e); } catch (err) {}
    e.remove();
  });
}
window.__clearNewbizDT = clearNewbizDT;

window.__newbizSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'newbiz' && NB_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-newbiz-screen');
  return NB_SCREENS[v] ? v : 'wind';
};
const NB_BUILDS = (k) => [(NB_SCREENS[k] || NB_SCREENS.wind).build];
WEMB.screenSwitch.register('newbiz', { sceneOf: (s) => s.tplScene || 'wind', draw: applyNewbizDT, builds: NB_BUILDS });
window.__openNewbizScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'newbiz'); } catch (e) {}
  const key = NB_SCREENS[which] ? which : 'wind';
  WEMB.screenSwitch.transition(() => applyNewbizDT(key), NB_BUILDS(key));
};

/* 화면끼리 잇기 — 헤더 메뉴 · 탭이 그 장면으로 간다(붙이는 쪽은 src/newbiz-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveNewbiz(url, name) {
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
window.__gotoNewbizScene = function (scene) {
  const key = NB_SCREENS[scene] ? scene : 'wind';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'newbiz') {
        if ((me.tplScene || 'wind') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'newbiz' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'wind') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-newbiz-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveNewbiz(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openNewbizScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedNewbizBaseColor() {
  try {
    if (localStorage.getItem('wemb-newbiz-seeded')) return;
    localStorage.setItem('wemb-newbiz-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = NB_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
