/* 스튜디오 실검증 — 홈 → 템플릿 카드 → '이 구성으로 스튜디오 열기' → #dtStage 여백 · 테마 · 장면 이동 시간 · 콘솔 오류.
   실행: node pw.js studio-test.js [w] [h] */
async (page, args) => {
  const W = +(args[0] || 1568), H = +(args[1] || 1032);
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/indpark/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.setViewportSize({ width: W, height: H });
  await page.goto('http://localhost:5560/index.html#/templates');
  await page.waitForTimeout(1500);
  const card = page.locator('text=Smart Industrial Complex').first();
  await card.click();
  await page.waitForTimeout(800);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .ipm-root', { timeout: 20000 });
  await page.waitForTimeout(3000);
  const out = {};
  const geo = async () => page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('[class*="ip"][class$="-root"], [class*="-root"][data-theme]');
    const f = r && r.querySelector(':scope > [data-node-id]');
    const a = st.getBoundingClientRect(), b = f ? f.getBoundingClientRect() : null;
    return { stage: [Math.round(a.width), Math.round(a.height)], frame: b && [Math.round(b.width), Math.round(b.height)],
      margin: b && [Math.round(b.left - a.left), Math.round(b.top - a.top), Math.round(a.right - b.right), Math.round(a.bottom - b.bottom)],
      root: r && r.className, theme: r && r.dataset.theme, live: !!(r && r.__ip), lines: st.querySelectorAll('.ip-live-data polyline').length };
  });
  out.open = await geo();
  await page.screenshot({ path: GEN + 'st-main-' + W + '.png' });
  /* 장면 이동 — 헤더 '이벤트 현황' */
  const t0 = Date.now();
  await page.evaluate(() => { const n = document.querySelector('#dtStage .ipm-root [data-name="Nav Item/Event Status"]'); n && n.click(); });
  await page.waitForSelector('#dtStage .ipe-root', { timeout: 10000 }).catch(() => {});
  out.navEventMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  out.event = await geo();
  /* 다시 종합 운영현황 */
  const t1 = Date.now();
  await page.evaluate(() => { const n = document.querySelector('#dtStage .ipe-root [data-name^="Nav Item/Operation Overview"]'); n && n.click(); });
  await page.waitForSelector('#dtStage .ipm-root', { timeout: 10000 }).catch(() => {});
  out.navMainMs = Date.now() - t1;
  await page.waitForTimeout(1500);
  /* 테마 — 라이트 */
  out.modeButtons = await page.evaluate(() => [...document.querySelectorAll('#mode button')].map((b) => b.dataset.m));
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
  await page.waitForTimeout(1200);
  out.light = await geo();
  await page.screenshot({ path: GEN + 'st-main-' + W + '-light.png' });
  /* 이동 뒤에도 라이트가 이어지는지 */
  await page.evaluate(() => { const n = document.querySelector('#dtStage .ipm-root [data-name="Nav Item/Sensor Status"]'); n && n.click(); });
  await page.waitForSelector('#dtStage .ipt-root', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1500);
  out.sensorLight = await geo();
  await page.screenshot({ path: GEN + 'st-sensor-' + W + '-light.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="dark"]'); b && b.click(); });
  await page.waitForTimeout(800);
  out.errs = errs.slice(0, 15);
  return out;
}
