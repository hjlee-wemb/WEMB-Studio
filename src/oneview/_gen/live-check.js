/* 라이브 켠 미리보기 점검 — 오류 · 시계 · 접기 · 흐르는 선 수 · 스크롤 · 차트 단추. node pw.js live-check.js [w] [h] */
async (page) => {
  const [W, H] = (globalThis.__ARGS || []).map(Number);
  if (W) await page.setViewportSize({ width: W, height: H || 1080 });
  const P = ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'];
  const out = {};
  for (const pg of P) {
    const errs = [];
    const h = (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); };
    page.on('console', h);
    page.on('pageerror', (e) => errs.push('PE ' + e.message.slice(0, 140)));
    await page.goto('http://localhost:5590/src/oneview/' + pg + '.html?r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2500);
    out[pg] = await page.evaluate(() => {
      const r = document.querySelector('.ov-root'); const st = r && r.__ov;
      return { clock: (document.querySelector('[data-name="Clock"] [data-name="Time"]') || {}).textContent, lines: st && st.lines ? st.lines.filter(Boolean).length : 0,
        folds: document.querySelectorAll('.ov-fold').length, scroll: document.querySelectorAll('.ov-scroll').length, chartBtns: document.querySelectorAll('.ov-chartbtn').length, units: st && st.units ? st.units.length : 0,
        firstEv: (document.querySelector('[data-name="Event Log"] [data-name="Body"] > [data-name^="Row/"]') || { textContent: '' }).textContent.replace(/\s+/g, ' ').slice(0, 90) };
    });
    out[pg].errs = errs.slice(0, 4);
    await page.screenshot({ path: 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview/_gen/live-' + pg + (W ? '-' + W : '') + '.png' });
    page.removeAllListeners('console'); page.removeAllListeners('pageerror');
  }
  return out;
}
