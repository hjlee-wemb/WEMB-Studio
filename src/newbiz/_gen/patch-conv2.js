/* ① 지도 묶음 = Figma 가 통째로 내보낸 그림(노이즈 · 안쪽 그림자 · soft-light 는 개별 그림으로 재현이 안 된다)
   ② 글자 굵기 — Windows Chrome 은 어두운 판의 밝은 글자를 두껍게 그린다(공장 전력설비 함정 ①)
   ③ 글자 위치 — SUIT → Pretendard 메트릭 차이를 text-fit.json 으로 되돌린다. 한 번만. */
'use strict';
const fs = require('fs'), path = require('path'), https = require('https');
const f = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(f, 'utf8');
if (!c.includes('KOREA_MAP')) {
  c = c.replace("  /* 다른 화면에서 가져다 심는 조각", `  /* KOREA_MAP — 지도 묶음을 통째 그림 하나로(render 상자 좌표는 use_figma absoluteRenderBounds) */
  (function swapMap(n) {
    if (!n || n.tag === '#text') return;
    const dn = n.attrs && typeof n.attrs['data-name'] === 'string' ? n.attrs['data-name'] : '';
    if (/^Korea Map/.test(dn)) {
      const big = S.key === '1-6841' || S.key === '1-5184' || S.key === '1-6013' || S.key === '1-7644';
      const box = big ? 'left-[729.68px] top-[191.81px] w-[529.79px] h-[821.14px]' : 'left-[237px] top-[297.7px] w-[481px] h-[745.06px]';
      const dim = /Dim/.test(dn) ? ' opacity-50' : '';
      n.attrs.className = 'absolute ' + box + dim;
      n.children = [{ tag: 'img', attrs: { alt: '', className: 'absolute block inset-0 max-w-none size-full', src: { expr: 'imgKoreaMapPng' } }, scope: Object.assign({}, n.scope, { imgKoreaMapPng: big ? 'korea-map-lg.png' : 'korea-map.png' }), children: [] }];
      return;
    }
    (n.children || []).forEach(swapMap);
  })(tree);

  /* 다른 화면에서 가져다 심는 조각`);
  /* 글자 굵기 */
  c = c.replace("if (pxm && +pxm[1] <= 13 && wi >= 0 && fam && /Pretendard Variable/.test(fam[1]) && !/Tomorrow/.test(fam[1])) decls[wi][1] = String(+decls[wi][1] - 40);",
    "if (pxm && wi >= 0 && fam && /Pretendard Variable/.test(fam[1])) decls[wi][1] = String(+decls[wi][1] - (+pxm[1] <= 13 ? 100 : 80));");
  /* 글자 위치 */
  c = c.replace("    /* 텍스트 상자 고정 — <p> 뿐 아니라", `    /* TEXT_FIT — 글자 크기 · trim 별 세로 보정(text-fit.json) */
    if (fsOwn && TEXT_FIT) {
      const tk = parseFloat(fsOwn[1]) + (classes.some((x) => x.indexOf('text-box-trim') >= 0) ? 't' : '');
      const off = TEXT_FIT[tk];
      if (off) decls.push(['translate', (off[0] || 0) + 'px ' + (off[1] || 0) + 'px']);
    }
    /* 텍스트 상자 고정 — <p> 뿐 아니라`);
  c = c.replace("const SCREEN_CSS = JSON.parse(", "const SCREEN_CSS_PLACEHOLDER = 0;\nconst SCREEN_CSS = JSON.parse(");
  c = c.replace("const LIGHT = require('./light.js');", "const LIGHT = require('./light.js');\nconst TEXT_FIT = fs.existsSync(path.join(GEN, 'text-fit.json')) ? JSON.parse(fs.readFileSync(path.join(GEN, 'text-fit.json'), 'utf8')) : null;");
  fs.writeFileSync(f, c);
}
const U = { 'korea-map.png': 'c4d301b0-4759-4a68-8a26-363f1bc7ea12', 'korea-map-lg.png': '11792863-507a-4f5d-8d9d-a6bd21d97468' };
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { if (r.statusCode >= 300 && r.headers.location) { r.resume(); return get(r.headers.location).then(res, rej); } if (r.statusCode !== 200) return rej(new Error(r.statusCode)); const b = []; r.on('data', (d) => b.push(d)); r.on('end', () => res(Buffer.concat(b))); }).on('error', rej));
(async () => { for (const k of Object.keys(U)) { const b = await get('https://www.figma.com/api/mcp/asset/' + U[k] + '.png'); fs.writeFileSync(path.join(__dirname, '..', k), b); console.log(k, b.length); } })();
