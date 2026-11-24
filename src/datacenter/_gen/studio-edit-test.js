/* 스튜디오 패널편집 검증 — 카드 → 스튜디오 열기 → 패널편집 켜기: 글자 편집 · 패널 이동 · 차트 바꾸기(메인 이벤트 · 작업자 · 자산) ·
   색 정하기(시드) · 라이트 전환. 실행: node pw.js studio-edit-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || /\[dc\]/.test(m.text())) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5600/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /datacenter/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch (e) {} });
  await page.waitForTimeout(1200);
  await page.locator('text=Data Center Integrated Monitoring').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .dmm-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  const out = {};
  const clickAt = async (sel) => { const p = await page.evaluate((s) => { const b = document.querySelector(s); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (p) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(500); } return !!p; };
  /* 패널편집 */
  await page.locator('#editAll').click();
  await page.waitForTimeout(1200);
  out.state = await page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.dmm-root');
    const ps = [...r.querySelectorAll('p')].filter((p) => p.textContent.trim() && p.getClientRects().length);
    return { stageCls: st.className, ps: ps.length, editable: ps.filter((p) => p.isContentEditable).length, notEditable: ps.filter((p) => !p.isContentEditable).slice(0, 6).map((p) => p.textContent.trim()), movers: [...new Set([...r.querySelectorAll('.dc-mv')].map((e) => e.__unit && e.__unit.name))], chartBtns: r.querySelectorAll('.dc-chartbtn').length };
  });
  out.textEdit = await page.evaluate(() => {
    const p = [...document.querySelectorAll('#dtStage .dmm-root [data-name="Event Log"] p')].find((x) => x.textContent.trim() === '이벤트 현황');
    if (!p) return 'no title';
    p.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, '이벤트 현황(편집)');
    return p.textContent;
  });
  /* 패널 옮기기 — 알림 설정 팝업 */
  const tgt = '#dtStage .dmm-root [data-name="Popup/Alarm Settings"]';
  const box = () => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left, t: r.top }; }, tgt);
  const b0 = await box();
  const grab = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + 60, y: r.top + r.height - 12 }; }, tgt);
  await page.mouse.move(grab.x, grab.y); await page.mouse.down(); await page.mouse.move(grab.x - 80, grab.y + 40, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(600);
  const b1 = await box();
  out.moved = [Math.round(b1.l - b0.l), Math.round(b1.t - b0.t)];
  /* 차트 바꾸기 — 이벤트 현황 */
  out.btn = await clickAt('#dtStage .dmm-root [data-name="Event Log"] .dc-chartbtn');
  out.menu = await page.evaluate(() => { const m = document.querySelector('#dtStage .dmm-root .dc-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
  await clickAt('#dtStage .dmm-root .dc-chartmenu.open button[data-i="0"]');
  await page.waitForTimeout(2500);
  out.swapped = await page.evaluate(() => ({ visibleHosts: [...document.querySelectorAll('#dtStage .dmm-root .dc-chost')].filter((h) => h.style.display === 'block').length, svg: document.querySelectorAll('#dtStage .dmm-root .dc-chost svg').length }));
  await page.screenshot({ path: GEN + 'st-edit-main.png' });
  /* 작업자안전관리 — 금일작업 건수 차트 */
  await page.evaluate(() => window.__gotoDatacenterScene && window.__gotoDatacenterScene('worker'));
  await page.waitForSelector('#dtStage .dmw-root.dc-live', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1800);
  out.worker = await page.evaluate(() => ({ btns: document.querySelectorAll('#dtStage .dmw-root .dc-chartbtn').length, editing: !!document.querySelector('.dt-editing') }));
  if (await clickAt('#dtStage .dmw-root .dc-chartbtn')) {
    out.workerMenu = await page.evaluate(() => { const m = document.querySelector('#dtStage .dmw-root .dc-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
    await clickAt('#dtStage .dmw-root .dc-chartmenu.open button[data-i="1"]');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: GEN + 'st-edit-worker.png' });
  }
  /* 패널편집 끄고 색 정하기 — 시드 바꾸기(테마 만들기 패널의 첫 색 견본) */
  await page.locator('#editAll').click().catch(() => {});
  await page.waitForTimeout(600);
  out.seedBefore = await page.evaluate(() => getComputedStyle(document.querySelector('#dtStage .dmw-root')).getPropertyValue('--dc-acc'));
  out.colorUI = await page.evaluate(() => {
    const inp = document.getElementById('seed');
    if (!inp) return null;
    const p = document.querySelector('#dtStage .dmw-root [data-name="Header"] p[data-name^="Label/Worker"]');
    const before = p && getComputedStyle(p).color;
    inp.value = '#1fae7a';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return { before };
  });
  await page.waitForTimeout(1500);
  out.seedAfter = await page.evaluate(() => { const p = document.querySelector('#dtStage .dmw-root [data-name="Header"] p[data-name^="Label/Worker"]'); return { color: p && getComputedStyle(p).color, tintSheets: [...document.querySelectorAll('style')].filter((s) => /dmw-root/.test(s.textContent) && /tint|hue/i.test(s.id || '')).map((s) => s.id) }; });
  await page.screenshot({ path: GEN + 'st-edit-seed.png' });
  /* 라이트 */
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: GEN + 'st-edit-worker-light.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="dark"]'); b && b.click(); });
  out.errs = errs.slice(0, 12);
  return out;
}
