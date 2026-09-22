# 11 · Controles táctiles y layout móvil del reproductor

- **Estado:** Implementado
- **Depende de:** SPEC 05, SPEC 07, SPEC 08, SPEC 09, SPEC 10
- **Fecha:** 2026-09-21
- **Objetivo:** Hacer jugables los cuatro juegos reales en un teléfono táctil mediante un gamepad virtual que despacha eventos de teclado sintéticos, sin modificar ni una línea de los componentes de juego.

## Por qué existe este spec

Los cuatro juegos reales son exclusivamente de teclado. En un teléfono la partida arranca y se dibuja, pero no hay forma de mover la nave, la pieza, la paleta ni la serpiente: la pantalla de juego está muerta. SPEC 09 dejó "soporte táctil/móvil" fuera de alcance de forma explícita y lo remitió a un spec propio; este es ese spec.

La decisión que estructura todo el trabajo es **dónde se traduce el toque a acción**. Hay dos sitios posibles: dentro de cada juego, o fuera de todos. Este spec elige fuera.

Cada juego ya define su vocabulario de entrada como un conjunto de teclas (`CONTROL_KEYS` en `Tetris.tsx:80`, `Snake.tsx:47`, `BloqueBuster.tsx:196`, `Asteroids.tsx:407`). Ese vocabulario es un contrato que ya existe y que ya está probado. Un gamepad virtual que emite `KeyboardEvent` sintéticos sobre `window` habla ese contrato sin extenderlo: los juegos no saben que existe el táctil y no pueden romperse por él. La alternativa —gestos sobre el canvas— obligaría a editar los cuatro componentes, a duplicar la máquina de estados de entrada en cada uno, y no resuelve Asteroides, que necesita girar, propulsar y disparar simultáneamente.

Ese contrato tiene una asimetría que hay que respetar: **`Asteroids`, `Tetris` y `Snake` leen `e.code`, pero `BloqueBuster` lee `e.key`** (`BloqueBuster.tsx:247`). Cada evento sintético lleva los dos campos. No es redundancia defensiva: sin `key`, BloqueBuster es el único juego que el pad no controla.

## Scope

**Dentro:**

- Nuevo `lib/touch-controls.ts`: fuente de verdad de los controles táctiles. Define `TouchButtonSpec`, `TouchLayout`, el `TOUCH_LAYOUTS` con los cuatro layouts y `hasTouchControls(gameId)`. Sin JSX ni lógica de render — mismo criterio que `lib/skins.ts`.
- Nuevo `components/TouchControls.tsx`: el gamepad virtual. Renderiza los botones del layout del juego actual y traduce `pointerdown`/`pointerup` a `keydown`/`keyup` sintéticos sobre `window`.
- `components/GamePlayer.tsx`: monta `<TouchControls>` bajo el `.crt` cuando `hasTouchControls(game.id)`, agrega la auto-pausa por `visibilitychange`, y extrae el `style` inline del grupo de stats (`:153`) a una clase `.hud-stats`. No cambia `REAL_GAMES`, ni el modal, ni `resetKey`, ni el estado de skin.
- `app/globals.css`: bloque nuevo `.touch-controls` al final del archivo, más los ajustes móviles de `.av-player`, `.crt`, `.crt-screen`, `.player-hud`, `.hud-stats`, `.crt-bottom` y `.modal`.
- Corrección del auto-zoom de iOS en el input de iniciales del modal (`font-size: 16px`).
- Commit de `allowedDevOrigins` en `next.config.ts`, necesario para abrir el dev server desde un teléfono de la misma red.

**Fuera de alcance (para futuros specs):**

- **Cualquier cambio dentro de `components/games/*.tsx`.** Si la implementación necesita editar un juego, el mecanismo está mal elegido y hay que revisar el spec, no el juego.
- Gestos sobre el canvas (swipe en Snake, arrastre de la paleta en BloqueBuster). El pad cubre los cuatro juegos; los gestos serían una capa de confort encima y van en su propio spec.
- Layout optimizado para horizontal (pad a los lados de la pantalla) y aviso de "gira el dispositivo". En horizontal la página se ve bien con el layout vertical; no se bloquea ni se optimiza.
- Vibración háptica (`navigator.vibrate`): no existe en iOS Safari, sería una mejora solo-Android.
- Botón de pantalla completa (Fullscreen API): no existe en Safari de iPhone.
- Interruptor manual para mostrar/ocultar el pad en escritorio. La detección es automática por `(pointer: coarse)`.
- Auditoría móvil del resto del sitio (`/`, `/biblioteca`, `/salon`, `/acerca-de`, `/auth`). Ya tienen media queries propias y no son el bloqueo que el usuario reportó.
- Los juegos simulados (`gloton`, `invasores`, `ranaria`, `duelo-pixel`): no tienen entrada real que mapear. El pad no se les monta.
- Cambios de jugabilidad de cualquier tipo: física, colisiones, puntuación, velocidades, resolución de canvas o el conjunto de teclas de un juego.
- PWA, manifest, instalación en pantalla de inicio o soporte offline.

