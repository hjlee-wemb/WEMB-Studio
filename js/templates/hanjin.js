/* ── 한진 통합관제 템플릿 연결 ── */

/* ── 한진 SMART 통합관제 — Figma 화면 3장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma A11hAZefK5FSuEE9MagOgj
     · Control Main  65:429   → src/hanjin-control.js (.hjc-root)
     · Gate Status   65:943   → src/hanjin-gate.js    (.hjg-root)
     · Unload Status 65:2243  → src/hanjin-unload.js  (.hju-root)
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘·그래픽만 Figma 가 내보낸
   개별 svg/png(src/hanjin/)을 그대로 쓴다. 좌표·크기·색은 Figma 값 그대로(근사 없음).
   원본이 다크 시안이라 라이트 시트를 따로 만들어 '화면 테마'로 자유롭게 바꿀 수 있다. */
const HJ_SCREENS = {
  main:   { px: 'hjc', build: 'build_hjc', css: 'HJC_CSS', light: 'HJC_LIGHT_CSS', title: '한진 SMART 통합관제' },
  gate:   { px: 'hjg', build: 'build_hjg', css: 'HJG_CSS', light: 'HJG_LIGHT_CSS', title: '한진 입/출문현황' },
  unload: { px: 'hju', build: 'build_hju', css: 'HJU_CSS', light: 'HJU_LIGHT_CSS', title: '한진 하차현황' },
};
const HJ_SEED = '#2861FF';   /* 시안 자신의 브랜드 파랑 — '색 정하기'의 시작값 */

function applyHanjinDT(which) {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  const key = HJ_SCREENS[which] ? which : (localStorage.getItem('wemb-hanjin-screen') || 'main');
  const S = HJ_SCREENS[key] || HJ_SCREENS.main;
  if (typeof window[S.build] !== 'function') return;
  try { localStorage.setItem('wemb-hanjin-screen', key); } catch (e) {}
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/hanjin-live.js 의 fitStage).
     1920x1080 기준을 유지한 채 캔버스만 작업 영역 비율만큼 넓히고 블록을 다시 배치하므로
     잘림도 왜곡도 없다. 정확히 16:9 면 Figma 원본과 픽셀 동일. */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'hanjin');
  try { syncSkxControls(); } catch (e) {}
  seedHanjinBaseColor();
  /* 원본이 Dark 시안이라 처음 열 때는 Dark 로 시작하고, 그 뒤로는 '화면 테마'에서 고른 값을 되살린다 */
  try {
    const want = localStorage.getItem('wemb-hanjin-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = S.title;
  /* 예전 래스터 시안·다른 화면은 치운다 */
  stage.querySelectorAll('.hj-repro, .hjc-root, .hjg-root, .hju-root').forEach((e) => {
    try { window.disposeHanjin && window.disposeHanjin(e); } catch (err) {}
    e.remove();
  });
  /* 화면 CSS + 라이트 시트 1회씩 주입(라이트가 뒤에 와야 오버라이드가 먹는다) */
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
  /* '콘텐츠 추가'로 넣는 패널이 얹힐 영역 — 시안 위 같은 레이어에 둔다 */
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  /* 인터랙션·라이브 데이터(반응형·실시간 시계·호버·접기/펴기·차트) */
  try { window.initHanjin && window.initHanjin(scr); } catch (e) {}
  /* 화면 안에서 세 장을 오가는 길은 hanjin-live.js 의 installMenu 가 맡는다
     (거기서 window.__openHanjinScreen 을 부른다 — 준비 안 된 화면은 그쪽에서 막는다) */
  /* '패널편집'(내용 수정)이 이 화면의 글자도 잡도록 편집 대상을 다시 수집한다 */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
}
window.__applyHanjinDT = applyHanjinDT;

function clearHanjinDT() {
  document.querySelectorAll('#dtStage .hjc-root, #dtStage .hjg-root, #dtStage .hju-root').forEach((e) => {
    try { window.disposeHanjin && window.disposeHanjin(e); } catch (err) {}
    e.remove();
  });
}
window.__clearHanjinDT = clearHanjinDT;

/* 지금 보고 있는 한진 화면 — 프로젝트 기록(tplScene)이 있으면 그게 정답이다 */
window.__hanjinSceneOf = function () {
  try {
    const list = JSON.parse(localStorage.getItem('wemb-projects') || '[]');
    const open = list.find((p) => p && p.open && p.tpl === 'hanjin');
    if (open && open.tplScene) return open.tplScene;
  } catch (e) {}
  const v = localStorage.getItem('wemb-hanjin-screen');
  return HJ_SCREENS[v] ? v : 'main';
};
window.__openHanjinScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'hanjin'); } catch (e) {}
  applyHanjinDT(HJ_SCREENS[which] ? which : 'main');
};

/* 헤더 메뉴(대시보드 / 통합관제 / 드롭다운 항목)의 화면 이동은 hanjin-live.js 의 installMenu 가
   맡는다 — 낱장으로 열었을 때도 같게 움직여야 해서 시안 쪽 코드에 두었다.
   여기서는 그쪽이 부르는 window.__openHanjinScreen 만 내어 준다. */

/* 한진 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 자신의 브랜드 파랑으로 놓는다.
   이 시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedHanjinBaseColor() {
  try {
    if (localStorage.getItem('wemb-hanjin-seeded')) return;
    localStorage.setItem('wemb-hanjin-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = HJ_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
