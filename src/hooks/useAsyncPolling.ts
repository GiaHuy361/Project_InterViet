import { useCallback, useEffect, useRef, useState } from 'react';

type FinalStatus = 'completed' | 'partially_completed' | 'failed' | 'cancelled' | 'parsed';

interface PollingOptions<T> {
  fetchFn: () => Promise<T>;
  getStatusFn: (data: T) => string;
  intervalMs?: number;
  timeoutMs?: number;
  onSuccess?: (data: T) => void;
  onFailure?: (error: unknown) => void;
}

export function useAsyncPolling<T>({
  fetchFn,
  getStatusFn,
  intervalMs = 3000,
  timeoutMs = 180000,
  onSuccess,
  onFailure,
}: PollingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isPolling, setIsPolling] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const isTickingRef = useRef(false);
  const pollRunIdRef = useRef(0);
  const fetchFnRef = useRef(fetchFn);
  const getStatusFnRef = useRef(getStatusFn);
  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);

  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    getStatusFnRef.current = getStatusFn;
  }, [getStatusFn]);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onFailureRef.current = onFailure;
  }, [onFailure]);

  const stopPolling = useCallback(() => {
    pollRunIdRef.current += 1;
    isTickingRef.current = false;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    setError(null);
    setIsPolling(true);
    startTimeRef.current = Date.now();
    const runId = ++pollRunIdRef.current;

    const tick = async () => {
      if (pollRunIdRef.current !== runId || isTickingRef.current) return;

      isTickingRef.current = true;

      if (Date.now() - startTimeRef.current > timeoutMs) {
        isTickingRef.current = false;
        stopPolling();
        const timeoutError = new Error('H?t th?i gian ch? x? l�. Vui l�ng th? l?i.');
        setError(timeoutError);
        onFailureRef.current?.(timeoutError);
        return;
      }

      try {
        const response = await fetchFnRef.current();
        if (pollRunIdRef.current !== runId) return;
        setData(response);

        const status = getStatusFnRef.current(response).trim().toLowerCase();
        if ((['completed', 'partially_completed', 'parsed'] as FinalStatus[]).includes(status as FinalStatus)) {
          isTickingRef.current = false;
          stopPolling();
          onSuccessRef.current?.(response);
          return;
        }

        if ((['failed', 'cancelled'] as FinalStatus[]).includes(status as FinalStatus)) {
          isTickingRef.current = false;
          stopPolling();
          const finalError = new Error('Ti?n tr�nh x? l� d� th?t b?i. Vui l�ng th? l?i.');
          setError(finalError);
          onFailureRef.current?.(finalError);
          return;
        }
      } catch (err: any) {
        if (pollRunIdRef.current !== runId) return;
        if (err?.status === 401 || err?.status === 404 || err?.response?.status === 401 || err?.response?.status === 404) {
          isTickingRef.current = false;
          stopPolling();
          setError(err);
          onFailureRef.current?.(err);
        }
      } finally {
        if (pollRunIdRef.current === runId) {
          isTickingRef.current = false;
        }
      }
    };

    void tick();
    timerRef.current = setInterval(() => {
      void tick();
    }, intervalMs);
  }, [intervalMs, stopPolling, timeoutMs]);

  useEffect(() => stopPolling, [stopPolling]);

  return {
    data,
    error,
    isPolling,
    startPolling,
    stopPolling,
  };
}

