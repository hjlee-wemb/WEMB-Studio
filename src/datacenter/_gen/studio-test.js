/* 스튜디오 실검증 — 홈 → 템플릿 카드 → '이 구성으로 스튜디오 열기' → #dtStage 여백 · 라이브 · 장면 이동(헤더 메뉴 · 팝업) 시간 · 테마 · 콘솔 오류.
   실행: node pw.js studio-test.js [w] [h] */
async (page, args) => {
  const W = +(args[0] || 1568), H = +(args[1] || 1032);
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /\[dc\]/.test(m.text()))) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.setViewportSize({ width: W, height: H });
  await page.goto('http://localhost:5600/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /datacenter/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  await page.waitForTimeout(1500);
  await page.locator('text=Data Center Integrated Monitoring').first().click();
  await page.waitForTimeout(800);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .dmm-root', { timeout: 20000 });
  await page.waitForTimeout(3000);
  const out = {};
  const geo = async () => page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.dc-root') || st.querySelector('[class*="-root"]');
    const f = r && r.querySelector(':scope > [data-node-id]');
    const a = st.getBoundingClientRect(), b = f ? f.getBoundingClientRect() : null, fill = r && r.querySelector('.dc-bgfill');
    const fr = fill && fill.getBoundingClientRect();
    return { stage: [Math.round(a.width), Math.round(a.height)], frame: b && [Math.round(b.width), Math.round(b.height)],
      fillGap: fr && [Math.round(fr.left - a.left), Math.round(fr.top - a.top), Math.round(a.right - fr.right), Math.round(a.bottom - fr.bottom)],
      root: r && r.className, theme: r && r.dataset.theme, live: !!(r && r.__dc), scene: r && r.__dc && r.__dc.scene, texts: r ? r.querySelectorAll('p').length : 0 };
  });
  out.open = await geo();
  await page.screenshot({ path: GEN + 'st-main-' + W + '.png' });
  const nav = async (label, sel) => {
    const t0 = Date.now();
    await page.evaluate((l) => { const p = [...document.querySelectorAll('#dtStage .dc-root [data-name="Header"] p')].find((x) => x.textContent.trim() === l); (p.closest('.dc-nav') || p).click(); }, label);
    await page.waitForSelector('#dtStage ' + sel, { timeout: 10000 }).catch(() => {});
    const ms = Date.now() - t0;
    await page.waitForTimeout(1200);
    return ms;
  };
  out.navPower = await nav('전력', '.dmp-root');
  out.power = await geo();
  out.navWorker = await nav('작업자안전관리', '.dmw-root');
  out.worker = await geo();
  await page.screenshot({ path: GEN + 'st-worker-' + W + '.png' });
  out.navAsset = await nav('운영관리', '.dma-root');
  out.asset = await geo();
  out.navMain = await nav('통합모니터링', '.dmm-root');
  /* 옆 판 '시나리오' → 시나리오 설명 팝업 */
  let t0 = Date.now();
  await page.evaluate(() => { const b = document.querySelector('#dtStage .dc-root [data-name="Button/Scenario"]'); b && b.click(); });
  await page.waitForSelector('#dtStage .dmx-mount', { timeout: 10000 }).catch(() => {});
  out.navScenario = Date.now() - t0;
  await page.waitForTimeout(1200);
  out.scenario = await geo();
  await page.screenshot({ path: GEN + 'st-scenario-' + W + '.png' });
  /* 닫기 → 전력 계통도 → 계통도 누르면 설비 카드 */
  await page.evaluate(() => { const b = document.querySelector('#dtStage .dmx-mount [data-name="Button/Close"]'); b && b.click(); });
  await page.waitForSelector('#dtStage .dmp-root:not(:has(.dmx-mount))', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  t0 = Date.now();
  await page.evaluate(() => { const b = document.querySelector('#dtStage .dc-root [data-name="Button/Plan Power Diagram"]'); b && b.click(); });
  await page.waitForSelector('#dtStage .dmc-mount', { timeout: 10000 }).catch(() => {});
  out.navCard = Date.now() - t0;
  await page.waitForTimeout(1200);
  out.card = await page.evaluate(() => ({ dmc: !!document.querySelector('#dtStage .dmc-mount'), dmi: !!document.querySelector('#dtStage .dmi-mount') }));
  await page.screenshot({ path: GEN + 'st-card-' + W + '.png' });
  /* 테마 — 라이트 */
  out.themeBtn = await page.evaluate(() => {
    const b = document.querySelector('#mode button[data-m="light"]');
    if (b) { b.click(); return 'light'; }
    return null;
  });
  await page.waitForTimeout(1500);
  out.light = await page.evaluate(() => { const r = document.querySelector('#dtStage .dc-root'); return { theme: r && r.dataset.theme, pops: [...document.querySelectorAll('#dtStage .sh-pop')].map((p) => p.dataset.theme) }; });
  await page.screenshot({ path: GEN + 'st-card-light-' + W + '.png' });
  for (const [lab, sel, name] of [['통합모니터링', '.dmm-root', 'main'], ['작업자안전관리', '.dmw-root', 'worker'], ['운영관리', '.dma-root', 'asset'], ['전력', '.dmp-root', 'power']]) {
    await nav(lab, sel);
    await page.waitForTimeout(600);
    await page.screenshot({ path: GEN + 'st-' + name + '-light-' + W + '.png' });
  }
  out.errs = errs;
  return out;
}
