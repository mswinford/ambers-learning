"use client"
import React, { ChangeEvent, useCallback, useEffect, useMemo, useReducer, useState } from "react";
import createProblem, { BasicAlgebraOptions, DEFAULT_OPTIONS, hasAnyOperation, Problem } from "./problem-builders/basic-algebra";
import { default as OptionsPicker } from "./components/BasicAlgebraOptions";

type State = {
  options: BasicAlgebraOptions,
  problem: Problem | null;
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

// The first problem is generated after hydration, not at module scope: if it were
// created during prerender the server HTML and the client state would disagree and
// React would report a hydration error.
const INITIAL_STATE: State = {
  options: DEFAULT_OPTIONS,
  problem: null,
  status: 'PENDING'
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [input, setInput] = useState('');

  useEffect(() => {
    dispatch({ type: 'NEW_PROBLEM' });
  }, []);

  // Stable identity so the picker receives the same callback on every render.
  const handleOptionsChange = useCallback((newOptions: BasicAlgebraOptions) => {
    dispatch({ type: 'SET_OPTIONS', payload: newOptions });
  }, []);

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
    if (!state.problem || input === '') return;

    const value = Number(input);
    if (Number.isNaN(value)) {
      dispatch({ type: 'SET_STATUS', payload: 'INVALID' });
      return;
    }

    if (state.problem.solution === value) dispatch({ type: 'SET_STATUS', payload: 'CORRECT' });
    else dispatch({ type: 'SET_STATUS', payload: 'INCORRECT' })
  }

  const feedback = useMemo(() => {
    switch (state.status) {
      case 'CORRECT':
        return { border: 'border-green-500', text: 'Correct!', color: 'text-green-500' };
      case 'INCORRECT':
        return { border: 'border-red-500', text: 'Not quite — try again', color: 'text-red-500' };
      case 'INVALID':
        return { border: 'border-yellow-500', text: 'Enter a number', color: 'text-yellow-500' };
      default:
        return { border: 'border-white', text: '', color: '' };
    }
  }, [state.status]);

  const canGenerateProblem = hasAnyOperation(state.options.operations);

  return (
    <main className="flex min-h-screen flex-col items-center gap-5 p-24 text-4xl">
      <OptionsPicker options={state.options} onOptionsChange={handleOptionsChange} />
      <div>{state.problem ? state.problem.display : ''}</div>
      <div>
        <label htmlFor="answer">x =</label>
        <input
          id="answer"
          className={`bg-transparent text-white w-60 py-2 px-4 border ${feedback.border} rounded`}
          value={input}
          onChange={updateVal}
          onKeyDown={event => { if (event.key === 'Enter') verify(); }}
        />
      </div>
      <p className={`text-2xl ${feedback.color}`} aria-live="polite">{feedback.text}</p>
      <div className="flex items-center gap-5">
        <button className="bg-transparent hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onClick={verify}>Submit</button>
        <button className="bg-transparent hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded disabled:opacity-40 disabled:hover:bg-transparent" onClick={onClickNewProblem} disabled={!canGenerateProblem}>New Problem</button>
      </div>
      {!canGenerateProblem && (
        <p className="text-xl text-yellow-500" role="alert">Choose at least one operation to generate a new problem.</p>
      )}
    </main>
  )
}
