/* 분자 라이브러리(wemb-atomic) 원본 사본 만들기 + 등록 — 스마트 빌딩 에너지 관리(bems).
   wemb-atomic 은 파일 하나 = 페이지 하나(id = 파일 이름)로 본다.
   · 장면 빌더 2개(build_bem · build_bef) + 라이브(bems-live.js)를 그대로 복사한다. 합성 장면은 없다(팝업 없음).
   · 그림 폴더(src/bems)는 미리보기 html · _gen 을 빼고 복사한다.
   · wemb-atomic 쪽 등록(한 번만): atomic-catalog.mjs generatedPattern · familyRuntime, library.mjs FAMILY_LABELS, test 페이지 수(+2) · family 목록.
   실행: node src/bems-assets/_gen/mk-atomic-src.js → wemb-atomic 에서 npm run build · npm test → 서버 재시작 · 측정 → npm run export */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const AT = path.join(ROOT, 'wemb-atomic');
const DST = path.join(AT, 'sources', 'WEMB-Studio', 'src');
const FILES = ['main', 'floor', 'live'].map((s) => 'bems-' + s);
FILES.forEach((f) => fs.copyFileSync(path.join(ROOT, 'src', f + '.js'), path.join(DST, f + '.js')));
let n = 0;
const IMG = path.join(ROOT, 'src', 'bems'), DIMG = path.join(DST, 'bems');
fs.mkdirSync(DIMG, { recursive: true });
fs.readdirSync(IMG).forEach((f) => { const p = path.join(IMG, f); if (fs.statSync(p).isFile() && !/\.html$/.test(f)) { fs.copyFileSync(p, path.join(DIMG, f)); n++; } });
console.log('빌더', FILES.length, '· 그림', n);

function edit(file, marker, pairs) {
  const p = path.join(AT, file);
  let s = fs.readFileSync(p, 'utf8');
  if (s.indexOf(marker) >= 0) { console.log('  (이미 있음)', file); return; }
  for (const [a, b] of pairs) {
    if (s.indexOf(a) < 0) throw new Error('앵커 없음: ' + file + ' ' + a.slice(0, 80));
    s = s.split(a).join(b);
  }
  fs.writeFileSync(p, s);
  console.log('  patched', file);
}
edit('lib/extract/atomic-catalog.mjs', 'bems-(?:main|floor)', [
  ['datacenter-(?:main|power|worker|asset|equipment|card|compact|search|scenario)', 'datacenter-(?:main|power|worker|asset|equipment|card|compact|search|scenario)|bems-(?:main|floor)'],
  ["datacenter: 'datacenter-live.js' }", "datacenter: 'datacenter-live.js', bems: 'bems-live.js' }"],
]);
edit('lib/library.mjs', "bems: '", [
  ["datacenter: '데이터센터 통합 모니터링'", "datacenter: '데이터센터 통합 모니터링', bems: '스마트 빌딩 에너지 관리'"],
]);
edit('test/atomic.test.mjs', "'bems', 'ccpp'", [
  ['assert.equal(catalog.templates.length, 177);', 'assert.equal(catalog.templates.length, 179);'],
  ["['ccpp', 'datacenter',", "['bems', 'ccpp', 'datacenter',"],
  ['assert.equal(Object.keys(L.pages).length, 177);', 'assert.equal(Object.keys(L.pages).length, 179);'],
  ['assert.equal(L.layouts.reduce((s, l) => s + l.pages.length, 0), 177);', 'assert.equal(L.layouts.reduce((s, l) => s + l.pages.length, 0), 179);'],
]);
