import { describe, it, expect } from 'vitest';
import createProblem, {
  DEFAULT_OPTIONS,
  NUMBER_MAXIMUM_LIMITS,
  hasAnyOperation,
  type BasicAlgebraOptions,
  type Problem
} from '../app/problem-builders/basic-algebra';

/*
 * The generator is random, so these tests assert invariants over many samples
 * rather than exact outputs. A problem is always of the form:  a op b = c
 * where exactly one of a, b, c is the string 'x'.
 */

const SAMPLES = 5000;
const EQUATION = /^(\d+|x) ([+\-*/]) (\d+|x) = (\d+|x)$/;

type Parsed = { a: string; op: string; b: string; c: string };

function parse(display: string): Parsed | null {
  const match = EQUATION.exec(display);
  if (!match) return null;
  return { a: match[1], op: match[2], b: match[3], c: match[4] };
}

function apply(op: string, left: number, right: number): number {
  switch (op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    default:
      return NaN;
  }
}

function valueOf(token: string, x: number): number {
  return token === 'x' ? x : Number(token);
}

/** Substituting x into the equation must make both sides equal. */
function holds(problem: Problem, x: number): boolean {
  const parsed = parse(problem.display);
  if (!parsed) return false;
  return apply(parsed.op, valueOf(parsed.a, x), valueOf(parsed.b, x)) === valueOf(parsed.c, x);
}

function generate(options: BasicAlgebraOptions, count = SAMPLES): Problem[] {
  return Array.from({ length: count }, () => createProblem(options));
}

function operators(problems: Problem[]): Set<string> {
  return new Set(problems.map(p => parse(p.display)!.op));
}

function blankPositions(problems: Problem[]): Set<string> {
  return new Set(problems.map(p => {
    const parsed = parse(p.display)!;
    if (parsed.a === 'x') return 'left';
    if (parsed.b === 'x') return 'middle';
    return 'result';
  }));
}

/** The literal numbers that appear in each problem. */
function literals(problems: Problem[]): number[] {
  return problems.flatMap(p => {
    const parsed = parse(p.display)!;
    return [parsed.a, parsed.b, parsed.c].filter(token => token !== 'x').map(Number);
  });
}

describe('problem shape', () => {
  it('always produces a well-formed equation with exactly one x', () => {
    for (const problem of generate(DEFAULT_OPTIONS)) {
      expect(parse(problem.display), problem.display).not.toBeNull();
      expect(problem.display.split('x').length - 1).toBe(1);
    }
  });

  it('the stored solution satisfies the displayed equation', () => {
    for (const problem of generate(DEFAULT_OPTIONS)) {
      expect(holds(problem, problem.solution), problem.display).toBe(true);
    }
  });

  it('covers every operation and every blank position', () => {
    const problems = generate({
      operations: { add: true, subtract: true, multiply: true, divide: true },
      numberMaximum: 50
    });

    for (const op of ['+', '-', '*', '/']) {
      expect(operators(problems).has(op), `operation ${op} never appeared`).toBe(true);
    }

    const positions = blankPositions(problems);
    for (const position of ['left', 'middle', 'result']) {
      expect(positions.has(position), `blank position ${position} never appeared`).toBe(true);
    }
  });
});

describe('arithmetic guarantees', () => {
  it('solutions are finite, non-negative integers', () => {
    const problems = generate({
      operations: { add: true, subtract: true, multiply: true, divide: true },
      numberMaximum: 100
    });

    for (const problem of problems) {
      expect(Number.isInteger(problem.solution), problem.display).toBe(true);
      expect(Number.isFinite(problem.solution), problem.display).toBe(true);
      expect(problem.solution).toBeGreaterThanOrEqual(0);
    }
  });

  it('subtraction never produces a negative difference', () => {
    for (const problem of generate({ operations: { subtract: true }, numberMaximum: 100 })) {
      const parsed = parse(problem.display)!;
      const left = valueOf(parsed.a, problem.solution);
      const right = valueOf(parsed.b, problem.solution);
      expect(left - right).toBeGreaterThanOrEqual(0);
    }
  });

  it('division is always exact and never divides by zero', () => {
    for (const problem of generate({ operations: { divide: true }, numberMaximum: 100 })) {
      const parsed = parse(problem.display)!;
      const dividend = valueOf(parsed.a, problem.solution);
      const divisor = valueOf(parsed.b, problem.solution);

      expect(divisor).not.toBe(0);
      expect(dividend % divisor).toBe(0);
    }
  });
});

describe('numberMaximum handling', () => {
  it('addition and subtraction keep every literal within the maximum', () => {
    const problems = generate({ operations: { add: true, subtract: true }, numberMaximum: 20 });

    for (const n of literals(problems)) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(20);
    }
  });

  it('clamps missing, NaN, zero, negative and absurd maxima', () => {
    const inputs = [undefined, NaN, 0, -5, 999999, 100000000];

    for (const numberMaximum of inputs) {
      // Addition and subtraction keep every literal within the maximum, which is
      // what makes the clamp observable.
      const problems = generate({ operations: { add: true, subtract: true }, numberMaximum }, 500);

      for (const problem of problems) {
        expect(problem.display).not.toContain('NaN');
        expect(Number.isInteger(problem.solution), problem.display).toBe(true);

        for (const n of literals([problem])) {
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(NUMBER_MAXIMUM_LIMITS.max);
        }
      }
    }
  });

  it('a maximum of 1 still produces a valid problem', () => {
    const problem = createProblem({ operations: { add: true }, numberMaximum: 1 });
    expect(holds(problem, problem.solution)).toBe(true);
  });
});

describe('no operations selected', () => {
  it('the generator never returns an unsolvable problem', () => {
    for (const problem of generate({ operations: {} }, 200)) {
      expect(problem.display).not.toBe('Something went wrong');
      expect(holds(problem, problem.solution), problem.display).toBe(true);
    }
  });

  it('hasAnyOperation agrees with the generator', () => {
    expect(hasAnyOperation({})).toBe(false);
    expect(hasAnyOperation({ add: false, subtract: false })).toBe(false);
    expect(hasAnyOperation({ add: false, multiply: true })).toBe(true);
    expect(hasAnyOperation(DEFAULT_OPTIONS.operations)).toBe(true);
  });
});

describe('known limitations (update these deliberately)', () => {
  it('numberMaximum constrains operands, not results', () => {
    const problems = generate({ operations: { multiply: true }, numberMaximum: 10 }, 200);
    const largestLiteral = Math.max(...literals(problems));
    expect(largestLiteral).toBeGreaterThan(10);
  });

  it('division can produce a dividend far above the maximum', () => {
    const problems = generate({ operations: { divide: true }, numberMaximum: 10 }, 200);
    const largestDividend = Math.max(...problems.map(p => valueOf(parse(p.display)!.a, p.solution)));
    expect(largestDividend).toBeGreaterThan(10);
  });

  it('degenerate problems such as x + 0 = 5 are currently possible', () => {
    const problems = generate({ operations: { add: true }, numberMaximum: 20 }, 2000);
    expect(literals(problems).includes(0)).toBe(true);
  });
});
