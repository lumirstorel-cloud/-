import React, { useState, useMemo } from 'react';
import {
  FavoriteItem,
  HeroBanner,
  HeroSliderSettings,
  PageView,
  PortfolioMediaItem,
  PricingModel,
  ServiceCategoryKey,
  ServiceItem,
  SiteSettings
} from '../types';
import {
  buildWhatsAppLink,
  formatArabicNumber,
  formatArabicTime,
  formatSar,
  getCategoryLabel,
  getGalleryCategoryLabel,
  getPricingModelLabel
} from '../utils/formatters';
import { HERO_IMAGE } from '../data/centralData';
import { ResilientImage } from './ResilientImage';
import { HeroBannerSlider } from './HeroBannerSlider';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Filter,
  Heart,
  HeartHandshake,
  Image as ImageIcon,
  Info,
  MapPin,
  MessageCircle,
  Palette,
  Play,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users
} from 'lucide-react';

interface CatalogProps {
  services: ServiceItem[];
  settings: SiteSettings;
  navigate: (view: PageView) => void;
  onSelectServiceToBook: (serviceId: string, packageId?: string) => void;
  banners?: HeroBanner[];
  sliderSettings?: HeroSliderSettings;
  portfolio?: PortfolioMediaItem[];
  favorites?: FavoriteItem[];
  onToggleFavorite?: (serviceId: string, packageId?: string) => void;
  onAddToCart?: (service: ServiceItem, packageItem?: any) => void;
}

// ============================================================================
// 1. HOME VIEW (الصفحة الرئيسية)
// ============================================================================

