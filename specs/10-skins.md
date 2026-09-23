# 10 · Skins de juego (`clasico` / `neon` / `retro`)

- **Estado:** En revisión
- **Depende de:** SPEC 05, SPEC 07, SPEC 08, SPEC 09
- **Fecha:** 2026-09-17
- **Objetivo:** Introducir tres paletas seleccionables (`clasico`, `neon`, `retro`) para los juegos reales del catálogo, con la infraestructura compartida (`lib/skins.ts`, prop `skin`, `SkinPicker`, persistencia) y la primera implementación aplicada únicamente a Asteroides.

## Por qué existe este spec

Los cuatro juegos reales dibujan hoy sus colores como literales sueltos dentro de su `draw()` (`"#fff"`, `"#0ff"`, `BLOCK_COLORS`, …). No hay forma de cambiar el aspecto de una partida sin editar el componente, y no hay un vocabulario de color compartido entre juegos: Asteroides usa `#0ff` para el power-up mientras la plataforma usa `--cyan: #00f5ff` para todo lo demás.

**Esto no es el toggle claro/oscuro que SPEC 07 descartó.** SPEC 07 dejó fuera `localStorage('tetris-theme')` con el argumento de que "la plataforma ya tiene su propio tema visual (CRT neón)" y de que "la plataforma no tiene modo claro". Ese argumento sigue vigente y este spec no lo contradice: aquí no se agrega un modo claro ni se toca `:root`. Las tres skins son **tres paletas oscuras dentro del mismo CRT**, pensadas para verse sobre el mismo fondo negro, las mismas scanlines y la misma viñeta de `.crt-screen`. Lo que SPEC 07 rechazó era un segundo tema de página compitiendo con el tema de la app; lo que este spec añade es un ajuste de paleta **dentro del área de juego**, sin salir del CRT.

## Scope

**Dentro:**

- Nuevo `lib/skins.ts`: fuente de verdad del color de los juegos. Define `SKIN_IDS`/`SkinId`, `DEFAULT_SKIN`, `SKIN_LABELS`, la interfaz `AsteroidsSkin`, el `Record<SkinId, AsteroidsSkin>` de Asteroides y el helper `hasSkins(gameId)`. No contiene lógica de juego ni de render.
- `components/games/Asteroids.tsx`: acepta la prop `skin: SkinId` y sustituye **solo** sus expresiones de color, `shadowBlur`/`shadowColor`, `lineWidth` y `font` por lecturas de la paleta. Las clases de módulo (`Bullet`, `Asteroid`, `Ship`, `PowerUp`, `Particle`) reciben la paleta como segundo argumento de `draw(ctx, skin)`.
- `components/GamePlayer.tsx`: añade `skin` al tipo `RealGameProps`, mantiene el estado `skin` (con persistencia), lo pasa al juego real montado y renderiza `SkinPicker` dentro de `.hud-actions`. No cambia su HUD, su modal, su `resetKey` ni el registro `REAL_GAMES`.
- Nuevo `components/SkinPicker.tsx`: tres chips (`CLÁSICO`/`NEÓN`/`RETRO`) bajo una etiqueta `TUBO`, más su bloque CSS al final de `app/globals.css` (`.skin-picker`, `.skin-chip`, `.skin-chip.active`, `.skin-swatch`). Se renderiza solo cuando `hasSkins(game.id)` es `true`.
- Persistencia de la selección en `localStorage` bajo la clave versionada `av:skin:v1`, global a la plataforma (no por juego).
- Paletas `clasico`, `neon` y `retro` para Asteroides, con las mediciones de contraste WCAG que las justifican (ver "Contraste sobre el CRT").
- Registro del estado en `references/games-with-themes.md` (matriz juego × skin + evidencia de contraste).

**Fuera de alcance (para futuros specs / futuras corridas):**

- Las paletas de `caida` (Tetris), `bloque-buster` y `serpentina`. Cada una es una corrida propia de `skin-designer`, que **añade** su constante a `lib/skins.ts` sin tocar las demás. Este spec deja la infraestructura lista para ellas y anota sus acoplamientos conocidos (ver "Decisiones"). Lo mismo vale para cualquier juego real que entre al catálogo después: `frogger` (SPEC `game-jam/flogger/03-frogger-core`) tuvo su propia corrida el 2026-09-22.
- Cualquier cambio a la jugabilidad: física, colisiones, hitboxes, puntuación, vidas, nivel, teclas, `PIECES`/`LEVELS`, resolución de canvas o tamaños de fuente. Un cambio de skin que altere la dificultad es un bug, no una feature.
- El chrome del CRT (`.crt`, `.crt-screen`, sus `::before`/`::after`): es entorno fijo de la plataforma, no skin.
- Modo claro, `prefers-color-scheme`, `data-theme` o cualquier variante de `:root`. Sigue sin haberlo y este spec no lo abre.
- Skins para los juegos simulados (`gloton`, `invasores`, `ranaria`, `duelo-pixel`): no tienen render propio que skinear.
- Persistir la skin por usuario en Supabase, o skins desbloqueables por puntuación.
- Cambiar los colores del catálogo, las portadas `.cover-*`, el HUD de React o el modal de fin de partida.
- Sonido, animaciones nuevas o geometría nueva dentro del canvas (incluido el "grid" típico de un look retro — ver Decisiones).

