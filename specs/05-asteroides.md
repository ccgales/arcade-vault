# 05 · Juego real "ASTEROIDES"

- **Estado:** Aprobado
- **Depende de:** Ninguna
- **Fecha:** 2026-09-01
- **Objetivo:** Renombrar la entrada del catálogo "ROCAS" a "ASTEROIDES" y reemplazar su `GamePlayer` simulado por el juego real de Asteroids (`references/started-games/02-asteroids/game.js`) portado a un componente React/TypeScript en canvas, integrado con el HUD, la pausa y el modal de fin de partida ya existentes en la plataforma.

## Scope

**Dentro:**

- Renombrar en `lib/data.ts` la entrada del catálogo: `id: "rocas"` → `id: "asteroides"`, `title: "ROCAS"` → `title: "ASTEROIDES"`, `cover: "cover-rocas"` → `cover: "cover-asteroides"`. En `app/globals.css`, renombrar las reglas `.cover-rocas` (y sus pseudo-elementos `::after`/`::before`) a `.cover-asteroides`. Ningún otro archivo de la app referencia el id `"rocas"` (`GameCard`, `GameDetail`, `HallOfFame`, `Library` ya lo resuelven dinámicamente desde `GAMES`), así que la ruta resultante es `/juegos/asteroides`.
- Nuevo componente `components/games/Asteroids.tsx` (Client Component) que porta a TypeScript toda la lógica de `references/started-games/02-asteroids/game.js`: clases/lógica de `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`, `spawnAsteroids`, `initGame`, `nextLevel`, `explode`, `killShip`, `update`, `draw`, `loop` — manteniendo mecánicas idénticas (tamaños de asteroide, puntos, velocidades, drop de power-up de disparo triple, invencibilidad al reaparecer con parpadeo, wrap toroidal, partículas de explosión).
- El componente renderiza un único `<canvas>` de resolución interna fija 800×600 (mismo aspect ratio 4:3 que `.crt-screen`), escalado a 100% de ancho/alto de su contenedor vía CSS.
- Controles idénticos al original: flechas izquierda/derecha rotan, flecha arriba propulsa, Espacio dispara; se agrega `preventDefault()` en esas teclas para que no hagan scroll de la página. Sin soporte táctil/móvil.
- El componente expone al padre, vía props/callbacks, el estado que ya muestra el HUD existente de `GamePlayer.tsx`: `onStateChange({ score, lives, level })` en cada cambio, y `onGameOver(finalScore)` cuando la partida termina (por perder la última vida o por FIN forzado).
- El componente acepta una prop `paused: boolean`: cuando es `true`, el loop deja de llamar a `update()` (y de avanzar el juego), preservando el estado exacto; al volver a `false` continúa donde quedó.
- El componente expone un método imperativo `endGame()` (vía `useImperativeHandle`/`forwardRef`) que fuerza el fin de partida con el score actual, para conectarlo al botón "FIN".
- Se elimina del canvas el HUD dibujado propio (SCORE/NIVEL/vidas), el overlay de "GAME OVER" y el reinicio con Espacio — sustituidos por el HUD y el modal de React ya existentes. El indicador del power-up de disparo triple ("3x Ns") se mantiene dibujado en el canvas, igual que el original.
- Se edita `components/GamePlayer.tsx`: cuando `game.id === "asteroides"`, renderiza `<Asteroids />` dentro de `.crt-screen` en vez del `.game-arena` decorativo actual, y el HUD superior (Puntuación/Vidas/Nivel) deja de incrementarse con el `setInterval` simulado — pasa a reflejar el estado real recibido por `onStateChange`. Para el resto de los juegos del catálogo, `GamePlayer.tsx` conserva el comportamiento simulado actual sin cambios.
- El botón "PAUSA" congela el loop real del juego (antes solo detenía el intervalo simulado). El botón "FIN" llama a `endGame()` del componente. "JUGAR DE NUEVO" reinicia el juego montando una nueva instancia de `<Asteroids />` (vía `key` de React) con estado limpio.
- El botón "GUARDAR PUNTUACIÓN" se mantiene igual que hoy: simulado (marca "guardado" localmente sin persistir), sin ningún cambio de comportamiento.

