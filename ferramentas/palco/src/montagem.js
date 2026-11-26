/* ================= MONTAGEM (portada da versão anterior para o palco hiper-realista): o palco sendo montado, peça por peça, com a equipe trabalhando ================= */
// tudo é função do tempo t da montagem (dá para arrastar a linha do tempo para frente e para trás)
const MONT={ativo:false,t:0,tocando:true,camAuto:true,ledVivo:true,etapa:-1,pubAntes:true};
const cl=x=>Math.max(0,Math.min(1,x)),sm=x=>{x=cl(x);return x*x*(3-2*x);},eo=x=>{x=cl(x);return 1-Math.pow(1-x,3);};
const janela=(u,i,n,larg)=>{const ini=(n<=1?0:i/(n-1))*(1-larg);return cl((u-ini)/larg);};
const ETAPAS=[
  {id:'base',nome:'Base do palco',d:6,txt:'Os praticáveis (plataformas de 2 × 1 m com pés reguláveis) formam o piso de 42 × 15 m, a 2 m do chão.',
   cam:{p:[15,6.5,13],l:[-1,1.4,-7],fov:46}},
  {id:'escada',nome:'Escadaria e pirâmide',d:8,txt:'Os 16 degraus e a pirâmide cenográfica sobem em módulos e recebem o revestimento de pedra.',
   cam:{p:[17,8,17],l:[0,4,-8],fov:42}},
  {id:'torres',nome:'Torres de treliça',d:6,txt:'Quatro torres de ground support (treliça Q76) sobem seção por seção, mais as torres dos LEDs laterais e de delay.',
   cam:{p:[-34,13,22],l:[-8,8,-8],fov:42}},
  {id:'grid',nome:'Grid de cobertura',d:6,txt:'O teto de treliça é montado na altura do piso, já com moving heads e refletores pendurados — é mais seguro trabalhar embaixo.',
   cam:{p:[22,9,14],l:[0,3.5,-8],fov:44}},
  {id:'icamento',nome:'Içamento do teto',d:6,txt:'Talhas elétricas no topo das torres puxam o grid inteiro até 18,5 m, devagar e em sincronia.',
   cam:{p:[26,5,26],l:[0,11,-8],fov:52}},
  {id:'led',nome:'LED central',d:8,txt:'Os gabinetes de 50 × 100 cm são presos fileira por fileira na barra de suspensão, que sobe a cada fileira até fechar 20 × 10 m.',
   cam:{p:[9,6,9],l:[0,7,-12],fov:46}},
  {id:'laterais',nome:'LEDs laterais',d:6,txt:'Os dois LEDs em retrato (6,6 × 10,2 m) sobem do mesmo jeito, pendurados nas próprias torres.',
   cam:{p:[-6,7,13],l:[-18.6,7.5,-5],fov:44}},
  {id:'som',nome:'Sistema de som',d:5,txt:'Line arrays são içados ao lado do palco e no delay; os subwoofers ficam no chão, na frente do palco.',
   cam:{p:[27,9,22],l:[20,9,-1],fov:44}},
  {id:'acabamento',nome:'Acabamento',d:6,txt:'Luz de chão, queimadores de chama, panos pretos, equipamento da banda, grade de contenção e a mesa de som.',
   cam:{p:[-22,9,26],l:[0,4,-6],fov:42}},
  {id:'teste',nome:'Teste e show',d:9,txt:'Luz de serviço apaga, os LEDs fazem o teste de pixels, as luzes e o fogo são testados — e o palco fica pronto para o show.',
   cam:{p:[0,4.2,32],l:[0,7.4,-13],fov:40}},
];
const ORDEM=['base','torres','grid','icamento','led','laterais','escada','som','acabamento','teste'],ID_ANT=["base", "escada", "torres", "grid", "icamento", "led", "laterais", "som", "acabamento", "teste"];
ETAPAS.sort((a,b)=>ORDEM.indexOf(a.id)-ORDEM.indexOf(b.id));
let acc=0;for(const e of ETAPAS){e.ini=acc;acc+=e.d;}const T_MONT=acc;
const uEt=(i,t)=>cl((t-ETAPAS[i].ini)/ETAPAS[i].d);
/* estado original de cada peça (para animar a partir dele) */
const BASE=new Map();
function base(o){let b=BASE.get(o);if(!b){let h=1;if(o.geometry){o.geometry.computeBoundingBox();const bb=o.geometry.boundingBox;h=bb.max.y-bb.min.y;}b={p:o.position.clone(),s:o.scale.clone(),h,vis:o.visible};BASE.set(o,b);}return b;}
function surge(o,k){const b=base(o);o.visible=k>.001;o.scale.y=b.s.y*Math.max(k,.001);o.position.y=b.p.y-(1-k)*b.h*b.s.y/2;}
function cai(o,k,alt){const b=base(o);o.visible=k>.001;o.position.y=b.p.y+(1-eo(k))*(alt||5);}
function desce(o,k){const b=base(o);o.visible=k>.001;o.scale.y=b.s.y*Math.max(k,.001);o.position.y=b.p.y+(1-k)*b.h*b.s.y/2;}
function volta(o){const b=base(o);o.visible=b.vis;o.position.copy(b.p);o.scale.copy(b.s);}
const sobe=(o,k,dy)=>{const b=base(o);o.visible=k>.001;o.position.y=b.p.y-(1-sm(k))*dy;};

/* ---------- peças que só existem na montagem ---------- */
const montG=new THREE.Group();montG.visible=false;scene.add(montG);
// materiais com cara de equipamento de verdade (PBR): pintura automotiva, borracha, aço, vidro, laminado de case
const MAT_M={
  amarelo:new THREE.MeshPhysicalMaterial({color:'#e3a514',roughness:.42,metalness:.25,clearcoat:.6,clearcoatRoughness:.25}),
  laranja:new THREE.MeshPhysicalMaterial({color:'#e8641c',roughness:.45,metalness:.2,clearcoat:.5,clearcoatRoughness:.3}),
  vidro:new THREE.MeshPhysicalMaterial({color:'#9fb3c2',roughness:.05,metalness:0,transmission:lowGPU?0:.85,transparent:true,opacity:lowGPU?.35:1,thickness:.01,ior:1.5}),
  pneu:new THREE.MeshStandardMaterial({color:'#101011',roughness:.92}),
  aro:new THREE.MeshStandardMaterial({color:'#5d6168',roughness:.35,metalness:.85}),
  aco:new THREE.MeshStandardMaterial({color:'#6d7279',roughness:.38,metalness:.85,roughnessMap:TXP.esc}),
  corrente:new THREE.MeshStandardMaterial({color:'#9aa0a8',roughness:.3,metalness:.95}),
  talha:new THREE.MeshPhysicalMaterial({color:'#24272c',roughness:.45,metalness:.5,clearcoat:.3}),
  case:new THREE.MeshStandardMaterial({color:'#1c1d20',roughness:.62,metalness:.05,roughnessMap:TXP.rug}),
  quina:new THREE.MeshStandardMaterial({color:'#b8bcc2',roughness:.28,metalness:.95}),
  tampo:new THREE.MeshPhysicalMaterial({color:'#0a0a0b',roughness:1,roughnessMap:TXP.rug,normalMap:TXP.nrm,normalScale:new THREE.Vector2(.3,.3),clearcoat:.25,clearcoatRoughness:.3}),
};
for(const k in MAT_M)MAT_M[k].userData.envFixo=1;
// praticáveis: tampo + 4 pés, instanciados (21 × 15)
const PRAT=[];for(let r=0;r<15;r++)for(let c=0;c<21;c++)PRAT.push([-20+c*2,-14.5+r,Math.abs(c-10)+r*.3]);
PRAT.sort((a,b)=>(a[1]-b[1])*3+(a[2]-b[2])*.1);
const pratMesh=(()=>{const tampo=new THREE.BoxGeometry(1.94,.025,.94).translate(0,-.0125,0);
  const gs=[new THREE.BoxGeometry(1.98,.07,.04).translate(0,-.06,-.47),new THREE.BoxGeometry(1.98,.07,.04).translate(0,-.06,.47),new THREE.BoxGeometry(.04,.07,.98).translate(-.97,-.06,0),new THREE.BoxGeometry(.04,.07,.98).translate(.97,-.06,0)];
  for(const [x,z] of [[-.9,-.42],[.9,-.42],[-.9,.42],[.9,.42]]){gs.push(new THREE.CylinderGeometry(.03,.03,H-.1,10).translate(x,-H/2-.05,z));gs.push(new THREE.CylinderGeometry(.07,.07,.02,12).translate(x,-H+.01,z));}
  gs.push(new THREE.CylinderGeometry(.012,.012,1.9,6).rotateZ(Math.PI/2).translate(0,-H*.55,-.42),new THREE.CylinderGeometry(.012,.012,1.9,6).rotateZ(Math.PI/2).translate(0,-H*.55,.42));
  const g=THREE.BufferGeometryUtils.mergeBufferGeometries(gs);
  const a=new THREE.InstancedMesh(tampo,MAT_M.tampo,PRAT.length),b=new THREE.InstancedMesh(g,P.trelica,PRAT.length);a.frustumCulled=b.frustumCulled=false;montG.add(a,b);
  return {setMatrixAt:(i,m)=>{a.setMatrixAt(i,m);b.setMatrixAt(i,m);},get instanceMatrix(){return {set needsUpdate(v){a.instanceMatrix.needsUpdate=b.instanceMatrix.needsUpdate=v;}};},set visible(v){a.visible=b.visible=v;},get visible(){return a.visible;}};})();
