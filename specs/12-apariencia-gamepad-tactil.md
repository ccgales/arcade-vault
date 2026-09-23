# 12 · Apariencia visual del gamepad táctil

- **Estado:** Borrador
- **Depende de:** SPEC 11
- **Fecha:** 2026-09-21
- **Objetivo:** Reemplazar por completo la sección "Diseño del gamepad" de SPEC 11 por el lenguaje visual de `references/gamepad-assets/` (panel redondeado, cruceta de botones rectangulares con hub central luminoso, botones de acción circulares sin texto), sin tocar ninguna de las reglas funcionales que SPEC 11 ya define.

## Por qué existe este spec

SPEC 11 (Aprobado) define el gamepad táctil completo: los cuatro layouts por juego, el despacho de eventos de teclado sintéticos, `setPointerCapture`, el auto-repeat de Tetris, la auto-pausa por `visibilitychange` y también una sección de diseño propia — botones rectangulares, glifos para dirección, palabras completas (`PROPULSOR`, `DISPARO`, `ROTAR`, `CAÍDA`) para las acciones. Ese spec todavía no tiene código: no existen ni `lib/touch-controls.ts` ni `components/TouchControls.tsx`.

El usuario aportó un componente de referencia ya diseñado (`references/gamepad-assets/gamepad.html`, capturado en `gamepad-neon.png`): un panel con marco redondeado, una cruceta de botones con esquinas cortadas suaves y un hub central con una gema que parpadea, y dos botones de acción circulares al estilo A/B de un control de consola. Ese lenguaje visual es distinto del que describe SPEC 11 y más elaborado, así que en vez de reabrir un spec Aprobado, este documento reemplaza únicamente su sección de diseño. SPEC 11 sigue siendo la única fuente de verdad para `TOUCH_LAYOUTS`, el despacho de eventos y los criterios de accesibilidad no visuales; quien implemente el componente (`/spec-impl 11`) debe construir la piel siguiendo este spec.

## Scope

**Dentro:**

- Reescribir la piel completa del gamepad táctil: el panel contenedor, los botones de dirección (grupo `dpad`) y los botones de acción (grupo `actions`), tomando medidas, colores y estructura de `references/gamepad-assets/gamepad.html`.
- Un hub central decorativo con gema romboidal parpadeante, condicionado a que el layout del juego tenga botones en ambos ejes alrededor del centro (hoy, solo `serpentina`).
- Los botones de acción como círculos de color sólido (cian / magenta) **sin ninguna palabra ni glifo visible dentro** — solo color y `aria-label`.
- Asignación de color por posición dentro del grupo `actions`: el primer botón del layout usa la paleta cian, el segundo la paleta magenta, sin importar el juego.
- Reutilización estricta de los tokens ya existentes en `globals.css` (`--cyan`, `--magenta`, `--pixel`) y de las fuentes ya cargadas en `app/layout.tsx` (`Press Start 2P`, `JetBrains Mono`). Cero colores o fuentes nuevos.
- Guarda de `prefers-reduced-motion: reduce` para la animación del hub, con el mismo criterio que ya usa `.btn` en el sitio.
- Los tamaños mínimos de botón que SPEC 11 ya exige (56px de alto) se conservan; las proporciones del asset se escalan para cumplirlos, no se copian sus píxeles literales.

**Fuera de alcance (para futuros specs o para SPEC 11 tal cual queda):**

- Cualquier cambio a la lógica de `lib/touch-controls.ts` más allá de dejar de renderizar `label` como texto visible en el grupo `actions` — el campo se sigue definiendo (`TouchButtonSpec` lo exige) y se sigue usando para `aria`.
- El despacho de eventos, `setPointerCapture`, el auto-repeat, la auto-pausa y los layouts por juego (`TOUCH_LAYOUTS`): todo eso es de SPEC 11 y no cambia.
- Qué juegos tienen pad (`hasTouchControls`) o qué botones existen por juego: sin cambios.
- El halo/resplandor difuso hacia afuera de todo el panel que tiene el asset (`box-shadow` grande sobre `.gp`). Descartado: el panel ya vive dentro del marco `.crt`, que aporta su propio resplandor.
- La textura de puntos de fondo del asset (`.gp::after`, `radial-gradient` repetido). Descartada por ser puramente decorativa.
- Adaptar el color del pad a la skin activa del juego (`clasico`/`neon`/`retro` de SPEC 10). El pad es chrome fijo del reproductor, igual que `.crt-bottom` o el propio `SkinPicker`, no parte del canvas del juego.
- Cualquier cambio dentro de `components/games/*.tsx` (igual que exige SPEC 11).
- Layout horizontal, vibración háptica, pantalla completa: siguen fuera de alcance por las mismas razones que en SPEC 11.

