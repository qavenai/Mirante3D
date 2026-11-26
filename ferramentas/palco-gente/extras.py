"""Cabelos com geometria própria (coque, boné, tranças) e objetos de mão (celular, copo, microfone)."""
import math
import numpy as np
import gera
from gera import Peca, MAT, OB, ss, normais, so_osso, grupo_vertices, tranca


def esfera(c, r, nu=12, nv=8, esc=(1, 1, 1)):
    V, F = [], []
    for i in range(nv + 1):
        th = math.pi * i / nv
        for k in range(nu):
            ph = 2 * math.pi * k / nu
            V.append(c + np.array([math.sin(th) * math.cos(ph) * esc[0], math.cos(th) * esc[1], math.sin(th) * math.sin(ph) * esc[2]]) * r)
    for i in range(nv):
        for k in range(nu):
            a, b = i * nu + k, i * nu + (k + 1) % nu
            F.append([a, b, b + nu, a + nu])
    return np.array(V), F


def cilindro(a, b, r0, r1, n=12, tampa=True):
    d = b - a
    L = np.linalg.norm(d)
    t = d / L
    u = np.cross(t, [0, 1, 0] if abs(t[1]) < .9 else [1, 0, 0])
    u /= np.linalg.norm(u)
    w = np.cross(t, u)
    V, F = [], []
    for j, (p, r) in enumerate([(a, r0), (b, r1)]):
        for k in range(n):
            ang = 2 * math.pi * k / n
            V.append(p + (u * math.cos(ang) + w * math.sin(ang)) * r)
    for k in range(n):
        F.append([k, (k + 1) % n, n + (k + 1) % n, n + k])
    if tampa:
        V.append(a)
        V.append(b)
        for k in range(n):
            F.append([2 * n, (k + 1) % n, k])
            F.append([2 * n + 1, n + k, n + (k + 1) % n])
    return np.array(V), F


def caixa(c, eixos, meio):
    """caixa orientada: eixos (3x3, linhas unitárias), meio = meias medidas"""
    V = []
    for sx in (-1, 1):
        for sy in (-1, 1):
            for sz in (-1, 1):
                V.append(c + eixos[0] * meio[0] * sx + eixos[1] * meio[1] * sy + eixos[2] * meio[2] * sz)
    F = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]
    return np.array(V), F


