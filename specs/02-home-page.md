# 02 · Página Home (landing)

- **Estado:** Aprobado
- **Depende de:** SPEC 01
- **Fecha:** 2026-08-26
- **Objetivo:** Implementar la landing page real (`home.jsx` de `references/templates/home-about/`) como la nueva ruta `/`, moviendo el catálogo actual a `/biblioteca` y actualizando todos los enlaces internos que hoy asumen que `/` es la Biblioteca.

## Alcance

**Dentro:**

- Nueva ruta `/` que renderiza el componente Home portado de `references/templates/home-about/home.jsx`: hero animado con silhouettes flotantes, sección "¿POR QUÉ ARCADE VAULT?" (4 feature cards), preview de 6 juegos (`GAMES.slice(0, 6)`), sección STATS, sección "ACTIVIDAD EN VIVO" (ticker de últimas puntuaciones + top jugadores del día), sección PRICING (plan único + FAQ), y CTA final.
- Mover la Biblioteca actual (hoy en `/`) a la nueva ruta `/biblioteca`, sin cambiar su comportamiento interno.
- Actualizar todos los enlaces y llamadas de navegación existentes que hoy apuntan a `/` asumiendo que es la Biblioteca (`components/Nav.tsx`, `components/GameDetail.tsx`, `components/GamePlayer.tsx`, `components/HallOfFame.tsx`, `components/Auth.tsx`) para que apunten a `/biblioteca`.
- Animaciones reveal-on-scroll de las secciones del Home (`IntersectionObserver` agregando la clase `.in` a `.reveal`), portadas igual que en el template.
- Estilos CSS del Home portados desde `references/templates/home-about/styles.css` (bloque "HOME PAGE" + reglas compartidas de actividad/ticker y pricing) hacia `app/globals.css`, evitando duplicar selectores ya presentes (p. ej. `.fade-in`).

**Fuera:**

- La pantalla "Acerca de" (`about.jsx`), incluyendo el formulario de contacto: queda explícitamente fuera de este spec, para uno futuro si se solicita.
- Cualquier link de texto "Inicio" o "Acerca de" nuevo en el `Nav`: el `Nav` mantiene su estructura actual (Biblioteca, Salón de la Fama); llegar a Home sigue siendo vía el logo, que ya apuntaba a `/`.
- Cálculo dinámico de los números de la sección STATS ("12+ JUEGOS", etc.): quedan como texto fijo igual que en el template, sin derivarlos de `GAMES.length` ni de ningún otro dato real.
- Generar los datos de "ACTIVIDAD EN VIVO" / "TOP JUGADORES · HOY" a partir de `PLAYERS`/`seededScores` de `lib/data.ts`: se portan como arrays literales hardcodeados dentro del componente Home, igual que en `home.jsx`.
- Cualquier lógica de negocio real: sin backend, sin persistencia, sin autenticación real (continúa la premisa "solo visual" de SPEC 01).
- Redirects o rewrites de compatibilidad hacia la antigua ubicación de la Biblioteca en `/`; no se contempla mantener `/` como alias funcional adicional del catálogo.

## Modelo de datos

No se agrega ninguna estructura nueva a `lib/data.ts`. El componente Home reutiliza `GAMES` (ya existente, tomando los primeros 6 elementos) solo para la sección de preview de juegos. Los arrays de "últimas puntuaciones" (jugador, juego, puntaje, tiempo) y "top jugadores · hoy" (ranking, jugador, puntaje) son literales hardcodeados dentro de `components/Home.tsx`, portados 1:1 desde `home.jsx`, sin exportarse ni reutilizarse en otras pantallas.

## Plan de implementación

1. Editar `app/globals.css`: agregar el bloque de estilos "HOME PAGE" de `references/templates/home-about/styles.css` (hero, título, silhouettes flotantes, `.home-section`, `.feature-grid`/`.feature-card`, `.mini-rail`/`.mini-card`, `.home-stats`, `.home-final`, `.reveal`) junto con las reglas compartidas que el Home necesita y `app/globals.css` todavía no tiene: `.activity-grid`, `.ac-head`, `.ac-title`, `.live-led`, `.lb-link`, `.ticker`, `.tick-row`, `.tk-*`, `.top-list`, `.top-row`, `.tp-*`, `.pricing-grid`, `.price-card`, `.pc-*`, `.pricing-faq`, `.faq-*`. Omitir selectores que ya existen (p. ej. `.fade-in`).
2. Crear `app/biblioteca/page.tsx` que renderiza `<Library />` (el mismo contenido que hoy tiene `app/page.tsx`).
3. Crear `components/Home.tsx` (Client Component) portando `home.jsx`: `FloatingSilhouettes`, `MiniCard` y `FeatureIcon` como subcomponentes internos del mismo archivo; el hook de reveal-on-scroll (`useEffect` + `IntersectionObserver`) igual que en el template; los CTAs y las mini-tarjetas de juego usan `next/link` (`/biblioteca`, `/auth`, `/juegos/[id]`) en vez de la prop `navigate` del prototipo; la sección de preview de juegos usa `GAMES.slice(0, 6)` de `lib/data.ts`; los arrays de actividad/top jugadores y los textos de STATS quedan hardcodeados como en el template.
4. Reescribir `app/page.tsx` para renderizar `<Home />` en vez de `<Library />`.
5. Editar `components/Nav.tsx`: cambiar el `href` del link "Biblioteca" (versión de escritorio y del panel móvil) de `"/"` a `"/biblioteca"`, y ajustar `isActive("biblioteca")` para que se base en `pathname.startsWith("/biblioteca")` (más `/juegos`, sin cambios ahí). El logo (`Link href="/"`) no cambia — ahora apunta a Home correctamente.
6. Editar `components/GameDetail.tsx`: cambiar el botón "Volver al vault" de `href="/"` a `href="/biblioteca"`.
7. Editar `components/GamePlayer.tsx`: cambiar el botón "Volver al vault" de `router.push("/")` a `router.push("/biblioteca")`.
8. Editar `components/HallOfFame.tsx`: cambiar el botón "Volver a la biblioteca" de `href="/"` a `href="/biblioteca"`.
9. Editar `components/Auth.tsx`: cambiar los dos `router.push("/")` (envío del formulario y botón "Jugar como invitado") a `router.push("/biblioteca")`.
10. Ejecutar `npm run dev`, navegar `/` y verificar visualmente el Home completo (hero, silhouettes, sección "por qué", preview de 6 juegos, stats, actividad en vivo, pricing, CTA final) contra `home.jsx`; verificar que `/biblioteca` sigue funcionando igual que antes en `/`; verificar que todos los botones "volver"/"salir"/"jugar como invitado" navegan a `/biblioteca`.
11. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Criterios de aceptación

