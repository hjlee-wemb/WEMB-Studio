/* ── 서버 없이 여는 분자 라이브러리 (GitHub Pages · 켜기.cmd 의 PowerShell 서버) ──
   wemb-atomic 서버의 api/* 응답을 미리 뽑아 둔 파일(src/atomic/)로 같은 모양을 만든다. 파일은 wemb-atomic 의 `npm run export` 가 만든다.
   읽기는 파일 그대로, 쓰기(버전 저장 · 이름 확정 · 조립 화면)는 이 브라우저의 localStorage 에 남는다 — 서버의 data/ 를 대신한다.
   저장 키는 'wembx-' 로 시작한다. 'wemb-' 키는 프로젝트 상태 묶음 · 초기화 대상이라 섞이면 프로젝트를 바꿀 때 사라진다. */
const BASE = 'src/atomic/';
const KEY = { defs: 'wembx-atomic-defs', names: 'wembx-atomic-names', screens: 'wembx-atomic-screens' };

const httpError = (status, message) => { const e = new Error(message); e.status = status; return e; };

/* 파일은 글자로 한 번만 받고, 줄 때마다 새로 푼다 — 서버처럼 매번 새 객체라 받은 쪽이 고쳐도 다음 응답에 묻어나지 않는다 */
const texts = new Map();
function fileText(name) {
  if (!texts.has(name)) {
    texts.set(name, fetch(BASE + name).then((r) => {
      if (!r.ok) throw httpError(r.status, r.status === 404 ? '없는 자료입니다: ' + name : r.status + ' ' + r.statusText);
      return r.text();
    }).catch((e) => { texts.delete(name); throw e; }));
  }
  return texts.get(name);
}
const fileJson = async (name) => JSON.parse(await fileText(name));

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (e) { return fallback; } };
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (e) { throw httpError(507, '이 브라우저의 저장 공간이 모자라 저장하지 못했어요.'); }
}

/* ── 버전 — 파일의 버전 뒤에 이 브라우저에서 저장한 버전을 잇는다 ── */
async function definitions() {
  const defs = await fileJson('definitions.json');
  for (const [mid, list] of Object.entries(read(KEY.defs, {}))) {
    const have = new Set((defs[mid]?.versions || []).map((v) => v.version));
    defs[mid] = { versions: [...(defs[mid]?.versions || []), ...list.filter((v) => !have.has(v.version))] };
  }
  return defs;
}
const latest = (defs, mid) => defs[mid]?.versions?.at(-1)?.version || '1.0.0';
const nextVersion = (v) => { const [a, b, c] = v.split('.').map(Number); return a + '.' + b + '.' + (c + 1); };

async function saveVersion(mid, body) {
  await fileText('molecules/' + encodeURIComponent(mid) + '.json'); // 없는 분자면 404
  const defs = await definitions();
  const current = latest(defs, mid);
  if (body.baseVersion !== undefined && body.baseVersion !== current) throw httpError(409, '다른 곳에서 먼저 새 버전(' + current + ')을 저장했습니다. 새로고침 후 다시 저장하세요.');
  const version = { version: nextVersion(current), createdAt: new Date().toISOString(), note: typeof body.note === 'string' ? body.note.slice(0, 300) : '', fields: body.fields || {},
    ...(body.root ? { root: body.root } : {}), ...(body.states ? { states: body.states } : {}) };
  const local = read(KEY.defs, {});
  local[mid] = [...(local[mid] || []), version];
  write(KEY.defs, local);
  return version;
}

