# Aba "Montagem" — palco Castelos & Ruínas

Feita sobre a versão anterior do palco (antes da versão hiper-realista). Precisa ser **portada** para
`ferramentas/palco/src/` (app.js, shell.html, gente.js).

## Arquivos
- `p6_montagem.js` — toda a lógica da montagem (etapas, peças, equipe, máquinas, câmera, interface). Entrava antes do bloco de UI/laço.
- `patches/p1_palco.diff` — marca as peças do palco em listas (DECK, PIR, GUARDA, QUEIM, PANOS, LEDCX, LA, SUBS, GRADE, fohG, N_P1)
  e separa as treliças em uma InstancedMesh por conjunto (`TRELICAS.torres / grid / torresLat / torresDelay`, ordenadas para revelar peça por peça).
- `patches/p5_ui.diff` — liga a montagem no laço (`atualizaMontagem`, câmera `camMontagem`, não renderiza o mundo do LED enquanto o LED está apagado, LOD da equipe, `vista()` no resize, ganchos de teste).
- `patches/head.diff` — botão "Montagem", painel de etapas (play + 10 segmentos) e gaveta "Lista de peças" (CSS desktop e celular).
- `referencia-versao-anterior-com-montagem.html` — a versão anterior com a montagem funcionando (abrir no navegador para ver o comportamento).
- `prints/` — etapas no computador e no celular.

## Como funciona
- 10 etapas (66 s): base (praticáveis) → torres → grid montado no piso → içamento → LED central (fileira por fileira na barra de suspensão)
  → LEDs laterais → escadaria e pirâmide → som → acabamento (luz de chão, chamas, panos, banda, grade, FOH) → teste de pixels e show.
- Tudo é função do tempo `MONT.t` (dá para arrastar/pular etapas). `aplicaMont(t)` posiciona as peças; `atualizaMontagem` sobrepõe as luzes do show com luz de serviço.
- Equipe: 10 pessoas com colete e capacete; plano por etapa em `PLANO0` (x, altura, z, para onde olha, pose, modo, carrega).
  Usa `pessoa()`/`grupoHumanos()` antigos (mover, pose, anim) — **adaptar ao novo gente.js**.
- Máquinas: empilhadeira telescópica e plataforma tesoura (geometria simples); talhas com corrente.
- Lista de peças com quantidades ilustrativas; tocar numa peça pula para a etapa, move a câmera e destaca a peça.
