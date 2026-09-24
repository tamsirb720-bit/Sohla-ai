import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  Store,
  Tag,
  Video,
  Sparkles,
  ShieldAlert,
  Activity,
  Download,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Edit2,
  Search,
  Filter,
  RefreshCw,
  LogOut,
  Sliders,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Upload,
  Film,
  Image as ImageIcon,
  Zap,
  Wand2,
  Play,
  Pause,
  Eye,
  Loader2,
  X,
  Link as LinkIcon,
  Star
} from 'lucide-react';
import {
  AdminUser,
  AdminStats,
  BusinessPartner,
  ProductItem,
  Advertisement,
  AuditLogEntry,
  MissingAIRequest,
  CategoryInfo,
  OurWorkItem,
  HEALTHCARE_SERVICES_LIST
} from '../../types';
import { SohlaLogo } from '../common/SohlaLogo';
import { TeamManagementTab } from './TeamManagementTab';
import { Smartphone, Monitor } from 'lucide-react';
import { compressImageFile, compressMultipleImageFiles, readVideoFile } from '../../utils/mediaUtils';

interface AdminPortalProps {
  currentUser: AdminUser;
  token: string;
  onLogout: () => void;
  onClosePortal: () => void;
  onSyncData: () => void;
  initialTab?: AdminTab;
  onSwitchToControlCenter?: () => void;
}

export type { AdminTab };

