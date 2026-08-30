// api/stats.js — Fonction serveur Vercel qui lit les chiffres d'audience et de
// disponibilité du site.
//
// Pourquoi une fonction serveur plutôt qu'un appel depuis la page : les jetons
// d'API (GoatCounter, Better Stack) donnent un accès large aux comptes
// respectifs. Ils doivent rester ici, côté serveur — dans le navigateur ils
// seraient lisibles par n'importe qui.
//
// Variables d'environnement attendues (portée Production) :
//   GOATCOUNTER_CODE          code de site GoatCounter, ex. "jeremy-angulo"
//   GOATCOUNTER_API_TOKEN     jeton d'API GoatCounter (secret)
//   STATS_PASSPHRASE          phrase attendue pour consulter la page (secret)
//   BETTERSTACK_API_TOKEN     jeton d'équipe Better Stack (secret, optionnel)
//   BETTERSTACK_MONITOR_ID    id du monitor Uptime à afficher (optionnel)
//
// Better Stack est optionnel : sans ces deux variables, la réponse omet
// simplement `uptime` — le tableau de bord d'audience reste utilisable.
//
// GoatCounter ne purge jamais l'historique de son propre chef (à la différence
// de Vercel Web Analytics et ses 31 jours) : la plage demandée n'est donc
// limitée que par bon sens, pas par une contrainte du service.
const MAX_DAYS = 1825

// v0 n'expose pas de total site entier : on le calcule en additionnant les
// pages renvoyées par /stats/hits. Sur un site à quelques dizaines de visites
// par mois ça tient dans un seul appel (limite 100, largement suffisant).
const HITS_LIMIT = 100

const iso = (date) => date.toISOString().slice(0, 10)
const addDays = (date, n) => new Date(date.getTime() + n * 86400000)

async function query(base, path, token, params)
{
    const url = new URL(`${base}/${path}`)

    for(const [ key, value ] of Object.entries(params))
    {
        if(value !== undefined && value !== null)
            url.searchParams.set(key, String(value))
    }

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    })

    if(!response.ok)
    {
        const detail = await response.text().catch(() => '')
        throw new Error(`${path} → HTTP ${response.status} ${detail.slice(0, 200)}`)
    }

    return response.json()
}

