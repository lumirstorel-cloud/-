import React, { useEffect, useState } from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { BookingSubmission, BookingStatus, PageView } from '../types';
import { formatArabicNumber, formatSar } from '../utils/formatters';
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
  ArrowRight
} from 'lucide-react';

interface CustomerAccountViewProps {
  navigate: (view: PageView, slug?: string) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({ navigate }) => {
  const { user, token, logout, openAuthModal } = useCustomerAuth();
  const [orders, setOrders] = useState<BookingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        const data = await res.json();
        if (res.ok && data.success) {
          setOrders(data.orders || []);
        } else {
          setErrorMsg(data.error || 'تعذر تحميل قائمة الطلبات');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'خطأ في الاتصال بالخادم');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const getStatusBadge = (status: BookingStatus) => {
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
            <span>قيد مراجعة الإدارة</span>
          </span>
        );
      case 'pending_client_confirmation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>بانتظار تأكيدك</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد التنفيذ الميداني</span>
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
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">
            <span>{status}</span>
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-[700px] mx-auto px-6 py-20 text-center space-y-6" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#F3ECE1] border border-[#D8CBB8] flex items-center justify-center text-[#8C6D36]">
          <User className="w-10 h-10 stroke-1" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-[#2C1E18]">
            حساب عملاء LUMIR
          </h1>
          <p className="text-sm text-[#645249] max-w-md mx-auto">
            سجلي الدخول للوصول إلى تفاصيل حجوزاتكِ السابقة وحالة الطلبات الخاصة بمناسباتكِ في مكة وجدة.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => openAuthModal('customer-account')}
            className="px-8 py-3.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer"
          >
            تسجيل الدخول إلى حسابي
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-12 space-y-10" dir="rtl">
      {/* Profile Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2C1E18] text-[#FAF6F0] flex items-center justify-center font-display text-2xl font-bold shadow-xs">
            {user.name ? user.name[0] : 'L'}
          </div>
          <div>
            <div className="text-[11px] text-[#8C6D36] font-medium">مرحباً بكِ في لومير</div>
            <h1 className="font-display text-2xl font-bold text-[#2C1E18]">
              {user.name || 'عميل لومير المميّز'}
            </h1>
            <p className="text-xs text-[#645249] mt-0.5">{user.email}</p>
            {user.phone && (
              <p className="text-xs text-[#645249] font-mono-num" dir="ltr">
                {user.phone}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="px-5 py-2.5 text-xs font-bold text-rose-800 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      {/* Orders List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E6DCD2] pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
              طلباتي وحجوزاتي
            </h2>
            <p className="text-xs text-[#645249] mt-1">
              متابعة حالة الحجوزات، المواعيد، وتفاصيل الساعات المعتمدة
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
          <div className="py-12 text-center text-xs text-[#8C6D36]">
            جاري استرجاع طلباتكِ الخاصة بأمان...
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
            <p className="text-xs text-[#645249] max-w-sm mx-auto">
              يمكنكِ استعراض خدمات لومير، اختيار مدة الساعات، وإرسال طلب الحجز لمناسبتكِ في مكة أو جدة.
            </p>
            <button
              type="button"
              onClick={() => navigate('catalog')}
              className="px-6 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <span>استعراض الكتالوج</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((b) => (
              <div
                key={b.id || b.referenceCode}
                className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFE7DC] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono-num font-bold text-sm text-[#2C1E18] bg-[#F3ECE1] px-3 py-1 rounded-lg">
                        {b.referenceCode}
                      </span>
                      {getStatusBadge(b.status)}
                    </div>
                    <div className="text-[11px] text-[#8C6D36]">
                      تاريخ الطلب: {new Date(b.createdAt).toLocaleDateString('ar-SA')}
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="text-[11px] text-[#645249]">الإجمالي التقديري</div>
                    <div className="font-display font-bold text-xl text-[#2C1E18] font-mono-num">
                      {formatSar(b.estimatedTotalSar)}
                    </div>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-[#5C4940]">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C6D36] block">الخدمة الأساسية:</span>
                    <strong className="text-[#2C1E18]">{b.serviceName}</strong>
                    {b.packageName && (
                      <span className="block text-[11px] text-[#645249]">
                        الباقة: {b.packageName}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C6D36] block">موعد المناسبة:</span>
                    <div className="flex items-center gap-1.5 text-[#2C1E18]">
                      <Calendar className="w-3.5 h-3.5 text-[#8C6D36]" />
                      <span>{b.eventDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#645249]">
                      <Clock className="w-3.5 h-3.5 text-[#8C6D36]" />
                      <span>
                        {b.startTime} ({formatArabicNumber(b.durationHours)} ساعات)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C6D36] block">موقع المناسبة:</span>
                    <div className="flex items-center gap-1.5 text-[#2C1E18]">
                      <MapPin className="w-3.5 h-3.5 text-[#8C6D36]" />
                      <span>{b.city}</span>
                      {b.district && <span>- {b.district}</span>}
                    </div>
                    {b.venueName && (
                      <span className="block text-[11px] text-[#645249]">
                        القاعة: {b.venueName}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8C6D36] block">التسعير والمدة:</span>
                    {b.hourlyRateSar ? (
                      <div className="text-[#2C1E18]">
                        سعر الساعة:{' '}
                        <strong className="font-mono-num">{formatSar(b.hourlyRateSar)}</strong>
                      </div>
                    ) : (
                      <div className="text-[#2C1E18]">تسعير باقة معتمدة</div>
                    )}
                    {b.approvedFeesSar && b.approvedFeesSar > 0 ? (
                      <div className="text-[11px] text-[#645249]">
                        رسوم معتمدة: {formatSar(b.approvedFeesSar)}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Multi-item breakdown if present */}
                {Array.isArray(b.orderItems) && b.orderItems.length > 1 && (
                  <div className="pt-3 border-t border-[#EFE7DC] space-y-2">
                    <span className="text-[11px] font-bold text-[#8C6D36] block">
                      الخدمات المشمولة في هذا الطلب ({formatArabicNumber(b.orderItems.length)}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {b.orderItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-white/70 border border-[#E6DCD2] text-[11px] flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-[#2C1E18]">{item.serviceName}</span>
                            {item.durationHours && (
                              <span className="text-[#8C6D36] mr-2">
                                ({formatArabicNumber(item.durationHours)} ساعات)
                              </span>
                            )}
                          </div>
                          <span className="font-mono-num font-bold text-[#2C1E18]">
                            {formatSar(item.subtotalSar || item.unitPriceSar || 0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
