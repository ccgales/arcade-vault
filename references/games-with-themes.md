# Juegos con skins

_Mantenido por el agente `skin-designer`. Solo él escribe aquí. Última actualización: 2026-09-17._

Infraestructura compartida (creada en la corrida de `asteroides`, ya no hay que repetirla):
`lib/skins.ts` (`SkinId`/`DEFAULT_SKIN`/`SKIN_LABELS`/`SKIN_ACCENTS`/`hasSkins`/`SKIN_STORAGE_KEY`),
prop `skin` en `RealGameProps` de `components/GamePlayer.tsx`, `components/SkinPicker.tsx`
y su bloque CSS al final de `app/globals.css`. Cada corrida siguiente solo **añade** su
`Record<SkinId, …>` a `lib/skins.ts`, su id a `GAMES_WITH_SKINS` y el wiring de su componente.

## Matriz

| Juego           | Componente         | `clasico` | `neon` | `retro` | Estado       | Fecha      |
| --------------- | ------------------ | --------- | ------ | ------- | ------------ | ---------- |
| `asteroides`    | `Asteroids.tsx`    | sí        | sí     | sí      | Implementado | 2026-09-17 |
| `bloque-buster` | `BloqueBuster.tsx` | sí        | sí     | sí      | Implementado | 2026-09-17 |
| `serpentina`    | `Snake.tsx`        | sí        | sí     | sí      | Implementado | 2026-09-17 |
| `caida`         | `Tetris.tsx`       | —         | —      | —       | Pendiente    | —          |

Siguiente comando sugerido: `@skin-designer caida`.

## Detalle

### `asteroides` — SPEC 10, 2026-09-17

Paleta en `lib/skins.ts` → `ASTEROIDS_SKINS` (interfaz `AsteroidsSkin`).

| Rol       | `clasico`                      | `neon`                     | `retro`                    |
| --------- | ------------------------------ | -------------------------- | -------------------------- |
| `bg`      | `#000000`                      | `#05060a`                  | `#120a00`                  |
| nave      | `#ffffff` · w 1.5 · glow 0     | `#00f5ff` · w 2 · glow 12  | `#ffe7b3` · w 2 · glow 2   |
| propulsor | `rgba(255,130,0,0.85)` · w 1.5 | `rgba(255,61,0,0.9)` · w 2 | `rgba(184,92,0,1)` · w 2   |
| bala      | `#ffffff` · glow 0             | `#f5ff00` · glow 10        | `#ffcf6b` · glow 1         |
| asteroide | `#ffffff` · w 1.5 · glow 0     | `#ff4fd8` · w 1.5 · glow 8 | `#d2841b` · w 1.5 · glow 0 |
| partícula | `255,255,255` · w 1            | `255,154,226` · w 1        | `230,150,36` · w 1         |
| power-up  | `#00ffff` · w 2 · glow 0       | `#00c46a` · w 2 · glow 10  | `#ffb84d` · w 2 · glow 1   |
| HUD "3x"  | `#00ffff` · `15px monospace`   | `#00c46a` · `15px mono`    | `#ffb84d` · `bold 15px`    |

Decisiones reutilizables por las próximas corridas (para que no salgan tres "retro" distintos):

- **Ámbar de `retro`:** fondo `#120a00`; escalera de luminancia ámbar
  `#ffe7b3` (elemento del jugador, el más luminoso) → `#ffb84d` (bonus/HUD) →
  `#ffcf6b` (proyectil) → `#d2841b` (enemigo/obstáculo) → `#b85c00` (efecto).
  Glow 0–2, nunca multicolor.
- **`neon`:** fondo `#05060a`; `--cyan #00f5ff` para lo que controla el jugador,
  `--yellow #f5ff00` para el proyectil, `#ff4fd8` (el `hotpink` que ya usa
  `BloqueBuster`) para el enemigo, `#00c46a` para bonus/HUD. `shadowBlur` 8–12
  solo en los elementos principales; las partículas van con glow 0.
  El `--magenta #ff006e` de la casa queda descartado para elementos críticos:
  mide 3.75:1 sobre negro.
