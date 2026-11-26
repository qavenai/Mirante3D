"""Monta as páginas do palco a partir de src/:
   public/tours/castelos-e-ruinas-palco/index.html  (src/shell.html + src/app.js)
   public/tours/configurador-palcos/index.html      (src/config/shell.html + src/config/app.js)
Marcadores no JS:  /*NOME*/ -> src/nome.js   /*INCLUI:caminho*/ -> src/caminho   /*JSON:caminho*/ -> conteúdo do JSON.
Antes de gravar: confere a sintaxe (node --check) e roda o teste do orçamento (teste/orcamento.test.cjs)."""
import os, re, subprocess, tempfile, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(AQUI, 'src')
PUB = os.path.join(AQUI, '..', '..', 'public', 'tours')
ler = lambda n: open(os.path.join(SRC, n), encoding='utf-8').read()

def expande(js):
    for _ in range(4):   # inclusões podem trazer outros marcadores
        js = re.sub(r'/\*INCLUI:([\w./-]+)\*/', lambda m: ler(m.group(1)), js)
        js = re.sub(r'/\*JSON:([\w./-]+)\*/null', lambda m: ler(m.group(1)).strip(), js)
        for m in re.findall(r'/\*([A-Z]+)\*/', js):
            if os.path.exists(os.path.join(SRC, m.lower() + '.js')):
                js = js.replace('/*' + m + '*/', ler(m.lower() + '.js'), 1)
    return js

def confere(js, nome):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf:
        tf.write(js)
    r = subprocess.run(['node', '--check', tf.name], capture_output=True, text=True)
    os.unlink(tf.name)
    if r.returncode:
        raise SystemExit(f'erro de sintaxe em {nome}:\n' + r.stderr[-2000:])

t = subprocess.run(['node', os.path.join(AQUI, 'teste', 'orcamento.test.cjs')], capture_output=True, text=True)
if t.returncode:
    sys.stdout.write(t.stdout); raise SystemExit('teste do orçamento falhou: nada foi gravado')
print('teste do orçamento ok')

vendor = ler('vendor.js')
for shell, app, destino in [('shell.html', 'app.js', 'castelos-e-ruinas-palco'), ('config/shell.html', 'config/app.js', 'configurador-palcos')]:
    js = expande(ler(app))
    confere(js, app)
    html = ler(shell).replace('<!--APP-->', '<script>\n' + vendor + '\n</script>\n<script>\n' + js + '\n</script>')
    d = os.path.join(PUB, destino); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
    print('ok', os.path.relpath(os.path.join(d, 'index.html')), len(html) // 1024, 'KB')
