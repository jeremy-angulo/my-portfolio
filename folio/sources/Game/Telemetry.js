import { Game } from './Game.js'
import { lang } from './I18n.js'

// Mesure d'audience du monde 3D, envoyée à api/world.js — une route du site
// lui-même, donc invisible pour les bloqueurs et les filtres d'entreprise qui
// écartaient l'ancien script GoatCounter (domaine tiers). Ce qui part :
//
//   - une session : un identifiant tiré au hasard pour cet onglet et oublié à
//     sa fermeture, la langue, le type d'appareil, le moteur de rendu, le
//     temps de chargement et le temps passé onglet visible ;
//   - des évènements : zone découverte, succès, point interactif activé, et
//     chaque étape d'une course (départ, tour, abandon, dépôt du temps) ;
//   - la carte de chaleur : une grille 48×48 de compteurs, jamais une
//     position brute.
//
// Ni cookie, ni stockage local, ni adresse IP. Purement best-effort : un
// échec ici ne doit jamais gêner le jeu.
const GRID_SIZE = 48
const SAMPLE_INTERVAL = 1 // secondes entre deux échantillons de position
const FLUSH_INTERVAL = 20 // secondes entre deux envois au serveur
// Au-delà de cet écart entre deux images, l'onglet était masqué ou figé :
// ce temps-là ne compte pas comme du temps passé dans le monde.
const MAX_FRAME_GAP = 2
const ENDPOINT = '/api/world'

const newSessionId = () =>
{
    if(typeof crypto?.randomUUID === 'function')
        return crypto.randomUUID()

    // Repli : un UUID v4 à la main, pour les navigateurs sans randomUUID.
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = [ ...bytes ].map((byte) => byte.toString(16).padStart(2, '0')).join('')

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

// Trois familles suffisent pour lire le tableau de bord ; rien de plus fin,
// pour ne rien qui ressemble à une empreinte d'appareil.
const deviceKind = () =>
{
    const coarse = window.matchMedia?.('(pointer: coarse)').matches
    if(!coarse)
        return 'desktop'

    const shortSide = Math.min(window.screen?.width ?? window.innerWidth, window.screen?.height ?? window.innerHeight)
    return shortSide >= 600 ? 'tablet' : 'mobile'
}

export class Telemetry
{
    constructor()
    {
        this.game = Game.getInstance()
        this.worldSize = this.game.terrain.size

        // Le monde est chargé quand ce module est construit : c'est le temps
        // qu'un visiteur a attendu avant de pouvoir rouler.
        this.session = {
            id: newSessionId(),
            lang,
            device: deviceKind(),
            renderer: this.game.rendering?.renderer?.backend?.isWebGPUBackend ? 'webgpu' : 'webgl2',
            loadMs: Math.round(performance.now()),
            embedded: window.self !== window.top,
            activeS: 0,
        }

        this.activeSeconds = 0
        this.lastTick = performance.now() / 1000
        this.events = []
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

        // Le beacon de fermeture est le seul filet fiable : un envoi périodique
        // seul perdrait toujours la dernière tranche d'une session.
        window.addEventListener('pagehide', () => this.flush())
        document.addEventListener('visibilitychange', () =>
        {
            if(document.visibilityState === 'hidden')
                this.flush()
        })

        // Un premier envoi tout de suite : une visite écourtée compte quand
        // même, avec son temps de chargement.
        this.flush(true)
    }

    // Les zones n'existent qu'après world.step(1), appelé par Game.js après la
    // construction de ce module. L'ancienne version les cherchait trop tôt,
    // ne les trouvait pas, et n'a jamais rien compté.
    watchAreas()
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
                this.track('zone', name)
            })
        }
    }

    // kind : voir EVENT_KINDS dans api/world.js. detail : un libellé court,
    // value : un nombre entier (un chrono en millisecondes, par exemple).
    track(kind, detail = null, value = null)
    {
        const event = { kind }

        if(detail !== null && detail !== undefined)
            event.detail = String(detail).slice(0, 60)

        if(Number.isInteger(value))
            event.value = value

        this.events.push(event)
    }

    update()
    {
        // Temps réel plutôt que ticker.delta : celui-ci est plafonné, et sur
        // une machine qui peine à 15 images par seconde il ferait passer une
        // minute pour trente secondes. Un grand écart veut dire onglet masqué
        // ou figé — la boucle de rendu s'y arrête — et ne compte pas.
        const now = performance.now() / 1000
        const gap = now - this.lastTick
        this.lastTick = now

        const delta = gap > MAX_FRAME_GAP ? 0 : gap

        this.activeSeconds += delta
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

    flush(force = false)
    {
        if(!force && this.events.length === 0 && this.counts.size === 0)
            return

        const cells = []
        for(const [ key, n ] of this.counts)
        {
            const [ x, z ] = key.split(',').map(Number)
            cells.push({ x, z, n })
        }

        this.session.activeS = Math.round(this.activeSeconds)

        const payload = JSON.stringify({
            session: this.session,
            events: this.events.splice(0, this.events.length),
            cells,
        })

        this.counts.clear()

        // sendBeacon survit à la fermeture d'onglet ; fetch keepalive en repli
        // quand il est absent ou refuse la charge.
        const sent = navigator.sendBeacon
            ? navigator.sendBeacon(ENDPOINT, new Blob([ payload ], { type: 'application/json' }))
            : false

        if(!sent)
        {
            fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true,
            }).catch(() => {})
        }
    }
}
