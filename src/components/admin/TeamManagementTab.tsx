import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  FileCheck,
  Phone,
  Mail,
  Building,
  UserCheck,
  BadgeAlert
} from 'lucide-react';
import { AdminUser, AdminRole, SecurityClearanceTier } from '../../types';

interface TeamManagementTabProps {
  currentUser: AdminUser;
  token: string;
  teamMembers: AdminUser[];
  onRefresh: () => void;
  showToast: (msg: string) => void;
}

const ROLE_DESCRIPTIONS: Record<AdminRole, { title: string; color: string; clearance: SecurityClearanceTier }> = {
  SUPER_ADMIN: {
    title: 'Super Administrator',
    color: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
    clearance: 'TIER_1_CORE'
  },
  ADMIN: {
    title: 'Security Administrator',
    color: 'bg-indigo-900/60 text-indigo-300 border-indigo-700/60',
    clearance: 'TIER_1_CORE'
  },
  BUSINESS_MANAGER: {
    title: 'Business Manager',
    color: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
    clearance: 'TIER_2_OPERATIONAL'
  },
  CONTENT_MANAGER: {
    title: 'Content & Ads Manager',
    color: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
    clearance: 'TIER_2_OPERATIONAL'
  },
  ANALYST: {
    title: 'Platform Analyst',
    color: 'bg-teal-900/60 text-teal-300 border-teal-700/60',
    clearance: 'TIER_3_SUPPORT'
  },
  SUPPORT: {
    title: 'Support Specialist',
    color: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
    clearance: 'TIER_3_SUPPORT'
  }
};

