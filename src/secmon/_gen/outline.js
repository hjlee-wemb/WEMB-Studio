/* 장면의 data-name 나무(깊이 제한) + 상자 — node pw.js outline.js <page> [depth] */
async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/' + args[0] + '.html?live=0&r=' + Date.now());
  await page.waitForTimeout(700);
  const D = +(args[1] || 4);
  return await page.evaluate(([D, SEL]) => {
    const out = [];
    const root = document.querySelector(SEL || '[class$="-root"], [class*="-root "]');
    function walk(el, d, pre) {
      for (const c of el.children) {
        const n = c.getAttribute('data-name');
        if (!n) { walk(c, d, pre); continue; }
        const r = c.getBoundingClientRect();
        const t = c.children.length === 0 ? (c.textContent || '').trim().slice(0, 30) : '';
        out.push(pre + n + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ']' + (t ? ' "' + t + '"' : '') + (c.children.length ? ' (' + c.children.length + ')' : ''));
        if (d < D) walk(c, d + 1, pre + '  ');
      }
    }
    walk(root, 0, '');
    return out.join('\n');
  }, [D, args[2]]);
}
