/* conv.js 에 '겹쳐 얹는 화면'(overlay) 개념을 더한다 — 한 번만 돌리면 된다.

   세 번째 화면(Figma 62:1493)은 STATCOM Overview(3:5) 위에 ACB 진단 팝업(76:597)이 떠 있는 모습이다.
   바탕은 3:5 와 픽셀이 한 점도 다르지 않으므로(대조 0%) 다시 만들지 않고,
   팝업만 만들어 **바탕 화면의 Screen 프레임 안에** 얹는다. 얹는 자리는 Figma 좌표 그대로(33,117 · 1855x846).

   겹치기 규칙을 한 곳(생성물 모듈)에만 두려고 합치는 함수도 모듈이 들고 있게 한다 —
   미리보기(acb.html)와 스튜디오(js/templates/lselectric.js)가 같은 함수를 쓴다.

   실행: node src/lselectric/_gen/patch-overlay.js */
'use strict';
const fs = require('fs');
const path = require('path');
const P = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(P, 'utf8');
const before = s;

/* ① SCREENS 항목에 overlay 를 적는다 */
s = s.replace(
  "  { key: '76-597', node: '76:597', px: 'lsa', name: 'Popup/ACB - Diagnostics (Stage 1)', out: 'lselectric-acb', page: 'acb', meta: ['meta-page-2.xml'] },",
  "  { key: '76-597', node: '76:597', px: 'lsa', name: 'Popup/ACB - Diagnostics (Stage 1)', out: 'lselectric-acb', page: 'acb', meta: ['meta-page-2.xml'],\n"
  + "    /* 바탕 화면 위에 겹쳐 얹는다 — Figma 62:1493 에서 팝업이 놓인 자리 그대로 */\n"
  + "    overlay: { base: 'lsm', baseOut: 'lselectric-statcom', build: 'build_lsm_acb', left: 33, top: 117, w: 1855, h: 846 } },");

/* ② 겹치는 화면의 CSS·합치는 함수·미리보기 */
if (!s.includes('OVERLAY_CSS')) {
  s = s.replace('const results = SCREENS.map(buildScreen);',
    "/* 겹쳐 얹는 화면 — 얹히는 자리(Figma 좌표)와 '바탕이 비쳐 보이게' 만드는 규칙.\n"
    + "   팝업 제목 바는 반투명(rgba(41,71,110,.8))이라 뿌리가 불투명하면 바탕 화면이 안 비친다. */\n"
    + "const OVERLAY_CSS = (S) => [\n"
    + "  '.' + S.px + '-mount{position:absolute;left:' + S.overlay.left + 'px;top:' + S.overlay.top + 'px;'\n"
    + "    + 'width:' + S.overlay.w + 'px;height:' + S.overlay.h + 'px;z-index:60;}',\n"
    + "  '.' + S.px + '-root{position:absolute;inset:0;background:transparent;z-index:auto;}',\n"
    + "].join('\\n');\n\n"
    + 'const results = SCREENS.map(buildScreen);');

  s = s.replace('  const CSS = CSS0 + \'\\n\' + NODE_RULES;',
    "  const CSS = CSS0 + '\\n' + NODE_RULES + (r.S.overlay ? '\\n' + OVERLAY_CSS(r.S) : '');");

  /* 합치는 함수 — 문자열을 자르지 않고 DOM 으로 심는다(닫는 태그 위치를 추측하지 않으려고) */
  s = s.replace("    '  window.build_' + PX + ' = function (base) { return HTML.split(\\'{{B}}\\').join(base || A); };',",
    "    '  window.build_' + PX + ' = function (base) { return HTML.split(\\'{{B}}\\').join(base || A); };',"
    + "\n    (r.S.overlay ? ["
    + "\n      '  /* 바탕 화면(' + r.S.overlay.base + ') 안에 이 팝업을 얹은 마크업 — 미리보기와 스튜디오가 같이 쓴다.',"
    + "\n      '     문자열을 자르지 않고 DOM 으로 심는다(바탕 마크업의 닫는 자리를 추측하지 않으려고). */',"
    + "\n      '  window.' + r.S.overlay.build + ' = function (base) {',"
    + "\n      '    var d = document.createElement(\\'div\\');',"
    + "\n      '    d.innerHTML = window.build_' + r.S.overlay.base + '(base);',"
    + "\n      '    var frame = d.querySelector(\\'[data-name^=\"Screen/\"]\\') || d.firstElementChild;',"
    + "\n      '    var m = document.createElement(\\'div\\');',"
    + "\n      '    m.className = \\'' + PX + '-mount\\';',"
    + "\n      '    m.setAttribute(\\'data-name\\', ' + JSON.stringify(r.S.name) + ');',"
    + "\n      '    m.innerHTML = \\'<div class=\"' + PX + '-root\">\\' + window.build_' + PX + '(base) + \\'</div>\\';',"
    + "\n      '    frame.appendChild(m);',"
    + "\n      '    return d.innerHTML;',"
    + "\n      '  };',"
    + "\n    ].join('\\n') : ''),");
}

