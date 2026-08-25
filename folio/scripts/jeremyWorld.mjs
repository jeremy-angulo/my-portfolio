// scripts/jeremyWorld.mjs
// Chirurgie du GLB static/areas/areas.glb — passe « monde de Jérémy » :
//  1. Zone carrière : premier recalage des jalons — DÉSORMAIS REPRIS ET
//     COMPLÉTÉ par scripts/jeremyCareerWorld.mjs, qui refait aussi les lignes
//     néon au sol (oubliées ici) et scinde ALTEN en deux postes. Lancer les
//     scripts dans l'ordre : jeremyLetters → jeremyWorld → jeremyCareer →
//     jeremyCareerWorld → jeremyTitleLetters → jeremyBrand.
//  2. Supprime les statues sociales sans équivalent chez Jérémy.
//  3. Construit dans le groupe `landing` : bloc d'escalade à prises colorées,
//     échiquier + pions renversables, coin Suède (sapins enneigés + bonhomme),
//     tente de colo près du feu de camp, et la devise sous le nom.
//
// Conventions moteur (Objects.js) : nom contenant `physical` → corps physique,
// `dynamic` → dynamique ; enfants `cuboid`/`tube`/`ball` (échelle = dimensions)
// ou `hull`/`trimesh` (mesh INDEXÉ obligatoire) → colliders, retirés du visuel.
// userData : mass, restitution/friction, preventFrustum (échappe au culling de
// l'aire — indispensable loin du centre du landing).
//
// ⚠️ Pièges gltf-transform (déjà mordu deux fois) :
//  - VertexLayout.SEPARATE obligatoire (l'entrelacé fait paniquer Rapier)
//  - prune({ keepLeaves, keepAttributes, keepExtras }) obligatoire

import fs from 'node:fs'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import opentype from 'opentype.js'
import { NodeIO, VertexLayout } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune } from '@gltf-transform/functions'

const GLB_PATH = 'static/areas/areas.glb'
const BACKUP = '/tmp/claude-1000/-home-jeremy-dev-jeremyangulo/7c7fc39c-44b3-4ff5-a974-d9b77ef772e5/scratchpad/areas-before-jeremyWorld.glb'
const FONT_PATH = 'jeremy/fonts/Poppins-Bold.ttf'
const careerSizes = JSON.parse(fs.readFileSync('scripts/careerSizes.json', 'utf8'))

// Couleurs de la palette 128×4 (texel → UV, u = (col + 2) / 128, v = 0.5)
const C = {
    rock: [0.0156, 0.5],       // #7c7691
    sand: [0.0469, 0.5],       // #ebd1a3
    darkWood: [0.0781, 0.5],   // #574e37
    skyBlue: [0.1094, 0.5],    // #3dbbe7
    gold: [0.2656, 0.5],       // #e4a90c
    sage: [0.2969, 0.5],       // #91ad78
    taupe: [0.3594, 0.5],      // #988165
    lime: [0.3906, 0.5],       // #abae2b
    orange: [0.4844, 0.5],     // #e56202
    red: [0.5195, 0.5],        // #ec3f1c
    palePink: [0.5508, 0.5],   // #fde6e1
    crimson: [0.6133, 0.5],    // #c30e3a
    violet: [0.6445, 0.5],     // #c366ef
    pink: [0.6758, 0.5],       // #ed719f
    nearBlack: [0.7031, 0.5],  // #1e0603
    warmWhite: [0.7344, 0.5],  // #fff2e8
}

const GROUND_Y = -3.25 // sol en coordonnées locales du groupe landing

// ------------------------------------------------------------------ Lecture

const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .setVertexLayout(VertexLayout.SEPARATE)
const doc = await io.read(GLB_PATH)
const root = doc.getRoot()
const scene = root.listScenes()[0]
const nodes = root.listNodes()
const buffer = root.listBuffers()[0]

if (nodes.some((n) => n.getName() === 'jeremyBoulderPhysical'))
    throw new Error('jeremyWorld déjà appliqué — restaurer la sauvegarde avant de relancer')
if (!fs.existsSync(BACKUP)) fs.copyFileSync(GLB_PATH, BACKUP)

const byName = (name) => nodes.find((n) => n.getName() === name)
const materialByName = (name) => root.listMaterials().find((m) => m.getName() === name)
const paletteMaterial = materialByName('palette')
const landing = scene.listChildren().find((n) => n.getName() === 'landing')
if (!paletteMaterial || !landing) throw new Error('palette ou landing introuvable')