## Modelo de datos

Este spec no agrega ni modifica ninguna estructura de datos. Reutiliza `TouchButtonSpec`/`TouchLayout`/`TOUCH_LAYOUTS` tal como los define SPEC 11; el único efecto sobre el dato es que el campo `label` de los botones del grupo `actions` deja de usarse para render visual (sigue existiendo, y sigue siendo la base del `aria-label`).

## Diseño del gamepad (reemplaza la sección homónima de SPEC 11)

### Panel contenedor

- Fondo: `linear-gradient(180deg, #1c1c28 0%, #0c0c14 100%)`.
- Borde: `1px solid rgba(0, 245, 255, .18)` — expresado con `--cyan` al 18% de opacidad, no un color nuevo.
- Radio: `22px` en escritorio, `16px` bajo `max-width: 720px` (el breakpoint que SPEC 11 ya fija, no el `620px` del asset).
- Borde interior decorativo vía pseudo-elemento (`::before`): `inset: 4px`, `1px solid rgba(0, 245, 255, .14)`, radio `18px`.
- Padding: `16px 22px 14px` en escritorio, `12px 14px 10px` en móvil.
- Este panel es la piel de `.touch-controls`, que SPEC 11 ya ubica dentro del `.crt`, bajo `.crt-bottom`: cambia de aspecto, no de posición.

### Grupo `dpad`

- Rejilla de 3×3 con celdas de `50px` (`46px` en móvil), igual criterio de posicionamiento por `cell` (`up`/`down`/`left`/`right`/`wide`) que ya define SPEC 11.
- Cada botón: rectángulo con esquinas redondeadas (`border-radius: 10px`), fondo `linear-gradient(180deg, #1a1a25, #0a0a12)`, borde `1px solid rgba(255,255,255,.05)`, sombra de reposo `0 4px 0 #050507` más resaltes internos sutiles.
- Estado presionado (clase de estado, nunca `:active` — SPEC 11 ya explica por qué en táctil no es fiable): `translateY(3px)`, color y borde en `var(--cyan)`, fondo `linear-gradient(180deg, #08161e, #030a0e)`, `box-shadow: 0 1px 0 #050507, inset 0 0 16px rgba(0,245,255,.45), 0 0 16px rgba(0,245,255,.5)`. El glifo interno gana `filter: drop-shadow(0 0 6px var(--cyan)) drop-shadow(0 0 12px var(--cyan))`.
- **Hub central:** un `div` decorativo (`aria-hidden="true"`, no es un botón) con una gema romboidal (`clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%)`) de `12px`, color `var(--cyan)`, halo `box-shadow: 0 0 10px var(--cyan), inset 0 0 4px rgba(0,0,0,.5)`, y `animation: pulse-led 2s ease-in-out infinite` (opacidad 1→0.35, escala 1→0.85 en el punto medio). Se renderiza **solo** cuando el layout del juego coloca botones en ambos ejes alrededor del centro (al menos uno vertical y uno horizontal): hoy únicamente `serpentina`, que usa la cruz completa. `asteroides` (solo izquierda/derecha) y `bloque-buster` (`cell: "wide"`, una sola fila) no forman una cruz real y no muestran hub.
- Bajo `prefers-reduced-motion: reduce`, la gema queda fija (sin `pulse-led`), mismo criterio que el resto del sitio.

### Grupo `actions`

- Solo existe para `asteroides` y `caida`, igual que hoy define SPEC 11; `bloque-buster` y `serpentina` no tienen columna de acciones.
- Cada botón es un círculo (`border-radius: 50%`) de `74px` en escritorio, `64px` en móvil — ambos por encima del mínimo de 56px que exige SPEC 11.
- Relleno con doble `radial-gradient` (brillo superior sutil + degradado medio→profundo del color propio) y borde `2px solid` del mismo color; sombra `0 6px 0 #050507` más el glow del color propio (`0 0 22px var(--ab-glow)`) e insets de profundidad.
- **Asignación de color por posición, no por juego ni por función:** el primer botón del array `actions` del layout (`PROPULSOR` en asteroides, `ROTAR` en caída) usa la paleta cian; el segundo (`DISPARO`, `CAÍDA`) usa la paleta magenta. Reproduce el B-cian/A-magenta del asset con una regla estable que no requiere tocar `TOUCH_LAYOUTS`.
- **Sin `label` visible dentro del círculo.** No se renderiza palabra ni glifo alguno; el círculo queda limpio, solo color. El nombre completo de la acción sigue siendo el `aria-label` del botón (SPEC 11 ya lo exige), así que un lector de pantalla sigue anunciando "Disparo" o "Rotar" aunque visualmente no haya texto.
- Anillo punteado decorativo (`border: 1px dashed currentColor`, `inset: -8px`) que solo se muestra en el estado presionado — no hay estado de `hover` real en táctil.
- Estado presionado: `translateY(4px) scale(.97)`, `box-shadow: 0 1px 0 #050507, 0 0 36px var(--ab-glow), inset 0 0 18px rgba(0,0,0,.5)`, anillo visible y ligeramente escalado.

