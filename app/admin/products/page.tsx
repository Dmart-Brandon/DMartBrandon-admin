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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product, Category } from '@/lib/types';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Plus, Star, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const UNIT_PRESETS = ['piece', 'dozen', 'pack', 'box', 'set', 'pair', 'kg', 'gram', 'liter', 'ml', 'meter'];
const CUSTOM_UNIT = '__custom__';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    stock: '',
    unit: 'piece',
    moq: '1',
    featured: false,
    images: [] as string[],
    specs: [] as { key: string; value: string }[],
  });
  const [unitSelect, setUnitSelect] = useState<string>('piece');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      const [productsData, categoriesData] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setFormData({ name: '', description: '', price: '', categoryId: '', stock: '', unit: 'piece', moq: '1', featured: false, images: [], specs: [] });
    setUnitSelect('piece');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    const productUnit = product.unit || 'piece';
    const specsObj = product.specs ?? {};
    const specsArr = Object.entries(specsObj).map(([key, value]) => ({ key, value: String(value) }));
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: product.categoryId,
      stock: String(product.stock),
      unit: productUnit,
      moq: String(product.moq ?? 1),
      featured: product.featured,
      images: product.images ?? [],
      specs: specsArr,
    });
    setUnitSelect(UNIT_PRESETS.includes(productUnit) ? productUnit : CUSTOM_UNIT);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !product.featured }),
      });
      setProducts(products.map((p) => p.id === product.id ? { ...p, featured: !p.featured } : p));
    } catch (err) {
      console.error('Failed to update featured status', err);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Product name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.unit.trim()) errors.unit = 'Unit is required';
    if (!formData.moq || parseInt(formData.moq) < 1) errors.moq = 'MOQ must be at least 1';
    if (!formData.price || parseFloat(formData.price) <= 0) errors.price = 'Price must be greater than 0';
    if (!formData.stock && formData.stock !== '0') errors.stock = 'Stock is required';
    if (!formData.categoryId) errors.categoryId = 'Category is required';
    if (formData.images.length === 0) errors.images = 'At least one product image is required';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const category = categories.find((c) => c.id === formData.categoryId);
      const moqParsed = parseInt(formData.moq);
      const specsMap: Record<string, string> = {};
      for (const s of formData.specs) {
        if (s.key.trim()) specsMap[s.key.trim()] = s.value.trim();
      }
      const { specs: _specs, ...rest } = formData;
      const payload = {
        ...rest,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        unit: (formData.unit || 'piece').trim() || 'piece',
        moq: Number.isFinite(moqParsed) && moqParsed >= 1 ? moqParsed : 1,
        categoryName: category?.name ?? '',
        specs: specsMap,
      };

      if (selectedProduct) {
        await fetch(`/api/products/${selectedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || 'Failed to create product');
          return;
        }
      }
      toast.success(selectedProduct ? 'Product updated successfully' : 'Product created successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to save product', err);
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Product',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-secondary/60 rounded-lg overflow-hidden">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/60 text-xs">No img</div>
            )}
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.categoryName}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (product: Product) => `₹${product.price.toFixed(2)}`,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (product: Product) => (
        <Badge variant={product.stock < 50 ? 'destructive' : 'default'}>{product.stock}</Badge>
      ),
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (product: Product) => (
        <div className="flex items-center gap-2">
          <Switch checked={product.featured} onCheckedChange={() => toggleFeatured(product)} />
          {product.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Products</h1>
            <p className="text-muted-foreground mt-1">Manage your product inventory</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <DataTable
            data={products}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
            searchPlaceholder="Search products..."
          />
        )}

        <FormModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedProduct ? 'Edit Product' : 'Add Product'}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFormErrors((prev) => ({ ...prev, name: '' })); }}
                placeholder="Wireless Headphones"
                className=""
              />
              {formErrors.name && <p className="text-sm text-destructive mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setFormErrors((prev) => ({ ...prev, description: '' })); }}
                placeholder="Product description"
                rows={3}
                className=""
              />
              {formErrors.description && <p className="text-sm text-destructive mt-1">{formErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit <span className="text-destructive">*</span></Label>
                <Select
                  value={unitSelect}
                  onValueChange={(value) => {
                    setUnitSelect(value);
                    setFormErrors((prev) => ({ ...prev, unit: '' }));
                    if (value === CUSTOM_UNIT) {
                      setFormData({ ...formData, unit: '' });
                    } else {
                      setFormData({ ...formData, unit: value });
                    }
                  }}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_PRESETS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_UNIT}>Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {unitSelect === CUSTOM_UNIT && (
                  <Input
                    className="mt-2"
                    value={formData.unit}
                    onChange={(e) => { setFormData({ ...formData, unit: e.target.value }); setFormErrors((prev) => ({ ...prev, unit: '' })); }}
                    placeholder="e.g. crate"
                  />
                )}
                {formErrors.unit && <p className="text-sm text-destructive mt-1">{formErrors.unit}</p>}
              </div>
              <div>
                <Label htmlFor="moq">MOQ (Min. order qty) <span className="text-destructive">*</span></Label>
                <Input
                  id="moq"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.moq}
                  onChange={(e) => { setFormData({ ...formData, moq: e.target.value }); setFormErrors((prev) => ({ ...prev, moq: '' })); }}
                  placeholder="1"
                  className=""
                />
                {formErrors.moq && <p className="text-sm text-destructive mt-1">{formErrors.moq}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price per {formData.unit || 'unit'} <span className="text-destructive">*</span></Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => { setFormData({ ...formData, price: e.target.value }); setFormErrors((prev) => ({ ...prev, price: '' })); }}
                  placeholder="0.00"
                  className=""
                />
                {formErrors.price && <p className="text-sm text-destructive mt-1">{formErrors.price}</p>}
              </div>
              <div>
                <Label htmlFor="stock">Stock ({formData.unit || 'units'}) <span className="text-destructive">*</span></Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => { setFormData({ ...formData, stock: e.target.value }); setFormErrors((prev) => ({ ...prev, stock: '' })); }}
                  placeholder="0"
                  className=""
                />
                {formErrors.stock && <p className="text-sm text-destructive mt-1">{formErrors.stock}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => { setFormData({ ...formData, categoryId: value }); setFormErrors((prev) => ({ ...prev, categoryId: '' })); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.categoryId && <p className="text-sm text-destructive mt-1">{formErrors.categoryId}</p>}
            </div>
            <div>
              <Label>Product Images <span className="text-destructive">*</span></Label>
              <ImageUpload
                values={formData.images}
                onChange={(urls) => { setFormData({ ...formData, images: urls }); setFormErrors((prev) => ({ ...prev, images: '' })); }}
              />
              {formErrors.images && <p className="text-sm text-destructive mt-1">{formErrors.images}</p>}
            </div>
            <div>
              <Label>Specifications</Label>
              <div className="mt-2 space-y-2">
                {formData.specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Key (e.g. Origin)"
                      value={spec.key}
                      onChange={(e) => {
                        const updated = [...formData.specs];
                        updated[idx] = { ...updated[idx], key: e.target.value };
                        setFormData({ ...formData, specs: updated });
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Value (e.g. India)"
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...formData.specs];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setFormData({ ...formData, specs: updated });
                      }}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, specs: formData.specs.filter((_, i) => i !== idx) })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, specs: [...formData.specs, { key: '', value: '' }] })}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  + Add specification
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured Product</Label>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
            </div>
          </div>
        </FormModal>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={async () => {
            if (!selectedProduct) return;
            await fetch(`/api/products/${selectedProduct.id}`, { method: 'DELETE' });
            setIsDeleteDialogOpen(false);
            fetchData();
          }}
          title="Delete Product"
          description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        />
      </div>
    </AdminLayout>
  );
}
