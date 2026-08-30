// api/stats.js — Fonction serveur Vercel qui lit les chiffres d'audience.
//
// Pourquoi une fonction serveur plutôt qu'un appel depuis la page : le jeton
// d'API GoatCounter donne accès à tout le compte (lecture ET écriture selon
// ses permissions). Il doit rester ici, côté serveur — dans le navigateur il
// serait lisible par n'importe qui.
//
// Variables d'environnement attendues (portée Production) :
//   GOATCOUNTER_CODE        code de site GoatCounter, ex. "jeremy-angulo"
//   GOATCOUNTER_API_TOKEN   jeton d'API GoatCounter (secret)
//   STATS_PASSPHRASE        phrase attendue pour consulter la page (secret)
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

// {id, name, count} pour browsers/systems/locations/toprefs/sizes/... — un
// nom lisible peut manquer (ex. sizes ne renvoie que l'id) : on retombe dessus.
// GoatCounter ne distingue pas les visiteurs uniques sur ces dimensions, à la
// différence de /stats/hits : c'est un compte de pages vues, pas de visiteurs.
const toBars = (stats) =>
    (stats ?? [])
        .map((row) => ({ label: row.name || row.id || '(non renseigné)', pageviews: row.count ?? 0 }))
        .sort((a, b) => b.pageviews - a.pageviews)

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

    try
    {
        const [ hits, sizes, locations, toprefs ] = await Promise.all([
            query(base, 'stats/hits', token, { ...range, limit: HITS_LIMIT }),
            query(base, 'stats/sizes', token, range),
            query(base, 'stats/locations', token, { ...range, limit: 12 }),
            query(base, 'stats/toprefs', token, { ...range, limit: 12 }),
        ])

        const pages = hits?.hits ?? []
        const visitors = pages.reduce((sum, p) => sum + (p.count_unique ?? 0), 0)
        const pageviews = pages.reduce((sum, p) => sum + (p.count ?? 0), 0)

        response.setHeader('Cache-Control', 'private, max-age=300')
        return response.status(200).json({
            range: { ...range, days },
            truncated: hits?.more === true,
            totals: { visitors, pageviews },
            paths: pages
                .map((p) => ({ label: p.path || '/', visitors: p.count_unique ?? 0, pageviews: p.count ?? 0 }))
                .sort((a, b) => b.pageviews - a.pageviews),
            devices: toBars(sizes?.stats),
            countries: toBars(locations?.stats),
            referrers: toBars(toprefs?.stats),
        })
    }
    catch(error)
    {
        // On renvoie le message : c'est une page privée, et sans lui un échec
        // d'API serait indiscernable d'une absence de trafic.
        return response.status(502).json({ error: 'upstream', detail: String(error.message ?? error) })
    }
}
