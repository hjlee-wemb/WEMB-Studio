/* 선택 · 옵션 · 탭 · 검색 · 칩 · 접기 — 진짜 마우스 클릭으로 눌러 본다(가운데 점이 다른 판에 막히면 실패로 드러난다). 실행: node pw.js ctl-test.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const out = {};
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (/\[pd\]/.test(m.text()) || m.type() === 'error' && !/404|favicon/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const go = async (sc) => { await page.setViewportSize({ width: 1600, height: 900 }); await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=light&r=' + Date.now()); await page.waitForTimeout(1500); };
  /* 보이는 것 중 첫째의 가운데를 누른다 */
  const click = async (sel, idx) => {
    const r = await page.evaluate(([s, i]) => {
      const els = [...document.querySelectorAll(s)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && e.offsetParent !== null; });
      const e = els[i || 0]; if (!e) return null;
      const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
      const t = document.elementFromPoint(x, y);
      return [x, y, t === e || e.contains(t), t && (t.closest('[data-name]') || t).dataset.name];
    }, [sel, idx]);
    if (!r) return 'missing ' + sel;
    await page.mouse.click(r[0], r[1]);
    await page.waitForTimeout(450);
    return r[2] ? 'ok' : 'covered by ' + r[3];
  };
  const curNav = () => page.evaluate(() => { const fp = document.querySelector('[data-name="Filter Panel"]'); const w = [...fp.querySelectorAll(':scope > .pd-navfrag')].find((x) => x.style.display !== 'none'); return w ? w.getAttribute('data-name') : 'orig'; });

  await go('main');
  const r = {};
  r.sensorTab = [await click('[data-name="Filter Panel"] [data-name="btn-tab_sencer"]'), await curNav()];
  r.fireIcon = [await click('[data-name="Filter Panel"] .pd-navfrag:not([style*="none"]) .pd-iconset > [data-name="fire"]'), await curNav()];
  await page.screenshot({ path: GEN + 'ctl-fire.png', clip: { x: 0, y: 40, width: 420, height: 860 } });
  r.cctvIcon = [await click('[data-name="Filter Panel"] .pd-navfrag:not([style*="none"]) .pd-iconset > [data-name="CCTV"]'), await curNav()];
  r.sensorPick = await click('[data-name="Filter Panel"] .pd-navfrag:not([style*="none"]) [data-name="block3"]', 2);
  r.sensorSel = await page.evaluate(() => document.querySelectorAll('.pd-navfrag [data-name="block3"].pd-sel').length);
  r.buildingTab = [await click('[data-name="Filter Panel"] .pd-navfrag:not([style*="none"]) [data-name="btn-tab_building"]'), await curNav()];
  r.groupFold = await click('[data-name="Filter Panel"] .pd-navfrag:not([style*="none"]) [data-name="block1"]', 0);
  r.groupHidden = await page.evaluate(() => { const h = [...document.querySelectorAll('.pd-navfrag [data-name="block1"]')].find((x) => x.offsetParent); return h && h.nextElementSibling ? getComputedStyle(h.nextElementSibling).display : 'none?'; });
  await page.screenshot({ path: GEN + 'ctl-building.png', clip: { x: 0, y: 40, width: 420, height: 860 } });
  r.search = await click('[data-name="Filter Panel"] .pd-navfrag:not([style*="none"]) [data-name="search"]');
  await page.keyboard.type('보일러');
  await page.waitForTimeout(300);
  r.searchShown = await page.evaluate(() => [...document.querySelectorAll('.pd-navfrag [data-name="block2"]')].filter((b) => b.offsetParent && getComputedStyle(b).display !== 'none').map((b) => b.textContent.trim()));
  await page.screenshot({ path: GEN + 'ctl-search.png', clip: { x: 0, y: 40, width: 420, height: 860 } });
  await page.keyboard.press('Escape');
  r.layerTab = [await click('[data-name="Filter Panel"] .pd-navfrag:not([style*="none"]) [data-name="btn-tab_layer"]'), await curNav()];
  r.row = await click('[data-name="Filter Panel"] [data-name="row"]', 1);
  r.rowChk = await page.evaluate(() => document.querySelectorAll('[data-name="Filter Panel"] [data-name="row"].pd-chk').length);
  r.allChk = await click('[data-name="Filter Panel"] [data-name="btn-all check"]');
  r.allChkN = await page.evaluate(() => document.querySelectorAll('[data-name="Filter Panel"] > :not(.pd-navfrag) [data-name="row"].pd-chk, [data-name="Filter Panel"] [data-name="row"].pd-chk').length);
  r.byBuilding = await page.evaluate(() => { const p = [...document.querySelectorAll('[data-name="Filter Panel"] p')].find((x) => x.textContent.trim() === '건물별' && x.offsetParent); if (!p) return null; const b = p.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  if (r.byBuilding) await page.mouse.click(r.byBuilding[0], r.byBuilding[1]); await page.waitForTimeout(450);
  r.layer2 = await curNav();
  await page.screenshot({ path: GEN + 'ctl-layer2.png', clip: { x: 0, y: 40, width: 420, height: 860 } });
  r.railFire = [await click('[data-name="Category/Fire"]'), await curNav()];
  r.sideCollapse = await click('[data-name="Side Panel"] [data-name="Button/Collapse"]');
  await page.waitForTimeout(500);
  r.sideShut = await page.evaluate(() => { const s = document.querySelector('[data-name="Side Panel"]'); return [s.classList.contains('pd-spshut'), s.style.translate]; });
  await page.screenshot({ path: GEN + 'ctl-side.png' });
  await click('[data-name="Side Panel"] [data-name="Button/Collapse"]');
  r.railSop = await click('[data-name="Button/SOP Status"]');
  await page.waitForTimeout(800);
  r.afterRailSop = page.url().split('/').pop().split('?')[0];
  out.main = r;

  await go('weather');
  const w = {};
  w.opt6 = await click('[data-name="Period Options"] [data-name="Option/6H"]');
  w.opt6white = await page.evaluate(() => getComputedStyle(document.querySelector('[data-name="Option/6H"] p')).color);
  w.opt12 = await page.evaluate(() => getComputedStyle(document.querySelector('[data-name="Option/12H"] p')).color);
  w.dates = await page.evaluate(() => ['Field/Start Date', 'Field/End Date'].map((n) => document.querySelector('[data-name="' + n + '"]').textContent.replace(/\s+/g, ' ').trim()));
  w.legend = await click('[data-name="Widget/Wind Direction Analysis"] [data-name^="Item/"]', 1);
  await page.screenshot({ path: GEN + 'ctl-weather.png', clip: { x: 300, y: 150, width: 1000, height: 160 } });
  out.weather = w;

  await go('event');
  const e = {};
  e.chipCR = await click('[data-name="Event Log"] .pd-click', 0);
  e.chips = await page.evaluate(() => [...document.querySelectorAll('[data-name="Event Log"] p')].filter((p) => /^(All|CR|MA|MI|WA|NO)$/.test(p.textContent.trim())).map((p) => p.textContent.trim() + (p.parentElement.classList.contains('pd-click') ? '*' : '')));
  await page.goto('http://localhost:5570/src/plantdp/event.html?t=light&r=' + Date.now()); await page.waitForTimeout(1500);
  await page.evaluate(() => { const p = [...document.querySelectorAll('[data-name="Event Log"] p')].find((x) => x.textContent.trim() === 'CR' && x.offsetParent); (getComputedStyle(p.parentElement).display === 'contents' ? p.parentElement.firstElementChild : p.parentElement).setAttribute('data-t', 'cr'); });
  e.crClick = await click('[data-t="cr"]');
  e.visibleRows = await page.evaluate(() => [...document.querySelectorAll('[data-name="Event Log"] [data-name^="Row/"], [data-name="Event Log"] [data-name="grid-row"]')].filter((r) => getComputedStyle(r).display !== 'none' && r.offsetParent).length);
  await page.screenshot({ path: GEN + 'ctl-event.png', clip: { x: 0, y: 600, width: 1600, height: 300 } });
  out.event = e;

  await go('sop');
  const s = {};
  s.select = await click('[data-name="Side Panel/SOP List"] [data-name="Select"]');
  await page.screenshot({ path: GEN + 'ctl-sopsel.png', clip: { x: 0, y: 40, width: 480, height: 500 } });
  s.pick = await click('.pd-selmenu.open button', 2);
  s.items = await page.evaluate(() => [...document.querySelectorAll('[data-name="Side Panel/SOP List"] [data-name^="Item/"]')].filter((x) => /^Item\/\d+$/.test(x.dataset.name) && getComputedStyle(x).display !== 'none').map((x) => x.dataset.name));
  s.label = await page.evaluate(() => document.querySelector('[data-name="Side Panel/SOP List"] [data-name="Select"] [data-name="Label"]').textContent);
  out.sop = s;

  await go('login');
  const l = {};
  l.id = await click('[data-name="Field/ID"] [data-name="Input"]');
  await page.keyboard.press('Control+A'); await page.keyboard.type('operator01');
  l.pw = await click('[data-name="Field/Password"] [data-name="Input"]');
  await page.keyboard.type('secret');
  l.rem = await click('[data-name="Checkbox/Remember ID"]');
  await page.screenshot({ path: GEN + 'ctl-login.png' });
  await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  l.after = page.url().split('/').pop().split('?')[0];
  out.login = l;
  out.errs = errs.slice(0, 10);
  return out;
}
