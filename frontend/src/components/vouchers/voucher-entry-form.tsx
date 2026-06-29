'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCommand } from '@/hooks/use-command';
import { useKeyboard } from '@/providers/keyboard-provider';
import { ledgerService } from '@/services/ledger.service';
import { stockItemService } from '@/services/stock-item.service';
import { voucherService } from '@/services/voucher.service';
import { taxRateService } from '@/services/tax-rate.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Trash2,
  BookOpen,
  Keyboard,
  Info,
  History,
  CheckCircle,
} from 'lucide-react';
import type {
  Ledger,
  StockItem,
  TaxRate,
  VoucherType,
  CreateVoucherInput,
} from '@smarterp/shared';

interface VoucherEntryRow {
  ledgerId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  narration?: string;
}

interface StockEntryRow {
  stockItemId: string;
  qty: number;
  rate: number;
  amount: number;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export default function VoucherEntryForm() {
  const router = useRouter();
  const keyboard = useKeyboard();

  // Active state
  const [voucherType, setVoucherType] = useState<'CONTRA' | 'PAYMENT' | 'RECEIPT' | 'JOURNAL' | 'SALES' | 'PURCHASE'>('JOURNAL');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lists
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [entries, setEntries] = useState<VoucherEntryRow[]>([
    { ledgerId: '', entryType: 'DEBIT', amount: 0 },
    { ledgerId: '', entryType: 'CREDIT', amount: 0 },
  ]);
  const [stockEntries, setStockEntries] = useState<StockEntryRow[]>([]);

  // Autocomplete focus states
  const [focusedRowIndex, setFocusedRowIndex] = useState<number | null>(null);
  const [focusedStockRowIndex, setFocusedStockRowIndex] = useState<number | null>(null);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Load masters on mount
  useEffect(() => {
    async function loadData() {
      try {
        const loadedLedgers = await ledgerService.getLedgers();
        setLedgers(loadedLedgers);
        
        const loadedStock = await stockItemService.getStockItems();
        setStockItems(loadedStock);

        const loadedTax = await taxRateService.getTaxRates();
        setTaxRates(loadedTax);
      } catch (err) {
        toast.error('Failed to load ledger or stock item master lists.');
      }
    }
    loadData();
  }, []);

  // Keyboard layout context registers
  useEffect(() => {
    // Set keyboard scope context
    keyboard.context.push('voucher:entry');
    keyboard.context.push('editing');

    return () => {
      keyboard.context.pop('voucher:entry');
      keyboard.context.pop('editing');
    };
  }, [keyboard]);

  // Hook command registrations from central manifest (F4-F9 switcher + Alt+S save)
  useCommand('voucher.switch.contra', () => switchVoucherType('CONTRA'));
  useCommand('voucher.switch.payment', () => switchVoucherType('PAYMENT'));
  useCommand('voucher.switch.receipt', () => switchVoucherType('RECEIPT'));
  useCommand('voucher.switch.journal', () => switchVoucherType('JOURNAL'));
  useCommand('voucher.switch.sales', () => switchVoucherType('SALES'));
  useCommand('voucher.switch.purchase', () => switchVoucherType('PURCHASE'));
  useCommand('form.save', () => handlePostVoucher());

  // Function to switch voucher types cleanly
  function switchVoucherType(type: 'CONTRA' | 'PAYMENT' | 'RECEIPT' | 'JOURNAL' | 'SALES' | 'PURCHASE') {
    setVoucherType(type);
    toast.info(`Switched to ${type} Voucher mode`, {
      description: `Form adjusted to ${type} constraints.`,
    });

    // Sales/Purchase default to including inventory rows, others clear it
    if (type === 'SALES' || type === 'PURCHASE') {
      if (stockEntries.length === 0) {
        setStockEntries([{ stockItemId: '', qty: 0, rate: 0, amount: 0, cgstRate: 0, sgstRate: 0, igstRate: 0 }]);
      }
    } else {
      setStockEntries([]);
    }
  }

  // Calculate Running double-entry balances
  const totalDebits = entries
    .filter(e => e.entryType === 'DEBIT')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalCredits = entries
    .filter(e => e.entryType === 'CREDIT')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const balanceDiff = Math.abs(totalDebits - totalCredits);

  // Calculate Running stock subtotal
  const totalStockAmount = stockEntries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  // Manage double-entry rows
  const addEntryRow = () => {
    // Tally auto-balancing helper: automatically populate new row amount with current imbalance diff!
    const defaultType = totalDebits > totalCredits ? 'CREDIT' : 'DEBIT';
    setEntries([
      ...entries,
      { ledgerId: '', entryType: defaultType, amount: balanceDiff || 0 },
    ]);
  };

  const removeEntryRow = (idx: number) => {
    if (entries.length <= 2) {
      toast.error('A voucher requires at least two ledger entry rows.');
      return;
    }
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const updateEntryRow = (idx: number, field: keyof VoucherEntryRow, val: any) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: val };
    setEntries(updated);
  };

