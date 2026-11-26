"""Texturas PBR procedurais do palco (repetíveis):
  arenito: blocos em fiadas de 31,25 cm (= altura de um degrau; 4 fiadas = 1 patamar da pirâmide), 2,5 m × 1,25 m por repetição
           cor (sRGB), normal, rugosidade+oclusão
  piso:    piso preto de palco com marcas de uso (rugosidade) e normal fina
  escovado: alumínio escovado (riscos ao longo do tubo)

  python3 texturas.py <pasta-saida>   (precisa de numpy, scipy e pillow)
"""
import sys, os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, distance_transform_edt

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(1977)


def ruido_per(h, w, oitavas=6, base=4, seed=0, pers=.55):
    """ruído periódico (soma de senos com frequências inteiras) — repete sem costura"""
    r = np.random.default_rng(seed)
    y, x = np.mgrid[0:h, 0:w]
    u, v = x / w, y / h
    out = np.zeros((h, w))
    amp = 1.
    for o in range(oitavas):
        f = base * 2 ** o
        for _ in range(5):
            a, b = r.integers(-f, f + 1, 2)
            if a == 0 and b == 0:
                continue
            out += amp * np.sin(2 * np.pi * (a * u + b * v * (h / w) * (w / h)) + r.random() * 6.28)
        amp *= pers
    out -= out.min()
    return out / out.max()


def ruido_blur(h, w, sig, seed):
    r = np.random.default_rng(seed)
    n = r.random((h, w))
    n = gaussian_filter(n, sig, mode='wrap')
    n -= n.min()
    return n / max(n.max(), 1e-9)


