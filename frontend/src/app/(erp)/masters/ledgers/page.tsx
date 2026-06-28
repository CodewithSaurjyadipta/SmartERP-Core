'use client';

import React, { useEffect, useState } from 'react';
import { useMastersStore } from '@/stores/masters.store';
import { ledgerService } from '@/services/ledger.service';
import { ledgerGroupService } from '@/services/ledger-group.service';
import { toast } from 'sonner';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';
import type { Ledger, LedgerGroup, LedgerGroupNode } from '@smarterp/shared';
import { useCompanyStore } from '@/stores/company.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ============================================================
// Ledger Chart of Accounts Page
// ============================================================

export default function LedgersPage() {
  const { selectedCompany } = useCompanyStore();
  const { 
    ledgerGroups, 
    ledgerGroupsTree, 
    fetchLedgerGroups, 
    loadingLedgerGroups 
  } = useMastersStore();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  
  // Selected state
  const [selectedGroup, setSelectedGroup] = useState<LedgerGroup | null>(null);
  
  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  
  // Forms state
  const [groupForm, setGroupForm] = useState({
    name: '',
    parentId: '',
    nature: 'ASSETS' as 'ASSETS' | 'LIABILITIES' | 'INCOME' | 'EXPENSE',
    affectsGp: false,
    sequenceOrder: 100,
  });

  const [ledgerForm, setLedgerForm] = useState({
    name: '',
    ledgerGroupId: '',
    openingBalance: 0,
    openingBalanceType: 'DEBIT' as 'DEBIT' | 'CREDIT',
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

  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);

  // Fetch all ledgers
  const loadLedgers = async () => {
    setLoadingLedgers(true);
    try {
      const data = await ledgerService.getLedgers();
      setLedgers(data);
    } catch {
      toast.error('Failed to load ledger accounts');
    } finally {
      setLoadingLedgers(false);
    }
  };

  useEffect(() => {
    if (!selectedCompany?.id) return;
    fetchLedgerGroups();
    loadLedgers();
  }, [selectedCompany?.id]);

  // Filter ledgers based on selected group
  const filteredLedgers = selectedGroup
    ? ledgers.filter(l => l.ledgerGroupId === selectedGroup.id)
    : ledgers;

  // Handle group creation
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.name.trim()) return toast.error('Group name is required');
    
    try {
      await ledgerGroupService.createGroup({
        name: groupForm.name,
        parentId: groupForm.parentId || undefined,
        nature: groupForm.nature,
        affectsGp: groupForm.affectsGp,
        sequenceOrder: Number(groupForm.sequenceOrder),
      });
      toast.success('Ledger group created successfully');
      setIsGroupModalOpen(false);
      setGroupForm({ name: '', parentId: '', nature: 'ASSETS', affectsGp: false, sequenceOrder: 100 });
      fetchLedgerGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create group');
    }
  };

  // Handle group deletion
  const handleDeleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this custom ledger group? This will also affect child groups.')) return;
    try {
      await ledgerGroupService.deleteGroup(id);
      toast.success('Ledger group deleted successfully');
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
      fetchLedgerGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete ledger group');
    }
  };

  // Handle ledger creation / edit
  const handleSaveLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ledgerForm.name.trim()) return toast.error('Ledger name is required');
    if (!ledgerForm.ledgerGroupId) return toast.error('Please select a parent group');

    try {
      if (editingLedgerId) {
        await ledgerService.updateLedger(editingLedgerId, ledgerForm);
        toast.success('Ledger updated successfully');
      } else {
        await ledgerService.createLedger(ledgerForm);
        toast.success('Ledger created successfully');
      }
      setIsLedgerModalOpen(false);
      resetLedgerForm();
      loadLedgers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save ledger');
    }
  };

  const resetLedgerForm = () => {
    setLedgerForm({
      name: '',
      ledgerGroupId: selectedGroup?.id || '',
      openingBalance: 0,
      openingBalanceType: 'DEBIT',
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
    setEditingLedgerId(null);
  };

  const handleEditLedger = (ledger: Ledger) => {
    setLedgerForm({
      name: ledger.name,
      ledgerGroupId: ledger.ledgerGroupId,
      openingBalance: ledger.openingBalance,
      openingBalanceType: (ledger.openingBalanceType as any) || 'DEBIT',
      contactName: ledger.contactName || '',
      phone: ledger.phone || '',
      email: ledger.email || '',
      gstin: ledger.gstin || '',
      pan: ledger.pan || '',
      addressLine1: ledger.addressLine1 || '',
      addressLine2: ledger.addressLine2 || '',
      city: ledger.city || '',
      stateCode: ledger.stateCode || '',
      stateName: ledger.stateName || '',
      pincode: ledger.pincode || '',
      gstRegistrationType: (ledger.gstRegistrationType as any) || 'UNREGISTERED',
    });
    setEditingLedgerId(ledger.id);
    setIsLedgerModalOpen(true);
  };

  const handleToggleActive = async (ledger: Ledger) => {
    try {
      await ledgerService.updateLedger(ledger.id, { isActive: !ledger.isActive });
      toast.success(`Ledger ${ledger.isActive ? 'deactivated' : 'activated'} successfully`);
      loadLedgers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update ledger state');
    }
  };

  const handleDeleteLedger = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ledger?')) return;
    try {
      await ledgerService.deleteLedger(id);
      toast.success('Ledger deleted successfully');
      loadLedgers();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete ledger');
    }
  };

  // Tree Render helper
  const renderTreeNodes = (nodes: LedgerGroupNode[], depth = 0) => {
    return nodes.map((node) => {
      const isSelected = selectedGroup?.id === node.id;
      const count = ledgers.filter(l => l.ledgerGroupId === node.id).length;

      return (
        <div key={node.id} className="space-y-1">
          <button
            onClick={() => setSelectedGroup(isSelected ? null : node)}
            className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-all duration-150 ${
              isSelected 
                ? 'bg-primary/20 text-primary border-l-2 border-primary pl-1.5' 
                : 'text-muted-foreground hover:bg-card/65 hover:text-foreground'
            }`}
            style={{ paddingLeft: `${Math.max(8, depth * 16)}px` }}
          >
            <div className="flex items-center gap-2">
              {node.children.length > 0 ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-primary/80" />
              ) : (
                <Folder className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              )}
              <span className="font-medium text-left truncate max-w-[130px]">
                {node.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {count > 0 && (
                <span className="rounded-full bg-border/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  {count}
                </span>
              )}
              <span
                onClick={(e) => handleDeleteGroup(node.id, e)}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-card/85 transition-all duration-200 ease-out hover:scale-115 active:scale-95 cursor-pointer"
                title="Delete Group"
              >
                <Trash2 className="h-3 w-3 animate-in fade-in" />
              </span>
            </div>
          </button>
          {node.children.length > 0 && renderTreeNodes(node.children, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Configure default tally groups and double-entry ledger accounts.
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => {
              setIsGroupModalOpen(true);
            }}
            className="flex items-center gap-2 border-border/80 bg-card/40"
          >
            <Plus className="h-4 w-4" />
            <span>New Group</span>
          </Button>
          <Button 
            onClick={() => {
              resetLedgerForm();
              setIsLedgerModalOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Ledger</span>
          </Button>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Tree sidebar */}
        <div className="md:col-span-4 space-y-4">
          <Card className="border-border/60 bg-card/20 backdrop-blur-sm h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Ledger Groups Tree
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 scrollbar-thin">
              {loadingLedgerGroups ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading groups tree...</div>
              ) : ledgerGroupsTree.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No groups seeded yet.</div>
              ) : (
                renderTreeNodes(ledgerGroupsTree)
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right accounts panel */}
        <div className="md:col-span-8 space-y-4">
          <Card className="border-border/60 bg-card/20 backdrop-blur-sm h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Ledgers {selectedGroup ? `in "${selectedGroup.name}"` : '(All Accounts)'}
                </CardTitle>
                <CardDescription>
                  {selectedGroup 
                    ? `Showing ledger entries categorised under ${selectedGroup.nature.toLowerCase()} group.`
                    : 'Select a group on the tree to filter accounts.'
                  }
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
              {loadingLedgers ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading ledger list...</div>
              ) : filteredLedgers.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No active ledger accounts in this scope. Click "New Ledger" to populate.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-card/30 text-muted-foreground font-medium">
                        <th className="py-3 px-6">Name</th>
                        <th className="py-3 px-6">Group</th>
                        <th className="py-3 px-6 text-right">Opening Balance</th>
                        <th className="py-3 px-6 text-center">Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedgers.map((ledger) => {
                        const gp = ledgerGroups.find(g => g.id === ledger.ledgerGroupId);
                        return (
                          <tr 
                            key={ledger.id} 
                            className="border-b border-border/20 hover:bg-card/20 transition-all duration-150"
                          >
                            <td className="py-3 px-6 font-medium text-foreground flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground/60" />
                              {ledger.name}
                            </td>
                            <td className="py-3 px-6 text-muted-foreground">{gp?.name || 'Unknown'}</td>
                            <td className="py-3 px-6 text-right font-mono">
                              {Number(ledger.openingBalance).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                              })}{' '}
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {ledger.openingBalanceType}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-center">
                              <button 
                                onClick={() => handleToggleActive(ledger)}
                                className={`inline-flex items-center justify-center transition-colors ${
                                  ledger.isActive ? 'text-primary' : 'text-muted-foreground'
                                }`}
                              >
                                {ledger.isActive ? (
                                  <ToggleRight className="h-6 w-6" />
                                ) : (
                                  <ToggleLeft className="h-6 w-6" />
                                )}
                              </button>
                            </td>
                            <td className="py-3 px-6 text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleEditLedger(ledger)}
                                title="Edit Ledger"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteLedger(ledger.id)}
                                className="text-muted-foreground hover:text-foreground hover:bg-card/85 transition-all duration-200 ease-out hover:scale-115 active:scale-95"
                                title="Delete Ledger"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal 1: Create Group */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>Create Ledger Group</CardTitle>
              <CardDescription>Custom child categories for accounts</CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateGroup}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Group Name</label>
                  <Input
                    required
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    placeholder="e.g. Office Expenses"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Parent Group</label>
                  <select
                    value={groupForm.parentId}
                    onChange={(e) => setGroupForm({ ...groupForm, parentId: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="">(None - Primary Group)</option>
                    {ledgerGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Group Nature</label>
                    <select
                      value={groupForm.nature}
                      onChange={(e) => setGroupForm({ ...groupForm, nature: e.target.value as any })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="ASSETS">Assets</option>
                      <option value="LIABILITIES">Liabilities</option>
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Order Sequence</label>
                    <Input
                      type="number"
                      value={groupForm.sequenceOrder}
                      onChange={(e) => setGroupForm({ ...groupForm, sequenceOrder: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="affectsGp"
                    checked={groupForm.affectsGp}
                    onChange={(e) => setGroupForm({ ...groupForm, affectsGp: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background"
                  />
                  <label htmlFor="affectsGp" className="text-sm font-medium text-foreground">
                    Affects Gross Profit?
                  </label>
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsGroupModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal 2: Create / Edit Ledger */}
      {isLedgerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl border-border bg-card shadow-2xl my-8 animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>{editingLedgerId ? 'Edit Ledger Account' : 'New Ledger Account'}</CardTitle>
              <CardDescription>Setup details, opening values, and contact properties.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveLedger}>
              <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin">
                {/* Basic Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Ledger Name</label>
                    <Input
                      required
                      value={ledgerForm.name}
                      onChange={(e) => setLedgerForm({ ...ledgerForm, name: e.target.value })}
                      placeholder="e.g. HDFC Bank Current A/c"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Parent Account Group</label>
                    <select
                      required
                      value={ledgerForm.ledgerGroupId}
                      onChange={(e) => setLedgerForm({ ...ledgerForm, ledgerGroupId: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">-- Select Group --</option>
                      {ledgerGroups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Opening Balance</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={ledgerForm.openingBalance}
                      onChange={(e) => setLedgerForm({ ...ledgerForm, openingBalance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Type</label>
                    <select
                      value={ledgerForm.openingBalanceType}
                      onChange={(e) => setLedgerForm({ ...ledgerForm, openingBalanceType: e.target.value as any })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="DEBIT">Debit (Dr)</option>
                      <option value="CREDIT">Credit (Cr)</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-border/40 my-4 pt-4">
                  <h3 className="text-sm font-semibold text-primary mb-3">Party Profile (Optional)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Contact Person</label>
                      <Input
                        value={ledgerForm.contactName}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, contactName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                      <Input
                        value={ledgerForm.phone}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">GST Reg Type</label>
                      <select
                        value={ledgerForm.gstRegistrationType}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, gstRegistrationType: e.target.value as any })}
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
                        value={ledgerForm.gstin}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, gstin: e.target.value.toUpperCase() })}
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">PAN</label>
                      <Input
                        value={ledgerForm.pan}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, pan: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <label className="text-xs font-semibold text-muted-foreground">Address Line 1</label>
                    <Input
                      value={ledgerForm.addressLine1}
                      onChange={(e) => setLedgerForm({ ...ledgerForm, addressLine1: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">City</label>
                      <Input
                        value={ledgerForm.city}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">State Name</label>
                      <Input
                        value={ledgerForm.stateName}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, stateName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Pincode</label>
                      <Input
                        value={ledgerForm.pincode}
                        onChange={(e) => setLedgerForm({ ...ledgerForm, pincode: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsLedgerModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Account</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
