import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Film,
  Building2,
  Package,
  Search,
  Filter
} from 'lucide-react';

interface MediaItem {
  id: string;
  url: string;
  title: string;
  type: string;
  entity: string;
  entityName: string;
}

export const MediaModule: React.FC = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/control-center/media')
      .then(res => res.json())
      .then(data => setMedia(Array.isArray(data) ? data : []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredMedia = media.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-amber-600" />
          Central Media Assets Gallery
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Unified repository of merchant logos, covers, menu items, and video billboard creative assets
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search media by title or partner name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Media Types ({media.length})</option>
          <option value="logo">Logos</option>
          <option value="cover">Cover Banners</option>
          <option value="photo">Merchant Gallery</option>
          <option value="product">Product Photos</option>
          <option value="video">Billboard Videos</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredMedia.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-[#EADBCA] p-12 text-center text-stone-400 text-xs">
            No media assets found matching current criteria.
          </div>
        ) : (
          filteredMedia.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#EADBCA] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="relative aspect-square bg-stone-100 overflow-hidden">
                {item.type === 'video' || item.url.includes('.mp4') ? (
                  <div className="w-full h-full bg-stone-900 flex items-center justify-center text-amber-400">
                    <Film className="w-8 h-8" />
                  </div>
                ) : (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80';
                    }}
                  />
                )}
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-stone-950/70 text-white backdrop-blur-xs">
                  {item.type}
                </span>
              </div>

              <div className="p-3 text-xs">
                <div className="font-bold text-stone-900 truncate" title={item.title}>
                  {item.title}
                </div>
                <div className="text-[10px] text-stone-500 truncate mt-0.5">
                  {item.entityName}
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    onClick={() => handleCopyUrl(item.id, item.url)}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-400 hover:text-stone-700"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
