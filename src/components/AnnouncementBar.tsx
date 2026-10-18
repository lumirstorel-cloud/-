import React, { useState, useEffect } from 'react';
import { AnnouncementBarSettings, PageView } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Volume2,
  Pause,
  Play
} from 'lucide-react';

interface AnnouncementBarProps {
  settings: AnnouncementBarSettings;
  navigate: (view: PageView) => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  settings,
  navigate
}) => {
  const activeMessages = (settings.messages || []).filter((m) => m.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Calculate speed duration
  const getDurationSeconds = () => {
    const count = activeMessages.length || 1;
    if (settings.speed === 'fast') {
      return Math.max(14, count * 6);
    }
    if (settings.speed === 'slow') {
      return Math.max(35, count * 15);
    }
    if (settings.intervalSeconds && settings.intervalSeconds > 0) {
      return Math.max(20, count * settings.intervalSeconds * 3);
    }
    return Math.max(24, count * 8);
  };

  // Repeated messages with evenFactor for seamless infinite -50% marquee loop
  const repeatedMessages = React.useMemo(() => {
    if (activeMessages.length === 0) return [];
    const minItemsNeeded = 8;
    const rawFactor = Math.ceil(minItemsNeeded / activeMessages.length);
    const evenFactor = Math.max(2, rawFactor % 2 === 0 ? rawFactor : rawFactor + 1);
    const result: typeof activeMessages = [];
    for (let i = 0; i < evenFactor; i++) {
      result.push(...activeMessages);
    }
    return result;
  }, [activeMessages]);

  if (!settings.isEnabled || activeMessages.length === 0 || isDismissed) {
    return null;
  }

  const handleLinkClick = (target?: string) => {
    if (!target) return;
    if (target === 'whatsapp') {
      window.open('https://wa.me/966579105700', '_blank', 'noopener,noreferrer');
    } else {
      navigate(target as PageView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) =>
        prev === 0 ? activeMessages.length - 1 : prev - 1
      );
      setIsFading(false);
    }, 200);
  };

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeMessages.length);
      setIsFading(false);
    }, 200);
  };

  // If isTicker is true (or undefined, as requested to be animated marquee):
  const isContinuousTicker = settings.isTicker !== false;

  return (
    <aside
      aria-label="شريط الإعلانات والعروض المتحرك"
      style={{
        backgroundColor: settings.bgColor || '#2C1E18',
        color: settings.textColor || '#FAF6F0'
      }}
      className="relative z-50 text-xs py-2 px-3 sm:px-4 border-b border-black/15 select-none transition-colors overflow-hidden"
      onMouseEnter={() => (settings.pauseOnHover !== false ? setIsPaused(true) : null)}
      onMouseLeave={() => (settings.pauseOnHover !== false ? setIsPaused(false) : null)}
      onTouchStart={() => (settings.pauseOnHover !== false ? setIsPaused(true) : null)}
      onTouchEnd={() => (settings.pauseOnHover !== false ? setIsPaused(false) : null)}
      dir="rtl"
    >
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
        {/* Left Side Tag */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 text-[#C8A96E] text-[10px] font-bold shrink-0 border border-[#C8A96E]/20">
          <Sparkles className="w-3 h-3 text-[#C8A96E] animate-pulse" />
          <span>شريط لومير</span>
        </div>

        {/* ================= MODE 1: CONTINUOUS MARQUEE TICKER ================= */}
        {isContinuousTicker ? (
          <div className="flex-1 overflow-hidden relative flex items-center min-h-[24px]">
            {/* Fade Edges for Luxury Polish */}
            <div
              className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
              style={{
                background: `linear-gradient(to left, ${settings.bgColor || '#2C1E18'}, transparent)`
              }}
            />
            <div
              className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
              style={{
                background: `linear-gradient(to right, ${settings.bgColor || '#2C1E18'}, transparent)`
              }}
            />

            {/* Continuous Marquee Track */}
            <div className="w-full overflow-hidden flex items-center" dir="ltr">
              <div
                className={`animate-marquee-continuous flex items-center gap-8 ${
                  isPaused ? 'paused' : ''
                }`}
                style={
                  {
                    '--marquee-duration': `${getDurationSeconds()}s`
                  } as React.CSSProperties
                }
              >
                {repeatedMessages.map((msg, idx) => (
                  <div
                    key={`${msg.id}-${idx}`}
                    dir="rtl"
                    className="inline-flex items-center gap-2 sm:gap-3 whitespace-nowrap px-3"
                  >
                  {msg.badge && (
                    <span
                      style={{
                        backgroundColor: settings.accentColor || '#C8A96E',
                        color: '#2C1E18'
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 shadow-xs inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{msg.badge}</span>
                    </span>
                  )}

                  <span className="font-medium text-[11px] sm:text-xs">
                    {msg.text}
                  </span>

                  {msg.linkText && msg.linkTarget && (
                    <button
                      type="button"
                      onClick={() => handleLinkClick(msg.linkTarget)}
                      style={{ color: settings.accentColor || '#C8A96E' }}
                      className="underline underline-offset-2 hover:opacity-85 font-bold cursor-pointer text-[11px] shrink-0 transition-opacity"
                    >
                      {msg.linkText} ←
                    </button>
                  )}

                  <span
                    aria-hidden="true"
                    style={{ color: settings.accentColor || '#C8A96E' }}
                    className="opacity-40 text-xs select-none pr-3"
                  >
                    ✦
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
          /* ================= MODE 2: CAROUSEL SLIDER ================= */
          <div className="flex-1 flex items-center justify-center text-center overflow-hidden min-h-[24px]">
            {/* Prev Button */}
            {activeMessages.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="الرسالة السابقة"
                className="p-1 rounded-md hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0 ml-2"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Current Message */}
            <div
              className={`flex items-center justify-center gap-2 sm:gap-2.5 transition-all duration-300 transform ${
                isFading
                  ? 'opacity-0 scale-95 -translate-y-1'
                  : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              {activeMessages[currentIndex]?.badge && (
                <span
                  style={{
                    backgroundColor: settings.accentColor || '#C8A96E',
                    color: '#2C1E18'
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0 shadow-xs inline-flex items-center gap-1"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{activeMessages[currentIndex].badge}</span>
                </span>
              )}

              <span className="font-medium text-[11px] sm:text-xs leading-normal">
                {activeMessages[currentIndex]?.text}
              </span>

              {activeMessages[currentIndex]?.linkText &&
                activeMessages[currentIndex]?.linkTarget && (
                  <button
                    type="button"
                    onClick={() =>
                      handleLinkClick(activeMessages[currentIndex].linkTarget)
                    }
                    style={{ color: settings.accentColor || '#C8A96E' }}
                    className="underline underline-offset-2 hover:opacity-85 font-bold cursor-pointer text-[11px] shrink-0 transition-opacity"
                  >
                    {activeMessages[currentIndex].linkText} ←
                  </button>
                )}
            </div>

            {/* Next Button */}
            {activeMessages.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="الرسالة التالية"
                className="p-1 rounded-md hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0 mr-2"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Action Controls: Pause Indicator & Dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Pause / Play button indicator for accessibility */}
          {isContinuousTicker && (
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              aria-label={isPaused ? 'تشغيل الحركة' : 'إيقاف الحركة مؤقتاً'}
              className="p-1 rounded-md hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity text-white/80 cursor-pointer"
              title={isPaused ? 'استئناف الحركة' : 'إيقاف مؤقت'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>
          )}

          {/* Dismiss button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="إغلاق الشريط الإعلاني"
            className="p-1 rounded-md hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity text-white/80 cursor-pointer"
            title="إخفاء الإعلان"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
