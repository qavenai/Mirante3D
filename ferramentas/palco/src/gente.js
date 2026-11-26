/* ================= PESSOAS v5 =================
   Corpos MakeHuman (CC0) com variação real de corpo, altura e proporção; roupas com caimento e dobras,
   cabelo com volume (cascas), olhos, cílios e pele com textura de detalhe. Gerados no Blender (ferramentas/palco-gente).
   Esqueleto de 53 ossos animado na GPU: as poses de cada animação ficam numa textura (osso × quadro) e cada pessoa
   é uma instância com animação, fase, cores e roupa próprias. Três níveis de detalhe + figurinhas ao longe. */
function gunzip(d){let p=10;const fl=d[3];if(fl&4)p+=2+(d[10]|d[11]<<8);if(fl&8)while(d[p++]);if(fl&16)while(d[p++]);if(fl&2)p+=2;
  const n=(d[d.length-4]|d[d.length-3]<<8|d[d.length-2]<<16|d[d.length-1]<<24)>>>0;const out=new Uint8Array(n);const src=d.subarray(p);let bi=0,bb=0,bc=0,op=0;
  const bit=()=>{if(!bc){bb=src[bi++];bc=8;}const b=bb&1;bb>>=1;bc--;return b;};const bits=k=>{let x=0;for(let i=0;i<k;i++)x|=bit()<<i;return x;};
  const mk=(L,c)=>{const cnt=new Uint16Array(16),off=new Uint16Array(16),sym=new Uint16Array(c);for(let i=0;i<c;i++)cnt[L[i]]++;cnt[0]=0;for(let i=1;i<16;i++)off[i]=off[i-1]+cnt[i-1];for(let i=0;i<c;i++)if(L[i])sym[off[L[i]]++]=i;return {cnt,sym};};
  const dec=t=>{let code=0,first=0,idx=0;for(let l=1;l<16;l++){code|=bit();const c=t.cnt[l];if(code-c<first)return t.sym[idx+code-first];idx+=c;first+=c;first<<=1;code<<=1;}return -1;};
  const LB=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],LE=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];
  const DB=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],DE=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];
  const ORD=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];let fim;
  do{fim=bit();const tp=bits(2);
    if(tp===0){bc=0;const len=src[bi]|src[bi+1]<<8;bi+=4;out.set(src.subarray(bi,bi+len),op);op+=len;bi+=len;continue;}
    let lt,dt;
    if(tp===1){const L=new Uint8Array(288);L.fill(8,0,144);L.fill(9,144,256);L.fill(7,256,280);L.fill(8,280,288);lt=mk(L,288);dt=mk(new Uint8Array(30).fill(5),30);}
    else{const hl=bits(5)+257,hd=bits(5)+1,hc=bits(4)+4;const cl=new Uint8Array(19);for(let i=0;i<hc;i++)cl[ORD[i]]=bits(3);const ct=mk(cl,19);const L=new Uint8Array(hl+hd);let i=0;
      while(i<hl+hd){const s=dec(ct);if(s<16)L[i++]=s;else{let r,val=0;if(s===16){val=L[i-1];r=3+bits(2);}else if(s===17)r=3+bits(3);else r=11+bits(7);while(r--)L[i++]=val;}}
      lt=mk(L.subarray(0,hl),hl);dt=mk(L.subarray(hl),hd);}
    for(;;){let s=dec(lt);if(s<256)out[op++]=s;else if(s===256)break;else{s-=257;const len=LB[s]+bits(LE[s]);const ds=dec(dt);const dist=DB[ds]+bits(DE[ds]);for(let k=0;k<len;k++){out[op]=out[op-dist];op++;}}}
  }while(!fim);return out;}
