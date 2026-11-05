/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 템플릿 → '이 구성으로 스튜디오 열기' → 탭 · 메뉴 이동 → 호버 → 라이트 · 색 → 패널편집(글자 · 차트 · 옮기기) → 새로고침 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[nb\]/.test(m.text()))) && !/favicon|ERR_|404|WebSocket|api\//.test(m.text())) errs.push(m.text().slice(0, 220)); });
  const out = {};
  const click = async (sel) => { const r = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel); if (!r) return false; await p.mouse.click(r[0], r[1]); return true; };
  await p.goto('http://localhost:5543/index.html#/templates/dashboard-new-business-management');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-detail.png' });
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector('#dtStage .nbw-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2200);
  await p.screenshot({ path: GEN + 'studio-open.png' });
  out.margin = await p.evaluate(() => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const f = document.querySelector('.nbw-root > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)) };
  });
  out.scenes = await p.evaluate(() => { try { const P = WEMB.projects; return P.loadProjects().filter((x) => x.tpl === 'newbiz').map((x) => x.tplScene || x.name); } catch (e) { return String(e); } });
  /* 탭 → 태양광 */
  let t1 = Date.now();
  await p.evaluate(() => {}); out.tab = await click('#dtStage [data-name="Tabs"] > :nth-child(2)');
  await p.waitForSelector('#dtStage .nbs-root', { timeout: 6000 }).catch(() => { out.tabFail = true; });
  out.tabMs = Date.now() - t1;
  await p.waitForTimeout(1200);
  /* 메뉴 → 해외사업 */
  t1 = Date.now();
  const nav = await p.evaluate(() => { const e = [...document.querySelectorAll('#dtStage [data-name="Nav Group"] > p')].find((x) => x.textContent.trim() === '해외사업'); const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await p.mouse.click(nav[0], nav[1]);
  await p.waitForSelector('#dtStage .nbo-root', { timeout: 6000 }).catch(() => { out.navFail = true; });
  out.navMs = Date.now() - t1;
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-overseas.png' });
  /* 2040 접기 */
  const h0 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Widget/2040 Target"]').getBoundingClientRect().height);
  await click('#dtStage [data-name="Widget/2040 Target"] > [data-name="Title"]');
  await p.waitForTimeout(700);
  const h1 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Widget/2040 Target"]').getBoundingClientRect().height);
  await click('#dtStage [data-name="Widget/2040 Target"] > [data-name="Title"]');
  await p.waitForTimeout(700);
  out.fold = [h0, h1].map(Math.round);
  /* 다시 재생에너지 — 편집 단추 호버 */
  const nav2 = await p.evaluate(() => { const e = [...document.querySelectorAll('#dtStage [data-name="Nav Group"] > p')].find((x) => x.textContent.trim() === '재생에너지사업'); const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await p.mouse.click(nav2[0], nav2[1]);
  await p.waitForSelector('#dtStage .nbw-root', { timeout: 6000 }).catch(() => { out.nav2Fail = true; });
  await p.waitForTimeout(1500);
  const eb = await p.evaluate(() => { const b = document.querySelector('#dtStage [data-name="Row/Wando Geumil"] [data-name="Button/Delete"]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await p.mouse.move(eb[0], eb[1]);
  await p.waitForTimeout(400);
  out.hover = await p.evaluate(() => { const h = document.querySelector('#dtStage [data-name="Button/Delete (Hover)"]'); const a = document.querySelector('#dtStage [data-name="Row/Wando Geumil"] [data-name="Button/Delete"]').getBoundingClientRect(), b = h.getBoundingClientRect(); return { on: h.classList.contains('nb-on'), tip: (h.querySelector('p') || {}).textContent, dx: Math.round(b.left - a.left), dy: Math.round(b.top - a.top) }; });
  await p.screenshot({ path: GEN + 'studio-hover.png' });
  await p.mouse.move(5, 5);
  /* 라이트 · 색 정하기 */
  out.light = await p.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); if (b) b.click(); return !!b; });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: GEN + 'studio-light.png' });
  out.lightTheme = await p.evaluate(() => document.querySelector('#dtStage .nbw-root').dataset.theme);
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#e0662b'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint-light.png' });
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint.png' });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#7fd3fa'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('.nbw-root p')]; return { total: ps.length, editable: ps.filter((x) => x.isContentEditable).length }; });
  const tgt = '[data-name="Widget/Project Status"]';
  const btn = await p.evaluate((t) => { const b = document.querySelector(t + ' .nb-chartbtn').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, tgt);
  await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(300);
  await p.screenshot({ path: GEN + 'studio-chartmenu.png' });
  const it = await p.evaluate((t) => { const b = document.querySelector(t + ' .nb-chartmenu button[data-i="0"]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, tgt);
  await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1500);
  out.chart = await p.evaluate((t) => !!document.querySelector(t + ' .nb-chart'), tgt);
  await p.screenshot({ path: GEN + 'studio-chart.png' });
  /* 지도 ↔ 표 맞바꾸기 */
  const before = await p.evaluate(() => [document.querySelector('.nbw-root [data-name="Widget/Project Map"]').offsetLeft, document.querySelector('.nbw-root [data-name="Widget/Project Status"]').offsetLeft]);
  const g = await p.evaluate(() => { const b = document.querySelector('.nbw-root [data-name="Widget/Project Map"]').getBoundingClientRect(); return [b.left + 8, b.top + 8]; });
  await p.mouse.move(g[0], g[1]); await p.mouse.down(); await p.mouse.move(g[0] + 60, g[1], { steps: 4 }); await p.mouse.move(g[0] + 760, g[1], { steps: 12 }); await p.waitForTimeout(250);
  await p.screenshot({ path: GEN + 'studio-drag.png' });
  await p.mouse.up(); await p.waitForTimeout(800);
  const after = await p.evaluate(() => [document.querySelector('.nbw-root [data-name="Widget/Project Map"]').offsetLeft, document.querySelector('.nbw-root [data-name="Widget/Project Status"]').offsetLeft]);
  out.move = { before, after };
  await p.screenshot({ path: GEN + 'studio-moved.png' });
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(2800);
  out.afterReload = await p.evaluate(() => !!document.querySelector('#dtStage .nbw-root'));
  out.logo = await p.evaluate(() => { const i = document.querySelector('.nbw-root .tpl-studio-logo'); const b = i && i.getBoundingClientRect(); return b ? [Math.round(b.width), Math.round(b.height)] : null; });
  out.time = await p.evaluate(() => { const c = document.querySelector('.nbw-root [data-name="Timestamp"] [data-name="Content"]'); return c && c.textContent; });
  out.errs = errs.slice(0, 12);
  await ctx.close();
  return out;
}
