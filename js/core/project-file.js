/* ── 프로젝트 파일 — 프로젝트(폴더) 하나를 화면 · 작업 상태째 한 파일로 저장하고, 다른 PC · 브라우저에서 연다 ──
   작업은 그 브라우저(localStorage)에만 저장된다. 노트북을 바꾸거나 브라우저 데이터를 지우면 사라지고,
   공유 링크(#/studio?t=)는 색 테마만 담는다. 회의에서 함께 만든 시안을 그대로 넘기고 이어 가려면 이 파일을 쓴다.

   파일(<프로젝트 이름>.wemb.json)
     { app: 'wemb-studio', kind: 'project', version: 1, exportedAt,
       project: { name },
       screens: [ 화면 기록 그대로(이름 · 화면 종류 · 레이아웃 · 템플릿 · 썸네일 · data = 작업 상태 묶음) — id · projectId 는 뺀다 ],
       open: 파일을 만들 때 열려 있던 화면의 순번 }
   열 때는 새 프로젝트로 들어온다(같은 이름이 있으면 '(가져옴)'을 붙인다). 저장 공간이 모자라면 아무것도 바꾸지 않는다.

   WEMB.projectFile
     save(gid)            그 프로젝트를 파일로 내려받는다(지금 작업 중인 화면은 먼저 저장)
     read(file)           파일을 읽어 새 프로젝트로 넣고 { gid, name, count, openId } 를 돌려준다(Promise)
     isProjectFile(file)  끌어 놓은 파일이 프로젝트 파일 같아 보이는지 */
(function () {
  const P = WEMB.projects;
  const APP = 'wemb-studio', KIND = 'project', VERSION = 1;

  const safeName = (s) => String(s || '프로젝트').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || '프로젝트';
  function download(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const sizeText = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB');

  function save(gid) {
    P.persistCurrentProjectData();
    const grp = P.groupById(gid);
    if (!grp) return null;
    let cur = null;
    try { cur = localStorage.getItem(P.CUR_PROJ); } catch (e) {}
    const list = P.screensOfGroup(gid);
    const screens = list.map((s) => {
      const c = JSON.parse(JSON.stringify(s));
      delete c.id;
      delete c.projectId;
      return c;
    });
    const doc = { app: APP, kind: KIND, version: VERSION, exportedAt: new Date().toISOString(), project: { name: grp.name || '프로젝트' }, screens, open: Math.max(0, list.findIndex((s) => s.id === cur)) };
    const text = JSON.stringify(doc);
    download(text, safeName(grp.name) + '.wemb.json');
    return { name: grp.name, count: screens.length, size: sizeText(text.length) };
  }

  const isProjectFile = (file) => !!file && (/\.wemb\.json$/i.test(file.name) || /\.json$/i.test(file.name) || file.type === 'application/json');

  function read(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('파일이 없어요.'));
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('파일을 읽지 못했어요.'));
      fr.onload = () => {
        let doc;
        try { doc = JSON.parse(fr.result); } catch (e) { return reject(new Error('프로젝트 파일 형식이 아니에요(.wemb.json).')); }
        if (doc && doc.kind === 'snapshots') return reject(new Error('색 테마 백업 파일이에요 — 작업공간의 ‘저장·스냅샷 → 파일에서 복원’으로 여세요.'));
        if (!doc || doc.app !== APP || doc.kind !== KIND || !Array.isArray(doc.screens) || !doc.screens.length) return reject(new Error('WEMB Studio 프로젝트 파일이 아니에요.'));
        if ((doc.version | 0) > VERSION) return reject(new Error('더 새 버전의 WEMB Studio 에서 만든 파일이에요. 스튜디오를 새로 받은 뒤 여세요.'));
        const groups = P.loadGroups(), screens = P.loadProjects();
        const base = String((doc.project && doc.project.name) || '가져온 프로젝트').slice(0, 120);
        const taken = new Set(groups.filter((g) => !g.deleted).map((g) => g.name));
        let name = base;
        for (let i = 1; taken.has(name); i++) name = base + (i === 1 ? ' (가져옴)' : ' (가져옴 ' + i + ')');
        const now = Date.now();
        const grp = { id: P.newGid(), name, fav: false, ts: now };
        const added = doc.screens.map((s, i) => {
          const c = Object.assign({}, s && typeof s === 'object' ? s : {});
          c.id = P.newId();
          c.projectId = grp.id;
          c.name = String(c.name || '화면 ' + (i + 1));
          c.ts = now - i; // 파일 순서 그대로
          if (c.data && typeof c.data !== 'object') delete c.data;
          return c;
        });
        /* 저장이 하나라도 실패하면 둘 다 되돌린다 — 반쪽짜리 프로젝트가 남지 않게 */
        const okS = P.saveProjects(added.concat(screens));
        const okG = okS && P.saveGroups([grp].concat(groups));
        if (!okS || !okG) {
          P.saveProjects(screens);
          P.saveGroups(groups);
          return reject(new Error('브라우저 저장 공간이 모자라 열지 못했어요(파일 ' + sizeText(fr.result.length) + '). 휴지통을 비우거나 쓰지 않는 프로젝트를 파일로 저장한 뒤 지우고 다시 여세요.'));
        }
        const openAt = Math.min(Math.max(0, doc.open | 0), added.length - 1);
        resolve({ gid: grp.id, name, count: added.length, openId: added[openAt].id });
      };
      fr.readAsText(file);
    });
  }

  WEMB.projectFile = { save, read, isProjectFile };
})();