/* ③ 미리보기 — 겹치는 화면은 바탕 모듈까지 싣고 합치는 함수로 그린다 */
if (!s.includes('겹치는 화면 미리보기')) {
  s = s.replace('  const PREVIEW = [', `  /* 겹치는 화면 미리보기 — 바탕 화면 모듈을 함께 싣고 합치는 함수로 그린다(스튜디오와 같은 길) */
  const OV = r.S.overlay;
  const BASE = OV ? results.filter(function (x) { return x.S.px === OV.base; })[0] : null;
  if (OV && !BASE) throw new Error('바탕 화면 ' + OV.base + ' 을(를) 못 찾았다 — SCREENS 순서를 볼 것');
  const BASECSS = BASE ? (BASE_CSS(OV.base) + '\\n' + BASE.rules.join('\\n') + '\\n'
    + NODE_CSS.map(function (x) { return x.split('{{PX}}').join(OV.base); }).join('\\n') + '\\n'
    + ['/* ' + BASE.S.name + ' — 라이트 */'].concat(LIGHT.lightExtra(OV.base, BASE.textured)).concat(BASE.darkRules).join('\\n')) : '';
  const RPX = OV ? OV.base : PX;
  const PREVIEW = [`);

  s = s.replace("    '<style>', CSS.split('{{B}}').join('./'), LIGHT_CSS.split('{{B}}').join('./'),",
    "    '<style>', BASECSS.split('{{B}}').join('./'), CSS.split('{{B}}').join('./'), LIGHT_CSS.split('{{B}}').join('./'),");

  s = s.replace("    '.' + PX + '-fit{position:fixed;inset:0;overflow:hidden;}',\n    '.' + PX + '-stage{position:absolute;inset:0;overflow:hidden;}',\n    '</style></head><body><div class=\"' + PX + '-fit\"><div class=\"' + PX + '-stage\"><div class=\"' + PX + '-root\">',\n    r.html.split('{{B}}').join('./'),\n    '</div></div></div>',",
    "    '.' + RPX + '-fit{position:fixed;inset:0;overflow:hidden;}',\n"
    + "    '.' + RPX + '-stage{position:absolute;inset:0;overflow:hidden;}',\n"
    + "    '</style></head><body><div class=\"' + RPX + '-fit\"><div class=\"' + RPX + '-stage\"><div class=\"' + RPX + '-root\" id=\"lsroot\">',\n"
    + "    OV ? '' : r.html.split('{{B}}').join('./'),\n"
    + "    '</div></div></div>',\n"
    + "    OV ? '<script src=\"../' + BASE.S.out + '.js\"></script>' : '',\n"
    + "    OV ? '<script src=\"../' + r.S.out + '.js\"></script>' : '',\n"
    + "    OV ? '<script>document.getElementById(\"lsroot\").innerHTML = window.' + OV.build + '(\"./\");</script>' : '',");

  /* 테마 토글은 겹친 뿌리까지 함께 바꾼다 */
  s = s.replace("+ 'var q=new URLSearchParams(location.search);if(q.get(\"t\")){r.dataset.theme=q.get(\"t\");tt.style.display=\"none\";}'\n    + 'tt.onclick=function(){r.dataset.theme=r.dataset.theme===\"light\"?\"dark\":\"light\";};})();</script>',",
    "+ 'var rs=[r].concat(Array.prototype.slice.call(document.querySelectorAll(\".' + PX + '-root\")));'\n"
    + "    + 'function set(v){rs.forEach(function(x){if(x)x.dataset.theme=v;});}'\n"
    + "    + 'var q=new URLSearchParams(location.search);if(q.get(\"t\")){set(q.get(\"t\"));tt.style.display=\"none\";}'\n"
    + "    + 'tt.onclick=function(){set(r.dataset.theme===\"light\"?\"dark\":\"light\");};})();</script>',");

  s = s.replace("    '<script>if(new URLSearchParams(location.search).get(\"live\")!==\"0\")window.initLsElectric && window.initLsElectric(document.querySelector(\".' + PX + '-root\"));</script>',",
    "    '<script>if(new URLSearchParams(location.search).get(\"live\")!==\"0\")window.initLsElectric && window.initLsElectric(document.querySelector(\".' + RPX + '-root\"));</script>',");

  s = s.replace("  var r=document.querySelector(\".' + PX + '-root\");'", "  var r=document.querySelector(\".' + RPX + '-root\");'");
  s = s.replace("'<script>(function(){var r=document.querySelector(\".' + PX + '-root\");'", "'<script>(function(){var r=document.querySelector(\".' + RPX + '-root\");'");
}

if (s === before) { console.log('건너뜀(이미 됨)'); process.exit(0); }
fs.writeFileSync(P, s);
console.log('conv.js 에 overlay 지원을 더했다 — 다음: node conv.js');
