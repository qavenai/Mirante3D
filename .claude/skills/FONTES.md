# Origem das skills e agentes instalados

Instaladas em 27/11/2026 a pedido do usuário, depois de lidas por inteiro. Ficam no repositório (e não em `~/.claude`) porque o contêiner das sessões é apagado no fim: daqui elas carregam em toda sessão neste repositório.

| Pasta | Origem | Licença |
|---|---|---|
| `blender-automation` | phuetz/code-buddy, `.codebuddy/skills/bundled/blender/SKILL.md` (removida do repositório em abr/2026; recuperada do commit anterior a fbf62d72). Nome trocado de `blender` para `blender-automation` para não colidir com a skill `blender` abaixo | Business Source License 1.1 (ver LICENSE na pasta) |
| `shader-techniques`, `3d-modeling` | majiayu000/claude-skill-registry → cópia arquivada em claude-skill-registry-data, commit a21980a5 (a pasta original virou só um aviso). A `3d-modeling` cita uma pasta `references/` que não existe no arquivo; há uma nota na skill | registro MIT; conteúdo de autores diversos |
| `blender-3d-modeling` | Andrew1326/dominations, `.claude/skills/blender-3d-modeling` | Apache-2.0 (declarada na skill) |
| `animation`, `asset-optimization`, `blender`, `modeling`, `omniverse`, `rigging`, `texturing`, `unity`, `vroid` | DavinciDreams/Agent-Team-Plugins, `teams/3d-design/skills` | MIT (Monumental Systems) |
| `../agents/*.md` (7 agentes: 3d-analyst, animator, asset-optimizer, modeler, rigger, texturer, vtuber-specialist) | DavinciDreams/Agent-Team-Plugins, `teams/3d-design/agents` | MIT |
| `game-developer` (com `references/`) | Jeffallan/claude-skills, `plugin/skills/game-developer` (o caminho `skills/game-developer` mudou para `plugin/`) | MIT |
| `cad-agent` | escrita para este repositório; usa o CAD Agent (Svetlana DAO LLC) via `ferramentas/cad/cad-agent.sh` | PolyForm Small Business 1.0.0 (o código do CAD Agent não está no repositório) |

Não instalados de propósito:
- o hook `PostToolUse` do time 3d-design (registra todas as chamadas de ferramenta num arquivo);
- o `.mcp.json` do time 3d-design: aponta para pacotes `@anthropic/mcp-blender`, `@anthropic/mcp-unity` etc., que não são pacotes oficiais da Anthropic.

Observação de uso no Mirante3D: o site é three.js no navegador. Unity, Unreal, Omniverse e VRoid aparecem nas skills como referência geral; para o site valem as partes de modelagem, topologia, LOD, texturas PBR, shaders e exportação glTF/GLB.
