// tests/circuit.test.js — Règles du tableau public des temps du circuit.
//
//   node --test tests/
//
// Deux niveaux : les règles pures (noms, jetons, plausibilité d'un tour) et
// le parcours complet des deux fonctions de l'API, base simulée en mémoire.
import test from 'node:test'
import assert from 'node:assert/strict'

process.env.CIRCUIT_SECRET = 'secret-de-test'
process.env.CIRCUIT_ADMIN_TOKEN = 'admin-de-test'
process.env.CIRCUIT_DB_URL = 'https://base.test'
process.env.CIRCUIT_DB_KEY = 'cle-publiable-de-test'
process.env.CIRCUIT_DB_SECRET = 'secret-serveur-de-test'

const {
    COUNTDOWN_MS, MAX_SUBMITS_PER_HOUR, MIN_TIME_MS,
    issueRun, normalizeName, readRunToken, signSubmission, verifySubmission,
} = await import('../api/_lib/circuit.js')

const scores = (await import('../api/circuit-scores.js')).default
const run = (await import('../api/circuit-run.js')).default
const { fakeRequest, fakeResponse, fakeDatabase, ipOf, legacySubmission, splitsFor, submission } = await import('./helpers.js')

const post = async (body, database) =>
{
    const response = fakeResponse()
    await scores(fakeRequest({ method: 'POST', body }), response)
    return { response, database }
}

// —— Noms ——————————————————————————————————————————————————————————————
test('un nom est repris tel qu\'il est écrit', () =>
{
    assert.equal(normalizeName('Jérémy Angulo').display, 'Jérémy Angulo')
    assert.equal(normalizeName('Jean-Luc de la Tour').display, 'Jean-Luc de la Tour')
    assert.equal(normalizeName('  Camille   Rousseau  ').display, 'Camille Rousseau')
})

test('une casse uniforme est remise en capitales initiales', () =>
{
    assert.equal(normalizeName('jeremy angulo').display, 'Jeremy Angulo')
    assert.equal(normalizeName('JEREMY ANGULO').display, 'Jeremy Angulo')
})

test('un prénom seul suffit', () =>
{
    assert.equal(normalizeName('Camille').display, 'Camille')
    assert.equal(normalizeName('Camille').error, undefined)
})

test('une personne garde la même ligne quelle que soit la casse ou les accents', () =>
{
    assert.equal(normalizeName('Jérémy Angulo').person, normalizeName('JEREMY ANGULO').person)
})

test('un nom hors alphabet latin reste accepté et reçoit une clé stable', () =>
{
    const first = normalizeName('Иван Петров')

    assert.equal(first.error, undefined)
    assert.equal(first.person, normalizeName('Иван Петров').person)
    assert.notEqual(first.person, normalizeName('Ольга Петрова').person)
})

test('les noms impossibles ou insultants sont refusés', () =>
{
    assert.equal(normalizeName('J').error, 'name_length')
    assert.equal(normalizeName('').error, 'name_length')
    assert.equal(normalizeName('A.').error, 'name_characters')
    assert.equal(normalizeName('<script>').error, 'name_characters')
    assert.equal(normalizeName('Gros Connard').error, 'name_rejected')
})

test('un nom trop long est ramené à la largeur du panneau', () =>
{
    const display = normalizeName('Jean'.repeat(12)).display

    assert.equal(display.length, 40)
    assert.ok(display.startsWith('Jean'))
})

// —— Jetons de course —————————————————————————————————————————————————
test('un jeton délivré par le serveur se relit ; retouché, il ne vaut plus rien', () =>
{
    const { payload, token } = issueRun(ipOf())

    assert.equal(readRunToken(token).rid, payload.rid)
    assert.equal(readRunToken(token.slice(0, -2) + '00'), null)
    assert.equal(readRunToken('bidon'), null)
    assert.equal(readRunToken(null), null)
})

