-- SPEC 06 — Leaderboard real y tabla de juegos
-- Ejecutar manualmente en el SQL Editor del dashboard de Supabase.

create table games (
  id text primary key,
  title text not null,
  short text not null,
  long text not null,
  cat text not null,
  cover text not null,
  color text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  created_at timestamptz not null default now()
);

create table scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references games(id),
  player_name text not null check (char_length(player_name) between 1 and 10),
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index scores_game_id_score_idx on scores (game_id, score desc);

create view game_stats as
select
  g.id as game_id,
  coalesce(max(s.score), 0) as best,
  count(s.id) as plays
from games g
left join scores s on s.game_id = g.id
group by g.id;

alter table games enable row level security;
alter table scores enable row level security;

create policy "games_public_read" on games for select using (true);
create policy "scores_public_read" on scores for select using (true);
create policy "scores_public_insert" on scores for insert with check (true);
-- Sin política de insert/update/delete para games, ni de update/delete para scores:
-- RLS las bloquea por defecto para la anon key.
