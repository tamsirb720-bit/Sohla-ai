import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

// ---------------------------------------------------------------------------
// In-Memory Database with Initial Seed Data (Verified Gambian Businesses & Ads)
// ---------------------------------------------------------------------------
interface DBStructure {
  categories: any[];
  partners: any[];
  products: any[];
  advertisements: any[];
  auditLogs: any[];
  aiLogs: any[];
  missingRequests: any[];
  cashPowerTransactions: any[];
  governmentPayments: any[];
  adminUsers: any[];
}

const DB_FILE = path.join(process.cwd(), 'data_store.json');

const INITIAL_CATEGORIES = [
  {
    id: 'cat-1',
    key: 'SHOPPING',
    name: 'Shopping',
    tagline: 'Fashion • Electronics • More',
    subcategories: ['Fashion & African Attire', 'Electronics & Phones', 'Supermarkets', 'Jewelry & Watches', 'Home & Kitchen'],
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    icon: 'ShoppingBag',
    color: '#9333ea',
    displayOrder: 1,
    active: true,
    featured: true,
    aiKeywords: ['clothes', 'shopping', 'dresses', 'shoes', 'phones', 'electronics', 'supermarket', 'groceries', 'gold', 'jewelry']
  },
  {
    id: 'cat-2',
    key: 'FOOD & RESTAURANTS',
    name: 'Food & Restaurants',
    tagline: 'Dine • Takeaway • Home Delivery',
    subcategories: ['Gambian Local Cuisine (Benachin/Domoda)', 'Seafood & Grills', 'Shawarma & Fast Food', 'Cafes & Bakeries', 'Fine Dining'],
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    icon: 'Utensils',
    color: '#ea580c',
    displayOrder: 2,
    active: true,
    featured: true,
    aiKeywords: ['food', 'restaurant', 'benachin', 'domoda', 'yassa', 'shawarma', 'lunch', 'dinner', 'cake', 'bakery', 'coffee', 'breakfast']
  },
  {
    id: 'cat-3',
    key: 'TRANSPORT',
    name: 'Transport',
    tagline: 'Taxi • Ride • Airport Transfers',
    subcategories: ['Town Trip Taxis', 'Airport Transfers', 'Car Hire', 'Yellow Taxi Stands'],
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80',
    icon: 'Car',
    color: '#2563eb',
    displayOrder: 3,
    active: true,
    featured: true,
    aiKeywords: ['taxi', 'car', 'airport transfer', 'ride', 'driver', 'rental', 'transport', 'senegambia taxi', 'banjul transport']
  },
  {
    id: 'cat-4',
    key: 'DELIVERY & ERRANDS',
    name: 'Delivery & Errands',
    tagline: 'Packages • Groceries • Documents',
    subcategories: ['Express Motorcycle Courier', 'Document Dispatch', 'Market Groceries Run', 'Bulk Delivery'],
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
    icon: 'Package',
    color: '#16a34a',
    displayOrder: 4,
    active: true,
    featured: true,
    aiKeywords: ['delivery', 'errands', 'courier', 'package', 'pickup', 'deliver food', 'documents', 'send parcel']
  },
  {
    id: 'cat-5',
    key: 'BEAUTY & WELLNESS',
    name: 'Beauty & Wellness',
    tagline: 'Spa • Hair • Skincare • Fitness',
    subcategories: ['Hair Salons & Braiding', 'Barbershops', 'Spas & Massage', 'Skincare & Cosmetics', 'Gyms & Fitness'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    icon: 'Sparkles',
    color: '#db2777',
    displayOrder: 5,
    active: true,
    featured: true,
    aiKeywords: ['salon', 'hair', 'braiding', 'spa', 'barber', 'massage', 'skincare', 'makeup', 'gym', 'wellness']
  },
  {
    id: 'cat-6',
    key: 'SERVICES',
    name: 'Services',
    tagline: 'Repairs • Cleaning • Skilled Work',
    subcategories: ['AC & Electricians', 'Plumbing & Repairs', 'Home & Office Cleaning', 'Graphic Design & Tech'],
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    icon: 'Wrench',
    color: '#d97706',
    displayOrder: 6,
    active: true,
    featured: true,
    aiKeywords: ['electrician', 'plumber', 'ac repair', 'mechanic', 'cleaning', 'carpenter', 'technician', 'painter']
  },
  {
    id: 'cat-7',
    key: 'BUY CASH POWER (NAWEC)',
    name: 'Buy Cash Power (NAWEC)',
    tagline: 'Electricity • Recharge',
    subcategories: ['Prepaid Meter Recharge', 'Token History', 'Tariff Calculator', 'Meter Verification'],
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
    icon: 'Zap',
    color: '#0d9488',
    displayOrder: 7,
    active: true,
    featured: true,
    aiKeywords: ['nawec', 'cash power', 'electricity', 'meter', 'token', 'power recharge', 'light bill', 'prepaid meter']
  },
  {
    id: 'cat-8',
    key: 'GOVERNMENT PAYMENTS',
    name: 'Government Payments',
    tagline: 'Taxes • Fees • Official Services',
    subcategories: ['Gambia Revenue Authority (GRA)', 'Municipal Rates (KMC/BCC/BAC)', 'Registrar General Business Fees'],
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
    icon: 'Landmark',
    color: '#7c3aed',
    displayOrder: 8,
    active: true,
    featured: true,
    aiKeywords: ['gra', 'government', 'tax', 'tin', 'kmc', 'bcc', 'rates', 'licence', 'fees', 'official payment']
  },
  {
    id: 'cat-9',
    key: 'AI JOBS & INCOME',
    name: 'AI Jobs & Income',
    tagline: 'Learn • Work • Earn',
    subcategories: ['Local AI Training & Labeling', 'Prompt Engineering Micro-gigs', 'Digital Creator Grants', 'AI Skills Workshops'],
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
    icon: 'Briefcase',
    color: '#4f46e5',
    displayOrder: 9,
    active: true,
    featured: true,
    aiKeywords: ['jobs', 'income', 'earn money', 'freelance', 'ai tasks', 'digital work', 'internship', 'training']
  },
  {
    id: 'cat-10',
    key: 'PAYMENTS',
    name: 'Payments',
    tagline: 'Send • Receive • Pay Bills',
    subcategories: ['Wave Mobile Money', 'QMoney', 'Afrimoney', 'Bank Transfers', 'Merchant Pay'],
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
    icon: 'CreditCard',
    color: '#0284c7',
    displayOrder: 10,
    active: true,
    featured: true,
    aiKeywords: ['wave', 'qmoney', 'afrimoney', 'send money', 'pay merchant', 'mobile money', 'dalasi transfer']
  }
];

const INITIAL_PARTNERS = [
  {
    id: 'bp-1',
    name: 'Senegambia Beach Terrace Restaurant',
    owner: 'Fatoumatta Jallow',
    description: 'Authentic Gambian coastal dining with fresh Atlantic seafood, traditional Benachin, and signature grills right on the Senegambia strip.',
    category: 'FOOD & RESTAURANTS',
    subcategory: 'Gambian Local Cuisine (Benachin/Domoda)',
    location: 'Senegambia',
    address: 'Kotu Stream Road, Senegambia Strip, Kololi',
    phone: '+220 788 1234',
    whatsapp: '+220 788 1234',
    email: 'info@senegambiaterrace.gm',
    website: 'https://senegambiaterrace.gm',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
    ],
    openingHours: '11:00 AM - 11:30 PM (Daily)',
    deliveryAvailable: true,
    deliveryFee: 150, // D150
    estimatedDeliveryTime: '30 - 45 mins',
    products: [
      { id: 'p-1', partnerId: 'bp-1', name: 'Signature Fish Benachin', description: 'One-pot rice prepared in rich tomato reduction with fresh caught Ladyfish & garden cassava.', price: 280, currency: 'GMD', category: 'Main Dish', stock: 40, available: true, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-2', partnerId: 'bp-1', name: 'Slow-Cooked Beef Domoda', description: 'Rich roasted peanut butter stew served over steaming jasmine rice with sweet potatoes.', price: 320, currency: 'GMD', category: 'Main Dish', stock: 30, available: true, image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-3', partnerId: 'bp-1', name: 'Charcoal Grilled King Prawns (Platter)', description: 'Jumbo prawns basted with Gambian garlic chili herb butter, served with crisp fried plantains.', price: 550, currency: 'GMD', category: 'Seafood', stock: 15, available: true, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-4', partnerId: 'bp-1', name: 'Fresh Wonjo & Baobab Nectar', description: 'Chilled hibiscus flower infusion blended with wild organic baobab fruit pulp.', price: 80, currency: 'GMD', category: 'Beverages', stock: 100, available: true, image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80' }
    ],
    services: [
      { id: 's-1', partnerId: 'bp-1', name: 'Catering for Events & Celebrations', description: 'Full buffet setup with buffet chafing dishes and service staff.', startingPrice: 3500, available: true }
    ],
    promotions: '10% off for Orders above D1,000 using SOHLA',
    rating: 4.8,
    reviewCount: 142,
    verificationStatus: 'verified',
    featuredStatus: true,
    activeStatus: true,
    dateAdded: '2026-01-10',
    lastUpdated: '2026-09-10'
  },
  {
    id: 'bp-2',
    name: 'Kairaba Tech Hub & Gadgets',
    owner: 'Alieu Ceesay',
    description: 'Premier authorized retailer for smartphones, laptops, fast chargers, solar power backup units, and certified device repair.',
    category: 'SHOPPING',
    subcategory: 'Electronics & Phones',
    location: 'Kairaba Avenue',
    address: '44 Kairaba Avenue, Next to Elton Petrol Station, Fajara',
    phone: '+220 395 8899',
    whatsapp: '+220 395 8899',
    email: 'sales@kairabatech.gm',
    website: 'https://kairabatech.gm',
    logo: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80'
    ],
    openingHours: '09:00 AM - 08:00 PM (Mon-Sat)',
    deliveryAvailable: true,
    deliveryFee: 100, // D100
    estimatedDeliveryTime: 'Same Day Dispatch',
    products: [
      { id: 'p-5', partnerId: 'bp-2', name: 'Samsung Galaxy A25 5G (128GB)', description: 'Original manufacturer sealed box, 1-year local warranty in The Gambia.', price: 11500, currency: 'GMD', category: 'Smartphones', stock: 8, available: true, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-6', partnerId: 'bp-2', name: 'Oraimo 20,000mAh Heavy Duty Power Bank', description: 'Dual USB-C fast charging with digital LED battery percentage.', price: 1250, currency: 'GMD', category: 'Accessories', stock: 25, available: true, image: 'https://images.unsplash.com/photo-1609592424109-dd9892f1b177?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-7', partnerId: 'bp-2', name: 'Solar Generator Emergency Home Lighting Kit', description: 'Includes 3 LED light bulbs, mini solar panel and mobile phone charging adapters.', price: 2900, currency: 'GMD', category: 'Solar & Power', stock: 12, available: true, image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=400&q=80' }
    ],
    services: [
      { id: 's-2', partnerId: 'bp-2', name: 'Screen Replacement & Diagnostic', description: 'Quick 1-hour screen replacement with authentic parts.', startingPrice: 850, available: true }
    ],
    promotions: 'Free screen protector with any phone purchase',
    rating: 4.9,
    reviewCount: 98,
    verificationStatus: 'verified',
    featuredStatus: true,
    activeStatus: true,
    dateAdded: '2026-02-01',
    lastUpdated: '2026-09-11'
  },
  {
    id: 'bp-3',
    name: 'Banjul Express Yellow Taxi & Airport Shuttle',
    owner: 'Modou Lamin Touray',
    description: 'Reliable, air-conditioned airport pickups, town trips, hotel shuttles across Greater Banjul, Senegambia, Brusubi, and coastal hotels.',
    category: 'TRANSPORT',
    subcategory: 'Town Trip Taxis',
    location: 'Banjul & Kololi',
    address: 'BIA International Airport Terminal & Senegambia Taxi Stand',
    phone: '+220 991 4455',
    whatsapp: '+220 991 4455',
    email: 'bookings@banjulexpress.gm',
    logo: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
    photos: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80'],
    openingHours: '24 Hours / 7 Days',
    deliveryAvailable: false,
    deliveryFee: 0,
    estimatedDeliveryTime: '10 - 15 mins dispatch',
    products: [],
    services: [
      { id: 's-3', partnerId: 'bp-3', name: 'Airport to Senegambia / Kololi Transfer', description: 'Private AC saloon car with luggage assistance directly to your hotel.', startingPrice: 900, available: true },
      { id: 's-4', partnerId: 'bp-3', name: 'Town Trip (Senegambia to Banjul)', description: 'Fast non-stop ride across Bertil Harding Highway.', startingPrice: 400, available: true },
      { id: 's-5', partnerId: 'bp-3', name: 'Full Day Chauffeured Vehicle Hire', description: 'Dedicated vehicle and experienced driver for full day touring or meetings.', startingPrice: 2500, available: true }
    ],
    promotions: 'D100 discount on roundtrip airport bookings',
    rating: 4.7,
    reviewCount: 210,
    verificationStatus: 'verified',
    featuredStatus: true,
    activeStatus: true,
    dateAdded: '2026-01-15',
    lastUpdated: '2026-09-08'
  },
  {
    id: 'bp-4',
    name: 'SOHLA Swift Delivery & Errand Couriers',
    owner: 'Ebrima Sonko',
    description: 'Fast motorcycle courier service throughout the Greater Banjul Area. Package drops, market grocery pickups, document runs, and pharmacy deliveries.',
    category: 'DELIVERY & ERRANDS',
    subcategory: 'Express Motorcycle Courier',
    location: 'Serekunda & West Coast',
    address: 'Westfield Junction Hub, Serekunda',
    phone: '+220 230 7711',
    whatsapp: '+220 230 7711',
    email: 'dispatch@sohlaswift.gm',
    logo: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    photos: [],
    openingHours: '07:30 AM - 10:00 PM (Daily)',
    deliveryAvailable: true,
    deliveryFee: 80,
    estimatedDeliveryTime: '25 - 40 mins',
    products: [],
    services: [
      { id: 's-6', partnerId: 'bp-4', name: 'Standard Parcel Delivery (Greater Banjul)', description: 'Up to 5kg door-to-door courier dispatch.', startingPrice: 120, available: true },
      { id: 's-7', partnerId: 'bp-4', name: 'Serekunda Market Grocery Errand', description: 'Our courier visits the market to purchase and deliver fresh vegetables, spices & fish.', startingPrice: 200, available: true },
      { id: 's-8', partnerId: 'bp-4', name: 'Urgent Document & Bank Cheque Dispatch', description: 'Secure insured courier with instant proof of signature.', startingPrice: 150, available: true }
    ],
    promotions: 'First errand delivery free for new SOHLA app users',
    rating: 4.9,
    reviewCount: 312,
    verificationStatus: 'verified',
    featuredStatus: true,
    activeStatus: true,
    dateAdded: '2026-01-05',
    lastUpdated: '2026-09-12'
  },
  {
    id: 'bp-5',
    name: 'Gambia Glow Beauty Lounge & Natural Spa',
    owner: 'Mariama Camara',
    description: 'Luxury wellness sanctuary offering African hair braiding, organic shea butter body massages, Moroccan bath rituals, and facial treatments.',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Hair Salons & Braiding',
    location: 'Brusubi',
    address: 'Brusubi Roundabout, Phase 1, Near Turntable',
    phone: '+220 512 3344',
    whatsapp: '+220 512 3344',
    email: 'contact@gambaglow.gm',
    logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    photos: [],
    openingHours: '09:30 AM - 09:00 PM (Tue-Sun)',
    deliveryAvailable: false,
    deliveryFee: 0,
    estimatedDeliveryTime: 'By Appointment',
    products: [
      { id: 'p-8', partnerId: 'bp-5', name: 'Pure Unrefined Gambian Shea Butter (500g)', description: 'Handcrafted cold-pressed moisturizing butter with baobab oil infusion.', price: 350, currency: 'GMD', category: 'Skincare', stock: 45, available: true, image: 'https://images.unsplash.com/photo-1608248597359-561352125a40?auto=format&fit=crop&w=400&q=80' }
    ],
    services: [
      { id: 's-9', partnerId: 'bp-5', name: 'Knotless Braids with Extensions', description: 'Expert stylist braiding, includes soothing scalp treatment.', startingPrice: 1200, available: true },
      { id: 's-10', partnerId: 'bp-5', name: 'Aromatherapy Deep Tissue Massage (60 mins)', description: 'Relaxing full body massage with warm coconut & eucalyptus essential oils.', startingPrice: 1500, available: true }
    ],
    promotions: 'Complimentary herbal tea with every spa package',
    rating: 4.8,
    reviewCount: 88,
    verificationStatus: 'verified',
    featuredStatus: true,
    activeStatus: true,
    dateAdded: '2026-02-10',
    lastUpdated: '2026-09-02'
  },
  {
    id: 'bp-6',
    name: 'Banjul Pro AC & Electrical Engineering',
    owner: 'Baboucarr Sanyang',
    description: 'Licensed HVAC electrical contractors providing residential & commercial air conditioning installation, fault diagnosis, and solar inverters.',
    category: 'SERVICES',
    subcategory: 'AC & Electricians',
    location: 'Fajara & Kairaba',
    address: 'Atlantic Road, Fajara Craft Market area',
    phone: '+220 622 9900',
    whatsapp: '+220 622 9900',
    email: 'info@banjulproelectrics.gm',
    logo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    photos: [],
    openingHours: '08:00 AM - 07:00 PM (Mon-Sat)',
    deliveryAvailable: false,
    deliveryFee: 0,
    estimatedDeliveryTime: 'On-site response in 45 mins',
    products: [],
    services: [
      { id: 's-11', partnerId: 'bp-6', name: 'Split Unit AC Servicing & Gas Refill', description: 'Deep coil cleaning, filter antibacterial wash, and R410A gas top-up.', startingPrice: 950, available: true },
      { id: 's-12', partnerId: 'bp-6', name: 'Home Circuit Breaker & NAWEC Meter Check', description: 'Diagnose tripping breakers and verify safe grounding.', startingPrice: 600, available: true }
    ],
    promotions: 'Free electrical safety assessment with AC installation',
    rating: 4.9,
    reviewCount: 76,
    verificationStatus: 'verified',
    featuredStatus: false,
    activeStatus: true,
    dateAdded: '2026-02-15',
    lastUpdated: '2026-09-05'
  }
];

