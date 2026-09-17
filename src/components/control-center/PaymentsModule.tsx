import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Zap,
  Building2,
  CheckCircle2,
  Save,
  Lock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { PaymentSettings } from '../../types';

interface PaymentsModuleProps {
  currentAdminName: string;
}

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({ currentAdminName }) => {
  const [config, setConfig] = useState<PaymentSettings>({
    cashPowerEnabled: true,
    governmentPaymentsEnabled: true,
    waveEnabled: true,
    qmoneyEnabled: true,
    afrimoneyEnabled: true,
    platformCommissionPercent: 2.5,
    cashPowerFeeGMD: 0,
    merchantCurrency: 'GMD',
    supportContact: '+220 788 1234',
    payoutSchedule: 'DAILY_AUTOMATIC',
    testMode: true
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/control-center/payments/config');
      const data = await res.json();
      if (data) setConfig(data);
    } catch (err) {
      console.error('Failed to load payment config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fetch('/api/control-center/payments/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, _adminName: currentAdminName })
      });
      setActionMessage('Payment settings updated successfully');
      setTimeout(() => setActionMessage(null), 3000);
      fetchConfig();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
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
          <CreditCard className="w-5 h-5 text-emerald-600" />
          Gambian Payment Gateways & Commission Settings
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Configure NAWEC Cash Power, Government Revenue Authority (GRA), and mobile wallets
        </p>
      </div>

      {/* Security Directives Banner */}
      <div className="bg-stone-900 text-white rounded-xl p-4 text-xs flex items-start gap-3 border border-stone-800">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-emerald-300">Strict Secret Protection Enforced</div>
          <div className="text-stone-300 mt-0.5">
            Production API keys and webhook secrets are managed securely on the server-side environment (`server.ts`). Secret credentials are never rendered in the client interface.
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Gateways Toggle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* NAWEC Cash Power */}
          <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                <Zap className="w-4 h-4 text-amber-500" />
                NAWEC Cash Power (Prepaid Electricity)
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.cashPowerEnabled}
                  onChange={e => setConfig({ ...config, cashPowerEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-stone-500 text-[11px]">
              Allows consumers in The Gambia to instantly purchase electricity tokens directly via SOHLA with instant 20-digit token generation.
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-600">
              <span>Customer Surcharge:</span>
              <span className="font-bold text-stone-900">D0.00 GMD (Free to Users)</span>
            </div>
          </div>

          {/* Government Payments (GRA) */}
          <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                <Building2 className="w-4 h-4 text-blue-600" />
                Government Revenue Authority (GRA)
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.governmentPaymentsEnabled}
                  onChange={e => setConfig({ ...config, governmentPaymentsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-stone-500 text-[11px]">
              Municipal rates, business licensing renewals, and official tax assessment payments with verified receipt issuance.
            </p>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-600">
              <span>Receipt Verification:</span>
              <span className="font-bold text-emerald-700">Digital Reference Code</span>
            </div>
          </div>
        </div>

        {/* Mobile Wallets */}
        <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm text-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">Supported Gambian Mobile Wallets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-stone-900">Wave Gambia</div>
                <div className="text-[10px] text-stone-500">QR & Instant Mobile Pin</div>
              </div>
              <input
                type="checkbox"
                checked={config.waveEnabled}
                onChange={e => setConfig({ ...config, waveEnabled: e.target.checked })}
                className="rounded text-amber-600"
              />
            </label>

            <label className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-stone-900">QMoney (QCell)</div>
                <div className="text-[10px] text-stone-500">USSD & In-App Prompt</div>
              </div>
              <input
                type="checkbox"
                checked={config.qmoneyEnabled}
                onChange={e => setConfig({ ...config, qmoneyEnabled: e.target.checked })}
                className="rounded text-amber-600"
              />
            </label>

            <label className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between cursor-pointer">
              <div>
                <div className="font-bold text-stone-900">Afrimoney (Africell)</div>
                <div className="text-[10px] text-stone-500">Fast Mobile Transfer</div>
              </div>
              <input
                type="checkbox"
                checked={config.afrimoneyEnabled}
                onChange={e => setConfig({ ...config, afrimoneyEnabled: e.target.checked })}
                className="rounded text-amber-600"
              />
            </label>
          </div>
        </div>

        {/* Financial Rules */}
        <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm text-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">Commission & Settlement Parameters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Platform Commission (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={config.platformCommissionPercent}
                onChange={e => setConfig({ ...config, platformCommissionPercent: Number(e.target.value) })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Merchant Settlement Schedule</label>
              <select
                value={config.payoutSchedule}
                onChange={e => setConfig({ ...config, payoutSchedule: e.target.value as any })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              >
                <option value="DAILY_AUTOMATIC">Daily Automatic (Wave/QMoney)</option>
                <option value="WEEKLY">Weekly Batch Payout</option>
                <option value="MONTHLY">Monthly Statement</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Finance Operations Contact</label>
              <input
                type="text"
                value={config.supportContact}
                onChange={e => setConfig({ ...config, supportContact: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Updating...' : 'Save Payment Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