async function queryBetterStack(path, token)
{
    const response = await fetch(`https://uptime.betterstack.com/api/v2/${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    })

    if(!response.ok)
        throw new Error(`betterstack ${path} → HTTP ${response.status}`)

    return response.json()
}

// {id, name, count} pour browsers/systems/locations/toprefs/sizes/... — un
// nom lisible peut manquer (ex. sizes ne renvoie que l'id) : on retombe dessus.
// L'id est transmis tel quel : la page s'en sert pour franciser les catégories
// d'appareils et afficher le drapeau des pays (codes ISO stables, contrairement
// aux noms anglais).
const toBars = (stats) =>
    (stats ?? [])
        .map((row) => ({ id: row.id ?? null, label: row.name || row.id || '(non renseigné)', pageviews: row.count ?? 0 }))
        .sort((a, b) => b.pageviews - a.pageviews)

// Liste des dates (YYYY-MM-DD) de `since` à `until` inclus, pour l'axe du
// graphique — construite indépendamment de la réponse GoatCounter afin que
// les jours sans trafic apparaissent quand même comme des points à zéro.
const dateKeys = (since, until) =>
{
    const keys = []
    for(let d = new Date(since); d <= until; d = addDays(d, 1))
        keys.push(iso(d))
    return keys
}

export default async function handler(request, response)
{
    const code = process.env.GOATCOUNTER_CODE
    const token = process.env.GOATCOUNTER_API_TOKEN
    const passphrase = process.env.STATS_PASSPHRASE

    // Sans phrase configurée on refuse tout : mieux vaut une page inutilisable
    // qu'une page ouverte à qui devine l'URL.
    if(!passphrase)
        return response.status(503).json({ error: 'not_configured' })

    const given = request.headers['x-stats-key'] || request.query?.k
    if(given !== passphrase)
        return response.status(401).json({ error: 'unauthorized' })

    if(!code || !token)
        return response.status(503).json({ error: 'token_missing' })

    const base = `https://${code}.goatcounter.com/api/v0`

    const asked = Number.parseInt(request.query?.days ?? '31', 10)
    const days = Math.min(MAX_DAYS, Math.max(1, Number.isFinite(asked) ? asked : 31))

    const until = new Date()
    const since = new Date(until.getTime() - days * 86400000)
    const range = { start: iso(since), end: iso(until) }

    // GoatCounter traite `end` comme EXCLUSIF sur /stats/hits (vérifié
    // empiriquement : start=end=aujourd'hui renvoie une liste vide, alors que
    // /stats/sizes|locations|toprefs l'incluent). On interroge un jour plus
    // loin pour ne jamais perdre les visites du jour même — sans risque, un
    // jour futur n'a par définition encore aucune donnée.
    const queryEnd = iso(addDays(until, 1))
    const upstreamRange = { start: range.start, end: queryEnd }

    try
    {
        const [ hits, sizes, locations, toprefs ] = await Promise.all([
            query(base, 'stats/hits', token, { ...upstreamRange, daily: 1, limit: HITS_LIMIT }),
            query(base, 'stats/sizes', token, upstreamRange),
            query(base, 'stats/locations', token, { ...upstreamRange, limit: 12 }),
            query(base, 'stats/toprefs', token, { ...upstreamRange, limit: 12 }),
        ])

        const pages = hits?.hits ?? []
        const pageviews = pages.reduce((sum, p) => sum + (p.count ?? 0), 0)

        // Série journalière (pages vues, toutes pages confondues) pour le
        // graphique d'évolution : GoatCounter ne donne pas de visiteurs
        // uniques sur /stats/hits (seulement des pages vues), donc ni la
        // série ni les totaux ci-dessous ne prétendent en compter.
        const days_ = dateKeys(since, until)
        const perDay = Object.fromEntries(days_.map((d) => [ d, 0 ]))
        for(const page of pages)
        {
            for(const day of page.stats ?? [])
            {
                if(perDay[day.day] !== undefined)
                    perDay[day.day] += day.daily ?? 0
            }
        }
        const series = days_.map((day) => ({ day, pageviews: perDay[day] }))
        const peak = series.reduce((best, d) => (d.pageviews > best.pageviews ? d : best), series[0] ?? { day: null, pageviews: 0 })

        let uptime = null
        const bsToken = process.env.BETTERSTACK_API_TOKEN
        const bsMonitor = process.env.BETTERSTACK_MONITOR_ID
        if(bsToken && bsMonitor)
        {
            try
            {
                const [ monitor, sla ] = await Promise.all([
                    queryBetterStack(`monitors/${bsMonitor}`, bsToken),
                    queryBetterStack(`monitors/${bsMonitor}/sla?from=${range.start}&to=${range.end}`, bsToken),
                ])
                uptime = {
                    status: monitor?.data?.attributes?.status ?? 'unknown',
                    url: monitor?.data?.attributes?.url ?? null,
                    availability: sla?.data?.attributes?.availability ?? null,
                    incidents: sla?.data?.attributes?.number_of_incidents ?? null,
                }
            }
            catch
            {
                // Section bonus : une panne ou un jeton Better Stack invalide
                // ne doit pas casser le reste du tableau de bord.
                uptime = null
            }
        }

        response.setHeader('Cache-Control', 'private, max-age=300')
        return response.status(200).json({
            range: { ...range, days },
            truncated: hits?.more === true,
            totals: {
                pageviews,
                average: days ? Math.round((pageviews / days) * 10) / 10 : 0,
                peak: peak.pageviews,
            },
            series,
            paths: pages
                .map((p) => ({ label: p.path || '/', pageviews: p.count ?? 0 }))
                .sort((a, b) => b.pageviews - a.pageviews),
            devices: toBars(sizes?.stats),
            countries: toBars(locations?.stats),
            referrers: toBars(toprefs?.stats),
            uptime,
        })
    }
    catch(error)
    {
        // On renvoie le message : c'est une page privée, et sans lui un échec
        // d'API serait indiscernable d'une absence de trafic.
        return response.status(502).json({ error: 'upstream', detail: String(error.message ?? error) })
    }
}
