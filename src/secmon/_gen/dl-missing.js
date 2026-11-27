/* asset-map.json 에 없는(202 로 실패한) 에셋만 다시 받는다 — 202 면 기다렸다 재시도. 실행: node dl-missing.js */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), https = require('https');
const OUT = path.join(__dirname, '..');
const MAPP = path.join(__dirname, 'asset-map.json');
const map = JSON.parse(fs.readFileSync(MAPP, 'utf8'));
const kebab = (v) => v.replace(/^img/, '').replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])(\d)/g, '$1-$2').toLowerCase();
const KEYS = ['1-3', '96-7914', '56-3639', '42-4769', '50-5951', '63-3639', '66-10016', '76-4561', '77-6526', '84-8482', '22-770'];
const jobs = [];
for (const k of KEYS) {
  const s = fs.readFileSync(path.join(__dirname, 'dc-' + k + '.txt'), 'utf8');
  map[k] = map[k] || {};
  for (const m of s.matchAll(/^const (\w+) = "([^"]+)";/gm)) if (!map[k][m[1]]) jobs.push({ k, v: m[1], url: m[2], ext: (m[2].match(/\.(\w+)$/) || [0, 'png'])[1] });
}
const byHash = new Map();
for (const f of fs.readdirSync(OUT)) { const p = path.join(OUT, f); if (fs.statSync(p).isFile()) byHash.set(crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex'), f); }
const get = (url, r = 0) => new Promise((res, rej) => https.get(url, (x) => {
  if (x.statusCode >= 300 && x.statusCode < 400 && x.headers.location && r < 5) { x.resume(); return get(x.headers.location, r + 1).then(res, rej); }
  if (x.statusCode !== 200) { x.resume(); return rej(new Error(String(x.statusCode))); }
  const c = []; x.on('data', (d) => c.push(d)); x.on('end', () => res(Buffer.concat(c)));
}).on('error', rej));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  console.log('missing', jobs.length);
  let ok = 0;
  for (const j of jobs) {
    let buf = null;
    for (let t = 0; t < 8 && !buf; t++) { try { buf = await get(j.url); } catch (e) { await sleep(3000); } }
    if (!buf) { console.log('FAIL', j.k, j.v); continue; }
    const h = crypto.createHash('sha1').update(buf).digest('hex');
    let name = byHash.get(h);
    if (!name) {
      let base = kebab(j.v), n = base + '.' + j.ext, i = 2;
      while (fs.existsSync(path.join(OUT, n))) n = base + '-' + (i++) + '.' + j.ext;
      fs.writeFileSync(path.join(OUT, n), buf); byHash.set(h, n); name = n;
    }
    map[j.k][j.v] = name; ok++;
  }
  fs.writeFileSync(MAPP, JSON.stringify(map, null, 1));
  console.log('ok', ok);
})();
