/* viewer.js — ステージ表示: 画像1・比較スライダー・入力パネルの開閉・レイアウト寸法(CSS変数)
   発火イベント: img1:set / img1:load / fit / compare:show / compare:hide */
(function(A){
  const $ = A.$, hero = $('#hero'), cap = $('#cap'), cmp = $('#cmp'), cmpA = $('#cmpA'), cmpB = $('#cmpB');
  const panel = $('.composer'), topbar = $('.top'), acts = $('#acts'), knob = $('#knob');
  let cmpUrls = [], cur = null;
  $('#chg').hidden = true;

  const boxOf = im => {
    const W = hero.clientWidth, H = hero.clientHeight, r = im.naturalWidth/im.naturalHeight;
    let w = W, h = W/r; if(h > H){ h = H; w = H*r; }
    return {w, h, l:(W-w)/2, t:(H-h)/2};
  };
  const place = (el, b) => Object.assign(el.style, {width:b.w+'px', height:b.h+'px', left:b.l+'px', top:b.t+'px'});
  // 画像の表示領域に合わせる(スライダー・赤ペンcanvasが同じ矩形になる)
  function fit(){
    if(cap.naturalWidth) A.emit('fit', boxOf(cap));
    const ref = (cmpA.complete && cmpA.naturalWidth) ? cmpA : (cap.naturalWidth ? cap : null);
    if(ref) place(cmp, boxOf(ref));
  }
  // --panel-h(入力パネルが占める高さ) / --top-h(上バーの高さ) を更新
  function layout(){
    const hid = panel.classList.contains('hide');
    hero.style.setProperty('--panel-h', hid ? '0px' : Math.max(0, hero.getBoundingClientRect().bottom - panel.getBoundingClientRect().top)+'px');
    hero.style.setProperty('--top-h', Math.max(56, topbar.offsetHeight)+'px');
    hero.classList.toggle('nopanel', hid);
    $('#pnl').setAttribute('aria-pressed', !hid);
  }
  const panelVisible = () => !panel.classList.contains('hide');
  function setPanel(show){ panel.classList.toggle('hide', !show); layout(); }

  cmpA.onload = fit;
  cap.onload = () => { fit(); A.emit('img1:load', cap); };
  addEventListener('resize', () => { fit(); layout(); });
  new ResizeObserver(layout).observe(panel); new ResizeObserver(layout).observe(topbar);
  $('#pnl').onclick = () => setPanel(!panelVisible());

  // 画像1(アップロードされた元画像)
  function setImg1(f){
    if(!f){ return; }
    if(!f.type.startsWith('image/')){ A.setStatus('file_not_image', true); return; }
    hideCompare();
    A.state.files[1] = f;
    const old = cap.src;
    cap.src = URL.createObjectURL(f); cap.style.display = 'block';
    if(old && old.startsWith('blob:')) URL.revokeObjectURL(old);
    $('#capEmpty').style.display = 'none';
    $('#chg').hidden = false;
    A.setStatus('status_loaded');
    A.emit('img1:set', f);
  }
  $('#chg').onclick = () => $('#f1').click();
  $('#upload-card').onclick = () => $('#f1').click();
  $('#f1').onchange = e => { setImg1(e.target.files[0]); e.target.value = ''; };

  // ステージへのドラッグ＆ドロップ(画像2のドロップ領域は composer.js が処理)
  let dragDepth = 0;
  const hasFiles = e => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
  hero.addEventListener('dragenter', e => { if(!hasFiles(e)) return; e.preventDefault(); dragDepth++; hero.classList.add('drag'); });
  hero.addEventListener('dragover', e => { if(!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  hero.addEventListener('dragleave', () => { dragDepth = Math.max(0, dragDepth - 1); if(!dragDepth) hero.classList.remove('drag'); });
  hero.addEventListener('drop', e => {
    if(e.target.closest('.composer')) return;
    e.preventDefault(); dragDepth = 0; hero.classList.remove('drag');
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if(f) setImg1(f);
  });

  // 比較スライダー
  function setPos(p){ p = Math.max(0, Math.min(100, p)); cmp.style.setProperty('--pos', p+'%'); knob.setAttribute('aria-valuenow', Math.round(p)); }
  let drag = false;
  const posFrom = e => { const r = cmp.getBoundingClientRect(); setPos((e.clientX-r.left)/r.width*100); };
  cmp.addEventListener('pointerdown', e => { drag = true; cmp.setPointerCapture(e.pointerId); posFrom(e); });
  cmp.addEventListener('pointermove', e => { if(drag) posFrom(e); });
  ['pointerup','pointercancel'].forEach(t => cmp.addEventListener(t, () => { drag = false; }));
  knob.addEventListener('keydown', e => {
    const c = parseFloat(cmp.style.getPropertyValue('--pos')) || 50;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); setPos(c-3); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); setPos(c+3); }
  });

  // res/orig は Blob。id は履歴の識別子(任意)
  function showCompare(res, name, orig, id){
    A.emit('compare:show', {id: id || null});
    cmpUrls.forEach(u => URL.revokeObjectURL(u));
    const ur = URL.createObjectURL(res), uo = URL.createObjectURL(orig);
    cmpUrls = [ur, uo]; cur = {blob:res, name, id:id || null};
    cmpA.src = uo; cmpB.src = ur;
    fit(); setPos(50);
    cmp.style.display = 'block'; cap.style.display = 'none';
    $('#capEmpty').style.display = 'none';
    $('#dl').href = ur; $('#dl').download = name; acts.classList.add('show');
    $('#closecmp').hidden = false;
    setPanel(false);
  }
  function hideCompare(){
    cmp.style.display = 'none'; acts.classList.remove('show'); $('#closecmp').hidden = true;
    if(cap.src) cap.style.display = 'block';
    $('#capEmpty').style.display = cap.src ? 'none' : 'grid';
    A.emit('compare:hide');
  }
  $('#closecmp').onclick = hideCompare;
  // この結果を画像1にする → 入力パネルを再表示
  $('#use').onclick = () => {
    if(!cur) return;
    const b = cur.blob;
    setImg1(new File([b], cur.name || 'result.png', {type:b.type || 'image/png'}));
    setPanel(true); A.setStatus('');
  };

  A.viewer = {setImg1, showCompare, hideCompare, fit, layout, setPanel, panelVisible, isCompare: () => cmp.style.display === 'block'};
})(window.AI);