/* ── 확정 이름 — 파일의 이름 위에 이 브라우저에서 확정 · 취소한 것을 덮는다 ── */
async function names() {
  const nm = await fileJson('names.json');
  const local = read(KEY.names, { set: {}, removed: [] });
  for (const id of local.removed || []) delete nm[id];
  return Object.assign(nm, local.set || {});
}
async function saveNames(body) {
  const local = read(KEY.names, { set: {}, removed: [] });
  local.set ||= {}; local.removed ||= [];
  for (const id of body.remove || []) { delete local.set[id]; if (!local.removed.includes(id)) local.removed.push(id); }
  for (const [id, e] of Object.entries(body.set || {})) {
    const name = String(e?.name ?? '').trim();
    if (!name || name.length > 80) throw httpError(400, id + ': 이름은 1~80자여야 합니다.');
    const fields = Object.fromEntries(Object.entries(e.fields || {}).map(([k, v]) => [k, String(v ?? '').trim()]).filter(([, v]) => v));
    local.set[id] = { name, fields, at: new Date().toISOString() };
    local.removed = local.removed.filter((x) => x !== id);
  }
  write(KEY.names, local);
  return names();
}
/** 서버가 응답에 이름을 넣던 일 — 확정 이름이 있으면 그것, 없으면 원래 이름 */
const withNames = (m, nm) => {
  const e = nm[m.id];
  return { ...m, name: e?.name || m.origName, confirmed: !!e, fields: m.fields.map((f) => ({ ...f, name: e?.fields?.[f.key] || f.origName })) };
};

/* ── 조립 화면 — 파일의 예시 화면 + 이 브라우저에서 만든 · 고친 화면(사본) ── */
const localScreens = () => { const l = read(KEY.screens, {}); return { saved: l.saved || {}, deleted: l.deleted || [] }; };
async function allScreens() {
  const { saved, deleted } = localScreens();
  const seeds = (await fileJson('screens.json')).filter((s) => !deleted.includes(s.id) && !saved[s.id]);
  return [...seeds, ...Object.values(saved)];
}
async function getScreen(id) {
  const s = (await allScreens()).find((x) => x.id === id);
  if (!s) throw httpError(404, '없는 화면입니다.');
  return s;
}
function putScreen(s) {
  const l = localScreens();
  l.saved[s.id] = s;
  write(KEY.screens, l);
  return s;
}
const summary = (s) => ({ id: s.id, name: s.name, kind: s.kind, template: s.template || null, updatedAt: s.updatedAt, rev: s.rev, pins: s.pins, count: (s.items || []).length });

function normalize(input) {
  const name = typeof input.name === 'string' && input.name.trim() ? input.name.trim().slice(0, 80) : '이름 없는 화면';
  const t = input.theme;
  const theme = t && (t.mode === 'dark' || t.mode === 'light') ? { mode: t.mode, seed: t.seed || null } : { mode: 'dark', seed: null };
  const items = (Array.isArray(input.items) ? input.items : []).map((item) => {
    const place = { x: Math.round(item.x), y: Math.round(item.y), scale: +Number(item.scale).toFixed(3) };
    if (item.organism !== undefined) return { id: item.id, organism: item.organism, inst: item.inst, ...place };
    return { id: item.id, molecule: item.molecule, variant: item.variant, ...place, props: item.props || {} };
  });
  const pins = { ...(input.pins || {}) };
  if (input.kind === 'template') return { kind: 'template', template: input.template, name, theme, pins, overrides: input.overrides || {}, items };
  return { kind: 'canvas', name, theme, pins, items };
}
/** 새로 얹은 분자는 지금의 최신 버전으로 고정한다 (템플릿 화면은 원본의 분자도) */
async function pinMissing(screen, defs) {
  const used = new Set(screen.items.filter((i) => i.molecule).map((i) => i.molecule));
  if (screen.kind === 'template') (await fileJson('templates/' + encodeURIComponent(screen.template) + '.json')).instances.forEach((i) => used.add(i.molecule));
  for (const mid of used) if (!screen.pins[mid]) screen.pins[mid] = latest(defs, mid);
}
async function createScreen(input) {
  const screen = normalize(input);
  if (screen.kind === 'template') await fileText('templates/' + encodeURIComponent(screen.template) + '.json');
  await pinMissing(screen, await definitions());
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('');
  const now = new Date().toISOString();
  return putScreen({ id: hex + '-' + Date.now().toString(36), ...screen, rev: 1, createdAt: now, updatedAt: now });
}
async function updateScreen(id, input) {
  const current = await getScreen(id);
  if (typeof input?.rev !== 'number') throw httpError(400, 'rev 가 필요합니다.');
  if (input.rev !== current.rev) throw httpError(409, '다른 곳에서 이 화면을 먼저 저장했습니다 (저장본 rev ' + current.rev + '). 새로고침 후 다시 시도하세요.');
  const screen = normalize({ ...input, kind: current.kind, template: current.template });
  await pinMissing(screen, await definitions());
  return putScreen({ ...current, ...screen, id, rev: current.rev + 1, updatedAt: new Date().toISOString() });
}
async function deleteScreen(id) {
  await getScreen(id);
  const l = localScreens();
  delete l.saved[id];
  if ((await fileJson('screens.json')).some((s) => s.id === id) && !l.deleted.includes(id)) l.deleted.push(id);
  write(KEY.screens, l);
  return { ok: true };
}
/** 여러 화면의 고정 버전을 한 번에 바꾼다 (분자 페이지의 '선택한 화면에 적용') */
async function applyVersion(mid, version, screenIds) {
  const changed = [];
  for (const sid of screenIds || []) {
    const s = await getScreen(sid);
    if (!Object.hasOwn(s.pins, mid) || s.pins[mid] === version) continue;
    putScreen({ ...s, pins: { ...s.pins, [mid]: version }, rev: s.rev + 1, updatedAt: new Date().toISOString() });
    changed.push(sid);
  }
  return { changed };
}

