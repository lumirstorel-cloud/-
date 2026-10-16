import React, { useState, useEffect } from 'react';
import { AnnouncementBarSettings, PageView } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  X,
  Tag,
  Clock,
  MapPin
} from 'lucide-react';

interface AnnouncementBarProps {
  settings: AnnouncementBarSettings;
  navigate: (view: PageView) => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  settings,
  navigate
}) => {
  const activeMessages = settings.messages.filter((m) => m.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Auto-play timer for smooth rotation
  useEffect(() => {
    if (!settings.isEnabled || activeMessages.length <= 1 || isPaused || isDismissed) {
      return;
    }

    const intervalTime = (settings.intervalSeconds || 3.5) * 1000;
    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activeMessages.length);
        setIsFading(false);
      }, 250);
    }, intervalTime);

    return () => clearInterval(timer);
  }, [settings.isEnabled, settings.intervalSeconds, activeMessages.length, isPaused, isDismissed]);

  if (!settings.isEnabled || activeMessages.length === 0 || isDismissed) {
    return null;
  }

  const currentMsg = activeMessages[currentIndex];

  const handleLinkClick = (target?: string) => {
    if (!target) return;
    if (target === 'whatsapp') {
      window.open('https://wa.me/966579105700', '_blank');
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

  return (
    <aside
      aria-label="شريط العروض والتنبيهات"
      style={{
        backgroundColor: settings.bgColor || '#2C1E18',
        color: settings.textColor || '#FAF6F0'
      }}
      className="relative z-50 text-xs py-2 px-3 sm:px-6 border-b border-black/10 select-none transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      dir="rtl"
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-3">
        {/* Navigation arrow right (prev in RTL) */}
        {activeMessages.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            aria-label="الرسالة السابقة"
            className="p-1 rounded-md hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Dynamic message container with smooth transition */}
        <div className="flex-1 flex items-center justify-center text-center overflow-hidden min-h-[24px]">
          <div
            className={`flex items-center justify-center gap-2 sm:gap-2.5 transition-all duration-300 transform ${
              isFading
                ? 'opacity-0 scale-95 -translate-y-1'
                : 'opacity-100 scale-100 translate-y-0'
            }`}
          >
            {currentMsg.badge && (
              <span
                style={{
                  backgroundColor: settings.accentColor || '#C8A96E',
                  color: '#2C1E18'
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide shrink-0 shadow-xs inline-flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>{currentMsg.badge}</span>
              </span>
            )}

            <span className="font-medium text-[11px] sm:text-xs leading-normal">
              {currentMsg.text}
            </span>

            {currentMsg.linkText && currentMsg.linkTarget && (
              <button
                type="button"
                onClick={() => handleLinkClick(currentMsg.linkTarget)}
                style={{ color: settings.accentColor || '#C8A96E' }}
                className="underline underline-offset-2 hover:opacity-85 font-bold cursor-pointer text-[11px] shrink-0 transition-opacity"
              >
                {currentMsg.linkText} ←
              </button>
            )}
          </div>
        </div>

        {/* Indicators and next button */}
        <div className="flex items-center gap-2 shrink-0">
          {activeMessages.length > 1 && (
            <>
              {/* Dots */}
              <div className="hidden md:flex items-center gap-1">
                {activeMessages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`الانتقال إلى الإعلان ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentIndex
                        ? 'w-4 bg-[#C8A96E]'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              {/* Next arrow */}
              <button
                type="button"
                onClick={handleNext}
                aria-label="الرسالة التالية"
                className="p-1 rounded-md hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </>
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
