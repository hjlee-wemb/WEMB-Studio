/* 스튜디오 실검증 — 홈 → 템플릿 카드 → '이 구성으로 스튜디오 열기' → #dtStage 여백 · 라이브 · 이벤트 판 펼침/접힘 · 알림 팝업 · 차트 판 접기 ·
   장면 이동(헤더 메뉴) 시간 · 표 스크롤 · 테마 · 콘솔 오류.  실행: node pw.js studio-test.js [w] [h] */
async (page, args) => {
  const W = +(args[0] || 1568), H = +(args[1] || 1032);
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /\[secmon\]/.test(m.text()))) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.setViewportSize({ width: W, height: H });
  await page.goto('http://localhost:5620/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /secmon/.test(k)).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {} });
  await page.waitForTimeout(1500);
  await page.locator('text=Securities Integrated Monitoring').first().click();
  await page.waitForTimeout(800);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .smm-root', { timeout: 20000 });
  await page.waitForTimeout(3000);
  const out = {};
  const geo = async () => page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.sl-root') || st.querySelector('[class*="-root"]');
    const a = st.getBoundingClientRect(), fill = r && r.querySelector('.sl-bgfill');
    const fr = fill && fill.getBoundingClientRect();
    return { stage: [Math.round(a.width), Math.round(a.height)],
      fillGap: fr && [Math.round(fr.left - a.left), Math.round(fr.top - a.top), Math.round(a.right - fr.right), Math.round(a.bottom - fr.bottom)],
      root: r && r.className.split(' ').slice(0, 2).join(' '), theme: r && r.dataset.theme, live: !!(r && r.__sl), scene: r && r.__sl && r.__sl.scene,
      clock: r && (r.querySelector('[data-name="Clock"]') || {}).textContent, panels: r && r.__sl && r.__sl.panels.length };
  });
  out.open = await geo();
  await page.screenshot({ path: GEN + 'st-main-' + W + '.png' });
  const click = (sel) => page.evaluate((s) => { const e = document.querySelector('#dtStage ' + s); if (!e) return false; e.click(); return true; }, sel);
  /* 이벤트 판 펼침 · 접힘 */
  out.expand = await click('.sl-root [data-name="Button/Expand"]');
  await page.waitForTimeout(900);
  out.evOpen = await page.evaluate(() => { const m = document.querySelector('#dtStage .sl-evmount'); return m && { open: m.classList.contains('sl-open'), rows: m.querySelectorAll('.sl-clip').length, r: m.getBoundingClientRect().top | 0 }; });
  await page.screenshot({ path: GEN + 'st-main-ev-' + W + '.png' });
  out.collapse = await click('.sl-evmount [data-name="Button/Collapse"]');
  await page.waitForTimeout(800);
  out.evClosed = await page.evaluate(() => { const m = document.querySelector('#dtStage .sl-evmount'); return m && !m.classList.contains('sl-open'); });
  /* 알림 팝업(CR 수) */
  await page.evaluate(() => { const c = document.querySelector('#dtStage .sl-root [data-name="Event Bar"] [data-name="Count/CR"] [data-name="Background"]'); c && c.click(); });
  await page.waitForTimeout(700);
  out.alert = await page.evaluate(() => !!document.querySelector('#dtStage .sl-pop.sl-open'));
  await page.screenshot({ path: GEN + 'st-main-alert-' + W + '.png' });
  await click('.sl-pop.sl-open [data-name="Button/Close"]');
  await page.waitForTimeout(500);
  out.alertClosed = await page.evaluate(() => !document.querySelector('#dtStage .sl-pop.sl-open'));
  /* 차트 판 접기 · 펴기 */
  await page.evaluate(() => { const h = document.querySelector('#dtStage .sl-root [data-name="Chart Row"] [data-name="Button/Open Panel"] [data-name="Background"]'); h && h.click(); });
  await page.waitForTimeout(900);
  out.chartFold = await page.evaluate(() => document.querySelector('#dtStage .sl-root').classList.contains('sl-folded-root'));
  await page.screenshot({ path: GEN + 'st-main-fold-' + W + '.png' });
  await page.evaluate(() => { const h = document.querySelector('#dtStage .sl-root > [data-node-id] > [data-name="Button/Open Panel"] [data-name="Background"]') || document.querySelector('#dtStage .sl-tabopen'); h && h.click(); });
  await page.waitForTimeout(900);
  out.chartOpen = await page.evaluate(() => !document.querySelector('#dtStage .sl-root').classList.contains('sl-folded-root'));
  /* 장면 이동 — 헤더 메뉴 */
  const nav = async (label, px) => {
    const t0 = Date.now();
    await page.evaluate((l) => { const p = [...document.querySelectorAll('#dtStage .sl-root [data-name="Nav"] > [data-name="Label"]')].find((x) => x.textContent.trim() === l); p && p.click(); }, label);
    await page.waitForSelector('#dtStage .' + px + '-root.sl-root', { timeout: 10000 }).catch(() => {});
    return Date.now() - t0;
  };
  out.nav = {};
  for (const [l, px, k] of [['채널현황', 'smc', 'channel'], ['마이크로 서비스현황', 'sms', 'micro'], ['메시지큐현황', 'smq', 'mq'], ['인프라현황', 'smi', 'infra'], ['이벤트현황', 'sme', 'event']]) {
    out.nav[k] = await nav(l, px);
    await page.waitForTimeout(1600);
    out[k] = await geo();
    await page.screenshot({ path: GEN + 'st-' + k + '-' + W + '.png' });
    if (k === 'channel') {
      /* 디비 수신확인 가로 스크롤 — 휠 */
      const c = await page.evaluate(() => { const e = document.querySelector('#dtStage .sl-clip'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      if (c) { await page.mouse.move(c[0], c[1]); await page.mouse.wheel(0, 300); await page.waitForTimeout(600); }
      out.hscroll = await page.evaluate(() => { const i = document.querySelector('#dtStage .sl-clip .sl-inner'); return i && i.style.transform; });
    }
    if (k === 'event') {
      const c = await page.evaluate(() => { const e = document.querySelector('#dtStage .sl-clip'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      if (c) { await page.mouse.move(c[0], c[1]); await page.mouse.wheel(0, 400); await page.waitForTimeout(600); }
      out.vscroll = await page.evaluate(() => { const i = document.querySelector('#dtStage .sl-clip .sl-inner'); return i && i.style.transform; });
    }
  }
  /* NKS — 알림 */
  await page.evaluate(() => { const p = [...document.querySelectorAll('#dtStage .sl-root [data-name="Nav"] > [data-name="Label"]')].find((x) => x.textContent.trim() === 'NKS현황'); p && p.click(); });
  await page.waitForTimeout(400);
  out.nksToast = await page.evaluate(() => { const t = document.querySelector('#dtStage .sl-toast.on'); return t && t.textContent; });
  /* 테마 — 라이트 */
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
  await page.waitForTimeout(1500);
  out.light = await geo();
  await page.screenshot({ path: GEN + 'st-event-light-' + W + '.png' });
  out.back = await nav('통합관제현황', 'smm');
  await page.waitForTimeout(1600);
  out.mainLight = await geo();
  await page.screenshot({ path: GEN + 'st-main-light-' + W + '.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="dark"]'); b && b.click(); });
  await page.waitForTimeout(600);
  out.errs = errs.slice(0, 12);
  return out;
}
