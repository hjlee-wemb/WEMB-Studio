/* 스튜디오 실검증 — 홈 → 템플릿 카드 → '이 구성으로 스튜디오 열기' → #dtStage 여백 · 라이브 · 장면 이동(탭 · 층) 시간 · 테마 · 콘솔 오류.
   실행: node pw.js studio-test.js [w] [h] */
async (page, args) => {
  const W = +(args[0] || 1568), H = +(args[1] || 1032);
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/bems/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /\[bems\]/.test(m.text()))) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.setViewportSize({ width: W, height: H });
  await page.goto('http://localhost:5610/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /bems/.test(k)).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {} });
  await page.waitForTimeout(1500);
  await page.locator('text=Smart Building Energy Management').first().click();
  await page.waitForTimeout(800);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .bem-root', { timeout: 20000 });
  await page.waitForTimeout(3000);
  const out = {};
  const geo = async () => page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.be-root') || st.querySelector('[class*="-root"]');
    const f = r && r.querySelector(':scope > [data-node-id]');
    const a = st.getBoundingClientRect(), fill = r && r.querySelector('.be-bgfill');
    const fr = fill && fill.getBoundingClientRect();
    return { stage: [Math.round(a.width), Math.round(a.height)],
      fillGap: fr && [Math.round(fr.left - a.left), Math.round(fr.top - a.top), Math.round(a.right - fr.right), Math.round(a.bottom - fr.bottom)],
      root: r && r.className.split(' ').slice(0, 3).join(' '), theme: r && r.dataset.theme, live: !!(r && r.__be), scene: r && r.__be && r.__be.scene,
      clock: r && (r.querySelector('[data-name="Date Time"]') || {}).textContent };
  });
  out.open = await geo();
  await page.screenshot({ path: GEN + 'st-main-' + W + '.png' });
  /* 탭 FLOOR → 층별 현황 */
  let t0 = Date.now();
  await page.evaluate(() => { const p = document.querySelector('#dtStage .be-root [data-name^="Nav Item/Floor"]'); p && p.click(); });
  await page.waitForSelector('#dtStage .bef-root.be-root', { timeout: 10000 }).catch(() => {});
  out.navFloor = Date.now() - t0;
  await page.waitForTimeout(1800);
  out.floor = await geo();
  await page.screenshot({ path: GEN + 'st-floor-' + W + '.png' });
  /* 층 5 고르기 — 글자 · 마커 */
  await page.evaluate(() => { const p = [...document.querySelectorAll('#dtStage .be-root [data-name="Floor Selector"] [data-name="List"] > p')].find((x) => x.textContent.trim() === '5'); p && p.click(); });
  await page.waitForTimeout(1500);
  out.floor5 = await page.evaluate(() => ({ evFloor: [...document.querySelectorAll('#dtStage .be-root [data-name="Meta"] [data-name="Floor"]')].slice(0, 2).map((p) => p.textContent), asset: (document.querySelector('#dtStage .be-root .be-leaf p') || {}).textContent, act: (document.querySelector('#dtStage .be-root .be-floor.be-act') || {}).textContent }));
  /* 트리 펼치기 · 필터 · 이벤트 접기 · 자산 판 접기 */
  await page.evaluate(() => { const h = document.querySelector('#dtStage .be-root [data-name="Tree Item/Aircon"]'); h && h.click(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { const f = document.querySelector('#dtStage .be-root [data-name="Filter/Elevator"]'); f && f.click(); });
  await page.waitForTimeout(800);
  out.tree = await page.evaluate(() => ({ open: [...document.querySelectorAll('#dtStage .be-root .be-tnode.be-open')].map((x) => x.getAttribute('data-name')), leaves: document.querySelectorAll('#dtStage .be-root .be-leaf').length, scroll: (() => { const t = document.querySelector('#dtStage .be-tree'); return t && [t.scrollHeight, t.clientHeight, Math.round(t.scrollTop)]; })(), factive: (document.querySelector('#dtStage .be-root .be-filter.be-fact') || {}).getAttribute && document.querySelector('#dtStage .be-root .be-filter.be-fact').getAttribute('data-name') }));
  await page.evaluate(() => { const b = document.querySelector('#dtStage .be-root .be-evtoggle'); b && b.click(); });
  await page.waitForTimeout(800);
  out.evFold = await page.evaluate(() => { const l = document.querySelector('#dtStage .be-root [data-name="Event List"]'); return l && l.getBoundingClientRect().height; });
  await page.screenshot({ path: GEN + 'st-floor-fold-' + W + '.png' });
  await page.evaluate(() => { const b = document.querySelector('#dtStage .be-root .be-evtoggle'); b && b.click(); });
  await page.waitForTimeout(800);
  /* 테마 — 라이트 */
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
  await page.waitForTimeout(1500);
  out.light = await geo();
  await page.screenshot({ path: GEN + 'st-floor-light-' + W + '.png' });
  t0 = Date.now();
  await page.evaluate(() => { const p = document.querySelector('#dtStage .be-root [data-name^="Nav Item/Main"]'); p && p.click(); });
  await page.waitForSelector('#dtStage .bem-root.be-root', { timeout: 10000 }).catch(() => {});
  out.navMain = Date.now() - t0;
  await page.waitForTimeout(1500);
  out.mainLight = await geo();
  await page.screenshot({ path: GEN + 'st-main-light-' + W + '.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="dark"]'); b && b.click(); });
  out.errs = errs;
  return out;
}
