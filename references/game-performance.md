# Rendimiento de los juegos reales

_Mantenido por el agente `game-performance-booster`. Solo él escribe aquí. Última actualización: 2026-09-23._

Doctrina: `specs/14-rendimiento-frogger.md`. Checklist de sospechosos: halo intercalado,
estado de `ctx` redundante, asignaciones en el bucle caliente, contrato de rAF/cleanup,
throttling de `onStateChange`, resolución fija del canvas. El CSS compartido
(`.crt-screen`, `.av-bg`/`gridscroll`) se audita en cada corrida pero **nunca se edita**
aquí — ver "Riesgos compartidos".

## Matriz

| Juego           | Componente         | Halo agrupado  | rAF/cleanup | `onStateChange` | Asignaciones/frame | Estado               | Fecha      |
| --------------- | ------------------ | -------------- | ----------- | --------------- | ------------------ | -------------------- | ---------- |
| `frogger`       | `FroggerGame.tsx`  | sí             | —           | —               | —                  | Optimizado (SPEC 14) | 2026-09-23 |
| `asteroides`    | `Asteroids.tsx`    | sí             | OK          | OK              | corregido          | Optimizado (SPEC 15) | 2026-09-23 |
| `caida`         | `Tetris.tsx`       | N/A (sin halo) | OK          | OK              | OK                 | Optimizado (SPEC 16) | 2026-09-23 |
| `bloque-buster` | `BloqueBuster.tsx` | sí             | OK          | OK              | corregido          | Optimizado (SPEC 17) | 2026-09-23 |
| `serpentina`    | `Snake.tsx`        | sí             | OK          | OK              | OK                 | Optimizado (SPEC 18) | 2026-09-23 |

Siguiente comando sugerido: ninguno pendiente — los 5 juegos reales están auditados.

## Detalle

### `frogger` — SPEC 14, 2026-09-23

Halo agrupado en dos pasadas (`FroggerGame.tsx:506-569`). `.crt-screen::after` perdió su
`mix-blend-mode: multiply`. `gridscroll` (`.av-bg::before`) quedó sin corregir — riesgo
abierto, ver SPEC 14 "Riesgos identificados".

### `asteroides` — SPEC 15, 2026-09-23

Corregido en `specs/15-rendimiento-asteroides.md`: balas y asteroides agrupados en una
pasada por tipo con halo/trazo fijados una vez (`draw()`), `setTransform` en vez de
`save`/`restore` por asteroide, tabla cacheada de 101 strings `rgba` para partículas,
`removeDead()` in situ en vez de `filter`/`concat`, `newAsteroids` reutilizado. `Ship` y
`PowerUp` sin tocar (una entidad por frame). `npm run build` limpio. FPS en vivo y
comparación visual en las 3 skins: pendientes del usuario.

Auditoría previa a los cambios (números de línea del archivo original):

Checklist de SPEC 14 sobre `components/games/Asteroids.tsx` (estado previo a cualquier cambio):

1. Halo intercalado — **hallazgo**. `Bullet.draw` (`:48-57`) y `Asteroid.draw` (`:114-132`)
   ponen y quitan `shadowBlur`/`shadowColor` por cada entidad; el asteroide además repite el
   reset después de un `restore()` que ya lo había revertido. `PowerUp.draw` (`:163-186`) y
   `Ship.draw` (`:261-302`) son una sola entidad por frame: no son bucle caliente.
2. Estado de `ctx` redundante — **hallazgo**. `save()`/`translate()`/`rotate()`/`restore()` +
   `strokeStyle`/`lineWidth`/`lineJoin` por asteroide; `fillStyle` por bala; `lineWidth` por
   partícula. No hay gradientes.
3. Asignaciones en el bucle caliente — **hallazgo**. `Particle.draw` (`:335`) construye un
   string `rgba(...)` + `toFixed(2)` por partícula y frame. `update()` crea arrays nuevos por
   frame con `filter` (`:532`, `:539`, `:560-562`, `:592-593`) y `newAsteroids` (`:572`), más
   closures de `forEach` en `update()`/`draw()`.
4. Bucle rAF — OK. Un único `requestAnimationFrame` (`:651`, `:655`), cancelado en el cleanup
   (`:658`), `dt` acotado a 0.05 s y reseteado tras pausa (`:643-646`), sin `setInterval`.
5. `onStateChange` — OK. `reportState()` (`:449-460`) compara contra
   `lastReportedScore/Lives/Level` antes de notificar.
6. Canvas — OK. 800×600 fijo por atributo (`:667-668`), escalado solo por CSS, contexto 2D
   obtenido una vez (`:403`).
