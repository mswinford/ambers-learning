# Roadmap

Ordered by **value per hour**, not by ambition. The sequencing rule is: make the
existing app trustworthy, then make the toolchain safe, then make it better for a
child, then make it remember anything.

Effort is realistic wall-clock time for one person. Risk is the chance the change
breaks something else.

---

## Phase 0 — Stabilize the baseline
**Estimate: 2–3 hours · Risk: low · Do this before any new feature.**

**Status: complete — 0.1 through 0.8 are done on branch `phase0-stabilization`.**
Item 0.8 (the SSR/client hydration mismatch, defect 7) came out of the work itself.

These are bugs, not features. Each one is a small, isolated change that makes the
app behave as it already claims to.

| ID | Item | Effort | Risk | Why now |
|---|---|---|---|---|
| 0.1 | Confirm or refute the suspected render loop in the options picker (`page.tsx:82` / `BasicAlgebraOptions.tsx:32`), then make `onOptionsChange` stable (lift the callback, or move options into the shared reducer) | 30–45 min | Medium | If real, the app is burning CPU continuously and every later change will be harder to reason about |
| 0.2 | Validate the Maximum Number input: show the effective default (100) in the field, parse and clamp to 1–1000, ignore invalid values | 30 min | Low | Currently clearing the field produces `NaN + x = NaN` problems |
| 0.3 | Handle "no operations selected": disable the picker's Apply/New Problem or fall back to addition | 15 min | Low | Today it renders "Something went wrong" and the answer is 0 |
| 0.4 | One source of truth for default options (remove the duplicated `OPTIONS` / `DEFAULT_OPTIONS` pair) | 20 min | Low | Two defaults disagree; the page constant is dead code |
| 0.5 | Fix the Tailwind `dark:` variants in the options panel so labels are readable regardless of OS theme | 10 min | Low | Labels are invisible on a light-mode system |
| 0.6 | Real feedback: "Correct" / "Try again" text, Enter submits, `aria-live` region | 30 min | Low | Colour-only feedback is a poor fit for a child and for accessibility |
| 0.7 | Housekeeping: remove `const t = 0`, set the page title/description, drop the stale `./pages/**` glob from `tailwind.config.js` | 10 min | Trivial | Costs nothing, removes noise |

**Definition of done:** the app generates a valid problem for every combination of
options, gives the child a non-colour signal of success, and has one documented
behaviour contract in `docs/CURRENT_STATE.md` §5.

---

## Phase 1 — Toolchain and safety net
**Estimate: 4–6 hours · Risk: medium · Depends on Phase 0.**

| ID | Item | Effort | Risk | Notes |
|---|---|---|---|---|
| 1.1 | Upgrade Next 13.4 → current major, Tailwind 3.3 → 4.x, remove unused `@types/*` pins | 3–4 h | Medium–High | Do on a branch. App Router metadata and `next/font` APIs are unchanged; the main breakages are Tailwind v4 config and package.json `devDependencies` layout |
| 1.2 | Move the Docker image to a maintained Node LTS and split dev vs. dependency installs | 30 min | Low | `node:18.13.0` is EOL |
| 1.3 | Add Vitest and property tests for the generator | 1–2 h | Low | The highest value-per-minute item in this whole document. Assert invariants over thousands of generated problems: every result is an integer, division is exact, operands and answers respect the configured bounds, every enabled operation is reachable |
| 1.4 | CI: lint + build + generator tests on every push | 1 h | Low | Turns 1.3 into a guarantee |
| 1.5 | Adopt OpenSpec: `openspec init`, transcribe `CURRENT_STATE.md` §5 into a baseline spec, then run the 0.2 fix as the first change through propose → apply → archive | 1–2 h | Low | Validates the workflow on something small before trusting it with a feature |

**Definition of done:** `npm run build` on a current toolchain, a test suite that
catches a regression in the generator, and one completed OpenSpec change in the
archive.

---

## Phase 2 — Pedagogical correctness
**Estimate: 5–7 hours · Risk: medium · Depends on 1.3 (tests).**

This is where the app stops being a random-number generator and becomes a teaching
tool.

| ID | Item | Effort | Risk | Notes |
|---|---|---|---|---|
| 2.1 | Bound the **answer**, not just the operands | 1 h | Low | Currently `numberMaximum` means nothing for multiplication and division |
| 2.2 | Difficulty levels (easy / medium / hard) that control operation set, blank position weighting, and number range | 3 h | Medium | Solving for a subtrahend or divisor is genuinely harder; weight it, don't leave it uniform |
| 2.3 | Suppress degenerate problems (`x + 0 = 5`, `7 - 0 = x`) | 20 min | Low | Trivial, but a child notices |
| 2.4 | Re-present missed problems until mastered | 2–3 h | Medium | The single highest-impact learning feature. Needs 3.1 (persistence) to work across sessions; a session-only version is fine to start |

**Definition of done:** two problems with the same settings are not equally hard by
accident, and a wrong answer comes back later.

---

## Phase 3 — Persistence
**Estimate: 3–5 hours · Risk: medium · Deferred until Phase 2 is done.**

| ID | Item | Effort | Risk | Recommendation |
|---|---|---|---|---|
| 3.1 | `localStorage`: session stats (streak, accuracy, last 20 problems) | 3 h | Low–Medium | **Do this.** No infra, no privacy surface, immediate value |
| 3.2 | Per-child profiles | 2 h | Medium | Only if there is more than one child. Otherwise skip |
| 3.3 | Server + database, accounts, cross-device sync | 8 h+ | High | **Explicitly not recommended** unless 3.1 stops being enough. It contradicts ADR-2 and adds operational burden that a home app rarely justifies |

---

## Phase 4 — Accessibility and polish
**Estimate: 2 hours · Risk: low · Can be interleaved with Phase 0/2.**

- Proper `label for`/`id` pairing (currently labels are unassociated)
- `aria-live` announcements for correct/incorrect
- Keyboard navigation and focus-visible states
- Larger touch targets and mobile layout (the current `p-24 text-4xl` layout is desktop-first)
- `prefers-reduced-motion` handling

---

## Phase 5 — New problem types
**Estimate: 3–5 hours each · Risk: medium · Only after 1.3.**

Candidate additions, in the order they'd help a child:

1. Two-step equations (`3x + 2 = 17`)
2. Fractions with a common denominator
3. Negative results
4. Comparison / inequality
5. Timed drills with a stopwatch

Each of these is a new file in `app/problem-builders/` plus one flag in the options
type — the architecture already supports it (ADR-3).

---

## Explicitly not doing

- Authentication or multi-user accounts
- A database or backend service
- A rewrite of the UI in another framework
- Analytics of any kind

---

## Where we are against the original goal

The app works, but it is a **toy that is one validation bug away from producing
nonsense problems**, and it has no memory of what the child has already practised.
Phase 0 fixes the reliability. Phase 1.3 makes further changes safe. Everything after
that is genuinely new capability.

**Where we are:** Phase 0 is complete. The next three moves are **1.3** (generator
tests — the safety net everything else depends on), **1.1** (toolchain upgrade), and
**1.5** (OpenSpec adoption, run against the first real feature in Phase 2).
