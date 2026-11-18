/* 단위 글자(℃) 주변 계산 스타일 — node pw.js peek-unit.js */
async (page) => {
  await page.goto('http://localhost:5570/src/plantdp/event.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(500);
  return await page.evaluate(() => {
    const sp = [...document.querySelectorAll('span')].find((x) => x.textContent === '℃');
    const p = sp.parentElement;
    const cs = (e) => { const c = getComputedStyle(e); return { tag: e.tagName, cls: e.className, display: c.display, lh: c.lineHeight, fs: c.fontSize, ai: c.alignItems, va: c.verticalAlign, pos: c.position, top: c.top, h: e.getBoundingClientRect().height }; };
    return { p: cs(p), spans: [...p.children].map(cs), html: p.outerHTML.slice(0, 400) };
  });
}
