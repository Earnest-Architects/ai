/* bridge.js — 別オリジンの360ツアーから送られた画面キャプチャを受け取る。
   ツアー側は window.open でこのページを開き、postMessage でハンドシェイクする。
   opener が無い場合(直接アクセス)は何もせず、通常のアップロード画面のまま動く。 */
(function(A){
  const opener = window.opener;
  if(!opener || opener === window) return;

  // opener のオリジンは referrer から取る。no-referrer の場合は ?from= にフォールバック
  let openerOrigin = '';
  try{ if(document.referrer) openerOrigin = new URL(document.referrer).origin; }catch(e){}
  if(!openerOrigin){
    const from = new URLSearchParams(location.search).get('from');
    if(from){ try{ openerOrigin = new URL(from).origin; }catch(e){} }
  }
  if(!openerOrigin || openerOrigin === 'null') return;

  const post = (type, extra) => {
    try{ opener.postMessage(Object.assign({type, version: 1}, extra), openerOrigin); }catch(e){}
  };
  const safeName = s => String(s || '').replace(/[^\w\u3000-\u30ff\u4e00-\u9fff-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);

  async function receive(d){
    const src = d.dataUrl || d.image;
    if(typeof src !== 'string' || !/^(data:image\/|blob:)/.test(src)) throw new Error('invalid image payload');
    const blob = await (await fetch(src)).blob();
    if(!blob.type.startsWith('image/')) throw new Error('payload is not an image');
    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const file = new File([blob], (safeName(d.scene) || 'capture360') + '.' + ext, {type: blob.type});
    A.viewer.setImg1(file);
    A.viewer.setPanel(true);
    A.setStatus('bridge_loaded', false, {scene: d.scene ? '「' + d.scene + '」' : ''});
  }

  addEventListener('message', async e => {
    if(e.source !== opener || e.origin !== openerOrigin) return;
    const d = e.data || {};
    if(d.type !== 'ai-capture') return;
    try{ await receive(d); post('enhancer-ack'); }
    catch(err){
      console.error('Bridge receive failed:', err);
      A.setStatus('bridge_error', true);
      post('enhancer-nack');
    }
  });

  // オープナー側のリスナー登録が遅れても取りこぼさないよう、ready を2回送る
  post('enhancer-ready');
  setTimeout(() => post('enhancer-ready'), 400);
})(window.AI);