- [ ] `/` renderiza el Home: hero con título animado y silhouettes flotantes, sección "¿POR QUÉ ARCADE VAULT?" con 4 feature cards, preview de 6 juegos, sección STATS, "ACTIVIDAD EN VIVO" (ticker + top jugadores), PRICING con FAQ, y CTA final.
- [ ] `/biblioteca` renderiza el catálogo (Library) que antes vivía en `/`, sin cambios de comportamiento respecto a SPEC 01.
- [ ] Los botones "▶ EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" del Home navegan a `/biblioteca`.
- [ ] El botón "✦ CREAR CUENTA" del Home y "EMPEZAR GRATIS →" de la sección PRICING navegan a `/auth`.
- [ ] Cada una de las 6 mini-tarjetas de juego del Home navega a `/juegos/[id]` del juego correspondiente.
- [ ] El link "Biblioteca" del Nav (escritorio y móvil) navega a `/biblioteca` y se marca activo en `/biblioteca` y en `/juegos/*`.
- [ ] El logo del Nav sigue navegando a `/` (ahora el Home).
- [ ] "Volver al vault" (Detalle de juego y Reproductor), "Volver a la biblioteca" (Salón de la Fama) y el envío del formulario / "Jugar como invitado" (Auth) navegan a `/biblioteca`.
- [ ] Las secciones del Home con clase `.reveal` se animan (clase `.in`) al hacer scroll hasta ellas.
- [ ] No hay errores ni warnings en la consola del navegador al navegar entre `/`, `/biblioteca` y de vuelta.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- Se decidió limitar este spec exclusivamente a la pantalla Home. Se descartó incluir también "Acerca de" (`about.jsx`) pese a estar en la misma carpeta de referencia, porque el usuario pidió explícitamente no implementarla en este spec.
- Se decidió que `/` pase a ser el Home y que la Biblioteca se mueva a `/biblioteca`, siguiendo la semántica de `nav.jsx` del template (Home y Biblioteca son rutas distintas). Se descartó dejar `/` como Biblioteca y ubicar el Home en una ruta secundaria como `/inicio`, para no dejar la landing "escondida" detrás de una URL no raíz.
- Se decidió no ampliar el `Nav` con un link de texto "Inicio": llegar al Home sigue siendo vía el logo (que ya apuntaba a `/`). Se descartó agregar un cuarto link porque el usuario pidió dejar el Nav como está, más allá del cambio de `href` estrictamente necesario para que "Biblioteca" siga apuntando al catálogo tras el movimiento de ruta.
- Se decidió mantener los números de la sección STATS fijos como texto, igual que el template, en vez de calcular la cantidad de juegos desde `GAMES.length`, para no introducir lógica derivada en una pantalla puramente visual.
- Se decidió portar los arrays de "actividad en vivo" y "top jugadores · hoy" como literales hardcodeados dentro de `components/Home.tsx`, en vez de generarlos con `seededScores`/`PLAYERS` de `lib/data.ts`, para no acoplar el Home a la infraestructura de datos mock de puntuaciones y mantener la fidelidad 1:1 con el template.

## Riesgos identificados

- Mover la Biblioteca de `/` a `/biblioteca` rompe cualquier enlace o marcador externo que apuntara a `/` esperando el catálogo; dentro del código ya se identificaron y listaron todos los puntos que asumían `/` como Biblioteca (`Nav.tsx`, `GameDetail.tsx`, `GamePlayer.tsx`, `HallOfFame.tsx`, `Auth.tsx`) para actualizarlos en el mismo spec y no dejar ningún enlace roto.
- El bloque de estilos "HOME PAGE" de `references/templates/home-about/styles.css` es extenso (~140 líneas) y las secciones de actividad/ticker y pricing usan nombres de clase genéricos (`.top-row`, `.faq-item`, etc.) que podrían colisionar si en un futuro se porta también `about.jsx` u otras pantallas del mismo template; conviene portar solo los bloques necesarios para Home y revisar que no dupliquen selectores ya existentes en `app/globals.css`.
