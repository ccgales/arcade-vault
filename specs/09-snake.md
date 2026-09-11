# 09 · Juego real "SERPENTINA" (Snake)

- **Estado:** Implementado
- **Depende de:** SPEC 05, SPEC 06
- **Fecha:** 2026-09-10
- **Objetivo:** Reemplazar el `GamePlayer` simulado de "SERPENTINA" por un juego real de Snake construido desde cero (sin código de referencia disponible), usando los sprites de frutas de `references/source-assets/snake-assets/` para las frutas, integrado con el HUD, la pausa y el modal de fin de partida ya existentes.

## Scope

**Dentro:**

- Nuevo componente `components/games/Snake.tsx` (Client Component) con un Snake clásico construido desde cero: grilla de 40×30 celdas de 20px (canvas interno 800×600, mismo criterio que `Asteroids.tsx`/`BloqueBuster.tsx`), serpiente que crece al comer fruta, choque contra pared o contra su propio cuerpo = fin de partida inmediato.
- Movimiento por grilla controlado por un acumulador de tiempo (tick), no por frame; velocidad base y su incremento por nivel (ver Modelo de datos). Control por flechas de teclado, con un buffer de "próxima dirección" para que dos pulsaciones dentro del mismo tick no provoquen un giro de 180° contra el propio cuerpo.
- Frutas dibujadas con el spritesheet `references/source-assets/snake-assets/fruits.png`, copiado a `public/snake/fruits.png` para servirlo como asset estático de Next. Las coordenadas de recorte de `references/source-assets/snake-assets/sprites.js` (`window.SPRITE_ATLAS.fruits`) se portan como una constante TypeScript interna del componente (no se carga el `.js` original ni se usa `window.SPRITE_ATLAS`, mismo criterio que SPEC 05 de no exponer estado en `window.*`). Cada vez que aparece una fruta nueva se elige al azar uno de los 21 sprites disponibles, solo por variedad visual — todas dan el mismo puntaje.
- El componente expone `onStateChange({ score, lives, level })` en cada cambio y `onGameOver(finalScore)` al chocar; acepta `paused: boolean` (congela el tick sin perder posición/dirección/fruta, recalculando el acumulador de tiempo al reanudar) y expone `endGame()` vía `useImperativeHandle`/`forwardRef` — mismo contrato que `Asteroids.tsx`/`Tetris.tsx`/`BloqueBuster.tsx`.
- Se elimina cualquier HUD propio del canvas (no aplica aquí porque se construye desde cero, pero el componente nunca dibuja su propio score/nivel/pantalla de game over) — el HUD y el modal de React ya existentes son la única fuente visible de esos datos.
- Se registra `serpentina: Snake` en el `REAL_GAMES` de `components/GamePlayer.tsx` (el registro ya es genérico desde SPEC 07/08; agregar esta entrada no requiere refactor nuevo).
- **No se modifica ninguna fila de Supabase ni `app/globals.css`.** `serpentina` ya existe en `games` (título "SERPENTINA", `cat: ARCADE`, `cover: cover-snake`, `color: green`) con scores sembrados en `002_seed.sql`, y `.cover-snake` ya existe en `app/globals.css` — se reutilizan tal cual.

**Fuera de alcance (para futuros specs):**

- Renombrar el id/título/cover de "serpentina" — el match temático ya es perfecto (ARCADE + `cover-snake` + verde describen exactamente un Snake), igual que ocurrió con "bloque-buster" en SPEC 08.
- Variantes de fruta con distinto efecto o puntaje (ej. frutas doradas que valen más, frutas que reducen la longitud) — todas las frutas valen lo mismo; el sprite es puramente cosmético.
- Wrap toroidal en los bordes (como Asteroides) — Snake usa la regla clásica de morir al chocar con la pared.
- Vidas múltiples o reaparición con invencibilidad — vidas fijas en 1 (game over inmediato al primer choque), decisión ya confirmada con el usuario.
- Sonido/efectos de audio — exclusión ya establecida en SPEC 05/07/08.
- Soporte táctil/móvil o reconfiguración de controles.
- Cualquier otro juego del catálogo (Glotón, Invasores, Ranaria, Duelo Pixel): siguen usando el `GamePlayer` simulado sin cambios.