## Data model

### `lib/skins.ts`

```ts
export const SKIN_IDS = ["clasico", "neon", "retro"] as const;
export type SkinId = (typeof SKIN_IDS)[number];
export const DEFAULT_SKIN: SkinId = "clasico";

export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};

// Color de muestra del chip en el picker (no se usa dentro del canvas)
export const SKIN_ACCENTS: Record<SkinId, [string, string, string]> = {
  clasico: ["#ffffff", "#00ffff", "#ff8200"],
  neon: ["#00f5ff", "#f5ff00", "#ff4fd8"],
  retro: ["#ffe7b3", "#ffb84d", "#d2841b"],
};

export interface AsteroidsSkin {
  bg: string;
  ship: string;
  shipWidth: number;
  shipGlow: number; // shadowBlur
  thrust: string;
  thrustWidth: number;
  bullet: string;
  bulletGlow: number;
  asteroid: string;
  asteroidWidth: number;
  asteroidGlow: number;
  particleRgb: string; // "r,g,b" — el alpha lo sigue calculando la partícula
  particleWidth: number;
  powerup: string;
  powerupWidth: number;
  powerupGlow: number;
  powerupFont: string;
  hud: string;
  hudFont: string;
}

export const ASTEROIDS_SKINS: Record<SkinId, AsteroidsSkin> = {
  /* clasico | neon | retro — valores en la tabla de paletas de abajo */
};

const GAMES_WITH_SKINS = new Set<string>(["asteroides"]);
export const hasSkins = (gameId: string) => GAMES_WITH_SKINS.has(gameId);
```

`particleRgb` es un string `"r,g,b"` y no una función: la paleta debe ser un objeto de datos serializable, y el `alpha` de la partícula es estado de juego (su `ttl`), no color.

### Paletas de Asteroides

Roles del juego, con su literal actual (base de `clasico`) y el `file:line` donde vive hoy:

| Rol         | Dónde está hoy                                                               | `clasico`                | `neon`                   | `retro`                  |
| ----------- | ---------------------------------------------------------------------------- | ------------------------ | ------------------------ | ------------------------ |
| `bg`        | `components/games/Asteroids.tsx:590` (`"#000"`)                              | `#000000`                | `#05060a`                | `#120a00`                |
| `ship`      | `Asteroids.tsx:253` (`"#fff"`), `:254` (`lineWidth 1.5`)                     | `#ffffff` · 1.5 · glow 0 | `#00f5ff` · 2 · glow 12  | `#ffe7b3` · 2 · glow 2   |
| `thrust`    | `Asteroids.tsx:272` (`"rgba(255, 130, 0, 0.85)"`)                            | `#ff8200` @0.85 · 1.5    | `#ff3d00` @0.9 · 2       | `#b85c00` @1 · 2         |
| `bullet`    | `Asteroids.tsx:47` (`"#fff"`)                                                | `#ffffff` · glow 0       | `#f5ff00` · glow 10      | `#ffcf6b` · glow 1       |
| `asteroid`  | `Asteroids.tsx:112` (`"#fff"`), `:113` (`lineWidth 1.5`)                     | `#ffffff` · 1.5 · glow 0 | `#ff4fd8` · 1.5 · glow 8 | `#d2841b` · 1.5 · glow 0 |
| `particle`  | `Asteroids.tsx:310` (`rgba(255,255,255,α)`), `:311` (`lineWidth 1`)          | `255,255,255` · 1        | `255,154,226` · 1        | `230,150,36` · 1         |
| `powerup`   | `Asteroids.tsx:159`/`:164` (`"#0ff"`), `:160` (`lineWidth 2`), `:165` (font) | `#00ffff` · 2 · glow 0   | `#00c46a` · 2 · glow 10  | `#ffb84d` · 2 · glow 1   |
| `hud` (3x…) | `Asteroids.tsx:583` (`"#0ff"`), `:584` (`"15px monospace"`)                  | `#00ffff`                | `#00c46a`                | `#ffb84d`                |

