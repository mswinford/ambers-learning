"use client"
import React, { ChangeEvent, Reducer, useEffect, useMemo, useReducer, useState } from "react";
import createProblem, { BasicAlgebraOptions, Problem } from "./problem-builders/basic-algebra";

const OPTIONS: BasicAlgebraOptions = {
  operations: {
    add: true,
    subtract: true
  }
}

type State = {
  problem: Problem;
  answer?: number;
  status: 'PENDING' | 'INVALID' | 'INCORRECT' | 'CORRECT';
}

const reducer = (state: State, action: { type: string; payload?: any; }): State => {
  switch (action.type) {
    case 'new_problem': 
      return { problem: createProblem(OPTIONS), answer: undefined, status: 'PENDING'}
    case 'set_value': 
      return {...state, answer: action.payload, status: 'PENDING'};
    case 'set_status': 
      return {...state, status: action.payload}
  }

  return state;
}

const initialState: State = {
  problem: createProblem(OPTIONS),
  status: 'PENDING'
}

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [input, setInput] = useState('');

  const updateVal = (event: ChangeEvent<HTMLInputElement>) => {
    const str = event.target.value.trim()
    setInput(str);

    const val = +str;

    if (str !== '' && !isNaN(val)) {
      dispatch({ type: 'set_value', payload: val });
    } else {
      dispatch({ type: 'set_status', payload: 'INVALID' });
    }
  }

  const onClickNewProblem = () => {
    dispatch({ type: 'new_problem' });
    setInput('');
  }

  const verify = () => {
    if (input === '') return;

    if (state.problem.solution === state.answer) dispatch({ type: 'set_status', payload: 'CORRECT' });
    else dispatch({ type: 'set_status', payload: 'INCORRECT' })
  }

  const inputBorderColor = useMemo(() => {
    if (state.status === 'CORRECT') return 'border-green-500';
    if (state.status === 'INCORRECT') return 'border-red-500';
    return 'border-white';
  }, [state.status]);

  useEffect(() => { console.log(inputBorderColor) }, [inputBorderColor]);

  return (
    <main className="flex min-h-screen flex-col items-center gap-5 p-24 text-4xl">
      {state.problem.display}
      <input className={`bg-transparent text-white py-2 px-4 border ${inputBorderColor} rounded`} value={input} onChange={updateVal} />
      <div className="flex items-center gap-5">
        <button className="bg-transparent hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onClick={verify}>Submit</button>
        <button className="bg-transparent hover:bg-blue-500 text-blue-500 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" onClick={onClickNewProblem}>New Problem</button>
      </div>
    </main>
  )
}
