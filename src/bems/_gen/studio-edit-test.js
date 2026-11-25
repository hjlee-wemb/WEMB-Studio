/* 스튜디오 패널편집 검증 — 카드 → 스튜디오 열기 → 패널편집 켜기: 글자 편집 · 패널 이동 · 차트 바꾸기(메인 KW · 층별 급수) ·
   색 정하기(시드) · 라이트 전환. 실행: node pw.js studio-edit-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/bems/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || /\[bems\]/.test(m.text())) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5610/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /bems/.test(k)).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {} });
  await page.waitForTimeout(1200);
  await page.locator('text=Smart Building Energy Management').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .bem-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  const out = {};
  const clickAt = async (sel) => { const p = await page.evaluate((s) => { const b = document.querySelector(s); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (p) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(500); } return !!p; };
  await page.locator('#editAll').click();
  await page.waitForTimeout(1200);
  out.state = await page.evaluate(() => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.bem-root');
    const ps = [...r.querySelectorAll('p')].filter((p) => p.textContent.trim() && p.getClientRects().length);
    return { stageCls: st.className, ps: ps.length, editable: ps.filter((p) => p.isContentEditable).length, notEditable: ps.filter((p) => !p.isContentEditable).slice(0, 6).map((p) => p.textContent.trim()), movers: [...new Set([...r.querySelectorAll('.be-mv')].map((e) => e.__unit && e.__unit.name))], chartBtns: r.querySelectorAll('.be-chartbtn').length };
  });
  out.textEdit = await page.evaluate(() => {
    const p = document.querySelector('#dtStage .bem-root [data-name="Widget/Event Count"] [data-name="Title"]');
    if (!p) return 'no title';
    p.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, 'Event Count(편집)');
    return p.textContent;
  });
  /* 패널 옮기기 — Widget/KW */
  const tgt = '#dtStage .bem-root [data-name="Widget/KW"]';
  const box = () => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left, t: r.top }; }, tgt);
  const b0 = await box();
  const grab = await page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + 6, y: r.top + r.height / 2 }; }, tgt);
  await page.mouse.move(grab.x, grab.y); await page.mouse.down(); await page.mouse.move(grab.x - 120, grab.y + 30, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(600);
  const b1 = await box();
  out.moved = [Math.round(b1.l - b0.l), Math.round(b1.t - b0.t)];
  /* 차트 바꾸기 — KWH */
  out.btn = await clickAt('#dtStage .bem-root [data-name="Widget/KWH"] > .be-chartbtn');
  out.menu = await page.evaluate(() => { const m = document.querySelector('#dtStage .bem-root .be-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
  await clickAt('#dtStage .bem-root .be-chartmenu.open button[data-i="1"]');
  await page.waitForTimeout(2200);
  out.swapped = await page.evaluate(() => ({ visibleHosts: [...document.querySelectorAll('#dtStage .bem-root .be-chost')].filter((h) => h.style.display === 'block').length, svg: document.querySelectorAll('#dtStage .bem-root .be-chost svg').length }));
  await page.screenshot({ path: GEN + 'st-edit-main.png' });
  /* 층별 현황 — 급수 차트 */
  await page.evaluate(() => window.__gotoBemsScene && window.__gotoBemsScene('floor'));
  await page.waitForSelector('#dtStage .bef-root.be-live', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1800);
  out.floor = await page.evaluate(() => ({ btns: document.querySelectorAll('#dtStage .bef-root .be-chartbtn').length, editing: !!document.querySelector('.dt-editing'), editable: [...document.querySelectorAll('#dtStage .bef-root p')].filter((p) => p.isContentEditable).length }));
  if (await clickAt('#dtStage .bef-root [data-name="Widget/Meter Water"] > .be-chartbtn')) {
    out.floorMenu = await page.evaluate(() => { const m = document.querySelector('#dtStage .bef-root .be-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
    await clickAt('#dtStage .bef-root .be-chartmenu.open button[data-i="1"]');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: GEN + 'st-edit-floor.png' });
  }
  /* 패널편집 끄고 색 정하기 */
  await page.locator('#editAll').click().catch(() => {});
  await page.waitForTimeout(600);
  out.colorUI = await page.evaluate(() => {
    const inp = document.getElementById('seed');
    if (!inp) return null;
    const p = document.querySelector('#dtStage .bef-root [data-name="Filter Bar"] [data-name="Badge"]');
    const before = p && getComputedStyle(p).borderColor + ' ' + getComputedStyle(p, '::after').borderColor;
    inp.value = '#1fae7a';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return { before };
  });
  await page.waitForTimeout(1500);
  out.seedAfter = await page.evaluate(() => { const p = document.querySelector('#dtStage .bef-root [data-name="Filter Bar"] [data-name="Badge"]'); return p && getComputedStyle(p, '::after').borderColor; });
  await page.screenshot({ path: GEN + 'st-edit-seed.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: GEN + 'st-edit-seed-light.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="dark"]'); b && b.click(); });
  out.errs = errs.slice(0, 12);
  return out;
}
