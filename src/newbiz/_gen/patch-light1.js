const fs=require('fs');
let m=fs.readFileSync('mk-screen-css.js','utf8');
m=m.replace(`L('[data-name^="Popup/"] > div:not([data-name]),[data-name="Widget/2040 Target"] > div:not([data-name]){background:#fff!important;background-image:none!important;box-shadow:none!important;}'),`,
`L('[data-name^="Popup/"] > div:not([data-name]),[data-name="Widget/2040 Target"] > div:not([data-name]):first-child{background:#fff!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Widget/2040 Target"] > div:not([data-name]):last-child{background:none!important;box-shadow:none!important;}'),
  L('[data-name*="(Selected)"] [data-name="Visual"] > *{box-shadow:none!important;background:none!important;}'),
  L('[data-name*="(Selected)"] [data-name="Visual"] img{filter:brightness(.56) contrast(1.25) drop-shadow(0 0 8px rgba(0,170,230,.75));}'),
  L('[data-name^="Flag/"]{border-radius:50%;box-shadow:0 0 0 1px #c3d2df;}'),`);
m=m.replace(`L('[data-name="Map Light"] > [data-name="Regions"]{filter:saturate(.95) brightness(1.12);}'),`,`L('[data-name="Map Light"] > [data-name="Regions"]{filter:saturate(.9) brightness(1.06);}'),`);
fs.writeFileSync('mk-screen-css.js',m);
let c=fs.readFileSync('conv.js','utf8');
/* Outline 그림은 번짐 몫만큼 상자보다 크다(dc: inset -1.32% -2.08%) */
c=c.replace("const O = big ? [740.25, 202.38, 508.65, 800] : [247, 307.7, 461, 725.06];","const OB = big ? [740.25, 202.38, 508.65, 800] : [247, 307.7, 461, 725.06];\n      const O = [OB[0] - OB[2] * .0208, OB[1] - OB[3] * .0132, +(OB[2] * 1.0416).toFixed(2), +(OB[3] * 1.0264).toFixed(2)];");
fs.writeFileSync('conv.js',c);
let d=fs.readFileSync('../../plant/_gen/mk-thumb.ps1','utf8');
const S=['wind','solar','energy','wind-input','solar-input','energy-input','measure','measure-wind','measure-solar','measure-popup','overseas'];
d=d.replace(/\$jobs = @\([\s\S]*?\n\)/,'$jobs = @(\n'+S.map(s=>"  @{ src = 'thumb-"+s+".png'; dst = 'newbiz-"+s+".jpg' }").join('\n')+'\n)');
fs.writeFileSync('mk-thumb.ps1',d);
console.log('ok');
