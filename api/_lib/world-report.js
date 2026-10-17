// api/_lib/world-report.js — Met en forme, pour /statistiques, ce que la
// fonction SQL world.report renvoie de la mesure d'audience du monde 3D.
//
// La base rend des comptes bruts et des codes stables (clé de zone, issue
// d'un départ de course, libellé de point interactif dans la langue du
// joueur). Ce module les traduit en libellés lisibles, fusionne les deux
// langues d'un même point interactif, complète les jours sans visite, et
// regroupe les chronos en tranches pour l'histogramme.

// Clés des zones : voir folio/sources/Game/World/Areas/Areas.js.
export const ZONE_LABELS = {
    achievements: 'Succès',
    altar: 'Autel',
    behindTheScene: 'Coulisses',
    bowling: 'Bowling',
    career: 'Parcours',
    circuit: 'Circuit',
    cookie: 'Cookies',
    lab: 'Labo',
    landing: 'Arrivée',
    projects: 'Projets',
    social: 'Réseaux sociaux',
    toilet: 'Zone secrète',
    timeMachine: 'Machine à remonter le temps',
}

// Les points interactifs portent un libellé traduit (t('Lab', 'Labo')) : les
// deux langues renvoient au même endroit et doivent compter ensemble. Les
// liens de la zone sociale (LinkedIn, GitHub…) passent tels quels.
const INTERACTION_PAIRS = [
    [ 'Succès', 'Achievements', 'Succès' ],
    [ 'Coulisses', 'Behind the scene', 'Coulisses' ],
    [ 'Bowling · rejouer', 'Restart', 'Rejouer' ],
    [ 'Bowling · rambardes', 'Bumpers', 'Rambardes' ],
    [ 'Bowling · musique', 'Change song', 'Changer de musique' ],
    [ 'Départ du circuit', 'Start race!', 'Départ course !' ],
    [ 'Cookie accepté', 'Accept cookie', 'Accepter le cookie' ],
    [ 'Labo', 'Lab', 'Labo' ],
    [ 'Carte', 'Map', 'Carte' ],
    [ 'Commandes', 'Controls', 'Commandes' ],
    [ 'Projets', 'Projects', 'Projets' ],
    [ 'Machine à remonter le temps', 'Time Machine', 'Machine à remonter le temps' ],
]

export const INTERACTION_LABELS = Object.fromEntries(
    INTERACTION_PAIRS.flatMap(([ label, ...variants ]) => variants.map((variant) => [ variant, label ])),
)

const DEVICE_LABELS = { desktop: 'Ordinateur', tablet: 'Tablette', mobile: 'Téléphone', inconnu: 'Inconnu' }
const RENDERER_LABELS = { webgpu: 'WebGPU', webgl2: 'WebGL 2', inconnu: 'Inconnu' }

// Issue d'un départ de course (CircuitScores.start) : sans jeton, le temps
// de ce tour ne pourra pas être publié.
const START_LABELS = {
    token: 'Jeton obtenu',
    refused: 'Quota atteint',
    unavailable: 'Serveur en erreur',
    offline: 'Sans réseau',
}

// Issue d'un dépôt de temps : publié, gardé sur l'appareil, ou refusé — et
// pourquoi. Les contrôles anti-triche sont regroupés : leur détail est dans
// le journal circuit.reject_log, pas utile sur ce tableau.
const ANTI_CHEAT = [
    'invalid_token', 'bad_signature', 'implausible_time', 'invalid_time', 'clock_mismatch',
    'splits_mismatch', 'invalid_splits', 'run_expired', 'run_mismatch',
]

const SUBMIT_LABELS = {
    ok: 'Publié',
    offline: 'Gardé sur l’appareil',
    network: 'Gardé sur l’appareil',
    name_rejected: 'Nom refusé',
    name_length: 'Nom invalide',
    name_characters: 'Nom invalide',
    too_many_submits: 'Quota atteint',
    already_submitted: 'Déjà publié',
    upstream_error: 'Serveur en erreur',
    ...Object.fromEntries(ANTI_CHEAT.map((code) => [ code, 'Refusé par l’anti-triche' ])),
}

const submitLabel = (code) => SUBMIT_LABELS[code] ?? (/^http_5/.test(code) ? 'Serveur en erreur' : code)

// Additionne les lignes qui reçoivent le même libellé une fois traduites.
const merge = (rows, labelOf, fields) =>
{
    const merged = new Map()

    for(const row of rows ?? [])
    {
        const label = labelOf(row.label)
        const current = merged.get(label) ?? Object.fromEntries(fields.map((field) => [ field, 0 ]))

        for(const field of fields)
            current[field] += Number(row[field]) || 0

        merged.set(label, current)
    }

    return [ ...merged.entries() ]
        .map(([ label, values ]) => ({ label, ...values }))
        .sort((a, b) => b[fields[0]] - a[fields[0]])
}