`powerupFont` es `bold 12px monospace` y `hudFont` es `15px monospace` en las tres skins: los tamaños de fuente son invariantes por la regla de coste cero de jugabilidad (el rótulo "3x" no puede cambiar de caja entre skins). En `retro`, `hudFont` pasa a `bold 15px monospace` — mismo tamaño, más peso, para compensar el bloom del fósforo.

### Contrato de props

```ts
// components/games/Asteroids.tsx
export interface AsteroidsProps {
  paused: boolean;
  skin: SkinId; // nuevo — no altera State ni Handle
  onStateChange: (state: AsteroidsState) => void;
  onGameOver: (finalScore: number) => void;
}

// components/GamePlayer.tsx
interface RealGameProps {
  paused: boolean;
  skin: SkinId; // nuevo, obligatorio para todos los juegos reales
  onStateChange: (state: RealGameState) => void;
  onGameOver: (finalScore: number) => void;
}
```

`AsteroidsState` y `AsteroidsHandle` no cambian. Los otros tres juegos reales reciben `skin` como prop desde la primera corrida (para que el tipo del registro `REAL_GAMES` siga siendo uno solo) y la ignoran hasta que les toque su corrida.

### Persistencia

```ts
const SKIN_STORAGE_KEY = "av:skin:v1";
```

- Clave versionada, igual criterio que cualquier esquema de `localStorage` migrable.
- Global, no por juego: la skin elegida acompaña al jugador de un juego a otro.
- Se lee en un `useEffect` de montaje de `GamePlayer` (no en el inicializador de `useState`) para no producir un mismatch de hidratación: el primer render del servidor y del cliente siempre usa `DEFAULT_SKIN`.
- Un valor desconocido o corrupto en la clave se ignora y cae a `DEFAULT_SKIN`.

## Diseño del `SkinPicker`

El picker no es "tres botones más". El HUD y el `.crt-bottom` ya hablan el idioma de una máquina física (`SEÑAL OK`, `CRT-83 · 60 HZ`), así que el selector se presenta como el mando de tubo del mueble: una etiqueta `TUBO` en `var(--mono)` a 10px (misma tipografía y tamaño que `.hud-stat .l`) y tres chips a su derecha.

- Cada chip lleva su nombre en `var(--pixel)` a 8px y tres puntos de 5px con los colores de `SKIN_ACCENTS` de esa skin: **el control muestra la paleta que selecciona**, en vez de describirla con palabras. Ése es el elemento firma.
- El chip activo se enciende con su propio acento (`border-color` + `box-shadow` de 10px del primer color de su terna), no con el cian genérico de `.btn`. Cambiar de skin cambia el color del propio control: el mando y la pantalla están sincronizados.
- Los chips son `<button>` con `aria-pressed`, dentro de un contenedor con `role="group"` y `aria-label="Paleta del juego"`. Foco visible heredado del `:focus-visible` de la app.
- Son deliberadamente más pequeños y de menor contraste que `.btn` (10px de alto de texto, borde `var(--line)`): PAUSA/FIN/SALIR son acciones de partida y deben seguir dominando; el picker es un ajuste.
- Sin animación nueva más allá de la transición de `box-shadow` ya usada por `.btn` (160ms), y con `prefers-reduced-motion: reduce` desactivándola.
- Responsive: `.hud-actions` ya es `display:flex`, y `.player-hud` ya es `flex-wrap: wrap`. El bloque nuevo añade `flex-wrap: wrap` a `.hud-actions` y `.skin-picker`, de modo que por debajo de 840px los chips bajan a una segunda línea en vez de desbordar.

## Implementation plan