## Modelo de datos

No se agregan ni modifican datos de Supabase. Se introduce una estructura nueva de configuración en `lib/touch-controls.ts`:

```ts
export interface TouchButtonSpec {
  code: string; // KeyboardEvent.code — lo leen Asteroids, Tetris y Snake
  key: string; // KeyboardEvent.key — lo lee BloqueBuster
  label: string; // glifo o palabra del botón: "◀", "ROTAR"
  aria: string; // etiqueta accesible: "Girar a la izquierda"
  group: "dpad" | "actions";
  repeat?: boolean; // auto-repeat mientras se mantiene pulsado
  cell?: "up" | "down" | "left" | "right" | "wide";
}

export type TouchLayout = TouchButtonSpec[];
```

```ts
export const TOUCH_LAYOUTS: Partial<Record<string, TouchLayout>> = {
  asteroides: [...],
  caida: [...],
  "bloque-buster": [...],
  serpentina: [...],
};

export const hasTouchControls = (gameId: string): boolean =>
  TOUCH_LAYOUTS[gameId] !== undefined;
```

`cell` posiciona el botón dentro de la rejilla 3×3 del d-pad (`"wide"` = una fila completa, para BloqueBuster). `group` decide la mitad: `dpad` a la izquierda, `actions` a la derecha.

### Los cuatro layouts

Cada valor sale del `CONTROL_KEYS` del juego correspondiente, no de una invención nueva.

| Juego           | `dpad`                                         | `actions`                                  | Repeat  |
| --------------- | ---------------------------------------------- | ------------------------------------------ | ------- |
| `asteroides`    | ◀ `ArrowLeft`, ▶ `ArrowRight`                  | PROPULSOR `ArrowUp`, DISPARO `Space`/`" "` | ninguno |
| `caida`         | ◀ `ArrowLeft`, ▶ `ArrowRight`, ▼ `ArrowDown`   | ROTAR `ArrowUp`, CAÍDA `Space`/`" "`       | ←, →, ↓ |
| `bloque-buster` | ◀ `ArrowLeft`, ▶ `ArrowRight` (`cell: "wide"`) | —                                          | ninguno |
| `serpentina`    | ▲ ▼ ◀ ▶ en cruz                                | —                                          | ninguno |

Notas de cada uno, justificadas contra el código actual:

- **`asteroides`** no lleva repeat en ningún botón. `ArrowLeft`/`ArrowRight`/`ArrowUp` son estado sostenido (`Asteroids.tsx:230-233` lee `keys[...]` cada frame), así que un solo `keydown` basta. `Space` pasa por `justPressed` (`:412-419`), que **ya ignora** los `keydown` repetidos mientras la tecla siga marcada — con teclado físico tampoco hay autofire. El pad reproduce ese comportamiento exactamente.
- **`caida`** es el único con repeat. Tetris actúa una vez por `keydown` (`Tetris.tsx:370-391`), así que sin repeat mover una pieza cinco columnas exigiría cinco toques. `ROTAR` y `CAÍDA` no repiten: una rotación continua o varios hard drops encadenados serían un cambio de jugabilidad.
- **`bloque-buster`** usa `e.key`, no `e.code` (`BloqueBuster.tsx:247`). Es estado sostenido, sin repeat. Al tener solo dos botones, ocupan el ancho completo (`cell: "wide"`) y son los más grandes del set.
- **`serpentina`** es una cruz de cuatro. Sin repeat: el juego ya guarda la dirección en un buffer que se aplica al inicio del siguiente tick (`Snake.tsx:201-220`), así que repetir la misma tecla no hace nada.

El `key` de `Space` es `" "` (un espacio), no `"Space"`. Ningún juego lo lee hoy, pero el campo debe ser correcto por si un juego futuro mira `e.key`.

