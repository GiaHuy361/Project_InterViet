export function isLikelyGuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
}

export function logApiAction(action: string, details: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug(`[api:${action}]`, details);
  }
}