const share = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0)

// Tranches de 5 s depuis le tour le plus rapide ; les tours lents vont dans
// une dernière tranche ouverte, pour qu'un tour de dix minutes passé à
// visiter n'écrase pas l'échelle de tous les autres. La borne haute est le
// 90e centile, et jamais plus de douze tranches : sur un petit échantillon,
// le 95e centile au rang le plus proche est souvent le maximum lui-même.
const MAX_BINS = 12

export function lapHistogram(laptimes)
{
    const laps = (laptimes ?? []).map(Number).filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b)

    if(laps.length === 0)
        return []

    const step = 5000
    const low = Math.floor(laps[0] / step) * step
    const p90 = laps[Math.max(0, Math.ceil(laps.length * 0.9) - 1)]
    const high = Math.min(low + MAX_BINS * step, Math.max(low + step, Math.ceil(p90 / step) * step))

    const bins = []
    for(let start = low; start < high; start += step)
        bins.push({ start, end: start + step, count: 0 })

    let overflow = 0
    for(const lap of laps)
    {
        if(lap >= high)
        {
            overflow += 1
            continue
        }

        bins[Math.floor((lap - low) / step)].count += 1
    }

    const rows = bins.map((bin) => ({ label: `${bin.start / 1000}–${bin.end / 1000} s`, count: bin.count }))

    if(overflow > 0)
        rows.push({ label: `≥ ${high / 1000} s`, count: overflow })

    return rows
}

// `days` : toutes les dates de la période (YYYY-MM-DD), pour que les jours
// sans visite apparaissent à zéro plutôt que de disparaître de la courbe.
export function shapeWorld(raw, { days = [], windowDays = days.length } = {})
{
    if(!raw)
        return { world: null, heatmap: null }

    const sessions = Number(raw.sessions) || 0
    const perDay = new Map((raw.daily ?? []).map((row) => [ String(row.day).slice(0, 10), Number(row.sessions) || 0 ]))

    // La clé de zone reste à côté du libellé : la carte de /statistiques
    // s'en sert pour poser chaque lieu à sa place.
    const zones = (raw.zones ?? [])
        .map((row) => ({
            key: row.label,
            label: ZONE_LABELS[row.label] ?? row.label,
            sessions: Number(row.sessions) || 0,
            share: share(Number(row.sessions) || 0, sessions),
        }))
        .sort((a, b) => b.sessions - a.sessions)

    const devices = merge(raw.devices, (key) => DEVICE_LABELS[key] ?? key, [ 'sessions' ])
        .map((row) => ({ ...row, share: share(row.sessions, sessions) }))

    const renderers = merge(raw.renderers, (key) => RENDERER_LABELS[key] ?? key, [ 'sessions' ])
        .map((row) => ({ ...row, share: share(row.sessions, sessions) }))

    const circuit = raw.circuit ?? {}

    const world = {
        sessions,
        activeMedianS: raw.activeMedianS ?? null,
        activeP75S: raw.activeP75S ?? null,
        loadMedianMs: raw.loadMedianMs ?? null,
        embeddedShare: share(Number(raw.embedded) || 0, sessions),
        daily: days.map((day) => ({ day, sessions: perDay.get(day) ?? 0 })),
        devices,
        renderers,
        zones,
        achievements: merge(raw.achievements, (label) => label, [ 'count' ]),
        interactions: merge(raw.interactions, (label) => INTERACTION_LABELS[label] ?? label, [ 'count', 'sessions' ]),
        circuit: {
            reached: Number(circuit.zone) || 0,
            started: Number(circuit.started) || 0,
            finished: Number(circuit.finished) || 0,
            published: Number(circuit.published) || 0,
            starts: Number(circuit.starts) || 0,
            laps: Number(circuit.laps) || 0,
            bestMs: circuit.bestMs ?? null,
            medianMs: circuit.medianMs ?? null,
            tokens: merge(circuit.tokens, (code) => START_LABELS[code] ?? code, [ 'count' ]),
            outcomes: merge(circuit.outcomes, submitLabel, [ 'count' ]),
            histogram: lapHistogram(circuit.laptimes),
        },
    }

    const cells = (raw.cells ?? []).map((cell) => ({ x: Number(cell.x), z: Number(cell.z), n: Number(cell.n) }))
    const heatmap = {
        gridSize: 48,
        windowDays,
        total: cells.reduce((sum, cell) => sum + cell.n, 0),
        cells,
    }

    return { world, heatmap }
}
