/* 한 요소 안쪽을 배경 · 테두리 · 이미지까지 뽑는다. node pw.js dump-deep.js <장면> <셀렉터> [깊이] [n번째] */
async (page, args) => {
  const [pg, sel, dep, nth] = args;
  await page.goto('http://localhost:5590/src/oneview/' + pg + '.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate(([sel, D, N]) => {
    const lines = [];
    const R = (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(','); };
    function walk(e, d) {
      if (d > D) return;
      const cs = getComputedStyle(e);
      const bits = [];
      if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bits.push('bg=' + cs.backgroundColor);
      if (cs.backgroundImage !== 'none') bits.push('bgi=' + cs.backgroundImage.slice(0, 60));
      if (parseFloat(cs.borderTopWidth)) bits.push('bd=' + cs.borderTopWidth + ' ' + cs.borderTopColor);
      if (e.tagName === 'IMG') bits.push('img=' + e.getAttribute('src'));
      if (e.tagName === 'P') bits.push('"' + e.textContent.trim().slice(0, 20) + '" ' + cs.color + ' ' + cs.fontSize);
      lines.push('  '.repeat(d) + (e.getAttribute('data-name') || e.tagName.toLowerCase()) + ' .' + (e.className && e.className.baseVal == null ? String(e.className).split(' ')[0] : '') + ' @' + R(e) + ' ' + bits.join(' '));
      [...e.children].forEach((c) => walk(c, d + 1));
    }
    const els = document.querySelectorAll(sel);
    const e = els[N || 0];
    if (e) walk(e, 0);
    return els.length + ' matches\n' + lines.slice(0, 160).join('\n');
  }, [sel, +(dep || 6), +(nth || 0)]);
}
