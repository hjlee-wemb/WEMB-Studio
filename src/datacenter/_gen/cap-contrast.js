/* 라이트 9화면을 1920 으로 찍고(lfull-<장면>.png) 글자 상자(lboxes-<장면>.json)를 저장한다(라이브 끔 — 원본 글자 그대로).
   실행: node pw.js cap-contrast.js  → 뒤에: for p in main menu site forklift vibration heat event history sensor; do node contrast.js lfull-$p.png lboxes-$p.json 4.5; done */
async (page) => {
  const fs = require('fs');
  await page.setViewportSize({ width: 1920, height: 1080 });
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const res = {};
  for (const pg of ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event']) {
    await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.screenshot({ path: GEN + 'lfull-' + pg + '.png' });
    const boxes = await page.evaluate(() => [...document.querySelectorAll('p')].filter((p) => p.textContent.trim() && p.offsetWidth).map((p) => {
      const r = p.getBoundingClientRect(), cs = getComputedStyle(p);
      if (cs.visibility === 'hidden' || +cs.opacity === 0) return null;
      /* 그라디언트 글자(시계)는 글자색이 투명이라 잴 수 없다 — 따로 본다 */
      const m = /rgba?\(([^)]+)\)/.exec(cs.color); if (!m) return null;
      const c = m[1].split(',').map(Number);
      if (c.length > 3 && c[3] < 0.05) return null;
      /* 지도 위 · 3D 렌더 위 글자는 그림이 바탕이라 제외하지 않는다(라벨 판이 있다) */
      return { t: p.textContent.trim().slice(0, 24), n: p.getAttribute('data-name'), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), c: c.slice(0, 3) };
    }).filter((b) => b && b.x >= 0 && b.y >= 0 && b.x + b.w <= 1920 && b.y + b.h <= 1080 && b.w > 2));
    fs.writeFileSync(GEN + 'lboxes-' + pg + '.json', JSON.stringify(boxes));
    res[pg] = boxes.length;
  }
  return res;
}
