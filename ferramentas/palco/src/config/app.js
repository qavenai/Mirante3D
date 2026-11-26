
(async function(){
'use strict';
/* ================= CONFIGURADOR DE PALCOS =================
   Um modelo de dados (palcos/modelo.js) vira o palco 3D, a montagem e o orçamento. Reaproveita os módulos do palco
   Castelos & Ruínas: materiais PBR, treliça instanciada, feixes volumétricos e o sistema de pessoas (gente.js). */
THREE.ColorManagement.legacyMode=false;
const V3=THREE.Vector3;
const QS=new URLSearchParams(location.search);
const isTouch=matchMedia('(pointer:coarse)').matches;
const lowGPU=isTouch||QS.has('leve');
const PASTA_GENTE_CFG='../castelos-e-ruinas-palco/pessoas/',PASTA_TX_CFG='../castelos-e-ruinas-palco/texturas/',PASTA_MIDIA='../castelos-e-ruinas-palco/midia/';
try{await Promise.race([Promise.all([document.fonts.load('64px Gloock'),document.fonts.load('600 32px "IBM Plex Mono"')]),new Promise(r=>setTimeout(r,2500))]);}catch(e){}
const stage=document.getElementById('stage');
const renderer=new THREE.WebGLRenderer({antialias:!lowGPU,powerPreference:'high-performance',preserveDrawingBuffer:QS.has('captura')});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,lowGPU?1.5:2));renderer.setSize(stage.clientWidth,stage.clientHeight);
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#050508');scene.fog=new THREE.FogExp2('#07070b',.006);
const camera=new THREE.PerspectiveCamera(42,stage.clientWidth/stage.clientHeight,.1,1500);
const H=2;   // usado só como padrão pelos materiais de pedra (o palco de cada configuração passa a própria altura)
/*INCLUI:config/comum.js*/
/*INCLUI:palcos/modelo.js*/
/*INCLUI:palcos/orcamento.js*/
const PALCOS=window.PALCOS,ORC=window.ORCAMENTO;
const BASE=/*JSON:palcos/orcamento-base.json*/null;
/* reflexos de estúdio escuro (metais e treliça com brilho) */
{const pm=new THREE.PMREMGenerator(renderer);const es=new THREE.Scene();es.background=new THREE.Color('#050507');
 const add=(w,h,x,y,z,ry,cor,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(cor).multiplyScalar(k),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry||0;es.add(m);};
 add(40,20,0,8,-30,0,'#c8c4ff',1.3);add(12,18,-30,8,-10,Math.PI/2,'#ffb08a',.8);add(12,18,30,8,-10,-Math.PI/2,'#ffb08a',.8);add(60,8,0,30,10,0,'#ffffff',.2);
 scene.environment=pm.fromScene(es,.04).texture;pm.dispose();}
/*GENTE*/
/* ================= LUZES ================= */
THREE.RectAreaLightUniformsLib&&THREE.RectAreaLightUniformsLib.init();
const hemi=new THREE.HemisphereLight('#3a4170','#0b0a0c',.35);scene.add(hemi);
const luzServico=new THREE.DirectionalLight('#e6ecff',0);luzServico.position.set(20,40,40);scene.add(luzServico,luzServico.target);
const luzServico2=new THREE.DirectionalLight('#fff1dc',0);luzServico2.position.set(-30,25,10);scene.add(luzServico2);
const luzLED=new THREE.RectAreaLight('#9a8cff',0,10,5);scene.add(luzLED);
const lavagem=[0,1,2,3].map(()=>{const s=new THREE.SpotLight('#ffffff',0,80,.5,.7,1.3);scene.add(s,s.target);return s;});
const seguidor=new THREE.SpotLight('#fff4e6',0,120,.08,.5,1.2);scene.add(seguidor,seguidor.target);
/* chão (asfalto escuro com marcas) */
{const t=ctex(512,512,(c,w,h)=>{c.fillStyle='#17181b';c.fillRect(0,0,w,h);const r=rng(9);for(let i=0;i<14000;i++){const v=r()<.5?0:255;c.fillStyle=`rgba(${v},${v},${v},${r()*.05})`;c.fillRect(r()*w,r()*h,2,2);}});t.repeat.set(60,60);
 const chao=new THREE.Mesh(new THREE.PlaneGeometry(600,600),M({map:t,color:'#ffffff',roughness:.82,metalness:.05}));chao.rotation.x=-Math.PI/2;chao.receiveShadow=true;scene.add(chao);}

/* ================= LED: conteúdo de demonstração (autoral) que atravessa todos os painéis ================= */
const CONTEUDOS=[{id:'paisagem',nome:'Paisagem'},{id:'por-do-sol',nome:'Pôr do sol'},{id:'roxo',nome:'Roxo'},{id:'castelos',nome:'Castelo'},
  {id:'ceu',nome:'Céu (vídeo)',video:'ceu.mp4'},{id:'ruinas',nome:'Ruínas (vídeo)',video:'ruinas.mp4'},{id:'castelo-v',nome:'Castelo (vídeo)',video:'castelo.mp4'},{id:'teste',nome:'Teste de pixels'}];
const CID=id=>Math.max(0,CONTEUDOS.findIndex(c=>c.id===id));
const LED_U={uT:{value:0},uC:{value:0},uTeste:{value:0},uLig:{value:1},uVid:{value:null},uTemVid:{value:0}};
const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;video.crossOrigin='anonymous';
const texVideo=new THREE.VideoTexture(video);texVideo.encoding=THREE.sRGBEncoding;LED_U.uVid.value=texVideo;
function poeConteudo(id){const c=CONTEUDOS[CID(id)];LED_U.uC.value=CID(id);EST.conteudo=c.id;
  if(c.video){video.src=PASTA_MIDIA+c.video;video.play().then(()=>{LED_U.uTemVid.value=1;}).catch(()=>{LED_U.uTemVid.value=0;});}else{LED_U.uTemVid.value=0;video.pause();}
  const cor={paisagem:'#ff9a5a','por-do-sol':'#ff8a3d',roxo:'#8b6bff',castelos:'#ffbf5e',ceu:'#9a8cff',ruinas:'#ff8a44','castelo-v':'#ffbf5e',teste:'#ffffff'}[c.id]||'#ffffff';luzLED.color.set(cor);}
