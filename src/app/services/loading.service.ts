import { Injectable, Signal, WritableSignal, computed, signal } from '@angular/core';

/**
 * Global loading state for data mutations only.
 *
 * - begin(): increments an internal counter
 * - end(): decrements the counter (never below 0)
 * - active(): signal true when counter > 0
 * - visible(): signal with a small delayed-show to avoid flicker on very fast ops
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  // Counts concurrent mutations
  private readonly _count: WritableSignal<number> = signal(0);

  // Expose whether any work is active
  readonly active: Signal<boolean> = computed(() => this._count() > 0);

  // UI-friendly visibility with delayed show (~180ms) to avoid flicker
  private readonly _visible: WritableSignal<boolean> = signal(false);
  private showTimer: any | null = null;
  private hideTimer: any | null = null;
  private minVisibleUntil = 0; // epoch ms

  readonly visible: Signal<boolean> = computed(() => this._visible());

  /**
   * Begin with delayed show (default ~180ms). Use for background/fast ops.
   */
  begin(): void {
    const next = this._count() + 1;
    this._count.set(next);
    // If this is the first operation, start delayed show
    if (next === 1) {
      // Clear any stray timer
      if (this.showTimer) {
        clearTimeout(this.showTimer);
        this.showTimer = null;
      }
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      // Delay before showing to avoid flicker on very fast operations
      this.showTimer = setTimeout(() => {
        this.showNow(0);
        this.showTimer = null;
      }, 180);
    }
  }

  /**
   * Begin and show immediately with a minimum visible time to avoid flicker,
   * useful for explicit user actions like form saves.
   */
  beginImmediate(minMs = 150): void {
    const next = this._count() + 1;
    this._count.set(next);

    if (next === 1) {
      // First op: cancel timers and show now
      if (this.showTimer) {
        clearTimeout(this.showTimer);
        this.showTimer = null;
      }
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
      this.showNow(minMs);
    } else if (this._visible()) {
      // Already visible: extend minimum if needed
      const now = Date.now();
      this.minVisibleUntil = Math.max(this.minVisibleUntil, now + Math.max(0, minMs));
      if (this.hideTimer && this.minVisibleUntil > now) {
        clearTimeout(this.hideTimer);
        this.hideTimer = null;
      }
    }
  }

  end(): void {
    const current = this._count();
    const next = current > 0 ? current - 1 : 0;
    this._count.set(next);

    if (next === 0) {
      // No more work: cancel pending show and hide immediately
      if (this.showTimer) {
        clearTimeout(this.showTimer);
        this.showTimer = null;
      }
      if (this._visible()) {
        const now = Date.now();
        const remaining = this.minVisibleUntil - now;
        if (remaining > 0) {
          // Respect minimum visible duration
          this.hideTimer = setTimeout(() => {
            this._visible.set(false);
            this.hideTimer = null;
          }, remaining);
        } else {
          this._visible.set(false);
        }
      } else {
        this._visible.set(false);
      }
    }
  }

  private showNow(minMs: number) {
    this._visible.set(true);
    const now = Date.now();
    this.minVisibleUntil = now + Math.max(0, minMs);
  }
}
