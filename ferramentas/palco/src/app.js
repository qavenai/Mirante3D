
(async function(){
'use strict';
THREE.ColorManagement.legacyMode=false;
const V3=THREE.Vector3;
const isTouch=matchMedia('(pointer:coarse)').matches;
const QS=new URLSearchParams(location.search);const lowGPU=isTouch||QS.has('leve');const SEM_NUV=QS.get('nuv')==='0';
try{await Promise.race([Promise.all([document.fonts.load('64px Gloock'),document.fonts.load('600 32px "IBM Plex Mono"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}

/* ================= RENDERER ================= */
const stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({antialias:!lowGPU,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,lowGPU?1.5:2));
renderer.setSize(stage.clientWidth,stage.clientHeight);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.3;
stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();
scene.background=new THREE.Color('#07080c');
scene.fog=new THREE.FogExp2('#0a0b10',0.0085);
const camera=new THREE.PerspectiveCamera(45,stage.clientWidth/stage.clientHeight,0.1,900);

/* ================= UTIL ================= */
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=rng(19112026);
const aniso=Math.min(8,renderer.capabilities.getMaxAnisotropy());
function ctex(w,h,fn,srgb){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');fn(x,w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=aniso;if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.userData.canvas=c;t.userData.ctx=x;return t;}
const M=o=>new THREE.MeshStandardMaterial(o);
const B=o=>new THREE.MeshBasicMaterial(o);
function mesh(p,g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);p.add(o);return o;}
function bx(p,m,x0,y0,z0,x1,y1,z1){return mesh(p,new THREE.BoxGeometry(Math.abs(x1-x0),Math.abs(y1-y0),Math.abs(z1-z0)),m,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2);}
function cyl(p,m,x,y0,z,rt,rb,h,s){return mesh(p,new THREE.CylinderGeometry(rt,rb,h,s||16),m,x,y0+h/2,z);}
function inPoly(x,z,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const xi=p[i][0],zi=p[i][1],xj=p[j][0],zj=p[j][1];if(((zi>z)!==(zj>z))&&(x<(xj-xi)*(z-zi)/(zj-zi)+xi))c=!c;}return c;}
function shapeXZ(poly){return new THREE.Shape(poly.map(p=>new THREE.Vector2(p[0],-p[1])));}
function flatShape(poly,mat,y){const g=new THREE.ShapeGeometry(shapeXZ(poly));g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,mat);m.position.y=y||0;return m;}

const GLSL_N3='float gh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}float gn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(gh(i),gh(i+vec3(1,0,0)),f.x),mix(gh(i+vec3(0,1,0)),gh(i+vec3(1,1,0)),f.x),f.y),mix(mix(gh(i+vec3(0,0,1)),gh(i+vec3(1,0,1)),f.x),mix(gh(i+vec3(0,1,1)),gh(i+vec3(1,1,1)),f.x),f.y),f.z);}';
/* ================= TEXTURAS ================= */
const noiseTex=(seed,base,amt,rep)=>{const t=ctex(512,512,(c,w,h)=>{const r=rng(seed);c.fillStyle=base;c.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=r()<.5?0:255;c.fillStyle=`rgba(${v},${v},${v},${r()*amt})`;c.fillRect(r()*w,r()*h,1+r()*3,1+r()*3);}c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=2;for(let i=0;i<=4;i++){c.beginPath();c.moveTo(i*w/4,0);c.lineTo(i*w/4,h);c.stroke();c.beginPath();c.moveTo(0,i*h/4);c.lineTo(w,i*h/4);c.stroke();}});t.repeat.set(rep,rep);return t;};
const texConcreto=noiseTex(3,'#3b3a38',.09,24);
const texPedra=ctex(512,512,(c,w,h)=>{const r=rng(7);c.fillStyle='#4a4743';c.fillRect(0,0,w,h);for(let i=0;i<14000;i++){const v=r()<.5?20:200;c.fillStyle=`rgba(${v},${v-4},${v-10},${r()*.12})`;c.fillRect(r()*w,r()*h,1+r()*4,1+r()*4);}c.strokeStyle='rgba(15,12,10,.6)';for(let i=0;i<26;i++){c.lineWidth=.6+r()*1.6;c.beginPath();let x=r()*w,y=r()*h;c.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-.5)*60;y+=(r()-.5)*60;c.lineTo(x,y);}c.stroke();}for(let y=0;y<h;y+=64){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,y,w,2);}});
const texGlow=ctex(128,128,(c,w,h)=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.55)');g.addColorStop(.5,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);},false);
const texFeixe=ctex(64,256,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.75,'rgba(255,255,255,.22)');g.addColorStop(1,'rgba(255,255,255,.65)');c.fillStyle=g;c.fillRect(0,0,w,h);const g2=c.createLinearGradient(0,0,w,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.5,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,1)');c.globalCompositeOperation='destination-out';c.fillStyle=g2;c.globalAlpha=.6;c.fillRect(0,0,w,h);},false);
const texSeta=ctex(128,128,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='rgba(255,210,122,1)';c.beginPath();c.moveTo(20,96);c.lineTo(64,40);c.lineTo(108,96);c.lineTo(84,96);c.lineTo(64,70);c.lineTo(44,96);c.closePath();c.fill();},false);
const texJanelas=ctex(256,512,(c,w,h)=>{const r=rng(11);c.fillStyle='#0b0d12';c.fillRect(0,0,w,h);for(let y=8;y<h;y+=16)for(let x=6;x<w;x+=14){const on=r();if(on<.38){c.fillStyle=on<.08?'#ffd9a0':on<.2?'#ffefcf':'#cfe2ff';c.globalAlpha=.35+r()*.6;c.fillRect(x,y,9,9);}}c.globalAlpha=1;});
function placa(txt,opt){opt=opt||{};const w=opt.w||512,h=opt.h||128;return ctex(w,h,(c)=>{c.fillStyle=opt.bg||'#111';c.fillRect(0,0,w,h);if(opt.borda){c.strokeStyle=opt.fg||'#F4F1EA';c.lineWidth=6;c.strokeRect(10,10,w-20,h-20);}c.fillStyle=opt.fg||'#F4F1EA';c.font=opt.font||`600 ${Math.round(h*.42)}px "IBM Plex Mono", monospace`;c.textAlign='center';c.textBaseline='middle';const lines=txt.split('\n');lines.forEach((l,i)=>c.fillText(l,w/2,h/2+(i-(lines.length-1)/2)*h*.42));});}

/* nuvens para o telão (fbm) */
const nuvens=(()=>{const W=384,H=192,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');const img=x.createImageData(W,H);const r=rng(5);const G=64,grid=[];for(let i=0;i<(G+1)*(G+1);i++)grid.push(r());
 const v=(u,w)=>{u=((u%G)+G)%G;w=((w%G)+G)%G;const i=Math.floor(u),j=Math.floor(w),fu=u-i,fw=w-j,a=grid[j*(G+1)+i],b=grid[j*(G+1)+i+1],cc=grid[(j+1)*(G+1)+i],d=grid[(j+1)*(G+1)+i+1];const su=fu*fu*(3-2*fu),sw=fw*fw*(3-2*fw);return a+(b-a)*su+(cc-a)*sw+(a-b-cc+d)*su*sw;};
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){let n=0,amp=.55,f=1/22;for(let o=0;o<5;o++){n+=v(i*f,j*f)*amp;amp*=.5;f*=2;}const k=(j*W+i)*4;const t=Math.max(0,Math.min(1,(n-.38)*1.9));img.data[k]=40+t*200;img.data[k+1]=60+t*190;img.data[k+2]=140+t*115;img.data[k+3]=255;}
 x.putImageData(img,0,0);return c;})();

/* ================= MATERIAIS ================= */
const C={
  piso:M({map:texConcreto,color:'#5b5853',roughness:.85}),
  asfalto:M({color:'#121315',roughness:1}),
  preto:M({color:'#0d0d0e',roughness:.7}),
  pretoMet:M({color:'#18191b',roughness:.45,metalness:.6}),
  aluminio:M({color:'#9a9da1',roughness:.35,metalness:.85}),
  pedra:M({map:texPedra,color:'#8c867d',roughness:.95}),
  pedraEsc:M({map:texPedra,color:'#5a554e',roughness:.95}),
  lona:M({color:'#4f4d49',roughness:.95,side:THREE.DoubleSide}),
  lonaLateral:M({color:'#26262a',roughness:1,side:THREE.DoubleSide}),
  vidro:M({color:'#cfe2e6',roughness:.05,transparent:true,opacity:.18,depthWrite:false}),
  madeira:M({color:'#6b4c34',roughness:.6}),
  container:M({color:'#2f4a63',roughness:.6,metalness:.3}),
  containerCinza:M({color:'#5b5f63',roughness:.6,metalness:.3}),
  camarote:M({color:'#3a3a3c',roughness:.8}),
  degrau:M({color:'#2a2a2c',roughness:.8}),
  amarelo:M({color:'#e8c33a',roughness:.6}),
  grade:M({color:'#b7bbbf',roughness:.4,metalness:.8}),
  branco:M({color:'#eeeeea',roughness:.6}),
  lampada:B({color:'#fff1d6'}),
  ledQuente:B({color:'#ffcf8f'}),
  ledFrio:B({color:'#dfe8ff'}),
  verde:B({color:'#22b573'}),
  tela:B({color:'#ffffff'}),
};
/* ================= MEDIDAS DO PALCO (metros; plateia para +z, palco atrás de z=0) ================= */
const H=2.0,YC_PANO=19;                                            // altura do piso do palco
const LEDC={x0:-10,x1:10,y0:2.6,y1:12.6,z:-13.2};        // LED central 20 × 10 m
const ESC={w:6,z0:-2.6,z1:-10,n:16,topo:H+5,zTopo:-12.9};// escadaria: 16 degraus, topo a 5 m do piso
const LAT=[{x:-18.6,ang:.2,lado:-1},{x:18.6,ang:-.2,lado:1}];  // LEDs laterais (retrato)
const LATD={w:6.6,h:10.2,y0:3.4,z:-5};
const PONTO=new V3(0,4.2,32);                           // ponto ideal da ilusão: mesa de som
const TOPO_ART=new V3(0,ESC.topo,-11.2);                // onde o artista fica

/* ================= MATERIAIS ================= */
// arenito: textura gerada aqui e aplicada em coordenadas do mundo (sem esticar em peças de tamanhos diferentes)
const texArenito=ctex(1024,1024,(c,w,h)=>{const r=rng(77);c.fillStyle='#a88d6b';c.fillRect(0,0,w,h);
  for(let i=0;i<60;i++){const x=r()*w,y=r()*h,rr=40+r()*180;const g=c.createRadialGradient(x,y,0,x,y,rr);const v=r()<.5?'60,45,30':'225,205,170';g.addColorStop(0,`rgba(${v},${.08+r()*.12})`);g.addColorStop(1,`rgba(${v},0)`);c.fillStyle=g;c.fillRect(x-rr,y-rr,rr*2,rr*2);}
  for(let i=0;i<60000;i++){const v=r()<.5?40:235;c.fillStyle=`rgba(${v},${v-8},${v-20},${r()*.09})`;c.fillRect(r()*w,r()*h,1+r()*2.5,1+r()*2.5);}
  // juntas dos blocos (aparelho de pedra: fiadas de 25 cm, blocos de 50–110 cm)
  c.strokeStyle='rgba(40,28,18,.55)';c.lineWidth=3;for(let y=0;y<=h;y+=128){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();let x=(y/128%2)*90;while(x<w){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+128);c.stroke();x+=200+r()*250;}}
  // escorridos e lascas
  for(let i=0;i<140;i++){const x=r()*w,y=r()*h,l=20+r()*120;const g=c.createLinearGradient(x,y,x,y+l);g.addColorStop(0,'rgba(50,38,26,.25)');g.addColorStop(1,'rgba(50,38,26,0)');c.fillStyle=g;c.fillRect(x,y,2+r()*5,l);}});
const texArenitoLiso=ctex(512,512,(c,w,h)=>{const r=rng(78);c.fillStyle='#a88d6b';c.fillRect(0,0,w,h);
  for(let i=0;i<40;i++){const x=r()*w,y=r()*h,rr=30+r()*120;const g=c.createRadialGradient(x,y,0,x,y,rr);const v=r()<.5?'60,45,30':'225,205,170';g.addColorStop(0,`rgba(${v},${.1+r()*.12})`);g.addColorStop(1,`rgba(${v},0)`);c.fillStyle=g;c.fillRect(x-rr,y-rr,rr*2,rr*2);}
  for(let i=0;i<26000;i++){const v=r()<.5?40:235;c.fillStyle=`rgba(${v},${v-8},${v-20},${r()*.1})`;c.fillRect(r()*w,r()*h,1+r()*2.5,1+r()*2.5);}});
function triplanar(mat,escala){mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
  .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
  .replace('#include <map_fragment>',`vec3 bw=pow(abs(vWN),vec3(4.));bw/=bw.x+bw.y+bw.z;float E=${escala.toFixed(3)};
    vec4 tx=texture2D(map,vWP.zy*E),ty=texture2D(map,vWP.xz*E),tz=texture2D(map,vWP.xy*E);vec4 texelColor=tx*bw.x+ty*bw.y+tz*bw.z;diffuseColor*=texelColor;`);};
  mat.customProgramCacheKey=()=>'tri'+escala;return mat;}
/* PBR: arenito em blocos (cor, normal, rugosidade+oclusão), mapeado em coordenadas do mundo.
   Uma repetição = 2,5 m × 1,25 m com fiadas de 31,25 cm: as juntas caem na quina de cada degrau e cada patamar tem 4 fiadas. */
const PASTA_TX='texturas/';
function txC(n,srgb){const t=new THREE.TextureLoader().load(PASTA_TX+n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=aniso;if(srgb)t.encoding=THREE.sRGBEncoding;return t;}
const TXA={cor:txC('arenito_cor.jpg',true),nrm:txC('arenito_nrm.jpg'),rao:txC('arenito_rao.jpg')};
function pedraPBR(tint,op){op=op||{};const m=new THREE.MeshStandardMaterial({color:tint,roughness:1,metalness:0,map:TXA.cor,envMapIntensity:.25});m.userData.envFixo=1;
  const U={uNrm:{value:TXA.nrm},uRao:{value:TXA.rao},uNk:{value:op.nk||1.4},uOff:{value:new THREE.Vector2(op.ox||0,op.oy===undefined?H:op.oy)}};
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
      .replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vWP;varying vec3 vWN;uniform sampler2D uNrm,uRao;uniform float uNk;uniform vec2 uOff;vec3 gBW;vec2 gUX,gUY,gUZ;vec4 gRAO;`)
      .replace('#include <map_fragment>',`vec3 wn=normalize(vWN);gBW=pow(abs(wn),vec3(6.));gBW/=gBW.x+gBW.y+gBW.z;vec3 q=vWP-vec3(uOff.x,uOff.y,0.);
        gUX=vec2(q.z/2.5,q.y/1.25);gUY=vec2(q.x/2.5,q.z/1.25+.37);gUZ=vec2(q.x/2.5,q.y/1.25);
        vec4 texelColor=texture2D(map,gUX)*gBW.x+texture2D(map,gUY)*gBW.y+texture2D(map,gUZ)*gBW.z;diffuseColor*=texelColor;
        gRAO=texture2D(uRao,gUX)*gBW.x+texture2D(uRao,gUY)*gBW.y+texture2D(uRao,gUZ)*gBW.z;diffuseColor.rgb*=mix(1.,gRAO.g,.55);`)
      .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=gRAO.r;')
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        {vec3 wn=normalize(vWN);vec3 tX=texture2D(uNrm,gUX).xyz*2.-1.,tY=texture2D(uNrm,gUY).xyz*2.-1.,tZ=texture2D(uNrm,gUZ).xyz*2.-1.;
         tX.xy*=uNk;tY.xy*=uNk;tZ.xy*=uNk;
         vec3 nX=vec3(0.,tX.y,tX.x*sign(wn.x)*-1.)*0.+vec3(wn.x,wn.y+tX.y,wn.z+tX.x);
         vec3 nY=vec3(wn.x+tY.x,wn.y,wn.z+tY.y);
         vec3 nZ=vec3(wn.x+tZ.x,wn.y+tZ.y,wn.z);
         vec3 nw=normalize(nX*gBW.x+nY*gBW.y+nZ*gBW.z);normal=normalize((viewMatrix*vec4(nw,0.)).xyz)*faceDirection;}`);};
  m.customProgramCacheKey=()=>'pedraPBR';return m;}
// piso preto do palco: brilho com marcas de uso e reflexo real (plano espelhado) no computador
const TXP={rug:txC('piso_rug.jpg'),nrm:txC('piso_nrm.jpg'),esc:txC('escovado.jpg')};
TXP.rug.repeat.set(34,12);TXP.nrm.repeat.set(34,12);
const P={
  arenito:pedraPBR('#ffffff'),
  arenitoEsc:pedraPBR('#e4d6c2'),
  piso:new THREE.MeshPhysicalMaterial({color:'#060607',roughness:1,roughnessMap:TXP.rug,normalMap:TXP.nrm,normalScale:new THREE.Vector2(.35,.35),metalness:0,clearcoat:.35,clearcoatRoughness:.22,envMapIntensity:.6}),
  preto:M({color:'#0b0b0c',roughness:.75}),
  pretoMet:M({color:'#151618',roughness:.45,metalness:.6}),
  trelica:new THREE.MeshPhysicalMaterial({color:'#c6c9cd',metalness:1,roughness:1,roughnessMap:TXP.esc,envMapIntensity:1.1,clearcoat:.0}),
  grade:M({color:'#8f9399',roughness:.4,metalness:.8}),
  lona:new THREE.MeshPhysicalMaterial({color:'#08080a',roughness:1,sheen:1,sheenColor:new THREE.Color('#38363f'),sheenRoughness:.32,side:THREE.DoubleSide,envMapIntensity:.15}),
  chao:M({color:'#1d1e21',roughness:.9}),
  arquibancada:M({color:'#1b1c20',roughness:.95}),
};
// caixa com quinas chanfradas (a luz pega na aresta dos degraus e patamares)
function bxC(p,m,x0,y0,z0,x1,y1,z1,r){r=r||.02;const w=Math.abs(x1-x0),h=Math.abs(y1-y0),d=Math.abs(z1-z0);
  const sh=new THREE.Shape();sh.moveTo(-w/2+r,-h/2+r);sh.lineTo(w/2-r,-h/2+r);sh.lineTo(w/2-r,h/2-r);sh.lineTo(-w/2+r,h/2-r);sh.closePath();
  const g=new THREE.ExtrudeGeometry(sh,{depth:d-2*r,bevelEnabled:true,bevelSize:r,bevelThickness:r,bevelSegments:2,steps:1});g.translate(0,0,-(d-2*r)/2);
  return mesh(p,g,m,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2);}
