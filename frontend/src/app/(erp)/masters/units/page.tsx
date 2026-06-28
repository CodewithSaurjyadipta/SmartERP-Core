'use client';

import React, { useEffect, useState } from 'react';
import { useMastersStore } from '@/stores/masters.store';
import { unitService } from '@/services/unit.service';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Scale, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Unit } from '@smarterp/shared';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/stores/company.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ============================================================
// Units of Measurement Page
// ============================================================

export default function UnitsPage() {
  const { selectedCompany } = useCompanyStore();
  const { units, fetchUnits, loadingUnits } = useMastersStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    symbol: '',
    decimalPlaces: 0,
  });

  useEffect(() => {
    if (!selectedCompany?.id) return;
    fetchUnits();
  }, [selectedCompany?.id]);

  const resetForm = () => {
    setForm({
      name: '',
      symbol: '',
      decimalPlaces: 0,
    });
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symbol.trim()) return toast.error('Symbol is required');
    if (!form.name.trim()) return toast.error('Unit name is required');

    try {
      if (editingId) {
        await unitService.updateUnit(editingId, {
          name: form.name,
          symbol: form.symbol,
          decimalPlaces: Number(form.decimalPlaces),
        });
        toast.success('Unit of measure updated successfully');
      } else {
        await unitService.createUnit({
          name: form.name,
          symbol: form.symbol,
          decimalPlaces: Number(form.decimalPlaces),
        });
        toast.success('Unit of measure created successfully');
      }
      setIsOpen(false);
      resetForm();
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save unit');
    }
  };

  const handleEdit = (unit: Unit) => {
    setForm({
      name: unit.name,
      symbol: unit.symbol,
      decimalPlaces: unit.decimalPlaces,
    });
    setEditingId(unit.id);
    setIsOpen(true);
  };

  const handleToggleActive = async (unit: Unit) => {
    try {
      await unitService.updateUnit(unit.id, { isActive: !unit.isActive });
      toast.success(`Unit ${unit.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update unit status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit of measure?')) return;
    try {
      await unitService.deleteUnit(id);
      toast.success('Unit deleted successfully');
      fetchUnits();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete unit');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Units of Measure</h1>
          <p className="text-sm text-muted-foreground">
            Configure units for stock balances (e.g. PCS, BOX, KG, LTR).
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
          <span>New Unit</span>
        </Button>
      </div>

      <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
        <CardContent className="p-0">
          {loadingUnits ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading units...</div>
          ) : units.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No units defined yet. Click "New Unit" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-card/30 text-muted-foreground font-medium">
                    <th className="py-3 px-6">Symbol</th>
                    <th className="py-3 px-6">Formal Name</th>
                    <th className="py-3 px-6 text-center">Decimal Places</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr 
                      key={unit.id} 
                      className="border-b border-border/20 hover:bg-card/20 transition-all duration-150"
                    >
                      <td className="py-3.5 px-6 font-semibold font-mono text-primary">{unit.symbol}</td>
                      <td className="py-3.5 px-6 font-medium text-foreground flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground/60" />
                        {unit.name}
                      </td>
                      <td className="py-3.5 px-6 text-center text-muted-foreground font-mono">{unit.decimalPlaces}</td>
                      <td className="py-3.5 px-6 text-center">
                        <button 
                          onClick={() => handleToggleActive(unit)}
                          className={`inline-flex items-center justify-center transition-colors ${
                            unit.isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          {unit.isActive ? (
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
                          onClick={() => handleEdit(unit)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(unit.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Unit of Measure' : 'New Unit of Measure'}</CardTitle>
              <CardDescription>Configure the symbol and decimal constraints.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Symbol (e.g. PCS, KG)</label>
                  <Input
                    required
                    value={form.symbol}
                    onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g. PCS"
                    disabled={!!editingId}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Formal Name</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Pieces"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Decimal Places (0-4)</label>
                  <Input
                    type="number"
                    min={0}
                    max={4}
                    value={form.decimalPlaces}
                    onChange={(e) => setForm({ ...form, decimalPlaces: Number(e.target.value) })}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Number of digits allowed after the decimal point in transactions (e.g. 0 for PCS, 3 for KG).
                  </p>
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Unit</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