async function baixa(url){const r=await fetch(url);if(!r.ok)throw new Error(url+' '+r.status);const u=new Uint8Array(await r.arrayBuffer());
  if(u[0]!==0x1f||u[1]!==0x8b)return u;
  if(typeof DecompressionStream!=='undefined'){try{const st=new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'));return new Uint8Array(await new Response(st).arrayBuffer());}catch(e){}}
  return gunzip(u);}
const PASTA_GENTE='pessoas/';
const GJ=await (await fetch(PASTA_GENTE+'gente.json')).json();
const GB=await baixa(PASTA_GENTE+'gente-base.bin.gz');
let GH=null;                       // nível alto: baixado depois da primeira imagem (só no computador)
const NOSSOS=GJ.ossos.length,OB={};GJ.ossos.forEach((b,i)=>OB[b]=i);
const VAR=GJ.variantes,VID={};VAR.forEach((v,i)=>VID[v.id]=i);
const GM=GJ.mat;
/* ---------- geometria ---------- */
function geoGente(U8,e,cascas){const n=e.nv,o0=U8.byteOffset+e.v;const dv=new DataView(U8.buffer,o0,n*30);
  const pos=new Int16Array(n*3),nrm=new Int8Array(n*3),mat=new Uint8Array(n),uv=new Int16Array(n*2),si=new Uint8Array(n*4),sw=new Uint8Array(n*4),mk0=new Uint8Array(n*4),mk1=new Uint8Array(n*4);
  const b=new Uint8Array(U8.buffer,o0,n*30);
  for(let i=0;i<n;i++){const o=i*30;pos[i*3]=dv.getInt16(o,true);pos[i*3+1]=dv.getInt16(o+2,true);pos[i*3+2]=dv.getInt16(o+4,true);
    nrm[i*3]=dv.getInt8(o+6);nrm[i*3+1]=dv.getInt8(o+7);nrm[i*3+2]=dv.getInt8(o+8);mat[i]=b[o+9];uv[i*2]=dv.getInt16(o+10,true);uv[i*2+1]=dv.getInt16(o+12,true);
    for(let k=0;k<4;k++){si[i*4+k]=b[o+14+k];sw[i*4+k]=b[o+18+k];mk0[i*4+k]=b[o+22+k];mk1[i*4+k]=b[o+26+k];}mk1[i*4+3]=mat[i];}
  const idx=e.i32?new Uint32Array(U8.buffer.slice(U8.byteOffset+e.i,U8.byteOffset+e.i+e.ni*4)):new Uint16Array(U8.buffer.slice(U8.byteOffset+e.i,U8.byteOffset+e.i+e.ni*2));
  const g=new THREE.BufferGeometry();
  const K=cascas||1;
  const rep=(a)=>{if(K===1)return a;const r=new a.constructor(a.length*K);for(let k=0;k<K;k++)r.set(a,k*a.length);return r;};
  g.setAttribute('position',new THREE.BufferAttribute(rep(pos),3));g.setAttribute('normal',new THREE.BufferAttribute(rep(nrm),3,true));
  const uvr=rep(uv);g.setAttribute('aUv',new THREE.BufferAttribute(uvr,2));
  g.setAttribute('aOsso',new THREE.BufferAttribute(rep(si),4));g.setAttribute('aPeso',new THREE.BufferAttribute(rep(sw),4,true));
  g.setAttribute('aMk0',new THREE.BufferAttribute(rep(mk0),4,true));g.setAttribute('aMk1',new THREE.BufferAttribute(rep(mk1),4,true));
  if(K>1){for(let k=0;k<K;k++)for(let i=0;i<n;i++)uvr[(k*n+i)*2]=Math.round(k/(K-1)*8000);
    const ix=new (n*K>65535?Uint32Array:Uint16Array)(idx.length*K);for(let k=0;k<K;k++)for(let j=0;j<idx.length;j++)ix[k*idx.length+j]=idx[j]+k*n;g.setIndex(new THREE.BufferAttribute(ix,1));}
  else g.setIndex(new THREE.BufferAttribute(idx,1));
  g.boundingSphere=new THREE.Sphere(new V3(0,1,0),2);return g;}
/* ---------- esqueleto e animações ----------
   Repouso com eixos do mundo (pose A do MakeHuman). Cada animação devolve rotações locais por osso para a fase p ∈ [0,1).
   Os eixos das dobradiças (cotovelo, dedos) são calculados por variante a partir das juntas. */
const _q=new THREE.Quaternion(),_m=new THREE.Matrix4(),_v=new V3(),_f=new V3();
function eixos(v){const H=v.H.map(a=>new V3(...a)),T=v.T.map(a=>new V3(...a));const h=b=>H[OB[b]],t=b=>T[OB[b]];const E={};
  for(const s of ['l','r']){const sg=s==='l'?1:-1;
    // cotovelo: perpendicular ao braço e à frente; sinal tal que dobrar leve a mão para a frente
    const u=h('lowerarm_'+s).clone().sub(h('upperarm_'+s)).normalize();let a=new V3().crossVectors(u,new V3(0,0,1)).normalize();
    const mao=h('hand_'+s).clone().sub(h('lowerarm_'+s));if(mao.clone().applyAxisAngle(a,.6).z<mao.z)a.negate();E['cot_'+s]=a;
    // dedos: palma (aprox.) = para dentro do corpo; curva puxa a ponta para a palma
    const d=h('middle_01_'+s).clone().sub(h('hand_'+s)).normalize();const palma=new V3(-sg,0,.35).normalize();let fa=new V3().crossVectors(d,palma).normalize();
    const pt=t('middle_03_'+s).clone().sub(h('middle_01_'+s));if(pt.clone().applyAxisAngle(fa,.5).dot(palma)<pt.dot(palma))fa.negate();E['ded_'+s]=fa;E['pal_'+s]=palma;E['dir_'+s]=d;
    const th=t('thumb_02_'+s).clone().sub(h('thumb_01_'+s)).normalize();let ta=new V3().crossVectors(th,palma).normalize();if(th.clone().applyAxisAngle(ta,.5).dot(palma)<th.dot(palma))ta.negate();E['pol_'+s]=ta;}
  return {H,E};}
const X=new V3(1,0,0),Y=new V3(0,1,0),Z=new V3(0,0,1);
const sn=Math.sin,cs=Math.cos,TAU=Math.PI*2;
const lisa=x=>x*x*(3-2*x);
/* pose: lista [osso, eixo, ângulo] aplicada na ordem; `lado` espelha o braço (s=+1 esquerdo, -1 direito) */
function braco(P,s,E,abd,flex,cot,tor){const k=s>0?'l':'r';P.push(['upperarm_'+k,Z,s*abd],['upperarm_'+k,X,-flex],['upperarm_'+k,Y,s*(tor||0)],['lowerarm_'+k,E['cot_'+k],cot]);
  P.push(['clavicle_'+k,Z,s*Math.max(0,abd-.9)*.32]);}
function mao(P,s,E,fecha,polegar,punho){const k=s>0?'l':'r';for(const f of ['index','middle','ring','pinky']){const w={index:.85,middle:1,ring:1.05,pinky:1.1}[f];
    P.push([f+'_01_'+k,E['ded_'+k],fecha*.9*w+.12],[f+'_02_'+k,E['ded_'+k],fecha*1.25*w+.15],[f+'_03_'+k,E['ded_'+k],fecha*.8*w+.1]);}
  P.push(['thumb_02_'+k,E['pol_'+k],(polegar===undefined?fecha:polegar)*.6],['thumb_03_'+k,E['pol_'+k],(polegar===undefined?fecha:polegar)*.7]);
  if(punho)P.push(['hand_'+k,E['ded_'+k],punho]);}
function perna(P,s,quad,joelho,tor){const k=s>0?'l':'r';P.push(['thigh_'+k,X,-quad],['thigh_'+k,Y,s*(tor||0)],['calf_'+k,X,joelho],['foot_'+k,X,-joelho*.5+quad*.3]);}
// animações: loop em batidas (L). Fase p∈[0,1). Cada uma devolve {P: rotações, raiz: deslocamento da pélvis}
const ANIM=[
 {id:'balanco',L:4,f:(p,E)=>{const b=p*4*TAU;const P=[];const lado=sn(b/2);
   P.push(['pelvis',Z,lado*.05],['pelvis',Y,sn(b/4)*.08],['spine_02',Z,-lado*.04],['spine_03',X,.03+.02*sn(b)],['head',X,.05+.06*Math.max(0,sn(b))],['neck_01',Z,-lado*.03]);
   braco(P,1,E,-.6+.04*sn(b/2),.12+.08*sn(b/2+1),.35+.12*sn(b),0);braco(P,-1,E,-.62-.04*sn(b/2),.1-.08*sn(b/2+1),.3+.12*sn(b+1),0);mao(P,1,E,.35);mao(P,-1,E,.35);
   const jk=.06+.06*(.5+.5*sn(b));perna(P,1,E,jk*.5+.02*lado,jk);perna(P,-1,E,jk*.5-.02*lado,jk);return {P,raiz:[lado*.025,-jk*.08,0]};}},
 {id:'pulando',L:2,f:(p,E)=>{const b=p*2;const fb=b%1;const no_ar=Math.max(0,sn(fb*Math.PI));const ag=Math.pow(1-no_ar,3);const P=[];
   P.push(['spine_01',X,.08*ag],['spine_03',X,.05*ag],['head',X,-.08*no_ar+.06*ag]);
   const up=1.85+.45*no_ar;braco(P,1,E,up,.3,.15+.45*ag,0);braco(P,-1,E,up*.95,.32,.2+.4*ag,0);mao(P,1,E,.25);mao(P,-1,E,.9,.7);
   const j=.15+.65*ag;perna(P,1,E,j*.55,j);perna(P,-1,E,j*.55,j);return {P,raiz:[0,no_ar*.2-ag*.12,0]};}},
 {id:'bracos',L:4,f:(p,E)=>{const b=p*4*TAU;const P=[];const w=sn(b/2);
   P.push(['spine_02',Z,w*.06],['spine_03',X,-.06],['head',X,-.12+.05*sn(b)],['pelvis',Z,w*.04]);
   braco(P,1,E,2.05+.18*w,.25,.25+.1*sn(b),0);braco(P,-1,E,2.05-.18*w,.25,.25+.1*sn(b+.5),0);mao(P,1,E,.15);mao(P,-1,E,.15);
   const jk=.08+.05*(.5+.5*sn(b));perna(P,1,E,jk*.5,jk);perna(P,-1,E,jk*.5,jk);return {P,raiz:[w*.02,-jk*.08,0]};}},
 {id:'filmando',L:8,f:(p,E)=>{const b=p*8*TAU;const P=[];const lado=sn(b/8);
   P.push(['pelvis',Z,lado*.03],['spine_03',X,-.04],['head',X,-.04],['head',Y,.05*sn(b/8)]);
   braco(P,-1,E,.55,1.55,1.05,.2);mao(P,-1,E,.75,.55,-.15);
   braco(P,1,E,-.6,.1,.4+.08*sn(b/4),0);mao(P,1,E,.35);
   perna(P,1,E,.04,.08+.03*sn(b/4));perna(P,-1,E,.04,.08-.03*sn(b/4));return {P,raiz:[lado*.015,-.01,0]};}},
 {id:'danca',L:4,f:(p,E)=>{const b=p*4*TAU;const P=[];const q=sn(b/2),r=sn(b);
   P.push(['pelvis',Y,q*.22],['pelvis',Z,sn(b/2+1)*.07],['spine_01',Y,-q*.12],['spine_02',Z,-sn(b/2+1)*.06],['spine_03',Y,-q*.08],['spine_03',X,.06+.04*r],['head',X,.05+.07*Math.max(0,r)],['head',Y,q*.1]);
   braco(P,1,E,.05+.25*Math.max(0,q),.55+.25*r,1.5+.25*q,.3);braco(P,-1,E,.05+.25*Math.max(0,-q),.55-.25*r,1.5-.25*q,.3);mao(P,1,E,.55);mao(P,-1,E,.55);
   const jk=.12+.1*(.5+.5*r);perna(P,1,E,jk*.6+.05*q,jk+.05*q);perna(P,-1,E,jk*.6-.05*q,jk-.05*q);return {P,raiz:[sn(b/2+1)*.04,-jk*.1+.015*r,0]};}},
 {id:'olhando',L:16,f:(p,E)=>{const b=p*TAU;const P=[];const olhar=sn(b)*.55+sn(b*3)*.12;const lado=sn(b*2);
   P.push(['pelvis',Z,lado*.03],['spine_03',Y,olhar*.25],['neck_01',Y,olhar*.3],['head',Y,olhar*.45],['head',X,-.04+.06*sn(b*2+1)],['spine_02',Z,-lado*.02]);
   braco(P,1,E,-.6,.06,.3+.1*sn(b*2),0);braco(P,-1,E,-.58,.08,.32+.1*sn(b*2+2),0);mao(P,1,E,.4);mao(P,-1,E,.4);
   perna(P,1,E,.02+.02*lado,.04);perna(P,-1,E,.02-.02*lado,.04);return {P,raiz:[lado*.02,0,0]};}},
 {id:'punho',L:2,f:(p,E)=>{const b=p*2;const fb=b%1;const soco=Math.pow(Math.max(0,sn(fb*TAU)),.7);const P=[];
   P.push(['spine_03',X,-.04*soco],['head',X,-.1*soco+.04],['spine_02',Z,.04]);
   braco(P,-1,E,1.7+.6*soco,.35,1.0-.8*soco,0);mao(P,-1,E,1.05,1);braco(P,1,E,-.55,.12,.45,0);mao(P,1,E,.45);
   const jk=.1+.08*soco;perna(P,1,E,jk*.5,jk);perna(P,-1,E,jk*.5,jk);return {P,raiz:[0,-jk*.08+.02*soco,0]};}},
 {id:'copo',L:4,f:(p,E)=>{const b=p*4*TAU;const P=[];const lado=sn(b/2);
   P.push(['pelvis',Z,lado*.04],['spine_03',X,.02],['head',X,.04+.05*Math.max(0,sn(b))],['neck_01',Z,-lado*.03]);
   braco(P,-1,E,-.4,.45,1.3+.06*sn(b),.25);mao(P,-1,E,.95,.7,.1);braco(P,1,E,-.6,.1+.05*sn(b/2),.35,0);mao(P,1,E,.35);
   const jk=.06+.05*(.5+.5*sn(b));perna(P,1,E,jk*.5+.02*lado,jk);perna(P,-1,E,jk*.5-.02*lado,jk);return {P,raiz:[lado*.02,-jk*.08,0]};}},
 {id:'cantando',L:8,f:(p,E)=>{const b=p*8*TAU;const P=[];const g=sn(b/4),lado=sn(b/8);
   P.push(['pelvis',Z,lado*.04],['pelvis',Y,g*.08],['spine_03',X,.04],['spine_03',Y,-g*.06],['head',X,.02+.04*sn(b/2)],['head',Y,g*.12]);
   braco(P,-1,E,-.05,.95,2.05,.45);mao(P,-1,E,1.,.9,.1);
   braco(P,1,E,-.1+.45*Math.max(0,g),.35+.25*sn(b/4+1),.35+.25*sn(b/2),.1);mao(P,1,E,.2+.2*Math.max(0,-g),.1);
   const jk=.08+.05*(.5+.5*sn(b/2));perna(P,1,E,jk*.5+.04*lado,jk);perna(P,-1,E,jk*.5-.04*lado,jk);return {P,raiz:[lado*.03,-jk*.08,0]};}},
 {id:'palmas',L:2,f:(p,E)=>{const b=p*2;const fb=b%1;const bate=Math.pow(Math.max(0,cs(fb*TAU)),3);const P=[];
   P.push(['head',X,-.1],['spine_03',X,-.03]);
   braco(P,1,E,1.75-.15*bate,.95+.15*bate,.7-.2*bate,.6);braco(P,-1,E,1.75-.15*bate,.95+.15*bate,.7-.2*bate,.6);mao(P,1,E,.1);mao(P,-1,E,.1);
   const jk=.08+.06*bate;perna(P,1,E,jk*.5,jk);perna(P,-1,E,jk*.5,jk);return {P,raiz:[0,-jk*.08,0]};}},
 {id:'tambor',L:2,f:(p,E)=>{const b=p*2*TAU;const P=[];const a=Math.max(0,sn(b)),c=Math.max(0,sn(b+Math.PI));
   P.push(['spine_03',X,.12],['head',X,.12+.05*a]);braco(P,1,E,-.1,.75+.3*a,1.2-.5*a,.2);braco(P,-1,E,-.1,.75+.3*c,1.2-.5*c,.2);mao(P,1,E,.2,.1,.3*a);mao(P,-1,E,.2,.1,.3*c);
   perna(P,1,E,.05,.1);perna(P,-1,E,.05,.1);return {P,raiz:[0,-.01,0]};}},
];
const NANIM=ANIM.length,AID={};ANIM.forEach((a,i)=>AID[a.id]=i);
const FRAMES=lowGPU?20:32;
/* textura de ossos: linha = (variante, animação, quadro); 3 texels (matriz 3×4) por osso */
const texOssos=(()=>{const W=NOSSOS*3,Hh=VAR.length*NANIM*FRAMES;const d=new Float32Array(W*Hh*4);const pais=GJ.pais;
  const Wm=Array.from({length:NOSSOS},()=>new THREE.Matrix4()),R=new THREE.Matrix4(),T=new THREE.Matrix4(),q=new THREE.Quaternion(),qa=new THREE.Quaternion();
  VAR.forEach((v,vi)=>{const {H,E}=eixos(v);v._E=E;v._H=H;
    ANIM.forEach((A,ai)=>{for(let f=0;f<FRAMES;f++){const {P,raiz}=A.f(f/FRAMES,E);const rot=new Map();
      for(const [b,ax,an] of P){if(OB[b]===undefined||!an)continue;const cur=rot.get(b)||new THREE.Quaternion();qa.setFromAxisAngle(ax,an);cur.multiply(qa);rot.set(b,cur);}
      for(let i=0;i<NOSSOS;i++){const p=pais[i],h=H[i];
        if(p<0){Wm[i].makeTranslation(h.x,h.y,h.z);}
        else{const hp=H[p];Wm[i].copy(Wm[p]).multiply(T.makeTranslation(h.x-hp.x,h.y-hp.y,h.z-hp.z));}
        if(GJ.ossos[i]==='pelvis')Wm[i].premultiply(T.makeTranslation(raiz[0],raiz[1],raiz[2]));
        const r=rot.get(GJ.ossos[i]);if(r)Wm[i].multiply(R.makeRotationFromQuaternion(r));}
      const row=(vi*NANIM+ai)*FRAMES+f;
      for(let i=0;i<NOSSOS;i++){const h=H[i];const S=_m.copy(Wm[i]).multiply(T.makeTranslation(-h.x,-h.y,-h.z));const e=S.elements;const o=(row*W+i*3)*4;
        d[o]=e[0];d[o+1]=e[4];d[o+2]=e[8];d[o+3]=e[12];d[o+4]=e[1];d[o+5]=e[5];d[o+6]=e[9];d[o+7]=e[13];d[o+8]=e[2];d[o+9]=e[6];d[o+10]=e[10];d[o+11]=e[14];}}});});
  const t=new THREE.DataTexture(d,W,Hh,THREE.RGBAFormat,THREE.FloatType);t.needsUpdate=true;return t;})();
/* ---------- texturas de detalhe ---------- */
const carregaTex=(url,srgb,rep)=>{const t=new THREE.TextureLoader().load(url);if(srgb)t.encoding=THREE.sRGBEncoding;t.anisotropy=aniso;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;};
const texPele=carregaTex(PASTA_GENTE+'pele.png',false),texPoros=carregaTex(PASTA_GENTE+'poros.png',false,true),texTrama=carregaTex(PASTA_GENTE+'trama.png',false,true),texSarja=carregaTex(PASTA_GENTE+'sarja.png',false,true);
const GU={uOssos:{value:texOssos},uFr:{value:FRAMES},uBeat:{value:0},uTempo:{value:0},uLoopA:{value:ANIM.map(a=>a.L)},uPele:{value:texPele},uPoros:{value:texPoros},uTrama:{value:texTrama},uSarja:{value:texSarja},
  uStageV:{value:new V3(0,8,-12)},uRim:{value:new THREE.Color(0,0,0)},uTela:{value:new THREE.Color(.35,.4,.5)},uFlashCel:{value:0},uEsconde:{value:new THREE.Vector4(0,0,0,0)}};
const GLSL_GV=`
uniform sampler2D uOssos;uniform float uFr,uBeat,uTempo;uniform float uLoopA[${NANIM}];uniform vec4 uEsconde;
attribute vec2 aUv;attribute vec4 aOsso;attribute vec4 aPeso;attribute vec4 aMk0;attribute vec4 aMk1;
attribute vec4 iAnim;attribute vec4 iTempo;attribute vec4 iCor0;attribute vec4 iCor1;
flat varying float vMat;varying vec2 vUvG;varying vec4 vMk0;varying vec4 vMk1;varying vec3 vCorA;varying vec3 vCorB;varying vec3 vBind;varying float vCasca;flat varying vec4 vEst;
vec3 unpk(float v){float r=floor(v/65536.);float g=floor((v-r*65536.)/256.);float b=v-r*65536.-g*256.;return pow(vec3(r,g,b)/255.,vec3(2.2));}
mat4 osso(int b,int row){int x=b*3;vec4 a=texelFetch(uOssos,ivec2(x,row),0),c=texelFetch(uOssos,ivec2(x+1,row),0),d=texelFetch(uOssos,ivec2(x+2,row),0);
  return mat4(a.x,c.x,d.x,0.,a.y,c.y,d.y,0.,a.z,c.z,d.z,0.,a.w,c.w,d.w,1.);}
mat4 pele(int an,float ph){int F=int(uFr);float f=fract(ph)*uFr;int f0=int(f);int f1=f0+1;if(f1>=F)f1=0;float k=f-float(f0);
  int r0=int(iTempo.z)+an*F;mat4 m=mat4(0.);
  for(int i=0;i<4;i++){float w=aPeso[i];if(w<.002)continue;int b=int(aOsso[i]+.5);m+=w*((1.-k)*osso(b,r0+f0)+k*osso(b,r0+f1));}
  return m;}
`;
const GLSL_GF=`
uniform sampler2D uPele,uPoros,uTrama,uSarja;uniform vec3 uStageV;uniform vec3 uRim;uniform vec3 uTela;uniform float uFlashCel;
flat varying float vMat;varying vec2 vUvG;varying vec4 vMk0;varying vec4 vMk1;varying vec3 vCorA;varying vec3 vCorB;varying vec3 vBind;varying float vCasca;flat varying vec4 vEst;
float gSkin=0.;
float gh(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float gn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(gh(i),gh(i+vec3(1,0,0)),f.x),mix(gh(i+vec3(0,1,0)),gh(i+vec3(1,1,0)),f.x),f.y),mix(mix(gh(i+vec3(0,0,1)),gh(i+vec3(1,0,1)),f.x),mix(gh(i+vec3(0,1,1)),gh(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 perturba(vec3 pos,vec3 n,vec2 uv,vec3 mapN,float fd){vec3 q0=dFdx(pos),q1=dFdy(pos);vec2 st0=dFdx(uv),st1=dFdy(uv);vec3 N=n;vec3 q1p=cross(q1,N),q0p=cross(N,q0);
  vec3 T=q1p*st0.x+q0p*st1.x,B=q1p*st0.y+q0p*st1.y;float det=max(dot(T,T),dot(B,B));float sc=(det==0.)?0.:fd*inversesqrt(det);return normalize(T*(mapN.x*sc)+B*(mapN.y*sc)+N*mapN.z);}
`;
// cores do figurino (sRGB empacotado em 24 bits)
function pk(hex){const c=parseInt(hex.slice(1),16);return c;}
function injetaGente(mat,op){mat.userData.envFixo=1;
  mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,GU);
    let vs=sh.vertexShader.replace('#include <common>','#include <common>\n'+GLSL_GV);
    vs=vs.replace('#include <beginnormal_vertex>',`
      vec3 bind=vec3(position)*1e-4;
      float aI=iAnim.x,aJ=iAnim.y;float mx=clamp((uTempo-iAnim.z)/max(iAnim.w,.01),0.,1.);
      float phA=uBeat/uLoopA[int(aI)]*iTempo.y+iTempo.x,phB=uBeat/uLoopA[int(aJ)]*iTempo.y+iTempo.x;
      mat4 SK=pele(int(aI),phA);if(mx<.999&&aI!=aJ)SK=SK*mx+pele(int(aJ),phB)*(1.-mx);
      vec3 objectNormal=normalize(mat3(SK)*normal);
      ${op.cabelo?'bind+=normal*(aUv.x/8000.)*iCor1.w;':''}`);
    vs=vs.replace('#include <begin_vertex>',`vec3 transformed=(SK*vec4(bind,1.)).xyz;
      float aMat=aMk1.w*255.;vMat=aMat;vUvG=aUv/8000.;vMk0=aMk0;vMk1=aMk1;vBind=bind;vCasca=aUv.x/8000.;
      float fl=iCor1.z;vEst=vec4(mod(fl,16.),mod(floor(fl/16.),2.),mod(floor(fl/32.),2.),floor(fl/64.));
      int mi=int(aMat+.5);
      vCorA=unpk(iCor0.x);vCorB=unpk(iCor1.x);
      if(mi==1){vCorA=unpk(iCor0.y);vCorB=unpk(iCor1.y);}else if(mi==2){vCorA=unpk(iCor0.z);vCorB=unpk(iCor1.y);}else if(mi==3||mi==4){vCorA=unpk(iCor0.w);vCorB=vec3(.9);}
      else if(mi==5){vCorA=unpk(iCor1.x);}else if(mi==8){vCorA=unpk(iCor1.y);}
      if(iTempo.w>.5)transformed=vec3(0.,-500.,0.);`);
    sh.vertexShader=vs;
    let fs=sh.fragmentShader.replace('#include <common>','#include <common>\n'+GLSL_GF);
    fs=fs.replace('#include <lights_physical_pars_fragment>',THREE.ShaderChunk.lights_physical_pars_fragment.replace(
      'float dotNL = saturate( dot( geometry.normal, directLight.direction ) );\n\tvec3 irradiance = dotNL * directLight.color;',
      `float nlR=dot(geometry.normal,directLight.direction);float dotNL=saturate(nlR);vec3 irradiance=dotNL*directLight.color;
       if(gSkin>0.){vec3 w=vec3(saturate((nlR+.5)/1.5),saturate((nlR+.2)/1.2),saturate((nlR+.12)/1.12));w*=w;irradiance=mix(irradiance,w*directLight.color,gSkin);}`));
    fs=fs.replace('vec4 diffuseColor = vec4( diffuse, opacity );',`vec4 diffuseColor=vec4(vCorA,1.);float rugG=.8,metG=0.,shG=0.;vec3 emG=vec3(0.);vec3 nMapG=vec3(0.,0.,1.);vec2 uvN=vec2(0.);float nK=0.;
      int mt=int(vMat+.5);float ao=mix(1.,vMk1.z,.8);
      if(mt==0){vec4 t=texture2D(uPele,vUvG);vec3 sk=vCorA;
        sk*=.6+.5*t.r;
        sk=mix(sk,max(sk*1.65,vec3(.32,.2,.16)),vMk0.z*.75);
        sk=mix(sk,sk*vec3(.7,.5,.52)+vec3(.012,0.,.004),t.g*.9);
        float bd=vMk1.x*vEst.y*smoothstep(.25,.75,t.a+vMk1.x*.3);sk=mix(sk,vCorB*.55,bd*.8);
        float sc=vMk0.w*vEst.z*(.55+.45*t.a);sk=mix(sk,vCorB*.4,sc*.85);
        sk=mix(sk,vCorB*.35,t.b*.92);
        sk=mix(sk,mix(sk,vec3(.55,.42,.38),.55),vMk1.y);
        diffuseColor.rgb=sk;rugG=mix(mix(.5,.36,t.g),.62,bd+sc);gSkin=1.-t.b*.6;nK=.32;uvN=vUvG*48.;nMapG=texture2D(uPoros,uvN).xyz*2.-1.;shG=.25;}
      else if(mt==1||mt==2){vec3 c=vCorA;float pat=vEst.x;vec2 u=vUvG;
        if(mt==1&&pat>.5&&pat<1.5){vec2 g=fract(u*vec2(10.,10.));float l1=smoothstep(.06,.0,abs(g.x-.5)-.07)+smoothstep(.06,.0,abs(g.y-.5)-.07);float l2=step(abs(g.x-.15),.03)+step(abs(g.y-.15),.03);
          c=mix(c,vCorB,clamp(l1,0.,1.)*.42);c=mix(c,c*.4,clamp(l2,0.,1.)*.5);c*=.92+.08*step(.5,fract((u.x+u.y)*120.));}
        else if(mt==1&&pat>1.5&&pat<2.5){c=mix(c,vCorB,step(.5,fract(u.y*9.))*.9);}
        else if(mt==1&&pat>2.5&&pat<3.5){float lado=smoothstep(.82,.9,abs(sin(u.x/.16)));c=mix(c,vCorB,max(lado,step(.02,vMk0.x)*step(vMk0.x,.12)*.0));}
        float jeans=float(mt==2&&vEst.w>.5);
        if(jeans>.5){float f=gn(vBind*vec3(9.,3.,9.));c*=.78+.4*f*smoothstep(.2,1.,vBind.y);c=mix(c,c*1.35+.03,smoothstep(.55,.9,gn(vBind*vec3(4.,14.,4.)))*.35);}
        else c*=.92+.12*gn(vBind*60.);
        diffuseColor.rgb=c;rugG=.88;shG=jeans>.5?.25:.75;nK=.55;uvN=vUvG*vec2(70.,55.);nMapG=(jeans>.5?texture2D(uSarja,uvN):texture2D(uTrama,uvN)).xyz*2.-1.;}
      else if(mt==3){diffuseColor.rgb=vCorA*(.9+.1*gn(vBind*80.));rugG=.55;nK=.3;uvN=vUvG*vec2(60.);nMapG=texture2D(uTrama,uvN).xyz*2.-1.;}
      else if(mt==4){diffuseColor.rgb=vec3(.86,.85,.82);rugG=.7;}
      else if(mt==5){float rr=gn(vBind*vec3(420.,520.,420.))*.6+gn(vBind*160.)*.4;float lim=vCasca*.88;
        ${op.cabelo?'if(vCasca>.01&&rr<lim)discard;':''}
        diffuseColor.rgb=vCorA*(.45+.55*vCasca)*(.75+.5*rr);rugG=.62;shG=.6;}
      else if(mt==6){float a=vUvG.x;vec3 iris=vec3(.09,.045,.02)*(.7+.6*gn(vec3(vUvG.y*60.,a*40.,1.)));vec3 c=mix(vec3(.78,.74,.7),vec3(.65,.5,.47),smoothstep(.3,.5,a));
        c=mix(iris,c,smoothstep(.155,.175,a));c=mix(vec3(.006),c,smoothstep(.055,.07,a));diffuseColor.rgb=c;rugG=.06;}
      else if(mt==7){diffuseColor.rgb=vec3(.012);rugG=.8;}
      else if(mt==8){diffuseColor.rgb=vCorA*(.85+.15*gn(vBind*90.));rugG=.85;shG=.5;}
      else if(mt==9){diffuseColor.rgb=vec3(.02);rugG=.25;metG=.4;}
      else if(mt==10){diffuseColor.rgb=vec3(.01);rugG=.05;emG=uTela*(.8+.2*sin(vBind.y*300.));}
      else if(mt==11){diffuseColor.rgb=vec3(.75,.5,.12);rugG=.15;}
      else if(mt==12){diffuseColor.rgb=vec3(.4);rugG=.35;metG=.9;}
      diffuseColor.rgb*=ao;`);
    fs=fs.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=rugG;');
    fs=fs.replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=metG;');
    fs=fs.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nif(nK>0.){vec3 mn=normalize(vec3(nMapG.xy*nK,1.));normal=perturba(-vViewPosition,normal,uvN,mn,faceDirection);}');
    fs=fs.replace('#include <lights_physical_fragment>','#include <lights_physical_fragment>\n#ifdef USE_SHEEN\nmaterial.sheenColor=diffuseColor.rgb*shG*1.2;material.sheenRoughness=.55;\n#endif');
    fs=fs.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=emG;');
    fs=fs.replace('#include <output_fragment>','{vec3 cVd=normalize(vViewPosition);vec3 cPv=-vViewPosition;vec3 cLs=normalize(uStageV-cPv);float cFr=pow(1.-clamp(dot(normal,cVd),0.,1.),2.4);float cLt=smoothstep(-.15,.75,dot(normal,cLs));float cAt=clamp(22./length(uStageV-cPv),0.,1.);outgoingLight+=uRim*cFr*cLt*cAt*(diffuseColor.rgb*.8+.12);}\n#include <output_fragment>');
    sh.fragmentShader=fs;};
  mat.customProgramCacheKey=()=>'gente5'+(op.cabelo?'c':'')+(op.lo?'l':'');return mat;}