/* panos pretos aveludados: pregas verticais irregulares */
function pano(p,L,Hh,prega){const nx=Math.max(8,Math.round(L/.06)),ny=12;const g=new THREE.PlaneGeometry(L,Hh,nx,ny);const a=g.attributes.position;const r=rng(Math.round(L*13));const fases=[];for(let i=0;i<12;i++)fases.push(r()*6.28);
  for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i);const t=(y+Hh/2)/Hh;const k=(prega||.07)*(.75+.25*Math.sin(x*.7+fases[0]))*(.6+.4*t);
    a.setZ(i,Math.sin(x*2*Math.PI/.42+Math.sin(x*1.3+fases[1])*1.4)*k+Math.sin(x*2*Math.PI/1.7+fases[2])*k*.6);}
  g.computeVertexNormals();const m=new THREE.Mesh(g,P.lona);p.add(m);return m;}
/* ================= PISO DO PALCO, ESCADARIA E PIRÂMIDE ================= */
const palco=new THREE.Group();scene.add(palco);
const DECK=[bx(palco,P.preto,-21,H-.12,-15,21,H-.002,0),bx(palco,P.preto,-21,0,-15,21,H-.12,-.05)];
const pisoPalco=new THREE.Mesh(new THREE.PlaneGeometry(42,15),P.piso);pisoPalco.rotation.x=-Math.PI/2;pisoPalco.position.set(0,H,-7.5);pisoPalco.receiveShadow=true;palco.add(pisoPalco);DECK.push(pisoPalco);
DECK.push(bx(palco,B({color:new THREE.Color(1.6,1.15,.6),toneMapped:false}),-21,H-.04,-.06,21,H,0));   // filete de luz na borda
// escadaria: 16 degraus maciços
const DEGRAUS=[],GUARDA=[],PIR=[],QUEIM=[],PANOS=[];let PATAMAR,FUNDO_PIR;
{const rise=(ESC.topo-H)/ESC.n,run=(ESC.z0-ESC.z1)/ESC.n;
 for(let k=0;k<ESC.n;k++){const y1=H+(k+1)*rise,za=ESC.z0-k*run;const d=bxC(palco,P.arenito,-ESC.w/2,H,za-run-.02,ESC.w/2,y1,za,.018);DEGRAUS.push(d);}
 PATAMAR=bxC(palco,P.arenito,-4.6,H,ESC.zTopo,4.6,ESC.topo,ESC.z1,.02);                         // patamar do topo
 // guarda-corpos de pedra seguindo a inclinação, com o topo reto onde ficam as chamas
 const perfil=[[ESC.z0+.8,H],[ESC.z0+.8,H+1.05],[ESC.z1,ESC.topo+1.05],[ESC.zTopo,ESC.topo+1.05],[ESC.zTopo,H]];
 const sh=new THREE.Shape(perfil.map(p=>new THREE.Vector2(-p[0],p[1])));
 for(const lado of [-1,1]){const g=new THREE.ExtrudeGeometry(sh,{depth:.9,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:1});g.rotateY(Math.PI/2);
   const m=new THREE.Mesh(g,P.arenito);m.position.x=lado>0?ESC.w/2:-ESC.w/2-.9;palco.add(m);GUARDA.push(m);}
 // pirâmide escalonada dos dois lados (quatro patamares)
 for(const lado of [-1,1])for(let k=0;k<4;k++){const x0=ESC.w/2+.9,w=7.6-k*1.6,za=-3.4-k*1.9;const y0=H+k*1.25;
   const a=lado>0?x0:-x0-w,b=lado>0?x0+w:-x0;PIR.push(bxC(palco,k%2?P.arenitoEsc:P.arenito,a,y0,ESC.zTopo,b,y0+1.25,za,.025));}
 // fundo da pirâmide encostando no LED
 FUNDO_PIR=bx(palco,P.arenitoEsc,-13,H,LEDC.z+.05,13,H+.6,ESC.zTopo);}
// pontos dos queimadores de chama no topo dos guarda-corpos
const FOGO_POS=[];
for(const lado of [-1,1])for(let i=0;i<7;i++){const t=.06+i*.15;const z=ESC.z0+.8+(ESC.z1-ESC.z0-.8)*Math.min(1,t*1.12);const y=t*1.12<1?H+1.05+(ESC.topo-H)*Math.min(1,t*1.12):ESC.topo+1.05;
  const x=lado*(ESC.w/2+.45);FOGO_POS.push(new V3(x,y,z));QUEIM.push(bx(palco,P.pretoMet,x-.22,y,z-.22,x+.22,y+.16,z+.22));}
/* panos pretos de fundo e laterais (escondem a arquibancada atrás do palco) */
{const f=pano(palco,51,YC_PANO,.09);f.position.set(0,YC_PANO/2,-15.5);PANOS.push(f);for(const s of [-1,1]){const l=pano(palco,13.4,YC_PANO,.08);l.rotation.y=-s*Math.PI/2;l.position.set(s*25.2,YC_PANO/2,-8.7);PANOS.push(l);}}
/* ================= ESTRUTURA DOS LEDs ================= */
const LEDCX=bx(palco,P.preto,LEDC.x0-.4,LEDC.y0-.4,LEDC.z-.6,LEDC.x1+.4,LEDC.y1+.4,LEDC.z-.02);
const LATG=[];
for(const L of LAT){const g=new THREE.Group();g.position.set(L.x,0,LATD.z);g.rotation.y=L.ang;scene.add(g);
  bx(g,P.preto,-LATD.w/2-.3,LATD.y0-.3,-.6,LATD.w/2+.3,LATD.y0+LATD.h+.3,-.02);
  bx(g,P.preto,-LATD.w/2,0,-.9,LATD.w/2,LATD.y0-.3,-.2);   // saia preta embaixo da tela
  LATG.push(g);}
/* ================= TRELIÇAS (torres e cobertura) ================= */
const TUBOS=[];let ETQ_T='';
function tubo(a,b,r){TUBOS.push([a.clone(),b.clone(),r,ETQ_T]);}
function trelica(a,b,s){const d=new V3().subVectors(b,a);const L=d.length();d.normalize();const up=Math.abs(d.y)>.9?new V3(1,0,0):new V3(0,1,0);const u=new V3().crossVectors(d,up).normalize().multiplyScalar(s/2),v=new V3().crossVectors(d,u).normalize().multiplyScalar(s/2);
  const cant=[u.clone().add(v),u.clone().sub(v),u.clone().negate().sub(v),u.clone().negate().add(v)];
  for(const c of cant)tubo(a.clone().add(c),b.clone().add(c),.024);
  const n=Math.max(1,Math.round(L/s));for(let i=0;i<n;i++){const p0=a.clone().addScaledVector(d,L*i/n),p1=a.clone().addScaledVector(d,L*(i+1)/n);
    for(let f=0;f<4;f++){const c0=cant[f],c1=cant[(f+1)%4];tubo(p0.clone().add(i%2?c0:c1),p1.clone().add(i%2?c1:c0),.012);}
    for(let f=0;f<4;f++)tubo(p0.clone().add(cant[f]),p0.clone().add(cant[(f+1)%4]),.012);}}
const YC=18.5,ZT=[-1.2,-5.2,-9.2,-14.2];
ETQ_T='torres';for(const x of [-24.5,24.5])for(const z of [-1.2,-14.2])trelica(new V3(x,0,z),new V3(x,YC+.4,z),.76);
ETQ_T='grid';for(const z of ZT)trelica(new V3(-24.5,YC,z),new V3(24.5,YC,z),.6);
for(const x of [-24.5,-12,0,12,24.5])trelica(new V3(x,YC,-1.2),new V3(x,YC,-14.2),.5);
ETQ_T='torresLat';for(const L of LAT)for(const dx of [-1,1]){const g=LATG[LAT.indexOf(L)];const p=new V3(dx*(LATD.w/2+.8),0,-.4).applyMatrix4(g.matrixWorld.compose(g.position,g.quaternion,g.scale));trelica(new V3(p.x,0,p.z),new V3(p.x,LATD.y0+LATD.h+1.2,p.z),.4);}
// torres de delay no meio da pista
ETQ_T='torresDelay';for(const x of [-21,21])trelica(new V3(x,0,40),new V3(x,13,40),.6);
// uma malha por conjunto (torres, grid, torres dos LEDs laterais, delay), ordenada para a montagem revelar peça por peça
const TRELICAS={};
{const g=new THREE.CylinderGeometry(1,1,1,lowGPU?6:10,1);g.translate(0,.5,0);const o=new THREE.Object3D(),d=new V3(),Y=new V3(0,1,0);
 const chave={grid:t=>t[0].x+t[1].x+(t[0].z+t[1].z)*.01,torres:t=>Math.min(t[0].y,t[1].y),torresLat:t=>Math.min(t[0].y,t[1].y),torresDelay:t=>Math.min(t[0].y,t[1].y)};
 for(const tag of [...new Set(TUBOS.map(t=>t[3]))]){const L=TUBOS.filter(t=>t[3]===tag).sort((p,q)=>chave[tag](p)-chave[tag](q));const im=new THREE.InstancedMesh(g,P.trelica,L.length);
  L.forEach(([a,b,r],i)=>{d.subVectors(b,a);const Lt=d.length();o.position.copy(a);o.quaternion.setFromUnitVectors(Y,d.normalize());o.scale.set(r,Lt,r);o.updateMatrix();im.setMatrixAt(i,o.matrix);});
  im.castShadow=true;scene.add(im);TRELICAS[tag]=im;}}
/* ================= SISTEMA DE SOM (line arrays) ================= */
function lineArray(x,yTopo,z,n,ang){const g=new THREE.Group();g.position.set(x,yTopo,z);g.rotation.y=ang||0;scene.add(g);let y=0,a=0;
  for(let i=0;i<n;i++){const b=bx(g,P.preto,-.62,-.36,-.42,.62,0,.42);b.position.set(0,y-.18,Math.sin(a)*.3*i*.1);b.rotation.x=a;y-=.4;a+=i>n*.45?.045:.008;}
  bx(g,P.pretoMet,-.7,0,-.45,.7,.12,.45);return g;}
const LA=[],SUBS=[];
for(const s of [-1,1]){LA.push(lineArray(s*22.3,17.2,.4,14,s*.12),lineArray(s*25.6,17.2,-1.2,10,s*.5),lineArray(s*21,12.4,40.6,8,0));
  for(let k=0;k<3;k++)for(let j=0;j<2;j++)SUBS.push(bx(scene,P.preto,s*(9+k*1.45)-.65,j*.75,.6,s*(9+k*1.45)+.65,j*.75+.72,1.5));}
/* ================= GRADE, MESA DE SOM E PISO DA PISTA ================= */
const GRADE=[];for(let x=-26;x<26;x+=1.2){GRADE.push([bx(scene,P.grade,x,0,2.25,x+1.14,1.2,2.35),bx(scene,P.grade,x,0,2.3,x+.05,.06,3.2)]);}
const fohG=new THREE.Group();scene.add(fohG);
{const fx=0,fz=PONTO.z;const scene=fohG;bx(scene,P.preto,fx-5,0,fz-3,fx+5,.6,fz+3.5);bx(scene,P.pretoMet,fx-3.2,.6,fz-1.2,fx+3.2,1.5,fz-.2);
 for(const [x,z] of [[-4.8,-2.8],[4.8,-2.8],[-4.8,3.3],[4.8,3.3]])cyl(scene,P.trelica,fx+x,.6,fz+z,.06,.06,4,8);bx(scene,P.lona,fx-5.2,4.6,fz-3.2,fx+5.2,4.75,fz+3.7);
 for(let i=0;i<8;i++)bx(scene,B({color:new THREE.Color(.3,.6,1.2),toneMapped:false}),fx-2.9+i*.75,1.5,fz-1.05,fx-2.5+i*.75,1.52,fz-.35);}
const chao=new THREE.Mesh(new THREE.PlaneGeometry(400,400),P.chao);chao.rotation.x=-Math.PI/2;chao.receiveShadow=true;scene.add(chao);
{const t=ctex(512,512,(c,w,h)=>{c.fillStyle='#1c1d20';c.fillRect(0,0,w,h);c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=3;for(let i=0;i<=4;i++){c.beginPath();c.moveTo(i*128,0);c.lineTo(i*128,h);c.stroke();c.beginPath();c.moveTo(0,i*128);c.lineTo(w,i*128);c.stroke();}
  const r=rng(9);for(let i=0;i<9000;i++){const v=r()<.5?0:255;c.fillStyle=`rgba(${v},${v},${v},${r()*.05})`;c.fillRect(r()*w,r()*h,2,2);}});t.repeat.set(16,16);
 const pista=new THREE.Mesh(new THREE.PlaneGeometry(64,64),M({map:t,color:'#ffffff',roughness:.55,metalness:.15}));pista.rotation.x=-Math.PI/2;pista.position.set(0,.01,36);pista.receiveShadow=true;scene.add(pista);}
/* ================= ESTÁDIO: arquibancadas, faixa de LED roxa e a cobertura em treliça ================= */
const ESTADIO={cx:0,cz:38,ax:62,az:84};
const LUZES_ARQ=[];
{const segs=96,pos=[],idx=[];const r=rng(31);
 for(let i=0;i<=segs;i++){const a=i/segs*Math.PI*2;const ca=Math.cos(a),sa=Math.sin(a);
   for(let k=0;k<=6;k++){const f=1+k*.075;pos.push(ESTADIO.cx+ca*ESTADIO.ax*f,2+k*5.2,ESTADIO.cz+sa*ESTADIO.az*f);}
   if(i<segs)for(let k=0;k<6;k++){const a0=i*7+k,b0=(i+1)*7+k;idx.push(a0,b0,a0+1,a0+1,b0,b0+1);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();
 const arq=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:'#17181c',roughness:1,side:THREE.DoubleSide}));scene.add(arq);
 // mureta da arquibancada com faixa de LED roxa
 const fx=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,96,1,true),B({color:new THREE.Color(.55,.25,1.4),toneMapped:false,side:THREE.DoubleSide}));fx.scale.set(ESTADIO.ax*1.002,.9,ESTADIO.az*1.002);fx.position.set(ESTADIO.cx,2.6,ESTADIO.cz);scene.add(fx);
 const mur=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,96,1,true),M({color:'#0c0c0e',roughness:.9,side:THREE.DoubleSide}));mur.scale.set(ESTADIO.ax,2.1,ESTADIO.az);mur.position.set(ESTADIO.cx,1.05,ESTADIO.cz);scene.add(mur);
 // luzes de celular nas arquibancadas
 for(let i=0;i<(lowGPU?2500:6000);i++){const a=r()*Math.PI*2;if(Math.sin(a)<-.86&&Math.abs(Math.cos(a))<.4)continue;const k=r()*6;const f=1+k*.075;LUZES_ARQ.push(ESTADIO.cx+Math.cos(a)*ESTADIO.ax*f,2.8+k*5.2,ESTADIO.cz+Math.sin(a)*ESTADIO.az*f,r());}
 // cobertura: anel de treliça com membrana escura
 const cob=new THREE.Mesh(new THREE.RingGeometry(.62,1.18,96,1),new THREE.MeshStandardMaterial({color:'#121317',roughness:.85,side:THREE.DoubleSide}));cob.rotation.x=-Math.PI/2;cob.scale.set(ESTADIO.ax*1.3,ESTADIO.az*1.3,1);cob.position.set(ESTADIO.cx,46,ESTADIO.cz);scene.add(cob);
 const tex=ctex(1024,64,(c,w,h)=>{c.fillStyle='#000';c.fillRect(0,0,w,h);c.strokeStyle='rgba(190,195,205,.9)';c.lineWidth=2;for(let x=0;x<w;x+=32){c.beginPath();c.moveTo(x,0);c.lineTo(x+16,h);c.lineTo(x+32,0);c.stroke();}c.beginPath();c.moveTo(0,2);c.lineTo(w,2);c.moveTo(0,h-2);c.lineTo(w,h-2);c.stroke();},false);tex.repeat.set(24,1);
 const anel=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,96,1,true),new THREE.MeshStandardMaterial({map:tex,alphaMap:tex,transparent:true,color:'#9da2aa',roughness:.5,metalness:.7,side:THREE.DoubleSide,depthWrite:false}));
 anel.scale.set(ESTADIO.ax*.8,5,ESTADIO.az*.8);anel.position.set(ESTADIO.cx,43.5,ESTADIO.cz);scene.add(anel);}
const luzesArq=(()=>{const n=LUZES_ARQ.length/4,p=new Float32Array(n*3),s=new Float32Array(n);for(let i=0;i<n;i++){p.set(LUZES_ARQ.slice(i*4,i*4+3),i*3);s[i]=LUZES_ARQ[i*4+3];}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aS',new THREE.BufferAttribute(s,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uK:{value:.6}},
    vertexShader:'attribute float aS;uniform float uT,uK;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float on=step(1.-uK,fract(aS*7.13));vA=on*(.55+.45*sin(uT*1.7+aS*40.));gl_PointSize=max(1.5,90./-mv.z);}',
    fragmentShader:'varying float vA;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);if(d>.5)discard;gl_FragColor=vec4(vec3(1.,.97,.9)*1.6*vA*(1.-d*2.),1.);}'});
  const pt=new THREE.Points(g,m);pt.frustumCulled=false;scene.add(pt);return pt;})();
/* reflexos: ambiente escuro com placas de luz (para as treliças e metais terem brilho) */
{const pm=new THREE.PMREMGenerator(renderer);const es=new THREE.Scene();es.background=new THREE.Color('#050507');
 const add=(w,h,x,y,z,ry,cor,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(cor).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry||0;es.add(m);};
 add(40,20,0,8,-30,0,'#b8a4ff',1.4);add(12,18,-30,8,-10,Math.PI/2,'#ff6a3a',.9);add(12,18,30,8,-10,-Math.PI/2,'#ff6a3a',.9);add(60,8,0,30,10,0,'#ffffff',.15);
 scene.environment=pm.fromScene(es,.04).texture;pm.dispose();}

/* ================= O MUNDO DENTRO DO LED =================
   Uma cena 3D separada, montada "atrás" do LED central nas mesmas coordenadas do palco, e filmada a partir do ponto ideal
   (mesa de som) com projeção fora do eixo. Resultado: dali, a escadaria de pedra continua para dentro da tela.
   Todo o conteúdo é autoral: céu, nuvens, arcos e castelo são gerados aqui. */