test('un jeton signé avec une autre clé est rejeté', () =>
{
    const { token } = issueRun(ipOf())
    const previous = process.env.CIRCUIT_SECRET

    process.env.CIRCUIT_SECRET = 'autre-secret'
    assert.equal(readRunToken(token), null)
    process.env.CIRCUIT_SECRET = previous
})

// —— Plausibilité d'un tour ———————————————————————————————————————————
// `ipHash` est l'adresse qui dépose, distincte de celle inscrite dans le jeton.
const verify = ({ ipHash, ...overrides } = {}) =>
{
    const { payload, body } = submission(overrides)
    return verifySubmission({ payload, body, ipHash: ipHash ?? ipOf(), now: Date.now() })
}

test('un tour normal passe', () =>
{
    assert.deepEqual(verify().splits.length, 4)
})

test('un temps sous le plancher humain est refusé', () =>
{
    assert.equal(verify({ timeMs: MIN_TIME_MS - 1 }).error, 'implausible_time')
    assert.equal(verify({ timeMs: 0 }).error, 'implausible_time')
    assert.equal(verify({ timeMs: 1.5 }).error, 'invalid_time')
})

test('un tour sans points de contrôle crédibles est refusé', () =>
{
    assert.equal(verify({ splits: [ 32000 ] }).error, 'invalid_splits')
    assert.equal(verify({ splits: [ 100, 200, 300, 32000 ] }).error, 'invalid_splits')
    assert.equal(verify({ splits: [ 1200, 11000, 22000, 31000 ] }).error, 'splits_mismatch')
})

test('un chrono plus long que le temps réellement écoulé est refusé', () =>
{
    assert.equal(verify({ ageMs: 20000 }).error, 'clock_mismatch')
    assert.equal(verify({ ageMs: 32000 + COUNTDOWN_MS }).error, undefined)
})

test('un jeton emprunté à une autre adresse est refusé', () =>
{
    assert.equal(verify({ ipHash: ipOf('198.51.100.4') }).error, 'run_mismatch')
})

// —— Parcours complet ——————————————————————————————————————————————————
test('un temps déposé rejoint le tableau avec son rang sur tout le monde', async () =>
{
    const database = fakeDatabase({ board: [ { person: 'alice', name: 'Alice MARTIN', timeMs: 28000, at: 1 } ] })
    const { body } = submission({ timeMs: 32000 })
    const { response } = await post(body, database)

    assert.equal(response.statusCode, 200)
    assert.equal(response.payload.name, 'Jérémy Angulo')
    assert.equal(response.payload.improved, true)
    assert.equal(response.payload.previousMs, null)
    assert.equal(response.payload.rank, 2)
    assert.equal(response.payload.total, 2)
    assert.equal(response.headers['cache-control'], 'no-store')
})

test('la même course ne peut pas être publiée deux fois', async () =>
{
    const database = fakeDatabase()
    const { body } = submission({ runId: 'course-unique' })

    await post(body, database)
    const { response } = await post(body, database)

    assert.equal(response.statusCode, 409)
    assert.equal(response.payload.error, 'already_submitted')
})

test('un dépôt recopié à la main, sans signature valable, est refusé et journalisé', async () =>
{
    const database = fakeDatabase()
    const { body } = submission()

    const { response } = await post({ ...body, signature: 'f'.repeat(64) }, database)

    assert.equal(response.statusCode, 400)
    assert.equal(response.payload.error, 'bad_signature')
    assert.equal(database.rejects.at(-1).p_error, 'bad_signature')
    assert.equal(database.calls.some((call) => call.name === 'circuit_submit'), false)
})

test('un temps retouché après coup est refusé sans rien écrire', async () =>
{
    const database = fakeDatabase()
    const { body } = submission({ timeMs: 32000 })

    const { response } = await post({ ...body, timeMs: 16000 }, database)

    assert.equal(response.statusCode, 400)
    assert.equal(database.calls.some((call) => call.name === 'circuit_submit'), false)
})