const disposeSubtree = (node) => {
    const mesh = node.getMesh()
    for (const child of node.listChildren()) disposeSubtree(child)
    node.dispose()
    if (mesh) mesh.dispose()
}

// --------------------------------------------------------- 1. Zone carrière

// slot existant → jalon de Jérémy (x = couloir, z = 7.437 − (année − 2020))
const careerPlan = [
    { slot: 'refLine', x: 1.22, z: 7.437, size: 2, hasEnd: true, color: 'blue', texture: 'careerUps', stoneMat: null },
    { slot: 'refLine.001', x: 1.22, z: 2.44, size: 1.6, hasEnd: false, color: 'orange', texture: 'careerAlten', stoneMat: null },
    { slot: 'refLine.002', x: 1.22, z: 5.44, size: 3, hasEnd: true, color: 'blue', texture: 'careerEnseeiht', stoneMat: 'emissiveBlueRadialGradient' },
    { slot: 'refLine.003', x: 3.21, z: 5.44, size: 3, hasEnd: true, color: 'purple', texture: 'careerN7', stoneMat: null },
    { slot: 'refLine.005', x: -0.793, z: 3.44, size: 1, hasEnd: true, color: 'green', texture: 'careerLulea', stoneMat: 'emissiveGreenRadialGradient', labelY: 0.68 },
]

for (const plan of careerPlan) {
    const node = byName(plan.slot)
    if (!node) throw new Error(`${plan.slot} introuvable`)
    const t = node.getTranslation()
    node.setTranslation([plan.x, t[1], plan.z])
    node.setExtras({ size: plan.size, hasEnd: plan.hasEnd, color: plan.color, texture: plan.texture })

    const stone = node.listChildren().find((c) => c.getName().startsWith('stone'))
    const label = stone.listChildren().find((c) => c.getName().startsWith('careerText'))

    // Couleur du halo émissif du pilier
    if (plan.stoneMat) {
        const target = materialByName(plan.stoneMat)
        if (!target) throw new Error(`${plan.stoneMat} introuvable`)
        for (const prim of stone.getMesh().listPrimitives())
            if (prim.getMaterial()?.getName().startsWith('emissive')) prim.setMaterial(target)
    }

    // Étiquette : plan 2×2 → échelle = pixels / 202, ancrage proportionnel
    const { w, h } = careerSizes[plan.texture]
    const oldScale = label.getScale()
    const newSx = w / 202
    const ratio = newSx / oldScale[0]
    const lt = label.getTranslation()
    label.setScale([newSx, 1, h / 202])
    label.setTranslation([lt[0] * ratio, plan.labelY ?? lt[1], lt[2] * ratio])
    console.log(`carrière: ${plan.slot} → ${plan.texture} (z=${plan.z}, taille ${plan.size})`)
}

disposeSubtree(byName('refLine.004'))
console.log('carrière: refLine.004 supprimée')

// -------------------------------------------------- 2. Statues sociales

for (const name of ['xPhysicalDynamic', 'blueskyPhysicalDynamic.001', 'youtubePhysicalDynamic', 'twitchPhysicalDynamic', 'discordPhysicalDynamic', 'onlyfansPhysicalDynamic']) {
    const node = byName(name)
    if (node) { disposeSubtree(node); console.log(`social: ${name} supprimée`) }
}

// ------------------------------------------------------- Aide géométrie

// Gabarit physique des lettres (extras éprouvés pour les dynamiques)
const letterTemplate = byName('refLettersPhysicalDynamic.100')
const letterExtras = structuredClone(letterTemplate.getExtras() ?? {})
const letterColliderExtras = structuredClone(
    letterTemplate.listChildren().find((c) => /^(cuboid|tube|ball)/.test(c.getName()))?.getExtras() ?? {})
const letterRotation = [...letterTemplate.getRotation()]
console.log(`gabarit lettres: extras=${JSON.stringify(letterExtras)} collider=${JSON.stringify(letterColliderExtras)}`)

let seed = 7
const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed % 10000) / 10000
}

// Applique un UV constant (couleur palette) à une géométrie
const paint = (geometry, uvColor) => {
    const count = geometry.attributes.position.count
    const uv = new Float32Array(count * 2)
    for (let i = 0; i < count; i += 1) { uv[i * 2] = uvColor[0]; uv[i * 2 + 1] = uvColor[1] }
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
    return geometry
}

