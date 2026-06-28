// ============================================================
// SmartERP Commands — Central Manifest
// ============================================================

import { CommandDefinition } from '../keyboard/types';

export const GLOBAL_COMMANDS: CommandDefinition[] = [
  // ── System Operations ──────────────────────────────────────
  {
    id: 'system.command-palette',
    title: 'Command Palette',
    description: 'Search and run any active system command',
    category: 'System',
    defaultShortcut: 'Cmd+Shift+P',
    contexts: ['global'],
    permissions: [],
    keywords: ['search', 'find', 'run', 'palette', 'menu', 'commands']
  },
  {
    id: 'system.help-overlay',
    title: 'Keyboard Shortcuts Help',
    description: 'Display interactive keyboard shortcuts cheat sheet',
    category: 'System',
    defaultShortcut: 'Cmd+/',
    contexts: ['global'],
    permissions: [],
    keywords: ['help', 'shortcuts', 'keyboard', 'hotkeys', 'cheat']
  },

  // ── Navigation Operations ──────────────────────────────────
  {
    id: 'navigation.dashboard',
    title: 'Go to Dashboard',
    description: 'Navigate to the main application dashboard',
    category: 'Navigation',
    defaultShortcut: 'Alt+D',
    contexts: ['global'],
    permissions: [],
    keywords: ['home', 'dashboard', 'analytics', 'landing', 'main']
  },
  {
    id: 'navigation.ledgers',
    title: 'Go to Ledger Accounts',
    description: 'Navigate to the Chart of Accounts tree and ledger manager',
    category: 'Navigation',
    defaultShortcut: 'Alt+L',
    contexts: ['global'],
    permissions: [],
    keywords: ['ledgers', 'accounts', 'chart', 'finance', 'coa']
  },
  {
    id: 'navigation.customers',
    title: 'Go to Customers',
    description: 'Navigate to the Customers Sundry Debtors manager',
    category: 'Navigation',
    defaultShortcut: 'Alt+C',
    contexts: ['global'],
    permissions: [],
    keywords: ['customers', 'buyers', 'sundry debtors', 'clients']
  },
  {
    id: 'navigation.suppliers',
    title: 'Go to Suppliers',
    description: 'Navigate to the Suppliers Sundry Creditors manager',
    category: 'Navigation',
    defaultShortcut: 'Alt+V',
    contexts: ['global'],
    permissions: [],
    keywords: ['suppliers', 'vendors', 'sundry creditors', 'sellers']
  },
  {
    id: 'navigation.units',
    title: 'Go to Units of Measure',
    description: 'Navigate to the Units of Measure master manager',
    category: 'Navigation',
    defaultShortcut: 'Alt+U',
    contexts: ['global'],
    permissions: [],
    keywords: ['units', 'measurements', 'inventory', 'pcs', 'kg']
  },
  {
    id: 'navigation.tax-rates',
    title: 'Go to Tax Rates (GST)',
    description: 'Navigate to the GST Tax Slabs manager',
    category: 'Navigation',
    defaultShortcut: 'Alt+T',
    contexts: ['global'],
    permissions: [],
    keywords: ['tax', 'gst', 'rates', 'cgst', 'sgst', 'igst']
  },
  {
    id: 'navigation.stock-items',
    title: 'Go to Stock Items',
    description: 'Navigate to the Inventory items manager',
    category: 'Navigation',
    defaultShortcut: 'Alt+I',
    contexts: ['global'],
    permissions: [],
    keywords: ['stock', 'items', 'products', 'inventory', 'warehouse']
  },

  // ── Context-Aware Actions ──────────────────────────────────
  {
    id: 'form.save',
    title: 'Save Form',
    description: 'Save/Submit the current active form page or modal',
    category: 'Actions',
    defaultShortcut: 'Alt+S',
    contexts: ['editing', 'form:dirty'],
    permissions: [],
    keywords: ['save', 'submit', 'post', 'create', 'update', 'confirm']
  },
  {
    id: 'form.cancel',
    title: 'Cancel / Go Back',
    description: 'Close active modal or discard changes and return to list',
    category: 'Actions',
    defaultShortcut: 'esc',
    contexts: ['editing', 'modal:active'],
    permissions: [],
    keywords: ['cancel', 'close', 'escape', 'back', 'discard']
  }
];
