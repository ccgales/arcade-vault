# SPEC 19 — Autenticación real con Supabase Auth

> **Estado:** Aprobado
> **Depende de:** SPEC 04 (`04-supabase-base.md`)
> **Fecha:** 2026-09-29
> **Objetivo:** Reemplazar el login/registro simulado de `Auth.tsx` por autenticación real con Supabase Auth (correo/contraseña con confirmación por email, más Google y GitHub OAuth), reflejando el estado de sesión en `Nav.tsx` sin exigir sesión para jugar como invitado.

---

## Por qué existe este spec

SPEC 04 instaló los clientes de Supabase (`lib/supabase/client.ts`, `lib/supabase/server.ts`) pero dejó explícitamente fuera de su alcance "Autenticación real (reemplazar el login simulado de `Auth.tsx`)" y el middleware de refresco de sesión, a la espera de este spec. Hoy `Auth.tsx` no llama a Supabase en absoluto: `submit()` hace `router.push("/biblioteca")` sin crear ninguna sesión, tanto en "Iniciar sesión" como en "Crear cuenta", y "JUGAR COMO INVITADO" hace lo mismo.

Next.js 16.3.2 (la versión fijada en este repo) **deprecó `middleware.ts` en favor de `proxy.ts`** (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`): incluso funcionalidad, solo cambia el nombre de archivo y de la función exportada (`proxy` en vez de `middleware`). Este spec usa `proxy.ts`, no `middleware.ts`.

---

## Scope

**In:**

- `proxy.ts` en la raíz del repo (no `middleware.ts`): refresca la sesión de Supabase en cada request usando el patrón estándar de `@supabase/ssr` para Proxy/Middleware, y redirige `/auth` (y cualquier subruta bajo `/auth` salvo `/auth/callback`) a `/biblioteca` cuando ya hay una sesión activa.
- `app/auth/callback/route.ts` (nuevo): `GET` que recibe `?code=...` (tanto del link de confirmación de correo como del retorno de OAuth), llama a `supabase.auth.exchangeCodeForSession(code)` con el cliente de servidor, y redirige a `/biblioteca` si tiene éxito o a `/auth?error=...` si falla.
- `components/Auth.tsx` reescrito:
  - Se elimina el campo "Usuario" como concepto separado; ambas pestañas piden **correo electrónico** y **contraseña**. "Crear cuenta" agrega **repetir contraseña** (validación solo de cliente, ambas deben coincidir antes de enviar).
  - "Iniciar sesión" llama a `supabase.auth.signInWithPassword({ email, password })`.
  - "Crear cuenta" llama a `supabase.auth.signUp({ email, password, options: { emailRedirectTo: \`${origin}/auth/callback\` } })`.
  - Tras un `signUp` exitoso se muestra un estado "revisa tu correo" dentro de la misma tarjeta (no se navega a otra ruta), en vez de iniciar sesión de inmediato, porque la confirmación de correo queda habilitada (ver Decisiones).
  - Caso "ya existe una cuenta con este correo": con `supabase-js` 2.112.4, si el correo ya está registrado y confirmado, `signUp` no devuelve error pero el `user` resultante trae `identities: []` y `session: null`. `Auth.tsx` detecta ese caso (`identities.length === 0`) y muestra un mensaje distinto ("ya existe una cuenta con este correo, iniciá sesión") en vez de la pantalla "revisa tu correo".
  - Estados de error visibles en la tarjeta (no `alert`/`console` únicamente): credenciales inválidas, contraseña menor a 6 caracteres, correo con formato inválido, contraseñas que no coinciden, error de red/servicio genérico.
  - Estado de carga en el botón de submit mientras la llamada a Supabase está en curso (deshabilitado + texto de espera).
  - Los botones "◆ GOOGLE" / "▣ GITHUB" dejan de ser decorativos: llaman a `supabase.auth.signInWithOAuth({ provider: "google" | "github", options: { redirectTo: \`${origin}/auth/callback\` } })`.
  - "JUGAR COMO INVITADO" no cambia: sigue sin crear sesión y navega a `/biblioteca`.
- `components/Nav.tsx` refleja el estado de sesión, en el nav de escritorio y en `av-mobile-panel`:
  - Sin sesión: se mantiene el link "Iniciar Sesión" tal cual existe hoy.
  - Con sesión: se reemplaza por la parte local del correo (antes de `@`, en mayúsculas, para mantener el tono `mono`/pixel del resto del nav) + un botón "Salir".
  - "Salir" llama a `supabase.auth.signOut()` (cliente de browser) y refresca la vista.
  - Lee la sesión con el cliente de browser al montar y se suscribe a `supabase.auth.onAuthStateChange` para mantenerse sincronizado sin recargar la página.
- Nuevos estados visuales (mensaje "revisa tu correo", banners de error, botón en estado de carga) pasan por `/frontend-design` durante la implementación para mantener coherencia con el `auth-card` existente — ver Implementation plan, paso 8.
- Configuración manual documentada como parte del spec (se hace en el dashboard de Supabase, fuera del repo, no automatizable desde código): habilitar los proveedores Google y GitHub con su client id/secret, mantener "Confirm email" activado, y configurar Site URL + Redirect URLs incluyendo `http://localhost:3000/auth/callback` y el dominio de producción.

**Fuera de alcance (para futuros specs):**

- Recuperar contraseña ("¿olvidaste tu contraseña?"): queda para un spec aparte.
- Exigir sesión para jugar: la app se mantiene invitado-first; ninguna ruta de juego ni `/biblioteca` se protege con `proxy.ts`.
- Asociar puntuaciones a la cuenta logueada: `GamePlayer.tsx`, `lib/scores.ts` y la tabla `scores` no cambian en este spec. El campo "name" del guardado de puntuación sigue siendo texto libre tipeado en cada partida.
- Pantalla de perfil/cuenta (cambiar nombre, avatar, contraseña desde una pantalla separada de la de login).
- Roles o permisos diferenciados (admin, moderador).
- Rate limiting propio contra fuerza bruta: se confía en las protecciones por defecto de Supabase Auth.
- Tests automatizados: no hay test runner configurado en este repo (ver `CLAUDE.md`); la verificación es manual.

---

## Data model

No se crea ni modifica ninguna tabla SQL: `games` y `scores` quedan igual que en SPEC 04/06. Supabase Auth mantiene su propio esquema interno (`auth.users`, `auth.identities`, etc.) fuera del control de esta app.

Contrato del nuevo endpoint:

```ts
// GET /auth/callback?code=<string>
// éxito → redirect 302 a /biblioteca
// error → redirect 302 a /auth?error=<mensaje-corto>
```

Variables de entorno: ninguna nueva. Se reutilizan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, ya presentes en `.env.local`/`.env.example` desde SPEC 04.

---

## Implementation plan

1. **`proxy.ts` en la raíz del repo.** Cliente Supabase de servidor construido con `createServerClient` de `@supabase/ssr`, leyendo/escribiendo cookies desde `NextRequest`/`NextResponse` (patrón estándar de refresco de sesión en Proxy). Llama a `supabase.auth.getUser()` para forzar el refresco del token. `matcher` excluye `_next/static`, `_next/image`, `favicon.ico` y archivos con extensión estática. Si `pathname` empieza con `/auth` y no es `/auth/callback`, y hay sesión, `NextResponse.redirect` a `/biblioteca`.
2. **`app/auth/callback/route.ts`.** `GET` que lee `code` de `request.nextUrl.searchParams`, usa el cliente de servidor (`lib/supabase/server.ts`) para `exchangeCodeForSession(code)`, y redirige a `/biblioteca` o a `/auth?error=...`. Prueba manual: visitar la URL con un `code` inválido y confirmar el redirect de error.
3. **Reescribir `components/Auth.tsx`: formulario y llamadas reales.** Campos correo/contraseña(/repetir), estados de carga y error, `signInWithPassword` y `signUp` con `emailRedirectTo`. Prueba manual: crear una cuenta nueva con un correo real y ver la pantalla "revisa tu correo".
4. **Detección de correo ya registrado y pantalla "revisa tu correo".** Rama `identities.length === 0` tras `signUp`; estado de la tarjeta que reemplaza el formulario por el mensaje de confirmación.
5. **Botones OAuth reales.** `signInWithOAuth` para Google y GitHub en los botones existentes de "O CONTINÚA CON". Requiere tener los proveedores configurados en el dashboard de Supabase antes de poder probarlo end-to-end.
6. **Cerrar el ciclo de confirmación de correo.** Con los tres pasos anteriores ya en el repo: crear cuenta → recibir correo → click en el link → cae en `/auth/callback` → sesión creada → redirect a `/biblioteca`. Verificación manual completa.
7. **Actualizar `components/Nav.tsx`.** Cliente de browser, lectura de sesión al montar + `onAuthStateChange`, render condicional (correo/"Salir" vs "Iniciar Sesión") en el nav de escritorio y en `av-mobile-panel`, botón "Salir" con `signOut()` + refresco.
8. **Pulir estados visuales nuevos con `/frontend-design`.** Mensajes de error, pantalla "revisa tu correo", botones en estado de carga: coherentes con el `auth-card`/tema CRT-neón existente, sin tocar layout de páginas ya estables.
9. **`npm run build`** sin errores de tipos ni de lint.

---

## Acceptance criteria

- [ ] Crear una cuenta nueva con correo/contraseña muestra la pantalla "revisa tu correo" en vez de navegar directo a `/biblioteca`.
- [ ] Click en el link de confirmación del correo recibido crea una sesión real y redirige a `/biblioteca`.
- [ ] Iniciar sesión con un correo/contraseña ya confirmados navega a `/biblioteca` con sesión activa.
- [ ] Iniciar sesión con contraseña incorrecta muestra un mensaje de error visible en la tarjeta, sin navegar.
- [ ] Intentar registrarse con un correo ya confirmado muestra el mensaje de "ya existe una cuenta con este correo" en vez de la pantalla "revisa tu correo".
- [ ] El botón "◆ GOOGLE" inicia el flujo real de OAuth de Google y, al volver, deja una sesión activa.
- [ ] El botón "▣ GITHUB" inicia el flujo real de OAuth de GitHub y, al volver, deja una sesión activa.
- [ ] "JUGAR COMO INVITADO" sigue llevando a `/biblioteca` sin crear ninguna sesión.
- [ ] Visitar `/auth` con una sesión ya activa redirige automáticamente a `/biblioteca`.
- [ ] Con sesión activa, `Nav.tsx` muestra la parte local del correo (antes de `@`) y un botón "Salir", tanto en escritorio como en el panel móvil.
- [ ] Click en "Salir" cierra la sesión y `Nav.tsx` vuelve a mostrar "Iniciar Sesión".
- [ ] Sin sesión, `/biblioteca`, `/juegos/[id]` y `/juegos/[id]/jugar` siguen siendo accesibles sin redirect a `/auth`.
- [ ] Guardar una puntuación en `GamePlayer.tsx` sigue funcionando igual que hoy (nombre libre, sin relación con la cuenta logueada).
- [ ] No hay errores ni warnings nuevos en la consola del navegador durante el flujo de login/registro/logout.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

---

## Decisiones tomadas y descartadas

- **Sí:** `proxy.ts` en la raíz. **No:** `middleware.ts`, porque Next.js 16.3.2 deprecó ese nombre de archivo (ver `node_modules/next/dist/docs/.../proxy.md`); usar el nombre viejo habría generado el mismo warning de deprecación que `AGENTS.md` pide evitar.
- **Sí:** correo/contraseña + Google + GitHub OAuth reales. **No:** dejar los botones de Google/GitHub decorativos, porque ya existen en la UI y el usuario pidió que la autenticación sea real, no parcialmente simulada.
- **Sí:** confirmación de correo obligatoria (comportamiento por defecto de Supabase Auth, se mantiene activado). **No:** desactivarla para frictionless demo, decisión explícita del usuario en la fase de preguntas.
- **Sí:** el campo "Usuario" del formulario pasa a ser el correo electrónico; se elimina el concepto de nombre de usuario separado. **No:** agregar una columna/tabla de perfiles para un nombre de usuario propio, porque el usuario prefirió no sumar esa superficie en este spec. El nombre mostrado en `Nav.tsx` es la parte local del correo.
- **Sí:** la app se mantiene invitado-first; ninguna ruta se protege. **No:** exigir sesión para jugar, decisión explícita del usuario — mantiene el comportamiento actual de "JUGAR COMO INVITADO".
- **No:** conectar la sesión con el guardado de puntuaciones (ni autocompletar el nombre ni agregar `user_id` a `scores`). Decisión explícita del usuario para no ampliar el alcance de este spec; queda para uno futuro.
- **No:** "¿olvidaste tu contraseña?" en este spec. Decisión explícita del usuario para no seguir creciendo el alcance.
- **Sí:** `/auth` redirige a `/biblioteca` cuando ya hay sesión activa, resuelto en `proxy.ts` (no en `app/auth/page.tsx`) para no duplicar la lectura de sesión en cada página que la necesite.
- **Sí:** repetir contraseña solo en "Crear cuenta", validación de cliente antes de llamar a `signUp`. Es una defensa barata contra errores de tipeo y no agrega alcance real (no toca backend).
- **No:** rate limiting propio ni CAPTCHA. Se confía en las protecciones por defecto de Supabase Auth; agregar algo propio es prematuro sin evidencia de abuso.

---

## Riesgos identificados

| Riesgo                                                                                                                                                          | Mitigación                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Los proveedores Google/GitHub OAuth no están configurados todavía en el dashboard de Supabase (client id/secret, redirect URLs).                                | Paso manual documentado en el Scope y en el Implementation plan (paso 5); los botones no van a funcionar hasta completarlo, pero el resto del flujo (correo/contraseña) no depende de eso. |
| El correo de confirmación puede llegar a spam o no llegar durante pruebas manuales.                                                                             | Revisar la carpeta de spam durante la verificación; si Resend/Supabase no entrega, se puede confirmar el usuario manualmente desde el dashboard de Supabase como fallback de prueba.       |
| El comportamito de `signUp` ante un correo ya registrado (`identities: []`, sin error) depende de la versión de `@supabase/supabase-js` (2.112.4 en este repo). | Verificado contra la versión instalada al escribir este spec; si se actualiza el paquete, revalidar el caso "ya existe una cuenta" manualmente antes de dar el spec por cerrado.           |
| `proxy.ts` corre en cada request (salvo lo excluido por `matcher`); un error ahí puede tumbar toda la navegación del sitio.                                     | Mantenerlo mínimo (solo refresco de sesión + un redirect condicional), sin lógica de negocio, siguiendo la recomendación de los docs de Next de usar Proxy "como último recurso".          |
| Site URL / Redirect URLs mal configuradas en el dashboard de Supabase rompen tanto la confirmación de correo como el retorno de OAuth.                          | Documentado explícitamente en el Scope como paso manual a verificar antes de las pruebas del Implementation plan (pasos 3–6).                                                              |

---

## What is **not** in this spec

- Recuperar contraseña ("¿olvidaste tu contraseña?").
- Requerir sesión para jugar (la app sigue invitado-first).
- Asociar puntuaciones a la cuenta logueada (`user_id` en `scores`, autocompletar el nombre en `GamePlayer.tsx`).
- Pantalla de perfil/cuenta.
- Roles o permisos diferenciados.
- Rate limiting o CAPTCHA propios.
- Tests automatizados.

Cada uno de estos, si se necesita, va en su propio spec.
