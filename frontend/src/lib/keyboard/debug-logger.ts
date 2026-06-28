// ============================================================
// SmartERP Keyboard Framework — Debug Logger
// ============================================================

import { TelemetryLog } from './types';

export class DebugLogger {
  private logs: TelemetryLog[] = [];
  private maxLogs: number = 50;
  private listeners: Set<(logs: TelemetryLog[]) => void> = new Set();

  constructor() {}

  /**
   * Logs a command execution lifecycle trace.
   */
  log(entry: Omit<TelemetryLog, 'timestamp'>): void {
    const fullLog: TelemetryLog = {
      ...entry,
      timestamp: Date.now()
    };

    this.logs.unshift(fullLog); // Add to beginning (latest first)
    
    if (this.logs.length > this.maxLogs) {
      this.logs.pop(); // Evict oldest
    }

    this.notify();
  }

  /**
   * Returns a copy of active telemetry traces.
   */
  getLogs(): TelemetryLog[] {
    return [...this.logs];
  }

  /**
   * Subscribes to new logging events (e.g. for debug panels).
   */
  subscribe(listener: (logs: TelemetryLog[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentLogs = this.getLogs();
    this.listeners.forEach(listener => {
      try {
        listener(currentLogs);
      } catch (err) {
        console.error('Error in debug log listener:', err);
      }
    });
  }

  clear(): void {
    this.logs = [];
    this.notify();
  }
}
