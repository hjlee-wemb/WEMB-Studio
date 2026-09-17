/* 라이트 테마 대응표를 이 시안(짙은 남색 관제 화면)에 맞춘다.

   hana 에서 복사해 온 light.js 는 '짙은 초록' 시안 기준이라 두 가지가 어긋난다.
     ① 무채색 기준 색상각이 168°(초록) — 이 시안은 남색이라 218° 여야 회색이 어색하지 않다.
     ② **아주 어두운 남색 판(#1c2432 · #191919 위의 남색 계열)** 이 '유채색'으로 분류돼
        (채도 0.28) 면 색이 그대로 남았다 → 라이트에서 판이 까맣게 남고 그 위 글자가 묻힌다.
        아주 어두운 유채색 면·선은 색상각을 지킨 채 밝은 쪽으로 옮긴다(mk-light-assets.js 와 같은 규칙).
   그리고 이 시안 몫의 추가 규칙(lightExtra)을 새로 쓴다 — 바탕 사진·판 텍스처.

   실행: node src/posco/_gen/patch-light.js */
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'light.js');
let s = fs.readFileSync(p, 'utf8');
if (s.indexOf('POSCO') >= 0) { console.log('이미 반영돼 있다'); process.exit(0); }
const nl = s.indexOf('\r\n') >= 0 ? '\r\n' : '\n';

/* ── ① autoLight — 기준 색상각과 '아주 어두운 유채색 면' 규칙 ── */
const OLD_AUTO_HUE = "return out(fromHsl({ h: 168, s: 0.08, l: nl, a: h.a }));";
if (s.indexOf(OLD_AUTO_HUE) < 0) throw new Error('autoLight 무채색 자리를 못 찾았다');
s = s.split(OLD_AUTO_HUE).join("return out(fromHsl({ h: 218, s: 0.07, l: nl, a: h.a }));   /* POSCO — 남색 시안 */");

const OLD_TAIL = "  return null;                                        /* 면의 브랜드색은 그대로 둔다 */";
if (s.indexOf(OLD_TAIL) < 0) throw new Error('autoLight 꼬리를 못 찾았다');
s = s.split(OLD_TAIL).join([
  '  /* POSCO — 아주 어두운 유채색 면·선(짙은 남색 판)은 색상각을 지킨 채 밝은 쪽으로 옮긴다.',
  '     채도가 아주 높은 것(브랜드 파랑 #004BFF, 상태색)은 그대로 둔다 — 색이 곧 의미라서. */',
  '  if ((role === \'bg\' || role === \'border\') && h.l < 0.32 && h.s < 0.62) {',
  '    return out(fromHsl({ h: h.h, s: Math.min(0.32, h.s * 0.5), l: 0.9 - h.l * 0.5, a: h.a }));',
  '  }',
  '  return null;                                        /* 면의 브랜드색은 그대로 둔다 */',
].join(nl));

/* ── ② lightExtra — 이 시안 몫 ── */
const at = s.indexOf('function lightExtra(PX) {');
if (at < 0) throw new Error('lightExtra 를 못 찾았다');
const end = s.indexOf('\n}', at);
const NEW = [
  'function lightExtra(PX) {',
  '  const R = \'.\' + PX + \'-root[data-theme="light"]\';',
  '  /* 판 텍스처(body.png)를 쓰는 자리 — 좌측 층 선택 패널과 우측 자산정보현황.',
  '     텍스처는 어두운 노이즈라 라이트에서 그대로 두면 판이 까맣게 남는다.',
  '     그림을 바꾸지 않고 **흰 막을 한 겹 덮어** 밝게 만든다(형상·자리 그대로). */',
  '  const TEXTURED = [\'.n17_9453\', \'.nI2_18449_199_6534\'];',
  '  const rules = [',
  '    R + \'{background:#eef2f7;color:#0e1a2b;}\',',
  '    /* 바탕 별밭 사진은 어두운 밤하늘이다 — 색만 뒤집어 밝은 하늘로(형상 그대로) */',
  '    R + \' [data-name="Background"] > img{filter:invert(1) hue-rotate(180deg) saturate(0.4) brightness(1.05);opacity:0.5;}\',',
  '    /* 3D 건물 렌더는 흰 건물이라 라이트에서도 그대로 두되, 바닥 반사만 살짝 눌러 준다 */',
  '    R + \' [data-name="Building Image"] img{filter:saturate(0.92) brightness(0.98);}\',',
  '  ];',
  '  TEXTURED.forEach(function (c) {',
  '    rules.push(R + \' \' + c + \'{position:relative;}\');',
  '    rules.push(R + \' \' + c + \'::before{content:"";position:absolute;inset:0;border-radius:inherit;\'',
  '      + \'background:rgba(247,250,254,0.88);pointer-events:none;z-index:0;}\');',
  '  });',
  '  /* 어두운 바탕 전제로 그려진 벡터는 색만 옮긴 사본으로 갈아 끼운다.',
  '     img 의 src 는 CSS 로 못 바꾸지만 `content:url()` 은 그린 결과를 바꾼다(레이아웃은 그대로). */',
  '  const lines = [];',
  '  for (const [orig, lt] of Object.entries(VARIANTS)) {',
  '    lines.push(R + \' img[src$="/\' + orig + \'"]{content:url("{{B}}\' + lt + \'");}\');',
  '  }',
  '  rules.push(\'/* 라이트 전용 에셋 사본 \' + lines.length + \'개 — 생성기 _gen/mk-light-assets.js */\');',
  '  return rules.concat(lines);',
].join(nl);
s = s.slice(0, at) + NEW + s.slice(end);

fs.writeFileSync(p, s);
console.log('patched light.js — POSCO 팔레트');
