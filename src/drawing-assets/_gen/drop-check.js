/* 끌어다 넣기 점검 — 패널 · 심볼 · 아이콘을 라이브러리에서 화면으로 끌어 넣고, 넣은 사본의 크기 · 글자 · 깨진 그림 · 바탕을 잰다. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/drawing-assets/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://localhost:5544/index.html#/templates/dashboard-smart-drawing-management');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .dwm-root', { timeout: 20000 });
  await p.waitForTimeout(4000);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '펼치기' && x.offsetParent); if (b) b.click(); });
  await p.waitForTimeout(800);
  const out = { libOpen: await p.evaluate(() => !!document.getElementById('libSearch').offsetParent) };
  const drop = async (tabName, itemName, x, y) => {
    /* 패널 탭을 통째로 그리면 썸네일이 190개라 오래 걸린다 — 검색으로 그 항목만 띄운다(검색은 모든 탭을 찾는다) */
    const search = (v) => p.evaluate((v) => { const i = document.getElementById('libSearch'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); }, v);
    await search(itemName);
    await p.waitForTimeout(3500);
    /* 화면 모듈이 실리면 목록을 다시 그려 항목이 바뀐다 — 다시 잡는다 */
    for (let i = 0; i < 4; i++) {
      try {
        const item = p.locator('#libGrid .libitem[title="' + itemName + '"]').first();
        await item.scrollIntoViewIfNeeded({ timeout: 8000 });
        await item.dragTo(p.locator('#dtStage'), { targetPosition: { x, y }, force: true, timeout: 8000 });
        break;
      } catch (e) { await p.waitForTimeout(2000); if (i === 3) throw e; }
    }
    await p.waitForTimeout(1000);
    await search('');
  };
  await drop('패널', '공지사항 패널', 720, 180);
  await drop('심볼', '조회 단추 (도면관리)', 300, 180);
  await drop('심볼', 'CCTV 사업소 카드 (선택)', 480, 180);
  await drop('아이콘', '처음 페이지 아이콘', 300, 300);
  await drop('아이콘', '공지사항 일러스트 아이콘', 380, 300);
  const measure = () => p.evaluate(() => [...document.querySelectorAll('#dtStage .hj-asset')].map((a) => {
    const r = a.getBoundingClientRect();
    const f = a.firstElementChild, cs = getComputedStyle(a);
    return { cls: a.className.split(' ').slice(0, 2).join(' '), theme: a.dataset.theme, reg: a.dataset.hjw + 'x' + a.dataset.hjh, box: Math.round(r.width) + 'x' + Math.round(r.height), bg: cs.backgroundColor, text: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 34), broken: [...a.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth).length };
  }));
  out.light = await measure();
  out.icons = await p.evaluate(() => [...document.querySelectorAll('#dtStage img')].map((i) => i.getAttribute('src')).filter((s) => /drawing\/(icon-2-5|icon-image-1-tp)/.test(s)));
  await p.screenshot({ path: GEN + 'drop-light.png' });
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(3500);
  await p.screenshot({ path: GEN + 'drop-dark.png' });
  out.dark = (await measure()).map((x) => x.theme + ' ' + x.bg);
  out.errs = errs;
  await ctx.close();
  return out;
}
