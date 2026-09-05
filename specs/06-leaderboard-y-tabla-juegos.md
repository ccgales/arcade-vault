# 06 · Leaderboard real y tabla de juegos en Supabase

- **Estado:** Aprobado
- **Depende de:** SPEC 04, SPEC 05
- **Fecha:** 2026-09-04
- **Objetivo:** Migrar el catálogo de juegos y las puntuaciones a tablas reales de Supabase (`games` y `scores`), reemplazando `GAMES`/`seededScores()` de `lib/data.ts` como fuente de verdad en Biblioteca, Detalle de juego, Salón de la Fama y el botón "GUARDAR PUNTUACIÓN" del reproductor.

## Scope

**Dentro:**

- Script SQL (`supabase/sql/001_games_and_scores.sql`) con las tablas `games` y `scores`, la vista `game_stats` (best/plays calculados) y las políticas RLS descritas en Data model. Se ejecuta manualmente en el SQL Editor del dashboard de Supabase (no hay Supabase CLI ni migraciones automatizadas en este repo).
- Script SQL de siembra (`supabase/sql/002_seed.sql`) con los 8 juegos actuales de `lib/data.ts` (mismos `id`/título/textos/cover/color) y ~12 filas de `scores` por juego, con nombres tomados del `PLAYERS` actual y puntuaciones en el rango de los `best` actuales, para que el leaderboard y el podio no arranquen vacíos.
- `lib/games.ts`: `getGames()` (lista completa con `best`/`plays` vía `game_stats`, server-side) y `getGameById(id)` (un juego, server-side).
- `lib/scores.ts`: `getScoresByGame(gameId, limit)` (server-side, para Detalle/Salón) e `insertScore(gameId, playerName, score)` (client-side, vía `lib/supabase/client.ts`, para el botón GUARDAR PUNTUACIÓN).
- `app/biblioteca/page.tsx`, `app/juegos/[id]/page.tsx`, `app/juegos/[id]/jugar/page.tsx` y `app/salon/page.tsx` pasan a hacer el fetch server-side (con `lib/supabase/server.ts`) y a pasar los datos como props a los client components existentes (`Library`, `GameDetail`, `GamePlayer`, `HallOfFame`), que dejan de importar `GAMES`/`seededScores()` de `lib/data.ts` y reciben esos datos por props en su lugar, conservando su filtrado/tabs/UI actual.
- `HallOfFame.tsx` recibe la lista de juegos y los scores iniciales del primer tab como props; al cambiar de tab, pide los scores de ese juego client-side (vía `lib/scores.ts` con el cliente browser).
- `GamePlayer.tsx`: el botón "GUARDAR PUNTUACIÓN" inserta un score real en Supabase (para los 8 juegos del catálogo, no solo Asteroides) y llama a `router.refresh()` tras un guardado exitoso para que la navegación posterior (Detalle, Salón) muestre el dato server-side actualizado.
- Eliminar de `lib/data.ts`: el array `GAMES`, la interfaz `Game` (se mueve a `lib/games.ts`), `PLAYERS`, `seededScores()` y `ScoreRow`. `CATS` se mantiene (es vocabulario fijo de categorías de UI, no un dato de juego).

**Fuera de alcance (para futuros specs):**

- Autenticación real: se mantiene el input manual de nombre/iniciales (máx. 10 caracteres) que ya existe en el modal de fin de partida, sin depender de sesión.
- Anti-cheat, rate limiting o validación de rango de score al insertar: cualquiera con la anon key puede insertar cualquier puntuación en `scores`, sin límites.
- Editar o borrar puntuaciones ya guardadas (ni en la UI ni permitido por RLS).
- Migraciones automatizadas vía Supabase CLI o CI: los scripts SQL de este spec se ejecutan manualmente en el dashboard.
- Actualización en tiempo real (realtime/subscripciones) del `best` o del leaderboard mientras otra persona juega.
- Paginación del listado de scores en Detalle de juego o Salón de la Fama (se mantiene el límite actual, ~10–12 filas).
- Agregar juegos nuevos al catálogo más allá de los 8 actuales.
- `SUPABASE_SERVICE_ROLE_KEY` u operaciones con privilegios elevados (sigue sin usarse, según lo decidido en SPEC 04).
- Middleware de Next.js para refrescar sesión (sigue sin aplicar, no hay auth real).

