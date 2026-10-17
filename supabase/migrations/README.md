# Base du site : temps du circuit et mesure du monde 3D

Le tableau public des temps du circuit 3D s'appuie sur une base Postgres
(Supabase, projet `portfolio-circuit`, région Paris, offre gratuite). Ces
fichiers sont la structure telle qu'elle est appliquée : les rejouer sur une
base vide reconstruit exactement la même.

Le principe : **les tables ne sont pas exposées**. Elles vivent dans le schéma
`circuit`, que l'API REST ne publie pas ; seules les fonctions du schéma
`public` sont appelables, et chacune commence par vérifier le secret serveur
`CIRCUIT_DB_SECRET`. Une clé publiable interceptée ne permet donc ni de lire le
journal, ni d'écrire une ligne.

Après avoir appliqué les migrations sur une nouvelle base, il reste à y poser
l'empreinte du secret (le secret lui-même n'est jamais écrit en base) :

```sql
insert into circuit.api_secret (only_row, secret_sha256)
values (true, '<sha256 hexadécimal de CIRCUIT_DB_SECRET>')
on conflict (only_row) do update set secret_sha256 = excluded.secret_sha256, set_at = now();
```

Les trois variables à poser côté Vercel (portée Production) : `CIRCUIT_DB_URL`,
`CIRCUIT_DB_KEY` (clé publiable) et `CIRCUIT_DB_SECRET`. Elles s'ajoutent à
`CIRCUIT_SECRET` (signature des jetons de course) et `CIRCUIT_ADMIN_TOKEN`
(retrait d'une ligne).

## Mesure du monde 3D (schéma `world`)

Depuis le 17 octobre 2026, la même base reçoit la mesure d'audience du monde
3D (`api/world.js`, écrit par `folio/sources/Game/Telemetry.js`, lu par
`api/stats.js` pour `/statistiques`). Trois tables : `world.session` (un
chargement du monde, identifiant tiré au hasard par l'onglet), `world.event`
(zones, succès, interactions, étapes de course) et `world.cell` (carte de
chaleur agrégée par jour). Ni cookie, ni adresse IP, conservation 13 mois.

Même modèle que le circuit : les fonctions `public.world_ingest` et
`public.world_report` vérifient le secret puis délèguent à `world.ingest` et
`world.report`, qui ne sont pas exposées par l'API. Ces deux dernières se
testent directement en SQL, sans le secret :

```sql
select jsonb_pretty(world.report(now() - interval '7 days', now()));
```
