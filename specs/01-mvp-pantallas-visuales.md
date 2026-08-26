# 01 · MVP — Pantallas visuales de Arcade Vault

- **Estado:** Implementado
- **Depende de:** Ninguno
- **Fecha:** 2026-08-24
- **Objetivo:** Implementar la capa visual completa de las 5 pantallas de Arcade Vault (Biblioteca, Detalle de juego, Reproductor, Auth y Salón de la Fama) como páginas reales del App Router de Next.js, replicando el diseño y la interactividad local de los templates de referencia, sin lógica de juego real ni persistencia entre pantallas.

## Alcance

**Dentro:**

- 5 páginas reales bajo el App Router: `/` (Biblioteca), `/juegos/[id]` (Detalle), `/juegos/[id]/jugar` (Reproductor), `/auth` (Auth), `/salon` (Salón de la Fama).
- Componente `Nav` compartido, renderizado desde `app/layout.tsx`, con menú de escritorio, panel móvil (hamburguesa) y estado de apertura local.
- Footer compartido (portado de `app.jsx`) en `app/layout.tsx`.
- Datos mock tipados en `lib/data.ts`: catálogo de 8 juegos (`GAMES`), categorías (`CATS`), lista de jugadores (`PLAYERS`) y la función determinista `seededScores` para generar tablas de puntuaciones.
- Interactividad local por pantalla, sin persistir entre navegaciones ni recargas: buscador y chips de categoría en Biblioteca; tabs Iniciar Sesión/Crear Cuenta en Auth; tabs de juego en Salón de la Fama; pausa, fin de partida, reinicio y modal con input de iniciales en Reproductor (todo en memoria del componente mientras está montado).
- Los estilos y animaciones ya portados en `app/globals.css` y las fuentes ya configuradas en `app/layout.tsx` se mantienen como fuente de verdad visual (tema neon, scanlines, grid, CRT, etc.).

**Fuera:**

- Cualquier juego jugable real (mecánica de input, colisiones, físicas).
- Autenticación real: backend, validación de credenciales, OAuth con Google/GitHub (los botones sociales son solo decorativos).
- Persistencia entre pantallas o recargas: sin `localStorage`, sin cookies, sin base de datos. El `Nav` siempre muestra el estado "no autenticado" (botón "Iniciar Sesión").
- Guardado real de puntuaciones: el botón "Guardar puntuación" del modal de fin de partida solo activa el toast visual "PUNTUACIÓN GUARDADA", no persiste el dato en ningún lado ni actualiza el Salón de la Fama.
- La fila "TU MEJOR MARCA" del Salón de la Fama: nunca se renderiza, al no existir sesión.
- Contador de "créditos" funcional: se muestra fijo como en el template, sin lógica de incrementar/decrementar.
- Cualquier pantalla adicional no listada (perfil, ajustes, checkout, etc.).
- SEO/metadata específico por pantalla más allá del ya definido en `app/layout.tsx`.

## Modelo de datos

`lib/data.ts` exporta:

- `interface Game { id: string; title: string; short: string; long: string; cat: string; cover: string; color: "cyan" | "magenta" | "yellow" | "green"; best: number; plays: string }`
- `const GAMES: Game[]` — los 8 juegos, portados 1:1 desde `references/templates/data.jsx`.
- `const CATS: string[]` — `["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]`.
- `const PLAYERS: string[]` — los 18 nombres de jugadores mock.
- `interface ScoreRow { rank: number; name: string; score: number; date: string }`
- `function seededScores(seed: number, count?: number): ScoreRow[]` — mismo generador pseudoaleatorio determinista del template.

No se introduce ninguna otra estructura de datos ni base de datos.

## Plan de implementación

