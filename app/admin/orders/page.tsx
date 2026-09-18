"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Order } from '@/lib/types';
import { Eye, ExternalLink, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Tracking URL dialog state
  const [shippingTarget, setShippingTarget] = useState<{ orderId: string } | null>(null);
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isShipping, setIsShipping] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-700 border-green-200',
      processing: 'bg-primary/15 text-primary border-primary/30',
      shipped: 'bg-purple-100 text-purple-700 border-purple-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status] || 'bg-secondary/60 text-foreground';
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === 'shipped') {
      // Show tracking URL dialog instead of saving immediately
      setShippingTarget({ orderId });
      setTrackingUrl('');
      setTrackingError('');
      return;
    }
    await saveStatusUpdate(orderId, newStatus);
  };

  const saveStatusUpdate = async (orderId: string, newStatus: string, url?: string) => {
    const payload: Record<string, string> = { status: newStatus };
    if (url) payload.trackingUrl = url;

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Failed to update order');
    }

    const updated = await res.json();
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder((prev) => prev ? { ...prev, ...updated } : prev);
    }
  };

  const handleConfirmShipped = async () => {
    if (!trackingUrl.trim()) {
      setTrackingError('Tracking URL is required');
      return;
    }
    if (!shippingTarget) return;

    setIsShipping(true);
    setTrackingError('');
    try {
      await saveStatusUpdate(shippingTarget.orderId, 'shipped', trackingUrl.trim());
      setShippingTarget(null);
    } catch (err: any) {
      setTrackingError(err.message || 'Failed to update status');
    } finally {
      setIsShipping(false);
    }
  };

  const handleDelete = (order: Order) => {
    setDeleteTarget(order);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/orders/${deleteTarget.id}`, { method: 'DELETE' });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === deleteTarget.id
            ? { ...o, deletedAt: new Date().toISOString() } as any
            : o
        )
      );
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error('Failed to delete order', err);
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (order: any) => (
        <div className="flex items-center gap-2">
          <span>{order.orderNumber}</span>
          {order.deletedAt && (
            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[10px]">
              Deleted
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (order: Order) => (
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (order: Order) => `${order.items.length} items`,
    },
    {
      key: 'total',
      label: 'Total',
      render: (order: Order) => <span className="font-semibold">₹{order.total.toFixed(2)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (order: Order) => (
        <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value)}>
          <SelectTrigger className="w-36">
            <Badge className={getStatusColor(order.status)} variant="outline">
              {order.status}
            </Badge>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (order: Order) => new Date(order.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: '',
      render: (order: any) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)} className="gap-2">
            <Eye className="w-4 h-4" />
            View
          </Button>
          {!order.deletedAt && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(order)}
              className="gap-1 text-muted-foreground hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <DataTable data={orders} columns={columns} searchPlaceholder="Search orders..." />
        )}

        {/* Tracking URL Dialog */}
        <Dialog
          open={!!shippingTarget}
          onOpenChange={(open) => { if (!open) setShippingTarget(null); }}
        >
          <DialogContent className="sm:max-w-[440px]">
            <DialogHeader>
              <DialogTitle>Enter Tracking URL</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                A tracking URL is required to mark this order as shipped. Paste the courier
                tracking link below.
              </p>
              <div className="space-y-2">
                <Label htmlFor="trackingUrl">Tracking URL</Label>
                <Input
                  id="trackingUrl"
                  placeholder="https://track.courier.com/..."
                  value={trackingUrl}
                  onChange={(e) => {
                    setTrackingUrl(e.target.value);
                    if (trackingError) setTrackingError('');
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmShipped(); }}
                />
                {trackingError && (
                  <p className="text-sm text-red-500">{trackingError}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShippingTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmShipped} disabled={isShipping}>
                {isShipping ? 'Saving...' : 'Mark as Shipped'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Detail Dialog */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/40 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-semibold">{selectedOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>{selectedOrder.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-semibold">{selectedOrder.customerName}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Order Date</p>
                    <p className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  {selectedOrder.trackingUrl && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Tracking</p>
                      <a
                        href={selectedOrder.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                      >
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        {selectedOrder.trackingUrl}
                      </a>
                    </div>
                  )}
                </div>

                {(selectedOrder.shippingAddress || selectedOrder.notes) && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {selectedOrder.shippingAddress && (
                      <div className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-2">Contact & delivery</h3>
                        <div className="text-sm text-foreground space-y-1">
                          {selectedOrder.shippingAddress.phone && (
                            <p>
                              <span className="text-muted-foreground">Phone: </span>
                              <a
                                href={`tel:${selectedOrder.shippingAddress.phone}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {selectedOrder.shippingAddress.phone}
                              </a>
                            </p>
                          )}
                          {selectedOrder.shippingAddress.email && (
                            <p>
                              <span className="text-muted-foreground">Email: </span>
                              <a
                                href={`mailto:${selectedOrder.shippingAddress.email}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {selectedOrder.shippingAddress.email}
                              </a>
                            </p>
                          )}
                          {selectedOrder.shippingAddress.address && (
                            <p className="pt-1 text-foreground">
                              {selectedOrder.shippingAddress.address}
                              {selectedOrder.shippingAddress.city &&
                                `, ${selectedOrder.shippingAddress.city}`}
                              {selectedOrder.shippingAddress.state &&
                                `, ${selectedOrder.shippingAddress.state}`}
                              {selectedOrder.shippingAddress.zipCode &&
                                ` ${selectedOrder.shippingAddress.zipCode}`}
                              {selectedOrder.shippingAddress.country &&
                                `, ${selectedOrder.shippingAddress.country}`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedOrder.notes && (
                      <div className="rounded-lg border p-4">
                        <h3 className="font-semibold mb-2">Customer notes</h3>
                        <p className="whitespace-pre-wrap text-sm text-foreground">
                          {selectedOrder.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{(item.quantity * item.price).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="font-bold text-right">Total</TableCell>
                          <TableCell className="text-right font-bold">₹{selectedOrder.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <ConfirmDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Order"
          description={`Are you sure you want to delete order "${deleteTarget?.orderNumber}"? The order will be hidden from the dashboard but still visible in this list.`}
        />
      </div>
    </AdminLayout>
  );
}