const LOOP=12;                                 // duração de cada loop de mídia (s)
const mundo=new THREE.Scene();
mundo.fog=new THREE.FogExp2('#4a3a8c',.0026);
const MU={uT:{value:0},uFrag:{value:0},uRec:{value:0},uOuro:{value:0},uDesf:{value:1},uTorre:{value:0},uFlash:{value:0}};
const GLSL_RUIDO=`
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),u.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float a=.5,s=0.;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){s+=a*vn(p);p=m*p;a*=.5;}return s;}
float nuvem(vec2 p,float cob){vec2 q=vec2(fbm(p+vec2(0.,0.)),fbm(p+vec2(5.2,1.3)));float n=fbm(p+2.2*q);return smoothstep(1.-cob,1.-cob+.38,n);}
`;
/* céu: gradiente, sol e nuvens com borda iluminada; o loop fecha misturando o tempo t e t-LOOP */
const CEU_U={uTopo:{value:new THREE.Color('#140b2e')},uHor:{value:new THREE.Color('#4a3a8c')},uSolC:{value:new THREE.Color('#ffd08a')},uSolD:{value:new V3(0,.4,-1).normalize()},
  uNuvA:{value:new THREE.Color('#2a1f55')},uNuvB:{value:new THREE.Color('#d9d2ff')},uCob:{value:.72},uSolK:{value:.3},uT:MU.uT,uFlash:MU.uFlash,uLoop:{value:LOOP}};
CEU_U.tNuv={value:null};CEU_U.uResLED={value:new THREE.Vector2(1,1)};
const ceuM=new THREE.Mesh(new THREE.SphereGeometry(1200,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,uniforms:CEU_U,
  vertexShader:'varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 uTopo,uHor,uSolC,uSolD;uniform float uSolK,uFlash;uniform sampler2D tNuv;uniform vec2 uResLED;varying vec3 vD;
  void main(){vec3 d=normalize(vD);float h=clamp(d.y,0.,1.);vec3 c=mix(uHor,uTopo,pow(h,.5));float s=max(0.,dot(d,uSolD));
    c+=uSolC*(pow(s,8.)*.5+pow(s,90.)*1.2*uSolK+pow(s,900.)*6.*uSolK+pow(s,2.)*.12*uSolK);
    c=mix(c,uHor*1.08,exp(-max(d.y,0.)*28.)*.6);
    vec4 n=texture2D(tNuv,gl_FragCoord.xy/uResLED);c=c*(1.-n.a)+n.rgb;
    c+=vec3(.5,.55,1.)*uFlash*.12;gl_FragColor=vec4(c,1.);}`}));
mundo.add(ceuM);
/* nuvens em camadas (parallax) para o universo Céu */
const NUV_U={uT:MU.uT,uFlash:MU.uFlash,uLoop:{value:LOOP},uA:{value:new THREE.Color('#2a1f55')},uB:{value:new THREE.Color('#d9d2ff')},uVis:{value:1},uSolC:CEU_U.uSolC};
const NUVENS=new THREE.Group();mundo.add(NUVENS);
{const r=rng(404);const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:NUV_U,fog:false,
  vertexShader:'attribute float aS;varying vec2 vUv;varying float vS;void main(){vUv=uv;vS=aS;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float uT,uFlash,uLoop,uVis;uniform vec3 uA,uB,uSolC;varying vec2 vUv;varying float vS;${GLSL_RUIDO}
  void main(){vec2 p=vUv*vec2(3.,1.6)+vS*17.;vec2 v=vec2(.035,.006);float w=uT/uLoop;
    float a=mix(fbm(p+v*uT+fbm(p*1.7)*.8),fbm(p+v*(uT-uLoop)+fbm(p*1.7)*.8),w);float a2=mix(fbm(p+v*uT+vec2(.05,-.08)+fbm(p*1.7)*.8),fbm(p+v*(uT-uLoop)+vec2(.05,-.08)+fbm(p*1.7)*.8),w);
    float borda=smoothstep(0.,.35,vUv.x)*smoothstep(1.,.65,vUv.x)*smoothstep(0.,.45,vUv.y)*smoothstep(1.,.6,vUv.y);
    float den=smoothstep(.3,.62,a)*borda;if(den<.01)discard;float luz=clamp((a-a2)*6.+.35+vUv.y*.4,0.,1.);
    vec3 c=mix(uA,uB,luz);c+=vec3(.8,.85,1.)*uFlash*(.5+luz);gl_FragColor=vec4(c,den*uVis*.95);}`});
 const N=lowGPU?10:16;const s=new Float32Array(4);
 for(let i=0;i<N;i++){const g=new THREE.PlaneGeometry(1,1);const aS=new Float32Array(g.attributes.position.count).fill(r());g.setAttribute('aS',new THREE.BufferAttribute(aS,1));
   const m=new THREE.Mesh(g,mat);const z=-40-i*15-r()*10,lado=i%2?1:-1;const x=lado*(2+r()*30),y=(i%3===0?-6:8)+r()*26;const w=46+r()*60;m.scale.set(w,w*.42,1);m.position.set(x,y,z);m.renderOrder=-i;NUVENS.add(m);}}
/* luzes do mundo */
const muHemi=new THREE.HemisphereLight('#9fa8ff','#2a2030',.6);mundo.add(muHemi);
const muSol=new THREE.DirectionalLight('#ffd08a',1.2);muSol.position.set(0,30,-200);mundo.add(muSol,muSol.target);muSol.target.position.set(0,0,0);
const muRaio=new THREE.PointLight('#cfd8ff',0,400,.6);muRaio.position.set(-20,60,-90);mundo.add(muRaio);
const muOuro=new THREE.PointLight('#ffc070',0,260,.5);muOuro.position.set(0,18,-60);mundo.add(muOuro);
/* continuação da pirâmide do palco dentro da tela (mesmos patamares e alturas) e o vale lá embaixo */
const Y_VALE=-12;
{const zA=LEDC.z+.02,zB=-26;
 for(const lado of [-1,1])for(let k=0;k<4;k++){const x0=ESC.w/2+.9,w=7.6-k*1.6+6;const y0=k===0?Y_VALE:H+k*1.25;const a=lado>0?x0:-x0-w,b=lado>0?x0+w:-x0;bx(mundo,k%2?P.arenitoEsc:P.arenito,a,y0,zB,b,H+(k+1)*1.25,zA);}
 bx(mundo,P.arenito,-ESC.w/2-.9,Y_VALE,-19,ESC.w/2+.9,ESC.topo,zA);                 // o patamar do topo segue um pouco e acaba num paredão
 for(const lado of [-1,1])bx(mundo,P.arenito,lado>0?ESC.w/2:-ESC.w/2-.9,Y_VALE,-19,lado>0?ESC.w/2+.9:-ESC.w/2,ESC.topo+1.05,zA);
 const piso=new THREE.Mesh(new THREE.PlaneGeometry(1400,1400),M({color:'#3b3129',roughness:1}));piso.rotation.x=-Math.PI/2;piso.position.set(0,Y_VALE,-300);mundo.add(piso);}
/* ================= BLOCOS: arquitetura que se fragmenta e se reconstrói em ouro =================
   Cada bloco de pedra tem o seu lugar; nas Ruínas uma parte cai (vira entulho no chão) e outra flutua;
   no Castelo todos voltam ao lugar com a borda dourada; no Céu sobem e somem nas nuvens. */
const BLOCOS=[];
// ruído suave: as partes que desabaram ficam juntas (como numa ruína de verdade), não salpicadas
const ruido2=(()=>{const r=rng(606),G=[];for(let i=0;i<4096;i++)G.push(r());const v=(x,y)=>{const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,a=G[((i&63)+(j&63)*64)],b=G[(((i+1)&63)+(j&63)*64)],c=G[((i&63)+((j+1)&63)*64)],d=G[(((i+1)&63)+((j+1)&63)*64)];const u=fx*fx*(3-2*fx),w=fy*fy*(3-2*fy);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w;};
  return (x,y)=>v(x,y)*.65+v(x*2.1+17,y*2.1+5)*.35;})();  // [cx,cy,cz, sx,sy,sz, eixo, seed]
function parede(o){// o: {x,z,y0,L,eixo:'x'|'z', esp, andares:[{h,vao,arco,mod}], bw,bh}
  const r=rng(Math.floor(Math.abs(o.x*13+o.z*7)));let yb=o.y0;
  for(const A of o.andares){const nb=Math.round(A.h/o.bh);for(let j=0;j<nb;j++){const y=yb+(j+.5)*A.h/nb;const desl=o.fixo?0:(j%2)*o.bw*.5;
      for(let u=-o.L/2+desl;u<o.L/2-.01;u+=o.bw){let u0=Math.max(-o.L/2,u),u1=Math.min(o.L/2,u+o.bw);const yy=y-yb;
        // recorta o bloco pelo vão do arco (bordas lisas, sem degraus laterais)
        let pecas=[[u0,u1]];if(A.vao>0){const k0=Math.floor((u0+o.L/2)/A.mod),k1=Math.floor((u1+o.L/2)/A.mod);
          for(let k=k0-1;k<=k1+1;k++){const c=-o.L/2+(k+.5)*A.mod;let hw=0;if(yy<A.arco)hw=A.vao/2;else if(yy-A.arco<A.vao/2)hw=Math.sqrt((A.vao/2)**2-(yy-A.arco)**2);if(hw<=0)continue;
            const nov=[];for(const [a,b] of pecas){if(b<=c-hw||a>=c+hw){nov.push([a,b]);continue;}if(a<c-hw)nov.push([a,c-hw]);if(b>c+hw)nov.push([c+hw,b]);}pecas=nov;}}
        for(const [a,b] of pecas){if(b-a<.12)continue;const uc=(a+b)/2,bw=b-a;let arc=(a>u0+1e-6||b<u1-1e-6)?1:0;if(A.vao>0){const mm=((uc+o.L/2)%A.mod+A.mod)%A.mod-A.mod/2;if(Math.abs(mm)<A.vao/2+.4&&yy>=A.arco&&yy<A.arco+A.vao/2+.9)arc=1;}const cx=o.eixo==='x'?o.x+uc:o.x,cz=o.eixo==='x'?o.z:o.z+uc;
          const nz=ruido2((o.eixo==='x'?cx:cz)*.05+o.x*.1,y*.07+o.z*.01);const sd=Math.min(.999,Math.max(0,(nz-.3)*1.5-(y-o.y0)/90+.3+(r()-.5)*.1));
          BLOCOS.push([cx,y,cz,o.eixo==='x'?bw:o.esp,A.h/nb,o.eixo==='x'?o.esp:bw,o.fixo?1+r():sd,arc]);}}}
    yb+=A.h;}}
