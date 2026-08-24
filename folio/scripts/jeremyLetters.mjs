// scripts/jeremyLetters.mjs
// Remplace les lettres physiques du nom dans la zone d'atterrissage
// (static/areas/areas.glb) par « JEREMY ANGULO », généré par extrusion de
// glyphes (Poppins Bold, licence OFL — voir jeremy/fonts/OFL.txt).
//
// Conventions relevées sur les lettres d'origine :
//  - nœud `refLettersPhysicalDynamic.NNN` portant le mesh de la lettre,
//    matériau partagé `palette`, UV constant (le patch de couleur), rotation -25°
//  - enfant `cuboid.NNN` sans mesh dont l'échelle encode le collider
//  - interlettre ~0.18, espace entre mots ~0.52, hauteur de lettre ~1.44

import fs from 'node:fs'
import * as THREE from 'three'
import opentype from 'opentype.js'
import { NodeIO, VertexLayout } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const GLB_PATH = 'static/areas/areas.glb'
const FONT_PATH = 'jeremy/fonts/Poppins-Bold.ttf'
const NAME = 'JEREMY ANGULO'

const LETTER_HEIGHT = 1.44
const DEPTH = 0.46
const GAP = 0.18
const WORD_GAP = 0.52
const UV = [0.7356, 0.5]
const COLLIDER_Y = 1.45
const COLLIDER_Z = 0.442

// ---------------------------------------------------------------- Police

const font = opentype.parse(fs.readFileSync(FONT_PATH).buffer)

const glyphToShapes = (char, scale) => {
    const path = font.getPath(char, 0, 0, 1) // fontSize 1, origine baseline
    const shapePath = new THREE.ShapePath()
    let started = false
    for (const c of path.commands) {
        // y inversé : opentype est y-vers-le-bas, three y-vers-le-haut
        if (c.type === 'M') { shapePath.moveTo(c.x * scale, -c.y * scale); started = true }
        else if (c.type === 'L') shapePath.lineTo(c.x * scale, -c.y * scale)
        else if (c.type === 'C') shapePath.bezierCurveTo(c.x1 * scale, -c.y1 * scale, c.x2 * scale, -c.y2 * scale, c.x * scale, -c.y * scale)
        else if (c.type === 'Q') shapePath.quadraticCurveTo(c.x1 * scale, -c.y1 * scale, c.x * scale, -c.y * scale)
        else if (c.type === 'Z' && started) shapePath.currentPath.closePath()
    }
    return shapePath.toShapes(false)
}

// Échelle : la hauteur du « E » définit la hauteur de lettre
const measureHeight = (char) => {
    const box = new THREE.Box2()
    for (const shape of glyphToShapes(char, 1))
        for (const p of shape.getPoints(12)) box.expandByPoint(p)
    return box.max.y - box.min.y
}
const K = LETTER_HEIGHT / measureHeight('E')

const buildLetterGeometry = (char) => {
    const shapes = glyphToShapes(char, K)
    const holes = shapes.reduce((n, s) => n + s.holes.length, 0)
    let geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: DEPTH,
        bevelEnabled: false,
        curveSegments: 6,
    })
    if (geometry.index) geometry = geometry.toNonIndexed()
    geometry.computeBoundingBox()
    const bb = geometry.boundingBox
    const center = new THREE.Vector3()
    bb.getCenter(center)
    geometry.translate(-center.x, -center.y, -center.z)
    geometry.computeVertexNormals()
    const width = bb.max.x - bb.min.x
    return { geometry, width, holes, shapes: shapes.length }
}

// ------------------------------------------------------------------- GLB

// ALL_EXTENSIONS : sans enregistrement, la réécriture supprimerait
// silencieusement KHR_materials_emissive_strength (les émissifs du monde).
// VertexLayout.SEPARATE : le layout entrelacé (défaut de gltf-transform) fait
// paniquer Rapier — le moteur passe geometry.attributes.position.array brut
// aux colliders trimesh/hull, et sur un attribut entrelacé ce tableau mélange
// positions, normales et UV.
const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .setVertexLayout(VertexLayout.SEPARATE)
const doc = await io.read(GLB_PATH)
const root = doc.getRoot()

const oldLetters = root.listNodes().filter((n) => n.getName().startsWith('refLettersPhysicalDynamic.'))
if (oldLetters.length === 0) throw new Error('Aucune lettre d\'origine trouvée — déjà remplacées ?')
oldLetters.sort((a, b) => a.getName().localeCompare(b.getName()))

// Gabarits : .019 = première lettre (B), .010 = dernière (N)
const first = oldLetters[oldLetters.length - 1]
const last = oldLetters[0]
const template = oldLetters[0]
const templateCuboid = template.listChildren().find((c) => c.getName().startsWith('cuboid'))
const rotation = template.getRotation()
const nodeExtras = structuredClone(template.getExtras() ?? {})
const cuboidExtras = structuredClone(templateCuboid?.getExtras() ?? {})
const y = template.getTranslation()[1]

