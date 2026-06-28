// ============================================================
// SmartERP Keyboard Framework — Focus Manager
// ============================================================

export type FocusChangeListener = (path: string[]) => void;

export class FocusManager {
  private path: string[] = ['root'];
  private listeners: Set<FocusChangeListener> = new Set();

  constructor() {}

  /**
   * Pushes a new focused element ID onto the focus stack.
   */
  push(focusId: string): void {
    const cleanId = focusId.trim();
    if (!cleanId) return;

    // Remove if already present, to move it to the top (focused)
    this.path = this.path.filter(id => id !== cleanId);
    this.path.push(cleanId);
    this.notify();
  }

  /**
   * Pops the current focus node, returning focus to the previous element in the stack.
   * Never pops the 'root' node.
   */
  pop(focusId?: string): void {
    if (focusId) {
      const cleanId = focusId.trim();
      if (cleanId === 'root') return;
      this.path = this.path.filter(id => id !== cleanId);
    } else {
      if (this.path.length > 1) {
        this.path.pop();
      }
    }
    this.notify();
  }

  /**
   * Returns the top-most (currently active) focused element ID.
   */
  getActive(): string {
    return this.path[this.path.length - 1];
  }

  /**
   * Returns the complete focus path stack.
   */
  getPath(): string[] {
    return [...this.path];
  }

  /**
   * Subscribes to focus path changes.
   */
  subscribe(listener: FocusChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentPath = this.getPath();
    this.listeners.forEach(listener => {
      try {
        listener(currentPath);
      } catch (err) {
        console.error('Error in focus change listener:', err);
      }
    });
  }
}
