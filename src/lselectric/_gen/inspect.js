global.window={};require(process.argv[2]);
const px=process.argv[3];const G=px.toUpperCase();
const html=window['build_'+px]('');const css=window[G+'_CSS'];
// print depth<=3 tags with data-name and class rule
const re=/<(\w+) id="([^"]*)" class="([^"]*)"(?: data-name="([^"]*)")?(?: data-node-id="([^"]*)")?/g;let m;
const lines=html.split('\n');
lines.forEach(l=>{const d=(l.match(/^ */)[0].length)/2;const mm=/<(\w+) id="([^"]*)" class="(\S+)[^"]*"(?: data-name="([^"]*)")?/.exec(l);if(!mm||d>4)return;
const rule=(css.match(new RegExp('\.'+mm[3]+'\{([^}]*)\}'))||[])[1]||'';
console.log(' '.repeat(d*2)+(mm[4]||mm[2])+'  ['+mm[3]+'] '+rule.slice(0,150));});
