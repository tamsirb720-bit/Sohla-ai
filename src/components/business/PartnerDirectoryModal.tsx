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
  onPartnerUpdated
}) => {
  const [activePartner, setActivePartner] = useState<BusinessPartner | null>(initialSelectedPartner);
  const [detailTab, setDetailTab] = useState<'products' | 'work' | 'reviews'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<ShareDataPayload | null>(null);

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

            {/* Section Tabs Switcher: Products | Our Work | Customer Reviews */}
            <div className="flex border-b border-slate-200 gap-2 px-1">
              <button
                id="tab-partner-products"
                type="button"
                onClick={() => setDetailTab('products')}
                className={`py-2 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  detailTab === 'products'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Products & Menu</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
                  {activePartner.products?.length || 0}
                </span>
              </button>

              <button
                id="tab-partner-our-work"
                type="button"
                onClick={() => setDetailTab('work')}
                className={`py-2 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  detailTab === 'work'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Our Work & Showcase</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-100 text-purple-700 font-semibold">
                  {activePartner.ourWork?.length || activePartner.photos?.length || 0}
                </span>
              </button>

              <button
                id="tab-partner-reviews"
                type="button"
                onClick={() => setDetailTab('reviews')}
                className={`py-2 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                  detailTab === 'reviews'
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Reviews</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold">
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
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    No individual catalog items listed yet. Contact {activePartner.name} directly via WhatsApp or Phone for customized pricing!
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Our Work & Showcase */}
            {detailTab === 'work' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center space-x-1.5">
                    <Briefcase className="w-4 h-4 text-purple-600" />
                    <span>Real Projects & Showcase by {activePartner.name}</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Verified Gambian craftsmanship</span>
                </div>

                {activePartner.ourWork && activePartner.ourWork.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {activePartner.ourWork.map((work: OurWorkItem) => (
                      <div
                        key={work.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                      >
                        <div className="relative h-40 overflow-hidden bg-slate-100">
                          <img
                            src={work.image}
                            alt={work.title}
                            className="w-full h-full object-cover hover:scale-105 transition duration-300"
                          />
                          {work.category && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-sm">
                              {work.category}
                            </span>
                          )}
                          {work.completedDate && (
                            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{work.completedDate}</span>
                            </span>
                          )}
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {work.title}
                            </h5>
                            <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
                              {work.description}
                            </p>
                          </div>

                          {work.tags && work.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100">
                              {work.tags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-medium"
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
                ) : activePartner.photos && activePartner.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {activePartner.photos.map((photo, pIdx) => (
                      <div key={pIdx} className="rounded-xl overflow-hidden border border-slate-200 h-36">
                        <img src={photo} alt={`${activePartner.name} work photo`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Showcase gallery coming soon</p>
                    <p className="text-[11px] text-slate-500 mt-1">This partner has not yet uploaded client showcase projects.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Customer Reviews & Ratings */}
            {detailTab === 'reviews' && (
              <div className="space-y-4">
                {/* Overall Rating Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border border-purple-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-purple-200 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-900">{activePartner.rating}</span>
                      <span className="text-[9px] font-bold text-purple-700 uppercase">out of 5</span>
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
                      <p className="text-xs font-bold text-slate-800 mt-0.5">
                        {activePartner.reviews?.length || activePartner.reviewCount || 0} Verified Customer Reviews
                      </p>
                      <p className="text-[10px] text-slate-500">All reviews are verified Gambian client orders</p>
                    </div>
                  </div>

                  <button
                    id="btn-write-review"
                    type="button"
                    onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                    className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{isReviewFormOpen ? 'Close Form' : 'Write a Review'}</span>
                  </button>
                </div>

                {/* Write Review Form */}
                {isReviewFormOpen && (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="p-4 rounded-2xl bg-white border border-purple-200 shadow-md space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                        Share Your Experience with {activePartner.name}
                      </h5>
                      <span className="text-[10px] text-purple-600 font-semibold">Verified Feedback</span>
                    </div>

                    {reviewSuccessMsg && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}

                    {/* Interactive Star Picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                        <span className="text-xs font-bold text-slate-700 ml-2">
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
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="e.g. Lamin Touray or Fatou Ceesay"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Service or Item Ordered (Optional)
                        </label>
                        <input
                          type="text"
                          value={reviewService}
                          onChange={(e) => setReviewService(e.target.value)}
                          placeholder="e.g. Fish Benachin or Screen Repair"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Your Review & Comment *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell others in The Gambia about your experience, delivery speed, and service quality..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsReviewFormOpen(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReview || !reviewerName.trim() || !reviewComment.trim()}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold shadow transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
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
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                              {rev.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-slate-900">{rev.authorName}</span>
                                {rev.verifiedUser && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-0.5">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Verified Customer</span>
                                  </span>
                                )}
                              </div>
                              {rev.serviceUsed && (
                                <span className="text-[10px] text-slate-400 block">{rev.serviceUsed}</span>
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
                            <span className="text-[10px] text-slate-400">{rev.date}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed font-medium pl-9">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">Be the first to review {activePartner.name}!</p>
                    <p className="text-[11px] text-slate-500 mt-1">Click "Write a Review" above to submit your verified customer rating.</p>
                  </div>
                )}
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
