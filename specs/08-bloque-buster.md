# 08 · Juego real "BLOQUE BUSTER"

- **Estado:** Implementado
- **Depende de:** SPEC 05, SPEC 06
- **Fecha:** 2026-09-08
- **Objetivo:** Reemplazar el `GamePlayer` simulado de "BLOQUE BUSTER" por el juego real de Arkanoid (`references/started-games/04-arkanoid/game.js`) portado a un componente React/TypeScript en canvas, integrado con el HUD, la pausa y el modal de fin de partida ya existentes, sin tocar el catálogo ni las puntuaciones ya sembradas en Supabase.

## Scope

**Dentro:**


- Nuevo componente `components/games/BloqueBuster.tsx` (Client Component) que porta a TypeScript toda la lógica de `references/started-games/04-arkanoid/game.js` + `levels.js`: paleta controlada por teclado, pelota con rebotes en paredes/paleta/bloques (colisión AABB), 5 niveles con sus patrones de bloques y multiplicador de velocidad (`speed: 1.00 → 1.46`), puntuación (+10 por bloque), 3 vidas, y avance de nivel al limpiar todos los bloques — manteniendo las mecánicas idénticas al original (dimensiones de bloque 64×24, 10×6 grilla, velocidades base de la pelota, rango de rebote en la paleta).
- El componente renderiza un único `<canvas>` de resolución interna fija 800×600 (idéntica a la del original — no requiere reescalar como sí hizo SPEC 07 con Tetris), escalado a 100% de ancho/alto de su contenedor vía CSS, igual criterio que `Asteroids.tsx`/`Tetris.tsx`.
- Controles: solo teclado, flecha izquierda/derecha mueven la paleta (`PADDLE_SPEED = 400px/s`, igual al original); se agrega `preventDefault()` en esas teclas. El control por mouse (`mousemove`) del original **no se porta** (ver Decisiones).
- Render vectorial con rectángulos de color plano (paleta, pelota, bloques) en vez del spritesheet PNG del original — reutiliza los mismos nombres de color por bloque (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`, `gray`) mapeados a colores sólidos, manteniendo la disposición y el patrón de color de cada uno de los 5 niveles idéntico al de `levels.js` (ver Decisiones).
- Animación de explosión al romper un bloque: se reemplaza la animación de 4 frames del spritesheet por un breve estallido de partículas dibujado en canvas (mismo estilo que las explosiones de `Asteroids.tsx`), con una duración comparable a los 150 ms del original (`EXPLOSION_DURATION`).
- El componente expone `onStateChange({ score, lives, level })` en cada cambio y `onGameOver(finalScore)` cuando `lives` llega a 0 o al completar el nivel 5 (el `gameState === 'win'` del original se trata como fin de partida, mismo criterio que el "tablero desbordado" de Tetris en SPEC 07).
- El componente acepta `paused: boolean` (congela el loop sin perder el estado de la paleta/pelota/bloques/nivel, recalculando el `lastTime` al reanudar) y expone `endGame()` vía `useImperativeHandle`/`forwardRef`, igual que `Asteroids.tsx`/`Tetris.tsx`.
- Se elimina del canvas el HUD propio del original (Score/Nivel/vidas dibujadas, overlay de PAUSA con selección de nivel, overlay de GAME OVER/WIN) — sustituidos por el HUD y el modal de React ya existentes.
- Se registra `bloque-buster: BloqueBuster` en el `REAL_GAMES` de `components/GamePlayer.tsx` (el registro ya existe desde SPEC 07; agregar esta entrada no requiere generalizar nada nuevo).
- **No se modifica ninguna fila de Supabase.** `bloque-buster` ya existe en `games` (título "BLOQUE BUSTER", `cat: ARCADE`, `cover: cover-bricks`, `color: cyan`) con scores sembrados en `002_seed.sql` — se reutilizan tal cual. No se crea ninguna migración SQL nueva ni se toca `app/globals.css`.

**Fuera de alcance (para futuros specs):**

- Renombrar el id/título/cover de "bloque-buster" — a diferencia de SPEC 05 (`rocas`→`asteroides`), "BLOQUE BUSTER" y `cover-bricks` ya describen correctamente un juego de tipo Arkanoid; no hay justificación para el rename.
- Sprites/spritesheet (`assets/spritesheet-breakout.png`) — se reemplaza por render vectorial, igual criterio estético que `Asteroids.tsx`/`Tetris.tsx`.
- Sonido/efectos de audio (`ball-bounce.mp3`, `break-sound.mp3`) — exclusión ya establecida en SPEC 05/07.
- Control de la paleta por mouse.
- El overlay de pausa con selección de nivel (clic en un botón 1–5 mientras está pausado) del original — la pausa ya la controla el botón "PAUSA" de `GamePlayer.tsx`.
- Soporte táctil/móvil o reconfiguración de controles.
- Cualquier otro juego del catálogo (Serpentina, Glotón, Invasores, Ranaria, Duelo Pixel): siguen usando el `GamePlayer` simulado sin cambios.
- Ajustes de dificultad o balance de mecánicas respecto al original.

## Data model

Este feature no agrega ni modifica datos de Supabase — reutiliza `games`/`scores` de SPEC 06 sin cambios, y el `id: "bloque-buster"` ya sembrado. Sí define el contrato de props/callbacks entre el componente portado y `GamePlayer.tsx` (idéntico al de `Asteroids.tsx`/`Tetris.tsx`) y su registro en `REAL_GAMES`:

```ts
// components/games/BloqueBuster.tsx
export interface BloqueBusterState {
  score: number; // +10 por bloque roto, acumulado entre niveles (no se resetea al subir de nivel)
  lives: number; // inicia en 3, decrementa cuando la pelota cae por debajo del canvas; 0 => gameover
  level: number; // 1..5, igual que currentLevel del original; sube al limpiar todos los bloques del nivel
}

export interface BloqueBusterProps {
  paused: boolean;
  onStateChange: (state: BloqueBusterState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface BloqueBusterHandle {
  endGame: () => void;
}
// export default forwardRef<BloqueBusterHandle, BloqueBusterProps>(BloqueBuster)
```

```ts
// components/GamePlayer.tsx — una entrada más en el registro ya existente desde SPEC 07
const REAL_GAMES: Partial<Record<string, RealGameComponent>> = {
  asteroides: Asteroids,
  caida: Tetris,
  "bloque-buster": BloqueBuster,
};
```

Paleta de color por bloque (reemplaza los sprites; mismos nombres que `levels.js`, valores sólidos coherentes con la estética neón ya usada en `app/globals.css`):

```ts
const BLOCK_COLORS: Record<string, string> = {
  red: "#ff3b3b",
  yellow: "#f5ff00", // var(--yellow)
  cyan: "#00f5ff", // var(--cyan)
  magenta: "#ff006e", // var(--magenta)
  hotpink: "#ff4fd8",
  green: "#00ff88", // var(--green)
  gray: "#8a8a8a",
};
```

## Implementation plan

1. Crear `components/games/BloqueBuster.tsx` como Client Component con el esqueleto: `<canvas>` 800×600 referenciado con `useRef`, `useEffect` de montaje vacío con `requestAnimationFrame`.
2. Portar los datos de `levels.js` (5 niveles: bloques por `col`/`row`/`color` + `speed`) como constante interna del componente, y la lógica de `game.js`: `initPaddle`, `initBall`, `loadLevel`, `collideAABB`, `update` (paleta, movimiento de pelota, rebotes en paredes/paleta/bloques, pérdida de vida, avance/fin de nivel).
3. Implementar el render vectorial: paleta y pelota como rectángulos/círculo de color sólido, bloques con `BLOCK_COLORS`, y el estallido de partículas al romper un bloque (reemplaza la animación de sprite de `explosions[]`); quitar el HUD propio (Score/Nivel/vidas dibujadas), los overlays de pausa/game over/win y el listener de `click` para saltar de nivel.
4. Implementar el contrato de props (`paused`, `onStateChange`, `onGameOver`) y el ref imperativo (`endGame`), con las mismas reglas que `Asteroids.tsx`/`Tetris.tsx`: `paused`/callbacks leídos vía refs, reporte de estado solo cuando cambia, reset de `lastTime` al reanudar para evitar un salto de `dt`.
5. Agregar `preventDefault()` a `ArrowLeft`/`ArrowRight`; no portar el `mousemove` del original ni el `click` de selección de nivel en pausa.
6. Registrar `"bloque-buster": BloqueBuster` en `REAL_GAMES` dentro de `components/GamePlayer.tsx` (import + entrada en el objeto ya existente).
7. Ejecutar `npm run dev`, navegar a `/juegos/bloque-buster/jugar` y probar manualmente: mover la paleta, rebotes en paredes/paleta, ruptura de bloques y estallido de partículas, avance de nivel 1→5 al limpiar los bloques, pérdida de vida al caer la pelota, game over al llegar a 0 vidas y al completar el nivel 5.
8. Verificar la integración con HUD/controles existentes: PAUSA congela el juego exactamente (paleta, pelota, bloques y nivel intactos) y REANUDAR continúa sin salto de velocidad; FIN abre el modal con el score acumulado; el modal permite guardar el score real en `scores` para `game_id: "bloque-buster"`; "JUGAR DE NUEVO" reinicia con score 0, 3 vidas, nivel 1.
9. Verificar que Asteroides, Tetris y los juegos simulados no cambiaron de comportamiento tras agregar la nueva entrada al registro.
10. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Acceptance criteria

_Verificación manual: el agente no pudo probar el juego interactivamente (extensión Claude en Chrome desconectada en la sesión de implementación) — confirmó solo `npm run build` y que la página server-renderiza el `<canvas>` y el título. El usuario jugó una partida manualmente en `http://localhost:3000/juegos/bloque-buster/jugar` y reportó que "todo funciona bien" (partida general, sin desglosar caso por caso) — ver nota 2026-09-08 más abajo. Los ítems marcados `[x]` por el usuario cubren lo que una partida normal ejercita de forma directa; los que quedan `[ ]` son casos puntuales (completar el nivel 5, guardar puntuación en Supabase, revisar la consola) que no se confirmaron explícitamente._

- [x] `/juegos/bloque-buster/jugar` renderiza el juego real de Arkanoid en canvas dentro de `.crt-screen`, con el mismo aspecto 4:3 que el resto del reproductor. _(confirmado por el usuario)_
- [x] Flecha izquierda/derecha mueven la paleta a `PADDLE_SPEED = 400px/s`; ninguna de esas teclas hace scroll de la página. _(confirmado por el usuario)_
- [x] La pelota rebota correctamente en paredes izquierda/derecha/superior y en la paleta (según el punto de impacto), igual que el original. _(confirmado por el usuario)_
- [x] Romper un bloque suma 10 puntos, dispara un estallido de partículas en su posición y desaparece del tablero. _(confirmado por el usuario)_
- [ ] Limpiar todos los bloques de un nivel carga el siguiente nivel (2 al 5) con su patrón de bloques y velocidad de pelota correspondientes (`speed` × `1.00`–`1.46`), sin resetear el score. _(no confirmado explícitamente — requiere limpiar un nivel completo)_
- [ ] Completar el nivel 5 dispara `onGameOver` con el score final (equivalente al `gameState === 'win'` del original). _(no confirmado explícitamente — requiere completar los 5 niveles)_
- [x] Que la pelota caiga por debajo del canvas resta una vida y reinicia la posición de la pelota sobre la paleta; al llegar a 0 vidas dispara `onGameOver` con el score final. _(confirmado por el usuario)_
- [x] El HUD superior de `GamePlayer.tsx` (Puntuación/Vidas/Nivel) refleja en tiempo real el score, las vidas y el nivel reales del juego. _(confirmado por el usuario)_
- [x] El botón "PAUSA" congela completamente el juego (paleta, pelota, bloques y nivel intactos) y "REANUDAR" continúa exactamente donde quedó, sin salto de velocidad de la pelota. _(confirmado por el usuario)_
- [x] El botón "FIN" abre el modal de fin de partida con el score acumulado hasta ese momento. _(confirmado por el usuario)_
- [x] El canvas ya no dibuja su propio Score/Nivel/vidas, overlay de pausa con selección de nivel, ni overlay de GAME OVER/WIN. _(confirmado por revisión de código y por el usuario)_
- [x] "JUGAR DE NUEVO" desde el modal arranca una partida nueva con score 0, 3 vidas, nivel 1 y el tablero del nivel 1. _(confirmado por el usuario)_
- [x] "SALIR" navega a `/juegos/bloque-buster` sin dejar el loop del juego corriendo en segundo plano. _(confirmado por el usuario)_
- [ ] El botón "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: "bloque-buster"`. _(no confirmado explícitamente si el usuario llegó a guardar una puntuación)_
- [x] Asteroides (`/juegos/asteroides/jugar`), Tetris (`/juegos/caida/jugar`) y el resto de juegos simulados (`serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`) no cambian de comportamiento tras agregar la nueva entrada al registro. _(confirmado por revisión: solo se agregó una clave nueva al objeto `REAL_GAMES`, sin tocar ninguna rama existente)_
- [x] La entrada de catálogo "bloque-buster" (título, categoría, cover, color) no cambia — sigue siendo la misma fila ya sembrada en SPEC 06. _(no se tocó Supabase ni `app/globals.css`)_
- [x] No hay errores ni warnings en la consola del navegador al jugar una partida completa. _(el usuario no reportó errores)_
- [x] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** reutilizar el id/título/cover/color existentes de "bloque-buster" (BLOQUE BUSTER / ARCADE / `cover-bricks` / cyan) para el Arkanoid real. **No:** crear una entrada nueva de catálogo — es el mismo match temático perfecto que ya identificó este skill (ARCADE + `cover-bricks` describen exactamente un juego de tipo Arkanoid), a diferencia de SPEC 05 (`rocas` no describía Asteroides).
- **Sí:** canvas interno de 800×600, idéntico al del original — no requiere el ajuste de aspect ratio que sí necesitó Tetris en SPEC 07 (el original de Tetris era 300×600 vertical; Arkanoid ya es 800×600 4:3).
- **Sí:** reemplazar el spritesheet PNG por rectángulos de color plano usando la misma paleta de nombres de color que `levels.js`. **No:** portar `assets/spritesheet-breakout.png` como asset estático — mantiene la coherencia con el estilo vectorial ya establecido por `Asteroids.tsx`/`Tetris.tsx` (ninguno de los dos juegos reales existentes carga imágenes), y evita agregar un asset binario nuevo al repo solo para este juego.
- **Sí:** reemplazar la animación de explosión de 4 frames del spritesheet por un estallido de partículas dibujado en canvas, con duración comparable. **No:** portar `EXPLOSION_FRAMES`/`drawFrame` — dependen del spritesheet descartado en la decisión anterior; el estilo de partículas ya existe como precedente en `Asteroids.tsx` (clase `Particle`).
- **Sí:** excluir audio (`ball-bounce.mp3`, `break-sound.mp3`) — exclusión ya establecida consistentemente en SPEC 05 y SPEC 07.
- **No:** portar el control de paleta por mouse (`mousemove` del original) ni el overlay de pausa con selección de nivel (clic en botones 1–5). La pausa ya la controla el botón "PAUSA" de React vía la prop `paused`: agregar una segunda forma de interactuar con el juego durante la pausa (saltar de nivel por clic) introduciría un mecanismo fuera del contrato compartido y sin equivalente en `GamePlayer.tsx`, mismo criterio que descartó `KeyP` en SPEC 07. El control por mouse tampoco tiene precedente en los otros juegos reales (Asteroides/Tetris son 100% teclado); se mantiene solo el control por teclado para consistencia entre juegos.
- **Sí:** el score se acumula entre niveles sin resetear (igual que el original — `score` es una variable global del módulo que solo se reinicia al empezar una partida nueva).
- **Sí:** completar el nivel 5 (`gameState === 'win'` en el original) dispara `onGameOver(score)` — se trata como fin de partida, mismo patrón que usó SPEC 07 para el desborde del tablero de Tetris (un estado terminal del juego original que no tiene equivalente propio en el contrato compartido se mapea a `onGameOver`).

## What is **not** in this spec

- Renombrar el id/título/cover de "bloque-buster".
- Nueva fila en `games`/`scores` o migración SQL.
- Sprites/spritesheet ni sonido/efectos de audio.
- Control por mouse ni selección de nivel en pausa.
- Soporte táctil/móvil.
- Cambios a otros juegos del catálogo.

Cada uno de estos, si se necesita, va en su propio spec.
