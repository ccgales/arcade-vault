# Porte móvil del sitio

_Mantenido por el agente `mobile-porter`. Solo él escribe aquí. Última actualización: 2026-09-22._

Doctrina: `specs/11-controles-tactiles-movil.md`. La zona `reproductor` (`/juegos/[id]/jugar`)
no está en esta matriz — es SPEC 11, no este agente. Breakpoint canónico: `720px`.

Spec de este trabajo: `specs/13-porte-movil-del-sitio.md`. Toma el número `13` y no el `12`
porque `specs/12-apariencia-gamepad-tactil.md` ya existía.

## Matriz

| Zona         | Ruta           | Componente           | 360px | 390px | 768px | Estado    | Fecha      |
| ------------ | -------------- | -------------------- | ----- | ----- | ----- | --------- | ---------- |
| `home`       | `/`            | `Home.tsx`           | —     | —     | —     | Pendiente | —          |
| `biblioteca` | `/biblioteca`  | `Library.tsx`        | —     | —     | —     | Pendiente | —          |
| `detalle`    | `/juegos/[id]` | `GameDetail.tsx`     | OK    | OK    | OK    | Portada   | 2026-09-22 |
| `salon`      | `/salon`       | `HallOfFame.tsx`     | —     | —     | —     | Pendiente | —          |
| `acerca-de`  | `/acerca-de`   | `About.tsx`          | —     | —     | —     | Pendiente | —          |
| `auth`       | `/auth`        | `Auth.tsx`           | —     | —     | —     | Pendiente | —          |
| `marco`      | todas          | `Nav.tsx` + `layout` | FALLA | —     | —     | Pendiente | —          |

`marco` ya tiene defectos medidos (ver Mediciones) aunque todavía no se ha corrido su porte:
se descubrieron de paso al cargar `/juegos/frogger` y se registran aquí para no perderlos.

Siguiente comando sugerido: `@mobile-porter marco`.

## Detalle

### `detalle` — 2026-09-22

Medido sobre `/juegos/frogger` (juego recién añadido, sin puntuaciones todavía) y sobre
`/juegos/asteroides` (12 filas de marcador), para ejercitar también `.lb-row`, que en
`frogger` no llega a renderizarse.

Causa raíz: `.stat-strip { grid-template-columns: repeat(3, 1fr) }` (`app/globals.css:947`).
`1fr` es `minmax(auto, 1fr)`, así que la pista no puede encoger por debajo de su contenido:
un récord de 7 cifras en tipografía pixel a 16px mide ~145px, empuja la pista y arrastra
toda la columna del grid `.av-detail` fuera del viewport. Invisible tras el
`body { overflow-x: hidden }` de `app/globals.css:55`.

Selectores tocados:

- `app/globals.css:1015` — nueva `.lb-row .lb-date`, extraída del `style` inline de
  `GameDetail.tsx` con **los mismos valores** (10px, `--ink-faint`, `0.1em`). Un `style`
  inline no se puede ajustar por media query; mismo criterio que `.hud-stats` en SPEC 11.
- `app/globals.css:1051` — `@media (max-width: 720px)`: `.stat-strip` a
  `repeat(3, minmax(0, 1fr))`, `.stat-strip .v` a 14px, `.lb-row .lb-date` a 11px.
- `app/globals.css:1069` — `@media (max-width: 520px)`: `.stat-strip` a una columna,
  `.stat-strip > div` a rejilla `auto 1fr` (etiqueta a la izquierda, valor a la derecha),
  `.stat-strip .v` sin `margin-top` y alineado a la derecha, `.detail-actions .btn` a
  `flex: 1 1 100%`.
- `components/GameDetail.tsx:82` — el `<div>` de la fecha pasa de `style` inline a
  `className="lb-date"`. Único cambio de markup; ninguna lógica de datos tocada.

## Mediciones

Instrumentación: la ventana de Chrome está maximizada y `resize_window` no mueve el viewport
(`window.innerWidth` se queda en 1536). Se mide con un iframe del mismo origen de ancho CSS
exacto, sobre el que se evalúan las media queries y corren las sondas. La barra de scroll
clásica del iframe se come 15px, así que 360px de iframe dan `clientWidth = 345`: margen
**conservador**, un teléfono real tiene 15px más de holgura.

| Zona      | Ancho | Elemento                        | Síntoma                          | Antes                                                | Después                       | OK  |
| --------- | ----- | ------------------------------- | -------------------------------- | ---------------------------------------------------- | ----------------------------- | --- |
| `detalle` | 360   | `.stat-strip`                   | pistas desiguales                | 86 / 125 / 100px                                     | 1 columna, 313px              | Sí  |
| `detalle` | 360   | `.stat-strip .v` (★)            | envuelve a 3 líneas              | 72px de alto (3 líneas)                              | 21px (1 línea)                | Sí  |
| `detalle` | 360   | `.stat-strip` `123.456`         | llega al borde del viewport      | `right: 346` / cw 345                                | `right: 329`                  | Sí  |
| `detalle` | 360   | `.stat-strip` `1.234.567`       | desborda y arrastra `.av-detail` | `right: 378` (+33px), 15 elementos fuera             | `right: 329` (−16px), 0 fuera | Sí  |
| `detalle` | 360   | `.detail-actions .btn`          | anchos dentados                  | 290px y 266px                                        | 313px y 313px                 | Sí  |
| `detalle` | 360   | `.lb-row .lb-date`              | 10px, fijado por `style` inline  | 10px inalcanzable                                    | 11px por media query          | Sí  |
| `detalle` | 360   | targets < 44×44 en `.av-detail` | —                                | 0                                                    | 0                             | Sí  |
| `detalle` | 390   | `.stat-strip .v` (★)            | envuelve a 2 líneas              | 48px de alto (2 líneas)                              | 21px (1 línea)                | Sí  |
| `detalle` | 390   | `.stat-strip` `1.234.567`       | desborda                         | fuera del viewport                                   | `right: 359` (−16px)          | Sí  |
| `detalle` | 768   | `.av-detail`                    | —                                | 0 desbordes                                          | 0 desbordes                   | Sí  |
| `detalle` | 1280  | regresión de escritorio         | —                                | 3×226px, `.v` 16px, `.lb-date` 10px, botones 290/266 | idéntico                      | Sí  |
| `marco`   | 360   | `.btn.ghost.hamburger`          | desborda 57px                    | `right: 402` / cw 345                                | sin corregir                  | No  |
| `marco`   | 360   | `.btn.ghost.hamburger`          | target por debajo de 44          | 56×41px                                              | sin corregir                  | No  |
| `marco`   | 360   | `.logo`                         | target por debajo de 44          | 119×36px                                             | sin corregir                  | No  |
| `marco`   | 360   | `.av-mobile-panel`              | off-canvas a `right: 654`        | patrón previsible, a confirmar                       | sin corregir                  | No  |

Capturas: `.playwright-screenshot/detalle-360-antes.png`,
`.playwright-screenshot/detalle-360-antes-leaderboard.png`,
`.playwright-screenshot/detalle-360-despues.png`,
`.playwright-screenshot/detalle-frogger-360-despues.png`.

## Fuera de alcance

El pad táctil del reproductor (`/juegos/[id]/jugar`) es `specs/11-controles-tactiles-movil.md`,
implementado con `/spec-impl 11`. Este agente nunca lo toca.
