# SPEC 18 — Rendimiento de Serpentina (Snake)

> **Estado:** Implementado
> **Depende de:** SPEC 09 (`09-snake.md`), SPEC 10 (`10-skins.md`), SPEC 14 (`14-rendimiento-frogger.md`)
> **Fecha:** 2026-09-23
> **Objetivo:** Quitar el halo intercalado por segmento y los 68 trazos separados de la grilla en `Snake.tsx`, sin cambiar un solo píxel del resultado visual en ninguna de las 3 skins.

---

## Por qué existe este spec

SPEC 14 dejó una doctrina de rendimiento y un checklist reutilizable. SPEC 15, 16 y 17 lo aplicaron a Asteroides, Caída y Bloque Buster. Serpentina es el último juego real sin auditar.

La auditoría de `components/games/Snake.tsx` con ese checklist encontró dos hallazgos:

- **Halo intercalado (punto 1).** El bucle de segmentos asigna `fillStyle`, `shadowBlur` y `shadowColor` por cada segmento. Solo la cabeza lleva halo, y se dibuja la última. El resto de asignaciones ponen `0`/`"transparent"`, que ya es el estado que deja el reset de la fruta. El costo crece con la longitud de la serpiente: con 300 segmentos son ~600 asignaciones de halo por frame.
- **Estado de `ctx` redundante (punto 2).** `fillStyle = pal.body` se reasigna por segmento, y la grilla hace 68 `beginPath`/`stroke` separados (39 verticales + 29 horizontales).

rAF/cleanup, `onStateChange`, asignaciones por frame y canvas están OK (detalle en `references/game-performance.md`).

El costo absoluto es bajo. Es el mismo tipo de optimización de bajo riesgo que SPEC 14 aplicó a Frogger.
No se pudo medir FPS en vivo, por el mismo motivo que SPEC 14: la pestaña automatizada nunca queda visible y `GamePlayer.tsx` pausa el juego cuando `document.hidden`.
node no trae `OffscreenCanvas` ni el paquete `canvas`. La evidencia es un conteo de llamadas a un contexto simulado (tabla en "Criterios de aceptación").

---

## Scope

**In:**

- Cuerpo de la serpiente en una pasada sin halo: `fillStyle = pal.body` una vez, sin tocar `shadowBlur`/`shadowColor` (el reset de la fruta ya los dejó en `0`/`"transparent"`). Mismo orden que antes: de la cola hacia el segmento 1.
- Cabeza al final, igual que antes: `fillStyle = pal.head` y, solo si `pal.headGlow > 0`, halo antes y reset después.
- La grilla se traza en dos paths (uno con las 39 verticales, otro con las 29 horizontales) y dos `stroke()`.

**Fuera de alcance:**

- Mecánica, colisiones, puntuación, `lives`/`level`, velocidad, inputs, `FRUIT_SPRITES`, `spawnFruit`.
- `segments.slice(0, -1)` + `some` de `step()`: corre una vez por tick de movimiento (60-150 ms), no por frame, y es la colisión.
- Valores de `SNAKE_SKINS` (`lib/skins.ts`): territorio de `skin-designer`.
- El dibujo de la fruta: una sola entidad por frame.
- Cachear la grilla en un canvas offscreen o `getContext("2d", { alpha: false })`: fuera del checklist de SPEC 14, igual que en SPEC 15 y 16.
- `app/globals.css`, `app/layout.tsx`, `components/GamePlayer.tsx`, `REAL_GAMES`.

---

## Data model

No se introduce ni modifica ninguna estructura de datos.

---

## Implementation plan

1. **Grilla en dos paths.** Un `beginPath` + 39 `moveTo`/`lineTo` + `stroke` para las verticales; lo mismo para las 29 horizontales. `strokeStyle`/`lineWidth` se siguen fijando una vez antes.
2. **Cuerpo sin halo.** Tras el reset de halo de la fruta, `fillStyle = pal.body` y `for (let i = segments.length - 1; i > 0; i--)` con solo el `fillRect`.
3. **Cabeza.** `fillStyle = pal.head`; si `pal.headGlow > 0`, `shadowBlur = pal.headGlow` y `shadowColor = pal.head`; `fillRect`; si hubo halo, reset a `0`/`"transparent"` para que el frame siguiente empiece limpio.
4. **`npm run build`** sin errores.

