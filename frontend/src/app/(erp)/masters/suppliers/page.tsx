'use client';

import React, { useEffect, useState } from 'react';
import { supplierService } from '@/services/supplier.service';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileCheck 
} from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';
import type { Supplier } from '@smarterp/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ============================================================
// Suppliers Management Page (Sundry Creditors Wrapper)
// ============================================================

export default function SuppliersPage() {
  const { selectedCompany } = useCompanyStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    openingBalance: 0,
    openingBalanceType: 'CREDIT' as 'DEBIT' | 'CREDIT',
    contactName: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateCode: '',
    stateName: '',
    pincode: '',
    gstRegistrationType: 'UNREGISTERED' as 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED' | 'CONSUMER',
  });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch {
      toast.error('Failed to load supplier profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedCompany?.id) return;
    loadSuppliers();
  }, [selectedCompany?.id]);

  const resetForm = () => {
    setForm({
      name: '',
      openingBalance: 0,
      openingBalanceType: 'CREDIT',
      contactName: '',
      phone: '',
      email: '',
      gstin: '',
      pan: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateCode: '',
      stateName: '',
      pincode: '',
      gstRegistrationType: 'UNREGISTERED',
    });
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Supplier name is required');

    try {
      if (editingId) {
        await supplierService.updateSupplier(editingId, form);
        toast.success('Supplier updated successfully');
      } else {
        await supplierService.createSupplier(form);
        toast.success('Supplier created successfully');
      }
      setIsOpen(false);
      resetForm();
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setForm({
      name: supplier.name,
      openingBalance: supplier.openingBalance,
      openingBalanceType: (supplier.openingBalanceType as any) || 'CREDIT',
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      gstin: supplier.gstin || '',
      pan: supplier.pan || '',
      addressLine1: supplier.addressLine1 || '',
      addressLine2: supplier.addressLine2 || '',
      city: supplier.city || '',
      stateCode: supplier.stateCode || '',
      stateName: supplier.stateName || '',
      pincode: supplier.pincode || '',
      gstRegistrationType: (supplier.gstRegistrationType as any) || 'UNREGISTERED',
    });
    setEditingId(supplier.id);
    setIsOpen(true);
  };

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      await supplierService.updateSupplier(supplier.id, { isActive: !supplier.isActive });
      toast.success(`Supplier ${supplier.isActive ? 'deactivated' : 'activated'} successfully`);
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update supplier status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await supplierService.deleteSupplier(id);
      toast.success('Supplier profile deleted successfully');
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete supplier');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your vendors and suppliers (Sundry Creditors) for purchase bookings.
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
          <span>New Supplier</span>
        </Button>
      </div>

      {/* Main Table view */}
      <Card className="border-border/60 bg-card/20 backdrop-blur-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading suppliers...</div>
          ) : suppliers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No suppliers found. Click "New Supplier" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-card/30 text-muted-foreground font-medium">
                    <th className="py-3 px-6">Company / Name</th>
                    <th className="py-3 px-6">GSTIN & Address</th>
                    <th className="py-3 px-6">Contact details</th>
                    <th className="py-3 px-6 text-right">Opening Balance</th>
                    <th className="py-3 px-6 text-center">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supp) => (
                    <tr 
                      key={supp.id} 
                      className="border-b border-border/20 hover:bg-card/20 transition-all duration-150"
                    >
                      <td className="py-4 px-6 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{supp.name}</p>
                            <p className="text-xs text-muted-foreground">{supp.contactName || 'No contact person'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1.5 text-xs font-mono">
                            <FileCheck className="h-3 w-3 text-muted-foreground" />
                            {supp.gstin ? supp.gstin : 'UNREGISTERED'}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs truncate max-w-[200px]">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            {supp.city ? `${supp.city}, ${supp.stateName || ''}` : 'No address specified'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        <div className="space-y-1 text-xs">
                          {supp.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3" />
                              {supp.phone}
                            </p>
                          )}
                          {supp.email && (
                            <p className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              {supp.email}
                            </p>
                          )}
                          {!supp.phone && !supp.email && <span className="text-muted-foreground/60">No contact info</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono">
                        {Number(supp.openingBalance).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}{' '}
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {supp.openingBalanceType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => handleToggleActive(supp)}
                          className={`inline-flex items-center justify-center transition-colors ${
                            supp.isActive ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          {supp.isActive ? (
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
                          onClick={() => handleEdit(supp)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(supp.id)}
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

      {/* Slide / Overlay modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Supplier Profile' : 'New Supplier Profile'}</CardTitle>
              <CardDescription>Setup contact info, state code, and GST identification details.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Supplier Company Name</label>
                    <Input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Tata Steel Limited"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Contact Person</label>
                    <Input
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      placeholder="e.g. Sales Manager"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Opening Balance (Payable)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.openingBalance}
                      onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Type</label>
                    <select
                      value={form.openingBalanceType}
                      onChange={(e) => setForm({ ...form, openingBalanceType: e.target.value as any })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="CREDIT">Credit (Cr)</option>
                      <option value="DEBIT">Debit (Dr)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Email Address</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <h3 className="text-sm font-semibold text-primary mb-3">GST & Billing Profile</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">GST Reg Type</label>
                      <select
                        value={form.gstRegistrationType}
                        onChange={(e) => setForm({ ...form, gstRegistrationType: e.target.value as any })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      >
                        <option value="UNREGISTERED">Unregistered</option>
                        <option value="REGULAR">Regular GST</option>
                        <option value="COMPOSITION">Composition</option>
                        <option value="CONSUMER">Consumer</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">GSTIN</label>
                      <Input
                        value={form.gstin}
                        onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                        placeholder="e.g. 03AAAAA2222A1Z1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">PAN</label>
                      <Input
                        value={form.pan}
                        onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                        placeholder="e.g. AAAAA2222A"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <label className="text-xs font-semibold text-muted-foreground">Billing Address Line 1</label>
                    <Input
                      value={form.addressLine1}
                      onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-3">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">City</label>
                      <Input
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">State Code (e.g. 03)</label>
                      <Input
                        value={form.stateCode}
                        onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                        maxLength={2}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Pincode</label>
                      <Input
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <label className="text-xs font-semibold text-muted-foreground">State Name</label>
                    <Input
                      value={form.stateName}
                      onChange={(e) => setForm({ ...form, stateName: e.target.value })}
                    />
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
                <Button type="submit">Save Supplier</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
