import { useRef, useCallback } from 'react';

export function useTimer() {
  const startTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
  }, []);

  const getElapsed = useCallback(() => {
    return Date.now() - startTimeRef.current;
  }, []);

  return { start, getElapsed };
}
