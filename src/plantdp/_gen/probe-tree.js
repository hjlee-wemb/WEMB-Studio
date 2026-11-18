/* 화면 최상위 배치 재기 — node pw.js probe-tree.js <page> [깊이] */
async (page, args) => {
  const pg = args[0] || 'main', depth = +(args[1] || 2);
  await page.goto('http://localhost:5570/src/plantdp/' + pg + '.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(400);
  return await page.evaluate((depth) => {
    const root = document.querySelector('[class$="-root"]');
    const frame = root.querySelector(':scope > [data-node-id]');
    const out = [];
    const walk = (el, d) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      out.push('  '.repeat(d) + (el.getAttribute('data-name') || el.tagName) + ' [' + cs.position + (cs.display !== 'block' ? ' ' + cs.display : '') + '] ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + (cs.overflow !== 'visible' ? ' ov=' + cs.overflow : '') + (cs.maskImage && cs.maskImage !== 'none' ? ' MASK' : ''));
      if (d < depth) [...el.children].forEach((c) => walk(c, d + 1));
    };
    walk(frame, 0);
    return out.join('\n');
  }, depth);
}