## Data model

```sql
-- supabase/sql/001_games_and_scores.sql

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
```

```ts
// lib/games.ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number; // game_stats.best
  plays: number; // game_stats.plays
}

export async function getGames(): Promise<Game[]>;
export async function getGameById(id: string): Promise<Game | null>;
```

```ts
// lib/scores.ts
export interface ScoreRow {
  rank: number;
  name: string; // players_name
  score: number;
  date: string; // created_at formateado dd/mm/yyyy
}

export async function getScoresByGame(
  gameId: string,
  limit?: number,
): Promise<ScoreRow[]>;
export async function insertScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<void>;
```

`CATS` permanece sin cambios en `lib/data.ts`.

## Implementation plan

1. Crear `supabase/sql/001_games_and_scores.sql` con el schema completo (tablas `games`/`scores`, índice, vista `game_stats`, políticas RLS) descrito en Data model. Ejecutarlo en el SQL Editor de Supabase y confirmar en el dashboard que las tablas y la vista existen.
2. Crear `supabase/sql/002_seed.sql` con un `insert into games (...)` para los 8 juegos actuales (mismos valores de `id`/título/short/long/cat/cover/color que hoy en `lib/data.ts`) y un `insert into scores (...)` con ~12 filas por juego (nombres del `PLAYERS` actual, puntuaciones en el rango de los `best` actuales, `created_at` con fechas variadas). Ejecutarlo en Supabase y confirmar con un `select count(*)` que ambas tablas tienen datos.
3. Crear `lib/games.ts` con `Game`, `getGames()` y `getGameById(id)`, usando `lib/supabase/server.ts` y consultando `games` con un join/lookup contra la vista `game_stats` para `best`/`plays`.
4. Crear `lib/scores.ts` con `ScoreRow`, `getScoresByGame(gameId, limit)` (usa `lib/supabase/server.ts`) e `insertScore(gameId, playerName, score)` (usa `lib/supabase/client.ts`).
5. Editar `app/biblioteca/page.tsx` para llamar a `getGames()` y pasar el resultado como prop `games` a `Library`; editar `Library.tsx` para recibir `games: Game[]` por props en vez de importar `GAMES` de `lib/data.ts`, conservando el filtrado por texto/categoría actual.
6. Editar `app/juegos/[id]/page.tsx` para usar `getGameById(id)` en vez de `GAMES.find(...)` (manteniendo `notFound()` si no existe), y además llamar a `getScoresByGame(id)` para pasarlo como prop `scores` a `GameDetail`; editar `GameDetail.tsx` para recibir `scores: ScoreRow[]` por props en vez de llamar a `seededScores()`.
7. Editar `app/juegos/[id]/jugar/page.tsx` para usar `getGameById(id)` en vez de `GAMES.find(...)`.
8. Editar `app/salon/page.tsx` para volverse `async` (Server Component): llama a `getGames()` y a `getScoresByGame(games[0].id)`, pasando ambos como props (`games`, `initialScores`) a `HallOfFame`.
9. Editar `HallOfFame.tsx` para recibir `games`/`initialScores` por props (en vez de importar `GAMES`/`seededScores`); al cambiar de tab, llamar a `getScoresByGame` (versión client-side sobre `lib/supabase/client.ts`) para traer los scores del juego seleccionado.
10. Editar `GamePlayer.tsx`: en el botón "GUARDAR PUNTUACIÓN", llamar a `insertScore(game.id, name, score)`; marcar `saved` (mostrar el toast actual) solo si la inserción no lanza error, y llamar a `router.refresh()` justo después de un guardado exitoso.
11. Eliminar de `lib/data.ts` el array `GAMES`, la interfaz `Game`, `PLAYERS`, `seededScores()` y `ScoreRow` (ya migrados o sin uso); dejar solo `CATS`.
12. Ejecutar `npm run dev` y probar manualmente: Biblioteca lista los 8 juegos con `best`/`plays` reales; Detalle de juego muestra el leaderboard real; Salón de la Fama cambia de tab y trae los scores reales de cada juego; jugar una partida en Asteroides y en un juego simulado, guardar la puntuación en ambos, y confirmar (recargando Detalle/Salón) que el nuevo score aparece.
13. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Acceptance criteria

