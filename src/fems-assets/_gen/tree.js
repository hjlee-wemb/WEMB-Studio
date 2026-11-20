/* 에셋 후보 뽑기 — 화면마다 컴포넌트급 레이어(이름 · 노드 id · 크기 · 안의 첫 글자). node src/fems/_gen/pw.js ../../fems-assets/_gen/tree.js
   결과는 tree.txt 로 저장(손으로 spec.json 고를 때 본다) */
async (page) => {
  const P = ['main', 'diagram', 'event', 'solar', 'equipment'];
  const RX = '^(Panel/|Popup/|Section/|Card/|Gauge|Ticker|Side|Rail|Toolbar|Tab|Header|Widget/|Popup/|Event Log$|KPI|Panel|Row Panel/|Column/|Line Chart$|Chart$|Donut Chart$|Legend$|Table$|Toolbar$|Card Row|Card/|Node Group|Node/|Server Cube|Network Device|Button/|Count/|Search Group$|Filter/|Tab/|Pagination$|Field/|Item/|Title Bar$|WAS Status Board|Notice$|Server Info$|Clock|Logo|Brand|Nav$|Utility$|Transfer Arrows|Metric/|Group/|Zone/|Bar Chart|Gauge|Status)';
  const lines = [];
  for (const pg of P) {
    await page.goto('http://localhost:5580/src/fems/' + pg + '.html?live=0&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    const L = await page.evaluate((rxs) => {
      const rx = new RegExp(rxs), out = [], seen = {};
      const box = (el) => {
        if (getComputedStyle(el).display !== 'contents') { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        el.querySelectorAll('*').forEach((c) => { if (getComputedStyle(c).display === 'contents' || c.ownerSVGElement) return; const b = c.getBoundingClientRect(); if (!b.width || !b.height) return; x0 = Math.min(x0, b.left); y0 = Math.min(y0, b.top); x1 = Math.max(x1, b.right); y1 = Math.max(y1, b.bottom); });
        return x0 > x1 ? [0, 0, 0, 0] : [x0, y0, x1 - x0, y1 - y0];
      };
      document.querySelectorAll('[data-name]').forEach((el) => {
        const n = el.getAttribute('data-name');
        if (!rx.test(n)) return;
        let d = 0; for (let p = el.parentElement; p; p = p.parentElement) if (p.getAttribute && p.getAttribute('data-name') && rx.test(p.getAttribute('data-name'))) d++;
        if (d > 3) return;
        const b = box(el).map(Math.round);
        if (b[2] < 8 || b[3] < 8) return;
        const key = n + '|' + b[2] + 'x' + b[3];
        seen[key] = (seen[key] || 0) + 1;
        if (seen[key] > 2) return;
        const t = [...el.querySelectorAll('p')].map((p) => p.textContent.trim()).filter(Boolean).slice(0, 3).join(' / ').slice(0, 50);
        out.push('  '.repeat(d) + n + '  #' + el.getAttribute('data-node-id') + '  ' + b[2] + 'x' + b[3] + ' @' + b[0] + ',' + b[1] + (t ? '  "' + t + '"' : ''));
      });
      return out;
    }, RX);
    lines.push('== ' + pg, ...L);
  }
  require('fs').writeFileSync('C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/fems-assets/_gen/tree.txt', lines.join('\n'));
  return lines.length;
}
