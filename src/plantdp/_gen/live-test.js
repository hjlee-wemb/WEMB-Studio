/* 라이브 켜고 찍기 — node pw.js live-test.js <w> <h> [scene…] → live-<scene>-<w>.png, 여백 · 오류 보고 */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const W = +(args[0] || 1920), H = +(args[1] || 1080);
  const scenes = args.slice(2).length ? args.slice(2) : ['main', 'weather', 'seismic', 'event', 'sop-popup', 'building', 'floor', 'sop', 'sop-standby', 'login'];
  const out = {};
  await page.setViewportSize({ width: W, height: H });
  for (const sc of scenes) {
    const errs = [];
    const onErr = (e) => errs.push(e.message.slice(0, 160));
    page.on('pageerror', onErr);
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=light&r=' + Date.now());
    await page.waitForTimeout(2600);
    await page.screenshot({ path: GEN + 'live-' + sc + '-' + W + '.png' });
    out[sc] = await page.evaluate(() => {
      const root = document.querySelector('.pd-root');
      const fr = root.querySelector(':scope > [data-node-id]').getBoundingClientRect();
      const warn = window.__pdWarn || [];
      return { frame: [Math.round(fr.width), Math.round(fr.height)], svgs: document.querySelectorAll('.pd-live-svg').length, scroll: document.querySelectorAll('.pd-scroller').length };
    });
    out[sc].errs = errs;
    page.off('pageerror', onErr);
  }
  return out;
}
