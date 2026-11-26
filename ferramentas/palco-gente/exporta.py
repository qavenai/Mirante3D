"""Exporta o elenco do palco: 12 pessoas do público + artista, com cabelos e objetos, em 3 níveis de detalhe.

  /opt/bvenv/bin/python exporta.py <pasta-saida> [--rapido]

Gera  gente.json (índice, esqueletos), gente-base.bin.gz (níveis médio e baixo) e gente-hi.bin.gz (nível alto).
"""
import sys, os, json, gzip, time
import numpy as np
import bpy
import gera, blend, extras
from gera import MAT, OSSOS, ss

SAIDA = sys.argv[1] if len(sys.argv) > 1 else 'saida'
RAPIDO = '--rapido' in sys.argv
os.makedirs(SAIDA, exist_ok=True)

# público de Salvador: maioria negra e parda, corpos e alturas variados
# (genero 0 = feminino; idade 0.5 ≈ 25 anos; africano/europeu/asiático = mistura das bases do MakeHuman)
VARIANTES = [
    ('f1', dict(genero=0, idade=.42, peso=.45, musculo=.45, altura=.45, proporcao=.6, africano=.85, europeu=.15), dict(top='cropped', baixo='jeans')),
    ('f2', dict(genero=0, idade=.5, peso=.7, musculo=.4, altura=.4, proporcao=.5, africano=.7, europeu=.3), dict(top='tee', baixo='bermuda')),
    ('f3', dict(genero=.05, idade=.55, peso=.55, musculo=.55, altura=.62, proporcao=.65, africano=.95, europeu=.05), dict(top='regata', baixo='short')),
    ('f4', dict(genero=0, idade=.47, peso=.35, musculo=.5, altura=.5, proporcao=.55, africano=.45, europeu=.5, asiatico=.05), dict(top='xadrez', baixo='jeans')),
    ('f5', dict(genero=0, idade=.62, peso=.8, musculo=.45, altura=.35, proporcao=.45, africano=.75, europeu=.25), dict(top='oversize', baixo='jogger')),
    ('f6', dict(genero=0, idade=.38, peso=.5, musculo=.6, altura=.55, proporcao=.6, africano=.6, europeu=.4), dict(top='jersey', baixo='bike')),
    ('m1', dict(genero=1, idade=.45, peso=.55, musculo=.6, altura=.55, proporcao=.55, africano=.8, europeu=.2), dict(top='tee', baixo='jeans')),
    ('m2', dict(genero=1, idade=.4, peso=.4, musculo=.5, altura=.68, proporcao=.6, africano=.95, europeu=.05), dict(top='oversize', baixo='bermuda')),
    ('m3', dict(genero=.95, idade=.55, peso=.75, musculo=.55, altura=.45, proporcao=.45, africano=.55, europeu=.45), dict(top='jersey', baixo='bermuda')),
    ('m4', dict(genero=1, idade=.5, peso=.45, musculo=.75, altura=.6, proporcao=.65, africano=.7, europeu=.3), dict(top='regata', baixo='cargo')),
    ('m5', dict(genero=1, idade=.66, peso=.62, musculo=.45, altura=.5, proporcao=.5, africano=.4, europeu=.55, asiatico=.05), dict(top='xadrez', baixo='jeans')),
    ('m6', dict(genero=.9, idade=.43, peso=.5, musculo=.5, altura=.42, proporcao=.55, africano=.85, europeu=.15), dict(top='longa', baixo='jogger')),
    # intérprete genérico (personagem próprio; não retrata ninguém)
    ('artista', dict(genero=1, idade=.5, peso=.5, musculo=.62, altura=.6, proporcao=.62, africano=.75, europeu=.2, asiatico=.05), dict(top='longa', baixo='cargo')),
]
if RAPIDO:
    VARIANTES = VARIANTES[:2] + VARIANTES[6:7]
ESTILOS = ['curto', 'black', 'coque', 'bone', 'trancas']
LOD_RATIO = {'mid': 3800, 'lo': 900}   # triângulos alvo (corpo + roupa)


