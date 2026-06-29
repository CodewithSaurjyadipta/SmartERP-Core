import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { corsOptions } from './config/cors';
import { requestLogger } from './middleware/request-logger.middleware';
import { apiLimiter } from './middleware/rate-limiter.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import authRoutes from './modules/auth/auth.routes';
import companyRoutes from './modules/company/company.routes';
import ledgerGroupRoutes from './modules/ledger-group/ledger-group.routes';
import ledgerRoutes from './modules/ledger/ledger.routes';
import customerRoutes from './modules/customer/customer.routes';
import supplierRoutes from './modules/supplier/supplier.routes';
import unitRoutes from './modules/unit/unit.routes';
import taxRateRoutes from './modules/tax-rate/tax-rate.routes';
import stockGroupRoutes from './modules/stock-group/stock-group.routes';
import stockItemRoutes from './modules/stock-item/stock-item.routes';
import voucherRoutes from './modules/voucher/voucher.routes';

// ============================================================
// Express Application Setup
// ============================================================

const app = express();

// ── Security & Parsing Middleware ─────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────
app.use(requestLogger);

// ── Rate Limiting (applied to all /api/v1 routes) ─────────
app.use('/api/v1', apiLimiter);

// ── API Routes ────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/ledger-groups', ledgerGroupRoutes);
app.use('/api/v1/ledgers', ledgerRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/tax-rates', taxRateRoutes);
app.use('/api/v1/stock-groups', stockGroupRoutes);
app.use('/api/v1/stock-items', stockItemRoutes);
app.use('/api/v1/vouchers', voucherRoutes);

// ── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Error Handler (must be last) ───────────────────
app.use(errorHandler);

export default app;
