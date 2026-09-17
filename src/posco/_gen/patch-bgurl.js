/* background-image 의 에셋 경로에 {{B}}(에셋 폴더)를 붙인다.

   왜 — conv.js 는 `src=` 와 `mask*` 만 `{{B}}` 를 붙이고 있었다. 이 시안은 판 바탕 텍스처를
   `style={{ backgroundImage: `url("${imgBody}") …` }}` 로 받아서, 생성된 CSS 가 `url("body.png")` 가 됐다.
   미리보기(src/posco/main.html)에서는 우연히 맞지만, 스튜디오는 studio.html(저장소 루트)에 CSS 를 얹으므로
   `/body.png` 를 찾아 404 가 난다 → 판 텍스처가 통째로 사라진다.

   실행: node src/posco/_gen/patch-bgurl.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.indexOf('BG_URL_PROPS') >= 0) { console.log('이미 반영돼 있다'); process.exit(0); }
const nl = s.indexOf('\r\n') >= 0 ? '\r\n' : '\n';

const OLD = 'if (/^mask/.test(prop)) val = val.replace(/url\\("([^"]+)"\\)/g, (mm, f) => { usedAssets.add(f); return \'url("{{B}}\' + f + \'")\'; });';
const at = s.indexOf(OLD);
if (at < 0) throw new Error('앵커를 못 찾았다 — conv.js 가 바뀌었는지 확인할 것');
const ind = ' '.repeat(at - s.lastIndexOf('\n', at) - 1);
const NEW = [
  '/* 에셋을 가리키는 url() 에는 에셋 폴더({{B}})를 붙인다 — mask 뿐 아니라 배경도.',
  ind + '   data:/http 로 시작하는 것(인라인 그라디언트 SVG 등)은 그대로 둔다. */',
  ind + 'if (BG_URL_PROPS.test(prop)) val = val.replace(/url\\("([^"]+)"\\)/g, (mm, f) => {',
  ind + '  if (/^(data:|https?:|\\{\\{B\\}\\})/.test(f)) return mm;',
  ind + '  usedAssets.add(f); return \'url("{{B}}\' + f + \'")\';',
  ind + '});',
].join(nl);
s = s.slice(0, at) + NEW + s.slice(at + OLD.length);

/* 상수는 파일 위쪽(FIX_SIZE 같은 설정 근처)에 둔다 */
const anchor = /(\nconst results = SCREENS\.map\(buildScreen\);)/;
s = s.replace(anchor, (m) => nl + 'const BG_URL_PROPS = /^(mask|background|border-image|list-style-image)/;' + m);

fs.writeFileSync(p, s);
console.log('patched conv.js — background-image 에셋 경로');
