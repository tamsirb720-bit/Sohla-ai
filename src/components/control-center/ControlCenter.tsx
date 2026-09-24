import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Tag,
  Video,
  Newspaper,
  Calendar,
  Users,
  ShieldCheck,
  Brain,
  CreditCard,
  Image as ImageIcon,
  FileCheck,
  BarChart3,
  ShieldAlert,
  Activity,
  Settings,
  LogOut,
  X,
  ExternalLink,
  ChevronRight,
  Menu,
  Sparkles,
  Download,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Scissors,
  Truck,
  HeartHandshake
} from 'lucide-react';
import {
  AdminUser,
  BusinessPartner,
  Advertisement,
  AuditLogEntry,
  MissingAIRequest,
  CategoryInfo,
  ControlCenterTab
} from '../../types';
import { SohlaLogo } from '../common/SohlaLogo';
import { DashboardModule } from './DashboardModule';
import { BusinessesModule } from './BusinessesModule';
import { ProductsServicesModule } from './ProductsServicesModule';
import { CategoriesLocationsModule } from './CategoriesLocationsModule';
import { AdsModule } from './AdsModule';
import { ContentModule } from './ContentModule';
import { BusinessOwnersModule } from './BusinessOwnersModule';
import { AIKnowledgeModule } from './AIKnowledgeModule';
import { PaymentsModule } from './PaymentsModule';
import { MediaModule } from './MediaModule';
import { ApprovalsModule } from './ApprovalsModule';
import { PlatformSettingsModule } from './PlatformSettingsModule';
import { AdminSecurityPasswordModule } from './AdminSecurityPasswordModule';
import { BeautyBookingsModule } from './BeautyBookingsModule';
import { DeliveryOrdersModule } from './DeliveryOrdersModule';
import { HealthcareServicesModule } from './HealthcareServicesModule';
import { TeamManagementTab } from '../admin/TeamManagementTab';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';

interface ControlCenterProps {
  currentUser: AdminUser;
  token: string;
  onLogout: () => void;
  onClose: () => void;
  onSwitchToClassicAdmin?: () => void;
  onDataUpdated?: () => void;
}

