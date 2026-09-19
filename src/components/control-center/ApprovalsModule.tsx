import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  AlertCircle,
  X,
  MessageSquare
} from 'lucide-react';
import { ApprovalItem } from '../../types';

interface ApprovalsModuleProps {
  currentAdminName?: string;
  onRefreshParent?: () => void;
}

export const ApprovalsModule: React.FC<ApprovalsModuleProps> = ({
  currentAdminName = 'Admin',
  onRefreshParent
}) => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/control-center/approvals');
      const data = await res.json();
      setApprovals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleReview = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      await fetch(`/api/control-center/approvals/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason,
          _adminName: currentAdminName
        })
      });
      setActionMessage(action === 'approve' ? 'Request approved and published live!' : 'Request rejected.');
      setRejectingId(null);
      setRejectReason('');
      setTimeout(() => setActionMessage(null), 3000);
      fetchApprovals();
      onRefreshParent?.();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredApprovals = (approvals || []).filter(item => {
    if (!item) return false;
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

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

      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-600" />
            Approvals & Verification Queue
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Stage changes from merchants: Draft → Submitted → Pending Review → Approved & Published
          </p>
        </div>

        <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'pending'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Pending Review ({approvals.filter(a => a.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'approved'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'rejected'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Rejected
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterStatus === 'all'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            All History
          </button>
        </div>
      </div>

      {/* Approvals Feed */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#EADBCA] p-12 text-center text-stone-400 text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
            <div className="font-semibold text-stone-700">No approval items in this view</div>
            <div className="text-stone-400 mt-1">All merchant proposals and claims are up to date.</div>
          </div>
        ) : (
          filteredApprovals.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#EADBCA] p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : item.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {item.status}
                  </span>
                  <span className="text-xs font-bold text-stone-900">
                    {item.entityType.toUpperCase()}: {item.entityName}
                  </span>
                </div>

                <div className="text-[11px] text-stone-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Submitted {new Date(item.submissionDate).toLocaleString()}</span>
                </div>
              </div>

              {/* Submitter Info & Payload */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 space-y-1">
                  <div className="text-[10px] font-semibold text-stone-400 uppercase">Applicant / Submitter</div>
                  <div className="font-bold text-stone-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-stone-500" />
                    {item.submittedBy}
                  </div>
                  <div className="text-[11px] text-stone-500">Role: {item.submittedRole}</div>
                </div>

                <div className="md:col-span-2 p-3 bg-stone-50 rounded-lg border border-stone-100 space-y-1">
                  <div className="text-[10px] font-semibold text-stone-400 uppercase">Proposed Payload / Edits</div>
                  <pre className="text-[11px] font-mono text-stone-700 bg-white p-2 rounded border border-stone-200 overflow-x-auto max-h-32">
                    {JSON.stringify(item.payload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Action Buttons if Pending */}
              {item.status === 'pending' && (
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setRejectingId(item.id)}
                    className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-xl transition-all"
                  >
                    Reject with Reason
                  </button>
                  <button
                    onClick={() => handleReview(item.id, 'approve')}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Publish Live
                  </button>
                </div>
              )}

              {/* Reviewed Details if Approved or Rejected */}
              {item.status !== 'pending' && (
                <div className="pt-2 text-xs text-stone-500 flex items-center justify-between border-t border-stone-100">
                  <span>Reviewed by: <strong className="text-stone-800">{item.reviewedBy || 'Admin'}</strong></span>
                  {item.rejectionReason && (
                    <span className="text-rose-600">Reason: {item.rejectionReason}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Reject with reason */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#EADBCA] shadow-2xl p-6 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Specify Rejection Reason</h3>
              <button onClick={() => setRejectingId(null)}><X className="w-4 h-4 text-stone-400" /></button>
            </div>
            <div>
              <label className="block font-semibold mb-1">Reason for Rejection *</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g., Opening hours could not be verified by telephone inquiry."
                className="w-full p-2.5 bg-stone-50 border rounded-lg"
              />
            </div>
            <div className="pt-3 border-t flex justify-end gap-2">
              <button onClick={() => setRejectingId(null)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
              <button
                onClick={() => handleReview(rejectingId, 'reject', rejectReason)}
                className="px-4 py-1.5 bg-rose-600 text-white font-semibold rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
