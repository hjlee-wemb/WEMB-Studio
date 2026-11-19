/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 템플릿 → '이 구성으로 스튜디오 열기' → 여백
   → 왼쪽 판 접기 · 호버 → 헤더 '계통도'(진짜 클릭) → 닫기 → 이벤트 로그 펼침 · 칩 → 3D 라벨 → 장비 상세
   → 다크 · 색 정하기 → 패널편집(글자 · 차트 · 옮기기) → 새로고침 → 배치 초기화.
   검증 서버: node serve.js 5580 · 실행: node pw.js studio-check.js  (SW · SH 로 창 크기) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/fems/_gen/';
  const W = +(process.env.SW || 1920), H = +(process.env.SH || 1080);
  const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[fe\]/.test(m.text()))) && !/favicon|ERR_|WebSocket|api\/|recent-time/.test(m.text())) errs.push(m.text().slice(0, 220)); });
  p.on('response', (r) => { if (r.status() >= 400 && !/favicon|api\//.test(r.url())) errs.push(r.status() + ' ' + r.url().slice(-80)); });
  const out = {};
  const R = '#dtStage .fmm-root';
  const shot = (n) => p.screenshot({ path: GEN + 'studio-' + n + '.png' });
  const center = (sel) => p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width > 0); if (!e) return null; const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const t = document.elementFromPoint(x, y); return [x, y, !!t && (t === e || e.contains(t))]; }, sel);
  const click = async (sel) => { const r = await center(sel); if (!r) return 'missing'; await p.mouse.click(r[0], r[1]); return r[2] ? 'ok' : 'blocked'; };
  const margin = () => p.evaluate((R) => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const r = document.querySelector(R);
    if (!r) return 'no root';
    const f = r.querySelector(':scope > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)), theme: r.dataset.theme };
  }, R);
  const waitSel = async (sel, key) => { const t = Date.now(); await p.waitForSelector(sel, { timeout: 8000 }).catch(() => { out[key + 'Fail'] = true; }); out[key + 'Ms'] = Date.now() - t; await p.waitForTimeout(1500); };
  await p.goto('http://localhost:5580/index.html#/templates/digital-twin-smart-factory-energy-management');
  await p.waitForTimeout(1800);
  await shot('gallery');
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector(R, { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2600);
  await shot('open');
  out.margin = await margin();
  const clk = () => p.evaluate((R) => { const c = document.querySelector(R + ' .fe-clock'); return c && c.textContent; }, R);
  out.clock = await clk(); await p.waitForTimeout(2100); out.clock2 = await clk();
  out.scenes = await p.evaluate(() => { try { return WEMB.projects.loadProjects().filter((x) => x.tpl === 'fems').map((x) => x.tplScene || x.name); } catch (e) { return String(e); } });
  /* 왼쪽 판 접기 */
  const lpos = () => p.evaluate((R) => { const e = document.querySelector(R + ' [data-name="Side Panel (Left)"]'); return e ? Math.round(e.getBoundingClientRect().left) + '/' + e.className.replace(/.*?(fe-shut)?$/, '$1') : null; }, R);
  out.lfold0 = await lpos();
  out.lfoldHit = await click(R + ' [data-name="Side Panel (Left)"] [data-name="Button/Collapse"]'); await p.waitForTimeout(900);
  out.lfold1 = await lpos();
  await shot('leftfold');
  await click(R + ' [data-name="Side Panel (Left)"] [data-name="Button/Collapse"]'); await p.waitForTimeout(900);
  out.lfold2 = await lpos();
  /* 호버 — 헤더 계통도 단추 */
  const nb = await center(R + ' [data-name="Button/System Diagram"]');
  await p.mouse.move(nb[0], nb[1]); await p.waitForTimeout(450);
  out.hover = await p.evaluate((R) => { const e = document.querySelector(R + ' [data-name="Button/System Diagram"]'); const c = getComputedStyle(e); return [c.translate, c.filter.slice(0, 50)].join(' / '); }, R);
  await shot('hover');
  /* 헤더 → 계통도 */
  out.navDiag = await click(R + ' [data-name="Button/System Diagram"]');
  await waitSel(R + ' .fmd-root', 'diagram');
  out.diagMargin = await margin();
  out.diagDim = await p.evaluate((R) => { const d = document.querySelector(R + ' .sh-dim'); return d && getComputedStyle(d).backgroundColor; }, R);
  await shot('diagram');
  out.closeDiag = await click(R + ' .sh-popmount [data-name="Button/Close"]');
  await waitSel(R + ':not(:has(.sh-popmount))', 'back');
  /* 이벤트 로그 펼침 · 칩 */
  out.expand = await click(R + ' [data-name="Bar (Collapsed)"] [data-name="Button/Expand"]'); await p.waitForTimeout(1100);
  out.evx = await p.evaluate((R) => { const x = document.querySelector(R + ' .fe-evx'); if (!x) return null; const b = x.getBoundingClientRect(); return { off: x.classList.contains('fe-off'), top: Math.round(b.top), h: Math.round(b.height), d: x.querySelector('[data-name="Row/1"] p') && x.querySelector('[data-name="Row/1"] p').textContent }; }, R);
  out.chip = await click(R + ' .fe-evx [data-name="Count/Critical"]'); await p.waitForTimeout(700);
  out.dimmed = await p.evaluate((R) => [...document.querySelectorAll(R + ' .fe-evx .fe-dim')].length, R);
  await shot('eventlog');
  out.collapse = await click(R + ' .fe-evx [data-name="Button/Collapse"]'); await p.waitForTimeout(900);
  /* 3D 라벨 → 장비 상세 */
  out.label = await click(R + ' [data-name="Label/본관 104"]');
  await waitSel(R + ' .fmq-root', 'equipment');
  await shot('equipment');
  /* 다크 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(2200);
  out.darkTheme = await p.evaluate((R) => [document.querySelector(R).dataset.theme, (document.querySelector(R + ' .fmq-root') || {}).dataset && document.querySelector(R + ' .fmq-root').dataset.theme], R);
  await shot('dark-equipment');
  out.closeEq = await click(R + ' .sh-popmount [data-name="Button/Close"]');
  await waitSel(R + ':not(:has(.sh-popmount))', 'back2');
  await shot('dark-main');
  /* 색 정하기 */
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0f8f7a'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(2500);
  await shot('tint-dark');
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(2500);
  await shot('tint-light');
  out.tintBar = await p.evaluate((R) => { const e = document.querySelector(R + ' [data-name="Event Log"] [data-name="Divider"]'); return e && getComputedStyle(e).backgroundColor; }, R);
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#009dff'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(900);
  out.edit = await p.evaluate((R) => { const ps = [...document.querySelectorAll(R + ' p')].filter((x) => x.getBoundingClientRect().width > 0); return { total: ps.length, editable: ps.filter((x) => x.isContentEditable).length }; }, R);
  const tgt = R + ' [data-name="Widget/Weekly Solar Generation"]';
  const btn = await center(tgt + ' .fe-chartbtn');
  if (btn) {
    await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(350);
    await shot('chartmenu');
    out.chartItems = await p.evaluate((t) => [...document.querySelectorAll(t + ' .fe-chartmenu button')].map((b) => b.textContent.trim()), tgt);
    const it = await center(tgt + ' .fe-chartmenu button[data-i="1"]');
    if (it) { await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1600); }
    out.chart = await p.evaluate((t) => !!document.querySelector(t + ' .fe-chart'), tgt);
    await shot('chart');
  } else out.chart = 'no button';
  const mv = R + ' [data-name="Widget/Plant Generation"]';
  const before = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  const a = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left + 30, b.top + 12]; }, mv);
  await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(a[0] - 40, a[1], { steps: 4 }); await p.mouse.move(a[0] - 600, a[1] + 40, { steps: 12 }); await p.waitForTimeout(200);
  await p.mouse.up(); await p.waitForTimeout(700);
  out.move = { before, after: await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv) };
  await shot('moved');
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(3800);
  out.afterReload = await p.evaluate((R) => !!document.querySelector(R), R);
  out.reloadPos = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  out.reloadChart = await p.evaluate((t) => !!document.querySelector(t + ' .fe-chart'), tgt);
  out.reloadMargin = await margin();
  await shot('reload');
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(500);
  out.reset = await click(R + ' .fe-resetbtn');
  await p.waitForTimeout(700);
  out.resetPos = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  await p.evaluate(() => document.getElementById('editAll').click());
  out.errs = errs.slice(0, 14);
  await ctx.close();
  return out;
}
