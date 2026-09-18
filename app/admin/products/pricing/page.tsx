'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Save, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PriceTier, Product } from '@/lib/types';

type RowDraft = {
  moq: number;
  stepSize: number;
  packQty: number;
  packUnit: string;
  packLabel: string;
  tiers: PriceTier[];
  dirty: boolean;
  saving: boolean;
};

function toDraft(p: Product): RowDraft {
  return {
    moq: p.moq ?? 1,
    stepSize: p.stepSize ?? 1,
    packQty: p.packSize?.qty ?? 0,
    packUnit: p.packSize?.unit ?? '',
    packLabel: p.packSize?.label ?? '',
    tiers: (p.priceTiers ?? []).map((t) => ({ ...t })),
    dirty: false,
    saving: false,
  };
}

export default function BulkPricingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          const initial: Record<string, RowDraft> = {};
          for (const p of data) initial[p.id] = toDraft(p);
          setDrafts(initial);
        }
      })
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.categoryName ?? '').toLowerCase().includes(q)
    );
  }, [products, query]);

  function patchDraft(id: string, patch: Partial<RowDraft>) {
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, ...patch, dirty: true } };
    });
  }

  function addTier(id: string) {
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const last = cur.tiers[cur.tiers.length - 1];
      const newMin = last ? last.minQty + 10 : Math.max(cur.moq + 1, 10);
      const product = products.find((p) => p.id === id);
      const newPrice = last
        ? Math.max(0, last.price - 1)
        : Math.max(0, (product?.price ?? 0) - 1);
      return {
        ...prev,
        [id]: {
          ...cur,
          tiers: [...cur.tiers, { minQty: newMin, price: newPrice }],
          dirty: true,
        },
      };
    });
  }

  function removeTier(id: string, idx: number) {
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return {
        ...prev,
        [id]: {
          ...cur,
          tiers: cur.tiers.filter((_, i) => i !== idx),
          dirty: true,
        },
      };
    });
  }

  function updateTier(
    id: string,
    idx: number,
    field: 'minQty' | 'price',
    raw: string
  ) {
    const value = parseFloat(raw);
    setDrafts((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const tiers = cur.tiers.map((t, i) =>
        i === idx ? { ...t, [field]: isNaN(value) ? 0 : value } : t
      );
      return { ...prev, [id]: { ...cur, tiers, dirty: true } };
    });
  }

  async function saveRow(id: string) {
    const draft = drafts[id];
    if (!draft) return;
    if (draft.tiers.some((t) => !t.minQty || t.minQty <= 0 || t.price < 0)) {
      toast.error('Each tier needs a positive minimum quantity and non-negative price.');
      return;
    }
    const sortedTiers = [...draft.tiers].sort((a, b) => a.minQty - b.minQty);
    const seenQty = new Set<number>();
    for (const t of sortedTiers) {
      if (seenQty.has(t.minQty)) {
        toast.error('Tier minimum quantities must be unique.');
        return;
      }
      seenQty.add(t.minQty);
    }
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], saving: true },
    }));
    try {
      const body: Record<string, unknown> = {
        moq: Math.max(1, Math.round(draft.moq)),
        stepSize: Math.max(1, Math.round(draft.stepSize)),
        priceTiers: sortedTiers,
      };
      if (draft.packQty > 0 && draft.packUnit.trim()) {
        body.packSize = {
          qty: Math.round(draft.packQty),
          unit: draft.packUnit.trim(),
          label: draft.packLabel.trim() || undefined,
        };
      } else {
        body.packSize = null;
      }
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Save failed');
      }
      const updated = (await res.json()) as Product;
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setDrafts((prev) => ({
        ...prev,
        [id]: { ...toDraft(updated), saving: false },
      }));
      toast.success(`Saved pricing for ${updated.name}`);
    } catch (err: any) {
      setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], saving: false } }));
      toast.error(err.message ?? 'Save failed');
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bulk pricing</h1>
            <p className="mt-1 text-muted-foreground">
              Set per-SKU minimum order quantity, step size, pack size and
              tiered prices. Changes go live on the storefront within seconds.
            </p>
          </div>
          <div className="relative w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-10 text-center text-xs text-muted-foreground">
            No matching products.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((p) => {
              const draft = drafts[p.id];
              if (!draft) return null;
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {p.images?.[0] && (
                        <Image
                          src={p.images[0]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.categoryName ?? '—'} · base ₹{p.price}/{p.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {draft.dirty && (
                        <span className="text-[11px] font-medium text-amber-600">
                          Unsaved
                        </span>
                      )}
                      <Button
                        size="sm"
                        onClick={() => saveRow(p.id)}
                        disabled={!draft.dirty || draft.saving}
                        className="gap-1"
                      >
                        <Save className="h-3.5 w-3.5" />
                        {draft.saving ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`moq-${p.id}`}>MOQ ({p.unit})</Label>
                          <Input
                            id={`moq-${p.id}`}
                            type="number"
                            min={1}
                            value={draft.moq}
                            onChange={(e) =>
                              patchDraft(p.id, {
                                moq: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor={`step-${p.id}`}>Step size</Label>
                          <Input
                            id={`step-${p.id}`}
                            type="number"
                            min={1}
                            value={draft.stepSize}
                            onChange={(e) =>
                              patchDraft(p.id, {
                                stepSize: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1
                                ),
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Pack size (optional)</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            min={0}
                            placeholder="Qty"
                            value={draft.packQty || ''}
                            onChange={(e) =>
                              patchDraft(p.id, {
                                packQty: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                          />
                          <Input
                            placeholder="Unit"
                            value={draft.packUnit}
                            onChange={(e) =>
                              patchDraft(p.id, { packUnit: e.target.value })
                            }
                          />
                          <Input
                            placeholder="Label"
                            value={draft.packLabel}
                            onChange={(e) =>
                              patchDraft(p.id, { packLabel: e.target.value })
                            }
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          E.g. qty 12, unit &ldquo;piece&rdquo;, label &ldquo;Pack of 12&rdquo;.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Price tiers</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTier(p.id)}
                          className="gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add tier
                        </Button>
                      </div>
                      {draft.tiers.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No tiered discounts. Customers pay the base price for
                          all quantities.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {draft.tiers.map((t, i) => (
                            <li
                              key={i}
                              className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2"
                            >
                              <span className="text-xs text-muted-foreground tabular-nums">
                                #{i + 1}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={1}
                                  value={t.minQty || ''}
                                  onChange={(e) =>
                                    updateTier(p.id, i, 'minQty', e.target.value)
                                  }
                                  placeholder="Min qty"
                                />
                                <span className="text-xs text-muted-foreground">
                                  +
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={t.price || ''}
                                  onChange={(e) =>
                                    updateTier(p.id, i, 'price', e.target.value)
                                  }
                                  placeholder="Price"
                                />
                                <span className="text-xs text-muted-foreground">
                                  /{p.unit}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTier(p.id, i)}
                                aria-label="Remove tier"
                                className="text-muted-foreground hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AdminLayout>
  );
}
