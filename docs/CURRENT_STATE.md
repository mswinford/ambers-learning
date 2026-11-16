# Current State of ambers-learning

Snapshot taken: **2026-11-16**
Last commit: `439fb73` — 2023-05-05 ("remove dark mode query as app only supports dark mode")
Total commits: 5 · Total source: ~325 lines across 5 files
Build status: `npm run build` succeeds on Node 26 (Next 13.4 static prerender, `/` = 2.18 kB)

This document is a factual record of **what the code does today**, not what it should do.
It is the baseline any future change should be measured against.

> **Update:** Phase 0 stabilization (items 0.1–0.7) has been applied on the
> `phase0-stabilization` branch. §6 marks each defect as resolved; §10 describes
> the new behaviour. Everything else in this document still describes the original
> state of the code.

---

## 1. What the app is

A single-page arithmetic drill for one child. The user selects which operations to
practice, sets a maximum number, and the app generates a one-step equation with one
term hidden as `x`. The child types the value of `x` and submits; the input border
turns green if correct, red if not.

There is no account, no progress saved, no session, no history. Each problem is
independent. Closing the browser loses everything.

---

## 2. File map

| Path | Role | Lines |
|---|---|---|
| `app/page.tsx` | Entire client app: state machine, input handling, buttons | 94 |
| `app/problem-builders/basic-algebra.ts` | Pure problem generator (no React) | 101 |
| `app/components/BasicAlgebraOptions.tsx` | Operation checkboxes + max-number input | 62 |
| `app/layout.tsx` | Root layout, Inter font, metadata | 21 |
| `app/globals.css` | Tailwind directives + dark gradient background | 19 |
| `Dockerfile` | `node:18.13.0` → `npm ci --omit=dev` → `next build` → `npm start` | 8 |
| `docker-compose.yml` | Traefik routing for `ambers-learning.swinford.house`, external `reverse-proxy` network | 34 |
| `tailwind.config.js` | Default create-next-app config (still scans `./pages/**`, which does not exist) | 20 |
| `.eslintrc.json` | `extends: "next"` only | 3 |

No tests, no CI, no scripts beyond `dev` / `build` / `start` / `lint`.

---

## 3. Data flow

```
BasicAlgebraOptions.tsx  --(onOptionsChange)-->  page.tsx reducer --> createProblem(options)
      local useState                                |
                                                  state.problem.display --> rendered text
                                                  state.problem.solution --> compared to typed value
```

The generator is pure and independent of React. That is the cleanest seam in the
codebase and the natural place to add new problem types.

---

## 4. State machine

`page.tsx` holds one reducer state:

```ts
{
  options: BasicAlgebraOptions,
  problem: { display: string, solution: number },
  answer?: number,
  status: 'PENDING' | 'INVALID' | 'INCORRECT' | 'CORRECT'
}
```

Actions:

| Action | Effect |
|---|---|
| `NEW_PROBLEM` | Generates a new problem from current options, clears `answer`, status -> `PENDING` |
| `SET_OPTIONS` | Replaces options. **Does not regenerate the problem.** Changing options only affects the *next* problem |
| `SET_VALUE` | Sets `answer`, status -> `PENDING` |
| `SET_STATUS` | Sets status (used for `INVALID` on non-numeric input and for the submit result) |

Feedback is exclusively the input border colour:
`CORRECT` -> green, `INCORRECT` -> red, everything else -> white. There is no message
text anywhere. `INVALID` is tracked but never shown — it renders as a white border,
identical to `PENDING`.

---

## 5. How problems are generated (exact behaviour)

`createProblem(options)` merges `defaultOptions` over the supplied options, picks one
enabled operation at random, then picks a blank position (`x` on the left, middle, or
right) with equal probability.

Default: `numberMaximum = 100`, `operations = { add: true }`.

Bounds with `M = numberMaximum`:

