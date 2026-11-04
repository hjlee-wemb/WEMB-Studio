/* 원본과 픽셀까지 맞추려고 conv.js 를 넓힌다 — 한 번만 돌린다.
   design context 는 선을 단색 · 안쪽 정렬 · 기본 점선으로 뭉갠다. use_figma 로 읽은 값으로 되살린다(mk-screen-css.js).
   · 가운데 정렬 선(1.055px) — CSS border 는 안쪽이고 오토레이아웃 폭까지 밀어낸다 → 테두리를 걷고 상자 안팎 1px 을 절반 농도로 칠한다(Figma 렌더와 같은 값)
   · 점선 — 원본 간격(4,2 · 4,4 · 2.11,2.11)대로 ::after 배경으로 그린다(CSS dashed 는 간격을 못 정한다)
   · 그림 묶음(GROUP) 크기가 낡은 곳 · 테두리 있는 판 안의 백분율 자리 · 글자 폭 100% → 실제 값으로
   · 그라디언트 정지색을 클래스로 빼서 라이트 · 색 정하기가 닿게 한다
   실행: node patch-fidelity.js */
'use strict';
const fs = require('fs'), path = require('path');
const p = path.join(__dirname, 'conv.js');
let s = fs.readFileSync(p, 'utf8');
if (s.includes('screen-css.json')) { console.log('이미 고침'); process.exit(0); }
const rep = (a, b) => { if (!s.includes(a)) throw new Error('못 찾음: ' + a.slice(0, 90)); s = s.split(a).join(b); };

/* META 에 x · y 도 */
rep(`for (const m of xml.matchAll(/<(\\w[\\w-]*) id="([^"]+)" name="([^"]*)"(?: x="[-\\d.]+")?(?: y="[-\\d.]+")? width="([-\\d.]+)" height="([-\\d.]+)"/g)) {`,
  `for (const m of xml.matchAll(/<(\\w[\\w-]*) id="([^"]+)" name="([^"]*)"(?: x="([-\\d.]+)")?(?: y="([-\\d.]+)")? width="([-\\d.]+)" height="([-\\d.]+)"/g)) {`);
rep(`const box = { tag: m[1], name: m[3], w: +m[4], h: +m[5] };`, `const box = { tag: m[1], name: m[3], x: +m[4], y: +m[5], w: +m[6], h: +m[7] };`);

/* 테두리 있는 판 안의 백분율 자리 — Figma 는 판 전체(border box) 기준, CSS 는 padding box 기준이다 → 메타 값으로 못 박는다 */
rep(`        borderFixes++;
      }
    }`, `        borderFixes++;
      } else if (gi >= 0 && /%/.test(decls[gi][1]) && META[nid] && META[nid].tag !== 'text') {
        const bw = parseFloat(parentBorder), M = META[nid];
        decls.splice(gi, 1, ['left', +(M.x - bw).toFixed(3) + 'px'], ['top', +(M.y - bw).toFixed(3) + 'px'], ['width', +M.w.toFixed(3) + 'px'], ['height', +M.h.toFixed(3) + 'px']);
        borderFixes++;
      }
    }`);
/* contents 묶음은 상자가 없다 — 테두리 정보를 자식에게 그대로 넘긴다 */
rep(`const kid = !ring && bw2 && bw2[1] !== '0' ? bw2[1] : null;`,
  `const kid = !ring && bw2 && bw2[1] !== '0' ? bw2[1] : (decls.some((x) => x[0] === 'display' && x[1] === 'contents') ? parentBorder : null);`);

/* 글자 폭 100% — 부모 폭이 글자 폭으로 정해지는 자리(축 눈금)에서 브라우저 글꼴 폭이 끼어든다 → Figma 글자 상자 폭으로 */
rep(`      if (!has('width') && !insetBox) decls.push(['width', +mw.toFixed(3) + 'px']);`,
  `      if (!has('width') && !insetBox) decls.push(['width', +mw.toFixed(3) + 'px']);
      else { const wi0 = decls.findIndex((x) => x[0] === 'width'); if (wi0 >= 0 && decls[wi0][1] === '100%') decls[wi0][1] = +mw.toFixed(3) + 'px'; }`);

/* 점선 — 간격을 지키려고 ::after 배경으로 */
rep(`    const decls = styleFor(classes);
    /* style={{ … }} 인라인 스타일`, `    const decls = styleFor(classes);
    /* 점선 — 색 · 굵기는 그대로 두고 그리는 방법만 바꾼다(자리는 투명 테두리가 지킨다) */
    {
      const si = decls.findIndex((x) => x[0] === 'border-style' && x[1] === 'dashed');
      if (si >= 0 && nid && !NO_DASH.has(nid)) {
        const c = (decls.find((x) => x[0] === 'border-color') || [, '#2b6e92'])[1];
        const w = (k) => { const d = decls.find((x) => x[0] === 'border-' + k + '-width'); return d ? parseFloat(d[1]) : 0; };
        const bw0 = decls.find((x) => x[0] === 'border-width');
        const sides = { top: w('top'), right: w('right'), bottom: w('bottom'), left: w('left') };
        if (bw0 && parseFloat(bw0[1]) > 0) Object.keys(sides).forEach((k) => { sides[k] = sides[k] || parseFloat(bw0[1]); });
        if (sides.top || sides.right || sides.bottom || sides.left) {
          const pat = DASH_44.has(nid) ? [4, 4] : /2c80a6/i.test(c) ? [2.11, 2.11] : [4, 2];
          const key = [c, pat.join('-'), sides.top, sides.right, sides.bottom, sides.left].join('|');
          (dashGroups[key] = dashGroups[key] || { c, pat, sides, sel: [] }).sel.push(uc);
          decls[decls.findIndex((x) => x[0] === 'border-color')][1] = 'transparent';
          decls[si][1] = 'solid';
          if (!decls.some((x) => x[0] === 'position')) decls.push(['position', 'relative']);
        }
      }
    }
    /* style={{ … }} 인라인 스타일`);
