/* Screen/FMS Hub — 다크 테마 색 대응표
   ─────────────────────────────────────────────────────────────────────────
   원본(Figma 64:3367)은 Light 시안이다. 여기서는 '형상은 그대로 두고 색만' 뒤집는다.
   conv.js 가 화면 CSS 를 만들 때 이 표를 함께 돌려 `.skh-root[data-theme="dark"]` 오버라이드
   시트를 뽑아낸다(SKHYNIX_HUB_DARK_CSS). 좌표·크기·폰트는 한 줄도 건드리지 않는다.

   항온항습기 상세 화면(src/skhynix-hvac/_gen/dark.js)과 같은 팔레트를 쓴다 — 한 프로젝트의
   두 화면이라 색이 갈리면 안 된다. 여기에만 있는 색(위젯 배경 #f2f4f7, 범례 글자 #575657,
   Yesterday 회색 그라디언트 등)만 더 적었다.

   대비(실측): 표 본문 #a8b0c6 ↔ 행 #171b2c = 7.9:1 · 값 #eceffa ↔ 위젯 #161a2c = 15.1:1
               범례 #c3c8da ↔ 위젯 = 10.4:1 (모두 WCAG AA 이상) */

/* ── 면(배경) ── */
const SURFACE = {
  '#fff': '#171b2c',                      /* 표의 행 · 칩 · AUTO/폴드 버튼 · 등급 배지 · 범례 알약 */
  '#ffffff': '#171b2c',
  '#f2f4f7': '#161a2c',                   /* 위젯 본문 카드 */
  '#eff0fc': '#1e2340',                   /* 표 머리행 */
  '#c4c6ca': '#525a76',                   /* 목록 점 */
  'rgba(255,255,255,0.1)': 'rgba(255,255,255,0.06)', /* Event List 유리 패널 */
  'rgba(240,246,246,0.25)': 'rgba(126,136,196,0.22)',/* 위젯 배지 위 흐림막 */
  'rgba(49,49,49,0.1)': 'rgba(49,49,49,0.1)',        /* 헤더 배지 — 원본 유지 */
};

/* ── 글자 ── */
const TEXT = {
  '#666': '#a8b0c6',      /* 표 본문 */
  '#888': '#9199b1',      /* 단위 · 축 눈금 */
  '#000': '#e9ecf6',      /* 위젯 제목 · 내비 라벨 · 표 머리글 · 칩 값 */
  '#313131': '#eceffa',   /* 측정값 */
  '#828ea4': '#9aa5c0',   /* 칩 라벨 */
  '#3a3679': '#c9c7ff',   /* 항목 라벨 */
  '#c2c1c4': '#8d94ac',
  '#c3c3c3': '#c3c8da',   /* 도넛 범례 보조 글자 */
  '#575657': '#b9c0d4',   /* Today/Yesterday 범례 글자 */
};

/* ── 선 ── */
const BORDER = {
  '#ccc': '#3a4160',                      /* 등급 배지 링 */
  '#dbdbdb': '#2a3049',                   /* 표 테두리·행 구분선 */
  '#c2c1c4': '#39405e',                   /* 표 머리글 칸 구분선 */
  '#4747b9': '#7b78ff',                   /* 표 머리행 위 강조선 */
  '#cdcbd4': '#3d4463',                   /* 범례 알약 테두리 */
  '#fff': 'rgba(255,255,255,0.18)',       /* Event List 4px 테두리 · 배지 링 */
  '#ffffff': 'rgba(255,255,255,0.18)',
  'rgba(115,115,115,0.1)': 'rgba(255,255,255,0.09)', /* 사용량 행 구분선 */
  /* 도넛 범례 점의 테두리는 계열 색 그대로 둔다(#9773ec·#ff698e·#f9bc05 …) */
};

/* ── 그림자(빛 → 어둠) ── */
const SHADOW = {
  'rgba(6,1,7,0.21)': 'rgba(0,0,0,0.5)',
  'rgba(21,31,42,0.1)': 'rgba(0,0,0,0.45)',
  'rgba(44,19,78,0.23)': 'rgba(0,0,0,0.55)',
  'rgba(215,220,235,0.75)': 'rgba(0,0,0,0.5)',
};

/* ── 그라디언트 정지색 ── */
const GRAD = {
  '#ffffff': 'rgba(255,255,255,0.22)',    /* Event List 링 */
  '#f4f4fa': 'rgba(255,255,255,0.10)',
  '#ededf3': 'rgba(255,255,255,0.08)',
  '#e6e6ec': 'rgba(255,255,255,0.06)',
  '#dce1ea': '#39405c',                   /* 칩 값 칸 왼쪽 페이드 */
  /* Yesterday 막대는 원래 진회색이라 어두운 판에서 묻힌다 → 한 단계 밝은 회색으로 */
  '#9f9c9d': '#9aa2b6',
  '#7d7c7d': '#6c7391',
  '#7c7b7c': '#6c7391',
};
/* Today(주황)·브랜드 보라는 의미가 있는 색이라 그대로 둔다 */
const GRAD_KEEP = ['#ffc410', '#f89363', '#a689f0', '#4d77c5', 'rgba(120,129,136,0)', 'rgba(120,129,136,0.6)', '#ededed'];

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
    if (GRAD_KEEP.some((k) => value.indexOf(k) >= 0)) return null;
    let out = value, hit = false;
    Object.keys(GRAD).forEach((k) => {
      const re = new RegExp(k + '(?![0-9a-fA-F])', 'g');
      if (re.test(out)) { out = out.replace(re, GRAD[k]); hit = true; }
    });
    return hit ? out : null;
  }
  return null;
}

