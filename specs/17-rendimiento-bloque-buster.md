# SPEC 17 — Rendimiento de Bloque Buster

> **Estado:** Implementado
> **Depende de:** SPEC 08 (`08-bloque-buster.md`), SPEC 10 (`10-skins.md`), SPEC 14 (`14-rendimiento-frogger.md`)
> **Fecha:** 2026-09-23
> **Objetivo:** Quitar el halo intercalado por bloque, las asignaciones redundantes de estado del contexto 2D y el array nuevo por frame de `BloqueBuster.tsx`, sin cambiar un solo píxel del resultado visual.

---

## Por qué existe este spec

SPEC 14 dejó una doctrina de rendimiento y un checklist reutilizable. SPEC 15 y SPEC 16 lo aplicaron a Asteroides y Caída.
La auditoría de `components/games/BloqueBuster.tsx` con ese checklist encontró tres hallazgos:

- **Halo intercalado.** El bucle de bloques asigna `fillStyle`, `shadowColor` y `shadowBlur`, dibuja, y vuelve a poner `shadowBlur = 0` y `shadowColor = "transparent"` por cada bloque vivo. Con los 60 bloques del nivel 1 son 300 asignaciones por frame solo en ese bucle.
- **Estado de `ctx` redundante en partículas.** `Particle.draw` asigna `fillStyle` y dos veces `globalAlpha` por partícula.
- **Array nuevo por frame.** `update()` hace `particles.filter(...)` en cada frame, más closures de `forEach` en `update()` y `draw()`.

rAF/cleanup, `onStateChange` y canvas están correctos.
El costo absoluto es bajo. Es el mismo tipo de optimización de bajo riesgo que SPEC 14 aplicó a Frogger.
No se pudo medir FPS en vivo, por el mismo motivo que SPEC 14: la pestaña automatizada nunca queda visible y `GamePlayer.tsx` pausa el juego cuando `document.hidden`.
node v26 no trae `OffscreenCanvas` ni el paquete `canvas`. La evidencia es un conteo de llamadas a un contexto simulado (tabla en "Criterios de aceptación").

---

## Scope

**In:**

- Bucle de bloques en `draw()`: `shadowBlur` se fija una vez antes del bucle; `fillStyle` y `shadowColor` se reasignan solo cuando cambia el color del bloque; el reset del halo se hace una vez después del bucle.
- Partículas: se dibujan con un `for` dentro de `draw()`, reasignando `fillStyle` solo al cambiar de `colorKey`; `globalAlpha` se asigna una vez por partícula y se devuelve a `1` una sola vez al final. `Particle.draw` desaparece.
- Paleta y pelota: se quita el reset de halo intermedio entre ambas (la pelota vuelve a fijar `shadowColor` y `shadowBlur` antes de dibujar). El reset final del frame se conserva.
- `update()`: `particles` se actualiza y compacta in situ (función `updateParticles(dt)`) en vez de `forEach` + `filter`.

**Fuera de alcance:**

- Mecánica, colisiones, rebotes, puntuación, `lives`/`level`, inputs, `LEVELS`, dimensiones de bloques/paleta/pelota.
- Valores de color y de glow de `BLOQUE_BUSTER_SKINS` (`lib/skins.ts`): territorio de `skin-designer`.
- `blocks.every(...)` al romper un bloque: solo corre en ese evento, no por frame.
- Redibujar solo cuando algo cambia (dirty flag) y `getContext("2d", { alpha: false })`: fuera del checklist de SPEC 14, igual que en SPEC 15 y 16.
- `app/globals.css`, `app/layout.tsx`, `components/GamePlayer.tsx`, `REAL_GAMES`.
- El otro juego real pendiente (`serpentina`): una corrida por juego.

---

## Data model

No se introduce ninguna estructura de datos.
`Particle` pierde su método `draw`; sus campos (`x`, `y`, `colorKey`, `life`, `ttl`, `dead`) no cambian.

---

## Implementation plan

