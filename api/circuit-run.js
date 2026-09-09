// api/circuit-run.js — Départ d'une course : délivre le jeton signé sans
// lequel aucun temps ne pourra être publié (voir api/_lib/circuit.js).
//
// Appelé par le jeu à chaque « Rejouer » (folio/sources/Game/CircuitScores.js).
// Le jeton porte l'heure serveur du départ, l'empreinte d'adresse et une clé
// de signature à usage unique ; il est inutilisable une seconde fois.
import { hashIp, isConfigured, issueRun, redis, MAX_RUNS_PER_HOUR, MIN_TIME_MS } from './_lib/circuit.js'

export default async function handler(request, response)
{
    if(request.method !== 'POST')
        return response.status(405).json({ error: 'method_not_allowed' })

    // Sans base ni secret, le jeu retombe sur ses temps locaux : ce n'est pas
    // une erreur, juste un mode dégradé.
    if(!isConfigured())
        return response.status(503).json({ error: 'not_configured' })

    const ipHash = hashIp(request)

    try
    {
        const bucket = Math.floor(Date.now() / 3600000)
        const key = `circuit:rl:run:${ipHash}:${bucket}`
        const count = await redis([ 'INCR', key ])

        if(count === 1)
            await redis([ 'EXPIRE', key, 3600 ])

        if(count > MAX_RUNS_PER_HOUR)
            return response.status(429).json({ error: 'too_many_runs' })
    }
    catch
    {
        // Une panne de la base ne doit pas empêcher de rouler : le jeton est
        // délivré quand même, c'est le dépôt du temps qui échouera.
    }

    const { payload, token } = issueRun(ipHash)

    response.setHeader('Cache-Control', 'no-store')

    return response.status(200).json({
        runId: payload.rid,
        token,
        runKey: payload.key,
        serverTime: payload.iat,
        minTimeMs: MIN_TIME_MS,
    })
}
