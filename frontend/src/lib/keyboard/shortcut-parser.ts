// ============================================================
// SmartERP Keyboard Framework — Shortcut Parser
// ============================================================

import { normalizeKeyCombo } from './platform';

/**
 * Validates a key combination string representation.
 * Rules: Must end with a non-modifier key, and optionally contain modifiers.
 */
export function validateKeyCombo(combo: string): boolean {
  if (!combo || typeof combo !== 'string') return false;

  const parts = combo.split('+').map(p => p.trim());
  if (parts.length === 0 || parts.some(p => !p)) return false;

  const modifierList = ['ctrl', 'control', 'cmd', 'command', 'meta', 'alt', 'option', 'shift'];
  
  // Find all non-modifier keys
  const mainKeys = parts.filter(p => !modifierList.includes(p.toLowerCase()));
  
  // A valid combo must have exactly one main key
  return mainKeys.length === 1 && mainKeys[0] !== '';
}

interface ParsedShortcut {
  modifiers: string[];
  key: string;
  normalizedCombo: string;
}

/**
 * Parses a shortcut string into its structural modifiers and core key values.
 */
export function parseShortcut(combo: string): ParsedShortcut | null {
  if (!validateKeyCombo(combo)) return null;

  const normalizedCombo = normalizeKeyCombo(combo);
  const parts = normalizedCombo.split('+');
  
  const key = parts[parts.length - 1];
  const modifiers = parts.slice(0, -1);

  return {
    modifiers,
    key,
    normalizedCombo
  };
}
