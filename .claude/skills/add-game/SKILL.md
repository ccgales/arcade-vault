---
name: add-game
description: Writes a spec (following the project's /spec conventions) and then ports or builds a real playable game (canvas + React), wires it into GamePlayer's HUD/pause/game-over flow, and integrates it with the real Supabase leaderboard (games/scores tables). Codifies the pattern from SPEC 05 (Asteroides) and SPEC 06 (leaderboard real). Use when adding a new game to the catalog or replacing a simulated one with a real, playable version.
disable-model-invocation: true
argument-hint: <game-id-or-title> [references/started-games/NN-name]
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), Bash(date:*), Bash(git status:*), Bash(git diff:*), Bash(npm run dev:*), Bash(npm run build:*), mcp__supabase__authenticate, mcp__supabase__complete_authentication
---

# /add-game — Spec, then port or build a real game with a real leaderboard

## Session context

Today's date (use this for the spec header, never guess it):
!`date +%F`

Specs that already exist (for numbering and conventions):
!`ls specs/ 2>/dev/null`

Current catalog rows already seeded (id / title / cat / cover / color) — from the last committed seed:
!`cat supabase/sql/002_seed.sql 2>/dev/null | grep "insert into games" -A 10 | head -12`

Real games already ported (each is its own file in `components/games/`):
!`ls components/games 2>/dev/null`

SQL migrations already committed (never edit these in place once applied — add a new numbered file instead):
!`ls supabase/sql 2>/dev/null`

Unported reference sources available (may or may not be used — a game can also be built from scratch):
!`ls references/started-games 2>/dev/null | grep -v MACOSX`

---

## What this skill encodes

SPEC 05 (`specs/05-asteroides.md`) ported one game (`references/started-games/02-asteroids/game.js`) into `components/games/Asteroids.tsx` under a strict props/ref contract, and wired it into `components/GamePlayer.tsx` behind a single `game.id === "asteroides"` check. SPEC 06 (`specs/06-leaderboard-y-tabla-juegos.md`) made `games`/`scores` real Supabase tables that `lib/games.ts` / `lib/scores.ts` / `lib/scores.server.ts` already read and write generically, by `game.id` — **no per-game code is needed on the leaderboard side**, only a matching row in the `games` table.

This skill repeats that recipe for a new game — first writing a spec for it the same way `/spec` would, then implementing it — and generalizes GamePlayer's single hardcoded branch into a small registry the first time a second real game is added.

**Important:** the reference folder for a game (e.g. `references/started-games/03-tetris/`) may itself contain a stray `specs/` or `skills-lock.json` (leftover scaffolding from the source kit, e.g. `04-arkanoid` has both). Ignore those — they belong to the reference project, not to Arcade Vault. Only its `game.js`, `index.html`, `levels.js`/`style.css`, `assets/`, and `CLAUDE.md`/`README.md` matter here.

