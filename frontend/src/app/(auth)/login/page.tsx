'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@smarterp/shared';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  // Auto-focus email field
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await authService.login(data);
      setAuth(response.user, response.tokens);
      toast.success('Welcome back!', {
        description: `Signed in as ${response.user.fullName}`,
      });
      router.push(ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Login failed'
          : 'An unexpected error occurred';
      toast.error('Login failed', { description: message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your SmartERP account
        </p>
      </div>

      {/* Card with glassmorphism */}
      <div className="glass rounded-xl p-6 glow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('email')}
                ref={(e) => {
                  register('email').ref(e);
                  (emailRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }}
                id="email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className={cn(
                  'pl-10 h-10 bg-background/50 border-border/60 transition-all duration-200',
                  'focus:bg-background focus:border-primary/50 focus:ring-primary/20',
                  errors.email && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
                )}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                className={cn(
                  'pl-10 pr-10 h-10 bg-background/50 border-border/60 transition-all duration-200',
                  'focus:bg-background focus:border-primary/50 focus:ring-primary/20',
                  errors.password && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'h-10 w-full font-medium transition-all duration-200',
              'bg-primary hover:bg-primary/90 active:scale-[0.98]',
              isSubmitting && 'opacity-80'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </div>

      {/* Separator + Register link */}
      <div className="flex flex-col gap-4">
        <Separator className="bg-border/40" />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href={ROUTES.REGISTER}
            className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