### Consistencia de tokens

- Todo el color sale de `--cyan` (`#00f5ff`) y `--magenta` (`#ff006e`), ya definidos en `:root` de `globals.css` — son literalmente los mismos valores que usa el asset de referencia, así que no hay conversión de paleta.
- No se agregan variables nuevas tipo `--ink`/`--ink-dim` del asset: los grises de fondo de los botones se escriben como los mismos literales del asset (`#1a1a25`, `#0a0a12`, etc.), consistentes con cómo `.crt`/`.player-hud` ya usan grises literales en vez de variables para sus fondos.
- No se importa ninguna fuente nueva: `Press Start 2P` (`--font-press-start-2p`) y `JetBrains Mono` ya están cargadas vía `next/font/google` en `app/layout.tsx`.

## Plan de implementación

Estos pasos asumen que se ejecutan como parte de (o inmediatamente después de) la implementación funcional de SPEC 11, ya que ambos specs describen el mismo componente.

1. Al construir la estructura visual de `TouchControls.tsx` (paso 2 del plan de SPEC 11), usar el marcado de este spec: panel con pseudo-elemento de borde interior, grupo `dpad` en rejilla 3×3, grupo `actions` en fila de círculos. Verificable: montado a mano en `/juegos/serpentina/jugar`, el panel se ve con esquinas redondeadas y estructura de rejilla, sin lógica de eventos todavía.
2. Añadir el hub central condicional: se renderiza solo cuando el layout del juego actual tiene botones en ambos ejes alrededor del centro. Verificable: `serpentina` muestra el hub con gema; `asteroides` y `bloque-buster` no muestran ningún hub.
3. Escribir los estilos de reposo y presionado del grupo `dpad` en el bloque `.touch-controls` de `globals.css` (dentro del paso 3/4 de SPEC 11). Verificable: en el emulador de dispositivos de DevTools, los botones de dirección se ven equivalentes a `gamepad-neon.png` y se iluminan en cian al mantenerlos pulsados.
4. Escribir los estilos de los círculos de acción, incluida la asignación cian/magenta por posición dentro del array `actions` del layout. Verificable: en `asteroides`, PROPULSOR es cian y DISPARO es magenta; en `caida`, ROTAR es cian y CAÍDA es magenta; ningún círculo muestra texto.
5. Animación `pulse-led` del hub con guarda de `prefers-reduced-motion: reduce`. Verificable: con "reducir movimiento" activado en el sistema operativo, la gema de `serpentina` queda fija.
6. Verificación visual final: comparar los cuatro juegos contra `references/gamepad-assets/gamepad-neon.png` en un dispositivo real y en el emulador de DevTools a 360/390/768px, y correr los criterios de aceptación funcionales de SPEC 11 sin cambios (nada de esta piel debe romper el despacho de eventos).

## Criterios de aceptación