const matGente=injetaGente(new THREE.MeshPhysicalMaterial({color:'#fff',roughness:.8,sheen:1,sheenRoughness:.6,envMapIntensity:.45}),{});
const matGenteLo=injetaGente(new THREE.MeshStandardMaterial({color:'#fff',roughness:.8,envMapIntensity:.35}),{lo:1});
const matCabeloG=injetaGente(new THREE.MeshPhysicalMaterial({color:'#fff',roughness:.6,sheen:1,sheenRoughness:.5,envMapIntensity:.3,side:THREE.DoubleSide}),{cabelo:1});
const matCabeloGLo=injetaGente(new THREE.MeshStandardMaterial({color:'#fff',roughness:.65,envMapIntensity:.25}),{cabelo:1,lo:1});
// sombra (só para o elenco no palco): mesma deformação no vértice
const matSombraG=(()=>{const m=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,GU);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\n'+GLSL_GV).replace('#include <begin_vertex>',`vec3 bind=vec3(position)*1e-4;float aI=iAnim.x;float phA=uBeat/uLoopA[int(aI)]*iTempo.y+iTempo.x;mat4 SK=pele(int(aI),phA);vec3 transformed=(SK*vec4(bind,1.)).xyz;`);};
  m.customProgramCacheKey=()=>'gente5s';return m;})();
