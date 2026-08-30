import { Game } from './Game.js'

// Échantillonne la position du joueur dans une grille grossière et envoie des
// compteurs par cellule (jamais de coordonnées brutes ni d'identifiant) vers
// le serveur du site, pour la carte de chaleur de /statistiques. Purement
// best-effort : un échec ici ne doit jamais gêner le jeu.
const GRID_SIZE = 48
const SAMPLE_INTERVAL = 1 // secondes entre deux échantillons de position
const FLUSH_INTERVAL = 20 // secondes entre deux envois au serveur

export class Telemetry
{
    constructor()
    {
        this.game = Game.getInstance()
        this.worldSize = this.game.terrain.size
        this.counts = new Map()
        this.sampleAccum = 0
        this.flushAccum = 0

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