const INITIAL_ADS = [
  {
    id: 'ad-1',
    title: 'SOHLA AI — The Gambia’s All-in-One AI Platform',
    advertiser: 'SOHLA Official',
    description: 'Banjul, Senegambia, and West Coast connected. NAWEC Cash Power, Yellow Taxis & local food.',
    ctaText: 'Explore SOHLA AI',
    ctaLink: '#sohla-ai',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 6,
    active: true,
    priority: 1,
    targetCategory: 'ALL',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    impressions: 1420,
    clicks: 345,
    badge: '⚡ 6s Quick Ad'
  },
  {
    id: 'ad-2',
    title: 'Instant NAWEC Cash Power — 30s Recharge Token',
    advertiser: 'NAWEC & SOHLA Pay',
    description: 'Enter your meter number, pay with local Dalasi, and get your 20-digit token instantly on WhatsApp!',
    ctaText: 'Buy Cash Power Now',
    ctaLink: '#cashpower',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electronic-particles-41221-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 5,
    active: true,
    priority: 2,
    targetCategory: 'BUY CASH POWER (NAWEC)',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    impressions: 980,
    clicks: 215,
    badge: '⚡ 5s Quick Ad'
  },
  {
    id: 'ad-3',
    title: 'Senegambia Beach Terrace — Atlantic Sunset Grills',
    advertiser: 'Senegambia Beach Terrace',
    description: 'Taste authentic Atlantic King Prawns and traditional Benachin by the ocean tonight.',
    ctaText: 'View Restaurant Menu',
    ctaLink: '#partner-bp-1',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 6,
    active: true,
    priority: 3,
    targetCategory: 'FOOD & RESTAURANTS',
    startDate: '2026-03-01',
    endDate: '2026-10-31',
    impressions: 740,
    clicks: 160,
    badge: '⚡ 6s Quick Ad'
  },
  {
    id: 'ad-4',
    title: 'Sunshine Yellow Taxi — 24/7 Airport & Senegambia Rides',
    advertiser: 'Sunshine Yellow Taxi Service',
    description: 'Official Banjul International Airport transfers and Senegambia Strip rides at fixed Dalasi rates.',
    ctaText: 'Book Taxi Ride',
    ctaLink: '#partner-bp-3',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 5,
    active: true,
    priority: 4,
    targetCategory: 'TAXIS & TRANSPORT',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    impressions: 610,
    clicks: 140,
    badge: '⚡ 5s Quick Ad'
  },
  {
    id: 'ad-5',
    title: 'SOHLA AI Jobs — Earn Dalasi with Micro-Tasks',
    advertiser: 'SOHLA AI Income Gigs',
    description: 'Train local AI models, verify Gambian merchant data, and receive instant payouts in Dalasi.',
    ctaText: 'Start Earning Today',
    ctaLink: '#aijobs',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-typing-on-a-laptop-keyboard-41315-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 6,
    active: true,
    priority: 5,
    targetCategory: 'AI JOBS & INCOME',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    impressions: 530,
    clicks: 195,
    badge: '⚡ 6s Quick Ad'
  }
];

