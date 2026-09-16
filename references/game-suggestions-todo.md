# TODO — Sugerencias de juegos

_Mantenido por el agente `game-planner`. Solo él escribe aquí. Última actualización: 2026-09-15._

## Cola priorizada

| #     | Estado    | Juego propuesto | Slot destino         | Cat     | Esfuerzo | Sugerido   |
| ----- | --------- | --------------- | -------------------- | ------- | -------- | ---------- |
| S-001 | Pendiente | INVASORES       | reslot `invasores`   | SHOOTER | M        | 2026-09-15 |
| S-002 | Pendiente | GLOTÓN          | reslot `gloton`      | ARCADE  | M/L      | 2026-09-15 |
| S-003 | Pendiente | RANARIA         | reslot `ranaria`     | ARCADE  | S        | 2026-09-15 |
| S-004 | Pendiente | DUELO PIXEL     | reslot `duelo-pixel` | VERSUS  | M        | 2026-09-15 |

## Detalle

### S-001 · INVASORES — Pendiente

- **Slot:** reslot de `invasores` (hereda id/cover/color/scores) · **Cat:** SHOOTER
- **Por qué encaja:** clon de Space Invaders — score acumulativo por enemigo destruido y fin de partida claro al perder todas las vidas; encaja de forma directa con el contrato de puntuación de la plataforma. Refuerza SHOOTER (hoy solo 1 juego real: `asteroides`) sin duplicar su mecánica: Asteroids es física libre de nave rotando/flotando, Invasores es una oleada en grid que desciende y se acelera.
- **Mecánica:** nave horizontal que dispara hacia arriba; oleada de enemigos en grid que desciende y avanza lateralmente, acelerándose a medida que quedan menos; los enemigos disparan de vuelta; limpiar la oleada sube de nivel.
- **Mapeo del contrato:** `score` → puntos por enemigo destruido (las filas superiores valen más, como el original) · `lives` → vidas del jugador, empieza en 3 · `level` → número de oleada
- **Fuente:** desde cero — no hay carpeta en `references/started-games/` para este juego (mismo caso que Snake en SPEC 09)
- **Riesgos:** la IA de disparo enemigo y el ritmo de aceleración por oleada necesitan calibrarse para no ser injustos; mismo riesgo de throttling de `requestAnimationFrame` en pruebas automatizadas que documentó SPEC 09
- **Siguiente paso:** `/add-game invasores`

### S-002 · GLOTÓN — Pendiente

- **Slot:** reslot de `gloton` (hereda id/cover/color/scores) · **Cat:** ARCADE
- **Por qué encaja:** clon de Pac-Man — buen fit de contrato (score por pellets/fantasmas, vidas naturales, nivel = ronda más rápida), pero ARCADE ya tiene 2 juegos reales (`bloque-buster`, `serpentina`), así que pesa menos en el criterio de hueco de categoría que Invasores.
- **Mecánica:** laberinto fijo; el jugador come pellets mientras evade 2–4 fantasmas con IA de persecución simple; power-pellets invierten el rol temporalmente.
- **Mapeo del contrato:** `score` → pellets y fantasmas comidos · `lives` → vidas restantes · `level` → ronda del laberinto (fantasmas más rápidos/agresivos)
- **Fuente:** desde cero
- **Riesgos:** el pathfinding de los fantasmas en un laberinto es más complejo que cualquier juego real portado hasta ahora — mayor esfuerzo que Invasores o Ranaria
- **Siguiente paso:** `/add-game gloton`

### S-003 · RANARIA — Pendiente

- **Slot:** reslot de `ranaria` (hereda id/cover/color/scores) · **Cat:** ARCADE
- **Por qué encaja:** clon de Frogger — mecánica más simple de las cuatro (mejor candidato en esfuerzo), buen fit de contrato, pero comparte el mismo solapamiento de categoría ARCADE que Glotón.
- **Mecánica:** la rana avanza por carriles con obstáculos que se mueven horizontalmente (tráfico/troncos); llegar a la meta repetidas veces sube de nivel.
- **Mapeo del contrato:** `score` → puntos por carril avanzado + bonus por meta alcanzada · `lives` → vidas por colisión o caída al agua · `level` → velocidad/densidad de obstáculos
- **Fuente:** desde cero
- **Riesgos:** ninguno significativo más allá de balancear la dificultad por nivel
- **Siguiente paso:** `/add-game ranaria`

### S-004 · DUELO PIXEL — Pendiente (prioridad baja, requiere decisión de mapeo)

- **Slot:** reslot de `duelo-pixel` (hereda id/cover/color/scores) · **Cat:** VERSUS — única categoría sin ningún juego real hoy, lo cual sí es un hueco genuino
- **Por qué se posterga pese al hueco de categoría:** clon de Pong. El contrato `{score, lives, level}` de `GamePlayer.tsx` no encaja bien con un juego de rally 2 jugadores: no hay "vidas" ni "nivel" naturales, y el modelo de high-score del resto del catálogo (una cifra que sube sin techo, un solo jugador contra sí mismo/la máquina) no es el género "primero a N puntos" de Pong. Antes de spec-earlo hace falta que el usuario confirme qué es exactamente "score" en un duelo.
- **Mecánica:** paletas verticales, la pelota rebota y acelera; quien falla concede punto al rival.
- **Mapeo del contrato (propuesto, sin validar):** `score` → puntos ganados en la sesión contra una IA de paleta rival · `lives` → fijo en 1, no aplica realmente · `level` → velocidad de la pelota tras cada N puntos
- **Fuente:** desde cero
- **Riesgos:** cambia el género del catálogo (rival IA vs. el resto, que son todos single-player puros) — vale la pena confirmarlo con el usuario antes de escribir el spec
- **Siguiente paso:** confirmar con el usuario el mapeo de `score` antes de `/add-game duelo-pixel`

## Descartadas

| Juego | Fecha | Razón |
| ----- | ----- | ----- |

## Cerradas (ya implementadas)

| Juego | Spec | Fecha |
| ----- | ---- | ----- |
