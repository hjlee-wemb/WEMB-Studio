/* 조작 안내(확대 · 부분 확대 · 되돌아오기) 실제 마우스 검증. node pw.js zoom-test.js [w h] */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const W = +(args[0] || 1920), H = +(args[1] || 1080);
  await page.setViewportSize({ width: W, height: H });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:5600/src/datacenter/main.html?r=' + Date.now());
  await page.waitForTimeout(1800);
  const st = () => page.evaluate(() => { const r = document.querySelector('.dc-root').__dc; const s = r.stage.state(); return { s: +s.s.toFixed(2), tx: Math.round(s.tx), ty: Math.round(s.ty), flash: [...document.querySelectorAll('.dc-hintflash')].map((e) => e.getAttribute('data-name')) }; });
  /* 3D 장면 위 한 점(건물 4F 근처) — 보이는 곳 */
  const pt = await page.evaluate(() => { const f = document.querySelector('.dc-root').__dc.frame.getBoundingClientRect(), S = document.querySelector('.dc-root').__dc.S; return { x: f.left + 1000 * S, y: f.top + 500 * S }; });
  const hit = await page.evaluate((p) => { const h = document.elementFromPoint(p.x, p.y); return h && (h.getAttribute('data-name') || h.tagName); }, pt);
  const out = { hit, start: await st() };
  await page.mouse.move(pt.x, pt.y);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); }
  await page.waitForTimeout(250);
  out.wheelDown = await st();
  const p1 = await page.evaluate((p) => { const im = document.querySelector('[data-name="Scene Image"]'); return 1; }, pt);
  await page.screenshot({ path: GEN + 'zm-wheel.png' });
  await page.mouse.wheel(0, -100); await page.waitForTimeout(250);
  out.wheelUp = await st();
  /* 끌기 */
  await page.mouse.down(); await page.mouse.move(pt.x - 200, pt.y - 60, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(200);
  out.drag = await st();
  /* 되돌아오기 — 확대 중 더블 클릭 */
  await page.mouse.dblclick(pt.x, pt.y);
  await page.waitForTimeout(700);
  out.back = await st();
  /* 부분 확대 — 더블 클릭 */
  await page.mouse.dblclick(pt.x, pt.y);
  await page.waitForTimeout(150);
  out.partFlash = (await st()).flash;
  await page.waitForTimeout(600);
  out.part = await st();
  await page.screenshot({ path: GEN + 'zm-part.png' });
  /* 안내 줄 누르기 — 되돌아오기 */
  const it = await page.evaluate(() => { const e = document.querySelector('[data-name="Item/Return to View"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.click(it.x, it.y); await page.waitForTimeout(700);
  out.hintBack = await st();
  /* 층 목록 — 지상02층 */
  const fl = await page.evaluate(() => { const e = [...document.querySelectorAll('[data-name^="Item/"]')].find((x) => x.textContent.trim() === '지상02층'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.click(fl.x, fl.y); await page.waitForTimeout(700);
  out.floor2 = await st();
  await page.screenshot({ path: GEN + 'zm-floor.png' });
  /* Reset 단추 */
  const rs = await page.evaluate(() => { const e = document.querySelector('[data-name="Button/Reset"]'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.click(rs.x, rs.y); await page.waitForTimeout(700);
  out.reset = await st();
  out.errs = errs;
  return out;
}