// gabinetes de LED (central 40 × 10; laterais 13 × 10)
const texGab=ctex(256,512,(c,w,h)=>{c.fillStyle='#0c0d0f';c.fillRect(0,0,w,h);const r=rng(5);const mw=w/2,mh=h/4;
  for(let my=0;my<4;my++)for(let mx=0;mx<2;mx++){const x0=mx*mw,y0=my*mh;c.fillStyle='#121316';c.fillRect(x0+2,y0+2,mw-4,mh-4);
    for(let y=y0+5;y<y0+mh-3;y+=4)for(let x=x0+5;x<x0+mw-3;x+=4){const k=40+r()*25;c.fillStyle=`rgb(${k},${k},${k+6})`;c.fillRect(x,y,2,2);}
    c.strokeStyle='#020203';c.lineWidth=2;c.strokeRect(x0+1,y0+1,mw-2,mh-2);}
  c.strokeStyle='#000';c.lineWidth=6;c.strokeRect(0,0,w,h);},true);texGab.wrapS=texGab.wrapT=THREE.ClampToEdgeWrapping;
const texGabCostas=ctex(128,256,(c,w,h)=>{c.fillStyle='#3a3d42';c.fillRect(0,0,w,h);const r=rng(6);for(let i=0;i<1500;i++){const k=50+r()*30;c.fillStyle=`rgba(${k},${k},${k+4},.5)`;c.fillRect(r()*w,r()*h,1,1);}
  c.fillStyle='#24262a';c.fillRect(w*.25,h*.08,w*.5,h*.05);c.fillRect(w*.25,h*.87,w*.5,h*.05);c.fillStyle='#16181b';c.fillRect(w*.3,h*.4,w*.4,h*.2);
  c.fillStyle='#c9a24a';for(const y of [.45,.55])c.fillRect(w*.36,h*y,w*.06,h*.03);},true);
const matGab=[new THREE.MeshStandardMaterial({color:'#2d3035',roughness:.45,metalness:.7}),new THREE.MeshPhysicalMaterial({map:texGab,roughness:.35,metalness:.05,clearcoat:.4,clearcoatRoughness:.15}),new THREE.MeshStandardMaterial({map:texGabCostas,roughness:.5,metalness:.6})];
for(const m of matGab)m.userData.envFixo=1;
const geoGab=new THREE.BoxGeometry(1,1,1);
function gabinetes(parent,nc,nr,w,h){const im=new THREE.InstancedMesh(geoGab,[matGab[0],matGab[0],matGab[0],matGab[0],matGab[1],matGab[2]],nc*nr);im.userData={nc,nr,w,h};parent.add(im);im.frustumCulled=false;return im;}
const gabC=gabinetes(montG,40,10,.5,1);
const gabL=LATG.map(g=>{const im=gabinetes(g,13,10,LATD.w/13,LATD.h/10);im.visible=false;return im;});
const barraC=bx(montG,MAT_M.aco,LEDC.x0-.2,-.08,-.12,LEDC.x1+.2,.08,.12);
const barraL=LATG.map(g=>{const b=bx(g,MAT_M.aco,-LATD.w/2-.15,-.08,-.12,LATD.w/2+.15,.08,.12);b.visible=false;return b;});
const _oM=new THREE.Object3D(),_mM=new THREE.Matrix4(),ZERO=new THREE.Matrix4().makeScale(0,0,0);
// pendura as fileiras na barra: a barra sobe uma fileira por vez; só aparece o que já passou da linha de baixo
function poeGab(im,nf,y0,z,xc){const {nc,nr,w,h}=im.userData;const topo=y0+nf*h;let k=0;
  for(let r=0;r<nr;r++){const yc=topo-(r+.5)*h;const vis=yc-h/2>=y0-.01;for(let c=0;c<nc;c++,k++){
    if(!vis){im.setMatrixAt(k,ZERO);continue;}_oM.position.set(xc-(nc*w)/2+(c+.5)*w,yc,z);_oM.rotation.set(0,0,0);_oM.scale.set(w-.012,h-.012,.12);_oM.updateMatrix();im.setMatrixAt(k,_oM.matrix);}}
  im.instanceMatrix.needsUpdate=true;return topo;}
// talhas elétricas e correntes
const TALHAS=[];
function talha(x,y,z){const g=new THREE.Group();g.position.set(x,y,z);montG.add(g);const corpo=cyl(g,MAT_M.talha,0,-.25,0,.17,.17,.5,20);corpo.rotation.z=Math.PI/2;corpo.position.set(0,0,0);bx(g,MAT_M.talha,-.12,-.22,-.2,.12,.22,.2);bx(g,MAT_M.aco,-.05,.22,-.05,.05,.45,.05);
  const c=cyl(g,MAT_M.corrente,0,0,0,.025,.025,1,6);TALHAS.push({g,c});return TALHAS.length-1;}
