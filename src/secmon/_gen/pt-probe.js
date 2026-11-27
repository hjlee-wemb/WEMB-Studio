/* 라이트에서 한 점 아래 쌓인 요소들의 배경 — node pw.js pt-probe.js <page> x y [theme] */
async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/' + args[0] + '.html?live=0&t=' + (args[3] || 'light') + '&r=' + Date.now());
  await page.waitForTimeout(700);
  return await page.evaluate(([x, y]) => document.elementsFromPoint(x, y).slice(0, 10).map((e) => {
    const cs = getComputedStyle(e);
    return (e.getAttribute('data-name') || e.tagName) + ' | ' + (e.className + '').slice(0, 40) + ' | bg=' + cs.backgroundColor + ' img=' + cs.backgroundImage.slice(0, 120) + ' op=' + cs.opacity + (e.tagName === 'IMG' ? ' src=' + e.getAttribute('src') : '');
  }).join('\n'), [+args[1], +args[2]]);
}
