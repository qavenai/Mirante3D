# Ferramentas do palco "Castelos & Ruínas"

O tour `public/tours/castelos-e-ruinas-palco/` é montado a partir destes fontes.

## Página (three.js)

```
ferramentas/palco/src/shell.html   HTML, CSS e interface (textos em pt-BR)
ferramentas/palco/src/vendor.js    three.js r147 + controles e pós-processamento
ferramentas/palco/src/app.js       palco, LED (mundo 3D, nuvens volumétricas), luz, câmeras
ferramentas/palco/src/gente.js     pessoas: malhas, esqueleto na GPU, animações, LOD
python3 ferramentas/palco/monta.py   ->  public/tours/castelos-e-ruinas-palco/index.html
```

`?leve` no endereço força o modo leve (o mesmo que o celular abre sozinho).

## Texturas PBR

`python3 ferramentas/palco/texturas.py public/tours/castelos-e-ruinas-palco/texturas`
(arenito em blocos com fiadas de 31,25 cm = altura do degrau; piso preto; alumínio escovado).

## Pessoas

Base humana MakeHuman (CC0), vinda do pacote PyPI `anny` (Apache-2.0; dados mpfb2 em CC0), montada no Blender (`bpy` 4.2):

```
pip download anny --no-deps && unzip anny-*.whl          # dados em anny/data/mpfb2
MPFB=.../anny/data/mpfb2 python ferramentas/palco-gente/exporta.py public/tours/castelos-e-ruinas-palco/pessoas
MPFB=... python ferramentas/palco-gente/pele.py public/tours/castelos-e-ruinas-palco/pessoas
```

Gera 12 corpos do público + o artista genérico, cada um com roupa própria (camiseta, regata, cropped, xadrez,
manga longa, camisa de time; jeans, bermuda, short, cargo, jogger), tênis, olhos e cílios, 5 cabelos ajustados a cada
cabeça (curto, black, coque, boné, tranças), celular/copo/microfone e 3 níveis de detalhe.

## Renders "foto" (Blender Cycles)

```
NODE_PATH=$(npm root -g) node ferramentas/palco/exporta_cena.cjs http://localhost:8765/public/tours/castelos-e-ruinas-palco/ cena/
python ferramentas/palco/render_cycles.py cena/ fotos/ 0 artista 48    # imagem do LED lateral
python ferramentas/palco/render_cycles.py cena/ fotos/ 0 ponto 96      # 0 Céu, 1 Ruínas, 2 Castelo
```
