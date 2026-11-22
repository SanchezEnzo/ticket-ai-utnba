import { useEffect, useRef } from 'react';

/**
 * Hook para ejecutar una función periódicamente con polling.
 * Usa refs para evitar reiniciar el intervalo cuando la función cambia.
 * @param {Function} fn - Función async a ejecutar en cada intervalo
 * @param {number} intervaloMs - Milisegundos entre ejecuciones
 * @param {{ activo: boolean }} opts
 * @param {boolean} opts.activo - Controla si el polling está activo
 */
export function usePolling(fn, intervaloMs, { activo }) {
  const fnRef = useRef(fn);
  const isRunning = useRef(false);

  // Siempre mantener la referencia actualizada
  fnRef.current = fn;

  useEffect(() => {
    if (!activo) return;

    if (__DEV__) {
      console.log(`[usePolling] Arrancado cada ${intervaloMs}ms`);
    }

    const intervalId = setInterval(() => {
      if (isRunning.current) return;

      isRunning.current = true;
      if (__DEV__) {
        console.log('[usePolling] Ejecutando...');
      }

      fnRef.current().finally(() => {
        isRunning.current = false;
      });
    }, intervaloMs);

    return () => {
      clearInterval(intervalId);
      if (__DEV__) {
        console.log('[usePolling] Detenido');
      }
    };
  }, [activo, intervaloMs]);
}