const place = (geometry, x, y, z, rotY = 0) => {
    if (rotY) geometry.rotateY(rotY)
    geometry.translate(x, y, z)
    return geometry
}

// Fusionne des géométries peintes en une primitive indexée (index séquentiel,
// le moteur lit geometry.index — jamais de primitive non indexée)
const toPrimitive = (geometries, material = paletteMaterial) => {
    const parts = geometries.map((g) => {
        const clean = new THREE.BufferGeometry()
        const base = g.index ? g.toNonIndexed() : g
        clean.setAttribute('position', base.attributes.position)
        clean.setAttribute('normal', base.attributes.normal)
        clean.setAttribute('uv', base.attributes.uv)
        return clean
    })
    const merged = mergeGeometries(parts, false)
    const count = merged.attributes.position.count
    const position = doc.createAccessor().setType('VEC3').setArray(new Float32Array(merged.attributes.position.array)).setBuffer(buffer)
    const normal = doc.createAccessor().setType('VEC3').setArray(new Float32Array(merged.attributes.normal.array)).setBuffer(buffer)
    const texcoord = doc.createAccessor().setType('VEC2').setArray(new Float32Array(merged.attributes.uv.array)).setBuffer(buffer)
    const indexArray = new Uint32Array(count)
    for (let i = 0; i < count; i += 1) indexArray[i] = i
    const indices = doc.createAccessor().setType('SCALAR').setArray(indexArray).setBuffer(buffer)
    return doc.createPrimitive()
        .setMode(4)
        .setIndices(indices)
        .setAttribute('POSITION', position)
        .setAttribute('NORMAL', normal)
        .setAttribute('TEXCOORD_0', texcoord)
        .setMaterial(material)
}

const makeNode = (name, meshName, geometries, translation, extras = {}) => {
    const mesh = doc.createMesh(meshName).addPrimitive(toPrimitive(geometries))
    const node = doc.createNode(name).setTranslation(translation).setMesh(mesh).setExtras(extras)
    landing.addChild(node)
    return node
}

const addCollider = (node, name, scale, position = [0, 0, 0], extras = {}) => {
    node.addChild(doc.createNode(name).setScale(scale).setTranslation(position).setExtras(extras))
}

// ------------------------------------- 3a. Bloc d'escalade (11.75, -0.52)

{
    const rock = new THREE.IcosahedronGeometry(2.1, 1)
    const pos = rock.attributes.position
    const jittered = new Map()
    for (let i = 0; i < pos.count; i += 1) {
        const key = `${pos.getX(i).toFixed(3)}|${pos.getY(i).toFixed(3)}|${pos.getZ(i).toFixed(3)}`
        if (!jittered.has(key)) jittered.set(key, 0.88 + rand() * 0.24)
        const k = jittered.get(key)
        pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k)
    }
    rock.scale(1.15, 0.72, 1)
    rock.computeBoundingBox()
    rock.translate(0, -rock.boundingBox.min.y, 0)
    rock.computeVertexNormals()
    paint(rock, C.rock)

    // Prises : vertex de la face supérieure, décalés le long de la normale
    rock.computeBoundingBox()
    const top = rock.boundingBox.max.y
    const holdColors = [C.red, C.gold, C.skyBlue, C.violet, C.lime, C.pink]
    const geometries = [rock]
    const used = []
    let holdIndex = 0
    for (let i = 0; i < pos.count && holdIndex < 11; i += 1) {
        const p = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))
        if (p.y < top * 0.25) continue
        if (used.some((u) => u.distanceTo(p) < 0.9)) continue
        used.push(p)
        const n = new THREE.Vector3(rock.attributes.normal.getX(i), rock.attributes.normal.getY(i), rock.attributes.normal.getZ(i)).normalize()
        const hold = new THREE.SphereGeometry(0.17, 8, 6)
        hold.scale(1, 0.55, 1)
        hold.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n))
        const q = p.clone().addScaledVector(n, 0.02)
        hold.translate(q.x, q.y, q.z)
        paint(hold, holdColors[holdIndex % holdColors.length])
        geometries.push(hold)
        holdIndex += 1
    }
    console.log(`escalade: ${holdIndex} prises posées`)

    const node = makeNode('jeremyBoulderPhysical', 'jeremyBoulder', geometries, [11.75, GROUND_Y, -0.52], { preventFrustum: true })

    // Collider hull : icosaèdre bas-poly INDEXÉ épousant le rocher
    const hullGeometry = new THREE.IcosahedronGeometry(2.05, 0)
    hullGeometry.scale(1.15, 0.72, 1)
    hullGeometry.computeBoundingBox()
    hullGeometry.translate(0, -hullGeometry.boundingBox.min.y, 0)
    const hp = doc.createAccessor().setType('VEC3').setArray(new Float32Array(hullGeometry.attributes.position.array)).setBuffer(buffer)
    const hn = doc.createAccessor().setType('VEC3').setArray(new Float32Array(hullGeometry.attributes.normal.array)).setBuffer(buffer)
    const hCount = hullGeometry.attributes.position.count
    const hUv = new Float32Array(hCount * 2).fill(0.5)
    const ht = doc.createAccessor().setType('VEC2').setArray(hUv).setBuffer(buffer)
    // PolyhedronGeometry est non indexée : index séquentiel (le moteur lit geometry.index)
    let hIndexArray
    if (hullGeometry.index) {
        hIndexArray = new Uint32Array(hullGeometry.index.array)
    } else {
        hIndexArray = new Uint32Array(hCount)
        for (let i = 0; i < hCount; i += 1) hIndexArray[i] = i
    }
    const hi = doc.createAccessor().setType('SCALAR').setArray(hIndexArray).setBuffer(buffer)
    const hullPrim = doc.createPrimitive().setMode(4).setIndices(hi)
        .setAttribute('POSITION', hp).setAttribute('NORMAL', hn).setAttribute('TEXCOORD_0', ht)
        .setMaterial(paletteMaterial)
    const hullMesh = doc.createMesh('jeremyBoulderHull').addPrimitive(hullPrim)
    node.addChild(doc.createNode('hull.700').setMesh(hullMesh))
}

