# GAME JAM "FLOGGER: CRUZA LA CARRETERA Y EL RÍO SIN CONVERTIRTE EN PAPILLA" · FLOGGER · 01 · Diseño de juego

- **Estado:** Borrador
- **Tema del jam:** Flogger: Cruza la carretera y el río sin convertirte en papilla
- **Depende de:** SPEC 05, SPEC 06
- **Fecha:** 2026-09-15
- **Objetivo:** Diseñar FLOGGER, una entrada nueva de catálogo tipo Frogger donde el jugador cruza cuatro carriles de tráfico y cinco franjas de río montando troncos y tortugas hasta llenar los cinco nenúfares de la meta.

## Alcance

**Dentro:**

- Un juego de cruce por celdas en un tablero fijo de 16×12 celdas de 50px (canvas interno 800×600, mismo criterio que `Asteroids.tsx`/`BloqueBuster.tsx`/`Snake.tsx`).
- Zona de carretera: cuatro carriles horizontales con vehículos que avanzan en direcciones alternas y a velocidades distintas. Tocar un vehículo cuesta una vida.
- Zona de río: cinco franjas de agua con troncos y grupos de tortugas flotantes. El agua mata por contacto; el jugador solo sobrevive montado sobre un tronco o sobre una tortuga emergida, y se desplaza arrastrado por ella.
- Tortugas sumergibles: algunas franjas de tortugas se hunden en ciclos (emergida → parpadeando → sumergida). Quedarse encima de una tortuga sumergida cuenta como caer al agua.
- Fila de meta con cinco nenúfares. Cada nenúfar se llena una sola vez por ronda; llenar los cinco completa la ronda y sube de nivel.
- Mediana segura entre carretera y río, y acera segura de salida abajo.
- Temporizador por intento, dibujado dentro del canvas como barra: si se agota, se pierde una vida y la rana vuelve a la salida.
- Tres vidas. Fin de partida cuando se pierde la tercera.
- Entrada nueva de catálogo: `flogger` / FLOGGER / ARCADE / `cover-flogger` / `magenta`.

**Fuera de alcance (para futuros specs):**

- Reslotear la entrada simulada `ranaria` — decisión explícita del usuario (ver Decisiones).
- Cocodrilos, serpientes sobre la mediana, nutrias, y la mosca-bonus que aparece en un nenúfar del original.
- Rana rival "hembra" que se monta a caballo para bonus doble.
- Sprites o assets binarios: todo el render es vectorial en canvas (mismo criterio que SPEC 08 con Arkanoid).
- Sonido y efectos de audio — exclusión ya establecida en SPEC 05/07/08/09.
- Soporte táctil/móvil o reconfiguración de controles.
- Cualquier otro juego del catálogo: siguen exactamente como están.

## Mecánica de juego

- La rana empieza en la acera inferior (fila 11), centrada horizontalmente.
- Cada pulsación de dirección la mueve **exactamente una celda** (arriba, abajo, izquierda, derecha). El movimiento es discreto por celda, no continuo; la animación del salto es puramente visual.
- La rana no puede salir del tablero: un salto que la dejaría fuera del borde izquierdo, derecho, superior o inferior se ignora.
- **Carretera (filas 7–10):** cada carril tiene vehículos de 1 a 3 celdas de largo que se desplazan en una única dirección y reaparecen por el borde opuesto. Si la caja de la rana se solapa con la de un vehículo, muere.
- **Río (filas 1–5):** el agua es letal por sí misma. Sobre el agua flotan troncos (2–4 celdas) y grupos de tortugas (2–3 celdas). Estando encima de uno de ellos, la rana se desplaza con él a su misma velocidad, con posición horizontal continua (no encajada en la grilla) hasta que vuelve a saltar.
- Si la rana es arrastrada fuera del borde del canvas montada en un tronco o tortuga, muere.
- **Tortugas sumergibles:** algunas franjas de tortugas alternan tres estados en ciclo. Emergida sostiene a la rana; parpadeando sigue sosteniéndola pero avisa; sumergida no la sostiene y la rana se ahoga si sigue encima.
- **Mediana (fila 6) y acera (fila 11):** zonas seguras sin obstáculos, donde la rana puede esperar sin morir.
- **Meta (fila 0):** cinco nenúfares en columnas fijas, separados por orilla sólida. Saltar a un nenúfar libre lo ocupa, suma puntos y devuelve la rana a la salida. Saltar a la orilla entre nenúfares o a un nenúfar ya ocupado cuesta una vida.
- Al perder una vida, la rana reaparece en la acera de salida y el temporizador del intento se reinicia. Los nenúfares ya ocupados **no** se vacían.
- **Fin de partida:** perder la tercera vida. Dispara el modal de fin de partida de `GamePlayer.tsx` con el score acumulado.