1. Crear `lib/data.ts` con las interfaces `Game` y `ScoreRow`, y portar `GAMES`, `CATS`, `PLAYERS` y `seededScores` desde `references/templates/data.jsx`.
2. Crear `components/Nav.tsx` (Client Component) portando `nav.jsx`: logo, links de escritorio (Biblioteca, Salón de la Fama) usando `next/link` y `usePathname` para el estado activo, contador de créditos fijo, botón "Iniciar Sesión" que enlaza a `/auth` (sin lógica de sesión), panel móvil con hamburguesa y estado de apertura local (`useState`).
3. Editar `app/layout.tsx` para renderizar `<Nav />` y el `<footer>` (portado de `app.jsx`) alrededor de `{children}`, dejando `app/globals.css` y las fuentes tal como están.
4. Crear `components/Library.tsx` y `components/GameCard.tsx` (Client Components) portando `biblioteca.jsx`: hero con título parpadeante, buscador y chips de categoría con estado local y filtrado en memoria, grid de tarjetas con efecto tilt al mouse, estado vacío "NO HAY RESULTADOS". Cada tarjeta enlaza a `/juegos/[id]` con `next/link`.
5. Reescribir `app/page.tsx` para renderizar `<Library />`.
6. Crear `components/GameDetail.tsx` portando `detalle.jsx`: cover, tags, descripción larga, stat-strip (partidas / mejor global / dificultad), botones "Jugar ahora" (a `/juegos/[id]/jugar`) y "Volver al vault" (a `/`), tabla de leaderboard generada con `seededScores`.
7. Crear `app/juegos/[id]/page.tsx` (Server Component) que resuelve el `id` desde los params dinámicos —revisando antes `node_modules/next/dist/docs/01-app` para confirmar la forma correcta de leer `params` en Next 16.3.2, ya que puede ser asíncrono—, busca el juego en `GAMES` y renderiza `<GameDetail game={game} />`; si el `id` no existe, usar `notFound()`.
8. Crear `components/GamePlayer.tsx` (Client Component) portando `reproductor.jsx`: HUD (jugador "INVITADO", puntuación, vidas, nivel), CRT con arena decorativa animada (CSS), ticker de puntuación por `setInterval` mientras no esté pausado/terminado, botones Pausa/Fin/Salir, modal de fin de partida con input de iniciales y botón "Guardar puntuación" que solo activa el toast "PUNTUACIÓN GUARDADA" (sin persistir), botones "Jugar de nuevo" y "Volver al vault".
9. Crear `app/juegos/[id]/jugar/page.tsx` (Server Component) que resuelve el juego igual que el paso 7 y renderiza `<GamePlayer game={game} />`; `notFound()` si no existe.
10. Crear `components/Auth.tsx` (Client Component) portando `auth.jsx`: tabs Iniciar Sesión/Crear Cuenta con estado local, formulario (usuario, email condicional, contraseña) que al enviar navega a `/` con `router.push` (sin autenticar), botón "Jugar como invitado" (navega a `/`), botones sociales decorativos sin acción real.
11. Crear `app/auth/page.tsx` que renderiza `<Auth />`.
12. Crear `components/HallOfFame.tsx` (Client Component) portando `salon.jsx`: tabs por juego con estado local, podio (2º/1º/3º), tabla completa de posiciones generada con `seededScores`, sin la fila "TU MEJOR MARCA", botón "Volver a la biblioteca".
13. Crear `app/salon/page.tsx` que renderiza `<HallOfFame />`.
14. Ejecutar `npm run dev`, navegar las 5 rutas y verificar visualmente contra los templates (colores, tipografías, animaciones, breakpoints móviles) y que la interactividad local (buscador, chips, tabs, pausa/fin/reinicio del reproductor) funciona sin errores de consola.

## Criterios de aceptación

