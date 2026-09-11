/* ── SK하이닉스 이천 템플릿 연결 · 1920 캔버스 맞춤 ── */

/* ── 1920x1080 캔버스 배율 맞추기 — 남는 공간에 통째로 들어가도록 scale 계산 ── */
function fitCanvas1920() {
  const main = document.querySelector('.main');
  if (!main) return;
  if (!main.classList.contains('canvas1920')) { main.style.removeProperty('--canvas-scale'); return; }
  const w = main.clientWidth, h = main.clientHeight;
  if (!w || !h) return;
  const sc = Math.min(w / 1920, h / 1080);
  main.style.setProperty('--canvas-scale', String(sc > 0 ? sc : 1));
}
window.__fitCanvas1920 = fitCanvas1920;
/* ── SK하이닉스 팝업 시안(UPS 전력) — Figma 64:2504 를 HTML/CSS 로 재구축한 화면을 스테이지에 얹는다 ── */
/* ── UPS 전력 상세 팝업 시안 반응형 — 메인 시안과 같은 방식(캔버스 넓히기) ──
   .skxp-canvas 는 1920×1080 고정 상자다. 균일 배율 S 로만 키우고(왜곡 0), 캔버스를
   작업 영역 비율만큼 넓혀(VW×VH) 여백을 없앤 뒤, 배경·헤더 바는 새 폭까지 늘리고
   모달은 늘어난 만큼의 절반을 옮겨 가운데를 지킨다. 16:9 면 늘어난 몫이 0 이라 원본 그대로. */
const SKXP_BASE_W = 1920, SKXP_BASE_H = 1080;
function skxpFitResponsive(scr) {
  const canvas = scr && scr.querySelector('.skxp-canvas');
  if (!canvas) return;
  const W = scr.clientWidth, H = scr.clientHeight;
  if (!W || !H) return;
  const S = Math.min(W / SKXP_BASE_W, H / SKXP_BASE_H);   /* 균일 배율 — 원이 타원이 되지 않는다 */
  const VW = W / S, VH = H / S;                           /* 디자인 단위로 환산한 캔버스 = 영역을 정확히 덮는다 */
  const dW = VW - SKXP_BASE_W, dH = VH - SKXP_BASE_H;     /* 둘 중 하나는 0 */
  canvas.style.width = VW + 'px';
  canvas.style.height = VH + 'px';
  canvas.style.transform = 'scale(' + S + ')';
  /* 배경 판은 캔버스 전체를 덮고, 헤더 바는 폭만 따라간다 */
  const bg = canvas.querySelector('.skxp-Background'), base = canvas.querySelector('.skxp-Base');
  [bg, base].forEach(function (el) { if (el) { el.style.width = VW + 'px'; el.style.height = VH + 'px'; } });
  const glow = canvas.querySelector('.skxp-Gradient-Glow'), hdr = canvas.querySelector('.skxp-Header-Top');
  [glow, hdr].forEach(function (el) { if (el) el.style.width = VW + 'px'; });
  /* 모달은 원본에서도 화면 한가운데다 — 늘어난 몫의 절반만 옮기면 가운데가 유지된다.
     (left 는 이미 50% 기준이라 폭만, top 은 실제 px 이라 높이만 더한다) */
  const modal = canvas.querySelector('.skxp-Modal');
  if (modal) {
    if (modal.__t == null) modal.__t = parseFloat(getComputedStyle(modal).top) || 0;
    modal.style.left = VW / 2 + 'px';
    modal.style.top = modal.__t + dH / 2 + 'px';
  }
}
window.__skxpFitResponsive = skxpFitResponsive;
function skxpWatchResize(scr) {
  if (scr.__skxpRo) scr.__skxpRo.disconnect();
  const run = function () { skxpFitResponsive(scr); };
  try { if (typeof ResizeObserver === 'function') { scr.__skxpRo = new ResizeObserver(run); scr.__skxpRo.observe(scr); } } catch (e) {}
  run();
}
function applySkhynixPopup() {
  const stage = document.getElementById('dtStage');
  if (!stage || typeof window.buildSkhynixPopup !== 'function') return;
  /* 고정 캔버스는 끈다 — 아래 skxpFitResponsive 가 여백 없이 채운다 */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  if (!document.getElementById('skxp-style') && window.SKHYNIX_POPUP_CSS) {
    const st = document.createElement('style');
    st.id = 'skxp-style';
    st.textContent = window.SKHYNIX_POPUP_CSS;
    document.head.appendChild(st);
  }
  let scr = stage.querySelector('.skxp-root');
  if (scr) scr.remove();
  scr = document.createElement('div');
  scr.className = 'skxp-root';
  scr.innerHTML = window.buildSkhynixPopup();
  setTimeout(() => { try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {} }, 0); /* 팝업 시안도 테마 색조 반영 */
  stage.appendChild(scr);
  /* 패널편집 — 팝업의 주요 블록도 '끌어서 이동'할 수 있게 DT 패널로 등록한다.
     (#dtStage 에 걸린 포인터 드래그가 .dt-drag 를 잡으므로 클래스와 data-did 만 부여하면 된다) */
  [['.skxp-Modal', 'pop-modal'], ['.skxp-UPS-Model', 'pop-ups'], ['.skxp-Floor-Layout', 'pop-floor'],
   ['.skxp-Event-List', 'pop-events'], ['.skxp-Count-Group', 'pop-counts'], ['.skxp-Title-Tab', 'pop-tab']]
    .forEach(function (pair) {
      const el = scr.querySelector(pair[0]);
      if (el) { el.classList.add('dt-drag'); el.dataset.did = pair[1]; }
    });
  /* 저장된 이동 위치가 있으면 되살린다(DT 배치 저장과 동일한 키를 쓴다) */
  try {
    const saved = JSON.parse(localStorage.getItem('wemb-dt-layout') || '{}');
    scr.querySelectorAll('.dt-drag').forEach(function (el) {
      const o = saved[el.dataset.did];
      if (o) el.style.transform = 'translate(' + o[0] + 'px,' + o[1] + 'px)';
    });
  } catch (e) {}
  try { skxpWatchResize(scr); } catch (e) {} /* 작업 영역에 맞춰 여백 없이 채운다 */
  /* 글자 편집 대상 다시 수집 — 팝업의 .skxp-txt 들이 편집 가능해진다 */
  try { if (window.__dtRecaptureDefaults) window.__dtRecaptureDefaults(false); } catch (e) {}
  /* 닫기 버튼 → 팝업을 닫고 메인 시안으로 돌아간다 */
  const cb = scr.querySelector('.skxp-Close-Button');
  if (cb) cb.addEventListener('click', function (ev) {
    ev.preventDefault(); ev.stopPropagation();
    try { window.__openSkxScreen && window.__openSkxScreen('main'); } catch (e) {}
    if (typeof toast === 'function') toast('메인 화면으로 돌아왔어요.', { type: 'info' });
  });
}
window.__applySkhynixPopup = applySkhynixPopup;

/* ── SK하이닉스 이천 FMS Hub 시안 — Figma 64:3367("Screen/FMS Hub", Light-시안02)를
   순수 HTML/CSS DOM 으로 재구축한 화면(src/skhynix-hub.js)을 스테이지에 얹는다.
   글자는 전부 편집 가능한 실제 텍스트(Pretendard CDN), 아이콘·그래픽만 Figma 가 내보낸
   개별 svg/png(src/skhynix-hub/)를 그대로 쓴다. 좌표·크기·색은 Figma 값 그대로. ── */
