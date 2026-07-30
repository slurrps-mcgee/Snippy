export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Simple timer-based debouncer for use in components (e.g. debouncing search input
 * before triggering a server request). Call `clear()` on destroy to avoid leaks.
 */
export class Debouncer {
  private handle?: ReturnType<typeof setTimeout>;

  constructor(private readonly delayMs: number = SEARCH_DEBOUNCE_MS) {}

  run(fn: () => void): void {
    this.clear();
    this.handle = setTimeout(fn, this.delayMs);
  }

  clear(): void {
    clearTimeout(this.handle);
  }
}
