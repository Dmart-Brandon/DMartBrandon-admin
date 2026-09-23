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
  businessName?: string;
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

