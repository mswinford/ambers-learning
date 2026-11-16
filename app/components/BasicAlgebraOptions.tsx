"use client"

import { ChangeEvent, useEffect, useState } from "react";
import { BasicAlgebraOptions as Options, NUMBER_MAXIMUM_LIMITS } from "../problem-builders/basic-algebra";

const DEFAULT_OPTIONS: Options = {
  operations: {
    add: true,
    subtract: true
  },
  numberMaximum: NUMBER_MAXIMUM_LIMITS.default
}

const BasicAlgebraOptions = ({
  onOptionsChange
}: {
  onOptionsChange: (options: Options) => void
}) => {
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const t = 0;

  const toggleOperation = (operation: keyof Options['operations']) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setOptions({ ...options, operations: { ...options.operations, [operation]: event.target.checked } })
    }

  const onMaxNumberChanged = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseInt(event.target.value, 10);

    // Garbage or empty input keeps the current maximum rather than poisoning the
    // generator with NaN.
    if (Number.isNaN(parsed)) return;

    const maximum = Math.min(NUMBER_MAXIMUM_LIMITS.max, Math.max(NUMBER_MAXIMUM_LIMITS.min, parsed));
    setOptions({ ...options, numberMaximum: maximum })
  }

  useEffect(() => onOptionsChange(options), [onOptionsChange, options])

  return (
    <div className="flex flex-row items-end gap-20 text-xl border border-white rounded p-5">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center">
          <input type="checkbox" checked={options.operations.add} onChange={toggleOperation('add')} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          <label className="ml-2 font-medium text-gray-900 dark:text-gray-300">Addition</label>
        </div>
        <div className="flex items-center">
          <input checked={options.operations.subtract} onChange={toggleOperation('subtract')} type="checkbox" value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          <label className="ml-2 font-medium text-gray-900 dark:text-gray-300">Subtraction</label>
        </div>
        <div className="flex items-center">
          <input checked={options.operations.multiply} onChange={toggleOperation('multiply')} type="checkbox" value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          <label className="ml-2 font-medium text-gray-900 dark:text-gray-300">Multiplication</label>
        </div>
        <div className="flex items-center">
          <input checked={options.operations.divide} onChange={toggleOperation('divide')} type="checkbox" value="" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          <label className="ml-2 font-medium text-gray-900 dark:text-gray-300">Division</label>
        </div>
      </div>
      <div className="flex flex-col">
        <label htmlFor="number-maximum">Maximum Number</label>
        <input
          id="number-maximum"
          type="number"
          min={NUMBER_MAXIMUM_LIMITS.min}
          max={NUMBER_MAXIMUM_LIMITS.max}
          value={options.numberMaximum ?? NUMBER_MAXIMUM_LIMITS.default}
          className="bg-transparent w-28 py-1 px-2 border border-white rounded"
          onChange={onMaxNumberChanged}
        />
      </div>
    </div>
  );
};

export default BasicAlgebraOptions;