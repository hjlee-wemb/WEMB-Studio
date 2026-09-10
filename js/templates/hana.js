/* ── HANA Bank H.I.T 템플릿 연결 ── */

/* ── HANA Bank H.I.T — Figma 화면 15장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma H3S2M7DUCvuJgi75oBqg6W (1920x1080, page "Page 1")
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘·그래픽만 Figma 가 내보낸
   개별 svg/png(src/hana/)을 그대로 쓴다. 좌표·크기·색은 Figma 값 그대로(근사 없음).
   원본이 다크 시안이라 라이트 시트를 따로 만들어 '화면 테마'로 자유롭게 바꿀 수 있다. */
const HN_SCREENS = {
  'overview-02': { px: 'hno2', build: 'build_hno2', css: 'HNO2_CSS', light: 'HNO2_LIGHT_CSS', title: 'HANA Bank H.I.T — 종합현황02' },
  'cloud-01': { px: 'hnc1', build: 'build_hnc1', css: 'HNC1_CSS', light: 'HNC1_LIGHT_CSS', title: 'HANA Bank H.I.T — 클라우드현황01' },
  'cloud-02': { px: 'hnc2', build: 'build_hnc2', css: 'HNC2_CSS', light: 'HNC2_LIGHT_CSS', title: 'HANA Bank H.I.T — 클라우드현황02' },
  'middleware': { px: 'hnm', build: 'build_hnm', css: 'HNM_CSS', light: 'HNM_LIGHT_CSS', title: 'HANA Bank H.I.T — 미들웨어현황' },
  'infra-main': { px: 'hni1', build: 'build_hni1', css: 'HNI1_CSS', light: 'HNI1_LIGHT_CSS', title: 'HANA Bank H.I.T — 인프라 메인' },
  'infra-detail': { px: 'hni2', build: 'build_hni2', css: 'HNI2_CSS', light: 'HNI2_LIGHT_CSS', title: 'HANA Bank H.I.T — 인프라 상세' },
  'event': { px: 'hne', build: 'build_hne', css: 'HNE_CSS', light: 'HNE_LIGHT_CSS', title: 'HANA Bank H.I.T — 이벤트현황' },
  'network-01': { px: 'hnn1', build: 'build_hnn1', css: 'HNN1_CSS', light: 'HNN1_LIGHT_CSS', title: 'HANA Bank H.I.T — 네트워크현황01' },
  'network-02': { px: 'hnn2', build: 'build_hnn2', css: 'HNN2_CSS', light: 'HNN2_LIGHT_CSS', title: 'HANA Bank H.I.T — 네트워크현황02' },
  'network-03': { px: 'hnn3', build: 'build_hnn3', css: 'HNN3_CSS', light: 'HNN3_LIGHT_CSS', title: 'HANA Bank H.I.T — 네트워크현황03' },
  'facility': { px: 'hnf', build: 'build_hnf', css: 'HNF_CSS', light: 'HNF_LIGHT_CSS', title: 'HANA Bank H.I.T — 상면관리' },
  'security-01': { px: 'hns1', build: 'build_hns1', css: 'HNS1_CSS', light: 'HNS1_LIGHT_CSS', title: 'HANA Bank H.I.T — 보안시스템01' },
  'security-02': { px: 'hns2', build: 'build_hns2', css: 'HNS2_CSS', light: 'HNS2_LIGHT_CSS', title: 'HANA Bank H.I.T — 보안시스템02' },
  'login': { px: 'hnl', build: 'build_hnl', css: 'HNL_CSS', light: 'HNL_LIGHT_CSS', title: 'HANA Bank H.I.T — 로그인' },
};
const HN_ROOTS = '.hno2-root, .hnc1-root, .hnc2-root, .hnm-root, .hni1-root, .hni2-root, .hne-root, .hnn1-root, .hnn2-root, .hnn3-root, .hnf-root, .hns1-root, .hns2-root, .hnl-root';
const HN_SEED = '#009178';   /* 시안 자신의 브랜드 초록 — '색 정하기'의 시작값 */

function applyHanaDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = HN_SCREENS[which] ? which : (localStorage.getItem('wemb-hana-screen') || 'overview-02');
  const S = HN_SCREENS[key] || HN_SCREENS['overview-02'];
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-hana-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/hana-live.js 의 fitStage). */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'hana');
  try { syncSkxControls(); } catch (e) {}
  seedHanaBaseColor();
  try {
    const want = localStorage.getItem('wemb-hana-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  stage.querySelectorAll(HN_ROOTS).forEach((e) => {
    try { window.disposeHana && window.disposeHana(e); } catch (err) {}
    e.remove();
  });
  [[S.px + '-style', window[S.css]], [S.px + '-light-style', window[S.light]]].forEach(function (p) {
    if (!p[1] || document.getElementById(p[0])) return;
    const st = document.createElement('style');
    st.id = p[0];
    st.textContent = p[1];
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
  try { window.initHana && window.initHana(scr); } catch (e) {}
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
}
window.__applyHanaDT = applyHanaDT;

function clearHanaDT() {
  document.querySelectorAll(HN_ROOTS.split(', ').map((x) => '#dtStage ' + x).join(', ')).forEach((e) => {
    try { window.disposeHana && window.disposeHana(e); } catch (err) {}
    e.remove();
  });
}
window.__clearHanaDT = clearHanaDT;

window.__hanaSceneOf = function () {
  try {
    const list = JSON.parse(localStorage.getItem('wemb-projects') || '[]');
    const open = list.find((p) => p && p.open && p.tpl === 'hana');
    if (open && open.tplScene) return open.tplScene;
  } catch (e) {}
  const v = localStorage.getItem('wemb-hana-screen');
  return HN_SCREENS[v] ? v : 'overview-02';
};
window.__openHanaScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'hana'); } catch (e) {}
  applyHanaDT(HN_SCREENS[which] ? which : 'overview-02');
};

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 브랜드 초록으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedHanaBaseColor() {
  try {
    if (localStorage.getItem('wemb-hana-seeded')) return;
    localStorage.setItem('wemb-hana-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = HN_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
