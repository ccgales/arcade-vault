# 13 · Porte móvil del sitio (zona por zona)

- **Estado:** En progreso (1 de 7 zonas)
- **Depende de:** SPEC 11 (doctrina), SPEC 06
- **Fecha:** 2026-09-22
- **Objetivo:** Portar a móvil las siete zonas del sitio que **no** son el reproductor, una zona por corrida, midiendo cada una en un Chrome real a 360/390/768px en vez de afirmar a ojo que se ve bien.

> **Nota de numeración.** El agente `mobile-porter` tiene asignado `specs/12-porte-movil-del-sitio.md`,
> pero `12` ya estaba ocupado por `12-apariencia-gamepad-tactil.md`. Este spec toma el `13` para no
> destruir un documento existente.

## Por qué existe este spec

SPEC 11 dejó explícitamente fuera de alcance la "auditoría móvil del resto del sitio (`/`, `/biblioteca`, `/salon`, `/acerca-de`, `/auth`)", con el argumento de que "ya tienen media queries propias y no son el bloqueo que el usuario reportó". Es cierto que tienen media queries, y es cierto que no eran el bloqueo. No es cierto que estén bien: las media queries existentes ajustan sobre todo `padding` y número de columnas, y ninguna se verificó con una medición.

El problema de fondo es que `body { overflow-x: hidden }` (`globals.css:55`) **esconde** cualquier desborde horizontal detrás de un scroll que no existe. Una zona puede estar 33px fuera del viewport y parecer perfecta en una captura. Sin una sonda que compare `getBoundingClientRect().right` contra `document.documentElement.clientWidth`, el defecto es invisible. Por eso este spec no acepta ninguna afirmación visual como evidencia.

## Doctrina heredada de SPEC 11

Este spec no reimplementa nada de SPEC 11 — toma prestados sus umbrales, que ya están justificados allí:

| Criterio             | Valor            | Origen                                                               |
| -------------------- | ---------------- | -------------------------------------------------------------------- |
| Breakpoint canónico  | `720px`          | SPEC 11 "Ajustes de layout móvil"; ya lo usan 5+ bloques del archivo |
| Breakpoint auxiliar  | `520px`          | ya en `globals.css:1369, :1939, :2617` y en `.modal .input-row`      |
| Target táctil mínimo | `44×44px`        | Apple HIG / 48dp Material                                            |
| `font-size` de input | `≥ 16px`         | auto-zoom de iOS Safari, que **no revierte** al salir del campo      |
| Zoom del navegador   | nunca se bloquea | WCAG 1.4.4; Next 16 ya inyecta el viewport correcto                  |

## Scope

**Dentro:** las siete zonas de `references/mobile-porting.md` (`home`, `biblioteca`, `detalle`, `salon`, `acerca-de`, `auth`, `marco`), una por corrida, sobre `app/globals.css` y el componente de cada zona.

**Fuera de alcance:** todo lo que es SPEC 11 — `/juegos/[id]/jugar`, el gamepad virtual, y los selectores `.av-player`, `.crt*`, `.player-hud`, `.hud-*`, `.modal*`, `.touch-controls`. Tocarlos aquí produciría un conflicto de merge con `/spec-impl 11`. También fuera: `lib/`, `supabase/`, `app/api/`, `next.config.ts`, y `app/layout.tsx` salvo el `style` inline de su `<footer>` (zona `marco`).

## Método de medición

Toda zona se mide antes y después, en Chrome real, a **360 / 390 / 768** px, más **1280** como control de regresión de escritorio.

Sonda de desbordes:

```js
[...document.querySelectorAll("*")]
  .filter(
    (el) =>
      el.getBoundingClientRect().right >
      document.documentElement.clientWidth + 1,
  )
  .map((el) => ({
    tag: el.tagName,
    cls: el.className,
    right: el.getBoundingClientRect().right,
  }));
```

Sonda de targets táctiles:

```js
[...document.querySelectorAll('a, button, input, select, [role="button"]')]
  .map((el) => el.getBoundingClientRect())
  .filter((r) => r.height < 44 || r.width < 44);
```

