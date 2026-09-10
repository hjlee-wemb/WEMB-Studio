/* 한진 SMART 통합관제 — Figma get_design_context(React+Tailwind) → 순수 HTML/CSS 변환기
   · 화면 3장(Control Main 65:429 · Gate Status 65:943 · Unload Status 65:2243)을 한 번에 만든다.
   · 레이어명(data-name)을 id/class 로 보존, node-id 를 유일 클래스(nXX_YY)로 건다.
   · Tailwind 유틸리티는 실제 CSS 선언으로 1:1 번역(근사 없음, 미지원 클래스는 콘솔 리포트).
   · 아이콘/복잡 그래픽은 Figma 가 내보낸 개별 svg/png 파일 참조(손으로 그리지 않는다).
   · 글자는 전부 편집 가능한 실제 텍스트(SVG 아님).
   손으로 고치지 말고 이 파일을 고쳐 `node src/hana/_gen/conv.js` 로 다시 돌린다. */
'use strict';
const fs = require('fs');
const path = require('path');

const GEN = __dirname;
const ART = path.join(GEN, '..');                 /* src/hanjin — 내려받은 에셋이 있는 곳 */
const STUDIO = path.join(GEN, '..', '..', '..');
const ASSETMAP = JSON.parse(fs.readFileSync(path.join(GEN, 'asset-map.json'), 'utf8'));
const LIGHT = require('./light.js');

/* 화면 3장 — prefix 는 화면마다 다르게(스타일·id 충돌 0), meta 는 텍스트 상자 고정용 */
const SCREENS = [
  { key: '1-7175', node: '1:7175', px: 'hno2', name: 'Screen/Overview 02', out: 'hana-overview-02', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-18455', node: '1:18455', px: 'hnc1', name: 'Screen/Cloud Status 01', out: 'hana-cloud-01', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-18154', node: '1:18154', px: 'hnc2', name: 'Screen/Cloud Status 02', out: 'hana-cloud-02', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-18697', node: '1:18697', px: 'hnm', name: 'Screen/Middleware Status', out: 'hana-middleware', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-21965', node: '1:21965', px: 'hni1', name: 'Screen/Infrastructure Main', out: 'hana-infra-main', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-21682', node: '1:21682', px: 'hni2', name: 'Screen/Infrastructure Detail', out: 'hana-infra-detail', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-19018', node: '1:19018', px: 'hne', name: 'Screen/Event Status', out: 'hana-event', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-19299', node: '1:19299', px: 'hnn1', name: 'Screen/Network Status 01', out: 'hana-network-01', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-19968', node: '1:19968', px: 'hnn2', name: 'Screen/Network Status 02', out: 'hana-network-02', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-19085', node: '1:19085', px: 'hnn3', name: 'Screen/Network Status 03', out: 'hana-network-03', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-22870', node: '1:22870', px: 'hnf', name: 'Screen/Facility Management', out: 'hana-facility', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-23148', node: '1:23148', px: 'hns1', name: 'Screen/Security System 01', out: 'hana-security-01', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-23799', node: '1:23799', px: 'hns2', name: 'Screen/Security System 02', out: 'hana-security-02', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
  { key: '1-4904', node: '1:4904', px: 'hnl', name: 'Screen/Login', out: 'hana-login', meta: ['meta-page.xml', 'meta-1-61879.xml'] },
];

/* ══════════════════ 1. JSX 파서 ══════════════════
   Figma 출력은 기계 생성이라 문법이 한정적이다: 요소·프래그먼트·{cond && (…)}·삼항·템플릿 리터럴.
   컴포넌트 함수는 각 화면에서 딱 한 번씩만 쓰이므로 호출부의 props 로 그 자리에서 펼친다. */

function readAttrs(s, i) {
  /* i = 태그 이름 다음. `>` 또는 `/>` 까지 읽어 {name: {raw, isExpr}} 를 만든다 */
  const at = [];
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s[i] === '>') return { at, i: i + 1, self: false };
    if (s[i] === '/' && s[i + 1] === '>') return { at, i: i + 2, self: true };
    const nm = /^[\w:-]+/.exec(s.slice(i));
    if (!nm) { i++; continue; }
    const name = nm[0];
    i += name.length;
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s[i] !== '=') { at.push({ name, raw: 'true', isExpr: true }); continue; }
    i++;
    while (i < s.length && /\s/.test(s[i])) i++;
    if (s[i] === '"') {
      const e = s.indexOf('"', i + 1);
      at.push({ name, raw: s.slice(i + 1, e), isExpr: false });
      i = e + 1;
    } else if (s[i] === '{') {
      const e = matchBrace(s, i);
      at.push({ name, raw: s.slice(i + 1, e), isExpr: true });
      i = e + 1;
    } else { i++; }
  }
  return { at, i, self: false };
}

/* {…} 의 닫는 위치. 문자열·템플릿 리터럴 안의 중괄호는 세지 않는다(중첩 ${} 포함) */
function matchBrace(s, i) {
  let d = 0;
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === '"' || c === "'") { const q = c; i++; while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; i++; } continue; }
    if (c === '`') { i++; let td = 0; while (i < s.length) { if (s[i] === '\\') { i += 2; continue; } if (s[i] === '`' && !td) break; if (s[i] === '$' && s[i + 1] === '{') { td++; i += 2; continue; } if (s[i] === '}' && td) td--; i++; } continue; }
    if (c === '{') d++;
    else if (c === '}') { d--; if (!d) return i; }
  }
  return s.length;
}

function evalExpr(raw, scope) {
  const keys = Object.keys(scope);
  try {
    // eslint-disable-next-line no-new-func
    return new Function(...keys, 'return (' + raw + ');')(...keys.map((k) => scope[k]));
  } catch (e) {
    throw new Error('expr eval failed: ' + raw + ' — ' + e.message);
  }
}

/* 컴포넌트 정의를 소스에서 뽑는다 */
function collectComponents(src) {
  const comps = {};
  /* 구조분해에는 중첩 중괄호가 없다 → 첫 `}` 까지가 파라미터, 그 뒤(`: { className?: string }`)는 타입 주석이라 버린다.
     `export default function …` 도 잡는다 — 변형 세트 소스는 컴포넌트 하나가 export default 로 나온다. */
  const re = /^(?:export default )?function (\w+)\(\s*(\{[^{}]*\})[^)]*\)\s*\{/gm;
  let m;
  while ((m = re.exec(src))) {
    const name = m[1];
    /* 파라미터 구조분해 — { className, floor = "1F" } */
    const params = {};
    m[2].replace(/^\{|\}$/g, '').split(',').forEach((p) => {
      const t = p.trim(); if (!t) return;
      const eq = t.indexOf('=');
      if (eq < 0) params[t] = undefined;
      else params[t.slice(0, eq).trim()] = JSON.parse(t.slice(eq + 1).trim().replace(/'/g, '"'));
    });
    /* 본문 — 이 파일의 컴포넌트는 상태마다 일찍 돌려보낸다:
         if (status === "hover") { return ( … ); } … return ( … );
       가지를 전부 모아 두고, 펼칠 때 props 로 조건을 실제로 평가해 고른다(근사 없음). */
    const bodyStart = re.lastIndex;
    const endFn = src.indexOf('\n}\n', bodyStart);
    const body = src.slice(bodyStart, endFn < 0 ? src.length : endFn);
    const derived = [];
    const branches = [];
    let cur = 0;
    for (;;) {
      const r = body.indexOf('return (', cur);
      if (r < 0) break;
      const head = body.slice(cur, r);
      if (!branches.length) for (const d of head.matchAll(/const (\w+) = ([^;]+);/g)) derived.push([d[1], d[2]]);
      const ifs = [...head.matchAll(/if \(([^)]*)\)\s*\{/g)];
      const cond = ifs.length ? ifs[ifs.length - 1][1] : null;
      /* 닫는 자리 = return 과 같은 들여쓰기의 ');' 줄 */
      const ls = body.lastIndexOf('\n', r) + 1;
      const indent = body.slice(ls, r);
      const close = body.indexOf('\n' + indent + ');', r);
      const end = close < 0 ? body.length : close;
      branches.push({ cond, jsx: body.slice(body.indexOf('<', r), end) });
      cur = end + 1;
    }
    comps[name] = { params, derived, branches, jsx: branches.length ? branches[branches.length - 1].jsx : '' };
  }
  return comps;
}

/* 파싱된 트리에서 노드 id 로 하나 찾기(이식용) */
function findNode(node, nid) {
  if (!node || node.tag === '#text') return null;
  const a = node.attrs || {};
  if (a['data-node-id'] === nid) return node;
  if (typeof a.id === 'string' && a.id === 'node-' + nid.replace(':', '_')) return node;
  for (const c of node.children || []) { const r = findNode(c, nid); if (r) return r; }
  return null;
}

/* JSX 문자열 → 트리. scope 는 컴포넌트 props/파생 상수 */
function parseNodes(s, ctx, scope, stopAtClose) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const lt = s.indexOf('<', i), br = s.indexOf('{', i);
    let next = Math.min(lt < 0 ? Infinity : lt, br < 0 ? Infinity : br);
    if (next === Infinity) next = s.length;
    const txt = s.slice(i, next).replace(/\s+/g, ' ').trim();
    if (txt) out.push({ tag: '#text', text: txt });
    if (next >= s.length) break;
    i = next;
    if (s[i] === '{') {
      const e = matchBrace(s, i);
      const raw = s.slice(i + 1, e).trim();
      i = e + 1;
      const amp = splitAnd(raw);
      if (amp) {
        if (evalExpr(amp.cond, scope)) out.push(...parseNodes(amp.body, ctx, scope));
      } else {
        const v = evalExpr(raw, scope);
        if (typeof v === 'string' && v.trim()) out.push({ tag: '#text', text: v });
      }
      continue;
    }
    /* 닫는 태그 / 프래그먼트 */
    if (s[i + 1] === '/') { const e = s.indexOf('>', i); i = e + 1; if (stopAtClose) return { nodes: out, end: i }; continue; }
    if (s[i + 1] === '>') {                               /* <> … </> */
      const inner = takeElement(s, i + 2, '');
      out.push(...parseNodes(inner.body, ctx, scope));
      i = inner.end;
      continue;
    }
    const nm = /^<([A-Za-z][\w]*)/.exec(s.slice(i));
    if (!nm) { i++; continue; }
    const tag = nm[1];
    const A = readAttrs(s, i + 1 + tag.length);
    const attrs = {};
    for (const a of A.at) attrs[a.name] = a.isExpr ? { expr: a.raw } : a.raw;
    let body = '', end = A.i;
    if (!A.self) { const t = takeElement(s, A.i, tag); body = t.body; end = t.end; }
    i = end;
    if (/^[A-Z]/.test(tag)) {                              /* 컴포넌트 → 그 자리에 펼친다 */
      const c = ctx.comps[tag];
      if (!c) throw new Error('unknown component ' + tag);
      const sc = Object.assign({}, c.params);
      /* 값이 undefined 인 prop 은 넘기지 않은 것과 같다 — 자바스크립트 기본값 규칙 그대로다.
         층 선택의 건물 그림이 `floor={… : is2F ? "2F" : undefined}` 로 넘어오는데, 이걸 덮어써 버리면
         1F 일 때 floor 기본값("1F")이 죽어 건물 레이어가 통째로 사라진다(그림이 납작한 덩어리가 됐다). */
      for (const k of Object.keys(attrs)) {
        const v = typeof attrs[k] === 'string' ? attrs[k] : evalExpr(attrs[k].expr, scope);
        if (v !== undefined) sc[k] = v;
      }
      for (const [k, ex] of c.derived) sc[k] = evalExpr(ex, sc);
      Object.assign(sc, ctx.assets);
      /* 상태 분기 — props 로 실제 평가해 그 가지의 JSX 를 펼친다 */
      const _b = (c.branches || []).find((x) => x.cond === null || evalExpr(x.cond, sc));
      const _ex = parseNodes(_b ? _b.jsx : c.jsx, ctx, sc);
      /* 이 자리의 상태를 DOM 에 남긴다(위험 심볼만 골라 깜빡이게 하려고). 오타 prop `stauts` 도 받는다. */
      const _st = [sc.status, sc.stauts].find((v) => typeof v === 'string' && v);
      if (_st) {
        const _first = _ex.find((n) => n && n.tag && n.tag !== '#text');
        if (_first) {
          _first.__status = _st;
          if (typeof sc.type === 'string' && sc.type) _first.__vtype = sc.type;
        }
      }
      out.push(..._ex);
      continue;
    }
    out.push({ tag, attrs, scope, children: body ? parseNodes(body, ctx, scope) : [] });
  }
  return stopAtClose ? { nodes: out, end: i } : out;
}

