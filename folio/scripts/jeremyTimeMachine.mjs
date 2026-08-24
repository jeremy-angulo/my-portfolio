// scripts/jeremyTimeMachine.mjs
// Écrans CRT de la time machine (140×124) : captures des deux facettes du
// site déployé. L'écran principal montre /tech (la machine ouvre cette page),
// le second — révélé en cognant la TV — montre la facette jour.

import { chromium } from '/home/jeremy/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
import sharp from 'sharp'

const shots = [
    { url: 'https://jeremyangulo.fr/tech', out: 'static/timeMachine/timeMachineScreenFolio.png' },
    { url: 'https://jeremyangulo.fr/', out: 'static/timeMachine/timeMachineScreenMGS.png' },
]

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1120, height: 992 } })

for (const shot of shots) {
    await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(3500)
    const buffer = await page.screenshot()
    await sharp(buffer).resize(140, 124, { fit: 'cover' }).png().toFile(shot.out)
    console.log(`+ ${shot.out} ← ${shot.url}`)
}

await browser.close()
console.log('OK')