- **`clasico`:** siempre extracción literal del juego tal como estaba. Es la
  prueba de no regresión, no una oportunidad de rediseño.
- Los tamaños de fuente no cambian entre skins (solo el peso, en `retro`):
  la caja del texto en canvas es invariante por la regla de coste cero de jugabilidad.

Casos especiales resueltos en esta corrida:

- Las clases de Asteroides viven a nivel de módulo, fuera de React: la paleta
  viaja como segundo argumento de `draw(ctx, skin)`, sin estado global mutable.
- Cada `draw` fija `shadowBlur`/`shadowColor` al entrar y los devuelve a
  `0`/`"transparent"` al salir, para que ningún glow se filtre a la entidad siguiente.
- La llama del propulsor apaga el glow explícitamente: si no, heredaba el halo de la nave.
- La paleta se resuelve **dentro de `draw()` en cada frame** desde un `skinRef`
  espejado (mismo idiom que `pausedRef`), nunca con `key={skin}`.

### `bloque-buster` — SPEC 10, 2026-09-17

Paleta en `lib/skins.ts` → `BLOQUE_BUSTER_SKINS` (interfaz `BloqueBusterSkin`, claves `BlockColorKey`).

| Rol         | `clasico`               | `neon`              | `retro`            |
| ----------- | ----------------------- | ------------------- | ------------------ |
| `bg`        | `#000000`               | `#05060a`           | `#120a00`          |
| paleta      | `#ffffff` · glow 8 cian | `#00f5ff` · glow 12 | `#ffe7b3` · glow 2 |
| pelota      | `#ffffff` · glow 8      | `#f5ff00` · glow 10 | `#ffcf6b` · glow 2 |
| `red`       | `#ff3b3b`               | `#ff5c5c`           | `#e97b1c`          |
| `yellow`    | `#f5ff00`               | `#ffa41b`           | `#caa210`          |
| `cyan`      | `#00f5ff`               | `#00b0c4`           | `#d29722`          |
| `magenta`   | `#ff006e`               | `#ff5c9e`           | `#ee7027`          |
| `hotpink`   | `#ff4fd8`               | `#ff8ae0`           | `#e48a28`          |
| `green`     | `#00ff88`               | `#00c46a`           | `#cb9e24`          |
| `gray`      | `#8a8a8a`               | `#9aa7bd`           | `#b69667`          |
| glow bloque | 6                       | 10                  | 0                  |

Argumento de diseño:

- **`clasico`** es extracción literal del `BLOCK_COLORS` y del `draw()` que ya existían
  (`components/games/BloqueBuster.tsx:24-32`, `:393`, `:398-403`, `:408-416` antes de esta corrida).
- **`neon`** reparte los roles como Asteroides: paleta = `--cyan #00f5ff` (jugador, glow 12),
  pelota = `--yellow #f5ff00` (proyectil, glow 10). Los 7 bloques bajan a la banda media de
  luminancia para que el objetivo nunca se lea como algo del jugador, y las dos claves que
  chocaban con el jugador se desplazan de tono: `yellow` → ámbar `#ffa41b` y `cyan` → teal
  `#00b0c4`, reservando el amarillo y el cian puros para la pelota y la paleta.
  `green` reutiliza el `#00c46a` exacto que ya usa Asteroides `neon`.
- **`retro`** usa los hex de "jugador" (`#ffe7b3`) y "proyectil" (`#ffcf6b`) del ladder ámbar
  fijado por Asteroides. Los bloques ocupan una escalera comprimida 4.61–5.65:1 con deriva de
  tono 22°–47°: la **luminancia codifica el rol** (paleta > pelota > objetivos) y la **deriva
  de tono codifica el patrón del nivel**, conservando el orden relativo de luminancia que los
  siete colores tienen en `clasico`. El hueco de 1px del `fillRect(x+1, y+1, w-2, h-2)` ya
  hace de rejilla de fósforo: no se añadió geometría.

Casos especiales resueltos en esta corrida:

- `Particle` guardaba el hex ya resuelto del bloque; ahora guarda `colorKey: BlockColorKey` y
  resuelve el color en `draw(ctx, skin)`. Las partículas en vuelo siguen a la skin si el
  jugador la cambia a mitad de explosión.
