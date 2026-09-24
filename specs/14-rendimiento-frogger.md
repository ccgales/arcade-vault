# SPEC 14 — Rendimiento de Frogger

> **Estado:** Implementado
> **Depende de:** `specs/game-jam/flogger/03-frogger-core.md` (implementación base), 10-skins.md (introduce los halos `shadowBlur` por paleta)
> **Fecha:** 2026-09-23
> **Objetivo:** Eliminar el costo de repintado por frame que el overlay CRT compartido y la animación de fondo del sitio fuerzan sobre el canvas de Frogger, para sostener 60 FPS estables tanto en desktop como en móvil.

---

## Por qué existe este spec

El usuario reportó tirones (stuttering) jugando Frogger. La hipótesis inicial — que el uso intensivo de `ctx.shadowBlur`/`ctx.shadowColor` en `FroggerGame.tsx` (unas 45 entidades por frame entre carriles de carretera y río) fuera el cuello de botella — se descartó con un benchmark sintético: reproducir el mismo patrón de dibujo (halo on/off por entidad) en un canvas offscreen cuesta ~0.3 ms/frame con halo vs. ~0.19 ms/frame sin él. Ambos números están muy por debajo del presupuesto de 16.7 ms para 60 fps, así que el halo del canvas no es, por sí solo, la causa del problema reportado.

No fue posible medir FPS reales en vivo durante esta sesión: el navegador controlado por el agente nunca reporta la pestaña como visible (`document.hidden === true` de forma persistente), y `GamePlayer.tsx` pausa el juego automáticamente cuando la pestaña está oculta (`app/GamePlayer.tsx`, listener de `visibilitychange`) — combinando ambos efectos, `requestAnimationFrame` no llegó a ejecutarse ni una sola vez en 6 s de espera real.

La revisión de código sí encontró dos candidatos estructurales, compartidos por `.crt-screen` y `.av-bg` (`app/globals.css`), que envuelven el canvas de **todo** juego real, no solo Frogger:

1. `.crt-screen::after` (las scanlines) usa `mix-blend-mode: multiply` directamente sobre el canvas. Un blend mode distinto de `normal` obliga al navegador a recomponer contra lo que hay debajo cada vez que ese contenido cambia — y el canvas de Frogger cambia en cada frame.
2. `.av-bg::before` (la grilla de fondo con perspectiva, presente en todo el sitio) anima `background-position` vía `@keyframes gridscroll`. Animar `background-position` no es compositable por GPU: fuerza _paint_ en el hilo principal en cada frame de la animación, a diferencia de animar `transform`.

Ninguno de los dos está confirmado con datos en vivo — son los sospechosos más plausibles encontrados por revisión de código, no una causa verificada. Por eso este spec no se detiene a perfilar antes de corregir (el entorno de esta sesión no lo permite); en su lugar aplica ambas correcciones de bajo riesgo directamente y deja la medición real como paso manual final, a cargo del usuario, con Chrome DevTools.

---

## Scope

**In:**

- `app/globals.css` → `.crt-screen::after`: quitar `mix-blend-mode: multiply`, sustituirlo por una superposición de opacidad plana (blend `normal`) que mantenga el mismo efecto visual de scanlines sin forzar recomposición dependiente del contenido inferior.
- ~~`app/globals.css` → `.av-bg::before` / `@keyframes gridscroll`: cambiar la animación de `background-position` a `transform: translate(...)`~~ — **descartado durante la implementación**, ver Paso 2 y "Decisiones".
- `components/games/FroggerGame.tsx` → `draw()`: agrupar las formas que llevan halo (coches, camiones, troncos, tortugas visibles, rana) y las que no, en dos pasadas, seteando `ctx.shadowBlur`/`ctx.shadowColor` una sola vez por pasada en vez de alternar on/off por cada entidad/forma individual. Optimización Frogger-específica de bajo riesgo (el benchmark mostró 1.63× de overhead relativo aunque el costo absoluto sea bajo).
- Verificación manual final (no automatizable en esta sesión): medir FPS reales en Chrome DevTools (Performance/Rendering panel) jugando Frogger en desktop y en un dispositivo o emulación móvil, antes y después del cambio.

**Fuera de alcance:**