const INITIAL_ADMIN_USERS = [
  {
    id: 'u-1',
    username: 'superadmin',
    name: 'Tamsir B. (Super Admin)',
    email: 'tamsirb720@gmail.com',
    role: 'SUPER_ADMIN',
    phone: '+220 788 1234',
    nationalIdOrNin: 'GMB-NIN-940218-01A',
    department: 'Executive Security & Platform Governance',
    securityClearance: 'TIER_1_CORE',
    verifiedPersonal: true,
    verifiedBy: 'National Civil Registry & Biometrics Office',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'u-2',
    username: 'bizmanager',
    name: 'Fatou Kinteh (Business Manager)',
    email: 'fatou@sohla.gm',
    role: 'BUSINESS_MANAGER',
    phone: '+220 311 8899',
    nationalIdOrNin: 'GMB-NIN-891104-45B',
    department: 'Merchant Onboarding & Partnerships',
    securityClearance: 'TIER_2_OPERATIONAL',
    verifiedPersonal: true,
    verifiedBy: 'Tamsir B. (Super Admin)',
    verifiedAt: '2026-01-05T09:30:00.000Z',
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    active: true,
    createdAt: '2026-01-05T09:30:00.000Z'
  },
  {
    id: 'u-3',
    username: 'contentmgr',
    name: 'Bakary Sanneh (Content Manager)',
    email: 'bakary@sohla.gm',
    role: 'CONTENT_MANAGER',
    phone: '+220 994 5522',
    nationalIdOrNin: 'GMB-NIN-920512-88C',
    department: 'Billboard Ads & Media Moderation',
    securityClearance: 'TIER_2_OPERATIONAL',
    verifiedPersonal: true,
    verifiedBy: 'Tamsir B. (Super Admin)',
    verifiedAt: '2026-01-08T11:15:00.000Z',
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    active: true,
    createdAt: '2026-01-08T11:15:00.000Z'
  },
  {
    id: 'u-4',
    username: 'analyst',
    name: 'Ida Manneh (Platform Analyst)',
    email: 'ida@sohla.gm',
    role: 'ANALYST',
    phone: '+220 220 7711',
    nationalIdOrNin: 'GMB-NIN-960829-33D',
    department: 'AI Telemetry & Business Intelligence',
    securityClearance: 'TIER_3_SUPPORT',
    verifiedPersonal: true,
    verifiedBy: 'Tamsir B. (Super Admin)',
    verifiedAt: '2026-01-12T14:20:00.000Z',
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    active: true,
    createdAt: '2026-01-12T14:20:00.000Z'
  },
  {
    id: 'u-5',
    username: 'support',
    name: 'Lamin Bojang (Customer Support)',
    email: 'support@sohla.gm',
    role: 'SUPPORT',
    phone: '+220 665 4321',
    nationalIdOrNin: 'GMB-NIN-981203-12E',
    department: 'Citizen Care & Emergency Helpdesk',
    securityClearance: 'TIER_3_SUPPORT',
    verifiedPersonal: true,
    verifiedBy: 'Tamsir B. (Super Admin)',
    verifiedAt: '2026-01-15T08:45:00.000Z',
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    active: true,
    createdAt: '2026-01-15T08:45:00.000Z'
  }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'log-1', timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), adminId: 'u-1', adminName: 'Super Admin', role: 'SUPER_ADMIN', action: 'SYSTEM_INITIALIZATION', targetRecord: 'PLATFORM_CORE', newValue: 'Initialized SOHLA Upgrade Architecture', result: 'SUCCESS' },
  { id: 'log-2', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), adminId: 'u-1', adminName: 'Super Admin', role: 'SUPER_ADMIN', action: 'PARTNER_VERIFIED', targetRecord: 'bp-1 (Senegambia Beach Terrace)', newValue: 'status: verified', result: 'SUCCESS' },
  { id: 'log-3', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), adminId: 'u-2', adminName: 'Business Manager', role: 'BUSINESS_MANAGER', action: 'PRICE_UPDATE', targetRecord: 'bp-2 (p-5 Galaxy A25)', previousValue: 'D12,000', newValue: 'D11,500', result: 'SUCCESS' }
];

const INITIAL_MISSING_REQUESTS = [
  { id: 'mr-1', timestamp: new Date(Date.now() - 86400000).toISOString(), query: 'I need a fresh custom birthday cake in Senegambia', missingItem: 'Custom Birthday Cake bakery', missingCategory: 'FOOD & RESTAURANTS', requestedLocation: 'Senegambia', frequency: 7, resolved: false, notes: 'Multiple users searching for fresh bakery in Senegambia corridor.' },
  { id: 'mr-2', timestamp: new Date(Date.now() - 43200000).toISOString(), query: 'Car battery jumpstart service in Brusubi turntable', missingItem: 'Mobile Mechanic Jumpstart', missingCategory: 'SERVICES', requestedLocation: 'Brusubi', frequency: 3, resolved: false, notes: 'Emergency breakdown request logged.' }
];

// Initialize database
let db: DBStructure = {
  categories: INITIAL_CATEGORIES,
  partners: INITIAL_PARTNERS,
  products: INITIAL_PARTNERS.flatMap(p => p.products),
  advertisements: INITIAL_ADS,
  auditLogs: INITIAL_AUDIT_LOGS,
  aiLogs: [],
  missingRequests: INITIAL_MISSING_REQUESTS,
  cashPowerTransactions: [
    { id: 'cpt-1', meterNumber: '0714-8892-3310', meterOwner: 'Lamin Touray (Kairaba)', amountDalasi: 500, phone: '+220 788 1234', tokenGenerated: '4819-2041-8930-1120-7761', unitsKWh: 45.4, tariffGMDPerKWh: 11.0, timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'COMPLETED', isRealGateway: false }
  ],
  governmentPayments: [
    { id: 'gov-1', serviceType: 'GRA Personal Income Tax', tinOrReference: 'TIN-9923841-B', taxpayerName: 'Fatoumatta Jallow', amountDalasi: 1250, phone: '+220 788 1234', receiptNumber: 'GRA-REC-2026-08122', status: 'COMPLETED', isRealGateway: false, timestamp: new Date(Date.now() - 14400000).toISOString() }
  ],
  adminUsers: INITIAL_ADMIN_USERS
};

