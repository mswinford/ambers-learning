# Design decisions

Architecture Decision Records for ambers-learning. Each records a choice that is
visible in the code, why it was made, what it cost, and when it should be
re-examined. These are reconstructed from the code and commit history; the original
reasoning was never written down.

Format: **Status · Context · Decision · Consequences · Revisit when**

---

## ADR-1 — Dark-only theme, no light mode

**Status:** Accepted (2023-05-05, commit `439fb73`)

**Context:** The create-next-app template ships with a `@media (prefers-color-scheme: dark)`
block that makes the page light by default and dark only when the OS asks for it.
The app was intended for one child who preferred the dark look.

**Decision:** Delete the media query and hard-code the dark foreground/background
variables in `app/globals.css`. The app is always dark.

**Consequences:**
- Positive: no theme toggle, no flash of the wrong theme, one background.
- Negative: the decision was only half applied. `BasicAlgebraOptions.tsx` still uses
  Tailwind `dark:` variants (`text-gray-900 dark:text-gray-300`, `bg-gray-100 dark:bg-gray-700`),
  and `tailwind.config.js` has no `darkMode` key, so those still resolve against the
  OS preference. On a light-mode machine the option labels are dark grey on black.

**Revisit when:** any new UI component is added that uses `dark:` utilities. The
cheap fix is either `darkMode: 'class'` in the Tailwind config or removing the
`dark:` variants outright.

---

## ADR-2 — Everything runs client-side; no server state, no database

**Status:** Accepted (implicit, never revisited)

**Context:** A 300-line hobby app used by one child on one home server. There was no
reason to introduce storage.

**Decision:** The app is a single statically prerendered page. All state lives in a
`useReducer` inside `app/page.tsx`. There are no API routes, no cookies, no database,
no environment variables.

**Consequences:**
- Positive: essentially zero operational surface. Nothing to migrate, nothing to
  back up, nothing to secure. The page works offline once loaded.
- Negative: no progress, no history, no streaks, no per-child profiles. Closing the
  browser discards everything. Any future learning analytics must be built from
  scratch.

**Revisit when:** progress tracking becomes a requirement. The recommended first
step is `localStorage`, not a server. A database should only be adopted if there is
more than one child or cross-device continuity is genuinely needed.

---

## ADR-3 — Problem generation is a pure module, separate from the UI

**Status:** Accepted (the strongest design decision in the repo)

**Context:** Problem generation and rendering are different concerns, and a 2023
create-next-app project defaults to putting everything in `page.tsx`.

**Decision:** `app/problem-builders/basic-algebra.ts` exports
`createProblem(options) -> { display, solution }` with no React, DOM, or network
dependency. The UI never computes math; the generator never renders.

**Consequences:**
- Positive: new problem types are additive — write a new builder module, add its
  flag to `BasicAlgebraOptions`, wire it into the switch. Nothing in the UI has to
  change.
- Positive: it is trivially unit-testable.
- Negative: no tests were ever written for it, so the bounds bugs documented in
  `CURRENT_STATE.md` §5 went unnoticed for two and a half years.

**Revisit when:** never — this seam should be preserved. It is the reason features
can be added without a rewrite.

---

## ADR-4 — Random operation, random blank position

**Status:** Accepted

**Context:** The pedagogical goal is that a child learns to rearrange an equation,
not just compute `a op b`.

**Decision:** Each problem picks one enabled operation at random, then hides one of
the three terms as `x`, chosen uniformly (`ceil(Math.random() * 3)`).

**Consequences:**
- Positive: `x - 5 = 8`, `9 - x = 4` and `9 - 5 = x` all appear, which is genuinely
  better learning than always solving for the result.
- Negative: difficulty is completely uncontrolled. Solving for the subtrahend
  (`a - x = c`) or the divisor (`a / x = c`) is meaningfully harder than the other
  positions, and the code treats all three as equally likely.
- Negative: the same uniformity lets multiplication and division produce values
  far above `numberMaximum` (see §5 of `CURRENT_STATE.md`).

**Revisit when:** difficulty levels are introduced. The natural mechanism is weighting
blank positions per level rather than changing the number range.

---

## ADR-5 — Self-hosted Docker + Traefik, not Vercel

**Status:** Accepted

**Context:** The template README suggests Vercel. The actual deployment is a home
server already running Traefik.

**Decision:** `Dockerfile` pins `node:18.13.0`, runs `npm ci --omit=dev`, builds, and
starts Next on port 3000. `docker-compose.yml` attaches to an external `reverse-proxy`
network and registers Traefik routes for `ambers-learning.swinford.house` with an
HTTP→HTTPS redirect and ACME.

**Consequences:**
- Positive: the child's usage data never leaves the house; no third-party account;
  free.
- Negative: the deploy is manual (no CI), the base image is EOL, and the compose file
  depends on an external network and a middleware (`https-redirect@file`) that are
  defined elsewhere — the repo alone is not enough to reproduce the deployment.
- Negative: a `/home/ubuntu/docker-data/ambers-learning/config` volume is mounted but
  nothing in the application reads or writes it.

**Revisit when:** the toolchain upgrade happens (Phase 1 of the roadmap). The Docker
base image should move to a maintained Node LTS.

---

## ADR-6 — Options apply to the next problem, not the current one

**Status:** Accepted by accident, not by design

**Context:** Changing the operation checkboxes has to do something.

**Decision:** `SET_OPTIONS` replaces the options but does not regenerate the problem.
A new problem is only produced when the user presses "New Problem".

**Consequences:**
- Positive: the child is not interrupted mid-problem when a parent adjusts settings.
- Negative: the UI can state a maximum of 5 while the visible problem came from a
  maximum of 100. This is the only place where the app's displayed state and its
  behaviour can disagree.
- Negative: it is also the mechanism behind the suspected render loop
  (`CURRENT_STATE.md` defect 2).

**Revisit when:** the input-validation fix lands. Decide deliberately whether option
changes should regenerate the problem immediately.

---

## ADR-7 — No automated tests or CI

**Status:** Accepted (by omission)

**Context:** A weekend project for one user.

**Decision:** None. There is no test runner, no CI workflow, and linting is only
`next lint` via a script.

**Consequences:** the generator has had latent correctness bugs for years, and any
AI-assisted change to it has no way to prove it did not break the bounds.

**Revisit when:** before any feature work — this is the cheapest high-value item on
the roadmap.