1. Crear `lib/skins.ts` con `SKIN_IDS`/`SkinId`/`DEFAULT_SKIN`/`SKIN_LABELS`/`SKIN_ACCENTS`, la interfaz `AsteroidsSkin`, `ASTEROIDS_SKINS` con las tres paletas de la tabla y `hasSkins`. Paso verificable: `npm run build` compila; nada de la app lo importa todavía.
2. En `components/games/Asteroids.tsx`, añadir la prop `skin` y un `skinRef` espejado por su propio `useEffect` (mismo idiom que `pausedRef`), leído dentro de `draw()` en cada frame. Todavía sin usar sus valores. Paso verificable: el juego se comporta exactamente igual.
3. Sustituir los literales de color por lecturas de la paleta: pasar `skin` como segundo argumento a `Bullet.draw`, `Asteroid.draw`, `PowerUp.draw`, `Ship.draw` y `Particle.draw` en sus call sites de `draw()`, y aplicar `bg`/`hud` en `draw()` y `drawPowerUpIndicator()`. Cada `draw` fija explícitamente `shadowBlur`/`shadowColor` y los devuelve a `0`/`"transparent"` antes de salir, para que ningún glow se filtre a la entidad siguiente. Paso verificable: con `skin="clasico"` el juego se ve idéntico a antes.
4. En `components/GamePlayer.tsx`: estado `skin` con `DEFAULT_SKIN`, lectura de `av:skin:v1` en un `useEffect` de montaje, escritura en cada cambio, y paso de `skin` al juego real montado. `skin` **no** entra en `resetKey`. Paso verificable: cambiar el valor a mano en `localStorage` y recargar cambia la paleta.
5. Añadir `skin` al tipo `RealGameProps` y la prop (ignorada) a `Tetris`, `BloqueBuster` y `Snake`, para que el registro `REAL_GAMES` siga tipando con un único `RealGameComponent`. Paso verificable: `npm run build` limpio y los tres juegos siguen jugándose igual.
6. Crear `components/SkinPicker.tsx` (chips + swatches + `aria-pressed`) y su bloque CSS al final de `app/globals.css`. Montarlo en `.hud-actions` detrás de `hasSkins(game.id)`. Paso verificable: el picker aparece en `/juegos/asteroides/jugar` y no aparece en `/juegos/caida/jugar`.
7. Verificación manual completa (lista de "Acceptance criteria") y `npm run build`.
8. Actualizar `references/games-with-themes.md`: fila de `asteroides` a implementada, con fecha y mediciones.

## Contraste sobre el CRT

Toda medición es la ratio de contraste WCAG 2.1 calculada con un script `node -e`, de cada color contra **el `bg` de su propia skin**, y no a ojo.

Correcciones de entorno aplicadas:

- **Scanlines** (`.crt-screen::after`): negro al 18% en filas alternas, `mix-blend-mode: multiply`. Se modela multiplicando los valores sRGB por `0.82`. Se aplica a **todas** las medidas, porque la mitad de las filas del canvas está siempre atenuada.
- **Viñeta** (`.crt-screen::before`): `transparent` hasta el 60% del radio y hasta `rgba(0,0,0,0.65)` en el borde. Se modela multiplicando los valores sRGB por `1 − α`. En los bordes superior/inferior del canvas el radio vertical del gradiente (45% de la altura) se agota antes que la geometría, así que ahí α llega al máximo `0.65`.

La viñeta atenúa figura **y** fondo a la vez, así que en el borde superior/inferior ningún color puede alcanzar 4.5:1 — el techo físico ahí es el blanco puro, que da 2.34:1 sobre negro. Por eso el criterio se parte en dos umbrales medibles:

- **Centro (con scanline):** ≥ 4.5:1 para lo crítico de jugar (nave, bala, asteroide, power-up, texto del HUD en canvas) y ≥ 3:1 para lo decorativo (llama del propulsor, partículas).
- **Borde superior/inferior (scanline + viñeta 0.65):** índice de retención = ratio del color / ratio del blanco puro en ese mismo punto. Gate: ≥ 0.60 para lo crítico, ≥ 0.50 para lo decorativo.

Además, dos colores de rol distinto no pueden quedarse a la vez con contraste mutuo < 1.6:1 **y** con menos de 40° de diferencia de tono. Excepciones documentadas, no ignoradas:

- `clasico` incumple el criterio de pares por construcción (nave, bala, asteroide y partícula son todos `#ffffff`). Es correcto: `clasico` es extracción literal del juego actual, cuya separación de roles es de forma y grosor de trazo, no de color. Cambiarlo rompería la razón de ser de esta skin.
- `retro` es monocromo por definición (todos los tonos en 30–41°), así que la comprobación de tono no aplica y se exige solo el contraste mutuo ≥ 1.6:1 entre los pares confundibles de objetos independientes: nave/asteroide (2.46:1), bala/asteroide (2.04:1) y power-up/asteroide (1.73:1). La llama del propulsor está pegada a la nave y las partículas son escombros del asteroide que las generó: comparten familia a propósito.
- En `neon`, asteroide/partícula queda en 1.49:1 con 4° de tono. Es deliberado: la partícula es el escombro de ese mismo asteroide, mismo rol y misma familia.

Mediciones finales (centro / borde sup-inf / retención):

