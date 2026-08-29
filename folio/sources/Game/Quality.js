import { Events } from './Events.js'
import { Game } from './Game.js'

/**
 * Palier de qualité, choisi automatiquement puis ajusté en cours de jeu.
 *
 *   0 = élevé   — machine confortable : ombres 2048, tous les objets en projettent
 *   1 = moyen   — ombres 1024, les petits objets cessent de projeter
 *   2 = bas     — ombres 512, seuls les gros volumes projettent
 *
 * Deux mécanismes se complètent :
 *
 *  1. Un audit au démarrage, à partir de ce que la machine veut bien dire d'elle
 *     (GPU, cœurs, mémoire, densité d'écran). C'est une estimation : elle donne
 *     un point de départ correct, pas une vérité.
 *
 *  2. Une surveillance du temps réellement passé par image, qui corrige l'audit
 *     dans un sens comme dans l'autre. C'est elle qui a le dernier mot, parce
 *     qu'elle mesure la seule chose qui compte : ce que la machine encaisse.
 *
 * ⚠️ La surveillance mesure son propre temps d'image et n'utilise PAS
 * ticker.deltaAverage : le ticker plafonne son delta à 1/30 s, une machine à
 * 10 images/seconde y ressemblerait donc à une machine à 30.
 *
 * Dès que l'utilisateur choisit un palier à la main, l'automatique se retire.
 */
export class Quality
{
    static HIGH = 0
    static MEDIUM = 1
    static LOW = 2

