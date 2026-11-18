/* 라이트 그림 사본 — src/indpark/*.svg → *-lt.svg + light-assets.json
   자동 뒤집기 대신 파일 역할별로 다시 칠한다(형상 · 좌표 · 필터는 한 점도 안 건드린다).
   <mask>/<clipPath> 안의 색은 알파라서 그대로 둔다. 화면 바탕 사본(screen-main-lt.jpg)은 mk-light-bg.ps1 이 만든다.
   실행: node mk-light-indpark.js */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '..');

const ICON = '#3d5068';      /* 흰 판 위 아이콘(보조 글자색과 같은 단) */
const INK = '#0f2238';

/* 파일별 다시 칠하기 — [정규식, 바꿀 값] 목록. 위에서부터 차례로 적용 */
function rulesFor(f) {
  /* 헤더 원형 단추(메뉴 · 로그아웃) — 흰 20% 원 → 옅은 남색 물 + 짙은 아이콘 */
  if (/^button-(menu|logout)/.test(f)) return [
    [/fill="white" fill-opacity="0\.2"/g, 'fill="#14406e" fill-opacity="0.08"'],
    [/fill="white"/g, 'fill="' + ICON + '"'],
  ];
  /* 상단 내비 — 켠 항목은 검은 알약 + 하늘 빛 → 흰 알약 + 하늘 빛 + 파란 아이콘, 끈 항목은 짙은 아이콘 */
  /* nav-item-operation-overview.svg 는 끈 상태인데도 검은 알약이 깔려 있다(다크 바에선 안 보인다) → 라이트는 거의 투명하게 */
  if (f === 'nav-item-operation-overview.svg') return [[/fill="black"/g, 'fill="#14406e" fill-opacity="0.04"'], [/stroke="white"/g, 'stroke="' + ICON + '"']];
  if (/^nav-item-/.test(f)) return /-active/.test(f) ? [
    [/fill="black"/g, 'fill="#ffffff"'],
    [/stroke="white"/g, 'stroke="#0a6fd0"'],
  ] : [
    [/stroke="white"/g, 'stroke="' + ICON + '"'],
  ];
  /* 로고 칩 — 흰 칩(W 를 오려 낸) → 짙은 남색 칩 */
  if (/^logo-chip/.test(f)) return [[/fill="white"/g, 'fill="' + INK + '"']];
  /* 검색 원 · 검색 단추 — 흰 35% 원(돋보기를 오려 낸) → 짙은 회청 35% */
  if (/^(icon-search|button-search)/.test(f)) return [[/fill="white"/g, 'fill="#2f4867"']];
  /* 흰 선 · 흰 아이콘 */
  if (/^(icon-caret|icon-chevron|icon-sort|grid-line-1\.svg|grid-line-3|grid-line\.svg)/.test(f)) return [
    [/(fill|stroke)="white"/g, '$1="' + ICON + '"'],
  ];
  /* 장비 아이콘(진동 · 온도) — 남색 선 위 흰 50% 선을 덧그린 것 → 흰 덧선을 보조색으로 */
  if (/^icon-[12]\.svg$/.test(f)) return [[/stroke="white"/g, 'stroke="#7a8aa0"']];
  /* 목록 화살표(Part) 흰 50% → 보조색 */
  if (/^part-(1-2|4)\.svg$/.test(f)) return [[/fill="white"/g, 'fill="' + ICON + '"']];
  /* 이벤트 로그 목록 점(Bullet) — 흰 20% 알 → 남색 15% */
  if (f === 'bullet-6.svg') return [[/fill="white" fill-opacity="0\.2"/g, 'fill="#14406e" fill-opacity="0.15"']];
  return null;
}

function maskRanges(s) {
  const r = [];
  for (const tag of ['mask', 'clipPath']) {
    const re = new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>', 'g');
    let m; while ((m = re.exec(s))) r.push([m.index, m.index + m[0].length]);
  }
  return r;
}

const map = {};
for (const f of fs.readdirSync(DIR)) {
  if (/-lt\.svg$/.test(f)) { fs.unlinkSync(path.join(DIR, f)); continue; }
  if (!/\.svg$/.test(f)) continue;
  const R = rulesFor(f);
  if (!R) continue;
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');
  const mr = maskRanges(s), inMask = (i) => mr.some(([a, b]) => i >= a && i < b);
  let o = s, n = 0;
  for (const [re, rep] of R) {
    o = o.replace(re, function () {
      const args = Array.prototype.slice.call(arguments);
      const all = args[0], i = args[args.length - 2];
      if (inMask(i)) return all;
      n++;
      return all.replace(re instanceof RegExp ? new RegExp(re.source) : re, rep);
    });
  }
  if (!n) continue;
  const lt = f.replace(/\.svg$/, '-lt.svg');
  fs.writeFileSync(path.join(DIR, lt), o);
  map[f] = lt;
}
/* 래스터 사본 */
['screen-main.png:screen-main-lt.jpg'].forEach((x) => {
  const [a, b] = x.split(':');
  if (fs.existsSync(path.join(DIR, b))) map[a] = b;
});
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light variants:', Object.keys(map).length, Object.keys(map).join(' '));
