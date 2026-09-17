/* mix-blend-mode 를 쓴 그림은 **인라인 <svg>** 로 심는다.

   왜 — Figma 는 Ack 단추·접기 단추·자산 타일 바탕에 `mix-blend-mode:overlay` 로 광택을 얹는다.
   그 그림을 `<img>` 로 부르면 브라우저는 독립된 이미지로 그려서 blend 의 바탕이 사라지고,
   광택이 **원본 색 그대로(흰 삼각형)** 찍힌다(Figma 렌더 대조로 확인. isolation 을 줘도 안 된다).
   문서 안에 인라인으로 심으면 아래 면이 그대로 바탕이 되어 Figma 와 같은 광택이 된다.
   형상·좌표·색은 손대지 않는다 — `<img>` 를 같은 그림의 DOM 으로 바꿔 심을 뿐이다.

   실행: node src/posco/_gen/patch-inline-blend.js */
'use strict';
const fs = require('fs');
const path = require('path');
const GEN = __dirname;
const ART = path.join(GEN, '..');
const p = path.join(GEN, 'conv.js');

/* blend 를 쓰는 그림은 6개지만 **인라인으로 심을 것은 Ack 단추 하나뿐**이다.
   Figma 렌더와 한 장씩 대조해서 정했다:
     · btn-ack-bg            — <img> 면 광택이 흰 삼각형으로 떴다 → 인라인이 맞다.
     · group-bg · group-count-01/02-bg · button-collapse · property-1-btn-arrow-left
       — <img> 쪽이 원본과 같다. 인라인하면 blend 가 페이지 바탕까지 먹어 테두리가 은색으로 떠올랐다
         (자산 타일 네 개가 전부 밝게 빛났다). 그래서 이들은 그대로 둔다.
   요컨대 Figma 의 blend 격리 범위는 노드마다 다르고, 판정은 눈이 아니라 **렌더 대조**로 한다. */
const files = ['btn-ack-bg.svg'].filter((f) => fs.existsSync(path.join(ART, f)));
if (!files.length) { console.log('대상 그림이 없다'); process.exit(0); }

let s = fs.readFileSync(p, 'utf8');
const re = /const INLINE_SVG = \[[^\]]*\];/;
if (!re.test(s)) throw new Error('INLINE_SVG 를 못 찾았다');
const line = 'const INLINE_SVG = [' + files.map((f) => "'" + f + "'").join(', ') + '];';
if (s.indexOf(line) >= 0) { console.log('이미 반영돼 있다:', files.join(', ')); process.exit(0); }
s = s.replace(re, () => line);
fs.writeFileSync(p, s);
console.log('patched conv.js — 인라인으로 심을 그림', files.length, '개:', files.join(', '));
