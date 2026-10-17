-- Mesure d'audience du monde 3D, collectée sur le domaine du site.
--
-- Pourquoi ici plutôt que GoatCounter : le script GoatCounter vient d'un
-- domaine tiers que bloqueurs et filtres d'entreprise écartent, il ne sait
-- pas compter des visiteurs uniques, et la carte de chaleur Better Stack ne
-- garde que trois jours. Ici : une session = un chargement du monde, sans
-- cookie, sans IP, sans rien qui survive à l'onglet. Conservation 13 mois.
--
-- Même modèle de sécurité que le circuit : schéma non exposé, fonctions
-- appelables avec la clé publiable mais inertes sans le secret serveur.
--
-- Les fonctions publiques créées ici sont remplacées par la migration
-- suivante (world_analytics_split) ; seules les tables restent de celle-ci.

create schema if not exists world;

-- Un chargement du monde 3D. L'identifiant est tiré au hasard par le
-- navigateur et n'est conservé nulle part côté client.
create table if not exists world.session (
    id           uuid primary key,
    started_at   timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),
    active_s     integer not null default 0 check (active_s >= 0),
    lang         text,
    device       text,
    renderer     text,
    load_ms      integer,
    embedded     boolean
);

create index if not exists session_started on world.session (started_at);

-- Ce qui arrive pendant la session : zone découverte, succès, interaction,
-- étapes de la course. `value` porte un nombre quand il y en a un (chrono).
create table if not exists world.event (
    id         bigint generated always as identity primary key,
    session_id uuid not null references world.session (id) on delete cascade,
    at         timestamptz not null default now(),
    kind       text not null,
    detail     text,
    value      integer
);

create index if not exists event_at on world.event (at);
create index if not exists event_session on world.event (session_id);

-- Carte de chaleur, agrégée par jour : jamais de position brute.
create table if not exists world.cell (
    day     date not null,
    x       smallint not null check (x between 0 and 47),
    z       smallint not null check (z between 0 and 47),
    samples integer not null check (samples > 0),
    primary key (day, x, z)
);

alter table world.session enable row level security;
alter table world.event   enable row level security;
alter table world.cell    enable row level security;

revoke all on schema world from public;
revoke all on all tables in schema world from public;
