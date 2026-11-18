/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 템플릿 → '이 구성으로 스튜디오 열기' → 여백 · 시계 · 이벤트 최근 시각
   → 이벤트 펼치기(이벤트 현황으로) · 접기 → 상세보기 → 다크 · 라이트 · 색 → 패널편집(글자 · 차트 · 옮기기) → 새로고침.
   검증 서버: node serve.js 5570 · 실행: node pw.js studio-check.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const W = +(process.env.SW || 1920), H = +(process.env.SH || 1080);
  const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[pd\]/.test(m.text()))) && !/favicon|ERR_|404|WebSocket|api\/|recent-time/.test(m.text())) errs.push(m.text().slice(0, 220)); });
  const out = {};
  const shot = (n) => p.screenshot({ path: GEN + 'studio-' + n + '.png' });
  const center = (sel) => p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width > 0); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const click = async (sel) => { const r = await center(sel); if (!r) return false; await p.mouse.click(r[0], r[1]); return true; };
  const margin = (px) => p.evaluate((px) => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const r = document.querySelector('#dtStage .' + px + '-root');
    const f = r.querySelector(':scope > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)), theme: r.dataset.theme };
  }, px);
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await shot('detail');
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2400);
  await shot('open');
  out.margin = await margin('pdm');
  out.scenes = await p.evaluate(() => { try { return WEMB.projects.loadProjects().filter((x) => x.tpl === 'plantdp').map((x) => x.tplScene || x.name); } catch (e) { return String(e); } });
  const clk = () => p.evaluate(() => [...document.querySelectorAll('#dtStage .pdm-root p')].map((x) => x.textContent.trim()).filter((t) => /^\d{2}:\d{2}:\d{2}$|^\d{4}-\d{2}-\d{2} [A-Z]{3}$/.test(t)).slice(0, 2));
  out.clock = await clk();
  await p.waitForTimeout(2100);
  out.clock2 = await clk();
  out.ev1 = await p.evaluate(() => { const r = document.querySelector('#dtStage .pdm-root [data-name="Event Log"] [data-name^="Row/"], #dtStage .pdm-root [data-name="Event Log"] [data-name="grid-row"]'); return r ? [...r.querySelectorAll('p')].map((x) => x.textContent).join(' | ') : null; });
  /* 호버 — 상세보기 단추 */
  const vd = await center('#dtStage [data-name="Button/View Details"]');
  if (vd) { await p.mouse.move(vd[0], vd[1]); await p.waitForTimeout(400); await shot('hover'); out.hover = await p.evaluate(() => { const e = document.querySelector('#dtStage [data-name="Button/View Details"]'); const c = getComputedStyle(e); return [c.filter, c.translate, c.backgroundColor].join(' / '); }); await p.mouse.move(5, 5); }
  /* 이벤트 로그 펼치기 → 이벤트 현황 */
  let t1 = Date.now();
  out.unfoldBtn = await click('#dtStage .pdm-root [data-name="Event Log"] .pd-foldbtn');
  await p.waitForSelector('#dtStage .pde-root', { timeout: 6000 }).catch(() => { out.eventFail = true; });
  out.eventMs = Date.now() - t1;
  await p.waitForTimeout(1200);
  await shot('event');
  const elogY = () => p.evaluate(() => Math.round(document.querySelector('#dtStage .pde-root [data-name="Event Log"]').getBoundingClientRect().top));
  const y0 = await elogY();
  await click('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Collapse"] img');
  await p.waitForTimeout(800);
  const y1 = await elogY();
  await shot('fold');
  await click('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Expand"] img');
  await p.waitForTimeout(800);
  out.fold = [y0, y1, await elogY()];
  out.eventMargin = await margin('pde');
  out.ev1 = await p.evaluate(() => { const r = [...document.querySelectorAll('#dtStage .pde-root [data-name="Event Log"] [data-name^="Row/"], #dtStage .pde-root [data-name="Event Log"] [data-name="grid-row"]')].find((x) => /d{2}:d{2}:d{2}/.test(x.textContent)); return r ? [...r.querySelectorAll('p')].map((x) => x.textContent.trim()).filter(Boolean).join(' | ') : null; });
  out.now = new Date().toTimeString().slice(0, 8);
  /* 다크 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(2200);
  out.darkTheme = await p.evaluate(() => document.querySelector('#dtStage .pde-root').dataset.theme);
  await shot('dark-event');
  /* 메인으로(레일의 이벤트 · 종합) — 닫기 없으면 장면 함수로 */
  await p.evaluate(() => window.__gotoPlantdpScene && window.__gotoPlantdpScene('main'));
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 6000 }).catch(() => { out.backFail = true; });
  await p.waitForTimeout(1800);
  out.darkCarry = await p.evaluate(() => document.querySelector('#dtStage .pdm-root').dataset.theme);
  await shot('dark-main');
  /* 상세보기 → 기상 */
  t1 = Date.now();
  await click('#dtStage .pdm-root [data-name="Widget/Weather Observation"] [data-name="Button/View Details"]');
  await p.waitForSelector('#dtStage .pdw-root', { timeout: 6000 }).catch(() => { out.weatherFail = true; });
  out.weatherMs = Date.now() - t1;
  await p.waitForTimeout(1500);
  out.weatherTheme = await p.evaluate(() => { const r = document.querySelector('#dtStage .pdw-root'); return r && r.dataset.theme; });
  await shot('dark-weather');
  /* 색 정하기 */
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0f8f7a'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(2500);
  await shot('tint-dark');
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(2500);
  await shot('tint-light');
  out.lightTheme = await p.evaluate(() => { const r = document.querySelector('#dtStage .pdw-root'); return r && r.dataset.theme; });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#2a74f4'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1200);
  await p.evaluate(() => window.__gotoPlantdpScene && window.__gotoPlantdpScene('main'));
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 6000 }).catch(() => { out.back2Fail = true; });
  await p.waitForTimeout(1600);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('#dtStage .pdm-root p')]; return { total: ps.length, editable: ps.filter((x) => x.isContentEditable).length }; });
  const tgt = '#dtStage .pdm-root [data-name="Widget/Weather Observation"]';
  const btn = await center(tgt + ' .pd-chartbtn');
  if (btn) {
    await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(300);
    await shot('chartmenu');
    const it = await center(tgt + ' .pd-chartmenu button[data-i="0"]');
    await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1600);
    out.chart = await p.evaluate((t) => !!document.querySelector(t + ' .pd-chart'), tgt);
    await shot('chart');
  } else out.chart = 'no button';
  /* 지진 자유장 위젯을 왼쪽으로 옮기기 */
  const mv = '#dtStage .pdm-root [data-name="Widget/Seismic Free Field"]';
  const before = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  const a = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left + 6, b.top + 6]; }, mv);
  await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(a[0] - 40, a[1], { steps: 4 }); await p.mouse.move(a[0] - 300, a[1] + 20, { steps: 12 }); await p.waitForTimeout(200);
  await shot('drag');
  await p.mouse.up(); await p.waitForTimeout(700);
  const after = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  out.move = { before, after };
  await shot('moved');
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(3500);
  out.afterReload = await p.evaluate(() => !!document.querySelector('#dtStage .pdm-root'));
  out.reloadPos = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  out.reloadChart = await p.evaluate((t) => !!document.querySelector(t + ' .pd-chart'), tgt);
  out.reloadMargin = await margin('pdm');
  await shot('reload');
  /* 원래대로 — 배치 초기화 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(500);
  await click('#dtStage .pdm-root .pd-resetbtn');
  await p.waitForTimeout(600);
  out.resetPos = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  await p.evaluate(() => document.getElementById('editAll').click());
  out.errs = errs.slice(0, 12);
  await ctx.close();
  return out;
}
