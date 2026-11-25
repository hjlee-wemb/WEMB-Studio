async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/main.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  const b = await page.evaluate(() => { const e = document.querySelector('[data-name="Button/Scenario"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const hit = await page.evaluate((b) => { const e = document.elementFromPoint(b.x, b.y); const c = e && e.closest('[data-dc-tip]'); return [e && (e.getAttribute('data-name') || e.tagName), c && c.getAttribute('data-dc-tip')]; }, b);
  await page.evaluate(() => { window.__ov = 0; document.querySelector('.dc-root').addEventListener('pointerover', () => window.__ov++); });
  await page.mouse.move(10, 10);
  await page.mouse.move(b.x, b.y, { steps: 5 });
  await page.waitForTimeout(900);
  return { b, hit, ov: await page.evaluate(() => window.__ov), tip: await page.evaluate(() => { const t = document.querySelector('.dc-tip'); return [t.className, t.textContent, t.style.left, t.style.top, getComputedStyle(t).opacity]; }) };
}
