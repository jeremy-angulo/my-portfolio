// api/circuit-scores.js — Tableau public des meilleurs temps du circuit 3D.
//
//   GET     → le classement (une ligne par personne, son meilleur temps)
//   POST    → dépôt d'un temps, avec le jeton de course délivré au départ
//   DELETE  → retrait d'une ligne (modération, jeton d'administration)
//
// Les contrôles anti-triche vivent dans api/_lib/circuit.js ; ce fichier
// enchaîne les vérifications puis écrit dans Redis. Rien n'est écrit avant
// que tout soit validé, pour qu'un nom refusé puisse être corrigé et
// redéposé avec le même jeton.
import {
    BOARD_SIZE,
    KEY_BOARD,
    KEY_LOG,
    KEY_REJECTS,
    MAX_BOARD_SIZE,
    MAX_SUBMITS_PER_HOUR,
    hashIp,
    isConfigured,
    keyPlayer,
    keyUsed,
    normalizeName,
    readRunToken,
    redis,
    redisPipeline,
    signSubmission,
    verifySubmission,
} from './_lib/circuit.js'

// Le classement complet est petit (une ligne par personne) : on le relit à
// chaque fois plutôt que de tenir un cache à jour.
async function readBoard(limit)
{
    const flat = await redis([ 'ZRANGE', KEY_BOARD, 0, limit - 1, 'WITHSCORES' ])

    if(!Array.isArray(flat) || flat.length === 0)
        return []

    const persons = []
    for(let i = 0; i < flat.length; i += 2)
        persons.push({ person: String(flat[i]), timeMs: Number(flat[i + 1]) })

    const details = await redisPipeline(persons.map(({ person }) => [ 'HMGET', keyPlayer(person), 'name', 'at' ]))

    return persons.map((entry, index) =>
    {
        const [ name, at ] = details[index] ?? []

        return {
            rank: index + 1,
            name: name ?? entry.person,
            timeMs: entry.timeMs,
            at: at ? Number(at) : null,
        }
    })
}

const readLimit = (request) =>
{
    const asked = Number(new URL(request.url, 'http://localhost').searchParams.get('limit'))

    if(!Number.isFinite(asked) || asked <= 0)
        return BOARD_SIZE

    return Math.min(Math.round(asked), MAX_BOARD_SIZE)
}

async function handleGet(request, response)
{
    const scores = await readBoard(readLimit(request))

    // Un temps déposé doit apparaître vite pour les autres joueurs, mais le
    // tableau n'a pas besoin d'être à la seconde près : 15 s de cache CDN.
    response.setHeader('Cache-Control', 'public, max-age=0, s-maxage=15, stale-while-revalidate=60')

    return response.status(200).json({ scores, size: scores.length })
}

async function handlePost(request, response)
{
    const body = request.body ?? {}
    const ipHash = hashIp(request)

    const payload = readRunToken(body.token)
    if(!payload)
        return response.status(400).json({ error: 'invalid_token' })

    // Quota de dépôts : au-delà, c'est un script, pas un joueur.
    const bucket = Math.floor(Date.now() / 3600000)
    const rateKey = `circuit:rl:submit:${ipHash}:${bucket}`
    const submits = await redis([ 'INCR', rateKey ])

    if(submits === 1)
        await redis([ 'EXPIRE', rateKey, 3600 ])

    if(submits > MAX_SUBMITS_PER_HOUR)
        return response.status(429).json({ error: 'too_many_submits' })

    const logReject = (error) => redis([ 'LPUSH', KEY_REJECTS, JSON.stringify({
        at: Date.now(), error, ipHash, runId: payload.rid, timeMs: body.timeMs,
    }) ]).catch(() => {})

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

    // Jeton à usage unique : la course qui vient de se terminer ne peut être
    // publiée qu'une fois. (Posé en dernier pour qu'un nom refusé plus haut
    // laisse une seconde chance.)
    const claimed = await redis([ 'SET', keyUsed(payload.rid), '1', 'NX', 'EX', 86400 ])
    if(claimed === null)
        return response.status(409).json({ error: 'already_submitted' })

    const now = Date.now()
    const previous = await redis([ 'ZSCORE', KEY_BOARD, name.person ])
    const previousMs = previous === null ? null : Number(previous)
    const improved = previousMs === null || checked.timeMs < previousMs

    const writes = [
        [ 'LPUSH', KEY_LOG, JSON.stringify({
            at: now,
            person: name.person,
            name: name.display,
            timeMs: checked.timeMs,
            splits: checked.splits,
            runId: payload.rid,
            ipHash,
            ua: String(request.headers['user-agent'] ?? '').slice(0, 120),
        }) ],
        [ 'LTRIM', KEY_LOG, 0, 499 ],
    ]

    if(improved)
    {
        writes.unshift(
            [ 'ZADD', KEY_BOARD, checked.timeMs, name.person ],
            [ 'HSET', keyPlayer(name.person),
                'name', name.display,
                'timeMs', checked.timeMs,
                'at', now,
                'runId', payload.rid,
                'splits', checked.splits.join(','),
                'ipHash', ipHash ],
        )
    }

    await redisPipeline(writes)

    const scores = await readBoard(readLimit(request))
    const rank = scores.findIndex((score) => score.name === name.display) + 1

    response.setHeader('Cache-Control', 'no-store')

    return response.status(200).json({
        ok: true,
        improved,
        previousMs,
        name: name.display,
        rank: rank > 0 ? rank : null,
        scores,
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

    await redisPipeline([
        [ 'ZREM', KEY_BOARD, person ],
        [ 'DEL', keyPlayer(person) ],
    ])

    return response.status(200).json({ ok: true, removed: person })
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
