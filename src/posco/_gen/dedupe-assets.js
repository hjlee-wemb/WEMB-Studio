/* 화면을 여러 장 받으면 **같은 그림이 화면마다 다른 파일**로 쌓인다 — 고르게 만든다.

   왜 생기나 — design context 는 화면마다 새로 내보내므로 SVG 안의 그라디언트·필터 id 번호가
   (`paint0_linear_0_1328` ↔ `paint0_linear_0_1344`) 매번 다르다. dl.js 는 **내용 해시**로 중복을
   지우므로 이 번호 차이만으로 다른 파일이 되어 `btn-ack-bg-2.svg`, `-3.svg` … 가 줄줄이 쌓인다.
   그림은 한 점도 다르지 않다.

   무엇을 하나 — id 번호만 지운 '정규형'이 같으면 한 파일로 모으고(가장 먼저 받은 이름을 남긴다)
   asset-map.json 의 참조를 그 이름으로 바꾼 뒤 나머지 파일(과 그 -lt 사본)을 지운다.
   PNG 등 이진 파일은 정규화 없이 내용 해시가 같을 때만 모은다(dl.js 가 이미 한 일이라 보통 안 걸린다).

   실행: node src/posco/_gen/dedupe-assets.js [--dry] */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const GEN = __dirname;
const ART = path.join(GEN, '..');
const DRY = process.argv.includes('--dry');

/* SVG 정규형 — 그림에 영향을 주지 않는 것만 지운다 */
function normSvg(s) {
  return s
    .replace(/isolation:isolate;?/g, '')            /* mk-blend-fix 가 더한 속성 */
    .replace(/_\d+_\d+\b/g, '_N')                   /* paint0_linear_0_1328 → paint0_linear_N */
    .replace(/\s+/g, ' ')
    .trim();
}

const files = fs.readdirSync(ART).filter((f) => /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f) && !f.endsWith('-lt.svg'));
const groups = new Map();                            /* 정규형 해시 → [파일…] */
for (const f of files) {
  const p = path.join(ART, f);
  const buf = fs.readFileSync(p);
  const key = f.toLowerCase().endsWith('.svg')
    ? 'svg:' + crypto.createHash('sha1').update(normSvg(buf.toString('utf8'))).digest('hex')
    : 'bin:' + crypto.createHash('sha1').update(buf).digest('hex');
  (groups.get(key) || groups.set(key, []).get(key)).push(f);
}

/* 남길 이름 — 번호 꼬리표(-2, -3 …)가 없는 쪽, 그다음 짧은 쪽, 그다음 사전순 */
const rank = (f) => [/-\d+\.\w+$/.test(f) ? 1 : 0, f.length, f];
const canon = new Map();                             /* 지울 파일 → 남길 파일 */
for (const list of groups.values()) {
  if (list.length < 2) continue;
  const keep = list.slice().sort((a, b) => {
    const A = rank(a), B = rank(b);
    return A[0] - B[0] || A[1] - B[1] || (A[2] < B[2] ? -1 : 1);
  })[0];
  for (const f of list) if (f !== keep) canon.set(f, keep);
}

/* asset-map.json 의 참조를 바꾼다 */
const mapPath = path.join(GEN, 'asset-map.json');
const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
let rewired = 0;
for (const scr of Object.keys(map)) {
  for (const v of Object.keys(map[scr])) {
    const to = canon.get(map[scr][v]);
    if (to) { map[scr][v] = to; rewired++; }
  }
}
/* 아직 어딘가에서 쓰는 파일은 지우지 않는다(안전장치) */
const used = new Set();
for (const scr of Object.keys(map)) for (const v of Object.keys(map[scr])) used.add(map[scr][v]);

let removed = 0;
for (const f of canon.keys()) {
  if (used.has(f)) continue;
  if (!DRY) {
    fs.unlinkSync(path.join(ART, f));
    const lt = f.replace(/\.svg$/, '-lt.svg');
    if (lt !== f && fs.existsSync(path.join(ART, lt))) fs.unlinkSync(path.join(ART, lt));
  }
  removed++;
}
if (!DRY) fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
console.log((DRY ? '[미리보기] ' : '') + '같은 그림 묶음', [...new Set(canon.values())].length,
  '· 참조 고침', rewired, '· 지운 파일', removed, '· 남은 그림', files.length - removed);
