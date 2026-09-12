-- Tableau public des temps du circuit 3D du portfolio.
--
-- Les tables vivent dans le schéma « circuit », que PostgREST n'expose pas :
-- la clé publiable seule ne donne donc accès à rien. Tout passe par les
-- fonctions publiques ci-dessous, et chacune exige le secret serveur (stocké
-- ici sous forme d'empreinte) que seule la fonction Vercel détient.

create schema if not exists circuit;
create extension if not exists pgcrypto with schema extensions;

-- Une ligne par personne : son meilleur temps.
create table if not exists circuit.score (
    person        text primary key,
    display_name  text not null,
    time_ms       integer not null check (time_ms > 0),
    splits        integer[] not null default '{}',
    run_id        text,
    ip_hash       text,
    first_seen_at timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

-- Classement : meilleur temps d'abord, puis le premier arrivé à ce temps.
create index if not exists score_ranking on circuit.score (time_ms, updated_at);

-- Jetons de course déjà publiés : une course ne compte qu'une fois.
create table if not exists circuit.run_claim (
    run_id     text primary key,
    claimed_at timestamptz not null default now()
);

-- Quotas par adresse et par heure.
create table if not exists circuit.rate_hit (
    bucket     text primary key,
    hits       integer not null default 0,
    expires_at timestamptz not null
);

-- Journaux bornés : audit des dépôts acceptés, et des refus pour réglage.
create table if not exists circuit.entry_log (
    id           bigint generated always as identity primary key,
    at           timestamptz not null default now(),
    person       text,
    display_name text,
    time_ms      integer,
    splits       integer[],
    run_id       text,
    ip_hash      text,
    user_agent   text
);

create table if not exists circuit.reject_log (
    id      bigint generated always as identity primary key,
    at      timestamptz not null default now(),
    error   text,
    ip_hash text,
    run_id  text,
    time_ms bigint
);

-- Empreinte du secret serveur. Le secret lui-même n'est jamais écrit ici.
create table if not exists circuit.api_secret (
    only_row      boolean primary key default true check (only_row),
    secret_sha256 text not null,
    set_at        timestamptz not null default now()
);

alter table circuit.score      enable row level security;
alter table circuit.run_claim  enable row level security;
alter table circuit.rate_hit   enable row level security;
alter table circuit.entry_log  enable row level security;
alter table circuit.reject_log enable row level security;
alter table circuit.api_secret enable row level security;

revoke all on schema circuit from public;
revoke all on all tables in schema circuit from public;

-- —— Porte d'entrée —————————————————————————————————————————————————————
create or replace function circuit.assert_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_stored text;
begin
    select secret_sha256 into v_stored from circuit.api_secret where only_row;

    if v_stored is null then
        raise exception 'circuit_secret_unset' using errcode = '28000';
    end if;

    if p_secret is null
       or encode(extensions.digest(p_secret, 'sha256'), 'hex') <> v_stored then
        raise exception 'circuit_forbidden' using errcode = '28000';
    end if;
end;
$$;

-- —— Lecture du classement ——————————————————————————————————————————————
create or replace function public.circuit_board(p_secret text, p_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_scores jsonb;
    v_total  integer;
begin
    perform circuit.assert_secret(p_secret);

    select count(*) into v_total from circuit.score;

    -- Le rang est calculé sur tout le monde, avant la coupe d'affichage.
    with ranked as (
        select display_name,
               time_ms,
               updated_at,
               rank() over (order by time_ms, updated_at) as rnk
        from circuit.score
        order by time_ms, updated_at
        limit greatest(coalesce(p_limit, 10), 0)
    )
    select coalesce(jsonb_agg(jsonb_build_object(
               'rank',   rnk,
               'name',   display_name,
               'timeMs', time_ms,
               'at',     (extract(epoch from updated_at) * 1000)::bigint
           ) order by rnk), '[]'::jsonb)
    into v_scores
    from ranked;

    return jsonb_build_object('scores', v_scores, 'total', v_total);
end;
$$;

-- —— Dépôt d'un temps ———————————————————————————————————————————————————
-- Le jeton de course est consommé ici, dans la même transaction que l'écriture :
-- deux dépôts simultanés de la même course ne peuvent pas passer tous les deux.
create or replace function public.circuit_submit(
    p_secret     text,
    p_run_id     text,
    p_person     text,
    p_display    text,
    p_time_ms    integer,
    p_splits     integer[],
    p_ip_hash    text,
    p_user_agent text,
    p_limit      integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_previous integer;
    v_improved boolean;
    v_rank     integer;
    v_total    integer;
begin
    perform circuit.assert_secret(p_secret);

    insert into circuit.run_claim(run_id) values (p_run_id) on conflict do nothing;

    if not found then
        return jsonb_build_object('error', 'already_submitted');
    end if;

    delete from circuit.run_claim where claimed_at < now() - interval '2 days';

    select time_ms into v_previous from circuit.score where person = p_person;
    v_improved := v_previous is null or p_time_ms < v_previous;

    insert into circuit.entry_log(person, display_name, time_ms, splits, run_id, ip_hash, user_agent)
    values (p_person, p_display, p_time_ms, p_splits, p_run_id, p_ip_hash, left(p_user_agent, 120));

    delete from circuit.entry_log
    where id <= (select max(id) - 500 from circuit.entry_log);

    if v_improved then
        insert into circuit.score(person, display_name, time_ms, splits, run_id, ip_hash)
        values (p_person, p_display, p_time_ms, p_splits, p_run_id, p_ip_hash)
        on conflict (person) do update set
            display_name = excluded.display_name,
            time_ms      = excluded.time_ms,
            splits       = excluded.splits,
            run_id       = excluded.run_id,
            ip_hash      = excluded.ip_hash,
            updated_at   = now();
    end if;

    select count(*) into v_total from circuit.score;

    select rnk into v_rank
    from (select person, rank() over (order by time_ms, updated_at) as rnk from circuit.score) r
    where r.person = p_person;

    return jsonb_build_object(
        'ok',         true,
        'improved',   v_improved,
        'previousMs', v_previous,
        'rank',       v_rank,
        'total',      v_total,
        'scores',     public.circuit_board(p_secret, p_limit) -> 'scores');
end;
$$;

-- —— Quotas ——————————————————————————————————————————————————————————————
create or replace function public.circuit_hit(p_secret text, p_bucket text, p_ttl_seconds integer default 3600)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_hits integer;
begin
    perform circuit.assert_secret(p_secret);

    delete from circuit.rate_hit where expires_at < now();

    insert into circuit.rate_hit(bucket, hits, expires_at)
    values (p_bucket, 1, now() + make_interval(secs => greatest(coalesce(p_ttl_seconds, 3600), 1)))
    on conflict (bucket) do update set hits = circuit.rate_hit.hits + 1
    returning hits into v_hits;

    return v_hits;
end;
$$;

-- —— Journal des refus ———————————————————————————————————————————————————
create or replace function public.circuit_reject(
    p_secret  text,
    p_error   text,
    p_ip_hash text,
    p_run_id  text,
    p_time_ms bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform circuit.assert_secret(p_secret);

    insert into circuit.reject_log(error, ip_hash, run_id, time_ms)
    values (left(p_error, 60), p_ip_hash, p_run_id, p_time_ms);

    delete from circuit.reject_log
    where id <= (select max(id) - 200 from circuit.reject_log);
end;
$$;

-- —— Modération ——————————————————————————————————————————————————————————
create or replace function public.circuit_remove(p_secret text, p_person text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_removed integer;
begin
    perform circuit.assert_secret(p_secret);

    delete from circuit.score where person = p_person;
    get diagnostics v_removed = row_count;

    return jsonb_build_object('ok', true, 'removed', p_person, 'found', v_removed > 0);
end;
$$;

-- Les fonctions sont appelables avec la clé publiable, mais ne font rien sans
-- le secret serveur.
revoke all on function public.circuit_board(text, integer) from public;
revoke all on function public.circuit_submit(text, text, text, text, integer, integer[], text, text, integer) from public;
revoke all on function public.circuit_hit(text, text, integer) from public;
revoke all on function public.circuit_reject(text, text, text, text, bigint) from public;
revoke all on function public.circuit_remove(text, text) from public;

grant execute on function public.circuit_board(text, integer) to anon, authenticated, service_role;
grant execute on function public.circuit_submit(text, text, text, text, integer, integer[], text, text, integer) to anon, authenticated, service_role;
grant execute on function public.circuit_hit(text, text, integer) to anon, authenticated, service_role;
grant execute on function public.circuit_reject(text, text, text, text, bigint) to anon, authenticated, service_role;
grant execute on function public.circuit_remove(text, text) to anon, authenticated, service_role;
