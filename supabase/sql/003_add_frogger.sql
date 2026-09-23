-- SPEC game-jam/flogger/03-frogger-core — Frogger: integración core del juego
-- Añade la fila 'frogger' a games + ~12 scores de ejemplo.
-- Ejecutar manualmente en el SQL Editor del dashboard de Supabase, después de 001/002.
-- color 'lime' del spec original no existe en el CHECK constraint de 001_games_and_scores.sql
-- (solo cyan/magenta/yellow/green) — se usa 'green' en su lugar (decisión tomada en implementación).

insert into games (id, title, short, long, cat, cover, color) values
  ('frogger', 'FROGGER', 'Cruza la carretera y el río sin convertirte en papilla.', 'Guía a tu rana a través de una carretera repleta de coches y un río de troncos y tortugas flotantes. Llena las cinco bocas del otro lado para completar la ronda; cada nivel acelera el tráfico y acorta el tiempo. Tres vidas y mucho asfalto por delante.', 'ARCADE', 'cover-frogger', 'green');

insert into scores (game_id, player_name, score, created_at) values
  ('frogger', 'VECTORX',   14200, '2026-09-18 14:12:00+00'),
  ('frogger', 'JOY_STK',   12850, '2026-09-16 09:40:00+00'),
  ('frogger', 'RETROVIRA', 11400, '2026-09-14 18:05:00+00'),
  ('frogger', 'PX_KAI',     9900, '2026-09-12 11:30:00+00'),
  ('frogger', 'NEONFOX',    8600, '2026-09-10 20:15:00+00'),
  ('frogger', 'Z3R0COOL',   7300, '2026-09-08 16:50:00+00'),
  ('frogger', 'M00NRYU',    6100, '2026-09-06 08:20:00+00'),
  ('frogger', 'VAULT_07',   4900, '2026-09-04 13:45:00+00'),
  ('frogger', 'GLITCHA',    3800, '2026-09-02 19:10:00+00'),
  ('frogger', 'ATARI_KID',  2700, '2026-08-31 10:35:00+00'),
  ('frogger', 'CYBER_LU',   1650, '2026-08-29 15:00:00+00'),
  ('frogger', 'MAGENTA88',   820, '2026-08-27 21:25:00+00');
