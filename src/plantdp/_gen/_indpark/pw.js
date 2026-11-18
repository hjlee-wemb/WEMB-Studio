/* Playwright 를 Node 에서 직접 — MCP 브라우저가 다른 세션에 잡혀 있을 때.
   실행: node pw.js <스크립트.js> [인자…]  — 스크립트는 `async (page, args) => …` 를 내보내는 cap.js 꼴 */
'use strict';
const path = require('path');
const PW = 'C:/Users/wemb/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright';
const { chromium } = require(PW);
(async () => {
  const [script, ...args] = process.argv.slice(2);
  const src = require('fs').readFileSync(path.resolve(__dirname, script), 'utf8');
  // eslint-disable-next-line no-eval
  const fn = eval('(' + src.replace(/^\/\*[\s\S]*?\*\/\s*/, '') + ')');
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 200)); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 200)));
  globalThis.__ARGS = args;
  try { const r = await fn(page, args); console.log(JSON.stringify(r, null, 1)); }
  finally { await b.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
