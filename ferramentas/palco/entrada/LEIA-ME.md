# Entrada do configurador de palcos

Arquivos de apoio para o prompt `PROMPT-configurador-palcos.md`. Esta pasta é só referência: não é carregada pelo `monta.py`.

- `montagem/`: pacote da aba Montagem, feito sobre a versão anterior do palco. Contém o LEIA-ME, `p6_montagem.js`, patches, prints e `referencia-versao-anterior-com-montagem.html`.
- `orcamento-base.json`: preços e **quantidades P/M/G** de locação e de compra, mais os totais de referência para 1 diária. Espelha a planilha "Orçamento-base Palco e LED (BA)".

## Como os totais de LED (locação) fecham

| Tam. | LED m² × R$ 380 | Estrutura m × R$ 42 | VJ × R$ 1.950 | Servidor × R$ 2.500 | Total |
|---|---|---|---|---|---|
| P | 18 → 6.840 | 12 → 504 | 0 | 0 | **7.344** |
| M | 74 → 28.120 | 30 → 1.260 | 1 → 1.950 | 0 | **31.330** |
| G | 335 → 127.300 | 60 → 2.520 | 2 → 3.900 | 1 → 2.500 | **136.220** |

Regras do cálculo:
- Itens com `multiplica_diarias: true` são multiplicados pelo número de diárias. Equipe de montagem e transporte não são.
- O frete da compra é 4% sobre (palco + LED).
