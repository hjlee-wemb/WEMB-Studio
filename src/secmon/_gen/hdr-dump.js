async (page, args) => {
  const out = {};
  for (const pg of args) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?r=' + Date.now());
    await page.waitForTimeout(1500);
    out[pg] = await page.evaluate(() => {
      const r = document.querySelector('.dc-root');
      const h = [...r.querySelectorAll('[data-name="Header"]')].find((x) => x.querySelector('[data-name="Icon Logout"]'));
      const lines = [];
      const walk = (e, d) => { for (const c of e.children) { const b = c.getBoundingClientRect(); const cs = getComputedStyle(c); lines.push('  '.repeat(d) + (c.getAttribute('data-name') || c.tagName) + ' ' + cs.display + ' ' + [b.x, b.y, b.width, b.height].map(Math.round).join(',') + (c.tagName === 'P' ? ' "' + c.textContent.trim() + '"' : '') + (c.classList.contains('dc-click') ? ' [click]' : '')); if (d < 5 && c.tagName !== 'P' && c.tagName !== 'IMG') walk(c, d + 1); } };
      walk(h, 0);
      const clicks = [...r.querySelectorAll('.dc-click')].map((e) => (e.getAttribute('data-name') || e.tagName) + ':' + getComputedStyle(e).display).filter((s) => /contents/.test(s));
      return { header: lines, contentsClicks: clicks };
    });
  }
  return out;
}
