# 03 · Página About + formulario de contacto (Resend)

- **Estado:** Implementado
- **Depende de:** SPEC 02
- **Fecha:** 2026-08-26
- **Objetivo:** Implementar la página About de Arcade Vault (`about.jsx` de `references/templates/home-about/`) como la nueva ruta `/acerca-de`, con un formulario de contacto que envía correos reales mediante Resend en vez de la simulación del template.

## Scope

**Dentro:**

- Nueva ruta `/acerca-de` que renderiza el componente About portado de `about.jsx`: hero "ACERCA DE ARCADE VAULT" con misión y 3 highlights (`HighlightIcon` interno), divider decorativo animado, y sección de contacto con formulario (nombre, correo, mensaje).
- Link "Acerca de" agregado a `components/Nav.tsx` (menú de escritorio y panel móvil), con su propio estado activo (`pathname.startsWith("/acerca-de")`).
- Envío real de correos desde el formulario usando el SDK oficial `resend`, a través de un Route Handler (`app/api/contact/route.ts`) y un módulo `lib/email.ts` que encapsula la llamada a Resend.
- Validación server-side de los campos (`name`, `email`, `message` no vacíos; `email` con formato válido) antes de llamar a Resend.
- Protección anti-spam mediante un campo honeypot oculto (`website`) en el formulario: si llega lleno, el servidor no llama a Resend pero responde como si el envío hubiera sido exitoso.
- Estados de UI del formulario: envío en curso (botón "ENVIANDO…" deshabilitado), éxito (la animación de terminal ya existente en el template, ahora disparada por una respuesta real del servidor) y error (mensaje inline dentro del formulario, sin borrar lo que el usuario escribió, permitiendo reintentar).
- Animaciones reveal-on-scroll del About (mismo mecanismo `.reveal`/`.in` con `IntersectionObserver` ya usado en Home) y el bloque de estilos "ABOUT PAGE" de `references/templates/home-about/styles.css` portado a `app/globals.css`, evitando duplicar selectores ya presentes (p. ej. `.divider`).
- Variables de entorno `RESEND_API_KEY` y `CONTACT_TO_EMAIL`, documentadas en un nuevo `.env.example` (sin valores reales; `.env.local` ya está cubierto por `.gitignore` vía `.env*`).
- Dependencia nueva `resend` en `package.json`.

**Fuera de alcance (para futuros specs):**

- Verificación de un dominio propio en Resend: se usa el dominio de pruebas `onboarding@resend.dev` como remitente fijo.
- Persistencia de los mensajes de contacto en base de datos, archivo o cualquier otro medio: solo se envían por correo.
- Rate limiting, CAPTCHA o cualquier protección anti-spam más allá del honeypot simple.
- Agregar el link de texto "Inicio" al Nav: se mantiene la decisión de SPEC 02 de usar el logo como única vía a Home.
- Cambios a las pantallas ya implementadas en SPEC 01/02 (Biblioteca, Detalle de juego, Reproductor, Auth, Salón de la Fama, Home).

## Data model

Este feature no agrega datos persistidos, pero sí define el contrato del Route Handler y las variables de entorno nuevas.

```ts
// POST /api/contact — body
interface ContactRequest {
  name: string;
  email: string;
  message: string;
  website: string; // honeypot; debe llegar vacío en un envío legítimo
}

// Respuesta
type ContactResponse =
  | { ok: true }
  | { ok: false; error: string };
```

Variables de entorno (`.env.local`, no versionadas; documentadas sin valores en `.env.example`):

- `RESEND_API_KEY`: API key de la cuenta de Resend.
- `CONTACT_TO_EMAIL`: correo que recibe los mensajes del formulario. En modo sandbox de Resend (sin dominio propio verificado), debe ser el mismo correo con el que se creó la cuenta de Resend, o la entrega falla.

El remitente (`from`) queda fijo en el código como `"Arcade Vault <onboarding@resend.dev>"`, sin variable de entorno, por ser el dominio de pruebas de Resend.

## Implementation plan

