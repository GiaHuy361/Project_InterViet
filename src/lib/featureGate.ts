/**
 * Feature Gate — Client-side feature toggle state
 *
 * Tracks which backend features are disabled (via HTTP 503 + feature gate error codes).
 * The state is cached in localStorage so the UI doesn't flash enabled menus
 * before the first API call detects the gate.
 *
 * IMPORTANT:
 * - Feature gate state only changes when an admin updates server config.
 * - Do NOT auto-retry 503 Feature Gate errors — they are intentional.
 * - The gate is cleared on explicit admin action or page refresh after config change.
 */

const STORAGE_KEY = 'interviet_feature_gates';

/**
 * Feature gate identifiers.
 * Each maps to a backend error code pattern: `{Feature}.Disabled`
 */
export type FeatureGateId = 'admin' | 'support';

/** Known feature gate error codes from backend */
export const FEATURE_GATE_CODES: Record<string, FeatureGateId> = {
  'Admin.Disabled': 'admin',
  'Support.Disabled': 'support',
};

/**
 * Feature gate state stored in memory + localStorage
 */
interface FeatureGateState {
  /** Map of feature ID → disabled reason (error message from backend) */
  disabled: Record<string, string>;
  /** Timestamp when the state was last updated */
  updatedAt: number;
}

/** In-memory cache (avoids repeated localStorage reads) */
let _state: FeatureGateState = loadFromStorage();

/**
 * Check if a feature is currently disabled.
 *
 * @example
 * ```ts
 * if (isFeatureDisabled('admin')) {
 *   // Don't show admin menu
 * }
 * ```
 */
export function isFeatureDisabled(featureId: FeatureGateId): boolean {
  return featureId in _state.disabled;
}

/**
 * Get the disabled reason message for a feature.
 */
export function getDisabledReason(featureId: FeatureGateId): string | null {
  return _state.disabled[featureId] || null;
}

/**
 * Mark a feature as disabled.
 * Called by apiClient when it receives a 503 with a feature gate error code.
 *
 * @param featureId - The feature to disable
 * @param reason - Human-readable reason from backend
 */
export function markFeatureDisabled(featureId: FeatureGateId, reason: string): void {
  _state.disabled[featureId] = reason;
  _state.updatedAt = Date.now();
  saveToStorage(_state);

  // Dispatch a custom event so React components can react without polling
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('interviet:feature-gate-change', {
        detail: { featureId, disabled: true, reason },
      })
    );
  }
}

/**
 * Mark a feature as re-enabled.
 * Could be called if a subsequent successful API call to that feature succeeds.
 */
export function markFeatureEnabled(featureId: FeatureGateId): void {
  if (!(featureId in _state.disabled)) return;

  delete _state.disabled[featureId];
  _state.updatedAt = Date.now();
  saveToStorage(_state);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('interviet:feature-gate-change', {
        detail: { featureId, disabled: false },
      })
    );
  }
}

/**
 * Clear all feature gates (e.g., on logout or manual reset).
 */
export function clearAllFeatureGates(): void {
  _state = { disabled: {}, updatedAt: Date.now() };
  saveToStorage(_state);
}

/**
 * Get the full feature gate state (for debugging or React state sync).
 */
export function getFeatureGateState(): Readonly<FeatureGateState> {
  return _state;
}

/**
 * Check if an error code is a feature gate error.
 * Returns the feature ID if it is, null otherwise.
 */
export function getFeatureGateFromErrorCode(code: string): FeatureGateId | null {
  return FEATURE_GATE_CODES[code] || null;
}

// ─── Storage helpers ────────────────────────────────────────

function loadFromStorage(): FeatureGateState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FeatureGateState;
      if (parsed && typeof parsed.disabled === 'object') {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { disabled: {}, updatedAt: 0 };
}

function saveToStorage(state: FeatureGateState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota / private mode
  }
}
