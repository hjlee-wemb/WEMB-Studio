/* ── 앱 상태(state) 정의와 저장값 복원 ── */

const RV = {
  'bg/page': '--bg-page',
  'bg/surface': '--bg-surface',
  'bg/accent': '--bg-accent',
  line: '--line',
  'text/strong': '--text-strong',
  'text/weak': '--text-weak',
  'point/main': '--point-main',
  'point/sub': '--point-sub',
  danger: '--danger',
  warning: '--warning',
};
let state = {
  seed: '#4f6ce0',
  harmony: 'analog',
  mode: 'dark',
  version: 'flat' /* 'flat'(≤10색) | 'enterprise'(≤50색) */,
  screen: 'dash' /* 'dash'(대시보드) | 'dt'(Digital Twin) | 'portal'(준비 중) */,
  subHex: null,
  mapMode: 'auto',
  imgCols: null,
  adjust: { h: 0, s: 0, l: 0 },
  source: 'seed',
  sourceView: 'seed' /* 지금 보이는 색 소스 패널(탭) — 세그먼트가 제어 */,
  overrides: {},
  curpalOpen: false,
  radius: 8,
  /* 화면 만들기 — 화면 종류별로 고른 그리드/와이어프레임을 따로 기억한다. */
  gridBy: { dash: 'g3', dt: 'g3' },
  wireBy: { dash: 'g3-a', dt: 'g3-a' },
};
try {
  const sv = localStorage.getItem('wemb-version');
  if (sv === 'flat' || sv === 'enterprise') state.version = sv;
} catch (e) {}