/* ── 표로는 못 담는 것들(이미지·에셋 톤) ── */
const D = '.skh-root[data-theme="dark"] ';
const EXTRA = [
  '/* 바탕 — 밝은 보케 사진을 끄고 같은 구도의 어두운 그라디언트로 바꾼다 */',
  D + '.n64_3369 > img{display:none;}',
  D + '.n64_3369{background:'
    + 'radial-gradient(110% 85% at 50% 44%,#1d2549 0%,rgba(29,37,73,0) 62%),'
    + 'radial-gradient(80% 70% at 12% 14%,#241d47 0%,rgba(36,29,71,0) 58%),'
    + 'radial-gradient(80% 80% at 90% 86%,#12203c 0%,rgba(18,32,60,0) 60%),'
    + 'linear-gradient(160deg,#0b0e1c 0%,#0d1122 45%,#0a0d18 100%);}',
  D + '.n64_3367{background-color:#0a0d18;}',
  '/* 보케 오버레이(mix-blend-screen)는 어두운 바탕에서 훨씬 세게 튄다 → 세기·채도를 낮춘다 */',
  D + '.n64_3372,' + D + '.n64_3373{opacity:.24;filter:saturate(.72);}',
  '/* Glow(64:3370·64:3371)는 그라디언트가 아니라 단색 원(#EBF0F4)이다 —',
  '   어두운 바탕에서는 원의 경계가 그대로 드러나므로 원형 마스크로 가장자리를 지운다. */',
  D + '.n64_3370,' + D + '.n64_3371{opacity:.3;'
    + '-webkit-mask:radial-gradient(circle at 50% 50%,#000 32%,rgba(0,0,0,.5) 56%,transparent 74%);'
    + 'mask:radial-gradient(circle at 50% 50%,#000 32%,rgba(0,0,0,.5) 56%,transparent 74%);}',
  '/* 3D 칩 렌더와 둘레 파티클은 원래 어두운 배경을 전제로 그린 그림이라 그대로 두고 살짝만 눌러 준다 */',
  D + '.n64_3374{filter:brightness(.94);}',
  '/* 회색 선 에셋(격자·구분선·유도선·범례 구분선)은 어두운 면에서 상대적으로 밝다 → 톤만 낮춘다 */',
  D + '.n64_3627,' + D + '.n64_3628,' + D + '.n64_3698{opacity:.3;}',
  D + '.n64_3514{opacity:.5;}',
  D + '.n64_3418{opacity:.55;}',
  D + '.n64_3873,' + D + '.n64_3903{opacity:.45;}',
  '/* 미니 막대차트의 바탕 격자(#DEE1E5 60%)는 어두운 판에서 밝은 블록으로 보인다.',
  '   전체에 filter 를 걸면 위에 얹힌 계열 선까지 같이 어두워지므로, 격자 색만 바꾼 사본으로 교체한다. */',
  D + '.n64_3531 img{content:url("{{B}}mini-chart-dark.svg");}',
  D + '.n64_3548 img{content:url("{{B}}mini-chart-1-dark.svg");}',
  D + '.n64_3565 img{content:url("{{B}}mini-chart-2-dark.svg");}',
  '/* 센터 온도 게이지 — 흰 반원 판 위의 검은 바늘 구조라 어두운 판에서는 판이 튀고 바늘이 묻힌다.',
  '   라이브 레이어(skhynix-hub-live.js)가 인라인 SVG 로 바꿔 넣으므로 안쪽 요소를 직접 칠한다.',
  '   인라인 전 <img> 상태를 위한 폴백도 같이 둔다. */',
  D + '[id="skh-Needle"] svg [id$="-Vector"] path{fill:#242a44;}',
  D + '[id="skh-Needle"] svg [id$="-Vector_2"] path{fill:#dfe3f2;}',
  D + '[id="skh-Needle"] svg [id$="-Vector_3"]{stroke:#dfe3f2;}',
  D + '[id="skh-Needle"] img{filter:invert(.86) hue-rotate(180deg);}',
  '/* AUTO 라디오 — 흰 알약이 어두워졌으므로 점과 바탕을 뒤집는다(인라인 SVG) */',
  D + '[id="skh-Radio"] svg rect:first-of-type{fill:#2a3050;}',
  D + '[id="skh-Radio"] svg .skh-radio-dot{fill:#e9ecf6;}',
  '/* 어제(회색) 꺾은선은 어두운 판에서 묻힌다 → 한 단계 밝게 */',
  D + '.n64_3632 svg [id$="-Plot Line"]{stroke:#8d95ad;}',
  D + '.n64_3632 svg ellipse{fill:#8d95ad;}',
  D + '.n64_3632 img{filter:brightness(1.35);}',
];

module.exports = { darkDecl, EXTRA };
