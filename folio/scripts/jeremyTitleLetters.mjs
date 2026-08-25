// scripts/jeremyTitleLetters.mjs
// Remplace la devise du point d'apparition (« Business by day… », un seul bloc
// figé qui s'étalait sur tout le sol) par le titre actuel de Jérémy en lettres
// dorées plus petites, chacune avec son propre corps physique : elles se
// renversent comme les lettres du nom.
//
// Conventions du moteur reprises des lettres du nom :
//  - nœud `…PhysicalDynamic.NNN` (physical → corps, dynamic → dynamique)
//  - enfant `cuboid.NNN` sans mesh dont l'ÉCHELLE encode les dimensions
//  - matériau `palette` partagé, UV constant sur le patch de couleur
//
// ⚠️ VertexLayout.SEPARATE obligatoire (l'entrelacé fait paniquer Rapier) et
// prune({ keepLeaves, keepAttributes, keepExtras }).
//
// Ré-exécutable : supprime la devise et ses propres lettres avant de rebâtir.

import fs from 'node:fs'
import * as THREE from 'three'
import opentype from 'opentype.js'
import { NodeIO, VertexLayout } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const GLB_PATH = 'static/areas/areas.glb'
const FONT_PATH = 'jeremy/fonts/Poppins-Bold.ttf'

const TEXT = 'BUSINESS MANAGER'
const HEIGHT = 0.42          // hauteur de capitale (les lettres du nom : 1.44)
const DEPTH = 0.17
const GAP = 0.06
const WORD_GAP = 0.2
const GOLD_UV = [ 0.2656, 0.5 ]
const MASS = 0.06
const NAME_HEIGHT = 1.44     // sert à retrouver le niveau du sol sous les lettres

// Centre de la ligne, dans le groupe landing (là où se trouvait la devise)
const CENTER = [ -7.45, 1.05 ]

// ---------------------------------------------------------------- Police

const font = opentype.parse(fs.readFileSync(FONT_PATH).buffer)

const glyphToShapes = (char, scale) =>
{
    const path = font.getPath(char, 0, 0, 1)
    const shapePath = new THREE.ShapePath()
    let started = false
    for(const c of path.commands)
    {
        // y inversé : opentype est y-vers-le-bas, three y-vers-le-haut
        if(c.type === 'M') { shapePath.moveTo(c.x * scale, -c.y * scale); started = true }
        else if(c.type === 'L') shapePath.lineTo(c.x * scale, -c.y * scale)
        else if(c.type === 'C') shapePath.bezierCurveTo(c.x1 * scale, -c.y1 * scale, c.x2 * scale, -c.y2 * scale, c.x * scale, -c.y * scale)
        else if(c.type === 'Q') shapePath.quadraticCurveTo(c.x1 * scale, -c.y1 * scale, c.x * scale, -c.y * scale)
        else if(c.type === 'Z' && started) shapePath.currentPath.closePath()
    }
    return shapePath.toShapes(false)
}

const measureHeight = (char) =>
{
    const box = new THREE.Box2()
    for(const shape of glyphToShapes(char, 1))
        for(const p of shape.getPoints(12)) box.expandByPoint(p)
    return box.max.y - box.min.y
}

const K = HEIGHT / measureHeight('E')

const buildLetterGeometry = (char) =>
{
    let geometry = new THREE.ExtrudeGeometry(glyphToShapes(char, K), { depth: DEPTH, bevelEnabled: false, curveSegments: 6 })
    if(geometry.index) geometry = geometry.toNonIndexed()
    geometry.computeBoundingBox()
    const bb = geometry.boundingBox
    const center = new THREE.Vector3()
    bb.getCenter(center)
    geometry.translate(-center.x, -center.y, -center.z)
    geometry.computeVertexNormals()
    return { geometry, width: bb.max.x - bb.min.x, height: bb.max.y - bb.min.y }
}

// ------------------------------------------------------------------- GLB

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE)
const doc = await io.read(GLB_PATH)
const root = doc.getRoot()
const buffer = root.listBuffers()[0]
const material = root.listMaterials().find((m) => m.getName() === 'palette')
if(!material) throw new Error('matériau palette introuvable')

const landing = root.listNodes().find((n) => n.getName().startsWith('landing') && !n.getParentNode())
if(!landing) throw new Error('groupe landing introuvable')

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

