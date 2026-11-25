async (page, args) => {
  const name = args[0];
  await page.setViewportSize({ width: 1600, height: 1400 });
  await page.goto('http://localhost:5600/index.html#/templates/digital-twin-data-center-integrated-monitoring');
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await page.waitForSelector('#dtStage .dmm-root', { timeout: 15000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await page.waitForTimeout(500);
  await page.evaluate((n) => { const t = [...document.querySelectorAll('#libTabs button, #libTabs [role=tab]')].find((x) => x.textContent.trim() === n); if (t) t.click(); }, args[1] || '심볼');
  await page.waitForTimeout(3000);
  return page.evaluate((name) => {
    const c = [...document.querySelectorAll('#libGrid > *')].find((x) => (x.querySelector('.lname') || {}).textContent === name);
    if (!c) return 'no card';
    c.scrollIntoView();
    const a = c.querySelector('.hj-asset'); const ar = a.getBoundingClientRect();
    const out = { asset: [ar.x, ar.y, ar.width, ar.height].map(Math.round), tf: getComputedStyle(a).transform, html: a.innerHTML.slice(0, 300) };
    out.kids = [...a.querySelectorAll('*')].filter((e) => getComputedStyle(e).display !== 'contents').slice(0, 8).map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return (e.getAttribute('data-name') || e.className.slice(0, 20)) + ' ' + [r.x - ar.x, r.y - ar.y, r.width, r.height].map(Math.round).join(',') + ' pos=' + cs.position + ' l=' + cs.left + ' t=' + cs.top; });
    return out;
  }, name);
}
