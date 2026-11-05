const fs=require('fs');
let m=fs.readFileSync('mk-light-newbiz.js','utf8');
const rep=(s,a,b)=>{if(!s.includes(a))throw new Error('없음 '+a);return s.replace(a,b);};
m=rep(m,"const lo = [52, 72, 92], hi = [150, 174, 194];","const lo = [116, 150, 180], hi = [166, 198, 222];");
m=rep(m,"[/^(icon|edit)/, { 'white': '#3d5368', '#7fd3fa': '#1c86bd', '#627b8e': '#55697c' }],","[/^(icon|edit)/, { 'white': '#7f96aa', '#7fd3fa': '#2f9fd8', '#627b8e': '#8499ac' }],");
fs.writeFileSync('mk-light-newbiz.js',m);
let s=fs.readFileSync('mk-screen-css.js','utf8');
s=rep(s,`L('[data-name="Solar Panel Image"] img{filter:drop-shadow(0 2px 3px rgba(24,60,96,.28));}'),`,`L('[data-name="Solar Panel Image"] img{filter:brightness(1.32) saturate(.88) drop-shadow(0 2px 3px rgba(24,60,96,.2));}'),`);
s=rep(s,`L('[data-name*="(Selected)"] [data-name="Solar Panel Image"] img{filter:drop-shadow(0 2px 8px rgba(0,150,210,.6));}'),`,`L('[data-name*="(Selected)"] [data-name="Solar Panel Image"] img{filter:brightness(1.32) saturate(.88) drop-shadow(0 2px 8px rgba(0,150,210,.6));}'),`);
s=rep(s,`L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.55);}'),`,`L('[data-name="Column/Labels"] [data-name="Visual"] img{filter:brightness(.82);}'),`);
s=rep(s,`L('[data-name="Track"]{opacity:.9;}'),`,`L('[data-name="Tabs"] > :not([data-hn-status="Select"]) *{border-color:transparent!important;}'),
  L('[data-name="Tabs"] > :not([data-hn-status="Select"])::after,[data-name="Tabs"] > :not([data-hn-status="Select"]) > div::after{border-color:' + LINE + '!important;}'),
  L('[data-name="Track"]{opacity:.9;}'),
  /* 편집 · 삭제 단추 — 회색 칸을 옅게 */
  L('[data-name="Button/Edit"],[data-name="Button/Delete"],[data-name="Button/Edit"] > *:not([data-name^="Icon/"]),[data-name="Icon Button"]{background-color:#f0f5f9!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name$="(Hover)"] [data-name="Icon Button"]{background-color:#e3f2fb!important;}'),
  /* 2040 칸 — 회색 덩어리 대신 흰 칸 + 아주 옅은 줄 */
  L('[data-name="Column/Labels"] [data-name="List"],[data-name^="Column/20"]{background:#fff!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"] > *,[data-name^="Column/20"] > [data-name^="Td/"]{background:transparent!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"] > * > div:not([data-name]),[data-name^="Column/20"] > [data-name^="Td/"] > div:not([data-name]){background:transparent!important;background-image:none!important;box-shadow:none!important;}'),
  L('[data-name="Column/Labels"] [data-name="List"] > :nth-child(2),[data-name^="Column/20"] > [data-name^="Td/"]:nth-child(2){background:#f6f9fc!important;}'),`);
fs.writeFileSync('mk-screen-css.js',s);
