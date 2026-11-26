/* ================= MODELO DE PALCO =================
   Um palco é descrito por parâmetros (não por geometria fixa). `geometria(m)` transforma os parâmetros em peças
   posicionadas (torres, treliças, praticáveis, painéis de LED, caixas de som, luzes, gradil…). O 3D desenha essas
   peças e o orçamento conta as mesmas peças: se o palco muda, o orçamento muda junto.

   Coordenadas: metros; x para a direita, y para cima, z para a plateia. A borda da frente do piso fica em z = 0 e o
   piso vai até z = -profundidade. Funciona no navegador (global PALCOS) e no Node (module.exports), para o teste. */
(function(raiz){
'use strict';
const TAM={P:{nome:'Pequeno',larg:8,prof:6,led:18,publico:'até 2 mil pessoas'},M:{nome:'Médio',larg:12,prof:10,led:74,publico:'até 10 mil pessoas'},G:{nome:'Grande',larg:20,prof:15,led:335,publico:'20 mil ou mais'}};
const r2=x=>Math.round(x*2)/2;                 // gabinetes de 0,5 m
const cl=(x,a,b)=>Math.max(a,Math.min(b,x));

/* ---------- presets: as 9 referências + Castelos & Ruínas ----------
   Cada um define o estilo; as medidas vêm do tamanho (P/M/G) ou do modo Personalizado.
   led: layout por tamanho, em painéis {tipo, larg, alt} com medidas múltiplas de 0,5 m. */
const PRESETS=[
 {id:'compacto',ref:1,nome:'Compacto com cobertura',desc:'Treliça quadrada nos 4 lados, moving heads na treliça da frente, caixas penduradas nas torres, piso preto; passarela curta opcional.',
  estrutura:{tipo:'cobertura-duas-aguas',lona:'#8d9095',torres:4},passarela:false,escadas:'lateral',som:{la:'torres'},luz:{mh:'frente',refl:false,blind:false,pix:false},
  led:{P:[{tipo:'fundo',larg:6,alt:3}],M:[{tipo:'fundo',larg:11,alt:6},{tipo:'lateral',larg:2,alt:2}],G:[{tipo:'fundo',larg:20,alt:10},{tipo:'lateral',larg:5,alt:13.5}]}},
 {id:'festival',ref:2,nome:'Festival grande',desc:'Telhado preto central, alas laterais em andaime com LEDs grandes, LED central de fundo, escada lateral e grade na frente.',
  estrutura:{tipo:'alas-laterais-andaime',lona:'#141416',torres:4},escadas:'lateral',som:{la:'suspenso'},luz:{mh:'grid',refl:true,blind:true,pix:false},
  led:{P:[{tipo:'fundo',larg:4,alt:3},{tipo:'lateral',larg:1,alt:3}],M:[{tipo:'fundo',larg:8,alt:4},{tipo:'lateral',larg:3.5,alt:6}],G:[{tipo:'fundo',larg:16,alt:10},{tipo:'lateral',larg:7,alt:12.5}]}},
 {id:'teatro',ref:3,nome:'Teatro / evento',desc:'Pórtico de treliça só na frente, line arrays nas torres, refletores e moving heads, cortina preta, escadas nos dois cantos e pedestais.',
  estrutura:{tipo:'portico-frontal',torres:2},escadas:'cantos',cortina:true,som:{la:'torres'},luz:{mh:'frente',refl:true,blind:false,pix:false},
  led:{P:[{tipo:'fundo',larg:6,alt:3}],M:[{tipo:'fundo',larg:7,alt:6},{tipo:'lateral',larg:4,alt:4}],G:[{tipo:'fundo',larg:17,alt:9},{tipo:'lateral',larg:6.5,alt:14}]}},
 {id:'grid-aberto',ref:4,nome:'Aberto em grid de 4 torres',desc:'Sem telhado: LED de fundo largo, line arrays suspensos, moving heads na treliça e no chão, subs empilhados, escada lateral e grade.',
  estrutura:{tipo:'grid-4-torres',torres:4},escadas:'lateral',som:{la:'suspenso',subs:'empilhado'},luz:{mh:'grid-chao',refl:false,blind:false,pix:false},
  led:{P:[{tipo:'fundo',larg:6,alt:3}],M:[{tipo:'fundo',larg:11,alt:6},{tipo:'lateral',larg:2,alt:2}],G:[{tipo:'fundo',larg:20,alt:10},{tipo:'lateral',larg:5,alt:13.5}]}},
 {id:'trelica-u',ref:5,nome:'Médio com treliça em U',desc:'LEDs de fundo recortados (paisagem e pôr do sol) e escadinha central na frente.',
  estrutura:{tipo:'trelica-em-U',torres:4},escadas:'central',som:{la:'torres'},luz:{mh:'grid',refl:false,blind:false,pix:false},conteudo:'por-do-sol',
  led:{P:[{tipo:'recorte',larg:4,alt:3},{tipo:'recorte',larg:1,alt:3}],M:[{tipo:'recorte',larg:7,alt:6},{tipo:'recorte',larg:4,alt:4}],G:[{tipo:'recorte',larg:16,alt:10},{tipo:'recorte',larg:7,alt:12.5}]}},
 {id:'quatro-torres',ref:6,nome:'Aberto de 4 torres',desc:'Line arrays no meio das torres, moving heads, subs no piso e plateia ao fundo.',
  estrutura:{tipo:'grid-4-torres',torres:4},escadas:'lateral',som:{la:'meio',subs:'piso'},luz:{mh:'grid',refl:false,blind:false,pix:false},
  led:{P:[{tipo:'fundo',larg:6,alt:3}],M:[{tipo:'fundo',larg:8,alt:4},{tipo:'lateral',larg:3.5,alt:6}],G:[{tipo:'fundo',larg:20,alt:10},{tipo:'lateral',larg:5,alt:13.5}]}},
 {id:'pequeno-tubos',ref:7,nome:'Pequeno em treliça com tubos',desc:'Caixas no alto, tubos de LED verticais nas torres, papel picado e grade.',
  estrutura:{tipo:'grid-4-torres',torres:4},escadas:'lateral',som:{la:'alto'},luz:{mh:'grid',refl:false,blind:false,pix:false},efeitos:{papel:true},
  led:{P:[{tipo:'fundo',larg:4,alt:3},{tipo:'tubo',larg:1,alt:3}],M:[{tipo:'fundo',larg:11,alt:6},{tipo:'tubo',larg:2,alt:2}],G:[{tipo:'fundo',larg:19,alt:7.5},{tipo:'tubo',larg:5.5,alt:17.5}]}},
 {id:'show-telhado',ref:8,nome:'Show com telhado',desc:'Line arrays laterais, LED de fundo roxo e cobertura em duas águas.',
  estrutura:{tipo:'cobertura-duas-aguas',lona:'#17171a',torres:4},escadas:'lateral',som:{la:'suspenso'},luz:{mh:'grid',refl:false,blind:false,pix:false},conteudo:'roxo',
  led:{P:[{tipo:'fundo',larg:6,alt:3}],M:[{tipo:'fundo',larg:11,alt:6},{tipo:'lateral',larg:2,alt:2}],G:[{tipo:'fundo',larg:20,alt:10},{tipo:'lateral',larg:5,alt:13.5}]}},
 {id:'grande-alas',ref:9,nome:'Grande com alas em treliça',desc:'Blinders e PIX nas torres, LEDs laterais e central, line arrays, subs, cobertura preta e grade em toda a frente.',
  estrutura:{tipo:'alas-laterais-trelica',lona:'#141416',torres:6},escadas:'lateral',som:{la:'suspenso',subs:'piso'},luz:{mh:'grid',refl:true,blind:true,pix:true},
  led:{P:[{tipo:'fundo',larg:6,alt:3}],M:[{tipo:'fundo',larg:8,alt:4},{tipo:'lateral',larg:3.5,alt:6}],G:[{tipo:'fundo',larg:20,alt:10},{tipo:'lateral',larg:5,alt:13.5}]}},
 {id:'castelos',ref:0,nome:'Castelos & Ruínas',desc:'Escadaria monumental de arenito com pirâmide em degraus, LED central e LEDs laterais em retrato, fogo nos guarda-corpos, grid de 4 torres.',
  estrutura:{tipo:'grid-4-torres',lona:'#121215',torres:4,torresLED:true},escadas:'central',cenografia:'castelos',som:{la:'suspenso',subs:'piso'},luz:{mh:'grid-chao',refl:false,blind:false,pix:true},
  efeitos:{fogo:true,papel:true},conteudo:'castelos',assinatura:'JOVEMRARO — Além do que se vê',
  led:{P:[{tipo:'fundo',larg:6,alt:3}],M:[{tipo:'fundo',larg:11,alt:6},{tipo:'lateral',larg:2,alt:2}],G:[{tipo:'fundo',larg:20,alt:10},{tipo:'lateral',larg:5,alt:13.5}]}},
];
// preset de referência de cada tamanho (o que fecha com a planilha do orçamento-base)
const PADRAO={P:'compacto',M:'show-telhado',G:'castelos'};

/* ---------- parâmetros por tamanho (estrutura) ----------
   beiral: quanto a cobertura passa do piso (lados, frente/fundo); alt: altura útil da treliça;
   vao: vigas internas (k na profundidade, j na largura). Calibrado para os presets de referência. */
const ESTR_TAM={
  P:{beiral:[1,1],alt:7,k:0,j:0,trelica:'Q30',pisoAlt:1.2,talhas:false,gradil:30,houseMix:false,pacote:'P'},
  M:{beiral:[1,1],alt:10,k:3,j:3,trelica:'Q50',pisoAlt:1.6,talhas:true,gradil:60,houseMix:true,pacote:'M'},
  G:{beiral:[2,1.25],alt:18.5,k:7,j:3,trelica:'Q60/Q76',pisoAlt:2,talhas:true,gradil:120,houseMix:true,pacote:'G'},
};

/* resolve(preset, tamanho, personalizado) -> modelo completo */
function resolve(pid,tam,cust){cust=cust||{};const pr=PRESETS.find(p=>p.id===pid)||PRESETS[0];const T=TAM[tam]||TAM.M;const E=ESTR_TAM[tam]||ESTR_TAM.M;
  const larg=cust.larg||T.larg,prof=cust.prof||T.prof;
  const escala=Math.sqrt((larg*prof)/(T.larg*T.prof));
  let led=(pr.led[tam]||pr.led.M).map(p=>Object.assign({},p));
  // personalizado: área de LED escala o layout (mantém proporções, arredonda em gabinetes)
  if(cust.led){const a0=areaLED(led);const f=Math.sqrt(cust.led/a0);led=led.map(p=>Object.assign(p,{larg:Math.max(.5,r2(p.larg*f)),alt:Math.max(.5,r2(p.alt*f))}));}
  const m={preset:pr.id,nome:pr.nome,tam,ref:pr.ref,larg,prof,
    pisoAlt:cust.pisoAlt||E.pisoAlt,
    altura:cust.altura||(tam in ESTR_TAM&&!cust.larg?E.alt:Math.round(E.alt*cl(escala,.7,1.6)*2)/2),
    beiral:E.beiral,vigasK:E.k,vigasJ:E.j,trelica:cust.trelica||E.trelica,
    estrutura:Object.assign({},pr.estrutura),
    cobertura:cust.cobertura!==undefined?cust.cobertura:!!pr.estrutura.lona,
    alas:cust.alas!==undefined?cust.alas:/alas/.test(pr.estrutura.tipo),
    passarela:cust.passarela!==undefined?cust.passarela:!!pr.passarela,
    escadas:pr.escadas||'lateral',cortina:!!pr.cortina,
    cenografia:cust.cenografia!==undefined?(cust.cenografia?(pr.cenografia||'escadaria'):null):(pr.cenografia&&tam==='G'?pr.cenografia:pr.cenografia?(cust.cenografiaPM?pr.cenografia:null):null),
    somLuz:cust.somLuz!==undefined?cust.somLuz:true,gerador:cust.gerador!==undefined?cust.gerador:true,
    talhas:E.talhas,gradil:cust.gradil||E.gradil,houseMix:E.houseMix,pacote:cust.pacote||E.pacote,
    som:Object.assign({la:'suspenso',subs:'piso'},pr.som),luz:Object.assign({},pr.luz),efeitos:Object.assign({fumaca:true},pr.efeitos||{}),
    led,conteudo:pr.conteudo||'paisagem',assinatura:pr.assinatura||null,diarias:cust.diarias||1};
  if(pr.cenografia==='castelos'&&tam!=='G'&&cust.cenografia===undefined)m.cenografia='castelos';   // a escadaria faz parte do preset
  return m;}
function areaLED(ps){let a=0;for(const p of ps){const n=(p.tipo==='fundo')?1:2;a+=n*p.larg*p.alt;}return a;}

/* ---------- geometria: peças posicionadas ---------- */
function geometria(m){const W=m.larg,D=m.prof,Hp=m.pisoAlt;const g={m,tor:[],tre:[],prat:[],led:[],la:[],subs:[],mh:[],refl:[],blind:[],pix:[],gradil:[],escadas:[],passarela:null,cobertura:null,alas:[],cortina:null,cen:null,talhas:[],houseMix:null};
  const seg=(a,b,grupo,lado)=>g.tre.push({a,b,grupo,lado:lado||(m.trelica==='Q30'?.3:m.trelica==='Q50'?.5:.76)});
  // piso: praticáveis 2 × 1 m
  for(let z=0;z<D-1e-6;z+=1)for(let x=-W/2;x<W/2-1e-6;x+=2)g.prat.push({x:x+1,z:-(z+.5),w:Math.min(2,W/2-x),d:Math.min(1,D-z)});
  if(m.passarela){const pw=Math.max(2,r2(W*.25)),pd=Math.max(2,r2(D*.3));g.passarela={larg:pw,prof:pd};for(let z=0;z<pd;z+=1)for(let x=-pw/2;x<pw/2-1e-6;x+=2)g.prat.push({x:x+1,z:z+.5,w:2,d:1,passarela:true});}
  // escadas de acesso
  const esc=(x,z,ry)=>g.escadas.push({x,z,ry,alt:Hp});
  if(m.escadas==='lateral')esc(W/2+.8,-D*.35,-Math.PI/2);else if(m.escadas==='cantos'){esc(-W/2+1,1.2,0);esc(W/2-1,1.2,0);}else if(m.escadas==='central')esc(0,(m.passarela?g.passarela.prof:0)+1.2,0);
  // estrutura
  const t=m.estrutura.tipo,bl=m.beiral[0],bf=m.beiral[1],Ht=m.altura;const x0=-W/2-bl,x1=W/2+bl,zf=bf,zb=-D-bf;
  const torre=(x,z,h,grupo)=>{g.tor.push({x,z,h,grupo:grupo||'principal'});seg([x,0,z],[x,h,z],'torres');};
  if(t==='portico-frontal'){torre(x0,zf,Ht);torre(x1,zf,Ht);seg([x0,Ht,zf],[x1,Ht,zf],'grid');}
  else{torre(x0,zf,Ht);torre(x1,zf,Ht);torre(x0,zb,Ht);torre(x1,zb,Ht);
    if(t==='trelica-em-U'){seg([x0,Ht,zf],[x1,Ht,zf],'grid');seg([x0,Ht,zf],[x0,Ht,zb],'grid');seg([x1,Ht,zf],[x1,Ht,zb],'grid');}
    else{seg([x0,Ht,zf],[x1,Ht,zf],'grid');seg([x0,Ht,zb],[x1,Ht,zb],'grid');seg([x0,Ht,zf],[x0,Ht,zb],'grid');seg([x1,Ht,zf],[x1,Ht,zb],'grid');
      for(let k=1;k<=m.vigasK;k++){const x=x0+(x1-x0)*k/(m.vigasK+1);seg([x,Ht,zf],[x,Ht,zb],'grid');}
      for(let j=1;j<=m.vigasJ;j++){const z=zf+(zb-zf)*j/(m.vigasJ+1);seg([x0,Ht,z],[x1,Ht,z],'grid');}}}
  if(m.cobertura&&t!=='portico-frontal'&&t!=='trelica-em-U')g.cobertura={x0,x1,zf,zb,y:Ht,cor:m.estrutura.lona||'#141416',cumeeira:Ht+Math.max(1,(x1-x0)*.12)};
  if(m.alas){const aw=Math.max(2.5,r2(W*.22)),ah=Math.max(4,Ht*.8);for(const s of [-1,1]){const xa=s*(W/2+bl+aw/2+.5);g.alas.push({x:xa,larg:aw,alt:ah,prof:Math.max(3,D*.5),andaime:/andaime/.test(t)});
    if(!/andaime/.test(t)){torre(xa-s*aw/2,-1,ah,'ala');torre(xa+s*aw/2,-1,ah,'ala');seg([xa-aw/2,ah,-1],[xa+aw/2,ah,-1],'alas');}}}
  if(m.cortina)g.cortina={y0:Hp,y1:Ht-.5,z:-D+.2,larg:W};
  // LED: fundo no centro, laterais/tubos/recortes dos lados (fixação: suspenso no grid G/M com talhas, ground stack nos pequenos)
  {const fundo=m.led.find(p=>p.tipo==='fundo'||p.tipo==='recorte');const outros=m.led.filter(p=>p!==fundo);
   const susp=m.talhas&&m.tam!=='M';const y0=Hp+(m.cenografia?.6:.4);
   if(fundo)g.led.push({id:'fundo',nome:fundo.tipo==='recorte'?'LED de fundo (recorte central)':'LED de fundo',tipo:fundo.tipo,larg:fundo.larg,alt:fundo.alt,x:0,y:y0,z:-D+.4,ry:0,fix:susp?'suspenso':'ground',gab:fundo.alt>=1&&fundo.alt%1===0?[.5,1]:[.5,.5]});
   for(const p of outros)for(const s of [-1,1]){let x,y,z,ry=0,fix='ground';
     if(p.tipo==='tubo'){x=s*(W/2+bl);y=Hp*0+.5;z=zf+.6;fix='ground';}
     else if(p.tipo==='lateral'&&m.tam==='G'){x=s*(W/2+bl+p.larg/2+.6);y=3.4;z=-D*.35;ry=-s*.2;fix='suspenso';
       if(m.estrutura.torresLED){const hl=+(y+p.alt+.225).toFixed(3);torre(x-p.larg/2-.4,z,hl,'led');torre(x+p.larg/2+.4,z,hl,'led');}}
     else{const xf=fundo?fundo.larg/2:2;x=s*(xf+p.larg/2+.5);y=y0+(fundo?Math.max(0,fundo.alt-p.alt)/2:0);z=-D+.4;fix=susp?'suspenso':'ground';}
     g.led.push({id:(p.tipo==='tubo'?'tubo':p.tipo==='recorte'?'recorte':'lateral')+(s<0?'E':'D'),nome:p.tipo==='tubo'?'Tubo de LED vertical':p.tipo==='recorte'?'LED de fundo (recorte)':'LED lateral',tipo:p.tipo,larg:p.larg,alt:p.alt,x,y,z,ry,fix,gab:[.5,.5]});}}
  // talhas: 4 no grid (se suspenso) + 2 por painel suspenso
  if(m.talhas&&t!=='portico-frontal'){for(const tt of g.tor.filter(q=>q.grupo==='principal'))g.talhas.push({x:tt.x,z:tt.z,y:tt.h+.9,para:'grid'});}
  for(const p of g.led)if(p.fix==='suspenso'){for(const s of [-1,1])g.talhas.push({x:p.x+s*p.larg*.35,z:p.z,y:p.tipo==='lateral'?p.y+p.alt+1.2:Ht-.6,para:p.id});}
  // som
  const nLA={P:6,M:10,G:14}[m.tam]||10;
  if(m.somLuz){for(const s of [-1,1]){let x,y,z;const so=m.som.la;
      if(so==='torres'){x=s*(W/2+bl);y=Ht-1;z=zf+.7;}else if(so==='meio'){x=s*(W/2+bl);y=Ht*.65;z=zf+.7;}else if(so==='alto'){x=s*(W/2+bl-.8);y=Ht-.6;z=zf-.2;}
      else{x=s*(W/2+bl+(m.alas?0:1.2));y=Ht-1.2;z=zf+.3;}
      g.la.push({x,y,z,n:nLA,ry:s*.12,susp:so!=='alto'||true});}
    const nS={P:2,M:4,G:6}[m.tam]||4;for(const s of [-1,1])g.subs.push({x:s*(W/2-1.5),z:m.som.subs==='piso'?-.8:.9,y:m.som.subs==='piso'?Hp:0,n:nS});
    // luz
    const nMH={P:6,M:10,G:20}[m.tam]||10;const yF=t==='portico-frontal'?Ht-.5:Ht-.5;
    for(let i=0;i<nMH;i++){const x=x0+.8+(x1-x0-1.6)*i/(nMH-1);g.mh.push({x,y:yF,z:m.luz.mh==='frente'||t==='portico-frontal'?zf:(i%2?zf:-D*.5),chao:false});}
    if(/chao/.test(m.luz.mh)){const n=m.tam==='G'?8:4;for(let i=0;i<n;i++){const s=i<n/2?-1:1;g.mh.push({x:s*(1.5+(i%(n/2))*(W/2-2)/(n/2)),y:Hp+.05,z:-D+1.2,chao:true});}}
    if(m.luz.refl){for(let i=0;i<6;i++)g.refl.push({x:x0+1+(x1-x0-2)*i/5,y:Ht-.4,z:zf});}
    if(m.luz.blind){for(const tt of g.tor.filter(q=>q.grupo!=='led'))for(let k=0;k<3;k++)g.blind.push({x:tt.x,y:tt.h*(.3+k*.22),z:tt.z+.5});}
    if(m.luz.pix){const n={P:8,M:14,G:22}[m.tam];for(let i=0;i<n;i++)g.pix.push({x:x0+1+(x1-x0-2)*i/(n-1),y:Ht-1.1,z:-D*.4});}}
  // gradil: frente + dois corredores para a plateia (comprimento em metros; peças de 2 m)
  {const lados=(m.gradil-W-4)/2;g.gradil.push({a:[-W/2-2,2.5],b:[W/2+2,2.5]});if(lados>0)for(const s of [-1,1])g.gradil.push({a:[s*(W/2+2),2.5],b:[s*(W/2+2),2.5+lados]});}
  if(m.houseMix)g.houseMix={x:0,z:Math.max(18,D*2.2)};
  if(m.cenografia)g.cen={tipo:m.cenografia};
  return g;}

/* ---------- quantidades (contadas na geometria) ---------- */
const len=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
function quantidades(g){const m=g.m;const q={};
  const pisoM2=m.larg*m.prof+(g.passarela?g.passarela.larg*g.passarela.prof:0);
  q.piso_m2=+pisoM2.toFixed(2);q.praticaveis=Math.ceil(pisoM2/2);
  q.trelica_m=+g.tre.reduce((s,t)=>s+len(t.a,t.b),0).toFixed(2);
  q.lona_m2=g.cobertura?+((g.cobertura.x1-g.cobertura.x0)*(g.cobertura.zf-g.cobertura.zb)).toFixed(2):0;
  q.talhas=g.talhas.length;q.gradil_un=Math.ceil(g.gradil.reduce((s,a)=>s+Math.hypot(a.b[0]-a.a[0],a.b[1]-a.a[1]),0)/2);
  q.house_mix=g.houseMix?1:0;q.torres=g.tor.length;
  q.led_m2=+g.led.reduce((s,p)=>s+p.larg*p.alt,0).toFixed(2);
  q.estrutura_led_m=+g.led.reduce((s,p)=>s+2*p.larg,0).toFixed(2);
  q.gabinetes=g.led.reduce((s,p)=>s+Math.round(p.larg/p.gab[0])*Math.round(p.alt/p.gab[1]),0);
  q.vj=q.led_m2<50?0:q.led_m2<150?1:2;q.servidor_loc=q.led_m2>=150?1:0;q.servidor_compra=q.led_m2<50?0:q.led_m2<150?1:2;
  q.processadora=q.led_m2<50?1:q.led_m2<150?2:4;q.led_reserva_m2=Math.ceil(q.led_m2*.05-1e-9);
  q.caixas_la=g.la.reduce((s,a)=>s+a.n,0);q.subs=g.subs.reduce((s,a)=>s+a.n,0);q.moving=g.mh.length;q.refletores=g.refl.length;q.blinders=g.blind.length;q.pix=g.pix.length;
  q.cenografia=g.cen?1:0;
  // logística: volume de carga (m³) e horas de trabalho, a partir das peças
  const vol=q.praticaveis*.22+q.trelica_m*.25+q.lona_m2*.012+q.led_m2*.32+q.caixas_la*.45+q.subs*.6+q.talhas*.15+q.gradil_un*.08+(q.cenografia?115:0);
  const hh=q.praticaveis*.45+q.trelica_m*.42+q.lona_m2*.05+q.gabinetes*.12+q.talhas*2+q.caixas_la*.6+q.subs*.4+q.moving*.5+q.gradil_un*.2+(q.cenografia?60:0);
  q.volume_m3=+vol.toFixed(1);q.horas=+hh.toFixed(1);
  q.viagens=Math.max(1,Math.ceil(vol/76));
  q.dias_montagem=Math.max(1,Math.round(hh/96));
  q.equipe_extra_dias=Math.max(0,q.dias_montagem-1);
  q.montadores=m.tam==='P'?6:m.tam==='M'?8:10;
  q.pacote=m.pacote;q.som=m.somLuz?m.pacote:null;q.gerador=m.gerador?(m.pacote==='P'?{kva:180,n:1}:m.pacote==='M'?{kva:260,n:1}:{kva:500,n:2}):null;
  q.trelica_tipo=m.trelica;
  return q;}

const API={TAM,PRESETS,PADRAO,ESTR_TAM,resolve,geometria,quantidades,areaLED};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else raiz.PALCOS=API;
})(typeof window!=='undefined'?window:globalThis);
