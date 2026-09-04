/* 디자인 컨텍스트가 준 에셋 URL을 그대로 내려받는다(손으로 그리지 않는다).
   같은 그림이 화면마다 다른 URL로 오므로 내용 해시로 중복을 없애고 이름을 통일한다. */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), https = require('https');
const OUT = path.join(__dirname, '..');           /* src/hanjin/ */
const SCREENS = {
  '65-429': 'dc-65-429.txt', '65-943': 'dc-65-943.txt', '65-2243': 'dc-65-2243.txt',
  /* 프로토타입 변형 세트 — 화면에 박제된 한 상태 말고 모든 상태의 그림이 필요하다
     (층선택 Map=1F~5F · 카메라 프리셋 Step=00~06) */
  '65-3345': 'dc-65-3345.txt', '116-2166': 'dc-116-2166.txt',
};

const kebab = (v) => v.replace(/^img/, '')
  .replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Za-z])(\d)/g, '$1-$2').toLowerCase();

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
  fs.writeFileSync(path.join(__dirname, 'asset-map.json'), JSON.stringify(map, null, 1));
  console.log('\nfetched', n, 'fail', fail, 'unique files', byHash.size);
})();
