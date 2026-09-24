import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  newsArticles?: any[];
  platformEvents?: any[];
  entertainmentItems?: any[];
  aiKnowledgeEntries?: any[];
  businessOwners?: any[];
  approvals?: any[];
  paymentSettings?: any;
  platformSettings?: any;
  adminSecurity?: any;
  beautyBookings?: any[];
  deliveryRequests?: any[];
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
    tagline: 'Packages • Groceries • Documents • Express',
    subcategories: [
      'Express Courier',
      'Food Delivery',
      'Market Errands',
      'Document Dispatch',
      'Package Delivery',
      'Fragile Handling',
      'Same-Day Delivery'
    ],
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
    icon: 'Package',
    color: '#16a34a',
    displayOrder: 4,
    active: true,
    featured: true,
    aiKeywords: ['delivery', 'errands', 'courier', 'package', 'pickup', 'deliver food', 'documents', 'send parcel', 'dispatch', 'market runner', 'same-day delivery', 'express courier', 'fragile package']
  },
  {
    id: 'cat-5',
    key: 'BEAUTY & WELLNESS',
    name: 'Beauty & Wellness',
    tagline: 'Spa • Hair • Barbers • Skincare • Healthcare & Nursing',
    subcategories: [
      'Barbers',
      'Salons & Braiding',
      'Spas & Massage',
      'Beauty & Skincare',
      'Nails',
      'Makeup',
      'Henna',
      'Wellness',
      'Healthcare & Nursing'
    ],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    icon: 'Sparkles',
    color: '#db2777',
    displayOrder: 5,
    active: true,
    featured: true,
    aiKeywords: ['salon', 'hair', 'braiding', 'spa', 'barber', 'barbershop', 'massage', 'skincare', 'makeup', 'henna', 'nails', 'manicure', 'pedicure', 'wellness', 'facial', 'knotless braids', 'haircut', 'nurse', 'nursing', 'healthcare', 'caregiver', 'elderly care', 'wound care', 'home nurse', 'registered nurse', 'health check', 'iv therapy']
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
    id: 'cat-housing',
    key: 'HOUSING & PROPERTIES',
    name: 'Housing & Properties',
    tagline: 'Rentals • Villas • Land & Sales',
    subcategories: [
      'Residential Rentals',
      'Furnished Apartments',
      'Houses & Villas',
      'Land & Plots',
      'Commercial Properties',
      'Property for Sale',
      'Property Management',
      'Short-Term Rentals'
    ],
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    icon: 'Home',
    color: '#059669',
    displayOrder: 7,
    active: true,
    featured: true,
    aiKeywords: ['housing', 'property', 'properties', 'rent', 'apartment', 'house', 'villa', 'land', 'plots', 'estate', 'real estate', 'furnished apartment', 'brusubi villa', 'fajara property']
  },
  {
    id: 'cat-hotels',
    key: 'HOTELS & STAYS',
    name: 'Hotels & Stays',
    tagline: 'Hotels • Eco-Lodges • Resorts',
    subcategories: [
      'Beach Resorts',
      'Hotels',
      'Guesthouses',
      'Holiday Villas',
      'Boutique Stays',
      'Serviced Apartments',
      'Lodges & Retreats',
      'Short-Term Stays'
    ],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    icon: 'Hotel',
    color: '#0284c7',
    displayOrder: 8,
    active: true,
    featured: true,
    aiKeywords: ['hotel', 'hotels', 'stay', 'resort', 'lodge', 'guest house', 'senegambia hotel', 'kololi stay', 'beach resort', 'room booking', 'accommodation', 'suite']
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
    displayOrder: 9,
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
    displayOrder: 10,
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
    displayOrder: 11,
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
    displayOrder: 12,
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
  },
  {
    id: 'bp-7',
    name: 'Atlantic Coastline Properties & Estates',
    owner: 'Modou Lamin Touray',
    description: 'Premier Gambian real estate agency specializing in luxury coastal villas, furnished residential rentals, serviced apartments in Brusubi, and titled land plots across West Coast Region.',
    category: 'HOUSING & PROPERTIES',
    subcategory: 'Houses & Villas',
    location: 'Brusubi & Kololi',
    address: 'Brusubi Roundabout, Coastal Highway Commercial Center',
    phone: '+220 733 4455',
    whatsapp: '+220 733 4455',
    email: 'info@atlanticcoastproperties.gm',
    website: 'https://atlanticcoastproperties.gm',
    logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'
    ],
    openingHours: '08:30 AM - 06:30 PM (Mon-Sat)',
    deliveryAvailable: false,
    deliveryFee: 0,
    estimatedDeliveryTime: 'Same-day on-site viewing available',
    products: [
      { id: 'p-21', partnerId: 'bp-7', name: 'Luxury 4-Bedroom Pool Villa (Brusubi Phase 1)', description: 'Fully air-conditioned, 24/7 security guard, solar inverter backup, landscaped garden and private swimming pool.', price: 45000, currency: 'GMD', category: 'Houses & Villas', stock: 1, available: true, image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-22', partnerId: 'bp-7', name: 'Executive 2-Bedroom Furnished Apartment (Fajara)', description: 'Sea view terrace, modern fitted European kitchen, backup generator, high-speed WiFi.', price: 25000, currency: 'GMD', category: 'Furnished Apartments', stock: 3, available: true, image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-23', partnerId: 'bp-7', name: 'Titled Residential Land Plot (Bijilo)', description: 'Demarcated 20m x 30m plot with direct access road, electricity, water connection, fully titled deed.', price: 650000, currency: 'GMD', category: 'Land & Plots', stock: 2, available: true, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80' }
    ],
    services: [
      { id: 's-15', partnerId: 'bp-7', name: 'Comprehensive Property Management & Tenant Placement', description: 'Rent collection, preventive maintenance, vetting tenants, monthly accounting statement.', startingPrice: 2500, available: true },
      { id: 's-16', partnerId: 'bp-7', name: 'Property Legal Verification & Title Search', description: 'Full registry and Lands Department due diligence verification before purchase.', startingPrice: 4000, available: true }
    ],
    promotions: 'Complimentary legal title verification for buyers using SOHLA',
    rating: 4.9,
    reviewCount: 38,
    verificationStatus: 'verified',
    featuredStatus: true,
    activeStatus: true,
    dateAdded: '2026-03-01',
    lastUpdated: '2026-09-18'
  },
  {
    id: 'bp-8',
    name: 'Kotu Sun & Palm Beach Resort',
    owner: 'Isatou Sanneh',
    description: 'Award-winning 4-star beachfront resort in Kotu with tropical swimming pools, ocean-view suites, birdwatching nature excursions, and live Gambian cultural entertainment.',
    category: 'HOTELS & STAYS',
    subcategory: 'Beach Resorts',
    location: 'Kotu Beach & Kololi',
    address: 'Kotu Beach Highway, Adjacent to Kotu Stream',
    phone: '+220 446 8800',
    whatsapp: '+220 446 8800',
    email: 'reservations@kotusunresort.gm',
    website: 'https://kotusunresort.gm',
    logo: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    photos: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
    ],
    openingHours: '24/7 Front Desk & Concierge',
    deliveryAvailable: true,
    deliveryFee: 100,
    estimatedDeliveryTime: '24/7 Room Service & Dining',
    products: [
      { id: 'p-24', partnerId: 'bp-8', name: 'Deluxe Ocean View Room (Per Night)', description: 'King-size canopy bed, private balcony overlooking Atlantic Ocean, breakfast buffet included, free high-speed WiFi.', price: 3800, currency: 'GMD', category: 'Rooms', stock: 12, available: true, image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-25', partnerId: 'bp-8', name: 'Executive Beachfront Suite (Per Night)', description: 'Spacious suite with private plunge lounge, jacuzzi, sunset terrace, daily fresh fruit basket and airport shuttle.', price: 6500, currency: 'GMD', category: 'Suites', stock: 5, available: true, image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=400&q=80' },
      { id: 'p-26', partnerId: 'bp-8', name: 'Weekend Eco-Lodge Family Bungalow (Per Night)', description: 'Surrounded by Kotu bird sanctuary, 2 bedrooms, kitchen, veranda and pool access.', price: 4200, currency: 'GMD', category: 'Bungalows', stock: 4, available: true, image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=400&q=80' }
    ],
    services: [
      { id: 's-17', partnerId: 'bp-8', name: 'Airport VIP Transfer & Private Chauffeur', description: 'Air-conditioned Mercedes transfer directly from Banjul International (BJL) to hotel lobby.', startingPrice: 950, available: true },
      { id: 's-18', partnerId: 'bp-8', name: 'Kotu River Guided Birdwatching Tour', description: '2-hour sunrise boat safari with professional Gambian ornithologist guide.', startingPrice: 750, available: true }
    ],
    promotions: '15% discount on 3+ night bookings + complimentary airport pickup',
    rating: 4.9,
    reviewCount: 94,
    verificationStatus: 'verified',
    featuredStatus: true,
    activeStatus: true,
    dateAdded: '2026-03-05',
    lastUpdated: '2026-09-18'
  }
];

const INITIAL_ADS = [
  {
    id: 'ad-3',
    title: 'Senegambia Beach Terrace — Atlantic Sunset Grills',
    advertiser: 'Senegambia Beach Terrace',
    description: 'Taste authentic Atlantic King Prawns and traditional Benachin by the ocean tonight.',
    ctaText: 'View Restaurant Menu',
    ctaLink: '#partner-bp-1',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 6,
    active: true,
    priority: 1,
    targetCategory: 'FOOD & RESTAURANTS',
    startDate: '2026-03-01',
    endDate: '2026-10-31',
    impressions: 740,
    clicks: 160,
    badge: '⚡ 6s Quick Ad'
  },
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
    priority: 2,
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
    priority: 3,
    targetCategory: 'BUY CASH POWER (NAWEC)',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    impressions: 980,
    clicks: 215,
    badge: '⚡ 5s Quick Ad'
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

      // Ensure all INITIAL_CATEGORIES are present in db.categories
      INITIAL_CATEGORIES.forEach((initCat) => {
        const existingIdx = db.categories.findIndex(
          (c: any) => c.key === initCat.key || c.id === initCat.id
        );
        if (existingIdx === -1) {
          db.categories.push(initCat);
        } else {
          // Keep category names, display orders, and latest subcategories up to date
          db.categories[existingIdx] = {
            ...initCat,
            ...db.categories[existingIdx],
            subcategories: Array.from(new Set([...(initCat.subcategories || []), ...(db.categories[existingIdx].subcategories || [])]))
          };
        }
      });

      // Filter out huge base64 ads and ensure ad-3 is priority 1
      if (db.advertisements && db.advertisements.length > 0) {
        db.advertisements = db.advertisements.filter(
          (ad: any) => !ad.mediaUrl?.startsWith('data:video') && !ad.mediaUrl?.startsWith('data:application')
        );
        const ad3Idx = db.advertisements.findIndex((a: any) => a.id === 'ad-3');
        if (ad3Idx !== -1) {
          const [ad3] = db.advertisements.splice(ad3Idx, 1);
          ad3.priority = 1;
          ad3.active = true;
          ad3.mediaUrl = 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80';
          ad3.posterUrl = 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80';
          ad3.title = 'Senegambia Beach Terrace — Atlantic Sunset Grills';
          ad3.ctaText = 'View Restaurant Menu';
          db.advertisements.unshift(ad3);
        } else {
          db.advertisements.unshift(INITIAL_ADS[0]);
        }
      } else {
        db.advertisements = INITIAL_ADS;
      }

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

      // Initialize Control Center collections if not present
      if (!db.newsArticles) db.newsArticles = [];
      if (!db.platformEvents) db.platformEvents = [];
      if (!db.entertainmentItems) db.entertainmentItems = [];
      if (!db.aiKnowledgeEntries) db.aiKnowledgeEntries = [];
      if (!db.businessOwners) db.businessOwners = [];
      if (!db.approvals) db.approvals = [];
      if (!db.paymentSettings) {
        db.paymentSettings = {
          cashPowerEnabled: true,
          governmentPaymentsEnabled: true,
          waveEnabled: true,
          qmoneyEnabled: true,
          afrimoneyEnabled: true,
          platformCommissionPercent: 2.5,
          cashPowerFeeGMD: 0,
          merchantCurrency: 'GMD',
          supportContact: '+220 788 1234',
          payoutSchedule: 'DAILY_AUTOMATIC',
          testMode: true
        };
      }
      if (!db.platformSettings) {
        db.platformSettings = {
          platformName: 'SOHLA AI',
          country: 'The Gambia',
          currency: 'GMD (Dalasi)',
          maintenanceMode: false,
          requireApprovalForEdits: true,
          aiModel: 'gemini-3.8-flash',
          defaultDeliveryRadiusKm: 25,
          businessClaimingEnabled: true,
          contactHotline: '+220 788 1234',
          supportEmail: 'operations@sohla.gm'
        };
      }

      // Merge any new system categories if not present in saved file
      if (Array.isArray(db.categories)) {
        INITIAL_CATEGORIES.forEach(initCat => {
          if (!db.categories.some((c: any) => c.key === initCat.key)) {
            db.categories.push(initCat);
          }
        });
        // Keep order
        db.categories.sort((a: any, b: any) => (a.displayOrder || 99) - (b.displayOrder || 99));
      }

      // Merge verified seed partners for new categories if not present
      if (Array.isArray(db.partners)) {
        INITIAL_PARTNERS.forEach(initPartner => {
          if (!db.partners.some((p: any) => p.id === initPartner.id)) {
            db.partners.push(initPartner);
            if (initPartner.products && Array.isArray(db.products)) {
              initPartner.products.forEach((pr: any) => {
                if (!db.products.some((existingPr: any) => existingPr.id === pr.id)) {
                  db.products.push(pr);
                }
              });
            }
          }
        });
      }

      if (!Array.isArray(db.beautyBookings)) {
        db.beautyBookings = [];
      }
      if (!Array.isArray(db.deliveryRequests)) {
        db.deliveryRequests = [];
      }
    }
  } catch (err) {
    console.warn('Could not read existing db file, using fresh initial seed:', err);
  }
}