    constructor()
    {
        this.game = Game.getInstance()

        this.events = new Events()

        // Fenêtre de mesure
        this.sampleDuration = 2000       // durée d'une fenêtre, en ms
        this.warmupDuration = 6000       // temps laissé au monde pour se mettre en place
        this.upgradeStreakNeeded = 3     // fenêtres consécutives excellentes avant de remonter

        // Une image de plus de 20 ms, c'est moins de 50 images/seconde : on descend.
        this.downgradeFrameTime = 20
        // Sous 17,5 ms on est au plafond d'un écran 60 Hz : il reste de la marge.
        this.upgradeFrameTime = 17.5

        this.auto = true
        this.lastFrameTimestamp = null
        this.sampleStart = null
        this.sampleFrames = 0
        this.sampleTotal = 0
        this.goodStreak = 0
        this.startedAt = null
        this.audit = this.runAudit()
        this.level = this.audit.level

        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '⚙️ Quality',
                expanded: false,
            })

            this.game.debug.addButtons(
                debugPanel,
                {
                    low: () =>
                    {
                        this.changeLevel(Quality.LOW, true)
                    },
                    medium: () =>
                    {
                        this.changeLevel(Quality.MEDIUM, true)
                    },
                    high: () =>
                    {
                        this.changeLevel(Quality.HIGH, true)
                    },
                },
                'change'
            )
        }
    }

    /**
     * Estimation de départ. Aucun de ces signaux n'est fiable seul — les
     * navigateurs en brident plusieurs pour limiter le pistage — d'où le vote
     * par points plutôt qu'une cascade de si.
     */
    runAudit()
    {
        const reasons = []
        let score = 0

        // Appareil mobile. iPadOS se présente comme un Safari de bureau depuis
        // iOS 13, d'où le second test sur le tactile.
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
            || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))

        if(isMobile)
        {
            score -= 2
            reasons.push('appareil mobile')
        }

        // Cœurs logiques. Absent sur Safari < 16 : on ne pénalise pas dans ce cas.
        const cores = navigator.hardwareConcurrency
        if(typeof cores === 'number')
        {
            if(cores <= 2) { score -= 2; reasons.push(`${cores} cœurs`) }
            else if(cores <= 4) { score -= 1; reasons.push(`${cores} cœurs`) }
            else if(cores >= 8) { score += 1; reasons.push(`${cores} cœurs`) }
        }

        // Mémoire annoncée (Chromium seulement), arrondie par le navigateur.
        const memory = navigator.deviceMemory
        if(typeof memory === 'number')
        {
            if(memory <= 2) { score -= 2; reasons.push(`${memory} Go de mémoire`) }
            else if(memory <= 4) { score -= 1; reasons.push(`${memory} Go de mémoire`) }
            else if(memory >= 8) { score += 1; reasons.push(`${memory} Go de mémoire`) }
        }

        // Une forte densité d'écran multiplie les pixels à calculer.
        const pixelRatio = window.devicePixelRatio || 1
        if(pixelRatio >= 3) { score -= 1; reasons.push(`densité ${pixelRatio}`) }

        // Nom du GPU, quand le navigateur accepte de le donner.
        const renderer = this.readGpuName()
        if(renderer)
        {
            reasons.push(renderer)

            // Le rendu logiciel n'est pas un malus parmi d'autres, c'est une
            // impasse : le processeur fait le travail de la carte graphique.
            // Un bon processeur ne doit surtout pas venir compenser ce score,
            // c'est précisément lui qui est déjà saturé.
            if(/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(renderer))
            {
                return { level: Quality.LOW, score: -Infinity, reasons }
            }

            if(/apple (m[1-9]|a1[5-9]|a[2-9][0-9])/i.test(renderer))
            {
                score += 2 // puces Apple récentes, très à l'aise
            }
            else if(/rtx|radeon rx|arc a[0-9]/i.test(renderer))
            {
                score += 2
            }
            else if(/intel.*(hd|uhd) graphics ?([2-5][0-9]{3})?\b/i.test(renderer))
            {
                score -= 2 // circuits intégrés Intel anciens
            }
            else if(/adreno \(tm\) [1-5][0-9]{2}\b|mali-[tg]?[0-6][0-9]{1,2}\b/i.test(renderer))
            {
                score -= 2 // GPU mobiles d'entrée de gamme ou datés
            }
        }

        const level = score >= 1 ? Quality.HIGH : (score >= -2 ? Quality.MEDIUM : Quality.LOW)

        return { level, score, reasons }
    }

    /**
     * Le nom réel du GPU passe par une extension que certains navigateurs
     * masquent ; on utilise un contexte jetable pour ne pas perturber celui du
     * jeu, et on tolère l'échec sans bruit.
     */
    readGpuName()
    {
        try
        {
            const canvas = document.createElement('canvas')
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

            if(!gl)
                return null

            const extension = gl.getExtension('WEBGL_debug_renderer_info')
            const name = extension
                ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)
                : gl.getParameter(gl.RENDERER)

            const lose = gl.getExtension('WEBGL_lose_context')
            if(lose)
                lose.loseContext()

            return typeof name === 'string' ? name : null
        }
        catch(error)
        {
            return null
        }
    }

    /**
     * Appelée à chaque image. Accumule le temps réel par image et conclut à la
     * fin de chaque fenêtre.
     */
    update()
    {
        if(!this.auto)
            return

        const now = performance.now()

        if(this.startedAt === null)
            this.startedAt = now

        // Le monde se met en place : ces images-là ne représentent rien.
        if(now - this.startedAt < this.warmupDuration)
        {
            this.lastFrameTimestamp = now
            return
        }

        if(this.lastFrameTimestamp === null || this.sampleStart === null)
        {
            this.lastFrameTimestamp = now
            this.sampleStart = now
            return
        }

        const frameTime = now - this.lastFrameTimestamp
        this.lastFrameTimestamp = now

        // Onglet masqué ou retour de veille : la fenêtre entière est à jeter.
        if(document.hidden)
        {
            this.resetSample(now)
            return
        }

        // Hoquet isolé (ramasse-miettes, décodage d'une texture) : on ignore
        // cette image sans jeter la fenêtre. Le seuil est volontairement haut,
        // à 2 images/seconde : une machine vraiment poussive produit des images
        // de 200 ou 300 ms, et c'est exactement elle qu'on cherche à détecter.
        if(frameTime > 500)
            return

        this.sampleFrames++
        this.sampleTotal += frameTime

        const windowDuration = now - this.sampleStart

        if(windowDuration < this.sampleDuration)
            return

        // Fenêtre bien plus longue que prévu et sans une seule image retenue :
        // l'onglet a été masqué puis rouvert. On ne conclut rien là-dessus.
        if(this.sampleFrames === 0 && windowDuration > this.sampleDuration * 3)
        {
            this.resetSample(now)
            return
        }

        // Aucune image sous les 500 ms sur une fenêtre de durée normale : la
        // machine est à genoux. Sans ce cas, la division donnerait NaN et la
        // surveillance resterait muette précisément quand elle sert le plus.
        const average = this.sampleFrames > 0 ? this.sampleTotal / this.sampleFrames : Infinity
        this.resetSample(now)

        if(average > this.downgradeFrameTime && this.level < Quality.LOW)
        {
            this.goodStreak = 0
            this.changeLevel(this.level + 1)
            return
        }

        if(average < this.upgradeFrameTime && this.level > Quality.HIGH)
        {
            this.goodStreak++

            // On remonte lentement et on redescend vite : l'inverse ferait
            // osciller le rendu entre deux paliers sous les yeux du joueur.
            if(this.goodStreak >= this.upgradeStreakNeeded)
            {
                this.goodStreak = 0
                this.changeLevel(this.level - 1)
            }
            return
        }

        this.goodStreak = 0
    }

    resetSample(now)
    {
        this.sampleStart = now
        this.sampleFrames = 0
        this.sampleTotal = 0
    }

    changeLevel(level = Quality.HIGH, manual = false)
    {
        if(manual)
            this.auto = false

        level = Math.max(Quality.HIGH, Math.min(Quality.LOW, level))

        // Same
        if(level === this.level)
            return

        this.level = level
        this.events.trigger('change', [ this.level ])
    }

    /** Rend la main à l'automatique après un choix manuel. */
    enableAuto()
    {
        this.auto = true
        this.goodStreak = 0
        this.startedAt = null
        this.lastFrameTimestamp = null
        this.sampleStart = null
        this.changeLevel(this.runAudit().level)
    }
}
