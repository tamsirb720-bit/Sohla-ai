import React, { useState, useEffect } from 'react';
import {
  Home,
  Compass,
  Heart,
  User,
  Sparkles,
  Shield,
  Search,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Zap,
  Landmark,
  Briefcase,
  CreditCard,
  Flame,
  CheckCircle2,
  Lock,
  Share2,
  Copy,
  Check,
  Bookmark,
  Receipt,
  History,
  Trash2,
  Building2,
  Bell,
  ChevronDown,
  ShoppingBag,
  ShoppingCart
} from 'lucide-react';
import {
  CategoryInfo,
  BusinessPartner,
  Advertisement,
  AdminUser,
  CashPowerTransaction
} from './types';
import { TopVideoBillboard } from './components/home/TopVideoBillboard';
import { SearchBar } from './components/home/SearchBar';
import { TrendingCategories } from './components/home/TrendingCategories';
import { SohlaChatModal } from './components/ai/SohlaChatModal';
import { PartnerDirectoryModal } from './components/business/PartnerDirectoryModal';
import { CashPowerModal } from './components/utilities/CashPowerModal';
import { GovernmentPaymentsModal } from './components/utilities/GovernmentPaymentsModal';
import { AIJobsModal } from './components/utilities/AIJobsModal';
import { PaymentsModal } from './components/utilities/PaymentsModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminPortal } from './components/admin/AdminPortal';
import { ControlCenter } from './components/control-center/ControlCenter';
import { PartnerPortalModal } from './components/business/PartnerPortalModal';
import { SohlaLogo } from './components/common/SohlaLogo';
import { ShareModal, ShareDataPayload } from './components/common/ShareModal';
import { CustomerServicesAccountSection } from './components/account/CustomerServicesAccountSection';
import { BeautyBookingModal } from './components/booking/BeautyBookingModal';
import { DeliveryRequestModal } from './components/delivery/DeliveryRequestModal';

