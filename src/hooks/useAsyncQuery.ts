import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../lib/api/apiError';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export function useAsyncQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [error, setError] = useState<ApiError | null>(null);

  const refetch = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      setStatus('success');
      return result;
    } catch (err) {
      const apiErr =
        err instanceof ApiError
          ? err
          : new ApiError({
              status: 500,
              code: 'UNKNOWN_ERROR',
              message: 'Có lỗi xảy ra.',
            });
      setError(apiErr);
      setStatus('error');
      return null;
    }
  }, deps);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    status,
    error,
    isLoading: status === 'loading' || status === 'idle',
    isError: status === 'error',
    refetch,
  };
}
