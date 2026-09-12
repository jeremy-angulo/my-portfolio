// api/_lib/circuit.js — Socle commun des deux fonctions du circuit
// (api/circuit-run.js : début de course, api/circuit-scores.js : tableau
// public et dépôt d'un temps).
//
// Modèle : un temps n'est publiable que s'il est accompagné du jeton signé
// délivré au départ de LA course qui vient de se terminer. Le serveur ne peut
// pas vérifier qu'un tour a vraiment été roulé — le jeu tourne chez le
// visiteur — mais il peut rendre la fraude coûteuse : jeton à usage unique,
// horloge serveur cohérente avec le chrono annoncé, temps intermédiaires
// plausibles, signature de la charge utile, quotas par adresse. Voir
// verifySubmission() pour le détail des contrôles.
//
// Variables d'environnement (portée Production) :
//   CIRCUIT_SECRET            clé HMAC des jetons de course (secret, requis)
//   CIRCUIT_ADMIN_TOKEN       jeton de modération pour DELETE (secret, requis
//                             pour retirer une ligne du tableau)
//   CIRCUIT_DB_URL            base Postgres (Supabase), racine de l'API REST
//   CIRCUIT_DB_KEY            clé publiable de cette base
//   CIRCUIT_DB_SECRET         secret serveur exigé par chaque fonction SQL :
//                             la clé publiable seule ne donne accès à rien.
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

// —— Règles du circuit ————————————————————————————————————————————————
// Le meilleur tour connu tourne autour de 30 s (le succès « rapide » du jeu
// se déclenche sous 30 s). 15 s est donc un plancher très large : personne ne
// peut descendre là par le jeu, et aucun temps honnête n'est refusé.
export const MIN_TIME_MS = 15000
export const MAX_TIME_MS = 20 * 60 * 1000

// Décompte 3-2-1 entre la délivrance du jeton et le départ réel du chrono.
// La marge couvre le chargement de l'overlay et l'animation de départ.
export const COUNTDOWN_MS = 3000
export const CLOCK_TOLERANCE_MS = 2000

// Borne haute très lâche : un onglet en arrière-plan gèle la boucle de rendu
// (donc le chrono du jeu) alors que l'horloge serveur, elle, continue.
export const MAX_RUN_AGE_MS = 3 * 3600 * 1000

// Un tour passe par la ligne de départ, tous les points de contrôle, puis de
// nouveau la ligne : au moins 4 relevés, et jamais plus de 40 (garde-fou).
export const MIN_SPLITS = 4
export const MAX_SPLITS = 40
// Écart minimal entre deux passages successifs. Le tout premier relevé (la
// ligne de départ, franchie dès les premiers mètres) échappe à la règle.
export const MIN_SPLIT_DELTA_MS = 250

// Quotas par adresse et par heure. Large pour un joueur qui s'acharne,
// étroit pour un script qui empile les tentatives.
export const MAX_RUNS_PER_HOUR = 60
export const MAX_SUBMITS_PER_HOUR = 12

export const BOARD_SIZE = 10
export const MAX_BOARD_SIZE = 50

// —— Base (Postgres, via l'API REST) ——————————————————————————————————
// Les tables vivent dans un schéma que l'API n'expose pas ; tout passe par
// des fonctions SQL (voir la migration circuit_leaderboard) qui vérifient
// CIRCUIT_DB_SECRET avant d'écrire ou de lire quoi que ce soit. Une clé
// publiable interceptée ne permet donc ni de lire le journal, ni d'écrire
// une ligne sans passer par les contrôles de ce fichier.
const dbConfig = () =>
{
    const url = process.env.CIRCUIT_DB_URL ?? process.env.SUPABASE_URL
    const key = process.env.CIRCUIT_DB_KEY ?? process.env.SUPABASE_ANON_KEY
    const secret = process.env.CIRCUIT_DB_SECRET

    if(!url || !key || !secret)
        return null

    return { url: url.replace(/\/$/, ''), key, secret }
}

export const isConfigured = () => dbConfig() !== null && !!process.env.CIRCUIT_SECRET