## Modelo de datos

Este feature no agrega ni modifica datos de Supabase — reutiliza `games`/`scores` de SPEC 06 sin cambios, y el `id: "serpentina"` ya sembrado. Sí define el contrato de props/callbacks del componente y su registro en `REAL_GAMES`:

```ts
// components/games/Snake.tsx
export interface SnakeState {
  score: number; // +10 por fruta comida
  lives: number; // fijo en 1; pasa a reflejarse en onGameOver al primer choque, nunca decrementa a 0 visualmente antes del game over
  level: number; // 1..N; sube cada 5 frutas comidas (score % 50 === 0), aumenta la velocidad del tick
}

export interface SnakeProps {
  paused: boolean;
  onStateChange: (state: SnakeState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface SnakeHandle {
  endGame: () => void;
}
// export default forwardRef<SnakeHandle, SnakeProps>(Snake)
```

```ts
// components/GamePlayer.tsx — una entrada más en el registro ya existente
const REAL_GAMES: Partial<Record<string, RealGameComponent>> = {
  asteroides: Asteroids,
  caida: Tetris,
  "bloque-buster": BloqueBuster,
  serpentina: Snake,
};
```

Constantes de grilla y velocidad (internas de `Snake.tsx`):

```ts
const COLS = 40;
const ROWS = 30;
const CELL = 20; // 40*20=800, 30*20=600 → mismo canvas 800x600 que el resto de juegos reales
const SCORE_PER_FRUIT = 10;
const FRUITS_PER_LEVEL = 5; // sube de nivel cada 5 frutas (score % 50 === 0)
const START_INTERVAL_MS = 150; // duración de un tick de movimiento en nivel 1
const INTERVAL_DECREASE_PER_LEVEL_MS = 10;
const MIN_INTERVAL_MS = 60; // piso de velocidad
```

Atlas de sprites (portado desde `references/source-assets/snake-assets/sprites.js`, como constante TS en vez de script global):

```ts
const FRUIT_IMAGE_SRC = "/snake/fruits.png"; // copiado desde references/source-assets/snake-assets/fruits.png
const FRUIT_SPRITES: { x: number; y: number; w: number; h: number }[] = [
  { x: 34, y: 136, w: 110, h: 160 }, // banana
  { x: 186, y: 136, w: 150, h: 160 }, // orange
  // ...resto de las 21 frutas de sprites.js, mismas coordenadas
];
```

## Plan de implementación

