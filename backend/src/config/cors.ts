import { CorsOptions } from 'cors';
import { env } from './env';

// ============================================================
// CORS Configuration
// ============================================================

export const corsOptions: CorsOptions = {
  origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-Id'],
  exposedHeaders: ['X-Total-Count'],
  credentials: true,
  maxAge: 86400, // 24 hours
};
