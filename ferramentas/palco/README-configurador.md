# Configurador de palcos

Página: `public/tours/configurador-palcos/` (gerada, não editar à mão).
Fonte: `ferramentas/palco/src/` → `python3 ferramentas/palco/monta.py`.

```
src/palcos/modelo.js          presets, tamanhos P/M/G, geometria (peças) e quantidades
src/palcos/orcamento.js       quantidades -> linhas da tabela de preços, totais, resumo e CSV
src/palcos/orcamento-base.json preços-base (nov/2026, Bahia) e totais de referência
src/config/app.js             3D, montagem, abas e painéis do configurador
src/config/shell.html         HTML/CSS do configurador
teste/orcamento.test.cjs      confere P/M/G padrão, 1 diária, contra a planilha (±R$ 1)
```

O `monta.py` roda o teste do orçamento antes de gravar. Se o teste falhar, nenhuma página é gravada.

## Como acrescentar um palco novo

1. Em `src/palcos/modelo.js`, acrescente um objeto na lista `PRESETS`:

```js
{id:'meu-palco', ref:10, nome:'Meu palco', desc:'Uma frase sobre o estilo.',
 estrutura:{tipo:'grid-4-torres', torres:4},   // ou cobertura-duas-aguas (com lona:'#cor'), portico-frontal, trelica-em-U, alas-laterais-andaime
 escadas:'lateral',                             // lateral, cantos ou central
 som:{la:'torres', subs:'piso'},                // la: torres, suspenso ou meio; subs: piso ou empilhado
 luz:{mh:'grid', refl:true, blind:false, pix:false},
 conteudo:'paisagem',                           // conteúdo do LED: paisagem, por-do-sol, roxo, castelos
 led:{P:[{tipo:'fundo',larg:6,alt:3}],
      M:[{tipo:'fundo',larg:11,alt:6},{tipo:'lateral',larg:2,alt:2}],
      G:[{tipo:'fundo',larg:20,alt:10},{tipo:'lateral',larg:5,alt:13.5}]}},
```

   - Medidas de LED em múltiplos de 0,5 m (gabinetes de 0,5 × 0,5 ou 0,5 × 1 m). Painéis `lateral` e `recorte` contam em dobro (um de cada lado).
   - Para manter as áreas de LED do pedido (P 18 m², M 74 m², G 335 m²), some fundo + 2 × laterais.
   - Opcionais: `passarela:true`, `cortina:true`, `cenografia:'escadaria'`, `efeitos:{papel:true}`.
   - `assinatura` só no Castelos & Ruínas. Sem marcas, logos ou patrocinadores em nenhum preset.

2. Rode `python3 ferramentas/palco/monta.py`. A miniatura do botão, o 3D, as câmeras, as 10 etapas da montagem, a lista de peças e o orçamento saem sozinhos da geometria.

3. Abra `#p=meu-palco-M` e confira as três medidas (P, M, G) e o modo Personalizado.

Para mudar preço, mude só o `orcamento-base.json` e atualize os totais esperados no teste, se a planilha mudou.

## Endereço compartilhável

`#p=<preset>-<P|M|G|X>`. No Personalizado (`X`) entram `l`, `d`, `h` e `led` (largura, profundidade, altura e m² de LED).
Itens ligados ou desligados entram como `cob`, `alas`, `pass`, `cen`, `som` e `ger` (1 ou 0), e diárias como `dias`.
Exemplo: `#p=festival-X&l=16&d=12&h=12&led=120&dias=2`.
