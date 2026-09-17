/* 컴포넌트를 부를 때 크기가 사라지던 것 — conv.js 를 넓힌다.

   Figma 출력의 컴포넌트는 뿌리에 `className={className || "relative size-[10px]"}` 를 쓴다.
   호출부가 className 을 넘기면 **기본값(그 안의 크기)이 통째로 버려진다.** 그런데 호출부 className 이
   자리만 정하고 크기를 안 주는 경우가 있다 — 이벤트 등급 배지의 전구(Bulb)가 그렇다:
     <Bulb className="flex items-center justify-center relative shrink-0" property1="bulb-critical" />
   전구 속은 전부 absolute 라 크기를 스스로 못 만든다 → 상자가 0x0 이 되어 **색점이 사라진다**
   (원본은 10x10 원). Figma 렌더와 대조해서 찾았다.

   고치는 규칙(일반):  호출부 className 에 크기 클래스가 하나도 없고, 컴포넌트 기본 className 에는
   있으면 → 기본값의 '크기 클래스만' 이어 붙인다. 자리(absolute·inset·flex)는 호출부 것을 그대로 둔다.

   실행: node src/posco/_gen/patch-compsize.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.indexOf('__mergeDefaultSize') >= 0) { console.log('이미 반영돼 있다'); process.exit(0); }

const nl = s.indexOf('\r\n') >= 0 ? '\r\n' : '\n';
const re = /( *)for \(const \[k, ex\] of c\.derived\) sc\[k\] = evalExpr\(ex, sc\);/;
if (!re.test(s)) throw new Error('앵커를 못 찾았다 — conv.js 가 바뀌었는지 확인할 것');

const block = [
  '/* 호출부가 크기를 안 줬으면 컴포넌트 기본 className 의 크기를 물려받는다(위 주석 참고) */',
  'sc.className = __mergeDefaultSize(c, sc.className);',
].map((x) => '      ' + x).join(nl);

s = s.replace(re, (m, ind) => block + nl + m);

/* 도우미 — parseNodes 바깥(파일 위쪽 유틸 자리)에 둔다 */
const helperAnchor = /(\n\/\* `cond && \( … \)` 분해)/;
if (!helperAnchor.test(s)) throw new Error('도우미를 놓을 자리를 못 찾았다');
const helper = [
  '',
  '/* 컴포넌트 기본 className 의 크기 클래스를 호출부 className 에 이어 붙인다.',
  '   호출부에 이미 크기가 있으면(w-/h-/size-/inset-/flex-1) 손대지 않는다. */',
  'const SIZE_CLS = /^(size-\\[|w-\\[|h-\\[|size-full|w-full|h-full)/;',
  'const HAS_SIZE = /(^|\\s)(size-\\[|w-\\[|h-\\[|size-full|w-full|h-full|inset-|flex-\\[1_0_0\\])/;',
  'function __mergeDefaultSize(c, cn) {',
  '  if (typeof cn !== \'string\' || !cn || HAS_SIZE.test(cn)) return cn;',
  '  const src = (c.branches || []).map((b) => b.jsx).concat([c.jsx || \'\']).join(\' \');',
  '  const m = /className=\\{\\s*className\\s*\\|\\|\\s*"([^"]*)"\\s*\\}/.exec(src);',
  '  if (!m) return cn;',
  '  const add = m[1].split(/\\s+/).filter((x) => SIZE_CLS.test(x));',
  '  return add.length ? cn + \' \' + add.join(\' \') : cn;',
  '}',
].join(nl);
s = s.replace(helperAnchor, (m) => nl + helper + m);

fs.writeFileSync(p, s);
console.log('patched conv.js — 컴포넌트 기본 크기 물려받기');
