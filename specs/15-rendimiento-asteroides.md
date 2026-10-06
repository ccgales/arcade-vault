# SPEC 15 — Rendimiento de Asteroides

> **Estado:** Implementado
> **Depende de:** SPEC 05 (`05-asteroides.md`), SPEC 10 (`10-skins.md`), SPEC 14 (`14-rendimiento-frogger.md`)
> **Fecha:** 2026-09-23
> **Objetivo:** Agrupar el halo y el estado del contexto 2D de balas, asteroides y partículas en `Asteroids.tsx`, y quitar las asignaciones por frame del bucle, sin cambiar un solo píxel del resultado visual.

---

## Por qué existe este spec

SPEC 14 dejó una doctrina de rendimiento para Frogger y un checklist reutilizable.
La auditoría de `components/games/Asteroids.tsx` con ese checklist encontró el mismo patrón que Frogger tenía antes de SPEC 14.
`Bullet.draw` y `Asteroid.draw` encienden y apagan `shadowBlur`/`shadowColor` por cada entidad.
Cada asteroide hace además `save()`/`translate()`/`rotate()`/`restore()` y reasigna `strokeStyle`/`lineWidth`/`lineJoin`.
Cada partícula construye un string `rgba(...)` nuevo por frame.
`update()` crea varios arrays nuevos por frame con `filter`/`concat`.

El contrato de rAF/cleanup, el throttling de `onStateChange` y la resolución fija del canvas ya están bien (ver `references/game-performance.md`).

No se pudo medir FPS en vivo, por el mismo motivo que SPEC 14.
La pestaña automatizada nunca queda visible y `GamePlayer.tsx` pausa el juego cuando `document.hidden`.
node v26 tampoco trae `OffscreenCanvas` ni el paquete `canvas`.
La evidencia es un conteo de llamadas a un contexto simulado (tabla en "Criterios de aceptación").

---

## Scope

**In:**

- `Asteroid.draw`: sin `save()`/`restore()`; la transformación se fija con `ctx.setTransform(cos, sin, -sin, cos, x, y)`.
- `draw()`: los asteroides se dibujan en una pasada con `strokeStyle`/`lineWidth`/`lineJoin`/halo fijados una vez; al salir se restauran transform identidad, `lineJoin = "miter"` y halo apagado.
- `draw()`: las balas se dibujan en una pasada con `fillStyle`/halo fijados una vez.
- `Particle.draw`: el color sale de una tabla de 101 strings `rgba(r,g,b,0.00…1.00)` cacheada por `particleRgb`; `lineWidth` se fija una vez por pasada.
- `update()`/`draw()`: `filter`/`concat` reemplazados por compactación in situ (`removeDead`), `newAsteroids` reutilizado, `forEach` reemplazado por `for…of`.

**Fuera de alcance:**

- `Ship.draw` y `PowerUp.draw`: una sola entidad por frame cada uno, no son bucle caliente.
- Mecánica, colisiones, puntuación, `lives`/`level`, inputs, `RADII`/`SPEEDS`/`POINTS`.
- Paletas de `lib/skins.ts` (valores de color y de glow).
- `app/globals.css`, `app/layout.tsx`, `components/GamePlayer.tsx`, `REAL_GAMES`.
- `getContext("2d", { alpha: false })`: optimización posible, pero no está en el checklist de SPEC 14 y cambia la opacidad del canvas.
- Los demás juegos reales (`caida`, `bloque-buster`, `serpentina`): una corrida por juego.

---

## Data model

No se introduce ninguna estructura de datos de juego.
Solo se añade, a nivel de módulo, un caché de render:

```ts
// particleRgb -> 101 strings "rgba(r,g,b,0.00)" … "rgba(r,g,b,1.00)"
const particleStyleCache = new Map<string, string[]>();
```

El índice es `Math.round(alpha * 100)`, acotado a `[0, 100]`.
Produce el mismo string que `alpha.toFixed(2)` (0 discrepancias en 1e6 muestras aleatorias).

---

## Implementation plan

