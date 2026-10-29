/* composer.js — 下部の入力カード: 参照画像(最大9枚)・プロンプト欄の自動伸縮・生成ボタン */
(function(A){
  const $ = A.$;
  const pos = $('#pos'), addBox = $('#d2'), input = $('#fref'), list = $('#ref-list'), count = $('#ref-count');
  const MAX = A.MAX_REFS || 9;
  const refs = () => A.state.files.refs;
  let urls = [];

  const status = (key, err, vars) => { if(A.state.files[1]) A.setStatus(key, err, vars); };

  function render(){
    list.innerHTML = '';
    urls.forEach(u => URL.revokeObjectURL(u));
    urls = [];
    refs().forEach((f, i) => {
      const url = URL.createObjectURL(f); urls.push(url);
      const fig = document.createElement('figure'); fig.className = 'ref';
      const img = new Image(); img.src = url; img.alt = '';
      const n = document.createElement('span'); n.className = 'ref-n'; n.textContent = i+1;
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'ref-x';
      x.innerHTML = A.icons.svg('close');
      x.setAttribute('aria-label', A.t('remove_ref', {n: i+1}));
      x.setAttribute('data-tip', A.t('remove_ref', {n: i+1}));
      x.onclick = e => { e.stopPropagation(); removeAt(i); };
      fig.append(img, n, x);
      list.append(fig);
    });
    list.classList.toggle('has', refs().length > 0);
    count.textContent = refs().length + '/' + MAX;
    const full = refs().length >= MAX;
    addBox.classList.toggle('full', full);
    addBox.setAttribute('aria-disabled', full ? 'true' : 'false');
    const tip = A.t(full ? 'refs_full' : 'add_refs', {max: MAX});
    addBox.setAttribute('data-tip', tip);
    addBox.setAttribute('aria-label', tip);
    A.emit('refs:change', refs());
  }

  function removeAt(i){
    refs().splice(i, 1);
    render();
    status('status_refs', false, {n: refs().length, max: MAX});
  }

  function add(files){
    const picked = [...(files || [])].filter(f => f && f.type.startsWith('image/'));
    if(!picked.length) return;
    const room = MAX - refs().length;
    if(room <= 0){ A.setStatus('alert_refs_max', true, {max: MAX}); return; }
    refs().push(...picked.slice(0, room));
    render();
    if(picked.length > room) A.setStatus('alert_refs_max', true, {max: MAX});
    else status('status_refs', false, {n: refs().length, max: MAX});
  }

  function openPicker(){
    if(refs().length >= MAX){ A.setStatus('alert_refs_max', true, {max: MAX}); return; }
    input.click();
  }

  addBox.onclick = openPicker;
  addBox.onkeydown = e => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openPicker(); } };
  input.onchange = () => { add(input.files); input.value = ''; };

  [addBox, list].forEach(el => {
    el.addEventListener('dragover', e => { e.preventDefault(); e.stopPropagation(); el.classList.add('over'); });
    el.addEventListener('dragleave', e => { e.stopPropagation(); el.classList.remove('over'); });
    el.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); el.classList.remove('over'); add(e.dataTransfer.files); });
  });
  // Dropping anywhere on the composer adds references (and never navigates to the file)
  const composer = $('.composer');
  composer.addEventListener('dragover', e => { if(e.dataTransfer && [...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
  composer.addEventListener('drop', e => {
    const f = e.dataTransfer && e.dataTransfer.files;
    if(!f || !f.length) return;
    e.preventDefault(); e.stopPropagation();
    add(f);
  });

  A.on('lang:change', render);
  render();

  const grow = () => { pos.style.height = 'auto'; pos.style.height = Math.min(pos.scrollHeight, innerHeight*.3)+'px'; };
  pos.addEventListener('input', grow);
  pos.addEventListener('keydown', e => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)){ e.preventDefault(); A.generate(); } });
  $('#go').onclick = () => A.generate();
})(window.AI);
