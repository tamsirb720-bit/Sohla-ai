import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Scissors,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MessageCircle,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Eye,
  User,
  CreditCard,
  Banknote,
  Check
} from 'lucide-react';
import { BeautyBooking, BookingStatus, BusinessPartner } from '../../types';

interface BeautyBookingsModuleProps {
  adminUser?: any;
}

export const BeautyBookingsModule: React.FC<BeautyBookingsModuleProps> = ({ adminUser }) => {
  const [bookings, setBookings] = useState<BeautyBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BeautyBooking | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to load beauty bookings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    extra: { rejectionReason?: string; cancellationReason?: string; paymentStatus?: string } = {}
  ) => {
    setIsUpdating(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          _adminName: adminUser?.username || 'Admin',
          _role: 'ADMIN',
          ...extra
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setBookings(prev => prev.map(b => (b.id === bookingId ? data.booking : b)));
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking(data.booking);
      }
      setActionMessage(`Booking ${data.booking.bookingCode} updated to ${newStatus}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.customerName.toLowerCase().includes(q) ||
      b.partnerName.toLowerCase().includes(q) ||
      b.serviceName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q);
    return matchesStatus && matchesQuery;
  });

  // Calculate stats
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'ACCEPTED').length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
  const totalValueGMD = bookings.reduce((sum, b) => sum + (Number(b.servicePrice) || 0), 0);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ACCEPTED':
      case 'CONFIRMED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'COMPLETED':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'CANCELLED':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950 via-stone-900 to-rose-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
            <Sparkles className="w-6 h-6 text-rose-300" />
          </div>
          <div>
            <h2 className="text-lg font-black font-display text-white">
              Beauty & Wellness Appointments Desk
            </h2>
            <p className="text-xs text-rose-200/90 mt-0.5">
              Manage salon bookings, barber appointments, spa sessions & Gambian Dalasi revenues
            </p>
          </div>
        </div>

        <button
          onClick={fetchBookings}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Bookings</span>
          <div className="text-xl font-black text-stone-900 mt-0.5">{totalCount}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Across all salons</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Review</span>
          <div className="text-xl font-black text-amber-700 mt-0.5">{pendingCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Awaiting confirmation</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Confirmed Slots</span>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{confirmedCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Upcoming clients</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Completed</span>
          <div className="text-xl font-black text-sky-700 mt-0.5">{completedCount}</div>
          <div className="text-[10px] text-sky-600 mt-0.5">Services delivered</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Volume</span>
          <div className="text-xl font-black text-rose-700 mt-0.5">D{totalValueGMD.toLocaleString()}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">GMD Dalasi</div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search booking code, client, phone, salon..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-rose-500 bg-stone-50"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'ACCEPTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-stone-500">
            <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading appointments...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-500">
            <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-bold text-stone-700">No appointments found.</p>
            <p className="text-stone-400 mt-0.5">Try resetting the filter or submit a test booking from the frontend.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-400 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Ref Code</th>
                  <th className="py-3 px-4">Salon / Barber</th>
                  <th className="py-3 px-4">Service & Price</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredBookings.map(b => (
                  <tr key={b.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-stone-900">
                      {b.bookingCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{b.partnerName}</div>
                      <div className="text-[11px] text-stone-500">{b.partnerLocation}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800">{b.serviceName}</div>
                      <div className="text-rose-700 font-black">D{b.servicePrice} GMD</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{b.bookingDate}</div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {b.bookingTime}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{b.customerName}</div>
                      <div className="font-mono text-[11px] text-stone-500">{b.customerPhone}</div>
                      <div className="text-[10px] text-stone-400">
                        {b.paymentMethod} ({b.paymentStatus || 'UNPAID'})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                          b.status
                        )}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {b.status === 'PENDING' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(b.id, 'CONFIRMED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                            title="Confirm Booking"
                          >
                            Confirm
                          </button>
                        )}
                        {b.status === 'CONFIRMED' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(b.id, 'COMPLETED', { paymentStatus: 'PAID' })}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition cursor-pointer"
                            title="Mark as Completed"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const phone = (b.partnerWhatsapp || b.customerPhone).replace(/[\s\+]/g, '');
                            const msg = `Salaam! This is SOHLA Admin regarding Booking ${b.bookingCode} for ${b.serviceName} on ${b.bookingDate} at ${b.bookingTime}.`;
                            window.open(
                              `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`,
                              '_blank'
                            );
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => {
                              const reason = prompt('Reason for cancelling this appointment:');
                              if (reason) {
                                handleUpdateStatus(b.id, 'CANCELLED', { cancellationReason: reason });
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
