// ============================================================
// SmartERP Keyboard Framework — Command Queue
// ============================================================

import { QueueItem, CommandPayload, CommandHandler, ConcurrencyPolicy } from './types';

export class CommandQueue {
  private queue: QueueItem[] = [];
  private activeCommandIds: Set<string> = new Set();
  private isProcessing: boolean = false;

  constructor() {}

  /**
   * Pushes a command task onto the serial execution queue.
   * Enforces concurrency policies to prevent double-submits or race conditions.
   */
  push<R = any>(
    commandId: string,
    payload: CommandPayload,
    handler: CommandHandler,
    policy: ConcurrencyPolicy
  ): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      // 1. Enforce drop-duplicate policy
      if (policy === 'drop-duplicate' && this.activeCommandIds.has(commandId)) {
        reject(new Error(`Command ${commandId} execution blocked: duplicate request dropped.`));
        return;
      }

      // 2. Enforce cancel-previous policy (remove matching items waiting in queue)
      if (policy === 'cancel-previous') {
        this.queue = this.queue.filter(item => {
          if (item.commandId === commandId) {
            item.deferred.reject(new Error(`Command ${commandId} execution cancelled by new request.`));
            return false;
          }
          return true;
        });
      }

      const queueItem: QueueItem = {
        commandId,
        payload,
        handler,
        policy,
        deferred: { resolve, reject }
      };

      this.queue.push(queueItem);
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const item = this.queue.shift()!;
    this.activeCommandIds.add(item.commandId);

    try {
      const result = await Promise.resolve(item.handler(item.payload));
      item.deferred.resolve(result);
    } catch (err) {
      item.deferred.reject(err);
    } finally {
      this.activeCommandIds.delete(item.commandId);
      this.isProcessing = false;
      // Loop to process next item
      this.process();
    }
  }

  /**
   * Clears all pending items in the queue.
   */
  clear(): void {
    this.queue.forEach(item => {
      item.deferred.reject(new Error('Queue cleared.'));
    });
    this.queue = [];
    this.activeCommandIds.clear();
    this.isProcessing = false;
  }
}