function corrente(i,yAlvo){const T=TALHAS[i];const L=Math.max(.05,T.g.position.y-.25-yAlvo);T.c.scale.y=L;T.c.position.y=-.25-L/2;}
const TAL_GRID=[[-24.5,-1.2],[24.5,-1.2],[-24.5,-14.2],[24.5,-14.2]].map(([x,z])=>talha(x,YC+1.25,z));
const TAL_LED=[-7,7].map(x=>talha(x,YC-.7,LEDC.z-.1));
const TAL_LAT=LATG.map(g=>{g.updateMatrixWorld(true);const p=new V3(0,LATD.y0+LATD.h+1.6,-.1).applyMatrix4(g.matrixWorld);return talha(p.x,p.y,p.z);});
// empilhadeira telescópica
const empi=(()=>{const g=new THREE.Group();montG.add(g);
  bx(g,MAT_M.amarelo,-2.1,.6,-.95,2.1,1.3,.95);bx(g,MAT_M.talha,1.6,.55,-.9,2.35,1.45,.9);   // chassi e contrapeso
  const cab=new THREE.Group();g.add(cab);bx(cab,MAT_M.amarelo,-.45,1.3,-1,.65,1.42,-.1);bx(cab,MAT_M.amarelo,-.45,2.82,-1,.65,2.95,-.1);
  for(const [x,z] of [[-.45,-1],[.62,-1],[-.45,-.13],[.62,-.13]])bx(cab,MAT_M.talha,x-.03,1.42,z-.03,x+.03,2.82,z+.03);
  bx(cab,MAT_M.vidro,-.42,1.42,-.98,.6,2.82,-.96);bx(cab,MAT_M.vidro,-.43,1.42,-.97,-.41,2.82,-.15);bx(cab,MAT_M.vidro,.6,1.42,-.97,.62,2.82,-.15);
  for(const [x,z] of [[-1.4,-1],[1.4,-1],[-1.4,1],[1.4,1]]){const w=cyl(g,MAT_M.pneu,x,0,z,.62,.62,.5,28);w.rotation.x=Math.PI/2;w.position.y=.62;
    const a=cyl(g,MAT_M.aro,x,0,z+(z>0?.03:-.03),.36,.36,.48,20);a.rotation.x=Math.PI/2;a.position.y=.62;}
  const lanca=new THREE.Group();lanca.position.set(-1.6,1.9,.35);g.add(lanca);bx(lanca,MAT_M.amarelo,0,-.27,-.27,4.2,.27,.27);bx(lanca,MAT_M.amarelo,3.6,-.21,-.21,5.6,.21,.21);bx(lanca,MAT_M.aco,5.2,-.16,-.16,6.05,.16,.16);
  const garfo=new THREE.Group();garfo.position.set(6,0,0);lanca.add(garfo);
  bx(garfo,MAT_M.aco,0,-.6,-.6,.1,.4,.6);for(const z of [-.35,.35])bx(garfo,MAT_M.aco,0,-.6,z-.05,1.3,-.52,z+.05);const carga=bx(garfo,MAT_M.case,.15,-.5,-.55,1.25,.35,.55);
  g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return {g,lanca,garfo,carga};})();
// plataforma tesoura
const tesoura=(()=>{const g=new THREE.Group();montG.add(g);bx(g,MAT_M.laranja,-1.2,.15,-.6,1.2,.75,.6);for(const [x,z] of [[-.9,-.5],[.9,-.5],[-.9,.5],[.9,.5]]){const w=cyl(g,MAT_M.pneu,x,0,z,.16,.16,.12,20);w.rotation.x=Math.PI/2;w.position.y=.16;}
  const braco=[];for(let i=0;i<8;i++){const b=bx(g,MAT_M.aco,-1.15,-.04,-.04,1.15,.04,.04);b.position.z=i%2?.55:-.55;braco.push(b);}
  const plat=new THREE.Group();g.add(plat);bx(plat,MAT_M.laranja,-1.2,0,-.65,1.2,.12,.65);for(const [a,b,c,d] of [[-1.2,-.65,1.2,-.61],[-1.2,.61,1.2,.65],[-1.2,-.65,-1.16,.65],[1.16,-.65,1.2,.65]])bx(plat,MAT_M.amarelo,a,1.05,b,c,1.1,d);
  for(const [x,z] of [[-1.18,-.63],[1.18,-.63],[-1.18,.63],[1.18,.63]])bx(plat,MAT_M.amarelo,x-.02,.12,z-.02,x+.02,1.08,z+.02);
  return {g,plat,braco,alt:0};})();
function alturaTesoura(a){tesoura.alt=a;const piso=.8;tesoura.plat.position.y=piso+a;const n=4,dh=(a+.1)/n;const L=2.3;const ang=Math.asin(Math.min(.98,dh/L));
  tesoura.braco.forEach((b,i)=>{const k=Math.floor(i/2);b.position.y=piso-.05+dh*(k+.5);b.rotation.z=(k%2?1:-1)*ang;});}
// pilhas de cases e treliças no chão (vão sumindo conforme usadas)
const CASES=[];{const r=rng(91);for(let i=0;i<26;i++){const x=-34+r()*7+(i%2)*1.6,z=-12+i*.85;const hh=.9+r()*.4;const b=bx(montG,MAT_M.case,x-.6,0,z-.4,x+.6,hh,z+.4);CASES.push(b);for(const yy of [hh/2-.02,-hh/2+.02])bx(b,MAT_M.quina,-.61,-.02,-.41,.61,.02,.41).position.y=yy;for(const [cx,cz] of [[-.6,-.4],[.6,-.4],[-.6,.4],[.6,.4]])bx(b,MAT_M.quina,cx-.03,-hh/2,cz-.03,cx+.03,hh/2,cz+.03);}
 for(let i=0;i<10;i++){const x=31+(i%2)*1.2,z=-12+i*1.6;const t=new THREE.Group();t.position.set(x,0,z);montG.add(t);for(const [cx,cy] of [[-.35,.05],[.35,.05],[-.35,.75],[.35,.75]])cyl(t,P.trelica,cx,cy,0,.025,.025,2.8,10).rotation.x=Math.PI/2;for(let k=0;k<7;k++){const d=cyl(t,P.trelica,-.35,.05,-1.3+k*.43,.012,.012,.85,6);d.rotation.z=Math.PI/2.6;d.position.set(0,.4,-1.3+k*.43);}CASES.push(t);}}
// teste de pixels: barras coloridas, grade e círculo (conteúdo de teste, sem texto de marca)
function texTeste(w,h,retrato){return ctex(w,h,(c)=>{const cores=['#ffffff','#ffff00','#00ffff','#00ff00','#ff00ff','#ff0000','#0000ff'];const n=cores.length;
  if(!retrato)cores.forEach((k,i)=>{c.fillStyle=k;c.fillRect(i*w/n,0,w/n+1,h*.62);});else cores.forEach((k,i)=>{c.fillStyle=k;c.fillRect(0,i*h*.62/n,w,h*.62/n+1);});
  const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'#000');g.addColorStop(1,'#fff');c.fillStyle=g;c.fillRect(0,h*.62,w,h*.14);
  c.fillStyle='#111';c.fillRect(0,h*.76,w,h*.24);c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=2;const p=retrato?w/6:w/20;for(let x=0;x<=w;x+=p){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<=h;y+=p){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
  c.lineWidth=4;c.beginPath();c.arc(w/2,h/2,Math.min(w,h)*.38,0,Math.PI*2);c.stroke();c.fillStyle='#fff';c.font=`600 ${Math.round(h*.07)}px "IBM Plex Mono",monospace`;c.textAlign='center';c.fillText('TESTE DE PIXELS',w/2,h*.9);},true);}
const matTesteC=B({map:texTeste(1024,512,false),toneMapped:false,color:new THREE.Color(1.4,1.4,1.4)});
const matTesteL=B({map:texTeste(330,510,true),toneMapped:false,color:new THREE.Color(1.4,1.4,1.4)});
// luz de serviço (montagem acontece com luz branca de trabalho)
const luzServico=new THREE.DirectionalLight('#e6ecff',0);luzServico.position.set(20,40,40);scene.add(luzServico,luzServico.target);
const luzServico2=new THREE.DirectionalLight('#fff1dc',0);luzServico2.position.set(-30,25,10);scene.add(luzServico2);

