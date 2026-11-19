/* 다크 대비 점검 1단계(Playwright) — 화면마다 캡처 + 보이는 글자 상자 · 글자색을 dk-cx-<장면>.json 에 쓴다. 2단계: node dk-contrast-an.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/fems/_gen/';
  const fs = require('fs');
  const out = {};
  for (const pg of ['main', 'diagram', 'event', 'solar', 'equipment', 'evx']) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5580/src/fems/' + (pg === 'evx' ? 'main' : pg) + '.html?t=dark&r=' + Date.now());
    await page.waitForTimeout(1800);
    if (pg === 'evx') { await page.evaluate(() => document.querySelector('[data-name="Bar (Collapsed)"] [data-name="Button/Expand"]').click()); await page.waitForTimeout(1200); }
    await page.evaluate(() => { const s = document.createElement('style'); s.textContent = '*{transition:none!important;animation:none!important}'; document.head.appendChild(s); document.querySelectorAll('.fe-tk').forEach((t, i) => { t.style.opacity = i ? 0 : 1; t.style.translate = '0 0'; }); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: GEN + 'dk-cx-' + pg + '.png' });
    const items = await page.evaluate(() => {
      const res = [];
      const els = [...document.querySelectorAll('p, span')].filter((e) => { const t = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); return t; });
      els.forEach((e) => {
        const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.right < 0 || r.left > 1920 || r.bottom < 0 || r.top > 1080) return;
        const c = getComputedStyle(e); if (c.visibility === 'hidden' || +c.opacity === 0) return;
        let o = 1, x = e; while (x) { o *= +getComputedStyle(x).opacity; x = x.parentElement; } if (o < 0.3) return;
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (top && !(e === top || e.contains(top) || top.contains(e))) { if (!(top.closest && top.closest('.sh-popmount') === e.closest('.sh-popmount'))) return; }
        const name = (e.closest('[data-name]') || {}).getAttribute ? e.closest('[data-name]').getAttribute('data-name') : '';
        const path = []; let y = e.closest('[data-name]'); for (let i = 0; y && i < 4; i++) { path.unshift(y.getAttribute('data-name')); y = y.parentElement && y.parentElement.closest('[data-name]'); }
        res.push({ t: e.textContent.trim().slice(0, 24), col: c.color, fs: parseFloat(c.fontSize), fw: c.fontWeight, r: [r.left, r.top, r.width, r.height].map(Math.round), path: path.join(' > '), cls: e.className });
      });
      return res;
    });
    fs.writeFileSync(GEN + 'dk-cx-' + pg + '.json', JSON.stringify(items));
    out[pg] = items.length;
  }
  return out;
}
