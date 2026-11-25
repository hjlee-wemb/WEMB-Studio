/* 데이터센터 통합 모니터링 — 라이트 그림 사본: src/datacenter/<그림>.svg → <그림>-lt.svg + light-assets.json
   다크 원본 그림 중 '흰 · 옅은 회색 글리프'(흰 판에서 사라지는 것)와 '짙은 판'만 역할별로 다시 칠한다.
   형상 · 좌표 · 필터 · 그라디언트 방향은 한 점도 안 건드린다(색 값만 바꾼다). <mask>/<clipPath> 는 알파라 그대로.
   light.js 의 lightExtra 가 light-assets.json 을 읽어 `img[src$="/원본"]{content:url(사본)}` 을 라이트 시트에 넣는다.
   실행: node mk-light-datacenter.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..', '..', 'datacenter');

const ICON = '#3d5068';      /* 흰 판 위 아이콘(보조 글자색과 같은 단) */
const INK = '#24374e';       /* 단추 위 글리프 */
const LINE = '#9fb2c8';      /* 흰 판 위 가는 선 */

/* 흰 글리프 → 짙은 아이콘. 단, 반투명 흰 면(판)은 옅은 남색 물로 */
const glyph = (c) => [
  [/fill="white" fill-opacity="0\.4"/g, 'fill="#14406e" fill-opacity="0.07"'],
  [/fill="white"/g, 'fill="' + c + '"'],
  [/stroke="white"/g, 'stroke="' + c + '"'],
];
/* 테두리 그라디언트의 흰 끝 → 옅은 회청(흰 판에서 선이 보이게) */
const ringStops = [[/stop-color="white" stop-opacity="0\.2"/g, 'stop-color="#ffffff" stop-opacity="0.6"'], [/stop-color="white"(?! stop-opacity)/g, 'stop-color="#b8c6d8"']];

