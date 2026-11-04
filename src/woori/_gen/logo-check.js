/* Playwright filename — 로고 업로드 · 버전 잠금 점검(5510). 템플릿마다 새 프로젝트를 만들어 올려 본다. */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/woori/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 240)));
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto('http://localhost:5510/index.html?r=' + Date.now() + '#/templates');
  await page.waitForTimeout(700);
  const b64 = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 300; c.height = 60; const g = c.getContext('2d'); g.fillStyle = '#ff2d55'; g.fillRect(0, 0, 300, 60); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.fillText('TESTLOGO', 40, 42); return c.toDataURL('image/png').split(',')[1]; });
  const png = Buffer.from(b64, 'base64');
  const out = {};
  const cards = ['Dashboard: Woori Bank', 'Dashboard: Shinhan Card Security'];
  const others = await page.evaluate(() => [...document.querySelectorAll('.tplcard')].filter((c) => c.querySelector('.tplstate.ready')).map((c) => c.querySelector('.tpltitle').textContent));
  out.liveCards = others;
  const imgCard = await page.evaluate(() => { const c = [...document.querySelectorAll('.tplcard')].find((x) => !x.querySelector('.tplstate.ready') && /Gammania|Hyundai|KB/.test(x.textContent)); return c ? c.querySelector('.tpltitle').textContent : ''; });
  const list = others.concat(imgCard ? [imgCard] : []);
  for (const title of list) {
    await page.goto('http://localhost:5510/index.html?r=' + Date.now() + '#/templates');
    await page.waitForTimeout(500);
    await page.locator('.tplcard', { hasText: title }).first().click();
    await page.waitForTimeout(300);
    await page.locator('.tpld-start').click();
    await page.waitForTimeout(2600);
    const r = { };
    r.ver = await page.evaluate(() => ({ disabled: [...document.querySelectorAll('#version button')].map((b) => b.disabled), on: (document.querySelector('#version button.on') || {}).dataset ? document.querySelector('#version button.on').dataset.v : '', hint: getComputedStyle(document.querySelector('.verhint')).display, st: state.version }));
    await page.locator('#brandLogoFile').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
    await page.waitForTimeout(700);
    r.swap = await page.evaluate(() => {
      const im = [...document.querySelectorAll('.tpl-studio-logo, .tpl-logoswap img')].find((i) => (i.getAttribute('src') || '').startsWith('data:image/png'));
      const svg = document.querySelector('#skx-logoswap');
      const svgOk = !!svg && (svg.getAttribute('href') || '').startsWith('data:image/png');
      const box = im ? im.getBoundingClientRect() : null;
      return { dom: !!im, svgOk, size: box ? [Math.round(box.width), Math.round(box.height)] : null, vis: im ? getComputedStyle(im).display : '', filter: im ? getComputedStyle(im).filter : '' };
    });
    out[title] = r;
  }
  return { errs: errs.slice(0, 6), out };
}