- `LEVELS` y sus 7 claves no se tocaron: `BlockColorKey` las tipa, así que ninguna skin puede
  añadir, quitar ni renombrar entradas sin romper la compilación.
- `paddleGlowColor` es un campo propio porque `clasico` dibuja la paleta **blanca** con halo
  **cian**: relleno y halo no siempre son el mismo color.
- `GamePlayer.tsx` no necesitó cambios: el prop `skin` y el `SkinPicker` tras `hasSkins()` ya
  existían desde la corrida de `asteroides`; bastó sumar el id a `GAMES_WITH_SKINS`.

### `serpentina` — SPEC 10, 2026-09-17

Paleta en `lib/skins.ts` → `SNAKE_SKINS` (interfaz `SnakeSkin`).

| Rol         | `clasico`                      | `neon`              | `retro`            |
| ----------- | ------------------------------ | ------------------- | ------------------ |
| `bg`        | `#020403`                      | `#05060a`           | `#120a00`          |
| rejilla     | `rgba(255,255,255,0.05)` · w 1 | `#327d85` · w 1     | `#b85c00` · w 1    |
| cabeza      | `#7cffb2` · glow 0             | `#00f5ff` · glow 12 | `#ffe7b3` · glow 2 |
| cuerpo      | `#00ff88` · glow 0             | `#00b0c4` · glow 0  | `#ffcf6b` · glow 0 |
| fruta       | `#ff006e` · glow 0             | `#ff4fd8` · glow 10 | `#e69624` · glow 1 |
| `fruitMode` | `sprite`                       | `sprite`            | `solid`            |

Argumento de diseño:

- **`clasico`** es extracción literal de `components/games/Snake.tsx` antes de esta corrida:
  fondo `:253`, rejilla `:256-257`, sprite de fruta `:271-283`, celda sólida de fallback `:285-291`
  y cabeza/cuerpo `:296`. No se rediseñó ni un hex.
- **`neon`** reparte los roles como los dos juegos anteriores: la cabeza es el `--cyan #00f5ff`
  (lo que controla el jugador, y lo más luminoso del cuadro, 9.97:1), el cuerpo baja al teal
  medio `#00b0c4` que ya usa `BloqueBuster` `neon` (5.36:1 → cabeza/cuerpo 1.86:1, la cabeza se
  lee sin mirar dos veces), y la fruta conserva su sprite pero se integra en la escena con un
  halo `#ff4fd8` — el mismo rosa que Asteroides `neon` usa para lo que no es del jugador.
  A diferencia de Asteroides, **aquí la rejilla sí se recolorea** (`#327d85`, 3.14:1): ya existía
  en el juego, así que no es geometría nueva.
- **`retro`** es el ladder ámbar de Asteroides sin inventar ni un tono: cabeza `#ffe7b3` (10.85:1)
  > cuerpo `#ffcf6b` (9.08:1) > fruta `#e69624` (5.69:1) > rejilla `#b85c00` (3.16:1). Es el único
  > skin donde la rejilla se ve de verdad, que es exactamente el vocabulario de un fósforo.

Casos especiales resueltos en esta corrida:

- **El spritesheet `/snake/fruits.png` no es recoloreable**, así que `SnakeSkin` lleva
  `fruitMode: "sprite" | "solid"`. `retro` usa `solid` porque una fruta fotográfica multicolor
  no cabe en un monocromo ámbar. No se escribió dibujo nuevo: se reutilizó la rama `else`
  que el juego ya tenía como fallback de "la imagen no cargó", cambiando su condición a
  "no cargó **o** el skin pide sólido" y su `#ff006e` fijo por `pal.fruit`.
- **El halo solo lo lleva la cabeza.** `shadowBlur` en canvas es caro y la serpiente puede pasar
  de 100 segmentos: un glow por segmento sería un riesgo de FPS, y los FPS sí tocan la
  jugabilidad. Además refuerza la regla de que el elemento del jugador con foco es el más notorio.
- `GamePlayer.tsx` no necesitó cambios: `skin` ya llegaba a `Snake` (lo aceptaba y lo ignoraba);
  bastó sumar `"serpentina"` a `GAMES_WITH_SKINS`.
