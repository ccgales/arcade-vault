# GAME JAM "FLOGGER: CRUZA LA CARRETERA Y EL RÍO SIN CONVERTIRTE EN PAPILLA" · FLOGGER · 02 · Implementación

- **Estado:** Borrador
- **Depende de:** 01-diseno.md, SPEC 05, SPEC 06
- **Fecha:** 2026-09-15
- **Objetivo:** Definir cómo se construye `components/games/Flogger.tsx` desde cero, cómo se registra en `REAL_GAMES` y qué entrada nueva de catálogo (fila en `games`, clase `.cover-flogger`, migración `003_add_flogger.sql`) necesita FLOGGER para quedar jugable en `/juegos/flogger/jugar`.

## Alcance

**Dentro:**

- Nuevo componente `components/games/Flogger.tsx` (Client Component) con toda la lógica descrita en `01-diseno.md`: tablero de 16×12 celdas de 50px sobre un `<canvas>` de resolución interna fija 800×600 escalado por CSS al 100% de su contenedor, cuatro carriles de tráfico, cinco franjas de río con troncos y tortugas (algunas sumergibles), mediana y acera seguras, cinco nenúfares de meta, tres vidas y temporizador por intento.
- Contrato compartido de los juegos reales: `FloggerState`/`FloggerProps`/`FloggerHandle`, `forwardRef` + `useImperativeHandle`, prop `paused`, callbacks `onStateChange`/`onGameOver` — mismo patrón que `Asteroids.tsx`/`Tetris.tsx`/`BloqueBuster.tsx`/`Snake.tsx`.
- Entrada `flogger: Flogger` en el registro `REAL_GAMES` de `components/GamePlayer.tsx` (el registro ya es genérico desde SPEC 07/08; esta es una clave más, sin refactor).
- **Entrada nueva de catálogo**: fila nueva en `games` vía la migración `supabase/sql/003_add_flogger.sql` (siguiente número libre: hoy solo existen `001` y `002`), con ~12 scores de ejemplo.
- Clase de cover CSS-only `.cover-flogger` nueva en `app/globals.css`, siguiendo el patrón `.cover-asteroides` (`::before`/`::after` con gradientes, sin imágenes).
- Render 100% vectorial: sin sprites, sin assets binarios, sin audio, sin red.

**Fuera de alcance (para futuros specs):**

- Modificar cualquier fila ya sembrada en `002_seed.sql`, incluida `ranaria`. Las migraciones SQL son append-only (regla de `CLAUDE.md`).
- Reslotear `ranaria`, `gloton`, `invasores` o `duelo-pixel`.
- Los elementos de diseño ya excluidos en `01-diseno.md` (cocodrilos, serpientes, mosca-bonus, rana rival, vidas extra).
- Sprites/assets, audio, soporte táctil/móvil, reconfiguración de controles.
- Tocar cualquier otro componente de `components/games/`, `lib/`, o las rutas de `app/` más allá de la clase de cover en `app/globals.css`.
- Ejecutar la migración: la convención del repo es correrla manualmente en el SQL Editor del dashboard de Supabase.

## Modelo de datos

### Contrato del componente

```ts
// components/games/Flogger.tsx
export interface FloggerState {
  score: number; // filas nuevas + nenúfares + bonus de tiempo + bonus de ronda
  lives: number; // empieza en 3; baja por atropello, agua, arrastre, meta inválida o tiempo agotado
  level: number; // ronda actual; sube al ocupar los 5 nenúfares
}

export interface FloggerProps {
  paused: boolean;
  onStateChange: (state: FloggerState) => void;
  onGameOver: (finalScore: number) => void;
}

export interface FloggerHandle {
  endGame: () => void;
}
// export default forwardRef<FloggerHandle, FloggerProps>(Flogger)
```

```ts
// components/GamePlayer.tsx — una entrada más en el registro ya existente
const REAL_GAMES: Partial<Record<string, RealGameComponent>> = {
  asteroides: Asteroids,
  caida: Tetris,
  "bloque-buster": BloqueBuster,
  serpentina: Snake,
  flogger: Flogger,
};
```

### Constantes internas de `Flogger.tsx`

