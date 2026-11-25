/* 실제 조작 검증 — 진짜 마우스 · 키보드로 셀렉트 · 검색 · 체크 · 탭 · 옮기기 · 행 선택 · 툴팁 · 오버.
   실행: node pw.js interact-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/datacenter/_gen/';
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  const out = {};
  const open = async (pg) => { await page.goto('http://localhost:5600/src/datacenter/' + pg + '.html?r=' + Date.now()); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(2600); };
  const ctr = (sel, i = 0) => page.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, [sel, i]);
  const click = async (sel, i = 0) => { const p = await ctr(sel, i); if (!p) return false; await page.mouse.click(p.x, p.y); await page.waitForTimeout(350); return true; };
  const hoverFilter = async (sel, i = 0) => { const p = await ctr(sel, i); if (!p) return 'none'; await page.mouse.move(p.x, p.y); await page.waitForTimeout(300); return page.evaluate(([s, i]) => { const e = document.querySelectorAll(s)[i]; const h = document.elementFromPoint(...(() => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()); return { hit: e.contains(h), filter: getComputedStyle(e).filter.slice(0, 40), shadow: getComputedStyle(e).boxShadow.slice(0, 30) }; }, [sel, i]); };
  const visRows = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].filter((r) => r.style.display !== 'none').length, sel);

  /* ── 종합현황 2(이벤트 로그가 열린 화면) — 셀렉트 · 검색 ── */
  await open('was');
  const LOG = '[data-name="Event Log"] [data-name="Table"] > [data-name="Body"] > [data-name^="Row/"]';
  out.was = { rows0: await visRows(LOG) };
  out.was.hoverStop = await hoverFilter('[data-name="Button/Stop"]');
  out.was.hoverSelectBtn = await hoverFilter('[data-name="Event Log"] .dc-btn');
  out.was.dd = await page.evaluate(() => document.querySelectorAll('.dc-dd').length);
  await click('[data-name="Event Log"] .dc-dd');
  out.was.menu = await page.evaluate(() => { const m = document.querySelector('.dc-ddmenu.on'); return m ? [...m.querySelectorAll('button')].map((b) => b.textContent) : 'closed'; });
  await page.screenshot({ path: GEN + 'it-was-dd.png', clip: { x: 440, y: 760, width: 700, height: 200 } });
  await click('.dc-ddmenu.on button', 2);
  out.was.afterMMS = await visRows(LOG);
  out.was.ddLabel = await page.evaluate(() => document.querySelector('[data-name="Event Log"] .dc-dd p').textContent);
  await click('[data-name="Event Log"] .dc-dd'); await click('.dc-ddmenu.on button', 0);
  await click('[data-name="Event Log"] .dc-input');
  await page.keyboard.type('WAS', { delay: 40 });
  await page.waitForTimeout(400);
  out.was.afterSearch = await visRows(LOG);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  out.was.afterClear = await visRows(LOG);
  out.was.page2 = await click('[data-name="Page/2"]');
  out.was.hoverCard = await hoverFilter('[data-name^="Card/"]', 3);

  /* ── TP — 범례 오버 · 툴팁 ── */
  await open('tp');
  out.tp = { legendHover: await hoverFilter('[data-name="Legend"] [data-name^="Item/"]', 2) };
  await page.mouse.move(400, 200); await page.waitForTimeout(400);
  out.tp.tip = await page.evaluate(() => { const t = document.querySelector('.dc-tip.on'); return t ? t.textContent : 'no tip'; });
  await page.screenshot({ path: GEN + 'it-tp-tip.png', clip: { x: 60, y: 110, width: 640, height: 200 } });

  /* ── 종합현황 — 툴팁(주요 TP 모니터링) ── */
  await open('main');
  await page.mouse.move(1700, 245); await page.waitForTimeout(400);
  out.mainTip = await page.evaluate(() => { const t = document.querySelector('.dc-tip.on'); return t ? t.textContent : 'no tip'; });
  await page.screenshot({ path: GEN + 'it-main-tip.png', clip: { x: 1500, y: 100, width: 420, height: 200 } });

  /* ── WAS 팝업 — 체크 · 전체체크 해지 · 추가 · 탭 · 옮기기 ── */
  await open('waspopup');
  const CHK = '[data-name="Popup/Page Settings"] .dc-chk';
  out.pop = { chks: await page.evaluate((s) => document.querySelectorAll(s).length, CHK) };
  await click(CHK, 1);
  out.pop.chk1off = await page.evaluate((s) => document.querySelectorAll(s)[1].classList.contains('off'), CHK);
  await click('[data-name="Popup/Page Settings"] [data-name="Field/Check All"] [data-name="Value Box"]');
  out.pop.allOff = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((c) => c.classList.contains('off')).length, CHK);
  await click('[data-name="Popup/Page Settings"] [data-name="Field/Check All"] [data-name="Key Box"]');
  out.pop.allOn = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((c) => !c.classList.contains('off')).length, CHK);
  const PR = '[data-name="Popup/Page Settings"] [data-name="Table"] > [data-name="Body"] > [data-name^="Row/"]';
  const n0 = await visRows(PR);
  await click('[data-name="Popup/Page Settings"] [data-name="Field/Add"] [data-name="Key Box"]');
  out.pop.added = (await visRows(PR)) - n0;
  await click('[data-name="Popup/Page Settings"] [data-name="Field/Group Settings"] [data-name="Value Box"]');
  out.pop.tabSwapped = await page.evaluate(() => { const v = document.querySelector('[data-name="Popup/Page Settings"] [data-name="Field/Group Settings"] [data-name="Value Box"] > div'); return v && v.className; });
  const GR = '[data-name="Popup/Page Settings (Group Select)"] [data-name="Table"] > [data-name="Body"] > [data-name^="Row/"]';
  await click(GR, 2);
  out.pop.sel = await page.evaluate((s) => document.querySelectorAll(s + '.dc-sel').length, GR);
  await click('.dc-arrow-hit.up');
  out.pop.rightFilled = await page.evaluate(() => { const l = document.querySelector('[data-name="Popup/Page Settings (Group Select)"] [data-name="Content"] > [data-name="Content"]'); return [...l.children].filter((r) => r.querySelector('p')).map((r) => [...r.querySelectorAll('p')].map((p) => p.textContent).join('|')); });
  out.pop.count = await page.evaluate(() => { const ps = [...document.querySelectorAll('[data-name="Popup/Page Settings (Group Select)"] [data-name="Text Row"] p')]; return ps.map((p) => p.textContent).join(' '); });
  await click('[data-name="Popup/Page Settings (Group Select)"] .dc-dd');
  out.pop.pageMenu = await page.evaluate(() => { const m = document.querySelector('.dc-ddmenu.on'); return m ? [...m.querySelectorAll('button')].map((b) => b.textContent).join(',') : 'closed'; });
  await click('.dc-ddmenu.on button', 2);
  await page.screenshot({ path: GEN + 'it-waspopup.png' });

  /* ── 이벤트 — 장비 선택 셀렉트 · 입력 · 확인, 줄 → 상세, 닫기 · 다시 열기 ── */
  await open('event');
  const DR = '[data-name="Popup/Device Select"] [data-name="Body"] > [data-name^="Row/"]';
  out.ev = { listHidden: await page.evaluate(() => { const l = [...document.querySelectorAll('[data-name="Popup/Device Select"] [data-name="List"]')].find((x) => x.textContent.includes('최소중단')); return l && getComputedStyle(l).display; }) };
  await click('[data-name="Popup/Device Select"] .dc-dd', 0);
  await click('.dc-ddmenu.on button', 1);
  out.ev.maj = await visRows(DR);
  await click('[data-name="Popup/Device Select"] .dc-input');
  await page.keyboard.type('db', { delay: 40 }); await page.waitForTimeout(400);
  out.ev.majPlusName = await visRows(DR);
  await page.screenshot({ path: GEN + 'it-event-dev.png', clip: { x: 210, y: 200, width: 730, height: 470 } });
  await click('[data-name="Popup/Device Select"] [data-name="Field/OK"] [data-name="Key Box"]');
  await page.waitForTimeout(400);
  out.ev.devClosed = await page.evaluate(() => getComputedStyle(document.querySelector('[data-name="Popup/Device Select"] > [data-name="Background"]')).visibility);
  const ER = '[data-name="Body"] > [data-name^="Row/"]';
  const idx = await page.evaluate((s) => [...document.querySelectorAll(s)].findIndex((r) => !r.closest('[data-name^="Popup/"]') && r.children.length >= 10 && r.getBoundingClientRect().top > 720), ER);
  /* 팝업이 떠 있으면 뒤는 dim(모달) — 상세정보부터 닫고 줄을 누른다 */
  const vis = () => page.evaluate(() => getComputedStyle(document.querySelector('[data-name="Popup/Server Detail"] > [data-name="Background"]')).visibility);
  const dimOn = () => page.evaluate(() => document.querySelector('.dc-dim').classList.contains('on'));
  out.ev.dimWithDetail = await dimOn();
  await click('[data-name="Popup/Server Detail"] [data-name="Button/Close"]');
  await page.waitForTimeout(450);
  out.ev.detClosed = await vis();
  out.ev.dimAfterClose = await dimOn();
  await click(ER, idx);
  await page.waitForTimeout(500);
  out.ev.detReopen = await vis();
  out.ev.dimReopen = await dimOn();
  out.ev.detailTitle = await page.evaluate(() => document.querySelector('[data-name="Popup/Server Detail"] [data-name="Title"]').textContent);
  out.ev.detailDev = await page.evaluate(() => [...document.querySelectorAll('[data-name="Popup/Server Detail"] p')].slice(0, 6).map((p) => p.textContent).join('|'));
  await page.screenshot({ path: GEN + 'it-event-detail.png' });
  await page.mouse.click(960, 960);
  await page.waitForTimeout(450);
  out.ev.closedByDim = await vis();
  out.errs = errs.slice(0, 8);
  return out;
}
