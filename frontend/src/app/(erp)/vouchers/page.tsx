'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { voucherService, AuditTrailLog } from '@/services/voucher.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Ban,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
  HelpCircle,
  FileText,
  User,
  Activity,
  History,
  Loader2,
  Printer,
} from 'lucide-react';
import type { Voucher, VoucherType, VoucherStatus } from '@smarterp/shared';

export default function DayBookPage() {
  const router = useRouter();

  // Lists
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VoucherStatus | ''>('');
  const [voucherType, setVoucherType] = useState<VoucherType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog / Action Focus states
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [isActioning, setIsActioning] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditTrailLog[]>([]);

  // Modals status
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Load list
  async function loadVouchers() {
    setLoading(true);
    try {
      const data = await voucherService.getVouchers({
        search: search.trim() || undefined,
        status: status || undefined,
        voucherType: voucherType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 50,
      });
      setVouchers(data.vouchers);
      setTotalCount(data.totalCount);
    } catch (err) {
      toast.error('Failed to load transaction Day Book.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, [search, status, voucherType, startDate, endDate]);

  // Load single voucher entries
  const handleViewDetail = async (id: string) => {
    try {
      const detail = await voucherService.getVoucher(id);
      setSelectedVoucher(detail);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load transaction ledger entries.');
    }
  };

  // Load audit trail logs
  const handleViewAudit = async (id: string) => {
    try {
      const logs = await voucherService.getAuditTrail(id);
      setAuditLogs(logs);
      setSelectedVoucherId(id);
      setShowAuditModal(true);
    } catch (err) {
      toast.error('Failed to retrieve audit trail history.');
    }
  };

  // Cancel Voucher submit
  const handleCancelVoucherSubmit = async () => {
    if (!selectedVoucherId || isActioning) return;
    setIsActioning(true);
    try {
      await voucherService.cancelVoucher(selectedVoucherId, cancelReason.trim() || undefined);
      toast.success('Voucher cancelled successfully.', {
        description: 'Ledger balance caches have been neutralized.',
      });
      setShowCancelModal(false);
      setCancelReason('');
      loadVouchers();
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Cancellation failed';
      toast.error('Failed to cancel voucher', { description: message });
    } finally {
      setIsActioning(false);
    }
  };

  // Reverse Voucher submit
  const handleReverseVoucherSubmit = async () => {
    if (!selectedVoucherId || isActioning) return;
    setIsActioning(true);
    try {
      const reversing = await voucherService.reverseVoucher(selectedVoucherId, reverseReason.trim() || undefined);
      toast.success('Voucher reversed successfully!', {
        description: `Created counter-balancing entry: ${reversing.voucherNumber}`,
      });
      setShowReverseModal(false);
      setReverseReason('');
      loadVouchers();
    } catch (err: any) {
      const message = err.response?.data?.error?.message || err.message || 'Reversal failed';
      toast.error('Failed to reverse voucher', { description: message });
    } finally {
      setIsActioning(false);
    }
  };

  // Trigger PDF print/download pipeline
  const handlePrintVoucher = async (id: string) => {
    const activeToast = toast.loading('Compiling Tax Invoice PDF...');
    try {
      await voucherService.printInvoicePdf(id);
      toast.success('Tax Invoice compiled successfully!', { id: activeToast });
    } catch (err: any) {
      toast.error('Failed to compile PDF Invoice', {
        id: activeToast,
        description: err.message || 'Stream processing failed.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-2">
      {/* Day Book Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-card/45 backdrop-blur-md p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              Day Book
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold border bg-muted text-muted-foreground uppercase tracking-wide">
                Transactions ({totalCount})
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              General ledger transaction logs, cancellation and reversal history.
            </p>
          </div>
        </div>

        <Link href="/vouchers/new">
          <Button size="sm" className="h-9 gap-1 text-xs">
            <Plus className="h-4 w-4" /> Create Voucher (Alt+N)
          </Button>
        </Link>
      </div>

      {/* Filter Options Controls */}
      <div className="glass rounded-xl p-4 border border-border/40 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search voucher number, narration..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 h-9 text-xs"
            />
          </div>

          {/* Type Select */}
          <select
            value={voucherType}
            onChange={(e) => setVoucherType(e.target.value as any)}
            className="bg-background/50 border border-border/60 rounded-md h-9 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Voucher Types</option>
            <option value="CONTRA">CONTRA</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="JOURNAL">JOURNAL</option>
            <option value="SALES">SALES</option>
            <option value="PURCHASE">PURCHASE</option>
          </select>

          {/* Status Select */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="bg-background/50 border border-border/60 rounded-md h-9 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="POSTED">POSTED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REVERSED">REVERSED</option>
          </select>

          {/* Refresh list button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadVouchers}
            className="h-9 gap-1 text-xs bg-background/50"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload List
          </Button>
        </div>

        {/* Date Filters row */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-muted-foreground">Period:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">From</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background/50 h-8 w-36 text-xs p-1"
            />
            <span className="text-muted-foreground">To</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background/50 h-8 w-36 text-xs p-1"
            />
          </div>
        </div>
      </div>

      {/* Vouchers Table List */}
      <div className="glass rounded-xl border border-border/40 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs">Loading transaction logs...</span>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-semibold">No transactions recorded</p>
            <p className="text-xs mt-1">Create a new voucher or adjust filters to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border/50 text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none">
                  <th className="p-3">Date</th>
                  <th className="p-3">Voucher #</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {vouchers.map((vch) => (
                  <tr key={vch.id} className="hover:bg-card/40 transition-colors">
                    <td className="p-3 whitespace-nowrap font-medium text-foreground">{vch.date}</td>
                    <td className="p-3 whitespace-nowrap font-semibold text-primary font-mono">{vch.voucherNumber}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded font-bold border text-[9px] uppercase tracking-wide bg-background">
                        {vch.voucherType}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground max-w-xs truncate">{vch.referenceNumber || '—'}</td>
                    <td className="p-3 text-right font-bold text-foreground">₹{vch.totalAmount.toFixed(2)}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wider ${
                          vch.status === 'POSTED'
                            ? 'bg-green-500/10 text-green-500 border-green-500/30'
                            : vch.status === 'CANCELLED'
                            ? 'bg-red-500/10 text-red-500 border-red-500/30'
                            : vch.status === 'REVERSED'
                            ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30'
                            : 'bg-orange-500/10 text-orange-500 border-orange-500/30'
                        }`}
                      >
                        {vch.status}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap flex gap-1 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleViewDetail(vch.id)}
                        className="h-7 text-[10px]"
                      >
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handlePrintVoucher(vch.id)}
                        className="h-7 text-[10px] gap-1"
                      >
                        <Printer className="h-3 w-3" /> Print
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleViewAudit(vch.id)}
                        className="h-7 text-[10px] gap-1"
                      >
                        <History className="h-3 w-3" /> Audit
                      </Button>
                      {vch.status === 'POSTED' && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedVoucherId(vch.id);
                              setShowCancelModal(true);
                            }}
                            className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              setSelectedVoucherId(vch.id);
                              setShowReverseModal(true);
                            }}
                            className="h-7 text-[10px] text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
                          >
                            Reverse
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dialog 1: Voucher Details Modal ────────────────────── */}
      {showDetailModal && selectedVoucher && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-popover text-popover-foreground border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  Voucher Details: {selectedVoucher.voucherNumber}
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold border uppercase tracking-wider bg-muted text-muted-foreground">
                    {selectedVoucher.voucherType}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Posted date: {selectedVoucher.date}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)} className="h-8 w-8 rounded-full">✕</Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-5 text-xs">
              {/* Entries list */}
              <div className="flex flex-col gap-2">
                <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Ledger Postings</span>
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground text-[10px]">
                      <tr>
                        <th className="p-2.5 w-16">Dr / Cr</th>
                        <th className="p-2.5">Account Ledger</th>
                        <th className="p-2.5 text-right w-36">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {selectedVoucher.entries.map((e: any) => (
                        <tr key={e.id} className="hover:bg-card/30">
                          <td className="p-2.5 font-bold text-foreground">
                            {e.entryType === 'DEBIT' ? 'Dr' : 'Cr'}
                          </td>
                          <td className="p-2.5 font-medium text-foreground">{e.ledger?.name || 'Loading...'}</td>
                          <td className="p-2.5 text-right font-bold text-foreground">₹{e.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Stock Movements */}
              {selectedVoucher.stockEntries && selectedVoucher.stockEntries.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Stock Movements Allocation</span>
                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/40 font-semibold text-muted-foreground text-[10px]">
                        <tr>
                          <th className="p-2.5">Stock Item</th>
                          <th className="p-2.5 text-center">Movement</th>
                          <th className="p-2.5 text-center w-20">Qty</th>
                          <th className="p-2.5 text-right w-24">Rate</th>
                          <th className="p-2.5 text-right w-28">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {selectedVoucher.stockEntries.map((s: any) => (
                          <tr key={s.id} className="hover:bg-card/30">
                            <td className="p-2.5 font-medium text-foreground">{s.stockItem?.name || 'Loading...'}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${s.movementType === 'INWARD' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                                {s.movementType}
                              </span>
                            </td>
                            <td className="p-2.5 text-center text-foreground">{s.qty}</td>
                            <td className="p-2.5 text-right text-foreground">₹{s.rate.toFixed(2)}</td>
                            <td className="p-2.5 text-right font-bold text-foreground">₹{s.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Narration summary */}
              {selectedVoucher.narration && (
                <div className="flex gap-2 bg-muted/30 p-3 rounded-lg border border-border/50 items-start">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[10px] uppercase text-muted-foreground mb-0.5">Narration</span>
                    <span className="text-foreground">{selectedVoucher.narration}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePrintVoucher(selectedVoucher.id)}
                className="gap-1.5"
              >
                <Printer className="h-4 w-4" /> Print Tax Invoice
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDetailModal(false)}>Close View</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog 2: Voucher Audit History Logs Modal ─────────── */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-popover text-popover-foreground border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-primary" />
                  Audit Trail Reconstruction
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Cryptographic log of all mutations for current entity.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAuditModal(false)} className="h-8 w-8 rounded-full">✕</Button>
            </div>
            
            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-xs">
              {auditLogs.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">No audit entries found.</div>
              ) : (
                <div className="relative border-l border-border/60 ml-3 pl-6 flex flex-col gap-6">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-[30px] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-popover" />
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {log.createdAt}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Actor: <span className="font-medium text-foreground">{log.userId}</span></span>
                          </div>
                          {log.ipAddress && (
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              <span>IP Context: <span className="font-medium text-foreground">{log.ipAddress}</span></span>
                            </div>
                          )}
                          {log.reason && (
                            <div className="flex items-start gap-1 bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-950/40 p-2 rounded mt-1 text-foreground">
                              <Info className="h-3.5 w-3.5 text-yellow-600 mt-0.5 shrink-0" />
                              <span>Reason: "{log.reason}"</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/40 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowAuditModal(false)}>Close Logs</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog 3: Cancel Confirmation Modal ───────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-popover text-popover-foreground border rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-500" />
                Cancel Voucher
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCancelModal(false)} className="h-8 w-8 rounded-full">✕</Button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Cancelling this voucher will **permanently set all entry amounts to zero** and subtract the transaction value from the ledger balance cache. The invoice number remains reserved for audit integrity.
              </p>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
                <Input
                  id="cancel-reason"
                  placeholder="e.g. Typographical error / duplicate entry"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="bg-background/50 h-9"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>Keep Active</Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isActioning}
                onClick={handleCancelVoucherSubmit}
              >
                {isActioning ? 'Processing...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog 4: Reverse Confirmation Modal ──────────────── */}
      {showReverseModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-popover text-popover-foreground border rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-indigo-500" />
                Reverse Voucher
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowReverseModal(false)} className="h-8 w-8 rounded-full">✕</Button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Reversing this voucher will create a **new offsetting Counter-Journal entry** inverting all debits and credits, then transition the original voucher status to `REVERSED`.
              </p>
              
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reverse-reason">Reason for Reversal</Label>
                <Input
                  id="reverse-reason"
                  placeholder="e.g. Return of goods / correction entry"
                  value={reverseReason}
                  onChange={(e) => setReverseReason(e.target.value)}
                  className="bg-background/50 h-9"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/40 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowReverseModal(false)}>Dismiss</Button>
              <Button
                size="sm"
                disabled={isActioning}
                onClick={handleReverseVoucherSubmit}
                className="bg-indigo-600 text-white hover:bg-indigo-500"
              >
                {isActioning ? 'Generating Reversal...' : 'Confirm Reversal'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
