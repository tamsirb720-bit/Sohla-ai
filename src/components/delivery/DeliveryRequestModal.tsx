import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  MapPin,
  Package,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Navigation,
  ShieldCheck,
  MessageCircle,
  Banknote,
  CreditCard,
  Building,
  User
} from 'lucide-react';
import { BusinessPartner, DeliveryRequest, PaymentMethod, DeliveryType } from '../../types';

interface DeliveryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredPartner?: BusinessPartner | null;
  partners?: BusinessPartner[];
  onRequestSuccess?: (delivery: DeliveryRequest) => void;
}

const GAMBIAN_AREAS = [
  'Senegambia',
  'Kololi',
  'Kairaba Avenue',
  'Fajara',
  'Banjul (Capital)',
  'Serekunda',
  'Brusubi Phase 1 & 2',
  'Bakau',
  'Bijilo',
  'Kotu',
  'Sukuta',
  'Latrikunda',
  'Kanifing Institutional Area',
  'Pipeline',
  'Kerr Serign',
  'Wellingara',
  'Brikama'
];

const DELIVERY_TYPES: { id: DeliveryType; label: string; desc: string; baseFee: number }[] = [
  {
    id: 'Express Courier',
    label: 'Express Courier',
    desc: 'Door-to-door point parcel transit within Greater Banjul',
    baseFee: 120
  },
  {
    id: 'Food Delivery',
    label: 'Food & Restaurant',
    desc: 'Insulated hot/cold food bag dispatch',
    baseFee: 100
  },
  {
    id: 'Market Errand',
    label: 'Market Errand',
    desc: 'Serekunda or Albert Market shopping & item purchase',
    baseFee: 200
  },
  {
    id: 'Document Dispatch',
    label: 'Urgent Documents',
    desc: 'Bank cheques, office contracts, legal passports in secure pouch',
    baseFee: 150
  },
  {
    id: 'Fragile Parcel',
    label: 'Fragile & Cakes',
    desc: 'Cake boxes, glassware, delicate electronics with gentle handling',
    baseFee: 180
  }
];

