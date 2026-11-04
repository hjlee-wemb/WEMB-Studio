/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트에서 홈 → 템플릿 → '이 구성으로 스튜디오 열기'. Playwright filename */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plant/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error' && !/favicon|ERR_|404|WebSocket|api\//.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const out = {};
  await p.goto('http://localhost:5541/index.html#/templates/digital-twin-plant-power-facility');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-detail.png' });
  const t0 = Date.now();
  const clicked = await p.evaluate(() => {
    const b = [...document.querySelectorAll('button, a')].find((x) => /이 구성으로 스튜디오 열기/.test(x.textContent));
    if (b) b.click();
    return !!b;
  });
  out.openBtn = clicked;
  await p.waitForFunction(() => /studio\.html/.test(location.href), null, { timeout: 8000 }).catch(() => {});
  await p.waitForSelector('#dtStage .pfo-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2500);
  await p.screenshot({ path: GEN + 'studio-open.png' });
  out.url = p.url().replace(/^.*\/studio/, 'studio');
  out.margin = await p.evaluate(() => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const base = document.querySelector('.pfo-root [data-name="Base"]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [base.left - st.left, base.top - st.top, st.right - base.right, st.bottom - base.bottom].map((v) => Math.round(v)) };
  });
  out.rail = await p.evaluate(() => [...document.querySelectorAll('[data-rail]')].map((b) => b.dataset.rail + ':' + b.textContent.trim().slice(0, 10)));
  out.modeBtns = await p.evaluate(() => [...document.querySelectorAll('#mode button')].map((b) => b.dataset.m));
  out.editBtns = await p.evaluate(() => ['editAll', 'layoutReset'].map((id) => id + ':' + !!document.getElementById(id)));
  out.errs = errs.slice(0, 10);
  globalThis.__plantCtx = { ctx, p };
  return out;
}
