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
    <div className="w-full px-4 pt-3 pb-1">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full group">
        {/* Search Icon */}
        <div className="absolute left-4 text-slate-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
          <Search className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          id="main-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for in The Gambia?"
          className="w-full h-13 pl-12 pr-14 rounded-full bg-white border border-slate-200/90 text-slate-800 placeholder-slate-400 text-sm sm:text-base font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition duration-300"
        />

        {/* Action Button: Vibrant Orange Circle with Arrow */}
        <button
          id="btn-search-submit"
          type="submit"
          className="absolute right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:brightness-110 text-white flex items-center justify-center shadow-md active:scale-90 transition cursor-pointer animate-gradient-shift"
          title="Search with SOHLA AI"
        >
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>

      {/* Subtle quick tags */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-2 px-1 text-[11px] text-slate-500 no-scrollbar">
        <span className="flex items-center text-amber-600 font-semibold shrink-0">
          <Sparkles className="w-3 h-3 mr-1 animate-spin-slow text-amber-500" />
          Suggestions:
        </span>
        {['Fish Benachin', 'NAWEC Meter', 'Yellow Taxi', 'Samsung Galaxy', 'Hair Braiding', 'GRA Tax'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSearch(item)}
            className="px-2.5 py-0.5 rounded-full bg-slate-200/70 hover:bg-amber-100 hover:text-amber-900 text-slate-700 whitespace-nowrap transition cursor-pointer active:scale-95"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