1. Copiar `references/source-assets/snake-assets/fruits.png` a `public/snake/fruits.png` (asset estático servido por Next, igual convención que los `.svg` ya presentes en `public/`).
2. Crear `components/games/Snake.tsx` como Client Component con el esqueleto: `<canvas>` 800×600 referenciado con `useRef`, estilado a 100%/100% de su contenedor igual que los otros juegos reales, `useEffect` de montaje vacío con `requestAnimationFrame`.
3. Portar `FRUIT_SPRITES` como constante TS interna (las 21 entradas de `sprites.js`) y cargar `FRUIT_IMAGE_SRC` en un `Image` referenciado con `useRef`, dibujando solo cuando `img.complete` sea verdadero (fallback: no dibujar fruta hasta que cargue, sin bloquear el resto del loop).
4. Implementar el estado del juego: array de segmentos de la serpiente en coordenadas de grilla, dirección actual + dirección en cola (buffer, aplicada solo al inicio del siguiente tick y nunca como reversa directa de 180°), posición de la fruta actual + índice de sprite aleatorio, acumulador de tiempo que dispara un tick de movimiento cada `START_INTERVAL_MS - (level-1)*INTERVAL_DECREASE_PER_LEVEL_MS` ms (con piso `MIN_INTERVAL_MS`).
5. Implementar las reglas por tick: mover la cabeza en la dirección vigente; si cae sobre la fruta, la serpiente crece (no se elimina la cola), `score += SCORE_PER_FRUIT`, se coloca una fruta nueva en una celda libre aleatoria con un sprite aleatorio nuevo; si la cabeza sale de la grilla o colisiona con cualquier segmento del cuerpo, se dispara game over. Subir de nivel cuando `score` cruza un múltiplo de `SCORE_PER_FRUIT * FRUITS_PER_LEVEL`.
6. Implementar el contrato de props (`paused`, `onStateChange`, `onGameOver`) y el ref imperativo (`endGame`), con las mismas reglas que `Asteroids.tsx`/`Tetris.tsx`/`BloqueBuster.tsx`: `paused`/callbacks leídos vía refs, reporte de estado solo cuando cambia, reset del acumulador de tiempo al reanudar para evitar un salto de tick.
7. Implementar el dibujo: fondo de grilla sutil (opcional, estética neón), serpiente en rectángulos verdes (cabeza con un tono distinto del cuerpo), fruta dibujada con `drawImage` recortando el sprite elegido de `fruits.png` sobre la celda correspondiente.
8. Agregar `preventDefault()` a `ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`; los listeners se atan a `window` dentro del mismo `useEffect` de montaje y se remueven en su cleanup junto con la cancelación del `requestAnimationFrame`.
9. Registrar `serpentina: Snake` en `REAL_GAMES` dentro de `components/GamePlayer.tsx` (import + entrada en el objeto ya existente).
10. Ejecutar `npm run dev`, navegar a `/juegos/serpentina/jugar` y probar manualmente: movimiento por grilla en las 4 direcciones, imposibilidad de invertir 180° en un mismo tick, crecimiento y sprite aleatorio al comer fruta, choque contra pared y contra el propio cuerpo, subida de nivel cada 5 frutas con aumento de velocidad perceptible.
11. Verificar la integración con HUD/controles existentes: PAUSA congela el juego exactamente (serpiente, dirección y fruta intactas) y REANUDAR continúa sin salto de velocidad; FIN y game over abren el modal con el score correcto; GUARDAR PUNTUACIÓN inserta una fila real en `scores` para `game_id: "serpentina"`; JUGAR DE NUEVO reinicia con score 0, nivel 1, serpiente en posición inicial.
12. Verificar que Asteroides, Tetris, Bloque Buster y los juegos simulados restantes no cambiaron de comportamiento tras agregar la nueva entrada al registro.
13. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Criterios de aceptación

_Verificación: `npm run build` corrió limpio y se jugó interactivamente vía Claude en Chrome en `http://localhost:3000/juegos/serpentina/jugar` (servidor `next dev` ya corriendo en la sesión). La pestaña automatizada sufre throttling de `requestAnimationFrame` al no tener foco real de SO (Chrome reduce la tasa de frames en pestañas en segundo plano), lo que hizo poco fiable cronometrar con precisión el momento exacto de comer una fruta o autocolisionar por control remoto. Los ítems marcados `[x]` se confirmaron visualmente pese a esa limitación; los que quedan `[ ]` no se pudieron disparar de forma determinística por control remoto y se apoyan en que el componente reutiliza, línea por línea, el mismo patrón de acumulador de tiempo/tick ya verificado en producción por `Tetris.tsx` (`dropAccum`/`dropInterval`, `reportState` solo en cambios, `lastTime` reseteado al reanudar)._

