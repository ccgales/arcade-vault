# SPEC 20 — Medidas de seguridad básicas (checklist)

> **Estado:** Aprobado
> **Depende de:** SPEC 04 (`04-supabase-base.md`), SPEC 06 (`06-leaderboard-y-tabla-juegos.md`), SPEC 19 (`19-autenticacion-real.md`)
> **Fecha:** 2026-09-30
> **Objetivo:** Aplicar el checklist de `references/security/security-checklist.md` — headers de seguridad en Next.js, política de insert de `scores` endurecida, `EXECUTE` revocado sobre `rls_auto_enable()`, contraseña mínima de 8 caracteres y límite de signups por IP — dejando explícito lo que queda diferido (leaked password protection).

---

## Por qué existe este spec

El checklist (`references/security/security-checklist.md`) reúne cinco ítems propios y cuatro advertencias del linter de Supabase (observadas el 2026-10-01 en el Security Advisor). Cruzado con el código actual:

- **RLS en `games` y `scores`:** ya está habilitado en `supabase/sql/001_games_and_scores.sql` (`alter table ... enable row level security`). Este ítem se reduce a **verificarlo en la base real**, no a implementarlo.
- **`scores_public_insert`:** la política usa `with check (true)` (warning `rls_policy_always_true`). Los `check` de columna de la tabla ya limitan nombre (1–10 caracteres) y `score >= 0`, pero la política en sí no valida nada.
- **`public.rls_auto_enable()`:** función `SECURITY DEFINER` ejecutable por `anon` y `authenticated` vía `/rest/v1/rpc/rls_auto_enable` (dos warnings). **No aparece en ningún `.sql` del repo**: existe solo en la base remota, así que el arreglo es una migración nueva que la deje de exponer, no una edición de un archivo existente.
- **Longitud mínima de contraseña:** `components/Auth.tsx` valida 6 caracteres (mensaje y chequeo previo a `signUp`); el checklist pide 8.
- **Headers de seguridad:** `next.config.ts` no define ninguno.
- **Leaked password protection (warning 4):** es un ajuste de Supabase Auth que depende del plan del proyecto. El proyecto está en Free, así que **se difiere** (ver Decisiones).
- **Límite de signups por IP:** es un ajuste del dashboard (Auth → Rate Limits); SPEC 19 dejó explícitamente fuera "rate limiting propio" y se confió en los defaults. Este spec cambia el default por un valor más estricto, sin código propio.

---

## Scope

**In:**

- `next.config.ts`: función `headers()` que aplica a `source: "/(.*)"` estos cinco headers:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (sin `preload`)
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `supabase/sql/004_security_hardening.sql` (nuevo, migración append-only, se ejecuta manualmente en el SQL Editor o vía el MCP de Supabase ya configurado en `.mcp.json`):
  - Reemplaza la política `scores_public_insert` (`drop policy` + `create policy`) por una con `with check` real: nombre no vacío tras `btrim`, `score` entre `0` y `9999999`, y `game_id` existente en `games`.
  - `revoke execute on function public.rls_auto_enable() from public, anon, authenticated;` — la función no se modifica ni se elimina.
- `components/Auth.tsx`: la longitud mínima de contraseña pasa de 6 a 8, tanto en el chequeo previo a `signUp` como en el mapeo del error devuelto por Supabase. El valor vive en una sola constante del archivo (`MIN_PASSWORD_LENGTH`) para que el mensaje y el chequeo no puedan desincronizarse.
- Configuración manual en el dashboard de Supabase (no automatizable desde código, se documenta como paso del plan):
  - Auth → Sign In / Providers → Password: **Minimum password length = 8**.
  - Auth → Rate Limits → "Rate limit for sign-ups and sign-ins" = **10 cada 5 minutos por IP**.
- Verificación de que RLS está efectivamente activo en `games` y `scores` en la base remota (consulta a `pg_tables`), sin escribir SQL nuevo para eso.

**Fuera de alcance (para futuros specs):**

