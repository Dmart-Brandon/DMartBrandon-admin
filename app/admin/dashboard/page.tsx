"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Card } from '@/components/ui/card';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Clock,
  Star,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardStats, Order, Product } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ totalOrders: 0, pendingOrders: 0, totalRevenue: 0, totalProducts: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seedOpen, setSeedOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<
    { kind: 'success' | 'error'; text: string } | null
  >(null);

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Seed failed');
      }
      setSeedMessage({
        kind: 'success',
        text: `Seeded ${data.categories} categories and ${data.products} products.`,
      });
      setSeedOpen(false);
      fetchDashboardData();
    } catch (err: any) {
      setSeedMessage({
        kind: 'error',
        text: err.message || 'Seed failed',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, ordersRes, productsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/orders'),
        fetch('/api/products'),
      ]);
      const [statsData, ordersData, productsData] = await Promise.all([
        statsRes.json(),
        ordersRes.json(),
        productsRes.json(),
      ]);

      setStats({
        totalOrders: statsData.totalOrders ?? 0,
        pendingOrders: statsData.pendingOrders ?? 0,
        totalRevenue: statsData.totalRevenue ?? 0,
        totalProducts: statsData.totalProducts ?? 0,
      });
      const allOrders: any[] = Array.isArray(ordersData) ? ordersData : [];
      setRecentOrders(allOrders.filter((o) => !o.deletedAt).slice(0, 5));
      const products: Product[] = Array.isArray(productsData) ? productsData : [];
      setLowStockProducts(products.filter((p) => p.stock < 50));
      setFeaturedProducts(products.filter((p) => p.featured));
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-700',
      processing: 'bg-primary/15 text-primary',
      pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-secondary/60 text-foreground';
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your store. Use the seed button to populate sample
              produce on a fresh setup.
            </p>
          </div>
          {/* <Button
            variant="outline"
            onClick={() => {
              setSeedMessage(null);
              setSeedOpen(true);
            }}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Seed sample data
          </Button> */}
        </div>

        {seedMessage && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              seedMessage.kind === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {seedMessage.text}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total Revenue"
                value={`₹${(stats.totalRevenue ?? 0).toFixed(2)}`}
                icon={DollarSign}
                trend={{ value: 12.5, isPositive: true }}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
              />
              <StatsCard
                title="Total Orders"
                value={stats.totalOrders}
                icon={ShoppingCart}
                trend={{ value: 8.2, isPositive: true }}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
              />
              <StatsCard
                title="Pending Orders"
                value={stats.pendingOrders}
                icon={Clock}
                iconColor="text-amber-600"
                iconBgColor="bg-amber-50"
              />
              <StatsCard
                title="Total Products"
                value={stats.totalProducts}
                icon={Package}
                trend={{ value: 4.1, isPositive: true }}
                iconColor="text-primary"
                iconBgColor="bg-primary/10"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                {recentOrders.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No orders yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentOrders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-secondary/40">
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">₹{(order.total ?? 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Low Stock Alert</h2>
                {lowStockProducts.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">All products are well stocked</p>
                ) : (
                  <div className="space-y-3">
                    {lowStockProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-secondary/60 rounded-lg overflow-hidden">
                            <img src={product.images?.[0] ?? ''} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.categoryName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">{product.stock} left</p>
                          <p className="text-xs text-muted-foreground">Low stock</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <h2 className="text-xl font-semibold">Featured Products</h2>
                <Badge variant="secondary">{featuredProducts.length}</Badge>
              </div>
              {featuredProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No featured products yet. Mark products as featured from the Products page.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 bg-secondary/40 rounded-lg hover:bg-secondary/60 transition-colors">
                      <div className="w-14 h-14 bg-secondary/60 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={product.images?.[0] ?? ''} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.categoryName}</p>
                        <p className="text-sm font-semibold text-green-600">₹{(product.price ?? 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sales Overview</h2>
              <div className="h-64 flex items-center justify-center bg-secondary/40 rounded-lg">
                <p className="text-muted-foreground">Chart visualization placeholder</p>
              </div>
            </Card>
          </>
        )}

        <Dialog open={seedOpen} onOpenChange={setSeedOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Seed sample produce data?</DialogTitle>
              <DialogDescription>
                Upserts 4 categories (Fruits, Vegetables, Leafy Greens, Herbs)
                and 6 sample products. This is idempotent — running it again
                only updates existing entries, no duplicates.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSeedOpen(false)}
                disabled={isSeeding}
              >
                Cancel
              </Button>
              <Button onClick={handleSeed} disabled={isSeeding}>
                {isSeeding ? 'Seeding…' : 'Yes, seed data'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
