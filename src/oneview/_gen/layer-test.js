/* 이벤트현황 맨 위 · 팝업 dim 확인 — 종합현황에서 로그 펼침(다크 · 라이트), 이벤트 화면 dim 켜짐 · 막 눌러 닫기 · 다시 열기. node pw.js layer-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview/_gen/';
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  const out = {};
  for (const t of ['dark', 'light']) {
    await page.goto('http://localhost:5590/src/oneview/main.html?t=' + t + '&r=' + Date.now());
    await page.evaluate(() => { try { localStorage.removeItem('wemb-oneview-fold'); } catch (e) {} }); await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2200);
    await page.evaluate(() => { try { localStorage.removeItem('wemb-oneview-fold'); } catch (e) {} });
    const b = await page.evaluate(() => { const e = document.querySelector('.ov-fold'); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.click(b.x, b.y); await page.waitForTimeout(900);
    out[t] = await page.evaluate(() => { const h = document.elementFromPoint(700, 700); return { topAt700: (h.closest('[data-name]') || h).getAttribute('data-name'), inLog: !!h.closest('[data-name="Event Log"]') }; });
    await page.screenshot({ path: GEN + 'lt-logopen-' + t + '.png' });
  }
  await page.goto('http://localhost:5590/src/oneview/event.html?t=dark&r=' + Date.now());
  await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2200);
  out.dimOn = await page.evaluate(() => document.querySelector('.ov-dim').classList.contains('on'));
  await page.screenshot({ path: GEN + 'lt-dim-dark.png' });
  await page.mouse.click(960, 900); await page.waitForTimeout(600);
  out.afterDimClick = await page.evaluate(() => ({ dim: document.querySelector('.ov-dim').classList.contains('on'), pops: [...document.querySelectorAll('[data-name^="Popup/"] > [data-name="Background"]')].map((b) => getComputedStyle(b).visibility) }));
  const row = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-name="Body"] > [data-name^="Row/"]')].find((x) => !x.closest('[data-name^="Popup/"]') && x.children.length >= 10 && x.getBoundingClientRect().top > 300); const q = r.getBoundingClientRect(); return { x: q.left + 300, y: q.top + q.height / 2 }; });
  await page.mouse.click(row.x, row.y); await page.waitForTimeout(600);
  out.reopen = await page.evaluate(() => document.querySelector('.ov-dim').classList.contains('on'));
  out.errs = errs;
  return out;
}
