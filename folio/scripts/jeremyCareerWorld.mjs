// scripts/jeremyCareerWorld.mjs
// Reconstruit la zone carrière de static/areas/areas.glb sur le parcours réel
// de Jérémy. La passe précédente n'avait recalé que les DONNÉES (les pierres
// coulissantes) : les lignes néon au sol étaient restées celles du parcours
// d'origine, d'où le décalage entre les libellés et le sol.
//
// Repères relevés dans le GLB d'origine :
//  - 1 unité Z = 1 an, z(année) = 7.437 − (année − 2020)
//  - une ligne = carré lumineux au départ (0.506 de côté) + tige fine (0.128)
//    + carré à l'arrivée ; les UV pilotent le dégradé radial du matériau
//    (v = 0 au milieu de la tige = le plus lumineux, v = 0.864 au bord des carrés)
//  - un « socle » plat (matériau palette) entoure chaque départ de segment,
//    ouvert du côté où part la ligne
//  - la règle blanche des années longe le compteur, à gauche
//
// ⚠️ Pièges gltf-transform : VertexLayout.SEPARATE obligatoire (l'entrelacé
// fait paniquer Rapier) et prune({ keepLeaves, keepAttributes, keepExtras }).
//
// Le script est ré-exécutable : il supprime ses propres nœuds avant de rebâtir.

import fs from 'node:fs'
import { NodeIO, VertexLayout } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const GLB_PATH = 'static/areas/areas.glb'
const BACKUP = '/tmp/claude-1000/-home-jeremy-dev-jeremyangulo/7c7fc39c-44b3-4ff5-a974-d9b77ef772e5/scratchpad/areas-before-career.glb'
const careerSizes = JSON.parse(fs.readFileSync('scripts/careerSizes.json', 'utf8'))

// ---------------------------------------------------------------- Parcours

const LANES = { main: 1.22, right: 3.21, left: -0.793 }
const GROUND_Y = -3.232          // hauteur du sol dans le groupe career
const zOfYear = (year) => 7.437 - (year - 2020)

// L'étiquette est un plan incliné à 45° face caméra : sa largeur s'étend selon
// (0.707, 0, −0.707). Deux couloirs distants de 2 en x ne se séparent donc que
// de 1.41 à l'écran, moins que la largeur d'une étiquette (3.49) — d'où le
// libellé de N7 surélevé et celui de Luleå renvoyé de l'autre côté de sa ligne.
const LABEL_SIDE = [ 0.964, -1.026 ]   // décalage (x, z) le long de la largeur
const LABEL_Y = 0.679

const timeline = [
    { key: 'careerSabatier', lane: 'main',  start: 2020, size: 2,   color: 'blue',   hasEnd: true,  labelY: LABEL_Y,        flip: false },
    { key: 'careerEnseeiht', lane: 'main',  start: 2022, size: 3,   color: 'blue',   hasEnd: true,  labelY: LABEL_Y,        flip: false },
    { key: 'careerN7',       lane: 'right', start: 2022, size: 3,   color: 'purple', hasEnd: true,  labelY: LABEL_Y + 1.55, flip: false },
    { key: 'careerLulea',    lane: 'left',  start: 2024, size: 1,   color: 'green',  hasEnd: true,  labelY: LABEL_Y,        flip: true  },
    { key: 'careerAnalyst',  lane: 'main',  start: 2025, size: 1,   color: 'orange', hasEnd: true,  labelY: LABEL_Y,        flip: false },
    { key: 'careerManager',  lane: 'main',  start: 2026, size: 1.2, color: 'orange', hasEnd: false, labelY: LABEL_Y,        flip: false },
]

const EMISSIVE = {
    blue: 'emissiveBlueRadialGradient',
    purple: 'emissivePurpleRadialGradient',
    green: 'emissiveGreenRadialGradient',
    orange: 'emissiveOrangeRadialGradient',
    white: 'emissiveWhiteRadialGradient',
}

const OPEN_FADE = 6      // longueur de la tige qui s'évanouit (poste en cours)
const RULER_TAIL = 0.4   // marge de la règle des années après le dernier jalon

// ------------------------------------------------------------------ Lecture

if(!fs.existsSync(BACKUP))
    fs.copyFileSync(GLB_PATH, BACKUP)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE)
