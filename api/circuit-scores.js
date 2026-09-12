// api/circuit-scores.js — Tableau public des meilleurs temps du circuit 3D.
//
//   GET     → le classement (une ligne par personne, son meilleur temps)
//   POST    → dépôt d'un temps, avec le jeton de course délivré au départ
//   DELETE  → retrait d'une ligne (modération, jeton d'administration)
//
// Les contrôles anti-triche vivent dans api/_lib/circuit.js ; ce fichier
// enchaîne les vérifications puis appelle la base. Rien n'est écrit avant que
// tout soit validé, pour qu'un nom refusé puisse être corrigé et redéposé
// avec le même jeton.
//
// Retirer une ligne du tableau (la clé d'une personne se déduit du nom :
// minuscules, sans accent ni espace) :
//
//   curl -X DELETE -H "Authorization: Bearer $CIRCUIT_ADMIN_TOKEN" \
//     "https://jeremyangulo.fr/api/circuit-scores?person=jeanmartin"
import {
    BOARD_SIZE,
    MAX_BOARD_SIZE,
    MAX_SUBMITS_PER_HOUR,
    hashIp,
    isConfigured,
    normalizeName,
    rateLimit,
    readRunToken,
    rpc,
    signSubmission,
    verifySubmission,
} from './_lib/circuit.js'

const readLimit = (request) =>
{
    const asked = Number(new URL(request.url, 'http://localhost').searchParams.get('limit'))

    if(!Number.isFinite(asked) || asked <= 0)
        return BOARD_SIZE

    return Math.min(Math.round(asked), MAX_BOARD_SIZE)
}

async function handleGet(request, response)
{
    const board = await rpc('circuit_board', { p_limit: readLimit(request) })
    const scores = board?.scores ?? []

    // Un temps déposé doit apparaître vite pour les autres joueurs, mais le
    // tableau n'a pas besoin d'être à la seconde près : 15 s de cache CDN.
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=60')

    return response.status(200).json({ scores, size: scores.length, total: board?.total ?? scores.length })
}

async function handlePost(request, response)
{
    const body = request.body ?? {}
    const ipHash = hashIp(request)

    const payload = readRunToken(body.token)
    if(!payload)
        return response.status(400).json({ error: 'invalid_token' })

    // Quota de dépôts : au-delà, c'est un script, pas un joueur.
    const quota = await rateLimit('submit', ipHash, MAX_SUBMITS_PER_HOUR)
    if(quota.exceeded)
        return response.status(429).json({ error: 'too_many_submits' })

    // Journal des refus, borné côté base : il sert à régler les contrôles,
    // pas à retracer les visiteurs.
    const declaredTime = Number(body.timeMs)
    const logReject = (error) => rpc('circuit_reject', {
        p_error: error,
        p_ip_hash: ipHash,
        p_run_id: payload.rid,
        p_time_ms: Number.isFinite(declaredTime) ? Math.trunc(declaredTime) : null,
    }).catch(() => {})

    const checked = verifySubmission({ payload, body, ipHash })
    if(checked.error)
    {
        await logReject(checked.error)
        return response.status(400).json({ error: checked.error })
    }

    const name = normalizeName(body.firstName, body.lastName)
    if(name.error)
        return response.status(400).json({ error: name.error })

    // Signature du dépôt avec la clé de la course : le POST doit venir du jeu,
    // pas d'une requête recopiée à la main.
    const expected = signSubmission(payload.key, {
        runId: payload.rid,
        timeMs: checked.timeMs,
        splits: checked.splits,
        firstName: String(body.firstName ?? ''),
        lastName: String(body.lastName ?? ''),
    })

    if(String(body.signature ?? '') !== expected)
    {
        await logReject('bad_signature')
        return response.status(400).json({ error: 'bad_signature' })
    }

    // Le jeton est consommé dans la même transaction que l'écriture : deux
    // dépôts simultanés de la même course ne peuvent pas passer tous les deux.
    const result = await rpc('circuit_submit', {
        p_run_id: payload.rid,
        p_person: name.person,
        p_display: name.display,
        p_time_ms: checked.timeMs,
        p_splits: checked.splits,
        p_ip_hash: ipHash,
        p_user_agent: String(request.headers['user-agent'] ?? '').slice(0, 120),
        p_limit: readLimit(request),
    })

    if(result?.error)
        return response.status(409).json({ error: result.error })

    response.setHeader('Cache-Control', 'no-store')

    // Le rang vient du classement complet, pas des seules lignes affichées :
    // savoir qu'on est 14e sur 27 donne une raison de reprendre le volant.
    return response.status(200).json({
        ok: true,
        improved: result.improved,
        previousMs: result.previousMs ?? null,
        name: name.display,
        rank: result.rank ?? null,
        total: result.total ?? 0,
        scores: result.scores ?? [],
    })
}

async function handleDelete(request, response)
{
    const expected = process.env.CIRCUIT_ADMIN_TOKEN
    const provided = String(request.headers.authorization ?? '').replace(/^Bearer\s+/i, '')

    if(!expected || provided !== expected)
        return response.status(401).json({ error: 'unauthorized' })

    const person = new URL(request.url, 'http://localhost').searchParams.get('person')
    if(!person)
        return response.status(400).json({ error: 'missing_person' })

    const result = await rpc('circuit_remove', { p_person: person })

    return response.status(200).json({ ok: true, removed: person, found: result?.found ?? false })
}

export default async function handler(request, response)
{
    if(!isConfigured())
        return response.status(503).json({ error: 'not_configured' })

    try
    {
        if(request.method === 'GET')
            return await handleGet(request, response)

        if(request.method === 'POST')
            return await handlePost(request, response)

        if(request.method === 'DELETE')
            return await handleDelete(request, response)

        return response.status(405).json({ error: 'method_not_allowed' })
    }
    catch(error)
    {
        console.error('circuit-scores', error)
        return response.status(502).json({ error: 'upstream_error' })
    }
}