Reply to the user in the same language they used to invoke this skill (this repo's specs are in Spanish).

## Phase 0 — Pick the target and the source

Ask (via `AskUserQuestion` if not already clear from `$ARGUMENTS`):

1. **Which catalog slot does this game fill?**
   - **Replace an existing simulated entry** — reuses its `id`/`title`/`cover`/`color`/`cat` and its already-seeded scores, so no SQL is needed. Look at the seeded catalog above for a thematic match before assuming a new row is required, e.g. `caida` (CAÍDA / PUZZLE / `cover-tetro`) is a Tetris-shaped slot, `bloque-buster` (ARCADE / `cover-bricks`) is an Arkanoid-shaped slot. This is the same move SPEC 05 made for `rocas` → `asteroides`.
   - **Add a brand-new entry** — needs a new `id` (url-safe slug), a `.cover-<slug>` CSS class, and a new SQL migration (Phase 5).
2. **Where does the gameplay come from?**
   - A folder under `references/started-games/` (list above) — read its `game.js` fully before writing anything.
   - Built from a description the user gives you — skip Phase 1's file reading, gather the mechanics/controls/win-loss conditions from the user instead, but still target the exact same contract in Phase 3.

Do not proceed until both are decided — you need them to write the spec in Phase 2.

## Phase 1 — Understand the source game (if porting one)

Read the reference folder's `game.js` (and `index.html`/`levels.js`/`style.css` if present) in full. Identify:

- Canvas native resolution (the ported component keeps it internally and scales via CSS, same as `Asteroids.tsx`'s 800×600 → 100%/100%).
- Controls (keys) and whatever the original does on window/document — everything gets re-attached as `window` listeners inside a `useEffect`, never `document.getElementById`.
- Any HUD the canvas draws itself (score, lives, level, "game over" screen, restart-on-keypress) — all of this gets **removed**; `GamePlayer.tsx`'s existing HUD and end-of-game modal replace it entirely, exactly as SPEC 05 did for Asteroids (it kept only the transient in-canvas "3x" power-up indicator, because that's part of the play-field, not a persistent stat).
- What "score", "lives", and "level" map to in this game. Not every game has all three naturally (e.g. a falling-block game has no "lives", a duel/pong game has no "level"). Map what exists; for what doesn't, pick a sane constant (e.g. `lives: 1` for a game with no lives concept) and confirm the mapping with the user before finalizing — the shared `State` shape is fixed because `GamePlayer.tsx`'s HUD always renders Puntuación/Vidas/Nivel for every real game.

This is exactly the technical detail the spec's Data model and Implementation plan sections need in Phase 2 — don't skip it even when the user is in a hurry to see code.

## Phase 2 — Write the spec, following `/spec`'s own conventions

**Before creating the spec file, read `.claude/skills/spec/SKILL.md` and `.claude/skills/spec/template.md` in full.** They are this repo's authority on spec structure, section order, header format, and valid `**Status:**` values — do not improvise a different shape. Also read the two most recent specs already in `specs/` (currently `05-asteroides.md` and `06-leaderboard-y-tabla-juegos.md`, unless the listing above shows newer ones) to match their language (Spanish), heading wording, and level of detail.

Then write `specs/NN-<slug>.md` yourself, in this skill's own flow (don't shell out to `/spec` — you already have everything Phase 0/1 gathered; there is no need to re-run its question phase from scratch), using `template.md`'s section order:

