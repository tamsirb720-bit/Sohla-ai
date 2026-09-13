import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  ShieldCheck,
  Receipt,
  MessageCircle,
  Share2,
  Bookmark,
  BookmarkCheck,
  History
} from 'lucide-react';
import { CashPowerTransaction } from '../../types';
import { ShareModal, ShareDataPayload } from '../common/ShareModal';

interface CashPowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTransaction?: (tx: CashPowerTransaction) => void;
}

export const CashPowerModal: React.FC<CashPowerModalProps> = ({ isOpen, onClose, onSaveTransaction }) => {
  const [activeView, setActiveView] = useState<'buy' | 'saved'>('buy');
  const [meterNumber, setMeterNumber] = useState('0714-8892-3310');
  const [phone, setPhone] = useState('+220 788 1234');
  const [amount, setAmount] = useState<number>(200);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CashPowerTransaction | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [sharePayload, setSharePayload] = useState<ShareDataPayload | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Saved receipts list
  const [savedReceipts, setSavedReceipts] = useState<CashPowerTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('sohla_saved_cashpower_receipts');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default saved receipt from previous demo transaction
    return [
      {
        id: 'cpt-1789260162932',
        meterNumber: '0714-8892-3310',
        meterOwner: 'Verified NAWEC Consumer',
        amountDalasi: 300,
        phone: '+220 788 1234',
        tokenGenerated: '5144-9614-4016-9198-3944',
        unitsKWh: 27.3,
        tariffGMDPerKWh: 11,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        isRealGateway: false
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('sohla_saved_cashpower_receipts', JSON.stringify(savedReceipts));
    } catch {}
  }, [savedReceipts]);

  if (!isOpen) return null;

  const quickAmounts = [100, 200, 300, 500, 1000, 2000];

  // Tariff: NAWEC standard domestic ~D11.00 per kWh
  const estimatedUnits = (amount / 11.0).toFixed(1);

  const saveReceipt = (tx: CashPowerTransaction) => {
    setSavedReceipts(prev => {
      const exists = prev.some(item => item.tokenGenerated === tx.tokenGenerated);
      if (exists) return prev;
      return [tx, ...prev];
    });
    setIsSaved(true);
    if (onSaveTransaction) {
      onSaveTransaction(tx);
    }
  };

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meterNumber || amount < 50) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/cashpower/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterNumber,
          phone,
          amountDalasi: amount
        })
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setResult(data.transaction);
        // Automatically save receipt
        saveReceipt(data.transaction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToken = (tok?: string) => {
    const tokenToCopy = tok || result?.tokenGenerated;
    if (!tokenToCopy) return;
    navigator.clipboard?.writeText(tokenToCopy.replace(/-/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formatShareMessage = (tx: CashPowerTransaction) => {
    return `⚡ *NAWEC Cash Power Token Recharge* 🇬🇲\n\n🔢 *Token:* ${tx.tokenGenerated}\n⚡ *Units:* ${tx.unitsKWh} kWh\n💰 *Amount Paid:* D${tx.amountDalasi} GMD\n📟 *Meter Number:* ${tx.meterNumber}\n📱 *Phone:* ${tx.phone}\n📅 *Date:* ${new Date(tx.timestamp).toLocaleString()}\n\nGenerated via *SOHLA AI* — The Gambia's All-in-One Platform`;
  };

  const shareOnWhatsApp = (tx: CashPowerTransaction) => {
    const text = formatShareMessage(tx);
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openMultiPlatformShare = (tx: CashPowerTransaction) => {
    setSharePayload({
      title: `NAWEC Cash Power Token (${tx.unitsKWh} kWh)`,
      subtitle: `Meter: ${tx.meterNumber} • D${tx.amountDalasi} GMD`,
      text: formatShareMessage(tx)
    });
    setIsShareModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div
        id="nawec-cashpower-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-900 to-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Zap className="w-5 h-5 fill-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-black font-display text-white">Buy Cash Power (NAWEC)</h2>
              <p className="text-xs text-teal-200">Instant Prepaid Electricity Recharge</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Toggle: Recharge Meter vs Saved Receipts */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2">
          <button
            onClick={() => setActiveView('buy')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeView === 'buy'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Recharge Meter</span>
          </button>
          <button
            onClick={() => setActiveView('saved')}
            className={`pb-2 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-1.5 ${
              activeView === 'saved'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Saved Receipts & Tokens ({savedReceipts.length})</span>
          </button>
        </div>

        {/* Clear Regulatory & Transparency Notice mandated by Prompt */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start space-x-2 text-[11px] text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Transparent Status: DEMO / TEST SIMULATOR.</strong> Real-world NAWEC integration requires registered commercial utility API keys. Valid demonstration tokens and domestic tariff calculations are shown below.
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeView === 'saved' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Your Saved NAWEC Tokens ({savedReceipts.length})
                </h4>
                <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Ready to Share
                </span>
              </div>

              {savedReceipts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No saved tokens yet</p>
                  <p className="text-[11px] text-slate-500">Recharge a meter to automatically save your receipt here.</p>
                </div>
              ) : (
                savedReceipts.map((tx) => (
                  <div
                    key={tx.id || tx.tokenGenerated}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-xs text-slate-900 font-mono">{tx.meterNumber}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Token Code */}
                    <div className="p-2.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-sm sm:text-base font-black tracking-wider text-center select-all flex items-center justify-between px-3">
                      <span>{tx.tokenGenerated}</span>
                      <button
                        onClick={() => copyToken(tx.tokenGenerated)}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition text-xs"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Amount: <strong className="text-purple-700">D{tx.amountDalasi}</strong></span>
                      <span>Units: <strong className="text-emerald-600">{tx.unitsKWh} kWh</strong></span>
                    </div>

                    {/* Share Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => shareOnWhatsApp(tx)}
                        className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      <button
                        onClick={() => openMultiPlatformShare(tx)}
                        className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Other Platforms</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              <button
                onClick={() => setActiveView('buy')}
                className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition mt-2 cursor-pointer"
              >
                + Recharge Another Meter
              </button>
            </div>
          ) : result ? (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                    Test / Demo Token Generated
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
                    <BookmarkCheck className="w-3 h-3" />
                    <span>Saved to Receipts</span>
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-1 font-display">
                  Recharge Successful!
                </h3>
                <p className="text-xs text-slate-500">
                  Enter this 20-digit token into your NAWEC keypad
                </p>
              </div>

              {/* 20-digit Token Display */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800 shadow-inner">
                <div className="text-[11px] uppercase tracking-widest text-teal-400 font-bold">
                  NAWEC Keypad Token
                </div>
                <div className="font-mono text-xl sm:text-2xl font-black tracking-wider text-amber-300 select-all">
                  {result.tokenGenerated}
                </div>
                <button
                  onClick={() => copyToken()}
                  className="mt-2 py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center justify-center space-x-1.5 mx-auto transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy 20-Digit Code'}</span>
                </button>
              </div>

              {/* Instant Social & WhatsApp Share Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-cashpower-share-wa"
                  onClick={() => shareOnWhatsApp(result)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  id="btn-cashpower-share-multi"
                  onClick={() => openMultiPlatformShare(result)}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Other Platforms</span>
                </button>
              </div>

              {/* Details Breakdown */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Meter Number:</span>
                  <span className="font-bold text-slate-800 font-mono">{result.meterNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-purple-700">D{result.amountDalasi} GMD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Units Credited:</span>
                  <span className="font-bold text-emerald-600">{result.unitsKWh} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tariff Rate:</span>
                  <span className="text-slate-600">D{result.tariffGMDPerKWh}/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confirmation SMS:</span>
                  <span className="font-medium text-slate-800">{result.phone}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Buy Another Token
                </button>
                <button
                  onClick={() => setActiveView('saved')}
                  className="py-2.5 px-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View All Saved</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NAWEC Meter Number (11 Digits)
                </label>
                <input
                  type="text"
                  required
                  value={meterNumber}
                  onChange={(e) => setMeterNumber(e.target.value)}
                  placeholder="e.g. 0714-8892-3310"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notification Phone Number (For Token SMS)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+220 700 0000"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Amount in Gambian Dalasi (GMD)
                  </label>
                  <span className="text-xs font-bold text-teal-700">
                    ≈ {estimatedUnits} kWh Units
                  </span>
                </div>
                <input
                  type="number"
                  min="50"
                  max="10000"
                  step="10"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />

                {/* Quick Amount Pills */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        amount === amt
                          ? 'bg-teal-700 text-white shadow'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      D{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border-2 border-teal-600 bg-teal-50/50 p-2 rounded-xl text-center cursor-pointer">
                    <span className="text-xs font-bold text-teal-900 block">Wave</span>
                    <span className="text-[10px] text-teal-700">Zero Fee</span>
                  </div>
                  <div className="border border-slate-200 hover:border-slate-300 p-2 rounded-xl text-center cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 block">QMoney</span>
                    <span className="text-[10px] text-slate-500">Instant</span>
                  </div>
                  <div className="border border-slate-200 hover:border-slate-300 p-2 rounded-xl text-center cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 block">Bank / Visa</span>
                    <span className="text-[10px] text-slate-500">Secure</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white font-extrabold text-sm shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Connecting to NAWEC Gateway...' : `Generate NAWEC Token for D${amount}`}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Multi-Platform Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={sharePayload}
      />
    </div>
  );
};
