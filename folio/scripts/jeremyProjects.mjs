// scripts/jeremyProjects.mjs
// Génère les 9 vignettes de la zone projets (static/projects/images/, 960×540)
// avec un gabarit commun : visuel plein cadre (capture, photo ou logo sur fond
// teinté) + bandeau titre — plusieurs vignettes d'origine n'avaient aucun nom
// visible (Continent Phone, CNES, MAN-3D…).
//
// Sources : captures dans jeremy/images/, logos du site dans ../src/assets/.

import fs from 'node:fs'
import sharp from 'sharp'
import opentype from 'opentype.js'

const font = opentype.parse(fs.readFileSync('jeremy/fonts/Poppins-Bold.ttf').buffer)
const capRatio = (font.tables.os2?.sCapHeight ?? 700) / font.unitsPerEm

const W = 960
const H = 540
const BAND = 96                 // bandeau titre en bas
const VISUAL_H = H - BAND       // 444

const ASSETS = '/home/jeremy/dev/jeremyangulo/src/assets'

// Un glyphe à la fois (bug NaN d'opentype.js sur les chaînes entières)
const textPath = (text, cap, x, baseline, fill, align = 'left') =>
{
    const fontSize = cap / capRatio
    let width = 0
    for(const char of text) width += font.getAdvanceWidth(char, fontSize)

    let cursor = align === 'left' ? x : x - width
    let out = ''
    for(const char of text)
    {
        let d = font.getPath(char, 0, 0, fontSize).toPathData(3)
        if(d.includes('NaN')) d = font.getPath(char, 0.0137, 0, fontSize).toPathData(3)
        if(d.includes('NaN')) throw new Error(`NaN dans « ${char} »`)
        if(d.length) out += `<path d="${d}" fill="${fill}" transform="translate(${cursor.toFixed(2)} ${baseline})"/>`
        cursor += font.getAdvanceWidth(char, fontSize)
    }
    return out
}

// Bandeau : barre d'accent + nom + descripteur court
const band = (title, detail, accent) =>
{
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect x="0" y="${VISUAL_H}" width="${W}" height="${BAND}" fill="#16233a"/>
<rect x="0" y="${VISUAL_H}" width="${W}" height="4" fill="${accent}"/>
${textPath(title, 28, 30, VISUAL_H + 48, '#ffffff')}
${textPath(detail, 13, 30, VISUAL_H + 78, accent)}
</svg>`
    return Buffer.from(svg)
}

// Recadrage « cover » d'une source vers 960×444
const coverVisual = async (input, options = {}) =>
{
    const image = sharp(input)
    const meta = await image.metadata()
    const targetRatio = W / VISUAL_H

    let width = meta.width
    let height = Math.round(width / targetRatio)
    if(height > meta.height)
    {
        height = meta.height
        width = Math.round(height * targetRatio)
    }

    const left = Math.min(Math.max(options.left ?? Math.round((meta.width - width) / 2), 0), meta.width - width)
    const top = Math.min(Math.max(options.top ?? Math.round((meta.height - height) / 2), 0), meta.height - height)

    return image.extract({ left, top, width, height }).resize(W, VISUAL_H).png().toBuffer()
}

// Logo ou artwork centré sur un fond dégradé teinté
const tintedVisual = async (input, from, to, maxWidth, maxHeight) =>
{
    const artwork = await sharp(input)
        .resize(maxWidth, maxHeight, { fit: 'inside' })
        .png()
        .toBuffer()
    const meta = await sharp(artwork).metadata()

    const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${VISUAL_H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="0.7" y2="1">
<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
</linearGradient></defs>
<rect width="${W}" height="${VISUAL_H}" fill="url(#g)"/>
</svg>`

    return sharp(Buffer.from(bg))
        .composite([ { input: artwork, left: Math.round((W - meta.width) / 2), top: Math.round((VISUAL_H - meta.height) / 2) } ])
        .png()
        .toBuffer()
}

