import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  ShieldAlert,
  Globe,
  Phone,
  Mail,
  X
} from 'lucide-react';
import { PlatformSettings } from '../../types';

interface PlatformSettingsModuleProps {
  currentAdminName?: string;
}

export const PlatformSettingsModule: React.FC<PlatformSettingsModuleProps> = ({ currentAdminName = 'Admin' }) => {
  const [settings, setSettings] = useState<PlatformSettings>({
    platformName: 'SOHLA AI',
    country: 'The Gambia',
    currency: 'GMD',
    maintenanceMode: false,
    requireApprovalForEdits: true,
    aiModel: 'Gemini 2.5 Flash',
    defaultDeliveryRadiusKm: 25,
    businessClaimingEnabled: true,
    contactHotline: '+220 788 1234',
    supportPhone: '+220 788 1234',
    supportEmail: 'contact@sohla.gm',
    tagline: 'Discover Verified Local Businesses in The Gambia',
    allowMerchantSelfRegistration: true,
    aiModelGrounded: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/control-center/settings');
      const data = await res.json();
      if (data && !data.error) setSettings(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/control-center/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, _adminName: currentAdminName })
      });
      setActionMessage('Platform configuration saved.');
      setTimeout(() => setActionMessage(null), 3000);
      fetchSettings();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
      <div>
        <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-600" />
          Platform Global Settings & Environment
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Manage general SOHLA metadata, helpline contact points, and operational modes
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm text-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">General Platform Identity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Platform Brand Name</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={e => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Public Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Support WhatsApp / Line</label>
              <input
                type="text"
                value={settings.supportPhone}
                onChange={e => setSettings({ ...settings, supportPhone: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm text-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">Operational Directives</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
              <div>
                <div className="font-bold text-stone-900">Merchant Claim Submissions Enabled</div>
                <div className="text-[11px] text-stone-500">Allow local Gambian business owners to claim listings and propose hours/pricing</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowMerchantSelfRegistration}
                onChange={e => setSettings({ ...settings, allowMerchantSelfRegistration: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer">
              <div>
                <div className="font-bold text-stone-900">AI Grounding Synchronized</div>
                <div className="text-[11px] text-stone-500">Keep SOHLA AI Gemini context updated with live catalog and official announcements</div>
              </div>
              <input
                type="checkbox"
                checked={settings.aiModelGrounded}
                onChange={e => setSettings({ ...settings, aiModelGrounded: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Platform Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