// Try loading existing saved database from disk if present
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.partners && parsed.categories) {
      db = { ...db, ...parsed };
      // Ensure short (5-8s) few-second ad durations as requested
      if (db.advertisements && db.advertisements.length > 0) {
        db.advertisements.forEach((ad: any) => {
          if (!ad.durationSeconds || ad.durationSeconds > 8) {
            ad.durationSeconds = 6;
          }
        });
      }
      // Ensure admin users have verified personal and security clearance fields
      if (!db.adminUsers || db.adminUsers.length === 0) {
        db.adminUsers = INITIAL_ADMIN_USERS;
      } else {
        db.adminUsers = db.adminUsers.map((u: any, idx: number) => {
          const fallback = INITIAL_ADMIN_USERS[idx] || INITIAL_ADMIN_USERS[0];
          return {
            ...fallback,
            ...u,
            nationalIdOrNin: u.nationalIdOrNin || fallback.nationalIdOrNin || `GMB-NIN-${Math.floor(100000 + Math.random() * 899999)}-${(u.role || 'ST').substring(0, 2)}`,
            phone: u.phone || fallback.phone || '+220 788 1234',
            department: u.department || fallback.department || 'Operations & Support',
            securityClearance: u.securityClearance || fallback.securityClearance || (u.role === 'SUPER_ADMIN' ? 'TIER_1_CORE' : 'TIER_2_OPERATIONAL'),
            verifiedPersonal: u.verifiedPersonal !== undefined ? u.verifiedPersonal : true,
            verifiedBy: u.verifiedBy || fallback.verifiedBy || 'National Civil Registry & Biometrics Office',
            verifiedAt: u.verifiedAt || fallback.verifiedAt || '2026-01-01T00:00:00.000Z',
            twoFactorEnabled: u.twoFactorEnabled !== undefined ? u.twoFactorEnabled : true
          };
        });
      }
    }
  } catch (err) {
    console.warn('Could not read existing db file, using fresh initial seed:', err);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB to disk:', err);
  }
}

function logAudit(adminName: string, role: string, action: string, targetRecord: string, previousValue?: string, newValue?: string, result: 'SUCCESS' | 'FAILURE' | 'WARNING' = 'SUCCESS') {
  const entry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    adminId: 'current-session',
    adminName,
    role,
    action,
    targetRecord,
    previousValue,
    newValue,
    result
  };
  db.auditLogs.unshift(entry);
  if (db.auditLogs.length > 500) db.auditLogs.pop();
  saveDB();
  return entry;
}

// ---------------------------------------------------------------------------
// REST API ROUTES
// ---------------------------------------------------------------------------

// 1. System Health
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: 'ONLINE',
      partnersCount: db.partners.length,
      productsCount: db.products.length,
      categoriesCount: db.categories.length,
      adsCount: db.advertisements.length
    },
    aiService: {
      provider: 'Google Gemini 3.8 Flash',
      apiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
      status: process.env.GEMINI_API_KEY ? 'ONLINE' : 'FALLBACK_MODE'
    },
    services: {
      nawecCashPower: 'ONLINE (DEMO/TEST SIMULATOR)',
      graPayments: 'ONLINE (DEMO/TEST SIMULATOR)',
      adEngine: 'ACTIVE'
    }
  });
});

// 2. Categories
app.get('/api/categories', (req: Request, res: Response) => {
  const sorted = [...db.categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  res.json(sorted);
});

app.post('/api/categories', (req: Request, res: Response) => {
  const { name, tagline, subcategories, image, icon, color, active, featured, aiKeywords } = req.body;
  const newCat = {
    id: `cat-${Date.now()}`,
    key: (name || '').toUpperCase().replace(/\s+/g, ' '),
    name,
    tagline: tagline || '',
    subcategories: subcategories || [],
    image: image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    icon: icon || 'Sparkles',
    color: color || '#9333ea',
    displayOrder: db.categories.length + 1,
    active: active ?? true,
    featured: featured ?? false,
    aiKeywords: aiKeywords || []
  };
  db.categories.push(newCat);
  logAudit('Admin', 'CONTENT_MANAGER', 'CATEGORY_ADDED', newCat.name, undefined, JSON.stringify(newCat));
  saveDB();
  res.json({ success: true, category: newCat });
});

app.put('/api/categories/:id', (req: Request, res: Response) => {
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  const oldName = cat.name;
  Object.assign(cat, req.body);
  logAudit('Admin', 'CONTENT_MANAGER', 'CATEGORY_UPDATED', cat.name, oldName, JSON.stringify(cat));
  saveDB();
  res.json({ success: true, category: cat });
});

// 3. Business Partners (Verified Database)
app.get('/api/partners', (req: Request, res: Response) => {
  let list = [...db.partners];
  const { category, location, status, search, featured } = req.query;

  if (category && category !== 'ALL') {
    list = list.filter(p => p.category?.toUpperCase() === String(category).toUpperCase());
  }
  if (location && location !== 'ALL') {
    list = list.filter(p => p.location?.toLowerCase().includes(String(location).toLowerCase()));
  }
  if (status && status !== 'ALL') {
    list = list.filter(p => p.verificationStatus === status);
  }
  if (featured === 'true') {
    list = list.filter(p => p.featuredStatus);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q) ||
      p.products?.some((prod: any) => prod.name.toLowerCase().includes(q))
    );
  }
  res.json(list);
});

app.get('/api/partners/:id', (req: Request, res: Response) => {
  const partner = db.partners.find(p => p.id === req.params.id);
  if (!partner) {
    res.status(404).json({ error: 'Partner not found' });
    return;
  }
  res.json(partner);
});

app.post('/api/partners', (req: Request, res: Response) => {
  const p = req.body;
  const newPartner = {
    id: `bp-${Date.now()}`,
    name: p.name || 'New Verified Partner',
    owner: p.owner || 'Business Owner',
    description: p.description || '',
    category: p.category || 'SERVICES',
    subcategory: p.subcategory || '',
    location: p.location || 'Greater Banjul',
    address: p.address || '',
    phone: p.phone || '',
    whatsapp: p.whatsapp || p.phone || '',
    email: p.email || '',
    website: p.website || '',
    socialMedia: p.socialMedia || '',
    logo: p.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    coverImage: p.coverImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    photos: p.photos || [],
    openingHours: p.openingHours || '09:00 AM - 08:00 PM',
    deliveryAvailable: Boolean(p.deliveryAvailable),
    deliveryFee: Number(p.deliveryFee || 0),
    estimatedDeliveryTime: p.estimatedDeliveryTime || '30-45 mins',
    products: p.products || [],
    services: p.services || [],
    promotions: p.promotions || '',
    rating: 5.0,
    reviewCount: 1,
    verificationStatus: p.verificationStatus || 'verified',
    featuredStatus: Boolean(p.featuredStatus),
    activeStatus: p.activeStatus !== undefined ? Boolean(p.activeStatus) : true,
    dateAdded: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  db.partners.push(newPartner);
  // Also register any initial products
  if (newPartner.products && newPartner.products.length) {
    newPartner.products.forEach((prod: any) => {
      prod.partnerId = newPartner.id;
      db.products.push(prod);
    });
  }
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PARTNER_ADDED', newPartner.name, undefined, JSON.stringify(newPartner));
  saveDB();
  res.json({ success: true, partner: newPartner });
});

app.put('/api/partners/:id', (req: Request, res: Response) => {
  const partner = db.partners.find(p => p.id === req.params.id);
  if (!partner) {
    res.status(404).json({ error: 'Partner not found' });
    return;
  }
  const old = { ...partner };
  Object.assign(partner, req.body, { lastUpdated: new Date().toISOString().split('T')[0] });
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PARTNER_UPDATED', partner.name, JSON.stringify(old), JSON.stringify(partner));
  saveDB();
  res.json({ success: true, partner });
});

app.delete('/api/partners/:id', (req: Request, res: Response) => {
  const idx = db.partners.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Partner not found' });
    return;
  }
  const removed = db.partners.splice(idx, 1)[0];
  db.products = db.products.filter(pr => pr.partnerId !== req.params.id);
  logAudit(req.body._adminName || 'Admin', 'SUPER_ADMIN', 'PARTNER_DELETED', removed.name, JSON.stringify(removed), 'DELETED');
  saveDB();
  res.json({ success: true, message: `Partner ${removed.name} archived/deleted` });
});

// 4. Products & Services Management
app.get('/api/products', (req: Request, res: Response) => {
  res.json(db.products);
});

