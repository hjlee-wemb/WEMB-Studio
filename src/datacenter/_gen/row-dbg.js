async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/main.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  const r = await page.evaluate(() => { const e = document.querySelectorAll('[data-name="Event Log"] .dc-row')[2]; const b = e.getBoundingClientRect(); return { x: b.left + 300, y: b.top + b.height / 2, disp: getComputedStyle(e).display, cls: e.className, filt: getComputedStyle(e).filter }; });
  await page.mouse.move(r.x, r.y); await page.waitForTimeout(400);
  const after = await page.evaluate((r) => { const e = document.querySelectorAll('[data-name="Event Log"] .dc-row')[2]; const h = document.elementFromPoint(r.x, r.y); return { filt: getComputedStyle(e).filter, hover: e.matches(':hover'), hit: h && (h.getAttribute('data-name') || h.tagName), rules: [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules].filter((x) => /dc-row/.test(x.selectorText || '')).map((x) => x.cssText.slice(0, 120)); } catch (e) { return []; } }) }; }, r);
  return { r, after };
}
