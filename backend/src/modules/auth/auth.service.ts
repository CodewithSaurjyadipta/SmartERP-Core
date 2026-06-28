import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { ApiError } from '../../utils/api-error';
import { authRepository } from './auth.repository';
import type { JwtPayload, UserRow } from './auth.types';
import type { RegisterInput, LoginInput } from '@smarterp/shared';
import type { User, AuthTokens, AuthResponse } from '@smarterp/shared';

// ============================================================
// Auth Service — Business Logic
// ============================================================

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

// ── Private Helpers ────────────────────────────────────────

function generateAccessToken(id: string, email: string): string {
  return jwt.sign({ id, email } satisfies JwtPayload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function toUserResponse(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function generateTokens(
  userId: string,
  email: string
): Promise<AuthTokens> {
  const accessToken = generateAccessToken(userId, email);
  const refreshToken = generateRefreshToken();

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await authRepository.createRefreshToken(userId, tokenHash, expiresAt);

  return { accessToken, refreshToken };
}

// ── Public Service Methods ─────────────────────────────────

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw ApiError.conflict('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await authRepository.createUser({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone || undefined,
    });

    const tokens = await generateTokens(user.id, user.email);

    return { user: toUserResponse(user), tokens };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.is_active) {
      throw ApiError.forbidden('Account has been deactivated');
    }

    const isMatch = await bcrypt.compare(input.password, user.password_hash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = await generateTokens(user.id, user.email);

    return { user: toUserResponse(user), tokens };
  },

  async refreshToken(
    token: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashToken(token);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    if (storedToken.revoked_at) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    if (new Date() > storedToken.expires_at) {
      throw ApiError.unauthorized('Refresh token has expired');
    }

    // Revoke the old token (rotation)
    await authRepository.revokeRefreshToken(storedToken.id);

    // Look up the user to get their email for the new access token
    const user = await authRepository.findUserById(storedToken.user_id);
    if (!user || !user.is_active) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    const tokens = await generateTokens(user.id, user.email);
    return tokens;
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (storedToken && !storedToken.revoked_at) {
      await authRepository.revokeRefreshToken(storedToken.id);
    }
  },

  async getProfile(userId: string): Promise<User> {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return toUserResponse(user);
  },
};