// fachada ao fundo (três andares de arcos, tipo coliseu/aqueduto) — vista do ponto ideal enche a largura do LED
parede({x:0,z:-158,y0:Y_VALE,L:128,eixo:'x',esp:4,bw:1.3,bh:.7,andares:[{h:18,vao:7.4,arco:9.4,mod:10.6},{h:16,vao:6.8,arco:8.2,mod:10.6},{h:13,vao:6,arco:6.4,mod:10.6}]});
// aquedutos dos dois lados, recuando em perspectiva
for(const lado of [-1,1])parede({x:lado*30,z:-100,y0:Y_VALE,L:112,eixo:'z',esp:3,bw:1.4,bh:.75,andares:[{h:17,vao:5.8,arco:8.6,mod:8.4},{h:12,vao:4.8,arco:5.4,mod:8.4}]});
// dois pilares monumentais emoldurando a vista logo depois do LED
for(const lado of [-1,1])parede({x:lado*8.2,z:-26.5,y0:Y_VALE,L:3.4,eixo:'x',esp:3.4,bw:1.13,bh:.9,fixo:true,andares:[{h:52,vao:0,arco:0,mod:100}]});
const blocos=(()=>{const n=BLOCOS.length;const g=new THREE.InstancedBufferGeometry();const bxg=new THREE.BoxGeometry(1,1,1);g.index=bxg.index;for(const k of ['position','normal','uv'])g.setAttribute(k,bxg.attributes[k]);g.instanceCount=n;
  const A=new Float32Array(n*3),S=new Float32Array(n*3),Rr=new Float32Array(n*4);const r=rng(55);
  BLOCOS.forEach((b,i)=>{A.set([b[0],b[1],b[2]],i*3);S.set([b[3],b[4],b[5]],i*3);const a=r()*6.283,e=r()*2-1;Rr.set([Math.cos(a)*Math.sqrt(1-e*e),Math.abs(e),Math.sin(a)*Math.sqrt(1-e*e),b[6]],i*4);});
  g.setAttribute('aA',new THREE.InstancedBufferAttribute(A,3));g.setAttribute('aS',new THREE.InstancedBufferAttribute(S,3));g.setAttribute('aR',new THREE.InstancedBufferAttribute(Rr,4));g.setAttribute('aF',new THREE.InstancedBufferAttribute(new Float32Array(BLOCOS.map(b=>b[7]||0)),1));
  const mat=M({map:TXA.cor,color:'#ffffff',roughness:.9,metalness:0});
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,MU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
      attribute vec3 aA;attribute vec3 aS;attribute vec4 aR;attribute float aF;uniform float uT,uFrag,uRec,uOuro,uDesf;varying vec3 vTP;varying vec3 vTN;varying vec2 vBu;varying float vGold;
      mat3 rotm(vec3 ax,float a){ax=normalize(ax);float s=sin(a),c=cos(a),oc=1.-c;return mat3(oc*ax.x*ax.x+c,oc*ax.x*ax.y+ax.z*s,oc*ax.z*ax.x-ax.y*s,oc*ax.x*ax.y-ax.z*s,oc*ax.y*ax.y+c,oc*ax.y*ax.z+ax.x*s,oc*ax.z*ax.x+ax.y*s,oc*ax.y*ax.z-ax.x*s,oc*ax.z*ax.z+c);}
      vec3 gOff;mat3 gRot;
      void blocoEstado(){float sd=aR.w;float ph=6.2832*uT/12.;gOff=vec3(0.);float ang=0.;
        // entulho: 24% dos blocos caem e ficam no chão; voltam quando o castelo se reconstrói
        float cai=step(sd,.16);float volta=clamp(uRec*1.7-sd*2.6,0.,1.);volta=volta*volta*(3.-2.*volta);
        vec3 chao=vec3(aA.x+(aR.x)*6.,aS.y*.5+fract(sd*31.)*1.2,aA.z+(aR.z)*6.);
        vec3 p=mix(aA,mix(chao,aA,volta),cai);ang+=cai*(1.-volta)*(1.2+sd*4.);
        // fragmentos flutuando (só nas Ruínas)
        float flu=step(.16,sd)*step(sd,.22)*uFrag;p+=vec3(aR.x*.8,.6+sin(ph+sd*40.)*.5+aR.y*1.2,aR.z*.8)*flu*(1.+fract(sd*17.));ang+=flu*(.15+.12*sin(ph+sd*9.));
        // Céu: tudo sobe e se desfaz nas nuvens
        float fixo=step(1.,sd);float sob=clamp(uDesf*1.5-fract(sd*7.)*.5,0.,1.)*(1.-fixo);sob=sob*sob;p+=vec3(aR.x*12.,40.+aR.y*30.,aR.z*12.)*sob;ang+=sob*3.;
        gOff=p;gRot=rotm(aR.xyz+vec3(.1,.2,.3),ang);float onda=fract(ph/6.2832-aA.y*.012+fract(sd*3.)*.08);float sw=smoothstep(.0,.08,onda)*smoothstep(.22,.08,onda);vGold=uOuro*mix(sw*.12,.55+.45*sw,aF);}`)
      .replace('#include <beginnormal_vertex>','blocoEstado();vec3 objectNormal=gRot*normal;')
      .replace('#include <begin_vertex>',`float esc=1.-clamp(uDesf*1.5-fract(aR.w*7.)*.5,0.,1.);esc=mix(esc,1.,step(1.,aR.w));vec3 transformed=gRot*(position*aS*esc)+gOff;vTP=position*aS+aA;vTN=normal;vBu=uv;`);
    sh.uniforms.uRaoB={value:TXA.rao};sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vTP;varying vec3 vTN;varying vec2 vBu;varying float vGold;uniform float uOuro;uniform sampler2D uRaoB;float hB;')
      .replace('#include <map_fragment>',`vec3 bw=pow(abs(vTN),vec3(4.));bw/=bw.x+bw.y+bw.z;vec2 tA=vec2(vTP.z/2.5,vTP.y/1.25),tB=vec2(vTP.x/2.5,vTP.z/1.25),tC=vec2(vTP.x/2.5,vTP.y/1.25);vec4 texelColor=texture2D(map,tA)*bw.x+texture2D(map,tB)*bw.y+texture2D(map,tC)*bw.z;hB=(texture2D(uRaoB,tA)*bw.x+texture2D(uRaoB,tB)*bw.y+texture2D(uRaoB,tC)*bw.z).g;float jt=min(min(vBu.x,1.-vBu.x),min(vBu.y,1.-vBu.y));texelColor.rgb*=.78+.22*smoothstep(.0,.035,jt);diffuseColor*=texelColor;
        float ed=min(min(vBu.x,1.-vBu.x),min(vBu.y,1.-vBu.y));float borda=1.-smoothstep(.0,.07,ed);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.25,1.,.6),uOuro*.5);`)
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(1.,.62,.18)*vGold*(borda*2.+.14*step(.3,vGold));').replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n{vec3 dpx=dFdx(-vViewPosition),dpy=dFdy(-vViewPosition);float dhx=dFdx(hB),dhy=dFdy(hB);vec3 r1=cross(dpy,normal),r2=cross(normal,dpx);float det=dot(dpx,r1);vec3 g=sign(det)*(dhx*r1+dhy*r2)*.9;normal=normalize(abs(det)*normal-g);}');};
  mat.customProgramCacheKey=()=>'blocos';
  const me=new THREE.Mesh(g,mat);me.frustumCulled=false;mundo.add(me);return me;})();
let ENV_OURO=null;{const pm=new THREE.PMREMGenerator(renderer);const es=new THREE.Scene();const g=new THREE.SphereGeometry(10,32,16);const c=[];const pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){const y=pos.getY(i)/10;const col=new THREE.Color().lerpColors(new THREE.Color('#ffb15a'),new THREE.Color('#fff0d0'),Math.max(0,y));if(y<0)col.lerp(new THREE.Color('#3a2412'),Math.min(1,-y*3));c.push(col.r*1.6,col.g*1.6,col.b*1.6);}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));es.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));ENV_OURO=pm.fromScene(es,.03).texture;pm.dispose();}
/* castelo: torres que sobem atrás da fachada */
const CASTELO=new THREE.Group();mundo.add(CASTELO);
{// telhado de escamas douradas (metal) com brilho quente nas bordas das peças
 const ouro=new THREE.MeshStandardMaterial({color:'#d9a441',roughness:.3,metalness:1,emissive:'#ffb24a',emissiveIntensity:0,envMap:ENV_OURO,envMapIntensity:1.1});CASTELO.userData.ouro=ouro;
 ouro.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nfloat gEsc;')
   .replace('#include <map_fragment>',`vec2 eu=vec2(vUv.x*56.,vUv.y*30.);float lin=floor(eu.y);eu.x+=mod(lin,2.)*.5;vec2 f=fract(eu)-vec2(.5,0.);
     float esc=length(vec2(f.x*1.1,(f.y-.15)*.9));gEsc=smoothstep(.62,.5,esc);diffuseColor.rgb*=mix(.35,1.05,gEsc)*(.9+.2*fract(sin(dot(floor(eu),vec2(12.9,78.2)))*437.5));`)
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.6,.24,gEsc);')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=.25+.75*(1.-gEsc)*1.6;');};
 ouro.defines={USE_UV:''};
 const pedra=P.arenito;const janela=B({color:new THREE.Color(3.2,1.9,.65),toneMapped:false});
 const jg=(()=>{const sh=new THREE.Shape();sh.moveTo(-.45,-1.1);sh.lineTo(.45,-1.1);sh.lineTo(.45,.6);sh.absarc(0,.6,.45,0,Math.PI,false);sh.closePath();return new THREE.ShapeGeometry(sh,8);})();
 const rT=rng(808);
 for(const [x,h,r,z] of [[0,30,4.4,-118],[-14,22,3.2,-96],[14,22,3.2,-96],[-24,17,2.7,-80],[24,17,2.7,-80],[-33,27,3.6,-122],[33,27,3.6,-122],[-7,34,2.4,-140],[7,34,2.4,-140]]){
   const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.08,h,40),pedra);t.position.set(x,Y_VALE+h/2,z);CASTELO.add(t);
   // cornija e ameias
   const co=new THREE.Mesh(new THREE.CylinderGeometry(r*1.12,r*1.02,1.4,40),pedra);co.position.set(x,Y_VALE+h-.2,z);CASTELO.add(co);
   for(let k=0;k<14;k++){const a=k/14*Math.PI*2;bx(CASTELO,pedra,x+Math.cos(a)*r*1.06-.5,Y_VALE+h+.4,z+Math.sin(a)*r*1.06-.5,x+Math.cos(a)*r*1.06+.5,Y_VALE+h+2,z+Math.sin(a)*r*1.06+.5);}
   // telhado cônico, pináculo e esfera
   const tel=new THREE.Mesh(new THREE.ConeGeometry(r*1.22,r*2.9,56,8,true),ouro);tel.position.set(x,Y_VALE+h+1.6+r*1.45,z);CASTELO.add(tel);
   const pin=new THREE.Mesh(new THREE.CylinderGeometry(.05,.18,r*.9,8),ouro);pin.position.set(x,Y_VALE+h+1.6+r*2.9+r*.45,z);CASTELO.add(pin);
   const esf=new THREE.Mesh(new THREE.SphereGeometry(r*.07+.15,16,10),ouro);esf.position.set(x,Y_VALE+h+1.6+r*2.9+r*.15,z);CASTELO.add(esf);
   // janelas em arco com luz quente (voltadas para o ponto de vista)
   const nj=Math.max(3,Math.round(h/16));for(let k=0;k<nj;k++){if(rT()<.25)continue;const w=new THREE.Mesh(jg,janela);const ang=(rT()-.5)*.9;w.position.set(x+Math.sin(ang)*(r+.06),Y_VALE+h*(.25+.65*k/nj),z+Math.cos(ang)*(r+.06));w.rotation.y=ang;w.scale.setScalar(r/6*1.3);CASTELO.add(w);}}
 // muralha e passadiço com ameias; portão em arco iluminado
 bx(CASTELO,pedra,-64,Y_VALE,-190,64,Y_VALE+48,-172);
 for(let i=0;i<42;i++)bx(CASTELO,pedra,-63+i*3,Y_VALE+48,-173.4,-61.8+i*3,Y_VALE+50.4,-172.2);
 {const pg=new THREE.Mesh(jg,janela);pg.scale.set(2.6,3.4,1);pg.position.set(0,Y_VALE+3.8,-118+4.45);CASTELO.add(pg);}
 for(let i=0;i<9;i++){const w=new THREE.Mesh(jg,janela);w.scale.setScalar(1.6);w.position.set(-56+i*14,Y_VALE+30,-171.9);CASTELO.add(w);}
 CASTELO.position.y=-110;}
/* raios de luz dourados (Castelo) e brilho do sol (Ruínas) */
const raiosOuro=(()=>{const g=new THREE.Group();mundo.add(g);const t=ctex(64,256,(c,w,h)=>{const gr=c.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,1)');c.fillStyle=gr;c.fillRect(0,0,w,h);const g2=c.createLinearGradient(0,0,w,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.5,'rgba(0,0,0,0)');g2.addColorStop(1,'rgba(0,0,0,1)');c.globalCompositeOperation='destination-out';c.fillStyle=g2;c.fillRect(0,0,w,h);},false);
  const m=new THREE.MeshBasicMaterial({map:t,color:'#ffcf7a',transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  for(let i=0;i<9;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(6+i%3*3,160),m);p.position.set(0,60,-200);p.rotation.z=(i-4)*.2;p.position.x=(i-4)*3;g.add(p);}g.userData.m=m;return g;})();
/* relâmpagos: galhos em zigue-zague, acesos junto com o flash */
const RAIOS=[];
{const r=rng(1201);const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(4,4.4,6),toneMapped:false,transparent:true,opacity:0,depthWrite:false,fog:false,side:THREE.DoubleSide});
 for(const [x0,z0] of [[-30,-130],[26,-110],[-6,-170]]){const pos=[];const galho=(x,y,z,dx,len,w,prof)=>{let px=x,py=y;for(let i=0;i<len;i++){const nx=px+dx+(r()-.5)*4,ny=py-2.2-r()*2;pos.push(px-w,py,z,px+w,py,z,nx+w,ny,z,px-w,py,z,nx+w,ny,z,nx-w,ny,z);if(prof<2&&r()<.18)galho(nx,ny,z,(r()-.5)*3,6+r()*6|0,w*.55,prof+1);px=nx;py=ny;}};
   galho(x0,95,z0,(r()-.5)*1.5,30,.35,0);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const m=new THREE.Mesh(g,mat.clone());m.frustumCulled=false;mundo.add(m);RAIOS.push(m);}}
// instantes dos relâmpagos dentro do loop de 12 s (o palco dispara os strobes junto)
const RELAMPAGOS=[[1.6,0],[1.78,0],[5.3,1],[8.9,2],[9.06,2],[9.35,0]];
function flashEm(t){let f=0;const fr=[0,0,0];for(const [ti,k] of RELAMPAGOS){let d=t-ti;if(d<0)d+=LOOP;const v=Math.exp(-d*9)*(d<1.2?1:0);f=Math.max(f,v);fr[k]=Math.max(fr[k],v);}return {f,fr};}
/* brasas douradas flutuando (Castelo) */
const BRASAS=(()=>{const n=lowGPU?300:900,p=new Float32Array(n*3),s=new Float32Array(n);const r=rng(88);for(let i=0;i<n;i++){p.set([(r()-.5)*120,Y_VALE+r()*60,-30-r()*150],i*3);s[i]=r();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aS',new THREE.BufferAttribute(s,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:MU.uT,uK:{value:0}},
    vertexShader:'attribute float aS;uniform float uT,uK;varying float vA;void main(){vec3 q=position;q.y=mod(q.y+uT*floor(1.+aS*3.)*50./12.,50.);q.x+=sin(uT*.5236+aS*30.)*2.;vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;vA=uK*(.4+.6*sin(uT*2.0944+aS*50.));gl_PointSize=max(1.,(1.+aS*2.)*320./-mv.z);}',
    fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(2.4,1.5,.5)*vA*(1.-d*2.),1.);}'});
  const pt=new THREE.Points(g,m);pt.frustumCulled=false;mundo.add(pt);return pt;})();
/* ================= CÂMERA DO LED (projeção fora do eixo a partir do ponto ideal) ================= */
const camLED=new THREE.PerspectiveCamera();camLED.position.copy(PONTO);camLED.updateMatrixWorld();
// o plano perto fica no próprio LED: o alvo de render tem profundidade de 16 bits
function projecaoLED(cam,olho){const n=olho.z-LEDC.z,f=2400;cam.position.copy(olho);cam.rotation.set(0,0,0);cam.updateMatrixWorld();
  const nr=n*.97,k=nr/n;cam.projectionMatrix.makePerspective((LEDC.x0-olho.x)*k,(LEDC.x1-olho.x)*k,(LEDC.y1-olho.y)*k,(LEDC.y0-olho.y)*k,nr,f);cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();}
projecaoLED(camLED,PONTO);
const RES_LED=lowGPU?[1024,512]:[2048,1024];
const rtLED=new THREE.WebGLRenderTarget(RES_LED[0],RES_LED[1],{type:THREE.HalfFloatType,samples:(renderer.capabilities.isWebGL2&&!lowGPU)?4:0});
ceuM.onBeforeRender=(r,s,cam)=>{ceuM.position.copy(cam.position);};
/* ================= MATERIAL DE LED: brilho, grade de pixels e queda de brilho fora do eixo ================= */
const LED_U={uBrilho:{value:1.05},uGrade:{value:0},uMidia:{value:0}};
function matLED(tex,res,extra){return new THREE.ShaderMaterial({extensions:{derivatives:true},toneMapped:false,
  uniforms:Object.assign({uTex:{value:tex},uRes:{value:new THREE.Vector2(res[0],res[1])},uBrilho:LED_U.uBrilho,uGrade:LED_U.uGrade,uMidia:LED_U.uMidia},extra?extra.u:{}),
  vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform sampler2D uTex;uniform vec2 uRes;uniform float uBrilho,uGrade,uMidia;varying vec2 vUv;varying vec3 vN;varying vec3 vV;${extra?extra.dec:''}
    void main(){vec2 uv=vUv;${extra?extra.cor:'vec3 c=texture2D(uTex,uv).rgb;'}
      if(uMidia<.5){vec2 px=uv*uRes;vec2 fw=fwidth(px);float vis=clamp(1.-max(fw.x,fw.y)*1.2,0.,1.);vec2 f=fract(px)-.5;float dot_=smoothstep(.5,.2,length(f));
        c*=mix(1.,dot_*1.9,vis*max(uGrade,.35*vis));float ang=max(dot(vN,vV),0.);c*=uBrilho*(.55+.45*pow(ang,.6));}
      gl_FragColor=vec4(c,1.);
      #include <encodings_fragment>
    }`});}
/* ---- nuvens volumétricas: raios marchando por uma camada de nuvem (ruído 3D), luz do sol com sombra própria,
   relâmpago acendendo o miolo da nuvem; meia resolução, compostas no céu ---- */
const NUV_RES=lowGPU?[320,160]:[768,384];
const rtNuv=new THREE.WebGLRenderTarget(NUV_RES[0],NUV_RES[1],{type:THREE.HalfFloatType});CEU_U.tNuv.value=rtNuv.texture;CEU_U.uResLED.value.set(RES_LED[0],RES_LED[1]);
const NV_U={uInvPV:{value:new THREE.Matrix4()},uCam:{value:new V3()},uT:MU.uT,uLoop:{value:LOOP},uSolD:CEU_U.uSolD,uSolC:CEU_U.uSolC,uNuvA:CEU_U.uNuvA,uNuvB:CEU_U.uNuvB,uHor:CEU_U.uHor,uTopo:CEU_U.uTopo,
  uCob:CEU_U.uCob,uFlash:MU.uFlash,uRaioP:{value:new V3(-20,90,-140)},uBase:{value:22},uTopoN:{value:420},uDens:{value:1}};
const PASSOS_N=lowGPU?20:44;
const cenaNuv=new THREE.Scene(),camQuad=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
cenaNuv.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:NV_U,
  vertexShader:'varying vec2 vN;void main(){vN=position.xy;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform mat4 uInvPV;uniform vec3 uCam,uSolD,uSolC,uNuvA,uNuvB,uHor,uTopo,uRaioP;uniform float uT,uLoop,uCob,uFlash,uBase,uTopoN,uDens;varying vec2 vN;
  ${GLSL_N3}
  float fbm5(vec3 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*gn(p);p=p*2.03+vec3(3.1,1.7,5.3);a*=.5;}return s;}
  float fbm3(vec3 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*gn(p);p=p*2.11+vec3(7.1,2.3,1.9);a*=.5;}return s;}
  float dens(vec3 p,float t,bool fino){vec2 w=p.xz+vec2(t*4.,t*1.5);
    float longe=smoothstep(-280.,-360.,p.z)*smoothstep(-820.,-720.,p.z);if(longe<.001)return 0.;
    float cel=gn(vec3(w*.0042,3.7))*.65+gn(vec3(w*.011,9.1))*.35;
    float topoL=uBase+30.+(uTopoN-uBase-30.)*smoothstep(.3,.9,cel);
    float h=(p.y-uBase)/(topoL-uBase);if(h<0.||h>1.)return 0.;
    vec3 q=p*.013+vec3(t*.09,-t*.02,t*.03);
    float b=fbm5(q);
    float forma=smoothstep(0.,.06,h)*(1.-pow(h,1.6));
    float d=smoothstep(.4,.7,b*.9+forma*.25+(cel-.6)*2.2+(uCob-.6)*.7-.25)*longe;
    if(fino&&d>0.)d=max(d-(fbm3(q*3.9+vec3(0.,t*.05,0.))-.42)*.8*(1.-d*.5),0.);
    return d*uDens;}
  float hg(float c,float g){float g2=g*g;return (1.-g2)/(4.*3.14159*pow(1.+g2-2.*g*c,1.5));}
  vec4 marcha(vec3 ro,vec3 rd,float t){if(rd.y<.002)return vec4(0.);float t0=max((uBase-ro.y)/rd.y,(ro.z+280.)/max(-rd.z,.05)),t1=min(min((uTopoN-ro.y)/rd.y,(ro.z+820.)/max(-rd.z,.05)),t0+700.);if(t1<=t0)return vec4(0.);
    float dt=(t1-t0)/${PASSOS_N}.;float j=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
    vec3 S=vec3(0.);float T=1.;float cs=dot(rd,uSolD);float ph=hg(cs,.5)*2.2+hg(cs,-.2)*.6+.08;
    for(int i=0;i<${PASSOS_N};i++){float tt=t0+dt*(float(i)+j);vec3 p=ro+rd*tt;float d=dens(p,t,true);if(d<.003)continue;
      float sl=0.;for(int k=1;k<=5;k++)sl+=dens(p+uSolD*float(k)*18.,t,false);float Tl=exp(-sl*18.*.035);float pw=1.-exp(-d*3.);
      float h=clamp((p.y-uBase)/(uTopoN-uBase),0.,1.);
      vec3 amb=mix(uNuvA*3.,uNuvB*uSolC*.5+uHor*.4,h*.8+.1);float oc=dens(p+vec3(0.,16.,0.),t,false)+dens(p+vec3(0.,38.,0.),t,false)*.6;amb*=exp(-oc*1.1)*.85+.15;
      vec3 c=uNuvB*uSolC*Tl*(.35+hg(cs,.6)*3.)*pw*5.+amb*(.5+.5*Tl);
      c+=vec3(.78,.84,1.)*uFlash*3.5*exp(-length(p-uRaioP)/70.)*(.4+.6*(1.-Tl));
      float a=1.-exp(-d*dt*.06);S+=T*c*a;T*=1.-a;if(T<.02)break;}
    float neb=1.-exp(-t0*.0005);S=mix(S,uHor*(1.-T),neb*.45);return vec4(S,1.-T);}
  void main(){vec4 pf=uInvPV*vec4(vN,1.,1.);vec3 rd=normalize(pf.xyz/pf.w-uCam);
    vec4 c=marcha(uCam,rd,uT);float w=smoothstep(uLoop-1.6,uLoop,uT);if(w>.001)c=mix(c,marcha(uCam,rd,uT-uLoop),w);
    gl_FragColor=c;}`})));
const _pv=new THREE.Matrix4();
function renderNuvens(){camLED.updateMatrixWorld();_pv.multiplyMatrices(camLED.projectionMatrix,camLED.matrixWorldInverse);NV_U.uInvPV.value.copy(_pv).invert();NV_U.uCam.value.copy(camLED.position);
  renderer.setRenderTarget(rtNuv);renderer.render(cenaNuv,camQuad);}
/* ---- pós do LED: raios de sol atravessando a bruma (desfoque radial do que é claro, a partir do sol) ---- */
const rtMundo=new THREE.WebGLRenderTarget(RES_LED[0],RES_LED[1],{type:THREE.HalfFloatType,samples:rtLED.samples});
const RS_U={tA:{value:rtMundo.texture},uSol:{value:new THREE.Vector2(.5,.5)},uK:{value:0},uCor:{value:new THREE.Color()}};
const cenaRS=new THREE.Scene();cenaRS.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({depthTest:false,depthWrite:false,uniforms:RS_U,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tA;uniform vec2 uSol;uniform float uK;uniform vec3 uCor;varying vec2 vUv;
    void main(){vec3 c=texture2D(tA,vUv).rgb;if(uK>.01){vec2 d=(uSol-vUv)/${lowGPU?24:48}.*.9;vec2 p=vUv;float dec=1.;vec3 acc=vec3(0.);
      for(int i=0;i<${lowGPU?24:48};i++){p+=d;vec3 s=texture2D(tA,clamp(p,0.,1.)).rgb;float l=max(dot(s,vec3(.3,.59,.11))-.55,0.);acc+=s*l*dec;dec*=.95;}
      c+=acc*uK*uCor*${lowGPU?'.04':'.02'};}
      gl_FragColor=vec4(c,1.);}`})));
