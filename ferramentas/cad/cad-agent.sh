#!/usr/bin/env bash
# Sobe o CAD Agent (servidor de modelagem build123d com renders) em http://127.0.0.1:8123.
# Roda sem Docker: neste ambiente a imagem não compila (o espelho de pacotes do Debian é bloqueado pela rede).
# Uso:  bash ferramentas/cad/cad-agent.sh        (instala na primeira vez e sobe o servidor)
#       bash ferramentas/cad/cad-agent.sh parar
#
# CAD Agent: Copyright (c) 2026 Svetlana DAO LLC, licença PolyForm Small Business 1.0.0
# https://github.com/Svetlana-DAO-LLC/cad-agent  (o código fica fora do repositório; aqui só o script e os ajustes)
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd)"
DIR="${CAD_AGENT_DIR:-/tmp/cad-agent}"
COMMIT=5bbf716870128af0e6e1ac49fff6a315e79a417a   # versão testada; os ajustes valem para ela
PORTA=8123

if [ "${1:-}" = "parar" ]; then pkill -f "src.mcp_server http" || true; exit 0; fi

if [ ! -d "$DIR/src" ]; then
  git clone -q https://github.com/clawd-maf/cad-agent.git "$DIR"
  git -C "$DIR" checkout -q "$COMMIT"
  # ajustes: aspas escapadas que impedem o servidor de abrir, sandbox que bloqueava o próprio build123d
  # e câmera do render 3D que cortava peças maiores que ~1 m
  git -C "$DIR" apply "$AQUI/cad-agent-ajustes.patch"
fi
if [ ! -x "$DIR/.venv/bin/python" ]; then
  python3 -m venv "$DIR/.venv"
  "$DIR/.venv/bin/pip" install -q --upgrade pip
  "$DIR/.venv/bin/pip" install -q -r "$DIR/requirements.txt" vtk
fi
mkdir -p /workspace /renders     # pastas fixas no código do servidor
pgrep -x Xvfb >/dev/null || (setsid nohup Xvfb :99 -screen 0 1280x1024x24 >/dev/null 2>&1 &)
if ! curl -s --noproxy '*' "http://127.0.0.1:$PORTA/health" >/dev/null; then
  (cd "$DIR" && DISPLAY=:99 PYOPENGL_PLATFORM=osmesa MPLBACKEND=Agg \
    setsid nohup .venv/bin/python -m src.mcp_server http --host 127.0.0.1 --port $PORTA > /tmp/cad-agent.log 2>&1 &)
fi
curl -s --noproxy '*' --retry 60 --retry-delay 1 --retry-connrefused "http://127.0.0.1:$PORTA/health"; echo