/* ---------- equipe de montagem (mesmos humanos do público, com colete e capacete) ---------- */
const COLETE=['#ff6a13','#c9f03a','#ff6a13','#ff8a1e','#c9f03a','#ff6a13','#c9f03a','#ff6a13','#ff8a1e','#f4f4f0'];
const VAR_EQ=['m1','m4','m2','f4','m6','m3','m5','f6','m4','m1'].map(k=>VID[k]);
const rT=rng(777);
const TRAB=COLETE.map((c,i)=>sorteiaPessoa(rT,0,-100,0,0,{v:VAR_EQ[i],estilo:'bone',acento:i===9?'#f4f4f0':'#f2c200',top:c,baixo:i%2?'#2a2f3a':'#3a3226',tenis:'#3a2a1c',barba:i%3===0?1:0,anim:AID.olhando,fase:i*.13}));
const trabG=grupoGente(TRAB,montG,{semLo:true,lim:{hi:10,rHi:90,mid:10,rMid:999}});
const cargas=TRAB.map(()=>{const m=bx(montG,MAT_M.case,-.3,-.22,-.2,.3,.22,.2);m.visible=false;for(const yy of [.2,-.2])bx(m,MAT_M.quina,-.31,-.02,-.21,.31,.02,.21).position.y=yy;return m;});
// pose/modo antigos -> animações do esqueleto novo
const ANIM_EQ=(pose,andando,carrega)=>carrega?AID.carrega:andando?AID.anda:pose==='maos'?AID.fixa:pose==='percussao'?AID.tambor:pose==='aponta'?AID.aponta:AID.olhando;
// [x, h, z, olha para (x,z), pose, modo, carrega]
const G0=0,HH=H;
const PLANO0=[
 /* base */      [[-9,G0,3,[-9,-4],'celular',1,1],[-3,G0,4,[0,-6],'celular',1,1],[5,G0,3,[5,-6],'celular',1,1],[11,G0,4,[10,-4],'celular',1,1],[-16,G0,2.5,[-14,-6],'percussao',4,0],[16,G0,2.5,[14,-6],'percussao',4,0],[-22,G0,-3,[-18,-6],'celular',1,1],[22,G0,-4,[18,-6],'celular',1,1],[-27,G0,4,[-20,-2],'baixo',3,0],[0,G0,7,[0,-6],'aponta',3,0]],
 /* escada */    [[-6,HH,-2.2,[-3.5,-5],'percussao',4,0],[6,HH,-2.6,[3.5,-5],'percussao',4,0],[-9,HH,-6,[-6,-8],'maos',7,0],[9,HH,-6.5,[6,-8],'maos',7,0],[-14,G0,2.5,[-8,-4],'celular',1,1],[14,G0,2.5,[8,-4],'celular',1,1],[-2.5,HH,-1.2,[0,-6],'percussao',4,0],[2.5,HH,-1.4,[0,-6],'percussao',4,0],[-27,G0,4,[-20,-2],'baixo',3,0],[0,G0,6,[0,-6],'aponta',3,0]],
 /* torres */    [[-26.2,G0,.4,[-24.5,-1.2],'maos',7,0],[26.2,G0,.4,[24.5,-1.2],'maos',7,0],[-26.2,G0,-12.6,[-24.5,-14.2],'maos',7,0],[26.2,G0,-12.6,[24.5,-14.2],'maos',7,0],[-21,G0,-5.6,[-18.6,-5],'percussao',4,0],[21,G0,-5.8,[18.6,-5],'percussao',4,0],[-6,HH,-12,[-6,-14],'percussao',4,0],[6,HH,-12,[6,-14],'percussao',4,0],[-28,G0,2,[-24.5,-1.2],'aponta',3,0],[0,G0,6,[0,-6],'aponta',3,0]],
 /* grid */      [[-12.5,HH,-4.6,[-12,-6],'percussao',4,0],[12.5,HH,-4.6,[12,-6],'percussao',4,0],[-1,HH,-8.6,[0,-9.2],'maos',7,0],[3,HH,-5.8,[3,-5.2],'maos',7,0],[-18,HH,-8.4,[-15,-9.2],'percussao',4,0],[18,HH,-8.4,[15,-9.2],'percussao',4,0],[-7,HH,-1.8,[-7,-1.2],'maos',7,0],[7,HH,-1.8,[7,-1.2],'maos',7,0],[-28,G0,3,[-20,-2],'celular',1,1],[0,G0,6,[0,-6],'aponta',3,0]],
 /* içamento */  [[-26.4,G0,.6,[-24.5,-1.2],'percussao',4,0],[26.4,G0,.6,[24.5,-1.2],'percussao',4,0],[-26.4,G0,-12.4,[-24.5,-14.2],'percussao',4,0],[26.4,G0,-12.4,[24.5,-14.2],'percussao',4,0],[-8,G0,3,[-6,-6],'aponta',3,0],[8,G0,3,[6,-6],'aponta',3,0],[-14,G0,4.5,[-10,-6],'baixo',3,0],[14,G0,4.5,[10,-6],'baixo',3,0],[-28,G0,3,[-20,-2],'baixo',3,0],[0,G0,6,[0,8],'aponta',3,0]],
 /* led */       [[-7,HH,-12.2,[-7,-13.2],'maos',7,0],[-2.4,HH,-12.2,[-2.4,-13.2],'maos',7,0],[2.4,HH,-12.2,[2.4,-13.2],'maos',7,0],[-10.5,HH,-11.4,[-9,-13.2],'celular',1,1],[11.5,HH,-11,[10,-13.2],'celular',1,1],[-4.5,HH,-10.4,[-4,-13.2],'celular',1,1],[0,HH,-9.6,[0,-13.2],'aponta',3,0],[3,HH,-9.8,[0,-13.2],'percussao',4,0],[8.6,HH+2.6,-11.6,[8.6,-13.2],'maos',7,0],[0,G0,6,[0,-6],'aponta',3,0]],
 /* laterais */  [[-21.2,G0,-3.6,[-19.5,-5],'maos',7,0],[-16.4,G0,-2.8,[-17.6,-5],'maos',7,0],[21.2,G0,-3.6,[19.5,-5],'maos',7,0],[16.4,G0,-2.8,[17.6,-5],'maos',7,0],[-20,G0,1,[-18.6,-5],'celular',1,1],[20,G0,1,[18.6,-5],'celular',1,1],[-12,G0,2.6,[-16,-5],'aponta',3,0],[12,G0,2.6,[16,-5],'baixo',3,0],[-17.2,G0+3.4,-2.6,[-18.6,-5],'maos',7,0],[0,G0,6,[0,-6],'aponta',3,0]],
 /* som */       [[-22.3,G0,2.4,[-22.3,.4],'percussao',4,0],[22.3,G0,2.4,[22.3,.4],'percussao',4,0],[-25.6,G0,1.2,[-25.6,-1.2],'maos',7,0],[25.6,G0,1.2,[25.6,-1.2],'maos',7,0],[-11,G0,2.6,[-11,1],'celular',1,1],[11,G0,2.6,[11,1],'celular',1,1],[-21,G0,38.4,[-21,40.6],'maos',7,0],[21,G0,38.4,[21,40.6],'maos',7,0],[-28,G0,3,[-20,-2],'baixo',3,0],[0,G0,6,[0,-6],'aponta',3,0]],
 /* acabamento */[[-8,G0,3.4,[-8,2.3],'celular',1,1],[0,G0,3.6,[0,2.3],'celular',1,1],[8,G0,3.4,[8,2.3],'celular',1,1],[-16,G0,3.6,[-16,2.3],'celular',1,1],[-5.5,HH+.6,-11.2,[-5.5,-12.6],'percussao',4,0],[5.5,HH+.6,-11.2,[5.5,-12.6],'percussao',4,0],[-10,HH,-8.2,[-10,-9.6],'percussao',4,0],[10,HH,-8.2,[10,-9.4],'percussao',4,0],[0,G0,28,[0,32],'percussao',4,0],[0,G0,6,[0,-6],'aponta',3,0]],
 /* teste */     [[-30,G0,-8,[-40,-8],'baixo',1,0],[-30.5,G0,-6,[-40,-6],'baixo',1,0],[30,G0,-8,[40,-8],'baixo',1,0],[30.5,G0,-6,[40,-6],'baixo',1,0],[-31,G0,-4,[-40,-4],'baixo',1,0],[31,G0,-4,[40,-4],'baixo',1,0],[-31,G0,-10,[-40,-10],'baixo',1,0],[31,G0,-10,[40,-10],'baixo',1,0],[-32,G0,-2,[-40,-2],'baixo',1,0],[2,G0,30,[0,32],'aponta',3,0]],
];
const PLANO=ORDEM.map(id=>PLANO0[ID_ANT.indexOf(id)]);
function poeTrab(t){const n=ETAPAS.length;let s=0;for(let i=0;i<n;i++)if(t>=ETAPAS[i].ini)s=i;const u=uEt(s,t);const agora=GU.uTempo.value;
  TRAB.forEach((p,i)=>{const A=PLANO[Math.max(0,s-1)][i],Bp=PLANO[s][i];const anda=s>0?cl(u/.3):1;const k=sm(anda);
    let x=A[0]+(Bp[0]-A[0])*k,h=A[1]+(Bp[1]-A[1])*k,z=A[2]+(Bp[2]-A[2])*k;
    if(s===0){const vai=Math.sin(t*1.1+i)*.5+.5;x=Bp[0]+(Bp[3][0]-Bp[0])*.3*vai;z=Bp[2]+(Bp[3][1]-Bp[2])*.3*vai;}
    const andando=(s>0&&anda<1&&Math.hypot(Bp[0]-A[0],Bp[2]-A[2])>.3)||(s===0&&Bp[5]===1);
    let yaw;if(andando){const dx=s===0?(Bp[3][0]-Bp[0])*Math.cos(t*1.1+i):Bp[0]-A[0],dz=s===0?(Bp[3][1]-Bp[2])*Math.cos(t*1.1+i):Bp[2]-A[2];yaw=Math.atan2(dx,dz);}
    else yaw=Math.atan2(Bp[3][0]-Bp[0],Bp[3][1]-Bp[2]);
    const fora=s===n-1&&u>.62&&i<9;
    const carrega=!!Bp[6]&&(s===0||andando||Bp[5]===1);
    p.x=x;p.y=h;p.z=z;p.yaw=yaw;p.oculto=fora?1:0;trabG.anima(i,ANIM_EQ(Bp[4],andando||Bp[5]===1,carrega),agora,.35);
    const cg=cargas[i];cg.visible=carrega&&!fora;const alt=VAR[p.v].altura*p.sx;cg.position.set(x+Math.sin(yaw)*.36,h+alt*.6,z+Math.cos(yaw)*.36);cg.rotation.y=yaw;});}