const _sp=new V3();
const matCentral=matLED(rtLED.texture,[5120,2560]);
const telaCentral=new THREE.Mesh(new THREE.PlaneGeometry(LEDC.x1-LEDC.x0,LEDC.y1-LEDC.y0),matCentral);telaCentral.position.set((LEDC.x0+LEDC.x1)/2,(LEDC.y0+LEDC.y1)/2,LEDC.z);scene.add(telaCentral);
/* ================= LEDs LATERAIS: câmera ao vivo (IMAG) dentro de uma moldura barroca desenhada aqui ================= */
const RES_IMAG=lowGPU?[300,464]:[480,742];
const rtImag=[0,1].map(()=>new THREE.WebGLRenderTarget(RES_IMAG[0],RES_IMAG[1],{type:THREE.HalfFloatType}));
const camImag=[new THREE.PerspectiveCamera(20,RES_IMAG[0]/RES_IMAG[1],.3,400),new THREE.PerspectiveCamera(15,RES_IMAG[0]/RES_IMAG[1],.3,400)];
const texMoldura=ctex(768,1188,(c,w,h)=>{c.clearRect(0,0,w,h);const ouroG=c.createLinearGradient(0,0,w,h);ouroG.addColorStop(0,'#fff6e2');ouroG.addColorStop(.5,'#f4e3c0');ouroG.addColorStop(1,'#fffaf0');
  c.strokeStyle=ouroG;c.fillStyle=ouroG;c.lineCap='round';c.lineJoin='round';const m=52;
  c.lineWidth=7;c.strokeRect(m,m,w-2*m,h-2*m);c.lineWidth=3;c.strokeRect(m+16,m+16,w-2*m-32,h-2*m-32);
  const voluta=(x,y,s,rot,esp)=>{c.save();c.translate(x,y);c.rotate(rot);c.scale(esp||1,1);c.lineWidth=5;c.beginPath();for(let a=0;a<Math.PI*3.4;a+=.06){const r=s*(1-a/(Math.PI*3.8));const px=Math.cos(a)*r,py=Math.sin(a)*r;a?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();
    c.beginPath();c.moveTo(s*.1,-s*.95);c.bezierCurveTo(s*1.4,-s*1.6,s*2.6,-s*.3,s*3.4,-s*1.1);c.stroke();c.beginPath();c.moveTo(-s*.95,s*.1);c.bezierCurveTo(-s*1.6,s*1.4,-s*.3,s*2.6,-s*1.1,s*3.4);c.stroke();
    for(let k=0;k<3;k++){c.beginPath();c.ellipse(s*(1.2+k*.75),-s*(1.15+k*.12),s*.32,s*.13,-.5,0,7);c.fill();c.beginPath();c.ellipse(-s*(1.15+k*.12),s*(1.2+k*.75),s*.13,s*.32,.5,0,7);c.fill();}c.restore();};
  for(const [x,y,r] of [[m+8,m+8,0],[w-m-8,m+8,Math.PI/2],[w-m-8,h-m-8,Math.PI],[m+8,h-m-8,-Math.PI/2]])voluta(x,y,34,r);
  const crista=(x,y,rot)=>{c.save();c.translate(x,y);c.rotate(rot);c.lineWidth=4;for(const sx of [-1,1]){c.beginPath();c.moveTo(0,-6);c.bezierCurveTo(sx*40,-60,sx*110,-10,sx*150,-40);c.stroke();c.beginPath();c.arc(sx*150,-28,12,Math.PI,Math.PI*2.6*sx>0?0:Math.PI*2);c.stroke();}
    c.beginPath();c.moveTo(-22,0);c.quadraticCurveTo(0,-70,22,0);c.closePath();c.fill();c.beginPath();c.arc(0,-78,9,0,7);c.fill();c.restore();};
  crista(w/2,m+2,0);crista(w/2,h-m-2,Math.PI);
  for(const [x,rot] of [[m,-Math.PI/2],[w-m,Math.PI/2]]){c.save();c.translate(x,h/2);c.rotate(rot);c.lineWidth=4;c.beginPath();c.moveTo(-90,0);c.bezierCurveTo(-50,-36,50,-36,90,0);c.stroke();c.beginPath();c.ellipse(0,-14,16,26,0,0,7);c.fill();c.restore();}
  for(let i=0;i<14;i++){const y=m+120+i*(h-2*m-240)/13;for(const x of [m-14,w-m+14]){c.beginPath();c.arc(x,y,3.2,0,7);c.fill();}}},false);
const LAT_U={uFundo:{value:new THREE.Color('#5a0b06')},uGrad:{value:new THREE.Color(1,.82,.78)},uFlashL:MU.uFlash,uFio:{value:new THREE.Color('#fff4de')}};
const matLat=[0,1].map(i=>matLED(rtImag[i].texture,[1692,2616],{u:{uMol:{value:texMoldura},uFundo:LAT_U.uFundo,uGrad:LAT_U.uGrad,uFlashL:LAT_U.uFlashL,uFio:LAT_U.uFio},
  dec:'uniform sampler2D uMol;uniform vec3 uFundo,uGrad,uFio;uniform float uFlashL;',
  cor:`vec4 mol=texture2D(uMol,uv);vec3 img=texture2D(uTex,uv).rgb;img=img/(1.+img)*1.35;float lum=dot(img,vec3(.3,.59,.11));img=mix(vec3(lum),img,.75)*uGrad;
    vec2 q=abs(uv-.5);float dentro=step(q.x,.5-.075)*step(q.y,.5-.048);vec3 fundo=uFundo*(.7+.6*(1.-length(uv-.5)))+uFlashL*.3;
    vec3 c=mix(fundo,img,dentro);c=mix(c,uFio*1.15,mol.a);`}));
const telasLat=LATG.map((g,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(LATD.w,LATD.h),matLat[i]);m.position.set(0,LATD.y0+LATD.h/2,0);g.add(m);return m;});
// luz que o LED joga no palco (área retangular com a cor média do conteúdo)
THREE.RectAreaLightUniformsLib&&THREE.RectAreaLightUniformsLib.init();
const luzLED=new THREE.RectAreaLight('#8f86ff',0,LEDC.x1-LEDC.x0,LEDC.y1-LEDC.y0);luzLED.position.set(0,(LEDC.y0+LEDC.y1)/2,LEDC.z+.05);luzLED.lookAt(0,(LEDC.y0+LEDC.y1)/2,10);scene.add(luzLED);
const luzLat=LATG.map(g=>{const l=new THREE.RectAreaLight('#ff3a20',0,LATD.w,LATD.h);l.position.set(0,LATD.y0+LATD.h/2,.05);l.lookAt(0,LATD.y0+LATD.h/2,10);g.add(l);return l;});
/* ================= ESTADO DOS UNIVERSOS NO LED ================= */
const UNIV=[
  {id:'ceu',nome:'Céu',topo:'#07041a',hor:'#2a2160',sol:'#c4bcff',solD:[.55,.62,.4],solK:.22,nuvA:'#120b30',nuvB:'#d2caff',cob:.8,fog:['#3a2f78',.0022],
    luz:[0,.6,-1],frag:0,rec:0,ouro:0,desf:1,torre:0,nuvVis:1,nB:6,nT:240,nD:1.2,hemi:['#9fa8ff','#2a2030',.55],sunC:'#b9b2ff',sunI:.6,led:'#8b80ff',ledI:3.2,lat:{fundo:'#140f3a',grad:[.85,.9,1.15]},brasa:0,raiosO:0},
  {id:'ruinas',nome:'Ruínas',topo:'#2a1430',hor:'#ff8a3d',sol:'#ffcf86',solD:[0,.07,-1],solK:1,nuvA:'#5a2a2a',nuvB:'#ffb27a',cob:.42,fog:['#c8693a',.0042],
    luz:[0,.12,-1],frag:1,rec:0,ouro:0,desf:0,torre:0,nuvVis:0,nB:40,nT:150,nD:.8,hemi:['#ffb27a','#3a2418',.55],sunC:'#ffb46a',sunI:2.1,led:'#ff8a44',ledI:3.6,lat:{fundo:'#6a0c06',grad:[1.15,.86,.78]},brasa:0,raiosO:0},
  {id:'castelo',nome:'Castelo',topo:'#160c06',hor:'#ffb45e',sol:'#ffe2a6',solD:[0,.12,-1],solK:1,nuvA:'#4a2a12',nuvB:'#ffd79a',cob:.5,fog:['#b07a3a',.0017],
    luz:[.3,.42,1],frag:0,rec:1,ouro:1,desf:0,torre:1,nuvVis:0,nB:60,nT:200,nD:.7,hemi:['#ffcf8a','#2a1a0c',.42],sunC:'#ffc878',sunI:1.05,led:'#ffbf5e',ledI:2.9,lat:{fundo:'#3a2408',grad:[1.15,1,.75]},brasa:1,raiosO:.18},
];
const UE={luzD:new V3(0,.6,-1),topo:new THREE.Color(),hor:new THREE.Color(),sol:new THREE.Color(),solD:new V3(0,.4,-1),nuvA:new THREE.Color(),nuvB:new THREE.Color(),fogC:new THREE.Color(),hemC:new THREE.Color(),hemG:new THREE.Color(),sunC:new THREE.Color(),led:new THREE.Color(),latF:new THREE.Color(),latG:new V3(),
  solK:0,cob:0,fogD:0,frag:0,rec:0,ouro:0,desf:1,torre:0,nuvVis:1,hemI:0,sunI:0,ledI:0,brasa:0,raiosO:0,nB:16,nT:430,nD:1};
const _c=new THREE.Color();
function misturaUniv(A,k){UE.luzD.lerp(new V3(...A.luz).normalize(),k).normalize();UE.topo.lerp(_c.set(A.topo),k);UE.hor.lerp(_c.set(A.hor),k);UE.sol.lerp(_c.set(A.sol),k);UE.solD.lerp(new V3(...A.solD).normalize(),k).normalize();UE.nuvA.lerp(_c.set(A.nuvA),k);UE.nuvB.lerp(_c.set(A.nuvB),k);
  UE.fogC.lerp(_c.set(A.fog[0]),k);UE.hemC.lerp(_c.set(A.hemi[0]),k);UE.hemG.lerp(_c.set(A.hemi[1]),k);UE.sunC.lerp(_c.set(A.sunC),k);UE.led.lerp(_c.set(A.led),k);UE.latF.lerp(_c.set(A.lat.fundo),k);UE.latG.lerp(new V3(...A.lat.grad),k);
  for(const [a,b] of [['solK','solK'],['cob','cob'],['frag','frag'],['ouro','ouro'],['desf','desf'],['torre','torre'],['nuvVis','nuvVis'],['sunI','sunI'],['ledI','ledI'],['brasa','brasa'],['raiosO','raiosO'],['nB','nB'],['nT','nT'],['nD','nD']])UE[a]+=(A[b]-UE[a])*k;
  UE.fogD+=(A.fog[1]-UE.fogD)*k;UE.hemI+=(A.hemi[2]-UE.hemI)*k;}
// reconstrução: no Castelo sobe devagar (é a "construção"); ao sair do Castelo só zera quando os blocos já sumiram no céu
function aplicaUniv(A,k,dt){misturaUniv(A,k);const alvoRec=A.rec;UE.rec+=(alvoRec>UE.rec?Math.min(dt*.16,alvoRec-UE.rec):(UE.desf>.95?alvoRec-UE.rec:0));}
misturaUniv(UNIV[0],1);UE.rec=0;
function atualizaMundo(tLoop,dt){MU.uT.value=tLoop;const F=flashEm(tLoop);const flash=F.f*(1-UE.frag)*(UE.nuvVis);MU.uFlash.value=flash;
  MU.uFrag.value=UE.frag;MU.uRec.value=UE.rec;MU.uOuro.value=UE.ouro;MU.uDesf.value=UE.desf;
  CEU_U.uTopo.value.copy(UE.topo);CEU_U.uHor.value.copy(UE.hor);CEU_U.uSolC.value.copy(UE.sol);CEU_U.uSolD.value.copy(UE.solD);CEU_U.uNuvA.value.copy(UE.nuvA);CEU_U.uNuvB.value.copy(UE.nuvB);CEU_U.uCob.value=UE.cob;CEU_U.uSolK.value=UE.solK;
  NUVENS.visible=false;NV_U.uBase.value=UE.nB;NV_U.uTopoN.value=UE.nT;NV_U.uDens.value=UE.nD;{let mx=-1,ki=0;F.fr.forEach((v,i)=>{if(v>mx){mx=v;ki=i;}});const R0=[[-30,-130],[26,-110],[-6,-170]][ki];NV_U.uRaioP.value.set(R0[0],78,R0[1]);}
  mundo.fog.color.copy(UE.fogC);mundo.fog.density=UE.fogD;muHemi.color.copy(UE.hemC);muHemi.groundColor.copy(UE.hemG);muHemi.intensity=UE.hemI;
  muSol.color.copy(UE.sunC);muSol.intensity=UE.sunI;muSol.position.copy(UE.luzD).multiplyScalar(300);
  muRaio.intensity=flash*6;RAIOS.forEach((r,i)=>{r.material.opacity=F.fr[i]*(1-UE.frag)*UE.nuvVis;r.visible=r.material.opacity>.01;});
  CASTELO.position.y=-110*(1-UE.torre)*(1-UE.torre);CASTELO.visible=UE.torre>.01;CASTELO.userData.ouro.emissiveIntensity=.6+.5*Math.sin(tLoop*6.2832/LOOP*2);
  muOuro.intensity=UE.ouro*2.2;raiosOuro.userData.m.opacity=UE.raiosO*(.75+.25*Math.sin(tLoop*6.2832/LOOP));raiosOuro.visible=UE.raiosO>.01;raiosOuro.rotation.z=Math.sin(tLoop*6.2832/LOOP)*.05;
  BRASAS.material.uniforms.uK.value=UE.brasa;BRASAS.visible=UE.brasa>.01;
  LAT_U.uFundo.value.copy(UE.latF);LAT_U.uGrad.value.setRGB(UE.latG.x,UE.latG.y,UE.latG.z);
  luzLED.color.copy(UE.led);luzLED.intensity=UE.ledI*(1+flash*4);for(const l of luzLat){l.color.copy(UE.latF).multiplyScalar(2.2);l.intensity=1.6;}}
let quadroNuv=0;
function renderMundo(){if(!SEM_NUV&&(!lowGPU||quadroNuv++%2===0))renderNuvens();renderer.setRenderTarget(rtMundo);renderer.render(mundo,camLED);
  _sp.copy(camLED.position).addScaledVector(UE.solD,1000).project(camLED);RS_U.uSol.value.set(_sp.x*.5+.5,_sp.y*.5+.5);RS_U.uK.value=UE.solK*(_sp.z<1?1:0);RS_U.uCor.value.copy(UE.sol);
  renderer.setRenderTarget(rtLED);renderer.render(cenaRS,camQuad);renderer.setRenderTarget(null);}

/*GENTE*/
const N_P1=palco.children.length;   // o que entra no grupo 'palco' depois disso é o equipamento da banda
/* ================= NO PALCO: intérprete genérico e banda (personagens próprios, sem retratar ninguém) ================= */
bx(palco,P.preto,-12.5,H,-11.5,-7.5,H+.6,-7.5);bx(palco,P.preto,7.5,H,-11.5,12.5,H+.6,-7.5);
{const y=H+.6,x=-10,z=-9.6;cyl(palco,M({color:'#e9e6df',roughness:.4}),x,y,z-.3,.3,.3,.5,20).rotation.x=Math.PI/2;for(const [dx,dz,r] of [[-.6,.2,.18],[.6,.2,.18],[-.35,-.25,.16],[.4,-.2,.16]])cyl(palco,M({color:'#e9e6df',roughness:.4}),x+dx,y+.55,z+dz,r,r,.2,18);
 for(const dx of [-.9,.9]){cyl(palco,P.trelica,x+dx,y,z-.1,.015,.015,1.2,6);cyl(palco,M({color:'#c9a24a',metalness:1,roughness:.3}),x+dx,y+1.2,z-.1,.28,.28,.01,24);}}
{const y=H+.6,x=10,z=-9.4;bx(palco,P.preto,x-.7,y+.7,z-.2,x+.7,y+.8,z+.2);bx(palco,M({color:'#eeeeea'}),x-.65,y+.8,z-.05,x+.65,y+.82,z+.12);for(const dx of [-.5,.5])cyl(palco,P.trelica,x+dx,y,z,.02,.02,.7,6);}
const rP=rng(4242);
const NO_PALCO=[];
NO_PALCO.push(sorteiaPessoa(rP,TOPO_ART.x,TOPO_ART.z,ESC.topo,0,{v:VID.artista,anim:AID.cantando,estilo:'curto',barba:1,pele:'#4a2c1c',top:'#d8d2c4',baixo:'#1b1c20',tenis:'#f2f0ea',cabelo:'#0b0908',acento:'#d8d2c4',obj:'mic',fase:0}));
NO_PALCO.push(sorteiaPessoa(rP,-10,-9.0,H+.6,.15,{v:VID.m4,anim:AID.tambor,estilo:'curto',top:'#141414',baixo:'#141414',fase:.1}));
NO_PALCO.push(sorteiaPessoa(rP,10,-8.6,H+.6,-.15,{v:VID.f6,anim:AID.balanco,estilo:'coque',top:'#141414',baixo:'#141414',fase:.3}));
for(const [x,z,k] of [[-2.2,-4.2,0],[2.2,-4.4,1]]){const rise=(ESC.topo-H)/ESC.n,run=(ESC.z0-ESC.z1)/ESC.n;const kk=Math.round((ESC.z0-z)/run);
  NO_PALCO.push(sorteiaPessoa(rP,x,z,H+kk*rise,0,{v:k?VID.f1:VID.m2,anim:AID.danca,estilo:k?'trancas':'curto',top:'#1a1a1a',baixo:'#1a1a1a',fase:k*.5}));}
const palcoG=grupoGente(NO_PALCO,scene,{sombra:!lowGPU,semLo:true,lim:{hi:12,rHi:999,mid:12,rMid:999}});
/* ================= PÚBLICO NA PISTA =================
   Ninguém igual ao vizinho: a variante (corpo + roupa) é sorteada de novo se repetir alguém a menos de 1,5 m. */
const R_PERTO=lowGPU?30:42;
const PUB=[];const gPub=new THREE.Group();scene.add(gPub);
const POOL_ANIM=[[['balanco',30],['bracos',18],['filmando',18],['olhando',12],['copo',10],['danca',12]],
  [['balanco',34],['olhando',20],['copo',20],['filmando',10],['danca',16]],
  [['pulando',26],['bracos',20],['punho',16],['danca',14],['palmas',10],['filmando',10],['balanco',4]]].map(a=>pesos(a).map(n=>AID[n]));
const OBJ_ANIM=a=>a===AID.filmando?'celular':a===AID.copo?'copo':'';
{const r=rng(2511);const k=lowGPU?.42:1;const ocup=new Set();const viz=new Map();
 const dens=z=>z<12?2.4:z<24?1.7:z<40?1.2:.75;
 for(let z=3.4;z<64;z+=.6)for(let x=-30;x<30;x+=.6){if(r()>dens(z)*.36*k)continue;const px=x+(r()-.5)*.5,pz=z+(r()-.5)*.5;
   if(Math.abs(px)<6.2&&pz>PONTO.z-4&&pz<PONTO.z+4.6)continue;if(Math.hypot(Math.abs(px)-21,pz-40)<1.6)continue;
   const kk=Math.round(px/.55)+','+Math.round(pz/.55);if(ocup.has(kk))continue;ocup.add(kk);
   const alvo=new V3(0,0,-8);const yaw=Math.atan2(alvo.x-px,alvo.z-pz)+(r()-.5)*.5;
   const cx=Math.floor(px/1.5),cz=Math.floor(pz/1.5);const perto=new Set();for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const v of (viz.get((cx+a)+','+(cz+b))||[]))perto.add(v);
   let vi=0;for(let t=0;t<8;t++){vi=Math.floor(r()*(VAR.length-1));if(!perto.has(vi))break;}
   const ck=cx+','+cz;if(!viz.has(ck))viz.set(ck,[]);viz.get(ck).push(vi);
   const pool=POOL_ANIM[0];const anim=pool[(r()*pool.length)|0];
   PUB.push(sorteiaPessoa(r,px,pz,0,yaw,{v:vi,anim,obj:OBJ_ANIM(anim),fase:r(),vel:1}));}}
