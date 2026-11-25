const M=require('module');const fs=require('fs');
let s=fs.readFileSync('conv.js','utf8');
s=s.replace("const tree = parseNodes(rootJsx, { comps, assets }, Object.assign({}, assets))[0];","const tree = parseNodes(rootJsx, { comps, assets }, Object.assign({}, assets))[0]; console.error('ROOT', S.key, tree ? tree.tag + ' kids ' + tree.children.length : 'UNDEF', JSON.stringify(rootJsx.slice(0,80)));");
s=s.replace(/const results = SCREENS.map\(buildScreen\);[\s\S]*$/,"for (const S of SCREENS) { try { buildScreen(S); console.error('ok', S.key); } catch (e) { console.error('ERR', S.key, e.message); } }");
fs.writeFileSync('dbg-conv.js',s);
