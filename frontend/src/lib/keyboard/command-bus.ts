// ============================================================
// SmartERP Keyboard Framework — Command Bus
// ============================================================

import { CommandDefinition, CommandHandler } from './types';

export class CommandBus {
  private definitions: Map<string, CommandDefinition> = new Map();
  private handlers: Map<string, CommandHandler> = new Map();

  constructor() {}

  /**
   * Registers a command definition.
   */
  registerCommand(definition: CommandDefinition): void {
    const cleanId = definition.id.trim();
    if (this.definitions.has(cleanId)) {
      console.warn(`Command definition for ${cleanId} already exists. Overwriting.`);
    }
    this.definitions.set(cleanId, definition);
  }

  /**
   * Registers an execution callback handler for a command.
   */
  registerHandler(commandId: string, handler: CommandHandler): void {
    const cleanId = commandId.trim();
    this.handlers.set(cleanId, handler);
  }

  /**
   * Unregisters an execution callback handler.
   */
  unregisterHandler(commandId: string): void {
    const cleanId = commandId.trim();
    this.handlers.delete(cleanId);
  }

  /**
   * Retrieves a command definition.
   */
  getDefinition(commandId: string): CommandDefinition | undefined {
    return this.definitions.get(commandId.trim());
  }

  /**
   * Retrieves an execution callback handler.
   */
  getHandler(commandId: string): CommandHandler | undefined {
    return this.handlers.get(commandId.trim());
  }

  /**
   * Returns all registered command definitions.
   */
  getDefinitions(): CommandDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Resets the registry (primarily for testing).
   */
  clear(): void {
    this.definitions.clear();
    this.handlers.clear();
  }
}
