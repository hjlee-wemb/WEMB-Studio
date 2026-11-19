/* Playwright — 진짜 마우스 클릭으로 라이브 동작 점검(가린 판 검사 포함). 실행: node pw.js ctl-fe.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/fems/_gen/';
  const out = {};
  const go = async (pg, w, h) => {
    await page.setViewportSize({ width: w || 1920, height: h || 1080 });
    await page.goto('http://localhost:5580/src/fems/' + pg + '.html?t=' + ((globalThis.__ARGS||[]).includes('dark') ? 'dark' : 'light') + '&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
  };
  /* 이름으로 찾은 요소의 가운데를 진짜로 누른다 — 가운데 점이 다른 판에 막혀 있으면 기록 */
  const hit = async (sel) => {
    const r = await page.evaluate((s) => {
      const el = document.querySelector(s); if (!el) return { miss: s };
      const b = el.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
      const top = document.elementFromPoint(x, y);
      return { x, y, ok: !!top && (el === top || el.contains(top)), top: top ? (top.getAttribute('data-name') || top.className || top.tagName) : null };
    }, sel);
    if (r.miss) return r;
    await page.mouse.click(r.x, r.y);
    await page.waitForTimeout(900);
    return r;
  };
  await go('main');
  out.expand = await hit('[data-name="Bar (Collapsed)"] [data-name="Button/Expand"]');
  await page.screenshot({ path: GEN + 'ctl-evopen.png' });
  out.evx = await page.evaluate(() => { const x = document.querySelector('.fe-evx'); const r = x && x.getBoundingClientRect(); return x ? { cls: x.className, top: r.top, h: r.height } : null; });
  out.chip = await hit('.fe-evx [data-name="Count/Normal"]');
  await page.screenshot({ path: GEN + 'ctl-evfilter.png' });
  out.collapse = await hit('.fe-evx [data-name="Button/Collapse"]');
  await page.waitForTimeout(400);
  out.evxAfter = await page.evaluate(() => document.querySelector('.fe-evx').className);
  out.zoom = await hit('[data-name="Button/Zoom In"]');
  out.rot = await hit('[data-name="Button/Rotate Left"]');
  out.fold = await hit('[data-name="Side Panel (Left)"] [data-name="Button/Collapse"]');
  await page.screenshot({ path: GEN + 'ctl-view.png' });
  out.fold2 = await hit('[data-name="Side Panel (Left)"] [data-name="Button/Collapse"]');
  out.home = await hit('[data-name="Button/Home"]');
  /* 화면비 */
  for (const [w, h] of [[1440, 1080], [2560, 1080], [1248, 852]]) {
    await go('main', w, h);
    await page.screenshot({ path: GEN + 'ctl-ratio-' + w + 'x' + h + '.png' });
  }
  await go('equipment');
  await page.screenshot({ path: GEN + 'ctl-equipment.png' });
  out.close = await hit('.sh-popmount [data-name="Button/Close"]');
  out.url = page.url();
  return out;
}
