/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 템플릿 → '이 구성으로 스튜디오 열기' → 여백 · 시계
   → 레일로 도서관리(진짜 클릭) · 스크롤 → 상세(탭 · 접기) → 다크 · 색 정하기 → 패널편집(글자 · 차트 · 옮기기) → 새로고침 → 배치 초기화.
   검증 서버: node serve.js 5575 · 실행: node pw.js studio-check.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/ccpp/_gen/';
  const W = +(process.env.SW || 1920), H = +(process.env.SH || 1080);
  const ctx = await page.context().browser().newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[cc\]/.test(m.text()))) && !/favicon|ERR_|404|WebSocket|api\/|recent-time/.test(m.text())) errs.push(m.text().slice(0, 220)); });
  const out = {};
  const shot = (n) => p.screenshot({ path: GEN + 'studio-' + n + '.png' });
  const center = (sel) => p.evaluate((s) => { const e = [...document.querySelectorAll(s)].find((x) => x.getBoundingClientRect().width > 0); if (!e) return null; const b = e.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2; const t = document.elementFromPoint(x, y); return [x, y, !!t && (t === e || e.contains(t))]; }, sel);
  const click = async (sel) => { const r = await center(sel); if (!r) return 'missing'; await p.mouse.click(r[0], r[1]); return r[2] ? 'ok' : 'blocked'; };
  const margin = (px) => p.evaluate((px) => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const r = document.querySelector('#dtStage .' + px + '-root');
    if (!r) return 'no ' + px;
    const f = r.querySelector(':scope > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)), theme: r.dataset.theme };
  }, px);
  const waitPx = async (px, key) => { const t = Date.now(); await p.waitForSelector('#dtStage .' + px + '-root', { timeout: 8000 }).catch(() => { out[key + 'Fail'] = true; }); out[key + 'Ms'] = Date.now() - t; await p.waitForTimeout(1500); };
  await p.goto('http://localhost:5575/index.html#/templates/digital-twin-combined-cycle-power-plant');
  await p.waitForTimeout(1800);
  await shot('gallery');
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector('#dtStage .ccm-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2600);
  await shot('open');
  out.margin = await margin('ccm');
  out.scenes = await p.evaluate(() => { try { return WEMB.projects.loadProjects().filter((x) => x.tpl === 'ccpp').map((x) => x.tplScene || x.name); } catch (e) { return String(e); } });
  const clk = () => p.evaluate(() => [...document.querySelectorAll('#dtStage [data-name="Header"] p')].map((x) => x.textContent.trim()).filter((s) => /요일$|^\d\d:\d\d:\d\d$/.test(s)));
  out.clock = await clk(); await p.waitForTimeout(2100); out.clock2 = await clk();
  /* 왼쪽 판 접기 — 단추로 닫고 다시 연다 */
  const lpos = () => p.evaluate(() => { const e = document.querySelector('#dtStage .ccm-root .cc-lpanel'); return e ? Math.round(e.getBoundingClientRect().left) + ' op' + getComputedStyle(e).opacity : null; });
  out.lfold0 = await lpos();
  out.lfoldHit = await click('#dtStage .ccm-root .cc-lfold'); await p.waitForTimeout(900);
  out.lfold1 = await lpos();
  await shot('leftfold');
  await click('#dtStage .ccm-root .cc-lfold'); await p.waitForTimeout(900);
  out.lfold2 = await lpos();
  /* 호버 — 레일 도서관리 단추 */
  const nb = await center('#dtStage .ccm-root [data-name="Nav Item/Document Library"]');
  await p.mouse.move(nb[0], nb[1]); await p.waitForTimeout(450);
  out.hover = await p.evaluate(() => { const e = document.querySelector('#dtStage .ccm-root [data-name="Nav Item/Document Library"] [data-name="Icon Button"]'); const c = getComputedStyle(e); return [c.translate, c.boxShadow.slice(0, 40)].join(' / '); });
  await shot('hover');
  /* 레일 → 도서관리(진짜 클릭) */
  out.navClick = await click('#dtStage .ccm-root [data-name="Nav Item/Document Library"]');
  await waitPx('ccl', 'library');
  out.libMargin = await margin('ccl');
  const row = await center('#dtStage .ccl-root [data-name="Panel/Document Library"] [data-name="List"] > [data-name="Row/8"]');
  await p.mouse.move(row[0], row[1]); await p.mouse.wheel(0, 500); await p.waitForTimeout(500);
  out.libScroll = await p.evaluate(() => document.querySelector('#dtStage .ccl-root [data-name="Grid"] [data-name="List"]').style.translate);
  await shot('library');
  /* 레일 → 태그관리(상세) · 탭 · 접기 */
  out.navTag = await click('#dtStage .ccl-root [data-name="Nav Item/Tag Management"]');
  await waitPx('cce', 'detail');
  out.detailMargin = await margin('cce');
  out.tabEq = await click('#dtStage .cce-root [data-name="Tab/Equipment"]'); await p.waitForTimeout(900);
  out.tabEqOk = await p.evaluate(() => !!document.querySelector('#dtStage .cce-root .cc-frag .cctb-root'));
  await shot('tab-equipment');
  out.tabOp = await click('#dtStage .cce-root [data-name="Tab/Operation Info"]'); await p.waitForTimeout(1200);
  out.tabOpOk = await p.evaluate(() => document.querySelectorAll('#dtStage .cce-root .cc-frag .cc-chart').length);
  out.fold = await click('#dtStage .cce-root [data-name="Button/Hide"]'); await p.waitForTimeout(900);
  out.foldX = await p.evaluate(() => document.querySelector('#dtStage .cce-root [data-name="Popup/Detail"]').style.translate);
  await shot('fold');
  await click('#dtStage .cce-root [data-name="Button/Hide"]'); await p.waitForTimeout(800);
  /* 다크 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(2200);
  out.darkTheme = await p.evaluate(() => document.querySelector('#dtStage .cce-root').dataset.theme);
  out.darkFrag = await p.evaluate(() => { const f = document.querySelector('#dtStage .cce-root .cc-frag'); return f ? 'op' : 'none'; });
  await shot('dark-detail');
  out.tabMat = await click('#dtStage .cce-root [data-name="Tab/Materials"]'); await p.waitForTimeout(900);
  out.darkFragTheme = await p.evaluate(() => { const r = document.querySelector('#dtStage .cce-root .cc-frag [data-theme]'); return r && r.dataset.theme; });
  await shot('dark-materials');
  /* 계통도 (다크 이어짐) */
  out.navDiag = await click('#dtStage .cce-root [data-name="Nav Item/System Diagram"]');
  await waitPx('ccd', 'diagram');
  out.diagTheme = await p.evaluate(() => document.querySelector('#dtStage .ccd-root').dataset.theme);
  out.diagMargin = await margin('ccd');
  await shot('dark-diagram');
  /* 색 정하기 */
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0f8f7a'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(2500);
  await shot('tint-dark');
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(2500);
  out.navMain = await click('#dtStage .ccd-root [data-name="Nav Item/Map"]');
  await waitPx('ccm', 'main');
  await shot('tint-light');
  out.tintActive = await p.evaluate(() => getComputedStyle(document.querySelector('#dtStage .ccm-root [data-name="Nav Item/Map (Active)"] [data-name="Icon Button"]')).backgroundColor);
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0073ff'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(900);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('#dtStage .ccm-root p')]; return { total: ps.length, editable: ps.filter((x) => x.isContentEditable).length }; });
  const tgt = '#dtStage .ccm-root [data-name="Section/Gas Turbine"]';
  const btn = await center(tgt + ' .cc-chartbtn');
  if (btn) {
    await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(350);
    await shot('chartmenu');
    const it = await center(tgt + ' .cc-chartmenu button[data-i="0"]');
    await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1600);
    out.chart = await p.evaluate((t) => !!document.querySelector(t + ' .cc-chart'), tgt);
    await shot('chart');
  } else out.chart = 'no button';
  const mv = '#dtStage .ccm-root [data-name="Panel/Map"]';
  const before = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  const a = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left + 10, b.top + 10]; }, mv);
  await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(a[0] - 40, a[1], { steps: 4 }); await p.mouse.move(a[0] + 300, a[1] + 40, { steps: 12 }); await p.waitForTimeout(200);
  await p.mouse.up(); await p.waitForTimeout(700);
  out.move = { before, after: await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv) };
  await shot('moved');
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(3800);
  out.afterReload = await p.evaluate(() => !!document.querySelector('#dtStage .ccm-root'));
  out.reloadPos = await p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  out.reloadChart = await p.evaluate((t) => !!document.querySelector(t + ' .cc-chart'), tgt);
  out.reloadMargin = await margin('ccm');
  await shot('reload');
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(500);
  out.reset = await click('#dtStage .ccm-root .cc-resetbtn');
  await p.waitForTimeout(700);
  out.resetPos = await p.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; }, mv);
  await p.evaluate(() => document.getElementById('editAll').click());
  out.errs = errs.slice(0, 12);
  await ctx.close();
  return out;
}
