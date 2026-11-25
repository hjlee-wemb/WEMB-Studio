/* 라이브 미리보기 점검 — node pw.js live-check.js [w h theme]  → live-<page>-<w>.png + 상태 */
async (page, args) => {
  const [W, H, T] = [+(args[0] || 1920), +(args[1] || 1080), args[2] || 'dark'];
  await page.setViewportSize({ width: W, height: H });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/bems/_gen/';
  const out = {};
  for (const pg of ['main', 'floor']) {
    const errs = [];
    const h = (m) => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 160)); };
    page.on('console', h);
    await page.goto('http://localhost:5610/src/bems/' + pg + '.html?t=' + T + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: GEN + 'live-' + pg + '-' + W + (T === 'light' ? '-light' : '') + '.png' });
    out[pg] = await page.evaluate(() => {
      const r = document.querySelector('.be-root');
      const st = r && r.__be;
      const d = document.querySelector('[data-name="Date Time"]');
      return {
        live: !!st, scene: st && st.scene, clock: d && d.textContent.replace(/\s+/g, ' ').trim(),
        ev: [...document.querySelectorAll('[data-name="Event List"] [data-name="Content"] > p')].slice(0, 3).map((p) => p.textContent),
        tree: !!document.querySelector('.be-tree'), water: !!document.querySelector('svg.be-water'),
        bars: document.querySelectorAll('[data-name="Bar"]').length, tips: document.querySelectorAll('[data-be-tip]').length,
        chartBtns: document.querySelectorAll('.be-chartbtn').length,
      };
    });
    out[pg].errs = errs;
    page.off('console', h);
  }
  return out;
}
