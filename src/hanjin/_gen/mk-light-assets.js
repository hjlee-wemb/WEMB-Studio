/* 라이트 테마용 에셋 사본 만들기 — src/hanjin/*.svg → *-lt.svg
   화면의 판·선·배경을 그리는 벡터가 '어두운 바탕' 전제라, 라이트에서 그대로 두면 글자가 묻힌다.
   손으로 다시 그리지 않고 **원본 파일의 색만** 역할대로 옮긴 사본을 만든다(형상은 한 점도 안 건드린다).
     · 무채색  : 명도를 뒤집는다(어두운 판 → 밝은 판, 밝은 선 → 어두운 선). 살짝 푸른 회색으로.
     · 아주 어두운 유채색(남색 판 등) : 색상각을 지킨 채 밝은 쪽으로 옮긴다.
     · 그 밖의 유채색(브랜드·상태·차트 계열) : 그대로 둔다 — 색이 곧 의미라서.
   <mask>/<clipPath> 안의 색은 마스크 자체라 건드리지 않는다.
   실행: node src/hanjin/_gen/mk-light-assets.js */
'use strict';
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '..');

function hex2hsl(h) {
  if (h.length === 4) h = '#' + h.slice(1).split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(1, 7), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hh = 0;
  if (d) hh = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const l = (mx + mn) / 2;
  return { h: hh * 60, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
}
function hsl2hex(x) {
  const c = (1 - Math.abs(2 * x.l - 1)) * x.s, hp = x.h / 60, m = x.l - c / 2;
  const q = c * (1 - Math.abs(hp % 2 - 1));
  const t = hp < 1 ? [c, q, 0] : hp < 2 ? [q, c, 0] : hp < 3 ? [0, c, q] : hp < 4 ? [0, q, c] : hp < 5 ? [q, 0, c] : [c, 0, q];
  return '#' + t.map((v) => Math.max(0, Math.min(255, Math.round((v + m) * 255))).toString(16).padStart(2, '0')).join('');
}
function light(hex) {
  const c = hex2hsl(hex);
  /* 거의 무채색(살짝 푸른 UI 회색 포함) — 명도를 뒤집는다 */
  if (c.s < 0.3) return hsl2hex({ h: 218, s: 0.12, l: Math.max(0.06, Math.min(0.98, 1 - c.l * 0.9)) });
  /* 아주 어두운 유채색(남색 판 등) — 색상각을 지킨 채 밝은 쪽으로 */
  if (c.l < 0.3) return hsl2hex({ h: c.h, s: Math.min(0.5, c.s * 0.55), l: 0.88 - c.l * 0.5 });
  /* 밝고 옅은 유채색(연한 하늘빛 하이라이트·연회색 선) — 밝은 바탕에서 사라지므로 어둡게 */
  if (c.l > 0.6 && c.s < 0.6) return hsl2hex({ h: c.h, s: Math.min(0.55, c.s * 0.9), l: 1 - c.l * 0.82 });
  return null;                                         /* 브랜드·상태·차트 계열색은 그대로 */
}

/* `fill="white"` / `fill="black"` 처럼 키워드로 칠한 벡터도 뒤집는다 —
   단, 흰 글리프가 '컬러 배지 위'에 놓인 아이콘은 라이트에서도 흰색이라야 한다(배지는 그대로 컬러라서). */
const KEEP_WHITE = /^(icon-stage-|icon-system-clock)/;
const KEY2HEX = { white: '#ffffff', black: '#000000' };

/* 사본을 아예 만들지 않는 파일 — 겹겹의 luminance 마스크로 그려져 색을 건드리면 그림이 무너진다.
   ramp.svg(도크 상세현황 가운데 램프)가 그렇다: 원본이 중간 회색 선이라 밝은 바탕에서도 그대로 보인다. */
const NO_VARIANT = ['ramp.svg'];

/* <mask>·<clipPath> 안쪽 구간 — 마스크 도형의 색은 의미가 아니라 알파라서 손대면 안 된다 */
function maskRanges(s) {
  const r = [];
  for (const tag of ['mask', 'clipPath']) {
    const re = new RegExp('<' + tag + '[\\s>][\\s\\S]*?</' + tag + '>', 'g');
    let m; while ((m = re.exec(s))) r.push([m.index, m.index + m[0].length]);
  }
  return r;
}

let made = 0, skipped = 0;
const map = {};
for (const f of fs.readdirSync(DIR)) {
  if (!/\.svg$/.test(f) || /-lt\.svg$/.test(f) || NO_VARIANT.indexOf(f) >= 0) continue;
  const s = fs.readFileSync(path.join(DIR, f), 'utf8');
  const mr = maskRanges(s);
  let changed = 0;
  /* DOM 쪽 대응표(light.js)를 여기서 그대로 쓰면 안 된다 — 한 번 해 봤더니 판이 남색으로,
     여섯 번째 프리셋 버튼이 새까맣게 뒤집혔다. 표는 '역할을 아는 CSS 선언'을 전제로 만든 것이라
     fill/stroke 밖에 모르는 그림에는 맞지 않는다. 그림은 아래 heuristic 으로만 옮긴다.
     `&#132;` 같은 문자 참조의 숫자를 색으로 착각하면 안 된다 — Figma 가 한글 레이어명을
     `id="&#227;&#132;&#180;"` 로 내보내는데, 그걸 색으로 바꾸면 XML 이 깨져 그림이 안 뜬다. */
  let o = s.replace(/(?<!&)#[0-9a-fA-F]{6}\b|(?<!&)#[0-9a-fA-F]{3}\b/g, (hex, idx) => {
    if (mr.some(([a, b]) => idx >= a && idx < b)) return hex;
    const n = light(hex);
    if (n) { changed++; return n; }
    return hex;
  });
  o = o.replace(/(stop-color|fill|stroke)="(white|black)"/g, (all, prop, kw, idx) => {
    if (mr.some(([a, b]) => idx >= a && idx < b)) return all;
    if (kw === 'white' && KEEP_WHITE.test(f)) return all;
    const n = light(KEY2HEX[kw]);
    if (!n) return all;
    changed++; return prop + '="' + n + '"';
  });
  if (!changed) { skipped++; continue; }
  fs.writeFileSync(path.join(DIR, f.replace(/\.svg$/, '-lt.svg')), o);
  map[f] = f.replace(/\.svg$/, '-lt.svg');
  made++;
}
fs.writeFileSync(path.join(__dirname, 'light-assets.json'), JSON.stringify(map, null, 1));
console.log('light variants:', made, ' unchanged:', skipped);
