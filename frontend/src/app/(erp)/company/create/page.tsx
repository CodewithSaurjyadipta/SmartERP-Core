'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ArrowLeft, Loader2, Save, FileText, MapPin, Calendar } from 'lucide-react';
import { createCompanySchema, CreateCompanyInput, INDIAN_STATES } from '@smarterp/shared';
import { companyService } from '@/services/company.service';
import { useCompanyStore } from '@/stores/company.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';

export default function CompanyCreatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setSelectedCompany, setCompanies } = useCompanyStore();

  // Compute default financial year start (April 1st of current year)
  const getInitialDates = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed, 3 = April
    
    // If before April, FY starts April 1st of previous year
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const startStr = `${startYear}-04-01`;
    return {
      financialYearStart: startStr,
      booksFrom: startStr,
    };
  };

  const defaults = getInitialDates();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors: rawErrors },
  } = useForm<any>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      legalName: '',
      gstin: '',
      pan: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateCode: '',
      stateName: '',
      pincode: '',
      phone: '',
      email: '',
      website: '',
      financialYearStart: defaults.financialYearStart,
      booksFrom: defaults.booksFrom,
      baseCurrency: 'INR',
    },
  });
  const errors = rawErrors as any;

  const selectedStateCode = watch('stateCode');

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const stateObj = INDIAN_STATES.find((s) => s.code === code);
    
    setValue('stateCode', code, { shouldValidate: true });
    setValue('stateName', stateObj ? stateObj.name : '', { shouldValidate: true });
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const company = await companyService.createCompany(data as CreateCompanyInput);
      
      // Refresh user's company list in store
      const list = await companyService.getCompanies();
      setCompanies(list);
      
      // Auto-select newly created company
      const companyWithRole = list.find((c) => c.id === company.id);
      setSelectedCompany(companyWithRole || (company as any));
      
      toast.success('Company created successfully and accounts seeded!');
      router.replace('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || 'Failed to create company';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Create New Company
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure your enterprise accounting details. Default ledger groups, tax rates, and units will be seeded.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-xl">
          <CardHeader className="border-b border-border/40 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Company Details</CardTitle>
                <CardDescription className="text-xs">
                  Provide name, GSTIN, PAN, and contact information.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8 pt-6">
            {/* General Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileText className="h-4 w-4" />
                <span>Primary Details</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    placeholder="e.g. Acme Corporation"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name (for invoices)</Label>
                  <Input
                    id="legalName"
                    placeholder="e.g. Acme Corporation Pvt. Ltd."
                    {...register('legalName')}
                    className={errors.legalName ? 'border-destructive' : ''}
                  />
                  {errors.legalName && (
                    <p className="text-xs text-destructive">{errors.legalName.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Taxation details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Building2 className="h-4 w-4" />
                <span>Tax Registration</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (Indian GST Number)</Label>
                  <Input
                    id="gstin"
                    placeholder="e.g. 27AAAAA1111A1Z1"
                    {...register('gstin')}
                    className={`font-mono uppercase ${errors.gstin ? 'border-destructive' : ''}`}
                  />
                  {errors.gstin && (
                    <p className="text-xs text-destructive">{errors.gstin.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">Permanent Account Number (PAN)</Label>
                  <Input
                    id="pan"
                    placeholder="e.g. ABCDE1234F"
                    {...register('pan')}
                    className={`font-mono uppercase ${errors.pan ? 'border-destructive' : ''}`}
                  />
                  {errors.pan && (
                    <p className="text-xs text-destructive">{errors.pan.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address & contact details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4" />
                <span>Contact & Address</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Shop/Office number, building details"
                    {...register('addressLine1')}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Street, area name, landmark"
                    {...register('addressLine2')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City / Town"
                    {...register('city')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State / Union Territory</Label>
                  <select
                    id="state"
                    value={selectedStateCode}
                    onChange={handleStateChange}
                    className="flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                  {errors.stateCode && (
                    <p className="text-xs text-destructive">{errors.stateCode.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    placeholder="6-digit pincode"
                    {...register('pincode')}
                    className={errors.pincode ? 'border-destructive' : ''}
                  />
                  {errors.pincode && (
                    <p className="text-xs text-destructive">{errors.pincode.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="10-digit mobile number"
                    {...register('phone')}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. contact@acme.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="e.g. https://acme.com"
                    {...register('website')}
                    className={errors.website ? 'border-destructive' : ''}
                  />
                  {errors.website && (
                    <p className="text-xs text-destructive">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Financial period */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Calendar className="h-4 w-4" />
                <span>Financial Year & Book Period</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="financialYearStart">Financial Year Beginning From <span className="text-destructive">*</span></Label>
                  <Input
                    id="financialYearStart"
                    type="date"
                    {...register('financialYearStart')}
                    className={errors.financialYearStart ? 'border-destructive' : ''}
                  />
                  {errors.financialYearStart && (
                    <p className="text-xs text-destructive">{errors.financialYearStart.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booksFrom">Books Beginning From <span className="text-destructive">*</span></Label>
                  <Input
                    id="booksFrom"
                    type="date"
                    {...register('booksFrom')}
                    className={errors.booksFrom ? 'border-destructive' : ''}
                  />
                  {errors.booksFrom && (
                    <p className="text-xs text-destructive">{errors.booksFrom.message}</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="border-t border-border/40 justify-end gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Company...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Company
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
