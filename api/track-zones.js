// api/track-zones.js — Reçoit les compteurs de cellules visitées dans le
// monde 3D et les relaie vers Better Stack (source Telemetry "http").
//
// Beacon public sans authentification, symétrique au /count de GoatCounter :
// le client 3D (folio/sources/Game/Telemetry.js) n'envoie jamais de position
// brute ni d'identifiant, seulement des compteurs par cellule d'une grille
// 48×48. La validation ci-dessous écarte juste les charges absurdes — ce
// n'est pas une frontière de sécurité, seulement une hygiène minimale sur un
// point d'entrée public.
const GRID_SIZE = 48
const MAX_CELLS_PER_BATCH = 500
// Marge large sur les ~20 échantillons/minute attendus entre deux envois.
const MAX_COUNT_PER_CELL = 600

const INGEST_HOST = 's2721858.eu-central-1a.betterstackdata.com'

export default async function handler(request, response)
{
    if(request.method !== 'POST')
        return response.status(405).end()

    const token = process.env.BETTERSTACK_ZONES_TOKEN
    if(!token)
        return response.status(503).json({ error: 'not_configured' })

    const cells = Array.isArray(request.body?.cells) ? request.body.cells : null
    if(!cells || cells.length === 0 || cells.length > MAX_CELLS_PER_BATCH)
        return response.status(400).json({ error: 'invalid_payload' })

    const clean = []
    for(const cell of cells)
    {
        const x = Number(cell?.x)
        const z = Number(cell?.z)
        const n = Number(cell?.n)
        if(!Number.isInteger(x) || !Number.isInteger(z) || !Number.isInteger(n)) continue
        if(x < 0 || x >= GRID_SIZE || z < 0 || z >= GRID_SIZE) continue
        if(n <= 0 || n > MAX_COUNT_PER_CELL) continue
        clean.push({ x, z, n })
    }

    if(clean.length === 0)
        return response.status(400).json({ error: 'invalid_payload' })

    try
    {
        await fetch(`https://${INGEST_HOST}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ event: 'zone_visit', cells: clean }),
        })
    }
    catch
    {
        // Best-effort : une panne d'ingestion ne doit jamais remonter au jeu.
    }

    return response.status(204).end()
}
