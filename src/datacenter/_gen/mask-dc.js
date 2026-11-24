async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/power.html?live=0');
  await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const out = [];
    document.querySelectorAll('[data-name="Flowchart"] > *, [data-name="Flowchart"] > * > *').forEach(e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); out.push((e.getAttribute('data-name') || e.tagName) + ' mask=' + cs.maskImage.slice(0, 40) + ' mpos=' + cs.maskPosition + ' msize=' + cs.maskSize + ' clip=' + cs.clipPath + ' ov=' + cs.overflow + ' ' + [r.y, r.height].map(Math.round)); });
    let p = document.querySelector('[data-name="Flowchart"]'); const anc = [];
    while (p && anc.length < 6) { const cs = getComputedStyle(p); anc.push((p.getAttribute('data-name') || p.tagName) + ' ' + cs.display + ' ov=' + cs.overflow + ' mask=' + cs.maskImage.slice(0, 30)); p = p.parentElement; }
    return { out: out.slice(0, 14), anc };
  });
}
