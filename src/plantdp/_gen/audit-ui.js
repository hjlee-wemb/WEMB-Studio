/* 장면마다 눌릴 것처럼 생긴 레이어(단추 · 탭 · 옵션 · 선택 · 체크 · 메뉴 · 항목) 전수 — 연결(pd-click) 여부. 실행: node pw.js audit-ui.js > audit.json */
async (page) => {
  const SC = ['main', 'weather', 'seismic', 'event', 'sop-popup', 'building', 'floor', 'sop', 'sop-standby', 'login'];
  const RE = /btn|button|tab|option|select|dropdown|toggle|check|chip|menu|nav|item|icon\/|arrow|close|search|filter|period|sort|radio|switch|input|field|legend|segment|page|more|rail|category|block|row$/i;
  const out = {};
  for (const sc of SC) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5570/src/plantdp/' + sc + '.html?t=light&r=' + Date.now());
    await page.waitForTimeout(1500);
    out[sc] = await page.evaluate((src) => {
      const RE = new RegExp(src, 'i');
      const seen = new Map();
      document.querySelectorAll('[data-name]').forEach((e) => {
        const n = e.dataset.name;
        if (!RE.test(n)) return;
        const b = e.getBoundingClientRect();
        if (b.width < 6 || b.height < 6 || getComputedStyle(e).visibility === 'hidden') return;
        /* 이미 연결된 조상 안이면 묶어서 */
        const wired = !!e.closest('.pd-click');
        const par = e.parentElement && e.parentElement.closest('[data-name]');
        const key = (par ? par.dataset.name + ' > ' : '') + n;
        const txt = e.textContent.replace(/\s+/g, ' ').trim().slice(0, 30);
        const r = seen.get(key) || { n: 0, wired: 0, txt: [] };
        r.n++; if (wired) r.wired++; if (txt && r.txt.length < 3 && !r.txt.includes(txt)) r.txt.push(txt);
        seen.set(key, r);
      });
      return [...seen.entries()].map(([k, r]) => (r.wired === r.n ? 'OK ' : r.wired ? '.. ' : '-- ') + k + ' ×' + r.n + (r.txt.length ? '  「' + r.txt.join(' / ') + '」' : ''));
    }, RE.source);
  }
  return out;
}
