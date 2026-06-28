'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  LogOut, 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Truck, 
  Scale, 
  Percent, 
  FolderOpen, 
  Package,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { AuthGuard } from '@/providers/auth-provider';
import { CompanyProvider, CompanyGuard } from '@/providers/company-provider';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CompanySwitcher from '@/components/layout/company-switcher';

// ============================================================
// ERP Workspace Layout
// ============================================================

function ErpHeader() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Logout even if the API call fails
    } finally {
      clearAuth();
      toast.success('Signed out successfully');
      router.replace(ROUTES.LOGIN);
    }
  };

  const handleThemeToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = theme === 'dark';
    
    // Fallback for browsers that don't support the View Transitions API
    if (!document.startViewTransition) {
      setTheme(isDark ? 'light' : 'dark');
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme(isDark ? 'light' : 'dark');
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 900,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/85 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left header segment */}
        <div className="flex items-center gap-4">
          <CompanySwitcher />
        </div>

        {/* User profile & sign out */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-foreground">
              {user?.fullName || 'User'}
            </span>
            <span className="text-xs text-muted-foreground">
              {user?.email}
            </span>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleThemeToggle}
            className="text-muted-foreground hover:text-foreground transition-all duration-200"
            title="Toggle theme"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function ErpSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { type: 'header', label: 'Accounting Masters' },
    { label: 'Ledger Accounts', href: '/masters/ledgers', icon: BookOpen },
    { label: 'Customers', href: '/masters/customers', icon: Users },
    { label: 'Suppliers', href: '/masters/suppliers', icon: Truck },
    { type: 'header', label: 'Inventory Masters' },
    { label: 'Stock Items', href: '/masters/stock-items', icon: Package },
    { label: 'Stock Groups', href: '/masters/stock-groups', icon: FolderOpen },
    { label: 'Units of Measure', href: '/masters/units', icon: Scale },
    { label: 'GST Tax Rates', href: '/masters/tax-rates', icon: Percent },
  ];

  return (
    <aside className="w-64 border-r border-border/60 bg-card/40 backdrop-blur-md flex flex-col h-screen sticky top-0">
      {/* Brand logo section */}
      <div className="flex h-14 items-center px-6 border-b border-border/60">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card overflow-hidden shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              fill
              className="object-cover scale-125"
            />
          </div>
          <span className="text-2xl font-normal font-logo text-foreground select-none">
            Smart<span className="text-black dark:text-black font-logo">Erp</span>
          </span>
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-thin">
        {navItems.map((item, idx) => {
          if (item.type === 'header') {
            return (
              <div
                key={idx}
                className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80"
              >
                {item.label}
              </div>
            );
          }

          const Icon = item.icon!;
          const isActive = pathname === item.href || pathname?.startsWith(item.href! + '/');

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary/10 text-primary border-l-2 border-primary pl-2.5'
                  : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function ErpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <CompanyProvider>
        <CompanyGuard>
          <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <ErpSidebar />

            {/* Main content viewport */}
            <div className="flex-1 flex flex-col">
              <ErpHeader />
              <main className="flex-1 p-6 overflow-y-auto">{children}</main>
            </div>
          </div>
        </CompanyGuard>
      </CompanyProvider>
    </AuthGuard>
  );
}
