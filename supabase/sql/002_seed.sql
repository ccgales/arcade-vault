-- SPEC 06 — Leaderboard real y tabla de juegos
-- Seed inicial: los 8 juegos actuales de lib/data.ts + ~12 scores por juego
-- (valores de ejemplo en el rango de los `best` actuales, no puntuaciones reales).
-- Ejecutar manualmente en el SQL Editor del dashboard de Supabase, después de 001_games_and_scores.sql.

insert into games (id, title, short, long, cat, cover, color) values
  ('bloque-buster', 'BLOQUE BUSTER', 'Rebota la pelota y destruye muros de neón.', 'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?', 'ARCADE', 'cover-bricks', 'cyan'),
  ('caida', 'CAÍDA', 'Encaja las piezas antes de que el techo te aplaste.', 'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.', 'PUZZLE', 'cover-tetro', 'magenta'),
  ('serpentina', 'SERPENTINA', 'Crece sin morder tu propia cola.', 'Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.', 'ARCADE', 'cover-snake', 'green'),
  ('gloton', 'GLOTÓN', 'Devora puntos y escapa de los fantasmas.', 'Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.', 'ARCADE', 'cover-glot', 'yellow'),
  ('invasores', 'INVASORES', 'Defiende el planeta de filas alienígenas.', 'Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.', 'SHOOTER', 'cover-invaders', 'green'),
  ('asteroides', 'ASTEROIDES', 'Pulveriza asteroides en gravedad cero.', 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.', 'SHOOTER', 'cover-asteroides', 'yellow'),
  ('ranaria', 'RANARIA', 'Cruza la autopista de pixeles.', 'Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.', 'ARCADE', 'cover-rana', 'green'),
  ('duelo-pixel', 'DUELO PIXEL', 'Dos paletas. Una pelota. Reflejos máximos.', 'El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.', 'VERSUS', 'cover-duelo', 'cyan');

insert into scores (game_id, player_name, score, created_at) values
  -- bloque-buster
  ('bloque-buster', 'PX_KAI',    28450, '2026-08-30 14:12:00+00'),
  ('bloque-buster', 'NEONFOX',   27110, '2026-08-27 09:40:00+00'),
  ('bloque-buster', 'Z3R0COOL',  25980, '2026-08-24 18:05:00+00'),
  ('bloque-buster', 'M00NRYU',   24500, '2026-08-20 11:30:00+00'),
  ('bloque-buster', 'VAULT_07',  23350, '2026-08-16 20:15:00+00'),
  ('bloque-buster', 'GLITCHA',   22100, '2026-08-11 16:50:00+00'),
  ('bloque-buster', 'ATARI_KID', 20890, '2026-08-05 08:20:00+00'),
  ('bloque-buster', 'CYBER_LU',  19700, '2026-07-29 13:45:00+00'),
  ('bloque-buster', 'MAGENTA88', 18450, '2026-07-20 19:10:00+00'),
  ('bloque-buster', 'SCANLINE',  17200, '2026-07-10 10:35:00+00'),
  ('bloque-buster', 'BIT_LORD',  16050, '2026-06-28 15:00:00+00'),
  ('bloque-buster', 'ARKADYA',   14900, '2026-06-15 21:25:00+00'),

  -- caida
  ('caida', 'M00NRYU',   184220, '2026-08-30 14:12:00+00'),
  ('caida', 'VAULT_07',  176500, '2026-08-27 09:40:00+00'),
  ('caida', 'GLITCHA',   168300, '2026-08-24 18:05:00+00'),
  ('caida', 'ATARI_KID', 159700, '2026-08-20 11:30:00+00'),
  ('caida', 'CYBER_LU',  151200, '2026-08-16 20:15:00+00'),
  ('caida', 'MAGENTA88', 143800, '2026-08-11 16:50:00+00'),
  ('caida', 'SCANLINE',  135600, '2026-08-05 08:20:00+00'),
  ('caida', 'BIT_LORD',  127400, '2026-07-29 13:45:00+00'),
  ('caida', 'ARKADYA',   119800, '2026-07-20 19:10:00+00'),
  ('caida', 'DROID_X',   111500, '2026-07-10 10:35:00+00'),
  ('caida', 'RGB_QUEEN', 103200, '2026-06-28 15:00:00+00'),
  ('caida', 'PIXEL_DAD',  95700, '2026-06-15 21:25:00+00'),

  -- serpentina
  ('serpentina', 'ATARI_KID', 7820, '2026-08-30 14:12:00+00'),
  ('serpentina', 'CYBER_LU',  7340, '2026-08-27 09:40:00+00'),
  ('serpentina', 'MAGENTA88', 6890, '2026-08-24 18:05:00+00'),
  ('serpentina', 'SCANLINE',  6420, '2026-08-20 11:30:00+00'),
  ('serpentina', 'BIT_LORD',  5980, '2026-08-16 20:15:00+00'),
  ('serpentina', 'ARKADYA',   5540, '2026-08-11 16:50:00+00'),
  ('serpentina', 'DROID_X',   5100, '2026-08-05 08:20:00+00'),
  ('serpentina', 'RGB_QUEEN', 4680, '2026-07-29 13:45:00+00'),
  ('serpentina', 'PIXEL_DAD', 4250, '2026-07-20 19:10:00+00'),
  ('serpentina', 'RETROVIRA', 3820, '2026-07-10 10:35:00+00'),
  ('serpentina', 'VECTORX',   3400, '2026-06-28 15:00:00+00'),
  ('serpentina', 'JOY_STK',   2980, '2026-06-15 21:25:00+00'),

  -- gloton
  ('gloton', 'SCANLINE',  96400, '2026-08-30 14:12:00+00'),
  ('gloton', 'BIT_LORD',  91200, '2026-08-27 09:40:00+00'),
  ('gloton', 'ARKADYA',   86500, '2026-08-24 18:05:00+00'),
  ('gloton', 'DROID_X',   81700, '2026-08-20 11:30:00+00'),
  ('gloton', 'RGB_QUEEN', 76900, '2026-08-16 20:15:00+00'),
  ('gloton', 'PIXEL_DAD', 72300, '2026-08-11 16:50:00+00'),
  ('gloton', 'RETROVIRA', 67800, '2026-08-05 08:20:00+00'),
  ('gloton', 'VECTORX',   63200, '2026-07-29 13:45:00+00'),
  ('gloton', 'JOY_STK',   58700, '2026-07-20 19:10:00+00'),
  ('gloton', 'PX_KAI',    54100, '2026-07-10 10:35:00+00'),
  ('gloton', 'NEONFOX',   49600, '2026-06-28 15:00:00+00'),
  ('gloton', 'Z3R0COOL',  45000, '2026-06-15 21:25:00+00'),

  -- invasores
  ('invasores', 'DROID_X',   54190, '2026-08-30 14:12:00+00'),
  ('invasores', 'RGB_QUEEN', 51200, '2026-08-27 09:40:00+00'),
  ('invasores', 'PIXEL_DAD', 48300, '2026-08-24 18:05:00+00'),
  ('invasores', 'RETROVIRA', 45400, '2026-08-20 11:30:00+00'),
  ('invasores', 'VECTORX',   42600, '2026-08-16 20:15:00+00'),
  ('invasores', 'JOY_STK',   39800, '2026-08-11 16:50:00+00'),
  ('invasores', 'PX_KAI',    37000, '2026-08-05 08:20:00+00'),
  ('invasores', 'NEONFOX',   34200, '2026-07-29 13:45:00+00'),
  ('invasores', 'Z3R0COOL',  31500, '2026-07-20 19:10:00+00'),
  ('invasores', 'M00NRYU',   28800, '2026-07-10 10:35:00+00'),
  ('invasores', 'VAULT_07',  26100, '2026-06-28 15:00:00+00'),
  ('invasores', 'GLITCHA',   23400, '2026-06-15 21:25:00+00'),

  -- asteroides
  ('asteroides', 'RETROVIRA', 41200, '2026-08-30 14:12:00+00'),
  ('asteroides', 'VECTORX',   38900, '2026-08-27 09:40:00+00'),
  ('asteroides', 'JOY_STK',   36700, '2026-08-24 18:05:00+00'),
  ('asteroides', 'PX_KAI',    34500, '2026-08-20 11:30:00+00'),
  ('asteroides', 'NEONFOX',   32300, '2026-08-16 20:15:00+00'),
  ('asteroides', 'Z3R0COOL',  30100, '2026-08-11 16:50:00+00'),
  ('asteroides', 'M00NRYU',   27900, '2026-08-05 08:20:00+00'),
  ('asteroides', 'VAULT_07',  25700, '2026-07-29 13:45:00+00'),
  ('asteroides', 'GLITCHA',   23500, '2026-07-20 19:10:00+00'),
  ('asteroides', 'ATARI_KID', 21300, '2026-07-10 10:35:00+00'),
  ('asteroides', 'CYBER_LU',  19100, '2026-06-28 15:00:00+00'),
  ('asteroides', 'MAGENTA88', 16900, '2026-06-15 21:25:00+00'),

  -- ranaria
  ('ranaria', 'NEONFOX',   18900, '2026-08-30 14:12:00+00'),
  ('ranaria', 'Z3R0COOL',  17800, '2026-08-27 09:40:00+00'),
  ('ranaria', 'M00NRYU',   16700, '2026-08-24 18:05:00+00'),
  ('ranaria', 'VAULT_07',  15600, '2026-08-20 11:30:00+00'),
  ('ranaria', 'GLITCHA',   14500, '2026-08-16 20:15:00+00'),
  ('ranaria', 'ATARI_KID', 13400, '2026-08-11 16:50:00+00'),
  ('ranaria', 'CYBER_LU',  12300, '2026-08-05 08:20:00+00'),
  ('ranaria', 'MAGENTA88', 11200, '2026-07-29 13:45:00+00'),
  ('ranaria', 'SCANLINE',  10100, '2026-07-20 19:10:00+00'),
  ('ranaria', 'BIT_LORD',   9000, '2026-07-10 10:35:00+00'),
  ('ranaria', 'ARKADYA',    7900, '2026-06-28 15:00:00+00'),
  ('ranaria', 'DROID_X',    6800, '2026-06-15 21:25:00+00'),

  -- duelo-pixel
  ('duelo-pixel', 'VAULT_07',  24, '2026-08-30 14:12:00+00'),
  ('duelo-pixel', 'GLITCHA',   22, '2026-08-27 09:40:00+00'),
  ('duelo-pixel', 'ATARI_KID', 21, '2026-08-24 18:05:00+00'),
  ('duelo-pixel', 'CYBER_LU',  19, '2026-08-20 11:30:00+00'),
  ('duelo-pixel', 'MAGENTA88', 18, '2026-08-16 20:15:00+00'),
  ('duelo-pixel', 'SCANLINE',  16, '2026-08-11 16:50:00+00'),
  ('duelo-pixel', 'BIT_LORD',  15, '2026-08-05 08:20:00+00'),
  ('duelo-pixel', 'ARKADYA',   13, '2026-07-29 13:45:00+00'),
  ('duelo-pixel', 'DROID_X',   12, '2026-07-20 19:10:00+00'),
  ('duelo-pixel', 'RGB_QUEEN', 10, '2026-07-10 10:35:00+00'),
  ('duelo-pixel', 'PIXEL_DAD',  9, '2026-06-28 15:00:00+00'),
  ('duelo-pixel', 'RETROVIRA',  7, '2026-06-15 21:25:00+00');