test('un nom refusé laisse une seconde chance avec le même jeton', async () =>
{
    const database = fakeDatabase()
    const refused = submission({ name: 'Gros Connard', runId: 'course-a-corriger' })

    const first = await post(refused.body, database)
    assert.equal(first.response.statusCode, 400)
    assert.equal(first.response.payload.error, 'name_rejected')

    const timeMs = 32000
    const splits = splitsFor(timeMs)
    const name = 'Jérémy Angulo'
    const corrected = {
        ...refused.body,
        name,
        signature: signSubmission(refused.payload.key, { runId: refused.payload.rid, timeMs, splits, name }),
    }

    const second = await post(corrected, database)
    assert.equal(second.response.statusCode, 200)
})

test('un script qui s\'acharne est arrêté par le quota', async () =>
{
    const database = fakeDatabase()

    for(let index = 0; index < MAX_SUBMITS_PER_HOUR; index += 1)
        await post(submission({ runId: `course-${index}` }).body, database)

    const { response } = await post(submission({ runId: 'course-de-trop' }).body, database)

    assert.equal(response.statusCode, 429)
    assert.equal(response.payload.error, 'too_many_submits')
})

test('un dépôt venu de l\'ancien bundle, en deux champs, passe encore', async () =>
{
    const database = fakeDatabase()
    const { body } = legacySubmission({ firstName: 'Camille', lastName: 'Rousseau', runId: 'course-ancienne' })

    const { response } = await post(body, database)

    assert.equal(response.statusCode, 200)
    assert.equal(response.payload.name, 'Camille Rousseau')
})

test('le tableau se lit sans jeton et annonce le total', async () =>
{
    fakeDatabase({ board: [
        { person: 'alice', name: 'Alice MARTIN', timeMs: 28000, at: 1 },
        { person: 'bob', name: 'Bob DUPONT', timeMs: 31000, at: 2 },
    ] })

    const response = fakeResponse()
    await scores(fakeRequest({ method: 'GET', url: '/api/circuit-scores?limit=1' }), response)

    assert.equal(response.statusCode, 200)
    assert.equal(response.payload.total, 2)
    assert.equal(response.payload.scores.length, 1)
    assert.equal(response.payload.scores[0].name, 'Alice MARTIN')
    assert.match(response.headers['cache-control'], /s-maxage=15/)
})

test('retirer une ligne exige le jeton d\'administration', async () =>
{
    const database = fakeDatabase({ board: [ { person: 'alice', name: 'Alice MARTIN', timeMs: 28000, at: 1 } ] })

    const refused = fakeResponse()
    await scores(fakeRequest({ method: 'DELETE', url: '/api/circuit-scores?person=alice' }), refused)
    assert.equal(refused.statusCode, 401)

    const accepted = fakeResponse()
    await scores(fakeRequest({
        method: 'DELETE',
        url: '/api/circuit-scores?person=alice',
        headers: { authorization: 'Bearer admin-de-test' },
    }), accepted)

    assert.equal(accepted.statusCode, 200)
    assert.equal(accepted.payload.found, true)
    assert.equal(database.board.length, 0)
})

test('le départ d\'une course délivre un jeton utilisable', async () =>
{
    fakeDatabase()

    const response = fakeResponse()
    await run(fakeRequest({ method: 'POST' }), response)

    assert.equal(response.statusCode, 200)
    assert.equal(readRunToken(response.payload.token).rid, response.payload.runId)
    assert.equal(response.payload.minTimeMs, MIN_TIME_MS)
})

test('sans base configurée, l\'API le dit au lieu de planter', async () =>
{
    const previous = process.env.CIRCUIT_DB_URL
    delete process.env.CIRCUIT_DB_URL

    const response = fakeResponse()
    await scores(fakeRequest({ method: 'GET' }), response)

    assert.equal(response.statusCode, 503)
    assert.equal(response.payload.error, 'not_configured')

    process.env.CIRCUIT_DB_URL = previous
})
