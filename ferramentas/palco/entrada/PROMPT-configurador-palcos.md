# Prompt para o Claude Code — Configurador de palcos (palco + LED + montagem + orçamento)

Cole o texto abaixo no Claude Code, no repositório `qavenai/Mirante3D`, e anexe `orcamento-base.json`. Se já estiver usando o pacote `montagem-palco.zip`, anexe-o também.

---

## Contexto

Neste repositório já existe o palco 3D do Castelos & Ruínas em `ferramentas/palco/`:
- `src/app.js`, `src/gente.js`, `src/shell.html` e `src/vendor.js`;
- `monta.py` gera o `index.html`;
- `ferramentas/palco-gente/` contém os bonecos humanos.

Também existe uma aba **Montagem** (pacote `montagem-palco.zip`), com etapas, peças e montadores animados. Ela ainda precisa ser portada para esse código.

Quero transformar isso num **sistema único para vários palcos**: o cliente escolhe o tipo e o tamanho do palco e recebe, na mesma página, o palco 3D pronto, o LED, a montagem passo a passo e um orçamento automático de locação e de compra, com valores-base da Bahia.

Antes de mudar qualquer coisa, leia o código atual e os commits recentes. Não apague nem sobrescreva o trabalho existente: o Castelos & Ruínas deve continuar funcionando e passa a ser um dos presets.

## O que construir

### 1. Modelo de dados de palco (`ferramentas/palco/src/palcos/`)

Crie um formato declarativo (JSON ou objeto JS) que descreva um palco por parâmetros, e não por geometria fixa. Ele deve cobrir:
- **Piso:** largura × profundidade, altura, avanço/passarela, escadas (laterais, centrais ou nos dois cantos) e saia.
- **Estrutura:** um dos tipos `cobertura-duas-aguas`, `grid-4-torres`, `portico-frontal`, `trelica-em-U` ou `alas-laterais-andaime`, além do tipo de treliça (Q30/Q50/Q60-Q76), da altura e do número de torres.
- **LED:** lista de painéis (fundo, laterais, recortados, tubos verticais), cada um com largura × altura em gabinetes de 0,5 × 0,5 m ou 0,5 × 1 m, pitch e método de fixação (suspenso ou ground stack). A área em m² é calculada.
- **Som, luz e cena:**
  - line arrays (suspensos ou empilhados), subs, moving heads, refletores, blinders, house mix e gradil;
  - cenografia opcional (como a escadaria e a pirâmide do Castelos & Ruínas);
  - efeitos (papel picado, fumaça).
- **Montagem:** etapas derivadas automaticamente das peças. A ordem é base → torres → grid → içamento → LED → laterais → escada → som → acabamento → teste, igual à aba Montagem.

O gerador 3D lê esse formato e monta a cena reaproveitando os módulos atuais: treliça instanciada, praticáveis, LED com conteúdo, bonecos e câmeras.

### 2. Presets das 9 referências + tamanhos P/M/G

Crie um preset para cada uma das 9 referências de palco:
1. Compacto com cobertura cinza: treliça quadrada nos 4 lados, moving heads na treliça frontal, caixas penduradas nas torres e piso preto com passarela curta.
2. Festival grande: telhado preto central, alas laterais em andaime com LEDs grandes, LED central de fundo, escada lateral e grade na frente.
3. Teatro/evento: pórtico de treliça só na frente, line arrays nas torres, refletores e moving heads, cortina preta, escadas nos dois cantos e pedestais.
4. Aberto em grid de 4 torres, sem telhado: LED de fundo largo, line arrays suspensos, moving heads na treliça e no chão, subs empilhados, escada lateral e grade.
5. Médio com treliça em U: LEDs de fundo recortados (paisagem/pôr do sol) e escadinha central na frente.
6. Aberto de 4 torres: line arrays no meio, moving heads, subs no piso e plateia ao fundo.
7. Pequeno em treliça: caixas no alto, tubos de LED verticais nas torres, papel picado e grade.
8. Show com telhado: line arrays laterais e LED de fundo roxo.
9. Grande com alas laterais em treliça: blinders/PIX nas torres, LEDs laterais e central, line arrays, subs, cobertura preta e grade em toda a frente.

Mais o preset **Castelos & Ruínas**, que é o atual (G).

Cada preset aceita os tamanhos **P (8 × 6 m, 18 m² de LED)**, **M (12 × 10 m, 74 m² de LED)** e **G (20 × 15 m, 335 m² de LED)**, além de um modo **Personalizado** em que o cliente ajusta as medidas, a área de LED e os itens.

### 3. Interface do configurador

Use o mesmo visual do palco atual.

- **Painel lateral:**
  - escolha de preset (miniatura de cada um);
  - tamanho P/M/G/Personalizado;
  - sliders de largura, profundidade e altura;
  - LED (áreas e posições);
  - checkboxes de cobertura, alas, passarela, cenografia, som/luz e gerador;
  - número de diárias.
- **Abas:** **Palco** (pronto, navegável), **LED** (conteúdos de demonstração), **Montagem** (timeline com peças e montadores, recalculada para o palco escolhido) e **Orçamento**.
- **Estado na URL:** cada palco configurado gera uma URL compartilhável com hash simples (`#p=preset-tamanho` ou um código curto) para mandar ao cliente.

### 4. Orçamento automático (aba Orçamento)

Use `orcamento-base.json` (anexo) como tabela de preços. **Não invente preços.** As quantidades saem da geometria; se mudar o palco, o orçamento muda junto.

