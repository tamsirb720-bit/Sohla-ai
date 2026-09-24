import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertTriangle,
  UserCheck,
  Building2,
  MapPin,
  Phone,
  FileCheck,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  BusinessPartner,
  ServiceItem,
  BeautyBooking,
  BookingStatus,
  HEALTHCARE_SERVICES_LIST
} from '../../types';

interface HealthcareServicesModuleProps {
  partners: BusinessPartner[];
  onRefresh: () => void;
  currentAdminName: string;
  token?: string;
}

export const HealthcareServicesModule: React.FC<HealthcareServicesModuleProps> = ({
  partners,
  onRefresh,
  currentAdminName,
  token
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'services' | 'bookings'>('catalog');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [bookings, setBookings] = useState<BeautyBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState<string>('all');

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form state
  const [formPartnerId, setFormPartnerId] = useState<string>('');
  const [formServiceName, setFormServiceName] = useState<string>(HEALTHCARE_SERVICES_LIST[0]);
  const [formCustomName, setFormCustomName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<number>(500);
  const [formPricingType, setFormPricingType] = useState<string>('Per Visit');
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(60);
  const [formDescription, setFormDescription] = useState<string>('');
  const [formServiceArea, setFormServiceArea] = useState<string>('Greater Banjul Area');
  const [formAppointmentRequirements, setFormAppointmentRequirements] = useState<string>('');
  const [formCredentialsInfo, setFormCredentialsInfo] = useState<string>('');
  const [formVerificationStatus, setFormVerificationStatus] = useState<'verified' | 'unverified' | 'pending'>('verified');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  const fetchServicesAndBookings = async () => {
    setIsLoading(true);
    try {
      const [srvRes, bkgRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/bookings')
      ]);

      if (srvRes.ok) {
        const srvData = await srvRes.json();
        if (Array.isArray(srvData)) {
          // Filter for healthcare & nursing services
          const hcServices = srvData.filter((s: ServiceItem) =>
            s.subcategory === 'Healthcare & Nursing' ||
            s.category === 'Healthcare & Nursing' ||
            HEALTHCARE_SERVICES_LIST.some(name => s.name?.toLowerCase().includes(name.toLowerCase()))
          );
          setServices(hcServices);
        }
      }

      if (bkgRes.ok) {
        const bkgData = await bkgRes.json();
        if (Array.isArray(bkgData)) {
          const hcBookings = bkgData.filter((b: BeautyBooking) =>
            b.serviceSubcategory === 'Healthcare & Nursing' ||
            HEALTHCARE_SERVICES_LIST.some(name => b.serviceName?.toLowerCase().includes(name.toLowerCase()))
          );
          setBookings(hcBookings);
        }
      }
    } catch (err) {
      console.warn('Error fetching healthcare data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServicesAndBookings();
  }, []);

  const handleOpenAddModal = (defaultServiceName?: string) => {
    setEditingService(null);
    const initialPartner = partners.length > 0 ? partners[0].id : '';
    setFormPartnerId(initialPartner);
    setFormServiceName(defaultServiceName || HEALTHCARE_SERVICES_LIST[0]);
    setFormCustomName('');
    setFormPrice(500);
    setFormPricingType('Per Visit');
    setFormDurationMinutes(60);
    setFormDescription('Professional nursing and patient care service in The Gambia.');
    setFormServiceArea('Greater Banjul Area (Brusubi, Senegambia, Sukuta, Fajara)');
    setFormAppointmentRequirements('Patient ID and doctor medical referral or prescription where applicable.');
    setFormCredentialsInfo('Gambian Nursing & Midwives Council Registered');
    setFormVerificationStatus('verified');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: ServiceItem) => {
    setEditingService(service);
    setFormPartnerId(service.partnerId || '');
    const isStandard = HEALTHCARE_SERVICES_LIST.includes(service.name as any);
    if (isStandard) {
      setFormServiceName(service.name);
      setFormCustomName('');
    } else {
      setFormServiceName('Custom');
      setFormCustomName(service.name);
    }
    setFormPrice(service.startingPrice || service.price || 500);
    setFormPricingType(service.pricingType || 'Per Visit');
    setFormDurationMinutes(service.durationMinutes || 60);
    setFormDescription(service.description || '');
    setFormServiceArea(service.serviceArea || 'Greater Banjul Area');
    setFormAppointmentRequirements(service.appointmentRequirements || '');
    setFormCredentialsInfo(service.credentialsInfo || '');
    setFormVerificationStatus(service.verificationStatus || 'verified');
    setFormIsActive(service.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartnerId) {
      alert('Please select a business partner / healthcare provider.');
      return;
    }

    const finalName = formServiceName === 'Custom' ? formCustomName.trim() : formServiceName;
    if (!finalName) {
      alert('Please provide a valid service name.');
      return;
    }

    setIsSaving(true);
    setActionMessage(null);

    const partner = partners.find(p => p.id === formPartnerId);

    const payload = {
      partnerId: formPartnerId,
      partnerName: partner?.name || 'Verified Provider',
      name: finalName,
      category: 'BEAUTY & WELLNESS',
      subcategory: 'Healthcare & Nursing',
      startingPrice: Number(formPrice),
      price: Number(formPrice),
      pricingType: formPricingType,
      durationMinutes: Number(formDurationMinutes),
      description: formDescription.trim(),
      serviceArea: formServiceArea.trim(),
      appointmentRequirements: formAppointmentRequirements.trim(),
      credentialsInfo: formCredentialsInfo.trim(),
      verificationStatus: formVerificationStatus,
      isActive: formIsActive,
      _adminName: currentAdminName
    };

    try {
      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save healthcare service.');
      }

      setActionMessage(
        editingService
          ? `Successfully updated "${finalName}".`
          : `Successfully registered verified service "${finalName}".`
      );
      setIsModalOpen(false);
      fetchServicesAndBookings();
      onRefresh();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error saving service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the service "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/services/${serviceId}?adminName=${encodeURIComponent(currentAdminName)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete service.');
      }
      setActionMessage(`Deleted service "${name}".`);
      fetchServicesAndBookings();
      onRefresh();
      setTimeout(() => setActionMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error deleting service');
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          status,
          _adminName: currentAdminName,
          _role: 'SUPER_ADMIN'
        })
      });
      if (res.ok) {
        setActionMessage(`Booking updated to ${status}.`);
        fetchServicesAndBookings();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.warn('Failed to update booking status:', err);
    }
  };

  // Filtered lists
  const filteredServices = services.filter(s => {
    const matchesSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.partnerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPartner = selectedPartnerId === 'all' || s.partnerId === selectedPartnerId;
    const matchesStatus =
      selectedVerificationStatus === 'all' || s.verificationStatus === selectedVerificationStatus;

    return matchesSearch && matchesPartner && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-stone-900 font-display">
                Healthcare & Nursing Administration
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
                Authoritative SOHLA Module
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage the 15 standard clinical care services, verified Gambian nurses/clinics, credential audits, and patient bookings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchServicesAndBookings}
            className="p-2.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Refresh from authoritative backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Verified Service</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-teal-700 hover:text-teal-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>15 Standard Service Types</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'services'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Active Provider Services ({services.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'bookings'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Healthcare Bookings ({bookings.length})</span>
        </button>
      </div>

      {/* TAB 1: 15 STANDARD SERVICE TYPES */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-950 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Strict Ethical Operating Policy:</strong> In compliance with SOHLA standards, no mock or simulated medical practitioners or false credentials may be displayed to customers. When no verified provider is registered for a service, customers see: <span className="font-semibold text-stone-800 italic">"No verified healthcare providers available yet."</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {HEALTHCARE_SERVICES_LIST.map((srvName, idx) => {
              const activeCount = services.filter(s => s.name?.toLowerCase() === srvName.toLowerCase()).length;
              return (
                <div
                  key={srvName}
                  className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-teal-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                        #{(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          activeCount > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-50 text-stone-500 border-stone-200'
                        }`}
                      >
                        {activeCount > 0 ? `${activeCount} Active Provider${activeCount > 1 ? 's' : ''}` : 'Pending Verified Provider'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-stone-900 mb-1">{srvName}</h3>
                    <p className="text-[11px] text-stone-500">
                      Standardized clinical service type under Beauty & Wellness → Healthcare & Nursing.
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">Fixed / Hourly Dalasi</span>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(srvName)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Assign Provider</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE SERVICES & PROVIDER REGISTRATION */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search services by title, provider, or notes..."
                className="w-full bg-transparent border-none text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedPartnerId}
                onChange={e => setSelectedPartnerId(e.target.value)}
                className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 text-xs"
              >
                <option value="all">All Partners / Clinics</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedVerificationStatus}
                onChange={e => setSelectedVerificationStatus(e.target.value)}
                className="p-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified Only</option>
                <option value="pending">Pending</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Service & Provider</th>
                    <th className="p-3.5">Pricing & Duration</th>
                    <th className="p-3.5">Service Area</th>
                    <th className="p-3.5">Verification / Credentials</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        {services.length === 0
                          ? 'No verified healthcare services registered in the database yet. Click "Register Verified Service" above to add one.'
                          : 'No services match the current filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map(srv => (
                      <tr key={srv.id} className="hover:bg-stone-50/70 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-stone-900">{srv.name}</div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-stone-400" />
                            <span>{srv.partnerName || 'Verified Partner'}</span>
                          </div>
                          {srv.description && (
                            <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">
                              {srv.description}
                            </p>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-teal-800">
                            D{(srv.startingPrice || srv.price || 0).toLocaleString()} GMD
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {srv.pricingType || 'Per Visit'} • {srv.durationMinutes || 60} mins
                          </div>
                        </td>
                        <td className="p-3.5 text-stone-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" />
                            <span>{srv.serviceArea || 'Greater Banjul'}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                              srv.verificationStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : srv.verificationStatus === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-stone-100 text-stone-600 border-stone-200'
                            }`}
                          >
                            {srv.verificationStatus?.toUpperCase() || 'VERIFIED'}
                          </span>
                          {srv.credentialsInfo && (
                            <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                              {srv.credentialsInfo}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              srv.isActive !== false
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {srv.isActive !== false ? 'Live' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(srv)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition"
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv.id, srv.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition"
                            title="Delete Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HEALTHCARE BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-3.5">Reference & Date</th>
                    <th className="p-3.5">Patient / Client</th>
                    <th className="p-3.5">Service & Clinic</th>
                    <th className="p-3.5">Visit Location</th>
                    <th className="p-3.5">Payment</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-400">
                        No healthcare appointments booked yet.
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} className="hover:bg-stone-50/70 transition">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-stone-900 block">{b.bookingCode}</span>
                          <span className="text-[11px] text-stone-500">
                            {b.bookingDate} @ {b.bookingTime}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-stone-900">{b.customerName}</div>
                          <div className="text-[11px] text-stone-500 font-mono">{b.customerPhone}</div>
                          {b.emergencyContactPhone && (
                            <div className="text-[10px] text-rose-600 font-mono">
                              Emergency: {b.emergencyContactPhone}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-stone-800">{b.serviceName}</div>
                          <div className="text-[11px] text-stone-500">{b.partnerName}</div>
                        </td>
                        <td className="p-3.5 text-stone-700">
                          {b.serviceLocationAddress ? (
                            <span className="line-clamp-2 max-w-xs">{b.serviceLocationAddress}</span>
                          ) : (
                            <span className="text-stone-400 italic">Clinic Visit</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-teal-800">D{b.servicePrice}</span>
                          <div className="text-[10px] text-stone-400">{b.paymentMethod}</div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              b.status === 'CONFIRMED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'COMPLETED'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          {b.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CONFIRMED')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                            >
                              Confirm
                            </button>
                          )}
                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'COMPLETED')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                            >
                              Complete
                            </button>
                          )}
                          {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'CANCELLED')}
                              className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT HEALTHCARE SERVICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="p-5 bg-gradient-to-r from-stone-900 via-teal-950 to-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {editingService ? 'Edit Healthcare Service Record' : 'Register Verified Healthcare Service'}
                  </h3>
                  <p className="text-xs text-teal-200/90">
                    Connects to authoritative SOHLA database and booking engine
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Registered Business Partner / Healthcare Provider <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={formPartnerId}
                  onChange={e => setFormPartnerId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="">-- Choose Partner --</option>
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location}) - {p.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Healthcare & Nursing Service Type <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formServiceName}
                  onChange={e => setFormServiceName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  {HEALTHCARE_SERVICES_LIST.map(name => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  <option value="Custom">Custom / Specialized Nursing Service...</option>
                </select>
              </div>

              {formServiceName === 'Custom' && (
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Custom Service Title <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formCustomName}
                    onChange={e => setFormCustomName(e.target.value)}
                    placeholder="e.g. Neonatal Phototherapy Home Monitoring"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Price (GMD Dalasi) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPrice}
                    onChange={e => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Pricing Model</label>
                  <select
                    value={formPricingType}
                    onChange={e => setFormPricingType(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                  >
                    <option value="Per Visit">Per Visit</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="Fixed">Fixed Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={formDurationMinutes}
                    onChange={e => setFormDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Service Area / Coverage in The Gambia</label>
                <input
                  type="text"
                  value={formServiceArea}
                  onChange={e => setFormServiceArea(e.target.value)}
                  placeholder="e.g. Greater Banjul Area, Senegambia, Brusubi, Sukuta"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Comprehensive clinical wound dressing, catheter change, or elderly home monitoring."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Appointment Requirements for Customer</label>
                <input
                  type="text"
                  value={formAppointmentRequirements}
                  onChange={e => setFormAppointmentRequirements(e.target.value)}
                  placeholder="e.g. Medical prescription required for injectable medication"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Professional License / Credentials</label>
                  <input
                    type="text"
                    value={formCredentialsInfo}
                    onChange={e => setFormCredentialsInfo(e.target.value)}
                    placeholder="e.g. GMC RN #2024-819"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Verification Status</label>
                  <select
                    value={formVerificationStatus}
                    onChange={e => setFormVerificationStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold"
                  >
                    <option value="verified">Verified (Displays Verified Badge)</option>
                    <option value="pending">Pending Verification Review</option>
                    <option value="unverified">Unverified (Requires Credential Check)</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={e => setFormIsActive(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-600"
                />
                <span className="font-bold text-stone-800">Immediately Available for Patient Bookings</span>
              </label>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 font-semibold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingService ? 'Update Service' : 'Confirm & Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
