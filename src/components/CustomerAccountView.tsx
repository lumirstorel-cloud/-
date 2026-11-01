import React, { useEffect, useState } from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { BookingSubmission, BookingStatus, PageView } from '../types';
import {
  formatArabicDate,
  formatArabicNumber,
  formatArabicTime,
  formatSar,
  getStatusBadgeStyle,
  getStatusLabel
} from '../utils/formatters';
import { trackGuestBookingApi } from '../utils/apiClient';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  LogOut,
  ShoppingBag,
  Search,
  X,
  Sparkles,
  Phone,
  MessageCircle,
  Eye,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';

interface CustomerAccountViewProps {
  navigate: (view: PageView, slug?: string) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({ navigate }) => {
  const { user, token, logout, openAuthModal, signInWithGoogle } = useCustomerAuth();
  const [orders, setOrders] = useState<BookingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guest Search Form States
  const [guestRef, setGuestRef] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [guestBooking, setGuestBooking] = useState<BookingSubmission | null>(null);
  const [isGuestSearching, setIsGuestSearching] = useState<boolean>(false);
  const [guestSearchError, setGuestSearchError] = useState<string | null>(null);

  // Selected order for details modal
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<BookingSubmission | null>(null);

  // Fetch logged-in user orders from Supabase via backend endpoint
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch('/api/customer/orders', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const contentType = res.headers.get('content-type') || '';
        let data: any = null;
        if (contentType.includes('application/json')) {
          data = await res.json().catch(() => null);
        } else {
          const text = await res.text().catch(() => '');
          try {
            data = JSON.parse(text);
          } catch {
            data = null;
          }
        }

        if (res.ok && data?.success) {
          setOrders(data.orders || []);
        } else {
          setErrorMsg(
            data?.error ||
              (res.status === 404
                ? 'مسار طلبات العميل غير متوفر في الخادم (404 Not Found)'
                : res.status >= 500
                ? 'خدمة الطلبات غير متاحة حالياً، يرجى المحاولة لاحقاً'
                : `تعذر تحميل قائمة الطلبات (رمز ${res.status})`)
          );
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'خطأ في الاتصال بالخادم');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  // Guest Search Handler requiring BOTH reference code and phone number
  const handleGuestSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestSearchError(null);

    const cleanRef = guestRef.trim().toUpperCase();
    const cleanPhone = guestPhone.trim();

    if (!cleanRef || !cleanPhone) {
      setGuestSearchError('يرجى إدخال الرقم المرجعي ورقم الجوال المسجل معاً للتحقق من هوية الطلب.');
      return;
    }

    setIsGuestSearching(true);
    try {
      const res = await trackGuestBookingApi(cleanRef, cleanPhone);
      if (res.success && res.booking) {
        setGuestBooking(res.booking);
        setGuestSearchError(null);
      } else {
        setGuestBooking(null);
        setGuestSearchError(
          res.error ||
            'تعذر العثور على حجز يطابق هذا الرقم المرجعي ورقم الجوال معاً. يرجى التأكد من البيانات المدخلة.'
        );
      }
    } catch {
      setGuestBooking(null);
      setGuestSearchError('حدث خطأ أثناء الاستعلام، يرجى المحاولة لاحقاً.');
    } finally {
      setIsGuestSearching(false);
    }
  };

  const statusArabicBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مؤكد ومجدول</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock3 className="w-3.5 h-3.5" />
            <span>قيد المراجعة</span>
          </span>
        );
      case 'pending_client_confirmation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>بانتظار تأكيد العميل</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Clock className="w-3.5 h-3.5" />
            <span>جارٍ التنفيذ</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" />
            <span>مكتمل</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>ملغي</span>
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            <span>مسودة</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-10 space-y-10" dir="rtl">
      {/* 1. Header / Intro Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3ECE1] border border-[#D8CBB8] text-xs font-bold text-[#8C6D36]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>منظومة تتبع الحجوزات وطلباتي · LUMIR</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2C1E18]">
          طلباتي وتتبع الحجوزات
        </h1>
        <p className="text-sm text-[#645249] leading-relaxed">
          استعراض ومتابعة حالات حجوزات المناسبات والأفراح في مكة المكرمة وجدة، مع إمكانية التحقق الآمن بالرقم المرجعي ورقم الجوال.
        </p>
      </div>

      {/* 2. Customer Profile Card (If logged in) */}
      {user ? (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#2C1E18] text-[#FAF6F0] flex items-center justify-center font-display text-2xl font-bold shadow-xs shrink-0">
              {user.name ? user.name[0] : 'L'}
            </div>
            <div>
              <div className="text-[11px] text-[#8C6D36] font-bold">حساب العميل المسجل</div>
              <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                {user.name || 'عميل لومير المميّز'}
              </h2>
              <p className="text-xs text-[#645249] mt-0.5">{user.email}</p>
              {user.phone && (
                <p className="text-xs text-[#645249] font-mono-num mt-0.5" dir="ltr">
                  {user.phone}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate('booking')}
              className="flex-1 sm:flex-initial px-5 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer"
            >
              طلب حجز جديد
            </button>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 text-xs font-bold text-rose-800 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors inline-flex items-center gap-2 cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      ) : (
        /* If guest: Option to Sign In with Google / Email for automatic order tracking */
        <div className="p-6 sm:p-8 rounded-2xl bg-linear-to-b from-[#F3ECE1] to-[#FAF6F0] border border-[#D8CBB8] space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8C6D36]" />
                <h3 className="font-display font-bold text-lg text-[#2C1E18]">
                  هل تودين تتبع كافة طلباتكِ تلقائياً؟
                </h3>
              </div>
              <p className="text-xs text-[#645249] max-w-xl">
                سجّلي دخولكِ بواسطة Google أو بالبريد الإلكتروني للوصول المباشر إلى جميع حجوزاتكِ المسجلة دون الحاجة للبحث اليدوي.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => signInWithGoogle('/customer-account')}
                className="flex-1 md:flex-initial px-5 py-2.5 text-xs font-bold bg-white hover:bg-[#F3ECE1] text-[#2C1E18] border border-[#D8CBB8] rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>الدخول بواسطة Google</span>
              </button>

              <button
                type="button"
                onClick={() => openAuthModal('customer-account')}
                className="flex-1 md:flex-initial px-5 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer"
              >
                الدخول بالبريد الإلكتروني
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Orders List for Logged-In User */}
      {user && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
                قائمة طلباتي الحقيقية
              </h2>
              <p className="text-xs text-[#645249] mt-1">
                طلباتكِ المسترجعة مباشرة من قاعدة بيانات لومير في Supabase
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('cart')}
              className="text-xs font-bold text-[#8C6D36] hover:text-[#2C1E18] inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>عرض السلة الحالية</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-xs text-[#8C6D36] space-y-2">
              <div className="w-6 h-6 border-2 border-[#8C6D36] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>جاري استرجاع طلباتكِ الخاصة بأمان من قاعدة البيانات...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMsg}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4">
              <Calendar className="w-12 h-12 mx-auto text-[#8C6D36]/60 stroke-1" />
              <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                لا توجد طلبات حجوزات مسجلة حتى الآن
              </h3>
              <p className="text-xs text-[#645249] max-w-md mx-auto">
                عند تقديمكِ لأي طلب حجز في مكة المكرمة أو جدة، ستظهر تفاصيله ومسار اعتماده هنا فوراً.
              </p>
              <button
                type="button"
                onClick={() => navigate('booking')}
                className="px-6 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer"
              >
                احجزي خدمتكِ الأولى الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl bg-white border border-[#E6DCD2] shadow-xs hover:border-[#8C6D36] transition-all space-y-4 text-right flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-[#F3ECE1]">
                      <div>
                        <span className="text-[11px] text-[#8C6D36] block">الرقم المرجعي</span>
                        <span className="font-mono text-sm font-bold text-[#2C1E18]">
                          {order.referenceCode}
                        </span>
                      </div>
                      <div>{statusArabicBadge(order.status)}</div>
                    </div>

                    <div>
                      <h4 className="font-bold text-base text-[#2C1E18]">
                        {order.serviceName}
                      </h4>
                      {order.packageName && (
                        <p className="text-xs text-[#8C6D36] mt-0.5">{order.packageName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-[#645249] pt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8C6D36]" />
                        <span>{order.eventDate ? formatArabicDate(order.eventDate) : 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8C6D36]" />
                        <span>{order.city} {order.district ? `· ${order.district}` : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#F3ECE1] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#8C6D36] block">المبلغ الإجمالي</span>
                      <span className="font-mono text-sm font-bold text-[#2C1E18]">
                        {formatSar(order.estimatedTotalSar || order.subtotalSar)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedOrderForDetails(order)}
                      className="px-4 py-2 text-xs font-bold bg-[#FAF6F0] hover:bg-[#F3ECE1] text-[#2C1E18] border border-[#D8CBB8] rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#8C6D36]" />
                      <span>عرض تفاصيل الطلب</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. Secure Guest Search Form (Mandatory phone + reference code matching) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] space-y-6 text-right">
        <div className="border-b border-[#E6DCD2] pb-4 space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#8C6D36]" />
            <h3 className="font-display font-bold text-xl text-[#2C1E18]">
              {user ? 'البحث عن طلب آخر كضيف' : 'الاستعلام عن طلبكِ برقم الطلب والجوال'}
            </h3>
          </div>
          <p className="text-xs text-[#645249]">
            لحماية خصوصية مناسبتكِ، لن تظهر أي تفاصيل إلا عند مطابقة <strong>الرقم المرجعي للطلب</strong> مع <strong>رقم الجوال المسجل</strong> معاً.
          </p>
        </div>

        <form onSubmit={handleGuestSearch} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#2C1E18]">
                رقم الطلب المرجعي *
              </label>
              <input
                type="text"
                dir="ltr"
                value={guestRef}
                onChange={(e) => setGuestRef(e.target.value)}
                placeholder="مثال: LMR-2610-XXXX"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D8CBB8] focus:outline-none focus:border-[#8C6D36] font-mono font-bold text-[#2C1E18]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#2C1E18]">
                رقم الجوال المسجل *
              </label>
              <input
                type="tel"
                dir="ltr"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="مثال: 05XXXXXXXX"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-[#D8CBB8] focus:outline-none focus:border-[#8C6D36] font-mono text-[#2C1E18]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGuestSearching}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
          >
            <Search className="w-4 h-4 text-[#C8A96E]" />
            <span>{isGuestSearching ? 'جاري التحقق...' : 'استعلام عن تفاصيل الطلب'}</span>
          </button>
        </form>

        {guestSearchError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 text-right flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{guestSearchError}</span>
          </div>
        )}

        {/* Verified Guest Order Result */}
        {guestBooking && (
          <div className="p-6 rounded-2xl bg-white border border-[#8C6D36] shadow-sm space-y-5 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#E6DCD2]">
              <div>
                <span className="text-xs text-[#8C6D36] font-bold">تم التحقق من ملكية الحجز بنجاح</span>
                <div className="font-mono text-xl font-bold text-[#2C1E18] mt-0.5">
                  {guestBooking.referenceCode}
                </div>
              </div>
              <div>{statusArabicBadge(guestBooking.status)}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#FAF6F0] space-y-1">
                <span className="text-[#8C6D36] block font-bold">الخدمة والباقة:</span>
                <div className="font-bold text-[#2C1E18]">{guestBooking.serviceName}</div>
                {guestBooking.packageName && (
                  <div className="text-[#645249]">{guestBooking.packageName}</div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] space-y-1">
                <span className="text-[#8C6D36] block font-bold">المدينة والحي:</span>
                <div className="font-bold text-[#2C1E18]">{guestBooking.city}</div>
                <div className="text-[#645249]">حي {guestBooking.district}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] space-y-1">
                <span className="text-[#8C6D36] block font-bold">التاريخ والتوقيت:</span>
                <div className="font-bold text-[#2C1E18]">
                  {guestBooking.eventDate ? formatArabicDate(guestBooking.eventDate) : '—'}
                </div>
                <div className="text-[#645249]">
                  {guestBooking.startTime ? `الساعة ${formatArabicTime(guestBooking.startTime)}` : ''} ({guestBooking.durationHours} ساعات)
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF6F0] space-y-1">
                <span className="text-[#8C6D36] block font-bold">المبلغ الإجمالي:</span>
                <div className="font-mono text-base font-bold text-[#2C1E18]">
                  {formatSar(guestBooking.estimatedTotalSar || guestBooking.subtotalSar)}
                </div>
                <div className="text-[#645249] text-[11px]">شامل كافة البنود المعتمدة</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6DCD2]">
              <span className="text-xs text-[#645249]">
                حالة الطلب الحالية: <strong>{getStatusLabel(guestBooking.status)}</strong>
              </span>

              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(guestBooking)}
                className="px-5 py-2 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-[#C8A96E]" />
                <span>عرض تفاصيل الطلب الكاملة</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Comprehensive Order Details Modal */}
      {selectedOrderForDetails && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedOrderForDetails(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#FAF6F0] rounded-3xl shadow-2xl border border-[#E6DCD2] overflow-hidden flex flex-col text-[#2C1E18] max-h-[90vh]"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-[#E6DCD2] flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2C1E18] text-[#C8A96E] flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-[#8C6D36] font-bold">تفاصيل الحجز المؤكد</div>
                  <h3 className="font-mono text-xl font-bold text-[#2C1E18]">
                    {selectedOrderForDetails.referenceCode}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="p-2 text-[#645249] hover:text-[#2C1E18] rounded-xl hover:bg-[#F3ECE1] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-right">
              {/* Status Badge + Date info */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8]">
                <div>
                  <span className="text-xs text-[#645249] block">حالة الطلب:</span>
                  <div className="mt-1">{statusArabicBadge(selectedOrderForDetails.status)}</div>
                </div>
                <div className="text-left">
                  <span className="text-xs text-[#645249] block">تاريخ تقديم الطلب</span>
                  <span className="text-xs font-mono font-bold text-[#2C1E18]">
                    {new Date(selectedOrderForDetails.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>

              {/* Service & Venue Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white border border-[#E6DCD2] space-y-1.5">
                  <span className="text-[#8C6D36] font-bold block">الخدمة والباقة:</span>
                  <div className="text-sm font-bold text-[#2C1E18]">
                    {selectedOrderForDetails.serviceName}
                  </div>
                  {selectedOrderForDetails.packageName && (
                    <div className="text-[#645249]">{selectedOrderForDetails.packageName}</div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E6DCD2] space-y-1.5">
                  <span className="text-[#8C6D36] font-bold block">الموقع والمدينة:</span>
                  <div className="text-sm font-bold text-[#2C1E18]">
                    {selectedOrderForDetails.city} — حي {selectedOrderForDetails.district}
                  </div>
                  {selectedOrderForDetails.venueName && (
                    <div className="text-[#645249]">القاعة / الموقع: {selectedOrderForDetails.venueName}</div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E6DCD2] space-y-1.5">
                  <span className="text-[#8C6D36] font-bold block">الموعد والتوقيت:</span>
                  <div className="text-sm font-bold text-[#2C1E18]">
                    {selectedOrderForDetails.eventDate ? formatArabicDate(selectedOrderForDetails.eventDate) : '—'}
                  </div>
                  <div className="text-[#645249]">
                    من {selectedOrderForDetails.startTime ? formatArabicTime(selectedOrderForDetails.startTime) : '—'} ({selectedOrderForDetails.durationHours} ساعات)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#E6DCD2] space-y-1.5">
                  <span className="text-[#8C6D36] font-bold block">صاحبة / صاحب الحجز:</span>
                  <div className="text-sm font-bold text-[#2C1E18]">
                    {selectedOrderForDetails.clientName}
                  </div>
                  <div className="text-[#645249] font-mono-num" dir="ltr">
                    {selectedOrderForDetails.clientPhone}
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-4 rounded-xl bg-white border border-[#E6DCD2] space-y-2 text-xs">
                <span className="text-[#8C6D36] font-bold block">الملخص المالي المعتمد:</span>
                <div className="flex items-center justify-between text-[#645249]">
                  <span>المبلغ الأساسي للخدمة:</span>
                  <span className="font-mono-num font-bold">
                    {formatSar(selectedOrderForDetails.subtotalSar)}
                  </span>
                </div>
                {selectedOrderForDetails.approvedFeesSar && selectedOrderForDetails.approvedFeesSar > 0 && (
                  <div className="flex items-center justify-between text-[#645249]">
                    <span>رسوم الإعداد والاعتماد:</span>
                    <span className="font-mono-num font-bold">
                      +{formatSar(selectedOrderForDetails.approvedFeesSar)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#E6DCD2] flex items-center justify-between text-sm font-bold text-[#2C1E18]">
                  <span>إجمالي الحجز المعتمد:</span>
                  <span className="font-mono text-base text-[#8C6D36]">
                    {formatSar(selectedOrderForDetails.estimatedTotalSar || selectedOrderForDetails.subtotalSar)}
                  </span>
                </div>
              </div>

              {/* Special Notes if any */}
              {selectedOrderForDetails.specialNotes && (
                <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2] text-xs space-y-1">
                  <span className="text-[#8C6D36] font-bold block">ملاحظات العميل:</span>
                  <p className="text-[#645249] leading-relaxed">
                    {selectedOrderForDetails.specialNotes}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-[#E6DCD2] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={`https://wa.me/966579105700?text=${encodeURIComponent(
                  `مرحباً فريق لومير، أستفسر عن طلبي برقم مرجعي: ${selectedOrderForDetails.referenceCode}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>متابعة وتأكيد الموعد عبر واتساب</span>
              </a>

              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#D8CBB8] text-xs font-bold text-[#2C1E18] hover:bg-[#F3ECE1] transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