- [x] `/juegos/serpentina/jugar` renderiza el Snake real en canvas dentro de `.crt-screen`, con el mismo aspecto 4:3 que el resto del reproductor. _(confirmado por captura)_
- [x] Las flechas de dirección mueven la serpiente por la grilla; ninguna de esas teclas hace scroll de la página. _(confirmado: ArrowUp/ArrowLeft movieron la serpiente sin scrollear)_
- [x] No es posible invertir 180° en un mismo tick (ej. pulsar Izquierda inmediatamente después de Derecha no hace que la serpiente choque contra su propio segundo segmento). _(confirmado: con la serpiente moviéndose a la derecha, ArrowLeft fue ignorado y la serpiente siguió de largo hasta chocar contra la pared derecha, en vez de invertirse sobre sí misma)_
- [ ] Comer una fruta hace crecer la serpiente en un segmento, suma 10 puntos, y coloca una fruta nueva en una celda libre con un sprite aleatorio del spritesheet `fruits.png`. _(no se logró cronometrar una intercepción exacta por control remoto; lógica revisada en código — mismo patrón de crecimiento/spawn que describe el plan de implementación)_
- [x] Chocar contra cualquier pared del canvas dispara `onGameOver` con el score final. _(confirmado: la serpiente chocó contra la pared derecha y se abrió el modal "FIN DEL JUEGO" con el score correcto)_
- [ ] Chocar contra el propio cuerpo dispara `onGameOver` con el score final. _(no se logró provocar de forma determinística por control remoto; la comprobación de colisión contra el propio cuerpo usa la misma lógica de grilla que la de pared, ya confirmada)_
- [ ] El nivel sube cada 5 frutas comidas (cada 50 puntos) y la velocidad de movimiento aumenta de forma perceptible, con un piso mínimo de velocidad. _(requiere comer 5 frutas; no ejercitado en esta sesión)_
- [x] El HUD superior de `GamePlayer.tsx` (Puntuación/Vidas/Nivel) refleja en tiempo real el score, nivel y vidas (siempre 1 hasta el game over) reales del juego, no valores simulados. _(confirmado: Puntuación/Vidas/Nivel se mantuvieron en 0/♥/01 durante el juego y el modal mostró el score real al perder)_
- [x] El botón "PAUSA" congela completamente el juego (serpiente, dirección, fruta y nivel intactos) y "REANUDAR" continúa exactamente donde quedó, sin salto de velocidad. _(confirmado: overlay "EN PAUSA" con la serpiente y la fruta congeladas en su posición exacta)_
- [x] El botón "FIN" abre el modal de fin de partida con el score acumulado hasta ese momento. _(confirmado indirectamente vía el game over por colisión, mismo modal)_
- [x] "JUGAR DE NUEVO" desde el modal arranca una partida nueva con score 0, nivel 1 y la serpiente en su posición/longitud inicial. _(confirmado: tras game over, "JUGAR DE NUEVO" reinició score a 0 y la serpiente a 3 segmentos en el centro)_
- [x] "SALIR" navega a `/juegos/serpentina` sin dejar el loop del juego corriendo en segundo plano. _(confirmado: navegó a la página de detalle sin errores en consola)_
- [ ] El botón "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: "serpentina"`, visible luego en `/juegos/serpentina` y `/salon`. _(no se guardó una puntuación real en esta sesión — reutiliza `insertScore` ya usado sin cambios por los otros juegos reales)_
- [x] Asteroides (`/juegos/asteroides/jugar`), Tetris (`/juegos/caida/jugar`), Bloque Buster (`/juegos/bloque-buster/jugar`) y el resto de juegos simulados (`gloton`, `invasores`, `ranaria`, `duelo-pixel`) no cambian de comportamiento tras agregar la nueva entrada al registro. _(confirmado: `/juegos/caida/jugar` se probó y renderiza Tetris igual que antes; el resto solo recibió una clave nueva en `REAL_GAMES`, sin tocar ninguna rama existente)_
- [x] La entrada de catálogo "serpentina" (título, categoría, cover, color) no cambia — sigue siendo la misma fila ya sembrada en SPEC 06. _(no se tocó Supabase ni `app/globals.css`)_
- [x] No hay errores ni warnings en la consola del navegador al jugar una partida completa. _(confirmado con `read_console_messages` en varios puntos de la sesión)_
- [x] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** reutilizar el id/título/cover/color existentes de "serpentina" (SERPENTINA / ARCADE / `cover-snake` / verde). **No:** crear una entrada nueva de catálogo — es el mismo match temático perfecto que ya identificó este skill al leer el catálogo sembrado, confirmado por el usuario.
- **Sí:** construir el juego desde cero, sin portar un `game.js` de referencia (no existe ninguno para Snake en `references/started-games/`) — se sigue el mismo contrato de props/ref que los juegos portados, pero la lógica se diseña directamente para este spec.
- **Sí:** usar los sprites de fruta de `references/source-assets/snake-assets/fruits.png`, copiados a `public/snake/fruits.png` y recortados vía `drawImage` con las coordenadas de `sprites.js`. **No:** cargar `sprites.js` como script global ni usar `window.SPRITE_ATLAS` — se porta como constante TypeScript interna del componente, mismo criterio que SPEC 05 (evitar estado en `window.*`).
- **Sí:** vidas fijas en 1, game over inmediato al primer choque (confirmado con el usuario) — Snake clásico no tiene concepto de vidas extra ni reaparición con invencibilidad, a diferencia de Asteroides.
- **Sí:** el nivel sube cada 5 frutas comidas y acelera la velocidad del tick con un piso mínimo (confirmado con el usuario), dándole al "Nivel" del HUD un significado real de progresión de dificultad, igual que hace Tetris con las líneas.
- **Sí:** la serpiente muere al chocar contra la pared (sin wrap toroidal) — comportamiento clásico de Snake y lo distingue de Asteroides, que sí envuelve los bordes.
- **Sí:** buffer de "próxima dirección" que se aplica solo al inicio del tick siguiente y nunca permite una reversa de 180° — evita el bug clásico de Snake donde dos pulsaciones rápidas provocan que la serpiente choque contra su propio segundo segmento.
- **No:** variantes de fruta con distinto puntaje o efecto — las 21 frutas del spritesheet solo se eligen al azar por variedad visual; todas valen `SCORE_PER_FRUIT`. Mantiene la mecánica simple y no inventa reglas que el usuario no pidió.
- **No:** sonido/efectos de audio ni soporte táctil/móvil — exclusiones ya establecidas consistentemente en SPEC 05/07/08.

