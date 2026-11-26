"""Renders "foto" (Blender Cycles) do palco Castelos & Ruínas, montados a partir do mesmo projeto do palco web.

Entradas (geradas por exporta_cena.cjs): cena-<u>.json (poses, figurino, luzes) e led-<u>.png (conteúdo do LED).
Pessoas: public/tours/castelos-e-ruinas-palco/pessoas (mesmas malhas do web, posadas com a mesma textura de ossos).

  /opt/bvenv/bin/python render_cycles.py <pasta-cena> <saida> [universo 0|1|2] [camera ponto|pista|drone] [amostras] [largura altura]
"""
import sys, os, json, gzip, math, base64
import numpy as np
import bpy, bmesh, mathutils

AQUI = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(AQUI, '..', '..', 'public', 'tours', 'castelos-e-ruinas-palco')
CENA, SAIDA = sys.argv[1], sys.argv[2]
U = int(sys.argv[3]) if len(sys.argv) > 3 else 0
CAM = sys.argv[4] if len(sys.argv) > 4 else 'ponto'
AMOSTRAS = int(sys.argv[5]) if len(sys.argv) > 5 else 96
RES = (int(sys.argv[6]), int(sys.argv[7])) if len(sys.argv) > 7 else ((600, 928) if CAM == 'artista' else (1600, 900))
os.makedirs(SAIDA, exist_ok=True)

H, YC, YC_PANO = 2.0, 18.5, 19
LEDC = dict(x0=-10, x1=10, y0=2.6, y1=12.6, z=-13.2)
ESC = dict(w=6, z0=-2.6, z1=-10, n=16, topo=H + 5, zTopo=-12.9)
LATD = dict(w=6.6, h=10.2, y0=3.4, z=-5)
PONTO = (0, 4.2, 32)
UNIV = [dict(fum=(.43, .40, .78), fumD=.010, hemi=(.23, .25, .4)), dict(fum=(.7, .33, .16), fumD=.008, hemi=(.29, .16, .12)), dict(fum=(.78, .57, .23), fumD=.008, hemi=(.29, .23, .12))][U]

cena = json.load(open(f'{CENA}/cena-{U}.json'))
GJ = json.load(open(f'{PUB}/pessoas/gente.json'))
GB = gzip.open(f'{PUB}/pessoas/gente-base.bin.gz').read()
GH = gzip.open(f'{PUB}/pessoas/gente-hi.bin.gz').read()
OSS = np.frombuffer(base64.b64decode(cena['ossos']), np.float32).reshape(cena['H'], cena['W'], 4)
NOSSOS = len(GJ['ossos'])


def V(x, y, z):
    """three (y para cima, +z para a plateia) -> blender (z para cima)"""
    return (x, -z, y)


bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
col = sc.collection


# ------------------------------------------------------------ materiais
def mat_principled(nome, cor=(.5, .5, .5), rug=.5, met=0., em=None, emk=0., extra=None):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*cor, 1)
    b.inputs['Roughness'].default_value = rug
    b.inputs['Metallic'].default_value = met
    if em is not None:
        b.inputs['Emission Color'].default_value = (*em, 1)
        b.inputs['Emission Strength'].default_value = emk
    if extra:
        extra(m, b)
    return m


def nos(m):
    return m.node_tree.nodes, m.node_tree.links


