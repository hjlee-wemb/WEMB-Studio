/* 스튜디오 패널편집 검증 — 카드 → 스튜디오 열기 → 패널편집 켜기: 글자 편집(모든 글자 편집 가능?) · 패널 이동 · 차트 바꾸기(추천) ·
   색 정하기(시드) · 라이트 전환. 실행: node pw.js studio-edit-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || /\[secmon\]/.test(m.text())) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5620/index.html#/templates');
  await page.evaluate(() => { try { Object.keys(localStorage).filter((k) => /secmon/.test(k)).forEach((k) => localStorage.removeItem(k)); sessionStorage.clear(); } catch (e) {} });
  await page.waitForTimeout(1200);
  await page.locator('text=Securities Integrated Monitoring').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .smm-root', { timeout: 20000 });
  await page.waitForTimeout(2500);
  const out = {};
  const clickAt = async (sel) => { const p = await page.evaluate((s) => { const b = document.querySelector(s); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel); if (p) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(500); } return !!p; };
  await page.locator('#editAll').click();
  await page.waitForTimeout(1200);
  const stateOf = (px) => page.evaluate((px) => {
    const st = document.getElementById('dtStage'), r = st.querySelector('.' + px + '-root');
    const ps = [...r.querySelectorAll('p')].filter((p) => p.textContent.trim() && p.getClientRects().length && !p.closest('.sl-chost'));
    return { editing: st.className.indexOf('dt-editing') >= 0 || !!document.querySelector('.dt-editing'), ps: ps.length, editable: ps.filter((p) => p.isContentEditable).length, notEditable: ps.filter((p) => !p.isContentEditable).slice(0, 6).map((p) => p.textContent.trim()), movers: r.__sl ? r.__sl.panels.map((p) => p.name) : [], chartBtns: r.querySelectorAll('.sl-chartbtn').length };
  }, px);
  out.state = await stateOf('smm');
  out.textEdit = await page.evaluate(() => {
    const p = document.querySelector('#dtStage .smm-root [data-name="Widget/Key Service Transactions"] [data-name="Title"]');
    if (!p) return 'no title';
    p.focus(); document.execCommand('selectAll', false, null); document.execCommand('insertText', false, '주요서비스 거래현황(편집)');
    return p.textContent;
  });
  /* 패널 옮기기 — 지연서비스 Top10 판(바탕 Shape 를 잡는다) */
  const tgt = '#dtStage .smm-root .sl-mvbg';
  const pick = await page.evaluate(() => { const b = [...document.querySelectorAll('#dtStage .smm-root .sl-mvbg')].find((e) => e.__unit && e.__unit.name === 'Delay Top10'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + 12, y: r.top + r.height - 8, l: r.left, t: r.top }; });
  if (pick) {
    await page.mouse.move(pick.x, pick.y); await page.mouse.down(); await page.mouse.move(pick.x - 120, pick.y + 30, { steps: 8 }); await page.mouse.up();
    await page.waitForTimeout(600);
    out.moved = await page.evaluate((p0) => { const b = [...document.querySelectorAll('#dtStage .smm-root .sl-mvbg')].find((e) => e.__unit && e.__unit.name === 'Delay Top10'); const r = b.getBoundingClientRect(); return [Math.round(r.left - p0.l), Math.round(r.top - p0.t)]; }, pick);
  }
  /* 차트 바꾸기 — 주요서비스 판 */
  out.btn = await page.evaluate(() => { const bs = [...document.querySelectorAll('#dtStage .smm-root .sl-chartbtn')]; return bs.length; });
  const btnSel = await page.evaluate(() => { const bs = [...document.querySelectorAll('#dtStage .smm-root .sl-chartbtn')]; const i = 1; if (i < 0) return null; bs[i].setAttribute('data-test', 'kst'); return '#dtStage .smm-root .sl-chartbtn[data-test="kst"]'; });
  if (btnSel) {
    const r = await page.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, btnSel);
    await page.mouse.click(r.x, r.y); await page.waitForTimeout(500);
    out.menu = await page.evaluate(() => { const m = document.querySelector('#dtStage .smm-root .sl-chartmenu.open'); return m ? [...m.querySelectorAll('button[data-i]')].map((x) => x.textContent.trim()) : 'no open menu'; });
    await clickAt('#dtStage .smm-root .sl-chartmenu.open button[data-i="0"]');
    await page.waitForTimeout(2200);
    out.swapped = await page.evaluate(() => ({ visibleHosts: [...document.querySelectorAll('#dtStage .smm-root .sl-chost')].filter((h) => h.style.display === 'block').length, svg: document.querySelectorAll('#dtStage .smm-root .sl-chost svg, #dtStage .smm-root .sl-chost .hb').length }));
  }
  await page.screenshot({ path: GEN + 'st-edit-main.png' });
  /* 다른 장면도 — 글자 편집 · 차트 단추 수 */
  for (const [k, px] of [['channel', 'smc'], ['mq', 'smq'], ['event', 'sme']]) {
    await page.evaluate((k) => window.__gotoSecmonScene && window.__gotoSecmonScene(k), k);
    await page.waitForSelector('#dtStage .' + px + '-root.sl-live', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
    out[k] = await stateOf(px);
  }
  await page.screenshot({ path: GEN + 'st-edit-event.png' });
  /* 패널편집 끄고 색 정하기 */
  await page.locator('#editAll').click().catch(() => {});
  await page.waitForTimeout(600);
  out.colorUI = await page.evaluate(() => {
    const inp = document.getElementById('seed');
    if (!inp) return null;
    inp.value = '#1fae7a';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: GEN + 'st-edit-seed.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: GEN + 'st-edit-seed-light.png' });
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="dark"]'); b && b.click(); });
  out.errs = errs.slice(0, 12);
  return out;
}
