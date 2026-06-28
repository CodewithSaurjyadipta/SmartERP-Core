import { create } from 'zustand';
import { ledgerGroupService } from '@/services/ledger-group.service';
import { stockGroupService } from '@/services/stock-group.service';
import { unitService } from '@/services/unit.service';
import { taxRateService } from '@/services/tax-rate.service';
import type {
  LedgerGroup,
  LedgerGroupNode,
  StockGroup,
  StockGroupNode,
  Unit,
  TaxRate,
} from '@smarterp/shared';

// ============================================================
// Masters Zustand Store
// ============================================================

interface MastersState {
  // Data lists
  ledgerGroups: LedgerGroup[];
  ledgerGroupsTree: LedgerGroupNode[];
  stockGroups: StockGroup[];
  stockGroupsTree: StockGroupNode[];
  units: Unit[];
  taxRates: TaxRate[];

  // Loading states
  loadingLedgerGroups: boolean;
  loadingStockGroups: boolean;
  loadingUnits: boolean;
  loadingTaxRates: boolean;

  // Fetch actions
  fetchLedgerGroups: () => Promise<void>;
  fetchStockGroups: () => Promise<void>;
  fetchUnits: () => Promise<void>;
  fetchTaxRates: () => Promise<void>;
  fetchAllMasters: () => Promise<void>;
}

export const useMastersStore = create<MastersState>((set, get) => ({
  ledgerGroups: [],
  ledgerGroupsTree: [],
  stockGroups: [],
  stockGroupsTree: [],
  units: [],
  taxRates: [],

  loadingLedgerGroups: false,
  loadingStockGroups: false,
  loadingUnits: false,
  loadingTaxRates: false,

  fetchLedgerGroups: async () => {
    if (get().loadingLedgerGroups) return;
    set({ loadingLedgerGroups: true });
    try {
      const [list, tree] = await Promise.all([
        ledgerGroupService.getGroups(),
        ledgerGroupService.getGroupsTree(),
      ]);
      set({ ledgerGroups: list, ledgerGroupsTree: tree });
    } catch (error) {
      console.error('Failed to fetch ledger groups:', error);
    } finally {
      set({ loadingLedgerGroups: false });
    }
  },

  fetchStockGroups: async () => {
    if (get().loadingStockGroups) return;
    set({ loadingStockGroups: true });
    try {
      const [list, tree] = await Promise.all([
        stockGroupService.getStockGroups(),
        stockGroupService.getStockGroupsTree(),
      ]);
      set({ stockGroups: list, stockGroupsTree: tree });
    } catch (error) {
      console.error('Failed to fetch stock groups:', error);
    } finally {
      set({ loadingStockGroups: false });
    }
  },

  fetchUnits: async () => {
    if (get().loadingUnits) return;
    set({ loadingUnits: true });
    try {
      const list = await unitService.getUnits();
      set({ units: list });
    } catch (error) {
      console.error('Failed to fetch units:', error);
    } finally {
      set({ loadingUnits: false });
    }
  },

  fetchTaxRates: async () => {
    if (get().loadingTaxRates) return;
    set({ loadingTaxRates: true });
    try {
      const list = await taxRateService.getTaxRates();
      set({ taxRates: list });
    } catch (error) {
      console.error('Failed to fetch tax rates:', error);
    } finally {
      set({ loadingTaxRates: false });
    }
  },

  fetchAllMasters: async () => {
    await Promise.all([
      get().fetchLedgerGroups(),
      get().fetchStockGroups(),
      get().fetchUnits(),
      get().fetchTaxRates(),
    ]);
  },
}));
