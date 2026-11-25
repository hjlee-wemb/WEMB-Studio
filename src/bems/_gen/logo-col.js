async (page) => {
  const q = () => page.evaluate(() => { const p = document.querySelector('.dmm-root [data-name="Logo"] p, .dmm-root [data-name="WEMB Studio"]'); const cs = p && getComputedStyle(p); return p && { color: cs.color, fill: cs.webkitTextFillColor, bi: cs.backgroundImage.slice(0, 120), op: cs.opacity, filt: cs.filter }; });
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5600/src/datacenter/main.html?live=0');
  await page.waitForTimeout(800);
  const pre = await q();
  await page.goto('http://localhost:5600/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /datacenter/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  await page.waitForTimeout(1000);
  await page.locator('text=Data Center Integrated Monitoring').first().click();
  await page.waitForTimeout(600);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .dmm-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  return { pre, studio: await q() };
}