1. **Bloques agrupados por color.** Antes del bucle, `shadowBlur = blockGlow`. Dentro, si el color resuelto difiere del anterior, se asignan `fillStyle` y `shadowColor` (el color o `"transparent"` si `blockGlow` es 0). Después del bucle, `shadowBlur = 0` y `shadowColor = "transparent"` una vez. El orden de dibujo de los bloques no cambia.
2. **Partículas en `draw()`.** Un `for` indexado; `fillStyle` solo al cambiar de `colorKey`; `globalAlpha = max(ttl / life, 0)` por partícula; `globalAlpha = 1` una vez si hubo partículas. Se borra `Particle.draw`.
3. **Paleta → pelota sin reset intermedio.** Se borran las dos asignaciones de reset tras `fillRect` de la paleta.
4. **`updateParticles(dt)` in situ.** Recorre, llama a `update(dt)`, copia las vivas hacia el inicio y trunca con `particles.length = w`. Se usa en las dos ramas de `update()` (partida y game over).
5. **`npm run build`** sin errores.

---

## Criterios de aceptación

- [x] Ningún bloque asigna `shadowBlur`; `shadowColor` y `fillStyle` se asignan una vez por cambio de color.
- [x] Ninguna partícula asigna `globalAlpha = 1`; `Particle.draw` ya no existe.
- [x] `update()` no llama a `filter` ni a `forEach` por frame.
- [x] El orden de dibujo (fondo, bloques, partículas, paleta, pelota) no cambia.
- [x] Conteo sintético sobre contexto simulado en las 3 skins. El script comprueba que antes y después emiten la misma secuencia de dibujo (operación + rect + `fillStyle` + `globalAlpha` + halo efectivo). Los números son iguales en `clasico`, `neon` y `retro`:

| Escenario                           | Halo/frame | Estado `ctx`/frame | Operaciones de dibujo/frame | Arrays nuevos/frame |
| ----------------------------------- | ---------- | ------------------ | --------------------------- | ------------------- |
| Inicio nivel 1 (60 bloques, 0 p.)   | 248 → 15   | 311 → 24           | 63 → 63                     | 1 → 0               |
| Medio nivel 1 (30 bloques, 8 p.)    | 128 → 15   | 185 → 34           | 41 → 41                     | 1 → 0               |
| Nivel 5 (32 bloques, 24 partículas) | 164 → 18   | 278 → 58           | 66 → 66                     | 1 → 0               |

- [x] `npm run build` completa sin errores.
- [ ] El resultado visual es indistinguible a ojo del anterior en `clasico`, `neon` y `retro` (halos de bloques, paleta y pelota; explosión de partículas). **Pendiente — a cargo del usuario** (este agente no tiene navegador).
- [ ] Medido en Chrome DevTools → Performance, ~10 s de gameplay activo en desktop: frame time promedio ≤16.7 ms. **Pendiente — a cargo del usuario.**
- [ ] Misma medición en dispositivo o emulación móvil (390px). **Pendiente — a cargo del usuario.**

---

## Decisiones tomadas y descartadas

- **Sí: agrupar por cambio de color, no en una sola pasada.** El halo de cada bloque usa su propio color, así que no existe un único `shadowColor` para todos. Los bloques se guardan por filas y cada fila tiene un solo color en casi todos los niveles, así que el cambio de color es poco frecuente.
- **No: reordenar los bloques por color.** Los halos de bloques vecinos se solapan; cambiar el orden cambiaría qué halo queda encima. Se conserva el orden de `blocks`.
- **Sí: conservar el reset final del halo tras la pelota.** El `fillRect` del fondo del frame siguiente debe dibujarse sin sombra.
- **Sí: compactar `particles` in situ.** Es el mismo patrón que `removeDead()` de SPEC 15. Las partículas son solo visuales; el resultado (misma lista, mismo orden) es idéntico.
- **No: tabla cacheada de strings `rgba` como en SPEC 15.** Aquí el alpha va en `globalAlpha` (un número), no en un string, así que no hay string nuevo por partícula.

---

## Riesgos identificados

| Riesgo                                                    | Mitigación                                                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Cambiar de skin a mitad de partida con el halo ya fijado. | La paleta se resuelve al inicio de `draw()` y el primer bloque siempre asigna color (`lastColor` arranca en `""`).      |
| Ninguna corrección está medida en FPS reales.             | La verificación manual en Chrome DevTools es obligatoria. Si no hay mejora, se reabre con una grabación de Performance. |

---

## What is **not** in this spec

- Cambios de mecánica, colisiones, puntuación o inputs de Bloque Buster.
- Cambios de paleta o de intensidad de glow (`skin-designer`).
- CSS compartido (`.crt-screen`, `.av-bg`/`gridscroll`): se reporta en `references/game-performance.md`, no se corrige aquí.
- Los demás juegos reales: cada uno en su propia corrida y su propio spec.
