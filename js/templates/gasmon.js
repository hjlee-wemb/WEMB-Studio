/* ── 스마트 플랜트 가스 모니터링 템플릿 연결 ── */

/* ── Dashboard: Smart Plant Gas Monitoring — Figma 화면 2장 + 팝업 3장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma CbbEsxxZo3vBcBprsiUhJm (REM 페이지) · 생성기 src/gasmon/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/gasmon/).
   원본이 다크 시안이라 라이트 시트를 함께 두어 '화면 테마'로 자유롭게 바꾼다.
   팝업 세 장은 Figma 에 단독 프레임이라 가스 메인 화면 한가운데에 얹는다 — 뿌리는 가스 메인과 같은 .gmg-root, 팝업은 그 안의 .gmw/.gma/.gmc-root.
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/gasmon-live.js(window.initGasmon). */
const GM_SCREENS = {
  'main': { px: 'gmm', build: 'build_gmm', css: ['GMM_CSS'], light: ['GMM_LIGHT_CSS'], title: '스마트 플랜트 가스 모니터링 — 메인' },
  'gas': { px: 'gmg', build: 'build_gmg', css: ['GMG_CSS'], light: ['GMG_LIGHT_CSS'], title: '스마트 플랜트 가스 모니터링 — 가스 메인' },
  'worksite': { px: 'gmg', build: 'build_gmw_scene', css: ['GMG_CSS', 'GMW_CSS'], light: ['GMG_LIGHT_CSS', 'GMW_LIGHT_CSS'], title: '스마트 플랜트 가스 모니터링 — 작업개소 상세' },
  'alarm': { px: 'gmg', build: 'build_gma_scene', css: ['GMG_CSS', 'GMA_CSS'], light: ['GMG_LIGHT_CSS', 'GMA_LIGHT_CSS'], title: '스마트 플랜트 가스 모니터링 — 가스농도 이상' },
  'confirm': { px: 'gmg', build: 'build_gmc_scene', css: ['GMG_CSS', 'GMC_CSS'], light: ['GMG_LIGHT_CSS', 'GMC_LIGHT_CSS'], title: '스마트 플랜트 가스 모니터링 — 전송 확인' },
};
const GM_ROOTS = '.gmm-root, .gmg-root';
/* 시안 자신의 주조색 — 시안(#00BBFF). '색 정하기'의 시작값 */
const GM_SEED = '#00BBFF';
/* 'GMG_CSS' → 'gmg-style' · 'GMW_LIGHT_CSS' → 'gmw-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
function gmSheetId(globalName) {
  const m = /^([A-Z]+)_(LIGHT_)?CSS$/.exec(globalName || '');
  return m ? m[1].toLowerCase() + (m[2] ? '-light' : '') + '-style' : '';
}

/* 헤더 메뉴 · 팝업 단추로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyGasmonCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-gasmon-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-gasmon-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'light' ? 'light' : 'dark';
      localStorage.setItem('wemb-gasmon-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || GM_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(GM_ROOTS + ', .sh-pop').forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyGasmonDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = GM_SCREENS[which] ? which : (localStorage.getItem('wemb-gasmon-screen') || 'main');
  const S = GM_SCREENS[key] || GM_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyGasmonDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-gasmon-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/gasmon-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'gasmon');
  try { syncSkxControls(); } catch (e) {}
  seedGasmonBaseColor();
  applyGasmonCarry();
  try {
    const want = localStorage.getItem('wemb-gasmon-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(GM_ROOTS).forEach((e) => {
    try { window.disposeGasmon && window.disposeGasmon(e); } catch (err) {}
    e.remove();
  });
  [].concat(S.css, S.light).forEach(function (g) {
    const id = gmSheetId(g);
    if (!id || !window[g] || document.getElementById(id)) return;
    const st = document.createElement('style');
    st.id = id;
    st.textContent = window[g];
    document.head.appendChild(st);
  });
  const scr = document.createElement('div');
  scr.className = S.px + '-root';
  scr.dataset.theme = (typeof state !== 'undefined' && state.mode === 'light') ? 'light' : 'dark';
  scr.innerHTML = window[S.build]();
  /* 겹쳐 얹은 팝업도 같은 밝기로 시작한다(라이브가 뒤에도 따라가게 하지만 첫 그림부터 맞아야 한다) */
  scr.querySelectorAll('.sh-pop').forEach(function (e) { e.dataset.theme = scr.dataset.theme; });
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  try { window.initGasmon && window.initGasmon(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyGasmonDT = applyGasmonDT;

function clearGasmonDT() {
  document.querySelectorAll(GM_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeGasmon && window.disposeGasmon(e); } catch (err) {}
    e.remove();
  });
}
window.__clearGasmonDT = clearGasmonDT;

window.__gasmonSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'gasmon' && GM_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-gasmon-screen');
  return GM_SCREENS[v] ? v : 'main';
};
const GM_BUILDS = (k) => [(GM_SCREENS[k] || GM_SCREENS.main).build];
WEMB.screenSwitch.register('gasmon', { sceneOf: (s) => s.tplScene || 'main', draw: applyGasmonDT, builds: GM_BUILDS });
window.__openGasmonScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'gasmon'); } catch (e) {}
  const key = GM_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyGasmonDT(key), GM_BUILDS(key));
};

/* 화면끼리 잇기 — 헤더 메뉴 · 메뉴 카드 · 도면 센서 표지 · 팝업 단추가 그 장면으로 간다(붙이는 쪽은 src/gasmon-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveGasmon(url, name) {
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
window.__gotoGasmonScene = function (scene) {
  const key = GM_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'gasmon') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'gasmon' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-gasmon-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveGasmon(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openGasmonScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedGasmonBaseColor() {
  try {
    if (localStorage.getItem('wemb-gasmon-seeded')) return;
    localStorage.setItem('wemb-gasmon-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = GM_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
