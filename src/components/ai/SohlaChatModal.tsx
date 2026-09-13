import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Phone,
  MessageCircle,
  ExternalLink,
  MapPin,
  Clock,
  Truck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { BusinessPartner } from '../../types';
import { SohlaLogo } from '../common/SohlaLogo';
import { ShareModal, ShareDataPayload } from '../common/ShareModal';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  partners?: BusinessPartner[];
  timestamp: string;
  isMissingItem?: boolean;
}

interface SohlaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onSelectPartner?: (partner: BusinessPartner) => void;
}

export const SohlaChatModal: React.FC<SohlaChatModalProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  onSelectPartner
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: 'Salaam Alaikum! I am SOHLA AI — your everyday Gambian intelligent assistant. Ask me about verified local restaurants, taxis, electronics, beauty salons, or how to buy instant NAWEC Cash Power!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharePayload, setSharePayload] = useState<ShareDataPayload | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareMessageWhatsApp = (text: string) => {
    const fullText = `💬 *SOHLA AI Gambian Recommendation*\n\n${text}\n\nDiscovered via *SOHLA AI*`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`, '_blank', 'noopener,noreferrer');
  };

  const openMessageShare = (title: string, text: string) => {
    setSharePayload({
      title,
      subtitle: 'SOHLA AI Gambian Assistant',
      text
    });
    setIsShareModalOpen(true);
  };

  // Auto-send initial prompt if provided
  useEffect(() => {
    if (isOpen && initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply || "I couldn't retrieve that information right now. Please try again.",
        partners: data.relevantPartners || [],
        isMissingItem: data.isMissingItem,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now() + 2}`,
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please check your network and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Where can I eat Fish Benachin in Senegambia?',
    'I need an airport taxi transfer to Senegambia',
    'How do I buy NAWEC Cash Power?',
    'I need a birthday cake in Senegambia',
    'Best smartphone prices in Kairaba Avenue'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        id="sohla-ai-chat-sheet"
        className="relative w-full sm:max-w-xl h-[88vh] sm:h-[680px] bg-slate-50 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-6 duration-300"
      >
        {/* Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            {/* Mascot Avatar */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-500 p-0.5 shadow-md">
              <div className="w-full h-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center relative">
                <div className="w-7 h-5 rounded-lg bg-slate-900 border border-cyan-400 flex items-center justify-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8] animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8] animate-pulse" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-wide font-display text-white">SOHLA AI</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase tracking-widest">
                  Verified Data
                </span>
              </div>
              <p className="text-[11px] text-purple-200 font-medium">
                The Gambia's Zero-Hallucination AI Brain
              </p>
            </div>
          </div>

          <button
            id="btn-close-ai-chat"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed text-sm font-medium">
                  {m.content}
                </div>

                {/* Missing request alert badge */}
                {m.isMissingItem && (
                  <div className="mt-2 pt-2 border-t border-amber-200 flex items-start space-x-2 text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>SOHLA Telemetry:</strong> Logged to Admin "AI Improvement Center" for verified merchant onboarding.
                    </span>
                  </div>
                )}
              </div>

              {/* Rich Verified Partner Cards attached to response */}
              {m.partners && m.partners.length > 0 && (
                <div className="w-full max-w-[90%] mt-2.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Partner Matches from SOHLA Database:</span>
                  </div>

                  {m.partners.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={p.logo || p.coverImage}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                          />
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>{p.location}</span>
                              <span>•</span>
                              <span>{p.rating}★ ({p.reviewCount} reviews)</span>
                            </p>
                          </div>
                        </div>

                        {onSelectPartner && (
                          <button
                            onClick={() => onSelectPartner(p)}
                            className="text-xs font-bold text-purple-600 hover:text-purple-800 p-1"
                            title="View Business Details"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Products preview */}
                      {p.products && p.products.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                          {p.products.slice(0, 3).map((prod) => (
                            <span
                              key={prod.id}
                              className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100"
                            >
                              {prod.name}: <strong>D{prod.price}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Contact & WhatsApp Action Bar */}
                      <div className="mt-2.5 flex items-center space-x-2">
                        <a
                          href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(p.name)},%20I%20found%20you%20on%20SOHLA%20AI!`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1 transition border border-slate-200"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-600" />
                          <span>Call</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Message metadata & share bar */}
              <div className="flex items-center justify-between mt-1 px-1">
                <span className="text-[10px] text-slate-400 font-mono">{m.timestamp}</span>

                {m.role === 'assistant' && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => copyMessage(m.id, m.content)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => shareMessageWhatsApp(m.content)}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition"
                      title="Share on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openMessageShare('SOHLA AI Recommendation', m.content)}
                      className="p-1 rounded text-slate-400 hover:text-purple-600 hover:bg-slate-100 transition"
                      title="Share to other platforms"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-slate-500 bg-white border border-slate-200 px-3 py-2 rounded-2xl w-max shadow-sm animate-pulse">
              <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
              <span className="text-xs font-medium">SOHLA AI is searching verified Gambian database...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick sample question chips */}
        <div className="px-4 py-1.5 bg-slate-100 border-t border-slate-200 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white text-slate-700 border border-slate-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 whitespace-nowrap transition cursor-pointer shrink-0"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
        >
          <input
            id="input-ai-message"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask SOHLA AI anything in The Gambia..."
            disabled={isLoading}
            className="flex-1 h-11 px-4 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
          />
          <button
            id="btn-send-ai-message"
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow hover:opacity-90 active:scale-95 transition disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
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
