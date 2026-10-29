/* history.js — 生成履歴(IndexedDB "ai_history"/items)と右側のサムネイル列。失敗しても生成には影響しない */
(function(A){
  const $ = A.$, hero = $('#hero'), MAX = 50;
  let hist = [], activeId = null, ok = true, open = false, dbp = null;

  function idb(){
    if(dbp) return dbp;
    dbp = new Promise((res, rej) => {
      try{
        if(!window.indexedDB) return rej(new Error('no idb'));
        const q = indexedDB.open('ai_history', 1);
        q.onupgradeneeded = () => { q.result.createObjectStore('items', {keyPath:'id'}).createIndex('ts', 'ts'); };
        q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); q.onblocked = () => rej(new Error('blocked'));
      }catch(e){ rej(e); }
    });
    return dbp;
  }
  const tx = (mode, fn) => idb().then(db => new Promise((res, rej) => {
    const t = db.transaction('items', mode); let rq;
    try{ rq = fn(t.objectStore('items')); }catch(e){ rej(e); return; }
    t.oncomplete = () => res(rq && 'result' in rq ? rq.result : undefined);
    t.onerror = ev => rej(ev.target && ev.target.error); t.onabort = () => rej(t.error || new Error('abort'));
  }));
  async function makeThumb(blob){
    const bm = await createImageBitmap(blob), k = Math.min(1, 160/Math.max(bm.width, bm.height));
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bm.width*k)); c.height = Math.max(1, Math.round(bm.height*k));
    c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height); if(bm.close) bm.close();
    return await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
  }
  function render(){
    const list = $('#hlist'); list.textContent = '';
    for(const it of hist){
      const d = document.createElement('div'); d.className = 'hi' + (it.id === activeId ? ' act' : ''); d.title = it.prompt;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ht'; b.setAttribute('aria-label', A.t('history_open_aria', {prompt: it.prompt.slice(0, 30)}));
      const im = new Image(); im.alt = ''; im.loading = 'lazy'; im.decoding = 'async'; im.src = it.turl; b.append(im);
      b.onclick = () => A.viewer.showCompare(it.result, it.name, it.original, it.id);
      const x = document.createElement('button'); x.type = 'button'; x.className = 'hx'; x.textContent = '×'; x.setAttribute('aria-label', A.t('history_del_aria'));
      x.onclick = ev => { ev.stopPropagation(); del(it.id); };
      d.append(b, x); list.append(d);
    }
    $('#hempty').style.display = hist.length ? 'none' : 'block';
    $('#hclr').hidden = !hist.length;
    hero.classList.toggle('hopen', ok && open);
    $('#hbtn').hidden = !ok; $('#hbtn').setAttribute('aria-pressed', ok && open);
  }
  async function del(id){
    try{ await tx('readwrite', s => s.delete(id)); }catch(e){}
    const i = hist.findIndex(h => h.id === id);
    if(i >= 0){ URL.revokeObjectURL(hist[i].turl); hist.splice(i, 1); }
    render();
  }
  const dropOldest = async () => { if(hist.length) await del(hist[hist.length-1].id); };
  async function save(rec){
    if(!ok) return;
    try{
      const row = {id:rec.id, ts:rec.ts, prompt:rec.prompt, thumb:await makeThumb(rec.result), result:rec.result, original:rec.original, name:rec.name};
      try{ await tx('readwrite', s => s.put(row)); }
      catch(e){
        if(e && e.name === 'QuotaExceededError'){
          await dropOldest();
          try{ await tx('readwrite', s => s.put(row)); }
          catch(e2){ A.setStatus('err_hist_quota', true); return; }
        }else return;
      }
      hist.unshift({...row, turl:URL.createObjectURL(row.thumb)});
      while(hist.length > MAX) await dropOldest();
      if(innerWidth >= 860) open = true;
      render();
    }catch(e){ /* 履歴の失敗は無視 */ }
  }
  async function load(){
    try{
      if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
      const rows = await tx('readonly', s => s.getAll());
      rows.sort((a, b) => b.ts - a.ts);
      hist = rows.map(r => ({...r, turl:URL.createObjectURL(r.thumb)}));
      open = innerWidth >= 860 && hist.length > 0;
    }catch(e){ ok = false; }
    render();
  }
  $('#hbtn').onclick = () => { open = !open; render(); };
  $('#hclr').onclick = async () => {
    if(!confirm(A.t('history_confirm_clear'))) return;
    try{ await tx('readwrite', s => s.clear()); }catch(e){}
    hist.forEach(h => URL.revokeObjectURL(h.turl)); hist = []; render();
  };
  A.on('compare:show', d => { activeId = d.id; render(); });
  A.on('compare:hide', () => { activeId = null; render(); });
  A.on('lang:change', render);
  A.history = {save, load};
})(window.AI);
