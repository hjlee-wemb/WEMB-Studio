const fs=require('fs');let s=fs.readFileSync('conv.js','utf8');
const a="if (typeof v === 'string' && v.trim()) out.push({ tag: '#text', text: v });";
if(!s.includes(a)) throw 'a';
s=s.replace(a,"if (typeof v === 'string' && v.trim()) out.push({ tag: '#text', text: v });\n        else if (typeof v === 'string' && v.length && / /.test(v)) out.push({ tag: '#text', text: ' ', keepSpace: true });   /* {` `} — 값과 단위 사이 띄움(크기가 달라 span 으로 온다) */");
const b="        rules.push(ROOT + ' .' + uc + '>span{vertical-align:top}');";
if(!s.includes(b)) throw 'b';
s=s.replace(b,"        /* 크기가 다른 span(값 20px + 단위 10px)은 기준선 맞춤이라야 Figma 처럼 단위가 아래에 붙는다 — 위 붙임은 단위가 위첨자처럼 떴다 */\n        const sizes = new Set(node.children.filter((c) => c.tag === 'span').map((c) => { const m = /text-\[([\d.]+)px\]/.exec(typeof c.attrs.className === 'string' ? c.attrs.className : ''); return m ? m[1] : 'inherit'; }));\n        if (sizes.size <= 1) rules.push(ROOT + ' .' + uc + '>span{vertical-align:top}');");
fs.writeFileSync('conv.js',s);console.log('ok');
