"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Eye, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { QuoteRequest } from '@/lib/types';

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<QuoteRequest | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/quotes');
      const data = await res.json();
      setQuotes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load quotes', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      responded: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      closed: 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[status] || 'bg-secondary/60 text-foreground';
  };

  const handleStatusChange = async (quoteId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setQuotes((prev) =>
          prev.map((q) => (q.id === quoteId ? { ...q, status: newStatus as any } : q))
        );
        if (selectedQuote?.id === quoteId) {
          setSelectedQuote((prev) => prev ? { ...prev, status: newStatus as any } : prev);
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = (quote: QuoteRequest) => {
    setDeleteTarget(quote);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/quotes/${deleteTarget.id}`, { method: 'DELETE' });
      setQuotes((prev) => prev.filter((q) => q.id !== deleteTarget.id));
      setIsDeleteOpen(false);
    } catch (err) {
      console.error('Failed to delete quote', err);
    }
  };

  const columns = [
    {
      key: 'customerName',
      label: 'Customer',
      render: (quote: QuoteRequest) => (
        <div>
          <p className="font-medium">{quote.customerName}</p>
          <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'businessName',
      label: 'Business',
      render: (quote: QuoteRequest) => quote.businessName || '—',
    },
    {
      key: 'items',
      label: 'Items',
      render: (quote: QuoteRequest) => `${quote.items.length} items`,
    },
    {
      key: 'cartTotal',
      label: 'Cart Total',
      render: (quote: QuoteRequest) => (
        <span className="font-semibold">₹{quote.cartTotal.toFixed(2)}</span>
      ),
    },
    {
      key: 'expectedFrequency',
      label: 'Frequency',
      render: (quote: QuoteRequest) => (
        <span className="capitalize">{quote.expectedFrequency || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (quote: QuoteRequest) => (
        <Select value={quote.status} onValueChange={(value) => handleStatusChange(quote.id, value)}>
          <SelectTrigger className="w-32">
            <Badge className={getStatusColor(quote.status)} variant="outline">
              {quote.status}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (quote: QuoteRequest) =>
        quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : '—',
    },
    {
      key: 'actions',
      label: '',
      render: (quote: QuoteRequest) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedQuote(quote); setIsDetailOpen(true); }}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(quote)}
            className="gap-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quote Requests</h1>
          <p className="text-muted-foreground mt-1">Manage bulk quote requests from customers</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <DataTable data={quotes} columns={columns} searchPlaceholder="Search quotes..." />
        )}

        {/* Quote Detail Dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Quote Request Details</DialogTitle>
            </DialogHeader>
            {selectedQuote && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/40 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-semibold">{selectedQuote.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedQuote.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedQuote.status)} variant="outline">
                      {selectedQuote.status}
                    </Badge>
                  </div>
                  {selectedQuote.customerPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <a
                        href={`tel:${selectedQuote.customerPhone}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {selectedQuote.customerPhone}
                      </a>
                    </div>
                  )}
                  {selectedQuote.businessName && (
                    <div>
                      <p className="text-sm text-muted-foreground">Business</p>
                      <p className="font-semibold">{selectedQuote.businessName}</p>
                    </div>
                  )}
                  {selectedQuote.gstin && (
                    <div>
                      <p className="text-sm text-muted-foreground">GSTIN</p>
                      <p className="font-mono text-sm">{selectedQuote.gstin}</p>
                    </div>
                  )}
                  {selectedQuote.expectedFrequency && (
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Frequency</p>
                      <p className="font-semibold capitalize">{selectedQuote.expectedFrequency}</p>
                    </div>
                  )}
                  {selectedQuote.createdAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Requested On</p>
                      <p className="font-semibold">
                        {new Date(selectedQuote.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {selectedQuote.notes && (
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {selectedQuote.notes}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Requested Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedQuote.items.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>
                              {item.quantity} {item.unit || 'pcs'}
                            </TableCell>
                            <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                              ₹{(item.quantity * item.price).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="font-bold text-right">
                            Cart Total
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{selectedQuote.cartTotal.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Quote Request"
          description={`Are you sure you want to delete the quote request from "${deleteTarget?.customerName}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
}
