/* 분자 라이브러리 검증 탭(#/molecules/verify) — '전체 검사 실행' 을 누르고 결과(#state · #out)를 읽는다.
   따로 그린 분자가 원본 템플릿 안과 같은지(위치 2px · 겹침 · 잘림). 실행: node src/plantdp/_gen/pw.js <이 파일> */
async (page) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('http://localhost:5510/index.html#/molecules/verify');
  await page.waitForSelector('#run', { timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.click('#run');
  const start = Date.now();
  let state = '';
  while (Date.now() - start < 560000) {
    await page.waitForTimeout(4000);
    state = await page.evaluate(() => (document.getElementById('state') || {}).textContent || '');
    if (/문제 \d+건/.test(state) || /실패/.test(state)) break;
  }
  const out = await page.evaluate(() => [...document.querySelectorAll('#out h3, #out li, #out .atm-vok')].slice(0, 30).map((e) => e.innerText.replace(/\s+/g, ' ').slice(0, 220)));
  return { seconds: Math.round((Date.now() - start) / 1000), state, out, errs };
}