## Progresión y dificultad

- Completar los cinco nenúfares completa la ronda y sube el nivel en uno. Los nenúfares se vacían, la rana vuelve a la salida y empieza la ronda siguiente.
- En cada nivel nuevo:
  - todas las velocidades de carriles y franjas se multiplican por un factor creciente, con un techo para que el juego no se vuelva imposible ni inestable numéricamente;
  - los huecos entre vehículos se reducen, así que hay menos ventanas de cruce;
  - los troncos y grupos de tortugas se acortan y se separan más, obligando a saltos más precisos;
  - a partir del nivel 2 hay una franja sumergible más que en el nivel anterior, hasta un máximo de tres.
- El tiempo por intento no cambia con el nivel: la dificultad sube por velocidad y densidad, no por recortes de reloj.
- Las vidas nunca se recuperan: no hay vida extra por puntos en esta versión.

## Puntuación

- **+10** por cada fila nueva alcanzada hacia arriba durante el intento actual. Solo cuenta la primera vez que se alcanza esa fila en ese intento, así que bajar y volver a subir no farmea puntos.
- **+100** por cada nenúfar ocupado.
- **+5 por segundo restante** del temporizador al ocupar un nenúfar.
- **+500** de bonus al completar la ronda (los cinco nenúfares).
- No hay penalización de puntos por morir: la muerte se paga en vidas y en tiempo, y el score nunca baja (requisito de un leaderboard acumulativo y comparable).

Mapeo al contrato `{score, lives, level}` del HUD de `GamePlayer.tsx`:

- `score` → puntos por filas avanzadas, nenúfares, bonus de tiempo y bonus de ronda.
- `lives` → 3 al inicio; baja una por atropello, ahogamiento, arrastre fuera de pantalla, nenúfar inválido o tiempo agotado.
- `level` → número de ronda; sube al llenar los cinco nenúfares.

## Controles

Solo teclado. No hay mouse, ni gamepad, ni táctil.

| Tecla                    | Acción                  |
| ------------------------ | ----------------------- |
| `ArrowUp` / `W` / `w`    | Saltar una celda arriba |
| `ArrowDown` / `S` / `s`  | Saltar una celda abajo  |
| `ArrowLeft` / `A` / `a`  | Saltar una celda izq.   |
| `ArrowRight` / `D` / `d` | Saltar una celda der.   |

- El salto es discreto: una pulsación, una celda. Se aplica un pequeño tiempo de recarga entre saltos para que la repetición automática de teclas del sistema operativo no dispare una ráfaga de saltos.
- Se aplica `preventDefault()` a las cuatro flechas para que la página no scrollee mientras se juega (misma regla que SPEC 07/08/09).
- La pausa, el fin manual de partida y el guardado de puntuación los controlan los botones de `GamePlayer.tsx`, no el juego.

## Estética

- Neón/CRT, coherente con el resto del reproductor: fondo oscuro, formas vectoriales con brillo, sin texturas ni sprites.
- Paleta tomada de las variables ya definidas en `app/globals.css` (`--cyan`, `--magenta`, `--yellow`, `--green`, `--ink`). El juego no define colores nuevos fuera de las tonalidades derivadas de esas variables.
- Carretera: banda gris muy oscura con líneas discontinuas de carril tenues.
- Vehículos: rectángulos redondeados con contorno luminoso y una estela corta en la dirección de avance. Los más largos (camiones) usan un tono distinto de los cortos para leerse de un vistazo.
- Río: banda azul-cian oscura con líneas horizontales de corriente que se desplazan lentamente.
- Troncos: rectángulos ámbar con vetas; tortugas: grupos de círculos cian. La tortuga parpadeante alterna opacidad, y la sumergida queda como contorno apenas visible bajo el agua.
- Nenúfares: arcos verdes sobre la orilla; al ocuparse, se dibuja dentro la rana en reposo.
- Rana: rombo verde con dos patas y dos ojos, con un pequeño achatamiento durante la animación de salto.
- Barra de temporizador: franja delgada en la base del canvas, verde → amarilla → magenta a medida que se agota. Es el único indicador que el juego dibuja por su cuenta, porque el HUD de `GamePlayer.tsx` no tiene campo de tiempo.
- El juego **no** dibuja puntuación, vidas, nivel ni pantalla de game over dentro del canvas: eso es responsabilidad exclusiva del HUD y del modal de React (misma regla que SPEC 07/08/09).

