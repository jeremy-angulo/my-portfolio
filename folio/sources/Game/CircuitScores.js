// Meilleurs temps du circuit : dialogue avec le tableau public
// (api/circuit-scores.js) et repli local quand le serveur est injoignable.
//
// Le serveur n'accepte un temps que s'il est présenté avec le jeton signé
// délivré au départ de la course : start() est donc appelé à chaque
// « Rejouer », et submit() renvoie ce jeton avec les temps intermédiaires et
// une signature calculée avec la clé de la course. Voir api/_lib/circuit.js
// pour ce que le serveur vérifie.

const API_RUN = '/api/circuit-run'
const API_SCORES = '/api/circuit-scores'

const NAME_KEY = 'circuitPlayerName'
const LOCAL_KEY = 'circuitScores'
const LOCAL_MAX = 10

const TIMEOUT = 8000

const hexToBytes = (hex) =>
{
    const bytes = new Uint8Array(hex.length / 2)

    for(let i = 0; i < bytes.length; i++)
        bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)

    return bytes
}

const bytesToHex = (buffer) => [ ...new Uint8Array(buffer) ]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

const request = async (url, options = {}) =>
{
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(TIMEOUT) })
    const payload = await response.json().catch(() => ({}))

    return { ok: response.ok, status: response.status, payload }
}

export class CircuitScores
{
    constructor()
    {
        // null tant qu'on ne sait pas ; false = tableau public indisponible,
        // le jeu continue avec les temps de l'appareil.
        this.online = null
        this.run = null
        this.scores = []
        this.total = 0
        this.source = 'local'
    }

    // —— Tableau ———————————————————————————————————————————————————————
    async fetchBoard()
    {
        try
        {
            const { ok, payload } = await request(API_SCORES)

            if(ok && Array.isArray(payload.scores))
            {
                this.online = true
                this.source = 'server'
                this.scores = payload.scores
                this.total = payload.total ?? payload.scores.length

                return this.scores
            }
        }
        catch(error) {}

        this.online = false
        this.source = 'local'
        this.scores = this.localScores()

        return this.scores
    }

    // —— Course ————————————————————————————————————————————————————————
    // Appelé au départ : sans jeton, le temps ne sera pas publiable, mais la
    // course se déroule normalement et le temps reste gardé sur l'appareil.
    async start()
    {
        this.run = null

        try
        {
            const { ok, payload } = await request(API_RUN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
            })

            if(ok && payload.token)
            {
                this.online = true
                this.run = payload

                return true
            }

            this.online = false
        }
        catch(error)
        {
            this.online = false
        }

        return false
    }

    async sign(message)
    {
        const key = await crypto.subtle.importKey(
            'raw',
            hexToBytes(this.run.runKey),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            [ 'sign' ]
        )

        return bytesToHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))
    }

    // Renvoie { ok, error, scores, rank, improved, offline }
    async submit({ name, timeMs, splits })
    {
        const written = String(name ?? '').replace(/\s+/g, ' ').trim()

        this.rememberName(written)

        // Toujours garder une trace locale : même hors ligne, le joueur
        // retrouve son temps au prochain passage.
        const local = this.insertLocal(written, timeMs)

        if(!this.run || !crypto?.subtle)
        {
            this.scores = this.online === false ? local : this.scores
            return { ok: false, offline: true, error: 'offline', scores: this.scores }
        }

        const body = {
            token: this.run.token,
            timeMs,
            splits,
            name: written,
        }

        try
        {
            body.signature = await this.sign(`${this.run.runId}|${timeMs}|${splits.join(',')}|${written}`)

            const { ok, status, payload } = await request(API_SCORES, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if(ok && Array.isArray(payload.scores))
            {
                this.online = true
                this.source = 'server'
                this.scores = payload.scores
                this.total = payload.total ?? payload.scores.length
                this.run = null

                return {
                    ok: true,
                    scores: this.scores,
                    rank: payload.rank,
                    total: this.total,
                    improved: payload.improved,
                    name: payload.name,
                    // Temps de la dernière ligne visible : de quoi dire ce
                    // qu'il manque pour entrer dans le tableau.
                    lastVisibleMs: this.scores.length ? this.scores[this.scores.length - 1].timeMs : null,
                }
            }

            // Un jeton déjà utilisé ou un nom refusé sont des réponses
            // normales : le message revient à l'écran, la modale reste ouverte.
            return { ok: false, error: payload.error ?? `http_${status}`, scores: this.scores }
        }
        catch(error)
        {
            this.online = false
            return { ok: false, offline: true, error: 'network', scores: local }
        }
    }

    // —— Mémoire de l'appareil ————————————————————————————————————————
    // Le nom est retenu pour être reproposé à la course suivante. L'ancienne
    // forme (deux champs) est encore relue, pour ne pas faire retaper son nom
    // à quelqu'un qui l'avait déjà donné.
    savedName()
    {
        try
        {
            const saved = JSON.parse(localStorage.getItem(NAME_KEY))

            if(typeof saved === 'string')
                return saved

            if(saved && typeof saved.firstName === 'string')
                return `${saved.firstName} ${saved.lastName ?? ''}`.trim()
        }
        catch(error) {}

        return ''
    }

    rememberName(name)
    {
        try
        {
            localStorage.setItem(NAME_KEY, JSON.stringify(name))
        }
        catch(error) {}
    }

    // Format courant : [ { name, timeMs, at } ]. L'ancien format arcade
    // ([ tag, '', durée ]) est encore lu pour ne pas perdre les temps déjà
    // enregistrés sur l'appareil.
    localScores()
    {
        try
        {
            const stored = JSON.parse(localStorage.getItem(LOCAL_KEY))

            if(Array.isArray(stored))
            {
                return stored
                    .map((entry) => Array.isArray(entry)
                        ? { name: String(entry[0]), timeMs: Number(entry[2]), at: null }
                        : entry)
                    .filter((entry) => entry && typeof entry.name === 'string' && Number.isFinite(entry.timeMs))
                    .sort((a, b) => a.timeMs - b.timeMs)
                    .slice(0, LOCAL_MAX)
                    .map((entry, index) => ({ ...entry, rank: index + 1 }))
            }
        }
        catch(error) {}

        return []
    }

    insertLocal(name, timeMs)
    {
        const scores = this.localScores()
        scores.push({ name, timeMs, at: Date.now() })

        const best = scores
            .sort((a, b) => a.timeMs - b.timeMs)
            .slice(0, LOCAL_MAX)
            .map((entry, index) => ({ ...entry, rank: index + 1 }))

        try
        {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(best))
        }
        catch(error) {}

        return best
    }
}