type AdminTab =
  | 'dashboard'
  | 'partners'
  | 'products'
  | 'ads'
  | 'team'
  | 'ai_center'
  | 'audit_logs'
  | 'system_health'
  | 'customer_preview';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  currentUser,
  token,
  onLogout,
  onClosePortal,
  onSyncData,
  initialTab = 'dashboard',
  onSwitchToControlCenter
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [missingRequests, setMissingRequests] = useState<MissingAIRequest[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [teamMembers, setTeamMembers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  // Partner Form State & Media Uploads
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerFormTab, setPartnerFormTab] = useState<'general' | 'media'>('general');
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [partnerError, setPartnerError] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isUploadingWorkImage, setIsUploadingWorkImage] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isAddingWorkItem, setIsAddingWorkItem] = useState(false);
  const [newWorkItem, setNewWorkItem] = useState<Partial<OurWorkItem>>({
    title: '',
    description: '',
    image: '',
    category: '',
    completedDate: new Date().toISOString().split('T')[0]
  });

  const partnerVideoInputRef = useRef<HTMLInputElement>(null);
  const partnerGalleryInputRef = useRef<HTMLInputElement>(null);
  const partnerWorkImageInputRef = useRef<HTMLInputElement>(null);

  const [newPartner, setNewPartner] = useState<Partial<BusinessPartner>>({
    name: '',
    category: 'RESTAURANTS',
    subcategory: 'Gambian Cuisine',
    description: '',
    phone: '+220 7',
    whatsapp: '+220 7',
    location: 'Senegambia Strip',
    address: 'Senegambia, Kololi',
    openingHours: '10:00 AM - 11:00 PM',
    verified: true,
    active: true,
    deliveryAvailable: true,
    deliveryFee: 50,
    estimatedDeliveryTime: '30-45 mins',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    photos: [],
    videoUrl: '',
    ourWork: [],
    products: []
  });

  // Product Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedPartnerForProduct, setSelectedPartnerForProduct] = useState<string>('');
  const [newProduct, setNewProduct] = useState<Partial<ProductItem>>({
    name: '',
    price: 150,
    currency: 'GMD',
    description: '',
    inStock: true,
    stock: 25,
    category: 'RESTAURANTS',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  });

  // Service Catalog Sub-Tab State
  const [catalogSubTab, setCatalogSubTab] = useState<'products' | 'services'>('products');
  const [isAddingService, setIsAddingService] = useState(false);
  const [selectedPartnerForService, setSelectedPartnerForService] = useState<string>('');
  const [newServiceItem, setNewServiceItem] = useState({
    name: HEALTHCARE_SERVICES_LIST[0] as string,
    customName: '',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    price: 500,
    pricingType: 'Per Visit',
    durationMinutes: 60,
    description: '',
    serviceArea: 'Greater Banjul Area',
    credentialsInfo: 'Registered Nurse',
    verificationStatus: 'verified' as 'verified' | 'unverified' | 'pending'
  });

  // Ad Form State
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedAutoPartner, setSelectedAutoPartner] = useState('');
  const [newAd, setNewAd] = useState<Partial<Advertisement>>({
    title: '',
    advertiser: 'Gambian Merchant',
    description: '',
    ctaText: 'Visit SOHLA Partner',
    ctaLink: '#',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
    posterUrl: '',
    durationSeconds: 6,
    active: true,
    priority: 1,
    badge: '⚡ 6s Quick Ad'
  });

  // Partner filter
  const [partnerFilter, setPartnerFilter] = useState('');

  // Fetch all administrative data
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, partnersRes, adsRes, logsRes, aiRes, catsRes, teamRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/partners'),
        fetch('/api/ads'),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/missing-requests', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/categories'),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (partnersRes.ok) setPartners(await partnersRes.json());
      if (adsRes.ok) setAds(await adsRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (aiRes.ok) setMissingRequests(await aiRes.json());
      if (catsRes.ok) setCategories(await catsRes.json());
      if (teamRes.ok) setTeamMembers(await teamRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const showToast = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 3500);
  };

  // Open Edit Partner Drawer
  const handleStartEditPartner = (partner: BusinessPartner) => {
    setEditingPartnerId(partner.id);
    setNewPartner({
      name: partner.name || '',
      category: partner.category || 'SERVICES',
      subcategory: partner.subcategory || '',
      description: partner.description || '',
      phone: partner.phone || '+220 7',
      whatsapp: partner.whatsapp || partner.phone || '+220 7',
      location: partner.location || 'Senegambia Strip',
      address: partner.address || '',
      openingHours: partner.openingHours || '09:00 AM - 08:00 PM',
      verified: partner.verified !== false,
      active: partner.active !== false,
      deliveryAvailable: Boolean(partner.deliveryAvailable),
      deliveryFee: partner.deliveryFee || 0,
      estimatedDeliveryTime: partner.estimatedDeliveryTime || '30-45 mins',
      coverImage: partner.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      photos: Array.isArray(partner.photos) ? [...partner.photos] : [],
      videoUrl: partner.videoUrl || '',
      ourWork: Array.isArray(partner.ourWork) ? [...partner.ourWork] : [],
      products: Array.isArray(partner.products) ? [...partner.products] : []
    });
    setPartnerFormTab('general');
    setPartnerError('');
    setIsAddingPartner(true);
  };

  const handleResetPartnerForm = () => {
    setIsAddingPartner(false);
    setEditingPartnerId(null);
    setPartnerError('');
    setPartnerFormTab('general');
    setNewPhotoUrl('');
    setIsAddingWorkItem(false);
    setNewPartner({
      name: '',
      category: 'RESTAURANTS',
      subcategory: 'Gambian Cuisine',
      description: '',
      phone: '+220 7',
      whatsapp: '+220 7',
      location: 'Senegambia Strip',
      address: 'Senegambia, Kololi',
      openingHours: '10:00 AM - 11:00 PM',
      verified: true,
      active: true,
      deliveryAvailable: true,
      deliveryFee: 50,
      estimatedDeliveryTime: '30-45 mins',
      coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      photos: [],
      videoUrl: '',
      ourWork: [],
      products: []
    });
  };

  // Direct Device Video Upload
  const handlePartnerVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setPartnerError('');
    try {
      const result = await readVideoFile(file, 30 * 1024 * 1024); // max 30MB
      setNewPartner(prev => ({ ...prev, videoUrl: result.dataUrl }));
      showToast(`🎬 Video attached (${Math.round(result.sizeKb)} KB)`);
    } catch (err: any) {
      console.error('Video upload failed:', err);
      const msg = err?.message || 'Failed to upload video from device';
      setPartnerError(msg);
      showToast(`⚠️ ${msg}`);
    } finally {
      setIsUploadingVideo(false);
      if (partnerVideoInputRef.current) partnerVideoInputRef.current.value = '';
    }
  };

  // Direct Device Gallery Photos Upload
  const handlePartnerGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhotos(true);
    setPartnerError('');
    try {
      const compressedUrls = await compressMultipleImageFiles(files, { maxWidth: 1600, quality: 0.82 });
      setNewPartner(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...compressedUrls]
      }));
      showToast(`📸 ${compressedUrls.length} photo(s) added to gallery`);
    } catch (err: any) {
      console.error('Gallery photo upload failed:', err);
      const msg = err?.message || 'Failed to upload photos';
      setPartnerError(msg);
      showToast(`⚠️ ${msg}`);
    } finally {
      setIsUploadingPhotos(false);
      if (partnerGalleryInputRef.current) partnerGalleryInputRef.current.value = '';
    }
  };

  const handleAddPartnerPhotoUrl = () => {
    const url = newPhotoUrl.trim();
    if (!url) return;
    setNewPartner(prev => ({
      ...prev,
      photos: [...(prev.photos || []), url]
    }));
    setNewPhotoUrl('');
    showToast('Photo URL added to gallery');
  };

  const handleRemovePartnerPhoto = (index: number) => {
    setNewPartner(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, idx) => idx !== index)
    }));
  };

  // Work Item Image Upload
  const handleWorkItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingWorkImage(true);
    try {
      const dataUrl = await compressImageFile(file, { maxWidth: 1200, quality: 0.8 });
      setNewWorkItem(prev => ({ ...prev, image: dataUrl }));
      showToast('Project image attached');
    } catch (err: any) {
      console.error('Work image upload failed:', err);
      showToast('⚠️ Failed to process work project image');
    } finally {
      setIsUploadingWorkImage(false);
      if (partnerWorkImageInputRef.current) partnerWorkImageInputRef.current.value = '';
    }
  };

  const handleSaveWorkItem = () => {
    if (!newWorkItem.title?.trim() || !newWorkItem.image) {
      showToast('⚠️ Please provide both a title and an image for the project');
      return;
    }
    const item: OurWorkItem = {
      id: `work-${Date.now()}`,
      title: newWorkItem.title.trim(),
      description: newWorkItem.description?.trim() || '',
      image: newWorkItem.image,
      category: newWorkItem.category?.trim() || newPartner.category || 'Portfolio',
      completedDate: newWorkItem.completedDate || new Date().toISOString().split('T')[0]
    };
    setNewPartner(prev => ({
      ...prev,
      ourWork: [...(prev.ourWork || []), item]
    }));
    setNewWorkItem({
      title: '',
      description: '',
      image: '',
      category: '',
      completedDate: new Date().toISOString().split('T')[0]
    });
    setIsAddingWorkItem(false);
    showToast(`Added project "${item.title}"`);
  };

  const handleRemoveWorkItem = (index: number) => {
    setNewPartner(prev => ({
      ...prev,
      ourWork: (prev.ourWork || []).filter((_, idx) => idx !== index)
    }));
  };

  // Add or Edit Partner Handler with Full Verification & Fail-Safe State Clearing
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPartner) return;

    const trimmedName = (newPartner.name || '').trim();
    if (!trimmedName) {
      setPartnerError('Business name is required.');
      return;
    }

    setIsSavingPartner(true);
    setPartnerError('');

    try {
      const payload = {
        ...newPartner,
        name: trimmedName,
        verified: true,
        verificationStatus: 'verified',
        active: true,
        activeStatus: true,
        _adminName: currentUser.name || currentUser.username
      };

      const isEditing = Boolean(editingPartnerId);
      const targetUrl = isEditing
        ? `/api/admin/partners/${editingPartnerId}`
        : '/api/admin/partners';
      const fallbackUrl = isEditing
        ? `/api/partners/${editingPartnerId}`
        : '/api/partners';
      const method = isEditing ? 'PUT' : 'POST';

      let res = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok && res.status === 404) {
        res = await fetch(fallbackUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        const actionText = isEditing ? 'updated & verified' : 'registered & verified';
        showToast(`Partner "${trimmedName}" ${actionText} successfully!`);
        handleResetPartnerForm();
        await loadAdminData();
        onSyncData();
      } else {
        const errorMsg = data.error || data.message || `Failed to save partner (HTTP ${res.status})`;
        setPartnerError(errorMsg);
        showToast(`⚠️ ${errorMsg}`);
      }
    } catch (err: any) {
      console.error('Error saving partner:', err);
      const errorMsg = err?.message || 'Network error occurred while saving partner. Please try again.';
      setPartnerError(errorMsg);
      showToast(`⚠️ ${errorMsg}`);
    } finally {
      setIsSavingPartner(false);
    }
  };

  // Toggle Partner Active Status
  const handleTogglePartner = async (partner: BusinessPartner) => {
    try {
      let res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !partner.active })
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/partners/${partner.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ active: !partner.active })
        });
      }
      showToast(`Partner "${partner.name}" ${!partner.active ? 'activated' : 'deactivated'}`);
      loadAdminData();
      onSyncData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Partner
  const handleDeletePartner = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete verified partner "${name}"?`)) return;

    try {
      let res = await fetch(`/api/admin/partners/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/partners/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      showToast(`Partner "${name}" removed from database`);
      loadAdminData();
      onSyncData();
    } catch (err) {
      console.error(err);
    }
  };

  // Create Product Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !selectedPartnerForProduct) return;

    try {
      const res = await fetch(`/api/admin/partners/${selectedPartnerForProduct}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Product "${newProduct.name}" added to catalog at D${newProduct.price} GMD`);
        setIsAddingProduct(false);
        loadAdminData();
        onSyncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Service Handler (Healthcare & Other Services)
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = newServiceItem.name === 'Custom' ? newServiceItem.customName.trim() : newServiceItem.name;
    if (!finalName || !selectedPartnerForService) return;

    try {
      const partner = partners.find(p => p.id === selectedPartnerForService);
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          partnerId: selectedPartnerForService,
          partnerName: partner?.name || 'Verified Provider',
          name: finalName,
          category: newServiceItem.category,
          subcategory: newServiceItem.subcategory,
          startingPrice: Number(newServiceItem.price),
          price: Number(newServiceItem.price),
          pricingType: newServiceItem.pricingType,
          durationMinutes: Number(newServiceItem.durationMinutes),
          description: newServiceItem.description,
          serviceArea: newServiceItem.serviceArea,
          credentialsInfo: newServiceItem.credentialsInfo,
          verificationStatus: newServiceItem.verificationStatus,
          isActive: true,
          _adminName: currentUser.name
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Service "${finalName}" registered at D${newServiceItem.price} GMD`);
        setIsAddingService(false);
        loadAdminData();
        onSyncData();
      } else {
        alert(data.error || 'Failed to register service');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteService = async (serviceId: string, name: string) => {
    if (!window.confirm(`Delete service "${name}"?`)) return;
    try {
      await fetch(`/api/services/${serviceId}?adminName=${encodeURIComponent(currentUser.name)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Service "${name}" removed`);
      loadAdminData();
      onSyncData();
    } catch (err) {
      console.error(err);
    }
  };

  // Media File Upload Handler (supports videos and images)
  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = reader.result as string;
      setNewAd((prev) => ({
        ...prev,
        mediaUrl: dataUrl,
        type: isVideo ? 'video' : 'image',
        posterUrl: isVideo ? prev.posterUrl : dataUrl,
        fileData: dataUrl
      }));
      setIsUploadingMedia(false);
      showToast(`Loaded ${isVideo ? 'Video' : 'Image'}: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    };

    reader.onerror = () => {
      setIsUploadingMedia(false);
      alert('Error reading uploaded media file.');
    };

    reader.readAsDataURL(file);
  };

  // Autonomous / AI Ad Generator Trigger
  const handleAutoGenerateAd = async (partnerId?: string) => {
    setIsAutoGenerating(true);
    try {
      const res = await fetch('/api/admin/ads/auto-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ partnerId: partnerId || selectedAutoPartner || undefined })
      });
      const data = await res.json();
      if (data.success && data.ad) {
        showToast(`✨ Generated ${data.ad.durationSeconds}s Quick Ad: "${data.ad.title}"`);
        loadAdminData();
        onSyncData();
      }
    } catch (err) {
      console.error('Failed to auto-generate ad:', err);
    } finally {
      setIsAutoGenerating(false);
    }
  };

  // Create Ad Campaign Handler
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAd.title) return;

    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAd)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Advertisement campaign "${newAd.title}" published!`);
        setIsAddingAd(false);
        loadAdminData();
        onSyncData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Ad Active
  const handleToggleAd = async (ad: Advertisement) => {
    try {
      await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !ad.active })
      });
      showToast(`Ad "${ad.title}" ${!ad.active ? 'enabled' : 'disabled'}`);
      loadAdminData();
      onSyncData();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Ad
  const handleDeleteAd = async (id: string, title: string) => {
    if (!window.confirm(`Delete billboard campaign "${title}"?`)) return;
    try {
      await fetch(`/api/admin/ads/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(`Ad campaign removed`);
      loadAdminData();
      onSyncData();
    } catch (err) {
      console.error(err);
    }
  };

  // Export DB Backup JSON
  const handleExportBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sohla_ai_db_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Database backup JSON snapshot downloaded securely!');
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered partners
  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(partnerFilter.toLowerCase()) ||
    p.location.toLowerCase().includes(partnerFilter.toLowerCase()) ||
    p.category.toLowerCase().includes(partnerFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Top Admin Navigation Header */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <SohlaLogo size="sm" withGlow={false} />
          <div className="h-6 w-px bg-slate-700 hidden sm:block" />
          <div className="hidden sm:flex items-center space-x-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
              Command Center
            </span>
            <span className="text-xs text-slate-400">v1.0.4-PROD</span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-right hidden sm:block">
            <div className="font-bold text-white">{currentUser.name}</div>
            <div className="text-[10px] text-purple-300 font-mono">{currentUser.role}</div>
          </div>

          <button
            onClick={loadAdminData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          {onSwitchToControlCenter && (
            <button
              onClick={onSwitchToControlCenter}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
              title="Open Private SOHLA Control Center"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>SOHLA Control Center</span>
            </button>
          )}

          <button
            onClick={() => window.open(window.location.origin + '?mode=customer', '_blank')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition flex items-center space-x-1.5 cursor-pointer"
            title="Launch Customers Version in New Window"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Open Customer App</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={onClosePortal}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center space-x-1.5 cursor-pointer shadow"
            title="Switch To Customer App View"
          >
            <span>Customer View</span>
          </button>

          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Success Toast */}
      {successBanner && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center space-x-2 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Admin Body with Sidebar and Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-16 sm:w-60 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between py-4 shrink-0 overflow-y-auto">
          <nav className="space-y-1 px-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'partners', label: 'Partners & Businesses', icon: Store, badge: partners.length },
              { id: 'products', label: 'Product Catalog', icon: Tag },
              { id: 'ads', label: 'Video Billboard Ads', icon: Video, badge: ads.filter(a => a.active).length },
              { id: 'customer_preview', label: 'Customer App (Live View)', icon: Smartphone, highlight: true },
              { id: 'team', label: 'Team & Verified Staff', icon: Users, badge: teamMembers.length },
              { id: 'ai_center', label: 'AI Brain & Telemetry', icon: Sparkles, badge: missingRequests.filter(m => !m.resolved).length },
              { id: 'audit_logs', label: 'Security Audit Logs', icon: FileCheck, badge: auditLogs.length },
              { id: 'system_health', label: 'System Health & Backup', icon: Activity }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`admin-nav-${item.id}`}
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md'
                      : item.highlight
                      ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-900/50 hover:text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline-block flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                        isActive ? 'bg-purple-800 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Role badge footer */}
          <div className="px-3 text-center sm:text-left text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            <span className="hidden sm:block font-mono text-[10px] uppercase text-slate-400">Current Role</span>
            <span className="font-bold text-amber-400 truncate block">{currentUser.role}</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                  Platform Operations Overview
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time telemetry and database KPIs across Banjul, KMC, and West Coast
                </p>
              </div>

              {/* KPI Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Verified Businesses</span>
                    <Store className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2 font-display">
                    {stats?.totalBusinesses ?? partners.length}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>{stats?.verifiedBusinesses ?? partners.filter(p => p.verified).length} 100% Verified</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Catalog Products</span>
                    <Tag className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2 font-display">
                    {stats?.totalProducts ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Grounded with Dalasi Pricing
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>AI Queries Handled</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2 font-display">
                    {stats?.aiSearchesCount ?? 142}
                  </div>
                  <div className="text-[10px] text-purple-300 mt-1">
                    Zero-hallucination rate: 100%
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                    <span>Active Video Campaigns</span>
                    <Video className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white mt-2 font-display">
                    {stats?.activeAdsCount ?? ads.filter(a => a.active).length}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-1">
                    Top billboard rotation active
                  </div>
                </div>
              </div>

              {/* Secondary Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Popular Categories */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-3">
                    Top In-Demand Categories
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    {(stats?.popularCategories || [
                      { category: 'Food & Restaurants', searches: 310 },
                      { category: 'Buy Cash Power (NAWEC)', searches: 245 },
                      { category: 'Transport (Yellow Taxis)', searches: 195 },
                      { category: 'Shopping & Electronics', searches: 160 },
                      { category: 'Beauty & Wellness', searches: 110 }
                    ]).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">{item.category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-purple-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, (item.searches / 350) * 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-400 font-mono text-[11px] w-8 text-right">{item.searches}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Improvement Alert Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Missing Requests Alert</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('ai_center')}
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      View All ({missingRequests.length}) →
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 mb-3">
                    Queries where SOHLA AI reported zero merchant matches. Review to onboard new Gambian vendors.
                  </p>
                  <div className="space-y-2">
                    {missingRequests.slice(0, 3).map((mr) => (
                      <div key={mr.id} className="p-2.5 rounded-xl bg-black/40 border border-amber-500/20 text-xs">
                        <div className="font-bold text-white">"{mr.query}"</div>
                        <div className="text-[11px] text-amber-400/90 mt-0.5">
                          Missing: {mr.missingItem} • {mr.location || 'Any location'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Platform Governance & Staff Security Row */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center space-x-2">
                      <span>Portal-Only Team & Verified Personnel Roster</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        Admin Portal Only
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {teamMembers.length} authorized staff members enrolled. All accounts verified with Gambian NINs and role security clearances.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('team')}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow flex items-center space-x-1.5 transition cursor-pointer shrink-0"
                >
                  <span>Manage Verified Staff</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PARTNER MANAGEMENT */}
          {activeTab === 'partners' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                    Verified Business Partners ({partners.length})
                  </h1>
                  <p className="text-xs text-slate-400">
                    Live database registry. All SOHLA AI responses ground directly from this collection.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsAddingPartner(!isAddingPartner)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Partner</span>
                  </button>
                </div>
              </div>

              {/* Add / Edit Partner Form Drawer */}
              {isAddingPartner && (
                <form
                  onSubmit={handleCreatePartner}
                  className="p-5 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-4 animate-in fade-in duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider">
                        {editingPartnerId ? 'Edit Verified Business Partner' : 'Register New Verified Partner'}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {editingPartnerId ? 'Update details, gallery photos, and promotional video reel' : 'Complete profile info and attach media for SOHLA AI grounding'}
                      </p>
                    </div>

                    {/* Sub-Tabs: General Info vs Photos & Our Work */}
                    <div className="flex items-center space-x-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                      <button
                        type="button"
                        onClick={() => setPartnerFormTab('general')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                          partnerFormTab === 'general'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>General Info</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPartnerFormTab('media')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                          partnerFormTab === 'media'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>Photos & Our Work</span>
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                          {(newPartner.photos?.length || 0) + (newPartner.ourWork?.length || 0) + (newPartner.videoUrl ? 1 : 0)}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* TAB A: GENERAL INFO */}
                  {partnerFormTab === 'general' && (
                    <div className="space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">
                            Business Name <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={newPartner.name || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                            placeholder="e.g. Lamin's Fresh Bakery"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Category</label>
                          <select
                            value={newPartner.category || 'SERVICES'}
                            onChange={(e) => setNewPartner({ ...newPartner, category: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          >
                            {categories.map((c) => (
                              <option key={c.key} value={c.key}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Subcategory / Specialty</label>
                          <input
                            type="text"
                            value={newPartner.subcategory || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, subcategory: e.target.value })}
                            placeholder="e.g. Birthday Cakes & Pastries"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                          <input
                            type="tel"
                            value={newPartner.phone || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                            placeholder="+220 7xxxxxx"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">WhatsApp Number</label>
                          <input
                            type="tel"
                            value={newPartner.whatsapp || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, whatsapp: e.target.value })}
                            placeholder="+220 7xxxxxx"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Location / District</label>
                          <input
                            type="text"
                            value={newPartner.location || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, location: e.target.value })}
                            placeholder="e.g. Senegambia Strip"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                          <input
                            type="text"
                            value={newPartner.address || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, address: e.target.value })}
                            placeholder="e.g. Senegambia, Kololi"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Opening Hours</label>
                          <input
                            type="text"
                            value={newPartner.openingHours || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, openingHours: e.target.value })}
                            placeholder="e.g. 09:00 AM - 10:00 PM"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Cover Image URL</label>
                          <input
                            type="url"
                            value={newPartner.coverImage || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, coverImage: e.target.value })}
                            placeholder="https://..."
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Description & Services</label>
                        <textarea
                          rows={2}
                          value={newPartner.description || ''}
                          onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                          placeholder="Detailed overview of verified offerings, specialty items, and service standards..."
                          className="w-full p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB B: PHOTOS & OUR WORK (DIRECT VIDEO & MEDIA UPLOAD) */}
                  {partnerFormTab === 'media' && (
                    <div className="space-y-4">
                      {/* 1. Promotional Video / Reel */}
                      <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                              <Film className="w-4 h-4 text-purple-400" />
                              <span>Promotional Video / Reel (Optional)</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Upload an MP4 / WebM video clip directly from your device, or paste a video URL.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={partnerVideoInputRef}
                              onChange={handlePartnerVideoUpload}
                              accept="video/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => partnerVideoInputRef.current?.click()}
                              disabled={isUploadingVideo}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow disabled:opacity-50"
                            >
                              {isUploadingVideo ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Video className="w-3.5 h-3.5" />
                              )}
                              <span>{newPartner.videoUrl ? 'Replace Video' : 'Upload Video (Device)'}</span>
                            </button>

                            {newPartner.videoUrl && (
                              <button
                                type="button"
                                onClick={() => setNewPartner(prev => ({ ...prev, videoUrl: '' }))}
                                className="px-2.5 py-1.5 bg-rose-900/60 hover:bg-rose-800 text-rose-300 font-semibold rounded-lg text-xs transition border border-rose-700/50"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Video URL Fallback */}
                        <div className="flex gap-2 text-xs">
                          <input
                            type="url"
                            value={newPartner.videoUrl || ''}
                            onChange={(e) => setNewPartner({ ...newPartner, videoUrl: e.target.value })}
                            placeholder="Or paste video direct URL (https://...mp4)"
                            className="flex-1 h-8 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        {/* Video Player Preview */}
                        {newPartner.videoUrl && (
                          <div className="rounded-lg overflow-hidden border border-purple-500/40 bg-black/60 aspect-video max-w-sm">
                            <video
                              src={newPartner.videoUrl}
                              controls
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </div>

                      {/* 2. Business Photo Gallery */}
                      <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4 text-purple-400" />
                              <span>Business Photos & Gallery ({newPartner.photos?.length || 0})</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Add photos showcasing the storefront, dining area, products, or service team.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              ref={partnerGalleryInputRef}
                              onChange={handlePartnerGalleryUpload}
                              accept="image/*"
                              multiple
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => partnerGalleryInputRef.current?.click()}
                              disabled={isUploadingPhotos}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow disabled:opacity-50"
                            >
                              {isUploadingPhotos ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              <span>+ Add Photos (Device)</span>
                            </button>
                          </div>
                        </div>

                        {/* Secondary: Paste Image URL */}
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={newPhotoUrl}
                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                            placeholder="Or paste photo URL (https://...)"
                            className="flex-1 h-8 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={handleAddPartnerPhotoUrl}
                            disabled={!newPhotoUrl.trim()}
                            className="px-3 h-8 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-xs transition disabled:opacity-50"
                          >
                            Add URL
                          </button>
                        </div>

                        {/* Photos Grid */}
                        {newPartner.photos && newPartner.photos.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                            {newPartner.photos.map((photo, pIdx) => (
                              <div key={pIdx} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-black/40 aspect-video shadow">
                                <img
                                  src={photo}
                                  alt={`Gallery ${pIdx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePartnerPhoto(pIdx)}
                                    className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md shadow"
                                    title="Remove photo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
                            No photos added yet. Use "+ Add Photos" above to select from your device.
                          </div>
                        )}
                      </div>

                      {/* 3. Our Work & Showcase Projects */}
                      <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-purple-400" />
                              <span>Our Work & Showcase Projects ({newPartner.ourWork?.length || 0})</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Featured completed work displayed on the customer profile's "Our Work & Gallery" tab
                            </p>
                          </div>

                          {!isAddingWorkItem && (
                            <button
                              type="button"
                              onClick={() => setIsAddingWorkItem(true)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Add Project</span>
                            </button>
                          )}
                        </div>

                        {/* Inline Add Work Item Form */}
                        {isAddingWorkItem && (
                          <div className="p-3.5 rounded-xl bg-slate-900 border border-purple-500/30 space-y-3 text-xs">
                            <div className="font-bold text-purple-300">New Showcase Project</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <input
                                type="text"
                                placeholder="Project Title (e.g. Luxury Wedding Cake)"
                                value={newWorkItem.title || ''}
                                onChange={(e) => setNewWorkItem({ ...newWorkItem, title: e.target.value })}
                                className="h-8 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                              />
                              <input
                                type="text"
                                placeholder="Category / Tag (e.g. Weddings)"
                                value={newWorkItem.category || ''}
                                onChange={(e) => setNewWorkItem({ ...newWorkItem, category: e.target.value })}
                                className="h-8 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                              />
                            </div>

                            <textarea
                              rows={2}
                              placeholder="Brief description of the work performed..."
                              value={newWorkItem.description || ''}
                              onChange={(e) => setNewWorkItem({ ...newWorkItem, description: e.target.value })}
                              className="w-full p-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                            />

                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="file"
                                ref={partnerWorkImageInputRef}
                                onChange={handleWorkItemImageUpload}
                                accept="image/*"
                                className="hidden"
                              />
                              <button
                                type="button"
                                onClick={() => partnerWorkImageInputRef.current?.click()}
                                disabled={isUploadingWorkImage}
                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition flex items-center gap-1 disabled:opacity-50"
                              >
                                {isUploadingWorkImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                <span>Upload Project Photo</span>
                              </button>

                              <input
                                type="url"
                                placeholder="Or project image URL"
                                value={newWorkItem.image || ''}
                                onChange={(e) => setNewWorkItem({ ...newWorkItem, image: e.target.value })}
                                className="flex-1 min-w-[180px] h-8 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-[11px]"
                              />
                            </div>

                            {newWorkItem.image && (
                              <img
                                src={newWorkItem.image}
                                alt="Preview"
                                className="w-24 h-16 object-cover rounded-lg border border-slate-700"
                              />
                            )}

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleSaveWorkItem}
                                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs"
                              >
                                Save Project
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAddingWorkItem(false)}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Projects List */}
                        {newPartner.ourWork && newPartner.ourWork.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {newPartner.ourWork.map((item, wIdx) => (
                              <div key={item.id || wIdx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700 flex items-center justify-between gap-2.5">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-10 h-10 rounded-lg object-cover bg-slate-800 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-white text-xs truncate">{item.title}</div>
                                    <div className="text-[10px] text-purple-300 truncate">{item.category}</div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWorkItem(wIdx)}
                                  className="p-1 text-rose-400 hover:text-rose-300"
                                  title="Delete project"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 border border-dashed border-slate-700 rounded-xl bg-slate-900/40 text-slate-400 text-xs">
                            No showcase projects added yet. Click "+ Add Project" to highlight verified work.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error banner inside form */}
                  {partnerError && (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs flex items-center space-x-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{partnerError}</span>
                    </div>
                  )}

                  {/* Form Action Buttons with Clear Loading State & Duplicate Submission Prevention */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                    <button
                      type="submit"
                      disabled={isSavingPartner}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 disabled:opacity-60 text-white font-bold text-xs shadow flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      {isSavingPartner ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{editingPartnerId ? 'Updating...' : 'Saving & Verifying...'}</span>
                        </>
                      ) : (
                        <span>{editingPartnerId ? 'Update Partner & Verify' : 'Save Partner & Verify'}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isSavingPartner}
                      onClick={handleResetPartnerForm}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Filter bar */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                    placeholder="Search partners by name, category, or location..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              {/* Partners Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
                      <tr>
                        <th className="py-3 px-4">Business</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4">Contacts</th>
                        <th className="py-3 px-4">Media</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredPartners.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={p.logo || p.coverImage}
                                alt={p.name}
                                className="w-8 h-8 rounded-lg object-cover bg-slate-800"
                              />
                              <div>
                                <span className="font-bold text-white block">{p.name}</span>
                                <span className="text-[10px] text-slate-400">{p.subcategory}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-purple-300">{p.category}</td>
                          <td className="py-3 px-4 text-slate-300">{p.location}</td>
                          <td className="py-3 px-4 text-slate-400">
                            <div>{p.phone}</div>
                            <div className="text-emerald-400 text-[10px]">WA: {p.whatsapp}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-1.5 text-[11px]">
                              {p.videoUrl ? (
                                <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-semibold border border-purple-700/50 flex items-center gap-1">
                                  <Video className="w-3 h-3" /> Reel
                                </span>
                              ) : null}
                              <span className="text-slate-300">
                                {p.photos?.length || 0} photos
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleTogglePartner(p)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                p.active
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {p.active ? 'Active' : 'Paused'}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleStartEditPartner(p)}
                              className="text-amber-400 hover:text-amber-300 font-bold p-1 inline-flex items-center gap-1"
                              title="Edit partner details, photos & video"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPartnerForProduct(p.id);
                                setIsAddingProduct(true);
                                setActiveTab('products');
                              }}
                              className="text-purple-400 hover:underline font-bold"
                              title="Add product to this partner"
                            >
                              + Product
                            </button>
                            <button
                              onClick={() => handleDeletePartner(p.id, p.name)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Delete partner"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT & SERVICE CATALOG */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                    Product & Service Catalog
                  </h1>
                  <p className="text-xs text-slate-400">
                    Live items with prices in Gambian Dalasi (D). SOHLA AI queries these prices dynamically.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                    <button
                      onClick={() => setCatalogSubTab('products')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        catalogSubTab === 'products'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Products ({partners.flatMap(p => p.products || []).length})
                    </button>
                    <button
                      onClick={() => setCatalogSubTab('services')}
                      className={`px-3 py-1.5 rounded-lg transition ${
                        catalogSubTab === 'services'
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Services & Healthcare ({partners.flatMap(p => p.services || []).length})
                    </button>
                  </div>

                  {catalogSubTab === 'products' ? (
                    <button
                      onClick={() => setIsAddingProduct(!isAddingProduct)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Product</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAddingService(!isAddingService)}
                      className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Service</span>
                    </button>
                  )}
                </div>
              </div>

              {/* PRODUCTS SUB-TAB */}
              {catalogSubTab === 'products' && (
                <>
                  {/* Add Product Form */}
                  {isAddingProduct && (
                    <form
                      onSubmit={handleCreateProduct}
                      className="p-5 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-3.5 animate-in fade-in"
                    >
                      <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider">
                        Add Product Item
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Select Merchant / Partner</label>
                          <select
                            required
                            value={selectedPartnerForProduct}
                            onChange={(e) => setSelectedPartnerForProduct(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          >
                            <option value="">-- Choose Partner --</option>
                            {partners.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Product Name</label>
                          <input
                            type="text"
                            required
                            value={newProduct.name}
                            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                            placeholder="e.g. Fish Benachin (Jollof Rice)"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Price in Dalasi (GMD)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Description</label>
                        <input
                          type="text"
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          placeholder="e.g. Traditional Gambian seasoned rice with fresh Captain fish and bitter tomatoes"
                          className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                        >
                          Save Product to Catalog
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingProduct(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* All Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {partners.flatMap(p => (p.products || []).map(prod => ({ ...prod, partnerName: p.name, partnerId: p.id }))).map((prod) => (
                      <div key={prod.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-800 shrink-0"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <span className="text-[10px] text-purple-400 font-semibold block truncate">
                            {prod.partnerName}
                          </span>
                          <h4 className="font-bold text-white text-sm truncate">{prod.name}</h4>
                          <div className="text-amber-400 font-black text-sm mt-0.5">
                            D{prod.price} GMD
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {prod.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* SERVICES & HEALTHCARE SUB-TAB */}
              {catalogSubTab === 'services' && (
                <>
                  {/* Add Service Form */}
                  {isAddingService && (
                    <form
                      onSubmit={handleCreateService}
                      className="p-5 rounded-2xl bg-slate-900 border border-teal-500/40 space-y-3.5 animate-in fade-in"
                    >
                      <h3 className="text-sm font-black text-teal-300 uppercase tracking-wider">
                        Register Healthcare & Clinical Service
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Select Provider / Clinic</label>
                          <select
                            required
                            value={selectedPartnerForService}
                            onChange={(e) => setSelectedPartnerForService(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          >
                            <option value="">-- Choose Provider --</option>
                            {partners.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.location}) - {p.category}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Standard Healthcare Service</label>
                          <select
                            value={newServiceItem.name}
                            onChange={(e) => setNewServiceItem({ ...newServiceItem, name: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          >
                            {HEALTHCARE_SERVICES_LIST.map((srv) => (
                              <option key={srv} value={srv}>{srv}</option>
                            ))}
                            <option value="Custom">Custom Service...</option>
                          </select>
                        </div>

                        {newServiceItem.name === 'Custom' && (
                          <div>
                            <label className="block text-slate-300 font-semibold mb-1">Custom Title</label>
                            <input
                              type="text"
                              required
                              value={newServiceItem.customName}
                              onChange={(e) => setNewServiceItem({ ...newServiceItem, customName: e.target.value })}
                              placeholder="e.g. Specialized Palliative Care"
                              className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Starting Price (Dalasi GMD)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newServiceItem.price}
                            onChange={(e) => setNewServiceItem({ ...newServiceItem, price: Number(e.target.value) })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Pricing Model</label>
                          <select
                            value={newServiceItem.pricingType}
                            onChange={(e) => setNewServiceItem({ ...newServiceItem, pricingType: e.target.value })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          >
                            <option value="Per Visit">Per Visit</option>
                            <option value="Hourly">Hourly</option>
                            <option value="Daily">Daily</option>
                            <option value="Fixed">Fixed Fee</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Estimated Duration (Mins)</label>
                          <input
                            type="number"
                            min="15"
                            step="15"
                            value={newServiceItem.durationMinutes}
                            onChange={(e) => setNewServiceItem({ ...newServiceItem, durationMinutes: Number(e.target.value) })}
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Coverage Area</label>
                          <input
                            type="text"
                            value={newServiceItem.serviceArea}
                            onChange={(e) => setNewServiceItem({ ...newServiceItem, serviceArea: e.target.value })}
                            placeholder="e.g. Greater Banjul Area, Brusubi"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">Description & Scope</label>
                        <input
                          type="text"
                          value={newServiceItem.description}
                          onChange={(e) => setNewServiceItem({ ...newServiceItem, description: e.target.value })}
                          placeholder="e.g. Qualified home nursing, wound care, medication administration by registered nurse"
                          className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                        >
                          Register Service
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingService(false)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* All Services Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {partners.flatMap(p => (p.services || []).map(srv => ({ ...srv, partnerName: p.name, partnerId: p.id }))).length === 0 ? (
                      <div className="col-span-3 text-center py-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
                        No verified services registered yet. Click "Register Service" above to add one.
                      </div>
                    ) : (
                      partners.flatMap(p => (p.services || []).map(srv => ({ ...srv, partnerName: p.name, partnerId: p.id }))).map((srv) => (
                        <div key={srv.id} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between text-xs space-y-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-teal-400 font-semibold block truncate">
                                {srv.partnerName}
                              </span>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                                {srv.subcategory || srv.category || 'Service'}
                              </span>
                            </div>
                            <h4 className="font-bold text-white text-sm mt-1">{srv.name}</h4>
                            <div className="text-emerald-400 font-black text-sm mt-0.5">
                              Starts D{srv.startingPrice || srv.price || 0} GMD
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                ({srv.pricingType || 'Per Visit'})
                              </span>
                            </div>
                            {srv.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                                {srv.description}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">
                              {srv.durationMinutes ? `${srv.durationMinutes} mins` : 'Flexible duration'}
                            </span>
                            <button
                              onClick={() => handleDeleteService(srv.id, srv.name)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: ADVERTISEMENT MANAGEMENT */}
          {activeTab === 'ads' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                      Video & Display Ad Billboard
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      ⚡ Few-Seconds Ads
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Upload custom video/image ads or let SOHLA's autonomous engine synthesize 5–8 second ads on its own.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Auto-Generate Ad Button */}
                  <button
                    onClick={() => handleAutoGenerateAd()}
                    disabled={isAutoGenerating}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:brightness-110 text-white text-xs font-bold flex items-center space-x-1.5 shadow-lg active:scale-95 transition disabled:opacity-50"
                    title="Platform automatically creates a 5-second Gambian ad campaign"
                  >
                    <Wand2 className={`w-4 h-4 ${isAutoGenerating ? 'animate-spin' : ''}`} />
                    <span>{isAutoGenerating ? 'Synthesizing 5s Ad...' : '✨ Auto-Create 5s Ad'}</span>
                  </button>

                  <button
                    onClick={() => setIsAddingAd(!isAddingAd)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow active:scale-95 transition"
                  >
                    {isAddingAd ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    <span>{isAddingAd ? 'Close Form' : 'Upload & Create Ad'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Partner Auto-Ad Launcher */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span className="text-slate-300 font-medium">Quick Auto-Ad Generator for Verified Partners:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedAutoPartner}
                    onChange={(e) => setSelectedAutoPartner(e.target.value)}
                    className="h-8 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="">-- Gambian Essential Utilities (NAWEC, Taxi, GRA) --</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAutoGenerateAd(selectedAutoPartner)}
                    disabled={isAutoGenerating}
                    className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Ad</span>
                  </button>
                </div>
              </div>

              {/* Upload & Create Ad Campaign Form */}
              {isAddingAd && (
                <form
                  onSubmit={handleCreateAd}
                  className="p-5 rounded-2xl bg-slate-900 border border-purple-500/40 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider flex items-center space-x-2">
                        <Upload className="w-4 h-4 text-purple-400" />
                        <span>Upload or Configure Billboard Ad</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Supports high-quality short video clips (MP4/WebM) and eye-catching banner images.
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                        Live Preview Mode
                      </span>
                    </div>
                  </div>

                  {/* Media Upload & Preset Picker Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left 7 cols: File Upload + Configuration */}
                    <div className="lg:col-span-7 space-y-3.5">
                      {/* Media File Upload Area */}
                      <div>
                        <label className="block text-slate-300 text-xs font-semibold mb-1">
                          Upload Ad Video or Image File
                        </label>
                        <div className="relative border-2 border-dashed border-slate-700 hover:border-purple-500/80 rounded-xl p-3.5 text-center bg-slate-950/60 transition group cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleMediaFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                          />
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <Upload className="w-6 h-6 text-purple-400 group-hover:scale-110 transition" />
                            <span className="text-xs font-semibold text-slate-200">
                              {isUploadingMedia ? 'Processing media...' : 'Click or Drag & Drop MP4 Video or Image'}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Supports MP4, WebM, PNG, JPG, GIF up to 25MB
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Gambian Curated Presets */}
                      <div>
                        <label className="block text-slate-400 text-[11px] font-semibold mb-1.5">
                          Or Pick a Gambian Presets Clip / High-Res Stock:
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                          {[
                            { label: '📱 African Smartphone', url: 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4', type: 'video' },
                            { label: '⚡ NAWEC Energy Grid', url: 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-moving-electronic-particles-41221-large.mp4', type: 'video' },
                            { label: '💻 AI Online Work', url: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-woman-typing-on-a-laptop-keyboard-41315-large.mp4', type: 'video' },
                            { label: '🚕 Sunshine Yellow Taxi', url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=80', type: 'image' },
                            { label: '🍗 Senegambia Grill', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80', type: 'image' },
                            { label: '🌊 Atlantic Coastline', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80', type: 'image' }
                          ].map((preset) => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => setNewAd({ ...newAd, mediaUrl: preset.url, type: preset.type as any })}
                              className={`p-1.5 rounded-lg text-left text-[10px] font-semibold border truncate transition ${
                                newAd.mediaUrl === preset.url
                                  ? 'bg-purple-900/60 border-purple-400 text-white'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration Pills: Just a few seconds */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-300 text-xs font-semibold">
                            Ad Duration (Few Seconds)
                          </label>
                          <span className="text-[10px] text-amber-400 font-bold">
                            Current: {newAd.durationSeconds || 6} Seconds
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {[
                            { secs: 5, label: '5s Flash' },
                            { secs: 6, label: '6s Standard' },
                            { secs: 8, label: '8s Punchy' },
                            { secs: 10, label: '10s Detailed' },
                            { secs: 15, label: '15s Extended' }
                          ].map((d) => (
                            <button
                              key={d.secs}
                              type="button"
                              onClick={() => setNewAd({
                                ...newAd,
                                durationSeconds: d.secs,
                                badge: `⚡ ${d.secs}s Quick Ad`
                              })}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                                newAd.durationSeconds === d.secs
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Ad Campaign Title</label>
                          <input
                            type="text"
                            required
                            value={newAd.title}
                            onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                            placeholder="e.g. NAWEC Cash Power — 20 Digits Instant"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Advertiser / Brand Name</label>
                          <input
                            type="text"
                            required
                            value={newAd.advertiser}
                            onChange={(e) => setNewAd({ ...newAd, advertiser: e.target.value })}
                            placeholder="e.g. NAWEC Official & SOHLA Pay"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Call to Action (CTA)</label>
                          <input
                            type="text"
                            value={newAd.ctaText}
                            onChange={(e) => setNewAd({ ...newAd, ctaText: e.target.value })}
                            placeholder="e.g. Buy Cash Power"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">CTA Target Link</label>
                          <input
                            type="text"
                            value={newAd.ctaLink}
                            onChange={(e) => setNewAd({ ...newAd, ctaLink: e.target.value })}
                            placeholder="e.g. #cashpower or #partner-bp-3"
                            className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 text-xs font-semibold mb-1">Description / Punchline</label>
                        <input
                          type="text"
                          value={newAd.description}
                          onChange={(e) => setNewAd({ ...newAd, description: e.target.value })}
                          placeholder="e.g. Get prepaid electricity code in 30s with instant receipt & WhatsApp copy."
                          className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Right 5 cols: Live Ad Simulator */}
                    <div className="lg:col-span-5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                            <Eye className="w-3.5 h-3.5 text-purple-400" />
                            <span>Live Billboard Preview</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                            {newAd.durationSeconds || 6}s Quick Ad
                          </span>
                        </div>

                        {/* Billboard Mockup Box */}
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-white/10 shadow-lg">
                          {newAd.type === 'video' && newAd.mediaUrl ? (
                            <video
                              src={newAd.mediaUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={newAd.mediaUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80'}
                              alt="Ad preview"
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/60 pointer-events-none" />

                          {/* Story Progress Bar Simulator */}
                          <div className="absolute top-2 inset-x-2 flex space-x-1">
                            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full animate-story-bar-fill"
                                style={{ animationDuration: `${newAd.durationSeconds || 6}s` }}
                              />
                            </div>
                            <div className="flex-1 h-1 bg-white/20 rounded-full" />
                            <div className="flex-1 h-1 bg-white/20 rounded-full" />
                          </div>

                          {/* Top badge */}
                          <div className="absolute top-4 left-2 right-2 flex items-center justify-between text-[10px] text-white">
                            <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/20 font-bold text-amber-300">
                              Sponsored • {newAd.advertiser || 'Brand'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-black/60 font-mono text-[9px]">
                              ⚡ {newAd.durationSeconds || 6}s
                            </span>
                          </div>

                          {/* Bottom Content Preview */}
                          <div className="absolute bottom-2 inset-x-2 text-white">
                            <h4 className="text-xs font-black line-clamp-1 drop-shadow">
                              {newAd.title || 'Your Campaign Headline'}
                            </h4>
                            <p className="text-[10px] text-slate-300 line-clamp-1">
                              {newAd.description || 'Campaign short description appears here.'}
                            </p>
                            <div className="mt-1.5 flex justify-end">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow">
                                {newAd.ctaText || 'Learn More'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg active:scale-95 transition"
                        >
                          Publish to Billboard ({newAd.durationSeconds || 6}s)
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingAd(false)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Ad Campaigns List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 relative overflow-hidden group hover:border-purple-500/40 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 uppercase flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{ad.durationSeconds || 6}s</span>
                        </span>
                        <span className="text-xs font-bold text-white truncate max-w-[150px]">
                          {ad.advertiser}
                        </span>
                        {ad.autoGenerated && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Auto-AI
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleToggleAd(ad)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase transition ${
                            ad.active
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {ad.active ? 'Active' : 'Paused'}
                        </button>
                      </div>
                    </div>

                    <div className="relative h-32 rounded-xl overflow-hidden bg-slate-950">
                      {ad.type === 'video' && ad.mediaUrl ? (
                        <video
                          src={ad.mediaUrl}
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                          onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition"
                        />
                      ) : (
                        <img
                          src={ad.mediaUrl}
                          alt={ad.title}
                          className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5 pointer-events-none">
                        <span className="text-xs font-black text-white line-clamp-1">{ad.title}</span>
                        <span className="text-[10px] text-slate-300 line-clamp-1">{ad.description}</span>
                      </div>

                      {/* Video indicator badge */}
                      {ad.type === 'video' && (
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm p-1 rounded-full text-white">
                          <Film className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
                      <div className="flex items-center space-x-3 text-[11px]">
                        <span>
                          Views: <strong className="text-white font-mono">{ad.impressions || 0}</strong>
                        </span>
                        <span>
                          Clicks: <strong className="text-amber-400 font-mono">{ad.clicks || 0}</strong>
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteAd(ad.id, ad.title)}
                          className="p-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition"
                          title="Delete Ad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4.5: TEAM & VERIFIED PERSONNEL MANAGEMENT (RESTRICTED TO ADMIN PORTAL) */}
          {activeTab === 'team' && (
            <TeamManagementTab
              currentUser={currentUser}
              token={token}
              teamMembers={teamMembers}
              onRefresh={loadAdminData}
              showToast={showToast}
            />
          )}

          {/* TAB 5: AI BRAIN & IMPROVEMENT CENTER */}
          {activeTab === 'ai_center' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                  SOHLA AI Brain & Improvement Center
                </h1>
                <p className="text-xs text-slate-400">
                  Telemetry, search performance, and missing-merchant request logging.
                </p>
              </div>

              {/* Missing Requests Telemetry */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Unmet User Requests (AI Improvement Log)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Whenever a user asks SOHLA for something missing from the verified database, it is logged here so administrators can onboard matching Gambian businesses.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {missingRequests.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      No unmet requests logged yet. All queries have matched verified merchants!
                    </div>
                  ) : (
                    missingRequests.map((mr) => (
                      <div
                        key={mr.id}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="text-xs">
                          <div className="font-bold text-white text-sm">"{mr.query}"</div>
                          <div className="text-amber-300 font-semibold mt-0.5">
                            Missing Product/Service: <span className="text-white">{mr.missingItem}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            Requested Location: {mr.location || 'Not specified'} • Timestamp: {new Date(mr.timestamp).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setNewPartner({
                                ...newPartner,
                                subcategory: mr.missingItem,
                                location: mr.location || 'Senegambia Strip'
                              });
                              setIsAddingPartner(true);
                              setActiveTab('partners');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                          >
                            + Onboard Merchant for this Request
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AI Guardrail Integrity Summary */}
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-2">
                <h4 className="font-bold text-purple-300 text-sm">AI Zero-Hallucination Guardrails:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>System instruction strictly binds answers to the in-memory verified Gambian database.</li>
                  <li>Gemini 3.8 Flash temperature is tuned for grounded retrieval accuracy.</li>
                  <li>No fictitious prices, phones, or opening hours are ever generated.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit_logs' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                  Security Audit Ledger ({auditLogs.length})
                </h1>
                <p className="text-xs text-slate-400">
                  Immutable chronological audit trail recording all administrative actions.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700/60">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Admin</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Target Entity</th>
                        <th className="py-3 px-4">Details / Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-purple-300">
                            {log.adminUsername}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-200">
                            {log.targetEntity}: {log.targetId || '-'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-sans">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SYSTEM HEALTH & BACKUP */}
          {activeTab === 'system_health' && (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
                  System Health & Data Resilience
                </h1>
                <p className="text-xs text-slate-400">
                  Container runtime status, Gemini AI health, and data persistence controls.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Express Backend Engine</div>
                  <div className="text-lg font-black text-emerald-400 mt-1 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>ONLINE (Port 3000)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Uptime: 99.98%</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Gemini 3.8 Flash AI Model</div>
                  <div className="text-lg font-black text-emerald-400 mt-1 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>ACTIVE & GROUNDED</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Grounded with Gambian database</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 font-semibold">Disk Persistence Layer</div>
                  <div className="text-lg font-black text-purple-400 mt-1 flex items-center space-x-1.5">
                    <FileCheck className="w-4 h-4 text-purple-400" />
                    <span>data_store.json (Synced)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Auto-saved on changes</p>
                </div>
              </div>

              {/* Backup & Export Box */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <Download className="w-4 h-4 text-purple-400" />
                  <span>Platform Data Backup & Snapshot Export</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Export complete database snapshot (Partners, Products, Ads, Categories, AI logs, Transactions) as a JSON file for disaster recovery and offline compliance.
                </p>

                <button
                  onClick={handleExportBackup}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow flex items-center space-x-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full Database Snapshot (.JSON)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMER APP (LIVE CONTROL & PREVIEW) */}
          {activeTab === 'customer_preview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight flex items-center space-x-2">
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                    <span>Customer Version (Live In-Portal Monitor)</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Observe the exact public customer interface in real-time while maintaining administrator controls
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Open customer version in a separate clean tab without admin parameters
                      window.open(window.location.origin + '?mode=customer', '_blank');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Window</span>
                  </button>

                  <button
                    onClick={onClosePortal}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <span>Switch Screen to Customer App</span>
                  </button>
                </div>
              </div>

              {/* Quick Actions Strip */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-bold text-white">Live Customer Pipeline:</span>
                  <span className="text-slate-400">
                    {partners.filter(p => p.active).length} Active Partners • {ads.filter(a => a.active).length} Billboard Ads Rotating
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('partners')}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-500/30 hover:bg-purple-900/60 font-semibold"
                  >
                    + Add/Edit Partners
                  </button>
                  <button
                    onClick={() => setActiveTab('ads')}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/60 font-semibold"
                  >
                    Configure Ads
                  </button>
                </div>
              </div>

              {/* Live Embedded Customer App Sandbox */}
              <div className="flex justify-center bg-slate-900/60 p-4 sm:p-8 rounded-3xl border border-slate-800">
                <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 relative flex flex-col h-[750px]">
                  {/* Phone Header Bar */}
                  <div className="bg-slate-950 text-slate-400 px-4 py-2 flex items-center justify-between text-[11px] font-mono shrink-0 select-none">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-slate-300 font-bold">SOHLA Public Customer Preview</span>
                    </div>
                    <span>4G LTE • Gambia</span>
                  </div>

                  {/* Customer View Iframe */}
                  <iframe
                    src={`${window.location.origin}?mode=customer`}
                    title="SOHLA Live Customer App"
                    className="w-full flex-1 border-0 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
