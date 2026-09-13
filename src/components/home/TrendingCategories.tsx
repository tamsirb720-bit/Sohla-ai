import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Car,
  Package,
  Sparkles,
  Wrench,
  Zap,
  Landmark,
  Briefcase,
  CreditCard,
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
  // Helper to map category icon names to Lucide icons
  const renderIcon = (iconName: string, color: string) => {
    const props = { className: 'w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.2]' };
    switch (iconName.toLowerCase()) {
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
        return <Wrench {...props} />;
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
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <div className="w-full px-4 pt-3 pb-8">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-3 px-1">
        <div>
          <div className="flex items-center space-x-1 text-xs font-bold text-amber-600 uppercase tracking-wider animate-badge-bounce">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Trending</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
            Popular on Sohla
          </h2>
        </div>

        <button
          id="btn-view-all-categories"
          onClick={onViewAll}
          className="text-xs sm:text-sm font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 cursor-pointer transition active:scale-95"
        >
          <span>VIEW ALL</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Grid of 10 Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {categories.map((cat, idx) => (
          <div
            key={cat.id || idx}
            id={`cat-card-${cat.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
            onClick={() => onSelectCategory(cat)}
            className="group relative aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 bg-slate-900 select-none border border-slate-200/60 hover:border-amber-400/40"
          >
            {/* Background Image */}
            <img
              src={cat.image}
              alt={cat.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
            />

            {/* Subtle Gradient Overlays for High Contrast Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 pointer-events-none" />

            {/* Circular Category Icon Badge */}
            <div
              className={`absolute top-2.5 left-2.5 sm:top-3 sm:left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm border border-white/20 transition-all duration-300 group-hover:scale-110 ${
                cat.key === 'UTILITIES' || cat.key === 'TRANSPORT' ? 'ring-2 ring-white/40 animate-pulse' : ''
              }`}
              style={{ backgroundColor: cat.color || '#9333ea' }}
            >
              {renderIcon(cat.icon, cat.color)}
            </div>

            {/* Card Content (Title and Subtitle Pills) */}
            <div className="absolute bottom-2.5 inset-x-2.5 sm:bottom-3 sm:inset-x-3 text-white">
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight drop-shadow-sm font-display leading-tight group-hover:text-amber-300 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-200 font-medium line-clamp-1 mt-0.5 drop-shadow">
                {cat.tagline}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* The Gambia Panoramic Footer Banner */}
      <div
        id="the-gambia-banner"
        onClick={() => onOpenAI('Tell me how SOHLA AI simplifies everyday life in The Gambia and what services you offer!')}
        className="mt-4 relative w-full h-28 sm:h-32 rounded-2xl overflow-hidden shadow-lg cursor-pointer group select-none border border-amber-500/30 hover:border-amber-400/60 transition-all duration-300"
      >
        {/* River Gambia / Sunset Coastline Image */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
          alt="The Gambia"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Cinematic Sunset Glow Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-purple-950/60 to-amber-950/70" />

        {/* Content */}
        <div className="absolute inset-0 px-4 sm:px-6 flex items-center justify-between">
          <div className="text-white">
            <span className="font-serif italic text-xl sm:text-2xl font-bold tracking-wide text-amber-200 drop-shadow">
              The Gambia
            </span>
            <p className="text-xs sm:text-sm text-slate-200 font-medium mt-0.5 drop-shadow flex items-center space-x-1.5">
              <span>Local Businesses</span>
              <span>•</span>
              <span>Real People</span>
              <span>•</span>
              <span>Better Together</span>
            </p>
          </div>

          <button
            id="btn-banner-sohla-ai"
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 hover:brightness-110 transition shadow-lg flex items-center space-x-1.5 active:scale-95 shrink-0 animate-gradient-shift"
          >
            <span>SOHLA AI</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
