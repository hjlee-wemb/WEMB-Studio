/* 왼쪽 판 접기 단추가 판 제목 글자와 한 줄인지(세로 가운데 차이) · 열고 닫기. 실행: node pw.js fold-align.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp/_gen/';
  await page.goto('http://localhost:5575/src/ccpp/main.html?r=' + Date.now());
  await page.evaluate(() => { try { localStorage.removeItem('wemb-ccpp-leftfold'); } catch (e) {} });
  const out = {};
  for (const [sc, w, h] of [['main', 1920, 1080], ['library', 1920, 1080], ['detail', 1920, 1080], ['detail', 1440, 1080]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://localhost:5575/src/ccpp/' + sc + '.html?t=light&r=' + Date.now());
    await page.waitForTimeout(1800);
    const m = await page.evaluate(() => {
      const t = document.querySelector('.cc-lpanel [data-name="Title Wrap"] p'), b = document.querySelector('.cc-lfold');
      const r = document.createRange(); r.selectNodeContents(t); const tr = r.getBoundingClientRect(), br = b.getBoundingClientRect();
      return { title: t.textContent, titleMid: +(tr.top + tr.height / 2).toFixed(1), btnMid: +(br.top + br.height / 2).toFixed(1), btnLeft: Math.round(br.left), panelRight: Math.round(document.querySelector('.cc-lpanel').getBoundingClientRect().right) };
    });
    m.diff = +(m.btnMid - m.titleMid).toFixed(1);
    await page.screenshot({ path: GEN + 'foldalign-' + sc + '-' + w + '.png', clip: { x: 0, y: 0, width: Math.min(w, 1200), height: 160 } });
    const c = await page.evaluate(() => { const r = document.querySelector('.cc-lfold').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await page.mouse.click(c[0], c[1]); await page.waitForTimeout(900);
    m.shutLeft = await page.evaluate(() => Math.round(document.querySelector('.cc-lpanel').getBoundingClientRect().left));
    const c2 = await page.evaluate(() => { const r = document.querySelector('.cc-lfold').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await page.mouse.click(c2[0], c2[1]); await page.waitForTimeout(900);
    m.reopenLeft = await page.evaluate(() => Math.round(document.querySelector('.cc-lpanel').getBoundingClientRect().left));
    out[sc + '@' + w] = m;
  }
  return out;
}
