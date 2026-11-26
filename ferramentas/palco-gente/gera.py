"""Gera as pessoas do palco "Castelos & Ruínas" a partir da base MakeHuman (CC0).

Para cada variante: corpo com proporções próprias, roupa com caimento e dobras (feita sobre a malha
auxiliar "tights" e subdividida no Blender), tênis, cabelo com volume, olhos, cílios e máscaras de pele.
Saída: geometria em 3 níveis de detalhe (hi/mid/lo) com esqueleto de 53 ossos e pesos, em binário.

Rodar com o Python do bpy:  /opt/bvenv/bin/python gera.py <saida>
"""
import sys, os, json, struct, gzip, math
import numpy as np
from scipy.spatial import cKDTree
import base
from base import V0, FACES, FGRUPO, FACES_UV, VT, OSSOS, IDX4, W4, grupo_vertices

OB = {b: i for i, b in enumerate(OSSOS)}

# ------------------------------------------------------------ material por vértice
MAT = dict(pele=0, top=1, baixo=2, tenis=3, sola=4, cabelo=5, olho=6, cilio=7, bone=8, celular=9, tela=10, copo=11, detalhe=12, meia=13)


def normais(V, faces):
    N = np.zeros_like(V)
    for f in faces:
        a, b, c = V[f[0]], V[f[1]], V[f[2]]
        n = np.cross(b - a, c - a)
        if len(f) == 4:
            n = n + np.cross(c - a, V[f[3]] - a)
        for i in f:
            N[i] += n
    l = np.linalg.norm(N, axis=1, keepdims=True)
    l[l == 0] = 1
    return N / l


def adj(faces, n):
    A = [set() for _ in range(n)]
    for f in faces:
        for i in range(len(f)):
            a, b = f[i], f[(i + 1) % len(f)]
            A[a].add(b)
            A[b].add(a)
    return A


def erode(mask, A, k):
    m = mask.copy()
    for _ in range(k):
        nm = m.copy()
        for i in np.where(m)[0]:
            if any(not m[j] for j in A[i]):
                nm[i] = False
        m = nm
    return m


