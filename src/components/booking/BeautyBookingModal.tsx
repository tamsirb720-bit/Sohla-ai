import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Scissors,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageCircle,
  MapPin,
  ChevronRight,
  ArrowLeft,
  User,
  CreditCard,
  Banknote,
  ShieldCheck,
  RotateCcw,
  HeartHandshake,
  AlertTriangle
} from 'lucide-react';
import { BusinessPartner, ServiceItem, BeautyBooking, PaymentMethod, HEALTHCARE_SERVICES_LIST } from '../../types';

interface BeautyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner?: BusinessPartner | null;
  initialService?: ServiceItem | null;
  onBookingSuccess?: (booking: BeautyBooking) => void;
}

const AVAILABLE_TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
  '05:30 PM',
  '07:00 PM',
  '08:00 PM'
];

export const BeautyBookingModal: React.FC<BeautyBookingModalProps> = ({
  isOpen,
  onClose,
  partner,
  initialService,
  onBookingSuccess
}) => {
  // Steps: 1: Service Selection, 2: Date & Time, 3: Customer Details & Payment, 4: Review, 5: Confirmed
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customServicePrice, setCustomServicePrice] = useState(250);

  const getNextDays = (count = 10) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        dateString: d.toISOString().split('T')[0],
        dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return days;
  };

  const nextDays = getNextDays(14);
  const [selectedDate, setSelectedDate] = useState<string>(nextDays[0].dateString);
  const [selectedTime, setSelectedTime] = useState<string>('11:30 AM');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isCheckingSlots, setIsCheckingSlots] = useState<boolean>(false);

  // Customer info
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('+220 ');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [serviceLocationAddress, setServiceLocationAddress] = useState<string>('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<BeautyBooking | null>(null);

  // Initialize from props and localStorage
  useEffect(() => {
    if (isOpen) {
      if (initialService) {
        setSelectedService(initialService);
        setStep(2); // Jump straight to date & time if service already picked
      } else if (partner && partner.services && partner.services.length > 0) {
        setSelectedService(partner.services[0]);
        setStep(1);
      } else {
        setStep(1);
      }

      // Pre-fill customer details from localStorage if present
      const savedPhone = localStorage.getItem('sohla_customer_phone');
      const savedName = localStorage.getItem('sohla_customer_name');
      const savedEmail = localStorage.getItem('sohla_customer_email');
      if (savedPhone) setCustomerPhone(savedPhone);
      if (savedName) setCustomerName(savedName);
      if (savedEmail) setCustomerEmail(savedEmail);

      setErrorMessage(null);
      setConfirmedBooking(null);
    }
  }, [isOpen, partner, initialService]);

  // Check booked slots for partner & date to prevent double booking
  useEffect(() => {
    if (isOpen && partner?.id && selectedDate) {
      setIsCheckingSlots(true);
      fetch(`/api/bookings?partnerId=${partner.id}&date=${selectedDate}`)
        .then(res => res.json())
        .then(bookings => {
          if (Array.isArray(bookings)) {
            const booked = bookings
              .filter(b => b.status !== 'CANCELLED' && b.status !== 'REJECTED')
              .map(b => b.bookingTime);
            setBookedSlots(booked);
            // If current selected time is booked, pick next available
            if (booked.includes(selectedTime)) {
              const nextAvail = AVAILABLE_TIME_SLOTS.find(t => !booked.includes(t));
              if (nextAvail) setSelectedTime(nextAvail);
            }
          }
        })
        .catch(err => console.warn('Could not fetch existing bookings:', err))
        .finally(() => setIsCheckingSlots(false));
    }
  }, [isOpen, partner?.id, selectedDate]);

  if (!isOpen || !partner) return null;

  const isHealthcare = Boolean(
    partner?.subcategory?.toLowerCase().includes('healthcare') ||
    selectedService?.subcategory?.toLowerCase().includes('healthcare') ||
    selectedService?.category?.toLowerCase().includes('healthcare') ||
    (selectedService?.name && HEALTHCARE_SERVICES_LIST.some(h => selectedService.name.toLowerCase().includes(h.toLowerCase())))
  );

  const currentServiceName = selectedService ? selectedService.name : customServiceName || (isHealthcare ? 'Healthcare Visit / Nursing Care' : 'Custom Grooming / Treatment');
  const currentServicePrice = selectedService ? selectedService.startingPrice : customServicePrice;

  const handleSubmitBooking = async () => {
    setErrorMessage(null);
    if (!customerName.trim()) {
      setErrorMessage('Please provide your name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMessage('Please provide a valid Gambian phone number (+220 XXX XXXX).');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setErrorMessage('Please pick an appointment date and available time slot.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          partnerName: partner.name,
          partnerLocation: partner.location,
          partnerPhone: partner.phone,
          partnerWhatsapp: partner.whatsapp,
          serviceId: selectedService?.id || '',
          serviceName: currentServiceName,
          servicePrice: currentServicePrice,
          pricingType: selectedService?.pricingType || 'Fixed',
          durationMinutes: selectedService?.durationMinutes || 45,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          customerNotes: customerNotes.trim(),
          serviceLocationAddress: serviceLocationAddress.trim(),
          serviceCategory: 'BEAUTY & WELLNESS',
          serviceSubcategory: isHealthcare ? 'Healthcare & Nursing' : (partner.subcategory || 'Salons & Braiding'),
          emergencyContactPhone: emergencyContactPhone.trim(),
          bookingDate: selectedDate,
          bookingTime: selectedTime,
          paymentMethod
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit appointment booking.');
      }

      // Save customer details in local storage for subsequent bookings
      localStorage.setItem('sohla_customer_phone', customerPhone.trim());
      localStorage.setItem('sohla_customer_name', customerName.trim());
      if (customerEmail.trim()) localStorage.setItem('sohla_customer_email', customerEmail.trim());

      try {
        const existing = JSON.parse(localStorage.getItem('sohla_my_bookings') || '[]');
        const updated = [data.booking, ...existing.filter((b: any) => b.id !== data.booking.id)];
        localStorage.setItem('sohla_my_bookings', JSON.stringify(updated));
      } catch {}

      setConfirmedBooking(data.booking);
      setStep(5);
      if (onBookingSuccess) {
        onBookingSuccess(data.booking);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while confirming your booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!confirmedBooking) return;
    const phone = (partner.whatsapp || partner.phone).replace(/[\s\+]/g, '');
    const text = `Salaam Alaikum ${partner.name}! I just booked an appointment through SOHLA:\n\n*Reference*: ${confirmedBooking.bookingCode}\n*Service*: ${confirmedBooking.serviceName} (D${confirmedBooking.servicePrice})\n*Date*: ${confirmedBooking.bookingDate}\n*Time*: ${confirmedBooking.bookingTime}\n*Name*: ${confirmedBooking.customerName}\n*Payment*: ${confirmedBooking.paymentMethod}\n\nPlease confirm my appointment. Thank you!`;
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Modal Top Header */}
        <div className={`px-5 py-4 ${isHealthcare ? 'bg-gradient-to-r from-stone-900 via-teal-950 to-stone-900' : 'bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900'} text-white flex items-center justify-between`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-10 h-10 rounded-2xl ${isHealthcare ? 'bg-teal-500/20 border-teal-400/30 text-teal-300' : 'bg-rose-500/20 border-rose-400/30 text-rose-300'} border flex items-center justify-center shrink-0`}>
              {isHealthcare ? <HeartHandshake className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black font-display text-white truncate">
                  {isHealthcare ? 'Book Healthcare Care / Visit' : 'Book Appointment'}
                </h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isHealthcare ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'} px-2 py-0.5 rounded-full border`}>
                  {isHealthcare ? 'Verified Healthcare Provider' : 'Verified Salon & Spa'}
                </span>
              </div>
              <p className="text-xs text-rose-200/90 truncate font-medium">
                {partner.name} • {partner.location}
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

        {/* Non-emergency disclaimer for Healthcare visits */}
        {isHealthcare && (
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex items-start space-x-2 text-[11px] text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Non-Emergency Notice:</strong> SOHLA provides scheduled healthcare visit bookings. For acute medical emergencies, call <strong>1122</strong> or go directly to the nearest hospital emergency room.
            </span>
          </div>
        )}

        {/* Multi-step progress bar (if not confirmed) */}
        {step < 5 && (
          <div className="bg-stone-50 border-b border-stone-200 px-5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 sm:space-x-3 text-stone-500">
              <span className={`font-bold ${step === 1 ? 'text-rose-700' : step > 1 ? 'text-emerald-700' : ''}`}>
                1. Service
              </span>
              <span>•</span>
              <span className={`font-bold ${step === 2 ? 'text-rose-700' : step > 2 ? 'text-emerald-700' : ''}`}>
                2. Date & Time
              </span>
              <span>•</span>
              <span className={`font-bold ${step === 3 ? 'text-rose-700' : step > 3 ? 'text-emerald-700' : ''}`}>
                3. Your Info
              </span>
              <span>•</span>
              <span className={`font-bold ${step === 4 ? 'text-rose-700' : ''}`}>
                4. Review
              </span>
            </div>
            <span className="text-[11px] font-mono text-stone-400 font-semibold">
              Step {step} of 4
            </span>
          </div>
        )}

        {/* Error notice */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Body content based on step */}
        <div className="p-5 overflow-y-auto max-h-[72vh] space-y-5">
          {/* STEP 1: Select Service */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Select a Service or Treatment</h3>
                <p className="text-xs text-stone-500">Choose from verified services offered with authentic Gambian Dalasi pricing.</p>
              </div>

              {partner.services && partner.services.length > 0 ? (
                <div className="space-y-2.5">
                  {partner.services.map(svc => {
                    const isSelected = selectedService?.id === svc.id;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                          isSelected
                            ? 'border-rose-600 bg-rose-50/60 shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">{svc.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                Selected
                              </span>
                            )}
                          </div>
                          {svc.description && (
                            <p className="text-xs text-stone-600 mt-1 leading-relaxed">{svc.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-rose-700">D{svc.startingPrice}</div>
                          <div className="text-[10px] text-stone-400">GMD</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <p className="text-xs text-stone-600">
                    This salon welcomes appointments for any hair, braiding, barbering, or spa service:
                  </p>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Service or Treatment</label>
                    <input
                      type="text"
                      value={customServiceName}
                      onChange={e => setCustomServiceName(e.target.value)}
                      placeholder="e.g. Knotless Braids, Fade Haircut, or Hot Stone Massage"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">Expected Price (Dalasi GMD)</label>
                    <input
                      type="number"
                      value={customServicePrice}
                      onChange={e => setCustomServicePrice(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-rose-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedService && !customServiceName) {
                      setErrorMessage('Please select a service before proceeding.');
                      return;
                    }
                    setErrorMessage(null);
                    setStep(2);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Select Date & Time</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Date & Available Time */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Choose Appointment Date & Time</h3>
                  <p className="text-xs text-stone-500">
                    Business Hours: {partner.openingHours || '09:00 AM - 09:00 PM'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* Service Reminder Chip */}
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-950">{currentServiceName}</span>
                </div>
                <span className="text-xs font-extrabold text-rose-700">D{currentServicePrice} GMD</span>
              </div>

              {/* Date horizontal scroller */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-2">1. Select Date</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {nextDays.map(item => {
                    const isSelected = selectedDate === item.dateString;
                    return (
                      <button
                        key={item.dateString}
                        type="button"
                        onClick={() => setSelectedDate(item.dateString)}
                        className={`p-2 rounded-xl text-center border transition cursor-pointer flex flex-col items-center ${
                          isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider">{item.dayName}</span>
                        <span className="text-xs font-black mt-0.5">{item.formatted}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Time Slots with live conflict prevention */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-700">2. Select Time Slot</label>
                  {isCheckingSlots && (
                    <span className="text-[11px] text-stone-400 animate-pulse">Checking availability...</span>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
                  {AVAILABLE_TIME_SLOTS.map(timeSlot => {
                    const isBooked = bookedSlots.includes(timeSlot);
                    const isSelected = selectedTime === timeSlot;

                    return (
                      <button
                        key={timeSlot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedTime(timeSlot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                          isBooked
                            ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed line-through opacity-60'
                            : isSelected
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm cursor-pointer'
                            : 'bg-white hover:border-rose-300 text-stone-800 border-stone-200 cursor-pointer'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeSlot}</span>
                      </button>
                    );
                  })}
                </div>
                {bookedSlots.length > 0 && (
                  <p className="text-[11px] text-amber-700 mt-2 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Slots marked with strike-through are already reserved to prevent double-booking.</span>
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Change Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedTime) {
                      setErrorMessage('Please select a time slot.');
                      return;
                    }
                    setErrorMessage(null);
                    setStep(3);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Customer Details</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Customer Details & Payment Selection */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Your Contact & Payment Details</h3>
                  <p className="text-xs text-stone-500">The salon will use your phone number to confirm your booking.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Amina Jawara or Modou Ceesay"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Gambian Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+220 788 1234"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition font-mono"
                  />
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    Supported: Africell, QCell, Gamcel, or Comium
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="youremail@example.com"
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>

                {isHealthcare && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Patient / Visit Address in The Gambia <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceLocationAddress}
                        onChange={e => setServiceLocationAddress(e.target.value)}
                        placeholder="e.g. Brusubi Phase 1, Bertil Harding Hwy, near Turntable"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                      />
                      <span className="text-[10px] text-stone-400 mt-0.5 block">
                        Required for home nursing, post-surgery, caregiver, and home visit care
                      </span>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Emergency Contact Phone (Next of Kin / Relative)
                      </label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={e => setEmergencyContactPhone(e.target.value)}
                        placeholder="+220 XXX XXXX"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition font-mono"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">
                    {isHealthcare ? 'Patient Needs / Care Routine Instructions (Optional)' : 'Styling Preferences or Notes (Optional)'}
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={e => setCustomerNotes(e.target.value)}
                    placeholder={
                      isHealthcare
                        ? 'e.g. Patient is 72 yrs old, mobility assistance needed, dressing materials at home, or doctor instructions.'
                        : 'e.g. Medium length braids, skin fade with razor line, sensitive scalp, etc.'
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
                  />
                </div>

                {/* SOHLA Configured Payment Methods */}
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1.5">
                    Payment Method (Dalasi GMD)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'CASH', label: 'Cash on Service', desc: 'Pay in Dalasi at salon', icon: Banknote },
                      { id: 'WAVE', label: 'Wave Mobile Money', desc: 'Direct Wave transfer', icon: CreditCard },
                      { id: 'QMONEY', label: 'QMoney', desc: 'QCell Mobile wallet', icon: CreditCard },
                      { id: 'AFRIMONEY', label: 'Afrimoney', desc: 'Africell Mobile money', icon: CreditCard }
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
                              ? 'border-rose-600 bg-rose-50/70 text-rose-900 shadow-xs'
                              : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                          }`}
                        >
                          <Icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-rose-600' : 'text-stone-400'}`} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{pm.label}</div>
                            <div className="text-[10px] text-stone-400 truncate">{pm.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Change Date/Time
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!customerName.trim()) {
                      setErrorMessage('Please enter your full name.');
                      return;
                    }
                    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
                      setErrorMessage('Please enter a valid Gambian phone number.');
                      return;
                    }
                    if (isHealthcare && !serviceLocationAddress.trim()) {
                      setErrorMessage('Please enter the patient or visit address in The Gambia.');
                      return;
                    }
                    setErrorMessage(null);
                    setStep(4);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Review Booking</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review Booking */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">Review Appointment Details</h3>
                  <p className="text-xs text-stone-500">Please confirm your booking details before submitting.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Edit
                </button>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-start justify-between pb-3 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Business</span>
                    <h4 className="font-extrabold text-sm text-stone-900">{partner.name}</h4>
                    <p className="text-xs text-stone-600 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {partner.location} ({partner.address})
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Verified Partner
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-stone-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Service</span>
                    <p className="font-bold text-stone-800">{currentServiceName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Total Price</span>
                    <p className="font-extrabold text-rose-700 text-sm">D{currentServicePrice} GMD</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Appointment Date</span>
                    <p className="font-bold text-stone-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      {selectedDate}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Time Slot</span>
                    <p className="font-bold text-stone-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {selectedTime}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Client</span>
                    <p className="font-semibold text-stone-800">{customerName}</p>
                    <p className="text-stone-500 font-mono text-[11px]">{customerPhone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Payment Option</span>
                    <p className="font-semibold text-stone-800">
                      {paymentMethod === 'CASH' ? 'Cash on Service' : paymentMethod}
                    </p>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-block mt-0.5">
                      Status: UNPAID
                    </span>
                  </div>
                </div>

                {serviceLocationAddress && (
                  <div className="pt-2 text-xs border-t border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Patient Care Address / Visit Location:</span>
                    <p className="text-stone-800 font-semibold mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{serviceLocationAddress}</span>
                    </p>
                  </div>
                )}

                {emergencyContactPhone && (
                  <div className="pt-2 text-xs border-t border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Emergency Contact:</span>
                    <p className="text-stone-800 font-mono font-medium mt-0.5">{emergencyContactPhone}</p>
                  </div>
                )}

                {customerNotes && (
                  <div className="pt-2 text-xs border-t border-stone-200">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      {isHealthcare ? 'Care Routine / Clinical Instructions:' : 'Notes:'}
                    </span>
                    <p className="text-stone-600 italic mt-0.5">{customerNotes}</p>
                  </div>
                )}
              </div>

              {/* Policy note */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>SOHLA Verified Guarantee:</strong> Your booking is submitted directly to {partner.name}. You can manage or cancel your appointment any time under <strong>Account → My Beauty Bookings</strong>.
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Edit Info
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitBooking}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-105 active:scale-95 text-white text-xs font-extrabold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Reserve Slot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Confirmation & Tracker */}
          {step === 5 && confirmedBooking && (
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Appointment Reserved
                </span>
                <h3 className="text-lg font-black font-display text-stone-900 mt-2">
                  Booking Confirmed!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  Your appointment request has been transmitted directly to <strong>{partner.name}</strong>.
                </p>
              </div>

              {/* Reference card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="text-xs text-stone-500 font-medium">Booking Reference</span>
                  <span className="font-mono font-black text-sm text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-300">
                    {confirmedBooking.bookingCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Service</span>
                    <p className="font-bold text-stone-800">{confirmedBooking.serviceName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Amount</span>
                    <p className="font-extrabold text-rose-700">D{confirmedBooking.servicePrice} GMD</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Date & Time</span>
                    <p className="font-bold text-stone-800">
                      {confirmedBooking.bookingDate} @ {confirmedBooking.bookingTime}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">Live Status</span>
                    <p className="font-bold text-amber-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      {confirmedBooking.status}
                    </p>
                  </div>
                </div>

                {confirmedBooking.serviceLocationAddress && (
                  <div className="pt-2 border-t border-stone-200 text-xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400">Patient Care Address:</span>
                    <p className="font-semibold text-stone-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      {confirmedBooking.serviceLocationAddress}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Contact Provider Directly:</span>
                  <span className="font-mono font-bold text-stone-800">{partner.phone}</span>
                </div>
              </div>

              {/* WhatsApp direct notification button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Send Booking Details on WhatsApp to {partner.name}</span>
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
