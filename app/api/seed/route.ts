import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import { Category } from '@/lib/models/Category';
import { Product } from '@/lib/models/Product';

export const dynamic = 'force-dynamic';

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CATEGORIES = [
  {
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Farm-fresh vegetables sourced direct from growers, graded and packed daily.',
    imageUrl:
      'https://images.pexels.com/photos/1414651/pexels-photo-1414651.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    name: 'Fruits',
    slug: 'fruits',
    description: 'Seasonal fruits at peak ripeness, hand-picked and quality-graded.',
    imageUrl:
      'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    name: 'Dairy',
    slug: 'dairy',
    description: 'Cold-chain dairy with full shelf-life guarantee for restaurants and retailers.',
    imageUrl:
      'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    name: 'Cakes & Bakery',
    slug: 'cakes-bakery',
    description: 'Wholesale bakery and cakes with lead-time-based fulfillment for cafes and caterers.',
    imageUrl:
      'https://images.pexels.com/photos/264939/pexels-photo-264939.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Office and store electronics in bulk — invoiced with GST and full manufacturer warranty.',
    imageUrl:
      'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
];

type ProductSeed = {
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured?: boolean;
  newArrival?: boolean;
  bestseller?: boolean;
  categorySlug: string;
  unit: string;
  moq: number;
  stepSize?: number;
  packSize?: { qty: number; unit: string; label: string };
  priceTiers?: { minQty: number; price: number }[];
  grade?: string;
  origin?: string;
  shelfLifeDays?: number;
  leadTimeHours?: number;
  warrantyMonths?: number;
  keySpec?: string;
  brand?: string;
  hsnCode?: string;
  deliveryEtaHours?: number;
  images: string[];
  secondaryImage?: string;
};

const PRODUCTS: ProductSeed[] = [
  // ===== Vegetables =====
  {
    name: 'Nashik Onions Grade A',
    description: 'Firm, well-cured red onions from Nashik. Long shelf life, ideal for restaurants and kitchens. Sold per kilogram.',
    price: 28,
    compareAtPrice: 36,
    stock: 1200,
    featured: true,
    bestseller: true,
    categorySlug: 'vegetables',
    unit: 'kg',
    moq: 5,
    stepSize: 1,
    packSize: { qty: 25, unit: 'kg', label: '25 kg sack' },
    priceTiers: [
      { minQty: 25, price: 26 },
      { minQty: 100, price: 24 },
      { minQty: 500, price: 22 },
    ],
    grade: 'Grade A',
    origin: 'Nashik, MH',
    shelfLifeDays: 30,
    hsnCode: '0703',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/1435903/pexels-photo-1435903.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
    secondaryImage:
      'https://images.pexels.com/photos/2893635/pexels-photo-2893635.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  {
    name: 'Vine-Ripened Tomatoes',
    description: 'Plump red tomatoes with balanced acidity. Pre-graded for size uniformity. Priced per kilogram.',
    price: 32,
    stock: 800,
    featured: true,
    categorySlug: 'vegetables',
    unit: 'kg',
    moq: 5,
    stepSize: 1,
    packSize: { qty: 10, unit: 'kg', label: '10 kg crate' },
    priceTiers: [
      { minQty: 20, price: 30 },
      { minQty: 100, price: 27 },
    ],
    grade: 'Grade A',
    origin: 'Kolar, KA',
    shelfLifeDays: 7,
    hsnCode: '0702',
    deliveryEtaHours: 12,
    images: [
      'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Rainbow Carrots',
    description: 'Mix of orange, purple, and yellow carrots. Crisp, sweet, and nutrient-dense.',
    price: 58,
    stock: 400,
    categorySlug: 'vegetables',
    unit: 'kg',
    moq: 2,
    stepSize: 1,
    packSize: { qty: 10, unit: 'kg', label: '10 kg crate' },
    priceTiers: [
      { minQty: 10, price: 54 },
      { minQty: 50, price: 49 },
    ],
    grade: 'Premium',
    origin: 'Ooty, TN',
    shelfLifeDays: 14,
    hsnCode: '0706',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Fresh Green Capsicum',
    description: 'Glossy green capsicum, uniform thick-wall variety. Cold-chain handled.',
    price: 48,
    stock: 600,
    newArrival: true,
    categorySlug: 'vegetables',
    unit: 'kg',
    moq: 5,
    stepSize: 1,
    packSize: { qty: 10, unit: 'kg', label: '10 kg box' },
    priceTiers: [
      { minQty: 20, price: 45 },
      { minQty: 100, price: 41 },
    ],
    grade: 'Grade A',
    origin: 'Pune, MH',
    shelfLifeDays: 10,
    hsnCode: '0709',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/1352271/pexels-photo-1352271.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Baby Spinach (Bunch)',
    description: 'Tender baby spinach bunches, triple-washed. Sold in 250 g bunches, packed in 12-bunch crates.',
    price: 25,
    stock: 500,
    bestseller: true,
    categorySlug: 'vegetables',
    unit: 'bunch',
    moq: 12,
    stepSize: 12,
    packSize: { qty: 12, unit: 'bunch', label: '12-bunch crate' },
    priceTiers: [
      { minQty: 24, price: 23 },
      { minQty: 60, price: 21 },
    ],
    grade: 'Grade A',
    origin: 'Local, Hyderabad',
    shelfLifeDays: 4,
    hsnCode: '0709',
    deliveryEtaHours: 12,
    images: [
      'https://images.pexels.com/photos/2255925/pexels-photo-2255925.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Idli Rice Potatoes',
    description: 'Medium-size potatoes ideal for restaurant kitchens. Even sizing, low eye depth.',
    price: 22,
    stock: 2000,
    categorySlug: 'vegetables',
    unit: 'kg',
    moq: 10,
    stepSize: 1,
    packSize: { qty: 50, unit: 'kg', label: '50 kg sack' },
    priceTiers: [
      { minQty: 50, price: 20 },
      { minQty: 200, price: 18 },
      { minQty: 1000, price: 16 },
    ],
    grade: 'Grade A',
    origin: 'Agra, UP',
    shelfLifeDays: 30,
    hsnCode: '0701',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Green Chillies',
    description: 'Long green chillies with medium heat. Stem-on, hand-sorted.',
    price: 60,
    stock: 200,
    categorySlug: 'vegetables',
    unit: 'kg',
    moq: 1,
    stepSize: 1,
    packSize: { qty: 5, unit: 'kg', label: '5 kg crate' },
    priceTiers: [
      { minQty: 5, price: 56 },
      { minQty: 20, price: 50 },
    ],
    grade: 'Grade A',
    origin: 'Guntur, AP',
    shelfLifeDays: 7,
    hsnCode: '0709',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/4197447/pexels-photo-4197447.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },

  // ===== Fruits =====
  {
    name: 'Alphonso Mangoes (Premium)',
    description: 'Authentic Ratnagiri Alphonso mangoes, hand-picked at peak ripeness. Box of 12.',
    price: 599,
    compareAtPrice: 699,
    stock: 300,
    featured: true,
    bestseller: true,
    categorySlug: 'fruits',
    unit: 'box',
    moq: 1,
    stepSize: 1,
    packSize: { qty: 12, unit: 'piece', label: 'Box of 12' },
    priceTiers: [
      { minQty: 5, price: 549 },
      { minQty: 20, price: 499 },
    ],
    grade: 'Premium',
    origin: 'Ratnagiri, MH',
    shelfLifeDays: 6,
    hsnCode: '0804',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Cavendish Bananas',
    description: 'Ripe yellow Cavendish bananas, classic creamy texture. Sold by the dozen.',
    price: 60,
    stock: 800,
    categorySlug: 'fruits',
    unit: 'dozen',
    moq: 2,
    stepSize: 1,
    packSize: { qty: 10, unit: 'dozen', label: '10-dozen carton' },
    priceTiers: [
      { minQty: 10, price: 55 },
      { minQty: 50, price: 50 },
    ],
    grade: 'Grade A',
    origin: 'Theni, TN',
    shelfLifeDays: 5,
    hsnCode: '0803',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Shimla Apples',
    description: 'Crisp, sweet red apples from Shimla. Pre-graded, polish-free.',
    price: 140,
    stock: 600,
    featured: true,
    categorySlug: 'fruits',
    unit: 'kg',
    moq: 5,
    stepSize: 1,
    packSize: { qty: 10, unit: 'kg', label: '10 kg box' },
    priceTiers: [
      { minQty: 10, price: 130 },
      { minQty: 50, price: 120 },
    ],
    grade: 'Premium',
    origin: 'Shimla, HP',
    shelfLifeDays: 21,
    hsnCode: '0808',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Nagpur Oranges',
    description: 'Juicy seedless Nagpur oranges with sweet-tangy balance.',
    price: 80,
    stock: 500,
    newArrival: true,
    categorySlug: 'fruits',
    unit: 'kg',
    moq: 5,
    stepSize: 1,
    packSize: { qty: 10, unit: 'kg', label: '10 kg box' },
    priceTiers: [
      { minQty: 10, price: 75 },
      { minQty: 50, price: 68 },
    ],
    grade: 'Grade A',
    origin: 'Nagpur, MH',
    shelfLifeDays: 14,
    hsnCode: '0805',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/1414122/pexels-photo-1414122.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Sweet Pineapples',
    description: 'Whole sweet pineapples from Kerala. Average weight 1.2-1.5 kg each.',
    price: 90,
    stock: 250,
    categorySlug: 'fruits',
    unit: 'piece',
    moq: 6,
    stepSize: 1,
    packSize: { qty: 6, unit: 'piece', label: 'Carton of 6' },
    priceTiers: [
      { minQty: 6, price: 85 },
      { minQty: 30, price: 78 },
    ],
    grade: 'Grade A',
    origin: 'Kollam, KL',
    shelfLifeDays: 8,
    hsnCode: '0804',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/4022090/pexels-photo-4022090.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Seedless Grapes',
    description: 'Sweet seedless green grapes, individually quick-cooled to retain crispness.',
    price: 120,
    stock: 400,
    categorySlug: 'fruits',
    unit: 'kg',
    moq: 2,
    stepSize: 1,
    packSize: { qty: 5, unit: 'kg', label: '5 kg crate' },
    priceTiers: [
      { minQty: 5, price: 112 },
      { minQty: 25, price: 99 },
    ],
    grade: 'Premium',
    origin: 'Nashik, MH',
    shelfLifeDays: 10,
    hsnCode: '0806',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/708777/pexels-photo-708777.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },

  // ===== Dairy =====
  {
    name: 'Amul Full-Cream Milk 1L',
    description: 'Pasteurised full-cream toned milk in 1 L pouches. Cold-chain delivered.',
    price: 68,
    stock: 1500,
    bestseller: true,
    featured: true,
    categorySlug: 'dairy',
    unit: 'pouch',
    moq: 12,
    stepSize: 12,
    packSize: { qty: 12, unit: 'pouch', label: 'Crate of 12 × 1 L' },
    priceTiers: [
      { minQty: 24, price: 65 },
      { minQty: 120, price: 62 },
    ],
    brand: 'Amul',
    shelfLifeDays: 3,
    hsnCode: '0401',
    deliveryEtaHours: 12,
    images: [
      'https://images.pexels.com/photos/236010/pexels-photo-236010.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Mother Dairy Curd 5kg',
    description: 'Set curd in 5 kg HDPE bucket. Refrigerated, ideal for kitchens and caterers.',
    price: 320,
    stock: 200,
    categorySlug: 'dairy',
    unit: 'bucket',
    moq: 2,
    stepSize: 1,
    packSize: { qty: 1, unit: 'bucket', label: '5 kg bucket' },
    priceTiers: [
      { minQty: 5, price: 305 },
      { minQty: 20, price: 290 },
    ],
    brand: 'Mother Dairy',
    shelfLifeDays: 5,
    hsnCode: '0403',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/4187739/pexels-photo-4187739.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Amul Salted Butter 500g',
    description: 'Yellow salted table butter, vacuum-packed for shelf stability.',
    price: 270,
    stock: 350,
    categorySlug: 'dairy',
    unit: 'pack',
    moq: 4,
    stepSize: 1,
    packSize: { qty: 24, unit: 'pack', label: 'Carton of 24 × 500 g' },
    priceTiers: [
      { minQty: 12, price: 258 },
      { minQty: 48, price: 245 },
    ],
    brand: 'Amul',
    shelfLifeDays: 90,
    hsnCode: '0405',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/479630/pexels-photo-479630.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Paneer Block 1kg',
    description: 'Fresh full-cream paneer in 1 kg vacuum blocks. Soft, creamy texture.',
    price: 360,
    stock: 180,
    featured: true,
    categorySlug: 'dairy',
    unit: 'block',
    moq: 2,
    stepSize: 1,
    packSize: { qty: 10, unit: 'block', label: '10 kg case' },
    priceTiers: [
      { minQty: 5, price: 340 },
      { minQty: 25, price: 320 },
    ],
    brand: 'Local Dairy',
    shelfLifeDays: 6,
    hsnCode: '0406',
    deliveryEtaHours: 18,
    images: [
      'https://images.pexels.com/photos/2611817/pexels-photo-2611817.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Cheddar Cheese Block 2kg',
    description: 'Aged cheddar block, vacuum-packed. Ideal for sandwich shops and pizzerias.',
    price: 1180,
    stock: 80,
    categorySlug: 'dairy',
    unit: 'block',
    moq: 1,
    stepSize: 1,
    packSize: { qty: 6, unit: 'block', label: '6 × 2 kg case' },
    priceTiers: [
      { minQty: 3, price: 1120 },
      { minQty: 12, price: 1050 },
    ],
    brand: 'Britannia',
    shelfLifeDays: 60,
    hsnCode: '0406',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/4109743/pexels-photo-4109743.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },

  // ===== Cakes & Bakery =====
  {
    name: 'Whole Wheat Pav (Pack of 12)',
    description: 'Soft whole-wheat pav buns, baked daily. Pre-ordered for next-morning fulfilment.',
    price: 60,
    stock: 500,
    categorySlug: 'cakes-bakery',
    unit: 'pack',
    moq: 5,
    stepSize: 1,
    packSize: { qty: 12, unit: 'piece', label: 'Pack of 12' },
    priceTiers: [
      { minQty: 20, price: 55 },
      { minQty: 100, price: 50 },
    ],
    leadTimeHours: 12,
    shelfLifeDays: 3,
    hsnCode: '1905',
    deliveryEtaHours: 12,
    images: [
      'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Sourdough Loaf (1kg)',
    description: 'Artisanal sourdough loaf, 36-hour fermentation. Crisp crust, chewy crumb.',
    price: 220,
    stock: 80,
    bestseller: true,
    categorySlug: 'cakes-bakery',
    unit: 'loaf',
    moq: 2,
    stepSize: 1,
    leadTimeHours: 24,
    shelfLifeDays: 5,
    hsnCode: '1905',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/1387070/pexels-photo-1387070.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Vanilla Sponge Cake (1kg)',
    description: 'Classic vanilla sponge, eggless option available on request. Custom frosting available with notice.',
    price: 480,
    stock: 60,
    featured: true,
    categorySlug: 'cakes-bakery',
    unit: 'cake',
    moq: 1,
    stepSize: 1,
    leadTimeHours: 48,
    shelfLifeDays: 3,
    hsnCode: '1905',
    deliveryEtaHours: 48,
    images: [
      'https://images.pexels.com/photos/264939/pexels-photo-264939.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Choco Truffle Cake (1kg)',
    description: 'Signature dark chocolate truffle. Made-to-order; 48-hour advance booking.',
    price: 620,
    stock: 40,
    featured: true,
    categorySlug: 'cakes-bakery',
    unit: 'cake',
    moq: 1,
    stepSize: 1,
    leadTimeHours: 48,
    shelfLifeDays: 3,
    hsnCode: '1905',
    deliveryEtaHours: 48,
    images: [
      'https://images.pexels.com/photos/132694/pexels-photo-132694.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Croissant (Pack of 6)',
    description: 'All-butter laminated croissants. Buttery, flaky, golden.',
    price: 240,
    stock: 200,
    newArrival: true,
    categorySlug: 'cakes-bakery',
    unit: 'pack',
    moq: 2,
    stepSize: 1,
    packSize: { qty: 6, unit: 'piece', label: 'Pack of 6' },
    priceTiers: [
      { minQty: 10, price: 220 },
      { minQty: 30, price: 200 },
    ],
    leadTimeHours: 24,
    shelfLifeDays: 2,
    hsnCode: '1905',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/2693447/pexels-photo-2693447.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Brownie Tray (24 pieces)',
    description: 'Fudgy chocolate brownies, individually wrapped. Cafe-favourite size.',
    price: 720,
    stock: 100,
    categorySlug: 'cakes-bakery',
    unit: 'tray',
    moq: 1,
    stepSize: 1,
    packSize: { qty: 24, unit: 'piece', label: '24-piece tray' },
    priceTiers: [
      { minQty: 5, price: 680 },
      { minQty: 20, price: 640 },
    ],
    leadTimeHours: 24,
    shelfLifeDays: 5,
    hsnCode: '1905',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/45202/brownie-dessert-cake-sweet-45202.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },

  // ===== Electronics =====
  {
    name: 'Samsung 55" 4K Smart TV',
    description: '55-inch UHD 4K Smart LED TV with HDR10+ and built-in apps. Ideal for hotels, lobbies, conference rooms.',
    price: 42999,
    compareAtPrice: 49999,
    stock: 25,
    featured: true,
    categorySlug: 'electronics',
    unit: 'unit',
    moq: 1,
    stepSize: 1,
    priceTiers: [
      { minQty: 5, price: 41499 },
      { minQty: 20, price: 39999 },
    ],
    brand: 'Samsung',
    keySpec: '55" · 4K UHD · HDR10+',
    warrantyMonths: 24,
    hsnCode: '8528',
    deliveryEtaHours: 72,
    images: [
      'https://images.pexels.com/photos/1444416/pexels-photo-1444416.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'HP LaserJet M1136 MFP',
    description: 'Multifunction monochrome laser printer with print/scan/copy. Office-grade duty cycle.',
    price: 18999,
    stock: 60,
    bestseller: true,
    categorySlug: 'electronics',
    unit: 'unit',
    moq: 1,
    stepSize: 1,
    priceTiers: [
      { minQty: 3, price: 18299 },
      { minQty: 10, price: 17499 },
    ],
    brand: 'HP',
    keySpec: 'Mono laser · 18 ppm · USB',
    warrantyMonths: 12,
    hsnCode: '8443',
    deliveryEtaHours: 48,
    images: [
      'https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Logitech B100 USB Mouse',
    description: 'Wired optical USB mouse. Ambidextrous, plug-and-play, ideal for office bulk deployment.',
    price: 399,
    stock: 1500,
    categorySlug: 'electronics',
    unit: 'unit',
    moq: 5,
    stepSize: 1,
    packSize: { qty: 50, unit: 'unit', label: 'Carton of 50' },
    priceTiers: [
      { minQty: 25, price: 369 },
      { minQty: 100, price: 339 },
      { minQty: 500, price: 309 },
    ],
    brand: 'Logitech',
    keySpec: 'Wired · 1000 DPI · USB-A',
    warrantyMonths: 36,
    hsnCode: '8471',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/2115257/pexels-photo-2115257.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Philips LED Bulb 9W (Pack of 10)',
    description: 'Energy-efficient 9W cool-white LED bulbs. B22 base. Long life, 25,000 hours rated.',
    price: 899,
    stock: 800,
    newArrival: true,
    categorySlug: 'electronics',
    unit: 'pack',
    moq: 2,
    stepSize: 1,
    packSize: { qty: 10, unit: 'piece', label: 'Pack of 10' },
    priceTiers: [
      { minQty: 10, price: 829 },
      { minQty: 50, price: 759 },
    ],
    brand: 'Philips',
    keySpec: '9W · 6500K · B22',
    warrantyMonths: 24,
    hsnCode: '8539',
    deliveryEtaHours: 24,
    images: [
      'https://images.pexels.com/photos/1036936/pexels-photo-1036936.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'Bosch Microwave Oven 25L',
    description: 'Convection microwave oven, 25 L capacity. Great for restaurant kitchens and pantries.',
    price: 14999,
    stock: 35,
    featured: true,
    categorySlug: 'electronics',
    unit: 'unit',
    moq: 1,
    stepSize: 1,
    priceTiers: [
      { minQty: 3, price: 14299 },
      { minQty: 10, price: 13499 },
    ],
    brand: 'Bosch',
    keySpec: '25 L · Convection · 900 W',
    warrantyMonths: 12,
    hsnCode: '8516',
    deliveryEtaHours: 72,
    images: [
      'https://images.pexels.com/photos/2284166/pexels-photo-2284166.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
  {
    name: 'TP-Link Wi-Fi 6 Router',
    description: 'AX1500 dual-band Wi-Fi 6 router. Gigabit ports, OFDMA. Suitable for offices up to 50 devices.',
    price: 4499,
    stock: 120,
    categorySlug: 'electronics',
    unit: 'unit',
    moq: 1,
    stepSize: 1,
    priceTiers: [
      { minQty: 5, price: 4299 },
      { minQty: 20, price: 4099 },
    ],
    brand: 'TP-Link',
    keySpec: 'Wi-Fi 6 · AX1500 · 4× Gigabit',
    warrantyMonths: 36,
    hsnCode: '8517',
    deliveryEtaHours: 48,
    images: [
      'https://images.pexels.com/photos/4219088/pexels-photo-4219088.jpeg?auto=compress&cs=tinysrgb&w=1200',
    ],
  },
];

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Wipe and reseed for a clean B2B demo state
    await Product.deleteMany({});
    await Category.deleteMany({});

    const slugToCategory = new Map<string, { id: string; name: string }>();
    for (const cat of CATEGORIES) {
      const doc = await Category.create({
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        imageUrl: cat.imageUrl,
      });
      slugToCategory.set(cat.slug, {
        id: doc._id.toString(),
        name: doc.name,
      });
    }

    let productCount = 0;
    for (const p of PRODUCTS) {
      const cat = slugToCategory.get(p.categorySlug);
      if (!cat) continue;

      await Product.create({
        name: p.name,
        slug: slugify(p.name),
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stock: p.stock,
        unit: p.unit,
        moq: p.moq,
        stepSize: p.stepSize ?? 1,
        packSize: p.packSize,
        priceTiers: p.priceTiers ?? [],
        grade: p.grade ?? '',
        origin: p.origin ?? '',
        shelfLifeDays: p.shelfLifeDays,
        leadTimeHours: p.leadTimeHours,
        warrantyMonths: p.warrantyMonths,
        keySpec: p.keySpec ?? '',
        brand: p.brand ?? '',
        hsnCode: p.hsnCode ?? '',
        deliveryEtaHours: p.deliveryEtaHours ?? 24,
        secondaryImage: p.secondaryImage ?? '',
        featured: p.featured ?? false,
        images: p.images,
        categoryId: cat.id,
        categoryName: cat.name,
      });
      productCount += 1;
    }

    return NextResponse.json({
      ok: true,
      categories: slugToCategory.size,
      products: productCount,
    });
  } catch (err: any) {
    console.error('[POST /api/seed]', err);
    return NextResponse.json(
      { error: err.message ?? 'Seed failed' },
      { status: 500 }
    );
  }
}
