/* 라이트 테마 에셋 사본(-lt.svg)을 **파일마다 정한 색 대응표**로 다시 만든다 — mk-light-assets.js(자동 반전) 뒤에 돌린다.

   왜 — 자동 반전은 '짙은 남색 판'을 회색으로 바꿔 라이트 화면이 흐린 회색 덩어리처럼 보였다(사용자 지적 2026-10-30).
   라이트의 원칙:
   · 카드 · 칩 · 입력칸처럼 '판'인 것은 흰 판(#fff)과 옅은 남색 선으로 — 다크의 짙은 남색 면이 라이트의 흰 면이 된다.
   · 브랜드 · 강조색(파랑 #4571FF · 보라 #7E41FF · 하늘 #00BAFF …)과 그라디언트 선은 그대로 — 색이 곧 이 시안의 얼굴이다.
   · KPI 타일 · 활성 요일 배지 · 유리 아이콘처럼 '색 덩어리 오브젝트'는 원본 그대로(흰 판 위에서도 그대로 산다).
   · 빈 요일 배지 · 꺼진 화살표 같은 '비활성'은 옅은 회청색으로.
   형상(path d · 좌표)은 한 글자도 손대지 않는다 — 색 · 불투명도 값만 바꾼다.
   실행: node mk-light-shinhan.js   (이어서 node conv.js — 유리 그림은 인라인이라 다시 생성해야 반영된다) */
'use strict';
const fs = require('fs'), path = require('path');
const ART = path.join(__dirname, '..');

