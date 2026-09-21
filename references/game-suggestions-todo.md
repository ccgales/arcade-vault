# TODO — Sugerencias de juegos

_Mantenido por el agente `game-planner`. Solo él escribe aquí. Última actualización: 2026-09-15._

## Cola priorizada

| #     | Estado                     | Juego propuesto    | Slot destino         | Cat     | Esfuerzo | Sugerido   |
| ----- | -------------------------- | ------------------ | -------------------- | ------- | -------- | ---------- |
| S-001 | Pendiente                  | INVASORES          | reslot `invasores`   | SHOOTER | M        | 2026-09-15 |
| S-002 | Pendiente                  | GLOTÓN             | reslot `gloton`      | ARCADE  | M/L      | 2026-09-15 |
| S-003 | Pendiente                  | RANARIA            | reslot `ranaria`     | ARCADE  | S        | 2026-09-15 |
| S-004 | Pendiente                  | DUELO PIXEL        | reslot `duelo-pixel` | VERSUS  | M        | 2026-09-15 |
| S-019 | Pendiente                  | COLUMNAS           | nueva entrada        | PUZZLE  | S/M      | 2026-09-15 |
| S-023 | Pendiente                  | HOCKEY DE MESA     | nueva entrada        | VERSUS  | M        | 2026-09-15 |
| S-020 | Pendiente                  | BURBUJAS           | nueva entrada        | PUZZLE  | M        | 2026-09-15 |
| S-024 | Pendiente                  | DUELO DE TANQUES   | nueva entrada        | VERSUS  | M        | 2026-09-15 |
| S-013 | Pendiente                  | ALAS LOCAS         | nueva entrada        | ARCADE  | S        | 2026-09-15 |
| S-011 | Pendiente                  | MARTILLO LOCO      | nueva entrada        | ARCADE  | S        | 2026-09-15 |
| S-010 | Pendiente                  | CAVADOR            | nueva entrada        | ARCADE  | M        | 2026-09-15 |
| S-005 | Pendiente                  | CIEN PIES          | nueva entrada        | SHOOTER | M        | 2026-09-15 |
| S-006 | Pendiente                  | COMANDO MISIL      | nueva entrada        | SHOOTER | M        | 2026-09-15 |
| S-017 | Pendiente                  | MOCHILA COHETE     | nueva entrada        | ARCADE  | S/M      | 2026-09-15 |
| S-012 | Pendiente                  | SALTARÍN           | nueva entrada        | ARCADE  | S        | 2026-09-15 |
| S-016 | Pendiente                  | CORREDOR           | nueva entrada        | ARCADE  | M        | 2026-09-15 |
| S-014 | Pendiente                  | BOMBARDERO         | nueva entrada        | ARCADE  | M/L      | 2026-09-15 |
| S-022 | Pendiente                  | TUBERÍAS           | nueva entrada        | PUZZLE  | M        | 2026-09-15 |
| S-015 | Pendiente                  | ESCALADOR DE HIELO | nueva entrada        | ARCADE  | M        | 2026-09-15 |
| S-008 | Pendiente                  | DEFENSOR           | nueva entrada        | SHOOTER | L        | 2026-09-15 |
| S-018 | Pendiente                  | TERRITORIO         | nueva entrada        | ARCADE  | M/L      | 2026-09-15 |
| S-007 | Pendiente                  | RÍO BRAVO          | nueva entrada        | SHOOTER | M        | 2026-09-15 |
| S-021 | Pendiente (prioridad baja) | FUSIÓN 2048        | nueva entrada        | PUZZLE  | S        | 2026-09-15 |
| S-009 | Pendiente (prioridad baja) | VECTOR TUBO        | nueva entrada        | SHOOTER | L        | 2026-09-15 |

## Detalle

### S-001 · INVASORES — Pendiente

