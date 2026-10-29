/* generate.js — generation orchestrator: red-mark compose -> API -> progress -> compare -> history */
(function(A){
  const $ = A.$;
  // Only when red marks exist, append an extra instruction for Qwen (the visible prompt is unchanged)
  const MARK_HINT = '. Only edit the areas marked in red in image 1. Remove the red marks completely in the result. Keep everything else unchanged.';
  // Qwen 2.1 multi-image prompts address the canvas as <image1>
  const MARK_HINT_MULTI = '. Only edit the areas marked in red in <image1>. Remove the red marks completely in the result. Keep everything else unchanged.';
  A.generate = async () => {
    const btn = $('#go'), prompt = $('#pos').value.trim(), files = A.state.files, refs = files.refs.slice();
    if(!files[1]) return A.setStatus('alert_no_image', true);
    if(!prompt) return A.setStatus('alert_no_prompt', true);
    btn.disabled = true;
    const t0 = Date.now(), orig = files[1]; // orig is always the unmarked original
    A.progress.start();
    try{
      let src1 = orig, send = prompt;
      if(A.paint.hasMarks()){ src1 = await A.paint.compose(); send = prompt.replace(/[\s.。!！]+$/, '') + (refs.length ? MARK_HINT_MULTI : MARK_HINT); }
      A.setStatus('status_uploading');
      const res = await A.api.runEdit({
        img1: src1, refs, prompt: send,
        onStage: k => { A.progress.stage(k); A.setStatus({upload:'status_uploading', queue:'status_queueing', gen:'status_generating'}[k]); },
        onTick: () => A.setStatus('status_generating_secs', false, {s: Math.round((Date.now()-t0)/1000)})
      });
      const dur = Date.now()-t0; A.progress.learn(dur);
      await A.progress.complete();
      const id = Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      A.viewer.showCompare(res.blob, res.name, orig, id);
      A.progress.stop(true);
      A.setStatus('status_done', false, {s: Math.round(dur/1000)});
      A.history.save({id, ts:Date.now(), prompt, name:res.name, result:res.blob, original:orig});
    }catch(err){
      const offline = err.message.includes('Failed to fetch');
      A.setStatus(offline ? 'status_conn_fail' : err.message, true, offline ? {hint: A.server.mixedHint()} : null);
    }finally{ A.progress.stop(); btn.disabled = false; }
  };
})(window.AI);
