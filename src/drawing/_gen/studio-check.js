/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 템플릿 → '이 구성으로 스튜디오 열기' → 메뉴 이동 → 접기 · 호버
   → 다크 · 라이트 · 색 → 패널편집(글자 · 차트 · 옮기기) → 새로고침. 검증 서버: node serve.js 5544 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/drawing/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[dg\]/.test(m.text()))) && !/favicon|ERR_|404|WebSocket|api\/|recent-time/.test(m.text())) errs.push(m.text().slice(0, 220)); });
  const out = {};
  const center = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const click = async (sel) => { const r = await center(sel); if (!r) return false; await p.mouse.click(r[0], r[1]); return true; };
  const waitRoot = async (px, key) => { const t = Date.now(); await p.waitForSelector('#dtStage .' + px + '-root', { timeout: 8000 }).catch(() => { out[key + 'Fail'] = true; }); out[key + 'Ms'] = Date.now() - t; };
  await p.goto('http://localhost:5544/index.html#/templates/dashboard-smart-drawing-management');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-detail.png' });
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector('#dtStage .dwm-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2400);
  await p.screenshot({ path: GEN + 'studio-open.png' });
  out.margin = await p.evaluate(() => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const f = document.querySelector('.dwm-root > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)), theme: document.querySelector('.dwm-root').dataset.theme };
  });
  out.scenes = await p.evaluate(() => { try { return WEMB.projects.loadProjects().filter((x) => x.tpl === 'drawing').map((x) => x.tplScene || x.name); } catch (e) { return String(e); } });
  out.postDate = await p.evaluate(() => [...document.querySelectorAll('.dwm-root [data-name="List Item/Post"] p')].slice(1, 2).map((x) => x.textContent).join());
  /* 호버 — 메뉴 */
  const n = await center('#dtStage [data-name="Nav Item/CCTV"]');
  await p.mouse.move(n[0], n[1]); await p.waitForTimeout(350);
  out.hover = await p.evaluate(() => getComputedStyle(document.querySelector('#dtStage [data-name="Nav Item/CCTV"]')).backgroundColor);
  await p.mouse.move(5, 5);
  /* 메뉴 이동 */
  await click('#dtStage [data-name="Nav Item/Drawing"]'); await waitRoot('dwa', 'search'); await p.waitForTimeout(1200);
  await p.screenshot({ path: GEN + 'studio-search.png' });
  /* 트리 접기 */
  const trees = '#dtStage [data-name="Items"] > [data-name="Tree Item"]';
  const count = () => p.evaluate((s) => [...document.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().height > 2).length, trees);
  const tr0 = await count();
  await click(trees); await p.waitForTimeout(500);
  const tr1 = await count();
  await click(trees); await p.waitForTimeout(500);
  out.tree = [tr0, tr1, await count()];
  /* 상세검색 펼치기 → 접기 */
  await click('#dtStage [data-name="Button/Advanced Search"]'); await waitRoot('dwb', 'detail'); await p.waitForTimeout(1200);
  await p.screenshot({ path: GEN + 'studio-detail-open.png' });
  const h0 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Advanced Filters"]')?.getBoundingClientRect().height);
  await click('#dtStage [data-name="Button/Advanced Search"]'); await p.waitForTimeout(700);
  const h1 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Advanced Filters"]')?.getBoundingClientRect().height);
  await p.screenshot({ path: GEN + 'studio-detail-folded.png' });
  out.fold = [h0, h1].map(Math.round);
  await click('#dtStage [data-name="Nav Item/CCTV"]'); await waitRoot('dwc', 'cctv'); await p.waitForTimeout(1200);
  const c0 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Viewer"] p')?.textContent);
  await p.waitForTimeout(2100);
  const c1 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Viewer"] p')?.textContent);
  out.clock = [c0, c1];
  await click('#dtStage [data-name="Nav Item/Community"]'); await waitRoot('dwk', 'desk'); await p.waitForTimeout(1200);
  await p.screenshot({ path: GEN + 'studio-desk.png' });
  /* 다크 */
  await click('#dtStage [data-name="Nav Item/MY"]'); await waitRoot('dwm', 'home'); await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(2500);
  out.darkTheme = await p.evaluate(() => document.querySelector('#dtStage .dwm-root').dataset.theme);
  await p.screenshot({ path: GEN + 'studio-dark-main.png' });
  await click('#dtStage [data-name="Nav Item/Drawing"]'); await waitRoot('dwa', 'darkSearch'); await p.waitForTimeout(1800);
  out.darkCarry = await p.evaluate(() => document.querySelector('#dtStage .dwa-root').dataset.theme);
  await p.screenshot({ path: GEN + 'studio-dark-search.png' });
  /* 색 정하기 */
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0f8f7a'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint-dark.png' });
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint-light.png' });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#3967fd'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  await click('#dtStage [data-name="Nav Item/MY"]'); await waitRoot('dwm', 'back'); await p.waitForTimeout(1400);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('.dwm-root p')]; return { total: ps.length, editable: ps.filter((x) => x.isContentEditable).length }; });
  const tgt = '#dtStage [data-name="Widget/Notice"]';
  const btn = await center(tgt + ' .dg-chartbtn');
  if (btn) {
    await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(300);
    await p.screenshot({ path: GEN + 'studio-chartmenu.png' });
    const it = await center(tgt + ' .dg-chartmenu button[data-i="1"]');
    await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1600);
    out.chart = await p.evaluate((t) => !!document.querySelector(t + ' .dg-chart'), tgt);
    await p.screenshot({ path: GEN + 'studio-chart.png' });
  } else out.chart = 'no button';
  /* 공지 ↔ Help Desk 맞바꾸기 */
  const lefts = () => p.evaluate(() => ['Widget/Notice', 'Widget/Help Desk'].map((n) => Math.round(document.querySelector('.dwm-root [data-name="' + n + '"]').getBoundingClientRect().left)));
  const before = await lefts();
  const a = await p.evaluate(() => { const b = document.querySelector('.dwm-root [data-name="Widget/Notice"]').getBoundingClientRect(); return [b.left + 8, b.top + 8]; });
  const b2 = await center('.dwm-root [data-name="Widget/Help Desk"]');
  await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(a[0] + 40, a[1], { steps: 4 }); await p.mouse.move(b2[0], b2[1], { steps: 14 }); await p.waitForTimeout(250);
  await p.mouse.up(); await p.waitForTimeout(900);
  out.move = { before, after: await lefts() };
  await p.screenshot({ path: GEN + 'studio-moved.png' });
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(3000);
  out.afterReload = await p.evaluate(() => !!document.querySelector('#dtStage .dwm-root'));
  out.reloadOrder = await p.evaluate(() => ['Widget/Notice', 'Widget/Help Desk'].map((n) => { const e = document.querySelector('.dwm-root [data-name="' + n + '"]'); return e && Math.round(e.getBoundingClientRect().left); }));
  out.errs = errs.slice(0, 12);
  await ctx.close();
  return out;
}
