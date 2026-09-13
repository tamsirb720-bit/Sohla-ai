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
    id: 'ad-default',
    title: 'SOHLA AI — The Gambia’s All-in-One Platform',
    advertiser: 'SOHLA Official',
    description: 'Simplifying everyday life across Banjul, Senegambia, and West Coast.',
    ctaText: 'Explore SOHLA AI',
    ctaLink: '#sohla-ai',
    type: 'video',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-african-woman-smiling-while-using-a-mobile-phone-41804-large.mp4',
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
    <div
      ref={containerRef}
      id="top-video-billboard"
      onClick={handleAdClick}
      className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[380px] rounded-b-3xl sm:rounded-3xl overflow-hidden shadow-2xl bg-slate-950 cursor-pointer group select-none transition-all duration-500 border border-amber-500/20 hover:border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.12)]"
    >
      {/* Background Image / Video Layer */}
      <div className="absolute inset-0 z-0">
        {currentAd.type === 'video' && currentAd.mediaUrl ? (
          <video
            ref={videoRef}
            src={currentAd.mediaUrl}
            poster={currentAd.posterUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80'}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover opacity-90 scale-105 transition-transform duration-700 group-hover:scale-100"
          />
        ) : (
          <img
            src={currentAd.mediaUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80'}
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

      {/* TOP: Multi-Segment Story Progress Bars (Instagram/TikTok style for few-seconds ads) */}
      <div className="relative z-20 px-3 pt-2.5 pb-1 flex items-center space-x-1.5">
        {activeAds.map((ad, idx) => {
          const isPast = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const fillWidth = isPast
            ? '100%'
            : isCurrent
            ? `${Math.min(100, (progressMs / totalDurationMs) * 100)}%`
            : '0%';

          return (
            <div
              key={ad.id || idx}
              className="flex-1 h-1 bg-white/20 hover:bg-white/30 rounded-full overflow-hidden transition-all relative cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
                setProgressMs(0);
              }}
              title={`Switch to: ${ad.title}`}
            >
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-yellow-200 rounded-full transition-[width] duration-100 ease-linear shadow-[0_0_6px_#f59e0b]"
                style={{ width: fillWidth }}
              />
            </div>
          );
        })}
      </div>

      {/* Top Controls Row */}
      <div className="relative z-10 flex items-center justify-between px-3 sm:px-4 py-1.5 text-white">
        {/* Ad Tag & Live Countdown */}
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-amber-400/40 text-amber-300 flex items-center space-x-1.5 shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>{currentAd.badge || `⚡ ${totalDurationSeconds}s Ad`}</span>
            <span className="text-white/80 font-mono text-[9px] pl-1 border-l border-white/20">
              {secondsRemaining}s
            </span>
          </span>

          <span className="text-[11px] font-medium text-slate-200 hidden sm:inline-block drop-shadow">
            {currentAd.advertiser}
          </span>
        </div>

        {/* Action buttons: Auto-Create Ad & Skip */}
        <div className="flex items-center space-x-2">
          {/* Autonomous Ad Synthesis button right on billboard */}
          <button
            onClick={handleAutoCreateAd}
            disabled={isAutoGenerating}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-600/70 hover:bg-purple-600 backdrop-blur-md border border-purple-400/40 text-purple-200 flex items-center space-x-1 active:scale-95 transition"
            title="Platform automatically creates a new 5-second Gambian ad"
          >
            <Wand2 className={`w-3 h-3 text-cyan-300 ${isAutoGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{isAutoGenerating ? 'Creating...' : '✨ Auto-Create Ad'}</span>
          </button>

          <button
            id="btn-skip-ad"
            onClick={handleSkip}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center space-x-1.5 shadow-md active:scale-95 transition"
            title="Next Ad"
          >
            <span>Skip</span>
            <SkipForward className="w-3.5 h-3.5 fill-white" />
          </button>
        </div>
      </div>

      {/* Central Visual Showcase: Gambian Landmark, Mascot, and Alive SOHLA Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 -mt-1 text-center">
        {/* Animated Cute 3D AI Robot Mascot & Flag */}
        <div className="relative flex items-center justify-center mb-1">
          {/* Gambia Flag Chip */}
          <div className="absolute -top-3 right-[-38px] flex items-center space-x-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/20 shadow">
            <span className="text-xs">🇬🇲</span>
            <span className="text-[9px] font-bold text-slate-200 uppercase">Gambia</span>
          </div>

          {/* Robot Mascot with pulsating aura */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onOpenAI?.();
            }}
            className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl animate-subtle-float cursor-pointer hover:scale-105 transition"
            title="Chat with SOHLA AI"
          >
            <div className="w-full h-full rounded-2xl bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Antenna */}
              <div className="w-1 h-2 bg-purple-400 rounded-t-full absolute top-0.5" />
              <div className="w-2 h-2 rounded-full bg-cyan-400 absolute top-0 animate-ping" />

              {/* Face Visor */}
              <div className="w-9 h-6.5 rounded-xl bg-slate-900 border border-cyan-400/50 flex items-center justify-center space-x-2 mt-1.5 shadow-inner">
                {/* Glowing Eyes */}
                <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-pulse" />
              </div>
              <div className="w-3.5 h-1 bg-cyan-400/70 rounded-full mt-1" />
            </div>
          </div>
        </div>

        {/* Living SOHLA Logo */}
        <SohlaLogo size="xl" withTagline={true} withGlow={true} />

        {/* Calligraphy Slogan matching design */}
        <div className="mt-1 flex items-center space-x-1 text-[11px] sm:text-xs font-semibold text-amber-300 italic tracking-wide drop-shadow">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>The Gambia's All-in-One AI Platform</span>
        </div>

        {/* Active Advertisement Title & CTA Button */}
        {currentAd.title && (
          <div className="mt-2 max-w-md flex flex-col items-center">
            <span className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-1 drop-shadow-md">
              {currentAd.description || currentAd.title}
            </span>
            <div className="mt-1.5 flex items-center space-x-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg flex items-center space-x-1 hover:brightness-110 active:scale-95 transition animate-gradient-shift">
                <span>{currentAd.ctaText || 'Learn More'}</span>
                <ExternalLink className="w-3 h-3 text-slate-950" />
              </span>
            </div>
          </div>
        )}
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
            {activeAds.length > 1 && (
              <span className="text-[10px] text-slate-400 font-mono">
                Ad {currentIndex + 1}/{activeAds.length}
              </span>
            )}
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
  );
};
