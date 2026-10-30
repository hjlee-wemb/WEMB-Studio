/* 등록물 전부를 한 장에 펼쳐 보는 점검 시트 — 스튜디오(studio.html)를 연 브라우저 콘솔에서 실행한다.
   라이브러리와 같은 방식(.hj-asset 감싸기 + GROUP 은 .hj-ofs 로 당기기)으로 그려, 잘림 · 빈 칸 · 자리 어긋남을 눈으로 본다.
     shSheet('dark')  /  shSheet('light')  /  shSheet(null) 로 닫기                                   */
window.shSheet = function (theme) {
  const old = document.getElementById('sh-sheet');
  if (old) old.remove();
  if (!theme) return;
  const A = window.__SHINHAN_ASSETS;
  const html = {};
  Object.keys(A.screens).forEach((px) => {
    const S = A.screens[px];
    html[px] = window[S.build](S.base);
    [[px + '-style', window[S.css]], [px + '-light-style', window[S.light]], [S.extra, S.extra && window[S.extra]]].forEach((p) => {
      if (!p[1] || document.getElementById(p[0])) return;
      const st = document.createElement('style');
      st.id = p[0];
      st.textContent = p[1];
      document.head.appendChild(st);
    });
  });
  const doc = {};
  Object.keys(html).forEach((px) => { doc[px] = new DOMParser().parseFromString('<div>' + html[px] + '</div>', 'text/html'); });
  const wrap = document.createElement('div');
  wrap.id = 'sh-sheet';
  wrap.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;padding:16px;display:flex;flex-wrap:wrap;gap:14px;align-content:flex-start;'
    + 'background:' + (theme === 'light' ? '#eef1f7' : '#0b1020');
  ['panels', 'charts', 'symbols'].forEach((cat) => A[cat].forEach((it) => {
    const el = doc[it.px].querySelector('[data-node-id="' + it.nid + '"]');
    let inner = el ? el.outerHTML : '';
    /* 라이브러리 hjUniqIds 와 같다 — 인라인 SVG 참조 id 를 사본마다 바꾼다 */
    const refs = new Set();
    inner.replace(/url\(#([^)\s"']+)\)|href="#([^"]+)"/g, (m, a, b) => { refs.add(a || b); return m; });
    const sfx = '-s' + (++window.__shSheetUid || (window.__shSheetUid = 1));
    if (refs.size) inner = inner.replace(/(\bid="|url\(#|href="#)([^)"\s']+)/g, (m, pre, name) => (refs.has(name) ? pre + name + sfx : m));
    if (it.ox != null) inner = '<div class="hj-ofs" style="--hjox:' + it.ox + 'px;--hjoy:' + it.oy + 'px">' + inner + '</div>';
    const k = Math.min(1, 440 / it.w, 300 / it.h);
    const cell = document.createElement('div');
    cell.style.cssText = 'outline:1px dashed #f0f;width:' + Math.ceil(it.w * k) + 'px;height:' + Math.ceil(it.h * k) + 'px;position:relative;overflow:hidden';
    cell.innerHTML = '<div class="' + it.px + '-root hj-asset ' + (A.screens[it.px].rootClass || '') + '" data-theme="' + theme + '" style="width:' + it.w + 'px;height:' + it.h + 'px;--k:' + k + ';transform-origin:0 0;position:absolute!important;left:0;top:0">' + inner + '</div>'
      + '<span style="position:absolute;left:0;bottom:0;font:11px sans-serif;color:#f0f;background:#000a">' + it.name + '</span>';
    wrap.appendChild(cell);
  }));
  document.body.appendChild(wrap);
};
