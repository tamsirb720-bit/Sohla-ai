import React, { useState, useEffect } from 'react';
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
  BookmarkCheck,
  Briefcase,
  MessageSquare,
  Send,
  Sparkles,
  Calendar,
  Check
} from 'lucide-react';
import { BusinessPartner, CategoryInfo, ProductItem, PartnerReview, OurWorkItem } from '../../types';
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
  onPartnerUpdated?: (updatedPartner: BusinessPartner) => void;
  onOpenPartnerPortal?: (partner: BusinessPartner) => void;
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
  onToggleFavourite: externalOnToggleFavourite,
  onPartnerUpdated,
  onOpenPartnerPortal
}) => {
  const [activePartner, setActivePartner] = useState<BusinessPartner | null>(initialSelectedPartner);
  const [detailTab, setDetailTab] = useState<'products' | 'work' | 'reviews'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<ShareDataPayload | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Review Submission State
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewService, setReviewService] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

  // Keep activePartner in sync if initialSelectedPartner changes
  useEffect(() => {
    if (initialSelectedPartner) {
      setActivePartner(initialSelectedPartner);
      setDetailTab('products');
    }
  }, [initialSelectedPartner]);

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

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner || !reviewerName.trim() || !reviewComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewSuccessMsg('');

    try {
      const res = await fetch(`/api/partners/${activePartner.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: reviewerName.trim(),
          rating: reviewRating,
          comment: reviewComment.trim(),
          serviceUsed: reviewService.trim() || activePartner.subcategory
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.partner) {
        setActivePartner(data.partner);
        if (onPartnerUpdated) {
          onPartnerUpdated(data.partner);
        }
        setReviewSuccessMsg('Your verified review has been posted! Thank you for supporting Gambian businesses.');
        setReviewerName('');
        setReviewComment('');
        setReviewService('');
        setReviewRating(5);
        setTimeout(() => {
          setIsReviewFormOpen(false);
          setReviewSuccessMsg('');
        }, 3000);
      } else {
        // Fallback local addition if network offline
        const localReview: PartnerReview = {
          id: `rev-${Date.now()}`,
          partnerId: activePartner.id,
          authorName: reviewerName.trim(),
          rating: reviewRating,
          date: new Date().toISOString().split('T')[0],
          comment: reviewComment.trim(),
          serviceUsed: reviewService.trim() || activePartner.subcategory,
          verifiedUser: true
        };
        const updatedReviews = [localReview, ...(activePartner.reviews || [])];
        const newCount = updatedReviews.length;
        const newRating = Number((updatedReviews.reduce((a, b) => a + b.rating, 0) / newCount).toFixed(1));
        const updatedPartner = {
          ...activePartner,
          reviews: updatedReviews,
          reviewCount: newCount,
          rating: newRating
        };
        setActivePartner(updatedPartner);
        if (onPartnerUpdated) onPartnerUpdated(updatedPartner);
        setReviewSuccessMsg('Review recorded locally! Thank you.');
        setTimeout(() => {
          setIsReviewFormOpen(false);
          setReviewSuccessMsg('');
        }, 3000);
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmittingReview(false);
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
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#FAF8F5] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#EADBCA] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header: Warm Obsidian / African Wood Tone */}
        <div className="px-5 py-4 bg-[#19110B] text-white flex items-center justify-between border-b border-[#2D2015]">
          <div className="flex items-center space-x-3">
            {category && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md border border-white/20"
                style={{ backgroundColor: category.color || '#9333ea' }}
              >
                <span className="text-white text-lg font-bold">{category.name[0]}</span>
              </div>
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white">
                {activePartner ? activePartner.name : category ? category.name : 'Verified Gambian Partners'}
              </h2>
              <p className="text-xs text-[#D8C7B5]">
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

        {/* Content Area: Either Partner Profile OR Directory List */}
        {activePartner ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* 1. HERO COVER & LOGO PROFILE BANNER */}
            <div className="space-y-0">
              <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden shadow-sm border border-[#EADBCA]">
                <img
                  src={activePartner.coverImage}
                  alt={activePartner.name}
                  className="w-full h-full object-cover"
                />
                {/* Warm African Vignette Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#140D07]/90 via-[#140D07]/35 to-transparent" />

                {/* Badges in Hero Top Right */}
                <div className="absolute top-3 right-3 flex items-center space-x-1.5">
                  {activePartner.featuredStatus && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-400 text-[#1A120B] uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                      <Sparkles className="w-3 h-3 fill-[#1A120B]" />
                      <span>Featured</span>
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Rating Badge in Hero Bottom Right */}
                <div className="absolute bottom-3 right-3 text-right">
                  <div className="flex items-center justify-end space-x-1 text-amber-400 text-sm font-bold bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <span>{activePartner.rating}</span>
                    <span className="text-[10px] text-slate-200">({activePartner.reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Business Identity Row with Overlapping Logo Badge */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between px-2 pt-2 gap-2">
                <div className="flex items-end space-x-3.5 -mt-10 relative z-10">
                  <img
                    src={activePartner.logo || activePartner.coverImage}
                    alt={`${activePartner.name} logo`}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white p-1 shadow-md border-2 border-amber-400/80 object-cover shrink-0"
                  />
                  <div className="pb-1">
                    <h3 className="text-xl sm:text-2xl font-black font-display text-[#1F160F] leading-tight flex items-center space-x-1.5">
                      <span>{activePartner.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                      <span className="px-2 py-0.5 rounded-md font-bold bg-amber-100/80 text-amber-900 text-[11px]">
                        {activePartner.subcategory}
                      </span>
                      <span className="text-[#7A6857] flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{activePartner.location}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. QUICK ACTION CONTACTS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <a
                href={`https://wa.me/${activePartner.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(activePartner.name)},%20I%20found%20you%20on%20SOHLA!`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-105 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Order</span>
              </a>

              <a
                href={`tel:${activePartner.phone.replace(/[^0-9+]/g, '')}`}
                className="py-2.5 px-3 rounded-xl bg-[#21160F] hover:bg-[#342418] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                <span>Call ({activePartner.phone})</span>
              </a>

              <button
                onClick={() => onOpenAI(`Tell me about ${activePartner.name} and what they sell`)}
                className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl bg-[#F0E6D8] text-[#4A3828] hover:bg-[#EADDC9] font-bold text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-[#DFCDB7] transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Ask SOHLA AI</span>
              </button>
            </div>

            {/* 3. SAVE & MULTI-PLATFORM SHARE ACTION STRIP */}
            <div className="p-3 rounded-2xl bg-white border border-[#EADBCA] shadow-xs flex flex-wrap items-center justify-between gap-2">
              <button
                id="btn-partner-save-favourite"
                onClick={() => toggleFavourite(activePartner.id)}
                className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer ${
                  favourites.includes(activePartner.id)
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-[#FAF7F2] text-[#4A3B2C] hover:bg-[#F2EAE0] border border-[#E8DFD3]'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${favourites.includes(activePartner.id) ? 'fill-rose-500 text-rose-500' : 'text-[#8C7A6B]'}`}
                />
                <span>{favourites.includes(activePartner.id) ? 'Saved to Favourites' : 'Save to Favourites'}</span>
              </button>

              <button
                id="btn-partner-share-wa"
                onClick={() => sharePartnerWhatsApp(activePartner)}
                className="flex-1 min-w-[120px] py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Share WhatsApp</span>
              </button>

              <button
                id="btn-partner-share-multi"
                onClick={() => openPartnerMultiShare(activePartner)}
                className="py-2 px-3 rounded-xl bg-[#21160F] hover:bg-[#38261A] text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>Other Platforms</span>
              </button>
            </div>

            {/* 4. OVERVIEW & METADATA CARD */}
            <div className="bg-white rounded-2xl p-4 border border-[#EADBCA] shadow-xs space-y-2.5 text-xs sm:text-sm">
              <p className="text-[#3E3024] leading-relaxed font-medium">
                {activePartner.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 border-t border-[#F0E6D8] text-[#5A4839]">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Hours: <strong className="text-[#21160F]">{activePartner.openingHours}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Delivery: <strong className="text-[#21160F]">{activePartner.deliveryAvailable ? `D${activePartner.deliveryFee} (${activePartner.estimatedDeliveryTime})` : 'Dine-in / Pickup'}</strong></span>
                </div>
                <div className="flex items-center space-x-2 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Address: <strong className="text-[#21160F]">{activePartner.address}, {activePartner.location}</strong></span>
                </div>
              </div>

              {onOpenPartnerPortal && (
                <div className="pt-2 border-t border-[#F0E6D8] flex items-center justify-between text-xs text-[#7A6857]">
                  <span>Are you the owner of {activePartner.name}?</span>
                  <button
                    onClick={() => onOpenPartnerPortal(activePartner)}
                    className="font-bold text-amber-700 hover:text-amber-800 underline decoration-amber-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Claim or Manage Profile</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. SECTION TABS SWITCHER: Products | Our Work & Gallery | Customer Reviews */}
            <div className="flex border-b border-[#EADBCA] gap-2 px-1">
              <button
                id="tab-partner-products"
                type="button"
                onClick={() => setDetailTab('products')}
                className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  detailTab === 'products'
                    ? 'border-amber-600 text-amber-900'
                    : 'border-transparent text-[#7A6857] hover:text-[#21160F]'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Products & Menu</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#EFE7DC] text-[#4A3B2C] font-bold">
                  {activePartner.products?.length || 0}
                </span>
              </button>

              <button
                id="tab-partner-our-work"
                type="button"
                onClick={() => setDetailTab('work')}
                className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  detailTab === 'work'
                    ? 'border-amber-600 text-amber-900'
                    : 'border-transparent text-[#7A6857] hover:text-[#21160F]'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Our Work & Gallery</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                  {(activePartner.ourWork?.length || 0) + (activePartner.photos?.length || 0)}
                </span>
              </button>

              <button
                id="tab-partner-reviews"
                type="button"
                onClick={() => setDetailTab('reviews')}
                className={`py-2 px-3.5 text-xs sm:text-sm font-extrabold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  detailTab === 'reviews'
                    ? 'border-amber-600 text-amber-900'
                    : 'border-transparent text-[#7A6857] hover:text-[#21160F]'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>Reviews</span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold">
                  {activePartner.reviews?.length || activePartner.reviewCount || 0}
                </span>
              </button>
            </div>

            {/* TAB 1: Products & Menu */}
            {detailTab === 'products' && (
              <div>
                {activePartner.products && activePartner.products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activePartner.products.map((prod: ProductItem) => (
                      <div
                        key={prod.id}
                        className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-[#EADBCA] shadow-xs hover:border-amber-400 transition"
                      >
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-16 h-16 rounded-xl object-cover bg-[#FAF7F2] border border-[#EADBCA] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs sm:text-sm font-bold text-[#1F160F] truncate">{prod.name}</h5>
                            <span className="text-xs sm:text-sm font-black text-amber-800 whitespace-nowrap ml-2">
                              D{prod.price}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6E5B4B] line-clamp-2 mt-0.5">{prod.description}</p>
                          <div className="flex items-center justify-between mt-1.5 text-[10px]">
                            <span className="text-emerald-700 font-bold">● In Stock ({prod.stock})</span>
                            <a
                              href={`https://wa.me/${activePartner.whatsapp.replace(/[^0-9]/g, '')}?text=I%20would%20like%20to%20order%20${encodeURIComponent(prod.name)}%20(D${prod.price})%20from%20SOHLA!`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-700 font-bold hover:underline"
                            >
                              Order via WhatsApp →
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-white rounded-2xl border border-[#EADBCA] text-[#7A6857] text-xs">
                    No individual catalog items listed yet. Contact {activePartner.name} directly via WhatsApp or Phone for customized pricing!
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Our Work & Showcase (Media Gallery) */}
            {detailTab === 'work' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#1F160F] flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                    <span>Real Projects & Craftsmanship by {activePartner.name}</span>
                  </h4>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {(activePartner.ourWork?.length || 0) + (activePartner.photos?.length || 0)} media items
                  </span>
                </div>

                {activePartner.ourWork && activePartner.ourWork.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {activePartner.ourWork.map((work: OurWorkItem) => (
                      <div
                        key={work.id}
                        className="bg-white rounded-2xl border border-[#EADBCA] overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
                      >
                        <div
                          className="relative h-44 overflow-hidden bg-[#FAF7F2] cursor-pointer"
                          onClick={() => setPreviewImage(work.image)}
                          title="Click to view full photo"
                        >
                          <img
                            src={work.image}
                            alt={work.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 text-white text-[11px] font-bold">
                            <span>Tap to enlarge</span>
                          </div>
                          {work.category && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1A120B]/85 text-white backdrop-blur-sm">
                              {work.category}
                            </span>
                          )}
                          {work.completedDate && (
                            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{work.completedDate}</span>
                            </span>
                          )}
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-[#1F160F] leading-snug">
                              {work.title}
                            </h5>
                            <p className="text-[11px] sm:text-xs text-[#5A4839] mt-1 leading-relaxed">
                              {work.description}
                            </p>
                          </div>

                          {work.tags && work.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-[#F0E6D8]">
                              {work.tags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded-md bg-[#F4EDE2] text-[#4A3B2C] text-[10px] font-medium"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Additional Photos Gallery */}
                {activePartner.photos && activePartner.photos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
                      Business Photo Gallery ({activePartner.photos.length})
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {activePartner.photos.map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() => setPreviewImage(photo)}
                          className="rounded-xl overflow-hidden border border-[#EADBCA] h-32 bg-[#FAF7F2] cursor-pointer group relative"
                        >
                          <img
                            src={photo}
                            alt={`${activePartner.name} work photo ${pIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-108 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold">
                            View
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!activePartner.ourWork || activePartner.ourWork.length === 0) &&
                  (!activePartner.photos || activePartner.photos.length === 0) && (
                    <div className="py-10 text-center bg-white rounded-2xl border border-[#EADBCA] text-[#7A6857] text-xs">
                      <Briefcase className="w-8 h-8 text-[#C4B5A5] mx-auto mb-2" />
                      <p className="font-bold text-[#3E3024]">Showcase gallery coming soon</p>
                      <p className="text-[11px] text-[#7A6857] mt-1">This partner has not yet uploaded client showcase projects.</p>
                    </div>
                  )}
              </div>
            )}

            {/* TAB 3: Customer Reviews & Ratings */}
            {detailTab === 'reviews' && (
              <div className="space-y-4">
                {/* Overall Rating Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-[#FAF7F2] to-amber-50/50 border border-[#EADBCA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-amber-200 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-[#1F160F]">{activePartner.rating}</span>
                      <span className="text-[9px] font-bold text-amber-700 uppercase">out of 5</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(activePartner.rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-bold text-[#241A12] mt-0.5">
                        {activePartner.reviews?.length || activePartner.reviewCount || 0} Verified Customer Reviews
                      </p>
                      <p className="text-[10px] text-[#7A6857]">All reviews are verified Gambian client orders</p>
                    </div>
                  </div>

                  <button
                    id="btn-write-review"
                    type="button"
                    onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                    className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isReviewFormOpen ? 'Close Form' : 'Write a Review'}</span>
                  </button>
                </div>

                {/* Write Review Form */}
                {isReviewFormOpen && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="p-4 rounded-2xl bg-white border border-amber-300 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs sm:text-sm font-bold text-[#1F160F]">
                        Share Your Experience with {activePartner.name}
                      </h5>
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Verified Feedback
                      </span>
                    </div>

                    {reviewSuccessMsg && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}

                    {/* Interactive Star Picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3B2C] mb-1">
                        Your Rating
                      </label>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 hover:scale-110 transition cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= reviewRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 hover:text-amber-200'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-[#4A3B2C] ml-2">
                          {reviewRating === 5 && 'Outstanding (5/5)'}
                          {reviewRating === 4 && 'Very Good (4/5)'}
                          {reviewRating === 3 && 'Average (3/5)'}
                          {reviewRating === 2 && 'Needs Improvement (2/5)'}
                          {reviewRating === 1 && 'Unsatisfied (1/5)'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-[#4A3B2C] mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="e.g. Lamin Touray or Fatou Ceesay"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EADBCA] focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[#4A3B2C] mb-1">
                          Service or Item Ordered (Optional)
                        </label>
                        <input
                          type="text"
                          value={reviewService}
                          onChange={(e) => setReviewService(e.target.value)}
                          placeholder="e.g. Fish Benachin or Screen Repair"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EADBCA] focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3B2C] mb-1">
                        Your Review & Comment *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell others in The Gambia about your experience, delivery speed, and service quality..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F2] border border-[#EADBCA] focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsReviewFormOpen(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#7A6857] hover:bg-[#F4EDE2] transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !reviewerName.trim() || !reviewComment.trim()}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmittingReview ? 'Posting Review...' : 'Post Verified Review'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                {activePartner.reviews && activePartner.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {activePartner.reviews.map((rev: PartnerReview) => (
                      <div
                        key={rev.id}
                        className="p-3.5 rounded-2xl bg-white border border-[#EADBCA] shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-200">
                              {rev.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-[#1F160F]">{rev.authorName}</span>
                                {rev.verifiedUser && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Verified Customer</span>
                                  </span>
                                )}
                              </div>
                              {rev.serviceUsed && (
                                <span className="text-[10px] text-[#7A6857] block">{rev.serviceUsed}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center space-x-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-3 h-3 ${
                                    s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-[#8C7A6B]">{rev.date}</span>
                          </div>
                        </div>

                        <p className="text-xs text-[#3E3024] leading-relaxed font-medium pl-10.5">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-white rounded-2xl border border-[#EADBCA] text-[#7A6857] text-xs">
                    <Star className="w-8 h-8 text-[#C4B5A5] mx-auto mb-2" />
                    <p className="font-bold text-[#241A12]">Be the first to review {activePartner.name}!</p>
                    <p className="text-[11px] text-[#7A6857] mt-1">Click "Write a Review" above to submit your verified customer rating.</p>
                  </div>
                )}
              </div>
            )}

            {/* Back Button */}
            <button
              onClick={() => setActivePartner(null)}
              className="w-full py-2.5 rounded-xl bg-white hover:bg-[#F4EDE2] text-[#4A3B2C] border border-[#EADBCA] font-bold text-sm transition"
            >
              ← Back to Verified Partners
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col space-y-4">
            {/* Search & Location Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter businesses, products, or services..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#EADBCA] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-[#241A12] placeholder-[#9E8E80]"
                />
              </div>

              {/* Location Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedLocation === loc
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[#F4EDE2] text-[#4A3B2C] hover:bg-[#EADDC9]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Partners List */}
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-[#7A6857] flex flex-col items-center">
                <MapPin className="w-10 h-10 text-[#C4B5A5] mb-2" />
                <p className="font-bold text-sm text-[#241A12]">No verified businesses matched this filter.</p>
                <p className="text-xs text-[#7A6857] mt-1 max-w-xs">
                  SOHLA never invents fake listings. Try clearing your search or asking SOHLA AI!
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLocation('ALL');
                  }}
                  className="mt-3 px-4 py-1.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold"
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
                    className="bg-white border border-[#EADBCA] rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={p.logo || p.coverImage}
                        alt={p.name}
                        className="w-14 h-14 rounded-xl object-cover border border-[#EADBCA] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            {p.location}
                          </span>
                          <span className="text-xs font-bold text-amber-500 flex items-center">
                            ★ {p.rating}
                          </span>
                        </div>
                        <h4 className="font-bold text-[#1F160F] text-sm group-hover:text-amber-700 transition truncate mt-0.5">
                          {p.name}
                        </h4>
                        <p className="text-xs text-[#5A4839] line-clamp-2 mt-0.5 leading-tight">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F0E6D8] flex items-center justify-between text-xs">
                      <span className="text-[#6E5B4B] font-medium text-[11px]">
                        {p.deliveryAvailable ? `Delivery D${p.deliveryFee}` : 'Pickup / Dine-in'}
                      </span>
                      <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavourite(p.id)}
                          className="p-1.5 rounded-lg hover:bg-[#F4EDE2] transition"
                          title="Save to Favourites"
                        >
                          <Heart
                            className={`w-4 h-4 ${favourites.includes(p.id) ? 'fill-rose-500 text-rose-500' : 'text-[#8C7A6B]'}`}
                          />
                        </button>
                        <button
                          onClick={() => sharePartnerWhatsApp(p)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          title="Share on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-amber-700 group-hover:underline pl-1 text-xs">
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

      {/* Lightbox / Media Viewer Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Our Work preview" className="w-full h-full object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Multi-Platform Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={sharePayload}
      />
    </div>
  );
};
