/* ── 디자인 컨트롤 — 모서리 · 배색 · 밝기 · 버전 ── */

/* ===== 모서리 둥글기(패널 라운드) — 슬라이더로 조절, localStorage에 저장 ===== */
const RK = 'wemb-dash-radius';
const radiusInput = document.getElementById('radius');
const radiusVal = document.getElementById('radiusVal');
function applyRadius(px, save) {
  px = Math.max(0, Math.min(24, px | 0));
  state.radius = px;
  document.documentElement.style.setProperty('--radius-panel', px + 'px');
  if (radiusInput) radiusInput.value = px;
  if (radiusVal) radiusVal.textContent = px + 'px';
  if (save) {
    try {
      localStorage.setItem(RK, String(px));
    } catch (e) {}
    if (!restoring) scheduleHistory(); /* 모서리 둥글기 변경도 히스토리에 기록 */
  }
}
if (radiusInput) radiusInput.oninput = () => applyRadius(+radiusInput.value, true);
document.getElementById('radiusReset').onclick = () => applyRadius(8, true);
/* 저장된 값 복원 */
(function () {
  let saved = null;
  try {
    saved = localStorage.getItem(RK);
  } catch (e) {}
  applyRadius(saved != null ? +saved : 8, false);
})();

/* ===== 디자인 편집 확장: 간격·여백·그림자·테두리·표면 + 밀도 프리셋 =====
   radius와 동일하게 CSS 변수 → localStorage 저장/복원. 대시보드 .panel/.cols/.stage 대상. */
(function () {
  const root = document.documentElement.style;
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v | 0));
  const setV = (id, t) => { const e = $(id); if (e) e.textContent = t; };
  const setI = (id, v) => { const e = $(id); if (e) e.value = v; };
  const store = (k, v) => { try { localStorage.setItem(k, String(v)); } catch (e) {} };
  const GK = 'wemb-dash-gap', PK = 'wemb-dash-pad', EK = 'wemb-dash-elev', BK = 'wemb-dash-border', SK = 'wemb-dash-surface';
  const shadowFor = (n) => (n <= 0 ? 'none' : '0 ' + (2 + n * 2) + 'px ' + (8 + n * 6) + 'px rgba(0,0,0,' + (0.1 + n * 0.06).toFixed(2) + ')');
  function applyGap(px, save) { px = clamp(px, 0, 20); root.setProperty('--panel-gap', px + 'px'); setI('pgap', px); setV('pgapVal', px + 'px'); if (window.__setDtGap) window.__setDtGap(px); if (save) store(GK, px); }
  function applyPad(pct, save) { pct = clamp(pct, 60, 140); root.setProperty('--pad-scale', (pct / 100).toFixed(2)); setI('ppad', pct); setV('ppadVal', pct + '%'); if (save) store(PK, pct); }
  function applyElev(n, save) { n = clamp(n, 0, 4); root.setProperty('--panel-shadow', shadowFor(n)); setI('pelev', n); setV('pelevVal', n === 0 ? '없음' : String(n)); if (save) store(EK, n); }
  function applyBorder(px, save) { px = clamp(px, 0, 3); root.setProperty('--panel-border-w', px + 'px'); setI('pborder', px); setV('pborderVal', px + 'px'); if (save) store(BK, px); }
  /* 표면 밝기는 '색'이 아니라 '퍼센트'만 :root에 얹는다 — 색을 여기서 만들면
     :root의 --bg-surface(항상 다크인 툴 크롬 값)로 굳어져 라이트 모드가 무시된다.
     실제 색 계산은 팔레트 변수를 가진 .main/.abstage의 --panel-bg 규칙이 한다. */
  function applySurface(pct, save) { pct = clamp(pct, 0, 100); root.setProperty('--panel-lift', (pct >= 50 ? ((pct - 50) / 50) * 14 : 0).toFixed(1) + '%'); root.setProperty('--panel-dim', (pct < 50 ? Math.round(((50 - pct) / 50) * 100) : 0) + '%'); setI('psurface', pct); setV('psurfaceVal', pct + '%'); if (save) store(SK, pct); }

  const bind = (id, fn) => { const e = $(id); if (e) e.oninput = () => fn(+e.value, true); };
  bind('pgap', applyGap); bind('ppad', applyPad); bind('pelev', applyElev); bind('pborder', applyBorder); bind('psurface', applySurface);

  /* 밀도 프리셋은 패널 '외형'(안쪽 여백·라운드·그림자)만 바꾼다 — 패널 간격은 별개 옵션이라 건드리지 않는다. */
  const PRESETS = { compact: { pad: 80, radius: 6, elev: 0 }, normal: { pad: 100, radius: 8, elev: 1 }, roomy: { pad: 120, radius: 12, elev: 2 } };
  document.querySelectorAll('#density button').forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll('#density button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      const p = PRESETS[b.dataset.d];
      if (!p) return;
      applyPad(p.pad, true); applyElev(p.elev, true);
      if (typeof applyRadius === 'function') applyRadius(p.radius, true);
    };
  });
  const pgr = $('pgapReset');
  if (pgr) pgr.onclick = () => applyGap(8, true);
  const dr = $('designReset');
  if (dr) dr.onclick = () => {
    applyGap(8, true); applyPad(100, true); applyElev(0, true); applyBorder(1, true); applySurface(50, true);
    if (typeof applyRadius === 'function') applyRadius(8, true);
    document.querySelectorAll('#density button').forEach((x) => x.classList.toggle('on', x.dataset.d === 'normal'));
  };

  const rd = (k, def) => { try { const v = localStorage.getItem(k); return v != null ? +v : def; } catch (e) { return def; } };
  applyGap(rd(GK, 8), false); applyPad(rd(PK, 100), false); applyElev(rd(EK, 0), false); applyBorder(rd(BK, 1), false); applySurface(rd(SK, 50), false);
})();

/* 디자인 편집 버튼 — 누르면 하위 메뉴(모서리 둥글기)를 토글로 펼침/접음 */
(function () {
  const btn = document.getElementById('designToggle');
  const panel = document.getElementById('designPanel');
  const lbl = btn.querySelector('.lbl');
  if (!btn || !panel) return;
  btn.onclick = () => {
    const open = !panel.classList.contains('show');
    panel.classList.toggle('show', open);
    btn.classList.toggle('on', open);
    btn.setAttribute('aria-expanded', open);
    lbl.textContent = open ? '디자인 편집 닫기' : '디자인 편집하기';
  };
})();

document.querySelectorAll('#harmony button').forEach(
  (b) =>
    (b.onclick = () => {
      document.querySelectorAll('#harmony button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      state.harmony = b.dataset.h;
      state.subHex = null;
      state.mapMode = 'auto';
      setSource('seed');
      apply();
    })
);
document.querySelectorAll('#mode button').forEach(
  (b) =>
    (b.onclick = () => {
      document.querySelectorAll('#mode button').forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      state.mode = b.dataset.m;
      apply();
    })
);
/* 버전 토글(Flat / Enterprise) — 색상 사용 범위를 전환 */
function syncVersionUI() {
  document.querySelectorAll('#version button').forEach((x) => x.classList.toggle('on', x.dataset.v === (state.version || 'flat')));
}
document.querySelectorAll('#version button').forEach(
  (b) =>
    (b.onclick = () => {
      state.version = b.dataset.v;
      syncVersionUI();
      try {
        localStorage.setItem('wemb-version', state.version);
      } catch (e) {}
      apply();
    })
);
syncVersionUI(); /* 저장된 버전으로 토글 상태 반영 */