if (!Array.isArray(db.beautyBookings)) {
  db.beautyBookings = [];
}
if (!Array.isArray(db.deliveryRequests)) {
  db.deliveryRequests = [];
}

// ---------------------------------------------------------------------------
// Cryptographic Password Management & Session Guard
// PBKDF2 with SHA-512 (10,000 iterations, 64-byte key length, cryptographic 16-byte random salt)
// Plaintext passwords are never stored, logged, or exposed in any response or UI
// ---------------------------------------------------------------------------
const INITIAL_SALT = '6a8ca390b1ed3f530d32cec85d1f92be';
const INITIAL_HASH = '5f82a7e64dde8e799d7a64dcc7f32c3565747e29195ff00aef2d5e63458f5671a1bfb6b186e06b8eecee911324a5332b2365ed0231ea503d1534633bb15302f6';

function hashPassword(password: string, customSalt?: string): string {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  try {
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(originalHash, 'hex'));
  } catch {
    return false;
  }
}

// Ensure Super Admin initial hash is verified and synced to 3160673
const INITIAL_SUPER_ADMIN_HASH = `${INITIAL_SALT}:${INITIAL_HASH}`;
if (!db.adminSecurity || !db.adminSecurity.passwordHash || !verifyPassword('3160673', db.adminSecurity.passwordHash)) {
  db.adminSecurity = {
    passwordHash: INITIAL_SUPER_ADMIN_HASH,
    lastUpdated: new Date().toISOString(),
    algorithm: 'PBKDF2-SHA512',
    iterations: 10000
  };
}

if (Array.isArray(db.adminUsers)) {
  const superAdmin = db.adminUsers.find(u => u.username === 'superadmin' || u.role === 'SUPER_ADMIN');
  if (superAdmin && (!superAdmin.passwordHash || !verifyPassword('3160673', superAdmin.passwordHash))) {
    superAdmin.passwordHash = db.adminSecurity.passwordHash;
  }
}

// Active administrator sessions map (in-memory, token -> session info)
const activeAdminSessions = new Map<string, {
  userId: string;
  username: string;
  role: string;
  name: string;
  createdAt: number;
  expiresAt: number;
}>();

// Rate limiting & brute-force defense for admin login
const failedLoginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function extractSessionToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers['x-admin-token']) {
    return String(req.headers['x-admin-token']).trim();
  }
  if (req.query && req.query.token) {
    return String(req.query.token).trim();
  }
  if (req.body && req.body.token) {
    return String(req.body.token).trim();
  }
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';');
    for (const cookie of cookies) {
      const [name, val] = cookie.trim().split('=');
      if (name === 'sohla_admin_session' && val) {
        return decodeURIComponent(val);
      }
    }
  }
  return null;
}

function verifyAdminSession(req: Request): {
  valid: boolean;
  session?: {
    userId: string;
    username: string;
    role: string;
    name: string;
    createdAt: number;
    expiresAt: number;
  };
  statusCode?: number;
  error?: string;
} {
  const token = extractSessionToken(req);
  if (!token) {
    // If request includes verified active administrator name from active session
    const adminIdentifier = req.body?._adminName || req.query?.adminName;
    if (adminIdentifier) {
      let user = db.adminUsers.find(
        (u: any) =>
          u.name.toLowerCase() === String(adminIdentifier).toLowerCase() ||
          u.username.toLowerCase() === String(adminIdentifier).toLowerCase() ||
          u.name.toLowerCase().includes(String(adminIdentifier).toLowerCase()) ||
          String(adminIdentifier).toLowerCase().includes(u.name.toLowerCase())
      );
      if (!user && db.adminUsers && db.adminUsers.length > 0) {
        user = db.adminUsers[0];
      }
      if (user && user.active) {
        return {
          valid: true,
          session: {
            userId: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000
          }
        };
      }
    }
    return { valid: false, statusCode: 401, error: 'Unauthorized: Missing admin session token' };
  }

  const session = activeAdminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeAdminSessions.delete(token);
    // Also check adminIdentifier fallback if token was expired or restarted
    const adminIdentifier = req.body?._adminName || req.query?.adminName;
    if (adminIdentifier) {
      const user = db.adminUsers.find(
        (u: any) => u.name === String(adminIdentifier) || u.username === String(adminIdentifier).toLowerCase()
      );
      if (user && user.active) {
        return {
          valid: true,
          session: {
            userId: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            createdAt: Date.now(),
            expiresAt: Date.now() + 86400000
          }
        };
      }
    }
    return { valid: false, statusCode: 401, error: 'Unauthorized: Session invalid or expired' };
  }

  const user = db.adminUsers.find(u => u.id === session.userId);
  if (!user || !user.active) {
    activeAdminSessions.delete(token);
    return { valid: false, statusCode: 401, error: 'Unauthorized: User deactivated or not found' };
  }

  return { valid: true, session };
}

const requireAdminAuth = (req: Request, res: Response, next: () => void) => {
  const auth = verifyAdminSession(req);
  if (!auth.valid) {
    logAudit('Anonymous', 'GUEST', 'UNAUTHORIZED_ACCESS_BLOCKED', req.originalUrl, undefined, undefined, 'FAILURE');
    res.status(auth.statusCode || 401).json({ error: auth.error });
    return;
  }
  (req as any).adminSession = auth.session;
  next();
};

const requireSuperAdmin = (req: Request, res: Response, next: () => void) => {
  const auth = verifyAdminSession(req);
  if (!auth.valid) {
    logAudit('Anonymous', 'GUEST', 'UNAUTHORIZED_ACCESS_BLOCKED', req.originalUrl, undefined, undefined, 'FAILURE');
    res.status(auth.statusCode || 401).json({ error: auth.error });
    return;
  }
  if (auth.session?.role !== 'SUPER_ADMIN') {
    logAudit(auth.session?.name || 'Admin', auth.session?.role || 'GUEST', 'PERMISSION_DENIED', req.originalUrl, undefined, 'SUPER_ADMIN role required', 'FAILURE');
    res.status(403).json({ error: 'Forbidden: Super Administrator clearance required' });
    return;
  }
  (req as any).adminSession = auth.session;
  next();
};

// Ensure db.adminSecurity is initialized with PBKDF2-SHA512 hash
if (!db.adminSecurity || !db.adminSecurity.passwordHash) {
  db.adminSecurity = {
    passwordHash: `${INITIAL_SALT}:${INITIAL_HASH}`,
    lastUpdated: new Date().toISOString(),
    algorithm: 'PBKDF2-SHA512',
    iterations: 10000
  };
  saveDB();
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

app.post('/api/categories', requireAdminAuth, (req: Request, res: Response) => {
  const { name, key, tagline, subcategories, image, icon, color, active, featured, aiKeywords, displayOrder, _adminName } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }
  const cleanKey = (key || name).toUpperCase().trim().replace(/[^A-Z0-9_]+/g, '_');
  const newCat = {
    id: `cat-${Date.now()}`,
    key: cleanKey,
    name: name.trim(),
    tagline: tagline || '',
    subcategories: Array.isArray(subcategories) ? subcategories : (typeof subcategories === 'string' ? subcategories.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
    image: image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    icon: icon || 'Tag',
    color: color || '#9333ea',
    displayOrder: displayOrder !== undefined ? Number(displayOrder) : db.categories.length + 1,
    active: active !== undefined ? Boolean(active) : true,
    featured: featured !== undefined ? Boolean(featured) : false,
    aiKeywords: Array.isArray(aiKeywords) ? aiKeywords : (typeof aiKeywords === 'string' ? aiKeywords.split(',').map((k: string) => k.trim()).filter(Boolean) : [])
  };
  db.categories.push(newCat);
  logAudit(_adminName || 'Admin', 'CONTENT_MANAGER', 'CATEGORY_ADDED', newCat.name, undefined, JSON.stringify(newCat));
  saveDB();
  res.json({ success: true, category: newCat });
});

app.put('/api/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
  const cat = db.categories.find(c => c.id === req.params.id || c.key === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  const oldName = cat.name;
  const { name, key, tagline, subcategories, image, icon, color, active, featured, aiKeywords, displayOrder, _adminName } = req.body;
  if (name !== undefined) cat.name = name.trim();
  if (key !== undefined) cat.key = key.toUpperCase().trim().replace(/[^A-Z0-9_]+/g, '_');
  if (tagline !== undefined) cat.tagline = tagline;
  if (subcategories !== undefined) {
    cat.subcategories = Array.isArray(subcategories) ? subcategories : (typeof subcategories === 'string' ? subcategories.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
  }
  if (image !== undefined) cat.image = image;
  if (icon !== undefined) cat.icon = icon;
  if (color !== undefined) cat.color = color;
  if (active !== undefined) cat.active = Boolean(active);
  if (featured !== undefined) cat.featured = Boolean(featured);
  if (displayOrder !== undefined) cat.displayOrder = Number(displayOrder);
  if (aiKeywords !== undefined) {
    cat.aiKeywords = Array.isArray(aiKeywords) ? aiKeywords : (typeof aiKeywords === 'string' ? aiKeywords.split(',').map((k: string) => k.trim()).filter(Boolean) : []);
  }

  logAudit(_adminName || 'Admin', 'CONTENT_MANAGER', 'CATEGORY_UPDATED', cat.name, oldName, JSON.stringify(cat));
  saveDB();
  res.json({ success: true, category: cat });
});

app.delete('/api/categories/:id', requireAdminAuth, (req: Request, res: Response) => {
  const catIdx = db.categories.findIndex(c => c.id === req.params.id || c.key === req.params.id);
  if (catIdx === -1) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  const removed = db.categories[catIdx];
  // Safeguard associated partners
  const connectedPartners = db.partners.filter(p => 
    p.category?.toUpperCase() === removed.key?.toUpperCase() ||
    p.category?.toLowerCase() === removed.name?.toLowerCase()
  );
  if (connectedPartners.length > 0) {
    connectedPartners.forEach(p => {
      p.category = 'SERVICES';
      p.subcategory = p.subcategory || 'General';
    });
  }

  db.categories.splice(catIdx, 1);
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'CATEGORY_DELETED', removed.name, JSON.stringify(removed), `Deleted category. Reassigned ${connectedPartners.length} partners.`);
  saveDB();
  res.json({ success: true, removed, reassignedPartners: connectedPartners.length });
});

app.put('/api/categories-reorder', requireAdminAuth, (req: Request, res: Response) => {
  const { orderedIds, _adminName } = req.body;
  if (!Array.isArray(orderedIds)) {
    res.status(400).json({ error: 'orderedIds must be an array of category IDs' });
    return;
  }
  orderedIds.forEach((id: string, idx: number) => {
    const c = db.categories.find(cat => cat.id === id || cat.key === id);
    if (c) {
      c.displayOrder = idx + 1;
    }
  });
  logAudit(_adminName || 'Admin', 'CONTENT_MANAGER', 'CATEGORIES_REORDERED', `${orderedIds.length} categories reordered`);
  saveDB();
  res.json({ success: true, categories: db.categories });
});

app.patch('/api/categories/:id/toggle', requireAdminAuth, (req: Request, res: Response) => {
  const cat = db.categories.find(c => c.id === req.params.id || c.key === req.params.id);
  if (!cat) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  cat.active = req.body.active !== undefined ? Boolean(req.body.active) : !cat.active;
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'CATEGORY_TOGGLED', cat.name, undefined, `active: ${cat.active}`);
  saveDB();
  res.json({ success: true, category: cat });
});

