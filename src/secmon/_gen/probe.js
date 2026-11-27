async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/main.html?live=0');
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const cr = document.querySelector('[data-name="CR"]'); const r = cr.getBoundingClientRect();
    const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    const chain = []; let e = el; while (e && chain.length < 8) { const cs = getComputedStyle(e); chain.push((e.getAttribute('data-name') || e.tagName) + ' z=' + cs.zIndex + ' pos=' + cs.position + ' ov=' + cs.overflow + ' op=' + cs.opacity + ' bg=' + cs.backgroundColor + ' ' + [e.getBoundingClientRect().y, e.getBoundingClientRect().height].map(Math.round)); e = e.parentElement; }
    const el2 = document.querySelector('[data-name="Event Log"]'); const cs2 = getComputedStyle(el2);
    return { cr: [r.x, r.y], chain, ev: cs2.zIndex + ' ' + cs2.position };
  });
}