def mat_pedra(nome, tint=(1, 1, 1)):
    """arenito em blocos: projeção triplanar em coordenadas do mundo (2,5 m × 1,25 m, fiadas casadas com os degraus)"""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    N, L = nos(m)
    b = N['Principled BSDF']
    geo = N.new('ShaderNodeNewGeometry')
    sep = N.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Position'], sep.inputs[0])
    nsep = N.new('ShaderNodeSeparateXYZ')
    L.new(geo.outputs['Normal'], nsep.inputs[0])
    imgs = {k: bpy.data.images.load(f'{PUB}/texturas/arenito_{k}.jpg') for k in ('cor', 'nrm', 'rao')}
    imgs['nrm'].colorspace_settings.name = 'Non-Color'
    imgs['rao'].colorspace_settings.name = 'Non-Color'

    def uv(a, bb, sa, sb, ob=0.):
        c = N.new('ShaderNodeCombineXYZ')
        ma = N.new('ShaderNodeMath'); ma.operation = 'MULTIPLY'; ma.inputs[1].default_value = sa
        mb = N.new('ShaderNodeMath'); mb.operation = 'MULTIPLY_ADD'; mb.inputs[1].default_value = sb; mb.inputs[2].default_value = ob
        L.new(a, ma.inputs[0]); L.new(bb, mb.inputs[0])
        L.new(ma.outputs[0], c.inputs[0]); L.new(mb.outputs[0], c.inputs[1])
        return c.outputs[0]
    # blender: x, y(= -z three), z(= y three); fiadas a partir de z=H
    zH = N.new('ShaderNodeMath'); zH.operation = 'SUBTRACT'; zH.inputs[1].default_value = H
    L.new(sep.outputs['Z'], zH.inputs[0])
    projs = [uv(sep.outputs['Y'], zH.outputs[0], 1 / 2.5, 1 / 1.25),   # faces x
             uv(sep.outputs['X'], sep.outputs['Y'], 1 / 2.5, 1 / 1.25, .37),  # topos
             uv(sep.outputs['X'], zH.outputs[0], 1 / 2.5, 1 / 1.25)]   # faces y (frente)
    # pesos |n|^6
    ws = []
    for comp in ('X', 'Z', 'Y'):
        a = N.new('ShaderNodeMath'); a.operation = 'ABSOLUTE'; L.new(nsep.outputs[comp], a.inputs[0])
        p = N.new('ShaderNodeMath'); p.operation = 'POWER'; p.inputs[1].default_value = 6; L.new(a.outputs[0], p.inputs[0])
        ws.append(p.outputs[0])
    s1 = N.new('ShaderNodeMath'); s1.operation = 'ADD'; L.new(ws[0], s1.inputs[0]); L.new(ws[1], s1.inputs[1])
    s2 = N.new('ShaderNodeMath'); s2.operation = 'ADD'; L.new(s1.outputs[0], s2.inputs[0]); L.new(ws[2], s2.inputs[1])
    wn = []
    for w in ws:
        d = N.new('ShaderNodeMath'); d.operation = 'DIVIDE'; L.new(w, d.inputs[0]); L.new(s2.outputs[0], d.inputs[1]); wn.append(d.outputs[0])

    def tri(img, cs=False):
        acc = None
        for pv, w in zip(projs, wn):
            t = N.new('ShaderNodeTexImage'); t.image = img
            L.new(pv, t.inputs[0])
            mm = N.new('ShaderNodeVectorMath'); mm.operation = 'SCALE'
            L.new(t.outputs['Color'], mm.inputs[0]); L.new(w, mm.inputs['Scale'])
            if acc is None:
                acc = mm.outputs[0]
            else:
                ad = N.new('ShaderNodeVectorMath'); ad.operation = 'ADD'; L.new(acc, ad.inputs[0]); L.new(mm.outputs[0], ad.inputs[1]); acc = ad.outputs[0]
        return acc
    cor = tri(imgs['cor'])
    rao = tri(imgs['rao'])
    tn = N.new('ShaderNodeMix'); tn.data_type = 'RGBA'; tn.blend_type = 'MULTIPLY'; tn.inputs['Factor'].default_value = 1
    L.new(cor, tn.inputs[6]); tn.inputs[7].default_value = (*tint, 1)
    L.new(tn.outputs[2], b.inputs['Base Color'])
    sr = N.new('ShaderNodeSeparateXYZ'); L.new(rao, sr.inputs[0])
    L.new(sr.outputs['X'], b.inputs['Roughness'])
    # relevo a partir da altura (oclusão das juntas)
    bump = N.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .55; bump.inputs['Distance'].default_value = .02
    L.new(sr.outputs['Y'], bump.inputs['Height'])
    L.new(bump.outputs[0], b.inputs['Normal'])
    return m


M = dict(
    pedra=mat_pedra('pedra'), pedraEsc=mat_pedra('pedraEsc', (.9, .84, .76)),
    piso=mat_principled('piso', (.006, .006, .007), .22, extra=lambda m, b: (b.inputs['Coat Weight'].__setattr__('default_value', .4), b.inputs['Coat Roughness'].__setattr__('default_value', .15))),
    preto=mat_principled('preto', (.01, .01, .011), .7), pretoMet=mat_principled('pretoMet', (.02, .02, .022), .4, .6),
    aluminio=mat_principled('aluminio', (.8, .81, .83), .28, 1., extra=lambda m, b: b.inputs['Anisotropic'].__setattr__('default_value', .6)),
    pano=mat_principled('pano', (.006, .006, .007), 1., extra=lambda m, b: (b.inputs['Sheen Weight'].__setattr__('default_value', 1.), b.inputs['Sheen Tint'].__setattr__('default_value', (.25, .24, .3, 1)), b.inputs['Sheen Roughness'].__setattr__('default_value', .35))),
    chao=mat_principled('chao', (.015, .015, .017), .85), grade=mat_principled('grade', (.5, .52, .55), .35, .9),
)


def caixa(x0, y0, z0, x1, y1, z1, mat, nome='caixa', chanfro=0.):
    """caixa em coordenadas three"""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        x = (x0 + x1) / 2 + v.co.x * abs(x1 - x0)
        y = (y0 + y1) / 2 + v.co.z * abs(y1 - y0)
        z = (z0 + z1) / 2 + v.co.y * -abs(z1 - z0)
        v.co = V(x, y, z)
    if chanfro:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=chanfro, segments=2, affect='EDGES', profile=.5)
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(nome, me)
    ob.data.materials.append(mat)
    col.objects.link(ob)
    return ob


