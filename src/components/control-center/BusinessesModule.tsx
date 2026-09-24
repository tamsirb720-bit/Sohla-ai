import React, { useState, useRef } from 'react';
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
  AlertCircle,
  Image as ImageIcon,
  Upload,
  Video,
  Film,
  Loader2,
  RefreshCw,
  Link as LinkIcon
} from 'lucide-react';
import { BusinessPartner, OurWorkItem } from '../../types';
import { compressImageFile, compressMultipleImageFiles, readVideoFile } from '../../utils/mediaUtils';

interface BusinessesModuleProps {
  partners?: BusinessPartner[];
  categories?: any[];
  locations?: string[];
  onRefresh?: () => void;
  currentAdminName?: string;
}

const DEFAULT_CATEGORIES = [
  { key: 'SHOPPING', name: 'Shopping' },
  { key: 'FOOD & RESTAURANTS', name: 'Food & Restaurants' },
  { key: 'TRANSPORT', name: 'Transport' },
  { key: 'DELIVERY & ERRANDS', name: 'Delivery & Errands' },
  { key: 'BEAUTY & WELLNESS', name: 'Beauty & Wellness' },
  { key: 'SERVICES', name: 'Services' },
  { key: 'HOUSING & PROPERTIES', name: 'Housing & Properties' },
  { key: 'HOTELS & STAYS', name: 'Hotels & Stays' },
  { key: 'TOURISM & HOSPITALITY', name: 'Tourism & Hospitality' }
];

const DEFAULT_LOCATIONS = [
  'Senegambia', 'Kotu', 'Kololi', 'Bakau', 'Brusubi', 'Fajara', 'Banjul', 'Serekunda', 'Brikama'
];