1. **Balas agrupadas.** `Bullet.draw(ctx)` solo hace `beginPath`/`arc`/`fill`. `draw()` fija `fillStyle`, `shadowBlur`, `shadowColor` una vez antes del bucle y apaga el halo una vez después.
2. **Asteroides agrupados.** `Asteroid.draw(ctx)` fija su transform con `setTransform` y traza el polígono. `draw()` fija `strokeStyle`/`lineWidth`/`lineJoin = "round"`/halo antes del bucle; después restaura `setTransform(1, 0, 0, 1, 0, 0)`, `lineJoin = "miter"` y halo apagado. El `lineJoin` se restaura porque `PowerUp.draw` hace `strokeRect` con el `miter` por defecto que antes le devolvía el `restore()` del asteroide.
3. **Partículas sin strings nuevos.** `particleStyles(rgb)` construye y cachea la tabla; `Particle.draw(ctx, styles)` indexa por alpha. `lineWidth` se fija una vez por pasada.
4. **Arrays reutilizados.** `removeDead(arr)` compacta in situ preservando el orden. `newAsteroids` se declara una vez y se vacía con `length = 0`. `forEach` pasa a `for…of`.
5. **`npm run build`** sin errores.

---

## Criterios de aceptación

- [x] `Bullet.draw` y `Asteroid.draw` ya no asignan `shadowBlur`/`shadowColor`; el halo de cada grupo se fija una vez por frame.
- [x] Ningún asteroide hace `save()`/`restore()`.
- [x] `Particle.draw` no construye strings por frame.
- [x] `update()` no llama a `filter`/`concat` por frame.
- [x] El orden de dibujo (fondo, partículas, asteroides, power-ups, balas, nave, indicador "3x") no cambia.
- [x] Conteo sintético, skin `neon`, sin nave ni power-up:

| Escenario                          | Halo/frame | Estado `ctx`/frame | `save`+`restore`/frame | Strings `rgba`/frame |
| ---------------------------------- | ---------- | ------------------ | ---------------------- | -------------------- |
| Medio (12 ast., 6 balas, 30 part.) | 72 → 8     | 175 → 45           | 24 → 0                 | 30 → 0               |
| Pesado (24 ast., 15 balas, 80 p.)  | 156 → 8    | 404 → 95           | 48 → 0                 | 80 → 0               |

- [x] `npm run build` completa sin errores.
- [ ] El resultado visual en `clasico`/`neon`/`retro` es indistinguible a ojo del anterior. **Pendiente — a cargo del usuario** (este agente no tiene navegador).
- [ ] Medido en Chrome DevTools → Performance, ~10 s de gameplay activo en desktop: frame time promedio ≤16.7 ms. **Pendiente — a cargo del usuario.**
- [ ] Misma medición en dispositivo o emulación móvil (390px). **Pendiente — a cargo del usuario.**

---

## Decisiones tomadas y descartadas

- **Sí: agrupar por tipo de entidad, no una única pasada global.** Balas y asteroides tienen glow distinto por skin. Una pasada por tipo mantiene el orden de dibujo entre tipos.
- **No: un solo `path` con todas las balas y un solo `fill()`.** Las tres balas del disparo triple nacen en el mismo punto. Con un único `fill()` sus halos no se sumarían y el brillo cambiaría.
- **Sí: `setTransform` en vez de `save`/`translate`/`rotate`/`restore`.** El canvas nunca se escala, así que la transform base es la identidad. La matriz resultante es la misma.
- **Sí: tabla de 101 strings `rgba` en vez de `globalAlpha`.** `globalAlpha` con un color opaco daría un resultado casi igual, pero no idéntico al redondeo de `toFixed(2)`. La tabla reproduce el mismo string exacto.
- **No: tocar `Ship.draw`/`PowerUp.draw`.** Una entidad por frame cada una. El ahorro no justifica el riesgo sobre el `textBaseline` que el indicador "3x" hereda de `PowerUp.draw`.
- **No: `alpha: false` en `getContext`.** Fuera del checklist de SPEC 14. Ver "Fuera de alcance".

---

## Riesgos identificados

| Riesgo                                                                                              | Mitigación                                                                                                                                  |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado de `ctx` que antes devolvía `restore()` (sobre todo `lineJoin`) ahora persiste entre grupos. | Cada pasada restaura al salir la transform identidad, `lineJoin = "miter"` y el halo apagado. Es el mismo estado que dejaba el `restore()`. |
| Ninguna de estas correcciones está medida en FPS reales.                                            | La verificación manual en Chrome DevTools es obligatoria. Si no hay mejora, se reabre con una grabación real de Performance.                |

---

## What is **not** in this spec

- Cambios de mecánica, colisiones, puntuación o inputs de Asteroides.
- Cambios de paleta o glow en `lib/skins.ts`.
- CSS compartido (`.crt-screen`, `.av-bg`/`gridscroll`): se reporta en `references/game-performance.md`, no se corrige aquí.
- Los demás juegos reales: cada uno en su propia corrida y su propio spec.
