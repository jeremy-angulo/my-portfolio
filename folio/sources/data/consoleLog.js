import * as THREE from 'three/webgpu'

const text = `
     ██╗ ███████╗ ██████╗  ███████╗ ███╗   ███╗ ██╗   ██╗
     ██║ ██╔════╝ ██╔══██╗ ██╔════╝ ████╗ ████║ ╚██╗ ██╔╝
     ██║ █████╗   ██████╔╝ █████╗   ██╔████╔██║  ╚████╔╝
██   ██║ ██╔══╝   ██╔══██╗ ██╔══╝   ██║╚██╔╝██║   ╚██╔╝
╚█████╔╝ ███████╗ ██║  ██║ ███████╗ ██║ ╚═╝ ██║    ██║
 ╚════╝  ╚══════╝ ╚═╝  ╚═╝ ╚══════╝ ╚═╝     ╚═╝    ╚═╝

 █████╗  ███╗   ██╗  ██████╗  ██╗   ██╗ ██╗      ██████╗
██╔══██╗ ████╗  ██║ ██╔════╝  ██║   ██║ ██║     ██╔═══██╗
███████║ ██╔██╗ ██║ ██║  ███╗ ██║   ██║ ██║     ██║   ██║
██╔══██║ ██║╚██╗██║ ██║   ██║ ██║   ██║ ██║     ██║   ██║
██║  ██║ ██║ ╚████║ ╚██████╔╝ ╚██████╔╝ ███████╗ ╚██████╔╝
╚═╝  ╚═╝ ╚═╝  ╚═══╝  ╚═════╝   ╚═════╝  ╚══════╝  ╚═════╝

╔═ Intro ═══════════════╗
║ Merci de visiter mon portfolio 3D, curieux développeur !
║ Business Manager le jour, entrepreneur la nuit — et ce monde est ma troisième facette.
╚═══════════════════════╝

╔═ Contact ═════════════╗
║ LinkedIn ⇒ https://www.linkedin.com/in/jeremy-angulo/
║ GitHub   ⇒ https://github.com/jeremy-angulo
║ Mail     ⇒ jeremy.angulo@gmail.com
║ Site     ⇒ https://jeremyangulo.fr
╚═══════════════════════╝

╔═ Debug ═══════════════╗
║ Ajoute #debug à la fin de l'URL puis recharge pour le mode debug.
║ Touche [V] pour la caméra libre.
╚═══════════════════════╝

╔═ Sous le capot ═══════╗
║ Rendu par Three.js (release: ${THREE.REVISION}) ⇒ https://threejs.org/
║ Physique par Rapier ⇒ https://rapier.rs/
║ Audio par Howler.js ⇒ https://howlerjs.com/
╚═══════════════════════╝

╔═ Crédits ═════════════╗
║ Ce monde est bâti sur le folio-2025 de Bruno Simon, publié sous licence MIT. Merci Bruno !
║ https://github.com/brunosimon/folio-2025
║ Les musiques sont de Kounine, en licence CC0.
║ https://linktr.ee/Kounine
╚═══════════════════════╝

╔═ Les deux autres facettes ═╗
║ Le jour (business) ⇒ https://jeremyangulo.fr
║ La nuit (ingénieur) ⇒ https://jeremyangulo.fr/tech
╚═══════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]
