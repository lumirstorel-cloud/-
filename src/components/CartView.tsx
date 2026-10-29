import React from 'react';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { PageView } from '../types';
import { formatArabicNumber, formatSar } from '../utils/formatters';
import { pathForView } from '../utils/routes';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  LogIn
} from 'lucide-react';

interface CartViewProps {
  navigate: (view: PageView, slug?: string) => void;
  onProceedToBooking: () => void;
}

export const CartView: React.FC<CartViewProps> = ({ navigate, onProceedToBooking }) => {
  const { items, updateItemDuration, updateItemQuantity, removeFromCart, clearCart, subtotalSar, approvedFeesSar, totalSar } =
    useCart();
  const { user, openAuthModal } = useCustomerAuth();

  const handleCheckoutClick = () => {
    if (!user) {
      openAuthModal('booking');
    } else {
      onProceedToBooking();
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-20 text-center space-y-6" dir="rtl">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#F3ECE1] border border-[#D8CBB8] flex items-center justify-center text-[#8C6D36]">
          <ShoppingBag className="w-10 h-10 stroke-1" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold text-[#2C1E18]">
            سلة المشتريات فارغة
          </h1>
          <p className="text-sm text-[#645249] max-w-md mx-auto">
            لم تقومي بإضافة أي خدمات أو باقات بعد. يمكنكِ استعراض خدمات لومير الراقية لمناسبات مكة وجدة وإضافتها إلى سلتكِ.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => navigate('catalog')}
            className="px-8 py-3.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>استعراض كتالوج الخدمات</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-6 py-12 space-y-10" dir="rtl">
      {/* Breadcrumb */}
      <nav aria-label="مسار التصفح" className="text-xs text-[#645249] flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="hover:text-[#2C1E18] cursor-pointer"
        >
          الرئيسية
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={() => navigate('catalog')}
          className="hover:text-[#2C1E18] cursor-pointer"
        >
          الخدمات
        </button>
        <span>/</span>
        <span className="font-bold text-[#2C1E18]">سلة المشتريات والخدمات</span>
      </nav>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DCD2] pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#2C1E18]">
            سلة المشتريات والخدمات
          </h1>
          <p className="text-xs text-[#645249] mt-1">
            مراجعة مدة الخدمات وأسعار الساعات قبل تأكيد طلب الحجز
          </p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs text-rose-700 hover:text-rose-900 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>تفريغ السلة بالكامل</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const isHourly = item.pricingModel === 'hourly';

            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
              >
                {/* Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isHourly
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-stone-200 text-stone-800'
                      }`}
                    >
                      {isHourly ? 'تسعير بالساعة' : 'باقة محددة'}
                    </span>
                    {item.packageName && (
                      <span className="text-xs font-bold text-[#8C6D36]">
                        {item.packageName}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#2C1E18]">
                    {item.serviceName}
                  </h3>

                  {/* Hourly Rate Formula Display */}
                  {isHourly && item.hourlyRateSar !== undefined ? (
                    <div className="text-xs text-[#645249] flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#8C6D36]" />
                      <span>
                        سعر الساعة: <strong className="text-[#2C1E18]">{formatSar(item.hourlyRateSar)}</strong> ×{' '}
                        {formatArabicNumber(item.durationHours || 4)} ساعات
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-[#645249]">
                      سعر الوحدة: <strong className="text-[#2C1E18]">{formatSar(item.unitPriceSar || item.priceSar)}</strong>
                    </div>
                  )}

                  {/* Delivery / Addons */}
                  {item.deliveryTimeframe && (
                    <div className="text-[11px] text-[#8C6D36]">
                      موعد التسليم: {item.deliveryTimeframe}
                    </div>
                  )}
                </div>

                {/* Duration / Quantity Stepper & Price */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#EFE7DC]">
                  {/* Stepper */}
                  {isHourly ? (
                    <div className="flex items-center gap-2 bg-[#F3ECE1] border border-[#D8CBB8] rounded-xl px-2 py-1">
                      <span className="text-[11px] text-[#645249] ml-1">المدة:</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItemDuration(item.id, Math.max(1, (item.durationHours || 4) - 1))
                        }
                        disabled={(item.durationHours || 4) <= 1}
                        className="w-7 h-7 rounded-lg bg-white text-[#2C1E18] flex items-center justify-center hover:bg-[#FAF6F0] disabled:opacity-40 cursor-pointer"
                        title="إنقاص ساعة"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono-num font-bold text-xs px-1 text-[#2C1E18]">
                        {formatArabicNumber(item.durationHours || 4)} س
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItemDuration(item.id, (item.durationHours || 4) + 1)
                        }
                        className="w-7 h-7 rounded-lg bg-white text-[#2C1E18] flex items-center justify-center hover:bg-[#FAF6F0] cursor-pointer"
                        title="زيادة ساعة"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#F3ECE1] border border-[#D8CBB8] rounded-xl px-2 py-1">
                      <span className="text-[11px] text-[#645249] ml-1">الكمية:</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItemQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))
                        }
                        disabled={(item.quantity || 1) <= 1}
                        className="w-7 h-7 rounded-lg bg-white text-[#2C1E18] flex items-center justify-center hover:bg-[#FAF6F0] disabled:opacity-40 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono-num font-bold text-xs px-1 text-[#2C1E18]">
                        {formatArabicNumber(item.quantity || 1)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItemQuantity(item.id, (item.quantity || 1) + 1)
                        }
                        className="w-7 h-7 rounded-lg bg-white text-[#2C1E18] flex items-center justify-center hover:bg-[#FAF6F0] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Line Total & Remove */}
                  <div className="flex items-center gap-3">
                    <div className="font-display font-bold text-lg text-[#2C1E18] font-mono-num">
                      {formatSar(item.priceSar)}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-4 sticky top-28 space-y-4">
          <div className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#D8CBB8] shadow-xs space-y-5">
            <h2 className="font-display text-lg font-bold text-[#2C1E18] border-b border-[#E6DCD2] pb-3">
              ملخص السلة والحساب
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-[#645249]">
                <span>مجموع الخدمات المختارة:</span>
                <span className="font-mono-num font-bold text-[#2C1E18]">
                  {formatSar(subtotalSar)}
                </span>
              </div>

              {approvedFeesSar > 0 && (
                <div className="flex items-center justify-between text-[#645249]">
                  <span>رسوم الخدمات المعتمدة:</span>
                  <span className="font-mono-num font-bold text-[#2C1E18]">
                    {formatSar(approvedFeesSar)}
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-[#E6DCD2] flex items-center justify-between text-base font-bold text-[#2C1E18]">
                <span>الإجمالي التقديري:</span>
                <span className="font-mono-num text-xl text-[#8C6D36]">
                  {formatSar(totalSar)}
                </span>
              </div>
            </div>

            {/* Customer Status Banner */}
            <div className="p-3.5 rounded-xl bg-[#F3ECE1] border border-[#D8CBB8] text-xs space-y-1.5">
              {user ? (
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    مسجلة الدخول كـ: <strong>{user.name || user.email}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[#8C6D36]">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>تسجيل الدخول مطلوب لإتمام الحجز</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAuthModal('cart')}
                    className="text-[11px] font-bold text-[#2C1E18] underline hover:text-[#8C6D36] cursor-pointer"
                  >
                    دخول
                  </button>
                </div>
              )}
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              onClick={handleCheckoutClick}
              className="w-full py-3.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {!user ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>تسجيل الدخول ومتابعة الحجز</span>
                </>
              ) : (
                <>
                  <span>إتمام الحجز وتأكيد الموعد</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>

            <p className="text-[10px] text-[#8C6D36] text-center leading-relaxed">
              * الأسعار أولية ويتم اعتماد الموعد والتفاصيل النهائية بالتنسيق المباشر عبر واتساب.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
