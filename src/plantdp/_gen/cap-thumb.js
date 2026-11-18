/* 갤러리 썸네일용 — 라이브를 켠 화면(정렬 · 툴팁 숨김 · 최근 시각이 적용된 모습)을 1920x1080 으로 찍는다(thumb-<key>.png → mk-thumb.ps1).
   실행: node pw.js cap-thumb.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const P = [["main","3302-4796"],["weather","3301-4796"],["seismic","3300-4796"],["event","3302-5372"],["sop-popup","3293-5251"],["building","3292-5597"],["floor","3287-4796"],["sop","3293-4796"],["sop-standby","3289-5423"],["login","3286-4796"]];
  const out = {};
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + pg + '.html?t=light&r=' + Date.now());
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
    await page.reload();
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.mouse.move(1919, 1079);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: GEN + 'thumb-' + key + '.png' });
    out[pg] = await page.evaluate(() => [...document.querySelectorAll('.pd-tip')].filter((t) => +getComputedStyle(t).opacity > 0.5).length);
  }
  return out;
}