## Diseño del gamepad

El pad no es una botonera genérica pegada abajo. El reproductor ya presenta el juego como un mueble físico (`.crt` con marco, `.crt-bottom` con `SEÑAL OK · CRT-83 · 60 HZ`, y el `TUBO` del `SkinPicker` de SPEC 10). El pad es el panel de control de ese mueble: aparece **dentro del marco**, bajo la franja `.crt-bottom`, sobre el mismo `#050507` del cabinet y con el mismo borde de la casa. Cuando aparece, el mueble se alarga; no flota sobre el juego.

- **Dos grupos separados**, direcciones a la izquierda y acciones a la derecha, con el espacio muerto del centro. Es la convención de cualquier gamepad y es lo que permite jugar con dos pulgares — Asteroides necesita girar y disparar a la vez.
- **Botones de 56px de alto mínimo** (por encima de los 44pt de Apple HIG y los 48dp de Material), con el `clip-path` de esquina cortada que ya usan `.btn` y `.skin-chip`, para que el pad se lea como parte del mismo sistema.
- **Las direcciones usan glifos** (`◀ ▶ ▲ ▼`) y **las acciones usan palabra** (`PROPULSOR`, `DISPARO`, `ROTAR`, `CAÍDA`) en `var(--pixel)` a 9px. La asimetría es deliberada: dirección se reconoce por forma, acción se reconoce por nombre.
- **El botón apretado se enciende en `var(--cyan)`** con el mismo `box-shadow` de 10px de `.skin-chip.active`, aplicado por una clase de estado — no por `:active`, que en táctil es poco fiable. Es la única realimentación de que el toque llegó, porque no hay clic ni hover.
- Sin animaciones nuevas. La transición de `box-shadow` de 160ms es la misma de `.btn`, y se desactiva bajo `prefers-reduced-motion: reduce`.
- Cada botón es un `<button type="button">` con `aria-label`, dentro de un contenedor con `role="group"` y `aria-label="Controles táctiles"`.

### Cómo se muestra y se oculta

`.touch-controls` es `display: none` por defecto y pasa a `display: flex` dentro de `@media (pointer: coarse)`. El componente se renderiza **siempre** en el DOM cuando el juego tiene layout; quien decide si se ve es CSS.

Esto es deliberado: detectar el táctil en JavaScript con `matchMedia` obligaría a un primer render sin pad seguido de un segundo con pad, que es exactamente el mismatch de hidratación que SPEC 10 evitó al leer `localStorage` en un `useEffect` de montaje en vez de en el inicializador de `useState`. Con CSS, el HTML del servidor y el del cliente son idénticos y el pad nunca parpadea.

Consecuencia aceptada: en un portátil táctil (que reporta `pointer: coarse` junto al ratón) el pad aparece aunque haya teclado. Es el caso raro, el pad no estorba, y el teclado sigue funcionando en paralelo.

## Traducción de toque a tecla

El núcleo del componente. Un toque produce exactamente un `keydown` y exactamente un `keyup`.

```ts
function dispatchKey(type: "keydown" | "keyup", b: TouchButtonSpec) {
  window.dispatchEvent(
    new KeyboardEvent(type, {
      code: b.code,
      key: b.key,
      bubbles: true,
      cancelable: true,
    }),
  );
}
```

Reglas de manejo del puntero, cada una resolviendo un fallo concreto:

1. **`onPointerDown`** → `e.preventDefault()`, `setPointerCapture(e.pointerId)`, `dispatchKey("keydown")`, y si `repeat` arranca el temporizador.
2. **`setPointerCapture` es obligatorio.** Sin él, un dedo que se desliza fuera del botón deja de recibir el `pointerup`, el `keyup` nunca se emite y `keys["ArrowLeft"]` queda en `true` **para siempre**: la nave gira sola hasta el fin de la partida. Con captura, el `pointerup` llega siempre al mismo elemento que lo capturó.
3. **`onPointerUp` y `onPointerCancel`** → `dispatchKey("keyup")` y limpieza del temporizador. Los dos, no solo el primero: el navegador dispara `pointercancel` cuando decide que el gesto le pertenece (una llamada entrante, un gesto del sistema).
4. **Red de seguridad global**: en `blur` de `window` y en `visibilitychange` con `document.hidden`, se sueltan todos los botones que estuvieran apretados. Cubre el caso de que el navegador se lleve el puntero sin avisar.
5. **Limpieza al desmontar**: se sueltan los botones apretados y se cancelan los temporizadores. Sin esto, salir de la partida con un botón apretado dejaría la tecla marcada en el siguiente montaje.
6. **Multitouch**: cada botón gestiona su propio `pointerId`, así que dos dedos sobre dos botones producen dos pares `keydown`/`keyup` independientes. Es lo que hace jugable Asteroides.
7. **`touch-action: none` sobre cada botón**: impide que el navegador interprete el toque como scroll o zoom y se quede con el gesto a mitad de pulsación.
8. **El pad se desactiva cuando `paused` o `over`**, soltando antes lo que estuviera apretado. Evita que una tecla quede marcada al otro lado de una pausa.

