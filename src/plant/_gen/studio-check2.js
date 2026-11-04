/* 스튜디오에서 기능을 실제로 눌러 본다 — studio-check.js 가 연 창을 이어서 쓴다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plant/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5541/index.html#/templates/digital-twin-plant-power-facility');
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /이 구성으로 스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pfo-root', { timeout: 15000 });
  await p.waitForTimeout(2500);
  const out = {};
  const rectOf = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  const center = async (sel) => { const r = await rectOf(sel); return [r.x + r.w / 2, r.y + r.h / 2]; };
  const R = '#dtStage .pfo-root ';
  /* 시계 */
  const clock = () => p.evaluate(() => [...document.querySelectorAll('.pfo-root [data-name="Timestamp"] p')].map((x) => x.textContent).join(' '));
  const c1 = await clock(); await p.waitForTimeout(2100); const c2 = await clock();
  out.clock = [c1, c2, c1 !== c2];
  out.row1 = await p.evaluate(() => document.querySelector('.pfo-root [data-name="Row/1"] [data-name="Td/Time"] p').textContent);
  /* 메뉴 hover */
  const navL = R + '[data-name="Nav Item/Electrical Room Status"]';
  const navSrc = () => p.evaluate((s) => document.querySelector(s + ' > [data-name="Background"] img').getAttribute('src').split('/').pop(), navL);
  const n0 = await navSrc();
  const nc = await center(navL); await p.mouse.move(nc[0], nc[1]); await p.waitForTimeout(350);
  const n1 = await navSrc(); await p.screenshot({ path: GEN + 'studio-hover.png', clip: { x: 340, y: 40, width: 700, height: 110 } });
  await p.mouse.move(900, 500); await p.waitForTimeout(250);
  out.navHover = [n0, n1, await navSrc()];
  /* 접기 — 경보 목록 · 설비 · 전기실 */
  const foldTest = async (btn, probe) => {
    const a = await rectOf(probe); const c = await center(btn);
    await p.mouse.click(c[0], c[1]); await p.waitForTimeout(800);
    const b = await rectOf(probe); const c2b = await center(btn);
    await p.mouse.click(c2b[0], c2b[1]); await p.waitForTimeout(800);
    const d = await rectOf(probe);
    return { before: [Math.round(a.x), Math.round(a.y)], folded: [Math.round(b.x), Math.round(b.y)], after: [Math.round(d.x), Math.round(d.y)] };
  };
  out.foldEvent = await foldTest(R + '[data-node-id="7:351"]', R + '[data-node-id="6:342"]');
  out.foldEquip = await foldTest(R + '[data-node-id="13:801"]', R + '[data-node-id="11:609"]');
  out.foldRoom = await foldTest(R + '[data-node-id="13:893"]', R + '[data-node-id="13:810"]');
  /* 전기실 · 트리 고르기 */
  const oc = await center(R + '[data-name="Option/Electrical Room 2"]'); await p.mouse.click(oc[0], oc[1]); await p.waitForTimeout(300);
  const tc = await center(R + '[data-name="Tree Item/Panel 3"]'); await p.mouse.click(tc[0], tc[1]); await p.waitForTimeout(800);
  out.pick = await p.evaluate(() => document.querySelector('.pfo-root [data-node-id="13:800"]').textContent);
  await p.screenshot({ path: GEN + 'studio-picked.png' });
  /* 칩 거르기 */
  const cc = await center(R + '[data-name="Count/Critical"]'); await p.mouse.click(cc[0], cc[1]); await p.waitForTimeout(300);
  out.chipCR = await p.evaluate(() => ({ vis: [...document.querySelectorAll('.pfo-root [data-name^="Row/"]')].filter((r) => !r.classList.contains('pf-empty')).length, src: document.querySelector('.pfo-root [data-name="Count/Critical"] > [data-name="Background"] img').getAttribute('src').split('/').pop() }));
  const ca = await center(R + '[data-name="Count/All (Selected)"]'); await p.mouse.click(ca[0], ca[1]); await p.waitForTimeout(200);
  /* 새 경보 — 최대 18초 */
  const all0 = await p.evaluate(() => document.querySelector('.pfo-root [data-name="Count/All (Selected)"] [data-name="Value Box"] p').textContent);
  await p.waitForFunction((v) => document.querySelector('.pfo-root [data-name="Count/All (Selected)"] [data-name="Value Box"] p').textContent !== v, all0, { timeout: 19000 }).catch(() => {});
  out.feed = await p.evaluate(() => ({ all: document.querySelector('.pfo-root [data-name="Count/All (Selected)"] [data-name="Value Box"] p').textContent, time: document.querySelector('.pfo-root [data-name="Row/1"] [data-name="Td/Time"] p').textContent, clock: document.querySelectorAll('.pfo-root [data-name="Timestamp"] p')[2].textContent }));
  out.feed.from = all0;
  /* 라이트 · 다크 */
  const setMode = (m) => p.evaluate((m) => document.querySelector('#mode button[data-m="' + m + '"]').click(), m);
  await setMode('light'); await p.waitForTimeout(1200);
  out.light = await p.evaluate(() => document.querySelector('.pfo-root').dataset.theme);
  await p.screenshot({ path: GEN + 'studio-light.png' });
  await setMode('dark'); await p.waitForTimeout(1200);
  out.dark = await p.evaluate(() => document.querySelector('.pfo-root').dataset.theme);
  /* 색 정하기 — 기준색 */
  out.colorInputs = await p.evaluate(() => [...document.querySelectorAll('input[type=color]')].map((i) => i.id || i.name || i.className).slice(0, 6));
  out.seed = await p.evaluate(() => { if (typeof state === 'undefined') return 'no state'; const before = state.seed; state.seed = '#e0662b'; state.source = 'seed'; state.overrides = {}; if (typeof apply === 'function') apply(); return before; });
  await p.waitForTimeout(3000);
  out.tinted = await p.evaluate(() => ({ line: getComputedStyle(document.querySelector('.pfo-root [data-node-id="11:613"]')).backgroundColor, hero: getComputedStyle(document.querySelector('.pfo-root [data-name="Hero Image"] img')).filter, title: document.querySelector('.pfo-root [data-node-id="6:342"]').style.filter || getComputedStyle(document.querySelector('.pfo-root [data-node-id="6:342"]')).filter, crMarker: getComputedStyle(document.querySelector('.pfo-root [data-node-id="7:436"]')).filter, crValue: getComputedStyle(document.querySelector('.pfo-root [data-node-id="7:439"]')).color }));
  await p.screenshot({ path: GEN + 'studio-tint.png' });
  await p.evaluate((s) => { state.seed = s; state.source = 'seed'; state.overrides = {}; if (typeof apply === 'function') apply(); }, out.seed);
  await p.waitForTimeout(1500);
  await ctx.close();
  return out;
}