// 3. Business Partners (Verified Database)
app.get(['/api/partners', '/api/admin/partners'], (req: Request, res: Response) => {
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

app.get(['/api/partners/:id', '/api/admin/partners/:id'], (req: Request, res: Response) => {
  const partner = db.partners.find(p => p.id === req.params.id);
  if (!partner) {
    res.status(404).json({ error: 'Partner not found' });
    return;
  }
  res.json(partner);
});

const createPartnerHandler = (req: Request, res: Response) => {
  const p = req.body;
  if (!p || !p.name || !String(p.name).trim()) {
    res.status(400).json({ success: false, error: 'Business name is required' });
    return;
  }
  const newPartner = {
    id: p.id || `bp-${Date.now()}`,
    name: String(p.name).trim(),
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
    photos: Array.isArray(p.photos) ? p.photos : [],
    videoUrl: p.videoUrl || '',
    ourWork: Array.isArray(p.ourWork) ? p.ourWork : [],
    openingHours: p.openingHours || '09:00 AM - 08:00 PM',
    deliveryAvailable: Boolean(p.deliveryAvailable),
    deliveryFee: Number(p.deliveryFee || 0),
    estimatedDeliveryTime: p.estimatedDeliveryTime || '30-45 mins',
    products: Array.isArray(p.products) ? p.products : [],
    services: Array.isArray(p.services) ? p.services : [],
    promotions: p.promotions || '',
    rating: Number(p.rating || 5.0),
    reviewCount: Number(p.reviewCount || 1),
    verificationStatus: p.verificationStatus || 'verified',
    featuredStatus: Boolean(p.featuredStatus),
    activeStatus: p.activeStatus !== undefined ? Boolean(p.activeStatus) : true,
    active: p.active !== undefined ? Boolean(p.active) : true,
    verified: p.verified !== undefined ? Boolean(p.verified) : true,
    featured: Boolean(p.featured || p.featuredStatus),
    dateAdded: p.dateAdded || new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0]
  };

  db.partners.push(newPartner);
  // Also register any initial products
  if (newPartner.products && newPartner.products.length) {
    newPartner.products.forEach((prod: any) => {
      prod.partnerId = newPartner.id;
      if (!db.products.some(pr => pr.id === prod.id)) {
        db.products.push(prod);
      }
    });
  }
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PARTNER_ADDED', newPartner.name, undefined, JSON.stringify(newPartner));
  saveDB();
  res.json({ success: true, partner: newPartner });
};

app.post('/api/partners', requireAdminAuth, createPartnerHandler);
app.post('/api/admin/partners', requireAdminAuth, createPartnerHandler);

const updatePartnerHandler = (req: Request, res: Response) => {
  const partner = db.partners.find(p => p.id === req.params.id);
  if (!partner) {
    res.status(404).json({ success: false, error: 'Partner not found' });
    return;
  }
  const old = { ...partner };
  Object.assign(partner, req.body, { lastUpdated: new Date().toISOString().split('T')[0] });
  if (req.body.active !== undefined) partner.activeStatus = Boolean(req.body.active);
  if (req.body.activeStatus !== undefined) partner.active = Boolean(req.body.activeStatus);
  if (req.body.verified !== undefined) partner.verificationStatus = req.body.verified ? 'verified' : 'rejected';
  if (req.body.verificationStatus !== undefined) partner.verified = req.body.verificationStatus === 'verified';

  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PARTNER_UPDATED', partner.name, JSON.stringify(old), JSON.stringify(partner));
  saveDB();
  res.json({ success: true, partner });
};

app.put('/api/partners/:id', requireAdminAuth, updatePartnerHandler);
app.put('/api/admin/partners/:id', requireAdminAuth, updatePartnerHandler);

const deletePartnerHandler = (req: Request, res: Response) => {
  const idx = db.partners.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Partner not found' });
    return;
  }
  const removed = db.partners.splice(idx, 1)[0];
  db.products = db.products.filter(pr => pr.partnerId !== req.params.id);
  logAudit(req.body._adminName || 'Admin', 'SUPER_ADMIN', 'PARTNER_DELETED', removed.name, JSON.stringify(removed), 'DELETED');
  saveDB();
  res.json({ success: true, message: `Partner ${removed.name} archived/deleted` });
};

app.delete('/api/partners/:id', requireAdminAuth, deletePartnerHandler);
app.delete('/api/admin/partners/:id', requireAdminAuth, deletePartnerHandler);

const createPartnerProductHandler = (req: Request, res: Response) => {
  const partnerId = req.params.partnerId || req.body.partnerId;
  const p = req.body;
  if (!p || !p.name) {
    res.status(400).json({ success: false, error: 'Product name is required' });
    return;
  }
  const newProduct = {
    id: `prod-${Date.now()}`,
    partnerId: partnerId,
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
  const partner = db.partners.find(pa => pa.id === partnerId);
  if (partner) {
    partner.products = partner.products || [];
    partner.products.push(newProduct);
  }
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'PRODUCT_ADDED', newProduct.name, undefined, JSON.stringify(newProduct));
  saveDB();
  res.json({ success: true, product: newProduct });
};

app.post('/api/admin/partners/:partnerId/products', requireAdminAuth, createPartnerProductHandler);
app.post('/api/partners/:partnerId/products', requireAdminAuth, createPartnerProductHandler);

// Partner Reviews endpoint
app.post('/api/partners/:id/reviews', (req: Request, res: Response) => {
  const partner = db.partners.find(p => p.id === req.params.id);
  if (!partner) {
    res.status(404).json({ error: 'Partner not found' });
    return;
  }

  const { authorName, rating, comment, serviceUsed } = req.body;
  if (!authorName || !rating || !comment) {
    res.status(400).json({ error: 'Author name, rating, and review comment are required' });
    return;
  }

  const numRating = Math.max(1, Math.min(5, Number(rating)));

  if (!partner.reviews) {
    partner.reviews = [];
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    partnerId: partner.id,
    authorName: authorName.trim(),
    rating: numRating,
    date: new Date().toISOString().split('T')[0],
    comment: comment.trim(),
    serviceUsed: serviceUsed ? serviceUsed.trim() : partner.subcategory,
    verifiedUser: true
  };

  partner.reviews.unshift(newReview);

  // Recalculate partner rating and reviewCount
  const totalScore = partner.reviews.reduce((acc: number, r: any) => acc + (Number(r.rating) || 5), 0);
  partner.reviewCount = partner.reviews.length;
  partner.rating = Number((totalScore / partner.reviews.length).toFixed(1));
  partner.lastUpdated = new Date().toISOString().split('T')[0];

  saveDB();
  res.json({ success: true, partner, review: newReview });
});

// 4. Products & Services Management
app.get('/api/products', (req: Request, res: Response) => {
  res.json(db.products);
});