Los `KeyboardEvent` sintéticos son **no confiables** (`isTrusted === false`), así que el `e.preventDefault()` que los juegos llaman sobre ellos no hace nada. No importa: el navegador ya no tiene ningún comportamiento por defecto que cancelar, porque el evento real fue el `pointerdown` y ése sí se canceló en el paso 1.

## Ajustes de layout móvil

Todos dentro de `@media (max-width: 720px)`, el breakpoint que el archivo ya usa (`globals.css:1465`, `:1605`, `:1971`).

| Regla                     | Hoy                         | En móvil                          | Motivo                                                           |
| ------------------------- | --------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `.av-player`              | `padding: 0 24px 64px`      | `0 10px 32px`                     | 48px de ancho recuperados                                        |
| `.crt`                    | `padding: 24px`, radio 28px | `padding: 10px`, radio 16px       | 28px más de pantalla; el marco sigue leyéndose                   |
| `.crt-screen`             | —                           | `touch-action: manipulation`      | mata el zoom por doble toque sin bloquear el scroll de la página |
| `.player-hud`             | `padding: 14px 18px`        | `10px 12px`                       |                                                                  |
| `.hud-stats` (nueva)      | inline `gap: 24`            | `gap: 12px`                       | un `style` inline no se puede ajustar por media query            |
| `.hud-stat .v`            | 16px                        | 13px                              | cuatro stats en una fila de 360px                                |
| `.crt-bottom`             | tres `<span>`               | se oculta el `CARGA · 1MB`        | evita que la franja rompa en dos líneas                          |
| `.modal`                  | `padding: 32px`             | `20px`, `width: min(480px, 94vw)` |                                                                  |
| `.modal .input-row`       | `flex` en fila              | columna bajo 520px                | el botón GUARDAR no cabe junto al input                          |
| `.modal .input-row input` | hereda 14px                 | `font-size: 16px`                 | **corrige el auto-zoom de iOS Safari**                           |
| `.modal-bd`               | `align-items: center`       | `overflow-y: auto`                | con el teclado virtual abierto el modal debe poder desplazarse   |

El auto-zoom de iOS merece nota aparte porque es un bug real y no una mejora estética: Safari en iPhone hace zoom al enfocar cualquier `<input>` con `font-size` menor a 16px y **no revierte el zoom al salir del campo**, dejando la página magnificada. Con 16px no ocurre. Los 44px de alto del input no cambian.

No se agrega `export const viewport` a `app/layout.tsx`: Next 16 ya inyecta `width=device-width, initial-scale=1` por defecto (`node_modules/next/dist/lib/metadata/default-metadata.js:26`) y es exactamente lo que se quiere.

## Auto-pausa al ocultar la pestaña

En `GamePlayer.tsx`, un `useEffect` escucha `visibilitychange` sobre `document`: si `document.hidden` y la partida no terminó, `setPaused(true)`.

Nunca reanuda sola. Volver a la app y encontrarse el juego corriendo desde hace treinta segundos es peor que encontrárselo pausado, y reanudar automáticamente devolvería el control a un jugador que todavía no está mirando. El overlay `EN PAUSA` que ya existe (`GamePlayer.tsx:210-232`) explica el estado sin necesidad de texto nuevo.

## Plan de implementación

