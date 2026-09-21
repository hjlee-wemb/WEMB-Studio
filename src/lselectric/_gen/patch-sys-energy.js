/* 네 · 다섯 번째 화면 — 계통 진단(89:2000 · 팝업 76:875)과 에너지 진단(89:2927 · 팝업 94:5015)을 생성기에 더한다.
   (한 번만 돌린다. 이미 들어가 있으면 건너뛴다.)

   두 화면 모두 ACB 진단(62:1493)과 같은 꼴이다 — STATCOM Overview(3:5) 위에 같은 자리(33,117 · 1855x846)로 팝업이 떠 있고,
   팝업 밖은 62:1493 과 픽셀차 0%(대조로 확인). 그래서 바탕은 다시 만들지 않고 팝업만 만들어 얹는다.

     · conv.js  SCREENS 두 줄(층 번호 2·3 — 익명 클래스가 바탕·다른 팝업과 겹치지 않게)
                겹친 팝업 뿌리·자리에 공통 클래스 `ls-pop` · `ls-popmount` 를 더 단다 — 라이브·스튜디오가
                팝업 종류를 몰라도 한 선택자로 잡는다(ACB 는 .lsa-root 만 알던 것을 넓힌다).
     · dl.js    두 화면을 더한다(`node dl.js 76-875 94-5015`).
   meta 는 화면 프레임 덤프(meta-89-2000.xml · meta-89-2927.xml, get_metadata 원문 그대로).

   실행: node src/lselectric/_gen/patch-sys-energy.js */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;

function edit(file, fn) {
  const p = path.join(GEN, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) { console.log('건너뜀(이미 됨):', file); return; }
  fs.writeFileSync(p, after);
  console.log('고침:', file);
}
function rep(s, find, val) {
  if (s.indexOf(find) < 0) throw new Error('앵커 없음: ' + find.slice(0, 100));
  return s.replace(find, () => val);
}

edit('conv.js', (s) => {
  if (!s.includes("key: '76-875'")) {
    const anchor = "    overlay: { base: 'lsm', baseOut: 'lselectric-statcom', build: 'build_lsm_acb', left: 33, top: 117, w: 1855, h: 846 } },";
    s = rep(s, anchor, anchor + '\n'
      + "  /* 네 번째 = STATCOM + 계통 진단 팝업(Figma 89:2000 · 팝업 76:875). 자리·크기는 ACB 와 같다. */\n"
      + "  { key: '76-875', node: '76:875', px: 'lsy', name: 'Popup/ACB - System (Stage 1)', out: 'lselectric-system', page: 'system', meta: ['meta-89-2000.xml'], layer: 2,\n"
      + "    overlay: { base: 'lsm', baseOut: 'lselectric-statcom', build: 'build_lsm_system', left: 33, top: 117, w: 1855, h: 846 } },\n"
      + "  /* 다섯 번째 = STATCOM + 에너지 진단 팝업(Figma 89:2927 · 팝업 94:5015). */\n"
      + "  { key: '94-5015', node: '94:5015', px: 'lse', name: 'Popup/ACB - Energy (Stage 1)', out: 'lselectric-energy', page: 'energy', meta: ['meta-89-2927.xml'], layer: 3,\n"
      + "    overlay: { base: 'lsm', baseOut: 'lselectric-statcom', build: 'build_lsm_energy', left: 33, top: 117, w: 1855, h: 846 } },");
  }
  /* 공통 클래스 — 팝업 종류와 상관없이 라이브·스튜디오가 한 선택자로 잡는다 */
  if (!s.includes('ls-popmount')) {
    s = rep(s, "      '    m.className = \\'' + PX + '-mount\\';',",
      "      '    m.className = \\'' + PX + '-mount ls-popmount\\';',");
    s = rep(s, "      '    m.innerHTML = \\'<div class=\"' + PX + '-root\">\\' + window.build_' + PX + '(base) + \\'</div>\\';',",
      "      '    m.innerHTML = \\'<div class=\"' + PX + '-root ls-pop\">\\' + window.build_' + PX + '(base) + \\'</div>\\';',");
  }
  return s;
});

edit('dl.js', (s) => {
  if (s.includes("'76-875'")) return s;
  return rep(s, "  '76-597': 'dc-76-597.txt',\n",
    "  '76-597': 'dc-76-597.txt',\n  '76-875': 'dc-76-875.txt',\n  '94-5015': 'dc-94-5015.txt',\n");
});

console.log('\n다음: node dl.js 76-875 94-5015 → node strip-gama.js → node dedupe-assets.js → node mk-light-assets.js → node conv.js');