  // Manage stock movement rows
  const addStockRow = () => {
    setStockEntries([
      ...stockEntries,
      { stockItemId: '', qty: 0, rate: 0, amount: 0, cgstRate: 0, sgstRate: 0, igstRate: 0 },
    ]);
  };

  const removeStockRow = (idx: number) => {
    setStockEntries(stockEntries.filter((_, i) => i !== idx));
  };

  const updateStockRow = (idx: number, field: keyof StockEntryRow, val: any) => {
    const updated = [...stockEntries];
    let row = { ...updated[idx], [field]: val };

    // Calculate subtotal on Qty/Rate change
    if (field === 'qty' || field === 'rate') {
      row.amount = Number((Number(row.qty || 0) * Number(row.rate || 0)).toFixed(2));
    }

    updated[idx] = row;
    setStockEntries(updated);
  };

  // Autoselect stock item details (pricing + GST rates)
  const handleStockSelect = (idx: number, item: StockItem) => {
    const matchedTax = taxRates.find(t => t.id === item.taxRateId);
    const cgst = Number(matchedTax?.cgstRate || 0);
    const sgst = Number(matchedTax?.sgstRate || 0);
    const igst = Number(matchedTax?.igstRate || 0);
    const standardRate = voucherType === 'SALES'
      ? Number(item.standardSellingPrice || 0)
      : Number(item.standardPurchasePrice || 0);

    const updated = [...stockEntries];
    updated[idx] = {
      stockItemId: item.id,
      qty: 1,
      rate: standardRate,
      amount: standardRate,
      cgstRate: cgst,
      sgstRate: sgst,
      igstRate: igst,
    };
    setStockEntries(updated);
    setFocusedStockRowIndex(null);
  };

