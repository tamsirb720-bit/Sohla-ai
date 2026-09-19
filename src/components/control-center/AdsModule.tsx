import React, { useState } from 'react';
import {
  Video,
  Plus,
  Play,
  Pause,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  X,
  Save,
  Building2,
  Calendar
} from 'lucide-react';
import { Advertisement, BusinessPartner } from '../../types';

interface AdsModuleProps {
  ads?: Advertisement[];
  partners?: BusinessPartner[];
  onRefresh?: () => void;
  currentAdminName?: string;
}

export const AdsModule: React.FC<AdsModuleProps> = ({
  ads = [],
  partners = [],
  onRefresh,
  currentAdminName = 'Admin'
}) => {
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Advertisement>>({
    title: '',
    advertiser: partners?.[0]?.name || 'SOHLA Partner',
    partnerId: partners?.[0]?.id || '',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    headline: 'Exclusive Gambian Specials Today',
    subtext: 'Tap to order or explore real local offers with instant delivery.',
    ctaText: 'Explore Menu',
    ctaLink: '',
    durationSeconds: 6, // 5-8s compliance
    priority: 5,
    active: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31'
  });

  const handleOpenCreate = () => {
    setEditingAd(null);
    setFormData({
      title: 'Featured Flash Promotion',
      advertiser: partners?.[0]?.name || 'SOHLA Partner',
      partnerId: partners?.[0]?.id || '',
      type: 'video',
      mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
      headline: 'Taste Authentic Banjul Delights',
      subtext: 'Fast doorstep delivery across Senegambia & Greater Banjul Area.',
      ctaText: 'View Store',
      ctaLink: partners?.[0]?.id ? `#partner-${partners[0].id}` : '',
      durationSeconds: 6,
      priority: 5,
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2026-12-31'
    });
    setIsCreatingAd(true);
  };

  const handleOpenEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
      ...ad,
      durationSeconds: Math.min(8, Math.max(5, ad.durationSeconds || 6))
    });
    setIsCreatingAd(false);
  };

  const handleToggleAdActive = async (ad: Advertisement) => {
    try {
      await fetch(`/api/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !ad.active,
          _adminName: currentAdminName
        })
      });
      setActionMessage(`Updated ad rotation for "${ad.title}"`);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to toggle ad status:', err);
    }
  };

  const handleDeleteAd = async (ad: Advertisement) => {
    if (!window.confirm(`Delete billboard ad "${ad.title}"?`)) return;
    try {
      await fetch(`/api/ads/${ad.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _adminName: currentAdminName })
      });
      setActionMessage(`Deleted billboard "${ad.title}"`);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete ad:', err);
    }
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      if (isCreatingAd) {
        await fetch('/api/ads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            durationSeconds: Math.min(8, Math.max(5, formData.durationSeconds || 6)),
            _adminName: currentAdminName
          })
        });
        setActionMessage(`Registered billboard ad "${formData.title}"`);
      } else if (editingAd) {
        await fetch(`/api/ads/${editingAd.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            durationSeconds: Math.min(8, Math.max(5, formData.durationSeconds || 6)),
            _adminName: currentAdminName
          })
        });
        setActionMessage(`Updated billboard ad "${formData.title}"`);
      }
      setIsCreatingAd(false);
      setEditingAd(null);
      setTimeout(() => setActionMessage(null), 3000);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to save ad:', err);
    }
  };

  const handleGenerateAIAd = async () => {
    setIsGeneratingAI(true);
    try {
      const targetPartner = partners?.[0] || { id: 'p1', name: 'Ali Baba Restaurant', location: 'Senegambia', category: 'Dining' };
      const res = await fetch('/api/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: targetPartner.id,
          businessName: targetPartner.name,
          category: targetPartner.category || 'Dining',
          durationSeconds: 6,
          _adminName: currentAdminName
        })
      });
      const data = await res.json();
      if (data.success && data.ad) {
        setActionMessage(`AI generated 6-second billboard for ${targetPartner.name}!`);
        setTimeout(() => setActionMessage(null), 4000);
        onRefresh?.();
      }
    } catch (err) {
      console.error('Failed to generate AI ad:', err);
    } finally {
      setIsGeneratingAI(false);
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-600" />
            5-8s Video Billboards & Advertisements
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Dynamic, short, high-impact video carousel for verified Gambian businesses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateAIAd}
            disabled={isGeneratingAI || partners.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            {isGeneratingAI ? 'Generating AI Billboard...' : 'Auto-Generate AI Ad'}
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Ad
          </button>
        </div>
      </div>

      {/* Billboards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(ads || []).length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-[#EADBCA] p-10 text-center text-stone-400">
            No billboard ads currently active. Click "Create Ad" or "Auto-Generate AI Ad" to start.
          </div>
        ) : (
          (ads || []).map(ad => (
            <div
              key={ad.id}
              className="bg-white rounded-2xl border border-[#EADBCA] shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
            >
              {/* Media Preview Box */}
              <div className="relative aspect-video bg-stone-900 overflow-hidden group">
                {ad.mediaUrl?.endsWith('.mp4') || ad.mediaUrl?.includes('video') ? (
                  <video
                    src={ad.mediaUrl}
                    poster={ad.thumbnailUrl}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                ) : (
                  <img
                    src={ad.thumbnailUrl || ad.mediaUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Duration Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-stone-950/80 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ad.durationSeconds || 6}s Duration
                </div>

                {/* Status Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    ad.active ? 'bg-emerald-500 text-white' : 'bg-stone-600 text-white'
                  }`}>
                    {ad.active ? 'Active' : 'Paused'}
                  </span>
                </div>

                {/* Play trigger button */}
                <button
                  onClick={() => setPreviewVideoUrl(ad.mediaUrl)}
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <Play className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              {/* Ad Meta Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span className="font-semibold text-amber-800 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {ad.advertiser || 'SOHLA Partner'}
                    </span>
                    <span>Priority {ad.priority || 5}</span>
                  </div>
                  <h3 className="font-bold text-stone-900 text-sm mt-1">{ad.headline || ad.title}</h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{ad.subtext}</p>
                </div>

                {/* Telemetry Stats */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-3">
                    <span title="Impressions">
                      <strong className="text-stone-800">{ad.impressions || 0}</strong> views
                    </span>
                    <span title="Clicks">
                      <strong className="text-stone-800">{ad.clicks || 0}</strong> clicks
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleAdActive(ad)}
                      title={ad.active ? 'Pause Ad' : 'Activate Ad'}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                    >
                      {ad.active ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(ad)}
                      className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Ad Modal */}
      {(isCreatingAd || editingAd) && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl overflow-hidden">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#EADBCA] flex items-center justify-between">
              <h3 className="font-bold text-stone-900 flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                {isCreatingAd ? 'Create 5-8s Video Billboard' : `Edit ${editingAd?.title}`}
              </h3>
              <button
                onClick={() => {
                  setIsCreatingAd(false);
                  setEditingAd(null);
                }}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title || ''}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Advertiser / Merchant *</label>
                  <select
                    value={formData.partnerId || ''}
                    onChange={e => {
                      const p = (partners || []).find(part => part.id === e.target.value);
                      setFormData({
                        ...formData,
                        partnerId: e.target.value,
                        advertiser: p ? p.name : formData.advertiser
                      });
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  >
                    {(partners || []).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Duration: {formData.durationSeconds || 6} Seconds (5-8s Max)
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={8}
                    step={1}
                    value={formData.durationSeconds || 6}
                    onChange={e => setFormData({ ...formData, durationSeconds: Number(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                    <span>5s (Snappy)</span>
                    <span>6s (Optimal)</span>
                    <span>8s (Max)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Main Catchy Headline *</label>
                <input
                  type="text"
                  required
                  value={formData.headline || ''}
                  onChange={e => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  placeholder="e.g., Best Afra on Senegambia Strip!"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Supporting Subtext</label>
                <input
                  type="text"
                  value={formData.subtext || ''}
                  onChange={e => setFormData({ ...formData, subtext: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  placeholder="Fast doorstep delivery or visit us in Kololi"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Video Media URL (.mp4 / stream)</label>
                <input
                  type="text"
                  required
                  value={formData.mediaUrl || ''}
                  onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Call to Action (CTA) Button</label>
                  <input
                    type="text"
                    value={formData.ctaText || 'Order Now'}
                    onChange={e => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Priority Rank (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.priority || 5}
                    onChange={e => setFormData({ ...formData, priority: Number(e.target.value) })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingAd(false);
                    setEditingAd(null);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Billboard Ad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div
          onClick={() => setPreviewVideoUrl(null)}
          className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="max-w-2xl w-full bg-black rounded-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <video
              src={previewVideoUrl}
              autoPlay
              controls
              className="w-full h-auto max-h-[80vh]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
