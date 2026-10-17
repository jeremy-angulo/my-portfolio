-- Les fonctions publiques ne font que vérifier le secret et déléguer à un
-- corps interne, dans le schéma world que l'API n'expose pas. Le corps se
-- teste directement en SQL ; l'accès par l'API reste fermé sans le secret.

create or replace function world.ingest(p_session jsonb, p_events jsonb, p_cells jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
    v_id uuid := (p_session ->> 'id')::uuid;
begin
    insert into world.session (id, active_s, lang, device, renderer, load_ms, embedded)
    values (
        v_id,
        least(greatest(coalesce((p_session ->> 'activeS')::integer, 0), 0), 86400),
        left(p_session ->> 'lang', 8),
        left(p_session ->> 'device', 12),
        left(p_session ->> 'renderer', 12),
        nullif(least(greatest(coalesce((p_session ->> 'loadMs')::integer, 0), 0), 600000), 0),
        (p_session ->> 'embedded')::boolean)
    on conflict (id) do update set
        last_seen_at = now(),
        active_s     = greatest(world.session.active_s, excluded.active_s),
        load_ms      = coalesce(world.session.load_ms, excluded.load_ms);

    insert into world.event (session_id, kind, detail, value)
    select v_id,
           left(e ->> 'kind', 24),
           left(e ->> 'detail', 60),
           case when (e ->> 'value') ~ '^-?[0-9]{1,9}$' then (e ->> 'value')::integer end
    from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) with ordinality as t(e, n)
    where n <= 100 and coalesce(e ->> 'kind', '') <> '';

    insert into world.cell (day, x, z, samples)
    select current_date,
           (c ->> 'x')::smallint,
           (c ->> 'z')::smallint,
           sum((c ->> 'n')::integer)
    from jsonb_array_elements(coalesce(p_cells, '[]'::jsonb)) with ordinality as t(c, n)
    where n <= 500
      and (c ->> 'x')::integer between 0 and 47
      and (c ->> 'z')::integer between 0 and 47
      and (c ->> 'n')::integer between 1 and 600
    group by 1, 2, 3
    on conflict (day, x, z) do update set samples = world.cell.samples + excluded.samples;

    -- Conservation 13 mois. Une fois sur cent suffit : la purge porte sur
    -- quelques lignes, l'essentiel est qu'elle finisse par passer.
    if random() < 0.01 then
        delete from world.session where started_at < now() - interval '13 months';
        delete from world.cell    where day < current_date - interval '13 months';
    end if;
end;
$$;

create or replace function world.report(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
    with s as (
        select * from world.session where started_at >= p_from and started_at < p_to
    ),
    e as (
        select e.* from world.event e join s on s.id = e.session_id
    ),
    funnel as (
        select
            count(distinct session_id) filter (where kind = 'zone' and detail = 'circuit')    as zone,
            count(distinct session_id) filter (where kind = 'race_start')                    as started,
            count(distinct session_id) filter (where kind = 'race_finish')                   as finished,
            count(distinct session_id) filter (where kind = 'race_submit' and detail = 'ok') as published,
            count(*) filter (where kind = 'race_start')  as starts,
            count(*) filter (where kind = 'race_finish') as laps
        from e
    )
    select jsonb_build_object(
        'sessions',      (select count(*) from s),
        'activeMedianS', (select percentile_disc(0.5) within group (order by active_s) from s),
        'activeP75S',    (select percentile_disc(0.75) within group (order by active_s) from s),
        'loadMedianMs',  (select percentile_disc(0.5) within group (order by load_ms) from s where load_ms is not null),
        'embedded',      (select count(*) from s where embedded),
        'daily',     coalesce((select jsonb_agg(jsonb_build_object('day', d, 'sessions', n) order by d)
                               from (select started_at::date as d, count(*) as n from s group by 1) x), '[]'::jsonb),
        'devices',   coalesce((select jsonb_agg(jsonb_build_object('label', label, 'sessions', n) order by n desc)
                               from (select coalesce(device, 'inconnu') as label, count(*) as n from s group by 1) x), '[]'::jsonb),
        'renderers', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'sessions', n) order by n desc)
                               from (select coalesce(renderer, 'inconnu') as label, count(*) as n from s group by 1) x), '[]'::jsonb),
        'zones',     coalesce((select jsonb_agg(jsonb_build_object('label', detail, 'sessions', n) order by n desc)
                               from (select detail, count(distinct session_id) as n
                                     from e where kind = 'zone' group by 1) x), '[]'::jsonb),
        'achievements', coalesce((select jsonb_agg(jsonb_build_object('label', detail, 'count', n) order by n desc)
                               from (select detail, count(*) as n from e where kind = 'achievement' group by 1) x), '[]'::jsonb),
        'interactions', coalesce((select jsonb_agg(jsonb_build_object('label', detail, 'count', n, 'sessions', ns) order by n desc)
                               from (select detail, count(*) as n, count(distinct session_id) as ns
                                     from e where kind = 'interaction' group by 1) x), '[]'::jsonb),
        'circuit',   (select jsonb_build_object(
                         'zone', zone, 'started', started, 'finished', finished, 'published', published,
                         'starts', starts, 'laps', laps,
                         'bestMs',   (select min(value) from e where kind = 'race_finish'),
                         'medianMs', (select percentile_disc(0.5) within group (order by value)
                                      from e where kind = 'race_finish'),
                         'tokens',   coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc)
                                               from (select coalesce(detail, '?') as label, count(*) as n
                                                     from e where kind = 'race_start' group by 1) x), '[]'::jsonb),
                         'outcomes', coalesce((select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc)
                                               from (select coalesce(detail, '?') as label, count(*) as n
                                                     from e where kind = 'race_submit' group by 1) x), '[]'::jsonb),
                         'laptimes', coalesce((select jsonb_agg(value order by value)
                                               from e where kind = 'race_finish' and value is not null), '[]'::jsonb))
                      from funnel),
        'cells',     coalesce((select jsonb_agg(jsonb_build_object('x', x, 'z', z, 'n', n))
                               from (select x, z, sum(samples) as n from world.cell
                                     where day >= p_from::date and day <= p_to::date
                                     group by 1, 2) x), '[]'::jsonb)
    )
$$;

revoke all on function world.ingest(jsonb, jsonb, jsonb) from public;
revoke all on function world.report(timestamptz, timestamptz) from public;

create or replace function public.world_ingest(
    p_secret  text,
    p_session jsonb,
    p_events  jsonb default '[]'::jsonb,
    p_cells   jsonb default '[]'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform circuit.assert_secret(p_secret);
    perform world.ingest(p_session, p_events, p_cells);
end;
$$;

create or replace function public.world_report(
    p_secret text,
    p_from   timestamptz,
    p_to     timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
    perform circuit.assert_secret(p_secret);
    return world.report(p_from, p_to);
end;
$$;

revoke all on function public.world_ingest(text, jsonb, jsonb, jsonb) from public;
revoke all on function public.world_report(text, timestamptz, timestamptz) from public;
grant execute on function public.world_ingest(text, jsonb, jsonb, jsonb) to anon, service_role;
grant execute on function public.world_report(text, timestamptz, timestamptz) to anon, service_role;
