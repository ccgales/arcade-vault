# Juegos implementados

Catálogo consultado directamente en Supabase (tablas `games` y vista `game_stats`). De los 8 juegos del catálogo, estos 4 tienen **jugabilidad real** (componente canvas en `components/games/`, registrado en `REAL_GAMES` de `components/GamePlayer.tsx` y conectado al leaderboard real):

| id              | Título        | Componente         | Categoría | Color   | Mejor puntaje | Partidas jugadas |
| --------------- | ------------- | ------------------ | --------- | ------- | ------------: | ---------------: |
| `asteroides`    | ASTEROIDES    | `Asteroids.tsx`    | SHOOTER   | yellow  |        41,200 |               15 |
| `caida`         | CAÍDA         | `Tetris.tsx`       | PUZZLE    | magenta |       184,220 |               14 |
| `bloque-buster` | BLOQUE BUSTER | `BloqueBuster.tsx` | ARCADE    | cyan    |        28,450 |               12 |
| `serpentina`    | SERPENTINA    | `Snake.tsx`        | ARCADE    | green   |         7,820 |               13 |

## Detalle

### ASTEROIDES (`asteroides`)

- **Short:** Pulveriza asteroides en gravedad cero.
- **Long:** Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.

### CAÍDA (`caida`)

- **Short:** Encaja las piezas antes de que el techo te aplaste.
- **Long:** Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.

### BLOQUE BUSTER (`bloque-buster`)

- **Short:** Rebota la pelota y destruye muros de neón.
- **Long:** Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?

### SERPENTINA (`serpentina`)

- **Short:** Crece sin morder tu propia cola.
- **Long:** Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.

## Pendientes de implementar (solo catálogo simulado)

Estos 4 juegos existen como filas del catálogo (con puntajes de ejemplo en `game_stats`) pero **no tienen jugabilidad real** todavía; el HUD de su pantalla de juego es simulado (random/intervalos). Se implementan siguiendo la receta de `.claude/skills/add-game/SKILL.md`.

| id            | Título      | Categoría | Mejor puntaje (seed) | Partidas (seed) |
| ------------- | ----------- | --------- | -------------------: | --------------: |
| `gloton`      | GLOTÓN      | ARCADE    |               96,400 |              12 |
| `invasores`   | INVASORES   | SHOOTER   |               54,190 |              12 |
| `ranaria`     | RANARIA     | ARCADE    |               18,900 |              12 |
| `duelo-pixel` | DUELO PIXEL | VERSUS    |                   24 |              12 |

---

_Fuente: tablas `games` y `game_stats` en Supabase (proyecto `gjxfrwhnbfstrdepfyxd`), consultadas el 2026-09-14. Ver también `CLAUDE.md` → sección "Games"._
