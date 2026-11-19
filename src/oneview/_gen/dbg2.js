async (page) => {
  await page.goto('http://localhost:5590/src/oneview/main.html?r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview/_gen/dbg-bank.png', clip: { x: 1400, y: 590, width: 520, height: 260 } });
  return await page.evaluate(() => [...document.querySelectorAll('[data-name="Widget/Bank No-Response"] [data-name="Graphic"]')].slice(0, 4).map((g) => { const r = g.getBoundingClientRect(); return Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + g.tagName + ' ' + g.className.baseVal; }));
}
