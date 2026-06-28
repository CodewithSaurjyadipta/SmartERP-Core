// ============================================================
// SmartERP Commands — Custom Keybinding Overrides
// ============================================================

import { Keybinding } from '../keyboard/types';

/**
 * Custom shortcut overrides mapping keys to command IDs.
 * These override the defaultShortcut defined in manifest.ts.
 */
export const CUSTOM_SHORTCUT_OVERRIDES: Keybinding[] = [
  // E.g. To override the save command to Ctrl+Enter in the future:
  // { commandId: 'form.save', keyCombo: 'ctrl+enter', context: 'editing' }
];
