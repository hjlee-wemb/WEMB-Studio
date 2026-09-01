/* Screen/HVAC Detail — 다크 테마 색 대응표
   ─────────────────────────────────────────────────────────────────────────
   원본(Figma 64:4059)은 Light 시안이다. 여기서는 '형상은 그대로 두고 색만' 뒤집는다.
   conv.js 가 화면 CSS 를 만들 때 이 표를 함께 돌려 `.skv-root[data-theme="dark"]` 오버라이드
   시트를 뽑아낸다(SKHYNIX_HVAC_DARK_CSS). 좌표·크기·폰트는 한 줄도 건드리지 않는다.

   대응 원칙
   - 역할별로 나눈다: 글자(color) · 면(background) · 선(border) · 그림자.
     같은 #fff 라도 '표의 행 배경'과 '활성 알약 위의 글자'는 다른 색으로 가야 한다.
   - 브랜드·경보색(보라 알약, 도넛 조각, 시계 주황, 상태 점)은 그대로 둔다 — 의미가 있는 색이다.
   - 헤더(64:4067 아래)는 원본이 이미 어두운 띠라 손대지 않는다.
   - 대비: 본문 글자 #a8b0c6 ↔ 행 배경 #171b2c = 7.4:1, 값 글자 #eceffa ↔ 패널 = 14:1
     (모두 WCAG AA 이상. 아래 CONTRAST 주석 참고) */

/* ── 면(배경) ── */
const SURFACE = {
  '#fff': '#171b2c',                      /* 표의 행 · 칩 · AUTO/폴드 버튼 · 툴팁 · 등급 배지 */
  '#ffffff': '#171b2c',
  '#eff0fc': '#1e2340',                   /* 표 머리행 */
  'rgba(255,255,255,0.7)': 'rgba(28,33,54,0.72)',   /* Mode Switch */
  'rgba(249,249,249,0.9)': 'rgba(28,33,54,0.9)',    /* 콜아웃 측정값 알약 */
  'rgba(242,244,247,0.9)': 'rgba(22,26,44,0.86)',   /* 차트·도넛 패널 */
  'rgba(255,255,255,0.1)': 'rgba(255,255,255,0.06)',/* Event List 유리 패널 */
  'rgba(240,246,246,0.25)': 'rgba(126,136,196,0.22)', /* 콜아웃 배지 위 흐림막 */
};

/* ── 글자 ── */
const TEXT = {
  '#666': '#a8b0c6',      /* 표 본문 */
  '#888': '#9199b1',      /* 단위(%, °) */
  '#000': '#e9ecf6',      /* 내비 라벨(항온항습기) */
  '#313131': '#eceffa',   /* 측정값 · 툴팁 숫자 */
  '#828ea4': '#9aa5c0',   /* 칩 라벨 · 표 머리글 */
  '#3a3679': '#c9c7ff',   /* 위젯 제목 · 콜아웃 라벨 · 모드 옵션 */
  '#c2c1c4': '#8d94ac',
};

/* ── 선 ── */
const BORDER = {
  '#ccc': '#3a4160',                      /* 등급 배지 링 */
  '#dbdbdb': '#2a3049',                   /* 표 테두리·행 구분선 */
  '#c2c1c4': '#39405e',                   /* 표 머리글 칸 구분선 */
  '#4747b9': '#7b78ff',                   /* 표 머리행 위 강조선 */
  '#fff': 'rgba(255,255,255,0.18)',       /* Event List 4px 테두리 · Mode Switch/배지 링 */
  '#ffffff': 'rgba(255,255,255,0.18)',
};

/* ── 그림자(빛 → 어둠) ── */
const SHADOW = {
  'rgba(6,1,7,0.21)': 'rgba(0,0,0,0.5)',
  'rgba(21,31,42,0.1)': 'rgba(0,0,0,0.45)',
  'rgba(44,19,78,0.23)': 'rgba(0,0,0,0.55)',
  'rgba(79,73,188,0.2)': 'rgba(0,0,0,0.45)',
  'rgba(0,0,0,0.05)': 'rgba(0,0,0,0.35)',
};

/* ── 그라디언트 정지색 ── */
const GRAD = {
  '#ffffff': 'rgba(255,255,255,0.22)',    /* Event List 링 */
  '#f4f4fa': 'rgba(255,255,255,0.10)',
  '#ededf3': 'rgba(255,255,255,0.08)',
  '#e6e6ec': 'rgba(255,255,255,0.06)',
  '#eef1f5': '#1b2039',                   /* 도넛 가운데 원 */
  '#dce1ea': '#39405c',                   /* 칩 값 칸 왼쪽 페이드 */
};
/* 값을 바꾸지 않는 그라디언트(브랜드·헤더 선) */
const GRAD_KEEP = ['#a689f0', '#4d77c5', 'rgba(120,129,136,0)', 'rgba(120,129,136,0.6)', '#ededed'];

