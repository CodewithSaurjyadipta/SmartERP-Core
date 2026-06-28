'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@smarterp/shared';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'bg-destructive' };
  if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-success' };
}

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const password = watch('password');
  const passwordStrength = useMemo(
    () => getPasswordStrength(password || ''),
    [password]
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, router]);

  // Auto-focus name field
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const onSubmit = async (data: RegisterInput) => {
    try {
      const response = await authService.register(data);
      setAuth(response.user, response.tokens);
      toast.success('Account created!', {
        description: `Welcome to SmartERP, ${response.user.fullName}`,
      });
      router.push(ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const message =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message || 'Registration failed'
          : 'An unexpected error occurred';
      toast.error('Registration failed', { description: message });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Create an account
        </h2>
        <p className="text-sm text-muted-foreground">
          Get started with SmartERP in seconds
        </p>
      </div>

      {/* Card with glassmorphism */}
      <div className="glass rounded-xl p-6 glow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('fullName')}
                ref={(e) => {
                  register('fullName').ref(e);
                  (nameRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                }}
                id="fullName"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                className={cn(
                  'pl-10 h-10 bg-background/50 border-border/60 transition-all duration-200',
                  'focus:bg-background focus:border-primary/50 focus:ring-primary/20',
                  errors.fullName && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
                )}
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('email')}
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

          {/* Phone (optional) */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                {...register('phone')}
                id="phone"
                type="tel"
                placeholder="9876543210"
                autoComplete="tel"
                className={cn(
                  'pl-10 h-10 bg-background/50 border-border/60 transition-all duration-200',
                  'focus:bg-background focus:border-primary/50 focus:ring-primary/20',
                  errors.phone && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20'
                )}
              />
            </div>
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
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
                placeholder="Create a strong password"
                autoComplete="new-password"
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

            {/* Password strength indicator */}
            {password && password.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex h-1.5 gap-1">
                  {[1, 2, 3, 4, 5, 6].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-full flex-1 rounded-full transition-all duration-300',
                        level <= passwordStrength.score
                          ? passwordStrength.color
                          : 'bg-border/40'
                      )}
                    />
                  ))}
                </div>
                <p
                  className={cn(
                    'text-xs font-medium transition-colors',
                    passwordStrength.score <= 2 && 'text-destructive',
                    passwordStrength.score > 2 && passwordStrength.score <= 4 && 'text-yellow-500',
                    passwordStrength.score > 4 && 'text-success'
                  )}
                >
                  {passwordStrength.label}
                </p>
              </div>
            )}

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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
      </div>

      {/* Separator + Login link */}
      <div className="flex flex-col gap-4">
        <Separator className="bg-border/40" />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
