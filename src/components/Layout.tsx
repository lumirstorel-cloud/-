import React, { useState } from 'react';
import {
  AnnouncementBarSettings,
  BookingSubmission,
  CartItem,
  FavoriteItem,
  PageView,
  ServiceItem,
  SiteSettings
} from '../types';
import { buildWhatsAppLink, formatArabicNumber } from '../utils/formatters';
import { AnnouncementBar } from './AnnouncementBar';
import {
  CustomerAccountModal,
  CartDrawer,
  FavoritesDrawer,
  SearchModal
} from './HeaderModals';
import {
  Menu,
  X,
  MessageCircle,
  ShieldCheck,
  Search,
  Heart,
  ShoppingBag,
  User,
  Sparkles,
  Camera,
  Palette,
  Users,
  HeartHandshake,
  MapPin,
  ChevronDown,
  Home,
  Image as ImageIcon,
  CalendarCheck
} from 'lucide-react';

interface LayoutProps {
  currentView: PageView;
  navigate: (view: PageView) => void;
  settings: SiteSettings;
  announcements?: AnnouncementBarSettings;
  services?: ServiceItem[];
  bookings?: BookingSubmission[];
  favorites?: FavoriteItem[];
  onRemoveFavorite?: (id: string) => void;
  onClearFavorites?: () => void;
  cartItems?: CartItem[];
  onRemoveFromCart?: (id: string) => void;
  onClearCart?: () => void;
  onSelectServiceToBook?: (serviceId: string, packageId?: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  navigate,
  settings,
  announcements,
  services = [],
  bookings = [],
  favorites = [],
  onRemoveFavorite = () => {},
  onClearFavorites = () => {},
  cartItems = [],
  onRemoveFromCart = () => {},
  onClearCart = () => {},
  onSelectServiceToBook = () => {},
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [favoritesDrawerOpen, setFavoritesDrawerOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);

  const handleNav = (v: PageView) => {
    navigate(v);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const whatsappHref = buildWhatsAppLink(
    settings.whatsappLocal || '0579105700',
    'مرحباً فريق لومير (LUMIR)، أود الاستفسار عن باقات وخدمات المناسبات في مكة أو جدة.'
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#2C1E18] pb-20 xl:pb-0" dir="rtl">
      {/* 1. Top Announcement Bar */}
      {announcements && (
        <AnnouncementBar settings={announcements} navigate={navigate} />
      )}

      {/* 2. Main Responsive Luxury Header */}
      <header className="sticky top-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-b border-[#E6DCD2] shadow-xs">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          {/* Right Zone: Brand Wordmark & Tagline */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNav('home')}
              className="text-right cursor-pointer group flex flex-col items-start"
            >
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#2C1E18] group-hover:text-[#8C6D36] transition-colors whitespace-nowrap">
                LUMIR | لومير
              </span>
              <span className="text-[10px] text-[#8C6D36] tracking-normal hidden sm:block">
                «{settings.slogan || 'نضيء لياليك وفرحة صغارك'}»
              </span>
            </button>
          </div>

          {/* Center Zone: Main Navigation Links */}
          <nav
            aria-label="التنقل الرئيسي"
            className="hidden xl:flex items-center gap-6 text-sm font-medium text-[#645249]"
          >
            <button
              type="button"
              onClick={() => handleNav('home')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'home'
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              الرئيسية
            </button>
            <button
              type="button"
              onClick={() => handleNav('catalog')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                ['catalog', 'service-detail'].includes(currentView)
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              كتالوج الخدمات
            </button>
            <button
              type="button"
              onClick={() => handleNav('gallery')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'gallery'
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              معرض الأعمال
            </button>
            <button
              type="button"
              onClick={() => handleNav('mobile-photography')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'mobile-photography'
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              تصوير الجوال
            </button>
            <button
              type="button"
              onClick={() => handleNav('kids-corner')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'kids-corner'
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              ركن الأطفال
            </button>
            <button
              type="button"
              onClick={() => handleNav('childcare')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'childcare'
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              مرافقة الأطفال
            </button>
            <button
              type="button"
              onClick={() => handleNav('wedding-support')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'wedding-support'
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              مساندة الأفراح
            </button>
            <button
              type="button"
              onClick={() => handleNav('booking-status')}
              className={`hover:text-[#2C1E18] transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'booking-status'
                  ? 'text-[#2C1E18] font-bold border-b-2 border-[#C8A96E]'
                  : ''
              }`}
            >
              تتبع الحجز
            </button>
          </nav>

          {/* Left Zone: Action Icons & Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Quick Search */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              aria-label="البحث السريع في الخدمات والباقات"
              className="p-2 sm:p-2.5 text-[#2C1E18] hover:text-[#8C6D36] hover:bg-[#F3ECE1] rounded-full transition-colors cursor-pointer relative"
              title="بحث سريع"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist / Favorites */}
            <button
              type="button"
              onClick={() => setFavoritesDrawerOpen(true)}
              aria-label="قائمة المفضلة"
              className="p-2 sm:p-2.5 text-[#2C1E18] hover:text-rose-600 hover:bg-[#F3ECE1] rounded-full transition-colors cursor-pointer relative"
              title="المفضلة"
            >
              <Heart className="w-5 h-5" />
              {favorites.length > 0 && (
                <span className="absolute top-1 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center font-mono shadow-xs">
                  {formatArabicNumber(favorites.length)}
                </span>
              )}
            </button>

            {/* Cart / Booking Inquiries */}
            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label="سلة الحجوزات"
              className="p-2 sm:p-2.5 text-[#2C1E18] hover:text-[#8C6D36] hover:bg-[#F3ECE1] rounded-full transition-colors cursor-pointer relative"
              title="سلة الباقات والحجوزات"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItems.length > 0 && (
                <span className="absolute top-1 -right-0.5 w-4 h-4 rounded-full bg-[#8C6D36] text-white text-[10px] font-bold flex items-center justify-center font-mono shadow-xs">
                  {formatArabicNumber(cartItems.length)}
                </span>
              )}
            </button>

            {/* Customer Account & Booking Tracker */}
            <button
              type="button"
              onClick={() => setAccountModalOpen(true)}
              aria-label="حساب العميل وتتبع الطلبات"
              className="p-2 sm:p-2.5 text-[#2C1E18] hover:text-[#8C6D36] hover:bg-[#F3ECE1] rounded-full transition-colors cursor-pointer"
              title="حساب العميل"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Primary CTA button */}
            <button
              type="button"
              onClick={() => handleNav('booking')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-[#FAF6F0] bg-[#2C1E18] rounded-xl hover:bg-[#422E25] transition-all duration-200 shadow-sm hover:shadow cursor-pointer whitespace-nowrap"
            >
              <span>احجزي مناسبتكِ</span>
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((p) => !p)}
              aria-label="القائمة الرئيسية"
              className="xl:hidden p-2 text-[#2C1E18] hover:bg-[#F3ECE1] rounded-xl transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-[#E6DCD2] bg-[#FAF6F0] px-5 py-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6DCD2]">
              <span className="text-xs font-bold text-[#8C6D36]">أقسام وتصفح لومير:</span>
              <button
                type="button"
                onClick={() => handleNav('booking')}
                className="px-3.5 py-1.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-lg"
              >
                طلب حجز جديد
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => handleNav('home')}
                className={`text-right py-2 px-3 rounded-lg font-medium transition-colors ${
                  currentView === 'home' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                الرئيسية
              </button>
              <button
                type="button"
                onClick={() => handleNav('catalog')}
                className={`text-right py-2 px-3 rounded-lg font-medium transition-colors ${
                  currentView === 'catalog' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                كتالوج الخدمات
              </button>
              <button
                type="button"
                onClick={() => handleNav('gallery')}
                className={`text-right py-2 px-3 rounded-lg font-medium transition-colors ${
                  currentView === 'gallery' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                🖼️ معرض الأعمال
              </button>
              <button
                type="button"
                onClick={() => handleNav('mobile-photography')}
                className={`text-right py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'mobile-photography' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                📸 تصوير بالجوال (٤٨ ساعة)
              </button>
              <button
                type="button"
                onClick={() => handleNav('kids-corner')}
                className={`text-right py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'kids-corner' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                🎨 ركن الأطفال والأنشطة
              </button>
              <button
                type="button"
                onClick={() => handleNav('childcare')}
                className={`text-right py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'childcare' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                🧸 مشرفات رعاية الأطفال
              </button>
              <button
                type="button"
                onClick={() => handleNav('wedding-support')}
                className={`text-right py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'wedding-support' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                💍 مساندة وتنظيم الأفراح
              </button>
              <button
                type="button"
                onClick={() => handleNav('booking-status')}
                className={`text-right py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'booking-status' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                🔍 تتبع حالة الطلب
              </button>
              <button
                type="button"
                onClick={() => handleNav('faq')}
                className={`text-right py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                  currentView === 'faq' ? 'bg-[#EAE2D5] font-bold text-[#2C1E18]' : 'hover:bg-[#F3ECE1]'
                }`}
              >
                ❓ الأسئلة الشائعة
              </button>
              <button
                type="button"
                onClick={() => handleNav('about')}
                className="text-right py-2 px-3 rounded-lg text-xs font-medium hover:bg-[#F3ECE1]"
              >
                🏛️ من نحن
              </button>
              <button
                type="button"
                onClick={() => handleNav('contact')}
                className="text-right py-2 px-3 rounded-lg text-xs font-medium hover:bg-[#F3ECE1]"
              >
                📞 تواصلي معنا
              </button>
            </div>

            <div className="pt-3 border-t border-[#E6DCD2] flex items-center justify-between text-xs text-[#645249]">
              <span>المدن المخدومة: مكة المكرمة وجدة فقط</span>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1F5E3B] font-bold flex items-center gap-1 hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 3. Quick Categories & Service Strip */}
      <div className="bg-[#F3ECE1]/90 border-b border-[#E6DCD2] py-2 px-4 sm:px-6 overflow-x-auto select-none">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-4 text-xs text-[#5C4940]">
          <div className="flex items-center gap-2 sm:gap-3 whitespace-nowrap">
            <span className="text-[#8C6D36] font-bold hidden md:inline">
              تصنيفات لومير السريعة:
            </span>

            <button
              type="button"
              onClick={() => handleNav('catalog')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'catalog'
                  ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                  : 'bg-white/80 hover:bg-white text-[#2C1E18]'
              }`}
            >
              <span>الكل</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('mobile-photography')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'mobile-photography'
                  ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                  : 'bg-white/80 hover:bg-white text-[#2C1E18]'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#8C6D36]" />
              <span>تصوير الجوال (من ٣٥٠ ر.س)</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('kids-corner')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'kids-corner'
                  ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                  : 'bg-white/80 hover:bg-white text-[#2C1E18]'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-[#4E8A8A]" />
              <span>ركن الأطفال (رسم، طين، وجه، حناء)</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('childcare')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'childcare'
                  ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                  : 'bg-white/80 hover:bg-white text-[#2C1E18]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#8C6D36]" />
              <span>مشرفات رعاية الأطفال</span>
            </button>

            <button
              type="button"
              onClick={() => handleNav('wedding-support')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'wedding-support'
                  ? 'bg-[#2C1E18] text-[#FAF6F0] font-bold'
                  : 'bg-white/80 hover:bg-white text-[#2C1E18]'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#A35D6A]" />
              <span>تنظيم ومساندة الأفراح</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-3 whitespace-nowrap text-xs text-[#645249]">
            <span className="flex items-center gap-1 text-[#8C6D36] font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>مكة المكرمة وجدة فقط</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>تسليم ٤٨ ساعة</span>
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1">{children}</main>

      {/* Interactive Header Modals & Drawers */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        services={services}
        navigate={handleNav}
        onSelectServiceToBook={onSelectServiceToBook}
      />

      <FavoritesDrawer
        isOpen={favoritesDrawerOpen}
        onClose={() => setFavoritesDrawerOpen(false)}
        favorites={favorites}
        onRemoveFavorite={onRemoveFavorite}
        onClearFavorites={onClearFavorites}
        onSelectServiceToBook={onSelectServiceToBook}
      />

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cartItems={cartItems}
        onRemoveFromCart={onRemoveFromCart}
        onClearCart={onClearCart}
        navigate={handleNav}
        onSelectServiceToBook={onSelectServiceToBook}
        settings={settings}
      />

      <CustomerAccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        bookings={bookings}
        navigate={handleNav}
        settings={settings}
      />

      {/* Footer */}
      <footer className="bg-[#231712] text-[#FAF6F0] border-t border-[#3B2921] pt-14 pb-12 px-6">
        <div className="max-w-[1240px] mx-auto space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Col 1: Brand */}
            <div className="space-y-3">
              <span className="font-display text-2xl font-bold tracking-tight text-[#FAF6F0] block">
                LUMIR | لومير
              </span>
              <p className="text-xs text-[#C8A96E]">«{settings.slogan}»</p>
              <p className="text-xs text-[#C7B8A8] leading-relaxed">
                علامة تجارية سعودية متخصصة في توثيق المناسبات بالجوال، أركان الأطفال الإبداعية،
                ومساندة الأفراح برقي وخصوصية تامة في مكة المكرمة وجدة.
              </p>
              <div className="pt-2 text-xs text-[#9E8C7C]">
                <span>نطاق الخدمة: مكة المكرمة وجدة فقط</span>
              </div>
            </div>

            {/* Col 2: Services */}
            <div className="space-y-3">
              <h3 className="font-display text-lg text-[#FAF6F0]">خدماتنا المعتمدة</h3>
              <ul className="space-y-2 text-xs text-[#C7B8A8]">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('mobile-photography')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    تصوير المناسبات بالجوال (٤٨ ساعة)
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('kids-corner')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    ركن الأطفال والأنشطة الترفيهية
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('childcare')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    رعاية ومرافقة الأطفال أثناء المناسبات
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('wedding-support')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    خدمات مساندة وتنظيم الأفراح
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('catalog')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    استعراض الكتالوج والأسعار بالكامل
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Links */}
            <div className="space-y-3">
              <h3 className="font-display text-lg text-[#FAF6F0]">الروابط والسياسات</h3>
              <ul className="space-y-2 text-xs text-[#C7B8A8]">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('booking-status')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    الاستعلام عن حالة الطلب
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('about')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    من نحن ورؤيتنا
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('faq')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    الأسئلة الشائعة
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('privacy')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    سياسة الخصوصية وحماية الأطفال
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNav('terms')}
                    className="hover:text-[#FAF6F0] cursor-pointer"
                  >
                    الشروط والأحكام وسياسة الإلغاء
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Contact */}
            <div className="space-y-3">
              <h3 className="font-display text-lg text-[#FAF6F0]">التواصل والحجوزات</h3>
              <div className="space-y-1.5 text-xs text-[#C7B8A8]">
                <p>
                  واتساب:{' '}
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C8A96E] font-mono hover:underline"
                    dir="ltr"
                  >
                    {settings.whatsappLocal}
                  </a>
                </p>
                <p>البريد: {settings.email}</p>
                <p>الدوام: {settings.workingHours}</p>
              </div>
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-[#C8A96E] text-[#231712] rounded-lg hover:bg-[#D5B982] transition-colors whitespace-nowrap shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>محادثة واتساب فورية</span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9E8C7C] border-t border-[#3B2921]">
            <p>
              © {new Date().getFullYear()} LUMIR | لومير. جميع الحقوق محفوظة — مكة المكرمة وجدة،
              المملكة العربية السعودية.
            </p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => handleNav('privacy')}
                className="hover:text-[#FAF6F0] cursor-pointer"
              >
                الخصوصية
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => handleNav('terms')}
                className="hover:text-[#FAF6F0] cursor-pointer"
              >
                الشروط
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => handleNav('admin')}
                className="inline-flex items-center gap-1 text-[#C8A96E] hover:text-[#FAF6F0] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>لوحة تحكم الإدارة</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button (Positioned above mobile bottom bar) */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل مع لومير عبر واتساب"
        className="fixed bottom-20 xl:bottom-6 left-4 xl:left-6 z-40 inline-flex items-center gap-2 bg-[#1F5E3B] hover:bg-[#18492E] text-[#FAF6F0] px-4 py-3 rounded-full shadow-xl transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border border-[#FAF6F0]/20"
      >
        <MessageCircle className="w-5 h-5 shrink-0" />
        <span className="text-xs font-bold hidden sm:inline">تواصلي عبر واتساب</span>
      </a>

      {/* 3. Luxury Mobile Bottom Navigation Bar (xl:hidden) */}
      <nav
        aria-label="شريط التنقل السفلي للجوال"
        className="xl:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FAF6F0]/95 backdrop-blur-md border-t border-[#E6DCD2] px-3 py-2 shadow-2xl flex items-center justify-around text-[10px] font-bold"
      >
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentView === 'home'
              ? 'text-[#2C1E18] font-black'
              : 'text-[#645249] hover:text-[#2C1E18]'
          }`}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'text-[#C8A96E]' : ''}`} />
          <span>الرئيسية</span>
        </button>

        {/* 2. Catalog */}
        <button
          type="button"
          onClick={() => handleNav('catalog')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            ['catalog', 'service-detail'].includes(currentView)
              ? 'text-[#2C1E18] font-black'
              : 'text-[#645249] hover:text-[#2C1E18]'
          }`}
        >
          <ShoppingBag
            className={`w-5 h-5 ${
              ['catalog', 'service-detail'].includes(currentView) ? 'text-[#C8A96E]' : ''
            }`}
          />
          <span>الكتالوج</span>
        </button>

        {/* 3. Gallery */}
        <button
          type="button"
          onClick={() => handleNav('gallery')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentView === 'gallery'
              ? 'text-[#2C1E18] font-black'
              : 'text-[#645249] hover:text-[#2C1E18]'
          }`}
        >
          <ImageIcon className={`w-5 h-5 ${currentView === 'gallery' ? 'text-[#C8A96E]' : ''}`} />
          <span>المعرض</span>
        </button>

        {/* 4. Wishlist / Favorites */}
        <button
          type="button"
          onClick={() => setFavoritesDrawerOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer text-[#645249] hover:text-[#2C1E18] relative"
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {favorites.length > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center font-mono">
                {formatArabicNumber(favorites.length)}
              </span>
            )}
          </div>
          <span>المفضلة</span>
        </button>

        {/* 5. Track Order */}
        <button
          type="button"
          onClick={() => handleNav('booking-status')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-colors cursor-pointer ${
            currentView === 'booking-status'
              ? 'text-[#2C1E18] font-black'
              : 'text-[#645249] hover:text-[#2C1E18]'
          }`}
        >
          <CalendarCheck
            className={`w-5 h-5 ${currentView === 'booking-status' ? 'text-[#C8A96E]' : ''}`}
          />
          <span>تتبع الحجز</span>
        </button>
      </nav>
    </div>
  );
};