```ts
const COLS = 16;
const ROWS = 12;
const CELL = 50; // 16*50=800, 12*50=600 → mismo canvas 800x600 que el resto de juegos reales
const GOAL_ROW = 0;
const RIVER_ROWS = [1, 2, 3, 4, 5];
const MEDIAN_ROW = 6;
const ROAD_ROWS = [7, 8, 9, 10];
const START_ROW = 11;
const GOAL_SLOTS = 5; // columnas fijas de nenúfar en la fila 0
const START_LIVES = 3;
const TIME_LIMIT_MS = 30000; // por intento; se reinicia al morir y al ocupar un nenúfar
const JUMP_COOLDOWN_MS = 120; // evita ráfagas por key-repeat del sistema operativo
const JUMP_ANIM_MS = 90; // solo animación; la lógica es discreta por celda
const SCORE_PER_ROW = 10; // fila nueva alcanzada, una sola vez por intento
const SCORE_PER_GOAL = 100;
const SCORE_PER_SECOND_LEFT = 5;
const SCORE_ROUND_BONUS = 500;
const SPEED_FACTOR_PER_LEVEL = 0.12;
const MAX_SPEED_FACTOR = 2.2;
const MAX_SINKABLE_LANES = 3;
```

### Estructuras internas

```ts
type LaneKind = "road" | "river";

interface Lane {
  row: number;
  kind: LaneKind;
  dir: 1 | -1; // direcciones alternas entre carriles contiguos
  baseSpeed: number; // px/s en nivel 1; se multiplica por el factor de nivel
  spanCells: number; // largo del vehículo / tronco / grupo de tortugas
  gapCells: number; // separación entre obstáculos consecutivos
  sinkable: boolean; // solo river: el grupo de tortugas se hunde por ciclos
  sinkPhase: number; // offset del ciclo emergida → parpadeando → sumergida
}

interface Mover {
  lane: number; // índice en el array de Lane
  x: number; // px, posición continua; envuelve por el borde opuesto
}

interface Frog {
  row: number;
  x: number; // px; encajado a la grilla en tierra, continuo montado en el río
  ridingLane: number | null; // índice de la franja que la arrastra, o null
  jumpFrom: { row: number; x: number } | null; // solo para la animación
  jumpElapsedMs: number;
}
```

- El estado vivo del juego (ranas, movers, nenúfares ocupados, temporizador, acumuladores) vive en un `useRef` de objeto mutable, no en `useState`: igual que el resto de juegos reales, `useState` solo se usaría para forzar re-render, y aquí no hace falta porque todo se dibuja en canvas.
- `paused` y los callbacks se leen a través de refs dentro del loop, y `onStateChange` se invoca solo cuando alguno de los tres campos cambia (mismo patrón ya en producción en `Tetris.tsx`).

### Fila nueva en `games`

```sql
insert into games (id, title, short, long, cat, cover, color) values
  ('flogger', 'FLOGGER', 'Cruza la carretera y el río sin convertirte en papilla.', 'Cuatro carriles de tráfico neón y cinco franjas de río te separan de los nenúfares. Monta troncos y tortugas que se hunden sin aviso, y no te quedes quieto: el reloj corre en cada intento. Llena los cinco nenúfares para pasar de ronda.', 'ARCADE', 'cover-flogger', 'magenta');
```

- `cat: 'ARCADE'` es una de las `CATS` de `lib/data.ts` (`TODOS` es solo filtro de UI, nunca un valor de columna).
- `color: 'magenta'` cumple el `check (color in ('cyan','magenta','yellow','green'))` de `001_games_and_scores.sql`, y evita el `green` ya usado por `ranaria`/`serpentina`/`invasores`.
- `id: 'flogger'` no existe en `002_seed.sql` ni en ninguna migración `00N_add_*.sql` (hoy no hay ninguna).

### Migración `supabase/sql/003_add_flogger.sql`

- Contiene el `insert into games (...)` de arriba más un `insert into scores (game_id, player_name, score, created_at) values ...` con 12 filas de ejemplo, en el mismo estilo de `002_seed.sql`: nombres del pool ya existente (`PX_KAI`, `NEONFOX`, `Z3R0COOL`, `M00NRYU`, `VAULT_07`, `GLITCHA`, `ATARI_KID`, `CYBER_LU`, `MAGENTA88`, `SCANLINE`, `BIT_LORD`, `ARKADYA`), puntuaciones decrecientes en un rango coherente con la escala de puntos de este juego (aprox. 19.400 → 6.800) y fechas escalonadas entre junio y agosto de 2026.
- Se ejecuta manualmente en el SQL Editor del dashboard de Supabase, después de `002_seed.sql`. No se edita ningún archivo `001`/`002` (append-only).

### Boceto de la clase `.cover-flogger`