export const HomeView: React.FC<CatalogProps> = ({
  services,
  settings,
  navigate,
  onSelectServiceToBook,
  banners,
  sliderSettings,
  portfolio = [],
  favorites = [],
  onToggleFavorite,
  onAddToCart
}) => {
  const visibleServices = services.filter((s) => s.isAvailable);

  const whatsappHref = buildWhatsAppLink(
    settings.whatsappLocal,
    'مرحباً لومير (LUMIR)، أود الاستفسار عن حجز موعد لمناسبتي في مكة أو جدة.'
  );

  return (
    <div className="space-y-16 pb-12">
      {/* 1. Main Luxury Hero Banner Slider (Auto 3s, touch swipe, infinite loop, arrows & indicators) */}
      {banners && banners.length > 0 && (
        <HeroBannerSlider
          banners={banners}
          settings={
            sliderSettings || {
              autoPlay: true,
              intervalSeconds: 3,
              pauseOnHover: true,
              showArrows: true,
              showIndicators: true
            }
          }
          navigate={navigate}
          onSelectServiceToBook={onSelectServiceToBook}
        />
      )}

      {/* 2. 4 Key Categories KPI Strip */}
      <section className="px-4 sm:px-6">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-6 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] shadow-xs">
          <div
            onClick={() => navigate('mobile-photography')}
            className="space-y-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="text-xs text-[#8C6D36] font-bold">٠١. توثيق سينمائي</div>
            <div className="font-display text-lg font-bold text-[#2C1E18]">تصوير المناسبات بالجوال</div>
            <p className="text-xs text-[#645249] leading-relaxed">
              باقات من ٣ إلى ٧ ساعات تبدأ من ٣٥٠ ر.س مع تسليم فوري خلال ٤٨ ساعة.
            </p>
          </div>
          <div
            onClick={() => navigate('kids-corner')}
            className="space-y-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="text-xs text-[#4E8A8A] font-bold">٠٢. عالم الصغار</div>
            <div className="font-display text-lg font-bold text-[#2C1E18]">ركن الأطفال والأنشطة</div>
            <p className="text-xs text-[#645249] leading-relaxed">
              رسم وتلوين، طين، رسومات وجه، ونقش حناء بألوان الباستيل الراقية.
            </p>
          </div>
          <div
            onClick={() => navigate('childcare')}
            className="space-y-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="text-xs text-[#A86464] font-bold">٠٣. أمان وسكينة</div>
            <div className="font-display text-lg font-bold text-[#2C1E18]">مشرفات رعاية الأطفال</div>
            <p className="text-xs text-[#645249] leading-relaxed">
              إشراف ترفيهي مساند يبدأ من ٣٠٠ ر.س لراحة الأمهات وسكينة الصالة.
            </p>
          </div>
          <div
            onClick={() => navigate('wedding-support')}
            className="space-y-1.5 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="text-xs text-[#8C6D36] font-bold">٠٤. مساندة ميدانية</div>
            <div className="font-display text-lg font-bold text-[#2C1E18]">خدمات مساندة الأفراح</div>
            <p className="text-xs text-[#645249] leading-relaxed">
              مشرفة جوالات، حارسة كوشة، عبايات، وصيفة عروس، ومباشرة وقهوة.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Services Section */}
      <section className="px-6">
        <div className="max-w-[1240px] mx-auto space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6DCD2] pb-6">
            <div className="space-y-2">
              <div className="text-xs text-[#8C6D36]">كتالوج لومير الشامل</div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2C1E18]">
                خدمات احترافية بتسعير شفاف وباقات مرنة
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('catalog')}
              className="text-sm font-medium text-[#2C1E18] hover:text-[#8C6D36] inline-flex items-center gap-2 cursor-pointer"
            >
              <span>فتح الكتالوج الكامل مع التصفية</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleServices.slice(0, 4).map((srv) => (
              <article
                key={srv.id}
                className="rounded-2xl border border-[#E6DCD2] bg-[#FAF6F0] overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow"
              >
                <div>
                  <div className="relative">
                    <ResilientImage
                      src={srv.imageUrl}
                      alt={srv.name}
                      className="w-full h-48 object-cover"
                      containerClassName="relative overflow-hidden bg-[#F3ECE1]"
                      isDemo={srv.isDemoImage}
                    />
                    {onToggleFavorite && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(srv.id);
                        }}
                        className="absolute top-2.5 left-2.5 p-2 rounded-full bg-white/90 hover:bg-white text-[#2C1E18] hover:text-rose-600 transition-colors shadow-xs cursor-pointer"
                        title="حفظ في المفضلة"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            favorites?.some((f) => f.serviceId === srv.id && !f.packageId)
                              ? 'fill-rose-500 text-rose-500'
                              : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#645249]">
                      <span className="text-[#8C6D36]">{getCategoryLabel(srv.category)}</span>
                      <span className="font-mono-num font-bold text-[#2C1E18]">
                        تبدأ من {formatSar(srv.basePrice)}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#2C1E18]">{srv.name}</h3>
                    <p className="text-xs text-[#5C4940] line-clamp-2 leading-relaxed">
                      {srv.tagline}
                    </p>
                    {srv.priceNotice && (
                      <div className="text-[11px] text-[#8C6D36] bg-[#F3ECE1] p-2 rounded-lg">
                        {srv.priceNotice}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (srv.category === 'mobile_photography') navigate('mobile-photography');
                      else if (srv.category === 'kids_corner') navigate('kids-corner');
                      else if (srv.category === 'childcare') navigate('childcare');
                      else navigate('wedding-support');
                    }}
                    className="w-full py-2.5 text-xs font-medium border border-[#D8CBB8] text-[#2C1E18] rounded-lg hover:bg-[#F3ECE1] transition-colors cursor-pointer"
                  >
                    استعراض الباقات والخيارات
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectServiceToBook(srv.id)}
                    className="w-full py-2.5 text-xs font-medium bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] transition-colors cursor-pointer"
                  >
                    طلب حجز هذه الخدمة
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Luxury 5-Category Gallery Preview Section */}
      <section className="px-4 sm:px-6">
        <div className="max-w-[1240px] mx-auto p-6 sm:p-10 rounded-3xl bg-[#F5EFE6] border border-[#E6DCD2] space-y-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E6DCD2] pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-[#8C6D36]">
                <Sparkles className="w-4 h-4 text-[#C8A96E]" />
                <span>معرض الأعمال وتوثيق المناسبات · ٥ أقسام متخصصة</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#2C1E18]">
                لمحات من إبداع لومير في مناسبات مكة وجدة
              </h2>
              <p className="text-xs sm:text-sm text-[#5C4940] leading-relaxed">
                استكشفي أسلوبنا في التوثيق السينمائي العفوي بالجوال، أركان فرحة الصغار الآمنة،
                مشرفات الرعاية، تنظيم مساندة الأفراح، وتجهيزات الضيافة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('gallery')}
              className="px-5 py-3 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs sm:text-sm font-bold inline-flex items-center gap-2 hover:bg-[#422E25] transition-all cursor-pointer shadow-xs whitespace-nowrap self-start md:self-auto"
            >
              <ImageIcon className="w-4 h-4 text-[#C8A96E]" />
              <span>استعراض المعرض الكامل مع الفيديوهات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* 5-Division Preview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Division 1: تصوير المناسبات بالجوال */}
            <div
              onClick={() => navigate('gallery')}
              className="rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xs flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#F3ECE1] overflow-hidden">
                <img
                  src={portfolio.find((p) => p.categoryKey === 'mobile_photography')?.mediaUrl || HERO_IMAGE}
                  alt="تصوير المناسبات بالجوال"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                  توثيق ٤٨ ساعة
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-[#8C6D36] block">القسم الأول</span>
                <strong className="text-xs text-[#2C1E18] block group-hover:text-[#8C6D36] transition-colors">
                  تصوير المناسبات بالجوال
                </strong>
                <p className="text-[11px] text-[#645249] line-clamp-2">
                  ريلز سينمائي ولقطات عفوية بأعلى خصوصية.
                </p>
              </div>
            </div>

            {/* Division 2: أركان الأطفال */}
            <div
              onClick={() => navigate('gallery')}
              className="rounded-2xl bg-[#FAF6F0] border border-[#E8DFD8] overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xs flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#F3ECE1] overflow-hidden">
                <img
                  src={portfolio.find((p) => p.categoryKey === 'kids_corner')?.mediaUrl || HERO_IMAGE}
                  alt="أركان الأطفال"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#4E8A8A]/90 text-white text-[10px] font-bold">
                  ألوان الباستيل
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-[#4E8A8A] block">القسم الثاني</span>
                <strong className="text-xs text-[#2C1E18] block group-hover:text-[#4E8A8A] transition-colors">
                  أركان الأطفال
                </strong>
                <p className="text-[11px] text-[#645249] line-clamp-2">
                  خيم قطنية ومساحات لعب آمنة ومبهجة.
                </p>
              </div>
            </div>

            {/* Division 3: أنشطة الأطفال */}
            <div
              onClick={() => navigate('gallery')}
              className="rounded-2xl bg-[#FAF6F0] border border-[#E8DFD8] overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xs flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#F3ECE1] overflow-hidden">
                <img
                  src={
                    portfolio.find((p) => p.categoryKey === 'kids_activities' || p.categoryKey === ('childcare' as any))
                      ?.mediaUrl || HERO_IMAGE
                  }
                  alt="أنشطة الأطفال"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#B86B6B]/90 text-white text-[10px] font-bold">
                  إشراف تربوي
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-[#B86B6B] block">القسم الثالث</span>
                <strong className="text-xs text-[#2C1E18] block group-hover:text-[#B86B6B] transition-colors">
                  أنشطة الأطفال
                </strong>
                <p className="text-[11px] text-[#645249] line-clamp-2">
                  رسم وتلوين وطين وصلصال صحي ورسومات وجه.
                </p>
              </div>
            </div>

            {/* Division 4: خدمات الأفراح */}
            <div
              onClick={() => navigate('gallery')}
              className="rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xs flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#F3ECE1] overflow-hidden">
                <img
                  src={portfolio.find((p) => p.categoryKey === 'wedding_support')?.mediaUrl || HERO_IMAGE}
                  alt="خدمات الأفراح"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                  ضيافة سعودية
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-[#8C6D36] block">القسم الرابع</span>
                <strong className="text-xs text-[#2C1E18] block group-hover:text-[#8C6D36] transition-colors">
                  خدمات الأفراح
                </strong>
                <p className="text-[11px] text-[#645249] line-clamp-2">
                  مشرفة جوالات، حارسة كوشة، وبخور العود.
                </p>
              </div>
            </div>

            {/* Division 5: تجهيزات المناسبات */}
            <div
              onClick={() => navigate('gallery')}
              className="rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-300 shadow-xs flex flex-col justify-between"
            >
              <div className="relative aspect-4/3 bg-[#F3ECE1] overflow-hidden">
                <img
                  src={portfolio.find((p) => p.categoryKey === 'event_setups')?.mediaUrl || HERO_IMAGE}
                  alt="تجهيزات المناسبات"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[#8C6D36] text-white text-[10px] font-bold">
                  أوانٍ ذهبية
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-[#8C6D36] block">القسم الخامس</span>
                <strong className="text-xs text-[#2C1E18] block group-hover:text-[#8C6D36] transition-colors">
                  تجهيزات المناسبات
                </strong>
                <p className="text-[11px] text-[#645249] line-clamp-2">
                  دلال شقراء، مباخر نحاسية، واستكانات راقية.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Licensing Strip */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#645249] border-t border-[#E6DCD2]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8C6D36]" />
              <span>
                الصور مرخصة ومصرحة كنماذج إخراجية — محتوى الأطفال خاضع لموافقة الولي دون نشر أي أسماء.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('gallery')}
              className="text-[#8C6D36] font-bold hover:underline cursor-pointer"
            >
              عرض التفاصيل الكاملة بالمعرض ←
            </button>
          </div>
        </div>
      </section>

      {/* Booking Steps & Guarantees */}
      <section className="px-6 py-16 bg-[#F3ECE1] border-y border-[#E6DCD2]">
        <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="text-xs text-[#8C6D36]">لماذا تختارين لومير؟</div>
            <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
              تنظيم فاخر يراعي أدق التفاصيل لراحتكِ التامة
            </h2>
            <div className="space-y-4 text-xs text-[#5C4940] leading-relaxed">
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2]">
                <strong className="block text-sm text-[#2C1E18] mb-1">
                  • التزام صارم بخصوصية العائلات والأطفال
                </strong>
                لا يتم نشر أو تداول أي لقطة دون إذن خطي صريح، وتسليم فوري ومباشر لصاحبة المناسبة.
              </div>
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2]">
                <strong className="block text-sm text-[#2C1E18] mb-1">
                  • أسعار واضحة وباقات مدروسة قابلة للتخصيص
                </strong>
                تسعير يبدأ من ٣٥٠ ر.س للتصوير، وتخصيص مرن لخدمات الأطفال والمساندة مع توضيح وقت
                التسليم والتجهيزات.
              </div>
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2]">
                <strong className="block text-sm text-[#2C1E18] mb-1">
                  • خدمة حصرية لمكة المكرمة وجدة
                </strong>
                فريقنا الميداني يتواجد قبل الموعد بوقت كافٍ لضمان انطلاق الفرحة بسلاسة وأناقة.
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-8 rounded-2xl bg-[#231712] text-[#FAF6F0] space-y-6">
            <div className="text-xs text-[#C8A96E]">رحلة الحجز بخطوات بسيطة</div>
            <h3 className="font-display text-2xl font-bold">
              من اختيار الخدمة حتى اكتمال فرحتكِ
            </h3>
            <div className="space-y-4 text-xs text-[#C7B8A8]">
              <div className="flex gap-3">
                <span className="font-mono-num text-[#C8A96E] font-bold">01.</span>
                <div>
                  <strong className="text-white block text-sm">اختيار الخدمة وتفاصيلها</strong>
                  حددي ساعات التغطية أو عدد الأطفال ونوع المساندة مع تحديد المدينة والتاريخ.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-mono-num text-[#C8A96E] font-bold">02.</span>
                <div>
                  <strong className="text-white block text-sm">إرسال الطلب وحالة المراجعة</strong>
                  يصلكِ رقم مرجعي خاص، وتكون حالة الطلب «بانتظار المراجعة» للتحقق من الإتاحة.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="font-mono-num text-[#C8A96E] font-bold">03.</span>
                <div>
                  <strong className="text-white block text-sm">تأكيد الموعد عبر واتساب</strong>
                  يتم التواصل معكِ لاعتماد الموعد النهائي وتنسيق التجهيزات الميدانية مع القاعة.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('booking')}
              className="w-full py-3 px-6 text-xs font-medium bg-[#C8A96E] text-[#231712] rounded-lg hover:bg-[#D5B982] transition-colors cursor-pointer"
            >
              ابدئي طلب الحجز الآن
            </button>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="px-6">
        <div className="max-w-[1240px] mx-auto rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs text-[#8C6D36]">خدمة العملاء المباشرة</div>
            <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
              هل ترغبين في استشارة سريعة لتنسيق مناسبتكِ؟
            </h2>
            <p className="text-sm text-[#5C4940]">
              فريق لومير متواجد عبر واتساب للإجابة عن أسئلتك واقتراح الباقة الأنسب لعدد ضيوفكِ
              وموقع القاعة في مكة المكرمة وجدة.
            </p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-xs font-medium bg-[#1F5E3B] text-[#FAF6F0] rounded-lg hover:bg-[#18492E] transition-colors whitespace-nowrap"
          >
            <MessageCircle className="w-4 h-4" />
            <span>محادثة واتساب ({settings.whatsappLocal})</span>
          </a>
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// 2. FULL CATALOG VIEW WITH FILTERS (كتالوج الخدمات مع التصفية)
// ============================================================================

export const FullCatalogView: React.FC<CatalogProps> = ({
  services,
  settings,
  navigate,
  onSelectServiceToBook,
  favorites = [],
  onToggleFavorite,
  onAddToCart
}) => {
  const [cityFilter, setCityFilter] = useState<'all' | 'مكة المكرمة' | 'جدة'>('all');
  const [catFilter, setCatFilter] = useState<'all' | ServiceCategoryKey>('all');
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'under350' | 'under500' | 'under800' | 'above800'>('all');

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!s.isAvailable) return false;
      if (cityFilter !== 'all' && !s.applicableCities.includes(cityFilter)) return false;
      if (catFilter !== 'all' && s.category !== catFilter) return false;
      if (budgetFilter === 'under350' && s.basePrice > 350) return false;
      if (budgetFilter === 'under500' && s.basePrice > 500) return false;
      if (budgetFilter === 'under800' && s.basePrice > 800) return false;
      if (budgetFilter === 'above800' && s.basePrice <= 800) return false;
      return true;
    });
  }, [services, cityFilter, catFilter, budgetFilter]);

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-12 space-y-10">
      <div className="space-y-3 max-w-3xl">
        <div className="text-xs text-[#8C6D36]">كتالوج خدمات لومير المعتمد · مكة المكرمة وجدة</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#2C1E18]">
          استعراض وتصفية خدمات لومير
        </h1>
        <p className="text-base text-[#5C4940] leading-relaxed">
          جميع الخدمات قابلة للتعديل والتحكم من لوحة الإدارة. يمكنكِ تصفية الخدمات حسب المدينة، نوع
          الخدمة، أو الميزانية لاختيار ما يناسب تفاصيل مناسبتكِ.
        </p>
      </div>

      {/* Filter Control Bar */}
      <div className="p-6 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-4 text-xs">
        <div className="flex items-center gap-2 font-bold text-[#2C1E18]">
          <Filter className="w-4 h-4 text-[#8C6D36]" />
          <span>تصفية الكتالوج المتقدمة:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City Filter */}
          <div>
            <label className="block text-[#645249] mb-1.5 font-bold">المدينة المخدومة:</label>
            <div className="flex gap-1.5 bg-[#FAF6F0] p-1 rounded-lg border border-[#D8CBB8]">
              {[
                { key: 'all', label: 'كل المدن' },
                { key: 'مكة المكرمة', label: 'مكة المكرمة' },
                { key: 'جدة', label: 'جدة' }
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCityFilter(c.key as typeof cityFilter)}
                  className={`flex-1 py-1.5 px-2 rounded-md transition-colors cursor-pointer ${
                    cityFilter === c.key
                      ? 'bg-[#2C1E18] text-[#FAF6F0]'
                      : 'text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[#645249] mb-1.5 font-bold">نوع الخدمة:</label>
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value as typeof catFilter)}
              className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-lg"
            >
              <option value="all">جميع الأقسام</option>
              <option value="mobile_photography">تصوير المناسبات بالجوال</option>
              <option value="kids_corner">ركن الأطفال والأنشطة</option>
              <option value="childcare">مشرفات رعاية الأطفال</option>
              <option value="wedding_support">خدمات مساندة الأفراح</option>
            </select>
          </div>

          {/* Budget Filter */}
          <div>
            <label className="block text-[#645249] mb-1.5 font-bold">الميزانية الابتدائية:</label>
            <select
              value={budgetFilter}
              onChange={(e) => setBudgetFilter(e.target.value as typeof budgetFilter)}
              className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-lg"
            >
              <option value="all">كل الميزانيات</option>
              <option value="under350">حتى ٣٥٠ ر.س</option>
              <option value="under500">حتى ٥٠٠ ر.س</option>
              <option value="under800">حتى ٨٠٠ ر.س</option>
              <option value="above800">أكثر من ٨٠٠ ر.س</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between text-xs text-[#645249]">
          <span>
            الخدمات المعروضة: {formatArabicNumber(filteredServices.length)} من أصل{' '}
            {formatArabicNumber(services.filter((s) => s.isAvailable).length)} خدمة متاحة
          </span>
          <span className="text-[#8C6D36]">جميع الأسعار تشمل التجهيز في مكة المكرمة وجدة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((srv) => (
            <article
              key={srv.id}
              className="rounded-2xl border border-[#E6DCD2] bg-[#FAF6F0] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative">
                  <ResilientImage
                    src={srv.imageUrl}
                    alt={srv.name}
                    className="w-full h-52 object-cover"
                    isDemo={srv.isDemoImage}
                  />
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(srv.id);
                      }}
                      className="absolute top-3 left-3 p-2 rounded-full bg-white/90 hover:bg-white text-[#2C1E18] hover:text-rose-600 transition-colors shadow-xs cursor-pointer"
                      title="حفظ في المفضلة"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites?.some((f) => f.serviceId === srv.id && !f.packageId)
                            ? 'fill-rose-500 text-rose-500'
                            : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#645249]">
                    <span className="text-[#8C6D36]">{getCategoryLabel(srv.category)}</span>
                    <span className="font-mono-num font-bold text-sm text-[#2C1E18]">
                      تبدأ من {formatSar(srv.basePrice)}
                    </span>
                  </div>

                  <h2 className="font-display text-xl font-bold text-[#2C1E18]">{srv.name}</h2>
                  <p className="text-xs text-[#5C4940] leading-relaxed">{srv.description}</p>

                  <div className="pt-2 border-t border-[#EFE7DC] space-y-1.5 text-xs text-[#645249]">
                    <div>
                      • طريقة التسعير: <strong>{getPricingModelLabel(srv.pricingModel)}</strong>
                    </div>
                    {srv.deliveryTimeframeHours && (
                      <div>
                        • مدة التسليم المبدئية: <strong>{srv.deliveryTimeframeHours} ساعة</strong>
                      </div>
                    )}
                    {srv.packages.length > 0 && (
                      <div>
                        • عدد الباقات المتاحة: <strong>{formatArabicNumber(srv.packages.length)} باقات</strong>
                      </div>
                    )}
                  </div>

                  {srv.priceNotice && (
                    <div className="p-2.5 rounded-lg bg-[#F3ECE1] text-[11px] text-[#8C6D36]">
                      {srv.priceNotice}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-0 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    if (srv.category === 'mobile_photography') navigate('mobile-photography');
                    else if (srv.category === 'kids_corner') navigate('kids-corner');
                    else if (srv.category === 'childcare') navigate('childcare');
                    else navigate('wedding-support');
                  }}
                  className="w-full py-2.5 text-xs font-medium border border-[#D8CBB8] text-[#2C1E18] rounded-lg hover:bg-[#F3ECE1] cursor-pointer"
                >
                  استعراض الباقات والاشتراطات
                </button>
                <button
                  type="button"
                  onClick={() => onSelectServiceToBook(srv.id)}
                  className="w-full py-2.5 text-xs font-medium bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] cursor-pointer"
                >
                  طلب حجز هذه الخدمة
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. SPECIALIZED CATEGORY VIEWS (الصفحات التخصصية الأربع)
// ============================================================================

interface SpecializedViewProps extends CatalogProps {
  categoryKey: ServiceCategoryKey;
}

export const SpecializedCategoryView: React.FC<SpecializedViewProps> = ({
  categoryKey,
  services,
  settings,
  navigate,
  onSelectServiceToBook,
  favorites = [],
  onToggleFavorite,
  onAddToCart
}) => {
  const categoryServices = services.filter((s) => s.category === categoryKey && s.isAvailable);
  const primaryService = categoryServices[0] || services[0];

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-12 space-y-16">
      {/* Breadcrumb */}
      <nav aria-label="مسار التصفح" className="text-xs text-[#645249] flex items-center gap-2">
        <button type="button" onClick={() => navigate('home')} className="hover:text-[#2C1E18]">
          الرئيسية
        </button>
        <span>/</span>
        <button type="button" onClick={() => navigate('catalog')} className="hover:text-[#2C1E18]">
          الكتالوج
        </button>
        <span>/</span>
        <span className="font-bold text-[#2C1E18]">{getCategoryLabel(categoryKey)}</span>
      </nav>

      {/* Header Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] p-8 sm:p-10">
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs text-[#8C6D36]">قسم تخصصي معتمد · مكة المكرمة وجدة</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2C1E18]">
            {primaryService.name}
          </h1>
          <p className="text-sm text-[#8C6D36] font-medium">{primaryService.tagline}</p>
          <p className="text-sm text-[#5C4940] leading-relaxed">{primaryService.description}</p>

          {/* Regulatory compliance box for Childcare */}
          {categoryKey === 'childcare' && primaryService.complianceNotice && (
            <div className="p-4 rounded-xl bg-[#F7EFEF] border border-[#E2C6C6] text-xs text-[#7A4949] space-y-1">
              <strong className="block font-bold">تنويه نظامي وإخلاء مسؤولية:</strong>
              <p>{primaryService.complianceNotice}</p>
            </div>
          )}

          {/* Delivery duration notice for Mobile Photography */}
          {categoryKey === 'mobile_photography' && (
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] text-xs text-[#2C1E18] space-y-1">
              <strong>مدة التسليم المبدئية المعتمدة:</strong>
              <p>
                يتم تسليم الأصول والمونتاج خلال <strong>٤٨ ساعة</strong> من انتهاء المناسبة، مع
                إمكانية التسليم المستعجل بنفس الليلة عند الطلب.
              </p>
            </div>
          )}

          {/* Space requirements for Kids Corner */}
          {categoryKey === 'kids_corner' && primaryService.spaceRequirements && (
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] text-xs text-[#2C1E18] space-y-1">
              <strong>المساحة المطلوبة والتجهيزات:</strong>
              <p>{primaryService.spaceRequirements}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <ResilientImage
            src={primaryService.imageUrl}
            alt={primaryService.name}
            className="w-full h-72 object-cover rounded-xl"
            isDemo={primaryService.isDemoImage}
          />
        </div>
      </div>

      {/* Hourly / Packaged Pricing Matrix */}
      {categoryKey === 'mobile_photography' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="text-xs text-[#8C6D36]">باقات ساعات التغطية المعتمدة</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              خيارات التغطية بالجوال ومقاطع الريلز
            </h2>
            <p className="text-xs text-[#645249]">
              الأسعار الأولية المستندة إلى ساعات العمل مع تسليم فوري للملفات الأصلية خلال ٤٨ ساعة:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {primaryService.packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 ${
                  pkg.popular
                    ? 'bg-[#FAF6F0] border-[#C8A96E] shadow-xs'
                    : 'bg-[#FAF6F0] border-[#E6DCD2]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#8C6D36]">
                    <span>{pkg.durationHours} ساعات</span>
                    <span>{pkg.deliveryTimeframe}</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#2C1E18]">{pkg.name}</h3>
                  <div className="font-display text-2xl font-bold text-[#2C1E18] font-mono-num">
                    {formatSar(pkg.price)}
                  </div>
                  <ul className="space-y-1.5 pt-2 border-t border-[#EFE7DC] text-[11px] text-[#5C4940]">
                    {pkg.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectServiceToBook(primaryService.id, pkg.id)}
                    className="flex-1 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] cursor-pointer transition-colors shadow-xs"
                  >
                    حجز هذه الباقة
                  </button>
                  {onAddToCart && (
                    <button
                      type="button"
                      onClick={() => onAddToCart(primaryService, pkg)}
                      className="p-2.5 rounded-lg border border-[#D8CBB8] hover:bg-[#F3ECE1] text-[#2C1E18] cursor-pointer transition-colors"
                      title="إضافة لسلة الباقات"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  )}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(primaryService.id, pkg.id)}
                      className="p-2.5 rounded-lg border border-[#D8CBB8] hover:bg-[#F3ECE1] text-[#2C1E18] hover:text-rose-600 cursor-pointer transition-colors"
                      title="حفظ في المفضلة"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites?.some(
                            (f) =>
                              f.serviceId === primaryService.id && f.packageId === pkg.id
                          )
                            ? 'fill-rose-500 text-rose-500'
                            : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Kids Corner Activities & Bundles */}
      {categoryKey === 'kids_corner' && (
        <section className="space-y-8">
          <div className="space-y-1">
            <div className="text-xs text-[#8C6D36]">الأنشطة المشمولة في الركن</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              تنوع ترفيهي إبداعي يناسب مختلف أعمار الأطفال
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-2">
              <div className="text-xs font-bold text-[#8C6D36]">النشاط ٠١</div>
              <h3 className="font-bold text-sm text-[#2C1E18]">الرسم والتلوين على الأوراق</h3>
              <p className="text-xs text-[#645249]">
                كراسات تلوين مخصصة، ألوان آمنة غير قابلة للتصبغ، وأدوات رسم فردية لكل طفل.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-2">
              <div className="text-xs font-bold text-[#4E8A8A]">النشاط ٠٢</div>
              <h3 className="font-bold text-sm text-[#2C1E18]">اللعب بالطين والتشكيل</h3>
              <p className="text-xs text-[#645249]">
                صلصال وطين صحي ناعم غير لزج مع قوالب تشكيل مبهجة تنمي مهارات الطفل اليدوية.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-2">
              <div className="text-xs font-bold text-[#A86464]">النشاط ٠٣</div>
              <h3 className="font-bold text-sm text-[#2C1E18]">رسومات الوجه اللطيفة</h3>
              <p className="text-xs text-[#645249]">
                ألوان وجه مائية عضوية سهلة الغسل مصممة لبشرة الأطفال الحساسة (رسومات فراشات وأبطال).
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-2">
              <div className="text-xs font-bold text-[#8C6D36]">النشاط ٠٤</div>
              <h3 className="font-bold text-sm text-[#2C1E18]">نقش الحناء الاختياري</h3>
              <p className="text-xs text-[#645249]">
                نقوش ناعمة للفتيات تُقدّم عند توفر مقدمة الخدمة وموافقة الأم المسبقة في نموذج الطلب.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-[#2C1E18]">باقات ركن الأطفال المجمعة</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {primaryService.packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="text-xs text-[#8C6D36]">
                      سعة الأطفال المقترحة: {pkg.durationHours} ساعات
                    </div>
                    <h4 className="font-display text-xl font-bold text-[#2C1E18]">{pkg.name}</h4>
                    <div className="font-display text-2xl font-bold text-[#2C1E18] font-mono-num">
                      {formatSar(pkg.price)}
                    </div>
                    <ul className="space-y-1.5 pt-2 border-t border-[#EFE7DC] text-xs text-[#5C4940]">
                      {pkg.features.map((f, i) => (
                        <li key={i}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectServiceToBook(primaryService.id, pkg.id)}
                    className="w-full py-2.5 text-xs font-medium bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] cursor-pointer"
                  >
                    حجز باقة الأطفال
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Wedding Support Services Table / Cards with Exact Initial Prices */}
      {categoryKey === 'wedding_support' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="text-xs text-[#8C6D36]">خدمات الكادر والمساندة الميدانية</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              قائمة خدمات مساندة الأفراح والأسعار الأولية
            </h2>
            <p className="text-xs text-[#645249]">
              الأسعار أدناه أولية وقابلة للتأكيد والتعديل من الإدارة، ولا تعتبر ملزمة نهائياً إلا
              بعد مراجعة تفاصيل ومدة المناسبة:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryServices.map((srv) => (
              <div
                key={srv.id}
                className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#8C6D36]">
                    <span>{getPricingModelLabel(srv.pricingModel)}</span>
                    <span className="font-mono-num font-bold text-base text-[#2C1E18]">
                      {formatSar(srv.basePrice)}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#2C1E18]">{srv.name}</h3>
                  <p className="text-xs text-[#5C4940] leading-relaxed">{srv.description}</p>
                  <ul className="space-y-1 pt-2 border-t border-[#EFE7DC] text-xs text-[#645249]">
                    {srv.includedHighlights.map((hl, i) => (
                      <li key={i}>• {hl}</li>
                    ))}
                  </ul>
                  <div className="p-2 rounded-lg bg-[#F3ECE1] text-[11px] text-[#8C6D36]">
                    «السعر النهائي بعد مراجعة تفاصيل المناسبة»
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectServiceToBook(srv.id)}
                  className="w-full py-2.5 text-xs font-medium bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] cursor-pointer"
                >
                  طلب حجز هذه الخدمة
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Childcare Supervisor Booking Options */}
      {categoryKey === 'childcare' && (
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="text-xs text-[#8C6D36]">خيارات حجز المشرفات</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              تحديد عدد المشرفات حسب عدد الأطفال وطبيعة الخدمة
            </h2>
            <p className="text-xs text-[#645249]">
              نلتزم بنسبة مشرفة لكل ٨ إلى ١٠ أطفال لضمان سلامة ورعاية كل طفل:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {primaryService.packages.map((pkg) => (
              <div
                key={pkg.id}
                className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="text-xs text-[#8C6D36]">المدة الأساسية: {pkg.durationHours} ساعات</div>
                  <h3 className="font-display text-xl font-bold text-[#2C1E18]">{pkg.name}</h3>
                  <div className="font-display text-2xl font-bold text-[#2C1E18] font-mono-num">
                    {formatSar(pkg.price)}
                  </div>
                  <ul className="space-y-1.5 pt-2 border-t border-[#EFE7DC] text-xs text-[#5C4940]">
                    {pkg.features.map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-[#645249] bg-[#F3ECE1] p-2 rounded-lg">
                    يتطلب توثيق بيانات الأم وتعليمات الحساسية في نموذج الحجز.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectServiceToBook(primaryService.id, pkg.id)}
                  className="w-full py-2.5 text-xs font-medium bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] cursor-pointer"
                >
                  حجز باقة المشرفات
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
