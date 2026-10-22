/* ── 분자 검증 — 따로 떼어 그린 분자가 원래 템플릿 안에서와 같은지 ──
   모든 변형(원본 조각 + 구성도 심볼 · 라벨 조각)을 화면 밖에 1:1 로 그려 템플릿에서 잰 값(measure)과 비교한다.
     위치   : 글자 필드의 분자 안 위치가 원래와 2px 넘게 다르면
     겹침   : 원래는 안 겹치던 보이는 글자끼리 겹치면
     잘림   : 글자가 보여 주는 상자(썸네일 · 캔버스 분자 크기) 밖으로 2px 넘게 나가면
     빈 그림 : 크기가 0 이면
   원본에서 다른 레이어에 가려져 있던 글자(hidden)는 비교하지 않는다(따로 그릴 때도 숨긴다). */
import { loadVariants, variant, mountMolecule } from './render.js';

const TOL = 2;
const rectIn = (el, origin) => { const r = el.getBoundingClientRect(); return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height }; };
const textRect = (f, origin) => {
  const t = [...f.childNodes].find(n => n.nodeType === 3 && n.data.trim());
  const range = document.createRange();
  if (t) range.selectNodeContents(t); else range.selectNodeContents(f);
  const r = range.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
};
const overlap = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 1 && h > 1 ? (w * h) / Math.max(1, Math.min(a.w * a.h, b.w * b.h)) : 0;
};

export async function verifyAll({ lib, measures, onProgress }) {
  const issues = [];
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-30000px;top:0;pointer-events:none';
  document.body.append(host);
  // 라이브러리 요약에는 변형 목록이 없다 — 분자마다 상세를 받아 온다
  const details = [];
  for (const m of lib.molecules) details.push(m.variants ? m : { ...m, ...(await (await fetch('api/molecules/' + encodeURIComponent(m.id))).json()) });
  const jobs = details.flatMap(m => m.variants.map(vid => ({ m, vid })));
  try {
    for (let n = 0; n < jobs.length; n += 100) await loadVariants(jobs.slice(n, n + 100).map(j => j.vid));
    let done = 0;
    for (const { m, vid } of jobs) {
      const v = variant(vid);
      const use = v.uses[0];
      const box = measures[use.template]?.boxes?.[use.instance];
      const add = (kind, detail) => issues.push({ kind, molecule: m.id, name: m.name, role: m.role, variant: vid, template: use.template, detail });
      if (!box) { add('참고: 원본에서 숨김', '원래 화면에서 숨겨진 상태(탭 · 호버 등)라 크기를 잴 수 없음 — 내용 크기로 그린다'); continue; }
      const el = document.createElement('div');
      host.append(el);
      try {
        const size = await mountMolecule(el, { molecule: m, variantId: vid, version: null, theme: { mode: v.defaultTheme, seed: null }, box });
        // 실제로 보여 주는 상자 — 썸네일 · 캔버스와 똑같이 mountMolecule 이 돌려준 크기로 자른다
        const hostRect = el.getBoundingClientRect();
        let root, origin;
        if (size.context) {
          // 문맥 그리기 — 원래 화면 안의 그 분자. 보여 주는 상자의 왼쪽 위 = 분자(조각) 상자의 왼쪽 위
          root = el.shadowRoot.querySelector(`[data-wa-i="${use.instance}"]`);
          origin = hostRect;
        } else {
          const wrap = el.shadowRoot.firstElementChild;
          root = wrap.firstElementChild;
          // 비교 기준점 — 조각은 감싸개(조각 상자), 그 밖은 분자 루트의 실제 상자(display:contents 면 자식 합집합)
          origin = v.part ? wrap.getBoundingClientRect() : ownBox(root);
        }
        if (!root) { add('빈 그림', '분자를 찾지 못함'); continue; }
        const shown = { left: hostRect.left, top: hostRect.top, width: size.width, height: size.height };
        if (!size.width || !size.height) { add('빈 그림', '크기 0'); continue; }
        const part = v.part ? box.parts?.[v.part] : null;
        const shift = part ? { x: part.x - box.x, y: part.y - box.y } : { x: 0, y: 0 };
        const seen = [];
        v.order.forEach((key, i) => {
          const f = nodeAt(root, v.fieldPaths[i]);
          const exp = box.fields?.[key];
          if (!f || !exp || exp.hidden) return;
          const got = textRect(f, origin);
          const want = { x: exp.x - shift.x, y: exp.y - shift.y, w: exp.w, h: exp.h };
          const dx = got.x - want.x, dy = got.y - want.y;
          if (Math.abs(dx) > TOL || Math.abs(dy) > TOL) add('위치', `${m.fields[i]?.name || key}: ${dx.toFixed(0)}, ${dy.toFixed(0)}px 어긋남`);
          const gx = got.x + origin.left - shown.left, gy = got.y + origin.top - shown.top;
          if (gx < -TOL || gy < -TOL || gx + got.w > shown.width + TOL || gy + got.h > shown.height + TOL) add('잘림', `${m.fields[i]?.name || key}: 보여 주는 상자 밖으로 나가 잘림`);
          for (const s of seen) {
            const before = overlap({ ...s.want }, want);
            if (overlap(s.got, got) > 0.2 && before <= 0.2) add('겹침', `${s.name} ↔ ${m.fields[i]?.name || key}`);
          }
          seen.push({ got, want, name: m.fields[i]?.name || key });
        });
      } finally { el.remove(); }
      if (++done % 50 === 0) { onProgress?.(done, jobs.length); await new Promise(r => setTimeout(r, 0)); }
    }
  } finally { host.remove(); }
  return { checked: jobs.length, issues };
}

function ownBox(el) {
  const r = el.getBoundingClientRect();
  if (r.width || r.height) return r;
  const rs = [...el.children].map(c => ownBox(c)).filter(x => x.width || x.height);
  if (!rs.length) return r;
  const left = Math.min(...rs.map(x => x.left)), top = Math.min(...rs.map(x => x.top));
  return { left, top, width: Math.max(...rs.map(x => x.right ?? x.left + x.width)) - left, height: Math.max(...rs.map(x => x.bottom ?? x.top + x.height)) - top };
}

function nodeAt(root, path) {
  let node = root;
  for (const i of path || []) node = node?.children[i];
  return node;
}