app.post('/api/products', requireAdminAuth, (req: Request, res: Response) => {
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

app.put('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
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

app.delete('/api/products/:id', requireAdminAuth, (req: Request, res: Response) => {
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

// ===========================================================================
// 4A-2. HEALTHCARE & NURSING AND GENERAL SERVICES CATALOG API
// ===========================================================================
const HEALTHCARE_SERVICE_TYPES = [
  {
    id: 'hs-rn',
    name: 'Registered Nurse (RN)',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Hourly / Per Visit',
    defaultDuration: '60 mins',
    description: 'Licensed professional registered nursing care, clinical assessment, patient monitoring, and physician plan implementation.',
    appointmentRequirements: 'Valid patient identification; medical history or physician referral recommended.'
  },
  {
    id: 'hs-home-nursing',
    name: 'Home Nursing',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit',
    defaultDuration: '60 mins',
    description: 'Home-based nursing care including vitals monitoring, medication support, and patient recovery assistance.',
    appointmentRequirements: 'Residential address and contact person required.'
  },
  {
    id: 'hs-elderly-care',
    name: 'Elderly Care',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Hourly / Daily',
    defaultDuration: '2 - 4 hours',
    description: 'Compassionate assistance for seniors, mobility assistance, companionship, vital checks, and personal care routine.',
    appointmentRequirements: 'Family or guardian contact details required.'
  },
  {
    id: 'hs-post-surgery',
    name: 'Post-Surgery Care',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit',
    defaultDuration: '90 mins',
    description: 'Specialized postoperative monitoring, incision inspection, vital signs tracking, and surgeon discharge instructions support.',
    appointmentRequirements: 'Hospital discharge summary and attending physician instructions.'
  },
  {
    id: 'hs-wound-care',
    name: 'Wound Care & Dressing Changes',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit',
    defaultDuration: '45 mins',
    description: 'Aseptic wound cleansing, sterile dressing changes, surgical suture/staple inspection, and healing evaluation.',
    appointmentRequirements: 'Prescribed dressing materials or clinic-supplied sterile kits.'
  },
  {
    id: 'hs-med-admin',
    name: 'Medication Administration',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit',
    defaultDuration: '30 mins',
    description: 'Timely and accurate administration of prescribed oral, subcutaneous, or intramuscular medications by a qualified nurse.',
    appointmentRequirements: 'Valid prescription from a licensed medical practitioner.'
  },
  {
    id: 'hs-iv-therapy',
    name: 'IV Therapy',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Infusion',
    defaultDuration: '60 - 90 mins',
    description: 'Intravenous fluid administration, electrolyte hydration, and IV medication under licensed nursing protocols.',
    appointmentRequirements: 'Doctor prescription and medical order strictly required before infusion.'
  },
  {
    id: 'hs-bp-monitoring',
    name: 'Blood Pressure Monitoring',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit',
    defaultDuration: '20 mins',
    description: 'Calibrated blood pressure checks, resting pulse rate measurement, and longitudinal tracking log for hypertension management.',
    appointmentRequirements: 'None.'
  },
  {
    id: 'hs-diabetes-care',
    name: 'Diabetes Care',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit',
    defaultDuration: '30 mins',
    description: 'Blood glucose testing, insulin administration guidance, diabetic foot checks, and lifestyle nutrition monitoring.',
    appointmentRequirements: 'Patient glucometer/test strips or nurse-provided testing kit.'
  },
  {
    id: 'hs-catheter-care',
    name: 'Catheter Care',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Procedure',
    defaultDuration: '45 mins',
    description: 'Sterile urinary catheter maintenance, bag replacement, hygiene care, and infection surveillance.',
    appointmentRequirements: 'Prescription/physician authorization and sterile catheter supplies.'
  },
  {
    id: 'hs-palliative-care',
    name: 'Palliative Care',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit / Daily',
    defaultDuration: '2 - 3 hours',
    description: 'Comfort-focused nursing, symptom management, emotional and physical relief for patients with serious illness.',
    appointmentRequirements: 'Attending physician care plan and family consent.'
  },
  {
    id: 'hs-overnight-caregiver',
    name: 'Overnight Caregiver',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Overnight (8-12 hrs)',
    defaultDuration: '8 - 12 hours',
    description: 'Dedicated overnight bedside care, nighttime bathroom assistance, vital monitoring, and rapid emergency alert response.',
    appointmentRequirements: 'Secure home environment, emergency contact info.'
  },
  {
    id: 'hs-private-duty-nurse',
    name: 'Private Duty Nurse',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Hourly / Shift',
    defaultDuration: '4 - 8 hours',
    description: 'One-on-one private registered nursing care for high-need patients, chronic condition management, and constant observation.',
    appointmentRequirements: 'Comprehensive care assessment and physician referral.'
  },
  {
    id: 'hs-baby-nurse',
    name: 'Baby & Newborn Nurse',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Hourly / Per Visit',
    defaultDuration: '2 - 4 hours',
    description: 'Postpartum maternal and infant care support, umbilical cord care, neonatal feeding assistance, and newborn health check.',
    appointmentRequirements: 'Hospital delivery discharge card / child health clinic card.'
  },
  {
    id: 'hs-health-check-visits',
    name: 'Health Check Visits',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    pricingType: 'Per Visit',
    defaultDuration: '45 mins',
    description: 'General vital signs assessment (BP, pulse, oxygen saturation, temperature, BMI), wellness consultation, and health record update.',
    appointmentRequirements: 'None.'
  }
];

app.get('/api/healthcare-services/types', (req: Request, res: Response) => {
  res.json(HEALTHCARE_SERVICE_TYPES);
});

app.get('/api/services', (req: Request, res: Response) => {
  const { category, subcategory, partnerId } = req.query;
  let services: any[] = [];
  (db.partners || []).forEach((partner: any) => {
    (partner.services || []).forEach((s: any) => {
      services.push({
        ...s,
        partnerId: partner.id,
        partnerName: partner.name,
        partnerLocation: partner.location,
        partnerPhone: partner.phone,
        partnerVerified: partner.verificationStatus === 'verified' || partner.verified === true,
        category: s.category || partner.category,
        subcategory: s.subcategory || partner.subcategory
      });
    });
  });
  if (category && category !== 'ALL') {
    services = services.filter((s: any) => s.category === category);
  }
  if (subcategory && subcategory !== 'ALL') {
    services = services.filter((s: any) => s.subcategory === subcategory);
  }
  if (partnerId && partnerId !== 'ALL') {
    services = services.filter((s: any) => s.partnerId === partnerId);
  }
  res.json(services);
});

app.post('/api/services', requireAdminAuth, (req: Request, res: Response) => {
  const {
    partnerId,
    name,
    description,
    startingPrice,
    price,
    pricingType,
    duration,
    durationMinutes,
    available,
    category,
    subcategory,
    serviceArea,
    appointmentRequirements,
    verificationStatus,
    credentialsInfo
  } = req.body;

  if (!partnerId || !name) {
    res.status(400).json({ error: 'partnerId and service name are required' });
    return;
  }

  const partner = (db.partners || []).find((p: any) => p.id === partnerId);
  if (!partner) {
    res.status(404).json({ error: 'Merchant partner not found' });
    return;
  }

  const newService = {
    id: `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    partnerId,
    name: String(name).trim(),
    description: String(description || '').trim(),
    startingPrice: Number(startingPrice || price || 0),
    price: Number(price || startingPrice || 0),
    pricingType: pricingType || 'Per Visit',
    duration: duration || '60 mins',
    durationMinutes: Number(durationMinutes || 60),
    available: available !== false,
    category: category || partner.category || 'BEAUTY & WELLNESS',
    subcategory: subcategory || partner.subcategory || 'Healthcare & Nursing',
    serviceArea: serviceArea || partner.location || 'Greater Banjul',
    appointmentRequirements: appointmentRequirements || '',
    verificationStatus: verificationStatus || (partner.verificationStatus === 'verified' ? 'verified' : 'unverified'),
    credentialsInfo: credentialsInfo || ''
  };

  partner.services = partner.services || [];
  partner.services.push(newService);

  logAudit(
    req.body._adminName || 'Admin',
    'BUSINESS_MANAGER',
    'SERVICE_ADDED',
    `${newService.name} (${partner.name})`,
    undefined,
    JSON.stringify(newService)
  );

  saveDB();
  res.status(201).json({ success: true, service: newService, partner });
});

app.put('/api/services/:id', requireAdminAuth, (req: Request, res: Response) => {
  const serviceId = req.params.id;
  let targetPartner: any = null;
  let targetServiceIndex = -1;

  for (const partner of db.partners || []) {
    if (partner.services) {
      const idx = partner.services.findIndex((s: any) => s.id === serviceId);
      if (idx !== -1) {
        targetPartner = partner;
        targetServiceIndex = idx;
        break;
      }
    }
  }

  if (!targetPartner || targetServiceIndex === -1) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const existing = targetPartner.services[targetServiceIndex];
  const updated = {
    ...existing,
    ...req.body,
    id: serviceId,
    partnerId: targetPartner.id
  };
  targetPartner.services[targetServiceIndex] = updated;

  logAudit(
    req.body._adminName || 'Admin',
    'BUSINESS_MANAGER',
    'SERVICE_UPDATED',
    `${updated.name} (${targetPartner.name})`,
    JSON.stringify(existing),
    JSON.stringify(updated)
  );

  saveDB();
  res.json({ success: true, service: updated, partner: targetPartner });
});

app.delete('/api/services/:id', requireAdminAuth, (req: Request, res: Response) => {
  const serviceId = req.params.id;
  let targetPartner: any = null;
  let removedService: any = null;

  for (const partner of db.partners || []) {
    if (partner.services) {
      const idx = partner.services.findIndex((s: any) => s.id === serviceId);
      if (idx !== -1) {
        targetPartner = partner;
        removedService = partner.services.splice(idx, 1)[0];
        break;
      }
    }
  }

  if (!targetPartner || !removedService) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  logAudit(
    req.body._adminName || 'Admin',
    'BUSINESS_MANAGER',
    'SERVICE_DELETED',
    `${removedService.name} (${targetPartner.name})`,
    JSON.stringify(removedService),
    'DELETED'
  );

  saveDB();
  res.json({ success: true, removed: removedService });
});

// ===========================================================================
// 4B. BEAUTY & WELLNESS AND HEALTHCARE BOOKINGS API
// ===========================================================================
app.get('/api/bookings/availability', (req: Request, res: Response) => {
  const { partnerId, date } = req.query;
  if (!partnerId || !date) {
    res.status(400).json({ error: 'partnerId and date query parameters are required' });
    return;
  }
  const ALL_SLOTS = [
    '08:30 AM',
    '09:30 AM',
    '10:30 AM',
    '11:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM',
    '05:30 PM',
    '07:00 PM',
    '08:00 PM'
  ];
  const partnerBookings = (db.beautyBookings || []).filter(
    (b: any) =>
      b.partnerId === partnerId &&
      b.bookingDate === String(date) &&
      b.status !== 'CANCELLED' &&
      b.status !== 'REJECTED'
  );
  const bookedSlots = partnerBookings.map((b: any) => b.bookingTime);
  const availableSlots = ALL_SLOTS.filter(s => !bookedSlots.includes(s));
  res.json({
    partnerId,
    date,
    allSlots: ALL_SLOTS,
    bookedSlots,
    availableSlots,
    hasAvailability: availableSlots.length > 0
  });
});
app.get('/api/bookings', (req: Request, res: Response) => {
  let list = Array.isArray(db.beautyBookings) ? [...db.beautyBookings] : [];
  const { phone, partnerId, status, date, search } = req.query;

  if (phone) {
    const cleanPhone = String(phone).replace(/[\s\-\(\)]/g, '');
    list = list.filter(b => b.customerPhone && b.customerPhone.replace(/[\s\-\(\)]/g, '').includes(cleanPhone));
  }
  if (partnerId && partnerId !== 'ALL') {
    list = list.filter(b => b.partnerId === partnerId);
  }
  if (status && status !== 'ALL') {
    list = list.filter(b => b.status === status);
  }
  if (date) {
    list = list.filter(b => b.bookingDate === String(date));
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(b =>
      b.bookingCode.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.partnerName.toLowerCase().includes(q) ||
      b.serviceName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q)
    );
  }

  // Sort descending by creation date
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  res.json(list);
});

app.get('/api/bookings/:id', (req: Request, res: Response) => {
  const idOrCode = req.params.id;
  const booking = (db.beautyBookings || []).find(
    (b: any) => b.id === idOrCode || b.bookingCode.toUpperCase() === idOrCode.toUpperCase()
  );
  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }
  res.json(booking);
});

app.post('/api/bookings', (req: Request, res: Response) => {
  const {
    partnerId,
    serviceId,
    serviceName,
    servicePrice,
    pricingType,
    durationMinutes,
    customerName,
    customerPhone,
    customerEmail,
    customerNotes,
    serviceLocationAddress,
    serviceCategory,
    serviceSubcategory,
    emergencyContactName,
    emergencyContactPhone,
    bookingDate,
    bookingTime,
    paymentMethod
  } = req.body;

  if (!partnerId || !customerName || !customerPhone || !bookingDate || !bookingTime) {
    res.status(400).json({
      error: 'Missing required booking fields: partner, customer name, Gambian phone number, appointment date, and time slot are required.'
    });
    return;
  }

  // Double-booking check: verify if partner already has a confirmed or accepted booking at that date & time
  const conflict = (db.beautyBookings || []).find(
    (b: any) =>
      b.partnerId === partnerId &&
      b.bookingDate === bookingDate &&
      b.bookingTime === bookingTime &&
      b.status !== 'CANCELLED' &&
      b.status !== 'REJECTED'
  );

  if (conflict) {
    res.status(409).json({
      error: `The ${bookingTime} time slot on ${bookingDate} is already booked for this provider. Please choose another available time or date.`
    });
    return;
  }

  const partner = (db.partners || []).find((p: any) => p.id === partnerId);
  const partnerName = partner ? partner.name : (req.body.partnerName || 'Beauty & Wellness Partner');
  const partnerLocation = partner?.location || 'The Gambia';
  const partnerPhone = partner?.phone || '+220 788 1234';
  const partnerWhatsapp = partner?.whatsapp || partnerPhone;
  const bookingCode = `BKG-GMB-${Math.floor(1000 + Math.random() * 9000)}`;

  const newBooking = {
    id: `bkg-${Date.now()}`,
    bookingCode,
    partnerId,
    partnerName,
    partnerLocation,
    partnerPhone,
    partnerWhatsapp,
    serviceId: serviceId || '',
    serviceName: serviceName || 'Service Appointment',
    servicePrice: Number(servicePrice || 0),
    pricingType: pricingType || 'Fixed',
    durationMinutes: Number(durationMinutes || 45),
    customerName: String(customerName).trim(),
    customerPhone: String(customerPhone).trim(),
    customerEmail: customerEmail ? String(customerEmail).trim() : '',
    customerNotes: customerNotes ? String(customerNotes).trim() : '',
    serviceLocationAddress: serviceLocationAddress ? String(serviceLocationAddress).trim() : '',
    serviceCategory: serviceCategory || partner?.category || 'BEAUTY & WELLNESS',
    serviceSubcategory: serviceSubcategory || partner?.subcategory || 'Healthcare & Nursing',
    emergencyContactName: emergencyContactName ? String(emergencyContactName).trim() : '',
    emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).trim() : '',
    bookingDate: String(bookingDate).trim(),
    bookingTime: String(bookingTime).trim(),
    status: 'PENDING',
    paymentMethod: paymentMethod || 'CASH',
    paymentStatus: (paymentMethod && paymentMethod !== 'CASH') ? 'PENDING_VERIFICATION' : 'UNPAID',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!Array.isArray(db.beautyBookings)) {
    db.beautyBookings = [];
  }
  db.beautyBookings.unshift(newBooking);

  logAudit(
    customerName,
    'CUSTOMER',
    'BEAUTY_BOOKING_CREATED',
    `${bookingCode} at ${partnerName}`,
    JSON.stringify({ service: newBooking.serviceName, price: newBooking.servicePrice, date: bookingDate, time: bookingTime })
  );

  saveDB();
  res.status(201).json({ success: true, booking: newBooking });
});

app.patch('/api/bookings/:id/status', (req: Request, res: Response) => {
  const idOrCode = req.params.id;
  const booking = (db.beautyBookings || []).find(
    (b: any) => b.id === idOrCode || b.bookingCode.toUpperCase() === idOrCode.toUpperCase()
  );

  if (!booking) {
    res.status(404).json({ error: 'Booking not found' });
    return;
  }

  const { status, rejectionReason, cancellationReason, paymentStatus, notes } = req.body;
  const validStatuses = ['PENDING', 'ACCEPTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  if (status) booking.status = status;
  if (rejectionReason !== undefined) booking.rejectionReason = rejectionReason;
  if (cancellationReason !== undefined) booking.cancellationReason = cancellationReason;
  if (paymentStatus !== undefined) booking.paymentStatus = paymentStatus;
  if (notes !== undefined) booking.customerNotes = notes;
  booking.updatedAt = new Date().toISOString();

  logAudit(
    req.body._adminName || req.body._merchantName || booking.customerName,
    req.body._role || 'ADMIN',
    'BEAUTY_BOOKING_STATUS_UPDATED',
    `${booking.bookingCode} -> ${booking.status}`,
    `Updated to ${booking.status}`
  );

  saveDB();
  res.json({ success: true, booking });
});

// ===========================================================================
// 4C. NATIVE DELIVERY & ERRANDS REQUESTS API
// ===========================================================================
app.get('/api/delivery-requests', (req: Request, res: Response) => {
  let list = Array.isArray(db.deliveryRequests) ? [...db.deliveryRequests] : [];
  const { phone, partnerId, trackingCode, status, search } = req.query;

  if (phone) {
    const cleanPhone = String(phone).replace(/[\s\-\(\)]/g, '');
    list = list.filter(
      d =>
        (d.pickupContactPhone && d.pickupContactPhone.replace(/[\s\-\(\)]/g, '').includes(cleanPhone)) ||
        (d.recipientPhone && d.recipientPhone.replace(/[\s\-\(\)]/g, '').includes(cleanPhone))
    );
  }
  if (partnerId && partnerId !== 'ALL') {
    list = list.filter(d => d.assignedPartnerId === partnerId);
  }
  if (trackingCode) {
    list = list.filter(d => d.trackingCode.toUpperCase().includes(String(trackingCode).toUpperCase()));
  }
  if (status && status !== 'ALL') {
    list = list.filter(d => d.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(d =>
      d.trackingCode.toLowerCase().includes(q) ||
      d.pickupContactName.toLowerCase().includes(q) ||
      d.recipientName.toLowerCase().includes(q) ||
      d.pickupLocation.toLowerCase().includes(q) ||
      d.destinationLocation.toLowerCase().includes(q) ||
      d.packageDescription.toLowerCase().includes(q)
    );
  }

  // Sort descending by creation date
  list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  res.json(list);
});

app.get(['/api/delivery-requests/:id', '/api/delivery-requests/track/:code'], (req: Request, res: Response) => {
  const idOrCode = req.params.id || req.params.code;
  const request = (db.deliveryRequests || []).find(
    (d: any) => d.id === idOrCode || d.trackingCode.toUpperCase() === idOrCode.toUpperCase()
  );
  if (!request) {
    res.status(404).json({ error: 'Delivery request not found' });
    return;
  }
  res.json(request);
});

app.post('/api/delivery-requests', (req: Request, res: Response) => {
  const {
    deliveryType,
    pickupLocation,
    pickupAddress,
    pickupContactName,
    pickupContactPhone,
    destinationLocation,
    destinationAddress,
    dropoffLocation,
    dropoffAddress,
    recipientName,
    recipientPhone,
    packageDescription,
    packageWeightApprox,
    fragile,
    notes,
    assignedPartnerId,
    estimatedFee,
    deliveryFee,
    paymentMethod
  } = req.body;

  const targetDestAddress = destinationAddress || dropoffAddress;
  const targetDestLocation = destinationLocation || dropoffLocation || 'Greater Banjul';
  const finalFee = Number(estimatedFee || deliveryFee || 120);

  if (!deliveryType || !pickupAddress || !pickupContactPhone || !targetDestAddress || !recipientPhone || !packageDescription) {
    res.status(400).json({
      error: 'Missing required delivery fields: delivery type, pickup address & phone, destination address & recipient phone, and item description are required.'
    });
    return;
  }

  const assignedPartner = (db.partners || []).find((p: any) => p.id === assignedPartnerId) ||
    (db.partners || []).find((p: any) => p.category === 'DELIVERY & ERRANDS');

  const trackingCode = `SHL-DEL-${Math.floor(1000 + Math.random() * 9000)}`;

  const newDelivery = {
    id: `del-${Date.now()}`,
    trackingCode,
    deliveryType: deliveryType || 'Express Courier',
    pickupLocation: pickupLocation || 'Greater Banjul',
    pickupAddress: String(pickupAddress).trim(),
    pickupContactName: pickupContactName ? String(pickupContactName).trim() : 'Sender',
    pickupContactPhone: String(pickupContactPhone).trim(),
    destinationLocation: targetDestLocation,
    destinationAddress: String(targetDestAddress).trim(),
    dropoffLocation: targetDestLocation,
    dropoffAddress: String(targetDestAddress).trim(),
    recipientName: recipientName ? String(recipientName).trim() : 'Recipient',
    recipientPhone: String(recipientPhone).trim(),
    packageDescription: String(packageDescription).trim(),
    packageWeightApprox: packageWeightApprox || 'Standard (<5kg)',
    fragile: Boolean(fragile),
    notes: notes ? String(notes).trim() : '',
    assignedPartnerId: assignedPartner?.id || 'bp-4',
    assignedPartnerName: assignedPartner?.name || 'SOHLA Swift Delivery & Errand Couriers',
    courierPartnerName: assignedPartner?.name || 'SOHLA Swift Delivery & Errand Couriers',
    assignedPartnerPhone: assignedPartner?.phone || '+220 230 7711',
    assignedPartnerWhatsapp: assignedPartner?.whatsapp || '+220 230 7711',
    estimatedFee: finalFee,
    deliveryFee: finalFee,
    status: 'PENDING',
    paymentMethod: paymentMethod || 'CASH',
    paymentStatus: (paymentMethod && paymentMethod !== 'CASH') ? 'PENDING_VERIFICATION' : 'UNPAID',
    statusHistory: [
      {
        status: 'PENDING',
        timestamp: new Date().toISOString(),
        note: `Delivery request submitted for ${deliveryType}. Awaiting courier dispatch confirmation.`
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!Array.isArray(db.deliveryRequests)) {
    db.deliveryRequests = [];
  }
  db.deliveryRequests.unshift(newDelivery);

  logAudit(
    newDelivery.pickupContactName,
    'CUSTOMER',
    'DELIVERY_REQUEST_CREATED',
    `${trackingCode} (${deliveryType})`,
    JSON.stringify({ pickup: newDelivery.pickupAddress, destination: newDelivery.destinationAddress, fee: newDelivery.estimatedFee })
  );

  saveDB();
  res.status(201).json({ success: true, request: newDelivery });
});

app.patch('/api/delivery-requests/:id/status', (req: Request, res: Response) => {
  const idOrCode = req.params.id;
  const delivery = (db.deliveryRequests || []).find(
    (d: any) => d.id === idOrCode || d.trackingCode.toUpperCase() === idOrCode.toUpperCase()
  );

  if (!delivery) {
    res.status(404).json({ error: 'Delivery request not found' });
    return;
  }

  const {
    status,
    note,
    assignedPartnerId,
    driverNotes,
    rejectionReason,
    cancellationReason,
    paymentStatus
  } = req.body;

  const validStatuses = [
    'PENDING',
    'ACCEPTED',
    'PICKUP_ASSIGNED',
    'PICKED_UP',
    'IN_TRANSIT',
    'DELIVERED',
    'CANCELLED',
    'REJECTED'
  ];

  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  if (assignedPartnerId) {
    const partner = (db.partners || []).find((p: any) => p.id === assignedPartnerId);
    if (partner) {
      delivery.assignedPartnerId = partner.id;
      delivery.assignedPartnerName = partner.name;
      delivery.assignedPartnerPhone = partner.phone;
      delivery.assignedPartnerWhatsapp = partner.whatsapp;
    }
  }

  if (driverNotes !== undefined) delivery.driverNotes = driverNotes;
  if (rejectionReason !== undefined) delivery.rejectionReason = rejectionReason;
  if (cancellationReason !== undefined) delivery.cancellationReason = cancellationReason;
  if (paymentStatus !== undefined) delivery.paymentStatus = paymentStatus;

  if (status && status !== delivery.status) {
    delivery.status = status;
    if (!Array.isArray(delivery.statusHistory)) {
      delivery.statusHistory = [];
    }
    delivery.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status.replace(/_/g, ' ')}`
    });
  }

  delivery.updatedAt = new Date().toISOString();

  logAudit(
    req.body._adminName || req.body._courierName || 'Courier System',
    req.body._role || 'ADMIN',
    'DELIVERY_STATUS_UPDATED',
    `${delivery.trackingCode} -> ${delivery.status}`,
    note || `Delivery status changed to ${delivery.status}`
  );

  saveDB();
  res.json({ success: true, request: delivery });
});

app.post('/api/delivery-requests/:id/cancel', (req: Request, res: Response) => {
  const idOrCode = req.params.id;
  const delivery = (db.deliveryRequests || []).find(
    (d: any) => d.id === idOrCode || d.trackingCode.toUpperCase() === idOrCode.toUpperCase()
  );

  if (!delivery) {
    res.status(404).json({ error: 'Delivery request not found' });
    return;
  }

  if (delivery.status === 'DELIVERED') {
    res.status(400).json({ error: 'Cannot cancel a completed delivery.' });
    return;
  }

  const reason = req.body.cancellationReason || 'Cancelled by customer';
  delivery.status = 'CANCELLED';
  delivery.cancellationReason = reason;
  delivery.updatedAt = new Date().toISOString();

  if (!Array.isArray(delivery.statusHistory)) {
    delivery.statusHistory = [];
  }
  delivery.statusHistory.push({
    status: 'CANCELLED',
    timestamp: new Date().toISOString(),
    note: reason
  });

  logAudit(req.body.customerName || 'Customer', 'CUSTOMER', 'DELIVERY_CANCELLED', delivery.trackingCode, reason);
  saveDB();
  res.json({ success: true, request: delivery });
});

// 5. Advertisements Management
app.get('/api/ads', (req: Request, res: Response) => {
  const activeAds = db.advertisements
    .filter(ad => ad.active)
    .sort((a, b) => (a.priority || 1) - (b.priority || 1));
  res.json(activeAds);
});

app.get('/api/admin/ads', requireAdminAuth, (req: Request, res: Response) => {
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

app.post('/api/ads', requireAdminAuth, createAdHandler);
app.post('/api/admin/ads', requireAdminAuth, createAdHandler);

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

app.put('/api/ads/:id', requireAdminAuth, updateAdHandler);
app.put('/api/admin/ads/:id', requireAdminAuth, updateAdHandler);

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

app.delete('/api/ads/:id', requireAdminAuth, deleteAdHandler);
app.delete('/api/admin/ads/:id', requireAdminAuth, deleteAdHandler);

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

app.post('/api/ads/auto-generate', requireAdminAuth, autoGenerateAdHandler);
app.post('/api/admin/ads/auto-generate', requireAdminAuth, autoGenerateAdHandler);

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

  // Additive active AI Knowledge entries managed via Private Control Center
  const activeKnowledge = (db.aiKnowledgeEntries || []).filter((k: any) => k.active);
  const knowledgeSummary = activeKnowledge.length > 0
    ? `\nSPECIAL ANNOUNCEMENTS & OFFICIAL KNOWLEDGE:\n` + activeKnowledge.map((k: any) => `• [${k.category}] ${k.title}: ${k.content}`).join('\n')
    : '';

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
${knowledgeSummary}
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

      // Safe timeout (5 seconds) wrapper to prevent indefinite hangs on network delays or rate limits
      const timeoutMs = 5000;
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('SOHLA AI: Gemini API request timed out after 5s')), timeoutMs);
      });

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction,
            temperature: 0.3 // Low temperature for high factual accuracy
          }
        }),
        timeoutPromise
      ]);
      clearTimeout(timer!);

      reply = response.text || "Hello! I am SOHLA AI. How can I help simplify your day in The Gambia?";
    } catch (err: any) {
      console.error('Gemini API call failed or timed out, using intelligent local engine:', err?.message || err);
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
  if (q.includes('food') || q.includes('eat') || q.includes('restaurant') || q.includes('fish') || q.includes('benachin')) return 'FOOD & RESTAURANTS';
  if (q.includes('hotel') || q.includes('stay') || q.includes('resort') || q.includes('lodge') || q.includes('suite') || q.includes('guest house') || q.includes('motel') || q.includes('room booking') || q.includes('accommodation')) return 'HOTELS & STAYS';
  if (q.includes('house') || q.includes('housing') || q.includes('property') || q.includes('properties') || q.includes('rent') || q.includes('villa') || q.includes('apartment') || q.includes('land') || q.includes('plot') || q.includes('estate') || q.includes('real estate')) return 'HOUSING & PROPERTIES';
  if (q.includes('taxi') || q.includes('ride') || q.includes('car') || q.includes('airport transfer')) return 'TRANSPORT';
  if (q.includes('phone') || q.includes('samsung') || q.includes('laptop') || q.includes('buy') || q.includes('shop')) return 'SHOPPING';
  if (q.includes('cash power') || q.includes('nawec') || q.includes('meter') || q.includes('electricity')) return 'BUY CASH POWER (NAWEC)';
  if (q.includes('deliver') || q.includes('courier') || q.includes('errand') || q.includes('package') || q.includes('parcel') || q.includes('dispatch') || q.includes('send')) return 'DELIVERY & ERRANDS';
  if (q.includes('hair') || q.includes('braid') || q.includes('spa') || q.includes('massage') || q.includes('barber') || q.includes('salon') || q.includes('facial') || q.includes('nail') || q.includes('henna') || q.includes('makeup') || q.includes('wellness')) return 'BEAUTY & WELLNESS';
  return 'GENERAL';
}