- Patrón `.cover-asteroides`: un `background` de base en el elemento, un `::after` con las capas de gradiente, y un `::before` con el "personaje" como glifo de texto. Sin imágenes.
- Base: `linear-gradient` vertical que va de azul-cian oscuro arriba (río) a gris muy oscuro abajo (carretera).
- `::after`: un `repeating-linear-gradient` horizontal de franjas para sugerir carriles; sobre la mitad inferior, dos o tres `linear-gradient` cortos en magenta y amarillo a distintas alturas y desplazamientos horizontales, que leen como vehículos; sobre la mitad superior, dos rectángulos ámbar alargados que leen como troncos.
- `::before`: un glifo verde centrado-bajo con `text-shadow` de neón, a modo de rana, igual que el `▲` de `.cover-asteroides`.
- El nombre `cover-flogger` está libre: las clases `.cover-*` hoy existentes en `app/globals.css` son `bricks`, `tetro`, `snake`, `glot`, `invaders`, `asteroides`, `rana` y `duelo`.

## Plan de implementación

Cada paso deja el repo compilando y navegable.

1. Crear `components/games/Flogger.tsx` como Client Component con el esqueleto mínimo: `<canvas>` 800×600 referenciado con `useRef`, estilado al 100%/100% de su contenedor igual que el resto de juegos reales, un `useEffect` de montaje que arranca y cancela un `requestAnimationFrame` y solo pinta el fondo (bandas de carretera, río, mediana, acera y orilla de meta).
2. Definir las constantes y los tipos del Modelo de datos, y la tabla de `Lane` inicial (cuatro carriles de carretera + cinco franjas de río, direcciones alternas, velocidades y largos base). Poblar los `Mover` de cada franja repartidos con su `gapCells`, y dibujarlos ya moviéndose con envoltura por el borde opuesto.
3. Implementar la rana: posición por celda, animación de salto interpolada, bloqueo de saltos fuera del tablero, y la cola de entrada de teclado (`ArrowUp/Down/Left/Right` + `W/A/S/D`) con `preventDefault()` en las flechas y el tiempo de recarga `JUMP_COOLDOWN_MS`. Listeners atados a `window` dentro del mismo `useEffect` de montaje y removidos en su cleanup.
4. Implementar las colisiones de carretera: solapamiento de la caja de la rana con cualquier `Mover` de una fila `road` → muerte.
5. Implementar el río: detección de la franja bajo la rana, enganche a un `Mover` (`ridingLane`), arrastre con posición horizontal continua, muerte por agua sin soporte y muerte por arrastre fuera del canvas.
6. Implementar el ciclo de tortugas sumergibles (emergida → parpadeando → sumergida, con `sinkPhase` por franja) y la muerte por permanecer sobre una tortuga sumergida.
7. Implementar la fila de meta: cinco nenúfares en columnas fijas, ocupación única por ronda, muerte al saltar a la orilla o a un nenúfar ocupado, retorno a la salida al ocupar uno.
8. Implementar vidas, muerte y reaparición: `START_LIVES`, reinicio de la rana y del temporizador tras cada muerte, conservación de los nenúfares ocupados, y `onGameOver(score)` al agotar la última vida.
9. Implementar el temporizador por intento y su barra en la base del canvas, incluido el cambio de color al agotarse y la pérdida de vida al llegar a cero.
10. Implementar la puntuación completa: fila nueva alcanzada una sola vez por intento (marca de fila máxima que se resetea en cada muerte y en cada nenúfar), nenúfar, bonus de segundos restantes y bonus de ronda.
11. Implementar la subida de nivel: al ocupar el quinto nenúfar, vaciar nenúfares, subir `level`, recalcular el factor de velocidad (con techo `MAX_SPEED_FACTOR`), reducir huecos, acortar troncos y tortugas, y activar una franja sumergible más hasta `MAX_SINKABLE_LANES`.
12. Implementar el contrato de props y el ref imperativo: `paused` leído por ref (congelando el loop y reseteando `lastTime` al reanudar), `onStateChange` solo cuando cambian `score`/`lives`/`level`, y `endGame()` vía `useImperativeHandle`.
13. Añadir la clase `.cover-flogger` a `app/globals.css` siguiendo el boceto del Modelo de datos.
14. Crear `supabase/sql/003_add_flogger.sql` con el `insert into games` y las 12 filas de `scores`, y ejecutarlo manualmente en el SQL Editor del dashboard de Supabase.
15. Registrar `flogger: Flogger` en `REAL_GAMES` dentro de `components/GamePlayer.tsx` (import + una clave más en el objeto existente).
16. Ejecutar `npm run dev` y verificar manualmente en `/juegos/flogger/jugar`: saltos en las cuatro direcciones sin scroll de página, muerte por vehículo, arrastre correcto sobre tronco y tortuga, ahogamiento al hundirse la tortuga, muerte por arrastre fuera de pantalla, ocupación de los cinco nenúfares, subida de nivel con aceleración perceptible, temporizador que cuesta una vida al agotarse, y fin de partida al perder la tercera vida.
17. Verificar la integración con el reproductor: HUD con score/vidas/nivel reales, PAUSA congelando exactamente, REANUDAR sin salto de velocidad, FIN y game over abriendo el modal con el score correcto, GUARDAR PUNTUACIÓN insertando en `scores` con `game_id: "flogger"`, y la ficha visible en `/biblioteca`, `/juegos/flogger` y `/salon` con su cover.
18. Verificar que Asteroides, Caída, Bloque Buster, Serpentina y los cuatro juegos simulados no cambiaron de comportamiento.
19. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Criterios de aceptación