**Fuera de alcance (para futuros specs):**

- Persistencia real de puntuaciones (Supabase) — ya anticipado como fuera de alcance en SPEC 04.
- Soporte táctil/móvil o reconfiguración de controles.
- Cualquier otro juego del catálogo (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Ranaria, Duelo Pixel): siguen usando el `GamePlayer` simulado sin cambios.
- Cambios al diseño visual de `GameDetail.tsx`, `HallOfFame.tsx`, `Library.tsx`, `Home.tsx`, `Nav.tsx` o cualquier otra pantalla, más allá de que muestren el nuevo título "ASTEROIDES" que ya resuelven dinámicamente desde `lib/data.ts`.
- Sonido/efectos de audio: el original no tiene y este spec no los agrega.
- Cambiar `game.best`/`game.plays` u otros campos del catálogo que no sean `id`, `title` y `cover`.
- Ajustes de dificultad o balance de mecánicas respecto al original.

## Data model

Este feature no agrega datos persistidos. Sí cambia un dato existente del catálogo y define el contrato de props/callbacks entre el componente portado y `GamePlayer.tsx`:

```ts
// lib/data.ts — entrada modificada dentro de GAMES
{
  id: "asteroides",       // antes "rocas"
  title: "ASTEROIDES",    // antes "ROCAS"
  cover: "cover-asteroides", // antes "cover-rocas"
  // short, long, cat, color, best, plays: sin cambios
}
```

```ts
// components/games/Asteroids.tsx
interface AsteroidsState {
  score: number;
  lives: number;
  level: number;
}

interface AsteroidsProps {
  paused: boolean;
  onStateChange: (state: AsteroidsState) => void;
  onGameOver: (finalScore: number) => void;
}

interface AsteroidsHandle {
  endGame: () => void;
}
// export default forwardRef<AsteroidsHandle, AsteroidsProps>(Asteroids)
```

## Implementation plan

1. En `lib/data.ts`, renombrar la entrada del catálogo: `id: "rocas"` → `id: "asteroides"`, `title: "ROCAS"` → `title: "ASTEROIDES"`, `cover: "cover-rocas"` → `cover: "cover-asteroides"`. En `app/globals.css`, renombrar `.cover-rocas` (y sus pseudo-elementos) a `.cover-asteroides`.
2. Crear `components/games/Asteroids.tsx` como Client Component (`"use client"`), portando a TypeScript la lógica completa de `references/started-games/02-asteroids/game.js` (clases `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` y funciones de juego), encapsulada dentro de un `useEffect` que monta el loop sobre un `<canvas>` referenciado con `useRef` (en vez de `document.getElementById`), y cancela el `requestAnimationFrame` y remueve los listeners de teclado en la función de limpieza del `useEffect`.
3. Implementar el contrato de props (`paused`, `onStateChange`, `onGameOver`) y el ref imperativo (`endGame`) descritos en Data model; quitar del `draw()` portado el dibujo de SCORE/NIVEL/vidas y el overlay de GAME OVER (mantener el indicador "3x Ns" del power-up).
4. Agregar `preventDefault()` a los eventos de teclado de `ArrowLeft`, `ArrowRight`, `ArrowUp` y `Space` capturados por el componente.
5. Editar `components/GamePlayer.tsx`: agregar una rama condicional para `game.id === "asteroides"` que renderiza `<Asteroids key={resetKey} ref={asteroidsRef} paused={paused} onStateChange={...} onGameOver={...} />` dentro de `.crt-screen` (sustituyendo el `.game-arena` decorativo solo en este caso); el estado `score`/`lives`/`level` deja de usar `setInterval` para este juego y se actualiza desde `onStateChange`; `onGameOver` marca `over(true)` con el score final recibido; el botón "FIN" llama a `asteroidsRef.current?.endGame()`; "JUGAR DE NUEVO" incrementa `resetKey` (remontando `<Asteroids />` con estado limpio) en vez de solo resetear los estados de React.
6. Verificar que el resto de los juegos del catálogo (`game.id !== "asteroides"`) siguen usando exactamente el flujo simulado actual, sin cambios de comportamiento.
7. Ejecutar `npm run dev`, navegar a `/juegos/asteroides/jugar` y probar manualmente: rotar/propulsar/disparar, wrap toroidal en los bordes, división de asteroides grandes→medianos→pequeños, aparición y recolección del power-up de disparo triple, pérdida de vidas con parpadeo de invencibilidad al reaparecer, progresión de nivel al limpiar todos los asteroides.
8. Verificar la integración con el HUD/controles existentes: el HUD superior (Puntuación/Vidas/Nivel) refleja el estado real del juego; "PAUSA" congela el juego y "REANUDAR" lo continúa exactamente donde quedó; "FIN" abre el modal de fin de partida con el score acumulado; perder la última vida abre el mismo modal; "JUGAR DE NUEVO" arranca una partida nueva limpia; "SALIR" navega a `/juegos/asteroides` sin errores en consola.
9. Verificar en Biblioteca, Detalle de juego y Salón de la Fama que el juego aparece como "ASTEROIDES" (no "ROCAS") y que su portada (`cover-asteroides`) se ve igual que antes.
10. Confirmar que ningún otro juego del catálogo (ej. `/juegos/caida/jugar`) cambió de comportamiento.
11. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Acceptance criteria

