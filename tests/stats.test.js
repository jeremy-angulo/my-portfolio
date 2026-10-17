// tests/stats.test.js — Robustesse de api/stats.js face à GoatCounter.
//
// GoatCounter renvoie parfois des erreurs passagères (429, 5xx, et un 404
// « not found » au premier chargement de /statistiques). Ces tests simulent
// ses réponses pour vérifier que la page tient debout.
import test from 'node:test'
import assert from 'node:assert/strict'

process.env.STATS_PASSPHRASE = 'phrase-de-test'
process.env.GOATCOUNTER_CODE = 'site-de-test'
process.env.GOATCOUNTER_API_TOKEN = 'jeton-de-test'
delete process.env.CIRCUIT_DB_URL

const { default: stats, timing } = await import('../api/stats.js')

// Pas d'attente réelle : la file et les nouvelles tentatives sont instantanées.
timing.pause = 0
timing.retries = [ 0, 0 ]

const ok = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
const fail = (status, body = { error: 'not found' }) => new Response(JSON.stringify(body), { status })

const HITS = {
    hits: [ { path: '/', event: false, count: 12, stats: [ { day: '2026-10-17', daily: 12 } ] } ],
    more: false,
}

// `plan` : pour chaque endpoint, la liste des réponses successives (la
// dernière se répète). Par défaut, tout répond normalement.
const goatcounter = (plan = {}) =>
{
    const calls = []

    globalThis.fetch = async (url) =>
    {
        const path = new URL(url).pathname.replace('/api/v0/', '')
        calls.push(path)

        const answers = plan[path]
        if(answers)
        {
            const index = Math.min(calls.filter((call) => call === path).length - 1, answers.length - 1)
            return answers[index]()
        }

        return path === 'stats/hits' ? ok(HITS) : ok({ stats: [ { id: 'x', name: 'X', count: 3 } ] })
    }

    return calls
}

const call = async () =>
{
    const response = {
        statusCode: null, headers: {}, body: null,
        setHeader(key, value) { this.headers[key] = value },
        status(code) { this.statusCode = code; return this },
        json(body) { this.body = body; return this },
    }

    await stats({ method: 'GET', url: '/api/stats?days=7', headers: { 'x-stats-key': 'phrase-de-test' }, query: { days: '7' } }, response)
    return response
}

test('un « not found » passager de GoatCounter est rattrapé par une nouvelle tentative', async () =>
{
    const calls = goatcounter({ 'stats/hits': [ () => fail(404), () => ok(HITS) ] })
    const response = await call()

    assert.equal(response.statusCode, 200)
    assert.equal(response.body.totals.pageviews, 12)
    assert.equal(calls.filter((path) => path === 'stats/hits').length >= 2, true)
})

test('un 429 de GoatCounter est rattrapé aussi', async () =>
{
    goatcounter({ 'stats/hits': [ () => fail(429, { error: 'rate limited' }), () => ok(HITS) ] })
    assert.equal((await call()).statusCode, 200)
})

test('une donnée secondaire en panne n’emporte pas la page', async () =>
{
    goatcounter({ 'stats/browsers': [ () => fail(500, { error: 'boom' }) ] })
    const response = await call()

    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.body.browsers, [])
    assert.ok(response.body.systems.length > 0)
})

test('si les pages vues restent introuvables, l’erreur remonte avec son détail', async () =>
{
    const calls = goatcounter({ 'stats/hits': [ () => fail(404) ] })
    const response = await call()

    assert.equal(response.statusCode, 502)
    assert.match(response.body.detail, /stats\/hits → HTTP 404/)
    // La tentative initiale et les deux nouvelles, pour la période affichée.
    assert.equal(calls.filter((path) => path === 'stats/hits').length >= 3, true)
})

test('une erreur définitive (jeton refusé) n’est pas retentée', async () =>
{
    const calls = goatcounter({ 'stats/hits': [ () => fail(401, { error: 'unknown token' }) ] })
    const response = await call()

    assert.equal(response.statusCode, 502)
    assert.equal(calls.filter((path) => path === 'stats/hits').length, 1)
})
