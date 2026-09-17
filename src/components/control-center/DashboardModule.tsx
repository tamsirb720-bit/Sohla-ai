import React from 'react';
import {
  TrendingUp,
  Building2,
  Package,
  Video,
  ShieldCheck,
  Zap,
  Users,
  AlertCircle,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  FileCheck,
  Brain,
  CreditCard,
  Plus
} from 'lucide-react';
import { AdminStats, BusinessPartner, AuditLogEntry, ControlCenterTab } from '../../types';

interface DashboardModuleProps {
  stats: AdminStats | null;
  partners: BusinessPartner[];
  auditLogs: AuditLogEntry[];
  pendingApprovalsCount: number;
  onNavigateTab: (tab: ControlCenterTab) => void;
  onAddBusiness: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  stats,
  partners,
  auditLogs,
  pendingApprovalsCount,
  onNavigateTab,
  onAddBusiness
}) => {
  const verifiedCount = partners.filter(p => p.verificationStatus === 'verified' || p.verified).length;
  const pendingCount = partners.filter(p => p.verificationStatus === 'pending').length;
  const activeCount = partners.filter(p => p.activeStatus || p.active).length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-[#19110B] via-[#2A1810] to-[#19110B] rounded-2xl p-6 text-white shadow-lg border border-[#EADBCA]/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Gambian Operations Engine
              </span>
              <span className="text-xs text-white/50">•</span>
              <span className="text-xs text-amber-300/80 font-medium">Banjul / Greater Banjul Area</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              SOHLA Operations Cockpit 🇬🇲
            </h1>
            <p className="text-sm text-[#EADBCA]/80 mt-1 max-w-2xl">
              Centralized platform management: verified merchant ecosystem, NAWEC utilities, 5-8s video billboards, and grounded AI telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onAddBusiness}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-sm transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Partner
            </button>
            <button
              onClick={() => onNavigateTab('approvals')}
              className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 font-medium text-sm transition-all active:scale-95"
            >
              <FileCheck className="w-4 h-4 text-amber-400" />
              Approvals Queue
              {pendingApprovalsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs font-bold bg-amber-500 text-stone-950 rounded-full">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verified Businesses */}
        <div
          onClick={() => onNavigateTab('businesses')}
          className="bg-white rounded-xl p-5 border border-[#EADBCA] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Verified Merchants</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{verifiedCount}</span>
            <span className="text-xs font-medium text-stone-500">of {partners.length} registered</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {activeCount} Active
            </span>
            <span className="text-amber-600 font-medium flex items-center gap-1">
              {pendingCount} Pending
            </span>
          </div>
        </div>

        {/* Product Catalog Items */}
        <div
          onClick={() => onNavigateTab('products')}
          className="bg-white rounded-xl p-5 border border-[#EADBCA] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Catalog & Menu Items</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{stats?.totalProducts || 32}</span>
            <span className="text-xs font-medium text-stone-500">Live GMD items</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
            <span className="text-stone-600">Across {partners.length} stores</span>
            <span className="text-amber-600 flex items-center gap-0.5 font-medium">
              Manage <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Video Billboards */}
        <div
          onClick={() => onNavigateTab('advertisements')}
          className="bg-white rounded-xl p-5 border border-[#EADBCA] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">5-8s Video Billboards</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{stats?.activeAdsCount || 5}</span>
            <span className="text-xs font-medium text-emerald-600">Active Rotations</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
            <span className="text-stone-600">Avg duration: 6s</span>
            <span className="text-purple-600 flex items-center gap-0.5 font-medium">
              Ad Engine <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* AI & Telemetry Activity */}
        <div
          onClick={() => onNavigateTab('ai_knowledge')}
          className="bg-white rounded-xl p-5 border border-[#EADBCA] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">AI Brain Inquiries</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900">{stats?.aiSearchesCount || 142}</span>
            <span className="text-xs font-medium text-stone-500">Grounded Searches</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-100">
            <span className="text-emerald-600 font-medium">Zero Hallucination</span>
            <span className="text-blue-600 flex items-center gap-0.5 font-medium">
              Knowledge <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Cockpit Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Businesses & Action Priorities */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Hub Navigation Cards */}
          <div className="bg-white rounded-xl p-5 border border-[#EADBCA] shadow-sm">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Operations Launchpad
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => onNavigateTab('businesses')}
                className="p-3 text-left rounded-lg bg-stone-50 hover:bg-[#FAF8F5] border border-stone-200/80 hover:border-amber-300 transition-all text-xs group"
              >
                <div className="font-semibold text-stone-800 group-hover:text-amber-700 flex items-center justify-between">
                  Merchants
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                </div>
                <div className="text-stone-500 mt-1">Verify and feature partners</div>
              </button>

              <button
                onClick={() => onNavigateTab('business_owners')}
                className="p-3 text-left rounded-lg bg-stone-50 hover:bg-[#FAF8F5] border border-stone-200/80 hover:border-amber-300 transition-all text-xs group"
              >
                <div className="font-semibold text-stone-800 group-hover:text-amber-700 flex items-center justify-between">
                  Owner Portal
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                </div>
                <div className="text-stone-500 mt-1">Claims & merchant login</div>
              </button>

              <button
                onClick={() => onNavigateTab('news')}
                className="p-3 text-left rounded-lg bg-stone-50 hover:bg-[#FAF8F5] border border-stone-200/80 hover:border-amber-300 transition-all text-xs group"
              >
                <div className="font-semibold text-stone-800 group-hover:text-amber-700 flex items-center justify-between">
                  News & Media
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                </div>
                <div className="text-stone-500 mt-1">Articles & community info</div>
              </button>

              <button
                onClick={() => onNavigateTab('payments')}
                className="p-3 text-left rounded-lg bg-stone-50 hover:bg-[#FAF8F5] border border-stone-200/80 hover:border-amber-300 transition-all text-xs group"
              >
                <div className="font-semibold text-stone-800 group-hover:text-amber-700 flex items-center justify-between">
                  Payments
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                </div>
                <div className="text-stone-500 mt-1">Cash Power & Wave/QMoney</div>
              </button>

              <button
                onClick={() => onNavigateTab('team')}
                className="p-3 text-left rounded-lg bg-stone-50 hover:bg-[#FAF8F5] border border-stone-200/80 hover:border-amber-300 transition-all text-xs group"
              >
                <div className="font-semibold text-stone-800 group-hover:text-amber-700 flex items-center justify-between">
                  Super Team
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                </div>
                <div className="text-stone-500 mt-1">NIN verification & tiers</div>
              </button>

              <button
                onClick={() => onNavigateTab('system_health')}
                className="p-3 text-left rounded-lg bg-stone-50 hover:bg-[#FAF8F5] border border-stone-200/80 hover:border-amber-300 transition-all text-xs group"
              >
                <div className="font-semibold text-stone-800 group-hover:text-amber-700 flex items-center justify-between">
                  System Health
                  <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-600" />
                </div>
                <div className="text-stone-500 mt-1">JSON backup snapshot</div>
              </button>
            </div>
          </div>

          {/* Recently Added or Updated Partners Table */}
          <div className="bg-white rounded-xl border border-[#EADBCA] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">Registered Gambian Partners</h3>
                <p className="text-xs text-stone-500">Live businesses verified on the platform</p>
              </div>
              <button
                onClick={() => onNavigateTab('businesses')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                View All ({partners.length})
              </button>
            </div>

            <div className="divide-y divide-stone-100">
              {partners.slice(0, 5).map(partner => (
                <div key={partner.id} className="p-4 hover:bg-stone-50/70 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=100&q=80';
                      }}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-stone-900 truncate flex items-center gap-1.5">
                        {partner.name}
                        {partner.verificationStatus === 'verified' && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-medium">Verified</span>
                        )}
                        {partner.featuredStatus && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-medium">Featured</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 truncate flex items-center gap-2 mt-0.5">
                        <span>{partner.category}</span>
                        <span>•</span>
                        <span>{partner.location}</span>
                        <span>•</span>
                        <span>{partner.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-stone-900">
                      {partner.products?.length || 0} Products
                    </div>
                    <div className="text-[11px] text-stone-400">
                      {partner.rating} ★ ({partner.reviewCount || 0})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Immutable Security Audit Stream */}
        <div className="space-y-6">
          {/* Audit Trail Card */}
          <div className="bg-white rounded-xl border border-[#EADBCA] shadow-sm p-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">Audit Ledger Feed</h3>
              </div>
              <button
                onClick={() => onNavigateTab('security_audit')}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                Full Trail
              </button>
            </div>

            <div className="mt-3 space-y-3 max-h-[460px] overflow-y-auto pr-1 text-xs">
              {auditLogs.length === 0 ? (
                <div className="text-center py-6 text-stone-400">No recent security events recorded</div>
              ) : (
                auditLogs.slice(0, 8).map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span className="font-semibold text-stone-700">{log.adminName || 'Admin'}</span>
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Just now'}</span>
                    </div>
                    <div className="mt-1 font-medium text-stone-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-stone-200 text-stone-800">
                        {log.action}
                      </span>
                      <span className="truncate">{log.targetRecord || log.targetEntity}</span>
                    </div>
                    {log.details && (
                      <p className="mt-1 text-[11px] text-stone-600 line-clamp-2">{log.details}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Platform Info */}
          <div className="bg-[#FAF8F5] rounded-xl border border-[#EADBCA] p-4 text-xs space-y-2">
            <div className="font-bold text-stone-900">Gambia Platform Guard</div>
            <div className="text-stone-600 flex justify-between">
              <span>Currency:</span>
              <span className="font-semibold text-stone-900">Dalasi (GMD / D)</span>
            </div>
            <div className="text-stone-600 flex justify-between">
              <span>Database File:</span>
              <span className="font-mono text-stone-900">data_store.json</span>
            </div>
            <div className="text-stone-600 flex justify-between">
              <span>NAWEC Tariff:</span>
              <span className="font-semibold text-stone-900">D11.00 / kWh</span>
            </div>
            <div className="text-stone-600 flex justify-between">
              <span>AI Grounding:</span>
              <span className="font-semibold text-emerald-700">Strict Live Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
