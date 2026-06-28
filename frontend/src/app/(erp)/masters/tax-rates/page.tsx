'use client';

import React, { useEffect, useState } from 'react';
import { useMastersStore } from '@/stores/masters.store';
import { taxRateService } from '@/services/tax-rate.service';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Percent, ToggleLeft, ToggleRight } from 'lucide-react';
import type { TaxRate } from '@smarterp/shared';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/stores/company.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ============================================================
// GST Tax Rates Page
// ============================================================

export default function TaxRatesPage() {
  const { selectedCompany } = useCompanyStore();
  const { taxRates, fetchTaxRates, loadingTaxRates } = useMastersStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    hsnSacCode: '',
    taxType: 'GST' as 'GST' | 'EXEMPT' | 'NIL',
    cgstRate: 0,
    sgstRate: 0,
    igstRate: 0,
    cessRate: 0,
  });

  useEffect(() => {
    if (!selectedCompany?.id) return;
    fetchTaxRates();
  }, [selectedCompany?.id]);

  const resetForm = () => {
    setForm({
      name: '',
      hsnSacCode: '',
      taxType: 'GST',
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      cessRate: 0,
    });
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Slab name is required');

    try {
      const payload = {
        name: form.name,
        hsnSacCode: form.hsnSacCode || undefined,
        taxType: form.taxType,
        cgstRate: Number(form.cgstRate),
        sgstRate: Number(form.sgstRate),
        igstRate: Number(form.igstRate),
        cessRate: Number(form.cessRate),
      };

      if (editingId) {
        await taxRateService.updateTaxRate(editingId, payload);
        toast.success('Tax rate updated successfully');
      } else {
        await taxRateService.createTaxRate(payload);
        toast.success('Tax rate created successfully');
      }
      setIsOpen(false);
      resetForm();
      fetchTaxRates();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save tax rate');
    }
  };

  const handleEdit = (taxRate: TaxRate) => {
    setForm({
      name: taxRate.name,
      hsnSacCode: taxRate.hsnSacCode || '',
      taxType: taxRate.taxType as any,
      cgstRate: taxRate.cgstRate,
      sgstRate: taxRate.sgstRate,
      igstRate: taxRate.igstRate,
      cessRate: taxRate.cessRate,
    });
    setEditingId(taxRate.id);
    setIsOpen(true);
  };

  const handleToggleActive = async (taxRate: TaxRate) => {
    try {
      await taxRateService.updateTaxRate(taxRate.id, { isActive: !taxRate.isActive });
      toast.success(`Tax rate ${taxRate.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchTaxRates();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update tax rate status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this GST rate slab?')) return;
    try {
      await taxRateService.deleteTaxRate(id);
      toast.success('Tax rate deleted successfully');
      fetchTaxRates();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete tax rate');
    }
  };

  // Auto-calculate IGST when CGST or SGST changes
  const handleCgstSgstChange = (field: 'cgstRate' | 'sgstRate', val: number) => {
    const nextForm = { ...form, [field]: val };
    if (nextForm.taxType === 'GST') {
      nextForm.igstRate = nextForm.cgstRate + nextForm.sgstRate;
    }
    setForm(nextForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">GST Tax Rates</h1>
          <p className="text-sm text-muted-foreground">
            Configure GST slabs, HSN mappings, and local/interstate tax splits.
          </p>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Tax Rate</span>
        </Button>
      </div>

      <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
        <CardContent className="p-0">
          {loadingTaxRates ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading tax rates...</div>
          ) : taxRates.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No tax slabs defined. Click "New Tax Rate" to configure one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-card/30 text-muted-foreground font-medium">
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-6">HSN/SAC</th>
                    <th className="py-3 px-6 text-center">Tax Type</th>
                    <th className="py-3 px-6 text-right">CGST</th>
                    <th className="py-3 px-6 text-right">SGST</th>
                    <th className="py-3 px-6 text-right">IGST</th>
                    <th className="py-3 px-6 text-right">Cess</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxRates.map((rate) => (
                    <tr 
                      key={rate.id} 
                      className="border-b border-border/20 hover:bg-card/20 transition-all duration-150"
                    >
                      <td className="py-3.5 px-6 font-medium text-foreground flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                        {rate.name}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-muted-foreground">{rate.hsnSacCode || 'N/A'}</td>
                      <td className="py-3.5 px-6 text-center">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold ${
                          rate.taxType === 'GST' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {rate.taxType}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-foreground">{rate.cgstRate}%</td>
                      <td className="py-3.5 px-6 text-right font-mono text-foreground">{rate.sgstRate}%</td>
                      <td className="py-3.5 px-6 text-right font-mono font-semibold text-primary">{rate.igstRate}%</td>
                      <td className="py-3.5 px-6 text-right font-mono text-muted-foreground">{rate.cessRate}%</td>
                      <td className="py-3.5 px-6 text-center">
                        <button 
                          onClick={() => handleToggleActive(rate)}
                          className={`inline-flex items-center justify-center transition-colors ${
                            rate.isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          {rate.isActive ? (
                            <ToggleRight className="h-6 w-6" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(rate)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(rate.id)}
                          className="text-muted-foreground hover:text-foreground hover:bg-card/85 transition-all duration-200 ease-out hover:scale-115 active:scale-95"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Tax Slab' : 'New Tax Slab'}</CardTitle>
              <CardDescription>Setup local/interstate splits. Local CGST+SGST = Interstate IGST.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Slab Name</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. GST 18%"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Tax Type</label>
                    <select
                      value={form.taxType}
                      onChange={(e) => setForm({ ...form, taxType: e.target.value as any })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="GST">GST Rate</option>
                      <option value="EXEMPT">Exempted</option>
                      <option value="NIL">Nil Rated</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">HSN/SAC Code</label>
                    <Input
                      value={form.hsnSacCode}
                      onChange={(e) => setForm({ ...form, hsnSacCode: e.target.value })}
                      placeholder="e.g. 9984"
                    />
                  </div>
                </div>

                {form.taxType === 'GST' && (
                  <div className="space-y-3 border-t border-border/40 pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">CGST Rate (%)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.cgstRate}
                          onChange={(e) => handleCgstSgstChange('cgstRate', Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">SGST Rate (%)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.sgstRate}
                          onChange={(e) => handleCgstSgstChange('sgstRate', Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-primary font-bold">IGST Rate (%)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.igstRate}
                          onChange={(e) => setForm({ ...form, igstRate: Number(e.target.value) })}
                          className="border-primary/50 font-semibold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Cess Rate (%)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={form.cessRate}
                          onChange={(e) => setForm({ ...form, cessRate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Rate</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