const doc = await io.read(GLB_PATH)
const root = doc.getRoot()
const buffer = root.listBuffers()[0]
const career = root.listNodes().find((n) => n.getName() === 'career' && !n.getParentNode())
if(!career) throw new Error('groupe career introuvable')

const materialByName = (name) =>
{
    const material = root.listMaterials().find((m) => m.getName() === name)
    if(!material) throw new Error(`matériau ${name} introuvable`)
    return material
}

const childByName = (name) => career.listChildren().find((c) => c.getName() === name)

const disposeSubtree = (node) =>
{
    for(const child of [ ...node.listChildren() ]) disposeSubtree(child)
    const mesh = node.getMesh()
    node.detach()
    node.dispose()
    if(mesh && mesh.listParents().filter((p) => p.propertyType === 'Node').length === 0)
    {
        for(const prim of mesh.listPrimitives()) prim.dispose()
        mesh.dispose()
    }
}

// ------------------------------------------------------------- Géométries

// Un maillage plat (y = 0) : sommets {x, z, u, v}, triangles en indices
const flatMesh = (name, verts, tris, material) =>
{
    const position = new Float32Array(verts.length * 3)
    const normal = new Float32Array(verts.length * 3)
    const texcoord = new Float32Array(verts.length * 2)

    verts.forEach((v, i) =>
    {
        position[i * 3] = v.x
        position[i * 3 + 1] = 0
        position[i * 3 + 2] = v.z
        normal[i * 3 + 1] = 1
        texcoord[i * 2] = v.u
        texcoord[i * 2 + 1] = v.v
    })

    const prim = doc.createPrimitive()
        .setMode(4)
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(tris.flat())).setBuffer(buffer))
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(position).setBuffer(buffer))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(normal).setBuffer(buffer))
        .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(texcoord).setBuffer(buffer))
        .setMaterial(material)

    return doc.createMesh(name).addPrimitive(prim)
}

// Quad horizontal ; l'ordre (loin gauche, loin droite, près droite, près gauche)
// donne une normale vers le haut
const quad = (verts, xa, xb, zFar, zNear, ua, ub, vFar, vNear) =>
{
    const base = verts.length
    verts.push(
        { x: xa, z: zFar,  u: ua, v: vFar },
        { x: xb, z: zFar,  u: ub, v: vFar },
        { x: xb, z: zNear, u: ub, v: vNear },
        { x: xa, z: zNear, u: ua, v: vNear },
    )
    return [ [ base, base + 1, base + 2 ], [ base, base + 2, base + 3 ] ]
}

const HALF_CAP = 0.253
const HALF_SHAFT = 0.064
const U_OUT_A = 0.155
const U_IN_A = 0.419
const U_IN_B = 0.599
const U_OUT_B = 0.864
const V_EDGE = 0.864
const V_JOINT = 0.155
const V_CORE = 0

// Carré lumineux d'extrémité, en 3 bandes comme dans le GLB d'origine
const pushCap = (verts, tris, zCenter, mirrored) =>
{
    const zFar = zCenter + HALF_CAP
    const zNear = zCenter - HALF_CAP
    const [ uOutL, uInL, uInR, uOutR ] = mirrored
        ? [ U_OUT_B, U_IN_B, U_IN_A, U_OUT_A ]
        : [ U_OUT_A, U_IN_A, U_IN_B, U_OUT_B ]

    tris.push(
        ...quad(verts, -HALF_CAP, -HALF_SHAFT, zFar, zNear, uOutL, uInL, V_EDGE, V_JOINT),
        ...quad(verts, -HALF_SHAFT, HALF_SHAFT, zFar, zNear, uInL, uInR, V_EDGE, V_JOINT),
        ...quad(verts, HALF_SHAFT, HALF_CAP, zFar, zNear, uInR, uOutR, V_EDGE, V_JOINT),
    )
}

const buildLine = (name, size, hasEnd, materialName) =>
{
    const verts = []
    const tris = []

    pushCap(verts, tris, 0, false)

    const shaftStart = -HALF_CAP
    const shaftEnd = hasEnd ? -(size - HALF_CAP) : -(size + OPEN_FADE)
    const middle = hasEnd ? -size / 2 : -(size * 0.5)

    tris.push(
        ...quad(verts, -HALF_SHAFT, HALF_SHAFT, shaftStart, middle, U_IN_A, U_IN_B, V_JOINT, V_CORE),
        ...quad(verts, -HALF_SHAFT, HALF_SHAFT, middle, shaftEnd, U_IN_A, U_IN_B, V_CORE, hasEnd ? V_JOINT : V_EDGE),
    )

    if(hasEnd)
        pushCap(verts, tris, -size, true)

    return flatMesh(name, verts, tris, materialByName(materialName))
}

