'use client';

import { useEffect, useRef } from 'react';
import { useKeyboard } from '@/providers/keyboard-provider';
import { CommandHandler } from '@/lib/keyboard/types';

/**
 * Declares a handler callback for a specific command ID.
 * Automatically handles registration and lifecycle cleanup.
 */
export function useCommand(commandId: string, handler: CommandHandler): void {
  const keyboard = useKeyboard();
  // Keep a stable ref of the handler callback to avoid re-registration on state updates
  const handlerRef = useRef<CommandHandler>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const cleanId = commandId.trim();
    
    // Wrapper handler that executes the latest ref reference
    const wrapperHandler: CommandHandler = (payload) => {
      return handlerRef.current(payload);
    };

    keyboard.bus.registerHandler(cleanId, wrapperHandler);

    return () => {
      keyboard.bus.unregisterHandler(cleanId);
    };
  }, [keyboard, commandId]);
}

/**
 * Binds a direct key combination shortcut to a callback handler.
 * Creates a dynamic local command definition.
 */
export function useShortcut(
  shortcut: string,
  handler: CommandHandler,
  allowedContexts: string[] = ['global']
): void {
  const keyboard = useKeyboard();
  const handlerRef = useRef<CommandHandler>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // Generate a unique dynamic command ID
    const uniqueCommandId = `dynamic.shortcut.${shortcut.replace(/\+/g, '-')}.${Math.random().toString(36).substr(2, 9)}`;

    // 1. Register the command definition
    keyboard.registerCommand({
      id: uniqueCommandId,
      title: `Shortcut: ${shortcut}`,
      description: 'Dynamic contextual user binding',
      category: 'Dynamic',
      defaultShortcut: shortcut,
      contexts: allowedContexts,
      permissions: []
    });

    // 2. Register the callback handler
    const wrapperHandler: CommandHandler = (payload) => {
      return handlerRef.current(payload);
    };
    keyboard.bus.registerHandler(uniqueCommandId, wrapperHandler);

    // 3. Clean up both shortcut binding and handler registration on unmount
    return () => {
      keyboard.unregisterShortcut(shortcut);
      keyboard.bus.unregisterHandler(uniqueCommandId);
    };
  }, [keyboard, shortcut, allowedContexts]);
}