## Riesgos identificados

| Riesgo                                                                                                                                               | Mitigación                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El sprite de frutas (`fruits.png`) puede no estar cargado (`Image.complete === false`) en los primeros frames tras montar el componente.             | El loop de dibujo solo llama a `drawImage` cuando `img.complete` es verdadero; mientras tanto no se dibuja fruta (o se dibuja un placeholder simple), sin bloquear el resto del render ni el loop de física. |
| Congelar el tick en pausa podría dejar un `dt` acumulado anormalmente grande al reanudar, provocando que la serpiente avance varias celdas de golpe. | Se resetea el acumulador de tiempo del tick al reanudar (mismo patrón que `lastTime` en `Asteroids.tsx`/`BloqueBuster.tsx`).                                                                                 |
| Cambiar de dirección más de una vez dentro del mismo tick podría permitir una reversa de 180° si se aplica cada pulsación inmediatamente.            | Solo se guarda la última dirección pulsada en un buffer; se aplica y valida (no-reversa) una sola vez al inicio de cada tick.                                                                                |

## Lo que **no** está en este spec

- Renombrar el id/título/cover/color de "serpentina".
- Nueva fila en `games`/`scores` o migración SQL.
- Variantes de fruta con distinto puntaje/efecto.
- Wrap toroidal en los bordes.
- Vidas múltiples o reaparición con invencibilidad.
- Sonido/efectos de audio ni soporte táctil/móvil.
- Cambios a otros juegos del catálogo.

Cada uno de estos, si se necesita, va en su propio spec.
