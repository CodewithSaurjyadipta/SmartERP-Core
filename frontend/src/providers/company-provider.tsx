'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCompanyStore } from '@/stores/company.store';
import { useAuthStore } from '@/stores/auth.store';
import { companyService } from '@/services/company.service';
import { ROUTES } from '@/lib/constants';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ============================================================
// Company Context Provider & Route Guard
// ============================================================

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const { setCompanies, selectedCompany, setSelectedCompany } = useCompanyStore();

  const loadCompanies = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await companyService.getCompanies();
      setCompanies(data);

      // If a company was previously selected, check if it's still in the user's list
      if (selectedCompany) {
        const stillExists = data.find((c) => c.id === selectedCompany.id);
        if (!stillExists) {
          // If it was deleted or user lost access, clear it
          setSelectedCompany(null);
        } else {
          // Keep it updated with latest name/details
          setSelectedCompany(stillExists);
        }
      }
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedCompany, setCompanies, setSelectedCompany]);

  useEffect(() => {
    loadCompanies();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading company profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function CompanyGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCompany } = useCompanyStore();
  const { user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Only guard if the user is authenticated
    if (!user) {
      setIsChecking(false);
      return;
    }

    const isSelectOrCreate =
      pathname === '/company/select' || pathname === '/company/create';

    if (!selectedCompany && !isSelectOrCreate) {
      // Boot out to select company if none is active
      router.replace(ROUTES.COMPANY_SELECT);
    } else {
      setIsChecking(false);
    }
  }, [selectedCompany, user, pathname, router]);

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying company context...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