| Skin      | Rol       | Color     | Fondo     | Centro  | Borde  | Retención | Umbral     | OK  |
| --------- | --------- | --------- | --------- | ------- | ------ | --------- | ---------- | --- |
| `clasico` | nave      | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí  |
| `clasico` | bala      | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí  |
| `clasico` | asteroide | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 4.5 / 0.60 | sí  |
| `clasico` | partícula | `#ffffff` | `#000000` | 13.77:1 | 2.34:1 | 1.00      | 3.0 / 0.50 | sí  |
| `clasico` | propulsor | `#ff8200` | `#000000` | 5.80:1  | 1.55:1 | 0.66      | 3.0 / 0.50 | sí  |
| `clasico` | power-up  | `#00ffff` | `#000000` | 11.05:1 | 2.05:1 | 0.88      | 4.5 / 0.60 | sí  |
| `clasico` | HUD "3x"  | `#00ffff` | `#000000` | 11.05:1 | 2.05:1 | 0.88      | 4.5 / 0.60 | sí  |
| `neon`    | nave      | `#00f5ff` | `#05060a` | 9.97:1  | 1.96:1 | 0.85      | 4.5 / 0.60 | sí  |
| `neon`    | bala      | `#f5ff00` | `#05060a` | 12.24:1 | 2.20:1 | 0.95      | 4.5 / 0.60 | sí  |
| `neon`    | asteroide | `#ff4fd8` | `#05060a` | 4.95:1  | 1.46:1 | 0.63      | 4.5 / 0.60 | sí  |
| `neon`    | partícula | `#ff9ae2` | `#05060a` | 7.20:1  | 1.71:1 | 0.74      | 3.0 / 0.50 | sí  |
| `neon`    | propulsor | `#ff3d00` | `#05060a` | 4.05:1  | 1.35:1 | 0.58      | 3.0 / 0.50 | sí  |
| `neon`    | power-up  | `#00c46a` | `#05060a` | 6.03:1  | 1.57:1 | 0.68      | 4.5 / 0.60 | sí  |
| `neon`    | HUD "3x"  | `#00c46a` | `#05060a` | 6.03:1  | 1.57:1 | 0.68      | 4.5 / 0.60 | sí  |
| `retro`   | nave      | `#ffe7b3` | `#120a00` | 10.85:1 | 2.08:1 | 0.91      | 4.5 / 0.60 | sí  |
| `retro`   | bala      | `#ffcf6b` | `#120a00` | 9.08:1  | 1.90:1 | 0.83      | 4.5 / 0.60 | sí  |
| `retro`   | asteroide | `#d2841b` | `#120a00` | 4.67:1  | 1.45:1 | 0.63      | 4.5 / 0.60 | sí  |
| `retro`   | partícula | `#e69624` | `#120a00` | 5.69:1  | 1.55:1 | 0.68      | 3.0 / 0.50 | sí  |
| `retro`   | propulsor | `#b85c00` | `#120a00` | 3.16:1  | 1.28:1 | 0.56      | 3.0 / 0.50 | sí  |
| `retro`   | power-up  | `#ffb84d` | `#120a00` | 7.77:1  | 1.77:1 | 0.77      | 4.5 / 0.60 | sí  |
| `retro`   | HUD "3x"  | `#ffb84d` | `#120a00` | 7.77:1  | 1.77:1 | 0.77      | 4.5 / 0.60 | sí  |

Correcciones que la medición obligó a hacer sobre el primer borrador de paletas:

| Skin    | Rol       | Color descartado | Ratio   | Color final | Ratio final | Motivo                                              |
| ------- | --------- | ---------------- | ------- | ----------- | ----------- | --------------------------------------------------- |
| `neon`  | asteroide | `#ff006e`        | 3.75:1  | `#ff4fd8`   | 4.95:1      | El `--magenta` de la casa no llega a 4.5:1 en negro |
| `neon`  | power-up  | `#00ff88`        | 10.06:1 | `#00c46a`   | 6.03:1      | 1.01:1 y 30° contra la nave cian: se confundían     |
| `neon`  | propulsor | `#ffcf3a`        | 9.21:1  | `#ff3d00`   | 4.05:1      | 15° contra la bala amarilla                         |
| `retro` | asteroide | `#c8791a`        | 4.15:1  | `#d2841b`   | 4.67:1      | No llegaba a 4.5:1 contra el fondo ámbar            |
| `retro` | power-up  | `#ffa726`        | 6.92:1  | `#ffb84d`   | 7.77:1      | 1.59:1 contra el asteroide: se confundían           |

## Argumento de diseño de las tres paletas