function applySkhynixHub() {
  const stage = document.getElementById('dtStage');
  if (!stage || typeof window.buildSkhynixHub !== 'function') return;
  /* 고정 캔버스는 끈다 — 이 시안은 스스로 여백 없이 채운다(src/skhynix-hub-live.js 의 relayout).
     1920x1080 기준을 유지한 채 캔버스만 작업 영역 비율만큼 넓히고 블록을 가장자리에 다시 붙이므로,
     잘림도 왜곡도 없다. 정확히 16:9 면 Figma 원본과 픽셀 동일. */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  /* 원본이 Light 시안(Figma "Light-시안02")이라 처음 열 때는 Light 로 시작한다.
     그 뒤로는 '화면 테마'에서 고른 값(wemb-skh-mode)을 그대로 되살린다 — 다크 시트를
     함께 만들어 두었으므로 이 화면도 자유롭게 전환된다. */
  seedIcheonBaseColor(); /* 시안 색을 '색 정하기' 시작값으로 */
  try {
    const want = localStorage.getItem('wemb-skh-mode') === 'dark' ? 'dark' : 'light';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = 'SK하이닉스 이천 FMS';
  /* 다른 SK하이닉스 시안(메인 SVG·UPS 팝업)이 떠 있으면 치운다 */
  try { if (window.__clearSkhynixPopup) window.__clearSkhynixPopup(); } catch (e) {}
  stage.querySelectorAll('.skx-screen').forEach((e) => e.remove());
  /* 화면 CSS 1회 주입 */
  if (!document.getElementById('skh-style') && window.SKHYNIX_HUB_CSS) {
    const st = document.createElement('style');
    st.id = 'skh-style';
    st.textContent = window.SKHYNIX_HUB_CSS;
    document.head.appendChild(st);
  }
  /* 다크 시트는 화면 CSS 뒤에 깔려야 오버라이드가 먹는다 */
  if (!document.getElementById('skh-dark-style') && window.SKHYNIX_HUB_DARK_CSS) {
    const sd = document.createElement('style');
    sd.id = 'skh-dark-style';
    sd.textContent = window.SKHYNIX_HUB_DARK_CSS;
    document.head.appendChild(sd);
  }
  let scr = stage.querySelector('.skh-root');
  if (scr) scr.remove();
  scr = document.createElement('div');
  scr.className = 'skh-root';
  scr.dataset.theme = (state && state.mode === 'dark') ? 'dark' : 'light';
  scr.innerHTML = window.buildSkhynixHub();
  /* '패널 추가'로 넣는 패널이 얹힐 영역 — 시안 위 같은 레이어에 둔다 */
  if (!scr.querySelector('.dt-added')) {
    const added = document.createElement('div');
    added.className = 'dt-added';
    added.innerHTML = '<div class="cols gridmode"></div>';
    scr.appendChild(added);
  }
  stage.appendChild(scr);
  /* 시안의 주요 블록도 '끌어서 이동' 가능하게 DT 패널로 등록(UPS 팝업 시안과 같은 방식).
     Event List 는 제외한다 — 접기/펴기가 transform 을 쓰는데 드래그가 인라인 transform 으로 덮어써 버린다. */
  [['[data-node-id="64:3397"]', 'hub-ups'], ['[data-node-id="64:3483"]', 'hub-saturation'],
   ['[data-node-id="64:3571"]', 'hub-centertemp'], ['[data-node-id="64:3674"]', 'hub-containment'],
   ['[data-node-id="64:3737"]', 'hub-nav']]
    .forEach(function (pair) {
      const el = scr.querySelector(pair[0]);
      if (el) { el.classList.add('dt-drag'); el.dataset.did = pair[1]; }
    });
  try {
    const saved = JSON.parse(localStorage.getItem('wemb-dt-layout') || '{}');
    scr.querySelectorAll('.dt-drag').forEach(function (el) {
      const o = saved[el.dataset.did];
      if (o && (o.dx || o.dy)) el.style.transform = (el.style.transform || '') + ' translate(' + (o.dx || 0) + 'px,' + (o.dy || 0) + 'px)';
    });
  } catch (e) {}
  try { syncSkxControls(); } catch (e) {} /* 이 시안도 버전 구분이 없다 */
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  /* 인터랙션·라이브 데이터(접기/펴기·실시간 시계·호버·차트) + 반응형 배치 — src/skhynix-hub-live.js */
  try { window.initSkhynixHub && window.initSkhynixHub(scr); } catch (e) {}
  /* 상세 화면으로 가는 길 — 눈에 보이는 '항온항습기 상세 →' 버튼과,
     내비 심볼 '항온항습기' 클릭(그림은 그대로, 커서·툴팁만 붙는다) 두 가지 */
  try { addIcheonForwardButton(scr); } catch (e) {}
  try { addIcheonDetailLink(scr); } catch (e) {}
  /* '패널편집'(내용 수정)이 이 화면의 글자도 잡도록 편집 대상을 다시 수집한다(저장해 둔 수정분도 여기서 되살아난다) */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
}
window.__applySkhynixHub = applySkhynixHub;
function clearSkhynixHub() {
  document.querySelectorAll('#dtStage .skh-root').forEach((e) => e.remove());
}
window.__clearSkhynixHub = clearSkhynixHub;

/* ── SK하이닉스 이천 FMS — Screen/HVAC Detail(항온항습기 상세) ──
   Icheon main 프로젝트의 두 번째 화면. Figma 64:4059 를 순수 HTML/CSS DOM 으로 재구축한
   src/skhynix-hvac.js 를 스테이지에 얹는다(글자는 편집 가능한 실제 텍스트, 아이콘·이미지만 원본 에셋).
   라이트가 원본이지만 다크 시트(SKHYNIX_HVAC_DARK_CSS)를 함께 깔아 '화면 테마'로 자유롭게 전환된다. */
function applySkhynixHvac() {
  const stage = document.getElementById('dtStage');
  if (!stage || typeof window.buildSkhynixHvac !== 'function') return;
  /* 메인(FMS Hub)과 같이 고정 캔버스를 끄고 시안이 스스로 채우게 둔다(src/skhynix-hvac-live.js) */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  /* 원본이 Light 시안(Figma "Light-시안02")이라 처음 열 때는 Light 로 시작한다.
     그 뒤로는 '화면 테마'에서 고른 값(wemb-skv-mode)을 그대로 되살린다 — 다크도 지원하는 화면이라
     메인(FMS Hub)처럼 Light 로 못박지 않는다. */
  seedIcheonBaseColor(); /* 시안 색을 '색 정하기' 시작값으로 */
  try {
    const want = localStorage.getItem('wemb-skv-mode') === 'dark' ? 'dark' : 'light';
    if (typeof state !== 'undefined' && state.mode !== want) {
      state.mode = want;
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === want));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = 'SK하이닉스 이천 FMS';
  /* 다른 SK하이닉스 시안이 떠 있으면 치운다 */
  try { if (window.__clearSkhynixPopup) window.__clearSkhynixPopup(); } catch (e) {}
  try { if (window.__clearSkhynixHub) window.__clearSkhynixHub(); } catch (e) {}
  stage.querySelectorAll('.skx-screen').forEach((e) => e.remove());
  /* 화면 CSS + 다크 시트 1회 주입(다크가 뒤에 와야 오버라이드가 먹는다) */
  if (!document.getElementById('skv-style') && window.SKHYNIX_HVAC_CSS) {
    const st = document.createElement('style');
    st.id = 'skv-style';
    st.textContent = window.SKHYNIX_HVAC_CSS;
    document.head.appendChild(st);
  }
  if (!document.getElementById('skv-dark-style') && window.SKHYNIX_HVAC_DARK_CSS) {
    const sd = document.createElement('style');
    sd.id = 'skv-dark-style';
    sd.textContent = window.SKHYNIX_HVAC_DARK_CSS;
    document.head.appendChild(sd);
  }
  let scr = stage.querySelector('.skv-root');
  if (scr) scr.remove();
  scr = document.createElement('div');
  scr.className = 'skv-root';
  scr.dataset.theme = (state && state.mode === 'dark') ? 'dark' : 'light';
  scr.innerHTML = window.buildSkhynixHvac();
  /* '패널 추가'로 넣는 패널이 얹힐 영역 */
  if (!scr.querySelector('.dt-added')) {
    const added = document.createElement('div');
    added.className = 'dt-added';
    added.innerHTML = '<div class="cols gridmode"></div>';
    scr.appendChild(added);
  }
  stage.appendChild(scr);
  /* 시안의 주요 블록을 '끌어서 이동' 가능한 DT 패널로 등록.
     Event List(64:4370)는 제외한다 — 접기/펴기가 높이를 다루는데 드래그가 겹치면 어긋난다. */
  [['[data-node-id="64:4185"]', 'hvac-trend'], ['[data-node-id="64:4237"]', 'hvac-center'],
   ['[data-node-id="113:294"]', 'hvac-toolbar'], ['[data-node-id="113:291"]', 'hvac-callouts']]
    .forEach(function (pair) {
      const el = scr.querySelector(pair[0]);
      if (el) { el.classList.add('dt-drag'); el.dataset.did = pair[1]; }
    });
  try {
    const saved = JSON.parse(localStorage.getItem('wemb-dt-layout') || '{}');
    scr.querySelectorAll('.dt-drag').forEach(function (el) {
      const o = saved[el.dataset.did];
      if (o && (o.dx || o.dy)) el.style.transform = (el.style.transform || '') + ' translate(' + (o.dx || 0) + 'px,' + (o.dy || 0) + 'px)';
    });
  } catch (e) {}
  try { syncSkxControls(); } catch (e) {}
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {}
  /* 인터랙션·라이브 데이터(접기/펴기·실시간 시계·호버·차트) + 반응형 배치 */
  try { window.initSkhynixHvac && window.initSkhynixHvac(scr); } catch (e) {}
  /* 시안 위에 '← 메인으로' 버튼(원본에 없던 요소 — 스튜디오에서만 얹는다) */
  try { addIcheonBackButton(scr); } catch (e) {}
  /* '패널편집'(내용 수정)이 이 화면의 글자도 잡도록 편집 대상을 다시 수집한다 */
  try { window.__dtRecaptureDefaults && window.__dtRecaptureDefaults(false); } catch (e) {}
}
window.__applySkhynixHvac = applySkhynixHvac;
function clearSkhynixHvac() {
  document.querySelectorAll('#dtStage .skv-root').forEach((e) => e.remove());
}
window.__clearSkhynixHvac = clearSkhynixHvac;

/* ── 이천 FMS 시안의 '기본 색' ──
   템플릿을 처음 열면 '색 정하기'의 시작값을 시안 자신의 브랜드 색으로 놓는다. 그래야
   업로드한 시안이 원래 색 그대로 보이고, 색 팔레트 UI 도 그 색에서 출발한다.
   이 시드가 그대로인 동안은 TPLTINT.icheonTint 가 '아직 안 바꿨다'로 보고 다시 칠하지 않는다 —
   사용자가 색을 바꾸는 순간부터 팔레트가 따라온다. */
function seedIcheonBaseColor() {
  try {
    if (localStorage.getItem('wemb-icheon-seeded')) return;
    localStorage.setItem('wemb-icheon-seeded', '1');
    if (typeof state === 'undefined') return;
    state.source = 'seed';
    state.sourceView = 'seed';
    state.seed = TPLTINT.ICHEON_SEED;
    state.overrides = {};
    if (typeof apply === 'function') apply();
  } catch (e) {}
}

/* ── 두 화면을 화면 안에서 오가는 길 ──
   상세 → 메인 : 시안 위에 '← 메인으로' 알약 버튼을 얹는다(제목 옆 빈 자리, 원본에 없던 요소).
   메인 → 상세 : 이미 있는 내비 심볼 '항온항습기'(64:3790)를 누르면 열린다(새로 그리는 것 없음).
   둘 다 스튜디오에서만 붙인다 — 단독 미리보기(preview.html)는 Figma 원본 그대로 둔다. */
function icheonSceneCss() {
  if (document.getElementById('icheon-link-style')) return;
  const st = document.createElement('style');
  st.id = 'icheon-link-style';
  /* ⚠ 두 시안의 화면 CSS 에는 `.skh-root *` / `.skv-root *` 초기화(배경·글꼴·색·여백 제거)가 있다.
     이 시트가 나중에 깔리면 같은 특이도(0,1,0)라 버튼 스타일이 통째로 지워진다
     (실제로 메인 → 상세 순서로 열면 상세의 '메인으로' 버튼이 민무늬 글자가 됐다).
     그래서 모든 규칙을 두 루트 아래로 한 단계 더 감싸 특이도를 (0,2,x)로 올린다. */
  const R = (sel) => '.skh-root ' + sel + ',.skv-root ' + sel;
  st.textContent = [
    /* 시안의 알약 언어(반투명 흰 판 + 흰 테두리 + Pretendard SemiBold)를 그대로 따랐다 */
    R('.icheon-navbtn') + '{position:absolute;top:90px;z-index:25;display:flex;align-items:center;gap:6px;',
    'height:32px;padding:0 16px;border-radius:100px;border:1.5px solid rgba(255,255,255,.9);',
    'background:rgba(255,255,255,.72);box-shadow:0 2px 6px rgba(82,76,194,.16);',
    'font-family:"Pretendard Variable","Pretendard","Malgun Gothic",system-ui,sans-serif;',
    'font-size:13px;font-weight:600;color:#3a3679;cursor:pointer;white-space:nowrap;',
    'transition:background-color .18s cubic-bezier(.4,0,.2,1),transform .18s cubic-bezier(.4,0,.2,1),box-shadow .18s cubic-bezier(.4,0,.2,1);}',
    R('.icheon-navbtn:hover') + '{background:rgba(255,255,255,.95);box-shadow:0 6px 14px rgba(82,76,194,.24);}',
    R('.icheon-navbtn:focus-visible') + '{outline:2px solid #7b78ff;outline-offset:3px;}',
    R('.icheon-navbtn i') + '{font-style:normal;font-size:15px;line-height:1;transition:transform .18s cubic-bezier(.4,0,.2,1);}',
    R('.icheon-navbtn span') + '{font:inherit;color:inherit;}',
    R('.icheon-navbtn:hover') + '{transform:translateY(-1px);}',
    R('.icheon-navbtn:active') + '{transform:translateY(0) scale(.96);}',
    /* 두 버튼은 같은 자리(왼쪽 위 제목 옆)에 같은 모양으로 둔다 — 화면을 오갈 때 눈이 따라가기 쉽게.
       제목 길이만 달라서(상세 '항온항습기' 87px · 메인 '센터 UPS 전력' 118px) x 만 다르다. */
    R('.icheon-back') + '{left:158px;}',
    R('.icheon-back:hover i') + '{transform:translateX(-3px);}',
    R('.icheon-fwd') + '{left:176px;}',
    R('.icheon-fwd:hover i') + '{transform:translateX(3px);}',
    /* 다크 — 시안의 다크 패널과 같은 톤 */
    '.skh-root[data-theme="dark"] .icheon-navbtn,.skv-root[data-theme="dark"] .icheon-navbtn{',
    'background:rgba(28,33,54,.82);border-color:rgba(255,255,255,.18);color:#c9c7ff;box-shadow:0 2px 8px rgba(0,0,0,.45);}',
    '.skh-root[data-theme="dark"] .icheon-navbtn:hover,.skv-root[data-theme="dark"] .icheon-navbtn:hover{background:rgba(38,44,72,.92);}',
    /* 메인의 내비 심볼 '항온항습기' — 누를 수 있다는 것만 알린다(그림은 그대로) */
    R('.icheon-openable') + '{cursor:pointer;}',
  ].join('');
  document.head.appendChild(st);
}
/* 시안 위에 화면 이동 버튼을 얹는다(원본에 없던 요소 — 스튜디오에서만) */
function addIcheonNavButton(scr, opt) {
  icheonSceneCss();
  const screen = scr.querySelector('[data-node-id="' + opt.screenNode + '"]') || scr;
  if (screen.querySelector('.' + opt.cls)) return;
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'icheon-navbtn ' + opt.cls;
  b.title = opt.title;
  b.innerHTML = opt.arrowFirst
    ? '<i>' + opt.arrow + '</i><span>' + opt.label + '</span>'
    : '<span>' + opt.label + '</span><i>' + opt.arrow + '</i>';
  b.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    try { window.__openHubScreen && window.__openHubScreen(opt.to); } catch (err) {}
    if (typeof toast === 'function') toast(opt.toast, { type: 'info' });
  });
  screen.appendChild(b);
}
/* 상세 화면 위 '← 메인으로' */
function addIcheonBackButton(scr) {
  addIcheonNavButton(scr, {
    screenNode: '64:4059', cls: 'icheon-back', to: 'main', arrow: '←', arrowFirst: true,
    label: '메인으로', title: '메인 화면(FMS Hub)으로 돌아가기', toast: '메인 화면으로 돌아왔어요.',
  });
}
/* 메인 화면 위 '항온항습기 상세 →' */
function addIcheonForwardButton(scr) {
  addIcheonNavButton(scr, {
    screenNode: '64:3367', cls: 'icheon-fwd', to: 'hvac', arrow: '→', arrowFirst: false,
    label: '항온항습기 상세', title: '항온항습기 상세 화면 열기', toast: '항온항습기 상세 화면을 열었어요.',
  });
}
/* 메인 화면의 '항온항습기' 심볼 → 상세 화면 */
function addIcheonDetailLink(scr) {
  icheonSceneCss();
  const sym = scr.querySelector('[data-node-id="64:3790"]');
  if (!sym || sym.dataset.icheonLinked) return;
  sym.dataset.icheonLinked = '1';
  sym.classList.add('icheon-openable');
  sym.setAttribute('role', 'button');
  sym.setAttribute('tabindex', '0');
  sym.setAttribute('title', '항온항습기 상세 화면 열기');
  const go = function (e) {
    if (e.target && e.target.closest && e.target.closest('[contenteditable="true"]')) return;
    e.preventDefault(); e.stopPropagation();
    try { window.__openHubScreen && window.__openHubScreen('hvac'); } catch (err) {}
    if (typeof toast === 'function') toast('항온항습기 상세 화면을 열었어요.', { type: 'info' });
  };
  sym.addEventListener('click', go);
  sym.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') go(e); });
}

