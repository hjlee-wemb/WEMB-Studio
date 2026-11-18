/* 선택 그룹 구조 살피기 — 기간 단추 · SOP 목록 항목 · 칩 */
async (page) => {
  const out = {};
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5570/src/plantdp/weather.html?live=0&t=light');
  await page.waitForTimeout(1200);
  out.period = await page.evaluate(() => [...document.querySelectorAll('[data-name="Period Options"] > *')].map((o) => {
    const c = getComputedStyle(o), a = getComputedStyle(o, '::after'), p = o.querySelector('p');
    return [o.dataset.name, o.offsetWidth, o.offsetHeight, c.position, getComputedStyle(o.parentElement).display, c.backgroundColor, c.borderTopWidth + ' ' + c.borderTopColor, a.content !== 'none' ? 'after:' + a.borderTopWidth + ' ' + a.borderTopColor : '-', p && getComputedStyle(p).color, p && getComputedStyle(p).fontWeight].join(' | ');
  }));
  await page.goto('http://localhost:5570/src/plantdp/sop.html?live=0&t=light');
  await page.waitForTimeout(1200);
  out.sop = await page.evaluate(() => [...document.querySelectorAll('[data-name="Side Panel/SOP List"] [data-name^="Item/"]')].map((o) => o.dataset.name + ': ' + o.textContent.replace(/\s+/g, ' ').trim().slice(0, 80)));
  out.sopSel = await page.evaluate(() => { const s = document.querySelector('[data-name="Side Panel/SOP List"] [data-name="Select"]'); const b = s.getBoundingClientRect(); return [b.width, b.height, getComputedStyle(s).position]; });
  return out;
}