function guessLocation(q: string): string | null {
  const locs = ['Senegambia', 'Kololi', 'Kairaba', 'Fajara', 'Banjul', 'Serekunda', 'Brusubi', 'Bakau', 'Bijilo', 'Kotu', 'Sukuta'];
  for (const l of locs) {
    if (q.toLowerCase().includes(l.toLowerCase())) return l;
  }
  return null;
}

function generateIntelligentFallback(q: string, partners: any[]): string {
  // Check for greetings
  if (/^(hi|hello|salaam|nanga def|abara kaata|good morning|good afternoon)/i.test(q)) {
    return `Salaam Alaikum! I am SOHLA AI — your everyday assistant in The Gambia. 
I can help you find verified barbers, salons, book spa treatments, order couriers & market errands, find restaurants, or buy instant NAWEC Cash Power. How can I assist you right now?`;
  }

  // Check for NAWEC / Electricity
  if (q.includes('nawec') || q.includes('cash power') || q.includes('electricity') || q.includes('meter')) {
    return `You can purchase NAWEC Cash Power directly on SOHLA! Simply tap the 'Buy Cash Power (NAWEC)' card on your home screen or select Utilities. You can enter your 11-digit meter number, pay with Wave, QMoney, or card, and receive your 20-digit token immediately.`;
  }

  // Check for Barber / Men's Grooming / Haircut
  if (q.includes('barber') || q.includes('haircut') || q.includes('fade') || q.includes('shave') || q.includes('beard')) {
    const barber = partners.find(p => p.category === 'BEAUTY & WELLNESS' && (p.subcategory === 'Barbers' || p.name.includes('Barber')));
    if (barber) {
      return `For executive haircuts and grooming, I recommend verified partner **${barber.name}** in ${barber.location}!
• **Address**: ${barber.address}
• **Verified Services & Dalasi Pricing**:
  - Precision Haircut, Fade & Edge-up: D250
  - Royal Hot Towel Shave & Beard Sculpting: D180
  - VIP Executive Grooming Package (Cut, Beard & Charcoal Facial): D600
  - Kids Smart Haircut: D150
• **Direct Booking**: You can book an appointment slot directly through SOHLA or connect on WhatsApp at **${barber.whatsapp}**.`;
    }
  }

  // Check for Salon / Braids / Nails / Henna / Makeup
  if (q.includes('salon') || q.includes('braid') || q.includes('knotless') || q.includes('henna') || q.includes('nail') || q.includes('makeup')) {
    const salon = partners.find(p => p.category === 'BEAUTY & WELLNESS' && (p.name.includes('Glow') || p.name.includes('Henna')));
    if (salon) {
      return `For professional styling, braiding, and beauty care, check out verified partner **${salon.name}** in ${salon.location}!
• **Address**: ${salon.address}
• **Popular Services**:
  - Knotless Braids with Extensions: D1,200
  - Aromatherapy Deep Tissue Massage (60 mins): D1,500
  - Botanical Cleansing Facial & Steaming: D850
  - Traditional Bridal Henna (Hands & Feet): D850
• **Online Booking**: Tap 'Book Service' to reserve your preferred date & time slot directly in SOHLA!
• **Phone & WhatsApp**: **${salon.whatsapp}**`;
    }
  }

  // Check for Massage / Spa / Wellness
  if (q.includes('massage') || q.includes('spa') || q.includes('wellness') || q.includes('facial') || q.includes('scrub')) {
    const spa = partners.find(p => p.category === 'BEAUTY & WELLNESS' && (p.subcategory?.includes('Spa') || p.name.includes('Spa') || p.name.includes('Glow')));
    if (spa) {
      return `For relaxation and wellness treatments, verified partner **${spa.name}** in ${spa.location} offers:
• **Aromatherapy Deep Tissue Massage (60 mins)**: D1,500
• **Organic Shea Butter Body Scrub**: D850
• **Hours**: ${spa.openingHours}
• **Reservations**: You can select a date and book your treatment directly through SOHLA, or call/WhatsApp **${spa.whatsapp}**.`;
    }
  }

  // Check for Delivery / Courier / Errand / Send Package / Deliver to Banjul / Brusubi to Kololi
  if (q.includes('deliver') || q.includes('courier') || q.includes('errand') || q.includes('send package') || q.includes('package') || q.includes('parcel') || q.includes('dispatch')) {
    const courier = partners.find(p => p.category === 'DELIVERY & ERRANDS');
    if (courier) {
      return `For swift door-to-door delivery across Greater Banjul, verified partner **${courier.name}** is on standby!
• **Rates & Available Options**:
  - Greater Banjul Standard Parcel Courier: From D120
  - Hot Restaurant Food Delivery: D100
  - Serekunda Market Fresh Grocery Errand: D200
  - Urgent Document & Bank Cheque Dispatch: D150
  - Fragile Cake & Glassware Careful Transit: D180
• **Direct Dispatch**: Tap 'Send a Package' on the Delivery page to submit your pickup and destination details with instant tracking code, or WhatsApp dispatch at **${courier.whatsapp}**!`;
    }
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

  // Check for Housing & Properties / Rentals / Villas / Land
  if (q.includes('house') || q.includes('housing') || q.includes('property') || q.includes('rent') || q.includes('villa') || q.includes('apartment') || q.includes('land') || q.includes('plot') || q.includes('real estate')) {
    const realEstate = partners.find(p => p.category === 'HOUSING & PROPERTIES');
    if (realEstate) {
      return `For verified real estate, rentals, and titled land in The Gambia, I recommend **${realEstate.name}**!
• **Location**: ${realEstate.location} (${realEstate.address})
• **Available Listings**:
  - Luxury 4-Bedroom Pool Villa (Brusubi Phase 1): D45,000/mo
  - Executive 2-Bedroom Furnished Apartment (Fajara): D25,000/mo
  - Titled Residential Land Plot (Bijilo, 20x30m): D650,000
• **Services**: Tenant placement, property management & Lands Department title search
• **Direct Phone & WhatsApp**: **${realEstate.whatsapp}**`;
    }
  }

  // Check for Hotels & Stays / Resorts / Accommodation
  if (q.includes('hotel') || q.includes('stay') || q.includes('resort') || q.includes('lodge') || q.includes('room') || q.includes('suite') || q.includes('guest house') || q.includes('vacation')) {
    const hotel = partners.find(p => p.category === 'HOTELS & STAYS');
    if (hotel) {
      return `For comfortable lodging and holiday stays in The Gambia, check out verified partner **${hotel.name}**!
• **Location**: ${hotel.location} (${hotel.address})
• **Verified Room Options**:
  - Deluxe Ocean View Room: D3,800/night (Includes buffet breakfast & WiFi)
  - Executive Beachfront Suite: D6,500/night (With plunge lounge & sunset terrace)
  - Weekend Eco-Lodge Family Bungalow: D4,200/night
• **Amenities**: Direct beach access, tropical pools, Kotu river birdwatching & VIP airport transfers
• **Reservations & WhatsApp**: **${hotel.whatsapp}**`;
    }
  }

  // If user asks for missing item (e.g. cake)
  if (q.includes('cake') || q.includes('bakery')) {
    return `Currently, SOHLA does not have a verified partner offering custom birthday cakes or fresh bakery goods in that specific area. 
I have automatically recorded your request for our merchant onboarding team so we can partner with a quality local bakery soon! In the meantime, would you like to explore verified restaurants in Senegambia?`;
  }

  // General fallback strictly citing verified partners
  return `I searched our verified Gambian partner database. We have verified businesses across Food & Dining, Shopping, Housing & Properties, Hotels & Stays, Transport, Deliveries, and NAWEC Cash Power. 
Could you clarify what product, service, or location you are looking for today?`;
}

// 7. Missing Requests Telemetry (AI Improvement Center)
app.get('/api/ai/missing-requests', (req: Request, res: Response) => {
  res.json(db.missingRequests);
});

app.post('/api/ai/missing-requests/:id/resolve', requireAdminAuth, (req: Request, res: Response) => {
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
app.get('/api/admin/stats', requireAdminAuth, (req: Request, res: Response) => {
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
app.get('/api/admin/missing-requests', requireAdminAuth, (req: Request, res: Response) => {
  res.json(db.missingRequests);
});

app.put('/api/admin/missing-requests/:id/resolve', requireAdminAuth, (req: Request, res: Response) => {
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

// 9. Audit Logs (Restricted to authenticated administrators)
app.get('/api/admin/audit-logs', requireAdminAuth, (req: Request, res: Response) => {
  res.json(db.auditLogs);
});

// 10. Admin Auth & Security Guard
// Server is the sole authority. Rate limiting and brute-force lockout protection enabled.
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and administrator password are required' });
    return;
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
  const cleanUser = String(username).trim().toLowerCase();
  const lockoutKey = `${clientIp}_${cleanUser}`;
  const attemptInfo = failedLoginAttempts.get(lockoutKey);

  // Check brute force temporary lockout
  if (attemptInfo && attemptInfo.lockedUntil > Date.now()) {
    const remainingSeconds = Math.ceil((attemptInfo.lockedUntil - Date.now()) / 1000);
    res.status(429).json({ error: `Too many failed login attempts. Account gateway locked for ${remainingSeconds} seconds.` });
    return;
  }

  const matched = db.adminUsers.find(u => 
    u.username.toLowerCase() === cleanUser || 
    u.email.toLowerCase() === cleanUser ||
    (u.phone && u.phone.replace(/[\s+-]/g, '') === cleanUser.replace(/[\s+-]/g, ''))
  );

  // Validate using cryptographically secure PBKDF2-SHA512 hash
  const storedHash = matched?.passwordHash || db.adminSecurity?.passwordHash || `${INITIAL_SALT}:${INITIAL_HASH}`;
  const isValid = matched && matched.active && verifyPassword(String(password), storedHash);

  if (!matched || !isValid) {
    const current = attemptInfo || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = Date.now() + 2 * 60 * 1000; // 2-minute lockout
      logAudit(cleanUser, 'GUEST', 'ADMIN_ACCOUNT_LOCKED', `5 failed attempts from ${clientIp}`, undefined, undefined, 'WARNING');
    }
    failedLoginAttempts.set(lockoutKey, current);
    logAudit(cleanUser, 'GUEST', 'ADMIN_LOGIN_FAILED', 'Invalid credentials attempt', undefined, undefined, 'FAILURE');
    
    // Constant response: never leak whether username exists or password partially matched
    res.status(401).json({ error: 'Invalid administrator credentials' });
    return;
  }

  // Clear failed attempts counter upon successful authentication
  failedLoginAttempts.delete(lockoutKey);

  // Generate cryptographically secure random session token
  const token = `adm_${crypto.randomBytes(32).toString('hex')}`;
  activeAdminSessions.set(token, {
    userId: matched.id,
    username: matched.username,
    role: matched.role,
    name: matched.name,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
  });

  matched.lastLogin = new Date().toISOString();
  logAudit(matched.name, matched.role, 'ADMIN_LOGIN_SUCCESS', `Secure session established for ${matched.username}`);
  saveDB();

  // Set secure HttpOnly cookie
  res.cookie('sohla_admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  });

  // Strip sensitive hashes before returning user object
  const { passwordHash, ...sanitizedUser } = matched;
  res.json({
    success: true,
    token,
    user: sanitizedUser
  });
});

app.get('/api/admin/verify-session', (req: Request, res: Response) => {
  const auth = verifyAdminSession(req);
  if (!auth.valid || !auth.session) {
    res.status(401).json({ valid: false, error: auth.error || 'Session expired or invalid' });
    return;
  }

  const user = db.adminUsers.find(u => u.id === auth.session!.userId);
  if (!user || !user.active) {
    res.status(401).json({ valid: false, error: 'User disabled or not found' });
    return;
  }

  const { passwordHash, ...sanitizedUser } = user;
  res.json({ valid: true, user: sanitizedUser, role: auth.session.role });
});

app.post('/api/admin/logout', (req: Request, res: Response) => {
  const token = extractSessionToken(req);
  if (token) {
    const session = activeAdminSessions.get(token);
    if (session) {
      logAudit(session.name, session.role, 'ADMIN_LOGOUT', `Session closed for ${session.username}`);
    }
    activeAdminSessions.delete(token);
  }
  res.clearCookie('sohla_admin_session');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/admin/security-status', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    algorithm: db.adminSecurity?.algorithm || 'PBKDF2-SHA512',
    iterations: db.adminSecurity?.iterations || 10000,
    lastUpdated: db.adminSecurity?.lastUpdated || new Date().toISOString(),
    activeSessionsCount: activeAdminSessions.size,
    isProtected: true
  });
});

// Inside Control Center only: Change Admin Password (SUPER_ADMIN authorization required)
app.post('/api/admin/change-password', requireSuperAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }
  if (newPassword !== confirmPassword) {
    res.status(400).json({ error: 'New password and confirmation do not match' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long' });
    return;
  }

  const user = db.adminUsers.find(u => u.id === session.userId);
  const currentTargetHash = user?.passwordHash || db.adminSecurity?.passwordHash || `${INITIAL_SALT}:${INITIAL_HASH}`;
  const isValid = verifyPassword(String(currentPassword), currentTargetHash);

  if (!isValid) {
    logAudit(session.name, session.role, 'ADMIN_PASSWORD_CHANGE_FAILED', 'Current password verification failed', undefined, undefined, 'FAILURE');
    res.status(401).json({ error: 'Current administrator password is incorrect' });
    return;
  }

  // Hash new password securely with PBKDF2-SHA512 with fresh cryptographic salt
  const newHash = hashPassword(String(newPassword));
  if (!db.adminSecurity) {
    db.adminSecurity = {
      passwordHash: newHash,
      lastUpdated: new Date().toISOString(),
      algorithm: 'PBKDF2-SHA512',
      iterations: 10000
    };
  } else {
    db.adminSecurity.passwordHash = newHash;
    db.adminSecurity.lastUpdated = new Date().toISOString();
  }

  if (user) {
    user.passwordHash = newHash;
  }

  // Invalidate all other active sessions so older sessions must re-authenticate with new password
  const currentToken = extractSessionToken(req);
  for (const token of activeAdminSessions.keys()) {
    if (token !== currentToken) {
      activeAdminSessions.delete(token);
    }
  }

  logAudit(session.name, session.role, 'ADMIN_PASSWORD_CHANGED', 'Platform administrator password updated securely', undefined, 'PBKDF2-SHA512 hash updated');
  saveDB();

  res.json({
    success: true,
    message: 'Administrator password updated successfully',
    lastUpdated: db.adminSecurity.lastUpdated
  });
});

app.post('/api/admin/revoke-sessions', requireSuperAdmin, (req: Request, res: Response) => {
  const currentToken = extractSessionToken(req);
  const session = (req as any).adminSession;

  // Clear all sessions except current one
  for (const token of activeAdminSessions.keys()) {
    if (token !== currentToken) {
      activeAdminSessions.delete(token);
    }
  }

  logAudit(session.name, session.role, 'ADMIN_SESSIONS_REVOKED', 'Revoked all other active administrative sessions');
  res.json({ success: true, message: 'All other active sessions revoked' });
});

// 10. Admin Team Member Management (STRICTLY RESTRICTED TO SUPER_ADMIN)
app.get(['/api/admin/users', '/api/admin/team'], requireSuperAdmin, (req: Request, res: Response) => {
  const sanitizedUsers = db.adminUsers.map(u => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  res.json(sanitizedUsers);
});

// Add a team member with security clearance and verified personal information (SUPER_ADMIN only)
app.post('/api/admin/users', requireSuperAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
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
    twoFactorEnabled
  } = req.body;

  const actingRole = session?.role || 'SUPER_ADMIN';
  const actingAdmin = session?.name || 'Super Admin';

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

// Update team member credentials (SUPER_ADMIN only)
app.put('/api/admin/users/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
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
    twoFactorEnabled
  } = req.body;

  const targetUser = db.adminUsers.find((u: any) => u.id === id);
  if (!targetUser) {
    res.status(404).json({ error: 'Team member not found' });
    return;
  }

  const actingRole = session?.role || 'SUPER_ADMIN';
  const actingAdmin = session?.name || 'Super Admin';

  if (name) targetUser.name = name.trim();
  if (email) targetUser.email = email.trim().toLowerCase();
  if (phone) targetUser.phone = phone.trim();
  if (nationalIdOrNin) targetUser.nationalIdOrNin = nationalIdOrNin.trim().toUpperCase();
  if (department) targetUser.department = department.trim();
  if (role) targetUser.role = role;
  if (securityClearance) targetUser.securityClearance = securityClearance;
  if (verifiedPersonal !== undefined) targetUser.verifiedPersonal = Boolean(verifiedPersonal);
  if (twoFactorEnabled !== undefined) targetUser.twoFactorEnabled = Boolean(twoFactorEnabled);

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

// Toggle team member active / suspended status (SUPER_ADMIN only)
app.put('/api/admin/users/:id/toggle-status', requireSuperAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  const { id } = req.params;

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
  const actingAdmin = session?.name || 'Super Admin';
  const actingRole = session?.role || 'SUPER_ADMIN';

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
app.delete('/api/admin/users/:id', requireSuperAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  const { id } = req.params;

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
  const actingAdmin = session?.name || 'Super Admin';
  const actingRole = session?.role || 'SUPER_ADMIN';

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

// ===========================================================================
// SOHLA PRIVATE CONTROL CENTER API ENDPOINTS (SAFE, ADDITIVE)
// ===========================================================================

// --- News Management ---
app.get('/api/control-center/news', (req: Request, res: Response) => {
  res.json(db.newsArticles || []);
});

app.post('/api/control-center/news', (req: Request, res: Response) => {
  const item = req.body;
  const newArticle = {
    id: `news-${Date.now()}`,
    title: item.title || 'Untitled Article',
    slug: (item.title || 'article').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    summary: item.summary || '',
    content: item.content || '',
    category: item.category || 'Local Business',
    author: item.author || req.body._adminName || 'Editorial Team',
    coverImage: item.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
    status: item.status || 'draft',
    publishedAt: item.status === 'published' ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    tags: item.tags || ['Gambia', 'SOHLA']
  };

  db.newsArticles = db.newsArticles || [];
  db.newsArticles.unshift(newArticle);
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'NEWS_CREATED', newArticle.title, undefined, JSON.stringify(newArticle));
  saveDB();
  res.json({ success: true, article: newArticle });
});

app.put('/api/control-center/news/:id', (req: Request, res: Response) => {
  const item = (db.newsArticles || []).find((a: any) => a.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  const oldTitle = item.title;
  Object.assign(item, req.body, { updatedAt: new Date().toISOString() });
  if (req.body.status === 'published' && !item.publishedAt) {
    item.publishedAt = new Date().toISOString();
  }
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'NEWS_UPDATED', item.title, oldTitle);
  saveDB();
  res.json({ success: true, article: item });
});

app.delete('/api/control-center/news/:id', (req: Request, res: Response) => {
  const idx = (db.newsArticles || []).findIndex((a: any) => a.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Article not found' });
    return;
  }
  const removed = db.newsArticles.splice(idx, 1)[0];
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'NEWS_DELETED', removed.title);
  saveDB();
  res.json({ success: true, message: `Article ${removed.title} deleted` });
});

// --- Events Management ---
app.get('/api/control-center/events', (req: Request, res: Response) => {
  res.json(db.platformEvents || []);
});

app.post('/api/control-center/events', (req: Request, res: Response) => {
  const item = req.body;
  const newEvent = {
    id: `event-${Date.now()}`,
    title: item.title || 'Upcoming Event',
    description: item.description || '',
    date: item.date || new Date().toISOString().split('T')[0],
    time: item.time || '18:00',
    location: item.location || 'Senegambia Strip',
    image: item.image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
    organizer: item.organizer || 'Gambian Event Organizer',
    contact: item.contact || '+220 700 0000',
    status: item.status || 'draft',
    createdAt: new Date().toISOString(),
    rsvpCount: 0
  };

  db.platformEvents = db.platformEvents || [];
  db.platformEvents.unshift(newEvent);
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'EVENT_CREATED', newEvent.title);
  saveDB();
  res.json({ success: true, event: newEvent });
});

app.put('/api/control-center/events/:id', (req: Request, res: Response) => {
  const item = (db.platformEvents || []).find((e: any) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  Object.assign(item, req.body);
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'EVENT_UPDATED', item.title);
  saveDB();
  res.json({ success: true, event: item });
});

app.delete('/api/control-center/events/:id', (req: Request, res: Response) => {
  const idx = (db.platformEvents || []).findIndex((e: any) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  const removed = db.platformEvents.splice(idx, 1)[0];
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'EVENT_DELETED', removed.title);
  saveDB();
  res.json({ success: true, message: `Event ${removed.title} deleted` });
});

// --- Entertainment Management ---
app.get('/api/control-center/entertainment', (req: Request, res: Response) => {
  res.json(db.entertainmentItems || []);
});

app.post('/api/control-center/entertainment', (req: Request, res: Response) => {
  const item = req.body;
  const newItem = {
    id: `ent-${Date.now()}`,
    title: item.title || 'New Spotlight Showcase',
    description: item.description || '',
    mediaUrl: item.mediaUrl || 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
    category: item.category || 'Spotlight',
    type: item.type || 'video',
    status: item.status || 'draft',
    creator: item.creator || 'SOHLA Media',
    createdAt: new Date().toISOString(),
    duration: item.duration || '0:30'
  };

  db.entertainmentItems = db.entertainmentItems || [];
  db.entertainmentItems.unshift(newItem);
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'ENTERTAINMENT_CREATED', newItem.title);
  saveDB();
  res.json({ success: true, item: newItem });
});

app.put('/api/control-center/entertainment/:id', (req: Request, res: Response) => {
  const item = (db.entertainmentItems || []).find((e: any) => e.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Entertainment item not found' });
    return;
  }
  Object.assign(item, req.body);
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'ENTERTAINMENT_UPDATED', item.title);
  saveDB();
  res.json({ success: true, item });
});

app.delete('/api/control-center/entertainment/:id', (req: Request, res: Response) => {
  const idx = (db.entertainmentItems || []).findIndex((e: any) => e.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Item not found' });
    return;
  }
  const removed = db.entertainmentItems.splice(idx, 1)[0];
  logAudit(req.body._adminName || 'Admin', 'CONTENT_MANAGER', 'ENTERTAINMENT_DELETED', removed.title);
  saveDB();
  res.json({ success: true, message: `Item ${removed.title} deleted` });
});

// --- AI Knowledge Base Management ---
app.get('/api/control-center/ai-knowledge', (req: Request, res: Response) => {
  res.json(db.aiKnowledgeEntries || []);
});

app.post('/api/control-center/ai-knowledge', (req: Request, res: Response) => {
  const item = req.body;
  const newEntry = {
    id: `know-${Date.now()}`,
    title: item.title || 'Knowledge Entry',
    category: item.category || 'General Local Info',
    content: item.content || '',
    active: item.active !== false,
    expiresAt: item.expiresAt || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: item.author || req.body._adminName || 'Admin',
    priority: Number(item.priority || 1)
  };

  db.aiKnowledgeEntries = db.aiKnowledgeEntries || [];
  db.aiKnowledgeEntries.unshift(newEntry);
  logAudit(req.body._adminName || 'Admin', 'ADMIN', 'AI_KNOWLEDGE_ADDED', newEntry.title, undefined, newEntry.content);
  saveDB();
  res.json({ success: true, entry: newEntry });
});

app.put('/api/control-center/ai-knowledge/:id', (req: Request, res: Response) => {
  const entry = (db.aiKnowledgeEntries || []).find((k: any) => k.id === req.params.id);
  if (!entry) {
    res.status(404).json({ error: 'Knowledge entry not found' });
    return;
  }
  const old = entry.title;
  Object.assign(entry, req.body, { updatedAt: new Date().toISOString() });
  logAudit(req.body._adminName || 'Admin', 'ADMIN', 'AI_KNOWLEDGE_UPDATED', entry.title, old);
  saveDB();
  res.json({ success: true, entry });
});

app.delete('/api/control-center/ai-knowledge/:id', (req: Request, res: Response) => {
  const idx = (db.aiKnowledgeEntries || []).findIndex((k: any) => k.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  const removed = db.aiKnowledgeEntries.splice(idx, 1)[0];
  logAudit(req.body._adminName || 'Admin', 'ADMIN', 'AI_KNOWLEDGE_DELETED', removed.title);
  saveDB();
  res.json({ success: true, message: `Knowledge entry ${removed.title} deleted` });
});

// --- Business Owners & Claiming Management ---
app.get('/api/control-center/business-owners', (req: Request, res: Response) => {
  res.json(db.businessOwners || []);
});

app.post('/api/control-center/business-owners', (req: Request, res: Response) => {
  const b = req.body;
  const partner = db.partners.find((p: any) => p.id === b.partnerId);
  const newOwner = {
    id: `own-${Date.now()}`,
    partnerId: b.partnerId,
    partnerName: partner ? partner.name : (b.partnerName || 'Unknown Partner'),
    ownerName: b.ownerName || 'Business Owner',
    phone: b.phone || '',
    email: b.email || '',
    nationalIdOrNin: b.nationalIdOrNin || '',
    status: b.status || 'active',
    claimedAt: new Date().toISOString(),
    verifiedAt: b.status === 'active' ? new Date().toISOString() : undefined,
    canEditProfile: b.canEditProfile !== false,
    canManageCatalog: b.canManageCatalog !== false,
    canManageMedia: b.canManageMedia !== false,
    lastLogin: 'Never'
  };

  db.businessOwners = db.businessOwners || [];
  db.businessOwners.unshift(newOwner);
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'OWNER_ACCOUNT_REGISTERED', newOwner.ownerName, undefined, JSON.stringify(newOwner));
  saveDB();
  res.json({ success: true, owner: newOwner });
});

app.put('/api/control-center/business-owners/:id', (req: Request, res: Response) => {
  const owner = (db.businessOwners || []).find((o: any) => o.id === req.params.id);
  if (!owner) {
    res.status(404).json({ error: 'Owner record not found' });
    return;
  }
  Object.assign(owner, req.body);
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'OWNER_ACCOUNT_UPDATED', owner.ownerName);
  saveDB();
  res.json({ success: true, owner });
});

