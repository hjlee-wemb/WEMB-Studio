/* ── 해시 라우터 ── */

/* 주소가 곧 화면 상태다.
   '#/경로?쿼리' 를 읽어 등록된 화면(route)을 그리고, 화면을 바꾸는 코드는 주소만 바꾼다.
   그래서 새로고침 · 뒤로가기 · 주소 직접 입력 · 링크 공유가 버튼으로 온 것과 똑같이 그려진다.

   해시(#/…)를 쓰는 이유 — GitHub Pages 같은 정적 호스팅은 모르는 경로(/studio/prd)를
   index.html 로 돌려주지 않고 404 를 낸다. 해시는 서버로 가지 않으므로 어디서든 동작한다.

   전환은 동기다: navigate() 는 pushState 후 그 자리에서 화면을 그린다. 호출한 코드가
   바로 다음 줄에서 바뀐 화면을 전제로 움직여도 된다. 뒤로 · 앞으로 · 주소 직접 입력은
   popstate / hashchange 로 들어온다(두 이벤트가 겹쳐 와도 같은 주소는 한 번만 그린다).

   라우트의 enter(params, query, prev) 가 문자열을 돌려주면 그 주소로 '대체' 이동한다
   (잠긴 단계 · 없어진 항목 → 뒤로가기 기록에 남지 않는다). prev 가 null 이면 처음 여는 것이다. */
window.WEMB = window.WEMB || {};
WEMB.router = (function () {
  const routes = [];
  const listeners = [];
  let fallback = () => '/';
  let current = null;
  let resolvedHash = null;
  let depth = 0; /* 이 문서 안에서 쌓인 이동 수 — 0 이면 앱 안으로 돌아갈 이전 화면이 없다 */
  let started = false;

  function compile(pattern) {
    const keys = [];
    const src = pattern
      .replace(/[.+*?^$()|[\]\\]/g, '\\$&')
      .replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; });
    return { re: new RegExp('^' + src + '/?$'), keys };
  }
  function parse(hash) {
    const raw = String(hash || '').replace(/^#/, '');
    if (raw.charAt(0) !== '/') return null;
    const qi = raw.indexOf('?');
    const query = {};
    new URLSearchParams(qi < 0 ? '' : raw.slice(qi + 1)).forEach((v, k) => { query[k] = v; });
    return { path: qi < 0 ? raw : raw.slice(0, qi), query };
  }
  function href(path, query) {
    const qs = new URLSearchParams();
    Object.keys(query || {}).forEach((k) => { if (query[k] != null && query[k] !== '') qs.set(k, query[k]); });
    const s = qs.toString();
    return '#' + path + (s ? '?' + s : '');
  }
  const toHash = (to) => (String(to).charAt(0) === '#' ? String(to) : href(String(to)));
  function lookup(path) {
    for (const r of routes) {
      const m = r.re.exec(path);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { route: r, params };
    }
    return null;
  }

  function resolve(hops) {
    if (hops > 8) { console.error('[router] 대체 이동이 반복된다:', location.hash); return; }
    const loc = parse(location.hash);
    const hit = loc && lookup(loc.path);
    if (!hit) return replaceWith(fallback(location.hash), hops + 1);
    const prev = current;
    const next = { name: hit.route.name, path: loc.path, params: hit.params, query: loc.query };
    resolvedHash = location.hash;
    current = next;
    let redirect;
    try { redirect = hit.route.enter(hit.params, loc.query, prev); } catch (e) { console.error('[router] ' + next.name, e); }
    if (typeof redirect === 'string') { current = prev; return replaceWith(redirect, hops + 1); }
    listeners.forEach((fn) => { try { fn(next, prev); } catch (e) {} });
  }
  function replaceWith(to, hops) {
    try { history.replaceState({ wembDepth: depth }, '', toHash(to)); } catch (e) {}
    resolve(hops || 0);
  }
  function navigate(to, opts) {
    const target = opts && opts.query ? href(String(to), opts.query) : toHash(to);
    if (opts && opts.replace) return replaceWith(target, 0);
    if (target === location.hash) return resolve(0); /* 같은 주소를 다시 누름 → 다시 그린다 */
    depth += 1;
    try { history.pushState({ wembDepth: depth }, '', target); } catch (e) { depth -= 1; location.hash = target; return; }
    resolve(0);
  }
  function onExternal() {
    if (!started || location.hash === resolvedHash) return;
    const st = history.state;
    if (st && typeof st.wembDepth === 'number') depth = st.wembDepth;
    else { depth += 1; try { history.replaceState({ wembDepth: depth }, ''); } catch (e) {} } /* 주소창에 직접 친 주소 */
    resolve(0);
  }
  window.addEventListener('popstate', onExternal);
  window.addEventListener('hashchange', onExternal);

  return {
    add(name, pattern, enter) { routes.push(Object.assign({ name, pattern, enter }, compile(pattern))); },
    setFallback(fn) { fallback = fn; },
    start() {
      if (started) return;
      started = true;
      const st = history.state;
      if (st && typeof st.wembDepth === 'number') depth = st.wembDepth;
      else try { history.replaceState({ wembDepth: 0 }, ''); } catch (e) {}
      resolve(0);
    },
    navigate,
    replace: (to) => replaceWith(to, 0),
    /* 앱 안에서 온 이전 화면이 있으면 브라우저 뒤로가기, 주소로 바로 들어왔으면 부모 화면으로 대체 이동 */
    back(parent) { if (depth > 0) history.back(); else replaceWith(parent, 0); },
    href,
    current: () => current,
    onChange(fn) { listeners.push(fn); },
  };
})();
