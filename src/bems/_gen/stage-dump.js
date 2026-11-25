async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/main.html?live=0');
  await page.waitForTimeout(1000);
  return page.evaluate(() => {
    const s = document.querySelector('[data-name="Stage"]');
    const out = [];
    const walk = (e, d) => { for (const c of e.children) { const b = c.getBoundingClientRect(); const cs = getComputedStyle(c); out.push('  '.repeat(d) + (c.getAttribute('data-name') || c.tagName) + ' ' + cs.display + ' ' + cs.position + ' ' + [b.x, b.y, b.width, b.height].map(Math.round).join(',') + (c.tagName === 'P' ? ' "' + c.textContent.trim() + '"' : '') + (cs.overflow !== 'visible' ? ' ov=' + cs.overflow : '') + (cs.transform !== 'none' ? ' tf=' + cs.transform : '')); if (d < 4 && c.tagName !== 'P') walk(c, d + 1); } };
    walk(s, 0);
    return out;
  });
}