function escondeTrab(){TRAB.forEach((p,i)=>{p.oculto=1;cargas[i].visible=false;});trabG.sync();}
/* ---------- lista de peças (quantidades ilustrativas, calculadas pelas medidas do estudo) ---------- */
const nGrade=GRADE.length;
const mtsGrid=4*49+5*13;
const PECAS=[
 {nome:'Praticável 2 × 1 m',q:PRAT.length+' un.',d:'Plataforma com pés reguláveis; forma o piso de 42 × 15 m a 2 m de altura.',e:0,foco:{p:[26,10,20],l:[0,1.5,-7]},box:[[-21,0,-15],[21,H,0]]},
 {nome:'Degrau cenográfico',q:DEGRAUS.length+' un.',d:'Estrutura metálica com revestimento de pedra; 6 m de largura, sobe 5 m.',e:1,foco:{p:[10,6,9],l:[0,4.5,-6]},box:[[-3,H,ESC.z1],[3,ESC.topo,ESC.z0]]},
 {nome:'Módulo da pirâmide',q:(PIR.length+1)+' un.',d:'Quatro patamares de cada lado e o patamar do topo, onde fica o artista.',e:1,foco:{p:[18,8,10],l:[8,4,-8]},box:[[-13,H,ESC.zTopo],[13,ESC.topo,-3.4]]},
 {nome:'Guarda-corpo de pedra',q:GUARDA.length+' un.',d:'Acompanha a escada e recebe os queimadores de chama no topo.',e:1,foco:{p:[-9,6,6],l:[-3.4,5,-6]},box:[[-3.9,H,ESC.zTopo],[3.9,ESC.topo+1.1,ESC.z0+.8]]},
 {nome:'Torre de treliça Q76',q:'4 × 18,9 m',d:'Ground support: cada torre tem base, seções de 3 m e topo com talha. ≈ 28 seções no total.',e:2,foco:{p:[-34,10,12],l:[-24.5,9,-6]},box:[[-25,0,-14.7],[-24,YC+.5,-.7]]},
 {nome:'Torre dos LEDs laterais',q:'4 un.',d:'Duas por LED lateral, com talha no topo para pendurar os gabinetes.',e:2,foco:{p:[-8,8,12],l:[-18.6,8,-5]},box:[[-23,0,-7],[-14,LATD.y0+LATD.h+1.3,-3]]},
 {nome:'Treliça Q60 do grid',q:'≈ '+Math.round(mtsGrid/3)+' seções de 3 m',d:`${mtsGrid} m de treliça formando o teto de 49 × 13 m a 18,5 m de altura.`,e:3,foco:{p:[24,24,26],l:[0,YC,-8]},box:[[-24.8,YC-.4,-14.5],[24.8,YC+.4,-.9]]},
 {nome:'Talha elétrica 1 t',q:(TALHAS.length)+' un.',d:'Motores de corrente que içam o grid, o LED central e os LEDs laterais.',e:4,foco:{p:[-30,22,8],l:[-24.5,YC,-1.2]},box:[[-24.8,YC+.9,-1.5],[-24.2,YC+1.6,-.9]]},
 {nome:'Gabinete de LED 50 × 100 cm',q:'400 un.',d:'LED central de 20 × 10 m (40 colunas × 10 fileiras). Ex.: pitch 3,9 mm.',e:5,foco:{p:[6,7,4],l:[0,7.6,-13]},box:[[LEDC.x0,LEDC.y0,LEDC.z-.2],[LEDC.x1,LEDC.y1,LEDC.z]]},
 {nome:'Gabinete de LED (laterais)',q:'260 un.',d:'Dois LEDs de 6,6 × 10,2 m em retrato (13 × 10 gabinetes cada).',e:6,foco:{p:[-8,8,11],l:[-18.6,8.5,-5]},box:[[-22,LATD.y0,-6],[-15,LATD.y0+LATD.h,-4]]},
 {nome:'Barra de suspensão do LED',q:'3 un.',d:'Uma para o LED central e uma para cada lateral; recebe a primeira fileira de gabinetes.',e:5,foco:{p:[6,10,2],l:[0,12.6,-13]},box:[[LEDC.x0,LEDC.y1,LEDC.z-.2],[LEDC.x1,LEDC.y1+.2,LEDC.z]]},
 {nome:'Caixa de line array',q:'64 un.',d:'Dois conjuntos principais (14 caixas), dois de lateral (10) e dois de delay (8).',e:7,foco:{p:[30,12,16],l:[22.3,13.5,.4]},box:[[21.6,11.3,-.2],[23,17.4,1]]},
 {nome:'Subwoofer',q:SUBS.length+' un.',d:'Empilhados no chão, na frente do palco.',e:7,foco:{p:[16,4,10],l:[11,.8,1]},box:[[8.3,0,.6],[13.6,1.5,1.5]]},
 {nome:'Moving head',q:MH.length+' un.',d:'20 no grid e 8 no chão do palco, ao lado do LED.',e:3,foco:{p:[10,12,10],l:[0,YC-1,-5]},box:[[-19.5,YC-1,-9.7],[19.5,YC,-.8]]},
 {nome:'Refletor quadrado (PIX)',q:PIX.length+' un.',d:'Fileiras no teto, acima do LED central e em volta dos LEDs laterais.',e:3,foco:{p:[8,10,8],l:[0,YC-1.2,-7]},box:[[-20.5,YC-1.5,-10.5],[20.5,YC-.8,-3.9]]},
 {nome:'Queimador de chama',q:FOGO_POS.length+' un.',d:'Sete de cada lado, no topo dos guarda-corpos da escada.',e:8,foco:{p:[-10,7,5],l:[-3.4,5.5,-6]},box:[[-3.8,H+1,ESC.zTopo],[3.8,ESC.topo+1.4,ESC.z0+.8]]},
 {nome:'Pano preto',q:PANOS.length+' un.',d:'Fundo de 51 × 19 m e duas laterais; escondem a arquibancada atrás do palco.',e:8,foco:{p:[0,12,30],l:[0,9,-15]},box:[[-25.5,0,-15.6],[25.5,YC_PANO,-15.4]]},
 {nome:'Grade de contenção',q:nGrade+' un.',d:'Painéis de 1,2 m em toda a frente do palco.',e:8,foco:{p:[-12,3,10],l:[-4,.6,2.3]},box:[[-26,0,2.25],[26,1.2,3.2]]},
 {nome:'Tenda da mesa de som',q:'1 un.',d:'Mesa de som e luz a 32 m do palco — é o ponto ideal da ilusão do LED.',e:8,foco:{p:[12,8,44],l:[0,1.5,32]},box:[[-5.2,0,PONTO.z-3.2],[5.2,4.75,PONTO.z+3.7]]},
 {nome:'Empilhadeira telescópica',q:'1 un.',d:'Leva gabinetes, cases e seções de treliça até o palco.',e:2,foco:{p:[38,8,14],l:[29,2,-2]},box:null,obj:()=>empi.g},
 {nome:'Plataforma tesoura',q:'1 un.',d:'Leva o técnico até a altura do LED para fixar e conectar os gabinetes.',e:5,foco:{p:[16,7,0],l:[8.6,4,-11.6]},box:null,obj:()=>tesoura.g},
];
PECAS.forEach(p=>p.e=ORDEM.indexOf(ID_ANT[p.e]));
let destaque=null,destaqueT=0;
function realca(pc){if(destaque){scene.remove(destaque);destaque=null;}
  const b3=new THREE.Box3();if(pc.box)b3.set(new V3(...pc.box[0]),new V3(...pc.box[1]));else b3.setFromObject(pc.obj());b3.expandByScalar(.15);
  destaque=new THREE.Box3Helper(b3,new THREE.Color(2.2,1.7,.9));destaque.material.transparent=true;destaque.material.toneMapped=false;destaque.material.depthTest=false;scene.add(destaque);destaqueT=0;}

