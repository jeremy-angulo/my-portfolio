// scripts/jeremyCareer.mjs
// Génère les bandeaux de la zone carrière (static/career/*.png), en anglais et
// en français (suffixe -fr), pour les 6 jalons du parcours de Jérémy.
//
// Convention relevée sur les bandeaux d'origine :
//  - fond noir (transparent au rendu : alpha = step(0.1, max(r, g)))
//  - plaque VERTE derrière chaque ligne (rendue en plaque sombre #251f2b)
//  - texte ROUGE (rendu émissif dans la couleur de la ligne)
//  - hauteur 60 px
//
// Toutes les images partagent la MÊME largeur : l'échelle du plan careerText
// est figée dans le GLB, elle ne peut pas dépendre de la langue. Le bloc de
// texte est donc centré dans une toile de largeur constante.

import fs from 'node:fs'
import sharp from 'sharp'
import opentype from 'opentype.js'

const font = opentype.parse(fs.readFileSync('jeremy/fonts/Poppins-Bold.ttf').buffer)
const capRatio = (font.tables.os2?.sCapHeight ?? 700) / font.unitsPerEm

const H = 60
const W = 352          // largeur commune à tous les bandeaux (3.49 unités en jeu)
const PAD = 4
const MAX_TEXT = W - PAD * 2 - 12
const MAX_INK = H - 4 - 16   // les deux plaques (8 px de marge chacune) dans les 60 px

const strips = [
    {
        name: 'careerSabatier',
        en: { title: 'PAUL SABATIER', detail: 'BSC COMPUTER SCIENCE - 1ST/180' },
        fr: { title: 'PAUL SABATIER', detail: 'LICENCE INFORMATIQUE - 1ER/180' },
    },
    {
        name: 'careerEnseeiht',
        en: { title: 'ENSEEIHT', detail: 'ENGINEERING DEGREE - CS & AI' },
        fr: { title: 'ENSEEIHT', detail: "DIPLÔME D'INGÉNIEUR - INFO & IA" },
    },
    {
        name: 'careerN7',
        en: { title: 'N7 CONSULTING', detail: 'IT CONSULTANT - JUNIOR-ENTERPRISE' },
        fr: { title: 'N7 CONSULTING', detail: 'CONSULTANT IT - JUNIOR-ENTREPRISE' },
    },
    {
        name: 'careerLulea',
        en: { title: 'LULEÅ UNIVERSITY', detail: 'MSC DATA SCIENCE - SWEDEN' },
        fr: { title: 'UNIVERSITÉ DE LULEÅ', detail: 'MAGISTÈRE DATA SCIENCE - SUÈDE' },
    },
    {
        name: 'careerAnalyst',
        en: { title: 'ALTEN - NAVBLUE', detail: 'BUSINESS ANALYST' },
        fr: { title: 'ALTEN - NAVBLUE', detail: 'BUSINESS ANALYST' },
    },
    {
        name: 'careerManager',
        en: { title: 'ALTEN - TOULOUSE', detail: 'BUSINESS MANAGER' },
        fr: { title: 'ALTEN - TOULOUSE', detail: "INGÉNIEUR D'AFFAIRES" },
    },
    {
        name: 'careerBafaAnim',
        en: { title: 'CAMP COUNSELOR', detail: 'BAFA - YOUTH SUMMER CAMPS' },
        fr: { title: 'ANIMATEUR BAFA', detail: 'COLONIES DE VACANCES' },
    },
    {
        name: 'careerBafaTrainer',
        en: { title: 'BAFA TRAINER', detail: 'TRAINS NEW COUNSELORS' },
        fr: { title: 'FORMATEUR BAFA', detail: 'FORME LES NOUVEAUX ANIMATEURS' },
    },
    {
        name: 'careerBafaDirector',
        en: { title: 'CAMP DIRECTOR', detail: 'LARGE-SCALE YOUTH CAMPS' },
        fr: { title: 'DIRECTEUR DE SÉJOURS', detail: 'GRANDES COLONIES DE VACANCES' },
    },
    {
        name: 'careerClimbInit',
        en: { title: 'CLIMBING INITIATOR', detail: 'FEDERAL DIPLOMA' },
        fr: { title: 'INITIATEUR ESCALADE', detail: 'DIPLÔME FÉDÉRAL' },
    },
    {
        name: 'careerClimbMonitor',
        en: { title: 'CLIMBING COACH', detail: 'PAUL SABATIER UNIVERSITY' },
        fr: { title: 'MONITEUR ESCALADE', detail: 'UNIVERSITÉ PAUL SABATIER' },
    },
    {
        name: 'careerClimbPresident',
        en: { title: 'CLUB PRESIDENT', detail: 'TOULOUSE INP CLIMBING CLUB' },
        fr: { title: 'PRÉSIDENT DU CLUB', detail: 'ESCALADE TOULOUSE INP' },
    },
    {
        name: 'careerClimbSweden',
        en: { title: 'CLIMBING COACH', detail: 'KLÄTTERHUSET - SWEDEN' },
        fr: { title: 'MONITEUR ESCALADE', detail: 'KLÄTTERHUSET - SUÈDE' },
    },
]