# ------------------------------------------------------------ extração de arrays de um objeto do Blender
def arrays(ob):
    me = ob.data
    me.calc_loop_triangles()
    nv = len(me.vertices)
    P = blend.coords(ob)
    N = np.zeros(nv * 3)
    me.vertices.foreach_get('normal', N)
    N = N.reshape(-1, 3)
    idx, w = blend.pesos_de(ob)
    mk = np.stack([blend.grupo_arr(ob, f'mk{k}') for k in range(6)], 1)
    ao = np.ones(nv)
    if 'ao' in me.color_attributes:
        ca = me.color_attributes['ao']
        c = np.zeros(len(ca.data) * 4)
        ca.data.foreach_get('color', c)
        c = c.reshape(-1, 4)[:, 0]
        if ca.domain == 'POINT':
            ao = c
        else:
            li = np.zeros(len(me.loops), np.int64)
            me.loops.foreach_get('vertex_index', li)
            acc = np.zeros(nv)
            cnt = np.zeros(nv)
            np.add.at(acc, li, c)
            np.add.at(cnt, li, 1)
            ao = acc / np.maximum(cnt, 1)
    mats = [int(m.name[1:]) for m in me.materials]
    uvl = me.uv_layers[0].data if me.uv_layers else None
    chave = {}
    out_v = []
    tris = []
    for t in me.loop_triangles:
        mt = mats[t.material_index] if mats else 0
        tri = []
        for li in t.loops:
            vi = me.loops[li].vertex_index
            uv = tuple(np.round(uvl[li].uv, 4)) if uvl else (0, 0)
            k = (vi, mt, uv)
            if k not in chave:
                chave[k] = len(out_v)
                out_v.append(k)
            tri.append(chave[k])
        tris.append(tri)
    vi = np.array([k[0] for k in out_v])
    mt = np.array([k[1] for k in out_v], np.uint8)
    uv = np.array([k[2] for k in out_v], np.float32)
    return dict(P=P[vi], N=N[vi], uv=uv, idx=idx[vi], w=w[vi], mk=mk[vi], ao=ao[vi], mat=mt, F=np.array(tris, np.uint32))


def empacota(a):
    """32 bytes por vértice + índices"""
    n = len(a['P'])
    pos = np.clip(np.round(a['P'] * 10000), -32767, 32767).astype(np.int16)
    nrm = np.zeros((n, 4), np.int8)
    nrm[:, :3] = np.clip(np.round(a['N'] * 127), -127, 127)
    nrm = nrm.view(np.uint8)
    nrm[:, 3] = a['mat']
    uv = np.clip(np.round(a['uv'] * 8000), -32767, 32767).astype(np.int16)
    w = np.round(a['w'] * 255).astype(np.int32)
    # garante soma 255
    w[:, 0] += 255 - w.sum(1)
    w = np.clip(w, 0, 255).astype(np.uint8)
    mk = np.zeros((n, 8), np.uint8)
    mk[:, :6] = np.clip(np.round(a['mk'] * 255), 0, 255)
    mk[:, 6] = np.clip(np.round(a['ao'] * 255), 0, 255)
    vb = np.concatenate([pos.view(np.uint8).reshape(n, 6), nrm, uv.view(np.uint8).reshape(n, 4), a['idx'].astype(np.uint8), w, mk], 1)
    assert vb.shape[1] == 30
    ib = a['F'].astype(np.uint16 if n < 65536 else np.uint32)
    return vb.tobytes(), ib.tobytes(), n, len(a['F']) * 3, n >= 65536


class Arquivo:
    def __init__(self):
        self.buf = bytearray()

    def add(self, a):
        vb, ib, nv, ni, i32 = empacota(a)
        o = len(self.buf)
        self.buf += vb
        while len(self.buf) % 4:
            self.buf += b'\0'
        oi = len(self.buf)
        self.buf += ib
        while len(self.buf) % 4:
            self.buf += b'\0'
        return dict(v=o, nv=nv, i=oi, ni=ni, i32=i32)


def junta(obs, nome):
    bpy.ops.object.select_all(action='DESELECT')
    for o in obs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = obs[0]
    with bpy.context.temp_override(active_object=obs[0], selected_editable_objects=obs, selected_objects=obs):
        bpy.ops.object.join()
    obs[0].name = nome
    return obs[0]


def copia(ob, nome):
    o2 = ob.copy()
    o2.data = ob.data.copy()
    o2.name = nome
    bpy.context.scene.collection.objects.link(o2)
    return o2


def ntri(ob):
    ob.data.calc_loop_triangles()
    return len(ob.data.loop_triangles)


def dizima(ob, alvo):
    n = ntri(ob)
    if n > alvo:
        blend.aplica(ob, 'DECIMATE', ratio=max(.02, alvo / n), use_collapse_triangulate=True)
    return ob


def bake_ao(ob, samples):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.device = 'CPU'
    me = ob.data
    if 'ao' not in me.color_attributes:
        me.color_attributes.new('ao', 'FLOAT_COLOR', 'POINT')
    me.color_attributes.active_color = me.color_attributes['ao']
    for m in me.materials:
        if m and not m.use_nodes:
            m.use_nodes = True
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    sc.render.bake.target = 'VERTEX_COLORS'
    sc.world = sc.world or bpy.data.worlds.new('w')
    try:
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    except Exception as e:
        print('AO falhou', e)


