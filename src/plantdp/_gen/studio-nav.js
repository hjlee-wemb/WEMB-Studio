/* 스튜디오에서 화면끼리 잇기 — 진짜 마우스 클릭으로 모든 길을 따라간다(가려진 단추는 'covered by …' 로 드러난다).
   + 다크 · 색 정하기 상태에서 필터 탭 바꾸기. 실행: node pw.js studio-nav.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/plantdp/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push('PAGE ' + String(e).slice(0, 200)));
  p.on('console', (m) => { if ((m.type() === 'error' || /\[pd\]/.test(m.text())) && !/favicon|ERR_|404|WebSocket|api\//.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto('http://localhost:5570/index.html#/templates/digital-twin-power-plant-disaster-prevention');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .pdm-root', { timeout: 15000 });
  await p.waitForTimeout(2200);
  const scene = () => p.evaluate(() => { const r = document.querySelector('#dtStage [class*="pd"][class*="-root"].pd-root'); return r ? r.className.match(/\b(pd[a-z])-root\b/)[1] : null; });
  const click = async (sel, idx) => {
    const r = await p.evaluate(([s, i]) => {
      const els = [...document.querySelectorAll(s)].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
      const e = els[i || 0]; if (!e) return null;
      const im = e.querySelector('img') && e.tagName !== 'P' ? e : e;
      const b = im.getBoundingClientRect(); const x = b.left + b.width / 2, y = b.top + b.height / 2;
      const t = document.elementFromPoint(x, y);
      return [x, y, t === e || e.contains(t), t && (t.closest('[data-name]') || t).dataset.name];
    }, [sel, idx]);
    if (!r) return 'missing';
    await p.mouse.click(r[0], r[1]);
    return r[2] ? 'ok' : 'covered by ' + r[3];
  };
  const steps = [
    ['rail SOP 현황 → sop', '#dtStage .pdm-root [data-name="Button/SOP Status"]', 'pdo'],
    ['SOP 목록 대기 → sop-standby', '#dtStage .pdo-root [data-name="Side Panel/SOP List"] [data-name="Item/3"]', 'pdy'],
    ['SOP 목록 진행중 → sop', '#dtStage .pdy-root [data-name="Side Panel/SOP List"] [data-name="Item/1"]', 'pdo'],
    ['SOP 헤더 로고 → main', '#dtStage .pdo-root [data-name="Header"] [data-name="logo chip"]', 'pdm'],
    ['상세보기(기상) → weather', '#dtStage .pdm-root [data-name="Widget/Weather Observation"] [data-name="Button/View Details"]', 'pdw'],
    ['닫기 → main', '#dtStage .pdw-root [data-name^="Popup/"] [data-name="Button/Close"]', 'pdm'],
    ['상세보기(지진) → seismic', '#dtStage .pdm-root [data-name^="Widget/Seismic"] [data-name="Button/View Details"]', 'pds'],
    ['지진 닫기 → main', '#dtStage .pds-root [data-name^="Popup/"] [data-name="Button/Close"]', 'pdm'],
    ['rail 이벤트현황 → event', '#dtStage .pdm-root [data-name="Button/Event Status"]', 'pde'],
    ['이벤트 줄 SOP → sop-popup', '#dtStage .pde-root [data-name="Event Log"] [data-name="btn-sop2"]', 'pdp'],
    ['헤더 로고 → main', '#dtStage .pdp-root [data-name="Header"] [data-name="logo chip"]', 'pdm'],
    ['필터 건물 탭', '#dtStage .pdm-root [data-name="Filter Panel"] [data-name="btn-tab_building"]', 'pdm'],
    ['건물 고르기 → building', '#dtStage .pdm-root .pd-navfrag [data-name="block2"]', 'pdb'],
    ['건물 이름표 → floor', '#dtStage .pdb-root [data-name="Building Label"]', 'pdf'],
    ['건물 목록으로 → building', '#dtStage .pdf-root [data-name="Button/Back to Building List"]', 'pdb'],
    ['전경뷰로 → main', '#dtStage .pdb-root [data-name="Button/Back to Overview"]', 'pdm'],
    ['로그아웃 → login', '#dtStage .pdm-root [data-name="Button/Logout"]', 'pdl'],
    ['SIGN UP → main', '#dtStage .pdl-root [data-name="Button/Sign Up"]', 'pdm'],
  ];
  const out = [];
  for (const [label, sel, want] of steps) {
    const t0 = Date.now();
    const how = await click(sel);
    let got = null;
    for (let i = 0; i < 30; i++) { await p.waitForTimeout(100); got = await scene(); if (got === want) break; }
    out.push((got === want ? 'OK  ' : 'FAIL') + ' ' + label + ' [' + how + '] ' + (Date.now() - t0) + 'ms' + (got === want ? '' : ' → ' + got));
    await p.waitForTimeout(700);
  }
  /* 다크 + 색 정하기 상태에서 필터 탭 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#0f8f7a'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(2000);
  out.push('sensor tab (dark/tint): ' + await click('#dtStage .pdm-root [data-name="Filter Panel"] [data-name="btn-tab_sencer"]'));
  await p.waitForTimeout(900);
  out.push('frag theme: ' + await p.evaluate(() => [...document.querySelectorAll('#dtStage .pd-navfrag')].map((w) => w.getAttribute('data-name') + ':' + w.dataset.theme + (w.style.display === 'none' ? '(hidden)' : '')).join(' ')));
  await p.screenshot({ path: GEN + 'studio-nav-dark.png', clip: { x: 352, y: 48, width: 760, height: 1032 } });
  await p.evaluate(() => { const i = document.getElementById('seed'); i.value = '#2a74f4'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#mode button[data-m="light"]').click(); });
  await p.waitForTimeout(800);
  out.push('errs: ' + JSON.stringify(errs.slice(0, 8)));
  await ctx.close();
  return out;
}
