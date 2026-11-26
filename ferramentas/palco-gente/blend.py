"""Parte Blender (bpy): subdivisão das roupas, dobras, nível de detalhe por dizimação e renders de conferência."""
import math
import numpy as np
import bpy
import gera
from gera import MAT, OSSOS, ss, fbm, normais

CORES = {MAT['pele']: (.32, .17, .1), MAT['top']: (.75, .74, .7), MAT['baixo']: (.12, .16, .26), MAT['tenis']: (.9, .9, .88),
         MAT['sola']: (.95, .95, .93), MAT['cabelo']: (.02, .015, .012), MAT['olho']: (.85, .83, .8), MAT['cilio']: (.01, .01, .01),
         MAT['bone']: (.05, .05, .05), MAT['celular']: (.02, .02, .02), MAT['tela']: (.3, .35, .45), MAT['copo']: (.7, .7, .7), MAT['detalhe']: (.8, .1, .1), MAT['meia']: (.9, .9, .9)}


def limpa():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def para_bpy(pc, nome=None):
    me = bpy.data.meshes.new(nome or pc.nome)
    me.from_pydata([tuple(v) for v in pc.V], [], [tuple(f) for f in pc.F])
    me.update()
    ob = bpy.data.objects.new(nome or pc.nome, me)
    bpy.context.scene.collection.objects.link(ob)
    # uv por canto
    uvl = me.uv_layers.new(name='uv')
    li = np.zeros(len(me.loops), np.int64)
    me.loops.foreach_get('vertex_index', li)
    uvl.data.foreach_set('uv', pc.UV[li].astype(np.float32).ravel())
    # pesos dos ossos
    grupos = [ob.vertex_groups.new(name=b) for b in OSSOS]
    for k in range(4):
        for b in np.unique(pc.idx[:, k]):
            sel = np.where((pc.idx[:, k] == b) & (pc.w[:, k] > 0))[0]
            for i in sel:
                grupos[b].add([int(i)], float(pc.w[i, k]), 'ADD')
    # máscaras e material (como grupos, para sobreviver à subdivisão/dizimação)
    for m in range(pc.mk.shape[1]):
        g = ob.vertex_groups.new(name=f'mk{m}')
        for i in np.where(pc.mk[:, m] != 0)[0]:
            g.add([int(i)], float(np.clip(pc.mk[i, m], 0, 1)), 'REPLACE')
    mats = sorted(set(pc.mat.tolist()))
    for m in mats:
        mt = bpy.data.materials.get(f'm{m}') or bpy.data.materials.new(f'm{m}')
        ob.data.materials.append(mt)
    fm = np.array([mats.index(int(pc.mat[f[0]])) for f in pc.F])
    me.polygons.foreach_set('material_index', fm)
    me.update()
    return ob


def aplica(ob, mod, **kw):
    bpy.context.view_layer.objects.active = ob
    m = ob.modifiers.new('m', mod)
    for k, v in kw.items():
        setattr(m, k, v)
    with bpy.context.temp_override(object=ob):
        bpy.ops.object.modifier_apply(modifier='m')


def coords(ob):
    n = len(ob.data.vertices)
    a = np.zeros(n * 3)
    ob.data.vertices.foreach_get('co', a)
    return a.reshape(-1, 3)


def set_coords(ob, P):
    ob.data.vertices.foreach_set('co', P.ravel())
    ob.data.update()


def grupo_arr(ob, nome):
    g = ob.vertex_groups.get(nome)
    out = np.zeros(len(ob.data.vertices))
    if g is None:
        return out
    gi = g.index
    for v in ob.data.vertices:
        for e in v.groups:
            if e.group == gi:
                out[v.index] = e.weight
    return out


def dobras(ob, tipo, sub, H, seed):
    """dobras de tecido depois de subdividir"""
    P = coords(ob)
    me = ob.data
    N = np.zeros_like(P)
    me.calc_normals_split() if hasattr(me, 'calc_normals_split') else None
    for v in me.vertices:
        N[v.index] = v.normal
    j = lambda b: H[gera.OB[b]]
    y = P[:, 1]
    th = np.arctan2(P[:, 0], P[:, 2] - j('spine_02')[2])
    n1 = fbm(P * 9 + seed)
    n2 = fbm(P * 23 + seed * 3)
    disp = (n1 - .5) * .004 + (n2 - .5) * .0015
    if tipo in ('top',):
        tb = grupo_arr(ob, 'mk0') * 2.5
        peito = j('spine_03')[1]
        k = ss(peito, j('pelvis')[1] - .1, y) * (tb < .02)
        dob = np.abs(np.sin(th * 7 + n1 * 5 + n2 * 2))
        disp += k * (dob - .35) * .012
        # vincos na axila e na manga
        manga = (tb > .02)
        disp += manga * np.abs(np.sin(tb * 26 + n1 * 6)) * .004 * ss(.0, .25, tb)
        # leve tensão horizontal no peito/ombro
        disp += (y > peito) * (tb < .02) * (n2 - .5) * .003
    if tipo == 'baixo':
        kn = j('calf_l')[1]
        an = j('foot_l')[1]
        joelho = np.exp(-((y - kn) / .06) ** 2)
        disp += joelho * np.abs(np.sin(y * 95 + n1 * 6)) * .005
        bainha = ss(an + .2, an + .02, y)
        disp += bainha * np.abs(np.sin(y * 120 + n1 * 7 + th * 2)) * .007
        virilha = np.exp(-((y - j('pelvis')[1] + .08) / .05) ** 2) * (np.abs(P[:, 0]) < .1)
        disp += virilha * np.abs(np.sin(th * 9 + n1 * 4)) * .003
    if tipo == 'tenis':
        disp *= .3
    set_coords(ob, P + N * disp[:, None])