def normal_de(alt, k):
    gx = (np.roll(alt, -1, 1) - np.roll(alt, 1, 1)) * k
    gy = (np.roll(alt, -1, 0) - np.roll(alt, 1, 0)) * k
    n = np.stack([-gx, gy, np.ones_like(alt)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return n


def salva(nome, a, q=90):
    a = np.clip(a, 0, 1)
    im = Image.fromarray((a * 255).astype(np.uint8))
    if nome.endswith('.jpg'):
        im.convert('RGB').save(f'{OUT}/{nome}', quality=q, optimize=True)
    else:
        im.save(f'{OUT}/{nome}', optimize=True)
    print(nome, os.path.getsize(f'{OUT}/{nome}') // 1024, 'KB')


def arenito(W=2048, H=1024):
    # 2,5 m × 1,25 m  -> 819 px/m ; fiada = 0,3125 m = 256 px
    pxm = W / 2.5
    fiada = H // 4
    junta = 7  # ~0,9 cm
    bloco_id = np.zeros((H, W), np.int32)
    tom = {}
    ids = 0
    bordas = np.zeros((H, W), bool)
    for f in range(4):
        y0, y1 = f * fiada, (f + 1) * fiada
        x = rng.integers(0, W)
        larg = []
        while sum(larg) < W:
            larg.append(int(pxm * (.55 + rng.random() * .75)))
        larg[-1] -= sum(larg) - W
        xs = np.cumsum([0] + larg)
        for i in range(len(larg)):
            a, b = (xs[i] + x) % W, (xs[i + 1] + x) % W
            ids += 1
            tom[ids] = (rng.normal(0, 1), rng.normal(0, 1), rng.random())
            if a < b:
                bloco_id[y0:y1, a:b] = ids
            else:
                bloco_id[y0:y1, a:] = ids
                bloco_id[y0:y1, :b] = ids
    # juntas = fronteiras entre ids (com repetição)
    for dy, dx in ((0, 1), (1, 0)):
        d = bloco_id != np.roll(np.roll(bloco_id, dy, 0), dx, 1)
        bordas |= d | np.roll(np.roll(d, -dy, 0), -dx, 1)
    dist = distance_transform_edt(~bordas)
    # repetição: distância calculada numa versão ladrilhada
    big = np.tile(bordas, (3, 3))
    dbig = distance_transform_edt(~big)
    dist = dbig[H:2 * H, W:2 * W]
    # relevo: face do bloco levemente abaulada, arestas gastas e lascadas, junta funda
    lasca = ruido_blur(H, W, 3, 11)
    gasto = ruido_per(H, W, 5, 3, 21)
    borda_w = junta + 6 + 14 * gasto + 10 * (lasca > .62)
    face = np.clip(dist / borda_w, 0, 1)
    face = 1 - (1 - face) ** 2.2
    estr = np.zeros((H, W))
    y = np.arange(H)[:, None] / H
    # estratos de sedimento horizontais e erosão alveolar (típica do arenito)
    estr = .5 + .5 * np.sin(2 * np.pi * (y * 4 * 5 + ruido_per(H, W, 4, 2, 31) * 3.5 + ruido_blur(H, W, 30, 32) * 2))
    alv = ruido_blur(H, W, 2.2, 41)
    pits = np.clip((alv - .66) * 6, 0, 1)
    fino = ruido_blur(H, W, .8, 51)
    alt = face * (.75 + .12 * gasto) + .012 * estr - .1 * pits - .03 * fino + .02 * ruido_blur(H, W, 12, 61)
    alt[dist < junta * .5] -= .05
    # cor: arenito dourado-ocre com variação por bloco, estratos, sujeira nas juntas e escorridos
    base = np.array([.71, .6, .46])
    cor = np.ones((H, W, 3)) * base
    tb = np.zeros((H, W, 3))
    for i, (a, b, c) in tom.items():
        m = bloco_id == i
        tb[m] = [a * .05 + c * .03, a * .045 + b * .01, a * .03 - b * .02]
    cor += tb
    cor *= (.96 + .05 * estr)[..., None] * np.array([1, .99, .97])
    cor *= (.82 + .3 * ruido_blur(H, W, 45, 72))[..., None]
    graos = rng.random((H, W))
    cor *= (.9 + .2 * graos)[..., None]
    cor *= (.85 + .3 * ruido_per(H, W, 6, 6, 71))[..., None]
    cor *= (.78 + .22 * face)[..., None]
    cor *= (1 - .25 * pits)[..., None]
    # escorridos (manchas verticais abaixo das juntas horizontais)
    esc = gaussian_filter(rng.random((H, W)) * (rng.random((1, W)) > .997) * (rng.random((H, 1)) > .7), (60, 9), mode='wrap')
    esc = esc / max(esc.max(), 1e-9)
    cor *= (1 - .12 * esc)[..., None]
    jmask = (dist < junta).astype(float)
    cor = cor * (1 - jmask[..., None] * .45) + jmask[..., None] * np.array([.32, .27, .22]) * .4
    cor *= (.94 + .12 * fino)[..., None]
    salva('arenito_cor.jpg', cor, 88)
    n = normal_de(gaussian_filter(alt, .7, mode='wrap'), 26)
    salva('arenito_nrm.jpg', n * .5 + .5, 92)
    rug = np.clip(.8 + .12 * fino + .1 * jmask - .08 * face * gasto, 0, 1)
    ao = np.clip(.55 + .45 * face, 0, 1) * (1 - .3 * pits)
    salva('arenito_rao.jpg', np.stack([rug, ao, np.zeros_like(ao)], -1), 90)


def piso(T=1024):
    # piso preto de palco: placas de compensado pintadas (1,22 m) com marcas de fita e arranhões
    fino = ruido_blur(T, T, .7, 3)
    manchas = ruido_per(T, T, 5, 3, 5)
    risc = np.zeros((T, T))
    for _ in range(260):
        x, y = rng.integers(0, T, 2)
        L = rng.integers(20, 220)
        a = rng.random() * np.pi
        for t in np.linspace(0, 1, L):
            xx, yy = int(x + np.cos(a) * t * L) % T, int(y + np.sin(a) * t * L) % T
            risc[yy, xx] = 1
    risc = gaussian_filter(risc, .6, mode='wrap')
    rug = np.clip(.3 + .25 * manchas + .08 * fino - .15 * risc / max(risc.max(), 1e-9), .08, 1)
    alt = .02 * fino - .3 * risc / max(risc.max(), 1e-9)
    grid = np.zeros((T, T))
    grid[:, :3] = 1
    grid[:3, :] = 1
    alt -= .12 * grid
    salva('piso_rug.jpg', np.stack([rug, rug, rug], -1), 90)
    salva('piso_nrm.jpg', normal_de(gaussian_filter(alt, .8, mode='wrap'), 3) * .5 + .5, 92)


def escovado(W=64, H=1024):
    r = rng.random((H, W))
    s = gaussian_filter(r, (40, .6), mode='wrap')
    s = (s - s.min()) / (s.max() - s.min())
    salva('escovado.jpg', np.stack([.28 + .18 * s] * 3, -1), 90)


arenito()
piso()
escovado()
