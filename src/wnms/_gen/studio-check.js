/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 템플릿 → '이 구성으로 스튜디오 열기' → GNB 이동 → 접기 · 호버
   → 다크 · 라이트 · 색 → 패널편집(글자 · 차트 · 옮기기) → 새로고침. 검증 서버: node serve.js 5544 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/wnms/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[wn\]/.test(m.text()))) && !/favicon|ERR_|404|WebSocket|api\/|recent-time/.test(m.text())) errs.push(m.text().slice(0, 220)); });
  const out = {};
  const center = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const click = async (sel) => { const r = await center(sel); if (!r) return false; await p.mouse.click(r[0], r[1]); return true; };
  await p.goto('http://localhost:5544/index.html#/templates/dashboard-wireless-network-management');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-detail.png' });
  out.hanbit = await p.evaluate(() => (window.TEMPLATES || []).some((t) => /Hanbit/.test(t.title)) || /Hanbit/.test(document.body.innerText));
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector('#dtStage .wnm-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2400);
  await p.screenshot({ path: GEN + 'studio-open.png' });
  out.margin = await p.evaluate(() => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const f = document.querySelector('.wnm-root > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)), theme: document.querySelector('.wnm-root').dataset.theme };
  });
  out.scenes = await p.evaluate(() => { try { return WEMB.projects.loadProjects().filter((x) => x.tpl === 'wnms').map((x) => x.tplScene || x.name); } catch (e) { return String(e); } });
  out.clock = await p.evaluate(() => [document.querySelector('.wnm-root [data-name="Date"]').textContent, document.querySelector('.wnm-root [data-name="Time"]').textContent]);
  out.ev1 = await p.evaluate(() => [...document.querySelectorAll('.wnm-root [data-name="Widget/Event Status"] [data-name="Row/1"] p')].map((x) => x.textContent).join(' | '));
  /* 호버 — 장비 타일 */
  const tile = await center('#dtStage [data-name="Item/Switch"]');
  await p.mouse.move(tile[0], tile[1]); await p.waitForTimeout(450);
  out.hoverTile = await p.evaluate(() => getComputedStyle(document.querySelector('#dtStage [data-name="Item/Switch"]')).translate);
  await p.screenshot({ path: GEN + 'studio-hover.png' });
  await p.mouse.move(5, 5);
  /* 이벤트 접기 */
  const h0 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Widget/Event Status"]').getBoundingClientRect().height);
  await click('#dtStage .wn-fold'); await p.waitForTimeout(700);
  const h1 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Widget/Event Status"]').getBoundingClientRect().height);
  await p.screenshot({ path: GEN + 'studio-fold.png' });
  await click('#dtStage .wn-fold'); await p.waitForTimeout(700);
  out.fold = [h0, h1].map(Math.round);
  /* GNB — 메뉴 열기 → 펼치기 → NMS 설비 계통도 → 메인 */
  let t1 = Date.now();
  out.menu = await click('#dtStage [data-name^="GNB"] [data-name="Toolbar"] [data-name^="Icon"]');
  await p.waitForSelector('#dtStage .wno-root', { timeout: 6000 }).catch(() => { out.openFail = true; });
  out.menuMs = Date.now() - t1;
  await p.waitForTimeout(900);
  t1 = Date.now();
  await click('#dtStage [data-name^="Nav Header"]');
  await p.waitForSelector('#dtStage .wnx-root', { timeout: 6000 }).catch(() => { out.expandFail = true; });
  out.expandMs = Date.now() - t1;
  await p.waitForTimeout(900);
  await p.screenshot({ path: GEN + 'studio-expanded.png' });
  /* 메뉴 묶음 접기 */
  const g0 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Nav Group/Configuration"] [data-name="Nav Items"]').getBoundingClientRect().height);
  await click('#dtStage [data-name="Nav Group/Configuration"] [data-name^="Nav Header"]'); await p.waitForTimeout(600);
  const g1 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Nav Group/Configuration"] [data-name="Nav Items"]').getBoundingClientRect().height);
  out.groupFold = [g0, g1].map(Math.round);
  t1 = Date.now();
  await click('#dtStage [data-name="Nav Item/NMS Equipment Diagram"]');
  await p.waitForSelector('#dtStage .wne-root', { timeout: 6000 }).catch(() => { out.navFail = true; });
  out.navMs = Date.now() - t1;
  await p.waitForTimeout(1600);
  await p.screenshot({ path: GEN + 'studio-equipment.png' });
  /* 다크 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(2500);
  out.darkTheme = await p.evaluate(() => document.querySelector('#dtStage .wne-root').dataset.theme);
  await p.screenshot({ path: GEN + 'studio-dark-equipment.png' });
  await click('#dtStage [data-name="Nav Item/Wireless Management System"]');
  await p.waitForSelector('#dtStage .wnm-root', { timeout: 6000 }).catch(() => { out.backFail = true; });
  await p.waitForTimeout(1800);
  out.darkCarry = await p.evaluate(() => document.querySelector('#dtStage .wnm-root').dataset.theme);
  await p.screenshot({ path: GEN + 'studio-dark-main.png' });
  /* 색 정하기 */
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0f8f7a'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint-dark.png' });
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint-light.png' });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0c4da1'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('.wnm-root p')]; return { total: ps.length, editable: ps.filter((x) => x.isContentEditable).length }; });
  const tgt = '#dtStage [data-name="Widget/Server List"]';
  const btn = await center(tgt + ' .wn-chartbtn');
  if (btn) {
    await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(300);
    await p.screenshot({ path: GEN + 'studio-chartmenu.png' });
    const it = await center(tgt + ' .wn-chartmenu button[data-i="1"]');
    await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1600);
    out.chart = await p.evaluate((t) => !!document.querySelector(t + ' .wn-chart'), tgt);
    await p.screenshot({ path: GEN + 'studio-chart.png' });
  } else out.chart = 'no button';
  /* 서버리스트 ↔ 단말기 맞바꾸기 */
  const before = await p.evaluate(() => ['Widget/Server List', 'Widget/Terminal'].map((n) => Math.round(document.querySelector('.wnm-root [data-name="' + n + '"]').getBoundingClientRect().left)));
  /* 편집 중에는 글자가 편집 칸이라 끌기는 패널 테두리 안쪽 여백을 잡는다 */
  const a = await p.evaluate(() => { const b = document.querySelector('.wnm-root [data-name="Widget/Server List"]').getBoundingClientRect(); return [b.left + 8, b.top + 8]; });
  const b2 = await center('.wnm-root [data-name="Widget/Terminal"]');
  await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(a[0] + 40, a[1], { steps: 4 }); await p.mouse.move(b2[0], b2[1], { steps: 14 }); await p.waitForTimeout(250);
  await p.screenshot({ path: GEN + 'studio-drag.png' });
  await p.mouse.up(); await p.waitForTimeout(900);
  const after = await p.evaluate(() => ['Widget/Server List', 'Widget/Terminal'].map((n) => Math.round(document.querySelector('.wnm-root [data-name="' + n + '"]').getBoundingClientRect().left)));
  out.move = { before, after };
  await p.screenshot({ path: GEN + 'studio-moved.png' });
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(3000);
  out.afterReload = await p.evaluate(() => !!document.querySelector('#dtStage .wnm-root'));
  out.reloadOrder = await p.evaluate(() => ['Widget/Server List', 'Widget/Terminal'].map((n) => { const e = document.querySelector('.wnm-root [data-name="' + n + '"]'); return e && Math.round(e.getBoundingClientRect().left); }));
  out.errs = errs.slice(0, 12);
  await ctx.close();
  return out;
}
