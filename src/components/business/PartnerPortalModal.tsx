import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  Truck,
  Plus,
  Trash2,
  Edit3,
  Save,
  Lock,
  Shield,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  LogOut,
  RefreshCw,
  Eye
} from 'lucide-react';
import { BusinessPartner, BusinessOwner, ProductItem, ServiceItem } from '../../types';

interface PartnerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  partners: BusinessPartner[];
  initialPartner?: BusinessPartner | null;
  onPartnerUpdated?: (updatedPartner: BusinessPartner) => void;
}

export const PartnerPortalModal: React.FC<PartnerPortalModalProps> = ({
  isOpen,
  onClose,
  partners,
  initialPartner,
  onPartnerUpdated
}) => {
  // Modes: 'auth' | 'claim' | 'portal'
  const [viewMode, setViewMode] = useState<'auth' | 'claim' | 'portal'>('auth');
  const [activePartner, setActivePartner] = useState<BusinessPartner | null>(initialPartner || null);
  const [currentOwner, setCurrentOwner] = useState<BusinessOwner | null>(null);
  const [merchantToken, setMerchantToken] = useState<string>('');

  // Portal tabs: 'profile' | 'products' | 'services' | 'status'
  const [activeTab, setActiveTab] = useState<'profile' | 'products' | 'services' | 'status'>('profile');

  // Form states for login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPartnerId, setLoginPartnerId] = useState(initialPartner?.id || '');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Form states for claim
  const [claimPartnerId, setClaimPartnerId] = useState(initialPartner?.id || '');
  const [claimOwnerName, setClaimOwnerName] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimNin, setClaimNin] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  // Edit profile state
  const [editForm, setEditForm] = useState({
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    openingHours: '',
    deliveryAvailable: false,
    deliveryFee: 0,
    estimatedDeliveryTime: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Product addition state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(150);
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductStock, setNewProductStock] = useState(20);

  // Sync initial partner when opened
  useEffect(() => {
    if (initialPartner) {
      setActivePartner(initialPartner);
      setLoginPartnerId(initialPartner.id);
      setClaimPartnerId(initialPartner.id);
    }
  }, [initialPartner]);

  // Sync edit form when activePartner changes
  useEffect(() => {
    if (activePartner) {
      setEditForm({
        description: activePartner.description || '',
        phone: activePartner.phone || '',
        whatsapp: activePartner.whatsapp || '',
        email: activePartner.email || '',
        address: activePartner.address || '',
        openingHours: activePartner.openingHours || '',
        deliveryAvailable: activePartner.deliveryAvailable || false,
        deliveryFee: activePartner.deliveryFee || 0,
        estimatedDeliveryTime: activePartner.estimatedDeliveryTime || '30-45 mins'
      });
    }
  }, [activePartner]);

  if (!isOpen) return null;

  // Handler: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/partner-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone,
          partnerId: loginPartnerId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentOwner(data.owner);
        setActivePartner(data.partner);
        setMerchantToken(data.token);
        setViewMode('portal');
      } else {
        setLoginError(data.error || 'Failed to authenticate merchant');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Network error');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handler: Claim submission
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess('');
    setClaimLoading(true);

    try {
      const res = await fetch('/api/partner-portal/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: claimPartnerId,
          ownerName: claimOwnerName,
          phone: claimPhone,
          email: claimEmail,
          nationalIdOrNin: claimNin,
          notes: claimNotes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setClaimSuccess(data.message || 'Claim submitted successfully!');
        setTimeout(() => {
          setViewMode('auth');
          setLoginPhone(claimPhone);
        }, 2500);
      } else {
        setClaimError(data.error || 'Failed to submit claim');
      }
    } catch (err: any) {
      setClaimError(err.message || 'Network error');
    } finally {
      setClaimLoading(false);
    }
  };

  // Handler: Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner) return;
    setIsSavingProfile(true);
    setSaveSuccessMsg('');

    try {
      const res = await fetch('/api/partner-portal/submit-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: activePartner.id,
          ownerId: currentOwner?.id,
          ownerName: currentOwner?.ownerName || 'Verified Merchant',
          changes: editForm
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMsg('Updates submitted to SOHLA Operations! Changes will reflect once approved.');
        // Optimistically update local activePartner view
        const updated = { ...activePartner, ...editForm };
        setActivePartner(updated);
        if (onPartnerUpdated) onPartnerUpdated(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler: Add product to partner
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePartner || !newProductName.trim()) return;

    const newProd: ProductItem = {
      id: `prod-${Date.now()}`,
      partnerId: activePartner.id,
      name: newProductName.trim(),
      price: Number(newProductPrice),
      currency: 'GMD',
      category: activePartner.category as string,
      stock: Number(newProductStock),
      available: true,
      description: newProductDesc.trim(),
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    };

    try {
      const res = await fetch('/api/partner-portal/submit-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: activePartner.id,
          ownerId: currentOwner?.id,
          ownerName: currentOwner?.ownerName || 'Verified Merchant',
          changes: {
            products: [...(activePartner.products || []), newProd]
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        const updated = {
          ...activePartner,
          products: [...(activePartner.products || []), newProd]
        };
        setActivePartner(updated);
        if (onPartnerUpdated) onPartnerUpdated(updated);
        setIsAddingProduct(false);
        setNewProductName('');
        setNewProductDesc('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-stone-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white font-display">
                  SOHLA Partner Portal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Business Owner
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {viewMode === 'portal' && activePartner
                  ? `Managing: ${activePartner.name}`
                  : 'Manage your verified business listing on SOHLA'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'portal' && (
              <button
                onClick={() => {
                  setCurrentOwner(null);
                  setActivePartner(null);
                  setViewMode('auth');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition flex items-center gap-1.5"
                title="Sign out of Partner Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* VIEW MODE 1: AUTHENTICATION / LOGIN */}
          {viewMode === 'auth' && (
            <div className="max-w-md mx-auto space-y-5">
              <div className="text-center space-y-1.5">
                <h4 className="text-lg font-bold text-white">Merchant Login</h4>
                <p className="text-xs text-stone-400">
                  Enter your registered phone number or select your business to access your owner controls.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Select Your Business
                  </label>
                  <select
                    value={loginPartnerId}
                    onChange={(e) => setLoginPartnerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose your registered establishment --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1.5">
                    Registered Mobile / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+220 788 1234 or phone on profile"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-stone-400 mt-1">
                    Matching phone registered on your business profile automatically authenticates you.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loginLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Owner Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Enter Business Management</span>
                    </>
                  )}
                </button>
              </form>

              <div className="pt-4 border-t border-stone-800 text-center space-y-2">
                <p className="text-xs text-stone-400">
                  Not registered as the verified owner yet?
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode('claim')}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs font-bold border border-amber-500/20 transition cursor-pointer"
                >
                  Claim Your Business Listing Now
                </button>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: CLAIM BUSINESS */}
          {viewMode === 'claim' && (
            <div className="max-w-md mx-auto space-y-5">
              <div className="text-center space-y-1.5">
                <h4 className="text-lg font-bold text-white">Claim Your Business Listing</h4>
                <p className="text-xs text-stone-400">
                  Are you the owner or authorized manager of a listing on SOHLA? Submit verification details to gain full access.
                </p>
              </div>

              {claimSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{claimSuccess}</span>
                </div>
              )}

              {claimError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{claimError}</span>
                </div>
              )}

              <form onSubmit={handleClaim} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Select Business to Claim *
                  </label>
                  <select
                    required
                    value={claimPartnerId}
                    onChange={(e) => setClaimPartnerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose business --</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Owner / Manager Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lamin Touray"
                      value={claimOwnerName}
                      onChange={(e) => setClaimOwnerName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Mobile / WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+220 788 1234"
                      value={claimPhone}
                      onChange={(e) => setClaimPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="owner@domain.gm"
                      value={claimEmail}
                      onChange={(e) => setClaimEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      TIN or NIN Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GMB-TIN-892"
                      value={claimNin}
                      onChange={(e) => setClaimNin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 mb-1">
                    Verification Note / Proof of Ownership
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly state your role or provide a reference to expedite verification..."
                    value={claimNotes}
                    onChange={(e) => setClaimNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('auth')}
                    className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold transition cursor-pointer"
                  >
                    Back to Login
                  </button>
                  <button
                    type="submit"
                    disabled={claimLoading}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {claimLoading ? 'Submitting Claim...' : 'Submit Claim Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* VIEW MODE 3: AUTHENTICATED PARTNER PORTAL DASHBOARD */}
          {viewMode === 'portal' && activePartner && (
            <div className="space-y-5">
              
              {/* Top Business Status Card */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={activePartner.logo}
                    alt={activePartner.name}
                    className="w-12 h-12 rounded-xl object-cover border border-stone-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-base text-white">{activePartner.name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {activePartner.verificationStatus === 'verified' ? 'Verified Partner' : 'Claimed'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span>{activePartner.location} • {activePartner.subcategory}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[11px] text-stone-400">Owner Access</div>
                    <div className="text-xs font-bold text-amber-400">
                      {currentOwner?.ownerName || activePartner.owner || 'Verified Merchant'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Profile | Products & Services | Verification */}
              <div className="flex border-b border-stone-800 gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                    activeTab === 'profile'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Business Info & Hours
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-2 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                    activeTab === 'products'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Products & Menu ({activePartner.products?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('status')}
                  className={`py-2 px-3 text-xs font-bold border-b-2 transition ${
                    activeTab === 'status'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Approval Status & Audit
                </button>
              </div>

              {/* Sub-Tab 1: Profile & Hours */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {saveSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-stone-300 mb-1">
                      Business Description
                    </label>
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Phone Call Line
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        WhatsApp Number
                      </label>
                      <input
                        type="text"
                        value={editForm.whatsapp}
                        onChange={(e) => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Opening Hours
                      </label>
                      <input
                        type="text"
                        value={editForm.openingHours}
                        onChange={(e) => setEditForm(prev => ({ ...prev, openingHours: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-300 mb-1">
                        Physical Address
                      </label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Delivery Settings */}
                  <div className="p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs text-white">Delivery Available</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={editForm.deliveryAvailable}
                        onChange={(e) => setEditForm(prev => ({ ...prev, deliveryAvailable: e.target.checked }))}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                    </div>

                    {editForm.deliveryAvailable && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-700">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Delivery Fee (GMD)
                          </label>
                          <input
                            type="number"
                            value={editForm.deliveryFee}
                            onChange={(e) => setEditForm(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
                            className="w-full px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-stone-300 mb-1">
                            Estimated Delivery Time
                          </label>
                          <input
                            type="text"
                            value={editForm.estimatedDeliveryTime}
                            onChange={(e) => setEditForm(prev => ({ ...prev, estimatedDeliveryTime: e.target.value }))}
                            className="w-full px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingProfile ? 'Saving...' : 'Submit Profile Updates'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Sub-Tab 2: Products */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-stone-400">
                      Manage items shown in your catalog to customers and SOHLA AI search.
                    </div>
                    <button
                      onClick={() => setIsAddingProduct(!isAddingProduct)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  {isAddingProduct && (
                    <form onSubmit={handleAddProduct} className="p-3.5 rounded-2xl bg-stone-800 border border-amber-500/30 space-y-3">
                      <div className="text-xs font-bold text-amber-400">Add New Product to Catalog</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Product Name"
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs"
                        />
                        <input
                          type="number"
                          required
                          placeholder="Price in Dalasi (GMD)"
                          value={newProductPrice}
                          onChange={(e) => setNewProductPrice(Number(e.target.value))}
                          className="px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newProductDesc}
                        onChange={(e) => setNewProductDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-white text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingProduct(false)}
                          className="px-3 py-1.5 rounded-xl bg-stone-700 text-stone-300 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold"
                        >
                          Save Product
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(activePartner.products || []).map(p => (
                      <div key={p.id} className="p-3 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-emerald-400 font-bold text-xs mt-0.5">
                            D{p.price?.toLocaleString()} GMD
                          </div>
                          {p.description && (
                            <div className="text-[11px] text-stone-400 max-w-[200px] truncate mt-0.5">
                              {p.description}
                            </div>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-700 text-stone-300">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Approval Status */}
              {activeTab === 'status' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <Shield className="w-4 h-4" />
                      <span>Security & Merchant Clearance</span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed">
                      Your business profile changes are directly synced to SOHLA AI's search index. Super Admin approvals ensure all directory records meet national standards and customer safety guarantees.
                    </p>
                    <div className="pt-2 border-t border-stone-800 flex justify-between text-[11px] text-stone-500">
                      <span>Verification Level: Tier 2 Merchant</span>
                      <span>SOHLA Direct ID: {activePartner.id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