const tiles = [
    {
        file: 'the-openers-1',
        title: 'THE OPENERS',
        detail: 'REAL-ESTATE STREAMING NETWORK',
        accent: '#8b7cf8',
        visual: () => coverVisual('jeremy/images/The-Openers-Screenshot.png', { top: 0 }),
    },
    {
        file: 'authentique-azureenne-1',
        title: 'L’AUTHENTIQUE AZURÉENNE',
        detail: 'LOCAL-FIRST NOTARY PLATFORM',
        accent: '#d9b25a',
        visual: () => coverVisual('jeremy/images/Authentique_Azureenne.png', { top: 0 }),
    },
    {
        file: 'storizzz-1',
        title: 'STORIZZZ',
        detail: 'AI BEDTIME-STORIES APP',
        accent: '#5fb4f2',
        visual: async () => coverVisual(
            await sharp(`${ASSETS}/Presentation_Storizzz.png`).flatten({ background: '#eaf4fd' }).png().toBuffer()),
    },
    {
        file: 'ai-ski-coach-1',
        title: 'AI SKI COACH',
        detail: 'COMPUTER-VISION SKI ANALYSIS',
        accent: '#3dbbe7',
        // Visuel d'origine (photo + titre de la thèse), figé dans jeremy/images
        // pour que le script reste ré-exécutable
        visual: () => coverVisual('jeremy/images/ai-ski-thesis.png', { top: 96 }),
    },
    {
        file: 'cnes-aerosat-1',
        title: 'CNES · AEROSAT',
        detail: 'NANO-SATELLITE MISSION SOFTWARE',
        accent: '#5b9ef2',
        visual: () => tintedVisual(`${ASSETS}/Logo_CNES_White.png`, '#0b1e3a', '#16345e', 460, 260),
    },
    {
        file: 'boost-1',
        title: 'BOOST',
        detail: 'CUSTOM SAAS PLATFORM FOR JUMP',
        accent: '#f8a658',
        visual: () => tintedVisual(`${ASSETS}/Presentation_Boost.png`, '#fff6ec', '#ffe4c7', 560, 330),
    },
    {
        file: 'continent-phone-1',
        title: 'CONTINENT PHONE',
        detail: 'REAL-TIME CALL TRANSLATION · AI R&D',
        accent: '#4a86f0',
        visual: () => tintedVisual(`${ASSETS}/Logo_ContinentPhone.png`, '#eef3fd', '#d8e4f8', 340, 320),
    },
    {
        file: 'man-3d-1',
        title: 'MAN-3D',
        detail: 'CUSTOM 3D SCANNER · ANATOMY MUSEUM',
        accent: '#9d7bf5',
        visual: () => coverVisual(`${ASSETS}/Digital_Machine.png`),
    },
    {
        file: 'bocalenvers-1',
        title: 'BOCALENVERS',
        detail: 'MOBILE APP FOR A SOLIDARITY CANNERY',
        accent: '#b264c4',
        visual: () => tintedVisual(`${ASSETS}/Logo_Bocalenvers.png`, '#f7f3fa', '#eadef2', 620, 330),
    },
]

for(const tile of tiles)
{
    const visual = await tile.visual()
    await sharp({ create: { width: W, height: H, channels: 3, background: '#16233a' } })
        .composite([
            { input: visual, left: 0, top: 0 },
            { input: band(tile.title, tile.detail, tile.accent), left: 0, top: 0 },
        ])
        .png()
        .toFile(`static/projects/images/${tile.file}.png`)
    console.log(`+ ${tile.file}.png`)
}

// Fichiers qui ne sont plus référencés
const keep = new Set(tiles.map((t) => `${t.file}.png`))
for(const file of fs.readdirSync('static/projects/images'))
{
    if(!keep.has(file))
    {
        fs.unlinkSync(`static/projects/images/${file}`)
        console.log(`- ${file}`)
    }
}

console.log('OK')
