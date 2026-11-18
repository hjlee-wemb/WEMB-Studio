/* 화면이 쓰는 작은 그림(아이콘 후보) — 파일 · 크기 · 가까운 레이어 이름 · 장면(탭 조각 포함). 실행: node src/ccpp/_gen/pw.js ../../ccpp-assets/_gen/icons.js */
async (page) => {
  const fs = require('fs');
  const SC = ['main', 'library', 'diagram', 'detail', 'file-open'];
  const all = {};
  const grab = async (sc) => {
    const L = await page.evaluate(() => [...document.querySelectorAll('img, svg[data-src]')].map((i) => {
      const b = i.getBoundingClientRect();
      const src = (i.getAttribute('src') || i.getAttribute('data-src') || '').split('/').pop().split('?')[0];
      const names = []; let e = i; while (e && names.length < 4) { const n = e.getAttribute && e.getAttribute('data-name'); if (n) names.push(n); e = e.parentElement; }
      return { src, w: Math.round(b.width), h: Math.round(b.height), names: names.join(' < ') };
    }).filter((x) => x.w && x.w <= 60 && x.h <= 60));
    L.forEach((x) => { const k = x.src; if (!all[k]) all[k] = { w: x.w, h: x.h, names: x.names, sc: [] }; if (!all[k].sc.includes(sc)) all[k].sc.push(sc); });
  };
  for (const sc of SC) {
    await page.goto('http://localhost:5575/src/ccpp/' + sc + '.html?live=0&r=' + Date.now());
    await page.waitForTimeout(700);
    await grab(sc);
  }
  const lines = Object.keys(all).sort().map((k) => k.padEnd(28) + (all[k].w + 'x' + all[k].h).padEnd(8) + all[k].names.slice(0, 110) + '  [' + all[k].sc.join(',') + ']');
  fs.writeFileSync('C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp-assets/_gen/icons.txt', lines.join('\n'));
  return lines;
}