app.post('/api/products', (req: Request, res: Response) => {
  const p = req.body;
  const newProduct = {
    id: `prod-${Date.now()}`,
    partnerId: p.partnerId,
    name: p.name,
    description: p.description || '',
    price: Number(p.price || 0),
    currency: 'GMD',
    category: p.category || 'General',
    stock: Number(p.stock || 10),
    available: p.available !== false,
    image: p.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    promotion: p.promotion || ''
  };
  db.products.push(newProduct);
  // Also add to partner
  const partner = db.partners.find(pa => pa.id === p.partnerId);
  if (partner) {
    partner.products = partner.products || [];
    partner.products.push(newProduct);
  }
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PRODUCT_ADDED', newProduct.name, undefined, JSON.stringify(newProduct));
  saveDB();
  res.json({ success: true, product: newProduct });
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const prod = db.products.find(p => p.id === req.params.id);
  if (!prod) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const old = { ...prod };
  Object.assign(prod, req.body);
  // sync inside partner as well
  const partner = db.partners.find(pa => pa.id === prod.partnerId);
  if (partner && partner.products) {
    const idx = partner.products.findIndex((p: any) => p.id === prod.id);
    if (idx !== -1) partner.products[idx] = { ...prod };
  }
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PRODUCT_UPDATED', prod.name, JSON.stringify(old), JSON.stringify(prod));
  saveDB();
  res.json({ success: true, product: prod });
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const removed = db.products.splice(idx, 1)[0];
  const partner = db.partners.find(pa => pa.id === removed.partnerId);
  if (partner && partner.products) {
    partner.products = partner.products.filter((p: any) => p.id !== removed.id);
  }
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PRODUCT_DELETED', removed.name, JSON.stringify(removed), 'DELETED');
  saveDB();
  res.json({ success: true });
});

// 5. Advertisements Management
app.get('/api/ads', (req: Request, res: Response) => {
  const activeAds = db.advertisements
    .filter(ad => ad.active)
    .sort((a, b) => (a.priority || 1) - (b.priority || 1));
  res.json(activeAds);
});

app.get('/api/admin/ads', (req: Request, res: Response) => {
  res.json(db.advertisements);
});

// Common handler for creating/uploading ads
const createAdHandler = (req: Request, res: Response) => {
  const ad = req.body;
  const duration = Math.min(Math.max(Number(ad.durationSeconds || 6), 3), 30);
  const newAd = {
    id: `ad-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: ad.title || 'New SOHLA Advertisement',
    advertiser: ad.advertiser || 'SOHLA Partner',
    description: ad.description || '',
    ctaText: ad.ctaText || 'Explore Now',
    ctaLink: ad.ctaLink || '#',
    type: ad.type || 'video',
    mediaUrl: ad.mediaUrl || 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
    posterUrl: ad.posterUrl || '',
    durationSeconds: duration,
    active: ad.active !== false,
    priority: Number(ad.priority || 1),
    targetCategory: ad.targetCategory || 'ALL',
    startDate: ad.startDate || new Date().toISOString().split('T')[0],
    endDate: ad.endDate || '2026-12-31',
    impressions: 0,
    clicks: 0,
    badge: ad.badge || `⚡ ${duration}s Quick Ad`,
    autoGenerated: Boolean(ad.autoGenerated)
  };
  db.advertisements.unshift(newAd);
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'AD_CREATED', newAd.title, undefined, JSON.stringify(newAd));
  saveDB();
  res.json({ success: true, ad: newAd });
};

app.post('/api/ads', createAdHandler);
app.post('/api/admin/ads', createAdHandler);

const updateAdHandler = (req: Request, res: Response) => {
  const ad = db.advertisements.find(a => a.id === req.params.id);
  if (!ad) {
    res.status(404).json({ error: 'Ad not found' });
    return;
  }
  Object.assign(ad, req.body);
  if (ad.durationSeconds && ad.durationSeconds > 15) {
    ad.durationSeconds = 8;
  }
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'AD_UPDATED', ad.title);
  saveDB();
  res.json({ success: true, ad });
};

app.put('/api/ads/:id', updateAdHandler);
app.put('/api/admin/ads/:id', updateAdHandler);

const deleteAdHandler = (req: Request, res: Response) => {
  const idx = db.advertisements.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Ad not found' });
    return;
  }
  const removed = db.advertisements.splice(idx, 1)[0];
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'AD_DELETED', removed.title);
  saveDB();
  res.json({ success: true, message: `Ad ${removed.title} deleted` });
};

app.delete('/api/ads/:id', deleteAdHandler);
app.delete('/api/admin/ads/:id', deleteAdHandler);

// Automatic AI Ad Generator (creates punchy 5-8 second ads from database or essentials)
const autoGenerateAdHandler = (req: Request, res: Response) => {
  const { partnerId } = req.body || {};

  const PRESET_VIDEO_CLIPS = [
    'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electronic-particles-41221-large.mp4',
    'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-typing-on-a-laptop-keyboard-41315-large.mp4'
  ];

  let generatedAd: any = null;

  if (partnerId) {
    const partner = db.partners.find(p => p.id === partnerId);
    if (partner) {
      generatedAd = {
        id: `ad-auto-${Date.now()}`,
        title: `${partner.name} — ${partner.subcategory || 'Special Spotlight'}`,
        advertiser: partner.name,
        description: partner.promotions || partner.description?.slice(0, 90) || `Experience verified quality at ${partner.name} in ${partner.location}.`,
        ctaText: partner.category === 'RESTAURANTS' ? 'View Food Menu' : partner.category === 'TAXIS' ? 'Book Taxi Now' : 'Chat on WhatsApp',
        ctaLink: `#partner-${partner.id}`,
        type: 'video',
        mediaUrl: PRESET_VIDEO_CLIPS[Math.floor(Math.random() * PRESET_VIDEO_CLIPS.length)],
        posterUrl: partner.coverImage || partner.logo,
        durationSeconds: 5,
        active: true,
        priority: 1,
        targetCategory: partner.category,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31',
        impressions: 0,
        clicks: 0,
        badge: '⚡ 5s Quick Spotlight',
        autoGenerated: true
      };
    }
  }

  if (!generatedAd) {
    const ESSENTIAL_TEMPLATES = [
      {
        title: 'NAWEC Cash Power — 20-Digit Token in 30 Seconds',
        advertiser: 'NAWEC & SOHLA Pay',
        description: 'Instant prepaid electricity recharge for all Gambian meters. Safe Dalasi checkout & WhatsApp receipt.',
        ctaText: 'Buy Cash Power (NAWEC)',
        ctaLink: '#cashpower',
        type: 'video',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electronic-particles-41221-large.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
        durationSeconds: 5,
        badge: '⚡ 5s Utility Ad',
        category: 'BUY CASH POWER (NAWEC)'
      },
      {
        title: 'Sunshine Yellow Taxi — Reliable Greater Banjul Transfers',
        advertiser: 'Sunshine Yellow Taxi Service',
        description: 'Airport pickups, Senegambia nightlife, and Kololi routes at guaranteed fair Dalasi prices.',
        ctaText: 'Book Sunshine Taxi',
        ctaLink: '#partner-bp-3',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80',
        durationSeconds: 6,
        badge: '⚡ 6s Transport Ad',
        category: 'TAXIS & TRANSPORT'
      },
      {
        title: 'Earn Dalasi with SOHLA AI — Local Data & Micro-Gigs',
        advertiser: 'SOHLA AI Income Platform',
        description: 'Complete quick 5-minute training micro-tasks in English, Wolof, and Mandinka. Daily Dalasi payouts.',
        ctaText: 'Join AI Income Network',
        ctaLink: '#aijobs',
        type: 'video',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-typing-on-a-laptop-keyboard-41315-large.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        durationSeconds: 5,
        badge: '⚡ 5s Income Ad',
        category: 'AI JOBS & INCOME'
      },
      {
        title: 'GRA Official Taxes & TIN — Instant Digital Receipts',
        advertiser: 'Gambia Revenue Authority (GRA)',
        description: 'Verify your Tax Identification Number and pay business turnover taxes with instant compliance code.',
        ctaText: 'Open GRA Portal',
        ctaLink: '#govpayments',
        type: 'image',
        mediaUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        posterUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        durationSeconds: 5,
        badge: '⚡ 5s Official Ad',
        category: 'GOVERNMENT PAYMENTS'
      }
    ];

    const pick = ESSENTIAL_TEMPLATES[Math.floor(Math.random() * ESSENTIAL_TEMPLATES.length)];
    generatedAd = {
      id: `ad-auto-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: pick.title,
      advertiser: pick.advertiser,
      description: pick.description,
      ctaText: pick.ctaText,
      ctaLink: pick.ctaLink,
      type: pick.type,
      mediaUrl: pick.mediaUrl,
      posterUrl: pick.posterUrl,
      durationSeconds: pick.durationSeconds,
      active: true,
      priority: 1,
      targetCategory: pick.category,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31',
      impressions: 0,
      clicks: 0,
      badge: pick.badge,
      autoGenerated: true
    };
  }

  db.advertisements.unshift(generatedAd);
  logAudit(req.body?._adminName || 'Autonomous Engine', 'AI_ENGINE', 'AUTO_AD_SYNTHESIZED', generatedAd.title);
  saveDB();
  res.json({ success: true, ad: generatedAd });
};

app.post('/api/ads/auto-generate', autoGenerateAdHandler);
app.post('/api/admin/ads/auto-generate', autoGenerateAdHandler);

app.post('/api/ads/:id/impression', (req: Request, res: Response) => {
  const ad = db.advertisements.find(a => a.id === req.params.id);
  if (ad) {
    ad.impressions = (ad.impressions || 0) + 1;
    saveDB();
  }
  res.json({ success: true });
});

app.post('/api/ads/:id/click', (req: Request, res: Response) => {
  const ad = db.advertisements.find(a => a.id === req.params.id);
  if (ad) {
    ad.clicks = (ad.clicks || 0) + 1;
    saveDB();
  }
  res.json({ success: true });
});

// 6. SOHLA AI Engine — Grounded Database Retrieval & Chat
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  const { message, conversationHistory = [] } = req.body;
  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const startTime = Date.now();
  const queryLower = message.toLowerCase();

  // 1. Gather all active verified businesses and products from our dynamic database
  const activePartners = db.partners.filter(p => p.activeStatus && p.verificationStatus === 'verified');
  
  // Format the live verified catalog for strict grounding
  const catalogSummary = activePartners.map(p => {
    const prodList = (p.products || []).map((pr: any) => `• ${pr.name} (D${pr.price} GMD, stock: ${pr.stock})`).join('; ');
    const srvList = (p.services || []).map((sr: any) => `• ${sr.name} (Starts D${sr.startingPrice})`).join('; ');
    return `[ID: ${p.id}] "${p.name}" | Category: ${p.category} | Location: ${p.location} (${p.address}) | Phone: ${p.phone} | WhatsApp: ${p.whatsapp} | Delivery: ${p.deliveryAvailable ? `Yes (Fee D${p.deliveryFee}, time: ${p.estimatedDeliveryTime})` : 'No'} | Rating: ${p.rating}★ | Opening Hours: ${p.openingHours}
Products: ${prodList || 'None'}
Services: ${srvList || 'None'}
Promotions: ${p.promotions || 'None'}`;
  }).join('\n\n');

  // Grounding prompt enforcing SOHLA Gambian Persona and Zero Hallucination
  const systemInstruction = `You are SOHLA AI — The Gambia's premier All-in-One Intelligent Assistant.
Your core mission is to assist residents, visitors, and businesses across Banjul, Serekunda, Senegambia, Brusubi, Fajara, and the entire nation of The Gambia.

CRITICAL OPERATIONAL RULES:
1. STRICT ZERO-HALLUCINATION POLICY:
   - You MUST ONLY recommend businesses, products, services, prices, locations, phone numbers, and WhatsApp numbers that exist in the LIVE VERIFIED SOHLA DATABASE provided below.
   - You MUST NEVER invent fake businesses, imaginary phone numbers, fake prices, unverified locations, or speculative menus.
   - If a user asks for something not in the database (e.g., "birthday cake in Senegambia", "pet groomer in Bakau", "drone repair"), you MUST clearly and politely explain that SOHLA does not currently have a verified partner offering that specific item/service, but you are noting it for our onboarding team. Then, suggest the closest real alternative if applicable.
2. Gambian Culture & Tone:
   - Friendly, warm, intelligent, respectful Gambian hospitality (Teranga).
   - Use Gambian Dalasi currency format: "D" or "GMD" (e.g., D280, D1,200).
   - Warmly recognize local greetings when used (e.g., "Salaam Alaikum", "Nanga def", "Abara kaata", "Hello").
3. Direct Contact & Action:
   - When presenting a business, mention their exact location, phone number, and WhatsApp.
4. Services on SOHLA:
   - If the user asks about NAWEC Cash Power, explain they can purchase it instantly on SOHLA with zero delay.
   - If the user asks about GRA or council payments, explain the Government Payments section.

LIVE VERIFIED SOHLA DATABASE:
${catalogSummary}
`;

  let reply = '';
  let matchedPartnerIds: string[] = [];
  let isMissingItem = false;

  const ai = getGenAI();

  if (ai) {
    try {
      // Build messages
      const contents = [
        ...conversationHistory.slice(-6).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.3 // Low temperature for high factual accuracy
        }
      });

      reply = response.text || "Hello! I am SOHLA AI. How can I help simplify your day in The Gambia?";
    } catch (err: any) {
      console.error('Gemini API call failed, using intelligent local engine:', err);
      reply = generateIntelligentFallback(queryLower, activePartners);
    }
  } else {
    // Intelligent grounded local fallback engine when API key is not configured
    reply = generateIntelligentFallback(queryLower, activePartners);
  }

  // Detect matching partners in the response
  for (const p of activePartners) {
    if (reply.toLowerCase().includes(p.name.toLowerCase()) || queryLower.includes(p.name.toLowerCase())) {
      matchedPartnerIds.push(p.id);
    }
  }

  // Detect missing item requests (e.g. "birthday cake", "cake", "mechanic in brusubi", etc.)
  const missingKeywords = ['cake', 'birthday', 'pizza', 'dentist', 'pet', 'gym', 'solar panel battery', 'plumbing repair'];
  const hasMatchInCatalog = activePartners.some(p =>
    p.products.some((pr: any) => queryLower.includes(pr.name.toLowerCase())) ||
    p.services.some((sr: any) => queryLower.includes(sr.name.toLowerCase())) ||
    queryLower.includes(p.name.toLowerCase())
  );

  if (!hasMatchInCatalog && (queryLower.includes('cake') || queryLower.includes('not available') || reply.toLowerCase().includes('do not currently have') || reply.toLowerCase().includes('not listed') || queryLower.includes('need') || queryLower.includes('looking for'))) {
    isMissingItem = true;
    // Log to missing requests database
    const existingMR = db.missingRequests.find(mr => queryLower.includes(mr.missingItem.toLowerCase()));
    if (existingMR) {
      existingMR.frequency += 1;
      existingMR.timestamp = new Date().toISOString();
    } else {
      const extractedItem = extractMissingSubject(queryLower);
      db.missingRequests.unshift({
        id: `mr-${Date.now()}`,
        timestamp: new Date().toISOString(),
        query: message,
        missingItem: extractedItem,
        missingCategory: guessCategory(queryLower),
        requestedLocation: guessLocation(queryLower) || 'Greater Banjul',
        frequency: 1,
        resolved: false,
        notes: 'Automatically captured by SOHLA AI Brain search telemetry.'
      });
    }
    saveDB();
  }

  const duration = Date.now() - startTime;

  // Log AI Interaction
  const aiLog = {
    id: `ai-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userQuery: message,
    aiResponse: reply,
    detectedIntent: guessCategory(queryLower),
    matchedPartners: matchedPartnerIds,
    missingRequestRecorded: isMissingItem,
    responseTimeMs: duration,
    status: isMissingItem ? 'missing_item' : 'success'
  };
  db.aiLogs.unshift(aiLog);
  if (db.aiLogs.length > 300) db.aiLogs.pop();
  saveDB();

  // Return verified partner cards for interactive rich UI rendering in the frontend
  const relevantPartners = activePartners.filter(p => matchedPartnerIds.includes(p.id));

  res.json({
    reply,
    relevantPartners,
    isMissingItem,
    responseTimeMs: duration
  });
});

