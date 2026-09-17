/* 화면을 **더 받을 때만** 쓰는 내려받기 — dl.js 와 같은 규칙(내용 해시로 중복 제거 · 이름 통일)이지만
   지정한 화면의 에셋만 받아 asset-map.json 에 **합친다**.

   왜 따로 두나 — dl.js 는 여섯 화면을 전부 다시 받는다. design context 의 에셋 주소는 며칠 뒤 만료되므로
   예전 화면까지 다시 받으려 들면 404 로 참조가 비고, 캔버스에서 뽑아 둔 그림(pin-assets)도 갈아 끼워진다.
   이미 폴더에 있는 그림과 내용이 같으면 그 파일 이름을 그대로 쓴다.

   실행: node src/posco/_gen/dl-add.js 1-9688 1-9770 1-9852 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), https = require('https');
const GEN = __dirname;
const OUT = path.join(GEN, '..');
const keys = process.argv.slice(2);
if (!keys.length) { console.error('사용법: node dl-add.js <key> …'); process.exit(1); }

const kebab = (v) => v.replace(/^img/, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])(\d)/g, '$1-$2').toLowerCase();
const sha = (b) => crypto.createHash('sha1').update(b).digest('hex');

/* 이미 있는 그림의 내용 해시 */
const byHash = new Map();
for (const f of fs.readdirSync(OUT)) {
  if (!/\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f) || /-lt\.svg$/.test(f)) continue;
  byHash.set(sha(fs.readFileSync(path.join(OUT, f))), f);
}

const jobs = [];
for (const k of keys) {
  const s = fs.readFileSync(path.join(GEN, 'dc-' + k + '.txt'), 'utf8');
  for (const m of s.matchAll(/^const (\w+) = "([^"]+)";/gm)) {
    const ext = (m[2].match(/\.(\w+)$/) || [null, 'png'])[1];
    jobs.push({ scr: k, varName: m[1], url: m[2], ext, name: kebab(m[1]) });
  }
}
console.log('assets to fetch:', jobs.length);

function get(url, redirects = 0) {
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && redirects < 5) {
        r.resume(); return get(r.headers.location, redirects + 1).then(res, rej);
      }
      if (r.statusCode !== 200) { r.resume(); return rej(new Error(r.statusCode + ' ' + url)); }
      const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => res(Buffer.concat(c)));
    }).on('error', rej);
  });
}

(async () => {
  const mapPath = path.join(GEN, 'asset-map.json');
  const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  let n = 0, fail = 0, fresh = 0;
  for (let i = 0; i < jobs.length; i += 8) {
    const batch = jobs.slice(i, i + 8);
    const bufs = await Promise.all(batch.map((j) => get(j.url).catch((e) => { console.log('FAIL', j.varName, e.message); fail++; return null; })));
    batch.forEach((j, k) => {
      const b = bufs[k]; if (!b) return;
      const h = sha(b);
      let file = byHash.get(h);
      if (!file) {
        file = j.name + '.' + j.ext;
        let c = 2;
        while (fs.existsSync(path.join(OUT, file))) file = j.name + '-' + c++ + '.' + j.ext;
        fs.writeFileSync(path.join(OUT, file), b);
        byHash.set(h, file);
        fresh++;
      }
      (map[j.scr] || (map[j.scr] = {}))[j.varName] = file;
      n++;
    });
    process.stdout.write('.');
  }
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 1));
  console.log('\nfetched', n, 'fail', fail, 'new files', fresh);
  if (fail) process.exitCode = 1;
})();
