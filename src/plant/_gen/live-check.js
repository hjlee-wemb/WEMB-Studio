async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plant/_gen/';
  const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text().slice(0, 160)); });
  const out = {};
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:5541/src/plant/overview.html?t=dark&r=' + Date.now());
  await page.waitForTimeout(1800);
  await page.screenshot({ path: GEN + 'live-1920.png' });
  const margins = async () => page.evaluate(() => {
    const root = document.querySelector('.pfo-root'), R = root.getBoundingClientRect();
    const base = root.querySelector('[data-name="Base"]').getBoundingClientRect(), hero = root.querySelector('[data-name="Hero Image"]').getBoundingClientRect();
    return { base: [base.left - R.left, base.top - R.top, R.right - base.right, R.bottom - base.bottom].map((v) => Math.round(v)), heroCover: hero.left <= R.left + 1 && hero.right >= R.right - 1 && hero.bottom >= R.bottom - 1 };
  });
  out.m1920 = await margins();
  out.text = await page.evaluate(() => ({
    clock: [...document.querySelectorAll('[data-name="Timestamp"] p')].map((p) => p.textContent),
    row1: [...document.querySelectorAll('[data-name="Row/1"] p')].map((p) => p.textContent),
    rows: document.querySelectorAll('[data-name^="Row/"]').length,
  }));
  for (const [w, h, n] of [[1248, 852, '1248'], [2400, 1000, '2400']]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(900);
    await page.screenshot({ path: GEN + 'resp-' + n + '.png' });
    out['m' + n] = await margins();
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  out.errs = errs.slice(0, 12);
  return out;
}
