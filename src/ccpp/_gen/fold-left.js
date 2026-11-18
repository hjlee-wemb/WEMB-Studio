/* 왼쪽 판 접기 검증(미리보기 5575, 진짜 클릭). 실행: node pw.js fold-left.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp/_gen/';
  const out = {};
  const go = async (p, t = 'light') => { await page.goto('http://localhost:5575/src/ccpp/' + p + '.html?t=' + t + '&r=' + Date.now()); await page.waitForTimeout(1700); };
  const center = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const t = document.elementFromPoint(x, y); return { x, y, ok: !!t && (t === e || e.contains(t)), top: t && (t.dataset.name || t.tagName) }; }, sel);
  const state = () => page.evaluate(() => { const p = [...document.querySelectorAll('.cc-lpanel')][0], b = document.querySelector('.cc-lfold'); const r = p.getBoundingClientRect(), br = b.getBoundingClientRect(); return { panel: p.dataset.name, left: Math.round(r.left), op: getComputedStyle(p).opacity, btnLeft: Math.round(br.left), closed: b.classList.contains('cc-lclosed') }; });
  await page.evaluate(() => { try { localStorage.removeItem('wemb-ccpp-leftfold'); } catch (e) {} });
  for (const sc of ['main', 'library', 'detail']) {
    await go(sc);
    const o = { open: await state() };
    const c = await center('.cc-lfold');
    o.hit = c.ok ? 'ok' : 'blocked by ' + c.top;
    await page.mouse.click(c.x, c.y); await page.waitForTimeout(900);
    o.shut = await state();
    await page.screenshot({ path: GEN + 'foldl-' + sc + '-shut.png' });
    const c2 = await center('.cc-lfold');
    o.hit2 = c2.ok ? 'ok' : 'blocked by ' + c2.top;
    await page.mouse.click(c2.x, c2.y); await page.waitForTimeout(900);
    o.reopen = await state();
    out[sc] = o;
  }
  /* 레일의 켜진 메뉴(상세 = 태그관리)를 다시 누르면 닫힌다 → 다른 화면으로 가도 닫힌 채 */
  await go('detail');
  const nav = await center('[data-name="Nav Item/Tag Management (Active)"]');
  await page.mouse.click(nav.x, nav.y); await page.waitForTimeout(900);
  out.navToggle = await state();
  await go('library');
  out.carried = await state();
  await page.screenshot({ path: GEN + 'foldl-library-carried.png' });
  await go('library', 'dark');
  await page.screenshot({ path: GEN + 'foldl-library-dark.png' });
  const c3 = await center('.cc-lfold'); await page.mouse.click(c3.x, c3.y); await page.waitForTimeout(900);
  await page.screenshot({ path: GEN + 'foldl-library-dark-open.png' });
  out.darkOpen = await state();
  return out;
}