- **`clasico`** es extracción literal, no rediseño: reproduce hex por hex el Asteroides vectorial actual (blanco sobre negro, power-up cian, llama naranja). Su valor es funcional antes que estético — es la prueba de que el refactor de color no introdujo ninguna regresión visual, y por eso es también `DEFAULT_SKIN`.
- **`neon`** habla el idioma de la plataforma: la nave es el `--cyan` de la casa, la bala el `--yellow`, y la escena entera lleva glow (`shadowBlur` 8–12). El único color que no sale de `:root` es el rosa del asteroide, porque el `--magenta` puro se quedaba en 3.75:1. La nave y su disparo ocupan la banda alta de luminancia; el asteroide, la baja: el enemigo nunca puede leerse como algo del jugador.
- **`retro`** es fósforo ámbar monocromo, sin glow (0–2) y con los roles separados por escalones de luminancia en vez de por tono: nave (10.85:1) > power-up (7.77:1) ≈ bala (9.08:1) > asteroide (4.67:1) > propulsor (3.16:1). No baja la saturación para resolver el monocromo: todos los críticos siguen por encima de 4.5:1.

## Acceptance criteria

- [ ] `lib/skins.ts` exporta `SkinId`, `DEFAULT_SKIN`, `SKIN_LABELS`, `SKIN_ACCENTS`, `AsteroidsSkin`, `ASTEROIDS_SKINS` y `hasSkins`, y no importa nada de `components/`.
- [ ] `/juegos/asteroides/jugar` muestra el picker con tres chips y el chip activo iluminado con su propio acento.
- [ ] Las tres skins cambian visiblemente el aspecto del juego (fondo, nave, asteroides, bala, power-up).
- [ ] Con `clasico` seleccionado, el juego es visualmente idéntico a como estaba antes de este spec (mismo blanco, mismo `#0ff`, misma llama naranja, mismos grosores de trazo).
- [ ] Cambiar de skin a mitad de partida no reinicia el juego: puntuación, vidas, nivel, posición de la nave y asteroides en pantalla se conservan.
- [ ] Cambiar de skin a mitad de partida no altera la puntuación ni la dificultad: los hitboxes, las velocidades y el `W`/`H` del canvas son los mismos en las tres.
- [ ] Las partículas ya en vuelo al cambiar de skin se redibujan con la paleta nueva (leen la paleta por frame, no la guardan al nacer).
- [ ] La skin elegida sobrevive a recargar la página (`localStorage` `av:skin:v1`).
- [ ] La skin elegida sobrevive a navegar a otro juego y volver.
- [ ] `/juegos/caida/jugar` no muestra el picker y se juega exactamente igual que antes. _(en la corrida original también aplicaba a `/juegos/bloque-buster/jugar` y `/juegos/serpentina/jugar`; ambos tienen paletas desde el 2026-09-17, y `/juegos/frogger/jugar` desde el 2026-09-22)_
- [ ] Los juegos simulados (`gloton`, `invasores`, `ranaria`, `duelo-pixel`) no cambian de comportamiento.
- [ ] Por debajo de 840px de ancho, el picker baja de línea dentro de `.player-hud` sin desbordar ni romper la fila de PAUSA/FIN/SALIR.
- [ ] Los chips son alcanzables por teclado, exponen `aria-pressed` y muestran foco visible.
- [ ] Ningún glow se filtra entre entidades: con `clasico` (glow 0) no aparece ninguna sombra residual del frame anterior.
- [ ] `npm run build` compila sin errores de tipos ni de lint.
- [ ] `references/games-with-themes.md` refleja `asteroides` como implementado y los otros tres como pendientes.

## Decisiones tomadas y descartadas