def extra_cabelo(V, H, estilo, cap, rng):
    """cap: (vs, fs, P) da calota. Devolve Pecas adicionais (coque, aba do boné, tranças)"""
    out = []
    olho = V[grupo_vertices('joint-l-eye')].mean(0)
    topo = V[grupo_vertices('joint-head-2')].mean(0)
    cab = H[OB['head']]
    if estilo == 'coque':
        c = np.array([0, topo[1] + .005, cab[2] - .06])
        Vb, Fb = esfera(c, .048, 14, 10, (1, .85, 1))
        Vb += (gera.fbm(Vb * 60) - .5)[:, None] * .006
        i4, w4 = so_osso(len(Vb), 'head')
        mk = np.zeros((len(Vb), 6), np.float32)
        mk[:, 0] = 1
        out.append(Peca(Vb, Fb, np.zeros((len(Vb), 2)), i4, w4, MAT['cabelo'], mk, 'cabelo'))
    if estilo == 'bone':
        # aba: placa curva na frente, na altura da testa
        Pc = cap[2]
        fr = Pc[Pc[:, 2] > Pc[:, 2].max() - .03]
        y0 = fr[:, 1].min() + .006
        z0 = Pc[np.abs(Pc[:, 1] - y0) < .02][:, 2].max() - .012
        nu, nv = 8, 4
        Vv, Fv = [], []
        for i in range(nv + 1):
            for k in range(nu + 1):
                x = (k / nu - .5) * .19
                z = z0 + i / nv * .075
                y = y0 - .012 * (i / nv) - 18 * x * x * .1 + .0
                Vv.append([x * (1 - .25 * i / nv), y, z - 30 * x * x * .05])
        for i in range(nv):
            for k in range(nu):
                a = i * (nu + 1) + k
                Fv.append([a, a + 1, a + nu + 2, a + nu + 1])
        Vv = np.array(Vv)
        # espessura: duplica com deslocamento
        n = len(Vv)
        V2 = np.concatenate([Vv, Vv - [0, .006, 0]])
        F2 = Fv + [[f[0] + n, f[3] + n, f[2] + n, f[1] + n] for f in Fv]
        i4, w4 = so_osso(len(V2), 'head')
        out.append(Peca(V2, F2, np.zeros((len(V2), 2)), i4, w4, MAT['bone'], None, 'aba'))
    if estilo == 'trancas':
        vs, fs, P = cap
        Ns = normais(P, fs)
        c = np.array([0, olho[1] + .01, cab[2] - .01])
        Rh = np.linalg.norm(P - c, axis=1).max() + .012
        pesc = H[OB['neck_01']]
        # raízes espalhadas pela calota
        idx = rng.permutation(len(P))
        raizes = []
        for i in idx:
            if all(np.linalg.norm(P[i] - P[j]) > .02 for j in raizes):
                raizes.append(i)
            if len(raizes) >= 72:
                break
        Vt, Ft, Tt = [], [], []
        baixo = np.array([0, -1., 0])
        for i in raizes:
            comp = .26 + rng.random() * .12
            n = 12
            seg = comp / n
            pts = [P[i] - Ns[i] * .001]
            d = Ns[i].copy()
            # risca: as da frente vão para o lado e para trás (não cobrem o rosto)
            if P[i, 2] > c[2] + .02:
                d = d + np.array([np.sign(P[i, 0] + 1e-6) * 1.2, 0, -.6])
                d /= np.linalg.norm(d)
            for k in range(n):
                d = d * (.55 if k > 1 else .8) + baixo * (.45 if k > 1 else .2)
                d /= np.linalg.norm(d)
                q = pts[-1] + d * seg
                # colisão: cabeça (esfera) e pescoço/ombros (elipse em volta da coluna)
                v = q - c
                if np.linalg.norm(v) < Rh:
                    q = c + v / np.linalg.norm(v) * Rh
                if q[1] < c[1] - .06:
                    e = np.array([q[0] / .1, 0, (q[2] - pesc[2] + .01) / .085])
                    if q[1] < pesc[1] - .02:
                        e = np.array([q[0] / .21, 0, (q[2] - pesc[2] + .01) / .13])
                    l = np.linalg.norm(e)
                    if l < 1:
                        if l < 1e-4:
                            e = np.array([0, 0, -1.])
                            l = 1e-4
                        q[0] /= l
                        q[2] = pesc[2] - .01 + (q[2] - pesc[2] + .01) / l
                d = (q - pts[-1]) / max(np.linalg.norm(q - pts[-1]), 1e-6)
                pts.append(q)
            pts = np.array(pts)
            v, f, t = tubo_pts(pts, .0056, 5)
            base_ = len(Vt)
            Vt.extend(v)
            Ft.extend([[base_ + k for k in ff] for ff in f])
            Tt.extend(t)
        Vt = np.array(Vt)
        Tt = np.array(Tt)
        i4 = np.zeros((len(Vt), 4), np.uint8)
        w4 = np.zeros((len(Vt), 4), np.float32)
        i4[:, 0], i4[:, 1], i4[:, 2] = OB['head'], OB['neck_01'], OB['spine_03']
        k = ss(.25, .8, Tt)
        w4[:, 0] = 1 - k
        w4[:, 1] = k * .35
        w4[:, 2] = k * .65
        mk = np.zeros((len(Vt), 6), np.float32)
        mk[:, 1] = 1
        out.append(Peca(Vt, Ft, np.zeros((len(Vt), 2)), i4, w4, MAT['cabelo'], mk, 'trancas'))
    return out