/* ---------- aplica o estado da montagem no tempo t ---------- */
const N_TR={};for(const k in TRELICAS)N_TR[k]=TRELICAS[k].count;
const DY_GRID=(H+1.1)-YC;
const pixBase=[];{for(let i=0;i<PIX.length;i++){const a=new THREE.Matrix4(),b=new THREE.Matrix4();pixCaixa.getMatrixAt(i,a);pixFace.getMatrixAt(i,b);pixBase.push([a,b]);}}
const mhBase=MH.map(m=>m.g.position.y);
const BANDA=()=>palco.children.slice(N_P1);
const _cA=new THREE.Color();
function aplicaMont(t){const u=ETAPAS.map((e,i)=>uEt(i,t));const E={};ETAPAS.forEach((e,i)=>E[e.id]=u[i]);
  // 0 · base
  {const n=PRAT.length;PRAT.forEach(([x,z],i)=>{const k=janela(E.base,i,n,.06);if(k<=0||E.base>=1){pratMesh.setMatrixAt(i,ZERO);return;}_oM.position.set(x,H+(1-eo(k))*1.6,z);_oM.rotation.set(0,0,0);_oM.scale.set(1,1,1);_oM.updateMatrix();pratMesh.setMatrixAt(i,_oM.matrix);});
   pratMesh.instanceMatrix.needsUpdate=true;pratMesh.visible=E.base>0&&E.base<1;for(const o of DECK){volta(o);o.visible=E.base>=1;}}
  // 1 · escadaria e pirâmide
  {const L=[...DEGRAUS,PATAMAR,...PIR.slice().sort((a,b)=>base(a).p.y-base(b).p.y),FUNDO_PIR];L.forEach((o,i)=>surge(o,janela(E.escada,i,L.length+2,.14)));
   GUARDA.forEach(o=>{const k=sm(cl((E.escada-.55)/.4));o.visible=k>.001;o.scale.y=Math.max(k,.001);});}
  // 2 · torres
  for(const k of ['torres','torresLat','torresDelay']){const im=TRELICAS[k];const c=Math.round(N_TR[k]*cl(k==='torres'?E.torres/.75:(E.torres-.25)/.75));im.count=c;im.visible=c>0;}
  // 3 · grid montado embaixo  + 4 · içamento
  const dy=DY_GRID*(1-sm(E.icamento));
  {const im=TRELICAS.grid;const c=Math.round(N_TR.grid*cl(E.grid/.6));im.count=c;im.visible=c>0;im.position.y=dy;}
  MH.forEach((m,i)=>{if(m.tipo==='chao'){const k=janela(E.acabamento,i-20,8,.3);m.g.visible=k>0;m.g.position.y=mhBase[i]+(1-eo(k))*3;return;}
    const n=MH.filter(x=>x.tipo!=='chao').length;const k=janela(cl((E.grid-.45)/.55),i,n,.3);m.g.visible=k>0;m.g.position.y=mhBase[i]+dy+(1-eo(k))*1.2;});
  {let iT=0;const nT=PIX.filter(f=>f.grupo==='teto').length;PIX.forEach((f,i)=>{let vis,off=0;
     if(f.grupo==='teto'){vis=janela(cl((E.grid-.35)/.6),iT++,nT,.2)>0;off=dy;}else if(f.grupo==='led')vis=E.led>.92;else vis=E.laterais>.9;
     if(!vis){pixCaixa.setMatrixAt(i,ZERO);pixFace.setMatrixAt(i,ZERO);return;}
     for(const [im,j] of [[pixCaixa,0],[pixFace,1]]){_mM.copy(pixBase[i][j]);_mM.elements[13]+=off;im.setMatrixAt(i,_mM);}});
   pixCaixa.instanceMatrix.needsUpdate=pixFace.instanceMatrix.needsUpdate=true;}
  // talhas: aparecem quando o grid fica pronto e somem depois do som
  const talVis=E.grid>.6&&E.som<1;TAL_GRID.forEach(i=>{TALHAS[i].g.visible=talVis;corrente(i,YC+dy+.3);});
  // 5 · LED central
  {const nf=10*E.led;gabC.visible=E.led>0;barraC.visible=E.led>0;TAL_LED.forEach(i=>TALHAS[i].g.visible=E.led>0&&E.som<1);
   if(E.led>0){const topo=poeGab(gabC,nf,LEDC.y0,LEDC.z-.075,0);barraC.position.set(0,topo+.1,LEDC.z-.1);TAL_LED.forEach(i=>corrente(i,topo+.2));}
   LEDCX.visible=E.led>=1;}
  // 6 · LEDs laterais
  LATG.forEach((g,gi)=>{const k=E.laterais;const nf=10*cl(k/.9);const im=gabL[gi];im.visible=k>0;barraL[gi].visible=k>0;const i=TAL_LAT[gi];TALHAS[i].g.visible=k>0&&E.som<1;
    if(k>0){const topo=poeGab(im,nf,LATD.y0,-.075,0);barraL[gi].position.set(0,topo+.1,-.1);corrente(i,TALHAS[i].g.position.y-(LATD.y0+LATD.h+1.6)+topo+.2);}
    g.children[0].visible=k>=1;g.children[1].visible=k>.2;});
  // 7 · som
  LA.forEach((g,i)=>{const k=janela(E.som,i,LA.length,.45);sobe(g,k,9);});SUBS.forEach((o,i)=>cai(o,janela(E.som,i,SUBS.length,.3),3));
  // 8 · acabamento
  QUEIM.forEach((o,i)=>cai(o,janela(E.acabamento,i,QUEIM.length,.3),2));PANOS.forEach((o,i)=>desce(o,cl((E.acabamento-.1*i)/.5)));
  GRADE.forEach((par,i)=>{const k=janela(E.acabamento,i,GRADE.length,.12);for(const o of par)surge(o,k);});
  {const k=cl((E.acabamento-.5)/.4);fohG.visible=k>0;fohG.scale.y=Math.max(.001,sm(k));}
  BANDA().forEach((o,i)=>cai(o,cl((E.acabamento-.3)/.4),2.5));
  // máquinas e cases
  CASES.forEach((o,i)=>{o.visible=t<ETAPAS[2+Math.floor(i/5)%7].ini+3;});
  {const s=u.findIndex(x=>x<1);const e=s<0?9:s;const P0={base:[40,0,12,0,.1],escada:[36,0,10,-.3,.1],torres:[30,0,-4,-1.57,.45],grid:[27,0,6,-.6,.25],icamento:[36,0,12,-.3,.1],led:[14,0,5,-1.2,.62],laterais:[-26,0,7,2.5,.5],som:[29,0,7,-.8,.35],acabamento:[36,0,14,0,.1],teste:[44,0,18,0,.1]};const ids=ETAPAS.map(x=>x.id);
   const A=P0[ids[Math.max(0,e-1)]],Bq=P0[ids[e]],k=sm(cl((u[e]||0)/.35));empi.g.position.set(A[0]+(Bq[0]-A[0])*k,0,A[2]+(Bq[2]-A[2])*k);empi.g.rotation.y=A[3]+(Bq[3]-A[3])*k;
   const ang=A[4]+(Bq[4]-A[4])*k+.05*Math.sin(t*.7);empi.lanca.rotation.z=ang;empi.garfo.rotation.z=-ang;empi.carga.visible=['torres','led','laterais'].includes(ids[e]);}
  {let pos=[-30,0,8],alt=0;if(E.led>0&&E.led<1){pos=[8.6,H,-11.6];alt=Math.min(6.2,1+E.led*6);}else if(E.laterais>0&&E.laterais<1){pos=[-17.2,0,-2.6];alt=Math.min(8.2,1.2+E.laterais*8);}
   else if(E.led>=1&&E.laterais<=0){pos=[8.6,H,-11.6];alt=.2;}
   tesoura.g.position.set(...pos);tesoura.g.rotation.y=0;alturaTesoura(alt);
   MONT.lift={pos,alt,on:(E.led>.05&&E.led<1)||(E.laterais>.05&&E.laterais<1)};}
  return u;}
