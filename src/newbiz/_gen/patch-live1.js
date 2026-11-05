const fs=require('fs');let l=fs.readFileSync('live-src.js','utf8');
const k="    '.nb-root [data-name=\"Detail Callout\"] > [data-name=\"Leader\"]{animation:nbBreathe 2.6s ease-in-out infinite;}',";
if(!l.includes(k))throw new Error('anchor');
l=l.replace(k,k+"\n    '.nb-root [data-name=\"Detail Callout\"] > [data-name=\"Leader\"] img{filter:brightness(1.7);}',");
fs.writeFileSync('live-src.js',l);