const tFirst = new THREE.Vector3(...first.getTranslation())
const tLast = new THREE.Vector3(...last.getTranslation())
const mid = tFirst.clone().add(tLast).multiplyScalar(0.5)
const dir = tLast.clone().sub(tFirst).setY(0).normalize()

const parent = template.listParents().find((p) => p.propertyType === 'Node')
    ?? root.listScenes()[0]
const material = root.listMaterials().find((m) => m.getName() === 'palette')
const buffer = root.listBuffers()[0]
if (!material) throw new Error('Matériau palette introuvable')

console.log(`Gabarit : parent=${parent.getName?.() ?? 'scene'} | milieu=(${mid.x.toFixed(2)}, ${y}, ${mid.z.toFixed(2)}) | direction=(${dir.x.toFixed(3)}, 0, ${dir.z.toFixed(3)})`)

// ------------------------------------------------- Construction des lettres

const chars = [...NAME]
const built = chars.map((c) => (c === ' ' ? null : { char: c, ...buildLetterGeometry(c) }))

// Longueur totale de la ligne pour centrer sur l'ancien milieu
let total = 0
built.forEach((b, i) => {
    if (!b) return
    if (total > 0) total += chars[i - 1] === ' ' ? WORD_GAP : GAP
    total += b.width
})

let cursor = -total / 2
let madeCount = 0
built.forEach((b, i) => {
    if (!b) return
    if (cursor > -total / 2) cursor += chars[i - 1] === ' ' ? WORD_GAP : GAP
    const centerOffset = cursor + b.width / 2
    cursor += b.width

    const pos = mid.clone().addScaledVector(dir, centerOffset)
    const geo = b.geometry

    const position = doc.createAccessor().setType('VEC3').setArray(new Float32Array(geo.attributes.position.array)).setBuffer(buffer)
    const normal = doc.createAccessor().setType('VEC3').setArray(new Float32Array(geo.attributes.normal.array)).setBuffer(buffer)
    const count = geo.attributes.position.count
    const uvArray = new Float32Array(count * 2)
    for (let v = 0; v < count; v += 1) { uvArray[v * 2] = UV[0]; uvArray[v * 2 + 1] = UV[1] }
    const texcoord = doc.createAccessor().setType('VEC2').setArray(uvArray).setBuffer(buffer)

    // Index séquentiel : tout l'export Blender est indexé et le moteur lit
    // geometry.index — une géométrie non indexée fait paniquer Rapier.
    const indexArray = new Uint32Array(count)
    for (let v = 0; v < count; v += 1) indexArray[v] = v
    const indices = doc.createAccessor().setType('SCALAR').setArray(indexArray).setBuffer(buffer)

    const prim = doc.createPrimitive()
        .setMode(4)
        .setIndices(indices)
        .setAttribute('POSITION', position)
        .setAttribute('NORMAL', normal)
        .setAttribute('TEXCOORD_0', texcoord)
        .setMaterial(material)
    const mesh = doc.createMesh(`jeremyLetter${madeCount}`).addPrimitive(prim)

    const cuboid = doc.createNode(`cuboid.${300 + madeCount}`)
        .setScale([b.width, COLLIDER_Y, COLLIDER_Z])
        .setExtras(structuredClone(cuboidExtras))

    const node = doc.createNode(`refLettersPhysicalDynamic.${100 + madeCount}`)
        .setTranslation([pos.x, y, pos.z])
        .setRotation([...rotation])
        .setMesh(mesh)
        .setExtras(structuredClone(nodeExtras))
        .addChild(cuboid)

    parent.addChild(node)
    console.log(` + ${b.char} : ${b.shapes} forme(s)/${b.holes} trou(s), ${count} sommets, largeur ${b.width.toFixed(2)}, pos=(${pos.x.toFixed(2)}, ${y}, ${pos.z.toFixed(2)})`)
    madeCount += 1
})

// ------------------------------------------------- Suppression des anciennes

for (const node of oldLetters) {
    const mesh = node.getMesh()
    for (const child of node.listChildren()) child.dispose()
    node.dispose()
    if (mesh) mesh.dispose()
}

// keepLeaves : les nœuds vides (cuboid, refZone*…) encodent la physique et
// les zones. keepAttributes : les matériaux du GLB n'ont pas de texture (la
// palette est branchée au runtime), sans ce flag prune supprime les UV.
await doc.transform(prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }))
await io.write(GLB_PATH, doc)
console.log(`OK : ${madeCount} lettres écrites, ${oldLetters.length} supprimées → ${GLB_PATH}`)
