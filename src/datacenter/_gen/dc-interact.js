async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const warns = [];
  page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') warns.push(m.text().slice(0, 160)); });
  const go = async (pg) => { await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?r=' + Date.now()); await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} }); await page.reload(); await page.waitForTimeout(1800); };
  const out = {};
  await go('main');
  out.mainClick = await page.evaluate(() => {
    const st = document.querySelector('.dc-root').__dc;
    return { scene: st.scene, nav: document.querySelectorAll('.dc-nav').length, btn: document.querySelectorAll('.dc-btn').length, rows: document.querySelectorAll('.dc-row').length, items: document.querySelectorAll('.dc-item').length, charts: document.querySelectorAll('.dc-chartbtn').length, clock: [...document.querySelectorAll('p')].filter(p => /^\d\d:\d\d:\d\d$/.test(p.textContent)).map(p => p.textContent) };
  });
  await page.click('[data-name="Event Log"] [data-name="Event Log/Toolbar Button (Dark)"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: GEN + 'ia-main-fold.png' });
  await page.click('[data-name="Event Log"] [data-name="Event Log/Toolbar Button (Dark)"]', { force: true });
  await page.waitForTimeout(900);
  await page.click('[data-name="CR"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: GEN + 'ia-main-filter.png' });
  await go('worker');
  await page.click('[data-name="Widget/Work List"] [data-name="Section 1"] > div:last-child');
  await page.waitForTimeout(900);
  await page.screenshot({ path: GEN + 'ia-worker-open.png' });
  await go('power');
  const sc = await page.$('[data-name="Scenario Steps"]');
  out.power = await page.evaluate(() => ({ thumb: !!document.querySelector('.dc-thumb'), host: document.querySelectorAll('.dc-scrollhost').length }));
  const box = await page.evaluate(() => { const e = document.querySelector('.dc-scrollhost'); const r = e && e.getBoundingClientRect(); return r ? [r.x + r.width / 2, r.y + r.height / 2] : null; });
  if (box) { await page.mouse.move(box[0], box[1]); await page.mouse.wheel(0, 300); await page.waitForTimeout(600); }
  await page.screenshot({ path: GEN + 'ia-power-scroll.png' });
  for (const pg of ['equipment', 'card', 'search', 'scenario', 'asset']) {
    await go(pg);
    out[pg] = await page.evaluate(() => { const st = document.querySelector('.dc-root').__dc; return { scene: st.scene, overlay: st.overlay, btn: document.querySelectorAll('.dc-btn,.dc-close').length, rows: document.querySelectorAll('.dc-row').length, charts: document.querySelectorAll('.dc-chartbtn').length }; });
  }
  await go('scenario');
  const tr = await page.evaluate(() => { const e = document.querySelector('[data-name="Popup/Scenario Description"] [data-name="Td/Scenario Name"]'); const r = e.getBoundingClientRect(); return [r.x + 20, r.y + 29 * 2 + 10]; });
  await page.mouse.click(tr[0], tr[1]);
  await page.waitForTimeout(600);
  await page.screenshot({ path: GEN + 'ia-scenario.png' });
  out.warns = warns;
  return out;
}