- [ ] El panel del pad tiene esquinas redondeadas (22px escritorio / 16px móvil), fondo degradado oscuro y borde cian tenue, visualmente equivalente a `gamepad-neon.png`.
- [ ] `serpentina` muestra un hub central con una gema romboidal cian que parpadea; `asteroides` y `bloque-buster` no muestran hub.
- [ ] Los botones de dirección son rectángulos de esquinas redondeadas (no círculos) que se iluminan en cian al presionarlos, mediante una clase de estado y no `:active`.
- [ ] Los botones de acción de `asteroides` y `caida` son círculos sin ninguna palabra ni glifo visible dentro.
- [ ] En `asteroides`, el círculo de PROPULSOR es cian y el de DISPARO es magenta; en `caida`, ROTAR es cian y CAÍDA es magenta.
- [ ] Cada botón de acción conserva su `aria-label` con el nombre completo de la acción, verificable en el árbol de accesibilidad de DevTools.
- [ ] `bloque-buster` no muestra ningún círculo de acción; su layout sigue siendo solo dos flechas anchas.
- [ ] Con "reducir movimiento" activado en el sistema operativo, la gema del hub de `serpentina` no parpadea.
- [ ] Ningún color ni fuente nuevos se agregan a `globals.css` fuera de `--cyan`/`--magenta`/`--pixel` ya existentes.
- [ ] Todos los botones del pad, en cualquier juego, miden al menos 56px de alto.
- [ ] Todos los criterios de aceptación funcionales de SPEC 11 (despacho de eventos, pointer capture, auto-repeat, auto-pausa, layouts por juego) se cumplen sin cambios con esta piel puesta.
- [ ] `git diff --stat components/games/` vacío.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** un spec nuevo (12) que reemplaza solo la sección "Diseño del gamepad" de SPEC 11. **No:** editar SPEC 11 in place. Aunque SPEC 11 todavía no tiene código, reabrir un documento Aprobado borra el rastro de qué cambió y por qué; un spec nuevo deja ambas decisiones documentadas por separado.
- **Sí:** botones de acción circulares sin ningún texto ni glifo dentro, solo color y `aria-label`. **No:** la palabra completa dentro del círculo, ni un glifo/ícono sustituto. Decisión explícita del usuario: prioriza la fidelidad visual al asset (círculos limpios estilo A/B) sobre la regla original de SPEC 11 de que "la acción se reconoce por nombre"; la accesibilidad no visual queda cubierta por `aria-label`.
- **Sí:** paleta cian/magenta asignada por posición dentro del array `actions` (primero cian, segundo magenta). **No:** colores fijos por función (p. ej. disparo siempre de un color específico). Mantiene una regla simple y estable sin tocar `TOUCH_LAYOUTS` de SPEC 11.
- **Sí:** gema central parpadeante en el hub, con guarda de `prefers-reduced-motion`. **No:** dejarla estática. Decisión explícita del usuario: es decoración ambiental del mueble, no realimentación de un control, así que no contradice la regla de SPEC 11 de "sin animaciones nuevas" en los botones.
- **Sí:** el hub solo aparece cuando el layout forma una cruz real (ambos ejes). **No:** mostrarlo siempre como ancla decorativa del grupo `dpad`. Un hub flotando sobre dos botones en fila (asteroides, bloque-buster) no tiene centro real que anclar y se leería como un error de layout.
- **No:** halo/resplandor difuso hacia afuera del panel completo. Descartado por decisión explícita del usuario; el panel ya vive dentro del marco `.crt`, que aporta su propio resplandor, y uno adicional competiría con él.
- **No:** textura de puntos de fondo del asset. Descartada por decisión explícita del usuario — puramente decorativa, sin aporte a la lectura del pad.
- **No:** adaptar el color del pad a la skin activa del juego (SPEC 10). El pad es chrome fijo del reproductor, no parte del canvas; mezclar los dos sistemas de color complicaría ambos sin necesidad.
- **Sí:** conservar el mínimo de 56px de alto por botón que ya exige SPEC 11, escalando las proporciones del asset (50px/46px en el original) en vez de copiarlas literalmente. **No:** el tamaño exacto del asset. La accesibilidad táctil (Apple HIG / Material) no se negocia por fidelidad estética.
- **Sí:** reutilizar `--cyan`/`--magenta`/`--pixel` y las fuentes ya cargadas en `app/layout.tsx`. **No:** los `<link>` de Google Fonts del `gamepad.html` de referencia. Importarlos de nuevo duplicaría fuentes que el sitio ya sirve.

## Riesgos identificados

| Riesgo | Mitigación |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La regla del hub ("solo con cruz completa") es correcta hoy para los cuatro layouts, pero un layout futuro podría tener una combinación ambigua (por ejemplo, solo arriba/abajo, sin izquierda/derecha). | La regla queda documentada explícitamente en este spec; cualquier layout nuevo debe revisarla antes de asumir que el hub aparece o no. |
| Sin texto en los botones de acción, un jugador nuevo sin memoria muscular no sabe qué hace cada círculo hasta probarlo. | Aceptado por decisión explícita del usuario; es el mismo comportamiento que un control físico real (A/B sin descripción). Si hiciera falta, un spec futuro puede añadir una pista visual fuera del pad. |
| Este spec deja la sección de diseño de SPEC 11 obsoleta sin marcarla como tal dentro del propio archivo 11, porque este spec no reabre documentos Aprobados. | Quien implemente el gamepad (`/spec-impl 11`) debe leer también SPEC 12 antes de construir la piel; ambos specs quedan enlazados por la cabecera `Depende de: SPEC 11` de este documento. |

## Lo que **no** está en este spec

- Cualquier cambio a la lógica de despacho de eventos, `setPointerCapture`, auto-repeat o auto-pausa de SPEC 11.
- Cambios a `TOUCH_LAYOUTS` o a qué juegos tienen pad.
- Halo difuso alrededor del panel completo y textura de puntos de fondo del asset.
- Adaptación del color del pad a las skins de juego de SPEC 10.
- Cualquier cambio dentro de `components/games/*.tsx`.
- Layout horizontal, vibración háptica, pantalla completa, interruptor manual del pad.

Cada uno de estos, si se necesita, va en su propio spec.
