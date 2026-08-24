// scripts/jeremyLab.mjs
// Génère les vignettes du lab (static/lab/images/) : 960×540 + minis 240×136,
// mêmes gabarits que les vignettes d'origine. Texte en chemins opentype
// (aucune dépendance fontconfig), rendu via sharp.

import fs from 'node:fs'
import sharp from 'sharp'
import opentype from 'opentype.js'

const font = opentype.parse(fs.readFileSync('jeremy/fonts/Poppins-Bold.ttf').buffer)
const capRatio = (font.tables.os2?.sCapHeight ?? 700) / font.unitsPerEm

const W = 960
const H = 540

const items = [
    { key: 'jules-orchestrator', title: 'Jules Orchestrator', subtitle: 'AI AGENTS ORCHESTRATION', accent: '#915eff' },
    { key: 'aurum-acta', title: 'Aurum Acta', subtitle: 'LOCAL-FIRST NOTARY PLATFORM', accent: '#e4a90c' },
    { key: 'youwant', title: 'YouWant', subtitle: 'LOCAL SERVICES MARKETPLACE', accent: '#3dbbe7' },
    { key: 'trefle-ai', title: 'Trefle AI', subtitle: 'AI ASSISTANT EXPERIMENTS', accent: '#91ad78' },
    { key: 'pipeline-cac40', title: 'Pipeline CAC40', subtitle: 'MARKET DATA PIPELINE', accent: '#ec3f1c' },
    { key: 'router-simulator', title: 'Router Simulator', subtitle: 'NETWORK SIMULATION IN ADA', accent: '#f8a658' },
    { key: 'text-mining', title: 'Text Mining', subtitle: 'NLP NOTEBOOKS', accent: '#ed719f' },
    { key: 'data-visualization', title: 'Data Visualization', subtitle: 'DATAVIZ NOTEBOOKS', accent: '#c366ef' },
]

const textPath = (text, cap, cx, baseline, fill, opacity = 1) => {
    const fontSize = cap / capRatio
    const width = font.getAdvanceWidth(text, fontSize)
    const d = font.getPath(text, cx - width / 2, baseline, fontSize).toPathData(2)
    return `<path d="${d}" fill="${fill}" fill-opacity="${opacity}"/>`
}

const fit = (text, cap, maxWidth) => {
    const width = font.getAdvanceWidth(text, cap / capRatio)
    return width > maxWidth ? cap * (maxWidth / width) : cap
}

// Grille discrète en fond
let grid = ''
for (let x = 60; x < W; x += 60) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#ffffff" stroke-opacity="0.03"/>`
for (let y = 60; y < H; y += 60) grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffffff" stroke-opacity="0.03"/>`

for (const item of items) {
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
${textPath(item.title, capTitle, W / 2, 258, '#f5f2ff')}
${textPath(item.subtitle, 21, W / 2, 330, item.accent, 0.95)}
<rect x="${W / 2 - 26}" y="368" width="52" height="4" rx="2" fill="${item.accent}"/>
${textPath('LAB — JEREMY ANGULO', 14, W / 2, 496, '#8a87a8')}
</svg>`

    const png = await sharp(Buffer.from(svg)).png().toBuffer()
    await sharp(png).toFile(`static/lab/images/${item.key}.png`)
    await sharp(png).resize(240, 136, { fit: 'cover' }).toFile(`static/lab/images/${item.key}-mini.png`)
    console.log(`+ ${item.key}.png / -mini.png`)
}

// Vignettes d'origine remplacées
const keep = new Set(items.flatMap((i) => [`${i.key}.png`, `${i.key}-mini.png`]))
for (const file of fs.readdirSync('static/lab/images')) {
    if (!keep.has(file)) {
        fs.unlinkSync(`static/lab/images/${file}`)
        console.log(`- ${file}`)
    }
}
console.log('OK')
