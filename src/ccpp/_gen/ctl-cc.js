/* 진짜 마우스로 누르는 동작 검증(미리보기 5575). 실행: node pw.js ctl-cc.js
   누를 것의 가운데가 다른 판에 막히는지(hit-test)도 같이 본다. */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp/_gen/';
  const U = (p) => 'http://localhost:5575/src/ccpp/' + p + '.html?t=light&r=' + Date.now();
  const out = {};
  const center = async (sel, i = 0) => page.evaluate(([s, i]) => {
    const e = document.querySelectorAll(s)[i]; if (!e) return null;
    const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const top = document.elementFromPoint(x, y);
    return { x, y, ok: !!top && (top === e || e.contains(top)), top: top && (top.getAttribute('data-name') || top.tagName) };
  }, [sel, i]);
  const click = async (sel, i = 0) => { const c = await center(sel, i); if (!c) return 'missing'; await page.mouse.click(c.x, c.y); await page.waitForTimeout(500); return c.ok ? 'ok' : 'blocked by ' + c.top; };
  const go = async (p) => { await page.goto(U(p)); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(1600); };

  /* 도서관리 */
  await go('library');
  out.libRow = await click('[data-name="Panel/Document Library"] [data-name="List"] > [data-name="Row/7"]');
  out.libExpAfter = await page.evaluate(() => { const l = document.querySelector('[data-name="Panel/Document Library"] [data-name="List"]'); const k = [...l.children]; const e = k.find((x) => /Expanded/.test(x.dataset.name)); return k[k.indexOf(e) - 1].dataset.name + ' · doc=' + e.querySelector('[data-name="File Group/Doc"] p:last-child, [data-name="File Group/Doc"] [data-name="Link Box"] p').textContent; });
  out.libSelect = await click('[data-name="Field/Resp Div"] [data-name="Select"]');
  out.libMenu = await page.evaluate(() => !!document.querySelector('.cc-selmenu.open'));
  const btn = await page.evaluate(() => { const b = [...document.querySelectorAll('.cc-selmenu.open button')].find((x) => x.textContent === 'M'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.click(btn.x, btn.y); await page.waitForTimeout(400);
  out.libFiltered = await page.evaluate(() => [...document.querySelectorAll('[data-name="Panel/Document Library"] [data-name="List"] > [data-name^="Row/"]')].filter((r) => r.style.display !== 'none' && !/Expanded/.test(r.dataset.name)).length);
  await page.screenshot({ path: GEN + 'ctl-lib-filter.png' });
  /* 다시 전체 + 검색 */
  await click('[data-name="Field/Resp Div"] [data-name="Select"]');
  const all = await page.evaluate(() => { const b = [...document.querySelectorAll('.cc-selmenu.open button')].find((x) => x.textContent === '전체'); const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.click(all.x, all.y); await page.waitForTimeout(300);
  out.libSearch = await click('[data-name="Panel/Document Library"] [data-name="Search Field"]');
  await page.keyboard.type('TURBINE'); await page.waitForTimeout(300);
  out.libSearchRows = await page.evaluate(() => [...document.querySelectorAll('[data-name="Panel/Document Library"] [data-name="List"] > [data-name^="Row/"]')].filter((r) => r.style.display !== 'none' && !/Expanded/.test(r.dataset.name)).length);
  await page.keyboard.press('Escape');
  /* 스크롤 */
  const lc = await center('[data-name="Panel/Document Library"] [data-name="List"] > [data-name="Row/9"]');
  await page.mouse.move(lc.x, lc.y); await page.mouse.wheel(0, 600); await page.waitForTimeout(500);
  out.libScroll = await page.evaluate(() => { const l = document.querySelector('[data-name="Panel/Document Library"] [data-name="Grid"] [data-name="List"]'); const t = document.querySelector('[data-name="Panel/Document Library"] [data-name="Thumb"]'); return l.style.translate + ' / thumb ' + t.style.translate; });
  await page.screenshot({ path: GEN + 'ctl-lib-scroll.png' });

  /* 상세 — 탭 · 접기 · 태그 */
  await go('detail');
  for (const t of ['Tab/Equipment', 'Tab/Materials', 'Tab/Design', 'Tab/Operation Info', 'Tab/Maintenance History']) {
    out[t] = await click('[data-name="' + t + '"]');
    await page.waitForTimeout(700);
    out[t] += ' · ' + await page.evaluate(() => { const f = document.querySelector('.cc-frag'); return f ? (f.querySelector('[data-name="Section"] p, h4') || {}).textContent : 'orig ' + document.querySelector('[data-name="Popup/Detail"] [data-name="Content"] > [data-name="Header"] p').textContent; });
    await page.screenshot({ path: GEN + 'ctl-tab-' + t.slice(4).replace(/\s/g, '') + '.png' });
  }
  out.hide = await click('[data-name="Button/Hide"]');
  await page.waitForTimeout(700);
  out.hidden = await page.evaluate(() => document.querySelector('[data-name="Popup/Detail"]').style.translate);
  await page.screenshot({ path: GEN + 'ctl-fold-shut.png' });
  out.show = await click('[data-name="Button/Hide"]');
  await page.waitForTimeout(700);
  out.shown = await page.evaluate(() => document.querySelector('[data-name="Popup/Detail"]').style.translate || '0');
  out.tagSort = await click('[data-name="Th/Location"]');
  out.tagFirst = await page.evaluate(() => document.querySelector('[data-name="Panel/Tag"] [data-name="List"] > [data-name^="Row/"] [data-name="Td/Location"]').textContent);
  out.tagSearch = await click('[data-name="Search Field/Tag"]');
  await page.keyboard.type('PU'); await page.waitForTimeout(300);
  out.tagRows = await page.evaluate(() => [...document.querySelectorAll('[data-name="Panel/Tag"] [data-name="List"] > [data-name^="Row/"]')].filter((r) => r.style.display !== 'none').length);
  await page.screenshot({ path: GEN + 'ctl-tag.png' });

  /* 맵 — 레이어 토글 · 구역 접기 */
  await go('main');
  out.toggle = await click('[data-name="Section/Gas Turbine"] [data-name="Item/Civil"] [data-name^="Row/"]');
  out.toggleState = await page.evaluate(() => document.querySelector('[data-name="Section/Gas Turbine"] [data-name="Item/Civil"] [data-name^="Toggle/"]').dataset.name);
  out.fold = await click('[data-name="Section/Gas Turbine"] > [data-name="Header"]');
  await page.waitForTimeout(600);
  out.foldH = await page.evaluate(() => document.querySelector('[data-name="Section/Gas Turbine"] > [data-name="Body"]').getBoundingClientRect().height);
  await page.screenshot({ path: GEN + 'ctl-map.png' });
  /* 화면 이동 — 레일 도서관리 */
  const nav = await center('[data-name="Nav Item/Document Library"]');
  await page.mouse.click(nav.x, nav.y); await page.waitForTimeout(1200);
  out.navTo = page.url().split('/').pop().split('?')[0] + (nav.ok ? '' : ' (blocked ' + nav.top + ')');
  /* 파일 열기 → 계통도 */
  await go('file-open');
  const op = await center('[data-name="Option/P&ID Diagram"]');
  await page.mouse.click(op.x, op.y); await page.waitForTimeout(1200);
  out.fileOpenTo = page.url().split('/').pop().split('?')[0] + (op.ok ? '' : ' (blocked ' + op.top + ')');
  return out;
}
