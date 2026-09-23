# Juegos con skins

_Mantenido por el agente `skin-designer`. Solo él escribe aquí. Última actualización: 2026-09-22._

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
| `frogger`       | `FroggerGame.tsx`  | sí        | sí     | sí      | Implementado | 2026-09-22 |
| `caida`         | `Tetris.tsx`       | —         | —      | —       | Pendiente    | —          |

Siguiente comando sugerido: `@skin-designer caida`.

`frogger` entró a `REAL_GAMES` con SPEC `game-jam/flogger/03-frogger-core` (rama
`spec-flogger-03-frogger-core`) y ya recibió sus tres paletas. Es el quinto juego real:
SPEC 10 se escribió cuando eran cuatro, así que "los cuatro juegos reales" de ese texto
hay que leerlo como "todos los juegos reales del catálogo".

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

### `frogger` — SPEC 10 + SPEC `game-jam/flogger/03-frogger-core`, 2026-09-22

Paleta en `lib/skins.ts` → `FROGGER_SKINS` (interfaz `FroggerSkin`).

| Rol                   | `clasico`                     | `neon`                        | `retro`                       |
| --------------------- | ----------------------------- | ----------------------------- | ----------------------------- |
| `bgRoad`              | `#000000`                     | `#05060a`                     | `#160d02`                     |
| `bgRiver`             | `#001a3a`                     | `#062333`                     | `#060300`                     |
| `bgSafe`              | `#0a2a12`                     | `#07180f`                     | `#2e1f07`                     |
| rana                  | `#39ff6a` · glow 0            | `#00f5ff` · glow 12           | `#ffe7b3` · glow 2            |
| ojo / pupila          | `#ffffff` / `#0a0a0a`         | `#ffffff` / `#05060a`         | `#fff6e0` / `#241300`         |
| coche / rueda         | `#ff3b3b` / `#111111`         | `#ff4fd8` / `#2a1030`         | `#e69624` / `#2a1600`         |
| camión / cabina       | `#8a8a8a` / `#555555`         | `#9aa7bd` / `#66748c`         | `#b69667` / `#8f7044`         |
| glow de vehículo      | 0                             | 8                             | 0                             |
| tronco / veta         | `#8b5a2b` / `#5c3a1a`         | `#ffa41b` / `#b3721a`         | `#c98018` / `#9a610f`         |
| tortuga / caparazón   | `#1a9e4a` / `#0d5c2a`         | `#00c46a` / `#04563a`         | `#f0ab3d` / `#9a6a14`         |
| tortuga sumergida     | `rgba(0,255,136,0.3)`         | `#0d9460`                     | `#a86a12`                     |
| glow de río           | 0                             | 6                             | 0                             |
| boca relleno/borde    | `#0f3d1c` / `#e8c34a`         | `#0a2233` / `#f5ff00`         | `#3d2b0b` / `#ffb84d`         |
| boca ocupada          | `#39ff6a` · glow 0            | `#00b0c4` · glow 10           | `#eb9c28` · glow 1            |
| HUD texto / vidas     | `#ffffff` / `#39ff6a`         | `#ffffff` / `#00f5ff`         | `#ffcf6b` / `#ffe7b3`         |
| HUD fuente            | `16px monospace`              | `16px monospace`              | `bold 16px mono`              |
| barra alto/medio/bajo | `#39ff6a`/`#f5ff00`/`#ff3b3b` | `#00c46a`/`#ffa41b`/`#ff6b6b` | `#e69624`/`#ffb84d`/`#ffcf6b` |

Argumento de diseño:

- **`clasico`** es extracción literal del `FroggerGame.tsx` recién portado: `zoneColorForRow`
  (`:163-168` antes de esta corrida), bocas `:481-487`, vehículos `:501-512`, tronco `:514-516`,
  tortugas `:525-531`, rana `:553-568` y HUD `:575-593`. No se rediseñó ni un hex.
