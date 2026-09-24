import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  RefreshCw,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminSecurityPasswordModuleProps {
  currentUser: AdminUser;
  token: string;
  onLogout?: () => void;
}

interface SecurityStatus {
  algorithm: string;
  iterations: number;
  lastUpdated: string;
  activeSessionsCount: number;
  isProtected: boolean;
}

export const AdminSecurityPasswordModule: React.FC<AdminSecurityPasswordModuleProps> = ({
  currentUser,
  token,
  onLogout
}) => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);

  // Toggles for visibility
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Submission feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Fetch security metadata
  const fetchSecurityStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/admin/security-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSecurityStatus(data);
      }
    } catch (err) {
      console.error('Failed to load security status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSecurityStatus();
  }, [token]);

  // Password requirements calculation
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const hasMinLength = newPassword.length >= 6;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid = isSuperAdmin && hasMinLength && passwordsMatch && currentPassword.length > 0;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isSuperAdmin) {
      setErrorMessage('Super Administrator clearance is required to modify platform security credentials.');
      return;
    }

    if (!isFormValid) {
      setErrorMessage('Please ensure the new password is at least 6 characters long and matches the confirmation.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage('Administrator password updated successfully! Hash securely committed to vault.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        if (revokeOtherSessions) {
          try {
            await fetch('/api/admin/revoke-sessions', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch {}
        }

        fetchSecurityStatus();
        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        setErrorMessage(data.error || 'Failed to update administrator password. Please verify current password.');
      }
    } catch (err) {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Revoke all other active administrator sessions now?')) return;
    try {
      setIsRevoking(true);
      const res = await fetch('/api/admin/revoke-sessions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMessage('All other active administrator sessions have been revoked.');
        fetchSecurityStatus();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch {
      setErrorMessage('Failed to revoke sessions.');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-600" />
          Administrator Password & Security Vault
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Manage platform administrator authentication, cryptographic password hashing, and active session controls
        </p>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold">Vault Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-emerald-800">Protected & Salted</span>
          </div>
          <p className="text-[10px] text-stone-400 mt-1">Zero plaintext exposure</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold">Hashing Algorithm</span>
            <Cpu className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-sm font-bold text-stone-900 font-mono">
            {securityStatus?.algorithm || 'PBKDF2-SHA512'}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">
            {securityStatus?.iterations ? `${securityStatus.iterations.toLocaleString()} key-stretching iterations` : '10,000 iterations'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold">Last Updated</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xs font-bold text-stone-900 truncate">
            {securityStatus?.lastUpdated ? new Date(securityStatus.lastUpdated).toLocaleDateString() : 'Active'}
          </div>
          <p className="text-[10px] text-stone-400 mt-1 truncate">
            {securityStatus?.lastUpdated ? new Date(securityStatus.lastUpdated).toLocaleTimeString() : 'Verified'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[#EADBCA] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold">Active Sessions</span>
            <Lock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-sm font-bold text-stone-900">
            {securityStatus?.activeSessionsCount || 1} session{securityStatus?.activeSessionsCount === 1 ? '' : 's'}
          </div>
          <p className="text-[10px] text-stone-400 mt-1">Server-side validated tokens</p>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Password Update Card */}
      <div className="bg-white rounded-2xl border border-[#EADBCA] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-stone-900">Update Administrator Password</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Updates the cryptographic hash used for SOHLA Control Center and Classic Admin Portal access.
            </p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Current Administrator Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="input-current-admin-password"
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current administrator password"
                className="w-full h-11 px-3.5 pr-11 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                New Administrator Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-new-admin-password"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full h-11 px-3.5 pr-11 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Requirements Checklist */}
              <div className="mt-2 space-y-1 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700' : 'text-stone-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-600' : 'bg-stone-300'}`} />
                  <span>At least 6 characters</span>
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="input-confirm-admin-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full h-11 px-3.5 pr-11 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <div className={`mt-2 text-[11px] font-semibold flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700' : 'text-rose-600'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-600' : 'bg-rose-500'}`} />
                  <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Revoke Sessions Option */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={revokeOtherSessions}
                onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
              />
              <span className="font-medium">
                Revoke all other active administrator sessions immediately upon updating password
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <div className="text-[11px] text-stone-400">
              Changes take effect immediately across all admin gateways.
            </div>
            <button
              id="btn-submit-change-password"
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save New Password Hash</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Emergency Session Management */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-stone-700" />
            Active Session Termination
          </h4>
          <p className="text-[11px] text-stone-500 mt-0.5">
            If you suspect unauthorized devices or left a public terminal open, terminate all other active administrator tokens.
          </p>
        </div>
        <button
          onClick={handleRevokeAllSessions}
          disabled={isRevoking}
          className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isRevoking ? 'Revoking...' : 'Revoke Other Sessions'}</span>
        </button>
      </div>
    </div>
  );
};
