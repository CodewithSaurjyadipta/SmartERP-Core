'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/lib/constants';

export default function HomePage() {
  const router = useRouter();
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (accessToken && user) {
      router.replace(ROUTES.DASHBOARD);
    } else {
      router.replace(ROUTES.LOGIN);
    }
  }, [accessToken, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
