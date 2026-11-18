/* 이벤트 현황 접기 · 펼치기 — 스튜디오에서 모든 길로 눌러 보고 오류 · 상태 · 화면을 남긴다. 실행: node pw.js fold-test.js [W H] */
async (page, args) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const W = +(args[0] || 1920), H = +(args[1] || 1080);
  const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e.stack || e).slice(0, 400)));
  p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/favicon|ERR_|404|WebSocket|api\//.test(m.text())) errs.push(m.type() + ' ' + m.text().slice(0, 300)); });
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(2200);
  const log = [];
  const state = (tag) => p.evaluate((tag) => {
    const r = document.querySelector('#dtStage .pd-root');
    const px = r.className.match(/\b(pd[a-z])-root\b/)[1];
    const el = r.querySelector('[data-name="Event Log"]');
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const b = el.getBoundingClientRect();
    const tbl = el.querySelector('[data-name="Table"]'); const tp = [...el.querySelectorAll('p')].find((x) => x.textContent.trim() === '이벤트 현황'); const tpb = tp && tp.getBoundingClientRect();
    return tag + ' | ' + px + ' shut=' + el.classList.contains('pd-shut') + ' top=' + Math.round(b.top - st.top) + ' bottom=' + Math.round(b.bottom - st.top) + '/' + Math.round(st.height) + ' tr=' + (el.style.translate || '-') + (tbl ? ' tblOp=' + getComputedStyle(tbl).opacity : '') + (tpb ? ' 제목 아래여백=' + Math.round(st.bottom - tpb.bottom) : '');
  }, tag);
  const click = async (sel) => {
    const r = await p.evaluate((s) => {
      const e = [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width > 0);
      if (!e) return null;
      const im = e.querySelector('img') || e;
      const b = im.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
      const t = document.elementFromPoint(x, y);
      return [x, y, e === t || e.contains(t) ? 'ok' : 'covered by ' + ((t && (t.closest('[data-name]') || t).dataset.name) || '?')];
    }, sel);
    if (!r) return 'missing ' + sel;
    await p.mouse.click(r[0], r[1]);
    return r[2];
  };
  const shot = (n) => p.screenshot({ path: GEN + 'fold-' + W + '-' + n + '.png' });
  const UP = '#dtStage .pd-root [data-name="Event Log"] .pd-foldbtn';
  log.push(await state('main 처음'));
  await shot('1-main');
  log.push('main 위 화살표: ' + await click(UP));
  await p.waitForTimeout(1600);
  log.push(await state('→ 펼친 화면'));
  await shot('2-event-open');
  log.push('접기: ' + await click('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Collapse"]'));
  await p.waitForTimeout(900);
  log.push(await state('접음'));
  await shot('3-event-shut');
  log.push('펴기: ' + await click('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Expand"]'));
  await p.waitForTimeout(900);
  log.push(await state('폄'));
  log.push('다시 접기: ' + await click('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Collapse"]'));
  await p.waitForTimeout(900);
  log.push(await state('접음2'));
  log.push('레일 종합재난현황: ' + await click('#dtStage .pde-root [data-name="Button/Multi-Hazard Status"]'));
  await p.waitForTimeout(1500);
  log.push(await state('→ main'));
  log.push('main 아래 화살표(이미 접힘): ' + await click('#dtStage .pdm-root [data-name="Event Log"] [data-name="btn-hide"]'));
  await p.waitForTimeout(600);
  log.push('레일 이벤트현황: ' + await click('#dtStage .pdm-root [data-name="Button/Event Status"]'));
  await p.waitForTimeout(1600);
  log.push(await state('→ event(레일)'));
  await shot('4-event-rail');
  log.push('접기: ' + await click('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Collapse"]'));
  await p.waitForTimeout(900);
  log.push(await state('접음3'));
  /* 접힌 채 새로고침 — 저장된 접힘으로 열린다 */
  await p.reload(); await p.waitForTimeout(3500);
  log.push(await state('새로고침'));
  await shot('5-reload');
  log.push('펴기: ' + await click('#dtStage .pde-root [data-name="Event Log"] [data-name="Button/Expand"]'));
  await p.waitForTimeout(900);
  log.push(await state('폄(새로고침 뒤)'));
  /* 다른 화면(기상 · 지진 팝업)에서 위 화살표 */
  await p.evaluate(() => window.__gotoPlantdpScene('weather')); await p.waitForTimeout(1600);
  log.push('weather 위 화살표: ' + await click(UP));
  await p.waitForTimeout(1600);
  log.push(await state('weather → '));
  await shot('6-from-weather');
  log.push('errs: ' + JSON.stringify(errs.slice(0, 10)));
  await ctx.close();
  return log;
}
