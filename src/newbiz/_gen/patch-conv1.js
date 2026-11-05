/* 이 시안에서 새로 나온 클래스 · 화면 목록 도구 고침. 한 번만. */
'use strict';
const fs = require('fs'), path = require('path');
const f = path.join(__dirname, 'conv.js');
let c = fs.readFileSync(f, 'utf8');
const mark = "      case 'overflow-hidden': set('overflow', 'hidden'); continue;";
if (!c.includes("case 'mask-alpha'")) {
  c = c.replace(mark, mark + `
      case 'overflow-x-clip': set('overflow-x', 'clip'); continue;
      case 'overflow-y-auto': set('overflow-y', 'auto'); continue;
      case 'mask-alpha': set('-webkit-mask-source-type', 'alpha'); set('mask-mode', 'alpha'); continue;
      case 'mask-intersect': set('-webkit-mask-composite', 'source-in'); set('mask-composite', 'intersect'); continue;
      case 'mask-no-clip': set('-webkit-mask-clip', 'no-clip'); set('mask-clip', 'no-clip'); continue;
      case 'mask-no-repeat': set('-webkit-mask-repeat', 'no-repeat'); set('mask-repeat', 'no-repeat'); continue;`);
}
fs.writeFileSync(f, c);
const KEYS = ['1-2634', '1-3482', '1-4335', '1-52', '1-912', '1-1773', '1-6841', '1-5184', '1-6013', '1-7644', '1-8494'];
let d = fs.readFileSync(path.join(__dirname, 'diff-all.js'), 'utf8');
d = d.replace(/for \(const k of \[[^\]]*\]\)/, 'for (const k of ' + JSON.stringify(KEYS) + ')');
fs.writeFileSync(path.join(__dirname, 'diff-all.js'), d);
fs.writeFileSync(path.join(__dirname, 'cap.js'), `/* Playwright filename — 11화면을 라이브 없이 찍는다(dom-<key>.png) → node diff-all.js */
async (page) => {
  const GEN = 'C:/Users/wemb/Desktop/진행중/디자인팀/1_WEMB STUDIO/WEMB Studio/src/newbiz/_gen/';
  const P = [['wind', '1-2634'], ['solar', '1-3482'], ['energy', '1-4335'], ['wind-input', '1-52'], ['solar-input', '1-912'], ['energy-input', '1-1773'], ['measure', '1-6841'], ['measure-wind', '1-5184'], ['measure-solar', '1-6013'], ['measure-popup', '1-7644'], ['overseas', '1-8494']];
  const out = {};
  for (const [pg, key] of P) {
    await page.setViewportSize({ width: key === '1-8494' ? 1920 : 1922, height: 1080 });
    await page.goto('http://localhost:5543/src/newbiz/' + pg + '.html?live=0&t=dark&r=' + Date.now());
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    await page.screenshot({ path: GEN + 'dom-' + key + '.png' });
    out[pg] = await page.evaluate(() => { const bad = []; document.querySelectorAll('img').forEach((i) => { if (!i.naturalWidth) bad.push(i.getAttribute('src')); }); return bad.length; });
  }
  return out;
}
`);
fs.writeFileSync(path.join(__dirname, 'fig-dl.js'), `/* Figma 렌더 내려받기(대조 기준). */
const https = require('https'), fs = require('fs'), path = require('path');
const U = { '1-2634': '5829262b-91a3-4a18-808b-123c8589d003', '1-3482': '83f04a53-b8c8-4723-86e5-29b8786d0977', '1-4335': '0f062c23-b184-45ba-9bda-a2feddb6e4db', '1-52': 'fd50b4ca-8889-46a9-a755-451607b909ea', '1-912': '45fb4253-6a84-4393-a17a-040758bf870f', '1-1773': '31a9cd2c-3773-4ae9-a8ce-815bd97facdd', '1-6841': '154b3abd-1926-4240-95a2-f0d8315d65a5', '1-5184': 'e6af941c-4baf-4fe5-9cb8-b6f8233d9ed0', '1-6013': 'fcb3536f-2205-4e37-bfb6-643a294d9ea2', '1-7644': '4b79c924-4d3f-47c0-956f-6552785a763b', '1-8494': '3b061358-a514-406f-a4b6-d96c26f82f79' };
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { if (r.statusCode >= 300 && r.headers.location) { r.resume(); return get(r.headers.location).then(res, rej); } const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
(async () => { for (const k of Object.keys(U)) { const b = await get('https://www.figma.com/api/mcp/asset/' + U[k] + '.png'); fs.writeFileSync(path.join(__dirname, 'figma-' + k + '.png'), b); console.log(k, b.length); } })();
`);
console.log('ok');