export const BusinessesModule: React.FC<BusinessesModuleProps> = ({
  partners = [],
  categories = [],
  locations = [],
  onRefresh,
  currentAdminName = 'Admin'
}) => {
  const safeCategories = (categories && categories.length > 0) ? categories : DEFAULT_CATEGORIES;
  const safeLocations = (locations && locations.length > 0) ? locations : DEFAULT_LOCATIONS;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingPartner, setEditingPartner] = useState<BusinessPartner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Sub-tab for Edit Modal: 'general' vs 'media' (Our Work & Gallery)
  const [editModalTab, setEditModalTab] = useState<'general' | 'media'>('general');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [editingWorkIndex, setEditingWorkIndex] = useState<number | null>(null);
  const [isAddingWork, setIsAddingWork] = useState(false);
  const [workForm, setWorkForm] = useState<Partial<OurWorkItem>>({
    title: '',
    description: '',
    image: '',
    category: '',
    completedDate: ''
  });

  // Media upload & processing states
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingWorkImage, setIsUploadingWorkImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Hidden file inputs refs for native file/photo picker invocation
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const workImageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const filteredPartners = (partners || []).filter(p => {
    if (!p) return false;
    const name = p.name || '';
    const loc = p.location || '';
    const desc = p.description || '';
    const phone = p.phone || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);

    const matchesCategory = selectedCategory === 'all' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || (p.location && p.location.toLowerCase() === selectedLocation.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'verified' && (p.verificationStatus === 'verified' || p.verified)) ||
      (selectedStatus === 'pending' && p.verificationStatus === 'pending') ||
      (selectedStatus === 'featured' && (p.featuredStatus || p.featured));

    return matchesSearch && matchesCategory && matchesLocation && matchesStatus;
  });

  const handleOpenEdit = (partner: BusinessPartner) => {
    setEditingPartner(partner);
    setFormData({
      ...partner,
      photos: Array.isArray(partner.photos) ? [...partner.photos] : [],
      ourWork: Array.isArray(partner.ourWork) ? [...partner.ourWork] : []
    });
    setEditModalTab('general');
    setIsAddingWork(false);
    setEditingWorkIndex(null);
    setNewPhotoUrl('');
    setIsCreating(false);
  };

  const handleOpenCreate = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      category: safeCategories[0]?.key || 'RESTAURANTS',
      location: safeLocations[0] || 'Senegambia',
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
      reviewCount: 1,
      photos: [],
      ourWork: []
    });
    setEditModalTab('general');
    setIsAddingWork(false);
    setEditingWorkIndex(null);
    setNewPhotoUrl('');
    setIsCreating(true);
  };

  // Direct Device/Gallery Upload Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    setUploadError(null);
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.88 });
      setFormData(prev => ({ ...prev, logo: dataUrl }));
      setActionMessage('Business logo uploaded successfully');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to process logo file:', err);
      setUploadError(err?.message || 'Failed to process logo from device');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    setUploadError(null);
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1000, quality: 0.85 });
      setFormData(prev => ({ ...prev, coverImage: dataUrl }));
      setActionMessage('Business cover photo uploaded successfully');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to process cover file:', err);
      setUploadError(err?.message || 'Failed to process cover photo from device');
    } finally {
      setIsUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleGalleryFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhotos(true);
    setUploadError(null);
    try {
      const dataUrls = await compressMultipleImageFiles(files, { maxWidth: 1400, maxHeight: 1000, quality: 0.85 });
      if (dataUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), ...dataUrls]
        }));
        setActionMessage(`Added ${dataUrls.length} photo${dataUrls.length > 1 ? 's' : ''} from your device gallery`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to upload gallery photos:', err);
      setUploadError(err?.message || 'Failed to process photo gallery from device');
    } finally {
      setIsUploadingPhotos(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleWorkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWorkImage(true);
    setUploadError(null);
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 1400, maxHeight: 1000, quality: 0.85 });
      setWorkForm(prev => ({ ...prev, image: dataUrl }));
    } catch (err: any) {
      console.error('Failed to process showcase project image:', err);
      setUploadError(err?.message || 'Failed to process project image from device');
    } finally {
      setIsUploadingWorkImage(false);
      if (workImageInputRef.current) workImageInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setUploadError(null);
    try {
      const result = await readVideoFile(file, 30 * 1024 * 1024); // max 30MB
      setFormData(prev => ({ ...prev, videoUrl: result.dataUrl }));
      setActionMessage(`Uploaded video "${result.name}" (${Math.round(result.sizeKb / 1024 * 10) / 10} MB)`);
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to process video file:', err);
      setUploadError(err?.message || 'Failed to process video from device');
    } finally {
      setIsUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    const currentPhotos = formData.photos || [];
    setFormData({
      ...formData,
      photos: [...currentPhotos, newPhotoUrl.trim()]
    });
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    const currentPhotos = [...(formData.photos || [])];
    currentPhotos.splice(index, 1);
    setFormData({
      ...formData,
      photos: currentPhotos
    });
  };

  const handleSaveWorkItem = () => {
    if (!workForm.title?.trim() || !workForm.image?.trim()) return;
    const currentWork = [...(formData.ourWork || [])];
    const item: OurWorkItem = {
      id: editingWorkIndex !== null && currentWork[editingWorkIndex]?.id ? currentWork[editingWorkIndex].id : `work-${Date.now()}`,
      title: workForm.title.trim(),
      description: workForm.description?.trim() || '',
      image: workForm.image.trim(),
      category: workForm.category?.trim() || formData.category || 'General',
      completedDate: workForm.completedDate?.trim() || '2026'
    };

    if (editingWorkIndex !== null) {
      currentWork[editingWorkIndex] = item;
    } else {
      currentWork.push(item);
    }

    setFormData({
      ...formData,
      ourWork: currentWork
    });
    setIsAddingWork(false);
    setEditingWorkIndex(null);
    setWorkForm({ title: '', description: '', image: '', category: '', completedDate: '' });
  };

  const handleEditWorkItem = (index: number) => {
    const item = (formData.ourWork || [])[index];
    if (!item) return;
    setEditingWorkIndex(index);
    setWorkForm({ ...item });
    setIsAddingWork(true);
  };

  const handleRemoveWorkItem = (index: number) => {
    const currentWork = [...(formData.ourWork || [])];
    currentWork.splice(index, 1);
    setFormData({
      ...formData,
      ourWork: currentWork
    });
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
      onRefresh?.();
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
      onRefresh?.();
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
      onRefresh?.();
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
      onRefresh?.();
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
              {safeCategories.map((c: any) => (
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
              {safeLocations.map(loc => (
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

            {/* Modal Sub-Tabs: General Info vs Photos & Our Work */}
            <div className="flex border-b border-[#EADBCA] bg-[#FAF8F5] px-6 gap-3">
              <button
                type="button"
                onClick={() => setEditModalTab('general')}
                className={`py-2.5 text-xs font-bold border-b-2 transition ${
                  editModalTab === 'general'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                General Info & Hours
              </button>
              <button
                type="button"
                onClick={() => setEditModalTab('media')}
                className={`py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                  editModalTab === 'media'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Photos & Our Work ({(formData.photos?.length || 0) + (formData.ourWork?.length || 0)})</span>
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {editModalTab === 'general' ? (
                <>
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
                    {safeCategories.map((c: any) => (
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
                {/* Logo Section */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-800 text-xs">Business Logo</label>
                    <span className="text-[10px] text-stone-500">Avatar / Brand icon</span>
                  </div>

                  {/* Logo Preview & Native Picker Trigger */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-inner group">
                      {formData.logo ? (
                        <img
                          src={formData.logo}
                          alt="Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-stone-300" />
                      )}
                      {isUploadingLogo && (
                        <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.logo ? 'Replace Logo' : 'Upload Logo'}</span>
                        </button>

                        {formData.logo && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logo: '' })}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 font-semibold rounded-lg text-xs transition border border-stone-200"
                            title="Remove logo"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 leading-tight">
                        PNG, JPG, or WEBP from your phone gallery or computer.
                      </p>
                    </div>
                  </div>

                  {/* Fallback Image URL Input */}
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <LinkIcon className="w-3 h-3 text-stone-400" />
                      <span className="text-[10px] font-semibold text-stone-500">Or use web URL</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.logo || ''}
                      onChange={e => setFormData({ ...formData, logo: e.target.value })}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Cover Photo Section */}
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-800 text-xs">Cover Photo / Banner</label>
                    <span className="text-[10px] text-stone-500">Hero profile header</span>
                  </div>

                  {/* Cover Preview & Native Picker Trigger */}
                  <div className="space-y-2">
                    <div className="relative w-full h-20 rounded-xl border-2 border-dashed border-stone-300 bg-white overflow-hidden flex items-center justify-center shadow-inner group">
                      {formData.coverImage ? (
                        <img
                          src={formData.coverImage}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-stone-300">
                          <ImageIcon className="w-6 h-6 mb-1" />
                          <span className="text-[10px]">No cover banner uploaded</span>
                        </div>
                      )}
                      {isUploadingCover && (
                        <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="file"
                        ref={coverInputRef}
                        onChange={handleCoverUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={isUploadingCover}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{formData.coverImage ? 'Replace Cover' : 'Upload Cover'}</span>
                        </button>

                        {formData.coverImage && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, coverImage: '' })}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 font-semibold rounded-lg text-xs transition border border-stone-200"
                            title="Remove cover"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">Direct gallery upload</span>
                    </div>
                  </div>

                  {/* Fallback Cover URL Input */}
                  <div className="pt-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <LinkIcon className="w-3 h-3 text-stone-400" />
                      <span className="text-[10px] font-semibold text-stone-500">Or use web URL</span>
                    </div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.coverImage || ''}
                      onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                      className="w-full p-2 bg-white border border-stone-200 rounded-lg text-[11px] focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
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
                </>
              ) : (
                /* TAB 2: PHOTOS & OUR WORK MANAGEMENT */
                <div className="space-y-6">
                  {/* Photo Gallery Section */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-amber-600" />
                          Photo Gallery ({formData.photos?.length || 0})
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Photos displayed under the business profile's Photo Gallery
                        </p>
                      </div>

                      {/* Primary Native Upload Action */}
                      <div>
                        <input
                          type="file"
                          ref={galleryInputRef}
                          onChange={handleGalleryFilesUpload}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => galleryInputRef.current?.click()}
                          disabled={isUploadingPhotos}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isUploadingPhotos ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>+ Add Photos (From Gallery)</span>
                        </button>
                      </div>
                    </div>

                    {/* Secondary / Fallback: Paste URL */}
                    <div className="pt-1 border-t border-stone-200/70">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <LinkIcon className="w-3 h-3 text-stone-400" />
                        <span className="text-[10px] font-semibold text-stone-500">Or paste image URL</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Paste image URL (https://...)"
                          value={newPhotoUrl}
                          onChange={e => setNewPhotoUrl(e.target.value)}
                          className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleAddPhoto}
                          disabled={!newPhotoUrl.trim()}
                          className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg text-xs transition disabled:opacity-50 border border-stone-200 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add URL</span>
                        </button>
                      </div>
                    </div>

                    {/* Photos Grid */}
                    {formData.photos && formData.photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                        {formData.photos.map((photo, pIdx) => (
                          <div key={pIdx} className="relative group rounded-lg overflow-hidden border border-stone-200 bg-white aspect-video shadow-sm">
                            <img
                              src={photo}
                              alt={`Gallery ${pIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRemovePhoto(pIdx)}
                                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow transition"
                                title="Remove photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-xl bg-white/60">
                        <ImageIcon className="w-7 h-7 text-stone-300 mx-auto mb-1.5" />
                        <p className="text-stone-500 font-medium text-xs">No gallery photos added yet</p>
                        <p className="text-stone-400 text-[11px] mt-0.5">
                          Tap "+ Add Photos" above to select photos directly from your phone or computer.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Our Work / Projects Section */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-600" />
                          Our Work & Showcase Projects ({formData.ourWork?.length || 0})
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Featured work displayed on the customer profile's "Our Work & Gallery" tab
                        </p>
                      </div>
                      {!isAddingWork && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingWorkIndex(null);
                            setWorkForm({
                              title: '',
                              description: '',
                              image: '',
                              category: formData.category || 'General',
                              completedDate: '2026'
                            });
                            setIsAddingWork(true);
                          }}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Project</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Work Item Form (Add / Edit) */}
                    {isAddingWork && (
                      <div className="p-3 bg-white border border-amber-300 rounded-xl space-y-3">
                        <div className="font-bold text-stone-800 text-xs flex items-center justify-between">
                          <span>{editingWorkIndex !== null ? 'Edit Project' : 'New Project Showcase'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingWork(false);
                              setEditingWorkIndex(null);
                            }}
                            className="text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Project Title *</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. VIP Atlantic Seafood Banquet"
                              value={workForm.title || ''}
                              onChange={e => setWorkForm({ ...workForm, title: e.target.value })}
                              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Project Photo *</label>
                            <input
                              type="file"
                              ref={workImageInputRef}
                              onChange={handleWorkImageUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <div className="flex items-center gap-2">
                              {workForm.image ? (
                                <img
                                  src={workForm.image}
                                  alt="Work Preview"
                                  className="w-9 h-9 rounded object-cover border border-stone-200 shrink-0"
                                />
                              ) : null}
                              <button
                                type="button"
                                onClick={() => workImageInputRef.current?.click()}
                                disabled={isUploadingWorkImage}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                              >
                                {isUploadingWorkImage ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5" />
                                )}
                                <span>{workForm.image ? 'Replace Photo' : 'Upload Photo'}</span>
                              </button>
                              {workForm.image && (
                                <button
                                  type="button"
                                  onClick={() => setWorkForm({ ...workForm, image: '' })}
                                  className="px-2 py-1 text-stone-400 hover:text-rose-600 text-xs"
                                  title="Clear photo"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <input
                              type="url"
                              placeholder="Or paste image URL (https://...)"
                              value={workForm.image || ''}
                              onChange={e => setWorkForm({ ...workForm, image: e.target.value })}
                              className="w-full mt-1.5 p-1.5 bg-white border border-stone-200 rounded-md text-[11px] font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Category / Tag</label>
                            <input
                              type="text"
                              placeholder="e.g. Catering, Seafood, Renovation"
                              value={workForm.category || ''}
                              onChange={e => setWorkForm({ ...workForm, category: e.target.value })}
                              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Completed Date</label>
                            <input
                              type="text"
                              placeholder="e.g. March 2026"
                              value={workForm.completedDate || ''}
                              onChange={e => setWorkForm({ ...workForm, completedDate: e.target.value })}
                              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Description</label>
                          <textarea
                            rows={2}
                            placeholder="Describe what was accomplished, guest count, specialties served, etc."
                            value={workForm.description || ''}
                            onChange={e => setWorkForm({ ...workForm, description: e.target.value })}
                            className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingWork(false);
                              setEditingWorkIndex(null);
                            }}
                            className="px-3 py-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveWorkItem}
                            disabled={!workForm.title?.trim() || !workForm.image?.trim()}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg transition disabled:opacity-50"
                          >
                            {editingWorkIndex !== null ? 'Update Project' : 'Save Project'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing Work Items List */}
                    {formData.ourWork && formData.ourWork.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        {formData.ourWork.map((work, wIdx) => (
                          <div key={work.id || wIdx} className="p-2.5 rounded-lg bg-white border border-stone-200 flex items-start gap-3">
                            <img
                              src={work.image}
                              alt={work.title}
                              className="w-16 h-12 rounded object-cover border border-stone-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900 truncate">{work.title}</span>
                                {work.category && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                    {work.category}
                                  </span>
                                )}
                                {work.completedDate && (
                                  <span className="text-[10px] text-stone-400">{work.completedDate}</span>
                                )}
                              </div>
                              <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">{work.description}</p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditWorkItem(wIdx)}
                                className="p-1 text-stone-400 hover:text-amber-600"
                                title="Edit project"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveWorkItem(wIdx)}
                                className="p-1 text-stone-400 hover:text-rose-600"
                                title="Delete project"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center py-4 text-stone-400 text-[11px]">
                        No showcase projects added yet. Click "Add Project" above to create one.
                      </p>
                    )}
                  </div>

                  {/* Business Video Showcase Section */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                          <Film className="w-4 h-4 text-amber-600" />
                          Promotional Video / Reel (Optional)
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          Upload an MP4 / WebM video showcase or link a video clip
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={videoInputRef}
                          onChange={handleVideoUpload}
                          accept="video/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={isUploadingVideo}
                          className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isUploadingVideo ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Video className="w-3.5 h-3.5" />
                          )}
                          <span>{formData.videoUrl ? 'Replace Video' : 'Upload Video'}</span>
                        </button>
                        {formData.videoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, videoUrl: '' })}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 font-semibold rounded-lg text-xs transition border border-stone-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Video Player Preview if present */}
                    {formData.videoUrl ? (
                      <div className="rounded-lg overflow-hidden border border-stone-200 bg-black aspect-video max-h-56">
                        <video
                          src={formData.videoUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : null}

                    {/* URL fallback */}
                    <div className="pt-1 border-t border-stone-200/70">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <LinkIcon className="w-3 h-3 text-stone-400" />
                        <span className="text-[10px] font-semibold text-stone-500">Or video URL (MP4 / Direct Link)</span>
                      </div>
                      <input
                        type="url"
                        placeholder="https://.../video.mp4"
                        value={formData.videoUrl || ''}
                        onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

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