7. CSS compartido — sin regresiones, ver "Riesgos compartidos".

Benchmark sintético (conteo de llamadas, skin `neon`, sin nave ni power-up; node v26 no trae
`OffscreenCanvas` ni paquete `canvas`, así que no hay ms/frame medidos):

| Escenario                          | Asignaciones de halo/frame | Asignaciones de estado `ctx`/frame | `save`+`restore`/frame | Strings `rgba` nuevos/frame |
| ---------------------------------- | -------------------------- | ---------------------------------- | ---------------------- | --------------------------- |
| Medio (12 ast., 6 balas, 30 part.) | 72 → 8                     | 175 → 45                           | 24 → 0                 | 30 → 0                      |
| Pesado (24 ast., 15 balas, 80 p.)  | 156 → 8                    | 404 → 95                           | 48 → 0                 | 80 → 0                      |

### `caida` — SPEC 16, 2026-09-23

Corregido en `specs/16-rendimiento-caida.md`: `drawBlock` reemplazado por `drawCells`, que
dibuja cada grupo (tablero, fantasma, pieza actual, preview) en dos pasadas (cuerpos con
`fillStyle` solo al cambiar de color, brillos con un único `fillStyle`); `globalAlpha = 0.2`
se fija una vez para el fantasma; la grilla pasa de 28 strokes a 2 (un path por dirección,
para que los cruces se sigan pintando dos veces). `npm run build` limpio. FPS en vivo y
comparación visual: pendientes del usuario. Sin skins todavía (territorio de `skin-designer`).

Auditoría previa a los cambios (números de línea del archivo original):

Checklist de SPEC 14 sobre `components/games/Tetris.tsx`:

1. Halo intercalado — **OK / N/A**. El archivo no usa `shadowBlur`/`shadowColor` en ningún
   punto. Tetris todavía no tiene skins (`lib/skins.ts` no tiene entrada `caida`; la prop
   `skin` se acepta sin usar, `:101-102`).
2. Estado de `ctx` redundante — **hallazgo**. `drawBlock` (`:262-276`) asigna
   `globalAlpha` ×2 y `fillStyle` ×2 por cada celda ocupada (tablero, fantasma, pieza actual
   y preview), aunque el alpha solo cambia para la pieza fantasma y el `fillStyle` del brillo
   (`rgba(255,255,255,0.12)`) es siempre el mismo. La grilla de fondo (`:284-295`) hace
   28 `beginPath`/`stroke` separados (9 verticales + 19 horizontales). No hay gradientes.
   Los `save`/`restore` de `drawBoardPanel`/`drawNextPanel` son 2 por frame: no es bucle
   caliente.
3. Asignaciones en el bucle caliente — **OK**. `draw()`/`update()` no crean objetos ni
   arrays por frame. `rotateCW`, `randomPiece`, `board.every`/`splice`/`unshift` y
   `CONTROL_KEYS.includes` corren solo por input o al fijar una pieza.
4. Bucle rAF — **OK**. Un único `requestAnimationFrame` (`:448`, `:451`), cancelado en el
   cleanup (`:454`), `dt` acotado a 50 ms y `lastTime = null` durante la pausa (`:440-446`),
   sin `setInterval`.
5. `onStateChange` — **OK**. `reportState()` (`:363-368`) compara `score`/`level` contra
   `lastReportedScore/Level`; `lives` es la constante `1` (SPEC 07), no necesita comparación.
6. Canvas — **OK**. 800×600 fijo por atributo (`:462-463`), escalado solo por CSS,
   contexto 2D obtenido una vez (`:146`).
7. CSS compartido — sin regresiones, ver "Riesgos compartidos".

Benchmark sintético (conteo de llamadas sobre un contexto simulado, pieza T + preview de la
tuerca; node v26 no trae `OffscreenCanvas` ni paquete `canvas`, así que no hay ms/frame de
raster medidos). El mismo script comprueba que antes y después emiten exactamente el mismo
conjunto de `fillRect` (rect + color + alpha):

| Escenario              | Asignaciones de estado `ctx`/frame | `beginPath`+`stroke`/frame | `fillRect`/frame |
| ---------------------- | ---------------------------------- | -------------------------- | ---------------- |
| Inicio (tablero vacío) | 66 → 10                            | 56 → 4                     | 32 → 32          |
| Medio (60 celdas)      | 306 → 66                           | 56 → 4                     | 152 → 152        |
| Lleno (140 celdas)     | 626 → 138                          | 56 → 4                     | 312 → 312        |

### `bloque-buster` — SPEC 17, 2026-09-23

