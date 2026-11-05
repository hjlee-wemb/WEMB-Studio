/* Playwright filename — 라이트 테마 캡처 + 글자 대비 점검(4.5:1 미달 목록) */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz/_gen/';
  const out = {};
  for (const [pg, key] of [['wind', '1-2634'], ['solar-input', '1-912'], ['measure-popup', '1-7644'], ['measure-wind', '1-5184'], ['overseas', '1-8494']]) {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5543/src/newbiz/' + pg + '.html?live=0&t=light&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: GEN + 'light-' + key + '.png' });
    out[pg] = await page.evaluate(() => {
      const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null; const a = m[1].split(/[ ,/]+/).map(parseFloat); return { r: a[0], g: a[1], b: a[2], a: a[3] == null ? 1 : a[3] }; };
      const L = (c) => { const f = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
      const res = {};
      document.querySelectorAll('#lsroot p').forEach((p) => {
        const c = parse(getComputedStyle(p).color);
        if (!c || !c.a) return;
        const lum = L(c);
        if (lum > .22) { const k = getComputedStyle(p).color; res[k] = res[k] || []; if (res[k].length < 3) res[k].push(p.textContent.trim().slice(0, 10)); }
      });
      return res;
    });
  }
  return out;
}