- El `lineWidth` de la rejilla queda en la paleta (`gridWidth`), pero vale `1` en las tres skins:
  cambiarlo movería el peso visual de la celda y la celda es la unidad de juego.

## Mediciones de contraste

Método: ratio WCAG 2.1 calculada con `node -e`, de cada color contra el `bg`
**de su propia skin**, con las correcciones del entorno CRT:

- **Scanlines** (`.crt-screen::after`, negro 18% en filas alternas, `multiply`): factor sRGB `0.82`, aplicado a todas las medidas.
- **Viñeta** (`.crt-screen::before`, hasta `rgba(0,0,0,0.65)` en el borde): factor `0.82 × 0.35`.
  Como atenúa figura y fondo a la vez, en el borde superior/inferior el techo
  físico es el blanco puro (2.34:1), así que ahí se mide un **índice de retención**
  = ratio del color / ratio del blanco puro en el mismo punto.
- Umbrales: centro ≥ 4.5:1 crítico / ≥ 3:1 decorativo; borde ≥ 0.60 / ≥ 0.50 de retención.

| Juego        | Skin      | Elemento  | Color     | Fondo     | Centro  | Borde  | Retención | Umbral     | OK  |
| ------------ | --------- | --------- | --------- | --------- | ------- | ------ | --------- | ---------- | --- |
| `asteroides` | `clasico` | nave      | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí  |
| `asteroides` | `clasico` | bala      | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí  |
| `asteroides` | `clasico` | asteroide | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí  |
| `asteroides` | `clasico` | partícula | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 3.0 / 0.50 | sí  |
| `asteroides` | `clasico` | propulsor | `#ff8200` | `#000000` | 5.80:1  | 1.55:1 | 0.66      | 3.0 / 0.50 | sí  |
| `asteroides` | `clasico` | power-up  | `#00ffff` | `#000000` | 11.05:1 | 2.05:1 | 0.88      | 4.5 / 0.60 | sí  |
| `asteroides` | `clasico` | HUD "3x"  | `#00ffff` | `#000000` | 11.05:1 | 2.05:1 | 0.88      | 4.5 / 0.60 | sí  |
| `asteroides` | `neon`    | nave      | `#00f5ff` | `#05060a` | 9.97:1  | 1.96:1 | 0.85      | 4.5 / 0.60 | sí  |
| `asteroides` | `neon`    | bala      | `#f5ff00` | `#05060a` | 12.24:1 | 2.20:1 | 0.95      | 4.5 / 0.60 | sí  |
| `asteroides` | `neon`    | asteroide | `#ff4fd8` | `#05060a` | 4.95:1  | 1.46:1 | 0.63      | 4.5 / 0.60 | sí  |
| `asteroides` | `neon`    | partícula | `#ff9ae2` | `#05060a` | 7.20:1  | 1.71:1 | 0.74      | 3.0 / 0.50 | sí  |
| `asteroides` | `neon`    | propulsor | `#ff3d00` | `#05060a` | 4.05:1  | 1.35:1 | 0.58      | 3.0 / 0.50 | sí  |
| `asteroides` | `neon`    | power-up  | `#00c46a` | `#05060a` | 6.03:1  | 1.57:1 | 0.68      | 4.5 / 0.60 | sí  |
| `asteroides` | `neon`    | HUD "3x"  | `#00c46a` | `#05060a` | 6.03:1  | 1.57:1 | 0.68      | 4.5 / 0.60 | sí  |
| `asteroides` | `retro`   | nave      | `#ffe7b3` | `#120a00` | 10.85:1 | 2.08:1 | 0.91      | 4.5 / 0.60 | sí  |
| `asteroides` | `retro`   | bala      | `#ffcf6b` | `#120a00` | 9.08:1  | 1.90:1 | 0.83      | 4.5 / 0.60 | sí  |
| `asteroides` | `retro`   | asteroide | `#d2841b` | `#120a00` | 4.67:1  | 1.45:1 | 0.63      | 4.5 / 0.60 | sí  |
| `asteroides` | `retro`   | partícula | `#e69624` | `#120a00` | 5.69:1  | 1.55:1 | 0.68      | 3.0 / 0.50 | sí  |
| `asteroides` | `retro`   | propulsor | `#b85c00` | `#120a00` | 3.16:1  | 1.28:1 | 0.56      | 3.0 / 0.50 | sí  |
| `asteroides` | `retro`   | power-up  | `#ffb84d` | `#120a00` | 7.77:1  | 1.77:1 | 0.77      | 4.5 / 0.60 | sí  |
| `asteroides` | `retro`   | HUD "3x"  | `#ffb84d` | `#120a00` | 7.77:1  | 1.77:1 | 0.77      | 4.5 / 0.60 | sí  |

