-- SPEC 21 — Verificación del bootstrap. Solo lectura (únicamente `select`).
-- Se ejecuta en el SQL Editor de PROD tras 000_bootstrap_prod.sql. Los resultados esperados
-- están en specs/21-paso-a-produccion.md.

-- 1. RLS activo en ambas tablas → 2 filas, rowsecurity = true
select tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename in ('games', 'scores')
order by tablename;

-- 2. Políticas → 3 filas; scores_public_insert con el check endurecido
select tablename, policyname, cmd, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Vista game_stats → reloptions = {security_invoker=true}
select relname, relkind, reloptions
from pg_class
where relnamespace = 'public'::regnamespace and relname = 'game_stats';

-- 4. Conteos → games = 9, scores = 0
select
  (select count(*) from games) as games_total,
  (select count(*) from scores) as scores_total;

-- 5. Ningún `long` con saltos de línea incrustados → 0 filas
select id from games where "long" ~ E'[\r\n]';

-- 6. rls_auto_enable → 0 filas (no existe en prod) o 1 fila con acl SIN anon ni authenticated
select p.proname, p.proacl::text as acl
from pg_proc p
where p.pronamespace = 'public'::regnamespace and p.proname = 'rls_auto_enable';

-- 7. Catálogo completo → 9 ids: asteroides, bloque-buster, caida, duelo-pixel, frogger, gloton,
--    invasores, ranaria, serpentina
select id, cat, cover, color from games order by id;
