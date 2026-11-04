/* 검증용 정적 서버 — 대조 · 스크린샷 때만 쓴다.
   POST /__save?f=<파일> 는 _gen 폴더에 측정 결과를 쓴다(mk-snap 의 snap-*.json).
   실행: node src/woori/_gen/serve.js [port]  (기본 5531, 루트는 WEMB Studio 폴더) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PORT = +(process.argv[2] || 5531);
const TYPE = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'POST' && u.pathname === '/__save') {
    const name = path.basename(u.searchParams.get('f') || '');
    const c = [];
    req.on('data', (d) => c.push(d));
    req.on('end', () => { fs.writeFileSync(path.join(__dirname, name), Buffer.concat(c)); res.writeHead(200).end('ok'); });
    return;
  }
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + p); return; }
    res.writeHead(200, { 'content-type': TYPE[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, () => console.log('serving ' + ROOT + ' on http://localhost:' + PORT));
