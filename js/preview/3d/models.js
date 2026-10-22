/* ── WEMB 3D 모형 — 원본 렌더 그림을 찍은 카메라를 되살려, 그림의 픽셀로 건물을 세우고 그림을 그대로 입힌다(사진 맞춤) ──
   처음 시점은 그림과 픽셀까지 같고, 손으로 움직이면 모형 가운데를 축으로 360° 돈다(js/preview/3d/engine.js 의 photo · photoProject).
   그림에 안 찍힌 면은 엔진이 맞은편 면의 사진 · 둘레 땅에서 이어 채운다 — 여기서는 모양(지붕 모서리 · 벽 밑 픽셀)만 짓는다.
   plant      기본 디지털 트윈 — 서부발전 단지 (src/dt-bg.jpg)
   poscoKdb   POSCO KDB — 옥상 냉각탑 공장동 (src/posco/building-image.png · main · ack · overview · SOP)
   lsCampus   LS Electric — 공장 단지 미니맵 (src/lselectric/map-image.png · STATCOM · Data Center)
   hanjinHub  한진 — 대전 메가허브 물류센터 (src/hanjin/building-image.png · 통합관제)
   단위는 대략 m. 카메라는 원점 위(0, 높이, 0)에서 -z 쪽을 본다. 모형마다 views(시점) · tour(순차감시 순서)를 돌려준다. */
