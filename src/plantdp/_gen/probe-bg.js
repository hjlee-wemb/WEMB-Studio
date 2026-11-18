async (page) => {
  const out = {};
  for (const sc of ['main', 'sop-popup', 'building', 'floor', 'login']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForTimeout(1000);
    out[sc] = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => /screen-|background|stage-/.test(i.getAttribute('src'))).map((i) => {
      const b = i.getBoundingClientRect(), c = getComputedStyle(i);
      let a = i, chain = []; for (let k = 0; k < 4 && a; k++) { chain.push(a.dataset.name || (a.getAttribute('aria-hidden') ? '[aria]' : a.tagName)); a = a.parentElement; }
      return i.getAttribute('src').split('/').pop() + ' ' + [b.left, b.top, b.width, b.height].map(Math.round).join(',') + ' op=' + c.opacity + ' f=' + c.filter + ' content=' + (c.content !== 'normal' ? c.content.slice(0, 40) : '-') + ' chain=' + chain.join('<');
    }));
  }
  return out;
}