/* Icheon main 프로젝트의 두 화면(메인 = FMS Hub, 항온항습기 상세 = HVAC Detail) 전환.
   '지금 보고 있는 장면'은 wemb-hub-screen 에 남기지만, 화면 이름의 정답은 프로젝트 기록의 tplScene 이다
   (skhynix 시안에서 겪은 것과 같은 어긋남을 막는다). */
window.__hubSceneOfScreen = function () {
  try {
    const id = localStorage.getItem('wemb-current-proj');
    const p = (JSON.parse(localStorage.getItem('wemb-projects') || '[]') || []).find((x) => x && x.id === id);
    if (p && p.tpl === 'skhynix-hub') return p.tplScene === 'hvac' ? 'hvac' : 'main';
  } catch (e) {}
  return localStorage.getItem('wemb-hub-screen') === 'hvac' ? 'hvac' : 'main';
};
window.__openHubScreen = function (which) {
  const hvac = which === 'hvac';
  try { localStorage.setItem('wemb-tpl-dt', 'skhynix-hub'); localStorage.setItem('wemb-hub-screen', hvac ? 'hvac' : 'main'); } catch (e) {}
  if (hvac) { clearSkhynixHub(); applySkhynixHvac(); }
  else { clearSkhynixHvac(); applySkhynixHub(); }
};
function clearSkhynixPopup() {
  document.querySelectorAll('#dtStage .skxp-root').forEach((e) => e.remove());
}
window.__clearSkhynixPopup = clearSkhynixPopup;
/* 이 '화면'이 원래 어떤 장면인지 — 정답은 프로젝트 기록의 tplScene 이다.
   (메인 화면 = tplScene 없음, 'UPS 전력 상세' 화면 = 'popup')
   전역 wemb-skx-screen 은 '지금 보고 있는 장면'일 뿐이라, 메인에서 핫스팟으로 팝업을 열어 두거나
   팝업에서 ✕로 메인을 띄운 채 새로고침하면 화면 이름과 그려지는 시안이 어긋났다
   (‘UPS 전력 상세’ 화면인데 메인이 뜨는 식). 복원할 때는 프로젝트 기록을 먼저 본다. */
window.__skxSceneOfScreen = function () {
  try {
    const id = localStorage.getItem('wemb-current-proj');
    const p = (JSON.parse(localStorage.getItem('wemb-projects') || '[]') || []).find((x) => x && x.id === id);
    if (p && p.tpl === 'skhynix') return p.tplScene === 'popup' ? 'popup' : 'main';
  } catch (e) {}
  return localStorage.getItem('wemb-skx-screen') === 'popup' ? 'popup' : 'main';
};
/* 메인/팝업 두 화면을 전환한다 — 프로젝트 안의 '화면'으로 각각 열린다 */
window.__openSkxScreen = function (which) {
  try { localStorage.setItem('wemb-tpl-dt', 'skhynix'); localStorage.setItem('wemb-skx-screen', which === 'popup' ? 'popup' : 'main'); } catch (e) {}
  if (which === 'popup') {
    document.querySelectorAll('#dtStage .skx-screen').forEach((e) => (e.style.display = 'none'));
    applySkhynixPopup();
  } else {
    clearSkhynixPopup();
    document.querySelectorAll('#dtStage .skx-screen').forEach((e) => (e.style.display = ''));
    if (typeof applySkhynixDT === 'function' && !document.querySelector('#dtStage .skx-screen')) applySkhynixDT();
  }
};
/* ── 1920x1080 고정 캔버스 켜기/끄기 ──
   고정 캔버스는 '요청한 화면'에서만 쓴다. 예전엔 .main 에 클래스를 그냥 걸어 뒀는데,
   하이닉스 시안(디지털 트윈)을 보다가 대시보드 화면으로 넘어가면 대시보드까지 1920x1080
   으로 묶여 작업 영역을 다 못 쓰고 축소된 채 열렸다. → 어느 화면이 요청했는지 기억해 두고
   화면이 바뀔 때마다 다시 판정한다(applyScreen → __syncCanvas1920). */
let canvasWant = null; /* { screen: 'dash' | 'dt' } | null */
function syncCanvas1920() {
  const main = document.querySelector('.main');
  if (!main) return;
  const cur = (typeof state !== 'undefined' && state.screen) || 'dash';
  main.classList.toggle('canvas1920', !!canvasWant && canvasWant.screen === cur);
  fitCanvas1920();
}
function setCanvas1920(on, scope) {
  canvasWant = on ? { screen: scope || (typeof state !== 'undefined' && state.screen) || 'dt' } : null;
  syncCanvas1920();
}
window.__setCanvas1920 = setCanvas1920;
window.__syncCanvas1920 = syncCanvas1920;
window.addEventListener('resize', fitCanvas1920);
try { if (typeof ResizeObserver === 'function') { const mo = document.querySelector('.main'); if (mo) new ResizeObserver(fitCanvas1920).observe(mo); } } catch (e) {}
window.__clearImageTemplate = clearImageTemplate;

/* ── SK하이닉스 화면 반응형 — 1920×1080 기준을 지키면서 여백 없이 꽉 채운다 ──
   시안(Figma 64:1782)은 1920×1080 인데 작업 영역이 정확히 16:9 인 경우는 거의 없다
   (스튜디오 기본 창에서 1248×852 = 1.465). 여기서 고를 수 있는 길은 셋뿐이다:
     · 통짜 균일 축소  → 왜곡은 없지만 위아래에 150px 넘는 여백이 남는다
     · 늘려서 채우기   → 여백은 없지만 내비 심볼·도넛이 타원이 된다
     · 캔버스 넓히기   → 여백도 왜곡도 없다  ← 이걸 쓴다
   좌표계는 1920×1080 그대로 두고 viewBox 만 작업 영역 비율만큼 넓힌 뒤, 최상위 블록을
   제 가장자리(위·아래·좌·우)에 다시 붙인다. 글자·위젯은 균일 배율로만 커지므로 왜곡이 0 이고,
   작업 영역이 정확히 16:9 면 늘어난 몫이 0 이라 Figma 원본과 픽셀 단위로 같은 그림이 된다.
   (FMS Hub·항온항습기 상세 시안이 src/skhynix-*-live.js 에서 쓰는 방식과 같다) */
