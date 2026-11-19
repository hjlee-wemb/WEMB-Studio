/* 팝업 · 툴바 안쪽 레이어 트리(이름 · 상자 · 글자). node pw.js dump-pop.js <장면> <셀렉터> [깊이] */
async (page, args) => {
  const [pg, sel, dep] = args;
  await page.goto('http://localhost:5590/src/oneview/' + pg + '.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate(([sel, D]) => {
    const lines = [];
    const R = (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(','); };
    function walk(e, d) {
      if (d > D) return;
      const n = e.getAttribute('data-name');
      const t = e.tagName === 'P' ? ' "' + e.textContent.trim().slice(0, 24) + '"' : '';
      if (n || t) lines.push('  '.repeat(d) + (n || e.tagName.toLowerCase()) + ' @' + R(e) + t + (e.tagName === 'IMG' ? ' img' : ''));
      [...e.children].forEach((c) => walk(c, d + 1));
    }
    document.querySelectorAll(sel).forEach((e) => walk(e, 0));
    return lines.slice(0, 400).join('\n');
  }, [sel, +(dep || 5)]);
}