- **Slot:** reslot de `invasores` (hereda id/cover/color/scores) · **Cat:** SHOOTER
- **Por qué encaja:** clon de Space Invaders — score acumulativo por enemigo destruido y fin de partida claro al perder todas las vidas; encaja de forma directa con el contrato de puntuación de la plataforma. Refuerza SHOOTER (hoy solo 1 juego real: `asteroides`) sin duplicar su mecánica: Asteroids es física libre de nave rotando/flotando, Invasores es una oleada en grid que desciende y se acelera.
- **Mecánica:** nave horizontal que dispara hacia arriba; oleada de enemigos en grid que desciende y avanza lateralmente, acelerándose a medida que quedan menos; los enemigos disparan de vuelta; limpiar la oleada sube de nivel.
- **Mapeo del contrato:** `score` → puntos por enemigo destruido (las filas superiores valen más, como el original) · `lives` → vidas del jugador, empieza en 3 · `level` → número de oleada
- **Fuente:** desde cero — no hay carpeta en `references/started-games/` para este juego (mismo caso que Snake en SPEC 09)
- **Riesgos:** la IA de disparo enemigo y el ritmo de aceleración por oleada necesitan calibrarse para no ser injustos; mismo riesgo de throttling de `requestAnimationFrame` en pruebas automatizadas que documentó SPEC 09
- **Siguiente paso:** `/add-game invasores`

### S-002 · GLOTÓN — Pendiente

- **Slot:** reslot de `gloton` (hereda id/cover/color/scores) · **Cat:** ARCADE
- **Por qué encaja:** clon de Pac-Man — buen fit de contrato (score por pellets/fantasmas, vidas naturales, nivel = ronda más rápida), pero ARCADE ya tiene 2 juegos reales (`bloque-buster`, `serpentina`), así que pesa menos en el criterio de hueco de categoría que Invasores.
- **Mecánica:** laberinto fijo; el jugador come pellets mientras evade 2–4 fantasmas con IA de persecución simple; power-pellets invierten el rol temporalmente.
- **Mapeo del contrato:** `score` → pellets y fantasmas comidos · `lives` → vidas restantes · `level` → ronda del laberinto (fantasmas más rápidos/agresivos)
- **Fuente:** desde cero
- **Riesgos:** el pathfinding de los fantasmas en un laberinto es más complejo que cualquier juego real portado hasta ahora — mayor esfuerzo que Invasores o Ranaria
- **Siguiente paso:** `/add-game gloton`

### S-003 · RANARIA — Pendiente

- **Slot:** reslot de `ranaria` (hereda id/cover/color/scores) · **Cat:** ARCADE
- **Por qué encaja:** clon de Frogger — mecánica más simple de las cuatro (mejor candidato en esfuerzo), buen fit de contrato, pero comparte el mismo solapamiento de categoría ARCADE que Glotón.
- **Mecánica:** la rana avanza por carriles con obstáculos que se mueven horizontalmente (tráfico/troncos); llegar a la meta repetidas veces sube de nivel.
- **Mapeo del contrato:** `score` → puntos por carril avanzado + bonus por meta alcanzada · `lives` → vidas por colisión o caída al agua · `level` → velocidad/densidad de obstáculos
- **Fuente:** desde cero
- **Riesgos:** ninguno significativo más allá de balancear la dificultad por nivel
- **Siguiente paso:** `/add-game ranaria`

### S-004 · DUELO PIXEL — Pendiente (prioridad baja, requiere decisión de mapeo)

- **Slot:** reslot de `duelo-pixel` (hereda id/cover/color/scores) · **Cat:** VERSUS — única categoría sin ningún juego real hoy, lo cual sí es un hueco genuino
- **Por qué se posterga pese al hueco de categoría:** clon de Pong. El contrato `{score, lives, level}` de `GamePlayer.tsx` no encaja bien con un juego de rally 2 jugadores: no hay "vidas" ni "nivel" naturales, y el modelo de high-score del resto del catálogo (una cifra que sube sin techo, un solo jugador contra sí mismo/la máquina) no es el género "primero a N puntos" de Pong. Antes de spec-earlo hace falta que el usuario confirme qué es exactamente "score" en un duelo.
- **Mecánica:** paletas verticales, la pelota rebota y acelera; quien falla concede punto al rival.
- **Mapeo del contrato (propuesto, sin validar):** `score` → puntos ganados en la sesión contra una IA de paleta rival · `lives` → fijo en 1, no aplica realmente · `level` → velocidad de la pelota tras cada N puntos
- **Fuente:** desde cero
- **Riesgos:** cambia el género del catálogo (rival IA vs. el resto, que son todos single-player puros) — vale la pena confirmarlo con el usuario antes de escribir el spec
- **Siguiente paso:** confirmar con el usuario el mapeo de `score` antes de `/add-game duelo-pixel`