Corregido en `specs/17-rendimiento-bloque-buster.md`: el bucle de bloques fija
`shadowBlur` una vez y reasigna `fillStyle`/`shadowColor` solo al cambiar de color (el
halo sigue teniendo el color de cada bloque, el orden de dibujo no cambia); partículas
dibujadas en un `for` dentro de `draw()` con `fillStyle` solo al cambiar de clave y
`globalAlpha = 1` una vez al final; se quita el reset de halo redundante entre paleta y
pelota; `particles` se actualiza y compacta in situ en vez de `forEach` + `filter`.
Valores de glow/paleta de `lib/skins.ts` intactos. `npm run build` limpio. FPS en vivo y
comparación visual en las 3 skins: pendientes del usuario.

Auditoría previa a los cambios (números de línea del archivo original):

1. Halo intercalado — **hallazgo**. El bucle de bloques (`:419-428`) asigna
   `fillStyle` + `shadowColor` + `shadowBlur`, dibuja y vuelve a poner
   `shadowBlur = 0`/`shadowColor = "transparent"` por cada bloque vivo (hasta 60). El
   halo usa el color de cada bloque, así que no cabe una sola pasada con un único
   `shadowColor`: la agrupación correcta es por cambio de color, respetando el orden (los
   halos de bloques vecinos se solapan). Paleta (`:432-440`) y pelota (`:442-456`) son una
   entidad cada una; el reset entre ambas (`:439-440`) es redundante.
2. Estado de `ctx` redundante — **hallazgo**. `Particle.draw` (`:155-161`) asigna
   `fillStyle` y `globalAlpha` ×2 por partícula. No hay gradientes, `save`/`restore` ni
   `font`.
3. Asignaciones en el bucle caliente — **hallazgo**. `update()` crea un array nuevo por
   frame con `particles.filter` (`:343`, `:394`) y closures con `forEach` (`:342`, `:393`,
   `:430`). `blocks.every` (`:385`) solo corre al romper un bloque, no por frame.
4. Bucle rAF — **OK**. Un único `requestAnimationFrame` (`:472`, `:476`), cancelado en el
   cleanup (`:479`), `dt` acotado a 0.05 s y `lastTime = null` en pausa (`:463-468`), sin
   `setInterval`.
5. `onStateChange` — **OK**. `reportState()` (`:280-291`) compara contra
   `lastReportedScore/Lives/Level` antes de notificar.
6. Canvas — **OK**. 800×600 fijo por atributo (`:488-489`), escalado solo por CSS,
   contexto 2D obtenido una vez (`:240`).
7. CSS compartido — sin regresiones, ver "Riesgos compartidos".

Benchmark sintético (conteo de llamadas sobre un contexto simulado; node v26 no trae
`OffscreenCanvas` ni paquete `canvas`, así que no hay ms/frame de raster medidos). El
script comprueba en las 3 skins que antes y después emiten la misma secuencia de dibujo
(operación + rect + `fillStyle` + `globalAlpha` + halo efectivo). Los números son iguales
en `clasico`, `neon` y `retro`:

| Escenario                           | Asignaciones de halo/frame | Asignaciones de estado `ctx`/frame | Operaciones de dibujo/frame | Arrays nuevos/frame |
| ----------------------------------- | -------------------------- | ---------------------------------- | --------------------------- | ------------------- |
| Inicio nivel 1 (60 bloques, 0 p.)   | 248 → 15                   | 311 → 24                           | 63 → 63                     | 1 → 0               |
| Medio nivel 1 (30 bloques, 8 p.)    | 128 → 15                   | 185 → 34                           | 41 → 41                     | 1 → 0               |
| Nivel 5 (32 bloques, 24 partículas) | 164 → 18                   | 278 → 58                           | 66 → 66                     | 1 → 0               |

### `serpentina` — SPEC 18, 2026-09-23

Corregido en `specs/18-rendimiento-serpentina.md`: el cuerpo se dibuja en una pasada con
`fillStyle = pal.body` fijado una vez y sin tocar el halo (el reset de la fruta ya lo dejó
en `0`); la cabeza sigue al final, con halo solo si `headGlow > 0`; la grilla pasa de 68
strokes a 2 (un path por dirección, los cruces se siguen pintando dos veces). Valores de
`SNAKE_SKINS` intactos. `npm run build` limpio. FPS en vivo y comparación visual en las 3
skins: pendientes del usuario.

Auditoría previa a los cambios (números de línea del archivo original):

Checklist de SPEC 14 sobre `components/games/Snake.tsx`:

