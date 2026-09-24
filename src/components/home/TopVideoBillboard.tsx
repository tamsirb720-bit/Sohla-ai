import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2,
  SkipForward,
  SkipBack,
  Sparkles,
  ExternalLink,
  Wand2,
  Zap
} from 'lucide-react';
import { Advertisement } from '../../types';
import { SohlaLogo } from '../common/SohlaLogo';

interface TopVideoBillboardProps {
  ads: Advertisement[];
  onSelectAdCta?: (ad: Advertisement) => void;
  onOpenAI?: () => void;
}

export const TopVideoBillboard: React.FC<TopVideoBillboardProps> = ({
  ads,
  onSelectAdCta,
  onOpenAI
}) => {
  const [localAds, setLocalAds] = useState<Advertisement[]>(ads);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progressMs, setProgressMs] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Synchronize local ads when props change
  useEffect(() => {
    if (ads && ads.length > 0) {
      setLocalAds(ads);
    }
  }, [ads]);

  const activeAds = localAds.filter((a) => a.active);
  const currentAd: Advertisement = activeAds[currentIndex] || {
    id: 'ad-3',
    title: 'Senegambia Beach Terrace — Atlantic Sunset Grills',
    advertiser: 'Senegambia Beach Terrace',
    description: 'Taste authentic Atlantic King Prawns and traditional Benachin by the ocean tonight.',
    ctaText: 'View Restaurant Menu',
    ctaLink: '#partner-bp-1',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
    durationSeconds: 6,
    active: true,
    priority: 1,
    startDate: '',
    endDate: '',
    impressions: 1200,
    clicks: 340,
    badge: '⚡ 6s Quick Ad'
  };

  // Few seconds duration: default to 5-8 seconds
  const totalDurationSeconds = Math.min(Math.max(currentAd.durationSeconds || 6, 3), 15);
  const totalDurationMs = totalDurationSeconds * 1000;

  // Track ad impression
  useEffect(() => {
    if (currentAd && currentAd.id && !currentAd.id.startsWith('ad-default')) {
      fetch(`/api/ads/${currentAd.id}/impression`, { method: 'POST' }).catch(() => {});
    }
  }, [currentIndex, currentAd?.id]);

  // High-smoothness 100ms progress ticker for the "few seconds" ad experience
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgressMs((prev) => {
        if (prev + 100 >= totalDurationMs) {
          // Advance to next ad
          handleNextAd();
          return 0;
        }
        return prev + 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, totalDurationMs, activeAds.length]);

  const handleNextAd = () => {
    if (activeAds.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
      setProgressMs(0);
    } else {
      setProgressMs(0);
    }
  };

  const handlePrevAd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (activeAds.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
      setProgressMs(0);
    } else {
      setProgressMs(0);
    }
  };

  // Platform autonomous ad generation (can be triggered by user or auto-called)
  const handleAutoCreateAd = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isAutoGenerating) return;

    setIsAutoGenerating(true);
    try {
      const res = await fetch('/api/ads/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _adminName: 'SOHLA Public AI' })
      });
      const data = await res.json();
      if (data.success && data.ad) {
        setLocalAds((prev) => [data.ad, ...prev]);
        setCurrentIndex(0);
        setProgressMs(0);
      }
    } catch (err) {
      console.error('Failed to auto-synthesize ad:', err);
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleNextAd();
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleAdClick = () => {
    if (currentAd.id && !currentAd.id.startsWith('ad-default')) {
      fetch(`/api/ads/${currentAd.id}/click`, { method: 'POST' }).catch(() => {});
    }
    if (onSelectAdCta) {
      onSelectAdCta(currentAd);
    }
  };

  const secondsRemaining = Math.max(0, Math.ceil((totalDurationMs - progressMs) / 1000));

  return (
    <div className="w-full px-3.5 pt-2 pb-1">
      <div
        ref={containerRef}
        id="top-video-billboard"
        onClick={handleAdClick}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[380px] rounded-[24px] overflow-hidden shadow-2xl bg-slate-950 cursor-pointer group select-none transition-all duration-500 border border-amber-500/20 hover:border-amber-400/50 shadow-[0_4px_25px_rgba(0,0,0,0.35)]"
      >
      {/* Background Image / Video Layer */}
      <div className="absolute inset-0 z-0">
        {currentAd.type === 'video' && currentAd.mediaUrl ? (
          <video
            ref={videoRef}
            src={currentAd.mediaUrl}
            poster={currentAd.posterUrl || 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80'}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover opacity-90 scale-105 transition-transform duration-700 group-hover:scale-100"
          />
        ) : (
          <img
            src={currentAd.mediaUrl || 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80'}
            alt={currentAd.title}
            className="w-full h-full object-cover opacity-90 scale-105 transition-transform duration-700 group-hover:scale-100"
          />
        )}

        {/* Cinematic Vignette & Color Grading Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/30 to-slate-950/70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-950/40 via-transparent to-amber-950/30 pointer-events-none" />

        {/* Ambient Radial Energy Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-purple-500/10 to-amber-500/10 blur-3xl pointer-events-none animate-pulse" />
      </div>

      {/* Top Controls Row matching reference */}
      <div className="relative z-10 flex items-center justify-between px-3.5 sm:px-4 pt-3 pb-2 text-white">
        {/* Left: ⚡ 68 AD | 35 Pill */}
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 flex items-center space-x-1.5 shadow-md">
            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>68 AD</span>
            <span className="text-white/40">|</span>
            <span className="text-white font-bold">35</span>
          </span>
        </div>

        {/* Center: GAMBIA Robot Head Avatar */}
        <div className="flex flex-col items-center -mt-1">
          <span className="text-[8.5px] font-black tracking-widest text-white uppercase drop-shadow mb-0.5">
            GAMBIA
          </span>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenAI?.();
            }}
            className="relative w-9 h-8 rounded-xl bg-gradient-to-b from-[#1E1B4B] to-[#0F172A] border-2 border-indigo-400/90 shadow-[0_0_14px_rgba(99,102,241,0.7)] flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition select-none"
            title="SOHLA AI Brain"
          >
            {/* Cute antenna */}
            <div className="absolute -top-1.5 w-1 h-1.5 bg-indigo-300 rounded-t-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 -top-1 absolute rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
            </div>
            {/* Robot Visor Eyes */}
            <div className="flex items-center space-x-1 px-1 py-0.5 bg-black/70 rounded-md border border-cyan-400/50">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8] animate-pulse" />
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right: Purple button & Skip button */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleAutoCreateAd}
            disabled={isAutoGenerating}
            className="px-2.5 py-1 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] border border-purple-300/40 text-white flex items-center justify-center shadow-md active:scale-95 transition cursor-pointer"
            title="Auto-Create New Gambian Ad"
          >
            <Wand2 className={`w-3.5 h-3.5 text-white ${isAutoGenerating ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="btn-skip-ad"
            onClick={handleSkip}
            className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 hover:bg-black/90 border border-white/25 text-white flex items-center space-x-1 shadow-md active:scale-95 transition cursor-pointer"
            title="Next Ad"
          >
            <span>Skip</span>
            <SkipForward className="w-3 h-3 fill-white" />
          </button>
        </div>
      </div>

      {/* Central Visual Showcase: Alive SOHLA Logo & CTA Button */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-1 pb-3 text-center">
        {/* Living SOHLA Logo with Sun & River Ocean Wave */}
        <SohlaLogo size="xl" withTagline={true} withGlow={true} />

        {/* Calligraphy Slogan matching reference design */}
        <div className="mt-1.5 flex items-center justify-center text-[11px] sm:text-xs font-semibold text-amber-100 tracking-wide drop-shadow max-w-xs sm:max-w-md">
          <span>Explore, Shop, Book, and Support Local Businesses in The Gambia.</span>
        </div>

        {/* Active Advertisement Title & CTA Button */}
        <div className="mt-2.5 max-w-md flex flex-col items-center">
          <button
            onClick={handleAdClick}
            className="px-6 py-2 rounded-full text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 text-slate-950 shadow-[0_4px_16px_rgba(245,158,11,0.4)] flex items-center space-x-1.5 hover:brightness-110 active:scale-95 transition font-display cursor-pointer"
          >
            <span>{currentAd.ctaText || 'View Restaurant Menu'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Bottom Media Bar Overlay */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-3 py-2 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col space-y-1.5">
        {/* Controls row */}
        <div className="flex items-center justify-between text-white text-[11px] sm:text-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevAd}
              className="p-1 text-slate-300 hover:text-white transition"
              title="Previous Ad"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-ad-play-pause"
              onClick={togglePlayPause}
              className="p-1 hover:text-amber-400 transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              )}
            </button>

            <button
              id="btn-ad-mute"
              onClick={toggleMute}
              className="p-1 hover:text-amber-400 transition"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-300" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            <span className="font-mono text-slate-300 text-[10px] sm:text-xs">
              ⚡ {secondsRemaining}s left
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-300 font-mono font-medium">
              Ad {activeAds.length > 0 ? currentIndex + 1 : 5}/{activeAds.length || 5}
            </span>
            <button
              id="btn-ad-fullscreen"
              onClick={toggleFullscreen}
              className="p-1 hover:text-amber-400 transition"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