function matTela(rect,tam){return new THREE.ShaderMaterial({extensions:{derivatives:true},toneMapped:false,
  uniforms:Object.assign({uRect:{value:new THREE.Vector4(...rect)},uTam:{value:new THREE.Vector2(...tam)},uCorte:{value:1}},LED_U),
  vertexShader:'varying vec2 vUv;varying vec3 vN;varying vec3 vV;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vN=normalize(mat3(modelMatrix)*normal);vV=normalize(cameraPosition-w.xyz);gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader:`uniform vec4 uRect;uniform vec2 uTam;uniform float uT,uC,uTeste,uLig,uTemVid,uCorte;uniform sampler2D uVid;varying vec2 vUv;varying vec3 vN;varying vec3 vV;${GLSL_N3}
  float fb(vec2 p){return gn(vec3(p,1.7))*.55+gn(vec3(p*2.1,3.1))*.3+gn(vec3(p*4.3,5.3))*.15;}
  vec3 paisagem(vec2 p,float quente){float t=uT;vec3 topo=mix(vec3(.05,.07,.2),vec3(.12,.04,.16),quente),hor=mix(vec3(1.,.55,.3),vec3(1.,.42,.12),quente);
    vec3 c=mix(hor,topo,pow(clamp((p.y-.25)/.75,0.,1.),.6));vec2 sp=vec2(.5,.34);float d=length((p-sp)*vec2(1.6,1.));
    c+=vec3(1.,.8,.45)*(smoothstep(.07,.05,d)*2.2+exp(-d*7.)*.6);
    c=mix(c,c*.8+vec3(.9,.6,.45)*.25,smoothstep(.55,.75,fb(vec2(p.x*3.+t*.01,p.y*8.)))*smoothstep(.35,.7,p.y)*.6);
    for(int i=0;i<3;i++){float k=float(i);float h=.16+.1*(2.-k)*.5+.07*fb(vec2(p.x*(2.+k)+t*.004*(k+1.)+k*7.,k))+.03*sin(p.x*9.+k);
      vec3 cm=mix(vec3(.18,.08,.12)*(1.-quente*.3),vec3(.02,.015,.03),k/2.);c=mix(c,cm*(1.+.4*(1.-p.y)),smoothstep(h+.004,h-.004,p.y));}
    if(quente>.5){float w=smoothstep(.17,.15,p.y);c=mix(c,hor*.5*(.7+.3*sin(p.y*300.+t*2.+fb(p*20.)*6.)),w);}
    return c;}
  vec3 roxo(vec2 p){float t=uT;vec3 c=mix(vec3(.08,.02,.18),vec3(.45,.12,.75),p.y);
    for(int i=0;i<5;i++){float k=float(i);float x=fract(.13+k*.21+t*.02*(1.+k*.3));c+=vec3(.6,.35,1.)*exp(-pow((p.x-x)*14.,2.))*.35;}
    c+=vec3(.9,.6,1.)*pow(max(0.,sin(p.y*30.-t*1.5+p.x*6.)),12.)*.25;
    for(int i=0;i<12;i++){float k=float(i);vec2 b=vec2(fract(k*.618+t*.01),fract(k*.37+sin(t*.2+k)*.05));c+=vec3(.8,.6,1.)*smoothstep(.04,.0,length((p-b)*vec2(2.,1.)))*.25;}
    return c;}
  vec3 castelo(vec2 p){float t=uT;
    vec3 c=mix(vec3(.95,.45,.16),vec3(.1,.04,.1),pow(clamp((p.y-.2)/.8,0.,1.),.7));vec2 sp=vec2(.5,.4);float d=length((p-sp)*vec2(1.7,1.));
    c+=vec3(1.,.78,.42)*(smoothstep(.06,.045,d)*1.6+exp(-d*6.)*.55);
    c=mix(c,c*.75+vec3(1.,.6,.4)*.2,smoothstep(.5,.75,fb(vec2(p.x*2.5+t*.008,p.y*7.)))*smoothstep(.45,.8,p.y)*.7);
    // colinas e castelo em silhueta (torres com telhado cônico, ameias, janelas acesas)
    float h=.2+.05*fb(vec2(p.x*3.,.5));float m=step(p.y,h);
    float cx=abs(p.x-.5);float muro=.36;if(cx<.2&&p.y<muro){m=1.;}
    if(cx<.2&&p.y<muro+.025&&p.y>=muro&&fract(p.x*40.)<.5)m=1.;
    for(int i=0;i<5;i++){float k=float(i);float x=.3+k*.1;float w=.022+.01*step(1.5,abs(k-2.)*-1.+3.);float ht=.46+.16*exp(-pow((k-2.)*.9,2.));
      if(abs(p.x-x)<w&&p.y<ht)m=1.;if(abs(p.x-x)<w*1.35&&p.y>=ht&&p.y<ht+(w*3.2)*(1.-abs(p.x-x)/(w*1.35)))m=1.;}
    if(m>.5){vec3 s=vec3(.05,.025,.03)+vec3(.12,.05,.03)*(1.-p.y);
      vec2 jw=vec2(p.x*90.,p.y*60.);vec2 fj=fract(jw);float jan=step(.4,fract(sin(dot(floor(jw),vec2(12.9,78.2)))*437.5))*step(.35,fj.x)*step(fj.x,.65)*step(.3,fj.y)*step(fj.y,.75)*step(.24,p.y)*step(cx,.2);
      c=s+vec3(1.4,.8,.3)*jan*(.7+.3*sin(t*2.+p.x*40.));}
    return c*.9;}
  vec3 teste(vec2 p){vec3 cs[7];cs[0]=vec3(1.);cs[1]=vec3(1.,1.,0.);cs[2]=vec3(0.,1.,1.);cs[3]=vec3(0.,1.,0.);cs[4]=vec3(1.,0.,1.);cs[5]=vec3(1.,0.,0.);cs[6]=vec3(0.,0.,1.);
    int i=int(clamp(p.x*7.,0.,6.));vec3 c=p.y>.38?cs[i]:(p.y>.24?vec3(p.x):vec3(.06));vec2 g=fract(p*vec2(24.,12.));if(min(g.x,g.y)<.04)c=vec3(.9);if(abs(length((p-.5)*vec2(2.,1.))-.4)<.006)c=vec3(1.);return c;}
  void main(){if(vUv.y>uCorte)discard;vec2 p=uRect.xy+vUv*uRect.zw;vec3 c;int k=int(uC+.5);
    if(uTemVid>.5&&(k==4||k==5||k==6))c=texture2D(uVid,p).rgb*1.1;
    else if(k==1)c=paisagem(p,1.);else if(k==2)c=roxo(p);else if(k==3||k==6)c=castelo(p);else if(k==7)c=teste(p);else if(k==4)c=roxo(p)*.7+paisagem(p,0.)*.3;else if(k==5)c=paisagem(p,1.)*.9;else c=paisagem(p,0.);
    if(uTeste>.5)c=teste(p);else c*=.82;
    // pixels (pitch 3,9 mm ≈ 256 px/m) e juntas dos gabinetes de 50 cm
    vec2 px=vUv*uTam*256.;vec2 fw=fwidth(px);float vis=clamp(1.-max(fw.x,fw.y)*1.2,0.,1.);vec2 f=fract(px)-.5;c*=mix(1.,smoothstep(.5,.2,length(f))*1.9,vis*.6);
    vec2 cab=vUv*uTam/.5;vec2 fc=fract(cab);vec2 fwc=fwidth(cab);float fj=.35*smoothstep(.16,.03,max(fwc.x,fwc.y));float junta=1.-max(smoothstep(fwc.x*.9,0.,fc.x)+smoothstep(1.-fwc.x*.9,1.,fc.x),smoothstep(fwc.y*.9,0.,fc.y)+smoothstep(1.-fwc.y*.9,1.,fc.y))*fj;c*=junta;
    float ang=max(dot(vN,vV),0.);c*=(.55+.45*pow(ang,.6))*1.05;
    c=mix(vec3(.012,.013,.016)*(.6+.4*junta),c,uLig);
    gl_FragColor=vec4(c,1.);
    #include <encodings_fragment>
  }`});}
/* ================= MATERIAIS DAS PEÇAS ================= */
const MT={
  tampo:new THREE.MeshPhysicalMaterial({color:'#0a0a0b',roughness:1,roughnessMap:TXP.rug,normalMap:TXP.nrm,normalScale:new THREE.Vector2(.3,.3),clearcoat:.3,clearcoatRoughness:.25}),
  aco:new THREE.MeshStandardMaterial({color:'#6d7279',roughness:.38,metalness:.85,roughnessMap:TXP.esc}),
  preto:M({color:'#0b0b0c',roughness:.7}),pretoMet:M({color:'#151618',roughness:.42,metalness:.6}),
  caixaSom:new THREE.MeshPhysicalMaterial({color:'#121214',roughness:.55,metalness:.1,clearcoat:.2}),
  grelha:new THREE.MeshStandardMaterial({color:'#1d1f22',roughness:.4,metalness:.7}),
  gradil:new THREE.MeshStandardMaterial({color:'#9aa0a7',roughness:.35,metalness:.9}),
  andaime:new THREE.MeshStandardMaterial({color:'#8c9096',roughness:.45,metalness:.85}),
  tela:new THREE.MeshStandardMaterial({color:'#0c0c0e',roughness:.9,transparent:true,opacity:.82,side:THREE.DoubleSide}),
  vidroCase:new THREE.MeshStandardMaterial({color:'#1c1d20',roughness:.62,roughnessMap:TXP.rug}),
  quina:new THREE.MeshStandardMaterial({color:'#b8bcc2',roughness:.28,metalness:.95}),
  luzQuente:B({color:new THREE.Color(1.6,1.15,.6),toneMapped:false}),
  lente:B({color:new THREE.Color(2.5,2.5,2.5),toneMapped:false}),
};
for(const k in MT)MT[k].userData.envFixo=1;
const matLona=c=>new THREE.MeshPhysicalMaterial({color:c,roughness:.85,sheen:.6,sheenColor:new THREE.Color(c).multiplyScalar(1.6),sheenRoughness:.5,side:THREE.DoubleSide});
/* treliça: 4 banzos + diagonais, devolve a lista de tubos */
function tubosTrelica(a,b,s,saida){const d=new V3().subVectors(b,a);const L=d.length();if(L<1e-3)return;d.normalize();const up=Math.abs(d.y)>.9?new V3(1,0,0):new V3(0,1,0);const u=new V3().crossVectors(d,up).normalize().multiplyScalar(s/2),v=new V3().crossVectors(d,u).normalize().multiplyScalar(s/2);
  const cant=[u.clone().add(v),u.clone().sub(v),u.clone().negate().sub(v),u.clone().negate().add(v)];const rb=s>.6?.024:s>.4?.02:.016,rd=rb*.5;
  for(const c of cant)saida.push([a.clone().add(c),b.clone().add(c),rb]);
  const n=Math.max(1,Math.round(L/s));for(let i=0;i<n;i++){const p0=a.clone().addScaledVector(d,L*i/n),p1=a.clone().addScaledVector(d,L*(i+1)/n);
    for(let f=0;f<4;f++){const c0=cant[f],c1=cant[(f+1)%4];saida.push([p0.clone().add(i%2?c0:c1),p1.clone().add(i%2?c1:c0),rd]);}
    for(let f=0;f<4;f++)saida.push([p0.clone().add(cant[f]),p0.clone().add(cant[(f+1)%4]),rd]);}}
const geoTubo=(()=>{const g=new THREE.CylinderGeometry(1,1,1,lowGPU?6:10,1);g.translate(0,.5,0);return g;})();
function malhaTubos(L,mat,chave){L.sort((p,q)=>chave(p)-chave(q));const im=new THREE.InstancedMesh(geoTubo,mat,Math.max(1,L.length));const o=new THREE.Object3D(),d=new V3(),Y=new V3(0,1,0);
  L.forEach(([a,b,r],i)=>{d.subVectors(b,a);const Lt=d.length();o.position.copy(a);o.quaternion.setFromUnitVectors(Y,d.normalize());o.scale.set(r,Lt,r);o.updateMatrix();im.setMatrixAt(i,o.matrix);});
  im.count=L.length;im.userData.n=L.length;im.castShadow=!lowGPU;return im;}
function lineArray(p,x,yTopo,z,n,ang,susp){const g=new THREE.Group();g.position.set(x,yTopo,z);g.rotation.y=ang||0;p.add(g);let y=0,a=0;
  for(let i=0;i<n;i++){const b=bx(g,MT.caixaSom,-.55,-.32,-.4,.55,0,.4);b.position.set(0,y-.16,Math.sin(a)*.3*i*.1);b.rotation.x=a;bx(b,MT.grelha,-.52,-.13,.4,.52,.13,.405);y-=.36;a+=i>n*.45?.045:.008;}
  bx(g,MT.pretoMet,-.65,0,-.42,.65,.1,.42);if(susp){for(const dx of [-.4,.4])cyl(g,MT.aco,dx,0,0,.012,.012,1.5,6);}return g;}
const texFig=null;
/* ================= ESTADO ================= */
const EST={preset:'castelos',tam:'G',cust:null,op:{},diarias:1,aba:'palco',conteudo:null};
let CENA=null;
/* ================= GERADOR: geometria do modelo -> peças 3D =================
   Cada peça entra numa lista (T.*) para a montagem conseguir revelar peça por peça. */
function escadaGeo(p,alt,larg,mat){const g=new THREE.Group();p.add(g);const n=Math.max(3,Math.ceil(alt/.19)),rise=alt/n,run=.3;
  for(let k=0;k<n;k++){bx(g,mat,-larg/2,0,k*run,larg/2,alt-k*rise,(k+1)*run);}
  for(const s of [-1,1]){const a=new V3(s*larg/2,alt+.9,0),b=new V3(s*larg/2,.9,n*run);const d=b.clone().sub(a);const c=cyl(g,MT.aco,0,0,0,.02,.02,d.length(),8);c.position.copy(a.clone().add(b).multiplyScalar(.5));c.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());
    for(const t of [0,.5,1]){const q=a.clone().lerp(b,t);cyl(g,MT.aco,q.x,q.y-.9,q.z,.018,.018,.9,6);}}
  return g;}
function praticaveis(g,Hp){const N=g.prat.length;
  const tampo=new THREE.BoxGeometry(1,.025,1).translate(0,-.0125,0);
  const gs=[new THREE.BoxGeometry(1,.07,.04).translate(0,-.06,-.48),new THREE.BoxGeometry(1,.07,.04).translate(0,-.06,.48),new THREE.BoxGeometry(.02,.07,1).translate(-.49,-.06,0),new THREE.BoxGeometry(.02,.07,1).translate(.49,-.06,0)];
  for(const [x,z] of [[-.45,-.42],[.45,-.42],[-.45,.42],[.45,.42]]){gs.push(new THREE.CylinderGeometry(.015,.015,Hp-.1,8).translate(x,-Hp/2-.05,z));gs.push(new THREE.CylinderGeometry(.035,.035,.02,10).translate(x,-Hp+.01,z));}
  const quadro=THREE.BufferGeometryUtils.mergeBufferGeometries(gs);
  const a=new THREE.InstancedMesh(tampo,MT.tampo,N),b=new THREE.InstancedMesh(quadro,P.trelica,N);a.receiveShadow=true;const o=new THREE.Object3D();
  const ordem=g.prat.map((p,i)=>i).sort((i,j)=>(g.prat[i].z<g.prat[j].z?1:-1)*0+(-g.prat[i].z+Math.abs(g.prat[i].x)*.3)-(-g.prat[j].z+Math.abs(g.prat[j].x)*.3));
  const pos=ordem.map(i=>g.prat[i]);
  pos.forEach((p,i)=>{o.position.set(p.x,Hp,p.z);o.scale.set(p.w,1,p.d);o.updateMatrix();a.setMatrixAt(i,o.matrix);b.setMatrixAt(i,o.matrix);});
  return {a,b,pos,Hp};}
function constroi(m,g,q){const raiz=new THREE.Group();const T={raiz,LED:[],MH:[],LA:[],SUBS:[],GRADIL:[],ESC:[],CEN:[],PIX:[],REFL:[],BLIND:[],TALHAS:[],ACAB:[],FOGO:[],tubos:{}};
  const Hp=m.pisoAlt,W=m.larg,D=m.prof,Ht=m.altura;
  // piso de praticáveis, saia e filete de luz
  T.prat=praticaveis(g,Hp);raiz.add(T.prat.a,T.prat.b);
  {const s=new THREE.Group();raiz.add(s);T.saia=s;const sf=pano(s,W,Hp-.05,.03);sf.position.set(0,(Hp-.05)/2,.03);for(const sx of [-1,1]){const l=pano(s,D,Hp-.05,.03);l.rotation.y=sx*Math.PI/2;l.position.set(sx*(W/2+.03),(Hp-.05)/2,-D/2);}
   if(g.passarela){const pw=g.passarela.larg,pd=g.passarela.prof;const f=pano(s,pw,Hp-.05,.02);f.position.set(0,(Hp-.05)/2,pd+.03);for(const sx of [-1,1]){const l=pano(s,pd,Hp-.05,.02);l.rotation.y=sx*Math.PI/2;l.position.set(sx*(pw/2+.03),(Hp-.05)/2,pd/2);}}
   T.filete=bx(raiz,MT.luzQuente,-W/2,Hp-.035,-.04,W/2,Hp-.005,.01);}
  // escadas de acesso
  for(const e of g.escadas){const lat=Math.abs(e.x)>W/2-.1&&e.z<0;const gr=escadaGeo(raiz,Hp,1.4,MT.preto);
    if(lat){gr.position.set(Math.sign(e.x)*W/2,0,e.z);gr.rotation.y=Math.sign(e.x)*Math.PI/2;}else{gr.position.set(e.x,0,g.passarela&&Math.abs(e.x)<.1?g.passarela.prof:0);}T.ESC.push(gr);}
  // treliças: torres / grid / alas, uma malha por conjunto (ordenadas para a montagem)
  {const L={torres:[],grid:[],alas:[]};for(const t of g.tre)tubosTrelica(new V3(...t.a),new V3(...t.b),t.lado,L[t.grupo]||L.grid);
   T.tubos.torres=malhaTubos(L.torres,P.trelica,t=>Math.min(t[0].y,t[1].y));T.tubos.grid=malhaTubos(L.grid,P.trelica,t=>t[0].x+t[1].x+(t[0].z+t[1].z)*.01);T.tubos.alas=malhaTubos(L.alas,P.trelica,t=>Math.min(t[0].y,t[1].y));
   for(const k in T.tubos)raiz.add(T.tubos[k]);T.grid=new THREE.Group();raiz.add(T.grid);T.grid.add(T.tubos.grid);   // grid sobe junto com o que está pendurado nele
   for(const t of g.tor){bx(raiz,MT.aco,t.x-.45,0,t.z-.45,t.x+.45,.08,t.z+.45).userData.base=1;}}
  // cobertura em duas águas (lona) com cumeeira
  if(g.cobertura){const c=g.cobertura;const cg=new THREE.Group();T.grid.add(cg);T.cob=cg;const mat=matLona(c.cor);const zm=(c.zf+c.zb)/2,w=c.x1-c.x0;
    for(const za of [c.zf,c.zb]){const ge=new THREE.BufferGeometry();ge.setAttribute('position',new THREE.Float32BufferAttribute([c.x0,c.y,za, c.x1,c.y,za, c.x1,c.cumeeira,zm, c.x0,c.cumeeira,zm],3));ge.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));ge.setIndex([0,1,2,0,2,3]);ge.computeVertexNormals();const pl=new THREE.Mesh(ge,mat);pl.castShadow=!lowGPU;cg.add(pl);}
    for(const x of [c.x0,c.x1]){const sh=new THREE.Shape([new THREE.Vector2(c.zb,c.y),new THREE.Vector2(c.zf,c.y),new THREE.Vector2(zm,c.cumeeira)].map(v=>new THREE.Vector2(-v.x,v.y)));const tg=new THREE.ShapeGeometry(sh);tg.rotateY(Math.PI/2);const tm=new THREE.Mesh(tg,mat);tm.position.x=x;cg.add(tm);}
    const cu=cyl(cg,MT.aco,0,0,0,.05,.05,w,10);cu.rotation.z=Math.PI/2;cu.position.set((c.x0+c.x1)/2,c.cumeeira,zm);}
  // alas laterais: andaime com tela, ou torres de treliça com tela
  for(const a of g.alas){const ag=new THREE.Group();raiz.add(ag);T.ACAB.push(ag);
    if(a.andaime){const L=[];const nx=Math.max(2,Math.round(a.larg/1.5)),nz=Math.max(2,Math.round(a.prof/2)),ny=Math.max(2,Math.round(a.alt/2));
      for(let i=0;i<=nx;i++)for(let k=0;k<=nz;k++){const x=a.x-a.larg/2+a.larg*i/nx,z=-1-a.prof*k/nz;L.push([new V3(x,0,z),new V3(x,a.alt,z),.024]);}
      for(let j=1;j<=ny;j++){const y=a.alt*j/ny;for(let i=0;i<=nx;i++)L.push([new V3(a.x-a.larg/2+a.larg*i/nx,y,-1),new V3(a.x-a.larg/2+a.larg*i/nx,y,-1-a.prof),.02]);for(let k=0;k<=nz;k++)L.push([new V3(a.x-a.larg/2,y,-1-a.prof*k/nz),new V3(a.x+a.larg/2,y,-1-a.prof*k/nz),.02]);}
      ag.add(malhaTubos(L,MT.andaime,t=>t[0].y));}
    const tl=new THREE.Mesh(new THREE.PlaneGeometry(a.larg,a.alt),MT.tela);tl.position.set(a.x,a.alt/2,-1.05);ag.add(tl);}
  if(g.cortina){const c=pano(raiz,g.cortina.larg,g.cortina.y1-g.cortina.y0,.08);c.position.set(0,(g.cortina.y0+g.cortina.y1)/2,g.cortina.z);T.ACAB.push(c);}
  // cenografia: escadaria e pirâmide (Castelos & Ruínas) ou escadaria simples
  if(g.cen){const ew=Math.min(6,r2c(W*.3)),z0=-Math.max(.8,D*.17),z1=-D*.67,topo=Hp+Math.min(5,D*.34),n=Math.max(4,Math.round((topo-Hp)/.3125)),rise=(topo-Hp)/n,run=(z0-z1)/n;
    const castelos=g.cen.tipo==='castelos';const pedra=castelos?pedraPBR('#ffffff',{oy:Hp}):MT.preto,pedraE=castelos?pedraPBR('#e4d6c2',{oy:Hp}):MT.preto;
    for(let k=0;k<n;k++){const y1=Hp+(k+1)*rise,za=z0-k*run;T.CEN.push(bxC(raiz,pedra,-ew/2,Hp,za-run-.02,ew/2,y1,za,.015));}
    T.CEN.push(bxC(raiz,pedra,-ew/2-.9,Hp,-D*.86,ew/2+.9,topo,z1,.02));
    if(castelos){const tiers=4,th=(topo-Hp)/tiers;for(const s of [-1,1])for(let k=0;k<tiers;k++){const x0=ew/2+.9,w=Math.max(.8,(W/2-x0)*(1-k/tiers)),za=z0-.8-k*(D*.1);const a=s>0?x0:-x0-w,b=s>0?x0+w:-x0;T.CEN.push(bxC(raiz,k%2?pedraE:pedra,a,Hp+k*th,-D*.86,b,Hp+(k+1)*th,za,.02));}
      for(const s of [-1,1]){const perfil=[[z0,Hp],[z0,Hp+1],[z1,topo+1],[-D*.86,topo+1],[-D*.86,Hp]];const sh=new THREE.Shape(perfil.map(p=>new THREE.Vector2(-p[0],p[1])));const ge=new THREE.ExtrudeGeometry(sh,{depth:.8,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1});ge.rotateY(Math.PI/2);
        const gm=new THREE.Mesh(ge,pedra);gm.position.x=s>0?ew/2:-ew/2-.8;raiz.add(gm);T.CEN.push(gm);
        for(let i=0;i<5;i++){const t=.1+i*.2;const z=z0+(z1-z0)*t,y=Hp+1+(topo-Hp)*t;const x=s*(ew/2+.4);const qb=bx(raiz,MT.pretoMet,x-.18,y,z-.18,x+.18,y+.14,z+.18);T.FOGO.push({p:new V3(x,y+.14,z),o:qb});}}}
    T.topo={y:topo,z:(z1-D*.86)/2};}
  // LED: painéis com moldura, conteúdo contínuo entre eles; ground stack com pés, suspenso com barra
  {let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of g.led){x0=Math.min(x0,p.x-p.larg/2);x1=Math.max(x1,p.x+p.larg/2);y0=Math.min(y0,p.y);y1=Math.max(y1,p.y+p.alt);}const LW=x1-x0,LH=y1-y0;
   for(const p of g.led){const gp=new THREE.Group();gp.position.set(p.x,0,p.z);gp.rotation.y=p.ry;raiz.add(gp);
     bx(gp,MT.preto,-p.larg/2-.08,p.y-.08,-.25,p.larg/2+.08,p.y+p.alt+.08,-.02);
     const rect=[(p.x-p.larg/2-x0)/LW,(p.y-y0)/LH,p.larg/LW,p.alt/LH];const tela=new THREE.Mesh(new THREE.PlaneGeometry(p.larg,p.alt),matTela(rect,[p.larg,p.alt]));tela.position.set(0,p.y+p.alt/2,0);gp.add(tela);
     if(p.fix==='ground'&&p.y>.3){for(const sx of [-1,1])bx(gp,P.trelica,sx*(p.larg/2-.2)-.15,0,-.6,sx*(p.larg/2-.2)+.15,p.y,-.3);bx(gp,P.trelica,-p.larg/2,p.y-.12,-.5,p.larg/2,p.y,-.3);}
     const barra=bx(gp,MT.aco,-p.larg/2-.1,p.y+p.alt+.02,-.18,p.larg/2+.1,p.y+p.alt+.16,-.04);
     T.LED.push({p,g:gp,tela,barra,suspenso:p.fix==='suspenso'});}
   const f=g.led.find(p=>p.id==='fundo');if(f){luzLED.width=f.larg;luzLED.height=f.alt;luzLED.position.set(0,f.y+f.alt/2,f.z+.05);luzLED.lookAt(0,f.y+f.alt/2,30);T.ledFundo=f;}}
  // talhas (motor + corrente)
  for(const t of g.talhas){const tg=new THREE.Group();tg.position.set(t.x,t.y,t.z);raiz.add(tg);const corpo=cyl(tg,MT.pretoMet,0,-.25,0,.16,.16,.45,18);corpo.rotation.z=Math.PI/2;corpo.position.y=0;const c=cyl(tg,MT.aco,0,0,0,.022,.022,1,6);T.TALHAS.push({g:tg,c,para:t.para});}
  // som: line arrays e subs
  for(const a of g.la){const ga=lineArray(raiz,a.x,a.y,a.z,a.n,a.ry,true);T.LA.push(ga);}
  for(const s of g.subs){for(let i=0;i<s.n;i++){const col=i%2,lin=Math.floor(i/2);const x=s.x+(col-.5)*1.05*Math.sign(s.x||1),y=s.y+lin*.62;const b=bx(raiz,MT.caixaSom,x-.5,y,s.z-.42,x+.5,y+.6,s.z+.42);bx(b,MT.grelha,-.46,-.26,.42,.46,.26,.425);T.SUBS.push(b);}}
  // luz: moving heads com feixe, refletores, blinders, PIX
  {const geo=new THREE.CylinderGeometry(.09,1,1,lowGPU?24:40,lowGPU?8:24,true);geo.translate(0,-.5,0);
   g.mh.forEach((h,i)=>{const gg=new THREE.Group();gg.position.set(h.x,h.y,h.z);(h.chao?raiz:T.grid).add(gg);bx(gg,MT.pretoMet,-.2,-.05,-.2,.2,.3,.2);const cab=new THREE.Group();gg.add(cab);bx(cab,MT.preto,-.18,-.38,-.18,.18,0,.18);
     const lente=new THREE.Mesh(new THREE.CircleGeometry(.12,16),new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}));lente.position.y=-.39;lente.rotation.x=Math.PI/2;cab.add(lente);
     const mat=matFeixe();const f=new THREE.Mesh(geo,mat);f.scale.set(1.2,h.chao?Ht*2:Ht*1.7,1.2);f.position.y=-.35;cab.add(f);f.onBeforeRender=()=>{mat.uniforms.uOp.value=mat.opacity;};if(h.chao)gg.rotation.x=Math.PI;
     T.MH.push({g:gg,cab,mat,lente,chao:h.chao,i,x:h.x});});}
  for(const r of g.refl){const c=cyl(T.grid,MT.pretoMet,r.x,r.y-.5,r.z,.14,.12,.45,16);c.rotation.x=.6;const l=new THREE.Mesh(new THREE.CircleGeometry(.11,16),MT.lente.clone());l.position.set(0,-.23,0);l.rotation.x=Math.PI/2;c.add(l);T.REFL.push({o:c,l});}
  for(const b of g.blind){const o=bx(raiz,MT.pretoMet,b.x-.3,b.y-.15,b.z-.08,b.x+.3,b.y+.15,b.z+.08);const ls=[];for(const dx of [-.14,.14]){const l=new THREE.Mesh(new THREE.CircleGeometry(.1,16),MT.lente.clone());l.position.set(dx,0,.085);o.add(l);ls.push(l);}T.BLIND.push({o,ls});}
  for(const x of g.pix){const o=bx(T.grid,MT.preto,x.x-.28,x.y-.28,x.z-.15,x.x+.28,x.y+.28,x.z+.15);const f=new THREE.Mesh(new THREE.PlaneGeometry(.42,.42),new THREE.MeshBasicMaterial({color:'#000',toneMapped:false}));f.position.z=.16;o.add(f);T.PIX.push({o,f,x:x.x});}
  // gradil: painéis de 2 m com pés
  {const gg=new THREE.BoxGeometry(1.96,.05,.05),pe=new THREE.BoxGeometry(.06,.04,.7),mast=new THREE.CylinderGeometry(.02,.02,1.1,6);
   for(const s of g.gradil){const a=new V3(s.a[0],0,s.a[1]),b=new V3(s.b[0],0,s.b[1]);const L=a.distanceTo(b),n=Math.max(1,Math.round(L/2)),ang=Math.atan2(b.x-a.x,b.z-a.z);
     for(let i=0;i<n;i++){const c=a.clone().lerp(b,(i+.5)/n);const gp=new THREE.Group();gp.position.copy(c);gp.rotation.y=ang+Math.PI/2;raiz.add(gp);
       for(const y of [.1,1.1]){const m=new THREE.Mesh(gg,MT.gradil);m.position.y=y;gp.add(m);}for(let k=0;k<9;k++){const m=new THREE.Mesh(mast,MT.gradil);m.position.set(-.88+k*.22,.6,0);gp.add(m);}for(const dx of [-.9,.9]){const m=new THREE.Mesh(pe,MT.gradil);m.position.set(dx,.02,0);gp.add(m);}
       T.GRADIL.push(gp);}}}
  // house mix: tenda com mesa
  if(g.houseMix){const h=new THREE.Group();h.position.set(g.houseMix.x,0,g.houseMix.z);raiz.add(h);T.HM=h;bx(h,MT.preto,-3,0,-2.5,3,.4,2.5);bx(h,MT.pretoMet,-2.2,.4,-.9,2.2,1.25,-.1);
    for(const [x,z] of [[-2.9,-2.4],[2.9,-2.4],[-2.9,2.4],[2.9,2.4]])cyl(h,P.trelica,x,.4,z,.05,.05,3.4,8);bx(h,matLona('#1b1b1e'),-3.2,3.8,-2.7,3.2,3.92,2.7);
    for(let i=0;i<6;i++)bx(h,B({color:new THREE.Color(.3,.6,1.2),toneMapped:false}),-1.9+i*.7,1.25,-.8,-1.5+i*.7,1.27,-.2);}
  // efeitos: papel picado
  if(m.efeitos.papel){const n=lowGPU?300:800,pp=new Float32Array(n*3),ss=new Float32Array(n);const r=rng(71);for(let i=0;i<n;i++){pp.set([(r()-.5)*(W+6),0,-D*.8+r()*(D*.8+9)],i*3);ss[i]=r();}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pp,3));gg.setAttribute('aS',new THREE.BufferAttribute(ss,1));
    const pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:LED_U.uT,uH:{value:Ht}},vertexShader:'attribute float aS;uniform float uT,uH;varying float vB;void main(){float t=mod(uT*(.6+aS*.5)+aS*20.,uH+2.);vec3 q=position;q.y=uH-t;q.x+=sin(uT*1.3+aS*30.)*1.;q.z+=cos(uT*.9+aS*20.)*.8;vB=.5+.5*sin(uT*9.+aS*60.);vec4 mv=modelViewMatrix*vec4(q,1.);gl_Position=projectionMatrix*mv;gl_PointSize=max(1.,80./-mv.z);}',
      fragmentShader:'varying float vB;void main(){vec2 q=abs(gl_PointCoord-.5);if(q.x>.5*vB+.08||q.y>.32)discard;gl_FragColor=vec4(vec3(1.,.82,.45)*(.6+1.4*vB),1.);}'});
    T.papel=new THREE.Points(gg,pm);T.papel.frustumCulled=false;raiz.add(T.papel);}
  // chamas nos queimadores (só com cenografia de fogo)
  if(T.FOGO.length){const n=T.FOGO.length;const ge=new THREE.InstancedBufferGeometry();const pl=new THREE.PlaneGeometry(1,1);pl.translate(0,.5,0);ge.index=pl.index;ge.setAttribute('position',pl.attributes.position);ge.setAttribute('uv',pl.attributes.uv);ge.instanceCount=n;
    const a=new Float32Array(n*4);T.FOGO.forEach((f,i)=>a.set([f.p.x,f.p.y,f.p.z,i*.37],i*4));ge.setAttribute('aP',new THREE.InstancedBufferAttribute(a,4));
    const mt=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:LED_U.uT,uK:{value:1}},
      vertexShader:'attribute vec4 aP;uniform float uK,uT;varying vec2 vUv;varying float vS;void main(){vUv=uv;vS=aP.w;vec3 tc=cameraPosition-aP.xyz;tc.y=0.;vec3 rt=normalize(vec3(tc.z,0.,-tc.x)+1e-5);float h=(1.6+.3*sin(uT*7.+aP.w*20.))*uK;vec3 p=aP.xyz+rt*position.x*.9+vec3(0.,position.y*h,0.);gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
      fragmentShader:`uniform float uT,uK;varying vec2 vUv;varying float vS;${GLSL_N3}void main(){if(uK<.01)discard;vec2 uv=vUv;float n=gn(vec3(uv.x*3.,uv.y*2.2-uT*3.4,vS*9.))*.6+gn(vec3(uv.x*7.,uv.y*5.-uT*5.,vS*3.))*.4;float larg=(1.-uv.y)*.5+.05;float d=abs(uv.x-.5)+(n-.5)*.35*uv.y;
        float f=smoothstep(larg,larg*.3,d)*smoothstep(1.,.3,uv.y+n*.4)*smoothstep(0.,.05,uv.y);if(f<.01)discard;vec3 c=mix(vec3(1.3,.3,.03),vec3(1.9,1.05,.35),smoothstep(.3,.95,f*(1.-uv.y)*1.6));gl_FragColor=vec4(c*f*uK*.8,1.);}`});
    T.chamas=new THREE.Mesh(ge,mt);T.chamas.frustumCulled=false;raiz.add(T.chamas);}
  raiz.traverse(o=>{if(o.isMesh&&!o.material.transparent)o.receiveShadow=true;});
  scene.add(raiz);return T;}
function r2c(x){return Math.round(x*2)/2;}
/* ================= PÚBLICO E ARTISTA (sistema de pessoas do Castelos & Ruínas) ================= */
const gPub=new THREE.Group();scene.add(gPub);let pubG=null,palcoG=null,PUB=[],NO_PALCO=[];
const POOL=[['balanco',26],['bracos',18],['filmando',14],['olhando',10],['copo',10],['danca',14],['pulando',8]];
const POOLA=(()=>{const o=[];for(const [n,w] of POOL)for(let i=0;i<w;i++)o.push(AID[n]);return o;})();
const OBJ=a=>a===AID.filmando?'celular':a===AID.copo?'copo':'';
function povoa(m,g,T){for(const ch of [...gPub.children])gPub.remove(ch);if(palcoG)for(const M of palcoG.malhas)M.m.parent&&M.m.parent.remove(M.m);
  const r=rng(2511+m.larg*7+m.prof);const W=m.larg;const zMax={P:24,M:40,G:58}[m.tam]||40;const nAlvo=Math.round(({P:380,M:1300,G:2600}[m.tam]||1200)*(lowGPU?.4:1));
  PUB=[];const ocup=new Set(),viz=new Map();const larg=W/2+9;let tent=0;
  while(PUB.length<nAlvo&&tent++<nAlvo*6){const z=3.4+Math.pow(r(),1.25)*(zMax-3.4),x=(r()*2-1)*(larg+z*.25);
    if(g.houseMix&&Math.abs(x-g.houseMix.x)<4&&Math.abs(z-g.houseMix.z)<3.6)continue;
    if(g.gradil.some(s=>s.a[0]===s.b[0]&&Math.abs(x-s.a[0])<.6&&z<Math.max(s.a[1],s.b[1])+.5))continue;
    const kk=Math.round(x/.55)+','+Math.round(z/.55);if(ocup.has(kk))continue;ocup.add(kk);
    const cx=Math.floor(x/1.5),cz=Math.floor(z/1.5);const perto=new Set();for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const v of (viz.get((cx+a)+','+(cz+b))||[]))perto.add(v);
    let vi=0;for(let t=0;t<8;t++){vi=Math.floor(r()*(VAR.length-1));if(!perto.has(vi))break;}const ck=cx+','+cz;if(!viz.has(ck))viz.set(ck,[]);viz.get(ck).push(vi);
    const yaw=Math.atan2(-x,-m.prof*.5-z)+(r()-.5)*.5;const an=POOLA[(r()*POOLA.length)|0];PUB.push(sorteiaPessoa(r,x,z,0,yaw,{v:vi,anim:an,obj:OBJ(an),fase:r()}));}
  pubG=grupoGente(PUB,gPub,{rMax:70,livre:true});
  // artista genérico e banda
  const rP=rng(4242);NO_PALCO=[];const yA=T.topo?T.topo.y:m.pisoAlt,zA=T.topo?T.topo.z:-m.prof*.45;
  NO_PALCO.push(sorteiaPessoa(rP,0,zA,yA,0,{v:VID.artista,anim:AID.cantando,estilo:'curto',barba:1,pele:'#4a2c1c',top:'#d8d2c4',baixo:'#1b1c20',tenis:'#f2f0ea',cabelo:'#0b0908',obj:'mic',fase:0}));
  if(m.tam!=='P'){NO_PALCO.push(sorteiaPessoa(rP,-m.larg*.32,-m.prof*.7,m.pisoAlt,.2,{v:VID.m4,anim:AID.tambor,estilo:'curto',top:'#141414',baixo:'#141414'}));NO_PALCO.push(sorteiaPessoa(rP,m.larg*.32,-m.prof*.7,m.pisoAlt,-.2,{v:VID.f6,anim:AID.balanco,estilo:'coque',top:'#141414',baixo:'#141414'}));}
  palcoG=grupoGente(NO_PALCO,scene,{sombra:false,semLo:true,lim:{hi:4,rHi:999,mid:4,rMid:999}});}

/* ================= SHOW: luzes animadas por paleta do conteúdo ================= */
const PALETA={paisagem:['#ffb070','#ffffff','#ff8a4a'],'por-do-sol':['#ff9a50','#ffd08a','#ff6a2a'],roxo:['#b9a2ff','#ffffff','#8b6bff'],castelos:['#ffd28a','#fff1c8','#ffc26a'],ceu:['#b9b2ff','#ffffff','#7e76ff'],ruinas:['#ffb070','#ff6a2a','#ff8a4a'],'castelo-v':['#ffd28a','#fff1c8','#ffc26a'],teste:['#ffffff','#ffffff','#ffffff']};
const _c=new THREE.Color();let beat=0;
function show(dt,t,k){if(!CENA)return;const T=CENA.T,m=CENA.m;const pal=PALETA[EST.conteudo]||PALETA.paisagem;const bpm=92;beat+=dt*bpm/60;GU.uBeat.value=beat;GU.uTempo.value=t;LED_U.uT.value=t;FEIXE_U.uT.value=t;
  const bt=beat%1,batida=Math.pow(1-bt,5);
  for(const h of T.MH){const ph=h.i*.6;const tilt=h.chao?(.25*(h.x<0?1:-1)+Math.sin(t*.45+ph)*.25):(.35+Math.sin(t*.6+ph)*.35);const pan=Math.sin(t*.5+ph)*(h.chao?.25:.5);h.cab.rotation.set(tilt,0,pan);
    h.mat.color.set(h.i%2?pal[0]:pal[1]);h.mat.opacity=(.2+.12*batida)*k;h.lente.material.color.set(h.i%2?pal[0]:pal[1]).multiplyScalar(2+6*h.mat.opacity);}
  for(const r of T.REFL)r.l.material.color.set(pal[2]).multiplyScalar(2.2*k);
  for(const b of T.BLIND)for(const l of b.ls)l.material.color.setRGB(3,2.6,2).multiplyScalar((.15+batida*1.2)*k);
  T.PIX.forEach((x,i)=>{x.f.material.color.set(pal[2]).multiplyScalar((.5+.5*Math.sin(beat*Math.PI*.5+x.x*.3))*3*k);});
  const f=T.ledFundo;luzLED.intensity=f?k*Math.min(6,2.5+f.larg*f.alt*.02):0;
  lavagem.forEach((s,i)=>{const x=(i-1.5)*m.larg*.3;s.position.set(x,m.altura-.8,1);s.target.position.set(x*.4,m.pisoAlt+1.5,-m.prof*.55);s.color.set(pal[2]);s.intensity=(m.tam==='G'?3.2:2.4)*k*(.85+.3*batida);});
  const a=NO_PALCO[0];if(a){seguidor.position.set(0,m.altura*.8+4,Math.max(18,m.prof*2));seguidor.target.position.set(a.x,a.y+1,a.z);seguidor.intensity=2.4*k;}
  if(T.chamas)T.chamas.material.uniforms.uK.value=(.75+.25*Math.max(0,Math.sin(beat*Math.PI/2)))*k;
  if(!MONT.ativo)hemi.intensity=.3+.15*(1-k);}

/* ================= CÂMERAS (calculadas pelas medidas do palco) ================= */
const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.maxPolarAngle=2.05;controls.minDistance=2;controls.maxDistance=300;controls.screenSpacePanning=true;
function cams(m,g){const W=m.larg+2*m.beiral[0],D=m.prof,Ht=m.altura,Hp=m.pisoAlt;const dist=Math.max(W*1.25,Ht*1.9,14);const f=g.led.find(p=>p.id==='fundo');const ly=f?f.y+f.alt/2:Hp+3;
  return [
   {id:'frente',nome:'Frontal',p:[0,Ht*.5+1.5,dist],l:[0,Ht*.42,-D*.5],fov:40,leg:'Frontal',ver:'O palco inteiro, a estrutura e o LED.'},
   {id:'mesa',nome:'Mesa de som',p:[0,4.2,Math.max(20,g.houseMix?g.houseMix.z:D*2)],l:[0,ly,-D],fov:38,leg:'Da mesa de som',ver:'O que o técnico de som e luz vê.'},
   {id:'lateral',nome:'Lateral',p:[-dist*.72,Ht*.5,dist*.55],l:[0,Ht*.35,-D*.5],fov:40,leg:'Lateral 45°',ver:'Profundidade do palco, torres e som.'},
   {id:'drone',nome:'Drone',p:[dist*.7,Ht*1.5+6,dist*.95],l:[0,Hp,-D*.4],fov:40,leg:'Drone',ver:'Estrutura, cobertura e público.'},
   {id:'grade',nome:'Na grade',p:[m.larg*.16,1.7,3.6],l:[0,Hp+3,-D*.6],fov:56,leg:'Na grade',ver:'O que a primeira fila vê.'},
   {id:'palco',nome:'Do palco',p:[0,Hp+1.7+(CENA&&CENA.T.topo?CENA.T.topo.y-Hp:0),(CENA&&CENA.T.topo?CENA.T.topo.z:-D*.45)+.6],l:[0,2,30],fov:60,leg:'Do palco',ver:'A visão do artista.'}];}
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;let tween=null,camAtual='frente';
const camsEl=document.getElementById('cams');
function irCam(id,dur){const c=CENA.cams.find(x=>x.id===id)||CENA.cams[0];camAtual=c.id;camsEl.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===c.id));
  tween={p0:camera.position.clone(),l0:controls.target.clone(),f0:camera.fov,p1:new V3(...c.p),l1:new V3(...c.l),f1:c.fov*(camera.aspect<1?1.45:1),t:0,d:dur===undefined?1.8:dur};legenda(c.leg,c.ver);}
function legenda(t,s){const el=document.getElementById('legenda');document.getElementById('legT').textContent=t;document.getElementById('legS').textContent=s||'';el.classList.remove('off');clearTimeout(legenda.tm);legenda.tm=setTimeout(()=>el.classList.add('off'),5000);}
/* ================= MONTAGEM (derivada das peças do palco escolhido) =================
   Mesma lógica da aba Montagem do Castelos & Ruínas: tudo é função do tempo, dá para pular e voltar.
   A duração de cada etapa e o número de montadores saem da quantidade de peças. */
const MONT={ativo:false,t:0,tocando:true,camAuto:true,etapa:-1,ledVivo:true,T:60};
const cl=x=>Math.max(0,Math.min(1,x)),sm=x=>{x=cl(x);return x*x*(3-2*x);},eo=x=>{x=cl(x);return 1-Math.pow(1-x,3);};
const janela=(u,i,n,larg)=>{const ini=(n<=1?0:i/(n-1))*(1-larg);return cl((u-ini)/larg);};
const f1=x=>(Math.round(x*10)/10).toLocaleString('pt-BR');
const ZERO=new THREE.Matrix4().makeScale(0,0,0),_oM=new THREE.Object3D();
const BASEM=new Map();
function base(o){let b=BASEM.get(o);if(!b){let h=1;const bb=new THREE.Box3().setFromObject(o);h=bb.max.y-bb.min.y;b={p:o.position.clone(),s:o.scale.clone(),h:Math.max(h,.01),vis:o.visible};BASEM.set(o,b);}return b;}
function surge(o,k){const b=base(o);o.visible=k>.001;o.scale.y=b.s.y*Math.max(k,.001);o.position.y=b.p.y*k;}
function cai(o,k,alt){const b=base(o);o.visible=k>.001;o.position.y=b.p.y+(1-eo(k))*(alt||5);}
function desce(o,k){const b=base(o);o.visible=k>.001;o.scale.y=b.s.y*Math.max(k,.001);o.position.y=b.p.y+(1-k)*b.h/2;}
function volta(o){const b=BASEM.get(o);if(!b)return;o.visible=b.vis;o.position.copy(b.p);o.scale.copy(b.s);}
const sobe=(o,k,dy)=>{const b=base(o);o.visible=k>.001;o.position.y=b.p.y-(1-sm(k))*dy;};
// máquinas: plataforma tesoura e empilhadeira telescópica (pintura automotiva, borracha, aço, vidro)
const MQ={amarelo:new THREE.MeshPhysicalMaterial({color:'#e3a514',roughness:.42,metalness:.25,clearcoat:.6,clearcoatRoughness:.25}),laranja:new THREE.MeshPhysicalMaterial({color:'#e8641c',roughness:.45,metalness:.2,clearcoat:.5}),
  pneu:M({color:'#101011',roughness:.92}),aro:M({color:'#5d6168',roughness:.35,metalness:.85}),vidro:new THREE.MeshPhysicalMaterial({color:'#9fb3c2',roughness:.05,transmission:lowGPU?0:.85,transparent:true,opacity:lowGPU?.35:1,thickness:.01})};
const montG=new THREE.Group();montG.visible=false;scene.add(montG);
const tesoura=(()=>{const g=new THREE.Group();montG.add(g);bx(g,MQ.laranja,-1.2,.15,-.6,1.2,.75,.6);for(const [x,z] of [[-.9,-.5],[.9,-.5],[-.9,.5],[.9,.5]]){const w=cyl(g,MQ.pneu,x,0,z,.16,.16,.12,20);w.rotation.x=Math.PI/2;w.position.y=.16;}
  const braco=[];for(let i=0;i<8;i++){const b=bx(g,MT.aco,-1.15,-.04,-.04,1.15,.04,.04);b.position.z=i%2?.55:-.55;braco.push(b);}
  const plat=new THREE.Group();g.add(plat);bx(plat,MQ.laranja,-1.2,0,-.65,1.2,.12,.65);for(const [a,b,c,d] of [[-1.2,-.65,1.2,-.61],[-1.2,.61,1.2,.65],[-1.2,-.65,-1.16,.65],[1.16,-.65,1.2,.65]])bx(plat,MQ.amarelo,a,1.05,b,c,1.1,d);
  for(const [x,z] of [[-1.18,-.63],[1.18,-.63],[-1.18,.63],[1.18,.63]])bx(plat,MQ.amarelo,x-.02,.12,z-.02,x+.02,1.08,z+.02);return {g,plat,braco};})();
function alturaTesoura(a){const piso=.8;tesoura.plat.position.y=piso+a;const n=4,dh=(a+.1)/n;const ang=Math.asin(Math.min(.98,dh/2.3));tesoura.braco.forEach((b,i)=>{const k=Math.floor(i/2);b.position.y=piso-.05+dh*(k+.5);b.rotation.z=(k%2?1:-1)*ang;});}
const empi=(()=>{const g=new THREE.Group();montG.add(g);bx(g,MQ.amarelo,-2.1,.6,-.95,2.1,1.3,.95);bx(g,MT.pretoMet,1.6,.55,-.9,2.35,1.45,.9);
  bx(g,MQ.amarelo,-.45,1.3,-1,.65,1.42,-.1);bx(g,MQ.amarelo,-.45,2.82,-1,.65,2.95,-.1);bx(g,MQ.vidro,-.42,1.42,-.98,.6,2.82,-.96);
  for(const [x,z] of [[-1.4,-1],[1.4,-1],[-1.4,1],[1.4,1]]){const w=cyl(g,MQ.pneu,x,0,z,.62,.62,.5,28);w.rotation.x=Math.PI/2;w.position.y=.62;const a=cyl(g,MQ.aro,x,0,z+(z>0?.03:-.03),.36,.36,.48,20);a.rotation.x=Math.PI/2;a.position.y=.62;}
  const lanca=new THREE.Group();lanca.position.set(-1.6,1.9,.35);g.add(lanca);bx(lanca,MQ.amarelo,0,-.27,-.27,4.2,.27,.27);bx(lanca,MQ.amarelo,3.6,-.21,-.21,5.6,.21,.21);bx(lanca,MT.aco,5.2,-.16,-.16,6.05,.16,.16);
  const garfo=new THREE.Group();garfo.position.set(6,0,0);lanca.add(garfo);bx(garfo,MT.aco,0,-.6,-.6,.1,.4,.6);for(const z of [-.35,.35])bx(garfo,MT.aco,0,-.6,z-.05,1.3,-.52,z+.05);bx(garfo,MT.vidroCase,.15,-.5,-.55,1.25,.35,.55);return {g,lanca,garfo};})();
// equipe: colete de alta visibilidade e capacete (sistema novo de pessoas)
const COLETE=['#ff6a13','#c9f03a','#ff6a13','#ff8a1e','#c9f03a','#ff6a13','#c9f03a','#ff6a13','#ff8a1e','#f4f4f0'];
const VAR_EQ=['m1','m4','m2','f4','m6','m3','m5','f6','m4','m1'].map(k=>VID[k]);
const rT=rng(777);
const TRAB=COLETE.map((c,i)=>sorteiaPessoa(rT,0,-100,0,0,{v:VAR_EQ[i],estilo:'bone',acento:i===9?'#f4f4f0':'#f2c200',top:c,baixo:i%2?'#2a2f3a':'#3a3226',tenis:'#3a2a1c',barba:i%3===0?1:0,anim:AID.olhando,fase:i*.13}));
const trabG=grupoGente(TRAB,montG,{semLo:true,lim:{hi:10,rHi:90,mid:10,rMid:999}});
const cargas=TRAB.map(()=>{const m=bx(montG,MT.vidroCase,-.3,-.22,-.2,.3,.22,.2);m.visible=false;for(const yy of [.2,-.2])bx(m,MT.quina,-.31,-.02,-.21,.31,.02,.21).position.y=yy;return m;});
const CASES=[];{const r=rng(91);for(let i=0;i<18;i++){const hh=.9+r()*.4;const b=bx(montG,MT.vidroCase,-.6,0,-.4,.6,hh,.4);for(const yy of [hh/2-.02,-hh/2+.02])bx(b,MT.quina,-.61,-.02,-.41,.61,.02,.41).position.y=yy;CASES.push(b);}}
const ETAPAS_BASE=[
 {id:'base',nome:'Base do palco'},{id:'torres',nome:'Torres de treliça'},{id:'grid',nome:'Grid e cobertura'},{id:'icamento',nome:'Içamento'},{id:'led',nome:'LED de fundo'},
 {id:'laterais',nome:'LEDs laterais e alas'},{id:'escada',nome:'Escadas e cenografia'},{id:'som',nome:'Sistema de som'},{id:'acabamento',nome:'Acabamento'},{id:'teste',nome:'Teste e show'}];
function preparaMontagem(){const m=CENA.m,g=CENA.g,q=CENA.q,T=CENA.T;BASEM.clear();
  const fundo=g.led.find(p=>p.id==='fundo'),outros=g.led.filter(p=>p.id!=='fundo');const gabF=fundo?Math.round(fundo.larg/fundo.gab[0])*Math.round(fundo.alt/fundo.gab[1]):0,gabO=q.gabinetes-gabF;
  const txt={
   base:`${q.praticaveis} praticáveis de 2 × 1 m formam o piso de ${f1(m.larg)} × ${f1(m.prof)} m${g.passarela?' com passarela':''}, a ${f1(m.pisoAlt)} m do chão.`,
   torres:`${q.torres} torres de treliça ${m.trelica} sobem seção por seção, até ${f1(m.altura)} m.`,
   grid:g.tre.some(t=>t.grupo==='grid')?`A treliça do teto (${f1(q.trelica_m)} m no total) é montada na altura do piso, já com moving heads e refletores pendurados.${g.cobertura?' A lona vai junto.':''}`:'Este palco não tem grid de cobertura.',
   icamento:q.talhas?`${q.talhas} talhas elétricas puxam o grid${g.cobertura?' e a cobertura':''} até ${f1(m.altura)} m, devagar e em sincronia.`:`Sem talhas: o teto sobe pelas próprias torres, com guincho manual e catraca.`,
   led:fundo?`${gabF} gabinetes (${f1(fundo.larg)} × ${f1(fundo.alt)} m) ${fundo.fix==='suspenso'?'presos fileira por fileira na barra de suspensão':'empilhados no ground stack, fileira por fileira'}, com a plataforma tesoura.`:'Sem LED de fundo.',
   laterais:outros.length?`${gabO} gabinetes nos ${outros.length} painéis ${outros[0].tipo==='tubo'?'em tubo vertical':outros[0].tipo==='recorte'?'recortados':'laterais'}${g.alas.length?', e as alas laterais':''}.`:(g.alas.length?'As alas laterais sobem.':'Sem LEDs laterais.'),
   escada:`${g.escadas.length} escada${g.escadas.length>1?'s':''} de acesso${g.cen?' e a cenografia: escadaria'+(g.cen.tipo==='castelos'?' e pirâmide de arenito':''):''}.`,
   som:m.somLuz?`${q.caixas_la} caixas de line array içadas e ${q.subs} subwoofers ${m.som.subs==='piso'?'no piso do palco':'empilhados no chão'}.`:'Sem som (fora do pacote).',
   acabamento:`Gradil (${q.gradil_un} peças de 2 m)${g.houseMix?', tenda da mesa de som':''}${g.cortina?', cortina preta':''}, luz de chão e acabamento.`,
   teste:'A luz de serviço apaga, o LED faz o teste de pixels, as luzes são testadas e o palco fica pronto para o show.'};
  const dur={base:4+Math.min(4,q.praticaveis/60),torres:3+Math.min(4,q.torres*.45),grid:g.tre.some(t=>t.grupo==='grid')?3+Math.min(4,q.trelica_m/120):2,icamento:q.talhas?5:3.5,
    led:fundo?3+Math.min(5,gabF/90):2,laterais:outros.length||g.alas.length?3+Math.min(4,gabO/60):2,escada:g.cen?6:3,som:m.somLuz?3+Math.min(3,(q.caixas_la+q.subs)/18):2,acabamento:5,teste:8};
  const W=m.larg,D=m.prof,Ht=m.altura,Hp=m.pisoAlt;const dist=Math.max(W*1.1,Ht*1.6,12);
  const camE={base:[W*.7+4,Hp+5,D*.5+8,0,Hp*.5,-D*.4],torres:[-W*.9-6,Ht*.55,D*.6+6,-W*.2,Ht*.45,-D*.5],grid:[W*.7+3,Hp+5,D*.4+5,0,Hp+1.5,-D*.5],icamento:[W*.8+6,Hp+3,D*.8+8,0,Ht*.6,-D*.5],
    led:[W*.38,Hp+5.5,D*.25+7,0,(fundo?fundo.y+fundo.alt*.4:Hp+2),-D*.8],laterais:[-W*.25,Hp+3,D*.3+4,-W*.55,Hp+2.5,-D*.4],escada:[W*.6+3,Hp+5,D*.5+5,0,Hp+1.5,-D*.5],
    som:[W*.85+5,Ht*.55,D*.5+6,W*.5,Ht*.5,0],acabamento:[-W*.75-4,Hp+4,D+8,0,Hp,-D*.3],teste:[0,Ht*.5+1.5,dist,0,Ht*.42,-D*.5]};
  let acc=0;CENA.etapas=ETAPAS_BASE.map(e=>{const o={id:e.id,nome:e.nome,txt:txt[e.id],d:+dur[e.id].toFixed(2),ini:acc,vazia:dur[e.id]<=2,cam:{p:camE[e.id].slice(0,3),l:camE[e.id].slice(3),fov:44}};acc+=o.d;return o;});MONT.T=acc;
  // posições da equipe por etapa: [x, y, z, olha x, olha z, tipo]
  const tor=g.tor.filter(t=>t.grupo!=='led');const A={};
  A.base=[...Array(6)].map((_,i)=>[(-W/2+.5)+i*(W-1)/5,0,1.6+(i%2)*.8,(-W/2+.5)+i*(W-1)/5,-D/2,'carrega']).concat([[-W*.2,Hp,-D*.3,0,-D*.6,'trabalha'],[W*.25,Hp,-D*.5,0,-D*.6,'trabalha'],[0,0,4,0,-D,'aponta']]);
  A.torres=g.tor.map(t=>[t.x+(t.x>0?.9:-.9),0,t.z+.6,t.x,t.z,'fixa']).concat([[0,0,4,0,-D,'aponta']]);
  A.grid=[...Array(8)].map((_,i)=>[(-W/2+1)+((i%4)/3)*(W-2),Hp,-D*(.25+.45*Math.floor(i/4)),(-W/2+1)+((i%4)/3)*(W-2),-D*(.25+.45*Math.floor(i/4))-.5,i%2?'fixa':'olha']);
  A.icamento=tor.map(t=>[t.x+(t.x>0?1:-1),0,t.z+.8,t.x,t.z,'trabalha']).concat([[0,0,5,0,-D,'aponta'],[-W*.3,0,3,0,-D,'olha']]);
  A.led=[...Array(6)].map((_,i)=>[(-W*.35)+i*W*.14,Hp,-D+1.2,(-W*.35)+i*W*.14,-D,i%2?'fixa':'trabalha']).concat([[W*.3,Hp,-D+2.5,W*.3,-D,'carrega'],[0,Hp,-D*.6,0,-D,'aponta']]);
  A.laterais=(outros.length?outros:g.alas.length?g.alas.map(a=>({x:a.x,z:-2})):[{x:-W/2,z:-D/2},{x:W/2,z:-D/2}]).map(p=>[p.x+(p.x>0?-1:1)*.8,p.y>Hp?Hp:0,(p.z||-2)+1.2,p.x,(p.z||-2),'fixa']).concat([[0,0,4,0,-D,'aponta']]);
  A.escada=[...Array(6)].map((_,i)=>[(-2.5+i),Hp,-D*.25-(i%2)*.6,0,-D*.6,i%2?'trabalha':'carrega']).concat([[0,0,4,0,-D,'aponta']]);
  A.som=g.la.map(a=>[a.x+(a.x>0?-.6:.6),0,a.z+1,a.x,a.z,'trabalha']).concat(g.subs.map(s=>[s.x,s.y,s.z+1.2,s.x,s.z,'carrega'])).concat([[0,0,5,0,-D,'aponta']]);
  A.acabamento=[...Array(6)].map((_,i)=>[(-W/2-1)+i*(W+2)/5,0,3.4,(-W/2-1)+i*(W+2)/5,2.5,i%2?'trabalha':'carrega']).concat([[0,0,(g.houseMix?g.houseMix.z-3:8),0,-D,'aponta']]);
  A.teste=[...Array(9)].map((_,i)=>[W/2+6+(i%3)*.8,0,-D*.5+Math.floor(i/3)*.8,W/2+12,-D*.5,'olha']).concat([[0,0,(g.houseMix?g.houseMix.z-2:10),0,-D,'aponta']]);
  CENA.planos=CENA.etapas.map(e=>A[e.id]);
  CENA.nTrab=q.montadores;
  // pilhas de cases ao lado do palco
  CASES.forEach((c,i)=>{c.position.set(-(W/2+5)-(i%3)*1.4,c.geometry.parameters.height/2,-D+1+Math.floor(i/3)*1.1);});
  const tvis=CENA.T.tubos;for(const k in tvis)tvis[k].userData.n=tvis[k].count;
  CENA.T.mhBase=CENA.T.MH.map(h=>h.g.position.y);}
function aplicaMont(t){const T=CENA.T,m=CENA.m,g=CENA.g,E={};CENA.etapas.forEach(e=>E[e.id]=cl((t-e.ini)/e.d));const Hp=m.pisoAlt,Ht=m.altura;
  // base: praticáveis caem no lugar
  {const P_=T.prat,n=P_.pos.length;P_.pos.forEach((p,i)=>{const k=janela(E.base,i,n,.08);if(k<=0){P_.a.setMatrixAt(i,ZERO);P_.b.setMatrixAt(i,ZERO);return;}_oM.position.set(p.x,Hp+(1-eo(k))*1.4,p.z);_oM.scale.set(p.w,1,p.d);_oM.rotation.set(0,0,0);_oM.updateMatrix();P_.a.setMatrixAt(i,_oM.matrix);P_.b.setMatrixAt(i,_oM.matrix);});
   P_.a.instanceMatrix.needsUpdate=P_.b.instanceMatrix.needsUpdate=true;T.saia.visible=E.base>.95;T.filete.visible=E.base>.98;}
  // torres e alas
  for(const k of ['torres','alas']){const im=T.tubos[k];const c=Math.round(im.userData.n*cl(E.torres/.85));im.count=c;im.visible=c>0;}
  T.raiz.children.forEach(o=>{if(o.userData.base)o.visible=E.torres>0;});
  // grid montado embaixo e içado
  const dy=(Hp+1.1-Ht)*(1-sm(E.icamento));T.grid.position.y=dy;{const im=T.tubos.grid;const c=Math.round(im.userData.n*cl(E.grid/.6));im.count=c;im.visible=c>0;}
  if(T.cob){const k=cl((E.grid-.6)/.4);T.cob.visible=k>.01;T.cob.scale.y=Math.max(.001,sm(k));}
  T.MH.forEach((h,i)=>{if(h.chao){const k=janela(E.acabamento,i,T.MH.length,.4);h.g.visible=k>0;h.g.position.y=T.mhBase[i]+(1-eo(k))*2;return;}const k=janela(cl((E.grid-.4)/.6),i,T.MH.length,.3);h.g.visible=k>0;h.g.position.y=T.mhBase[i]+(1-eo(k))*1.2;});
  for(const r of [...T.REFL,...T.PIX]){r.o.visible=E.grid>.75;}
  T.BLIND.forEach((b,i)=>{b.o.visible=E.acabamento>.2;});
  const talVis=E.grid>.6&&E.som<1;for(const tl of T.TALHAS){if(tl.para==='grid'){tl.g.visible=talVis;const L=Math.max(.05,tl.g.position.y-.25-(Ht+dy+.3));tl.c.scale.y=L;tl.c.position.y=-.25-L/2;}}
  // LED: fileira por fileira (corte da tela sobe; a barra acompanha)
  for(const L of T.LED){const fundo=L.p.id==='fundo';const k=fundo?E.led:cl(E.laterais/.9);const rows=Math.round(L.p.alt/L.p.gab[1]);const kr=Math.min(rows,Math.floor(k*rows+1e-6))/rows;
    L.g.visible=k>0;L.tela.material.uniforms.uCorte.value=k>=1?1:kr;L.barra.position.y=base(L.barra).p.y+(kr-1)*L.p.alt;L.g.children[0].visible=k>=1;
    for(const tl of T.TALHAS)if(tl.para===L.p.id){tl.g.visible=k>0&&E.som<1;const yb=L.p.y+L.p.alt*kr+.2;const Lc=Math.max(.05,tl.g.position.y-.25-yb);tl.c.scale.y=Lc;tl.c.position.y=-.25-Lc/2;}}
  for(const o of T.ACAB)desce(o,cl((E.laterais-.1)/.6));
  // escadas e cenografia
  T.ESC.forEach((o,i)=>surge(o,janela(E.escada,i,T.ESC.length+1,.5)));T.CEN.forEach((o,i)=>surge(o,janela(E.escada,i,T.CEN.length+2,.16)));T.FOGO.forEach((f,i)=>cai(f.o,janela(E.acabamento,i,T.FOGO.length,.3),1.5));
  // som
  T.LA.forEach((o,i)=>sobe(o,janela(E.som,i,T.LA.length,.5),6));T.SUBS.forEach((o,i)=>cai(o,janela(E.som,i,T.SUBS.length,.3),2.5));
  // acabamento
  T.GRADIL.forEach((o,i)=>surge(o,janela(E.acabamento,i,T.GRADIL.length,.12)));if(T.HM){const k=cl((E.acabamento-.4)/.5);T.HM.visible=k>0;T.HM.scale.y=Math.max(.001,sm(k));}
  if(T.papel)T.papel.visible=E.teste>.7;
  // cases somem; tesoura no LED; empilhadeira acompanha a etapa
  CASES.forEach((c,i)=>c.visible=t<CENA.etapas[Math.min(8,2+Math.floor(i/3))].ini+2);
  const fundo=g.led.find(p=>p.id==='fundo');let liftOn=false,lp=[-m.larg/2-3,0,2],alt=0;
  if(fundo&&E.led>0&&E.led<1){lp=[fundo.larg*.3,Hp,fundo.z+1.4];alt=Math.min(fundo.alt-1,(fundo.y-Hp)+fundo.alt*E.led-.6);liftOn=true;}
  tesoura.g.position.set(...lp);alturaTesoura(Math.max(.2,alt));tesoura.g.visible=m.tam!=='P'||E.led<1;MONT.lift={pos:lp,alt,on:liftOn};
  {const s=CENA.etapas.findIndex(e=>t<e.ini+e.d);const e=s<0?9:s;const pos=[[m.larg/2+10,0,8],[m.larg/2+9,0,4],[m.larg/2+8,0,-m.prof*.3],[m.larg/2+10,0,6],[m.larg/2+6,0,1],[m.larg/2+7,0,0],[m.larg/2+9,0,5],[m.larg/2+6,0,2],[m.larg/2+10,0,9],[m.larg/2+14,0,12]][e];
   empi.g.visible=m.tam!=='P';empi.g.position.set(...pos);empi.g.rotation.y=Math.PI*.85;empi.lanca.rotation.z=.25+.1*Math.sin(t*.7);empi.garfo.rotation.z=-empi.lanca.rotation.z;}
  return E;}
function poeTrab(t){const n=CENA.etapas.length;let s=0;for(let i=0;i<n;i++)if(t>=CENA.etapas[i].ini)s=i;const e=CENA.etapas[s];const u=cl((t-e.ini)/e.d);const agora=GU.uTempo.value;
  TRAB.forEach((p,i)=>{if(i>=CENA.nTrab){p.oculto=1;cargas[i].visible=false;return;}
    const Pa=CENA.planos[Math.max(0,s-1)],Pb=CENA.planos[s];const A=Pa[i%Pa.length],Bp=Pb[i%Pb.length];const jx=((i*37)%7-3)*.25,jz=((i*53)%5-2)*.25;
    const anda=s>0?cl(u/.3):1;const k=sm(anda);let x=A[0]+jx+(Bp[0]-A[0])*k,y=A[1]+(Bp[1]-A[1])*k,z=A[2]+jz+(Bp[2]-A[2])*k;
    if(s===0){const v=Math.sin(t*1.1+i)*.5+.5;x=Bp[0]+jx;z=Bp[2]+jz-1.5*v;}
    const andando=(s>0&&anda<1&&Math.hypot(Bp[0]-A[0],Bp[2]-A[2])>.3)||(s===0&&Bp[5]==='carrega');const carrega=Bp[5]==='carrega'&&(andando||s===0);
    const yaw=andando&&s>0?Math.atan2(Bp[0]-A[0],Bp[2]-A[2]):Math.atan2(Bp[3]-x,Bp[4]-z);
    const fora=s===n-1&&u>.6&&Bp[5]!=='aponta';p.x=x;p.y=y;p.z=z;p.yaw=yaw;p.oculto=fora?1:0;
    const an=carrega?AID.carrega:andando?AID.anda:Bp[5]==='fixa'?AID.fixa:Bp[5]==='trabalha'?(i%2?AID.fixa:AID.olhando):Bp[5]==='aponta'?AID.aponta:AID.olhando;trabG.anima(i,an,agora,.35);
    const cg=cargas[i];cg.visible=carrega&&!fora;const al=VAR[p.v].altura*p.sx;cg.position.set(x+Math.sin(yaw)*.36,y+al*.6,z+Math.cos(yaw)*.36);cg.rotation.y=yaw;});
  const q=MONT.lift,L=TRAB[0];if(q&&q.on){L.x=q.pos[0];L.y=q.pos[1]+.8+q.alt+.12;L.z=q.pos[2];L.oculto=0;trabG.anima(0,AID.fixa,agora,.3);}
  trabG.sync();}
function estadoFinal(){if(!CENA)return;for(const [o] of BASEM)volta(o);const T=CENA.T;
  {const P_=T.prat;P_.pos.forEach((p,i)=>{_oM.position.set(p.x,P_.Hp,p.z);_oM.scale.set(p.w,1,p.d);_oM.rotation.set(0,0,0);_oM.updateMatrix();P_.a.setMatrixAt(i,_oM.matrix);P_.b.setMatrixAt(i,_oM.matrix);});P_.a.instanceMatrix.needsUpdate=P_.b.instanceMatrix.needsUpdate=true;}
  for(const k in T.tubos){T.tubos[k].count=T.tubos[k].userData.n;T.tubos[k].visible=true;}T.grid.position.y=0;T.saia.visible=T.filete.visible=true;
  T.raiz.children.forEach(o=>{if(o.userData.base)o.visible=true;});for(const tl of T.TALHAS)tl.g.visible=false;
  T.MH.forEach((h,i)=>{h.g.visible=true;h.g.position.y=T.mhBase[i];});for(const r of [...T.REFL,...T.PIX,...T.BLIND])r.o.visible=true;
  for(const L of T.LED){L.g.visible=true;L.tela.material.uniforms.uCorte.value=1;L.g.children[0].visible=true;}
  if(T.cob){T.cob.visible=true;T.cob.scale.y=1;}if(T.HM){T.HM.visible=true;T.HM.scale.y=1;}if(T.papel)T.papel.visible=true;
  TRAB.forEach((p,i)=>{p.oculto=1;cargas[i].visible=false;});trabG.sync();montG.visible=false;gPub.visible=true;
  NO_PALCO.forEach(p=>p.oculto=0);palcoG&&palcoG.sync();LED_U.uTeste.value=0;LED_U.uLig.value=1;luzServico.intensity=luzServico2.intensity=0;
  if(destaque){scene.remove(destaque);destaque=null;}}
let destaque=null,destaqueT=0;
function realca(b3){if(destaque){scene.remove(destaque);destaque=null;}destaque=new THREE.Box3Helper(b3.clone().expandByScalar(.15),new THREE.Color(2.2,1.7,.9));destaque.material.transparent=true;destaque.material.toneMapped=false;destaque.material.depthTest=false;scene.add(destaque);destaqueT=0;}
function atualizaMontagem(dt,t){if(MONT.tocando){MONT.t=Math.min(MONT.T,MONT.t+dt);if(MONT.t>=MONT.T){MONT.tocando=false;iconeMont();}}
  const E=aplicaMont(MONT.t);poeTrab(MONT.t);
  const ei=Math.max(0,CENA.etapas.findIndex(e=>MONT.t<e.ini+e.d));const eIdx=CENA.etapas.findIndex(e=>MONT.t<e.ini+e.d)<0?9:ei;if(eIdx!==MONT.etapa){MONT.etapa=eIdx;mostraEtapa(eIdx);}
  const ut=E.teste,sv=1-sm(cl((ut-.04)/.22)),sh=sm(cl((ut-.32)/.3)),teste=ut>.08&&ut<.36;
  LED_U.uLig.value=ut>.08?1:0;LED_U.uTeste.value=ut<.34?1:0;
  luzServico.intensity=sv*2.1;luzServico2.intensity=sv*1.1;hemi.intensity=.3*sh+sv*.9;hemi.color.set(sv>.5?'#9aa3b8':'#3a4170');
  NO_PALCO.forEach(p=>p.oculto=ut>.55?0:1);palcoG&&palcoG.sync();gPub.visible=false;
  segsM.forEach((b,i)=>{const e=CENA.etapas[i];b.querySelector('i').style.width=(cl((MONT.t-e.ini)/e.d)*100)+'%';b.setAttribute('aria-current',i===MONT.etapa?'step':'false');});
  if(destaque){destaqueT+=dt;destaque.material.opacity=.55+.45*Math.sin(destaqueT*5);if(destaqueT>7){scene.remove(destaque);destaque=null;}}
  return teste?.5+sh*.5:sh;}
const camM={de:null,t:1};
function camMontagem(dt,t){const e=CENA.etapas[Math.max(0,MONT.etapa)];const c=e.cam;const deriva=Math.sin(t*.12)*1.2;const alvoP=new V3(c.p[0]+deriva,c.p[1],c.p[2]),alvoL=new V3(...c.l);const fov=c.fov*(camera.aspect<1?1.45:1);
  if(camM.de!==MONT.etapa||!camM.p0){camM.de=MONT.etapa;camM.p0=camera.position.clone();camM.l0=controls.target.clone();camM.f0=camera.fov;camM.t=0;}
  camM.t=Math.min(1,camM.t+dt/2.4);const k=ease(camM.t);camera.position.lerpVectors(camM.p0,alvoP,k);controls.target.lerpVectors(camM.l0,alvoL,k);camera.fov=camM.f0+(fov-camM.f0)*k;camera.updateProjectionMatrix();camera.lookAt(controls.target);}
function camEtapaJa(i){const c=CENA.etapas[i].cam;camera.position.set(...c.p);controls.target.set(...c.l);camera.fov=c.fov*(camera.aspect<1?1.45:1);camera.updateProjectionMatrix();camera.lookAt(controls.target);camM.de=i;camM.t=1;camM.p0=camera.position.clone();camM.l0=controls.target.clone();camM.f0=camera.fov;MONT.etapa=i;MONT.foco=null;mostraEtapa(i);}

/* ================= INTERFACE ================= */
const $=id=>document.getElementById(id);
const ICON={play:'<svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>',pausa:'<svg viewBox="0 0 14 14"><path d="M3 1.5h3v11H3zM8 1.5h3v11H8z" fill="currentColor"/></svg>',volta:'<svg viewBox="0 0 14 14"><path d="M7 2a5 5 0 1 1-4.6 3H.8L3.5 1.6 6.2 5H4.6A3.4 3.4 0 1 0 7 3.6z" fill="currentColor"/></svg>'};
const desktop=()=>innerWidth>820;
function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast.tm);toast.tm=setTimeout(()=>el.hidden=true,2600);}
const n0=x=>Math.round(x).toLocaleString('pt-BR');
/* miniatura de cada preset: vista frontal desenhada a partir da própria geometria (tamanho M) */
function miniatura(pid){const m=PALCOS.resolve(pid,'M',{});const g=PALCOS.geometria(m);const W=m.larg+12,Hh=m.altura+3;const s=Math.min(116/W,64/Hh);const X=x=>60+x*s,Y=y=>66-y*s;let o='';
  if(g.cobertura){const c=g.cobertura;o+=`<path d="M${X(c.x0)} ${Y(c.y)}L${X((c.x0+c.x1)/2)} ${Y(c.cumeeira)}L${X(c.x1)} ${Y(c.y)}z" fill="${c.cor}" opacity=".85"/>`;}
  for(const a of g.alas)o+=`<rect x="${X(a.x-a.larg/2)}" y="${Y(a.alt)}" width="${a.larg*s}" height="${a.alt*s}" fill="#2a2b30"/>`;
  for(const t of g.tre){if(Math.abs(t.a[2]-t.b[2])>.5&&Math.abs(t.a[0]-t.b[0])<.1&&Math.abs(t.a[1]-t.b[1])<.1)continue;o+=`<line x1="${X(t.a[0])}" y1="${Y(t.a[1])}" x2="${X(t.b[0])}" y2="${Y(t.b[1])}" stroke="#9aa0a7" stroke-width="${Math.max(.8,t.lado*s*.8)}"/>`;}
  o+=`<rect x="${X(-m.larg/2)}" y="${Y(m.pisoAlt)}" width="${m.larg*s}" height="${m.pisoAlt*s}" fill="#18181b" stroke="#3a3a40" stroke-width=".5"/>`;
  const cor={paisagem:['#ffb070','#5a6bd0'],'por-do-sol':['#ff8a3d','#7a2a5a'],roxo:['#8b6bff','#2a1a5a'],castelos:['#ffc26a','#6a3a1a']}[m.conteudo]||['#ffb070','#5a6bd0'];
  for(const p of g.led){if(p.ry&&Math.abs(Math.abs(p.ry)-Math.PI/2)<.1)continue;o+=`<rect x="${X(p.x-p.larg/2)}" y="${Y(p.y+p.alt)}" width="${p.larg*s}" height="${p.alt*s}" fill="url(#gl${pid})"/>`;}
  if(g.cen)o+=`<path d="M${X(-1.5)} ${Y(m.pisoAlt)}L${X(-.9)} ${Y(m.pisoAlt+2.4)}L${X(.9)} ${Y(m.pisoAlt+2.4)}L${X(1.5)} ${Y(m.pisoAlt)}z" fill="#c9a77a"/>`;
  for(const a of g.la)o+=`<rect x="${X(a.x)-1.6}" y="${Y(a.y)}" width="3.2" height="${a.n*.36*s}" fill="#0c0c0d" stroke="#555" stroke-width=".4"/>`;
  return `<svg viewBox="0 0 120 70" aria-hidden="true"><defs><linearGradient id="gl${pid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${cor[0]}"/><stop offset="1" stop-color="${cor[1]}"/></linearGradient></defs><rect width="120" height="70" fill="#0d0d10"/><rect y="66" width="120" height="4" fill="#1b1c1f"/>${o}</svg>`;}
$('presets').innerHTML=PALCOS.PRESETS.map(p=>`<button data-p="${p.id}" aria-pressed="false" title="${p.desc.replace(/"/g,'&quot;')}">${miniatura(p.id)}<span>${p.nome}</span><small>${p.ref?'REF. '+p.ref:'CENOGRÁFICO'}</small></button>`).join('');
/* modelo atual a partir do estado */
function classePorArea(L,D){const a=L*D;return a<70?'P':a<200?'M':'G';}
function modeloAtual(){let tam=EST.tam,cust=Object.assign({},EST.op,{diarias:EST.diarias});
  if(tam==='X'){const c=EST.cust;tam=classePorArea(c.larg,c.prof);Object.assign(cust,{larg:c.larg,prof:c.prof,altura:c.altura,led:c.led});}
  const m=PALCOS.resolve(EST.preset,tam,cust);m.pers=EST.tam==='X';return m;}
/* endereço compartilhável: #p=preset-tamanho (+ medidas e itens quando mudam) */
const OPK={cobertura:'cob',alas:'alas',passarela:'pass',cenografia:'cen',somLuz:'som',gerador:'ger'};
function escreveHash(){const pr=new URLSearchParams();pr.set('p',EST.preset+'-'+EST.tam);
  if(EST.tam==='X'){const c=EST.cust;pr.set('l',c.larg);pr.set('d',c.prof);pr.set('h',c.altura);pr.set('led',c.led);}
  for(const k in EST.op)pr.set(OPK[k],EST.op[k]?1:0);if(EST.diarias>1)pr.set('dias',EST.diarias);
  history.replaceState(null,'','#'+pr.toString().replace(/%2F/g,'/'));}
function leHash(){const pr=new URLSearchParams(location.hash.slice(1));const p=pr.get('p');if(!p)return;const i=p.lastIndexOf('-');const pid=p.slice(0,i),t=p.slice(i+1);
  if(PALCOS.PRESETS.some(x=>x.id===pid))EST.preset=pid;if(['P','M','G','X'].includes(t))EST.tam=t;
  if(EST.tam==='X'){const n=(k,d,a,b)=>{const v=parseFloat(pr.get(k));return isFinite(v)?Math.max(a,Math.min(b,v)):d;};EST.cust={larg:n('l',12,6,30),prof:n('d',10,4,20),altura:n('h',10,5,20),led:n('led',74,6,400)};}
  for(const k in OPK)if(pr.has(OPK[k]))EST.op[k]=pr.get(OPK[k])==='1';const d=parseInt(pr.get('dias'));if(d>0)EST.diarias=Math.min(30,d);}
/* ================= APLICA: modelo -> 3D, câmeras, montagem, painéis ================= */
function descarta(o){o.traverse(x=>{if(x.geometry&&x.geometry!==geoTubo)x.geometry.dispose();if(x.material&&x.material.isShaderMaterial)x.material.dispose();});scene.remove(o);}
let aplicando=false;
function aplica(semCam){aplicando=true;const voltaMont=MONT.ativo;if(MONT.ativo)estadoFinal();
  const m=modeloAtual(),g=PALCOS.geometria(m),q=PALCOS.quantidades(g);
  if(CENA){descarta(CENA.T.raiz);}
  const T=constroi(m,g,q);CENA={m,g,q,T};CENA.cams=cams(m,g);povoa(m,g,T);preparaMontagem();
  scene.fog.density=m.tam==='G'?.0045:m.tam==='M'?.006:.008;
  camsEl.innerHTML=CENA.cams.map(c=>`<button data-c="${c.id}" aria-pressed="false">${c.nome}</button>`).join('');
  if(!EST.conteudoUsuario)poeConteudo(m.conteudo);
  // textos
  const castelos=m.preset==='castelos';$('marca').textContent=castelos?'JOVEMRARO — ALÉM DO QUE SE VÊ':'Configurador de palcos';
  $('titulo').textContent=m.nome;$('subtitulo').textContent=`${m.pers?'Personalizado':PALCOS.TAM[m.tam].nome} · ${f1(m.larg)} × ${f1(m.prof)} m · LED ${f1(q.led_m2)} m²`;
  document.title=`${m.nome} · Configurador de palcos`;$('linkCastelos').hidden=!castelos;
  $('medidas').innerHTML=[['Piso',`${f1(m.larg)} × ${f1(m.prof)} m (${f1(q.piso_m2)} m²)`],['Altura do piso',`${f1(m.pisoAlt)} m`],['Estrutura',`${f1(m.altura)} m · treliça ${m.trelica}`],['LED',`${f1(q.led_m2)} m² · ${n0(q.gabinetes)} gabinetes`],
    ['Som',m.somLuz?`${q.caixas_la} caixas + ${q.subs} subs`:'fora do pacote'],['Público',m.pers?'—':PALCOS.TAM[m.tam].publico],['Montagem',`≈ ${q.dias_montagem} dia${q.dias_montagem>1?'s':''} · ${q.montadores} montadores`]].map(([k,v])=>`${k}: <b>${v}</b>`).join('<br>');
  sincronizaCfg();painelLED();painelOrc();painelPecas();montaSegs();escreveHash();
  if(!semCam){const c=CENA.cams[0];camera.position.set(...c.p);controls.target.set(...c.l);camera.fov=c.fov*(camera.aspect<1?1.45:1);camera.updateProjectionMatrix();irCam('frente',0);}
  if(voltaMont)entraMont();
  aplicando=false;}
function sincronizaCfg(){const m=CENA.m;
  document.querySelectorAll('#presets button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===EST.preset));
  document.querySelectorAll('#tams button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===EST.tam));
  $('personal').hidden=EST.tam!=='X';
  if(EST.tam==='X'){const c=EST.cust;$('sL').value=c.larg;$('sD').value=c.prof;$('sH').value=c.altura;$('sLED').value=c.led;$('oL').textContent=f1(c.larg)+' m';$('oD').textContent=f1(c.prof)+' m';$('oH').textContent=f1(c.altura)+' m';$('oLED').textContent=f1(CENA.q.led_m2)+' m²';}
  $('cCob').checked=m.cobertura;$('cAlas').checked=m.alas;$('cPass').checked=m.passarela;$('cCen').checked=!!m.cenografia;$('cSom').checked=m.somLuz;$('cGer').checked=m.gerador;
  $('oDias').textContent=EST.diarias+(EST.diarias>1?' diárias':' diária');}
/* ================= LED ================= */
$('ledConts').innerHTML=CONTEUDOS.map(c=>`<button data-c="${c.id}" aria-pressed="false">${c.nome}</button>`).join('');
$('ledConts').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;EST.conteudoUsuario=true;poeConteudo(b.dataset.c);painelLED();});
function painelLED(){document.querySelectorAll('#ledConts button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.c===EST.conteudo));const g=CENA.g;
  const lin=g.led.map(p=>{const gx=Math.round(p.larg/p.gab[0]),gy=Math.round(p.alt/p.gab[1]);return `<tr><td>${p.nome}</td><td class="n">${f1(p.larg)} × ${f1(p.alt)} m</td><td class="n">${f1(p.larg*p.alt)} m²</td><td class="n">${gx*gy}</td><td class="n">${n0(p.larg*256)} × ${n0(p.alt*256)}</td></tr>`;}).join('');
  $('ledTab').innerHTML=`<tr><th>Painel</th><th>Medida</th><th>Área</th><th>Gab.</th><th>Pixels</th></tr>${lin}<tr><td><b>Total</b></td><td></td><td class="n">${f1(CENA.q.led_m2)} m²</td><td class="n">${n0(CENA.q.gabinetes)}</td><td></td></tr>`;}
/* ================= ORÇAMENTO ================= */
let ORC_R=null;
function painelOrc(){const m=CENA.m,q=CENA.q;const r=ORC.calcula(BASE,q,EST.diarias);ORC_R=r;const B=ORC.BRL;
  $('orcT').textContent='Orçamento · '+(m.pers?'Personalizado':PALCOS.TAM[m.tam].nome);$('orcS').textContent=`${m.nome} · ${f1(m.larg)} × ${f1(m.prof)} m · LED ${f1(q.led_m2)} m² · ${EST.diarias} diária${EST.diarias>1?'s':''}`;
  const L=r.locacao;
  $('orcTot').innerHTML=`<div><span>Palco</span><b>${B(L.palco)}</b></div><div><span>LED</span><b>${B(L.led)}</b></div><div class="forte"><span>Palco + LED</span><b>${B(L.palco_led)}</b></div><div><span>Som, luz e energia</span><b>${B(L.som_luz_energia)}</b></div>
    <div class="forte largo"><span>Evento completo (locação)</span><b>${B(L.evento_completo)}</b></div><div class="forte largo"><span>Compra total (palco + LED + frete)</span><b>${B(r.compra.total)}</b></div>
    <div class="largo"><span>Compra ÷ locação de 1 diária (palco + LED)</span><b>${r.payback.toFixed(1).replace('.',',')} diárias para pagar</b></div>`;
  const tab=(itens,dias)=>`<tr><th>Item</th><th style="text-align:right">Qtd.</th><th style="text-align:right">Total</th></tr>`+itens.map(x=>`<tr><td>${x.item}</td><td class="n">${ORC.fmtQ(x.qtd)} ${ORC.UN[x.un]||x.un}${dias&&x.diarias>1?' × '+x.diarias:''}</td><td class="n">${B(x.total)}</td></tr>`).join('');
  $('orcLoc').innerHTML=tab(L.itens,true);$('orcCom').innerHTML=tab(r.compra.itens,false)+`<tr><td>Frete (4% sobre palco + LED)</td><td></td><td class="n">${B(r.compra.frete)}</td></tr>`;}
$('bCopiar').addEventListener('click',async()=>{const t=ORC.resumo(CENA.m,CENA.q,ORC_R,BASE)+'\n'+location.href;
  try{await navigator.clipboard.writeText(t);toast('Resumo copiado. É só colar no WhatsApp.');}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Resumo copiado.');}catch(_){toast('Não deu para copiar.');}ta.remove();}});
$('bCSV').addEventListener('click',()=>{const b=new Blob(['﻿'+ORC.csv(CENA.m,CENA.q,ORC_R)],{type:'text/csv;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`orcamento-${CENA.m.preset}-${EST.tam==='X'?'pers':EST.tam}.csv`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);});
/* ================= LISTA DE PEÇAS (mesmas quantidades do orçamento) ================= */
function caixaDe(lista){const b=new THREE.Box3();for(const o of lista){if(!o)continue;if(o.isBox3){b.union(o);continue;}o.updateWorldMatrix(true,true);const bb=new THREE.Box3().setFromObject(o);if(!bb.isEmpty())b.union(bb);}return b;}
function caixaPts(pts,pad){const b=new THREE.Box3();for(const p of pts)b.expandByPoint(new V3(...p));if(pad)b.expandByScalar(pad);return b;}
function pecas(){const m=CENA.m,g=CENA.g,q=CENA.q,T=CENA.T;const E=id=>CENA.etapas.findIndex(e=>e.id===id);const L=[];
  const fundo=T.LED.find(l=>l.p.id==='fundo'),lat=T.LED.filter(l=>l.p.id!=='fundo');const gab=l=>Math.round(l.p.larg/l.p.gab[0])*Math.round(l.p.alt/l.p.gab[1]);
  L.push({n:'Praticáveis 2 × 1 m',q:`${q.praticaveis} un.`,d:`Piso de ${f1(q.piso_m2)} m² a ${f1(m.pisoAlt)} m de altura, com saia preta.`,e:E('base'),cx:()=>caixaPts(g.prat.map(p=>[p.x,m.pisoAlt,p.z]),1)});
  L.push({n:`Torres de treliça ${m.trelica}`,q:`${q.torres} un.`,d:`Bases de aço e seções até ${f1(m.altura)} m.`,e:E('torres'),cx:()=>caixaPts(g.tor.map(t=>[t.x,0,t.z]).concat(g.tor.map(t=>[t.x,t.h||m.altura,t.z])),.6)});
  L.push({n:'Treliça (total)',q:`${f1(q.trelica_m)} m`,d:'Torres, grid do teto e alas, somadas pelo comprimento de cada trecho.',e:E('grid'),cx:()=>caixaPts(g.tre.filter(t=>t.grupo==='grid').flatMap(t=>[t.a,t.b]).map(p=>[p[0],p[1]-m.altura+m.pisoAlt+1.1,p[2]]),.5)});
  if(T.cob)L.push({n:'Lona da cobertura',q:`${f1(q.lona_m2)} m²`,d:'Cobertura em duas águas, sobe junto com o grid.',e:E('grid'),cx:()=>caixaDe([T.cob])});
  if(q.talhas)L.push({n:'Talhas elétricas',q:`${q.talhas} un.`,d:'Içam o grid e as barras de LED suspensas.',e:E('icamento'),t:.4,cx:()=>caixaDe(T.TALHAS.map(t=>t.g))});
  if(q.moving)L.push({n:'Moving heads',q:`${q.moving} un.`,d:'Pendurados no grid ainda na altura do piso.',e:E('grid'),cx:()=>caixaDe(T.MH.map(h=>h.g))});
  if(q.refletores)L.push({n:'Refletores',q:`${q.refletores} un.`,d:'Luz de frente para o palco.',e:E('grid'),cx:()=>caixaDe(T.REFL.map(r=>r.o))});
  if(q.pix)L.push({n:'PIX (efeito de LED)',q:`${q.pix} un.`,d:'Nas torres e no grid.',e:E('grid'),cx:()=>caixaDe(T.PIX.map(r=>r.o))});
  if(q.blinders)L.push({n:'Blinders',q:`${q.blinders} un.`,d:'Luz forte para a plateia nos momentos de pico.',e:E('acabamento'),cx:()=>caixaDe(T.BLIND.map(r=>r.o))});
  if(fundo)L.push({n:'LED de fundo',q:`${gab(fundo)} gab.`,d:`${f1(fundo.p.larg)} × ${f1(fundo.p.alt)} m em gabinetes de ${f1(fundo.p.gab[0])} × ${f1(fundo.p.gab[1])} m, ${fundo.suspenso?'suspenso na barra':'em ground stack'}.`,e:E('led'),t:.6,cx:()=>caixaDe([fundo.g])});
  if(lat.length)L.push({n:'LEDs laterais',q:`${lat.reduce((s,l)=>s+gab(l),0)} gab.`,d:`${lat.length} painéis de ${f1(lat[0].p.larg)} × ${f1(lat[0].p.alt)} m.`,e:E('laterais'),cx:()=>caixaDe(lat.map(l=>l.g))});
  if(g.alas.length)L.push({n:'Alas laterais',q:`${g.alas.length} un.`,d:'Estrutura com tela preta dos dois lados do palco.',e:E('laterais'),cx:()=>caixaDe(T.ACAB)});
  L.push({n:'Escadas de acesso',q:`${g.escadas.length} un.`,d:'Com corrimão dos dois lados.',e:E('escada'),cx:()=>caixaDe(T.ESC)});
  if(T.CEN.length)L.push({n:g.cen.tipo==='castelos'?'Escadaria e pirâmide':'Cenografia',q:'1 projeto',d:g.cen.tipo==='castelos'?'Arenito cenográfico em degraus, com queimadores de chama.':'Escadaria cenográfica no centro do palco.',e:E('escada'),t:.95,cx:()=>caixaDe(T.CEN)});
  if(q.caixas_la)L.push({n:'Line arrays',q:`${q.caixas_la} caixas`,d:`${g.la.length} colunas de caixas içadas.`,e:E('som'),t:.9,cx:()=>caixaDe(T.LA)});
  if(q.subs)L.push({n:'Subwoofers',q:`${q.subs} un.`,d:m.som.subs==='piso'?'No piso do palco, na frente.':'Empilhados no chão, na frente do palco.',e:E('som'),t:.9,cx:()=>caixaDe(T.SUBS)});
  L.push({n:'Gradil',q:`${q.gradil_un} peças de 2 m`,d:'Separa a plateia do palco e cria o corredor de serviço.',e:E('acabamento'),t:.6,cx:()=>caixaDe(T.GRADIL)});
  if(T.HM)L.push({n:'Mesa de som e luz (house mix)',q:'1 tenda',d:`Processadora de LED${q.servidor_loc?', servidor de mídia':''} e VJ ficam aqui.`,e:E('acabamento'),t:.95,cx:()=>caixaDe([T.HM])});
  return L;}
let PECAS=[];
function painelPecas(){PECAS=pecas();$('pecasL').innerHTML=PECAS.map((p,i)=>`<li data-e="${p.e}"><button data-i="${i}"><span class="pn">${p.n}</span><span class="pq">${p.q}</span><span class="pd">${p.d}</span><span class="pe">Etapa ${String(p.e+1).padStart(2,'0')} · ${CENA.etapas[p.e].nome}</span></button></li>`).join('');}
$('pecasL').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const p=PECAS[+b.dataset.i];const et=CENA.etapas[p.e];
  MONT.tocando=false;iconeMont();MONT.t=et.ini+et.d*(p.t||.85);MONT.camAuto=true;aplicaMont(MONT.t);const bx3=p.cx();if(!bx3.isEmpty()){realca(bx3);focaCaixa(bx3);}else camM.de=-1;
  if(!desktop())mostraPecas(false);});
function focaCaixa(b3){const c=b3.getCenter(new V3()),s=b3.getSize(new V3());const r=Math.max(s.x,s.y*1.3,s.z,3);const d=r*1.5+4;
  camM.de=MONT.etapa;camM.p0=camera.position.clone();camM.l0=controls.target.clone();camM.f0=camera.fov;camM.t=0;MONT.foco={p:[c.x+d*.45,c.y+d*.35,c.z+d*.85],l:[c.x,c.y,c.z]};}
/* ================= ABA MONTAGEM ================= */
const segsEl=$('montSegs');let segsM=[];
function montaSegs(){segsEl.innerHTML=CENA.etapas.map((e,i)=>`<button data-i="${i}" class="${e.vazia?'vazia':''}" aria-label="Etapa ${i+1}: ${e.nome}"><i></i><span>${i+1}</span></button>`).join('');segsM=[...segsEl.children];
  const q=CENA.q;$('montReal').textContent=`≈ ${q.dias_montagem} dia${q.dias_montagem>1?'s':''} · ${q.montadores} montadores · ${q.viagens} viage${q.viagens>1?'ns':'m'}`;}
segsEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const et=CENA.etapas[+b.dataset.i];MONT.t=et.ini+.01;MONT.camAuto=true;MONT.foco=null;camM.de=-1;if(MONT.t<MONT.T&&!MONT.tocando){MONT.tocando=true;iconeMont();}});
function iconeMont(){const b=$('bMPlay');const fim=MONT.t>=MONT.T-.01;b.innerHTML=MONT.tocando?ICON.pausa:fim?ICON.volta:ICON.play;b.setAttribute('aria-label',MONT.tocando?'Pausar montagem':fim?'Montar de novo':'Continuar montagem');}
$('bMPlay').addEventListener('click',()=>{if(MONT.t>=MONT.T-.01){MONT.t=0;MONT.tocando=true;MONT.camAuto=true;MONT.foco=null;camM.de=-1;}else MONT.tocando=!MONT.tocando;iconeMont();});
function mostraEtapa(i){const e=CENA.etapas[i];$('montN').textContent=String(i+1).padStart(2,'0')+' / '+CENA.etapas.length;$('montT').textContent=e.nome;$('montD').textContent=e.txt;
  document.querySelectorAll('#pecasL li').forEach(li=>li.classList.toggle('agora',+li.dataset.e===i));if(!MONT.foco||MONT.foco.e!==i)MONT.foco=null;}
function mostraPecas(on){$('pecas').hidden=!on;$('bPecas').setAttribute('aria-pressed',on);vista();}
$('bPecas').addEventListener('click',()=>mostraPecas($('pecas').hidden));$('pecasX').addEventListener('click',()=>mostraPecas(false));
function entraMont(){MONT.ativo=true;montG.visible=true;MONT.t=0;MONT.tocando=true;MONT.camAuto=true;MONT.foco=null;MONT.etapa=-1;camM.de=-1;tween=null;iconeMont();}
function saiMont(){if(!MONT.ativo)return;MONT.ativo=false;estadoFinal();irCam('frente');}
/* ================= ABAS E PAINÉIS ================= */
function aba(id){EST.aba=id;document.querySelectorAll('#abas [data-aba]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.aba===id));
  $('pLed').hidden=id!=='led';$('pOrc').hidden=id!=='orc';$('pSobre').hidden=id!=='sobre';$('mont').hidden=id!=='mont';document.body.classList.toggle('aba-mont',id==='mont');
  if(id==='mont'){if(!MONT.ativo)entraMont();mostraPecas(desktop());}else{mostraPecas(false);saiMont();}
  if(id!=='palco'&&!desktop())$('cfg').dataset.fechado='1';$('bCfg').setAttribute('aria-pressed',$('cfg').dataset.fechado!=='1');vista();}
document.querySelectorAll('#abas [data-aba]').forEach(b=>b.addEventListener('click',()=>aba(b.dataset.aba)));
$('bCfg').addEventListener('click',()=>{const c=$('cfg');const abrir=c.dataset.fechado==='1';c.dataset.fechado=abrir?'0':'1';$('bCfg').setAttribute('aria-pressed',abrir);if(abrir&&EST.aba!=='palco'&&EST.aba!=='mont')aba('palco');});
$('sobreX').addEventListener('click',()=>aba('palco'));
camsEl.addEventListener('click',e=>{const b=e.target.closest('button');if(b)irCam(b.dataset.c);});
/* controles de configuração */
$('presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.dataset.p===EST.preset)return;EST.preset=b.dataset.p;EST.op={};EST.conteudoUsuario=false;aplica();});
$('tams').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const t=b.dataset.t;if(t===EST.tam)return;
  if(t==='X'){const m=CENA.m;EST.cust={larg:m.larg,prof:m.prof,altura:m.altura,led:Math.round(CENA.q.led_m2)};}EST.tam=t;aplica();});
let tmSl=0;for(const [id,k] of [['sL','larg'],['sD','prof'],['sH','altura'],['sLED','led']])$(id).addEventListener('input',e=>{EST.cust[k]=+e.target.value;$('o'+id.slice(1)).textContent=f1(+e.target.value)+(k==='led'?' m²':' m');clearTimeout(tmSl);tmSl=setTimeout(()=>aplica(true),220);});
for(const [id,k] of [['cCob','cobertura'],['cAlas','alas'],['cPass','passarela'],['cCen','cenografia'],['cSom','somLuz'],['cGer','gerador']])$(id).addEventListener('change',e=>{EST.op[k]=e.target.checked;aplica(true);});
$('dMenos').addEventListener('click',()=>{if(EST.diarias>1){EST.diarias--;sincronizaCfg();painelOrc();escreveHash();}});
$('dMais').addEventListener('click',()=>{if(EST.diarias<30){EST.diarias++;sincronizaCfg();painelOrc();escreveHash();}});
/* vista: o centro da imagem fica no meio da área livre (painéis não cobrem o palco) */
function vista(){const w=stage.clientWidth,h=stage.clientHeight;if(!desktop()){camera.clearViewOffset();document.documentElement.style.setProperty('--dir','0px');return;}
  const esq=$('cfg').offsetWidth+16;const dirEl=['pLed','pOrc','pSobre','pecas'].map($).find(e=>!e.hidden);const dir=dirEl?dirEl.offsetWidth+16:0;
  document.documentElement.style.setProperty('--dir',dir+'px');camera.setViewOffset(w,h,-(esq-dir)/2,0,w,h);}
renderer.domElement.addEventListener('pointerdown',()=>{tween=null;if(MONT.ativo){MONT.camAuto=false;MONT.foco=null;}});
addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input'))return;if(EST.aba==='mont'){if(e.code==='Space'){e.preventDefault();$('bMPlay').click();}
  else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const i=Math.max(0,Math.min(CENA.etapas.length-1,MONT.etapa+(e.key==='ArrowRight'?1:-1)));segsM[i].click();}}});
