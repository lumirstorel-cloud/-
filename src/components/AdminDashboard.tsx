import React, { useState, useMemo, useEffect } from 'react';
import {
  AdminRole,
  AdminUser,
  AuditLogEntry,
  BookingStatus,
  BookingSubmission,
  CityCoverageSetting,
  CouponItem,
  FAQItem,
  LumirCentralData,
  PageView,
  PortfolioMediaItem,
  PricingModel,
  ServiceCategoryKey,
  ServiceItem,
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
  getPricingModelLabel,
  getStatusBadgeStyle,
  getStatusLabel
} from '../utils/formatters';
import {
  adminAddCouponApi,
  adminAddFAQApi,
  adminAddPortfolioApi,
  adminDeleteBookingApi,
  adminDeleteCouponApi,
  adminDeleteFAQApi,
  adminDeletePortfolioApi,
  adminGetFullDataApi,
  adminLoginApi,
  adminSyncAllApi,
  adminUpdateBookingStatusApi,
  adminUpdateCityCoverageApi,
  adminUpdatePackageApi,
  adminUpdateServiceApi,
  adminUpdateSettingsApi
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
  X
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
      announcements: data.announcements,
      banners: data.banners,
      sliderSettings: data.sliderSettings
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
        if (
          !window.confirm(
            `⚠️ تنبيه تعارض: يوجد موعد آخر مؤكد لنفس الخدمة (${conflict.referenceCode}) في تاريخ ${conflict.eventDate} الساعة ${conflict.startTime}. هل ترغبين بتأكيد كلا الحجزين معاً؟`
          )
        ) {
          return;
        }
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

  // Delete Order with confirmation
  const handleDeleteOrder = async (id: string) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('حذف الطلبات نهائياً متاح فقط للمدير العام (Super Admin)', 'error');
      return;
    }

    if (!window.confirm('هل أنتِ متأكدة تماماً من حذف هذا الطلب نهائياً من قاعدة البيانات؟ لا يمكن التراجع.')) {
      return;
    }

    const res = await adminDeleteBookingApi(token, id);
    if (res.success) {
      setBookings(bookings.filter((b) => b.id !== id));
      if (selectedOrder && selectedOrder.id === id) setSelectedOrder(null);
      showToast('تم حذف الطلب بنجاح.');
    } else {
      showToast(res.error || 'تعذر حذف الطلب', 'error');
    }
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

  const handleDeletePortfolio = async (id: string) => {
    if (!token) return;
    if (!window.confirm('هل أنتِ متأكدة من حذف هذا العمل من معرض الأعمال؟')) return;
    const res = await adminDeletePortfolioApi(token, id);
    if (res.success) {
      setPortfolio(portfolio.filter((p) => p.id !== id));
      showToast('تم حذف العمل بنجاح.');
    } else {
      showToast(res.error || 'تعذر الحذف', 'error');
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

  const handleDeleteFaq = async (id: string) => {
    if (!token) return;
    if (!window.confirm('هل تريدين حذف هذا السؤال الشائع؟')) return;
    const res = await adminDeleteFAQApi(token, id);
    if (res.success) {
      setFaqs(faqs.filter((f) => f.id !== id));
      showToast('تم حذف السؤال بنجاح.');
    } else {
      showToast(res.error || 'تعذر الحذف', 'error');
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

  const handleDeleteCoupon = async (id: string) => {
    if (!token) return;
    if (!hasRole(['super_admin'])) {
      showToast('حذف الكوبونات متاح للمدير العام فقط', 'error');
      return;
    }
    if (!window.confirm('هل أنتِ متأكدة من حذف هذا الكوبون؟')) return;
    const res = await adminDeleteCouponApi(token, id);
    if (res.success) {
      setCoupons(coupons.filter((c) => c.id !== id));
      showToast('تم حذف الكوبون بنجاح.');
    } else {
      showToast(res.error || 'تعذر الحذف', 'error');
    }
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

              {/* Recent Audit Logs Quick Box */}
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
                    {service.packages.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <span className="font-bold text-xs text-[#2C1E18]">
                          الباقات المعتمدة ({service.packages.length} باقات):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {service.packages.map((pkg) => (
                            <div
                              key={pkg.id}
                              className="p-4 rounded-2xl bg-[#F3ECE1]/70 border border-[#E6DCD2] text-xs space-y-2"
                            >
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                      <span className="px-3 py-1 rounded-full bg-[#EDF7F0] text-[#1F5E3B] text-xs font-bold border border-[#B6DFC2]">
                        {city.isActive ? 'مفعلة' : 'معطلة'}
                      </span>
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
                          {getCategoryLabel(item.categoryKey)} {item.city ? `· ${item.city}` : ''}
                        </div>
                        {item.caption && (
                          <p className="text-[11px] text-[#645249] mt-1 line-clamp-2">
                            {item.caption}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#E6DCD2] flex items-center justify-between">
                        <span className="text-[10px] text-[#1F5E3B] font-bold">
                          {item.isPublic ? 'معروض' : 'مخفي'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePortfolio(item.id)}
                          className="p-1.5 rounded-lg text-[#8A2626] hover:bg-[#FDF2F2] cursor-pointer"
                          title="حذف العمل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                            <option value="mobile_photography">تصوير الجوال</option>
                            <option value="kids_corner">ركن الأطفال</option>
                            <option value="childcare">رعاية الأطفال</option>
                            <option value="wedding_support">مساندة وتنظيم</option>
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

          {/* ================= 7. CONTENT & FAQS TAB ================= */}
          {activeTab === 'faqs' && (
            <div className="space-y-6 max-w-[1240px] mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl font-bold text-[#2C1E18]">
                    الأسئلة الشائعة ومحتوى المتجر ({faqs.length})
                  </h2>
                  <p className="text-xs text-[#645249] mt-1">
                    إدارة الأسئلة المتكررة وتعديل الإجابات وتصنيفاتها.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddFaqModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm hover:bg-[#422E25]"
                >
                  <Plus className="w-4 h-4 text-[#C8A96E]" />
                  <span>إضافة سؤال شائع جديد</span>
                </button>
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
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(faq.id)}
                        className="text-[#8A2626] hover:bg-[#FDF2F2] p-1.5 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[#645249] leading-relaxed pr-2">{faq.answer}</p>
                  </div>
                ))}
              </div>

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
                      إضافة سؤال شائع
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
                          إضافة
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
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
                      <div className="pt-2 border-t border-[#E6DCD2] flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(cp.id)}
                          className="text-[#8A2626] hover:bg-[#FDF2F2] p-1.5 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
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
                <span className="font-bold text-xs text-[#2C1E18] block">حسابات المسؤولين المعتمدة:</span>
                <div className="space-y-2">
                  {adminsList.map((adm) => (
                    <div
                      key={adm.id}
                      className="p-3.5 rounded-xl bg-[#F3ECE1] flex items-center justify-between text-xs"
                    >
                      <div>
                        <strong className="text-[#2C1E18] ml-2">{adm.name}</strong>
                        <span className="font-mono text-[#645249]">{adm.email}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRoleBadgeStyle(
                          adm.role
                        )}`}
                      >
                        {getRoleLabel(adm.role)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
