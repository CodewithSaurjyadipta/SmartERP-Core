import { db } from '../../config/db';
import type { UserRow, RefreshTokenRow } from './auth.types';

// ============================================================
// Auth Repository — Database access layer
// ============================================================

export const authRepository = {
  // ── Users ──────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<UserRow | null> {
    const user = await db<UserRow>('users').where({ email }).first();
    return user ?? null;
  },

  async findUserById(id: string): Promise<UserRow | null> {
    const user = await db<UserRow>('users').where({ id }).first();
    return user ?? null;
  },

  async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
  }): Promise<UserRow> {
    const [user] = await db<UserRow>('users')
      .insert({
        email: data.email,
        password_hash: data.passwordHash,
        full_name: data.fullName,
        phone: data.phone ?? null,
      })
      .returning('*');
    return user;
  },

  // ── Refresh Tokens ────────────────────────────────────

  async createRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<void> {
    await db<RefreshTokenRow>('refresh_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });
  },

  async findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
    const token = await db<RefreshTokenRow>('refresh_tokens')
      .where({ token_hash: tokenHash })
      .first();
    return token ?? null;
  },

  async revokeRefreshToken(id: string): Promise<void> {
    await db<RefreshTokenRow>('refresh_tokens')
      .where({ id })
      .update({ revoked_at: new Date() });
  },

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db<RefreshTokenRow>('refresh_tokens')
      .where({ user_id: userId })
      .whereNull('revoked_at')
      .update({ revoked_at: new Date() });
  },
};
