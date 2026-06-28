'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronsUpDown, Plus, Settings, ListCollapse, Check } from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function CompanySwitcher() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { selectedCompany, companies, setSelectedCompany } = useCompanyStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = (company: any) => {
    setSelectedCompany(company);
    setIsOpen(false);
    // Hard reload ensures all queries are refetched with the new X-Company-Id context
    window.location.href = '/dashboard';
  };

  if (!selectedCompany) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 items-center justify-between gap-2 border border-border/40 bg-card/20 px-3 hover:bg-card/40 hover:text-foreground text-sm font-medium focus-visible:ring-1 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2 text-left">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="max-w-[120px] truncate">{selectedCompany.name}</span>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 z-50 w-56 rounded-lg border border-border/60 bg-card/90 backdrop-blur-md p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Switch Company
          </div>
          
          <div className="max-h-[160px] overflow-y-auto space-y-0.5">
            {companies.map((company) => {
              const isSelected = company.id === selectedCompany.id;
              return (
                <button
                  key={company.id}
                  onClick={() => handleSwitch(company)}
                  disabled={isSelected}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-90 ${
                    isSelected ? 'text-primary bg-primary/5' : 'text-muted-foreground'
                  }`}
                >
                  <span className="truncate pr-2">{company.name}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>

          <Separator className="my-1 border-border/40" />
          
          <div className="p-0.5 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/company/settings');
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Settings className="h-3.5 w-3.5" />
              Company Settings
            </button>
            
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/company/select');
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <ListCollapse className="h-3.5 w-3.5" />
              Manage Companies
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/company/create');
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Company
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
