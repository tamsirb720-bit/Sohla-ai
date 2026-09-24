import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  Navigation
} from 'lucide-react';
import { DeliveryRequest, DeliveryStatus } from '../../types';

interface DeliveryOrdersModuleProps {
  adminUser?: any;
}

export const DeliveryOrdersModule: React.FC<DeliveryOrdersModuleProps> = ({ adminUser }) => {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<DeliveryRequest | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/delivery-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Failed to load delivery requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleUpdateStatus = async (
    requestId: string,
    newStatus: DeliveryStatus,
    note?: string
  ) => {
    setIsUpdating(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/delivery-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: note || `Status transitioned to ${newStatus} by admin`,
          _adminName: adminUser?.username || 'Admin',
          _role: 'ADMIN'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      setRequests(prev => prev.map(d => (d.id === requestId ? data.request : d)));
      if (selectedRequest?.id === requestId) {
        setSelectedRequest(data.request);
      }
      setActionMessage(`Delivery ${data.request.trackingCode} updated to ${newStatus}`);
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = requests.filter(d => {
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      d.trackingCode.toLowerCase().includes(q) ||
      d.pickupContactName.toLowerCase().includes(q) ||
      d.recipientName.toLowerCase().includes(q) ||
      d.pickupLocation.toLowerCase().includes(q) ||
      d.destinationLocation.toLowerCase().includes(q) ||
      d.packageDescription.toLowerCase().includes(q) ||
      d.pickupContactPhone.includes(q) ||
      d.recipientPhone.includes(q);
    return matchesStatus && matchesQuery;
  });

  // Calculate statistics
  const totalCount = requests.length;
  const pendingCount = requests.filter(d => d.status === 'PENDING').length;
  const inTransitCount = requests.filter(d => d.status === 'IN_TRANSIT' || d.status === 'PICKED_UP' || d.status === 'PICKUP_ASSIGNED').length;
  const deliveredCount = requests.filter(d => d.status === 'DELIVERED').length;
  const totalFeeGMD = requests.reduce((sum, d) => sum + (Number(d.estimatedFee) || 0), 0);

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'ACCEPTED':
      case 'PICKUP_ASSIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
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
      <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-950 via-stone-900 to-sky-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
            <Truck className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <h2 className="text-lg font-black font-display text-white">
              Delivery & Courier Dispatch Command
            </h2>
            <p className="text-xs text-sky-200/90 mt-0.5">
              Live Greater Banjul parcel tracking, rider dispatch management & errand coordination
            </p>
          </div>
        </div>

        <button
          onClick={fetchRequests}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Requests</span>
          <div className="text-xl font-black text-stone-900 mt-0.5">{totalCount}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">All couriers</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Dispatch</span>
          <div className="text-xl font-black text-amber-700 mt-0.5">{pendingCount}</div>
          <div className="text-[10px] text-amber-600 mt-0.5">Awaiting rider pickup</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">In Transit</span>
          <div className="text-xl font-black text-sky-700 mt-0.5">{inTransitCount}</div>
          <div className="text-[10px] text-sky-600 mt-0.5">Active on road</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Delivered</span>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{deliveredCount}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">Successful dropoffs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Total Fares</span>
          <div className="text-xl font-black text-sky-700 mt-0.5">D{totalFeeGMD.toLocaleString()}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">GMD Dalasi</div>
        </div>
      </div>

      {/* Filter strip */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tracking code, sender, phone, area..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-sky-500 bg-stone-50"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['ALL', 'PENDING', 'PICKUP_ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-stone-500">
            <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading deliveries...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-10 text-center text-xs text-stone-500">
            <Truck className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-bold text-stone-700">No delivery requests found.</p>
            <p className="text-stone-400 mt-0.5">Try resetting filters or submit a test delivery request.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-[11px] font-black uppercase tracking-wider text-stone-400 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Tracking Code</th>
                  <th className="py-3 px-4">Courier Partner</th>
                  <th className="py-3 px-4">Route (Pickup → Destination)</th>
                  <th className="py-3 px-4">Package & Fee</th>
                  <th className="py-3 px-4">Contacts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Rider Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRequests.map(d => (
                  <tr key={d.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-extrabold text-sky-800">
                      {d.trackingCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900">{d.assignedPartnerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{d.assignedPartnerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-start gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
                        <div>
                          <strong className="text-stone-900">{d.pickupLocation}</strong>: {d.pickupAddress}
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-sky-500 mt-1 shrink-0" />
                        <div>
                          <strong className="text-stone-900">{d.destinationLocation}</strong>: {d.destinationAddress}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800 truncate max-w-[150px]">{d.packageDescription}</div>
                      <div className="text-sky-700 font-black">D{d.estimatedFee} GMD</div>
                      {d.fragile && (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded">
                          Fragile
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px]">
                        <span className="text-stone-400">Sender:</span> {d.pickupContactPhone}
                      </div>
                      <div className="text-[11px]">
                        <span className="text-stone-400">Recip:</span> {d.recipientPhone} ({d.recipientName})
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(
                          d.status
                        )}`}
                      >
                        {d.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.status === 'PENDING' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(d.id, 'PICKUP_ASSIGNED', 'Rider assigned for pickup')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition cursor-pointer"
                            title="Assign Rider"
                          >
                            Assign Rider
                          </button>
                        )}
                        {(d.status === 'PICKUP_ASSIGNED' || d.status === 'ACCEPTED') && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(d.id, 'IN_TRANSIT', 'Parcel picked up & in transit')}
                            className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition cursor-pointer"
                            title="Start Transit"
                          >
                            In Transit
                          </button>
                        )}
                        {d.status === 'IN_TRANSIT' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(d.id, 'DELIVERED', 'Parcel safely delivered to recipient')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition cursor-pointer"
                            title="Mark Delivered"
                          >
                            Delivered
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const phone = (d.assignedPartnerWhatsapp || d.pickupContactPhone).replace(/[\s\+]/g, '');
                            const msg = `Salaam! Regarding Delivery Order ${d.trackingCode} (${d.packageDescription}) from ${d.pickupLocation} to ${d.destinationLocation}. Status: ${d.status}.`;
                            window.open(
                              `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`,
                              '_blank'
                            );
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          title="WhatsApp Dispatch"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        {d.status !== 'DELIVERED' && d.status !== 'CANCELLED' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => {
                              const reason = prompt('Reason for cancelling this delivery request:');
                              if (reason) {
                                handleUpdateStatus(d.id, 'CANCELLED', reason);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                            title="Cancel Delivery"
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
