# SPEC 16 — Rendimiento de Caída (Tetris)

> **Estado:** Implementado
> **Depende de:** SPEC 07 (`07-tetris.md`), SPEC 14 (`14-rendimiento-frogger.md`)
> **Fecha:** 2026-09-23
> **Objetivo:** Quitar las asignaciones redundantes de estado del contexto 2D en el dibujo de celdas y de la grilla de `Tetris.tsx`, sin cambiar un solo píxel del resultado visual.

---

## Por qué existe este spec

SPEC 14 dejó una doctrina de rendimiento y un checklist reutilizable. SPEC 15 lo aplicó a Asteroides.
La auditoría de `components/games/Tetris.tsx` con ese checklist no encontró halo (el juego no usa `shadowBlur`), ni asignaciones por frame, ni problemas de rAF, `onStateChange` o canvas.
Sí encontró un hallazgo del punto 2 (estado de `ctx` redundante):

- `drawBlock` asigna `globalAlpha` dos veces y `fillStyle` dos veces por cada celda ocupada. Con el tablero lleno son más de 600 asignaciones por frame. El alpha solo cambia para la pieza fantasma y el `fillStyle` del brillo superior es siempre el mismo string.
- La grilla de fondo hace 28 `beginPath`/`stroke` separados, uno por línea.

El costo absoluto es bajo. Es el mismo tipo de optimización de bajo riesgo que SPEC 14 aplicó a Frogger.
No se pudo medir FPS en vivo, por el mismo motivo que SPEC 14: la pestaña automatizada nunca queda visible y `GamePlayer.tsx` pausa el juego cuando `document.hidden`.
node v26 no trae `OffscreenCanvas` ni el paquete `canvas`. La evidencia es un conteo de llamadas a un contexto simulado (tabla en "Criterios de aceptación").

---

## Scope

**In:**

- `drawBlock` pasa a `drawCells(cells, originX, originY, size)`, que dibuja una matriz de celdas en dos pasadas: primero los cuerpos (reasignando `fillStyle` solo cuando cambia el color), después los brillos con `fillStyle` fijado una vez.
- La pieza fantasma fija `globalAlpha = 0.2` una vez antes de su `drawCells` y lo devuelve a `1` una vez después.
- La grilla de fondo se traza en dos paths (uno con las 9 verticales, otro con las 19 horizontales) y dos `stroke()`.

**Fuera de alcance:**

- Mecánica, colisiones, rotación/wall-kicks, puntuación, `lives`/`level`, inputs, `PIECES`, `COLORS`, `LINE_SCORES`.
- Skins de Caída: todavía no existen (`lib/skins.ts` no tiene entrada `caida`). Son territorio de `skin-designer`.
- Los `save`/`restore` de `drawBoardPanel`/`drawNextPanel`: 2 por frame, no son bucle caliente.
- Redibujar solo cuando algo cambia (dirty flag): cambia la estructura del bucle, no está en el checklist de SPEC 14.
- `getContext("2d", { alpha: false })`: fuera del checklist de SPEC 14, igual que en SPEC 15.
- `app/globals.css`, `app/layout.tsx`, `components/GamePlayer.tsx`, `REAL_GAMES`.
- Los demás juegos reales (`bloque-buster`, `serpentina`): una corrida por juego.

---

## Data model

No se introduce ninguna estructura de datos. Solo una constante de módulo con el color del brillo, que antes era un literal dentro de `drawBlock`:

```ts
const BLOCK_HIGHLIGHT = "rgba(255,255,255,0.12)";
```

---

## Implementation plan

1. **`drawCells` en dos pasadas.** Recorre la matriz; en la primera pasada dibuja el cuerpo `fillRect(x + 1, y + 1, size - 2, size - 2)` de cada celda no vacía, reasignando `fillStyle` solo si el color cambió. Si no hubo ninguna celda, sale. En la segunda pasada fija `fillStyle = BLOCK_HIGHLIGHT` una vez y dibuja el brillo `fillRect(x + 1, y + 1, size - 2, 4)` de cada celda.
2. **Llamadas.** Tablero: `drawCells(board, 0, 0, BLOCK)`. Fantasma: `globalAlpha = 0.2`, `drawCells(current.shape, current.x * BLOCK, gy * BLOCK, BLOCK)`, `globalAlpha = 1`. Pieza actual: igual con `current.y` y sin alpha. Preview: `drawCells(next.shape, NEXT_BOX_X + offX * NEXT_CELL, NEXT_BOX_Y + offY * NEXT_CELL, NEXT_CELL)`.
3. **Grilla en dos paths.** Un `beginPath` + 9 `moveTo`/`lineTo` + `stroke` para las verticales; lo mismo para las 19 horizontales.
4. **`npm run build`** sin errores.

