/* ── WEMB 3D 엔진 — 디지털 트윈 · 템플릿 그림 자리에 three.js 모형을 띄우는 공용 틀 ──
   window.WEMB3D
     load()            three.js · OrbitControls 를 한 번만 싣는다 — 로컬 사본(src/vendor/three, 오프라인) 먼저, 안 되면 jsDelivr
     create(opts)      캔버스 하나에 모형 하나를 띄운다 → api { view, flyTo, select, startTour, stopTour, wake, grab, dispose }
     models[name]      모형 만들기 함수 (js/preview/3d/models.js) — (THREE, K) => { views, tour, … }
     bakeClone(root)   복제본(A/B 비교 · 썸네일 · HTML 내보내기)의 3D 캔버스를 지금 모습의 그림으로 바꾼다
                       (복제된 WebGL 캔버스는 비어 있다)
   공통 동작
   - 마우스: 끌기 = 돌리기(한 바퀴 다), 오른쪽 끌기 = 옮기기, 휠 = 확대/축소. 건물(부분)에 올리면 테두리, 누르면 다가간다.
   - 그릴 일이 있을 때만 그린다. 가만히 있으면 GPU 를 쓰지 않는다. 멈추면 정지 그림을 남긴다(onStill).
   - 색: 강조(선택 · 올림 테두리)는 --point-main, 불투명 캔버스의 바탕은 --bg-page.
   사진 맞춤 모형(K.photo) — 원본 렌더 그림을 찍은 카메라를 되살려 모형에 그림을 비춘다
   - 처음 시점 = 그림과 픽셀까지 같다. 손으로 움직이기 시작하면 모형 가운데를 축으로 360° 돌고, 모형 전체가 칸 안에 들어오게 물러선다.
   - 캔버스가 그림 칸보다 넓으면(opts.frame) 확대해도 칸 가장자리에서 잘리지 않고 캔버스 끝까지 그린다.
     너무 다가가면 건물 앞에서 멈추고(건물 안으로 들어가지 않는다), 가까운 면이 앞 자르기 면(near)에 잘리지 않게 한다.
   - 그림에 안 찍힌 곳은 찍힌 곳에서 이어 붙인다: 건물 뒷면 = 맞은편(180° 돌린 자리) 면의 사진, 가려진 땅 = 둘레 땅에서 번져 채운 색.
   - 기본위치(view 'home')로 돌아오면 다시 그림과 같다. */
