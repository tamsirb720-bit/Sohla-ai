import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Car,
  Package,
  Sparkles,
  HeartHandshake,
  Zap,
  Landmark,
  Briefcase,
  CreditCard,
  Home,
  Hotel,
  Building2,
  ArrowRight,
  Flame
} from 'lucide-react';
import { CategoryInfo } from '../../types';

interface TrendingCategoriesProps {
  categories: CategoryInfo[];
  onSelectCategory: (category: CategoryInfo) => void;
  onOpenAI: (prompt?: string) => void;
  onViewAll?: () => void;
}

export const TrendingCategories: React.FC<TrendingCategoriesProps> = ({
  categories,
  onSelectCategory,
  onOpenAI,
  onViewAll
}) => {
  const [showAllInPlace, setShowAllInPlace] = React.useState(false);

  // Helper to map category icon names to Lucide icons
  const renderIcon = (iconName: string, color: string) => {
    const props = { className: 'w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]' };
    switch (iconName?.toLowerCase()) {
      case 'shoppingbag':
      case 'shopping':
        return <ShoppingBag {...props} />;
      case 'utensils':
      case 'food':
        return <Utensils {...props} />;
      case 'car':
      case 'transport':
        return <Car {...props} />;
      case 'package':
      case 'delivery':
        return <Package {...props} />;
      case 'sparkles':
      case 'beauty':
        return <Sparkles {...props} />;
      case 'wrench':
      case 'services':
      case 'hearthandshake':
        return <HeartHandshake {...props} />;
      case 'zap':
      case 'nawec':
        return <Zap {...props} />;
      case 'landmark':
      case 'government':
        return <Landmark {...props} />;
      case 'briefcase':
      case 'jobs':
        return <Briefcase {...props} />;
      case 'creditcard':
      case 'payments':
        return <CreditCard {...props} />;
      case 'home':
      case 'housing':
      case 'property':
      case 'properties':
        return <Home {...props} />;
      case 'hotel':
      case 'hotels':
      case 'stays':
      case 'building2':
        return <Hotel {...props} />;
      default:
        return <Sparkles {...props} />;
    }
  };

  // Desired display priority matching reference layout
  const categoryPriorityOrder = [
    'BEAUTY & WELLNESS',
    'DELIVERY & ERRANDS',
    'SHOPPING',
    'FOOD & RESTAURANTS',
    'TRANSPORT',
    'SERVICES',
    'HOUSING & PROPERTIES',
    'HOTELS & STAYS',
    'BUY CASH POWER (NAWEC)',
    'GOVERNMENT PAYMENTS',
    'AI JOBS & INCOME',
    'PAYMENTS'
  ];

  // Specific curated Gambian images matching reference layout
  const curatedImages: Record<string, string> = {
    'BEAUTY & WELLNESS': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    'DELIVERY & ERRANDS': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
    'SHOPPING': 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=800&q=80',
    'FOOD & RESTAURANTS': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    'TRANSPORT': 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
    'SERVICES': 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
    'HOUSING & PROPERTIES': 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    'HOTELS & STAYS': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  };

  const curatedSubtitles: Record<string, string> = {
    'BEAUTY & WELLNESS': 'Salons • Barbers • Spas • Healthcare & Nursing',
    'DELIVERY & ERRANDS': 'Couriers • Errands • Dispatch',
    'SHOPPING': 'Fashion • Electronics • More',
    'FOOD & RESTAURANTS': 'Dine • Takeaway • Home Delivery',
    'TRANSPORT': 'Taxis • Car Rentals • More',
    'SERVICES': 'Home • Repairs • Trades',
    'HOUSING & PROPERTIES': 'Rentals • Sales • Management',
    'HOTELS & STAYS': 'Resorts • Hotels • Villas',
  };

  const curatedColors: Record<string, string> = {
    'BEAUTY & WELLNESS': '#e11d48',
    'DELIVERY & ERRANDS': '#0284c7',
    'SHOPPING': '#9333ea',
    'FOOD & RESTAURANTS': '#ea580c',
    'TRANSPORT': '#2563eb',
    'SERVICES': '#059669',
    'HOUSING & PROPERTIES': '#0d9488',
    'HOTELS & STAYS': '#db2777',
  };

  const FALLBACK_CATEGORIES: CategoryInfo[] = [
    {
      id: 'cat-beauty',
      key: 'BEAUTY & WELLNESS',
      name: 'Beauty & Wellness',
      tagline: 'Book salon appointments, master barbers, traditional Gambian henna, royal braids, wellness massages, and verified home healthcare & nursing',
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
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
      icon: 'Sparkles',
      color: '#e11d48',
      displayOrder: 1,
      active: true,
      featured: true,
      aiKeywords: ['beauty', 'wellness', 'barbers', 'salons', 'braiding', 'spas', 'massage', 'nails', 'makeup', 'henna', 'nurse', 'nursing', 'healthcare', 'caregiver', 'elderly care', 'wound care', 'home nurse', 'registered nurse']
    },
    {
      id: 'cat-delivery',
      key: 'DELIVERY & ERRANDS',
      name: 'Delivery & Errands',
      tagline: 'Fast motorbike couriers for documents, restaurant meals, market errands, and package deliveries',
      subcategories: [
        'Express Courier',
        'Food Delivery',
        'Market Errands',
        'Document Dispatch',
        'Package Delivery',
        'Fragile Handling',
        'Same-Day Delivery'
      ],
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      icon: 'Package',
      color: '#0284c7',
      displayOrder: 2,
      active: true,
      featured: true,
      aiKeywords: ['delivery', 'errands', 'courier', 'dispatch', 'food delivery', 'market errands', 'package']
    },
    {
      id: 'cat-1',
      key: 'SHOPPING',
      name: 'Shopping',
      tagline: 'Fashion • Electronics • More',
      subcategories: ['Fashion & African Attire', 'Electronics & Phones', 'Supermarkets'],
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      icon: 'ShoppingBag',
      color: '#9333ea',
      displayOrder: 3,
      active: true,
      featured: true,
      aiKeywords: ['clothes', 'shopping']
    },
    {
      id: 'cat-2',
      key: 'FOOD & RESTAURANTS',
      name: 'Food & Restaurants',
      tagline: 'Dine • Takeaway • Home Delivery',
      subcategories: ['Gambian Local Cuisine', 'Seafood & Grills', 'Shawarma & Fast Food'],
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
      icon: 'Utensils',
      color: '#ea580c',
      displayOrder: 4,
      active: true,
      featured: true,
      aiKeywords: ['food', 'restaurant', 'benachin']
    },
    {
      id: 'cat-3',
      key: 'TRANSPORT',
      name: 'Transport',
      tagline: 'Taxis • Car Rentals • More',
      subcategories: ['Town Trip Taxis', 'Airport Transfers', 'Car Hire'],
      image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80',
      icon: 'Car',
      color: '#2563eb',
      displayOrder: 5,
      active: true,
      featured: true,
      aiKeywords: ['taxi', 'car', 'transport']
    },
    {
      id: 'cat-6',
      key: 'SERVICES',
      name: 'Services',
      tagline: 'Home • Repairs • Trades',
      subcategories: ['AC & Electricians', 'Plumbing & Repairs', 'Home Cleaning'],
      image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
      icon: 'Wrench',
      color: '#059669',
      displayOrder: 6,
      active: true,
      featured: true,
      aiKeywords: ['services', 'repairs']
    },
    {
      id: 'cat-housing',
      key: 'HOUSING & PROPERTIES',
      name: 'Housing & Properties',
      tagline: 'Rentals • Sales • Management',
      subcategories: ['Residential Rentals', 'Furnished Apartments', 'Villas & Land'],
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      icon: 'Home',
      color: '#0d9488',
      displayOrder: 7,
      active: true,
      featured: true,
      aiKeywords: ['housing', 'property', 'rent']
    },
    {
      id: 'cat-hotels',
      key: 'HOTELS & STAYS',
      name: 'Hotels & Stays',
      tagline: 'Resorts • Hotels • Villas',
      subcategories: ['Beach Resorts', 'Hotels', 'Boutique Stays'],
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      icon: 'Hotel',
      color: '#db2777',
      displayOrder: 8,
      active: true,
      featured: true,
      aiKeywords: ['hotel', 'resort', 'stay']
    }
  ];

  // Active categories from server
  const activeCategories = (categories && categories.length > 0)
    ? categories.filter(c => c.active !== false)
    : [];

  const mergedCategories = [...activeCategories];

  // Only append fallback categories if not already defined in backend (whether active or disabled)
  FALLBACK_CATEGORIES.forEach((fb) => {
    const definedInBackend = (categories || []).some(
      (c) => (c.key?.toUpperCase() === fb.key || c.name?.toUpperCase() === fb.name?.toUpperCase())
    );
    if (!definedInBackend) {
      mergedCategories.push(fb);
    }
  });

  const sortedCategories = [...mergedCategories].sort((a, b) => {
    const keyA = (a.key || a.name || '').toUpperCase();
    const keyB = (b.key || b.name || '').toUpperCase();
    const idxA = categoryPriorityOrder.indexOf(keyA) !== -1 ? categoryPriorityOrder.indexOf(keyA) : categoryPriorityOrder.indexOf(a.name.toUpperCase());
    const idxB = categoryPriorityOrder.indexOf(keyB) !== -1 ? categoryPriorityOrder.indexOf(keyB) : categoryPriorityOrder.indexOf(b.name.toUpperCase());
    const orderA = idxA !== -1 ? idxA : 999;
    const orderB = idxB !== -1 ? idxB : 999;
    return orderA - orderB;
  });

  // Display top 8 primary categories by default so Beauty & Wellness and Delivery & Errands are immediately visible
  const displayedCategories = showAllInPlace ? sortedCategories : sortedCategories.slice(0, 8);

  const handleToggleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      setShowAllInPlace(!showAllInPlace);
    }
  };

  return (
    <div className="w-full px-3.5 pt-2 pb-6">
      {/* Section Header matching reference */}
      <div className="flex items-end justify-between mb-3 px-0.5">
        <div>
          <div className="flex items-center space-x-1.5 text-xs font-black text-orange-600 uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
            <span>Trending in Greater Banjul</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#140D07] tracking-tight font-display">
            Popular on SOHLA
          </h2>
        </div>

        <button
          id="btn-view-all-categories"
          onClick={handleToggleViewAll}
          className="text-xs sm:text-sm font-black text-orange-600 hover:text-orange-700 flex items-center space-x-1 cursor-pointer transition active:scale-95"
        >
          <span>{showAllInPlace ? 'SHOW LESS' : 'VIEW ALL'}</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Grid of 6 Category Cards matching reference */}
      <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
        {displayedCategories.map((cat, idx) => {
          const categoryNameKey = cat.name.toUpperCase();
          const cardImg = curatedImages[categoryNameKey] || cat.image;
          const badgeColor = curatedColors[categoryNameKey] || cat.color || '#9333ea';
          const cardSubtitle = curatedSubtitles[categoryNameKey] || cat.tagline;

          return (
            <div
              key={cat.id || idx}
              id={`cat-card-${cat.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              onClick={() => onSelectCategory(cat)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 bg-[#1A120B] select-none border border-[#EBE3D7]/90 hover:border-amber-400"
            >
              {/* Background Image */}
              <img
                src={cardImg}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 opacity-90"
              />

              {/* Warm African Vignette Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#140C06]/95 via-[#140C06]/35 to-transparent pointer-events-none" />

              {/* Category Icon Badge */}
              <div
                className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-8 h-8 rounded-xl flex items-center justify-center shadow-md border border-white/25 transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: badgeColor }}
              >
                {renderIcon(cat.icon, badgeColor)}
              </div>

              {/* Card Content (Title and Subtitle) matching reference */}
              <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 text-white">
                <h3 className="text-sm sm:text-base font-extrabold tracking-tight drop-shadow-sm font-display leading-tight group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-[#EAE0D5] font-medium line-clamp-1 mt-0.5 drop-shadow">
                  {cardSubtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
