import React, { useState } from 'react';
import {
  X,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Truck,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Tag,
  Heart,
  Share2,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { BusinessPartner, CategoryInfo, ProductItem } from '../../types';
import { ShareModal, ShareDataPayload } from '../common/ShareModal';

interface PartnerDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryInfo | null;
  partners: BusinessPartner[];
  selectedPartner?: BusinessPartner | null;
  onSelectPartner?: (partner: BusinessPartner) => void;
  onOpenAI: (query: string) => void;
  favourites?: string[];
  onToggleFavourite?: (partnerId: string) => void;
}

export const PartnerDirectoryModal: React.FC<PartnerDirectoryModalProps> = ({
  isOpen,
  onClose,
  category,
  partners,
  selectedPartner: initialSelectedPartner = null,
  onSelectPartner,
  onOpenAI,
  favourites: externalFavourites,
  onToggleFavourite: externalOnToggleFavourite
}) => {
  const [activePartner, setActivePartner] = useState<BusinessPartner | null>(initialSelectedPartner);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<ShareDataPayload | null>(null);

  // Fallback internal favourites if not passed
  const [internalFavourites, setInternalFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sohla_favourites');
      return saved ? JSON.parse(saved) : ['bp-1', 'bp-2'];
    } catch {
      return ['bp-1', 'bp-2'];
    }
  });

  const favourites = externalFavourites || internalFavourites;
  const toggleFavourite = (id: string) => {
    if (externalOnToggleFavourite) {
      externalOnToggleFavourite(id);
    } else {
      setInternalFavourites(prev => {
        const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
        try {
          localStorage.setItem('sohla_favourites', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  if (!isOpen) return null;

  const formatPartnerShareMessage = (p: BusinessPartner) => {
    return `🇬🇲 *${p.name}* (${p.subcategory})\n\n📍 *Location:* ${p.location} • ${p.address}\n⭐ *Rating:* ${p.rating} ★ (${p.reviewCount} verified reviews)\n🕒 *Hours:* ${p.openingHours}\n📞 *Phone:* ${p.phone}\n💬 *WhatsApp:* ${p.whatsapp}\n🚚 *Delivery:* ${p.deliveryAvailable ? `D${p.deliveryFee} (${p.estimatedDeliveryTime})` : 'Dine-in / Pickup'}\n\nDiscovered on *SOHLA AI* — The Gambia's All-in-One Platform`;
  };

  const sharePartnerWhatsApp = (p: BusinessPartner) => {
    const text = formatPartnerShareMessage(p);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openPartnerMultiShare = (p: BusinessPartner) => {
    setSharePayload({
      title: `${p.name} — ${p.location}`,
      subtitle: `${p.subcategory} • Rating: ${p.rating} ★`,
      text: formatPartnerShareMessage(p)
    });
    setIsShareModalOpen(true);
  };

  if (!isOpen) return null;

  // Filter partners
  const filtered = partners.filter((p) => {
    if (category && category.key !== 'ALL' && p.category !== category.key) {
      return false;
    }
    if (selectedLocation !== 'ALL' && !p.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchProd = p.products?.some(pr => pr.name.toLowerCase().includes(q));
      return matchName || matchDesc || matchProd;
    }
    return true;
  });

  const locations = ['ALL', 'Senegambia', 'Kairaba Avenue', 'Brusubi', 'Banjul', 'Serekunda', 'Fajara'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div
        id="partner-directory-modal"
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {category && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ backgroundColor: category.color || '#9333ea' }}
              >
                <span className="text-white text-lg font-bold">{category.name[0]}</span>
              </div>
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white">
                {activePartner ? activePartner.name : category ? category.name : 'Verified Gambian Partners'}
              </h2>
              <p className="text-xs text-slate-300">
                {activePartner ? activePartner.subcategory : 'Verified local businesses & official services'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-partner-modal"
            onClick={() => {
              if (activePartner) {
                setActivePartner(null);
              } else {
                onClose();
              }
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area: Either Partner List OR Single Partner Detail View */}
        {activePartner ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Cover & Header */}
            <div className="relative h-44 rounded-2xl overflow-hidden shadow-md">
              <img
                src={activePartner.coverImage}
                alt={activePartner.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-widest">
                    Verified Partner
                  </span>
                  <h3 className="text-lg sm:text-xl font-black font-display mt-1">{activePartner.name}</h3>
                  <p className="text-xs text-slate-200 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{activePartner.location} • {activePartner.address}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-amber-400 text-sm font-bold">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{activePartner.rating}</span>
                  </div>
                  <span className="text-[10px] text-slate-300">({activePartner.reviewCount} verified reviews)</span>
                </div>
              </div>
            </div>

            {/* Quick Action Contacts Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <a
                href={`https://wa.me/${activePartner.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(activePartner.name)},%20I%20found%20you%20on%20SOHLA!`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order</span>
              </a>

              <a
                href={`tel:${activePartner.phone.replace(/[^0-9+]/g, '')}`}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-slate-300" />
                <span>Call ({activePartner.phone})</span>
              </a>

              <button
                onClick={() => onOpenAI(`Tell me about ${activePartner.name} and what they sell`)}
                className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-purple-200 transition cursor-pointer"
              >
                <span>Ask SOHLA AI</span>
              </button>
            </div>

            {/* Save & Multi-Platform Share Action Strip */}
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                id="btn-partner-save-favourite"
                onClick={() => toggleFavourite(activePartner.id)}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm ${
                  favourites.includes(activePartner.id)
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${favourites.includes(activePartner.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`}
                />
                <span>{favourites.includes(activePartner.id) ? 'Saved to Favourites' : 'Save to Favourites'}</span>
              </button>

              <button
                id="btn-partner-share-wa"
                onClick={() => sharePartnerWhatsApp(activePartner)}
                className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Share WhatsApp</span>
              </button>

              <button
                id="btn-partner-share-multi"
                onClick={() => openPartnerMultiShare(activePartner)}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Other Platforms</span>
              </button>
            </div>

            {/* Overview & Metadata */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs sm:text-sm">
              <p className="text-slate-700 leading-relaxed font-medium">
                {activePartner.description}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-slate-600">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Hours: <strong>{activePartner.openingHours}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <span>Delivery: <strong>{activePartner.deliveryAvailable ? `D${activePartner.deliveryFee} (${activePartner.estimatedDeliveryTime})` : 'Dine-in / Pickup'}</strong></span>
                </div>
              </div>
            </div>

            {/* Products / Offerings List */}
            {activePartner.products && activePartner.products.length > 0 && (
              <div>
                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mb-3 flex items-center space-x-1.5">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span>Verified Products & Menu (Prices in Gambian Dalasi)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activePartner.products.map((prod: ProductItem) => (
                    <div
                      key={prod.id}
                      className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition"
                    >
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{prod.name}</h5>
                          <span className="text-xs sm:text-sm font-extrabold text-purple-700 whitespace-nowrap ml-2">
                            D{prod.price}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{prod.description}</p>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-emerald-600 font-semibold">● In Stock ({prod.stock})</span>
                          <a
                            href={`https://wa.me/${activePartner.whatsapp.replace(/[^0-9]/g, '')}?text=I%20would%20like%20to%20order%20${encodeURIComponent(prod.name)}%20(D${prod.price})%20from%20SOHLA!`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 font-bold hover:underline"
                          >
                            Order via WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => setActivePartner(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
            >
              ← Back to All Partners
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-4">
            {/* Search & Location Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter businesses or products..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Location Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      selectedLocation === loc
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Partners List */}
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                <MapPin className="w-10 h-10 text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-700">No verified businesses matched this filter.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  SOHLA never invents fake listings. Try clearing your search or asking SOHLA AI!
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('ALL');
                  }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePartner(p)}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm hover:shadow-md hover:border-purple-300 transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={p.logo || p.coverImage}
                        alt={p.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                            {p.location}
                          </span>
                          <span className="text-xs font-bold text-amber-500 flex items-center">
                            ★ {p.rating}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition truncate mt-0.5">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        {p.products?.length ? `${p.products.length} Products listed` : 'Services available'}
                      </span>
                      <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavourite(p.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                          title="Save to Favourites"
                        >
                          <Heart
                            className={`w-4 h-4 ${favourites.includes(p.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
                          />
                        </button>
                        <button
                          onClick={() => sharePartnerWhatsApp(p)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-purple-600 group-hover:underline pl-1">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-Platform Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={sharePayload}
      />
    </div>
  );
};