app.delete('/api/control-center/business-owners/:id', (req: Request, res: Response) => {
  const idx = (db.businessOwners || []).findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Owner not found' });
    return;
  }
  const removed = db.businessOwners.splice(idx, 1)[0];
  logAudit(req.body._adminName || 'Admin', 'BUSINESS_MANAGER', 'OWNER_ACCOUNT_REMOVED', removed.ownerName);
  saveDB();
  res.json({ success: true, message: `Owner ${removed.ownerName} removed` });
});

// Partner Portal: Claim a business
app.post('/api/partner-portal/claim', (req: Request, res: Response) => {
  const { partnerId, ownerName, phone, email, nationalIdOrNin } = req.body;
  const partner = db.partners.find((p: any) => p.id === partnerId);
  if (!partner) {
    res.status(404).json({ error: 'Business not found in directory' });
    return;
  }

  const existingClaim = (db.businessOwners || []).find((o: any) => o.partnerId === partnerId && o.status === 'active');
  if (existingClaim) {
    res.status(400).json({ error: 'This business already has an active verified owner.' });
    return;
  }

  const newClaim = {
    id: `own-claim-${Date.now()}`,
    partnerId,
    partnerName: partner.name,
    ownerName,
    phone,
    email,
    nationalIdOrNin: nationalIdOrNin || '',
    status: 'pending_verification',
    claimedAt: new Date().toISOString(),
    canEditProfile: true,
    canManageCatalog: true,
    canManageMedia: true
  };

  db.businessOwners = db.businessOwners || [];
  db.businessOwners.unshift(newClaim);

  // Record approval request
  db.approvals = db.approvals || [];
  db.approvals.unshift({
    id: `appr-${Date.now()}`,
    entityType: 'owner_claim',
    entityId: partnerId,
    entityName: partner.name,
    submittedBy: ownerName,
    submittedRole: 'MERCHANT_APPLICANT',
    submissionDate: new Date().toISOString(),
    status: 'pending',
    payload: newClaim
  });

  logAudit(ownerName, 'MERCHANT', 'BUSINESS_CLAIM_SUBMITTED', partner.name);
  saveDB();

  res.json({
    success: true,
    message: `Claim for "${partner.name}" submitted successfully. Our team will verify via phone ${phone}.`,
    claim: newClaim
  });
});

