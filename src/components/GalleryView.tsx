import React, { useState, useMemo } from 'react';
import { GalleryCategoryKey, PageView, PortfolioMediaItem, SiteSettings } from '../types';
import { buildWhatsAppLink, getGalleryCategoryLabel } from '../utils/formatters';
import {
  Camera,
  Play,
  Maximize2,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Calendar,
  Filter,
  Eye,
  Info
} from 'lucide-react';

interface GalleryViewProps {
  portfolio: PortfolioMediaItem[];
  settings: SiteSettings;
  navigate: (view: PageView) => void;
  onSelectServiceToBook: (serviceId: string) => void;
}

type FilterCategory = 'all' | GalleryCategoryKey;

export const GalleryView: React.FC<GalleryViewProps> = ({
  portfolio,
  settings,
  navigate,
  onSelectServiceToBook
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [selectedCity, setSelectedCity] = useState<'all' | 'مكة المكرمة' | 'جدة'>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'image' | 'video'>('all');
  const [activeItem, setActiveItem] = useState<PortfolioMediaItem | null>(null);

  // Filter public items only
  const publicItems = useMemo(() => {
    return (portfolio || []).filter((item) => item.isPublic !== false);
  }, [portfolio]);

  // Apply filters
  const filteredItems = useMemo(() => {
    return publicItems.filter((item) => {
      // Category match
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'kids_activities') {
          if (item.categoryKey !== 'kids_activities' && item.categoryKey !== ('childcare' as any)) {
            return false;
          }
        } else if (item.categoryKey !== selectedCategory) {
          return false;
        }
      }
      // City match
      if (selectedCity !== 'all' && item.city && item.city !== selectedCity) {
        return false;
      }
      // Media type match
      if (selectedMediaType !== 'all' && item.mediaType !== selectedMediaType) {
        return false;
      }
      return true;
    });
  }, [publicItems, selectedCategory, selectedCity, selectedMediaType]);

  // Category Tabs Configuration
  const categories: { key: FilterCategory; label: string; count: number }[] = [
    { key: 'all', label: 'جميع الأعمال', count: publicItems.length },
    {
      key: 'mobile_photography',
      label: '١. تصوير المناسبات بالجوال',
      count: publicItems.filter((i) => i.categoryKey === 'mobile_photography').length
    },
    {
      key: 'kids_corner',
      label: '٢. أركان الأطفال',
      count: publicItems.filter((i) => i.categoryKey === 'kids_corner').length
    },
    {
      key: 'kids_activities',
      label: '٣. أنشطة الأطفال',
      count: publicItems.filter(
        (i) => i.categoryKey === 'kids_activities' || i.categoryKey === ('childcare' as any)
      ).length
    },
    {
      key: 'wedding_support',
      label: '٤. خدمات الأفراح',
      count: publicItems.filter((i) => i.categoryKey === 'wedding_support').length
    },
    {
      key: 'event_setups',
      label: '٥. تجهيزات المناسبات',
      count: publicItems.filter((i) => i.categoryKey === 'event_setups').length
    }
  ];

  // Lightbox navigation
  const currentIndex = activeItem ? filteredItems.findIndex((i) => i.id === activeItem.id) : -1;
  const hasNext = currentIndex < filteredItems.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setActiveItem(filteredItems[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setActiveItem(filteredItems[currentIndex - 1]);
    }
  };

  // Map gallery item to booking flow
  const handleBookFromGallery = (item: PortfolioMediaItem) => {
    setActiveItem(null);
    if (item.categoryKey === 'mobile_photography') {
      onSelectServiceToBook('srv-mobile-photo');
    } else if (item.categoryKey === 'kids_corner') {
      onSelectServiceToBook('srv-kids-corner');
    } else if (item.categoryKey === 'kids_activities' || item.categoryKey === ('childcare' as any)) {
      onSelectServiceToBook('srv-childcare');
    } else {
      onSelectServiceToBook('srv-wedding-support-kosha-guard');
    }
  };

  // WhatsApp inquiry for specific gallery work
  const handleWhatsAppInquiry = (item: PortfolioMediaItem) => {
    const text = `مرحباً فريق لومير (LUMIR)، أود الاستفسار عن تفاصيل وحجز عمل مطابق لـ «${item.title}» (${getGalleryCategoryLabel(item.categoryKey)})${item.city ? ` في ${item.city}` : ''}.`;
    const url = buildWhatsAppLink(settings.whatsappLocal || '0579105700', text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10" dir="rtl">
      {/* 1. Header & Title Section */}
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8C6D36]">
          <Sparkles className="w-4 h-4 text-[#C8A96E]" />
          <span>معرض أعمال لومير المعتمد · مكة المكرمة وجدة</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C1E18] leading-tight">
          لحظات مضيئة وتفاصيل صنعت الفرق في مناسباتكم
        </h1>
        <p className="text-sm sm:text-base text-[#5C4940] leading-relaxed">
          استكشفي نماذج حية وتوثيقاً سينمائياً وتجهيزات متكاملة في خمسة أقسام رئيسية صُممت بأيدي
          سعودية محترفة، تعكس أعلى معايير الذوق والخصوصية.
        </p>
      </div>

      {/* 2. Clear Demo / Licensing & Child Privacy Disclaimers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Licensing & Transparency Notice */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F5EFE6] border border-[#E6DCD2] flex items-start gap-3.5 text-xs">
          <div className="p-2 rounded-xl bg-[#FAF6F0] text-[#8C6D36] border border-[#D8CBB8] shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <strong className="block text-[#2C1E18] font-bold text-[13px]">
              شفافية النماذج التجريبية المرخصة:
            </strong>
            <p className="text-[#645249] leading-relaxed">
              تستخدم لومير صوراً توضيحية مرخصة ومصرحة تعكس هوية وأسلوب الإخراج المعتمد لدينا، حتى
              يتم رفع وتحديث أعمال لومير الحصرية الخاصة بكل مناسبة بعد أخذ الموافقة المسبقة.
            </p>
          </div>
        </div>

        {/* Child Privacy Compliance Banner */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F7EBEB]/60 border border-[#EED7D7] flex items-start gap-3.5 text-xs">
          <div className="p-2 rounded-xl bg-[#FAF6F0] text-[#B86B6B] border border-[#EED7D7] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <strong className="block text-[#2C1E18] font-bold text-[13px]">
              ميثاق حماية خصوصية الأطفال:
            </strong>
            <p className="text-[#645249] leading-relaxed">
              جميع محتويات أركان وأنشطة الأطفال تخضع لضوابط الخصوصية الصارمة بموافقة خطية من أولياء
              الأمور، ولا يتم نشر أو عرض أسماء الأطفال أو أي معلومات تدل على هويتهم الشخصية.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Interactive Filter Tabs (Zero-pill, refined luxury controls) */}
      <div className="space-y-4 pt-2">
        {/* Category Filter Pills (Main 5 divisions) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isKids = cat.key === 'kids_corner' || cat.key === 'kids_activities';
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  isActive
                    ? isKids
                      ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-sm'
                      : 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-sm'
                    : 'bg-[#FAF6F0] text-[#645249] border-[#E6DCD2] hover:bg-[#F3ECE1] hover:text-[#2C1E18]'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[11px] font-mono font-normal px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-[#FAF6F0]/20 text-[#FAF6F0]' : 'bg-[#E6DCD2]/50 text-[#8C6D36]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filter Bar (City & Media Type) */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* City Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C6D36] font-bold">المدينة:</span>
              <div className="flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-xl border border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setSelectedCity('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedCity === 'all'
                      ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                      : 'text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCity('مكة المكرمة')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedCity === 'مكة المكرمة'
                      ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                      : 'text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  مكة المكرمة
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCity('جدة')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedCity === 'جدة'
                      ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                      : 'text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  جدة
                </button>
              </div>
            </div>

            {/* Media Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#8C6D36] font-bold">نوع العرض:</span>
              <div className="flex items-center gap-1 bg-[#F5EFE6] p-1 rounded-xl border border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setSelectedMediaType('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedMediaType === 'all'
                      ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                      : 'text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMediaType('image')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedMediaType === 'image'
                      ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                      : 'text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  صور فوتوغرافية
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMediaType('video')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedMediaType === 'video'
                      ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                      : 'text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  مقاطع فيديو / ريلز
                </button>
              </div>
            </div>
          </div>

          <div className="text-[#8C6D36] text-[11px] font-mono">
            عرض {filteredItems.length} من {publicItems.length} عمل
          </div>
        </div>
      </div>

      {/* 4. Gallery Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 p-8 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#F3ECE1] text-[#8C6D36] flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
            لا توجد أعمال مطابقة لهذا الفلتر حالياً
          </h3>
          <p className="text-xs text-[#645249]">
            يمكنكِ تغيير خيارات التصفية أو استعراض كامل أقسام المعرض.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedCity('all');
              setSelectedMediaType('all');
            }}
            className="px-5 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isChildSection =
              item.categoryKey === 'kids_corner' ||
              item.categoryKey === 'kids_activities' ||
              item.categoryKey === ('childcare' as any);

            return (
              <article
                key={item.id}
                onClick={() => setActiveItem(item)}
                className={`group rounded-3xl overflow-hidden bg-[#FAF6F0] border transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between ${
                  isChildSection
                    ? 'border-[#E8DFD8] hover:border-[#4E8A8A]/50 hover:shadow-md'
                    : 'border-[#E6DCD2] hover:border-[#C8A96E]/60 hover:shadow-md'
                }`}
              >
                {/* Visual Media Container */}
                <div className="relative aspect-4/3 bg-[#F3ECE1] overflow-hidden">
                  <img
                    src={item.mediaUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-70 group-hover:opacity-85 transition-opacity" />

                  {/* Top Badges */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                    {/* Media Type Badge */}
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-[#FAF6F0] text-[11px] font-bold flex items-center gap-1 shadow-xs">
                      {item.mediaType === 'video' ? (
                        <>
                          <Play className="w-3 h-3 text-[#C8A96E] fill-current" />
                          <span>فيديو / ريلز</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-3 h-3 text-[#C8A96E]" />
                          <span>لقطة فوتوغرافية</span>
                        </>
                      )}
                    </span>

                    {/* Demo Marker Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF6F0]/90 backdrop-blur-xs text-[#645249] text-[10px] font-medium border border-[#D8CBB8]">
                      نموذج توضيحي مرخص
                    </span>
                  </div>

                  {/* Center Play Button for Videos */}
                  {item.mediaType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-[#FAF6F0]/90 text-[#2C1E18] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-current mr-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Meta on Image */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-[#FAF6F0] text-xs">
                    {item.city && (
                      <span className="flex items-center gap-1 text-[11px] font-medium">
                        <MapPin className="w-3 h-3 text-[#C8A96E]" />
                        <span>{item.city}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#FAF6F0]/90 font-medium group-hover:text-[#C8A96E] transition-colors">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>تكبير العرض</span>
                    </span>
                  </div>
                </div>

                {/* Content Info Container */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    {/* Unboxed Metadata (Zero-pill) */}
                    <div className="text-[11px] font-bold text-[#8C6D36] flex items-center gap-1.5">
                      <span>{getGalleryCategoryLabel(item.categoryKey)}</span>
                      {isChildSection && (
                        <>
                          <span aria-hidden="true" className="text-[#D8CBB8]">
                            ·
                          </span>
                          <span className="text-[#4E8A8A]">أجواء آمنة ومبهجة</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#2C1E18] group-hover:text-[#8C6D36] transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    {item.caption && (
                      <p className="text-xs text-[#645249] leading-relaxed line-clamp-2">
                        {item.caption}
                      </p>
                    )}
                  </div>

                  {/* Actions & Protection Footer */}
                  <div className="pt-3 border-t border-[#E6DCD2] flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#8C6D36] font-medium">
                      لومير للأفراح والمناسبات
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveItem(item);
                      }}
                      className="text-xs font-bold text-[#2C1E18] hover:text-[#8C6D36] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>مشاهدة التفاصيل</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Mobile-Optimized Fullscreen Lightbox / Media Viewer Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6"
        >
          {/* Top Bar: Title & Close */}
          <div className="flex items-center justify-between text-[#FAF6F0] pb-3 border-b border-white/10 shrink-0">
            <div className="space-y-0.5 max-w-[70%]">
              <span className="text-[11px] text-[#C8A96E] font-bold block">
                {getGalleryCategoryLabel(activeItem.categoryKey)}
                {activeItem.city ? ` · ${activeItem.city}` : ''}
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold truncate">
                {activeItem.title}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setActiveItem(null)}
              aria-label="إغلاق نافذة العرض"
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#FAF6F0] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Media Center Zone with Prev/Next Controls */}
          <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden">
            {/* Prev Button */}
            {hasPrev && (
              <button
                type="button"
                onClick={handlePrev}
                aria-label="العمل السابق"
                className="absolute right-2 sm:right-6 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Next Button */}
            {hasNext && (
              <button
                type="button"
                onClick={handleNext}
                aria-label="العمل التالي"
                className="absolute left-2 sm:left-6 z-10 p-3 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-all cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Media Content */}
            <div className="max-w-4xl max-h-[70vh] flex items-center justify-center relative">
              {activeItem.mediaType === 'video' ? (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 aspect-16/9 w-full max-w-2xl flex items-center justify-center">
                  <img
                    src={activeItem.mediaUrl}
                    alt={activeItem.title}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3 p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#C8A96E] text-[#2C1E18] flex items-center justify-center shadow-xl">
                      <Play className="w-8 h-8 fill-current mr-1" />
                    </div>
                    <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg">
                      معاينة مقطع الفيديو والريلز بجودة عالية
                    </span>
                    <span className="text-white/70 text-[11px] max-w-sm">
                      يتم تسليم مقاطع الريلز المصورة بالجوال بدقة 4K خلال ٤٨ ساعة فقط مع تعديل احترافي.
                    </span>
                  </div>
                </div>
              ) : (
                <img
                  src={activeItem.mediaUrl}
                  alt={activeItem.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
                />
              )}
            </div>
          </div>

          {/* Bottom Bar: Caption, Privacy disclaimer & Booking Actions */}
          <div className="bg-black/75 backdrop-blur-md rounded-2xl border border-white/10 p-4 sm:p-5 text-[#FAF6F0] space-y-3 shrink-0 max-w-4xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                {activeItem.caption && (
                  <p className="text-sm text-[#FAF6F0] leading-relaxed">{activeItem.caption}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#FAF6F0]/70">
                  <span>نموذج توضيحي مرخص</span>
                  <span aria-hidden="true">·</span>
                  <span>تغطية مكة المكرمة وجدة</span>
                  {(activeItem.categoryKey === 'kids_corner' ||
                    activeItem.categoryKey === 'kids_activities') && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#C8A96E]">خاضع لموافقة الولي دون نشر أسماء الأطفال</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0">
                <button
                  type="button"
                  onClick={() => handleWhatsAppInquiry(activeItem)}
                  className="px-4 py-2.5 rounded-xl bg-[#1F5E3B] hover:bg-[#18492E] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>استفسار واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleBookFromGallery(activeItem)}
                  className="px-5 py-2.5 rounded-xl bg-[#C8A96E] hover:bg-[#B89354] text-[#2C1E18] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  <span>حجز هذه الخدمة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
