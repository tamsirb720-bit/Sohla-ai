import React, { useState } from 'react';
import { X, Lock, Shield, CheckCircle2, User, Key } from 'lucide-react';
import { AdminRole, AdminUser } from '../../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser, token: string) => void;
  targetPortal?: 'control_center' | 'classic';
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  targetPortal = 'control_center'
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('SUPER_ADMIN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const rolePresets: { role: AdminRole; label: string; desc: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full platform, database & audit access' },
    { role: 'BUSINESS_MANAGER', label: 'Business Manager', desc: 'Verified partners, products & services' },
    { role: 'CONTENT_MANAGER', label: 'Content Manager', desc: 'Categories, banners & top billboards' },
    { role: 'ANALYST', label: 'Platform Analyst', desc: 'Read-only metrics, searches & telemetry' },
    { role: 'SUPPORT', label: 'Support Agent', desc: 'User accounts & customer enquiries' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both administrator username and password');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          password,
          role: selectedRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        onLoginSuccess(data.user, data.token);
      } else {
        setError(data.error || 'Invalid administrator credentials');
      }
    } catch (err) {
      setError('Connection failed. Please verify the server is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRolePreset = (r: AdminRole) => {
    setSelectedRole(r);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4">
      <div
        id="admin-auth-card"
        className="relative w-full max-w-md bg-slate-900 text-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-purple-500/30 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display tracking-tight text-white">
                {targetPortal === 'control_center' ? 'SOHLA Control Center' : 'Classic Admin Portal'}
              </h2>
              <p className="text-xs text-purple-300">
                {targetPortal === 'control_center' ? 'Modern Platform Operations & Security' : 'Classic Administration Gateway'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Quick Role Switcher for easy demo / administrative review */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Role for Login Session
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {rolePresets.map((rp) => (
                <button
                  key={rp.role}
                  type="button"
                  onClick={() => handleSelectRolePreset(rp.role)}
                  className={`p-2 rounded-xl text-left text-xs transition cursor-pointer border ${
                    selectedRole === rp.role
                      ? 'bg-purple-600/30 border-purple-400 text-white shadow-sm'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-bold block truncate">{rp.label}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{rp.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username / Admin ID</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Secret Key / Password</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-admin-submit-login"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:opacity-90 text-white font-extrabold text-sm shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Verifying Authorization...' : `Sign in as ${selectedRole.replace(/_/g, ' ')}`}</span>
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-1">
            Protected under SOHLA RBAC security policies. All session activities are immutably logged to the platform audit ledger.
          </div>
        </form>
      </div>
    </div>
  );
};
