'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { SortableList } from '@/components/admin/SortableList';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { Announcement } from '@/lib/types';

type FormState = {
  message: string;
  status: 'active' | 'draft';
  startsAt: string;
  endsAt: string;
};

const EMPTY: FormState = {
  message: '',
  status: 'active',
  startsAt: '',
  endsAt: '',
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setIsLoading(true);
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load announcements');
    } finally {
      setIsLoading(false);
    }
  }

  function startCreate() {
    setSelected(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function startEdit(item: Announcement) {
    setSelected(item);
    const utcToLocal = (iso: string) => {
      const d = new Date(iso);
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };
    setForm({
      message: item.message,
      status: item.status,
      startsAt: item.startsAt ? utcToLocal(item.startsAt) : '',
      endsAt: item.endsAt ? utcToLocal(item.endsAt) : '',
    });
    setOpen(true);
  }

  function startDelete(item: Announcement) {
    setSelected(item);
    setConfirmOpen(true);
  }

  async function handleSubmit() {
    if (!form.message.trim()) {
      toast.error('Message is required');
      return;
    }
    setIsSaving(true);
    try {
      const body = {
        message: form.message.trim(),
        status: form.status,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      };
      const res = selected
        ? await fetch(`/api/announcements/${selected.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Save failed');
      }
      toast.success(selected ? 'Announcement updated' : 'Announcement created');
      setOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message ?? 'Save failed');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!selected) return;
    try {
      const res = await fetch(`/api/announcements/${selected.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Announcement deleted');
      setConfirmOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message ?? 'Delete failed');
    }
  }

  async function handleReorder(next: Announcement[]) {
    setItems(next);
    try {
      const res = await fetch('/api/announcements/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: next.map((s) => s.id) }),
      });
      if (!res.ok) throw new Error('Reorder failed');
    } catch (err: any) {
      toast.error(err.message ?? 'Reorder failed');
      fetchItems();
    }
  }

  async function toggleStatus(item: Announcement) {
    const nextStatus: 'active' | 'draft' =
      item.status === 'active' ? 'draft' : 'active';
    setItems((prev) =>
      prev.map((s) => (s.id === item.id ? { ...s, status: nextStatus } : s))
    );
    try {
      const res = await fetch(`/api/announcements/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
    } catch (err: any) {
      toast.error(err.message ?? 'Status update failed');
      fetchItems();
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
            <p className="mt-1 text-muted-foreground">
              Rolling messages shown in the storefront utility bar. Drag to reorder.
            </p>
          </div>
          <Button onClick={startCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add announcement
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-secondary/40 p-10 text-center">
            <p className="text-sm font-medium text-foreground">
              No announcements yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The storefront falls back to default messages until you add at least
              one active announcement.
            </p>
            <Button onClick={startCreate} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add your first announcement
            </Button>
          </div>
        ) : (
          <SortableList
            items={items}
            onReorder={handleReorder}
            renderItem={(item, handle) => (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-center">{handle}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.message}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    {item.startsAt && (
                      <span>
                        Starts {new Date(item.startsAt).toLocaleDateString()}
                      </span>
                    )}
                    {item.endsAt && (
                      <span>Ends {new Date(item.endsAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      item.status === 'active'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                  <Switch
                    checked={item.status === 'active'}
                    onCheckedChange={() => toggleStatus(item)}
                    aria-label="Toggle published status"
                  />
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 hover:bg-red-50 hover:text-red-600"
                    onClick={() => startDelete(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          />
        )}

        <FormModal
          open={open}
          onClose={() => setOpen(false)}
          title={selected ? 'Edit announcement' : 'Add announcement'}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={3}
                maxLength={200}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Free delivery on orders above ₹2,000"
              />
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {form.message.length} / 200 characters
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
                  Active announcements appear in the rotating ticker.
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
          title="Delete announcement"
          description={`Delete this announcement? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
}