const KEEP = 'keep';   /* 원본을 그대로 라이트 사본으로 */
const MAP = {
  /* ── 판 ── */
  'background-1.svg': [            /* 보안 위협 등급 경보 띠 — 짙은 남색 그라디언트 면 → 옅은 남보라 면, 선은 그대로 */
    ['#202A90', '#DCE4FD'], ['#2D367A', '#E6EBFC'], ['#394163', '#EEF1FB'], ['#492B51', '#ECE4FA'],
    ['#6EA8D0" stop-opacity="0.5"', '#9DB8F0" stop-opacity="0.35"'],
  ],
  'background-1-2.svg': [          /* 이상징후 검색줄 판 */
    ['fill="#36466F" fill-opacity="0.4"', 'fill="#FFFFFF" fill-opacity="1"'],
  ],
  'rbackground.svg': [             /* 소제목 단추(점검대상부서 · 탐지건수/전일 건수 …) — 흰 알약 + 하늘 선 */
    ['#243658', '#FFFFFF'], ['#223F59', '#F2F6FE'], ['#AEECFF', '#7F9DE0'], ['fill-opacity="0.36"', 'fill-opacity="1"'],
  ],
  'background-3.svg': [['#021828', '#FFFFFF']],   /* KPI 이름표(전월 누적 …) — 흰 이름표 + 원본 그라디언트 선 */
  'background-7.svg': [['#021828', '#FFFFFF']],
  'background-4.svg': KEEP,        /* 일정 카드 — 하늘 · 파랑 그라디언트 면(옅은 불투명도)이라 흰 판에서도 그대로 산다 */
  /* 활성 요일 배지(월 · 화 · 수) — 원본 보라/하늘 그라디언트를 한 톤 짙게(흰 요일 글자가 흰 카드 위에서도 4.5:1) */
  'background-5.svg': [['#3FBBFE', '#1676C6'], ['#A541FF', '#7424D8'], ['fill-opacity="0.15"', 'fill-opacity="0.08"']],
  'background-6.svg': [['#43537C', '#C9D2E6']],   /* 빈 요일 배지(목 · 금) — 비활성 회청 */
  'arrow.svg': KEEP,
  'arrow-1.svg': [['#334269', '#C9D2E6']],        /* 빈 날로 가는 화살표 */
  'pedestal.svg': [['#465783', '#C3D0EE']],       /* KPI 받침 */
  'border.svg': KEEP, 'rborder.svg': KEEP,        /* KPI 유리 테두리 — 흰 유리 그대로 */
  /* ── 유리 아이콘 배지 — 바탕 유리판의 짙은 남색 끝만 중간 남색으로(흰 기호가 흰 카드 위에서도 보이게)(색 덩어리 · 흰 기호는 그대로) ── */
  'icon-badge.svg': [['#06143A', '#5468C4']], 'icon-badge-1.svg': [['#06143A', '#5468C4']],
  'icon-badge-2.svg': [['#06143A', '#5468C4']], 'icon-badge-3.svg': [['#06143A', '#5468C4']],
  'icon-badge-4.svg': [['#06143A', '#5468C4']], 'icon-badge-5.svg': [['#06143A', '#5468C4']],
  'ricon-badge.svg': [['#06143A', '#5468C4']], 'ricon-badge-1.svg': [['#06143A', '#5468C4']], 'ricon-badge-2.svg': [['#06143A', '#5468C4']],
  /* 방패 링 — 링 · 원판은 원본 그대로, 가운데 방패 기호(paint2 #B5E6FF→#B7BCFF, 흰빛)는 옅은 링 위에서 묻혀 짙은 하늘→남보라로 */
  'visual.svg': [['#B5E6FF', '#2D84DB'], ['#B7BCFF', '#4B4FD6']],
  /* ── 선 · 격자 ── */
  'grid-lines.svg': [['#50658C', '#D3DCEE']],
  'grid-lines-1.svg': [['#37476B', '#D6DEEF'], ['#AADEFF', '#8FB2EC']],
  'divider.svg': [['#1F56A0', '#AFBEDF']],        /* 헤더 메뉴 구분선 */
  'divider-1.svg': [['#CFEFFA', '#97A6C6']],      /* 시계 옆 구분선 */
  'divider-1-2.svg': [['#3F4D73', '#BAC5DE']],    /* 검색줄 구분선 */
  'divider-2.svg': KEEP, 'divider-3.svg': KEEP,
  'line.svg': KEEP, 'line-1.svg': KEEP, 'line-2.svg': KEEP, 'timeline.svg': KEEP, 'timeline-1.svg': KEEP,
  /* 트래픽 선 — 표지점 속(짙은 남색) → 흰색, 선 색은 그대로 */
  'line-today-in.svg': [['#08253C', '#FFFFFF']], 'line-today-out.svg': [['#08253C', '#FFFFFF']],
  'line-last-week-in.svg': [['#08253C', '#FFFFFF']], 'line-last-week-out.svg': [['#08253C', '#FFFFFF']],
  /* ── 헤더 · 기타 ── */
  'deco-left.svg': [['#0C205B', '#E2EAFB']], 'deco-right.svg': [['#0C205B', '#E2EAFB']],
  'icon-field-calendar.svg': [['#C9CBFF', '#4F5BC4']],
  'marker.svg': KEEP, 'icon-action-clock.svg': KEEP, 'icon-action-logout.svg': KEEP, 'icon-action-close.svg': KEEP,
  'checkbox-checked.svg': KEEP, 'exclude.svg': KEEP,
};

const table = JSON.parse(fs.readFileSync(path.join(__dirname, 'light-assets.json'), 'utf8'));
let n = 0;
for (const [f, rule] of Object.entries(MAP)) {
  const src = path.join(ART, f);
  if (!fs.existsSync(src)) { console.log('없음', f); continue; }
  let s = fs.readFileSync(src, 'utf8');
  if (rule !== KEEP) {
    for (const [a, b] of rule) {
      const re = new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      if (!re.test(s)) { console.log('  못 찾음', f, a); continue; }
      s = s.replace(re, b);
    }
  }
  /* 유리 아이콘의 흰 기호 — 유리는 뒤를 흐려 비추는데 라이트에서는 뒤가 흰 카드라 유리가 하얗게 뜨고 흰 기호가 묻힌다.
     기호(<path fill="white">)만 주조 파랑으로. <mask fill="white"> · 유리 테두리(stroke="white")는 그대로 둔다. */
  if (/^r?icon-badge/.test(f)) {
    const before = s;
    s = s.replace(/(<path\b[^>]*?)\sfill="white"/g, '$1 fill="#3B4FC4"');
    if (s === before) console.log('  기호 없음', f);
  }
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(ART, lt), s);
  table[f] = lt;
  n++;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(table, null, 1));
console.log('라이트 사본', n, '개 다시 만듦 · 표', Object.keys(table).length, '개');
