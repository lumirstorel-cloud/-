import React, { useState, useEffect } from 'react';
import { BookingSubmission, CustomerReview, ServiceItem } from '../types';
import { formatArabicNumber } from '../utils/formatters';
import { getStoredReviews, saveStoredReviews } from '../data/seedReviews';
import { submitReviewApi } from '../utils/apiClient';
import {
  X,
  Star,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  User,
  MapPin,
  Clock,
  Send,
  HeartHandshake,
  Check
} from 'lucide-react';

interface ServiceRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  preselectedServiceId?: string;
  preselectedBooking?: BookingSubmission | null;
  onReviewSubmitted?: (review: CustomerReview) => void;
}

export const ServiceRatingModal: React.FC<ServiceRatingModalProps> = ({
  isOpen,
  onClose,
  services,
  preselectedServiceId,
  preselectedBooking,
  onReviewSubmitted
}) => {
  const availableServices = services.filter((s) => s.isAvailable);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preselectedBooking?.serviceId || preselectedServiceId || availableServices[0]?.id || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    preselectedBooking?.clientName || ''
  );
  const [city, setCity] = useState<'مكة المكرمة' | 'جدة'>(
    preselectedBooking?.city || 'مكة المكرمة'
  );
  const [bookingRef, setBookingRef] = useState<string>(
    preselectedBooking?.referenceCode || ''
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [qualityRating, setQualityRating] = useState<number>(5);
  const [punctualityRating, setPunctualityRating] = useState<number>(5);
  const [professionalismRating, setProfessionalismRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [createdReview, setCreatedReview] = useState<CustomerReview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if preselectedBooking or preselectedServiceId changes
  useEffect(() => {
    if (preselectedBooking) {
      setSelectedServiceId(preselectedBooking.serviceId);
      setCustomerName(preselectedBooking.clientName);
      setCity(preselectedBooking.city);
      setBookingRef(preselectedBooking.referenceCode);
    } else if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    }
  }, [preselectedBooking, preselectedServiceId]);

  if (!isOpen) return null;

  const currentService =
    availableServices.find((s) => s.id === selectedServiceId) || availableServices[0];

  const ratingDescriptions: Record<number, string> = {
    5: 'ممتاز جداً — فاق التوقعات (٥/٥)',
    4: 'جيد جداً — تجربة راقية (٤/٥)',
    3: 'جيد — تجربة مقبولة (٣/٥)',
    2: 'مقبول — يحتاج بعض التحسين (٢/٥)',
    1: 'يحتاج تحسين جذري (١/٥)'
  };

  const isVerifiedCandidate =
    Boolean(preselectedBooking) ||
    (bookingRef.trim().toUpperCase().startsWith('LMR-') &&
      bookingRef.trim().length >= 8);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = customerName.replace(/<[^>]*>?/gm, '').trim().slice(0, 60);
    const cleanComment = comment.replace(/<[^>]*>?/gm, '').trim().slice(0, 800);
    const cleanRef = bookingRef.replace(/<[^>]*>?/gm, '').trim().toUpperCase();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('يرجى كتابة اسمكِ الكريم أو اللقب (حرفين على الأقل).');
      return;
    }

    if (!selectedServiceId) {
      setErrorMessage('يرجى اختيار الخدمة المراد تقييمها.');
      return;
    }

    if (!cleanComment || cleanComment.length < 5) {
      setErrorMessage('يرجى كتابة تفاصيل تجربتكِ وانطباعكِ (٥ أحرف على الأقل).');
      return;
    }

    setIsSubmitting(true);

    const newReview: CustomerReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: selectedServiceId,
      serviceName: currentService?.name || 'خدمة لومير',
      customerName: cleanName,
      city,
      rating,
      comment: cleanComment,
      createdAt: new Date().toISOString(),
      bookingReference: cleanRef || undefined,
      verifiedBooking: isVerifiedCandidate,
      criteria: {
        quality: qualityRating,
        punctuality: punctualityRating,
        professionalism: professionalismRating
      }
    };

    // 1. Save to local storage for immediate client display
    try {
      const stored = getStoredReviews();
      const updated = [newReview, ...stored];
      saveStoredReviews(updated);
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }

    // 2. Post to backend API
    try {
      const apiRes = await submitReviewApi(newReview);
      if (apiRes.success && apiRes.review) {
        newReview.verifiedBooking = apiRes.review.verifiedBooking;
        const freshList = [newReview, ...getStoredReviews().filter((r) => r.id !== newReview.id)];
        saveStoredReviews(freshList);
      }
    } catch (err) {
      console.warn('Server review submit fallback to local:', err);
    }

    setIsSubmitting(false);
    setCreatedReview({ ...newReview });
    setSubmitSuccess(true);

    if (onReviewSubmitted) {
      onReviewSubmitted(newReview);
    }
  };

  const handleResetAndClose = () => {
    setSubmitSuccess(false);
    setCreatedReview(null);
    setComment('');
    setRating(5);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-xl bg-[#FAF6F0] rounded-3xl shadow-2xl border border-[#E6DCD2] overflow-hidden flex flex-col text-[#2C1E18] max-h-[90vh]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E6DCD2] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F3ECE1] text-[#8C6D36] flex items-center justify-center">
              <Star className="w-5 h-5 fill-[#8C6D36]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-[#2C1E18]">
                تقييم خدمة لومير
              </h3>
              <p className="text-xs text-[#8C6D36]">
                شاركينا تجربتكِ الحقيقية لنواصل تقديم أرقى مستويات الخدمة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 text-[#645249] hover:text-[#2C1E18] rounded-xl hover:bg-[#F3ECE1] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {submitSuccess && createdReview ? (
            <div className="text-center py-8 px-4 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h4 className="font-display text-xl font-bold text-[#2C1E18]">
                  شكرًا لكِ من القلب!
                </h4>
                <p className="text-xs text-[#645249] max-w-md mx-auto leading-relaxed">
                  تم استلام تقييمكِ لخدمة <strong className="text-[#2C1E18]">{createdReview.serviceName}</strong> بنجاح. رأيكِ محل تقدير واعتزاز كبير من فريق لومير.
                </p>
              </div>

              {createdReview.verifiedBooking && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>تم توثيق تقييمكِ بشارة «حجز موثق ومؤكد»</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white border border-[#E6DCD2] text-xs text-right space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2C1E18]">{createdReview.customerName}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= createdReview.rating
                            ? 'fill-[#8C6D36] text-[#8C6D36]'
                            : 'text-[#D8CBB8]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[#5C4940] leading-relaxed text-[11px]">
                  «{createdReview.comment}»
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-[#2C1E18] text-[#FAF6F0] text-xs font-bold hover:bg-[#422E25] cursor-pointer"
                >
                  إغلاق النافذة
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* 1. Service Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2C1E18]">
                  الخدمة المراد تقييمها <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18] font-medium"
                >
                  {availableServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} ({srv.applicableCities.join(' · ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Customer Name & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    الاسم الكريم أو اللقب <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="مثال: أم عبد الرحمن / نورة"
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18]"
                    />
                    <User className="w-4 h-4 text-[#8C6D36] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    المدينة <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value as 'مكة المكرمة' | 'جدة')}
                      className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18]"
                    >
                      <option value="مكة المكرمة">مكة المكرمة</option>
                      <option value="جدة">جدة</option>
                    </select>
                    <MapPin className="w-4 h-4 text-[#8C6D36] absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 3. Booking Reference Code (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    الرقم المرجعي للحجز (اختياري)
                  </label>
                  <span className="text-[10px] text-[#8C6D36] font-medium">
                    يمنحكِ شارة «حجز موثق»
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    dir="ltr"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                    placeholder="مثال: LMR-2610-101"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18] font-mono"
                  />
                  {isVerifiedCandidate && (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
                  )}
                </div>
                {isVerifiedCandidate ? (
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <Check className="w-3.5 h-3.5" />
                    <span>رقم الحجز مؤهل لشارة التوثيق والاعتماد الرسمي.</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-[#7A685F]">
                    إذا تم حجز الخدمة سابقاً، أدخلي رقم الطلب لإبراز تقييمكِ كحجز موثق.
                  </p>
                )}
              </div>

              {/* 4. Main Star Rating */}
              <div className="p-4 rounded-2xl bg-white border border-[#E6DCD2] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    التقييم الإجمالي للخدمة <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-[#8C6D36]">
                    {ratingDescriptions[hoverRating || rating]}
                  </span>
                </div>

                <div
                  className="flex items-center justify-center gap-2 py-2 bg-[#FAF6F0] rounded-xl border border-[#D8CBB8]/60"
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      aria-label={`${star} من 5 نجوم`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      className="p-1.5 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-[#8C6D36] text-[#8C6D36]'
                            : 'text-[#D8CBB8]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Detailed Criteria (Quality, Punctuality, Friendliness) */}
              <div className="p-4 rounded-2xl bg-white border border-[#E6DCD2] space-y-3 text-xs">
                <div className="font-bold text-[#2C1E18] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C6D36]" />
                  <span>معايير التقييم التفصيلية:</span>
                </div>

                {/* Quality */}
                <div className="flex items-center justify-between py-1 border-b border-[#FAF6F0]">
                  <span className="text-[#5C4940]">جودة التنفيذ والنتيجة:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQualityRating(s)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= qualityRating
                              ? 'fill-[#8C6D36] text-[#8C6D36]'
                              : 'text-[#D8CBB8]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Punctuality */}
                <div className="flex items-center justify-between py-1 border-b border-[#FAF6F0]">
                  <span className="text-[#5C4940]">الالتزام بالمواعيد والوقت:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPunctualityRating(s)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= punctualityRating
                              ? 'fill-[#8C6D36] text-[#8C6D36]'
                              : 'text-[#D8CBB8]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Professionalism */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-[#5C4940]">رقي التعامل والخصوصية:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setProfessionalismRating(s)}
                        className="p-0.5 cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            s <= professionalismRating
                              ? 'fill-[#8C6D36] text-[#8C6D36]'
                              : 'text-[#D8CBB8]'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 6. Comment Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2C1E18]">
                    اكتبي رأيكِ وتجربتكِ بالتفصيل <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#7A685F] font-mono">
                    {formatArabicNumber(comment.length)} / ٨٠٠
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 800))}
                  placeholder="كيف كان التعامل؟ سرعة استلام اللقطات أو راحة بال الأمهات مع مشرفات الأطفال؟ تفاصيلكِ تفيد العميلات الأخريات..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18] resize-none leading-relaxed"
                />
              </div>

              {/* 7. Submit Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-[#645249]">
                  يتم حفظ التقييم ونشره فوراً لدعم شفافية ومصداقية الموقع.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-7 py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جارٍ إرسال التقييم...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#C8A96E]" />
                      <span>إرسال تقييم الخدمة</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
export default ServiceRatingModal;