// ------------------------------------------- Socle : gabarit pris dans le GLB

const readSocketTemplate = () =>
{
    const source = childByName('Plane.049')
    if(!source) return null

    const prim = source.getMesh().listPrimitives()[0]
    const pos = prim.getAttribute('POSITION')
    const uv = prim.getAttribute('TEXCOORD_0')
    const index = prim.getIndices().getArray()

    // Le socle du premier jalon : centré sur (4.0125, −0.0665) dans ce maillage
    const CX = 4.0125
    const CZ = -0.0665
    const verts = []
    const tris = []
    const remap = new Map()

    for(let t = 0; t < index.length; t += 3)
    {
        const ids = [ index[t], index[t + 1], index[t + 2] ]
        const pts = ids.map((i) => pos.getElement(i, []))
        if(!pts.every((p) => Math.abs(p[0] - CX) < 0.5 && Math.abs(p[2] - CZ) < 0.6)) continue

        const tri = ids.map((id, k) =>
        {
            if(!remap.has(id))
            {
                const p = pts[k]
                const t = uv.getElement(id, [])
                remap.set(id, verts.length)
                verts.push({ x: p[0] - CX, z: p[2] - CZ, u: t[0], v: t[1] })
            }
            return remap.get(id)
        })
        tris.push(tri)
    }

    return verts.length ? { verts, tris, material: prim.getMaterial() } : null
}

// ------------------------------------------------------------- Nettoyage

for(const name of [ 'Plane.018', 'Plane.022', 'Plane.035', 'Plane.048', 'Plane.049' ])
{
    const node = childByName(name)
    if(node) { console.log(`- ${name} (décor du parcours d'origine)`) }
}

const socketTemplate = readSocketTemplate()
if(!socketTemplate) console.log('! gabarit de socle introuvable, les socles seront omis')

for(const node of [ ...career.listChildren() ])
{
    const name = node.getName()
    if(/^(Plane\.018|Plane\.022|Plane\.035|Plane\.048|Plane\.049)$/.test(name) || /^career(Neon|Socket|Ruler)/.test(name))
        disposeSubtree(node)
}

// ------------------------------------------------- Lignes, socles et règle

const sockets = new Set()

timeline.forEach((entry, i) =>
{
    const x = LANES[entry.lane]
    const z = zOfYear(entry.start)

    const mesh = buildLine(`careerNeon${i}`, entry.size, entry.hasEnd, EMISSIVE[entry.color])
    career.addChild(doc.createNode(`careerNeon.${100 + i}`).setTranslation([ x, GROUND_Y, z ]).setMesh(mesh))

    sockets.add(`${x}|${z}|0`)
    if(entry.hasEnd) sockets.add(`${x}|${z - entry.size}|1`)

    console.log(`ligne ${entry.key.padEnd(15)} couloir ${entry.lane.padEnd(5)} x=${x.toFixed(2)} z=${z.toFixed(2)} → ${(z - entry.size).toFixed(2)} (${entry.color}${entry.hasEnd ? '' : ', ouverte'})`)
})

if(socketTemplate)
{
    let n = 0
    for(const key of sockets)
    {
        const [ x, z, flipped ] = key.split('|').map(Number)
        const mesh = flatMesh(`careerSocket${n}`, socketTemplate.verts, socketTemplate.tris, socketTemplate.material)
        const node = doc.createNode(`careerSocket.${200 + n}`).setTranslation([ x, GROUND_Y, z ]).setMesh(mesh)
        // Le socle est ouvert du côté où part la ligne : demi-tour aux arrivées
        if(flipped) node.setRotation([ 0, 1, 0, 0 ])
        career.addChild(node)
        n += 1
    }
    console.log(`${n} socles posés`)
}

