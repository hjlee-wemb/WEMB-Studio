/* ── LS Electric STATCOM 템플릿 연결 ── */

/* ── LS Electric STATCOM — Figma 화면 2장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma KkmCQi05F7eSb3tHO7ZW0Q (page "Dark-시안01")
     · Screen/STATCOM Overview 3:5       → src/lselectric-statcom.js     (.lsm-root)
     · Screen/Data Center Overview 33:748 → src/lselectric-datacenter.js (.lsd-root)
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘·그래픽만 Figma 가 내보낸 개별 svg/png(src/lselectric/).
   원본이 다크 시안이라 라이트 시트를 함께 두어 '화면 테마'로 자유롭게 바꾼다.
   인터랙션·라이브·반응형·차트 바꾸기·패널 옮기기는 src/lselectric-live.js(window.initLsElectric). */
const LS_SCREENS = {
  'statcom': { px: 'lsm', build: 'build_lsm', css: 'LSM_CSS', light: 'LSM_LIGHT_CSS', title: 'LS Electric STATCOM — STATCOM' },
  'datacenter': { px: 'lsd', build: 'build_lsd', css: 'LSD_CSS', light: 'LSD_LIGHT_CSS', title: 'LS Electric STATCOM — Data Center' },
  /* ACB 진단(1단) — STATCOM 화면(3:5) **위에** 진단 팝업(76:597)이 떠 있는 화면(Figma 62:1493).
     바탕이 STATCOM 과 픽셀 한 점도 다르지 않아 다시 만들지 않고 팝업만 얹는다(build_lsm_acb).
     뿌리는 STATCOM 과 같은 .lsm-root 이고 팝업은 그 안의 .lsa-root 다 — 시트도 두 벌을 함께 싣는다. */
  'acb': {
    px: 'lsm', build: 'build_lsm_acb',
    css: ['LSM_CSS', 'LSA_CSS'], light: ['LSM_LIGHT_CSS', 'LSA_LIGHT_CSS'],
    title: 'LS Electric STATCOM — ACB 진단(1단)',
  },
  /* 계통 진단(Figma 89:2000 · 팝업 76:875) · 에너지 진단(89:2927 · 팝업 94:5015) — ACB 와 같은 꼴(STATCOM 위에 팝업) */
  'system': {
    px: 'lsm', build: 'build_lsm_system',
    css: ['LSM_CSS', 'LSY_CSS'], light: ['LSM_LIGHT_CSS', 'LSY_LIGHT_CSS'],
    title: 'LS Electric STATCOM — 계통 진단',
  },
  'energy': {
    px: 'lsm', build: 'build_lsm_energy',
    css: ['LSM_CSS', 'LSE_CSS'], light: ['LSM_LIGHT_CSS', 'LSE_LIGHT_CSS'],
    title: 'LS Electric STATCOM — 에너지 진단',
  },
};
/* 'LSM_CSS' → 'lsm-style' · 'LSA_LIGHT_CSS' → 'lsa-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
function lsSheetId(globalName) {
  const m = /^([A-Z]+)_(LIGHT_)?CSS$/.exec(globalName || '');
  return m ? m[1].toLowerCase() + (m[2] ? '-light' : '') + '-style' : '';
}
const LS_ROOTS = '.lsm-root, .lsd-root';
const LS_SEED = '#2861FF';   /* 시안 자신의 브랜드 파랑(접기 단추 · 검색 단추 그라디언트 시작색) — '색 정하기'의 시작값 */

function applyLsElectricDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = LS_SCREENS[which] ? which : (localStorage.getItem('wemb-lselectric-screen') || 'statcom');
  const S = LS_SCREENS[key] || LS_SCREENS['statcom'];
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-lselectric-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/lselectric-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'lselectric');
  try { syncSkxControls(); } catch (e) {}
  seedLsElectricBaseColor();
  try {
    const want = localStorage.getItem('wemb-lselectric-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(LS_ROOTS).forEach((e) => {
    try { window.disposeLsElectric && window.disposeLsElectric(e); } catch (err) {}
    e.remove();
  });
  [].concat(S.css, S.light).forEach(function (g) {
    const id = lsSheetId(g);
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
  /* 겹쳐 얹은 팝업도 같은 밝기로 시작한다(색 바꾸기가 뒤에 다시 맞춰 주지만 첫 그림부터 맞아야 한다) */
  scr.querySelectorAll('.ls-pop').forEach(function (e) { e.dataset.theme = scr.dataset.theme; });
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  try { window.initLsElectric && window.initLsElectric(scr); } catch (e) {}
  /* 라이브가 시계·발생시각을 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyLsElectricDT = applyLsElectricDT;

function clearLsElectricDT() {
  document.querySelectorAll(LS_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeLsElectric && window.disposeLsElectric(e); } catch (err) {}
    e.remove();
  });
}
window.__clearLsElectricDT = clearLsElectricDT;

window.__lsElectricSceneOf = function () {
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const me = P.loadProjects().find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'lselectric' && LS_SCREENS[me.tplScene]) return me.tplScene;
    }
  } catch (e) {}
  const v = localStorage.getItem('wemb-lselectric-screen');
  return LS_SCREENS[v] ? v : 'statcom';
};
window.__openLsElectricScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'lselectric'); } catch (e) {}
  applyLsElectricDT(LS_SCREENS[which] ? which : 'statcom');
};

/* 화면끼리 잇기 — 시안의 사이트 선택(Data Center / STATCOM 라디오)·홈 아이콘을 누르면 그 장면으로 간다
   (붙이는 쪽은 src/lselectric-live.js 의 installPicks). 같은 프로젝트에 그 장면으로 만든 형제 화면이 있으면
   그 화면을 연다 — 캔버스만 바꿔치우면 열린 화면 기록(tplScene)과 어긋나 새로고침 때 되돌아간다.
   떠나기 전에 홈에서 화면을 열 때와 같은 '여는 막'(#openSplash)을 먼저 띄운다. */
function leaveLsElectric(url, name) {
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

window.__gotoLsScene = function (scene) {
  const key = LS_SCREENS[scene] ? scene : 'statcom';
  try {
    const P = window.WEMB && WEMB.projects;
    if (P) {
      const list = P.loadProjects();
      const me = list.find((x) => x.id === localStorage.getItem(P.CUR_PROJ));
      if (me && me.tpl === 'lselectric') {
        if ((me.tplScene || 'statcom') === key) return;       /* 이미 그 화면이다 */
        const sib = list
          .filter((x) => x.tpl === 'lselectric' && x.projectId === me.projectId && !x.deleted && (x.tplScene || 'statcom') === key)
          .sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        if (sib) {
          P.persistCurrentProjectData();
          leaveLsElectric(location.pathname + '?screen=' + encodeURIComponent(sib.id) + '#/studio', sib.name);
          return;
        }
      }
    }
  } catch (e) {}
  window.__openLsElectricScreen(key);
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 브랜드 파랑으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedLsElectricBaseColor() {
  try {
    if (localStorage.getItem('wemb-lselectric-seeded')) return;
    localStorage.setItem('wemb-lselectric-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = LS_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
