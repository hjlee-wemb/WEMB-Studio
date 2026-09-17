/* SOP 장면 미리보기 — src/posco/sop.html
   STEP 1 화면(pks1)을 얹고, 라이브 레이어(installSop)가 STEP 2·3 의 Step List 를 겹쳐 10초마다 넘긴다.
   스튜디오와 같은 경로(src/posco/…)를 쓰도록 <base href="../../"> 를 둔다 — 그래야 모듈의 에셋 경로와
   겹친 층의 CSS 경로가 스튜디오에서와 똑같이 풀린다.
   실행: node src/posco/_gen/mk-sop-preview.js   (conv.js · mk-live.js 뒤에) */
'use strict';
const fs = require('fs');
const path = require('path');
const STUDIO = path.join(__dirname, '..', '..', '..');
const stamp = (rel) => {
  const b = fs.readFileSync(path.join(STUDIO, rel));
  let h = 0; for (let i = 0; i < b.length; i++) h = (h * 31 + b[i]) >>> 0;
  return h.toString(36);
};
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<base href="../../">
<link rel="stylesheet" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css">
<title>SOP 대응 절차 STEP 1~3 — Figma 1:9688 · 1:9770 · 1:9852 재구축</title>
<style>
html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#05050a;}
.pks-fit{position:fixed;inset:0;overflow:hidden;}
.pks-stage{position:absolute;inset:0;overflow:hidden;}
</style></head><body><div class="pks-fit"><div class="pks-stage" id="stage"></div></div>
<script src="src/posco-sop1.js?v=${stamp('src/posco-sop1.js')}"></script>
<script src="src/posco-sop2.js?v=${stamp('src/posco-sop2.js')}"></script>
<script src="src/posco-sop3.js?v=${stamp('src/posco-sop3.js')}"></script>
<script src="src/posco-sop4.js?v=${stamp('src/posco-sop4.js')}"></script>
<script src="src/recent-time.js?v=1"></script>
<script src="src/posco-live.js?v=${stamp('src/posco-live.js')}"></script>
<button id="tt" style="position:fixed;right:12px;bottom:12px;z-index:99;padding:8px 14px;border-radius:8px;border:1px solid #8888;background:#fff8;font:13px system-ui;cursor:pointer">theme</button>
<script>(function(){
  ['pks1'].forEach(function(px){var G=px.toUpperCase();[[px+'-style',window[G+'_CSS']],[px+'-light-style',window[G+'_LIGHT_CSS']]].forEach(function(p){var s=document.createElement('style');s.id=p[0];s.textContent=p[1];document.head.appendChild(s);});});
  var q=new URLSearchParams(location.search);
  var r=document.createElement('div');r.className='pks1-root';r.dataset.theme=q.get('t')||'dark';
  r.innerHTML=window.build_pks1();document.getElementById('stage').appendChild(r);
  if(q.get('live')!=='0')window.initPosco&&window.initPosco(r);
  var tt=document.getElementById('tt');if(q.get('t'))tt.style.display='none';
  tt.onclick=function(){var t=r.dataset.theme==='light'?'dark':'light';document.querySelectorAll('.pks1-root,.pks2-root,.pks3-root,.pks4-root').forEach(function(e){e.dataset.theme=t;});};
})();</script>
</body></html>
`;
fs.writeFileSync(path.join(STUDIO, 'src', 'posco', 'sop.html'), html);
console.log('wrote src/posco/sop.html');