1. Crear `lib/touch-controls.ts` con `TouchButtonSpec`, `TouchLayout`, los cuatro layouts de `TOUCH_LAYOUTS` y `hasTouchControls`. Verificable: `npm run build` compila; nada lo importa todavía.
2. Crear `components/TouchControls.tsx` con la estructura visual (dos grupos, botones del layout recibido) y **sin** despacho de eventos. Verificable: montado a mano en `/juegos/caida/jugar`, los botones se ven y no hacen nada.
3. Añadir el bloque `.touch-controls` al final de `app/globals.css`, con `display: none` por defecto y `display: flex` dentro de `@media (pointer: coarse)`. Verificable: el pad se ve en el emulador de dispositivos de DevTools y no se ve en escritorio.
4. Implementar el despacho: `dispatchKey`, los handlers de `pointerdown`/`pointerup`/`pointercancel` con `setPointerCapture`, y el estado visual del botón apretado. Todavía sin auto-repeat. Verificable: en el emulador, `serpentina` y `bloque-buster` se juegan completos con el pad.
5. Añadir el auto-repeat (`REPEAT_DELAY_MS = 170`, `REPEAT_INTERVAL_MS = 50`) para los botones marcados, más la limpieza de temporizadores al soltar y al desmontar. Verificable: en `caida`, mantener ◀ desplaza la pieza de forma continua; mantener ROTAR la rota una sola vez.
6. Añadir la red de seguridad: soltar todo lo apretado en `blur` de `window`, en `visibilitychange` oculto, al desmontar, y cuando el pad pase a `disabled`. Verificable: apretar ◀ en `asteroides`, cambiar de pestaña, volver — la nave no está girando sola.
7. En `components/GamePlayer.tsx`: montar `<TouchControls>` bajo `.crt-bottom` detrás de `hasTouchControls(game.id)`, pasarle `disabled={paused || over}`, y añadir el `useEffect` de auto-pausa por `visibilitychange`. Verificable: el pad aparece en los cuatro juegos reales y no en `/juegos/gloton/jugar`.
8. Extraer el `style` inline de `GamePlayer.tsx:153` a la clase `.hud-stats` en `globals.css`, con los mismos valores actuales. Verificable: en escritorio el HUD se ve idéntico a antes.
9. Añadir a `app/globals.css` las reglas móviles de la tabla de ajustes (`.av-player`, `.crt`, `.crt-screen`, `.player-hud`, `.hud-stats`, `.hud-stat .v`, `.crt-bottom`) dentro de `@media (max-width: 720px)`. Verificable: a 360px de ancho la pantalla de juego no desborda horizontalmente.
10. Añadir las reglas móviles del modal, incluido `font-size: 16px` en el input. Verificable: en iOS real, enfocar el campo de iniciales no hace zoom.
11. Commitear `allowedDevOrigins` en `next.config.ts` con un comentario indicando que la IP es la de la red local de desarrollo y hay que ajustarla por máquina.
12. Verificación manual completa en un teléfono real sobre la LAN (lista de criterios de aceptación) y `npm run build`.

## Criterios de aceptación