### Nota de instrumentación

La ventana de Chrome del entorno está maximizada y `resize_window` no altera el viewport (`window.innerWidth` se queda en 1536 tras redimensionar). La medición se hace por tanto con un **iframe del mismo origen** con `width` CSS exacta: las media queries se evalúan contra el viewport del iframe y las sondas corren sobre `iframe.contentDocument`. Los números son reales.

Consecuencia a tener presente al leer las tablas: el iframe tiene barra de scroll clásica de 15px, así que un iframe de 360px da `clientWidth = 345`. Es un margen **conservador** — un teléfono real tiene 15px más de holgura, nunca menos.

## Zona `detalle` — `/juegos/[id]` (`components/GameDetail.tsx`)

### Lo que se midió (antes)

| Ancho | Hallazgo                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------- |
| 360   | `.stat-strip` reparte las pistas 86/125/100px en vez de a partes iguales                                 |
| 360   | `★ ★ ★ ☆ ☆` envuelve a **3 líneas**; la franja se infla a 121px de alto                                  |
| 360   | con récord de 6 cifras (`123.456`) la franja llega **justo al borde** (+1px)                             |
| 360   | con récord de 7 cifras (`1.234.567`) la franja **desborda 33px** y arrastra 15 elementos de `.av-detail` |
| 390   | `★ ★ ★ ☆ ☆` envuelve a 2 líneas; pistas 107/125/107px                                                    |
| 360   | `.detail-actions`: botones de 290px y 266px → borde derecho dentado                                      |
| 360   | fecha de `.lb-row` a 10px, fijada por un `style` inline: **inalcanzable para cualquier media query**     |
| 768   | limpio                                                                                                   |

### La causa raíz

`.stat-strip { grid-template-columns: repeat(3, 1fr) }`. En CSS Grid, `1fr` es `minmax(auto, 1fr)`: la pista **no puede encoger por debajo de su contenido**. Con tipografía pixel a 16px, un número de siete caracteres mide ~145px y empuja la pista; como `.av-detail` es un grid cuya columna se dimensiona a ese contenido, el empujón se propaga a la portada, las etiquetas, las acciones y el marcador enteros. Todo ello invisible tras `overflow-x: hidden`.

### Lo que se hizo

1. **`minmax(0, 1fr)`** en `@media (max-width: 720px)`. El `0` es el arreglo real: permite que la pista encoja por debajo de su contenido y corta la propagación del desborde de raíz.
2. **`.stat-strip .v` a 14px** bajo 720px. 16px de tipografía pixel no caben en una pista de ~80px. Es el mismo ajuste, por el mismo motivo, que SPEC 11 aplica a `.hud-stat .v` (16px → 13px).
3. **Bajo 520px, la franja se apila** en tres filas `etiqueta | valor`, con el valor alineado a la derecha. Ni tres pistas iguales bastan a 360px: una fila completa de 313px sí admite en una sola línea tanto un récord de siete cifras como las cinco estrellas. La decisión visual es deliberada: al apilarse, la franja adopta el ritmo `rk | pl | sc` de `.lb-row`, que está inmediatamente debajo, y la página de detalle se lee como un único panel de instrumentos en vez de como una rejilla que se rompió.
4. **Bajo 520px, `.detail-actions .btn { flex: 1 1 100% }`**: las dos acciones ocupan el ancho completo y desaparece el borde dentado.
5. **Se extrajo el `style` inline de la fecha** del marcador a `.lb-row .lb-date`, con **los mismos valores** (10px, `--ink-faint`, `0.1em`), y se sube a 11px bajo 720px. Un `style` inline no se puede ajustar por media query — el mismo problema que SPEC 11 resolvió extrayendo `.hud-stats`.

### Lo que **no** se hizo, y por qué

- **`.detail-tags span` a 9px** se deja como está. Es la tipografía de chip de la casa (`.btn` usa 10px) y está presente en todo el sitio; agrandarla solo en `detalle` partiría la consistencia sin resolver ningún defecto medido.
- **`.detail-cover`** conserva su `aspect-ratio: 16/10`: a 360px da 313×196px, sin desborde.
- **Utilidades Tailwind `sm:`/`md:`/`lg:`**: prohibidas. El repo no tiene ninguna hoy y mezclarlas partiría el sistema de estilos en dos convenciones.

