/* 스마트 빌딩 에너지 관리 — 라이트 그림 사본: src/bems/<그림>.svg → <그림>-lt.svg + light-assets.json
   다크 원본 그림 중 '흰 · 옅은 회색 글리프'(흰 판에서 사라지는 것)와 '짙은 판'만 역할별로 다시 칠한다(다크 → 라이트 원칙: 모양 그대로 색만).
   형상 · 좌표 · 필터 · 그라디언트 방향은 한 점도 안 건드린다. <mask>/<clipPath> 는 알파라 그대로.
   3D 렌더 · 바탕 사진 · 건물 아이콘(사진 + 면) · 차트 선/면 · 슬라이더 색은 뜻이 있는 색이라 그대로 둔다.
   light.js 의 lightExtra 가 light-assets.json 을 읽어 `img[src$="/원본"]{content:url(사본)}` 을 라이트 시트에 넣는다.
   실행: node mk-light-bems.js → node conv.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');

const ICON = '#3d5068';      /* 흰 판 위 아이콘(보조 글자색과 같은 단) */
const INK = '#24374e';       /* 단추 위 글리프 */
const ACC = '#2457c5';       /* 고른 것 · 강조(주조 파랑의 짙은 단) */

const glyph = (c) => [[/fill="white"/g, 'fill="' + c + '"'], [/stroke="white"/g, 'stroke="' + c + '"']];
function rulesFor(f) {
  /* 헤더 층 선택 판 — 짙은 남색 → 옅은 회청 유리(같은 방향 그라디언트) */
  if (/^background-1(-2)?\.svg$/.test(f)) return [
    [/stop-color="#20283E"/g, 'stop-color="#dbe4f1"'], [/<stop offset="0\.7"\/>/g, '<stop offset="0.7" stop-color="#f3f6fb"/>'],
  ];
  /* 헤더 탭 판 — 검은 60% 판 → 흰 판, 테두리 회청은 한 단 옅게, 고른 탭 빛(파랑)은 그대로 */
  if (/^background-3(-2)?\.svg$/.test(f)) return [
    [/fill="black" fill-opacity="0\.6"/g, 'fill="#ffffff" fill-opacity="0.82"'],
    [/stop-color="#646E8A" stop-opacity="0\.25"/g, 'stop-color="#9fb0c8" stop-opacity="0.35"'], [/stop-color="#646E8A"(?! stop-opacity)/g, 'stop-color="#9fb0c8"'],
  ];
  /* 층 아래 고른 표시(흰 30% 타원) → 주조 파랑 */
  if (/^marker-active(-2)?\.svg$/.test(f)) return glyph(ACC);
  /* 로고 — 흰 판에 W 를 뚫은 모양이라 흰 바탕에서 사라졌다 → 짙은 남색 판 */
  if (f === 'logo.svg') return [[/fill="#FBFBFB" fill-opacity="0\.9"/g, 'fill="#1f3460" fill-opacity="0.95"']];
  /* 설비 · 필터 아이콘(옅은 회색 그라디언트) → 짙은 회청 그라디언트 */
  if (/^icon-(equipment|filter)-/.test(f)) return [[/stop-color="#E4E4E4"/g, 'stop-color="' + ICON + '"'], [/stop-color="#CCCCCC"/g, 'stop-color="' + INK + '"']];
  /* 트리 접힘/펼침 꺾쇠 · 판 접기 » · 돋보기 */
  if (/^icon-action-chevron-(down|right)\.svg$/.test(f)) return glyph(INK);
  if (f === 'icon-action-collapse.svg') return [[/stop-color="white"/g, 'stop-color="' + INK + '"'], [/stop-color="#C4C4C4"/g, 'stop-color="' + ICON + '"']];
  if (f === 'icon-action-search.svg') return [[/fill="#C9C9C9"/g, 'fill="' + ICON + '"']];
  /* 고른 자산 점(흰 동그라미) → 주조 파랑 */
  if (f === 'bullet-1.svg') return glyph(ACC);
  /* 11-25 깊이감: 범례 밑줄 · 이벤트 줄 구분선 · 메타 구분 막대 — 짙은 슬레이트 선이 흰 판에서 도드라졌다 → 옅은 회청 헤어라인 */
  if (/^divider-1(-2)?\.svg$/.test(f) || f === 'divider-kh.svg') return [[/stroke="#8790AA"/g, 'stroke="#cfd8e6"'], [/stroke="#4F5D85"/g, 'stroke="#cfd8e6"']];
  if (f === 'divider-2-2.svg' || f === 'separator.svg') return [[/stroke="#2F3A51"/g, 'stroke="#e3e9f2"'], [/fill="#4F5D85"/g, 'fill="#c3cfdf"']];
  return null;
}

const map = {};
let n = 0;
for (const f of fs.readdirSync(DIR).filter((x) => /\.svg$/.test(x) && !/-lt\.svg$/.test(x)).sort()) {
  const rules = rulesFor(f);
  if (!rules) continue;
  const src = fs.readFileSync(path.join(DIR, f), 'utf8');
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