| Operation | Operand range | Result | Notes |
|---|---|---|---|
| add | `a in [1, M]`, `b in [0, M - a]` | `c = a + b <= M` | `b` can be **0** (`x + 0 = 5`) |
| subtract | `a in [1, M]`, `b in [0, a - 1]` | `c = a - b` | `b` can be **0** |
| multiply | `a in [1, M]`, `b in [1, M]` | `c = a * b`, up to **M^2** | Result routinely exceeds "maximum" |
| divide | `b in [1, M]`, `c in [1, b]` | `a = c * b`, up to **b^2** | Dividend can be far larger than M (e.g. 100 -> 10,000) |

Guarantees the code actually provides:
- Division always produces an exact integer quotient.
- Subtraction never produces a negative result.
- Every problem has exactly one unknown, always written as `x`.

Guarantees the code does **not** provide:
- A bound on the magnitude of the answer (multiply/divide can blow past `numberMaximum`).
- A non-zero operand.
- ~~Any behaviour when **no** operation is selected~~ — since Phase 0 an empty
  selection falls back to addition in the generator, and the UI disables
  "New Problem" and shows an alert before that can happen.

---

## 6. Defects found in the current code

| # | Severity | Description | Evidence | Status |
|---|---|---|---|---|
| 1 | **High** | The "Maximum Number" input is uncontrolled and unvalidated. Clearing it yields `parseInt('') = NaN`, which is merged into options and propagates into the generator: every problem renders as `NaN + x = NaN`. | `BasicAlgebraOptions.tsx:26-30`, `basic-algebra.ts:83` | **Fixed (0.2)** |
| 2 | **High** | `useEffect(() => onOptionsChange(options), [onOptionsChange, options])` re-runs on every render, because `page.tsx` passes a freshly-created arrow function as `onOptionsChange`. Each run dispatches `SET_OPTIONS`, which produces a new state object and therefore a new render. Confirmed in a headless run: `Home` rendered 5001 times in 2 seconds and React logged `Maximum update depth exceeded`. | `page.tsx:82`, `BasicAlgebraOptions.tsx:32` | **Fixed (0.1, then structurally removed in 0.4)** |
| 3 | **Medium** | Two competing defaults. `page.tsx` defines `OPTIONS = { add, subtract }`; the picker defines its own `DEFAULT_OPTIONS` and overwrites state on mount. The page-level constant is effectively dead. | `page.tsx:6-11`, `BasicAlgebraOptions.tsx:6-11` | **Fixed (0.4)** |
| 4 | **Medium** | Invalid input is indistinguishable from unattempted input. Typing `abc` sets status `INVALID` (white border), and pressing Submit then compares `undefined` against the solution and reports `INCORRECT`. | `page.tsx:58, 68-71` | **Fixed (0.6)** |
| 5 | **Medium** | Changing options does not regenerate the current problem, so the UI can show a max of 5 while the displayed problem came from max 100. | `page.tsx:28-29` | **Open — deliberate (ADR-6)** |
| 6 | **Medium (kid-facing)** | No Enter-to-submit, no success/failure text, no feedback on how close an answer was. | `page.tsx:86-91` | **Fixed (0.6)** |
| 7 | **Medium** | The initial problem is generated at module scope during prerender, so the server-rendered HTML contains a different random problem than the client's state. React logs a hydration mismatch: `Text content did not match. Server: "x - 20 = 46" Client: "x - 1 = 25"` and replaces the server HTML. | `page.tsx:39-43` (observed in dev) | **Fixed (0.8)** |
| 8 | **Low** | Dead code (`const t = 0;`), metadata title still "Create Next App". | `BasicAlgebraOptions.tsx:19`, `layout.tsx:7-8` | **Fixed (0.4, 0.7)** |
| 9 | **Low** | The theme is dark-only in `globals.css`, but the option labels/checkboxes still use Tailwind `dark:` variants, which are evaluated against `prefers-color-scheme` (no `darkMode` setting in `tailwind.config.js`). On a light-mode OS the labels render `text-gray-900` on a black page and are effectively unreadable. Commit `439fb73` removed the media query from CSS but not from the component classes. | `BasicAlgebraOptions.tsx:38-52`, `tailwind.config.js` | **Fixed (0.5)** |
| 10 | **Low** | The `multiply`/`divide` checkboxes were uncontrolled (`checked={undefined}`), producing a React "changing an uncontrolled input to be controlled" warning on first interaction. | `BasicAlgebraOptions.tsx:46-52` | **Fixed (0.5)** |

