/* core.js — 共通ユーティリティとイベントバス。他モジュールはここだけに依存する */
window.AI = window.AI || {};
(function(A){
  A.$ = s => document.querySelector(s);
  A.sleep = ms => new Promise(r => setTimeout(r, ms));
  // ベース画像(1)と参照画像(refs: 最大9枚)の共有状態
  A.state = {files:{1:null, refs:[]}};
  // 小さなイベントバス: viewer ⇄ paint ⇄ history を疎結合にする
  const subs = {};
  A.on = (t, fn) => (subs[t] = subs[t] || []).push(fn);
  A.emit = (t, d) => (subs[t] || []).forEach(fn => fn(d));
  // ステータスは i18n キー (+変数) で保持し、言語切替時に同じ内容を再翻訳する
  let statusState = null;
  A.setStatus = (key, err, vars) => {
    const s = A.$('#status'); if(!s) return;
    if(!key){ statusState = null; s.textContent = ''; s.className = ''; return; }
    statusState = {key, err: !!err, vars: vars || null};
    s.textContent = A.t(key, vars); s.className = err ? 'err' : '';
  };
  A.refreshStatus = () => { if(statusState){ const st = statusState; A.setStatus(st.key, st.err, st.vars); } };
})(window.AI);
