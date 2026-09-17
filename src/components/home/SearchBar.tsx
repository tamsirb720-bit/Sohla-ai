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
        <div className="absolute left-4 text-[#8C7A6B] group-focus-within:text-amber-600 transition-colors pointer-events-none">
          <Search className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          id="main-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you looking for in The Gambia?"
          className="w-full h-13 pl-12 pr-14 rounded-2xl sm:rounded-full bg-[#FFFFFF] border border-[#E8DFD3] text-[#241A12] placeholder-[#9E8E80] text-sm sm:text-base font-medium shadow-sm hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition duration-300"
        />

        {/* Action Button: Warm African Gold / Amber Circle with Arrow */}
        <button
          id="btn-search-submit"
          type="submit"
          className="absolute right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-105 text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
          title="Search with SOHLA AI"
        >
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>

      {/* Subtle quick tags with warm African marketplace styling */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-2 px-1 text-[11px] text-[#6E5B4B] no-scrollbar">
        <span className="flex items-center text-amber-700 font-bold shrink-0">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
          Suggestions:
        </span>
        {['Fish Benachin', 'NAWEC Meter', 'Yellow Taxi', 'Samsung Galaxy', 'Hair Braiding', 'GRA Tax'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSearch(item)}
            className="px-2.5 py-1 rounded-full bg-[#F4EDE2] hover:bg-amber-100 hover:text-amber-900 text-[#4A3B2C] border border-[#E8DDCF] whitespace-nowrap font-medium transition cursor-pointer active:scale-95"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