/* `cond && ( … )` 분해 — && 가 문자열/괄호 밖에 있을 때만 */
function splitAnd(raw) {
  /* 괄호 밖(top-level)의 && 자리를 모두 모은다 */
  const tops = [];
  let d = 0;
  for (let i = 0; i < raw.length - 1; i++) {
    const c = raw[i];
    if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < raw.length && raw[i] !== q) { if (raw[i] === '\\') i++; i++; } continue; }
    if (c === '(' || c === '[') d++;
    else if (c === ')' || c === ']') d--;
    else if (!d && c === '&' && raw[i + 1] === '&') { tops.push(i); i++; }
  }
  if (!tops.length) return null;
  /* 오른쪽이 JSX 인 **마지막** && 에서 자른다.
     `type === "server" && status === "Default" && <img/>` 를 첫 && 에서 자르면
     남은 `status === "Default" && <img/>` 가 JSX 로 파싱돼 조건식이 글자로 새어 나온다. */
  let at = -1;
  for (const p of tops) {
    const r = raw.slice(p + 2).trim();
    if (r[0] === '(' || r[0] === '<') at = p;
  }
  if (at < 0) at = tops[0];
  let b = raw.slice(at + 2).trim();
  if (b[0] === '(') b = b.slice(1, b.lastIndexOf(')'));
  return { cond: raw.slice(0, at).trim(), body: b };
}

/* 여는 태그 뒤부터 짝이 맞는 닫는 태그까지 */
/* 태그의 진짜 끝 — 따옴표('"`)와 {} 안의 > 는 세지 않는다.
   Figma 는 그라디언트를 style={{ backgroundImage: "url(…<svg …>…)" }} 로 내보내므로
   '첫 >' 를 태그 끝으로 보면 자기닫힘 판정이 틀어진다. */
/* 회전+기울임이 걸린 hypot() 크기를 컨테이너 상자에 맞게 되돌린다(위 주석 참고). */
function isoPlateScale(decls) {
  const get = (p) => { const d = decls.find((x) => x[0] === p); return d ? String(d[1]) : null; };
  const w = get('width'), h = get('height'), tr = get('transform');
  if (!w || !h || !tr) return false;
  const RE = /^hypot\(\s*(-?[\d.]+)cqw\s*,\s*(-?[\d.]+)cqh\s*\)$/;
  const mw = RE.exec(w), mh = RE.exec(h);
  if (!mw || !mh) return false;
  const p = Math.abs(parseFloat(mw[1])), q = Math.abs(parseFloat(mh[1]));
  if (!(p > 0 && q > 0) || Math.abs(p + q - 100) > 0.5) return false;  /* 두 값이 100% 를 나눠 가질 때만 */
  const M = trMatrix(tr);
  if (!M) return false;
  const pf = p / 100, qf = q / 100;
  const A = Math.abs(M[0]) * pf + Math.abs(M[2]) * qf;
  const B = Math.abs(M[1]) * pf + Math.abs(M[3]) * qf;
  const k = Math.hypot(A, B);
  if (!(k > 1.0005)) return false;                                 /* 이미 맞으면 두지 않는다 */
  const sc = +(1 / k).toFixed(6);
  const wi = decls.findIndex((x) => x[0] === 'width');
  const hi = decls.findIndex((x) => x[0] === 'height');
  decls[wi][1] = 'calc(' + w + ' * ' + sc + ')';
  decls[hi][1] = 'calc(' + h + ' * ' + sc + ')';
  return true;
}

/* transform 문자열(rotate/skewX/skewY/scale…)을 2x2 행렬 [m11,m21,m12,m22] 로 접는다 */
function trMatrix(tr) {
  let m = [1, 0, 0, 1];                                            /* [a,b,c,d] */
  const mul = (n) => { m = [
    m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3]];
  };
  const rad = (d) => d * Math.PI / 180;
  let seen = false;
  const RE = /([a-zA-Z]+)\(([^)]*)\)/g;
  let f;
  while ((f = RE.exec(tr))) {
    const fn = f[1], a = f[2].split(/\s*,\s*/);
    const num = (v) => parseFloat(v);
    if (fn === 'rotate') { const t = rad(num(a[0])); mul([Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)]); seen = true; }
    else if (fn === 'skewX') { mul([1, 0, Math.tan(rad(num(a[0]))), 1]); seen = true; }
    else if (fn === 'skewY') { mul([1, Math.tan(rad(num(a[0]))), 0, 1]); seen = true; }
    else if (fn === 'scale') { const x = num(a[0]), y = a.length > 1 ? num(a[1]) : x; mul([x, 0, 0, y]); seen = true; }
    else if (fn === 'scaleX') { mul([num(a[0]), 0, 0, 1]); seen = true; }
    else if (fn === 'scaleY') { mul([1, 0, 0, num(a[0])]); seen = true; }
    else if (fn === 'translate' || fn === 'translateX' || fn === 'translateY') { /* 자리만 옮긴다 */ }
    else return null;                                              /* 모르는 함수 — 손대지 않는다 */
  }
  return seen ? m : null;
}