const SKX_BASE_W = 1920, SKX_BASE_H = 1080;
/* 블록이 붙는 자리 — 추측하지 않고 Figma 원본 안에서의 위치로 정한 표.
     x: left(왼쪽 고정) · right(오른쪽 따라감) · stretch(판을 늘리고 안쪽 부품을 다시 붙임)
     y: top(위 고정) · middle(늘어난 만큼 절반 내림) · bottom(아래 따라감) · stretch(판을 늘림)
   표에 없는 블록은 손대지 않는다(= 좌상단 고정). */
const SKX_ANCHORS = {
  'skx-Background': { x: 'stretch', y: 'stretch' },   /* 3D 렌더 바닥판 · 상단 글로우 */
  'skx-Header_2': { x: 'stretch', y: 'top' },         /* 헤더 바 — 로고 왼쪽, 시계·액션 오른쪽 */
  'skx-Building Map': { x: 'left', y: 'top' },        /* 좌상단 건물 썸네일 + 층 선택 */
  'skx-Sidebar': { x: 'left', y: 'middle' },          /* 왼쪽 내비 레일(원본에서도 세로 가운데) */
  'skx-Metrics': { x: 'right', y: 'middle' },         /* 오른쪽 지표 패널 3개 */
  'skx-Ticker': { x: 'left', y: 'bottom' },           /* 하단 알림 티커 */
  'skx-Event List': { x: 'stretch', y: 'bottom' },    /* 하단 이벤트 목록 */
};
/* 블록을 옮길 때 쓰는 전용 래퍼 — 원본 그룹에 transform 을 직접 걸면 Figma 가 넣어 둔
   transform 과 겹치고, 크기가 바뀔 때마다 값이 누적돼 블록이 화면 밖으로 밀려난다. */
function skxAnchorWrap(el) {
  const par = el.parentNode;
  if (par && par.dataset && par.dataset.skxAnchor) return par;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.dataset.skxAnchor = '1';
  par.insertBefore(g, el);
  g.appendChild(el);
  return g;
}
/* 블록의 원래 자리는 한 번만 재서 기억한다 */
function skxBox(el) {
  if (el.__skxBox) return el.__skxBox;
  let b = null;
  try { b = el.getBBox(); } catch (e) {}
  if (!b || (!b.width && !b.height)) return null;
  el.__skxBox = { x: b.x, y: b.y, w: b.width, h: b.height };
  return el.__skxBox;
}
/* 화면 폭·높이를 거의 다 덮는 판(rect·image)만 늘어난 캔버스에 맞춰 다시 그린다.
   **자손까지 훑는다** — Figma export 는 바 배경을 g 여러 겹 안에 넣어 두는데(이벤트 목록의
   Panel > 배경 rect), 직속 자식만 보면 판이 안 늘어나 바가 원래 폭 그대로 남는다.
   g 는 폭을 줄 수 없으니(scale 은 글자를 늘린다) 늘릴 수 있는 건 rect·image 뿐이다.
   원본 크기를 따로 들고 있어야 한다 — 현재값에 더하면 리사이즈마다 누적된다. */
function skxStretchPlates(host, dW, dH) {
  [...host.querySelectorAll('rect, image')].forEach((r) => {
    if (r.__skxW == null) { r.__skxW = +r.getAttribute('width') || 0; r.__skxH = +r.getAttribute('height') || 0; }
    /* 늘어난 몫이 0 이어도 반드시 다시 쓴다 — 넓다가 좁아진 경우(가로로 긴 창 → 보통 창)
       예전 값이 그대로 남아 판이 화면 밖으로 삐져나온다. 기준은 항상 캐시해 둔 원본 크기. */
    if (r.__skxW >= SKX_BASE_W * 0.9) r.setAttribute('width', String(r.__skxW + dW));
    if (r.__skxH >= SKX_BASE_H * 0.9) r.setAttribute('height', String(r.__skxH + dH));
  });
}
/* 폭이 늘어났을 때(작업 영역이 16:9 보다 가로로 길 때)만 필요한 처리 —
   늘어난 판 위의 부품을 다시 붙인다: 왼쪽 것은 그대로, 오른쪽 끝에 붙어 있던 것은
   늘어난 만큼 이동, 가운데 있던 것은 절반만. */
function skxAnchorInner(host, dW) {
  [...host.children].forEach((node) => {
    if (node.tagName === 'rect' || node.tagName === 'image' || node.tagName === 'defs') return;
    const wrapped = !!(node.dataset && node.dataset.skxAnchor);
    const el = wrapped ? node.firstElementChild : node;
    if (!el) return;
    const b = skxBox(el);
    if (!b) return;
    const right = SKX_BASE_W - (b.x + b.w);
    let tx = 0;
    /* 폭을 거의 다 덮는 부품(바 배경·표)은 그 자리에 둔다 — 판은 위에서 이미 넓혔고,
       여기서 '가운데 있으니 절반 이동'으로 잘못 분류하면 바가 통째로 오른쪽으로 밀린다. */
    if (b.w >= SKX_BASE_W * 0.9) tx = 0;
    else if (right <= 24 || b.x > SKX_BASE_W * 0.55) tx = dW;
    else if (Math.abs(b.x + b.w / 2 - SKX_BASE_W / 2) < SKX_BASE_W * 0.12) tx = dW / 2;
    if (tx) skxAnchorWrap(el).setAttribute('transform', 'translate(' + tx + ',0)');
    else if (wrapped) node.removeAttribute('transform');
  });
}
function skxFitResponsive(scr) {
  const svg = scr && scr.querySelector('.skx-svg');
  if (!svg) return;
  const W = scr.clientWidth, H = scr.clientHeight;  /* 레이아웃 픽셀 — 바깥 scale 에 영향받지 않는다 */
  if (!W || !H) return;
  /* 캔버스는 짧은 쪽을 기준으로 넓힌다 — 늘어난 몫은 항상 한 축에만 생긴다 */
  const wide = W / H >= SKX_BASE_W / SKX_BASE_H;
  const VW = wide ? Math.round(SKX_BASE_H * (W / H)) : SKX_BASE_W;
  const VH = wide ? SKX_BASE_H : Math.round(SKX_BASE_W * (H / W));
  const key = VW + 'x' + VH;
  if (svg.__skxFit === key) return;
  svg.__skxFit = key;
  const dW = VW - SKX_BASE_W, dH = VH - SKX_BASE_H;
  svg.setAttribute('viewBox', '0 0 ' + VW + ' ' + VH);
  /* Screen 그룹 바깥의 바탕(다크 판·라이트 보케 이미지)은 새 캔버스를 통째로 덮는다 */
  [...svg.children].forEach((el) => {
    if (el.tagName === 'rect' || el.tagName === 'image') { el.setAttribute('width', String(VW)); el.setAttribute('height', String(VH)); }
  });
  const scrG = svg.querySelector('[id^="skx-Screen"]');
  if (!scrG) return;
  /* 헤더 뒤 HTML 오버레이(foreignObject)도 새 폭에 맞춘다 */
  const fo = scrG.querySelector(':scope > foreignObject');
  if (fo) fo.setAttribute('width', String(1948 + dW));
  [...scrG.children].forEach((node) => {
    const wrapped = !!(node.dataset && node.dataset.skxAnchor);
    const el = wrapped ? node.firstElementChild : node;
    const a = el && el.id && SKX_ANCHORS[el.id];
    if (!a) return;
    if (a.x === 'stretch' || a.y === 'stretch') skxStretchPlates(el, a.x === 'stretch' ? dW : 0, a.y === 'stretch' ? dH : 0);
    if (a.x === 'stretch') skxAnchorInner(el, dW); /* dW 가 0 이어도 부른다 — 옛 이동값을 지워야 한다 */
    const tx = a.x === 'right' ? dW : 0;
    const ty = a.y === 'bottom' ? dH : a.y === 'middle' ? dH / 2 : 0;
    if (tx || ty) skxAnchorWrap(el).setAttribute('transform', 'translate(' + tx + ',' + ty + ')');
    else if (wrapped) node.removeAttribute('transform');
  });
}
window.__skxFitResponsive = skxFitResponsive;
/* 작업 영역 크기가 바뀌면 다시 붙인다 */
function skxWatchResize(scr) {
  if (scr.__skxRo) scr.__skxRo.disconnect();
  const run = () => skxFitResponsive(scr);
  try {
    if (typeof ResizeObserver === 'function') { scr.__skxRo = new ResizeObserver(run); scr.__skxRo.observe(scr); }
  } catch (e) {}
  if (!window.__skxResizeHooked) {
    window.__skxResizeHooked = true;
    window.addEventListener('resize', () => {
      document.querySelectorAll('#dtStage .skx-screen').forEach((el) => skxFitResponsive(el));
    });
  }
  run();
}

/* ── SK하이닉스 이천 FMS — Figma(1:139)를 순수 HTML/CSS DOM으로 구현 ──
   한진식(이미지/SVG 오버레이 + data-tpl 크롬 숨김)과 다르게, 자체 컨테이너(.skx-screen)에
   절대배치 div로 만든 1920×1080 화면(src/skhynix-screen.js)을 얹는다.
   고정 색(테마 비연동)이며 이미지가 아니다. */