En `bloque-buster` **todo lo dibujado es crítico para jugar** (hay que ver cada ladrillo para
apuntar), así que los 7 bloques, la paleta y la pelota se miden contra el umbral de 4.5 / 0.60.
Las partículas heredan el color de su bloque, así que no se miden aparte.

| Juego           | Skin      | Elemento  | Color     | Fondo     | Centro  | Borde  | Retención | Umbral     | OK                 |
| --------------- | --------- | --------- | --------- | --------- | ------- | ------ | --------- | ---------- | ------------------ |
| `bloque-buster` | `clasico` | paleta    | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `clasico` | pelota    | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `clasico` | `yellow`  | `#f5ff00` | `#000000` | 12.61:1 | 2.22:1 | 0.95      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `clasico` | `green`   | `#00ff88` | `#000000` | 10.36:1 | 1.99:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `clasico` | `cyan`    | `#00f5ff` | `#000000` | 10.27:1 | 1.98:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `clasico` | `hotpink` | `#ff4fd8` | `#000000` | 5.10:1  | 1.47:1 | 0.63      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `clasico` | `gray`    | `#8a8a8a` | `#000000` | 4.31:1  | 1.42:1 | 0.61      | 4.5 / 0.60 | **no** (excepción) |
| `bloque-buster` | `clasico` | `red`     | `#ff3b3b` | `#000000` | 4.19:1  | 1.37:1 | 0.59      | 4.5 / 0.60 | **no** (excepción) |
| `bloque-buster` | `clasico` | `magenta` | `#ff006e` | `#000000` | 3.86:1  | 1.31:1 | 0.56      | 4.5 / 0.60 | **no** (excepción) |
| `bloque-buster` | `neon`    | pelota    | `#f5ff00` | `#05060a` | 12.24:1 | 2.20:1 | 0.95      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | paleta    | `#00f5ff` | `#05060a` | 9.97:1  | 1.96:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | `yellow`  | `#ffa41b` | `#05060a` | 6.95:1  | 1.68:1 | 0.72      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | `hotpink` | `#ff8ae0` | `#05060a` | 6.57:1  | 1.64:1 | 0.71      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | `green`   | `#00c46a` | `#05060a` | 6.03:1  | 1.57:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | `gray`    | `#9aa7bd` | `#05060a` | 5.77:1  | 1.57:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | `cyan`    | `#00b0c4` | `#05060a` | 5.36:1  | 1.51:1 | 0.65      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | `magenta` | `#ff5c9e` | `#05060a` | 4.90:1  | 1.46:1 | 0.63      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `neon`    | `red`     | `#ff5c5c` | `#05060a` | 4.69:1  | 1.44:1 | 0.62      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | paleta    | `#ffe7b3` | `#120a00` | 10.85:1 | 2.08:1 | 0.91      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | pelota    | `#ffcf6b` | `#120a00` | 9.08:1  | 1.90:1 | 0.83      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | `yellow`  | `#caa210` | `#120a00` | 5.65:1  | 1.55:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | `green`   | `#cb9e24` | `#120a00` | 5.51:1  | 1.54:1 | 0.67      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | `cyan`    | `#d29722` | `#120a00` | 5.35:1  | 1.52:1 | 0.66      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | `hotpink` | `#e48a28` | `#120a00` | 5.21:1  | 1.50:1 | 0.65      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | `gray`    | `#b69667` | `#120a00` | 4.97:1  | 1.48:1 | 0.65      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | `red`     | `#e97b1c` | `#120a00` | 4.82:1  | 1.46:1 | 0.63      | 4.5 / 0.60 | sí                 |
| `bloque-buster` | `retro`   | `magenta` | `#ee7027` | `#120a00` | 4.61:1  | 1.43:1 | 0.62      | 4.5 / 0.60 | sí                 |

