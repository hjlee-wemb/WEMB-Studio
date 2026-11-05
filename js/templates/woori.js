/* ── 우리은행 통합 대시보드 템플릿 연결 ── */

/* ── Dashboard: Woori Bank — Figma 화면 세 장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma qln8qMsqzCt918dZOQOWOS (202304-우리은행, page "Dark-시안01")
     · Screen/Transaction Status 11:946 → src/woori-transaction.js (.wrt-root)
     · Screen/Performance Status 15:2   → src/woori-performance.js (.wrp-root)
     · Screen/Event Status 19:2533      → src/woori-event.js       (.wre-root)
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN · 숫자는 원본 글꼴 Tomorrow), 아이콘·그래픽만 Figma 가 내보낸 개별 svg/png(src/woori/).
   원본이 다크 시안이라 라이트 시트를 함께 두어 '화면 테마'로 자유롭게 바꾼다.
   인터랙션·라이브·반응형·차트 바꾸기·패널 옮기기는 src/woori-live.js(window.initWoori). */
const WR_SCREENS = {
  'transaction': { px: 'wrt', build: 'build_wrt', css: 'WRT_CSS', light: 'WRT_LIGHT_CSS', title: '뱅킹 운영 — 거래현황' },
  'performance': { px: 'wrp', build: 'build_wrp', css: 'WRP_CSS', light: 'WRP_LIGHT_CSS', title: '뱅킹 운영 — 성능현황' },
  'event': { px: 'wre', build: 'build_wre', css: 'WRE_CSS', light: 'WRE_LIGHT_CSS', title: '뱅킹 운영 — 이벤트현황' },
};
const WR_ROOTS = '.wrt-root, .wrp-root, .wre-root';
/* 시안 자신의 주조색 — 구성도 · 메뉴의 하늘 파랑(#09B6FB). '색 정하기'의 시작값 */
const WR_SEED = '#09B6FB';

/* 헤더 메뉴로 넘어왔으면 떠난 화면의 밝기 · 색을 그대로 잇는다 — 상태 묶음이 화면마다 따로라 안 이으면 다크 · 기본 색으로 돌아간다.
   main.js 가 이 화면을 그린 뒤에 저장 테마를 복원하므로(restoreCurrentTheme) 그 복원이 끝난 다음 차례에 입힌다. */
function applyWooriCarry() {
  let c = null;
  try {
    const raw = sessionStorage.getItem('wemb-woori-carry');
    if (!raw) return;
    sessionStorage.removeItem('wemb-woori-carry');
    c = JSON.parse(raw);
  } catch (e) { return; }
  setTimeout(() => {
    try {
      if (typeof state === 'undefined') return;
      const mode = c.mode === 'light' ? 'light' : 'dark';
      localStorage.setItem('wemb-woori-mode', mode);
      state.mode = mode;
      state.source = c.source || 'seed';
      state.sourceView = c.source || 'seed';
      state.seed = c.seed || WR_SEED;
      state.subHex = c.subHex || null;
      state.mapMode = c.mapMode || 'auto';
      state.imgCols = c.imgCols || null;
      if (c.adjust) state.adjust = c.adjust;
      state.overrides = c.overrides || {};
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === mode));
      if (typeof apply === 'function') apply();
      document.querySelectorAll(WR_ROOTS).forEach((r) => { r.dataset.theme = mode; });
      if (window.__applyTplTint) window.__applyTplTint();
    } catch (e) {}
  }, 0);
}

function applyWooriDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = WR_SCREENS[which] ? which : (localStorage.getItem('wemb-woori-screen') || 'transaction');
  const S = WR_SCREENS[key] || WR_SCREENS['transaction'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build], () => applyWooriDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-woori-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/woori-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'woori');
  try { syncSkxControls(); } catch (e) {}
  seedWooriBaseColor();
  applyWooriCarry();
  try {
    const want = localStorage.getItem('wemb-woori-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(WR_ROOTS).forEach((e) => {
    try { window.disposeWoori && window.disposeWoori(e); } catch (err) {}
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
  try { window.initWoori && window.initWoori(scr); } catch (e) {}
  /* 라이브가 시계 · 발생일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyWooriDT = applyWooriDT;

function clearWooriDT() {
  document.querySelectorAll(WR_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeWoori && window.disposeWoori(e); } catch (err) {}
    e.remove();
  });
}
window.__clearWooriDT = clearWooriDT;

window.__wooriSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'woori' && WR_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-woori-screen');
  return WR_SCREENS[v] ? v : 'transaction';
};
const WR_BUILDS = (k) => [(WR_SCREENS[k] || WR_SCREENS.transaction).build];
WEMB.screenSwitch.register('woori', { sceneOf: (s) => s.tplScene || 'transaction', draw: applyWooriDT, builds: WR_BUILDS });
window.__openWooriScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'woori'); } catch (e) {}
  const key = WR_SCREENS[which] ? which : 'transaction';
  WEMB.screenSwitch.transition(() => applyWooriDT(key), WR_BUILDS(key));
};

/* 화면끼리 잇기 — 헤더 메뉴(거래현황 · 성능현황 · 이벤트현황)가 그 장면으로 간다(붙이는 쪽은 src/woori-live.js 의 installNav).
   같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면 그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나
   새로고침 때 되돌아간다. 문서를 다시 읽지 않고 오른쪽 화면만 바꾼다(js/core/screen-switch.js).
   아래 막은 그럴 수 없을 때(발표 화면)만 쓰는 예전 길이다. */
function leaveWoori(url, name) {
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
window.__gotoWooriScene = function (scene) {
  const key = WR_SCREENS[scene] ? scene : 'transaction';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'woori') {
        if ((me.tplScene || 'transaction') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'woori' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'transaction') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          try {
            if (typeof state !== 'undefined') sessionStorage.setItem('wemb-woori-carry', JSON.stringify({ mode: state.mode, source: state.source, seed: state.seed, subHex: state.subHex, mapMode: state.mapMode, imgCols: state.imgCols, adjust: state.adjust, overrides: state.overrides }));
          } catch (e) {}
          if (WEMB.screenSwitch.toScreen(sib)) return;
          P.persistCurrentProjectData();
          leaveWoori(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openWooriScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedWooriBaseColor() {
  try {
    if (localStorage.getItem('wemb-woori-seeded')) return;
    localStorage.setItem('wemb-woori-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = WR_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
