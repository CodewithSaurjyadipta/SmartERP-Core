'use client';

import { useEffect, useState } from 'react';
import { Calendar, Building2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useCompanyStore } from '@/stores/company.store';
import { ledgerService } from '@/services/ledger.service';
import { customerService } from '@/services/customer.service';
import { supplierService } from '@/services/supplier.service';
import { stockItemService } from '@/services/stock-item.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { selectedCompany } = useCompanyStore();

  const [counts, setCounts] = useState({
    ledgers: 0,
    customers: 0,
    suppliers: 0,
    stockItems: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedCompany?.id) return;

    const loadCounts = async () => {
      setLoading(true);
      try {
        const [l, c, s, si] = await Promise.all([
          ledgerService.getLedgers(),
          customerService.getCustomers(),
          supplierService.getSuppliers(),
          stockItemService.getStockItems(),
        ]);
        setCounts({
          ledgers: l.length,
          customers: c.length,
          suppliers: s.length,
          stockItems: si.length,
        });
      } catch {
        // Silently swallow or display minimal error
      } finally {
        setLoading(false);
      }
    };

    loadCounts();
  }, [selectedCompany?.id]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Welcome section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {user?.fullName || 'User'}!
        </h1>
        <p className="text-muted-foreground text-sm">
          Active Company: <span className="font-semibold text-primary">{selectedCompany?.name || 'None selected'}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Date card */}
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{today}</p>
              <p className="text-xs text-muted-foreground">Current Date</p>
            </div>
          </CardContent>
        </Card>

        {/* Company context card */}
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selectedCompany?.baseCurrency || 'INR'} — GST Enabled</p>
              <p className="text-xs text-muted-foreground">Base Currency & Tax Settings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Data summary card */}
      <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Master Data Summary</CardTitle>
              <CardDescription>
                Manage ledger accounts, clients, suppliers, and inventory for {selectedCompany?.name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Ledger Accounts', desc: `${counts.ledgers} active accounts configured`, href: '/masters/ledgers' },
              { title: 'Customer Management', desc: `${counts.customers} registered buyers (Sundry Debtors)`, href: '/masters/customers' },
              { title: 'Supplier Management', desc: `${counts.suppliers} active vendors (Sundry Creditors)`, href: '/masters/suppliers' },
              { title: 'Inventory Masters', desc: `${counts.stockItems} stock item profiles tracked`, href: '/masters/stock-items' },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-start gap-3 rounded-lg border border-border/40 bg-background/20 p-4 transition-all duration-200 hover:border-primary/30 hover:bg-background/40"
              >
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary/60 transition-transform group-hover:translate-x-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    {item.title}
                    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