---

## Criterios de aceptación

- [x] `drawBlock` ya no existe; ninguna celda asigna `globalAlpha`.
- [x] `fillStyle` se asigna una vez por cambio de color más una vez por grupo para el brillo.
- [x] La grilla hace 2 `stroke()` por frame en vez de 28.
- [x] El orden entre grupos (grilla, tablero, fantasma, pieza actual, marco, panel "SIGUIENTE") no cambia.
- [x] Conteo sintético sobre contexto simulado (pieza T, preview de la tuerca). El script comprueba que antes y después emiten el mismo conjunto de `fillRect` (rect + color + alpha):

| Escenario              | Estado `ctx`/frame | `beginPath`+`stroke`/frame | `fillRect`/frame |
| ---------------------- | ------------------ | -------------------------- | ---------------- |
| Inicio (tablero vacío) | 66 → 10            | 56 → 4                     | 32 → 32          |
| Medio (60 celdas)      | 306 → 66           | 56 → 4                     | 152 → 152        |
| Lleno (140 celdas)     | 626 → 138          | 56 → 4                     | 312 → 312        |

- [x] `npm run build` completa sin errores.
- [ ] El resultado visual es indistinguible a ojo del anterior (tablero, fantasma, pieza, preview, grilla). **Pendiente — a cargo del usuario** (este agente no tiene navegador).
- [ ] Medido en Chrome DevTools → Performance, ~10 s de gameplay activo en desktop: frame time promedio ≤16.7 ms. **Pendiente — a cargo del usuario.**
- [ ] Misma medición en dispositivo o emulación móvil (390px). **Pendiente — a cargo del usuario.**

---

## Decisiones tomadas y descartadas

- **Sí: cuerpos primero y brillos después dentro de cada grupo.** Las celdas de un mismo grupo no se solapan (cada `fillRect` queda dentro de su celda, con 1 px de margen), así que el orden dentro del grupo no altera ningún píxel. El brillo de cada celda sigue pintándose encima de su cuerpo.
- **Sí: fantasma y pieza actual como grupos separados, en el mismo orden que antes.** Son los únicos que pueden solaparse (cuando la pieza está apoyada, el fantasma coincide con ella). El fantasma se sigue dibujando completo antes que la pieza.
- **Sí: dos paths para la grilla, no uno.** Las verticales no se tocan entre sí ni las horizontales entre sí, así que un path por dirección da la misma cobertura. Un único path con las 28 líneas pintaría los cruces una sola vez en vez de dos, y con `rgba(255,255,255,0.08)` los cruces se verían más tenues.
- **No: dirty flag para no redibujar frames sin cambios.** Cambia la estructura del bucle y no está en el checklist de SPEC 14.
- **No: tocar `save`/`restore`/`font`/`textAlign` del panel "SIGUIENTE".** Una vez por frame, no es bucle caliente.

---

## Riesgos identificados

| Riesgo                                                                                      | Mitigación                                                                                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Cambiar el orden de los `fillRect` dentro de un grupo podría alterar píxeles si se solapan. | No se solapan: coordenadas enteras (`BLOCK = 24`, `NEXT_CELL = 35`) y 1 px de margen por lado. El script compara el conjunto de `fillRect`. |
| Ninguna corrección está medida en FPS reales.                                               | La verificación manual en Chrome DevTools es obligatoria. Si no hay mejora, se reabre con una grabación real de Performance.                |

---

## What is **not** in this spec

- Cambios de mecánica, colisiones, puntuación o inputs de Caída.
- Skins de Caída (`skin-designer`).
- CSS compartido (`.crt-screen`, `.av-bg`/`gridscroll`): se reporta en `references/game-performance.md`, no se corrige aquí.
- Los demás juegos reales: cada uno en su propia corrida y su propio spec.