(function () {
  const V = '0.170.0';
  const CDN = 'https://cdn.jsdelivr.net/npm/three@' + V;
  const registry = new Map();
  let loading = null, seq = 0;
  const W = (window.WEMB3D = { models: {}, lib: null, load, create, bakeClone, views: registry });

  /* 인터넷이 없는 곳(망분리 고객사)에서도 뜨도록 로컬 사본(src/vendor/three)을 먼저, 안 되면 jsDelivr.
     두 모듈은 같은 쪽에서 받아야 같은 THREE 를 쓴다. 주소는 문서 기준(이 파일 기준이 아니다) */
  const LOCAL = new URL('src/vendor/three/', document.baseURI).href;
  const pair = (a, b) => Promise.all([import(a), import(b)]);
  function load() {
    return (loading ||= pair(LOCAL + 'three.module.min.js', LOCAL + 'OrbitControls.js').catch(() => pair(CDN + '/+esm', CDN + '/examples/jsm/controls/OrbitControls.js/+esm')).then(([THREE, C]) => {
      W.lib = { THREE, OrbitControls: C.OrbitControls };
      return W.lib;
    }).catch((e) => { loading = null; throw e; }));
  }

  /* ── 모형 도구 — 무늬 · 재질 · 상자 · 원기둥 · 건물 등록 ── */
  function kit(THREE, renderer, scene) {
    let seed = 20261006;
    const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const hash = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
    const noise = (x, z) => {
      const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
      const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
      const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    const fbm = (x, z) => noise(x, z) * 0.6 + noise(x * 2.1, z * 2.1) * 0.28 + noise(x * 4.3, z * 4.3) * 0.12;
    const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    /* 캔버스로 그린 무늬 — 크기는 실제 m 단위로 붙인다(worldUV) */
    const tex = (w, h, draw, clamp) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso;
      return t;
    };
    const worldUV = (geo, tw, th, tr = tw) => {
      const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
      geo.computeBoundingBox();
      const y0 = geo.boundingBox.min.y;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i) - y0, z = p.getZ(i);
        const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
        if (ny > 0.5) uv.setXY(i, x / tr, z / tr);
        else if (nx > nz) uv.setXY(i, z / tw, y / th);
        else uv.setXY(i, x / tw, y / th);
      }
      uv.needsUpdate = true;
      return geo;
    };
    const cylUV = (geo, r, h, tw, th, arc = 1) => {
      const n = geo.attributes.normal, uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) if (Math.abs(n.getY(i)) < 0.5) uv.setXY(i, uv.getX(i) * (2 * Math.PI * r * arc) / tw, uv.getY(i) * h / th);
      uv.needsUpdate = true;
      return geo;
    };
    const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...o });
    const ACCENT = [];      // 테마 강조색(--point-main)을 따르는 재질 — 색 · 발광 둘 다
    const ACCENT_LINE = []; // 강조색을 따르는 선 재질
    const accent = (o = {}) => { const m = std({ color: 0x3fa9ff, emissive: 0x3fa9ff, emissiveIntensity: 0.25, ...o }); ACCENT.push(m); return m; };

    const pickables = [], buildings = new Map(), MATS = Symbol('mats');
    const mesh = (geo, mat, x = 0, y = 0, z = 0, shadow = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = shadow; m.receiveShadow = true;
      return m;
    };
    /* 상자 — 옆면 · 지붕 재질을 따로 (BoxGeometry 면 순서: +x, -x, +y, -y, +z, -z) */
    const box = (w, h, d, side, roof = side, x = 0, y = 0, z = 0, tw = 16, th = 8) => {
      const g = worldUV(new THREE.BoxGeometry(w, h, d), tw, th);
      return mesh(g, side === roof ? side : [side, side, roof, roof, side, side], x, y + h / 2, z);
    };
    const cyl = (r, h, side, top = side, x = 0, y = 0, z = 0, seg = 40, tw = 16, th = 16) => {
      const g = cylUV(new THREE.CylinderGeometry(r, r, h, seg), r, h, tw, th);
      return mesh(g, side === top ? side : [side, top, top], x, y + h / 2, z);
    };
    const flat = (mat, x0, x1, z0, z1, y = 0.2, parent = scene) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), mat);
      m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    /* 건물(고를 수 있는 단위) — 마우스를 올리면 강조, 누르면 다가간다 */
    function building(id, x, z, parts, y = 0) {
      const grp = new THREE.Group();
      grp.position.set(x, y, z);
      parts.flat().forEach((p) => p && grp.add(p));
      scene.add(grp);
      grp.updateMatrixWorld(true);
      const bx = new THREE.Box3().setFromObject(grp);
      const rec = { id, group: grp, box: bx, center: bx.getCenter(new THREE.Vector3()), size: bx.getSize(new THREE.Vector3()), meshes: [] };
      grp.traverse((o) => { if (o.isMesh && !o.userData.noPick) { o.userData.b = rec; o[MATS] = o.material; rec.meshes.push(o); pickables.push(o); } });
      buildings.set(id, rec);
      return rec;
    }
    /* 같은 모양을 여럿 — InstancedMesh (지붕 환기구 · 나무 · 차량) */
    const many = (geo, mat, list, { shadow = true, colors } = {}) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      const o = new THREE.Object3D();
      list.forEach((t, i) => {
        o.position.set(t[0], t[1], t[2]);
        o.rotation.set(0, t[4] || 0, 0);
        const s = t[3] ?? 1;
        if (Array.isArray(s)) o.scale.set(s[0], s[1], s[2]); else o.scale.set(s, s, s);
        o.updateMatrix();
        im.setMatrixAt(i, o.matrix);
        if (colors) im.setColorAt(i, colors[i % colors.length]);
      });
      im.castShadow = shadow; im.receiveShadow = true;
      return im;
    };
    /* 빛을 받지 않는 그림자 바닥 — 투명 캔버스(템플릿)에서 건물이 바탕 위에 앉아 보이게 */
    const shadowFloor = (size, opacity = 0.42, y = 0.05) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ opacity }));
      m.position.y = y; m.receiveShadow = true; m.userData.noPick = true;
      scene.add(m);
      return m;
    };
    /* ── 사진 맞춤 — 원본 렌더 그림을 찍은 카메라를 그대로 세운다 ──
       { src, w, h, f(초점거리 px), cx, cy(주점 px — 그림 밖일 수 있다), hc(카메라 높이 m), pitch(내려다본 각 °),
         fitGround(그림의 바닥 판까지 화면에 다 넣는다), guard(땅 가림 판정 때 건물 높이 여유 배수) }
       건축 렌더는 대개 2점 투시(세로선이 곧다) = 카메라는 수평이고 그림이 아래로 밀린 것(렌즈 시프트).
       at(u, v, y) = 그림의 픽셀 (u, v) 가 높이 y 평면에 닿는 점 → 모형을 그림 좌표로 짓는다. */
    let rig = null;
    function photo(cfg) {
      const { w, h, f, cx = w / 2, cy = h / 2, hc, pitch = 0 } = cfg;
      const hw = Math.max(Math.abs(cx), Math.abs(w - cx)), hh = Math.max(Math.abs(cy), Math.abs(h - cy));
      const cam = new THREE.PerspectiveCamera((2 * Math.atan(hh / f) * 180) / Math.PI, hw / hh, cfg.near ?? hc * 0.1, cfg.far ?? hc * 60);
      const off = { W: 2 * hw, H: 2 * hh, x: hw - cx, y: hh - cy };
      cam.setViewOffset(off.W, off.H, off.x, off.y, w, h);
      cam.position.set(0, hc, 0);
      cam.rotation.set(-THREE.MathUtils.degToRad(pitch), 0, 0);
      cam.updateMatrixWorld(true);
      cam.updateProjectionMatrix();
      const ray = (u, v) => new THREE.Vector3(u - cx, -(v - cy), -f).applyEuler(cam.rotation).normalize();
      const at = (u, v, y = 0) => { const d = ray(u, v); return cam.position.clone().addScaledVector(d, (y - hc) / d.y); };
      /* 바닥점 b 위로 선 세로선에서, 픽셀 (u, v) 의 시선이 지나는 높이 */
      const height = (u, v, b) => { const d = ray(u, v), o = cam.position; const t = ((b.x - o.x) * d.x + (b.z - o.z) * d.z) / (d.x * d.x + d.z * d.z); return o.y + t * d.y; };
      rig = { cfg: { cx, cy, ...cfg }, cam, off, ray, at, height };
      return rig;
    }
    /* 바닥 다각형(월드 점) → 높이 h 기둥. 지붕 · 옆면 재질 따로 */
    const prism = (pts, h, side, top = side, y0 = 0) => {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map((p) => new THREE.Vector2(p.x, -p.z))), { depth: h, bevelEnabled: false });
      g.rotateX(-Math.PI / 2);
      g.translate(0, y0, 0);
      return mesh(g, [top, side]);
    };
    return { THREE, scene, rnd, fbm, noise, tex, worldUV, cylUV, std, accent, ACCENT, ACCENT_LINE, mesh, box, cyl, flat, building, many, shadowFloor, pickables, buildings, MATS, photo, prism, get rig() { return rig; } };
  }

  /* ── 사진 입히기(카메라 투영) ──
     모든 면에 원본 그림을 '찍은 카메라'에서 비춘다. 찍은 카메라의 깊이 지도로 가려진 곳을 가린다.
     - 건물 면: ① 그 자리가 사진에 찍혔으면 그 사진 ② 아니면 건물 가운데를 축으로 180° 돌린 자리(맞은편 면)의 사진
                ③ 둘 다 아니면 그 면에 찍힌 색의 평균(분석 뒤 aPhC)
     - 땅: 찍혔으면 사진, 아니면 둘레 땅에서 번져 채운 그림(uGround — 분석 때 굽는다) + 잔무늬.
           처음 시점에서 멀어질수록(uPhT) 모형 둘레 원 밖은 흐려 없앤다(투명 캔버스) / 바탕색으로 녹인다(불투명 캔버스). */
  const PH_VTX = [
    'vec4 phw = vec4(transformed, 1.0);',
    '#ifdef USE_INSTANCING',
    '  phw = instanceMatrix * phw;',
    '#endif',
    'phw = modelMatrix * phw;',
    'vPhW = phw.xyz;',
    'vec3 phn = objectNormal;',
    '#ifdef USE_INSTANCING',
    '  phn = mat3(instanceMatrix) * phn;',
    '#endif',
    'vPhN = normalize(mat3(modelMatrix) * phn);',
    'vPhD = aPhD;',
    'vPhC = aPhC;',
    'vPhU = aPhU;',
  ].join('\n');
  const PH_HEAD_V = 'attribute vec3 aPhD;\nattribute vec4 aPhC;\nattribute vec2 aPhU;\nvarying vec3 vPhW;\nvarying vec3 vPhN;\nvarying vec3 vPhD;\nvarying vec4 vPhC;\nvarying vec2 vPhU;\n';
  const PH_HEAD_F = [
    'uniform sampler2D uPhoto;', 'uniform sampler2D uPhDepth;', 'uniform sampler2D uPhDepthG;', 'uniform sampler2D uGround;', 'uniform sampler2D uAtlas;', 'uniform float uAtlasOn;',
    'uniform mat4 uPhPV;', 'uniform mat4 uPhPVi;', 'uniform vec2 uPhR;', 'uniform vec3 uPhPos;', 'uniform float uPhN;', 'uniform float uPhF;', 'uniform float uPhBias;',
    'uniform vec4 uGB;', 'uniform vec2 uPhSize;', 'uniform float uGN;', 'uniform vec4 uFade;', 'uniform float uPhT;', 'uniform float uOpaque;', 'uniform vec3 uBg;', 'uniform vec2 uVP;',
    'varying vec3 vPhW;', 'varying vec3 vPhN;', 'varying vec3 vPhD;', 'varying vec4 vPhC;', 'varying vec2 vPhU;',
    'float phLin(float d) { return (uPhN * uPhF) / (uPhF - d * (uPhF - uPhN)); }',
    /* 월드 점 → 그림 좌표(0~1). ins = 그림 틀 안, myD = 찍은 카메라에서의 깊이 */
    'vec2 phUV(vec3 p, out float ins, out float myD) {',
    '  vec4 pc = uPhPV * vec4(p, 1.0);',
    '  vec3 nd = pc.xyz / pc.w;',
    '  vec2 pu = nd.xy * 0.5 + 0.5;',
    '  ins = step(0.0, pc.w) * step(0.0, pu.x) * step(pu.x, 1.0) * step(0.0, pu.y) * step(pu.y, 1.0);',
    '  myD = phLin(nd.z * 0.5 + 0.5);',
    '  return pu;',
    '}',
    'float phVis(sampler2D dep, vec2 pu, float myD) { return step(myD, phLin(texture2D(dep, pu).x) * 1.015 + uPhBias); }',
    /* 가림 가장자리 — 그 점 둘레(그림에서 반지름 uPhR · 2.2배 두 겹)에 그 면보다 앞에 선 것이 있으면 0.
       모형 윤곽이 그림과 조금 어긋나 앞 물체의 사진이 뒤 면에 번진 자리를 돌려 볼 때 쓰지 않는다(면의 기울기를 따라 비교) */
    'float phEdge(sampler2D dep, vec2 pu, vec3 P, vec3 n) {',
    '  float c = 1.0, pn = dot(n, P - uPhPos);',
    '  for (int k = 0; k < 12; k++) {',
    '    float a = float(k) * 0.5236 + 0.26;',
    '    vec2 q = pu + vec2(cos(a), sin(a)) * uPhR * (mod(float(k), 2.0) < 0.5 ? 1.0 : 2.2);',
    '    vec4 h = uPhPVi * vec4(q * 2.0 - 1.0, 1.0, 1.0);',
    '    vec3 dir = normalize(h.xyz / h.w - uPhPos);',
    '    float den = dot(n, dir);',
    '    if (den > -0.001) continue;',
    '    vec4 pq = uPhPV * vec4(uPhPos + dir * (pn / den), 1.0);',
    '    c *= step(phLin(pq.z / pq.w * 0.5 + 0.5) * 0.97 - uPhBias * 3.0, phLin(texture2D(dep, q).x));',
    '  }',
    '  return c;',
    '}',
    'float phHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float phNoise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(phHash(i), phHash(i + vec2(1.0, 0.0)), u.x), mix(phHash(i + vec2(0.0, 1.0)), phHash(i + vec2(1.0, 1.0)), u.x), u.y); }',
    '',
  ].join('\n');
  /* 건물 면 */
  const PH_OBJ = [
    '{',
    '  vec3 phN = normalize(vPhN);',
    '  float dC = dot(phN, normalize(cameraPosition - vPhW));',
    '  float insS, myS; vec2 puS = phUV(vPhW, insS, myS);',
    '  float dS = dot(phN, normalize(uPhPos - vPhW));',
    '  vec4 cS = texture2D(uPhoto, puS);',
    /* 찍은 카메라에서 비껴 찍힌 면을 지금 정면으로 보면 사진이 몇 배로 늘어난다 → 그만큼 다른 것으로. 처음 시점은 늘어남 1 → 사진 그대로 */
    '  float rot = step(0.5, uPhT);', // 손으로 움직이는 중(맞춘 시점)
    '  float wS = insS * phVis(uPhDepth, puS, myS) * step(0.0, dS) * (1.0 - smoothstep(5.0, 12.0, dC / max(dS, 0.001)));',
    '  vec3 nD = vec3(-phN.x, phN.y, -phN.z);',
    '  float insD, myD; vec2 puD = phUV(vPhD, insD, myD);',
    '  float dD = dot(nD, normalize(uPhPos - vPhD));',
    '  vec4 cD = texture2D(uPhoto, puD);',
    '  float wD = insD * phVis(uPhDepth, puD, myD) * smoothstep(0.02, 0.1, dD) * (1.0 - smoothstep(2.5, 6.0, dC / max(dD, 0.001)));',
    /* 그림이 투명한 곳 = 거기엔 아무것도 없다. 처음 시점 둘레에선 모형이 그림보다 조금 커도 바탕이 보이게 비우고,
       돌려 볼 때는 구멍이 나 조각이 떠 보이지 않게 비우지 않고 다른 것(맞은편 · 평균 색)으로 채운다 */
    '  if (rot < 0.5 && insS * step(0.02, dS) > 0.5 && cS.a < 0.03) discard;',
    '  if (rot < 0.5 && wS < 0.5 && wD > 0.5 && cD.a < 0.03) discard;',
    '  if (rot < 0.5 && uOpaque < 0.5 && insS > 0.5 && wS < 0.5 && cS.a < 0.03) discard;', // 처음 시점: 비운 조각 너머로 비친 면도 비운다(그림 그대로)
    '  wS *= mix(1.0, smoothstep(0.02, 0.3, cS.a), rot); wD *= mix(1.0, smoothstep(0.02, 0.3, cD.a), rot);',
    '  if (rot > 0.5) { if (wS > 0.0) wS *= phEdge(uPhDepth, puS, vPhW, phN); if (wD > 0.0) wD *= phEdge(uPhDepth, puD, vPhD, nD); }',
    /* 대신 칠할 색 — 면 무늬 지도(찍힌 곳 + 맞은편 + 둘레에서 번져 채운 곳)에 잔무늬. 지도가 없으면 면 평균 색 */
    '  float fz = (phNoise(vec2(vPhW.x + vPhW.z, vPhW.y) * 0.35) - 0.5) * 0.1 + (phNoise(vec2(vPhW.x - vPhW.z, vPhW.y * 3.0) * 1.3) - 0.5) * 0.05;',
    '  vec4 col = vec4(mix(vPhC.rgb, texture2D(uAtlas, vPhU).rgb, uAtlasOn) * (1.0 + fz), 1.0);',
    '  col = mix(col, mix(vec4(cD.rgb * cD.a, cD.a), vec4(cD.rgb, 1.0), rot) * vec4(vec3(0.9), 1.0), wD);', // 뒷면은 조금 어둡게(그늘 쪽)
    '  gl_FragColor = mix(col, mix(vec4(cS.rgb * cS.a, cS.a), vec4(cS.rgb, 1.0), rot), wS);',
    '}',
  ].join('\n');
  /* 땅 */
  const PH_GND = [
    '{',
    '  vec3 phN = vec3(0.0, 1.0, 0.0);',
    '  float ins, my; vec2 pu = phUV(vPhW, ins, my);',
    '  float dS = dot(phN, normalize(uPhPos - vPhW));',
    '  float dC = dot(phN, normalize(cameraPosition - vPhW));',
    /* 움직이기 시작하면 건물을 조금 높게 잡은 깊이 지도로도 가린다 — 어림한 건물 높이가 낮아 건물 그림이 땅에 번지지 않게 */
    '  float vis = phVis(uPhDepth, pu, my);',
    '  vis = mix(vis, vis * phVis(uPhDepthG, pu, my), smoothstep(0.0, 0.3, uPhT));',
    '  if (uPhT > 0.5 && vis > 0.0) vis *= phEdge(uPhDepth, pu, vPhW, phN);',
    '  float w = ins * vis * step(0.0, dS) * (1.0 - smoothstep(3.5, 7.0, dC / max(dS, 0.001)));',
    /* 화면 한 픽셀에 그림 몇 픽셀이 들어오나(작을수록 크게 늘어난 것) — 한쪽으로만 늘어난 것(먼 땅이 길게)도 잡게 작은 쪽으로 */
    '  vec2 dpx = fwidth(pu * uPhSize);',
    '  float mag = min(dpx.x, dpx.y);',
    '  w *= mix(1.0, smoothstep(0.1, 0.45, mag), smoothstep(0.3, 0.8, uPhT));',
    '  vec4 ph = texture2D(uPhoto, pu);',
    '  vec2 gu = (vPhW.xz - uGB.xy) / uGB.zw;',
    '  vec4 bk = texture2D(uGround, gu);',
    /* 굽은 땅이 크게 확대되면(한 칸이 화면 몇 픽셀) 둘레 여덟 곳과 섞어 칸 모양 계단을 지운다 */
    '  float gc = max(fwidth(gu.x), fwidth(gu.y)) * uGN;',
    '  if (gc < 0.5) {',
    '    vec4 sb = bk;',
    '    for (int k = 0; k < 12; k++) { float a = float(k) * 0.5236 + (mod(float(k), 2.0) > 0.5 ? 0.26 : 0.0); sb += texture2D(uGround, gu + vec2(cos(a), sin(a)) * (mod(float(k), 2.0) > 0.5 ? 1.7 : 0.85) / uGN); }',
    '    bk = mix(bk, sb / 13.0, smoothstep(0.5, 0.12, gc));',
    '  }',
    /* 돌려 볼 때 — 둘레보다 확 밝은 사진 땅(모형에 없는 작은 흰 지붕 · 차 · 가로등 빛)은 평평한 자국으로 보이므로 둘레 땅으로 */
    '  vec4 bav = texture2D(uGround, gu, 3.0);',
    /* 숲 — 처음 시점과 다른 쪽에서 보면 나무(키가 있다)를 땅에 눕힌 사진이 찍은 방향으로 길게 늘어진다.
       찍은 방향에서 멀어질수록 푸른 사진 땅은 흐린 땅 + 나무 덩어리 무늬(셰이더)로 넘긴다 */
    '  vec2 tvA = normalize(cameraPosition.xz - vPhW.xz + 1e-4), tvB = normalize(uPhPos.xz - vPhW.xz + 1e-4);',
    '  float ra = smoothstep(0.92, 0.55, dot(tvA, tvB)) * smoothstep(0.3, 0.8, uPhT);',
    '  float grP = clamp((ph.g - max(ph.r, ph.b)) * 9.0, 0.0, 1.0);',
    '  w *= 1.0 - ra * grP * 0.92;',
    '  float grB = clamp((bk.g - max(bk.r, bk.b)) / max(bk.a, 0.001) * 9.0, 0.0, 1.0);',
    '  bk = mix(bk, texture2D(uGround, gu, 2.5), ra * grB);',
    '  float bright = dot(ph.rgb, vec3(0.3, 0.59, 0.11)) - dot(bav.rgb / max(bav.a, 0.001), vec3(0.3, 0.59, 0.11));',
    '  w *= 1.0 - smoothstep(0.12, 0.3, bright) * 0.8 * smoothstep(0.3, 0.8, uPhT);',
    /* 채운 땅의 잔무늬 — 푸른 곳은 나무 덩어리(5~10m 둥근 얼룩), 회색 · 흙빛은 포장면 결. 사진이 쓰이는 곳(w=1)에는 안 보인다 */
    '  float gr = clamp((bk.g - max(bk.r, bk.b)) / max(bk.a, 0.001) * 9.0, 0.0, 1.0);',
    '  float cr = smoothstep(0.3, 0.8, phNoise(vPhW.xz * 0.17) * 0.55 + phNoise(vPhW.xz * 0.41 + 3.1) * 0.3 + phNoise(vPhW.xz * 1.1 + 9.7) * 0.15);',
    '  float pv = (phNoise(vPhW.xz * 0.11) - 0.5) * 0.12 + (phNoise(vPhW.xz * 0.9) - 0.5) * 0.07 + (phNoise(vPhW.xz * 3.3) - 0.5) * 0.05;',
    '  bk.rgb *= 1.0 + mix(pv, (cr - 0.5) * mix(0.55, 0.8, smoothstep(0.5, 0.12, gc)) + (phNoise(vPhW.xz * 2.2) - 0.5) * 0.12, gr);',
    /* 포장면 이음매 — 무채색 마당에만 12m 판 이음 선을 아주 옅게(안개 같은 단색이 마당으로 읽히게) */
    '  vec2 jt = abs(fract(vPhW.xz / 12.0 + 0.5) - 0.5) * 12.0;',
    '  float jl = 1.0 - smoothstep(0.08, 0.28, min(jt.x, jt.y));',
    '  float gy = (1.0 - gr) * (1.0 - clamp((max(bk.r, max(bk.g, bk.b)) - min(bk.r, min(bk.g, bk.b))) / max(bk.a, 0.001) * 8.0, 0.0, 1.0));',
    '  bk.rgb *= 1.0 - jl * 0.09 * gy;',
    '  vec4 col = mix(bk * max(uOpaque, smoothstep(0.0, 0.3, uPhT)), vec4(ph.rgb * ph.a, ph.a), w);', // 투명 캔버스의 처음 시점: 안 찍힌 땅은 비운다(그림 그대로)
    '  float fd = 1.0 - smoothstep(uFade.z, uFade.w, distance(vPhW.xz, uFade.xy));',
    '  if (uOpaque > 0.5) {',
    '    col.rgb += (1.0 - col.a) * uBg;',
    '    gl_FragColor = vec4(mix(uBg, col.rgb, fd), 1.0);',
    '  } else {',
    '    vec2 sc = gl_FragCoord.xy / uVP;',
    '    float e = min(min(sc.x, 1.0 - sc.x), min(sc.y, 1.0 - sc.y));',
    '    col *= fd * mix(1.0, smoothstep(0.0, 0.09, e), uPhT);', // 칸 가장자리에서 땅이 칼같이 잘리지 않게
    '    if (uPhT > 0.5) col *= smoothstep(0.12, 0.35, col.a);', // 돌려 볼 때 그림의 옅은 번짐(빛 · 그림자 가장자리)이 먼 땅에 길게 늘어나 보이지 않게
    '    if (col.a < 0.004) discard;',
    '    gl_FragColor = col;',
    '  }',
    '}',
  ].join('\n');

  function photoProject(THREE, renderer, scene, rig, o) {
    const cfg = rig.cfg, { w: IW, h: IH, f } = cfg, cx = cfg.cx, cy = cfg.cy;
    const srgb = (c) => { const t = { r: 0, g: 0, b: 0 }; c.getRGB(t, THREE.SRGBColorSpace); return t; };
    const gMat = (() => { let m = null; scene.traverse((x) => { if (x.isMesh && x.material && x.material.userData && x.material.userData.photoGround) m = x.material; }); return m; })();
    const gc = gMat ? srgb(gMat.color) : { r: 0.3, g: 0.3, b: 0.3 };
    const g0 = new THREE.DataTexture(new Uint8Array(o.opaque ? [gc.r * 255, gc.g * 255, gc.b * 255, 255] : [0, 0, 0, 0]), 1, 1);
    g0.needsUpdate = true;
    const U = {
      uPhoto: { value: null }, uPhDepth: { value: null }, uPhDepthG: { value: null }, uGround: { value: g0 }, uAtlas: { value: g0 }, uAtlasOn: { value: 0 },
      uPhPV: { value: new THREE.Matrix4().multiplyMatrices(rig.cam.projectionMatrix, rig.cam.matrixWorldInverse) }, uPhPVi: { value: new THREE.Matrix4() },
      uPhR: { value: new THREE.Vector2(0.008, (0.008 * IW) / IH) },
      uPhPos: { value: rig.cam.position.clone() }, uPhN: { value: rig.cam.near }, uPhF: { value: rig.cam.far },
      uPhBias: { value: cfg.bias ?? cfg.hc * 0.02 },
      uGB: { value: new THREE.Vector4(-1e5, -1e5, 2e5, 2e5) }, uPhSize: { value: new THREE.Vector2(IW, IH) }, uGN: { value: 1 }, uFade: { value: new THREE.Vector4(0, 0, 1e9, 2e9) },
      uPhT: { value: 0 }, uOpaque: { value: o.opaque ? 1 : 0 }, uBg: { value: new THREE.Vector3() }, uVP: { value: new THREE.Vector2(1, 1) },
    };
    U.uPhPVi.value.copy(U.uPhPV.value).invert();
    const tex = new THREE.TextureLoader().load(cfg.src, o.onLoad);
    tex.colorSpace = THREE.NoColorSpace; // 그림 값을 그대로 화면에 — 톤 매핑 · 색 공간 변환을 거치지 않는다
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    U.uPhoto.value = tex;

    /* 면마다 따로 값을 주려고 정점을 나눈다 + aPhD(맞은편 자리) · aPhC(대신 칠할 색) */
    scene.updateMatrixWorld(true);
    const objs = [];
    scene.traverse((m) => {
      if (!m.isMesh) return;
      if (m.geometry.index) m.geometry = m.geometry.toNonIndexed();
      const g = m.geometry, n = g.attributes.position.count;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      const c = mat && mat.color ? srgb(mat.color) : { r: 0.6, g: 0.6, b: 0.6 };
      const C4 = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) C4.set([c.r, c.g, c.b, 1], i * 4);
      g.setAttribute('aPhD', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('aPhC', new THREE.BufferAttribute(C4, 4));
      g.setAttribute('aPhU', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      if (!(mat && mat.userData && mat.userData.photoGround)) objs.push(m);
    });
    /* 건물 가운데를 축으로 180° 돌린 자리 — 뒷면이 맞은편 앞면의 사진을 빌려 쓴다(글자도 바로 읽히게 거울이 아니라 회전).
       붙어 있는 여러 덩어리가 한 건물이면 모형이 userData.phMid = [x, z](합친 가운데)를 준다 — 덩어리끼리 맞댄 벽을 빌리지 않게 */
    const v3 = new THREE.Vector3();
    for (const m of objs) {
      const p = m.geometry.attributes.position, D = m.geometry.attributes.aPhD.array, n = p.count;
      const wp = new Float32Array(n * 3);
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (let i = 0; i < n; i++) {
        v3.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
        wp[i * 3] = v3.x; wp[i * 3 + 1] = v3.y; wp[i * 3 + 2] = v3.z;
        x0 = Math.min(x0, v3.x); x1 = Math.max(x1, v3.x); z0 = Math.min(z0, v3.z); z1 = Math.max(z1, v3.z);
      }
      const [mx, mz] = m.userData.phMid || [(x0 + x1) / 2, (z0 + z1) / 2];
      for (let i = 0; i < n; i++) { D[i * 3] = 2 * mx - wp[i * 3]; D[i * 3 + 1] = wp[i * 3 + 1]; D[i * 3 + 2] = 2 * mz - wp[i * 3 + 2]; }
      m.userData.phW = wp; m.userData.phMid = [mx, mz];
    }

    /* 찍은 카메라에서 본 깊이 — GPU 용(가림) 두 장: 그대로 · 건물을 키운 것(땅 판정용).
       키운 쪽은 위로 guard 배, 옆으로 조금 — 건물 가장자리 · 옥상 설비 픽셀이 그 뒤 땅에 길게 번지지 않게 */
    const groups = [...o.buildings.values()].map((b) => [b.group, b.center]);
    const inflate = (k, fn) => {
      const saved = k === 1 ? null : groups.map(([g, c]) => {
        const p = g.position.clone(), h = 1 + (k - 1) * 0.08;
        g.scale.set(h, k, h); g.position.set(c.x - h * (c.x - p.x), p.y, c.z - h * (c.z - p.z)); g.updateMatrixWorld(true);
        return p;
      });
      try { fn(); } finally { if (saved) groups.forEach(([g], i) => { g.scale.set(1, 1, 1); g.position.copy(saved[i]); g.updateMatrixWorld(true); }); }
    };
    const guard = cfg.guard ?? 1.5;
    const dw = 2048, dh = Math.max(256, Math.round((2048 * IH) / IW));
    const colorless = new THREE.MeshBasicMaterial({ colorWrite: false });
    const depthRT = (k) => {
      const rt = new THREE.WebGLRenderTarget(dw, dh);
      rt.depthTexture = new THREE.DepthTexture(dw, dh);
      rt.depthTexture.type = THREE.UnsignedIntType;
      inflate(k, () => { scene.overrideMaterial = colorless; renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, rig.cam); });
      renderer.setRenderTarget(null); scene.overrideMaterial = null;
      return rt;
    };
    const rtA = depthRT(1), rtG = depthRT(guard);
    U.uPhDepth.value = rtA.depthTexture; U.uPhDepthG.value = rtG.depthTexture;
    /* CPU 용 깊이(분석) — 찍은 카메라 기준 깊이(m)를 24비트로 담아 읽는다 */
    const cw = 1024, ch = Math.max(128, Math.round((1024 * IH) / IW)), far = rig.cam.far;
    const pack = new THREE.ShaderMaterial({
      uniforms: { uFar: { value: far } },
      vertexShader: 'varying float vD; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uFar; varying float vD; void main() { float v = floor(clamp(vD / uFar, 0.0, 1.0) * 16777215.0); float r = floor(v / 65536.0); v -= r * 65536.0; float g = floor(v / 256.0); float b = v - g * 256.0; gl_FragColor = vec4(r, g, b, 255.0) / 255.0; }',
    });
    const cpuDepth = (k) => {
      const rt = new THREE.WebGLRenderTarget(cw, ch), buf = new Uint8Array(cw * ch * 4);
      const cc = new THREE.Color(), ca = renderer.getClearAlpha(); renderer.getClearColor(cc);
      renderer.setClearColor(0xffffff, 1);
      inflate(k, () => { scene.overrideMaterial = pack; renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, rig.cam); });
      renderer.readRenderTargetPixels(rt, 0, 0, cw, ch, buf);
      renderer.setRenderTarget(null); scene.overrideMaterial = null; renderer.setClearColor(cc, ca);
      rt.dispose();
      const d = new Float32Array(cw * ch);
      for (let i = 0; i < cw * ch; i++) d[i] = ((buf[i * 4] * 65536 + buf[i * 4 + 1] * 256 + buf[i * 4 + 2]) / 16777215) * far;
      return d;
    };
    const DA = cpuDepth(1), DG = cpuDepth(guard);
    pack.dispose(); colorless.dispose();

    const done = new Set();
    const patch = (m) => {
      if (!m || done.has(m) || !m.isMeshStandardMaterial) return;
      done.add(m);
      const gnd = !!m.userData.photoGround;
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, U);
        sh.vertexShader = PH_HEAD_V + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n' + PH_VTX);
        sh.fragmentShader = PH_HEAD_F + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + (gnd ? PH_GND : PH_OBJ));
      };
      m.customProgramCacheKey = () => 'wemb-photo2-' + (gnd ? 'g' : 'o');
      m.needsUpdate = true;
    };
    scene.traverse((x) => { if (x.isMesh) (Array.isArray(x.material) ? x.material : [x.material]).forEach(patch); });

    /* ── 분석 — 그림이 다 받아진 뒤 한 번. 안 찍힌 면의 색 · 가려진 땅 채우기 · 바닥 판 끝 ──
       ctx { C(모형 가운데), Rg(모형 반지름 — 수평), fitGround, dead() } → Promise<{ groundPts, Rhome }>
       일이 많아(면 무늬 지도 · 땅 굽기) 20ms 마다 한 번씩 쉬었다 간다 — 화면이 멈추지 않게(이동 1.5초 규칙) */
    async function analyze(ctx) {
      let tY = performance.now();
      const tick = async () => {
        if (performance.now() - tY < 20) return;
        await new Promise((r) => setTimeout(r, 0));
        if (ctx.dead()) throw new Error('disposed');
        tY = performance.now();
      };
      const img = tex.image;
      if (!img || !img.width) return null;
      const pw = Math.min(IW, 1600), ph = Math.max(1, Math.round((pw * IH) / IW));
      const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
      const c2 = cv.getContext('2d', { willReadFrequently: true });
      c2.drawImage(img, 0, 0, pw, ph);
      const px = c2.getImageData(0, 0, pw, ph).data;
      const sx = pw / IW, sy = ph / IH;
      const col = [0, 0, 0, 0];
      const photoAt = (u, v) => {
        const x = Math.min(pw - 1, Math.max(0, Math.floor(u * sx))), y = Math.min(ph - 1, Math.max(0, Math.floor(v * sy))), i = (y * pw + x) * 4;
        col[0] = px[i] / 255; col[1] = px[i + 1] / 255; col[2] = px[i + 2] / 255; col[3] = px[i + 3] / 255;
        return col;
      };
      /* 두 줄 사이를 고르게(쌍선형) — 그림의 먼 쪽은 한 픽셀이 땅 여러 칸에 걸쳐 계단 무늬가 생기므로 땅 굽기에 쓴다 */
      const colB = [0, 0, 0, 0];
      const photoAtB = (u, v) => {
        const fx = Math.min(pw - 1.001, Math.max(0, u * sx - 0.5)), fy = Math.min(ph - 1.001, Math.max(0, v * sy - 0.5));
        const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, i00 = (y0 * pw + x0) * 4, i10 = i00 + 4, i01 = i00 + pw * 4, i11 = i01 + 4;
        for (let c = 0; c < 4; c++) colB[c] = ((px[i00 + c] * (1 - tx) + px[i10 + c] * tx) * (1 - ty) + (px[i01 + c] * (1 - tx) + px[i11 + c] * tx) * ty) / 255;
        return colB;
      };
      const mi = rig.cam.matrixWorldInverse.elements, bias = U.uPhBias.value;
      const pr = { u: 0, v: 0, d: 0 };
      const proj = (x, y, z) => {
        const xc = mi[0] * x + mi[4] * y + mi[8] * z + mi[12], yc = mi[1] * x + mi[5] * y + mi[9] * z + mi[13], zc = mi[2] * x + mi[6] * y + mi[10] * z + mi[14];
        if (zc > -1e-3) return false;
        pr.u = cx + (f * xc) / -zc; pr.v = cy - (f * yc) / -zc; pr.d = -zc;
        return pr.u >= 0 && pr.v >= 0 && pr.u < IW && pr.v < IH;
      };
      const dAt = (D, u, v) => D[(ch - 1 - Math.min(ch - 1, Math.floor((v / IH) * ch))) * cw + Math.min(cw - 1, Math.floor((u / IW) * cw))];
      const P0 = rig.cam.position;
      const me = rig.cam.matrixWorld.elements, ER = 0.008 * IW;
      /* 가림 가장자리(셰이더의 phEdge 와 같은 것) — 둘레 픽셀의 시선이 그 면에 닿는 깊이보다 앞에 무언가 있으면 false */
      const clean = (D, u, v, x, y, z, nx, ny, nz) => {
        const pn = nx * (x - P0.x) + ny * (y - P0.y) + nz * (z - P0.z);
        for (let k = 0; k < 12; k++) {
          const a = k * 0.5236 + 0.26, rr = k % 2 ? 2.2 * ER : ER, qu = u + Math.cos(a) * rr, qv = v - Math.sin(a) * rr;
          if (qu < 0 || qv < 0 || qu >= IW || qv >= IH) continue;
          const cxv = (qu - cx) / f, cyv = -(qv - cy) / f;
          let dx = me[0] * cxv + me[4] * cyv - me[8], dy = me[1] * cxv + me[5] * cyv - me[9], dz = me[2] * cxv + me[6] * cyv - me[10];
          const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
          const den = nx * dx + ny * dy + nz * dz;
          if (den > -0.001) continue;
          const t = pn / den, qx = P0.x + dx * t, qy = P0.y + dy * t, qz = P0.z + dz * t;
          const ed = -(mi[2] * qx + mi[6] * qy + mi[10] * qz + mi[14]);
          if (dAt(D, qu, qv) < ed * 0.97 - bias * 3) return false;
        }
        return true;
      };
      const seen = (x, y, z, nx, ny, nz, edge) => {
        const ex = P0.x - x, ey = P0.y - y, ez = P0.z - z;
        if (nx * ex + ny * ey + nz * ez <= 0.04 * Math.hypot(ex, ey, ez)) return false;
        if (!proj(x, y, z) || pr.d > dAt(DA, pr.u, pr.v) * 1.015 + bias) return false;
        if (!edge) return true;
        const u = pr.u, v = pr.v, d = pr.d, ok = clean(DA, u, v, x, y, z, nx, ny, nz);
        pr.u = u; pr.v = v; pr.d = d;
        return ok;
      };
      const { C, Rg } = ctx;

      /* ① 건물 면마다 대신 칠할 색 — 그 면(또는 맞은편)에 찍힌 사진의 평균 */
      let rs = 7;
      const rand = () => { rs = (rs * 16807) % 2147483647; return rs / 2147483647; };
      const unitA = Math.max(1, (Rg * 0.02) ** 2);
      const glob = { side: [0, 0, 0, 0], top: [0, 0, 0, 0] };
      const todo = [];
      for (const m of objs) {
        const wp = m.userData.phW, [mx, mz] = m.userData.phMid, n = wp.length / 3;
        const faces = new Map();
        for (let t = 0; t + 2 < n; t += 3) {
          const ax = wp[t * 3], ay = wp[t * 3 + 1], az = wp[t * 3 + 2];
          const e1x = wp[t * 3 + 3] - ax, e1y = wp[t * 3 + 4] - ay, e1z = wp[t * 3 + 5] - az;
          const e2x = wp[t * 3 + 6] - ax, e2y = wp[t * 3 + 7] - ay, e2z = wp[t * 3 + 8] - az;
          let nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
          const len = Math.hypot(nx, ny, nz);
          if (len < 1e-9) continue;
          nx /= len; ny /= len; nz /= len;
          const key = Math.round(nx * 40) + ',' + Math.round(ny * 40) + ',' + Math.round(nz * 40) + ',' + Math.round((nx * ax + ny * ay + nz * az) / (Rg * 0.004 + 0.01));
          let fc = faces.get(key);
          if (!fc) faces.set(key, (fc = { tris: [], area: 0, n: [nx, ny, nz] }));
          fc.tris.push([t, len / 2]); fc.area += len / 2;
        }
        const cls = { side: [0, 0, 0, 0], top: [0, 0, 0, 0] };
        for (const fc of faces.values()) {
          await tick();
          const [nx, ny, nz] = fc.n, K = Math.min(28, Math.max(4, Math.ceil(fc.area / unitA)));
          const acc = [0, 0, 0, 0];
          for (let s = 0; s < K; s++) {
            let r = rand() * fc.area, tri = fc.tris[0];
            for (const tr of fc.tris) { r -= tr[1]; if (r <= 0) { tri = tr; break; } }
            let a = rand(), b = rand();
            if (a + b > 1) { a = 1 - a; b = 1 - b; }
            const t = tri[0] * 3;
            const x = wp[t] + (wp[t + 3] - wp[t]) * a + (wp[t + 6] - wp[t]) * b;
            const y = wp[t + 1] + (wp[t + 4] - wp[t + 1]) * a + (wp[t + 7] - wp[t + 1]) * b;
            const z = wp[t + 2] + (wp[t + 5] - wp[t + 2]) * a + (wp[t + 8] - wp[t + 2]) * b;
            let k = 0;
            if (seen(x, y, z, nx, ny, nz)) k = 1;
            else if (seen(2 * mx - x, y, 2 * mz - z, -nx, ny, -nz)) k = 0.9;
            if (!k) continue;
            const c = photoAt(pr.u, pr.v);
            acc[0] += c[0] * c[3] * k; acc[1] += c[1] * c[3] * k; acc[2] += c[2] * c[3] * k; acc[3] += c[3];
          }
          const which = ny > 0.5 ? 'top' : 'side';
          if (acc[3] >= 1.5) {
            fc.c = [acc[0] / acc[3], acc[1] / acc[3], acc[2] / acc[3]];
            for (const g of [cls[which], glob[which]]) { g[0] += acc[0]; g[1] += acc[1]; g[2] += acc[2]; g[3] += acc[3]; }
          }
        }
        todo.push({ m, faces, cls });
      }
      const mean = (g) => (g[3] > 0 ? [g[0] / g[3], g[1] / g[3], g[2] / g[3]] : null);
      for (const { m, faces, cls } of todo) {
        const C4 = m.geometry.attributes.aPhC.array;
        for (const fc of faces.values()) {
          const which = fc.n[1] > 0.5 ? 'top' : 'side';
          const c = fc.c || mean(cls[which]) || mean(cls[which === 'top' ? 'side' : 'top']) || mean(glob[which]);
          if (!c) continue;
          for (const [t] of fc.tris) for (let k = 0; k < 3; k++) C4.set([c[0], c[1], c[2], 1], (t + k) * 4);
        }
        m.geometry.attributes.aPhC.needsUpdate = true;
        m.geometry.attributes.aPhD.needsUpdate = true;
      }

      /* ①-2 면 무늬 지도 — 면마다 한 칸: 찍힌 곳은 사진, 안 찍힌 곳은 맞은편 사진, 그래도 없으면 같은 면의 찍힌 곳에서 번져 채운다.
         돌려 볼 때 '대신 칠할 색' 자리에 쓴다(평평한 단색 대신 이어진 무늬) */
      const AT = 1024, list = [];
      for (const { m, faces } of todo) for (const fc of faces.values()) {
        const [nx, ny, nz] = fc.n, wp = m.userData.phW;
        let eu = Math.abs(ny) > 0.7 ? [1, 0, 0] : [-nz, 0, nx];
        const el = Math.hypot(...eu); eu = eu.map((x) => x / el);
        const ev = [ny * eu[2] - nz * eu[1], nz * eu[0] - nx * eu[2], nx * eu[1] - ny * eu[0]];
        const o0 = [wp[fc.tris[0][0] * 3], wp[fc.tris[0][0] * 3 + 1], wp[fc.tris[0][0] * 3 + 2]];
        const uv = (i) => { const x = wp[i * 3] - o0[0], y = wp[i * 3 + 1] - o0[1], z = wp[i * 3 + 2] - o0[2]; return [x * eu[0] + y * eu[1] + z * eu[2], x * ev[0] + y * ev[1] + z * ev[2]]; };
        let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
        const tri2 = fc.tris.map(([t]) => [uv(t), uv(t + 1), uv(t + 2)]);
        for (const tr of tri2) for (const [u, v] of tr) { u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        list.push({ m, fc, eu, ev, o0, tri2, u0, v0, du: u1 - u0, dv: v1 - v0 });
      }
      let tsz = Math.sqrt(list.reduce((a, r) => a + Math.max(r.du, 0.1) * Math.max(r.dv, 0.1), 0) / (AT * AT * 0.5)) || 1;
      for (let tries = 0; tries < 40; tries++, tsz *= 1.12) {
        let x = 0, y = 0, rowH = 0, ok = true;
        list.forEach((r) => { r.w = Math.min(AT - 2, Math.max(1, Math.ceil(r.du / tsz))); r.h = Math.min(AT - 2, Math.max(1, Math.ceil(r.dv / tsz))); });
        for (const r of [...list].sort((a, b) => b.h - a.h)) {
          if (x + r.w + 2 > AT) { x = 0; y += rowH; rowH = 0; }
          if (y + r.h + 2 > AT) { ok = false; break; }
          r.x = x; r.y = y; x += r.w + 2; rowH = Math.max(rowH, r.h + 2);
        }
        if (ok) break;
      }
      const atl = new Uint8Array(AT * AT * 4);
      for (const r of list) {
        const { m, fc, eu, ev, o0, tri2, u0, v0, w, h } = r, [nx, ny, nz] = fc.n, [mx, mz] = m.userData.phMid;
        const su = r.du / w, sv = r.dv / h;
        const Sx = new Float32Array(w * h * 4), Wx = new Float32Array(w * h);
        let any = false;
        for (let j = 0; j < h; j++) { await tick(); for (let i = 0; i < w; i++) {
          const u = u0 + (i + 0.5) * su, v = v0 + (j + 0.5) * sv;
          let inside = false;
          for (const [a, b, c] of tri2) {
            const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
            if (Math.abs(d) < 1e-12) continue;
            const l1 = ((b[1] - c[1]) * (u - c[0]) + (c[0] - b[0]) * (v - c[1])) / d, l2 = ((c[1] - a[1]) * (u - c[0]) + (a[0] - c[0]) * (v - c[1])) / d;
            if (l1 >= -0.02 && l2 >= -0.02 && l1 + l2 <= 1.02) { inside = true; break; }
          }
          if (!inside) continue;
          const x = o0[0] + u * eu[0] + v * ev[0], y = o0[1] + u * eu[1] + v * ev[1], z = o0[2] + u * eu[2] + v * ev[2];
          let k = 0;
          if (seen(x, y, z, nx, ny, nz, true)) k = 1;
          else if (seen(2 * mx - x, y, 2 * mz - z, -nx, ny, -nz, true)) k = 0.9;
          if (!k) continue;
          const c = photoAt(pr.u, pr.v);
          if (c[3] < 0.3) continue; // 그림이 빈 곳 = 모형이 실제보다 큰 자리 — 둘레에서 채운다
          const q = j * w + i;
          Sx[q * 4] = c[0] * k; Sx[q * 4 + 1] = c[1] * k; Sx[q * 4 + 2] = c[2] * k; Sx[q * 4 + 3] = 1; Wx[q] = 1; any = true;
        } }
        let F = null;
        if (any) {
          const L = [];
          for (let q = 0; q < w * h; q++) if (Wx[q]) L.push(Sx[q * 4] * 0.3 + Sx[q * 4 + 1] * 0.59 + Sx[q * 4 + 2] * 0.11);
          L.sort((p, q) => p - q);
          const med = L[L.length >> 1], R0 = new Float32Array(w * h);
          for (let q = 0; q < w * h; q++) if (Wx[q]) { const l = Sx[q * 4] * 0.3 + Sx[q * 4 + 1] * 0.59 + Sx[q * 4 + 2] * 0.11; R0[q] = Math.exp(-(((l - med) / 0.18) ** 2)) + 0.02; }
          F = pushPull(Sx, Wx, w, h, R0);
        }
        const fb = fc.c || [0.6, 0.6, 0.6];
        for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) {
          const q = (Math.min(h - 1, Math.max(0, j)) * w + Math.min(w - 1, Math.max(0, i))) * 4, o = ((r.y + 1 + j) * AT + r.x + 1 + i) * 4;
          for (let c = 0; c < 3; c++) atl[o + c] = Math.max(0, Math.min(255, Math.round((F ? F[q + c] : fb[c]) * 255)));
          atl[o + 3] = 255;
        }
        const U2 = m.geometry.attributes.aPhU.array;
        fc.tris.forEach(([t], ti) => tri2[ti].forEach(([u, v], k) => {
          U2[(t + k) * 2] = (r.x + 1 + (u - u0) / su) / AT;
          U2[(t + k) * 2 + 1] = (r.y + 1 + (v - v0) / sv) / AT;
        }));
        m.geometry.attributes.aPhU.needsUpdate = true;
      }
      const at = new THREE.DataTexture(atl, AT, AT);
      at.magFilter = THREE.LinearFilter; at.minFilter = THREE.LinearFilter; at.generateMipmaps = false;
      at.needsUpdate = true;
      U.uAtlas.value = at; U.uAtlasOn.value = 1;
      for (const { m } of todo) delete m.userData.phW;

      /* ② 처음 시점에 보이는 땅의 끝(Rhome) · 바닥 판 끝점(fitGround) — 그림에 무언가 있는 칸이 땅에 닿는 자리 */
      let Rhome = 0;
      const gpts = [], cap = 6 * Rg, step = Math.max(3, Math.round(IW / 260));
      for (let v = step / 2; v < IH; v += step) { await tick(); for (let u = step / 2; u < IW; u += step) {
        const c = photoAt(u, v);
        if (c[3] < 0.05) continue;
        const d = rig.ray(u, v);
        if (d.y > -1e-4) continue;
        const tt = -P0.y / d.y, gx = P0.x + d.x * tt, gz = P0.z + d.z * tt;
        const dist = Math.hypot(gx - C.x, gz - C.z);
        if (dist > cap) continue;
        Rhome = Math.max(Rhome, dist);
        /* 바닥 판 — 건물(넉넉히 키운 것)에 안 가리고 가장자리도 아닌 땅만, 건물에서 너무 먼 곳(지붕 너머로 빗나간 시선)은 뺀다 */
        if (ctx.fitGround && c[3] > 0.85 && dist < 2.2 * Rg && proj(gx, 0, gz) && pr.d <= dAt(DG, pr.u, pr.v) * 1.015 + bias && clean(DA, pr.u, pr.v, gx, 0, gz, 0, 1, 0)) gpts.push([gx, gz]);
      } }
      const groundPts = [];
      if (gpts.length) for (let k = 0; k < 32; k++) {
        const a = (k / 32) * Math.PI * 2, ux = Math.cos(a), uz = Math.sin(a);
        let best = null, bd = -Infinity;
        for (const p of gpts) { const dd = p[0] * ux + p[1] * uz; if (dd > bd) { bd = dd; best = p; } }
        if (best) groundPts.push(new THREE.Vector3(best[0], 0, best[1]));
      }
      const Rg2 = Math.max(Rg, ...groundPts.map((p) => Math.hypot(p.x - C.x, p.z - C.z)));
      const ext = Math.min(cap, Math.max(Rhome * 1.35, Rg2 * (o.opaque ? 2.5 : 1.5)));

      /* ③ 땅 굽기 — 위에서 내려다본 땅 그림.
         ⓐ 찍힌 땅은 그대로
         ⓑ 건물 뒤에 가려진 땅은 가장 가까운 건물을 축으로 180° 돌린 자리(건물 앞쪽 땅)의 사진 — 단, ⓐ 로 어림한 둘레 색과
            어울릴 때만(앞마당의 흰 구조물 · 길 무늬가 뒤에 그대로 찍혀 나오지 않게). 그림 틀 밖을 거울로 접어 채우는 것은
            길이 엉뚱한 곳에 생겨 버렸다
         ⓒ 그래도 모르는 곳은 둘레에서 번져 채우고(push-pull), 번진 곳은 한 번 더 고르게 흐린다(계단 무늬 없게).
            셰이더가 그 위에 나무 덩어리 · 포장면 결을 얹는다 */
      const N = ext > 600 ? 768 : 512, x0 = C.x - ext, z0 = C.z - ext, cell = (2 * ext) / N;
      const S0 = new Float32Array(N * N * 4), W0 = new Float32Array(N * N);
      const groundAt = (x, z) => {
        if (!proj(x, 0, z)) return null;
        if (pr.d > dAt(DG, pr.u, pr.v) * 1.015 + bias) return null; // 건물 뒤(넉넉히)
        const u = pr.u, v = pr.v;
        if (!clean(DA, u, v, x, 0, z, 0, 1, 0)) return null;
        if (P0.y / Math.hypot(x - P0.x, P0.y, z - P0.z) < 0.03) return null; // 지평선 가까이 — 너무 늘어난 사진
        return photoAtB(u, v);
      };
      const put = (k, c, w) => { S0[k * 4] = c[0] * c[3] * w; S0[k * 4 + 1] = c[1] * c[3] * w; S0[k * 4 + 2] = c[2] * c[3] * w; S0[k * 4 + 3] = c[3] * w; W0[k] = w; };
      for (let j = 0; j < N; j++) { await tick(); for (let i = 0; i < N; i++) { const c = groundAt(x0 + (i + 0.5) * cell, z0 + (j + 0.5) * cell); if (c) put(j * N + i, c, 1); } }
      // ⓑ 건물 뒤 — 둘레 어림(F1)과 밝기 · 빛깔이 어울리는 것만
      await tick();
      const F1 = pushPull(S0, W0, N, N);
      const blds = [...o.buildings.values()].filter((b) => b.meshes.some((m) => m.visible)).map((b) => [b.center.x, b.center.z, Math.max(b.size.x, b.size.z) * 0.5]);
      const got = W0.slice();
      for (let j = 0; j < N; j++) { await tick(); for (let i = 0; i < N; i++) {
        const k = j * N + i;
        if (got[k]) continue;
        const x = x0 + (i + 0.5) * cell, z = z0 + (j + 0.5) * cell;
        let best = null, bd = 1.8;
        for (const b of blds) { const d = Math.hypot(x - b[0], z - b[1]) / b[2]; if (d < bd) { bd = d; best = b; } }
        if (!best) continue;
        const c = groundAt(2 * best[0] - x, 2 * best[1] - z);
        if (!c) continue;
        const a1 = Math.max(F1[k * 4 + 3], 1e-3), r1 = F1[k * 4] / a1, g1 = F1[k * 4 + 1] / a1, b1 = F1[k * 4 + 2] / a1;
        const dl = Math.abs((c[0] - r1) * 0.3 + (c[1] - g1) * 0.59 + (c[2] - b1) * 0.11), dc = Math.abs((c[1] - c[0]) - (g1 - r1)) + Math.abs((c[2] - c[1]) - (b1 - g1));
        if (dl < 0.09 && dc < 0.1) put(k, [c[0] * 0.95, c[1] * 0.95, c[2] * 0.95, c[3]], 0.75);
      } }
      await tick();
      const F = pushPull(S0, W0, N, N);
      /* 단지 마당 — 건물 가까이(반지름의 1.6배 안) 찍힌 땅 중 무채색 포장면의 가운데 색. 모르는 땅이 건물 둘레면 그 색으로 기운다
         (건물 뒤는 대개 포장된 마당이다 — 숲 · 들 색이 번져 안개처럼 보이지 않게) */
      const yard = [[], [], []];
      const nearB = new Float32Array(N * N).fill(9);
      for (let j = 0; j < N; j++) { if (j % 32 === 0) await tick(); for (let i = 0; i < N; i++) {
        const k = j * N + i, x = x0 + (i + 0.5) * cell, z = z0 + (j + 0.5) * cell;
        let bd = 9;
        for (const b of blds) bd = Math.min(bd, Math.hypot(x - b[0], z - b[1]) / b[2]);
        nearB[k] = bd;
        if (!got[k] || bd > 1.6 || (i + j) % 3) continue;
        const a = Math.max(S0[k * 4 + 3], 1e-3), r = S0[k * 4] / a, g = S0[k * 4 + 1] / a, bl = S0[k * 4 + 2] / a;
        const l = r * 0.3 + g * 0.59 + bl * 0.11;
        if (Math.max(r, g, bl) - Math.min(r, g, bl) < 0.07 && l > 0.22 && l < 0.7) { yard[0].push(r); yard[1].push(g); yard[2].push(bl); }
      } }
      if (yard[0].length > 40) {
        const med = yard.map((a) => a.sort((p, q) => p - q)[a.length >> 1]);
        for (let k = 0; k < N * N; k++) {
          if (got[k]) continue;
          const y = (1 - Math.min(1, Math.max(0, (nearB[k] - 1.15) / 0.75))) * 0.8;
          if (y <= 0) continue;
          const a = F[k * 4 + 3];
          for (let c = 0; c < 3; c++) F[k * 4 + c] += (med[c] * a - F[k * 4 + c]) * y;
        }
      }
      // ⓒ 번져 채운 곳만 고르게 — 가로 · 세로 상자 흐림 두 번(반지름 2칸)
      for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
        await tick();
        const G = F.slice();
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
          const k = j * N + i;
          if (W0[k]) continue;
          for (let c = 0; c < 4; c++) {
            let sum = 0, n = 0;
            for (let t = -2; t <= 2; t++) {
              const ii = horiz ? i + t : i, jj = horiz ? j : j + t;
              if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue;
              sum += G[(jj * N + ii) * 4 + c]; n++;
            }
            F[k * 4 + c] = sum / n;
          }
        }
      }
      /* 접지 그늘 — 위에서 내려다본 건물 자국(GPU 로 한 장)을 흐려, 건물 둘레의 채운 땅을 어둡게. 건물이 땅에 붙어 보이게 */
      await tick();
      {
        const rt = new THREE.WebGLRenderTarget(N, N), buf = new Uint8Array(N * N * 4);
        const oc = new THREE.OrthographicCamera(x0, x0 + 2 * ext, -z0, -(z0 + 2 * ext), 1, 1e5);
        oc.position.set(0, 5e4, 0); oc.rotation.set(-Math.PI / 2, 0, 0); oc.updateMatrixWorld(true); oc.updateProjectionMatrix();
        const keep = new Set(objs), hid = [];
        scene.traverse((x) => { if ((x.isMesh || x.isLine) && x.visible && !keep.has(x)) { x.visible = false; hid.push(x); } });
        const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cc = new THREE.Color(), ca = renderer.getClearAlpha(); renderer.getClearColor(cc);
        renderer.setClearColor(0x000000, 1);
        scene.overrideMaterial = white; renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, oc);
        renderer.readRenderTargetPixels(rt, 0, 0, N, N, buf);
        renderer.setRenderTarget(null); scene.overrideMaterial = null; renderer.setClearColor(cc, ca);
        hid.forEach((x) => (x.visible = true)); white.dispose(); rt.dispose();
        const M = new Float32Array(N * N);
        for (let jr = 0; jr < N; jr++) for (let i = 0; i < N; i++) M[(N - 1 - jr) * N + i] = buf[(jr * N + i) * 4] > 127 ? 1 : 0;
        const R = Math.max(2, Math.round(12 / cell)); // 그늘 폭 약 12m
        let B = M;
        for (let pass = 0; pass < 2; pass++) for (const horiz of [true, false]) {
          await tick();
          const G = new Float32Array(N * N);
          for (let j = 0; j < N; j++) {
            let acc = 0;
            for (let t = -R; t <= R; t++) { const ii = horiz ? t : j, jj = horiz ? j : t; if (ii >= 0 && jj >= 0 && ii < N && jj < N) acc += B[jj * N + ii]; }
            for (let i = 0; i < N; i++) {
              const k = horiz ? j * N + i : i * N + j;
              G[k] = acc / (2 * R + 1);
              const a0 = i - R, a1 = i + R + 1;
              if (horiz) { if (a0 >= 0) acc -= B[j * N + a0]; if (a1 < N) acc += B[j * N + a1]; }
              else { if (a0 >= 0) acc -= B[a0 * N + j]; if (a1 < N) acc += B[a1 * N + j]; }
            }
          }
          B = G;
        }
        for (let k = 0; k < N * N; k++) {
          if (got[k] || M[k]) continue;
          const d = 1 - Math.min(1, B[k] * 1.8) * 0.55;
          F[k * 4] *= d; F[k * 4 + 1] *= d; F[k * 4 + 2] *= d;
        }
      }
      const u8 = new Uint8Array(N * N * 4);
      for (let k = 0; k < u8.length; k++) u8[k] = Math.max(0, Math.min(255, Math.round(F[k] * 255)));
      const gt = new THREE.DataTexture(u8, N, N);
      gt.magFilter = THREE.LinearFilter; gt.minFilter = THREE.LinearMipmapLinearFilter; gt.generateMipmaps = true;
      gt.wrapS = gt.wrapT = THREE.ClampToEdgeWrapping; gt.needsUpdate = true;
      U.uGround.value = gt; g0.dispose();
      U.uGB.value.set(x0, z0, 2 * ext, 2 * ext); U.uGN.value = N;
      return { groundPts, Rhome: Math.min(cap, Rhome * 1.02 + Rg * 0.05) };
    }
    return { U, tex, analyze, dispose() { rtA.dispose(); rtG.dispose(); } };
  }
  /* 빈 칸 채우기(push-pull) — 아는 칸의 평균을 거친 단계로 모아 올렸다가 다시 내려 빈 칸을 채운다. 값은 RGBA 4칸, W = 아는 정도 */
  function pushPull(S0, W0, w0, h0, R0) {
    const lv = [{ w: w0, h: h0, S: S0, W: W0 }];
    while (lv[lv.length - 1].w > 1 || lv[lv.length - 1].h > 1) {
      const a = lv[lv.length - 1], w = Math.ceil(a.w / 2), h = Math.ceil(a.h / 2), S = new Float32Array(w * h * 4), Wt = new Float32Array(w * h);
      for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) {
        const i = y * a.w + x, o = (y >> 1) * w + (x >> 1);
        if (!a.W[i]) continue;
        const r = R0 && lv.length === 1 ? R0[i] : 1, k = r / (lv.length === 1 ? a.W[i] : 1);
        Wt[o] += lv.length === 1 ? r : a.W[i];
        S[o * 4] += a.S[i * 4] * k; S[o * 4 + 1] += a.S[i * 4 + 1] * k; S[o * 4 + 2] += a.S[i * 4 + 2] * k; S[o * 4 + 3] += a.S[i * 4 + 3] * k;
      }
      lv.push({ w, h, S, W: Wt });
    }
    const top = lv[lv.length - 1];
    let F = new Float32Array(4);
    if (top.W[0] > 0) for (let c = 0; c < 4; c++) F[c] = top.S[c] / top.W[0];
    for (let l = lv.length - 2; l >= 0; l--) {
      const a = lv[l], c1 = lv[l + 1], G = new Float32Array(a.w * a.h * 4);
      for (let y = 0; y < a.h; y++) {
        const fy = Math.min(c1.h - 1, Math.max(0, (y + 0.5) / 2 - 0.5)), y0 = Math.floor(fy), y1 = Math.min(c1.h - 1, y0 + 1), ty = fy - y0;
        for (let x = 0; x < a.w; x++) {
          const fx = Math.min(c1.w - 1, Math.max(0, (x + 0.5) / 2 - 0.5)), x0 = Math.floor(fx), x1 = Math.min(c1.w - 1, x0 + 1), tx = fx - x0;
          const o = y * a.w + x, wv = Math.min(1, a.W[o]);
          for (let c = 0; c < 4; c++) {
            const up = (F[(y0 * c1.w + x0) * 4 + c] * (1 - tx) + F[(y0 * c1.w + x1) * 4 + c] * tx) * (1 - ty) + (F[(y1 * c1.w + x0) * 4 + c] * (1 - tx) + F[(y1 * c1.w + x1) * 4 + c] * tx) * ty;
            G[o * 4 + c] = a.W[o] > 0 ? wv * (a.S[o * 4 + c] / a.W[o]) + (1 - wv) * up : up;
          }
        }
      }
      F = G;
    }
    return F;
  }

  /* ── 캔버스 하나 = 모형 하나 ──
     opts: { model, cls, transparent, themeEl, isActive(), place(canvas), onFirst(), onStill(url), onTourStop(byUser), onView(sph),
             fit('cover' | 'fill' — 그림이 칸에 깔리는 방식), fitPos([x, y] 0~1), stillWidth,
             frame() — 캔버스 안의 그림 칸 { x, y, w, h }(CSS px). 캔버스가 칸보다 넓을 때(템플릿: 화면 전체) 처음 시점은 칸 안만
             그림과 같게 그리고, 움직이면 칸 밖까지 이어 그린다 — 확대해도 칸 가장자리에서 잘리지 않는다. 없으면 캔버스 전체 = 칸 } */
  function create(opts) {
    const { THREE, OrbitControls } = W.lib;
    const id = 'w3d-' + ++seq;
    const canvas = document.createElement('canvas');
    canvas.className = opts.cls || 'w3d';
    canvas.dataset.w3d = id;
    opts.place(canvas);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!opts.transparent, powerPreference: 'high-performance' });
    } catch (e) { canvas.remove(); throw e; } // WebGL 이 없는 PC
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (opts.transparent) renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const K = kit(THREE, renderer, scene);
    const spec = W.models[opts.model](THREE, K) || {};
    renderer.toneMappingExposure = spec.exposure ?? 0.85;
    const PH = K.rig; // 사진 맞춤 모형 — 처음 시점 = 그림을 찍은 카메라
    if (PH) renderer.shadowMap.enabled = false; // 그림자는 사진에 이미 있다

    /* 모형 범위 — 시점 맞추기 · 그림자 · 카메라 거리의 기준 */
    const bounds = new THREE.Box3();
    for (const b of K.buildings.values()) bounds.union(b.box);
    if (spec.bounds) bounds.union(new THREE.Box3(new THREE.Vector3(...spec.bounds[0]), new THREE.Vector3(...spec.bounds[1])));
    const center = bounds.getCenter(new THREE.Vector3());
    const R = Math.max(10, bounds.getBoundingSphere(new THREE.Sphere()).radius);

    const cam = spec.camera || {};
    const camera = PH ? new THREE.PerspectiveCamera(PH.cam.fov, PH.cam.aspect, PH.cam.near, PH.cam.far) : new THREE.PerspectiveCamera(cam.fov ?? 30, 16 / 9, cam.near ?? R / 40, cam.far ?? R * 30);

    /* ── 사진 맞춤 준비 — 모형 점(화면 맞추기) · 가운데 · 사진 입히기 ── */
    let PP = null, phReady = !PH;
    const fitPts = [], C = new THREE.Vector3();
    let Rg = R, Rhome = 1e9, gap = 1;
    if (PH) {
      const keys = new Set(), v = new THREE.Vector3();
      for (const b of K.buildings.values()) if (!b.group.userData.noFit) b.group.traverse((o) => {
        if (!o.isMesh || !o.visible) return;
        o.updateWorldMatrix(true, false);
        const p = o.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld);
          const k = Math.round(v.x) + ',' + Math.round(v.y) + ',' + Math.round(v.z);
          if (!keys.has(k)) { keys.add(k); fitPts.push(v.clone()); }
        }
      });
      const fb = new THREE.Box3().setFromPoints(fitPts);
      C.set((fb.min.x + fb.max.x) / 2, fb.min.y + (fb.max.y - fb.min.y) * 0.25, (fb.min.z + fb.max.z) / 2);
      Rg = Math.max(10, ...fitPts.map((p) => Math.hypot(p.x - C.x, p.z - C.z)));
      /* 건물에 붙어 확대해도 가까운 면이 잘리지 않게 — 건물과 카메라 사이 여유(gap)보다 앞 면(near)을 가깝게 */
      gap = Math.max(1, Rg * 0.08);
      camera.near = Math.min(PH.cam.near, gap * 0.4);
      PP = photoProject(THREE, renderer, scene, PH, { buildings: K.buildings, opaque: !opts.transparent, onLoad: () => { phReady = true; need = true; kick(); setTimeout(analyze, 40); } });
      /* 뒷판 — 찍은 카메라 앞 멀리 세운 판에 그림을 그대로. 모형 · 땅이 덮지 않는 곳(하늘 쪽 그림자 · 지평선 너머)까지
         처음 시점이 그림과 같게 하고, 움직이기 시작하면 사라진다. 깊이 지도를 다 그린 뒤에 넣어 가림 판정에는 끼지 않는다 */
      const off = PH.off, f = PH.cfg.f;
      const bd = PH.cam.far * 0.8;
      const back = new THREE.Mesh(new THREE.PlaneGeometry((off.W / f) * bd * 1.2, (off.H / f) * bd * 1.2), new THREE.ShaderMaterial({
        uniforms: { uPhoto: PP.U.uPhoto, uPhPV: PP.U.uPhPV, uPhT: PP.U.uPhT },
        vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: 'uniform sampler2D uPhoto; uniform mat4 uPhPV; uniform float uPhT; varying vec3 vW; void main() { vec4 pc = uPhPV * vec4(vW, 1.0); vec2 pu = pc.xy / pc.w * 0.5 + 0.5; if (pu.x < 0.0 || pu.x > 1.0 || pu.y < 0.0 || pu.y > 1.0) discard; vec4 c = texture2D(uPhoto, pu); c.a *= 1.0 - smoothstep(0.0, 0.3, uPhT); if (c.a < 0.004) discard; gl_FragColor = vec4(c.rgb * c.a, c.a); }',
      }));
      back.quaternion.copy(PH.cam.quaternion);
      back.position.copy(PH.cam.position).addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(PH.cam.quaternion), bd);
      back.userData.noPick = true; back.frustumCulled = false;
      scene.add(back);
    }
    function analyze() {
      if (dead) return;
      PP.analyze({ C, Rg, fitGround: !!PH.cfg.fitGround, dead: () => dead }).then((res) => {
        if (dead || !res) return;
        res.groundPts.forEach((p) => fitPts.push(p));
        Rg = Math.max(Rg, ...res.groundPts.map((p) => Math.hypot(p.x - C.x, p.z - C.z)));
        Rhome = res.Rhome;
        fitCache.clear();
        need = true; kick();
      }).catch((e) => { if (!dead) console.warn('[3d] 사진 분석 실패', e); });
    }

    const controls = PH ? null : new OrbitControls(camera, canvas);
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.12;
      controls.screenSpacePanning = false;
      controls.minDistance = cam.minDistance ?? R * 0.3;
      controls.maxDistance = cam.maxDistance ?? R * 5;
      controls.minPolarAngle = 0.08;
      controls.maxPolarAngle = cam.maxPolar ?? 1.45;
      controls.zoomToCursor = true;
    }

    /* 빛 — 왼쪽 앞 위에서 해(모형마다 바꿀 수 있다) */
    const L = spec.light || {};
    const hemi = new THREE.HemisphereLight(L.sky ?? 0xdfe8f0, L.ground ?? 0x3b4a35, L.hemi ?? 1.15);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(L.sunColor ?? 0xfff4e6, L.sun ?? 2.4);
    const sd = new THREE.Vector3(...(L.dir || [-0.55, 0.75, 0.35])).normalize();
    sun.position.copy(center).addScaledVector(sd, R * 2.2);
    sun.target.position.copy(center);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sb = L.shadowR ?? R * 1.1;
    Object.assign(sun.shadow.camera, { left: -sb, right: sb, top: sb, bottom: -sb, near: R * 0.2, far: R * 5 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = Math.max(0.05, R / 900);
    scene.add(sun, sun.target);

    const fog = !opts.transparent && spec.fog ? new THREE.Fog(0x0b0e14, spec.fog[0], spec.fog[1]) : null;
    if (fog) scene.fog = fog;

    /* ── 시점(일반 모형) ── { target, r, phi, theta } 또는 { fit: pad, phi, theta } (모형이 칸에 꼭 들어오게) */
    const sph = new THREE.Spherical();
    const resolve = (v) => {
      if (typeof v === 'string') v = (spec.views || {})[v] || (spec.views || {}).home;
      if (!v) v = { fit: 1.1, phi: 0.95, theta: -0.62 };
      if (v.r != null) return v;
      /* 모형 상자의 꼭짓점 8개가 모두 화면 안에 들어오는 가장 가까운 거리 × fit */
      const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), th = tv * camera.aspect;
      const tg = v.target || [center.x, (v.ty ?? 0.25) * (bounds.max.y - bounds.min.y) + bounds.min.y, center.z];
      const T0 = new THREE.Vector3(...tg);
      const d = new THREE.Vector3().setFromSpherical(new THREE.Spherical(1, v.phi, v.theta));
      const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize();
      if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
      const up = new THREE.Vector3().crossVectors(d, right).normalize();
      let r = 0;
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const o = new THREE.Vector3(x, y, z).sub(T0);
        const along = o.dot(d);
        r = Math.max(r, along + Math.abs(o.dot(right)) / th, along + Math.abs(o.dot(up)) / tv);
      }
      return { target: tg, r: r * (v.fit || 1), phi: v.phi, theta: v.theta };
    };
    const place = (v) => { v = resolve(v); sph.set(v.r, v.phi, v.theta); camera.position.setFromSpherical(sph).add(new THREE.Vector3(...v.target)); controls.target.set(...v.target); camera.lookAt(controls.target); controls.update(); };

    /* ── 사진 맞춤 시점 ──
       S = { t: 처음 시점 → 맞춘 시점(0~1), yaw · tilt: 처음 시점에서 돌린 각, k: 거리 배수, px · pz: 옮긴 만큼 }
       t = 0 이면 찍은 카메라 그대로(렌즈 시프트 · 그림이 칸에 깔린 방식까지). t = 1 이면 모형 가운데를 화면 가운데에 두고
       모형 전체(건물 + 바닥 판)가 칸에 들어오는 거리. 카메라는 늘 모형 가운데(C)를 축으로 돈다 — 처음 시점에서 C 가 보이던
       픽셀은 돌려도 그대로이고(dq0), t 가 1 로 가며 화면 가운데로 온다. */
    const UP = new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(), qI = new THREE.Quaternion(), qT = new THREE.Quaternion();
    const spT = new THREE.Spherical(), Cp = new THREE.Vector3();
    const S = { t: 0, yaw: 0, tilt: 0, k: 1, px: 0, pz: 0 };
    const vel = { yaw: 0, tilt: 0 };
    let kT = 1, rho0 = 1, psi0 = 1, th0 = 0, dq0 = null, lens = null;
    const PSI_MIN = 0.06, PSI_MAX = 1.5, K_MIN = 0.22, K_MAX = 2.4, FIT_PAD = 1.06;
    const fitCache = new Map();
    if (PH) {
      const P0 = PH.cam.position.clone(), sp0 = new THREE.Spherical().setFromVector3(P0.clone().sub(C));
      rho0 = sp0.radius; psi0 = sp0.phi; th0 = sp0.theta;
      m4.lookAt(P0, C, UP);
      dq0 = new THREE.Quaternion().setFromRotationMatrix(m4).invert().multiply(PH.cam.quaternion);
    }
    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    const clampTilt = (t) => Math.min(psi0 - PSI_MIN, Math.max(psi0 - PSI_MAX, t));
    const clampPan = (s) => { const d = Math.hypot(s.px, s.pz), m = Rg * 0.9; if (d > m) { s.px *= m / d; s.pz *= m / d; } return s; };
    /* 모형 점이 모두 칸 안에 들어오는 가장 가까운 거리 — 그 높이(psi)에서 16 방향 중 가장 먼 것(돌려도 크기가 출렁이지 않게) */
    function fitDist(psi, pts, ctr, tanH, tanV) {
      const sp = Math.sin(psi), cp = Math.cos(psi);
      let r = 0;
      for (let s = 0; s < 16; s++) {
        const th = (s / 16) * Math.PI * 2, st = Math.sin(th), ct = Math.cos(th);
        const dx = sp * st, dy = cp, dz = sp * ct, rx = ct, rz = -st;
        const ux = dy * rz, uy = dz * rx - dx * rz, uz = -dy * rx;
        for (const p of pts) {
          const ox = p.x - ctr.x, oy = p.y - ctr.y, oz = p.z - ctr.z;
          const al = ox * dx + oy * dy + oz * dz;
          r = Math.max(r, al + Math.abs(ox * rx + oz * rz) / tanH, al + Math.abs(ox * ux + oy * uy + oz * uz) / tanV);
        }
      }
      return r;
    }
    const tanV = () => lens.vh / 2 / PH.cfg.f, tanH1 = () => (lens.vh * lens.cw) / lens.ch / 2 / PH.cfg.f;
    const fitR = (psi) => {
      const key = Math.round(psi * 200);
      if (!fitCache.has(key)) fitCache.set(key, fitDist(key / 200, fitPts, C, tanH1(), tanV()) * FIT_PAD);
      return fitCache.get(key);
    };
    const rhoOf = (s) => (rho0 + (fitR(Math.min(PSI_MAX, Math.max(PSI_MIN, psi0 - s.tilt))) - rho0) * s.t) * s.k;
    /* 건물 안으로 들어가지 않게 — 축(Cp)에서 카메라 쪽으로 쏜 선이 건물 상자(gap 만큼 키운)를 다 빠져나가는 거리 */
    const hitBoxes = [...K.buildings.values()].map((b) => b.box), spD = new THREE.Spherical(), dD = new THREE.Vector3();
    function minRho(psi, th, cp) {
      const d = dD.setFromSpherical(spD.set(1, psi, th)), o = [cp.x, cp.y, cp.z], dv = [d.x, d.y, d.z];
      let r = 0;
      for (let it = 0; it < 8; it++) {
        let push = r;
        for (const b of hitBoxes) {
          const lo = [b.min.x - gap, b.min.y - gap, b.min.z - gap], hi = [b.max.x + gap, b.max.y + gap, b.max.z + gap];
          let inside = true, tf = Infinity;
          for (let a = 0; a < 3; a++) {
            const p = o[a] + dv[a] * r;
            if (p <= lo[a] || p >= hi[a]) { inside = false; break; }
            if (Math.abs(dv[a]) > 1e-9) tf = Math.min(tf, Math.max((lo[a] - o[a]) / dv[a], (hi[a] - o[a]) / dv[a]));
          }
          if (inside && tf < Infinity) push = Math.max(push, tf);
        }
        if (push <= r) break;
        r = push + 1e-3;
      }
      return r;
    }
    function applyPV() {
      if (!lens) return;
      const t = S.t, psi = Math.min(PSI_MAX, Math.max(PSI_MIN, psi0 - S.tilt)), th = th0 + S.yaw;
      Cp.set(C.x + S.px, C.y, C.z + S.pz);
      let rho = rhoOf(S);
      if (t > 0) {
        /* 너무 다가가면 건물 앞에서 멈춘다(휠을 더 굴려도 그 자리) */
        const rm = minRho(psi, th, Cp);
        if (rho < rm) { S.k *= rm / rho; kT = Math.max(kT, S.k); rho = rm; }
      }
      camera.position.setFromSpherical(spT.set(rho, psi, th)).add(Cp);
      m4.lookAt(camera.position, Cp, UP);
      camera.quaternion.setFromRotationMatrix(m4).multiply(qT.copy(dq0).slerp(qI, t));
      const vw1 = (lens.vh * lens.cw) / lens.ch, vw = lens.vw + (vw1 - lens.vw) * t;
      /* 그림 칸이 보는 창 → 캔버스가 칸보다 넓으면 같은 배율로 칸 바깥까지 넓힌 창 */
      const sx = vw / lens.cw, sy = lens.vh / lens.ch;
      camera.setViewOffset(lens.W, lens.H, lens.x + ((lens.W - vw) / 2 - lens.x) * t - lens.fx * sx, lens.y + ((lens.H - lens.vh) / 2 - lens.y) * t - lens.fy * sy, lens.CW * sx, lens.CH * sy);
      camera.updateMatrixWorld();
      /* 땅 원 — 처음 시점에선 그림에 보이는 땅을 다 덮고, 맞춘 시점에선 모형 둘레만 */
      const rin1 = Rg * (opts.transparent ? 1.08 : 1.45), rout1 = Rg * (opts.transparent ? 1.4 : 2.4);
      const rin0 = Math.max(Rhome, rin1), rout0 = Math.max(Rhome * 1.3, rout1);
      PP.U.uPhT.value = t;
      PP.U.uFade.value.set(C.x, C.z, rin0 + (rin1 - rin0) * t, rout0 + (rout1 - rout0) * t);
    }
    const resolvePV = (v) => {
      if (typeof v === 'string') v = v === 'home' ? null : (spec.views || {})[v];
      if (!v) return { t: 0, yaw: 0, tilt: 0, k: 1, px: 0, pz: 0 };
      const r = v.rel || v;
      return { t: r.t ?? 1, yaw: r.yaw ?? 0, tilt: clampTilt(r.up ?? 0), k: r.k ?? 1, px: 0, pz: 0 };
    };
    /* 건물 하나를 화면에 크게 — 그 건물 가운데로 옮기고 건물 상자가 들어오는 거리 */
    function focusPV(rec, yaw, tilt) {
      const s = clampPan({ t: 1, yaw, tilt: clampTilt(tilt), k: 1, px: rec.center.x - C.x, pz: rec.center.z - C.z });
      const psi = Math.min(PSI_MAX, Math.max(PSI_MIN, psi0 - s.tilt));
      const b = rec.box, pts = [];
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) pts.push(new THREE.Vector3(x, y, z));
      const need = fitDist(psi, pts, new THREE.Vector3(C.x + s.px, C.y, C.z + s.pz), tanH1(), tanV()) * 1.3;
      s.k = Math.min(1, Math.max(K_MIN, need / fitR(psi)));
      return s;
    }

    const selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0x3fa9ff, transparent: true, opacity: 0.95 }));
    selBox.visible = false;
    scene.add(selBox);
    K.ACCENT_LINE.push(selBox.material);

    /* ── 그리기 — 할 일이 있을 때만 ── */
    let raf = 0, need = true, fly = null, stillT = 0, dead = false, shown = false, lastStill = '';
    const visible = () => !dead && phReady && opts.isActive() && canvas.clientWidth > 0;
    const kick = () => { need = true; if (!raf && visible()) raf = requestAnimationFrame(loop); };
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    function stepFly(now) {
      if (!fly) return false;
      const t = fly.ms ? Math.min(1, (now - fly.s) / fly.ms) : 1, e = ease(t);
      if (PH) {
        for (const k in fly.b) S[k] = fly.a[k] + (fly.b[k] - fly.a[k]) * e;
        kT = S.k;
        if (t >= 1) fly = null;
        return true;
      }
      const tg = fly.t0.clone().lerp(fly.t1, e);
      let dth = fly.b.theta - fly.a.theta;
      dth = Math.atan2(Math.sin(dth), Math.cos(dth)); // 짧은 쪽으로 돈다
      sph.set(fly.a.radius + (fly.b.radius - fly.a.radius) * e, fly.a.phi + (fly.b.phi - fly.a.phi) * e, fly.a.theta + dth * e);
      camera.position.setFromSpherical(sph).add(tg);
      controls.target.copy(tg);
      camera.lookAt(tg);
      if (t >= 1) { fly = null; controls.update(); }
      return true;
    }
    /* 멈춤 판정 — 관성(damping)은 아주 작은 움직임을 오래 끈다. 한 프레임 이동이 눈에 안 보이면 멈춘 것으로 본다 */
    const lastPos = new THREE.Vector3(), lastTgt = new THREE.Vector3();
    function settled() {
      const d = camera.position.distanceToSquared(lastPos) + controls.target.distanceToSquared(lastTgt);
      lastPos.copy(camera.position); lastTgt.copy(controls.target);
      return d < 4e-9 * camera.position.distanceToSquared(controls.target) + 1e-6;
    }
    /* 사진 맞춤 — 관성 · 휠 확대를 한 프레임씩 */
    function stepPV() {
      let moved = false;
      if (!ptrs.size && (Math.abs(vel.yaw) > 2e-5 || Math.abs(vel.tilt) > 2e-5)) {
        S.yaw += vel.yaw; S.tilt = clampTilt(S.tilt + vel.tilt);
        vel.yaw *= 0.86; vel.tilt *= 0.86; moved = true;
      }
      if (S.k !== kT) { S.k = Math.abs(kT - S.k) < 1e-4 ? kT : S.k + (kT - S.k) * 0.22; moved = true; }
      return moved;
    }
    /* 그리기 — 캔버스가 그림 칸보다 넓으면 처음 시점(t = 0)은 칸 안만 그린다(칸 밖은 원래 화면 그대로).
       움직이기 시작해 t 가 1 로 가는 동안 그리는 곳이 캔버스 전체로 넓어진다 */
    function draw() {
      const L = lens, t = PH ? S.t : 1;
      const cut = !!L && t < 1 && (L.fx > 0.5 || L.fy > 0.5 || L.cw < L.CW - 0.5 || L.ch < L.CH - 0.5);
      if (cut) {
        const w = L.cw + (L.CW - L.cw) * t, h = L.ch + (L.CH - L.ch) * t, x = L.fx * (1 - t), y = L.fy * (1 - t);
        renderer.setScissorTest(false); renderer.clear();
        renderer.setScissor(x, L.CH - y - h, w, h); renderer.setScissorTest(true);
      }
      renderer.render(scene, camera);
      if (cut) renderer.setScissorTest(false);
    }
    let poked = false;
    function loop(now) {
      raf = 0;
      if (!visible()) return;
      const flying = stepFly(now);
      let moved;
      if (PH) { moved = stepPV() || poked; poked = false; }
      else moved = flying ? (settled(), false) : controls.update() && !settled();
      if (need || flying || moved) {
        if (PH) applyPV();
        draw(); need = false;
        if (!shown) { shown = true; opts.onFirst && opts.onFirst(); }
        const hook = opts.onView || (registry.get(id) && registry.get(id).onView);
        if (hook) hook(PH ? new THREE.Spherical(rhoOf(S), Math.min(PSI_MAX, Math.max(PSI_MIN, psi0 - S.tilt)), th0 + S.yaw) : new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)));
      }
      clearTimeout(stillT);
      if (flying || moved || (PH && ptrs.size)) { if (!raf) raf = requestAnimationFrame(loop); }
      else stillT = setTimeout(still, 450);
    }
    const reduced = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const flyTo = (v, ms = 1100) => {
      if (reduced()) ms = 0;
      if (PH) {
        const b = typeof v === 'object' && v && 't' in v && 'px' in v ? { ...v } : resolvePV(v);
        if ('yaw' in b) b.yaw = S.yaw + wrap(b.yaw - S.yaw); // 짧은 쪽으로
        fly = { a: { ...S }, b, s: performance.now(), ms };
        vel.yaw = vel.tilt = 0;
        kick();
        return;
      }
      v = resolve(v);
      const a = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      const b = new THREE.Spherical(v.r, v.phi, v.theta);
      fly = { a, b, t0: controls.target.clone(), t1: new THREE.Vector3(...v.target), s: performance.now(), ms };
      kick();
    };
    if (controls) {
      controls.addEventListener('change', kick);
      controls.addEventListener('start', () => { fly = null; stopTour(true); });
      /* 모형에서 너무 멀리 옮기지 않게 */
      const lim = bounds.clone().expandByScalar(R * 0.6);
      controls.addEventListener('change', () => {
        const t = controls.target;
        t.x = Math.max(lim.min.x, Math.min(lim.max.x, t.x)); t.z = Math.max(lim.min.z, Math.min(lim.max.z, t.z));
        t.y = Math.max(bounds.min.y, Math.min(bounds.max.y, t.y));
      });
    }

    /* ── 사진 맞춤 손 조작 — 끌기 = 돌리기(한 바퀴), 오른쪽 · Shift 끌기 = 옮기기, 휠 · 두 손가락 = 확대 ──
       손으로 움직이기 시작하면 맞춘 시점(t = 1)으로 넘어간다 — 모형 전체가 칸 안에 들어와 잘리지 않는다 */
    const ptrs = new Map();
    let mode = '', lastMove = 0, pinch = 0;
    function userStart() {
      stopTour(true);
      if (fly && !fly.auto) fly = null;
      if (S.t < 1 && !fly) { fly = { a: { t: S.t }, b: { t: 1 }, s: performance.now(), ms: reduced() ? 0 : 650, auto: true }; }
      kick();
    }
    function panBy(dx, dy) {
      const th = th0 + S.yaw, sc = (rhoOf(S) * 2 * tanV()) / Math.max(1, lens.ch);
      S.px += (-dx * Math.cos(th) - dy * Math.sin(th)) * sc;
      S.pz += (dx * Math.sin(th) - dy * Math.cos(th)) * sc;
      clampPan(S);
    }
    const zoomBy = (f) => { kT = Math.min(K_MAX, Math.max(K_MIN, kT * f)); };
    if (PH) {
      canvas.style.touchAction = 'none';
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button > 2) return;
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, go: false });
        try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
        vel.yaw = vel.tilt = 0;
        if (ptrs.size >= 2) { mode = 'pinch'; const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
        else mode = e.button === 2 || e.shiftKey || e.ctrlKey || e.metaKey ? 'pan' : e.button === 1 ? 'dolly' : 'rot';
      });
      canvas.addEventListener('pointermove', (e) => {
        const p = ptrs.get(e.pointerId);
        if (!p) return;
        if (!p.go) { if (Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 4) return; p.go = true; userStart(); }
        const dx = e.clientX - p.x, dy = e.clientY - p.y;
        p.x = e.clientX; p.y = e.clientY;
        const H = Math.max(480, lens ? lens.ch : canvas.clientHeight);
        if (mode === 'rot') {
          const a = (2 * Math.PI * dx) / H, b = (Math.PI * dy) / H;
          S.yaw -= a; S.tilt = clampTilt(S.tilt + b);
          vel.yaw = -a; vel.tilt = b; lastMove = performance.now();
        } else if (mode === 'pan') panBy(dx, dy);
        else if (mode === 'dolly') zoomBy(Math.exp(dy * 0.006));
        else if (mode === 'pinch' && ptrs.size >= 2) {
          const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinch > 0 && d > 0) zoomBy(pinch / d);
          pinch = d;
          panBy(dx / 2, dy / 2);
        }
        poked = true; kick();
      });
      const endPtr = (e) => {
        if (!ptrs.delete(e.pointerId)) return;
        try { canvas.releasePointerCapture(e.pointerId); } catch (er) {}
        if (!ptrs.size) { if (performance.now() - lastMove > 90) vel.yaw = vel.tilt = 0; mode = ''; }
        else { mode = 'rot'; for (const p of ptrs.values()) { p.x0 = p.x; p.y0 = p.y; } }
        kick();
      };
      canvas.addEventListener('pointerup', endPtr);
      canvas.addEventListener('pointercancel', endPtr);
      canvas.addEventListener('wheel', (e) => { e.preventDefault(); userStart(); zoomBy(Math.exp(e.deltaY * 0.0012)); kick(); }, { passive: false });
    }

    /* 정지 그림 — 같은 작업 안에서 그려야 WebGL 버퍼를 읽을 수 있다 */
    const sc = document.createElement('canvas'), sx = sc.getContext('2d');
    function grab(width = 1280) {
      if (!visible() || !canvas.width) return lastStill;
      if (PH) applyPV();
      draw();
      sc.width = Math.min(width, canvas.width); sc.height = Math.round(sc.width * canvas.height / canvas.width);
      sx.clearRect(0, 0, sc.width, sc.height);
      sx.drawImage(canvas, 0, 0, sc.width, sc.height);
      try { lastStill = opts.transparent ? sc.toDataURL('image/webp', 0.86) : sc.toDataURL('image/jpeg', 0.82); } catch (e) {}
      return lastStill;
    }
    function still() { if (!visible()) return; const url = grab(opts.stillWidth); if (url && opts.onStill) opts.onStill(url); }

    /* ── 크기 — 칸에 맞추고, 축소돼 보이는 만큼 픽셀도 줄인다 ── */
    const vp = new THREE.Vector2();
    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h || dead) return;
      const k = canvas.getBoundingClientRect().width / w || 1;
      /* 사진 맞춤은 사진을 줄여 그리므로 1.5배로 그려 브라우저가 줄이게 한다(그림 <img> 처럼 또렷하게) */
      /* 화면 전체를 덮는 캔버스(템플릿)는 그릴 픽셀을 4K 정도까지만 */
      renderer.setPixelRatio(Math.min(PH ? 2.5 : 2, (window.devicePixelRatio || 1) * k * (PH ? 1.5 : 1), Math.sqrt(9e6 / (w * h))));
      renderer.setSize(w, h, false);
      if (PH) {
        fitCache.clear();
        fitPhoto(w, h);
        PP.U.uVP.value.copy(renderer.getDrawingBufferSize(vp));
      } else {
        camera.aspect = w / h; camera.updateProjectionMatrix();
        if (!camera.userData.placed) { camera.userData.placed = true; place('home'); }
      }
      kick();
    }
    /* 사진 맞춤 — 칸에 그림이 깔리는 방식(cover · fill)을 카메라에 그대로: 렌즈 시프트(주점) + 잘라 보이는 부분 */
    function fitPhoto(w, h) {
      const { off, cfg } = PH, iw = cfg.w, ih = cfg.h;
      const fr = (opts.frame && opts.frame()) || { x: 0, y: 0, w, h };
      let x = off.x, y = off.y, vw = iw, vh = ih;
      if (opts.fit !== 'fill') {
        const k = Math.max(fr.w / iw, fr.h / ih), pos = opts.fitPos || [0.5, 0.5];
        vw = fr.w / k; vh = fr.h / k; x += (iw - vw) * pos[0]; y += (ih - vh) * pos[1];
      }
      /* cw · ch · fx · fy = 그림 칸(맞춘 시점은 모형 전체를 칸에 넣는다), CW · CH = 캔버스 */
      lens = { W: off.W, H: off.H, x, y, vw, vh, cw: fr.w, ch: fr.h, fx: fr.x, fy: fr.y, CW: w, CH: h };
      camera.aspect = off.W / off.H;
      applyPV();
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    /* ── 테마 ── */
    const hoverMats = new Map();
    const readColor = (name, fb) => { const c = new THREE.Color(fb); try { const v = getComputedStyle(opts.themeEl || document.body).getPropertyValue(name).trim(); if (v) c.setStyle(v); } catch (e) {} return c; };
    let point = new THREE.Color(0x3fa9ff);
    function applyTheme() {
      point = readColor('--point-main', spec.accent || '#3fa9ff');
      if (!opts.transparent) {
        const bg = readColor('--bg-page', '#0b0e14');
        const light = bg.r * 0.2126 + bg.g * 0.7152 + bg.b * 0.0722 > 0.35; // 선형값 기준 밝은 바탕
        scene.background = bg;
        if (fog) fog.color.copy(bg);
        hemi.intensity = (L.hemi ?? 1.15) + (light ? 0.2 : 0);
        if (PP) { const t = {}; bg.getRGB(t, THREE.SRGBColorSpace); PP.U.uBg.value.set(t.r, t.g, t.b); }
      }
      for (const m of K.ACCENT) { m.color.copy(point); m.emissive.copy(point); }
      for (const m of K.ACCENT_LINE) m.color.copy(point);
      for (const [orig, c] of hoverMats) { c.emissive.copy(point); if (K.ACCENT.includes(orig)) c.color.copy(point); }
      kick();
    }
    applyTheme();
    let themeT = 0;
    const onTheme = () => { clearTimeout(themeT); themeT = setTimeout(applyTheme, 60); };
    const tmo = new MutationObserver(onTheme);
    const mainEl = document.querySelector('.main');
    if (mainEl) tmo.observe(mainEl, { attributes: true, attributeFilter: ['style', 'data-mode', 'class', 'data-version'] });
    if (opts.themeEl && opts.themeEl !== mainEl) tmo.observe(opts.themeEl, { attributes: true, attributeFilter: ['style', 'data-theme', 'class'] });
    tmo.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class', 'data-theme'] });

    /* ── 고르기 ── */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function pick(ev) {
      const r = canvas.getBoundingClientRect();
      ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(K.pickables, false)[0];
      return hit ? hit.object.userData.b : null;
    }
    const hov = (m) => {
      if (!hoverMats.has(m)) { const c = m.clone(); c.emissive = point.clone(); c.emissiveIntensity = K.ACCENT.includes(m) ? 0.6 : 0.3; hoverMats.set(m, c); }
      return hoverMats.get(m);
    };
    const focusR = (rec) => Math.max(rec.size.x, rec.size.y, rec.size.z) * 3.2 + R * (spec.focusPad ?? 0.45);
    let hover = null;
    /* 사진 맞춤 — 건물이 비스듬히 놓여 있어 축에 맞춘 상자는 어긋나 보인다 → 건물 모양 그대로의 테두리 선 */
    const lineMat = (o) => { const m = new THREE.LineBasicMaterial({ color: 0x3fa9ff, transparent: true, opacity: o, depthTest: false }); K.ACCENT_LINE.push(m); return m; };
    const hovLines = new THREE.Group(), selLines = new THREE.Group(), hovMat = lineMat(0.45), selMat = lineMat(0.95);
    scene.add(hovLines, selLines);
    function outline(grp, rec, mat) {
      grp.children.forEach((c) => c.geometry.dispose());
      grp.clear();
      if (rec) rec.group.traverse((o) => { if (!o.isMesh || !o.geometry) return; o.updateWorldMatrix(true, false); const l = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 30), mat); l.applyMatrix4(o.matrixWorld); l.renderOrder = 10; grp.add(l); });
    }
    function setHover(rec) {
      if (hover === rec) return;
      if (PH) { hover = rec; outline(hovLines, rec, hovMat); }
      else {
        if (hover) hover.meshes.forEach((o) => (o.material = o[K.MATS]));
        hover = rec;
        if (rec) rec.meshes.forEach((o) => (o.material = Array.isArray(o[K.MATS]) ? o[K.MATS].map(hov) : hov(o[K.MATS])));
      }
      canvas.classList.toggle('is-hot', !!rec);
      kick();
    }
    if (PH) canvas.classList.add('is-photo');
    function mark(rec) {
      if (PH) { outline(selLines, rec, selMat); return; }
      selBox.visible = !!rec;
      if (rec) { const p = Math.max(2, R / 80); selBox.scale.set(rec.size.x + p, rec.size.y + p, rec.size.z + p); selBox.position.copy(rec.center); }
    }
    function select(rec, go) {
      if (typeof rec === 'string') rec = K.buildings.get(rec) || null;
      mark(rec);
      if (rec && go && PH) flyTo(focusPV(rec, S.yaw, Math.max(S.tilt, 0.18)));
      else if (rec && go) {
        const cur = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        flyTo({ target: [rec.center.x, Math.min(rec.center.y, bounds.min.y + (bounds.max.y - bounds.min.y) * 0.4), rec.center.z], r: focusR(rec), phi: Math.min(cur.phi, 1.05), theta: cur.theta });
      }
      kick();
    }
    let down = null, moveEv = null, moveRaf = 0;
    canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener('pointerup', (e) => {
      if (down && e.button === 0 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5) select(pick(e), true);
      down = null;
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.buttons) return;
      moveEv = e;
      if (!moveRaf) moveRaf = requestAnimationFrame(() => { moveRaf = 0; if (moveEv && !dead) setHover(pick(moveEv)); });
    });
    canvas.addEventListener('pointerleave', () => { moveEv = null; setHover(null); });
    canvas.addEventListener('wheel', () => { if (!PH) { fly = null; stopTour(true); } }, { passive: true });

    /* ── 순차감시 — 건물을 차례로 돈다(사진 맞춤은 한 곳마다 옆으로 돌아가며) ── */
    let tourT = 0, tourI = 0, touring = false;
    function tourStep() {
      if (!touring || dead) return;
      if (!visible()) { tourT = setTimeout(tourStep, 1000); return; }
      const ids = (spec.tour || [...K.buildings.keys()]).filter((k) => K.buildings.has(k));
      const rec = K.buildings.get(ids[tourI++ % ids.length]);
      mark(rec);
      if (PH) flyTo(focusPV(rec, S.yaw + 0.85, 0.32), 1600);
      else {
        const base = resolve('home');
        flyTo({ target: [rec.center.x, Math.min(rec.center.y, bounds.min.y + (bounds.max.y - bounds.min.y) * 0.4), rec.center.z], r: focusR(rec) + R * 0.1, phi: 0.95, theta: base.theta + Math.sin(tourI * 1.3) * 0.7 }, 1600);
      }
      tourT = setTimeout(tourStep, 4600);
    }
    function startTour() { if (touring) return; touring = true; tourI = 0; tourStep(); }
    function stopTour(byUser) {
      if (!touring) return;
      touring = false;
      clearTimeout(tourT);
      if (opts.onTourStop) opts.onTourStop(byUser);
    }

    const api = {
      id, canvas, camera, controls, buildings: K.buildings, bounds, R,
      flyTo(v, ms) { stopTour(false); flyTo(v, ms); },
      view(name) { stopTour(false); select(null); flyTo(name); },
      select, startTour, stopTour,
      homeHeading: PH ? th0 : resolve('home').theta, // 처음 시점의 방향
      heading: () => (PH ? th0 + S.yaw : new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)).theta), // 지금 바라보는 방향(라디안)
      get state() { return PH ? { ...S } : null; },
      wake() { resize(); kick(); },
      grab: (w) => grab(w),
      get lastStill() { return lastStill; },
      dispose() {
        if (dead) return;
        dead = true; touring = false;
        cancelAnimationFrame(raf); clearTimeout(stillT); clearTimeout(tourT); clearTimeout(themeT);
        ro.disconnect(); tmo.disconnect(); if (controls) controls.dispose();
        scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        if (PP) PP.dispose();
        renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {}
        canvas.remove();
        registry.delete(id);
      },
    };
    if (spec.setup) spec.setup(api, K);
    registry.set(id, api);
    resize();
    return api;
  }

  /* ── 복제본의 3D 캔버스 → 지금 모습 그림 ── */
  function bakeClone(root) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll('canvas[data-w3d]').forEach((c) => {
      const v = registry.get(c.dataset.w3d);
      const url = v && (v.grab() || v.lastStill);
      if (!url) { c.remove(); return; }
      const img = (c.ownerDocument || document).createElement('img');
      img.alt = '';
      img.className = c.className.replace(/\bis-hot\b/, '') + ' w3d-still';
      img.setAttribute('style', c.getAttribute('style') || 'position:absolute;left:0;top:0;width:100%;height:100%');
      img.style.opacity = '1';
      img.src = url;
      c.replaceWith(img);
    });
  }
})();
