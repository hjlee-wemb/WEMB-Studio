async (page) => {
  const pts = (globalThis.__ARGS || []).slice(1).map((s) => s.split(',').map(Number));
  await page.goto('http://localhost:5590/src/oneview/' + (globalThis.__ARGS[0] || 'network') + '.html?live=0&t=light&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {});
  return await page.evaluate((pts) => pts.map(([x, y]) => document.elementsFromPoint(x, y).slice(0, 7).map((e) => {
    const s = getComputedStyle(e); const im = e.tagName === 'IMG' ? e.src.split('/').pop() + ' content:' + s.content.slice(0, 60) : '';
    return e.tagName + ' ' + (e.getAttribute('data-name') || e.className.baseVal || e.className) + ' bg:' + s.backgroundColor + ' bi:' + s.backgroundImage.slice(0, 70) + ' ' + im;
  })), pts);
}
