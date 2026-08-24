// scripts/jeremyCareer.mjs
// Génère les bandeaux de la zone carrière (static/career/*.png) pour Jérémy.
//
// Convention relevée sur les bandeaux d'origine (careerHetic.png) :
//  - fond noir (transparent au rendu : alpha = step(0.1, max(r, g)))
//  - plaque VERTE derrière chaque ligne (rendue en plaque sombre #251f2b)
//  - texte ROUGE (rendu émissif dans la couleur de la ligne)
//  - hauteur 60 px, largeur libre (≈ 170-350 px), ancrées à gauche
// Le plan careerText du GLB est mis à l'échelle (largeur_px / 202) par
// scripts/jeremyWorld.mjs — les deux scripts partagent ces dimensions.

import fs from 'node:fs'
import sharp from 'sharp'
import opentype from 'opentype.js'

const font = opentype.parse(fs.readFileSync('jeremy/fonts/Poppins-Bold.ttf').buffer)
const capRatio = (font.tables.os2?.sCapHeight ?? 700) / font.unitsPerEm

const H = 60
const MAX_W = 352
const PAD = 4

const strips = [
    { name: 'careerUps', title: 'PAUL SABATIER', detail: 'BSC COMPUTER SCIENCE - 1ST/180' },
    { name: 'careerEnseeiht', title: 'ENSEEIHT', detail: 'ENGINEERING DEGREE - CS & AI' },
    { name: 'careerN7', title: 'N7 CONSULTING', detail: 'IT CONSULTANT - JUNIOR-ENTERPRISE' },
    { name: 'careerLulea', title: 'LULEÅ UNIVERSITY', detail: 'MAGISTER IN DATA SCIENCE' },
    { name: 'careerAlten', title: 'ALTEN - TOULOUSE', detail: 'BUSINESS ANALYST, THEN MANAGER' },
]

const widthOf = (text, cap) => font.getAdvanceWidth(text, cap / capRatio)
const pathOf = (text, x, baseline, cap) => font.getPath(text, x, baseline, cap / capRatio).toPathData(2)

const sizes = {}

for (const strip of strips) {
    // Corps de texte : réduit d'un même facteur si la ligne la plus large déborde
    let capTitle = 22
    let capDetail = 15
    const maxText = MAX_W - PAD * 2 - 4
    const over = Math.max(widthOf(strip.title, capTitle), widthOf(strip.detail, capDetail)) / maxText
    if (over > 1) {
        capTitle /= over
        capDetail /= over
    }

    const wTitle = widthOf(strip.title, capTitle)
    const wDetail = widthOf(strip.detail, capDetail)

    const plate1 = { x: 0, y: 2, w: wTitle + PAD * 2, h: capTitle + 8 }
    const plate2H = capDetail + 8
    const plate2 = { x: 0, y: H - 2 - plate2H, w: wDetail + PAD * 2, h: plate2H }
    const baseline1 = plate1.y + 4 + capTitle
    const baseline2 = plate2.y + 4 + capDetail

    const width = Math.ceil(Math.max(plate1.w, plate2.w) + 2)
    const W = width + ((4 - (width % 4)) % 4)

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#000000"/>
<rect x="${plate1.x}" y="${plate1.y}" width="${plate1.w.toFixed(1)}" height="${plate1.h.toFixed(1)}" fill="#00ff00"/>
<rect x="${plate2.x}" y="${plate2.y.toFixed(1)}" width="${plate2.w.toFixed(1)}" height="${plate2.h.toFixed(1)}" fill="#00ff00"/>
<path d="${pathOf(strip.title, PAD, baseline1, capTitle)}" fill="#ff0000"/>
<path d="${pathOf(strip.detail, PAD, baseline2, capDetail)}" fill="#ff0000"/>
</svg>`

    await sharp(Buffer.from(svg)).ensureAlpha().png().toFile(`static/career/${strip.name}.png`)
    sizes[strip.name] = { w: W, h: H }
    console.log(`+ ${strip.name}.png ${W}x${H} (caps ${capTitle.toFixed(1)}/${capDetail.toFixed(1)})`)
}

// Dimensions partagées avec jeremyWorld.mjs (échelle des plans careerText)
fs.writeFileSync('scripts/careerSizes.json', JSON.stringify(sizes, null, 2))

// Bandeaux d'origine remplacés (png + ktx)
for (const stale of ['careerFreelancer', 'careerHetic', 'careerIRLTeacher', 'careerImmersiveGarden', 'careerOnlineTeacher', 'careerUzik']) {
    for (const ext of ['png', 'ktx']) {
        const p = `static/career/${stale}.${ext}`
        if (fs.existsSync(p)) { fs.unlinkSync(p); console.log(`- ${p}`) }
    }
}
console.log('OK')