- [ ] `/juegos/flogger/jugar` renderiza el juego real en canvas dentro de `.crt-screen`, con el mismo aspecto 4:3 que el resto del reproductor.
- [ ] Las flechas y `W`/`A`/`S`/`D` mueven la rana una celda por pulsación; ninguna de esas teclas hace scroll de la página.
- [ ] La repetición automática de teclas del sistema operativo no produce ráfagas de saltos incontrolables.
- [ ] Tocar un vehículo en cualquiera de los cuatro carriles cuesta exactamente una vida y devuelve la rana a la acera de salida.
- [ ] Caer al agua sin tronco ni tortuga emergida cuesta una vida.
- [ ] Sobre un tronco o una tortuga emergida, la rana se desplaza con él a su misma velocidad y dirección.
- [ ] Ser arrastrado fuera del borde del canvas montado en un tronco o tortuga cuesta una vida.
- [ ] Una tortuga sumergible avisa (parpadeo) antes de hundirse, y quedarse encima cuando se hunde cuesta una vida.
- [ ] Saltar a un nenúfar libre lo ocupa, suma 100 puntos más el bonus de segundos restantes, y devuelve la rana a la salida.
- [ ] Saltar a la orilla entre nenúfares o a un nenúfar ya ocupado cuesta una vida.
- [ ] Los nenúfares ya ocupados no se vacían al perder una vida, y sí se vacían al completar la ronda.
- [ ] Completar los cinco nenúfares suma el bonus de ronda, sube el nivel y aumenta de forma perceptible la velocidad y la densidad de obstáculos.
- [ ] Agotar el temporizador del intento cuesta una vida; la barra de tiempo se reinicia en cada intento nuevo.
- [ ] Avanzar a una fila nueva suma 10 puntos una sola vez por intento: bajar y volver a subir no vuelve a puntuar.
- [ ] El HUD superior de `GamePlayer.tsx` (Puntuación/Vidas/Nivel) refleja el estado real del juego, no valores simulados, y las vidas bajan de 3 a 0 a lo largo de la partida.
- [ ] El botón "PAUSA" congela exactamente el juego (vehículos, troncos, tortugas, rana y temporizador intactos) y "REANUDAR" continúa sin salto de velocidad ni pérdida de tiempo.
- [ ] El botón "FIN" abre el modal de fin de partida con el score acumulado hasta ese momento.
- [ ] Perder la tercera vida abre el modal de fin de partida con el score final correcto.
- [ ] "GUARDAR PUNTUACIÓN" inserta una fila real en `scores` con `game_id: "flogger"`, visible luego en `/juegos/flogger` y `/salon`.
- [ ] "JUGAR DE NUEVO" reinicia con score 0, nivel 1, 3 vidas, nenúfares vacíos y la rana en la acera de salida.
- [ ] La ficha de FLOGGER aparece en `/biblioteca` con su cover `.cover-flogger` renderizado y responde al filtro ARCADE.
- [ ] Asteroides, Caída, Bloque Buster, Serpentina y los juegos simulados (`gloton`, `invasores`, `ranaria`, `duelo-pixel`) no cambian de comportamiento.
- [ ] No hay errores ni warnings en la consola del navegador durante una partida completa.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** entrada **nueva** de catálogo (`flogger`) con su propia fila en `games`, su clase `.cover-flogger` y la migración `003_add_flogger.sql`. **No:** reslotear `ranaria`, aunque comparte exactamente la mecánica: la sugerencia S-003 de `references/game-suggestions-todo.md` propone precisamente ese reslot, el usuario conoce el solapamiento y decidió mantenerlo. **Consecuencia asumida:** quedarán dos juegos de cruzar carretera/río en el catálogo — `flogger` real y `ranaria` simulado — y `ranaria` queda libre para que `game-planner` lo reasigne a otra mecánica en el futuro. Los reslots de entradas simuladas son competencia de `game-planner`, no de un jam temático.
- **Sí:** canvas de resolución interna fija 800×600 escalado por CSS, idéntico al de los cuatro juegos reales — el tablero de 16×12 celdas de 50px encaja exacto sin aritmética fraccionaria.
- **Sí:** solo teclado, con `preventDefault()` en las flechas. **No:** mouse ni soporte táctil — exclusión consistente con SPEC 05/07/08/09.
- **Sí:** sin audio. **No:** efectos de salto/atropello/chapuzón, por la misma exclusión establecida desde SPEC 05.
- **Sí:** render vectorial sin assets nuevos, mismo criterio que SPEC 08 tomó al descartar el spritesheet de Arkanoid. `references/source-assets/` solo tiene `snake-assets` (frutas), que no aporta nada a este juego, y `references/started-games/` no contiene ninguna fuente portable de Frogger — el juego se construye desde cero, igual que Snake en SPEC 09.
- **Sí:** migración numerada `003_add_flogger.sql` nueva, ejecutada a mano en el SQL Editor. **No:** editar `002_seed.sql` para añadir la fila — las migraciones son append-only por regla de `CLAUDE.md`.
- **Sí:** `color: 'magenta'`, distinto del `green` de `ranaria`/`serpentina`/`invasores`, para que los dos juegos de rana no se confundan en la biblioteca.
- **Sí:** el estado del juego vive en un `useRef` mutable y el canvas es la única superficie de dibujo del juego. **No:** reflejar el estado del juego en `useState` por frame, que forzaría re-renders de React 60 veces por segundo — mismo criterio que los cuatro juegos reales.
- **Sí:** posición horizontal continua (píxeles) mientras la rana está montada, y encajada a la grilla mientras está en tierra. **No:** mover la rana por celdas también en el río, que haría imposible representar el arrastre suave del tronco y produciría saltos visuales.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                  | Mitigación                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Al saltar entre dos troncos, un redondeo desafortunado puede dejar a la rana "en el borde" y matarla pese a que visualmente está sobre el tronco.                                                       | La detección de soporte usa el centro de la rana contra la caja del `Mover`, no el solapamiento de cajas completas, y se aplica un margen de tolerancia de unos pocos píxeles a favor del jugador.                                         |
| El generador de franjas puede producir, en un nivel alto, una combinación en la que no existe ninguna ventana cruzable (vehículos alineados o troncos demasiado separados para el alcance de un salto). | Los `gapCells` tienen un mínimo por tipo de franja, las direcciones alternan siempre entre filas contiguas, y la separación máxima entre troncos consecutivos nunca supera una celda de salto; el techo `MAX_SPEED_FACTOR` acota el resto. |
| Con el factor de velocidad alto, un `Mover` rápido podría atravesar la celda de la rana dentro de un mismo frame y no registrar la colisión (tunelado).                                                 | La colisión de carretera se evalúa contra el segmento barrido por el `Mover` en ese frame (posición anterior → posición nueva), no solo contra su posición final.                                                                          |
| El temporizador por intento es un estado extra que la pausa debe congelar, y a diferencia del movimiento no se nota a simple vista si sigue corriendo de fondo.                                         | El temporizador se descuenta desde el mismo `dt` del loop que ya se congela con `paused`, nunca desde `Date.now()` ni un `setInterval` propio; el criterio de aceptación de PAUSA incluye explícitamente la barra de tiempo.               |
| Dos juegos de cruzar carretera (`flogger` real y `ranaria` simulado) conviven en la biblioteca y pueden confundir al visitante.                                                                         | Color de ficha distinto (`magenta` vs `green`), cover con lenguaje visual distinto, y `ranaria` queda marcado en la cola de `game-planner` para reasignarse a otra mecánica; la consecuencia está aceptada explícitamente por el usuario.  |

## Lo que **no** está en este spec

- Reslotear `ranaria` o cualquier otra entrada simulada.
- Editar `001_games_and_scores.sql` o `002_seed.sql`.
- Ejecutar la migración `003_add_flogger.sql` por CLI o MCP en lugar del SQL Editor.
- Sprites, assets binarios y audio.
- Soporte táctil/móvil o reconfiguración de controles.
- Cocodrilos, serpientes, mosca-bonus, rana rival y vidas extra.
- Cambios a cualquier otro juego del catálogo.

Cada uno de estos, si se necesita, va en su propio spec.
