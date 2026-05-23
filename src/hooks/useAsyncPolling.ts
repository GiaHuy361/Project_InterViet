import { useCallback, useEffect, useRef, useState } from 'react';

type FinalStatus = 'completed' | 'failed' | 'cancelled' | 'parsed';

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

  const stopPolling = useCallback(() => {
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

    const tick = async () => {
      if (Date.now() - startTimeRef.current > timeoutMs) {
        stopPolling();
        const timeoutError = new Error('H?t th?i gian ch? x? lý. Vui lòng th? l?i.');
        setError(timeoutError);
        onFailure?.(timeoutError);
        return;
      }

      try {
        const response = await fetchFn();
        setData(response);

        const status = getStatusFn(response).trim().toLowerCase();
        if ((['completed', 'parsed'] as FinalStatus[]).includes(status as FinalStatus)) {
          stopPolling();
          onSuccess?.(response);
          return;
        }

        if ((['failed', 'cancelled'] as FinalStatus[]).includes(status as FinalStatus)) {
          stopPolling();
          const finalError = new Error('Ti?n trình x? lý dã th?t b?i. Vui lòng th? l?i.');
          setError(finalError);
          onFailure?.(finalError);
        }
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 404 || err?.response?.status === 401 || err?.response?.status === 404) {
          stopPolling();
          setError(err);
          onFailure?.(err);
        }
      }
    };

    void tick();
    timerRef.current = setInterval(() => {
      void tick();
    }, intervalMs);
  }, [fetchFn, getStatusFn, intervalMs, onFailure, onSuccess, stopPolling, timeoutMs]);

  useEffect(() => stopPolling, [stopPolling]);

  return {
    data,
    error,
    isPolling,
    startPolling,
    stopPolling,
  };
}