- No se toca la lógica de juego, colisiones, puntuación, niveles ni ninguna mecánica descrita en `03-frogger-core.md`.
- No se audita ni se optimiza Asteroids, Tetris, Snake ni BloqueBuster en este spec. `.crt-screen` y `.av-bg` son CSS compartido — los cuatro se benefician igual del fix porque no existe (ni se justifica crear) una variante exclusiva de Frogger — pero eso es un efecto secundario, no el objetivo; no se agregan criterios de aceptación ni pruebas para ellos aquí.
- No se hace una auditoría de rendimiento general de la plataforma (fuera del canvas: React, `GamePlayer.tsx`, el `setInterval` del HUD simulado, etc.). Ese `setInterval` (`components/GamePlayer.tsx:109`) solo corre para catálogo simulado (`if (RealGame) return;`), no afecta a Frogger.
- No se cambia el patrón de doble HUD ni el throttling de `onStateChange` — ya está optimizado igual en los 5 juegos reales (compara valor anterior antes de notificar a React).
- No se introduce ningún sistema de calidad adaptativa (resolución dinámica, desactivar efectos según FPS medido) — YAGNI.
- No se perfila en vivo antes de implementar — el entorno de esta sesión no puede producir FPS reales; ver "Por qué existe este spec".
- No se toca `app/layout.tsx` ni se agregan elementos nuevos al DOM de `.av-bg`. Como consecuencia, `gridscroll` (`.av-bg::before`) se queda animando `background-position` tal como estaba — ver Paso 2 y "Decisiones" para el porqué.

---

## Data model

No se introduce ni modifica ninguna estructura de datos. Este spec es puramente de rendimiento de renderizado (CSS + orden de llamadas al contexto 2D).

---

## Implementation plan

1. **`.crt-screen::after` sin `mix-blend-mode`** (`app/globals.css`, selector actual en torno a la línea 1177):
   - Quitar `mix-blend-mode: multiply`.
   - Ajustar el `repeating-linear-gradient` de las scanlines (actualmente `rgba(0, 0, 0, 0.18) 0 2px, transparent 2px 4px`) a opacidad plana equivalente — probar valores hasta igualar visualmente el oscurecimiento que daba el `multiply` anterior.
     Verificación: capturar el `/juegos/frogger/jugar` antes y después; las líneas de escaneo deben seguir siendo perceptibles con un contraste similar.

2. ~~**`gridscroll` animado por `transform`, no por `background-position`**~~ — **Descartado.** `.av-bg::before` ya combina en el mismo pseudo-elemento el patrón de líneas (`background-position`, lo que se quería animar por `transform`), el `mask-image` que desvanece la grilla hacia el horizonte, y un `transform: perspective() rotateX()` fijo. `transform` mueve el elemento completo como bloque rígido: agregarle un `translateY` habría desplazado también la máscara, y como la traslación de geometría no es periódica contra ella (a diferencia del patrón, que sí lo es), el loop de 8 s terminaría con un salto visible en la línea de desvanecido en cada reinicio, en vez del scroll continuo actual. Una reescritura fiel requiere separar patrón (animado) y máscara/perspectiva (fija) en dos elementos — hoy `.av-bg` es un único `<div>` sin hijos (`app/layout.tsx:36`) — lo cual excede el alcance declarado (`app/globals.css` únicamente). Se decidió, junto al usuario, dejar `gridscroll` tal como estaba. Queda registrado como riesgo abierto.

3. **Agrupar el halo en `FroggerGame.tsx` `draw()`** (líneas ~506–572 actuales):
   - Primera pasada: dibujar todas las entidades y la rana con `ctx.shadowBlur`/`ctx.shadowColor` seteado una vez al valor que corresponda por tipo (si los valores de glow difieren entre tipos de entidad, agrupar por valor de glow en vez de alternar on/off por forma).
   - Segunda pasada (o continuación de la misma, sin halo): dibujar detalles sin halo (ruedas, cabina, veta del tronco, caparazón de tortuga, ojos de la rana) con `ctx.shadowBlur = 0` seteado una sola vez antes de esa pasada.
     Verificación: el resultado visual es idéntico al actual (mismos halos en los mismos elementos); el número de asignaciones a `ctx.shadowBlur` por frame baja de ~2 por entidad a un puñado fijo por frame.

4. **Verificación manual final** (a cargo del usuario, fuera de esta sesión):
   - Abrir `/juegos/frogger/jugar` en Chrome real (no automatizado), DevTools → Performance, grabar ~10 s de gameplay activo en nivel 3+ (tráfico y río llenos de entidades).
   - Confirmar frame time promedio ≤16.7 ms (60 fps) y ausencia de "long tasks" recurrentes atribuibles a Recalculate Style / Paint del overlay o del fondo.
   - Repetir la misma medición en un dispositivo móvil real o en la emulación de DevTools a 390px de ancho.

5. **`npm run build`** sin errores de TypeScript ni de lint.

---

## Criterios de aceptación

