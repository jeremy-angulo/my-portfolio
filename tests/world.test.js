// tests/world.test.js — Collecte de la mesure d'audience du monde 3D.
//
//   node --test "tests/*.test.js"
import test from 'node:test'
import assert from 'node:assert/strict'

process.env.CIRCUIT_SECRET = 'secret-de-test'
process.env.CIRCUIT_DB_URL = 'https://base.test'
process.env.CIRCUIT_DB_KEY = 'cle-publiable-de-test'
process.env.CIRCUIT_DB_SECRET = 'secret-serveur-de-test'

const { default: world, cleanBatch, MAX_BATCHES_PER_HOUR } = await import('../api/world.js')
const { fakeRequest, fakeResponse, fakeDatabase } = await import('./helpers.js')

const SESSION = '3f2b8c4e-9a1d-4e6f-b2c7-5d8e1f0a4b6c'

const batch = (overrides = {}) => ({
    session: { id: SESSION, activeS: 42, lang: 'fr', device: 'desktop', renderer: 'webgl2', loadMs: 8000, embedded: true },
    events: [ { kind: 'zone', detail: 'circuit' }, { kind: 'race_finish', value: 41250 } ],
    cells: [ { x: 20, z: 24, n: 12 } ],
    ...overrides,
})

const send = async (body, method = 'POST') =>
{
    const response = fakeResponse()
    await world(fakeRequest({ method, url: '/api/world', body }), response)
    return response
}

// —— Forme du lot ——————————————————————————————————————————————————————
test('un lot sans identifiant de session valable est écarté', () =>
{
    assert.equal(cleanBatch({}), null)
    assert.equal(cleanBatch({ session: { id: 'pas-un-uuid' } }), null)
    assert.equal(cleanBatch(null), null)
})

test('seules les valeurs prévues passent pour la session', () =>
{
    const { session } = cleanBatch(batch({
        session: { id: SESSION, lang: 'de', device: 'frigo', renderer: 'webgpu', activeS: -5, loadMs: 9e9, embedded: 'oui' },
    }))

    assert.deepEqual(session, { id: SESSION, renderer: 'webgpu' })
})

test('les évènements inconnus sont ignorés, les autres bornés', () =>
{
    const { events } = cleanBatch(batch({
        events: [
            { kind: 'zone', detail: 'x'.repeat(200) },
            { kind: 'piratage', detail: 'drop table' },
            { kind: 'race_finish', value: 41250.5 },
            { kind: 'race_finish', value: 41250 },
        ],
    }))

    assert.equal(events.length, 3)
    assert.equal(events[0].detail.length, 60)
    assert.equal(events[1].value, undefined)
    assert.equal(events[2].value, 41250)
})

test('les cellules hors de la grille sont ignorées', () =>
{
    const { cells } = cleanBatch(batch({
        cells: [ { x: 20, z: 24, n: 5 }, { x: 48, z: 0, n: 1 }, { x: 1, z: 1, n: 0 }, { x: 'a', z: 1, n: 1 } ],
    }))

    assert.deepEqual(cells, [ { x: 20, z: 24, n: 5 } ])
})

test('un lot démesuré est tronqué plutôt que refusé', () =>
{
    const many = Array.from({ length: 300 }, () => ({ kind: 'interaction', detail: 'Labo' }))
    assert.equal(cleanBatch(batch({ events: many })).events.length, 100)
})

// —— Route ——————————————————————————————————————————————————————————————
test('un lot valable est rangé en base et la réponse est vide', async () =>
{
    const database = fakeDatabase()
    const response = await send(batch())

    assert.equal(response.statusCode, 204)
    assert.equal(database.batches.length, 1)
    assert.equal(database.batches[0].p_session.id, SESSION)
    assert.equal(database.batches[0].p_events.length, 2)
})

test('un lot envoyé en texte brut par sendBeacon est lu quand même', async () =>
{
    const database = fakeDatabase()
    const response = await send(JSON.stringify(batch()))

    assert.equal(response.statusCode, 204)
    assert.equal(database.batches.length, 1)
})

test('un lot illisible est refusé sans toucher la base', async () =>
{
    const database = fakeDatabase()
    const response = await send({ session: { id: 'nope' } })

    assert.equal(response.statusCode, 400)
    assert.equal(database.batches.length, 0)
})

test('seul POST est accepté', async () =>
{
    fakeDatabase()
    assert.equal((await send(null, 'GET')).statusCode, 405)
})

test('une adresse qui inonde la route est arrêtée par le quota', async () =>
{
    const hits = new Map()
    const database = fakeDatabase({ hits })

    // On place le compteur juste sous le plafond plutôt que d'envoyer 6000 lots.
    const bucket = `world:${await (async () => {
        const { hashIp } = await import('../api/_lib/circuit.js')
        return hashIp(fakeRequest())
    })()}:${Math.floor(Date.now() / 3600000)}`
    hits.set(bucket, MAX_BATCHES_PER_HOUR)

    const response = await send(batch())

    assert.equal(response.statusCode, 429)
    assert.equal(database.batches.length, 0)
})

test('une panne de la base ne remonte jamais au jeu', async () =>
{
    fakeDatabase()
    process.env.CIRCUIT_DB_SECRET = 'mauvais'

    const response = await send(batch())

    process.env.CIRCUIT_DB_SECRET = 'secret-serveur-de-test'
    assert.equal(response.statusCode, 204)
})
