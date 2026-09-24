import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Scissors,
  Truck,
  Package,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { BeautyBooking, DeliveryRequest, BusinessPartner } from '../../types';

interface CustomerServicesAccountSectionProps {
  onOpenBeautyBooking: () => void;
  onOpenDeliveryRequest: () => void;
  onSelectPartner?: (partner: BusinessPartner) => void;
  partners: BusinessPartner[];
}

export const CustomerServicesAccountSection: React.FC<CustomerServicesAccountSectionProps> = ({
  onOpenBeautyBooking,
  onOpenDeliveryRequest,
  onSelectPartner,
  partners
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'beauty' | 'delivery'>('beauty');
  const [beautyBookings, setBeautyBookings] = useState<BeautyBooking[]>([]);
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BeautyBooking | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRequest | null>(null);

  const loadCustomerServices = async () => {
    setIsLoading(true);
    try {
      // 1. Load local cache
      const localBookings: BeautyBooking[] = JSON.parse(localStorage.getItem('sohla_my_bookings') || '[]');
      const localDeliveries: DeliveryRequest[] = JSON.parse(localStorage.getItem('sohla_my_deliveries') || '[]');

      const savedPhone = localStorage.getItem('sohla_customer_phone') || '';

      // 2. Fetch server bookings
      try {
        const url = savedPhone ? `/api/bookings?phone=${encodeURIComponent(savedPhone)}` : '/api/bookings';
        const res = await fetch(url);
        if (res.ok) {
          const serverList: BeautyBooking[] = await res.json();
          // Merge server with local
          const map = new Map<string, BeautyBooking>();
          localBookings.forEach(b => map.set(b.id, b));
          serverList.forEach(b => map.set(b.id, b));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setBeautyBookings(merged);
        } else {
          setBeautyBookings(localBookings);
        }
      } catch {
        setBeautyBookings(localBookings);
      }

      // 3. Fetch server deliveries
      try {
        const url = savedPhone ? `/api/delivery-requests?phone=${encodeURIComponent(savedPhone)}` : '/api/delivery-requests';
        const res = await fetch(url);
        if (res.ok) {
          const serverList: DeliveryRequest[] = await res.json();
          const map = new Map<string, DeliveryRequest>();
          localDeliveries.forEach(d => map.set(d.id, d));
          serverList.forEach(d => map.set(d.id, d));
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          setDeliveryRequests(merged);
        } else {
          setDeliveryRequests(localDeliveries);
        }
      } catch {
        setDeliveryRequests(localDeliveries);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerServices();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'DELIVERED':
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center space-x-1 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{status}</span>
          </span>
        );
      case 'IN_TRANSIT':
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 flex items-center space-x-1 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>{status.replace('_', ' ')}</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 flex items-center space-x-1 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 space-y-4 shadow-xs">
      {/* Header with Title and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-extrabold text-sm text-stone-900 font-display">
            My Appointments & Errand Requests
          </h4>
          <p className="text-[11px] text-stone-500">
            Track your native bookings with Gambian beauty salons & courier dispatches
          </p>
        </div>
        <button
          onClick={loadCustomerServices}
          className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition active:scale-95"
          title="Refresh Bookings"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      </div>

      {/* Segmented sub-tab switch */}
      <div className="flex items-center p-1 bg-stone-100 rounded-xl">
        <button
          onClick={() => setActiveSubTab('beauty')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
            activeSubTab === 'beauty'
              ? 'bg-white text-rose-900 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Scissors className="w-3.5 h-3.5 text-rose-600" />
          <span>My Beauty Bookings</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-extrabold">
            {beautyBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('delivery')}
          className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
            activeSubTab === 'delivery'
              ? 'bg-white text-sky-900 shadow-xs border border-stone-200'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-sky-600" />
          <span>My Delivery Requests</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-sky-100 text-sky-800 font-extrabold">
            {deliveryRequests.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Beauty Bookings */}
      {activeSubTab === 'beauty' && (
        <div className="space-y-3">
          {beautyBookings.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-xs text-rose-950">No Beauty Appointments Yet</h5>
                <p className="text-[11px] text-rose-700 max-w-xs mx-auto">
                  Book braiding, barber fades, spa treatments, or nails directly with verified Gambian salons.
                </p>
              </div>
              <button
                onClick={onOpenBeautyBooking}
                className="mt-1 py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-105 text-white font-bold text-xs shadow-xs active:scale-95 transition inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book a Salon / Barber</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {beautyBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-rose-300 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-stone-900">{b.serviceName}</span>
                        <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          #{b.bookingCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                        {b.partnerName} • {b.partnerLocation}
                      </p>
                    </div>
                    {getStatusBadge(b.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-200/60 text-stone-600">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{b.bookingDate}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{b.bookingTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs">
                    <span className="font-black text-stone-900">
                      Total: D{b.servicePrice} GMD ({b.paymentMethod})
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {b.partnerPhone && (
                        <a
                          href={`https://wa.me/${b.partnerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Salaam Alaikum ${b.partnerName}! I am checking on my booking #${b.bookingCode} for ${b.serviceName} on ${b.bookingDate} at ${b.bookingTime}.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1 px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center space-x-1 transition"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp Salon</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={onOpenBeautyBooking}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Another Beauty Appointment</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Delivery Requests */}
      {activeSubTab === 'delivery' && (
        <div className="space-y-3">
          {deliveryRequests.length === 0 ? (
            <div className="py-8 px-4 text-center rounded-2xl bg-sky-50/50 border border-sky-100 space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h5 className="font-extrabold text-xs text-sky-950">No Package Deliveries Yet</h5>
                <p className="text-[11px] text-sky-700 max-w-xs mx-auto">
                  Send parcels, restaurant food, document dispatch, or market errands across Greater Banjul.
                </p>
              </div>
              <button
                onClick={onOpenDeliveryRequest}
                className="mt-1 py-2 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:brightness-105 text-white font-bold text-xs shadow-xs active:scale-95 transition inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Send a Package Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {deliveryRequests.map((d) => (
                <div
                  key={d.id}
                  className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-sky-300 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-stone-900">{d.deliveryType}</span>
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          #{d.trackingCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 font-medium mt-0.5">
                        Courier: {d.courierPartnerName || 'Assigned Courier Dispatch'}
                      </p>
                    </div>
                    {getStatusBadge(d.status)}
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-stone-200/80 text-xs space-y-1.5">
                    <div className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-stone-700 truncate">
                        <strong>From:</strong> {d.pickupLocation} ({d.pickupAddress || 'Street address'})
                      </span>
                    </div>
                    <div className="flex items-start space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="text-stone-700 truncate">
                        <strong>To:</strong> {d.dropoffLocation} ({d.dropoffAddress || 'Street address'})
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-stone-500 pt-0.5">
                      <Package className="w-3.5 h-3.5 text-stone-400" />
                      <span>{d.packageDescription}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs">
                    <span className="font-black text-stone-900">
                      Fee: D{d.deliveryFee} GMD ({d.paymentMethod})
                    </span>

                    <a
                      href={`https://wa.me/2203001234?text=${encodeURIComponent(
                        `Salaam! I am checking on my delivery request #${d.trackingCode} from ${d.pickupLocation} to ${d.dropoffLocation}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1 px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center space-x-1 transition"
                    >
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>Track via WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}

              <button
                onClick={onOpenDeliveryRequest}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-sky-300 text-sky-700 hover:bg-sky-50 text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Send Another Package</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
