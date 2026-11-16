# ambers-learning

A small self-hosted web app for practising single-step arithmetic. Pick the
operations to practise, set a maximum number, and the app generates an equation
with one missing term (`x`) to solve.

Built for one child, running on one home server. No accounts, no tracking, no
network calls after the page loads.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Build and run the production bundle:

```bash
npm run build
npm start
```

Requirements: Node 18+ (the Dockerfile pins `node:18.13.0`; development has been
verified on Node 26).

---

## How it works

```
app/
|-- page.tsx                      # the whole client app: state, input, buttons
|-- layout.tsx                    # root layout, font, metadata
|-- globals.css                   # Tailwind + the dark background
|-- problem-builders/
|   `-- basic-algebra.ts          # pure generator: options in -> { display, solution }
`-- components/
    `-- BasicAlgebraOptions.tsx   # checkboxes for operations, max-number field
```

A problem is `{ display: string, solution: number }`. The generator picks an
enabled operation at random and then hides one of the three terms as `x`:

```
x + 7 = 12      solution 5
3 + x = 12      solution 9
3 + 7 = x       solution 10
```

Answers are compared for exact equality. The input border turns green for correct,
red for incorrect.

### Options

| Option | Effect |
|---|---|
| Addition / Subtraction / Multiplication / Division | Which operations appear. At least one must be checked |
| Maximum Number | Upper bound on the generated operands (default 100) |

Note that the maximum constrains *operands*, not results: with a maximum of 10,
`8 * 9 = 72` is a perfectly valid generated problem.

---

## Deploy

```bash
docker build -t ambers-learning:latest .
docker compose up -d
```

The compose file expects an external Traefik network named `reverse-proxy` and
publishes the app at `ambers-learning.swinford.house` with an HTTP -> HTTPS
redirect.

---

## Status

This project was written in May 2023 and has not been changed since. It builds and
runs, but it has real defects (an unvalidated maximum-number input that can produce
`NaN` problems, among others) and a toolchain three major versions behind.

Before changing anything, read:

- [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — a factual record of exactly
  what the code does today, including known bugs and what was never built.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — why the architecture looks the way it
  does, and what each choice cost.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — prioritized work in phases, with effort and
  risk for each item.
