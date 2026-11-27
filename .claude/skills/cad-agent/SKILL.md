---
name: cad-agent
description: Modelar peças em CAD (build123d) e ver o resultado em imagens 3D, vistas técnicas e cotas, exportando STL/STEP. Use para peças de palco e estrutura (bases de torre, sapatas, conectores, praticáveis, suportes de LED, case) quando precisar de medida exata, desenho técnico ou um modelo para o 3D do site.
---

# CAD Agent (build123d + renders)

Servidor local que executa código build123d e devolve imagens. Ciclo: criar modelo → pedir render → olhar a imagem → ajustar.

## Subir o servidor

```bash
bash ferramentas/cad/cad-agent.sh          # instala na 1ª vez (~2 min) e sobe em http://127.0.0.1:8123
bash ferramentas/cad/cad-agent.sh parar
```

Sem Docker: neste ambiente o `docker build` não passa (espelho de pacotes do Debian bloqueado). O script clona a versão testada, aplica `ferramentas/cad/cad-agent-ajustes.patch` e roda num venv. Use sempre `curl --noproxy '*'` para falar com o servidor (senão o proxy do ambiente intercepta).

## Regras do código enviado

- **Não escreva `import`** (nem `from build123d import *`): o sandbox bloqueia a palavra `import`. Todos os nomes do build123d e `np` já estão disponíveis.
- O objeto final vai na variável `result`. Unidades em **milímetros**.
- Também são bloqueados: `eval(`, `exec(`, `os.`, `open(`, `read(`, `write(`, `socket`, `subprocess`.

## Endpoints mais usados

```bash
cad(){ curl -s --noproxy '*' -H 'Content-Type: application/json' "$@"; }
cad -X POST http://127.0.0.1:8123/model/create -d '{"name":"base","code":"result = Box(900, 900, 80)"}'
cad -X POST http://127.0.0.1:8123/model/modify -d '{"name":"base","code":"result = result - Cylinder(30, 100).locate(Pos(350, 350, 0))"}'
cad -X POST http://127.0.0.1:8123/render/3d -d '{"model_name":"base","view":"iso"}'        # JSON: {path, base64}
cad -X POST http://127.0.0.1:8123/render/multiview -d '{"model_name":"base"}'              # frente/lado/topo com cotas
cad -X POST http://127.0.0.1:8123/export -d '{"model_name":"base","format":"stl"}' -o base.stl   # também step, 3mf
cad http://127.0.0.1:8123/model/base/measure
```

Os renders voltam em JSON com a imagem em `base64` (e o arquivo em `/renders`). Decodifique e **olhe a imagem** antes de seguir.
Vistas: `iso`, `front`, `back`, `left`, `right`, `top`, `bottom`.

## Uso no Mirante3D

- Peças reais do palco (bases de torre 0,9 × 0,9 m, treliça Q30/Q50/Q76, gabinetes de LED 0,5 × 0,5/1 m, praticável 2 × 1 m) com medidas exatas para conferir proporções do 3D ou gerar malhas.
- Para levar ao site: exportar STL/STEP, converter para GLB (ex.: trimesh no venv do servidor) e otimizar antes de entrar em `public/`.
- Arquivos de projeto (STL/STEP) de cliente não entram no git sem o usuário pedir.
- Não use `/ai/feedback` (manda o código para uma API de IA externa se houver chave no ambiente).

CAD Agent: Copyright (c) 2026 Svetlana DAO LLC — PolyForm Small Business 1.0.0 — https://github.com/Svetlana-DAO-LLC/cad-agent
