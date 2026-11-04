const fs=require('fs'),PNG=require('./png.js');
const [,,src,out,spec]=process.argv;const im=PNG.decode(fs.readFileSync(src));
const boxes=JSON.parse(spec);const k=2;const W=Math.max(...boxes.map(b=>b[2]))*k;const H=boxes.reduce((s,b)=>s+b[3]*k+6,0);
const buf=Buffer.alloc(W*H*4,255);let oy=0;
for(const [x0,y0,w,h] of boxes){for(let y=0;y<h*k;y++)for(let x=0;x<w*k;x++){const si=((y0+(y/k|0))*im.w+(x0+(x/k|0)))*4,di=((oy+y)*W+x)*4;buf[di]=im.data[si];buf[di+1]=im.data[si+1];buf[di+2]=im.data[si+2];buf[di+3]=255;}oy+=h*k+6;}
fs.writeFileSync(out,PNG.encode(W,H,buf));console.log('wrote',out,W,H);
