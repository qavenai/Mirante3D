(async function(){'use strict';
THREE.ColorManagement.legacyMode=false;const V3=THREE.Vector3;const lowGPU=false;
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.appendChild(renderer.domElement);
const aniso=8;const scene=new THREE.Scene();scene.background=new THREE.Color('#202226');
const camera=new THREE.PerspectiveCamera(30,innerWidth/innerHeight,.05,100);
window.__etapa='gente';
/*GENTE*/
window.__etapa='cena';
const pm=new THREE.PMREMGenerator(renderer);const es=new THREE.Scene();es.background=new THREE.Color('#333');const add=(w,h,x,y,z,c,k)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),side:2}));m.position.set(x,y,z);m.lookAt(0,1,0);es.add(m);};add(6,6,3,5,6,'#fff',2.5);add(6,6,-6,3,2,'#9bf',1);scene.environment=pm.fromScene(es,.02).texture;
const sol=new THREE.DirectionalLight('#fff3e6',2.2);sol.position.set(3,4,5);scene.add(sol);const fill=new THREE.DirectionalLight('#8fb0ff',.6);fill.position.set(-4,2,1);scene.add(fill);const back=new THREE.DirectionalLight('#ffd0a0',1.5);back.position.set(-1,3,-5);scene.add(back);
scene.add(new THREE.HemisphereLight('#bcd','#321',.35));
const q=new URLSearchParams(location.search);const modo=q.get('m')||'fila';
const r=(s=>()=>{s=(s*16807)%2147483647;return s/2147483647;})(7);
const L=[];
if(modo==='anim'){ANIM.forEach((A,i)=>L.push(sorteiaPessoa(r,(i-5)*.8,0,0,0,{v:i%12,anim:i,estilo:'curto',fase:0,obj:A.id==='filmando'?'celular':A.id==='copo'?'copo':A.id==='cantando'?'mic':''})));}
else if(modo==='fila'){VAR.forEach((v,i)=>{L.push(sorteiaPessoa(r,(i-6)*.75,0,0,0,{v:i,anim:+(q.get('a')||0),estilo:ESTILOS[i%5],fase:0}));});}
else{const a=+(q.get('a')||0);for(let i=0;i<6;i++)L.push(sorteiaPessoa(r,(i-2.5)*.9,0,0,0,{v:i*2%VAR.length,anim:(a+i)%NANIM,estilo:ESTILOS[i%5],fase:0,obj:['','celular','','','','copo'][i]}));}
if(q.get('hi'))GH=await baixa(PASTA_GENTE+'gente-hi.bin.gz');
const G=grupoGente(L,scene,{});
const cx=+(q.get('x')||0),cy=+(q.get('y')||1),cz=+(q.get('z')||9),tx=+(q.get('tx')||0),ty=+(q.get('ty')||1),tz=+(q.get('tz')||0);camera.position.set(cx,cy,cz);camera.lookAt(tx,ty,tz);camera.fov=+(q.get('fov')||30);camera.updateProjectionMatrix();
window.__etapa='lod';G.lod(camera,!!q.get('hi'));window.__etapa='render';GU.uBeat.value=+(q.get('b')||0.6);GU.uTempo.value=10;
renderer.render(scene,camera);window.__pronto=true;})();