/* ---------- figurino: público de show em Salvador (calor: camiseta, regata, bermuda, short) ---------- */
const pesos=a=>{const o=[];for(const [c,w] of a)for(let i=0;i<w;i++)o.push(c);return o;};
const PAL={
  top:pesos([['#0f0f10',12],['#f1efe9',10],['#e4ded0',5],['#8b8c8f',3],['#3a3b3e',3],['#6b4a2f',2],['#4d5136',3],['#9a8a6a',2],['#7e1f1a',3],['#22314d',3],['#c4612a',1],['#d9b23a',2],['#2d5a46',2],['#b8a0c8',1],['#a3c1d9',2],['#e8a0a8',1],['#1f4fa3',1],['#f2c230',1]]),
  acento:pesos([['#f1efe9',5],['#111111',5],['#d9b23a',2],['#b3141c',2],['#e05a1a',1],['#1f4fa3',1],['#2d5a46',1]]),
  jeans:pesos([['#22324d',4],['#2f4466',4],['#5b7394',3],['#16181d',3],['#8ea2bc',1]]),
  baixo:pesos([['#141414',6],['#4d5136',3],['#a99d7e',3],['#5f6064',2],['#22314d',2],['#f1efe9',1],['#5a3e2a',1]]),
  tenis:pesos([['#f2f0ea',10],['#111111',6],['#e3ddd0',2],['#8b8c8f',2],['#b3392f',1],['#c9a24a',1],['#2d4a7a',1]]),
  pele:pesos([['#2b1810',2],['#3a2116',3],['#45261a',4],['#4f2d1d',4],['#5c3522',5],['#6e4029',4],['#7f4c31',4],['#93603f',3],['#a8744f',2],['#c08d68',2],['#d8a882',1],['#e6bf9c',1]]),
  cabelo:pesos([['#0b0908',8],['#15100c',5],['#22180f',3],['#3a2818',2],['#5a3e26',1],['#c9a46a',1],['#8a3a1e',1],['#e8d8b0',1]]),
};
const ESTILOS=['curto','black','coque','bone','trancas'];
const PADRAO={tee:0,oversize:0,regata:0,cropped:0,xadrez:1,longa:0,jersey:3};
// elenco de pessoas: guarda o que cada uma é; a GPU recebe por nível de detalhe
function sorteiaPessoa(r,x,z,y,yaw,o){o=o||{};const pick=a=>a[(r()*a.length)|0];
  const vi=o.v!==undefined?o.v:Math.floor(r()*(VAR.length-1));const V_=VAR[vi];const fem=V_.par.genero<.5;
  const estilo=o.estilo!==undefined?o.estilo:(fem?pick(['trancas','trancas','black','black','coque','coque','curto','bone','']):pick(['curto','curto','black','','','bone','bone','trancas','curto']));
  const top=V_.roupa.top;let pat=PADRAO[top]||0;if(pat===0&&r()<.12)pat=2;
  const p={x,z,y:y||0,yaw,v:vi,estilo,sx:o.sx||(.96+r()*.08),
    anim:o.anim!==undefined?o.anim:0,animB:0,t0:-99,dur:.5,fase:o.fase!==undefined?o.fase:r(),vel:o.vel||1,
    pele:pk(o.pele||pick(PAL.pele)),topC:pk(o.top||pick(PAL.top)),baixoC:pk(o.baixo||(V_.roupa.baixo==='jeans'?pick(PAL.jeans):pick(PAL.baixo))),tenisC:pk(o.tenis||pick(PAL.tenis)),
    cab:pk(o.cabelo||(estilo==='bone'?pick(PAL.cabelo):pick(PAL.cabelo))),acento:pk(o.acento||pick(PAL.acento)),
    pat,barba:o.barba!==undefined?o.barba:(!fem&&r()<.55?1:0),obj:o.obj||'',oculto:0};
  if(estilo==='bone')p.acento=pk(pick(['#111111','#f1efe9','#7e1f1a','#22314d','#c9b48a','#2d5a46']));
  return p;}