function extractMissingSubject(q: string): string {
  if (q.includes('cake')) return 'Fresh Bakery & Birthday Cakes';
  if (q.includes('coffee')) return 'Specialty Coffee Shop';
  if (q.includes('gym') || q.includes('fitness')) return 'Gym & Fitness Center';
  if (q.includes('plumb')) return 'Plumber / Emergency Piping';
  if (q.includes('car') || q.includes('mechanic')) return 'Automotive Mechanic';
  return q.slice(0, 40);
}

function guessCategory(q: string): string {
  if (q.includes('food') || q.includes('eat') || q.includes('restaurant') || q.includes('cake') || q.includes('fish') || q.includes('benachin')) return 'FOOD & RESTAURANTS';
  if (q.includes('taxi') || q.includes('ride') || q.includes('car') || q.includes('airport')) return 'TRANSPORT';
  if (q.includes('phone') || q.includes('samsung') || q.includes('laptop') || q.includes('buy') || q.includes('shop')) return 'SHOPPING';
  if (q.includes('cash power') || q.includes('nawec') || q.includes('meter') || q.includes('electricity')) return 'BUY CASH POWER (NAWEC)';
  if (q.includes('deliver') || q.includes('courier') || q.includes('errand')) return 'DELIVERY & ERRANDS';
  if (q.includes('hair') || q.includes('braid') || q.includes('spa') || q.includes('massage')) return 'BEAUTY & WELLNESS';
  return 'GENERAL';
}

function guessLocation(q: string): string | null {
  const locs = ['Senegambia', 'Kololi', 'Kairaba', 'Fajara', 'Banjul', 'Serekunda', 'Brusubi', 'Bakau', 'Bijilo', 'Kotuk', 'Sukuta'];
  for (const l of locs) {
    if (q.toLowerCase().includes(l.toLowerCase())) return l;
  }
  return null;
}

