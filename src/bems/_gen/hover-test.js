async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const out = {};
  const T = args[0] || 'dark';
  const center = (sel) => page.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
  const byText = (t) => page.evaluate((t) => { const p = [...document.querySelectorAll('[data-name="Header"] p')].find((x) => x.textContent.trim() === t && x.getClientRects().length && !x.closest('.dc-dd')); const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, t);
  const state = () => page.evaluate(() => { const dd = document.querySelector('.dc-dd'); const a = document.querySelector('.dc-navarrow'); return { ddOpen: !!(dd && dd.classList.contains('dc-ddopen')), ddVis: dd && getComputedStyle(dd).visibility, arrowX: a && Math.round(a.getBoundingClientRect().left), act: [...document.querySelectorAll('.dc-navlab.dc-act')].map((p) => p.textContent.trim()), hot: [...document.querySelectorAll('.dc-navlab.dc-hot')].map((p) => p.textContent.trim()), tip: (document.querySelector('.dc-tip.on') || {}).textContent || null }; });
  for (const pg of ['main', 'worker']) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?t=' + T + '&r=' + Date.now());
    await page.waitForTimeout(1800);
    await page.mouse.move(900, 600);
    await page.waitForTimeout(400);
    const o = { rest: await state() };
    await page.screenshot({ path: GEN + 'hv-' + pg + '-rest-' + T + '.png', clip: { x: 300, y: 0, width: 1300, height: 200 } });
    let p = await byText('전력'); await page.mouse.move(p.x, p.y); await page.waitForTimeout(500);
    o.power = await state();
    await page.screenshot({ path: GEN + 'hv-' + pg + '-power-' + T + '.png', clip: { x: 300, y: 0, width: 1300, height: 200 } });
    const it2 = await center('.dc-dd [data-name="Label/Plan Power Diagram"]');
    if (it2) { await page.mouse.move(it2.x, it2.y - 30, { steps: 4 }); await page.mouse.move(it2.x, it2.y, { steps: 6 }); await page.waitForTimeout(400); o.ddItem2 = await state(); await page.screenshot({ path: GEN + 'hv-' + pg + '-dd2-' + T + '.png', clip: { x: 300, y: 0, width: 1300, height: 200 } }); }
    p = await byText('운영관리'); await page.mouse.move(p.x, p.y, { steps: 5 }); await page.waitForTimeout(500);
    o.ops = await state();
    await page.mouse.move(900, 600); await page.waitForTimeout(600);
    o.back = await state();
    out[pg] = o;
  }
  /* 툴팁 — 메인 옆 판 '시나리오' 단추 */
  await page.goto('http://localhost:5600/src/datacenter/main.html?t=' + T + '&r=' + Date.now());
  await page.waitForTimeout(1800);
  const b = await center('[data-name="Button/Scenario"] [data-name="Background"]');
  await page.mouse.move(b.x, b.y); await page.waitForTimeout(800);
  out.tip = await state();
  await page.screenshot({ path: GEN + 'hv-tip-' + T + '.png', clip: { x: 0, y: 60, width: 600, height: 260 } });
  return out;
}
