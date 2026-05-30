import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type FinalStatus =
  | 'completed'
  | 'partially_completed'
  | 'failed'
  | 'cancelled'
  | 'parsed';

interface PollingOptions<T> {
  fetchFn: () => Promise<T>;
  getStatusFn: (data: T) => string;
  intervalMs?: number;
  timeoutMs?: number;
  onSuccess?: (data: T) => void;
  onFailure?: (error: unknown) => void;
}

const SUCCESS_STATUSES: FinalStatus[] = [
  'completed',
  'partially_completed',
  'parsed',
];

const FAILURE_STATUSES: FinalStatus[] = [
  'failed',
  'cancelled',
];

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

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);
  const isTickingRef = useRef(false);
  const isPollingRef = useRef(false);
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
  

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
  pollRunIdRef.current += 1;
  isTickingRef.current = false;
  isPollingRef.current = false;

  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  setIsPolling(false);
}, []);

  const startPolling = useCallback(() => {
  if (isPollingRef.current) {
    return;
  }

  stopPolling();

  setError(null);
  setIsPolling(true);
  isPollingRef.current = true;
  startTimeRef.current = Date.now();

  const runId = ++pollRunIdRef.current;

  const tick = async () => {
    if (pollRunIdRef.current !== runId || isTickingRef.current) return;

    isTickingRef.current = true;

    try {
      if (Date.now() - startTimeRef.current > timeoutMs) {
        const timeoutError = new Error('Quá trình đang diễn ra mất quá nhiều thời gian. Vui lòng thử lại.');
        setError(timeoutError);
        onFailureRef.current?.(timeoutError);
        toast.error(timeoutError.message);
        stopPolling();
        return;
      }

      const response = await fetchFnRef.current();

      if (pollRunIdRef.current !== runId) return;

      setData(response);

      const status = getStatusFnRef.current(response).trim().toLowerCase();

      if ((['completed', 'partially_completed', 'parsed'] as FinalStatus[]).includes(status as FinalStatus)) {
        onSuccessRef.current?.(response);
        stopPolling();
        return;
      }

      if ((['failed', 'cancelled', 'error'] as FinalStatus[]).includes(status as FinalStatus)) {
        const finalError = new Error('Tiến trình xử lý thất bại. Vui lòng thử lại.');
        setError(finalError);
        onFailureRef.current?.(finalError);
        toast.error(finalError.message);
        stopPolling();
        return;
      }

      timerRef.current = setTimeout(() => {
        void tick();
      }, intervalMs);
    } catch (err: any) {
      if (pollRunIdRef.current !== runId) return;

      setError(err);
      onFailureRef.current?.(err);
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra trong quá trình xử lý');
      stopPolling();
    } finally {
      if (pollRunIdRef.current === runId) {
        isTickingRef.current = false;
      }
    }
  };

  void tick();
}, [intervalMs, stopPolling, timeoutMs]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    data,
    error,
    isPolling,
    startPolling,
    stopPolling,
  };
}