- [ ] `supabase/sql/001_games_and_scores.sql` ejecutado crea `games`, `scores`, el índice `scores_game_id_score_idx` y la vista `game_stats` sin errores.
- [ ] RLS está habilitado en `games` y `scores`; con la anon key se puede hacer `select` en ambas tablas y `insert` en `scores`, pero no `insert`/`update`/`delete` en `games` ni `update`/`delete` en `scores`.
- [ ] `supabase/sql/002_seed.sql` ejecutado deja 8 filas en `games` y al menos 12 filas de `scores` por cada juego.
- [ ] Biblioteca (`/biblioteca`) muestra los 8 juegos con "MEJOR PUNTUACIÓN" igual al `max(score)` real de `scores` para cada uno.
- [ ] Detalle de juego (`/juegos/[id]`) muestra un leaderboard con datos reales de `scores` (no `seededScores()`), ordenado de mayor a menor puntuación.
- [ ] Salón de la Fama (`/salon`) muestra el podio y la tabla con datos reales de `scores` para el juego seleccionado, y cambia correctamente al hacer clic en otro tab de juego.
- [ ] Jugar una partida y hacer clic en "GUARDAR PUNTUACIÓN" inserta una fila nueva en `scores` con el `game_id`, `player_name` y `score` correctos.
- [ ] Tras guardar una puntuación y volver a Detalle de juego o Salón de la Fama, la nueva puntuación aparece en el leaderboard correspondiente (sin recompilar ni reiniciar el servidor).
- [ ] El botón "GUARDAR PUNTUACIÓN" funciona igual para Asteroides que para cualquiera de los 7 juegos simulados.
- [ ] `lib/data.ts` ya no exporta `GAMES`, `Game`, `PLAYERS`, `seededScores` ni `ScoreRow`; solo exporta `CATS`.
- [ ] Ningún archivo del proyecto importa `GAMES` o `seededScores` de `lib/data.ts` (todo pasa por `lib/games.ts`/`lib/scores.ts`).
- [ ] No hay errores ni warnings en la consola del navegador al navegar por Biblioteca, Detalle, Salón de la Fama y al guardar una puntuación.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** un solo spec combinado para la tabla `games` y la tabla `scores`. **No:** dos specs separados, porque `scores.game_id` referencia a `games.id` y diseñar ambas tablas por separado obligaría a rehacer el esquema de foreign key más adelante.
- **Sí:** la tabla `games` reemplaza a `GAMES` de `lib/data.ts` como fuente de verdad en toda la app (Biblioteca, Detalle, Reproductor, Salón de la Fama). **No:** mantener `lib/data.ts` como fuente visual y usar `games` solo para el foreign key, para evitar tener el catálogo duplicado en dos lugares que se puedan desincronizar.
- **Sí:** mantener el input manual de nombre/iniciales (sin autenticación real) para guardar un score. **No:** exigir login real en este spec, porque `Auth.tsx` sigue siendo simulado y agregar auth real ampliaría el alcance muy por encima de "leaderboard + tabla de juegos".
- **Sí:** el botón "GUARDAR PUNTUACIÓN" persiste de verdad para los 8 juegos del catálogo, no solo para Asteroides. **No:** limitarlo solo al único juego real, para mantener el comportamiento uniforme entre juegos que ya existía de forma simulada.
- **Sí:** `games.id` es el mismo slug de texto usado hoy en las rutas (`"asteroides"`, `"caida"`, etc.), como primary key `text`. **No:** un `uuid` con columna `slug` aparte, porque no cambia ninguna ruta existente y evita resolver por slug en vez de por id en todo el código de rutas.
- **Sí:** `best` y `plays` se calculan dinámicamente desde `scores` (vía la vista `game_stats`). **No:** mantenerlos como columnas estáticas en `games`, porque dejarían de reflejar la realidad en cuanto se guarde la primera puntuación nueva.
- **Sí:** sembrar `scores` con datos iniciales realistas (basados en los valores actuales de `seededScores()`) para los 8 juegos. **No:** arrancar la tabla vacía, porque el podio de Salón de la Fama asume al menos 3 filas por juego y un leaderboard vacío el primer día sería un cambio visual no solicitado.
- **Sí:** RLS permite `insert` público (sin restricciones) en `scores`, coherente con no tener auth real todavía. **No:** agregar rate limiting o validación de rango en este spec; queda documentado como riesgo conocido para un spec futuro de auth/anti-cheat.
- **Sí:** Biblioteca, Detalle de juego y Salón de la Fama hacen el fetch inicial en un Server Component (`lib/supabase/server.ts`) y pasan los datos como props a los client components existentes. **No:** fetch client-side con `useEffect` en los componentes actuales, para evitar introducir estados de carga/spinners que hoy no existen.
- **Sí:** los scripts SQL (`001_games_and_scores.sql`, `002_seed.sql`) se ejecutan manualmente en el SQL Editor de Supabase. **No:** un script Node con `SUPABASE_SERVICE_ROLE_KEY`, para no reabrir la decisión de SPEC 04 de no usar esa key todavía.
- **Sí:** tras guardar una puntuación, `GamePlayer.tsx` llama a `router.refresh()` para que la navegación posterior a Detalle/Salón muestre el dato actualizado. **No:** suscripciones realtime de Supabase, porque no hay ningún requisito de ver el cambio sin navegar.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                         | Mitigación                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RLS abierta en `insert` permite que cualquiera con la anon key guarde puntuaciones falsas o absurdamente altas, ensuciando el leaderboard.                                                                                     | Aceptado como riesgo conocido de este spec (documentado en Scope/Decisiones); anti-cheat y rate limiting quedan para un spec futuro junto con auth real.                                                     |
| La vista `game_stats` recalcula `max`/`count` sobre toda la tabla `scores` en cada consulta; con muchas filas podría volverse lenta.                                                                                           | El índice `scores_game_id_score_idx` cubre el `group by game_id` y el `max(score)`; a la escala actual (decenas de filas por juego) no es un problema, se puede materializar la vista más adelante si crece. |
| Los datos de siembra en `002_seed.sql` son valores fijos escritos a mano, a diferencia de `seededScores()` que los generaba con una semilla determinística por juego; podrían no coincidir exactamente con los que se ven hoy. | Aceptable: son datos de ejemplo, no puntuaciones reales de usuarios; el objetivo es que el leaderboard no se vea vacío, no reproducir bit a bit los valores simulados anteriores.                            |

## What is **not** in this spec

- Autenticación real (se mantiene el input manual de nombre/iniciales).
- Anti-cheat, rate limiting o validación de rango de score al insertar.
- Edición o borrado de puntuaciones ya guardadas.
- Migraciones automatizadas vía Supabase CLI o CI.
- Actualización en tiempo real (realtime) del leaderboard.
- Paginación del listado de scores.
- Nuevos juegos más allá de los 8 actuales.
- `SUPABASE_SERVICE_ROLE_KEY` u operaciones con privilegios elevados.
- Middleware de Next.js para refrescar sesión.

Cada uno de estos, si se necesita, va en su propio spec.
