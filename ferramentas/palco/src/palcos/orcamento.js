/* ================= ORÇAMENTO AUTOMÁTICO =================
   Preços: orcamento-base.json (valores-base nov/2026, referência Bahia). Quantidades: as peças do palco (modelo.js).
   Nada de preço inventado aqui: cada linha aponta para um item da tabela. */
(function(raiz){
'use strict';
const BRL=v=>'R$ '+(Math.round(v*100)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
// qual quantidade do palco alimenta cada item da tabela
function qtdLocacao(id,q){switch(id){
  case 'piso':return q.piso_m2;case 'trelica_cobertura':return q.trelica_m;case 'lona':return q.lona_m2;case 'talha':return q.talhas;
  case 'gradil':return q.gradil_un;case 'house_mix':return q.house_mix;case 'equipe_montagem':return q.equipe_extra_dias;case 'transporte':return q.viagens;
  case 'led':return q.led_m2;case 'estrutura_led':return q.estrutura_led_m;case 'vj':return q.vj;case 'servidor_midia':return q.servidor_loc;
  case 'som_p':return q.som==='P'?1:0;case 'som_m':return q.som==='M'?1:0;case 'som_g':return q.som==='G'?1:0;
  case 'luz_p':return q.som==='P'?1:0;case 'luz_m':return q.som==='M'?1:0;case 'luz_g':return q.som==='G'?1:0;
  case 'gerador_180':return q.gerador&&q.gerador.kva===180?q.gerador.n:0;case 'gerador_260':return q.gerador&&q.gerador.kva===260?q.gerador.n:0;case 'gerador_500':return q.gerador&&q.gerador.kva===500?q.gerador.n:0;}
  return 0;}
function qtdCompra(id,q){switch(id){
  case 'praticavel':return q.praticaveis;case 'saia_escadas':return q.piso_m2;
  case 'trelica_q30':return q.trelica_tipo==='Q30'?q.trelica_m:0;case 'trelica_q50':return q.trelica_tipo==='Q50'?q.trelica_m:0;case 'trelica_q60_q76':return q.trelica_tipo==='Q60/Q76'?q.trelica_m:0;
  case 'bases_torre':return q.torres;case 'talha':return q.talhas;case 'lona':return q.lona_m2;case 'gradil':return q.gradil_un;case 'cenografia':return q.cenografia;
  case 'led_ate50':return q.led_m2<=50?q.led_m2:0;case 'led_50a150':return q.led_m2>50&&q.led_m2<=150?q.led_m2:0;case 'led_acima150':return q.led_m2>150?q.led_m2:0;
  case 'led_reserva':return q.led_reserva_m2;case 'processadora':return q.processadora;case 'servidor_midia':return q.servidor_compra;
  case 'barras_cases':return q.led_m2;case 'cabos':return q.led_m2;}
  return 0;}
function calcula(base,q,diarias){diarias=diarias||1;const loc=[],com=[];
  for(const it of base.locacao){const n=qtdLocacao(it.id,q);if(!n)continue;const mult=it.multiplica_diarias?diarias:1;loc.push({id:it.id,item:it.item,cat:it.categoria,un:it.unidade,valor:it.valor,qtd:n,diarias:mult,total:it.valor*n*mult});}
  for(const it of base.compra){const n=qtdCompra(it.id,q);if(!n)continue;com.push({id:it.id,item:it.item,cat:it.categoria,un:it.unidade,valor:it.valor,qtd:n,total:it.valor*n});}
  const soma=(L,c)=>L.filter(x=>!c||x.cat===c).reduce((s,x)=>s+x.total,0);
  const palco=soma(loc,'Palco'),led=soma(loc,'LED'),slg=soma(loc,'Som, luz e energia');
  const cPalco=soma(com,'Palco'),cLED=soma(com,'LED'),frete=(cPalco+cLED)*base.parametros.frete_compra_pct;
  const r={locacao:{itens:loc,palco,led,palco_led:palco+led,som_luz_energia:slg,evento_completo:palco+led+slg},
    compra:{itens:com,palco:cPalco,led:cLED,frete,total:cPalco+cLED+frete},diarias};
  // payback: quantas diárias de locação (palco + LED) pagam a compra
  const l1=calcula1(base,q);r.payback=l1>0?r.compra.total/l1:0;
  return r;}
function calcula1(base,q){let s=0;for(const it of base.locacao){if(it.categoria==='Som, luz e energia')continue;s+=it.valor*qtdLocacao(it.id,q);}return s;}
const UN={m2_diaria:'m²',m_trelica_diaria:'m',un_diaria:'un.',dia_montagem:'dia',viagem:'viagem',pessoa_diaria:'pessoa',diaria:'pacote',un:'un.',m2_palco:'m²',m:'m',torre:'torre',m2:'m²',projeto:'projeto',m2_led:'m² de LED'};
const fmtQ=x=>(Math.round(x*100)/100).toLocaleString('pt-BR');
function resumo(m,q,r,base){const L=[];
  L.push(`*${m.nome} · ${m.tam==='P'?'Pequeno':m.tam==='M'?'Médio':m.tam==='G'?'Grande':'Personalizado'}*`);
  L.push(`Palco ${fmtQ(m.larg)} × ${fmtQ(m.prof)} m · LED ${fmtQ(q.led_m2)} m² · ${r.diarias} diária${r.diarias>1?'s':''}`);
  L.push('');L.push('*Locação*');
  L.push(`Palco: ${BRL(r.locacao.palco)}`);L.push(`LED: ${BRL(r.locacao.led)}`);L.push(`Palco + LED: ${BRL(r.locacao.palco_led)}`);
  if(r.locacao.som_luz_energia)L.push(`Som, luz e energia: ${BRL(r.locacao.som_luz_energia)}`);
  L.push(`*Evento completo: ${BRL(r.locacao.evento_completo)}*`);
  L.push('');L.push('*Compra*');L.push(`Palco: ${BRL(r.compra.palco)}`);L.push(`LED: ${BRL(r.compra.led)}`);L.push(`Frete (4%): ${BRL(r.compra.frete)}`);L.push(`*Compra total: ${BRL(r.compra.total)}*`);
  L.push(`Compra ÷ locação de 1 diária (palco + LED): ${r.payback.toFixed(1).replace('.',',')} diárias`);
  L.push('');L.push(`Montagem estimada: ${q.dias_montagem} dia${q.dias_montagem>1?'s':''} · ${q.montadores} montadores · ${q.viagens} viage${q.viagens>1?'ns':'m'} de carreta`);
  L.push('');L.push('_Valores-base estimados (nov/2026), referência Bahia; sem impostos/BDI; confirmar com fornecedores._');
  L.push('Gabriel Nascimento · Lauro de Freitas, BA');
  return L.join('\n');}
function csv(m,q,r){const esc=s=>'"'+String(s).replace(/"/g,'""')+'"';const n=x=>String(Math.round(x*100)/100).replace('.',',');
  const L=[['Tipo','Categoria','Item','Quantidade','Unidade','Valor unitário (R$)','Diárias','Total (R$)'].map(esc).join(';')];
  for(const x of r.locacao.itens)L.push(['Locação',x.cat,x.item,n(x.qtd),UN[x.un]||x.un,n(x.valor),x.diarias,n(x.total)].map(esc).join(';'));
  for(const x of r.compra.itens)L.push(['Compra',x.cat,x.item,n(x.qtd),UN[x.un]||x.un,n(x.valor),'',n(x.total)].map(esc).join(';'));
  L.push(['Compra','Frete','Frete (4% sobre palco + LED)','','','','',n(r.compra.frete)].map(esc).join(';'));
  for(const [k,v] of [['Locação · Palco',r.locacao.palco],['Locação · LED',r.locacao.led],['Locação · Palco + LED',r.locacao.palco_led],['Locação · Som, luz e energia',r.locacao.som_luz_energia],['Locação · Evento completo',r.locacao.evento_completo],['Compra total',r.compra.total]])L.push(['Total','',k,'','','','',n(v)].map(esc).join(';'));
  return L.join('\n');}
const API={calcula,resumo,csv,BRL,UN,fmtQ};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else raiz.ORCAMENTO=API;
})(typeof window!=='undefined'?window:globalThis);