# ------------------------------------------------------------ palco
caixa(-21, 0, -15, 21, H - .002, 0, M['preto'], 'base')
piso = bpy.data.meshes.new('piso')
piso.from_pydata([V(-21, H, -15), V(21, H, -15), V(21, H, 0), V(-21, H, 0)], [], [(0, 1, 2, 3)])
ob = bpy.data.objects.new('piso', piso); ob.data.materials.append(M['piso']); col.objects.link(ob)
rise, run = (ESC['topo'] - H) / ESC['n'], (ESC['z0'] - ESC['z1']) / ESC['n']
for k in range(ESC['n']):
    y1, za = H + (k + 1) * rise, ESC['z0'] - k * run
    caixa(-ESC['w'] / 2, H, za - run - .02, ESC['w'] / 2, y1, za, M['pedra'], f'degrau{k}', .018)
caixa(-4.6, H, ESC['zTopo'], 4.6, ESC['topo'], ESC['z1'], M['pedra'], 'patamar', .02)
for lado in (-1, 1):
    for k in range(4):
        x0, w, za = ESC['w'] / 2 + .9, 7.6 - k * 1.6, -3.4 - k * 1.9
        y0 = H + k * 1.25
        a, b = (x0, x0 + w) if lado > 0 else (-x0 - w, -x0)
        caixa(a, y0, ESC['zTopo'], b, y0 + 1.25, za, M['pedraEsc'] if k % 2 else M['pedra'], f'piramide{lado}{k}', .025)
caixa(-13, H, LEDC['z'] + .05, 13, H + .6, ESC['zTopo'], M['pedraEsc'], 'fundo')
# guarda-corpos inclinados
for lado in (-1, 1):
    perfil = [(ESC['z0'] + .8, H), (ESC['z0'] + .8, H + 1.05), (ESC['z1'], ESC['topo'] + 1.05), (ESC['zTopo'], ESC['topo'] + 1.05), (ESC['zTopo'], H)]
    x0 = ESC['w'] / 2 if lado > 0 else -ESC['w'] / 2 - .9
    vs = [V(x0, y, z) for z, y in perfil] + [V(x0 + .9, y, z) for z, y in perfil]
    n = len(perfil)
    fs = [tuple(range(n))[::-1], tuple(range(n, 2 * n))] + [(i, (i + 1) % n, n + (i + 1) % n, n + i) for i in range(n)]
    me = bpy.data.meshes.new('guarda'); me.from_pydata(vs, [], fs); me.update()
    o = bpy.data.objects.new('guarda', me); o.data.materials.append(M['pedra']); col.objects.link(o)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bmesh.ops.bevel(bm, geom=list(bm.edges), offset=.03, segments=2, affect='EDGES'); bm.to_mesh(me); bm.free()
# queimadores
for f in cena['fogo']:
    caixa(f[0] - .22, f[1], f[2] - .22, f[0] + .22, f[1] + .16, f[2] + .22, M['pretoMet'], 'queimador')
# LED central (conteúdo real exportado do web) e moldura
caixa(LEDC['x0'] - .4, LEDC['y0'] - .4, LEDC['z'] - .6, LEDC['x1'] + .4, LEDC['y1'] + .4, LEDC['z'] - .02, M['preto'], 'estruturaLED')


def tela(nome, w, h, img, forca, loc, rot_y=0., extra=None):
    me = bpy.data.meshes.new(nome)
    me.from_pydata([(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)], [], [(0, 1, 2, 3)])
    uvl = me.uv_layers.new()
    for i, uv in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uvl.data[i].uv = uv
    ob = bpy.data.objects.new(nome, me)
    ob.location = loc
    ob.rotation_euler = (0, 0, rot_y)
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    N, L = nos(m)
    N.remove(N['Principled BSDF'])
    t = N.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(img)
    e = N.new('ShaderNodeEmission'); e.inputs['Strength'].default_value = forca
    src = t.outputs['Color']
    if extra:
        src = extra(N, L, t)
    L.new(src, e.inputs['Color'])
    L.new(e.outputs[0], N['Material Output'].inputs['Surface'])
    ob.data.materials.append(m)
    col.objects.link(ob)
    return ob