- **Leaked password protection** (HaveIBeenPwned): bloqueado por el plan Free. Queda abierto como warning `auth_leaked_password_protection` en el Security Advisor hasta que el proyecto pase a un plan que lo permita; entonces es un paso de dashboard + un mensaje de error en `Auth.tsx`, en un spec propio.
- Mover el insert de puntuaciones a un Route Handler (`POST /api/scores`) con rate limit propio y revocar el insert directo de `anon`: es lo que realmente impediría falsificar un score válido, pero toca `lib/scores.ts`, `GamePlayer.tsx` y agrega superficie nueva.
- Asociar puntuaciones a la cuenta logueada (`user_id` en `scores`).
- `Content-Security-Policy`: Next.js + estilos inline + Supabase + OAuth (Google/GitHub) + `next/font/google` exigen ajuste fino y pruebas; es lo más propenso a romper la app.
- Reglas de complejidad de contraseña (mayúsculas, números, símbolos): el checklist solo pide longitud mínima.
- CAPTCHA o rate limiting propio en `/api/contact` o en el login.
- Cualquier otro hallazgo del Security Advisor que no esté en el checklist.
- Tests automatizados: no hay test runner configurado (ver `CLAUDE.md`); la verificación es manual.

---

## Data model

No se crean ni modifican tablas ni columnas: `games` y `scores` quedan con el mismo esquema que en SPEC 06. Cambian una política RLS y un privilegio de función.

Forma de la política nueva de `scores` (el SQL exacto vive en `004_security_hardening.sql`):

```sql
create policy "scores_public_insert" on scores for insert with check (
  char_length(btrim(player_name)) between 1 and 10
  and score between 0 and 9999999
  and exists (select 1 from games g where g.id = game_id)
);
```

Forma de la configuración de headers en `next.config.ts`:

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];
// headers: async () => [{ source: "/(.*)", headers: securityHeaders }]
```

Convenciones:

- La migración es **append-only**: `001`/`002`/`003` no se editan (regla de `CLAUDE.md`).
- Las filas ya existentes en `scores` no se revalidan: `with check` solo aplica a inserts nuevos.
- Variables de entorno: ninguna nueva.

---

## Implementation plan

1. **Headers de seguridad en `next.config.ts`.** Antes de escribir, consultar `node_modules/next/dist/docs/` para confirmar la firma vigente de `headers()` en Next.js 16.3.2 (regla de `AGENTS.md`). Agregar la constante `securityHeaders` y `headers()` junto a `allowedDevOrigins`, sin tocar esa opción. Prueba manual: `npm run dev`, `curl -I http://localhost:3000/` y confirmar los cinco headers; recorrer `/`, `/biblioteca`, `/juegos/serpentina/jugar` y `/auth` sin errores nuevos en la consola.
2. **Contraseña mínima de 8 en `components/Auth.tsx`.** Introducir `MIN_PASSWORD_LENGTH = 8`; usarla en el chequeo previo a `signUp` y en el mensaje; reescribir el mapeo del error de Supabase para que no dependa de la subcadena `"6"`. Prueba manual: registrarse con una contraseña de 7 caracteres y ver el mensaje en la tarjeta, sin llamar a Supabase.
3. **Escribir `supabase/sql/004_security_hardening.sql`** con la política nueva de `scores` y el `revoke` de `rls_auto_enable()`, con el mismo comentario de cabecera que `001` ("ejecutar manualmente..."). Todavía sin aplicar: el repo queda funcional.
4. **Aplicar `004` en Supabase** (SQL Editor o MCP). Prueba manual: terminar una partida en un juego real y guardar la puntuación (debe seguir funcionando); intentar con la anon key un insert con `score = 10000000`, otro con `player_name = '   '` y otro con un `game_id` inexistente (los tres deben fallar con error de RLS, código `42501`); llamar a `/rest/v1/rpc/rls_auto_enable` con la anon key (debe responder error de permisos).
5. **Configurar el dashboard de Supabase:** longitud mínima de contraseña = 8 y límite de sign-ups/sign-ins = 10 cada 5 minutos por IP (ver Riesgos si el campo no es editable en el plan Free).
6. **Verificar RLS en la base real.** Ejecutar `select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('games', 'scores');` y confirmar `true` en ambas filas. Abrir Database → Advisors → Security y confirmar qué warnings quedan.
7. **`npm run build`** sin errores de tipos ni de lint.

