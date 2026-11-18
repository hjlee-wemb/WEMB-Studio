async (page) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('http://localhost:5570/src/plantdp/event.html?t=light&r=' + Date.now());
  await page.waitForTimeout(1500);
  return page.evaluate(() => [...document.querySelectorAll('[data-name="Event Log"] p')].filter((x) => /^(All|CR|MA)$/.test(x.textContent.trim())).map((p) => { const c = p.parentElement, b = c.getBoundingClientRect(), cs = getComputedStyle(c); return [p.textContent.trim(), c.dataset.name, cs.display, cs.visibility, Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height), !!c.offsetParent, (c.closest('[data-name="Toolbar"]') || {}).dataset ? 'toolbar' : '-', String((document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) || {}).className).slice(0, 50)]; }));
}