// Un appel : rpc('circuit_board', { p_limit: 10 }) → valeur renvoyée par la
// fonction SQL. Le secret est ajouté ici, jamais par l'appelant.
export async function rpc(name, args = {})
{
    const config = dbConfig()
    if(!config)
        throw new Error('db_not_configured')

    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_secret: config.secret, ...args }),
    })

    if(!response.ok)
    {
        const detail = await response.text().catch(() => '')
        throw new Error(`db_http_${response.status}_${detail.slice(0, 120)}`)
    }

    // Une fonction sans valeur de retour répond avec un corps vide.
    const text = await response.text()

    return text.length === 0 ? null : JSON.parse(text)
}

// —— Quotas ———————————————————————————————————————————————————————————
// Un compteur par nature d'appel, par empreinte d'adresse et par heure.
// Large pour un joueur qui s'acharne, étroit pour un script.
export async function rateLimit(kind, ipHash, max)
{
    const bucket = `${kind}:${ipHash}:${Math.floor(Date.now() / 3600000)}`
    const hits = Number(await rpc('circuit_hit', { p_bucket: bucket, p_ttl_seconds: 3600 }))

    return { hits, exceeded: hits > max }
}

// —— Signatures ————————————————————————————————————————————————————————
const b64url = (buffer) => Buffer.from(buffer).toString('base64url')

const hmac = (key, message) => createHmac('sha256', key).update(message).digest()

const safeEqualHex = (a, b) =>
{
    const bufferA = Buffer.from(String(a), 'hex')
    const bufferB = Buffer.from(String(b), 'hex')

    return bufferA.length === bufferB.length && bufferA.length > 0 && timingSafeEqual(bufferA, bufferB)
}

// Empreinte d'adresse : jamais l'IP en clair (quotas et audit uniquement,
// donnée qui n'a pas à être conservée telle quelle).
export const hashIp = (request) =>
{
    const forwarded = String(request.headers['x-forwarded-for'] ?? '').split(',')[0].trim()
    const ip = forwarded || String(request.headers['x-real-ip'] ?? '') || 'unknown'

    return hmac(process.env.CIRCUIT_SECRET ?? 'dev', `ip:${ip}`).toString('hex').slice(0, 16)
}

// Jeton de course : charge utile lisible (le client a besoin de sa clé de
// signature) + HMAC serveur. Le client ne peut ni fabriquer ni retoucher un
// jeton, seulement rendre celui qu'on lui a donné.
export function issueRun(ipHash)
{
    const payload = {
        rid: randomBytes(12).toString('hex'),
        iat: Date.now(),
        ip: ipHash,
        key: randomBytes(16).toString('hex'),
    }

    const body = b64url(JSON.stringify(payload))
    const signature = hmac(process.env.CIRCUIT_SECRET, body).toString('hex')

    return { payload, token: `${body}.${signature}` }
}

export function readRunToken(token)
{
    if(typeof token !== 'string' || token.length > 512)
        return null

    const [ body, signature ] = token.split('.')
    if(!body || !signature)
        return null

    const expected = hmac(process.env.CIRCUIT_SECRET, body).toString('hex')
    if(!safeEqualHex(signature, expected))
        return null

    try
    {
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))

        if(typeof payload?.rid !== 'string' || typeof payload?.iat !== 'number' || typeof payload?.key !== 'string')
            return null

        return payload
    }
    catch
    {
        return null
    }
}

// Signature du dépôt, calculée par le client avec la clé de sa course
// (Web Crypto). Elle n'est pas un secret partagé — elle oblige simplement à
// passer par le vrai chemin du jeu plutôt que par un POST improvisé.
export const submissionMessage = ({ runId, timeMs, splits, firstName, lastName }) =>
    `${runId}|${timeMs}|${splits.join(',')}|${firstName}|${lastName}`

export const signSubmission = (runKey, fields) =>
    hmac(Buffer.from(runKey, 'hex'), submissionMessage(fields)).toString('hex')

