// Internationalisation du monde 3D (EN par défaut, FR).
// La langue vient du localStorage `site-lang`, la clé partagée avec le site
// principal (même origine que l'iframe /3d) ; à défaut, celle du navigateur.
// Changer de langue recharge la page : trop de textes sont cuits dans des
// canvas/textures à la construction pour une bascule à chaud.

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('site-lang') : null

export const lang = stored === 'fr' || stored === 'en'
    ? stored
    : ((typeof navigator !== 'undefined' && (navigator.language ?? '')).toLowerCase().startsWith('fr') ? 'fr' : 'en')

// Chaîne côté JS : t('High', 'Élevée')
export const t = (en, fr) => (lang === 'fr' ? fr : en)

// Donnée bilingue : pick({ en: '…', fr: '…' }) — tolère une chaîne simple
export const pick = (value) => (typeof value === 'string' ? value : value[lang])

export const toggleLang = () =>
{
    localStorage.setItem('site-lang', lang === 'fr' ? 'en' : 'fr')
    location.reload()
}

// Traductions des éléments statiques d'index.html, indexées par data-i18n.
// L'anglais reste la version écrite dans le HTML.
const domFr = {
    'tb.interact': 'Interagir',
    'tb.unstuck': 'Décoincer',

    'home.title': 'Chez Jérémy',
    'home.p1': 'Bienvenue !',
    'home.p2': 'Je m’appelle <strong>Jérémy Angulo</strong> — <strong>business manager le jour, entrepreneur la nuit</strong>.',
    'home.p3': 'Ici, c’est mon terrain de jeu. Roule et pars découvrir mon parcours, mes projets et quelques choses qui comptent pour moi.',
    'home.p4': 'Et ne casse rien !',

    'options.title': 'Options',
    'options.audio': 'Audio',
    'options.audioTooltip': 'Active ou coupe le son',
    'options.quality': 'Qualité',
    'options.qualityTooltip': 'Active ou désactive certains effets',
    'options.stuck': 'Je suis bloqué !',
    'options.respawnTooltip': 'Te téléporte au point d’apparition le plus proche',
    'options.respawn': 'Réapparaître',
    'options.reset': 'Réinitialiser',
    'options.resetTooltip': 'Remet chaque objet à sa place',
    'options.resetButton': 'Réinitialiser',
    'options.renderer': 'Rendu',
    'options.rendererTooltip': 'Le meilleur pour les performances',
    'options.language': 'Langue',
    'options.languageTooltip': 'Recharge le monde',

    'controls.tabKeyboard': 'Souris clavier',
    'controls.tabTouch': 'Mobile tablette',
    'controls.tabGamepad': 'Manette',
    'k.wasd': '<span class="key">ZQSD</span> ou <span class="key">FLÈCHES</span>',
    'c.move': 'Se déplacer',
    'k.shift': '<span class="key">MAJ</span>',
    'c.boost': 'Boost',
    'k.ctrl': '<span class="key">CTRL GAUCHE</span> ou <span class="key">B</span>',
    'c.brake': 'Freiner',
    'k.space': '<span class="key">ESPACE</span>',
    'c.jump': 'Sauter',
    'k.enter': '<span class="key">ENTRÉE</span>',
    'c.interact': 'Interagir',
    'c.map': 'Carte',
    'c.mute': 'Couper le son',
    'c.respawn': 'Réapparaître',
    'k.num': '<span class="key">TOUCHES 1-9</span>/<span class="key">PAVÉ NUM.</span>',
    'c.hydraulics': 'Activer les suspensions hydrauliques',
    'k.leftClick': '<span class="key">CLIC GAUCHE (GLISSER)</span>',
    'c.camera': 'Déplacer la caméra',
    'c.honk': 'Klaxonner',
    'k.finger1': '<span class="key">Un doigt</span>',
    'c.moveCar': 'Déplacer la voiture',
    'k.finger2': '<span class="key">Deux doigts</span>',
    'c.cameraZoom': 'Caméra / zoom',
    'k.tap': '<span class="key">Toucher (la voiture)</span>',
    'c.interactExit': 'Interagir / Quitter',
    'c.accelerate': 'Accélérer',
    'c.accelerateBack': 'Marche arrière',
    'c.hydraulicsShort': 'Hydrauliques',
    'k.joyLeft': '<span class="key">Joystick gauche</span>',
    'c.wheels': 'Tourner les roues',
    'k.joyLeftPress': '<span class="key">Joystick gauche (pression)</span>',
    'k.joyRight': '<span class="key">Joystick droit</span>',
    'k.joyRightPress': '<span class="key">Joystick droit (pression)</span>',
    'c.zoom': 'Zoomer/dézoomer',
    'c.reset': 'Réinitialiser',
    'c.pause': 'Pause',

    'ach.title': 'Succès',
    'ach.rewards': 'Récompenses',
    'ach.unlockAt': 'Débloqué à <strong></strong>',
    'ach.reset': 'Réinitialiser les succès',

    'circuit.title': 'Circuit',
    'circuit.local': 'Tes meilleurs temps, gardés sur cet appareil.',
    'circuit.noScore': 'Aucun temps enregistré',
    'circuit.restart': 'Rejouer',
    'circuit.end': 'Abandonner',
    'circuit.controls': 'Commandes',

    'ce.yourTime': 'Ton temps',
    'ce.notTop10': 'Dommage, pas de top 10 cette fois.',
    'ce.submit': 'Valider',
    'ce.or': 'ou',

    'bts.title': 'Coulisses',
    'bts.p1': 'Merci de visiter mon portfolio !<br />Si tu te demandes comment ce projet est construit, voici tout ce qu’il faut savoir.',
    'bts.threejsText': '<a href="https://threejs.org" target="_blank" rel="noreferrer">Three.js</a> est la bibliothèque qui rend ce monde 3D.<br />Elle a été créée par <strong>mr.doob</strong> (<a href="https://x.com/mrdoob" target="_blank" rel="noreferrer">X</a>, <a href="http://github.com/mrdoob" target="_blank" rel="noreferrer">GitHub</a>), suivie par des centaines de développeurs formidables, dont Sunag (<a href="https://x.com/sea3dformat" target="_blank" rel="noreferrer">X</a>, <a href="https://github.com/sunag" target="_blank" rel="noreferrer">GitHub</a>) qui a ajouté <a href="https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language" target="_blank" rel="noreferrer">TSL</a>, rendant possibles WebGL comme WebGPU — et donc ce portfolio.',
    'bts.opensource': 'Open source',
    'bts.opensourceText': 'Ce monde est né du folio open source d’un mentor (<a href="https://github.com/brunosimon/folio-2019" target="_blank" rel="noreferrer">github.com/brunosimon/folio-2019</a>), publié sous <a href="https://choosealicense.com/licenses/mit/" target="_blank" rel="noreferrer">licence MIT</a>.<br />Je l’ai reconstruit à mon image — le parcours, les projets, le labo et quelques coins de l’île sont de moi. Merci à lui !',
    'bts.musics': 'Musiques',
    'bts.musicsText': 'La musique que tu entends est signée Kounine (<a href="https://linktr.ee/Kounine" target="_blank" rel="noreferrer">Linktree</a>), publiée sous <a href="https://choosealicense.com/licenses/cc0-1.0/" target="_blank" rel="noreferrer">licence CC0</a>.',
    'bts.links': 'Quelques liens',
    'bts.linksList': '<li>Physique ⇒ <a href="https://rapier.rs" target="_blank" rel="noreferrer">Rapier</a></li><li>Audio ⇒ <a href="https://howlerjs.com" target="_blank" rel="noreferrer">Howler.js</a></li><li>Polices ⇒ <a href="https://fonts.google.com/specimen/Amatic+SC" target="_blank" rel="noreferrer">Amatic SC</a> et <a href="https://fonts.google.com/specimen/Nunito?query=Nunito" target="_blank" rel="noreferrer">Nunito</a></li>',
}

export const applyDom = () =>
{
    document.documentElement.lang = lang

    if(lang !== 'fr')
        return

    for(const element of document.querySelectorAll('[data-i18n]'))
    {
        const value = domFr[element.dataset.i18n]

        if(value !== undefined)
            element.innerHTML = value
    }
}
