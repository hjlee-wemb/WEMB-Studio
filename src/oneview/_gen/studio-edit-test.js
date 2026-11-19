/* 스튜디오 패널편집 검증 — 카드 → 스튜디오 열기 → 패널편집 켜기: 글자 편집 · 패널 이동 · 차트 바꾸기(종합 · TP) ·
   이벤트 접기 · 최근 시간 · 라이트 전환. 실행: node pw.js studio-edit-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5590/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /oneview|ov-/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  await page.waitForTimeout(1200);
  await page.locator('text=Integrated Operations One-View').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .ovm-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  const out = {};
  /* 최근 시간 — 이벤트 로그 첫 줄 시각이 지금과 가까운지 */
  out.recent = await page.evaluate(() => {
    const t = [...document.querySelectorAll('#dtStage .ovm-root [data-name="Event Log"] p')].map((p) => p.textContent).find((s) => /\d{4}-\d\d-\d\d/.test(s));
    return { first: t, now: new Date().toTimeString().slice(0, 8) };
  });
  /* 이벤트 로그 접기 단추 */
  const fold = await page.evaluate(() => { const b = document.querySelector('#dtStage .ovm-root .ov-fold'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  const logH = () => page.evaluate(() => { const e = document.querySelector('#dtStage .ovm-root [data-name="Event Log"]'); const r = e.getBoundingClientRect(); return Math.round(r.top); });
  out.fold = { before: await logH() };
  if (fold) { await page.mouse.click(fold.x, fold.y); await page.waitForTimeout(900); out.fold.open = await logH(); await page.screenshot({ path: GEN + 'st-fold-open.png' }); await page.mouse.click(fold.x, fold.y - (out.fold.before - out.fold.open)); await page.waitForTimeout(900); out.fold.closed = await logH(); }
  /* 버튼 호버 */
  out.hover = await page.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => /\.ov-root[^{]*:hover/.test(r.selectorText || '')); } catch (e) { return false; } }));
  /* 패널편집 */
  await page.locator('#editAll').click();
  await page.waitForTimeout(1200);
  out.state = await page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.ovm-root');
    const ps = [...r.querySelectorAll('p')].filter((p) => p.textContent.trim() && p.getClientRects().length);
    return { stageCls: st.className, ps: ps.length, editable: ps.filter((p) => p.isContentEditable).length, notEditable: ps.filter((p) => !p.isContentEditable).slice(0, 5).map((p) => p.textContent.trim()), movers: r.querySelectorAll('.ov-mv').length, chartBtns: r.querySelectorAll('.ov-chartbtn').length };
  });
  out.textEdit = await page.evaluate(() => {
    const p = [...document.querySelectorAll('#dtStage .ovm-root [data-name="Widget/Key TP Monitoring"] p')].find((x) => x.textContent.trim() === '주요 TP 모니터링');
    if (!p) return 'no title';
    p.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, '주요 TP 모니터링(편집)');
    return p.textContent;
  });
  /* 패널 옮기기 — 주요 TP 모니터링 */
  const tgt = '#dtStage .ovm-root [data-name="Widget/Key TP Monitoring"]';
  const box = () => page.evaluate((s) => { const e = document.querySelector(s); const rs = [...e.querySelectorAll('*')].map((c) => c.getBoundingClientRect()).filter((r) => r.width > 4); const l = Math.min(...rs.map((r) => r.left)), t = Math.min(...rs.map((r) => r.top)); return { l, t }; }, tgt);
  const b0 = await box();
  const grab = await page.evaluate((s) => { const p = [...document.querySelectorAll(s + ' p')].find((x) => /주요 TP/.test(x.textContent)); const r = (p || document.querySelector(s)).getBoundingClientRect(); return { x: r.right + 60, y: r.top + r.height / 2 + 40 }; }, tgt);
  await page.mouse.move(grab.x, grab.y); await page.mouse.down(); await page.mouse.move(grab.x - 60, grab.y + 30, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(600);
  const b1 = await box();
  out.moved = [Math.round(b1.l - b0.l), Math.round(b1.t - b0.t)];
  /* 차트 바꾸기 — 주요 TP 모니터링 */
  const clickSel = async (sel) => { const p = await page.evaluate((s) => { const b = document.querySelector(s); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (p) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(500); } return !!p; };
  await page.evaluate((s) => { const w = document.querySelector(s); if (w && w.__chartBits) w.__chartBits[1].id = 'tpChartBtn'; }, tgt);
  out.btnTP = await clickSel('#tpChartBtn');
  out.menu = await page.evaluate(() => { const m = document.querySelector('#dtStage .ovm-root .ov-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
  await clickSel('#dtStage .ovm-root .ov-chartmenu.open button[data-i="1"]');
  await page.waitForTimeout(1500);
  out.swapped = await page.evaluate(() => ({ visibleHosts: [...document.querySelectorAll('#dtStage .ovm-root .ov-chost')].filter((h) => h.style.display === 'block').length, svg: document.querySelectorAll('#dtStage .ovm-root .ov-chost svg').length }));
  await page.screenshot({ path: GEN + 'st-edit-swap-main.png' });
  /* TP 화면으로 → 칸 차트 바꾸기 */
  await page.evaluate(() => window.__gotoOneviewScene && window.__gotoOneviewScene('tp'));
  await page.waitForSelector('#dtStage .ovq-root', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2500);
  out.tp = await page.evaluate(() => { const r = document.querySelector('#dtStage .ovq-root'); return r ? { btns: r.querySelectorAll('.ov-chartbtn').length, editing: !!document.querySelector('.dt-editing') } : 'no tp'; });
  if (out.tp !== 'no tp') {
    await clickSel('#dtStage .ovq-root .ov-chartbtn');
    out.tpMenu = await page.evaluate(() => { const m = document.querySelector('#dtStage .ovq-root .ov-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
    await clickSel('#dtStage .ovq-root .ov-chartmenu.open button[data-i="0"]');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: GEN + 'st-edit-swap-tp.png' });
    /* 라이트로 */
    await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: GEN + 'st-edit-swap-tp-light.png' });
    await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="dark"]'); b && b.click(); });
  }
  out.errs = errs.slice(0, 12);
  return out;
}
