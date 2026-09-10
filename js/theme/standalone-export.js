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
/* 페이지 전체 <style>을 모아 넣고, 테마 변수를 html/.main에 얹은 자립형 문서 골격 */
function wembStandaloneDoc(bodyHTML, extraCSS) {
  const t = wembThemeInline();
  const css = collectAppCss();
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
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable.min.css" />
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
  </body>
</html>`;
}
/* (전체) 오른쪽 프리뷰 .main을 통째로 — 편집 UI·복사 버튼은 걷어냄 */
async function exportPreviewHTML() {
  exHintMsg('화면 시안 HTML을 만드는 중…');
  try {
    const main = document.querySelector('.main');
    const clone = main.cloneNode(true);
    clone.querySelectorAll('.editbanner, .previewhint, .compcopy, .pdel').forEach((el) => el.remove());
    clone.classList.remove('editing', 'content-editing');
    clone.querySelectorAll('.editing, .content-editing').forEach((el) => el.classList.remove('editing', 'content-editing'));
    await inlineLogo(clone);
    const doc = wembStandaloneDoc('    ' + clone.outerHTML);
    downloadBlob(new Blob([doc], { type: 'text/html;charset=utf-8' }), 'wemb-screen.html');
    exHintMsg('화면 전체를 자립형 HTML로 저장했어요 — 열면 시안 그대로 재현됩니다.', 'ok');
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
    <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@latest/dist/web/variable/pretendardvariable.min.css" />
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
