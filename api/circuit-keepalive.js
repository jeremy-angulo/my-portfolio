// api/circuit-keepalive.js — Garde la base éveillée.
//
// L'offre gratuite de Supabase suspend un projet resté sept jours sans
// requête. Le circuit, lui, peut rester une semaine sans visiteur : la base
// s'est déjà endormie une fois (2026-10, tableau en 502 et temps des autres
// invisibles). Une tâche planifiée (voir « crons » dans vercel.json) appelle
// cette route chaque jour ; une seule lecture suffit à compter comme activité.
//
// La route est publique mais ne révèle rien et n'écrit rien : elle lit la
// première ligne du classement, qui est déjà publique.
import { isConfigured, rpc } from './_lib/circuit.js'

export default async function handler(request, response)
{
    response.setHeader('Cache-Control', 'no-store')

    if(!isConfigured())
        return response.status(503).json({ error: 'not_configured' })

    try
    {
        const board = await rpc('circuit_board', { p_limit: 1 })

        return response.status(200).json({ ok: true, total: board?.total ?? 0 })
    }
    catch(error)
    {
        console.error('circuit-keepalive', error)
        return response.status(502).json({ error: 'upstream_error' })
    }
}