rep(`  const rules = [], darkRules = [], out = [];`, `  const rules = [], darkRules = [], out = [];
  const dashGroups = {};                                   /* 점선 묶음 — 같은 모양끼리 한 규칙으로 */
  const seenStop = new Set();`);
rep(`  walk(tree, 1, null, false, null);
`, `  walk(tree, 1, null, false, null);
  /* 점선 규칙 */
  Object.values(dashGroups).forEach((g) => {
    const A = g.pat[0], B = g.pat[0] + g.pat[1];
    const lay = (dir, pos, size, col) => 'repeating-linear-gradient(' + dir + 'deg,' + col + ' 0 ' + A + 'px,transparent ' + A + 'px ' + B + 'px) ' + pos + '/' + size + ' no-repeat';
    const bgOf = (col) => {
      const L = [];
      if (g.sides.bottom) L.push(lay(90, 'left bottom', '100% ' + g.sides.bottom + 'px', col));
      if (g.sides.top) L.push(lay(90, 'left top', '100% ' + g.sides.top + 'px', col));
      if (g.sides.right) L.push(lay(180, 'right top', g.sides.right + 'px 100%', col));
      if (g.sides.left) L.push(lay(180, 'left top', g.sides.left + 'px 100%', col));
      return L.join(',');
    };
    const sel = g.sel.map((u) => ROOT + ' .' + u + '::after').join(',');
    rules.push(sel + '{content:"";position:absolute;pointer-events:none;'
      + 'top:' + -g.sides.top + 'px;right:' + -g.sides.right + 'px;bottom:' + -g.sides.bottom + 'px;left:' + -g.sides.left + 'px;background:' + bgOf(g.c) + ';}');
    const lc = LIGHT.lightDecl('border-color', g.c, '') || g.c;
    darkRules.push(g.sel.map((u) => ROOT + '[data-theme="light"] .' + u + '::after').join(',') + '{background:' + bgOf(lc) + ';}');
  });
`);
rep(`const RING_STROKE = [];`, `const RING_STROKE = [];
/* 점선 간격 — 대부분 4,2. use_figma 로 읽은 4,4 줄(표의 가로줄 · 차트 격자) */
const DASH_44 = new Set(['17:1993','17:2004','17:2015','17:2026','17:2038','17:2062','17:2096','17:2107','17:2118','17:2129','17:2140','17:2151','17:1903','17:1914','17:1925','17:1936','24:3466','25:3718','25:3738','25:3757','25:3777','25:3796','25:3815','25:3834','25:3854','25:3873','25:3892','25:3911','25:4241','25:4239']);
/* 원형 카운터 — 둥근 끝 점선 + 그라디언트라 따로 그린다(mk-screen-css.js) */
const NO_DASH = new Set(['13:1425','13:1442']);`);

/* 그라디언트 정지색을 클래스로 — 시트를 칠하는 '색 정하기'와 라이트가 닿게 */
rep(`    }).replace(/<g id="([^"]+)"/g,`, `    }).replace(/<stop\\b([^>]*?)\\sstop-color="(#[0-9a-fA-F]{3,8}|white|black)"([^>]*?)\\/?>/g, (all, a0, c0, b0) => {
      const hex = ({ white: '#ffffff', black: '#000000' }[c0] || c0).toLowerCase();
      const cls = PX + '-stop-' + hex.slice(1);
      if (!seenStop.has(cls)) { seenStop.add(cls); rules.push('.' + cls + '{stop-color:' + hex + '}'); }
      return '<stop' + a0 + b0 + ' class="' + cls + '"/>';
    }).replace(/<g id="([^"]+)"/g,`);

/* 화면별 선 규칙 */
rep(`const SCREEN_CSS = {};`, `const SCREEN_CSS = JSON.parse(fs.readFileSync(path.join(GEN, 'screen-css.json'), 'utf8'));`);
rep(`  const LIGHT_CSS = ['/* ' + r.S.name + ' — 라이트 테마(형상 동일, 색만 반전). 생성기: _gen/light.js */']
    .concat(LIGHT.lightExtra(PX, r.textured)).concat(r.darkRules).join('\\n');`,
`  const SCREEN_LIGHT = (SCREEN_CSS[r.S.key + ':light'] || []).map(function (x) { return x.split('{{PX}}').join(PX); });
  const LIGHT_CSS = ['/* ' + r.S.name + ' — 라이트 테마(형상 동일, 색만 반전). 생성기: _gen/light.js */']
    .concat(LIGHT.lightExtra(PX, r.textured)).concat(r.darkRules).concat(SCREEN_LIGHT).join('\\n');`);
fs.writeFileSync(p, s);
console.log('conv.js 고침');