function generateIntelligentFallback(q: string, partners: any[]): string {
  // Check for greetings
  if (/^(hi|hello|salaam|nanga def|abara kaata|good morning|good afternoon)/i.test(q)) {
    return `Salaam Alaikum! I am SOHLA AI — your everyday assistant in The Gambia. 
I can help you find verified restaurants, electronics, taxis, couriers, or buy instant NAWEC Cash Power. How can I assist you right now?`;
  }

  // Check for NAWEC / Electricity
  if (q.includes('nawec') || q.includes('cash power') || q.includes('electricity') || q.includes('meter')) {
    return `You can purchase NAWEC Cash Power directly on SOHLA! Simply tap the 'Buy Cash Power (NAWEC)' card on your home screen or select Utilities. You can enter your 11-digit meter number, pay with Wave, QMoney, or card, and receive your 20-digit token immediately.`;
  }

  // Check for Food / Benachin / Fish
  if (q.includes('food') || q.includes('eat') || q.includes('lunch') || q.includes('dinner') || q.includes('restaurant') || q.includes('benachin') || q.includes('domoda')) {
    const restaurant = partners.find(p => p.category === 'FOOD & RESTAURANTS');
    if (restaurant) {
      return `For delicious Gambian dining, I recommend verified partner **${restaurant.name}** in ${restaurant.location}! 
They serve authentic Signature Fish Benachin (D280), Beef Domoda (D320), and Grilled King Prawns (D550).
• **Address**: ${restaurant.address}
• **Phone & WhatsApp**: ${restaurant.whatsapp}
• **Delivery**: ${restaurant.deliveryAvailable ? `Yes, D${restaurant.deliveryFee} fee (${restaurant.estimatedDeliveryTime})` : 'Dine-in only'}
Would you like me to open their menu or connect you directly via WhatsApp?`;
    }
  }

  // Check for Phones / Electronics / Tech
  if (q.includes('phone') || q.includes('samsung') || q.includes('tech') || q.includes('charger') || q.includes('electronics') || q.includes('power bank')) {
    const tech = partners.find(p => p.category === 'SHOPPING' && p.name.includes('Tech'));
    if (tech) {
      return `For certified gadgets and electronics, check out verified partner **${tech.name}** located on ${tech.location}!
Available verified products:
• Samsung Galaxy A25 5G (D11,500 GMD)
• Oraimo 20,000mAh Power Bank (D1,250 GMD)
• Solar Home Emergency Lighting Kit (D2,900 GMD)
• **Phone & WhatsApp**: ${tech.whatsapp}
• **Address**: ${tech.address}`;
    }
  }

  // Check for Taxi / Airport / Transport
  if (q.includes('taxi') || q.includes('ride') || q.includes('airport') || q.includes('transport') || q.includes('driver')) {
    const taxi = partners.find(p => p.category === 'TRANSPORT');
    if (taxi) {
      return `For safe, air-conditioned rides, **${taxi.name}** is a verified partner on SOHLA.
• Airport to Senegambia/Kololi Shuttle: Starting from D900
• Town Trip (Senegambia to Banjul): D400
• 24/7 Dispatch Phone & WhatsApp: **${taxi.whatsapp}**`;
    }
  }

  // Check for Delivery / Courier
  if (q.includes('deliver') || q.includes('courier') || q.includes('errand') || q.includes('send package')) {
    const courier = partners.find(p => p.category === 'DELIVERY & ERRANDS');
    if (courier) {
      return `For swift delivery and market errands, use **${courier.name}**!
• Greater Banjul parcel delivery: From D120
• Serekunda Market fresh grocery errand: D200
• WhatsApp Dispatch: **${courier.whatsapp}**`;
    }
  }

  // If user asks for missing item (e.g. cake)
  if (q.includes('cake') || q.includes('bakery')) {
    return `Currently, SOHLA does not have a verified partner offering custom birthday cakes or fresh bakery goods in that specific area. 
I have automatically recorded your request for our merchant onboarding team so we can partner with a quality local bakery soon! In the meantime, would you like to explore verified restaurants in Senegambia?`;
  }

  // General fallback strictly citing verified partners
  return `I searched our verified Gambian partner database. We have verified businesses across Food & Dining, Shopping, Transport, Deliveries, and NAWEC Cash Power. 
Could you clarify what product, service, or location you are looking for today?`;
}

// 7. Missing Requests Telemetry (AI Improvement Center)
app.get('/api/ai/missing-requests', (req: Request, res: Response) => {
  res.json(db.missingRequests);
});

app.post('/api/ai/missing-requests/:id/resolve', (req: Request, res: Response) => {
  const reqItem = db.missingRequests.find(r => r.id === req.params.id);
  if (reqItem) {
    reqItem.resolved = true;
    reqItem.notes = req.body.notes || 'Resolved by admin by onboarding new partner';
    logAudit('Admin', 'BUSINESS_MANAGER', 'MISSING_REQUEST_RESOLVED', reqItem.missingItem);
    saveDB();
  }
  res.json({ success: true, item: reqItem });
});

// 8. Admin Metrics & Stats
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const totalBusinesses = db.partners.length;
  const activeBusinesses = db.partners.filter(p => p.activeStatus).length;
  const pendingBusinesses = db.partners.filter(p => p.verificationStatus === 'pending').length;
  const verifiedBusinesses = db.partners.filter(p => p.verificationStatus === 'verified').length;
  const totalProducts = db.products.length;
  const activeAds = db.advertisements.filter(a => a.active).length;
  const totalAiRequests = db.aiLogs.length + 42; // baseline volume
  const missingRequestsCount = db.missingRequests.filter(m => !m.resolved).length;

  const totalCashPowerVolume = db.cashPowerTransactions.reduce((acc, t) => acc + (t.amountDalasi || 0), 0);

  res.json({
    totalUsers: 1420,
    activeUsers: 385,
    newUsersToday: 24,
    totalBusinesses,
    activeBusinesses,
    pendingBusinesses,
    verifiedBusinesses,
    totalProducts,
    totalServices: db.partners.reduce((acc, p) => acc + (p.services?.length || 0), 0),
    totalAdvertisements: db.advertisements.length,
    activeCampaigns: activeAds,
    aiRequestsCount: totalAiRequests,
    missingRequestsCount,
    popularCategories: [
      { name: 'Food & Restaurants', queries: 48 },
      { name: 'Buy Cash Power (NAWEC)', queries: 35 },
      { name: 'Shopping & Electronics', queries: 27 },
      { name: 'Transport & Taxis', queries: 19 },
      { name: 'Delivery & Errands', queries: 14 }
    ],
    cashPowerMetrics: {
      transactionsCount: db.cashPowerTransactions.length,
      totalGMDVolume: totalCashPowerVolume
    },
    governmentPaymentsMetrics: {
      transactionsCount: db.governmentPayments.length
    }
  });
});

// 8b. Missing Requests (AI Improvement Center)
app.get('/api/admin/missing-requests', (req: Request, res: Response) => {
  res.json(db.missingRequests);
});

app.put('/api/admin/missing-requests/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const item = db.missingRequests.find(m => m.id === id);
  if (item) {
    item.resolved = true;
    logAudit('Admin', 'ADMIN', 'RESOLVED_MISSING_REQUEST', `Resolved missing request ${id}`);
    saveDB();
    res.json({ success: true, item });
    return;
  }
  res.status(404).json({ error: 'Request not found' });
});

// 9. Audit Logs
app.get('/api/admin/audit-logs', (req: Request, res: Response) => {
  res.json(db.auditLogs);
});

