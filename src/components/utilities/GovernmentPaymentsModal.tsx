import React, { useState } from 'react';
import { X, Landmark, CheckCircle2, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { GovernmentPaymentTransaction } from '../../types';

interface GovernmentPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GovernmentPaymentsModal: React.FC<GovernmentPaymentsModalProps> = ({
  isOpen,
  onClose
}) => {
  const [serviceType, setServiceType] = useState('Gambia Revenue Authority (GRA) - Income Tax');
  const [tin, setTin] = useState('TIN-2026-99120');
  const [name, setName] = useState('Fatoumatta Jallow');
  const [amount, setAmount] = useState(1500);
  const [phone, setPhone] = useState('+220 788 1234');
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<GovernmentPaymentTransaction | null>(null);

  if (!isOpen) return null;

  const services = [
    'Gambia Revenue Authority (GRA) - Income Tax',
    'GRA - Value Added Tax (VAT)',
    'Registrar General - Business Name Renewal',
    'Kanifing Municipal Council (KMC) - Trade Licence',
    'Banjul City Council (BCC) - Rates & Assessment',
    'Brikama Area Council (BAC) - Property Valuation'
  ];

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/gov/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          tinOrReference: tin,
          taxpayerName: name,
          amountDalasi: amount,
          phone
        })
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setReceipt(data.transaction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div
        id="gov-payments-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Landmark className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white">Government Payments</h2>
              <p className="text-xs text-purple-200">Official Taxes, Fees & Registrations</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start space-x-2 text-[11px] text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Transparent Status: DEMO / INFORMATIONAL MODE.</strong> Connects to GRA and municipal rate gateways. In this release, mock certificates & verified TIN confirmation vouchers are demonstrated.
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {receipt ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                  Test / Demo Receipt Generated
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1 font-display">
                  Official Receipt Issued
                </h3>
                <p className="text-xs text-slate-500">
                  Reference: <strong>{receipt.receiptNumber}</strong>
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Government Agency:</span>
                  <span className="font-bold text-slate-900">{receipt.serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TIN / Assessment Ref:</span>
                  <span className="font-mono font-bold text-purple-800">{receipt.tinOrReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxpayer Name:</span>
                  <span className="font-bold text-slate-800">{receipt.taxpayerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-black text-emerald-600 text-sm">D{receipt.amountDalasi} GMD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Timestamp:</span>
                  <span className="font-medium text-slate-600">{new Date(receipt.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => setReceipt(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
              >
                Make Another Payment
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Agency / Service
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {services.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tax Identification Number (TIN) or Municipal Assessment ID
                </label>
                <input
                  type="text"
                  required
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Taxpayer / Entity Registered Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (Dalasi)
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Receipt SMS Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Validating Tax Record...' : `Submit Payment for D${amount} GMD`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