/* ================= PÓS-PROCESSO E LAÇO ================= */
let composer=null;
try{if(!THREE.EffectComposer||!THREE.UnrealBloomPass)throw 0;const sz=renderer.getDrawingBufferSize(new THREE.Vector2());
  const rt=new THREE.WebGLRenderTarget(sz.x,sz.y,{type:THREE.HalfFloatType,samples:(renderer.capabilities.isWebGL2&&!lowGPU)?4:0});
  composer=new THREE.EffectComposer(renderer,rt);composer.addPass(new THREE.RenderPass(scene,camera));composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(stage.clientWidth,stage.clientHeight),lowGPU?.5:.58,.55,.8));
  const acab=new THREE.ShaderPass({uniforms:{tDiffuse:{value:null},uT:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D tDiffuse;uniform float uT;varying vec2 vUv;float hs(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}\nvoid main(){vec2 d=vUv-.5;float ca=.0022*dot(d,d)*4.;vec4 c=texture2D(tDiffuse,vUv);c.r=texture2D(tDiffuse,vUv+d*ca).r;c.b=texture2D(tDiffuse,vUv-d*ca).b;c.rgb*=1.-.3*pow(length(d)*1.3,2.4);c.rgb+=(hs(vUv*1000.+fract(uT)*61.)-.5)*.014;gl_FragColor=c;\n#include <encodings_fragment>\n}'});
  composer.addPass(acab);composer.userData={acab};}catch(e){composer=null;}
function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(w,h);}camera.aspect=w/h;camera.updateProjectionMatrix();vista();}
addEventListener('resize',resize);
const relogio=new THREE.Clock();let tempo=0,lodT=0;const FPS={n:0,t:0,v:0,hist:[]};
function quadro(){requestAnimationFrame(quadro);const dt=Math.min(.05,relogio.getDelta());tempo+=dt;if(!CENA)return;
  FPS.n++;FPS.t+=dt;if(FPS.t>=1){FPS.v=FPS.n/FPS.t;FPS.hist.push(FPS.v);if(FPS.hist.length>30)FPS.hist.shift();FPS.n=0;FPS.t=0;}
  let k=1;if(MONT.ativo){k=atualizaMontagem(dt,tempo);}
  show(dt,tempo,k);if(MONT.ativo){luzLED.intensity*=LED_U.uLig.value;}
  if(MONT.ativo&&MONT.camAuto){if(MONT.foco){const f=MONT.foco;camM.t=Math.min(1,camM.t+dt/1.8);const e=ease(camM.t);camera.position.lerpVectors(camM.p0,new V3(...f.p),e);controls.target.lerpVectors(camM.l0,new V3(...f.l),e);camera.lookAt(controls.target);}else camMontagem(dt,tempo);}
  else if(tween){tween.t+=dt/Math.max(1e-3,tween.d);const e=ease(Math.min(1,tween.t));camera.position.lerpVectors(tween.p0,tween.p1,e);controls.target.lerpVectors(tween.l0,tween.l1,e);camera.fov=tween.f0+(tween.f1-tween.f0)*e;camera.updateProjectionMatrix();camera.lookAt(controls.target);if(tween.t>=1)tween=null;}
  else controls.update();
  lodT-=dt;if(lodT<=0){lodT=.25;if(!MONT.ativo&&pubG)pubG.lod(camera);if(MONT.ativo)trabG.lod(camera,true);}
  if(composer){composer.userData.acab.uniforms.uT.value=tempo;composer.render(dt);}else renderer.render(scene,camera);}
/* ================= INÍCIO ================= */
leHash();if(EST.tam==='X'&&!EST.cust)EST.tam='G';
aplica();vista();if(desktop())$('cfg').dataset.fechado='0';vista();
quadro();
setTimeout(()=>{$('carregando').classList.add('fim');},400);
window.__cfg={aplica:(p,t,cust,op)=>{EST.preset=p;EST.tam=t;if(cust)EST.cust=cust;EST.op=op||{};aplica();},aba,cam:id=>{tween=null;const c=CENA.cams.find(x=>x.id===id);camera.position.set(...c.p);controls.target.set(...c.l);camera.fov=c.fov*(camera.aspect<1?1.45:1);camera.updateProjectionMatrix();camera.lookAt(controls.target);},
  montT:t=>{MONT.t=t;},montPausa:()=>{MONT.tocando=false;iconeMont();},camEtapaJa,etapas:()=>CENA.etapas.map(e=>({id:e.id,nome:e.nome,ini:e.ini,d:e.d})),T:()=>MONT.T,fps:()=>FPS,estado:()=>({m:CENA.m,q:CENA.q,r:ORC_R,est:EST}),
  pecas:i=>{document.querySelectorAll('#pecasL button')[i].click();},diarias:n=>{EST.diarias=n;sincronizaCfg();painelOrc();}};
})();