const CLEARANCE_BADGES: Record<SecurityClearanceTier, { label: string; badgeColor: string; description: string }> = {
  TIER_1_CORE: {
    label: 'Tier 1 • Core System',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    description: 'Full root clearance: Team provisioning, security audit access, and disaster recovery'
  },
  TIER_2_OPERATIONAL: {
    label: 'Tier 2 • Operational',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Merchant onboarding, catalog pricing, and video billboard moderation'
  },
  TIER_3_SUPPORT: {
    label: 'Tier 3 • Citizen Support',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'User ticket response, AI request review, and customer helpdesk'
  }
};

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({
  currentUser,
  token,
  teamMembers,
  onRefresh,
  showToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [clearanceFilter, setClearanceFilter] = useState('ALL');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Activation key generated popup
  const [activationModal, setActivationModal] = useState<{
    name: string;
    username: string;
    tempKey: string;
    role: string;
    nin: string;
  } | null>(null);

  // New member form state
  const [newMember, setNewMember] = useState({
    name: '',
    username: '',
    email: '',
    phone: '+220 7',
    nationalIdOrNin: 'GMB-NIN-',
    department: 'Merchant Onboarding & Operations',
    role: 'SUPPORT' as AdminRole,
    securityClearance: 'TIER_3_SUPPORT' as SecurityClearanceTier,
    verifiedPersonal: true,
    twoFactorEnabled: true,
    passedNinVerification: true,
    signedSecurityNda: true
  });

  const canAddMembers = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  // Handle role change and automatically adjust default clearance
  const handleRoleChange = (selectedRole: AdminRole) => {
    const recommendedClearance = ROLE_DESCRIPTIONS[selectedRole]?.clearance || 'TIER_3_SUPPORT';
    setNewMember((prev) => ({
      ...prev,
      role: selectedRole,
      securityClearance: recommendedClearance
    }));
  };

  // Submit enrollment form
  const handleEnrollMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddMembers) {
      showToast('Error: Only portal administrators can add a team member.');
      return;
    }

    if (!newMember.name.trim() || newMember.name.trim().length < 3) {
      alert('Please enter the full legal name of the verified member.');
      return;
    }
    if (!newMember.username.trim()) {
      alert('Please enter a staff handle / username.');
      return;
    }
    if (!newMember.email.includes('@')) {
      alert('Please provide a valid official email address.');
      return;
    }
    if (!newMember.nationalIdOrNin || newMember.nationalIdOrNin.length < 8) {
      alert('Valid Gambian National Identity Number (NIN) is required for verified personal enrollment.');
      return;
    }
    if (!newMember.phone || newMember.phone.length < 7) {
      alert('Verified Gambian phone number is required for 2FA security.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newMember,
          _adminName: currentUser.name,
          _adminRole: currentUser.role
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Staff member "${newMember.name}" enrolled with Verified Personal status!`);
        setActivationModal({
          name: newMember.name,
          username: data.user.username,
          tempKey: data.tempKey,
          role: newMember.role,
          nin: newMember.nationalIdOrNin
        });
        setIsAddingMember(false);
        // Reset form
        setNewMember({
          name: '',
          username: '',
          email: '',
          phone: '+220 7',
          nationalIdOrNin: 'GMB-NIN-',
          department: 'Merchant Onboarding & Operations',
          role: 'SUPPORT',
          securityClearance: 'TIER_3_SUPPORT',
          verifiedPersonal: true,
          twoFactorEnabled: true,
          passedNinVerification: true,
          signedSecurityNda: true
        });
        onRefresh();
      } else {
        alert(data.error || 'Failed to enroll member.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error enrolling team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle user active / suspended status
  const handleToggleStatus = async (user: AdminUser) => {
    if (user.id === 'u-1') {
      alert('The root Super Administrator account cannot be deactivated.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          _adminName: currentUser.name,
          _adminRole: currentUser.role
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Staff member "${user.name}" access ${data.active ? 'RESTORED' : 'SUSPENDED'}`);
        onRefresh();
      } else {
        alert(data.error || 'Could not update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete team member
  const handleDeleteMember = async (user: AdminUser) => {
    if (user.id === 'u-1') {
      alert('Root Super Administrator cannot be removed.');
      return;
    }
    if (currentUser.role !== 'SUPER_ADMIN') {
      alert('Only a Super Administrator can permanently revoke and delete team accounts.');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke all security credentials and delete "${user.name}"? This action is recorded in the platform audit log.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          _adminName: currentUser.name,
          _adminRole: currentUser.role
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Member "${user.name}" removed and credentials revoked.`);
        onRefresh();
      } else {
        alert(data.error || 'Could not delete member');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy activation key
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filtered roster
  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.nationalIdOrNin && m.nationalIdOrNin.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.department && m.department.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    const matchesClearance = clearanceFilter === 'ALL' || m.securityClearance === clearanceFilter;

    return matchesSearch && matchesRole && matchesClearance;
  });

  const verifiedCount = teamMembers.filter((m) => m.verifiedPersonal).length;
  const tier1Count = teamMembers.filter((m) => m.securityClearance === 'TIER_1_CORE').length;
  const activeCount = teamMembers.filter((m) => m.active).length;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight">
              Team & Verified Personnel
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Portal Restricted</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Only authorized portal administrators can enroll team members. Strict identity verification (Gambian NIN, corporate contact) and role-based security clearance enforced.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Refresh team roster"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            id="btn-add-team-member"
            onClick={() => {
              if (!canAddMembers) {
                alert('Access restricted: Only portal Super Administrators and Administrators can add team members.');
                return;
              }
              setIsAddingMember(!isAddingMember);
            }}
            disabled={!canAddMembers}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center space-x-2 transition ${
              canAddMembers
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            title={canAddMembers ? 'Enroll new verified staff' : 'Only Super Admins can add members'}
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Verified Member</span>
          </button>
        </div>
      </div>

      {/* Security Governance Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center space-x-2">
              <span>Portal-Only Enrollment & Verified Personal Policy</span>
              <span className="text-[10px] px-2 py-0.2 bg-emerald-500/20 text-emerald-400 rounded-full font-mono font-normal">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Public staff registration is disabled. All team accounts require an administrative authorization signature, validated Gambian National Identity Number (NIN), and mandatory Two-Factor Authentication (2FA).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Verified ID</div>
            <div className="text-xs font-black text-emerald-400">{verifiedCount} / {teamMembers.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Tier 1 Core</div>
            <div className="text-xs font-black text-purple-400">{tier1Count}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-mono">Active Staff</div>
            <div className="text-xs font-black text-white">{activeCount}</div>
          </div>
        </div>
      </div>

      {/* Activation Key Generated Modal */}
      {activationModal && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-slate-900 border-2 border-purple-500/60 shadow-2xl space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Staff Member Successfully Enrolled & Verified</h3>
                <p className="text-xs text-purple-300">
                  Provide this one-time initial security key to <strong>{activationModal.name}</strong> ({activationModal.username}).
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivationModal(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800"
            >
              Dismiss
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/40 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Initial Security Activation Key (One-Time)
              </div>
              <div className="text-lg font-mono font-black text-amber-400 tracking-widest mt-0.5">
                {activationModal.tempKey}
              </div>
            </div>
            <button
              onClick={() => handleCopyKey(activationModal.tempKey)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center space-x-1.5 transition"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-4 pt-1">
            <span>🛡️ NIN Recorded: <strong className="text-slate-200">{activationModal.nin}</strong></span>
            <span>🔑 Role Clearance: <strong className="text-purple-300">{activationModal.role}</strong></span>
          </div>
        </div>
      )}

      {/* ENROLLMENT FORM MODAL / DRAWER */}
      {isAddingMember && (
        <form
          onSubmit={handleEnrollMember}
          className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-purple-500/40 shadow-2xl space-y-5 transition-all"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">
                  Administrative Personnel Enrollment & Security Clearance
                </h3>
                <p className="text-[11px] text-slate-400">
                  Enrolling official staff under authorization of {currentUser.name} ({currentUser.role})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Legal Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modou Lamin Jallow"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500">As shown on Gambian Passport or National ID card</span>
            </div>

            {/* Staff Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Staff Handle / Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. modoujallow"
                value={newMember.username}
                onChange={(e) => setNewMember({ ...newMember, username: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500">Unique internal portal handle</span>
            </div>

            {/* Official Work Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="e.g. modou@sohla.gm"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500">For security dispatch & MFA notifications</span>
            </div>

            {/* Verified Mobile Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Phone className="w-3 h-3 text-amber-400" />
                <span>Verified Telephone (+220)</span>
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="+220 788 1234"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500">Gambian mobile for 2FA verification</span>
            </div>

            {/* Gambian National Identity Number (NIN) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>National ID / NIN</span>
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="GMB-NIN-971204-88A"
                value={newMember.nationalIdOrNin}
                onChange={(e) => setNewMember({ ...newMember, nationalIdOrNin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-500">Civil Registry or Biometric ID</span>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Building className="w-3 h-3 text-indigo-400" />
                <span>Department / Division</span>
              </label>
              <select
                value={newMember.department}
                onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Executive Security & Platform Governance">Executive Security & Platform Governance</option>
                <option value="Merchant Onboarding & Partnerships">Merchant Onboarding & Partnerships</option>
                <option value="Billboard Ads & Media Moderation">Billboard Ads & Media Moderation</option>
                <option value="AI Telemetry & Business Intelligence">AI Telemetry & Business Intelligence</option>
                <option value="Citizen Care & Emergency Helpdesk">Citizen Care & Emergency Helpdesk</option>
                <option value="NAWEC & Utilities Financial Operations">NAWEC & Utilities Financial Operations</option>
              </select>
              <span className="text-[10px] text-slate-500">Operational organizational unit</span>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Role <span className="text-red-400">*</span>
              </label>
              <select
                value={newMember.role}
                onChange={(e) => handleRoleChange(e.target.value as AdminRole)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
              >
                <option value="SUPPORT">SUPPORT (Citizen Care & Requests)</option>
                <option value="ANALYST">ANALYST (Telemetry & Search Intelligence)</option>
                <option value="CONTENT_MANAGER">CONTENT_MANAGER (Billboard Ads & Media)</option>
                <option value="BUSINESS_MANAGER">BUSINESS_MANAGER (Merchants & Catalog)</option>
                <option value="ADMIN">ADMIN (Security & Partner Approvals)</option>
                {currentUser.role === 'SUPER_ADMIN' && (
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Root System Authority)</option>
                )}
              </select>
            </div>

            {/* Security Clearance Tier */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-purple-400" />
                <span>Security Clearance Level</span>
              </label>
              <select
                value={newMember.securityClearance}
                onChange={(e) => setNewMember({ ...newMember, securityClearance: e.target.value as SecurityClearanceTier })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
              >
                <option value="TIER_3_SUPPORT">Tier 3 • Support & Read Access</option>
                <option value="TIER_2_OPERATIONAL">Tier 2 • Operational (Merchants, Products, Ads)</option>
                {currentUser.role === 'SUPER_ADMIN' && (
                  <option value="TIER_1_CORE">Tier 1 • Core System Access (Full Control)</option>
                )}
              </select>
              <span className="text-[10px] text-slate-500">
                {CLEARANCE_BADGES[newMember.securityClearance]?.description}
              </span>
            </div>
          </div>

          {/* Mandatory Verification Checklist */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mandatory Personnel Verification Checklist</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMember.passedNinVerification}
                  onChange={(e) => setNewMember({ ...newMember, passedNinVerification: e.target.checked })}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                />
                <span>National Identity (NIN) Document Validated</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMember.signedSecurityNda}
                  onChange={(e) => setNewMember({ ...newMember, signedSecurityNda: e.target.checked })}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                />
                <span>Security Confidentiality & NDA Executed</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMember.twoFactorEnabled}
                  onChange={(e) => setNewMember({ ...newMember, twoFactorEnabled: e.target.checked })}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                />
                <span>Mandatory Two-Factor Authentication (2FA) Enforced</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMember.verifiedPersonal}
                  onChange={(e) => setNewMember({ ...newMember, verifiedPersonal: e.target.checked })}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                />
                <span>Designate as Officially Verified Personnel</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingMember(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center space-x-2 transition cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Enrolling & Securing...' : 'Issue Verified Staff Credentials'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Roster Filters & Search Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name, handle, NIN, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Roles ({teamMembers.length})</option>
            <option value="SUPER_ADMIN">Super Admins</option>
            <option value="ADMIN">Admins</option>
            <option value="BUSINESS_MANAGER">Business Managers</option>
            <option value="CONTENT_MANAGER">Content Managers</option>
            <option value="ANALYST">Analysts</option>
            <option value="SUPPORT">Support</option>
          </select>

          {/* Clearance Filter */}
          <select
            value={clearanceFilter}
            onChange={(e) => setClearanceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Clearances</option>
            <option value="TIER_1_CORE">Tier 1 Core</option>
            <option value="TIER_2_OPERATIONAL">Tier 2 Operational</option>
            <option value="TIER_3_SUPPORT">Tier 3 Support</option>
          </select>
        </div>
      </div>

      {/* Personnel Roster Cards / Table */}
      <div className="space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-semibold">No team members match your criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing search keywords or filters.</p>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const roleMeta = ROLE_DESCRIPTIONS[member.role] || {
              title: member.role,
              color: 'bg-slate-800 text-slate-300 border-slate-700',
              clearance: 'TIER_3_SUPPORT'
            };
            const clearance = member.securityClearance || roleMeta.clearance;
            const clearanceMeta = CLEARANCE_BADGES[clearance] || CLEARANCE_BADGES.TIER_3_SUPPORT;

            const isRoot = member.id === 'u-1';

            return (
              <div
                key={member.id}
                id={`member-row-${member.username}`}
                className={`p-4 rounded-2xl border transition-all duration-200 ${
                  member.active
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-sm'
                    : 'bg-slate-950/70 border-red-950/50 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Member Identity & Verified Badge */}
                  <div className="flex items-start space-x-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-display font-black text-sm text-white shrink-0 border ${
                        member.role === 'SUPER_ADMIN'
                          ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 border-purple-500/50'
                          : member.role === 'ADMIN'
                          ? 'bg-gradient-to-tr from-indigo-700 to-blue-600 border-indigo-500/50'
                          : 'bg-gradient-to-tr from-slate-800 to-slate-700 border-slate-600'
                      }`}
                    >
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white font-display">{member.name}</span>
                        <span className="text-xs text-slate-400 font-mono">@{member.username}</span>

                        {/* Verified Personal Badge */}
                        {member.verifiedPersonal ? (
                          <span
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            title="Identity verified via Gambian Civil Registry NIN"
                          >
                            <UserCheck className="w-3 h-3 text-emerald-400" />
                            <span>Verified Personal</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <BadgeAlert className="w-3 h-3 text-amber-400" />
                            <span>Pending Verification</span>
                          </span>
                        )}

                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            member.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {member.active ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </div>

                      {/* Contact and NIN data */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center space-x-1 font-mono text-slate-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>NIN: {member.nationalIdOrNin || 'GMB-NIN-RECORDED'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{member.email}</span>
                        </span>
                        {member.phone && (
                          <span className="flex items-center space-x-1 font-mono text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{member.phone}</span>
                          </span>
                        )}
                        {member.department && (
                          <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            <span>{member.department}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Security Tier & Actions */}
                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <div className="flex items-center space-x-2">
                      {/* Role Pill */}
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${roleMeta.color}`}>
                        {roleMeta.title}
                      </span>

                      {/* Clearance Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${clearanceMeta.badgeColor}`}
                        title={clearanceMeta.description}
                      >
                        {clearanceMeta.label}
                      </span>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-1.5">
                      {/* Toggle status (Suspend / Restore) */}
                      {!isRoot && (
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                            member.active
                              ? 'bg-slate-800 hover:bg-amber-900/40 text-slate-300 hover:text-amber-300'
                              : 'bg-emerald-900/50 hover:bg-emerald-800 text-emerald-300'
                          }`}
                          title={member.active ? 'Suspend staff access' : 'Restore access'}
                        >
                          {member.active ? (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete Member (Super Admin only) */}
                      {!isRoot && currentUser.role === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleDeleteMember(member)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 transition"
                          title="Revoke and remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {isRoot && (
                        <span className="text-[10px] font-mono text-purple-400 px-2 py-1 bg-purple-900/30 rounded border border-purple-500/20">
                          Root Master
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit footnote */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Verified By: {member.verifiedBy || 'Executive Platform Governance'}</span>
                  <span>Last Active: {member.lastLogin}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