function applySkhynixDT() {
  const stage = document.getElementById('dtStage');
  if (!stage) return;
  /* 1920x1080 고정 캔버스는 쓰지 않는다 — 통짜 축소는 위아래에 여백을 남긴다.
     대신 skxFitResponsive 가 좌표계를 1920x1080 으로 둔 채 캔버스만 넓혀 여백 없이 채운다. */
  try { if (window.__setCanvas1920) window.__setCanvas1920(false); } catch (e) {}
  /* 이 템플릿의 기본 테마는 Dark(Figma 원본)다. 앱 전역 기본은 팬톤 프리셋의 Light라서,
     화면을 그리기 전에 '테마를 먼저' Dark로 맞춘다("늘 먼저 깔아줘"). 이 함수는 열기/복원에서만
     호출되고 화면 전환·테마 토글에선 재호출되지 않으므로, 이후 Light 토글은 그대로 유지된다. */
  try {
    if (typeof state !== 'undefined' && state.mode !== 'dark') {
      state.mode = 'dark';
      document.querySelectorAll('#mode button').forEach((x) => x.classList.toggle('on', x.dataset.m === 'dark'));
      if (typeof apply === 'function') apply();
    }
  } catch (e) {}
  const bn = stage.querySelector('.dt-bname');
  if (bn) bn.textContent = 'SK하이닉스 이천 FMS';
  /* 화면 CSS 1회 주입 */
  if (!document.getElementById('skx-style') && window.SKHYNIX_CSS) {
    const st = document.createElement('style');
    st.id = 'skx-style';
    st.textContent = window.SKHYNIX_CSS;
    document.head.appendChild(st);
  }
  let scr = stage.querySelector('.skx-screen');
  if (scr) { if (scr.__ro) scr.__ro.disconnect(); scr.remove(); }
  scr = document.createElement('div');
  scr.className = 'skx-screen';
  /* main.svg를 인라인 SVG로 그대로 주입 — viewBox+preserveAspectRatio로 컨테이너에 맞춰 반응형 스케일(수동 계산 불필요) */
  scr.innerHTML = typeof window.buildSkhynixScreen === 'function' ? window.buildSkhynixScreen() : '';
  /* '패널 추가'로 넣는 패널이 얹힐 영역을 SVG 위 같은 레이어에 둔다(그래야 SVG에 안 가림).
     activeCols()가 '.dt-added > .cols'를 dtStage 전체에서 찾으므로 여기서 미리 만들어 두면 그대로 사용된다. */
  if (!scr.querySelector('.dt-added')) {
    const added = document.createElement('div');
    added.className = 'dt-added';
    added.innerHTML = '<div class="cols gridmode"></div>';
    scr.appendChild(added);
  }
  stage.appendChild(scr);
  /* 템플릿 화면 자체의 패널들도 배치 모드에서 이동 가능하게 한다 */
  try { skxMakePanelsMovable(scr.querySelector('.skx-svg'), stage); } catch (e) {}
  try { skxWireHotspots(scr.querySelector('.skx-svg'), stage); } catch (e) {} /* UPS 카드 클릭 → 팝업 */
  try { skxAddHotHint(scr); } catch (e) {}
  try { initSkxInteractions(scr.querySelector('.skx-svg')); } catch (e) {} /* 클록·마퀴·호버·이벤트 슬라이드 */
  try { skxWatchResize(scr); } catch (e) {} /* 작업 영역 비율에 맞춰 캔버스를 넓혀 여백 없이 채운다 */
  try { syncSkxControls(); } catch (e) {} /* 버전 토글 비활성(이 화면엔 버전 없음) */
  try { window.__refreshTpl && window.__refreshTpl(); } catch (e) {} /* 업로드한 브랜드 로고 · 테마 색조 반영 */
  /* '콘텐츠 추가' 패널의 X(삭제) — 편집 모드에선 다른 포인터/클릭 핸들러가 가로채므로
     캡처 단계에서 먼저 처리해 어떤 모드에서도 확실히 삭제되게 한다(1회만 등록). */
  if (!window.__skxDelInit) {
    window.__skxDelInit = true;
    document.addEventListener('click', (e) => {
      const del = e.target.closest && e.target.closest('.skx-screen .dt-added .pdel');
      if (!del) return;
      e.preventDefault();
      e.stopPropagation();
      const panel = del.closest('.panel');
      if (panel) panel.remove();
    }, true);
  }
}

/* ── SK하이닉스 인라인 SVG 화면의 인터랙션: 실시간 시계·티커 마퀴·이벤트 프레임 슬라이드.
   (호버 활성은 CSS가 처리) 화면을 새로 그릴 때마다 fresh SVG에서 1회 구성. ── */