- **Sí:** tres paletas oscuras dentro del CRT. **No:** un modo claro/oscuro. SPEC 07 descartó el toggle de tema de Tetris porque la plataforma ya tiene su tema y no tiene modo claro; ese argumento sigue intacto y este spec no lo reabre.
- **Sí:** `clasico` como `DEFAULT_SKIN`. **No:** arrancar en `neon`, aunque sea la más "de la casa": el jugador que no toca nada debe ver el juego que ya conocía, y así el default también es la prueba de no regresión.
- **Sí:** `lib/skins.ts` como fuente de verdad única, con un `Record<SkinId, …>` por juego. **No:** un archivo de skins por juego ni tokens CSS: el canvas no lee CSS, y un único archivo hace evidente si dos juegos se desalinean en su "retro".
- **Sí:** un `skinRef` espejado y leído dentro de `draw()` en cada frame, el mismo idiom que ya usa `pausedRef`. **No:** remontar el componente con `key={skin}`, porque reiniciaría la partida — exactamente el bug que este spec prohíbe.
- **Sí:** persistencia global en `localStorage` con clave versionada `av:skin:v1`. **No:** una skin por juego (el jugador elegiría lo mismo cuatro veces) ni persistencia en Supabase (no hay auth real; SPEC 04/06 dejan `scores` como única escritura pública).
- **Sí:** leer `localStorage` en un `useEffect` de montaje. **No:** leerlo en el inicializador de `useState`, que produciría un mismatch de hidratación entre el HTML del servidor y el primer render del cliente.
- **Sí:** el `SkinPicker` se renderiza solo si `hasSkins(game.id)`. **No:** mostrarlo siempre en `.hud-actions`: mientras queden juegos sin migrar, un picker que no hace nada es peor que no tener picker.
- **Sí:** pasar la paleta como argumento a `draw(ctx, skin)` en las clases de módulo de Asteroides. **No:** una variable de módulo mutable con la skin activa, que sería estado global compartido entre montajes del componente.
- **Sí:** `particleRgb` como string `"r,g,b"` que la partícula combina con su propio alpha. **No:** guardar el color ya resuelto en la partícula al nacer, porque las partículas vivas dejarían de seguir a la skin al cambiarla a mitad de explosión.
- **No:** dibujar un grid de fondo en el `retro` de Asteroides, aunque el grid sea parte del vocabulario retro. Añadir geometría nueva al canvas sale del límite "solo color" de este trabajo; Asteroides resuelve su `retro` con fósforo ámbar. En los juegos que ya dibujan grid (Tetris, Bloque Buster, Serpentina) la skin sí podrá recolorearlo, porque ahí el grid ya existe.
- **No:** usar el `--magenta: #ff006e` de la casa para los asteroides en `neon`. Mide 3.75:1 y el asteroide es crítico para jugar; se sube a `#ff4fd8`, que además es el `hotpink` que `BloqueBuster` ya usa, así que sigue siendo vocabulario de la casa.
- **Sí:** dejar este spec en `En revisión` y no en `Implementado` mientras queden juegos sin paleta. Pasa a `Implementado` cuando **todos** los juegos reales del catálogo tengan sus tres skins. A 2026-09-22 falta `caida`; `frogger` entró al catálogo después de escribirse este spec y ya tiene las suyas.
- **Sí:** en `frogger`, tres fondos (`bgRoad`/`bgRiver`/`bgSafe`) en vez de un único `bg`. Es el primer juego cuyo fondo **codifica la mecánica** (en el río te ahogas, en la fila segura no), así que la zona es un rol de color más, no decoración. **No:** un `bg` único con las zonas dibujadas encima como entidades, que habría sido geometría nueva.
- **Sí:** en el `retro` de `frogger`, invertir la intuición y hacer del **río la zona más oscura** y de las filas seguras la más clara. En monocromo ámbar no hay tono que separe agua de asfalto, y poner el río abajo del todo es lo que libera el margen de luminancia que necesitan tronco (`#c98018`), tortuga (`#f0ab3d`) y rana (`#ffe7b3`) para separarse ≥ 1.6:1 entre sí. **No:** un río claro "de agua brillante", que aplastaba las tres plataformas contra el techo del ladder.
- **Sí:** tratar coche y camión como **un solo rol** (igual que los 7 bloques de `bloque-buster`): los dos matan igual, confundirlos no tiene coste de juego. **No:** gastar escalones de luminancia en separarlos, que se los quitaría a los pares que sí importan (rana↔plataforma y tronco↔tortuga).
- **Sí:** un tercer nivel de medición para las **texturas internas** (veta del tronco, caparazón, cabina, ruedas, ojos y pupila), medidas contra la figura que las lleva y no contra el fondo, con un mínimo de 1.5:1. No portan información de juego —quitarlas todas deja el juego igualmente jugable— y medirlas contra un fondo sobre el que nunca se pintan no significa nada.

Decisiones adelantadas para las próximas corridas (una por juego, anotadas aquí para que no se redescubran):