for(const node of [ ...landing.listChildren() ])
{
    if(node.getName() === 'jeremyMotto' || node.getName().startsWith('jeremyTitlePhysicalDynamic'))
    {
        console.log(`- ${node.getName()}`)
        disposeSubtree(node)
    }
}

// Gabarit : une lettre du nom donne la rotation de la ligne, les extras
// physiques éprouvés et le niveau du sol
const letters = root.listNodes().filter((n) => n.getName().startsWith('refLettersPhysicalDynamic.'))
if(!letters.length) throw new Error('lettres du nom introuvables')

const template = letters[0]
const rotation = [ ...template.getRotation() ]
const nodeExtras = structuredClone(template.getExtras() ?? {})
const colliderTemplate = template.listChildren().find((c) => c.getName().startsWith('cuboid'))
const colliderExtras = structuredClone(colliderTemplate?.getExtras() ?? {})
const groundY = template.getTranslation()[1] - NAME_HEIGHT / 2

nodeExtras.mass = MASS

// Direction de la ligne : la rotation du nom appliquée à l'axe X
const dir = new THREE.Vector3(1, 0, 0).applyQuaternion(new THREE.Quaternion(...rotation)).setY(0).normalize()

// ------------------------------------------------------ Construction

const chars = [ ...TEXT ]
const built = chars.map((c) => (c === ' ' ? null : buildLetterGeometry(c)))

let total = 0
built.forEach((b, i) =>
{
    if(!b) return
    if(total > 0) total += chars[i - 1] === ' ' ? WORD_GAP : GAP
    total += b.width
})

const center = new THREE.Vector3(CENTER[0], 0, CENTER[1])
let cursor = -total / 2
let made = 0

built.forEach((b, i) =>
{
    if(!b) return
    if(cursor > -total / 2) cursor += chars[i - 1] === ' ' ? WORD_GAP : GAP
    const offset = cursor + b.width / 2
    cursor += b.width

    const pos = center.clone().addScaledVector(dir, offset)
    const geometry = b.geometry
    const count = geometry.attributes.position.count

    const uvArray = new Float32Array(count * 2)
    for(let v = 0; v < count; v += 1)
    {
        uvArray[v * 2] = GOLD_UV[0]
        uvArray[v * 2 + 1] = GOLD_UV[1]
    }

    // Index séquentiel : le moteur lit geometry.index, une géométrie non
    // indexée fait paniquer Rapier
    const indexArray = new Uint32Array(count)
    for(let v = 0; v < count; v += 1) indexArray[v] = v

    const prim = doc.createPrimitive()
        .setMode(4)
        .setIndices(doc.createAccessor().setType('SCALAR').setArray(indexArray).setBuffer(buffer))
        .setAttribute('POSITION', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.attributes.position.array)).setBuffer(buffer))
        .setAttribute('NORMAL', doc.createAccessor().setType('VEC3').setArray(new Float32Array(geometry.attributes.normal.array)).setBuffer(buffer))
        .setAttribute('TEXCOORD_0', doc.createAccessor().setType('VEC2').setArray(uvArray).setBuffer(buffer))
        .setMaterial(material)

    const cuboid = doc.createNode(`cuboid.${500 + made}`)
        .setScale([ b.width, b.height + 0.01, DEPTH ])
        .setExtras(structuredClone(colliderExtras))

    const node = doc.createNode(`jeremyTitlePhysicalDynamic.${500 + made}`)
        .setTranslation([ pos.x, groundY + b.height / 2, pos.z ])
        .setRotation([ ...rotation ])
        .setMesh(doc.createMesh(`jeremyTitle${made}`).addPrimitive(prim))
        .setExtras(structuredClone(nodeExtras))
        .addChild(cuboid)

    landing.addChild(node)
    made += 1
})

console.log(`« ${TEXT} » : ${made} lettres, ${total.toFixed(2)} unités de large, hauteur ${HEIGHT}, sol y=${groundY.toFixed(2)}`)

await doc.transform(prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }))
await io.write(GLB_PATH, doc)
console.log(`OK → ${GLB_PATH} (${(fs.statSync(GLB_PATH).size / 1024 / 1024).toFixed(1)} Mo)`)
