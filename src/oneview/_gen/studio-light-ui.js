/* 스튜디오 라이트 테마에서 새 조작(셀렉트 목록 · 체크 · 툴팁 · 상세정보) 모양 보기. node pw.js studio-light-ui.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.setViewportSize({ width: 1568, height: 1032 });
  await page.goto('http://localhost:5590/index.html#/templates');
  await page.waitForTimeout(1200);
  await page.locator('text=Integrated Operations One-View').first().click();
  await page.waitForTimeout(700);
  await page.locator('.tpld-start').click();
  await page.waitForSelector('#dtStage .ovm-root', { timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); b && b.click(); });
  await page.waitForTimeout(1000);
  const ctr = (sel, i = 0) => page.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, [sel, i]);
  const click = async (sel, i = 0) => { const p = await ctr(sel, i); if (p) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(400); } return !!p; };
  const out = {};
  /* 종합현황 툴팁 */
  const tp = await ctr('#dtStage .ovm-root .ov-line', 0);
  if (tp) { await page.mouse.move(tp.x, tp.y); await page.waitForTimeout(500); }
  out.tip = await page.evaluate(() => { const t = document.querySelector('#dtStage .ov-tip.on'); return t ? t.textContent : 'none'; });
  await page.screenshot({ path: GEN + 'sl-main-tip.png' });
  /* WAS 팝업 */
  await page.evaluate(() => window.__gotoOneviewScene('waspopup'));
  await page.waitForSelector('#dtStage .ovp-root', { timeout: 10000 });
  await page.waitForTimeout(2200);
  await click('#dtStage .ovp-root [data-name="Popup/Page Settings"] .ov-chk', 2);
  await click('#dtStage .ovp-root [data-name="Popup/Page Settings (Group Select)"] .ov-dd');
  out.menu = await page.evaluate(() => !!document.querySelector('#dtStage .ov-ddmenu.on'));
  await page.screenshot({ path: GEN + 'sl-waspopup.png' });
  await page.keyboard.press('Escape');
  /* 이벤트 */
  await page.evaluate(() => window.__gotoOneviewScene('event'));
  await page.waitForSelector('#dtStage .ove-root', { timeout: 10000 });
  await page.waitForTimeout(2200);
  await click('#dtStage .ove-root [data-name="Popup/Device Select"] .ov-dd', 1);
  await page.screenshot({ path: GEN + 'sl-event.png' });
  out.errs = errs;
  return out;
}