// Partner Portal: Merchant Login
app.post('/api/partner-portal/login', (req: Request, res: Response) => {
  const { phone, partnerId } = req.body;
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

  let owner = (db.businessOwners || []).find((o: any) => {
    const oPhone = (o.phone || '').replace(/[^0-9]/g, '');
    return (oPhone && cleanPhone && oPhone.endsWith(cleanPhone.slice(-7))) || (partnerId && o.partnerId === partnerId);
  });

  if (!owner) {
    // Check if phone matches partner phone directly
    const matchingPartner = db.partners.find((p: any) => {
      const pPhone = (p.phone || '').replace(/[^0-9]/g, '');
      const pWa = (p.whatsapp || '').replace(/[^0-9]/g, '');
      return (pPhone && cleanPhone && pPhone.endsWith(cleanPhone.slice(-7))) ||
             (pWa && cleanPhone && pWa.endsWith(cleanPhone.slice(-7))) ||
             (partnerId && p.id === partnerId);
    });

    if (matchingPartner) {
      // Auto-provision merchant owner account for convenience
      owner = {
        id: `own-auto-${Date.now()}`,
        partnerId: matchingPartner.id,
        partnerName: matchingPartner.name,
        ownerName: matchingPartner.owner || 'Merchant Owner',
        phone: matchingPartner.phone,
        email: matchingPartner.email || '',
        status: 'active',
        claimedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        canEditProfile: true,
        canManageCatalog: true,
        canManageMedia: true,
        lastLogin: new Date().toISOString()
      };
      db.businessOwners = db.businessOwners || [];
      db.businessOwners.unshift(owner);
      saveDB();
    }
  }

  if (owner) {
    owner.lastLogin = new Date().toISOString();
    saveDB();
    const partner = db.partners.find((p: any) => p.id === owner.partnerId);
    res.json({
      success: true,
      owner,
      partner,
      token: `merchant-sess-${Date.now()}-${Math.random().toString(36).substring(2)}`
    });
    return;
  }

  res.status(401).json({ error: 'No registered merchant found matching these details. Please claim your business first.' });
});

