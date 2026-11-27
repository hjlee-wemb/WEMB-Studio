async (page, args) => {
  await page.setViewportSize({ width: +args[0], height: +args[1] });
  await page.goto('http://localhost:5600/src/datacenter/worker.html?live=' + args[2]);
  await page.waitForTimeout(1500);
  return page.evaluate(() => {
    const wl = document.querySelector('[data-name="Widget/Work List"]');
    const out = [];
    const walk = (el, d) => { for (const c of el.children) { const r = c.getBoundingClientRect(); const cs = getComputedStyle(c); out.push('  '.repeat(d) + (c.getAttribute('data-name') || c.tagName) + ' ' + cs.display + ' ' + [r.x, r.y, r.width, r.height].map(Math.round).join(',') + ' tr=' + c.style.translate + ' w=' + c.style.width); if (d < 3) walk(c, d + 1); } };
    walk(wl, 0);
    return out;
  });
}