- **`neon`** repite el reparto de roles de los tres juegos anteriores: la rana es el
  `--cyan #00f5ff` (lo que controla el jugador y lo más luminoso del cuadro, 9.97:1), el coche
  el `#ff4fd8` que Asteroides usa para el enemigo, y el camión el acero `#9aa7bd` de Bloque
  Buster. Lo propio de Frogger es que las **dos plataformas del río se separan por tono y no por
  luminancia**: tronco ámbar `#ffa41b` (5.91:1) contra tortuga verde `#00c46a` (5.13:1), 1.16:1
  de ratio pero 116° de tono. Eso deja todo el margen de luminancia libre para que la rana
  destaque sobre cualquiera de las dos.
- **`retro`** es el caso difícil: nueve roles en un solo fósforo ámbar. Se resuelve **invirtiendo
  la intuición de las zonas** — el río es la banda **más oscura** (`#060300`, el agua como vacío)
  y las filas seguras la más clara (`#2e1f07`) — para regalarle a las plataformas todo el margen
  de luminancia disponible. Con eso la escalera cierra con tres escalones reales:
  rana `#ffe7b3` (11.26:1) → tortuga `#f0ab3d` (7.06:1) → tronco `#c98018` (4.55:1),
  a 1.64:1 y 1.61:1 uno del otro. Los vehículos ocupan la banda media sobre el asfalto
  (`#e69624` 5.60:1, `#b69667` 4.89:1) y se distinguen entre sí por saturación, no por brillo.

Peldaños nuevos del ladder ámbar de `retro` (para que la corrida de `caida` los reutilice en
vez de inventar otros): `#f0ab3d` (plataforma primaria, ~7:1), `#c98018` (plataforma
secundaria, ~4.5:1), `#eb9c28` (marcador de objetivo conquistado, ~4.6:1) y `#a86a12`
(estado deshabilitado/peligroso, ~3.4:1). Los peldaños heredados de Asteroides
(`#ffe7b3`, `#ffcf6b`, `#ffb84d`, `#e69624`, `#d2841b`, `#b85c00`) no se tocaron.

Casos especiales resueltos en esta corrida:

- **Primer juego con fondo por zona.** `FroggerSkin` lleva `bgRoad`/`bgRiver`/`bgSafe` en vez de
  un `bg` único, porque en Frogger el color del fondo **es mecánica**: el río ahoga, la fila
  segura no. `zoneColorForRow(row)` pasa a `zoneColorForRow(row, pal)` y sigue siendo la única
  fuente de la banda; no se añadió geometría para dibujar las zonas.
- **Tres niveles de medición en vez de dos.** Además de crítico (≥ 4.5:1) y decorativo (≥ 3:1)
  contra el fondo de la zona, las **texturas internas** (veta del tronco, caparazón, cabina,
  ruedas, ojos y pupila) se miden contra **la figura sobre la que se pintan**, con un mínimo de
  1.5:1. Medir una veta oscura contra un fondo sobre el que nunca se dibuja no significa nada, y
  ninguna de esas texturas porta información de juego: quitarlas todas deja el juego jugable.
- **Coche y camión son un solo rol**, como los 7 bloques de Bloque Buster: los dos matan igual,
  así que confundirlos no tiene coste. No se gastan escalones de luminancia en separarlos; se
  gastan en los pares que sí cuestan una vida (rana↔plataforma y tronco↔tortuga).
- **La tortuga sumergida nunca lleva halo**, en ninguna skin. No es una plataforma y el glow la
  haría parecer una: su señal primaria es de forma (contorno hueco vs relleno), heredada del
  juego, y el color solo la acompaña.
- **El halo se apaga antes de cada detalle interno.** `shadowBlur`/`shadowColor` se fijan al
  entrar en el cuerpo de cada entidad y vuelven a `0`/`"transparent"` antes de las ruedas, la
  cabina, la veta, el caparazón y los ojos — si no, el `neon` embarraba el detalle con el halo
  del cuerpo. El HUD se dibuja siempre con el halo ya apagado.
- **Los ojos de la rana van sin halo a propósito.** Son el localizador del jugador: el par
  ojo/pupila mantiene ~14.8:1 interno en las tres skins, que es lo que permite encontrar la rana
  cuando está montada sobre una plataforma clara. El ojo contra el cuerpo queda en 1.1–1.4:1 en
  las tres, y eso está bien: lo que se ve es la pupila.
