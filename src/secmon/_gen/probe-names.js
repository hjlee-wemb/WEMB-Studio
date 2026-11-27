/* data-name 이 정규식에 맞는 요소들의 상태 — node pw.js probe-names.js <page> <regex> */
async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/' + args[0] + '.html?live=0&r=' + Date.now());
  await page.waitForTimeout(700);
  return await page.evaluate((re) => {
    const R = new RegExp(re);
    const out = [];
    document.querySelectorAll('[data-name]').forEach((e) => {
      const n = e.getAttribute('data-name');
      if (!R.test(n)) return;
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      let p = e.parentElement, path = [];
      while (p && path.length < 3) { if (p.getAttribute('data-name')) path.push(p.getAttribute('data-name')); p = p.parentElement; }
      out.push(n + ' <' + path.join('<') + '> ' + cs.display + ' vis=' + cs.visibility + ' op=' + cs.opacity + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + '] "' + (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + '" id=' + e.getAttribute('data-node-id'));
    });
    return out.join('\n');
  }, args[1]);
}
