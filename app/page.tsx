"use client"
import React, { ChangeEvent, useMemo, useReducer, useState } from "react";
import createProblem, { BasicAlgebraOptions, Problem } from "./problem-builders/basic-algebra";
import { default as OptionsPicker } from "./components/BasicAlgebraOptions";

const OPTIONS: BasicAlgebraOptions = {
  operations: {
    add: true,
    subtract: true
  }
}

type State = {
  options: BasicAlgebraOptions,
  problem: Problem;
  answer?: number;
  status: 'PENDING' | 'INVALID' | 'INCORRECT' | 'CORRECT';
}

type Action =
  { type: 'NEW_PROBLEM' }
  | { type: 'SET_OPTIONS', payload: BasicAlgebraOptions }
  | { type: 'SET_VALUE', payload: number }
  | { type: 'SET_STATUS', payload: State['status'] }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_OPTIONS':
      return { ...state, options: action.payload}
    case 'NEW_PROBLEM':
      return { ...state, problem: createProblem(state.options), answer: undefined, status: 'PENDING' }
    case 'SET_VALUE':
      return { ...state, answer: action.payload, status: 'PENDING' };
    case 'SET_STATUS':
      return { ...state, status: action.payload }
  }
}

const INITIAL_STATE: State = {
  options: OPTIONS,
  problem: createProblem(OPTIONS),
  status: 'PENDING'
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [input, setInput] = useState('');

  const updateVal = (event: ChangeEvent<HTMLInputElement>) => {
    const str = event.target.value.trim()
    setInput(str);

    const val = +str;

    if (str !== '' && !isNaN(val)) {
      dispatch({ type: 'SET_VALUE', payload: val });
    } else {
      dispatch({ type: 'SET_STATUS', payload: 'INVALID' });
    }
  }

  const onClickNewProblem = () => {
    dispatch({ type: 'NEW_PROBLEM' });
    setInput('');
  }

  const verify = () => {
    if (input === '') return;

    if (state.problem.solution === state.answer) dispatch({ type: 'SET_STATUS', payload: 'CORRECT' });
    else dispatch({ type: 'SET_STATUS', payload: 'INCORRECT' })
  }

  const inputBorderColor = useMemo(() => {
    if (state.status === 'CORRECT') return 'border-green-500';
    if (state.status === 'INCORRECT') return 'border-red-500';
    return 'border-white';
  }, [state.status]);

  return (
    <main className="flex min-h-screen flex-col items-center gap-5 p-24 text-4xl">
      <OptionsPicker onOptionsChange={newOptions => dispatch({ type: "SET_OPTIONS", payload: newOptions})} />
      {state.problem.display}
      <div>
        x = 
        <input className={`bg-transparent text-white w-60 py-2 px-4 border ${inputBorderColor} rounded`} value={input} onChange={updateVal} />
      </div>
      <div className="flex items-center gap-5">
        <button className="bg-transparent hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onClick={verify}>Submit</button>
        <button className="bg-transparent hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onClick={onClickNewProblem}>New Problem</button>
      </div>
    </main>
  )
}
