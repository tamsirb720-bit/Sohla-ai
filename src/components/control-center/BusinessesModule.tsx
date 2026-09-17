import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  Phone,
  Edit2,
  Trash2,
  ShieldCheck,
  Eye,
  ExternalLink,
  ChevronDown,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { BusinessPartner } from '../../types';

interface BusinessesModuleProps {
  partners: BusinessPartner[];
  categories: any[];
  locations: string[];
  onRefresh: () => void;
  currentAdminName: string;
}

export const BusinessesModule: React.FC<BusinessesModuleProps> = ({
  partners,
  categories,
  locations,
  onRefresh,
  currentAdminName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState<Partial<BusinessPartner>>({
    name: '',
    category: 'RESTAURANTS',
    location: 'Senegambia',
    address: '',
    phone: '+220 ',
    whatsapp: '+220 ',
    email: '',
    description: '',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    openingHours: 'Mon - Sun: 09:00 - 22:00',
    deliveryAvailable: true,
    deliveryFee: 100,
    estimatedDeliveryTime: '30-45 mins',
    verified: true,
    verificationStatus: 'verified',
    active: true,
    activeStatus: true,
    featured: false,
    featuredStatus: false,
    rating: 4.8,
    reviewCount: 15
  });

  const filteredPartners = partners.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);

    const matchesCategory = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesLocation = selectedLocation === 'all' || p.location.toLowerCase() === selectedLocation.toLowerCase();
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'verified' && (p.verificationStatus === 'verified' || p.verified)) ||
      (selectedStatus === 'pending' && p.verificationStatus === 'pending') ||
      (selectedStatus === 'featured' && (p.featuredStatus || p.featured));

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  const handleOpenEdit = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setFormData({ ...partner });
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      category: categories[0]?.key || 'RESTAURANTS',
      location: locations[0] || 'Senegambia',
      address: 'Near Senegambia Beach Road',
      phone: '+220 700 0000',
      whatsapp: '+220 700 0000',
      email: 'contact@business.gm',
      description: 'Authentic local Gambian cuisine and hospitality.',
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
      coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      openingHours: 'Mon - Sun: 09:00 - 22:00',
      deliveryAvailable: true,
      deliveryFee: 100,
      estimatedDeliveryTime: '30-45 mins',
      verified: true,
      verificationStatus: 'verified',
      active: true,
      activeStatus: true,
      featured: false,
      featuredStatus: false,
      rating: 4.8,
      reviewCount: 1
    });
    setIsCreating(true);
  };

  const handleToggleVerification = async (partner: BusinessPartner) => {
    try {
      const nextStatus = partner.verificationStatus === 'verified' ? 'pending' : 'verified';
      await fetch(`/api/partners/${partner.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          verifiedPersonal: true,
          verifiedBy: currentAdminName || 'Admin'
        })
      });
      setActionMessage(`Updated verification status for ${partner.name}`);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle verification:', err);
    }
  };

  const handleToggleFeatured = async (partner: BusinessPartner) => {
    try {
      const nextFeatured = !partner.featuredStatus && !partner.featured;
      await fetch(`/api/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featured: nextFeatured,
          featuredStatus: nextFeatured,
          _adminName: currentAdminName
        })
      });
      setActionMessage(`Updated featured status for ${partner.name}`);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const handleDeletePartner = async (partner: BusinessPartner) => {
    if (!window.confirm(`Are you sure you want to remove ${partner.name}? This will also delete their catalog products.`)) {
      return;
    }
    try {
      await fetch(`/api/partners/${partner.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _adminName: currentAdminName })
      });
      setActionMessage(`Removed ${partner.name}`);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete partner:', err);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      if (isCreating) {
        await fetch('/api/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            _adminName: currentAdminName
          })
        });
        setActionMessage(`Successfully registered ${formData.name}`);
      } else if (editingPartner) {
        await fetch(`/api/partners/${editingPartner.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            _adminName: currentAdminName
          })
        });
        setActionMessage(`Updated ${formData.name}`);
      }
      setIsCreating(false);
      setEditingPartner(null);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to save partner:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionMessage}
          </span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            Businesses & Founding Partners
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Verified Gambian commerce partners ({partners.length} registered in system)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Business Partner
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search by business name, phone, area or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id || c.key} value={c.key}>
                  {c.name || c.key}
                </option>
              ))}
            </select>

            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Verification</option>
              <option value="featured">Featured Partners</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
          <span>Showing {filteredPartners.length} of {partners.length} partners</span>
          {(searchTerm || selectedCategory !== 'all' || selectedLocation !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedLocation('all');
                setSelectedStatus('all');
              }}
              className="text-amber-700 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-xl border border-[#EADBCA] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-stone-500 font-semibold border-b border-[#EADBCA]">
              <tr>
                <th className="p-3.5">Business & Category</th>
                <th className="p-3.5">Location & Contact</th>
                <th className="p-3.5">Status & Verification</th>
                <th className="p-3.5">Catalog</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400">
                    No business partners found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredPartners.map(partner => {
                  const isVerified = partner.verificationStatus === 'verified' || partner.verified;
                  const isFeatured = partner.featuredStatus || partner.featured;
                  const isActive = partner.activeStatus || partner.active;

                  return (
                    <tr key={partner.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Business & Category */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80';
                            }}
                          />
                          <div>
                            <div className="font-bold text-stone-900 flex items-center gap-1.5">
                              {partner.name}
                              {isFeatured && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  FEATURED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-stone-700">{partner.category}</span>
                              <span>•</span>
                              <span>{partner.rating} ★ ({partner.reviewCount || 0})</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location & Contact */}
                      <td className="p-3.5">
                        <div className="text-stone-900 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate">{partner.location}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                          <span>{partner.phone}</span>
                          {partner.whatsapp && <span>(WA: {partner.whatsapp})</span>}
                        </div>
                      </td>

                      {/* Status & Verification */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleVerification(partner)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                              isVerified
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {isVerified ? '✓ Verified' : '⧗ Pending'}
                          </button>

                          <button
                            onClick={() => handleToggleFeatured(partner)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                              isFeatured
                                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {isFeatured ? '★ Featured' : 'Standard'}
                          </button>
                        </div>
                      </td>

                      {/* Catalog */}
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-800">
                          {partner.products?.length || 0} Products
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {partner.services?.length || 0} Services
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(partner)}
                            title="Edit Partner Profile"
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePartner(partner)}
                            title="Delete Partner"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Business Modal */}
      {(isCreating || editingPartner) && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#EADBCA] shadow-2xl overflow-hidden my-8">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#EADBCA] flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                {isCreating ? 'Register New Business Partner' : `Edit ${editingPartner?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setEditingPartner(null);
                }}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g., Butcher's Shop Kololi"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Category *</label>
                  <select
                    value={formData.category || 'RESTAURANTS'}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id || c.key} value={c.key}>
                        {c.name || c.key}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Area / Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location || ''}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g., Senegambia, Kololi"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Physical Street Address</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                    placeholder="e.g., Senegambia Strip, Bertil Harding Hwy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                    placeholder="+220 700 0000"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">WhatsApp Hotline</label>
                  <input
                    type="text"
                    value={formData.whatsapp || ''}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                    placeholder="+220 700 0000"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                    placeholder="info@partner.gm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description / Specialty</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  placeholder="Describe culinary specials, signature items, delivery terms..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Logo URL</label>
                  <input
                    type="text"
                    value={formData.logo || ''}
                    onChange={e => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={formData.coverImage || ''}
                    onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Opening Hours</label>
                  <input
                    type="text"
                    value={formData.openingHours || ''}
                    onChange={e => setFormData({ ...formData, openingHours: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                    placeholder="Mon - Sun: 09:00 - 22:00"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Delivery Fee (Dalasi / GMD)</label>
                  <input
                    type="number"
                    value={formData.deliveryFee ?? 100}
                    onChange={e => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Est. Delivery Time</label>
                  <input
                    type="text"
                    value={formData.estimatedDeliveryTime || '30-45 mins'}
                    onChange={e => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.verificationStatus === 'verified' || formData.verified}
                    onChange={e => {
                      const v = e.target.checked;
                      setFormData({
                        ...formData,
                        verified: v,
                        verificationStatus: v ? 'verified' : 'pending'
                      });
                    }}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-stone-800">Verified Business</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featuredStatus || formData.featured}
                    onChange={e => {
                      const f = e.target.checked;
                      setFormData({
                        ...formData,
                        featured: f,
                        featuredStatus: f
                      });
                    }}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-stone-800">Featured Partner</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.activeStatus || formData.active}
                    onChange={e => {
                      const a = e.target.checked;
                      setFormData({
                        ...formData,
                        active: a,
                        activeStatus: a
                      });
                    }}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-stone-800">Active Status</span>
                </label>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPartner(null);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Business Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
