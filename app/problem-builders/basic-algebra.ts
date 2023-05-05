export type BasicAlgebraOptions = {
  operations: {
    add?: boolean;
    subtract?: boolean;
    multiply?: boolean;
    divide?: boolean;
  },
  numberMaximum?: number;
};

const defaultOptions: BasicAlgebraOptions = {
  operations: {
    add: true
  },
  numberMaximum: 100
}

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

  const randomIndex = Math.floor(Math.random() * ops.length);
  return ops[randomIndex];
}

const createAddProblem = (numberMaximum: BasicAlgebraOptions['numberMaximum']) => {
  const a = Math.ceil(Math.random() * numberMaximum!);
  const b = Math.floor(Math.random() * (numberMaximum! + 1 - a))
  const c = a + b;

  const blankIndex = Math.ceil(Math.random() * 3);

  if (blankIndex === 1) return { display: `x + ${b} = ${c}`, solution: a };
  if (blankIndex === 2) return { display: `${a} + x = ${c}`, solution: b };
  return { display: `${a} + ${b} = x`, solution: c };
}

const createSubtractProblem = (numberMaximum: BasicAlgebraOptions['numberMaximum']) => {
  const a = Math.ceil(Math.random() * numberMaximum!);
  const b = Math.floor(Math.random() * a)
  const c = a - b;

  const blankIndex = Math.ceil(Math.random() * 3);

  if (blankIndex === 1) return { display: `x - ${b} = ${c}`, solution: a };
  if (blankIndex === 2) return { display: `${a} - x = ${c}`, solution: b };
  return { display: `${a} - ${b} = x`, solution: c };
}

const createProblem = (options: BasicAlgebraOptions = defaultOptions): Problem => {
  options = { ...defaultOptions, ...options };

  const randomOperation = getRandomOperation(options.operations);
  console.log(randomOperation);

  if (randomOperation === 'add') {
    return createAddProblem(options.numberMaximum);
  } else if (randomOperation === 'subtract') {
    return createSubtractProblem(options.numberMaximum);
  }

  return { display: 'Something went wrong', solution: 0};
}

export default createProblem;