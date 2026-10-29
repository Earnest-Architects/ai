/* main.js — 起動処理(全モジュール読み込み後に実行) */
(function(A){
  A.icons.apply();
  A.viewer.layout();
  A.history.load();
})(window.AI);
