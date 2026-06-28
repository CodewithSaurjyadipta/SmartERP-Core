// ============================================================
// SmartERP Keyboard Framework — Context Manager
// ============================================================

export type ContextChangeListener = (stack: string[]) => void;

export class ContextManager {
  private stack: string[] = ['global'];
  private listeners: Set<ContextChangeListener> = new Set();

  constructor() {}

  /**
   * Pushes a new context scope onto the active stack.
   */
  push(context: string): void {
    const cleanContext = context.toLowerCase().trim();
    if (!cleanContext) return;
    
    // Prevent duplicate entries in the stack
    if (this.stack.includes(cleanContext)) {
      // Move it to the top/end of the stack
      this.stack = this.stack.filter(c => c !== cleanContext);
    }
    
    this.stack.push(cleanContext);
    this.notify();
  }

  /**
   * Pops the top context off the stack, or removes a specific context by name.
   * Never allows popping the root 'global' context.
   */
  pop(context?: string): void {
    if (context) {
      const cleanContext = context.toLowerCase().trim();
      if (cleanContext === 'global') return; // Protect global context
      this.stack = this.stack.filter(c => c !== cleanContext);
    } else {
      if (this.stack.length > 1) {
        this.stack.pop();
      }
    }
    this.notify();
  }

  /**
   * Checks if a context is active.
   */
  has(context: string): boolean {
    return this.stack.includes(context.toLowerCase().trim());
  }

  /**
   * Returns a copy of the active context stack.
   */
  getStack(): string[] {
    return [...this.stack];
  }

  /**
   * Evaluates if a list of allowed command contexts overlaps with the active stack.
   * If the command supports 'global', it is always active.
   */
  isCommandActive(allowedContexts: string[]): boolean {
    if (allowedContexts.length === 0) return false;
    
    const normalizedAllowed = allowedContexts.map(c => c.toLowerCase().trim());
    if (normalizedAllowed.includes('global')) return true;

    return normalizedAllowed.some(c => this.stack.includes(c));
  }

  /**
   * Registers a callback for when context stack changes.
   */
  subscribe(listener: ContextChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentStack = this.getStack();
    this.listeners.forEach(listener => {
      try {
        listener(currentStack);
      } catch (err) {
        console.error('Error in context change listener:', err);
      }
    });
  }
}
