# Current State of ambers-learning

Snapshot taken: **2026-11-16**
Last commit: `439fb73` — 2023-05-05 ("remove dark mode query as app only supports dark mode")
Total commits: 5 · Total source: ~325 lines across 5 files
Build status: `npm run build` succeeds on Node 26 (Next 13.4 static prerender, `/` = 2.18 kB)

This document is a factual record of **what the code does today**, not what it should do.
It is the baseline any future change should be measured against.

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
- Any behaviour when **no** operation is selected — `getRandomOperation` returns
  `undefined` and the generator falls through to `{ display: 'Something went wrong', solution: 0 }`.
  The child then has to type `0` to "solve" it.

---

## 6. Defects found in the current code

| # | Severity | Description | Evidence |
|---|---|---|---|
| 1 | **High** | The "Maximum Number" input is uncontrolled and unvalidated. Clearing it yields `parseInt('') = NaN`, which is merged into options and propagates into the generator: every problem renders as `NaN + x = NaN`. | `BasicAlgebraOptions.tsx:26-30`, `basic-algebra.ts:83` |
| 2 | **High (needs browser confirmation)** | `useEffect(() => onOptionsChange(options), [onOptionsChange, options])` re-runs on every render, because `page.tsx` passes a freshly-created arrow function as `onOptionsChange`. Each run dispatches `SET_OPTIONS`, which produces a new state object and therefore a new render. Static reading suggests a continuous render loop. | `page.tsx:82`, `BasicAlgebraOptions.tsx:32` |
| 3 | **Medium** | Two competing defaults. `page.tsx` defines `OPTIONS = { add, subtract }`; the picker defines its own `DEFAULT_OPTIONS` and overwrites state on mount. The page-level constant is effectively dead. | `page.tsx:6-11`, `BasicAlgebraOptions.tsx:6-11` |
| 4 | **Medium** | Invalid input is indistinguishable from unattempted input. Typing `abc` sets status `INVALID` (white border), and pressing Submit then compares `undefined` against the solution and reports `INCORRECT`. | `page.tsx:58, 68-71` |
| 5 | **Medium** | Changing options does not regenerate the current problem, so the UI can show a max of 5 while the displayed problem came from max 100. | `page.tsx:28-29` |
| 6 | **Medium (kid-facing)** | No Enter-to-submit, no success/failure text, no feedback on how close an answer was. | `page.tsx:86-91` |
| 7 | **Low** | The initial problem is generated at module scope during prerender, so the server-rendered HTML contains a different random problem than the client's state. React hydration silently patches the text. | `page.tsx:39-43` |
| 8 | **Low** | Dead code (`const t = 0;`), metadata title still "Create Next App". | `BasicAlgebraOptions.tsx:19`, `layout.tsx:7-8` |
| 9 | **Low** | The theme is dark-only in `globals.css`, but the option labels/checkboxes still use Tailwind `dark:` variants, which are evaluated against `prefers-color-scheme` (no `darkMode` setting in `tailwind.config.js`). On a light-mode OS the labels render `text-gray-900` on a black page and are effectively unreadable. Commit `439fb73` removed the media query from CSS but not from the component classes. | `BasicAlgebraOptions.tsx:38-52`, `tailwind.config.js` |

---

## 7. Environment and toolchain

- **Next.js 13.4.0** (released May 2023). Three major versions behind current.
- **Node 18** in the Docker image (EOL); local development runs Node 26 and builds fine.
- **Tailwind 3.3**, config still references a `./pages/` directory that does not exist.
- No dependency pinning strategy, no CI, no automated linting in any pipeline.
- Deployment assumes a self-hosted Ubuntu box with Traefik (`reverse-proxy` network,
  HTTP -> HTTPS redirect via `https-redirect@file` middleware, ACME http resolver).
  A `/home/ubuntu/docker-data/ambers-learning/config` volume is mounted but nothing in
  the repo writes to it.

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
