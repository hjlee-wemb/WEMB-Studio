async (page) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plant/_gen/';
  await page.goto('http://localhost:5541/src/plant/overview.html?live=0&t=dark&r=' + Date.now());
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: GEN + 'dom-1-2.png' });
  return await page.evaluate(async () => {
    const meta = await (await fetch('/src/plant/_gen/meta-abs.json?' + Date.now())).json();
    const bad = []; let n = 0;
    document.querySelectorAll('[data-node-id]').forEach((el) => {
      const id = el.getAttribute('data-node-id'); const m = meta[id]; if (!m || m.g) return;
      if (getComputedStyle(el).display === 'contents') return;
      const r = el.getBoundingClientRect(); n++;
      const dx = +(r.left - m.x).toFixed(1), dy = +(r.top - m.y).toFixed(1), dw = +(r.width - m.w).toFixed(1), dh = +(r.height - m.h).toFixed(1);
      if (Math.abs(dx) > 0.6 || Math.abs(dy) > 0.6 || Math.abs(dw) > 0.6 || Math.abs(dh) > 0.6) bad.push(id + ' ' + m.n.slice(0, 22) + ' d[' + dx + ',' + dy + ',' + dw + ',' + dh + '] fig[' + Math.round(m.x) + ',' + Math.round(m.y) + ',' + Math.round(m.w) + ',' + Math.round(m.h) + ']');
    });
    return { n, badN: bad.length, bad: bad.slice(0, 40) };
  });
}
