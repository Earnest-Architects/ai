/* paint.js — 赤ペン(編集範囲のマーク)。内部解像度は元画像と同じ。ストローク配列を再描画するのでundo/リサイズに強い */
(function(A){
  const $ = A.$, paint = $('#paint'), ctx = paint.getContext('2d'), cap = $('#cap'), tools = $('#tools'), markBtn = $('#mark');
  let strokes = [], on = false, wasPanel = false, cur = null, mode = 'draw';
  const probe = document.createElement('canvas'), pc = probe.getContext('2d', {willReadFrequently:true});

  const style = (c, m) => { c.globalCompositeOperation = m === 'erase' ? 'destination-out' : 'source-over'; c.strokeStyle = c.fillStyle = '#ff0000'; c.lineCap = c.lineJoin = 'round'; };
  function dot(s, p){ style(ctx, s.mode); ctx.beginPath(); ctx.arc(p[0], p[1], s.size/2, 0, Math.PI*2); ctx.fill(); }
  function seg(s, a, b){ style(ctx, s.mode); ctx.lineWidth = s.size; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
  function redraw(){
    ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, paint.width, paint.height);
    for(const s of strokes){
      if(s.pts.length === 1){ dot(s, s.pts[0]); continue; }
      style(ctx, s.mode); ctx.lineWidth = s.size; ctx.beginPath(); ctx.moveTo(s.pts[0][0], s.pts[0][1]);
      for(let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0], s.pts[i][1]);
      ctx.stroke();
    }
  }
  // 縮小して不透明画素があるか確認(消しゴムで全部消した場合も正しく判定)
  function hasMarks(){
    if(!paint.width || !strokes.some(s => s.mode === 'draw')) return false;
    const k = Math.min(1, 256/Math.max(paint.width, paint.height));
    const w = Math.max(1, Math.round(paint.width*k)), h = Math.max(1, Math.round(paint.height*k));
    probe.width = w; probe.height = h; pc.imageSmoothingQuality = 'high'; pc.drawImage(paint, 0, 0, w, h);
    const d = pc.getImageData(0, 0, w, h).data;
    for(let i = 3; i < d.length; i += 4) if(d[i] > 0) return true;
    return false;
  }
  function upd(){
    $('#markinfo').style.display = hasMarks() ? 'flex' : 'none';
    $('#tUndo').disabled = $('#tClr').disabled = !strokes.length;
  }
  function sync(){
    paint.style.display = (cap.style.display === 'block' && !A.viewer.isCompare()) ? 'block' : 'none';
    markBtn.hidden = !(cap.src && !A.viewer.isCompare());
  }
  function setOn(v){
    if(v && (!cap.naturalWidth || A.viewer.isCompare())) return;
    if(v === on) return;
    on = v; paint.classList.toggle('on', v); tools.classList.toggle('show', v); markBtn.setAttribute('aria-pressed', v);
    // 描画中は入力パネルを退避して画像全体を見えるようにし、終了時に戻す
    if(v){ wasPanel = A.viewer.panelVisible(); A.viewer.setPanel(false); }
    else if(wasPanel){ A.viewer.setPanel(true); wasPanel = false; }
  }
  markBtn.onclick = () => setOn(!on);
  $('#tDone').onclick = () => setOn(false);
  const setTool = m => { mode = m; $('#tPen').setAttribute('aria-pressed', m === 'draw'); $('#tEr').setAttribute('aria-pressed', m === 'erase'); };
  $('#tPen').onclick = () => setTool('draw'); $('#tEr').onclick = () => setTool('erase');
  $('#tUndo').onclick = () => { strokes.pop(); redraw(); upd(); };
  $('#tClr').onclick = () => { strokes = []; redraw(); upd(); };

  const pt = e => { const r = paint.getBoundingClientRect(); return [(e.clientX-r.left)/r.width*paint.width, (e.clientY-r.top)/r.height*paint.height]; };
  paint.addEventListener('pointerdown', e => {
    if(!on || !e.isPrimary || e.button > 0) return;
    e.preventDefault(); paint.setPointerCapture(e.pointerId);
    const k = paint.width/paint.getBoundingClientRect().width, p = pt(e);
    cur = {mode, size:Number($('#tSize').value)*k, pts:[p]}; dot(cur, p);
  });
  paint.addEventListener('pointermove', e => {
    if(!cur || !e.isPrimary) return;
    const p = pt(e); seg(cur, cur.pts[cur.pts.length-1], p); cur.pts.push(p);
  });
  ['pointerup','pointercancel'].forEach(t => paint.addEventListener(t, e => {
    if(!cur || !e.isPrimary) return;
    strokes.push(cur); cur = null; upd();
  }));

  // 元画像 + 赤マークの合成(これを画像1としてアップロードする)
  async function compose(){
    const c = document.createElement('canvas'); c.width = paint.width; c.height = paint.height;
    const x = c.getContext('2d'); x.drawImage(cap, 0, 0, c.width, c.height); x.drawImage(paint, 0, 0);
    const b = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.95));
    if(!b) throw new Error(A.t('err_mark'));
    return new File([b], 'marked.jpg', {type:'image/jpeg'});
  }

  A.on('fit', b => Object.assign(paint.style, {width:b.w+'px', height:b.h+'px', left:b.l+'px', top:b.t+'px'}));
  A.on('img1:load', () => { paint.width = cap.naturalWidth; paint.height = cap.naturalHeight; strokes = []; redraw(); upd(); });
  A.on('img1:set', () => { strokes = []; redraw(); upd(); sync(); });
  A.on('compare:show', () => { setOn(false); markBtn.hidden = true; paint.style.display = 'none'; });
  A.on('compare:hide', sync);
  A.paint = {hasMarks, compose, isOn: () => on};
})(window.AI);
