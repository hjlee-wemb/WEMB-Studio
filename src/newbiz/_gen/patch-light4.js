const fs=require('fs');
let m=fs.readFileSync('mk-light-newbiz.js','utf8');
m=m.replace("grad('a', '#d8eefb', '#b7ddf5') + grad('b', '#c9e6f8', '#a9d4f0') + grad('c', '#dff2fc', '#c1e2f6') + grad('d', '#cdeaf7', '#aad8ee') + grad('e', '#d3ebfa', '#b3daf3') + grad('s', '#a8d6f2', '#86c3e9')",
 "grad('a', '#c6e5f9', '#9dd0f0') + grad('b', '#b6ddf6', '#8cc6ec') + grad('c', '#d0ebfb', '#a9d7f3') + grad('d', '#bbe2f5', '#8fcbe8') + grad('e', '#c1e2f8', '#98cdf0') + grad('s', '#8fcaee', '#6db3e2')");
m=m.replace('stroke="#7fbbe2" stroke-width="2.4"','stroke="#5da6d6" stroke-width="2.6"');
fs.writeFileSync('mk-light-newbiz.js',m);
let s=fs.readFileSync('mk-screen-css.js','utf8');
s=s.replace(`L('[data-name="Continent"]{filter:saturate(.62) brightness(1.42) contrast(.86);}'),`,`L('[data-name="Continent"]{filter:saturate(.5) brightness(1.62) contrast(.78);}'),`);
s=s.replace(`L('[data-name="Hotspot"] [data-name="Pattern"]{opacity:.75;}'),`,`L('[data-name="Hotspot"] [data-name="Pattern"]{opacity:.75;}'),
  L('[data-name="Hotspot"] [data-name="Marker"]{filter:brightness(1.7) saturate(.75);opacity:.65;}'),`);
s=s.replace(`L('[data-name^="Th/"] p{color:#2c3e54!important;}'),`,`L('[data-name^="Th/"] [data-name="Background"] *{background:none!important;box-shadow:none!important;}'),
  L('[data-name^="Th/"] p{color:#2c3e54!important;}'),`);
fs.writeFileSync('mk-screen-css.js',s);
