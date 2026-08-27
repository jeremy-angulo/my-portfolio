// scripts/jeremyLab.mjs
// Génère les vignettes du lab (static/lab/images/) : 960×540 + minis 240×136.
// Jules Orchestrator utilise sa vraie capture d'écran ; les autres gardent la
// carte stylisée, avec un sous-titre court qui nomme la compétence.
// Texte en chemins opentype (aucune dépendance fontconfig), rendu via sharp.

import fs from 'node:fs'
import sharp from 'sharp'
import opentype from 'opentype.js'

const font = opentype.parse(fs.readFileSync('jeremy/fonts/Poppins-Bold.ttf').buffer)
const capRatio = (font.tables.os2?.sCapHeight ?? 700) / font.unitsPerEm

const W = 960
const H = 540

const items = [
    { key: 'jules-orchestrator', title: 'Jules Orchestrator', subtitle: 'MULTI-AGENT AI ORCHESTRATOR', accent: '#915eff', screenshot: 'jeremy/images/Jules-Orchestrator-Screenshot.png' },
    { key: 'youwant', title: 'YouWant', subtitle: 'SERVICES MARKETPLACE — NEXT.JS', accent: '#3dbbe7' },
    { key: 'trefle-ai', title: 'Trefle AI', subtitle: 'CUSTOM AI ASSISTANT — LLM', accent: '#91ad78' },
    { key: 'pipeline-cac40', title: 'Pipeline CAC40', subtitle: 'AUTOMATED MARKET-DATA PIPELINE', accent: '#ec3f1c' },
    { key: 'router-simulator', title: 'Router Simulator', subtitle: 'NETWORK ROUTING — ADA', accent: '#f8a658' },
    { key: 'text-mining', title: 'Text Mining', subtitle: 'NLP & TEXT CLASSIFICATION — PYTHON', accent: '#ed719f' },
    { key: 'data-visualization', title: 'Data Visualization', subtitle: 'DATA STORYTELLING — PYTHON', accent: '#c366ef' },
]

// Un glyphe à la fois (bug NaN d'opentype.js sur les chaînes entières)
const glyphPaths = (text, cap, startX, baseline, fill, opacity = 1) =>
{
    const fontSize = cap / capRatio
    let cursor = startX
    let out = ''
    for(const char of text)
    {
        let d = font.getPath(char, 0, 0, fontSize).toPathData(3)
        if(d.includes('NaN')) d = font.getPath(char, 0.0137, 0, fontSize).toPathData(3)
        if(d.includes('NaN')) throw new Error(`NaN dans « ${char} »`)
        if(d.length) out += `<path d="${d}" fill="${fill}" fill-opacity="${opacity}" transform="translate(${cursor.toFixed(2)} ${baseline})"/>`
        cursor += font.getAdvanceWidth(char, fontSize)
    }
    return out
}

const measure = (text, cap) =>
{
    const fontSize = cap / capRatio
    let width = 0
    for(const char of text) width += font.getAdvanceWidth(char, fontSize)
    return width
}

const centered = (text, cap, cx, baseline, fill, opacity = 1) =>
    glyphPaths(text, cap, cx - measure(text, cap) / 2, baseline, fill, opacity)

const fit = (text, cap, maxWidth) =>
{
    const width = measure(text, cap)
    return width > maxWidth ? cap * (maxWidth / width) : cap
}

// Grille discrète en fond (cartes stylisées)
let grid = ''
for(let x = 60; x < W; x += 60) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ffffff" stroke-opacity="0.03"/>`
for(let y = 60; y < H; y += 60) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff" stroke-opacity="0.03"/>`

for(const item of items)
{
    let png

    if(item.screenshot)
    {
        // Capture plein cadre + voile dégradé en bas portant titre et sous-titre
        const meta = await sharp(item.screenshot).metadata()
        let width = meta.width
        let height = Math.round(width * H / W)
        if(height > meta.height) { height = meta.height; width = Math.round(height * W / H) }

        const visual = await sharp(item.screenshot)
            .extract({ left: Math.round((meta.width - width) / 2), top: 0, width, height })
            .resize(W, H)
            .png()
            .toBuffer()

        const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
<stop offset="0.55" stop-color="#050816" stop-opacity="0"/>
<stop offset="1" stop-color="#050816" stop-opacity="0.94"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#fade)"/>
<rect x="40" y="${H - 92}" width="52" height="4" rx="2" fill="${item.accent}"/>
${glyphPaths(item.title.toUpperCase(), 34, 40, H - 44, '#f5f2ff')}
${glyphPaths(item.subtitle, 15, 44, H - 16, item.accent)}
</svg>`

        png = await sharp(visual).composite([ { input: Buffer.from(overlay) } ]).png().toBuffer()
    }
    else
    {
        const capTitle = fit(item.title, 74, W - 160)
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
<radialGradient id="glow" cx="0.5" cy="0.42" r="0.75">
<stop offset="0" stop-color="${item.accent}" stop-opacity="0.28"/>
<stop offset="0.55" stop-color="${item.accent}" stop-opacity="0.07"/>
<stop offset="1" stop-color="${item.accent}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#0b1026"/>
<stop offset="1" stop-color="#050816"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${grid}
<rect width="${W}" height="${H}" fill="url(#glow)"/>
<circle cx="${W / 2}" cy="228" r="150" fill="none" stroke="${item.accent}" stroke-opacity="0.35" stroke-width="2"/>
<circle cx="${W / 2}" cy="228" r="176" fill="none" stroke="${item.accent}" stroke-opacity="0.12" stroke-width="1.5"/>
${centered(item.title, capTitle, W / 2, 258, '#f5f2ff')}
${centered(item.subtitle, 21, W / 2, 330, item.accent, 0.95)}
<rect x="${W / 2 - 26}" y="368" width="52" height="4" rx="2" fill="${item.accent}"/>
${centered('LAB — JEREMY ANGULO', 14, W / 2, 496, '#8a87a8')}
</svg>`

        png = await sharp(Buffer.from(svg)).png().toBuffer()
    }

    await sharp(png).toFile(`static/lab/images/${item.key}.png`)
    await sharp(png).resize(240, 136, { fit: 'cover' }).toFile(`static/lab/images/${item.key}-mini.png`)
    console.log(`+ ${item.key}.png / -mini.png`)
}

// Vignettes qui ne sont plus référencées (dont aurum-acta, devenu le projet
// L'Authentique Azuréenne dans la zone projets)
const keep = new Set(items.flatMap((i) => [ `${i.key}.png`, `${i.key}-mini.png` ]))
for(const file of fs.readdirSync('static/lab/images'))
{
    if(!keep.has(file))
    {
        fs.unlinkSync(`static/lab/images/${file}`)
        console.log(`- ${file}`)
    }
}
console.log('OK')
