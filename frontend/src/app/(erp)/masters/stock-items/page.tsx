'use client';

import React, { useEffect, useState } from 'react';
import { useMastersStore } from '@/stores/masters.store';
import { stockItemService, StockItemWithRelations } from '@/services/stock-item.service';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Package, Tag, Scale, ToggleLeft, ToggleRight } from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ============================================================
// Stock Items (Inventory Profile Manager)
// ============================================================

export default function StockItemsPage() {
  const { selectedCompany } = useCompanyStore();
  const { 
    stockGroups, 
    units, 
    taxRates, 
    fetchAllMasters 
  } = useMastersStore();

  const [items, setItems] = useState<StockItemWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    stockGroupId: '',
    unitId: '',
    taxRateId: '',
    hsnCode: '',
    openingQty: 0,
    openingRate: 0,
    openingValue: 0,
    standardSellingPrice: '',
    standardPurchasePrice: '',
    mrp: '',
    reorderLevel: 0,
    minimumQty: 0,
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await stockItemService.getStockItems();
      setItems(data);
    } catch {
      toast.error('Failed to load stock items profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCompany?.id) return;
    fetchAllMasters();
    loadItems();
  }, [selectedCompany?.id]);

  const resetForm = () => {
    setForm({
      name: '',
      stockGroupId: '',
      unitId: '',
      taxRateId: '',
      hsnCode: '',
      openingQty: 0,
      openingRate: 0,
      openingValue: 0,
      standardSellingPrice: '',
      standardPurchasePrice: '',
      mrp: '',
      reorderLevel: 0,
      minimumQty: 0,
    });
    setEditingId(null);
  };

  // Helper to compute opening value: qty * rate
  const handleQtyRateChange = (field: 'openingQty' | 'openingRate', val: number) => {
    const nextForm = { ...form, [field]: val };
    nextForm.openingValue = nextForm.openingQty * nextForm.openingRate;
    setForm(nextForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Item name is required');
    if (!form.unitId) return toast.error('Please select a unit of measure');

    try {
      const payload: any = {
        name: form.name,
        stockGroupId: form.stockGroupId || undefined,
        unitId: form.unitId || undefined,
        taxRateId: form.taxRateId || undefined,
        hsnCode: form.hsnCode || undefined,
        openingQty: Number(form.openingQty),
        openingRate: Number(form.openingRate),
        openingValue: Number(form.openingValue),
        reorderLevel: Number(form.reorderLevel),
        minimumQty: Number(form.minimumQty),
        standardSellingPrice: form.standardSellingPrice ? Number(form.standardSellingPrice) : undefined,
        standardPurchasePrice: form.standardPurchasePrice ? Number(form.standardPurchasePrice) : undefined,
        mrp: form.mrp ? Number(form.mrp) : undefined,
      };

      if (editingId) {
        await stockItemService.updateStockItem(editingId, payload);
        toast.success('Stock item profile updated successfully');
      } else {
        await stockItemService.createStockItem(payload);
        toast.success('Stock item profile created successfully');
      }
      setIsOpen(false);
      resetForm();
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save stock item');
    }
  };

  const handleEdit = (item: StockItemWithRelations) => {
    setForm({
      name: item.name,
      stockGroupId: item.stockGroupId || '',
      unitId: item.unitId || '',
      taxRateId: item.taxRateId || '',
      hsnCode: item.hsnCode || '',
      openingQty: item.openingQty,
      openingRate: item.openingRate,
      openingValue: item.openingValue,
      standardSellingPrice: item.standardSellingPrice ? String(item.standardSellingPrice) : '',
      standardPurchasePrice: item.standardPurchasePrice ? String(item.standardPurchasePrice) : '',
      mrp: item.mrp ? String(item.mrp) : '',
      reorderLevel: item.reorderLevel,
      minimumQty: item.minimumQty,
    });
    setEditingId(item.id);
    setIsOpen(true);
  };

  const handleToggleActive = async (item: StockItemWithRelations) => {
    try {
      await stockItemService.updateStockItem(item.id, { isActive: !item.isActive });
      toast.success(`Stock item ${item.isActive ? 'deactivated' : 'activated'} successfully`);
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update stock item status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock item?')) return;
    try {
      await stockItemService.deleteStockItem(id);
      toast.success('Stock item deleted successfully');
      loadItems();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete stock item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock Items</h1>
          <p className="text-sm text-muted-foreground">
            Configure inventory metadata (Units, GST slabs, standard prices, and opening stock).
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
          <span>New Stock Item</span>
        </Button>
      </div>

      <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading stock items...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No stock items configured yet. Click "New Stock Item" to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-card/30 text-muted-foreground font-medium">
                    <th className="py-3 px-6">Item details</th>
                    <th className="py-3 px-6">Group Category</th>
                    <th className="py-3 px-6 text-center">Unit</th>
                    <th className="py-3 px-6">HSN & Tax Rate</th>
                    <th className="py-3 px-6 text-right">Standard Sell / Buy</th>
                    <th className="py-3 px-6 text-right">Opening Qty</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr 
                      key={item.id} 
                      className="border-b border-border/20 hover:bg-card/20 transition-all duration-150"
                    >
                      <td className="py-4 px-6 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Package className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">MRP: {item.mrp ? `₹${item.mrp}` : 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{item.stockGroupName || 'General Category'}</td>
                      <td className="py-4 px-6 text-center text-primary font-bold font-mono">
                        <span className="flex items-center justify-center gap-1">
                          <Scale className="h-3.5 w-3.5" />
                          {item.unitSymbol || 'PCS'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-xs font-mono">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            {item.hsnCode || 'N/A'}
                          </p>
                          <p className="text-[10px] text-primary font-semibold">{item.taxRateName || 'Nil Rated'}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right text-muted-foreground font-mono text-xs">
                        <p className="text-foreground">S: {item.standardSellingPrice ? `₹${item.standardSellingPrice}` : 'N/A'}</p>
                        <p>B: {item.standardPurchasePrice ? `₹${item.standardPurchasePrice}` : 'N/A'}</p>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-semibold">
                        {item.openingQty.toLocaleString('en-IN', {
                          minimumFractionDigits: 0,
                        })}{' '}
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {item.unitSymbol || 'PCS'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center justify-center transition-colors ${
                            item.isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          {item.isActive ? (
                            <ToggleRight className="h-6 w-6" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(item.id)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl border-border bg-card shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Stock Item Profile' : 'New Stock Item Profile'}</CardTitle>
              <CardDescription>Setup metadata, standard purchase/selling rates, and opening stock values.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Product Item Name</label>
                    <Input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Steel Pipe 2-Inch"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Stock Category Group</label>
                    <select
                      value={form.stockGroupId}
                      onChange={(e) => setForm({ ...form, stockGroupId: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">(None - Primary Group)</option>
                      {stockGroups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Measurement Unit</label>
                    <select
                      required
                      value={form.unitId}
                      onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- Select Unit --</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.symbol} ({u.name})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">HSN Code</label>
                    <Input
                      value={form.hsnCode}
                      onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                      placeholder="e.g. 7306"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">GST Slab</label>
                    <select
                      value={form.taxRateId}
                      onChange={(e) => setForm({ ...form, taxRateId: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- Select GST --</option>
                      {taxRates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold text-primary mb-3">Opening Balance (Asset Valuations)</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Opening Qty</label>
                      <Input
                        type="number"
                        step="0.001"
                        value={form.openingQty}
                        onChange={(e) => handleQtyRateChange('openingQty', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Opening Rate (per unit)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.openingRate}
                        onChange={(e) => handleQtyRateChange('openingRate', Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground font-bold">Total Value (INR)</label>
                      <Input
                        type="number"
                        value={form.openingValue}
                        disabled
                        className="bg-card/60 cursor-not-allowed font-semibold"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold text-primary mb-3">Pricing & Safeguards</h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Standard Selling Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.standardSellingPrice}
                        onChange={(e) => setForm({ ...form, standardSellingPrice: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Standard Purchase Price</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.standardPurchasePrice}
                        onChange={(e) => setForm({ ...form, standardPurchasePrice: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">MRP (Maximum Retail Price)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.mrp}
                        onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Reorder Level (Alert Limit)</label>
                      <Input
                        type="number"
                        value={form.reorderLevel}
                        onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Minimum Order Qty</label>
                      <Input
                        type="number"
                        value={form.minimumQty}
                        onChange={(e) => setForm({ ...form, minimumQty: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Product Item</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
