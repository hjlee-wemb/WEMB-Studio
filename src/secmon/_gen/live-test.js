/* 라이브 켠 미리보기 9장 — 오류 · 404 · 시계 · 패널 · 스크롤 · 캡처(live-<page>.png). node pw.js live-test.js [page…] */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/secmon/_gen/';
  await page.setViewportSize({ width: 1920, height: 1080 });
  const P = args.length ? args : ['main', 'channel', 'micro', 'mq', 'infra', 'event', 'eventpanel', 'alert', 'sound'];
  const out = {};
  for (const pg of P) {
    const errs = [], bad = [];
    const onC = (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); };
    const onE = (e) => errs.push('PAGEERR ' + String(e).slice(0, 200));
    const onR = (r) => { if (r.status() >= 400) bad.push(r.url().replace(/^.*\/src\//, '')); };
    page.on('console', onC); page.on('pageerror', onE); page.on('response', onR);
    await page.goto('http://localhost:5620/src/secmon/' + pg + '.html?r=' + Date.now());
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(+(process.env.WAIT || 2200));
    out[pg] = await page.evaluate(() => {
      const root = document.querySelector('.sl-root');
      const st = root && root.__sl;
      const t = document.querySelector('[data-name="Clock"] [data-name="Time"]');
      return {
        live: !!st, scene: st && st.scene, overlay: st && st.overlay,
        panels: st && st.panels.map((p) => p.name + ':' + p.els.length).join(', '),
        time: t && t.textContent, clips: document.querySelectorAll('.sl-clip').length, hscroll: st && st.hscroll,
        segs: document.querySelectorAll('.sl-seg').length, bars: document.querySelectorAll('.sl-bar').length,
        hv: document.querySelectorAll('.sl-hv').length, svgLines: document.querySelectorAll('[data-name="Data"] svg').length,
        charts: document.querySelectorAll('.sl-chartbtn').length,
      };
    });
    await page.screenshot({ path: GEN + 'live-' + pg + '.png' });
    out[pg].errs = errs; out[pg].bad = bad;
    page.off('console', onC); page.off('pageerror', onE); page.off('response', onR);
  }
  return out;
}
