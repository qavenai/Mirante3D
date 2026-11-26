/* ================= COMUM (copiado do palco Castelos & Ruínas: utilitários, materiais PBR, feixe volumétrico) ================= */
function rng(s){return function(){s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
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
/* PBR: arenito em blocos (cor, normal, rugosidade+oclusão), mapeado em coordenadas do mundo.
   Uma repetição = 2,5 m × 1,25 m com fiadas de 31,25 cm: as juntas caem na quina de cada degrau e cada patamar tem 4 fiadas. */
const PASTA_TX=(typeof PASTA_TX_CFG!=='undefined')?PASTA_TX_CFG:'texturas/';
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
