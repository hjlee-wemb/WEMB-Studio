/* 구간별 성능현황의 실린더 게이지를 인라인 <svg> 로 심는다.
   지금까지는 통짜 <img>(visual-*.svg) 라 안쪽 원판(<g id="Disk">)을 만질 수 없었다.
   인라인으로 바꾸면 원판 하나하나가 DOM 이 되어 '위에서 떨어지는' 연출을 걸 수 있고,
   색도 CSS 로 빠져 라이트 테마·'색 정하기'가 그대로 닿는다. 형상(path d)은 한 글자도 안 건드린다.

   같이 고치는 것 두 가지
   ① 한 파일을 여러 게이지가 나눠 쓰므로(visual-5 는 3곳) filter/gradient id 가 겹친다
      → 인라인할 때마다 참조되는 id 만 고유하게 바꾼다.
   ② 이 그림은 색을 `fill="white"` · `fill="black"` 처럼 이름으로 쓴 자리가 있다
      → hex 만 보던 grab() 이 이름 색도 잡도록 넓힌다(라이트 대응이 생기게). */
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(F, 'utf8');
/* 치환 문자열에 `$&` 같은 특수 패턴이 들어 있어 String.replace 가 그걸 '찾은 문자열'로 바꿔 버린다
   → 항상 함수 치환자로 넣는다(이 실수로 conv.js 가 한 번 깨졌다). */
const put = (find, val) => { s = s.replace(find, () => val); };

/* ── ① 인라인 대상 ── */
const A = 'const INLINE_SVG = [];';
if (s.indexOf(A) < 0) { console.error('INLINE_SVG anchor not found'); process.exit(1); }
put(A, [
  '/* 통짜 그림 대신 DOM 으로 심을 SVG — 구간별 성능현황의 실린더 게이지 5종.',
  "   안쪽 <g id=\"Disk\"> 를 꺼내야 '원판이 위에서 떨어지는' 연출을 걸 수 있다. */",
  "const INLINE_SVG = ['visual-5.svg', 'visual-1-2.svg', 'visual-2-2.svg', 'visual-3-2.svg', 'visual-4-2.svg'];",
].join('\n'));

/* ── ② 인라인할 때 참조 id 를 고유하게 ── */
const B = "  function inlineSvg(file, attrs, name, pad) {\n    const raw = fs.readFileSync(path.join(ART, file), 'utf8');";
if (s.indexOf(B) < 0) { console.error('inlineSvg anchor not found'); process.exit(1); }
put(B, [
  '  function inlineSvg(file, attrs, name, pad) {',
  "    let raw = fs.readFileSync(path.join(ART, file), 'utf8');",
  '    /* 같은 파일을 여러 자리에 심으므로 filter·gradient 처럼 url(#…) 로 참조되는 id 는 매번 새로 짓는다',
  '       (안 그러면 두 번째 게이지가 첫 번째의 필터를 가리켜 그림자가 엉킨다) */',
  '    const refIds = [...new Set([...raw.matchAll(/url\\(#([\\w.:-]+)\\)/g)].map((m) => m[1]))];',
  '    if (refIds.length) {',
  "      const tagId = 'i' + (++inlineSeq);",
  '      for (const rid of refIds) {',
  "        const esc = rid.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
  "        raw = raw.replace(new RegExp('id=\"' + esc + '\"', 'g'), 'id=\"' + tagId + '-' + rid + '\"')",
  "          .replace(new RegExp('url\\\\(#' + esc + '\\\\)', 'g'), 'url(#' + tagId + '-' + rid + ')');",
  '      }',
  '    }',
].join('\n'));

/* ── ③ 이름 색(white·black)도 CSS 로 뽑아 라이트 대응이 생기게 ── */
const C = "      const grab = (p) => { const m = new RegExp('\\\\s' + p + '=\"(#[0-9a-fA-F]{3,8})\"').exec(at); if (m) d2.push([p, m[1]]); };";
if (s.indexOf(C) < 0) { console.error('grab anchor not found'); process.exit(1); }
put(C, [
  "      /* hex 뿐 아니라 이름 색(white·black)도 잡는다 — 이 시안의 실린더가 그렇게 그려져 있다 */",
  "      const NAMED = { white: '#ffffff', black: '#000000' };",
  '      const grab = (p) => {',
  '        const m = new RegExp(\'\\\\s\' + p + \'="(#[0-9a-fA-F]{3,8}|white|black)"\').exec(at);',
  '        if (m) d2.push([p, NAMED[m[1]] || m[1]]);',
  '      };',
].join('\n'));

/* ── ④ 인스턴스 번호 카운터 ── */
const D = 'const RING_STROKE = [];';
if (s.indexOf(D) < 0) { console.error('counter anchor not found'); process.exit(1); }
put(D, "let inlineSeq = 0;   /* 인라인 SVG 마다 참조 id 를 고유하게 만들 번호 */\n" + D);

fs.writeFileSync(F, s);
console.log('patched: inline gauge cylinders');
