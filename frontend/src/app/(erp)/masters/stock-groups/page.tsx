'use client';

import React, { useEffect, useState } from 'react';
import { useMastersStore } from '@/stores/masters.store';
import { stockGroupService } from '@/services/stock-group.service';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Folder, FolderOpen } from 'lucide-react';
import type { StockGroup, StockGroupNode } from '@smarterp/shared';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/stores/company.store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ============================================================
// Stock Groups Management Page (Inventory Categories)
// ============================================================

export default function StockGroupsPage() {
  const { selectedCompany } = useCompanyStore();
  const { stockGroups, stockGroupsTree, fetchStockGroups, loadingStockGroups } = useMastersStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    parentId: '',
  });

  useEffect(() => {
    if (!selectedCompany?.id) return;
    fetchStockGroups();
  }, [selectedCompany?.id]);

  const resetForm = () => {
    setForm({
      name: '',
      parentId: '',
    });
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Group name is required');

    try {
      const payload = {
        name: form.name,
        parentId: form.parentId || undefined,
      };

      if (editingId) {
        await stockGroupService.updateStockGroup(editingId, payload);
        toast.success('Stock category group updated successfully');
      } else {
        await stockGroupService.createStockGroup(payload);
        toast.success('Stock category group created successfully');
      }
      setIsOpen(false);
      resetForm();
      fetchStockGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save stock group');
    }
  };

  const handleEdit = (group: StockGroup) => {
    setForm({
      name: group.name,
      parentId: group.parentId || '',
    });
    setEditingId(group.id);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock group?')) return;
    try {
      await stockGroupService.deleteStockGroup(id);
      toast.success('Stock group deleted successfully');
      fetchStockGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete stock group');
    }
  };

  // Recursive Tree render helper
  const renderTree = (nodes: StockGroupNode[], depth = 0) => {
    return nodes.map((node) => (
      <div key={node.id} className="space-y-1">
        <div 
          className="flex items-center justify-between rounded-lg border border-border/20 bg-card/35 px-4 py-2 text-sm text-foreground hover:bg-card/60 transition-colors"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2">
            {node.children.length > 0 ? (
              <FolderOpen className="h-4 w-4 text-primary shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="font-semibold">{node.name}</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleEdit(node)}
              title="Edit Group"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => handleDelete(node.id)}
              className="text-muted-foreground hover:text-foreground hover:bg-card/85 transition-all duration-200 ease-out hover:scale-115 active:scale-95"
              title="Delete Group"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {node.children.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Stock Groups</h1>
          <p className="text-sm text-muted-foreground">
            Configure raw materials, semi-finished categories, or product group hierarchies.
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
          <span>New Stock Group</span>
        </Button>
      </div>

      <Card className="border-border/60 bg-card/20 backdrop-blur-sm max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">Hierarchy Tree</CardTitle>
          <CardDescription>Drag and drop categories or rebind parenting below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loadingStockGroups ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading groups...</div>
          ) : stockGroupsTree.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No stock categories configured yet. Click "New Stock Group" to initialize.
            </div>
          ) : (
            renderTree(stockGroupsTree)
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>{editingId ? 'Edit Stock Group' : 'New Stock Group'}</CardTitle>
              <CardDescription>Setup nesting levels for category codes.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Group Category Name</label>
                  <Input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Raw Materials"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Parent Category</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="">(None - Primary Group)</option>
                    {stockGroups
                      .filter((g) => g.id !== editingId)
                      .map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                  </select>
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
                <Button type="submit">Save Category</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
