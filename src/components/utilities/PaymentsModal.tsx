import React, { useState } from 'react';
import { X, CreditCard, Send, ArrowDownLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentsModal: React.FC<PaymentsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [recipientPhone, setRecipientPhone] = useState('+220 788 1234');
  const [amount, setAmount] = useState(500);
  const [provider, setProvider] = useState<'Wave' | 'QMoney' | 'Afrimoney'>('Wave');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div
        id="payments-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 to-sky-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <CreditCard className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white">SOHLA Payments</h2>
              <p className="text-xs text-blue-200">Send • Receive • Pay Bills in Dalasi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Regulatory transparency notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start space-x-2 text-[11px] text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Transparent Status: DEMO / INFORMATIONAL.</strong> Integrates with Gambian mobile money providers (Wave, QMoney, Afrimoney). Real money moves only when linked via Central Bank licensed merchant credentials.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('send');
              setSuccess(false);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'send'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Money</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('receive');
              setSuccess(false);
            }}
            className={`flex-1 py-3 text-center border-b-2 transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'receive'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Receive / QR Code</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {success ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-900 text-lg font-display">Test Transfer Processed</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Simulated dispatch of <strong>D{amount} GMD</strong> via {provider} to {recipientPhone}.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-3 px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Send Another Transfer
              </button>
            </div>
          ) : activeTab === 'send' ? (
            <form onSubmit={handleSend} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Choose Mobile Money Provider
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Wave', 'QMoney', 'Afrimoney'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`py-2 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                        provider === p
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Recipient Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+220 700 0000"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount in Dalasi (GMD)
                </label>
                <input
                  type="number"
                  min="20"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 text-white font-extrabold text-sm shadow transition hover:opacity-90 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Processing...' : `Send D${amount} via ${provider}`}
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3">
              <div className="p-4 bg-slate-100 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center border border-slate-200 shadow-inner">
                {/* Simulated QR Code */}
                <div className="w-36 h-36 border-4 border-slate-800 p-2 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-slate-900" />
                    <div className="w-8 h-8 bg-slate-900" />
                  </div>
                  <div className="text-center text-[9px] font-bold text-slate-700">
                    SOHLA-QR: +220-788-1234
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-slate-900" />
                    <div className="w-8 h-8 bg-slate-900" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-800">Your Gambian QR Code</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scan to receive payments directly to your Wave / QMoney account.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