export const DeliveryRequestModal: React.FC<DeliveryRequestModalProps> = ({
  isOpen,
  onClose,
  preferredPartner,
  partners = [],
  onRequestSuccess
}) => {
  // Steps: 1: Delivery Type & Route, 2: Package Info & Courier, 3: Review & Submit, 4: Confirmation / Tracker
  const [step, setStep] = useState<number>(1);

  // Form states
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('Express Courier');
  const [pickupLocation, setPickupLocation] = useState<string>('Senegambia');
  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [pickupContactName, setPickupContactName] = useState<string>('');
  const [pickupContactPhone, setPickupContactPhone] = useState<string>('+220 ');

  const [destinationLocation, setDestinationLocation] = useState<string>('Kololi');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('+220 ');

  const [packageDescription, setPackageDescription] = useState<string>('');
  const [packageWeightApprox, setPackageWeightApprox] = useState<string>('Standard (<5kg)');
  const [fragile, setFragile] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Selected courier partner
  const deliveryPartners = partners.filter(p => p.category === 'DELIVERY & ERRANDS');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(
    preferredPartner?.id || (deliveryPartners[0]?.id || 'bp-4')
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedDelivery, setConfirmedDelivery] = useState<DeliveryRequest | null>(null);

  // Pre-fill user information from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedPhone = localStorage.getItem('sohla_customer_phone');
      const savedName = localStorage.getItem('sohla_customer_name');
      if (savedPhone) {
        setPickupContactPhone(savedPhone);
      }
      if (savedName) {
        setPickupContactName(savedName);
      }
      if (preferredPartner?.id) {
        setSelectedPartnerId(preferredPartner.id);
      }
      setErrorMessage(null);
      setConfirmedDelivery(null);
      setStep(1);
    }
  }, [isOpen, preferredPartner]);

  if (!isOpen) return null;

  // Selected courier partner details
  const activeCourier = deliveryPartners.find(p => p.id === selectedPartnerId) || deliveryPartners[0];

  // Base fee calculation
  const typeObj = DELIVERY_TYPES.find(t => t.id === deliveryType) || DELIVERY_TYPES[0];
  const calculatedFee = typeObj.baseFee;

  const handleSubmit = async () => {
    setErrorMessage(null);
    if (!pickupAddress.trim()) {
      setErrorMessage('Please provide a specific pickup address or landmark.');
      return;
    }
    if (!pickupContactPhone.trim() || pickupContactPhone.trim().length < 8) {
      setErrorMessage('Please provide a valid Gambian pickup phone number.');
      return;
    }
    if (!destinationAddress.trim()) {
      setErrorMessage('Please provide a specific destination address or landmark.');
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.trim().length < 8) {
      setErrorMessage('Please provide the recipient’s Gambian phone number.');
      return;
    }
    if (!packageDescription.trim()) {
      setErrorMessage('Please describe the items to be dispatched.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/delivery-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryType,
          pickupLocation,
          pickupAddress: pickupAddress.trim(),
          pickupContactName: pickupContactName.trim() || 'Sender',
          pickupContactPhone: pickupContactPhone.trim(),
          destinationLocation,
          destinationAddress: destinationAddress.trim(),
          recipientName: recipientName.trim() || 'Recipient',
          recipientPhone: recipientPhone.trim(),
          packageDescription: packageDescription.trim(),
          packageWeightApprox,
          fragile,
          notes: notes.trim(),
          assignedPartnerId: selectedPartnerId,
          estimatedFee: calculatedFee,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place delivery request.');
      }

      // Save phone and name to localStorage
      localStorage.setItem('sohla_customer_phone', pickupContactPhone.trim());
      if (pickupContactName.trim()) localStorage.setItem('sohla_customer_name', pickupContactName.trim());

      try {
        const existing = JSON.parse(localStorage.getItem('sohla_my_deliveries') || '[]');
        const updated = [data.request, ...existing.filter((d: any) => d.id !== data.request.id)];
        localStorage.setItem('sohla_my_deliveries', JSON.stringify(updated));
      } catch {}

      setConfirmedDelivery(data.request);
      setStep(4);
      if (onRequestSuccess) {
        onRequestSuccess(data.request);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating your delivery request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!confirmedDelivery) return;
    const phone = (activeCourier?.whatsapp || activeCourier?.phone || '+2202307711').replace(/[\s\+]/g, '');
    const text = `Salaam Alaikum ${activeCourier?.name || 'SOHLA Courier'}! I just placed a delivery request on SOHLA:\n\n*Tracking Code*: ${confirmedDelivery.trackingCode}\n*Type*: ${confirmedDelivery.deliveryType} (D${confirmedDelivery.estimatedFee})\n*Pickup*: ${confirmedDelivery.pickupLocation} - ${confirmedDelivery.pickupAddress} (Tel: ${confirmedDelivery.pickupContactPhone})\n*Destination*: ${confirmedDelivery.destinationLocation} - ${confirmedDelivery.destinationAddress} (Recipient: ${confirmedDelivery.recipientName}, Tel: ${confirmedDelivery.recipientPhone})\n*Item*: ${confirmedDelivery.packageDescription}\n*Payment*: ${confirmedDelivery.paymentMethod} (UNPAID)\n\nPlease dispatch a rider. Thank you!`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Top Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-stone-900 via-sky-950 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
              <Truck className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black font-display text-white truncate">
                  Send a Package
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">
                  Greater Banjul Dispatch
                </span>
              </div>
              <p className="text-xs text-sky-200/90 truncate font-medium">
                Verified Motorcycle Couriers & Errand Runners
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer ml-2 shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-step progress bar */}
        {step < 4 && (
          <div className="bg-stone-50 border-b border-stone-200 px-5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 sm:space-x-3 text-stone-500">
              <span className={`font-bold ${step === 1 ? 'text-sky-700' : step > 1 ? 'text-emerald-700' : ''}`}>
                1. Route & Type
              </span>
              <span>•</span>
              <span className={`font-bold ${step === 2 ? 'text-sky-700' : step > 2 ? 'text-emerald-700' : ''}`}>
                2. Package & Courier
              </span>
              <span>•</span>
              <span className={`font-bold ${step === 3 ? 'text-sky-700' : ''}`}>
                3. Review
              </span>
            </div>
            <span className="text-[11px] font-mono text-stone-400 font-semibold">
              Step {step} of 3
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[72vh] space-y-5">
          {/* STEP 1: Delivery Type & Addresses */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">
                  1. Select Delivery Category
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DELIVERY_TYPES.map(t => {
                    const isSelected = deliveryType === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setDeliveryType(t.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/70 shadow-xs text-sky-950'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{t.label}</span>
                          <span className="text-xs font-black text-sky-700">D{t.baseFee} GMD</span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-1 leading-snug">{t.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pickup Information */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                    A
                  </div>
                  <span>Pickup Location (Where rider collects parcel)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">Area / Ward</label>
                    <select
                      value={pickupLocation}
                      onChange={e => setPickupLocation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                    >
                      {GAMBIAN_AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                      Sender Phone <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      value={pickupContactPhone}
                      onChange={e => setPickupContactPhone(e.target.value)}
                      placeholder="+220 788 1234"
                      className="w-full text-xs p-2 rounded-xl border border-stone-300 font-mono bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    Street Address & Landmark <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={pickupAddress}
                    onChange={e => setPickupAddress(e.target.value)}
                    placeholder="e.g. Opposite Senegambia Craft Market, blue gate next to pharmacy"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {/* Dropoff Information */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                  <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-black">
                    B
                  </div>
                  <span>Destination (Where parcel is delivered)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">Destination Area</label>
                    <select
                      value={destinationLocation}
                      onChange={e => setDestinationLocation(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                    >
                      {GAMBIAN_AREAS.map(area => (
                        <option key={area} value={area}>{area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                      Recipient Phone <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      placeholder="+220 333 4567"
                      className="w-full text-xs p-2 rounded-xl border border-stone-300 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">Recipient Name</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      placeholder="e.g. Fatou Gaye"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                      Dropoff Address & Landmark <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={destinationAddress}
                      onChange={e => setDestinationAddress(e.target.value)}
                      placeholder="e.g. Kololi Tavern Junction, white 2-story building"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!pickupAddress.trim()) {
                      setErrorMessage('Please enter the pickup address or landmark.');
                      return;
                    }
                    if (!pickupContactPhone.trim() || pickupContactPhone.trim().length < 8) {
                      setErrorMessage('Please provide a valid Gambian pickup phone number.');
                      return;
                    }
                    if (!destinationAddress.trim()) {
                      setErrorMessage('Please enter the destination address or landmark.');
                      return;
                    }
                    if (!recipientPhone.trim() || recipientPhone.trim().length < 8) {
                      setErrorMessage('Please provide the recipient’s Gambian phone number.');
                      return;
                    }
                    setErrorMessage(null);
                    setStep(2);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Package & Courier</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Package Details & Select Courier */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Package Details & Dispatch Provider</h3>
                  <p className="text-xs text-stone-500">Specify package contents and assign a verified courier partner.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* Package Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    What are you sending? <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={packageDescription}
                    onChange={e => setPackageDescription(e.target.value)}
                    placeholder="e.g. Document envelope, birthday cake, spare phone charger, groceries"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Approximate Weight</label>
                    <select
                      value={packageWeightApprox}
                      onChange={e => setPackageWeightApprox(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                    >
                      <option value="Light (<1kg)">Light (&lt;1kg) - Documents/Small</option>
                      <option value="Standard (<5kg)">Standard (&lt;5kg) - Box/Bag</option>
                      <option value="Medium (5-10kg)">Medium (5-10kg) - Heavy box</option>
                      <option value="Large (>10kg)">Large (&gt;10kg) - Bulk item</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={fragile}
                        onChange={e => setFragile(e.target.checked)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xs font-bold text-stone-800">Handle with extra care (Fragile)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Special Rider Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Call sender when outside gate; please do not tilt package"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Verified Dispatch Courier Selection */}
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">
                  Assigned Courier Partner
                </label>
                <div className="space-y-2">
                  {deliveryPartners.map(p => {
                    const isSelected = selectedPartnerId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPartnerId(p.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/70 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                            <Truck className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-stone-900">{p.name}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded">
                                Verified
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500">{p.location} • Hotline: {p.phone}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold text-sky-700">D{p.deliveryFee || 120} GMD</div>
                          <div className="text-[10px] text-stone-400">{p.estimatedDeliveryTime || '30-45 mins'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-stone-800 block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash on Delivery', desc: 'Pay rider in GMD Dalasi', icon: Banknote },
                    { id: 'WAVE', label: 'Wave Mobile Money', desc: 'Direct Wave transfer', icon: CreditCard },
                    { id: 'QMONEY', label: 'QMoney', desc: 'QCell wallet', icon: CreditCard },
                    { id: 'AFRIMONEY', label: 'Afrimoney', desc: 'Africell money', icon: CreditCard }
                  ].map(pm => {
                    const isSelected = paymentMethod === pm.id;
                    const Icon = pm.icon;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-start gap-2 ${
                          isSelected
                            ? 'border-sky-600 bg-sky-50/70 text-sky-900 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-sky-600' : 'text-stone-400'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{pm.label}</div>
                          <div className="text-[10px] text-stone-400 truncate">{pm.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Edit Route
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!packageDescription.trim()) {
                      setErrorMessage('Please describe the items to dispatch.');
                      return;
                    }
                    setErrorMessage(null);
                    setStep(3);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Review Order</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Review Delivery Order</h3>
                  <p className="text-xs text-stone-500">Confirm pickup, dropoff, and courier dispatch details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit
                </button>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                {/* Route */}
                <div className="space-y-2 pb-3 border-b border-stone-200 text-xs">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                      A
                    </div>
                    <div>
                      <span className="font-bold text-stone-900">{pickupLocation}</span>
                      <p className="text-stone-600">{pickupAddress}</p>
                      <p className="text-stone-400 font-mono text-[11px]">Tel: {pickupContactPhone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">
                      B
                    </div>
                    <div>
                      <span className="font-bold text-stone-900">{destinationLocation}</span>
                      <p className="text-stone-600">{destinationAddress}</p>
                      <p className="text-stone-400 font-mono text-[11px]">
                        Recipient: {recipientName || 'Recipient'} • Tel: {recipientPhone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Package & Courier */}
                <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Delivery Type</span>
                    <p className="font-bold text-stone-800">{deliveryType}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Total Delivery Fee</span>
                    <p className="font-extrabold text-sky-700 text-sm">D{calculatedFee} GMD</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Package</span>
                    <p className="font-semibold text-stone-800">{packageDescription}</p>
                    {fragile && (
                      <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded mt-0.5 inline-block">
                        Fragile Care
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Courier Partner</span>
                    <p className="font-semibold text-stone-800">{activeCourier?.name}</p>
                    <p className="text-stone-500 font-mono text-[11px]">{activeCourier?.phone}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Payment</span>
                    <p className="font-bold text-stone-800">
                      {paymentMethod === 'CASH' ? 'Cash on Delivery (GMD)' : paymentMethod}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Status: UNPAID
                  </span>
                </div>
              </div>

              {/* Policy note */}
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <strong>SOHLA Dispatch Guarantee:</strong> Your request is sent directly to the courier's rider dispatch desk. You will receive an instant <strong>SHL-DEL</strong> tracking code to follow parcel status in real time.
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-95 text-white text-xs font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Request Courier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmed & Live Tracking */}
          {step === 4 && confirmedDelivery && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-sky-100 border-4 border-sky-200 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-300">
                  Request Dispatched
                </span>
                <h3 className="text-lg font-black font-display text-stone-900 mt-2">
                  Delivery Order Placed!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  A rider from <strong>{confirmedDelivery.assignedPartnerName}</strong> has been notified for pickup.
                </p>
              </div>

              {/* Tracking Reference card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="text-xs text-stone-500 font-medium">Tracking Reference</span>
                  <span className="font-mono font-black text-sm text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                    {confirmedDelivery.trackingCode}
                  </span>
                </div>

                {/* Progress bar timeline */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 mb-1.5">
                    <span className="text-sky-700 font-extrabold">1. Dispatched</span>
                    <span>2. Assigned</span>
                    <span>3. In Transit</span>
                    <span>4. Delivered</span>
                  </div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full w-1/4 rounded-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Route</span>
                    <p className="font-bold text-stone-800">
                      {confirmedDelivery.pickupLocation} → {confirmedDelivery.destinationLocation}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Estimated Fee</span>
                    <p className="font-extrabold text-sky-700">D{confirmedDelivery.estimatedFee} GMD</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Item</span>
                    <p className="font-medium text-stone-700 truncate">{confirmedDelivery.packageDescription}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Live Status</span>
                    <p className="font-bold text-sky-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                      {confirmedDelivery.status}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Dispatch Hotline:</span>
                  <span className="font-mono font-bold text-stone-800">
                    {confirmedDelivery.assignedPartnerPhone}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Send Tracking & Pickup to Dispatch Desk via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-bold text-xs transition cursor-pointer"
                >
                  Done & Back to SOHLA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
