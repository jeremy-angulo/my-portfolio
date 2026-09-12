// tests/helpers.js — Fausse requête, fausse réponse, fausse base, et de quoi
// fabriquer un dépôt aussi conforme que celui du jeu.
//
// Les fonctions de l'API sont écrites pour la signature Vercel
// (request, response) ; ces adaptateurs permettent de les appeler dans le
// runner de Node sans serveur ni réseau.
import { createHmac } from 'node:crypto'
import { signSubmission } from '../api/_lib/circuit.js'

// Empreinte d'adresse, telle que l'API la calcule à partir des en-têtes.
export const ipOf = (ip = '203.0.113.7') =>
    createHmac('sha256', process.env.CIRCUIT_SECRET).update(`ip:${ip}`).digest('hex').slice(0, 16)

// Un jeton de course tel que le serveur l'a délivré, mais daté dans le passé :
// sans cela, tester un tour de 32 s demanderait d'attendre 32 s.
export const signedRun = ({ ageMs = 40000, ipHash = null, runId = 'run-de-test' } = {}) =>
{
    const payload = { rid: runId, iat: Date.now() - ageMs, ip: ipHash ?? ipOf(), key: 'a1b2c3d4e5f60718293a4b5c6d7e8f90' }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
    const signature = createHmac('sha256', process.env.CIRCUIT_SECRET).update(body).digest('hex')

    return { payload, token: `${body}.${signature}` }
}

// Un tour plausible : passage sur la ligne, trois points de contrôle, retour.
export const splitsFor = (timeMs) => [ 1200, Math.round(timeMs * 0.35), Math.round(timeMs * 0.7), timeMs ]

// Le corps exact qu'enverrait le jeu à la fin d'une course.
export function submission({ timeMs = 32000, name = 'Jérémy Angulo', ...rest } = {})
{
    const { payload, token } = signedRun(rest)
    const splits = rest.splits ?? splitsFor(timeMs)

    return {
        payload,
        body: {
            token, timeMs, splits, name,
            signature: signSubmission(payload.key, { runId: payload.rid, timeMs, splits, name }),
        },
    }
}

// Le corps qu'enverrait un navigateur qui garde encore l'ancien bundle, du
// temps où la modale demandait le prénom et le nom séparément.
export function legacySubmission({ timeMs = 32000, firstName = 'Jérémy', lastName = 'Angulo', ...rest } = {})
{
    const { payload, token } = signedRun(rest)
    const splits = rest.splits ?? splitsFor(timeMs)

    return {
        payload,
        body: {
            token, timeMs, splits, firstName, lastName,
            signature: signSubmission(payload.key, { runId: payload.rid, timeMs, splits, firstName, lastName }),
        },
    }
}

export function fakeRequest({ method = 'GET', url = '/api/circuit-scores', headers = {}, body } = {})
{
    return {
        method,
        url,
        headers: { 'x-forwarded-for': '203.0.113.7', 'user-agent': 'node-test', ...headers },
        body,
    }
}

export function fakeResponse()
{
    return {
        statusCode: null,
        headers: {},
        payload: null,
        setHeader(name, value) { this.headers[name.toLowerCase()] = value },
        status(code) { this.statusCode = code; return this },
        json(payload) { this.payload = payload; return this },
    }
}

// Remplace fetch() par une base en mémoire qui parle le même dialecte que les
// fonctions SQL : on vérifie ainsi le chemin complet du handler, y compris ce
// qu'il envoie à la base, sans dépendre du réseau.
export function fakeDatabase({ board = [], claimed = new Set(), hits = new Map() } = {})
{
    const state = { board: [ ...board ], claimed, hits, calls: [], rejects: [] }

    const ranked = () => [ ...state.board ].sort((a, b) => a.timeMs - b.timeMs || a.at - b.at)

    const boardPayload = (limit) => ({
        scores: ranked().slice(0, limit ?? 10).map((entry, index) => ({
            rank: index + 1, name: entry.name, timeMs: entry.timeMs, at: entry.at,
        })),
        total: state.board.length,
    })

    globalThis.fetch = async (url, init) =>
    {
        const name = String(url).split('/rpc/')[1]
        const args = JSON.parse(init.body)

        state.calls.push({ name, args })

        if(args.p_secret !== process.env.CIRCUIT_DB_SECRET)
            return new Response(JSON.stringify({ message: 'circuit_forbidden' }), { status: 403 })

        const reply = (value) => new Response(JSON.stringify(value), { status: 200, headers: { 'Content-Type': 'application/json' } })

        if(name === 'circuit_board')
            return reply(boardPayload(args.p_limit))

        if(name === 'circuit_hit')
        {
            const count = (state.hits.get(args.p_bucket) ?? 0) + 1
            state.hits.set(args.p_bucket, count)
            return reply(count)
        }

        if(name === 'circuit_reject')
        {
            state.rejects.push(args)
            return new Response(null, { status: 204 })
        }

        if(name === 'circuit_submit')
        {
            if(state.claimed.has(args.p_run_id))
                return reply({ error: 'already_submitted' })

            state.claimed.add(args.p_run_id)

            const existing = state.board.find((entry) => entry.person === args.p_person)
            const previousMs = existing ? existing.timeMs : null
            const improved = previousMs === null || args.p_time_ms < previousMs

            if(improved && existing)
            {
                existing.timeMs = args.p_time_ms
                existing.name = args.p_display
                existing.at = Date.now()
            }
            else if(improved)
                state.board.push({ person: args.p_person, name: args.p_display, timeMs: args.p_time_ms, at: Date.now() })

            const rank = ranked().findIndex((entry) => entry.person === args.p_person) + 1

            return reply({
                ok: true,
                improved,
                previousMs,
                rank: rank || null,
                total: state.board.length,
                scores: boardPayload(args.p_limit).scores,
            })
        }

        if(name === 'circuit_remove')
        {
            const before = state.board.length
            state.board = state.board.filter((entry) => entry.person !== args.p_person)
            return reply({ ok: true, removed: args.p_person, found: state.board.length < before })
        }

        return new Response(JSON.stringify({ message: 'unknown_function' }), { status: 404 })
    }

    return state
}
