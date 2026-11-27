async (page) => {
  await page.goto('http://localhost:5600/src/datacenter/search.html?live=0&t=light');
  await page.waitForTimeout(800);
  return page.evaluate(() => {
    const p = [...document.querySelectorAll('.dms-root p')].find((x) => x.textContent.trim() === '관리번호');
    const cs = getComputedStyle(p);
    const chain = []; let e = p; while (e && chain.length < 6) { const c = getComputedStyle(e); chain.push((e.getAttribute('data-name') || e.tagName) + ' bg=' + c.backgroundColor + ' bi=' + c.backgroundImage.slice(0, 60)); e = e.parentElement; }
    const r = p.getBoundingClientRect();
    const under = document.elementsFromPoint(r.left + 2, r.top + r.height / 2).slice(0, 6).map((x) => (x.getAttribute('data-name') || x.tagName) + ' ' + getComputedStyle(x).backgroundColor + ' ' + getComputedStyle(x).backgroundImage.slice(0, 40));
    return { color: cs.color, fill: cs.webkitTextFillColor, bi: cs.backgroundImage.slice(0, 80), chain, under, cls: p.className };
  });
}