**Excepción documentada de `clasico` en `bloque-buster`:** tres bloques quedan por debajo de
4.5:1 (`gray` 4.31, `red` 4.19, `magenta` 3.86). No se corrigen: el criterio de mayor peso es
que `clasico` sea extracción literal y prueba de no regresión, y subirlos rompería el criterio
de aceptación de SPEC 10 ("con `clasico` el juego es visualmente idéntico a antes"). `neon` y
`retro` son la ruta accesible — en ambas, ningún bloque baja de 4.5:1.

En `serpentina` son críticos la cabeza, el cuerpo y la fruta (hay que verlos para no morir y
para saber a dónde ir); la rejilla es decorativa (3.0 / 0.50). La fruta de `clasico` y `neon` es
el sprite, así que su hex se mide como lo que es en esos dos skins: el color del halo y del
fallback de "la imagen no cargó".

| Juego        | Skin      | Elemento                        | Color     | Fondo     | Centro  | Borde  | Retención | Umbral     | OK                 |
| ------------ | --------- | ------------------------------- | --------- | --------- | ------- | ------ | --------- | ---------- | ------------------ |
| `serpentina` | `clasico` | cabeza                          | `#7cffb2` | `#020403` | 10.92:1 | 2.07:1 | 0.89      | 4.5 / 0.60 | sí                 |
| `serpentina` | `clasico` | cuerpo                          | `#00ff88` | `#020403` | 10.18:1 | 1.98:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `serpentina` | `clasico` | fruta (fallback)                | `#ff006e` | `#020403` | 3.80:1  | 1.30:1 | 0.56      | 4.5 / 0.60 | **no** (excepción) |
| `serpentina` | `clasico` | rejilla (5% blanco → `#0f1110`) | `#0f1110` | `#020403` | 1.07:1  | 1.02:1 | 0.44      | 3.0 / 0.50 | **no** (excepción) |
| `serpentina` | `neon`    | cabeza                          | `#00f5ff` | `#05060a` | 9.97:1  | 1.96:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `serpentina` | `neon`    | cuerpo                          | `#00b0c4` | `#05060a` | 5.36:1  | 1.51:1 | 0.65      | 4.5 / 0.60 | sí                 |
| `serpentina` | `neon`    | fruta (halo)                    | `#ff4fd8` | `#05060a` | 4.95:1  | 1.46:1 | 0.63      | 4.5 / 0.60 | sí                 |
| `serpentina` | `neon`    | rejilla                         | `#327d85` | `#05060a` | 3.14:1  | 1.28:1 | 0.55      | 3.0 / 0.50 | sí                 |
| `serpentina` | `retro`   | cabeza                          | `#ffe7b3` | `#120a00` | 10.85:1 | 2.08:1 | 0.91      | 4.5 / 0.60 | sí                 |
| `serpentina` | `retro`   | cuerpo                          | `#ffcf6b` | `#120a00` | 9.08:1  | 1.90:1 | 0.83      | 4.5 / 0.60 | sí                 |
| `serpentina` | `retro`   | fruta (sólida)                  | `#e69624` | `#120a00` | 5.69:1  | 1.55:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `serpentina` | `retro`   | rejilla                         | `#b85c00` | `#120a00` | 3.16:1  | 1.28:1 | 0.56      | 3.0 / 0.50 | sí                 |

**Excepciones documentadas de `clasico` en `serpentina`:** la rejilla (1.07:1, muy por debajo del
3:1 decorativo) y el relleno de fruta de fallback (3.80:1) son los valores que el juego ya tenía.
Mismo criterio que en `bloque-buster`: `clasico` es extracción literal y prueba de no regresión;
subirlos rompería el criterio de aceptación de SPEC 10. Además la rejilla de `clasico` está
pensada como guía apenas perceptible, y su fruta real es el sprite, no ese hex — el `#ff006e`
solo se ve si `/snake/fruits.png` no carga. `neon` y `retro` son la ruta accesible: ahí la
rejilla pasa el 3:1 y la fruta el 4.5:1.

