'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { SortableList } from '@/components/admin/SortableList';
import { SingleImageUpload } from '@/components/admin/SingleImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { HeroSlide } from '@/lib/types';

type FormState = {
  headline: string;
  subText: string;
  ctaText: string;
  ctaHref: string;
  imageDesktop: string;
  imageMobile: string;
  status: 'active' | 'draft';
  startsAt: string;
  endsAt: string;
};

const EMPTY: FormState = {
  headline: '',
  subText: '',
  ctaText: 'Shop now',
  ctaHref: '',
  imageDesktop: '',
  imageMobile: '',
  status: 'draft',
  startsAt: '',
  endsAt: '',
};

function utcToLocal(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

function toFormState(s: HeroSlide): FormState {
  return {
    headline: s.headline,
    subText: s.subText ?? '',
    ctaText: s.ctaText,
    ctaHref: s.ctaHref,
    imageDesktop: s.imageDesktop,
    imageMobile: s.imageMobile ?? '',
    status: s.status,
    startsAt: s.startsAt ? utcToLocal(s.startsAt) : '',
    endsAt: s.endsAt ? utcToLocal(s.endsAt) : '',
  };
}

function toBody(f: FormState) {
  return {
    headline: f.headline.trim(),
    subText: f.subText.trim(),
    ctaText: f.ctaText.trim() || 'Shop now',
    ctaHref: f.ctaHref.trim(),
    imageDesktop: f.imageDesktop,
    imageMobile: f.imageMobile,
    status: f.status,
    startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
    endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : null,
  };
}

export default function CarouselPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    fetchSlides();
  }, []);

  async function fetchSlides() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hero-slides');
      const data = await res.json();
      setSlides(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load slides');
    } finally {
      setIsLoading(false);
    }
  }

  function startCreate() {
    setSelected(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function startEdit(slide: HeroSlide) {
    setSelected(slide);
    setForm(toFormState(slide));
    setOpen(true);
  }

  function startDelete(slide: HeroSlide) {
    setSelected(slide);
    setConfirmOpen(true);
  }

  async function handleSubmit() {
    if (!form.headline.trim() || !form.ctaHref.trim() || !form.imageDesktop) {
      toast.error('Headline, CTA URL, and desktop image are required');
      return;
    }
    setIsSaving(true);
    try {
      const body = toBody(form);
      const res = selected
        ? await fetch(`/api/hero-slides/${selected.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/hero-slides', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Save failed');
      }
      toast.success(selected ? 'Slide updated' : 'Slide created');
      setOpen(false);
      fetchSlides();
    } catch (err: any) {
      toast.error(err.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    try {
      const res = await fetch(`/api/hero-slides/${selected.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Slide deleted');
      setConfirmOpen(false);
      fetchSlides();
    } catch (err: any) {
      toast.error(err.message ?? 'Delete failed');
    }
  }

  async function handleReorder(next: HeroSlide[]) {
    setSlides(next);
    try {
      const res = await fetch('/api/hero-slides/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      });
      if (!res.ok) throw new Error('Reorder failed');
    } catch (err: any) {
      toast.error(err.message ?? 'Reorder failed');
      fetchSlides();
    }
  }

  async function toggleStatus(slide: HeroSlide) {
    const nextStatus: 'active' | 'draft' =
      slide.status === 'active' ? 'draft' : 'active';
    setSlides((prev) =>
      prev.map((s) => (s.id === slide.id ? { ...s, status: nextStatus } : s))
    );
    try {
      const res = await fetch(`/api/hero-slides/${slide.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
    } catch (err: any) {
      toast.error(err.message ?? 'Status update failed');
      fetchSlides();
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hero carousel</h1>
            <p className="mt-1 text-muted-foreground">
              Slides shown at the top of the storefront. Drag rows to reorder; toggle
              the switch to publish or unpublish.
            </p>
          </div>
          <Button onClick={startCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add slide
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : slides.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm font-medium text-foreground">No slides yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The storefront falls back to demo slides until you add at least one
              active slide here.
            </p>
            <Button onClick={startCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add your first slide
            </Button>
          </div>
        ) : (
          <SortableList
            items={slides}
            onReorder={handleReorder}
            renderItem={(slide, handle) => (
              <div className="flex items-stretch gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center">{handle}</div>
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-md bg-secondary">
                  {slide.imageDesktop && (
                    <Image
                      src={slide.imageDesktop}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between gap-1 min-w-0">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{slide.headline}</p>
                    {slide.subText && (
                      <p className="truncate text-xs text-muted-foreground">
                        {slide.subText}
                      </p>
                    )}
                    <p className="mt-1 truncate text-[11px] text-muted-foreground">
                      {slide.ctaText} → {slide.ctaHref}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {slide.startsAt && (
                      <span>
                        Starts {new Date(slide.startsAt).toLocaleDateString()}
                      </span>
                    )}
                    {slide.endsAt && (
                      <span>
                        Ends {new Date(slide.endsAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium ${
                        slide.status === 'active'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {slide.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                    <Switch
                      checked={slide.status === 'active'}
                      onCheckedChange={() => toggleStatus(slide)}
                      aria-label="Toggle published status"
                    />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => startEdit(slide)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 hover:bg-red-50 hover:text-red-600"
                      onClick={() => startDelete(slide)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          />
        )}

        <FormModal
          open={open}
          onClose={() => setOpen(false)}
          title={selected ? 'Edit slide' : 'Add slide'}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={form.headline}
                onChange={(e) =>
                  setForm((f) => ({ ...f, headline: e.target.value }))
                }
                placeholder="Fresh today, in your kitchen tomorrow"
              />
            </div>
            <div>
              <Label htmlFor="subText">Sub text</Label>
              <Textarea
                id="subText"
                rows={2}
                value={form.subText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subText: e.target.value }))
                }
                placeholder="Bulk vegetables, fruits and dairy graded for restaurants and kiranas."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="ctaText">CTA label</Label>
                <Input
                  id="ctaText"
                  value={form.ctaText}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ctaText: e.target.value }))
                  }
                  placeholder="Shop fresh produce"
                />
              </div>
              <div>
                <Label htmlFor="ctaHref">CTA URL</Label>
                <Input
                  id="ctaHref"
                  value={form.ctaHref}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ctaHref: e.target.value }))
                  }
                  placeholder="/products?category=vegetables"
                />
              </div>
            </div>
            <div>
              <Label>Desktop image</Label>
              <SingleImageUpload
                value={form.imageDesktop}
                onChange={(url) =>
                  setForm((f) => ({ ...f, imageDesktop: url }))
                }
              />
            </div>
            <div>
              <Label>Mobile image (optional)</Label>
              <SingleImageUpload
                value={form.imageMobile}
                onChange={(url) =>
                  setForm((f) => ({ ...f, imageMobile: url }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Falls back to the desktop image if not provided.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startsAt">Starts at</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startsAt: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="endsAt">Ends at</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endsAt: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Publish status</p>
                <p className="text-xs text-muted-foreground">
                  Active slides appear on the storefront within their schedule
                  window.
                </p>
              </div>
              <Switch
                checked={form.status === 'active'}
                onCheckedChange={(checked) =>
                  setForm((f) => ({
                    ...f,
                    status: checked ? 'active' : 'draft',
                  }))
                }
              />
            </div>
          </div>
        </FormModal>

        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete slide"
          description={`Delete "${selected?.headline}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
}
