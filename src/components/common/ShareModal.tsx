import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Mail,
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export interface ShareDataPayload {
  title: string;
  subtitle?: string;
  text: string;
  url?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: ShareDataPayload | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  shareData
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !shareData) return null;

  const currentUrl = shareData.url || (typeof window !== 'undefined' ? window.location.href : 'https://ais-pre-nix543m54yoyz6bcrozhbl-123613482809.europe-west2.run.app');
  
  // Clean, unified share string
  const fullShareText = `${shareData.text}\n\n${currentUrl}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(fullShareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // WhatsApp
  const shareWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Telegram
  const shareTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(shareData.text)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  // Facebook
  const shareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareData.text)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  // Twitter / X
  const shareTwitter = () => {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  // SMS (for mobile users in Gambia)
  const shareSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(fullShareText)}`;
    window.open(smsUrl, '_blank');
  };

  // Email
  const shareEmail = () => {
    const mailUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(fullShareText)}`;
    window.location.href = mailUrl;
  };

  // Web Share API (native sheet on iOS / Android)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: currentUrl
        });
      } catch (err) {
        // User dismissed or aborted share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        id="sohla-share-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base font-display text-white">
                Share on WhatsApp & Platforms
              </h3>
              <p className="text-xs text-purple-200">
                {shareData.subtitle || 'Share instantly with family, friends & contacts'}
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

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Item Title & Preview Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                Content to Share
              </span>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="text-xs font-bold text-slate-700 hover:text-purple-700 flex items-center space-x-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Device Share</span>
                </button>
              )}
            </div>
            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-1">{shareData.title}</h4>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line max-h-32 overflow-y-auto font-mono text-[11px] leading-relaxed select-all">
              {fullShareText}
            </div>
          </div>

          {/* Direct WhatsApp Share (High Priority - Primary CTA in Gambia) */}
          <button
            id="btn-share-whatsapp"
            onClick={shareWhatsApp}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2.5 cursor-pointer active:scale-[0.98]"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Share Directly on WhatsApp</span>
          </button>

          {/* Other Platform Grid */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Share to other platforms
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Telegram */}
              <button
                onClick={shareTelegram}
                className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 hover:bg-sky-100 text-sky-700 flex flex-col items-center justify-center space-y-1 transition cursor-pointer"
              >
                <Send className="w-5 h-5 text-sky-600" />
                <span className="text-[10px] font-bold">Telegram</span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareFacebook}
                className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center space-y-1 transition cursor-pointer"
              >
                <div className="w-5 h-5 font-black text-sm flex items-center justify-center text-blue-700">f</div>
                <span className="text-[10px] font-bold">Facebook</span>
              </button>

              {/* X / Twitter */}
              <button
                onClick={shareTwitter}
                className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-900 flex flex-col items-center justify-center space-y-1 transition cursor-pointer"
              >
                <div className="w-5 h-5 font-black text-sm flex items-center justify-center text-slate-900">𝕏</div>
                <span className="text-[10px] font-bold">X (Twitter)</span>
              </button>

              {/* SMS */}
              <button
                onClick={shareSMS}
                className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 flex flex-col items-center justify-center space-y-1 transition cursor-pointer"
              >
                <Smartphone className="w-5 h-5 text-indigo-600" />
                <span className="text-[10px] font-bold">SMS</span>
              </button>
            </div>
          </div>

          {/* Additional Actions: Email & Copy Text */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={shareEmail}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer"
            >
              <Mail className="w-4 h-4 text-slate-600" />
              <span>Email</span>
            </button>

            <button
              id="btn-copy-share-text"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>🇬🇲 SOHLA AI • The Gambia</span>
          <span className="font-semibold text-purple-700">Verified Platform</span>
        </div>
      </div>
    </div>
  );
};
