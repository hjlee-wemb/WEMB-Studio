/* 아이콘 후보 — 화면마다 Icon · Glyph · Button 안의 작은 그림 파일과 문맥(부모 이름 · 옆 글자). node src/oneview/_gen/pw.js ../../oneview-assets/_gen/icons.js */
async (page) => {
  const P = ['main', 'overview2', 'transactions', 'was', 'waspopup', 'tp', 'system', 'system2', 'detail', 'network', 'event'];
  const seen = {}, out = [];
  for (const pg of P) {
    await page.goto('http://localhost:5590/src/oneview/' + pg + '.html?live=0&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    const L = await page.evaluate(() => [...document.querySelectorAll('img')].map((im) => {
      const r = im.getBoundingClientRect();
      if (!r.width || r.width > 48 || r.height > 48) return null;
      let p = im.parentElement, chain = [];
      for (let k = 0; k < 4 && p; k++, p = p.parentElement) { const n = p.getAttribute('data-name'); if (n) chain.push(n); }
      if (!chain.some((n) => /Icon|Glyph|Button|Bullet|Arrow|Key|Dot|Logo|Indicator/i.test(n))) return null;
      const near = (im.closest('[data-name^="Item/"],[data-name^="Button/"],[data-name^="Field/"],[data-name^="Metric"],[data-name="Search Field"],[data-name^="Widget/"]') || document.body).querySelector('p');
      return { f: (im.getAttribute('src') || '').replace(/^.*\//, ''), sz: Math.round(r.width) + 'x' + Math.round(r.height), ctx: chain.join('<'), t: near ? near.textContent.trim().slice(0, 16) : '' };
    }).filter(Boolean));
    L.forEach((x) => { if (seen[x.f]) return; seen[x.f] = 1; out.push(pg + '\t' + x.f + '\t' + x.sz + '\t' + x.ctx + '\t' + x.t); });
  }
  require('fs').writeFileSync('C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/oneview-assets/_gen/icons.txt', out.join('\n'));
  return out.length;
}