tela('LED', 20, 10, f'{CENA}/led-{U}.png', 3.6, V(0, (LEDC['y0'] + LEDC['y1']) / 2, LEDC['z'] + .01))
# panos aveludados
def pano(L, Hh, prega, loc, rot):
    nx, ny = int(L / .06), 10
    vs, fs = [], []
    rr = np.random.default_rng(int(L * 13))
    f0, f1, f2 = rr.random(3) * 6.28
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = -L / 2 + L * i / nx
            y = Hh * j / ny
            k = prega * (.75 + .25 * math.sin(x * .7 + f0)) * (.6 + .4 * y / Hh)
            z = math.sin(x * 2 * math.pi / .42 + math.sin(x * 1.3 + f1) * 1.4) * k + math.sin(x * 2 * math.pi / 1.7 + f2) * k * .6
            vs.append((x, z, y))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            fs.append((a, a + 1, a + nx + 2, a + nx + 1))
    me = bpy.data.meshes.new('pano'); me.from_pydata(vs, [], fs); me.update()
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new('pano', me); o.location = loc; o.rotation_euler = rot; o.data.materials.append(M['pano']); col.objects.link(o)


pano(51, YC_PANO, .09, V(0, 0, -15.5), (0, 0, 0))
for s_ in (-1, 1):
    pano(13.4, YC_PANO, .08, V(s_ * 25.2, 0, -8.7), (0, 0, s_ * math.pi / 2))
# treliças (tubos exportados do web)
bm = bmesh.new()
for a0, a1, a2, b0, b1, b2, r in cena['tubos']:
    A, B = mathutils.Vector(V(a0, a1, a2)), mathutils.Vector(V(b0, b1, b2))
    d = B - A
    Lh = d.length
    if Lh < 1e-4:
        continue
    res = bmesh.ops.create_cone(bm, cap_ends=False, segments=8, radius1=r, radius2=r, depth=Lh)
    q = d.normalized().to_track_quat('Z', 'Y')
    Mx = mathutils.Matrix.Translation((A + B) / 2) @ q.to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Mx, verts=res['verts'])
me = bpy.data.meshes.new('trelica'); bm.to_mesh(me); bm.free()
for p in me.polygons:
    p.use_smooth = True
o = bpy.data.objects.new('trelica', me); o.data.materials.append(M['aluminio']); col.objects.link(o)
# LEDs laterais: imagem do artista (render próprio) com a moldura barroca
IMAG = f'{SAIDA}/foto-{["ceu", "ruinas", "castelo"][U]}-artista.jpg'
MOLD = f'{PUB}/midia/moldura-lateral.png'
def com_moldura(N, L, t):
    t.extension = 'CLIP'
    mt = N.new('ShaderNodeTexImage'); mt.image = bpy.data.images.load(MOLD)
    uvn = N.new('ShaderNodeUVMap'); L.new(uvn.outputs[0], mt.inputs[0])
    mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    L.new(mt.outputs['Alpha'], mx.inputs['Factor']); L.new(t.outputs['Color'], mx.inputs[6]); mx.inputs[7].default_value = (1, .97, .9, 1)
    return mx.outputs[2]
for i, (lx, ang) in enumerate(cena['lat']):
    o = caixa(-LATD['w'] / 2 - .3, LATD['y0'] - .3, -.6, LATD['w'] / 2 + .3, LATD['y0'] + LATD['h'] + .3, -.02, M['preto'], 'estruturaLat')
    o.location = V(lx, 0, LATD['z']); o.rotation_euler = (0, 0, ang)
    if CAM != 'artista' and os.path.exists(IMAG):
        tl = tela('lateral', LATD['w'], LATD['h'], IMAG, 1.6, V(lx, LATD['y0'] + LATD['h'] / 2, LATD['z'] + .01), extra=com_moldura)
        tl.location = mathutils.Vector(V(lx, LATD['y0'] + LATD['h'] / 2, LATD['z'])) + mathutils.Vector(V(math.sin(ang) * .01, 0, math.cos(ang) * .01))
        tl.rotation_euler = (0, 0, ang)
# refletores PIX (quadrados) com a cor do momento
mpix = {}
for x, y, z, nx_, nz_, r_, g_, b_ in cena['pix']:
    k = (round(r_, 2), round(g_, 2), round(b_, 2))
    if k not in mpix:
        mpix[k] = mat_principled('pix', (0, 0, 0), .5, em=(min(r_, 1), min(g_, 1), min(b_, 1)), emk=max(r_, g_, b_, .01) * 4)
    caixa(x - .28, y - .28, z - .15, x + .28, y + .28, z + .15, M['preto'], 'pixCaixa')
    face = bpy.data.meshes.new('pixFace')
    face.from_pydata([(-.21, 0, -.21), (.21, 0, -.21), (.21, 0, .21), (-.21, 0, .21)], [], [(0, 1, 2, 3)])
    fo = bpy.data.objects.new('pixFace', face)
    fo.location = V(x + nx_ * .16, y, z + nz_ * .16)
    fo.rotation_euler = (0, 0, math.atan2(nx_, nz_))
    fo.data.materials.append(mpix[k]); col.objects.link(fo)
# chão da pista e grade
caixa(-60, -.1, -16, 60, 0, 120, M['chao'], 'pista')
for x in np.arange(-26, 26, 1.2):
    caixa(x, 0, 2.25, x + 1.14, 1.2, 2.35, M['grade'], 'grade')
