import { Request } from 'express';

// ============================================================
// Auth Module Types
// ============================================================

/** JWT access-token payload */
export interface JwtPayload {
  id: string;
  email: string;
}

/** Express Request with authenticated user attached */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/** Database row shape for the `users` table */
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/** Database row shape for the `refresh_tokens` table */
export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
}
