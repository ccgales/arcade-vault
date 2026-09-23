---
name: spec-impl-game
description: Implementa un spec de juego aprobado siguiendo /spec-impl al pie de la letra, y al terminar encadena skin-designer y luego mobile-porter detalle, uno después del otro.
disable-model-invocation: true
argument-hint: <NN-spec-name | game-jam/<game-id>/NN-spec-name>
allowed-tools: Read, Glob, Grep, Edit, Write, AskUserQuestion, Task, Agent, Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(git log:*), Bash(git diff:*), Bash(git stash:*), Bash(cat:*), Bash(ls:*), Bash(date:*), Bash(npm run build:*), Bash(npm run dev:*)
---

# /spec-impl-game — Implementer of approved GAME specs, then chains skin-designer → mobile-porter

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Game-jam specs (outside the flat specs/ folder):
!`ls specs/game-jam/*/ 2>/dev/null || echo "No specs/game-jam/ entries"`

Branch-creation config:
!`cat specs/.spec-config.yml 2>/dev/null || echo "AutoCreateBranch: true (default, no config file)"`

Today's date (use this for anything time-stamped, never guess it):
!`date +%F`

Current REAL_GAMES registry (for deriving the game id after implementation):
!`grep -n "REAL_GAMES" -A 20 components/GamePlayer.tsx 2>/dev/null`

Skin-designer tracking matrix:
!`sed -n '/## Matriz/,/^$/p' references/games-with-themes.md 2>/dev/null`

Mobile-porter tracking matrix:
!`cat references/mobile-porting.md 2>/dev/null || echo "references/mobile-porting.md does not exist yet"`

---

## What this command is

A sibling of `/spec-impl`, specialized for **game specs only**. It does the exact same implementation, step by step with review pauses, by deferring to `.claude/skills/spec-impl/SKILL.md` for that behavior — it does not reimplement or restate those rules. What it adds:

1. It also resolves specs living under `specs/game-jam/<game-id>/` (which the `game-jam` agent writes), not just flat `specs/NN-slug.md`.
2. It refuses to run on a spec that isn't a game spec.
3. When the implementation is fully done and the build gate passes, it automatically chains **`skin-designer` → `mobile-porter detalle`**, strictly one after the other — never in parallel, never the second one before the first has reported back.

If any of this conflicts with `.claude/skills/spec-impl/SKILL.md`, that file wins — it is the source of truth for the implementation phases themselves.

---

## Phase 0 — Defer to /spec-impl for Phases 1-4, with three deltas

Read `.claude/skills/spec-impl/SKILL.md` in full and execute its **Phase 1 through Phase 4 exactly as written** (spec identification, Approved-state validation, branch creation, step-by-step implementation with pauses), with these three deltas layered on top:

### Delta 1 — Phase 1 also resolves game-jam specs

In addition to `specs/NN-slug.md`, resolve `specs/game-jam/<game-id>/NN-slug.md` (e.g. `specs/game-jam/flogger/03-frogger-core.md`). Accept any of:

- `flogger/03` or `flogger/03-frogger-core` → `specs/game-jam/flogger/03-frogger-core.md`
- `game-jam/flogger/03-frogger-core` → same, fully qualified
- `03-frogger-core` alone, if it's unambiguous across both locations

If the argument matches candidates in more than one place, list them and stop — don't guess.

Branch naming:

- Flat specs → `spec-NN-slug` (same as `/spec-impl`)
- Game-jam specs → `spec-<game-id>-NN-slug` (e.g. `spec-flogger-03-frogger-core`)

### Delta 2 — Phase 2 adds a "is this a game spec" guard

After validating the state means Approved (per `/spec-impl` Phase 2 rules), confirm the spec is actually a game spec: it must reference a catalog `id` and/or `components/games/<Name>.tsx` / `REAL_GAMES`. If it doesn't:

```
❌ Este spec no es de juego.

Usa /spec-impl <nombre> en su lugar — /spec-impl-game solo implementa specs
que porten o construyan un componente en components/games/ y lo registren
en REAL_GAMES.
```

Stop. Do not implement anything, do not create a branch.

### Delta 3 — Phase 4 does not close the session

`/spec-impl`'s Phase 4 ends by reminding the user to verify acceptance criteria and stop there. Here, that becomes **this command's Phase 5** below — don't print `/spec-impl`'s closing message as a final message; continue into Phase 5.

---

## Phase 5 — Gate (decides whether the chain runs at all)

Once every step of the plan is implemented and confirmed by the user:

