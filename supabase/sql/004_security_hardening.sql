-- SPEC 20 — Medidas de seguridad básicas
-- Ejecutar manualmente en el SQL Editor del dashboard de Supabase.

-- 1. Política de insert de scores con condiciones reales (antes: with check (true)).
--    Solo aplica a inserts nuevos; las filas existentes no se revalidan.
--    El exists sobre games depende de la política games_public_read (SPEC 06).
drop policy if exists "scores_public_insert" on scores;

create policy "scores_public_insert" on scores for insert with check (
  char_length(btrim(player_name)) between 1 and 10
  and score between 0 and 9999999
  and exists (select 1 from games g where g.id = game_id)
);

-- 2. rls_auto_enable() es SECURITY DEFINER y existe solo en la base remota
--    (no está en ninguna migración). No se modifica ni se elimina: solo deja
--    de ser ejecutable vía /rest/v1/rpc. Se revierte con un grant execute.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