## Decisiones tomadas y descartadas

- **Sí:** el concepto FLOGGER viene fijado por el usuario en la invocación de este jam, no de una comparación entre tres candidatos. Las fases de generación y de rúbrica de selección quedaron explícitamente anuladas para esta corrida. La rúbrica se siguió usando como control de calidad del concepto (fidelidad al tema, fit de score/HUD, viabilidad), no como mecanismo de elección.
- **Sí:** entrada **nueva** de catálogo (`flogger`), aun sabiendo que la sugerencia S-003 (`RANARIA`, reslot de `ranaria`) de `references/game-suggestions-todo.md` cubre exactamente la misma mecánica de cruzar carretera y río. El usuario conoce el solapamiento y lo aceptó. **Consecuencia asumida:** el catálogo tendrá dos juegos de cruzar la carretera — `flogger` con jugabilidad real y `ranaria` todavía simulado — y queda en manos de `game-planner` reasignar `ranaria` a otra mecánica más adelante. **No:** reslotear `ranaria` para este jam, que es competencia de `game-planner`, no de un jam temático.
- **Sí:** color `magenta` para la ficha de catálogo. **No:** `green`, que ya usan `ranaria`, `serpentina` e `invasores` — con dos juegos de rana en la biblioteca, compartir además el color los volvería indistinguibles de un vistazo.
- **Sí:** tablero de 16×12 celdas de 50px exactos. **No:** las cinco filas de carretera del Frogger original, que con 13 filas dejarían celdas de 46,15px y una grilla fraccionaria sobre el canvas 800×600 ya estandarizado. Cuatro carriles de tráfico mantienen aritmética entera y no cambian el carácter del juego.
- **Sí:** `lives: 3` reales, que decrementan de verdad en el HUD. **No:** `lives: 1` como en Tetris (SPEC 07) o Snake (SPEC 09) — aquí las vidas existen de forma natural en el diseño y aprovechan un campo del HUD que en otros juegos queda constante.
- **Sí:** temporizador por intento con bonus de tiempo al llegar a meta, dibujado como barra dentro del canvas. **No:** mostrarlo en el HUD de React, que tiene tres campos fijos (Puntuación/Vidas/Nivel) y no debe crecer por un solo juego. **No:** eliminar el temporizador — sin él, el jugador puede esperar indefinidamente en la mediana y el juego pierde toda su tensión.
- **Sí:** puntos por fila nueva alcanzada, contabilizados una sola vez por intento. **No:** puntos por cada salto hacia arriba, que permitiría farmear subiendo y bajando entre dos filas seguras y rompería la comparabilidad del leaderboard.
- **Sí:** los nenúfares ya ocupados persisten cuando se pierde una vida. **No:** vaciarlos al morir, que convertiría cada muerte tardía en una ronda perdida entera y haría el juego frustrante sin aportar profundidad.
- **Sí:** saltar a la orilla entre nenúfares o a un nenúfar ocupado cuesta una vida, como en el original. **No:** rebotar o ignorar el salto, que eliminaría toda la presión de apuntar bien la llegada.
- **Sí:** render vectorial y controles solo de teclado, sin audio ni assets binarios nuevos — mismo criterio que SPEC 08 tomó para Bloque Buster. `references/source-assets/` solo contiene `snake-assets`, sin nada aprovechable para este juego.

## Lo que **no** está en este spec

- Reslotear la entrada simulada `ranaria`.
- Cocodrilos, serpientes, nutrias y la mosca-bonus del original.
- Rana rival que se monta para bonus doble.
- Sprites o assets binarios de cualquier tipo.
- Sonido y efectos de audio.
- Soporte táctil/móvil o reconfiguración de controles.
- Vidas extra por puntuación.
- Cambios a cualquier otro juego del catálogo.

Cada uno de estos, si se necesita, va en su propio spec.
