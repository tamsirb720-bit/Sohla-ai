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
  Globe
} from 'lucide-react';
import { BusinessPartner } from '../../types';

interface CategoriesLocationsModuleProps {
  categories: any[];
  locations: string[];
  partners: BusinessPartner[];
  onRefresh: () => void;
  currentAdminName: string;
}

export const CategoriesLocationsModule: React.FC<CategoriesLocationsModuleProps> = ({
  categories,
  locations,
  partners,
  onRefresh,
  currentAdminName
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Calculate count of partners per category
  const categoryCounts = categories.map(cat => {
    const count = partners.filter(p => p.category?.toLowerCase() === cat.key?.toLowerCase() || p.category?.toLowerCase() === cat.name?.toLowerCase()).length;
    return { ...cat, partnerCount: count };
  });

  // Calculate count of partners per location
  const locationCounts = locations.map(loc => {
    const count = partners.filter(p => p.location?.toLowerCase().includes(loc.toLowerCase())).length;
    return { name: loc, partnerCount: count };
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    try {
      const generatedKey = newCatKey || newCatName.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: generatedKey,
          name: newCatName,
          icon: newCatIcon,
          _adminName: currentAdminName
        })
      });
      setActionMessage(`Created category "${newCatName}"`);
      setIsAddingCategory(false);
      setNewCatName('');
      setNewCatKey('');
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to create category:', err);
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
            <Tag className="w-5 h-5 text-amber-600" />
            Categories & Geographic Locations
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Organize discovery taxonomy across the Gambian ecosystem
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'categories'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Categories ({categories.length})
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
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
              onClick={() => setIsAddingCategory(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Category
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'categories' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categoryCounts.map((cat, idx) => (
            <div
              key={cat.id || cat.key || idx}
              className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm hover:shadow-md transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">{cat.name || cat.key}</div>
                  <div className="text-[11px] font-mono text-stone-400">{cat.key}</div>
                  <div className="mt-2 text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{cat.partnerCount} businesses</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {locationCounts.map((loc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm hover:shadow-md transition-all flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">{loc.name}</div>
                  <div className="text-[11px] text-stone-400">The Gambia, Greater Banjul</div>
                  <div className="mt-2 text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span>{loc.partnerCount} businesses in area</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#EADBCA] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#EADBCA] flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-600" />
                Create New Discovery Category
              </h3>
              <button onClick={() => setIsAddingCategory(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Electronics & Mobile"
                  value={newCatName}
                  onChange={e => {
                    setNewCatName(e.target.value);
                    if (!newCatKey) {
                      setNewCatKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, '_'));
                    }
                  }}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">System Key (Uppercase Code)</label>
                <input
                  type="text"
                  placeholder="e.g., ELECTRONICS"
                  value={newCatKey}
                  onChange={e => setNewCatKey(e.target.value.toUpperCase())}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
