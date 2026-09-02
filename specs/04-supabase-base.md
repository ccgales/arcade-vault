# 04 · Infraestructura base de Supabase

- **Estado:** Implementado
- **Depende de:** Ninguna
- **Fecha:** 2026-08-31
- **Objetivo:** Instalar y configurar la infraestructura base de Supabase (clientes de browser y server, variables de entorno, y un endpoint de health-check) para que specs futuros de autenticación y persistencia de datos puedan apoyarse en ella, sin modificar ninguna pantalla ni funcionalidad existente.

## Scope

**Dentro:**

- Instalar las dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- Crear `lib/supabase/client.ts`: cliente de Supabase para Client Components, vía `createBrowserClient`.
- Crear `lib/supabase/server.ts`: cliente de Supabase para Server Components y Route Handlers, vía `createServerClient` usando `cookies()` de `next/headers` (asíncrono en esta versión de Next).
- Variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: valores reales en `.env.local` (no versionado) y documentadas sin valores en `.env.example`.
- Route Handler `app/api/health/route.ts`: `GET` que instancia el cliente server de Supabase, hace una llamada mínima (`supabase.auth.getSession()`) y responde `{ ok: true }` si no hay error de conexión, o `{ ok: false, error }` si lo hay.
- Dependencia nueva en `package.json`.

**Fuera de alcance (para futuros specs):**

- Autenticación real (reemplazar el login simulado de `Auth.tsx`).
- Persistencia de puntuaciones (reemplazar `seededScores()` en `HallOfFame.tsx` y el "GUARDAR PUNTUACIÓN" de `GamePlayer.tsx`).
- Migrar el catálogo de juegos (`GAMES` de `lib/data.ts`) a una tabla de Supabase.
- Creación del proyecto de Supabase en el dashboard: ya existe (credenciales disponibles), este spec no documenta ese paso.
- `SUPABASE_SERVICE_ROLE_KEY` u operaciones server-side con privilegios elevados.
- Middleware de Next.js (`middleware.ts`) para refrescar sesión: no aplica todavía porque no hay sesión de usuario que mantener; se agrega junto con el spec de autenticación.
- Cualquier cambio visual o de comportamiento en pantallas existentes (Home, Biblioteca, Detalle de juego, Reproductor, Auth, Salón de la Fama, Acerca de).

## Data model

Este spec no crea tablas ni estructuras de datos en Supabase. Solo define el contrato de la respuesta del health-check:

```ts
// GET /api/health
type HealthResponse = { ok: true } | { ok: false; error: string };
```

