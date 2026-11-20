/* GitHub Pages 실사이트 점검 — 분자 라이브러리(정적 모드)에서 두 프로젝트의 페이지 · 분자 · 상세 · 검색 · 라이트 · 템플릿 단계와 404 · 오류.
   실행: node src/fems/_gen/pw.js ../../fems-assets/_gen/pages-check.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/fems-assets/_gen/';
  const B = 'https://hjlee-wemb.github.io/WEMB-Studio/index.html';
  const errs = [], bad = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().replace('https://hjlee-wemb.github.io/WEMB-Studio/', '').slice(0, 110)); });
  await page.setViewportSize({ width: 1600, height: 1000 });
  const out = {};
  const go = async (hash, wait) => { await page.goto(B + '?r=' + Date.now() + hash); await page.waitForTimeout(wait || 8000); };
  /* 페이지 단계 */
  await go('#/molecules/pages', 12000);
  for (const [label, file] of [['스마트팩토리 에너지관리', 'pages-fems.png'], ['통합 운영 원뷰', 'pages-oneview.png']]) {
    out[label] = await page.evaluate((l) => {
      const h = [...document.querySelectorAll('h2, h3, h4')].find((x) => x.textContent.trim().startsWith(l));
      if (!h) return 'no section';
      h.scrollIntoView();
      const sec = h.parentElement;
      return h.textContent.replace(/\s+/g, ' ').trim();
    }, label);
    await page.waitForTimeout(5000);
    await page.screenshot({ path: GEN + file });
    out[label + ' 썸네일'] = await page.evaluate(() => {
      const fr = [...document.querySelectorAll('.atm-frame, .atm-thumb')].filter((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
      return { visible: fr.length, drawn: fr.filter((e) => e.shadowRoot || e.querySelector('*')).length };
    });
  }
  /* 페이지 하나 열기 — 원뷰 종합현황 */
  await go('#/molecules/p/oneview-main', 10000);
  out.pageDetail = await page.evaluate(() => document.body.innerText.slice(0, 160).replace(/\s+/g, ' '));
  await page.screenshot({ path: GEN + 'pages-oneview-main.png' });
  /* 분자 단계 — 검색어로 새 분자 */
  await go('#/molecules', 9000);
  const qbox = await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find((x) => x.offsetParent && (x.type === 'search' || /검색/.test(x.placeholder || ''))); if (!i) return null; const r = i.getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2, ph: i.placeholder }; });
  out.searchBox = qbox && qbox.ph;
  if (qbox) { await page.mouse.click(qbox.x, qbox.y); await page.keyboard.type('Measurement', { delay: 20 }); await page.waitForTimeout(3500); }
  out.search = await page.evaluate(() => { const t = document.body.innerText; const m = t.match(/Measurement[^\n]{0,40}/g); return m ? m.slice(0, 4) : 'none'; });
  await page.screenshot({ path: GEN + 'pages-search.png' });
  /* 분자 상세 — 원뷰에만 쓰는 분자 */
  await go('#/molecules/m/metric-26db7750c0', 9000);
  out.molDetail = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\s+/g, ' '));
  await page.screenshot({ path: GEN + 'pages-mol.png' });
  /* 템플릿 단계 */
  await go('#/molecules/templates', 9000);
  out.templates = await page.evaluate(() => { const t = document.body.innerText; return { fems: /스마트팩토리 에너지관리/.test(t), oneview: /통합 운영 원뷰/.test(t) }; });
  out.errs = errs.slice(0, 10);
  out.bad = [...new Set(bad)].slice(0, 15);
  return out;
}
