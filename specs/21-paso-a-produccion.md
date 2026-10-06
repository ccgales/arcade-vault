# SPEC 21 — Paso a producción (Supabase dev → prod)

> **Estado:** Borrador
> **Depende de:** SPEC 04, SPEC 06, SPEC 19, SPEC 20
> **Fecha:** 2026-10-05
> **Objetivo:** Llevar a un proyecto Supabase de producción nuevo el esquema, el catálogo y la configuración de Auth que hoy viven en dev, sin que Claude tenga acceso a producción: Claude solo lee dev y genera los scripts; la persona los aplica a mano y verifica.

---

## Por qué existe este spec

Dev (`gjxfrwhnbfstrdepfyxd`) se construyó con SQL pegado a mano (no hay migraciones registradas: `list_migrations` devuelve `[]`) y con ajustes de dashboard que solo estaban descritos en SPEC 19/20. Producción nace vacía, así que hace falta un script único y un registro de lo configurado a mano.

Inventario de dev (2026-10-05, solo lectura vía MCP):

| Elemento                   | Estado en dev                                                                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Tablas                     | `games` (9 filas), `scores` (103 filas), vista `game_stats`; RLS activo en ambas tablas                                           |
| Políticas                  | `games_public_read`, `scores_public_read`, `scores_public_insert` (versión endurecida de 004)                                     |
| Funciones / event triggers | `rls_auto_enable()` (SECURITY DEFINER, EXECUTE solo para `postgres` y `service_role`) disparada por el event trigger `ensure_rls` |
| Extensiones                | Solo las de fábrica (`pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `plpgsql`, `supabase_vault`); ninguna instalada a mano        |
| Storage / Edge Functions   | 0 buckets, 0 funciones                                                                                                            |
| Auth                       | 1 usuario (cuenta de prueba, no se migra)                                                                                         |
| Security Advisor           | `security_definer_view` (ERROR) sobre `game_stats`; `auth_leaked_password_protection` (WARN, diferido por plan Free)              |

Hallazgos que cambian lo previsto:

1. **`game_stats` es SECURITY DEFINER en dev** (ERROR del Advisor, no estaba documentado en SPEC 20). En prod se crea con `security_invoker = true`; el resultado para `anon` es el mismo porque ambas tablas tienen lectura pública. Dev queda sin tocar (ver Decisiones).
2. **8 de los 9 `games.long` de dev tienen un `\r\n` incrustado en medio del texto** (corrupción, no está en `002_seed.sql`). El bootstrap usa el texto limpio del repo.
3. **`rls_auto_enable()` + `ensure_rls` existen en dev** pero en prod solo si el proyecto se creó con "Enable automatic RLS". El `revoke` del bootstrap es condicional.

---

## Scope

**In:**

- `supabase/prod/000_bootstrap_prod.sql`: esquema, vista, RLS, políticas (con la política de insert ya endurecida), catálogo de 9 juegos, revoke condicional. Transaccional. **Sin filas en `scores`.**
- `supabase/prod/verify.sql`: solo `select`, para comprobar el resultado.
- Checklist de dashboard de Supabase (prod), variables de entorno de Vercel y verificación end-to-end.

**Fuera de alcance:**

- Migrar `scores` (decisión: leaderboard de prod arranca vacío) y usuarios de Auth.
- Dominio propio, DNS y verificación de dominio en Resend.
- Automatizar prod con CLI/CI o dar a Claude cualquier acceso a prod.
- Corregir `game_stats` y los `\r\n` en dev (spec/migración `005` aparte si se quiere).
- Leaked password protection (plan Free), CSP, rate limiting propio.

---

## Implementation plan

Todo lo hace la persona, en este orden. Claude no ejecuta nada contra prod.

### 0. Aislamiento (antes de empezar)

- Prod está en la **misma organización** que dev, y el token OAuth del MCP de Supabase se emite por organización. Recomendado: crear una organización aparte (p. ej. `arcade-vault-prod`) y transferir el proyecto prod (Project Settings → General → Transfer project). En la próxima autorización del MCP, elegir solo la organización de dev.
- `.mcp.json` ya fija `project_ref=gjxfrwhnbfstrdepfyxd`; no cambiarlo.
- No poner claves ni URL de prod en el repo ni en `.env.local`: viven solo en Vercel y en el dashboard.

### 1. Base de datos

1. SQL Editor de prod → pegar `supabase/prod/000_bootstrap_prod.sql` completo → Run.
2. Pegar `supabase/prod/verify.sql` y comparar con la tabla "Resultado esperado".
3. Database → Advisors → Security: debe quedar solo `auth_leaked_password_protection`.

### 2. Authentication (dashboard de prod)

- **URL Configuration:** Site URL = `https://<app>.vercel.app`; Redirect URLs = `https://<app>.vercel.app/auth/callback` (sin `localhost`).
- **Sign In / Providers → Email:** activo, **Confirm email ON**, **Minimum password length = 8**.
- **Rate Limits:** sign-ups y sign-ins = **10 cada 5 minutos por IP**.
- **SMTP propio (Resend):** el SMTP por defecto de Supabase solo entrega a miembros del equipo y con un tope muy bajo; sin SMTP propio los usuarios reales no reciben el correo de confirmación. Host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = API key de Resend, remitente en un dominio verificado. **Bloqueado hasta tener dominio verificado en Resend.**
- **Email Templates:** revisar en el dashboard de dev si se personalizaron y copiarlos (no se pueden leer por MCP).
- **OAuth:** crear credenciales nuevas para prod con callback `https://<ref-prod>.supabase.co/auth/v1/callback`: una OAuth App nueva en GitHub y un client (o URI adicional) en Google. Pegar client id/secret en Auth → Providers.

### 3. Vercel

- Production: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de prod (Project Settings → API Keys), más `RESEND_API_KEY` y `CONTACT_TO_EMAIL`.
- Preview: valores de dev.
- Las `NEXT_PUBLIC_*` se incrustan en el build: redeploy tras cambiarlas.
- Al tener dominio: actualizar Site URL y Redirect URLs en Supabase y el dominio en Vercel (los callbacks de OAuth no cambian).

### Resultado esperado de `verify.sql`

| #   | Consulta          | Esperado                                                                                              |
| --- | ----------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | RLS               | `games` y `scores` con `rowsecurity = true`                                                           |
| 2   | Políticas         | 3 filas; `scores_public_insert` con `btrim`, tope `9999999` y `exists` sobre `games`                  |
| 3   | Vista             | `reloptions = {security_invoker=true}`                                                                |
| 4   | Conteos           | `games_total = 9`, `scores_total = 0`                                                                 |
| 5   | `\r\n` en `long`  | 0 filas                                                                                               |
| 6   | `rls_auto_enable` | 0 filas, o 1 fila con `acl` sin `anon` ni `authenticated`                                             |
| 7   | Catálogo          | 9 ids: asteroides, bloque-buster, caida, duelo-pixel, frogger, gloton, invasores, ranaria, serpentina |

### Rollback

Prod está vacía y el bootstrap es transaccional. Si hay que rehacerlo: `drop view game_stats; drop table scores; drop table games;` en prod y volver a correr el script.

---

## Acceptance criteria

- [ ] `000_bootstrap_prod.sql` corre en prod sin errores y `verify.sql` coincide con la tabla de resultados esperados.
- [ ] El Security Advisor de prod solo lista `auth_leaked_password_protection`.
- [ ] `GET /api/health` en producción responde OK; `/` y `/biblioteca` muestran los 9 juegos; `/salon` aparece vacío sin errores.
- [ ] Jugar un juego real y guardar una puntuación la muestra en el leaderboard de prod.
- [ ] Con la anon key de prod, `POST /rest/v1/scores` con `score = 10000000`, con `player_name = "   "` y con un `game_id` inexistente falla con `42501`.
- [ ] `POST /rest/v1/rpc/rls_auto_enable` con la anon key responde error de permisos o 404.
- [ ] Registro con correo real: llega el correo, el link crea sesión y redirige a `/biblioteca`; login con Google y con GitHub funcionan; "Salir" cierra sesión.
- [ ] El formulario de `/acerca-de` envía el correo.
- [ ] `curl -I https://<app>.vercel.app/` devuelve los 5 headers de SPEC 20.
- [ ] Minimum password length = 8 y límite de 10 cada 5 min por IP figuran en el dashboard de prod.
- [ ] Ninguna clave ni URL de prod quedó en el repo, y el MCP de Claude no tiene acceso a la organización/proyecto de prod.

---

## Decisiones tomadas y descartadas

- **Sí:** un bootstrap único y transaccional en `supabase/prod/`. **No:** correr `001`–`004` en orden en prod: `002` y `003` insertan scores de ejemplo y `004` revoca una función que puede no existir.
- **Sí:** `scores` vacío y sin usuarios de Auth. Decisión del usuario; nada en la app depende de `user_id`.
- **Sí:** `game_stats` con `security_invoker = true` en prod. **No:** replicar el SECURITY DEFINER de dev, que el Advisor marca como ERROR. Dev no se toca en este spec.
- **Sí:** texto de `games` tomado del repo. **No:** copiar las filas de dev por la corrupción `\r\n`.
- **Sí:** `revoke` condicional con `to_regprocedure`. **No:** crear `rls_auto_enable()`/`ensure_rls` en prod: no hay nada que lo exija y prod solo necesita que RLS esté activo, cosa que el script hace explícitamente.
- **Sí:** el catálogo se carga con `insert` en el bootstrap, sin pg_dump ni acceso a la base de prod desde esta máquina. **No:** usar el MCP ni la CLI contra prod.
- **Sí:** organización separada para prod (recomendado). Mientras comparta organización con dev, el aislamiento depende solo del `project_ref` de `.mcp.json`.
- **Sí:** previews de Vercel contra dev, producción contra prod.

---

## Riesgos identificados

| Riesgo                                                                                 | Mitigación                                                                                                      |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Sin SMTP propio nadie fuera del equipo recibe el correo de confirmación                | Paso 2 de Authentication; requiere dominio verificado en Resend. Hasta entonces el registro por correo no sirve |
| Redirect URLs o Site URL mal puestas rompen la confirmación de correo y OAuth          | Verificación end-to-end en Acceptance criteria                                                                  |
| Usar credenciales de dev en Vercel Production por error                                | Comprobar en `verify`/health que la URL del proyecto es la de prod; redeploy tras cambiar variables             |
| Proyecto prod en la misma organización que dev                                         | Paso 0 (organización aparte)                                                                                    |
| La vista con `security_invoker` falla si alguien quita una política de lectura pública | Dependencia documentada; `verify.sql` consulta 4 lo detectaría                                                  |
| Tope de `score` `9999999` rechaza partidas legítimas                                   | Igual que en SPEC 20: ajustar con una migración nueva                                                           |

---

## What is **not** in this spec

- Migración de `scores` y de usuarios de Auth.
- Dominio propio y verificación de dominio.
- Corregir `game_stats` y los `\r\n` en dev.
- Leaked password protection, CSP y rate limiting propio.

Cada uno de estos, si se necesita, va en su propio spec.
