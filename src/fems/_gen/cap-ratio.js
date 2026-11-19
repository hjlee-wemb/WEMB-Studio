/* 여러 화면비에서 라이브 미리보기를 찍는다(여백 · 늘어남 확인). 실행: node pw.js cap-ratio.js W H */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/fems/_gen/';
  const [W, H] = (globalThis.__ARGS || []).map(Number);
  const out = {};
  for (const pg of ['main', 'library', 'diagram', 'detail', 'file-open']) {
    await page.setViewportSize({ width: W || 1440, height: H || 1080 });
    await page.goto('http://localhost:5580/src/fems/' + pg + '.html?t=light&r=' + Date.now());
    await page.waitForTimeout(1800);
    await page.screenshot({ path: GEN + 'ratio-' + pg + '-' + (W || 1440) + 'x' + (H || 1080) + '.png' });
    out[pg] = await page.evaluate(() => {
      const r = document.querySelector('[class*="-root"].cc-root'), f = r.querySelector(':scope > [data-node-id]').getBoundingClientRect(), b = r.getBoundingClientRect();
      return [f.left - b.left, f.top - b.top, b.right - f.right, b.bottom - f.bottom].map((v) => Math.round(v));
    });
  }
  return out;
}