(function () {
  const W = window.WEMB3D;
  if (!W) return;

  /* ════════ 기본 디지털 트윈 — 서부발전 단지 (사진 맞춤, src/dt-bg.jpg 1920×1080) ════════
     항공 렌더를 찍은 카메라를 되살려 그림의 픽셀로 건물을 세우고 사진을 입힌다.
     - 내려다본 각: 단지의 두 직교 방향(오른쪽 위로 기울기 -0.42 · 오른쪽 아래로 +0.5)의 곱 = -sin²(각) → 27°.
       원형 탱크 윗면 타원의 납작함(0.33)도 같은 각을 준다. 초점 2700px(가로 화각 39°).
     - 크기 기준: 큰 탱크 반지름 ≈ 22m → 카메라 높이 340m.
     - 건물 높이는 눈으로 어림했다(가려진 밑동이 많다). 처음 시점은 높이와 상관없이 사진과 같고, 돌릴 때만 영향이 있다.
       어림이 낮아 건물 그림이 뒤 땅에 번지지 않게 땅 가림 판정은 넉넉히(guard). */
  W.models.plant = (THREE, K) => {
    const { std, building, prism, mesh } = K;
    const P = K.photo({ src: 'src/dt-bg.jpg', w: 1920, h: 1080, f: 2700, cx: 960, cy: 540, hc: 340, pitch: 27.3, guard: 1.45 }); // 건물 높이가 어림값이라 땅 가림 판정은 넉넉히
    const roof = std({ color: 0xc9c7c2, roughness: 0.9 }), wall = std({ color: 0xd8d5cf });
    const ground = std({ color: 0x2b3a2c, roughness: 1 });
    ground.userData.photoGround = true;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(8000, 8000).rotateX(-Math.PI / 2), ground);
    g.position.set(0, 0, -1500); g.userData.noPick = true;
    K.scene.add(g);
    // 지붕 네 모서리 픽셀 + 높이(m) → 기둥
    const bld = (id, px, H) => building(id, 0, 0, [prism(px.map(([u, v]) => { const p = P.at(u, v, H); return new THREE.Vector3(p.x, 0, p.z); }), H, wall, roof)]);
    bld('tower', [[735, 234], [780, 220], [817, 237], [775, 252]], 110);
    bld('boilerA', [[800, 300], [870, 278], [1012, 350], [940, 375]], 85);
    bld('boilerB', [[975, 378], [1185, 298], [1265, 357], [1055, 437]], 80);
    bld('cooling', [[522, 400], [560, 388], [900, 572], [865, 595]], 28);
    bld('midSolar', [[1055, 532], [1150, 505], [1260, 560], [1157, 600]], 32);
    bld('rightSolar', [[1240, 522], [1440, 445], [1625, 510], [1350, 595]], 14);
    bld('farRight', [[1535, 340], [1580, 320], [1800, 412], [1745, 432]], 16);
    bld('rightBack', [[1350, 345], [1395, 330], [1495, 385], [1445, 410]], 18);
    bld('office', [[575, 740], [690, 725], [765, 780], [660, 815]], 22);
    bld('hall', [[740, 660], [890, 630], [1020, 690], [870, 745]], 18);
    bld('leftA', [[350, 445], [385, 440], [500, 500], [440, 545]], 15);
    bld('leftFlat', [[205, 515], [300, 490], [470, 580], [380, 620]], 8);
    // 단지 밖 왼쪽 아래 창고 둘 — 그림 왼쪽 끝에 잘려 있다. 지붕 모서리(밖으로 이어지는 쪽은 같은 기울기로 늘림) + 가까운 모서리의 벽 밑으로 높이
    const bldB = (id, px, corner, base) => { bld(id, px, P.height(corner[0], corner[1], P.at(base[0], base[1]))); K.buildings.get(id).group.userData.noFit = true; }; // 화면 맞추기에선 뺀다(단지가 주인공)
    bldB('westA', [[45, 637], [122, 705], [0, 762], [-77, 694]], [122, 705], [133, 765]);
    bldB('westB', [[212, 777], [302, 850], [0, 985], [-90, 912]], [302, 850], [304, 905]);
    // 원형 탱크 — 윗면 타원 가운데 · 가로 반지름 픽셀 → 원기둥
    const tank = (id, u, v, rpx, H) => {
      const c = P.at(u, v, H), s = c.distanceTo(P.cam.position) * Math.cos(Math.atan2(Math.hypot(u - 960, v - 540), 2700));
      const r = (rpx * s) / 2700;
      building(id, 0, 0, [mesh(new THREE.CylinderGeometry(r, r, H, 48), [wall, roof, roof], c.x, H / 2, c.z)]);
    };
    tank('tankA', 1163, 205, 68, 40);
    tank('tankB', 1270, 255, 70, 40);
    return {
      exposure: 1,
      light: { dir: [-0.45, 0.75, 0.4], hemi: 1.15, sun: 2.0 },
      views: { overview: { rel: { up: 0.38 } } }, // 종합현황 = 단지 전체를 조금 더 위에서
      tour: ['boilerB', 'tower', 'cooling', 'tankA', 'midSolar', 'office', 'rightSolar', 'boilerA'],
    };
  };

  /* ════════ POSCO KDB — 옥상 냉각탑 공장동 (사진 맞춤) ════════
     원본 렌더(src/posco/building-image.png 1890×853)를 찍은 카메라를 되살려, 그림의 픽셀로 모형을 짓고 그림을 그대로 입힌다.
     - 2점 투시: 오른쪽 면 · 왼쪽 면의 위아래 선이 만나는 두 소실점 → 지평선 y≈-455(그림 위 밖), 초점거리 ≈3070px.
       이 카메라로 바닥에 내린 두 면이 직각이 된다(검산).
     - 아래 동(앞 · 오른쪽, 약 10m)과 위 동(왼쪽 뒤, 약 13m)이 왼쪽 면을 같이 쓰고, 냉각탑 단은 아래 동 지붕 위.
     처음 시점은 그림과 같고, 끌면 한 바퀴 돌려 볼 수 있다. */
  W.models.poscoKdb = (THREE, K) => {
    const { std, building, prism, mesh } = K;
    const P = K.photo({ src: 'src/posco/building-image.png', w: 1890, h: 853, f: 3070, cx: 945, cy: -455, hc: 52 });
    const wall = std({ color: 0xe4e6e7 }), wallShade = std({ color: 0xb4bcc6 }), roof = std({ color: 0xc4c7c9 });
    const coolSide = std({ color: 0x3a3f45 }), coolTop = std({ color: 0x9aa0a6 });
    const ground = std({ color: 0x8a8f93, roughness: 1 });
    ground.userData.photoGround = true;

    // 바닥 — 그림자 · 앞마당은 사진대로, 그림에서 빈 곳은 비운다
    const g = new THREE.Mesh(new THREE.PlaneGeometry(900, 900).rotateX(-Math.PI / 2), ground);
    g.position.set(0, 0, -200); g.userData.noPick = true;
    K.scene.add(g);

    // 본체 바닥 모서리 — 그림의 벽 밑선 픽셀(가까운 모서리 · 오른쪽 끝 · 왼쪽 끝 · 계단 자리)
    const N = P.at(1000, 834), E = P.at(1872, 352), FL = P.at(12, 515), J = P.at(455, 658);
    const back = E.clone().sub(N); // 오른쪽 면 방향 = 건물 깊이
    const H1 = P.height(1000, 592, N); // 아래 동 높이(가까운 모서리 위 끝)
    const H2 = P.height(12, 270, FL);  // 위 동 높이(왼쪽 끝 위)
    const lower = building('lower', 0, 0, [prism([N, E, J.clone().add(back), J], H1, wall, roof)]);
    const upper = building('upper', 0, 0, [prism([J, J.clone().add(back), FL.clone().add(back), FL], H2, wallShade, roof)]);
    // 두 동은 한 몸(평행사변형 N · E · FL+back · FL) — 안 찍힌 뒷면은 합친 가운데로 돌려 맞은편 바깥벽을 빌린다
    const mid = N.clone().add(FL).add(back).multiplyScalar(0.5);
    for (const r of [lower, upper]) r.meshes.forEach((o) => (o.userData.phMid = [mid.x, mid.z]));

    // 냉각탑 단 — 아래 동 지붕 위. 앞선은 그림의 다리 밑(지붕 높이) 픽셀, 깊이는 오른쪽 면과 같은 쪽으로
    const c1 = P.at(712, 430, H1), c2 = P.at(1540, 268, H1);
    const along = c2.clone().sub(c1), depth = new THREE.Vector3(along.z, 0, -along.x).normalize().multiplyScalar(-26);
    if (depth.clone().add(c1).z > c1.z) depth.negate(); // 뒤(카메라에서 먼 쪽)로
    const HT = P.height(1300, 6, c2) - H1; // 팬 위 끝까지
    building('cooling', 0, 0, [prism([c1, c2, c2.clone().add(depth), c1.clone().add(depth)], HT, coolSide, coolTop, H1)]);

    // 굴뚝 — 지붕 위 밑동 · 꼭대기 픽셀
    const sb = P.at(1115, 490, H1), st = P.height(1115, 258, sb);
    building('stack', 0, 0, [mesh(new THREE.CylinderGeometry(1.3, 1.3, st - H1, 16), std({ color: 0x8b9298 }), sb.x, (st + H1) / 2, sb.z)]);

    return { exposure: 1, light: { dir: [-0.45, 0.8, 0.5], hemi: 1.2, sun: 2.2 } };
  };

  /* ════════ LS Electric — 공장 단지 (미니맵 그림, 사진 맞춤) ════════
     원본 렌더(src/lselectric/map-image.png 2487×1400)를 찍은 카메라를 되살려 그림의 픽셀로 짓고 그림을 입힌다.
     - 3점 투시(위에서 내려다봄): 단지 바닥판 네 변의 두 소실점이 직교 → 초점 ≈4209px, 지평선 y≈-1720 → 내려다본 각 ≈29.9°.
     - 주요 건물은 지붕 모서리 픽셀 + 벽 밑 한 점으로 높이를 구해 세운다. 작은 것(창고 · 주차장)은 바닥 사진 그대로. */
  W.models.lsCampus = (THREE, K) => {
    const { std, building, prism, mesh } = K;
    const P = K.photo({ src: 'src/lselectric/map-image.png', w: 2487, h: 1400, f: 4209, cx: 1243.5, cy: 700, hc: 480, pitch: 29.9, fitGround: true }); // 단지 판까지 화면에 다 넣는다
    const roof = std({ color: 0x8c949c, roughness: 0.8 }), wall = std({ color: 0xd2d6da }), slab = std({ color: 0x4a4e52, roughness: 1 });
    // 바닥 — 단지 판은 그림 그대로, 판 밖(그림이 투명)은 비우고, 건물 뒤에 가려 안 찍힌 곳은 둘레 판에서 채운다
    slab.userData.photoGround = true;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2), slab);
    g.position.set(0, 0, -900); g.userData.noPick = true;
    K.scene.add(g);
    // 건물 — 지붕 모서리 픽셀(앞에서 본 모서리 하나는 벽 밑 픽셀과 짝)
    const bld = (id, roofPx, basePx, front = 3) => {
      const H = P.height(roofPx[front][0], roofPx[front][1], P.at(basePx[0], basePx[1]));
      const pts = roofPx.map(([u, v]) => { const p = P.at(u, v, H); return new THREE.Vector3(p.x, 0, p.z); });
      building(id, 0, 0, [prism(pts, H, wall, roof)]);
    };
    bld('factoryB', [[1032, 395], [1607, 284], [1818, 463], [1184, 582]], [1191, 634]);
    bld('factoryC', [[1266, 637], [1859, 504], [2039, 591], [1411, 802]], [1418, 823]);
    bld('factoryA', [[363, 839], [1092, 681], [1231, 796], [535, 982]], [537, 1032]);
    bld('office', [[1660, 721], [2102, 622], [2164, 746], [1729, 858]], [1735, 885]);
    bld('admin', [[463, 444], [609, 414], [846, 476], [684, 584]], [647, 628]);
    bld('greenHall', [[259, 522], [373, 500], [438, 607], [298, 637]], [302, 671]);
    bld('lobby', [[1424, 831], [1679, 773], [1741, 858], [1492, 918]], [1498, 945]);
    // 굴뚝 — 밑동 · 꼭대기
    const cb = P.at(817, 417), ct = P.height(802, 205, cb);
    building('chimney', 0, 0, [mesh(new THREE.CylinderGeometry(3.8, 4.2, ct, 14), std({ color: 0x2c4470 }), cb.x, ct / 2, cb.z)]);
    return { exposure: 1, light: { dir: [-0.5, 0.8, 0.35], hemi: 1.2, sun: 2.2 } };
  };

  /* ════════ 한진 — 대전 메가허브 물류센터 (사진 맞춤) ════════
     원본 렌더(src/hanjin/building-image.png 1605×586, 밤)를 찍은 카메라를 되살려 그림의 픽셀로 짓고 그림을 입힌다.
     - 2점 투시 · 낮은 각도: 앞 타원 동 윗면 타원의 납작함(짧은/긴 반지름 0.133)으로 내려다본 각을 구했다 → 지평선 y≈-8, 초점 2400px.
     - 물류동(5층) · 왼쪽 유리 타워 · 타원 램프 동 둘. 층 강조용 보이지 않는 층 상자 f1~f5.
     처음 시점 = 그림. 시점 단추 v1 = 처음 시점, v2~v6 = 오른쪽 · 왼쪽 · 위 · 가까이 · 뒤. */
  W.models.hanjinHub = (THREE, K) => {
    const { std, building, prism, mesh } = K;
    const P = K.photo({ src: 'src/hanjin/building-image.png', w: 1605, h: 586, f: 2400, cx: 802, cy: -8, hc: 136 });
    const side = std({ color: 0x9da2a6, roughness: 0.7 }), deck = std({ color: 0x5c6168, roughness: 1 }), glass = std({ color: 0x2c4658, roughness: 0.3 });
    const ground = std({ color: 0x3e3a37, roughness: 1 });
    ground.userData.photoGround = true;
    const g = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), ground);
    g.position.set(0, 0, -900); g.userData.noPick = true;
    K.scene.add(g);

    // 타원 램프 동 — 윗면 테두리(앞 · 뒤 · 왼 · 오른 끝) 픽셀로 크기를, 앞 밑점으로 높이를
    const drum = (id, bottom, top, left, right, back) => {
      const H = P.height(top[0], top[1], P.at(bottom[0], bottom[1]));
      const F = P.at(top[0], top[1], H), B = P.at(back[0], back[1], H), Lx = P.at(left[0], left[1], H).x, Rx = P.at(right[0], right[1], H).x;
      const cz = (F.z + B.z) / 2, r = Math.abs(F.z - B.z) / 2, cx = (Lx + Rx) / 2, L = Math.max(Rx - Lx, 2 * r + 1);
      const s = new THREE.Shape();
      s.moveTo(-L / 2 + r, -r); s.lineTo(L / 2 - r, -r); s.absarc(L / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
      s.lineTo(-L / 2 + r, r); s.absarc(-L / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false);
      const geo = new THREE.ExtrudeGeometry(s, { depth: H, bevelEnabled: false, curveSegments: 32 });
      geo.rotateX(-Math.PI / 2);
      building(id, cx, cz, [mesh(geo, [deck, side])]);
      return { left: cx - L / 2, back: cz - r };
    };
    const dA = drum('rampA', [1040, 490], [1040, 336], [852, 316], [1228, 300], [1040, 286]);
    const dB = drum('rampB', [1330, 437], [1330, 296], [1150, 290], [1445, 288], [1330, 279]);

    // 물류동 — 앞 밑선(왼 · 오른) · 앞 위 끝 · 뒤 끝(옥상 먼 끝). 오른쪽은 램프 동 뒤로 물러난 ㄱ자
    const Hm = P.height(650, 305, P.at(650, 505));
    const fl = P.at(380, 505), fr = P.at(850, 505);
    const backZ = P.at(650, 262, Hm).z;
    const rightX = P.at(1370, 265, Hm).x;
    const xA = dA.left, zSet = Math.min(dA.back, dB.back);
    const V = (x, z) => new THREE.Vector3(x, 0, z);
    const foot = [V(fl.x, fr.z), V(xA, fr.z), V(xA, zSet), V(rightX, zSet), V(rightX, backZ), V(fl.x, backZ)];
    const main = building('main', 0, 0, [prism(foot, Hm, side, deck)]);
    // 안 찍힌 뒷면은 ㄱ자 전체 직사각형의 가운데로 돌려 앞면(왼쪽 물류동 · 램프 동 타공판)을 빌린다
    main.meshes.forEach((o) => (o.userData.phMid = [(fl.x + rightX) / 2, (fr.z + backZ) / 2]));
    for (let f = 1; f <= 5; f++) { const ghost = prism(foot, Hm / 5, side, deck, (f - 1) * (Hm / 5)); ghost.visible = false; ghost.userData.noPick = true; building('f' + f, 0, 0, [ghost]); }

    // 유리 사무 타워 — 앞면 밑선 · 위 끝
    const t1 = P.at(188, 500), t2 = P.at(340, 502);
    const Ht = P.height(260, 293, P.at(260, 501));
    const tb = new THREE.Vector3(0, 0, -45);
    building('office', 0, 0, [prism([t1, t2, t2.clone().add(tb), t1.clone().add(tb)], Ht, glass, deck)]);

    return { exposure: 1, light: { dir: [-0.35, 0.72, 0.6], hemi: 0.8, sun: 1.4, sky: 0x9fb3d6, ground: 0x2a2826 },
      tour: ['main', 'office', 'rampA', 'rampB'],
      views: {
        v1: { rel: { t: 0 } },                // 처음 시점(그림)
        v2: { rel: { yaw: 0.85, up: 0.12 } }, // 오른쪽으로
        v3: { rel: { yaw: -0.85, up: 0.12 } },// 왼쪽으로
        v4: { rel: { up: 0.75 } },            // 위에서
        v5: { rel: { k: 0.62, up: 0.1 } },    // 가까이
        v6: { rel: { yaw: Math.PI, up: 0.18 } }, // 뒤에서
      } };
  };
})();
