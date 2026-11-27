async (page, args) => {
  const pg = args[0], sels = args.slice(1);
  const res = {};
  for (const t of ['dark', 'light']) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=' + t);
    await page.waitForTimeout(800);
    res[t] = await page.evaluate((sels) => sels.map((s) => {
      const e = document.querySelector(s); if (!e) return s + ' : MISSING';
      const ch = []; const walk = (x, d) => { if (d > 2) return; for (const c of x.children) { const cs = getComputedStyle(c); const bg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? 'bg=' + cs.backgroundColor : ''; const bi = cs.backgroundImage !== 'none' ? 'bi=' + cs.backgroundImage.slice(0, 70) : ''; const col = c.tagName === 'P' ? 'col=' + cs.color + ' "' + c.textContent.slice(0, 10) + '"' : ''; if (bg || bi || col) ch.push('  '.repeat(d) + (c.getAttribute('data-name') || c.tagName) + ' ' + [bg, bi, col].join(' ')); walk(c, d + 1); } };
      const cs = getComputedStyle(e); walk(e, 0);
      return s + ' : bg=' + cs.backgroundColor + ' bi=' + cs.backgroundImage.slice(0, 80) + '\n' + ch.slice(0, 14).join('\n');
    }), sels);
  }
  return res;
}