def main():
    t0 = time.time()
    hi, bs = Arquivo(), Arquivo()
    indice = dict(ossos=OSSOS, pais=gera.base.PAI, escala_pos=1e-4, escala_uv=1 / 8000, bytes_vertice=30, mat=MAT, variantes=[])
    for vid, par, roupa in VARIANTES:
        blend.limpa()
        rng = np.random.default_rng(abs(hash(vid)) % 10000)
        V, H, T, pecas = gera.pessoa(par, roupa, None, False, 11, blend.subdivide)
        obs = []
        for pc in pecas:
            ob = blend.para_bpy(pc, pc.nome)
            if pc.nome in ('top', 'baixo', 'tenis'):
                blend.dobras(ob, pc.nome, 1, H, rng.integers(100))
                dizima(ob, int(ntri(ob) * (.5 if pc.nome == 'tenis' else .6)))
            obs.append(ob)
        corpo = junta(obs, 'pessoa')
        for p in corpo.data.polygons:
            p.use_smooth = True
        bake_ao(corpo, 8 if RAPIDO else 24)
        ent = dict(id=vid, par=par, roupa=roupa, H=np.round(H, 5).tolist(), T=np.round(T, 5).tolist(), lod={}, cabelo={}, obj={})
        ent['altura'] = float(V[gera.grupo_vertices('body'), 1].max())
        ent['lod']['hi'] = hi.add(arrays(corpo))
        ent['ntri'] = {'hi': ntri(corpo)}
        # nível médio e baixo: sem cílios
        for lod in ('mid', 'lo'):
            ob = copia(corpo, lod)
            # remove cílios e (no baixo) olhos
            import bmesh
            bm = bmesh.new()
            bm.from_mesh(ob.data)
            mats = [int(m.name[1:]) for m in ob.data.materials]
            fora = {MAT['cilio']} | ({MAT['olho']} if lod == 'lo' else set())
            bmesh.ops.delete(bm, geom=[f for f in bm.faces if mats[f.material_index] in fora], context='FACES')
            bm.to_mesh(ob.data)
            bm.free()
            dizima(ob, LOD_RATIO[lod])
            ent['lod'][lod] = bs.add(arrays(ob))
            ent['ntri'][lod] = ntri(ob)
        # cabelos (cada estilo ajustado a esta cabeça)
        for e in ESTILOS:
            cap = gera.cabelo(V, H, e, rng)
            vs, fs, P = cap
            mk = np.zeros((len(vs), 6), np.float32)
            mk[:, 0] = 1
            pcs = [gera.Peca(P, fs, np.zeros((len(vs), 2)), gera.IDX4[vs], gera.W4[vs], MAT['bone'] if e == 'bone' else MAT['cabelo'], mk, 'cabelo')]
            if e == 'trancas':
                pcs[0].V = P  # base rente
            pcs += extras.extra_cabelo(V, H, e, cap, rng)
            hobs = [blend.para_bpy(pc, pc.nome) for pc in pcs]
            for o in hobs:
                if o.name.startswith('cabelo') and e in ('black', 'curto', 'coque', 'bone'):
                    blend.aplica(o, 'SUBSURF', levels=1)
            hob = junta(hobs, 'cab_' + e)
            for p in hob.data.polygons:
                p.use_smooth = True
            ent['cabelo'][e] = {'hi': hi.add(arrays(hob))}
            dizima(hob, 900 if e == 'trancas' else 400)
            ent['cabelo'][e]['mid'] = bs.add(arrays(hob))
        # objetos de mão
        for nome, pcs in extras.objetos_mao(V, H).items():
            obo = junta([blend.para_bpy(pc, pc.nome) for pc in pcs], nome)
            ent['obj'][nome] = bs.add(arrays(obo))
        indice['variantes'].append(ent)
        print(vid, ent['ntri'], f'{time.time() - t0:.0f}s', flush=True)
    for nome, A in (('gente-hi.bin', hi), ('gente-base.bin', bs)):
        with gzip.open(f'{SAIDA}/{nome}.gz', 'wb', 9) as f:
            f.write(bytes(A.buf))
        print(nome, len(A.buf) // 1024, 'KB ->', os.path.getsize(f'{SAIDA}/{nome}.gz') // 1024, 'KB gz')
    json.dump(indice, open(f'{SAIDA}/gente.json', 'w'), separators=(',', ':'))
    print('ok', time.time() - t0)


main()
