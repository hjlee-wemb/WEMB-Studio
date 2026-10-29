/* ── 신한카드 정보보호 대시보드 템플릿 연결 ── */

/* ── Dashboard: Shinhan Card Security — Figma 화면 네 장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma zXb8i3nonD9Hpu5kdZQs6t (202303 신한카드 정보보호 대시보드, page "Dark-시안01")
     · Screen/Security Overview 2:2                    → src/shinhan-overview.js (.shm-root)
     · Screen/Security Overview - Anomaly Registration 62:5
         = 보안 현황 + Dim + Dialog/Anomaly Registration(66:1026) → src/shinhan-register.js (.shm-root 안의 .sha-root)
     · Screen/Security Data Entry 67:1067               → src/shinhan-entry.js   (.shi-root)
     · Screen/Anomaly Detection 71:2243                 → src/shinhan-anomaly.js (.shd-root)
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘·그래픽만 Figma 가 내보낸 개별 svg/png(src/shinhan/).
   원본이 다크 시안이라 라이트 시트를 함께 두어 '화면 테마'로 자유롭게 바꾼다.
   인터랙션·라이브·반응형·차트 바꾸기·패널 옮기기는 src/shinhan-live.js(window.initShinhan). */
const SH_SCREENS = {
  'overview': { px: 'shm', build: 'build_shm', css: ['SHM_CSS'], light: ['SHM_LIGHT_CSS'], title: '신한카드 정보보호 — 보안 현황' },
  /* 이상징후 탐지 등록 — 보안 현황(2:2) **위에** Dim 과 등록 창(66:1026)이 떠 있는 화면(Figma 62:5).
     바탕이 보안 현황과 같아 다시 만들지 않고 창만 얹는다(build_shm_register). 시트도 두 벌을 함께 싣는다. */
  'register': {
    px: 'shm', build: 'build_shm_register',
    css: ['SHM_CSS', 'SHA_CSS'], light: ['SHM_LIGHT_CSS', 'SHA_LIGHT_CSS'],
    title: '신한카드 정보보호 — 이상징후 탐지 등록',
  },
  'entry': { px: 'shi', build: 'build_shi', css: ['SHI_CSS'], light: ['SHI_LIGHT_CSS'], title: '신한카드 정보보호 — 정보보호 현황 입력' },
  'anomaly': {
    px: 'shd', build: 'build_shd',
    /* 표에서 줄을 두 번 누르면 그 줄로 등록 창을 겹쳐 띄운다 — 창 시트를 미리 함께 싣는다 */
    css: ['SHD_CSS', 'SHA_CSS'], light: ['SHD_LIGHT_CSS', 'SHA_LIGHT_CSS'],
    title: '신한카드 정보보호 — 이상징후 탐지',
  },
};
/* 'SHM_CSS' → 'shm-style' · 'SHA_LIGHT_CSS' → 'sha-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
function shSheetId(globalName) {
  const m = /^([A-Z]+)_(LIGHT_)?CSS$/.exec(globalName || '');
  return m ? m[1].toLowerCase() + (m[2] ? '-light' : '') + '-style' : '';
}
const SH_ROOTS = '.shm-root, .shi-root, .shd-root';
/* 시안 자신의 주조색 — 금일 OUT 선 · 지표 파랑(#4571FF). '색 정하기'의 시작값 */
const SH_SEED = '#4571FF';

function applyShinhanDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = SH_SCREENS[which] ? which : (localStorage.getItem('wemb-shinhan-screen') || 'overview');
  const S = SH_SCREENS[key] || SH_SCREENS['overview'];
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait([S.build, 'build_sha'], () => applyShinhanDT(key))) return;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-shinhan-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/shinhan-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'shinhan');
  try { syncSkxControls(); } catch (e) {}
  seedShinhanBaseColor();
  try {
    const want = localStorage.getItem('wemb-shinhan-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(SH_ROOTS).forEach((e) => {
    try { window.disposeShinhan && window.disposeShinhan(e); } catch (err) {}
    e.remove();
  });
  [].concat(S.css, S.light).forEach(function (g) {
    const id = shSheetId(g);
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
  scr.querySelectorAll('.sh-pop').forEach(function (e) { e.dataset.theme = scr.dataset.theme; });
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  try { window.initShinhan && window.initShinhan(scr); } catch (e) {}
  /* 라이브가 시계·날짜를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 날짜가 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyShinhanDT = applyShinhanDT;

function clearShinhanDT() {
  document.querySelectorAll(SH_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeShinhan && window.disposeShinhan(e); } catch (err) {}
    e.remove();
  });
}
window.__clearShinhanDT = clearShinhanDT;

window.__shinhanSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'shinhan' && SH_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-shinhan-screen');
  return SH_SCREENS[v] ? v : 'overview';
};
window.__openShinhanScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'shinhan'); } catch (e) {}
  applyShinhanDT(SH_SCREENS[which] ? which : 'overview');
};

/* 화면끼리 잇기 — 헤더 메뉴(Main화면 · 이상징후탐지 · 정보보호점검 · 내부통제검토) · 브랜드 · 등록 창 닫기가 그 장면으로 간다
   (붙이는 쪽은 src/shinhan-live.js 의 installNav). 같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면
   그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나 새로고침 때 되돌아간다.
   떠나기 전에 홈에서 화면을 열 때와 같은 '여는 막'(#openSplash)을 먼저 띄운다. */
function leaveShinhan(url, name) {
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
window.__gotoShinhanScene = function (scene) {
  const key = SH_SCREENS[scene] ? scene : 'overview';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'shinhan') {
        if ((me.tplScene || 'overview') === key) return;
        const sib = list
          .filter((x) => x.tpl === 'shinhan' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'overview') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          P.persistCurrentProjectData();
          leaveShinhan(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openShinhanScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedShinhanBaseColor() {
  try {
    if (localStorage.getItem('wemb-shinhan-seeded')) return;
    localStorage.setItem('wemb-shinhan-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = SH_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
