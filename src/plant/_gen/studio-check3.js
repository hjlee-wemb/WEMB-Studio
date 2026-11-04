/* 패널편집 · 접기 · 열 때마다 최근 시각 · 색 입력을 스튜디오에서 실제로 눌러 본다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plant/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 200)));
  await p.goto('http://localhost:5541/index.html#/templates/digital-twin-plant-power-facility');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /이 구성으로 스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pfo-root', { timeout: 15000 });
  await p.waitForTimeout(2500);
  const out = {};
  const R = '#dtStage .pfo-root ';
  const rectOf = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  const center = async (sel) => { const r = await rectOf(sel); return [r.x + r.w / 2, r.y + r.h / 2]; };
  /* 경보 목록 접기 */
  const a = await rectOf(R + '[data-node-id="6:342"]');
  let c = await center(R + '[data-node-id="7:351"]');
  await p.mouse.click(c[0], c[1]); await p.waitForTimeout(800);
  const b = await rectOf(R + '[data-node-id="6:342"]');
  await p.screenshot({ path: GEN + 'studio-event-fold.png' });
  c = await center(R + '[data-node-id="7:351"]');
  await p.mouse.click(c[0], c[1]); await p.waitForTimeout(800);
  const d = await rectOf(R + '[data-node-id="6:342"]');
  out.foldEvent = [Math.round(a.y), Math.round(b.y), Math.round(d.y)];
  /* 색 정하기 — 진짜 입력칸 */
  out.seedInput = await p.evaluate(() => { const i = document.getElementById('seed'); if (!i) return null; const was = i.value; i.value = '#e0662b'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); return [was, typeof state !== 'undefined' ? state.seed : '']; });
  await p.waitForTimeout(3000);
  out.afterSeed = await p.evaluate(() => ({ seed: state.seed, line: getComputedStyle(document.querySelector('.pfo-root [data-node-id="11:613"]')).backgroundColor, panelFilter: document.querySelector('.pfo-root [data-node-id="11:609"]').style.filter || (document.querySelector('.pfo-root [data-node-id="11:609"] img') || {style:{}}).style.filter, heroFilter: document.querySelector('.pfo-root [data-name="Hero Image"] img').style.filter, chue: document.querySelector('.pfo-root').style.getPropertyValue('--pf-chue') }));
  await p.screenshot({ path: GEN + 'studio-tint.png' });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#48b0e5'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1200);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('.pfo-root p')]; return { stage: document.getElementById('dtStage').className.replace(/\s+/g, ' ').slice(0, 120), total: ps.filter((x) => x.textContent.trim()).length, editable: ps.filter((x) => x.isContentEditable).length, notEditable: ps.filter((x) => !x.isContentEditable && x.textContent.trim()).map((x) => x.textContent.slice(0, 16)).slice(0, 6) }; });
  /* 글자 고치기 */
  const tc = await center(R + '[data-node-id="7:353"]');
  await p.mouse.click(tc[0], tc[1], { clickCount: 3 }); await p.keyboard.type('경보 목록'); await p.waitForTimeout(200);
  out.typed = await p.evaluate(() => document.querySelector('.pfo-root [data-node-id="7:353"]').textContent);
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  /* 끌어 옮기기 — 전기실 패널을 오른쪽으로(지도 그림을 잡는다) */
  const before = await rectOf(R + '[data-node-id="13:810"]');
  await p.mouse.move(before.x + 120, before.y + 60); await p.mouse.down();
  await p.mouse.move(1000, 400, { steps: 6 }); await p.mouse.move(1650, 420, { steps: 8 }); await p.waitForTimeout(250);
  out.ghost = await p.evaluate(() => !!document.querySelector('.pf-ghost'));
  await p.screenshot({ path: GEN + 'studio-drag.png' });
  await p.mouse.up(); await p.waitForTimeout(800);
  out.moved = { room: await rectOf(R + '[data-node-id="13:810"]'), equip: await rectOf(R + '[data-node-id="11:609"]') };
  /* 경보 목록을 위로 */
  const ev = await rectOf(R + '[data-node-id="6:342"]');
  await p.mouse.move(ev.x + 500, ev.y + 18); await p.mouse.down();
  await p.mouse.move(ev.x + 500, 500, { steps: 6 }); await p.mouse.move(ev.x + 500, 200, { steps: 6 }); await p.waitForTimeout(200);
  await p.mouse.up(); await p.waitForTimeout(800);
  out.evTop = { title: await rectOf(R + '[data-node-id="6:342"]'), room: await rectOf(R + '[data-node-id="13:810"]') };
  await p.screenshot({ path: GEN + 'studio-moved.png' });
  /* 차트 바꾸기 */
  out.chartBtns = await p.evaluate(() => [...document.querySelectorAll('.pf-chartbtn')].filter((b) => getComputedStyle(b).display !== 'none').length);
  const btns = await p.evaluate(() => [...document.querySelectorAll('.pf-chartbtn')].map((b) => { const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }));
  out.menus = [];
  for (let i = 0; i < btns.length; i++) {
    await p.mouse.click(btns[i][0], btns[i][1]); await p.waitForTimeout(250);
    const m = await p.evaluate((i) => { const menu = document.querySelectorAll('.pf-chartmenu')[i]; const it = menu.querySelector('button[data-i="0"]'); const r = it.getBoundingClientRect(); return { open: menu.classList.contains('open'), list: [...menu.querySelectorAll('button')].map((b) => b.textContent.trim()), at: [r.left + r.width / 2, r.top + r.height / 2] }; }, i);
    out.menus.push({ open: m.open, list: m.list });
    await p.mouse.click(m.at[0], m.at[1]); await p.waitForTimeout(500);
  }
  await p.waitForTimeout(3200);
  await p.screenshot({ path: GEN + 'studio-charts.png' });
  out.charts = await p.evaluate(() => document.querySelectorAll('.pfo-root .pf-chart').length);
  /* 차트가 움직이는가 */
  const snap = () => p.evaluate(() => [...document.querySelectorAll('.pfo-root .pf-chart')].map((c) => c.textContent.slice(-40)).join('|'));
  const s1 = await snap(); await p.waitForTimeout(3500); const s2 = await snap();
  out.chartsLive = s1 !== s2;
  /* 배치 초기화 */
  const rb = await p.evaluate(() => { const b = document.querySelector('.pf-resetbtn'); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, getComputedStyle(b).display]; });
  out.resetBtn = rb[2];
  await p.mouse.click(rb[0], rb[1]); await p.waitForTimeout(900);
  out.afterReset = { charts: await p.evaluate(() => document.querySelectorAll('.pfo-root .pf-chart').length), room: await rectOf(R + '[data-node-id="13:810"]'), title: await rectOf(R + '[data-node-id="6:342"]') };
  /* 다시 열면 시각이 새로 찍히는가 */
  await p.evaluate(() => { const b = document.getElementById('editAll'); if (b) b.click(); });
  const t1 = await p.evaluate(() => document.querySelector('.pfo-root [data-name="Row/2"] [data-name="Td/Time"] p').textContent);
  await p.waitForTimeout(61000);
  await p.reload(); await p.waitForSelector('#dtStage .pfo-root', { timeout: 15000 }); await p.waitForTimeout(1500);
  out.reopen = { before: t1, after: await p.evaluate(() => document.querySelector('.pfo-root [data-name="Row/2"] [data-name="Td/Time"] p').textContent), now: await p.evaluate(() => document.querySelectorAll('.pfo-root [data-name="Timestamp"] p')[2].textContent), typedKept: await p.evaluate(() => document.querySelector('.pfo-root [data-node-id="7:353"]').textContent) };
  out.errs = errs.slice(0, 8);
  await ctx.close();
  return out;
}