def tubo_pts(pts, raio, lados):
    n = len(pts) - 1
    V, F, T = [], [], []
    for i, p in enumerate(pts):
        t = pts[min(i + 1, n)] - pts[max(i - 1, 0)]
        t /= np.linalg.norm(t) + 1e-9
        a = np.cross(t, [0, 0, 1])
        if np.linalg.norm(a) < .1:
            a = np.cross(t, [1, 0, 0])
        a /= np.linalg.norm(a)
        b = np.cross(t, a)
        rr = raio * (1 - .35 * i / n)
        for k in range(lados):
            ang = 2 * np.pi * k / lados + i * 1.1
            V.append(p + (a * np.cos(ang) + b * np.sin(ang)) * rr)
            T.append(i / n)
    for i in range(n):
        for k in range(lados):
            a0, a1 = i * lados + k, i * lados + (k + 1) % lados
            F.append([a0, a1, a1 + lados, a0 + lados])
    V.append(pts[-1] + (pts[-1] - pts[-2]) * .25)
    T.append(1.)
    tip = len(V) - 1
    for k in range(lados):
        F.append([n * lados + k, n * lados + (k + 1) % lados, tip])
    return np.array(V), F, T


def palma(V, H, lado='r'):
    """centro da palma, normal da palma e direção dos dedos (pose de repouso)"""
    h = H[OB['hand_' + lado]]
    m = H[OB['middle_01_' + lado]]
    dedos = m - h
    dedos /= np.linalg.norm(dedos)
    # normal da palma: média das normais dos vértices marcados como palma
    vs = grupo_vertices('body')
    dom = gera.IDX4[vs, 0]
    mao = np.isin(dom, [OB['hand_' + lado]])
    N = normais(V, [gera.FACES[i] for i in gera.BODY_F])[vs]
    s = 1 if lado == 'l' else -1
    cand = mao & ((-N[:, 0] * s) > .3)
    n = N[cand].mean(0) if cand.any() else np.array([s * -1., 0, 0])
    n -= dedos * (n @ dedos)
    n /= np.linalg.norm(n)
    c = h + (m - h) * .55 + n * .018
    return c, n, dedos


def objetos_mao(V, H):
    """celular, copo e microfone na mão direita"""
    c, n, d = palma(V, H, 'r')
    lat = np.cross(n, d)
    out = {}
    # celular: costas na palma, tela para fora (normal da palma), comprimento ao longo dos dedos
    cc = c + n * .012 + d * .01
    Vc, Fc = caixa(cc, np.array([lat, d, n]), [.036, .075, .0045])
    i4, w4 = so_osso(len(Vc), 'hand_r')
    mat = np.full(len(Vc), MAT['celular'], np.uint8)
    pc = Peca(Vc, Fc, np.zeros((len(Vc), 2)), i4, w4, mat, None, 'celular')
    # tela: placa logo acima da face externa
    Vt, Ft = caixa(cc + n * .0048, np.array([lat, d, n]), [.033, .071, .0003])
    i5, w5 = so_osso(len(Vt), 'hand_r')
    out['celular'] = [pc, Peca(Vt, Ft, np.zeros((len(Vt), 2)), i5, w5, MAT['tela'], None, 'tela')]
    # copo: eixo perpendicular aos dedos e à normal (a mão abraça o copo)
    eixo = lat
    cc = c + n * .042
    Vg, Fg = cilindro(cc - eixo * .055, cc + eixo * .06, .034, .041, 14)
    i4, w4 = so_osso(len(Vg), 'hand_r')
    out['copo'] = [Peca(Vg, Fg, np.zeros((len(Vg), 2)), i4, w4, MAT['copo'], None, 'copo')]
    # microfone: cabo na mão, cápsula para cima
    cc = c + n * .028
    a, b = cc - eixo * .07, cc + eixo * .1
    Vm, Fm = cilindro(a, b, .014, .02, 10)
    Vs, Fs = esfera(b + eixo * .02, .028, 10, 8)
    Fs = [[k + len(Vm) for k in f] for f in Fs]
    Vm = np.concatenate([Vm, Vs])
    mat = np.concatenate([np.full(len(Vm) - len(Vs), MAT['celular']), np.full(len(Vs), MAT['detalhe'])]).astype(np.uint8)
    i4, w4 = so_osso(len(Vm), 'hand_r')
    out['mic'] = [Peca(Vm, Fm + Fs, np.zeros((len(Vm), 2)), i4, w4, mat, None, 'mic')]
    return out