- [ ] `/` renderiza la Biblioteca con hero, buscador funcional, chips de categoría funcionales y grid de 8 tarjetas de juego.
- [ ] Cada tarjeta de juego navega a `/juegos/[id]` con el detalle correspondiente.
- [ ] `/juegos/[id]` renderiza cover, tags, descripción, stat-strip y leaderboard de 10 filas generado con `seededScores`.
- [ ] El botón "Jugar ahora" en el detalle navega a `/juegos/[id]/jugar`.
- [ ] `/juegos/[id]/jugar` muestra el HUD, la pantalla CRT animada y el ticker de puntuación incrementando mientras no está pausado.
- [ ] El botón "Pausa" detiene el ticker y muestra el overlay "EN PAUSA"; "Reanudar" lo retoma.
- [ ] El botón "Fin" abre el modal de fin de partida con la puntuación final y un input de iniciales; "Guardar puntuación" muestra el toast "PUNTUACIÓN GUARDADA" sin persistir nada.
- [ ] "Jugar de nuevo" reinicia el estado del reproductor; "Volver al vault" navega al detalle del juego.
- [ ] `/auth` muestra el formulario con tabs Iniciar Sesión/Crear Cuenta (el campo email solo aparece en la tab Crear Cuenta) y navega a `/` al enviar o al pulsar "Jugar como invitado", sin crear sesión real.
- [ ] `/salon` muestra tabs por juego, podio y tabla de posiciones, sin la fila "TU MEJOR MARCA".
- [ ] El `Nav` aparece en las 5 rutas, resalta el link activo, muestra siempre el botón "Iniciar Sesión" (nunca estado logueado) y su panel móvil funciona por debajo de 840px.
- [ ] No hay errores ni warnings en la consola del navegador al navegar entre las 5 rutas.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- Se decidió usar rutas de archivo reales de Next.js (`/juegos/[id]`, etc.) en vez de replicar el enrutamiento por hash del prototipo, para aprovechar el App Router real. Se descartó el enrutamiento tipo SPA por hash por no ser idiomático en Next.js.
- Se decidió no persistir nada entre pantallas (sin `localStorage`) para esta primera versión visual; cada pantalla mantiene solo su estado interno en memoria mientras está montada. Se descartó replicar el login/`localStorage` completo del prototipo porque el pedido explícito era "solamente la parte visual".
- Se decidió mantener la simulación decorativa del Reproductor (ticker de puntuación, pausa, modal de fin de partida) porque no constituye un juego real —no hay input del jugador ni mecánica—, cumpliendo con "no implementar ningún juego". Se descartó congelar la pantalla porque perdería la demostración visual de esos estados.
- Se decidió omitir siempre la fila "TU MEJOR MARCA" del Salón de la Fama en vez de mostrarla con datos mock fijos, para no simular una sesión que no existe.
- Se decidió organizar el código en `components/` (un componente por pantalla, más `GameCard`) y `lib/data.ts`, en vez de inlinear todo en cada `page.tsx`, siguiendo el desglose de archivos ya usado en `references/templates/`.
- Se decidió usar segmentos de URL en español (`/juegos`, `/salon`) por consistencia con el idioma de toda la interfaz.
- Se decidió mantener `app/globals.css` y las fuentes de `app/layout.tsx` tal como están (ya portadas desde `styles.css` / `Arcade Vault.html` en una sesión previa) como fuente de verdad visual, sin volver a diseñar con la skill `/frontend-design`.

## Riesgos identificados

- Next.js 16.3.2 puede exigir una forma distinta de leer `params` en rutas dinámicas (por ejemplo, de forma asíncrona) respecto al conocimiento previo del modelo; mitigar revisando `node_modules/next/dist/docs/01-app` antes de implementar los pasos 7 y 9 (ver `AGENTS.md`).
- El efecto de "tilt" 3D de las tarjetas (`biblioteca.jsx`) manipula el DOM directamente vía `ref` y estilos en línea; al portarlo a un Client Component en TypeScript hay que preservar el mismo comportamiento sin introducir librerías nuevas.
- Los estilos de animación (`gridscroll`, `flicker`, `pulse`, etc.) dependen de que `app/globals.css` no haya divergido de `references/templates/styles.css`; conviene diffear ambos archivos antes de implementar por si hay drift.
