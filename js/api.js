/* api.js — ComfyUI (via server.py): upload -> /prompt -> poll /history -> /view
   Base image = slot 1, references = slots 2..10 (Qwen Image Edit の最大10枚) */
(function(A){
  async function upload(file){
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const name = `web_${Date.now()}_${Math.random().toString(36).slice(2,6)}.${ext}`;
    const fd = new FormData(); fd.append('image', file, name); fd.append('overwrite', 'true');
    const r = await fetch(A.server.base()+'/upload/image', {method:'POST', body:fd, headers:A.server.hdr()});
    if(r.status === 401) throw new Error(A.t('err_access_key'));
    if(!r.ok) throw new Error(A.t('err_upload', {status: r.status}));
    const j = await r.json();
    return j.subfolder ? j.subfolder+'/'+j.name : j.name;
  }
  // names: uploaded file names in slot order (base, ref1, ref2 ... max 10)
  function build(names, prompt){
    const {WORKFLOW, NODE} = A;
    const wf = structuredClone(WORKFLOW);
    const ids = [NODE.base, ...NODE.refs];
    const missing = new Set();
    ids.forEach((id, i) => {
      const n = names[i];
      if(n) wf[id].inputs.image = n;
      else { delete wf[id]; missing.add(id); }
    });

    // Encoder / batch links must be sequential and only reference images that exist
    const enc = wf[NODE.enc], batch = wf[NODE.batch];
    for(const k of Object.keys(enc.inputs)) if(/^images\.image_\d+$/.test(k)) delete enc.inputs[k];
    for(const k of Object.keys(batch.inputs)) if(/^images\.image\d+$/.test(k)) delete batch.inputs[k];
    let slot = 0;
    ids.forEach(id => {
      if(missing.has(id)) return;
      enc.inputs['images.image_' + (slot + 1)] = [id, 0];
      batch.inputs['images.image' + slot] = [id, 0];
      slot++;
    });
    // Safety net: no dangling links to removed LoadImage nodes
    for(const node of Object.values(wf))
      for(const [k, v] of Object.entries(node.inputs))
        if(Array.isArray(v) && missing.has(v[0])) delete node.inputs[k];

    // The exported workflow leaves the prompt switch off; inject the prompt directly
    wf[NODE.promptSwitch].inputs.switch = false;
    wf[NODE.promptSwitch].inputs.on_false = prompt;
    wf[NODE.enc].inputs.negative_prompt = '';
    wf[NODE.sampler].inputs.seed = Math.floor(Math.random()*1e15);
    return wf;
  }

  // img1: base File / refs: File[] (最大9枚) / onStage('upload'|'queue'|'gen') / onTick(seconds)
  async function runEdit({img1, refs = [], prompt, onStage, onTick}){
    const S = A.server, NODE = A.NODE;
    onStage('upload');
    const all = [img1, ...refs].filter(Boolean).slice(0, A.MAX_IMAGES);
    const names = await Promise.all(all.map(upload));
    const wf = build(names, prompt);

    onStage('queue');
    const r = await fetch(S.base()+'/prompt', {method:'POST', headers:S.hdr({'Content-Type':'application/json'}),
      body: JSON.stringify({prompt: wf, client_id: 'web-'+Date.now()})});
    const j = await r.json().catch(() => ({}));
    if(r.status === 401) throw new Error(A.t('err_access_key'));
    if(!r.ok){
      const ne = j.node_errors ? Object.values(j.node_errors).map(n => n.errors.map(e => e.message+(e.details ? ': '+e.details : '')).join('; ')).join(' | ') : '';
      throw new Error((j.error && j.error.message || A.t('err_workflow')) + (ne ? ' - '+ne : ''));
    }
    const id = j.prompt_id, t0 = Date.now();
    onStage('gen');
    for(;;){
      await A.sleep(1200);
      onTick && onTick(Math.round((Date.now()-t0)/1000));
      const h = await (await fetch(S.base()+'/history/'+id, {headers:S.hdr()})).json();
      const e = h[id];
      if(!e) continue;
      if(e.status && e.status.status_str === 'error') throw new Error(A.t('err_exec'));
      if(e.outputs && Object.keys(e.outputs).length){
        let imgs = (e.outputs[NODE.save] || {}).images;
        if(!imgs) for(const o of Object.values(e.outputs)){ if(o.images && o.images.some(i => i.type === 'output')){ imgs = o.images.filter(i => i.type === 'output'); break; } }
        if(!imgs || !imgs.length) throw new Error(A.t('err_no_result'));
        const i = imgs[0];
        const url = S.base()+'/view?filename='+encodeURIComponent(i.filename)+'&subfolder='+encodeURIComponent(i.subfolder || '')+'&type='+i.type;
        return {blob: await (await fetch(url, {headers:S.hdr()})).blob(), name: i.filename};
      }
    }
  }
  A.api = {upload, runEdit, build};
})(window.AI);