- `caida` necesitará **9 entradas** de color en el mismo orden que `PIECES` (`components/games/Tetris.tsx:24-31` define 8 colores de pieza más el hueco del índice 0).
- **`frogger` — resuelto en la corrida del 2026-09-22**: `lib/skins.ts` exporta `FroggerSkin`/`FROGGER_SKINS`. Es el primer juego con **fondo por zona** (`bgRoad`/`bgRiver`/`bgSafe`), porque en Frogger el fondo dice si te ahogas o no. El `retro` invierte el orden natural de luminancia (río = zona más oscura) para liberar el margen que separa tronco/tortuga/rana; coche y camión se tratan como un solo rol; y las texturas internas se miden contra su propia figura, no contra el fondo. Paletas, mediciones y las excepciones de `clasico` (coche 4.19, camión 4.31, tronco 2.36, tortuga 3.71 y barra de tiempo baja 3.35, conservadas porque `clasico` es prueba de no regresión) quedan documentadas en `references/games-with-themes.md`.
- ~~`bloque-buster` necesitará exactamente las 7 claves `red|yellow|cyan|magenta|hotpink|green|gray`, porque `LEVELS` referencia los bloques por nombre, no por hex. Además su `Particle` guarda hoy el hex ya resuelto: deberá guardar la clave.~~ **Resuelto en la corrida del 2026-09-17**: `lib/skins.ts` exporta `BlockColorKey`/`BloqueBusterSkin`/`BLOQUE_BUSTER_SKINS`, `Particle` guarda `colorKey` y `LEVELS` no se tocó. Paletas, mediciones y la excepción de contraste de `clasico` (3 bloques bajo 4.5:1, conservados porque `clasico` es prueba de no regresión) quedan documentadas en `references/games-with-themes.md`.
- ~~`serpentina` usa un spritesheet para la fruta (`components/games/Snake.tsx:18`, `/snake/fruits.png`), que no es recoloreable por paleta. Su skin necesitará un `fruitMode: "sprite" | "solid"`, con `retro` dibujando una celda sólida.~~ **Resuelto en la corrida del 2026-09-17**: `lib/skins.ts` exporta `SnakeSkin`/`SNAKE_SKINS` con `fruitMode`; `retro` dibuja la celda sólida **reutilizando la rama `else` de fallback que el juego ya tenía** (su condición pasa de "la imagen no cargó" a "no cargó **o** el skin pide sólido", y su `#ff006e` fijo lee ahora `pal.fruit`), así que no se añadió dibujo nuevo. La rejilla sí se recolorea, porque ya existía en el juego. El halo se aplica solo a la cabeza: `shadowBlur` por segmento sería un riesgo de FPS con una serpiente larga, y los FPS sí tocan la jugabilidad. Paletas, mediciones y las dos excepciones de contraste de `clasico` (rejilla 1.07:1 y fruta de fallback 3.80:1, conservadas porque `clasico` es prueba de no regresión) quedan documentadas en `references/games-with-themes.md`.

## Riesgos identificados

| Riesgo                                                                                                                                          | Mitigación                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shadowBlur`/`shadowColor` son estado del contexto 2D: si una entidad los deja puestos, la siguiente hereda un glow que su skin no pide.        | Cada `draw` fija sus valores al entrar y los devuelve a `0`/`"transparent"` al salir. Criterio de aceptación explícito con `clasico` (glow 0) para detectar cualquier residuo.                |
| Tocar `components/GamePlayer.tsx` toca el único archivo que integra los cuatro juegos reales; un error ahí los rompe todos a la vez.            | El paso 5 del plan añade la prop a los cuatro y los criterios exigen probar los tres juegos aún sin skin antes de dar la corrida por buena. `REAL_GAMES` no se toca.                          |
| Un glow grande (`shadowBlur` 12) sobre 40 asteroides + partículas puede costar frames en equipos modestos y cambiar la sensación de dificultad. | El glow solo se aplica a nave, bala, asteroide y power-up; las partículas (las más numerosas) van con glow 0 en las tres skins. Si aparece caída de FPS, se baja el `shadowBlur`, no el `dt`. |
| Trabajar de a un juego por corrida puede producir tres "retro" distintos.                                                                       | Las decisiones de paleta y los hex base se registran en `references/games-with-themes.md`; cada corrida siguiente lee ese archivo antes de diseñar y reutiliza el ámbar y los glows.          |
| El índice de retención en el borde es una métrica propia, no un estándar WCAG.                                                                  | Se documenta su fórmula y su motivo (la viñeta atenúa figura y fondo a la vez, el techo físico es 2.34:1). El gate WCAG real sigue siendo la medida de centro con scanline.                   |

## What is **not** in this spec

- Las paletas de `caida`, `bloque-buster` y `serpentina` (una corrida de `skin-designer` por juego).
- Cualquier cambio de jugabilidad, puntuación, controles o resolución de canvas.
- El chrome del CRT (`.crt`, `.crt-screen` y sus pseudoelementos).
- Modo claro, `prefers-color-scheme` o cambios en `:root`.
- Skins para los juegos simulados del catálogo.
- Persistencia de la skin en Supabase o por usuario.
- Skins desbloqueables, sonido o animaciones nuevas.

Cada uno de estos, si se necesita, va en su propio spec.
