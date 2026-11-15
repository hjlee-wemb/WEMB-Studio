/* ── 스마트 산단 디지털 트윈 템플릿 연결 ── */

/* ── Digital Twin: Smart Industrial Complex — Figma 화면 9장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma xzZQdVDkaDM1hve8Vc88GC (REM 페이지 9장) · 생성기 src/indpark/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/indpark/).
   원본이 다크 시안이라 라이트 시트를 함께 두어 '화면 테마'로 자유롭게 바꾼다.
   9장은 모두 단독 화면이다(팝업 장면도 Figma 에서 화면 전체로 그려져 있다) — 장면마다 뿌리가 따로(.ipm … .ipt-root).
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/indpark-live.js(window.initIndpark). */
const IP_SCREENS = {
  'main': { px: 'ipm', build: 'build_ipm', css: ['IPM_CSS'], light: ['IPM_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 종합 운영현황' },
  'menu': { px: 'ipn', build: 'build_ipn', css: ['IPN_CSS'], light: ['IPN_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 전체 메뉴' },
  'site': { px: 'ips', build: 'build_ips', css: ['IPS_CSS'], light: ['IPS_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 사업장 3D' },
  'forklift': { px: 'ipf', build: 'build_ipf', css: ['IPF_CSS'], light: ['IPF_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 지게차 충돌감시' },
  'vibration': { px: 'ipv', build: 'build_ipv', css: ['IPV_CSS'], light: ['IPV_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 진동센서 정보' },
  'heat': { px: 'iph', build: 'build_iph', css: ['IPH_CSS'], light: ['IPH_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 온도센서 정보' },
  'event': { px: 'ipe', build: 'build_ipe', css: ['IPE_CSS'], light: ['IPE_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 이벤트 현황' },
  'history': { px: 'ipy', build: 'build_ipy', css: ['IPY_CSS'], light: ['IPY_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 이벤트 히스토리' },
  'sensor': { px: 'ipt', build: 'build_ipt', css: ['IPT_CSS'], light: ['IPT_LIGHT_CSS'], title: '스마트 산단 디지털 트윈 — 센서현황' },
};
const IP_ROOTS = '.ipm-root, .ipn-root, .ips-root, .ipf-root, .ipv-root, .iph-root, .ipe-root, .ipy-root, .ipt-root';
/* 시안 자신의 주조색 — 강조 파랑(#0088FF). '색 정하기'의 시작값 */
const IP_SEED = '#0088FF';
/* 'IPM_CSS' → 'ipm-style' · 'IPM_LIGHT_CSS' → 'ipm-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
function ipSheetId(globalName) {
  const m = /^([A-Z]+)_(LIGHT_)?CSS$/.exec(globalName || '');
  return m ? m[1].toLowerCase() + (m[2] ? '-light' : '') + '-style' : '';
}

/* 헤더 메뉴 · 목록 · 단추로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyIndparkCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-indpark-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-indpark-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'light' ? 'light' : 'dark';
      localStorage.setItem('wemb-indpark-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || IP_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(IP_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyIndparkDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = IP_SCREENS[which] ? which : (localStorage.getItem('wemb-indpark-screen') || 'main');
  const S = IP_SCREENS[key] || IP_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyIndparkDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-indpark-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/indpark-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'indpark');
  try { syncSkxControls(); } catch (e) {}
  seedIndparkBaseColor();
  applyIndparkCarry();
  try {
    const want = localStorage.getItem('wemb-indpark-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(IP_ROOTS).forEach((e) => {
    try { window.disposeIndpark && window.disposeIndpark(e); } catch (err) {}
    e.remove();
  });
  [].concat(S.css, S.light).forEach(function (g) {
    const id = ipSheetId(g);
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
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  try { window.initIndpark && window.initIndpark(scr); } catch (e) {}
  /* 라이브가 시계 · 발생시간을 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyIndparkDT = applyIndparkDT;

function clearIndparkDT() {
  document.querySelectorAll(IP_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeIndpark && window.disposeIndpark(e); } catch (err) {}
    e.remove();
  });
}
window.__clearIndparkDT = clearIndparkDT;

window.__indparkSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'indpark' && IP_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-indpark-screen');
  return IP_SCREENS[v] ? v : 'main';
};
const IP_BUILDS = (k) => [(IP_SCREENS[k] || IP_SCREENS.main).build];
WEMB.screenSwitch.register('indpark', { sceneOf: (s) => s.tplScene || 'main', draw: applyIndparkDT, builds: IP_BUILDS });
window.__openIndparkScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'indpark'); } catch (e) {}
  const key = IP_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyIndparkDT(key), IP_BUILDS(key));
};

/* 화면끼리 잇기 — 헤더 메뉴 · 서랍 메뉴 · 지도 라벨 · 설비 목록 · 이벤트 행이 그 장면으로 간다(붙이는 쪽은 src/indpark-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveIndpark(url, name) {
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
window.__gotoIndparkScene = function (scene) {
  const key = IP_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'indpark') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'indpark' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-indpark-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveIndpark(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openIndparkScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedIndparkBaseColor() {
  try {
    if (localStorage.getItem('wemb-indpark-seeded')) return;
    localStorage.setItem('wemb-indpark-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = IP_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
