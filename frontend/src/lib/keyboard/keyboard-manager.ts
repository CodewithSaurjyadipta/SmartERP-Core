// ============================================================
// SmartERP Keyboard Framework — Keyboard Manager (Coordinator)
// ============================================================

import { CommandDefinition, CommandHandler, Keybinding } from './types';
import { CommandBus } from './command-bus';
import { CommandQueue } from './command-queue';
import { ContextManager } from './context-manager';
import { FocusManager } from './focus-manager';
import { PermissionManager } from './permission-manager';
import { DebugLogger } from './debug-logger';
import { normalizeKeyCombo, eventToKeyCombo } from './platform';
import { validateKeyCombo } from './shortcut-parser';

export class KeyboardManager {
  public bus = new CommandBus();
  public queue = new CommandQueue();
  public context = new ContextManager();
  public focus = new FocusManager();
  public permission = new PermissionManager();
  public logger = new DebugLogger();

  // Maps: normalizedShortcut -> commandId
  private shortcutMap: Map<string, string> = new Map();

  constructor() {}

  /**
   * Registers a command definition, its default keybinding, and optional handler.
   */
  registerCommand(definition: CommandDefinition, handler?: CommandHandler): void {
    this.bus.registerCommand(definition);
    
    if (definition.defaultShortcut) {
      this.registerShortcut(definition.defaultShortcut, definition.id);
    }

    if (handler) {
      this.bus.registerHandler(definition.id, handler);
    }
  }

  /**
   * Binds a shortcut combination to a command ID.
   */
  registerShortcut(shortcut: string, commandId: string): void {
    if (!validateKeyCombo(shortcut)) {
      console.error(`Invalid shortcut combo pattern: "${shortcut}" for command "${commandId}"`);
      return;
    }
    const normalized = normalizeKeyCombo(shortcut);
    this.shortcutMap.set(normalized, commandId);
  }

  /**
   * Unbinds a shortcut.
   */
  unregisterShortcut(shortcut: string): void {
    const normalized = normalizeKeyCombo(shortcut);
    this.shortcutMap.delete(normalized);
  }

  /**
   * Returns a clean map of all active key combinations.
   */
  getShortcutMap(): Record<string, string> {
    const map: Record<string, string> = {};
    this.shortcutMap.forEach((cmdId, key) => {
      map[key] = cmdId;
    });
    return map;
  }

  /**
   * Evaluates constraints and dispatches a command to the execution queue.
   */
  async dispatch<R = any>(commandId: string, event?: any): Promise<R | undefined> {
    const cleanId = commandId.trim();
    const def = this.bus.getDefinition(cleanId);

    if (!def) {
      console.warn(`Command "${cleanId}" triggered but is not registered in the manifest.`);
      return undefined;
    }

    const contextStack = this.context.getStack();

    // 1. Context constraint check
    if (!this.context.isCommandActive(def.contexts)) {
      this.logger.log({
        commandId: cleanId,
        status: 'blocked_context',
        contextStack
      });
      return undefined;
    }

    // 2. Permission check
    if (!this.permission.canExecute(def)) {
      this.logger.log({
        commandId: cleanId,
        status: 'blocked_permission',
        contextStack
      });
      return undefined;
    }

    // 3. Handler check
    const handler = this.bus.getHandler(cleanId);
    if (!handler) {
      this.logger.log({
        commandId: cleanId,
        status: 'error',
        error: `No handler registered for command "${cleanId}"`,
        contextStack
      });
      console.warn(`Command "${cleanId}" triggered but has no active handler registered.`);
      return undefined;
    }

    // 4. Dispatch to queue
    const startTime = Date.now();
    try {
      const result = await this.queue.push<R>(
        cleanId,
        { event },
        handler,
        'drop-duplicate' // Default concurrency policy
      );

      this.logger.log({
        commandId: cleanId,
        status: 'success',
        latency: Date.now() - startTime,
        contextStack
      });

      return result;
    } catch (err: any) {
      this.logger.log({
        commandId: cleanId,
        status: 'error',
        error: err.message || String(err),
        latency: Date.now() - startTime,
        contextStack
      });
      throw err;
    }
  }

  /**
   * Window keydown event listener handler.
   */
  public handleKeyDown = (e: KeyboardEvent): void => {
    // Skip interception if the user is typing in a standard text input/textarea
    // UNLESS it is a special command shortcut (like Cmd+Shift+P Command Palette, Cmd+/ Help, or Esc)
    const target = e.target as HTMLElement;
    const isEditingText = 
      target && 
      (target.tagName === 'INPUT' || 
       target.tagName === 'TEXTAREA' || 
       target.isContentEditable);

    const combo = eventToKeyCombo(e);
    const commandId = this.shortcutMap.get(combo);

    if (!commandId) return;

    const def = this.bus.getDefinition(commandId);
    
    // If the user is typing and this is a standard character insert shortcut, let it pass.
    // However, if it's a structural command (has modifiers or is a function/nav key like Esc, enter, arrow keys), intercept it!
    if (isEditingText) {
      const isCmdPalette = commandId === 'system.command-palette';
      const isHelp = commandId === 'system.help-overlay';
      const isEsc = combo === 'esc';
      const isSave = combo === 'alt+s' || combo === 'ctrl+s';
      
      const shouldBypassTextInput = isCmdPalette || isHelp || isEsc || isSave;
      
      if (!shouldBypassTextInput) {
        return; // Let the browser handle standard text typing
      }
    }

    // Intercept default action
    e.preventDefault();
    e.stopPropagation();

    // Fire the command!
    this.dispatch(commandId, e).catch(err => {
      console.error(`Error executing shortcut command [${commandId}]:`, err);
    });
  };

  /**
   * Clean up listener and clear state.
   */
  destroy(): void {
    this.queue.clear();
    this.bus.clear();
    this.shortcutMap.clear();
    this.logger.clear();
  }
}
