/* Figma 렌더 내려받기(대조 기준, 1배). 주소는 get_screenshot 이 준 짧은 수명 URL. */
const https = require('https'), fs = require('fs'), path = require('path');
const U = { '427-674': '45d83440-2a24-4a03-96bf-072075d892be', '427-725': '41454b61-9307-41f2-a836-6be254a6c387', '427-959': '74523224-4924-4efa-9205-1ab371693705', '427-1003': '9767eed4-1fe7-4065-a44f-ea7b6d257218', '427-1364': '3456806c-e3fd-487c-ba1d-6951a63bc563', '427-1781': 'a827ce93-757d-4585-bdc0-64d4b764c80a' };
const get = (u) => new Promise((res, rej) => https.get(u, (r) => { if (r.statusCode >= 300 && r.headers.location) { r.resume(); return get(r.headers.location).then(res, rej); } const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => res(Buffer.concat(c))); }).on('error', rej));
(async () => { for (const k of Object.keys(U)) { const b = await get('https://www.figma.com/api/mcp/asset/' + U[k] + '.png'); fs.writeFileSync(path.join(__dirname, 'figma-' + k + '.png'), b); console.log(k, b.length); } })();
