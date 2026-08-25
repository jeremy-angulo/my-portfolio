// scripts/jeremyMenuArt.mjs
// 1. Preview du menu « options » (600×600) : carte titre JEREMY ANGULO dans la
//    DA du monde (l'ancienne image montrait les lettres de l'auteur d'origine)
// 2. Preview du menu « circuit » (600×600) : extrait de la carte du monde
//    (l'ancienne montrait une banderole de marque tierce)
// 3. Banderole du circuit (512×128) : même gabarit que la texture circuitBrand
//    d'origine, au nom de Jérémy — consommée ensuite par jeremyBrand.mjs
// Les previews inutilisées (whispers, easter) sont supprimées.

import fs from 'node:fs'
import sharp from 'sharp'
import opentype from 'opentype.js'

const font = opentype.parse(fs.readFileSync('jeremy/fonts/Poppins-Bold.ttf').buffer)
const capRatio = (font.tables.os2?.sCapHeight ?? 700) / font.unitsPerEm

// Chaque glyphe est tracé à l'origine puis positionné par transform SVG :
// font.getPath à une abscisse arbitraire produit parfois des NaN (bug
// opentype.js dépendant de la position), ce qui tronque le rendu librsvg
const textPath = (text, cap, cx, baseline, fill, extra = '') =>
{
    const fontSize = cap / capRatio

    let width = 0
    for(const char of text)
        width += font.getAdvanceWidth(char, fontSize)

    let x = cx - width / 2
    let parts = ''
    for(const char of text)
    {
        let d = font.getPath(char, 0, 0, fontSize).toPathData(3)

        if(d.includes('NaN'))
            d = font.getPath(char, 0.0137, 0, fontSize).toPathData(3)

        if(d.includes('NaN'))
            throw new Error(`NaN dans le tracé de « ${char} » (cap ${cap})`)

        if(d.length)
            parts += `<path d="${d}" fill="${fill}" transform="translate(${x.toFixed(2)} ${baseline})"${extra}/>`

        x += font.getAdvanceWidth(char, fontSize)
    }

    return parts
}

const fit = (text, cap, maxWidth) =>
{
    const width = font.getAdvanceWidth(text, cap / capRatio)
    return width > maxWidth ? cap * (maxWidth / width) : cap
}

/**
 * 1. Preview options : capture du monde fournie par Jérémy, recadrée au carré
 *    sur la voiture et le nom (le panneau du menu la recadre encore en
 *    object-fit: cover, d'où le carré plutôt qu'un panoramique)
 */
{
    const png = await sharp('jeremy/images/landing-screenshot.png')
        .extract({ left: 150, top: 60, width: 1510, height: 1510 })
        .resize(600, 600)
        .png()
        .toBuffer()

    await sharp(png).toFile('static/ui/previews/options.png')
    await sharp(png).webp({ quality: 86 }).toFile('static/ui/previews/options.webp')
    console.log('+ previews/options')
}

/**
 * 2. Preview circuit : zoom de la carte du monde sur la boucle du circuit
 */
{
    const png = await sharp('static/ui/map/map-day.png')
        .extract({ left: 16, top: 16, width: 484, height: 484 })
        .resize(600, 600)
        .png()
        .toBuffer()
    await sharp(png).toFile('static/ui/previews/circuit.png')
    await sharp(png).webp({ quality: 82 }).toFile('static/ui/previews/circuit.webp')
    console.log('+ previews/circuit')
}

/**
 * 3. Banderole circuitBrand (512×128) : fond identique, nom de Jérémy,
 *    tirets de vitesse violets comme l'originale
 */
{
    const W = 512
    const H = 128

    const dash = (x, y, w) => `<path d="M ${x} ${y} L ${x + w} ${y} L ${x + w - 10} ${y + 10} L ${x - 10} ${y + 10} Z" fill="#d183fb"/>`

    const capBrand = fit('JEREMY ANGULO', 40, W - 150)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#463F35"/>
${dash(30, 12, 90)}
${dash(150, 12, 60)}
${dash(400, 22, 80)}
${dash(24, 104, 70)}
${dash(360, 96, 50)}
${dash(438, 104, 60)}
${textPath('JEREMY ANGULO', capBrand, W / 2, H / 2 + capBrand / 2 - 4, '#ffffff')}
</svg>`

    await sharp(Buffer.from(svg)).png().toFile('scripts/circuitBrand.png')
    console.log('+ scripts/circuitBrand.png')
}

// Previews orphelines
for(const file of ['whispers.png', 'whispers.webp', 'easter.png', 'easter.webp'])
{
    const path = `static/ui/previews/${file}`
    if(fs.existsSync(path))
    {
        fs.unlinkSync(path)
        console.log(`- previews/${file}`)
    }
}

console.log('OK')
