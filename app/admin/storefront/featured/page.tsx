'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, X, Search, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SortableList } from '@/components/admin/SortableList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Product, Featured as FeaturedDoc } from '@/lib/types';

export default function FeaturedPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<FeaturedDoc | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/featured').then((r) => r.json()),
    ])
      .then(([prods, feat]) => {
        if (Array.isArray(prods)) setProducts(prods);
        if (feat && !feat.error) {
          setFeatured(feat as FeaturedDoc);
          setSelectedIds(Array.isArray(feat.productIds) ? feat.productIds : []);
        }
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setIsLoading(false));
  }, []);

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => productById.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [selectedIds, productById]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !selectedIds.includes(p.id))
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          (p.categoryName ?? '').toLowerCase().includes(q)
        );
      })
      .slice(0, 30);
  }, [products, selectedIds, query]);

  function add(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setIsDirty(true);
  }

  function remove(id: string) {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    setIsDirty(true);
  }

  function reorderItems(items: Product[]) {
    setSelectedIds(items.map((p) => p.id));
    setIsDirty(true);
  }

  async function save() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/featured', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: selectedIds }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setFeatured(data);
      setIsDirty(false);
      toast.success('Featured products saved');
    } catch (err: any) {
      toast.error(err.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Featured products
            </h1>
            <p className="mt-1 text-muted-foreground">
              Pick the products that appear in the &ldquo;Featured for businesses&rdquo;
              homepage section. Drag to reorder.
            </p>
          </div>
          <Button
            onClick={save}
            disabled={!isDirty || isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Picker */}
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold">Browse products</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or category…"
                  className="pl-10"
                />
              </div>
              <ul className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No matches.
                  </li>
                ) : (
                  searchResults.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 rounded-md border border-transparent px-2 py-2 transition-colors hover:border-border hover:bg-secondary/40"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-secondary">
                        {p.images?.[0] && (
                          <Image
                            src={p.images[0]}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.categoryName ?? '—'} · ₹{p.price}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => add(p.id)}
                        className="gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Selected */}
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  Selected ({selectedProducts.length})
                </h2>
                {isDirty && (
                  <span className="text-[11px] font-medium text-amber-600">
                    Unsaved changes
                  </span>
                )}
              </div>
              {selectedProducts.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-secondary/40 p-8 text-center text-xs text-muted-foreground">
                  No products selected. Pick from the list on the left to feature
                  them on the homepage.
                </div>
              ) : (
                <div className="max-h-[480px] overflow-y-auto pr-1">
                  <SortableList
                    items={selectedProducts}
                    onReorder={reorderItems}
                    renderItem={(p, handle) => (
                      <div className="flex items-center gap-3 rounded-md border border-border bg-background p-2">
                        <div className="flex items-center">{handle}</div>
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-secondary">
                          {p.images?.[0] && (
                            <Image
                              src={p.images[0]}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {p.categoryName ?? '—'} · ₹{p.price}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(p.id)}
                          aria-label="Remove from featured"
                          className="text-muted-foreground hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