- [x] `.crt-screen::after` ya no usa `mix-blend-mode: multiply`; el efecto de scanlines sigue siendo visualmente perceptible con un contraste similar al anterior. Verificado por captura en `/juegos/frogger/jugar`.
- [x] ~~`.av-bg::before` anima `transform` en vez de `background-position`~~ — **N/A, descartado** (ver Paso 2 y "Decisiones"). `gridscroll` se queda animando `background-position` como antes de este spec.
- [x] `FroggerGame.tsx` agrupa las llamadas de dibujo con halo en pasadas fijas por frame, sin alternar `ctx.shadowBlur` on/off por cada entidad individual.
- [x] El resultado visual de Frogger (colores, halos, scanlines, grilla de fondo) es indistinguible a ojo del estado anterior a este spec. Verificado por captura y zoom de detalle (coches, troncos, tortugas visibles/sumergidas).
- [x] Asteroids, Tetris, Snake y BloqueBuster siguen renderizando sin cambios de comportamiento tras el cambio de CSS compartido (regresión visual, no funcional). Verificado por captura en las cuatro rutas (`/juegos/asteroides/jugar`, `/juegos/caida/jugar`, `/juegos/serpentina/jugar`, `/juegos/bloque-buster/jugar`).
- [x] `/juegos/frogger/jugar` carga y se juega sin errores de consola.
- [ ] Medido manualmente en Chrome DevTools (Performance panel) durante gameplay activo en desktop: frame time promedio ≤16.7 ms (60 fps). **Pendiente — a cargo del usuario**, el entorno de esta sesión no puede producir FPS reales (ver "Por qué existe este spec").
- [ ] Medido manualmente en un dispositivo o emulación móvil: frame time promedio ≤16.7 ms, o al menos una mejora medible frente al estado previo a este spec si no se alcanza el objetivo. **Pendiente — a cargo del usuario**, mismo motivo.
- [x] `npm run build` completa sin errores de TypeScript. Build de producción corrido: compiló y generó todas las rutas sin errores.

---

## Decisiones tomadas y descartadas

- **Sí: corregir `.crt-screen` y `.av-bg` aunque el alcance nominal es "solo Frogger"** — Razón: son las únicas clases CSS que envuelven el canvas de todo juego real; no existe una variante exclusiva de Frogger ni se justifica crear una solo para este spec. El efecto secundario (los demás juegos y el resto del sitio se benefician también) es aceptado pero no auditado aquí.

- **Sí: agrupar el `shadowBlur` en `FroggerGame.tsx` como optimización Frogger-específica** — Razón: es el único archivo exclusivo de Frogger que se toca en este spec; el benchmark sintético mostró un costo absoluto bajo (~0.3 ms/frame) pero un 1.63× de overhead relativo evitable sin riesgo visual ni de complejidad.

- **No: perfilar en vivo antes de implementar** — Razón: el entorno de este agente no puede producir FPS reales (la pestaña automatizada nunca queda visible para Chrome, y la propia app pausa el juego cuando `document.hidden`); se procede directo a las dos correcciones estructurales identificadas por revisión de código + benchmark sintético, dejando la medición real como paso manual final del usuario.

- **No: sistema de calidad adaptativa (resolución dinámica, desactivar efectos según FPS)** — Razón: YAGNI; la plataforma no tiene la complejidad ni el público que lo justifique hoy.

- **No: auditoría o fix de los demás 4 juegos reales en este spec** — Razón: el usuario acotó el alcance a Frogger. Si el problema persiste en otros juegos tras este fix compartido, se abre un spec de auditoría dedicado.

- **No: reescribir `gridscroll` por `transform`, descubierto durante la implementación del Paso 2** — Razón: `.av-bg::before` combina patrón, máscara y perspectiva fija en un solo pseudo-elemento; animar `transform` movería la máscara junto con el patrón y produciría un salto visible cada 8 s al reiniciar el loop. Una reescritura fiel exige separar patrón y máscara en dos elementos reales, lo que implica tocar `app/layout.tsx` — fuera del alcance declarado (`app/globals.css` únicamente). Decidido junto al usuario: se deja `gridscroll` sin tocar y se documenta como riesgo abierto en vez de arriesgar una regresión visual o ampliar el alcance sin acuerdo explícito.

---

## Riesgos identificados

- **El cambio de `mix-blend-mode` a opacidad plana puede alterar ligeramente el aspecto visual de las scanlines** (contraste/oscurecimiento). Mitigación: ajustar el valor de opacidad a ojo hasta igualar el resultado visual previo antes de dar el paso por terminado.
- **Ninguna de las dos correcciones estructurales está confirmada como la causa real del stuttering reportado**, al no haber podido medir en vivo. Mitigación: el paso de verificación manual final (paso 4) es obligatorio; si no hay mejora medible, se reabre la investigación con datos reales del usuario (grabación de Performance de DevTools) en vez de seguir adivinando por revisión de código.
- **`gridscroll` (`.av-bg::before`) se queda animando `background-position`, sin corregir** — de las dos correcciones estructurales identificadas, solo una (el `mix-blend-mode` de `.crt-screen::after`) se implementó; la otra se descartó por requerir tocar `app/layout.tsx` (ver "Decisiones"). Si el paso de verificación manual final muestra que el costo de paint de `gridscroll` sigue siendo significativo, hace falta un spec aparte que sí incluya `app/layout.tsx` en su alcance para separar patrón y máscara en dos elementos.
