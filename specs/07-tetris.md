# 07 · Juego real "TETRIS"

- **Estado:** Implementado
- **Depende de:** SPEC 05, SPEC 06
- **Fecha:** 2026-09-07
- **Objetivo:** Reemplazar el `GamePlayer` simulado de "CAÍDA" por el juego real de Tetris (`references/started-games/03-tetris/game.js`) portado a un componente React/TypeScript en canvas, integrado con el HUD, la pausa y el modal de fin de partida ya existentes, sin tocar el catálogo ni las puntuaciones ya sembradas en Supabase.

## Scope

**Dentro:**

- Nuevo componente `components/games/Tetris.tsx` (Client Component) que porta a TypeScript toda la lógica de `references/started-games/03-tetris/game.js`: tablero 10×20, las 8 piezas (incluida la pieza "N"/tuerca), rotación con wall-kicks `[0,-1,1,-2,2]`, soft drop/hard drop, ghost piece, limpieza de líneas, puntuación (`LINE_SCORES` × nivel, +2/celda en hard drop, +1/fila en soft drop) y progresión de nivel/velocidad (`dropInterval = max(100, 1000 - (nivel-1)*90)`), manteniendo mecánicas idénticas al original.
- El componente renderiza un único `<canvas>` de resolución interna fija 800×600 (mismo aspecto 4:3 que `.crt-screen` y que `Asteroids.tsx`), escalado a 100% de ancho/alto de su contenedor vía CSS. El tablero (10×20 celdas de 24px = 240×480) se dibuja centrado verticalmente y desplazado hacia la izquierda del canvas; el panel "SIGUIENTE" (preview de la próxima pieza) se dibuja directamente en el mismo canvas, a la derecha del tablero — reemplaza al `<canvas id="next-canvas">`/sidebar HTML del original, porque el contrato de `GamePlayer.tsx` solo monta un único canvas por juego real (mismo criterio que el indicador "3x" de Asteroides: información de juego transitoria se dibuja en el canvas, no como HTML aparte).
- Controles idénticos al original salvo la tecla de pausa: flechas izquierda/derecha mueven la pieza, flecha arriba y `KeyX` rotan, flecha abajo hace soft drop, Espacio hace hard drop; se agrega `preventDefault()` en esas teclas para que no hagan scroll de la página. La tecla `KeyP` de pausa del original **no se porta** — la pausa ya la controla el botón "PAUSA" de `GamePlayer.tsx` vía la prop `paused`.
- El componente expone `onStateChange({ score, lives, level })` en cada cambio y `onGameOver(finalScore)` cuando el tablero se desborda (la siguiente pieza no puede aparecer) o por FIN forzado. Como Tetris no tiene concepto de "vidas", `lives` se reporta fijo en `1` mientras la partida está en curso (ver Decisiones).
- El componente acepta `paused: boolean` (congela el loop sin perder el tablero, la pieza actual ni `dropAccum`, recalculando `lastTime` al reanudar para evitar un salto de `dt`) y expone `endGame()` vía `useImperativeHandle`/`forwardRef`, igual que `Asteroids.tsx`.
- Se elimina del canvas el HUD propio del original (SCORE/LINES/LEVEL, overlay de PAUSA/GAME OVER, botón de reinicio, toggle de tema claro/oscuro) — sustituidos por el HUD y el modal de React ya existentes. Se mantiene únicamente el preview de "SIGUIENTE" dibujado en canvas.
- Se generaliza `components/GamePlayer.tsx`: el `const isAsteroids = game.id === "asteroides"` hardcodeado pasa a ser un registro (`REAL_GAMES`) que mapea `game.id` a su componente real (`asteroides` → `Asteroids`, `caida` → `Tetris`), preservando exactamente el comportamiento actual para Asteroides y para los juegos simulados.
- **No se modifica ninguna fila de Supabase.** `caida` ya existe en `games` (título "CAÍDA", `cat: PUZZLE`, `cover: cover-tetro`, `color: magenta`) con ~12 scores sembrados en `002_seed.sql` — se reutilizan tal cual. No se crea ninguna migración SQL nueva ni se toca `app/globals.css`.

**Fuera de alcance (para futuros specs):**