1. Verify the spec's acceptance criteria one by one, showing each.
2. Run `npm run build` — the repo's only automated gate (no test runner configured).
3. Derive the `game-id` deterministically, never from memory: run `git diff main...HEAD -- components/GamePlayer.tsx` and read off the **new key added to `REAL_GAMES`**. Cross-check that id exists in the current registry (session context above, refreshed if needed).
   - If it can't be derived, or more than one new key shows up, ask the user directly with `AskUserQuestion` — this top-level command can ask; the subagents in the chain cannot.
4. **Decide:**
   - Build fails → stop. Show the build error. Don't launch anything.
   - User abandoned a step earlier (declined to continue) → this phase never runs; nothing to gate.
   - No derivable game id → stop after asking (per step 3); don't launch anything until resolved.
   - All clear → continue to Phase 6.

When gated off, report why in Spanish and hand back the two manual commands the user can run themselves once ready:

```
⚠️ No lancé la cadena de agentes.

Motivo: [build falló / no pude derivar el game-id / …]

Cuando esté listo, puedes correr manualmente:
  @skin-designer <game-id>
  @mobile-porter detalle
```

---

## Phase 6 — Launch `skin-designer <game-id>`

**Hard rule: one `Agent` call per message. Never both agents in the same tool-call block.**

Launch the `skin-designer` subagent (`subagent_type: "skin-designer"`) with a single game id — never more than one, or it falls back to audit-only mode and implements nothing. Give it in the prompt:

- The derived `game-id` (exactly one).
- The path to this run's game spec.
- That `specs/10-skins.md` already exists, in state `En revisión`.
- That shared skin infrastructure (`lib/skins.ts` types, the `skin` prop on `RealGameProps`, `components/SkinPicker.tsx`) **already exists** (built during the `asteroides` run per `references/games-with-themes.md`) — this run only adds its own `Record<SkinId, …>`, its id to `GAMES_WITH_SKINS`, and its component's wiring.

Wait for it to finish. When it reports back, relay its findings to the user in Spanish (the three palettes, the contrast table, files written, updated matrix) — the user doesn't see the subagent's own output directly.

## Phase 7 — Launch `mobile-porter detalle`

Only after Phase 6 has fully returned. Launch the `mobile-porter` subagent (`subagent_type: "mobile-porter"`) with:

- The zone: `detalle` (fixed — the game-detail page is what showcases the new game). Never pass more than this one zone.
- The new game's id, as the concrete case to measure at `/juegos/<game-id>`.
- That `references/mobile-porting.md` may not exist yet, and if not, to create it using the template at the bottom of `.claude/agents/mobile-porter.md`.
- A reminder that the player screen and `.av-player`/`.crt*`/`.player-hud`/`.modal*` selectors are `/spec-impl 11` territory and must never be touched.

It needs a real Chrome and `localhost:3000`: if `mcp__claude-in-chrome__*` tools aren't loaded it will invoke `/claude-in-chrome` itself, and if the dev server isn't responding it will start `npm run dev` in the background (already in its own Phase 3) — no need to pre-launch either for it.

Wait for it to finish before reporting the final summary.

---

## Closing report

In Spanish, once both agents have returned (or the chain was gated off per Phase 5):

1. Which plan steps were implemented, and the acceptance-criteria check.
2. Build result.
3. A short summary of each agent's run (skin-designer's palettes/contrast table, mobile-porter's before/after overflow and touch-target numbers).
4. Exact paths written by all three (this command's own edits + each subagent's).
5. Suggested next commands for anything still pending (`@skin-designer <pendiente>`, `@mobile-porter <zona pendiente>`).

**Never commit automatically** — not per step, not at the end, not after the chain. That decision and command belong to the user, exactly as in `/spec-impl`.

---

## Scope boundaries (explicit)

This command does **not**:

- Write specs (`/spec`'s job), decide which game comes next (`game-planner`'s job), or invent a game from a theme (`game-jam`'s job).
- Implement the player screen's touch controls (`/spec-impl 11`'s job).
- Run `/add-game`. If the spec calls for a brand-new catalog entry (a `games` row, a `.cover-<slug>` class, a `00N_add_<slug>.sql` migration), that's already inside the spec's own implementation plan and gets carried out as one of its numbered steps — SQL migrations stay append-only per `CLAUDE.md`.
- Hand-format code. The `PostToolUse` hook already runs Prettier/ESLint on every file this command touches.

## Known gotcha to flag, not fix

`specs/` currently has a numbering collision: `12-apariencia-gamepad-tactil.md` occupies slot 12, while `mobile-porter.md` declares its own spec as `specs/12-porte-movil-del-sitio.md`. When Phase 7 runs, that agent will create a second spec 12. Flag this to the user when it comes up — renumbering specs is out of scope for this command.
