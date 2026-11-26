"""Textura de detalhe da pele no UV do MakeHuman (vale para todas as variantes).

  R: variação de tom (manchas, poros, pálpebras e dobras mais escuras)   G: lábios
  B: sobrancelhas fio a fio                                               A: pontos de barba (densidade)
Também gera um mapa normal pequeno e repetível de poros e um de trama de tecido.

  /opt/bvenv/bin/python pele.py <pasta-saida>
"""
import sys, os
import numpy as np
from PIL import Image
import base, gera
from gera import ss, fbm

SAIDA = sys.argv[1]
TAM = 1024


def rasteriza(V, faces, uvi, tam):
    """para cada texel do UV, a posição 3D e a normal interpoladas"""
    pos = np.zeros((tam, tam, 3), np.float32)
    nrm = np.zeros((tam, tam, 3), np.float32)
    ok = np.zeros((tam, tam), bool)
    N = gera.normais(V, faces)
    for f, t in zip(faces, uvi):
        for tri in ((0, 1, 2), (0, 2, 3)) if len(f) == 4 else ((0, 1, 2),):
            a, b, c = (f[k] for k in tri)
            ua, ub, uc = (base.VT[t[k]] * [tam, tam] for k in tri)
            ua, ub, uc = [np.array([u[0], tam - u[1]]) for u in (ua, ub, uc)]
            x0, y0 = np.floor(np.minimum(np.minimum(ua, ub), uc)).astype(int)
            x1, y1 = np.ceil(np.maximum(np.maximum(ua, ub), uc)).astype(int)
            x0, y0 = max(x0, 0), max(y0, 0)
            x1, y1 = min(x1, tam - 1), min(y1, tam - 1)
            if x1 < x0 or y1 < y0:
                continue
            xs, ys = np.meshgrid(np.arange(x0, x1 + 1) + .5, np.arange(y0, y1 + 1) + .5)
            d = (ub[1] - uc[1]) * (ua[0] - uc[0]) + (uc[0] - ub[0]) * (ua[1] - uc[1])
            if abs(d) < 1e-9:
                continue
            l1 = ((ub[1] - uc[1]) * (xs - uc[0]) + (uc[0] - ub[0]) * (ys - uc[1])) / d
            l2 = ((uc[1] - ua[1]) * (xs - uc[0]) + (ua[0] - uc[0]) * (ys - uc[1])) / d
            l3 = 1 - l1 - l2
            m = (l1 >= -.02) & (l2 >= -.02) & (l3 >= -.02)
            if not m.any():
                continue
            P = l1[..., None] * V[a] + l2[..., None] * V[b] + l3[..., None] * V[c]
            Nn = l1[..., None] * N[a] + l2[..., None] * N[b] + l3[..., None] * N[c]
            yy, xx = (ys - .5).astype(int), (xs - .5).astype(int)
            pos[yy[m], xx[m]] = P[m]
            nrm[yy[m], xx[m]] = Nn[m]
            ok[yy[m], xx[m]] = True
    return pos, nrm, ok


