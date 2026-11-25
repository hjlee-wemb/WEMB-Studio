/* 분자 라이브러리에 두 프로젝트가 보이는지 — 페이지 단계에서 '스마트팩토리 에너지관리' 6장 · '통합 운영 원뷰' 11장을 찍고, 분자 단계 프로젝트 필터 수를 본다.
   실행: node src/fems/_gen/pw.js ../../datacenter-assets/_gen/atomic-check.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter-assets/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url().slice(-90)); });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('http://localhost:5510/index.html#/molecules/pages');
  await page.waitForTimeout(7000);
  const out = { errs };
  for (const [label, file] of [['데이터센터 통합 모니터링', 'atomic-pages-datacenter.png']]) {
    const ok = await page.evaluate((l) => { const h = [...document.querySelectorAll('h2, h3, h4')].find((x) => x.textContent.trim().startsWith(l)); if (h) { h.scrollIntoView(); return true; } return false; }, label);
    await page.waitForTimeout(4000);
    await page.screenshot({ path: GEN + file });
    out[label] = ok;
  }
  out.api = await page.evaluate(async () => {
    const L = await (await fetch('/api/library')).json();
    const by = {};
    (L.templates || []).forEach((t) => { if (t.family === 'datacenter') (by[t.family] = by[t.family] || []).push(t.name); });
    return by;
  });
  return out;
}
