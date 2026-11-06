/* conv.js 보강 ② — 실측으로 찾은 두 가지.
   ① `Widget/3D View` 는 마스크(962x481)로 잘린 묶음인데 CSS inline-grid 는 마스크를 몰라 자식(1033x730)까지 자란다
      → 가운데 열의 이벤트 표가 눌려 줄이 겹쳤다. Figma 상자 크기를 박는다(FIX_SIZE, metadata 의 이름으로 찾는다).
   ② GNB 의 `Icon/User/Logout` — design context 가 아이콘 안쪽 교체(override swap)를 놓쳐 사용자 그림(category-user.svg)을 준다.
      Figma 의 `Icon/User` Type=Logout(17:3333)을 download_assets 로 받은 원본(type-logout.svg)으로 바로잡는다. */
'use strict';
const fs = require('fs'), path = require('path');
const P = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(P, 'utf8');
if (c.includes('/* WNMS_FIX2 */')) { console.log('이미 적용됨'); process.exit(0); }
const rep = (a, b) => { if (!c.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 60)); c = c.replace(a, b); };
rep('const FIX_SIZE = [];', [
  '/* WNMS_FIX2 */',
  "const FIX_SIZE = [...fs.readFileSync(path.join(GEN, 'meta-page.xml'), 'utf8').matchAll(/ id=\"([^\"]+)\" name=\"Widget\\/3D View\"/g)].map((m) => m[1]);"].join('\n'));
rep("  return s.replace(/font-\\[([\"\\'])Inter:/g, 'font-[$1Pretendard:');", [
  "  s = s.replace(/font-\\[([\"\\'])Inter:/g, 'font-[$1Pretendard:');",
  '  /* 로그아웃 아이콘 — 바로 다음 img 의 src 를 원본 그림으로 */',
  "  s = s.replace(/(data-name=\"Icon\\/User\\/Logout\">\\s*<img[^>]*src=\\{)imgCategoryUser\\}/g, '$1imgTypeLogout}');",
  "  if (s.indexOf('imgTypeLogout}') >= 0) s = 'const imgTypeLogout = \"local:type-logout.svg\";\\n' + s;",
  '  return s;'].join('\n'));
fs.writeFileSync(P, c);
/* 에셋 표에 로컬 그림을 더한다 */
const MP = path.join(__dirname, 'asset-map.json');
const map = JSON.parse(fs.readFileSync(MP, 'utf8'));
for (const k of Object.keys(map)) map[k].imgTypeLogout = 'type-logout.svg';
fs.writeFileSync(MP, JSON.stringify(map, null, 1));
console.log('ok');
