/* 캔버스에서 바로 뽑은 그림으로 갈아 끼우는 자리 — `NODE_CSS` 를 conv.js 에 더한다.

   왜 필요한가 — get_design_context 는 **원격 컴포넌트의 마스터 기본 그림**을 내보낼 때가 있다.
   자산정보현황 제목의 아이콘이 그랬다: 캔버스에는 '목록(줄 세 개)' 글리프(svg-section02)가 놓여 있는데
   design context 는 마스터 기본인 '위치 핀'(svg-section01)을 내보냈다. Figma 렌더와 픽셀 대조를 하다 찾았다.
   → 손으로 그리지 않고 **그 노드를 캔버스에서 SVG 로 내보내(exportAsync)** 파일로 두고,
     CSS `content:url()` 로 갈아 끼운다(자리·크기도 캔버스 값 그대로).

   실행: node src/posco/_gen/patch-canvas-asset.js */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;
const ART = path.join(GEN, '..');
const p = path.join(GEN, 'conv.js');

/* ── ① 캔버스에서 내보낸 글리프(Figma I2:18449;199:6536;67:425 svg-section02, 10.81 x 9.006) ── */
const GLYPH = `<svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0V2.70245H10.8098V0H0ZM4.32391 1.80163H1.08098V0.900815H4.32391V1.80163ZM9.18976 1.80163C8.88997 1.80163 8.64783 1.59985 8.64783 1.35002C8.64783 1.1002 8.88997 0.898413 9.18976 0.898413C9.48955 0.898413 9.73169 1.1002 9.73169 1.35002C9.73169 1.59985 9.48667 1.80163 9.18976 1.80163Z" fill="url(#paint0_linear_59_5474)"/>
<path d="M0.000183105 3.15161V5.85406H10.81V3.15161H0.000183105ZM4.3241 4.95084H1.08116V4.05002H4.3241V4.95084ZM9.18994 4.95324C8.89015 4.95324 8.64801 4.75146 8.64801 4.50163C8.64801 4.25181 8.89015 4.05243 9.18994 4.05243C9.48973 4.05243 9.73187 4.25421 9.73187 4.50163C9.72899 4.75146 9.48685 4.95324 9.18994 4.95324Z" fill="url(#paint1_linear_59_5474)"/>
<path d="M0.000183105 6.30322V9.00567H10.81V6.30322H0.000183105ZM4.3241 8.10485H1.08116V7.20404H4.3241V8.10485ZM9.18994 8.10485C8.89015 8.10485 8.64801 7.90307 8.64801 7.65324C8.64801 7.40342 8.89015 7.20164 9.18994 7.20164C9.48973 7.20164 9.73187 7.40342 9.73187 7.65324C9.72899 7.90307 9.48685 8.10485 9.18994 8.10485Z" fill="url(#paint2_linear_59_5474)"/>
<defs>
<linearGradient id="paint0_linear_59_5474" x1="5.40489" y1="0" x2="5.40489" y2="2.70245" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="white" stop-opacity="0"/>
</linearGradient>
<linearGradient id="paint1_linear_59_5474" x1="5.40508" y1="3.15161" x2="5.40508" y2="5.85406" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="white" stop-opacity="0"/>
</linearGradient>
<linearGradient id="paint2_linear_59_5474" x1="5.40508" y1="6.30322" x2="5.40508" y2="9.00567" gradientUnits="userSpaceOnUse">
<stop stop-color="white"/>
<stop offset="1" stop-color="white" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>
`;
fs.writeFileSync(path.join(ART, 'svg-section-02.svg'), GLYPH);
console.log('wrote src/posco/svg-section-02.svg');

/* ── ①-b 제목 밑줄 — design context 가 준 것은 viewBox 549.656 인데 캔버스 노드는 517 이다.
      `preserveAspectRatio="none"` 로 늘여 그리므로 viewBox 가 다르면 쐐기가 짧게 끝나 밑줄이
      일찍 사라진다(Figma 렌더는 판을 가로질러 이어진다). 캔버스에서 내보낸 것으로 바꾼다. ── */
