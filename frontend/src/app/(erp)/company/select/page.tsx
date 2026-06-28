'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Building2, Plus, ArrowRight, Calendar, Landmark } from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/lib/constants';
import type { CompanyWithRole } from '@smarterp/shared';

export default function CompanySelectPage() {
  const router = useRouter();
  const { companies, setSelectedCompany } = useCompanyStore();

  const handleSelect = (company: CompanyWithRole) => {
    setSelectedCompany(company);
    router.replace(ROUTES.DASHBOARD);
  };

  return (
    <div className="mx-auto max-w-4xl py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Select Company
          </h1>
          <p className="text-muted-foreground">
            Choose a company to access your books and accounts
          </p>
        </div>
        <Button 
          onClick={() => router.push('/company/create')} 
          className="gap-2 self-start bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card className="border-dashed border-border bg-card/40 backdrop-blur-sm py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card p-2.5 shadow-md">
              <Image
                src="/logo.png"
                alt="SmartERP Logo"
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="space-y-2 max-w-md">
              <CardTitle className="text-xl">No companies found</CardTitle>
              <CardDescription>
                You aren't associated with any companies yet. Create your first company to start recording transactions and generating GST invoices.
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/company/create')} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {companies.map((company) => {
            const fyStart = new Date(company.financialYearStart).getFullYear();
            const fyEnd = fyStart + 1;
            
            return (
              <Card 
                key={company.id}
                onClick={() => handleSelect(company)}
                className="group border-border/60 bg-card/40 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div className="space-y-1.5 pr-4">
                    <CardTitle className="text-lg font-semibold leading-none group-hover:text-primary transition-colors">
                      {company.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono">
                      {company.legalName || company.name}
                    </CardDescription>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5" />
                    <span>GSTIN: <span className="font-mono text-foreground">{company.gstin || 'Unregistered'}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>F.Y.: <span className="font-mono text-foreground">{fyStart} - {fyEnd}</span></span>
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border/40 py-3 text-xs flex justify-between items-center text-muted-foreground bg-background/20 rounded-b-xl">
                  <span>Role: <span className="font-medium text-foreground">{company.role}</span></span>
                  <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    <span>Open Books</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