// Règle des années : de 2020 au dernier jalon, plus une petite marge
{
    const last = timeline[timeline.length - 1]
    const length = (zOfYear(2020) - (zOfYear(last.start) - last.size)) + RULER_TAIL
    const verts = []
    const tris = quad(verts, -HALF_SHAFT, HALF_SHAFT, 0.202, -length, 0.45, 0.568, 0.351, 0.003)
    const mesh = flatMesh('careerRuler', verts, tris, materialByName(EMISSIVE.white))
    career.addChild(doc.createNode('careerRuler.300').setTranslation([ -2.792, GROUND_Y - 0.002, 7.504 ]).setMesh(mesh))
    console.log(`règle des années : ${length.toFixed(2)} unités (2020 → ${last.start + last.size})`)
}

// ------------------------------------------------------ Pierres et libellés

const refLines = career.listChildren()
    .filter((c) => c.getName().startsWith('refLine'))
    .sort((a, b) => a.getName().localeCompare(b.getName()))

if(refLines.length === 0) throw new Error('aucun refLine trouvé')

const templateLine = refLines[0]
const templateStone = templateLine.listChildren().find((c) => c.getName().startsWith('stone'))
const templateLabel = templateStone.listChildren().find((c) => c.getName().startsWith('careerText'))
const labelMesh = templateLabel.getMesh()
const labelRotation = [ ...templateLabel.getRotation() ]

// Une pierre par couleur : le capuchon émissif porte la couleur de la ligne
const stoneMeshes = new Map()
const stoneMeshFor = (color) =>
{
    if(stoneMeshes.has(color)) return stoneMeshes.get(color)

    const mesh = doc.createMesh(`careerStone_${color}`)
    for(const prim of templateStone.getMesh().listPrimitives())
    {
        const isEmissive = /^emissive/.test(prim.getMaterial()?.getName() ?? '')
        const clone = doc.createPrimitive()
            .setMode(prim.getMode())
            .setIndices(prim.getIndices())
            .setMaterial(isEmissive ? materialByName(EMISSIVE[color]) : prim.getMaterial())
        for(const semantic of prim.listSemantics())
            clone.setAttribute(semantic, prim.getAttribute(semantic))
        mesh.addPrimitive(clone)
    }

    stoneMeshes.set(color, mesh)
    return mesh
}

// Autant de lignes que de jalons : on réutilise, on crée ou on supprime
while(refLines.length > timeline.length)
{
    const extra = refLines.pop()
    console.log(`- ${extra.getName()} (jalon en trop)`)
    disposeSubtree(extra)
}

while(refLines.length < timeline.length)
{
    const i = refLines.length
    const label = doc.createNode(`careerText.${400 + i}`).setMesh(labelMesh).setRotation([ ...labelRotation ])
    const stone = doc.createNode(`stone.${400 + i}`).addChild(label)
    const node = doc.createNode(`refLine.${400 + i}`).addChild(stone)
    career.addChild(node)
    refLines.push(node)
    console.log(`+ ${node.getName()} (jalon ajouté)`)
}

refLines.forEach((node, i) =>
{
    const entry = timeline[i]
    const x = LANES[entry.lane]
    const z = zOfYear(entry.start)

    node.setTranslation([ x, GROUND_Y, z ])
    node.setExtras({ size: entry.size, hasEnd: entry.hasEnd, color: entry.color, texture: entry.key })

    const stone = node.listChildren().find((c) => c.getName().startsWith('stone'))
    stone.setTranslation([ 0, 0, 0 ])
    stone.setMesh(stoneMeshFor(entry.color))

    const label = stone.listChildren().find((c) => c.getName().startsWith('careerText'))
    const size = careerSizes[entry.key]
    if(!size) throw new Error(`dimensions manquantes pour ${entry.key} (lancer jeremyCareer.mjs)`)

    const sign = entry.flip ? -1 : 1
    label.setScale([ size.w / 202, 1, size.h / 202 ])
    label.setTranslation([ LABEL_SIDE[0] * sign, entry.labelY, LABEL_SIDE[1] * sign ])
})

// Dernière trace du monde d'origine dans cette zone : le matériau de
// remplacement des étiquettes porte le nom de l'école de son auteur
for(const material of root.listMaterials())
{
    if(material.getName() === 'careerTextHetic')
    {
        material.setName('careerTextPlaceholder')
        console.log('matériau careerTextHetic renommé')
    }
}

// ------------------------------------------------------------------ Écriture

await doc.transform(prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }))
await io.write(GLB_PATH, doc)
console.log(`OK → ${GLB_PATH} (${(fs.statSync(GLB_PATH).size / 1024 / 1024).toFixed(1)} Mo)`)
