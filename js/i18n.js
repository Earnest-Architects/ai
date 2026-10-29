/* i18n.js — 日本語(既定)/English の切り替え。ヘッダーの言語ボタンと localStorage で保持。
   使い方: A.t('キー', {var:値}) / A.setLang('ja'|'en') / A.toggleLang()
   静的なDOMは data-i18n / data-i18n-aria / data-i18n-tip / data-i18n-ph / data-i18n-alt で自動翻訳。 */
(function(A){
  const DICT = {
    ja: {
      doc_title: 'AIレンダリング — API System Enhancer',
      brand_title: 'API System Enhancer',
      brand_sub: 'Architecture Presentation Integrated System Enhancer',
      upload_cta: '画像を選択',
      upload_hint: 'またはドラッグ＆ドロップ — JPG / PNG / WebP',
      drop_overlay: 'ここにドロップして画像を読み込む',
      tools_aria: 'ツール',
      close_compare: '比較を閉じる',
      change_image: '画像を変更',
      mark: '赤ペンでマーク',
      history: '履歴',
      panel: '入力パネル',
      settings: '接続設定',
      lang_to_en: 'Switch to English',
      lang_to_ja: '日本語に切り替え',
      settings_title: 'サーバー接続',
      server_addr_aria: 'サーバーのアドレス',
      access_key_aria: 'アクセスキー',
      access_key_ph: 'アクセスキー(設定時のみ)',
      test_connection: '接続テスト',
      mark_tools_aria: 'マークツール',
      pen: '赤ペン',
      eraser: '消しゴム',
      pen_size: 'ペンの太さ',
      undo: '元に戻す',
      clear_all: '全消去',
      done: '完了',
      history_clear_all: '履歴をすべて削除',
      history_empty: '履歴なし',
      use_result: 'この結果を画像1にする',
      download: 'ダウンロード',
      composer_aria: 'プロンプト入力',
      markinfo: '赤マークあり — マーク部分のみ編集します',
      refs_aria: '参照画像',
      add_refs: '参照画像を追加 (最大{max}枚)',
      refs_full: '参照画像は上限です ({max}枚)',
      remove_ref: '参照画像 {n} を削除',
      status_refs: '参照画像 {n}/{max} 枚',
      prompt_aria: 'プロンプト',
      prompt_ph: 'どう変えますか? 例: 画像2のチェアを画像1の部屋に置く',
      generate: '生成する',
      generate_tip: '生成する (Ctrl+Enter)',
      progress_aria: '生成の進捗(目安)',
      paint_canvas: '赤ペンのマーク',
      compare_aria: '元画像と生成結果の比較',
      compare_original: '元画像',
      compare_result: '生成結果',
      compare_slider: '比較スライダー',

      file_not_image: '画像ファイルを選択してください。',
      alert_no_image: '画像がありません。アップロードボタンから画像を選択してください。',
      alert_no_prompt: 'プロンプトを入力してください。',
      alert_refs_max: '参照画像は最大 {max} 枚までです。',
      status_loaded: '画像を読み込みました。変更内容を入力してください。',
      bridge_loaded: '360ビュー{scene}を受け取りました。変更内容を入力してください。',
      bridge_error: '受け取った画像を読み込めませんでした。もう一度送ってください。',
      status_uploading: '画像をアップロード中…',
      status_queueing: 'ComfyUIに送信中…',
      status_generating: '生成中…',
      status_generating_secs: '生成中… {s} 秒',
      status_done: '{s} 秒で完了しました。',
      status_conn_fail: 'PCに接続できません。{hint} 右上の設定アイコンから接続テストを行ってください。',
      err_hist_quota: '履歴を保存できませんでした(容量不足)。生成結果は表示されています。',

      stage_upload: 'アップロード中…',
      stage_queue: 'キューに送信中…',
      stage_gen: '生成中…',
      stage_done: '完了',
      sub_reading: '構図と素材を読み取っています',
      sub_light: '光と影のバランスを整えています',
      sub_texture: '質感とディテールを描き込んでいます',
      sub_finish: '仕上げています',
      elapsed: '経過 {time}',

      conn_checking: '確認中…',
      conn_ok: 'ComfyUI{version} に接続しました。',
      conn_err_401: 'server.pyにPASSWORDが設定されています。同じキーを「アクセスキー」に入力してください。',
      conn_err_502: 'server.pyは動いていますが、ComfyUIに接続できません。ComfyUIを起動し、start.batのCOMFYのポート(Desktop=8000 / Portable=8188)を確認してください。',
      conn_err_429: 'キーの誤入力が多すぎます。数分待ってください。',
      conn_err_status: 'サーバー応答: {status}',
      conn_mixed: ' このページはHTTPSのため、他のPCへのhttp://アドレスはブロックされます。https(例: Tailscale Serve)を使ってください。',
      conn_unreachable: '{base} に接続できません。{hint} server.pyが動いているか、アドレスを確認してください。',
      this_server: 'このサーバー',

      err_access_key: 'アクセスキーが違います。',
      err_upload: '画像のアップロードに失敗しました ({status})',
      err_workflow: 'ワークフローが拒否されました',
      err_exec: 'ComfyUIで実行エラーが発生しました。ログを確認してください。',
      err_no_result: '完了しましたが、結果画像がありません。',
      err_mark: 'マーク付き画像の作成に失敗しました。',

      history_open_aria: '履歴を開く: {prompt}',
      history_del_aria: 'この履歴を削除',
      history_confirm_clear: '履歴をすべて削除しますか?'
    },
    en: {
      doc_title: 'AI Rendering — API System Enhancer',
      brand_title: 'API System Enhancer',
      brand_sub: 'Architecture Presentation Integrated System Enhancer',
      upload_cta: 'Choose image',
      upload_hint: 'or drag & drop — JPG / PNG / WebP',
      drop_overlay: 'Drop an image to load it',
      tools_aria: 'Tools',
      close_compare: 'Close comparison',
      change_image: 'Change image',
      mark: 'Mark with red pen',
      history: 'History',
      panel: 'Input panel',
      settings: 'Connection settings',
      lang_to_en: 'Switch to English',
      lang_to_ja: 'Switch to Japanese',
      settings_title: 'Server connection',
      server_addr_aria: 'Server address',
      access_key_aria: 'Access key',
      access_key_ph: 'Access key (only if configured)',
      test_connection: 'Test connection',
      mark_tools_aria: 'Mark tools',
      pen: 'Red pen',
      eraser: 'Eraser',
      pen_size: 'Pen size',
      undo: 'Undo',
      clear_all: 'Clear all',
      done: 'Done',
      history_clear_all: 'Delete all history',
      history_empty: 'No history',
      use_result: 'Use result as image 1',
      download: 'Download',
      composer_aria: 'Prompt input',
      markinfo: 'Red marks detected — only marked areas will be edited',
      refs_aria: 'Reference images',
      add_refs: 'Add reference image (max {max})',
      refs_full: 'Reference limit reached ({max})',
      remove_ref: 'Remove reference image {n}',
      status_refs: 'Reference images {n}/{max}',
      prompt_aria: 'Prompt',
      prompt_ph: 'Describe the change — e.g. place the chair from image 2 into image 1',
      generate: 'Generate',
      generate_tip: 'Generate (Ctrl+Enter)',
      progress_aria: 'Generation progress (estimated)',
      paint_canvas: 'Red pen marks',
      compare_aria: 'Original and generated image comparison',
      compare_original: 'Original',
      compare_result: 'Result',
      compare_slider: 'Comparison slider',

      file_not_image: 'Please choose an image file.',
      alert_no_image: 'No image yet. Choose an image from the upload button.',
      alert_no_prompt: 'Please enter a prompt.',
      alert_refs_max: 'Up to {max} reference images.',
      status_loaded: 'Image loaded. Describe the change you want.',
      bridge_loaded: 'Received the 360° view{scene}. Describe the change you want.',
      bridge_error: 'Could not load the received image. Please send it again.',
      status_uploading: 'Uploading image…',
      status_queueing: 'Sending to ComfyUI…',
      status_generating: 'Generating…',
      status_generating_secs: 'Generating… {s}s',
      status_done: 'Done in {s}s.',
      status_conn_fail: 'Cannot reach the PC. {hint} Run a connection test from the settings icon in the top right.',
      err_hist_quota: 'Could not save history (storage full). The result is still shown.',

      stage_upload: 'Uploading…',
      stage_queue: 'Sending to queue…',
      stage_gen: 'Generating…',
      stage_done: 'Done',
      sub_reading: 'Reading composition and materials',
      sub_light: 'Balancing light and shadow',
      sub_texture: 'Rendering texture and detail',
      sub_finish: 'Finishing up',
      elapsed: 'Elapsed {time}',

      conn_checking: 'Checking…',
      conn_ok: 'Connected to ComfyUI{version}.',
      conn_err_401: 'server.py has a PASSWORD set. Enter the same key in “Access key”.',
      conn_err_502: 'server.py is running but cannot reach ComfyUI. Start ComfyUI and check the COMFY port in start.bat (Desktop=8000 / Portable=8188).',
      conn_err_429: 'Too many failed key attempts. Wait a few minutes.',
      conn_err_status: 'Server response: {status}',
      conn_mixed: ' This page is served over HTTPS, so http:// addresses to other PCs are blocked. Use https (e.g. Tailscale Serve).',
      conn_unreachable: 'Cannot connect to {base}.{hint} Check that server.py is running and the address is correct.',
      this_server: 'this server',

      err_access_key: 'Incorrect access key.',
      err_upload: 'Failed to upload the image ({status})',
      err_workflow: 'The workflow was rejected',
      err_exec: 'ComfyUI reported an execution error. Check the logs.',
      err_no_result: 'Finished, but no result image was returned.',
      err_mark: 'Failed to create the marked image.',

      history_open_aria: 'Open history item: {prompt}',
      history_del_aria: 'Delete this history item',
      history_confirm_clear: 'Delete all history?'
    }
  };

  const KEY = 'ase_lang';
  let lang = 'ja';
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'en' || q === 'ja') lang = q;
    else {
      const saved = localStorage.getItem(KEY);
      if (saved === 'en' || saved === 'ja') lang = saved;
    }
  } catch (e) {}

  const fmt = (str, vars) => {
    if (!vars) return str;
    for (const k in vars) str = str.split('{' + k + '}').join(String(vars[k]));
    return str;
  };

  A.t = (key, vars) => {
    if (!key) return '';
    const table = DICT[lang] || DICT.ja;
    return fmt(table[key] || DICT.ja[key] || key, vars);
  };
  A.getLang = () => lang;

  function applyStatic(){
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = A.t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', A.t(el.dataset.i18nAria)); });
    document.querySelectorAll('[data-i18n-tip]').forEach(el => { el.setAttribute('data-tip', A.t(el.dataset.i18nTip)); });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.setAttribute('placeholder', A.t(el.dataset.i18nPh)); });
    document.querySelectorAll('[data-i18n-alt]').forEach(el => { el.setAttribute('alt', A.t(el.dataset.i18nAlt)); });
    document.documentElement.lang = lang;
    document.title = A.t('doc_title');

    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'ja' ? 'EN' : 'JA';
    const btn = document.getElementById('lang');
    if (btn) {
      const tip = A.t(lang === 'ja' ? 'lang_to_en' : 'lang_to_ja');
      btn.setAttribute('aria-label', tip);
      btn.setAttribute('data-tip', tip);
    }
  }

  A.setLang = next => {
    lang = next === 'en' ? 'en' : 'ja';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    applyStatic();
    A.emit && A.emit('lang:change', lang);
    A.refreshStatus && A.refreshStatus();
  };
  A.toggleLang = () => A.setLang(lang === 'ja' ? 'en' : 'ja');

  document.addEventListener('DOMContentLoaded', () => {
    applyStatic();
    const btn = document.getElementById('lang');
    if (btn) btn.addEventListener('click', () => A.toggleLang());
  });
})(window.AI);