const pubG=grupoGente(PUB,gPub,{rMax:R_PERTO+2,livre:true});
const CELS_P=[];
// troca de animação ao longo do show (mais gente pulando no Castelo, mais celular no Céu)
let trocaT=0,univAnt=-1;const rA=rng(99);
function animaPublico(ui,t,dt){trocaT+=dt;const mudou=ui!==univAnt;univAnt=ui;const frac=mudou?.45:.025;if(!mudou&&trocaT<.5)return;trocaT=0;const pool=POOL_ANIM[ui];
  for(let i=0;i<PUB.length;i++){if(rA()>frac)continue;const p=PUB[i];const a=pool[(rA()*pool.length)|0];
    if(pubG.anima(i,a,t+rA()*(mudou?1.5:0),.7))p.obj=OBJ_ANIM(a);}}
const U_NOITE={value:1};

const crowdU={uTime:{value:0},uEnergy:{value:.5},uFreq:{value:6.28*1.4}};
const texFig=(()=>{const W=256,H=128,cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');c.fillStyle='#000';c.fillRect(0,0,W,H);
  const arm=(x0,y0,x1,y1)=>{c.strokeStyle='#00ff00';c.lineWidth=7;c.lineCap='round';c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();};
  for(let v=0;v<4;v++){const ox=v*64+32;
    c.fillStyle='#0000ff';c.fillRect(ox-10,72,9,46);c.fillRect(ox+1,72,9,46);c.fillStyle='#ffff00';c.fillRect(ox-11,116,10,7);c.fillRect(ox+1,116,10,7);
    if(v===0){arm(ox-14,38,ox-17,72);arm(ox+14,38,ox+17,72);}else if(v===1){arm(ox-13,36,ox-21,5);arm(ox+13,36,ox+21,5);}else if(v===2){arm(ox-14,38,ox-17,72);arm(ox+13,36,ox+19,4);}else{arm(ox-13,37,ox-29,50);arm(ox+13,37,ox+29,28);}
    c.fillStyle='#ff0000';c.beginPath();c.moveTo(ox-14,32);c.lineTo(ox+14,32);c.lineTo(ox+12,76);c.lineTo(ox-12,76);c.closePath();c.fill();
    c.fillStyle='#00ff00';c.fillRect(ox-3,24,6,9);c.beginPath();c.arc(ox,18,9.5,0,7);c.fill();c.fillStyle='#ffff00';c.beginPath();c.arc(ox,15,10,Math.PI*1.05,Math.PI*1.95);c.fill();}
  const im=c.getImageData(0,0,W,H).data,d=new Uint8Array(W*H*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=((H-1-y)*W+x)*4,o=(y*W+x)*4;const R=im[i],G=im[i+1],B=im[i+2];const a=Math.max(R,G,B)>60;
    d[o]=R>128&&G<128?255:0;d[o+1]=G>128&&R<128?255:0;d[o+2]=B>128?255:0;d[o+3]=a?255:0;}
  const t=new THREE.DataTexture(d,W,H,THREE.RGBAFormat);t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;})();
const FIG_U={uAtlas:{value:texFig},uT:crowdU.uTime,uFreq:crowdU.uFreq,uEnergy:crowdU.uEnergy,uNear:{value:R_PERTO},uFar:{value:720},uLuz:{value:1},uNoite:U_NOITE,uTrio:{value:Array.from({length:12},()=>new THREE.Vector4(1e6,1e6,1,0))}};
function matFig(zona){return new THREE.ShaderMaterial({fog:true,uniforms:THREE.UniformsUtils.merge([THREE.UniformsLib.fog,{}]),defines:zona?{ZONA:''}:{},
  vertexShader:`attribute vec4 iP;attribute vec3 iC;attribute vec3 iS;attribute vec4 iB;uniform float uT,uFreq,uEnergy,uNear,uFar;uniform vec4 uTrio[12];
  varying vec2 vUv;varying vec3 vC,vS,vB;varying float vV;
  #include <fog_pars_vertex>
  void main(){vec4 w=modelMatrix*vec4(iP.xyz,1.);float dh=distance(w.xz,cameraPosition.xz);bool vis=dh>uNear&&dh<uFar;
  #ifdef ZONA
    if(iP.y<.1)for(int k=0;k<12;k++){vec4 T=uTrio[k];vec2 rel=w.xz-T.xy;float lx=dot(rel,T.zw);float lz=dot(rel,vec2(-T.w,T.z));if(lx>-58.&&lx<16.&&abs(lz)<6.3)vis=false;}
  #endif
    if(!vis){gl_Position=vec4(0.,0.,-2.,1.);return;}
    vec3 tc=cameraPosition-w.xyz;tc.y=0.;vec3 rt=normalize(vec3(tc.z,0.,-tc.x)+1e-5);
    float v=iB.w;float esc=1.7*(.9+.18*fract(iP.w*3.7));float bob=(v>.5&&v<2.5)?max(0.,sin(uT*uFreq+iP.w))*.22*uEnergy:0.;
    vec3 p=w.xyz+rt*position.x*esc*.5+vec3(0.,position.y*esc+bob,0.);vec4 mvPosition=viewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
    vUv=vec2(position.x+.5,position.y);vC=iC;vS=iS;vB=iB.rgb;vV=v;
    #include <fog_vertex>
  }`,
  fragmentShader:`uniform sampler2D uAtlas;uniform float uLuz,uNoite;varying vec2 vUv;varying vec3 vC,vS,vB;varying float vV;
  #include <fog_pars_fragment>
  void main(){vec4 t=texture2D(uAtlas,vec2((floor(vV+.5)+clamp(vUv.x,.02,.98))/4.,vUv.y));if(t.a<.5)discard;
    vec3 c=vec3(.07,.06,.06);c=mix(c,vS,t.g);c=mix(c,vC,t.r);c=mix(c,vB,t.b);c*=uLuz*(.72+.28*vUv.y);
    gl_FragColor=vec4(c,1.);
    #include <fog_fragment>
  }`});}
function figurinhas(lista,zona,pai){const n=lista.length;if(!n)return null;const g=new THREE.InstancedBufferGeometry();const pl=new THREE.PlaneGeometry(1,1);pl.translate(0,.5,0);
  g.index=pl.index;g.setAttribute('position',pl.attributes.position);g.instanceCount=n;
  const P=new Float32Array(n*4),C=new Float32Array(n*3),S=new Float32Array(n*3),Bc=new Float32Array(n*4),cc=new THREE.Color();
  const VFIG={[AID.bracos]:1,[AID.palmas]:1,[AID.pulando]:1,[AID.punho]:2,[AID.filmando]:2,[AID.copo]:3};
  lista.forEach((p,i)=>{P.set([p.x,p.y,p.z,(p.fase||0)*5+i*.37],i*4);cc.setHex(p.topC);C.set([cc.r,cc.g,cc.b],i*3);cc.setHex(p.pele);S.set([cc.r,cc.g,cc.b],i*3);cc.setHex(p.baixoC);Bc.set([cc.r,cc.g,cc.b,VFIG[p.anim]!==undefined?VFIG[p.anim]:0],i*4);});
  g.setAttribute('iP',new THREE.InstancedBufferAttribute(P,4));g.setAttribute('iC',new THREE.InstancedBufferAttribute(C,3));g.setAttribute('iS',new THREE.InstancedBufferAttribute(S,3));g.setAttribute('iB',new THREE.InstancedBufferAttribute(Bc,4));
  const m=matFig(zona);Object.assign(m.uniforms,FIG_U);const me=new THREE.Mesh(g,m);me.frustumCulled=false;(pai||scene).add(me);return me;}

const FIGS=[figurinhas(PUB,false)];

/* ================= LUZ DO PALCO: refletores em quadrado (vermelhos), moving heads, strobes ================= */
const PIX=[];   // {p:V3, n:V3 (para onde a face aponta), grupo}
function pix(x,y,z,nx,nz,grupo){PIX.push({p:new V3(x,y,z),n:new V3(nx,0,nz).normalize(),grupo});}
for(const z of [-4.2,-7.2,-10.2])for(let i=0;i<18;i++)pix(-20+i*40/17,YC-1.1,z,0,1,'teto');
for(let i=0;i<16;i++)pix(LEDC.x0+.6+i*(LEDC.x1-LEDC.x0-1.2)/15,LEDC.y1+.75,LEDC.z+.35,0,1,'led');
LATG.forEach((g,gi)=>{g.updateMatrixWorld(true);const L=LAT[gi];const n=new V3(0,0,1).applyQuaternion(g.quaternion);
  for(let i=0;i<6;i++){const v=new V3(-LATD.w/2+.55+i*(LATD.w-1.1)/5,LATD.y0+LATD.h+.85,.1).applyMatrix4(g.matrixWorld);pix(v.x,v.y,v.z,n.x,n.z,'lat');}
  for(let c=0;c<2;c++)for(let j=0;j<7;j++){const v=new V3(L.lado*(LATD.w/2+1.45+c*.75),LATD.y0+.6+j*1.42,.1).applyMatrix4(g.matrixWorld);pix(v.x,v.y,v.z,n.x,n.z,'col');}});
const pixCaixa=new THREE.InstancedMesh(new THREE.BoxGeometry(.56,.56,.3),P.preto,PIX.length);
const pixFace=new THREE.InstancedMesh(new THREE.PlaneGeometry(.42,.42),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),PIX.length);
{const o=new THREE.Object3D();PIX.forEach((f,i)=>{o.position.copy(f.p);o.lookAt(f.p.clone().add(f.n));o.updateMatrix();pixCaixa.setMatrixAt(i,o.matrix);o.position.addScaledVector(f.n,.16);o.updateMatrix();pixFace.setMatrixAt(i,o.matrix);pixFace.setColorAt(i,new THREE.Color(0,0,0));});scene.add(pixCaixa,pixFace);}
// moving heads: feixes de luz na fumaça
const texFeixe2=ctex(64,256,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.6,'rgba(255,255,255,.18)');g.addColorStop(1,'rgba(255,255,255,.9)');c.fillStyle=g;c.fillRect(0,0,w,h);
  const g2=c.createLinearGradient(0,0,w,0);g2.addColorStop(0,'rgba(0,0,0,1)');g2.addColorStop(.3,'rgba(0,0,0,.35)');g2.addColorStop(.5,'rgba(0,0,0,0)');g2.addColorStop(.7,'rgba(0,0,0,.35)');g2.addColorStop(1,'rgba(0,0,0,1)');c.globalCompositeOperation='destination-out';c.fillStyle=g2;c.fillRect(0,0,w,h);},false);
const MH=[];
/* feixe volumétrico: denso no eixo do cone, cai com a distância e atravessa a fumaça (ruído 3D que sobe devagar) */
const FEIXE_U={uT:{value:0},uFum:{value:1}};
function matFeixe(){const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false,
  uniforms:{uCor:{value:new THREE.Color('#ffffff')},uOp:{value:0},uT:FEIXE_U.uT,uFum:FEIXE_U.uFum},
  vertexShader:'varying vec3 vL;varying vec3 vW;varying vec3 vN;void main(){vL=position;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform vec3 uCor;uniform float uOp,uT,uFum;varying vec3 vL;varying vec3 vW;varying vec3 vN;${GLSL_N3}
    void main(){float t=clamp(-vL.y,0.,1.);vec3 v=normalize(cameraPosition-vW);float e=abs(dot(normalize(vN),v));
      float nucleo=pow(e,3.2)*.8+pow(e,16.)*.5;
      float ao_longo=smoothstep(0.,.02,t)*pow(1.-t,1.5)*(.3+.7/(1.+t*7.));
      float fum=mix(1.,.25+1.1*gn(vW*.2+vec3(0.,-uT*.15,uT*.06))*(.55+.45*gn(vW*.75+vec3(uT*.08,uT*.03,0.))),uFum);
      float chao=smoothstep(0.,1.5,vW.y);
      gl_FragColor=vec4(uCor*uOp*ao_longo*nucleo*fum*chao*2.4,1.);}`});m.color=m.uniforms.uCor.value;m.opacity=0;return m;}
{const geo=new THREE.CylinderGeometry(.09,1,1,40,24,true);geo.translate(0,-.5,0);
 const add=(x,y,z,tipo,i)=>{const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);bx(g,P.pretoMet,-.22,-.05,-.22,.22,.35,.22);const cab=new THREE.Group();g.add(cab);bx(cab,P.preto,-.2,-.42,-.2,.2,0,.2);
   const lente=new THREE.Mesh(new THREE.CircleGeometry(.14,16),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}));lente.position.y=-.43;lente.rotation.x=Math.PI/2;cab.add(lente);
   const mat=matFeixe();const f=new THREE.Mesh(geo,mat);f.scale.set(1.6,tipo==='chao'?46:36,1.6);f.position.y=-.4;cab.add(f);f.onBeforeRender=()=>{mat.uniforms.uOp.value=mat.opacity;};
   if(tipo==='chao'){g.rotation.x=Math.PI;}
   MH.push({g,cab,f,mat,lente,tipo,i,x});};
 for(let i=0;i<12;i++)add(-19+i*38/11,YC-.55,-1.2,'frente',i);
 for(let i=0;i<8;i++)add(-15+i*30/7,YC-.55,-9.2,'meio',i);
 for(let i=0;i<8;i++){const lado=i<4?-1:1;add(lado*(5.5+(i%4)*1.9),H+.05+(i%4)*1.25+1.25,-12.6,'chao',i);}}
/* luzes que iluminam de verdade */
const hemiP=new THREE.HemisphereLight('#3a3f66','#0b0a0c',.25);scene.add(hemiP);
const seguidor=new THREE.SpotLight('#fff4e6',0,90,.07,.5,1.2);seguidor.position.set(0,15.5,PONTO.z+6);seguidor.target.position.copy(TOPO_ART).add(new V3(0,1,0));scene.add(seguidor,seguidor.target);
const lavagem=[];for(const [x,z,tx,tz] of [[-12,-1.2,-3,-6],[12,-1.2,3,-6],[-5,-1.2,0,-10],[5,-1.2,0,-10]]){const s=new THREE.SpotLight('#ffffff',0,70,.42,.7,1.3);s.position.set(x,YC-.8,z);s.target.position.set(tx,H+2,tz);scene.add(s,s.target);lavagem.push(s);}
const luzFogo=[-1,1].map(l=>{const p=new THREE.PointLight('#ff8a30',0,26,1.6);p.position.set(l*(ESC.w/2+.5),ESC.topo-1,-6.5);scene.add(p);return p;});
if(!lowGPU){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;seguidor.castShadow=true;seguidor.shadow.mapSize.set(1024,1024);seguidor.shadow.bias=-.0005;
  for(const d of DEGRAUS)d.receiveShadow=true;palco.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});}
/* ================= FOGO nos guarda-corpos da escadaria ================= */
const FOGO_U={uT:{value:0},uK:{value:0},uJato:{value:0}};
/* chama: volume percorrido por raios dentro de uma caixa por queimador (ruído 3D subindo, temperatura -> cor de corpo negro) */
const fogo=(()=>{const n=FOGO_POS.length;const g=new THREE.InstancedBufferGeometry();const bxg=new THREE.BoxGeometry(1,1,1);bxg.translate(0,.5,0);g.index=bxg.index;g.setAttribute('position',bxg.attributes.position);g.instanceCount=n;
  const a=new Float32Array(n*4);FOGO_POS.forEach((p,i)=>a.set([p.x,p.y+.15,p.z,Math.random()],i*4));g.setAttribute('aP',new THREE.InstancedBufferAttribute(a,4));
  const PASSOS=lowGPU?14:30;
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:FOGO_U,
    vertexShader:`attribute vec4 aP;uniform float uK,uJato,uT;varying vec3 vL;varying vec3 vC;varying float vS;varying vec3 vEsc;
      void main(){vS=aP.w;float h=(2.6+3.8*uJato)*max(uK,.001)*(.9+.15*sin(uT*5.+aP.w*20.));float w=1.05+.5*uJato;vEsc=vec3(w,h,w);
        vec3 p=aP.xyz+position*vEsc;vL=position;vC=(cameraPosition-aP.xyz)/vEsc;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`,
    fragmentShader:`uniform float uT,uK,uJato;varying vec3 vL;varying vec3 vC;varying float vS;varying vec3 vEsc;${GLSL_N3}
      float fbm3(vec3 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*gn(p);p=p*2.07+vec3(1.7,9.2,3.1);a*=.5;}return s;}
      vec2 caixa(vec3 o,vec3 d){vec3 inv=1./d;vec3 t0=(vec3(-.5,0.,-.5)-o)*inv,t1=(vec3(.5,1.,.5)-o)*inv;vec3 a=min(t0,t1),b=max(t0,t1);return vec2(max(max(a.x,a.y),a.z),min(min(b.x,b.y),b.z));}
      vec3 corpoNegro(float t){t=clamp(t,0.,1.);return mix(mix(vec3(.35,.03,0.),vec3(1.3,.32,.03),smoothstep(0.,.5,t)),vec3(1.9,1.05,.32),smoothstep(.55,1.,t));}
      void main(){if(uK<.01)discard;vec3 o=vC;vec3 d=normalize(vL-vC);vec2 tt=caixa(o,d);float t0=max(tt.x,0.),t1=tt.y;if(t1<=t0)discard;
        float dt=(t1-t0)/${PASSOS}.;vec3 acc=vec3(0.);float tr=1.;float tm=uT*1.9;
        for(int i=0;i<${PASSOS};i++){vec3 p=o+d*(t0+dt*(float(i)+.5));float y=p.y;
          vec3 q=vec3(p.x*vEsc.x,y*vEsc.y,p.z*vEsc.z);
          float turb=fbm3(vec3(q.x*2.2,q.y*1.3-tm*1.5,q.z*2.2)+vS*13.);
          float t2=fbm3(vec3(q.x*5.,q.y*2.6-tm*2.8,q.z*5.)+vS*7.);
          float lag=(turb-.5)*1.1*y;vec2 xz=p.xz+vec2(lag,lag*.7)+(t2-.5)*.25*y;
          float R=.4*pow(max(1.-y,0.),.5)*(.7+.45*turb)+.05;
          float dens=smoothstep(R,R*.15,length(xz))*smoothstep(0.,.04,y);
          dens*=smoothstep(.3,.62,t2*.6+turb*.6+(1.-y)*.35-.12);
          float T=dens*(1.-y*1.05)+.08;
          vec3 c=corpoNegro(T*.95);acc+=c*dens*tr*dt*5.;tr*=1.-dens*dt*1.4;if(tr<.03)break;}
        gl_FragColor=vec4(acc*uK,1.);}`});
  const me=new THREE.Mesh(g,m);me.frustumCulled=false;scene.add(me);
  // fagulhas subindo
  const N=lowGPU?160:420,pp=new Float32Array(N*3),ss=new Float32Array(N);const r=rng(55);for(let i=0;i<N;i++){const f=FOGO_POS[i%FOGO_POS.length];pp.set([f.x,f.y+.2,f.z],i*3);ss[i]=r();}
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pp,3));gg.setAttribute('aS',new THREE.BufferAttribute(ss,1));
  const pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:FOGO_U,
    vertexShader:'attribute float aS;uniform float uT,uK,uJato;varying float vA;void main(){float t=fract(uT*(.35+aS*.4)+aS*7.);vec3 q=position+vec3(sin(aS*40.+uT*2.)*.35*t,t*(3.5+3.*uJato)*(.6+aS),cos(aS*31.+uT*1.7)*.35*t);vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;vA=uK*(1.-t)*(1.-t)*step(.4,fract(aS*13.));gl_PointSize=max(1.,(1.5+aS*2.)*30./-mv.z);}',
    fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(2.4,1.1,.3)*vA*(1.-d*2.),1.);}'});
  const pt=new THREE.Points(gg,pm);pt.frustumCulled=false;scene.add(pt);me.userData.fag=pt;return me;})();
/* ================= FUMAÇA: baixa no piso do palco e névoa no ar ================= */
const FUM_U={uT:{value:0},uCor:{value:new THREE.Color('#7f78c8')},uK:{value:.7}};
const fumacaBaixa=(()=>{const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:FUM_U,
  vertexShader:'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform float uT,uK;uniform vec3 uCor;varying vec3 vW;${GLSL_RUIDO}void main(){vec2 p=vW.xz*.12;float n=fbm(p+vec2(uT*.03,uT*.02)+fbm(p*1.3-uT*.02));float a=smoothstep(.35,.8,n)*uK;
    float bord=smoothstep(21.,15.,abs(vW.x))*smoothstep(1.,-3.,vW.z)*smoothstep(-16.,-12.,vW.z);gl_FragColor=vec4(uCor*(.6+n*.8),a*bord*.55);}`});
  const g=new THREE.Group();for(let k=0;k<3;k++){const pl=new THREE.Mesh(new THREE.PlaneGeometry(44,18),m);pl.rotation.x=-Math.PI/2;pl.position.set(0,H+.15+k*.28,-7);g.add(pl);}scene.add(g);return g;})();
