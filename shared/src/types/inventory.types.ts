// ============================================================
// Inventory & Product Type Definitions
// ============================================================

export interface Unit {
  id: string;
  companyId: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  companyId: string;
  name: string;
  hsnSacCode: string | null;
  taxType: 'GST' | 'EXEMPT' | 'NIL';
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  isActive: boolean;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockGroup {
  id: string;
  companyId: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StockGroupNode extends StockGroup {
  children: StockGroupNode[];
}

export interface StockItem {
  id: string;
  companyId: string;
  name: string;
  stockGroupId: string | null;
  unitId: string | null;
  taxRateId: string | null;
  hsnCode: string | null;
  
  // Opening stock values
  openingQty: number;
  openingRate: number;
  openingValue: number;
  
  // Pricing bounds
  standardSellingPrice: number | null;
  standardPurchasePrice: number | null;
  mrp: number | null;
  
  // Replenishment alerts
  reorderLevel: number;
  minimumQty: number;
  
  // Audit & Soft Delete
  isActive: boolean;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