function tagEnd(s, i) {
  let inStr = null, depth = 0;
  for (let j = i; j < s.length; j++) {
    const c = s[j];
    if (inStr) { if (c === "\\") { j++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") { depth++; continue; }
    if (c === "}") { depth--; continue; }
    if (depth > 0) continue;
    if (c === ">") return { end: j + 1, self: s[j - 1] === "/" };
  }
  return { end: s.length, self: false };
}

function takeElement(s, i, tag) {
  let depth = 1;
  const start = i;
  const re = tag ? new RegExp('<(/?)' + tag + '([\\s/>])', 'g') : /<(\/?)>/g;
  re.lastIndex = i;
  let m;
  while ((m = re.exec(s))) {
    const t = tagEnd(s, m.index);
    if (m[1]) { depth--; if (!depth) return { body: s.slice(start, m.index), end: t.end }; }
    else if (!t.self) depth++;
    if (t.end > re.lastIndex) re.lastIndex = t.end;
  }
  return { body: s.slice(start), end: s.length };
}

/* ══════════════════ 2. Tailwind → CSS ══════════════════ */
const unknown = new Map();
const FONTS = {
  Pretendard: '"Pretendard","Pretendard Variable","Malgun Gothic",-apple-system,system-ui,sans-serif',
  Tomorrow: '"Tomorrow","Pretendard",system-ui,sans-serif',
  Roboto: '"Roboto","Pretendard",system-ui,sans-serif',
  Inter: '"Inter","Pretendard",system-ui,sans-serif',
};
const WEIGHT = { Thin: 100, ExtraLight: 200, Light: 300, Regular: 400, Medium: 500, SemiBold: 600, Semibold: 600, Bold: 700, ExtraBold: 800, Black: 900 };

const fixCalc = (v) => v.replace(/calc\(([^()]*)\)/g, (mm, inner) => 'calc(' + inner.replace(/([\d%a-z)])([-+])(?=[\d.])/g, '$1 $2 ') + ')');
const arb = (c) => fixCalc(c.slice(c.indexOf('[') + 1, c.lastIndexOf(']')).replace(/_/g, ' '));

function styleFor(classes) {
  const d = [];
  const set = (p, v) => { const i = d.findIndex((x) => x[0] === p); if (i >= 0) d[i][1] = v; else d.push([p, v]); };
  let bAll = null; const bSides = {}; let bColor = null, bStyle = null;
  const shadows = [], drops = [], tr = [], filters = [];
  let gradDir = null, gFrom = null, gFromPos = null, gVia = null, gViaPos = null, gTo = null, gToPos = null;

  for (const c of classes) {
    if (/^\[[^\]]+\]$/.test(c) && c.includes(':')) {           /* 임의 속성 [prop:value] */
      const v = c.slice(1, -1); const i = v.indexOf(':');
      set(v.slice(0, i), v.slice(i + 1).replace(/_/g, ' ')); continue;
    }
    switch (c) {
      case 'absolute': set('position', 'absolute'); continue;
      case 'relative': set('position', 'relative'); continue;
      case 'static': set('position', 'static'); continue;
      case 'contents': set('display', 'contents'); continue;
      case 'flex': set('display', 'flex'); continue;
      case 'grid': set('display', 'grid'); continue;
      case 'inline-grid': set('display', 'inline-grid'); continue;
      case 'inline-flex': set('display', 'inline-flex'); continue;
      case 'block': set('display', 'block'); continue;
      case 'hidden': set('display', 'none'); continue;
      case 'isolate': set('isolation', 'isolate'); continue;
      case 'flex-col': set('flex-direction', 'column'); continue;
      case 'flex-row': set('flex-direction', 'row'); continue;
      case 'flex-wrap': set('flex-wrap', 'wrap'); continue;
      case 'flex-none': set('flex', 'none'); continue;
      case 'flex-1': set('flex', '1 1 0%'); continue;
      case 'grow': set('flex-grow', '1'); continue;
      case 'basis-0': set('flex-basis', '0px'); continue;
      case 'shrink-0': set('flex-shrink', '0'); continue;
      case 'self-stretch': set('align-self', 'stretch'); continue;
      case 'self-start': set('align-self', 'flex-start'); continue;
      case 'self-end': set('align-self', 'flex-end'); continue;
      case 'self-center': set('align-self', 'center'); continue;
      case 'content-stretch': set('align-content', 'stretch'); continue;
      case 'content-center': set('align-content', 'center'); continue;
      case 'items-center': set('align-items', 'center'); continue;
      case 'items-start': set('align-items', 'flex-start'); continue;
      case 'items-end': set('align-items', 'flex-end'); continue;
      case 'items-baseline': set('align-items', 'baseline'); continue;
      case 'justify-center': set('justify-content', 'center'); continue;
      case 'justify-between': set('justify-content', 'space-between'); continue;
      case 'justify-start': set('justify-content', 'flex-start'); continue;
      case 'justify-end': set('justify-content', 'flex-end'); continue;
      case 'place-items-start': set('place-items', 'start'); continue;
      case 'place-items-center': set('place-items', 'center'); continue;
      case 'col-1': set('grid-column', '1'); continue;
      case 'row-1': set('grid-row', '1'); continue;
      case 'inset-0': set('inset', '0'); continue;
      case 'left-0': set('left', '0'); continue;
      case 'top-0': set('top', '0'); continue;
      case 'right-0': set('right', '0'); continue;
      case 'bottom-0': set('bottom', '0'); continue;
      case 'left-1/2': set('left', '50%'); continue;
      case 'top-1/2': set('top', '50%'); continue;
      case 'ml-0': set('margin-left', '0'); continue;
      case 'mt-0': set('margin-top', '0'); continue;
      case 'mr-0': set('margin-right', '0'); continue;
      case 'mb-0': set('margin-bottom', '0'); continue;
      case 'w-0': set('width', '0'); continue;
      case 'h-0': set('height', '0'); continue;
      case 'w-full': set('width', '100%'); continue;
      case 'h-full': set('height', '100%'); continue;
      case 'size-full': set('width', '100%'); set('height', '100%'); continue;
      case 'w-px': set('width', '1px'); continue;
      case 'h-px': set('height', '1px'); continue;
      case 'min-w-px': set('min-width', '1px'); continue;
      case 'min-h-px': set('min-height', '1px'); continue;
      case 'min-w-full': set('min-width', '100%'); continue;
      case 'min-h-full': set('min-height', '100%'); continue;
      case 'max-w-none': set('max-width', 'none'); continue;
      case 'max-w-full': set('max-width', '100%'); continue;
      case 'gap-px': set('gap', '1px'); continue;
      case 'gap-0': set('gap', '0'); continue;
      case 'object-cover': set('object-fit', 'cover'); continue;
      case 'object-contain': set('object-fit', 'contain'); continue;
      case 'object-fill': set('object-fit', 'fill'); continue;
      case 'overflow-hidden': set('overflow', 'hidden'); continue;
      case 'overflow-clip': set('overflow', 'clip'); continue;
      case 'overflow-visible': set('overflow', 'visible'); continue;
      case 'pointer-events-none': set('pointer-events', 'none'); continue;
      case 'mix-blend-screen': set('mix-blend-mode', 'screen'); continue;
      case 'mix-blend-color-burn': set('mix-blend-mode', 'color-burn'); continue;
      case 'mix-blend-saturation': set('mix-blend-mode', 'saturation'); continue;
      case 'mix-blend-color': set('mix-blend-mode', 'color'); continue;
      case 'mix-blend-luminosity': set('mix-blend-mode', 'luminosity'); continue;
      case 'mix-blend-difference': set('mix-blend-mode', 'difference'); continue;
      case 'mix-blend-exclusion': set('mix-blend-mode', 'exclusion'); continue;
      case 'mix-blend-hue': set('mix-blend-mode', 'hue'); continue;
      case 'text-ellipsis': set('text-overflow', 'ellipsis'); continue;
      case 'text-clip': set('text-overflow', 'clip'); continue;
      case 'bg-clip-text': set('-webkit-background-clip', 'text'); set('background-clip', 'text'); continue;
      case 'mix-blend-overlay': set('mix-blend-mode', 'overlay'); continue;
      case 'mix-blend-multiply': set('mix-blend-mode', 'multiply'); continue;
      case 'mix-blend-normal': set('mix-blend-mode', 'normal'); continue;
      case 'mix-blend-lighten': set('mix-blend-mode', 'lighten'); continue;
      case 'mix-blend-darken': set('mix-blend-mode', 'darken'); continue;
      case 'mix-blend-color-dodge': set('mix-blend-mode', 'color-dodge'); continue;
      case 'mix-blend-plus-lighter': set('mix-blend-mode', 'plus-lighter'); continue;
      case 'mix-blend-hard-light': set('mix-blend-mode', 'hard-light'); continue;
      case 'mix-blend-soft-light': set('mix-blend-mode', 'soft-light'); continue;
      case 'whitespace-nowrap': set('white-space', 'nowrap'); continue;
      case 'whitespace-pre': set('white-space', 'pre'); continue;
      case 'whitespace-pre-wrap': set('white-space', 'pre-wrap'); continue;
      case 'not-italic': set('font-style', 'normal'); continue;
      case 'italic': set('font-style', 'italic'); continue;
      case 'uppercase': set('text-transform', 'uppercase'); continue;
      case 'lowercase': set('text-transform', 'lowercase'); continue;
      case 'capitalize': set('text-transform', 'capitalize'); continue;
      case 'underline': set('text-decoration-line', 'underline'); continue;
      case 'line-through': set('text-decoration-line', 'line-through'); continue;
      case 'text-center': set('text-align', 'center'); continue;
      case 'text-right': set('text-align', 'right'); continue;
      case 'text-left': set('text-align', 'left'); continue;
      case 'text-justify': set('text-align', 'justify'); continue;
      case 'text-nowrap': set('text-wrap', 'nowrap'); continue;
      case 'text-white': set('color', '#fff'); continue;
      case 'text-black': set('color', '#000'); continue;
      case 'bg-white': set('background-color', '#fff'); continue;
      case 'bg-black': set('background-color', '#000'); continue;
      case 'bg-clip-padding': set('background-clip', 'padding-box'); continue;
      case 'border-white': bColor = '#fff'; continue;
      case 'border-black': bColor = '#000'; continue;
      case 'border-solid': bStyle = 'solid'; continue;
      case 'border-dashed': bStyle = 'dashed'; continue;
      case 'border-dotted': bStyle = 'dotted'; continue;
      case 'border-none': bStyle = 'none'; continue;
      case 'border': bAll = '1px'; continue;
      case 'border-0': bAll = '0px'; continue;
      case 'border-2': bAll = '2px'; continue;
      case 'border-4': bAll = '4px'; continue;
      case 'border-8': bAll = '8px'; continue;
      case 'border-b': bSides.bottom = '1px'; continue;
      case 'border-t': bSides.top = '1px'; continue;
      case 'border-r': bSides.right = '1px'; continue;
      case 'border-l': bSides.left = '1px'; continue;
      case 'border-t-2': bSides.top = '2px'; continue;
      case 'border-b-2': bSides.bottom = '2px'; continue;
      case 'border-l-2': bSides.left = '2px'; continue;
      case 'border-r-2': bSides.right = '2px'; continue;
      case 'rounded-full': set('border-radius', '9999px'); continue;
      case 'rounded-none': set('border-radius', '0'); continue;
      case 'rotate-90': tr.push('rotate(90deg)'); continue;
      case 'rotate-30': tr.push('rotate(30deg)'); continue;
      case '-rotate-30': tr.push('rotate(-30deg)'); continue;
      case 'rotate-45': tr.push('rotate(45deg)'); continue;
      case '-rotate-45': tr.push('rotate(-45deg)'); continue;
      case 'skew-x-30': tr.push('skewX(30deg)'); continue;
      case '-skew-x-30': tr.push('skewX(-30deg)'); continue;
      case 'skew-y-30': tr.push('skewY(30deg)'); continue;
      case '-skew-y-30': tr.push('skewY(-30deg)'); continue;
      case 'scale-y-87': tr.push('scaleY(0.87)'); continue;
      case 'rotate-180': tr.push('rotate(180deg)'); continue;
      case 'rotate-270': tr.push('rotate(270deg)'); continue;
      case '-rotate-90': tr.push('rotate(-90deg)'); continue;
      case 'scale-y-[-1]': tr.push('scaleY(-1)'); continue;
      case 'scale-x-[-1]': tr.push('scaleX(-1)'); continue;
      case '-translate-x-1/2': tr.unshift('translateX(-50%)'); continue;
      case '-translate-y-1/2': tr.unshift('translateY(-50%)'); continue;
      case 'translate-x-1/2': tr.unshift('translateX(50%)'); continue;
      case 'translate-y-1/2': tr.unshift('translateY(50%)'); continue;
      case 'bottom-1/4': set('bottom', '25%'); continue;
      case 'from-white': gFrom = '#ffffff'; continue;
      case 'to-white': gTo = '#ffffff'; continue;
      case 'bg-gradient-to-r': gradDir = 'to right'; continue;
      case 'bg-gradient-to-l': gradDir = 'to left'; continue;
      case 'bg-gradient-to-t': gradDir = 'to top'; continue;
      case 'bg-gradient-to-b': gradDir = 'to bottom'; continue;
      case 'bg-gradient-to-tr': gradDir = 'to top right'; continue;
      case 'bg-gradient-to-tl': gradDir = 'to top left'; continue;
      case 'bg-gradient-to-br': gradDir = 'to bottom right'; continue;
      case 'bg-gradient-to-bl': gradDir = 'to bottom left'; continue;
      case 'bg-no-repeat': set('background-repeat', 'no-repeat'); continue;
      case 'bg-cover': set('background-size', 'cover'); continue;
      case 'bg-center': set('background-position', 'center'); continue;
      case 'cursor-pointer': set('cursor', 'pointer'); continue;
      case 'cursor-default': set('cursor', 'default'); continue;
      case 'backdrop-blur-none': set('backdrop-filter', 'none'); continue;
      case 'px-px': set('padding-left', '1px'); set('padding-right', '1px'); continue;
      case 'py-px': set('padding-top', '1px'); set('padding-bottom', '1px'); continue;
      case 'pt-px': set('padding-top', '1px'); continue;
      case 'pb-px': set('padding-bottom', '1px'); continue;
      case 'pl-px': set('padding-left', '1px'); continue;
      case 'pr-px': set('padding-right', '1px'); continue;
      case 'mt-px': set('margin-top', '1px'); continue;
      case 'mb-px': set('margin-bottom', '1px'); continue;
      case 'ml-px': set('margin-left', '1px'); continue;
      case 'mr-px': set('margin-right', '1px'); continue;
      case 'justify-self-stretch': set('justify-self', 'stretch'); continue;
      case 'justify-self-start': set('justify-self', 'start'); continue;
      case 'justify-self-center': set('justify-self', 'center'); continue;
      case 'font-normal': set('font-weight', '400'); continue;
      case 'font-medium': set('font-weight', '500'); continue;
      case 'font-semibold': set('font-weight', '600'); continue;
      case 'font-bold': set('font-weight', '700'); continue;
      case '-scale-y-100': tr.push('scaleY(-1)'); continue;
      case '-scale-x-100': tr.push('scaleX(-1)'); continue;
      case 'scale-y-100': tr.push('scaleY(1)'); continue;
      default: break;
    }
    let m;
    if ((m = c.match(/^(col|row)-(\d+)$/))) { set('grid-' + (m[1] === 'col' ? 'column' : 'row'), m[2]); continue; }
    if ((m = c.match(/^(-?)rotate-\[/))) { tr.push('rotate(' + m[1] + arb(c) + ')'); continue; }
    if (/^text-shadow-\[/.test(c)) { set('text-shadow', arb(c)); continue; }
    if (/^mask-position-\[/.test(c)) { const v = arb(c); set('-webkit-mask-position', v); set('mask-position', v); continue; }
    if (/^mask-size-\[/.test(c)) { const v = arb(c); set('-webkit-mask-size', v); set('mask-size', v); continue; }
    if (/^mask-repeat-\[/.test(c)) { const v = arb(c); set('-webkit-mask-repeat', v); set('mask-repeat', v); continue; }
    if ((m = c.match(/^(left|top|right|bottom|width|height)-\[/))) { set(m[1], arb(c)); continue; }
    if ((m = c.match(/^(w|h)-\[/))) { set(m[1] === 'w' ? 'width' : 'height', arb(c)); continue; }
    if ((m = c.match(/^(min|max)-(w|h)-\[/))) { set(m[1] + '-' + (m[2] === 'w' ? 'width' : 'height'), arb(c)); continue; }
    if (/^size-\[/.test(c)) { const v = arb(c); set('width', v); set('height', v); continue; }
    if (/^inset-\[/.test(c)) { set('inset', arb(c)); continue; }
    if ((m = c.match(/^inset-(x|y)-\[/))) { const v = arb(c); if (m[1] === 'x') { set('left', v); set('right', v); } else { set('top', v); set('bottom', v); } continue; }
    if (/^gap-\[/.test(c)) { set('gap', arb(c)); continue; }
    if (/^gap-x-\[/.test(c)) { set('column-gap', arb(c)); continue; }
    if (/^gap-y-\[/.test(c)) { set('row-gap', arb(c)); continue; }
    if (/^p-\[/.test(c)) { set('padding', arb(c)); continue; }
    if (/^px-\[/.test(c)) { const v = arb(c); set('padding-left', v); set('padding-right', v); continue; }
    if (/^py-\[/.test(c)) { const v = arb(c); set('padding-top', v); set('padding-bottom', v); continue; }
    if ((m = c.match(/^p([tblr])-\[/))) { set('padding-' + { t: 'top', b: 'bottom', l: 'left', r: 'right' }[m[1]], arb(c)); continue; }
    if (/^mx-\[/.test(c)) { const v = arb(c); set('margin-left', v); set('margin-right', v); continue; }
    if (/^my-\[/.test(c)) { const v = arb(c); set('margin-top', v); set('margin-bottom', v); continue; }
    if ((m = c.match(/^-?m([tblr])-\[/))) {
      let v = arb(c); if (c[0] === '-') v = '-' + v;
      set('margin-' + { t: 'top', b: 'bottom', l: 'left', r: 'right' }[m[1]], v); continue;
    }
    if (/^rounded-\[/.test(c)) { set('border-radius', arb(c)); continue; }
    if ((m = c.match(/^rounded-(tl|tr|bl|br)-\[/))) {
      set({ tl: 'border-top-left-radius', tr: 'border-top-right-radius', bl: 'border-bottom-left-radius', br: 'border-bottom-right-radius' }[m[1]], arb(c)); continue;
    }
    if ((m = c.match(/^rounded-([tblr])-\[/))) {
      const v = arb(c);
      const pair = { t: ['top-left', 'top-right'], b: ['bottom-left', 'bottom-right'], l: ['top-left', 'bottom-left'], r: ['top-right', 'bottom-right'] }[m[1]];
      pair.forEach((k) => set('border-' + k + '-radius', v)); continue;
    }
    if (/^aspect-\[/.test(c)) { set('aspect-ratio', arb(c).replace(/\s/g, '')); continue; }
    if (/^flex-\[/.test(c)) { set('flex', arb(c)); continue; }
    if (/^basis-\[/.test(c)) { set('flex-basis', arb(c)); continue; }
    if (/^grid-cols-\[/.test(c)) { set('grid-template-columns', arb(c)); continue; }
    if (/^grid-rows-\[/.test(c)) { set('grid-template-rows', arb(c)); continue; }
    if (/^leading-\[/.test(c)) { set('line-height', arb(c)); continue; }
    if (/^tracking-\[/.test(c)) { set('letter-spacing', arb(c)); continue; }
    if (/^opacity-\[/.test(c)) { set('opacity', arb(c)); continue; }
    if ((m = c.match(/^opacity-(\d+)$/))) { set('opacity', String(+m[1] / 100)); continue; }
    if (/^z-\[/.test(c)) { set('z-index', arb(c)); continue; }
    if ((m = c.match(/^z-(\d+)$/))) { set('z-index', m[1]); continue; }
    if (/^backdrop-blur-\[/.test(c)) { const v = arb(c); set('backdrop-filter', 'blur(' + v + ')'); set('-webkit-backdrop-filter', 'blur(' + v + ')'); continue; }
    if (/^blur-\[/.test(c)) { filters.push('blur(' + arb(c) + ')'); continue; }
    if (/^drop-shadow-\[/.test(c)) { drops.push('drop-shadow(' + arb(c) + ')'); continue; }
    if (/^shadow-\[/.test(c)) { shadows.push(arb(c)); continue; }
    if (/^bg-\[/.test(c)) {
      const v = arb(c);
      if (/^(linear|radial|conic|url|image)/.test(v)) set('background-image', v); else set('background-color', v);
      continue;
    }
    if (/^border-\[/.test(c)) { const v = arb(c); if (/^[\d.]/.test(v)) bAll = v; else bColor = v; continue; }
    if ((m = c.match(/^border-([tblr])-\[/))) { const v = arb(c); if (/^[\d.]/.test(v)) bSides[{ t: 'top', b: 'bottom', l: 'left', r: 'right' }[m[1]]] = v; else bColor = v; continue; }
    if (/^from-\[/.test(c)) { const v = arb(c); if (/%$/.test(v)) gFromPos = v; else gFrom = v; continue; }
    if (/^via-\[/.test(c)) { const v = arb(c); if (/%$/.test(v)) gViaPos = v; else gVia = v; continue; }
    if (/^to-\[/.test(c)) { const v = arb(c); if (/%$/.test(v)) gToPos = v; else gTo = v; continue; }
    if (/^text-\[/.test(c)) {
      const v = arb(c);
      if (v.startsWith('length:')) {
        const raw = v.slice(7); const fb = raw.match(/var\([^,]+,\s*([^)]+)\)/);
        set('font-size', fb ? fb[1].trim() : raw);
      } else if (/^[\d.]/.test(v)) set('font-size', v);
      else set('color', v);
      continue;
    }
    if (/^font-\[/.test(c) && !/^font-\['/.test(c)) { set('font-weight', arb(c)); continue; }
    if ((m = c.match(/^font-\['([^']+)'\]$/))) {
      const [fam, style] = m[1].split(':');
      set('font-family', FONTS[fam] || '"' + fam.replace(/_/g, ' ') + '","Pretendard",sans-serif');
      set('font-weight', String(WEIGHT[style] || 400));
      if (style && /Italic/.test(style)) set('font-style', 'italic');
      continue;
    }
    unknown.set(c, (unknown.get(c) || 0) + 1);
  }

  if (bAll || Object.keys(bSides).length || bColor || bStyle) {
    set('border-style', bStyle || 'solid');
    if (bColor) set('border-color', bColor);
    if (bAll) set('border-width', bAll);
    else if (Object.keys(bSides).length) set('border-width', '0');
    for (const s of Object.keys(bSides)) set('border-' + s + '-width', bSides[s]);
  }
  if (shadows.length) set('box-shadow', shadows.join(','));
  if (drops.length || filters.length) set('filter', filters.concat(drops).join(' '));
  if (tr.length) {
    /* Tailwind 합성 순서 — 클래스를 적은 순서가 아니라 늘 이 순서다 */
    const TW_TR_ORDER = ['translate', 'rotate', 'skewX', 'skewY', 'scale'];
    const rank = (f) => {
      const fn = (f.split('(')[0] || '');
      for (let i = 0; i < TW_TR_ORDER.length; i++) {
        if (fn.indexOf(TW_TR_ORDER[i]) === 0) return i;
      }
      return TW_TR_ORDER.length;                    /* matrix 등 통짜 값은 맨 뒤 */
    };
    const ordered = tr
      .map((f, i) => ({ f: f, i: i, r: rank(f) }))
      .sort((a, b) => (a.r - b.r) || (a.i - b.i))   /* 같은 자리끼리는 적은 순서 유지 */
      .map((x) => x.f);
    set('transform', ordered.join(' '));
  }
  if (gradDir) {
    const stops = [];
    if (gFrom) stops.push(gFrom + (gFromPos ? ' ' + gFromPos : ''));
    if (gVia) stops.push(gVia + (gViaPos ? ' ' + gViaPos : ''));
    if (gTo) stops.push(gTo + (gToPos ? ' ' + gToPos : ''));
    set('background-image', 'linear-gradient(' + gradDir + ',' + stops.join(',') + ')');
  }
  return d;
}

/* ══════════════════ 3. 화면 한 장 생성 ══════════════════ */
function buildScreen(S) {
  const src = fs.readFileSync(path.join(GEN, 'dc-' + S.key + '.txt'), 'utf8');
  const amap = ASSETMAP[S.key];

  /* 에셋 상수 → 파일명 */
  const assets = {};
  for (const m of src.matchAll(/^const (\w+) = "([^"]+)";/gm)) assets[m[1]] = amap[m[1]];

  /* 텍스트 상자 크기(브라우저 폰트 메트릭이 Figma 와 1~2px 달라 오토레이아웃을 밀어낸다) */
  const META = {};
  for (const f of S.meta) {
    const xml = fs.readFileSync(path.join(GEN, f), 'utf8');
    for (const m of xml.matchAll(/<(\w[\w-]*) id="([^"]+)" name="([^"]*)"(?: x="[-\d.]+")?(?: y="[-\d.]+")? width="([-\d.]+)" height="([-\d.]+)"/g)) {
      /* 인스턴스 안쪽 노드는 `I65:817;65:824` 꼴. 그 id 그대로도, 마스터 id(`65:824`)로도 찾을 수 있게 둘 다 넣는다
         (design context 는 화면에 따라 둘 중 하나를 쓴다) */
      const box = { tag: m[1], name: m[3], w: +m[4], h: +m[5] };
      META[m[2]] = box;
      const id = m[2].split(';').pop();
      if (!META[id]) META[id] = box;
    }
  }

  const comps = collectComponents(src);
  /* 변형 세트 원본 — 각 세트의 컴포넌트 정의와 에셋표를 미리 읽어 둔다 */
  const vsets = {};
  for (const [nid, s] of Object.entries(VARIANT_SETS)) {
    const p = path.join(GEN, s.src);
    if (!fs.existsSync(p)) continue;
    const vsrc = fs.readFileSync(p, 'utf8');
    const va = {};
    for (const m of vsrc.matchAll(/^const (\w+) = "([^"]+)";/gm)) va[m[1]] = ASSETMAP[s.amap][m[1]];
    vsets[nid] = Object.assign({}, s, { comps: collectComponents(vsrc), assets: va });
  }
  const expStart = src.indexOf('export default function');
  const retAt = src.indexOf('return (', expStart);
  const jsxStart = src.indexOf('<', retAt);
  const rootJsx = src.slice(jsxStart, src.lastIndexOf(');'));
  const tree = parseNodes(rootJsx, { comps, assets }, Object.assign({}, assets))[0];

  /* 다른 화면에서 가져다 심는 조각(헤더 드롭다운) — 원본 트리를 그대로 잘라 붙인다.
     scope 에 그 화면의 에셋 파일명이 들어 있어 그림도 따라온다. */
  (GRAFT[S.out] || []).forEach((g) => {
    const gsrc = fs.readFileSync(path.join(GEN, 'dc-' + g.from + '.txt'), 'utf8');
    const ga = {};
    for (const m of gsrc.matchAll(/^const (\w+) = "([^"]+)";/gm)) ga[m[1]] = ASSETMAP[g.from][m[1]];
    const gExp = gsrc.indexOf('export default function');
    const gJsx = gsrc.slice(gsrc.indexOf('<', gsrc.indexOf('return (', gExp)), gsrc.lastIndexOf(');'));
    const gTree = parseNodes(gJsx, { comps: collectComponents(gsrc), assets: ga }, Object.assign({}, ga))[0];
    const cut = findNode(gTree, g.node), host = findNode(tree, g.into);
    if (!cut || !host) throw new Error('graft ' + g.node + ' → ' + g.into + ' 을(를) 못 찾았다');
    cut.__graft = g.key;
    host.children.push(cut);
  });

  /* ── HTML/CSS 출력 ── */
  const PX = S.px, ROOT = '.' + PX + '-root';
  const rules = [], darkRules = [], out = [];
  const usedIds = new Map(); const usedAssets = new Set();
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
  const slug = (s) => s.replace(/[^\w가-힣]+/g, '-').replace(/^-+|-+$/g, '');
  let anon = 0, textFixes = 0, trimFixes = 0, isoFixes = 0, nowrapFixes = 0, ringFixes = 0, borderFixes = 0, variantCount = 0, menuFixes = 0, inlined = 0;
  const seenUc = new Set();
  let curMenu = '';                                        /* 지금 그리는 헤더 탭 이름(상태 바로잡기용) */

  /* 통짜 SVG 를 DOM 으로 심는다 — 색·굵기를 CSS 로 만질 수 있어야 하는 그림용.
     형상(path d)은 한 글자도 손대지 않고, 색만 클래스로 빼서 라이트 테마·'색 정하기'가 닿게 한다.
     preserveAspectRatio="none" 은 원본 파일에 이미 있다(판이 넓어지면 테두리도 같이 늘어난다). */
  function inlineSvg(file, attrs, name, pad) {
    let raw = fs.readFileSync(path.join(ART, file), 'utf8');
    /* 같은 파일을 여러 자리에 심으므로 filter·gradient 처럼 url(#…) 로 참조되는 id 는 매번 새로 짓는다
       (안 그러면 두 번째 게이지가 첫 번째의 필터를 가리켜 그림자가 엉킨다) */
    const refIds = [...new Set([...raw.matchAll(/url\(#([\w.:-]+)\)/g)].map((m) => m[1]))];
    if (refIds.length) {
      const tagId = 'i' + (++inlineSeq);
      for (const rid of refIds) {
        const esc = rid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        raw = raw.replace(new RegExp('id="' + esc + '"', 'g'), 'id="' + tagId + '-' + rid + '"')
          .replace(new RegExp('url\\(#' + esc + '\\)', 'g'), 'url(#' + tagId + '-' + rid + ')');
      }
    }
    const open = raw.match(/<svg([^>]*)>/);
    const inner = raw.slice(raw.indexOf('>', raw.indexOf('<svg')) + 1, raw.lastIndexOf('</svg>'));
    /* 루트 <svg> 속성은 그대로 물려받되 width/height 는 클래스가 정한다(늘어나야 하므로) */
    const keep = (open ? open[1] : '').replace(/\s(width|height|style|id|class)="[^"]*"/g, '');
    out.push(pad + '<svg ' + attrs.join(' ') + keep + ' aria-hidden="true">');
    /* 안쪽 도형마다 클래스를 붙이고 색을 CSS 로 옮긴다 — 속성보다 CSS 가 세서 테마가 이긴다 */
    out.push(inner.replace(/<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)\/?>/g, (all, tag, at) => {
      const idm = /\sid="([^"]*)"/.exec(at);
      const nm = slug(idm ? idm[1] : name) || 'Shape';
      const uc2 = PX + '-svg-' + nm;
      const d2 = [];
      /* hex 뿐 아니라 이름 색(white·black)도 잡는다 — 이 시안의 실린더가 그렇게 그려져 있다 */
      const NAMED = { white: '#ffffff', black: '#000000' };
      const grab = (p) => {
        const m = new RegExp('\\s' + p + '="(#[0-9a-fA-F]{3,8}|white|black)"').exec(at);
        if (m) d2.push([p, NAMED[m[1]] || m[1]]);
      };
      grab('stroke'); grab('fill');
      if (d2.length) {
        rules.push('.' + uc2 + '{' + d2.map(([p, v]) => p + ':' + v).join(';') + ';vector-effect:non-scaling-stroke}');
        const dl = d2.map(([p, v]) => [p, LIGHT.lightDecl(p === 'stroke' ? 'border-color' : 'background-color', v, '')])
          .filter(([, v]) => v);
        if (dl.length) darkRules.push(ROOT + '[data-theme="light"] .' + uc2 + '{' + dl.map(([p, v]) => p + ':' + v).join(';') + '}');
      }
      return '<' + tag + at.replace(/\sid="[^"]*"/, '') + ' id="' + escAttr(uniqueId(nm)) + '" class="' + uc2 + '"/>';
    }).split('\n').filter((l) => l.trim()).map((l) => pad + '  ' + l.trim()).join('\n'));
    out.push(pad + '</svg>');
    inlined++;
  }

  const uniqueId = (name) => {
    const base = PX + '-' + name;
    const n = (usedIds.get(base) || 0) + 1;
    usedIds.set(base, n);
    return n === 1 ? base : base + '_' + n;
  };

  function walk(node, depth, parentBorder, parentOnDark, parentFont) {
    const pad = '  '.repeat(depth);
    if (node.tag === '#text') { out.push(pad + esc(node.text)); return; }
    const a = node.attrs;
    const cn = typeof a.className === 'string' ? a.className : (a.className ? String(evalExpr(a.className.expr, node.scope)) : '');
    const classes = cn.split(/\s+/).filter(Boolean);
    /* 노드 id — data-node-id 우선, 없으면 id="node-65_3324" 형식 */
    let nid = typeof a['data-node-id'] === 'string' ? a['data-node-id'] : '';
    if (!nid && a.id) {
      const idv = typeof a.id === 'string' ? a.id : String(evalExpr(a.id.expr, node.scope));
      const mm = /^node-(\d+)_(\d+)$/.exec(idv); if (mm) nid = mm[1] + ':' + mm[2];
    }
    /* 이 자리는 프로토타입 변형 세트다 — 화면에 박힌 한 상태 대신 원본의 모든 상태를 심는다.
       위치·크기를 정하는 className 은 화면 쪽 것을 그대로 물려줘서 자리가 바뀌지 않는다. */
    if (vsets[nid] && !node.__vset) {
      const S = vsets[nid];
      const def = S.comps[S.comp];
      S.values.forEach(function (v) {
        const sc = Object.assign({}, def.params, { className: cn });
        sc[S.prop] = v;
        for (const [k, ex] of def.derived) sc[k] = evalExpr(ex, sc);
        Object.assign(sc, S.assets);
        const tree = parseNodes(def.jsx, { comps: S.comps, assets: S.assets }, sc)[0];
        tree.__vset = S.key;
        tree.__variant = v;
        tree.__hidden = v !== S.active;
        walk(tree, depth, parentBorder, parentOnDark, parentFont);
      });
      return;
    }

    /* 인스턴스 안쪽 노드 id 는 `I65:2504;65:3517` 꼴이라 `:`·`;` 를 그대로 두면 CSS 선택자가 깨진다
       (규칙 하나가 깨지면 다음 규칙까지 통째로 무시돼 도크 슬롯이 납작해졌다) */
    let uc = nid ? 'n' + nid.replace(/[^\w]/g, '_') : 'x' + ++anon;
    while (seenUc.has(uc)) uc = uc + 'b';                 /* 같은 노드가 두 번 나오면(인스턴스) 분리 */
    seenUc.add(uc);

    const decls = styleFor(classes);
    /* style={{ … }} 인라인 스타일 — Figma 가 그라디언트 배경과 마스크 이미지를 여기로 낸다.
       값이 템플릿 리터럴(url("${imgPart}"))인 자리가 있어 통째로 평가한다(에셋 변수는 scope 안에서 파일명). */
    if (a.style) {
      const obj = evalExpr(a.style.expr, node.scope) || {};
      for (const k of Object.keys(obj)) {
        const prop = k.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
        let val = String(obj[k]);
        if (/^mask/.test(prop)) val = val.replace(/url\("([^"]+)"\)/g, (mm, f) => { usedAssets.add(f); return 'url("{{B}}' + f + '")'; });
        const put = (p, v) => { const i = decls.findIndex((x) => x[0] === p); if (i >= 0) decls[i][1] = v; else decls.push([p, v]); };
        put(prop, val);
        if (/^mask-/.test(prop)) put('-webkit-' + prop, val);
      }
    }
    /* Figma 의 이미지 채우기·자식 좌표는 border box 기준인데 CSS 절대배치는 padding box 기준이라
       테두리 있는 부모 안의 inset:0 자식이 테두리 두께만큼 밀린다 → 음수 inset 으로 되돌린다.
       img 는 교체요소라 inset 만으론 안 늘어나므로 크기를 직접 준다. */
    if (parentBorder) {
      const gi = decls.findIndex((x) => x[0] === 'inset');
      if (gi >= 0 && decls[gi][1] === '0') {
        const bw = parseFloat(parentBorder);
        decls.splice(gi, 1, ['left', -bw + 'px'], ['top', -bw + 'px'],
          ['width', 'calc(100% + ' + bw * 2 + 'px)'], ['height', 'calc(100% + ' + bw * 2 + 'px)']);
        for (let i = decls.length - 1; i >= 0; i--) {
          if ((decls[i][0] === 'width' || decls[i][0] === 'height') && decls[i][1] === '100%' && i > gi + 3) decls.splice(i, 1);
        }
        borderFixes++;
      }
    }
    if (FIX_SIZE.indexOf(nid) >= 0 && META[nid]) {
      decls.push(['width', +META[nid].w.toFixed(3) + 'px'], ['height', +META[nid].h.toFixed(3) + 'px'], ['overflow', 'hidden']);
    }
    /* 이 노드에 적힌 글꼴 크기 — 없으면 조상에게서 물려받는다(자식에게도 이걸 내린다) */
    const fsOwn = decls.find((x) => x[0] === 'font-size');
    const myFont = fsOwn ? parseFloat(fsOwn[1]) : parentFont;
    /* 텍스트 상자 고정 — <p> 뿐 아니라 text-box-trim 을 쓴 래퍼 div(원본이 text 노드인 것)도 대상 */
    if ((node.tag === 'p' || (META[nid] && META[nid].tag === 'text')) && META[nid] && META[nid].w != null) {
      const mw = META[nid].w, mh = META[nid].h;
      const has = (p) => decls.some((x) => x[0] === p);
      if (!has('width')) decls.push(['width', +mw.toFixed(3) + 'px']);
      const trimmed = classes.some((c) => c.indexOf('text-box-trim') >= 0);
      if (trimmed && !has('height') && mh <= 48) decls.push(['height', +mh.toFixed(3) + 'px']);
      if (!trimmed && !has('height') && mh <= 48) {
        const i = decls.findIndex((x) => x[0] === 'line-height');
        if (i >= 0) decls[i][1] = +mh.toFixed(3) + 'px'; else decls.push(['line-height', +mh.toFixed(3) + 'px']);
      }
      /* 원본에서 한 줄이던 글자는 여기서도 한 줄이라야 한다(위 주석 참고).
         상자 높이가 글꼴 한 줄 높이면 원본에서 안 접힌 것이다 — 두 줄짜리는 2.3배쯤 되므로 안 걸린다. */
      if (myFont && mh <= myFont * 1.6 && !has('white-space')) {
        decls.push(['white-space', 'nowrap']);
        nowrapFixes++;
      }
      textFixes++;
    }
    /* 테두리 처리 —
       이 파일의 Figma 코드 출력은 stroke 정렬을 이미 padding 에 반영해서 낸다(측정으로 확인):
         Tab/Load(65:710) w=208 = border1 + px-[33] + Label140 + px-[33] + border1
         Row(65:579)     h=38  = border1 + py-[9]  + Td18     + py-[9]  + border1
       → CSS border 를 그대로 두면 Figma 상자와 정확히 같아진다. 링(::after) 변환은 오히려 2px 씩 줄인다.
       (SK하이닉스 시안은 반대였다 — 파일마다 다르므로 노드 상자 대조로 판정할 것.)
       RING_STROKE 에 넣은 노드만 예외로 링으로 그린다. */
    const bwI = decls.findIndex((x) => x[0] === 'border-width');
    const hasSide = decls.some((x) => /^border-(top|right|bottom|left)-width$/.test(x[0]));
    let ring = null;
    const ringKey = nid || ('@' + (typeof a['data-name'] === 'string' ? a['data-name'] : ''));
    const outside = OUTSIDE_STROKE.indexOf(nid) >= 0;
    if (bwI >= 0 && !hasSide && parseFloat(decls[bwI][1]) > 0 && (outside || RING_STROKE.indexOf(ringKey) >= 0)) {
      const bw = parseFloat(decls[bwI][1]);
      const bc = (decls.find((x) => x[0] === 'border-color') || [, 'currentColor'])[1];
      const bs = (decls.find((x) => x[0] === 'border-style') || [, 'solid'])[1];
      const rr = decls.find((x) => x[0] === 'border-radius');
      const off = outside ? bw : +(bw / 2).toFixed(4);   /* 바깥 정렬은 통째로 밖, 가운데 정렬은 절반만 밖 */
      let rad = 'inherit';
      if (rr) { const v = parseFloat(rr[1]); if (!isNaN(v) && /^[\d.]+px$/.test(rr[1].trim())) rad = +(v + off).toFixed(4) + 'px'; }
      for (let i = decls.length - 1; i >= 0; i--) if (/^border-(width|color|style)$/.test(decls[i][0])) decls.splice(i, 1);
      if (!decls.some((x) => x[0] === 'position')) decls.push(['position', 'relative']);
      ring = ROOT + ' .' + uc + '::after{content:"";position:absolute;inset:-' + off + 'px;'
        + 'border:' + bw + 'px ' + bs + ' ' + bc + ';border-radius:' + rad + ';pointer-events:none;}';
      ringFixes++;
    }
    /* 헤더 탭 상태 바로잡기 — 그림과 함께 글자색도 상태를 따라간다(선택=흰색, 기본=회색) */
    const msc = MENU_STATE[S.out] && MENU_STATE[S.out][curMenu];
    if (msc && node.tag === 'p') {
      const ci = decls.findIndex((x) => x[0] === 'color');
      if (ci >= 0) { decls[ci][1] = msc.color; menuFixes++; }
    }
    if (isoPlateScale(decls)) isoFixes++;
    if (decls.length) {
      rules.push(ROOT + ' .' + uc + '{' + decls.map(([p, v]) => p + ':' + v).join(';') + '}');
      /* 트림은 상속되지 않는다 — 글자를 담은 자식에도 같이 걸어 준다.
         단 **줄이 하나일 때만** 건다. trim-both 는 덩어리의 첫 줄 위와 마지막 줄 아래만 깎는데,
         Figma 는 두 줄짜리 글자를 <p> 두 개로 쪼개 내므로 줄마다 걸면 줄 사이 여백이 사라져
         글자가 서로 붙어 버린다(네트워크현황 CD-AOC-/APML01 이 그랬다).
         여러 줄짜리는 손대지 않는 게 원본과 같다 — 줄 간격이 그대로 12px 로 유지된다. */
      const trimV = decls.filter(([p]) => p === 'text-box-trim')[0];
      const edgeV = decls.filter(([p]) => p === 'text-box-edge')[0];
      if (trimV && String(trimV[1]).indexOf('trim-') === 0 && node.tag !== 'p') {
        const only = ':first-of-type:last-of-type';                 /* 그 종류의 자식이 하나뿐일 때 */
        const body = 'text-box-trim:' + trimV[1] + (edgeV ? ';text-box-edge:' + edgeV[1] : '');
        rules.push(ROOT + ' .' + uc + '>p' + only + ',' + ROOT + ' .' + uc + '>span' + only + '{' + body + '}');
        trimFixes++;
      }
    }
    if (ring) rules.push(ring);

    /* 다크가 아니라 '라이트' 테마를 파생한다 — 원본이 다크 시안이다(light.js 가 대응표를 준다).
       컬러 배지·어두운 막대 위의 글자는 라이트에서도 흰색이라야 한다(안 그러면 대비가 3.7:1 로 떨어진다)
       → 이 노드의 '라이트 이후 면 밝기'를 재서, 어두우면 자손의 글자색 변환을 건너뛴다. */
    const myLuma = LIGHT.surfaceLuma(decls);
    const onDark = myLuma == null ? parentOnDark : myLuma < 0.42;
    const dd = [];
    decls.forEach(([p, v]) => {
      if (onDark && (p === 'color' || p === '-webkit-text-fill-color')) return;
      const nv = LIGHT.lightDecl(p, v, nid); if (nv) dd.push([p, nv]);
    });
    if (dd.length) darkRules.push(ROOT + '[data-theme="light"] .' + uc + '{' + dd.map(([p, v]) => p + ':' + v).join(';') + '}');
    if (ring) {
      const mm = ring.match(/border:([^;]+);border-radius/);
      if (mm) { const nb = LIGHT.lightRing(mm[1]); if (nb) darkRules.push(ROOT + '[data-theme="light"] .' + uc + '::after{border:' + nb + ';}'); }
    }

    const cls = [uc];
    const dn = typeof a['data-name'] === 'string' ? a['data-name'] : (META[nid] && META[nid].name) || '';
    if (dn) cls.push(PX + '-' + slug(dn));
    const attrs = [
      'id="' + escAttr(uniqueId(dn || nid || (node.tag === 'img' ? 'Asset' : 'Node'))) + '"',
      'class="' + cls.join(' ') + '"',
    ];
    if (dn) attrs.push('data-name="' + escAttr(dn) + '"');
    if (nid) attrs.push('data-node-id="' + nid + '"');
    /* 이 심볼이 어떤 상태로 박제돼 있는지 — 위험 상태만 hana-live.js 가 깜빡이게 한다 */
    if (node.__status) attrs.push('data-hn-status="' + escAttr(node.__status) + '"');
    if (node.__vtype) attrs.push('data-hn-type="' + escAttr(node.__vtype) + '"');
    if (node.__vset) {
      attrs.push('data-hj-vset="' + node.__vset + '"', 'data-hj-variant="' + node.__variant + '"');
      /* 대기 중인 상태는 감춰 둔다 — 클릭하면 이 자리에서 바로 바뀐다 */
      if (node.__hidden) attrs.push('hidden');
      variantCount++;
    }
    /* 다른 화면에서 옮겨 심은 조각 — 처음엔 접혀 있고 `통합관제` 를 누르면 펼쳐진다 */
    if (node.__graft) attrs.push('data-hj-graft="' + node.__graft + '"', 'hidden');
    if (node.tag === 'img') {
      /* 에셋 변수는 scope 안에서 곧바로 파일명이므로 식을 그대로 평가하면 파일명이 나온다
         (삼항으로 층별 그림을 고르는 자리가 있다: src={is4F ? imgShape13 : imgShape12}) */
      const v = a.src && a.src.expr;
      let f = String(evalExpr(v, node.scope));
      if (!f || f === 'undefined') throw new Error('unknown asset ' + v);
      /* 헤더 탭 상태 바로잡기 — 원본이 거꾸로 그려 둔 자리만 같은 모양의 다른 상태 그림으로 바꾼다 */
      const ms = MENU_STATE[S.out] && MENU_STATE[S.out][curMenu];
      if (ms && ms.from === f) { f = ms.to; menuFixes++; }
      if (INLINE_SVG.indexOf(f) >= 0) {                    /* 통짜 그림 대신 DOM 으로 심는다 */
        inlineSvg(f, attrs, dn || 'Svg', pad);
        return;
      }
      usedAssets.add(f);
      attrs.push('src="{{B}}' + f + '"', 'alt=""');
      out.push(pad + '<img ' + attrs.join(' ') + '>');
      return;
    }
    if (EXPORT_SVG[nid]) {                                 /* 마스크 덩어리 → 내보낸 원본 SVG 한 장 */
      usedAssets.add(EXPORT_SVG[nid]);
      out.push(pad + '<' + node.tag + ' ' + attrs.join(' ') + '>');
      out.push(pad + '  <img id="' + escAttr(uniqueId(dn + ' Artwork')) + '" class="' + PX + '-Artwork" alt=""'
        + ' style="position:absolute;left:0;top:0;width:100%;height:100%" src="{{B}}' + EXPORT_SVG[nid] + '">');
      out.push(pad + '</' + node.tag + '>');
      return;
    }
    if (!node.children.length) { out.push(pad + '<' + node.tag + ' ' + attrs.join(' ') + '></' + node.tag + '>'); return; }
    if (node.children.length === 1 && node.children[0].tag === '#text') {
      out.push(pad + '<' + node.tag + ' ' + attrs.join(' ') + '>' + esc(node.children[0].text) + '</' + node.tag + '>');
      return;
    }
    out.push(pad + '<' + node.tag + ' ' + attrs.join(' ') + '>');
    const bw2 = decls.find((x) => x[0] === 'border-width');
    const kid = !ring && bw2 && bw2[1] !== '0' ? bw2[1] : null;
    const prevMenu = curMenu;
    if (dn.indexOf('Menu Item/') === 0) curMenu = dn;
    node.children.forEach((c) => walk(c, depth + 1, kid, onDark, myFont));
    curMenu = prevMenu;
    out.push(pad + '</' + node.tag + '>');
  }
  walk(tree, 1, null, false, null);

  const unusedFiles = Object.values(amap).filter((f, i, arr) => arr.indexOf(f) === i && !usedAssets.has(f));
  return {
    S, html: out.join('\n'), rules, darkRules,
    stat: { nodes: rules.length, texts: textFixes, trims: trimFixes, iso: isoFixes, nowrap: nowrapFixes, rings: ringFixes, borderFixes, unused: unusedFiles.length, assets: usedAssets.size, variants: variantCount, menu: menuFixes, inlined },
  };
}

/* CSS border 대신 ::after 링으로 그려야 하는 노드 — 이 프레임들만 Figma 가 padding 에 stroke 를 안 넣었다.
   판정은 손이 아니라 측정으로 한다: 브라우저에서 [data-node-id] 상자를 get_metadata 크기와 대조해
   정확히 +2px(=테두리 두께 2배) 큰 프레임이 여기 들어간다(_gen/README.md 의 '검증' 참고). */
let inlineSeq = 0;   /* 인라인 SVG 마다 참조 id 를 고유하게 만들 번호 */
const RING_STROKE = [];

/* 바깥 정렬(outside) stroke — 상자 밖으로 B 만큼 더 그려야 하는 테두리.
   도넛 차트 가운데 원(Total)의 8px 테두리가 그렇다: 원본은 반지름 66~74 를 rgba(19,23,53,.5) 로 덮어
   색 링의 안쪽 8px 을 어둡게 만든다(픽셀 대조로 확인 — 안쪽 정렬로 두면 검은 가운데에 묻혀 안 보인다). */
const OUTSIDE_STROKE = [];

/* 마스크로 잘린 아트워크 — CSS inline-grid 는 마스크를 모르고 자식 상자(131.96px)까지 자란다.
   Figma 가 준 상자 크기를 박고 넘치는 부분을 자른다. */
const FIX_SIZE = [];

/* ── 통짜 그림 대신 DOM 으로 심을 SVG ──
   `border.svg`(도크 상세현황 판 테두리)는 <img> 로 두면 색을 못 만진다.
   인라인 <svg> 로 심고 선 색을 클래스로 빼면 라이트 테마와 '색 정하기'가 그대로 닿고,
   판이 넓어질 때 테두리도 같이 늘어난다(원본 파일에 preserveAspectRatio="none" 이 이미 있다). */
/* 통짜 그림 대신 DOM 으로 심을 SVG — 구간별 성능현황의 실린더 게이지 5종.
   안쪽 <g id="Disk"> 를 꺼내야 '원판이 위에서 떨어지는' 연출을 걸 수 있다. */
const INLINE_SVG = ['visual-5.svg', 'visual-1-2.svg', 'visual-2-2.svg', 'visual-3-2.svg', 'visual-4-2.svg'];

/* ── 헤더 탭 상태 바로잡기 ──
   원본 시안이 하위 화면(입출문·하차현황)에서 두 탭의 상태를 거꾸로 그려 두었다:
   지금 보고 있는 화면이 `통합관제` 아래인데도 `대시보드` 쪽에 '선택됨'(그라디언트 판 + 흰 글자)이,
   `통합관제` 쪽에 '기본'(검은 판 + 회색 글자)이 들어가 있다. 사용자 확인을 받아 맞바꾼다.
   그림은 원본 파일 그대로 쓴다 — 같은 모양의 기본/선택 두 벌이 이미 내려받혀 있다
   (140x38 대시보드꼴: 기본 visual-2 · 선택 visual-1-*, 141x39 통합관제꼴: 기본 visual-2-2 · 선택 visual-3). */
const MENU_STATE = {};

/* ── 헤더 드롭다운 이식 ──
   하위 화면에는 원본에 드롭다운이 없다. `통합관제` 를 눌러 화면을 옮길 수 있어야 해서
   통합관제 화면(65:429)의 드롭다운(65:434)을 **그대로** 옮겨 심는다(새로 그리지 않는다).
   두 화면의 Header 는 똑같이 `absolute contents left-40 top-10` 이라 좌표계가 같고,
   가로 자리는 hana-live.js 의 alignDropdown 이 탭 중심에 맞춘다. */
const GRAFT = {};

/* ── 프로토타입 변형 세트 ──
   화면에는 한 상태만 박혀 있지만(층선택은 2F, 카메라 프리셋은 1번 선택) 원본 컴포넌트는
   Figma variant 로 모든 상태를 갖고 있다. 그 상태들을 전부 심어 두고 '보이는 것'만 바꾼다
   — 손으로 만든 상태가 아니라 원본 그대로의 형상·색이 오간다.
   키는 화면에서 그 자리를 차지한 노드 id 다(그 subtree 를 통째로 대체). */
const VARIANT_SETS = {};

/* 한 장짜리 원본 SVG 로 통째로 갈아 끼우는 노드 —
   `Ramp`(65:2368)는 겹겹의 luminance 마스크 110여 노드로 그려져 있어(import 잔재) CSS 마스크로는 재현이 안 된다.
   Figma `download_assets`(format=svg)로 그 노드만 통째로 내보낸 원본 벡터를 그대로 쓴다(손으로 그리지 않는다).
   내보낸 파일 앞머리의 캔버스 흰 판과 화면 배경 사각형 두 개만 지워 투명하게 만들었다. */
const EXPORT_SVG = {};

/* ══════════════════ 4. 파일 출력 ══════════════════ */
const BASE_CSS = (PX) => [
  "@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');",
  '.' + PX + '-root{position:absolute;inset:0;overflow:hidden;background:#05050a;z-index:5;'
  + 'font-family:"Pretendard","Pretendard Variable","Malgun Gothic",-apple-system,system-ui,sans-serif;'
  + 'font-size:16px;font-weight:400;font-style:normal;line-height:normal;letter-spacing:normal;'
  + 'color:#fff;text-align:left;text-transform:none;word-spacing:normal;-webkit-font-smoothing:antialiased;}',
  '.' + PX + '-root,.' + PX + '-root *,.' + PX + '-root *::before,.' + PX + '-root *::after{box-sizing:border-box;}',
  '.' + PX + '-root *{margin:0;padding:0;border:0 solid transparent;background:none;font:inherit;color:inherit;text-decoration:none;}',
  '.' + PX + '-root img{display:block;border:0;max-width:none;}',
  /* 대기 중인 프로토타입 상태(변형 세트) — 노드마다 display 규칙이 있어서 브라우저 기본 [hidden] 이 밀린다 */
  '.' + PX + '-root [hidden]{display:none!important;}',
].join('\n');

const results = SCREENS.map(buildScreen);

for (const r of results) {
  const PX = r.S.px;
  const CSS = BASE_CSS(PX) + '\n' + r.rules.join('\n');
  const LIGHT_CSS = ['/* ' + r.S.name + ' — 라이트 테마(형상 동일, 색만 반전). 생성기: _gen/dark.js */']
    .concat(LIGHT.lightExtra(PX)).concat(r.darkRules).join('\n');
  const G = PX.toUpperCase();
  const MODULE = [
    '/* 한진 SMART 통합관제 — ' + r.S.name,
    '   원본: Figma H3S2M7DUCvuJgi75oBqg6W / node ' + r.S.node + ' (1920x1080, page Page 1)',
    '   순수 HTML/CSS 재구축. 글자는 편집 가능한 실제 텍스트(SVG 아님),',
    '   아이콘·이미지는 원본에서 내려받은 개별 에셋 그대로(손으로 그린 벡터 없음).',
    '   Figma 레이어명은 id="' + PX + '-<레이어명>" · class="' + PX + '-<레이어명>" · data-name 에 보존하고,',
    '   스타일 훅은 노드 id 기반 유일 클래스(n' + r.S.node.replace(':', '_') + ')로 건다. 좌표·크기·색은 Figma 값 그대로.',
    '   생성기: src/hana/_gen/conv.js — 손으로 고치지 말 것. */',
    '(function () {',
    "  var A = 'src/hana/';",
    '  var CSS = ' + JSON.stringify(CSS) + ';',
    '  var HTML = ' + JSON.stringify(r.html) + ';',
    '  var LIGHT = ' + JSON.stringify(LIGHT_CSS) + ';',
    '  window.' + G + '_CSS = CSS.split(\'{{B}}\').join(A);',
    '  window.' + G + '_LIGHT_CSS = LIGHT.split(\'{{B}}\').join(A);',
    '  window.build_' + PX + ' = function (base) { return HTML.split(\'{{B}}\').join(base || A); };',
    '})();',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(STUDIO, 'src', r.S.out + '.js'), MODULE);

  const PREVIEW = [
    '<!doctype html><html lang="ko"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title>' + r.S.name + ' — Figma ' + r.S.node + ' 재구축</title>',
    '<style>', CSS.split('{{B}}').join('./'), LIGHT_CSS.split('{{B}}').join('./'),
    'html,body{margin:0;padding:0;height:100%;overflow:hidden;background:#05050a;}',
    '.' + PX + '-fit{position:fixed;inset:0;overflow:hidden;}',
    '.' + PX + '-stage{position:absolute;inset:0;overflow:hidden;}',
    '</style></head><body><div class="' + PX + '-fit"><div class="' + PX + '-stage"><div class="' + PX + '-root">',
    r.html.split('{{B}}').join('./'),
    '</div></div></div>',
    '<script src="../recent-time.js?v=1"></script>',
    '<script src="../hana-live.js?v=1"></script>',
    '<script>window.initHana && window.initHana(document.querySelector(".' + PX + '-root"));</script>',
    /* 미리보기 전용 — 테마 토글. ?t=light 로 열면 라이트로 시작하고 버튼은 숨긴다(픽셀 대조용). */
    '<button id="tt" style="position:fixed;right:12px;bottom:12px;z-index:99;padding:8px 14px;border-radius:8px;border:1px solid #8888;background:#fff8;font:13px system-ui;cursor:pointer">theme</button>',
    '<script>(function(){var r=document.querySelector(".' + PX + '-root");'
    + 'var q=new URLSearchParams(location.search);if(q.get("t")){r.dataset.theme=q.get("t");tt.style.display="none";}'
    + 'tt.onclick=function(){r.dataset.theme=r.dataset.theme==="light"?"dark":"light";};})();</script>',
    '</body></html>',
  ].join('\n');
  fs.writeFileSync(path.join(STUDIO, 'src', 'hana', r.S.out.replace('hana-', '') + '.html'), PREVIEW);
  console.log(r.S.out.padEnd(15), 'nodes', String(r.stat.nodes).padStart(5),
    '텍스트고정', String(r.stat.texts).padStart(4), '링', String(r.stat.rings).padStart(3),
    'border보정', String(r.stat.borderFixes).padStart(3), '에셋', String(r.stat.assets).padStart(4),
    '변형', String(r.stat.variants).padStart(3), '탭보정', r.stat.menu, '인라인SVG', r.stat.inlined, '미사용', r.stat.unused, 'html', r.html.length, 'css', CSS.length);
}

if (unknown.size) {
  console.log('!! UNKNOWN CLASSES:');
  for (const [k, v] of [...unknown].sort((a, b) => b[1] - a[1])) console.log('   ' + k + ' x' + v);
} else console.log('all classes translated');
