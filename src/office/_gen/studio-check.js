/* 실제 스튜디오에서 눌러 보는 점검 — 빈 저장소 새 컨텍스트: 템플릿 → '이 구성으로 스튜디오 열기' → 메뉴 이동 → 접기 · 시계
   → 다크 · 라이트 · 색 → 패널편집(글자 · 차트 · 옮기기) → 새로고침. 검증 서버: node serve.js 5546 (Playwright filename 으로 실행) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/office/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 220)));
  p.on('console', (m) => { if ((m.type() === 'error' || (m.type() === 'warning' && /\[of\]/.test(m.text()))) && !/favicon|ERR_|404|WebSocket|api\/|recent-time/.test(m.text())) errs.push(m.text().slice(0, 220)); });
  const out = {};
  const center = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const click = async (sel) => { const r = await center(sel); if (!r) return false; await p.mouse.click(r[0], r[1]); return true; };
  const clickText = async (scope, t) => { const r = await p.evaluate(([s, t]) => { const e = [...document.querySelectorAll(s + ' p')].find((x) => x.textContent.trim() === t); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, [scope, t]); if (!r) return false; await p.mouse.click(r[0], r[1]); return true; };
  const waitRoot = async (px, key) => { const t = Date.now(); await p.waitForSelector('#dtStage .' + px + '-root', { timeout: 8000 }).catch(() => { out[key + 'Fail'] = true; }); out[key + 'Ms'] = Date.now() - t; };
  try {
  await p.goto('http://localhost:5546/index.html#/templates/dashboard-smart-office');
  await p.waitForTimeout(1500);
  await p.screenshot({ path: GEN + 'studio-detail.png' });
  const t0 = Date.now();
  out.openBtn = await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); return !!b; });
  await p.waitForSelector('#dtStage .ofha-root', { timeout: 15000 }).catch(() => { out.noRoot = true; });
  out.openMs = Date.now() - t0;
  await p.waitForTimeout(2400);
  await p.screenshot({ path: GEN + 'studio-open.png' });
  out.margin = await p.evaluate(() => {
    const st = document.getElementById('dtStage').getBoundingClientRect();
    const r = document.querySelector('#dtStage .ofha-root');
    const f = r.querySelector(':scope > [data-node-id]').getBoundingClientRect();
    return { stage: [Math.round(st.width), Math.round(st.height)], m: [f.left - st.left, f.top - st.top, st.right - f.right, st.bottom - f.bottom].map((v) => +v.toFixed(1)), theme: r.dataset.theme };
  });
  out.scenes = await p.evaluate(() => { try { return WEMB.projects.loadProjects().filter((x) => x.tpl === 'office').length; } catch (e) { return String(e); } });
  /* 메뉴 이동 — 현황 */
  await clickText('#dtStage [data-name="Header"]', '현황'); await waitRoot('ofla', 'live'); await p.waitForTimeout(1300);
  const c0 = await p.evaluate(() => [...document.querySelectorAll('#dtStage .ofla-root p')].map((x) => x.textContent).find((t) => /^\d\d:\d\d:\d\d$/.test(t)));
  await p.waitForTimeout(2100);
  const c1 = await p.evaluate(() => [...document.querySelectorAll('#dtStage .ofla-root p')].map((x) => x.textContent).find((t) => /^\d\d:\d\d:\d\d$/.test(t)));
  out.clock = [c0, c1];
  await p.screenshot({ path: GEN + 'studio-live.png' });
  /* 분석 → 영역별 차트(도크 2번째) */
  await clickText('#dtStage [data-name="Header"]', '분석'); await waitRoot('ofoa', 'occ'); await p.waitForTimeout(1300);
  const docks = await p.evaluate(() => [...document.querySelectorAll('#dtStage .ofoa-root .of-dock')].length);
  out.docks = docks;
  { const d = await p.evaluate(() => { const e = document.querySelectorAll('#dtStage .ofoa-root .of-dock')[1]; if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }); if (d) await p.mouse.click(d[0], d[1]); }
  await waitRoot('ofoc', 'area'); await p.waitForTimeout(1500);
  /* 사이드바 접기 */
  const head = '#dtStage .ofoc-root .of-fold-head';
  out.rootsAtFold = await p.evaluate(() => [...document.querySelectorAll("#dtStage [class*=\"-root\"]")].map((e) => e.className.split(" ")[0]).join());
  const hh = () => p.evaluate((s) => { const h = document.querySelector(s); if (!h) return -1; const b = h.nextElementSibling; return Math.round(b.getBoundingClientRect().height); }, head);
  const f0 = await hh(); await click(head); await p.waitForTimeout(700); const f1 = await hh();
  await p.screenshot({ path: GEN + 'studio-fold.png' });
  await click(head); await p.waitForTimeout(700); out.fold = [f0, f1, await hh()];
  /* 다크 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(2500);
  out.darkTheme = await p.evaluate(() => (document.querySelector('#dtStage .ofoc-root') || { dataset: { theme: 'none' } }).dataset.theme);
  await p.screenshot({ path: GEN + 'studio-dark-area.png' });
  await clickText('#dtStage [data-name="Header"]', '관리정보'); await waitRoot('ofma', 'darkAdmin'); await p.waitForTimeout(1800);
  out.darkCarry = await p.evaluate(() => (document.querySelector('#dtStage .ofma-root') || { dataset: { theme: 'none' } }).dataset.theme);
  await p.screenshot({ path: GEN + 'studio-dark-admin.png' });
  /* 색 정하기 */
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0f8f7a'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint-dark.png' });
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(3000);
  await p.screenshot({ path: GEN + 'studio-tint-light.png' });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#657aff'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  await clickText('#dtStage [data-name="Header"]', '분석'); await waitRoot('ofoa', 'back'); await p.waitForTimeout(1200);
  { const d = await p.evaluate(() => { const e = document.querySelectorAll('#dtStage .ofoa-root .of-dock')[1]; if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }); if (d) await p.mouse.click(d[0], d[1]); }
  await waitRoot('ofoc', 'area2'); await p.waitForTimeout(1500);
  /* 패널편집 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(800);
  out.edit = await p.evaluate(() => { const ps = [...document.querySelectorAll('.ofoc-root p')]; return { total: ps.length, editable: ps.filter((x) => x.isContentEditable).length }; });
  const tgt = '#dtStage .ofoc-root .of-panel';
  const btn = await center(tgt + ' .of-chartbtn');
  if (btn) {
    await p.mouse.click(btn[0], btn[1]); await p.waitForTimeout(300);
    await p.screenshot({ path: GEN + 'studio-chartmenu.png' });
    const it = await center(tgt + ' .of-chartmenu button[data-i="0"]');
    await p.mouse.click(it[0], it[1]); await p.waitForTimeout(1800);
    out.chart = await p.evaluate((t) => !!document.querySelector(t + ' .of-chart'), tgt);
    await p.screenshot({ path: GEN + 'studio-chart.png' });
  } else out.chart = 'no button';
  /* 위 · 아래 차트 판 맞바꾸기 */
  const tops = () => p.evaluate(() => [...document.querySelectorAll('.ofoc-root .of-panel')].map((e) => Math.round(e.getBoundingClientRect().top)));
  const before = await tops();
  const a = await p.evaluate(() => { const b = document.querySelectorAll('.ofoc-root .of-panel')[0].getBoundingClientRect(); return [b.left + 300, b.top + 100]; });
  const b2 = await p.evaluate(() => { const b = document.querySelectorAll('.ofoc-root .of-panel')[1].getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  await p.mouse.move(a[0], a[1]); await p.mouse.down(); await p.mouse.move(a[0], a[1] + 40, { steps: 4 }); await p.mouse.move(b2[0], b2[1], { steps: 14 }); await p.waitForTimeout(250);
  await p.mouse.up(); await p.waitForTimeout(900);
  out.move = { before, after: await tops(), first: await p.evaluate(() => document.querySelectorAll('.ofoc-root .of-panel')[0].getAttribute('data-node-id')) };
  await p.screenshot({ path: GEN + 'studio-moved.png' });
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.reload(); await p.waitForTimeout(3500);
  out.afterReload = await p.evaluate(() => [...document.querySelectorAll('#dtStage [class*="-root"]')].map((e) => e.className.split(' ')[0]).filter((c) => /^of/.test(c)));
  out.reloadChart = await p.evaluate(() => !!document.querySelector('#dtStage .ofoc-root .of-chart'));
  } catch (e) { out.err = String(e).slice(0, 300); out.rootsAtErr = await p.evaluate(() => [...document.querySelectorAll('#dtStage [class*="-root"]')].map((e) => e.className.split(' ')[0]).join()).catch(() => ''); await p.screenshot({ path: GEN + 'studio-err.png' }).catch(() => {}); }
  out.errs = errs.slice(0, 12);
  await ctx.close();
  return out;
}
