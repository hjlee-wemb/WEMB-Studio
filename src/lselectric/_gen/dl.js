/* 디자인 컨텍스트가 준 에셋 URL을 그대로 내려받는다(손으로 그리지 않는다).
   같은 그림이 화면마다 다른 URL로 오므로 내용 해시로 중복을 없애고 이름을 통일한다. */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), https = require('https');
const OUT = path.join(__dirname, '..');           /* src/lselectric/ */
const SCREENS = {
  '3-5': 'dc-3-5.txt',
  '33-748': 'dc-33-748.txt',
  '76-597': 'dc-76-597.txt',
  '76-875': 'dc-76-875.txt',
  '94-5015': 'dc-94-5015.txt',
};
/* 인자로 화면 키를 주면 그것만 받는다(옛 화면의 에셋 URL 은 7일이면 만료된다) */
const ONLY = process.argv.slice(2).filter((a) => !a.startsWith('--'));
for (const k of Object.keys(SCREENS)) if (ONLY.length && !ONLY.includes(k)) delete SCREENS[k];

const kebab = (v) => v.replace(/^img/, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])(\d)/g, '$1-$2').toLowerCase();

/* 이미 받아 둔 표는 남긴다 — 이번에 받은 화면만 덮어쓴다 */
const MAPP = path.join(__dirname, 'asset-map.json');
const OLDMAP = fs.existsSync(MAPP) ? JSON.parse(fs.readFileSync(MAPP, 'utf8')) : {};

const jobs = [];
for (const [scr, f] of Object.entries(SCREENS)) {
  const s = fs.readFileSync(path.join(__dirname, f), 'utf8');
  for (const m of s.matchAll(/^const (\w+) = "([^"]+)";/gm)) {
    const ext = (m[2].match(/\.(\w+)$/) || [null, 'png'])[1];
    jobs.push({ scr, varName: m[1], url: m[2], ext, name: kebab(m[1]) });
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
  const byHash = new Map();     /* sha1 → 파일명 */
  /* 이미 폴더에 있는 그림도 해시로 알아 둔다 — 같은 그림이면 새 이름으로 또 받지 않는다 */
  for (const f of fs.readdirSync(OUT)) {
    if (!/\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f) || f.endsWith('-lt.svg')) continue;
    const h = crypto.createHash('sha1').update(fs.readFileSync(path.join(OUT, f))).digest('hex');
    if (!byHash.has(h)) byHash.set(h, f);
  }
  const map = {};               /* 화면별 varName → 파일명 */
  let n = 0, fail = 0;
  for (let i = 0; i < jobs.length; i += 8) {
    const batch = jobs.slice(i, i + 8);
    const bufs = await Promise.all(batch.map((j) => get(j.url).catch((e) => { console.log('FAIL', j.varName, e.message); fail++; return null; })));
    batch.forEach((j, k) => {
      const b = bufs[k]; if (!b) return;
      const h = crypto.createHash('sha1').update(b).digest('hex');
      let file = byHash.get(h);
      if (!file) {
        file = j.name + '.' + j.ext;
        let c = 2; while (fs.existsSync(path.join(OUT, file)) && !byHash.has(h)) {
          /* 같은 이름 다른 내용 → 번호를 붙인다 */
          const prev = fs.readFileSync(path.join(OUT, file));
          if (crypto.createHash('sha1').update(prev).digest('hex') === h) break;
          file = j.name + '-' + c++ + '.' + j.ext;
        }
        fs.writeFileSync(path.join(OUT, file), b);
        byHash.set(h, file);
      }
      (map[j.scr] || (map[j.scr] = {}))[j.varName] = file;
      n++;
    });
    process.stdout.write('.');
  }
  fs.writeFileSync(MAPP, JSON.stringify(Object.assign({}, OLDMAP, map), null, 1));
  console.log('\nfetched', n, 'fail', fail, 'unique files', byHash.size);
})();