- [ ] En un dispositivo táctil, `/juegos/asteroides/jugar` muestra el pad con ◀ ▶ a la izquierda y PROPULSOR / DISPARO a la derecha.
- [ ] En escritorio (ratón), el pad no aparece en ninguno de los cuatro juegos y la pantalla de juego se ve exactamente igual que antes de este spec.
- [ ] El pad no aparece en `/juegos/gloton/jugar`, `/juegos/invasores/jugar`, `/juegos/ranaria/jugar` ni `/juegos/duelo-pixel/jugar`.
- [ ] `asteroides`: se puede girar y disparar **a la vez** con dos dedos; el propulsor empuja mientras el dedo esté apoyado y deja de empujar al levantarlo.
- [ ] `caida`: ◀ ▶ ▼ mueven la pieza; mantener ◀ pulsado la desplaza de forma continua; ROTAR la gira una vez por toque y CAÍDA la deja caer una vez por toque.
- [ ] `bloque-buster`: ◀ ▶ mueven la paleta mientras el dedo esté apoyado y la paleta se detiene al levantarlo.
- [ ] `serpentina`: la cruz de cuatro botones cambia la dirección; pulsar la dirección opuesta a la de marcha no invierte la serpiente sobre sí misma.
- [ ] Deslizar el dedo fuera de un botón mientras está apretado suelta la tecla: ningún juego queda con una tecla marcada indefinidamente.
- [ ] Cambiar de pestaña o de app con un botón apretado y volver deja el juego pausado y sin ninguna tecla marcada.
- [ ] Tocar cualquier botón del pad no hace scroll, ni zoom por doble toque, ni selecciona texto, ni abre el menú contextual de mantener pulsado.
- [ ] El botón apretado muestra realimentación visual (borde y halo cian) mientras el dedo está apoyado.
- [ ] Con la partida en pausa o en fin de juego, el pad no envía eventos al juego.
- [ ] **Ningún archivo de `components/games/` fue modificado** (`git diff --stat components/games/` vacío).
- [ ] A 360px de ancho, `/juegos/caida/jugar` no tiene scroll horizontal y el HUD completo (Jugador, Puntuación, Vidas, Nivel) sigue siendo legible.
- [ ] A 360px de ancho, la pantalla del CRT ocupa el ancho disponible menos el marco, conservando su relación 4:3.
- [ ] En iOS Safari, enfocar el campo de iniciales del modal no hace zoom sobre la página.
- [ ] En un teléfono, el flujo completo funciona: jugar, perder, escribir iniciales, GUARDAR PUNTUACIÓN, ver la fila nueva en `/juegos/<id>` y en `/salon`.
- [ ] PAUSA, FIN y SALIR siguen siendo pulsables en móvil sin superponerse con el `SkinPicker`.
- [ ] Los cuatro juegos siguen siendo jugables con teclado físico exactamente como antes, incluidas las tres skins de SPEC 10.
- [ ] No hay errores ni advertencias de hidratación en la consola al cargar la pantalla de juego.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** un gamepad virtual que despacha `KeyboardEvent` sintéticos sobre `window`. **No:** gestos sobre el canvas dentro de cada juego. Los juegos ya definen su entrada como teclas y ese contrato está probado; emitirlo desde fuera deja los cuatro componentes intactos y hace que cualquier juego futuro herede el táctil con solo declarar su layout. Los gestos habrían exigido editar cuatro componentes y no resuelven Asteroides, que necesita tres entradas simultáneas.
- **Sí:** cada evento sintético lleva `code` **y** `key`. **No:** solo `code`. `BloqueBuster.tsx:247` lee `e.key`; sin ese campo sería el único juego que el pad no controla.
- **Sí:** `setPointerCapture` en cada botón. **No:** confiar en que el `pointerup` llegue al elemento donde empezó. Un dedo que se desliza fuera dejaría la tecla marcada para siempre — la nave girando sola hasta el fin de la partida. Es el fallo más probable de toda la feature.
- **Sí:** `pointerdown`/`pointerup`. **No:** `touchstart`/`touchend` ni `onClick`. Los eventos de puntero unifican dedo, lápiz y ratón en una sola ruta, y `onClick` solo se dispara al soltar, lo que haría imposible una tecla sostenida.
- **Sí:** el pad se renderiza siempre y CSS decide si se ve, vía `(pointer: coarse)`. **No:** detectar el táctil con `matchMedia` en JavaScript. Renderizar distinto en servidor y cliente produce el mismatch de hidratación que SPEC 10 ya evitó en la lectura de `localStorage`. Coste aceptado: en un portátil táctil el pad aparece aunque haya teclado.
- **Sí:** auto-repeat solo en ←/→/↓ de Tetris. **No:** repeat global. Tetris actúa una vez por `keydown`, así que sin repeat mover cinco columnas serían cinco toques; en cambio repetir ROTAR o CAÍDA cambiaría la jugabilidad, y en Asteroides `justPressed` ya ignora los repeats igual que con teclado físico.
- **Sí:** `lib/touch-controls.ts` como fuente de verdad separada del componente, espejando `lib/skins.ts`. **No:** los layouts embebidos en `TouchControls.tsx`. Mantiene los datos por juego en un sitio y el render en otro, y hace evidente si dos juegos se desalinean.
- **Sí:** montar el pad detrás de `hasTouchControls(game.id)`, el mismo patrón de `hasSkins` (`GamePlayer.tsx:174`). **No:** un `if` por nombre de juego. `CLAUDE.md` prohíbe explícitamente especializar un juego fuera del registro `REAL_GAMES`.
- **Sí:** vertical primero. **No:** obligar a horizontal con un aviso de "gira el dispositivo". Bloquear la orientación por defecto del teléfono para pedir la contraria es fricción antes de jugar; en vertical los cuatro juegos caben con el pad debajo.
- **Sí:** el pad dentro del marco del `.crt`, bajo `.crt-bottom`. **No:** flotante sobre la pantalla de juego. Sobre el canvas taparía parte del área jugable y rompería la ilusión del mueble que el reproductor ya construye.
- **Sí:** auto-pausa al ocultar la pestaña, sin auto-reanudar. **No:** reanudar solo al volver. Devolver el control a alguien que todavía no está mirando es peor que dejarlo pausado.
- **No:** vibración háptica. `navigator.vibrate` no existe en iOS Safari, así que sería una realimentación presente en la mitad de los dispositivos y ausente en la otra.
- **No:** botón de pantalla completa. La Fullscreen API no existe en Safari de iPhone y degradarla bien cuesta más de lo que aporta.
- **No:** `export const viewport` en `app/layout.tsx`. Next 16 ya inyecta `width=device-width, initial-scale=1`, que es exactamente lo que se quiere.
- **No:** `maximumScale: 1` ni `userScalable: false` para impedir el zoom. Bloquear el zoom del navegador es un fallo de accesibilidad conocido (WCAG 1.4.4); el zoom accidental se resuelve con `touch-action` en los controles, que es local y no le quita el zoom a nadie que lo necesite.
- **Sí:** commitear `allowedDevOrigins` en `next.config.ts`. Es configuración de desarrollo, no afecta a producción, y sin ella el dev server rechaza al teléfono. Se comenta que la IP es la de la red local de quien desarrolla.

