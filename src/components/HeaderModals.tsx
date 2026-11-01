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
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { trackGuestBookingApi } from '../utils/apiClient';
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
  navigate,
  settings,
  onRateBooking
}) => {
  const { user, logout, openAuthModal, signInWithGoogle } = useCustomerAuth();
  const [searchRef, setSearchRef] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedBooking, setSearchedBooking] = useState<BookingSubmission | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);

    const ref = searchRef.trim().toUpperCase();
    const phone = searchPhone.trim();

    if (!ref || !phone) {
      setSearchError('يرجى إدخال الرقم المرجعي ورقم الجوال المسجل معاً للتحقق من ملكية الحجز.');
      return;
    }

    setIsSearching(true);
    try {
      const res = await trackGuestBookingApi(ref, phone);
      if (res.success && res.booking) {
        setSearchedBooking(res.booking);
        setSearchError(null);
      } else {
        setSearchedBooking(null);
        setSearchError(
          res.error ||
            'تعذر العثور على حجز يطابق هذا الرقم المرجعي ورقم الجوال معاً. يرجى التأكد من البيانات.'
        );
      }
    } catch {
      setSearchedBooking(null);
      setSearchError('حدث خطأ أثناء الاستعلام، يرجى المحاولة لاحقاً.');
    } finally {
      setIsSearching(false);
    }
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
                {user ? 'حساب العميل المسجل' : 'تتبع الحجوزات وحساب العميل'}
              </h3>
              <p className="text-xs text-[#8C6D36]">
                {user ? user.email : 'استعلام آمن بالرقم المرجعي ورقم الجوال معاً'}
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

        {/* User is logged in: direct dashboard link */}
        {user ? (
          <div className="p-6 space-y-4 bg-white text-right">
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-1">
              <div className="text-xs text-[#8C6D36] font-medium">مرحباً بكِ في لومير</div>
              <h4 className="font-display font-bold text-lg text-[#2C1E18]">
                {user.name || 'عميل لومير المميّز'}
              </h4>
              <p className="text-xs text-[#645249]">{user.email}</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('customer-account');
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>الانتقال إلى صفحة «طلباتي» وحسابي</span>
                <ChevronLeft className="w-4 h-4 text-[#C8A96E]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-800 text-xs font-bold hover:bg-rose-50 transition-colors cursor-pointer"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Quick login header for guests */}
            <div className="p-4 bg-[#F3ECE1]/70 border-b border-[#E6DCD2] space-y-2.5 text-right">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#2C1E18]">
                  لديكِ حساب مسجل في لومير؟
                </span>
                <span className="text-[10px] text-[#8C6D36] bg-[#FAF6F0] px-2 py-0.5 rounded-full font-bold">
                  تتبع تلقائي
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    signInWithGoogle('/customer-account');
                  }}
                  className="flex-1 py-2 px-3 text-xs font-bold bg-white hover:bg-[#FAF6F0] text-[#2C1E18] border border-[#D8CBB8] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    openAuthModal('customer-account');
                  }}
                  className="flex-1 py-2 px-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer text-center"
                >
                  البريد الإلكتروني
                </button>
              </div>
            </div>

            {/* Secure dual-field search form */}
            <div className="p-5 border-b border-[#E6DCD2] bg-[#FAF6F0] text-right">
              <form onSubmit={handleLookup} className="space-y-3">
                <span className="block text-xs font-bold text-[#2C1E18]">
                  أو استعلمي كضيف (يلزم مطابقة الرقم المرجعي ورقم الجوال):
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={searchRef}
                    onChange={(e) => setSearchRef(e.target.value)}
                    placeholder="الرقم المرجعي (مثال: LMR-2610-XXXX)"
                    required
                    className="w-full p-2.5 bg-white rounded-xl border border-[#E6DCD2] text-xs font-mono font-bold focus:outline-none focus:border-[#8C6D36] text-[#2C1E18]"
                  />
                  <input
                    type="tel"
                    dir="ltr"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="رقم الجوال المسجل (مثال: 05XXXXXXXX)"
                    required
                    className="w-full p-2.5 bg-white rounded-xl border border-[#E6DCD2] text-xs font-mono focus:outline-none focus:border-[#8C6D36] text-[#2C1E18]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Search className="w-3.5 h-3.5 text-[#C8A96E]" />
                  <span>{isSearching ? 'جاري التحقق...' : 'استعلام وتحقق'}</span>
                </button>
              </form>
            </div>

            {/* Results Section */}
            <div className="p-5 max-h-[45vh] overflow-y-auto space-y-3">
              {searchError ? (
                <div className="text-center py-4 space-y-1 text-xs text-rose-800 bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <AlertCircle className="w-5 h-5 mx-auto text-rose-600" />
                  <p className="font-bold">{searchError}</p>
                </div>
              ) : searchedBooking ? (
                <div className="p-4 bg-white rounded-xl border border-[#E6DCD2] shadow-xs space-y-2.5 text-right">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#8C6D36]">
                      {searchedBooking.referenceCode}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        statusArabic[searchedBooking.status]?.color ||
                        'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {statusArabic[searchedBooking.status]?.label || searchedBooking.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[#2C1E18]">
                      {searchedBooking.serviceName}
                    </h4>
                    {searchedBooking.packageName && (
                      <p className="text-xs text-[#645249]">{searchedBooking.packageName}</p>
                    )}
                  </div>

                  <div className="text-xs text-[#645249] flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8C6D36]" />
                      {searchedBooking.city} — {searchedBooking.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#8C6D36]" />
                      {searchedBooking.eventDate}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E6DCD2] flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#2C1E18]">
                      {formatSar(searchedBooking.estimatedTotalSar || searchedBooking.subtotalSar)}
                    </span>
                    <div className="flex items-center gap-2">
                      {onRateBooking && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onRateBooking(searchedBooking);
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
                        عرض المسار الكامل ←
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 space-y-1 text-xs text-[#645249]">
                  <Calendar className="w-7 h-7 text-[#C8A96E] mx-auto opacity-70" />
                  <p>أدخلي الرقم المرجعي ورقم الجوال للتحقق وعرض تفاصيل مناسبتكِ بأمان.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
