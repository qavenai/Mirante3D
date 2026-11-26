"""Base humana MakeHuman (CC0, via pacote PyPI `anny`): malha, alvos de corpo, juntas, esqueleto e pesos.

Coordenadas de saída: metros, y para cima, +z para a frente (como no three.js), pés em y=0.
Uso: MPFB=/caminho/para/anny/data/mpfb2 python gera.py
"""
import os, gzip, json
import numpy as np

MPFB = os.environ.get('MPFB', '/tmp/pk/anny/anny/data/mpfb2')


def _obj():
    V, VT, F, FT, G = [], [], [], [], []
    grupo = None
    for ln in open(f'{MPFB}/3dobjs/base.obj'):
        if ln.startswith('v '):
            V.append([float(x) for x in ln.split()[1:4]])
        elif ln.startswith('vt '):
            VT.append([float(x) for x in ln.split()[1:3]])
        elif ln.startswith('g '):
            grupo = ln.split()[1]
        elif ln.startswith('f '):
            a = [p.split('/') for p in ln.split()[1:]]
            F.append([int(p[0]) - 1 for p in a])
            FT.append([int(p[1]) - 1 for p in a])
            G.append(grupo)
    return np.array(V) * .1, np.array(VT), F, FT, G


V0, VT, FACES, FACES_UV, FGRUPO = _obj()
NV = len(V0)
_vg = json.load(open(f'{MPFB}/mesh_metadata/basemesh_vertex_groups.json'))


def grupo_vertices(nome):
    out = []
    for a, b in _vg[nome]:
        out.extend(range(a, b + 1))
    return np.array(out, dtype=np.int64)


def faces_do_grupo(nome):
    return [i for i, g in enumerate(FGRUPO) if g == nome]


# ---------------- alvos (macrodetalhes) ----------------
_cache = {}


def alvo(rel):
    if rel in _cache:
        return _cache[rel]
    p = f'{MPFB}/targets/{rel}.target.gz'
    idx, d = [], []
    with gzip.open(p, 'rt') as f:
        for ln in f:
            if not ln.strip() or ln.startswith('#'):
                continue
            s = ln.split()
            idx.append(int(s[0]))
            d.append([float(s[1]), float(s[2]), float(s[3])])
    r = (np.array(idx, dtype=np.int64), np.array(d, dtype=np.float64).reshape(-1, 3) * .1)
    _cache[rel] = r
    return r


def _par(v, nomes):
    """v em [0,1] -> pesos para (baixo, médio, alto) com 0.5 = médio"""
    if v < .5:
        return {nomes[0]: 1 - v / .5, nomes[1]: v / .5}
    return {nomes[1]: 1 - (v - .5) / .5, nomes[2]: (v - .5) / .5}


def _idade(a):
    if a < .1875:
        return {'baby': 1 - a / .1875, 'child': a / .1875}
    if a < .5:
        t = (a - .1875) / (.5 - .1875)
        return {'child': 1 - t, 'young': t}
    t = (a - .5) / .5
    return {'young': 1 - t, 'old': t}


def corpo(genero=.5, idade=.5, musculo=.5, peso=.5, altura=.5, proporcao=.5, africano=1., asiatico=0., europeu=0.):
    """Aplica os alvos macro do MakeHuman e devolve as posições de todos os vértices (inclui ajudantes)."""
    V = V0.copy()
    gen = {'female': 1 - genero, 'male': genero}
    ida = _idade(idade)
    mus = _par(musculo, ['minmuscle', 'averagemuscle', 'maxmuscle'])
    pes = _par(peso, ['minweight', 'averageweight', 'maxweight'])
    s = africano + asiatico + europeu
    raca = {'african': africano / s, 'asian': asiatico / s, 'caucasian': europeu / s}

    def soma(rel, w):
        if w < 1e-4:
            return
        try:
            i, d = alvo(rel)
        except FileNotFoundError:
            return
        V[i] += d * w
    for r, wr in raca.items():
        for g, wg in gen.items():
            for a, wa in ida.items():
                soma(f'macrodetails/{r}-{g}-{a}', wr * wg * wa)
    for g, wg in gen.items():
        for a, wa in ida.items():
            for m, wm in mus.items():
                for p, wp in pes.items():
                    soma(f'macrodetails/universal-{g}-{a}-{m}-{p}', wg * wa * wm * wp)
                    if altura < .5:
                        soma(f'macrodetails/height/{g}-{a}-{m}-{p}-minheight', wg * wa * wm * wp * (1 - altura / .5))
                    else:
                        soma(f'macrodetails/height/{g}-{a}-{m}-{p}-maxheight', wg * wa * wm * wp * (altura - .5) / .5)
                    if proporcao < .5:
                        soma(f'macrodetails/proportions/{g}-{a}-{m}-{p}-uncommonproportions', wg * wa * wm * wp * (1 - proporcao / .5))
                    else:
                        soma(f'macrodetails/proportions/{g}-{a}-{m}-{p}-idealproportions', wg * wa * wm * wp * (proporcao - .5) / .5)
    return V


# ---------------- esqueleto ----------------
RIG = json.load(open(f'{MPFB}/rigs/standard/rig.game_engine.json'))
_pesos = json.load(open(f'{MPFB}/rigs/standard/weights.game_engine.json'))['weights']


def _ordem():
    feitos, ordem = set(), []
    while len(ordem) < len(RIG):
        for b, d in RIG.items():
            if b in feitos:
                continue
            if d['parent'] == '' or d['parent'] in feitos:
                ordem.append(b)
                feitos.add(b)
    return ordem


OSSOS = _ordem()
PAI = [OSSOS.index(RIG[b]['parent']) if RIG[b]['parent'] else -1 for b in OSSOS]


def _ponto(V, d):
    if d['strategy'] == 'CUBE':
        return V[grupo_vertices(d['cube_name'])].mean(0)
    return V[d['vertex_indices']].mean(0)


def juntas(V):
    H = np.array([_ponto(V, RIG[b]['head']) for b in OSSOS])
    T = np.array([_ponto(V, RIG[b]['tail']) for b in OSSOS])
    return H, T


def pesos4():
    """4 maiores influências por vértice (índices em OSSOS), normalizadas."""
    W = np.zeros((NV, len(OSSOS)), np.float32)
    for b, l in _pesos.items():
        if not l:
            continue
        j = OSSOS.index(b)
        a = np.array(l)
        W[a[:, 0].astype(int), j] = a[:, 1]
    idx = np.argsort(-W, axis=1)[:, :4]
    w = np.take_along_axis(W, idx, 1)
    s = w.sum(1, keepdims=True)
    s[s == 0] = 1
    w = w / s
    idx[w == 0] = 0
    return idx.astype(np.uint8), w.astype(np.float32)


IDX4, W4 = pesos4()


def para_chao(V):
    """desloca para os pés tocarem y=0 (usa os vértices do corpo)"""
    body = grupo_vertices('body')
    V = V.copy()
    V[:, 1] -= V[body, 1].min()
    return V
