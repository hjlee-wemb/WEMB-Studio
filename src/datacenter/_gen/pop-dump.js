async (page, args) => {
  const out = {};
  for (const pg of args) {
    out[pg] = {};
    for (const t of ['dark', 'light']) {
      await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=' + t);
      await page.waitForTimeout(800);
      out[pg][t] = await page.evaluate(() => {
        const res = [];
        document.querySelectorAll('.sh-pop').forEach((root) => {
          const walk = (e, d) => { for (const c of e.children) { const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); const a = getComputedStyle(c, '::after');
            const bg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : ''; const bi = cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 90) : '';
            const ring = a.content !== 'none' && a.content !== 'normal' && parseFloat(a.borderTopWidth) > 0 ? 'ring ' + a.borderTopWidth + ' ' + a.borderTopColor : '';
            if ((bg || bi || ring || cs.boxShadow !== 'none') && r.width > 150 && r.height > 20) res.push('  '.repeat(d) + (c.getAttribute('data-name') || c.tagName) + ' #' + c.getAttribute('data-node-id') + ' ' + [r.x, r.y, r.width, r.height].map(Math.round).join(',') + ' ' + [bg, bi, ring, cs.boxShadow !== 'none' ? 'sh ' + cs.boxShadow.slice(0, 40) : ''].filter(Boolean).join(' | '));
            if (d < 5) walk(c, d + 1); } };
          walk(root, 0);
        });
        return res;
      });
    }
  }
  return out;
}