# faixa de LED roxa do estádio (anel) para dar o fundo
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=1, depth=1, end_fill_type='NOTHING')
anel = bpy.context.active_object
anel.scale = (62, 84, .9)
anel.location = V(0, 2.6, 38)
anel.data.materials.append(mat_principled('faixa', (0, 0, 0), .5, em=(.55, .25, 1.), emk=3))

# ------------------------------------------------------------ luz: LED, moving heads, fogo, ambiente
def spot(loc, d, cor, energia, ang):
    L = bpy.data.lights.new('mh', 'SPOT')
    L.energy = energia
    L.color = cor
    L.spot_size = ang
    L.spot_blend = .35
    L.shadow_soft_size = .08
    o = bpy.data.objects.new('mh', L)
    o.location = loc
    o.rotation_euler = mathutils.Vector(d).to_track_quat('-Z', 'Y').to_euler()
    col.objects.link(o)


for x, y, z, dx, dy, dz, r_, g_, b_, op, tipo in cena['feixes']:
    if op < .01:
        continue
    spot(V(x, y, z), V(dx, dy, dz), (min(r_, 1), min(g_, 1), min(b_, 1)), 16000 * op, math.radians(6))
    caixa(x - .2, y - .2, z - .2, x + .2, y + .25, z + .2, M['preto'], 'cabeca')
# seguidor no artista e lavagem
spot(V(0, 15.5, PONTO[2] + 6), V(0, ESC['topo'] + 1 - 15.5, -11.2 - PONTO[2] - 6), (1, .96, .9), 60000, math.radians(5))
wash = cena['wash']
for x, z, tx, tz in [(-12, -1.2, -3, -6), (12, -1.2, 3, -6), (-5, -1.2, 0, -10), (5, -1.2, 0, -10)]:
    spot(V(x, YC - .8, z), V(tx - x, H + 2 - YC + .8, tz - z), tuple(min(c, 1) for c in wash[:3]), 3500 * wash[3], math.radians(48))
# fogo: volume com ruído e emissão de corpo negro
mf = bpy.data.materials.new('fogo')
mf.use_nodes = True
N, L = nos(mf)
N.remove(N['Principled BSDF'])
tc = N.new('ShaderNodeTexCoord')
nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 4.5; nz.inputs['Detail'].default_value = 8; nz.inputs['Roughness'].default_value = .62
mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1.4, 1.4, .7)
L.new(tc.outputs['Generated'], mp.inputs[0]); L.new(mp.outputs[0], nz.inputs['Vector'])
sepg = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sepg.inputs[0])
# forma: estreita para cima
gx = N.new('ShaderNodeVectorMath'); gx.operation = 'SUBTRACT'; gx.inputs[1].default_value = (.5, .5, 0)
L.new(tc.outputs['Generated'], gx.inputs[0])
mul = N.new('ShaderNodeVectorMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = (1, 1, 0); L.new(gx.outputs[0], mul.inputs[0])
ln = N.new('ShaderNodeVectorMath'); ln.operation = 'LENGTH'; L.new(mul.outputs[0], ln.inputs[0])
raio = N.new('ShaderNodeMath'); raio.operation = 'MULTIPLY_ADD'; raio.inputs[1].default_value = -.42; raio.inputs[2].default_value = .46
L.new(sepg.outputs['Z'], raio.inputs[0])
dif = N.new('ShaderNodeMath'); dif.operation = 'SUBTRACT'; L.new(raio.outputs[0], dif.inputs[0]); L.new(ln.outputs['Value'], dif.inputs[1])
nn = N.new('ShaderNodeMath'); nn.operation = 'MULTIPLY_ADD'; nn.inputs[1].default_value = .8; nn.inputs[2].default_value = -.55
L.new(nz.outputs['Fac'], nn.inputs[0])
som = N.new('ShaderNodeMath'); som.operation = 'ADD'; L.new(dif.outputs[0], som.inputs[0]); L.new(nn.outputs[0], som.inputs[1])
den = N.new('ShaderNodeMath'); den.operation = 'MULTIPLY'; den.inputs[1].default_value = 7; den.use_clamp = False
L.new(som.outputs[0], den.inputs[0])
cl = N.new('ShaderNodeClamp'); L.new(den.outputs[0], cl.inputs[0])
ramp = N.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color = (.3, .03, 0, 1)
ramp.color_ramp.elements[1].color = (1., .62, .2, 1)
temp = N.new('ShaderNodeMath'); temp.operation = 'MULTIPLY'; L.new(cl.outputs[0], temp.inputs[0])
inv = N.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.1; L.new(sepg.outputs['Z'], inv.inputs[1])
L.new(inv.outputs[0], temp.inputs[1])
L.new(temp.outputs[0], ramp.inputs['Fac'])
pv = N.new('ShaderNodeVolumePrincipled')
pv.inputs['Density'].default_value = 0
pv.inputs['Emission Strength'].default_value = 22 * cena['fogoK']
L.new(cl.outputs[0], pv.inputs['Density'])
L.new(ramp.outputs['Color'], pv.inputs['Emission Color'])
em = N.new('ShaderNodeMath'); em.operation = 'MULTIPLY'; em.inputs[1].default_value = 3.2 * cena['fogoK']; L.new(cl.outputs[0], em.inputs[0])
L.new(em.outputs[0], pv.inputs['Emission Strength'])
L.new(pv.outputs[0], N['Material Output'].inputs['Volume'])
if cena['fogoK'] > .01:
    for i, (x, y, z) in enumerate(cena['fogo']):
        bpy.ops.mesh.primitive_cube_add(size=1)
        f = bpy.context.active_object
        h = 2.6 * cena['fogoK']
        f.scale = (.8, .8, h)
        f.location = V(x, y + .16 + h / 2, z)
        f.rotation_euler = (0, 0, i * 1.7)
        f.data.materials.append(mf)
        L_ = bpy.data.lights.new('fogo', 'POINT'); L_.energy = 900 * cena['fogoK']; L_.color = (1, .55, .2); L_.shadow_soft_size = .4
        lo = bpy.data.objects.new('fogo', L_); lo.location = V(x, y + 1.0, z); col.objects.link(lo)
# fumaça/névoa no ar (volume) e mundo escuro
bpy.ops.mesh.primitive_cube_add(size=1)
neb = bpy.context.active_object
neb.scale = (70, 90, 26)
neb.location = V(0, 13, 20)
mv = bpy.data.materials.new('nevoa'); mv.use_nodes = True
N, L = nos(mv); N.remove(N['Principled BSDF'])
vs_ = N.new('ShaderNodeVolumePrincipled'); vs_.inputs['Density'].default_value = UNIV['fumD']; vs_.inputs['Anisotropy'].default_value = .55
vs_.inputs['Color'].default_value = (*UNIV['fum'], 1)
L.new(vs_.outputs[0], N['Material Output'].inputs['Volume'])
neb.data.materials.append(mv)
w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.002, .002, .004, 1)
sc.world = w