function rulesFor(f) {
  /* 화면 바탕 빛 번짐 — 짙은 남색 · 보라 웅덩이 → 아주 옅은 하늘 · 연보라, 하늘 빛 · 흰 빛은 그대로 */
  if (/^background-glow/.test(f)) return [
    [/fill="#1F3239"/g, 'fill="#cfe4ee"'], [/fill="#262137"/g, 'fill="#e2def0"'],
    [/stop-color="#222341"/g, 'stop-color="#d6ddf2"'], [/stop-color="#1C46D0"/g, 'stop-color="#8eaaf0"'],
    [/stop-color="#0090CE"/g, 'stop-color="#86d0ee"'], [/stop-color="#00000F"/g, 'stop-color="#eef3f7"'],
  ];
  /* 옆 판 정사각 단추 아이콘(도면정보 · 시나리오 · 설비정보) — 옅은 회색 선 → 짙은 회청 */
  if (/^icon(-1|-1-2|-2)?\.svg$/.test(f)) return [[/#B9BFC9/g, ICON]].concat(glyph(ICON));
  /* 단추 모서리 연필 표시 */
  if (f === 'path.svg' || f === 'path-1-2.svg') return [[/stroke="#5B5D78"/g, 'stroke="#9aa6bb"']].concat(glyph(ICON));
  /* 원형 아이콘 단추(Reset · Play · 로그아웃) — 옅은 하늘 글리프 → 짙은 파랑, 테두리 민트 · 하늘 그라디언트는 한 단 짙게 */
  if (/^icon-button(-1)?\.svg$/.test(f) || /^icon-logout/.test(f)) return [
    [/fill="#DCEDFF"/g, 'fill="#1f5ea8"'], [/stop-color="#B5FFCF"/g, 'stop-color="#2bb57a"'], [/stop-color="#6CB3D9"/g, 'stop-color="#2a7fc0"'],
  ];
  /* 이벤트 목록 · 작업리스트 도구 단추(접기 · 소리 · 전체확인) — 흰 반투명 판 + 흰 글리프 */
  if (/^(event-log-toolbar-button-dark|type-(sound-on|ack-all|arrow-down|arrow-up)-state-default)\.svg$/.test(f)) return [
    [/fill="url\(#(paint0_linear_[0-9_]+)\)" fill-opacity="0\.5"/g, 'fill="url(#$1)" fill-opacity="0.18"'],
  ].concat(ringStops, glyph(INK));
  /* 제목 앞 아이콘(이벤트 현황 · 작업리스트) — 흰 점 + 회색 → 하늘 선 */
  if (f === 'icon-3.svg' || f === 'icon-1-3.svg') return [[/stop-color="#909090"/g, 'stop-color="#9aa6bb"']].concat(glyph(ICON));
  /* 전력 화면 조작 단추(화면 초기화 · 시나리오 초기화) — 검은 판 · 짙은 회색 그라디언트 → 흰 판 · 옅은 회청 */
  if (f === 'path-10.svg') return [
    [/fill="black"/g, 'fill="#ffffff"'], [/stop-color="#30313D"/g, 'stop-color="#e3e9f1"'], [/stop-color="#3F4150"/g, 'stop-color="#f4f7fb"'],
    [/stroke="#434A54"/g, 'stroke="#b8c6d8"'], [/fill="white"/g, 'fill="#c8d5e6"'],
  ];
  /* 자산관리 — 검은 셀렉트 상자 */
  if (f === 'select-category-lv-1.svg') return [
    [/fill="black" fill-opacity="0\.8"/g, 'fill="#ffffff" fill-opacity="1"'], [/stroke="white" stroke-opacity="0\.3"/g, 'stroke="#b8c6d8" stroke-opacity="1"'], [/fill="#D2D2D2"/g, 'fill="' + ICON + '"'],
  ];
  /* 흰 글리프 아이콘(자산 옆 메뉴 · 탭 닫기 · 홈 · 화살표 · 사람) */
  if (/^(icon-menu|icon-paper|icon-home|icon-close|separator|path-1-3|dot-2|dot-1-2|icon-8|chevron|path-9|path-4-2)\.svg$/.test(f)) return [[/#D2D2D2/g, ICON]].concat(glyph(ICON));
  /* 흰 가는 선(표 칸 · 헤더 구분) */
  if (/^(divider-2|divider-5|divider-6|header-divider|column-divider)\.svg$/.test(f)) return glyph(LINE);
  /* 왼쪽 판 구분선(점선 · 실선) — 짙은 보라 → 판 테두리와 같은 옅은 회청(light-palette BORDER '#373662') */
  if (/^divider(-buttons|-section|-title|-9)?.svg$/.test(f)) return [[/stroke="#373662"/g, 'stroke="#b9c7d8"']];
  /* 팝업 제목 앞 ○ · 단추 아이콘(맵이동 · 검색 돋보기) — 흰 글리프가 밝은 제목 띠 · 단추에서 사라졌다 */
  if (/^(bullet|bullet-2|dot-3|icon-9|path-1-4).svg$/.test(f)) return [[/#868686/g, '#7a8aa0']].concat(glyph(ICON));
  /* 설비 검색 표 머리 칸 구분(흰 막대) */
  if (f === 'divider-3-2.svg') return glyph(LINE);
  /* 설비 검색 표 머리 띠(거의 검정 #0A0A11) — 파란 머리 글자가 검은 띠에 묻혔다 → 옅은 회청 띠 */
  if (f === 'path-12.svg') return [[/fill="#0A0A11"/g, 'fill="#e3eaf4"']];
  /* 헤더 메뉴 사이 짧은 막대(옅은 하늘) */
  if (f === 'division.svg' || f === 'divider-3.svg') return [[/#91CBE9/g, '#8fa8c4']];
  return null;
}

const map = {};
let n = 0;
for (const f of fs.readdirSync(DIR).filter((x) => /\.svg$/.test(x) && !/-lt\.svg$/.test(x)).sort()) {
  const rules = rulesFor(f);
  if (!rules) continue;
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
  /* <mask> · <clipPath> 안은 그대로 */
  const keep = [];
  let body = src.replace(/<(mask|clipPath)[\s\S]*?<\/\1>/g, (m) => { keep.push(m); return '\u0000' + (keep.length - 1) + '\u0000'; });
  for (const [re, to] of rules) body = body.replace(re, to);
  body = body.replace(/\u0000(\d+)\u0000/g, (m, i) => keep[+i]);
  if (body === src) { console.log('! 바뀐 색 없음', f); continue; }
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, lt), body);
  map[f] = lt;
  n++;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('라이트 사본', n, '장 →', Object.keys(map).join(' '));
