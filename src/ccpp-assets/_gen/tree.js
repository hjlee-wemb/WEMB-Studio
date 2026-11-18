/* 장면별 레이어 나무(이름 · 노드 · 크기 · 글자 견본) — 등록 목록 고르기용. 실행: node src/ccpp/_gen/pw.js ../../ccpp-assets/_gen/tree.js */
async (page) => {
  const fs = require('fs');
  const SC = ['main', 'library', 'diagram', 'detail', 'file-open'];
  const out = {};
  for (const sc of SC) {
    await page.goto('http://localhost:5575/src/ccpp/' + sc + '.html?live=0&r=' + Date.now());
    await page.waitForTimeout(800);
    out[sc] = await page.evaluate(() => {
      const root = document.querySelector('[class*="-root"]');
      const L = [];
      const walk = (el, d) => {
        if (d > 7) return;
        [...el.children].forEach((c) => {
          const nm = c.getAttribute('data-name');
          if (nm) {
            const cs = getComputedStyle(c);
            let b = c.getBoundingClientRect();
            if (cs.display === 'contents') {
              let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
              c.querySelectorAll('*').forEach((k) => { if (k.ownerSVGElement || getComputedStyle(k).display === 'contents') return; const q = k.getBoundingClientRect(); if (!q.width || !q.height) return; x0 = Math.min(x0, q.left); y0 = Math.min(y0, q.top); x1 = Math.max(x1, q.right); y1 = Math.max(y1, q.bottom); });
              b = { left: x0, top: y0, width: x1 - x0, height: y1 - y0 };
            }
            if (b.width * b.height >= 64) {
              const t = (c.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
              L.push('  '.repeat(d) + nm + ' [' + c.getAttribute('data-node-id') + '] ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' @' + Math.round(b.left) + ',' + Math.round(b.top) + (cs.display === 'contents' ? ' G' : '') + (t ? ' "' + t + '"' : '') + ' n' + c.querySelectorAll('*').length);
            }
            walk(c, d + 1);
          } else walk(c, d);
        });
      };
      walk(root, 0);
      return L;
    });
  }
  fs.writeFileSync('C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp-assets/_gen/tree.txt', Object.keys(out).map((k) => '### ' + k + '\n' + out[k].join('\n')).join('\n\n'));
  return Object.keys(out).map((k) => k + ' ' + out[k].length);
}
