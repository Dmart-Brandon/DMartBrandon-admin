"use client";

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { FormModal } from '@/components/admin/FormModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Category } from '@/lib/types';
import { Plus } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', imageUrl: '' });
  const [errors, setErrors] = useState<{ name?: string; slug?: string; description?: string; imageUrl?: string }>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setFormData({ name: '', slug: '', description: '', imageUrl: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl || '',
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    const newErrors: { name?: string; slug?: string; description?: string; imageUrl?: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.slug.trim()) newErrors.slug = 'Slug is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.imageUrl) newErrors.imageUrl = 'Category image is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      if (selectedCategory) {
        await fetch(`/api/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to save category', err);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    try {
      await fetch(`/api/categories/${selectedCategory.id}`, { method: 'DELETE' });
      setIsDeleteDialogOpen(false);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category', err);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !selectedCategory
        ? { slug: value.toLowerCase().replace(/\s+/g, '-') }
        : {}),
    }));
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'description', label: 'Description' },
    {
      key: 'createdAt',
      label: 'Created',
      render: (cat: Category) => new Date(cat.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage product categories</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <DataTable
            data={categories}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search categories..."
          />
        )}

        <FormModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedCategory ? 'Edit Category' : 'Add Category'}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Electronics"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="slug">Slug <span className="text-red-500">*</span></Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                placeholder="electronics"
              />
              {errors.slug && <p className="text-sm text-red-500 mt-1">{errors.slug}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Category description"
                rows={3}
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>
            <div>
              <Label>Category image <span className="text-red-500">*</span></Label>
              <ImageUpload
                values={formData.imageUrl ? [formData.imageUrl] : []}
                onChange={(urls) =>
                  setFormData((prev) => ({
                    ...prev,
                    imageUrl: urls[urls.length - 1] || '',
                  }))
                }
              />
              {errors.imageUrl && <p className="text-sm text-red-500 mt-1">{errors.imageUrl}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Used as the category tile on the storefront.
              </p>
            </div>
          </div>
        </FormModal>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Category"
          description={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
}
