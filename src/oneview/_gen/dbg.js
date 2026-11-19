async (page) => {
  const out = {};
  for (const live of ['1']) {
    await page.goto('http://localhost:5590/src/oneview/main.html?live=' + live + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(3500);
    out[live] = await page.evaluate(() => {
      const w = document.querySelector('[data-name="Widget/Bank No-Response"]');
      const list = w.querySelector('[data-name="Body"]') || w.children[1];
      const cs = getComputedStyle(list);
      const items = [...list.children].slice(0, 3).map((c) => { const r = c.getBoundingClientRect(); const s = getComputedStyle(c); return c.getAttribute('data-name') + ' ' + Math.round(r.x) + ',' + Math.round(r.y) + ' w' + Math.round(r.width) + ' tr:' + s.translate + ' cls:' + c.className; });
      return { list: list.getAttribute('data-name') + ' ' + cs.display + ' ' + cs.flexWrap + ' ' + cs.justifyContent + ' w' + list.offsetWidth + ' cls:' + list.className, items };
    });
  }
  return out;
}
