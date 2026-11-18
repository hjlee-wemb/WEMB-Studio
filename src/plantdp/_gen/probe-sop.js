/* SOP 화면 깊은 구조 — node pw.js probe-sop.js <scene> <selector>... */
async (page, args) => {
  const [sc, ...sels] = args;
  await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?live=0&r=' + Date.now());
  await page.waitForTimeout(800);
  return await page.evaluate((sels) => sels.map((s) => {
    const el = document.querySelector(s); if (!el) return s + ' MISSING';
    const b0 = el.getBoundingClientRect();
    const L = [];
    const walk = (e, d) => { [...e.children].forEach((c) => { const b = c.getBoundingClientRect(); const cs = getComputedStyle(c);
      const t = c.children.length ? '' : (c.textContent || '').trim().slice(0, 24);
      L.push('  '.repeat(d) + (c.getAttribute('data-name') || c.tagName.toLowerCase()) + ' ' + Math.round(b.left - b0.left) + ',' + Math.round(b.top - b0.top) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? ' bg' + cs.backgroundColor : '') + (cs.borderTopWidth !== '0px' ? ' bd' + cs.borderTopWidth + cs.borderTopColor : '') + (c.tagName === 'IMG' ? ' ' + c.getAttribute('src').split('/').pop() : '') + (t ? ' "' + t + '"' : '') + ' .' + (c.className.baseVal != null ? '' : c.className.split(' ')[0]));
      if (d < 9) walk(c, d + 1); }); };
    walk(el, 0);
    return s + ' ' + Math.round(b0.width) + 'x' + Math.round(b0.height) + '\n' + L.slice(0, 80).join('\n');
  }), sels);
}
