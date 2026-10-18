import React, { useState, useMemo, useEffect } from 'react';
import {
  AdminRole,
  AdminUser,
  AnnouncementBarSettings,
  AuditLogEntry,
  BookingStatus,
  BookingSubmission,
  CityCoverageSetting,
  CouponItem,
  FAQItem,
  HeroBanner,
  HeroSliderSettings,
  LumirCentralData,
  PageView,
  PortfolioMediaItem,
  PricingModel,
  ServiceCategoryKey,
  ServiceItem,
  ServicePackage,
  SiteSettings
} from '../types';
import {
  buildBookingWhatsAppSummary,
  calculateEndTime,
  findBookingConflict,
  formatArabicDate,
  formatArabicNumber,
  formatArabicTime,
  formatSar,
  getCategoryLabel,
  getGalleryCategoryLabel,
  getPricingModelLabel,
  getStatusBadgeStyle,
  getStatusLabel
} from '../utils/formatters';
import {
  adminAddBannerApi,
  adminAddCouponApi,
  adminAddFAQApi,
  adminAddPackageApi,
  adminAddPortfolioApi,
  adminAddUserApi,
  adminDeleteBannerApi,
  adminDeleteBookingApi,
  adminDeleteCouponApi,
  adminDeleteFAQApi,
  adminDeletePackageApi,
  adminDeletePortfolioApi,
  adminDeleteUserApi,
  adminGetFullDataApi,
  adminLoginApi,
  adminSyncAllApi,
  adminUpdateAnnouncementsApi,
  adminUpdateBannerApi,
  adminUpdateBookingStatusApi,
  adminUpdateCityCoverageApi,
  adminUpdateCouponApi,
  adminUpdateFAQApi,
  adminUpdatePackageApi,
  adminUpdatePortfolioApi,
  adminUpdateServiceApi,
  adminUpdateSettingsApi,
  adminUpdateSliderSettingsApi,
  adminUpdateUserApi
} from '../utils/apiClient';
import {
  AlertCircle,
  Award,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Filter,
  HelpCircle,
  History,
  Image as ImageIcon,
  Layers,
  LayoutDashboard,
  Lock,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  User,
  Users,
  Video,
  X,
  Megaphone,
  SlidersHorizontal,
  Edit3,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Palette
} from 'lucide-react';

