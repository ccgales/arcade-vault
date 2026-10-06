-- SPEC 21 — Paso a producción: bootstrap del proyecto Supabase PROD
-- Ejecutar manualmente UNA SOLA VEZ en el SQL Editor del proyecto de PRODUCCIÓN (nunca en dev).
-- Equivale a 001 + 002 (solo `games`) + 003 (solo la fila de `games`) + 004, en un único paso.
-- Es transaccional: si algo falla, no queda nada a medias. No inserta ninguna fila en `scores`.
-- No sustituye a supabase/sql/001–004 (siguen siendo el historial append-only de dev).

begin;

-- 1. Tablas ------------------------------------------------------------------

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

-- 2. Vista -------------------------------------------------------------------
-- DIFERENCIA CONSCIENTE CON DEV: en dev la vista es SECURITY DEFINER (default de Postgres) y el
-- Security Advisor la marca como ERROR (`security_definer_view`). Aquí nace con security_invoker.
-- El resultado para `anon` es idéntico porque games y scores tienen lectura pública por RLS.

create view game_stats with (security_invoker = true) as
select
  g.id as game_id,
  coalesce(max(s.score), 0) as best,
  count(s.id) as plays
from games g
left join scores s on s.game_id = g.id
group by g.id;

-- 3. RLS y políticas ---------------------------------------------------------
-- Política de insert directamente en su versión endurecida (SPEC 20 / 004).
-- Depende de games_public_read por el `exists` sobre games.

alter table games enable row level security;
alter table scores enable row level security;

create policy "games_public_read" on games for select using (true);
create policy "scores_public_read" on scores for select using (true);
create policy "scores_public_insert" on scores for insert with check (
  char_length(btrim(player_name)) between 1 and 10
  and score between 0 and 9999999
  and exists (select 1 from games g where g.id = game_id)
);
-- Sin política de insert/update/delete para games, ni de update/delete para scores:
-- RLS las bloquea por defecto para la anon key.

-- 4. Catálogo (9 juegos) -----------------------------------------------------
-- Textos tomados de 002_seed.sql / 003_add_frogger.sql. No se copiaron las filas de dev:
-- 8 de ellas tienen un salto de línea \r\n insertado en medio de `long` (corrupción en dev).

insert into games (id, title, short, long, cat, cover, color) values
  ('bloque-buster', 'BLOQUE BUSTER', 'Rebota la pelota y destruye muros de neón.', 'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?', 'ARCADE', 'cover-bricks', 'cyan'),
  ('caida', 'CAÍDA', 'Encaja las piezas antes de que el techo te aplaste.', 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.', 'PUZZLE', 'cover-tetro', 'magenta'),
  ('serpentina', 'SERPENTINA', 'Crece sin morder tu propia cola.', 'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.', 'ARCADE', 'cover-snake', 'green'),
  ('gloton', 'GLOTÓN', 'Devora puntos y escapa de los fantasmas.', 'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.', 'ARCADE', 'cover-glot', 'yellow'),
  ('invasores', 'INVASORES', 'Defiende el planeta de filas alienígenas.', 'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.', 'SHOOTER', 'cover-invaders', 'green'),
  ('asteroides', 'ASTEROIDES', 'Pulveriza asteroides en gravedad cero.', 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.', 'SHOOTER', 'cover-asteroides', 'yellow'),
  ('ranaria', 'RANARIA', 'Cruza la autopista de pixeles.', 'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.', 'ARCADE', 'cover-rana', 'green'),
  ('duelo-pixel', 'DUELO PIXEL', 'Dos paletas. Una pelota. Reflejos máximos.', 'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.', 'VERSUS', 'cover-duelo', 'cyan'),
  ('frogger', 'FROGGER', 'Cruza la carretera y el río sin convertirte en papilla.', 'Guía a tu rana a través de una carretera repleta de coches y un río de troncos y tortugas flotantes. Llena las cinco bocas del otro lado para completar la ronda; cada nivel acelera el tráfico y acorta el tiempo. Tres vidas y mucho asfalto por delante.', 'ARCADE', 'cover-frogger', 'green');

-- 5. rls_auto_enable() -------------------------------------------------------
-- En dev existe (event trigger `ensure_rls`) y su EXECUTE está revocado a anon/authenticated (004).
-- En prod solo existe si el proyecto se creó con "Enable automatic RLS"; por eso es condicional.
-- Si no existe en prod, este bloque no hace nada (y el Advisor tampoco lo marcará).

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;

commit;
