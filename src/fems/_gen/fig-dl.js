/* Figma 렌더 내려받기(대조 기준, 1배). 주소는 get_screenshot 이 준 짧은 수명 URL. */
const https = require('https'), fs = require('fs'), path = require('path');
const U = { '2141-505': '39605858-3211-4288-a801-35ef28a235d3', '2142-296': '47b67189-5114-4861-9326-bfc05a0754cc', '2143-549': '91326601-022c-4c80-b699-79c68f815dd0', '2144-543': '75baf5a1-c23c-4d58-8ea0-904d986549c7', '2144-1312': 'c4e88f2b-2f7b-4319-87c6-c1246728a4e3', '2141-967': 'c795ca95-bf35-40cb-8587-5653ef0b4ebe' };
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { if (r.statusCode >= 300 && r.headers.location) { r.resume(); return get(r.headers.location).then(res, rej); } const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
(async () => { for (const k of Object.keys(U)) { const b = await get('https://www.figma.com/api/mcp/asset/' + U[k] + '.png'); fs.writeFileSync(path.join(__dirname, 'figma-' + k + '.png'), b); console.log(k, b.length); } })();
