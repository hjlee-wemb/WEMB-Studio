/* 분자 라이브러리 측정 — 서버(5510 · wemb-atomic)에서 #/molecules 를 열면 원본 페이지를 한 번씩 재서 data/measure.json 에 남긴다.
   원본 revision 이 바뀌면 전부 다시 잰다. measure.json 에 발전소 방재 10장이 다 들어올 때까지 기다린다. 실행: node src/plantdp/_gen/pw.js <이 파일> */
async (page) => {
  const fs = require('fs');
  const M = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/wemb-atomic/data/measure.json';
  const t0 = fs.statSync(M).mtimeMs;
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('http://localhost:5510/index.html#/molecules');
  const start = Date.now();
  let keys = [];
  /* 페이지마다 재는 대로 저장하므로 파일만 보면 이르다 — 화면의 '재는 중 n/m' 이 사라질 때까지 기다린다 */
  let seen = false;
  while (Date.now() - start < 540000) {
    await page.waitForTimeout(5000);
    const busy = await page.evaluate(() => /재는 중/.test(document.body.innerText));
    if (busy) seen = true;
    if (seen && !busy) break;
    if (!seen && Date.now() - start > 60000) break;
  }
  try { keys = Object.keys(JSON.parse(fs.readFileSync(M, 'utf8'))); } catch (e) { }
  const status = await page.evaluate(() => (document.body.innerText.match(/(측정|재는|재고)[^\n]{0,60}/) || [''])[0]);
  return { seconds: Math.round((Date.now() - start) / 1000), pages: keys.length, plantdp: keys.filter((k) => /^plantdp-/.test(k)), status, errs };
}
