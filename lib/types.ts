export interface PriceTier {
  minQty: number;
  price: number;
}

export interface PackSize {
  qty: number;
  unit: string;
  label?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  categoryName?: string;
  stock: number;
  unit: string;
  moq: number;
  stepSize?: number;
  packSize?: PackSize;
  priceTiers?: PriceTier[];
  grade?: string;
  origin?: string;
  shelfLifeDays?: number;
  leadTimeHours?: number;
  warrantyMonths?: number;
  keySpec?: string;
  brand?: string;
  hsnCode?: string;
  deliveryEtaHours?: number;
  secondaryImage?: string;
  featured: boolean;
  images: string[];
  specs?: Record<string, string>;
  deletedAt?: string | null;
  createdAt: string;
}

export interface TaxBreakdown {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  rate: number;
  isInterState: boolean;
  sellerState: string;
  buyerState: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  trackingUrl?: string;
  notes?: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  gstin?: string;
  businessName?: string;
  taxBreakdown?: TaxBreakdown;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  unit?: string;
  image?: string;
  hsnCode?: string;
}

export interface ShippingAddress {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export interface HeroSlide {
  id: string;
  headline: string;
  subText?: string;
  ctaText: string;
  ctaHref: string;
  imageDesktop: string;
  imageMobile?: string;
  displayOrder: number;
  status: 'active' | 'draft';
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Featured {
  id: string;
  slot: string;
  productIds: string[];
  startsAt?: string;
  endsAt?: string;
  updatedAt?: string;
}

export interface Announcement {
  id: string;
  message: string;
  displayOrder: number;
  status: 'active' | 'draft';
  startsAt?: string;
  endsAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessProfile {
  id: string;
  userId: string;
  businessName: string;
  gstins: { gstin: string; label: string; isDefault: boolean }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuoteRequest {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  businessName?: string;
  gstin?: string;
  items: { productId: string; productName: string; quantity: number; price: number; unit?: string }[];
  cartTotal: number;
  expectedFrequency?: string;
  notes?: string;
  status: 'new' | 'responded' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}
