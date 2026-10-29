/* settings.js — server connection settings (closed by default). Address normalization + connection test */
(function(A){
  const $ = A.$, baseEl = $('#base'), keyEl = $('#key'), set = $('#set'), gear = $('#gear');
  baseEl.value = localStorage.getItem('comfy_base2') || '';
  keyEl.value = localStorage.getItem('comfy_key') || '';
  if(!baseEl.value) baseEl.value = 'https://rinaldi18.sardine-lenok.ts.net'; // default (Tailscale)
  // Scheme may be omitted (*.ts.net -> https, 100.x / LAN -> http)
  function norm(v){
    v = v.trim().replace(/\/+$/, '');
    if(v && !/^https?:\/\//i.test(v)) v = (/^(localhost|127\.|10\.|192\.168\.|100\.\d+\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(v) ? 'http://' : 'https://') + v;
    return v;
  }
  const base = () => norm(baseEl.value);
  const hdr = (h = {}) => keyEl.value ? {...h, 'X-Access-Key': keyEl.value} : h;
  baseEl.onchange = () => { baseEl.value = norm(baseEl.value); localStorage.setItem('comfy_base2', baseEl.value); };
  keyEl.onchange = () => localStorage.setItem('comfy_key', keyEl.value);
  function mixedHint(){
    const b = base();
    if(location.protocol === 'https:' && /^http:\/\//i.test(b) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(b))
      return A.t('conn_mixed');
    return '';
  }
  function open(on){ set.classList.toggle('open', on); gear.setAttribute('aria-pressed', on); }
  gear.onclick = () => open(!set.classList.contains('open'));
  // Close when clicking outside
  document.addEventListener('pointerdown', e => {
    if(set.classList.contains('open') && !set.contains(e.target) && !gear.contains(e.target)) open(false);
  });
  $('#test').onclick = async () => {
    const c = $('#conn'); c.className = ''; c.textContent = A.t('conn_checking');
    try{
      const r = await fetch(base()+'/system_stats', {headers:hdr()});
      if(r.status === 401) throw new Error(A.t('conn_err_401'));
      if(r.status === 502) throw new Error(A.t('conn_err_502'));
      if(r.status === 429) throw new Error(A.t('conn_err_429'));
      if(!r.ok) throw new Error(A.t('conn_err_status', {status: r.status}));
      const j = await r.json();
      const ver = (j.system && j.system.comfyui_version) || '';
      c.className = 'ok'; c.textContent = A.t('conn_ok', {version: ver ? ' '+ver : ''});
    }catch(e){
      c.className = 'bad';
      const unreachable = e.message.includes('Failed to fetch') || e.name === 'TypeError';
      c.textContent = unreachable
        ? A.t('conn_unreachable', {base: base() || A.t('this_server'), hint: mixedHint()})
        : e.message;
    }
  };
  A.server = {base, hdr, mixedHint, open};
})(window.AI);