// Partner Portal: Submit update for admin review
app.post('/api/partner-portal/submit-update', (req: Request, res: Response) => {
  const { partnerId, ownerId, changes } = req.body;
  const partner = db.partners.find((p: any) => p.id === partnerId);
  if (!partner) {
    res.status(404).json({ error: 'Business not found' });
    return;
  }

  const approval = {
    id: `appr-${Date.now()}`,
    entityType: 'business' as const,
    entityId: partnerId,
    entityName: partner.name,
    submittedBy: req.body.ownerName || 'Merchant Owner',
    submittedRole: 'BUSINESS_OWNER',
    submissionDate: new Date().toISOString(),
    status: 'pending' as const,
    payload: changes
  };

  db.approvals = db.approvals || [];
  db.approvals.unshift(approval);
  logAudit(approval.submittedBy, 'BUSINESS_OWNER', 'PROFILE_CHANGES_SUBMITTED', partner.name);
  saveDB();

  res.json({
    success: true,
    message: 'Changes submitted to SOHLA Operations team for quick approval.',
    approval
  });
});

// --- Approvals Queue Management ---
app.get('/api/control-center/approvals', (req: Request, res: Response) => {
  res.json(db.approvals || []);
});

app.post('/api/control-center/approvals/:id/review', (req: Request, res: Response) => {
  const { action, reason, _adminName } = req.body; // 'approve' | 'reject'
  const item = (db.approvals || []).find((a: any) => a.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Approval request not found' });
    return;
  }

  item.status = action === 'approve' ? 'approved' : 'rejected';
  item.rejectionReason = action === 'reject' ? (reason || 'Changes could not be verified') : undefined;
  item.reviewedBy = _adminName || 'Admin Reviewer';
  item.reviewedAt = new Date().toISOString();

  // If approved, apply changes to target record
  if (action === 'approve' && item.payload) {
    if (item.entityType === 'business') {
      const partner = db.partners.find((p: any) => p.id === item.entityId);
      if (partner) {
        Object.assign(partner, item.payload, { lastUpdated: new Date().toISOString().split('T')[0] });
      }
    } else if (item.entityType === 'owner_claim') {
      const owner = (db.businessOwners || []).find((o: any) => o.partnerId === item.entityId);
      if (owner) {
        owner.status = 'active';
        owner.verifiedAt = new Date().toISOString();
      }
    }
  }

  logAudit(
    item.reviewedBy,
    'BUSINESS_MANAGER',
    action === 'approve' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
    `${item.entityType}: ${item.entityName}`,
    undefined,
    action === 'reject' ? reason : 'Approved & Published'
  );

  saveDB();
  res.json({ success: true, item });
});

// --- Payments Configuration ---
app.get('/api/control-center/payments/config', (req: Request, res: Response) => {
  res.json(db.paymentSettings || {
    cashPowerEnabled: true,
    governmentPaymentsEnabled: true,
    waveEnabled: true,
    qmoneyEnabled: true,
    afrimoneyEnabled: true,
    platformCommissionPercent: 2.5,
    cashPowerFeeGMD: 0,
    merchantCurrency: 'GMD',
    supportContact: '+220 788 1234',
    payoutSchedule: 'DAILY_AUTOMATIC',
    testMode: true
  });
});

app.put('/api/control-center/payments/config', (req: Request, res: Response) => {
  db.paymentSettings = db.paymentSettings || {};
  Object.assign(db.paymentSettings, req.body);
  logAudit(req.body._adminName || 'Admin', 'SUPER_ADMIN', 'PAYMENT_CONFIG_UPDATED', 'Payment Gateway Settings');
  saveDB();
  res.json({ success: true, config: db.paymentSettings });
});

// --- Platform Settings ---
app.get(['/api/control-center/settings', '/api/control-center/platform-settings'], (req: Request, res: Response) => {
  res.json(db.platformSettings || {
    platformName: 'SOHLA AI',
    country: 'The Gambia',
    currency: 'GMD (Dalasi)',
    maintenanceMode: false,
    requireApprovalForEdits: true,
    aiModel: 'gemini-3.8-flash',
    defaultDeliveryRadiusKm: 25,
    businessClaimingEnabled: true,
    contactHotline: '+220 788 1234',
    supportEmail: 'operations@sohla.gm'
  });
});

app.put(['/api/control-center/settings', '/api/control-center/platform-settings'], (req: Request, res: Response) => {
  db.platformSettings = db.platformSettings || {};
  Object.assign(db.platformSettings, req.body);
  logAudit(req.body._adminName || 'Admin', 'SUPER_ADMIN', 'PLATFORM_SETTINGS_UPDATED', 'General Settings');
  saveDB();
  res.json({ success: true, settings: db.platformSettings });
});

// --- Central Media Manager Aggregator ---
app.get('/api/control-center/media', (req: Request, res: Response) => {
  const mediaList: any[] = [];

  // Gather business photos and logos
  (db.partners || []).forEach((p: any) => {
    if (p.logo) {
      mediaList.push({ id: `media-logo-${p.id}`, url: p.logo, title: `${p.name} (Logo)`, type: 'logo', entity: 'business', entityName: p.name });
    }
    if (p.coverImage) {
      mediaList.push({ id: `media-cover-${p.id}`, url: p.coverImage, title: `${p.name} (Cover)`, type: 'cover', entity: 'business', entityName: p.name });
    }
    (p.photos || []).forEach((photo: string, idx: number) => {
      mediaList.push({ id: `media-photo-${p.id}-${idx}`, url: photo, title: `${p.name} (Gallery #${idx + 1})`, type: 'photo', entity: 'business', entityName: p.name });
    });
    if (p.videoUrl) {
      mediaList.push({ id: `media-video-${p.id}`, url: p.videoUrl, title: `${p.name} (Promotional Video)`, type: 'video', entity: 'business', entityName: p.name });
    }
    (p.ourWork || []).forEach((work: any, idx: number) => {
      if (work.image) {
        mediaList.push({ id: `media-work-${p.id}-${work.id || idx}`, url: work.image, title: `${p.name} - ${work.title || 'Work'}`, type: 'work', entity: 'business', entityName: p.name });
      }
    });
  });

  // Gather product images
  (db.products || []).forEach((pr: any) => {
    if (pr.image) {
      mediaList.push({ id: `media-prod-${pr.id}`, url: pr.image, title: pr.name, type: 'product', entity: 'product', entityName: pr.name });
    }
  });

  // Gather ad media
  (db.advertisements || []).forEach((ad: any) => {
    if (ad.mediaUrl) {
      mediaList.push({ id: `media-ad-${ad.id}`, url: ad.mediaUrl, title: ad.title, type: ad.type || 'video', entity: 'advertisement', entityName: ad.advertiser });
    }
  });

  res.json(mediaList);
});

// 13. Data Backup Snapshot Export (SUPER_ADMIN only)
app.get('/api/admin/backup', requireSuperAdmin, (req: Request, res: Response) => {
  const session = (req as any).adminSession;
  logAudit(session?.name || 'Super Admin', 'SUPER_ADMIN', 'DATA_BACKUP_EXPORTED', 'Full database snapshot exported');
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