  // Submit Posting request to backend
  const handlePostVoucher = async () => {
    if (isSubmitting) return;

    // Front-end balanced check
    if (Math.round(totalDebits * 100) !== Math.round(totalCredits * 100)) {
      toast.error('Voucher is unbalanced!', {
        description: `Total Debits (${totalDebits}) must equal Total Credits (${totalCredits}). difference: ${balanceDiff}`,
      });
      return;
    }

    // Verify all rows have selected ledgers
    const hasEmptyLedger = entries.some(e => !e.ledgerId);
    if (hasEmptyLedger) {
      toast.error('Please select a valid ledger account for all entry rows.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateVoucherInput = {
        date,
        voucherType,
        narration: narration.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        entries: entries.map(e => ({
          ledgerId: e.ledgerId,
          entryType: e.entryType,
          amount: Number(e.amount),
          narration: e.narration?.trim() || undefined,
        })),
        stockEntries: (voucherType === 'SALES' || voucherType === 'PURCHASE') && stockEntries.length > 0
          ? stockEntries.map(s => ({
              stockItemId: s.stockItemId,
              qty: Number(s.qty),
              rate: Number(s.rate),
              amount: Number(s.amount),
              cgstRate: s.cgstRate,
              sgstRate: s.sgstRate,
              igstRate: s.igstRate,
            }))
          : undefined,
      };

      const result = await voucherService.createVoucher(payload, false);
      toast.success(`Voucher posted successfully!`, {
        description: `Voucher Number generated: ${result.voucherNumber}`,
      });
      
      router.push('/vouchers');
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'An unexpected error occurred';
      toast.error('Failed to post voucher', { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered lookup lists
  const filteredLedgers = ledgers.filter(l =>
    l.name.toLowerCase().includes(ledgerSearchQuery.toLowerCase())
  );

  const filteredStockItems = stockItems.filter(s =>
    s.name.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-2">
      {/* Dynamic Cursive Page Header with Voucher Badge */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-card/45 backdrop-blur-md p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Voucher Creation
              <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border bg-primary/10 text-primary uppercase tracking-wide">
                {voucherType}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rapid keyboard-first double-entry voucher entry.
            </p>
          </div>
        </div>

        {/* Cursive Hotkey Quick-info indicators */}
        <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-muted-foreground select-none">
          {['F4 Contra', 'F5 Payment', 'F6 Receipt', 'F7 Journal', 'F8 Sales', 'F9 Purchase'].map(badge => {
            const isActive = badge.toUpperCase().includes(voucherType);
            return (
              <span
                key={badge}
                className={`px-2 py-1 rounded border transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/20 text-primary border-primary/50 shadow-sm scale-105'
                    : 'bg-card/50 border-border/60'
                }`}
              >
                {badge}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Double Entry Row Forms Panel (Col Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass rounded-xl p-5 border border-border/40 shadow-sm flex flex-col gap-5">
            {/* Header Fields (Date & Reference) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-background/50 h-9"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ref">Reference Invoice #</Label>
                <Input
                  id="ref"
                  placeholder="e.g. INV-1002"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="bg-background/50 h-9"
                />
              </div>
              <div className="flex items-end justify-end">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Balance Status</span>
                  <span className={`text-base font-semibold ${balanceDiff === 0 ? 'text-green-500' : 'text-orange-500'}`}>
                    {balanceDiff === 0 ? 'Balanced ✓' : `Unbalanced (Diff: ₹${balanceDiff.toFixed(2)})`}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* ── Ledger Entries Grid ───────────────────────────── */}
            <div className="flex flex-col gap-3">
              <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Ledger Postings</span>
              
              <div className="flex flex-col gap-2">
                {entries.map((entry, idx) => (
                  <div key={idx} className="flex gap-2 items-center relative">
                    {/* Dr/Cr select */}
                    <select
                      value={entry.entryType}
                      onChange={(e) => updateEntryRow(idx, 'entryType', e.target.value as 'DEBIT' | 'CREDIT')}
                      className="bg-background/60 border border-border/60 rounded-md h-9 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary w-20"
                    >
                      <option value="DEBIT">Dr (Debit)</option>
                      <option value="CREDIT">Cr (Credit)</option>
                    </select>

                    {/* Ledger Autocomplete Selector */}
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Select Ledger Account..."
                        value={
                          focusedRowIndex === idx
                            ? ledgerSearchQuery
                            : ledgers.find(l => l.id === entry.ledgerId)?.name || ''
                        }
                        onFocus={() => {
                          setFocusedRowIndex(idx);
                          setLedgerSearchQuery('');
                        }}
                        onChange={(e) => setLedgerSearchQuery(e.target.value)}
                        className="bg-background/60 h-9 text-xs"
                      />
                      {focusedRowIndex === idx && (
                        <div className="absolute top-10 left-0 w-full bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-55 max-h-48 overflow-y-auto p-1">
                          {filteredLedgers.length === 0 ? (
                            <div className="text-[11px] text-muted-foreground p-2">No matching ledgers found</div>
                          ) : (
                            filteredLedgers.map(l => (
                              <button
                                key={l.id}
                                type="button"
                                onClick={() => {
                                  updateEntryRow(idx, 'ledgerId', l.id);
                                  setFocusedRowIndex(null);
                                }}
                                className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-primary/10 rounded transition-colors block"
                              >
                                {l.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Amount Input */}
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={entry.amount || ''}
                      onChange={(e) => updateEntryRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className="bg-background/60 h-9 w-32 text-right text-xs"
                    />

                    {/* Row delete button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEntryRow(idx)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Entry Row button */}
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEntryRow}
                  className="h-8 border-dashed gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Row
                </Button>
              </div>
            </div>

            {/* ── Inventory Entries Grid (Sales & Purchase only) ───── */}
            {(voucherType === 'SALES' || voucherType === 'PURCHASE') && (
              <>
                <Separator className="bg-border/30 mt-2" />
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Inventory Allocation</span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      Subtotal: ₹{totalStockAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {stockEntries.map((row, idx) => (
                      <div key={idx} className="flex gap-2 items-center relative">
                        {/* Stock Item Autocomplete */}
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Select Stock Item..."
                            value={
                              focusedStockRowIndex === idx
                                ? stockSearchQuery
                                : stockItems.find(s => s.id === row.stockItemId)?.name || ''
                            }
                            onFocus={() => {
                              setFocusedStockRowIndex(idx);
                              setStockSearchQuery('');
                            }}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            className="bg-background/60 h-9 text-xs"
                          />
                          {focusedStockRowIndex === idx && (
                            <div className="absolute top-10 left-0 w-full bg-popover text-popover-foreground border border-border rounded-lg shadow-xl z-55 max-h-48 overflow-y-auto p-1">
                              {filteredStockItems.length === 0 ? (
                                <div className="text-[11px] text-muted-foreground p-2">No matching stock items</div>
                              ) : (
                                filteredStockItems.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleStockSelect(idx, s)}
                                    className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-primary/10 rounded transition-colors block"
                                  >
                                    {s.name} <span className="text-[9px] text-muted-foreground">(HSN: {s.hsnCode || 'N/A'})</span>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>

                        {/* Qty */}
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={row.qty || ''}
                          onChange={(e) => updateStockRow(idx, 'qty', parseFloat(e.target.value) || 0)}
                          className="bg-background/60 h-9 w-20 text-center text-xs"
                        />

                        {/* Rate */}
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={row.rate || ''}
                          onChange={(e) => updateStockRow(idx, 'rate', parseFloat(e.target.value) || 0)}
                          className="bg-background/60 h-9 w-24 text-right text-xs"
                        />

                        {/* Total Amount (Read-only) */}
                        <div className="bg-muted/40 border border-border/50 rounded-md h-9 w-28 flex items-center justify-end px-3 text-xs font-medium text-foreground shrink-0 select-none">
                          ₹{row.amount.toFixed(2)}
                        </div>

                        {/* Delete row */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStockRow(idx)}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addStockRow}
                      className="h-8 border-dashed gap-1 text-xs"
                    >
                      <Plus className="h-3 w-3" /> Allocate Stock Item
                    </Button>
                  </div>
                </div>
              </>
            )}

            <Separator className="bg-border/30 mt-2" />

            {/* Narration Block */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="narration">Narration (Narration description summary)</Label>
              <Input
                id="narration"
                placeholder="Enter transaction narrative..."
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                className="bg-background/50 h-10"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Info & Action Controls (Col Span 1) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Totals Summary */}
          <div className="glass rounded-xl p-5 border border-border/40 shadow-sm flex flex-col gap-4">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Voucher Totals</span>
            
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Debit:</span>
                <span className="font-semibold text-foreground">₹{totalDebits.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Credit:</span>
                <span className="font-semibold text-foreground">₹{totalCredits.toFixed(2)}</span>
              </div>
              
              <Separator className="bg-border/40 my-1" />
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted-foreground uppercase">Difference:</span>
                <span className={`text-sm font-bold ${balanceDiff === 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ₹{balanceDiff.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              disabled={isSubmitting || balanceDiff !== 0}
              onClick={handlePostVoucher}
              className="w-full mt-2 font-medium tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 h-10 shadow-sm transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post Voucher (Alt+S)'
              )}
            </Button>
          </div>

          {/* Context shortcuts list */}
          <div className="glass rounded-xl p-5 border border-border/40 shadow-sm flex flex-col gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1 select-none">
              <Keyboard className="h-4 w-4" />
              <span className="font-bold uppercase tracking-wider text-[10px]">Voucher Shortcuts</span>
            </div>

            <div className="flex flex-col gap-2 text-muted-foreground">
              <div className="flex justify-between items-center">
                <span>Contra (Contra Bank-Cash):</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">F4</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Payment (Payout spend):</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">F5</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Receipt (Inward income):</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">F6</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Journal (Offset adjusts):</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">F7</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Sales (Invoicing out):</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">F8</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Purchase (Billing in):</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">F9</kbd>
              </div>
              <div className="flex justify-between items-center border-t border-border/40 pt-2">
                <span>Save/Post Voucher:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">Alt+S</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span>Discard / Cancel:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-bold text-foreground">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