/* 색이 바뀌는 속성만 다룬다 */
function darkDecl(prop, value) {
  if (prop === 'color') return TEXT[value] || null;
  if (prop === 'background-color') return SURFACE[value] || null;
  if (prop === 'border-color') return BORDER[value] || null;
  if (prop === 'box-shadow' || prop === 'filter') {
    let out = value, hit = false;
    Object.keys(SHADOW).forEach((k) => { if (out.indexOf(k) >= 0) { out = out.split(k).join(SHADOW[k]); hit = true; } });
    return hit ? out : null;
  }
  if (prop === 'background-image' || prop === 'background' || prop === 'border-image') {
    if (GRAD_KEEP.some((k) => value.indexOf(k) >= 0) && !/#ffffff|#f4f4fa|#eef1f5|#dce1ea/.test(value)) return null;
    let out = value, hit = false;
    Object.keys(GRAD).forEach((k) => {
      const re = new RegExp(k.replace('#', '#') + '(?![0-9a-fA-F])', 'g');
      if (re.test(out)) { out = out.replace(re, GRAD[k]); hit = true; }
    });
    return hit ? out : null;
  }
  return null;
}

/* ring(::after) 의 `border: Npx solid COLOR` 도 같은 표를 탄다 */
function darkRing(value) {
  const m = value.match(/^([\d.]+px) (\w+) (.+)$/);
  if (!m) return null;
  const c = BORDER[m[3]];
  return c ? m[1] + ' ' + m[2] + ' ' + c : null;
}

/* ── 표로는 못 담는 것들(이미지·에셋 톤) ── */
const EXTRA = [
  '/* 바탕 — 밝은 보케 사진을 끄고 같은 구도의 어두운 그라디언트로 바꾼다(글로우 레이어는 그대로 살린다) */',
  '.skv-root[data-theme="dark"] .n64_4061 > img{display:none;}',
  '.skv-root[data-theme="dark"] .n64_4061{background:'
    + 'radial-gradient(120% 90% at 18% 42%,#1b2445 0%,rgba(27,36,69,0) 62%),'
    + 'radial-gradient(90% 70% at 78% 12%,#241d47 0%,rgba(36,29,71,0) 58%),'
    + 'radial-gradient(80% 80% at 92% 88%,#12203c 0%,rgba(18,32,60,0) 60%),'
    + 'linear-gradient(160deg,#0b0e1c 0%,#0d1122 45%,#0a0d18 100%);}',
  '/* 보케 오버레이(mix-blend-screen)는 어두운 바탕에서 원본보다 훨씬 세게 튄다(밝은 픽셀이 그대로 더해진다)',
  '   → 세기를 낮추고 채도도 눌러 warm 얼룩이 브랜드 색을 밀어내지 않게 한다 */',
  '.skv-root[data-theme="dark"] .n64_4065,.skv-root[data-theme="dark"] .n64_4066{opacity:.24;filter:saturate(.72);}',
  '/* Glow Group(64:4062)은 그라디언트가 아니라 단색 원 두 개(#EBF0F4 40%/50%)다.',
  '   밝은 바탕에서는 테두리가 안 보이지만 어두운 바탕에서는 원의 경계가 그대로 드러난다',
  '   → 가장자리를 부드럽게 지우는 원형 마스크를 씌워 빛무리처럼 보이게 한다. */',
  '.skv-root[data-theme="dark"] .n64_4062{opacity:.34;'
    + '-webkit-mask:radial-gradient(circle at 50% 50%,#000 34%,rgba(0,0,0,.55) 58%,transparent 74%);'
    + 'mask:radial-gradient(circle at 50% 50%,#000 34%,rgba(0,0,0,.55) 58%,transparent 74%);}',
  '/* 회색 선 에셋(격자·구분선·유도선)은 어두운 면에서 상대적으로 밝다 → 톤만 낮춘다 */',
  '.skv-root[data-theme="dark"] .n64_4199,.skv-root[data-theme="dark"] .n64_4200{opacity:.3;}',
  '.skv-root[data-theme="dark"] .n64_4244,.skv-root[data-theme="dark"] .n64_4276,',
  '.skv-root[data-theme="dark"] .n64_4308,.skv-root[data-theme="dark"] .n64_4340{opacity:.35;}',
  '.skv-root[data-theme="dark"] .n64_4379{opacity:.45;}',
  '.skv-root[data-theme="dark"] .n64_4142{opacity:.55;}',
  '/* 흰 바탕을 전제로 그려진 두 에셋만 어두운 판을 따로 쓴다(툴팁 꼬리·AUTO 라디오) */',
  '.skv-root[data-theme="dark"] .n64_4211 img{content:url("{{B}}pointer-dark.svg");}',
  '.skv-root[data-theme="dark"] .n64_4377 img{content:url("{{B}}radio-dark.svg");}',
  '/* 3D 장비 렌더는 밝은 스튜디오 조명이라 어두운 화면에서 붕 뜬다 → 살짝만 눌러 어울리게 */',
  '.skv-root[data-theme="dark"] .n64_4119{filter:brightness(.86) saturate(1.05);}',
  '/* 화면 바탕(Base 이미지 아래) — Base 를 못 그리는 순간에도 어두운 판이 보이게 */',
  '.skv-root[data-theme="dark"] .n64_4059{background-color:#0a0d18;}',
];

module.exports = { darkDecl, darkRing, EXTRA };
