export const APP_NAME = 'SmartERP';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COMPANY_SELECT: '/company/select',
  LEDGERS: '/masters/ledgers',
  CUSTOMERS: '/masters/customers',
  SUPPLIERS: '/masters/suppliers',
  STOCK_ITEMS: '/masters/stock-items',
  STOCK_GROUPS: '/masters/stock-groups',
  UNITS: '/masters/units',
  TAX_RATES: '/masters/tax-rates',
} as const;