/* ── 크기 측정 — 파일에 모든 템플릿이 들어 있다. 원본이 바뀌어 다시 잰 것은 이 창에서만 쓴다 ── */
const measured = {};

/** api('api/…') 와 같은 응답을 돌려준다 (시트 · globals.css 는 글자) */
export async function staticApi(url, { method = 'GET', body } = {}) {
  const [a, b, c] = url.split('?')[0].replace(/^\/?api\//, '').split('/').map(decodeURIComponent);
  const json = (name) => fileJson(name + '.json');
  if (method === 'GET') {
    if (a === 'library' && !b) {
      const [lib, defs, nm] = await Promise.all([json('library'), definitions(), names()]);
      lib.molecules = lib.molecules.map((m) => ({ ...withNames(m, nm), latest: latest(defs, m.id) }));
      return lib;
    }
    if (a === 'levels' && !b) return json('levels');
    if (a === 'atoms' && !b) return json('atoms');
    if (a === 'definitions') return definitions();
    if (a === 'names') return names();
    if (a === 'measure') return { ...(await json('measure')), ...measured };
    if (a === 'globals.css') return fileText('globals.css');
    if (a === 'molecules' && b && !c) {
      const [m, defs, nm, screens] = await Promise.all([json('molecules/' + encodeURIComponent(b)), definitions(), names(), allScreens()]);
      return { ...withNames(m, nm), versions: defs[b]?.versions || [],
        screens: screens.filter((s) => s.pins && Object.hasOwn(s.pins, b)).map((s) => ({ id: s.id, name: s.name, kind: s.kind, version: s.pins[b] })) };
    }
    if (a === 'variants' && b) {
      const out = {};
      await Promise.all(b.split(',').slice(0, 400).map((id) => json('variants/' + encodeURIComponent(id)).then((v) => { out[id] = v; }, (e) => { if (e.status !== 404) throw e; })));
      return out;
    }
    if (a === 'sheets' && b) return fileText('sheets/' + encodeURIComponent(b) + '.css');
    if (a === 'templates' && b) return json('templates/' + encodeURIComponent(b));
    if (a === 'screens' && !b) return (await allScreens()).map(summary).sort((x, y) => (y.updatedAt || '').localeCompare(x.updatedAt || ''));
    if (a === 'screens' && b) return getScreen(b);
  }
  if (method === 'POST' && a === 'molecules' && b && c === 'versions') return saveVersion(b, body || {});
  if (method === 'POST' && a === 'molecules' && b && c === 'apply') return applyVersion(b, body?.version, body?.screens);
  if (method === 'PUT' && a === 'names' && !b) return saveNames(body || {});
  if (method === 'POST' && a === 'measure' && b) { measured[b] = { boxes: body?.boxes || {}, ...(body?.rects ? { rects: body.rects } : {}) }; return { ok: true, count: Object.keys(body?.boxes || {}).length }; }
  if (a === 'screens') {
    if (method === 'POST' && !b) return createScreen(body || {});
    if (method === 'PUT' && b) return updateScreen(b, body || {});
    if (method === 'DELETE' && b) return deleteScreen(b);
  }
  throw httpError(404, '없는 API: ' + method + ' ' + url);
}