// --------------------------------------- 3b. Échiquier + pions (9.25, 9.98)

{
    const geometries = []
    const base = new THREE.BoxGeometry(3.3, 0.1, 3.3)
    base.translate(0, 0.05, 0)
    geometries.push(paint(base, C.darkWood))
    for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            const square = new THREE.PlaneGeometry(0.36, 0.36)
            square.rotateX(-Math.PI / 2)
            square.translate(-1.33 + col * 0.38, 0.102, -1.33 + row * 0.38)
            geometries.push(paint(square, (row + col) % 2 === 0 ? C.warmWhite : C.nearBlack))
        }
    }
    const board = makeNode('jeremyChessboardPhysical', 'jeremyChessboard', geometries, [9.25, GROUND_Y, 9.98], { preventFrustum: true })
    addCollider(board, 'cuboid.710', [3.3, 0.1, 3.3], [0, 0.05, 0])

    const pawnGeometry = (height, color) => {
        const s = height / 0.85
        const profile = [
            [0.001, 0], [0.26, 0], [0.26, 0.07], [0.15, 0.13], [0.1, 0.4],
            [0.16, 0.46], [0.09, 0.5], [0.17, 0.6], [0.14, 0.72], [0.001, 0.85],
        ].map(([x, y]) => new THREE.Vector2(x * s, y * s))
        const lathe = new THREE.LatheGeometry(profile, 14)
        lathe.translate(0, -height / 2, 0)
        lathe.computeVertexNormals()
        return paint(lathe, color)
    }

    // 6 pions sur les cases, tube = cylindre (rayon = échelle.x / 2)
    const pawnSpots = [
        [-1.14, -1.14, C.warmWhite], [-0.38, -1.14, C.warmWhite], [1.14, -0.38, C.warmWhite],
        [-1.14, 1.14, C.nearBlack], [0.38, 1.14, C.nearBlack], [1.14, 0.38, C.nearBlack],
    ]
    pawnSpots.forEach(([dx, dz, color], i) => {
        const node = makeNode(`jeremyPawnPhysicalDynamic.${720 + i}`, `jeremyPawn${i}`,
            [pawnGeometry(0.85, color)],
            [9.25 + dx, GROUND_Y + 0.1 + 0.425 + 0.01, 9.98 + dz],
            { ...letterExtras, preventFrustum: true })
        addCollider(node, `tube.${720 + i}`, [0.52, 0.85, 0.52], [0, 0, 0], structuredClone(letterColliderExtras))
    })

    // Le roi (1st/180) veille à côté du plateau
    const kingBody = pawnGeometry(1.15, C.warmWhite)
    const crossV = new THREE.BoxGeometry(0.06, 0.24, 0.06)
    crossV.translate(0, 1.15 / 2 + 0.1, 0)
    const crossH = new THREE.BoxGeometry(0.18, 0.06, 0.06)
    crossH.translate(0, 1.15 / 2 + 0.12, 0)
    const king = makeNode('jeremyKingPhysicalDynamic', 'jeremyKing',
        [kingBody, paint(crossV, C.gold), paint(crossH, C.gold)],
        [9.25 + 2.15, GROUND_Y + 0.58 + 0.005, 9.98 + 0.6],
        { ...letterExtras, preventFrustum: true })
    addCollider(king, 'tube.730', [0.56, 1.16, 0.56], [0, 0, 0], structuredClone(letterColliderExtras))
}

