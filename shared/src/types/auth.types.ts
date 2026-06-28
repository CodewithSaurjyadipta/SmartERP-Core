// ============================================================
// Authentication Types
// ============================================================

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface UserCompany {
  id: string;
  companyId: string;
  companyName: string;
  role: CompanyRole;
}

export type CompanyRole = 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
