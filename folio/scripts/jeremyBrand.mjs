// scripts/jeremyBrand.mjs
// Remplace l'image de la texture `circuitBrand` d'areas.glb (banderoles et
// panneaux du circuit) par la banderole de Jérémy générée par jeremyMenuArt.mjs.
// ⚠️ Conventions vitales du projet : VertexLayout.SEPARATE (un layout entrelacé
// fait paniquer Rapier) et ALL_EXTENSIONS. Pas de prune : simple échange d'image.

import fs from 'node:fs'
import { NodeIO, VertexLayout } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'

const GLB = 'static/areas/areas.glb'
const BANNER = 'scripts/circuitBrand.png'
const BACKUP = '/tmp/claude-1000/-home-jeremy-dev-jeremyangulo/7c7fc39c-44b3-4ff5-a974-d9b77ef772e5/scratchpad/areas-before-brand.glb'

if(!fs.existsSync(BACKUP))
    fs.copyFileSync(GLB, BACKUP)

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE)
const document = await io.read(GLB)

let found = 0
for(const texture of document.getRoot().listTextures())
{
    if(texture.getName() === 'circuitBrand')
    {
        texture.setImage(fs.readFileSync(BANNER)).setMimeType('image/png')
        found++
    }
}

if(found !== 1)
    throw new Error(`circuitBrand introuvable ou multiple (${found})`)

await io.write(GLB, document)
console.log(`OK — texture circuitBrand remplacée (sauvegarde : ${BACKUP})`)
