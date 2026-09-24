import React, { useState } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onOpenAI: (initialQuery?: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onOpenAI }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    } else {
      onOpenAI();
    }
  };

  return (
    <div className="w-full px-4 pt-2.5 pb-1">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full group">
        {/* Search Icon */}
        <div className="absolute left-4.5 text-stone-400 group-focus-within:text-amber-600 transition-colors pointer-events-none">
          <Search className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          id="main-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for in The Gambia?"
          className="w-full h-14 pl-12.5 pr-14 rounded-full bg-white border border-[#EAE2D5] text-[#1F1710] placeholder-[#8C7A6B] text-sm sm:text-base font-medium shadow-[0_3px_15px_rgba(0,0,0,0.03)] hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition duration-300"
        />

        {/* Action Button: Warm African Gold / Amber Circle with Arrow */}
        <button
          id="btn-search-submit"
          type="submit"
          className="absolute right-2 w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105 text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
          title="Search with SOHLA AI"
        >
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>

      {/* Quick suggestions matching reference design */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-2 px-0.5 text-[11px] no-scrollbar">
        <span className="flex items-center text-xs font-black text-orange-600 shrink-0">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-orange-500 fill-orange-500" />
          Suggestions:
        </span>
        {[
          { label: 'Fish Benachin', query: 'Fish Benachin' },
          { label: 'NAWEC Meter', query: 'NAWEC Meter' },
          { label: 'Yellow Taxi', query: 'Yellow Taxi' },
          { label: 'Sant...', query: 'Sanyang Beach' }
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onSearch(item.query)}
            className="px-3.5 py-1 rounded-full bg-[#EFE9DF] hover:bg-amber-100 hover:text-amber-900 text-[#3C3024] border border-[#E3DACB] whitespace-nowrap text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