def ss(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# ruído 3D de valor (para dobras e cabelo)
_P = np.random.default_rng(7).random(256 ** 1 * 4096)


def vnoise(p):
    p = np.asarray(p, dtype=np.float64)
    i = np.floor(p).astype(np.int64)
    f = p - i
    u = f * f * (3 - 2 * f)

    def h(x, y, z):
        return _P[((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % len(_P)]
    x, y, z = i[:, 0], i[:, 1], i[:, 2]
    r = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (u[:, 0] if dx else 1 - u[:, 0]) * (u[:, 1] if dy else 1 - u[:, 1]) * (u[:, 2] if dz else 1 - u[:, 2])
                r = r + w * h(x + dx, y + dy, z + dz)
    return r


def fbm(p, o=4):
    s, a = 0, .5
    for _ in range(o):
        s = s + a * vnoise(p)
        p = p * 2.03 + 17.1
        a *= .5
    return s


# ------------------------------------------------------------ peças
class Peca:
    """malha com atributos por vértice: posição, uv, pesos (idx/w 4), material, máscaras (4 bytes extras)"""

    def __init__(self, V, F, UV, idx, w, mat, mk=None, nome=''):
        self.V, self.F, self.UV, self.idx, self.w = V, F, UV, idx, w
        self.mat = np.full(len(V), mat, np.uint8) if np.isscalar(mat) else mat.astype(np.uint8)
        self.mk = mk if mk is not None else np.zeros((len(V), 6), np.float32)
        self.nome = nome


def sub_malha(faces, keep_v=None):
    """reindexa um conjunto de faces da base"""
    vs = sorted({i for f in faces for i in f})
    mp = {v: k for k, v in enumerate(vs)}
    return np.array(vs), [[mp[i] for i in f] for f in faces]


def uv_vertice(fids):
    """uv por vértice (primeiro canto encontrado)"""
    uv = {}
    for fi in fids:
        for v, t in zip(FACES[fi], FACES_UV[fi]):
            uv.setdefault(v, VT[t])
    return uv


# máscaras em espaço UV do MakeHuman
def _mascara(nome):
    from PIL import Image
    im = np.asarray(Image.open(f'{base.MPFB}/textures/mpfb_{nome}.jpg').convert('L'), np.float32) / 255
    return im


_MK = {}


def amostra_uv(nome, uv):
    if nome not in _MK:
        _MK[nome] = _mascara(nome)
    im = _MK[nome]
    h, w = im.shape
    x = np.clip((uv[:, 0] * (w - 1)).astype(int), 0, w - 1)
    y = np.clip(((1 - uv[:, 1]) * (h - 1)).astype(int), 0, h - 1)
    return im[y, x]


BODY_F = [i for i, g in enumerate(FGRUPO) if g == 'body']
TIGHTS_F = [i for i, g in enumerate(FGRUPO) if g == 'helper-tights']
HAIR_F = [i for i, g in enumerate(FGRUPO) if g == 'helper-hair']
LASH_F = [i for i, g in enumerate(FGRUPO) if g and g.startswith('helper-') and 'eyelashes' in g]
_uvb = uv_vertice(BODY_F)
BODY_UV = np.array([_uvb.get(i, (0, 0)) for i in range(base.NV)])


# ------------------------------------------------------------ roupas
def seg_t(P, a, b):
    d = b - a
    return ((P - a) @ d) / (d @ d)


def veste(V, H, T, roupa, rng, TS):
    """TS: malha auxiliar "tights" já subdividida (P, F, idx, w). Devolve as peças e os vértices cobertos"""
    P, tf, tidx, tw = TS
    tv = None
    N = normais(P, tf)
    dom = np.array([OSSOS[i] for i in tidx[:, 0]])
    j = lambda b: H[OB[b]]
    y = P[:, 1]
    neck = j('neck_01')
    pelv = j('pelvis')
    sp3 = j('spine_03')
    kneeL, kneeR = j('calf_l'), j('calf_r')
    ankL = j('foot_l')
    perna_t = np.where(P[:, 0] > 0, 0, 0)  # placeholder

    tronco = np.isin(dom, ['spine_01', 'spine_02', 'spine_03', 'clavicle_l', 'clavicle_r', 'pelvis', 'neck_01'])
    braco = np.isin(dom, ['upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r'])
    perna = np.isin(dom, ['thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'pelvis'])
    pe = np.isin(dom, ['foot_l', 'foot_r', 'ball_l', 'ball_r'])
    # parâmetro ao longo do braço (0 ombro, 1 cotovelo, 2 punho)
    tb = np.zeros(len(P))
    for s in 'lr':
        m = (P[:, 0] > 0) if s == 'l' else (P[:, 0] <= 0)
        S, E, W_ = j('upperarm_' + s), j('lowerarm_' + s), j('hand_' + s)
        t1 = seg_t(P, S, E)
        t2 = 1 + seg_t(P, E, W_)
        tb = np.where(m, np.where(t1 < 1, t1, t2), tb)
    pecas, cobre = [], np.zeros(len(P), bool)
    top, baixo = roupa['top'], roupa['baixo']

    # ---- parte de cima
    if top:
        ombro_y = (j('upperarm_l')[1])
        manga = {'tee': .62, 'oversize': .95, 'regata': .03, 'cropped': .45, 'xadrez': 1.95, 'longa': 1.92, 'jersey': .55}[top]
        bainha = {'tee': pelv[1] - .13, 'oversize': pelv[1] - .2, 'regata': pelv[1] - .12, 'cropped': sp3[1] - .1, 'xadrez': pelv[1] - .16, 'longa': pelv[1] - .12, 'jersey': pelv[1] - .14}[top]
        m = (tronco | braco | perna) & (y > bainha)
        # gola: frente mais baixa
        frente = P[:, 2] > neck[2]
        gola = neck[1] - (.055 if top in ('regata', 'jersey') else .035) * frente - (.012 if not frente.any() else 0)
        gola = np.where(frente, neck[1] - (.06 if top == 'regata' else .028), neck[1] + .005)
        m &= y < gola
        # mangas
        if manga < 0:  # regata: cava funda
            m &= ~(braco | ((np.abs(P[:, 0]) > np.abs(j('clavicle_l')[0]) + .085) & (y > sp3[1] - .07)))
        else:
            m &= ~(braco & (tb > manga))
        loose = {'tee': .022, 'oversize': .04, 'regata': .012, 'cropped': .006, 'xadrez': .03, 'longa': .02, 'jersey': .03}[top]
        pecas.append(('top', m, loose, top))
        cobre |= m
    # ---- parte de baixo
    if baixo:
        cint = pelv[1] + (.045 if baixo != 'saia' else .06)
        if top and top != 'cropped':
            cint = min(cint, bainha + .06)
        if baixo in ('jeans', 'cargo', 'jogger'):
            fim = ankL[1] + .03
        elif baixo == 'bermuda':
            fim = kneeL[1] - .07
        elif baixo == 'short':
            fim = kneeL[1] + .13
        elif baixo == 'bike':
            fim = kneeL[1] + .1
        else:
            fim = kneeL[1] + .05
        m = (perna | tronco) & (y < cint) & (y > fim) & ~braco
        loose = {'jeans': .012, 'cargo': .03, 'jogger': .02, 'bermuda': .03, 'short': .02, 'bike': .003, 'saia': .04}[baixo]
        pecas.append(('baixo', m, loose, baixo))
        cobre |= m
    # ---- tênis (cano baixo)
    m = (pe | (np.isin(dom, ['calf_l', 'calf_r']) & (y < ankL[1] + .035)))
    pecas.append(('tenis', m, .012, 'tenis'))
    cobre |= m
    # meia aparecendo entre a bermuda/short e o tênis (nada; pele)
    return tf, P, N, pecas, cobre, tb, braco


def drapeia(P, N, m, loose, tipo, H, tb, rng, braco=None):
    """afasta o tecido do corpo: folga + queda vertical abaixo do peito/quadril"""
    Q = P.copy()
    j = lambda b: H[OB[b]]
    sp = [j('pelvis'), j('spine_01'), j('spine_02'), j('spine_03'), j('neck_01')]
    ys = np.array([p[1] for p in sp])
    zs = np.array([p[2] for p in sp])
    off = loose + (.009 if tipo == 'top' else .006)
    Q[m] += N[m] * off
    if tipo in ('top',):
        # queda: no tronco, abaixo do peito, o raio horizontal não diminui
        cz = np.interp(Q[:, 1], ys, zs)
        tronco = m & ~braco
        d = np.stack([Q[:, 0], Q[:, 2] - cz], 1)
        r = np.linalg.norm(d, axis=1) + 1e-9
        th = np.arctan2(d[:, 1], d[:, 0])
        nb = 48
        b = ((th + np.pi) / (2 * np.pi) * nb).astype(int) % nb
        peito = j('spine_03')[1] + .01
        faixa = tronco & (np.abs(Q[:, 1] - peito) < .045)
        mx = np.zeros(nb)
        np.maximum.at(mx, b[faixa], r[faixa])
        # preenche/suaviza bins vazios
        for _ in range(3):
            mx = np.maximum(mx, .5 * (np.roll(mx, 1) + np.roll(mx, -1)) * .985)
        mx = (mx + np.roll(mx, 1) + np.roll(mx, -1)) / 3
        idx = np.where(tronco & (Q[:, 1] < peito))[0]
        k = ss(peito, peito - .14, Q[idx, 1])
        alvo = mx[b[idx]] * .985 + loose * .25 * ss(peito - .1, j('pelvis')[1] - .15, Q[idx, 1])
        nr = np.maximum(r[idx], r[idx] + (alvo - r[idx]) * k)
        Q[idx, 0] = d[idx, 0] / r[idx] * nr
        Q[idx, 2] = cz[idx] + d[idx, 1] / r[idx] * nr
    if tipo == 'baixo':
        # perna reta: do joelho para baixo o raio não estreita tanto
        for s in (1, -1):
            k = m & (np.sign(Q[:, 0]) == s)
            kn = j('calf_l' if s > 0 else 'calf_r')
            idx = np.where(k)[0]
            if not len(idx):
                continue
            c = np.array([kn[0], kn[2]])
            d = np.stack([Q[idx, 0], Q[idx, 2]], 1) - c
            r = np.linalg.norm(d, axis=1) + 1e-9
            abaixo = Q[idx, 1] < kn[1]
            rk = np.percentile(r[(np.abs(Q[idx, 1] - kn[1]) < .04)], 70) if (np.abs(Q[idx, 1] - kn[1]) < .04).any() else r.mean()
            nr = np.where(abaixo, np.maximum(r, rk * (.86 + loose * 2)), r)
            Q[idx, 0] = c[0] + d[:, 0] / r * nr
            Q[idx, 2] = c[1] + d[:, 1] / r * nr
    if tipo == 'tenis':
        # tênis: mais volume, sola plana
        Q[m] += N[m] * .006
        baixo = m & (Q[:, 1] < .045)
        Q[baixo, 1] = np.minimum(Q[baixo, 1], np.maximum(-.004, Q[baixo, 1] - .012))
        # alarga a biqueira
        frente = m & (Q[:, 1] < .07)
        Q[frente, 0] += np.sign(Q[frente, 0]) * .004
    return Q


def suaviza_borda(Q, gv, gf, it=6):
    """tira o serrilhado da borda recortada (gola, barra, manga): suaviza só os vértices de borda"""
    from collections import Counter
    ar = Counter()
    for f in gf:
        for i in range(len(f)):
            a, b = f[i], f[(i + 1) % len(f)]
            ar[(min(a, b), max(a, b))] += 1
    viz = {}
    for (a, b), c in ar.items():
        if c == 1:
            viz.setdefault(a, []).append(b)
            viz.setdefault(b, []).append(a)
    if not viz:
        return Q
    Q = Q.copy()
    loc = Q[gv]
    ks = np.array(list(viz.keys()))
    for _ in range(it):
        nv = loc.copy()
        for k in ks:
            nb = viz[k]
            nv[k] = loc[k] * .4 + loc[nb].mean(0) * .6
        loc = nv
    Q[gv] = loc
    return Q


def cil_uv(Q, H):
    """uv de tecido: projeção cilíndrica em metros (para padronagem e trama)"""
    th = np.arctan2(Q[:, 0], Q[:, 2])
    return np.stack([th * .16, Q[:, 1]], 1)


# ------------------------------------------------------------ cabelo
def couro_cabeludo(V, H):
    """0..1 por vértice da base: região coberta pelo cabelo (linha da testa, têmporas, orelhas, nuca)"""
    P = V
    olho = V[grupo_vertices('joint-l-eye')].mean(0)
    cab = H[OB['head']]
    c = np.array([0, olho[1] + .01, cab[2] - .01])
    d = P - c
    r = np.linalg.norm(d, axis=1) + 1e-9
    dn = d / r[:, None]
    # linha do cabelo em função do ângulo em volta da cabeça (0 = testa, pi = nuca)
    phi = np.abs(np.arctan2(d[:, 0], d[:, 2]))
    lim = olho[1] + np.interp(phi, [0, .6, 1.0, 1.25, 1.6, 2.0, 2.4, np.pi], [.056, .05, .034, .02, .024, .0, -.06, -.08])
    dom = np.array([OSSOS[i] for i in IDX4[:, 0]])
    na_cabeca = (dom == 'head') & (r < .16)
    m = na_cabeca * ss(lim - .004, lim + .006, P[:, 1]) * (d[:, 1] > -.12)
    out = np.zeros(len(V))
    out[:len(m)] = m
    return out


def cabelo(V, H, estilo, rng):
    """casca do cabelo sobre a malha auxiliar helper-hair; devolve (V, F, w-idx, w) ou None"""
    if estilo in (None, '', 'raspado'):
        return None
    cab = H[OB['head']]
    olho = V[grupo_vertices('joint-l-eye')].mean(0)
    c = np.array([0, olho[1] + .015, cab[2] - .005])
    sc = couro_cabeludo(V, H)
    fs = [FACES[i] for i in BODY_F if all(sc[v] > .5 for v in FACES[i])]
    vs, fs = sub_malha(fs)
    P = V[vs].copy()
    P = suaviza_borda(P, np.arange(len(P)), fs, 4)
    Ns = normais(P, fs)
    # distância (em anéis) até a borda: o volume some na linha do cabelo
    A = adj(fs, len(P))
    from collections import Counter
    ar = Counter()
    for f in fs:
        for i in range(len(f)):
            a, b = f[i], f[(i + 1) % len(f)]
            ar[(min(a, b), max(a, b))] += 1
    dist = np.full(len(P), 99)
    fila = [v for (a, b), k in ar.items() if k == 1 for v in (a, b)]
    for v in fila:
        dist[v] = 0
    i = 0
    while i < len(fila):
        v = fila[i]
        i += 1
        for w_ in A[v]:
            if dist[w_] > dist[v] + 1:
                dist[w_] = dist[v] + 1
                fila.append(w_)
    borda = ss(0, 5, dist)
    d = P - c
    dn = d / np.linalg.norm(d, axis=1, keepdims=True)
    if estilo == 'curto':
        P += Ns * (.002 + .006 * borda)[:, None]
    elif estilo == 'black':
        vol = .055 + .02 * ss(-.2, .8, dn[:, 1]) - .03 * ss(.2, .9, dn[:, 2]) * (1 - ss(.3, .8, dn[:, 1]))
        vol *= ss(-.6, -.1, dn[:, 1] + .3 * (dn[:, 2] < 0))
        vol = np.maximum(vol, .012) * (.15 + .85 * borda)
        vol *= .9 + .2 * fbm(P * 40)
        P = P + dn * vol[:, None]
    elif estilo == 'coque':
        P += Ns * .004
    elif estilo == 'bone':
        P += Ns * .011
    elif estilo == 'trancas':
        P += Ns * .006
    else:
        P += Ns * .008
    return vs, fs, P


def tranca(raiz, dirc, comp, raio, n=10, lados=6, rng=None):
    pts = [raiz]
    v = dirc.copy()
    for i in range(n):
        v = v * .82 + np.array([0, -1, 0]) * .18
        v /= np.linalg.norm(v)
        pts.append(pts[-1] + v * comp / n)
    pts = np.array(pts)
    V, F = [], []
    for i, p in enumerate(pts):
        t = pts[min(i + 1, n)] - pts[max(i - 1, 0)]
        t /= np.linalg.norm(t)
        a = np.cross(t, [0, 0, 1])
        if np.linalg.norm(a) < .1:
            a = np.cross(t, [1, 0, 0])
        a /= np.linalg.norm(a)
        b = np.cross(t, a)
        rr = raio * (1 - .3 * i / n)
        for k in range(lados):
            ang = 2 * np.pi * k / lados + i * .9  # torção (aspecto trançado)
            V.append(p + (a * np.cos(ang) + b * np.sin(ang)) * rr)
    for i in range(n):
        for k in range(lados):
            a0, a1 = i * lados + k, i * lados + (k + 1) % lados
            F.append([a0, a1, a1 + lados, a0 + lados])
    V.append(pts[-1] + (pts[-1] - pts[-2]) * .3)
    tip = len(V) - 1
    for k in range(lados):
        F.append([n * lados + k, n * lados + (k + 1) % lados, tip])
    return np.array(V), F, np.linspace(0, 1, n + 1).repeat(lados).tolist() + [1.]


# ------------------------------------------------------------ montagem de uma pessoa
def mascaras_pele(V, H, vs):
    """[lábio, sobrancelha, palma, couro cabeludo, barba, unha] por vértice do corpo"""
    P = V[vs]
    uv = BODY_UV[vs]
    lab = amostra_uv('lips', uv)
    unha = np.maximum(amostra_uv('fingernails', uv), amostra_uv('toenails', uv))
    eL = V[grupo_vertices('joint-l-eye')].mean(0)
    boca = V[grupo_vertices('joint-mouth')].mean(0)
    cab = H[OB['head']]
    frente = P[:, 2] > eL[2] - .035
    dx = np.abs(P[:, 0]) - abs(eL[0])
    arco = eL[1] + .021 - 1.6 * np.maximum(dx, 0) ** 2 * 8 + .004 * (dx < 0) * dx / .02
    sob = np.exp(-((P[:, 1] - arco) / .0052) ** 2) * ss(-.024, -.012, dx) * (1 - ss(.026, .036, dx)) * frente
    sob *= (1 - ss(.0, .012, -dx - .012))
    # palma: mãos com normal virada para dentro (pose A)
    dom = np.array([OSSOS[i] for i in IDX4[vs, 0]])
    mao = np.array([('hand' in d) or any(k in d for k in ('thumb', 'index', 'middle', 'ring', 'pinky')) for d in dom])
    N = normais(V, [FACES[i] for i in BODY_F])[vs]
    lado = np.sign(P[:, 0])
    palma = mao * ss(.1, .55, -N[:, 0] * lado + -N[:, 1] * .3)
    # couro cabeludo (para cabelo raspado) a partir da calota auxiliar
    couro = couro_cabeludo(V, H)[vs]
    # barba: mandíbula, queixo e buço
    barba = ((P[:, 1] < boca[1] + .022) & (P[:, 1] > boca[1] - .085) & (P[:, 2] > cab[2] - .02)).astype(float)
    barba *= ss(.02, .045, np.abs(P[:, 0]) + (P[:, 1] - (boca[1] + .022)) * -.9 + .03)
    barba = np.clip(barba + (np.abs(P[:, 0]) < .02) * (P[:, 1] > boca[1] + .006) * (P[:, 1] < boca[1] + .02) * (P[:, 2] > boca[2] - .01), 0, 1)
    barba *= (1 - ss(.2, .5, lab))
    lado_rosto = (P[:, 1] > boca[1] - .02) & (P[:, 1] < eL[1] - .025) & (np.abs(P[:, 0]) > .045) & (P[:, 2] > cab[2] - .045)
    barba = np.maximum(barba, lado_rosto * ss(.045, .06, np.abs(P[:, 0])) * (1 - ss(eL[1] - .045, eL[1] - .025, P[:, 1])))
    return np.stack([lab, sob, palma, couro, barba, unha], 1).astype(np.float32)


def olho(V, lado):
    g = grupo_vertices(f'helper-{lado}-eye')
    c = V[g].mean(0)
    r = (V[g].max(0) - V[g].min(0)).mean() / 2 * .98
    nu, nv = 18, 12
    Vs, F, UV = [], [], []
    for i in range(nv + 1):
        th = math.pi * i / nv
        for k in range(nu + 1):
            ph = 2 * math.pi * k / nu
            d = np.array([math.sin(th) * math.sin(ph), math.cos(th), math.sin(th) * math.cos(ph)])
            Vs.append(c + d * r)
            # uv: (ângulo a partir do eixo +z) para desenhar íris/pupila
            ang = math.acos(max(-1, min(1, d[2])))
            UV.append([ang / math.pi, math.atan2(d[1], d[0]) / (2 * math.pi) + .5])
    for i in range(nv):
        for k in range(nu):
            a = i * (nu + 1) + k
            F.append([a, a + nu + 1, a + nu + 2, a + 1])
    return np.array(Vs), F, np.array(UV)


def so_osso(n, b):
    idx = np.zeros((n, 4), np.uint8)
    idx[:, 0] = OB[b]
    w = np.zeros((n, 4), np.float32)
    w[:, 0] = 1
    return idx, w


def pessoa(par, roupa, estilo, barba_on, seed, subdivide):
    """subdivide(P, F, idx, w) -> (P, F, idx, w): subdivisão da malha auxiliar (feita no Blender)"""
    rng = np.random.default_rng(seed)
    V = base.para_chao(base.corpo(**par))
    H, T = base.juntas(V)
    tv0, tf0 = sub_malha([FACES[i] for i in TIGHTS_F])
    TS = subdivide(V[tv0], tf0, IDX4[tv0], W4[tv0])
    tf, P, N, pecas_r, cobre, tb, braco = veste(V, H, T, roupa, rng, TS)
    tidx, tw = TS[2], TS[3]
    A = adj(tf, len(P))
    interior = erode(cobre, A, 2)
    bv_all = grupo_vertices('body')
    tr = cKDTree(P)
    d, k = tr.query(V[bv_all])
    esconde = np.zeros(base.NV, bool)
    esconde[bv_all] = interior[k] & (d < .035)
    bfaces = [FACES[i] for i in BODY_F if not all(esconde[v] for v in FACES[i])]
    vs, fs = sub_malha(bfaces)
    pecas = [Peca(V[vs], fs, BODY_UV[vs], IDX4[vs], W4[vs], MAT['pele'], mascaras_pele(V, H, vs), 'corpo')]
    for nome, m, loose, tipo in pecas_r:
        Q = drapeia(P, N, m, loose, nome, H, tb, rng, braco)
        ff = [f for f in tf if all(m[i] for i in f)]
        gv, gf = sub_malha(ff)
        Q = suaviza_borda(Q, gv, gf)
        mat = np.full(len(gv), MAT[nome] if nome != 'tenis' else MAT['tenis'], np.uint8)
        if nome == 'tenis':
            mat[Q[gv, 1] < .03] = MAT['sola']
        mk = np.zeros((len(gv), 6), np.float32)
        mk[:, 0] = np.clip(tb[gv] / 2.5, 0, 1)  # parâmetro do braço (dobras da manga)
        pc = Peca(Q[gv], gf, cil_uv(Q[gv], H), tidx[gv], tw[gv], mat, mk, nome)
        pc.tipo = tipo
        pecas.append(pc)
    # olhos e cílios
    for lado in 'lr':
        Vo, Fo, UVo = olho(V, lado)
        i4, w4 = so_osso(len(Vo), 'head')
        pecas.append(Peca(Vo, Fo, UVo, i4, w4, MAT['olho'], None, 'olho'))
    lv, lf = sub_malha([FACES[i] for i in LASH_F])
    pecas.append(Peca(V[lv], lf, np.zeros((len(lv), 2)), IDX4[lv], W4[lv], MAT['cilio'], None, 'cilio'))
    return V, H, T, pecas