# ------------------------------------------------------------ pessoas (mesmas malhas e poses do web)
def malha(buf, e):
    n = e['nv']
    v = np.frombuffer(buf, np.uint8, n * 30, e['v']).reshape(n, 30)
    pos = v[:, 0:6].copy().view(np.int16).reshape(n, 3).astype(np.float32) * 1e-4
    mat = v[:, 9]
    uv = v[:, 10:14].copy().view(np.int16).reshape(n, 2).astype(np.float32) / 8000
    si = v[:, 14:18].astype(np.int64)
    sw = v[:, 18:22].astype(np.float32) / 255
    ix = np.frombuffer(buf, np.uint32 if e['i32'] else np.uint16, e['ni'], e['i']).astype(np.int64).reshape(-1, 3)
    return pos, mat, uv, si, sw, ix


def pose(vi, an, ph):
    F = cena['FRAMES']
    f = (ph % 1) * F
    f0 = int(f) % F
    f1 = (f0 + 1) % F
    k = f - int(f)
    r0 = (vi * cena['NANIM'] + an) * F
    A = OSS[r0 + f0, :NOSSOS * 3].reshape(NOSSOS, 3, 4)
    B = OSS[r0 + f1, :NOSSOS * 3].reshape(NOSSOS, 3, 4)
    return A * (1 - k) + B * k


def skin(pos, si, sw, M3):
    out = np.zeros_like(pos)
    for j in range(4):
        m = M3[si[:, j]]
        out += sw[:, j:j + 1] * (np.einsum('nij,nj->ni', m[:, :, :3], pos) + m[:, :, 3])
    return out


def lin(c):
    r, g, b = (c >> 16) & 255, (c >> 8) & 255, c & 255
    return tuple((x / 255) ** 2.2 for x in (r, g, b))


MATP = {}


