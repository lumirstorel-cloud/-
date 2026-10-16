import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { HeroBanner, HeroSliderSettings, PageView } from '../types';
import { formatArabicNumber } from '../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  Camera,
  Heart
} from 'lucide-react';

interface HeroBannerSliderProps {
  banners: HeroBanner[];
  settings: HeroSliderSettings;
  navigate: (view: PageView) => void;
  onSelectServiceToBook?: (serviceId: string, packageId?: string) => void;
}

export const HeroBannerSlider: React.FC<HeroBannerSliderProps> = ({
  banners,
  settings,
  navigate,
  onSelectServiceToBook
}) => {
  const activeBanners = useMemo(
    () => (banners || []).filter((b) => b.isActive),
    [banners]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalBanners = activeBanners.length;
  const intervalSeconds = settings?.intervalSeconds || 3;
  const intervalMs = intervalSeconds * 1000;

  // Circular loop transitions
  const handleNext = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
    setProgress(0);
  }, [totalBanners]);

  const handlePrev = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? totalBanners - 1 : prev - 1));
    setProgress(0);
  }, [totalBanners]);

  // Auto-play timer every 3 seconds with visual progress
  useEffect(() => {
    if (!settings?.autoPlay || totalBanners <= 1 || isPaused) {
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / intervalMs) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => clearInterval(progressTimer);
  }, [settings?.autoPlay, totalBanners, isPaused, intervalMs, handleNext]);

  // Touch Swipe on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const diffX = touchStartX.current - touchEndX.current;
    const threshold = 40; // 40px threshold

    // In RTL reading direction:
    // Swiping finger to Left (diffX > 40) means pulling the NEXT slide from the left
    // Swiping finger to Right (diffX < -40) means pulling the PREVIOUS slide from the right
    if (diffX > threshold) {
      handleNext();
    } else if (diffX < -threshold) {
      handlePrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
  };

  const handleCtaClick = (targetLink?: string) => {
    if (!targetLink) return;
    if (targetLink.startsWith('http') || targetLink.startsWith('https://wa.me')) {
      window.open(targetLink, '_blank');
    } else if (targetLink === 'booking') {
      navigate('booking');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(targetLink as PageView);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (totalBanners === 0) {
    return null;
  }

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];

  return (
    <section
      aria-label="سلايدر البنرات الرئيسية"
      className="relative w-full overflow-hidden bg-[#1C120E] text-[#FAF6F0] select-none"
      onMouseEnter={() => settings?.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => settings?.pauseOnHover && setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      dir="rtl"
    >
      {/* 3-Second Active Progress Bar at top of slider */}
      {settings?.autoPlay && totalBanners > 1 && (
        <div className="absolute top-0 inset-x-0 h-1 bg-black/30 z-30 pointer-events-none">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-[#C8A96E] to-[#E5CCA0] transition-all duration-75 ease-linear shadow-xs"
          />
        </div>
      )}

      {/* Main Slides Container */}
      <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[580px]">
        {activeBanners.map((banner, index) => {
          const isActive = index === currentIndex;
          const overlayDarkness = banner.overlayDarkness ?? 0.45;

          return (
            <div
              key={banner.id}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                isActive
                  ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                  : 'opacity-0 scale-[1.02] z-0 pointer-events-none'
              }`}
            >
              {/* Background Media with Picture Tag */}
              <picture className="absolute inset-0 w-full h-full block">
                {banner.mobileImageUrl && (
                  <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />
                )}
                <img
                  src={banner.desktopImageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
              </picture>

              {/* Scrim Gradient Overlay for WCAG Contrast */}
              <div
                style={{
                  backgroundColor: `rgba(28, 18, 14, ${overlayDarkness})`
                }}
                className="absolute inset-0 bg-gradient-to-r from-[#1C120E]/95 via-[#1C120E]/75 to-black/30"
              />

              {/* Bottom Subtle Gradient Fade to Content */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#FAF6F0] via-transparent to-transparent pointer-events-none" />

              {/* Text & Content Overlay */}
              <div className="relative max-w-[1240px] h-full mx-auto px-6 sm:px-10 flex flex-col justify-center">
                <div
                  className={`max-w-2xl space-y-4 sm:space-y-5 ${
                    banner.textPosition === 'center'
                      ? 'text-center mx-auto'
                      : banner.textPosition === 'left'
                      ? 'text-left ml-auto mr-0'
                      : 'text-right'
                  }`}
                >
                  {/* Badge */}
                  {banner.badge && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF6F0]/15 backdrop-blur-md border border-[#C8A96E]/50 text-[#C8A96E] text-xs font-bold tracking-wide shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-[#C8A96E]" />
                      <span>{banner.badge}</span>
                    </div>
                  )}

                  {/* Title */}
                  <h2
                    className="font-display text-3xl sm:text-4xl lg:text-[48px] font-bold text-[#FAF6F0] leading-[1.22] drop-shadow-md"
                    style={{ textWrap: 'balance' }}
                  >
                    {banner.title}
                  </h2>

                  {/* Subtitle */}
                  <p className="text-sm sm:text-base lg:text-lg text-[#F3ECE1]/90 leading-relaxed font-normal max-w-xl drop-shadow-sm">
                    {banner.subtitle}
                  </p>

                  {/* Trust metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#E5CCA0]/90 pt-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#C8A96E]" />
                      <span>طاقم نسائي سعودي محترف</span>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>خدمة حصرية في مكة المكرمة وجدة</span>
                    <span aria-hidden="true">·</span>
                    <span>ضمان الخصوصية التامة</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3.5 pt-3">
                    {banner.ctaText && banner.ctaLink && (
                      <button
                        type="button"
                        onClick={() => handleCtaClick(banner.ctaLink)}
                        className="px-7 py-3.5 text-xs sm:text-sm font-bold bg-[#C8A96E] text-[#2C1E18] rounded-xl hover:bg-[#d8bc84] transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-[1.02]"
                      >
                        <span>{banner.ctaText}</span>
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                    )}

                    {banner.secondaryCtaText && banner.secondaryCtaLink && (
                      <button
                        type="button"
                        onClick={() => handleCtaClick(banner.secondaryCtaLink)}
                        className="px-6 py-3.5 text-xs sm:text-sm font-medium border border-[#FAF6F0]/40 text-[#FAF6F0] bg-black/30 backdrop-blur-md rounded-xl hover:bg-white/10 hover:border-[#FAF6F0] transition-all cursor-pointer"
                      >
                        <span>{banner.secondaryCtaText}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Desktop / Tablet Navigation Arrows */}
      {settings?.showArrows && totalBanners > 1 && (
        <>
          {/* In RTL: Right button goes to previous slide */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="البنر السابق"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#1C120E]/60 hover:bg-[#C8A96E] text-[#FAF6F0] hover:text-[#1C120E] border border-white/20 items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer hover:scale-110 shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* In RTL: Left button goes to next slide */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="البنر التالي"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#1C120E]/60 hover:bg-[#C8A96E] text-[#FAF6F0] hover:text-[#1C120E] border border-white/20 items-center justify-center transition-all duration-200 backdrop-blur-md cursor-pointer hover:scale-110 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators: Number Counter and Dot Indicators */}
      {settings?.showIndicators && totalBanners > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 shadow-md">
          {/* Arabic Index Counter */}
          <span className="text-xs font-bold text-[#C8A96E] font-mono px-1">
            {formatArabicNumber(currentIndex + 1)} / {formatArabicNumber(totalBanners)}
          </span>

          <div className="h-3 w-px bg-white/25" />

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {activeBanners.map((_, dotIdx) => {
              const isCurrent = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    setCurrentIndex(dotIdx);
                    setProgress(0);
                  }}
                  aria-label={`الانتقال إلى البنر ${dotIdx + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'w-7 bg-[#C8A96E]'
                      : 'w-2 bg-[#FAF6F0]/40 hover:bg-[#FAF6F0]/80'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
