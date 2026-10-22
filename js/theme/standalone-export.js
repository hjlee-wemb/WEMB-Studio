/* ── 자립형 HTML 내보내기 · 컴포넌트 복사 모드 ── */

/* ===== 개발자 핸드오프 — 화면 시안을 자립형 HTML로 (전체 / 컴포넌트 공용) =====
   재현 원리: 마크업 + 스타일(테마 변수 포함)을 함께 담아야 색·모양이 그대로 나온다.
   · 색 변수는 .main의 인라인 style에, 레이아웃 변수(radius·gap·shadow…)는 :root(문서루트)에 실린다.
     → 내보낼 때 둘 다 옮겨야 시안이 재현된다. */
const escAttr = (s) => String(s).replace(/"/g, '&quot;');
function wembThemeInline() {
  const main = document.querySelector('.main');
  return {
    mode: (main && main.getAttribute('data-mode')) || document.documentElement.getAttribute('data-mode') || 'dark',
    version: (main && main.getAttribute('data-version')) || '',
    mainStyle: (main && main.getAttribute('style')) || '',
    rootStyle: document.documentElement.getAttribute('style') || '',
  };
}
/* 로고 <img src="src/logo.svg">는 상대경로라 내려받은 파일에선 깨진다 → 원본 SVG를 data URI로 심어 자립화 */
async function inlineLogo(rootEl) {
  const imgs = rootEl.querySelectorAll('img.wlogo, img[src="src/logo.svg"]');
  if (!imgs.length) return;
  try {
    const svg = await fetch('src/logo.svg').then((r) => (r.ok ? r.text() : ''));
    if (!svg) return;
    const uri = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    imgs.forEach((im) => im.setAttribute('src', uri));
  } catch (e) {
    /* 실패해도 나머지는 그대로 내보냄 */
  }
}
/* 내보낸 정적 HTML에서도 '조각 호버 툴팁'(data-tip 계열)이 그대로 동작하도록,
   스튜디오 스크립트와 무관하게 자립 실행되는 최소 런타임을 함께 심는다.
   · 도넛·게이지·진행률·히트맵·막대 등 data-tip이 붙은 조각 호버는 모두 재현된다.
   · 축 꺾은선 차트의 크로스헤어(bindPlotTip)는 실시간 데이터 클로저가 필요해 제외.
   주의: 이 문자열은 스튜디오 <script> 안에 있으므로 종료 태그는 <\/script>로 이스케이프해야 한다. */
function wembTipRuntime() {
  return `<script>
(function(){
  var root=document.querySelector('.main')||document.body,el=null;
  function node(){ if(el&&el.isConnected)return el; el=document.createElement('div'); el.className='chart-tip'; root.appendChild(el); return el; }
  function place(x,y){ var t=node(),w=t.offsetWidth,h=t.offsetHeight,L=x+16,T=y-h-14;
    if(L+w>window.innerWidth-8)L=x-16-w; if(L<8)L=8; if(T<8)T=y+20;
    if(T+h>window.innerHeight-8)T=Math.max(8,window.innerHeight-8-h);
    t.style.transform='translate('+Math.round(L)+'px,'+Math.round(T)+'px)'; }
  function show(html,x,y){ var t=node(); t.innerHTML=html; t.classList.add('on'); place(x,y); }
  function hide(){ if(el)el.classList.remove('on'); }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
  function row(name,val,color){ return '<div class="tt-r">'+(color?'<i style="background:'+color+'"></i>':'')+'<span>'+esc(name)+'</span>'+(val!=null?'<b>'+esc(val)+'</b>':'')+'</div>'; }
  function head(t){ return t?'<div class="tt-h">'+esc(t)+'</div>':''; }
  function panelTitle(e){ var p=e.closest('.panel'); var h=p&&p.querySelector('.ph h3'); return h?h.textContent.trim():''; }
  function build(e){
    if(e.dataset&&e.dataset.tip!=null) return head(e.dataset.tipH)+row(e.dataset.tip,e.dataset.tipV,e.dataset.tipC);
    if(e.classList.contains('mini')){ var b=e.querySelector('.d b'); if(!b)return ''; return head(panelTitle(e))+row(e.textContent.replace(b.textContent,'').trim(),b.textContent.trim(),'var(--point-main)'); }
    if(e.classList.contains('prow')){ var nm=e.querySelector('.nm'),pv=e.querySelector('.pv'); if(!nm)return ''; var hd=panelTitle(e);
      for(var p=e.parentElement&&e.parentElement.previousElementSibling;p;p=p.previousElementSibling){ if(p.classList.contains('sec-lab')){ hd=hd?hd+' · '+p.textContent.trim():p.textContent.trim(); break; } }
      return head(hd)+row(nm.textContent.trim(),pv?pv.textContent.trim():null,'var(--point-main)'); }
    if(e.classList.contains('row')){ var b2=e.querySelector('b'),i=e.querySelector('i'); if(!b2)return ''; return head(panelTitle(e))+row(e.textContent.replace(b2.textContent,'').trim(),b2.textContent.trim(),i?i.style.background:''); }
    return '';
  }
  var SEL='[data-tip], .mini, .prow, .dleg .row, .hcell',cur=null,curMove=null;
  document.addEventListener('mouseover',function(ev){
    var e=ev.target.closest?ev.target.closest(SEL):null; if(!e||e===cur)return;
    var h=build(e); if(!h)return;
    if(cur&&curMove)cur.removeEventListener('mousemove',curMove);
    var move=function(m){ place(m.clientX,m.clientY); };
    var leave=function(){ e.removeEventListener('mousemove',move); if(cur!==e)return; cur=null; curMove=null; hide(); };
    cur=e; curMove=move; e.addEventListener('mousemove',move); e.addEventListener('mouseleave',leave,{once:true});
    show(h,ev.clientX,ev.clientY);
  });
})();
<\/script>`;
}
/* 페이지 전체 <style>을 모아 넣고, 테마 변수를 html/.main에 얹은 자립형 문서 골격
   opts.css  — 모은 스타일을 바꿔 넣을 때(그림 주소를 파일 안 데이터로 바꾼 것)
   opts.font — 글꼴 <style>(파일 안에 담은 Pretendard). 없으면 로컬 사본 + CDN 링크 */
function wembStandaloneDoc(bodyHTML, extraCSS, opts) {
  opts = opts || {};
  const t = wembThemeInline();
  const css = opts.css != null ? opts.css : collectAppCss();
  let pageBg = '#0f1320';
  try {
    pageBg = themeCoreMap(captureTheme())['bg/page'] || pageBg;
  } catch (e) {}
  return `<!doctype html>
<html lang="ko" data-mode="${t.mode}" style="${escAttr(t.rootStyle)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WEMB 화면 시안</title>
    ${opts.font ? '<style>' + opts.font + '</style>' : wembFontLinks()}
    <style>${css}</style>
    <style>
      html, body { margin: 0; padding: 0; background: ${pageBg}; }
      .main { width: 100%; box-sizing: border-box; }
${extraCSS || ''}
    </style>
  </head>
  <body>
${bodyHTML}
${wembTipRuntime()}
${opts.tail || ''}
  </body>
</html>`;
}
/* ── 자립화 — 화면에 쓰인 그림 · 글꼴을 파일 안(data URI)에 담는다 ──
   예전엔 그림 주소(src/…)가 상대 경로로 남아, 내려받은 파일을 다른 PC 에서 열면 템플릿 그림 · 배경이 다 빠졌고
   글꼴은 CDN 이라 인터넷이 없으면 바뀌었다. 지금은 화면에 실제로 보이는 것만 골라 담는다
   (스타일시트에 있지만 이 화면에 안 쓰인 그림은 담지 않는다 — 파일이 터무니없이 커지지 않게). */
const SA_URL_RE = /url\(\s*(['"]?)([^'")]+?)\1\s*\)/g;
const saInline = (u) => /^(data:|blob:|#|about:|javascript:)/i.test(String(u).trim());
const saAbs = (u) => { try { return new URL(String(u).trim(), document.baseURI).href; } catch (e) { return u; } };
const saSameOrigin = (u) => { try { return new URL(u).origin === location.origin; } catch (e) { return false; } };
/* 살아 있는 화면에서 실제로 그려지는 그림 주소 — 계산된 스타일(배경 · 마스크 · 앞뒤 가상 요소) + 그림 요소 */
function saUsedUrls(liveRoot) {
  const used = new Set();
  const take = (v) => { if (!v || v === 'none') return; String(v).replace(SA_URL_RE, (m, q, u) => { if (!saInline(u)) used.add(saAbs(u)); return m; }); };
  const PROPS = ['backgroundImage', 'maskImage', 'webkitMaskImage', 'borderImageSource', 'listStyleImage'];
  liveRoot.querySelectorAll('*').forEach((el) => {
    if (el.tagName === 'IMG') {
      if (el.currentSrc && !saInline(el.currentSrc)) used.add(saAbs(el.currentSrc));
      take(getComputedStyle(el).content); // content:url() 로 바꿔 끼운 그림
    }
    if (el.tagName === 'image' || el.tagName === 'IMAGE') { const h = el.getAttribute('href') || el.getAttribute('xlink:href'); if (h && !saInline(h)) used.add(saAbs(h)); }
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    PROPS.forEach((p) => take(cs[p]));
    ['::before', '::after'].forEach((ps) => { const c = getComputedStyle(el, ps); if (c.content && c.content !== 'none' && c.content !== 'normal') { take(c.backgroundImage); take(c.maskImage || c.webkitMaskImage); take(c.content); } });
  });
  return used;
}
const saBlobToData = (blob) => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });
/* 주소 목록을 받아(같은 출처만) data URI 로 — 6개씩 나눠 받는다 */
async function saFetchAll(urls, onProgress) {
  const out = new Map(), list = [...urls].filter(saSameOrigin);
  let i = 0, done = 0;
  const worker = async () => {
    while (i < list.length) {
      const u = list[i++];
      try {
        const r = await fetch(u);
        if (r.ok) { const b = await r.blob(); if (b.size < 30 * 1048576) out.set(u, await saBlobToData(b)); }
      } catch (e) { /* 못 받은 그림은 주소 그대로 둔다 */ }
      done++;
      if (onProgress) onProgress(done, list.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(6, list.length) }, worker));
  return out;
}
/* 스타일 문자열의 url(…) 을 data URI 로(담은 것만) */
const saSwapCss = (css, map) => css.replace(SA_URL_RE, (m, q, u) => { if (saInline(u)) return m; const d = map.get(saAbs(u)); return d ? 'url("' + d + '")' : m; });
/* 글꼴 — 앱 기본 글꼴(Pretendard 가변) + 스타일에 선언된 같은 출처 글꼴을 파일 안에 */
let saFontCache = null;
async function saFontCss() {
  if (saFontCache) return saFontCache;
  const r = await fetch('src/vendor/pretendard/PretendardVariable.woff2');
  if (!r.ok) throw new Error('font');
  const d = await saBlobToData(await r.blob());
  const face = (fam) => "@font-face{font-family:'" + fam + "';font-weight:45 920;font-style:normal;font-display:swap;src:url(\"" + d + "\") format('woff2-variations'),url(\"" + d + "\") format('woff2');}";
  saFontCache = face('Pretendard Variable') + face('Pretendard');
  return saFontCache;
}
function saFontUrls(css) {
  const used = new Set();
  (css.match(/@font-face\s*{[^}]*}/g) || []).forEach((block) => block.replace(SA_URL_RE, (m, q, u) => { if (!saInline(u)) used.add(saAbs(u)); return m; }));
  return used;
}

/* (전체) 오른쪽 프리뷰 .main을 통째로 — 편집 UI·복사 버튼은 걷어내고, 그림 · 글꼴까지 담아 인터넷 없이도 열린다.
   고객에게 보기 전용으로 보내거나 개발자에게 넘기는 파일이다(실시간 움직임 · 3D 조작은 빠지고 지금 모습 그대로). */
async function exportPreviewHTML() {
  exHintMsg('화면 시안 HTML을 만드는 중…');
  try {
    const main = document.querySelector('.main');
    /* 그림을 CSS content:url() 로 바꿔 끼운 <img>(템플릿의 라이트 테마 그림 — img[src$=…] 규칙)는 src 를 data 로 바꾸면
       그 규칙이 더는 맞지 않는다 → 지금 보이는 그림을 복제본의 인라인 스타일로 박아 둔다. 짝을 찾으려고 잠깐 번호를 단다 */
    const liveImgs = [...main.querySelectorAll('img')];
    liveImgs.forEach((im, i) => im.setAttribute('data-sa-i', i));
    const clone = main.cloneNode(true);
    liveImgs.forEach((im) => im.removeAttribute('data-sa-i'));
    clone.querySelectorAll('img[data-sa-i]').forEach((im) => {
      const live = liveImgs[+im.getAttribute('data-sa-i')];
      im.removeAttribute('data-sa-i');
      const c = live && getComputedStyle(live).content;
      if (c && c.indexOf('url(') >= 0) im.setAttribute('style', (im.getAttribute('style') || '') + ';content:' + c);
    });
    if (window.WEMB3D) WEMB3D.bakeClone(clone); /* 3D 캔버스 → 지금 모습 그림 */
    clone.querySelectorAll('.editbanner, .previewhint, .compcopy, .pdel').forEach((el) => el.remove());
    clone.classList.remove('editing', 'content-editing');
    clone.querySelectorAll('.editing, .content-editing').forEach((el) => el.classList.remove('editing', 'content-editing'));
    await inlineLogo(clone);

    /* 1) 그림 · 글꼴 고르기 — 화면에 실제로 그려지는 것 + 스타일에 선언된 글꼴 */
    const css = collectAppCss();
    const used = saUsedUrls(main);
    clone.querySelectorAll('img[src]').forEach((im) => { const s = im.getAttribute('src'); if (!saInline(s)) used.add(saAbs(s)); });
    clone.querySelectorAll('[style*="url("]').forEach((el) => el.getAttribute('style').replace(SA_URL_RE, (m, q, u) => { if (!saInline(u)) used.add(saAbs(u)); return m; }));
    saFontUrls(css).forEach((u) => used.add(u));

    /* 2) 받아서 data URI 로 */
    const map = await saFetchAll(used, (d, n) => { if (n > 4 && (d % 4 === 0 || d === n)) exHintMsg('그림 · 글꼴을 파일에 담는 중… ' + d + ' / ' + n); });
    let font = '';
    try { font = await saFontCss(); } catch (e) { /* 글꼴을 못 담으면 링크로 */ }

    /* 3) 바꿔 끼우기 — 그림 요소 · 인라인 스타일 · 스타일시트 */
    clone.querySelectorAll('img[src]').forEach((im) => { const d = map.get(saAbs(im.getAttribute('src'))); if (d) im.setAttribute('src', d); im.removeAttribute('srcset'); im.removeAttribute('loading'); });
    clone.querySelectorAll('image').forEach((im) => {
      ['href', 'xlink:href'].forEach((a) => { const h = im.getAttribute(a); if (h && !saInline(h)) { const d = map.get(saAbs(h)); if (d) im.setAttribute(a, d); } });
    });
    clone.querySelectorAll('[style*="url("]').forEach((el) => el.setAttribute('style', saSwapCss(el.getAttribute('style'), map)));

    /* 4) 크기 — 화면은 스튜디오에서 보던 크기 그대로 두고, 여는 창에 맞춰 통째로 줄이고 늘린다(가운데 정렬).
       템플릿 시안은 칸에 맞추는 스크립트가 빠지므로, 그대로 두면 창 크기가 다를 때 아래 기본 화면이 비쳤다 */
    const box = main.getBoundingClientRect();
    const W = Math.max(1, Math.round(box.width)), H = Math.max(1, Math.round(box.height));
    const fitCss = 'html, body { width: 100%; height: 100%; overflow: hidden; }\n' +
      '      .main { position: absolute !important; left: 0; top: 0; width: ' + W + 'px !important; height: ' + H + 'px !important; flex: none !important; transform-origin: 0 0; }';
    const fitJs = '<script>(function(){var m=document.querySelector(".main");if(!m)return;var W=' + W + ',H=' + H + ';' +
      'function fit(){var s=Math.min(innerWidth/W,innerHeight/H);m.style.transform="translate("+(innerWidth-W*s)/2+"px,"+(innerHeight-H*s)/2+"px) scale("+s+")";}' +
      'addEventListener("resize",fit);fit();})();<\/script>';
    const doc = wembStandaloneDoc('    ' + clone.outerHTML, fitCss, { css: saSwapCss(css, map), font, tail: fitJs });
    downloadBlob(new Blob([doc], { type: 'text/html;charset=utf-8' }), 'wemb-screen.html');
    const mb = (doc.length / 1048576).toFixed(1);
    exHintMsg('화면 전체를 HTML 한 파일로 저장했어요(' + mb + 'MB · 그림 ' + map.size + '개 담음) — 인터넷 없이도 열려, 고객에게 보기 전용으로 보낼 수 있어요.', 'ok');
  } catch (e) {
    exHintMsg('내보내기에 실패했어요. 다시 시도해 주세요.', 'err');
  }
}
/* 인라인 style 문자열("--a: b; --c: d")에서 CSS 변수 선언만 뽑아냄 */
function pickCssVars(styleStr) {
  return (styleStr || '')
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('--'));
}
/* (개별) 카드 하나를 HTML / CSS / JS 세 조각으로 분리해서 돌려준다.
   HTML은 같은 선택자 맥락(.main>.stage>…)에 감싸고, 색·레이아웃 변수는 CSS 쪽 :root/.main 규칙으로 옮긴다.
   → 세 조각을 (CodePen처럼) HTML/CSS/JS 칸에 넣으면 시안 그대로 재현된다. */
function componentParts(node) {
  const t = wembThemeInline();
  const clone = node.cloneNode(true);
  clone.querySelectorAll('.compcopy, .pdel').forEach((el) => el.remove()); /* 복사·삭제 버튼은 제외 */
  const isDt = node.classList.contains('dt-card');
  const inner = isDt
    ? `      <div class="dtstage">\n${clone.outerHTML}\n      </div>`
    : `      <div class="cols">\n        <div class="col">\n${clone.outerHTML}\n        </div>\n      </div>`;
  const versionAttr = t.version ? ` data-version="${t.version}"` : '';
  const html = `<div class="main" data-mode="${t.mode}"${versionAttr}>\n  <div class="stage">\n${inner}\n  </div>\n</div>`;

  const rootVars = pickCssVars(t.rootStyle);
  const mainVars = pickCssVars(t.mainStyle);
  const allCss = collectAppCss();
  const css =
    `/* ── WEMB 테마 변수 — 색은 .main, 모서리·간격 등 레이아웃은 :root 에 ── */\n` +
    `:root {\n${rootVars.map((v) => '  ' + v + ';').join('\n')}\n}\n` +
    `.main {\n${mainVars.map((v) => '  ' + v + ';').join('\n')}\n}\n\n` +
    `/* ── 컴포넌트 스타일 (WEMB Studio 전체 스타일시트) ── */\n` +
    allCss;

  /* 프리뷰의 차트는 이미 정적 SVG로 마크업에 포함되어, 화면 재현엔 JS가 필요 없다.
     JS 조각으로는 '조각 호버 툴팁'을 살리는 자립 런타임만 제공한다
     (data-tip 계열 — 도넛·게이지·막대·히트맵 등. 축 꺾은선 크로스헤어는 실시간 데이터가 필요해 제외).
     CodePen 등의 JS 칸에 그대로 붙이면 호버 툴팁이 동작한다. */
  const runtime = wembTipRuntime().replace(/^<script>\n?/, '').replace(/<\/script>\s*$/, '');
  const js =
    `/* 정적 시안은 HTML+CSS만으로 그대로 재현됩니다 (차트는 SVG로 포함됨).\n` +
    `   아래는 조각 호버 툴팁을 살리는 자립 런타임입니다 — 동적 동작이 필요할 때만 넣으세요. */\n\n` +
    runtime.trim();
  return { html, css, js };
}
/* (전체) HTML+CSS를 한 파일로 — 열면 바로 그 컴포넌트가 시안 그대로 렌더된다 (정적이라 JS 불필요) */
function componentFullDoc(node) {
  const parts = componentParts(node);
  const t = wembThemeInline();
  let pageBg = '#0f1320';
  try {
    pageBg = themeCoreMap(captureTheme())['bg/page'] || pageBg;
  } catch (e) {}
  return `<!doctype html>
<html lang="ko" data-mode="${t.mode}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WEMB 컴포넌트</title>
    ${wembFontLinks()}
    <style>
${parts.css}
    </style>
    <style>
      html, body { margin: 0; padding: 24px; background: ${pageBg}; }
    </style>
  </head>
  <body>
${parts.html}
${wembTipRuntime()}
  </body>
</html>`;
}
/* ── 컴포넌트 복사 모드 ──
   내보내기 모달의 '컴포넌트별 코드 복사' → 모달을 닫고 화면으로 돌아가 이 모드를 켠다.
   모드일 때만 각 카드에 '복사' 버튼(호버 시 노출)을 달고, 상단 배너로 상태를 알린다.
   한 번 복사하면 배너를 '복사 완료'로 잠깐 보여준 뒤 배너·버튼을 모두 걷어내고 모드 종료. */
let __copyModeActive = false;
function injectCompButtons() {
  document.querySelectorAll('.main .panel, .main .dt-card').forEach((c) => {
    if (c.querySelector(':scope > .compcopy')) return;
    const g = document.createElement('div');
    g.className = 'compcopy';
    g.innerHTML =
      '<button type="button" data-part="html" title="이 컴포넌트의 HTML 마크업 복사">HTML</button>' +
      '<button type="button" data-part="css" title="테마 변수 + 스타일 복사">CSS</button>' +
      '<button type="button" data-part="js" title="동적 동작용 스크립트 복사">JS</button>' +
      '<button type="button" data-part="all" class="cpall" title="HTML+CSS를 한 파일로 — 열면 바로 시안 그대로">전체</button>';
    c.appendChild(g);
  });
}
function removeCompButtons() {
  document.querySelectorAll('.main .compcopy').forEach((el) => el.remove());
}
function startComponentCopyMode() {
  closeExport(); /* 화면으로 돌아감 */
  __copyModeActive = true;
  /* 대시보드는 .stage, 데이터테이블 화면은 .dtstage에 카드가 있으므로 둘 다 켠다 */
  document.querySelectorAll('.main .stage, .main .dtstage').forEach((el) => el.classList.add('copymode'));
  injectCompButtons();
  const bar = document.getElementById('copyBar');
  document.getElementById('copyBarMsg').textContent = '컴포넌트 복사 중 — 각 카드 오른쪽 위의 HTML · CSS · JS · 전체 버튼을 눌러 복사하세요';
  bar.classList.remove('done');
  bar.classList.add('show');
}
function endComponentCopyMode() {
  __copyModeActive = false;
  removeCompButtons(); /* 복사할 수 있는 것들 다시 숨김 */
  document.querySelectorAll('.main .stage.copymode, .main .dtstage.copymode').forEach((el) => el.classList.remove('copymode'));
  const bar = document.getElementById('copyBar');
  bar.classList.remove('show', 'done'); /* 알림 끔 */
}
/* 클립보드 복사 — file://나 창이 비활성일 때 navigator.clipboard가 거부되면
   textarea + execCommand('copy')로 폴백해서 '컴포넌트별 복사'가 항상 되게 한다. */
async function copyTextRobust(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* 아래 폴백으로 진행 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) {
    return false;
  }
}
function initComponentCopyMode() {
  const modeBtn = document.getElementById('exCompMode');
  if (modeBtn) modeBtn.onclick = startComponentCopyMode;
  const cancel = document.getElementById('copyBarCancel');
  if (cancel) cancel.onclick = endComponentCopyMode;
  const main = document.querySelector('.main');
  if (main) {
    main.addEventListener('click', async (e) => {
      if (!__copyModeActive) return;
      const btn = e.target.closest('.compcopy button');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const comp = btn.closest('.panel, .dt-card');
      if (!comp) return;
      const part = btn.dataset.part; /* html | css | js | all */
      const bar = document.getElementById('copyBar');
      const msg = document.getElementById('copyBarMsg');
      const LABEL = { html: 'HTML', css: 'CSS', js: 'JS', all: '전체' };
      try {
        const text = part === 'all' ? componentFullDoc(comp) : componentParts(comp)[part] || '';
        const ok = await copyTextRobust(text);
        if (!ok) throw new Error('copy failed');
        /* 여러 조각을 이어서 담을 수 있게 모드는 유지. 방금 누른 버튼만 잠깐 체크 표시 */
        const label = btn.textContent;
        btn.classList.add('done');
        btn.textContent = '✓';
        msg.textContent = `${LABEL[part]} 복사됨 — 다른 조각/카드도 이어서 복사하거나 “취소”로 끝내세요`;
        setTimeout(() => {
          btn.classList.remove('done');
          btn.textContent = label;
        }, 1000);
      } catch (err) {
        msg.textContent = '복사 권한이 없어요 — 브라우저에서 클립보드 접근을 허용해 주세요.';
      }
    });
  }
  /* Esc로 모드 취소 */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && __copyModeActive) endComponentCopyMode();
  });
}
