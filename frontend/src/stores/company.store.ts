import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Company, CompanyWithRole } from '@smarterp/shared';

interface CompanyState {
  selectedCompany: Company | null;
  companies: CompanyWithRole[];
  setSelectedCompany: (company: Company | null) => void;
  setCompanies: (companies: CompanyWithRole[]) => void;
  clearCompany: () => void;
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      selectedCompany: null,
      companies: [],

      setSelectedCompany: (company) => set({ selectedCompany: company }),
      setCompanies: (companies) => set({ companies }),
      clearCompany: () => set({ selectedCompany: null }),
    }),
    {
      name: 'smarterp-company',
      partialize: (state) => ({
        selectedCompany: state.selectedCompany,
      }),
    }
  )
);