def material_preview(pele=(.32, .17, .1)):
    for m, c in CORES.items():
        mt = bpy.data.materials.get(f'm{m}')
        if not mt:
            continue
        mt.use_nodes = True
        b = mt.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (*(pele if m == 0 else c), 1)
        b.inputs['Roughness'].default_value = .45 if m == 0 else .8
        if m == 0:
            b.inputs['Subsurface Weight'].default_value = .25
            b.inputs['Subsurface Radius'].default_value = (1., .35, .2)
            b.inputs['Subsurface Scale'].default_value = .01
        if m == MAT['olho']:
            b.inputs['Roughness'].default_value = .05


def render_preview(caminho, alvo=(0, 1.0, 0), dist=3.2, ang=25, res=(900, 1200), samples=32, foco=None):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.view_settings.view_transform = 'AgX'
    cam = bpy.data.cameras.new('c')
    cam.lens = 50 if foco is None else foco
    co = bpy.data.objects.new('c', cam)
    sc.collection.objects.link(co)
    a = math.radians(ang)
    # coordenadas three (y up, +z frente) -> blender (x, -z, y)
    tx, ty, tz = alvo
    px, py, pz = tx + math.sin(a) * dist, ty + .15, tz + math.cos(a) * dist
    co.location = (px, -pz, py)
    d = np.array([tx - px, -(tz - pz), ty - py])
    import mathutils
    co.rotation_euler = mathutils.Vector(d).to_track_quat('-Z', 'Y').to_euler()
    sc.camera = co
    w = bpy.data.worlds.new('w')
    w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (.03, .03, .035, 1)
    sc.world = w
    for loc, e, s in [((2.5, -3, 3), 900, 2), ((-3, -1.5, 2), 300, 3), ((0, 3, 3), 600, 1.5)]:
        L = bpy.data.lights.new('l', 'AREA')
        L.energy = e
        L.size = s
        lo = bpy.data.objects.new('l', L)
        lo.location = loc
        dd = mathutils.Vector((tx, -tz, ty)) - mathutils.Vector(loc)
        lo.rotation_euler = dd.to_track_quat('-Z', 'Y').to_euler()
        sc.collection.objects.link(lo)
    sc.render.filepath = caminho
    bpy.ops.render.render(write_still=True)


def to_blender_space(ob):
    """os dados estão em y-up; gira o objeto para z-up só para renderizar"""
    ob.rotation_euler = (math.pi / 2, 0, 0)


def pesos_de(ob):
    """top-4 pesos por vértice a partir dos grupos com nome de osso"""
    n = len(ob.data.vertices)
    ix = np.zeros((n, 4), np.uint8)
    w = np.zeros((n, 4), np.float32)
    mapa = {g.index: gera.OB[g.name] for g in ob.vertex_groups if g.name in gera.OB}
    for v in ob.data.vertices:
        l = sorted(((e.weight, mapa[e.group]) for e in v.groups if e.group in mapa and e.weight > 1e-4), reverse=True)[:4]
        s = sum(a for a, _ in l) or 1
        for k, (a, b) in enumerate(l):
            ix[v.index, k] = b
            w[v.index, k] = a / s
    return ix, w


def faces_de(ob):
    return [list(p.vertices) for p in ob.data.polygons]


def subdivide(P, F, idx, w, levels=1):
    pc = gera.Peca(P, F, np.zeros((len(P), 2)), idx, w, 0, np.zeros((len(P), 0), np.float32), 'tmp')
    ob = para_bpy(pc, 'tmp')
    aplica(ob, 'SUBSURF', levels=levels, uv_smooth='NONE')
    out = (coords(ob), faces_de(ob), *pesos_de(ob))
    me = ob.data
    bpy.data.objects.remove(ob)
    bpy.data.meshes.remove(me)
    return out
