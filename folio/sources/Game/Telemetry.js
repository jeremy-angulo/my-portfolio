import { Game } from './Game.js'

// Échantillonne la position du joueur dans une grille grossière (pour la
// carte de chaleur de /statistiques) et suit deux évènements ponctuels — zone
// visitée, succès débloqué — via GoatCounter. Purement best-effort : un échec
// ici ne doit jamais gêner le jeu.
const GRID_SIZE = 48
const SAMPLE_INTERVAL = 1 // secondes entre deux échantillons de position
const FLUSH_INTERVAL = 20 // secondes entre deux envois au serveur

// Même code de site que src/analytics.jsx : cette valeur n'est pas un secret
// (elle est déjà publique côté client dans le bundle React), pas la peine de
// la faire transiter par une variable d'environnement propre à folio.
const GOATCOUNTER_CODE = 'jeremy-angulo'

// Noms d'affichage des zones du monde (voir Game/World/Areas/Areas.js pour
// les clés) — mêmes intitulés que la mini-carte du jeu (Map.js) quand elle en
// a un ; "toilet" n'y figure pas (zone secrète), on lui donne un nom discret.
const AREA_LABELS = {
    achievements: 'Succès',
    altar: 'Autel',
    behindTheScene: 'Coulisses',
    bowling: 'Bowling',
    career: 'Parcours',
    circuit: 'Circuit',
    cookie: 'Cookies',
    lab: 'Labo',
    landing: 'Arrivée',
    projects: 'Projets',
    social: 'Réseaux sociaux',
    toilet: 'Zone secrète',
    timeMachine: 'Machine à remonter le temps',
}

let loadPromise = null

const loadGoatCounter = () =>
{
    if(loadPromise)
        return loadPromise

    loadPromise = new Promise((resolve) =>
    {
        const script = document.createElement('script')
        script.async = true
        script.src = '//gc.zgo.at/count.js'
        script.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`
        script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true })
        script.onload = () => resolve(true)
        script.onerror = () => resolve(false)
        document.head.appendChild(script)
    })

    return loadPromise
}

export class Telemetry
{
    constructor()
    {
        this.game = Game.getInstance()
        this.worldSize = this.game.terrain.size
        this.counts = new Map()
        this.sampleAccum = 0
        this.flushAccum = 0
        this.seenAreas = new Set()

        // Après Player dans l'ordre des ticks (celui-ci met à jour la position
        // à l'ordre par défaut) : on lit toujours une position déjà à jour.
        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        }, 20)

        // Le beacon d'unload est le seul filet fiable : un flush périodique
        // seul perdrait toujours le dernier segment d'une session.
        window.addEventListener('pagehide', () => this.flush())
        document.addEventListener('visibilitychange', () =>
        {
            if(document.visibilityState === 'hidden')
                this.flush()
        })

        this.setupAreaTracking()
    }

    // Une entrée par zone nommée et par session : savoir qui a trouvé quoi
    // (le labo, l'autel, les coulisses...), complémentaire à la carte de
    // chaleur qui montre où mais pas ce que le lieu représente.
    setupAreaTracking()
    {
        const areas = this.game.world?.areas
        if(!areas)
            return

        for(const [ name, area ] of Object.entries(areas))
        {
            if(!area?.events || typeof area.events.on !== 'function')
                continue

            area.events.on('boundingIn', () =>
            {
                if(this.seenAreas.has(name))
                    return
                this.seenAreas.add(name)
                this.trackEvent('zone_enter', AREA_LABELS[name] ?? name)
            })
        }
    }

    // Appelé depuis Achievements.js à chaque succès réellement débloqué en
    // jeu (jamais lors d'une restauration silencieuse depuis la sauvegarde).
    trackEvent(name, detail)
    {
        loadGoatCounter().then((ready) =>
        {
            if(!ready || typeof window.goatcounter?.count !== 'function')
                return
            window.goatcounter.count({
                path: detail ? `${name}: ${detail}` : name,
                title: name,
                event: true,
            })
        })
    }

    update()
    {
        const delta = this.game.ticker.delta
        this.sampleAccum += delta
        this.flushAccum += delta

        if(this.sampleAccum >= SAMPLE_INTERVAL)
        {
            this.sampleAccum = 0
            this.sample()
        }

        if(this.flushAccum >= FLUSH_INTERVAL)
        {
            this.flushAccum = 0
            this.flush()
        }
    }

    sample()
    {
        const position = this.game.player.position

        // Même normalisation que Map.worldToMap : centre du monde à 0.5,
        // bornée à [0, 1] — la grille doit s'aligner sur la même image de
        // carte que la mini-carte du jeu.
        const nx = Math.min(1, Math.max(0, position.x / this.worldSize + 0.5))
        const nz = Math.min(1, Math.max(0, position.z / this.worldSize + 0.5))
        const gx = Math.min(GRID_SIZE - 1, Math.floor(nx * GRID_SIZE))
        const gz = Math.min(GRID_SIZE - 1, Math.floor(nz * GRID_SIZE))

        const key = `${gx},${gz}`
        this.counts.set(key, (this.counts.get(key) ?? 0) + 1)
    }

    flush()
    {
        if(this.counts.size === 0)
            return

        const cells = []
        for(const [ key, n ] of this.counts)
        {
            const [ x, z ] = key.split(',').map(Number)
            cells.push({ x, z, n })
        }
        this.counts.clear()

        const payload = JSON.stringify({ cells })

        // sendBeacon survit à la fermeture d'onglet ; fetch keepalive en repli
        // si l'API est absente (anciens navigateurs).
        const sent = navigator.sendBeacon
            ? navigator.sendBeacon('/api/track-zones', new Blob([ payload ], { type: 'application/json' }))
            : false

        if(!sent)
        {
            fetch('/api/track-zones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
            }).catch(() => {})
        }
    }
}
