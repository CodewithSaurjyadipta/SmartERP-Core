import { z } from 'zod';

// ============================================================
// Common / Reusable Schemas
// ============================================================

/** UUID v4 validation */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/** Standard pagination query params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

/** Date range filter */
export const dateRangeSchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
});

/** Indian GSTIN: 15-character alphanumeric */
export const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid GSTIN format'
  )
  .optional()
  .or(z.literal(''));

/** Indian PAN: 10-character alphanumeric */
export const panSchema = z
  .string()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
  .optional()
  .or(z.literal(''));

/** Indian phone number */
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Invalid 10-digit Indian phone number')
  .optional()
  .or(z.literal(''));

/** Indian pincode */
export const pincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit pincode')
  .optional()
  .or(z.literal(''));

/** Monetary amount: max 18 digits, 2 decimal places */
export const amountSchema = z.coerce
  .number()
  .multipleOf(0.01)
  .refine((val) => Math.abs(val) <= 9999999999999999.99, {
    message: 'Amount exceeds maximum allowed value',
  });

/** Positive quantity: max 18 digits, 3 decimal places */
export const quantitySchema = z.coerce.number().nonnegative();

/** Percentage: 0-100 with 2 decimal places */
export const percentageSchema = z.coerce.number().min(0).max(100);

export type PaginationParams = z.infer<typeof paginationSchema>;
export type DateRangeParams = z.infer<typeof dateRangeSchema>;
