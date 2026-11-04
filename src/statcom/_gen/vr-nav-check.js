/* Playwright filename — 사이드 메뉴의 VR 입구: 화면마다 있는지, 눌러서 가는지, 돌아오는지, 글자 편집, 작은 창 */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/statcom/_gen/';
  const ctx = await page.context().browser().newContext({ viewport: { width: 1920, height: 1080 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  const out = {};
  await p.goto('http://localhost:5542/index.html#/templates/digital-twin-statcom-hmi');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find((x) => /스튜디오 열기/.test(x.textContent)); if (b) b.click(); });
  await p.waitForSelector('#dtStage .tcm-root', { timeout: 15000 });
  await p.waitForTimeout(1800);

  const VR = '#dtStage [data-name="Nav Item/VR Training"]';
  const center = (sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }, sel);
  const clickAt = async (sel) => { const c = await center(sel); if (c) await p.mouse.click(c[0], c[1]); return !!c; };
  const info = () => p.evaluate((s) => {
    const n = document.querySelector(s), st = document.getElementById('dtStage').getBoundingClientRect();
    if (!n) return null;
    const b = n.getBoundingClientRect(), img = n.querySelector('img'), list = document.querySelectorAll('#dtStage [data-name="Nav Item/VR Training"]').length;
    return { n: list, bottomInStage: +(st.bottom - b.bottom).toFixed(1), h: Math.round(b.height), label: [...n.querySelectorAll('p')].map((x) => x.textContent).join(' '), img: img.naturalWidth > 0, content: getComputedStyle(img).content.slice(-30) };
  }, VR);

  /* 메뉴가 있는 화면을 차례로 */
  out.screens = {};
  const NAV = [['main', null], ['statcom', 'Nav Item/STATCOM'], ['power', 'Nav Item/Power Equipment'], ['valve', 'Nav Item/VSC Valve Room'], ['cooling', 'Nav Item/VSC Cooling Room'], ['supply', 'Nav Item/Power Supply'], ['safety', 'Nav Item/Control Safety'], ['simulation', 'Nav Item/Simulation'], ['alarm', 'Nav Item/Alarm Message']];
  for (const [s, name] of NAV) {
    if (name) { await clickAt('#dtStage [data-name="' + name + '"]'); await p.waitForTimeout(700); }
    out.screens[s] = await info();
  }
  await p.screenshot({ path: GEN + 'vrnav-dark.png' });

  /* 호버 · 라이트 */
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(1000);
  out.light = await info();
  await p.screenshot({ path: GEN + 'vrnav-light.png' });

  /* 누르면 VR 로 */
  const t0 = Date.now();
  await clickAt(VR);
  await p.waitForSelector('#dtStage .tvt-root', { timeout: 6000 }).catch(() => { out.noVr = true; });
  out.toVrMs = Date.now() - t0;
  await p.waitForTimeout(700);
  out.vrTheme = await p.evaluate(() => document.querySelector('#dtStage .tvt-root').dataset.theme);
  await p.screenshot({ path: GEN + 'vrnav-topic.png' });

  /* 뒤로 단추 — 들어온 화면(알림)으로 */
  const BACK = '#dtStage [data-name="Button/Back to HMI"]';
  out.back = await p.evaluate((s) => { const b = document.querySelector(s), t = document.querySelector('#dtStage [data-name="Button/MMC Valve Submodule Replacement"]'), body = document.querySelector('#dtStage [data-name="Body"]'); if (!b) return null; const r = b.getBoundingClientRect(), q = t.getBoundingClientRect(), o = body.getBoundingClientRect(); return { label: b.querySelector('p').textContent, gap: +(r.top - q.bottom).toFixed(1), sameSize: Math.round(r.width) === Math.round(q.width) && Math.round(r.height) === Math.round(q.height), bottomRoom: +(o.bottom - r.bottom).toFixed(1) }; }, BACK);
  await clickAt(BACK);
  await p.waitForSelector('#dtStage .tca-root', { timeout: 6000 }).catch(() => { out.noBackAlarm = true; });
  await p.waitForTimeout(600);
  out.backToAlarm = await p.evaluate(() => !!document.querySelector('#dtStage .tca-root'));
  /* Esc — 들어온 화면(알림)으로 */
  await clickAt(VR);
  await p.waitForSelector('#dtStage .tvt-root', { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(600);
  await p.keyboard.press('Escape');
  await p.waitForSelector('#dtStage .tca-root', { timeout: 6000 }).catch(() => { out.noEsc = true; });
  await p.waitForTimeout(600);
  out.escToAlarm = await p.evaluate(() => !!document.querySelector('#dtStage .tca-root'));
  /* 다크 모습 · 편집 중에는 가지 않는다 */
  await clickAt(VR);
  await p.waitForSelector('#dtStage .tvt-root', { timeout: 6000 }).catch(() => {});
  await p.evaluate(() => document.querySelector('#mode button[data-m="dark"]').click());
  await p.waitForTimeout(900);
  await p.screenshot({ path: GEN + 'vrnav-topic-dark.png' });
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(500);
  out.backEditable = await p.evaluate((s) => document.querySelector(s + ' p').getAttribute('contenteditable'), BACK);
  await clickAt(BACK);
  await p.waitForTimeout(500);
  out.backStaysInEdit = await p.evaluate(() => !!document.querySelector('#dtStage .tvt-root'));
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('#mode button[data-m="light"]').click());
  await p.waitForTimeout(500);
  await clickAt(BACK);
  await p.waitForSelector('#dtStage .tca-root', { timeout: 6000 }).catch(() => {});
  await p.waitForTimeout(600);
  await clickAt('#dtStage [data-name="Button/Home"]');
  await p.waitForSelector('#dtStage .tcm-root', { timeout: 6000 }).catch(() => { out.noMain = true; });
  await p.waitForTimeout(600);

  /* 패널편집 — 글자 수정 대상인지, 편집 중에는 이동하지 않는지 */
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(600);
  out.editable = await p.evaluate((s) => { const q = document.querySelector(s + ' p'); return q && q.getAttribute('contenteditable'); }, VR);
  await clickAt(VR);
  await p.waitForTimeout(500);
  out.staysInEdit = await p.evaluate(() => !!document.querySelector('#dtStage .tcm-root'));
  await p.evaluate(() => document.getElementById('editAll').click());
  await p.waitForTimeout(400);

  /* 작은 창 */
  await p.setViewportSize({ width: 1280, height: 720 });
  await p.waitForTimeout(900);
  out.small = await info();
  await p.screenshot({ path: GEN + 'vrnav-small.png' });

  out.errs = errs;
  await ctx.close();
  return out;
}
