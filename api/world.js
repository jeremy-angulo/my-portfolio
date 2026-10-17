// api/world.js — Mesure d'audience du monde 3D (folio/sources/Game/Telemetry.js).
//
// Le jeu envoie un lot toutes les 20 s et à la fermeture de l'onglet : l'état
// de la session, les évènements survenus depuis le lot précédent, et les
// cellules de la carte de chaleur traversées. Tout est rangé dans le schéma
// `world` de la base du circuit (voir supabase/migrations/*world_analytics*).
//
// Pourquoi une route à nous plutôt que GoatCounter : servie par le domaine du
// site, elle échappe aux bloqueurs et aux filtres d'entreprise qui écartent
// les scripts tiers — exactement le public d'un portfolio. Elle ne reçoit ni
// cookie ni identifiant durable : la session est un nombre tiré au hasard
// par l'onglet, oublié à sa fermeture. L'adresse IP ne sert qu'au quota et
// n'est jamais écrite dans ces tables.
//
// Point d'entrée public : la validation écarte les charges absurdes, le quota
// borne ce qu'une seule adresse peut écrire. Ce n'est pas une frontière de
// sécurité — n'importe qui peut envoyer une fausse session, comme n'importe
// qui peut appeler le /count de GoatCounter.
import { hashIp, isConfigured, rateLimit, rpc } from './_lib/circuit.js'

const GRID_SIZE = 48
const MAX_EVENTS = 100
const MAX_CELLS = 500
const MAX_SAMPLES_PER_CELL = 600

// Un visiteur envoie environ trois lots par minute. Un bureau entier derrière
// une même adresse doit passer ; une boucle folle, non.
export const MAX_BATCHES_PER_HOUR = 6000

export const EVENT_KINDS = new Set([
    'zone',          // première entrée dans une zone nommée
    'achievement',   // succès débloqué en jeu
    'interaction',   // point interactif activé (libellé du point)
    'race_start',    // départ de course ; detail = jeton obtenu ou non
    'race_finish',   // tour bouclé ; value = chrono en ms
    'race_abandon',  // course abandonnée
    'race_submit',   // dépôt du temps ; detail = issue (ok, offline, code d'erreur)
])

const SESSION_VALUES = {
    lang: new Set([ 'fr', 'en' ]),
    device: new Set([ 'desktop', 'tablet', 'mobile' ]),
    renderer: new Set([ 'webgpu', 'webgl2' ]),
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const boundedInteger = (value, min, max) =>
{
    const number = Number(value)
    return Number.isInteger(number) && number >= min && number <= max ? number : null
}

// Ne garde que ce qui a la bonne forme ; renvoie null si la session elle-même
// est inutilisable (sans identifiant, rien ne peut être rattaché).
export function cleanBatch(body)
{
    const session = body?.session

    if(!session || typeof session.id !== 'string' || !UUID.test(session.id))
        return null

    const cleanSession = { id: session.id.toLowerCase() }

    for(const [ field, allowed ] of Object.entries(SESSION_VALUES))
    {
        if(allowed.has(session[field]))
            cleanSession[field] = session[field]
    }

    const activeS = boundedInteger(session.activeS, 0, 86400)
    if(activeS !== null)
        cleanSession.activeS = activeS

    const loadMs = boundedInteger(session.loadMs, 1, 600000)
    if(loadMs !== null)
        cleanSession.loadMs = loadMs

    if(typeof session.embedded === 'boolean')
        cleanSession.embedded = session.embedded

    const events = (Array.isArray(body.events) ? body.events : [])
        .slice(0, MAX_EVENTS)
        .filter((event) => EVENT_KINDS.has(event?.kind))
        .map((event) =>
        {
            const clean = { kind: event.kind }

            if(typeof event.detail === 'string' && event.detail.trim())
                clean.detail = event.detail.trim().slice(0, 60)

            const value = boundedInteger(event.value, 0, 3600000)
            if(value !== null)
                clean.value = value

            return clean
        })

    const cells = (Array.isArray(body.cells) ? body.cells : [])
        .slice(0, MAX_CELLS)
        .map((cell) => ({
            x: boundedInteger(cell?.x, 0, GRID_SIZE - 1),
            z: boundedInteger(cell?.z, 0, GRID_SIZE - 1),
            n: boundedInteger(cell?.n, 1, MAX_SAMPLES_PER_CELL),
        }))
        .filter((cell) => cell.x !== null && cell.z !== null && cell.n !== null)

    return { session: cleanSession, events, cells }
}

export default async function handler(request, response)
{
    if(request.method !== 'POST')
        return response.status(405).end()

    if(!isConfigured())
        return response.status(503).json({ error: 'not_configured' })

    // sendBeacon envoie le corps en texte quand le type n'est pas reconnu.
    let body = request.body
    if(typeof body === 'string')
    {
        try { body = JSON.parse(body) }
        catch { body = null }
    }

    const batch = cleanBatch(body)
    if(!batch)
        return response.status(400).json({ error: 'invalid_payload' })

    try
    {
        const quota = await rateLimit('world', hashIp(request), MAX_BATCHES_PER_HOUR)
        if(quota.exceeded)
            return response.status(429).json({ error: 'too_many_batches' })

        await rpc('world_ingest', {
            p_session: batch.session,
            p_events: batch.events,
            p_cells: batch.cells,
        })
    }
    catch(error)
    {
        // La mesure ne doit jamais remonter au jeu : on journalise et on
        // répond comme si de rien n'était.
        console.error('world', error)
    }

    return response.status(204).end()
}
