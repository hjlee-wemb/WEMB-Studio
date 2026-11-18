/* 스튜디오 이벤트 현황 — 접기 단추가 왜 안 먹나 */
async (page) => {
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on('console', (m) => logs.push(m.type() + ' ' + m.text().slice(0, 200)));
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => window.__gotoPlantdpScene('event'));
  await p.waitForSelector('#dtStage .pde-root', { timeout: 6000 });
  await p.waitForTimeout(1500);
  const q = () => p.evaluate(() => {
    const el = document.querySelector('#dtStage .pde-root [data-name="Event Log"]');
    const c = el.querySelector('[data-name="Button/Collapse"]');
    const b = c.getBoundingClientRect();
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { shut: el.classList.contains('pd-shut'), tr: getComputedStyle(el).translate, top: Math.round(el.getBoundingClientRect().top), c: [b.left, b.top, b.width, b.height].map(Math.round), hit: hit && (hit.closest('[data-name]') || hit).getAttribute('data-name'), hitCls: hit && String(hit.className).slice(0, 80), click: c.classList.contains('pd-click'), pos: getComputedStyle(c).position, z: getComputedStyle(c).zIndex, par: [...el.querySelectorAll('[data-name="Button/Collapse"]')].length };
  });
  const r0 = await q();
  const im = await p.evaluate(() => { const i = document.querySelector('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Collapse"] img'); const b = i.getBoundingClientRect(); const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return [b.left + b.width / 2, b.top + b.height / 2, h && h.tagName + ' ' + (h.closest('[data-name]') || h).getAttribute('data-name') + ' / ' + (h.closest('.pd-click') || {}).className]; });
  r0.im = im;
  r0.rows = await p.evaluate(() => { const el = document.querySelector('#dtStage .pde-root [data-name="Event Log"]'); const t = [...el.querySelectorAll('p')].find((x) => /d{2}:d{2}:d{2}/.test(x.textContent)); const out = []; let n = t; for (let i = 0; i < 5 && n; i++) { out.push((n.dataset && n.dataset.name) || n.className); n = n.parentElement; } return out; });
  await p.mouse.click(im[0], im[1]);
  await p.waitForTimeout(800);
  const r1 = await q();
  await p.evaluate(() => document.querySelector('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Collapse"]').click());
  await p.waitForTimeout(800);
  const r2 = await q();
  await ctx.close();
  return { r0, r1, r2, logs: logs.filter((l) => !/favicon|404/.test(l)).slice(-8) };
}
