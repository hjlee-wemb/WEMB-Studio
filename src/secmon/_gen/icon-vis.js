/* 아이콘 · 심볼 가시성 실측 — 그림(<img> · 인라인 svg)을 숨긴 화면과 보인 화면의 차이로 '바탕에서 얼마나 드러나나'를 잰다.
   점수 = 그림 상자 안에서 바뀐 픽셀들의 평균 색차(0~255) × 바뀐 비율의 제곱근. 낮으면 바탕에 묻힌 것.
   실행: node pw.js icon-vis.js <theme> <page…>  → icon-vis-<theme>.json { src: {pg, score, w, h, n} } (같은 그림은 가장 낮은 점수) */
async (page, args) => {
  const fs = require('fs'), PNG = require('./png.js');
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/';
  const theme = args[0] || 'light';
  await page.setViewportSize({ width: 1920, height: 1080 });
  const res = {};
  for (const pg of args.slice(1)) {
    await page.goto('http://localhost:5620/src/secmon/' + pg + '.html?live=0&t=' + theme + '&r=' + Date.now());
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);
    const items = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('img, svg[data-src]').forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4 || r.width * r.height > 60000 || r.right < 0 || r.bottom < 0 || r.left > 1920 || r.top > 1080) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
        el.setAttribute('data-iv', i);
        const src = el.tagName === 'IMG' ? (getComputedStyle(el).content && getComputedStyle(el).content.indexOf('url(') === 0 ? getComputedStyle(el).content.replace(/^url\("?|"?\)$/g, '') : el.getAttribute('src')) : el.getAttribute('data-src');
        out.push({ i, src: (src || '').split('/').pop().split('?')[0], x: Math.max(0, r.left | 0), y: Math.max(0, r.top | 0), w: Math.ceil(r.width), h: Math.ceil(r.height), nm: (el.closest('[data-name]') || { getAttribute: () => '' }).getAttribute('data-name') });
      });
      return out;
    });
    const A = PNG.decode(await page.screenshot());
    await page.addStyleTag({ content: '[data-iv]{visibility:hidden!important;}' });
    await page.waitForTimeout(150);
    const B = PNG.decode(await page.screenshot());
    for (const it of items) {
      let n = 0, ch = 0, sd = 0;
      for (let y = it.y; y < Math.min(1080, it.y + it.h); y++) for (let x = it.x; x < Math.min(1920, it.x + it.w); x++) {
        const k = (y * A.w + x) * 4;
        const d = (Math.abs(A.data[k] - B.data[k]) + Math.abs(A.data[k + 1] - B.data[k + 1]) + Math.abs(A.data[k + 2] - B.data[k + 2])) / 3;
        n++; if (d > 6) { ch++; sd += d; }
      }
      if (!n) continue;
      const score = ch ? (sd / ch) * Math.sqrt(ch / n) : 0;
      const key = it.src;
      if (!res[key] || res[key].score > score) res[key] = { pg, nm: it.nm, score: Math.round(score * 10) / 10, w: it.w, h: it.h, at: [it.x, it.y] };
    }
  }
  fs.writeFileSync(GEN + 'icon-vis-' + theme + '.json', JSON.stringify(res, null, 1));
  return Object.keys(res).length;
}