- **Ningún `lineWidth` se tocó.** El grosor del caparazón depende hoy del `lineWidth` que dejó la
  entidad anterior; cambiarlo habría alterado el aspecto de `clasico`, que es la prueba de no
  regresión. Las paletas solo llevan color y glow.
- `GamePlayer.tsx` no necesitó cambios: `skin` ya llegaba a `FroggerGame` (lo aceptaba y lo
  ignoraba) y el `SkinPicker` tras `hasSkins()` ya existía; bastó sumar `"frogger"` a
  `GAMES_WITH_SKINS`.

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

### Mediciones de `frogger`

Frogger tiene **tres fondos**, así que cada elemento se mide contra el fondo de **su zona**
(carretera, río o fila segura) dentro de su propia skin, no contra un fondo único. Hay además un
tercer nivel: las texturas internas, medidas contra la figura que las lleva (ver más abajo).

| Juego     | Skin      | Elemento           | Color     | Fondo (zona)    | Centro  | Borde  | Retención | Umbral     | OK                 |
| --------- | --------- | ------------------ | --------- | --------------- | ------- | ------ | --------- | ---------- | ------------------ |
| `frogger` | `clasico` | rana / carretera   | `#39ff6a` | `#000000` road  | 10.39:1 | 2.00:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | rana / río         | `#39ff6a` | `#001a3a` river | 9.02:1  | 1.92:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | rana / fila segura | `#39ff6a` | `#0a2a12` safe  | 8.30:1  | 1.89:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | HUD texto          | `#ffffff` | `#0a2a12` safe  | 11.00:1 | 2.21:1 | 1.00      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | barra tiempo medio | `#f5ff00` | `#0a2a12` safe  | 10.08:1 | 2.10:1 | 0.95      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | HUD vidas          | `#39ff6a` | `#0a2a12` safe  | 8.30:1  | 1.89:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | barra tiempo alto  | `#39ff6a` | `#0a2a12` safe  | 8.30:1  | 1.89:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | boca ocupada       | `#39ff6a` | `#0f3d1c` boca  | 6.99:1  | 1.83:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | boca borde         | `#e8c34a` | `#0f3d1c` boca  | 5.58:1  | 1.66:1 | 0.77      | 4.5 / 0.60 | sí                 |
| `frogger` | `clasico` | camión             | `#8a8a8a` | `#000000` road  | 4.31:1  | 1.42:1 | 0.61      | 4.5 / 0.60 | **no** (excepción) |
| `frogger` | `clasico` | coche              | `#ff3b3b` | `#000000` road  | 4.19:1  | 1.37:1 | 0.59      | 4.5 / 0.60 | **no** (excepción) |
| `frogger` | `clasico` | tortuga visible    | `#1a9e4a` | `#001a3a` river | 3.71:1  | 1.35:1 | 0.60      | 4.5 / 0.60 | **no** (excepción) |
| `frogger` | `clasico` | barra tiempo bajo  | `#ff3b3b` | `#0a2a12` safe  | 3.35:1  | 1.30:1 | 0.59      | 4.5 / 0.60 | **no** (excepción) |
| `frogger` | `clasico` | tronco             | `#8b5a2b` | `#001a3a` river | 2.36:1  | 1.19:1 | 0.53      | 4.5 / 0.60 | **no** (excepción) |
| `frogger` | `clasico` | tortuga sumergida  | `#005f51` | `#001a3a` river | 1.88:1  | 1.13:1 | 0.50      | 3.0 / 0.50 | **no** (excepción) |
| `frogger` | `clasico` | boca relleno       | `#0f3d1c` | `#0a2a12` safe  | 1.19:1  | 1.03:1 | 0.47      | 3.0 / 0.50 | **no** (excepción) |
| `frogger` | `neon`    | HUD texto          | `#ffffff` | `#07180f` safe  | 12.39:1 | 2.26:1 | 1.00      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | boca borde         | `#f5ff00` | `#0a2233` boca  | 10.43:1 | 2.11:1 | 0.95      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | rana / carretera   | `#00f5ff` | `#05060a` road  | 9.97:1  | 1.96:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | rana / fila segura | `#00f5ff` | `#07180f` safe  | 9.24:1  | 1.91:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | HUD vidas          | `#00f5ff` | `#07180f` safe  | 9.24:1  | 1.91:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | rana / río         | `#00f5ff` | `#062333` river | 8.47:1  | 1.88:1 | 0.85      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | barra tiempo medio | `#ffa41b` | `#07180f` safe  | 6.45:1  | 1.64:1 | 0.72      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | tronco             | `#ffa41b` | `#062333` river | 5.91:1  | 1.61:1 | 0.72      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | camión             | `#9aa7bd` | `#05060a` road  | 5.77:1  | 1.57:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | barra tiempo alto  | `#00c46a` | `#07180f` safe  | 5.60:1  | 1.54:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | tortuga visible    | `#00c46a` | `#062333` river | 5.13:1  | 1.51:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | coche              | `#ff4fd8` | `#05060a` road  | 4.95:1  | 1.46:1 | 0.63      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | barra tiempo bajo  | `#ff6b6b` | `#07180f` safe  | 4.72:1  | 1.45:1 | 0.64      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | boca ocupada       | `#00b0c4` | `#0a2233` boca  | 4.57:1  | 1.45:1 | 0.65      | 4.5 / 0.60 | sí                 |
| `frogger` | `neon`    | tortuga sumergida  | `#0d9460` | `#062333` river | 3.20:1  | 1.29:1 | 0.58      | 3.0 / 0.50 | sí                 |
| `frogger` | `neon`    | boca relleno       | `#0a2233` | `#07180f` safe  | 1.09:1  | 1.02:1 | 0.45      | 3.0 / 0.50 | **no** (excepción) |
| `frogger` | `retro`   | rana / río         | `#ffe7b3` | `#060300` river | 11.26:1 | 2.11:1 | 0.91      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | rana / carretera   | `#ffe7b3` | `#160d02` road  | 10.67:1 | 2.07:1 | 0.91      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | rana / fila segura | `#ffe7b3` | `#2e1f07` safe  | 9.33:1  | 2.01:1 | 0.91      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | HUD vidas          | `#ffe7b3` | `#2e1f07` safe  | 9.33:1  | 2.01:1 | 0.91      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | HUD texto          | `#ffcf6b` | `#2e1f07` safe  | 7.81:1  | 1.83:1 | 0.83      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | barra tiempo bajo  | `#ffcf6b` | `#2e1f07` safe  | 7.81:1  | 1.83:1 | 0.83      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | tortuga visible    | `#f0ab3d` | `#060300` river | 7.06:1  | 1.69:1 | 0.73      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | barra tiempo medio | `#ffb84d` | `#2e1f07` safe  | 6.69:1  | 1.71:1 | 0.77      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | boca borde         | `#ffb84d` | `#3d2b0b` boca  | 5.93:1  | 1.67:1 | 0.77      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | coche              | `#e69624` | `#160d02` road  | 5.60:1  | 1.54:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | barra tiempo alto  | `#e69624` | `#2e1f07` safe  | 4.90:1  | 1.50:1 | 0.68      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | camión             | `#b69667` | `#160d02` road  | 4.89:1  | 1.48:1 | 0.65      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | boca ocupada       | `#eb9c28` | `#3d2b0b` boca  | 4.60:1  | 1.50:1 | 0.69      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | tronco             | `#c98018` | `#060300` river | 4.55:1  | 1.43:1 | 0.62      | 4.5 / 0.60 | sí                 |
| `frogger` | `retro`   | tortuga sumergida  | `#a86a12` | `#060300` river | 3.39:1  | 1.31:1 | 0.56      | 3.0 / 0.50 | sí                 |
| `frogger` | `retro`   | boca relleno       | `#3d2b0b` | `#2e1f07` safe  | 1.13:1  | 1.02:1 | 0.46      | 3.0 / 0.50 | **no** (excepción) |

