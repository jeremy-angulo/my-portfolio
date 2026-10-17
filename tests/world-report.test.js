// tests/world-report.test.js — Mise en forme du monde 3D pour /statistiques.
import test from 'node:test'
import assert from 'node:assert/strict'

import { lapHistogram, shapeWorld } from '../api/_lib/world-report.js'

// Ce que world.report a rendu pour deux sessions fictives (vérifié en base).
const RAW = {
    sessions: 2,
    activeMedianS: 95,
    activeP75S: 312,
    loadMedianMs: 8400,
    embedded: 1,
    daily: [ { day: '2026-10-17', sessions: 2 } ],
    devices: [ { label: 'mobile', sessions: 1 }, { label: 'desktop', sessions: 1 } ],
    renderers: [ { label: 'webgpu', sessions: 1 }, { label: 'webgl2', sessions: 1 } ],
    zones: [ { label: 'circuit', sessions: 2 }, { label: 'landing', sessions: 1 } ],
    achievements: [ { label: 'Pilote', count: 1 } ],
    interactions: [
        { label: 'Départ course !', count: 1, sessions: 1 },
        { label: 'Start race!', count: 1, sessions: 1 },
        { label: 'LinkedIn', count: 3, sessions: 2 },
    ],
    circuit: {
        zone: 2, started: 2, finished: 2, published: 1, starts: 2, laps: 2,
        bestMs: 41250, medianMs: 41250,
        tokens: [ { label: 'token', count: 1 }, { label: 'refused', count: 1 } ],
        outcomes: [ { label: 'ok', count: 1 }, { label: 'offline', count: 1 }, { label: 'clock_mismatch', count: 2 } ],
        laptimes: [ 41250, 58800 ],
    },
    cells: [ { x: 21, z: 24, n: 12 }, { x: 20, z: 24, n: 35 } ],
}

const DAYS = [ '2026-10-15', '2026-10-16', '2026-10-17' ]

test('les zones reçoivent leur nom et leur part des sessions', () =>
{
    const { world } = shapeWorld(RAW, { days: DAYS })

    assert.deepEqual(world.zones, [
        { label: 'Circuit', sessions: 2, share: 100 },
        { label: 'Arrivée', sessions: 1, share: 50 },
    ])
})

test('un même point interactif compte une fois, quelle que soit la langue', () =>
{
    const { world } = shapeWorld(RAW, { days: DAYS })
    const start = world.interactions.find((row) => row.label === 'Départ du circuit')

    assert.deepEqual(start, { label: 'Départ du circuit', count: 2, sessions: 2 })
    assert.ok(world.interactions.some((row) => row.label === 'LinkedIn'))
})

test('les jours sans visite apparaissent à zéro', () =>
{
    const { world } = shapeWorld(RAW, { days: DAYS })

    assert.deepEqual(world.daily, [
        { day: '2026-10-15', sessions: 0 },
        { day: '2026-10-16', sessions: 0 },
        { day: '2026-10-17', sessions: 2 },
    ])
})

test('l’entonnoir du circuit dit pourquoi un temps n’a pas été publié', () =>
{
    const { circuit } = shapeWorld(RAW, { days: DAYS }).world

    assert.equal(circuit.reached, 2)
    assert.equal(circuit.published, 1)
    assert.deepEqual(circuit.tokens.map((row) => row.label), [ 'Jeton obtenu', 'Quota atteint' ])
    assert.deepEqual(circuit.outcomes[0], { label: 'Refusé par l’anti-triche', count: 2 })
    assert.ok(circuit.outcomes.some((row) => row.label === 'Gardé sur l’appareil'))
})

test('la carte de chaleur couvre la période demandée', () =>
{
    const { heatmap } = shapeWorld(RAW, { days: DAYS })

    assert.equal(heatmap.windowDays, 3)
    assert.equal(heatmap.total, 47)
    assert.equal(heatmap.gridSize, 48)
})

test('sans données, le monde 3D est simplement absent', () =>
{
    assert.deepEqual(shapeWorld(null), { world: null, heatmap: null })
})

test('les chronos sont rangés par tranches de 5 s, les tours très lents à part', () =>
{
    const laps = [ 31000, 33500, 36000, 39900, 41000, 44000, 47000, 52000, 58000, 61000,
                   62000, 63000, 64000, 65000, 66000, 67000, 68000, 69000, 70000, 600000 ]

    const rows = lapHistogram(laps)

    assert.equal(rows[0].label, '30–35 s')
    assert.equal(rows[0].count, 2)
    assert.equal(rows.at(-1).label, '≥ 70 s')
    assert.equal(rows.reduce((sum, row) => sum + row.count, 0), laps.length)
})

test('un seul tour très lent n’étire pas l’échelle d’un petit échantillon', () =>
{
    const laps = [ 36420, 38150, 39767, 40210, 41980, 43100, 44050, 45890, 47300,
                   49120, 52800, 55934, 58200, 61500, 66000, 71200, 312000 ]

    const rows = lapHistogram(laps)

    assert.ok(rows.length <= 13, `${rows.length} tranches`)
    assert.equal(rows.at(-1).count >= 1, true)
    assert.equal(rows.reduce((sum, row) => sum + row.count, 0), laps.length)
})

test('aucun tour, aucun histogramme', () =>
{
    assert.deepEqual(lapHistogram([]), [])
})