// ------------------------------------------- 3c. Coin Suède (17.75, 4.48)

{
    const geometries = []

    const snow = new THREE.CircleGeometry(3.6, 24)
    snow.rotateX(-Math.PI / 2)
    snow.translate(-0.5, 0.02, 1.0)
    geometries.push(paint(snow, C.warmWhite))

    const pines = [
        [0, 0, 3.0], [1.9, -1.2, 2.4], [-1.3, 1.6, 2.7], [0.9, 2.3, 2.1],
    ]
    for (const [dx, dz, height] of pines) {
        const s = height / 3.0
        const trunk = new THREE.CylinderGeometry(0.13 * s, 0.16 * s, 0.6 * s, 8)
        geometries.push(paint(place(trunk, dx, 0.3 * s, dz), C.darkWood))
        const tiers = [
            [0.85, 1.0, 0.75], [0.62, 1.65, 0.85], [0.42, 2.25, 0.8],
        ]
        for (const [radius, y, coneHeight] of tiers) {
            const cone = new THREE.ConeGeometry(radius * s, coneHeight * s, 9)
            geometries.push(paint(place(cone, dx, y * s, dz), C.sage))
        }
        const cap = new THREE.ConeGeometry(0.26 * s, 0.42 * s, 9)
        geometries.push(paint(place(cap, dx, 2.72 * s, dz), C.warmWhite))
    }

    // Bonhomme de neige
    const sx = -2.2
    const sz = 2.6
    for (const [radius, y] of [[0.44, 0.42], [0.31, 1.03], [0.21, 1.46]]) {
        const ball = new THREE.SphereGeometry(radius, 12, 9)
        geometries.push(paint(place(ball, sx, y, sz), C.warmWhite))
    }
    const carrot = new THREE.ConeGeometry(0.05, 0.3, 7)
    carrot.rotateX(Math.PI / 2)
    geometries.push(paint(place(carrot, sx, 1.48, sz + 0.3), C.orange))
    const brim = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 12)
    geometries.push(paint(place(brim, sx, 1.66, sz), C.nearBlack))
    const hat = new THREE.CylinderGeometry(0.16, 0.16, 0.24, 12)
    geometries.push(paint(place(hat, sx, 1.79, sz), C.nearBlack))

    const node = makeNode('jeremySwedenPhysical', 'jeremySweden', geometries, [17.75, GROUND_Y, 4.48], { preventFrustum: true })
    pines.forEach(([dx, dz, height], i) => {
        addCollider(node, `tube.${740 + i}`, [0.4, height * 0.85, 0.4], [dx, height * 0.42, dz])
    })
    addCollider(node, 'ball.745', [0.9, 0.9, 0.9], [sx, 0.44, sz])
}

// --------------------------------- 3d. Tente de colo (4.25, 11.98)

