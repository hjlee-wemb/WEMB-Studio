/* Playwright browser_run_code_unsafe 의 filename 으로 쓴다 — 세 화면 캡처 + Figma 상자 대조 */
async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/woori/_gen/';
  const out = {};
  for (const [pg, key] of [['transaction','11-946'],['performance','15-2'],['event','19-2533']]) {
    await page.goto('http://localhost:5531/src/woori/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForTimeout(700);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => { const t = document.getElementById('tt'); if (t) t.style.display='none'; });
    await page.waitForTimeout(200);
    await page.screenshot({ path: GEN + 'dom-' + key + '.png' });
    out[pg] = await page.evaluate(async () => {
      const meta = await (await fetch('/src/woori/_gen/meta-abs.json?' + Date.now())).json();
      const bad = []; let n = 0;
      document.querySelectorAll('[data-node-id]').forEach((el) => {
        const id = el.getAttribute('data-node-id'); const m = meta[id]; if (!m || m.g) return;
        if (getComputedStyle(el).display === 'contents') return;
        const r = el.getBoundingClientRect(); n++;
        const dx = +(r.left - m.x).toFixed(1), dy = +(r.top - m.y).toFixed(1), dw = +(r.width - m.w).toFixed(1), dh = +(r.height - m.h).toFixed(1);
        if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6 || Math.abs(dw) > 0.6 || Math.abs(dh) > 0.6) bad.push(id + ' ' + m.n.slice(0, 18) + ' d[' + dx + ',' + dy + ',' + dw + ',' + dh + '] fig[' + Math.round(m.x) + ',' + Math.round(m.y) + ',' + Math.round(m.w) + ',' + Math.round(m.h) + ']');
      });
      const svgs = [];
      document.querySelectorAll('svg[viewBox]').forEach((s) => { const v = s.getAttribute('viewBox').split(/\s+/).map(Number); const r = s.getBoundingClientRect(); if (Math.abs(r.width - v[2]) > 0.7 || Math.abs(r.height - v[3]) > 0.7) svgs.push((s.getAttribute('class')||'').split(' ')[0] + ' box ' + r.width.toFixed(1) + 'x' + r.height.toFixed(1) + ' vb ' + v[2] + 'x' + v[3]); });
      return { n, badN: bad.length, bad: bad.slice(0, 30), svgs };
    });
  }
  return out;
}