def main():
    os.makedirs(SAIDA, exist_ok=True)
    V = base.para_chao(base.corpo(genero=.5, africano=.8, europeu=.2))
    H, T = base.juntas(V)
    faces = [base.FACES[i] for i in gera.BODY_F]
    uvi = [base.FACES_UV[i] for i in gera.BODY_F]
    pos, nrm, ok = rasteriza(V, faces, uvi, TAM)
    P = pos.reshape(-1, 3)
    rng = np.random.default_rng(3)
    eL = V[base.grupo_vertices('joint-l-eye')].mean(0)
    boca = V[base.grupo_vertices('joint-mouth')].mean(0)
    cab = H[gera.OB['head']]
    # --- R: tom
    m1 = fbm(P * 14 + 3)
    m2 = fbm(P * 60 + 9)
    poro = fbm(P * 900 + 1, 2)
    R = .82 + (m1 - .5) * .22 + (m2 - .5) * .1 - (poro > .62) * .06
    # pálpebras e olheiras mais escuras; dobras dos dedos
    dE = np.sqrt(((np.abs(P[:, 0]) - abs(eL[0])) / .022) ** 2 + ((P[:, 1] - eL[1] + .004) / .014) ** 2) * (P[:, 2] > eL[2] - .03)
    R -= .12 * np.exp(-dE ** 2) * (P[:, 2] > eL[2] - .03)
    # --- G: lábios (máscara oficial em UV)
    lab = np.asarray(Image.open(f'{base.MPFB}/textures/mpfb_lips.jpg').convert('L').resize((TAM, TAM), Image.BILINEAR), np.float32) / 255
    G = lab.reshape(-1)
    # --- B: sobrancelhas, fio a fio
    dx = np.abs(P[:, 0]) - abs(eL[0])
    arco = eL[1] + .0215 - 6 * np.maximum(dx, 0) ** 2 + .25 * np.minimum(dx, 0) ** 2 * 10
    esp = .0062 * (1 - .5 * ss(-.01, .03, dx))
    regiao = np.exp(-((P[:, 1] - arco) / esp) ** 2) * ss(-.024, -.014, dx) * (1 - ss(.026, .037, dx)) * (P[:, 2] > eL[2] - .02) * (np.abs(P[:, 1] - eL[1]) < .05)
    # fios: listras finas inclinadas (para fora e para cima)
    ang = np.where(dx < -.008, 1.2, .35)
    u = (dx * np.cos(ang) + (P[:, 1] - arco) * np.sin(ang)) * 2600 * np.sign(P[:, 0] + 1e-9)
    fios = np.clip(np.sin(u + fbm(P * 300) * 6) * .5 + .5, 0, 1) ** 3
    B = np.clip(regiao * (.35 + .9 * fios) * (.7 + .5 * fbm(P * 120)), 0, 1)
    # --- A: barba (pontos de folículo; a região vem por vértice)
    fol = fbm(P * 1400 + 5, 2)
    A = np.clip((fol - .45) * 4, 0, 1) * .85 + .15
    img = np.stack([R, G, B, A], 1).reshape(TAM, TAM, 4)
    img[~ok] = [.82, 0, 0, 0]
    # dilata 4 px para não dar costura no mipmap
    for _ in range(4):
        cheio = ok.copy()
        for dy, dx_ in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            sh = np.roll(np.roll(img, dy, 0), dx_, 1)
            sok = np.roll(np.roll(ok, dy, 0), dx_, 1)
            novo = sok & ~cheio
            img[novo] = sh[novo]
            cheio |= novo
        ok = cheio
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA').save(f'{SAIDA}/pele.png', optimize=True)

    # --- poros: mapa normal repetível (256)
    def normal_rep(h, k):
        gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * k
        gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * k
        n = np.stack([-gx, gy, np.ones_like(h)], -1)
        n /= np.linalg.norm(n, axis=-1, keepdims=True)
        return ((n * .5 + .5) * 255).astype(np.uint8)
    t = 256
    yy, xx = np.mgrid[0:t, 0:t] / t

    def per(fx, fy, sd):  # ruído periódico
        r = np.random.default_rng(sd)
        out = np.zeros((t, t))
        for k in range(1, 7):
            for _ in range(6):
                a, b = r.integers(-k * 4, k * 4 + 1, 2)
                out += np.sin(2 * np.pi * (a * xx + b * yy) + r.random() * 6.28) / (k ** 1.2)
        return out
    h = per(1, 1, 5)
    h = (h - h.min()) / (h.max() - h.min())
    poros = np.zeros((t, t))
    for _ in range(900):
        cx, cy, r_ = rng.random(), rng.random(), .004 + rng.random() * .006
        d = np.sqrt(((xx - cx + .5) % 1 - .5) ** 2 + ((yy - cy + .5) % 1 - .5) ** 2)
        poros -= np.exp(-(d / r_) ** 2)
    alt = h * .4 + poros * .6
    Image.fromarray(normal_rep(alt, 3.0), 'RGB').save(f'{SAIDA}/poros.png', optimize=True)
    # trama de malha de algodão (jersey) e sarja (jeans) num só mapa: R,G normal de jersey; B,A normal da sarja? -> dois arquivos simples
    j = np.sin(2 * np.pi * xx * 48) * .5 + np.abs(np.sin(2 * np.pi * (yy * 64 + np.sin(2 * np.pi * xx * 48) * .25))) * .8
    Image.fromarray(normal_rep(j + per(1, 1, 8) * .02, 1.2), 'RGB').save(f'{SAIDA}/trama.png', optimize=True)
    s_ = np.sin(2 * np.pi * (xx * 40 + yy * 40)) + per(1, 1, 9) * .05
    Image.fromarray(normal_rep(s_, 1.0), 'RGB').save(f'{SAIDA}/sarja.png', optimize=True)
    print('ok')


main()