1. Instalar la dependencia `resend` (`npm install resend`) y crear `.env.example` en la raíz documentando `RESEND_API_KEY` y `CONTACT_TO_EMAIL` sin valores reales.
2. Editar `app/globals.css`: agregar el bloque de estilos "ABOUT PAGE" de `references/templates/home-about/styles.css` (`.about-hero`, `.about-mission`, `.highlight-row`/`.highlight`, `.about-divider`/`.div-bar`/`.div-pixels`, `.about-contact`/`.contact-grid`/`.contact-intro`/`.contact-form`/`.contact-tips`, `.terminal-success`/`.term-*`, `.btn.press`), omitiendo selectores que ya existen (p. ej. `.divider`).
3. Crear `components/About.tsx` (Client Component) portando la estructura visual de `about.jsx`: hero, `highlight-row` con `HighlightIcon` interno, divider decorativo con `.reveal`, y la sección de contacto con el formulario — por ahora con el `onSubmit` todavía simulado como en el template (sin llamar a la API), dejando la pantalla navegable y visualmente completa.
4. Crear `app/acerca-de/page.tsx` que renderiza `<About />`.
5. Editar `components/Nav.tsx`: agregar el link "Acerca de" (`href="/acerca-de"`) en el menú de escritorio y en el panel móvil, con su propio chequeo de activo; el link "Inicio" no se agrega.
6. Crear `lib/email.ts` con una función `sendContactEmail({ name, email, message })` que instancia el cliente de Resend (`new Resend(process.env.RESEND_API_KEY)`) y llama a `resend.emails.send(...)` con `from: "Arcade Vault <onboarding@resend.dev>"`, `to: process.env.CONTACT_TO_EMAIL`, `reply_to: email`, y `subject`/`html` armados a partir de los datos del formulario.
7. Crear el Route Handler `app/api/contact/route.ts` con un `POST` que: valida que `name`, `email` y `message` no estén vacíos y que `email` tenga formato válido; si `website` (honeypot) viene lleno, responde `200 { ok: true }` sin llamar a Resend; si la validación de campos falla, responde `400 { ok: false, error }`; si todo es válido, llama a `sendContactEmail` y responde `200 { ok: true }`, o `500 { ok: false, error }` si Resend lanza un error.
8. Editar `components/About.tsx`: agregar el campo honeypot oculto (`website`, invisible para humanos vía CSS) al formulario; cambiar `onSubmit` para hacer `fetch("/api/contact", { method: "POST", body: JSON.stringify(...) })`; mientras la petición está en curso, el botón de envío muestra "ENVIANDO…" y se deshabilita; si la respuesta es `{ ok: true }`, se muestra el estado de éxito tipo terminal ya existente en el template; si falla, se muestra un mensaje de error inline dentro del formulario, sin borrar lo que el usuario escribió.
9. Ejecutar `npm run dev`, navegar a `/acerca-de` y verificar visualmente contra `about.jsx`; verificar que el link "Acerca de" del Nav navega y se marca activo; con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` configurados en `.env.local`, enviar un mensaje real de prueba y confirmar que llega al correo configurado; verificar el estado de error usando una `RESEND_API_KEY` inválida; verificar que llenar el campo honeypot no dispara el envío real pero igual muestra éxito en pantalla; verificar que enviar el formulario con campos vacíos muestra la animación `shake` sin llamar a la API.
10. Ejecutar `npm run build` para confirmar que compila sin errores de tipos ni de lint.

## Acceptance criteria

- [ ] `/acerca-de` renderiza el hero, los 3 highlights, el divider decorativo y el formulario de contacto, igual que `about.jsx`.
- [ ] El link "Acerca de" aparece en el Nav (escritorio y móvil), navega a `/acerca-de` y se marca activo en esa ruta.
- [ ] El logo sigue siendo la única vía a Home; no se agregó un link de texto "Inicio".
- [ ] Enviar el formulario con nombre, correo y mensaje válidos, y `RESEND_API_KEY`/`CONTACT_TO_EMAIL` configurados, envía un correo real que llega a `CONTACT_TO_EMAIL`.
- [ ] Mientras se espera la respuesta del servidor, el botón de envío muestra "ENVIANDO…" y está deshabilitado.
- [ ] Si el envío falla (ej. `RESEND_API_KEY` inválida o ausente), se muestra un mensaje de error inline y los campos conservan lo escrito.
- [ ] Si el campo honeypot llega lleno, no se llama a Resend, pero la pantalla muestra el mismo estado de éxito que un envío real.
- [ ] Enviar el formulario con `name`, `email` o `message` vacíos no llama a la API y muestra la animación `shake` ya existente en el template.
- [ ] Las secciones del About con clase `.reveal` se animan (clase `.in`) al hacer scroll hasta ellas.
- [ ] No hay errores ni warnings en la consola del navegador al usar `/acerca-de`.
- [ ] `npm run build` compila sin errores de tipos ni de lint.

## Decisiones tomadas y descartadas

- **Sí:** ruta `/acerca-de`, siguiendo la convención en español ya usada por `/biblioteca` y `/salon`. **No:** `/about` o `/nosotros`.
- **Sí:** agregar el link "Acerca de" al Nav (escritorio y móvil), reabriendo parcialmente la decisión de SPEC 02, porque sin él la página no sería descubrible. **No:** dejarla accesible solo por URL directa.
- **No:** agregar también el link "Inicio" al Nav. Se mantiene la decisión de SPEC 02 de usar el logo como única vía a Home; tocar el Nav para About no obliga a reabrir esa otra decisión.
- **Sí:** dominio de pruebas de Resend (`onboarding@resend.dev`) como remitente por defecto, sin configurar DNS. Limitación conocida: en modo sandbox, Resend solo entrega al correo con el que se creó la cuenta, sin importar qué `CONTACT_TO_EMAIL` se configure; para producción real se necesitará verificar un dominio propio (fuera de este spec).
- **Sí:** variables de entorno `RESEND_API_KEY` y `CONTACT_TO_EMAIL` en `.env.local`, documentadas en un nuevo `.env.example`. **No:** hardcodear ningún valor real en el código.
- **Sí:** lógica de envío aislada en `lib/email.ts`, separada del Route Handler, siguiendo el mismo patrón de módulo de datos que ya usa el proyecto (`lib/data.ts`).
- **Sí:** honeypot simple como única protección anti-spam del MVP. **No:** rate limiting por IP, CAPTCHA u otras protecciones más sofisticadas — se dejan para un spec futuro si el spam se vuelve un problema real.
- **No:** persistir los mensajes de contacto en base de datos o archivo. Si Resend confirma el envío, se considera exitoso; consistente con la premisa "sin backend real" de los specs anteriores, salvo por esta integración puntual de correo.
- **Sí:** estado de error inline en el propio formulario cuando falla el envío, conservando lo escrito por el usuario, en vez de redirigir o mostrar una página de error aparte.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El modo sandbox de Resend solo entrega correos a la dirección con la que se creó la cuenta. | Documentado en este spec y en `.env.example`; para recibir en cualquier bandeja real se requiere verificar un dominio propio en Resend, fuera de este spec. |
| `RESEND_API_KEY` faltante o inválida en el entorno donde corre la app. | El Route Handler captura el error de Resend y responde `500`; el formulario muestra el estado de error inline en vez de romperse o quedarse colgado. |
| El honeypot es una protección básica; bots sofisticados pueden evadirlo. | Aceptado como límite conocido del MVP; rate limiting o CAPTCHA quedan para un spec futuro si el volumen de spam lo justifica. |

## What is **not** in this spec

- Verificación de un dominio propio en Resend (se usa `onboarding@resend.dev`).
- Persistencia de los mensajes de contacto en cualquier medio.
- Rate limiting, CAPTCHA o protecciones anti-spam más allá de un honeypot simple.
- El link de texto "Inicio" en el Nav (se mantiene la decisión de SPEC 02).
- Cambios a Biblioteca, Detalle de juego, Reproductor, Auth, Salón de la Fama o Home.

Cada uno de estos, si se necesita, va en su propio spec.