---

## Acceptance criteria

- [ ] `curl -I` sobre `/` devuelve `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` y `Permissions-Policy`.
- [ ] Los mismos headers aparecen en una ruta anidada (por ejemplo `/juegos/serpentina/jugar`).
- [ ] La app carga y se navega entre `/`, `/biblioteca`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/salon`, `/acerca-de` y `/auth` sin errores nuevos en la consola del navegador.
- [ ] El flujo de login con correo, registro y OAuth (Google/GitHub) sigue funcionando igual tras agregar los headers.
- [ ] `consulta a pg_tables` devuelve `rowsecurity = true` para `games` y `scores`.
- [ ] Guardar una puntuación válida desde `GamePlayer.tsx` sigue funcionando y aparece en el leaderboard.
- [ ] Un insert directo en `scores` con `score = 10000000` falla con error de RLS.
- [ ] Un insert directo en `scores` con `player_name` formado solo por espacios falla con error de RLS.
- [ ] Un insert directo en `scores` con un `game_id` que no existe en `games` falla.
- [ ] `/rest/v1/rpc/rls_auto_enable` llamado con la anon key devuelve error de permisos.
- [ ] El Security Advisor de Supabase ya no lista `rls_policy_always_true`, `anon_security_definer_function_executable` ni `authenticated_security_definer_function_executable`.
- [ ] El único warning de seguridad que queda en el Security Advisor es `auth_leaked_password_protection`, documentado aquí como diferido.
- [ ] Registrarse con una contraseña de 7 caracteres muestra el mensaje de "al menos 8 caracteres" en la tarjeta de `Auth.tsx`, sin llamar a Supabase.
- [ ] Registrarse con una contraseña de 8 caracteres supera el chequeo local y llega a la pantalla "revisa tu correo".
- [ ] En el dashboard de Supabase, Minimum password length figura en 8 y el límite de sign-ups/sign-ins en 10 cada 5 minutos por IP (o queda registrado que el campo no es editable en Free).
- [ ] `npm run build` compila sin errores de tipos ni de lint.

---

## Decisiones tomadas y descartadas

- **Sí:** endurecer `scores_public_insert` en SQL con condiciones reales (nombre, tope de `score`, `game_id` existente). **No:** moverlo a un Route Handler en este spec: es la solución que sí frena scores falsificados, pero amplía el alcance a `lib/scores.ts` y `GamePlayer.tsx`; queda para un spec propio. El `with check` nuevo solo impide basura obvia, no un score válido pero inventado.
- **Sí:** tope de `score` en `9999999` (7 dígitos). **No:** `999999`, porque podría rechazar partidas legítimas largas; **No:** sin tope, porque deja pasar valores como `2147483647`. Si algún juego legítimo lo supera, se ajusta en una migración nueva.
- **Sí:** revocar `EXECUTE` de `rls_auto_enable()` a `public`, `anon` y `authenticated`. **No:** cambiarla a `SECURITY INVOKER` (podría romper su propósito) ni eliminarla (no está en el repo y puede tener un event trigger que dependa de ella). Revocar es reversible con un `grant`.
- **Sí:** los tres headers del checklist más `Strict-Transport-Security` y `Permissions-Policy`. **No:** `Content-Security-Policy` en este spec, por el riesgo de romper OAuth, fuentes y estilos inline sin una pasada de pruebas dedicada. **No:** `preload` en HSTS, porque es difícil de revertir y no hay dominio de producción confirmado en este spec.
- **Sí:** `X-Frame-Options: DENY`. La app no se embebe en iframes en ninguna parte del repo.
- **Sí:** diferir leaked password protection. El proyecto está en el plan Free y el ajuste depende del plan; implementar el mensaje de error en `Auth.tsx` sin poder activar el ajuste sería código muerto. El warning queda visible y documentado en vez de silenciado.
- **Sí:** contraseña mínima de 8 en dos capas (cliente en `Auth.tsx` y servidor en el dashboard). La capa de cliente da feedback inmediato; la del servidor es la que realmente protege contra llamadas directas a la API.
- **Sí:** límite de 10 sign-ups/sign-ins cada 5 minutos por IP. **No:** el default de 30 (no endurece nada) ni 5 (puede bloquear a varias personas detrás de la misma red). Esto revierte parcialmente la decisión de SPEC 19 de "confiar en los defaults", sin agregar rate limiting propio.
- **Sí:** el ítem "RLS en ambas tablas" se trata como verificación, no como implementación, porque `001_games_and_scores.sql` ya lo habilita.
- **No:** marcar los checkboxes de `references/security/security-checklist.md` como parte de este spec; ese archivo es la fuente del pedido y lo mantiene el usuario.

---

## Riesgos identificados

| Riesgo                                                                                                                                            | Mitigación                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La política nueva rechaza una puntuación legítima (por ejemplo, un nombre con solo espacios que hoy pasa, o un score por encima del tope).        | Probar el guardado real desde un juego en el paso 4 antes de dar el spec por cerrado. Si falla, revertir con `drop policy` + recrear la política original (`with check (true)`) desde el SQL Editor.                       |
| La política depende de que `anon` pueda leer `games` (por el `exists`); si alguien quita `games_public_read`, los inserts empiezan a fallar.      | `games_public_read` sigue vigente (SPEC 06). Documentado aquí como dependencia explícita.                                                                                                                                  |
| `rls_auto_enable()` podría ser invocada por un event trigger con un rol distinto del dueño, y el `revoke` rompería la creación automática de RLS. | Los event triggers corren con los privilegios de quien los define, no de `anon`/`authenticated`; aun así, tras el paso 4, crear una tabla de prueba y confirmar que sigue habilitando RLS, o revertir con `grant execute`. |
| `X-Frame-Options: DENY` o `Referrer-Policy` interfieren con el retorno de OAuth o con el correo de confirmación.                                  | Ninguno de los dos afecta redirects de navegación completa. Las pruebas del paso 1 incluyen el flujo de `/auth` y `/auth/callback`.                                                                                        |
| HSTS queda cacheado en el navegador de quien prueba en `localhost` o en un dominio sin HTTPS.                                                     | Los navegadores ignoran HSTS sobre HTTP plano; en producción el dominio ya debe servir HTTPS. Sin `preload` y con `max-age` de un año, es reversible.                                                                      |
| El campo de rate limit de sign-ups/sign-ins puede no ser editable en el plan Free.                                                                | Se verifica en el paso 5; si está bloqueado, se deja el default y se anota en este spec como "no aplicado por plan" en vez de marcar el criterio como cumplido.                                                            |
| Subir el mínimo a 8 en el servidor mientras `Auth.tsx` seguía en 6 mostraría un mensaje de error con el número equivocado.                        | El paso 2 (código) va antes que el paso 5 (dashboard), y el mapeo de error deja de depender de la subcadena `"6"`.                                                                                                         |
| Cambios hechos a mano en el dashboard no quedan en el repo y pueden perderse o desincronizarse.                                                   | Este spec es el registro de qué valores se configuraron; los criterios de aceptación los verifican explícitamente.                                                                                                         |

---

## What is **not** in this spec

- Leaked password protection (diferido por plan Free; warning `auth_leaked_password_protection` queda abierto).
- Insert de puntuaciones vía Route Handler con rate limit propio.
- `user_id` en `scores` / puntuaciones asociadas a la cuenta.
- `Content-Security-Policy`.
- Reglas de complejidad de contraseña.
- CAPTCHA o rate limiting propio en login o `/api/contact`.
- Otros hallazgos del Security Advisor fuera del checklist.
- Tests automatizados.

Cada uno de estos, si se necesita, va en su propio spec.
