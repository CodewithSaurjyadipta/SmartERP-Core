// ============================================================
// SmartERP Keyboard Framework — Platform Abstraction
// ============================================================

export function isMac(): boolean {
  if (typeof window !== 'undefined') {
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || '');
  }
  if (typeof process !== 'undefined') {
    return process.platform === 'darwin';
  }
  return false;
}

/**
 * Normalizes a key combination string to lowercase and standard modifier ordering.
 * Standard ordering: cmd/ctrl -> alt/option -> shift -> key
 * E.g. "Shift+Cmd+P" -> "cmd+shift+p" (on Mac)
 * E.g. "Shift+Cmd+P" -> "ctrl+shift+p" (on Windows/Linux)
 */
export function normalizeKeyCombo(combo: string): string {
  const parts = combo.toLowerCase().split('+').map(p => p.trim());
  const normalizedParts: string[] = [];
  
  const hasCmd = parts.includes('cmd') || parts.includes('command') || parts.includes('meta');
  const hasCtrl = parts.includes('ctrl') || parts.includes('control');
  const hasAlt = parts.includes('alt') || parts.includes('option');
  const hasShift = parts.includes('shift');

  const mac = isMac();

  // Map modifiers based on platform
  if (mac) {
    if (hasCmd) normalizedParts.push('cmd');
    if (hasCtrl) normalizedParts.push('ctrl');
    if (hasAlt) normalizedParts.push('alt');
  } else {
    // On Windows/Linux, treat Cmd/Meta requests as Ctrl mappings
    if (hasCtrl || hasCmd) normalizedParts.push('ctrl');
    if (hasAlt) normalizedParts.push('alt');
  }
  if (hasShift) normalizedParts.push('shift');

  // Extract the main key
  const modifierKeys = ['cmd', 'command', 'meta', 'ctrl', 'control', 'alt', 'option', 'shift'];
  const mainKey = parts.find(p => !modifierKeys.includes(p)) || '';
  if (mainKey) {
    normalizedParts.push(mainKey);
  }

  return normalizedParts.join('+');
}

/**
 * Translates a browser KeyboardEvent into a normalized key combo string.
 * Uses event property state to guarantee modifier mapping.
 */
export function eventToKeyCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  const mac = isMac();

  // Resolve platform modifier keys
  if (mac) {
    if (e.metaKey) parts.push('cmd');
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
  } else {
    // On Windows/Linux, e.metaKey or e.ctrlKey map to ctrl
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
  }
  if (e.shiftKey) parts.push('shift');

  // Handle standard key naming normalization
  let key = e.key.toLowerCase();
  
  // Normalize whitespace representation
  if (key === ' ') {
    key = 'space';
  } else if (key === 'escape') {
    key = 'esc';
  } else if (key === 'arrowup') {
    key = 'up';
  } else if (key === 'arrowdown') {
    key = 'down';
  } else if (key === 'arrowleft') {
    key = 'left';
  } else if (key === 'arrowright') {
    key = 'right';
  }

  // Prevent listing modifier keys as the main key
  const modifiers = ['control', 'meta', 'alt', 'shift'];
  if (!modifiers.includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
}