**Excepciones documentadas de `clasico` en `frogger`:** seis valores quedan bajo umbral (coche
4.19, camión 4.31, tortuga 3.71, barra baja 3.35, tronco 2.36, sumergida 1.88). Mismo criterio
que en `bloque-buster` y `serpentina`: `clasico` es extracción literal y prueba de no regresión,
y subirlos rompería el criterio de aceptación de SPEC 10. `neon` y `retro` son la ruta accesible
— en ambas, todo lo crítico pasa 4.5:1 y la tortuga sumergida pasa el 3:1 decorativo.

**Excepción común a las tres skins — el relleno de la boca** (1.09–1.19:1 contra la fila segura).
Es deliberado: la boca se identifica por su **borde** (5.58–10.43:1 en las tres) y por el
marcador de ocupada; el relleno es solo la sombra del hueco. Subirlo a 3:1 convertiría la fila de
metas en cinco bloques luminosos compitiendo con la rana.

### Texturas internas de `frogger` (tercer nivel: ≥ 1.5:1 contra la figura que las lleva)

No portan información de juego — quitarlas todas deja el juego igualmente jugable — y se pintan
siempre encima de una entidad, nunca sobre el fondo, así que medirlas contra el fondo no
significaría nada.

| Textura      | Sobre   | `clasico` | `neon`  | `retro` | Umbral | OK                 |
| ------------ | ------- | --------- | ------- | ------- | ------ | ------------------ |
| rueda        | coche   | 5.34:1    | 6.06:1  | 7.21:1  | 1.5:1  | sí                 |
| caparazón    | tortuga | 2.34:1    | 3.80:1  | 2.38:1  | 1.5:1  | sí                 |
| cabina       | camión  | 2.16:1    | 1.94:1  | 1.65:1  | 1.5:1  | sí                 |
| veta         | tronco  | 1.73:1    | 1.98:1  | 1.61:1  | 1.5:1  | sí                 |
| pupila       | rana    | 14.79:1   | 14.95:1 | 14.84:1 | 1.5:1  | sí                 |
| ojo (anillo) | rana    | 1.34:1    | 1.35:1  | 1.13:1  | 1.5:1  | **no** (excepción) |