export default function App() {
  // Navigation & View State
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'explore' | 'favourites' | 'account'>('home');

  // Core Data
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [favourites, setFavourites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sohla_favourites');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize legacy partner-1/partner-2 to bp-1/bp-2
          return parsed.map((id: string) => id === 'partner-1' ? 'bp-1' : id === 'partner-2' ? 'bp-2' : id);
        }
      }
      return ['bp-1', 'bp-2'];
    } catch {
      return ['bp-1', 'bp-2'];
    }
  });

  // Saved NAWEC Cash Power Receipts & Tokens
  const [savedCashPower, setSavedCashPower] = useState<CashPowerTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('sohla_saved_cashpower_receipts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'cpt-saved-master-1',
        meterNumber: '0714-8892-3310',
        meterOwner: 'Verified NAWEC Consumer',
        amountDalasi: 300,
        phone: '+220 788 1234',
        tokenGenerated: '5144-9614-4016-9198-3944',
        unitsKWh: 27.3,
        tariffGMDPerKWh: 11,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        isRealGateway: false
      }
    ];
  });

  // Filter in the Saved / Favourites Tab: 'all' (both) | 'places' | 'cashpower'
  const [savedFilter, setSavedFilter] = useState<'all' | 'places' | 'cashpower'>('all');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Global Multi-Platform Share Modal State
  const [isGlobalShareOpen, setIsGlobalShareOpen] = useState(false);
  const [globalSharePayload, setGlobalSharePayload] = useState<ShareDataPayload | null>(null);

  // Modal States
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<BusinessPartner | null>(null);

  // Utility Modals
  const [isCashPowerOpen, setIsCashPowerOpen] = useState(false);
  const [isGovPaymentsOpen, setIsGovPaymentsOpen] = useState(false);
  const [isAIJobsOpen, setIsAIJobsOpen] = useState(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState(false);
  const [isPartnerPortalOpen, setIsPartnerPortalOpen] = useState(false);
  const [selectedPartnerForPortal, setSelectedPartnerForPortal] = useState<BusinessPartner | null>(null);
  const [selectedHubLocation, setSelectedHubLocation] = useState('Brusubi');
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);

  // Native Beauty & Delivery Modals (Direct from Customer Account or Home)
  const [isBeautyBookingOpen, setIsBeautyBookingOpen] = useState(false);
  const [isDeliveryRequestOpen, setIsDeliveryRequestOpen] = useState(false);
  const [activeBookingPartner, setActiveBookingPartner] = useState<BusinessPartner | null>(null);
  const [activeDeliveryPartner, setActiveDeliveryPartner] = useState<BusinessPartner | null>(null);

  // Admin Security States (Portal Command Center)
  const defaultSuperAdmin: AdminUser = {
    id: 'u-1',
    username: 'superadmin',
    name: 'Tamsir B. (Super Admin)',
    email: 'tamsirb720@gmail.com',
    role: 'SUPER_ADMIN',
    phone: '+220 788 1234',
    nationalIdOrNin: 'GMB-NIN-940218-01A',
    department: 'Executive Security & Platform Governance',
    securityClearance: 'TIER_1_CORE',
    verifiedPersonal: true,
    verifiedBy: 'National Civil Registry & Biometrics Office',
    verifiedAt: '2026-01-01T00:00:00.000Z',
    twoFactorEnabled: true,
    lastLogin: new Date().toISOString(),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z'
  };

  // Check if current view is standalone customer mode or admin command center
  const isCustomerUrlMode = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('mode') === 'customer' ||
    window.location.pathname === '/customer' ||
    window.location.hash.includes('customer')
  );

  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<'control_center' | 'classic'>('control_center');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string>('');

  // Load Initial Public Data
  const fetchData = async () => {
    try {
      const [catsRes, partsRes, adsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/partners'),
        fetch('/api/ads')
      ]);

      if (catsRes.ok) setCategories(await catsRes.json());
      if (partsRes.ok) setPartners(await partsRes.json());
      if (adsRes.ok) setAds(await adsRes.json());
    } catch (err) {
      console.error('Error fetching SOHLA data:', err);
    }
  };

  // Verify server session authority
  const verifyServerSession = async (tokenCandidate?: string): Promise<boolean> => {
    const token = tokenCandidate || adminToken || (typeof window !== 'undefined' ? localStorage.getItem('sohla_admin_token') || '' : '');
    if (!token) {
      setAdminUser(null);
      setAdminToken('');
      setIsAdminPortalOpen(false);
      return false;
    }

    try {
      const res = await fetch('/api/admin/verify-session', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.valid && data.user) {
          setAdminUser(data.user);
          setAdminToken(token);
          return true;
        }
      }
    } catch (e) {
      console.error('Session validation error:', e);
    }

    // If server rejected token or request failed
    try {
      localStorage.removeItem('sohla_admin_user');
      localStorage.removeItem('sohla_admin_token');
    } catch {}
    setAdminUser(null);
    setAdminToken('');
    setIsAdminPortalOpen(false);
    return false;
  };

  useEffect(() => {
    fetchData();

    // Check if URL specifies /admin, #admin, #control-center, or ?mode=customer
    const checkAdminRoute = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('mode') === 'customer' || window.location.pathname === '/customer' || window.location.hash.includes('customer')) {
        setIsAdminPortalOpen(false);
        return;
      }

      if (window.location.hash.includes('partner-portal') || searchParams.get('mode') === 'partner-portal') {
        setIsPartnerPortalOpen(true);
        setIsAdminPortalOpen(false);
        return;
      }

      if (window.location.hash.includes('control-center') || searchParams.get('mode') === 'control-center') {
        setAdminViewMode('control_center');
        const isValid = await verifyServerSession();
        if (isValid) {
          setIsAdminPortalOpen(true);
        } else {
          setIsAdminPortalOpen(false);
          setIsAdminLoginOpen(true);
        }
        return;
      }

      if (window.location.pathname.includes('/admin') || window.location.hash.includes('admin') || searchParams.get('mode') === 'admin') {
        setAdminViewMode('classic');
        const isValid = await verifyServerSession();
        if (isValid) {
          setIsAdminPortalOpen(true);
        } else {
          setIsAdminPortalOpen(false);
          setIsAdminLoginOpen(true);
        }
      }
    };

    // Perform initial session check and route inspection
    checkAdminRoute();

    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  // Save favourites
  useEffect(() => {
    try {
      localStorage.setItem('sohla_favourites', JSON.stringify(favourites));
    } catch {}
  }, [favourites]);

  const toggleFavourite = (partnerId: string) => {
    setFavourites(prev =>
      prev.includes(partnerId) ? prev.filter(id => id !== partnerId) : [...prev, partnerId]
    );
  };

  // Open SOHLA AI with optional query
  const handleOpenAI = (prompt?: string) => {
    setAiPrompt(prompt || '');
    setIsAIChatOpen(true);
  };

  // Handle Category Selection
  const handleSelectCategory = (cat: CategoryInfo) => {
    // Special utility handlers
    if (cat.key === 'NAWEC_CASHPOWER' || cat.name.includes('Cash Power')) {
      setIsCashPowerOpen(true);
      return;
    }
    if (cat.key === 'GOVERNMENT_PAYMENTS' || cat.name.includes('Government')) {
      setIsGovPaymentsOpen(true);
      return;
    }
    if (cat.key === 'AI_JOBS_INCOME' || cat.name.includes('AI Jobs')) {
      setIsAIJobsOpen(true);
      return;
    }
    if (cat.key === 'PAYMENTS' || cat.name.includes('Payments')) {
      setIsPaymentsOpen(true);
      return;
    }

    setSelectedCategory(cat);
  };

  // Handle Search Input
  const handleSearch = (query: string) => {
    const q = query.toLowerCase();
    // Check if it's a utility trigger
    if (q.includes('cash power') || q.includes('nawec') || q.includes('meter')) {
      setIsCashPowerOpen(true);
      return;
    }
    if (q.includes('government') || q.includes('tax') || q.includes('tin') || q.includes('gra')) {
      setIsGovPaymentsOpen(true);
      return;
    }
    if (q.includes('job') || q.includes('work') || q.includes('earn')) {
      setIsAIJobsOpen(true);
      return;
    }
    if (q.includes('wave') || q.includes('qmoney') || q.includes('send money')) {
      setIsPaymentsOpen(true);
      return;
    }

    // Otherwise launch SOHLA AI with the search query
    handleOpenAI(query);
  };

  // Admin Login Success
  const handleAdminLoginSuccess = (user: AdminUser, token: string) => {
    setAdminUser(user);
    setAdminToken(token);
    try {
      localStorage.setItem('sohla_admin_user', JSON.stringify(user));
      localStorage.setItem('sohla_admin_token', token);
    } catch {}
    setIsAdminLoginOpen(false);
    setIsAdminPortalOpen(true);
  };

  // Admin Logout
  const handleAdminLogout = async () => {
    const currentToken = adminToken || (typeof window !== 'undefined' ? localStorage.getItem('sohla_admin_token') || '' : '');
    if (currentToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${currentToken}` },
          credentials: 'include'
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setAdminUser(null);
    setAdminToken('');
    try {
      localStorage.removeItem('sohla_admin_user');
      localStorage.removeItem('sohla_admin_token');
    } catch {}
    setIsAdminPortalOpen(false);
    if (window.location.hash.includes('admin') || window.location.hash.includes('control-center')) {
      window.location.hash = '';
    }
  };

  // Sync saved cash power to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sohla_saved_cashpower_receipts', JSON.stringify(savedCashPower));
    } catch {}
  }, [savedCashPower]);

  // Format single partner for share
  const formatPartnerShare = (p: BusinessPartner) => {
    return `🇬🇲 *${p.name}* (${p.subcategory})\n\n📍 *Location:* ${p.location} • ${p.address}\n⭐ *Rating:* ${p.rating} ★ (${p.reviewCount} reviews)\n🕒 *Hours:* ${p.openingHours}\n📞 *Phone:* ${p.phone}\n💬 *WhatsApp:* ${p.whatsapp}\n🚚 *Delivery:* ${p.deliveryAvailable ? `D${p.deliveryFee} (${p.estimatedDeliveryTime})` : 'Dine-in / Pickup'}\n\nDiscovered on *SOHLA AI* — The Gambia's All-in-One Platform`;
  };

  // Format single cash power token for share
  const formatCashPowerShare = (tx: CashPowerTransaction) => {
    return `⚡ *NAWEC Cash Power Token Recharge* 🇬🇲\n\n🔢 *Token:* ${tx.tokenGenerated}\n⚡ *Units:* ${tx.unitsKWh} kWh\n💰 *Amount Paid:* D${tx.amountDalasi} GMD\n📟 *Meter Number:* ${tx.meterNumber}\n📱 *Notification Phone:* ${tx.phone}\n📅 *Date:* ${new Date(tx.timestamp).toLocaleString()}\n\nRecharged via *SOHLA AI* — The Gambia's All-in-One Platform`;
  };

  // Format BOTH essentials into a unified shareable message
  const formatBothShare = () => {
    const activePlaces = favouritedPartnersList.length > 0
      ? favouritedPartnersList
      : partners.filter(p => p.id === 'bp-1' || p.id === 'bp-2');

    const placesText = activePlaces.length > 0
      ? activePlaces.map((p, i) => `${i + 1}. 🍽️ *${p.name}* (${p.location})\n   Rating: ${p.rating}★ • Tel/WA: ${p.phone} (${p.openingHours})`).join('\n\n')
      : '1. 🍽️ Senegambia Beach Terrace Restaurant • Kololi • +220 788 1234\n2. 🚖 Sunshine Yellow Taxi Service • Greater Banjul • +220 799 4321';

    const cashPowerText = savedCashPower.length > 0
      ? savedCashPower.map((tx, i) => `${i + 1}. 📟 Meter: *${tx.meterNumber}*\n   🔢 Token: *${tx.tokenGenerated}*\n   ⚡ Units: ${tx.unitsKWh} kWh • Amount: D${tx.amountDalasi} GMD`).join('\n\n')
      : '1. 📟 Meter: 0714-8892-3310\n   🔢 Token: 5144-9614-4016-9198-3944\n   ⚡ Units: 27.3 kWh • Amount: D300 GMD';

    return `🇬🇲 *My Saved SOHLA Gambia Essentials (Places & Cash Power)*\n\n📍 *Saved Places & Services:*\n${placesText}\n\n⚡ *Saved NAWEC Cash Power Tokens:*\n${cashPowerText}\n\nSave, manage, and recharge on *SOHLA AI* — The Gambia's All-in-One Platform`;
  };

  // WhatsApp helpers
  const shareBothWhatsApp = () => {
    const text = formatBothShare();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const shareBothMulti = () => {
    setGlobalSharePayload({
      title: 'My Saved SOHLA Gambia Essentials (Both)',
      subtitle: `${favouritedPartnersList.length || 2} Places & ${savedCashPower.length} NAWEC Tokens`,
      text: formatBothShare()
    });
    setIsGlobalShareOpen(true);
  };

  const sharePartnerWhatsApp = (p: BusinessPartner) => {
    const text = formatPartnerShare(p);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const sharePartnerMulti = (p: BusinessPartner) => {
    setGlobalSharePayload({
      title: `${p.name} (${p.location})`,
      subtitle: `${p.subcategory} • Rating: ${p.rating}★`,
      text: formatPartnerShare(p)
    });
    setIsGlobalShareOpen(true);
  };

  const shareCashPowerWhatsApp = (tx: CashPowerTransaction) => {
    const text = formatCashPowerShare(tx);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const shareCashPowerMulti = (tx: CashPowerTransaction) => {
    setGlobalSharePayload({
      title: `NAWEC Cash Power Token (${tx.unitsKWh} kWh)`,
      subtitle: `Meter: ${tx.meterNumber} • D${tx.amountDalasi} GMD`,
      text: formatCashPowerShare(tx)
    });
    setIsGlobalShareOpen(true);
  };

  const shareAppWhatsApp = () => {
    const text = `🇬🇲 *SOHLA AI — The Gambia's All-in-One Platform*\n\nFind verified local restaurants, order yellow taxis, recharge NAWEC Cash Power instantly, and get AI income opportunities!`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const shareAppMulti = () => {
    setGlobalSharePayload({
      title: 'SOHLA AI — The Gambia',
      subtitle: 'Verified local businesses, yellow taxis & instant NAWEC utility payments',
      text: 'Explore verified local restaurants, order yellow taxis, recharge NAWEC Cash Power, and access AI income opportunities on SOHLA AI!'
    });
    setIsGlobalShareOpen(true);
  };

  const copyToken = (tokenId: string, tokenStr: string) => {
    navigator.clipboard?.writeText(tokenStr.replace(/-/g, ''));
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const deleteCashPowerReceipt = (id: string) => {
    setSavedCashPower(prev => prev.filter(item => item.id !== id && item.tokenGenerated !== id));
  };

  // Favourited partners (ensures verified partners appear if available)
  const favouritedPartnersList = partners.filter(p => favourites.includes(p.id));

  return (
    <div className="min-h-screen bg-[#0C0704] flex items-center justify-center selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden p-0 sm:py-6 sm:px-4">
      {/* Mobile-First Device Container matching Reference Dimensions & Framing */}
      <div className="w-full max-w-[460px] sm:max-w-[480px] min-h-screen bg-[#FDFBF7] flex flex-col relative shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-x-hidden border-x border-[#3D2517] sm:rounded-[38px] sm:border-2 sm:border-[#4A2D1B]">

        {/* LEFT FLANK: Authentic West African Tribal Geometric Tapestry Border */}
        <div className="absolute top-0 bottom-0 left-0 w-6 sm:w-7 z-25 pointer-events-none select-none overflow-hidden border-r border-amber-950/50 shadow-[3px_0_12px_rgba(0,0,0,0.45)] bg-[#1A0E07]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="african-tribal-border" width="28" height="64" patternUnits="userSpaceOnUse">
                <rect width="28" height="64" fill="#140A04" />
                {/* Chevron geometric zig-zag bands */}
                <path d="M0,0 L14,16 L28,0 L28,8 L14,24 L0,8 Z" fill="#C83E28" />
                <path d="M0,16 L14,32 L28,16 L28,24 L14,40 L0,24 Z" fill="#F2AE2E" />
                <path d="M0,32 L14,48 L28,32 L28,40 L14,56 L0,40 Z" fill="#1E5936" />
                <path d="M0,48 L14,64 L28,48 L28,56 L14,72 L0,56 Z" fill="#1D4E89" />
                {/* Center diamond & accent dots */}
                <polygon points="14,8 20,16 14,24 8,16" fill="#FDE047" stroke="#111" strokeWidth="0.8" />
                <polygon points="14,40 20,48 14,56 8,48" fill="#F87171" stroke="#111" strokeWidth="0.8" />
                <circle cx="14,16" cy="16" r="1.5" fill="#000" />
                <circle cx="14,48" cy="48" r="1.5" fill="#000" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#african-tribal-border)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/50 pointer-events-none" />
        </div>

        {/* RIGHT FLANK: Tropical Palm Fronds and Waving Gambian National Flag */}
        <div className="absolute top-0 bottom-0 right-0 w-6 sm:w-7 z-25 pointer-events-none select-none overflow-hidden border-l border-amber-950/50 shadow-[-3px_0_12px_rgba(0,0,0,0.45)] bg-[#120904] flex flex-col justify-between">
          {/* Top arching palm fronds */}
          <div className="w-full pt-1 opacity-90">
            <svg className="w-full h-24 text-emerald-500" viewBox="0 0 30 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28,5 Q15,40 2,95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M25,20 Q12,30 2,42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22,35 Q10,48 2,62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M18,52 Q8,66 2,82" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Waving Gambian National Flag Strip */}
          <div className="w-full py-3 flex flex-col items-center justify-center space-y-1">
            <div className="w-4 h-24 rounded-md overflow-hidden border border-white/30 shadow-md flex flex-col">
              <div className="h-[36%] bg-[#CE1126]" />
              <div className="h-[8%] bg-[#FFFFFF]" />
              <div className="h-[24%] bg-[#0C1C8C]" />
              <div className="h-[8%] bg-[#FFFFFF]" />
              <div className="h-[36%] bg-[#3A7728]" />
            </div>
            <span className="text-[7px] font-black text-amber-400 tracking-tighter uppercase [writing-mode:vertical-rl] rotate-180">
              GAMBIA
            </span>
          </div>

          {/* Bottom palm fronds */}
          <div className="w-full pb-2 opacity-85">
            <svg className="w-full h-20 text-emerald-600" viewBox="0 0 30 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28,80 Q15,45 2,5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M25,60 Q12,50 2,38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22,45 Q10,32 2,18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* BOTTOM CORNER MEDALLIONS: Circular West African Kente Motif */}
        <div className="absolute bottom-18 -left-3 sm:-left-3.5 w-12 h-12 sm:w-14 sm:h-14 rounded-full z-26 pointer-events-none border-2 border-amber-400/80 shadow-2xl bg-[#1A0E07] overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="#140A04" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="50" cy="50" r="36" fill="#C83E28" stroke="#FDE047" strokeWidth="2" />
            <circle cx="50" cy="50" r="26" fill="#1E5936" stroke="#FDE047" strokeWidth="2" />
            <circle cx="50" cy="50" r="16" fill="#1D4E89" stroke="#FDE047" strokeWidth="2" />
            <polygon points="50,6 56,22 72,22 58,32 64,48 50,38 36,48 42,32 28,22 44,22" fill="#FBBF24" />
            <circle cx="50" cy="50" r="6" fill="#FBBF24" stroke="#111" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="absolute bottom-18 -right-3 sm:-right-3.5 w-12 h-12 sm:w-14 sm:h-14 rounded-full z-26 pointer-events-none border-2 border-amber-400/80 shadow-2xl bg-[#1A0E07] overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full p-0.5" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="46" fill="#140A04" stroke="#F59E0B" strokeWidth="3" />
            <circle cx="50" cy="50" r="36" fill="#C83E28" stroke="#FDE047" strokeWidth="2" />
            <circle cx="50" cy="50" r="26" fill="#1E5936" stroke="#FDE047" strokeWidth="2" />
            <circle cx="50" cy="50" r="16" fill="#1D4E89" stroke="#FDE047" strokeWidth="2" />
            <polygon points="50,6 56,22 72,22 58,32 64,48 50,38 36,48 42,32 28,22 44,22" fill="#FBBF24" />
            <circle cx="50" cy="50" r="6" fill="#FBBF24" stroke="#111" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Content Container padded to sit harmoniously between decorative flanks */}
        <div className="flex-1 flex flex-col pl-7 pr-7 sm:pl-8 sm:pr-8 relative z-10">
        {/* HERO REGION: Continuous Gambian Coastal Sunset Backdrop encompassing Header & Billboard */}
        <div className="relative w-full overflow-hidden bg-[#180E08] shrink-0">
          {/* Authentic Gambian Coastal Sunset & Wooden Fishing Boats Header Backdrop */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80"
              alt="Gambia Sunset Coast with Wooden Boats"
              className="w-full h-full object-cover object-center opacity-95 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-[#160E08]/85" />
            {/* Gambian Flag ribbon accent on top right matching reference */}
            <div className="absolute top-0 right-0 w-36 h-2.5 bg-gradient-to-r from-[#CE1126] via-[#FFFFFF] via-[#0C1C8C] via-[#FFFFFF] to-[#3A7728] opacity-95 shadow-md" />
          </div>

          <div className="relative z-10">
            {/* SOHLA Master Top Header */}
            <header className="w-full text-white px-3.5 pt-1.5 pb-1 space-y-1.5">
              {/* Status Bar matching reference: 11:18 Sun 20 Sept . 📍 💬 📞 • / 📶 📶 82 */}
              <div className="flex items-center justify-between text-[11px] text-white/90 font-medium px-0.5 select-none">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-white tracking-tight">11:18</span>
                  <span className="text-white/60">Sun 20 Sept</span>
                  <span className="text-white/40">•</span>
                  <span className="text-[10px] space-x-1 text-white/80">
                    <span>📍</span>
                    <span>💬</span>
                    <span>📞</span>
                    <span>•</span>
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] font-bold">
                  <span>📶</span>
                  <div className="flex items-center bg-black/40 border border-white/30 rounded-md px-1 py-0.2 text-[9px] font-black text-white">
                    82
                  </div>
                </div>
              </div>

              {/* Main Navigation & Branding Row */}
              <div className="flex items-center justify-between pt-0.5">
                {/* Brand Logo and Location Selector */}
                <div className="flex items-center space-x-1.5">
                  {/* SOHLA Golden-Orange S Square Logo */}
                  <div
                    className="flex items-center space-x-1.5 cursor-pointer select-none group active:scale-95 transition"
                    onClick={() => setActiveNavTab('home')}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-[#FFA726] to-[#F57C00] flex items-center justify-center text-slate-950 font-black text-lg shadow-md border border-amber-300/40 group-hover:scale-105 transition font-display">
                      S
                    </div>
                    <span className="font-black text-xl tracking-tight text-white font-display drop-shadow">
                      SOHLA
                    </span>
                  </div>

                  {/* Gambia Country Indicator Pill */}
                  <div className="flex items-center space-x-1 text-xs font-bold text-white bg-black/40 hover:bg-black/60 px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-md transition select-none shadow-xs">
                    <span className="text-xs">🇬🇲</span>
                    <span className="text-[11px]">Gambia</span>
                    <ChevronDown className="w-3 h-3 text-white/70" />
                  </div>

                  {/* Location Filter Pill (Brusubi / Senegambia / etc.) */}
                  <div className="relative">
                    <button
                      id="btn-header-location-picker"
                      onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)}
                      className="flex items-center space-x-1 text-xs font-bold text-amber-300 bg-black/45 hover:bg-black/65 px-2.5 py-1 rounded-full border border-amber-400/40 backdrop-blur-md transition cursor-pointer active:scale-95 select-none shadow-xs"
                      title="Change Gambian locality"
                    >
                      <MapPin className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] font-extrabold text-white">{selectedHubLocation}</span>
                      <ChevronDown className="w-3 h-3 text-amber-300/80" />
                    </button>

                    {/* Locality Dropdown */}
                    {isLocationMenuOpen && (
                      <div className="absolute left-0 mt-1.5 w-44 rounded-2xl bg-[#1C140D] border border-amber-500/30 shadow-2xl p-1.5 z-50 text-white backdrop-blur-lg animate-in fade-in zoom-in-95 duration-150">
                        <div className="text-[10px] uppercase font-bold text-amber-400/80 px-2 py-1 tracking-wider">
                          Select Local Hub
                        </div>
                        {[
                          'Brusubi',
                          'Senegambia',
                          'Kotu Beach',
                          'Fajara & Kairaba',
                          'Kololi',
                          'Serrekunda',
                          'Banjul City',
                          'Greater Banjul (All)'
                        ].map((loc) => (
                          <button
                            key={loc}
                            onClick={() => {
                              setSelectedHubLocation(loc);
                              setIsLocationMenuOpen(false);
                              if (loc !== 'Greater Banjul (All)') {
                                handleSearch(loc);
                              }
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                              selectedHubLocation === loc
                                ? 'bg-amber-500 text-stone-950 font-bold'
                                : 'hover:bg-white/10 text-stone-200'
                            }`}
                          >
                            <span>{loc}</span>
                            {selectedHubLocation === loc && <span>✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action controls: Search, Notification Bell, Cart/Saved */}
                <div className="flex items-center space-x-1.5">
                  <button
                    id="header-btn-search"
                    onClick={() => {
                      const searchInput = document.getElementById('main-search-input');
                      searchInput?.focus();
                    }}
                    className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer active:scale-95 transition shadow-xs"
                    title="Search SOHLA"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>

                  <button
                    id="header-btn-notifications"
                    onClick={() => handleOpenAI('What is new on SOHLA today in The Gambia?')}
                    className="relative w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white cursor-pointer active:scale-95 transition shadow-xs"
                    title="Notifications & Updates"
                  >
                    <Bell className="w-3.5 h-3.5 text-white/90" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center border border-black shadow">
                      2
                    </span>
                  </button>

                  <button
                    id="header-btn-saved"
                    onClick={() => setActiveNavTab('favourites')}
                    className="w-8 h-8 rounded-full bg-[#EAB308] hover:bg-[#FACC15] flex items-center justify-center text-slate-950 shadow-md transition active:scale-95 cursor-pointer"
                    title="Cart & Saved Items"
                  >
                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </header>

            {/* Top Video Advertisement Area inside Sunset Hero */}
            <TopVideoBillboard
              ads={ads}
              onOpenAI={() => handleOpenAI()}
              onSelectAdCta={(ad) => {
                if (ad.ctaLink?.includes('cashpower')) {
                  setIsCashPowerOpen(true);
                } else if (ad.ctaLink?.includes('sohla-ai')) {
                  handleOpenAI(ad.description);
                } else {
                  handleOpenAI(`Tell me about ${ad.advertiser} and their offer: ${ad.title}`);
                }
              }}
            />
          </div>
        </div>

        {/* Search Bar matching Reference Design */}
        <SearchBar
          onSearch={handleSearch}
          onOpenAI={handleOpenAI}
        />

        {/* Quick Gambian Hub & Platform Share Card */}
        <div className="mx-4 my-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-[#EBE3D7] shadow-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center border border-slate-200 shadow-xs">
              <span className="text-sm">🇬🇲</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-[#1F140D]">Verified The Gambia Hub</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={shareAppWhatsApp}
              className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold flex items-center space-x-1.5 text-xs transition shadow-xs active:scale-95 cursor-pointer"
              title="Share SOHLA on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
              <span>Share App</span>
            </button>
            <button
              onClick={shareAppMulti}
              className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition shadow-xs active:scale-95 cursor-pointer"
              title="Share to other platforms"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Views according to active Bottom Nav Tab */}
        <main className="flex-1 pb-24">
          {/* TAB 1: HOME (Trending Categories & Reference Design) */}
          {activeNavTab === 'home' && (
            <TrendingCategories
              categories={categories}
              onSelectCategory={handleSelectCategory}
              onOpenAI={handleOpenAI}
              onViewAll={() => setActiveNavTab('explore')}
            />
          )}

          {/* TAB 2: EXPLORE (All Categories, Partners & Utilities) */}
          {activeNavTab === 'explore' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-display">Explore The Gambia</h2>
                  <p className="text-xs text-slate-500">Verified directories and public digital utilities</p>
                </div>
              </div>

              {/* Utility shortcuts */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setIsCashPowerOpen(true)}
                  className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-left hover:bg-teal-100/70 transition cursor-pointer shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <div className="font-extrabold text-xs text-slate-900">NAWEC Cash Power</div>
                  <div className="text-[10px] text-teal-800">Prepaid meter recharge</div>
                </button>

                <button
                  onClick={() => setIsGovPaymentsOpen(true)}
                  className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-left hover:bg-purple-100/70 transition cursor-pointer shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2">
                    <Landmark className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-extrabold text-xs text-slate-900">Government (GRA)</div>
                  <div className="text-[10px] text-purple-800">Taxes & official rates</div>
                </button>

                <button
                  onClick={() => setIsAIJobsOpen(true)}
                  className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-left hover:bg-indigo-100/70 transition cursor-pointer shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2">
                    <Briefcase className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-extrabold text-xs text-slate-900">AI Jobs & Income</div>
                  <div className="text-[10px] text-indigo-800">Learn, work & earn</div>
                </button>

                <button
                  onClick={() => setIsPaymentsOpen(true)}
                  className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-left hover:bg-blue-100/70 transition cursor-pointer shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2">
                    <CreditCard className="w-4 h-4 text-white" />
                  </div>
                  <div className="font-extrabold text-xs text-slate-900">SOHLA Payments</div>
                  <div className="text-[10px] text-blue-800">Wave & QMoney money transfers</div>
                </button>
              </div>

              {/* SOHLA Marketplace Categories */}
              <div className="pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">
                  Browse Categories
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {categories.filter((c) => c.active !== false).map((cat) => (
                    <button
                      key={cat.id || cat.key}
                      onClick={() => handleSelectCategory(cat)}
                      className="p-2.5 rounded-2xl bg-white border border-[#EADBCA] hover:border-amber-400 text-left transition shadow-xs hover:shadow-sm cursor-pointer flex items-center space-x-2.5"
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#e11d48' }}
                      >
                        <span className="text-xs font-bold">{cat.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {cat.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {cat.subcategories?.[0] || 'Explore'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* All Verified Partners List */}
              <div className="pt-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2.5">
                  Verified Gambian Merchants ({partners.length})
                </h3>

                <div className="space-y-3">
                  {partners.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPartner(p)}
                      className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={p.logo || p.coverImage}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                        />
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h4 className="font-bold text-sm text-slate-900">{p.name}</h4>
                            <span className="text-[10px] text-amber-500 font-bold">★ {p.rating}</span>
                          </div>
                          <p className="text-xs text-slate-500">{p.location} • {p.subcategory}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavourite(p.id);
                          }}
                          className={`p-2 rounded-full transition ${
                            favourites.includes(p.id) ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${favourites.includes(p.id) ? 'fill-rose-500' : ''}`} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SOHLA Platform Footer with Direct Administration Links */}
              <div className="mt-8 pt-6 pb-4 border-t border-amber-900/10 text-center space-y-2.5">
                <div className="flex items-center justify-center space-x-1.5">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-b from-[#FFA726] to-[#F57C00] flex items-center justify-center text-slate-950 font-black text-xs">
                    S
                  </div>
                  <span className="font-extrabold text-xs text-stone-700 tracking-wider">SOHLA AI GAMBIA</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  The Gambia's Everyday Platform • Banjul, Serrekunda, Kololi & Brusubi
                </p>
                <div className="flex items-center justify-center space-x-3 text-xs pt-1">
                  <button
                    onClick={async () => {
                      setAdminViewMode('control_center');
                      const valid = await verifyServerSession();
                      if (valid) {
                        setIsAdminPortalOpen(true);
                      } else {
                        setIsAdminLoginOpen(true);
                      }
                    }}
                    className="text-stone-500 hover:text-amber-600 font-semibold transition flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Control Center</span>
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    onClick={async () => {
                      setAdminViewMode('classic');
                      const valid = await verifyServerSession();
                      if (valid) {
                        setIsAdminPortalOpen(true);
                      } else {
                        setIsAdminLoginOpen(true);
                      }
                    }}
                    className="text-stone-500 hover:text-purple-600 font-semibold transition flex items-center space-x-1"
                  >
                    <Lock className="w-3 h-3 text-purple-400" />
                    <span>Classic Admin</span>
                  </button>
                  <span className="text-stone-300">•</span>
                  <button
                    onClick={() => {
                      setSelectedPartnerForPortal(null);
                      setIsPartnerPortalOpen(true);
                    }}
                    className="text-stone-500 hover:text-stone-700 font-semibold transition"
                  >
                    Merchant Portal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED HUB & FAVOURITES (Both Places & NAWEC Cash Power) */}
          {activeNavTab === 'favourites' && (
            <div className="p-4 space-y-4">
              {/* Header Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-display">Saved Hub & Favourites</h2>
                  <p className="text-xs text-slate-500">Your saved Gambian businesses & NAWEC Cash Power tokens</p>
                </div>
                <button
                  onClick={shareBothWhatsApp}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center space-x-1.5 shadow-sm transition"
                  title="Quick share both on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share Both</span>
                </button>
              </div>

              {/* Master Share Both Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white shadow-md border border-purple-500/20 space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                    🇬🇲
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Save & Share Both Essentials</h3>
                    <p className="text-[11px] text-purple-200">
                      Export your saved places & NAWEC Cash Power tokens to WhatsApp, SMS, or social platforms.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={shareBothWhatsApp}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Both</span>
                  </button>
                  <button
                    onClick={shareBothMulti}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center space-x-1.5 border border-white/20 transition active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-purple-300" />
                    <span>Other Platforms</span>
                  </button>
                </div>
              </div>

              {/* Segmented Filter Controls */}
              <div className="flex items-center space-x-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setSavedFilter('all')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    savedFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All (Both) ({favouritedPartnersList.length + savedCashPower.length})
                </button>
                <button
                  onClick={() => setSavedFilter('places')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    savedFilter === 'places'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Places ({favouritedPartnersList.length})
                </button>
                <button
                  onClick={() => setSavedFilter('cashpower')}
                  className={`flex-1 py-1.5 rounded-lg transition text-center ${
                    savedFilter === 'cashpower'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cash Power ({savedCashPower.length})
                </button>
              </div>

              {/* 1. SAVED PLACES SECTION */}
              {(savedFilter === 'all' || savedFilter === 'places') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                      Saved Places & Services ({favouritedPartnersList.length})
                    </span>
                    {favouritedPartnersList.length > 0 && (
                      <button
                        onClick={() => {
                          const text = favouritedPartnersList.map(p => formatPartnerShare(p)).join('\n\n---\n\n');
                          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>Share Places</span>
                      </button>
                    )}
                  </div>

                  {favouritedPartnersList.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                      <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No saved places yet</p>
                      <p className="text-[11px] text-slate-500">Tap the heart icon on any partner card to pin them here.</p>
                      <button
                        onClick={() => setActiveNavTab('explore')}
                        className="mt-1 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold"
                      >
                        Browse Directory
                      </button>
                    </div>
                  ) : (
                    favouritedPartnersList.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                      >
                        <div
                          onClick={() => setSelectedPartner(p)}
                          className="flex items-start justify-between cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={p.logo || p.coverImage}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                            />
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 flex items-center space-x-1">
                                <span>{p.name}</span>
                                {p.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                              </h4>
                              <p className="text-xs text-slate-500">{p.subcategory} • {p.location}</p>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className="text-[10px] text-amber-600 font-bold">★ {p.rating}</span>
                                <span className="text-[10px] text-emerald-600 font-semibold">● Open Now</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavourite(p.id);
                            }}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition"
                            title="Remove from saved"
                          >
                            <Heart className="w-4 h-4 fill-rose-500" />
                          </button>
                        </div>

                        {/* Action Buttons: WhatsApp, Multi-Share, Call */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => sharePartnerWhatsApp(p)}
                            className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-1 border border-emerald-200 transition"
                            title="Share partner on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                          <button
                            onClick={() => sharePartnerMulti(p)}
                            className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1 border border-slate-200 transition"
                            title="Share on other platforms"
                          >
                            <Share2 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Share</span>
                          </button>
                          <a
                            href={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                            className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1 border border-slate-200 transition"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-600" />
                            <span>Call</span>
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 2. SAVED NAWEC CASH POWER SECTION */}
              {(savedFilter === 'all' || savedFilter === 'cashpower') && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600">
                      Saved NAWEC Cash Power Tokens ({savedCashPower.length})
                    </span>
                    <button
                      onClick={() => setIsCashPowerOpen(true)}
                      className="text-[11px] font-bold text-purple-700 hover:underline flex items-center space-x-0.5"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>+ Buy Token</span>
                    </button>
                  </div>

                  {savedCashPower.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
                      <Zap className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">No Cash Power tokens saved yet</p>
                      <p className="text-[11px] text-slate-500">Recharge any meter to save your official token receipt here.</p>
                      <button
                        onClick={() => setIsCashPowerOpen(true)}
                        className="mt-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold"
                      >
                        Buy Cash Power
                      </button>
                    </div>
                  ) : (
                    savedCashPower.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
                      >
                        {/* Token Card Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                              <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-slate-900">Meter: {tx.meterNumber}</span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  VERIFIED
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(tx.timestamp).toLocaleDateString()} • {tx.unitsKWh} kWh (D{tx.amountDalasi} GMD)
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteCashPowerReceipt(tx.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* 20-digit Keypad Token Display with 1-Click Copy */}
                        <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-center relative border border-slate-800">
                          <div className="text-xs text-slate-400 font-sans mb-0.5">20-Digit NAWEC Keypad Token:</div>
                          <div className="text-sm sm:text-base font-black tracking-widest text-emerald-400">
                            {tx.tokenGenerated}
                          </div>
                          <button
                            onClick={() => copyToken(tx.id, tx.tokenGenerated)}
                            className="mt-1.5 py-1 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-sans font-bold inline-flex items-center space-x-1.5 transition cursor-pointer"
                          >
                            {copiedTokenId === tx.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied to Clipboard!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-400" />
                                <span>Copy Token Code</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Actions: WhatsApp Share, Multi-Platform Share */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => shareCashPowerWhatsApp(tx)}
                            className="py-1.5 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-1.5 border border-emerald-200 transition"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Share on WhatsApp</span>
                          </button>
                          <button
                            onClick={() => shareCashPowerMulti(tx)}
                            className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-200 transition"
                          >
                            <Share2 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Other Platforms</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACCOUNT & ADMIN COMMAND ACCESS */}
          {activeNavTab === 'account' && (
            <div className="p-4 space-y-4">
              {/* User Profile Header */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-md flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xl font-black">
                  GM
                </div>
                <div>
                  <h3 className="font-extrabold text-base font-display">SOHLA Community User</h3>
                  <p className="text-xs text-purple-200 mt-0.5">Banjul / Greater Banjul Area 🇬🇲</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                    Standard Member
                  </span>
                </div>
              </div>

              {/* My Beauty Bookings & Delivery Requests */}
              <CustomerServicesAccountSection
                partners={partners}
                onOpenBeautyBooking={() => {
                  const beautyPartner = partners.find(p => p.category === 'BEAUTY & WELLNESS') || null;
                  setActiveBookingPartner(beautyPartner);
                  setIsBeautyBookingOpen(true);
                }}
                onOpenDeliveryRequest={() => {
                  const deliveryPartner = partners.find(p => p.category === 'DELIVERY & ERRANDS') || null;
                  setActiveDeliveryPartner(deliveryPartner);
                  setIsDeliveryRequestOpen(true);
                }}
                onSelectPartner={(partner) => {
                  setSelectedPartner(partner);
                }}
              />

              {/* SOHLA Platform Information */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-xs">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                  About SOHLA AI
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  SOHLA AI is The Gambia's all-in-one platform unifying verified local businesses, yellow taxis, dining, utilities, NAWEC Cash Power recharges, and AI income opportunities under a single modern interface.
                </p>
                <div className="pt-2 border-t border-slate-100 text-slate-500 flex justify-between">
                  <span>Version: 1.0.4 Upgraded</span>
                  <span>Database: Verified In-Memory & JSON</span>
                </div>
              </div>

              {/* Share SOHLA with Friends & Family */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Share SOHLA with Friends & Family</h4>
                    <p className="text-[11px] text-slate-500">The Gambia's unified all-in-one local portal</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={shareAppWhatsApp}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={shareAppMulti}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-200 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Other Platforms</span>
                  </button>
                </div>
              </div>

              {/* SOHLA Business Owner / Merchant Gateway */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3 shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">For Business Owners & Merchants</h4>
                    <p className="text-[11px] text-stone-500">Claim your business listing or manage catalog items</p>
                  </div>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Keep your phone number, opening hours, delivery fees, and product prices updated in real-time across SOHLA and the AI brain.
                </p>

                <button
                  id="btn-open-partner-portal"
                  onClick={() => {
                    setSelectedPartnerForPortal(null);
                    setIsPartnerPortalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Enter Business Owner Portal</span>
                </button>
              </div>

              {/* Platform Administration Gateway — Always visible for platform administrators */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-purple-500/30 space-y-3 shadow-lg">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm font-display text-white">SOHLA Administration</h4>
                    <p className="text-[11px] text-purple-300">Protected portals for authorized staff & platform administrators</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  Control partner verification, catalog items, video billboards, AI knowledge, delivery dispatch, and security logs.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-open-control-center"
                    onClick={async () => {
                      setAdminViewMode('control_center');
                      const valid = await verifyServerSession();
                      if (valid) {
                        setIsAdminPortalOpen(true);
                      } else {
                        setIsAdminLoginOpen(true);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Control Center</span>
                  </button>

                  <button
                    id="btn-open-admin-portal"
                    onClick={async () => {
                      setAdminViewMode('classic');
                      const valid = await verifyServerSession();
                      if (valid) {
                        setIsAdminPortalOpen(true);
                      } else {
                        setIsAdminLoginOpen(true);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs shadow-sm active:scale-95 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>Classic Admin</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Floating Bottom Navigation Bar matching reference design */}
        <nav
          id="sohla-bottom-navigation"
          className="sticky bottom-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-t border-[#EAE2D5] py-2 px-4 flex items-center justify-between z-30 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] rounded-t-2xl sm:rounded-b-[34px]"
        >
          {/* Home Tab */}
          <button
            id="nav-tab-home"
            onClick={() => setActiveNavTab('home')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeNavTab === 'home' ? 'text-[#7C3AED]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* Explore Tab */}
          <button
            id="nav-tab-explore"
            onClick={() => setActiveNavTab('explore')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeNavTab === 'explore' ? 'text-[#7C3AED]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Compass className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Explore</span>
          </button>

          {/* Center Raised Floating SOHLA AI Mascot Button matching reference */}
          <div className="relative -top-5 flex flex-col items-center">
            <button
              id="btn-center-sohla-ai"
              onClick={() => handleOpenAI()}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[2.5px] shadow-[0_0_18px_rgba(124,58,237,0.5)] hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Ask SOHLA AI"
            >
              <div className="w-full h-full rounded-full bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Visor eyes */}
                <div className="w-6 h-3 rounded-full bg-slate-900 border border-cyan-400/90 flex items-center justify-center space-x-1 mt-0.5 shadow-inner">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8] animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8] animate-pulse" />
                </div>
                {/* SOHLA Label inside the glowing button */}
                <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest mt-1">
                  SOHLA
                </span>
              </div>
            </button>
          </div>

          {/* Favourites Tab */}
          <button
            id="nav-tab-favourites"
            onClick={() => setActiveNavTab('favourites')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeNavTab === 'favourites' ? 'text-[#7C3AED]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Heart className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Favourites</span>
          </button>

          {/* Account Tab */}
          <button
            id="nav-tab-account"
            onClick={() => setActiveNavTab('account')}
            className={`flex flex-col items-center justify-center space-y-1 py-1 px-2.5 rounded-xl transition cursor-pointer ${
              activeNavTab === 'account' ? 'text-[#7C3AED]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold">Account</span>
          </button>
        </nav>
        </div>
      </div>

      {/* SOHLA AI Assistant Modal */}
      <SohlaChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        initialPrompt={aiPrompt}
        onSelectPartner={(p) => {
          setSelectedPartner(p);
          setIsAIChatOpen(false);
        }}
      />

      {/* Partner Directory / Detail Modal */}
      <PartnerDirectoryModal
        isOpen={selectedCategory !== null || selectedPartner !== null}
        onClose={() => {
          setSelectedCategory(null);
          setSelectedPartner(null);
        }}
        category={selectedCategory}
        partners={partners}
        selectedPartner={selectedPartner}
        onSelectPartner={(p) => setSelectedPartner(p)}
        onOpenAI={(q) => {
          setSelectedCategory(null);
          setSelectedPartner(null);
          handleOpenAI(q);
        }}
        favourites={favourites}
        onToggleFavourite={toggleFavourite}
        onPartnerUpdated={(updated) => {
          setPartners(prev => prev.map(p => p.id === updated.id ? updated : p));
          setSelectedPartner(updated);
        }}
        onOpenPartnerPortal={(p) => {
          setSelectedPartnerForPortal(p);
          setIsPartnerPortalOpen(true);
        }}
      />

      {/* Business Owner / Merchant Portal Modal */}
      <PartnerPortalModal
        isOpen={isPartnerPortalOpen}
        onClose={() => setIsPartnerPortalOpen(false)}
        partners={partners}
        initialPartner={selectedPartnerForPortal}
        onPartnerUpdated={(updated) => {
          setPartners(prev => prev.map(p => p.id === updated.id ? updated : p));
          if (selectedPartner?.id === updated.id) setSelectedPartner(updated);
        }}
      />

      {/* NAWEC Cash Power Modal */}
      <CashPowerModal
        isOpen={isCashPowerOpen}
        onClose={() => setIsCashPowerOpen(false)}
        onSaveTransaction={(tx) => setSavedCashPower(prev => [tx, ...prev.filter(x => x.id !== tx.id)])}
      />

      {/* Government Payments Modal */}
      <GovernmentPaymentsModal
        isOpen={isGovPaymentsOpen}
        onClose={() => setIsGovPaymentsOpen(false)}
      />

      {/* AI Jobs & Income Modal */}
      <AIJobsModal
        isOpen={isAIJobsOpen}
        onClose={() => setIsAIJobsOpen(false)}
        onOpenAI={handleOpenAI}
      />

      {/* Payments Modal */}
      <PaymentsModal
        isOpen={isPaymentsOpen}
        onClose={() => setIsPaymentsOpen(false)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
        targetPortal={adminViewMode}
      />

      {/* Full-Screen Private Admin Portal or SOHLA Control Center */}
      {isAdminPortalOpen && adminUser && (
        adminViewMode === 'control_center' ? (
          <ControlCenter
            currentUser={adminUser}
            token={adminToken}
            onLogout={handleAdminLogout}
            onClose={() => {
              setIsAdminPortalOpen(false);
              fetchData();
            }}
            onDataUpdated={fetchData}
            onSwitchToClassicAdmin={() => setAdminViewMode('classic')}
          />
        ) : (
          <AdminPortal
            currentUser={adminUser}
            token={adminToken}
            onLogout={handleAdminLogout}
            onClosePortal={() => setIsAdminPortalOpen(false)}
            onSyncData={fetchData}
            onSwitchToControlCenter={() => setAdminViewMode('control_center')}
          />
        )
      )}

      {/* Global Multi-Platform Share Modal */}
      <ShareModal
        isOpen={isGlobalShareOpen}
        onClose={() => setIsGlobalShareOpen(false)}
        shareData={globalSharePayload}
      />

      {/* Direct Beauty Booking Modal */}
      <BeautyBookingModal
        isOpen={isBeautyBookingOpen}
        onClose={() => setIsBeautyBookingOpen(false)}
        partner={activeBookingPartner}
        onBookingSuccess={() => {
          setIsBeautyBookingOpen(false);
        }}
      />

      {/* Direct Delivery Request Modal */}
      <DeliveryRequestModal
        isOpen={isDeliveryRequestOpen}
        onClose={() => setIsDeliveryRequestOpen(false)}
        preferredPartner={activeDeliveryPartner}
        partners={partners}
        onRequestSuccess={() => {
          setIsDeliveryRequestOpen(false);
        }}
      />
    </div>
  );
}
