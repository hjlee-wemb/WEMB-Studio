async (page, args) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const out = {};
  for (const pg of args) {
    const errs = [];
    const onE = (e) => errs.push(String(e).slice(0, 200));
    page.on('pageerror', onE);
    await page.goto('http://localhost:5620/src/secmon/' + pg + '.html?r=' + Date.now());
    await page.waitForTimeout(9000);
    await page.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/livew-' + pg + '.png' });
    page.off('pageerror', onE);
    out[pg] = errs;
  }
  return out;
}