- [ ] En Biblioteca, Detalle de juego y Salón de la Fama, el juego se muestra como "ASTEROIDES" (no aparece "ROCAS" en ninguna pantalla).
- [ ] `/juegos/asteroides` y `/juegos/asteroides/jugar` resuelven correctamente; `id: "rocas"` ya no existe en `lib/data.ts`.
- [ ] La portada del juego en Biblioteca/Detalle se ve igual que antes del rename (misma imagen generada por CSS, ahora bajo la clase `.cover-asteroides`).
- [ ] `/juegos/asteroides/jugar` renderiza el juego real de Asteroids en canvas dentro de `.crt-screen`, con el mismo aspecto 4:3 que el resto del reproductor.
- [ ] Flechas izquierda/derecha rotan la nave, flecha arriba propulsa, Espacio dispara; ninguna de esas teclas hace scroll de la página.
- [ ] Los asteroides envuelven los bordes del canvas (espacio toroidal) igual que el original.
- [ ] Destruir un asteroide grande lo divide en dos medianos, y un mediano en dos pequeños; los pequeños no se dividen.
- [ ] El power-up de disparo triple aparece tras varias destrucciones, se puede recoger, y su indicador "3x" con cuenta regresiva se ve dibujado sobre el canvas.
- [ ] Perder una vida activa la invencibilidad temporal con parpadeo de la nave al reaparecer.
- [ ] El HUD superior (Puntuación/Vidas/Nivel) de `GamePlayer.tsx` refleja en tiempo real el score, vidas y nivel reales del juego, no valores simulados.
- [ ] El botón "PAUSA" congela completamente el juego (nada se mueve) y "REANUDAR" lo continúa exactamente donde quedó, sin perder posición, velocidad ni estado de power-up.
- [ ] El botón "FIN" abre el modal de fin de partida con el score acumulado hasta ese momento.
- [ ] Perder la última vida abre el mismo modal de fin de partida, con el score final correcto.
- [ ] El canvas ya no dibuja su propio SCORE/NIVEL/vidas ni una pantalla de "GAME OVER"; tampoco reinicia con Espacio.
- [ ] "JUGAR DE NUEVO" desde el modal arranca una partida nueva con score 0, 3 vidas y nivel 1.
- [ ] "SALIR" navega a `/juegos/asteroides` sin dejar el loop del juego corriendo en segundo plano (sin errores ni fugas en consola).
- [ ] El botón "GUARDAR PUNTUACIÓN" se comporta igual que hoy (simulado, sin persistencia real).
- [ ] Ningún otro juego del catálogo (`caida`, `serpentina`, `gloton`, `invasores`, `bloque-buster`, `ranaria`, `duelo-pixel`) cambia de comportamiento respecto al estado actual.
- [ ] No hay errores ni warnings en la consola del navegador al jugar una partida completa de Asteroides.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** renombrar la entrada del catálogo de "ROCAS"/`id: "rocas"` a "ASTEROIDES"/`id: "asteroides"` (título y URL), a pedido explícito del usuario ("el juego se llama Asteroides, no Rocas"). **No:** mantener el `id` interno "rocas" con solo el título visible cambiado, porque el usuario confirmó que también quería el id/URL alineados al nombre real del juego.
- **Sí:** el HUD superior de React (Puntuación/Vidas/Nivel) es la única fuente visible de esos stats; el canvas deja de dibujarlos. **No:** mantener dos HUD (canvas + React) mostrando lo mismo, por duplicación visual y de estado.
- **Sí:** el canvas notifica a React vía callbacks (`onStateChange`, `onGameOver`) en vez de que React lea el estado del canvas por polling o por atributos del DOM. **No:** exponer el estado del juego como variables globales `window.*` (como hacía el original), porque no es idiomático en React y complica la limpieza al desmontar.
- **Sí:** reiniciar la partida remontando `<Asteroids />` con un nuevo `key` de React, delegando la reinicialización al propio `useEffect` de montaje. **No:** exponer un método `restart()` imperativo adicional, porque el patrón de `key` ya cubre el caso con menos superficie de API.
- **Sí:** el indicador de power-up de disparo triple permanece dibujado en el canvas. **No:** moverlo al HUD de React, porque es un elemento transitorio del campo de juego, no un stat persistente de la partida.
- **No:** implementar persistencia real de puntuaciones en este spec. Se mantiene la decisión de SPEC 04 de dejarla para un spec futuro con Supabase.
- **No:** agregar soporte táctil/móvil. El original es solo teclado y este spec porta el juego tal cual, sin ampliar su alcance de controles.
- **Sí:** nuevo directorio `components/games/` para el componente portado, en vez de agregarlo plano en `components/`. Anticipa que futuros juegos reales seguirán el mismo patrón, sin forzar todavía un registro genérico de "juego real vs. simulado" en `GamePlayer.tsx` — la rama condicional por `game.id === "asteroides"` es suficiente para un solo juego real.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                            | Mitigación                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cambiar el `id` de "rocas" a "asteroides" altera la semilla de `seededScores` (basada en `id.length`), así que las puntuaciones simuladas en Detalle/Salón de la Fama para este juego se ven distintas a las de antes del rename. | Aceptable: son datos simulados sin persistencia real (fuera de alcance hasta el spec de persistencia); no hay pérdida de información real.          |
| El loop de `requestAnimationFrame` podría seguir corriendo tras desmontar el componente (ej. al navegar a SALIR), causando fugas o errores en consola.                                                                            | El `useEffect` cancela el `requestAnimationFrame` y remueve los listeners de teclado en su función de limpieza.                                     |
| Los listeners de teclado (`keydown`/`keyup`) en `window` podrían interferir con otros controles del sitio si quedan activos fuera de la pantalla de juego.                                                                        | Se agregan y remueven en el mismo `useEffect` con cleanup, activos solo mientras `<Asteroids />` está montado (solo en `/juegos/asteroides/jugar`). |
| Congelar el loop en pausa podría dejar el `dt` del siguiente frame anormalmente grande al reanudar (salto brusco de física).                                                                                                      | Se recalcula `lastTime` al reanudar (igual que hace el original al iniciar), para que el primer `dt` post-pausa sea 0 en vez de acumulado.          |

## What is **not** in this spec

- Persistencia real de puntuaciones (Supabase).
- Soporte táctil/móvil.
- Cambios a otros juegos del catálogo.
- Cambios visuales a GameDetail, HallOfFame, Library, Home o Nav más allá del nuevo título/portada resueltos dinámicamente.
- Sonido/efectos de audio.

Cada uno de estos, si se necesita, va en su propio spec.
