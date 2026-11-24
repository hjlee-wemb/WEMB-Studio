/* 스튜디오 안 3D 확대 — 휠 · 더블 클릭 · 패널편집 중 막힘. node pw.js studio-zoom-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5600/index.html#/templates');
  await page.waitForTimeout(1200);
  await page.locator('text=Data Center Integrated Monitoring').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .dmm-root.dc-live', { timeout: 20000 });
  await page.waitForTimeout(2000);
  const st = () => page.evaluate(() => { const s = document.querySelector('#dtStage .dc-root').__dc.stage.state(); return +s.s.toFixed(2); });
  const pt = await page.evaluate(() => { const d = document.querySelector('#dtStage .dc-root').__dc; const f = d.frame.getBoundingClientRect(); return { x: f.left + 1000 * d.S, y: f.top + 470 * d.S }; });
  await page.mouse.move(pt.x, pt.y);
  for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); }
  await page.waitForTimeout(300);
  const out = { wheel: await st() };
  await page.waitForTimeout(700);
  await page.screenshot({ path: GEN + 'szm-wheel.png' });
  out.tip = await page.evaluate(() => (document.querySelector('#dtStage .dc-tip.on') || {}).textContent || null);
  await page.mouse.dblclick(pt.x, pt.y); await page.waitForTimeout(700);
  out.back = await st();
  await page.locator('#editAll').click(); await page.waitForTimeout(800);
  await page.mouse.move(pt.x, pt.y);
  await page.mouse.wheel(0, 200); await page.waitForTimeout(300);
  out.editWheel = await st();
  await page.locator('#editAll').click();
  out.errs = errs;
  return out;
}