const NEVOA=[];
for(const [x,y,z,s] of [[-8,7,-6,26],[8,7,-6,26],[0,10,-10,30],[0,5,4,34],[-14,4,12,30],[14,4,12,30],[0,12,-2,40]]){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:texGlow,color:'#7f78c8',transparent:true,opacity:.05,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));sp.position.set(x,y,z);sp.scale.set(s,s*.7,1);scene.add(sp);NEVOA.push(sp);}
/* ================= LANTERNAS DE CELULAR NA PISTA ================= */
const celulares=(()=>{const L=PUB.filter(p=>p.anim===AID.filmando||Math.random()<.06);const n=L.length,pos=new Float32Array(n*3),s=new Float32Array(n);L.forEach((p,i)=>{pos.set([p.x+Math.sin(p.yaw||0)*.3,1.95+Math.random()*.25,p.z+Math.cos(p.yaw||0)*.3],i*3);s[i]=Math.random();});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aS',new THREE.BufferAttribute(s,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uK:{value:0},uT:{value:0}},
    vertexShader:'attribute float aS;uniform float uK,uT;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;vA=uK*(.7+.3*sin(uT*2.+aS*30.));gl_PointSize=max(1.5,26./-mv.z);}',
    fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vec3(1.4,1.4,1.5)*vA*(1.-d*2.),1.);}'});
  const pt=new THREE.Points(g,m);pt.frustumCulled=false;scene.add(pt);return pt;})();
/* ================= PAPEL PICADO DOURADO (clímax do Castelo) ================= */
const CONF_U={uT0:{value:-100},uT:{value:0}};
const confete=(()=>{const n=lowGPU?1200:3000,p=new Float32Array(n*3),s=new Float32Array(n);const r=rng(71);for(let i=0;i<n;i++){p.set([(r()-.5)*44,0,-12+r()*42],i*3);s[i]=r();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('aS',new THREE.BufferAttribute(s,1));
  const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:CONF_U,
    vertexShader:'attribute float aS;uniform float uT0,uT;varying float vA;varying float vB;void main(){float t=uT-uT0;vec3 q=position;q.y=19.-t*(1.1+aS*.9);q.x+=sin(t*1.3+aS*30.)*1.2;q.z+=cos(t*.9+aS*20.)*1.;vA=(t>0.&&q.y>0.)?1.:0.;vB=.5+.5*sin(t*9.+aS*60.);vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.,140./-mv.z);}',
    fragmentShader:'varying float vA;varying float vB;void main(){if(vA<.5)discard;vec2 q=abs(gl_PointCoord-.5);if(q.x>.5*vB+.08||q.y>.32)discard;gl_FragColor=vec4(vec3(1.,.78,.36)*(.6+1.6*vB),1.);}'});
  const pt=new THREE.Points(g,m);pt.frustumCulled=false;scene.add(pt);return pt;})();
/* ================= LINHA DO TEMPO DO SHOW ================= */
const DUR_U=24;                         // cada universo dura dois loops de LED
const LUZ=[
  {feixe:'#b9b2ff',feixe2:'#ffffff',pix:'#8d7dff',pixK:.25,fogo:.7,fum:'#6f66c8',wash:'#7e76ff',washI:2.2,hemi:'#3a3f66',seg:2.6},
  {feixe:'#ffb070',feixe2:'#ff6a2a',pix:'#ff2a10',pixK:1,fogo:.3,fum:'#b4552a',wash:'#ff8a4a',washI:2.6,hemi:'#4a2a20',seg:2.2},
  {feixe:'#ffd28a',feixe2:'#fff1c8',pix:'#ffcf7a',pixK:.9,fogo:1,fum:'#c8913a',wash:'#ffc26a',washI:2.2,hemi:'#4a3a20',seg:2.6},
];
let tShow=0,tocando=true;
const LE={feixe:new THREE.Color('#b9b2ff'),feixe2:new THREE.Color('#ffffff'),pix:new THREE.Color('#8d7dff'),fum:new THREE.Color('#6f66c8'),wash:new THREE.Color('#7e76ff'),hemi:new THREE.Color('#3a3f66'),pixK:.25,fogo:.7,washI:2.2,seg:2.6};
const camadas={publico:true,fumaca:true,fogo:true,pixels:false};
function univAtual(){return Math.floor(tShow/DUR_U)%3;}
let confeteFeito=-1;
function atualizaShow(dt,t){if(tocando)tShow=(tShow+dt)%(DUR_U*3);const ui=univAtual(),tu=tShow%DUR_U,tLoop=tShow%LOOP;const A=UNIV[ui],L=LUZ[ui];
  aplicaUniv(A,Math.min(1,dt*1.1),dt);atualizaMundo(tLoop,dt);
  const k=Math.min(1,dt*1.5);LE.feixe.lerp(_c.set(L.feixe),k);LE.feixe2.lerp(_c.set(L.feixe2),k);LE.pix.lerp(_c.set(L.pix),k);LE.fum.lerp(_c.set(L.fum),k);LE.wash.lerp(_c.set(L.wash),k);LE.hemi.lerp(_c.set(L.hemi),k);
  for(const a of ['pixK','fogo','washI','seg'])LE[a]+=(L[a]-LE[a])*k;
  const bpm=ui===1?78:ui===0?84:96,bt=tShow*bpm/60,fase=bt%1,batida=Math.pow(1-fase,6);const flash=MU.uFlash.value;
  crowdU.uFreq.value=6.2832*bpm/60;crowdU.uEnergy.value=ui===2?1:ui===1?.45:.6;crowdU.uTime.value=t;if(tocando)GU.uBeat.value+=dt*bpm/60;GU.uTempo.value=t;animaPublico(ui,t,dt);GU.uRim.value.copy(LE.wash).multiplyScalar(.18);
  // refletores em quadrado
  const cc=new THREE.Color();PIX.forEach((f,i)=>{let v=LE.pixK;if(ui===1){v*=f.grupo==='col'?(.35+.65*(Math.sin(bt*Math.PI/2-f.p.y*.6)>.2?1:0)):f.grupo==='teto'?.8+.2*Math.sin(bt*3.14+f.p.x*.3):1;}
    else if(ui===2){v*=f.grupo==='led'||f.grupo==='lat'?(.25+.75*batida):(.4+.6*Math.max(0,Math.sin(bt*3.14159*.5+f.p.x*.25)));}
    else v*=.5+.5*Math.sin(t*.8+f.p.x*.2);v+=flash*3;cc.copy(LE.pix).multiplyScalar(v*3.2);if(flash>.05)cc.lerp(_c.setRGB(4,4,4.4),Math.min(1,flash));pixFace.setColorAt(i,cc);});pixFace.instanceColor.needsUpdate=true;
  // moving heads
  for(const m of MH){let pan=0,tilt=0,op=.0,cor=LE.feixe;const ph=m.i*.6;
    if(m.tipo==='chao'){tilt=(ui===0?.18:ui===1?.32:.25)*(m.x<0?1:-1)+Math.sin(t*.45+ph)*(ui===2?.35:.12);pan=Math.sin(t*.3+ph)*.25;op=ui===1?.22:.32;cor=ui===2?LE.feixe2:LE.feixe;}
    else if(m.tipo==='frente'){tilt=ui===0?.55+Math.sin(t*.35+ph)*.25:ui===1?.42+(m.i%2?.12:-.12):.35+Math.sin(t*1.6+ph)*.45;pan=ui===2?Math.sin(t*1.1+ph)*.6:(m.x/40)*(ui===1?-.8:.5);op=ui===1?.16:.22;cor=m.i%2?LE.feixe2:LE.feixe;}
    else{tilt=.12+Math.sin(t*.6+ph)*.2;pan=Math.sin(t*.5+ph)*.4;op=ui===0?.24:.14;}
    if(ui===2)op*=.7+.6*batida;op+=flash*.25;
    m.cab.rotation.set(tilt,0,pan);m.mat.color.copy(cor);m.mat.opacity=camadas.fumaca?op:op*.35;m.lente.material.color.copy(cor).multiplyScalar(2+op*8);}
  // luzes reais
  hemiP.color.copy(LE.hemi);hemiP.intensity=.35+flash*2;
  seguidor.intensity=LE.seg*(1+flash*.5);for(const s of lavagem){s.color.copy(LE.wash);s.intensity=LE.washI*(ui===2?.75+.4*batida:1)+flash*7;}
  // fogo
  let fk=camadas.fogo?LE.fogo:0,jato=0;if(ui===2){jato=Math.max(0,Math.sin(bt*Math.PI/2))>.9?1:0;}if(ui===0){jato=flash>.3?1:0;}
  FOGO_U.uT.value=t;FOGO_U.uK.value=fk;FEIXE_U.uT.value=t;FEIXE_U.uFum.value=camadas.fumaca?1:.4;fogo.userData.fag.visible=fk>.01;if(composer&&composer.userData)composer.userData.acab.uniforms.uT.value=t;FOGO_U.uJato.value+=(jato-FOGO_U.uJato.value)*Math.min(1,dt*(jato?14:3));
  luzFogo.forEach((l,i)=>{l.intensity=fk*(1.2+2.6*FOGO_U.uJato.value)*(.85+.3*Math.sin(t*17+i*3));});
  // fumaça
  FUM_U.uT.value=t;FUM_U.uCor.value.copy(LE.fum);FUM_U.uK.value=camadas.fumaca?(ui===0?1:.65):0;fumacaBaixa.visible=camadas.fumaca;
  for(const n of NEVOA){n.material.color.copy(LE.fum);n.material.opacity=camadas.fumaca?.06+flash*.08:0;}
  scene.fog.color.copy(LE.fum).multiplyScalar(.06);
  // papel picado no meio do Castelo
  CONF_U.uT.value=t;if(ui!==2)confeteFeito=-1;if(ui===2&&tu>8&&confeteFeito<0){confeteFeito=1;CONF_U.uT0.value=t;}
  celulares.material.uniforms.uT.value=t;celulares.material.uniforms.uK.value+=((ui===0?1:ui===1?.25:.1)*(camadas.publico?1:0)-celulares.material.uniforms.uK.value)*Math.min(1,dt);celulares.visible=celulares.material.uniforms.uK.value>.02;
  luzesArq.material.uniforms.uT.value=t;luzesArq.material.uniforms.uK.value=ui===0?.75:ui===1?.35:.55;
  return {ui,tu,tLoop};}


scene.traverse(o=>{const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];for(const m of ms)if(m.isMeshStandardMaterial&&!m.userData.envFixo)m.envMapIntensity=m.metalness>=.5?1:(m.roughness<.3?.8:.1);});

/* ================= REFLEXO DO PISO DO PALCO (plano espelhado, só no computador) =================
   A cena é renderizada de uma câmera espelhada em meia resolução; o piso lê esse quadro com desfoque pela rugosidade. */
const espelho=(()=>{if(lowGPU)return null;
  const rt=new THREE.WebGLRenderTarget(512,256,{type:THREE.HalfFloatType});rt.texture.generateMipmaps=true;rt.texture.minFilter=THREE.LinearMipmapLinearFilter;
  const cam=new THREE.PerspectiveCamera(),texM=new THREE.Matrix4(),nrm=new V3(0,1,0),pm=new V3(0,H,0),plano=new THREE.Plane(),clip=new THREE.Vector4(),q=new THREE.Vector4(),rot=new THREE.Matrix4(),la=new V3(),alvo=new V3(),vw=new V3();
  const U={tRef:{value:rt.texture},uTexM:{value:texM},uRefK:{value:1}};
  const m=P.piso;m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec4 vRefUv;uniform mat4 uTexM;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvRefUv=uTexM*(modelMatrix*vec4(transformed,1.));');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec4 vRefUv;uniform sampler2D tRef;uniform float uRefK;')
      .replace('#include <output_fragment>',`{vec3 vd=normalize(vViewPosition);float fr=.04+.96*pow(1.-clamp(dot(normal,vd),0.,1.),5.);vec2 ru=vRefUv.xy/vRefUv.w+normal.xz*.035;
        float lod=roughnessFactor*7.;vec3 rc=textureLod(tRef,ru,lod).rgb;outgoingLight+=rc*mix(.12,1.,fr)*(1.-roughnessFactor*.75)*uRefK;}
        #include <output_fragment>`);};
  m.customProgramCacheKey=()=>'pisoRef';
  function render(cam0){const cw=new V3().setFromMatrixPosition(cam0.matrixWorld);vw.subVectors(pm,cw);if(vw.dot(nrm)>0)return;
    vw.reflect(nrm).negate().add(pm);rot.extractRotation(cam0.matrixWorld);la.set(0,0,-1).applyMatrix4(rot).add(cw);alvo.subVectors(pm,la).reflect(nrm).negate().add(pm);
    cam.position.copy(vw);cam.up.set(0,1,0).applyMatrix4(rot).reflect(nrm);cam.lookAt(alvo);cam.far=cam0.far;cam.updateMatrixWorld();cam.projectionMatrix.copy(cam0.projectionMatrix);
    texM.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    plano.setFromNormalAndCoplanarPoint(nrm,pm).applyMatrix4(cam.matrixWorldInverse);clip.set(plano.normal.x,plano.normal.y,plano.normal.z,plano.constant);
    const e=cam.projectionMatrix.elements;q.set((Math.sign(clip.x)+e[8])/e[0],(Math.sign(clip.y)+e[9])/e[5],-1,(1+e[10])/e[14]);clip.multiplyScalar(2/clip.dot(q));e[2]=clip.x;e[6]=clip.y;e[10]=clip.z+1-.003;e[14]=clip.w;
    const vis=[pisoPalco.visible,gPub.visible,celulares.visible];pisoPalco.visible=false;gPub.visible=false;celulares.visible=false;for(const F of FIGS)if(F)F.visible=false;
    const at=renderer.getRenderTarget();renderer.setRenderTarget(rt);renderer.clear();renderer.render(scene,cam);renderer.setRenderTarget(at);
    pisoPalco.visible=vis[0];gPub.visible=vis[1];celulares.visible=vis[2];for(const F of FIGS)if(F)F.visible=camadas.publico;}
  return {render,rt};})();
