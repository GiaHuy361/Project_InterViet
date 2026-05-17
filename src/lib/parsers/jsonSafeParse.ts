export function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value as T;
  if (value.trim() === '') return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function safeParseJsonArray<T>(value: unknown, fallback: T[] = []): T[] {
  const parsed = safeParseJson<unknown>(value, fallback);
  return Array.isArray(parsed) ? (parsed as T[]) : fallback;
}