---

## 7. Environment and toolchain

Updated during Phase 1 (branch `phase1-tests`):

- **Next.js 16.4.6** (Turbopack), **React 19**, **TypeScript 5.9.3**, **Tailwind 4.3.5**
  (CSS-first config, no `tailwind.config.js`).
- **Vitest 5** with property tests in `tests/basic-algebra.test.ts` (`npm test`).
- **ESLint 10** via flat config `eslint.config.mjs`; `next lint` no longer exists in
  Next 16, so linting runs as `eslint .` and `next build` does not lint.
- No CI yet (deferred); the checks are `npm run lint`, `npm test`, `npm run build`.
- Docker image is **node:24-slim**; local development runs Node 26.
- `npm audit` is clean (was 17 vulnerabilities, 1 critical, on the 2023 stack).

---

## 8. Explicitly absent (not deferred — never built)

- Persistence of any kind (no localStorage, no database)
- Multiple children / profiles
- Difficulty adaptation or spaced repetition
- Problem history or scoring
- Any problem type beyond `a OP b = c` single-step arithmetic
- Accessibility (no labels linked to inputs via `for`/`id`, no ARIA, colour-only feedback)

---

## 9. What is good and should be kept

- The generator is pure, self-contained, and has no UI coupling — new problem types
  are additive.
- State is a single reducer with a clear status enum; no scattered `useState` soup.
- Dark-only styling is deliberate and consistent (the last commit removed the dark
  mode query on purpose).
- The whole app is a single static page: fast, no server state, trivial to deploy.

---

## 10. Phase 0 outcomes (branch `phase0-stabilization`)

Seven commits, one per roadmap item. What the app now guarantees:

| Item | Change | How it was verified |
|---|---|---|
| 0.1 | `onOptionsChange` hoisted into `useCallback` | Headless probe: `Home` rendered 5001 times in 2 s before, 2 after |
| 0.2 | Maximum Number is a controlled `type="number"` field showing 100; invalid text is ignored; the generator clamps to 1–1000 | 200 generated problems for each of `NaN`, `undefined`, `0`, `999999` — no `NaN` in any of them; browser: clearing the field still produced a valid problem |
| 0.3 | Empty operation selection: UI alert + disabled button, generator falls back to addition | Browser: unchecking all four shows "Choose at least one operation…" and disables New Problem; re-enabling clears it |
| 0.4 | `DEFAULT_OPTIONS` lives in the problem builder; the picker is controlled (no local state, no syncing effect) | Browser: no render loop; toggles still drive the guard |
| 0.5 | `dark:` variants and stray `value=""` removed; all four operations defined in the defaults | Browser: no "uncontrolled input" warning; Tailwind emits `accent-blue-500` and `text-gray-300` |
| 0.6 | Text feedback in an `aria-live` region, Enter submits, `INVALID` gets its own colour, `verify()` re-reads the input | Browser: correct answer + Enter → "Correct!" (green); wrong + Submit → "Not quite — try again" (red); `abc` → "Enter a number" (yellow) |
| 0.7 | Real page title/description, Tailwind content glob trimmed to `./app/**` | Build output contains `<title>Amber's Learning</title>` |
| 0.8 | The first problem is generated in a mount effect instead of at module scope; `verify()` guards against a null problem | The prerendered HTML now contains no equation, and the page mounts with **zero** console warnings (previously a hydration error) |

Idle DOM mutations over 3 seconds in a real browser: **0** (the render loop is gone).

Still open after Phase 0: the option-change-does-not-regenerate behaviour (deliberate,
ADR-6). Everything else in §6 is resolved.