1. Halo intercalado — **hallazgo**. El bucle de segmentos (`:311-320`) asigna
   `fillStyle` + `shadowBlur` + `shadowColor` por cada segmento, aunque solo la cabeza
   (el último que se dibuja, `i === 0`) lleva halo: con una serpiente de 300 segmentos son
   ~600 asignaciones de halo por frame para poner `0`/`"transparent"`, que ya es el estado
   que deja el reset de la fruta (`:308-309`). La fruta (`:281-309`) es una sola entidad.
2. Estado de `ctx` redundante — **hallazgo**. `fillStyle = pal.body` se reasigna por
   segmento. La grilla (`:265-278`) hace 68 `beginPath`/`stroke` separados (39 verticales
   - 29 horizontales). No hay gradientes, `save`/`restore` ni `font`.
3. Asignaciones en el bucle caliente — **OK**. `draw()` no crea objetos. `step()` crea
   `newHead` y, sin comer, `segments.slice(0, -1)` + closure de `some` (`:174-175`): una vez
   por tick de movimiento (60-150 ms), no por frame, y es la colisión — mecánica, no se toca.
   `spawnFruit()` solo al comer.
4. Bucle rAF — **OK**. Un único `requestAnimationFrame` (`:337`, `:340`), cancelado en el
   cleanup (`:343`), `dt` acotado a 50 ms y `lastTime = null` en pausa (`:329-333`), sin
   `setInterval`.
5. `onStateChange` — **OK**. `reportState()` (`:193-198`) compara `score`/`level` contra
   `lastReportedScore/Level`; `lives` es la constante `1` (SPEC 09).
6. Canvas — **OK**. 800×600 fijo por atributo (`:351-352`), escalado solo por CSS,
   contexto 2D obtenido una vez (`:110`).
7. CSS compartido — sin regresiones, ver "Riesgos compartidos".

Benchmark sintético (conteo de llamadas sobre un contexto simulado; node no trae
`OffscreenCanvas` ni paquete `canvas`, así que no hay ms/frame de raster medidos). El
script comprueba en las 3 skins que antes y después emiten la misma secuencia de
`fillRect`/`drawImage` (rect + `fillStyle` + halo efectivo), los mismos segmentos de
grilla con el mismo trazo, y el mismo estado final de sombra:

| Escenario        | Asignaciones de halo/frame | Asignaciones de estado `ctx`/frame | `beginPath`+`stroke`/frame | `fillRect`+`drawImage`/frame |
| ---------------- | -------------------------- | ---------------------------------- | -------------------------- | ---------------------------- |
| Inicio (3 seg.)  | 12 → 4 / 8 / 8             | 18 → 9 / 13 / 14                   | 136 → 4                    | 5 → 5                        |
| Medio (50 seg.)  | 106 → 4 / 8 / 8            | 159 → 9 / 13 / 14                  | 136 → 4                    | 52 → 52                      |
| Largo (300 seg.) | 606 → 4 / 8 / 8            | 909 → 9 / 13 / 14                  | 136 → 4                    | 302 → 302                    |

(Después: `clasico` / `neon` / `retro`. En `clasico` `headGlow = 0` y la cabeza no toca el halo.)

## Riesgos compartidos (solo reporte, nunca corregidos por este agente)

- `gridscroll` (`app/globals.css:106` y su variante `.crt` ~línea 1285) anima
  `background-position`, no compositable por GPU. Documentado en SPEC 14 como pendiente;
  requeriría separar patrón y máscara en dos elementos de `app/layout.tsx`, fuera del
  alcance de este agente (solo escribe `components/games/`, specs y este registro).
  Verificado 2026-09-23: la variante de la línea 1285 es `.game-arena .grid-floor`, que
  `GamePlayer.tsx:217` solo monta para juegos simulados — nunca está debajo del canvas de un
  juego real. La de `.av-bg::before` sí sigue activa en todo el sitio.
- `.av-bg::after` (`app/globals.css:126`) usa `mix-blend-mode: overlay` sobre el fondo del
  sitio (no sobre el canvas de ningún juego) — mismo tipo de problema que el ya corregido
  en `.crt-screen::after`, candidato a un spec de CSS compartido si algún día se prioriza.
- `.crt-screen::after` (`app/globals.css:1177-1190`) — verificado 2026-09-23: sigue sin
  `mix-blend-mode` (corrección de SPEC 14 intacta).

## Fuera de alcance

Mecánica, colisiones, puntuación, inputs y paletas de color/skins de cualquier juego:
son territorio de sus propios specs y de `skin-designer`. El CSS compartido
(`.crt-screen`, `.av-bg`) se audita aquí pero se corrige en un spec aparte que sí
incluya `app/globals.css`/`app/layout.tsx` en su alcance.
