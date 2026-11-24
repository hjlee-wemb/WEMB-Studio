async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/power.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  const p = await page.evaluate(() => { const e = document.querySelector('[data-name="Diagram Image"]'); const r = e.closest('[data-name="View/Plan Diagram"]').getBoundingClientRect(); e.id = 'zz'; return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const f = () => page.evaluate(() => { const e = document.getElementById('zz'); const c = getComputedStyle(e); return [c.filter, c.backgroundImage.slice(0, 60), e.matches(':hover')]; });
  await page.mouse.move(5, 1075); await page.waitForTimeout(300);
  const a = await f();
  await page.mouse.move(p.x, p.y); await page.waitForTimeout(350);
  const b = await f();
  const hit = await page.evaluate((p) => { const h = document.elementFromPoint(p.x, p.y); return h && (h.getAttribute('data-name') || h.tagName) + ' / ' + (h.closest('#zz') ? 'inside' : 'outside'); }, p);
  return { p, a, b, hit };
}