### S-005 · CIEN PIES — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** SHOOTER
- **Por qué encaja:** clon de Centipede — score acumulativo por segmento destruido, fin claro al agotar vidas. Distinto de Asteroids (física libre) e Invasores propuesto (oleada en grid): aquí el ciempiés serpentea entre hongos que se van destruyendo y dividiendo en segmentos independientes.
- **Mecánica:** cañón que se mueve en la franja inferior; ciempiés que serpentea por un campo de hongos, cada segmento impactado se separa; arañas/pulgas erráticas como amenaza secundaria.
- **Mapeo del contrato:** `score` → por segmento/hongo/enemigo secundario · `lives` → vidas del jugador · `level` → ronda (campo de hongos regenerado, más rápido)
- **Fuente:** desde cero
- **Riesgos:** la física de "segmento se separa al impactar" y el spawn de hongos es más estado a manejar que un shooter simple
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-006 · COMANDO MISIL — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** SHOOTER
- **Por qué encaja:** clon de Missile Command — score por interceptación, fin claro al perder todas las ciudades (mapeadas a vidas). Mecánica de apuntar-y-disparar con mira, distinta de cualquier shooter ya propuesto.
- **Mecánica:** mira controlada por teclado/mouse; misiles enemigos caen hacia ciudades en la base; disparar detona una explosión de radio que destruye misiles en área.
- **Mapeo del contrato:** `score` → misiles interceptados (bonus por multi-kill) · `lives` → ciudades restantes · `level` → oleada (más misiles, más rápidos)
- **Fuente:** desde cero
- **Riesgos:** requiere soporte de mouse/click además de teclado si se quiere fiel al original; alternativa 100% teclado (mira con flechas) es viable y más consistente con el resto del catálogo
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-007 · RÍO BRAVO — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** SHOOTER
- **Por qué encaja:** clon de River Raid — scroll vertical por un canal de ancho variable con gestión de combustible, distinto de los shooters de grid/físico ya cubiertos.
- **Mecánica:** avión que vuela sobre un río con orillas que se estrechan/ensanchan; dispara a enemigos y tanques de combustible que rellenan el medidor al tocarlos; chocar con la orilla cuesta una vida.
- **Mapeo del contrato:** `score` → enemigos destruidos + distancia recorrida · `lives` → vidas por colisión · `level` → tramo del río (más angosto, más enemigos)
- **Fuente:** desde cero
- **Riesgos:** el combustible como recurso adicional al HUD estándar no tiene campo propio — habría que mostrarlo dentro del canvas, no en el HUD de `GamePlayer.tsx`
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-008 · DEFENSOR — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** SHOOTER
- **Por qué encaja:** clon de Defender — scroll horizontal libre con rescate de humanoides, mecánica de "proteger" no representada en el catálogo actual.
- **Mecánica:** nave que vuela libre en ambas direcciones sobre un terreno horizontal envolvente; enemigos secuestran humanoides en tierra; el jugador dispara y puede recuperar humanoides en caída.
- **Mapeo del contrato:** `score` → enemigos destruidos + humanoides rescatados · `lives` → vidas de la nave · `level` → oleada (planeta más hostil)
- **Fuente:** desde cero
- **Riesgos:** el mundo envolvente (scroll horizontal infinito con minimapa) y la IA de secuestro son bastante más estado que cualquier juego real actual — efort **L**
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-009 · VECTOR TUBO — Pendiente (prioridad baja)

- **Slot:** nueva entrada catálogo · **Cat:** SHOOTER
- **Por qué se posterga:** clon de Tempest — mecánica de tubo vectorial radial (el jugador se mueve por el borde de una figura 3D-ilusoria) es la más alejada del resto del catálogo (todo 2D plano/top-down); alto riesgo geométrico y de esfuerzo (**L**) para un solo `<canvas>` 2D.
- **Mecánica:** el jugador se desplaza lateralmente por el borde de un pozo poligonal; dispara a enemigos que suben desde el fondo del tubo.
- **Mapeo del contrato:** `score` → enemigos destruidos · `lives` → vidas · `level` → figura del tubo (más segmentos/velocidad)
- **Fuente:** desde cero
- **Riesgos:** proyección pseudo-3D en canvas 2D es la parte más arriesgada técnicamente de todo este lote
- **Siguiente paso:** revisar viabilidad de la proyección antes de comprometerse a `/add-game`