function initSkxInteractions(svg) {
  if (!svg) return;
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* 0-라이트) fill="white"(키워드) 텍스트·아이콘은 skhynix-theme.css 색맵(6자리 hex)을 안 타므로
     라이트모드에서 밝은 배경/패널 위에선 안 보인다. 렌더되는(마스크/defs 제외) 흰색 요소 중
     '라이트 표면 위'의 것만 skx-lighttext로 태깅 → CSS가 라이트모드에서만 짙은 슬레이트로 바꾼다.
     어두운 3D 건물(래스터)·선택된 내비(빨강 원)·차트 포커스 위의 흰색은 유지한다. */
  (function tagLightText() {
    /* 이 조상 아래의 흰색은 그대로 흰색 유지 — 건물 렌더(사진)와 선택된 강조 요소.
       'Focus'(차트 포커스 마커)는 빼뒀다: 흰 카드 위에 흰 점이라 라이트에서 보이지 않았다. */
    const KEEP = /Building Map|Building Image|Selected/;
    const NR = { MASK: 1, DEFS: 1, CLIPPATH: 1, PATTERN: 1, SYMBOL: 1, FILTER: 1 }; /* 렌더 안 되는 문맥 */
    const whites = svg.querySelectorAll('[fill="white"],[fill="#fff"],[fill="#ffffff"],[fill="#FFFFFF"],[fill="#FFF"]');
    whites.forEach((el) => {
      let p = el.parentNode, skip = false, keep = false;
      while (p && p !== svg) {
        if (p.tagName && NR[p.tagName.toUpperCase()]) { skip = true; break; }
        if (p.id && KEEP.test(p.id)) keep = true;
        p = p.parentNode;
      }
      if (!skip && !keep) el.classList.add('skx-lighttext');
    });
  })();

  /* 0) 이벤트 리스트 expand — expand 버튼을 누르면 패널이 올라오고(확장) 화살표가 360° 회전한다.
     (평소엔 하단 헤더 바만 clip 되어 보이고, 열면 clip 해제 + 위로 올려 패널 전체가 올라온다) */
  (function eventExpand() {
    const btn = svg.querySelector('[id="skx-Fold Button"]') || svg.querySelector('[id="skx-button/event-expand"]');
    const panel = svg.querySelector('[id="skx-Event List"]') || svg.querySelector('[id="skx-panel/event-list"]');
    const arrow = (btn && btn.querySelector('[id="skx-arrow"]')) || svg.querySelector('[id="skx-arrow"]');
    if (!btn || !panel) return;
    btn.style.cursor = 'pointer';
    let open = false;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      open = !open;
      panel.classList.toggle('skx-evt-open', open);
      if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
    });
  })();

  /* 0b) Auto 라디오 버튼(skx-button/auto) — 클릭하면 라디오처럼 선택/해제.
     선택 시 링이 포인트 색으로 강조되고 가운데 점이 채워진다. */
  (function autoRadio() {
    const rbtn = svg.querySelector('[id="skx-Auto Toggle"]') || svg.querySelector('[id="skx-button/auto"]');
    const ring = (rbtn && (rbtn.querySelector('[id="skx-Ellipse 1"]') || rbtn.querySelector('ellipse,circle'))) || svg.querySelector('[id="skx-radio"] circle');
    if (!rbtn || !ring) return;
    rbtn.style.cursor = 'pointer';
    let dot = svg.querySelector('[id="skx-radio-dot"]');
    if (!dot) {
      dot = document.createElementNS(SVGNS, 'circle');
      dot.id = 'skx-radio-dot';
      /* Ellipse 1이 <ellipse>/<circle>면 cx/cy, 아니면(path) bbox 중심으로 배치 */
      let cx = ring.getAttribute && ring.getAttribute('cx');
      let cy = ring.getAttribute && ring.getAttribute('cy');
      if (cx == null || cy == null) { try { const bb = ring.getBBox(); cx = bb.x + bb.width / 2; cy = bb.y + bb.height / 2; } catch (e) { cx = 0; cy = 0; } }
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
      dot.setAttribute('r', '2.6');
      dot.style.fill = 'var(--fg-point, #6aa0ff)';
      dot.style.opacity = '0';
      dot.style.transition = 'opacity 0.18s ease';
      dot.style.pointerEvents = 'none';
      ring.parentNode.appendChild(dot);
    }
    let on = false;
    rbtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      on = !on;
      rbtn.classList.toggle('skx-radio-on', on);
      dot.style.opacity = on ? '1' : '0';
    });
  })();

  /* 1) 헤더 타임스탬프(skx-Date_2 · skx-Time_3, 벡터 패스)를 라이브 <text>로 대체해 매초 갱신 */
  (function clock() {
    /* 헤더 타임스탬프 내부의 날짜·시각 프레임을 라이브 <text>로 대체.
       구버전 export=skx-timestamp(소문자), 신버전(64:1782)=skx-Clock 안의 skx-Timestamp_2. */
    const ts = svg.querySelector('[id="skx-timestamp"]')
      || svg.querySelector('[id="skx-Clock"] [id^="skx-Timestamp"]')
      || svg.querySelector('[id^="skx-Timestamp"]');
    const date = ts && (ts.querySelector('[id^="skx-date"]') || ts.querySelector('[id^="skx-Date"]'));
    const time = ts && (ts.querySelector('[id^="skx-time"]') || ts.querySelector('[id^="skx-Time"]'));
    if (!date || !time) return;
    const mk = (bb, fill) => {
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', bb.x.toFixed(1));
      t.setAttribute('y', (bb.y + bb.height * 0.85).toFixed(1));
      t.setAttribute('fill', fill);
      t.setAttribute('font-family', "'Tomorrow','Pretendard Variable','Pretendard','Malgun Gothic',system-ui,sans-serif");
      t.setAttribute('font-size', (bb.height * 1.08).toFixed(1));
      t.setAttribute('font-weight', '600');
      t.setAttribute('letter-spacing', '0.6');
      t.style.fontVariantNumeric = 'tabular-nums';
      return t;
    };
    let bd, bt;
    try { bd = date.getBBox(); bt = time.getBBox(); } catch (e) { return; }
    date.style.display = 'none';
    time.style.display = 'none';
    const td = mk(bd, '#BBBBBB'), tt = mk(bt, '#FF9542');
    date.parentNode.insertBefore(td, date);
    time.parentNode.insertBefore(tt, time);
    const p = (n) => String(n).padStart(2, '0');
    const upd = () => {
      const d = new Date();
      td.textContent = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
      tt.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
    };
    upd();
    if (window.__skxClock) clearInterval(window.__skxClock);
    window.__skxClock = setInterval(() => { if (!window.__wembIdle || !window.__wembIdle()) upd(); }, 1000);
  })();

  /* 2) 티커 메시지(skx-Txt)를 왼쪽으로 계속 흐르는 마퀴로 — 메시지 영역에 클립 + 2벌 심리스 루프 */
  (function marquee() {
    const msg = svg.querySelector('[id="skx-Message"]') || svg.querySelector('[id="skx-message"]');
    const txt = msg && (msg.querySelector('[id^="skx-Text"]') || msg.querySelector('[id^="skx-text"]'));
    if (!txt) return;
    let bb;
    try { bb = txt.getBBox(); } catch (e) { return; }
    const gap = 240, period = Math.round(bb.width + gap);
    /* 클립 영역: 메시지 시작 ~ 티커 우측 끝(동적) — 신 디자인(skx-Ticker) 지오메트리에서 산출 */
    const ticker = svg.querySelector('[id="skx-Ticker"]');
    let tb = null; try { tb = ticker && ticker.getBBox(); } catch (e) {}
    const clipX = Math.round(bb.x - 4);
    const clipY = Math.round(bb.y - 9);
    const clipW = Math.round((tb ? tb.x + tb.width - 12 : 1176) - clipX);
    const clipH = Math.round(bb.height + 18);
    let defs = svg.querySelector('defs');
    if (!defs) { defs = document.createElementNS(SVGNS, 'defs'); svg.appendChild(defs); }
    const cpId = 'skx-marquee-clip';
    if (!svg.querySelector('#' + cpId)) {
      const cp = document.createElementNS(SVGNS, 'clipPath');
      cp.id = cpId;
      const r = document.createElementNS(SVGNS, 'rect');
      r.setAttribute('x', clipX); r.setAttribute('y', clipY);
      r.setAttribute('width', clipW); r.setAttribute('height', clipH);
      cp.appendChild(r); defs.appendChild(cp);
    }
    const parent = txt.parentNode;
    const clipG = document.createElementNS(SVGNS, 'g');
    clipG.setAttribute('clip-path', 'url(#' + cpId + ')');
    const wrap = document.createElementNS(SVGNS, 'g');
    wrap.setAttribute('class', 'skx-marquee');
    parent.insertBefore(clipG, txt);
    clipG.appendChild(wrap);
    const copy = txt.cloneNode(true);
    copy.removeAttribute('id');
    wrap.appendChild(txt);
    wrap.appendChild(copy);
    copy.setAttribute('transform', 'translate(' + period + ',0)');
    wrap.style.setProperty('--skx-marq', period + 'px');
    wrap.style.animationDuration = Math.max(8, period / 55).toFixed(1) + 's';
  })();

  /* 3) 헤더 액션 아이콘(skx-Action_2) — 얇은 아이콘이라 호버 히트영역이 좁다.
     각 아이콘에 투명 히트 rect를 덧대 넉넉한 영역에서 호버 활성되게 한다. */
  (function widenActionHit() {
    const wrap = svg.querySelector('[id="skx-Actions"]') || svg.querySelector('[id="skx-action-area"]');
    if (!wrap) return;
    [...wrap.children].forEach((icon) => {
      if (!icon.getBBox || (icon.querySelector && icon.querySelector('rect.skx-hit'))) return;
      let b; try { b = icon.getBBox(); } catch (e) { return; }
      const pad = 10;
      const hit = document.createElementNS(SVGNS, 'rect');
      hit.setAttribute('class', 'skx-hit');
      hit.setAttribute('x', (b.x - pad).toFixed(1));
      hit.setAttribute('y', (b.y - pad).toFixed(1));
      hit.setAttribute('width', (b.width + pad * 2).toFixed(1));
      hit.setAttribute('height', (b.height + pad * 2).toFixed(1));
      hit.setAttribute('fill', 'transparent');
      icon.insertBefore(hit, icon.firstChild);
    });
  })();

  /* 4) 이벤트 리스트 — 데이터 테이블 주입 + 화살표 클릭 시 위로 슬라이드(하단 플러시)해 데이터 노출.
     (원본 SVG엔 테이블 행이 없어 직접 만들어 넣는다. 접힘 상태에선 49px 클립에 가려짐) */
  (function eventList() {
    const arrow = svg.querySelector('[id="skx-Fold Button"]') || svg.querySelector('[id="skx-button/event-expand"]');
    const ev = svg.querySelector('[id="skx-Event List"]') || svg.querySelector('[id="skx-panel/event-list"]');
    /* 데이터 테이블을 넣을 컨테이너: 신 디자인은 이벤트 리스트 패널 자체(clip 안)에 주입해
       접힘 상태에선 49px 클립에 가려지고, 펼치면(translateY) 함께 올라와 보이게 한다. */
    const brow = svg.querySelector('[id="skx-browser"]') || ev;
    if (!arrow || !ev || !brow) return;

    if (!svg.querySelector('[id="skx-event-data"]')) {
      const F = "'Pretendard Variable','Pretendard','Malgun Gothic',sans-serif";
      const mkT = (x, y, s, o) => {
        o = o || {};
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('x', x); t.setAttribute('y', y);
        t.setAttribute('font-family', F);
        t.setAttribute('font-size', o.size || 13);
        t.setAttribute('fill', o.fill || '#C7C7C7');
        if (o.weight) t.setAttribute('font-weight', o.weight);
        if (o.anchor) t.setAttribute('text-anchor', o.anchor);
        t.textContent = s;
        return t;
      };
      const mkL = (x1, y, x2, c) => {
        const l = document.createElementNS(SVGNS, 'line');
        l.setAttribute('x1', x1); l.setAttribute('y1', y); l.setAttribute('x2', x2); l.setAttribute('y2', y);
        l.setAttribute('stroke', c); l.setAttribute('stroke-width', '1');
        return l;
      };
      const g = document.createElementNS(SVGNS, 'g');
      g.id = 'skx-event-data';
      const cols = [
        { x: 104, label: 'No', anchor: 'middle' },
        { x: 160, label: '발생시간' },
        { x: 330, label: '위치' },
        { x: 530, label: '종류' },
        { x: 712, label: '등급' },
        { x: 928, label: '이벤트' },
      ];
      cols.forEach((c) => g.appendChild(mkT(c.x, 1116, c.label, { fill: '#99A3BE', weight: '600', size: 13, anchor: c.anchor })));
      g.appendChild(mkL(64, 1128, 1864, '#3A4656'));
      const LVC = { CR: '#E1002B', MA: '#F08100', MI: '#E3AF31', WA: '#19B6FF' };
      const DATA = [
        { no: '01', time: '14:32:57', loc: '2F 서버실', type: 'CCTV', lv: 'CR', msg: 'CCTV #1에 장애가 발생했습니다.' },
        { no: '02', time: '14:30:12', loc: 'M16', type: '온도', lv: 'MA', msg: 'M16 온도 임계 초과 (31°C) — 냉방 확인' },
        { no: '03', time: '14:28:45', loc: '3F 전산실', type: '누수', lv: 'CR', msg: '누수 감지 — 즉시 확인 필요' },
        { no: '04', time: '14:25:03', loc: 'M14', type: '항온항습', lv: 'MI', msg: '항온항습기 #3 통신 지연' },
        { no: '05', time: '14:21:39', loc: 'P&T4', type: 'UPS', lv: 'WA', msg: 'UPS 배터리 전압 저하 경고' },
      ];
      const rowH = 34, y0 = 1128;
      DATA.forEach((d, i) => {
        const ry = y0 + i * rowH;
        if (i % 2 === 1) {
          const bgr = document.createElementNS(SVGNS, 'rect');
          bgr.setAttribute('x', 64); bgr.setAttribute('y', ry); bgr.setAttribute('width', 1800); bgr.setAttribute('height', rowH);
          bgr.setAttribute('fill', '#FFFFFF'); bgr.setAttribute('fill-opacity', '0.03');
          g.appendChild(bgr);
        }
        const ty = ry + 22;
        g.appendChild(mkT(104, ty, d.no, { anchor: 'middle', fill: '#99A3BE' }));
        const tcell = mkT(160, ty, d.time, { fill: '#C7C7C7' });
        tcell.setAttribute('data-ev', 'time');   /* 열 때마다 최근 시각으로 다시 찍을 칸 */
        g.appendChild(tcell);
        g.appendChild(mkT(330, ty, d.loc, { fill: '#C7C7C7' }));
        g.appendChild(mkT(530, ty, d.type, { fill: '#C7C7C7' }));
        const bw = 42, bh = 18, bx = 712, by = ry + (rowH - bh) / 2;
        const badge = document.createElementNS(SVGNS, 'rect');
        badge.setAttribute('x', bx); badge.setAttribute('y', by); badge.setAttribute('width', bw); badge.setAttribute('height', bh); badge.setAttribute('rx', 4);
        badge.setAttribute('fill', LVC[d.lv]); badge.setAttribute('fill-opacity', '0.16');
        badge.setAttribute('stroke', LVC[d.lv]); badge.setAttribute('stroke-opacity', '0.55');
        g.appendChild(badge);
        g.appendChild(mkT(bx + bw / 2, by + 13, d.lv, { anchor: 'middle', fill: LVC[d.lv], weight: '700', size: 11 }));
        g.appendChild(mkT(928, ty, d.msg, { fill: '#CCCCCC' }));
        g.appendChild(mkL(64, ry + rowH, 1864, '#242A31'));
      });
      brow.appendChild(g);
    }
    /* 발생시각을 '방금'으로 옮겨 온다 — 줄 간격은 원본(14:32:57 … 14:21:39) 그대로다 */
    try {
      const evg = svg.querySelector('[id="skx-event-data"]');
      if (evg && window.wembRestampTimesIn) window.wembRestampTimesIn(evg, '[data-ev="time"]');
    } catch (e) {}

    /* z-order 최상단 — 이벤트 리스트를 최상위 그룹 맨 뒤로(마지막에 그려짐) → 펼칠 때 위 내용 위로 덮음 */
    const mainG = svg.querySelector('[id="skx-Screen/FMS Dashboard"]') || svg.querySelector('[id="skx-main"]') || ev.parentNode;
    mainG.appendChild(ev);
    ev.style.zIndex = '99999';
    /* 열고 닫기(패널 슬라이드업 + 화살표 360° 회전)는 eventExpand()가 .skx-evt-open
       클래스 토글로 단독 처리한다. 여기선 데이터 주입·z-order만 담당(핸들러 중복 제거). */
  })();

  /* 5) 나머지 버튼 활성화 — 맵(층 선택), 헤더 액션(사용자·로그아웃), 센터 온도 유도(화살표). */
  (function buttons() {
    /* 5a) 맵 층 선택(6F/5F/3F/2F) — Figma 컴포넌트 액션을 그대로 옮긴 것.
           · Btn Floor(107:438) Status: MOUSE_ENTER→Hover, MOUSE_LEAVE→Idle, 선택된 칩은 Select 유지
           · Building Map(107:389) Floor: 칩 ON_CLICK → 그 층 배리언트로 CHANGE_TO
             (Smart Animate, ease-out, 300ms) = Floor Highlight 밴드가 그 층 높이로 이동.
           배리언트마다 밴드의 두께·기울기(원근)가 달라서 위치만이 아니라 패스(d)도 함께 바꾼다. */
    (function floorSelect() {
      const fs = svg.querySelector('[id="skx-Floor Selector"]');
      if (!fs) return;

      /* Figma 배리언트에서 추출한 Floor Highlight 기하.
         d     = 배리언트 로컬 패스를 화면 좌표로 +(181, 202.2965) 평행이동한 값(2F 기준선).
                 2F 값은 현재 export된 패스와 완전히 일치함(검증 완료).
         dy    = 2F 대비 세로 이동량. transform: translateY(dy)가 실제 층 높이를 만든다.
                 밴드의 스트로크 그라디언트는 그룹 안에 있어 transform을 같이 따라간다.
         chipY = 그 층 칩 rect의 y. Select 사선 시트 그라디언트를 층마다 복제할 때 쓴다. */
      const FLOORS = [
        { id: 'skx-Floor 6F', chipY: 93.7965, dy: -46.043,
          d: 'M441.869 208.81V217.783L257.819 215.738H257.801L181.5 217.79V210.79L258.825 202.797L441.869 208.81Z' },
        { id: 'skx-Floor 5F', chipY: 126.792, dy: -32.043,
          d: 'M441.869 205.819V214.791L257.812 215.738L181.5 215.803V205.82L258.822 202.797L441.869 205.819Z' },
        { id: 'skx-Floor 3F', chipY: 159.786, dy: -11,
          d: 'M258.435 212.996L258.476 213.002L258.517 213L441.869 206.8V216.769L258.529 225.998L181.5 212.083V202.867L258.435 212.996Z' },
        { id: 'skx-Floor 2F (Selected)', chipY: 192.781, dy: 0,
          d: 'M258.742 213.749L258.789 213.755L258.836 213.753L441.869 204.809V213.779L257.85 226.69L181.5 209.859V202.872L258.742 213.749Z' }
      ];
      FLOORS.forEach((f) => { f.el = svg.querySelector('[id="' + f.id + '"]'); });
      const floors = FLOORS.filter((f) => f.el);
      if (!floors.length) return;

      const band = svg.querySelector('[id="skx-Floor Highlight"]');
      const bandPaths = band ? [...band.querySelectorAll('path')] : [];

      /* Btn Floor 세 상태의 실제 값.
         테두리는 '속성'으로 — #565E71 은 theme.css 색맵에 있어 라이트 반전이 그대로 따라온다.
         배경은 인라인 style + CSS 변수로 — 스튜디오 시안 틴트(skxTint)가 '색맵에 없는 하드코딩
         hex'를 한 번 훑어 목록(svg.__paint)에 캐시해 두고 인라인 style 로 칠하는데, 원본 2F 칩의
         #2861FF 가 여기 걸린다. 그러면 상태를 바꿔도 인라인 값이 이겨 2F가 영영 선택색으로 남는다.
         그래서 ①칩 배경은 fill 속성을 hex 가 아닌 black 으로 바꿔 틴트 목록에 안 잡히게 하고
         ②상태색은 var(--skx-accent) 로 직접 넣는다. accent 는 시드색(--fg-point)이라 시안·테마를
         그대로 따라가므로, theme.css 의 [fill="#2861FF"]→var(--skx-accent) 와 결과가 같다. */
      const ACCENT = 'var(--skx-accent, #2861FF)';
      /* 평상시 칩 배경은 다크 시안 기준 검정이지만, 라이트에서는 밝은 유리 칩이어야 한다.
         (인라인 style 이 CSS 를 이기므로 색을 CSS 변수로 넘긴다 — 값은 skhynix-light.css)
         ink = 칩 글자색. 글자는 foreignObject(.skx-tb)라 color 가 인라인이고, 그 인라인이
         var(--skx-tb-fg) 를 읽는다 → 칩 그룹에 그 변수를 얹어 상태마다 글자색을 바꾼다.
         강조색/호버 칩은 어느 테마에서든 흰 글자, 평상시 칩만 테마를 따라간다. */
      const IDLE = { bg: 'var(--skx-floor-chip, black)', line: '#565E71', ink: 'var(--skx-floor-ink, #fff)' };
      const HOVER = { bg: 'color-mix(in srgb, ' + ACCENT + ' 85%, white)', line: 'white', ink: '#fff' };
      const SELECT = { bg: ACCENT, line: 'white', ink: '#fff' };

      const sheenSrc = svg.querySelector('[id="skx-paint14_linear_0_1"]');
      floors.forEach((f, i) => {
        const rects = [...f.el.querySelectorAll('rect')];
        f.bg = rects.find((r) => { const v = r.getAttribute('fill'); return v && !/^url\(/.test(v); });
        f.line = rects.find((r) => r.getAttribute('stroke'));
        f.sheen = rects.find((r) => /^url\(/.test(r.getAttribute('fill') || ''));

        /* Select의 사선 시트는 원본 export에서 2F 칩에만 있다(내보낼 때 2F가 선택 상태였으므로).
           다른 층도 선택될 수 있으니 그라디언트 def와 오버레이 rect를 그 칩 높이에 맞춰 복제한다. */
        if (!f.sheen && f.bg && sheenSrc) {
          const gid = 'skx-floor-sheen-' + i;
          const grad = sheenSrc.cloneNode(true);
          grad.setAttribute('id', gid);
          grad.setAttribute('y1', String(f.chipY + 13.015)); /* 2F 기준 칩 상단으로부터의 오프셋 */
          grad.setAttribute('y2', String(f.chipY + 29.495));
          sheenSrc.parentNode.appendChild(grad);
          const ov = f.bg.cloneNode(false);
          ov.removeAttribute('id');
          ov.setAttribute('fill', 'url(#' + gid + ')');
          ov.setAttribute('fill-opacity', '0.3');
          ov.style.opacity = '0'; /* 첫 페인트에서 깜빡이지 않도록 숨긴 채로 삽입 */
          f.bg.parentNode.insertBefore(ov, f.bg.nextSibling);
          f.sheen = ov;
        }
      });

      /* 칩 배경을 틴트 대상에서 빼낸다. 틴트가 먼저 돌았으면 캐시 목록에서 제거 + 이미 박힌
         인라인 값 제거, 나중에 돌더라도 fill 속성이 hex 가 아니라 아예 안 잡힌다. */
      const chipRects = new Set();
      floors.forEach((f) => { if (f.bg) chipRects.add(f.bg); if (f.line) chipRects.add(f.line); });
      const untint = () => {
        const list = svg.__paint;
        if (Array.isArray(list) && !list.__floorFixed) {
          svg.__paint = list.filter((e) => !chipRects.has(e[0]));
          svg.__paint.__floorFixed = true;
        }
      };
      floors.forEach((f) => {
        if (!f.bg) return;
        f.bg.setAttribute('fill', 'black');
        f.bg.style.removeProperty('fill');
      });

      let selected = floors[floors.length - 1]; /* 초기 선택 = 2F(Figma 기본 배리언트) */
      let hovered = null;
      /* recolor=true 는 시안·테마가 바뀌어 accent 자체가 달라졌을 때.
         fill 값이 var(--skx-accent) → 상대색 oklch(from …) 이라, 변수만 바뀌면 크롬이
         트랜지션에 묶인 옛 계산값을 그대로 붙들고 있는다. 트랜지션을 한 프레임 끄고
         값을 비웠다 다시 넣어 강제로 재계산시킨다(색 갱신이라 애니메이션은 불필요). */
      const paint = (recolor) => {
        untint();
        floors.forEach((f) => {
          const st = (f === selected) ? SELECT : (f === hovered ? HOVER : IDLE);
          if (f.bg) {
            if (recolor) { f.bg.style.transition = 'none'; f.bg.style.removeProperty('fill'); }
            f.bg.style.fill = st.bg;
            if (recolor) requestAnimationFrame(() => f.bg.style.removeProperty('transition'));
          }
          if (f.line) f.line.setAttribute('stroke', st.line);
          f.el.style.setProperty('--skx-tb-fg', st.ink);
          if (f.sheen) f.sheen.style.opacity = (f === selected) ? '1' : '0';
        });
      };
      /* 시안·테마가 바뀌면 skxTint 가 호스트 SVG 의 style(--skx-c*)을 다시 쓴다 — 그 신호로 재계산. */
      try { new MutationObserver(() => paint(true)).observe(svg, { attributes: true, attributeFilter: ['style'] }); } catch (e) {}
      const select = (f) => {
        selected = f;
        paint();
        if (band) { /* Floor 배리언트 전환 */
          band.style.transform = 'translateY(' + f.dy + 'px)';
          bandPaths.forEach((p) => p.setAttribute('d', f.d));
        }
      };

      floors.forEach((f) => {
        f.el.addEventListener('pointerenter', () => { hovered = f; paint(); });
        f.el.addEventListener('pointerleave', () => { if (hovered === f) hovered = null; paint(); });
        f.el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); select(f); });
      });
      select(selected);
    })();

    /* 5b) 공통 '눌림' 피드백 — 클릭 시 살짝 눌렸다 돌아오는 스케일 트랜지션. */
    const pressFx = (el) => {
      el.style.cursor = 'pointer';
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = 'center';
      el.style.transition = 'transform 0.12s ease';
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        el.style.transform = 'scale(0.86)';
        setTimeout(() => { el.style.transform = 'scale(1)'; }, 130);
      });
    };
    /* 5c) 헤더 액션 — 사용자·로그아웃 아이콘(목업이라 실제 동작 대신 눌림 피드백만). */
    ['skx-Icon/Action/User', 'skx-Icon/Action/Logout'].forEach((id) => {
      const el = svg.querySelector('[id="' + id + '"]'); if (el) pressFx(el);
    });
    /* 5d) 센터 온도 유도(화살표) — 평소엔 좌우 넛지(주의 유도, CSS 애니), 클릭 시 크게 한 번 튕김.
       넛지가 transform을 점유하므로 클릭 땐 애니를 잠시 끄고 lunge 후 복원한다. */
    const arrow = svg.querySelector('[id="skx-Icon/Arrow/Right"]');
    if (arrow) {
      arrow.style.cursor = 'pointer';
      arrow.style.transformBox = 'fill-box';
      arrow.style.transformOrigin = 'center';
      arrow.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        arrow.style.animation = 'none';
        arrow.style.transition = 'transform 0.14s ease';
        arrow.style.transform = 'translateX(8px) scale(1.12)';
        setTimeout(() => { arrow.style.transform = ''; arrow.style.animation = ''; }, 170);
      });
    }
  })();

  /* 6) 위젯 배지 아이콘(전력·온도·상면포화도)의 검은 그림자 완화.
        Figma 내보내기가 이 세 아이콘에만 '검정 80% + 흐림 7' 그림자를 걸어 두는데,
        화면의 다른 검정 그림자는 대부분 30%라 유독 탁하고 무겁게 보인다. 같은 계열로 낮춘다. */
  (function softenIconShadows() {
    const HEAVY = 0.8, SOFT = 0.35, touched = [];
    svg.querySelectorAll('filter feColorMatrix[type="matrix"]').forEach((fe) => {
      if (fe.getAttribute('in') === 'SourceAlpha') return; /* 알파 정리 단계는 그림자 색이 아니다 */
      const v = (fe.getAttribute('values') || '').trim().split(/[\s,]+/).map(Number);
      if (v.length < 20 || v.some((n) => !isFinite(n))) return;
      /* 색을 통째로 칠하는 행렬만(각 행의 앞 4칸이 0) — 그 중 '검정'이고 투명도가 0.8인 것 */
      if (![0, 1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13].every((i) => Math.abs(v[i]) < 1e-6)) return;
      if (Math.abs(v[4]) > 1e-6 || Math.abs(v[9]) > 1e-6 || Math.abs(v[14]) > 1e-6) return;
      if (Math.abs(v[18] - HEAVY) > 1e-6) return;
      v[18] = SOFT;
      fe.setAttribute('values', v.join(' '));
      touched.push(fe);
    });
    /* 시안 틴트(skxTint)는 필터 행렬의 원본값을 따로 캐시해 두고 색을 바꿀 때마다 통째로
       다시 쓴다. 캐시가 이미 만들어졌다면 거기 담긴 투명도도 같이 낮춰야 되돌아가지 않는다. */
    if (Array.isArray(svg.__fx)) {
      svg.__fx.forEach((e) => {
        if (touched.indexOf(e[0]) >= 0 && Math.abs(e[1][18] - HEAVY) < 1e-6) e[1][18] = SOFT;
      });
    }
  })();
}
/* ── SK하이닉스 화면(하나의 인라인 SVG)의 패널 영역을 좌표로 묶어 그룹(<g>)으로 만들고,
   배치 모드(#dtStage.dt-editing)에서 끌어 이동할 수 있게 한다. SVG 좌표계라 화면 배율만큼
   보정해 커서와 1:1로 움직이며, 위치는 localStorage에 저장한다. */
