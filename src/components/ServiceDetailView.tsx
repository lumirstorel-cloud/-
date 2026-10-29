import React, { useState } from 'react';
import { FavoriteItem, PageView, ServiceItem, SiteSettings } from '../types';
import { formatArabicNumber, formatSar, getPricingModelLabel } from '../utils/formatters';
import { pathForView } from '../utils/routes';
import { getSeoMeta } from '../data/seo';
import { ResilientImage } from './ResilientImage';
import { ReviewForm } from './ReviewForm';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  Check,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  ShoppingBag,
  Plus,
  Minus
} from 'lucide-react';

interface ServiceDetailProps {
  slug: string;
  services: ServiceItem[];
  settings: SiteSettings;
  favorites?: FavoriteItem[];
  onToggleFavorite?: (serviceId: string, packageId?: string) => void;
  onAddToCart?: (service: ServiceItem, packageItem?: any) => void;
  navigate: (view: PageView, slug?: string) => void;
  onSelectServiceToBook: (serviceId: string, packageId?: string) => void;
  onOpenRatingModal?: () => void;
}

/** Single, indexable landing page for one service: /services/<slug> */
export const ServiceDetailView: React.FC<ServiceDetailProps> = ({
  slug,
  services,
  settings,
  favorites = [],
  onToggleFavorite,
  onAddToCart: propOnAddToCart,
  navigate,
  onSelectServiceToBook,
  onOpenRatingModal
}) => {
  const { addToCart } = useCart();
  const service = services.find((s) => s.slug === slug);
  const seo = getSeoMeta(`/services/${slug}`);

  const [selectedHours, setSelectedHours] = useState<number>(() => {
    return service?.defaultHours || service?.minHours || 4;
  });

  const go =
    (view: PageView, targetSlug?: string) =>
    (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(view, targetSlug);
    };

  if (!service) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#2C1E18]">
          هذه الخدمة غير متوفرة حاليًا
        </h1>
        <p className="text-sm text-[#5C4940]">
          يمكنك استعراض جميع خدمات لومير المتاحة لمناسبات مكة المكرمة وجدة.
        </p>
        <a
          href={pathForView('catalog')}
          onClick={go('catalog')}
          className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25]"
        >
          استعراض الخدمات والباقات
        </a>
      </div>
    );
  }

  const isHourly = Boolean(service.isHourlyEnabled || service.hourlyRateSar);
  const hourlyRate = service.hourlyRateSar ?? service.basePrice;
  const minH = service.minHours || 1;
  const maxH = service.maxHours || 12;
  const currentHourlySubtotal = hourlyRate * selectedHours + (service.fixedFeeSar || 0);

  const handleAddToCartHourly = () => {
    addToCart({
      serviceId: service.id,
      serviceName: service.name,
      categoryKey: service.category,
      pricingModel: 'hourly',
      hourlyRateSar: hourlyRate,
      durationHours: selectedHours,
      unitPriceSar: currentHourlySubtotal,
      quantity: 1,
      imageUrl: service.imageUrl,
      deliveryTimeframe: service.deliveryTimeframeHours
        ? `${formatArabicNumber(service.deliveryTimeframeHours)} ساعة`
        : undefined
    });
  };

  const handleAddToCartPackage = (pkg: any) => {
    if (propOnAddToCart) {
      propOnAddToCart(service, pkg);
    } else {
      addToCart({
        serviceId: service.id,
        serviceName: service.name,
        categoryKey: service.category,
        packageId: pkg.id,
        packageName: pkg.name,
        pricingModel: 'package',
        durationHours: pkg.durationHours || selectedHours,
        unitPriceSar: pkg.price,
        quantity: 1,
        imageUrl: service.imageUrl
      });
    }
  };

  const related = services.filter((s) => s.isAvailable && s.id !== service.id).slice(0, 4);
  const imageAlt = service.imageAlt || `${service.name} — خدمات لومير في مكة وجدة`;

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-12 space-y-14">
      {/* Breadcrumb */}
      <nav aria-label="مسار التصفح" className="text-xs text-[#645249] flex items-center gap-2">
        <a href={pathForView('home')} onClick={go('home')} className="hover:text-[#2C1E18]">
          الرئيسية
        </a>
        <span>/</span>
        <a href={pathForView('catalog')} onClick={go('catalog')} className="hover:text-[#2C1E18]">
          الكتالوج
        </a>
        <span>/</span>
        <span className="font-bold text-[#2C1E18]">{seo.breadcrumbLabel || service.name}</span>
      </nav>

      {/* Header */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] p-8 sm:p-10">
        <div className="lg:col-span-7 space-y-4">
          <div className="text-xs text-[#8C6D36]">
            {service.name} · مكة المكرمة وجدة
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2C1E18]">
            {seo.h1 || `${service.name} في مناسبات مكة وجدة`}
          </h1>
          <p className="text-sm text-[#8C6D36] font-medium">{service.tagline}</p>
          <p className="text-sm text-[#5C4940] leading-relaxed">{seo.intro || service.description}</p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#645249] pt-1">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#8C6D36]" />
              مكة المكرمة وجدة
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#8C6D36]" />
              {service.deliveryTimeframeHours
                ? `تسليم خلال ${formatArabicNumber(service.deliveryTimeframeHours)} ساعة`
                : 'مدة الخدمة تُحدد حسب المناسبة'}
            </span>
            {isHourly ? (
              <span className="font-mono-num font-bold text-[#2C1E18] bg-white/70 px-2.5 py-1 rounded-lg border border-[#D8CBB8]">
                {formatSar(hourlyRate)} / ساعة
              </span>
            ) : (
              <span className="font-mono-num font-bold text-[#2C1E18]">
                تبدأ من {formatSar(service.basePrice)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {isHourly ? (
              <button
                type="button"
                onClick={handleAddToCartHourly}
                className="px-6 py-3 text-xs font-bold bg-[#8C6D36] text-white rounded-xl hover:bg-[#72572B] inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة إلى السلة ({formatSar(currentHourlySubtotal)})</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onSelectServiceToBook(service.id)}
              className="px-6 py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] cursor-pointer"
            >
              احجزي هذه الخدمة
            </button>

            <a
              href={pathForView('contact')}
              onClick={go('contact')}
              className="px-6 py-3 text-xs font-bold border border-[#8C6D36] text-[#8C6D36] rounded-xl hover:bg-[#FAF6F0] inline-flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              تواصلي معنا
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <ResilientImage
            src={service.imageUrl}
            alt={imageAlt}
            className="w-full h-72 object-cover rounded-xl"
          />
        </div>
      </section>

      {/* Hourly Pricing & Duration Selector Section */}
      {isHourly && (
        <section className="p-6 sm:p-8 rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8CBB8] pb-4">
            <div>
              <div className="text-xs text-[#8C6D36] font-medium">نظام التسعير بالساعة وإدارة المدة</div>
              <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                مدة الخدمة وحساب التكلفة التقديرية
              </h2>
              <p className="text-xs text-[#645249] mt-1">
                سعر الساعة: <strong className="text-[#2C1E18]">{formatSar(hourlyRate)}</strong> (الحد الأدنى: {minH} ساعات — الحد الأقصى: {maxH} ساعات)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#645249]">عدد الساعات:</span>
              <div className="flex items-center gap-2 bg-white border border-[#D8CBB8] rounded-xl px-3 py-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setSelectedHours((h) => Math.max(minH, h - 1))}
                  disabled={selectedHours <= minH}
                  className="w-8 h-8 rounded-lg bg-[#FAF6F0] text-[#2C1E18] flex items-center justify-center hover:bg-[#F3ECE1] disabled:opacity-40 cursor-pointer font-bold"
                  title="إنقاص ساعة"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono-num font-bold text-base px-2 text-[#2C1E18]">
                  {formatArabicNumber(selectedHours)} س
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedHours((h) => Math.min(maxH, h + 1))}
                  disabled={selectedHours >= maxH}
                  className="w-8 h-8 rounded-lg bg-[#FAF6F0] text-[#2C1E18] flex items-center justify-center hover:bg-[#F3ECE1] disabled:opacity-40 cursor-pointer font-bold"
                  title="زيادة ساعة"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Preset hour buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[#645249] ml-2">خيارات سريعة للمدة:</span>
            {[3, 4, 5, 6, 8, 10]
              .filter((h) => h >= minH && h <= maxH)
              .map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSelectedHours(h)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedHours === h
                      ? 'bg-[#2C1E18] text-[#FAF6F0]'
                      : 'bg-white border border-[#D8CBB8] text-[#645249] hover:text-[#2C1E18]'
                  }`}
                >
                  {formatArabicNumber(h)} ساعات
                </button>
              ))}
          </div>

          {/* Live Calculation Box */}
          <div className="p-5 rounded-xl bg-white border border-[#D8CBB8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-[#8C6D36] font-medium">الحسبة التقديرية الحية:</div>
              <div className="text-sm text-[#2C1E18] flex items-center gap-2 flex-wrap">
                <span>{formatSar(hourlyRate)} / ساعة</span>
                <span>×</span>
                <span>{formatArabicNumber(selectedHours)} ساعات</span>
                {service.fixedFeeSar ? (
                  <>
                    <span>+</span>
                    <span>رسوم ثابتة {formatSar(service.fixedFeeSar)}</span>
                  </>
                ) : null}
                <span>=</span>
                <strong className="text-xl font-display text-[#8C6D36] font-mono-num">
                  {formatSar(currentHourlySubtotal)}
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddToCartHourly}
                className="px-6 py-3 text-xs font-bold bg-[#8C6D36] text-white rounded-xl hover:bg-[#72572B] transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة إلى السلة ({formatSar(currentHourlySubtotal)})</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectServiceToBook(service.id)}
                className="px-6 py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer"
              >
                حجز هذه المدة
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Highlights */}
      {service.includedHighlights.length > 0 && (
        <section className="space-y-5">
          <div className="space-y-1 border-b border-[#E6DCD2] pb-4">
            <div className="text-xs text-[#8C6D36]">مزايا الخدمة</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              ما الذي تقدمه {service.name} في مناسبتك؟
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#5C4940] leading-relaxed">
            {service.includedHighlights.map((hl, i) => (
              <li
                key={i}
                className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] flex items-start gap-2.5"
              >
                <Check className="w-4 h-4 text-[#8C6D36] shrink-0 mt-0.5" />
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Packages */}
      {service.packages.length > 0 && (
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="text-xs text-[#8C6D36]">الباقات والأسعار الأولية</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              باقات {service.name} المتاحة
            </h2>
            <p className="text-xs text-[#645249]">
              {getPricingModelLabel(service.pricingModel)} — الأسعار أولية ويُعتمد النهائي منها بعد
              مراجعة تفاصيل المناسبة.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {service.packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`p-5 rounded-2xl bg-[#FAF6F0] border flex flex-col justify-between space-y-4 ${
                  pkg.popular ? 'border-[#C8A96E] shadow-xs' : 'border-[#E6DCD2]'
                }`}
              >
                <div className="space-y-2">
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
                    onClick={() => onSelectServiceToBook(service.id, pkg.id)}
                    className="flex-1 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] cursor-pointer"
                  >
                    حجز هذه الباقة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddToCartPackage(pkg)}
                    className="p-2.5 rounded-lg border border-[#D8CBB8] hover:bg-[#F3ECE1] text-[#2C1E18] cursor-pointer"
                    title="إضافة هذه الباقة إلى السلة"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(service.id, pkg.id)}
                      className="p-2.5 rounded-lg border border-[#D8CBB8] hover:bg-[#F3ECE1] text-[#2C1E18] hover:text-rose-600 cursor-pointer"
                      title="حفظ في المفضلة"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorites.some((f) => f.serviceId === service.id && f.packageId === pkg.id)
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

      {/* Addons */}
      {service.addons.length > 0 && (
        <section className="space-y-5">
          <div className="space-y-1">
            <div className="text-xs text-[#8C6D36]">إضافات اختيارية</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              إضافات تُطلب مع {service.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {service.addons.map((addon) => (
              <div
                key={addon.id}
                className="p-5 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-1.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-[#2C1E18]">{addon.name}</strong>
                  <span className="font-mono-num font-bold text-sm text-[#2C1E18]">
                    {formatSar(addon.price)}
                  </span>
                </div>
                {addon.unitLabel && (
                  <div className="text-[11px] text-[#8C6D36]">{addon.unitLabel}</div>
                )}
                <p className="text-xs text-[#645249] leading-relaxed">{addon.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notices */}
      {(service.complianceNotice || service.spaceRequirements) && (
        <section className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-3 text-xs text-[#5C4940] leading-relaxed">
          {service.spaceRequirements && (
            <div>
              <strong className="block text-[#2C1E18] text-sm mb-1">
                المساحة والتجهيزات المطلوبة:
              </strong>
              <p>{service.spaceRequirements}</p>
            </div>
          )}
          {service.complianceNotice && (
            <div>
              <strong className="block text-[#2C1E18] text-sm mb-1">تنويه مهم:</strong>
              <p>{service.complianceNotice}</p>
            </div>
          )}
        </section>
      )}

      {/* Customer Reviews & Feedback Form */}
      <ReviewForm service={service} onOpenRatingModal={onOpenRatingModal} />

      {/* Booking CTA */}
      <section className="rounded-2xl bg-[#231712] text-[#FAF6F0] p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs text-[#C8A96E]">الخطوة التالية</div>
          <h2 className="font-display text-2xl font-bold">
            احجزي {service.name} لمناسبتكِ في {settings.brandNameAr}
          </h2>
          <p className="text-xs text-[#C7B8A8] leading-relaxed">
            أرسلي الطلب بالخدمة واليوم المناسب، ويتم التواصل معكِ عبر واتساب لاعتماد الموعد النهائي
            وتحديد التجهيزات الميدانية.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onSelectServiceToBook(service.id)}
            className="px-6 py-3 text-xs font-bold bg-[#C8A96E] text-[#231712] rounded-xl hover:bg-[#D5B982] cursor-pointer"
          >
            إرسال طلب الحجز
          </button>
          <a
            href={pathForView('contact')}
            onClick={go('contact')}
            className="px-6 py-3 text-xs font-bold border border-[#FAF6F0]/40 rounded-xl hover:bg-white/10 inline-flex items-center gap-2"
          >
            صفحة التواصل
            <ArrowLeft className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Related services */}
      {related.length > 0 && (
        <section className="space-y-5">
          <div className="space-y-1 border-b border-[#E6DCD2] pb-4">
            <div className="text-xs text-[#8C6D36]">خدمات أخرى</div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              قد يناسب مناسبتكِ أيضًا
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.map((srv) => (
              <a
                key={srv.id}
                href={pathForView('service-detail', srv.slug)}
                onClick={go('service-detail', srv.slug)}
                className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] hover:border-[#C8A96E] transition-colors space-y-2"
              >
                <span className="text-[11px] text-[#8C6D36] font-bold block">
                  {getPricingModelLabel(srv.pricingModel)}
                </span>
                <strong className="font-display text-base text-[#2C1E18] block leading-snug">
                  {srv.name}
                </strong>
                <span className="text-[11px] text-[#645249] block line-clamp-2">{srv.tagline}</span>
                <span className="font-mono-num text-xs font-bold text-[#2C1E18] block">
                  تبدأ من {formatSar(srv.basePrice)}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ServiceDetailView;