interface AdminDashboardProps {
  data: LumirCentralData;
  onSaveData: (updated: LumirCentralData) => void;
  onResetToDefaults: () => void;
  navigate: (v: PageView) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  onSaveData,
  onResetToDefaults,
  navigate
}) => {
  // Authentication State
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('lumir_admin_token') || null;
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('lumir_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Login Form States
  const [emailInput, setEmailInput] = useState<string>('lumir.store.l@gmail.com');
  const [passwordInput, setPasswordInput] = useState<string>('Lumir@2026');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Active Tab
  type AdminTab =
    | 'overview'
    | 'orders'
    | 'calendar'
    | 'services'
    | 'cities'
    | 'portfolio'
    | 'announcements'
    | 'faqs'
    | 'coupons'
    | 'settings'
    | 'audit'
    | 'roles';

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Editable Copies
  const [services, setServices] = useState<ServiceItem[]>(data.services || []);
  const [bookings, setBookings] = useState<BookingSubmission[]>(data.bookings || []);
  const [portfolio, setPortfolio] = useState<PortfolioMediaItem[]>(data.portfolio || []);
  const [faqs, setFaqs] = useState<FAQItem[]>(data.faqs || []);
  const [coupons, setCoupons] = useState<CouponItem[]>(data.coupons || []);
  const [settings, setSettings] = useState<SiteSettings>(data.settings);
  const [cityCoverage, setCityCoverage] = useState<CityCoverageSetting[]>(data.cityCoverage || []);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(data.auditLogs || []);
  const [adminsList, setAdminsList] = useState<AdminUser[]>(data.admins || []);
  const [banners, setBanners] = useState<HeroBanner[]>(data.banners || []);
  const [sliderSettings, setSliderSettings] = useState<HeroSliderSettings>(
    data.sliderSettings || {
      autoPlay: true,
      intervalSeconds: 3,
      pauseOnHover: true,
      showArrows: true,
      showIndicators: true
    }
  );
  const [announcements, setAnnouncements] = useState<AnnouncementBarSettings>(
    data.announcements || {
      isEnabled: true,
      bgColor: '#2C1E18',
      textColor: '#FAF6F0',
      accentColor: '#C8A96E',
      intervalSeconds: 3.5,
      isTicker: true,
      speed: 'normal',
      pauseOnHover: true,
      messages: []
    }
  );
  const [newAnnouncementBadge, setNewAnnouncementBadge] = useState('');
  const [newAnnouncementText, setNewAnnouncementText] = useState('');

  // Enhanced Announcements Management State
  const [showAddAnnouncementModal, setShowAddAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<{
    text: string;
    badge: string;
    linkTarget: string;
    linkText: string;
    isActive: boolean;
  }>({
    text: '',
    badge: '✨ عرض حصري',
    linkTarget: 'booking',
    linkText: 'احجزي الآن',
    isActive: true
  });
  const [previewTickerPaused, setPreviewTickerPaused] = useState(false);

  // Content Sub Tab ('faqs' | 'banners' | 'announcements')
  const [contentSubTab, setContentSubTab] = useState<'faqs' | 'banners' | 'announcements'>('faqs');

  // Confirmation Modal State (Replaces native browser alert/confirm)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'تأكيد الحذف',
    onConfirm: () => {}
  });

  // Package Management State
  const [editingPackage, setEditingPackage] = useState<{
    serviceId: string;
    package: ServicePackage;
    isNew?: boolean;
  } | null>(null);
  const [newFeatureText, setNewFeatureText] = useState('');

  // City Editing State
  const [editingCity, setEditingCity] = useState<CityCoverageSetting | null>(null);
  const [newDistrictInput, setNewDistrictInput] = useState('');

  // Banner Editing State
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [newBanner, setNewBanner] = useState<Partial<HeroBanner>>({
    title: '',
    subtitle: '',
    badge: '✨ لومير الفاخرة',
    desktopImageUrl: '/src/assets/images/lumir_hero_1792039742181.jpg',
    ctaText: 'استكشاف باقات لومير',
    ctaLink: 'catalog',
    textPosition: 'right',
    overlayDarkness: 0.35,
    displayOrder: 1,
    isActive: true
  });

  // Admin User & Roles Management State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: AdminRole;
    phone: string;
  }>({
    name: '',
    email: '',
    role: 'operations_manager',
    phone: ''
  });

  // FAQ Editing State
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);

  // Portfolio Editing State
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioMediaItem | null>(null);

  // Coupon Editing State
  const [editingCoupon, setEditingCoupon] = useState<CouponItem | null>(null);

  // Sync state with parent & server on mount if token exists
  useEffect(() => {
    if (token) {
      adminGetFullDataApi(token).then((res) => {
        if (res.success && res.data) {
          setServices(res.data.services || []);
          setBookings(res.data.bookings || []);
          setPortfolio(res.data.portfolio || []);
          setFaqs(res.data.faqs || []);
          setCoupons(res.data.coupons || []);
          setSettings(res.data.settings);
          setCityCoverage(res.data.cityCoverage || []);
          setAuditLogs(res.data.auditLogs || []);
          setAdminsList(res.data.admins || []);
          if (res.data.banners) setBanners(res.data.banners);
          if (res.data.sliderSettings) setSliderSettings(res.data.sliderSettings);
          if (res.data.announcements) setAnnouncements(res.data.announcements);
          onSaveData(res.data);
        }
      });
    }
  }, [token]);

  // Toast Helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await adminLoginApi(emailInput, passwordInput);
      if (res.success && res.token && res.user) {
        setToken(res.token);
        setCurrentUser(res.user);
        localStorage.setItem('lumir_admin_token', res.token);
        localStorage.setItem('lumir_admin_user', JSON.stringify(res.user));
        showToast(`مرحباً بكِ، ${res.user.name} (${getRoleLabel(res.user.role)})`);
      } else {
        setLoginError(res.error || 'فشل تسجيل الدخول. تحقق من بيانات الاعتماد.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'حدث خطأ في الاتصال');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('lumir_admin_token');
    localStorage.removeItem('lumir_admin_user');
    showToast('تم تسجيل الخروج بنجاح.');
  };

  // Save All Changes to Server & Local
  const handleSaveAllSync = async () => {
    if (!token) return;
    const fullData: LumirCentralData = {
      settings,
      services,
      bookings,
      portfolio,
      faqs,
      coupons,
      auditLogs,
      cityCoverage,
      admins: adminsList,
      announcements,
      banners,
      sliderSettings
    };
    onSaveData(fullData);
    const res = await adminSyncAllApi(token, fullData);
    if (res.success) {
      showToast('تم حفظ ومزامنة كافة التعديلات في قاعدة البيانات بنجاح!');
    } else {
      showToast(res.error || 'تعذر المزامنة الكاملة', 'error');
    }
  };

  // Helper Role Check
  const hasRole = (allowed: AdminRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return allowed.includes(currentUser.role);
  };

  // ================= TAB 1: OVERVIEW METRICS =================
  const metrics = useMemo(() => {
    const total = bookings.length;
    const pendingReview = bookings.filter((b) => b.status === 'pending_review').length;
    const pendingClient = bookings.filter((b) => b.status === 'pending_client_confirmation').length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const inProgress = bookings.filter((b) => b.status === 'in_progress').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const drafts = bookings.filter((b) => b.status === 'draft').length;

    const expectedRevenue = bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'draft')
      .reduce((sum, b) => sum + (b.estimatedTotalSar || b.subtotalSar || 0), 0);

    const makkahBookings = bookings.filter((b) => b.city === 'مكة المكرمة').length;
    const jeddahBookings = bookings.filter((b) => b.city === 'جدة').length;

    return {
      total,
      pendingReview,
      pendingClient,
      confirmed,
      inProgress,
      completed,
      cancelled,
      drafts,
      expectedRevenue,
      makkahBookings,
      jeddahBookings
    };
  }, [bookings]);

  // ================= TAB 2: ORDERS FILTERS & DETAIL MODAL =================
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<BookingSubmission | null>(null);

  const filteredOrders = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (cityFilter !== 'all' && b.city !== cityFilter) return false;
      if (categoryFilter !== 'all' && b.categoryKey !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          b.referenceCode.toLowerCase().includes(q) ||
          b.clientName.toLowerCase().includes(q) ||
          b.clientPhone.includes(q) ||
          b.district.toLowerCase().includes(q) ||
          (b.venueName && b.venueName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, cityFilter, categoryFilter, searchQuery]);

  // Update order status with permission check & conflict guard
  const handleUpdateOrderStatus = async (id: string, newStatus: BookingStatus) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'operations_manager'])) {
      showToast('ليس لديكِ صلاحية لتعديل حالة الطلبات (تتطلب رتبة مدير عام أو عمليات)', 'error');
      return;
    }

    const order = bookings.find((b) => b.id === id);
    if (!order) return;

    if (newStatus === 'confirmed') {
      const conflict = findBookingConflict(
        {
          eventDate: order.eventDate,
          startTime: order.startTime,
          durationHours: order.durationHours,
          categoryKey: order.categoryKey,
          city: order.city,
          excludeId: order.id
        },
        bookings
      );
      if (conflict) {
        setConfirmModal({
          isOpen: true,
          title: '⚠️ تنبيه تعارض في المواعيد',
          description: `يوجد موعد آخر مؤكد لنفس الخدمة (${conflict.referenceCode}) في تاريخ ${conflict.eventDate} الساعة ${conflict.startTime} بمدينة ${conflict.city}. هل ترغبين بتأكيد كلا الحجزين معاً؟`,
          confirmLabel: 'تأكيد الحجز رغم التعارض',
          onConfirm: async () => {
            const res = await adminUpdateBookingStatusApi(token, id, newStatus);
            if (res.success && res.booking) {
              const updated = bookings.map((b) => (b.id === id ? res.booking! : b));
              setBookings(updated);
              if (selectedOrder && selectedOrder.id === id) {
                setSelectedOrder(res.booking!);
              }
              showToast(`تم تأكيد الطلب بنجاح (مع تسجيل التعارض)`);
            } else {
              showToast(res.error || 'تعذر تحديث حالة الطلب', 'error');
            }
          }
        });
        return;
      }
    }

    const res = await adminUpdateBookingStatusApi(token, id, newStatus);
    if (res.success && res.booking) {
      const updated = bookings.map((b) => (b.id === id ? res.booking! : b));
      setBookings(updated);
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(res.booking!);
      }
      showToast(`تم تحديث حالة الطلب إلى «${getStatusLabel(newStatus)}»`);
    } else {
      showToast(res.error || 'تعذر تحديث حالة الطلب', 'error');
    }
  };

  // Delete Order with modal confirmation
  const handleDeleteOrder = (id: string) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('حذف الطلبات نهائياً متاح فقط للمدير العام (Super Admin)', 'error');
      return;
    }

    const order = bookings.find((b) => b.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'حذف طلب الحجز نهائياً',
      description: `هل أنتِ متأكدة تماماً من حذف الطلب رقم (${order?.referenceCode || ''}) الخاص بالعميل (${order?.clientName || ''}) نهائياً من قاعدة البيانات؟ لن يمكن استرجاع هذا الطلب.`,
      confirmLabel: 'تأكيد الحذف النهائي',
      onConfirm: async () => {
        const res = await adminDeleteBookingApi(token, id);
        if (res.success) {
          setBookings((prev) => prev.filter((b) => b.id !== id));
          if (selectedOrder && selectedOrder.id === id) setSelectedOrder(null);
          showToast('تم حذف الطلب بنجاح.');
        } else {
          showToast(res.error || 'تعذر حذف الطلب', 'error');
        }
      }
    });
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'الرقم المرجعي',
      'الحالة',
      'الخدمة',
      'الباقة',
      'المدينة',
      'الحي',
      'القاعة / الفندق',
      'تاريخ المناسبة',
      'وقت البداية',
      'عدد الساعات',
      'اسم العميل',
      'رقم الجوال',
      'وسيلة التواصل',
      'السعر التقديري (SAR)',
      'الرسوم المعتمدة (SAR)',
      'تاريخ تقديم الطلب'
    ];

    const rows = filteredOrders.map((b) => [
      b.referenceCode,
      getStatusLabel(b.status),
      b.serviceName,
      b.packageName || '—',
      b.city,
      b.district,
      b.venueName || '—',
      b.eventDate,
      b.startTime,
      b.durationHours,
      b.clientName,
      b.clientPhone,
      b.preferredContactMethod || 'whatsapp',
      b.estimatedTotalSar || b.subtotalSar,
      b.approvedFeesSar || 0,
      new Date(b.createdAt).toLocaleDateString('ar-SA')
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumir_orders_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('تم تصدير تقرير الطلبات إلى CSV بنجاح.');
  };

  // ================= TAB 3: CALENDAR STATE =================
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarCityFilter, setCalendarCityFilter] = useState<string>('all');
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState<string>('all');

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 1) % 7; // Saudi week starts Sat

  const arabicMonthName = new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    month: 'long',
    year: 'numeric'
  }).format(calendarDate);

  const weekDayNames = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  const formatDateISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const calendarFiltered = useMemo(() => {
    return bookings.filter((b) => {
      if (calendarCityFilter !== 'all' && b.city !== calendarCityFilter) return false;
      if (calendarCategoryFilter !== 'all' && b.categoryKey !== calendarCategoryFilter)
        return false;
      return true;
    });
  }, [bookings, calendarCityFilter, calendarCategoryFilter]);

  // Current week days starting Saturday
  const currentWeekDays = useMemo(() => {
    const current = new Date(calendarDate);
    const dayOfWeek = current.getDay();
    const diffToSaturday = (dayOfWeek + 1) % 7;
    const saturday = new Date(current);
    saturday.setDate(current.getDate() - diffToSaturday);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(saturday);
      d.setDate(saturday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [calendarDate]);

  // ================= TAB 4: SERVICES EDITING =================
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  const handleSaveService = async (srv: ServiceItem) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل الخدمات متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }

    const res = await adminUpdateServiceApi(token, srv.id, srv);
    if (res.success && res.service) {
      setServices(services.map((s) => (s.id === srv.id ? res.service! : s)));
      setEditingService(null);
      showToast('تم تحديث الخدمة بنجاح.');
    } else {
      showToast(res.error || 'تعذر تعديل الخدمة', 'error');
    }
  };

  // ================= TAB 6: PORTFOLIO MANAGEMENT =================
  const [newPortfolioItem, setNewPortfolioItem] = useState<Partial<PortfolioMediaItem>>({
    title: '',
    categoryKey: 'mobile_photography',
    mediaType: 'image',
    mediaUrl: '',
    caption: '',
    city: 'مكة المكرمة',
    isFeatured: false,
    isPublic: true,
    displayOrder: 1
  });
  const [showAddPortfolioModal, setShowAddPortfolioModal] = useState(false);

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPortfolioItem.title || !newPortfolioItem.mediaUrl) {
      showToast('يرجى إكمال عنوان العمل ورابط الصورة/الفيديو', 'error');
      return;
    }

    const res = await adminAddPortfolioApi(token, newPortfolioItem as any);
    if (res.success && res.item) {
      setPortfolio([...portfolio, res.item]);
      setShowAddPortfolioModal(false);
      setNewPortfolioItem({
        title: '',
        categoryKey: 'mobile_photography',
        mediaType: 'image',
        mediaUrl: '',
        caption: '',
        city: 'مكة المكرمة',
        isFeatured: false,
        isPublic: true,
        displayOrder: portfolio.length + 1
      });
      showToast('تمت إضافة العمل إلى المعرض بنجاح.');
    } else {
      showToast(res.error || 'تعذر إضافة العمل', 'error');
    }
  };

  const handleDeletePortfolio = (id: string) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('حذف الأعمال متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const item = portfolio.find((p) => p.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'حذف عمل من معرض الأعمال',
      description: `هل أنتِ متأكدة من حذف العمل «${item?.title || ''}» نهائياً من المعرض؟`,
      confirmLabel: 'حذف العمل',
      onConfirm: async () => {
        const res = await adminDeletePortfolioApi(token, id);
        if (res.success) {
          setPortfolio((prev) => prev.filter((p) => p.id !== id));
          showToast('تم حذف العمل بنجاح.');
        } else {
          showToast(res.error || 'تعذر الحذف', 'error');
        }
      }
    });
  };

  const handleUpdatePortfolio = async (item: PortfolioMediaItem) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل الأعمال متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const res = await adminUpdatePortfolioApi(token, item.id, item);
    if (res.success && res.item) {
      setPortfolio((prev) => prev.map((p) => (p.id === item.id ? res.item! : p)));
      setEditingPortfolioItem(null);
      showToast('تم تعديل بيانات العمل بنجاح.');
    } else {
      showToast(res.error || 'تعذر تعديل العمل', 'error');
    }
  };

  // ================= TAB 7: FAQ MANAGEMENT =================
  const [newFaq, setNewFaq] = useState<{ question: string; answer: string; category: string }>({
    question: '',
    answer: '',
    category: 'عام'
  });
  const [showAddFaqModal, setShowAddFaqModal] = useState(false);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFaq.question || !newFaq.answer) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('إضافة الأسئلة متاحة للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const res = await adminAddFAQApi(token, { ...newFaq, order: faqs.length + 1 });
    if (res.success && res.faq) {
      setFaqs([...faqs, res.faq]);
      setShowAddFaqModal(false);
      setNewFaq({ question: '', answer: '', category: 'عام' });
      showToast('تمت إضافة السؤال الشائع بنجاح.');
    } else {
      showToast(res.error || 'تعذر إضافة السؤال', 'error');
    }
  };

  const handleDeleteFaq = (id: string) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('حذف الأسئلة متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const faq = faqs.find((f) => f.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'حذف السؤال الشائع',
      description: `هل أنتِ متأكدة من حذف السؤال: «${faq?.question || ''}»؟`,
      confirmLabel: 'حذف السؤال',
      onConfirm: async () => {
        const res = await adminDeleteFAQApi(token, id);
        if (res.success) {
          setFaqs((prev) => prev.filter((f) => f.id !== id));
          showToast('تم حذف السؤال بنجاح.');
        } else {
          showToast(res.error || 'تعذر الحذف', 'error');
        }
      }
    });
  };

  const handleUpdateFaq = async (faq: FAQItem) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل الأسئلة متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const res = await adminUpdateFAQApi(token, faq.id, faq);
    if (res.success && res.faq) {
      setFaqs((prev) => prev.map((f) => (f.id === faq.id ? res.faq! : f)));
      setEditingFaq(null);
      showToast('تم تحديث السؤال الشائع بنجاح.');
    } else {
      showToast(res.error || 'تعذر تعديل السؤال', 'error');
    }
  };

  // ================= TAB 8: COUPONS MANAGEMENT =================
  const [newCoupon, setNewCoupon] = useState<Partial<CouponItem>>({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmountSar: 400,
    maxDiscountSar: 100,
    maxUses: 50,
    isActive: true
  });
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCoupon.code || !newCoupon.discountValue) return;
    if (!hasRole(['super_admin'])) {
      showToast('إدارة الكوبونات متاحة للمدير العام فقط', 'error');
      return;
    }

    const res = await adminAddCouponApi(token, newCoupon as any);
    if (res.success && res.coupon) {
      setCoupons([...coupons, res.coupon]);
      setShowAddCouponModal(false);
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmountSar: 400,
        maxDiscountSar: 100,
        maxUses: 50,
        isActive: true
      });
      showToast('تم إنشاء كود الخصم بنجاح.');
    } else {
      showToast(res.error || 'تعذر إنشاء الكوبون', 'error');
    }
  };

  const handleDeleteCoupon = (id: string) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('حذف الكوبونات متاح للمدير العام فقط', 'error');
      return;
    }
    const cp = coupons.find((c) => c.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'حذف كود الخصم',
      description: `هل أنتِ متأكدة من حذف كود الخصم (${cp?.code || ''})؟ لن يتمكن العملاء من استخدامه بعد الحذف.`,
      confirmLabel: 'حذف الكود',
      onConfirm: async () => {
        const res = await adminDeleteCouponApi(token, id);
        if (res.success) {
          setCoupons((prev) => prev.filter((c) => c.id !== id));
          showToast('تم حذف الكوبون بنجاح.');
        } else {
          showToast(res.error || 'تعذر الحذف', 'error');
        }
      }
    });
  };

  const handleToggleCoupon = async (id: string, currentActive: boolean) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('تعديل حالة الكوبونات متاح للمدير العام فقط', 'error');
      return;
    }
    const res = await adminUpdateCouponApi(token, id, { isActive: !currentActive });
    if (res.success && res.coupon) {
      setCoupons((prev) => prev.map((c) => (c.id === id ? res.coupon! : c)));
      showToast(`تم ${!currentActive ? 'تفعيل' : 'تعطيل'} كود الخصم بنجاح.`);
    } else {
      showToast(res.error || 'تعذر تغيير حالة الكوبون', 'error');
    }
  };

  const handleUpdateCoupon = async (coupon: CouponItem) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('تعديل الكوبونات متاح للمدير العام فقط', 'error');
      return;
    }
    const res = await adminUpdateCouponApi(token, coupon.id, coupon);
    if (res.success && res.coupon) {
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.coupon! : c)));
      setEditingCoupon(null);
      showToast('تم حفظ تعديلات كود الخصم بنجاح.');
    } else {
      showToast(res.error || 'تعذر تعديل الكوبون', 'error');
    }
  };

  // ================= ADMIN USERS & ROLES HANDLERS =================
  const handleAddAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newUser.name || !newUser.email) {
      showToast('يرجى إدخال اسم المسؤول وبريده الإلكتروني', 'error');
      return;
    }
    if (!hasRole(['super_admin'])) {
      showToast('إضافة المسؤولين متاحة للمدير العام فقط', 'error');
      return;
    }

    const res = await adminAddUserApi(token, newUser);
    if (res.success && res.user) {
      setAdminsList((prev) => [...prev, res.user!]);
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', role: 'operations_manager', phone: '' });
      showToast(`تمت إضافة المسؤول ${res.user.name} بنجاح.`);
    } else {
      showToast(res.error || 'تعذر إضافة المسؤول', 'error');
    }
  };

  const handleUpdateAdminUser = async (user: AdminUser) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('تعديل صلاحيات المسؤولين متاح للمدير العام فقط', 'error');
      return;
    }
    const res = await adminUpdateUserApi(token, user.id, user);
    if (res.success && res.user) {
      setAdminsList((prev) => prev.map((u) => (u.id === user.id ? res.user! : u)));
      setEditingUser(null);
      showToast('تم تحديث بيانات ورتبة المسؤول بنجاح.');
    } else {
      showToast(res.error || 'تعذر تعديل المسؤول', 'error');
    }
  };

  const handleToggleAdminActive = async (user: AdminUser) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('تعديل حالة حساب المسؤول متاح للمدير العام فقط', 'error');
      return;
    }
    if (currentUser?.id === user.id) {
      showToast('لا يمكنكِ تعطيل حسابكِ الحالي', 'error');
      return;
    }
    const res = await adminUpdateUserApi(token, user.id, { isActive: !user.isActive });
    if (res.success && res.user) {
      setAdminsList((prev) => prev.map((u) => (u.id === user.id ? res.user! : u)));
      showToast(`تم ${!user.isActive ? 'تنشيط' : 'تعطيل'} حساب المسؤول بنجاح.`);
    } else {
      showToast(res.error || 'تعذر تغيير حالة الحساب', 'error');
    }
  };

  const handleDeleteAdminUser = (user: AdminUser) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('حذف حسابات المسؤولين متاح للمدير العام فقط', 'error');
      return;
    }
    if (currentUser?.id === user.id) {
      showToast('لا يمكنكِ حذف حسابكِ الشخصي الحالي المسجل به الدخول', 'error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'حذف حساب مسؤول',
      description: `هل أنتِ متأكدة من حذف حساب المسؤول «${user.name}» (${user.email}) نهائياً؟`,
      confirmLabel: 'تأكيد حذف الحساب',
      onConfirm: async () => {
        const res = await adminDeleteUserApi(token, user.id);
        if (res.success) {
          setAdminsList((prev) => prev.filter((u) => u.id !== user.id));
          showToast('تم حذف حساب المسؤول بنجاح.');
        } else {
          showToast(res.error || 'تعذر حذف الحساب', 'error');
        }
      }
    });
  };

  // ================= PACKAGES HANDLERS =================
  const handleOpenAddPackage = (serviceId: string) => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('إدارة الباقات متاحة للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    setEditingPackage({
      serviceId,
      isNew: true,
      package: {
        id: `pkg-${Date.now()}`,
        name: '',
        durationHours: 4,
        price: 400,
        deliveryTimeframe: '٤٨ ساعة',
        popular: false,
        features: ['تغطية متواصلة بمستوى فاخر', 'تسليم سريع خلال ٤٨ ساعة']
      }
    });
  };

  const handleOpenEditPackage = (serviceId: string, pkg: ServicePackage) => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('إدارة الباقات متاحة للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    setEditingPackage({
      serviceId,
      isNew: false,
      package: { ...pkg, features: [...pkg.features] }
    });
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingPackage) return;
    const { serviceId, package: pkg, isNew } = editingPackage;
    if (!pkg.name || !pkg.price) {
      showToast('يرجى ملء اسم الباقة وسعرها', 'error');
      return;
    }

    if (isNew) {
      const res = await adminAddPackageApi(token, serviceId, pkg);
      if (res.success && res.package) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId ? { ...s, packages: [...s.packages, res.package] } : s
          )
        );
        setEditingPackage(null);
        showToast('تمت إضافة الباقة الجديدة بنجاح.');
      } else {
        showToast(res.error || 'تعذر إضافة الباقة', 'error');
      }
    } else {
      const res = await adminUpdatePackageApi(token, serviceId, pkg.id, pkg);
      if (res.success) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId
              ? { ...s, packages: s.packages.map((p) => (p.id === pkg.id ? pkg : p)) }
              : s
          )
        );
        setEditingPackage(null);
        showToast('تم تحديث بيانات الباقة بنجاح.');
      } else {
        showToast(res.error || 'تعذر تحديث الباقة', 'error');
      }
    }
  };

  const handleDeletePackagePrompt = (serviceId: string, packageId: string, packageName: string) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('حذف الباقات متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الباقة',
      description: `هل أنتِ متأكدة من حذف باقة «${packageName}» من هذه الخدمة؟`,
      confirmLabel: 'حذف الباقة',
      onConfirm: async () => {
        const res = await adminDeletePackageApi(token, serviceId, packageId);
        if (res.success) {
          setServices((prev) =>
            prev.map((s) =>
              s.id === serviceId
                ? { ...s, packages: s.packages.filter((p) => p.id !== packageId) }
                : s
            )
          );
          showToast('تم حذف الباقة بنجاح.');
        } else {
          showToast(res.error || 'تعذر حذف الباقة', 'error');
        }
      }
    });
  };

  // ================= CITY COVERAGE HANDLERS =================
  const handleSaveCityCoverage = async (updatedCoverage: CityCoverageSetting[]) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'operations_manager'])) {
      showToast('تعديل تغطية المدن متاح للمدير العام ومديرة العمليات فقط', 'error');
      return;
    }
    const res = await adminUpdateCityCoverageApi(token, updatedCoverage);
    if (res.success) {
      setCityCoverage(updatedCoverage);
      setEditingCity(null);
      showToast('تم حفظ نطاق تغطية المدن بنجاح.');
    } else {
      showToast(res.error || 'تعذر حفظ تغطية المدن', 'error');
    }
  };

  // ================= BANNERS & SLIDER HANDLERS =================
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newBanner.title || !newBanner.desktopImageUrl) {
      showToast('يرجى ملء عنوان البنر ورابط الصورة', 'error');
      return;
    }
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('إدارة البنرات متاحة للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const res = await adminAddBannerApi(token, newBanner);
    if (res.success && res.banner) {
      setBanners([...banners, res.banner]);
      setShowAddBannerModal(false);
      setNewBanner({
        title: '',
        subtitle: '',
        badge: '✨ لومير الفاخرة',
        desktopImageUrl: '/src/assets/images/lumir_hero_1792039742181.jpg',
        ctaText: 'استكشاف باقات لومير',
        ctaLink: 'catalog',
        textPosition: 'right',
        overlayDarkness: 0.35,
        displayOrder: banners.length + 1,
        isActive: true
      });
      showToast('تمت إضافة البنر بنجاح.');
    } else {
      showToast(res.error || 'تعذر إضافة البنر', 'error');
    }
  };

  const handleUpdateBanner = async (banner: HeroBanner) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('إدارة البنرات متاحة للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const res = await adminUpdateBannerApi(token, banner.id, banner);
    if (res.success && res.banner) {
      setBanners(banners.map((b) => (b.id === banner.id ? res.banner! : b)));
      setEditingBanner(null);
      showToast('تم تعديل البنر بنجاح.');
    } else {
      showToast(res.error || 'تعذر تعديل البنر', 'error');
    }
  };

  const handleDeleteBannerPrompt = (id: string, title: string) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('حذف البنرات متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف البنر الرئيسي',
      description: `هل أنتِ متأكدة من إزالة البنر «${title}» من سلايدر الصفحة الرئيسية؟`,
      confirmLabel: 'حذف البنر',
      onConfirm: async () => {
        const res = await adminDeleteBannerApi(token, id);
        if (res.success) {
          setBanners(banners.filter((b) => b.id !== id));
          showToast('تم حذف البنر بنجاح.');
        } else {
          showToast(res.error || 'تعذر حذف البنر', 'error');
        }
      }
    });
  };

  const handleSaveSliderSettings = async () => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل إعدادات السلايدر متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const res = await adminUpdateSliderSettingsApi(token, sliderSettings);
    if (res.success && res.sliderSettings) {
      setSliderSettings(res.sliderSettings);
      showToast('تم حفظ إعدادات السلايدر بنجاح.');
    } else {
      showToast(res.error || 'تعذر حفظ إعدادات السلايدر', 'error');
    }
  };

  const handleSaveAnnouncements = async (updated: AnnouncementBarSettings) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل الشريط الإعلاني متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const res = await adminUpdateAnnouncementsApi(token, updated);
    if (res.success && res.announcements) {
      setAnnouncements(res.announcements);
      onSaveData({
        ...data,
        announcements: res.announcements
      });
      showToast('تم حفظ وتحديث نصوص وإعدادات الشريط العلوي المتحرك بنجاح.');
    } else {
      showToast(res.error || 'تعذر حفظ الشريط الإعلاني', 'error');
    }
  };

  const handleOpenAddAnnouncement = () => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('إضافة نصوص الشريط متاحة للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    setEditingAnnouncement(null);
    setAnnouncementForm({
      text: '',
      badge: '✨ عرض حصري',
      linkTarget: 'booking',
      linkText: 'احجزي الآن',
      isActive: true
    });
    setShowAddAnnouncementModal(true);
  };

  const handleOpenEditAnnouncement = (msg: any) => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل نصوص الشريط متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    setEditingAnnouncement(msg);
    setAnnouncementForm({
      text: msg.text,
      badge: msg.badge || '',
      linkTarget: msg.linkTarget || 'booking',
      linkText: msg.linkText || 'احجزي الآن',
      isActive: msg.isActive !== false
    });
    setShowAddAnnouncementModal(true);
  };

  const handleSaveAnnouncementModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.text.trim()) {
      showToast('يرجى كتابة نص الإعلان أو التنبيه', 'error');
      return;
    }
    let updatedMessages: any[];
    if (editingAnnouncement) {
      updatedMessages = announcements.messages.map((m) =>
        m.id === editingAnnouncement.id
          ? {
              ...m,
              text: announcementForm.text.trim(),
              badge: announcementForm.badge.trim() || undefined,
              linkTarget: announcementForm.linkTarget.trim() || undefined,
              linkText: announcementForm.linkText.trim() || undefined,
              isActive: announcementForm.isActive
            }
          : m
      );
    } else {
      const newMsg = {
        id: `msg-${Date.now()}`,
        text: announcementForm.text.trim(),
        badge: announcementForm.badge.trim() || undefined,
        linkTarget: announcementForm.linkTarget.trim() || undefined,
        linkText: announcementForm.linkText.trim() || undefined,
        isActive: announcementForm.isActive
      };
      updatedMessages = [...announcements.messages, newMsg];
    }
    const updated = {
      ...announcements,
      messages: updatedMessages
    };
    setAnnouncements(updated);
    setShowAddAnnouncementModal(false);
    setEditingAnnouncement(null);
    await handleSaveAnnouncements(updated);
  };

  const handleToggleAnnouncementActive = async (id: string) => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل حالة النصوص متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const updatedMessages = announcements.messages.map((m) =>
      m.id === id ? { ...m, isActive: !m.isActive } : m
    );
    const updated = { ...announcements, messages: updatedMessages };
    setAnnouncements(updated);
    await handleSaveAnnouncements(updated);
  };

  const handleMoveAnnouncement = async (index: number, direction: 'up' | 'down') => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('ترتيب الرسائل متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= announcements.messages.length) return;
    const msgs = [...announcements.messages];
    const temp = msgs[index];
    msgs[index] = msgs[targetIndex];
    msgs[targetIndex] = temp;
    const updated = { ...announcements, messages: msgs };
    setAnnouncements(updated);
    await handleSaveAnnouncements(updated);
  };

  const handleDeleteAnnouncementPrompt = (id: string, text: string) => {
    if (!token) return;
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('حذف نصوص الشريط متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'حذف نص من الشريط المتحرك',
      description: `هل أنتِ متأكدة من حذف هذا النص من الشريط المتحرك: «${text.slice(0, 50)}»؟`,
      confirmLabel: 'تأكيد الحذف',
      onConfirm: async () => {
        const updatedMessages = announcements.messages.filter((m) => m.id !== id);
        const updated = { ...announcements, messages: updatedMessages };
        setAnnouncements(updated);
        await handleSaveAnnouncements(updated);
      }
    });
  };

  const handleApplyColorTheme = async (bg: string, text: string, accent: string) => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تغيير الألوان متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const updated = {
      ...announcements,
      bgColor: bg,
      textColor: text,
      accentColor: accent
    };
    setAnnouncements(updated);
    await handleSaveAnnouncements(updated);
  };

  const handleApplySpeed = async (speed: 'slow' | 'normal' | 'fast', intervalSeconds: number) => {
    if (!hasRole(['super_admin', 'content_editor'])) {
      showToast('تعديل السرعة متاح للمدير العام ومسؤول المحتوى فقط', 'error');
      return;
    }
    const updated = {
      ...announcements,
      speed,
      intervalSeconds
    };
    setAnnouncements(updated);
    await handleSaveAnnouncements(updated);
  };

  // ================= TAB 9: SETTINGS UPDATE =================
  const handleUpdateSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('تعديل الإعدادات العامة متاح للمدير العام فقط', 'error');
      return;
    }

    const res = await adminUpdateSettingsApi(token, settings);
    if (res.success && res.settings) {
      setSettings(res.settings);
      showToast('تم حفظ إعدادات المتجر وبيانات التواصل بنجاح.');
    } else {
      showToast(res.error || 'تعذر حفظ الإعدادات', 'error');
    }
  };

  // Role Labels Helper
  function getRoleLabel(role: AdminRole): string {
    switch (role) {
      case 'super_admin':
        return 'المديرة العامة (Super Admin)';
      case 'operations_manager':
        return 'مشرفة العمليات والمواعيد';
      case 'content_editor':
        return 'مسؤولة المحتوى والكتالوج';
      default:
        return role;
    }
  }

  function getRoleBadgeStyle(role: AdminRole): string {
    switch (role) {
      case 'super_admin':
        return 'bg-[#2C1E18] text-[#C8A96E] border border-[#C8A96E]/40';
      case 'operations_manager':
        return 'bg-[#1F5E3B] text-[#FAF6F0] border border-[#B6DFC2]';
      case 'content_editor':
        return 'bg-[#B76E00] text-[#FAF6F0] border border-[#FFE0A3]';
      default:
        return 'bg-[#F3ECE1] text-[#2C1E18]';
    }
  }

  // ================= LOGIN SCREEN =================
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-[#F3ECE1] flex items-center justify-center p-6">
        <div className="max-w-[460px] w-full p-8 rounded-3xl bg-[#FAF6F0] border-2 border-[#D8CBB8] space-y-7 shadow-xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[#2C1E18] border border-[#C8A96E] flex items-center justify-center mx-auto text-[#C8A96E] shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="text-xs font-bold text-[#8C6D36] tracking-wider">
              بوابة الدخول المركزية الموحدة
            </div>
            <h1 className="font-display text-3xl font-bold text-[#2C1E18]">
              إدارة LUMIR | لومير
            </h1>
            <p className="text-xs text-[#645249] leading-relaxed">
              تسجيل دخول آمن للمسؤولين بصلاحيات مشفرة ومحمية على مستوى الخادم.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2C1E18]">البريد الإلكتروني</label>
              <input
                type="email"
                required
                dir="ltr"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="lumir.store.l@gmail.com"
                className="w-full px-4 py-2.5 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono focus:outline-none focus:border-[#2C1E18]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2C1E18]">كلمة المرور</label>
              <input
                type="password"
                required
                dir="ltr"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Lumir@2026"
                className="w-full px-4 py-2.5 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono focus:outline-none focus:border-[#2C1E18]"
              />
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-[#FDF2F2] border border-[#E5B8B8] text-xs font-medium text-[#8A2626] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#C8A96E]" />
                  <span>جاري التحقق من الصلاحيات...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#C8A96E]" />
                  <span>تسجيل الدخول الآمن</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Buttons */}
          <div className="p-4 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-2.5 text-xs">
            <span className="font-bold text-[#2C1E18] block text-[11px]">
              تجربة سريعة للأدوار والصلاحيات (اضغطي للتعبئة):
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmailInput('lumir.store.l@gmail.com');
                  setPasswordInput('Lumir@2026');
                }}
                className="text-right p-2 rounded-lg bg-[#FAF6F0] hover:bg-white text-[11px] text-[#2C1E18] border border-[#D8CBB8] cursor-pointer flex items-center justify-between"
              >
                <span>👑 <strong>المديرة العامة (Super Admin)</strong></span>
                <span className="font-mono text-[#8C6D36]">lumir.store.l@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailInput('ops@lumir.sa');
                  setPasswordInput('Lumir@2026');
                }}
                className="text-right p-2 rounded-lg bg-[#FAF6F0] hover:bg-white text-[11px] text-[#2C1E18] border border-[#D8CBB8] cursor-pointer flex items-center justify-between"
              >
                <span>📅 <strong>مشرفة العمليات والمواعيد</strong></span>
                <span className="font-mono text-[#8C6D36]">ops@lumir.sa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmailInput('media@lumir.sa');
                  setPasswordInput('Lumir@2026');
                }}
                className="text-right p-2 rounded-lg bg-[#FAF6F0] hover:bg-white text-[11px] text-[#2C1E18] border border-[#D8CBB8] cursor-pointer flex items-center justify-between"
              >
                <span>🎨 <strong>مسؤولة المحتوى والكتالوج</strong></span>
                <span className="font-mono text-[#8C6D36]">media@lumir.sa</span>
              </button>
            </div>
            <div className="text-[10px] text-[#7A685F] text-center pt-1">
              كلمة المرور الموحدة: <code className="font-mono font-bold">Lumir@2026</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= MAIN DEDICATED ADMIN PORTAL =================
  return (
    <div className="min-h-screen bg-[#F3ECE1] text-[#2C1E18] flex flex-col antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border transition-all ${
            toastMessage.type === 'error'
              ? 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8]'
              : 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2]'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 bg-[#2C1E18] text-[#FAF6F0] border-b border-[#C8A96E]/20 px-6 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/10 text-white cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl font-bold tracking-wider text-[#FAF6F0]">
              LUMIR
            </span>
            <span className="text-xs text-[#C8A96E] font-medium hidden sm:inline">
              | لوحة الإدارة المستقلة
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Public Store link */}
          <button
            type="button"
            onClick={() => navigate('home')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-[#FAF6F0] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#C8A96E]" />
            <span className="hidden sm:inline">معاينة المتجر للزوار</span>
          </button>

          {/* Save All Sync Button */}
          {hasRole(['super_admin']) && (
            <button
              type="button"
              onClick={handleSaveAllSync}
              className="px-4 py-1.5 rounded-xl bg-[#1F5E3B] hover:bg-[#18492E] text-xs font-bold text-[#FAF6F0] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#C8A96E]" />
              <span className="hidden sm:inline">حفظ ومزامنة شاملة</span>
            </button>
          )}

          {/* User Profile Badge */}
          <div className="flex items-center gap-2.5 pl-2 border-r border-white/15">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold">{currentUser.name}</div>
              <div className="text-[10px] text-[#C8A96E]">{getRoleLabel(currentUser.role)}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FAF6F0] text-[#2C1E18] font-bold flex items-center justify-center text-xs shadow-sm">
              {currentUser.name.charAt(0)}
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white/10 hover:bg-[#8A2626] text-white transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar (RTL, right-aligned) */}
        <aside
          className={`fixed inset-y-16 right-0 z-30 w-64 bg-[#FAF6F0] border-l border-[#D8CBB8] flex flex-col justify-between p-4 transition-transform duration-300 md:static md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          }`}
        >
          <div className="space-y-1 overflow-y-auto">
            {/* Admin User Info Card */}
            <div className="p-3.5 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-1 mb-3">
              <div className="text-[11px] text-[#8C6D36] font-bold">المسؤول النشط:</div>
              <div className="font-bold text-xs truncate">{currentUser.name}</div>
              <div className="text-[10px] font-mono text-[#645249] truncate">{currentUser.email}</div>
              <div className="pt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${getRoleBadgeStyle(
                    currentUser.role
                  )}`}
                >
                  {getRoleLabel(currentUser.role)}
                </span>
              </div>
            </div>

            {/* Nav Menu */}
            {[
              { id: 'overview', label: 'الرئيسية والإحصائيات', icon: LayoutDashboard },
              {
                id: 'orders',
                label: 'الطلبات والحجوزات',
                icon: FileSpreadsheet,
                badge: metrics.pendingReview > 0 ? metrics.pendingReview : undefined
              },
              { id: 'calendar', label: 'تقويم المواعيد والتعارض', icon: CalendarIcon },
              { id: 'services', label: 'الخدمات والباقات والأسعار', icon: Layers },
              { id: 'cities', label: 'تغطية مكة وجدة', icon: MapPin },
              { id: 'portfolio', label: 'معرض الأعمال (صور وفيديو)', icon: ImageIcon },
              { id: 'announcements', label: 'الشريط العلوي المتحرك', icon: Megaphone },
              { id: 'faqs', label: 'محتوى المتجر والأسئلة', icon: HelpCircle },
              { id: 'coupons', label: 'الخصومات والكوبونات', icon: Percent },
              { id: 'settings', label: 'إعدادات واتساب والتواصل', icon: Settings },
              { id: 'audit', label: 'سجل التغييرات والأسعار', icon: History },
              { id: 'roles', label: 'الأدوار والصلاحيات', icon: Users }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as AdminTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2C1E18] text-[#FAF6F0] shadow-sm'
                      : 'text-[#5C4940] hover:bg-[#F3ECE1] hover:text-[#2C1E18]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-[#C8A96E]' : 'text-[#8C6D36]'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="w-5 h-5 rounded-full bg-[#B76E00] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reset button at bottom */}
          {hasRole(['super_admin']) && (
            <div className="pt-3 border-t border-[#E6DCD2]">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'هل ترغبين باستعادة البيانات الافتراضية الأولية لعلامة لومير؟'
                    )
                  ) {
                    onResetToDefaults();
                    showToast('تمت استعادة البيانات الافتراضية.');
                  }
                }}
                className="w-full py-2 rounded-xl border border-dashed border-[#8C6D36] text-[11px] font-bold text-[#8C6D36] hover:bg-[#F3ECE1] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة البيانات الافتراضية</span>
              </button>
            </div>
          )}
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
          {/* ================= 1. OVERVIEW TAB ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-8 max-w-[1240px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    لوحة المتابعة التشغيلية
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    موجز شامل لحالات طلبات المناسبات، الإيرادات التقديرية، والجاهزية في مكة وجدة.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="px-4 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:bg-[#422E25]"
                  >
                    <Plus className="w-4 h-4 text-[#C8A96E]" />
                    <span>مراجعة الطلبات الجديدة ({metrics.pendingReview})</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* 1. Pending Review */}
                <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#FFE0A3] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#B76E00]">
                    <span className="text-xs font-bold">بانتظار المراجعة</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-3xl font-bold text-[#B76E00]">
                    {formatArabicNumber(metrics.pendingReview)}
                  </div>
                  <div className="text-[10px] text-[#7A4B00]">تتطلب فحص التوفر والاتصال</div>
                </div>

                {/* 2. Confirmed */}
                <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#B6DFC2] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#1F5E3B]">
                    <span className="text-xs font-bold">طلبات مؤكدة</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-3xl font-bold text-[#1F5E3B]">
                    {formatArabicNumber(metrics.confirmed)}
                  </div>
                  <div className="text-[10px] text-[#18492E]">مثبتة في جدول التقويم</div>
                </div>

                {/* 3. In Progress & Completed */}
                <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#DAC3F9] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#6B32B3]">
                    <span className="text-xs font-bold">مكتملة / قيد التنفيذ</span>
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-3xl font-bold text-[#6B32B3]">
                    {formatArabicNumber(metrics.completed + metrics.inProgress)}
                  </div>
                  <div className="text-[10px] text-[#55278F]">تم تنفيذها أو قيد التغطية</div>
                </div>

                {/* 4. Cancelled */}
                <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E5B8B8] shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-[#8A2626]">
                    <span className="text-xs font-bold">طلبات ملغاة</span>
                    <X className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-3xl font-bold text-[#8A2626]">
                    {formatArabicNumber(metrics.cancelled)}
                  </div>
                  <div className="text-[10px] text-[#6E1D1D]">تم الاعتذار أو الإلغاء</div>
                </div>
              </div>

              {/* Financial & City Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl bg-[#2C1E18] text-[#FAF6F0] space-y-3">
                  <div className="flex items-center justify-between text-[#C8A96E]">
                    <span className="text-xs font-bold">إجمالي الإيرادات المتوقعة</span>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="font-mono text-3xl font-bold text-[#FAF6F0]">
                    {formatSar(metrics.expectedRevenue)}
                  </div>
                  <div className="text-[11px] text-[#FAF6F0]/75">
                    مجموع الطلبات المعتمدة وقيد المراجعة في مكة وجدة.
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] space-y-3">
                  <span className="text-xs font-bold text-[#8C6D36]">توزيع الطلبات حسب المدينة</span>
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span>مكة المكرمة:</span>
                      <span className="font-mono text-[#2C1E18]">
                        {formatArabicNumber(metrics.makkahBookings)} مناسبة
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-bold">
                      <span>جدة:</span>
                      <span className="font-mono text-[#2C1E18]">
                        {formatArabicNumber(metrics.jeddahBookings)} مناسبة
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] space-y-3">
                  <span className="text-xs font-bold text-[#8C6D36]">جاهزية الفرق والخدمات</span>
                  <div className="text-xs space-y-1.5 text-[#645249]">
                    <div>• مصورات الجوال المعتمدات: <strong>نشط</strong></div>
                    <div>• مشرفات ركن وإشراف الأطفال: <strong>نشط</strong></div>
                    <div>• تنظيم ومساندة الأفراح: <strong>نشط</strong></div>
                  </div>
                </div>
              </div>

              {/* Top Moving Ticker Quick Control Bar in Overview */}
              <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2C1E18] text-[#C8A96E] flex items-center justify-center shrink-0 shadow-xs">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#2C1E18]">الشريط العلوي المتحرك (Marquee Ticker):</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${announcements.isEnabled ? 'bg-[#EDF7F0] text-[#1F5E3B]' : 'bg-[#FDF2F2] text-[#8A2626]'}`}>
                        {announcements.isEnabled ? 'مفعّل ويعمل الآن' : 'معطّل ومخفي'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#645249] mt-0.5">
                      يحتوي على <strong className="text-[#2C1E18]">{announcements.messages.filter(m => m.isActive).length}</strong> نصوص نشطة تتحرك بانسيابية في أعلى الموقع أمام الزوار.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('announcements')}
                    className="px-4 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#C8A96E]" />
                    <span>تعديل نصوص وإعدادات الشريط</span>
                  </button>
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8C6D36]" />
                    <span className="font-bold text-xs text-[#2C1E18]">
                      آخر التعديلات وسجل التدقيق في النظام
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className="text-xs font-bold text-[#8C6D36] hover:underline cursor-pointer"
                  >
                    عرض السجل كاملاً
                  </button>
                </div>

                <div className="space-y-2.5">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#F3ECE1]/70 border border-[#E6DCD2] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <strong className="text-[#2C1E18] ml-2">{log.action}</strong>
                        <span className="text-[#645249]">{log.details}</span>
                      </div>
                      <div className="text-[11px] text-[#8C6D36] font-mono shrink-0">
                        {log.adminName} · {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. ORDERS MANAGEMENT TAB ================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    إدارة طلبات المناسبات ({filteredOrders.length})
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    متابعة شاملة لجميع الطلبات وتغيير الحالات والتواصل مع العميل عبر واتساب وتصدير CSV.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-4 py-2.5 rounded-xl border border-[#D8CBB8] bg-[#FAF6F0] hover:bg-[#F3ECE1] text-xs font-bold text-[#2C1E18] flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4 text-[#8C6D36]" />
                  <span>تصدير تقرير CSV</span>
                </button>
              </div>

              {/* Filters Header */}
              <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
                <div className="sm:col-span-5 space-y-1">
                  <label className="block font-bold text-[#645249]">
                    بحث بالرقم المرجعي، الاسم، الجوال، أو القاعة:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="اكتبي للبحث الفوري..."
                      className="w-full px-3 py-2.5 pr-8 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                    />
                    <Search className="w-4 h-4 text-[#8C6D36] absolute right-2.5 top-3" />
                  </div>
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="block font-bold text-[#645249]">الحالة:</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                  >
                    <option value="all">كافة الحالات (٧ حالات)</option>
                    <option value="draft">مسودة</option>
                    <option value="pending_review">بانتظار المراجعة</option>
                    <option value="pending_client_confirmation">بانتظار تأكيد العميل</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="in_progress">جارٍ التنفيذ</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-bold text-[#645249]">المدينة:</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                  >
                    <option value="all">كافة المدن</option>
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="جدة">جدة</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block font-bold text-[#645249]">الخدمة:</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                  >
                    <option value="all">كل الخدمات</option>
                    <option value="mobile_photography">تصوير الجوال</option>
                    <option value="kids_corner">ركن الأطفال</option>
                    <option value="childcare">رعاية الأطفال</option>
                    <option value="wedding_support">مساندة وتنظيم</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F3ECE1] text-[#2C1E18] font-bold border-b border-[#E6DCD2]">
                      <tr>
                        <th className="p-3.5">الرقم المرجعي</th>
                        <th className="p-3.5">الخدمة والباقة</th>
                        <th className="p-3.5">المدينة والحي</th>
                        <th className="p-3.5">الموعد والتوقيت</th>
                        <th className="p-3.5">العميل والجوال</th>
                        <th className="p-3.5">السعر التقديري</th>
                        <th className="p-3.5">الحالة</th>
                        <th className="p-3.5">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DCD2]">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-[#7A685F]">
                            لا توجد طلبات مطابقة للمعايير المحددة.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-[#F3ECE1]/40 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-[#2C1E18]">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="hover:underline text-right cursor-pointer"
                              >
                                {order.referenceCode}
                              </button>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-[#2C1E18]">{order.serviceName}</div>
                              {order.packageName && (
                                <div className="text-[11px] text-[#645249]">
                                  {order.packageName}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="font-medium text-[#2C1E18]">{order.city}</div>
                              <div className="text-[11px] text-[#645249]">{order.district}</div>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <div className="font-bold text-[#2C1E18]">
                                {formatArabicDate(order.eventDate)}
                              </div>
                              <div className="text-[11px] text-[#645249]">
                                من {formatArabicTime(order.startTime)} ({order.durationHours} س)
                              </div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-[#2C1E18]">{order.clientName}</div>
                              <div className="font-mono-num text-[11px] text-[#645249]" dir="ltr">
                                {order.clientPhone}
                              </div>
                            </td>
                            <td className="p-3.5 font-mono-num font-bold text-[#8C6D36]">
                              {formatSar(order.estimatedTotalSar || order.subtotalSar)}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-bold ${getStatusBadgeStyle(
                                  order.status
                                )}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrder(order)}
                                  className="p-1.5 rounded-lg border border-[#D8CBB8] hover:bg-[#F3ECE1] cursor-pointer"
                                  title="عرض كامل التفاصيل"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#2C1E18]" />
                                </button>

                                <a
                                  href={buildBookingWhatsAppSummary(order, settings.whatsappLocal)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-[#25D366] text-white hover:bg-[#1EBE5D] transition-colors"
                                  title="مراسلة العميل عبر واتساب"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>

                                {hasRole(['super_admin']) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="p-1.5 rounded-lg border border-[#E5B8B8] hover:bg-[#FDF2F2] text-[#8A2626] cursor-pointer"
                                    title="حذف الطلب نهائياً"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Order Detail Modal / Drawer */}
              {selectedOrder && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
                    >
                      <X className="w-5 h-5 text-[#2C1E18]" />
                    </button>

                    <div className="border-b border-[#E6DCD2] pb-4">
                      <div className="text-xs text-[#8C6D36] font-bold">ملف تفاصيل طلب الحجز</div>
                      <div className="flex items-center gap-3 mt-1">
                        <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
                          {selectedOrder.referenceCode}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full border text-xs font-bold ${getStatusBadgeStyle(
                            selectedOrder.status
                          )}`}
                        >
                          {getStatusLabel(selectedOrder.status)}
                        </span>
                      </div>
                      <div className="text-xs text-[#645249] mt-1">
                        تاريخ تقديم الطلب: {new Date(selectedOrder.createdAt).toLocaleString('ar-SA')}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-1.5">
                        <span className="text-[#8C6D36] block font-bold">بيانات العميل:</span>
                        <div className="font-bold text-[#2C1E18]">{selectedOrder.clientName}</div>
                        <div className="font-mono text-[#645249]" dir="ltr">
                          {selectedOrder.clientPhone}
                        </div>
                        <div className="text-[11px] text-[#645249]">
                          وسيلة التواصل المفضلة: <strong>{selectedOrder.preferredContactMethod}</strong>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-1.5">
                        <span className="text-[#8C6D36] block font-bold">المدينة والموقع:</span>
                        <div className="font-bold text-[#2C1E18]">
                          {selectedOrder.city} — حي {selectedOrder.district}
                        </div>
                        {selectedOrder.venueName && (
                          <div className="text-[#645249]">القاعة / الفندق: {selectedOrder.venueName}</div>
                        )}
                      </div>

                      <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-1.5">
                        <span className="text-[#8C6D36] block font-bold">الخدمة والتوقيت:</span>
                        <div className="font-bold text-[#2C1E18]">{selectedOrder.serviceName}</div>
                        {selectedOrder.packageName && (
                          <div className="text-[#645249]">{selectedOrder.packageName}</div>
                        )}
                        <div className="text-[#2C1E18]">
                          {formatArabicDate(selectedOrder.eventDate)} · من {formatArabicTime(selectedOrder.startTime)} ({selectedOrder.durationHours} س)
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-1.5">
                        <span className="text-[#8C6D36] block font-bold">السعر المالي:</span>
                        <div className="text-[#645249]">
                          الأساسي: {formatSar(selectedOrder.subtotalSar)}
                        </div>
                        {selectedOrder.approvedFeesSar > 0 && (
                          <div className="text-[#645249]">
                            رسوم معتمدة: +{formatSar(selectedOrder.approvedFeesSar)}
                          </div>
                        )}
                        <div className="font-mono-num font-bold text-sm text-[#8C6D36] pt-1">
                          الإجمالي التقديري: {formatSar(selectedOrder.estimatedTotalSar || selectedOrder.subtotalSar)}
                        </div>
                      </div>
                    </div>

                    {/* Specific Requirements Info */}
                    {(selectedOrder.coverageDetails ||
                      selectedOrder.childrenCount ||
                      selectedOrder.selectedActivities ||
                      selectedOrder.parentInstructions ||
                      selectedOrder.specialNotes) && (
                      <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#D8CBB8] text-xs space-y-2">
                        <strong className="block text-[#2C1E18]">تفاصيل ومتطلبات المناسبة:</strong>
                        {selectedOrder.coverageDetails && (
                          <div>
                            <span className="text-[#8C6D36]">أولويات التغطية: </span>
                            <span>{selectedOrder.coverageDetails}</span>
                          </div>
                        )}
                        {selectedOrder.childrenCount && (
                          <div>
                            <span className="text-[#8C6D36]">الأطفال والأعمار: </span>
                            <span>
                              {selectedOrder.childrenCount} طفل ({selectedOrder.childrenAges || 'أعمار متنوعة'})
                            </span>
                          </div>
                        )}
                        {selectedOrder.selectedActivities && (
                          <div>
                            <span className="text-[#8C6D36]">الأنشطة المختارة: </span>
                            <span>{selectedOrder.selectedActivities.join(' ، ')}</span>
                          </div>
                        )}
                        {selectedOrder.parentInstructions && (
                          <div>
                            <span className="text-[#8C6D36]">تعليمات خاصة: </span>
                            <span>{selectedOrder.parentInstructions}</span>
                          </div>
                        )}
                        {selectedOrder.specialNotes && (
                          <div>
                            <span className="text-[#8C6D36]">ملاحظات العميل: </span>
                            <span>{selectedOrder.specialNotes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Status Changer Actions */}
                    <div className="p-4 rounded-xl bg-[#F3ECE1] space-y-2">
                      <label className="block text-xs font-bold text-[#2C1E18]">
                        تحديث حالة الطلب رسمياً (تُحفظ في الخادم وسجل التدقيق):
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { s: 'pending_review', label: 'بانتظار المراجعة' },
                          { s: 'pending_client_confirmation', label: 'بانتظار تأكيد العميل' },
                          { s: 'confirmed', label: 'تأكيد واعتماد الموعد' },
                          { s: 'in_progress', label: 'جارٍ التنفيذ' },
                          { s: 'completed', label: 'إتمام الطلب' },
                          { s: 'cancelled', label: 'إلغاء الطلب' }
                        ].map((btn) => (
                          <button
                            key={btn.s}
                            type="button"
                            onClick={() =>
                              handleUpdateOrderStatus(selectedOrder.id, btn.s as BookingStatus)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              selectedOrder.status === btn.s
                                ? 'bg-[#2C1E18] text-[#FAF6F0] shadow-sm'
                                : 'bg-[#FAF6F0] text-[#2C1E18] border border-[#D8CBB8] hover:bg-[#E6DCD2]'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#E6DCD2]">
                      <a
                        href={buildBookingWhatsAppSummary(selectedOrder, settings.whatsappLocal)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-bold flex items-center gap-2 hover:bg-[#1EBE5D] transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>مراسلة العميل عبر واتساب</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(null)}
                        className="px-5 py-2.5 rounded-xl border border-[#D8CBB8] text-xs font-bold hover:bg-[#E6DCD2] cursor-pointer"
                      >
                        إغلاق
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 3. CALENDAR TAB ================= */}
          {activeTab === 'calendar' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              {/* Header & Controls */}
              <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 p-1 bg-[#F3ECE1] rounded-xl border border-[#D8CBB8]">
                  {[
                    { id: 'day', label: 'اليوم' },
                    { id: 'week', label: 'الأسبوع' },
                    { id: 'month', label: 'الشهر' }
                  ].map((vm) => (
                    <button
                      key={vm.id}
                      type="button"
                      onClick={() => setCalendarViewMode(vm.id as typeof calendarViewMode)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        calendarViewMode === vm.id
                          ? 'bg-[#2C1E18] text-[#FAF6F0] shadow-sm'
                          : 'text-[#645249] hover:text-[#2C1E18]'
                      }`}
                    >
                      {vm.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(calendarDate);
                      if (calendarViewMode === 'day') d.setDate(d.getDate() + 1);
                      else if (calendarViewMode === 'week') d.setDate(d.getDate() + 7);
                      else d.setMonth(d.getMonth() + 1);
                      setCalendarDate(d);
                    }}
                    className="p-2 rounded-xl border border-[#D8CBB8] hover:bg-[#F3ECE1] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4 text-[#2C1E18]" />
                  </button>

                  <div className="font-display font-bold text-base sm:text-lg text-[#2C1E18] min-w-[160px] text-center">
                    {calendarViewMode === 'day'
                      ? formatArabicDate(formatDateISO(calendarDate))
                      : calendarViewMode === 'week'
                      ? `أسبوع: ${formatArabicDate(formatDateISO(currentWeekDays[0]))}`
                      : arabicMonthName}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date(calendarDate);
                      if (calendarViewMode === 'day') d.setDate(d.getDate() - 1);
                      else if (calendarViewMode === 'week') d.setDate(d.getDate() - 7);
                      else d.setMonth(d.getMonth() - 1);
                      setCalendarDate(d);
                    }}
                    className="p-2 rounded-xl border border-[#D8CBB8] hover:bg-[#F3ECE1] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#2C1E18]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCalendarDate(new Date())}
                    className="px-3 py-1.5 rounded-xl border border-[#D8CBB8] text-xs font-bold hover:bg-[#F3ECE1] cursor-pointer"
                  >
                    اليوم
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={calendarCityFilter}
                    onChange={(e) => setCalendarCityFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs font-bold"
                  >
                    <option value="all">كافة المدن</option>
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="جدة">جدة</option>
                  </select>

                  <select
                    value={calendarCategoryFilter}
                    onChange={(e) => setCalendarCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs font-bold"
                  >
                    <option value="all">كافة الخدمات</option>
                    <option value="mobile_photography">تصوير الجوال</option>
                    <option value="kids_corner">ركن الأطفال</option>
                    <option value="childcare">رعاية الأطفال</option>
                    <option value="wedding_support">مساندة وتنظيم</option>
                  </select>
                </div>
              </div>

              {/* Month Grid */}
              {calendarViewMode === 'month' && (
                <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#8C6D36] pb-2 border-b border-[#E6DCD2]">
                    {weekDayNames.map((w) => (
                      <div key={w} className="py-1">
                        {w}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDayOffset }).map((_, idx) => (
                      <div
                        key={`emp-${idx}`}
                        className="min-h-[110px] p-2 rounded-xl bg-[#F3ECE1]/20"
                      />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dayStr = formatDateISO(new Date(year, month, dayNum));
                      const dayBookings = calendarFiltered.filter((b) => b.eventDate === dayStr);
                      const isToday = formatDateISO(new Date()) === dayStr;

                      return (
                        <div
                          key={dayNum}
                          className={`min-h-[120px] p-2.5 rounded-xl border flex flex-col justify-between ${
                            isToday
                              ? 'bg-[#FFFDF9] border-[#8C6D36] ring-1 ring-[#8C6D36]/40'
                              : 'bg-[#FAF6F0] border-[#E6DCD2]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono-num ${
                                isToday ? 'bg-[#2C1E18] text-[#FAF6F0]' : 'text-[#2C1E18]'
                              }`}
                            >
                              {formatArabicNumber(dayNum)}
                            </span>
                            {dayBookings.length > 0 && (
                              <span className="text-[10px] font-bold text-[#8C6D36]">
                                {formatArabicNumber(dayBookings.length)} مناسبة
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 mt-1.5 flex-1 overflow-y-auto max-h-[85px]">
                            {dayBookings.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setSelectedOrder(b)}
                                className={`w-full text-right p-1.5 rounded-lg text-[10px] truncate block font-bold transition-all hover:scale-[1.02] cursor-pointer ${
                                  b.status === 'confirmed'
                                    ? 'bg-[#EDF7F0] text-[#1F5E3B] border border-[#B6DFC2]'
                                    : b.status === 'in_progress'
                                    ? 'bg-[#F2EDFB] text-[#6B32B3] border border-[#DAC3F9]'
                                    : 'bg-[#FFF7E6] text-[#B76E00] border border-[#FFE0A3]'
                                }`}
                              >
                                <span className="ml-1">{formatArabicTime(b.startTime)}</span>
                                <span>{b.clientName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Week Grid */}
              {calendarViewMode === 'week' && (
                <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2]">
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                    {currentWeekDays.map((d, dIdx) => {
                      const dayISO = formatDateISO(d);
                      const dayBookings = calendarFiltered.filter((b) => b.eventDate === dayISO);
                      const isToday = formatDateISO(new Date()) === dayISO;

                      return (
                        <div
                          key={dayISO}
                          className={`p-3 rounded-2xl border flex flex-col min-h-[360px] ${
                            isToday
                              ? 'bg-[#FFFDF9] border-[#8C6D36] ring-1 ring-[#8C6D36]/40'
                              : 'bg-[#F3ECE1]/40 border-[#E6DCD2]'
                          }`}
                        >
                          <div className="text-center pb-2 border-b border-[#E6DCD2]">
                            <div className="text-xs font-bold text-[#8C6D36]">{weekDayNames[dIdx]}</div>
                            <div className="font-mono-num font-bold text-sm text-[#2C1E18]">
                              {formatArabicNumber(d.getDate())}
                            </div>
                          </div>

                          <div className="space-y-2 mt-3 flex-1 overflow-y-auto">
                            {dayBookings.length === 0 ? (
                              <div className="text-center text-[11px] text-[#A8988E] pt-6">
                                لا توجد حجوزات
                              </div>
                            ) : (
                              dayBookings.map((b) => (
                                <div
                                  key={b.id}
                                  onClick={() => setSelectedOrder(b)}
                                  className="p-2.5 rounded-xl border bg-[#FAF6F0] border-[#D8CBB8] text-xs space-y-1.5 cursor-pointer hover:border-[#2C1E18] transition-all shadow-xs"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[11px] text-[#2C1E18]">
                                      {b.clientName}
                                    </span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getStatusBadgeStyle(
                                        b.status
                                      )}`}
                                    >
                                      {getStatusLabel(b.status)}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#8C6D36]">
                                    {formatArabicTime(b.startTime)} ({b.durationHours} س)
                                  </div>
                                  <div className="text-[10px] text-[#645249] truncate">
                                    {b.serviceName}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Day View */}
              {calendarViewMode === 'day' && (
                <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-3">
                  <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                    مناسبات: {formatArabicDate(formatDateISO(calendarDate))}
                  </h3>
                  <div className="space-y-2">
                    {[
                      '14:00',
                      '16:00',
                      '18:00',
                      '19:00',
                      '20:00',
                      '21:00',
                      '22:00',
                      '23:00',
                      '00:00'
                    ].map((hour) => {
                      const hourBookings = calendarFiltered.filter((b) => {
                        return (
                          b.eventDate === formatDateISO(calendarDate) &&
                          b.startTime.split(':')[0] === hour.split(':')[0]
                        );
                      });

                      return (
                        <div
                          key={hour}
                          className="p-3 rounded-xl border border-[#E6DCD2] bg-[#FAF6F0] flex items-center gap-4"
                        >
                          <div className="w-24 shrink-0 font-mono font-bold text-xs text-[#8C6D36]">
                            {formatArabicTime(hour)}
                          </div>
                          <div className="flex-1">
                            {hourBookings.length === 0 ? (
                              <span className="text-xs text-[#A8988E]">شاغر</span>
                            ) : (
                              hourBookings.map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setSelectedOrder(b)}
                                  className="p-2.5 rounded-xl border bg-[#F3ECE1] border-[#D8CBB8] text-xs font-bold text-[#2C1E18] flex items-center justify-between w-full cursor-pointer hover:bg-[#E6DCD2]"
                                >
                                  <span>
                                    {b.clientName} ({b.serviceName}) · {b.city}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] ${getStatusBadgeStyle(
                                      b.status
                                    )}`}
                                  >
                                    {getStatusLabel(b.status)}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 4. SERVICES & PACKAGES TAB ================= */}
          {activeTab === 'services' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    إدارة الخدمات والباقات والأسعار
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    تعديل الخدمات، أسعار الباقات، مدة التسليم (٤٨ ساعة)، وشروط المساحة ورعاية الأطفال.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DCD2] pb-4">
                      <div>
                        <span className="text-xs font-bold text-[#8C6D36]">
                          {getCategoryLabel(service.category)}
                        </span>
                        <h3 className="font-display text-xl font-bold text-[#2C1E18]">
                          {service.name}
                        </h3>
                        <p className="text-xs text-[#645249] mt-0.5">{service.tagline}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasRole(['super_admin', 'content_editor'])) {
                              showToast('تعديل توفر الخدمة متاح للمدير العام ومسؤول المحتوى', 'error');
                              return;
                            }
                            const updated = services.map((s) =>
                              s.id === service.id ? { ...s, isAvailable: !s.isAvailable } : s
                            );
                            setServices(updated);
                            handleSaveService({ ...service, isAvailable: !service.isAvailable });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            service.isAvailable
                              ? 'bg-[#EDF7F0] text-[#1F5E3B] border border-[#B6DFC2]'
                              : 'bg-[#FDF2F2] text-[#8A2626] border border-[#E5B8B8]'
                          }`}
                        >
                          {service.isAvailable ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                          <span>{service.isAvailable ? 'مفعلة بالمتجر' : 'معطلة'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingService(service)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer"
                        >
                          تعديل تفاصيل الخدمة
                        </button>
                      </div>
                    </div>

                    {/* Basic pricing indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-[#F3ECE1]">
                        <span className="text-[#8C6D36] block font-bold">السعر المبدئي:</span>
                        <div className="font-mono-num font-bold text-sm text-[#2C1E18]">
                          {formatSar(service.basePrice)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F3ECE1]">
                        <span className="text-[#8C6D36] block font-bold">طريقة التسعير:</span>
                        <div className="font-bold text-[#2C1E18]">
                          {getPricingModelLabel(service.pricingModel)}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F3ECE1]">
                        <span className="text-[#8C6D36] block font-bold">مدة التسليم المبدئية:</span>
                        <div className="font-bold text-[#2C1E18]">
                          {service.deliveryTimeframeHours || 48} ساعة
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#F3ECE1]">
                        <span className="text-[#8C6D36] block font-bold">الحد الأدنى للساعات:</span>
                        <div className="font-bold text-[#2C1E18]">
                          {formatArabicNumber(service.minHours || 3)} ساعات
                        </div>
                      </div>
                    </div>

                    {/* Packages Section */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#2C1E18]">
                          الباقات المعتمدة ({service.packages.length} باقات):
                        </span>
                        {hasRole(['super_admin', 'content_editor']) && (
                          <button
                            type="button"
                            onClick={() => handleOpenAddPackage(service.id)}
                            className="px-3 py-1 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-[11px] font-bold flex items-center gap-1 hover:bg-[#422E25] cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#C8A96E]" />
                            <span>إضافة باقة</span>
                          </button>
                        )}
                      </div>

                      {service.packages.length === 0 ? (
                        <div className="p-4 rounded-2xl bg-[#F3ECE1]/40 border border-dashed border-[#D8CBB8] text-center text-xs text-[#645249]">
                          لا توجد باقات محددة لهذه الخدمة حالياً. يمكنكِ إضافة باقة بالضغط على زر «إضافة باقة».
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {service.packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="p-4 rounded-2xl bg-[#F3ECE1]/70 border border-[#E6DCD2] text-xs space-y-2.5 flex flex-col justify-between"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="text-[#2C1E18]">{pkg.name}</span>
                                  <span className="font-mono-num text-[#8C6D36]">
                                    {formatSar(pkg.price)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#645249]">
                                  {pkg.durationHours ? `${pkg.durationHours} ساعات · ` : ''}
                                  تسليم: {pkg.deliveryTimeframe || '٤٨ ساعة'}
                                </div>
                                {pkg.features && pkg.features.length > 0 && (
                                  <ul className="text-[10px] text-[#5C4940] space-y-0.5 pt-1 border-t border-[#E6DCD2]/60">
                                    {pkg.features.slice(0, 3).map((f, fi) => (
                                      <li key={fi} className="truncate">• {f}</li>
                                    ))}
                                    {pkg.features.length > 3 && (
                                      <li className="text-[#8C6D36]">+{pkg.features.length - 3} ميزات أخرى</li>
                                    )}
                                  </ul>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-[#E6DCD2]">
                                <span className="text-[10px] font-bold text-[#8C6D36]">
                                  {pkg.popular ? '★ الأكثر طلباً' : 'باقة معتمدة'}
                                </span>
                                {hasRole(['super_admin', 'content_editor']) && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditPackage(service.id, pkg)}
                                      className="p-1 rounded-md text-[#2C1E18] hover:bg-white text-[11px] font-bold cursor-pointer transition-colors"
                                      title="تعديل الباقة"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeletePackagePrompt(service.id, pkg.id, pkg.name)
                                      }
                                      className="p-1 rounded-md text-[#8A2626] hover:bg-[#FDF2F2] cursor-pointer transition-colors"
                                      title="حذف الباقة"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Service Edit Modal */}
              {editingService && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setEditingService(null)}
                      className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
                    >
                      <X className="w-5 h-5 text-[#2C1E18]" />
                    </button>

                    <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
                      تعديل خدمة: {editingService.name}
                    </h3>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveService(editingService);
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">اسم الخدمة:</label>
                        <input
                          type="text"
                          required
                          value={editingService.name}
                          onChange={(e) =>
                            setEditingService({ ...editingService, name: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">السعر المبدئي (SAR):</label>
                          <input
                            type="number"
                            required
                            value={editingService.basePrice}
                            onChange={(e) =>
                              setEditingService({
                                ...editingService,
                                basePrice: Number(e.target.value) || 0
                              })
                            }
                            className="w-full px-3 py-2 font-mono-num font-bold bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">مدة التسليم المبدئية (ساعات):</label>
                          <input
                            type="number"
                            required
                            value={editingService.deliveryTimeframeHours || 48}
                            onChange={(e) =>
                              setEditingService({
                                ...editingService,
                                deliveryTimeframeHours: Number(e.target.value) || 48
                              })
                            }
                            className="w-full px-3 py-2 font-mono-num font-bold bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">الوصف الموسع:</label>
                        <textarea
                          rows={3}
                          value={editingService.description}
                          onChange={(e) =>
                            setEditingService({ ...editingService, description: e.target.value })
                          }
                          className="w-full p-3 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">رابط صورة الخدمة:</label>
                        <input
                          type="text"
                          value={editingService.imageUrl}
                          onChange={(e) =>
                            setEditingService({ ...editingService, imageUrl: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono text-[11px]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                        <button
                          type="button"
                          onClick={() => setEditingService(null)}
                          className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                        >
                          حفظ التعديل
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 5. CITY COVERAGE TAB ================= */}
          {activeTab === 'cities' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div>
                <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                  تغطية مكة المكرمة وجدة
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  إدارة نطاق الخدمة، الأحياء المشمولة، ورسوم الانتقال والتجهيز المعتمدة لكل مدينة.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {cityCoverage.map((city, cIndex) => (
                  <div
                    key={city.cityName}
                    className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#8C6D36]" />
                        <h3 className="font-display text-xl font-bold text-[#2C1E18]">
                          {city.cityName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasRole(['super_admin', 'operations_manager']) && (
                          <button
                            type="button"
                            onClick={() => setEditingCity({ ...city, districts: [...city.districts] })}
                            className="px-3 py-1 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer"
                          >
                            تعديل التغطية
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (!hasRole(['super_admin', 'operations_manager'])) {
                              showToast('تعديل حالة المدينة متاح للمدير العام ومديرة العمليات فقط', 'error');
                              return;
                            }
                            const updated = cityCoverage.map((c) =>
                              c.cityName === city.cityName ? { ...c, isActive: !c.isActive } : c
                            );
                            handleSaveCityCoverage(updated);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                            city.isActive
                              ? 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2]'
                              : 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8]'
                          }`}
                        >
                          {city.isActive ? 'مفعلة' : 'معطلة'}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[#645249]">{city.notice}</p>

                    <div className="space-y-1 text-xs">
                      <strong className="block text-[#2C1E18]">الأحياء المعتمدة المخدومة:</strong>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {city.districts.map((d) => (
                          <span
                            key={d}
                            className="px-2.5 py-1 rounded-lg bg-[#F3ECE1] text-[#2C1E18] text-[11px] font-medium"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E6DCD2] text-xs flex items-center justify-between">
                      <span className="text-[#645249]">رسوم الانتقال المعتمدة:</span>
                      <span className="font-mono-num font-bold text-[#8C6D36]">
                        {city.transportFeeSar === 0 ? 'مشمولة مجاناً' : formatSar(city.transportFeeSar)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 6. PORTFOLIO MEDIA TAB ================= */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    إدارة معرض الأعمال ({portfolio.length})
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    إضافة وحذف وتعديل الصور ومقاطع الفيديو المعروضة للزوار في واجهة المتجر.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddPortfolioModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:bg-[#422E25]"
                >
                  <Plus className="w-4 h-4 text-[#C8A96E]" />
                  <span>إضافة عمل جديد</span>
                </button>
              </div>

              {/* Portfolio Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {portfolio.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative aspect-4/3 bg-[#F3ECE1] overflow-hidden">
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px]">
                        {item.mediaType === 'video' ? 'فيديو' : 'صورة'}
                      </span>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#2C1E18]">{item.title}</div>
                        <div className="text-[11px] text-[#8C6D36]">
                          {getGalleryCategoryLabel(item.categoryKey)} {item.city ? `· ${item.city}` : ''}
                        </div>
                        {item.caption && (
                          <p className="text-[11px] text-[#645249] mt-1 line-clamp-2">
                            {item.caption}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E6DCD2] flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${item.isPublic ? 'text-[#1F5E3B]' : 'text-[#8A2626]'}`}>
                          {item.isPublic ? 'معروض للزوار' : 'مخفي مؤقتاً'}
                        </span>
                        {hasRole(['super_admin', 'content_editor']) && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingPortfolioItem(item)}
                              className="p-1.5 rounded-lg text-[#2C1E18] hover:bg-[#E6DCD2] cursor-pointer"
                              title="تعديل العمل"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePortfolio(item.id)}
                              className="p-1.5 rounded-lg text-[#8A2626] hover:bg-[#FDF2F2] cursor-pointer"
                              title="حذف العمل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Portfolio Modal */}
              {showAddPortfolioModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
                    <button
                      type="button"
                      onClick={() => setShowAddPortfolioModal(false)}
                      className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
                    >
                      <X className="w-5 h-5 text-[#2C1E18]" />
                    </button>

                    <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
                      إضافة عمل إلى المعرض
                    </h3>

                    <form onSubmit={handleAddPortfolio} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">عنوان العمل:</label>
                        <input
                          type="text"
                          required
                          value={newPortfolioItem.title}
                          onChange={(e) =>
                            setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })
                          }
                          placeholder="مثال: لقطات كوشة زفاف فخمة"
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">الخدمة:</label>
                          <select
                            value={newPortfolioItem.categoryKey}
                            onChange={(e) =>
                              setNewPortfolioItem({
                                ...newPortfolioItem,
                                categoryKey: e.target.value as ServiceCategoryKey
                              })
                            }
                            className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                          >
                            <option value="mobile_photography">١. تصوير المناسبات بالجوال</option>
                            <option value="kids_corner">٢. أركان الأطفال</option>
                            <option value="kids_activities">٣. أنشطة الأطفال</option>
                            <option value="wedding_support">٤. خدمات الأفراح</option>
                            <option value="event_setups">٥. تجهيزات المناسبات</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">نوع الوسائط:</label>
                          <select
                            value={newPortfolioItem.mediaType || 'image'}
                            onChange={(e) =>
                              setNewPortfolioItem({
                                ...newPortfolioItem,
                                mediaType: e.target.value as 'image' | 'video'
                              })
                            }
                            className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                          >
                            <option value="image">صورة فوتوغرافية</option>
                            <option value="video">مقطع فيديو / ريلز</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">المدينة:</label>
                          <select
                            value={newPortfolioItem.city}
                            onChange={(e) =>
                              setNewPortfolioItem({
                                ...newPortfolioItem,
                                city: e.target.value as any
                              })
                            }
                            className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                          >
                            <option value="مكة المكرمة">مكة المكرمة</option>
                            <option value="جدة">جدة</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">رابط الصورة أو الفيديو:</label>
                        <input
                          type="text"
                          required
                          value={newPortfolioItem.mediaUrl}
                          onChange={(e) =>
                            setNewPortfolioItem({ ...newPortfolioItem, mediaUrl: e.target.value })
                          }
                          placeholder="https://... أو /src/assets/..."
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono text-[11px]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">وصف أو تعليق:</label>
                        <textarea
                          rows={2}
                          value={newPortfolioItem.caption}
                          onChange={(e) =>
                            setNewPortfolioItem({ ...newPortfolioItem, caption: e.target.value })
                          }
                          className="w-full p-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        />
                      </div>

                      {(newPortfolioItem.categoryKey === 'kids_corner' ||
                        newPortfolioItem.categoryKey === 'kids_activities' ||
                        newPortfolioItem.categoryKey === ('childcare' as any)) && (
                        <div className="p-3 rounded-xl bg-[#F7EBEB] border border-[#EED7D7] space-y-1">
                          <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                            <input
                              type="checkbox"
                              required
                              checked={newPortfolioItem.parentConsentApproved || false}
                              onChange={(e) =>
                                setNewPortfolioItem({
                                  ...newPortfolioItem,
                                  parentConsentApproved: e.target.checked
                                })
                              }
                              className="w-4 h-4 rounded text-[#2C1E18]"
                            />
                            <span>تم الحصول على موافقة ولي الأمر الصريحة على النشر</span>
                          </label>
                          <p className="text-[10px] text-[#645249] pr-6">
                            يمنع نظام لومير عرض أسماء الأطفال أو أي معلومات تدل على هوياتهم الشخصية في المعرض.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                        <button
                          type="button"
                          onClick={() => setShowAddPortfolioModal(false)}
                          className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                        >
                          إضافة العمل
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 7. HOMEPAGE CONTENT, BANNERS & FAQS TAB ================= */}
          {activeTab === 'faqs' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    إدارة محتوى الواجهة والصفحة الرئيسية
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    التحكم في بنرات السلايدر الرئيسي، الشريط الإعلاني العلوي، وقسم الأسئلة الشائعة.
                  </p>
                </div>

                {/* Sub Tab Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-[#E6DCD2]/60 rounded-2xl border border-[#D8CBB8] text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setContentSubTab('faqs')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      contentSubTab === 'faqs'
                        ? 'bg-[#2C1E18] text-[#FAF6F0] shadow-xs'
                        : 'text-[#645249] hover:text-[#2C1E18]'
                    }`}
                  >
                    الأسئلة الشائعة ({faqs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentSubTab('banners')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      contentSubTab === 'banners'
                        ? 'bg-[#2C1E18] text-[#FAF6F0] shadow-xs'
                        : 'text-[#645249] hover:text-[#2C1E18]'
                    }`}
                  >
                    بنرات السلايدر ({banners.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentSubTab('announcements')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      contentSubTab === 'announcements'
                        ? 'bg-[#2C1E18] text-[#FAF6F0] shadow-xs'
                        : 'text-[#645249] hover:text-[#2C1E18]'
                    }`}
                  >
                    الشريط الإعلاني
                  </button>
                </div>
              </div>

              {/* Sub-View 1: FAQs */}
              {contentSubTab === 'faqs' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#645249]">
                      قائمة الأسئلة الشائعة المعروضة للعملاء ({faqs.length} أسئلة):
                    </span>
                    {hasRole(['super_admin', 'content_editor']) && (
                      <button
                        type="button"
                        onClick={() => setShowAddFaqModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#422E25]"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#C8A96E]" />
                        <span>إضافة سؤال شائع</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {faqs.map((faq) => (
                      <div
                        key={faq.id}
                        className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-[#F3ECE1] text-[#8C6D36] text-[10px]">
                              {faq.category}
                            </span>
                            <span className="text-sm text-[#2C1E18]">{faq.question}</span>
                          </div>
                          {hasRole(['super_admin', 'content_editor']) && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingFaq(faq)}
                                className="text-[#2C1E18] hover:bg-[#E6DCD2] p-1.5 rounded-lg cursor-pointer transition-colors"
                                title="تعديل السؤال"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="text-[#8A2626] hover:bg-[#FDF2F2] p-1.5 rounded-lg cursor-pointer transition-colors"
                                title="حذف السؤال"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-[#645249] leading-relaxed pr-2">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-View 2: Hero Slider Banners */}
              {contentSubTab === 'banners' && (
                <div className="space-y-6">
                  {/* Slider Settings Bar */}
                  <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sliderSettings.autoPlay}
                          onChange={(e) =>
                            setSliderSettings({ ...sliderSettings, autoPlay: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#2C1E18]"
                        />
                        <span>التبديل التلقائي للسلايدر</span>
                      </label>

                      <div className="flex items-center gap-2">
                        <span className="text-[#645249]">مدة العرض بين البنرات:</span>
                        <select
                          value={sliderSettings.intervalSeconds}
                          onChange={(e) =>
                            setSliderSettings({
                              ...sliderSettings,
                              intervalSeconds: Number(e.target.value) || 3
                            })
                          }
                          className="px-2.5 py-1 bg-[#FAF6F0] border border-[#D8CBB8] rounded-lg font-bold"
                        >
                          <option value="3">٣ ثوانٍ</option>
                          <option value="4">٤ ثوانٍ</option>
                          <option value="5">٥ ثوانٍ</option>
                          <option value="6">٦ ثوانٍ</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasRole(['super_admin', 'content_editor']) && (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveSliderSettings}
                            className="px-3.5 py-1.5 rounded-xl bg-[#1F5E3B] text-white font-bold hover:bg-[#18492E] cursor-pointer shadow-xs"
                          >
                            حفظ إعدادات السلايدر
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddBannerModal(true)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#422E25]"
                          >
                            <Plus className="w-3.5 h-3.5 text-[#C8A96E]" />
                            <span>إضافة بنر جديد</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Banners Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        className="p-5 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4 shadow-xs flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-[#2C1E18]">
                            <img
                              src={banner.desktopImageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 text-white">
                              {banner.badge && (
                                <span className="inline-block px-2 py-0.5 rounded-full bg-[#C8A96E] text-[#2C1E18] text-[10px] font-bold w-fit mb-1">
                                  {banner.badge}
                                </span>
                              )}
                              <h4 className="font-display font-bold text-base leading-tight">
                                {banner.title}
                              </h4>
                              {banner.subtitle && (
                                <p className="text-[11px] text-[#FAF6F0]/80 line-clamp-1">
                                  {banner.subtitle}
                                </p>
                              )}
                            </div>
                            <span
                              className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                banner.isActive
                                  ? 'bg-[#1F5E3B] text-white'
                                  : 'bg-black/60 text-white'
                              }`}
                            >
                              {banner.isActive ? 'مفعل بالسلايدر' : 'معطل'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#645249]">
                            <div>
                              زر التحويل:{' '}
                              <strong className="text-[#2C1E18]">{banner.ctaText}</strong>
                            </div>
                            <div>
                              الوجهة:{' '}
                              <strong className="font-mono text-[#8C6D36]">
                                {banner.ctaLink}
                              </strong>
                            </div>
                            <div>
                              الترتيب:{' '}
                              <strong className="font-mono">{banner.displayOrder}</strong>
                            </div>
                            <div>
                              موضع النص:{' '}
                              <strong>{banner.textPosition === 'right' ? 'يمين' : 'وسط'}</strong>
                            </div>
                          </div>
                        </div>

                        {hasRole(['super_admin', 'content_editor']) && (
                          <div className="pt-3 border-t border-[#E6DCD2] flex items-center justify-between text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateBanner({ ...banner, isActive: !banner.isActive });
                              }}
                              className={`px-3 py-1 rounded-xl font-bold border cursor-pointer ${
                                banner.isActive
                                  ? 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2]'
                                  : 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8]'
                              }`}
                            >
                              {banner.isActive ? 'تعطيل البنر' : 'تفعيل البنر'}
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingBanner(banner)}
                                className="px-3 py-1 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteBannerPrompt(banner.id, banner.title)
                                }
                                className="p-1.5 rounded-lg text-[#8A2626] hover:bg-[#FDF2F2] cursor-pointer"
                                title="حذف البنر"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-View 3: Announcement Bar */}
              {contentSubTab === 'announcements' && (
                <div className="space-y-6">
                  {/* Announcement Bar Settings Card */}
                  <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-[#8C6D36]" />
                        <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                          إعدادات الشريط الإعلاني العلوي
                        </h3>
                      </div>

                      <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={announcements.isEnabled}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, isEnabled: e.target.checked })
                          }
                          className="w-4 h-4 rounded text-[#2C1E18]"
                        />
                        <span>{announcements.isEnabled ? 'الشريط مفعّل' : 'الشريط معطّل'}</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">نمط العرض:</label>
                        <select
                          value={announcements.isTicker ? 'ticker' : 'carousel'}
                          onChange={(e) =>
                            setAnnouncements({
                              ...announcements,
                              isTicker: e.target.value === 'ticker'
                            })
                          }
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        >
                          <option value="carousel">تبديل سلس (Carousel)</option>
                          <option value="ticker">شريط متحرك مستمر (Ticker)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">
                          مدة التبديل بين الرسائل (ثوانٍ):
                        </label>
                        <input
                          type="number"
                          value={announcements.intervalSeconds || 4}
                          onChange={(e) =>
                            setAnnouncements({
                              ...announcements,
                              intervalSeconds: Number(e.target.value) || 4
                            })
                          }
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">لون الخلفية:</label>
                        <input
                          type="text"
                          value={announcements.bgColor}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, bgColor: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                        />
                      </div>
                    </div>

                    {hasRole(['super_admin', 'content_editor']) && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSaveAnnouncements(announcements)}
                          className="px-5 py-2 rounded-xl bg-[#1F5E3B] text-white font-bold hover:bg-[#18492E] cursor-pointer shadow-xs"
                        >
                          حفظ إعدادات الشريط
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Announcement Messages List */}
                  <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4 text-xs">
                    <span className="font-bold text-sm text-[#2C1E18] block">
                      رسائل التنبيه والعروض في الشريط ({announcements.messages.length}):
                    </span>

                    <div className="space-y-2.5">
                      {announcements.messages.map((msg, idx) => (
                        <div
                          key={msg.id}
                          className="p-3.5 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {msg.badge && (
                              <span className="px-2 py-0.5 rounded-md bg-[#C8A96E] text-[#2C1E18] text-[10px] font-bold shrink-0">
                                {msg.badge}
                              </span>
                            )}
                            <span className="text-xs text-[#2C1E18] font-medium">{msg.text}</span>
                          </div>

                          {hasRole(['super_admin', 'content_editor']) && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedMsgs = announcements.messages.map((m, i) =>
                                    i === idx ? { ...m, isActive: !m.isActive } : m
                                  );
                                  const updated = { ...announcements, messages: updatedMsgs };
                                  setAnnouncements(updated);
                                  handleSaveAnnouncements(updated);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                                  msg.isActive
                                    ? 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2]'
                                    : 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8]'
                                }`}
                              >
                                {msg.isActive ? 'مفعل' : 'معطل'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updatedMsgs = announcements.messages.filter(
                                    (_, i) => i !== idx
                                  );
                                  const updated = { ...announcements, messages: updatedMsgs };
                                  setAnnouncements(updated);
                                  handleSaveAnnouncements(updated);
                                }}
                                className="p-1 rounded-lg text-[#8A2626] hover:bg-[#FDF2F2] cursor-pointer"
                                title="حذف الرسالة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add new message form */}
                    {hasRole(['super_admin', 'content_editor']) && (
                      <div className="pt-3 border-t border-[#E6DCD2] flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="وسم (مثال: عرض خاص)"
                          value={newAnnouncementBadge}
                          onChange={(e) => setNewAnnouncementBadge(e.target.value)}
                          className="sm:w-32 px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                        />
                        <input
                          type="text"
                          placeholder="نص الرسالة أو الإعلان للزوار..."
                          value={newAnnouncementText}
                          onChange={(e) => setNewAnnouncementText(e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newAnnouncementText.trim()) return;
                            const newMsg = {
                              id: `msg-${Date.now()}`,
                              text: newAnnouncementText.trim(),
                              badge: newAnnouncementBadge.trim() || undefined,
                              isActive: true
                            };
                            const updated = {
                              ...announcements,
                              messages: [...announcements.messages, newMsg]
                            };
                            setAnnouncements(updated);
                            handleSaveAnnouncements(updated);
                            setNewAnnouncementText('');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#C8A96E]" />
                          <span>إضافة للشريط</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Add FAQ Modal */}
              {showAddFaqModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
                    <button
                      type="button"
                      onClick={() => setShowAddFaqModal(false)}
                      className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
                    >
                      <X className="w-5 h-5 text-[#2C1E18]" />
                    </button>

                    <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
                      إضافة سؤال شائع جديد
                    </h3>

                    <form onSubmit={handleAddFaq} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">السؤال:</label>
                        <input
                          type="text"
                          required
                          value={newFaq.question}
                          onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">التصنيف:</label>
                        <input
                          type="text"
                          required
                          value={newFaq.category}
                          onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">الإجابة:</label>
                        <textarea
                          rows={3}
                          required
                          value={newFaq.answer}
                          onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                          className="w-full p-3 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                        <button
                          type="button"
                          onClick={() => setShowAddFaqModal(false)}
                          className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                        >
                          إضافة السؤال
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= DEDICATED ANNOUNCEMENTS (TICKER) TAB ================= */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              {/* Header Zone */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#C8A96E]/20 text-[#8C6D36] text-[10px] font-bold border border-[#C8A96E]/40 flex items-center gap-1 w-fit">
                      <Sparkles className="w-3 h-3 text-[#8C6D36]" />
                      <span>شريط العروض والرسائل التفاعلي</span>
                    </span>
                  </div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    الشريط العلوي المتحرك (Marquee Ticker)
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    أضيفي نصوص العروض والتنبيهات للزوار، واجعليها تتحرك بانسيابية في أعلى صفحات المتجر مع التحكم الكامل بالسرعة والألوان والروابط.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  {hasRole(['super_admin', 'content_editor']) && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenAddAnnouncement}
                        className="px-4 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs hover:bg-[#422E25] transition-all"
                      >
                        <Plus className="w-4 h-4 text-[#C8A96E]" />
                        <span>إضافة نص جديد للشريط</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveAnnouncements(announcements)}
                        className="px-4 py-2.5 rounded-xl bg-[#1F5E3B] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs hover:bg-[#18492E] transition-all"
                      >
                        <Save className="w-4 h-4 text-[#C8A96E]" />
                        <span>حفظ التعديلات</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 1. Live Animated Interactive Preview */}
              <div className="p-5 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-[#8C6D36]" />
                    <span className="text-xs font-bold text-[#2C1E18]">
                      معاينة حية ومتحركة لما يظهر للزوار الآن في أعلى الموقع:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTickerPaused((p) => !p)}
                      className="px-2.5 py-1 rounded-lg bg-[#F3ECE1] text-[#2C1E18] text-[11px] font-bold border border-[#D8CBB8] flex items-center gap-1.5 cursor-pointer hover:bg-[#E6DCD2]"
                    >
                      {previewTickerPaused ? (
                        <>
                          <Play className="w-3 h-3 text-[#1F5E3B]" />
                          <span>استئناف الحركة</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 text-[#8A2626]" />
                          <span>إيقاف مؤقت</span>
                        </>
                      )}
                    </button>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        announcements.isEnabled
                          ? 'bg-[#EDF7F0] text-[#1F5E3B]'
                          : 'bg-[#FDF2F2] text-[#8A2626]'
                      }`}
                    >
                      {announcements.isEnabled ? 'الشريط مفعّل للزوار' : 'الشريط مخفي ومعطّل'}
                    </span>
                  </div>
                </div>

                {/* The Moving Preview Box */}
                <div
                  style={{
                    backgroundColor: announcements.bgColor || '#2C1E18',
                    color: announcements.textColor || '#FAF6F0'
                  }}
                  className="rounded-2xl p-2.5 sm:p-3 overflow-hidden shadow-inner relative flex items-center select-none"
                  dir="rtl"
                >
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/30 text-[#C8A96E] text-[10px] font-bold shrink-0 border border-[#C8A96E]/20 ml-3">
                    <Sparkles className="w-2.5 h-2.5 text-[#C8A96E] animate-pulse" />
                    <span>لومير</span>
                  </div>

                  <div className="flex-1 overflow-hidden relative flex items-center min-h-[22px]">
                    <div
                      className="w-full overflow-hidden flex items-center"
                      dir="ltr"
                    >
                      <div
                        className={`animate-marquee-continuous flex items-center gap-8 ${
                          previewTickerPaused ? 'paused' : ''
                        }`}
                        style={{
                          '--marquee-duration':
                            announcements.speed === 'fast'
                              ? '14s'
                              : announcements.speed === 'slow'
                              ? '38s'
                              : `${(announcements.intervalSeconds || 3.5) * 7}s`
                        } as React.CSSProperties}
                      >
                        {announcements.messages
                          .filter((m) => m.isActive)
                          .concat(announcements.messages.filter((m) => m.isActive))
                          .concat(announcements.messages.filter((m) => m.isActive))
                          .concat(announcements.messages.filter((m) => m.isActive))
                          .map((msg, idx) => (
                            <div
                              key={`${msg.id}-prev-${idx}`}
                              dir="rtl"
                              className="inline-flex items-center gap-2 sm:gap-3 whitespace-nowrap px-3 text-xs"
                            >
                              {msg.badge && (
                                <span
                                  style={{
                                    backgroundColor: announcements.accentColor || '#C8A96E',
                                    color: '#2C1E18'
                                  }}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs inline-flex items-center gap-1"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{msg.badge}</span>
                                </span>
                              )}
                              <span className="font-medium">{msg.text}</span>
                              {msg.linkText && (
                                <span
                                  style={{ color: announcements.accentColor || '#C8A96E' }}
                                  className="underline underline-offset-2 font-bold text-[11px]"
                                >
                                  {msg.linkText} ←
                                </span>
                              )}
                              <span
                                style={{ color: announcements.accentColor || '#C8A96E' }}
                                className="opacity-40 text-xs pr-3"
                              >
                                ✦
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Controls & Color Customization */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* General Settings Card */}
                <div className="lg:col-span-6 p-6 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-5 text-xs">
                  <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#2C1E18]">
                      <SlidersHorizontal className="w-4 h-4 text-[#8C6D36]" />
                      <span>خصائص الحركة وسرعة التمرير</span>
                    </div>

                    <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcements.isEnabled}
                        onChange={(e) =>
                          setAnnouncements({ ...announcements, isEnabled: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#2C1E18]"
                      />
                      <span>تفعيل الشريط</span>
                    </label>
                  </div>

                  {/* Mode & Speed */}
                  <div className="space-y-3">
                    <div>
                      <label className="block font-bold text-[#2C1E18] mb-1">
                        نمط العرض:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAnnouncements({ ...announcements, isTicker: true })}
                          className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            announcements.isTicker !== false
                              ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-xs'
                              : 'bg-[#F3ECE1] text-[#645249] border-[#D8CBB8] hover:bg-[#E6DCD2]'
                          }`}
                        >
                          <span>شريط متحرك مستمر (Ticker)</span>
                          <span className="text-[10px] opacity-80">«موصى به لحركة سلسة»</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAnnouncements({ ...announcements, isTicker: false })}
                          className={`p-2.5 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            announcements.isTicker === false
                              ? 'bg-[#2C1E18] text-[#FAF6F0] border-[#2C1E18] shadow-xs'
                              : 'bg-[#F3ECE1] text-[#645249] border-[#D8CBB8] hover:bg-[#E6DCD2]'
                          }`}
                        >
                          <span>تبديل سلايدر (Carousel)</span>
                          <span className="text-[10px] opacity-80">«تبديل رسالة تلو الأخرى»</span>
                        </button>
                      </div>
                    </div>

                    {/* Speed Presets */}
                    <div>
                      <label className="block font-bold text-[#2C1E18] mb-1.5">
                        سرعة حركة التمرير:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'slow', label: 'هادئ وفاخر', sec: 40 },
                          { id: 'normal', label: 'متوازن وطبيعي', sec: 24 },
                          { id: 'fast', label: 'سريع ونشط', sec: 14 }
                        ].map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() =>
                              handleApplySpeed(sp.id as any, sp.sec / 7)
                            }
                            className={`p-2 rounded-xl border font-bold text-xs text-center cursor-pointer transition-all ${
                              (announcements.speed || 'normal') === sp.id
                                ? 'bg-[#C8A96E] text-[#2C1E18] border-[#8C6D36] shadow-xs'
                                : 'bg-[#F3ECE1] text-[#645249] border-[#D8CBB8] hover:bg-[#E6DCD2]'
                            }`}
                          >
                            {sp.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pause on hover */}
                    <div className="pt-2">
                      <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={announcements.pauseOnHover !== false}
                          onChange={(e) =>
                            setAnnouncements({
                              ...announcements,
                              pauseOnHover: e.target.checked
                            })
                          }
                          className="w-4 h-4 rounded text-[#2C1E18]"
                        />
                        <span>إيقاف الحركة مؤقتاً عند مرور الماوس أو اللمس (مريح للعميل أثناء القراءة)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Color Palette Card */}
                <div className="lg:col-span-6 p-6 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4 text-xs">
                  <div className="flex items-center gap-2 border-b border-[#E6DCD2] pb-3 font-bold text-sm text-[#2C1E18]">
                    <Palette className="w-4 h-4 text-[#8C6D36]" />
                    <span>تنسيق ألوان الشريط وهوية لومير</span>
                  </div>

                  {/* 4 Luxury Color Presets */}
                  <div className="space-y-2">
                    <label className="block font-bold text-[#2C1E18]">
                      لوحات ألوان فاخرة جاهزة بنقرة واحدة:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          name: 'كحلي لومير الكلاسيكي',
                          bg: '#2C1E18',
                          txt: '#FAF6F0',
                          acc: '#C8A96E'
                        },
                        {
                          name: 'ذهبي ملكي لومير',
                          bg: '#8C6D36',
                          txt: '#FAF6F0',
                          acc: '#FFFFFF'
                        },
                        {
                          name: 'أسود سهرة الأفراح',
                          bg: '#1A130F',
                          txt: '#FAF6F0',
                          acc: '#D4AF37'
                        },
                        {
                          name: 'عنابي ليالي الزفاف',
                          bg: '#3B1F2B',
                          txt: '#FAF6F0',
                          acc: '#E6C594'
                        }
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyColorTheme(preset.bg, preset.txt, preset.acc)}
                          className="p-2.5 rounded-xl border border-[#D8CBB8] bg-[#F3ECE1] hover:bg-[#E6DCD2] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                        >
                          <span className="font-bold text-[11px] text-[#2C1E18] truncate">
                            {preset.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: preset.bg }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: preset.acc }}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Hex Inputs */}
                  <div className="grid grid-cols-3 gap-2.5 pt-2">
                    <div className="space-y-1">
                      <label className="block font-bold text-[#2C1E18] text-[11px]">لون الخلفية:</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={announcements.bgColor || '#2C1E18'}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, bgColor: e.target.value })
                          }
                          className="w-7 h-7 rounded-lg border border-[#D8CBB8] cursor-pointer"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={announcements.bgColor}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, bgColor: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-lg font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-[#2C1E18] text-[11px]">لون النص:</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={announcements.textColor || '#FAF6F0'}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, textColor: e.target.value })
                          }
                          className="w-7 h-7 rounded-lg border border-[#D8CBB8] cursor-pointer"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={announcements.textColor}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, textColor: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-lg font-mono text-[10px]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-[#2C1E18] text-[11px]">لون الوسم والروابط:</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={announcements.accentColor || '#C8A96E'}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, accentColor: e.target.value })
                          }
                          className="w-7 h-7 rounded-lg border border-[#D8CBB8] cursor-pointer"
                        />
                        <input
                          type="text"
                          dir="ltr"
                          value={announcements.accentColor}
                          onChange={(e) =>
                            setAnnouncements({ ...announcements, accentColor: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-lg font-mono text-[10px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Messages List Card */}
              <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DCD2] pb-3">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                      نصوص ورسائل الشريط المتحرك ({announcements.messages.length})
                    </h3>
                    <p className="text-[11px] text-[#645249]">
                      يمكنكِ تقديم أو تأخير ظهور الرسائل وتفعيلها أو إيقافها، وتعديل النصوص والروابط في أي وقت.
                    </p>
                  </div>

                  {hasRole(['super_admin', 'content_editor']) && (
                    <button
                      type="button"
                      onClick={handleOpenAddAnnouncement}
                      className="px-3.5 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#422E25] self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C8A96E]" />
                      <span>إضافة نص إعلاني</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {announcements.messages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        msg.isActive
                          ? 'bg-[#FAF6F0] border-[#D8CBB8] shadow-xs'
                          : 'bg-[#F3ECE1]/60 border-[#E6DCD2] opacity-75'
                      }`}
                    >
                      {/* Left: Reorder & Info */}
                      <div className="flex items-start sm:items-center gap-3 flex-1">
                        {/* Order & Reorder Arrows */}
                        {hasRole(['super_admin', 'content_editor']) && (
                          <div className="flex flex-col items-center gap-0.5 shrink-0 bg-[#F3ECE1] p-1 rounded-xl border border-[#D8CBB8]">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveAnnouncement(idx, 'up')}
                              className={`p-1 rounded hover:bg-[#E6DCD2] cursor-pointer ${
                                idx === 0 ? 'opacity-30 cursor-not-allowed' : 'text-[#2C1E18]'
                              }`}
                              title="تقديم الترتيب"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono font-bold text-[10px] text-[#8C6D36]">
                              {idx + 1}
                            </span>
                            <button
                              type="button"
                              disabled={idx === announcements.messages.length - 1}
                              onClick={() => handleMoveAnnouncement(idx, 'down')}
                              className={`p-1 rounded hover:bg-[#E6DCD2] cursor-pointer ${
                                idx === announcements.messages.length - 1
                                  ? 'opacity-30 cursor-not-allowed'
                                  : 'text-[#2C1E18]'
                              }`}
                              title="تأخير الترتيب"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Content */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {msg.badge && (
                              <span className="px-2.5 py-0.5 rounded-full bg-[#C8A96E] text-[#2C1E18] text-[10px] font-bold shadow-xs">
                                {msg.badge}
                              </span>
                            )}
                            <span className="font-bold text-xs text-[#2C1E18]">{msg.text}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#645249]">
                            {msg.linkTarget ? (
                              <span className="flex items-center gap-1 text-[#8C6D36]">
                                <span>الوجهة:</span>
                                <strong className="font-mono">
                                  {msg.linkTarget === 'booking'
                                    ? 'حجز موعد'
                                    : msg.linkTarget === 'mobile-photography'
                                    ? 'تصوير الجوال'
                                    : msg.linkTarget === 'kids-corner'
                                    ? 'أركان الأطفال'
                                    : msg.linkTarget === 'childcare'
                                    ? 'مشرفات الأطفال'
                                    : msg.linkTarget === 'wedding-support'
                                    ? 'مساندة الأفراح'
                                    : msg.linkTarget === 'gallery'
                                    ? 'المعرض'
                                    : msg.linkTarget === 'whatsapp'
                                    ? 'واتساب مباشر'
                                    : msg.linkTarget}
                                </strong>
                                {msg.linkText && <span>(زر: {msg.linkText})</span>}
                              </span>
                            ) : (
                              <span className="text-[#8C6D36]/80">• نص إعلاني بدون رابط</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      {hasRole(['super_admin', 'content_editor']) && (
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6DCD2]">
                          <button
                            type="button"
                            onClick={() => handleToggleAnnouncementActive(msg.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                              msg.isActive
                                ? 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2] hover:bg-[#B6DFC2]/30'
                                : 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8] hover:bg-[#E5B8B8]/30'
                            }`}
                          >
                            {msg.isActive ? 'مفعّل بالشريط' : 'معطّل مؤقتاً'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditAnnouncement(msg)}
                            className="px-3 py-1.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold text-xs flex items-center gap-1 hover:bg-[#422E25] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#C8A96E]" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAnnouncementPrompt(msg.id, msg.text)}
                            className="p-1.5 rounded-xl text-[#8A2626] hover:bg-[#FDF2F2] cursor-pointer transition-colors"
                            title="حذف هذا النص"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= 8. COUPONS MANAGEMENT TAB ================= */}
          {activeTab === 'coupons' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    إدارة الخصومات والكوبونات ({coupons.length})
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    تفعيل أكواد التخفيض وتحديد النسب أو المبالغ الثابتة وتتبع مرات الاستخدام.
                  </p>
                </div>

                {hasRole(['super_admin']) && (
                  <button
                    type="button"
                    onClick={() => setShowAddCouponModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:bg-[#422E25]"
                  >
                    <Plus className="w-4 h-4 text-[#C8A96E]" />
                    <span>إنشاء كود خصم</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {coupons.map((cp) => (
                  <div
                    key={cp.id}
                    className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-2">
                      <span className="font-mono text-base font-bold text-[#2C1E18] tracking-wider">
                        {cp.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#EDF7F0] text-[#1F5E3B] text-[10px] font-bold">
                        {cp.isActive ? 'مفعل' : 'معطل'}
                      </span>
                    </div>

                    <div className="space-y-1 text-[#645249]">
                      <div>
                        قيمة الخصم:{' '}
                        <strong>
                          {cp.discountType === 'percentage'
                            ? `${cp.discountValue}%`
                            : formatSar(cp.discountValue)}
                        </strong>
                      </div>
                      <div>
                        الحد الأدنى للطلب: <strong>{formatSar(cp.minOrderAmountSar || 0)}</strong>
                      </div>
                      <div>
                        مرات الاستخدام: <strong>{cp.timesUsed} مرة</strong>
                      </div>
                    </div>

                    {hasRole(['super_admin']) && (
                      <div className="pt-2 border-t border-[#E6DCD2] flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(cp.id, cp.isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors ${
                            cp.isActive
                              ? 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2] hover:bg-[#B6DFC2]/30'
                              : 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8] hover:bg-[#E5B8B8]/30'
                          }`}
                        >
                          {cp.isActive ? 'تعطيل الكود' : 'تفعيل الكود'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingCoupon(cp)}
                            className="text-[#2C1E18] hover:bg-[#E6DCD2] p-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                            title="تعديل الكوبون"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(cp.id)}
                            className="text-[#8A2626] hover:bg-[#FDF2F2] p-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                            title="حذف الكوبون"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Coupon Modal */}
              {showAddCouponModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative">
                    <button
                      type="button"
                      onClick={() => setShowAddCouponModal(false)}
                      className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
                    >
                      <X className="w-5 h-5 text-[#2C1E18]" />
                    </button>

                    <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
                      إنشاء كود خصم جديد
                    </h3>

                    <form onSubmit={handleAddCoupon} className="space-y-3 text-xs">
                      <div className="space-y-1">
                        <label className="block font-bold text-[#2C1E18]">رمز الكود (بالإنجليزية):</label>
                        <input
                          type="text"
                          required
                          dir="ltr"
                          value={newCoupon.code}
                          onChange={(e) =>
                            setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                          }
                          placeholder="LUMIR20"
                          className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">نوع الخصم:</label>
                          <select
                            value={newCoupon.discountType}
                            onChange={(e) =>
                              setNewCoupon({
                                ...newCoupon,
                                discountType: e.target.value as any
                              })
                            }
                            className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                          >
                            <option value="percentage">نسبة مئوية (%)</option>
                            <option value="fixed_sar">مبلغ ثابت (ر.س)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">قيمة الخصم:</label>
                          <input
                            type="number"
                            required
                            value={newCoupon.discountValue}
                            onChange={(e) =>
                              setNewCoupon({
                                ...newCoupon,
                                discountValue: Number(e.target.value) || 0
                              })
                            }
                            className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">الحد الأدنى للطلب (SAR):</label>
                          <input
                            type="number"
                            value={newCoupon.minOrderAmountSar || 0}
                            onChange={(e) =>
                              setNewCoupon({
                                ...newCoupon,
                                minOrderAmountSar: Number(e.target.value) || 0
                              })
                            }
                            className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block font-bold text-[#2C1E18]">أقصى عدد للاستخدام:</label>
                          <input
                            type="number"
                            value={newCoupon.maxUses || 50}
                            onChange={(e) =>
                              setNewCoupon({
                                ...newCoupon,
                                maxUses: Number(e.target.value) || 50
                              })
                            }
                            className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                        <button
                          type="button"
                          onClick={() => setShowAddCouponModal(false)}
                          className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                        >
                          إلغاء
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                        >
                          تفعيل الكوبون
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 9. SETTINGS TAB ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div>
                <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                  إعدادات التواصل ورقم واتساب
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  إدارة رقم واتساب لومير المعتمد، ساعات العمل، والرسوم المعتمدة في النظام.
                </p>
              </div>

              <form
                onSubmit={handleUpdateSettingsSubmit}
                className="p-7 rounded-3xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-5 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-[#2C1E18]">رقم واتساب المحلي (05XXXXXXXX):</label>
                    <input
                      type="text"
                      required
                      value={settings.whatsappLocal}
                      onChange={(e) => setSettings({ ...settings, whatsappLocal: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-[#2C1E18]">رقم واتساب الدولي (966XXXXXXXXX):</label>
                    <input
                      type="text"
                      required
                      value={settings.whatsappInternational}
                      onChange={(e) =>
                        setSettings({ ...settings, whatsappInternational: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-[#2C1E18]">أوقات العمل:</label>
                    <input
                      type="text"
                      value={settings.workingHours}
                      onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block font-bold text-[#2C1E18]">الرسوم المعتمدة والمحددة في الإعدادات (SAR):</label>
                    <input
                      type="number"
                      value={settings.approvedFeesSar || 0}
                      onChange={(e) =>
                        setSettings({ ...settings, approvedFeesSar: Number(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block font-bold text-[#2C1E18]">تنبيه مراجعة الإدارة الإلزامي قبل التأكيد:</label>
                    <textarea
                      rows={2}
                      value={settings.bookingNotice}
                      onChange={(e) => setSettings({ ...settings, bookingNotice: e.target.value })}
                      className="w-full p-3 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E6DCD2] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold text-xs hover:bg-[#422E25] cursor-pointer shadow-sm"
                  >
                    حفظ إعدادات التواصل
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= 10. AUDIT LOG TAB ================= */}
          {activeTab === 'audit' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div>
                <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                  سجل التغييرات والأسعار (Audit Log)
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  سجل زمني آلي لكل عملية تعديل في الأسعار أو الحالات أو الخدمات مع اسم المسؤول وتوقيت العملية.
                </p>
              </div>

              <div className="rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-[#F3ECE1] text-[#2C1E18] font-bold border-b border-[#E6DCD2]">
                      <tr>
                        <th className="p-3.5">الوقت والتاريخ</th>
                        <th className="p-3.5">المسؤول</th>
                        <th className="p-3.5">الرتبة</th>
                        <th className="p-3.5">الإجراء</th>
                        <th className="p-3.5">التفاصيل</th>
                        <th className="p-3.5">القيمة السابقة / الجديدة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DCD2]">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F3ECE1]/30">
                          <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#645249]">
                            {new Date(log.timestamp).toLocaleString('ar-SA')}
                          </td>
                          <td className="p-3.5 font-bold text-[#2C1E18]">{log.adminName}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getRoleBadgeStyle(
                                log.adminRole as AdminRole
                              )}`}
                            >
                              {log.adminRole}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-[#8C6D36]">{log.action}</td>
                          <td className="p-3.5 text-[#5C4940] max-w-xs">{log.details}</td>
                          <td className="p-3.5 text-[11px] font-mono">
                            {log.previousValue && (
                              <span className="text-[#8A2626] line-through block">
                                {log.previousValue}
                              </span>
                            )}
                            {log.newValue && (
                              <span className="text-[#1F5E3B] font-bold block">{log.newValue}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= 11. ROLES & ADMIN USERS TAB ================= */}
          {activeTab === 'roles' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div>
                <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                  الأدوار والصلاحيات الإدارية
                </h2>
                <p className="text-xs text-[#645249] mt-1">
                  تحديد نطاق وصلاحيات كل دور لحماية العمليات والبيانات الحساسة على مستوى الخادم.
                </p>
              </div>

              {/* Roles Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="p-6 rounded-3xl bg-[#FAF6F0] border-2 border-[#2C1E18] space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#C8A96E]" />
                    <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                      المديرة العامة (Super Admin)
                    </h3>
                  </div>
                  <p className="text-xs text-[#645249]">
                    صلاحيات مطلقة لكافة وظائف المتجر والخادم: تعديل الأسعار، حذف الطلبات، إدارة الكوبونات، المزامنة الشاملة، وعرض سجل التدقيق.
                  </p>
                  <ul className="text-xs space-y-1 text-[#1F5E3B] font-medium pt-2 border-t border-[#E6DCD2]">
                    <li>✓ إدارة وحذف الطلبات</li>
                    <li>✓ تعديل الأسعار والباقات</li>
                    <li>✓ إدارة كوبونات الخصم</li>
                    <li>✓ الاطلاع على سجل التدقيق كاملاً</li>
                  </ul>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#D8CBB8] space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#1F5E3B]" />
                    <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                      مشرفة العمليات والمواعيد
                    </h3>
                  </div>
                  <p className="text-xs text-[#645249]">
                    إدارة تدفق الطلبات، مراجعة توفر الفرق، وتأكيد المواعيد في التقويم، والتواصل المباشر مع العميل.
                  </p>
                  <ul className="text-xs space-y-1 text-[#5C4940] pt-2 border-t border-[#E6DCD2]">
                    <li>✓ مراجعة وتأكيد الحجوزات</li>
                    <li>✓ متابعة التقويم وتعارض المواعيد</li>
                    <li>✓ التواصل مع العميل عبر واتساب</li>
                    <li>✕ لا تملك صلاحية تغيير الأسعار العامة</li>
                  </ul>
                </div>

                <div className="p-6 rounded-3xl bg-[#FAF6F0] border border-[#D8CBB8] space-y-4">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#B76E00]" />
                    <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                      مسؤولة المحتوى والكتالوج
                    </h3>
                  </div>
                  <p className="text-xs text-[#645249]">
                    تحديث نصوص الكتالوج، إضافة الصور والفيديوهات لمعرض الأعمال، وتحديث الأسئلة الشائعة.
                  </p>
                  <ul className="text-xs space-y-1 text-[#5C4940] pt-2 border-t border-[#E6DCD2]">
                    <li>✓ إضافة وتعديل صور المعرض</li>
                    <li>✓ تحديث نصوص الخدمات والأسئلة الشائعة</li>
                    <li>✕ لا تملك صلاحية تعديل بيانات الطلبات والعملاء</li>
                  </ul>
                </div>
              </div>

              {/* Admin Accounts List */}
              <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6DCD2] pb-3">
                  <div>
                    <span className="font-bold text-xs text-[#2C1E18] block">
                      حسابات المسؤولين المعتمدة ({adminsList.length}):
                    </span>
                    <span className="text-[11px] text-[#645249]">
                      إدارة حسابات الفريق وتعيين الرتب والصلاحيات المحمية على الخادم وقاعدة البيانات.
                    </span>
                  </div>

                  {hasRole(['super_admin']) && (
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#422E25] self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C8A96E]" />
                      <span>إضافة مسؤول جديد</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {adminsList.map((adm) => (
                    <div
                      key={adm.id}
                      className="p-4 rounded-xl bg-[#F3ECE1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-[#E6DCD2]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="text-[#2C1E18] text-sm">{adm.name}</strong>
                          {currentUser?.id === adm.id && (
                            <span className="px-2 py-0.5 rounded-md bg-[#2C1E18] text-[#C8A96E] text-[10px] font-bold">
                              حسابكِ الحالي
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[#645249] text-[11px]">
                          <span className="font-mono">{adm.email}</span>
                          {adm.phone && <span className="font-mono">{adm.phone}</span>}
                          {adm.lastLoginAt && (
                            <span>آخر دخول: {new Date(adm.lastLoginAt).toLocaleDateString('ar-SA')}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E6DCD2]">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadgeStyle(
                            adm.role
                          )}`}
                        >
                          {getRoleLabel(adm.role)}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            adm.isActive
                              ? 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2]'
                              : 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8]'
                          }`}
                        >
                          {adm.isActive ? 'نشط' : 'معطل'}
                        </span>

                        {hasRole(['super_admin']) && (
                          <div className="flex items-center gap-1.5 mr-2">
                            <button
                              type="button"
                              onClick={() => setEditingUser(adm)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF6F0] hover:bg-white text-[#2C1E18] border border-[#D8CBB8] text-[11px] font-bold cursor-pointer"
                              title="تعديل الرتبة والبيانات"
                            >
                              تعديل الرتبة
                            </button>

                            {currentUser?.id !== adm.id && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAdminActive(adm)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                                    adm.isActive
                                      ? 'text-[#8A2626] border-[#E5B8B8] hover:bg-[#FDF2F2]'
                                      : 'text-[#1F5E3B] border-[#B6DFC2] hover:bg-[#EDF7F0]'
                                  }`}
                                >
                                  {adm.isActive ? 'تعطيل' : 'تنشيط'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdminUser(adm)}
                                  className="p-1.5 rounded-lg text-[#8A2626] hover:bg-[#FDF2F2] cursor-pointer"
                                  title="حذف المسؤول"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= 1. CONFIRMATION MODAL (Replaces window.confirm) ================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl text-right">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F2] text-[#8A2626] border border-[#E5B8B8] flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-bold text-[#2C1E18]">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-[#645249] leading-relaxed">
                {confirmModal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] text-xs font-bold text-[#2C1E18] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmModal.onConfirm;
                  setConfirmModal({ ...confirmModal, isOpen: false });
                  await action();
                }}
                className="px-5 py-2 rounded-xl bg-[#8A2626] hover:bg-[#681919] text-[#FAF6F0] text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                {confirmModal.confirmLabel || 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 2. PACKAGE EDIT / ADD MODAL ================= */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingPackage(null)}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              {editingPackage.isNew ? 'إضافة باقة جديدة' : 'تعديل بيانات الباقة'}
            </h3>

            <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">اسم الباقة:</label>
                <input
                  type="text"
                  required
                  value={editingPackage.package.name}
                  onChange={(e) =>
                    setEditingPackage({
                      ...editingPackage,
                      package: { ...editingPackage.package, name: e.target.value }
                    })
                  }
                  placeholder="مثال: باقة ٤ ساعات تغطية"
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">السعر المعتمد (SAR):</label>
                  <input
                    type="number"
                    required
                    value={editingPackage.package.price}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        package: {
                          ...editingPackage.package,
                          price: Number(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">مدة الخدمة (ساعات):</label>
                  <input
                    type="number"
                    value={editingPackage.package.durationHours || 4}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        package: {
                          ...editingPackage.package,
                          durationHours: Number(e.target.value) || 4
                        }
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">مدة التسليم:</label>
                  <input
                    type="text"
                    value={editingPackage.package.deliveryTimeframe || '٤٨ ساعة'}
                    onChange={(e) =>
                      setEditingPackage({
                        ...editingPackage,
                        package: {
                          ...editingPackage.package,
                          deliveryTimeframe: e.target.value
                        }
                      })
                    }
                    placeholder="مثال: ٤٨ ساعة"
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPackage.package.popular || false}
                      onChange={(e) =>
                        setEditingPackage({
                          ...editingPackage,
                          package: {
                            ...editingPackage.package,
                            popular: e.target.checked
                          }
                        })
                      }
                      className="w-4 h-4 rounded text-[#2C1E18]"
                    />
                    <span>تمييز كباقة «الأكثر طلباً»</span>
                  </label>
                </div>
              </div>

              {/* Package features list */}
              <div className="space-y-2 pt-2 border-t border-[#E6DCD2]">
                <label className="block font-bold text-[#2C1E18]">مميزات الباقة ومحتواها:</label>
                <div className="space-y-1.5">
                  {(editingPackage.package.features || []).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 bg-[#F3ECE1] rounded-xl text-xs"
                    >
                      <span>• {feat}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedFeats = editingPackage.package.features.filter(
                            (_, i) => i !== idx
                          );
                          setEditingPackage({
                            ...editingPackage,
                            package: { ...editingPackage.package, features: updatedFeats }
                          });
                        }}
                        className="text-[#8A2626] hover:bg-[#FDF2F2] p-1 rounded-md cursor-pointer"
                        title="حذف الميزة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="اكتبي ميزة جديدة (مثال: تصوير بدقة 4K)"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newFeatureText.trim()) return;
                      const updatedFeats = [
                        ...(editingPackage.package.features || []),
                        newFeatureText.trim()
                      ];
                      setEditingPackage({
                        ...editingPackage,
                        package: { ...editingPackage.package, features: updatedFeats }
                      });
                      setNewFeatureText('');
                    }}
                    className="px-3 py-1.5 bg-[#2C1E18] text-[#FAF6F0] font-bold rounded-xl text-xs hover:bg-[#422E25] cursor-pointer"
                  >
                    إضافة
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  حفظ الباقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 3. CITY COVERAGE EDIT MODAL ================= */}
      {editingCity && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingCity(null)}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              تعديل تغطية مدينة: {editingCity.cityName}
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F3ECE1]">
                <span className="font-bold text-[#2C1E18]">حالة استقبال الطلبات بالمدينة:</span>
                <button
                  type="button"
                  onClick={() =>
                    setEditingCity({ ...editingCity, isActive: !editingCity.isActive })
                  }
                  className={`px-3 py-1 rounded-full font-bold border cursor-pointer ${
                    editingCity.isActive
                      ? 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2]'
                      : 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8]'
                  }`}
                >
                  {editingCity.isActive ? 'مفعلة وتستقبل حجوزات' : 'معطلة مؤقتاً'}
                </button>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">
                  رسوم الانتقال والتجهيز المعتمدة (SAR):
                </label>
                <input
                  type="number"
                  value={editingCity.transportFeeSar}
                  onChange={(e) =>
                    setEditingCity({
                      ...editingCity,
                      transportFeeSar: Number(e.target.value) || 0
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono font-bold"
                />
                <span className="text-[10px] text-[#645249]">
                  ضعي 0 إذا كانت الرسوم مشمولة مجاناً بدون تكلفة إضافية.
                </span>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">تنبيه وإشعار المدينة للعملاء:</label>
                <textarea
                  rows={2}
                  value={editingCity.notice || ''}
                  onChange={(e) =>
                    setEditingCity({ ...editingCity, notice: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              {/* Districts Tag Manager */}
              <div className="space-y-2 pt-2 border-t border-[#E6DCD2]">
                <label className="block font-bold text-[#2C1E18]">
                  الأحياء المعتمدة المخدومة ({editingCity.districts.length} أحياء):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {editingCity.districts.map((d) => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-lg bg-[#F3ECE1] text-[#2C1E18] text-[11px] font-medium flex items-center gap-1.5 border border-[#D8CBB8]"
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedDistricts = editingCity.districts.filter((item) => item !== d);
                          setEditingCity({ ...editingCity, districts: updatedDistricts });
                        }}
                        className="text-[#8A2626] hover:bg-[#FDF2F2] rounded-full p-0.5 cursor-pointer"
                        title="إزالة الحي"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="اسم حي جديد..."
                    value={newDistrictInput}
                    onChange={(e) => setNewDistrictInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newDistrictInput.trim()) return;
                      if (editingCity.districts.includes(newDistrictInput.trim())) {
                        showToast('هذا الحي مضاف مسبقاً', 'error');
                        return;
                      }
                      const updated = [...editingCity.districts, newDistrictInput.trim()];
                      setEditingCity({ ...editingCity, districts: updated });
                      setNewDistrictInput('');
                    }}
                    className="px-3 py-1.5 bg-[#2C1E18] text-[#FAF6F0] font-bold rounded-xl text-xs hover:bg-[#422E25] cursor-pointer"
                  >
                    إضافة حي
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setEditingCity(null)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = cityCoverage.map((c) =>
                      c.cityName === editingCity.cityName ? editingCity : c
                    );
                    handleSaveCityCoverage(updated);
                  }}
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  حفظ تغطية المدينة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. HERO BANNER ADD / EDIT MODAL ================= */}
      {(showAddBannerModal || editingBanner) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowAddBannerModal(false);
                setEditingBanner(null);
              }}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              {editingBanner ? 'تعديل بنر السلايدر' : 'إضافة بنر رئيسي جديد'}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingBanner) {
                  handleUpdateBanner(editingBanner);
                } else {
                  handleAddBanner(e);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">عنوان البنر الرئيسي:</label>
                <input
                  type="text"
                  required
                  value={editingBanner ? editingBanner.title : newBanner.title}
                  onChange={(e) => {
                    if (editingBanner) {
                      setEditingBanner({ ...editingBanner, title: e.target.value });
                    } else {
                      setNewBanner({ ...newBanner, title: e.target.value });
                    }
                  }}
                  placeholder="مثال: نضيء لياليك وفرحة صغارك"
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">الوصف الفرعي:</label>
                <textarea
                  rows={2}
                  value={editingBanner ? editingBanner.subtitle : newBanner.subtitle}
                  onChange={(e) => {
                    if (editingBanner) {
                      setEditingBanner({ ...editingBanner, subtitle: e.target.value });
                    } else {
                      setNewBanner({ ...newBanner, subtitle: e.target.value });
                    }
                  }}
                  placeholder="من تصوير أجمل اللحظات إلى عالم الأطفال الآمن..."
                  className="w-full p-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">شارة البنر (Badge):</label>
                  <input
                    type="text"
                    value={editingBanner ? editingBanner.badge : newBanner.badge}
                    onChange={(e) => {
                      if (editingBanner) {
                        setEditingBanner({ ...editingBanner, badge: e.target.value });
                      } else {
                        setNewBanner({ ...newBanner, badge: e.target.value });
                      }
                    }}
                    placeholder="✨ الأكثر طلباً"
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">ترتيب العرض:</label>
                  <input
                    type="number"
                    value={editingBanner ? editingBanner.displayOrder : newBanner.displayOrder}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 1;
                      if (editingBanner) {
                        setEditingBanner({ ...editingBanner, displayOrder: val });
                      } else {
                        setNewBanner({ ...newBanner, displayOrder: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">رابط صورة سطح المكتب:</label>
                <input
                  type="text"
                  required
                  value={editingBanner ? editingBanner.desktopImageUrl : newBanner.desktopImageUrl}
                  onChange={(e) => {
                    if (editingBanner) {
                      setEditingBanner({ ...editingBanner, desktopImageUrl: e.target.value });
                    } else {
                      setNewBanner({ ...newBanner, desktopImageUrl: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">نص زر التحويل (CTA):</label>
                  <input
                    type="text"
                    value={editingBanner ? editingBanner.ctaText : newBanner.ctaText}
                    onChange={(e) => {
                      if (editingBanner) {
                        setEditingBanner({ ...editingBanner, ctaText: e.target.value });
                      } else {
                        setNewBanner({ ...newBanner, ctaText: e.target.value });
                      }
                    }}
                    placeholder="استكشاف باقات لومير"
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">وجهة الزر:</label>
                  <input
                    type="text"
                    value={editingBanner ? editingBanner.ctaLink : newBanner.ctaLink}
                    onChange={(e) => {
                      if (editingBanner) {
                        setEditingBanner({ ...editingBanner, ctaLink: e.target.value });
                      } else {
                        setNewBanner({ ...newBanner, ctaLink: e.target.value });
                      }
                    }}
                    placeholder="catalog أو mobile-photography"
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBannerModal(false);
                    setEditingBanner(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  {editingBanner ? 'حفظ تعديل البنر' : 'إضافة البنر للسلايدر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 5. FAQ EDIT MODAL ================= */}
      {editingFaq && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingFaq(null)}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              تعديل السؤال الشائع
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateFaq(editingFaq);
              }}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">السؤال:</label>
                <input
                  type="text"
                  required
                  value={editingFaq.question}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">التصنيف:</label>
                <input
                  type="text"
                  required
                  value={editingFaq.category}
                  onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">الإجابة:</label>
                <textarea
                  rows={3}
                  required
                  value={editingFaq.answer}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full p-3 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setEditingFaq(null)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 6. PORTFOLIO ITEM EDIT MODAL ================= */}
      {editingPortfolioItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingPortfolioItem(null)}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              تعديل عمل من المعرض
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdatePortfolio(editingPortfolioItem);
              }}
              className="space-y-3 text-xs"
            >
              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">عنوان العمل:</label>
                <input
                  type="text"
                  required
                  value={editingPortfolioItem.title}
                  onChange={(e) =>
                    setEditingPortfolioItem({ ...editingPortfolioItem, title: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">الخدمة:</label>
                  <select
                    value={editingPortfolioItem.categoryKey}
                    onChange={(e) =>
                      setEditingPortfolioItem({
                        ...editingPortfolioItem,
                        categoryKey: e.target.value as ServiceCategoryKey
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  >
                    <option value="mobile_photography">١. تصوير المناسبات بالجوال</option>
                    <option value="kids_corner">٢. أركان الأطفال</option>
                    <option value="kids_activities">٣. أنشطة الأطفال</option>
                    <option value="wedding_support">٤. خدمات الأفراح</option>
                    <option value="event_setups">٥. تجهيزات المناسبات</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">المدينة:</label>
                  <select
                    value={editingPortfolioItem.city}
                    onChange={(e) =>
                      setEditingPortfolioItem({
                        ...editingPortfolioItem,
                        city: e.target.value as any
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  >
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="جدة">جدة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">رابط الصورة أو الفيديو:</label>
                <input
                  type="text"
                  required
                  value={editingPortfolioItem.mediaUrl}
                  onChange={(e) =>
                    setEditingPortfolioItem({ ...editingPortfolioItem, mediaUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">وصف العمل:</label>
                <textarea
                  rows={2}
                  value={editingPortfolioItem.caption || ''}
                  onChange={(e) =>
                    setEditingPortfolioItem({ ...editingPortfolioItem, caption: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPortfolioItem.isPublic}
                    onChange={(e) =>
                      setEditingPortfolioItem({
                        ...editingPortfolioItem,
                        isPublic: e.target.checked
                      })
                    }
                    className="w-4 h-4 rounded text-[#2C1E18]"
                  />
                  <span>عرض هذا العمل لعملاء وزوار المتجر</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setEditingPortfolioItem(null)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 7. COUPON EDIT MODAL ================= */}
      {editingCoupon && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingCoupon(null)}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              تعديل كود الخصم: {editingCoupon.code}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateCoupon(editingCoupon);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">نوع الخصم:</label>
                  <select
                    value={editingCoupon.discountType}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        discountType: e.target.value as 'percentage' | 'fixed'
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (SAR)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">قيمة الخصم:</label>
                  <input
                    type="number"
                    required
                    value={editingCoupon.discountValue}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        discountValue: Number(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">الحد الأدنى للطلب (SAR):</label>
                  <input
                    type="number"
                    value={editingCoupon.minOrderAmountSar || 0}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        minOrderAmountSar: Number(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">الحد الأقصى للخصم (SAR):</label>
                  <input
                    type="number"
                    value={editingCoupon.maxDiscountSar || 0}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        maxDiscountSar: Number(e.target.value) || 0
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingCoupon.isActive}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        isActive: e.target.checked
                      })
                    }
                    className="w-4 h-4 rounded text-[#2C1E18]"
                  />
                  <span>كود الخصم مفعّل وجاهز للاستخدام من قبل العملاء</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  حفظ تعديل الكوبون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 8. ADD ADMIN USER MODAL ================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAddUserModal(false)}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              إضافة مسؤول جديد وتحديد الصلاحيات
            </h3>
            <p className="text-xs text-[#645249]">
              يتم إنشاء الحساب واعتماده على الخادم وقاعدة البيانات مع قواعد الصلاحيات المحددة.
            </p>

            <form onSubmit={handleAddAdminUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة العتيبي"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">البريد الإلكتروني المهني:</label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  placeholder="sara@lumir.sa"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">رقم الجوال للتواصل:</label>
                <input
                  type="text"
                  dir="ltr"
                  placeholder="0500000000"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">الرتبة والصلاحية:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as AdminRole })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-bold"
                >
                  <option value="operations_manager">مشرفة العمليات والمواعيد (إدارة الطلبات والتقويم)</option>
                  <option value="content_editor">مسؤولة المحتوى والكتالوج (الخدمات ومعرض الأعمال والأسئلة)</option>
                  <option value="super_admin">المديرة العامة (Super Admin - صلاحيات كاملة)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#F3ECE1] border border-[#E6DCD2] text-[11px] text-[#645249]">
                كلمة المرور الافتراضية للحسابات الجديدة هي: <code className="font-mono font-bold text-[#2C1E18]">Lumir@2026</code>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  إنشاء حساب المسؤول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 9. EDIT ADMIN USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
              تعديل رتبة وصلاحيات المسؤول
            </h3>
            <p className="text-xs text-[#645249]">
              حساب: <span className="font-bold text-[#2C1E18]">{editingUser.name}</span> ({editingUser.email})
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateAdminUser(editingUser);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">الاسم:</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">رقم الجوال:</label>
                <input
                  type="text"
                  dir="ltr"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">الرتبة والصلاحية:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as AdminRole })
                  }
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-bold"
                >
                  <option value="operations_manager">مشرفة العمليات والمواعيد</option>
                  <option value="content_editor">مسؤولة المحتوى والكتالوج</option>
                  <option value="super_admin">المديرة العامة (Super Admin)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#2C1E18]"
                  />
                  <span>الحساب نشط ويملك حق الوصول للوحة الإدارة</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  حفظ الصلاحيات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= 10. ADD / EDIT ANNOUNCEMENT MODAL ================= */}
      {showAddAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF6F0] rounded-3xl border border-[#D8CBB8] max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowAddAnnouncementModal(false);
                setEditingAnnouncement(null);
              }}
              className="absolute left-6 top-6 p-2 rounded-full hover:bg-[#E6DCD2] cursor-pointer"
            >
              <X className="w-5 h-5 text-[#2C1E18]" />
            </button>

            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#8C6D36]" />
              <h3 className="font-display text-2xl font-bold text-[#2C1E18]">
                {editingAnnouncement ? 'تعديل نص الإعلان بالشريط' : 'إضافة نص جديد للشريط المتحرك'}
              </h3>
            </div>
            <p className="text-xs text-[#645249]">
              اكتبي النص الذي سيتحرك في أعلى الموقع للزوار، مع إمكانية إضافة وسم مميز ورابط تحويل مباشر.
            </p>

            <form onSubmit={handleSaveAnnouncementModalSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-[#2C1E18]">
                  نص الإعلان أو التنبيه (مطلوب):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="مثال: موسم مناسبات ٢٠٢٦ في مكة المكرمة وجدة — احجزي موعدكِ الآن بأسعار خاصة"
                  value={announcementForm.text}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, text: e.target.value })
                  }
                  className="w-full p-3 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl text-xs leading-relaxed"
                />
              </div>

              {/* Badge & Quick suggestions */}
              <div className="space-y-1.5">
                <label className="block font-bold text-[#2C1E18]">
                  الوسم المميز (اختياري - يظهر كشارة ملونة قبل النص):
                </label>
                <input
                  type="text"
                  placeholder="مثال: ✨ عرض حصري"
                  value={announcementForm.badge}
                  onChange={(e) =>
                    setAnnouncementForm({ ...announcementForm, badge: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#645249]">اقتراحات سريعة:</span>
                  {[
                    '✨ عرض حصري',
                    '📸 تسليم فوري',
                    '🎁 كود خصم',
                    '🎨 أركان الأطفال',
                    '💍 مساندة أفراح',
                    '⚡ مكة وجدة'
                  ].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setAnnouncementForm({ ...announcementForm, badge: sug })}
                      className="px-2 py-0.5 rounded-full bg-[#F3ECE1] hover:bg-[#E6DCD2] border border-[#D8CBB8] text-[10px] font-bold text-[#2C1E18] cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link Target & Link Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">
                    الوجهة / الرابط عند النقر:
                  </label>
                  <select
                    value={announcementForm.linkTarget}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, linkTarget: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl font-bold"
                  >
                    <option value="">بدون رابط (نص إعلاني فقط)</option>
                    <option value="booking">طلب حجز موعد (Booking)</option>
                    <option value="mobile-photography">تصوير المناسبات بالجوال</option>
                    <option value="kids-corner">ركن الأطفال والأنشطة</option>
                    <option value="childcare">مشرفات رعاية الأطفال</option>
                    <option value="wedding-support">خدمات مساندة الأفراح</option>
                    <option value="gallery">معرض الأعمال والنماذج</option>
                    <option value="catalog">كتالوج الخدمات الكامل</option>
                    <option value="whatsapp">محادثة واتساب مباشرة</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#2C1E18]">
                    نص زر التحويل (اختياري):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: احجزي الآن"
                    value={announcementForm.linkText}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, linkText: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 font-bold text-[#2C1E18] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={announcementForm.isActive}
                    onChange={(e) =>
                      setAnnouncementForm({ ...announcementForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-[#2C1E18]"
                  />
                  <span>تفعيل هذا النص فوراً في الشريط المتحرك</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DCD2]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddAnnouncementModal(false);
                    setEditingAnnouncement(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-[#D8CBB8] hover:bg-[#E6DCD2] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2C1E18] text-[#FAF6F0] font-bold hover:bg-[#422E25] cursor-pointer shadow-xs"
                >
                  {editingAnnouncement ? 'حفظ تعديلات النص' : 'إضافة النص للشريط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
