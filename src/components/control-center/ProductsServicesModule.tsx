import React, { useState } from 'react';
import {
  Package,
  Wrench,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Save,
  Building2,
  DollarSign
} from 'lucide-react';
import { BusinessPartner, Product, Service, HEALTHCARE_SERVICES_LIST } from '../../types';

interface ProductsServicesModuleProps {
  partners: BusinessPartner[];
  onRefresh: () => void;
  currentAdminName: string;
  token?: string;
}

export const ProductsServicesModule: React.FC<ProductsServicesModuleProps> = ({
  partners,
  onRefresh,
  currentAdminName,
  token
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [serviceForm, setServiceForm] = useState<{
    id?: string;
    partnerId: string;
    name: string;
    category: string;
    subcategory: string;
    startingPrice: number;
    durationMinutes: number;
    pricingType: string;
    description: string;
    serviceArea: string;
    appointmentRequirements: string;
    credentialsInfo: string;
    verificationStatus: 'verified' | 'unverified' | 'pending';
  }>({
    partnerId: partners[0]?.id || '',
    name: '',
    category: 'BEAUTY & WELLNESS',
    subcategory: 'Healthcare & Nursing',
    startingPrice: 500,
    durationMinutes: 60,
    pricingType: 'Per Visit',
    description: '',
    serviceArea: 'Greater Banjul Area',
    appointmentRequirements: '',
    credentialsInfo: '',
    verificationStatus: 'verified'
  });

  // Flatten products from all partners
  const allProducts: (Product & { partnerName: string; partnerId: string })[] = [];
  const allServices: (Service & { partnerName: string; partnerId: string })[] = [];

  partners.forEach(partner => {
    (partner.products || []).forEach(p => {
      allProducts.push({
        ...p,
        partnerName: partner.name,
        partnerId: partner.id
      });
    });
    (partner.services || []).forEach(s => {
      allServices.push({
        ...s,
        partnerName: partner.name,
        partnerId: partner.id
      });
    });
  });

  const [productForm, setProductForm] = useState<Partial<Product> & { partnerId?: string }>({
    name: '',
    category: 'Food & Dining',
    price: 250,
    currency: 'GMD',
    stock: 25,
    description: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    available: true,
    partnerId: partners[0]?.id || ''
  });

  const filteredProducts = allProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartner = selectedPartnerId === 'all' || p.partnerId === selectedPartnerId;
    return matchesSearch && matchesPartner;
  });

  const filteredServices = allServices.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartner = selectedPartnerId === 'all' || s.partnerId === selectedPartnerId;
    return matchesSearch && matchesPartner;
  });

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Food & Dining',
      price: 250,
      currency: 'GMD',
      stock: 30,
      description: 'Prepared fresh daily with finest local Gambian ingredients.',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      available: true,
      partnerId: selectedPartnerId !== 'all' ? selectedPartnerId : (partners[0]?.id || '')
    });
    setIsCreatingProduct(true);
  };

  const handleOpenEditProduct = (prod: Product & { partnerId: string }) => {
    setEditingProduct(prod);
    setProductForm({
      ...prod,
      partnerId: prod.partnerId
    });
    setIsCreatingProduct(false);
  };

  const handleDeleteProduct = async (productId: string, partnerId: string, prodName: string) => {
    if (!window.confirm(`Delete "${prodName}" from catalog?`)) return;
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, _adminName: currentAdminName })
      });
      setActionMessage(`Deleted ${prodName}`);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.partnerId) return;

    setIsSubmitting(true);
    try {
      if (isCreatingProduct) {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...productForm,
            _adminName: currentAdminName
          })
        });
        setActionMessage(`Added ${productForm.name} to catalog`);
      } else if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...productForm,
            _adminName: currentAdminName
          })
        });
        setActionMessage(`Updated ${productForm.name}`);
      }
      setIsCreatingProduct(false);
      setEditingProduct(null);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to save product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenCreateService = () => {
    setEditingService(null);
    setServiceForm({
      partnerId: selectedPartnerId !== 'all' ? selectedPartnerId : (partners[0]?.id || ''),
      name: '',
      category: 'BEAUTY & WELLNESS',
      subcategory: 'Healthcare & Nursing',
      startingPrice: 500,
      durationMinutes: 60,
      pricingType: 'Per Visit',
      description: '',
      serviceArea: 'Greater Banjul Area',
      appointmentRequirements: '',
      credentialsInfo: '',
      verificationStatus: 'verified'
    });
    setIsCreatingService(true);
  };

  const handleOpenEditService = (srv: Service & { partnerId: string }) => {
    setEditingService(srv);
    setServiceForm({
      id: srv.id,
      partnerId: srv.partnerId,
      name: srv.name,
      category: srv.category || 'BEAUTY & WELLNESS',
      subcategory: srv.subcategory || 'Healthcare & Nursing',
      startingPrice: srv.startingPrice || 500,
      durationMinutes: srv.durationMinutes || 60,
      pricingType: srv.pricingType || 'Per Visit',
      description: srv.description || '',
      serviceArea: srv.serviceArea || 'Greater Banjul Area',
      appointmentRequirements: srv.appointmentRequirements || '',
      credentialsInfo: srv.credentialsInfo || '',
      verificationStatus: srv.verificationStatus || 'verified'
    });
    setIsCreatingService(false);
  };

  const handleDeleteService = async (serviceId: string, partnerId: string, srvName: string) => {
    if (!window.confirm(`Delete service "${srvName}"?`)) return;
    try {
      await fetch(`/api/services/${serviceId}?adminName=${encodeURIComponent(currentAdminName)}&partnerId=${partnerId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      setActionMessage(`Deleted service "${srvName}"`);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.partnerId) return;

    setIsSubmitting(true);
    try {
      const partner = partners.find(p => p.id === serviceForm.partnerId);
      const payload = {
        ...serviceForm,
        partnerName: partner?.name || 'Verified Provider',
        _adminName: currentAdminName
      };

      if (isCreatingService) {
        await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        setActionMessage(`Added service "${serviceForm.name}" to catalog`);
      } else if (editingService) {
        await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        });
        setActionMessage(`Updated service "${serviceForm.name}"`);
      }
      setIsCreatingService(false);
      setEditingService(null);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600" />
            Products & Services Catalog
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage live merchandise, menus, Dalasi pricing, and merchant services
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'products'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Products ({allProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'services'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Services ({allServices.length})
            </button>
          </div>

          {activeTab === 'products' ? (
            <button
              onClick={handleOpenCreateProduct}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          ) : (
            <button
              onClick={handleOpenCreateService}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={selectedPartnerId}
          onChange={e => setSelectedPartnerId(e.target.value)}
          className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Merchant Partners ({partners.length})</option>
          {partners.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Catalog Display */}
      {activeTab === 'products' ? (
        <div className="bg-white rounded-xl border border-[#EADBCA] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-stone-500 font-semibold border-b border-[#EADBCA]">
                <tr>
                  <th className="p-3.5">Product & Partner</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Price (Dalasi)</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Availability</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-stone-400">
                      No products found. Click "Add Product" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(prod => (
                    <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=100&q=80';
                            }}
                          />
                          <div>
                            <div className="font-bold text-stone-900">{prod.name}</div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-stone-400" />
                              <span className="font-medium text-stone-700">{prod.partnerName}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-stone-600 font-medium">
                        {prod.category || 'General'}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-emerald-700">
                          D{prod.price?.toLocaleString()} GMD
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          (prod.stock || 0) > 5 ? 'bg-stone-100 text-stone-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {prod.stock ?? 0} in stock
                        </span>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          prod.available !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {prod.available !== false ? 'Available' : 'Unavailable'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id, prod.partnerId, prod.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EADBCA] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] text-stone-500 font-semibold border-b border-[#EADBCA]">
                <tr>
                  <th className="p-3.5">Service & Partner</th>
                  <th className="p-3.5">Category & Subcategory</th>
                  <th className="p-3.5">Starting Price (Dalasi)</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">
                      No services currently listed. Click "Add Service" above to register one.
                    </td>
                  </tr>
                ) : (
                  filteredServices.map(srv => (
                    <tr key={srv.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900">{srv.name}</div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-stone-400" />
                          <span className="font-medium text-stone-700">{srv.partnerName}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-stone-600 font-medium">
                        <div>{srv.category || 'Service'}</div>
                        {srv.subcategory && (
                          <div className="text-[10px] text-teal-700 font-semibold">{srv.subcategory}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-emerald-700">
                          Starts D{srv.startingPrice?.toLocaleString()} GMD
                        </div>
                        {srv.pricingType && (
                          <div className="text-[10px] text-stone-400">{srv.pricingType}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-500 max-w-xs truncate">
                        {srv.description || 'Verified local service.'}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditService(srv)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors"
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(srv.id, srv.partnerId, srv.name)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                            title="Delete Service"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(isCreatingProduct || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#EADBCA] flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                {isCreatingProduct ? 'Add Product to Catalog' : `Edit ${editingProduct?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingProduct(false);
                  setEditingProduct(null);
                }}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Partner / Merchant *</label>
                <select
                  required
                  value={productForm.partnerId || ''}
                  onChange={e => setProductForm({ ...productForm, partnerId: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  placeholder="e.g., Traditional Domoda Bowl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Price in Dalasi (GMD) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.price ?? 250}
                    onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={productForm.stock ?? 20}
                    onChange={e => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Image URL</label>
                <input
                  type="text"
                  value={productForm.image || ''}
                  onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description || ''}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.available !== false}
                  onChange={e => setProductForm({ ...productForm, available: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="font-semibold text-stone-800">Immediately Available for Ordering</span>
              </label>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingProduct(false);
                    setEditingProduct(null);
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
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {(isCreatingService || editingService) && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#EADBCA] flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-teal-700" />
                {isCreatingService ? 'Add Service to Catalog' : `Edit ${editingService?.name}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingService(false);
                  setEditingService(null);
                }}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Partner / Provider *</label>
                <select
                  required
                  value={serviceForm.partnerId || ''}
                  onChange={e => setServiceForm({ ...serviceForm, partnerId: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                >
                  {partners.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location}) - {p.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Service Category</label>
                <select
                  value={serviceForm.category}
                  onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                >
                  <option value="BEAUTY & WELLNESS">BEAUTY & WELLNESS</option>
                  <option value="Services & Maintenance">Services & Maintenance</option>
                  <option value="Professional Services">Professional Services</option>
                </select>
              </div>

              {serviceForm.category === 'BEAUTY & WELLNESS' && (
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Subcategory</label>
                  <select
                    value={serviceForm.subcategory}
                    onChange={e => setServiceForm({ ...serviceForm, subcategory: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  >
                    <option value="Healthcare & Nursing">Healthcare & Nursing</option>
                    <option value="Hair Salons">Hair Salons</option>
                    <option value="Spa & Massage">Spa & Massage</option>
                    <option value="Barbershops">Barbershops</option>
                    <option value="Nail & Aesthetics">Nail & Aesthetics</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Service Name *
                  {serviceForm.subcategory === 'Healthcare & Nursing' && (
                    <span className="text-[10px] text-teal-700 font-normal ml-2">
                      (Select standard clinical type or type custom)
                    </span>
                  )}
                </label>
                {serviceForm.subcategory === 'Healthcare & Nursing' ? (
                  <div className="space-y-1.5">
                    <select
                      onChange={e => {
                        if (e.target.value && e.target.value !== 'CUSTOM') {
                          setServiceForm({ ...serviceForm, name: e.target.value });
                        }
                      }}
                      className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none"
                    >
                      <option value="">-- Choose Standard Healthcare Service --</option>
                      {HEALTHCARE_SERVICES_LIST.map(name => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                      <option value="CUSTOM">Type custom service name...</option>
                    </select>
                    <input
                      type="text"
                      required
                      value={serviceForm.name || ''}
                      onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                      placeholder="e.g. Registered Nurse (RN), Home Nursing, Wound Care"
                      className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={serviceForm.name || ''}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="e.g. Deep Tissue Massage"
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-teal-600"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Starting Price (GMD) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={serviceForm.startingPrice ?? 500}
                    onChange={e => setServiceForm({ ...serviceForm, startingPrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Pricing Model</label>
                  <select
                    value={serviceForm.pricingType}
                    onChange={e => setServiceForm({ ...serviceForm, pricingType: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  >
                    <option value="Per Visit">Per Visit</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily</option>
                    <option value="Fixed">Fixed Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={serviceForm.durationMinutes ?? 60}
                    onChange={e => setServiceForm({ ...serviceForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Coverage Area</label>
                <input
                  type="text"
                  value={serviceForm.serviceArea}
                  onChange={e => setServiceForm({ ...serviceForm, serviceArea: e.target.value })}
                  placeholder="e.g. Greater Banjul Area, Senegambia, Brusubi"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={serviceForm.description || ''}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingService(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
