/* ── 통합 운영 원뷰 템플릿 연결 ── */

/* ── Dashboard: Integrated Operations One-View — Figma 화면 11장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma B4mYvI2xtGTL1K5crHMLqe (Page 1 화면 11장, 익명화 · 가상 데이터 반영본) · 생성기 src/oneview/_gen.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘 · 그래픽만 Figma 가 내보낸 개별 svg/png(src/oneview/).
   원본이 다크 시안이라 라이트 시트를 함께 두어 '화면 테마'로 자유롭게 바꾼다.
   11장은 모두 단독 화면이다(팝업 장면도 Figma 에서 화면 전체로 그려져 있다) — 장면마다 뿌리가 따로(.ovm … .ove-root).
   인터랙션 · 라이브 · 반응형 · 차트 바꾸기 · 패널 옮기기는 src/oneview-live.js(window.initOneview). */
const OV_SCREENS = {
  'main': { px: 'ovm', build: 'build_ovm', css: ['OVM_CSS'], light: ['OVM_LIGHT_CSS'], title: '통합 운영 원뷰 — 종합현황' },
  'overview2': { px: 'ovn', build: 'build_ovn', css: ['OVN_CSS'], light: ['OVN_LIGHT_CSS'], title: '통합 운영 원뷰 — 종합현황 2' },
  'transactions': { px: 'ovt', build: 'build_ovt', css: ['OVT_CSS'], light: ['OVT_LIGHT_CSS'], title: '통합 운영 원뷰 — 거래현황' },
  'was': { px: 'ovw', build: 'build_ovw', css: ['OVW_CSS'], light: ['OVW_LIGHT_CSS'], title: '통합 운영 원뷰 — WAS 현황' },
  'waspopup': { px: 'ovp', build: 'build_ovp', css: ['OVP_CSS'], light: ['OVP_LIGHT_CSS'], title: '통합 운영 원뷰 — WAS 페이지 설정' },
  'tp': { px: 'ovq', build: 'build_ovq', css: ['OVQ_CSS'], light: ['OVQ_LIGHT_CSS'], title: '통합 운영 원뷰 — TP 성능현황' },
  'system': { px: 'ovs', build: 'build_ovs', css: ['OVS_CSS'], light: ['OVS_LIGHT_CSS'], title: '통합 운영 원뷰 — 시스템 현황' },
  'system2': { px: 'ovr', build: 'build_ovr', css: ['OVR_CSS'], light: ['OVR_LIGHT_CSS'], title: '통합 운영 원뷰 — 시스템 현황 2' },
  'detail': { px: 'ovd', build: 'build_ovd', css: ['OVD_CSS'], light: ['OVD_LIGHT_CSS'], title: '통합 운영 원뷰 — 시스템 현황 상세' },
  'network': { px: 'ovk', build: 'build_ovk', css: ['OVK_CSS'], light: ['OVK_LIGHT_CSS'], title: '통합 운영 원뷰 — 네트워크 현황' },
  'event': { px: 'ove', build: 'build_ove', css: ['OVE_CSS'], light: ['OVE_LIGHT_CSS'], title: '통합 운영 원뷰 — 이벤트현황' },
};
const OV_ROOTS = '.ovm-root, .ovn-root, .ovt-root, .ovw-root, .ovp-root, .ovq-root, .ovs-root, .ovr-root, .ovd-root, .ovk-root, .ove-root';
/* 시안 자신의 주조색 — 강조 파랑(#2F80FF, Stop · 활성 단추 · 차트 강조). '색 정하기'의 시작값 */
const OV_SEED = '#2F80FF';
/* 'IPM_CSS' → 'ipm-style' · 'IPM_LIGHT_CSS' → 'ipm-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
function ovSheetId(globalName) {
  const m = /^([A-Z]+)_(LIGHT_)?CSS$/.exec(globalName || '');
  return m ? m[1].toLowerCase() + (m[2] ? '-light' : '') + '-style' : '';
}

/* 헤더 메뉴 · 목록 · 단추로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyOneviewCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-oneview-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-oneview-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'light' ? 'light' : 'dark';
      localStorage.setItem('wemb-oneview-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || OV_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(OV_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyOneviewDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = OV_SCREENS[which] ? which : (localStorage.getItem('wemb-oneview-screen') || 'main');
  const S = OV_SCREENS[key] || OV_SCREENS['main'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyOneviewDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-oneview-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/oneview-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'oneview');
  try { syncSkxControls(); } catch (e) {}
  seedOneviewBaseColor();
  applyOneviewCarry();
  try {
    const want = localStorage.getItem('wemb-oneview-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(OV_ROOTS).forEach((e) => {
    try { window.disposeOneview && window.disposeOneview(e); } catch (err) {}
    e.remove();
  });
  [].concat(S.css, S.light).forEach(function (g) {
    const id = ovSheetId(g);
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
  try { window.initOneview && window.initOneview(scr); } catch (e) {}
  /* 라이브가 시계 · 발생시간을 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyOneviewDT = applyOneviewDT;

function clearOneviewDT() {
  document.querySelectorAll(OV_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeOneview && window.disposeOneview(e); } catch (err) {}
    e.remove();
  });
}
window.__clearOneviewDT = clearOneviewDT;

window.__oneviewSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'oneview' && OV_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-oneview-screen');
  return OV_SCREENS[v] ? v : 'main';
};
const OV_BUILDS = (k) => [(OV_SCREENS[k] || OV_SCREENS.main).build];
WEMB.screenSwitch.register('oneview', { sceneOf: (s) => s.tplScene || 'main', draw: applyOneviewDT, builds: OV_BUILDS });
window.__openOneviewScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'oneview'); } catch (e) {}
  const key = OV_SCREENS[which] ? which : 'main';
  WEMB.screenSwitch.transition(() => applyOneviewDT(key), OV_BUILDS(key));
};

/* 화면끼리 잇기 — 헤더 메뉴 · 서랍 메뉴 · 지도 라벨 · 설비 목록 · 이벤트 행이 그 장면으로 간다(붙이는 쪽은 src/oneview-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveOneview(url, name) {
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
window.__gotoOneviewScene = function (scene) {
  const key = OV_SCREENS[scene] ? scene : 'main';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'oneview') {
        if ((me.tplScene || 'main') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'oneview' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'main') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-oneview-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveOneview(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openOneviewScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedOneviewBaseColor() {
  try {
    if (localStorage.getItem('wemb-oneview-seeded')) return;
    localStorage.setItem('wemb-oneview-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = OV_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
