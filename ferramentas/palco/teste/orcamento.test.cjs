// Teste do orçamento: presets de referência P/M/G, 1 diária, contra os totais da planilha (tolerância de R$ 1).
// Uso: node ferramentas/palco/teste/orcamento.test.cjs   (o monta.py roda este teste antes de gerar as páginas)
const path = require('path');
const P = require(path.join(__dirname, '..', 'src', 'palcos', 'modelo.js'));
const O = require(path.join(__dirname, '..', 'src', 'palcos', 'orcamento.js'));
const base = require(path.join(__dirname, '..', 'src', 'palcos', 'orcamento-base.json'));
const ESPERADO = {   // tabela do pedido (planilha "Orçamento-base Palco e LED (BA)")
  P: { palco: 7593, led: 7344, palco_led: 14937, evento: 28870, compra: 315193 },
  M: { palco: 23043, led: 31330, palco_led: 54373, evento: 84539, compra: 1144499 },
  G: { palco: 59877, led: 136220, palco_led: 196097, evento: 287097, compra: 4266028 },
};
let falhas = 0;
for (const tam of ['P', 'M', 'G']) {
  const m = P.resolve(P.PADRAO[tam], tam, {});
  const q = P.quantidades(P.geometria(m));
  const r = O.calcula(base, q, 1);
  const got = { palco: r.locacao.palco, led: r.locacao.led, palco_led: r.locacao.palco_led, evento: r.locacao.evento_completo, compra: r.compra.total };
  // quantidades item a item contra o JSON (ajuda a achar a peça que diverge)
  for (const sec of ['locacao', 'compra']) for (const it of base[sec]) {
    const linha = r[sec].itens.find(x => x.id === it.id); const n = linha ? linha.qtd : 0;
    if (Math.abs(n - it.qtd[tam]) > 1e-6) { console.log(`  ${tam} ${sec}.${it.id}: ${n} (planilha ${it.qtd[tam]})`); }
  }
  for (const k in ESPERADO[tam]) {
    const ok = Math.abs(got[k] - ESPERADO[tam][k]) <= 1;
    if (!ok) falhas++;
    console.log(`${ok ? 'ok ' : 'ERRO'} ${tam} ${m.nome.padEnd(26)} ${k.padEnd(9)} ${O.BRL(got[k]).padStart(18)}  esperado ${O.BRL(ESPERADO[tam][k])}`);
  }
  console.log(`     ${tam} montagem ${q.dias_montagem} dia(s), ${q.viagens} viagem(ns), ${q.horas} h·homem, ${q.volume_m3} m³`);
}
if (falhas) { console.error(`\n${falhas} total(is) fora da tolerância`); process.exit(1); }
console.log('\norçamento ok');
