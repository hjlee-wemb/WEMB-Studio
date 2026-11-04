/* ── 공장 전력설비 디지털 트윈 템플릿 연결 ── */

/* ── Digital Twin: Plant Power Facility — Figma 화면 한 장을 순수 HTML/CSS DOM 으로 재구축한 것을 얹는다 ──
   원본: Figma hHans6kNFlTP98CO1O431o (page "Dark-시안01")
     · Screen/Facility Overview 1:2 → src/plant-overview.js (.pfo-root)
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN · 시계만 원본 글꼴 Tomorrow), 아이콘·그래픽만 Figma 가 내보낸 개별 svg/png(src/plant/).
   원본이 다크 시안이라 라이트 시트를 함께 두어 '화면 테마'로 자유롭게 바꾼다.
   인터랙션·라이브·반응형·차트 바꾸기·패널 옮기기는 src/plant-live.js(window.initPlant). */
const PF_ROOTS = '.pfo-root';
/* 시안 자신의 주조색 — 패널 테두리 · 빛의 하늘 파랑(#48B0E5). '색 정하기'의 시작값 */
const PF_SEED = '#48B0E5';

function applyPlantDT() {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  /* 화면 모듈은 필요할 때 싣는다(js/core/tpl-modules.js) — 아직이면 싣고 나서 다시 그린다 */
  if (window.WEMB && WEMB.tplModules && WEMB.tplModules.wait(['build_pfo'], () => applyPlantDT())) return;
  if (typeof window.build_pfo !== 'function') return;
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/plant-live.js 의 installFit) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  stage.setAttribute('data-tpl', 'plant');
  try { syncSkxControls(); } catch (e) {}
  seedPlantBaseColor();
  try {
    const want = localStorage.getItem('wemb-plant-mode') === 'light' ? 'light' : 'dark';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = '공장 전력설비 — 설비현황';
  stage.querySelectorAll(PF_ROOTS).forEach((e) => {
    try { window.disposePlant && window.disposePlant(e); } catch (err) {}
    e.remove();
  });
  /* 시트 id = 'pfo-style' · 'pfo-light-style' (색 바꾸기가 이 id 로 시트를 찾는다) */
  [['PFO_CSS', 'pfo-style'], ['PFO_LIGHT_CSS', 'pfo-light-style']].forEach(function (a) {
    if (!window[a[0]] || document.getElementById(a[1])) return;
    const st = document.createElement('style');
    st.id = a[1];
    st.textContent = window[a[0]];
    document.head.appendChild(st);
  });
  const scr = document.createElement('div');
  scr.className = 'pfo-root';
  scr.dataset.theme = (typeof state !== 'undefined' && state.mode === 'light') ? 'light' : 'dark';
  scr.innerHTML = window.build_pfo();
  const added = document.createElement('div');
  added.className = 'dt-added';
  added.innerHTML = '<div class="cols gridmode"></div>';
  scr.appendChild(added);
  stage.appendChild(scr);
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  try { window.initPlant && window.initPlant(scr); } catch (e) {}
  /* 라이브가 시계 · 경보 일시를 지금으로 다시 찍은 **뒤에** 기본값을 캡처해야
     새 시각이 기본값이 되고, 사용자가 고친 글자는 캡처가 덮어 준다. */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
  try { window.__applyTplTint && window.__applyTplTint(); } catch (e) {}
}
window.__applyPlantDT = applyPlantDT;

function clearPlantDT() {
  document.querySelectorAll('#dtStage ' + PF_ROOTS).forEach((e) => {
    try { window.disposePlant && window.disposePlant(e); } catch (err) {}
    e.remove();
  });
}
window.__clearPlantDT = clearPlantDT;

WEMB.screenSwitch.register('plant', { sceneOf: () => 'overview', draw: applyPlantDT, builds: () => ['build_pfo'] });

/* 이 시안의 '기본 색' — 처음 열 때 '색 정하기'의 시작값을 시안 주조색으로 놓는다.
   시드가 그대로인 동안은 TPLTINT 가 '아직 안 바꿨다'로 보고 원본 색을 그대로 보여 준다. */
function seedPlantBaseColor() {
  try {
    if (localStorage.getItem('wemb-plant-seeded')) return;
    localStorage.setItem('wemb-plant-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = PF_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}
