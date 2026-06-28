// ============================================================
// SmartERP Keyboard Framework — Core Types
// ============================================================

export interface CommandDefinition {
  id: string;                  // Reverse-DNS notation (e.g. 'navigation.dashboard', 'ledger.save')
  title: string;               // Display title
  description: string;         // Descriptive purpose
  category: string;            // Categorization group (e.g. 'Navigation', 'System', 'Accounting')
  icon?: string;               // Optional Lucide icon name string
  defaultShortcut?: string;    // Normal key combo string (e.g. 'Alt+S', 'Cmd+Shift+P')
  contexts: string[];          // List of allowed contexts (e.g. ['global', 'masters:ledgers'])
  permissions: string[];       // Required authorization permissions (e.g. ['ledger:create'])
  featureFlags?: string[];     // Gating flags
  keywords?: string[];         // Search keywords for fuzzy command palette matching
  telemetryId?: string;        // Metrics analytics ID
}

export interface Keybinding {
  commandId: string;           // Maps to CommandDefinition.id
  keyCombo: string;            // Normalized key shortcut representation (e.g. 'alt+s')
  context?: string;            // Specific context scope where this binding overrides
}

export type ConcurrencyPolicy = 'drop-duplicate' | 'enqueue' | 'cancel-previous';

export interface CommandPayload<P = any> {
  payload?: P;
  event?: any;                 // Original event context (e.g. MouseEvent, KeyboardEvent)
}

export interface CommandHandler<P = any, R = any> {
  (payload: CommandPayload<P>): Promise<R> | R;
}

export interface QueueItem {
  commandId: string;
  payload: CommandPayload;
  handler: CommandHandler;
  policy: ConcurrencyPolicy;
  deferred: {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  };
}

export interface TelemetryLog {
  timestamp: number;
  commandId: string;
  status: 'success' | 'blocked_permission' | 'blocked_context' | 'error';
  latency?: number;
  error?: string;
  contextStack: string[];
}
