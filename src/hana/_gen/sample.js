/* 두 이미지의 같은 사각형 영역 평균색 비교(면 색이 맞는지 확인) */
const fs = require('fs'), PNG = require('./png.js');
const [, , fa, fb, X, Y, W, H] = process.argv;
const A = PNG.decode(fs.readFileSync(fa)), B = PNG.decode(fs.readFileSync(fb));
const avg = (img) => { let r = 0, g = 0, b = 0, n = 0; for (let y = +Y; y < +Y + +H; y++) for (let x = +X; x < +X + +W; x++) { const i = (y * img.w + x) * 4; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++; } return [r / n, g / n, b / n].map((v) => v.toFixed(1)).join(','); };
console.log('A', avg(A), ' B', avg(B));
