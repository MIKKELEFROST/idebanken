-- Kobling til Notion-databasen "Idébanken".
--
-- Synkroniseringen kører som Edge Function'en `notion-sync` hvert minut og
-- afstemmer begge veje, i stedet for triggere der fyrer ved hver ændring.
-- Fordelen er at den kan køres igen uden bivirkninger: forskellen regnes altid
-- ud fra tidsstempler, så et kald der fejler halvvejs bliver samlet op af det
-- næste.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

alter table public.ideas
  add column if not exists notion_page_id text,
  add column if not exists notion_synced_at timestamptz;

create unique index if not exists ideas_notion_page_idx
  on public.ideas (notion_page_id) where notion_page_id is not null;

-- Bemærk: de to nye kolonner er bevidst ikke med i kolonnerettighederne for
-- anon, så de er interne. Offentligheden ser dem aldrig.

create table if not exists public.sync_state (
  id             integer primary key default 1 check (id = 1),
  last_run       timestamptz not null default '-infinity',
  last_ok        timestamptz,
  last_error     text,
  runs           integer not null default 0,
  ud_til_notion  integer not null default 0,
  ind_fra_notion integer not null default 0
);

insert into public.sync_state (id) values (1) on conflict (id) do nothing;

alter table public.sync_state enable row level security;

revoke all on public.sync_state from anon, authenticated;
grant select on public.sync_state to authenticated;

create policy sync_state_admin_read on public.sync_state
  for select to authenticated using (public.is_admin());


-- updated_at må ikke røre sig, når det eneste der ændrede sig er
-- synkroniseringens eget bogholderi. Ellers ville hver kørsel gøre idéen
-- "nyere end sidste synkronisering" og udløse den næste — i det uendelige.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'notion_synced_at' - 'notion_page_id' - 'updated_at')
       = (to_jsonb(old) - 'notion_synced_at' - 'notion_page_id' - 'updated_at')
  then
    new.updated_at := old.updated_at;
    return new;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

-- Kaldes af Edge Function'en når en idé er skrevet ud til Notion. Sættes til
-- efter updated_at, så den samme ændring ikke skubbes ud igen næste minut.
create or replace function public.marker_notion_synkroniseret(p_id bigint)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.ideas set notion_synced_at = now() where id = p_id;
$$;

revoke all on function public.marker_notion_synkroniseret(bigint)
  from public, anon, authenticated;

-- Kør afstemningen hvert minut. Nøglen i headeren er den offentlige
-- publishable key — den beskytter ikke noget, men lader Supabase' gateway
-- afvise kald uden nogen form for legitimation.
select cron.schedule(
  'notion-sync',
  '* * * * *',
  $job$
    select net.http_post(
      url := 'https://vijrgeoqukkwnjanhwcm.supabase.co/functions/v1/notion-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_2_n8WPgdpzanUkyXU3V9sg_gZg_o0tj'
      ),
      body := '{}'::jsonb
    );
  $job$
);