const LINE = `<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="517" height="22" viewBox="0 0 517 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<g id="line" filter="url(#filter0_dd_58_5481)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M538.656 12H9V10L538.656 12Z" fill="url(#paint0_linear_58_5481)" shape-rendering="crispEdges"/>
</g>
<defs>
<filter id="filter0_dd_58_5481" x="-1" y="0" width="549.656" height="22" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset/>
<feGaussianBlur stdDeviation="1"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.00392157 0 0 0 0 0.431373 0 0 0 0 0.921569 0 0 0 0.6 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_58_5481"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset/>
<feGaussianBlur stdDeviation="5"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.00392157 0 0 0 0 0.431373 0 0 0 0 0.921569 0 0 0 1 0"/>
<feBlend mode="normal" in2="effect1_dropShadow_58_5481" result="effect2_dropShadow_58_5481"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_58_5481" result="shape"/>
</filter>
<linearGradient id="paint0_linear_58_5481" x1="9" y1="12.5" x2="728.964" y2="12.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#004BFF"/>
<stop offset="1" stop-color="#004BFF" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>
`;
fs.writeFileSync(path.join(ART, 'line.svg'), LINE);
console.log('wrote src/posco/line.svg (캔버스 내보내기로 교체)');

/* ── ② conv.js 에 NODE_CSS 를 더한다(CSS 끝에 붙는다) ── */
let s = fs.readFileSync(p, 'utf8');
if (s.indexOf('NODE_CSS') >= 0) { console.log('conv.js 는 이미 반영돼 있다'); process.exit(0); }
const nl = s.indexOf('\r\n') >= 0 ? '\r\n' : '\n';

const table = [
  '',
  '/* 캔버스에서 바로 뽑은 그림으로 갈아 끼우는 자리 — 생성기 _gen/patch-canvas-asset.js 주석 참고.',
  '   {{PX}} 는 화면 접두어, {{B}} 는 에셋 폴더로 치환된다. */',
  'const NODE_CSS = [',
  '  /* 자산정보현황 제목 아이콘 — 캔버스는 목록 글리프(svg-section02)인데 design context 는',
  '     마스터 기본인 위치 핀(svg-section01)을 내보냈다. 자리·크기도 캔버스 값 그대로. */',
  '  \'.{{PX}}-root .nI2_18449_199_6536_67_215{width:10.81px;height:9.006px;margin-left:6.287px;margin-top:3.584px;}\',',
  '  \'.{{PX}}-root .nI2_18449_199_6536_67_215 img{content:url("{{B}}svg-section-02.svg");width:100%;height:100%;}\',',
  '];',
].join(nl);

const anchor = /(\nconst results = SCREENS\.map\(buildScreen\);)/;
if (!anchor.test(s)) throw new Error('앵커를 못 찾았다');
s = s.replace(anchor, (m) => nl + table + m);

/* CSS 조립부에 이어 붙인다 */
const cssRe = /( *const CSS = BASE_CSS\(PX\) \+ '\\n' \+ r\.rules\.join\('\\n'\);)/;
if (!cssRe.test(s)) throw new Error('CSS 조립부를 못 찾았다');
s = s.replace(cssRe, (m, line) =>
  line + nl + "  const NODE_RULES = NODE_CSS.map(function (x) { return x.split('{{PX}}').join(PX); }).join('\\n');");
s = s.replace(/const CSS = BASE_CSS\(PX\) \+ '\\n' \+ r\.rules\.join\('\\n'\);/,
  () => "const CSS0 = BASE_CSS(PX) + '\\n' + r.rules.join('\\n');");
s = s.replace(/( *const NODE_RULES = [^\n]*)/, (m) => m + nl + "  const CSS = CSS0 + '\\n' + NODE_RULES;");

fs.writeFileSync(p, s);
console.log('patched conv.js — NODE_CSS');