### S-010 · CAVADOR — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Dig Dug — excavación + combate, mecánica de "cavar túneles" no representada; buen fit de contrato.
- **Mecánica:** el jugador cava túneles libremente bajo tierra; infla enemigos con una bomba de aire hasta reventarlos o los aplasta con rocas que él mismo suelta.
- **Mapeo del contrato:** `score` → enemigos reventados/aplastados · `lives` → vidas · `level` → profundidad/densidad de enemigos
- **Fuente:** desde cero
- **Riesgos:** terreno destructible (túneles persistentes) es más estado por frame que un juego de grid fijo
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-011 · MARTILLO LOCO — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Whack-a-Mole — el más simple de reflejos/timing de todo el lote (esfuerzo **S**), buen candidato para llenar rápido el catálogo aunque su fit temático de "arcade retro" es más flojo que el resto.
- **Mecánica:** grid de agujeros donde aparecen topos al azar por tiempos decrecientes; golpear (tecla mapeada a posición) suma puntos, dejar pasar resta una vida.
- **Mapeo del contrato:** `score` → golpes acertados · `lives` → fallos permitidos antes de game over · `level` → velocidad de aparición
- **Fuente:** desde cero
- **Riesgos:** es el juego con menos "profundidad" de mecánica del lote — riesgo de sentirse fuera de tono frente a los clones de arcade clásico del resto del catálogo
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-012 · SALTARÍN — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Doodle Jump — plataformero vertical infinito, mecánica de "subir sin parar" no cubierta; contrato limpio.
- **Mecánica:** el personaje rebota automáticamente entre plataformas que se generan hacia arriba; el jugador solo controla el movimiento horizontal; caer por debajo de la cámara termina la partida.
- **Mapeo del contrato:** `score` → altura alcanzada · `lives` → normalmente 1 (fin al caer) — o vidas extra por power-up de resorte · `level` → tramos de altura (plataformas más escasas/móviles)
- **Fuente:** desde cero
- **Riesgos:** `lives` no es natural en el diseño original (una sola caída termina la partida) — habría que decidir si mapear `lives: 1` fijo o inventar vidas extra vía power-up
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-013 · ALAS LOCAS — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Flappy Bird — el más simple técnicamente de todo el lote (esfuerzo **S**), score = tuberías cruzadas, fin de partida inmediato y claro al chocar.
- **Mecánica:** tecla para aletear/impulsar hacia arriba, gravedad constante hacia abajo; cruzar huecos entre tuberías que se desplazan de derecha a izquierda.
- **Mapeo del contrato:** `score` → tuberías cruzadas · `lives` → 1 (choque = fin inmediato, como el original) · `level` → velocidad/espaciado de tuberías cada N puntos
- **Fuente:** desde cero
- **Riesgos:** ninguno significativo — es de los más simples de construir y probar de todo el lote
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-014 · BOMBARDERO — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Bomberman (un jugador) — mecánica de colocar bombas y destruir bloques/enemigos en un laberinto, no representada en el catálogo.
- **Mecánica:** grid con bloques destructibles y sólidos; el jugador coloca bombas de explosión en cruz con timer; limpiar enemigos y bloques abre la salida al siguiente nivel.
- **Mapeo del contrato:** `score` → bloques/enemigos destruidos · `lives` → vidas por explosión propia o contacto enemigo · `level` → layout del laberinto (más enemigos, menos espacio)
- **Fuente:** desde cero
- **Riesgos:** generación de laberinto + timers de bombas encadenadas (reacción en cadena) es más lógica de estado que la mayoría del lote — esfuerzo **M/L**
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-015 · ESCALADOR DE HIELO — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Ice Climber — escalada vertical con plataformas que se desprenden y enemigos que aparecen desde los bordes, mecánica de "subir combatiendo" distinta de Saltarín (ahí no hay combate).
- **Mecánica:** el jugador rompe bloques de hielo sobre su cabeza para subir mientras esquiva/golpea enemigos que emergen en los bordes de cada plataforma; llegar a la cima sube de nivel.
- **Mapeo del contrato:** `score` → bloques rotos + enemigos derribados + altura · `lives` → vidas por caída/contacto enemigo · `level` → altura de la montaña (más enemigos, plataformas más frágiles)
- **Fuente:** desde cero
- **Riesgos:** ninguno significativo más allá de balancear el spawn de enemigos por altura
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-016 · CORREDOR — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de endless runner tipo Temple Run/Subway Surfers simplificado a 3 carriles — mecánica de esquivar/saltar/deslizar en carriles fijos, no cubierta.
- **Mecánica:** el personaje corre automáticamente; el jugador cambia de carril, salta o se desliza para esquivar obstáculos que se acercan cada vez más rápido.
- **Mapeo del contrato:** `score` → distancia recorrida + monedas recogidas · `lives` → vidas por choque (o fin inmediato al primer choque, a decidir) · `level` → velocidad de scroll cada N metros
- **Fuente:** desde cero
- **Riesgos:** ninguno significativo — patrón de obstáculos por carril es directo de generar proceduralmente
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-017 · MOCHILA COHETE — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Jetpack Joyride — mecánica de "mantener tecla para volar" con gravedad, esquivando láseres/misiles y recogiendo monedas; distinta de todo lo demás (control por sostener, no por pulsar discreto).
- **Mecánica:** mantener la tecla acelera hacia arriba con propulsión, soltarla cae por gravedad; el jugador esquiva obstáculos (láseres, misiles teledirigidos) en scroll horizontal infinito.
- **Mapeo del contrato:** `score` → distancia + monedas · `lives` → 1 (choque = fin), como el original · `level` → densidad de obstáculos cada N metros
- **Fuente:** desde cero
- **Riesgos:** el misil teledirigido necesita un mini-pathfinding simple hacia el jugador — el único elemento no trivial
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-018 · TERRITORIO — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** ARCADE
- **Por qué encaja:** clon de Qix — mecánica de "reclamar área trazando líneas mientras se evita un enemigo" es completamente distinta a todo lo demás del catálogo (no es shooter, ni puzzle de piezas, ni plataformero).
- **Mecánica:** el jugador se mueve por el borde de un área rectangular; al entrar al interior traza una línea que, al cerrarse, reclama el área encerrada; un enemigo que recorre el borde/interior mata al tocar la línea antes de cerrarla.
- **Mapeo del contrato:** `score` → % de área reclamada · `lives` → vidas por contacto enemigo mientras se traza · `level` → velocidad/número de enemigos, % de área objetivo
- **Fuente:** desde cero
- **Riesgos:** detección de "área cerrada" (flood fill) es el algoritmo más complejo de implementar de todo el lote fuera de Vector Tubo — esfuerzo **M/L**
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-019 · COLUMNAS — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** PUZZLE
- **Por qué encaja:** clon de Columns — refuerza PUZZLE, la categoría más débil del catálogo (hoy solo `caida`/Tetris real). Mecánica de match-3 por color al caer, claramente distinta de Tetris (que es encaje de formas, no combinación de colores).
- **Mecánica:** tríos de gemas de colores caen por columnas; el jugador las reordena verticalmente antes de que aterricen; 3+ gemas del mismo color en línea (cualquier dirección) se eliminan.
- **Mapeo del contrato:** `score` → gemas eliminadas (combo multiplica) · `lives` → 1, fin al llenarse la columna de spawn (como Tetris) · `level` → velocidad de caída cada N líneas eliminadas
- **Fuente:** desde cero — mismo patrón de grid+gravedad que `caida`/Tetris, reutilizable como referencia de implementación
- **Riesgos:** ninguno significativo — es el PUZZLE de menor riesgo del lote, dado que `caida` ya resolvió el patrón base de grid+gravedad+game over
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo) — **recomendado como prioridad #1 de este lote**