function estadoFinal(){for(const [o] of BASE)volta(o);pratMesh.visible=false;for(const k in TRELICAS){TRELICAS[k].count=N_TR[k];TRELICAS[k].visible=true;TRELICAS[k].position.y=0;}
  MH.forEach((m,i)=>{m.g.visible=true;m.g.position.y=mhBase[i];});PIX.forEach((f,i)=>{pixCaixa.setMatrixAt(i,pixBase[i][0]);pixFace.setMatrixAt(i,pixBase[i][1]);});pixCaixa.instanceMatrix.needsUpdate=pixFace.instanceMatrix.needsUpdate=true;
  for(const o of DECK)o.visible=true;LEDCX.visible=true;LATG.forEach(g=>{g.children[0].visible=g.children[1].visible=true;});GUARDA.forEach(o=>{o.visible=true;o.scale.y=1;});fohG.visible=true;fohG.scale.y=1;
  gabL.forEach(g=>g.visible=false);barraL.forEach(b=>b.visible=false);
  telaCentral.material=matCentral;telaCentral.visible=true;telasLat.forEach((m,i)=>{m.material=matLat[i];m.visible=true;});escondeTrab();montG.visible=false;
  tesoura.g.visible=false;luzServico.intensity=luzServico2.intensity=0;if(destaque){scene.remove(destaque);destaque=null;}
  NO_PALCO.forEach(p=>p.oculto=0);palcoG.sync();fogo.userData.fag.visible=true;}

/* ---------- por quadro: sobrepõe as luzes do show com a luz de serviço ---------- */
function atualizaMontagem(dt,t){
  if(MONT.tocando){MONT.t=Math.min(T_MONT,MONT.t+dt);if(MONT.t>=T_MONT){MONT.tocando=false;iconeMont();}}
  const tm=MONT.t;const u=aplicaMont(tm);poeTrab(tm);
  {const L=TRAB[8],q=MONT.lift;if(q&&q.on&&!L.oculto){L.x=q.pos[0];L.y=q.pos[1]+.8+q.alt+.12;L.z=q.pos[2];}}
  trabG.sync();
  const e=ETAPAS.findIndex(x=>tm<x.ini+x.d);const ei=e<0?ETAPAS.length-1:e;if(ei!==MONT.etapa){MONT.etapa=ei;mostraEtapa(ei);}
  const ut=u[9];const sv=1-sm(cl((ut-.04)/.22));const sh=sm(cl((ut-.32)/.3));const teste=ut>.08&&ut<.36;
  MONT.ledVivo=ut>.3;
  // LEDs: apagados → teste de pixels → conteúdo
  telaCentral.visible=ut>.08;telaCentral.material=ut<.34?matTesteC:matCentral;telasLat.forEach((m,i)=>{m.visible=ut>.1;m.material=ut<.34?matTesteL:matLat[i];});
  luzLED.intensity*=sh;luzLED.intensity+=teste?.8:0;luzLat.forEach(l=>{l.intensity*=sh;});
  // luzes
  hemiP.color.lerp(_cA.set('#9aa3b8'),sv);hemiP.intensity=hemiP.intensity*sh+sv*.9;luzServico.intensity=sv*2.1;luzServico2.intensity=sv*1.1;
  seguidor.intensity*=sh;for(const s of lavagem)s.intensity=s.intensity*sh+(teste?2:0);
  const chase=teste?(ut-.08)/.28:-1;
  PIX.forEach((f,i)=>{pixFace.getColorAt(i,_cA);_cA.multiplyScalar(sh);if(chase>=0){const on=Math.abs(((f.p.x+25)/50)-chase*1.4+.2)<.12?3.5:0;_cA.r+=on;_cA.g+=on;_cA.b+=on;}pixFace.setColorAt(i,_cA);});pixFace.instanceColor.needsUpdate=true;
  for(const m of MH){if(teste){m.cab.rotation.set(.2+Math.sin(t*1.4+m.i)*.35,0,Math.sin(t*1.1+m.i*.7)*.5);m.mat.color.setRGB(1,1,1);m.mat.opacity=.18;m.lente.material.color.setRGB(3,3,3);}
    else{m.mat.opacity*=sh;m.lente.material.color.multiplyScalar(Math.max(.05,sh));}}
  const jato=ut>.4&&ut<.46?1:0;FOGO_U.uK.value=FOGO_U.uK.value*sh+jato*1.2;if(jato)FOGO_U.uJato.value=1;luzFogo.forEach(l=>l.intensity=l.intensity*sh+jato*3);
  FUM_U.uK.value*=sh;fumacaBaixa.visible=sh>.02&&camadas.fumaca;for(const n of NEVOA)n.material.opacity*=sh;
  celulares.visible=false;CONF_U.uT0.value=-100;luzesArq.material.uniforms.uK.value*=sh;
  scene.fog.color.lerp(_cA.set('#1a1d24'),sv*.8);
  // artista e banda entram no fim do teste
  const entra=ut>.55;NO_PALCO.forEach(p=>{p.oculto=entra?0:1;});palcoG.sync();fogo.userData.fag.visible=FOGO_U.uK.value>.01&&camadas.fogo;
  if(destaque){destaqueT+=dt;destaque.material.opacity=.55+.45*Math.sin(destaqueT*5);if(destaqueT>7){scene.remove(destaque);destaque=null;}}
  // barra de progresso
  segsM.forEach((b,i)=>{b.querySelector('i').style.width=(u[i]*100)+'%';b.setAttribute('aria-current',i===ei?'step':'false');});
}
/* câmera automática da montagem: segue a etapa com um leve deslocamento */
const camM={p:new V3(),l:new V3(),fov:40,de:null,t:1};
function camMontagem(dt,t){const e=ETAPAS[Math.max(0,MONT.etapa)];const c=e.cam;const deriva=Math.sin(t*.12)*1.2;
  const alvoP=new V3(c.p[0]+deriva,c.p[1],c.p[2]),alvoL=new V3(...c.l);const fov=c.fov*(camera.aspect<1?1.45:1);
  if(camM.de!==MONT.etapa){camM.de=MONT.etapa;camM.p0=camera.position.clone();camM.l0=controls.target.clone();camM.f0=camera.fov;camM.t=0;}
  camM.t=Math.min(1,camM.t+dt/2.4);const k=ease(camM.t);camera.position.lerpVectors(camM.p0,alvoP,k);controls.target.lerpVectors(camM.l0,alvoL,k);camera.fov=camM.f0+(fov-camM.f0)*k;camera.updateProjectionMatrix();camera.lookAt(controls.target);}

