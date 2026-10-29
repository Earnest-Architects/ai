/* fx-shader.js — 生成中の背景演出(WebGL)。進捗に応じて光が画面全体へ広がる。
   使えない環境では false を返し、CSSの代替表示に切り替わる */
(function(A){
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uR; uniform float uT; uniform float uP;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uR)/min(uR.x,uR.y);
  float t=uT*.09;
  vec2 q=vec2(fbm(uv*1.5+t),fbm(uv*1.5+vec2(5.2,1.3)-t));
  vec2 r=vec2(fbm(uv*1.5+3.*q+vec2(1.7,9.2)+t*1.4),fbm(uv*1.5+3.*q+vec2(8.3,2.8)-t*1.1));
  float f=fbm(uv*1.3+3.2*r);
  float d=length(uv*vec2(.85,1.));
  float rad=.32+uP*1.25;
  float reach=1.-smoothstep(rad-.30,rad,d);
  float hole=smoothstep(.16,.36,d);
  float ln=pow(.5+.5*sin(f*34.+uT*.55),12.);
  float glow=smoothstep(.35,.9,f);
  vec3 aqua=vec3(.49,.91,.82),peri=vec3(.56,.71,1.),warm=vec3(1.,.84,.62);
  vec3 c=mix(aqua,peri,clamp(q.x*1.4,0.,1.));
  c=mix(c,warm,smoothstep(.55,.95,r.y)*.55);
  float a=(ln*.75+glow*.38)*reach*mix(.55,1.,hole);
  a+=exp(-d*2.6)*.10*(1.-uP*.4);
  a=clamp(a*(.85+.25*uP),0.,1.);
  gl_FragColor=vec4(c*a,a);
}`;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cv, gl, pr, U = {}, raf = 0, run = false, t0 = 0, P = 0, target = 0, ready = false;

  function compile(type, src){
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function init(){
    if(ready) return true;
    try{
      cv = A.$('#fx');
      gl = cv.getContext('webgl', {alpha:true, premultipliedAlpha:true, antialias:false, powerPreference:'low-power'});
      if(!gl) return false;
      pr = gl.createProgram();
      gl.attachShader(pr, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, compile(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pr); if(!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
      const l = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 2, gl.FLOAT, false, 0, 0);
      ['uR','uT','uP'].forEach(k => U[k] = gl.getUniformLocation(pr, k));
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; stop(); });
      return (ready = true);
    }catch(e){ return false; }
  }
  function draw(){
    const w = Math.max(2, Math.round(cv.clientWidth*.5)), h = Math.max(2, Math.round(cv.clientHeight*.5));
    if(cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.uR, w, h);
    gl.uniform1f(U.uT, reduce ? 3 : ((performance.now()-t0)/1000) % 1000);
    gl.uniform1f(U.uP, P);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(){
    if(!run) return;
    P += (target - P)*.06; draw(); raf = requestAnimationFrame(frame);
  }
  function stop(){ run = false; cancelAnimationFrame(raf); }
  A.fx = {
    start(){
      if(!init()) return false;
      t0 = performance.now(); P = 0; target = 0; run = true;
      if(reduce) draw(); else raf = requestAnimationFrame(frame);
      return true;
    },
    setProgress(p){ target = p; if(run && reduce){ P = p; draw(); } },
    stop
  };
})(window.AI);