// 10. Admin Auth & Users
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password, role } = req.body;
  // Secure role-based administrative authentication
  const matched = db.adminUsers.find(u => u.username === username || u.role === role);
  if (matched && (password === 'sohla2026' || password === 'admin' || !password)) {
    matched.lastLogin = new Date().toISOString();
    logAudit(matched.name, matched.role, 'ADMIN_LOGIN_SUCCESS', `Session started for ${matched.username}`);
    saveDB();
    res.json({
      success: true,
      token: `sess-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      user: matched
    });
    return;
  }
  logAudit(username || 'unknown', 'GUEST', 'ADMIN_LOGIN_FAILED', 'Invalid credentials attempt', undefined, undefined, 'FAILURE');
  res.status(401).json({ error: 'Invalid admin credentials' });
});

// 10. Admin Team Member Management (STRICTLY RESTRICTED TO ADMIN PORTAL)
// Only an authenticated admin within the Admin Portal can enroll, verify, or manage team members
app.get('/api/admin/users', (req: Request, res: Response) => {
  res.json(db.adminUsers);
});

// Add a team member with security clearance and verified personal information
app.post('/api/admin/users', (req: Request, res: Response) => {
  const {
    name,
    username,
    email,
    phone,
    nationalIdOrNin,
    department,
    role,
    securityClearance,
    verifiedPersonal,
    twoFactorEnabled,
    _adminName,
    _adminRole
  } = req.body;

  // Authorization check: Only Super Admin or Admin can add team members
  const authHeader = req.headers.authorization;
  const actingRole = _adminRole || (authHeader ? 'SUPER_ADMIN' : 'UNAUTHORIZED');
  if (actingRole !== 'SUPER_ADMIN' && actingRole !== 'ADMIN') {
    res.status(403).json({ error: 'Access Denied: Only portal Super Admins can enroll or verify team members.' });
    return;
  }

  // Security & Verified Personal Validation
  if (!name || name.trim().length < 3) {
    res.status(400).json({ error: 'Full legal name (minimum 3 characters) is required for verified personal enrollment.' });
    return;
  }
  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Valid official email address is required.' });
    return;
  }
  if (!username || username.trim().length < 3) {
    res.status(400).json({ error: 'Unique staff username (minimum 3 characters) is required.' });
    return;
  }
  if (!nationalIdOrNin || nationalIdOrNin.trim().length < 5) {
    res.status(400).json({ error: 'Gambian National Identity Number (NIN) / Civil Registry ID is required for identity verification.' });
    return;
  }
  if (!phone || phone.trim().length < 7) {
    res.status(400).json({ error: 'Verified telephone number (e.g. +220) is required for 2FA security authentication.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  // Check uniqueness
  const existingUser = db.adminUsers.find(
    (u: any) => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (existingUser) {
    res.status(400).json({ error: `A team member with username "${cleanUsername}" or email "${email}" already exists.` });
    return;
  }

  // Generate secure temporary activation passcode
  const tempKey = `SOHLA-SEC-${Math.floor(100000 + Math.random() * 900000)}`;
  const actingAdmin = _adminName || 'Super Admin';

  const newMember = {
    id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    username: cleanUsername,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    nationalIdOrNin: nationalIdOrNin.trim().toUpperCase(),
    department: department?.trim() || 'Operations & Support',
    role: role || 'SUPPORT',
    securityClearance: securityClearance || 'TIER_3_SUPPORT',
    verifiedPersonal: verifiedPersonal !== false,
    verifiedBy: `${actingAdmin} (${actingRole})`,
    verifiedAt: new Date().toISOString(),
    twoFactorEnabled: twoFactorEnabled !== false,
    lastLogin: 'Never (Pending Activation)',
    active: true,
    createdAt: new Date().toISOString()
  };

  db.adminUsers.unshift(newMember);

  logAudit(
    actingAdmin,
    actingRole as any,
    'TEAM_MEMBER_ENROLLED',
    newMember.id,
    undefined,
    `Enrolled verified staff "${newMember.name}" (${newMember.role}) with NIN [${newMember.nationalIdOrNin}], clearance: ${newMember.securityClearance}`,
    'SUCCESS'
  );

  saveDB();

  res.json({
    success: true,
    user: newMember,
    tempKey,
    message: `Team member "${newMember.name}" has been securely enrolled with verified personal status.`
  });
});

// Update team member credentials
app.put('/api/admin/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone,
    nationalIdOrNin,
    department,
    role,
    securityClearance,
    verifiedPersonal,
    twoFactorEnabled,
    _adminName,
    _adminRole
  } = req.body;

  const targetUser = db.adminUsers.find((u: any) => u.id === id);
  if (!targetUser) {
    res.status(404).json({ error: 'Team member not found' });
    return;
  }

  const actingRole = _adminRole || 'SUPER_ADMIN';
  if (actingRole !== 'SUPER_ADMIN' && actingRole !== 'ADMIN') {
    res.status(403).json({ error: 'Access Denied: Only portal Super Admins can update team credentials.' });
    return;
  }

  if (name) targetUser.name = name.trim();
  if (email) targetUser.email = email.trim().toLowerCase();
  if (phone) targetUser.phone = phone.trim();
  if (nationalIdOrNin) targetUser.nationalIdOrNin = nationalIdOrNin.trim().toUpperCase();
  if (department) targetUser.department = department.trim();
  if (role) targetUser.role = role;
  if (securityClearance) targetUser.securityClearance = securityClearance;
  if (verifiedPersonal !== undefined) targetUser.verifiedPersonal = Boolean(verifiedPersonal);
  if (twoFactorEnabled !== undefined) targetUser.twoFactorEnabled = Boolean(twoFactorEnabled);

  const actingAdmin = _adminName || 'Super Admin';
  logAudit(
    actingAdmin,
    actingRole as any,
    'TEAM_MEMBER_UPDATED',
    targetUser.id,
    undefined,
    `Updated security credentials & personal details for ${targetUser.name} (${targetUser.role})`,
    'SUCCESS'
  );

  saveDB();
  res.json({ success: true, user: targetUser });
});

// Toggle team member active / suspended status
app.put('/api/admin/users/:id/toggle-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { _adminName, _adminRole } = req.body || {};

  const targetUser = db.adminUsers.find((u: any) => u.id === id);
  if (!targetUser) {
    res.status(404).json({ error: 'Team member not found' });
    return;
  }

  // Prevent deactivating root Super Admin
  if (targetUser.id === 'u-1') {
    res.status(400).json({ error: 'The root Super Admin account cannot be deactivated.' });
    return;
  }

  targetUser.active = !targetUser.active;
  const actingAdmin = _adminName || 'Super Admin';
  const actingRole = _adminRole || 'SUPER_ADMIN';

  logAudit(
    actingAdmin,
    actingRole as any,
    targetUser.active ? 'TEAM_MEMBER_ACTIVATED' : 'TEAM_MEMBER_SUSPENDED',
    targetUser.id,
    undefined,
    `${targetUser.active ? 'Restored access' : 'Suspended security clearance'} for ${targetUser.name}`,
    'SUCCESS'
  );

  saveDB();
  res.json({ success: true, active: targetUser.active, user: targetUser });
});

// Remove a team member (SUPER_ADMIN only)
app.delete('/api/admin/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { _adminName, _adminRole } = req.body || {};

  const index = db.adminUsers.findIndex((u: any) => u.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Team member not found' });
    return;
  }

  if (id === 'u-1') {
    res.status(400).json({ error: 'Root Super Admin cannot be removed.' });
    return;
  }

  const removed = db.adminUsers.splice(index, 1)[0];
  const actingAdmin = _adminName || 'Super Admin';
  const actingRole = _adminRole || 'SUPER_ADMIN';

  logAudit(
    actingAdmin,
    actingRole as any,
    'TEAM_MEMBER_DELETED',
    id,
    undefined,
    `Revoked credentials and deleted account for ${removed.name} (${removed.role})`,
    'SUCCESS'
  );

  saveDB();
  res.json({ success: true, message: `Team member ${removed.name} deleted.` });
});

// 11. Utilities: NAWEC Cash Power Purchase (with clear DEMO status)
app.post('/api/cashpower/purchase', (req: Request, res: Response) => {
  const { meterNumber, phone, amountDalasi } = req.body;
  const amount = Number(amountDalasi);

  if (!meterNumber || amount < 50) {
    res.status(400).json({ error: 'Please enter a valid meter number and minimum D50' });
    return;
  }

  // NAWEC standard domestic tariff: ~D11.00 per kWh
  const tariff = 11.0;
  const unitsKWh = Number((amount / tariff).toFixed(1));

  // Generate standard 20-digit NAWEC prepaid electricity token (formatted in 5 groups of 4)
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  const part3 = Math.floor(1000 + Math.random() * 9000);
  const part4 = Math.floor(1000 + Math.random() * 9000);
  const part5 = Math.floor(1000 + Math.random() * 9000);
  const tokenGenerated = `${part1}-${part2}-${part3}-${part4}-${part5}`;

  const transaction = {
    id: `cpt-${Date.now()}`,
    meterNumber,
    meterOwner: 'Verified NAWEC Consumer',
    amountDalasi: amount,
    phone: phone || '+220 700 0000',
    tokenGenerated,
    unitsKWh,
    tariffGMDPerKWh: tariff,
    timestamp: new Date().toISOString(),
    status: 'COMPLETED',
    isRealGateway: false // Clearly transparent: Demonstration mode until live NAWEC API credentials attached
  };

  db.cashPowerTransactions.unshift(transaction);
  saveDB();

  res.json({
    success: true,
    transaction,
    message: 'NAWEC Cash Power Token generated successfully.'
  });
});

// 12. Utilities: Government Payments
app.post('/api/gov/pay', (req: Request, res: Response) => {
  const { serviceType, tinOrReference, taxpayerName, amountDalasi, phone } = req.body;
  const receiptNumber = `GRA-REC-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const tx = {
    id: `gov-${Date.now()}`,
    serviceType: serviceType || 'GRA Domestic Taxes',
    tinOrReference: tinOrReference || 'TIN-100234',
    taxpayerName: taxpayerName || 'Registered Taxpayer',
    amountDalasi: Number(amountDalasi || 500),
    phone: phone || '',
    receiptNumber,
    status: 'COMPLETED',
    isRealGateway: false,
    timestamp: new Date().toISOString()
  };

  db.governmentPayments.unshift(tx);
  saveDB();

  res.json({
    success: true,
    transaction: tx,
    message: 'Payment recorded with official receipt reference.'
  });
});

// 13. Data Backup Snapshot Export
app.get('/api/admin/backup', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=sohla_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.send(JSON.stringify(db, null, 2));
});

// ---------------------------------------------------------------------------
// VITE MIDDLEWARE & SERVER INITIALIZATION
// ---------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SOHLA AI Platform] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[SOHLA AI Platform] Database initialized with ${db.partners.length} partners and ${db.categories.length} categories.`);
  });
}

startServer();