// posiciona a câmera da etapa na hora (prints e testes)
function camEtapaJa(i){const e=ETAPAS[i];const c=e.cam;camera.position.set(...c.p);controls.target.set(...c.l);camera.fov=c.fov*(camera.aspect<1?1.45:1);camera.updateProjectionMatrix();camera.lookAt(controls.target);camM.de=i;camM.t=1;MONT.etapa=i;mostraEtapa(i);}
/* ---------- interface ---------- */
const montEl=document.getElementById('mont'),pecasEl=document.getElementById('pecas'),bMont=document.getElementById('bMont'),bMPlay=document.getElementById('bMPlay'),bPecas=document.getElementById('bPecas');
const segsM=ETAPAS.map((e,i)=>{const b=document.createElement('button');b.innerHTML=`<i></i><span>${i+1}</span>`;b.title=e.nome;b.setAttribute('aria-label',`Etapa ${i+1}: ${e.nome}`);
  b.onclick=()=>{MONT.t=e.ini+.001;MONT.camAuto=true;MONT.tocando=true;iconeMont();};document.getElementById('montSegs').appendChild(b);return b;});
function iconeMont(){bMPlay.innerHTML=MONT.tocando?'<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9"/><rect x="7" y="1.5" width="3" height="9"/></svg>':(MONT.t>=T_MONT?'<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M10 6a4 4 0 1 1-1.2-2.85"/><path d="M9.5 1.2v2.4H7.1"/></svg>':'<svg viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2.5 1.5l8 4.5-8 4.5z"/></svg>');
  bMPlay.setAttribute('aria-label',MONT.tocando?'Pausar montagem':MONT.t>=T_MONT?'Montar de novo':'Continuar montagem');}
bMPlay.onclick=()=>{if(MONT.t>=T_MONT){MONT.t=0;MONT.camAuto=true;}MONT.tocando=!MONT.tocando;iconeMont();};
function mostraEtapa(i){const e=ETAPAS[i];document.getElementById('montN').textContent=`${String(i+1).padStart(2,'0')} / ${ETAPAS.length}`;document.getElementById('montT').textContent=e.nome;document.getElementById('montD').textContent=e.txt;
  pecasEl.querySelectorAll('li').forEach(li=>li.classList.toggle('agora',+li.dataset.e===i));}
{const ul=document.getElementById('pecasL');PECAS.forEach((pc,i)=>{const li=document.createElement('li');li.dataset.e=pc.e;
  li.innerHTML=`<button><span class="pn">${pc.nome}</span><span class="pq">${pc.q}</span><span class="pd">${pc.d}</span><span class="pe">Etapa ${pc.e+1} · ${ETAPAS[pc.e].nome}</span></button>`;
  li.querySelector('button').onclick=()=>{MONT.t=ETAPAS[pc.e].ini+ETAPAS[pc.e].d-.01;MONT.tocando=false;iconeMont();MONT.camAuto=false;
    tween={p0:camera.position.clone(),l0:controls.target.clone(),f0:camera.fov,p1:new V3(...pc.foco.p),l1:new V3(...pc.foco.l),f1:42*(camera.aspect<1?1.45:1),t:0,d:1.8};realca(pc);
    if(matchMedia('(max-width:820px)').matches){pecasEl.hidden=true;bPecas.setAttribute('aria-pressed','false');}vista();};ul.appendChild(li);});}
bPecas.onclick=()=>{pecasEl.hidden=!pecasEl.hidden;bPecas.setAttribute('aria-pressed',!pecasEl.hidden);vista();};
document.getElementById('pecasX').onclick=()=>{pecasEl.hidden=true;bPecas.setAttribute('aria-pressed','false');vista();};
function vista(){const w=stage.clientWidth,h=stage.clientHeight;const estreito=matchMedia('(max-width:820px)').matches;const d=(MONT.ativo&&!pecasEl.hidden&&!estreito)?Math.min(390,w*.3)/2:0;
  if(d>0){camera.aspect=(w+2*d)/h;camera.setViewOffset(w+2*d,h,2*d,0,w,h);}else{camera.clearViewOffset();camera.aspect=w/h;}camera.updateProjectionMatrix();}
function setMontagem(v){if(v===MONT.ativo)return;MONT.ativo=v;document.body.classList.toggle('mont',v);montEl.hidden=!v;bMont.setAttribute('aria-pressed',v);
  if(v){if(modoMidia)setMidia(false);document.getElementById('bPrev').setAttribute('aria-pressed','false');info.hidden=true;bInfo.setAttribute('aria-pressed','false');
    if(auto)bSeq.click();MONT.pubAntes=camadas.publico;camadas.publico=false;aplicaCamadas();montG.visible=true;tesoura.g.visible=true;trabG.lod(camera,true);
    MONT.t=0;MONT.tocando=true;MONT.camAuto=true;MONT.etapa=-1;camM.de=null;tShow=.01;iconeMont();
    if(!matchMedia('(max-width:820px)').matches){pecasEl.hidden=false;bPecas.setAttribute('aria-pressed','true');}}
  else{estadoFinal();camadas.publico=MONT.pubAntes;aplicaCamadas();pecasEl.hidden=true;bPecas.setAttribute('aria-pressed','false');document.getElementById('bPrev').setAttribute('aria-pressed',!modoMidia);MONT.ledVivo=true;}vista();}
bMont.onclick=()=>setMontagem(true);
document.getElementById('bPrev').addEventListener('click',()=>setMontagem(false));document.getElementById('bMidia').addEventListener('click',()=>setMontagem(false));
document.getElementById('bInfo').addEventListener('click',()=>{if(MONT.ativo){pecasEl.hidden=true;bPecas.setAttribute('aria-pressed','false');}});
