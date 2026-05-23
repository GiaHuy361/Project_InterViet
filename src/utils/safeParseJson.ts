export function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value !== 'string') {
    return value as T;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch (error) {
    if (import.meta.env.DEV) {
      // Keep debug signal in development without crashing UI render.
      console.warn('[safeParseJson] Invalid JSON payload:', trimmed, error);
    }
    return fallback;
  }
}
