/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 홈 → 템플릿 → '이 구성으로 스튜디오 열기' → 메뉴 이동 → 테마 → 색 → 패널편집. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[tc\]/.test(m.text()))) && !/favicon|ERR_|404|WebSocket|api\//.test(m.text())) errs.push(m.text().slice(0, 220)); });
  const out = {};
  await p.goto('http://localhost:5542/index.html#/templates/digital-twin-statcom-hmi');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-detail.png' });
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector('#dtStage .tcm-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2200);
  await p.screenshot({ path: GEN + 'studio-open.png' });
  out.margin = await p.evaluate(() => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const f = document.querySelector('.tcm-root > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)) };
  });
  /* 메뉴 → 전력설비 */
  const click = async (sel) => { const r = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel); if (r) await p.mouse.click(r[0], r[1]); return !!r; };
  const t1 = Date.now();
  out.navClick = await click('#dtStage [data-name="Nav Item/VSC Valve Room"]');
  await p.waitForSelector('#dtStage .tcv-root', { timeout: 6000 }).catch(() => { out.navFail = true; });
  out.navMs = Date.now() - t1;
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-valve.png' });
  /* 패널 접기 */
  const w0 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Side Menu"]').getBoundingClientRect().width);
  await click('#dtStage [data-name="Side Menu"] [data-name="Panel Toggle"]');
  await p.waitForTimeout(800);
  const w1 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Side Menu"]').getBoundingClientRect().width);
  await click('#dtStage [data-name="Side Menu"] [data-name="Panel Toggle"]');
  await p.waitForTimeout(800);
  const w2 = await p.evaluate(() => document.querySelector('#dtStage [data-name="Side Menu"]').getBoundingClientRect().width);
  out.fold = [w0, w1, w2].map(Math.round);
  /* 라이트 */
  out.light = await p.evaluate(() => { const b = document.querySelector('#mode button[data-m="light"]'); if (b) b.click(); return !!b; });
  await p.waitForTimeout(1800);
  await p.screenshot({ path: GEN + 'studio-light.png' });
  out.lightTheme = await p.evaluate(() => document.querySelector('#dtStage .tcv-root').dataset.theme);
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(800);
  /* 색 정하기 */
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#e0662b'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint.png' });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#00b9f0'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('.tcv-root p')]; return { cls: document.getElementById('dtStage').className.slice(0, 80), total: ps.length, editable: ps.filter((x) => x.isContentEditable).length, chartBtns: document.querySelectorAll('.tcv-root .tc-chartbtn').length, btnShown: getComputedStyle(document.querySelector('.tcv-root .tc-chartbtn')).display }; });
  /* 차트 바꾸기 */
  const btn = await p.evaluate(() => { const b = document.querySelector('[data-name="Widget/Submodule Status"] .tc-chartbtn').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(300);
  await p.screenshot({ path: GEN + 'studio-chartmenu.png' });
  const it = await p.evaluate(() => { const b = document.querySelector('[data-name="Widget/Submodule Status"] .tc-chartmenu button[data-i="0"]').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1500);
  out.chart = await p.evaluate(() => !!document.querySelector('[data-name="Widget/Submodule Status"] .tc-chart'));
  await p.screenshot({ path: GEN + 'studio-chart.png' });
  /* 위젯 옮기기 — 제목 말고 위젯 빈 곳을 잡는다 */
  const before = await p.evaluate(() => [...document.querySelector('.tcv-root [data-name="Side Panel"]').children].map((x) => x.getAttribute('data-name')));
  const g = await p.evaluate(() => { const b = document.querySelector('.tcv-root [data-name="Widget/Valve Room Environment"]').getBoundingClientRect(); return [b.right - 6, b.top + 8]; });
  await p.mouse.move(g[0], g[1]); await p.mouse.down(); await p.mouse.move(g[0], g[1] + 60, { steps: 4 }); await p.mouse.move(g[0], g[1] + 420, { steps: 12 }); await p.waitForTimeout(250);
  await p.screenshot({ path: GEN + 'studio-drag.png' });
  await p.mouse.up(); await p.waitForTimeout(600);
  const after = await p.evaluate(() => [...document.querySelector('.tcv-root [data-name="Side Panel"]').children].map((x) => x.getAttribute('data-name')));
  out.move = { before, after };
  await p.screenshot({ path: GEN + 'studio-moved.png' });
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  /* 새로고침해도 그 장면 */
  await p.reload(); await p.waitForTimeout(2500);
  out.afterReload = await p.evaluate(() => !!document.querySelector('#dtStage .tcv-root'));
  out.logo = await p.evaluate(() => { const i = document.querySelector('.tcv-root .tpl-studio-logo'); const b = i && i.getBoundingClientRect(); return b ? [Math.round(b.width), Math.round(b.height)] : null; });
  out.errs = errs.slice(0, 12);
  await ctx.close();
  return out;
}
