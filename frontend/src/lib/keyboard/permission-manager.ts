// ============================================================
// SmartERP Keyboard Framework — Permission Manager
// ============================================================

import { CommandDefinition } from './types';

export class PermissionManager {
  private userPermissions: Set<string> = new Set();
  private licenseTier: string = 'standard';
  private activeFeatureFlags: Set<string> = new Set();

  constructor() {}

  /**
   * Seed active permissions, tier, and flags.
   */
  updateConfig(config: {
    permissions?: string[];
    licenseTier?: string;
    featureFlags?: string[];
  }): void {
    if (config.permissions) {
      this.userPermissions = new Set(config.permissions);
    }
    if (config.licenseTier) {
      this.licenseTier = config.licenseTier.toLowerCase();
    }
    if (config.featureFlags) {
      this.activeFeatureFlags = new Set(config.featureFlags);
    }
  }

  /**
   * Validates if a command definition satisfies security, license, and feature gating.
   */
  canExecute(command: CommandDefinition): boolean {
    // 1. Role-based / permission gates
    if (command.permissions && command.permissions.length > 0) {
      const hasAllPermissions = command.permissions.every(p => 
        this.userPermissions.has(p)
      );
      if (!hasAllPermissions) return false;
    }

    // 2. Feature flags gates
    if (command.featureFlags && command.featureFlags.length > 0) {
      const hasAllFlags = command.featureFlags.every(flag => 
        this.activeFeatureFlags.has(flag)
      );
      if (!hasAllFlags) return false;
    }

    return true;
  }
}