- Renombrar el id/título/cover de "caida" — a diferencia de SPEC 05 (`rocas`→`asteroides`), "CAÍDA" y `cover-tetro` ya describen correctamente un juego de piezas que caen; no hay justificación para el rename.
- Persistir "líneas totales" como stat propia — el HUD compartido solo expone Puntuación/Vidas/Nivel; el conteo de líneas queda implícito en la progresión de nivel, igual que ya definió el contrato de SPEC 05.
- Soporte táctil/móvil o reconfiguración de controles.
- Guardar/cargar el tema claro/oscuro del original (`localStorage('tetris-theme')`) — la plataforma ya tiene su propio tema visual (CRT neón), no aplica.
- Cualquier otro juego del catálogo (Bloque Buster, Serpentina, Glotón, Invasores, Ranaria, Duelo Pixel): siguen usando el `GamePlayer` simulado sin cambios.
- Sonido/efectos de audio.
- Ajustes de dificultad o balance de mecánicas respecto al original.

## Data model

Este feature no agrega ni modifica datos de Supabase — reutiliza `games`/`scores` de SPEC 06 sin cambios, y el `id: "caida"` ya sembrado. Sí define el contrato de props/callbacks entre el componente portado y `GamePlayer.tsx`, y la generalización de este último:

```ts
// components/games/Tetris.tsx
export interface TetrisState {
  score: number;
  lives: number; // siempre 1 mientras la partida está en curso (Tetris no tiene vidas)
  level: number; // floor(lines / 10) + 1, igual que el original
}

export interface TetrisProps {
  paused: boolean;
  onStateChange: (state: TetrisState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface TetrisHandle {
  endGame: () => void;
}
// export default forwardRef<TetrisHandle, TetrisProps>(Tetris)
```

```ts
// components/GamePlayer.tsx — generalización del branching (antes: isAsteroids)
type RealGameProps = {
  paused: boolean;
  onStateChange: (s: { score: number; lives: number; level: number }) => void;
  onGameOver: (finalScore: number) => void;
};
type RealGameHandle = { endGame: () => void };

const REAL_GAMES: Record<
  string,
  React.ForwardRefExoticComponent<
    RealGameProps & React.RefAttributes<RealGameHandle>
  >
> = {
  asteroides: Asteroids,
  caida: Tetris,
};
```

## Implementation plan

1. Crear `components/games/Tetris.tsx` como Client Component, portando a TypeScript la lógica completa de `references/started-games/03-tetris/game.js` (tablero, piezas, rotación, colisión, línea/score/nivel), encapsulada en un `useEffect` de montaje sobre un `<canvas>` referenciado con `useRef`.
2. Implementar el contrato de props (`paused`, `onStateChange`, `onGameOver`) y el ref imperativo (`endGame`) descritos en Data model; el loop reporta `{score, lives: 1, level}` solo cuando cambia, igual que `Asteroids.tsx`.
3. Dibujar el tablero (240×480 a 24px/celda, centrado) y el preview de "SIGUIENTE" directamente en el mismo canvas de 800×600; quitar el HUD propio (SCORE/LINES/LEVEL), el overlay de pausa/game over, el botón de reinicio y el toggle de tema del original.
4. Agregar `preventDefault()` a `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`/`KeyX`/`Space`; no portar `KeyP` (la pausa la controla `GamePlayer.tsx`).
5. Generalizar `components/GamePlayer.tsx`: reemplazar `isAsteroids`/el ternario de renderizado por un registro `REAL_GAMES` keyed por `game.id`, manteniendo el comportamiento actual de Asteroides y de los juegos simulados sin cambios; agregar `caida` → `Tetris` al registro.
6. Ejecutar `npm run dev`, navegar a `/juegos/caida/jugar` y probar manualmente: mover/rotar/soft drop/hard drop, ghost piece, limpieza de líneas (simple/doble/triple/tetris), preview de la siguiente pieza, aumento de velocidad cada 10 líneas, game over al desbordar el tablero.
7. Verificar la integración con HUD/controles existentes: PAUSA congela el juego exactamente (tablero, pieza y `dropAccum` intactos) y REANUDAR continúa sin salto de velocidad; FIN abre el modal con el score acumulado; el modal permite guardar el score real en `scores` para `game_id: "caida"`; "JUGAR DE NUEVO" reinicia con score 0.
8. Verificar que Asteroides (`/juegos/asteroides/jugar`) y los juegos simulados no cambiaron de comportamiento tras la generalización del registro en `GamePlayer.tsx`.
9. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Acceptance criteria