// En-têtes de colonnes : une seule plaque, texte centré
const headers = [
    { name: 'careerHeadStudies', en: 'STUDIES', fr: 'ÉTUDES' },
    { name: 'careerHeadWork', en: 'EXPERIENCE', fr: 'EXPÉRIENCE' },
    { name: 'careerHeadBafa', en: 'BAFA', fr: 'BAFA' },
    { name: 'careerHeadClimb', en: 'CLIMBING', fr: 'ESCALADE' },
]
const HEADER_W = 220
const HEADER_H = 40

const widthOf = (text, cap) =>
{
    const fontSize = cap / capRatio
    let width = 0
    for(const char of text)
        width += font.getAdvanceWidth(char, fontSize)
    return width
}

// Hauteur réelle d'encre au-dessus de la ligne de base : les accents des
// capitales (Å, É, Ô) montent plus haut que la hauteur de capitale et se
// faisaient rogner par le bord de la plaque
const inkTop = (text, cap) =>
{
    const fontSize = cap / capRatio
    let top = cap
    for(const char of text)
    {
        const box = font.getPath(char, 0, 0, fontSize).getBoundingBox()
        if(isFinite(box.y1))
            top = Math.max(top, - box.y1)
    }
    return top
}

// Un glyphe à la fois, tracé à l'origine puis translaté : font.getPath sur une
// chaîne entière produit parfois des NaN (bug opentype.js lié à la position),
// ce qui tronque le rendu en plein mot
const pathOf = (text, x, baseline, cap) =>
{
    const fontSize = cap / capRatio
    let out = ''
    let cursor = x
    for(const char of text)
    {
        let d = font.getPath(char, 0, 0, fontSize).toPathData(3)

        if(d.includes('NaN'))
            d = font.getPath(char, 0.0137, 0, fontSize).toPathData(3)

        if(d.includes('NaN'))
            throw new Error(`NaN dans le tracé de « ${char} » (cap ${cap})`)

        if(d.length)
            out += `<path d="${d}" fill="#ff0000" transform="translate(${cursor.toFixed(2)} ${baseline.toFixed(2)})"/>`

        cursor += font.getAdvanceWidth(char, fontSize)
    }
    return out
}

const sizes = {}