### Verificación (después)

| Ancho | Desbordes en `.av-detail` | Targets < 44px | Récord de 7 cifras             |
| ----- | ------------------------- | -------------- | ------------------------------ |
| 360   | 0                         | 0              | cabe, 1 línea, 16px de holgura |
| 390   | 0                         | 0              | cabe, 1 línea, 16px de holgura |
| 768   | 0                         | 0              | sin cambios                    |
| 1280  | 0                         | 0              | sin cambios                    |

Regresión de escritorio a 1280px, valores computados idénticos a los de antes: `.stat-strip` en tres pistas de 226px, `.stat-strip > div` `display: block` con `padding: 14px`, `.v` a 16px / `margin-top: 6px` / `text-align: start`, `.lb-date` a 10px / `rgb(74,79,112)` / `1px`, `.lb-row` de 55px de alto, botones de 290px y 266px con `flex: 0 1 auto`.

`npm run build` compila sin errores de tipos ni de lint. `git diff --stat components/games/ components/GamePlayer.tsx` no contiene ningún cambio de esta corrida.

## Hallazgos de otras zonas (registrados, no corregidos)

Medidos de paso al cargar `/juegos/frogger` a 360px. Pertenecen a la zona `marco` (`components/Nav.tsx`) y se corrigen en su propia corrida, no en ésta:

| Elemento               | Síntoma                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `.btn.ghost.hamburger` | `right: 402` con `clientWidth: 345` → 57px fuera                        |
| `.btn.ghost.hamburger` | 56×41px → 3px por debajo del umbral de 44                               |
| `.logo`                | 119×36px → 8px por debajo del umbral de 44                              |
| `.av-mobile-panel`     | `right: 654` — patrón off-canvas, previsiblemente correcto, a confirmar |

## Criterios de aceptación (por zona)

- [ ] Cero elementos de la zona con `right > clientWidth + 1` a 360, 390 y 768px.
- [ ] Cero elementos interactivos de la zona bajo 44×44px.
- [ ] Todo `<input>` de la zona a `font-size: 16px` o mayor.
- [ ] A 1280px, los valores computados de la zona son idénticos a los de antes del cambio.
- [ ] Todo cambio vive dentro de una `@media`, salvo refactors de `style` inline a clase con valores idénticos.
- [ ] Ninguna utilidad Tailwind `sm:`/`md:`/`lg:` añadida.
- [ ] `git diff --stat components/games/ components/GamePlayer.tsx` vacío.
- [ ] `npm run build` compila.

Estado por zona: `references/mobile-porting.md`.

## Decisiones tomadas y descartadas

- **Sí:** `minmax(0, 1fr)` para las pistas de la franja. **No:** `max-width` sobre `.stat-strip` o `word-break` sobre el valor. El `max-width` limita el contenedor pero no impide que la pista interior siga empujando, y romper un número de puntuación por la mitad es peor que el desborde que arregla.
- **Sí:** apilar la franja bajo 520px. **No:** encoger la tipografía hasta que quepan tres columnas. A 360px harían falta ~11px de tipografía pixel para un récord de siete cifras, por debajo de cualquier umbral de legibilidad, y las estrellas seguirían envolviendo.
- **Sí:** reutilizar `520px`, que el archivo ya usa tres veces. **No:** inventar un breakpoint nuevo. `720px` sigue siendo el canónico; `520px` es el auxiliar que ya existe.
- **Sí:** extraer el `style` inline de la fecha a una clase con los mismos valores. **No:** dejarlo inline y aceptar los 10px. Es el precedente exacto de `.hud-stats` en SPEC 11, y el valor no es ajustable de ninguna otra forma.
- **No:** tocar el reproductor ni sus selectores. Son pasos pendientes de `/spec-impl 11` y editarlos hoy garantizaría un conflicto de merge.