- [x] `/juegos/caida/jugar` renderiza el juego real de Tetris en canvas dentro de `.crt-screen`, con el mismo aspecto 4:3 que el resto del reproductor.
- [x] Flechas izquierda/derecha mueven la pieza, flecha arriba/`X` rotan (con wall-kicks), flecha abajo hace soft drop (+1 punto/fila), Espacio hace hard drop (+2 puntos/celda); ninguna de esas teclas hace scroll de la página.
- [ ] El ghost piece se dibuja en la posición de caída proyectada, con transparencia, igual que el original. _(implementado en código, no confirmado visualmente en la verificación manual — el tablero estaba casi vacío y la pieza fantasma queda debajo de la pieza actual)_
- [ ] Limpiar 1/2/3/4 líneas otorga `100/300/500/800 × nivel` puntos respectivamente. _(no ejercitado en la sesión de verificación manual, requiere una partida más larga)_
- [ ] El nivel sube cada 10 líneas acumuladas y la velocidad de caída aumenta (`max(100, 1000 - (nivel-1)*90)` ms). _(no ejercitado en la sesión de verificación manual)_
- [x] El preview de la siguiente pieza se ve dibujado sobre el canvas y se actualiza en cada pieza nueva.
- [x] El HUD superior de `GamePlayer.tsx` (Puntuación/Vidas/Nivel) refleja en tiempo real el score y nivel reales del juego; Vidas muestra un valor fijo mientras la partida está en curso.
- [x] El botón "PAUSA" congela completamente el juego (tablero, pieza actual y velocidad de caída intactos) y "REANUDAR" continúa exactamente donde quedó.
- [x] El botón "FIN" abre el modal de fin de partida con el score acumulado hasta ese momento.
- [ ] Que la siguiente pieza no pueda aparecer (tablero desbordado) abre el mismo modal de fin de partida, con el score final correcto. _(no ejercitado, requiere llenar el tablero)_
- [x] El canvas ya no dibuja su propio SCORE/LINES/LEVEL, overlay de PAUSA/GAME OVER, botón de reinicio ni toggle de tema.
- [ ] "JUGAR DE NUEVO" desde el modal arranca una partida nueva con score 0, nivel 1 y tablero vacío. _(no ejercitado en la sesión de verificación manual)_
- [ ] "SALIR" navega a `/juegos/caida` sin dejar el loop del juego corriendo en segundo plano. _(se probó navegando por URL directa, no clickeando el botón SALIR; el código es el mismo `cleanup` del `useEffect` que ya usa Asteroids)_
- [x] El botón "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: "caida"` (confirmado: toast "PUNTUACIÓN GUARDADA"). **No confirmado:** que la nueva puntuación "aparezca" en Detalle/Salón — ver Riesgo nuevo abajo, el score real (decenas/cientos) queda muy por debajo del límite de 12 filas frente a los scores sembrados (~95.700–184.220), heredados de la escala del `CAÍDA` simulado.
- [x] Asteroides (`/juegos/asteroides/jugar`) y el resto de juegos simulados (`bloque-buster`, `serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`) no cambian de comportamiento respecto al estado actual.
- [x] La entrada de catálogo "caida" (título, categoría, cover, color) no cambia — sigue siendo la misma fila ya sembrada en SPEC 06.
- [x] No hay errores ni warnings en la consola del navegador al jugar una partida completa de Tetris (solo ruido conocido de extensiones de Chrome, no relacionado con la app).
- [x] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** reutilizar el id/título/cover/color existentes de "caida" (CAÍDA / PUZZLE / `cover-tetro` / magenta) para el Tetris real. **No:** crear una entrada nueva de catálogo, porque "CAÍDA" y su cover ya describen exactamente este juego — a diferencia de SPEC 05 (`rocas` no describía Asteroides), aquí no hay mismatch que justifique una migración SQL nueva.
- **Sí:** canvas interno de 800×600 (4:3), igual que `Asteroids.tsx`, en vez del 300×600 del original. **No:** mantener el aspecto vertical 1:2 original, porque `.crt-screen` tiene `aspect-ratio: 4/3` fijo y el canvas se escala con `width/height: 100%` sin `object-fit`; un canvas interno 1:2 se vería deformado (bloques aplastados horizontalmente).
- **Sí:** dibujar el preview de "SIGUIENTE" pieza directamente en el mismo canvas, a la derecha del tablero. **No:** un segundo `<canvas>` u otro elemento DOM aparte (como el sidebar del original), porque el contrato de `GamePlayer.tsx` monta un único componente de juego dentro de `.crt-screen`; se trata igual que el indicador "3x" de Asteroides (información de juego transitoria dibujada en canvas).
- **Sí:** `lives` se reporta fijo en `1` mientras la partida está en curso (Tetris no tiene un conteo de vidas real). **No:** inventar un conteo de vidas artificial, porque cambiaría las reglas del juego original sin necesidad; el HUD compartido tolera un valor constante en ese campo, igual que otros juegos futuros sin vidas podrán hacer.
- **Sí:** generalizar `GamePlayer.tsx` a un registro `REAL_GAMES` en este spec (es el segundo juego real). **No:** agregar un segundo `if game.id === "caida"` calcado del de Asteroides, porque duplicar la rama por cada juego nuevo no escala y ya lo anticipaba la decisión de SPEC 05 de dejar la generalización para "cuando exista un segundo juego real".
- **No:** portar la tecla `KeyP` de pausa ni el toggle de tema claro/oscuro del original. La pausa ya la controla el botón "PAUSA" de React: tener dos formas de pausar (tecla + botón) desincronizaría el estado `paused` que ya vive en `GamePlayer.tsx`. El toggle de tema no aplica: la plataforma no tiene modo claro.
- **No:** persistir "líneas totales" como stat aparte. El contrato de estado compartido (`score`/`lives`/`level`) es fijo entre juegos reales desde SPEC 05; el progreso de líneas ya es visible indirectamente vía el nivel.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Mitigación                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Redibujar tablero + preview en un único canvas de 800×600 puede quedar con espacio mal balanceado visualmente si no se ajustan bien los offsets.                                                                                                                                                                                                                                                                                                                                                      | Es un ajuste puramente visual sin impacto funcional; se itera el layout (tamaño de celda, posición del preview) durante la verificación manual del paso 6 del plan.                                                                                                                                                                                                      |
| Al fijar `lives: 1`, el HUD "Vidas" (`"♥ ".repeat(lives)`) muestra un solo corazón durante toda la partida, lo cual puede leerse como "una vida" en un juego que en realidad no pierde vidas.                                                                                                                                                                                                                                                                                                         | Aceptado: es la interpretación más simple del contrato compartido sin agregar campos nuevos al HUD; documentado en Decisiones para que no se lea como un bug.                                                                                                                                                                                                            |
| La generalización de `GamePlayer.tsx` a un registro (`REAL_GAMES`) toca el único archivo que ya integra Asteroides; un error ahí podría romper el juego que ya funciona.                                                                                                                                                                                                                                                                                                                              | El paso 8 del plan de implementación exige verificar explícitamente que Asteroides y los juegos simulados no cambiaron de comportamiento antes de dar el spec por terminado.                                                                                                                                                                                             |
| **(Descubierto en verificación manual)** Los ~12 scores sembrados para "caida" en `002_seed.sql` (95.700–184.220) usan la escala del `CAÍDA` simulado anterior (`+10..90` cada 220 ms); el Tetris real puntúa en decenas/centenas por partida corta (`LINE_SCORES` × nivel, +1/+2 por drop). Un score real recién guardado queda por debajo del límite de 12 filas y no aparece en Detalle de juego ni en Salón de la Fama hasta que un jugador acumule cientos de miles de puntos jugando de verdad. | Aceptado como consecuencia directa de la decisión "no se modifica ninguna fila de Supabase" de este spec (no había mismatch de id/cover que lo justificara). Si se quiere que los scores reales de Tetris sean visibles pronto, requiere una decisión explícita del usuario y va en un spec/migración aparte: no se resuelve aquí para no reabrir "no se toca Supabase". |

## What is **not** in this spec

- Renombrar el id/título/cover de "caida".
- Nueva fila en `games`/`scores` o migración SQL.
- Persistencia de "líneas totales" como stat del HUD.
- Soporte táctil/móvil.
- Tema claro/oscuro del original.
- Cambios a otros juegos del catálogo.
- Sonido/efectos de audio.

Cada uno de estos, si se necesita, va en su propio spec.