**Locação:**

| Item | Como calcular |
| --- | --- |
| Piso | m² do piso × R$ 30 por diária |
| Treliça da cobertura/grid | metros de treliça × R$ 42 por diária |
| Lona | m² × R$ 12 por diária |
| Talhas | R$ 350 por unidade por diária |
| Gradil | R$ 47 por unidade por diária |
| House mix | R$ 1.476,67 por diária |
| Equipe de montagem | R$ 2.400 por dia de montagem (não multiplica por diárias) |
| Transporte | R$ 1.800 por viagem (não multiplica por diárias) |
| LED P3,9 | m² × R$ 380 por diária, com processadora e técnico |
| Estrutura do LED | metros × R$ 42 por diária |
| VJ | R$ 1.950 por diária |
| Servidor de mídia | R$ 2.500 por diária |
| Som | pacote P R$ 6.700, M R$ 15.300, G R$ 45.000 |
| Luz | pacote P R$ 3.466,67, M R$ 9.900, G R$ 30.000 |
| Gerador | 180 kVA R$ 3.766,67, 260 kVA R$ 4.966,67 ou 500 kVA R$ 8.000 |

**Compra:**

| Item | Valor |
| --- | --- |
| Praticável 2 × 1 m | R$ 2.200 |
| Saia, escadas e guarda-corpo | R$ 40 por m² de palco |
| Treliça Q30 | R$ 650/m |
| Treliça Q50 | R$ 1.100/m |
| Treliça Q60/Q76 | R$ 1.600/m |
| Bases de torre | R$ 6.000 por torre |
| Talha 1 t | R$ 14.000 |
| Lona | R$ 60/m² |
| Gradil | R$ 450 |
| Cenografia sob medida | R$ 180.000 por projeto, opcional |
| LED P3,9 | R$ 7.000/m² até 50 m²; R$ 6.500/m² de 50 a 150 m²; R$ 6.000/m² acima de 150 m² |
| Reserva | ≈ 5% de gabinetes a R$ 6.500/m² |
| Processadora | R$ 18.000 |
| Servidor de mídia | R$ 45.000 |
| Barras, ground stack e cases | R$ 900 por m² de LED |
| Cabos | R$ 250 por m² de LED |
| Frete | 4% sobre o total |

**Exibição:**
- Totais separados: **Palco**, **LED**, **Palco + LED**, **Som/luz/energia** e **Evento completo**, mais a **Compra total**.
- Indicador "compra ÷ locação de 1 diária" (payback em número de diárias).
- Lista de peças com quantidades: a mesma lista usada pela aba Montagem.
- Botão **Copiar resumo** (texto pt-BR, pronto para WhatsApp) e exportação CSV.
- Aviso fixo: "Valores-base estimados (nov/2026), referência Bahia; sem impostos/BDI; confirmar com fornecedores."

**Teste obrigatório:** com os presets P/M/G padrão e 1 diária, o orçamento deve bater com a planilha (tolerância de R$ 1).

| | P | M | G |
| --- | --- | --- | --- |
| Locação Palco | R$ 7.593 | R$ 23.043 | R$ 59.877 |
| Locação LED | R$ 7.344 | R$ 31.330 | R$ 136.220 |
| Locação Palco + LED | R$ 14.937 | R$ 54.373 | R$ 196.097 |
| Evento completo (com som, luz e gerador) | R$ 28.870 | R$ 84.539 | R$ 287.097 |
| Compra (palco + LED + frete) | R$ 315.193 | R$ 1.144.499 | R$ 4.266.028 |

Crie esse teste em `ferramentas/palco/teste/` e rode-o antes de cada commit.

### 5. Montagem por palco

Porte a aba Montagem do `montagem-palco.zip` para `ferramentas/palco/src`, mas gerada a partir do modelo de dados: peças contadas, ordem das etapas, montadores proporcionais ao tamanho e duração da timeline proporcional à quantidade de peças. Mostre o tempo estimado de montagem real:
- P: ≈ 1 dia;
- M: ≈ 1–2 dias;
- G: ≈ 4–5 dias.

### 6. Qualidade visual

Mantenha o hiper-realismo já feito no palco e nos bonecos (`palco-gente`, boneco do Meshy). Use LOD para palcos G com muito público e meça o FPS no celular.

## Regras (manter sempre)

- Sem logos, marcas ou patrocinadores, nem nos LEDs nem nos equipamentos.
- Artista sempre genérico: sem fotos, rosto parecido ou letras de música.
- Manter os avisos onde já existem:
  - "Protótipo · conceito independente e não oficial";
  - "JOVEMRARO — ALÉM DO QUE SE VÊ" (somente no preset Castelos & Ruínas);
  - "Estudo conceitual de palco; não é documentação técnica".
- Textos em pt-BR.
- Assinatura: Gabriel Nascimento / Lauro de Freitas, BA. Não publicar e-mail pessoal. Links wa.me só para números de celular.
- Não sobrescrever commits existentes. Trabalhe em commits pequenos, com a mensagem descrevendo cada etapa, e me mostre uma prévia (print ou link) antes de publicar.

## Entrega

1. Configurador funcionando em `ferramentas/palco/` com os 10 presets, P/M/G/Personalizado, as abas Palco/LED/Montagem/Orçamento e URL compartilhável.
2. Teste do orçamento passando.
3. Prints de 3 presets (um P, um M, um G) com o orçamento ao lado.
4. Um README curto explicando como adicionar um palco novo a partir das medidas que o cliente pedir.