function skxMakePanelsMovable(svg, stage) {
  if (!svg || svg.__skxInit) return;
  svg.__skxInit = true;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const KEY = 'wemb-skx-panelpos';
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) {}

  /* 드래그(배치 모드에서만). 그룹이 아직 없으면 closest가 null이라 no-op → 미리 연결해도 안전 */
  const scaleOf = () => { const m = svg.getScreenCTM(); return m && m.a ? m.a : 1; };
  let drag = null;
  svg.addEventListener('pointerdown', (e) => {
    if (!stage.classList.contains('dt-editing')) return; /* 배치 모드에서만 */
    const g = e.target.closest('.skx-svgpanel'); if (!g) return;
    const cur = saved[g.dataset.pid] || [0, 0];
    drag = { g, pid: e.pointerId, sx: e.clientX, sy: e.clientY, ox: cur[0], oy: cur[1], s: scaleOf() };
    try { g.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = Math.round(drag.ox + (e.clientX - drag.sx) / drag.s);
    const dy = Math.round(drag.oy + (e.clientY - drag.sy) / drag.s);
    drag.g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    drag.cur = [dx, dy];
  });
  const end = () => {
    if (!drag) return;
    if (drag.cur) { saved[drag.g.dataset.pid] = drag.cur; try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} }
    try { drag.g.releasePointerCapture(drag.pid); } catch (_) {}
    drag = null;
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  /* 패널 지정 — 새 화면(Figma 16:1775)은 각 레이어가 이름(id)을 가지므로, 옛 1:139
     좌표매칭 대신 named 그룹을 직접 패널로 삼는다: 중앙 #skx-Map + 우측 Metric Wrapper의
     Metric Section 3개(위→아래: UPS 전력량·센터 온도·상면 포화도).
     getBoundingClientRect는 화면에 배치된 뒤에만 유효 → 보일 때까지 폴링한다.
     (Figma 그룹엔 transform 속성이 없어 CSS translate와 충돌하지 않음) */
  const byId = (id) => svg.querySelector('[id="' + id + '"]');
  const doGroup = () => {
    if (!svg.isConnected || svg.__skxGrouped) return;              /* 교체/완료 → 중단 */
    if (!svg.getBoundingClientRect().width) { setTimeout(doGroup, 150); return; } /* 아직 숨김 → 재시도 */
    const tag = (el, pid) => { if (!el) return false; el.classList.add('skx-svgpanel'); el.dataset.pid = pid; return true; };
    let n = 0;
    if (tag(byId('skx-Building Map') || byId('skx-panel/map'), 'map')) n++; /* 중앙 건물/현황 */
    const mw = byId('skx-Metrics') || byId('skx-metric-group');           /* 우측 지표 패널 3개 */
    if (mw) {
      const secs = [...mw.children].filter((c) => c.tagName.toLowerCase() === 'g');
      ['ups', 'temp', 'sat'].forEach((pid, i) => { if (tag(secs[i], pid)) n++; });
    }
    if (n) {
      svg.__skxGrouped = true;
      svg.querySelectorAll('.skx-svgpanel').forEach((g) => {
        const p = saved[g.dataset.pid];
        if (p) g.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
      });
    } else {
      setTimeout(doGroup, 150);                                    /* 아직 미배치 → 재시도 */
    }
  };
  doGroup();
}