---

## Criterios de aceptación

- [x] Ningún segmento del cuerpo asigna `shadowBlur`/`shadowColor`; `fillStyle` del cuerpo se asigna una vez por frame.
- [x] La cabeza sigue dibujándose la última, con el mismo halo que antes en cada skin.
- [x] La grilla hace 2 `stroke()` por frame en vez de 68.
- [x] Conteo sintético sobre contexto simulado, en las 3 skins. El script comprueba que antes y después emiten la misma secuencia de `fillRect`/`drawImage` (rect + `fillStyle` + halo efectivo), los mismos segmentos de grilla con el mismo trazo, y el mismo estado final de sombra. Después: `clasico` / `neon` / `retro`:

| Escenario        | Halo/frame      | Estado `ctx`/frame | `beginPath`+`stroke`/frame | `fillRect`+`drawImage`/frame |
| ---------------- | --------------- | ------------------ | -------------------------- | ---------------------------- |
| Inicio (3 seg.)  | 12 → 4 / 8 / 8  | 18 → 9 / 13 / 14   | 136 → 4                    | 5 → 5                        |
| Medio (50 seg.)  | 106 → 4 / 8 / 8 | 159 → 9 / 13 / 14  | 136 → 4                    | 52 → 52                      |
| Largo (300 seg.) | 606 → 4 / 8 / 8 | 909 → 9 / 13 / 14  | 136 → 4                    | 302 → 302                    |

- [x] `npm run build` completa sin errores.
- [ ] El resultado visual es indistinguible a ojo del anterior en `clasico`, `neon` y `retro` (grilla, fruta, cuerpo, halo de la cabeza). **Pendiente — a cargo del usuario** (este agente no tiene navegador).
- [ ] Medido en Chrome DevTools → Performance, ~10 s de gameplay activo en desktop: frame time promedio ≤16.7 ms. **Pendiente — a cargo del usuario.**
- [ ] Misma medición en dispositivo o emulación móvil (390px). **Pendiente — a cargo del usuario.**

---

## Decisiones tomadas y descartadas

- **Sí: cuerpo primero, cabeza al final, sin cambiar el orden.** Es el mismo orden de dibujo que antes (cola → cabeza). Solo desaparecen asignaciones que ponían el valor que el `ctx` ya tenía.
- **Sí: no tocar el halo de la cabeza cuando `headGlow` es 0 (`clasico`).** Antes se asignaba `0`/`"transparent"`, que ya era el estado vigente: el halo efectivo es el mismo.
- **Sí: dos paths para la grilla, no uno.** Las verticales no se tocan entre sí ni las horizontales entre sí (20 px de separación, `lineWidth` 1), así que un path por dirección da la misma cobertura. Un único path pintaría los cruces una vez en vez de dos, y con la grilla `rgba(255,255,255,0.05)` de `clasico` los cruces se verían más tenues. Mismo criterio que SPEC 16.
- **No: cachear la grilla en un canvas offscreen.** Depende de la skin activa (que cambia a mitad de partida) y no está en el checklist de SPEC 14.
- **No: tocar la colisión de `step()`.** Es mecánica y no corre por frame.

---

## Riesgos identificados

| Riesgo                                                                              | Mitigación                                                                                                                   |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| El cuerpo depende de que el reset de la fruta deje el halo en `0`/`"transparent"`.  | El reset sigue justo antes del bucle del cuerpo en el mismo `draw()`. El script compara el halo efectivo de cada `fillRect`. |
| Juntar las líneas de la grilla en un path podría cambiar la cobertura antialiasada. | Las líneas de una misma dirección no se solapan; el script compara los segmentos trazados con su `strokeStyle`/`lineWidth`.  |
| Ninguna corrección está medida en FPS reales.                                       | La verificación manual en Chrome DevTools es obligatoria. Si no hay mejora, se reabre con una grabación real de Performance. |

---

## What is **not** in this spec

- Cambios de mecánica, colisiones, puntuación o inputs de Serpentina.
- Paletas o intensidades de halo (`skin-designer`).
- CSS compartido (`.crt-screen`, `.av-bg`/`gridscroll`): se reporta en `references/game-performance.md`, no se corrige aquí.
