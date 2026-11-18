/**
 * HomeSmart - 2D Spatial Navigation Engine
 * Optimized for Android TV Remote D-Pad & Keyboard Navigation
 */

export type Direction = 'up' | 'down' | 'left' | 'right';

export class DPadNavigator {
  private container: HTMLElement;
  private currentFocus: HTMLElement | null = null;
  private keydownHandler: (e: KeyboardEvent) => void;
  private isEnabled: boolean = true;

  constructor(container: HTMLElement) {
    this.container = container;
    this.keydownHandler = this.handleKeyDown.bind(this);
    this.attach();
  }

  public attach(): void {
    window.addEventListener('keydown', this.keydownHandler);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.keydownHandler);
    this.clearFocus();
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearFocus();
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Do not intercept if active inside input or textarea
    const activeTag = document.activeElement?.tagName.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
      return;
    }

    const key = e.key;

    if (key === 'ArrowUp' || key === 'Up') {
      e.preventDefault();
      this.moveFocus('up');
    } else if (key === 'ArrowDown' || key === 'Down') {
      e.preventDefault();
      this.moveFocus('down');
    } else if (key === 'ArrowLeft' || key === 'Left') {
      e.preventDefault();
      this.moveFocus('left');
    } else if (key === 'ArrowRight' || key === 'Right') {
      e.preventDefault();
      this.moveFocus('right');
    } else if (key === 'Enter' || key === ' ' || key === 'Select') {
      if (this.currentFocus) {
        e.preventDefault();
        this.currentFocus.click();
      }
    }
  }

  public moveFocus(direction: Direction): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    if (!this.currentFocus || !this.container.contains(this.currentFocus)) {
      // Focus first element
      this.setFocus(focusable[0]);
      return;
    }

    const currentRect = this.currentFocus.getBoundingClientRect();
    let bestCandidate: HTMLElement | null = null;
    let minDistance = Infinity;

    for (const candidate of focusable) {
      if (candidate === this.currentFocus) continue;

      const candRect = candidate.getBoundingClientRect();
      if (candRect.width === 0 || candRect.height === 0) continue;

      const isDirectionMatch = this.isInDirection(currentRect, candRect, direction);
      if (!isDirectionMatch) continue;

      const dist = this.calculateSpatialDistance(currentRect, candRect, direction);
      if (dist < minDistance) {
        minDistance = dist;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      this.setFocus(bestCandidate);
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      '.glass-card',
      'button',
      '[tabindex="0"]',
      '.sidebar-item',
      '.tv-tab-item',
    ].join(',');

    const elements = Array.from(this.container.querySelectorAll(selector)) as HTMLElement[];
    return elements.filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        !el.hasAttribute('disabled')
      );
    });
  }

  private isInDirection(from: DOMRect, to: DOMRect, direction: Direction): boolean {
    const fromCenter = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    const toCenter = { x: to.left + to.width / 2, y: to.top + to.height / 2 };

    switch (direction) {
      case 'up':
        return toCenter.y < fromCenter.y - 10;
      case 'down':
        return toCenter.y > fromCenter.y + 10;
      case 'left':
        return toCenter.x < fromCenter.x - 10;
      case 'right':
        return toCenter.x > fromCenter.x + 10;
    }
  }

  private calculateSpatialDistance(from: DOMRect, to: DOMRect, direction: Direction): number {
    const fromCenter = { x: from.left + from.width / 2, y: from.top + from.height / 2 };
    const toCenter = { x: to.left + to.width / 2, y: to.top + to.height / 2 };

    const dx = Math.abs(toCenter.x - fromCenter.x);
    const dy = Math.abs(toCenter.y - fromCenter.y);

    // Primary axis vs secondary orthogonal axis penalty
    if (direction === 'up' || direction === 'down') {
      return dy + dx * 2.2;
    } else {
      return dx + dy * 2.2;
    }
  }

  public setFocus(element: HTMLElement): void {
    this.clearFocus();
    this.currentFocus = element;
    this.currentFocus.classList.add('dpad-focused');
    this.currentFocus.focus();

    // Scroll into view smoothly
    this.currentFocus.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }

  private clearFocus(): void {
    if (this.currentFocus) {
      this.currentFocus.classList.remove('dpad-focused');
      this.currentFocus = null;
    }
  }
}