Variables de entorno (`.env.local`, no versionadas; documentadas sin valores en `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto de Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública (anon) del proyecto, sujeta a RLS.

## Implementation plan

1. Instalar las dependencias (`npm install @supabase/supabase-js @supabase/ssr`).
2. Agregar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.example` (sin valores) y a `.env.local` (con los valores reales del proyecto ya creado).
3. Crear `lib/supabase/client.ts` exportando una función `createClient()` que llama a `createBrowserClient(url, anonKey)` de `@supabase/ssr`, para usar desde Client Components.
4. Crear `lib/supabase/server.ts` exportando una función `async createClient()` que hace `await cookies()` de `next/headers` y llama a `createServerClient(url, anonKey, { cookies: {...} })` de `@supabase/ssr`, para usar desde Server Components y Route Handlers.
5. Crear `app/api/health/route.ts` con un `GET` que instancia el cliente server (`lib/supabase/server.ts`), llama a `supabase.auth.getSession()`, y responde `200 { ok: true }` si no hay error, o `500 { ok: false, error }` si Supabase devuelve un error (ej. credenciales inválidas).
6. Ejecutar `npm run dev`, visitar `/api/health` y confirmar que responde `{ ok: true }`; probar temporalmente con una `NEXT_PUBLIC_SUPABASE_ANON_KEY` inválida para confirmar que responde `{ ok: false, error }` con status 500, y luego restaurar el valor correcto.
7. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Acceptance criteria

- [ ] `npm install` agrega `@supabase/supabase-js` y `@supabase/ssr` a `package.json` sin errores.
- [ ] `lib/supabase/client.ts` exporta un cliente de Supabase utilizable desde Client Components.
- [ ] `lib/supabase/server.ts` exporta un cliente de Supabase utilizable desde Server Components y Route Handlers, usando `await cookies()`.
- [ ] Visitar `/api/health` con las credenciales reales en `.env.local` responde `200 { ok: true }`.
- [ ] Con una `NEXT_PUBLIC_SUPABASE_ANON_KEY` inválida, `/api/health` responde `500 { ok: false, error }`.
- [ ] `.env.example` documenta `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` sin valores reales.
- [ ] Ninguna pantalla existente (Home, Biblioteca, Auth, Detalle de juego, Reproductor, Salón de la Fama, Acerca de) cambia de comportamiento visual o funcional.
- [ ] No hay errores ni warnings en la consola del navegador al visitar `/api/health`.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** instalar `@supabase/ssr` además de `@supabase/supabase-js`, aunque este spec no implemente auth todavía, para dejar la estructura de clientes (browser/server) lista y evitar rehacerla en el spec de autenticación. **No:** un cliente único con `@supabase/supabase-js` a secas, porque no maneja bien la sesión SSR basada en cookies que va a necesitar el spec de auth.
- **Sí:** `app/api/health/route.ts` como verificación de conexión, permanente en el repo. **No:** verificación manual temporal con `console.log`, porque no deja ningún artefacto verificable una vez cerrado el spec.
- **Sí:** configurar solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en este spec. **No:** agregar ya `SUPABASE_SERVICE_ROLE_KEY`, porque no hay ninguna operación server-side con privilegios elevados en el alcance actual; se agrega cuando un spec futuro realmente la necesite.
- **No:** tocar `Auth.tsx`, `seededScores()` o `lib/data.ts` en este spec. Se mantiene la premisa de "infraestructura base sin funcionalidad nueva" para poder mergear este spec de forma aislada antes de decidir el diseño de auth y puntuaciones.
- **No:** agregar `middleware.ts` para refrescar sesión. No hay sesión de usuario que mantener todavía; se agrega junto con el spec de autenticación.

## Riesgos identificados

| Riesgo                                                                                                                                                                 | Mitigación                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Las credenciales reales de Supabase quedan en `.env.local`, que no está versionado, pero podría commitearse por error.                                                 | `.env.local` ya está cubierto por `.gitignore` vía `.env*` (verificado en SPEC 03); no se requiere cambio adicional.                                      |
| El proyecto de Supabase configurado externamente podría tener RLS deshabilitado o mal configurado, dejando datos expuestos cuando se agreguen tablas en specs futuros. | Fuera de alcance de este spec (no se crean tablas todavía); queda documentado como algo a revisar en el spec de auth/puntuaciones.                        |
| `@supabase/ssr` puede requerir ajustes si la firma de `cookies()` u otras APIs de `next/headers` difieren de versiones anteriores de Next.                             | Se verificó en `node_modules/next/dist/docs` que `cookies()` es asíncrono en esta versión (16.3.2); `lib/supabase/server.ts` debe usar `await cookies()`. |

## What is **not** in this spec

- Autenticación real (reemplazar `Auth.tsx`).
- Persistencia de puntuaciones (reemplazar `seededScores()`).
- Migración del catálogo de juegos a una tabla de Supabase.
- Creación del proyecto de Supabase en el dashboard.
- `SUPABASE_SERVICE_ROLE_KEY` u operaciones con privilegios elevados.
- Middleware de Next.js para refrescar sesión.
- Cambios visuales o de comportamiento en pantallas existentes.

Cada uno de estos, si se necesita, va en su propio spec.
