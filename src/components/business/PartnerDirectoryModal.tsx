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
  Check,
  Film,
  Scissors,
  Package as PackageIcon,
  HeartHandshake,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { BusinessPartner, CategoryInfo, ProductItem, PartnerReview, OurWorkItem, ServiceItem, HEALTHCARE_SERVICES_LIST } from '../../types';
import { ShareModal, ShareDataPayload } from '../common/ShareModal';
import { BeautyBookingModal } from '../booking/BeautyBookingModal';
import { DeliveryRequestModal } from '../delivery/DeliveryRequestModal';

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
  const [selectedSubcategory, setSelectedSubcategory] = useState('ALL');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<ShareDataPayload | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Direct Booking & Delivery Modals State
  const [isBeautyBookingOpen, setIsBeautyBookingOpen] = useState(false);
  const [bookingPartner, setBookingPartner] = useState<BusinessPartner | null>(null);
  const [bookingInitialService, setBookingInitialService] = useState<ServiceItem | null>(null);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryPreferredPartner, setDeliveryPreferredPartner] = useState<BusinessPartner | null>(null);

  // Reset category filters when opened with a new category
  useEffect(() => {
    setSelectedSubcategory('ALL');
    setSearchQuery('');
  }, [category, isOpen]);

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
    if (selectedSubcategory !== 'ALL') {
      const matchPartnerSub = p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase();
      const matchServiceSub = p.services?.some(
        s => (s.subcategory && s.subcategory.toLowerCase() === selectedSubcategory.toLowerCase()) ||
             (s.category && s.category.toLowerCase() === selectedSubcategory.toLowerCase())
      );
      if (!matchPartnerSub && !matchServiceSub) {
        return false;
      }
    }
    if (selectedLocation !== 'ALL' && !p.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchSub = p.subcategory?.toLowerCase().includes(q);
      const matchLoc = p.location?.toLowerCase().includes(q);
      const matchProd = p.products?.some(pr => pr.name.toLowerCase().includes(q) || pr.description?.toLowerCase().includes(q));
      const matchServ = p.services?.some(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
      return matchName || matchDesc || matchSub || matchLoc || matchProd || matchServ;
    }
    return true;
  });

  // Locations list
  const locations = ['ALL', 'Senegambia', 'Kololi', 'Brusubi', 'Kotu', 'Bijilo', 'Fajara', 'Kairaba Avenue', 'Serekunda', 'Banjul', 'Brikama'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div
        id="partner-directory-modal"
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#FAF8F5] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#EADBCA] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header: Warm Obsidian / African Wood Tone */}
        {activePartner ? (
          <div className="px-5 py-3.5 bg-[#19110B] text-white flex items-center justify-between border-b border-[#2D2015]">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActivePartner(null)}
                className="text-xs font-bold text-stone-300 hover:text-white flex items-center space-x-1 cursor-pointer transition"
              >
                <span>← Back</span>
              </button>
              <div className="h-4 w-px bg-white/20" />
              <div>
                <h2 className="text-sm sm:text-base font-black font-display text-white truncate max-w-xs sm:max-w-md">
                  {activePartner.name}
                </h2>
                <p className="text-[11px] text-[#D8C7B5]">
                  {activePartner.subcategory} • {activePartner.location}
                </p>
              </div>
            </div>

            <button
              id="btn-close-partner-modal"
              onClick={() => {
                setActivePartner(null);
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : category ? (
          /* Category-specific top nav bar matching reference design */
          <div className="px-4 sm:px-5 py-3 bg-[#19110B] text-white flex items-center justify-between border-b border-[#2D2015]">
            <button
              id="btn-all-categories-back"
              onClick={onClose}
              className="text-xs sm:text-sm font-extrabold text-stone-200 hover:text-white flex items-center space-x-1 cursor-pointer transition active:scale-95"
            >
              <span>← All Categories</span>
            </button>

            <div className="flex items-center space-x-2">
              {category.key === 'BEAUTY & WELLNESS' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#382618] text-[#F3C594] border border-[#593D25] flex items-center space-x-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-[#F3C594]" />
                  <span>Instant booking</span>
                </span>
              )}
              {category.key === 'DELIVERY & ERRANDS' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-[#382618] text-[#F3C594] border border-[#593D25] flex items-center space-x-1 shadow-xs">
                  <Truck className="w-3 h-3 text-[#F3C594]" />
                  <span>Door-to-door</span>
                </span>
              )}
              <button
                id="btn-close-category-modal"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4 bg-[#19110B] text-white flex items-center justify-between border-b border-[#2D2015]">
            <div>
              <h2 className="text-lg sm:text-xl font-black font-display text-white">
                Verified Gambian Partners
              </h2>
              <p className="text-xs text-[#D8C7B5]">
                Verified local businesses & official services
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Category Hero Banner when viewing a category directory */}
        {!activePartner && category && (
          <div className="relative px-5 py-5 sm:py-6 bg-[#19110B] overflow-hidden border-b border-[#2D2015] select-none">
            {/* Background image overlay */}
            <img
              src={
                category.key === 'BEAUTY & WELLNESS'
                  ? 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80'
                  : category.key === 'DELIVERY & ERRANDS'
                  ? 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80'
                  : category.image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80'
              }
              alt={category.name}
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#19110B] via-[#19110B]/80 to-[#19110B]/55" />
            
            <div className="relative z-10 space-y-1">
              <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                {category.name}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-xl leading-relaxed">
                {category.key === 'BEAUTY & WELLNESS'
                  ? 'Book salon appointments, master barbers, traditional Gambian henna, royal braids, and relaxing massages.'
                  : category.key === 'DELIVERY & ERRANDS'
                  ? 'Fast motorbike couriers for documents, restaurant meals, market errands, and package deliveries.'
                  : category.tagline}
              </p>
            </div>
          </div>
        )}

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
            {activePartner.category === 'BEAUTY & WELLNESS' && (
              <button
                id="btn-partner-book-service"
                onClick={() => {
                  setBookingPartner(activePartner);
                  setBookingInitialService(null);
                  setIsBeautyBookingOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-105 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-md transition cursor-pointer active:scale-95"
              >
                <Calendar className="w-4 h-4 text-white" />
                <span>Book Salon / Barber Appointment</span>
              </button>
            )}

            {activePartner.category === 'DELIVERY & ERRANDS' && (
              <button
                id="btn-partner-send-package"
                onClick={() => {
                  setDeliveryPreferredPartner(activePartner);
                  setIsDeliveryModalOpen(true);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-105 text-white font-extrabold text-sm flex items-center justify-center space-x-2 shadow-md transition cursor-pointer active:scale-95"
              >
                <Truck className="w-4 h-4 text-white" />
                <span>Send a Package / Request Courier</span>
              </button>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <a
                href={`https://wa.me/${activePartner.whatsapp.replace(/[^0-9]/g, '')}?text=${
                  activePartner.category === 'HOTELS & STAYS'
                    ? `Hello%20${encodeURIComponent(activePartner.name)},%20I%20would%20like%20to%20inquire%20about%20booking%20a%20stay%20via%20SOHLA!`
                    : activePartner.category === 'HOUSING & PROPERTIES'
                    ? `Hello%20${encodeURIComponent(activePartner.name)},%20I%20am%20inquiring%20about%20your%20property%20listings%20on%20SOHLA!`
                    : activePartner.category === 'BEAUTY & WELLNESS'
                    ? `Hello%20${encodeURIComponent(activePartner.name)},%20I%20would%20like%20to%20book%20an%20appointment%20via%20SOHLA!`
                    : activePartner.category === 'DELIVERY & ERRANDS'
                    ? `Hello%20${encodeURIComponent(activePartner.name)},%20I%20need%20a%20courier%20delivery%20via%20SOHLA!`
                    : `Hello%20${encodeURIComponent(activePartner.name)},%20I%20found%20you%20on%20SOHLA!`
                }`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-105 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {activePartner.category === 'HOTELS & STAYS'
                    ? 'WhatsApp Booking'
                    : activePartner.category === 'HOUSING & PROPERTIES'
                    ? 'WhatsApp Inquiry'
                    : activePartner.category === 'BEAUTY & WELLNESS'
                    ? 'WhatsApp Salon'
                    : activePartner.category === 'DELIVERY & ERRANDS'
                    ? 'WhatsApp Dispatch'
                    : 'WhatsApp Order'}
                </span>
              </a>

              <a
                href={`tel:${activePartner.phone.replace(/[^0-9+]/g, '')}`}
                className="py-2.5 px-3 rounded-xl bg-[#21160F] hover:bg-[#342418] text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition cursor-pointer"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                <span>Call ({activePartner.phone})</span>
              </a>

              <button
                onClick={() => onOpenAI(`Tell me about ${activePartner.name} and what they sell or services offered`)}
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
                <span>
                  {activePartner.category === 'BEAUTY & WELLNESS'
                    ? 'Services & Treatments'
                    : activePartner.category === 'DELIVERY & ERRANDS'
                    ? 'Courier Services & Rates'
                    : activePartner.category === 'HOTELS & STAYS'
                    ? 'Rooms & Stays'
                    : activePartner.category === 'HOUSING & PROPERTIES'
                    ? 'Listings & Properties'
                    : 'Products & Menu'}
                </span>
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-[#EFE7DC] text-[#4A3B2C] font-bold">
                  {(activePartner.services?.length || 0) + (activePartner.products?.length || 0)}
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

            {/* TAB 1: Products, Services & Menu */}
            {detailTab === 'products' && (
              <div className="space-y-4">
                {/* 1. Services & Treatments Section (for Beauty, Salons, Barbers, Spas, etc.) */}
                {activePartner.services && activePartner.services.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#1F160F] flex items-center space-x-1.5">
                        <Scissors className="w-4 h-4 text-rose-600" />
                        <span>Services & Treatment Menu</span>
                      </h4>
                      <span className="text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                        {activePartner.services.length} services available
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {activePartner.services.map((srv: ServiceItem) => (
                        <div
                          key={srv.id}
                          className="bg-white p-3 rounded-2xl border border-rose-100 shadow-xs hover:border-rose-300 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="text-xs sm:text-sm font-bold text-[#1F160F]">{srv.name}</h5>
                              <span className="text-xs sm:text-sm font-black text-rose-800 whitespace-nowrap">
                                D{srv.startingPrice} GMD
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6E5B4B] line-clamp-2 mt-1">{srv.description}</p>
                            {srv.duration && (
                              <span className="inline-flex items-center space-x-1 text-[10px] text-stone-500 mt-1">
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>Est. Duration: {srv.duration}</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-rose-50 flex items-center justify-between">
                            <span className="text-emerald-700 font-bold text-[10px]">● Available for Booking</span>
                            <button
                              onClick={() => {
                                setBookingPartner(activePartner);
                                setBookingInitialService(srv);
                                setIsBeautyBookingOpen(true);
                              }}
                              className="px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-105 text-white font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
                            >
                              Book This Service →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Courier Rates & Dispatch Card for Delivery Partners */}
                {activePartner.category === 'DELIVERY & ERRANDS' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-sky-950">Direct Courier Dispatch</h4>
                          <p className="text-[11px] text-sky-700">Same-day parcel delivery across Greater Banjul</p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-sky-900 bg-sky-200/80 px-2.5 py-1 rounded-full">
                        Base: D{activePartner.deliveryFee || 120} GMD
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-sky-900">
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <div className="font-bold">⚡ Express Courier</div>
                        <div className="text-[10px] text-sky-700 mt-0.5">30-60 min door-to-door</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <div className="font-bold">🍲 Food & Pastry</div>
                        <div className="text-[10px] text-sky-700 mt-0.5">Insulated hot bags</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <div className="font-bold">🛒 Market Errands</div>
                        <div className="text-[10px] text-sky-700 mt-0.5">Serekunda / Albert Mkt</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-sky-100">
                        <div className="font-bold">📄 Cheques & Docs</div>
                        <div className="text-[10px] text-sky-700 mt-0.5">Confidential dispatch</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setDeliveryPreferredPartner(activePartner);
                        setIsDeliveryModalOpen(true);
                      }}
                      className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Request Courier with {activePartner.name}</span>
                    </button>
                  </div>
                )}

                {/* 3. Catalog Products / Retail Items */}
                {activePartner.products && activePartner.products.length > 0 && (
                  <div className="space-y-2.5">
                    {activePartner.services && activePartner.services.length > 0 && (
                      <h4 className="text-xs sm:text-sm font-extrabold text-[#1F160F] flex items-center space-x-1.5 pt-2">
                        <Tag className="w-4 h-4 text-amber-600" />
                        <span>Retail Products & Hair Care Items</span>
                      </h4>
                    )}
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
                              <span className="text-emerald-700 font-bold">
                                {activePartner.category === 'HOUSING & PROPERTIES'
                                  ? '● Available'
                                  : activePartner.category === 'HOTELS & STAYS'
                                  ? `● Available (${prod.stock} rooms)`
                                  : `● In Stock (${prod.stock})`}
                              </span>
                              <a
                                href={`https://wa.me/${activePartner.whatsapp.replace(/[^0-9]/g, '')}?text=${
                                  activePartner.category === 'HOTELS & STAYS'
                                    ? `Hello%20${encodeURIComponent(activePartner.name)},%20I%20would%20like%20to%20book%20${encodeURIComponent(prod.name)}%20(D${prod.price})%20via%20SOHLA!`
                                    : activePartner.category === 'HOUSING & PROPERTIES'
                                    ? `Hello%20${encodeURIComponent(activePartner.name)},%20I%20am%20inquiring%20about%20${encodeURIComponent(prod.name)}%20(D${prod.price})%20on%20SOHLA.`
                                    : `I%20would%20like%20to%20order%20${encodeURIComponent(prod.name)}%20(D${prod.price})%20from%20SOHLA!`
                                }`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-700 font-bold hover:underline"
                              >
                                {activePartner.category === 'HOTELS & STAYS'
                                  ? 'Book via WhatsApp →'
                                  : activePartner.category === 'HOUSING & PROPERTIES'
                                  ? 'Inquire via WhatsApp →'
                                  : 'Order via WhatsApp →'}
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!activePartner.products || activePartner.products.length === 0) &&
                  (!activePartner.services || activePartner.services.length === 0) &&
                  activePartner.category !== 'DELIVERY & ERRANDS' && (
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

                {/* Video Showcase (if uploaded) */}
                {activePartner.videoUrl && (
                  <div className="space-y-2 pt-2">
                    <h5 className="text-xs font-bold text-[#4A3B2C] uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-600" />
                      <span>Promotional Video Showcase</span>
                    </h5>
                    <div className="rounded-2xl overflow-hidden border border-[#EADBCA] bg-black aspect-video shadow-inner">
                      <video
                        src={activePartner.videoUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                {(!activePartner.ourWork || activePartner.ourWork.length === 0) &&
                  (!activePartner.photos || activePartner.photos.length === 0) &&
                  !activePartner.videoUrl && (
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
            {/* Errand Courier Banner matching Screenshot 2 */}
            {category?.key === 'DELIVERY & ERRANDS' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#2B1B14] border border-[#432A1F] text-white flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/25 border border-orange-500/40 flex items-center justify-center shrink-0">
                    <PackageIcon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs sm:text-sm text-white">Send a package or errand runner</h4>
                    <p className="text-[11px] text-stone-300 truncate sm:whitespace-normal">Fast motorbike couriers dispatched in under 20 minutes.</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const firstDelivery = filtered.find(p => p.category === 'DELIVERY & ERRANDS') || partners.find(p => p.category === 'DELIVERY & ERRANDS');
                    setDeliveryPreferredPartner(firstDelivery || null);
                    setIsDeliveryModalOpen(true);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-[#E8592E] hover:bg-[#D44A20] text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm active:scale-95 transition"
                >
                  Send Courier
                </button>
              </div>
            )}

            {/* Search & Location Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    category?.key === 'BEAUTY & WELLNESS'
                      ? 'Search beauty & wellness in The Gambia...'
                      : category?.key === 'DELIVERY & ERRANDS'
                      ? 'Search delivery in The Gambia...'
                      : `Search ${category?.name ? category.name.toLowerCase() : 'businesses'} in The Gambia...`
                  }
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-[#EADBCA] text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 text-[#241A12] placeholder-[#9E8E80]"
                />
              </div>

              {/* Location Select Dropdown */}
              <div className="relative sm:w-56 shrink-0">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 rounded-xl bg-white border border-[#EADBCA] text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 text-stone-800 appearance-none cursor-pointer"
                >
                  <option value="ALL">📍 All Gambian Areas</option>
                  <option value="Senegambia">Senegambia</option>
                  <option value="Kololi">Kololi</option>
                  <option value="Brusubi">Brusubi</option>
                  <option value="Kotu">Kotu</option>
                  <option value="Bijilo">Bijilo</option>
                  <option value="Fajara">Fajara</option>
                  <option value="Kairaba Avenue">Kairaba Avenue</option>
                  <option value="Serekunda">Serekunda</option>
                  <option value="Banjul">Banjul</option>
                  <option value="Brikama">Brikama</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-xs">▼</div>
              </div>
            </div>

            {/* Subcategory Filter Chips when viewing a specific category */}
            {category?.subcategories && category.subcategories.length > 0 && (
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 pt-0.5">
                <button
                  onClick={() => setSelectedSubcategory('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                    selectedSubcategory === 'ALL'
                      ? 'bg-[#19110B] text-white shadow-xs'
                      : 'bg-white text-[#4A3B2C] border border-[#EADBCA] hover:bg-[#F4EDE2]'
                  }`}
                >
                  All
                </button>
                {category.subcategories.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                      selectedSubcategory === sub
                        ? 'bg-[#19110B] text-white shadow-xs'
                        : 'bg-white text-[#4A3B2C] border border-[#EADBCA] hover:bg-[#F4EDE2]'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* Section Counter and Currency Notice */}
            <div className="flex items-center justify-between px-1 pt-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 tracking-wide">
                {selectedSubcategory === 'ALL'
                  ? (category ? `Verified ${category.name}` : 'Verified Partners')
                  : selectedSubcategory}{' '}
                ({filtered.length})
              </h3>
              <span className="text-[11px] font-semibold text-stone-500">
                Prices in Dalasi (D)
              </span>
            </div>

            {/* Partners List or Honest Empty State */}
            {filtered.length === 0 ? (
              selectedSubcategory === 'Healthcare & Nursing' ? (
                <div className="py-8 px-4 text-center rounded-2xl bg-white border border-rose-200 flex flex-col items-center justify-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <HeartHandshake className="w-7 h-7" />
                  </div>

                  <div className="max-w-md">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                      Healthcare & Nursing Verification
                    </span>
                    <h4 className="font-black text-base sm:text-lg text-stone-900 mt-2">
                      No verified healthcare providers available yet.
                    </h4>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      SOHLA strictly mandates formal verification of licensed nursing credentials, clinical registrations, and Gambian Nursing & Midwifery Council standing before activating healthcare providers.
                    </p>
                  </div>

                  {/* Safety & Non-Emergency Medical Disclaimer */}
                  <div className="w-full max-w-lg p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-left flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-amber-900 leading-snug">
                      <strong className="font-bold">Notice:</strong> SOHLA is a booking and provider discovery platform and does not provide medical diagnosis. If you or the patient have an acute medical emergency, please call <strong>1122</strong> or proceed immediately to the nearest hospital emergency department.
                    </div>
                  </div>

                  {/* 15 Manageable Service Types on Platform */}
                  <div className="w-full max-w-lg text-left pt-2 border-t border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-stone-800 uppercase tracking-wider">
                        Supported Healthcare Service Categories (15):
                      </span>
                      <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Admin Configurable
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {HEALTHCARE_SERVICES_LIST.map((srvName) => (
                        <div
                          key={srvName}
                          className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-[11px] font-medium text-stone-700 flex items-center space-x-1.5"
                        >
                          <ShieldCheck className="w-3 h-3 text-rose-500 shrink-0" />
                          <span className="truncate">{srvName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedSubcategory('ALL');
                      }}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      View All Beauty & Wellness Partners
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-4 text-center rounded-2xl bg-white border border-[#EADBCA] flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                    <Search className="w-6 h-6 text-stone-400" />
                  </div>
                  <h4 className="font-extrabold text-sm sm:text-base text-stone-900">
                    {searchQuery || selectedLocation !== 'ALL' || selectedSubcategory !== 'ALL'
                      ? 'No providers match your filter criteria'
                      : 'No verified providers available yet.'}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">
                    {searchQuery || selectedLocation !== 'ALL' || selectedSubcategory !== 'ALL'
                      ? "Try clearing your search query or selecting 'All Gambian Areas'."
                      : `Verified ${category?.name || 'providers'} are actively being onboarded across Greater Banjul.`}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedLocation('ALL');
                      setSelectedSubcategory('ALL');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                  >
                    Reset Filters
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filtered.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePartner(p)}
                    className="bg-white border border-[#EADBCA] rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start space-x-3">
                        <img
                          src={p.logo || p.coverImage}
                          alt={p.name}
                          className="w-14 h-14 rounded-xl object-cover border border-[#EADBCA] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider truncate">
                              {p.subcategory || p.location}
                            </span>
                            <span className="text-xs font-bold text-amber-500 flex items-center shrink-0">
                              ★ {p.rating}
                            </span>
                          </div>
                          <h4 className="font-bold text-[#1F160F] text-sm group-hover:text-amber-700 transition truncate mt-1">
                            {p.name}
                          </h4>
                          <p className="text-xs text-stone-500">
                            ★ {p.rating} ({p.reviewCount || 120}) • 📍 {p.location}
                          </p>
                          <p className="text-xs text-[#5A4839] line-clamp-2 mt-1 leading-tight">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {/* Direct Services List with Dalasi Prices & Book Button */}
                      {p.services && p.services.length > 0 && (
                        <div className="mt-3 space-y-1.5 pt-2 border-t border-stone-100">
                          {p.services.slice(0, 2).map((srv) => (
                            <div
                              key={srv.id}
                              className="flex items-center justify-between py-1 px-2 rounded-lg bg-stone-50 border border-stone-100 text-xs"
                            >
                              <span className="font-medium text-stone-800 truncate pr-2">{srv.name}</span>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="font-bold text-amber-900">D {srv.startingPrice ?? (srv as any).price ?? 0}</span>
                                {p.category === 'BEAUTY & WELLNESS' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBookingPartner(p);
                                      setBookingInitialService(srv);
                                      setIsBeautyBookingOpen(true);
                                    }}
                                    className="px-2 py-0.5 rounded bg-stone-900 hover:bg-black text-white font-bold text-[10px] cursor-pointer active:scale-95 transition"
                                  >
                                    Book
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Direct Service Booking Action on Card */}
                      {p.category === 'BEAUTY & WELLNESS' && (!p.services || p.services.length === 0) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingPartner(p);
                            setBookingInitialService(null);
                            setIsBeautyBookingOpen(true);
                          }}
                          className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-105 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>Book Appointment</span>
                        </button>
                      )}

                      {/* Direct Courier Request Action on Card */}
                      {p.category === 'DELIVERY & ERRANDS' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeliveryPreferredPartner(p);
                            setIsDeliveryModalOpen(true);
                          }}
                          className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-105 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Send a Package</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#F0E6D8] flex items-center justify-between text-xs">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          sharePartnerWhatsApp(p);
                        }}
                        className="flex items-center space-x-1.5 text-emerald-700 hover:text-emerald-800 font-bold transition"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>WhatsApp</span>
                      </button>

                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavourite(p.id)}
                          className="p-1.5 rounded-lg hover:bg-[#F4EDE2] transition"
                          title="Save to Favourites"
                        >
                          <Heart
                            className={`w-4 h-4 ${favourites.includes(p.id) ? 'fill-rose-500 text-rose-500' : 'text-[#8C7A6B]'}`}
                          />
                        </button>
                        <span
                          onClick={() => setActivePartner(p)}
                          className="font-bold text-amber-800 hover:text-amber-900 group-hover:underline text-xs flex items-center space-x-0.5 cursor-pointer"
                        >
                          <span>View Details & Profile</span>
                          <span>→</span>
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

      {/* Native Beauty Booking Modal */}
      <BeautyBookingModal
        isOpen={isBeautyBookingOpen}
        onClose={() => setIsBeautyBookingOpen(false)}
        partner={bookingPartner}
        initialService={bookingInitialService}
        onBookingSuccess={() => {
          setIsBeautyBookingOpen(false);
        }}
      />

      {/* Native Delivery Request Modal */}
      <DeliveryRequestModal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        preferredPartner={deliveryPreferredPartner}
        partners={partners}
        onRequestSuccess={() => {
          setIsDeliveryModalOpen(false);
        }}
      />
    </div>
  );
};