def mat_pessoa(mid):
    if mid in MATP:
        return MATP[mid]
    m = bpy.data.materials.new(f'p{mid}')
    m.use_nodes = True
    N, L = nos(m)
    b = N['Principled BSDF']
    at = lambda nome: (lambda a: (setattr(a, 'attribute_type', 'OBJECT'), setattr(a, 'attribute_name', nome), a)[2])(N.new('ShaderNodeAttribute'))
    cor = {0: 'cor_pele', 1: 'cor_top', 2: 'cor_baixo', 3: 'cor_tenis', 5: 'cor_cabelo', 8: 'cor_acento'}.get(mid)
    if cor:
        L.new(at(cor).outputs['Color'], b.inputs['Base Color'])
    if mid == 0:
        tx = N.new('ShaderNodeTexImage'); tx.image = bpy.data.images.get('pele.png') or bpy.data.images.load(f'{PUB}/pessoas/pele.png'); tx.image.colorspace_settings.name = 'Non-Color'
        uvn = N.new('ShaderNodeUVMap'); L.new(uvn.outputs[0], tx.inputs[0])
        sp = N.new('ShaderNodeSeparateColor'); L.new(tx.outputs['Color'], sp.inputs[0])
        k = N.new('ShaderNodeMath'); k.operation = 'MULTIPLY_ADD'; k.inputs[1].default_value = .5; k.inputs[2].default_value = .6; L.new(sp.outputs[0], k.inputs[0])
        m1 = N.new('ShaderNodeMix'); m1.data_type = 'RGBA'; m1.blend_type = 'MULTIPLY'; m1.inputs['Factor'].default_value = 1
        L.new(at('cor_pele').outputs['Color'], m1.inputs[6]); L.new(k.outputs[0], m1.inputs[7])
        lab = N.new('ShaderNodeMix'); lab.data_type = 'RGBA'; lab.blend_type = 'MULTIPLY'; L.new(sp.outputs[1], lab.inputs['Factor']); L.new(m1.outputs[2], lab.inputs[6]); lab.inputs[7].default_value = (.7, .5, .52, 1)
        sob = N.new('ShaderNodeMix'); sob.data_type = 'RGBA'; L.new(sp.outputs[2], sob.inputs['Factor']); L.new(lab.outputs[2], sob.inputs[6]); sob.inputs[7].default_value = (.008, .006, .005, 1)
        L.new(sob.outputs[2], b.inputs['Base Color'])
        b.inputs['Subsurface Weight'].default_value = .35
        b.inputs['Subsurface Radius'].default_value = (1., .35, .2)
        b.inputs['Subsurface Scale'].default_value = .012
        b.inputs['Roughness'].default_value = .46
        b.inputs['Coat Weight'].default_value = .08
    elif mid in (1, 2, 3, 8):
        b.inputs['Roughness'].default_value = .85 if mid != 3 else .55
        b.inputs['Sheen Weight'].default_value = .6 if mid != 3 else .1
    elif mid == 4:
        b.inputs['Base Color'].default_value = (.85, .85, .82, 1); b.inputs['Roughness'].default_value = .7
    elif mid == 5:
        b.inputs['Roughness'].default_value = .55; b.inputs['Sheen Weight'].default_value = .8
        nz = N.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 900; nz.inputs['Detail'].default_value = 2
        bp = N.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .6; bp.inputs['Distance'].default_value = .002
        L.new(nz.outputs['Fac'], bp.inputs['Height']); L.new(bp.outputs[0], b.inputs['Normal'])
    elif mid == 6:
        uvn = N.new('ShaderNodeUVMap'); sp = N.new('ShaderNodeSeparateXYZ'); L.new(uvn.outputs[0], sp.inputs[0])
        cr = N.new('ShaderNodeValToRGB'); cr.color_ramp.elements[0].position = .06; cr.color_ramp.elements[0].color = (.005, .004, .003, 1)
        e2 = cr.color_ramp.elements.new(.08); e2.color = (.09, .045, .02, 1)
        e3 = cr.color_ramp.elements.new(.16); e3.color = (.07, .035, .015, 1)
        cr.color_ramp.elements[-1].position = .18; cr.color_ramp.elements[-1].color = (.75, .71, .67, 1)
        L.new(sp.outputs['X'], cr.inputs['Fac']); L.new(cr.outputs['Color'], b.inputs['Base Color'])
        b.inputs['Roughness'].default_value = .05; b.inputs['Coat Weight'].default_value = 1
    elif mid == 7:
        b.inputs['Base Color'].default_value = (.01, .01, .01, 1); b.inputs['Roughness'].default_value = .8
    elif mid == 9:
        b.inputs['Base Color'].default_value = (.02, .02, .02, 1); b.inputs['Roughness'].default_value = .25; b.inputs['Metallic'].default_value = .4
    elif mid == 10:
        b.inputs['Base Color'].default_value = (0, 0, 0, 1); b.inputs['Emission Color'].default_value = (.5, .55, .7, 1); b.inputs['Emission Strength'].default_value = 3
    elif mid == 11:
        b.inputs['Base Color'].default_value = (.75, .48, .1, 1); b.inputs['Roughness'].default_value = .1; b.inputs['Transmission Weight'].default_value = .6
    elif mid == 12:
        b.inputs['Base Color'].default_value = (.4, .4, .42, 1); b.inputs['Metallic'].default_value = 1; b.inputs['Roughness'].default_value = .35
    MATP[mid] = m
    return m