/* ── 메인 시안에서 팝업 확인하기 ──
   Figma 메인(64:1782)의 'UPS 전력' 지표 카드와 좌측 'UPS' 내비를 누르면 그 자리에서
   UPS 전력 상세 팝업(64:2504)이 열린다. 팝업의 ✕를 누르면 다시 메인으로 돌아온다.
   편집(배치·내용) 중에는 이동/글자수정이 우선이라 핫스팟은 동작하지 않는다. */
/* [레이어 id, 호버 링 radius(0이면 링을 그리지 않는다 — 이미 자체 호버 효과가 있는 내비),
    툴팁, 가로 범위를 잡을 기준 자식(선택)]
   네 번째 값이 필요한 이유: Figma 텍스트 노드의 상자가 실제 글자보다 좌우로 크게 넘쳐서
   그룹 getBBox() 가 화면 밖(내비는 x=-77, 지표 카드는 x=2182)까지 벌어진다.
   그대로 쓰면 클릭 판정·호버 링이 엉뚱한 빈 공간까지 덮으므로, 가로만 실제 카드/아이콘으로 잡는다. */
const SKX_HOTSPOTS = [
  ['skx-Metrics/UPS Power', 12, 'UPS 전력 상세 팝업 열기', '[id="skx-Card"] > rect'],
  ['skx-Nav Item/UPS', 0, 'UPS 전력 상세 팝업 열기', '[id="skx-Visual_9"]'],
];
function skxWireHotspots(svg, stage) {
  if (!svg || svg.__skxHot) return;
  svg.__skxHot = true;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const editing = () => stage.classList.contains('dt-editing') || stage.classList.contains('dt-content-editing');

  /* 표시(hover 링 + 툴팁) 달기 — 레이아웃이 잡힌 뒤에야 getBBox가 유효해 폴링한다(패널 지정과 동일) */
  const mark = () => {
    if (!svg.isConnected || svg.__skxHotDone) return;
    if (!svg.getBoundingClientRect().width) { setTimeout(mark, 150); return; }
    let done = 0;
    SKX_HOTSPOTS.forEach((h) => {
      const g = svg.querySelector('[id="' + h[0] + '"]');
      if (!g) return;
      if (g.classList.contains('skx-hotspot')) { done++; return; }
      let b = null;
      try { b = g.getBBox(); } catch (e) {}
      if (!b || !b.width) return;
      /* 가로 범위는 기준 자식(실제 카드 테두리 · 내비 아이콘)으로 — 넘치는 글자 상자를 따라가지 않게 */
      let bx = b.x, bw = b.width;
      if (h[3]) {
        const src = g.querySelector(h[3]);
        if (!src) return; /* 아직 안 그려졌으면 다음 폴링에서 다시 */
        try { const sb = src.getBBox(); if (sb.width) { bx = sb.x; bw = sb.width; } } catch (e) {}
      }
      g.classList.add('skx-hotspot');
      /* 클릭 판정용 사각형은 링을 안 그리는 항목에도 반드시 넣는다 —
         이 그룹들은 아이콘 선과 글자뿐이라, 없으면 선 위 몇 px 을 정확히 찍어야만 눌리고
         나머지 클릭은 전부 배경으로 빠져 '눌러도 아무 일이 없는' 상태가 된다. */
      const ring = document.createElementNS(SVGNS, 'rect');
      ring.setAttribute('class', 'skx-hotring' + (h[1] ? '' : ' bare'));
      ring.setAttribute('x', bx - 4);
      ring.setAttribute('y', b.y - 4);
      ring.setAttribute('width', bw + 8);
      ring.setAttribute('height', b.height + 8);
      ring.setAttribute('rx', h[1] || 10);
      g.appendChild(ring);
      const tip = document.createElementNS(SVGNS, 'title');
      tip.textContent = h[2];
      g.insertBefore(tip, g.firstChild);
      done++;
    });
    if (done === SKX_HOTSPOTS.length) svg.__skxHotDone = true;
    else setTimeout(mark, 150);
  };
  mark();

  svg.addEventListener('click', (e) => {
    if (editing()) return;
    const hit = e.target.closest && e.target.closest('.skx-hotspot');
    if (!hit) return;
    e.preventDefault();
    e.stopPropagation();
    try { window.__openSkxScreen && window.__openSkxScreen('popup'); } catch (_) {}
    if (typeof toast === 'function') toast('UPS 전력 상세 팝업을 열었어요. ✕를 누르면 메인으로 돌아갑니다.', { type: 'info' });
  });
}

/* 핫스팟이 있다는 걸 한 번은 알려 준다 — ✕로 닫으면 다시 뜨지 않는다 */
function skxAddHotHint(scr) {
  try { if (localStorage.getItem('wemb-skx-hinted') === '1') return; } catch (e) {}
  const hint = document.createElement('div');
  hint.className = 'skx-hothint';
  hint.innerHTML = '<span><b>UPS 전력</b> 카드를 누르면 상세 팝업이 열려요</span><button type="button" aria-label="안내 닫기">✕</button>';
  hint.querySelector('button').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    hint.remove();
    try { localStorage.setItem('wemb-skx-hinted', '1'); } catch (_) {}
  });
  scr.appendChild(hint);
}
