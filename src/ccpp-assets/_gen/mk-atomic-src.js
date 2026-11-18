/* 분자 라이브러리(wemb-atomic) 원본 사본 만들기 — 복합화력 설비정보.
   wemb-atomic 은 파일 하나 = 페이지 하나(id = 파일 이름)로 본다. 스튜디오의 src/ccpp-tabs.js 는 탭 조각 3개(ccta · cctb · cctc)를
   한 파일에 담아 그대로 넣으면 세 페이지가 같은 id 로 겹친다 → 사본에서는 조각마다 파일을 나눈다
   (ccpp-tab-design.js · ccpp-tab-equipment.js · ccpp-tab-materials.js, 각자 build_ccX · CCX_CSS · CCX_LIGHT_CSS 만).
   나머지 빌더 · 라이브 · 그림 폴더는 그대로 복사한다(미리보기 html · _gen 은 뺀다).
   실행: node src/ccpp-assets/_gen/mk-atomic-src.js */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const DST = path.join(ROOT, 'wemb-atomic', 'sources', 'WEMB-Studio', 'src');
['ccpp-main', 'ccpp-library', 'ccpp-diagram', 'ccpp-detail', 'ccpp-file-open', 'ccpp-oper', 'ccpp-live'].forEach((f) => fs.copyFileSync(path.join(ROOT, 'src', f + '.js'), path.join(DST, f + '.js')));
const old = path.join(DST, 'ccpp-tabs.js');
if (fs.existsSync(old)) fs.unlinkSync(old);
global.window = {};
require(path.join(ROOT, 'src', 'ccpp-tabs.js'));
const F = global.window.CC_TABS;
Object.keys(F).forEach((k) => {
  const f = F[k], P = f.px.toUpperCase();
  const html = f.html;   /* {{B}} 는 build(base) 가 바꾼다 */
  /* 조각만 그리면 뿌리가 담는 칸(1920 페이지)을 꽉 채워 늘어난다(README 함정 — 신한 OVERLAY_CSS 와 같은 처방).
     라이브에서는 상세 팝업 Content 칸(1010 폭)에 들어간다 → 사본에서만 그 크기로 못 박는다(라이브는 화면 높이에 따라 늘어나므로 원본은 그대로) */
  const PIN = { ccta: ['427:1536', 1010, 861], cctb: ['427:4038', 1010, 909], cctc: ['427:4307', 1010, 909] }[f.px];
  const pin = PIN ? '\n.' + f.px + '-root > [data-node-id="' + PIN[0] + '"]{width:' + PIN[1] + 'px!important;height:' + PIN[2] + 'px!important;}' : '';
  const js = '/* 자동 생성물 — 분자 라이브러리용 사본. 스튜디오 원본은 src/ccpp-tabs.js 의 CC_TABS["' + k + '"] (' + f.name + ').\n'
    + '   생성기: WEMB Studio/src/ccpp-assets/_gen/mk-atomic-src.js */\n'
    + 'window.' + P + '_CSS = ' + JSON.stringify(f.css + pin) + ';\n'
    + 'window.' + P + '_LIGHT_CSS = ' + JSON.stringify(f.light) + ';\n'
    + 'window.build_' + f.px + ' = function (base) { return ' + JSON.stringify(html) + ".split('{{B}}').join(base || 'src/ccpp/'); };\n";
  fs.writeFileSync(path.join(DST, 'ccpp-tab-' + k + '.js'), js);
  console.log('ccpp-tab-' + k + '.js', f.px, html.length);
});
const IMG = path.join(ROOT, 'src', 'ccpp'), DIMG = path.join(DST, 'ccpp');
fs.mkdirSync(DIMG, { recursive: true });
let n = 0;
fs.readdirSync(IMG).forEach((f) => { const p = path.join(IMG, f); if (fs.statSync(p).isFile() && !/\.html$/.test(f)) { fs.copyFileSync(p, path.join(DIMG, f)); n++; } });
console.log('그림', n);
