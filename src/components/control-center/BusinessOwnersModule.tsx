import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Lock,
  ExternalLink,
  Plus,
  X,
  Save,
  Send,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { BusinessOwner, BusinessPartner } from '../../types';

interface BusinessOwnersModuleProps {
  partners?: BusinessPartner[];
  currentAdminName?: string;
}

export const BusinessOwnersModule: React.FC<BusinessOwnersModuleProps> = ({
  partners = [],
  currentAdminName = 'Admin'
}) => {
  const [viewMode, setViewMode] = useState<'admin_management' | 'merchant_simulator'>('admin_management');
  const [owners, setOwners] = useState<BusinessOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Admin creation modal
  const [isCreatingOwner, setIsCreatingOwner] = useState(false);
  const [formData, setFormData] = useState({
    partnerId: partners?.[0]?.id || '',
    ownerName: '',
    phone: '+220 ',
    email: '',
    nationalIdOrNin: '',
    canEditProfile: true,
    canManageCatalog: true,
    canManageMedia: true
  });

  // Simulator state
  const [simSelectedPartnerId, setSimSelectedPartnerId] = useState(partners?.[0]?.id || '');
  const [simOwner, setSimOwner] = useState<any>(null);
  const [simHours, setSimHours] = useState('');
  const [simDeliveryFee, setSimDeliveryFee] = useState<number>(100);
  const [simNotice, setSimNotice] = useState('');
  const [isSubmittingSimChanges, setIsSubmittingSimChanges] = useState(false);

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/control-center/business-owners');
      const data = await res.json();
      setOwners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load business owners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partnerId || !formData.ownerName) return;

    try {
      await fetch('/api/control-center/business-owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          _adminName: currentAdminName
        })
      });
      setActionMessage(`Registered owner account for ${formData.ownerName}`);
      setIsCreatingOwner(false);
      setFormData({
        partnerId: partners?.[0]?.id || '',
        ownerName: '',
        phone: '+220 ',
        email: '',
        nationalIdOrNin: '',
        canEditProfile: true,
        canManageCatalog: true,
        canManageMedia: true
      });
      setTimeout(() => setActionMessage(null), 3000);
      fetchOwners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleOwnerStatus = async (owner: BusinessOwner) => {
    const nextStatus = owner.status === 'active' ? 'suspended' : 'active';
    try {
      await fetch(`/api/control-center/business-owners/${owner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          _adminName: currentAdminName
        })
      });
      setActionMessage(`Owner account is now ${nextStatus}`);
      setTimeout(() => setActionMessage(null), 3000);
      fetchOwners();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOwner = async (owner: BusinessOwner) => {
    if (!window.confirm(`Remove owner account for ${owner.ownerName}?`)) return;
    try {
      await fetch(`/api/control-center/business-owners/${owner.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _adminName: currentAdminName })
      });
      fetchOwners();
    } catch (err) {
      console.error(err);
    }
  };

  // Merchant Portal Simulator Login
  const handleSimulateLogin = async () => {
    const partner = (partners || []).find(p => p.id === simSelectedPartnerId);
    if (!partner) return;

    try {
      const res = await fetch('/api/partner-portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          phone: partner.phone
        })
      });
      const data = await res.json();
      if (data.success) {
        setSimOwner(data.owner);
        setSimHours(partner.openingHours || 'Mon - Sun: 09:00 - 22:00');
        setSimDeliveryFee(partner.deliveryFee || 100);
        setActionMessage(`Logged in as verified owner of ${partner.name}`);
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitMerchantChanges = async () => {
    if (!simOwner) return;
    setIsSubmittingSimChanges(true);
    try {
      const res = await fetch('/api/partner-portal/submit-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: simOwner.partnerId,
          ownerId: simOwner.id,
          ownerName: simOwner.ownerName,
          changes: {
            openingHours: simHours,
            deliveryFee: simDeliveryFee,
            promotions: simNotice
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage('Proposed changes submitted to SOHLA Operations queue for review!');
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingSimChanges(false);
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

      {/* Header & Modes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Business Owners & Merchant Portal
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Isolated merchant accounts: profile editing, catalog updates, and approval workflows
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('admin_management')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'admin_management'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Admin Owner Registry ({owners.length})
            </button>
            <button
              onClick={() => setViewMode('merchant_simulator')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'merchant_simulator'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Merchant Portal Simulator
            </button>
          </div>

          {viewMode === 'admin_management' && (
            <button
              onClick={() => setIsCreatingOwner(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Register Owner
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Admin Management Table */}
      {viewMode === 'admin_management' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Security Directive Enforced</div>
              <div className="mt-0.5 text-amber-800">
                Business owners have zero administrative privileges. All modifications submitted by merchant accounts are routed to the SOHLA Approvals Queue before going live.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#EADBCA] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-stone-500 font-semibold border-b border-[#EADBCA]">
                  <tr>
                    <th className="p-3.5">Owner & Contact</th>
                    <th className="p-3.5">Affiliated Partner</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Permissions</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {owners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-stone-400">
                        No registered business owners yet. Click "Register Owner" or test in the simulator.
                      </td>
                    </tr>
                  ) : (
                    owners.map(owner => (
                      <tr key={owner.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-stone-900">{owner.ownerName}</div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                            <span>{owner.phone}</span>
                            {owner.email && <span>• {owner.email}</span>}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            {owner.partnerName}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            owner.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {owner.status}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1 text-[10px]">
                            {owner.canEditProfile && <span className="bg-stone-100 px-1.5 py-0.2 rounded font-medium">Profile</span>}
                            {owner.canManageCatalog && <span className="bg-stone-100 px-1.5 py-0.2 rounded font-medium">Catalog</span>}
                            {owner.canManageMedia && <span className="bg-stone-100 px-1.5 py-0.2 rounded font-medium">Media</span>}
                          </div>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleOwnerStatus(owner)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700"
                            >
                              {owner.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteOwner(owner)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-stone-400 hover:text-rose-600"
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
        </div>
      )}

      {/* Mode 2: Merchant Portal Simulator */}
      {viewMode === 'merchant_simulator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#EADBCA] p-6 shadow-sm">
            <h3 className="text-base font-bold text-stone-900 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              Merchant Portal Session Simulator
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Select any verified Gambian business to test their merchant self-service experience:
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={simSelectedPartnerId}
                onChange={e => setSimSelectedPartnerId(e.target.value)}
                className="w-full sm:w-80 p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold"
              >
                {(partners || []).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location})
                  </option>
                ))}
              </select>

              <button
                onClick={handleSimulateLogin}
                className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Launch Merchant Workspace
              </button>
            </div>
          </div>

          {/* Active Merchant Workspace Simulation */}
          {simOwner && (
            <div className="bg-[#FAF8F5] rounded-2xl border border-[#EADBCA] p-6 shadow-md space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EADBCA]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-lg">
                    {simOwner.partnerName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-base">{simOwner.partnerName}</h4>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Merchant Access Verified
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      Logged in as: <span className="font-semibold text-stone-800">{simOwner.ownerName}</span> ({simOwner.phone})
                    </div>
                  </div>
                </div>

                <div className="text-xs text-stone-500">
                  <span className="font-mono text-stone-400">Partner ID: {simOwner.partnerId}</span>
                </div>
              </div>

              {/* Editable Merchant Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Weekly Operating Hours</label>
                  <input
                    type="text"
                    value={simHours}
                    onChange={e => setSimHours(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
                    placeholder="e.g., Mon - Sat: 10:00 - 23:00"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Standard Delivery Fee (GMD)</label>
                  <input
                    type="number"
                    value={simDeliveryFee}
                    onChange={e => setSimDeliveryFee(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Special Announcement or Promotion</label>
                  <textarea
                    rows={2}
                    value={simNotice}
                    onChange={e => setSimNotice(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-amber-500"
                    placeholder="e.g., 10% off all grilled fish platters this weekend for Senegambia visitors!"
                  />
                </div>
              </div>

              {/* Submit for Admin Review */}
              <div className="p-4 bg-white rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-stone-600">
                  <strong>Approval Policy:</strong> Your modifications will be reviewed by SOHLA Admin Operations before going live.
                </div>
                <button
                  onClick={handleSubmitMerchantChanges}
                  disabled={isSubmittingSimChanges}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmittingSimChanges ? 'Submitting...' : 'Submit Changes for Approval'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Register Owner */}
      {isCreatingOwner && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#EADBCA] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Register Business Owner Account</h3>
              <button onClick={() => setIsCreatingOwner(false)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <form onSubmit={handleCreateOwner} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Business Partner *</label>
                <select
                  required
                  value={formData.partnerId}
                  onChange={e => setFormData({ ...formData, partnerId: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                >
                  {(partners || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.location})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Owner Full Name *</label>
                <input
                  required
                  type="text"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg"
                  placeholder="e.g., Ebrima Jallow"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Phone Number *</label>
                  <input
                    required
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 bg-stone-50 border rounded-lg"
                    placeholder="+220 788 1234"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 bg-stone-50 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">National ID / NIN</label>
                <input
                  type="text"
                  value={formData.nationalIdOrNin}
                  onChange={e => setFormData({ ...formData, nationalIdOrNin: e.target.value })}
                  className="w-full p-2 bg-stone-50 border rounded-lg font-mono"
                  placeholder="GMB-NIN-xxxxxx"
                />
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setIsCreatingOwner(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 text-stone-950 font-semibold rounded-lg">Register Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
