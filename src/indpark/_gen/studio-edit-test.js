/* 스튜디오 패널편집 검증 — 이미 연 프로젝트(studio-test.js 뒤)를 다시 열어 패널편집을 켜고
   글자 편집 · 패널 이동 · 차트 바꾸기 단추를 본다. 실행: node pw.js studio-edit-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/indpark/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5560/index.html#/templates');
  await page.waitForTimeout(1200);
  await page.locator('text=Smart Industrial Complex').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .ipm-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  await page.locator('#editAll').click();
  await page.waitForTimeout(1200);
  const out = {};
  out.state = await page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.ipm-root');
    const ps = [...r.querySelectorAll('p')].filter((p) => p.textContent.trim());
    return {
      stageCls: st.className,
      ps: ps.length,
      editable: ps.filter((p) => p.isContentEditable).length,
      movers: r.querySelectorAll('.ip-mv').length,
      chartBtns: r.querySelectorAll('.ip-chartbtn').length,
    };
  });
  /* 글자 하나 고쳐 보기 — 이벤트 현황 제목 */
  out.textEdit = await page.evaluate(() => {
    const p = document.querySelector('#dtStage .ipm-root [data-name="Event Log"] [data-name="Title"]');
    if (!p) return 'no title';
    p.focus();
    document.execCommand('selectAll', false, null);
    document.execCommand('insertText', false, '이벤트 현황(편집)');
    return p.textContent;
  });
  /* 패널 옮기기 — 이벤트 로그를 끌어 본다 */
  const el = await page.evaluate(() => {
    const e = document.querySelector('#dtStage .ipm-root [data-name="Event Log"]');
    const r = e.getBoundingClientRect(); return { x: r.left + 300, y: r.top + 12, l: r.left, t: r.top };
  });
  await page.mouse.move(el.x, el.y);
  await page.mouse.down();
  await page.mouse.move(el.x + 40, el.y - 60, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  out.moved = await page.evaluate((el0) => {
    const e = document.querySelector('#dtStage .ipm-root [data-name="Event Log"]');
    const r = e.getBoundingClientRect(); return [Math.round(r.left - el0.l), Math.round(r.top - el0.t)];
  }, el);
  /* 차트 바꾸기 — 진짜 포인터로(단추는 pointerup 으로 받는다) 이벤트 로그 단추 → 추천 첫 항목 */
  const bb = await page.evaluate(() => { const b = document.querySelector('#dtStage .ipm-root [data-name="Event Log"] > .ip-chartbtn'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (bb) { await page.mouse.click(bb.x, bb.y); await page.waitForTimeout(400); }
  out.chartMenu = await page.evaluate(() => { const m = document.querySelector('#dtStage .ipm-root .ip-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
  const ib = await page.evaluate(() => { const b = document.querySelector('#dtStage .ipm-root .ip-chartmenu.open button[data-i="0"]'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  if (ib) { await page.mouse.click(ib.x, ib.y); await page.waitForTimeout(1500); }
  out.swapped = await page.evaluate(() => ({ hide: document.querySelectorAll('#dtStage .ipm-root .ip-hidekids').length, svg: document.querySelectorAll('#dtStage .ipm-root .ip-chost svg').length }));
  await page.screenshot({ path: GEN + 'st-edit-swap-1568.png' });
  out.errs = errs.slice(0, 10);
  return out;
}
