async (page) => {
  const out = {};
  for (const t of ['light', 'dark']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/building.html?t=' + t + '&r=' + Date.now());
    await page.waitForTimeout(1500);
    out[t] = await page.evaluate(() => {
      const i = [...document.querySelectorAll('img')].find((x) => /screen-main-1/.test(x.getAttribute('src')));
      const b = i.getBoundingClientRect(), c = getComputedStyle(i);
      const par = i.parentElement, pc = getComputedStyle(par);
      const sib = [...par.children].map((x) => x.tagName + ':' + (x.getAttribute('src') || '').split('/').pop() + ':op' + getComputedStyle(x).opacity + ':bg' + getComputedStyle(x).backgroundImage.slice(0, 40) + getComputedStyle(x).backgroundColor);
      return { box: [b.left, b.top, b.width, b.height].map(Math.round), op: c.opacity, objFit: c.objectFit, objPos: c.objectPosition, mix: c.mixBlendMode, filter: c.filter, content: c.content.slice(0, 60), parentBg: pc.backgroundImage.slice(0, 60) + ' ' + pc.backgroundColor, parentAria: par.getAttribute('aria-hidden'), sib, stack: document.elementsFromPoint(960, 950).slice(0, 6).map((e) => (e.dataset.name || e.tagName) + ':' + getComputedStyle(e).backgroundColor) };
    });
  }
  return out;
}
