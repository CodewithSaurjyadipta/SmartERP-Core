'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { KeyboardManager } from '@/lib/keyboard/keyboard-manager';
import { GLOBAL_COMMANDS } from '@/lib/commands/manifest';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

const KeyboardContext = createContext<KeyboardManager | null>(null);

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Create singleton instance of KeyboardManager inside useMemo so it survives re-renders
  const keyboardManager = useMemo(() => {
    const manager = new KeyboardManager();
    
    // Register all default global commands
    GLOBAL_COMMANDS.forEach(cmd => {
      manager.registerCommand(cmd);
    });

    // Register basic navigation command handlers
    manager.bus.registerHandler('navigation.dashboard', () => router.push(ROUTES.DASHBOARD));
    manager.bus.registerHandler('navigation.ledgers', () => router.push(ROUTES.LEDGERS));
    manager.bus.registerHandler('navigation.customers', () => router.push(ROUTES.CUSTOMERS));
    manager.bus.registerHandler('navigation.suppliers', () => router.push(ROUTES.SUPPLIERS));
    manager.bus.registerHandler('navigation.units', () => router.push(ROUTES.UNITS));
    manager.bus.registerHandler('navigation.tax-rates', () => router.push(ROUTES.TAX_RATES));
    manager.bus.registerHandler('navigation.stock-items', () => router.push(ROUTES.STOCK_ITEMS));

    return manager;
  }, [router]);

  // Set up root window keydown listener
  useEffect(() => {
    window.addEventListener('keydown', keyboardManager.handleKeyDown);
    return () => {
      window.removeEventListener('keydown', keyboardManager.handleKeyDown);
      keyboardManager.destroy();
    };
  }, [keyboardManager]);

  return (
    <KeyboardContext.Provider value={keyboardManager}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard(): KeyboardManager {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within a KeyboardProvider');
  }
  return context;
}