// —— Noms —————————————————————————————————————————————————————————————
const NAME_ALLOWED = /^[\p{L}][\p{L}\p{M}' .-]*$/u

// Liste courte et volontairement grossière : elle écarte les blagues les plus
// évidentes sur un tableau public. La modération fine passe par le DELETE.
const BLOCKED = [
    'connard', 'connasse', 'enculé', 'encule', 'pute', 'putain', 'salope', 'merde', 'bite', 'couille',
    'nique', 'ntm', 'fdp', 'batard', 'bâtard', 'pédé', 'pede', 'negro', 'nègre', 'negre',
    'fuck', 'shit', 'bitch', 'cunt', 'dick', 'nigg', 'penis', 'asshole', 'hitler', 'nazi',
]

export const foldAccents = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const titleCase = (text) => text
    .toLocaleLowerCase('fr')
    .replace(/(^|[\s'-])(\p{L})/gu, (match, prefix, letter) => prefix + letter.toLocaleUpperCase('fr'))

const cleanPart = (value) => String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32)

// Prénom en capitale initiale, nom en majuscules : lisible sur le panneau du
// circuit comme dans le menu, et sans ambiguïté sur l'ordre des deux champs.
export function normalizeName(firstNameRaw, lastNameRaw)
{
    const firstName = cleanPart(firstNameRaw)
    const lastName = cleanPart(lastNameRaw)

    if(firstName.length < 2 || firstName.length > 18)
        return { error: 'first_name_length' }

    if(lastName.length < 1 || lastName.length > 24)
        return { error: 'last_name_length' }

    if(!NAME_ALLOWED.test(firstName) || !NAME_ALLOWED.test(lastName))
        return { error: 'name_characters' }

    const folded = foldAccents(`${firstName} ${lastName}`).toLowerCase()

    if(BLOCKED.some((word) => folded.includes(foldAccents(word))))
        return { error: 'name_rejected' }

    const display = `${titleCase(firstName)} ${lastName.toLocaleUpperCase('fr')}`

    // Clé d'unicité : une personne n'occupe qu'une ligne, son meilleur temps.
    // Un nom écrit hors alphabet latin (cyrillique, grec, chinois…) ne laisse
    // rien après le pliage : on lui donne alors une empreinte du nom, stable
    // et sans caractère exotique dans la clé d'unicité.
    const latin = folded.replace(/[^a-z0-9]/g, '').slice(0, 40)

    const person = latin.length >= 3
        ? latin
        : `x${createHash('sha256').update(folded).digest('hex').slice(0, 16)}`

    return { display, person }
}

// —— Contrôles du dépôt ———————————————————————————————————————————————
export function verifySubmission({ payload, body, ipHash, now = Date.now() })
{
    const timeMs = Number(body?.timeMs)
    const splits = Array.isArray(body?.splits) ? body.splits.map(Number) : null

    if(!Number.isFinite(timeMs) || !Number.isInteger(timeMs))
        return { error: 'invalid_time' }

    if(timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS)
        return { error: 'implausible_time' }

    if(!splits || splits.length < MIN_SPLITS || splits.length > MAX_SPLITS)
        return { error: 'invalid_splits' }

    let previous = null
    for(const split of splits)
    {
        if(!Number.isInteger(split) || split < 0 || split > MAX_TIME_MS)
            return { error: 'invalid_splits' }

        if(previous !== null && split - previous < MIN_SPLIT_DELTA_MS)
            return { error: 'invalid_splits' }

        previous = split
    }

    // Le dernier passage sur la ligne EST la fin de course : les deux valeurs
    // viennent du même chrono, elles doivent coïncider.
    if(Math.abs(splits[splits.length - 1] - timeMs) > 250)
        return { error: 'splits_mismatch' }

    // Cohérence avec l'horloge serveur : impossible d'annoncer un tour plus
    // long que le temps écoulé depuis le départ demandé.
    const wallClock = now - payload.iat

    if(wallClock < 0 || wallClock > MAX_RUN_AGE_MS)
        return { error: 'run_expired' }

    if(wallClock + CLOCK_TOLERANCE_MS < timeMs + COUNTDOWN_MS)
        return { error: 'clock_mismatch' }

    // Le jeton appartient à l'adresse qui a demandé le départ.
    if(payload.ip !== ipHash)
        return { error: 'run_mismatch' }

    return { timeMs, splits }
}