**Excepción del ojo, común a las tres skins:** el anillo claro del ojo no llega a 1.5:1 contra el
cuerpo de la rana en ninguna, y no se corrige. El ojo se lee por su **pupila** (≈14.8:1 en las
tres), que es el punto oscuro que localiza a la rana cuando está montada sobre una plataforma
clara. Subir el anillo obligaría a bajar el cuerpo de la rana, que es el elemento que la regla de
"lo que controla el jugador es lo más luminoso" manda dejar arriba del todo.

### Correcciones que obligó la medición — `frogger`

| Skin    | Rol                | Color descartado             | Ratio  | Color final | Ratio final | Motivo                                                                            |
| ------- | ------------------ | ---------------------------- | ------ | ----------- | ----------- | --------------------------------------------------------------------------------- |
| `neon`  | tortuga sumergida  | `rgba(0,196,106,0.35)`       | 1.69:1 | `#0d9460`   | 3.20:1      | Compuesta sobre el río no llegaba al 3:1 decorativo; pasa a color sólido          |
| `neon`  | barra tiempo bajo  | `#ff5c5c`                    | 4.35:1 | `#ff6b6b`   | 4.72:1      | El rojo de Bloque Buster `neon` no llega a 4.5:1 sobre la fila segura             |
| `neon`  | cabina del camión  | `#5f6d84`                    | 1.35:1 | `#66748c`   | 1.94:1      | No llegaba a 1.5:1 contra el cuerpo del camión                                    |
| `neon`  | `bgRiver`          | `#05283b`                    | —      | `#062333`   | —           | Con el río más claro la tortuga caía a 4.92:1 y la sumergida a 3.07:1, sin margen |
| `retro` | tortuga visible    | `#ffb84d` (peldaño de bonus) | 8.07:1 | `#f0ab3d`   | 7.06:1      | 1.42:1 contra la rana: la rana desaparecía al montarse encima                     |
| `retro` | tronco             | `#c47c16`                    | 4.31:1 | `#c98018`   | 4.55:1      | No llegaba a 4.5:1 sobre el río                                                   |
| `retro` | tronco + tortuga   | `#d2841b` + `#e69624`        | 1.24:1 | ver arriba  | 1.61:1      | Los dos peldaños heredados de Asteroides quedaban a 1.24:1 entre sí               |
| `retro` | boca ocupada       | `#ffcf6b`                    | 6.93:1 | `#eb9c28`   | 4.60:1      | 1.20:1 contra la rana: una meta conquistada se leía como la rana viva             |
| `retro` | `bgRiver`/`bgRoad` | río claro / asfalto negro    | —      | invertidos  | —           | Con el río claro no cabían tres escalones entre rana, tortuga y tronco            |