{
    const geometries = []
    const slope = Math.atan2(1.35, 1.05)
    const slabLength = Math.hypot(1.05, 1.35) + 0.12
    for (const side of [-1, 1]) {
        const slab = new THREE.BoxGeometry(slabLength, 0.06, 2.3)
        slab.rotateZ(side * slope)
        slab.translate(side * -0.525, 0.675, 0)
        geometries.push(paint(slab, C.crimson))
    }
    const backShape = new THREE.Shape([
        new THREE.Vector2(-1.02, 0), new THREE.Vector2(1.02, 0), new THREE.Vector2(0, 1.32),
    ])
    const back = new THREE.ExtrudeGeometry(backShape, { depth: 0.05, bevelEnabled: false })
    back.translate(0, 0, -1.14)
    geometries.push(paint(back, C.palePink))
    const mat = new THREE.BoxGeometry(2.0, 0.04, 2.2)
    mat.translate(0, 0.02, 0)
    geometries.push(paint(mat, C.taupe))
    const ridge = new THREE.CylinderGeometry(0.045, 0.045, 2.5, 8)
    ridge.rotateX(Math.PI / 2)
    ridge.translate(0, 1.37, 0)
    geometries.push(paint(ridge, C.darkWood))
    for (const zEnd of [-1.16, 1.16]) {
        const pole = new THREE.CylinderGeometry(0.04, 0.04, 1.35, 8)
        pole.translate(0, 0.675, zEnd)
        geometries.push(paint(pole, C.darkWood))
    }

    // Orientée vers le feu de camp existant (local 6.3, 8.8)
    const yaw = Math.atan2(6.3 - 4.25, 8.8 - 11.98)
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0))
    const node = makeNode('jeremyTentPhysical', 'jeremyTent', geometries, [4.25, GROUND_Y, 11.98], { preventFrustum: true })
    node.setRotation([q.x, q.y, q.z, q.w])
    addCollider(node, 'cuboid.750', [2.2, 1.4, 2.4], [0, 0.7, 0])
}

// ----------------------- 3e. Devise sous le nom (« Business by day… »)

{
    const font = opentype.parse(fs.readFileSync(FONT_PATH).buffer)
    const hasDot = font.charToGlyphIndex('·') > 0
    const text = hasDot ? 'BUSINESS BY DAY · ENTREPRENEUR BY NIGHT' : 'BUSINESS BY DAY - ENTREPRENEUR BY NIGHT'

    const glyphToShapes = (char, scale) => {
        const path = font.getPath(char, 0, 0, 1)
        const shapePath = new THREE.ShapePath()
        let started = false
        for (const c of path.commands) {
            if (c.type === 'M') { shapePath.moveTo(c.x * scale, -c.y * scale); started = true }
            else if (c.type === 'L') shapePath.lineTo(c.x * scale, -c.y * scale)
            else if (c.type === 'C') shapePath.bezierCurveTo(c.x1 * scale, -c.y1 * scale, c.x2 * scale, -c.y2 * scale, c.x * scale, -c.y * scale)
            else if (c.type === 'Q') shapePath.quadraticCurveTo(c.x1 * scale, -c.y1 * scale, c.x * scale, -c.y * scale)
            else if (c.type === 'Z' && started) shapePath.currentPath.closePath()
        }
        return shapePath.toShapes(false)
    }
    const measure = (char) => {
        const box = new THREE.Box2()
        for (const shape of glyphToShapes(char, 1))
            for (const p of shape.getPoints(12)) box.expandByPoint(p)
        return box
    }
    const K = 0.42 / (measure('E').max.y - measure('E').min.y)

    const glyphs = [...text].map((char) => {
        if (char === ' ') return { space: true, width: 0.24 }
        const geometry = new THREE.ExtrudeGeometry(glyphToShapes(char, K), { depth: 0.06, bevelEnabled: false, curveSegments: 5 })
        geometry.computeBoundingBox()
        const bb = geometry.boundingBox
        return { geometry, width: bb.max.x - bb.min.x, minX: bb.min.x, minY: bb.min.y }
    })

    const gap = 0.055
    let total = 0
    for (const g of glyphs) total += g.width + (g.space ? 0 : gap)
    total -= gap

    const merged = []
    let cursor = -total / 2
    for (const g of glyphs) {
        if (g.space) { cursor += g.width; continue }
        const geometry = g.geometry
        geometry.translate(cursor - g.minX, -g.minY, 0)
        geometry.computeVertexNormals()
        merged.push(paint(geometry, C.gold))
        cursor += g.width + gap
    }

    const node = makeNode('jeremyMotto', 'jeremyMotto', merged, [-6.5, GROUND_Y + 0.005, 0.6])
    node.setRotation(letterRotation)
    console.log(`devise: « ${text} » (${total.toFixed(1)} unités de large)`)
}

// ------------------------------------------------------------------ Écriture

await doc.transform(prune({ keepLeaves: true, keepAttributes: true, keepExtras: true }))
await io.write(GLB_PATH, doc)
const stat = fs.statSync(GLB_PATH)
console.log(`OK → ${GLB_PATH} (${(stat.size / 1024 / 1024).toFixed(1)} Mo)`)
