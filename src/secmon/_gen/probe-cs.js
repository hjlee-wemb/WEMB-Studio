/* 노드 하나의 계산된 글꼴 · 줄높이 · 글자 실제 위치(Range) — node pw.js probe-cs.js <page> <node-id> */
async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/' + args[0] + '.html?live=0&r=' + Date.now());
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  return await page.evaluate((id) => {
    const e = document.querySelector('[data-node-id="' + id + '"]');
    if (!e) return null;
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rr = rg.getClientRects()[0];
    return { cls: e.className, ff: cs.fontFamily, fs: cs.fontSize, fw: cs.fontWeight, lh: cs.lineHeight, pad: cs.padding, box: [r.left, r.top, r.width, r.height], range: rr && [rr.left, rr.top, rr.width, rr.height], fontsLoaded: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight).slice(0, 5) };
  }, args[1]);
}
