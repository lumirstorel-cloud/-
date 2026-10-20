import React, { useState, useMemo } from 'react';
import {
  BookingSubmission,
  CartItem,
  FavoriteItem,
  PageView,
  ServiceItem,
  SiteSettings
} from '../types';
import { formatArabicNumber, formatSar, getCategoryLabel, buildWhatsAppLink } from '../utils/formatters';
import {
  Search,
  X,
  Heart,
  ShoppingBag,
  User,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Trash2,
  Sparkles,
  Phone,
  MessageCircle,
  ShieldCheck,
  Star,
  ChevronLeft
} from 'lucide-react';

// ============================================================================
// 1. QUICK SEARCH MODAL
// ============================================================================

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  navigate: (view: PageView) => void;
  onSelectServiceToBook: (serviceId: string, packageId?: string) => void;
  onToggleFavorite?: (serviceId: string, packageId?: string) => void;
  isFavorite?: (serviceId: string, packageId?: string) => boolean;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  services,
  navigate,
  onSelectServiceToBook
}) => {
  const [query, setQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<'all' | 'مكة المكرمة' | 'جدة'>('all');

  const popularSearches = [
    'تصوير جوال',
    'باقة ٤ ساعات',
    'ركن تلوين',
    'رسومات الوجه',
    'مشرفة أطفال',
    'تسليم ٤٨ ساعة',
    'مكة المكرمة',
    'جدة'
  ];

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{
      type: 'service' | 'package';
      service: ServiceItem;
      packageItem?: ServiceItem['packages'][0];
      title: string;
      subtitle: string;
      price: number;
      categoryKey: string;
    }> = [];

    services.forEach((service) => {
      // Check city filter
      if (
        selectedCity !== 'all' &&
        !service.applicableCities.includes(selectedCity)
      ) {
        return;
      }

      const matchService =
        service.name.toLowerCase().includes(q) ||
        service.description.toLowerCase().includes(q) ||
        service.tagline.toLowerCase().includes(q) ||
        getCategoryLabel(service.category).toLowerCase().includes(q);

      if (matchService) {
        results.push({
          type: 'service',
          service,
          title: service.name,
          subtitle: service.tagline,
          price: service.basePrice,
          categoryKey: service.category
        });
      }

      // Check packages
      service.packages.forEach((pkg) => {
        const matchPackage =
          pkg.name.toLowerCase().includes(q) ||
          pkg.features.some((f) => f.toLowerCase().includes(q));

        if (matchPackage) {
          results.push({
            type: 'package',
            service,
            packageItem: pkg,
            title: `${service.name} — ${pkg.name}`,
            subtitle: pkg.features.slice(0, 2).join(' · '),
            price: pkg.price,
            categoryKey: service.category
          });
        }
      });
    });

    return results;
  }, [query, selectedCity, services]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF6F0] rounded-2xl shadow-2xl border border-[#E6DCD2] overflow-hidden flex flex-col max-h-[80vh] text-[#2C1E18]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E6DCD2] flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-[#8C6D36] shrink-0" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحثي عن باقة، خدمة، عدد ساعات، ركن أطفال، تصوير..."
            className="flex-1 bg-transparent text-[#2C1E18] placeholder-[#9C8980] text-base focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-[#9C8980] hover:text-[#2C1E18] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#645249] bg-[#F3ECE1] hover:bg-[#E8DFD3] rounded-lg transition-colors"
          >
            إغلاق (Esc)
          </button>
        </div>

        {/* Quick Filter by City */}
        <div className="px-5 py-2.5 bg-[#F8F3EC] border-b border-[#E6DCD2] flex items-center justify-between text-xs text-[#645249]">
          <span className="font-medium text-[#8C6D36]">تصفية المدينة:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCity('all')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedCity === 'all'
                  ? 'bg-[#2C1E18] text-[#FAF6F0]'
                  : 'bg-white hover:bg-[#E8DFD3]'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setSelectedCity('مكة المكرمة')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedCity === 'مكة المكرمة'
                  ? 'bg-[#2C1E18] text-[#FAF6F0]'
                  : 'bg-white hover:bg-[#E8DFD3]'
              }`}
            >
              مكة المكرمة
            </button>
            <button
              type="button"
              onClick={() => setSelectedCity('جدة')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                selectedCity === 'جدة'
                  ? 'bg-[#2C1E18] text-[#FAF6F0]'
                  : 'bg-white hover:bg-[#E8DFD3]'
              }`}
            >
              جدة
            </button>
          </div>
        </div>

        {/* Search Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!query ? (
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-[#8C6D36] block mb-2">
                  عمليات بحث شائعة:
                </span>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-[#E6DCD2] text-xs text-[#5C4940] hover:border-[#8C6D36] hover:text-[#2C1E18] transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6DCD2]">
                <span className="text-xs font-bold text-[#8C6D36] block mb-2">
                  خدمات لومير الأساسية:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {services.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => {
                        onSelectServiceToBook(srv.id);
                        onClose();
                      }}
                      className="p-3 bg-white rounded-xl border border-[#E6DCD2] hover:border-[#8C6D36] text-right transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#2C1E18]">{srv.name}</div>
                        <div className="text-[11px] text-[#8C6D36]">
                          يبدأ من {formatSar(srv.basePrice)}
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-[#8C6D36]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <AlertCircle className="w-10 h-10 text-[#C8A96E] mx-auto opacity-70" />
              <p className="font-bold text-sm text-[#2C1E18]">
                لم نجد نتائج مطابقة لـ &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[#8C6D36]">
                تأكدي من صحة الكلمة، أو جرّبي البحث عن (تصوير، أطفال، مكة، جدة).
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="text-xs text-[#645249]">
                تم العثور على {formatArabicNumber(searchResults.length)} نتيجة:
              </div>
              {searchResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white rounded-xl border border-[#E6DCD2] hover:border-[#C8A96E] hover:shadow-xs transition-all flex items-center justify-between gap-3 text-right"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36]">
                        {getCategoryLabel(item.categoryKey as any)}
                      </span>
                      <h4 className="font-bold text-sm text-[#2C1E18] truncate">
                        {item.title}
                      </h4>
                    </div>
                    <p className="text-xs text-[#645249] truncate">{item.subtitle}</p>
                    <div className="text-xs font-bold text-[#2C1E18] font-mono">
                      {formatSar(item.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectServiceToBook(item.service.id, item.packageItem?.id);
                        onClose();
                      }}
                      className="px-4 py-2 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] transition-colors whitespace-nowrap"
                    >
                      احجزي الآن
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. FAVORITES / WISHLIST DRAWER
// ============================================================================

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: FavoriteItem[];
  onRemoveFavorite: (id: string) => void;
  onClearFavorites: () => void;
  onSelectServiceToBook: (serviceId: string, packageId?: string) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favorites,
  onRemoveFavorite,
  onClearFavorites,
  onSelectServiceToBook
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-start animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF6F0] h-full shadow-2xl flex flex-col border-l border-[#E6DCD2] text-[#2C1E18] animate-slideInRight"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E6DCD2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="font-display font-bold text-lg text-[#2C1E18]">
              قائمتي المفضلة ({formatArabicNumber(favorites.length)})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#645249] hover:text-[#2C1E18] rounded-lg hover:bg-[#F3ECE1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {favorites.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F3ECE1] text-[#8C6D36] flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-[#2C1E18]">
                قائمتكِ المفضلة فارغة حالياً
              </h4>
              <p className="text-xs text-[#645249] max-w-xs mx-auto leading-relaxed">
                انقري على رمز القلب بجوار أي باقة أو خدمة في الكتالوج لحفظها والرجوع لها لاحقاً.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#645249] pb-1">
                <span>الباقات المحفوظة:</span>
                <button
                  type="button"
                  onClick={onClearFavorites}
                  className="text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح الكل</span>
                </button>
              </div>

              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="p-4 bg-white rounded-xl border border-[#E6DCD2] shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36]">
                        {getCategoryLabel(fav.categoryKey)}
                      </span>
                      <h4 className="font-bold text-sm text-[#2C1E18]">
                        {fav.serviceName}
                      </h4>
                      {fav.packageName && (
                        <p className="text-xs text-[#645249] font-medium">
                          {fav.packageName}
                        </p>
                      )}
                      <div className="text-sm font-bold text-[#2C1E18] font-mono pt-1">
                        {formatSar(fav.priceSar)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveFavorite(fav.id)}
                      className="p-1.5 text-[#9C8980] hover:text-rose-600 transition-colors"
                      title="إزالة من المفضلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectServiceToBook(fav.serviceId, fav.packageId);
                      onClose();
                    }}
                    className="w-full py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>احجزي هذه الباقة الآن</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. CART / BOOKING INQUIRIES DRAWER
// ============================================================================

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  navigate: (view: PageView) => void;
  onSelectServiceToBook: (serviceId: string, packageId?: string) => void;
  settings: SiteSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveFromCart,
  onClearCart,
  navigate,
  onSelectServiceToBook,
  settings
}) => {
  if (!isOpen) return null;

  const totalSar = cartItems.reduce((acc, curr) => acc + curr.priceSar, 0);

  const handleProceedToCheckout = () => {
    onClose();
    if (cartItems.length > 0) {
      const first = cartItems[0];
      onSelectServiceToBook(first.serviceId, first.packageId);
    } else {
      navigate('booking');
    }
  };

  const whatsappHref = buildWhatsAppLink(
    settings.whatsappLocal,
    `مرحباً فريق لومير، أود استكمال حجز الباقات المختارة بقيمة تقديرية ${totalSar} ريال في مكة أو جدة.`
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-start animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#FAF6F0] h-full shadow-2xl flex flex-col border-l border-[#E6DCD2] text-[#2C1E18] animate-slideInRight"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E6DCD2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#8C6D36]" />
            <h3 className="font-display font-bold text-lg text-[#2C1E18]">
              سلة الباقات والحجوزات ({formatArabicNumber(cartItems.length)})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#645249] hover:text-[#2C1E18] rounded-lg hover:bg-[#F3ECE1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#F3ECE1] text-[#8C6D36] flex items-center justify-center mx-auto">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-base text-[#2C1E18]">
                سلة طلباتكِ فارغة حالياً
              </h4>
              <p className="text-xs text-[#645249] max-w-xs mx-auto leading-relaxed">
                اختاري أي باقة من كتالوج خدمات لومير لتجهيز تفاصيل مناسبتكِ في مكة أو جدة.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('catalog');
                }}
                className="px-5 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-lg hover:bg-[#422E25] transition-colors mt-2"
              >
                استعراض كتالوج الخدمات
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#645249] pb-1">
                <span>الباقات والخدمات المحددة:</span>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>تفريغ السلة</span>
                </button>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-white rounded-xl border border-[#E6DCD2] shadow-xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3ECE1] text-[#8C6D36]">
                      {getCategoryLabel(item.categoryKey)}
                    </span>
                    <h4 className="font-bold text-sm text-[#2C1E18]">
                      {item.serviceName}
                    </h4>
                    {item.packageName && (
                      <p className="text-xs text-[#645249] font-medium">
                        {item.packageName}
                      </p>
                    )}
                    {item.deliveryTimeframe && (
                      <div className="flex items-center gap-1 text-[11px] text-[#8C6D36]">
                        <Clock className="w-3 h-3" />
                        <span>مدة التسليم: {item.deliveryTimeframe}</span>
                      </div>
                    )}
                    <div className="text-sm font-bold text-[#2C1E18] font-mono pt-1">
                      {formatSar(item.priceSar)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFromCart(item.id)}
                    className="p-1.5 text-[#9C8980] hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="p-3 bg-[#F8F3EC] rounded-xl text-xs text-[#645249] border border-[#E6DCD2] space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#8C6D36] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>خدمة مخصصة لمكة المكرمة وجدة فقط</span>
                </div>
                <p className="text-[11px]">
                  يتم تأكيد توافر الموعد والموقع بدقة من فريق العمليات بعد إرسال الطلب.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-[#E6DCD2] bg-white space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#645249] font-medium">المجموع التقديري:</span>
              <span className="font-bold text-lg text-[#2C1E18] font-mono">
                {formatSar(totalSar)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 text-sm font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>متابعة وإتمام طلب الحجز</span>
              <ArrowLeft className="w-4 h-4" />
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 text-xs font-medium border border-[#25D366] text-[#128C7E] bg-[#25D366]/10 rounded-xl hover:bg-[#25D366]/20 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>استفسار فوري عبر واتساب</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 4. CUSTOMER ACCOUNT / QUICK ORDER LOOKUP MODAL
// ============================================================================

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingSubmission[];
  navigate: (view: PageView) => void;
  settings: SiteSettings;
  onRateBooking?: (booking: BookingSubmission) => void;
}

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  bookings,
  navigate,
  settings,
  onRateBooking
}) => {
  const [searchKey, setSearchKey] = useState('');
  const [foundBookings, setFoundBookings] = useState<BookingSubmission[] | null>(null);

  if (!isOpen) return null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchKey.trim().toLowerCase();
    if (!term) return;

    const matched = bookings.filter(
      (b) =>
        b.referenceCode.toLowerCase().includes(term) ||
        b.clientPhone.replace(/\D/g, '').includes(term.replace(/\D/g, ''))
    );
    setFoundBookings(matched);
  };

  const statusArabic: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودة مبدئية', color: 'bg-stone-100 text-stone-700' },
    pending_review: { label: 'قيد مراجعة الإدارة', color: 'bg-amber-100 text-amber-800' },
    pending_client_confirmation: { label: 'بانتظار تأكيد العميل', color: 'bg-blue-100 text-blue-800' },
    confirmed: { label: 'موعد مؤكد رسمياً', color: 'bg-emerald-100 text-emerald-800' },
    in_progress: { label: 'جاري تنفيذ المناسبة', color: 'bg-purple-100 text-purple-800' },
    completed: { label: 'مناسبة مكتملة', color: 'bg-teal-100 text-teal-800' },
    cancelled: { label: 'طلب ملغي', color: 'bg-rose-100 text-rose-800' }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF6F0] rounded-2xl shadow-2xl border border-[#E6DCD2] overflow-hidden flex flex-col text-[#2C1E18]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E6DCD2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F3ECE1] text-[#8C6D36] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-[#2C1E18]">
                حساب العميل وتتبع الحجوزات
              </h3>
              <p className="text-xs text-[#8C6D36]">
                تتبعي حالة طلبكِ برقم الجوال أو الرمز المرجعي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#645249] hover:text-[#2C1E18] rounded-lg hover:bg-[#F3ECE1] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search form */}
        <div className="p-5 border-b border-[#E6DCD2] bg-[#FAF6F0]">
          <form onSubmit={handleLookup} className="space-y-3">
            <label className="block text-xs font-bold text-[#5C4940]">
              أدخلي رقم الجوال (مثل 05XXXXXXXX) أو الرمز المرجعي (LMR-XXXX):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                placeholder="05XXXXXXXX أو LMR-2610-101"
                className="flex-1 p-3 bg-white rounded-xl border border-[#E6DCD2] text-sm focus:outline-none focus:border-[#8C6D36] text-[#2C1E18]"
              />
              <button
                type="submit"
                className="px-5 py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors whitespace-nowrap cursor-pointer"
              >
                بحث
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-3">
          {foundBookings === null ? (
            <div className="text-center py-6 space-y-2 text-xs text-[#645249]">
              <Calendar className="w-8 h-8 text-[#C8A96E] mx-auto opacity-60" />
              <p>ابحثي لعرض حجوزاتكِ السابقة وحالة المراجعة والتنفيذ والتقييم.</p>
            </div>
          ) : foundBookings.length === 0 ? (
            <div className="text-center py-6 space-y-2 text-xs text-rose-700 bg-rose-50 p-4 rounded-xl border border-rose-200">
              <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
              <p className="font-bold">لم نجد حجوزات مسجلة بهذه البيانات</p>
              <p className="text-[11px] text-[#645249]">
                تأكدي من رقم الجوال أو تواصلي مباشرة مع خدمة العملاء للمساعدة.
              </p>
            </div>
          ) : (
            foundBookings.map((bk) => {
              const st = statusArabic[bk.status] || {
                label: bk.status,
                color: 'bg-stone-100 text-stone-700'
              };
              return (
                <div
                  key={bk.id}
                  className="p-4 bg-white rounded-xl border border-[#E6DCD2] shadow-xs space-y-2.5 text-right"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#8C6D36]">
                      {bk.referenceCode}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${st.color}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#2C1E18]">
                      {bk.serviceName}
                    </h4>
                    {bk.packageName && (
                      <p className="text-xs text-[#645249]">{bk.packageName}</p>
                    )}
                  </div>

                  <div className="text-xs text-[#645249] flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8C6D36]" />
                      {bk.city} — {bk.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8C6D36]" />
                      {bk.eventDate}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E6DCD2] flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#2C1E18]">
                      {formatSar(bk.estimatedTotalSar)}
                    </span>
                    <div className="flex items-center gap-2">
                      {onRateBooking && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onRateBooking(bk);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FAF6F0] border border-[#D8CBB8] text-[#8C6D36] hover:bg-[#F3ECE1] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3 fill-[#8C6D36]" />
                          <span>تقييم الخدمة</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate('booking-status');
                        }}
                        className="text-xs text-[#8C6D36] font-bold hover:underline"
                      >
                        التفاصيل ←
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Staff portal toggle */}
        <div className="p-4 bg-[#F3ECE1] border-t border-[#E6DCD2] flex items-center justify-between text-xs text-[#645249]">
          <span>هل أنتِ من طاقم إدارة لومير؟</span>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('admin');
            }}
            className="px-3 py-1.5 rounded-lg bg-[#2C1E18] text-[#FAF6F0] font-medium hover:bg-[#422E25] transition-colors"
          >
            دخول لوحة الإدارة
          </button>
        </div>
      </div>
    </div>
  );
};
