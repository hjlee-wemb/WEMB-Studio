/* Playwright — 화면을 라이브 없이 찍는다(dom-<key>.png) → node diff-all.js
   팝업은 바탕(종합 현황) 위에 얹힌 그대로 한 장 + 팝업 상자만 잘라 한 장(dom-pop-<key>.png, 그림자 여백 포함). */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/fems/_gen/';
  const P = [['main', '2141-505'], ['diagram', '2142-296'], ['event', '2143-549'], ['solar', '2144-543'], ['equipment', '2144-1312']];
  const out = {};
  const A = globalThis.__ARGS || []; const live = A.includes('live'); const th = A.includes('dark') ? 'dark' : 'light';
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5580/src/fems/' + pg + '.html?' + (live ? '' : 'live=0&') + 't=' + th + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(live ? 1500 : 400);
    const pre = (live ? 'live-' : 'dom-') + (th === 'dark' ? 'dk-' : '');
    await page.screenshot({ path: GEN + pre + key + '.png' });
    if (pg !== 'main') {
      /* 팝업만 — 바탕을 숨기고 팝업 뿌리 상자(+그림자 여백)를 자른다 */
      const box = await page.evaluate(() => {
        const m = document.querySelector('.sh-popmount');
        const fr = m.parentElement;
        [...fr.children].forEach((c) => { if (c !== m) c.style.visibility = 'hidden'; });
        fr.style.background = 'transparent';
        document.querySelectorAll('[class$="-root"]').forEach((r) => { if (!m.contains(r)) r.style.background = 'transparent'; });
        document.body.style.background = '#fff';
        const r = m.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      });
      out[pg + ':box'] = box;
      await page.screenshot({ path: GEN + pre + 'pop-' + key + '.png', clip: { x: Math.max(0, box.x - 10), y: Math.max(0, box.y - 6), width: box.w + 20, height: box.h + 20 } });
    }
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad; });
  }
  return out;
}
