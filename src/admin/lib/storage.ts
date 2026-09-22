// ─── Generic localStorage helpers ────────────────────────────────────────────
// All CMS data is namespaced under the `nestora_cms_` prefix.
// These utilities are the ONLY place that touches localStorage directly.
// Swapping to another persistence layer means updating only this file.

const NS = 'nestora_cms_';

export function storageGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function storageSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // Storage quota exceeded or private browsing — fail silently
    console.warn('[CMS] Failed to write to localStorage:', key);
  }
}

export function storageRemove(key: string): void {
  localStorage.removeItem(NS + key);
}

export function storageHas(key: string): boolean {
  return localStorage.getItem(NS + key) !== null;
}