### Separación entre roles (ratio mutua) — `frogger`

Regla: no puede darse a la vez ratio < 1.6:1 **y** < 40° de tono. Coche y camión son **un solo
rol** (los dos matan igual), así que la regla no se les aplica entre sí.

| Skin      | Par                       | Ratio  | Δ tono | Veredicto                                                                  |
| --------- | ------------------------- | ------ | ------ | -------------------------------------------------------------------------- |
| `clasico` | rana / tronco             | 4.36:1 | 105°   | ≥ 1.6:1                                                                    |
| `clasico` | rana / coche              | 2.64:1 | 135°   | ≥ 1.6:1                                                                    |
| `clasico` | rana / tortuga            | 2.60:1 | 7°     | ≥ 1.6:1                                                                    |
| `clasico` | tronco / tortuga          | 1.68:1 | 112°   | ≥ 1.6:1                                                                    |
| `clasico` | rana / boca ocupada       | 1.00:1 | 0°     | Excepción aceptada: son el mismo hex en el juego original                  |
| `neon`    | rana / camión             | 1.80:1 | 35°    | ≥ 1.6:1                                                                    |
| `neon`    | rana / tortuga            | 1.70:1 | 30°    | ≥ 1.6:1                                                                    |
| `neon`    | tortuga visible/sumergida | 1.68:1 | 4°     | ≥ 1.6:1 (además la sumergida es contorno, no relleno)                      |
| `neon`    | rana / boca ocupada       | 1.94:1 | 4°     | ≥ 1.6:1                                                                    |
| `neon`    | rana / tronco             | 1.47:1 | 146°   | Ratio baja, pero el tono los separa sin ambigüedad                         |
| `neon`    | tronco / tortuga          | 1.16:1 | 116°   | Ídem: en `neon` las dos plataformas se separan por tono, no por luminancia |
| `retro`   | rana / tronco             | 2.63:1 | 6°     | ≥ 1.6:1                                                                    |
| `retro`   | rana / camión             | 2.30:1 | 5°     | ≥ 1.6:1                                                                    |
| `retro`   | tortuga visible/sumergida | 2.24:1 | 2°     | ≥ 1.6:1                                                                    |
| `retro`   | rana / coche              | 1.98:1 | 6°     | ≥ 1.6:1                                                                    |
| `retro`   | rana / boca ocupada       | 1.86:1 | 5°     | ≥ 1.6:1                                                                    |
| `retro`   | rana / tortuga            | 1.64:1 | 4°     | El par que fija el techo de las plataformas                                |
| `retro`   | tronco / tortuga          | 1.61:1 | 2°     | El par que fija el suelo; justo en el umbral                               |
| `retro`   | coche / camión            | 1.16:1 | 0°     | Mismo rol; separados por saturación (84% vs 44%), no por brillo            |

### Separación entre zonas de `frogger` (el fondo es mecánica, no decoración)

En Frogger el fondo dice si te ahogas: río, carretera y filas seguras tienen que distinguirse.
Las bandas son franjas de ancho completo con borde duro, así que no se les aplica la regla de
pares de objetos; se registra su ratio para dejar constancia. Las parejas **adyacentes** en
pantalla son río↔segura y carretera↔segura (la fila segura del medio separa siempre río de
carretera).

| Skin      | río / segura | carretera / segura | río / carretera | Nota                                                             |
| --------- | ------------ | ------------------ | --------------- | ---------------------------------------------------------------- |
| `clasico` | 1.12:1       | 1.35:1             | 1.21:1          | Separadas por tono (azul / verde / negro)                        |
| `neon`    | 1.13:1       | 1.11:1             | 1.25:1          | Ídem, con 53°–80° de tono entre bandas adyacentes                |
| `retro`   | 1.29:1       | 1.20:1             | 1.07:1          | Monocromo: es la única skin donde la banda se lee por luminancia |

`retro` es, por eso, la skin con **mayor** separación de luminancia entre zonas adyacentes de las
tres: sin tono disponible, el brillo tiene que hacer todo el trabajo.
