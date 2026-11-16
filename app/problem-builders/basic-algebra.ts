export type BasicAlgebraOptions = {
  operations: {
    add?: boolean;
    subtract?: boolean;
    multiply?: boolean;
    divide?: boolean;
  },
  numberMaximum?: number;
};

export const NUMBER_MAXIMUM_LIMITS = {
  default: 100,
  min: 1,
  max: 1000
};

export const DEFAULT_OPTIONS: BasicAlgebraOptions = {
  operations: {
    add: true,
    subtract: true
  },
  numberMaximum: NUMBER_MAXIMUM_LIMITS.default
};

const clampNumberMaximum = (value: number | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return NUMBER_MAXIMUM_LIMITS.default;
  return Math.min(NUMBER_MAXIMUM_LIMITS.max, Math.max(NUMBER_MAXIMUM_LIMITS.min, value));
};

export type Problem = {
  display: string,
  solution: number
}

const getRandomOperation = (operations: BasicAlgebraOptions['operations']) => {
  const ops = [];
  if (operations.add) ops.push('add');
  if (operations.subtract) ops.push('subtract');
  if (operations.multiply) ops.push('multiply');
  if (operations.divide) ops.push('divide');

  if (ops.length === 0) return undefined;

  const randomIndex = Math.floor(Math.random() * ops.length);
  return ops[randomIndex];
};

export const hasAnyOperation = (operations: BasicAlgebraOptions['operations']): boolean =>
  Boolean(operations.add || operations.subtract || operations.multiply || operations.divide);

const createAddProblem = (numberMaximum: BasicAlgebraOptions['numberMaximum']) => {
  const a = Math.ceil(Math.random() * numberMaximum!);
  const b = Math.floor(Math.random() * (numberMaximum! + 1 - a));
  const c = a + b;

  const blankIndex = Math.ceil(Math.random() * 3);

  if (blankIndex === 1) return { display: `x + ${b} = ${c}`, solution: a };
  if (blankIndex === 2) return { display: `${a} + x = ${c}`, solution: b };
  return { display: `${a} + ${b} = x`, solution: c };
}

const createSubtractProblem = (numberMaximum: BasicAlgebraOptions['numberMaximum']) => {
  const a = Math.ceil(Math.random() * numberMaximum!);
  const b = Math.floor(Math.random() * a);
  const c = a - b;

  const blankIndex = Math.ceil(Math.random() * 3);

  if (blankIndex === 1) return { display: `x - ${b} = ${c}`, solution: a };
  if (blankIndex === 2) return { display: `${a} - x = ${c}`, solution: b };
  return { display: `${a} - ${b} = x`, solution: c };
}

const createMultiplyProblem = (numberMaximum: BasicAlgebraOptions['numberMaximum']) => {
  const a = Math.ceil(Math.random() * numberMaximum!);
  const b = Math.ceil(Math.random() * numberMaximum!);
  const c = a * b;

  const blankIndex = Math.ceil(Math.random() * 3);

  if (blankIndex === 1) return { display: `x * ${b} = ${c}`, solution: a };
  if (blankIndex === 2) return { display: `${a} * x = ${c}`, solution: b };
  return { display: `${a} * ${b} = x`, solution: c };
}

const createDivideProblem = (numberMaximum: BasicAlgebraOptions['numberMaximum']) => {
  const b = Math.ceil(Math.random() * numberMaximum!);
  const a = Math.ceil(Math.random() * b) * b;
  const c = a / b;

  const blankIndex = Math.ceil(Math.random() * 3);

  if (blankIndex === 1) return { display: `x / ${b} = ${c}`, solution: a };
  if (blankIndex === 2) return { display: `${a} / x = ${c}`, solution: b };
  return { display: `${a} / ${b} = x`, solution: c };
}

const createProblem = (options: BasicAlgebraOptions = DEFAULT_OPTIONS): Problem => {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  const numberMaximum = clampNumberMaximum(merged.numberMaximum);

  switch (getRandomOperation(merged.operations)) {
    case 'subtract':
      return createSubtractProblem(numberMaximum);
    case 'multiply':
      return createMultiplyProblem(numberMaximum);
    case 'divide':
      return createDivideProblem(numberMaximum);
    default:
      // Addition, or the defensive case where nothing is selected — the UI
      // prevents that, but the generator should never hand back an unsolvable
      // problem.
      return createAddProblem(numberMaximum);
  }
}

export default createProblem;