### S-020 · BURBUJAS — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** PUZZLE
- **Por qué encaja:** clon de Puzzle Bobble/Bust-a-Move — refuerza PUZZLE; mecánica de apuntar y disparar para formar clusters de 3+ del mismo color, distinta tanto de Tetris como de Columnas (aquí no hay gravedad continua, hay un techo que desciende).
- **Mecánica:** el jugador apunta y dispara burbujas de color hacia un techo de burbujas ya pegadas; clusters de 3+ del mismo color se eliminan y las burbujas sin soporte caen; el techo desciende cada N disparos.
- **Mapeo del contrato:** `score` → burbujas eliminadas (incluye las que caen por gravedad tras un cluster) · `lives` → 1, fin cuando el techo llega a la línea base · `level` → velocidad de descenso del techo / paleta de colores más amplia
- **Fuente:** desde cero
- **Riesgos:** la geometría hexagonal de burbujas adyacentes (grid triangular, no cuadrado) es más compleja que el grid estándar del resto del catálogo
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-021 · FUSIÓN 2048 — Pendiente (prioridad baja, requiere decisión de mapeo)

- **Slot:** nueva entrada catálogo · **Cat:** PUZZLE
- **Por qué se posterga pese al bajo esfuerzo:** clon de 2048 — igual que Duelo Pixel (S-004), el contrato `{score, lives, level}` no encaja del todo: no hay "vidas" naturales (el juego termina cuando el tablero se llena sin movimientos posibles, no por una muerte discreta) ni "nivel" (es una sola partida sin rondas). Habría que mapear `lives: 1` fijo y `level` a algo artificial (p. ej. tamaño de grid).
- **Mecánica:** grid 4×4; flechas deslizan todas las fichas en una dirección, fichas iguales adyacentes se fusionan sumando su valor; termina cuando no hay movimientos válidos.
- **Mapeo del contrato (propuesto, sin validar):** `score` → suma de fusiones · `lives` → fijo en 1 · `level` → sin equivalente natural, se podría usar la ficha máxima alcanzada como proxy
- **Fuente:** desde cero
- **Riesgos:** es el juego de todo el lote con peor fit de contrato pese a ser el de menor esfuerzo técnico — vale la pena confirmar con el usuario el mapeo de `lives`/`level` antes de spec-earlo
- **Siguiente paso:** confirmar con el usuario el mapeo de `lives`/`level` antes de `/add-game`