### Correcciones que obligó la medición — `asteroides`

| Skin    | Rol       | Color descartado | Ratio   | Color final | Ratio final | Motivo                                              |
| ------- | --------- | ---------------- | ------- | ----------- | ----------- | --------------------------------------------------- |
| `neon`  | asteroide | `#ff006e`        | 3.75:1  | `#ff4fd8`   | 4.95:1      | El `--magenta` de la casa no llega a 4.5:1 en negro |
| `neon`  | power-up  | `#00ff88`        | 10.06:1 | `#00c46a`   | 6.03:1      | 1.01:1 y 30° contra la nave cian: se confundían     |
| `neon`  | propulsor | `#ffcf3a`        | 9.21:1  | `#ff3d00`   | 4.05:1      | 15° de tono contra la bala amarilla                 |
| `retro` | asteroide | `#c8791a`        | 4.15:1  | `#d2841b`   | 4.67:1      | No llegaba a 4.5:1 contra el fondo ámbar            |
| `retro` | power-up  | `#ffa726`        | 6.92:1  | `#ffb84d`   | 7.77:1      | 1.59:1 contra el asteroide: se confundían           |

### Separación entre roles (ratio mutua, sin el factor de scanline) — `asteroides`

| Skin      | Par                 | Ratio  | Veredicto                                                         |
| --------- | ------------------- | ------ | ----------------------------------------------------------------- |
| `clasico` | nave/bala/asteroide | 1.00:1 | Excepción aceptada: `clasico` separa por forma y grosor, no color |
| `neon`    | asteroide/partícula | 1.49:1 | Aceptado: la partícula es escombro de ese mismo asteroide         |
| `retro`   | nave/asteroide      | 2.46:1 | ≥ 1.6:1                                                           |
| `retro`   | bala/asteroide      | 2.04:1 | ≥ 1.6:1                                                           |
| `retro`   | power-up/asteroide  | 1.73:1 | ≥ 1.6:1                                                           |

### Correcciones que obligó la medición — `bloque-buster`

| Skin    | Rol              | Color descartado | Ratio  | Color final  | Ratio final | Motivo                                                                  |
| ------- | ---------------- | ---------------- | ------ | ------------ | ----------- | ----------------------------------------------------------------------- |
| `neon`  | `cyan`           | `#00c2d6`        | 6.39:1 | `#00b0c4`    | 5.36:1      | 1.56:1 y 3° de tono contra la paleta cian: se confundían                |
| `neon`  | `magenta`        | `#ff3d8f`        | 4.30:1 | `#ff5c9e`    | 4.90:1      | No llegaba a 4.5:1                                                      |
| `neon`  | `green`          | `#00d977`        | 7.32:1 | `#00c46a`    | 6.03:1      | 1.36:1 y 29° contra la paleta; además reusa el hex de Asteroides `neon` |
| `neon`  | `red`            | `#ff4d4d`        | 4.37:1 | `#ff5c5c`    | 4.69:1      | No llegaba a 4.5:1                                                      |
| `retro` | banda de bloques | techo 7.8:1      | —      | techo 5.65:1 | —           | Con el techo alto la pelota quedaba a 1.17:1 del bloque más claro       |

### Separación entre roles (ratio mutua) — `bloque-buster`

Los 7 colores de bloque son **un solo rol** (todos se rompen igual y valen 10 puntos: el color
es patrón de nivel, no mecánica), así que la regla de pares se aplica paleta↔bloque y
pelota↔bloque, no entre bloques. Regla: no puede darse a la vez ratio < 1.6:1 **y** < 40° de tono.