## Riesgos identificados

| Riesgo                                                                                                                                                                       | Mitigación                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un dedo que se desliza fuera del botón no entrega `pointerup`, el `keyup` nunca se emite y la tecla queda marcada para siempre (nave girando sola, paleta pegada a un lado). | `setPointerCapture` en `pointerdown`, más `pointercancel` manejado igual que `pointerup`, más la red de seguridad en `blur`/`visibilitychange`/desmontaje. Hay un criterio de aceptación dedicado.                                      |
| Un `KeyboardEvent` sintético es `isTrusted === false`; el `preventDefault()` que los juegos llaman sobre él no hace nada.                                                    | No hace falta: el comportamiento por defecto del navegador se cancela en el `pointerdown` real y en `touch-action: none`. Se documenta para que nadie intente "arreglarlo" más tarde.                                                   |
| Los tres juegos que leen `e.code` y el que lee `e.key` divergen: un layout con un campo mal puesto produce un juego que no responde, sin error visible.                      | Ambos campos son obligatorios en `TouchButtonSpec` (no opcionales), así que TypeScript obliga a escribirlos. Cada juego tiene su propio criterio de aceptación.                                                                         |
| `(pointer: coarse)` también es verdadero en portátiles táctiles con teclado, donde el pad aparece sin hacer falta.                                                           | Coste aceptado y documentado: el pad no estorba y el teclado sigue funcionando en paralelo. Un interruptor manual queda fuera de alcance.                                                                                               |
| Tocar `GamePlayer.tsx` toca el único archivo que integra los cuatro juegos reales; un error ahí los rompe todos a la vez.                                                    | Los cambios son aditivos (un montaje condicional, un `useEffect`, una clase extraída) y no tocan `REAL_GAMES`, el modal, `resetKey` ni el estado de skin. Los criterios exigen reprobar los cuatro juegos con teclado y las tres skins. |
| El pad alarga la página y, con el CRT arriba, en pantallas cortas los botones podrían quedar fuera de la vista inicial.                                                      | El pad va dentro del `.crt`, inmediatamente bajo `.crt-bottom`, y las reglas móviles recortan el padding del marco y del reproductor. Criterio de aceptación a 360px de ancho.                                                          |
| `allowedDevOrigins` fija una IP de LAN concreta, que solo sirve en la red de quien lo escribió.                                                                              | Va comentado en `next.config.ts` como valor a ajustar por máquina. Es config de desarrollo y no tiene efecto en producción.                                                                                                             |

## Lo que **no** está en este spec

- Cualquier cambio dentro de `components/games/*.tsx`.
- Gestos sobre el canvas (swipe en Snake, arrastre de paleta en BloqueBuster).
- Layout optimizado para horizontal y aviso de orientación.
- Vibración háptica, pantalla completa e interruptor manual del pad.
- Auditoría móvil del resto del sitio.
- Controles táctiles para los juegos simulados.
- Cambios de jugabilidad, puntuación o resolución de canvas.
- PWA, manifest o soporte offline.

Cada uno de estos, si se necesita, va en su propio spec.