### S-022 · TUBERÍAS — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** PUZZLE
- **Por qué encaja:** clon de Pipe Dream/Pipe Mania — refuerza PUZZLE; mecánica de colocar piezas de tubería antes de que el flujo las alcance, con presión de tiempo real (a diferencia de 2048, que no tiene urgencia por turno).
- **Mecánica:** piezas de tubería aparecen en una cola; el jugador las coloca en un grid antes de que el "flujo" (que avanza solo, cada vez más rápido) llegue al final del recorrido construido; el flujo debe seguir siempre una ruta válida.
- **Mapeo del contrato:** `score` → longitud de tubería recorrida por el flujo antes de game over · `lives` → intentos/rondas antes de que el flujo se escape · `level` → velocidad del flujo / complejidad de piezas disponibles
- **Fuente:** desde cero
- **Riesgos:** validar que la cola de tuberías siempre permita al menos una ruta jugable requiere algo de cuidado en el generador de piezas
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

### S-023 · HOCKEY DE MESA — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** VERSUS
- **Por qué encaja:** clon de Air Hockey contra IA — refuerza VERSUS junto con Duelo Pixel (S-004), pero con mejor fit de contrato: aquí sí hay algo parecido a "vidas" (goles concedidos) y "nivel" (velocidad del disco), y el movimiento es libre en 2D (no solo eje vertical como Pong), lo que lo distingue claramente en mecánica.
- **Mecánica:** el jugador mueve su mazo libremente en su mitad de la mesa; golpea el disco para anotar en la portería rival; una IA controla el mazo contrario.
- **Mapeo del contrato:** `score` → goles anotados · `lives` → goles concedidos permitidos antes de game over (p. ej. 5) · `level` → velocidad del disco tras cada gol
- **Fuente:** desde cero
- **Riesgos:** la IA rival necesita interceptar en 2D (no solo seguir el eje Y como en Pong), un poco más de lógica de movimiento
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo) — junto con Columnas, **recomendado como prioridad alta de este lote** por resolver mejor el hueco de VERSUS que Duelo Pixel

### S-024 · DUELO DE TANQUES — Pendiente

- **Slot:** nueva entrada catálogo · **Cat:** VERSUS
- **Por qué encaja:** clon de Combat (Atari) — refuerza VERSUS con una mecánica de combate directo contra IA, distinta tanto del rally de Pong (S-004) como del hockey de mesa (S-023): aquí hay disparo y obstáculos destructibles/indestructibles en la arena.
- **Mecánica:** dos tanques en una arena con muros; el jugador dispara proyectiles que rebotan o se destruyen contra muros; una IA controla el tanque rival con patrones de esquiva/persecución simples.
- **Mapeo del contrato:** `score` → impactos acertados en la sesión · `lives` → impactos recibidos permitidos antes de game over (p. ej. 3) · `level` → agresividad de la IA / complejidad del layout de muros
- **Fuente:** desde cero
- **Riesgos:** balancear la IA de puntería/esquiva para que sea un reto justo, similar al riesgo ya documentado para Invasores (S-001)
- **Siguiente paso:** `/add-game` (nueva entrada de catálogo)

## Descartadas

| Juego | Fecha | Razón |
| ----- | ----- | ----- |

## Cerradas (ya implementadas)

| Juego | Spec | Fecha |
| ----- | ---- | ----- |
