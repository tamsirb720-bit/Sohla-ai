import React, { useState } from 'react';
import {
  Tag,
  MapPin,
  Plus,
  Building2,
  CheckCircle2,
  Trash2,
  X,
  Save,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Star,
  Search,
  Check,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Palette,
  Image as ImageIcon,
  FolderTree,
  ListPlus
} from 'lucide-react';
import { BusinessPartner, CategoryInfo } from '../../types';

interface CategoriesLocationsModuleProps {
  categories?: CategoryInfo[];
  locations?: string[];
  partners?: BusinessPartner[];
  onRefresh?: () => void;
  currentAdminName?: string;
}

const PRESET_ICONS = [
  'ShoppingBag',
  'Utensils',
  'Car',
  'Truck',
  'Sparkles',
  'Building2',
  'Hotel',
  'Zap',
  'FileText',
  'Briefcase',
  'CreditCard',
  'Tag',
  'Heart',
  'Coffee',
  'Shield',
  'Laptop',
  'Compass',
  'Flame'
];

const PRESET_COLORS = [
  '#9333ea', // Purple
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#8b5cf6', // Violet
  '#f97316'  // Orange
];

const PRESET_IMAGES = [
  { label: 'Shopping', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dining & Food', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Transport & Taxis', url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80' },
  { label: 'Logistics & Delivery', url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80' },
  { label: 'Beauty & Salon', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80' },
  { label: 'Properties & Housing', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hotels & Resorts', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
  { label: 'Services & Trades', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80' }
];

export const CategoriesLocationsModule: React.FC<CategoriesLocationsModuleProps> = ({
  categories = [],
  locations = [],
  partners = [],
  onRefresh,
  currentAdminName = 'Admin'
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'FEATURED'>('ALL');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryInfo | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryInfo | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form input states
  const [formName, setFormName] = useState('');
  const [formKey, setFormKey] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formIcon, setFormIcon] = useState('Tag');
  const [formColor, setFormColor] = useState('#9333ea');
  const [formDisplayOrder, setFormDisplayOrder] = useState(1);
  const [formActive, setFormActive] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSubcategories, setFormSubcategories] = useState<string[]>([]);
  const [newSubcatInput, setNewSubcatInput] = useState('');
  const [formAiKeywords, setFormAiKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // Calculate count of partners per category
  const categoryCounts = categories.map((cat) => {
    const count = partners.filter((p) => {
      if (!p || !p.category) return false;
      const catKey = cat.key?.toLowerCase();
      const catName = cat.name?.toLowerCase();
      const pCat = p.category.toLowerCase();
      return (catKey && pCat === catKey) || (catName && pCat === catName);
    }).length;
    return { ...cat, partnerCount: count };
  });

  // Calculate count of partners per location
  const locationCounts = locations.map((loc) => {
    const count = partners.filter((p) => {
      if (!p || !p.location || !loc) return false;
      return p.location.toLowerCase().includes(loc.toLowerCase());
    }).length;
    return { name: loc, partnerCount: count };
  });

  // Filtered categories
  const filteredCategories = categoryCounts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tagline?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterState === 'ACTIVE') return c.active;
    if (filterState === 'INACTIVE') return !c.active;
    if (filterState === 'FEATURED') return c.featured;
    return true;
  });

  // Open Add Category modal
  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormKey('');
    setFormTagline('');
    setFormImage(PRESET_IMAGES[0].url);
    setFormIcon('Tag');
    setFormColor('#9333ea');
    setFormDisplayOrder(categories.length + 1);
    setFormActive(true);
    setFormFeatured(true);
    setFormSubcategories([]);
    setFormAiKeywords([]);
    setNewSubcatInput('');
    setNewKeywordInput('');
    setIsFormOpen(true);
  };

  // Open Edit Category modal
  const handleOpenEditModal = (cat: CategoryInfo) => {
    setEditingCategory(cat);
    setFormName(cat.name || '');
    setFormKey(cat.key || '');
    setFormTagline(cat.tagline || '');
    setFormImage(cat.image || PRESET_IMAGES[0].url);
    setFormIcon(cat.icon || 'Tag');
    setFormColor(cat.color || '#9333ea');
    setFormDisplayOrder(cat.displayOrder || 1);
    setFormActive(cat.active !== undefined ? cat.active : true);
    setFormFeatured(cat.featured !== undefined ? cat.featured : false);
    setFormSubcategories(cat.subcategories ? [...cat.subcategories] : []);
    setFormAiKeywords(cat.aiKeywords ? [...cat.aiKeywords] : []);
    setNewSubcatInput('');
    setNewKeywordInput('');
    setIsFormOpen(true);
  };

  // Add Subcategory pill
  const handleAddSubcategory = () => {
    const val = newSubcatInput.trim();
    if (!val) return;
    if (!formSubcategories.includes(val)) {
      setFormSubcategories([...formSubcategories, val]);
    }
    setNewSubcatInput('');
  };

  // Remove Subcategory pill
  const handleRemoveSubcategory = (sub: string) => {
    setFormSubcategories(formSubcategories.filter((s) => s !== sub));
  };

  // Add AI Keyword
  const handleAddKeyword = () => {
    const val = newKeywordInput.trim().toLowerCase();
    if (!val) return;
    if (!formAiKeywords.includes(val)) {
      setFormAiKeywords([...formAiKeywords, val]);
    }
    setNewKeywordInput('');
  };

  // Remove AI Keyword
  const handleRemoveKeyword = (kw: string) => {
    setFormAiKeywords(formAiKeywords.filter((k) => k !== kw));
  };

  // Save Category (Create or Update)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('Category name is required.');
      return;
    }

    const payload = {
      name: formName.trim(),
      key: formKey.trim() || formName.toUpperCase().replace(/[^A-Z0-9_]+/g, '_'),
      tagline: formTagline.trim(),
      subcategories: formSubcategories,
      image: formImage.trim(),
      icon: formIcon,
      color: formColor,
      displayOrder: Number(formDisplayOrder),
      active: formActive,
      featured: formFeatured,
      aiKeywords: formAiKeywords,
      _adminName: currentAdminName
    };

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      let res;
      if (editingCategory) {
        res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setActionMessage(
          editingCategory
            ? `Category "${payload.name}" updated successfully!`
            : `New category "${payload.name}" created!`
        );
        setIsFormOpen(false);
        onRefresh?.();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to save category.');
      }
    } catch (err) {
      setErrorMessage('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Category Active State
  const handleToggleActive = async (cat: CategoryInfo) => {
    try {
      const res = await fetch(`/api/categories/${cat.id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !cat.active, _adminName: currentAdminName })
      });
      if (res.ok) {
        setActionMessage(`Category "${cat.name}" is now ${!cat.active ? 'Active' : 'Hidden'}.`);
        onRefresh?.();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  };

  // Reorder Category (move up or down)
  const handleMoveOrder = async (cat: CategoryInfo, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    const idx = sorted.findIndex((c) => c.id === cat.id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    // Swap positions
    const temp = sorted[idx];
    sorted[idx] = sorted[targetIdx];
    sorted[targetIdx] = temp;

    const orderedIds = sorted.map((c) => c.id);

    try {
      const res = await fetch('/api/categories-reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds, _adminName: currentAdminName })
      });
      if (res.ok) {
        onRefresh?.();
      }
    } catch (err) {
      console.error('Reorder error:', err);
    }
  };

  // Delete Category
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _adminName: currentAdminName })
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(
          `Category "${categoryToDelete.name}" deleted. ${data.reassignedPartners || 0} businesses reassigned safely.`
        );
        setCategoryToDelete(null);
        onRefresh?.();
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        setErrorMessage('Failed to delete category.');
      }
    } catch {
      setErrorMessage('Network error while deleting category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Messages */}
      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionMessage}
          </span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-amber-600" />
            Category & Ecosystem Taxonomy
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Full control over discovery categories, subcategory tags, visual branding, and AI intent matching
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Main Tab Switch */}
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'locations'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Locations ({locations.length})
            </button>
          </div>

          {activeTab === 'categories' && (
            <button
              id="btn-add-new-category"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'categories' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#EADBCA] shadow-sm">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories by name, key, or tagline..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
              {(['ALL', 'ACTIVE', 'INACTIVE', 'FEATURED'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterState(filter)}
                  className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    filterState === filter
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {filter === 'ALL' && 'All'}
                  {filter === 'ACTIVE' && 'Active'}
                  {filter === 'INACTIVE' && 'Hidden'}
                  {filter === 'FEATURED' && 'Featured'}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCategories.map((cat, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === filteredCategories.length - 1;

              return (
                <div
                  key={cat.id || cat.key || idx}
                  className={`bg-white rounded-2xl border transition-all shadow-sm flex flex-col justify-between overflow-hidden group ${
                    cat.active ? 'border-[#EADBCA] hover:border-amber-400/80 hover:shadow-md' : 'border-stone-200 opacity-60 bg-stone-50'
                  }`}
                >
                  {/* Top Image Banner with Badges */}
                  <div className="relative h-28 w-full bg-stone-100 overflow-hidden">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

                    {/* Order & Status Badges */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-sm text-[10px] font-mono font-bold text-amber-400 border border-amber-400/30">
                        #{cat.displayOrder || idx + 1}
                      </span>
                      {cat.featured && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/90 text-[10px] font-bold text-stone-950 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-stone-950" />
                          Featured
                        </span>
                      )}
                    </div>

                    {/* Quick Active Toggle Button */}
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        title={cat.active ? 'Click to hide category' : 'Click to make category active'}
                        className={`p-1.5 rounded-lg backdrop-blur-md transition shadow cursor-pointer ${
                          cat.active
                            ? 'bg-emerald-600/90 text-white hover:bg-emerald-500'
                            : 'bg-stone-800/90 text-stone-400 hover:text-white'
                        }`}
                      >
                        {cat.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Category Name & Key over Banner */}
                    <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight drop-shadow-sm flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: cat.color || '#9333ea' }}
                          />
                        </h3>
                        <div className="text-[10px] font-mono text-stone-300 drop-shadow-sm">
                          {cat.key}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {cat.tagline && (
                        <p className="text-xs text-stone-600 line-clamp-1 italic mb-2">
                          "{cat.tagline}"
                        </p>
                      )}

                      {/* Subcategories preview */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          Subcategories ({(cat.subcategories || []).length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(cat.subcategories || []).slice(0, 4).map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-stone-100 text-[11px] text-stone-700 font-medium border border-stone-200"
                            >
                              {sub}
                            </span>
                          ))}
                          {(cat.subcategories || []).length > 4 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-stone-100 text-[10px] text-stone-500 font-semibold">
                              +{(cat.subcategories || []).length - 4} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Associated Businesses Count */}
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          <span className="font-semibold text-stone-800">{cat.partnerCount} businesses</span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          Icon: {cat.icon || 'Tag'}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
                      {/* Reorder Arrows */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(cat, 'up')}
                          disabled={isFirst}
                          title="Move category up"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(cat, 'down')}
                          disabled={isLast}
                          title="Move category down"
                          className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(cat)}
                          className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => setCategoryToDelete(cat)}
                          className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#EADBCA] p-8">
              <FolderTree className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h3 className="font-bold text-stone-700 text-sm">No categories match your filter</h3>
              <p className="text-xs text-stone-400 mt-1">Try changing search keywords or create a new category.</p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition"
              >
                Create Category
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Geographic Locations Tab */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {locationCounts.map((loc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#EADBCA] p-4 shadow-sm hover:shadow-md transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">{loc.name}</div>
                  <div className="text-[11px] text-stone-400">Greater Banjul Area • The Gambia</div>
                  <div className="mt-2 text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{loc.partnerCount} registered businesses</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#EADBCA] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 my-8">
            <div className="p-5 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Discovery Category'}
                  </h3>
                  <p className="text-[11px] text-amber-200">
                    Configure customer taxonomy, keywords, and ecosystem visibility
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Category Name & System Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Shopping & Boutiques"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingCategory && !formKey) {
                        setFormKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, '_'));
                      }
                    }}
                    className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    System Key (Immutable ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., SHOPPING"
                    value={formKey}
                    onChange={(e) => setFormKey(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Tagline / Customer Subtitle
                </label>
                <input
                  type="text"
                  placeholder="e.g., Fashion • Electronics • Everyday Essentials"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Cover Image & Presets */}
              <div className="space-y-2">
                <label className="block font-bold text-stone-800">
                  Cover Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="flex-1 h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                  {formImage && (
                    <img
                      src={formImage}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                    />
                  )}
                </div>

                {/* Preset image suggestions */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] text-stone-400 shrink-0">Suggestions:</span>
                  {PRESET_IMAGES.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormImage(img.url)}
                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-[10px] text-stone-700 whitespace-nowrap cursor-pointer"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color, Icon, and Display Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Accent Color */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Theme Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-stone-200 p-0.5"
                    />
                    <div className="flex flex-wrap gap-1 max-w-[120px]">
                      {PRESET_COLORS.slice(0, 6).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormColor(c)}
                          className="w-4 h-4 rounded-full border border-black/10 cursor-pointer"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Icon Selector */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Icon Identifier
                  </label>
                  <select
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  >
                    {PRESET_ICONS.map((ic) => (
                      <option key={ic} value={ic}>
                        {ic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Display Order (#)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Subcategories Management */}
              <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="block font-bold text-stone-800">
                  Subcategories ({formSubcategories.length})
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubcatInput}
                    onChange={(e) => setNewSubcatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubcategory();
                      }
                    }}
                    placeholder="Type subcategory & click Add (e.g., Electronics & Mobile)..."
                    className="flex-1 h-9 px-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="px-3.5 py-1.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Subcategory Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formSubcategories.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white border border-stone-200 text-stone-800 font-medium text-xs rounded-lg flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategory(sub)}
                        className="text-stone-400 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {formSubcategories.length === 0 && (
                    <span className="text-[11px] text-stone-400 italic">No subcategories added yet.</span>
                  )}
                </div>
              </div>

              {/* AI Intent Keywords */}
              <div className="space-y-2 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <label className="block font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>SOHLA AI Intent Keywords</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="Add search triggers (e.g., dresses, shoes, tailor, fashion)..."
                    className="flex-1 h-9 px-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3.5 py-1.5 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800 transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* Keyword Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formAiKeywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-amber-100/70 border border-amber-200 text-amber-950 font-medium text-[11px] rounded-md flex items-center gap-1"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-amber-800 hover:text-rose-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggles: Active & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">Category Active</span>
                    <span className="text-[10px] text-stone-400">Visible across customer discovery</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">Featured on Home</span>
                    <span className="text-[10px] text-stone-400">Highlighted in the top category grid</span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-category-modal"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-stone-900">
                Delete Category: "{categoryToDelete.name}"?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to remove this category? Any businesses currently linked to this category will be safely preserved and reassigned to the default "SERVICES" category.
              </p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-stone-700 hover:bg-stone-50 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-category"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? 'Deleting...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
