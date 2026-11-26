"""Monta public/tours/castelos-e-ruinas-palco/index.html a partir de src/ (shell.html, vendor.js, app.js, gente.js, ...)."""
import os, re
AQUI = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(AQUI, 'src')
DEST = os.path.join(AQUI, '..', '..', 'public', 'tours', 'castelos-e-ruinas-palco', 'index.html')
ler = lambda n: open(os.path.join(SRC, n), encoding='utf-8').read()
app = ler('app.js')
# blocos incluídos: /*NOME*/ -> src/nome.js
for m in re.findall(r'/\*([A-Z]+)\*/', app):
    f = os.path.join(SRC, m.lower() + '.js')
    if os.path.exists(f):
        app = app.replace('/*' + m + '*/', ler(m.lower() + '.js'), 1)
html = ler('shell.html').replace('<!--APP-->', '<script>\n' + ler('vendor.js') + '\n</script>\n<script>\n' + app + '\n</script>')
# confere a sintaxe do script antes de gravar (nomes repetidos, chaves abertas)
import subprocess, tempfile
with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf:
    tf.write(app)
r = subprocess.run(['node', '--check', tf.name], capture_output=True, text=True)
os.unlink(tf.name)
if r.returncode:
    raise SystemExit('erro de sintaxe no app:\n' + r.stderr[-2000:])
open(DEST, 'w', encoding='utf-8').write(html)
print('ok', os.path.relpath(DEST), len(html) // 1024, 'KB')
