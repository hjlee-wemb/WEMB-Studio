/* 분자 라이브러리에 산단이 보이는지 — 페이지 단계에서 '스마트 산단 디지털 트윈' 9장, 분자 단계에서 그 프로젝트 필터. 실행: node src/indpark/_gen/pw.js <이 파일> */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/indpark-assets/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('http://localhost:5510/index.html#/molecules/pages');
  await page.waitForTimeout(6000);
  const pages = await page.evaluate(() => {
    const t = document.body.innerText;
    const i = t.indexOf('스마트 산단 디지털 트윈');
    return { found: i >= 0, around: i >= 0 ? t.slice(i, i + 260).replace(/\s+/g, ' ') : '' };
  });
  await page.evaluate(() => { const h = [...document.querySelectorAll('h3, h4, h2')].find((x) => /스마트 산단/.test(x.textContent)); if (h) h.scrollIntoView(); });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: GEN + 'atomic-pages.png' });
  const api = await page.evaluate(async () => {
    const r = await fetch('/api/library'); const L = await r.json();
    const fam = (L.families || {}).indpark;
    const tpls = (L.templates || []).filter((t) => t.family === 'indpark').map((t) => t.name + ' (' + t.instanceCount + ')');
    return { family: fam, templates: tpls };
  });
  return { pages, api, errs };
}
