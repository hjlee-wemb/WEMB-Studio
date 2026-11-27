async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5620/src/secmon/micro.html?live=0&t=light&r=' + Date.now());
  await page.waitForTimeout(700);
  return await page.evaluate(() => {
    const p = [...document.querySelectorAll('p')].find((x) => x.textContent.trim() === '주식주문');
    const row = p.closest('[data-name^="Row"]') || p.parentElement.parentElement;
    return [...row.querySelectorAll('[data-name]')].slice(0, 12).map((e) => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); return e.getAttribute('data-name') + ' [' + [r.left, r.top, r.width, r.height].map(Math.round) + '] bg=' + cs.backgroundColor + ' img=' + cs.backgroundImage.slice(0, 90) + ' child=' + (e.querySelector(':scope > img') ? e.querySelector(':scope > img').getAttribute('src') : '') + ' id=' + e.getAttribute('data-node-id'); }).concat(['ROW ' + row.getAttribute('data-name')]);
  });
}