1. **Header** — next sequential number from the `specs/` listing above (zero-padded, e.g. `07-`), a kebab-case slug from the game's name, `**Estado:** Borrador`, `**Depende de:**` SPEC 05 and SPEC 06 (this recipe always builds on both), today's date from the session context, and a one-sentence objective (port `<game>` into a real, playable game with a real Supabase leaderboard).
2. **Alcance** — **Dentro:** the concrete outputs of Phases 3–6 (component file, GamePlayer wiring/registry refactor if needed, cover class + SQL migration if it's a new catalog entry). **Fuera de alcance:** whatever this recipe deliberately never does — audio, touch/mobile controls, anti-cheat, other catalog games changing behavior — same exclusions SPEC 05 and SPEC 06 already recorded, repeated here because they still apply.
3. **Modelo de datos** — the `<Name>State`/`<Name>Props`/`<Name>Handle` contract from Phase 3 below (reuse the exact shape, filled in with this game's name), and, if Phase 0 decided on a brand-new catalog entry, the concrete `insert into games (...)` row it will need.
4. **Plan de implementación** — numbered steps mirroring Phases 3–6 below (port the component, wire the registry, catalog/SQL if applicable, manual verification), each step left in a runnable state, matching the granularity of SPEC 05's plan.
5. **Criterios de aceptación** — boolean checklist adapted from SPEC 05's and SPEC 06's acceptance criteria to this specific game (controls, wrap/collision behavior specific to this game, HUD reflects real state, pause/resume/game-over/save-score all work, other games unaffected, `npm run build` clean).
6. **Decisiones tomadas y descartadas** — at minimum, record the Phase 0 answers (which catalog slot, ported vs. built from scratch) as decisions with their reasoning, the same way SPEC 05 recorded the `rocas`→`asteroides` rename decision.
7. **Riesgos identificados** — only if this game has a genuinely non-obvious risk beyond what SPEC 05/06 already documented (most ports won't need this section — SPEC 05's risks around `requestAnimationFrame` cleanup and pause `dt` spikes are already covered by Phase 3's rules below, not per-game risks).
8. **What is not in this spec** — repeat the exclusions from Alcance.

After writing the file:

- If `specs/.spec-config.yml` does not exist yet, create it with the same default content `/spec`'s Phase 4 step 7 specifies (`AutoCreateBranch: true`) — never overwrite it if it already exists.
- Show the user the path you wrote and tell them the spec is in `Borrador` state. **Ask them to confirm or request changes before you touch any code.** Only once they approve (or explicitly tell you to skip review and proceed) do you move to Phase 3, at which point update the spec's `**Estado:**` to `Aprobado`, and to `Implementado` once Phase 6's verification passes — same lifecycle SPEC 05/06 went through.

## Phase 3 — Port/build `components/games/<GameName>.tsx`

Follow the exact contract already established by `components/games/Asteroids.tsx` — read it first if you haven't in this session:

```ts
export interface <Name>State {
  score: number;
  lives: number;
  level: number;
}

export interface <Name>Props {
  paused: boolean;
  onStateChange: (state: <Name>State) => void;
  onGameOver: (finalScore: number) => void;
}

export interface <Name>Handle {
  endGame: () => void;
}

export default forwardRef<<Name>Handle, <Name>Props>(<Name>);
```

Rules, all taken from how `Asteroids.tsx` is built:

- `"use client"`. A single `<canvas>` referenced with `useRef` (never `document.getElementById`), fixed internal `width`/`height` at the source game's native resolution, styled `position: absolute; inset: 0; width: 100%; height: 100%` so it fills `.crt-screen` (4:3) regardless of native aspect ratio.
- One mounting `useEffect` (deps `[]`) that: attaches `keydown`/`keyup` listeners on `window`, calls `e.preventDefault()` on every control key so the page doesn't scroll, runs the game loop via `requestAnimationFrame`, and in its cleanup function cancels the animation frame and removes the listeners.
- `paused` is read through a `useRef` kept in sync via its own `useEffect` (not read directly from the prop inside the loop closure) — when true, the loop stops calling `update()` but keeps rendering the last frame; when it flips back to false, reset the loop's `lastTime` so the next `dt` isn't an inflated jump across the pause.
- `onStateChange`/`onGameOver` are also mirrored into refs the same way, and only invoked when the reported value actually changed (see `lastReportedScore/Lives/Level` in `Asteroids.tsx`) to avoid redundant parent re-renders.
- `useImperativeHandle` exposes `endGame()`, implemented as a flag the loop checks (`forceEndRef`), not an immediate synchronous state change from outside the loop.
- Score/lives/level math, physics, spawn logic, etc. should carry over faithfully from the source `game.js` — this is a straight TypeScript port, not a redesign. Don't "improve" balance or add features the reference doesn't have.

## Phase 4 — Wire into `components/GamePlayer.tsx`

Read the current file first. As of one real game (`Asteroids`), it hardcodes `const isAsteroids = game.id === "asteroides"` and branches in three places (which component renders inside `.crt-screen`, whether the HUD comes from `onStateChange` vs. the simulated `setInterval`, and what `endGame`/`restart` do). Adding a **second** real game means this no longer scales as a single boolean — generalize it into a small registry before wiring in the new game:

- A `Record<string, RealGameComponent>` (or equivalent) keyed by `game.id`, mapping to the game's component + its imperative handle type, sharing the common `{score, lives, level}` state contract from Phase 3.
- Replace `isAsteroids` with a lookup (`const RealGame = REAL_GAMES[game.id]`) and keep every existing behavior for `Asteroids` byte-for-byte identical — this is a refactor, not a behavior change, for the games that already work.
- Simulated games (`game.id` not in the registry) must keep their exact current `setInterval` HUD/behavior, unchanged.
- `endGame()`/"JUGAR DE NUEVO" (`resetKey` remount pattern) apply uniformly to whichever component is in the registry — don't special-case the new game separately from how `Asteroids` is already handled.

Do this refactor once, the first time a second real game is added; after that, adding a third/fourth game is just one more registry entry.

## Phase 5 — Catalog + leaderboard integration (Supabase)

**No code changes are needed in `lib/games.ts`/`lib/scores.ts`/`lib/scores.server.ts`** — they already read/write generically by `game.id`. What's needed depends on Phase 0's answer:

**a) Replacing an existing simulated entry (same `id`):**
Nothing to run — the row and its seeded scores already exist in `games`/`scores` from `002_seed.sql`. Just double-check the existing `title`/`cat`/`color`/`cover` still make sense for the real game (rename only if the user asks, same as SPEC 05 renamed `rocas`→`asteroides` id/title/cover together, never just the visible title).

**b) Adding a brand-new entry:**

1. Add a `.cover-<slug>` class to `app/globals.css`, following the existing `cover-*` pattern (a CSS-only abstract cover paired with one of the four `color` values — no image assets; look at `.cover-asteroides` and its `::after`/`::before` as the template).
2. Write a **new** SQL file `supabase/sql/00N_add_<slug>.sql` (never edit `001_games_and_scores.sql` or `002_seed.sql` in place — they're already applied against the live project) containing:
   - `insert into games (id, title, short, long, cat, cover, color) values (...)` — `cat` must be one of `lib/data.ts`'s `CATS` minus `"TODOS"` (`ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`); `color` must be one of `cyan`/`magenta`/`yellow`/`green` (DB check constraint).
   - `insert into scores (game_id, player_name, score, created_at) values (...)` with ~12 rows of plausible example scores/dates, matching the style in `002_seed.sql`, so the leaderboard and Salón de la Fama podium aren't empty on first load.
3. This project's established decision (SPEC 06) is to run SQL manually in the Supabase dashboard's SQL Editor — no CLI, no service-role key, no automated migrations. Hand the user the file path and ask them to run it there. `.mcp.json` does have a Supabase MCP server with database access configured for this project; if the user prefers, offer to run the SQL for them via that MCP once they've authorized it with `mcp__supabase__authenticate`, but manual execution stays the default unless they ask otherwise.
4. After it's run, confirm with the user (or query via the authorized MCP) that `select count(*) from games` / `scores` reflect the new row before moving on.

## Phase 6 — Verify

1. `npm run dev`, navigate to `/juegos/<id>/jugar`:
   - Controls work and don't scroll the page.
   - HUD (Puntuación/Vidas/Nivel) reflects the real game state, not the simulated interval.
   - PAUSA freezes the game exactly (nothing moves, no state lost); REANUDAR continues from the same spot.
   - FIN and losing all lives/ending the game both open the end-of-game modal with the correct final score.
   - GUARDAR PUNTUACIÓN inserts a row and, after `router.refresh()`, the new score shows up on `/juegos/<id>` and `/salon` for that game's tab.
   - SALIR leaves no running loop or console errors behind.
2. Spot-check one untouched game (e.g. `caida` if you didn't touch it) still behaves exactly as before — the registry refactor in Phase 4 must be behavior-preserving for every existing entry.
3. `npm run build` — no type or lint errors.
4. Update the spec's checklist (check off the items that pass) and flip its `**Estado:**` to `Implementado`, same as SPEC 05/06.

These verification steps mirror the acceptance criteria already written out in `specs/05-asteroides.md` and `specs/06-leaderboard-y-tabla-juegos.md`; re-read those files' "Acceptance criteria" sections for the exact wording if you want to cross-check the new spec's checklist against precedent.
