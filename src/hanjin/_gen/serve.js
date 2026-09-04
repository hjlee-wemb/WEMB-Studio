/* 검증용 정적 서버 — file:// 은 fetch 가 막혀 있어 노드 상자 대조/스크린샷 때만 쓴다.
   실행: node src/hanjin/_gen/serve.js [port]  (기본 5503, 루트는 WEMB Studio 폴더) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const PORT = +(process.argv[2] || 5503);
const TYPE = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (e, buf) => {
    if (e) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404 ' + p); return; }
    res.writeHead(200, { 'content-type': TYPE[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(buf);
  });
}).listen(PORT, () => console.log('serving ' + ROOT + ' on http://localhost:' + PORT));