def pessoa(p, lod):
    x, y, z, yaw, sx, vi, an, fase, vel, pele, topC, baixoC, tenisC, cab, acento, pat, barba, estilo, obj = p
    v = GJ['variantes'][vi]
    ph = cena['beat'] / cena['loops'][an] * vel + fase
    M3 = pose(vi, an, ph)
    partes = [(GH if lod == 'hi' else GB, v['lod'][lod])]
    if estilo:
        partes.append((GH if lod == 'hi' else GB, v['cabelo'][estilo]['hi' if lod == 'hi' else 'mid']))
    if obj:
        partes.append((GB, v['obj'][obj]))
    Vs, Fs, mats, uvs = [], [], [], []
    base_ = 0
    for buf, e in partes:
        pos, mat, uv, si, sw, ix = malha(buf, e)
        Pw = skin(pos, si, sw, M3)
        Vs.append(Pw); Fs.append(ix + base_); mats.append(mat); uvs.append(uv); base_ += len(Pw)
    P = np.concatenate(Vs); F = np.concatenate(Fs); mt = np.concatenate(mats); uv = np.concatenate(uvs)
    # transformação da instância (three): escala, giro em y, posição
    c, s_ = math.cos(yaw), math.sin(yaw)
    Pt = np.stack([P[:, 0] * c + P[:, 2] * s_, P[:, 1], -P[:, 0] * s_ + P[:, 2] * c], 1) * sx + [x, y, z]
    Pb = np.stack([Pt[:, 0], -Pt[:, 2], Pt[:, 1]], 1)
    me = bpy.data.meshes.new('pessoa')
    me.vertices.add(len(Pb)); me.vertices.foreach_set('co', Pb.ravel().astype(np.float32))
    me.loops.add(len(F) * 3); me.loops.foreach_set('vertex_index', F.ravel().astype(np.int32))
    me.polygons.add(len(F)); me.polygons.foreach_set('loop_start', np.arange(0, len(F) * 3, 3, dtype=np.int32)); me.polygons.foreach_set('loop_total', np.full(len(F), 3, np.int32))
    me.update(); me.validate()
    ul = me.uv_layers.new(); ul.data.foreach_set('uv', uv[F.ravel()].ravel().astype(np.float32))
    ids = sorted(set(mt.tolist()))
    for i in ids:
        me.materials.append(mat_pessoa(int(i)))
    me.polygons.foreach_set('material_index', np.array([ids.index(int(mt[f[0]])) for f in F], np.int32))
    me.polygons.foreach_set('use_smooth', np.ones(len(F), bool))
    ob = bpy.data.objects.new('pessoa', me)
    ob['cor_pele'], ob['cor_top'], ob['cor_baixo'], ob['cor_tenis'], ob['cor_cabelo'], ob['cor_acento'] = (lin(pele), lin(topC), lin(baixoC), lin(tenisC), lin(cab), lin(acento))
    col.objects.link(ob)
    return ob


# câmera
CAMS = dict(ponto=((0, 4.2, 32), (0, 7.4, -13), 40), pista=((3.5, 1.7, 6.5), (0, 7.8, -10), 58), drone=((30, 36, 52), (0, 6, -4), 38),
            artista=((-1.5, ESC['topo'] + 1.05, -11.2 + 6.2), (.1, ESC['topo'] + 1.35, -11.2), 22))
cp, ca, fov = CAMS[CAM]
cam = bpy.data.cameras.new('cam')
cam.sensor_fit = 'VERTICAL'
cam.angle_y = math.radians(fov)
co = bpy.data.objects.new('cam', cam)
co.location = V(*cp)
co.rotation_euler = (mathutils.Vector(V(*ca)) - mathutils.Vector(V(*cp))).to_track_quat('-Z', 'Y').to_euler()
col.objects.link(co)
sc.camera = co

camv = np.array(cp)
for p in cena['palco']:
    pessoa(p, 'hi')
dirc = np.array(ca) - camv
dirc /= np.linalg.norm(dirc)
n = 0
for p in cena['pub']:
    d = np.array(p[:3]) + [0, 1, 0] - camv
    dist = np.linalg.norm(d)
    if dist > 48 or (d @ dirc) / dist < math.cos(math.radians(fov * 1.15)):
        continue
    pessoa(p, 'hi' if dist < 9 else 'mid')
    n += 1
print('pessoas', n, flush=True)

# ------------------------------------------------------------ render
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = AMOSTRAS
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.cycles.volume_bounces = 1
sc.cycles.transmission_bounces = 4
sc.cycles.volume_step_rate = 4
sc.cycles.volume_max_steps = 256
sc.render.resolution_x, sc.render.resolution_y = RES
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Punchy'
sc.render.image_settings.file_format = 'JPEG'
sc.render.image_settings.quality = 92
sc.render.filepath = f'{SAIDA}/foto-{["ceu", "ruinas", "castelo"][U]}-{CAM}.jpg'
bpy.ops.render.render(write_still=True)
print('ok', sc.render.filepath)