function corInst(p){const fl=p.pat+(p.barba?16:0)+((p.estilo===''||p.estilo==='curto'||p.estilo==='bone')?32:0)+(VAR[p.v].roupa.baixo==='jeans'?64:0);
  const casca=p.estilo==='black'?.034:p.estilo==='curto'?.007:p.estilo==='coque'?.006:0;
  return [p.pele,p.topC,p.baixoC,p.tenisC, p.cab,p.estilo==='bone'?p.acento:p.acento,fl,casca];}
const GEO_CACHE=new Map();
function geoComp(k,fn){let g=GEO_CACHE.get(k);if(!g){g=fn();GEO_CACHE.set(k,g);}const c=new THREE.BufferGeometry();for(const a in g.attributes)c.setAttribute(a,g.attributes[a]);c.setIndex(g.index);c.boundingSphere=g.boundingSphere;return c;}
/* grupo de pessoas com LOD: uma InstancedMesh por (nível, variante) + cabelos e objetos */
const LODG=lowGPU?{hi:0,mid:90,rHi:0,rMid:16}:{hi:42,mid:420,rHi:11,rMid:30};
const CASCAS={hi:10,mid:4,lo:1};
const _o=new THREE.Object3D();
function grupoGente(lista,pai,op){op=op||{};const N=lista.length;const malhas=[];const porChave=new Map();
  const cnt=new Map();const conta=k=>cnt.set(k,(cnt.get(k)||0)+1);
  for(const p of lista){conta('corpo|'+p.v+'|');if(p.estilo)conta('cab|'+p.v+'|'+p.estilo);if(p.obj)conta('obj|'+p.v+'|'+p.obj);}
  const limN={hi:LODG.hi||0,mid:LODG.mid,lo:1e9};
  const capDe=(nivel,tipo,vi,extra)=>Math.max(1,Math.min(cnt.get(tipo+'|'+vi+'|'+extra)||0,(op.lim&&op.lim[nivel])||limN[nivel]));
  const attrs=(g,cap)=>{const at={};for(const [k,n] of [['iAnim',4],['iTempo',4],['iCor0',4],['iCor1',4]]){at[k]=new THREE.InstancedBufferAttribute(new Float32Array(cap*n),n);at[k].setUsage(THREE.DynamicDrawUsage);g.setAttribute(k,at[k]);}return at;};
  function malha(nivel,tipo,vi,extra,cap){const k=nivel+'|'+tipo+'|'+vi+'|'+extra;if(porChave.has(k))return porChave.get(k);
    const v=VAR[vi];let geo=null,mat;
    const U=nivel==='hi'?GH:GB;if(!U)return null;
    if(tipo==='corpo'){geo=geoComp(k,()=>geoGente(U,v.lod[nivel]));mat=nivel==='lo'?matGenteLo:matGente;}
    else if(tipo==='cab'){const e=v.cabelo[extra][nivel==='hi'?'hi':'mid'];const K=(extra==='black'||extra==='curto'||extra==='coque')?CASCAS[nivel]:1;geo=geoComp(k,()=>geoGente(nivel==='hi'?GH:GB,e,K));mat=nivel==='lo'?matCabeloGLo:matCabeloG;}
    else{geo=geoComp(k,()=>geoGente(GB,v.obj[extra]));mat=matGente;}
    const at=attrs(geo,cap);const m=new THREE.InstancedMesh(geo,mat,cap);m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;m.count=0;m.visible=false;
    if(op.sombra){m.castShadow=true;m.customDepthMaterial=matSombraG;}
    pai.add(m);const M={m,at,cap,n:0};porChave.set(k,M);malhas.push(M);return M;}
  const nivel=new Int8Array(N).fill(-1);
  function escreve(M,p){const j=M.n++;if(j>=M.cap)return;_o.position.set(p.x,p.y,p.z);_o.rotation.set(0,p.yaw,0);_o.scale.setScalar(p.sx);_o.updateMatrix();_o.matrix.toArray(M.m.instanceMatrix.array,j*16);
    const v=p.v;const a=M.at;a.iAnim.array.set([p.anim,p.animB,p.t0,p.dur],j*4);a.iTempo.array.set([p.fase,p.vel,v*NANIM*FRAMES,p.oculto],j*4);const c=corInst(p);a.iCor0.array.set(c.slice(0,4),j*4);a.iCor1.array.set(c.slice(4,8),j*4);}
  const G={lista,nivel,malhas,
    // atribui níveis por distância à câmera e reescreve as instâncias
    lod(cam,forcaHi){const cp=cam.position;cam.getWorldDirection(_f);const cand=[];
      for(let i=0;i<N;i++){const p=lista[i];const dx=p.x-cp.x,dz=p.z-cp.z,dy=p.y+1-cp.y;let d=Math.sqrt(dx*dx+dz*dz+dy*dy);const fr=(dx*_f.x+dz*_f.z+dy*_f.y)/Math.max(d,1e-3);if(fr<-.2&&d>3)d*=4;cand.push([d,i]);}
      cand.sort((a,b)=>a[0]-b[0]);let nh=0,nm=0;const lim=Object.assign({hi:LODG.hi,mid:LODG.mid,rHi:LODG.rHi,rMid:LODG.rMid},op.lim||{});
      for(const [d,i] of cand){let lv=0;if(GH&&(forcaHi||(nh<lim.hi&&d<lim.rHi))){lv=2;nh++;}else if(nm<lim.mid&&d<lim.rMid){lv=1;nm++;}else lv=0;if(op.semLo&&lv===0)lv=1;nivel[i]=d>(op.rMax||1e9)?-1:lv;}
      for(const M of malhas)M.n=0;
      const NV=['lo','mid','hi'];
      for(let i=0;i<N;i++){const lv=nivel[i];if(lv<0)continue;const p=lista[i];const nv=NV[lv];
        const M=malha(nv,'corpo',p.v,'',capDe(nv,'corpo',p.v,''));if(M)escreve(M,p);
        if(p.estilo){const C=malha(nv,'cab',p.v,p.estilo,capDe(nv,'cab',p.v,p.estilo));if(C)escreve(C,p);}
        if(p.obj&&lv>0){const O=malha('mid','obj',p.v,p.obj,capDe('mid','obj',p.v,p.obj));if(O)escreve(O,p);}}
      for(const M of malhas){M.m.count=Math.min(M.n,M.cap);M.m.visible=M.n>0;if(M.n){M.m.instanceMatrix.needsUpdate=true;for(const k in M.at)M.at[k].needsUpdate=true;}}},
    anima(i,anim,t,dur){const p=lista[i];if(p.anim===anim)return false;p.animB=p.anim;p.anim=anim;p.t0=t;p.dur=dur||.6;return true;}};
  return G;}
