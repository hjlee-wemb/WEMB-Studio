/* 노드 id 들의 실제 상자 · 계산 스타일을 잰다. node pw.js probe-bx.js <page> <id,id,…> */
async (page, args) => {
  const [pg, ids] = args;
  await page.goto('http://localhost:5610/src/bems/' + pg + '.html?live=0&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((ids) => ids.split(',').map((id) => {
    const e = document.querySelector('[data-node-id="' + id + '"]');
    if (!e) return id + ' missing';
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
    const kids = [...e.children].map((c) => { const q = c.getBoundingClientRect(); return c.tagName + ' ' + Math.round(q.x) + ',' + Math.round(q.y) + ' ' + Math.round(q.width) + 'x' + Math.round(q.height) + ' d=' + getComputedStyle(c).display + ' va=' + getComputedStyle(c).verticalAlign + ' lh=' + getComputedStyle(c).lineHeight; });
    return id + ' ' + e.className.slice(0, 60) + ' | ' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' disp=' + cs.display + ' lh=' + cs.lineHeight + ' fs=' + cs.fontSize + ' ff=' + cs.fontFamily.slice(0, 30) + ' || ' + kids.join(' ; ');
  }), ids);
}
