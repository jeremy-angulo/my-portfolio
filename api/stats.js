// api/stats.js — Fonction serveur Vercel qui lit les chiffres d'audience.
//
// Pourquoi une fonction serveur plutôt qu'un appel depuis la page : les données
// de Vercel Web Analytics ne sont pas publiques, elles demandent un jeton d'API.
// Ce jeton doit rester ici, côté serveur — dans le navigateur il serait lisible
// par n'importe qui et donnerait accès à tout le compte Vercel.
//
// Variables d'environnement attendues (portée Production) :
//   VERCEL_ANALYTICS_TOKEN  jeton d'API Vercel (secret)
//   STATS_PASSPHRASE        phrase attendue pour consulter la page (secret)

const API = 'https://api.vercel.com/v1/query/web-analytics'
const PROJECT_ID = 'prj_I5wahU045PsaupI24RNeP8lVkDdz'
const TEAM_ID = 'team_Yj7zasc6fIo19ZilujqUyiXQ'

// Vercel Web Analytics ne conserve que 31 jours en offre gratuite.
const MAX_DAYS = 31

const iso = (date) => date.toISOString().slice(0, 10)

async function query(path, token, params)
{
    const url = new URL(`${API}/${path}`)
    url.searchParams.set('projectId', PROJECT_ID)
    url.searchParams.set('teamId', TEAM_ID)
    url.searchParams.set('environment', 'production')

    for(const [ key, value ] of Object.entries(params))
    {
        if(Array.isArray(value))
            value.forEach((one) => url.searchParams.append(key, one))
        else if(value !== undefined && value !== null)
            url.searchParams.set(key, String(value))
    }

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

    if(!response.ok)
    {
        const detail = await response.text().catch(() => '')
        throw new Error(`${path} → HTTP ${response.status} ${detail.slice(0, 200)}`)
    }

    return response.json()
}

export default async function handler(request, response)
{
    const token = process.env.VERCEL_ANALYTICS_TOKEN
    const passphrase = process.env.STATS_PASSPHRASE

    // Sans phrase configurée on refuse tout : mieux vaut une page inutilisable
    // qu'une page ouverte à qui devine l'URL.
    if(!passphrase)
        return response.status(503).json({ error: 'not_configured' })

    const given = request.headers['x-stats-key'] || request.query?.k
    if(given !== passphrase)
        return response.status(401).json({ error: 'unauthorized' })

    if(!token)
        return response.status(503).json({ error: 'token_missing' })

    const asked = Number.parseInt(request.query?.days ?? '31', 10)
    const days = Math.min(MAX_DAYS, Math.max(1, Number.isFinite(asked) ? asked : MAX_DAYS))

    const until = new Date()
    const since = new Date(until.getTime() - days * 86400000)
    const range = { since: iso(since), until: iso(until) }

    try
    {
        const [ totals, paths, devices, countries, referrers, daily ] = await Promise.all([
            query('visits/count', token, range),
            query('visits/aggregate', token, { ...range, by: 'requestPath', limit: 15 }),
            query('visits/aggregate', token, { ...range, by: 'deviceType', limit: 10 }),
            query('visits/aggregate', token, { ...range, by: 'country', limit: 10 }),
            query('visits/aggregate', token, { ...range, by: 'referrerHostname', limit: 10 }),
            query('visits/aggregate', token, { ...range, by: 'day', limit: 100 }),
        ])

        response.setHeader('Cache-Control', 'private, max-age=300')
        return response.status(200).json({
            range: { ...range, days },
            totals: totals?.data ?? null,
            paths: paths?.data ?? [],
            devices: devices?.data ?? [],
            countries: countries?.data ?? [],
            referrers: referrers?.data ?? [],
            daily: daily?.data ?? [],
        })
    }
    catch(error)
    {
        // On renvoie le message : c'est une page privée, et sans lui un échec
        // d'API serait indiscernable d'une absence de trafic.
        return response.status(502).json({ error: 'upstream', detail: String(error.message ?? error) })
    }
}
