# problem-generation

## Purpose

Generate a single-step arithmetic equation with exactly one unknown (`x`) that a
child can solve and verify.

## Requirements

### Requirement: Generated problems are well-formed equations

The generator SHALL produce a display string of the form `A op B = C` where `op` is
one of `+ - * /`, exactly one of `A`, `B`, `C` is the literal `x`, and the rest are
integers.

#### Scenario: A random problem is generated

- **WHEN** `createProblem` is called with any valid options object
- **THEN** the display matches `^(\d+|x) ([+\-*/]) (\d+|x) = (\d+|x)$`
- **AND** exactly one term is `x`

### Requirement: The stored solution satisfies the equation

The `solution` returned with a problem SHALL be the value that makes the displayed
equation true, whichever position `x` occupies.

#### Scenario: Solving for the left operand

- **WHEN** the problem is `x - 4 = 11`
- **THEN** `solution` is 15

#### Scenario: Solving for the divisor

- **WHEN** the problem is `36 / x = 6`
- **THEN** `solution` is 6

### Requirement: Only enabled operations are used

The generator SHALL pick uniformly from the operations the user enabled.

#### Scenario: Addition and subtraction only

- **WHEN** options are `{ operations: { add: true, subtract: true } }`
- **THEN** every generated problem uses `+` or `-`
- **AND** no problem uses `*` or `/`

#### Scenario: Every enabled operation appears

- **WHEN** all four operations are enabled and 5000 problems are generated
- **THEN** each of `+`, `-`, `*`, `/` appears at least once

### Requirement: The unknown may appear in any position

Each generated problem SHALL place `x` in the left operand, the right operand, or
the result with roughly equal likelihood.

#### Scenario: All three positions occur

- **WHEN** 5000 problems are generated
- **THEN** at least one problem has `x` on the left, one in the middle, and one as
  the result

### Requirement: `numberMaximum` bounds the operands

The generator SHALL treat `numberMaximum` as the upper bound on generated operands,
clamping it to the range 1–1000 and defaulting to 100 when it is missing, `NaN`,
zero, negative or absurd.

#### Scenario: A missing maximum

- **WHEN** `numberMaximum` is `undefined`
- **THEN** the generator behaves as if it were 100

#### Scenario: A garbage maximum

- **WHEN** `numberMaximum` is `NaN` or `0` or `100000000`
- **THEN** no generated problem contains `NaN`
- **AND** all operands are within 1–1000

### Requirement: Division is always exact

For division problems the dividend SHALL be an exact multiple of the divisor so the
answer is always an integer.

#### Scenario: A division problem

- **WHEN** a problem uses `/`
- **THEN** `dividend % divisor === 0`
- **AND** the divisor is never 0

### Requirement: Subtraction never yields a negative difference

For subtraction problems the generator SHALL ensure the left operand is at least the
right operand.

#### Scenario: A subtraction problem

- **WHEN** a problem uses `-`
- **THEN** `left - right >= 0`

### Requirement: At least one operation is always available

If no operation is enabled, the generator SHALL fall back to addition rather than
returning an unsolvable placeholder.

#### Scenario: Empty selection reaches the generator

- **WHEN** `createProblem` is called with `{ operations: {} }`
- **THEN** the returned problem is a valid addition problem
- **AND** the UI prevents this case by disabling "New Problem" and showing an alert

### Known limitation: results are not bounded

`numberMaximum` constrains operands only. Multiplication and division can produce
literals far larger than the configured maximum (e.g. max 10 can generate
`8 * 9 = 72`), and division dividends can reach the square of the divisor. Changing
this requires updating the tests that encode it.

### Known limitation: zero operands are possible

Addition and subtraction may generate a 0 operand, e.g. `x + 0 = 5`.
