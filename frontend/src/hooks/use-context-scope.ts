'use client';

import { useEffect } from 'react';
import { useKeyboard } from '@/providers/keyboard-provider';

/**
 * React hook to automatically register one or more context scopes on mount,
 * and unregister them when the component unmounts.
 */
export function useContextScope(context: string | string[]): void {
  const keyboard = useKeyboard();

  useEffect(() => {
    const contexts = Array.isArray(context) ? context : [context];
    
    // Push context scopes onto stack
    contexts.forEach(c => keyboard.context.push(c));
    
    // Pop context scopes off stack on unmount
    return () => {
      contexts.forEach(c => keyboard.context.pop(c));
    };
  }, [keyboard, context]);
}
