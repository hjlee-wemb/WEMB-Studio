/* 에셋 라이브러리 점검 — 스튜디오에서 '펼치기' 후 탭마다, 이 시안 썸네일이 실제로 그려졌는지(빈 칸 · 찌그러짐 · 바탕 비침) 재고 찍는다.
   다크 · 라이트 둘 다. Playwright filename, 검증 서버 node src/statcom/_gen/serve.js 5542 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom-assets/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1600 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5542/index.html#/templates/digital-twin-statcom-hmi');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .tcm-root', { timeout: 20000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기'); if (b) b.click(); });
  await p.waitForTimeout(800);
  const SEL = '.tcm-root,.tcs-root,.tcp-root,.tcv-root,.tcc-root,.tce-root,.tcn-root,.tcu-root,.tca-root,.tcq-root,.tvt-root,.tvo-root,.tvs-root,.tvm-root,.tcl-root';
  const out = { tabs: await p.evaluate(() => [...document.querySelectorAll('#libTabs [role=tab], #libTabs button')].map((b) => b.textContent.trim())), mode: {} };
  const scan = (sel) => p.evaluate((sel) => {
    const root = document.getElementById('libGrid');
    const mine = [...root.querySelectorAll('.hj-asset')].filter((m) => m.matches(sel));
    const bad = [];
    mine.forEach((m) => {
      const w = +m.dataset.hjw, h = +m.dataset.hjh, k = parseFloat(getComputedStyle(m).getPropertyValue('--k')) || 1;
      const c = m.firstElementChild;
      const card = m.closest('.libitem');
      const name = card ? (card.getAttribute('title') || card.textContent.trim()).slice(0, 26) : '';
      if (!c) { bad.push(name + ': 내용 없음'); return; }
      /* 첫 자식 상자가 등록 크기와 어긋나면 잘라 오면서 무너진 것이다(display:contents 판은 판째 당긴 것이라 뺀다) */
      if (!c.classList.contains('hj-ofs')) {
        const r = c.getBoundingClientRect();
        const rw = r.width / k, rh = r.height / k;
        if (Math.abs(rw - w) > 2 || Math.abs(rh - h) > 2) bad.push(name + ': 상자 ' + Math.round(rw) + 'x' + Math.round(rh) + ' / 등록 ' + w + 'x' + h);
      }
      /* 깨진 그림 */
      m.querySelectorAll('img').forEach((i) => { if (i.complete && !i.naturalWidth) bad.push(name + ': 그림 깨짐 ' + (i.getAttribute('src') || '').split('/').pop()); });
    });
    return { n: mine.length, icons: root.querySelectorAll('img[src*="src/statcom/"]').length, bad };
  }, sel);
  const only = () => p.evaluate((sel) => {
    const g = document.getElementById('libGrid');
    [...g.children].forEach((c) => {
      const keep = c.querySelector(sel) || c.querySelector('img[src*="src/statcom/"]');
      c.style.display = keep ? '' : 'none';
    });
    g.scrollIntoView();
    const r = g.getBoundingClientRect();
    return { x: Math.max(0, r.x), y: Math.max(0, r.y), w: r.width, h: r.height };
  }, SEL);
  const tabs = await p.$$('#libTabs [role=tab], #libTabs button');
  for (const mode of ['dark', 'light']) {
    await p.evaluate((m) => document.querySelector('#mode button[data-m="' + m + '"]').click(), mode);
    await p.waitForTimeout(800);
    out.mode[mode] = [];
    for (let i = 0; i < tabs.length; i++) {
      await tabs[i].evaluate((b) => b.click());
      await p.waitForTimeout(2500);
      const name = out.tabs[i];
      const r = await scan(SEL);
      r.tab = name;
      out.mode[mode].push(r);
      if (r.n || r.icons) {
        const box = await only();
        await p.waitForTimeout(500);
        await p.screenshot({ path: GEN + 'lib-' + mode + '-' + i + '.png', fullPage: true });
        out.size = box;
      }
    }
  }
  out.errs = errs.slice(0, 6);
  await ctx.close();
  return out;
}
