/* ACB 진단 팝업 화면(76:597)을 생성기에 더한다 — 한 번만 돌리면 된다(이미 있으면 건너뛴다).

   이 시안의 세 번째 화면은 STATCOM Overview(3:5) **위에 팝업이 얹힌 모습**(Figma 62:1493)이다.
   바탕 화면은 3:5 와 픽셀이 한 점도 다르지 않아(대조 0%) 다시 만들지 않고,
   팝업(76:597)만 한 장으로 만들어 statcom 마크업 뒤에 얹는다.

     · conv.js  SCREENS 에 `76-597 / lsa / lselectric-acb / acb.html` 를 더한다.
     · dl.js    에 그 화면을 더하고, 에셋표를 **덮어쓰지 않고 합치게** 바꾼다
                (3:5·33:748 의 URL 은 7일이면 만료되므로 다시 받지 않는다 — 받으면 404).
                `node dl.js 76-597` 처럼 화면을 골라 받을 수 있다.

   실행: node src/lselectric/_gen/patch-acb.js */
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

/* ── conv.js — 화면 목록 ── */
edit('conv.js', (s) => {
  if (s.includes("key: '76-597'")) return s;
  const anchor = "  { key: '33-748', node: '33:748', px: 'lsd', name: 'Screen/Data Center Overview', out: 'lselectric-datacenter', page: 'datacenter', meta: ['meta-page.xml'] },";
  if (!s.includes(anchor)) throw new Error('conv.js SCREENS 앵커를 못 찾았다');
  return s.replace(anchor, anchor + '\n'
    + "  /* 세 번째 화면 = STATCOM Overview + ACB 진단 팝업(Figma 62:1493). 팝업만 만들고 바탕은 lsm 을 다시 쓴다.\n"
    + "     meta 는 팝업이 생긴 뒤 다시 받은 페이지 덤프(meta-page-2.xml). */\n"
    + "  { key: '76-597', node: '76:597', px: 'lsa', name: 'Popup/ACB - Diagnostics (Stage 1)', out: 'lselectric-acb', page: 'acb', meta: ['meta-page-2.xml'] },");
});

/* ── dl.js — 화면 추가 + 에셋표 합치기 + 고를 수 있게 ── */
edit('dl.js', (s) => {
  let out = s;
  if (!out.includes("'76-597'")) {
    out = out.replace("  '33-748': 'dc-33-748.txt',\n};",
      "  '33-748': 'dc-33-748.txt',\n  '76-597': 'dc-76-597.txt',\n};\n"
      + "/* 인자로 화면 키를 주면 그것만 받는다(옛 화면의 에셋 URL 은 7일이면 만료된다) */\n"
      + "const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));\n"
      + "for (const k of Object.keys(SCREENS)) if (ONLY.length && !ONLY.includes(k)) delete SCREENS[k];");
  }
  if (!out.includes('OLDMAP')) {
    out = out.replace("const jobs = [];",
      "/* 이미 받아 둔 표는 남긴다 — 이번에 받은 화면만 덮어쓴다 */\n"
      + "const MAPP = path.join(__dirname, 'asset-map.json');\n"
      + "const OLDMAP = fs.existsSync(MAPP) ? JSON.parse(fs.readFileSync(MAPP, 'utf8')) : {};\n\n"
      + "const jobs = [];");
    out = out.replace("  const byHash = new Map();     /* sha1 → 파일명 */",
      "  const byHash = new Map();     /* sha1 → 파일명 */\n"
      + "  /* 이미 폴더에 있는 그림도 해시로 알아 둔다 — 같은 그림이면 새 이름으로 또 받지 않는다 */\n"
      + "  for (const f of fs.readdirSync(OUT)) {\n"
      + "    if (!/\\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f) || f.endsWith('-lt.svg')) continue;\n"
      + "    const h = crypto.createHash('sha1').update(fs.readFileSync(path.join(OUT, f))).digest('hex');\n"
      + "    if (!byHash.has(h)) byHash.set(h, f);\n"
      + "  }");
    out = out.replace("  fs.writeFileSync(path.join(__dirname, 'asset-map.json'), JSON.stringify(map, null, 1));",
      "  fs.writeFileSync(MAPP, JSON.stringify(Object.assign({}, OLDMAP, map), null, 1));");
  }
  return out;
});

console.log('\n다음: node dl.js 76-597 → node dedupe-assets.js → node mk-light-assets.js → node conv.js');