| Skin      | Par                          | Ratio  | Δ tono | Veredicto                                                 |
| --------- | ---------------------------- | ------ | ------ | --------------------------------------------------------- |
| `clasico` | paleta/pelota/bloques claros | 1.09:1 | > 60°  | Excepción aceptada: `clasico` separa por forma y posición |
| `neon`    | paleta/`cyan`                | 1.86:1 | 4°     | Peor par de tono; pasa por ratio                          |
| `neon`    | paleta/`green`               | 1.65:1 | 30°    | ≥ 1.6:1                                                   |
| `neon`    | paleta/`gray`                | 1.73:1 | 35°    | ≥ 1.6:1                                                   |
| `neon`    | paleta/`yellow`              | 1.43:1 | 146°   | Ratio baja, pero el tono los separa sin ambigüedad        |
| `neon`    | pelota/`yellow`              | 1.76:1 | 26°    | ≥ 1.6:1 (el peor par de la pelota)                        |
| `retro`   | pelota/`yellow`              | 1.61:1 | 6°     | Par que fija el techo de la escalera de bloques           |
| `retro`   | pelota/`magenta`             | 1.97:1 | 19°    | El más holgado de la escalera                             |
| `retro`   | paleta/`yellow`              | 1.92:1 | 6°     | ≥ 1.6:1                                                   |

### Correcciones que obligó la medición — `serpentina`

| Skin    | Rol     | Color descartado            | Ratio  | Color final | Ratio final | Motivo                                                                                    |
| ------- | ------- | --------------------------- | ------ | ----------- | ----------- | ----------------------------------------------------------------------------------------- |
| `neon`  | rejilla | `#13707e`                   | 2.66:1 | `#327d85`   | 3.14:1      | No llegaba al 3:1 decorativo: la rejilla se perdía bajo la scanline                       |
| `retro` | fruta   | `#ffb84d` (rung de bonus)   | 7.77:1 | `#e69624`   | 5.69:1      | 1.17:1 contra el cuerpo `#ffcf6b`: en monocromo la fruta y un segmento eran el mismo tono |
| `retro` | cuerpo  | `#d2841b` (rung de enemigo) | 4.67:1 | `#ffcf6b`   | 9.08:1      | 1.48:1 contra la rejilla `#b85c00`: la serpiente se fundía con el tablero                 |

El caso de `retro` es el que fija la estructura del skin: con cuatro roles (cabeza, cuerpo,
fruta, rejilla) dentro de un único ladder ámbar de 3.16→10.85 (span 3.43x) no caben cuatro
escalones de 1.6:1. Se resolvió tratando cabeza+cuerpo como **una sola familia** (son el mismo
organismo, igual que nave/propulsor en Asteroides) y gastando todo el margen disponible en el
par que sí es peligroso confundir: cuerpo↔fruta (creer que un segmento es fruta lleva a chocar
contra uno mismo, es decir, a morir).

### Separación entre roles (ratio mutua) — `serpentina`

Regla: no puede darse a la vez ratio < 1.6:1 **y** < 40° de tono.

| Skin      | Par            | Ratio  | Δ tono | Veredicto                                                                           |
| --------- | -------------- | ------ | ------ | ----------------------------------------------------------------------------------- |
| `clasico` | cabeza/cuerpo  | 1.07:1 | 7°     | Excepción aceptada: extracción literal; la cabeza se lee por movimiento             |
| `neon`    | cabeza/cuerpo  | 1.86:1 | 4°     | ≥ 1.6:1                                                                             |
| `neon`    | cuerpo/rejilla | 1.71:1 | 0°     | El par más ajustado del skin: mismo tono, separado solo por luminancia y saturación |
| `neon`    | cuerpo/fruta   | 1.08:1 | 127°   | Ratio baja, pero el tono los separa sin ambigüedad                                  |
| `neon`    | fruta/rejilla  | 1.58:1 | 127°   | Ídem: pasa por tono                                                                 |
| `retro`   | cabeza/cuerpo  | 1.19:1 | 0°     | Excepción de familia: son el mismo organismo, como nave/propulsor                   |
| `retro`   | cuerpo/fruta   | 1.60:1 | 6°     | Justo en el umbral; es el par que fija la escalera                                  |
| `retro`   | cabeza/fruta   | 1.91:1 | 6°     | ≥ 1.6:1                                                                             |
| `retro`   | fruta/rejilla  | 1.80:1 | 5°     | ≥ 1.6:1                                                                             |
| `retro`   | cuerpo/rejilla | 2.88:1 | 11°    | ≥ 1.6:1                                                                             |
