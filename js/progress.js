/* progress.js — 生成中のUI(リング・%・段階表示)。%はブラウザ側の推定値(WebSocketなし) */
(function(A){
  const $ = A.$, KEY = 'ai_gen_ms', C = 326.73;
  let timer = null, t0 = 0, exp = 120000, pMax = 0, phase = 'upload', subI = -1, hideT = null, fading = false;
  const SUBS = [[25,'sub_reading'],[55,'sub_light'],[80,'sub_texture'],[101,'sub_finish']];
  const prog = $('#prog');

  const expected = () => { const v = parseFloat(localStorage.getItem(KEY)); return (v > 5000 && v < 1800000) ? v : 120000; };
  // 90%まで線形 → 以降は95%に漸近(完了前に95%を超えない)
  const curve = x => Math.min(94.9, x <= 1 ? 90*x : 90 + 5*(1-Math.exp(-(x-1)*1.5)));
  function draw(p){
    p = Math.round(p);
    $('#pct b').textContent = p; $('#ringbox').setAttribute('aria-valuenow', p);
    $('#ring').style.strokeDashoffset = C*(1-p/100);
    const a = p/100*Math.PI*2; $('#tip').setAttribute('cx', 60+52*Math.cos(a)); $('#tip').setAttribute('cy', 60+52*Math.sin(a)); // svgはCSSで-90°回転済み
    A.fx.setProgress(p/100);
  }
  function setSub(){
    if(phase !== 'gen'){ $('#sub').textContent = ''; subI = -1; return; }
    const i = SUBS.findIndex(s => pMax < s[0]);
    if(i !== subI){ subI = i; const el = $('#sub'); el.textContent = A.t(SUBS[i][1]); el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap'); }
  }
  function tick(){
    const ms = Date.now()-t0, x = ms/exp;
    pMax = Math.max(pMax, curve(x)); draw(pMax); setSub();
    prog.classList.toggle('slow', x > 1);
    const s = Math.floor(ms/1000); $('#el').textContent = A.t('elapsed', {time: Math.floor(s/60)+':'+String(s%60).padStart(2,'0')});
  }
  function cleanup(){
    clearInterval(timer); timer = null; clearTimeout(hideT); fading = false;
    prog.classList.remove('show','slow','done','nogl'); A.fx.stop();
  }
  A.progress = {
    start(){
      cleanup(); t0 = Date.now(); pMax = 0; exp = expected(); phase = 'upload'; subI = -1;
      prog.classList.add('show');
      if(!A.fx.start()) prog.classList.add('nogl');
      this.stage('upload'); tick(); timer = setInterval(tick, 200);
    },
    stage(k){ phase = k; $('#stage').textContent = A.t('stage_'+k); setSub(); },
    // 完了: 100%にして約400ms見せる
    async complete(){ clearInterval(timer); timer = null; pMax = 100; draw(100); this.stage('done'); prog.classList.remove('slow'); await A.sleep(400); },
    stop(fade){
      if(fade && prog.classList.contains('show')){ fading = true; prog.classList.add('done'); hideT = setTimeout(cleanup, 420); return; }
      if(!fading) cleanup();
    },
    // 成功した生成の所要時間を移動平均で保存
    learn(ms){
      const old = parseFloat(localStorage.getItem(KEY));
      try{ localStorage.setItem(KEY, String(Math.round((old > 5000 && old < 1800000) ? old*.6 + ms*.4 : ms))); }catch(e){}
    }
  };
  A.on('lang:change', () => {
    if(!prog.classList.contains('show')) return;
    $('#stage').textContent = A.t('stage_'+phase);
    subI = -1; setSub();
  });
})(window.AI);
