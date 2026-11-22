import { useState, useEffect } from 'react';

/**
 * Hook que devuelve un valor con retraso (debounce).
 * Útil para evitar consultas excesivas mientras el usuario escribe.
 * @param {*} value El valor a debouncear
 * @param {number} delay Retraso en milisegundos (default: 400)
 * @returns {*} El valor con retraso
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
