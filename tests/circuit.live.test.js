// tests/circuit.live.test.js — Le même parcours, mais contre la vraie base.
//
// Ignoré tant que CIRCUIT_DB_URL / CIRCUIT_DB_KEY / CIRCUIT_DB_SECRET ne sont
// pas dans l'environnement ; la suite ordinaire (tests/circuit.test.js) tourne
// sans réseau. Le temps déposé ici l'est sous un nom réservé, puis retiré.
//
//   set -a; . chemin/vers/circuit-db.env; set +a; node --test "tests/*.test.js"
import test from 'node:test'
import assert from 'node:assert/strict'

const live = Boolean(process.env.CIRCUIT_DB_URL && process.env.CIRCUIT_DB_KEY && process.env.CIRCUIT_DB_SECRET)

// Les jetons de course sont signés et relus dans ce processus : la valeur
// n'a pas à être celle de la production.
process.env.CIRCUIT_SECRET ??= 'secret-de-sonde'
process.env.CIRCUIT_ADMIN_TOKEN ??= 'admin-de-sonde'

const scores = (await import('../api/circuit-scores.js')).default
const { fakeRequest, fakeResponse, submission } = await import('./helpers.js')

const PERSON = 'zzzsondedebase'
const NAME = { firstName: 'Zzz', lastName: 'Sondedebase' }

const call = async (request) =>
{
    const response = fakeResponse()
    await scores(request, response)
    return response
}

const remove = () => call(fakeRequest({
    method: 'DELETE',
    url: `/api/circuit-scores?person=${PERSON}`,
    headers: { authorization: `Bearer ${process.env.CIRCUIT_ADMIN_TOKEN}` },
}))

// Le jeton doit être daté d'avant le tour qu'il accompagne : on le recule
// d'un peu plus que le chrono annoncé.
const depose = ({ timeMs, ...options }) => call(fakeRequest({
    method: 'POST',
    body: submission({ ...NAME, timeMs, ageMs: timeMs + 10000, ...options }).body,
}))

test('la vraie base accepte un temps, le classe, puis le rend', { skip: !live && 'base non configurée' }, async (t) =>
{
    t.after(remove)
    await remove()

    const empty = await call(fakeRequest({ method: 'GET' }))
    assert.equal(empty.statusCode, 200)
    assert.ok(Array.isArray(empty.payload.scores))

    const first = await depose({ timeMs: 45000, runId: `sonde-${Date.now()}-a` })
    assert.equal(first.statusCode, 200, JSON.stringify(first.payload))
    assert.equal(first.payload.improved, true)
    assert.equal(first.payload.previousMs, null)
    assert.equal(first.payload.name, 'Zzz SONDEDEBASE')
    assert.ok(first.payload.rank >= 1)
    assert.ok(first.payload.total >= 1)

    const bestRun = `sonde-${Date.now()}-b`
    const better = await depose({ timeMs: 38000, runId: bestRun })
    assert.equal(better.payload.improved, true)
    assert.equal(better.payload.previousMs, 45000)

    const slower = await depose({ timeMs: 52000, runId: `sonde-${Date.now()}-c` })
    assert.equal(slower.payload.improved, false)
    assert.equal(slower.payload.previousMs, 38000)

    const board = await call(fakeRequest({ method: 'GET', url: '/api/circuit-scores?limit=50' }))
    const mine = board.payload.scores.find((entry) => entry.name === 'Zzz SONDEDEBASE')
    assert.equal(mine.timeMs, 38000)
    assert.ok(Number.isFinite(mine.at))

    // La course la plus rapide, rejouée telle quelle : la base la refuse.
    const replayed = await depose({ timeMs: 38000, runId: bestRun })
    assert.equal(replayed.statusCode, 409)
    assert.equal(replayed.payload.error, 'already_submitted')

    const removed = await remove()
    assert.equal(removed.payload.found, true)

    const after = await call(fakeRequest({ method: 'GET', url: '/api/circuit-scores?limit=50' }))
    assert.equal(after.payload.scores.some((entry) => entry.name === 'Zzz SONDEDEBASE'), false)
})

test('la base refuse un appel sans le secret serveur', { skip: !live && 'base non configurée' }, async () =>
{
    const previous = process.env.CIRCUIT_DB_SECRET
    process.env.CIRCUIT_DB_SECRET = 'mauvais-secret'

    const response = await call(fakeRequest({ method: 'GET' }))

    process.env.CIRCUIT_DB_SECRET = previous

    assert.equal(response.statusCode, 502)
    assert.equal(response.payload.error, 'upstream_error')
})