/* ================= PÓS-PROCESSAMENTO: brilho (bloom) ================= */
let composer=null;
try{if(!THREE.EffectComposer||!THREE.UnrealBloomPass)throw 0;
  const sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,samples:(renderer.capabilities.isWebGL2&&!lowGPU)?4:0});
  composer=new THREE.EffectComposer(renderer,rt);
  composer.addPass(new THREE.RenderPass(scene,camera));
  composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(stage.clientWidth,stage.clientHeight),lowGPU?.5:.58,.55,.8));
  const acab=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},uT:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D tDiffuse;uniform float uT;varying vec2 vUv;float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\nvoid main(){vec2 d=vUv-.5;float ca=.0022*dot(d,d)*4.;vec4 c=texture2D(tDiffuse,vUv);c.r=texture2D(tDiffuse,vUv+d*ca).r;c.b=texture2D(tDiffuse,vUv-d*ca).b;c.rgb*=1.-.3*pow(length(d)*1.3,2.4);c.rgb+=(hs(vUv*1000.+fract(uT)*61.)-.5)*.014;gl_FragColor=c;\n#include <encodings_fragment>\n}'});
  composer.addPass(acab);composer.userData={acab};
}catch(e){composer=null;}
/* ================= CÂMERAS ================= */
camera.near=.2;camera.far=2000;camera.updateProjectionMatrix();scene.fog=new THREE.FogExp2('#06060a',.0035);scene.background=new THREE.Color('#040406');
const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=2.05;controls.minDistance=2;controls.maxDistance=180;controls.screenSpacePanning=true;
const CAMS=[
  {id:'ponto',nome:'Ponto ideal',sub:'mesa de som',p:[PONTO.x,PONTO.y,PONTO.z],l:[0,7.4,-13],fov:40,leg:'Daqui a escada continua dentro do LED',ver:'O conteúdo do LED foi feito para este ponto de vista.'},
  {id:'frente',nome:'Frontal',sub:'fundo da pista',p:[0,11,66],l:[0,8,-6],fov:38,leg:'Frontal',ver:'O palco inteiro, os três LEDs e a cobertura.'},
  {id:'esq',nome:'Lateral esquerda',sub:'45°',p:[-34,7.5,15],l:[-1,7.5,-8],fov:40,leg:'Lateral esquerda',ver:'De lado, a ilusão do LED se desfaz: dá para ver onde termina a pedra e começa a tela.'},
  {id:'dir',nome:'Lateral direita',sub:'45°',p:[34,7.5,15],l:[1,7.5,-8],fov:40,leg:'Lateral direita',ver:'Fogo nos guarda-corpos, banda nos praticáveis e o LED lateral.'},
  {id:'pista',nome:'Na grade',sub:'primeira fila',p:[3.5,1.7,6.5],l:[0,7.8,-10],fov:58,leg:'Na grade',ver:'O que a primeira fila vê: a escadaria e o LED ocupando tudo.'},
  {id:'drone',nome:'Drone',sub:'aéreo',p:[30,36,52],l:[0,6,-4],fov:38,leg:'Drone',ver:'Feixes na fumaça, público e estrutura da cobertura.'},
  {id:'artista',nome:'Do palco',sub:'topo da escada',p:[.7,ESC.topo+1.7,TOPO_ART.z+.5],l:[0,3,40],fov:62,leg:'Do topo da escada',ver:'A visão do artista: a pista e as luzes de celular no estádio.'},
];
const camsEl=document.getElementById('cams');
for(const c of CAMS){const b=document.createElement('button');b.dataset.c=c.id;b.innerHTML=`${c.nome}<small>${c.sub}</small>`;b.setAttribute('aria-pressed','false');b.onclick=()=>{auto=false;bSeq.setAttribute('aria-pressed','false');document.body.classList.remove('cine');irCam(c.id);};camsEl.appendChild(b);}
let camAtual='ponto',tween=null;const look=new V3();
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function irCam(id,dur){const c=CAMS.find(x=>x.id===id);camAtual=id;camsEl.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===id));
  tween={p0:camera.position.clone(),l0:controls.target.clone(),f0:camera.fov,p1:new V3(...c.p),l1:new V3(...c.l),f1:c.fov*(camera.aspect<1&&id!=='artista'?1.45:1),t:0,d:dur===undefined?2.2:dur};legenda(c.leg,c.ver);}
function legenda(t,s){const el=document.getElementById('legenda');document.getElementById('legT').textContent=t;document.getElementById('legS').textContent=s||'';el.classList.remove('off');clearTimeout(legenda.tm);legenda.tm=setTimeout(()=>el.classList.add('off'),6000);}
/* câmera automática: planos de 6 s que se movem devagar, como uma pré-visualização filmada */
const PLANOS=[
  {p0:[0,4.2,32],p1:[0,4.6,24],l0:[0,7.4,-13],l1:[0,7.8,-13],fov:40},
  {p0:[-30,3,18],p1:[-18,9,10],l0:[0,6,-8],l1:[0,8,-10],fov:36},
  {p0:[.9,ESC.topo+1.6,TOPO_ART.z+.6],p1:[-.6,ESC.topo+1.9,TOPO_ART.z+.8],l0:[3,3,40],l1:[-3,3,40],fov:60},
  {p0:[6,1.6,5],p1:[2,2.2,5.5],l0:[0,8,-10],l1:[0,9,-10],fov:56},
  {p0:[0,ESC.topo+1.4,TOPO_ART.z+7.5],p1:[0,ESC.topo+1.6,TOPO_ART.z+5.2],l0:[0,ESC.topo+1.4,TOPO_ART.z],l1:[0,ESC.topo+1.5,TOPO_ART.z],fov:28},
  {p0:[34,30,44],p1:[14,24,52],l0:[0,6,-5],l1:[0,7,-6],fov:38},
  {p0:[22,5,6],p1:[30,7,16],l0:[0,6,-8],l1:[0,7,-8],fov:38},
  {p0:[0,13,70],p1:[0,9,50],l0:[0,8,-6],l1:[0,8,-8],fov:36},
];
let auto=false,autoT=0;const bSeq=document.getElementById('bSeq');
bSeq.onclick=()=>{auto=!auto;autoT=0;bSeq.setAttribute('aria-pressed',auto);document.body.classList.toggle('cine',auto);if(auto){tween=null;camsEl.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));legenda('Câmera automática','Planos de pré-visualização em sequência. Toque numa câmera para sair.');}};
function planoAuto(dt){autoT+=dt;const D=6.5;const i=Math.floor(autoT/D)%PLANOS.length,u=(autoT%D)/D;const S=PLANOS[i];const k=u*u*(3-2*u)*.6+u*.4;
  camera.position.set(...S.p0).lerp(new V3(...S.p1),k);look.set(...S.l0).lerp(new V3(...S.l1),k);camera.fov=S.fov*(camera.aspect<1?1.45:1);camera.updateProjectionMatrix();camera.lookAt(look);controls.target.copy(look);}
/*MONTAGEM*/
/* ================= LINHA DO TEMPO / CAMADAS / MODOS ================= */
const univBtns=[...document.querySelectorAll('#universos button')];
univBtns.forEach(b=>b.onclick=()=>{tShow=+b.dataset.i*DUR_U+.01;});
const bPlay=document.getElementById('bPlay');
function iconePlay(){bPlay.innerHTML=tocando?'<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9"/><rect x="7" y="1.5" width="3" height="9"/></svg>':'<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2.5 1.5l8 4.5-8 4.5z"/></svg>';bPlay.setAttribute('aria-label',tocando?'Pausar':'Tocar');}
bPlay.onclick=()=>{tocando=!tocando;iconePlay();};
document.querySelectorAll('#chaves button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;camadas[k]=!camadas[k];b.setAttribute('aria-pressed',camadas[k]);aplicaCamadas();});
function aplicaCamadas(){gPub.visible=camadas.publico;for(const F of FIGS)if(F)F.visible=camadas.publico;LED_U.uGrade.value=camadas.pixels?1:0;}
let modoMidia=false;
const bPrev=document.getElementById('bPrev'),bMidia=document.getElementById('bMidia'),bInfo=document.getElementById('bInfo'),info=document.getElementById('info');
function setMidia(v){modoMidia=v;bPrev.setAttribute('aria-pressed',!v);bMidia.setAttribute('aria-pressed',v);document.body.classList.toggle('midia',v);document.getElementById('midia').hidden=!v;LED_U.uMidia.value=v?1:0;layoutMidia();}
bPrev.onclick=()=>setMidia(false);bMidia.onclick=()=>setMidia(true);
bInfo.onclick=()=>{info.hidden=!info.hidden;bInfo.setAttribute('aria-pressed',!info.hidden);};document.getElementById('infoX').onclick=()=>{info.hidden=true;bInfo.setAttribute('aria-pressed','false');};
addEventListener('keydown',e=>{if(e.key===' '&&MONT.ativo){bMPlay.click();e.preventDefault();return;}if(e.key===' '){tocando=!tocando;iconePlay();e.preventDefault();}if(['1','2','3'].includes(e.key))tShow=(+e.key-1)*DUR_U+.01;});
renderer.domElement.addEventListener('pointerdown',()=>{MONT.camAuto=false;if(auto){auto=false;bSeq.setAttribute('aria-pressed','false');document.body.classList.remove('cine');}tween=null;});
/* ================= MODO MÍDIA DO LED: o conteúdo como sai para o servidor de mídia ================= */
const midiaCena=new THREE.Scene();midiaCena.background=new THREE.Color('#0b0a09');
const midiaCam=new THREE.OrthographicCamera(0,1,1,0,-1,1);
const mPlC=new THREE.Mesh(new THREE.PlaneGeometry(1,1),matCentral),mPlL=new THREE.Mesh(new THREE.PlaneGeometry(1,1),matLat[0]),mPlR=new THREE.Mesh(new THREE.PlaneGeometry(1,1),matLat[1]);midiaCena.add(mPlC,mPlL,mPlR);
const midiaEl=document.getElementById('midia');let midiaPura=false;
function layoutMidia(){const W=innerWidth,Hh=innerHeight;midiaCam.left=0;midiaCam.right=W;midiaCam.top=Hh;midiaCam.bottom=0;midiaCam.updateProjectionMatrix();
  if(midiaPura){mPlC.scale.set(W,Hh,1);mPlC.position.set(W/2,Hh/2,0);mPlL.visible=mPlR.visible=false;midiaEl.innerHTML='';return;}
  mPlL.visible=mPlR.visible=true;const estreito=W<820;const topo=estreito?150:110,base=estreito?120:110;const disp=Hh-topo-base;
  let cw=Math.min(W-32,estreito?W-32:W*.62),ch=cw/2;let sh=estreito?Math.min(disp-ch-40,(W-48)/2/.647):ch*1.08,sw=sh*.647;
  if(!estreito&&ch>disp-10){ch=disp-10;cw=ch*2;sh=ch*1.08;sw=sh*.647;}
  let cx,cy,lx,rx,sy;
  if(estreito){cx=W/2;cy=Hh-topo-ch/2;sy=cy-ch/2-30-sh/2;lx=W/2-sw/2-8;rx=W/2+sw/2+8;}
  else{const tot=sw+18+cw+18+sw;const x0=(W-tot)/2;lx=x0+sw/2;cx=x0+sw+18+cw/2;rx=cx+cw/2+18+sw/2;cy=Hh-topo-disp/2;sy=cy;}
  mPlC.scale.set(cw,ch,1);mPlC.position.set(cx,cy,0);mPlL.scale.set(sw,sh,1);mPlL.position.set(lx,sy,0);mPlR.scale.set(sw,sh,1);mPlR.position.set(rx,sy,0);
  const rot=(x,y,html,al)=>`<div class="rot" style="left:${x}px;top:${Hh-y}px;transform:translate(${al==='c'?'-50%':'0'},0)">${html}</div>`;
  midiaEl.innerHTML=rot(cx,cy-ch/2-10,`<b>LED central</b> · ex.: 5120 × 2560 px · loop de ${LOOP} s · perspectiva para o ponto ideal`,'c')+
    rot(lx,sy-sh/2-10,'<b>Lateral E</b> · câmera ao vivo + moldura','c')+rot(rx,sy-sh/2-10,'<b>Lateral D</b> · câmera ao vivo + moldura','c');}
addEventListener('resize',layoutMidia);
/* ================= LAÇO ================= */
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(w,h);}camera.aspect=w/h;camera.updateProjectionMatrix();vista();}
addEventListener('resize',resize);
const relogio=new THREE.Clock();let frame=0,ultLOD=-1,congelado=false,erroLoop=0;
const R_VIS=R_PERTO+16;
function lodPublico(){if(!MONT.ativo)pubG.lod(camera);palcoG.lod(camera,true);if(MONT.ativo)trabG.lod(camera,true);FIG_U.uNear.value=R_PERTO;FIG_U.uFar.value=400;}
const imagT=[0,0];
function renderImag(t){const i=frame%2;const c=camImag[i];const a=TOPO_ART;
  if(i===0){c.position.set(-1.5+Math.sin(t*.21)*.25,ESC.topo+1.05+Math.sin(t*.37)*.05,a.z+6.2);c.lookAt(a.x+.1,ESC.topo+1.35,a.z);}
  else{c.position.set(2.2+Math.sin(t*.17)*.15,ESC.topo+1.75,a.z+4.6+Math.sin(t*.29)*.1);c.lookAt(a.x,ESC.topo+1.55,a.z);}
  const vis=gPub.visible;gPub.visible=false;for(const F of FIGS)if(F)F.visible=false;
  renderer.setRenderTarget(rtImag[i]);renderer.render(scene,c);renderer.setRenderTarget(null);
  gPub.visible=vis;for(const F of FIGS)if(F)F.visible=camadas.publico;}
function loop(){try{passo();}catch(e){if(erroLoop++<3)console.error('[palco]',e&&e.message,e&&e.stack);}requestAnimationFrame(loop);}
function passo(){if(congelado)return;const dt=Math.min(.05,relogio.getDelta()),t=relogio.elapsedTime;frame++;
  const S=atualizaShow(dt,t);
  univBtns.forEach((b,i)=>{b.setAttribute('aria-pressed',i===S.ui);b.querySelector('i').style.width=(i===S.ui?S.tu/DUR_U*100:0)+'%';});
  if(MONT.ativo)atualizaMontagem(dt,t);
  if(MONT.ativo&&MONT.camAuto&&!tween)camMontagem(dt,t);
  else if(auto)planoAuto(dt);
  else if(tween){if(tween.t===0)ultLOD=-1;tween.t+=dt/tween.d;const k=ease(Math.min(1,tween.t));camera.position.lerpVectors(tween.p0,tween.p1,k);controls.target.lerpVectors(tween.l0,tween.l1,k);camera.fov=tween.f0+(tween.f1-tween.f0)*k;camera.updateProjectionMatrix();camera.lookAt(controls.target);if(tween.t>=1)tween=null;}
  else{controls.update();if(camera.position.y<.5){camera.position.y=.5;camera.lookAt(controls.target);}}
  if(t-ultLOD>.25){ultLOD=t;lodPublico();}
  const ledVivo=!MONT.ativo||MONT.ledVivo;
  if(ledVivo&&(!lowGPU||frame%2===0))renderMundo();
  if(espelho&&!modoMidia)espelho.render(camera);
  if(ledVivo&&!modoMidia&&(!lowGPU||frame%3===0))renderImag(t);else if(modoMidia&&frame%2===0)renderImag(t);
  if(modoMidia){renderer.setRenderTarget(null);renderer.render(midiaCena,midiaCam);}
  else if(composer)composer.render(dt);else renderer.render(scene,camera);}
aplicaCamadas();resize();layoutMidia();iconePlay();
{const c=CAMS[0];camera.position.set(...c.p);controls.target.set(...c.l);camera.fov=c.fov*(camera.aspect<1?1.45:1);camera.updateProjectionMatrix();controls.update();camsEl.querySelector('button').setAttribute('aria-pressed','true');}
renderer.compile(scene,camera);renderer.compile(mundo,camLED);
requestAnimationFrame(()=>{loop();if(!lowGPU)setTimeout(()=>baixa(PASTA_GENTE+'gente-hi.bin.gz').then(u=>{GH=u;ultLOD=-1;}).catch(e=>console.warn('[palco] nível alto',e)),400);setTimeout(()=>{document.getElementById('carregando').classList.add('fim');legenda('Ponto ideal · mesa de som','Daqui a escada continua dentro do LED. Troque de câmera para ver o palco de outros ângulos.');},300);});
/* ganchos para testes e para exportar a mídia quadro a quadro */
window.__palco={irCam,setMidia,camadas,aplicaCamadas,get tShow(){return tShow;},setT:v=>{tShow=v;},pausa:v=>{tocando=!v;iconePlay();},auto:v=>{if(!!v!==auto)bSeq.click();},
  quadroMidia:(ui,tLoop)=>{congelado=true;midiaPura=true;document.body.classList.add('exporta');setMidia(true);misturaUniv(UNIV[ui],1);UE.rec=UNIV[ui].rec;atualizaMundo(tLoop,0);renderMundo();renderer.setRenderTarget(null);renderer.render(midiaCena,midiaCam);return renderer.domElement.toDataURL('image/png');},
  moldura:()=>texMoldura.userData.canvas.toDataURL('image/png'),tamRT:(w,h)=>{rtLED.setSize(w,h);},
  instantaneo:(ui,tu)=>{tShow=ui*DUR_U+tu;misturaUniv(UNIV[ui],1);UE.rec=UNIV[ui].rec;const L=LUZ[ui];LE.feixe.set(L.feixe);LE.feixe2.set(L.feixe2);LE.pix.set(L.pix);LE.fum.set(L.fum);LE.wash.set(L.wash);LE.hemi.set(L.hemi);for(const a of ['pixK','fogo','washI','seg'])LE[a]=L[a];},
  setMontagem,montT:v=>{MONT.t=v;},montPausa:v=>{MONT.tocando=!v;iconeMont();},montCam:v=>{MONT.camAuto=!!v;},camEtapaJa,etapas:()=>ETAPAS.map(e=>[e.id,e.ini,e.d]),get montEtapa(){return MONT.etapa;},T_MONT,
  dbg:()=>({cenaNuv,camQuad,NV_U,rtNuv,renderNuvens,UE}),
  // exporta poses e figurino para os renders do Blender (ferramentas/palco/render_cycles.py)
  exportaCena:()=>{const d=texOssos.image.data;const u8=new Uint8Array(d.buffer);let b='';for(let i=0;i<u8.length;i+=8192)b+=String.fromCharCode.apply(null,u8.subarray(i,i+8192));
    const P=p=>[p.x,p.y,p.z,p.yaw,p.sx,p.v,p.anim,p.fase,p.vel,p.pele,p.topC,p.baixoC,p.tenisC,p.cab,p.acento,p.pat,p.barba,p.estilo,p.obj];
    return {W:texOssos.image.width,H:texOssos.image.height,FRAMES,NANIM,loops:ANIM.map(a=>a.L),beat:GU.uBeat.value,ossos:btoa(b),pub:PUB.map(P),palco:NO_PALCO.map(P),
      feixes:MH.map(m=>{m.f.updateMatrixWorld();const o=new V3().setFromMatrixPosition(m.f.matrixWorld);const d=new V3(0,-1,0).transformDirection(m.f.matrixWorld);return [o.x,o.y,o.z,d.x,d.y,d.z,m.mat.color.r,m.mat.color.g,m.mat.color.b,m.mat.opacity,m.tipo];}),
      pix:PIX.map((f,i)=>{const c=new THREE.Color();pixFace.getColorAt(i,c);return [f.p.x,f.p.y,f.p.z,f.n.x,f.n.z,c.r,c.g,c.b];}),
      tubos:TUBOS.map(([a,b,r])=>[a.x,a.y,a.z,b.x,b.y,b.z,r]),fogo:FOGO_POS.map(p=>[p.x,p.y,p.z]),fogoK:FOGO_U.uK.value,
      luzLED:[luzLED.color.r,luzLED.color.g,luzLED.color.b,luzLED.intensity],lat:LAT.map(L=>[L.x,L.ang]),hemi:[hemiP.color.r,hemiP.color.g,hemiP.color.b],wash:[LE.wash.r,LE.wash.g,LE.wash.b,LE.washI]};},camera,renderer,scene,mundo,blocos,lod:lodPublico,n:PUB.length,nBlocos:BLOCOS.length};
})();