for(const strip of strips)
{
    for(const [ lang, text ] of [ [ 'en', strip.en ], [ 'fr', strip.fr ] ])
    {
        // Corps de texte réduit d'un même facteur si la ligne la plus large
        // déborde en largeur, puis si les deux plaques ne tiennent plus en hauteur
        let capTitle = 22
        let capDetail = 15

        const overW = Math.max(widthOf(text.title, capTitle), widthOf(text.detail, capDetail)) / MAX_TEXT
        if(overW > 1)
        {
            capTitle /= overW
            capDetail /= overW
        }

        const overH = (inkTop(text.title, capTitle) + inkTop(text.detail, capDetail)) / MAX_INK
        if(overH > 1)
        {
            capTitle /= overH
            capDetail /= overH
        }

        const wTitle = widthOf(text.title, capTitle)
        const wDetail = widthOf(text.detail, capDetail)
        const inkTitle = inkTop(text.title, capTitle)
        const inkDetail = inkTop(text.detail, capDetail)

        // Le bloc garde ses deux plaques alignées à gauche, et c'est le bloc
        // entier qui est centré dans la toile
        const blockW = Math.max(wTitle, wDetail) + PAD * 2
        const left = (W - blockW) / 2

        const plate1 = { x: left, y: 2, w: wTitle + PAD * 2, h: inkTitle + 8 }
        const plate2H = inkDetail + 8
        const plate2 = { x: left, y: H - 2 - plate2H, w: wDetail + PAD * 2, h: plate2H }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#000000"/>
<rect x="${plate1.x.toFixed(1)}" y="${plate1.y}" width="${plate1.w.toFixed(1)}" height="${plate1.h.toFixed(1)}" fill="#00ff00"/>
<rect x="${plate2.x.toFixed(1)}" y="${plate2.y.toFixed(1)}" width="${plate2.w.toFixed(1)}" height="${plate2.h.toFixed(1)}" fill="#00ff00"/>
${pathOf(text.title, left + PAD, plate1.y + 4 + inkTitle, capTitle)}
${pathOf(text.detail, left + PAD, plate2.y + 4 + inkDetail, capDetail)}
</svg>`

        const file = `static/career/${strip.name}${lang === 'fr' ? '-fr' : ''}.png`
        await sharp(Buffer.from(svg)).ensureAlpha().png().toFile(file)
        console.log(`+ ${file} (caps ${capTitle.toFixed(1)}/${capDetail.toFixed(1)})`)
    }

    sizes[strip.name] = { w: W, h: H }
}

for(const header of headers)
{
    for(const [ lang, text ] of [ [ 'en', header.en ], [ 'fr', header.fr ] ])
    {
        let cap = 24
        const maxW = HEADER_W - PAD * 2 - 10
        const overW = widthOf(text, cap) / maxW
        if(overW > 1) cap /= overW

        const ink = inkTop(text, cap)
        const plate = { w: widthOf(text, cap) + PAD * 2, h: ink + 8 }
        const left = (HEADER_W - plate.w) / 2
        const top = (HEADER_H - plate.h) / 2

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${HEADER_W}" height="${HEADER_H}">
<rect width="${HEADER_W}" height="${HEADER_H}" fill="#000000"/>
<rect x="${left.toFixed(1)}" y="${top.toFixed(1)}" width="${plate.w.toFixed(1)}" height="${plate.h.toFixed(1)}" fill="#00ff00"/>
${pathOf(text, left + PAD, top + 4 + ink, cap)}
</svg>`

        const file = `static/career/${header.name}${lang === 'fr' ? '-fr' : ''}.png`
        await sharp(Buffer.from(svg)).ensureAlpha().png().toFile(file)
        console.log(`+ ${file} (cap ${cap.toFixed(1)})`)
    }

    sizes[header.name] = { w: HEADER_W, h: HEADER_H }
}

// Dimensions partagées avec jeremyCareerWorld.mjs (échelle des plans careerText)
fs.writeFileSync('scripts/careerSizes.json', JSON.stringify(sizes, null, 2))

// Bandeaux qui ne sont plus référencés
const keep = new Set([ ...strips, ...headers ].flatMap(s => [ `${s.name}.png`, `${s.name}-fr.png` ]))
for(const file of fs.readdirSync('static/career'))
{
    if(!keep.has(file))
    {
        fs.unlinkSync(`static/career/${file}`)
        console.log(`- static/career/${file}`)
    }
}

console.log('OK')