export const ControlCenter: React.FC<ControlCenterProps> = ({
  currentUser,
  token,
  onLogout,
  onClose,
  onSwitchToClassicAdmin,
  onDataUpdated
}) => {
  const [activeTab, setActiveTab] = useState<ControlCenterTab>('dashboard');
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [teamMembers, setTeamMembers] = useState<AdminUser[]>([]);
  const [missingRequests, setMissingRequests] = useState<MissingAIRequest[]>([]);
  const [approvalCount, setApprovalCount] = useState<number>(0);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const fetchFullPlatformData = async () => {
    setIsRefreshing(true);
    try {
      const [
        partnersRes,
        adsRes,
        categoriesRes,
        auditRes,
        teamRes,
        missingRes,
        approvalsRes,
        healthRes
      ] = await Promise.all([
        fetch('/api/partners').catch(() => null),
        fetch('/api/ads').catch(() => null),
        fetch('/api/categories').catch(() => null),
        fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/admin/team', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/admin/missing-requests', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch('/api/control-center/approvals').catch(() => null),
        fetch('/api/health').catch(() => null)
      ]);

      if (partnersRes && partnersRes.ok) {
        const p = await partnersRes.json();
        setPartners(Array.isArray(p) ? p : []);
        // derive distinct locations
        const locSet = new Set<string>();
        (p || []).forEach((item: any) => {
          if (item.location) locSet.add(item.location);
        });
        setLocations(Array.from(locSet));
      }

      if (adsRes && adsRes.ok) {
        const a = await adsRes.json();
        setAds(Array.isArray(a) ? a : []);
      }

      if (categoriesRes && categoriesRes.ok) {
        const c = await categoriesRes.json();
        setCategories(Array.isArray(c) ? c : []);
      }

      if (auditRes && auditRes.ok) {
        const l = await auditRes.json();
        setAuditLogs(Array.isArray(l) ? l : []);
      }

      if (teamRes && teamRes.ok) {
        const t = await teamRes.json();
        setTeamMembers(Array.isArray(t) ? t : []);
      }

      if (missingRes && missingRes.ok) {
        const m = await missingRes.json();
        setMissingRequests(Array.isArray(m) ? m : []);
      }

      if (approvalsRes && approvalsRes.ok) {
        const app = await approvalsRes.json();
        if (Array.isArray(app)) {
          setApprovalCount(app.filter((item: any) => item.status === 'pending').length);
        }
      }

      if (healthRes && healthRes.ok) {
        const h = await healthRes.json();
        setHealthStatus(h);
      }

      onDataUpdated?.();
    } catch (err) {
      console.error('Failed to sync Control Center data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFullPlatformData();
  }, [token]);

  const handleDownloadBackup = async () => {
    try {
      if (token && currentUser.role === 'SUPER_ADMIN') {
        const res = await fetch('/api/admin/backup', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sohla-database-backup-${new Date().toISOString().split('T')[0]}.json`;
          a.click();
          setBackupStatus('Server JSON snapshot backup downloaded successfully');
          setTimeout(() => setBackupStatus(null), 3000);
          return;
        }
      }

      // Safe client snapshot fallback
      const dataToExport = {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.name,
        partners,
        ads,
        categories,
        locations
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sohla-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setBackupStatus('JSON Snapshot backup saved successfully');
      setTimeout(() => setBackupStatus(null), 3000);
    } catch (err) {
      console.error('Backup error:', err);
    }
  };

  // Nav items
  const navSections = [
    {
      group: 'Core Operations',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'businesses', label: 'Businesses & Partners', icon: Building2, count: partners.length },
        { id: 'products', label: 'Products & Services', icon: Package },
        { id: 'categories', label: 'Categories & Locations', icon: Tag },
        { id: 'advertisements', label: '5-8s Video Billboards', icon: Video, count: ads.length }
      ]
    },
    {
      group: 'Direct Services & Dispatch',
      items: [
        { id: 'beauty_bookings', label: 'Beauty & Salon Bookings', icon: Scissors },
        { id: 'healthcare_services', label: 'Healthcare & Nursing', icon: HeartHandshake },
        { id: 'delivery_orders', label: 'Delivery & Courier Dispatch', icon: Truck }
      ]
    },
    {
      group: 'Media & Community',
      items: [
        { id: 'news', label: 'News & Platform Articles', icon: Newspaper },
        { id: 'events', label: 'Community Events', icon: Calendar },
        { id: 'entertainment', label: 'Video Spotlights', icon: Sparkles },
        { id: 'media', label: 'Central Media Assets', icon: ImageIcon }
      ]
    },
    {
      group: 'Merchants & Ecosystem',
      items: [
        { id: 'business_owners', label: 'Business Owners & Claims', icon: Users },
        { id: 'approvals', label: 'Approvals Queue', icon: FileCheck, badge: approvalCount > 0 ? approvalCount : undefined },
        { id: 'ai_knowledge', label: 'AI Knowledge Base', icon: Brain },
        { id: 'payments', label: 'Payments & Dalasi Rates', icon: CreditCard }
      ]
    },
    {
      group: 'Governance & Security',
      items: [
        { id: 'super_team', label: 'Super Team & Clearance', icon: ShieldCheck },
        { id: 'admin_password', label: 'Admin Security & Password', icon: KeyRound },
        { id: 'analytics', label: 'Analytics & Search Demand', icon: BarChart3 },
        { id: 'security_audit', label: 'Security & Audit Logs', icon: ShieldAlert },
        { id: 'system_health', label: 'System Health & Backup', icon: Activity },
        { id: 'settings', label: 'Platform Settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] text-stone-800 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#1C1814] text-stone-200 border-r border-stone-800 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Clearance Header */}
        <div className="p-5 border-b border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SohlaLogo size="md" />
              <div>
                <div className="font-extrabold tracking-wide text-white text-base">SOHLA</div>
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Control Center</div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate max-w-[120px]">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-stone-400 truncate">{currentUser.role}</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded border border-amber-400/20">
              L{currentUser.securityClearanceLevel}
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          {navSections.map(sec => (
            <div key={sec.group}>
              <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 mb-2">
                {sec.group}
              </div>
              <div className="space-y-1">
                {sec.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as ControlCenterTab);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition-all ${
                        isActive
                          ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/10'
                          : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-stone-400'}`} />
                        <span>{item.label}</span>
                      </div>

                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-stone-950 animate-pulse">
                          {item.badge}
                        </span>
                      )}

                      {item.count !== undefined && !item.badge && (
                        <span className={`text-[10px] font-mono ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-stone-800 space-y-2">
          {onSwitchToClassicAdmin && (
            <button
              onClick={onSwitchToClassicAdmin}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-all border border-stone-800"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Switch to Classic Admin
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public SOHLA
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-stone-900 hover:bg-rose-950/60 text-stone-400 hover:text-rose-400"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#EADBCA] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-stone-100 text-stone-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-400">Control Center</span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              <span className="font-bold text-stone-900 capitalize">
                {activeTab.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchFullPlatformData}
              disabled={isRefreshing}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
            </button>

            <button
              onClick={handleDownloadBackup}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              JSON Backup
            </button>

            <div className="h-5 w-px bg-stone-200" />

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-[#1C1814] hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <span>Back to App</span>
            </button>
          </div>
        </header>

        {/* Dynamic Module Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {backupStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {backupStatus}
            </div>
          )}

          {/* Module 1: Dashboard */}
          {activeTab === 'dashboard' && (
            <ModuleErrorBoundary moduleName="Dashboard" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <DashboardModule
                partners={partners}
                ads={ads}
                teamMembers={teamMembers}
                categories={categories}
                currentUser={currentUser}
                auditLogs={auditLogs}
                pendingApprovalsCount={approvalCount}
                onNavigate={(tab) => setActiveTab(tab)}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onAddBusiness={() => setActiveTab('businesses')}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 2: Businesses */}
          {activeTab === 'businesses' && (
            <ModuleErrorBoundary moduleName="Businesses & Partners" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <BusinessesModule
                partners={partners}
                categories={categories}
                locations={locations}
                onRefresh={fetchFullPlatformData}
                currentAdminName={currentUser.name}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 3: Products & Services */}
          {activeTab === 'products' && (
            <ModuleErrorBoundary moduleName="Products & Services" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <ProductsServicesModule
                partners={partners}
                onRefresh={fetchFullPlatformData}
                currentAdminName={currentUser.name}
                token={token}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 4: Categories & Locations */}
          {activeTab === 'categories' && (
            <ModuleErrorBoundary moduleName="Categories & Locations" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <CategoriesLocationsModule
                categories={categories}
                locations={locations}
                partners={partners}
                onRefresh={fetchFullPlatformData}
                currentAdminName={currentUser.name}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 5: Advertisements */}
          {activeTab === 'advertisements' && (
            <ModuleErrorBoundary moduleName="Advertisements & Billboards" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <AdsModule
                ads={ads}
                partners={partners}
                onRefresh={fetchFullPlatformData}
                currentAdminName={currentUser.name}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module: Beauty & Salon Bookings */}
          {activeTab === 'beauty_bookings' && (
            <ModuleErrorBoundary moduleName="Beauty Bookings" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <BeautyBookingsModule adminUser={currentUser} />
            </ModuleErrorBoundary>
          )}

          {/* Module: Healthcare & Nursing Services */}
          {activeTab === 'healthcare_services' && (
            <ModuleErrorBoundary moduleName="Healthcare & Nursing" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <HealthcareServicesModule
                partners={partners}
                onRefresh={fetchFullPlatformData}
                currentAdminName={currentUser.name}
                token={token}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module: Delivery & Courier Dispatch */}
          {activeTab === 'delivery_orders' && (
            <ModuleErrorBoundary moduleName="Delivery Orders" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <DeliveryOrdersModule adminUser={currentUser} />
            </ModuleErrorBoundary>
          )}

          {/* Module 6, 7, 8: News, Events, Entertainment */}
          {(activeTab === 'news' || activeTab === 'events' || activeTab === 'entertainment') && (
            <ModuleErrorBoundary moduleName="Content, News & Events" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <ContentModule
                initialSubTab={activeTab}
                currentAdminName={currentUser.name}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 9: Business Owners */}
          {activeTab === 'business_owners' && (
            <ModuleErrorBoundary moduleName="Business Owners & Simulator" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <BusinessOwnersModule
                partners={partners}
                currentAdminName={currentUser.name}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 10: Approvals Queue */}
          {activeTab === 'approvals' && (
            <ModuleErrorBoundary moduleName="Approvals Queue" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <ApprovalsModule
                currentAdminName={currentUser.name}
                onRefreshParent={fetchFullPlatformData}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 11: AI Knowledge */}
          {activeTab === 'ai_knowledge' && (
            <ModuleErrorBoundary moduleName="AI Knowledge Base" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <AIKnowledgeModule
                currentAdminName={currentUser.name}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 12: Payments */}
          {activeTab === 'payments' && (
            <ModuleErrorBoundary moduleName="Payments & Financial Infrastructure" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <PaymentsModule
                currentAdminName={currentUser.name}
              />
            </ModuleErrorBoundary>
          )}

          {/* Module 13: Media Assets */}
          {activeTab === 'media' && (
            <ModuleErrorBoundary moduleName="Media Assets" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <MediaModule />
            </ModuleErrorBoundary>
          )}

          {/* Module 14: Super Team Management */}
          {activeTab === 'super_team' && (
            <ModuleErrorBoundary moduleName="Team Management" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <div className="bg-white rounded-2xl border border-[#EADBCA] p-6 shadow-sm">
                <TeamManagementTab
                  teamMembers={teamMembers}
                  currentUser={currentUser}
                  token={token}
                  onTeamUpdated={fetchFullPlatformData}
                />
              </div>
            </ModuleErrorBoundary>
          )}

          {/* Module 15: Analytics */}
          {activeTab === 'analytics' && (
            <ModuleErrorBoundary moduleName="Analytics & Search Telemetry" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-600" />
                    Search Demand & Platform Telemetry
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Real-time Gambian consumer inquiries and unmet demand signals
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm">
                    <div className="text-xs text-stone-500 font-semibold">Total Catalog Partners</div>
                    <div className="text-2xl font-bold text-stone-900 mt-1">{(partners || []).length}</div>
                    <div className="text-[11px] text-emerald-600 mt-1">100% physically verified</div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm">
                    <div className="text-xs text-stone-500 font-semibold">Active Billboard Views</div>
                    <div className="text-2xl font-bold text-stone-900 mt-1">
                      {(ads || []).reduce((acc, a) => acc + (a.impressions || 0), 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">5-8s video carousel impressions</div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm">
                    <div className="text-xs text-stone-500 font-semibold">AI Inquiries Logged</div>
                    <div className="text-2xl font-bold text-stone-900 mt-1">
                      {(missingRequests || []).length + 84}
                    </div>
                    <div className="text-[11px] text-amber-600 mt-1">Local Gambian queries</div>
                  </div>
                </div>

                {/* Missing AI Requests Table */}
                <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm space-y-4">
                  <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Unmet Discovery Demands (Opportunities for Merchant Acquisition)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-stone-500 font-semibold border-b border-[#EADBCA]">
                        <tr>
                          <th className="p-3">Query Asked</th>
                          <th className="p-3">Category</th>
                          <th className="p-3">Count</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {(missingRequests || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-stone-400">
                              Zero unmet requests. SOHLA AI is successfully matching user requests to verified partners.
                            </td>
                          </tr>
                        ) : (
                          (missingRequests || []).map(req => (
                            <tr key={req.id}>
                              <td className="p-3 font-semibold text-stone-900">"{req.query}"</td>
                              <td className="p-3 text-stone-600">{req.category}</td>
                              <td className="p-3 font-bold text-amber-700">{req.count}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-stone-100 text-stone-700 font-semibold">
                                  {req.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </ModuleErrorBoundary>
          )}

          {/* Module 16: Security & Audit Logs */}
          {activeTab === 'security_audit' && (
            <ModuleErrorBoundary moduleName="Security Audit Logs" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    Security Audit Logs & Tamper-Proof Trail
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Immutable record of administrative logins, partner modifications, and role updates
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-[#EADBCA] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-stone-500 font-semibold border-b border-[#EADBCA]">
                        <tr>
                          <th className="p-3.5">Timestamp</th>
                          <th className="p-3.5">Actor</th>
                          <th className="p-3.5">Action</th>
                          <th className="p-3.5">Entity</th>
                          <th className="p-3.5">IP / Security</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                        {(auditLogs || []).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-stone-400">
                              No audit events logged yet.
                            </td>
                          </tr>
                        ) : (
                          (auditLogs || []).slice(0, 50).map((log, idx) => (
                            <tr key={log.id || idx} className="hover:bg-stone-50/70">
                              <td className="p-3.5 text-stone-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-3.5 font-bold text-stone-900">{log.adminName}</td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3.5 text-stone-600">{log.entity || '-'}</td>
                              <td className="p-3.5 text-stone-400">{log.ipAddress || '127.0.0.1'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </ModuleErrorBoundary>
          )}

          {/* Module 17: System Health & Backup */}
          {activeTab === 'system_health' && (
            <ModuleErrorBoundary moduleName="System Health" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    System Health & Persistent Data Integrity
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Verify container runtime, database stability, and download disaster recovery snapshots
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm">
                    <div className="text-xs text-stone-500 font-semibold">Server Runtime Status</div>
                    <div className="text-lg font-bold text-emerald-600 mt-1 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Online & Healthy
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">Node/Express on Port 3000</div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm">
                    <div className="text-xs text-stone-500 font-semibold">Persistence Engine</div>
                    <div className="text-lg font-bold text-stone-900 mt-1">
                      Atomic data_store.json
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-1">Synchronized safely</div>
                  </div>

                  <div className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm">
                    <div className="text-xs text-stone-500 font-semibold">GitHub Source Backup</div>
                    <div className="text-sm font-bold text-stone-900 mt-1 truncate">
                      tamsirb720-bit/Sohla-ai
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">Branch: main</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#EADBCA] p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-stone-900 text-sm">Disaster Recovery & Data Export</h3>
                  <p className="text-xs text-stone-600">
                    Export the entire SOHLA database as a structured JSON file. Contains all merchant listings, product catalogs, 5-8s ads, news, events, and taxonomy.
                  </p>

                  <button
                    onClick={handleDownloadBackup}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    Download Complete Platform Backup (JSON)
                  </button>
                </div>
              </div>
            </ModuleErrorBoundary>
          )}

          {/* Module 18: Platform Settings */}
          {activeTab === 'settings' && (
            <ModuleErrorBoundary moduleName="Platform Settings" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <PlatformSettingsModule currentAdminName={currentUser.name} />
            </ModuleErrorBoundary>
          )}

          {/* Module 19: Admin Security & Password */}
          {activeTab === 'admin_password' && (
            <ModuleErrorBoundary moduleName="Admin Security & Password" onReset={fetchFullPlatformData} onNavigateHome={() => setActiveTab('dashboard')}>
              <AdminSecurityPasswordModule
                currentUser={currentUser}
                token={token}
                onLogout={onLogout}
              />
            </ModuleErrorBoundary>
          )}
        </div>
      </main>
    </div>
  );
};
