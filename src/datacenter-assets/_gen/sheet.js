/* 카드 사진(cards/<테마>-<탭>-NN.png)을 한 장으로 붙인다. node sheet.js <테마> <탭> [열=6] */
const fs = require('fs'), path = require('path'), PNG = require('../../datacenter/_gen/png.js');
const [, , TH, TAB, C] = process.argv;
const cols = +(C || 6);
const dir = path.join(__dirname, 'cards');
const files = fs.readdirSync(dir).filter((f) => f.startsWith(TH + '-' + TAB + '-')).filter((f) => +(/-(\d+)\.png$/.exec(f) || [0, 0])[1] <= +(process.argv[5] || 999)).sort();
const imgs = files.map((f) => PNG.decode(fs.readFileSync(path.join(dir, f))));
const cw = Math.max(...imgs.map((i) => i.w)), ch = Math.max(...imgs.map((i) => i.h));
const rows = Math.ceil(imgs.length / cols), W = cw * cols, H = ch * rows;
const out = { w: W, h: H, data: Buffer.alloc(W * H * 4, 40) };
imgs.forEach((im, k) => {
  const ox = (k % cols) * cw, oy = Math.floor(k / cols) * ch;
  for (let y = 0; y < im.h; y++) im.data.copy(out.data, ((oy + y) * W + ox) * 4, y * im.w * 4, (y + 1) * im.w * 4);
});
fs.writeFileSync(path.join(__dirname, 'sheet-' + TH + '-' + TAB + '.png'), PNG.encode(out.w, out.h, out.data));
console.log('sheet', files.length, W + 'x' + H);
