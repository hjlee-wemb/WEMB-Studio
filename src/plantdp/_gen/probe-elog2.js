/* 정렬 뒤 — 칸마다 머리 칸 가운데와 줄 칸 가운데의 차이(px) */
async (page, args) => {
  const out = {};
  for (const sc of ['event', 'sop-popup', 'building', 'floor']) {
    await page.setViewportSize({ width: +(args[0] || 1920), height: +(args[1] || 1080) });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=light&r=' + Date.now());
    await page.waitForTimeout(1600);
    out[sc] = await page.evaluate(() => {
      const el = document.querySelector('[data-name="Event Log"]');
      const L = ['등급', '발생시간', '설비명', '설비타입', '메시지'];
      const inRow = (p) => !!p.closest('[data-name^="Row/"], [data-name="grid-row"]');
      const H = {}; [...el.querySelectorAll('p')].forEach((p) => { const t = p.textContent.trim(); if (L.includes(t) && !H[t] && !inRow(p)) { const g = document.createRange(); g.selectNodeContents(p); const b = g.getBoundingClientRect(); H[t] = b.left + b.width / 2; } });
      const rows = [...el.querySelectorAll('[data-name^="Row/"], [data-name="grid-row"]')].filter((x) => !x.parentElement.closest('[data-name^="Row/"], [data-name="grid-row"]') && x.getBoundingClientRect().width);
      const ink = (e) => { if (e.tagName !== 'P') return e.getBoundingClientRect(); const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect(); }; const c = (e) => { const b = ink(e); return b.left + b.width / 2; };
      return rows.map((r) => {
        const ps = [...r.querySelectorAll('p')].filter((p) => !p.closest('[data-name^="btn-"]'));
        const grp = (ink(ps[0]).left + ink(ps[1]).right) / 2;
        const dot = r.querySelector('[data-name="disability component"]') || [...r.querySelectorAll('img')].filter((im) => !im.closest('[data-name^="btn-"]') && im.getBoundingClientRect().left < ink(ps[0]).left)[0];
        return [dot ? Math.round(c(dot) - H['등급']) : '-', Math.round(grp - H['발생시간']), Math.round(c(ps[2]) - H['설비명']), Math.round(c(ps[3]) - H['설비타입']), Math.round(c(ps[4]) - H['메시지'])].join(' ');
      });
    });
  }
  return out;
}
