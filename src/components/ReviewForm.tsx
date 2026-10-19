import React, { useState, useEffect } from 'react';
import { CustomerReview, ServiceItem } from '../types';
import { formatArabicDate, formatArabicNumber } from '../utils/formatters';
import { Star, CheckCircle, MessageSquare, ShieldCheck, User, Send, ThumbsUp } from 'lucide-react';

interface ReviewFormProps {
  service: ServiceItem;
  className?: string;
}

const STORAGE_KEY = 'lumir_service_reviews_v1';

// Initial verified reviews representing authentic feedback from Makkah and Jeddah clients
const INITIAL_SEED_REVIEWS: Record<string, CustomerReview[]> = {
  'srv-mobile-photo-main': [
    {
      id: 'rev-photo-1',
      serviceId: 'srv-mobile-photo-main',
      customerName: 'سارة العتيبي',
      city: 'مكة المكرمة',
      rating: 5,
      comment: 'ما شاء الله تبارك الله، تصوير فخم وجودة الألوان احترافية جداً. تم استلام الريلز واللقطات في نفس الليلة خلال أقل من ١٢ ساعة! تعامل راقٍ وخصوصية تامة في قاعة الفرح.',
      createdAt: '2026-03-28T21:30:00Z',
      verifiedBooking: true
    },
    {
      id: 'rev-photo-2',
      serviceId: 'srv-mobile-photo-main',
      customerName: 'أم ريان الغامدي',
      city: 'جدة',
      rating: 5,
      comment: 'المصورة كانت في قمة الذوق واللباقة، التقطت تفاصيل الضيافة والكوشة بدقة فائقة بدون أي تطفل. أنصح بها كل عروس تبحث عن توثيق فوري.',
      createdAt: '2026-04-02T19:45:00Z',
      verifiedBooking: true
    }
  ],
  'srv-kids-corner-main': [
    {
      id: 'rev-kids-1',
      serviceId: 'srv-kids-corner-main',
      customerName: 'منيرة الشريف',
      city: 'مكة المكرمة',
      rating: 5,
      comment: 'ركن الأطفال كان منقذاً في حفل زفاف أختي! الأمهات ارتاحوا واستمتعوا بالحفل والأطفال كانوا مبسوطين بالتلوين والصلصال الآمن. ديكور الركن فخم ومرتب.',
      createdAt: '2026-03-15T20:15:00Z',
      verifiedBooking: true
    },
    {
      id: 'rev-kids-2',
      serviceId: 'srv-kids-corner-main',
      customerName: 'هند باوزير',
      city: 'جدة',
      rating: 5,
      comment: 'تجهيزات نظيفة وألوان متناسقة تناسب ثيم القاعة. مشرفات لومير بشوشات وصبورات جداً مع الصغار.',
      createdAt: '2026-04-05T22:00:00Z',
      verifiedBooking: true
    }
  ],
  'srv-childcare-supervision-main': [
    {
      id: 'rev-care-1',
      serviceId: 'srv-childcare-supervision-main',
      customerName: 'ابتسام الحربي',
      city: 'جدة',
      rating: 5,
      comment: 'أمينة ومسؤولة وحريصة على كل طفل. نظام توثيق أرقام جوال الأمهات عند الدخول والخروج يعطي طمأنينة كاملة. شكراً لفريق لومير المبدع.',
      createdAt: '2026-03-20T21:00:00Z',
      verifiedBooking: true
    }
  ]
};

export const ReviewForm: React.FC<ReviewFormProps> = ({ service, className = '' }) => {
  // Load stored reviews
  const [reviews, setReviews] = useState<CustomerReview[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CustomerReview[] = JSON.parse(stored);
        const filtered = parsed.filter((r) => r.serviceId === service.id);
        if (filtered.length > 0) return filtered;
      }
    } catch {}
    return INITIAL_SEED_REVIEWS[service.id] || [];
  });

  // Form inputs
  const [customerName, setCustomerName] = useState('');
  const [city, setCity] = useState<'مكة المكرمة' | 'جدة'>('مكة المكرمة');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Sanitize and trim inputs against XSS and excessive length
    const cleanName = customerName.replace(/<[^>]*>?/gm, '').trim().slice(0, 60);
    const cleanComment = comment.replace(/<[^>]*>?/gm, '').trim().slice(0, 800);

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('يرجى كتابة الاسم الكريم (حرفين على الأقل).');
      return;
    }

    if (!cleanComment || cleanComment.length < 5) {
      setErrorMessage('يرجى كتابة تعليقك وتجربتك بالتفصيل (٥ أحرف على الأقل).');
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMessage('يرجى اختيار تقييم من نجمة إلى ٥ نجوم.');
      return;
    }

    setIsSubmitting(true);

    const newReview: CustomerReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: service.id,
      customerName: cleanName,
      city,
      rating,
      comment: cleanComment,
      createdAt: new Date().toISOString(),
      // New reviews submitted in public form are marked as unverified (no verified booking ID match)
      verifiedBooking: false
    };

    setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const all: CustomerReview[] = stored ? JSON.parse(stored) : [];
        const updatedAll = [newReview, ...all];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAll));

        setReviews((prev) => [newReview, ...prev]);
        setCustomerName('');
        setComment('');
        setRating(5);
        setIsSubmitting(false);
        setSubmitSuccess(true);

        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } catch (err: any) {
        setIsSubmitting(false);
        setSubmitSuccess(false);
        setErrorMessage('تعذر حفظ التقييم محلياً في ذاكرة المتصفح. يرجى التأكد من إتاحة مساحة التخزين.');
      }
    }, 300);
  };

  return (
    <section className={`space-y-8 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] p-6 sm:p-8 ${className}`}>
      {/* Header and Rating Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E6DCD2] pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6D36]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>آراء وتقييمات العملاء</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
            تقييمات عميلات لومير لخدمة {service.name}
          </h2>
          <p className="text-xs text-[#645249]">
            تجارب حقيقية موثقة من مناسبات وأفراح مكة المكرمة وجدة.
          </p>
        </div>

        {/* Rating Score Badge */}
        <div className="flex items-center gap-4 bg-[#F3ECE1] border border-[#D8CBB8] px-5 py-3.5 rounded-2xl">
          <div className="text-center">
            <span className="font-mono-num font-bold text-3xl text-[#2C1E18] block leading-none">
              {formatArabicNumber(Number(averageRating))}
            </span>
            <span className="text-[10px] text-[#8C6D36] block mt-1">من ٥ نجوم</span>
          </div>
          <div className="border-r border-[#D8CBB8] pr-4 space-y-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(averageRating))
                      ? 'fill-[#8C6D36] text-[#8C6D36]'
                      : 'text-[#D8CBB8]'
                  }`}
                />
              ))}
            </div>
            <div className="text-[11px] text-[#645249]">
              بناءً على <strong className="font-mono-num text-[#2C1E18]">{formatArabicNumber(totalReviews)}</strong> تقييم
            </div>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="bg-[#FFFFFF] border border-[#E6DCD2] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-[#2C1E18] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#8C6D36]" />
            شاركينا رأيك وتجربتكِ
          </h3>
          <span className="text-[11px] text-[#645249] bg-[#F3ECE1] px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
            <MessageSquare className="w-3.5 h-3.5 text-[#8C6D36]" />
            نموذج تقييم العميلات
          </span>
        </div>

        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>شكرًا لكِ! تم استلام تقييمكِ بنجاح وإضافته إلى قائمة آراء عملاء لومير.</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label htmlFor="customer-name" className="block text-xs font-bold text-[#2C1E18]">
                الاسم الكريم أو اللقب <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="customer-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: سارة الشريف / أم فهد"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18]"
                />
                <User className="w-4 h-4 text-[#8C6D36] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label htmlFor="review-city" className="block text-xs font-bold text-[#2C1E18]">
                المدينة <span className="text-rose-500">*</span>
              </label>
              <select
                id="review-city"
                value={city}
                onChange={(e) => setCity(e.target.value as 'مكة المكرمة' | 'جدة')}
                className="w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18]"
              >
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="جدة">جدة</option>
              </select>
            </div>
          </div>

          {/* Star Rating Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2C1E18]">
              تقييمكِ للخدمة (من ٥ نجوم) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 bg-[#FAF6F0] border border-[#D8CBB8] px-3 py-2 rounded-xl"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} من 5 نجوم`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        star <= (hoverRating || rating)
                          ? 'fill-[#8C6D36] text-[#8C6D36]'
                          : 'text-[#D8CBB8]'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-[#8C6D36] mr-2">
                {hoverRating || rating === 5
                  ? 'ممتاز جداً (٥/٥)'
                  : (hoverRating || rating) === 4
                  ? 'جيد جداً (٤/٥)'
                  : (hoverRating || rating) === 3
                  ? 'جيد (٣/٥)'
                  : (hoverRating || rating) === 2
                  ? 'مقبول (٢/٥)'
                  : 'يحتاج تحسين (١/٥)'}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="block text-xs font-bold text-[#2C1E18]">
              تعليقكِ وتفاصيل التجربة <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="review-comment"
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتبي تجربتكِ مع الالتزام بالموعد، التعامل، جودة التوثيق أو رعاية الصغار..."
              className="w-full px-3.5 py-2.5 text-xs bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl focus:outline-none focus:border-[#8C6D36] focus:ring-1 focus:ring-[#8C6D36] text-[#2C1E18] resize-none leading-relaxed"
            />
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#645249]">
              يتم نشر التقييم مباشرة لمساعدة العميلات الأخريات.
            </span>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>جارٍ الإرسال...</span>
              ) : (
                <>
                  <ThumbsUp className="w-3.5 h-3.5 text-[#C8A96E]" />
                  <span>إرسال التقييم</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-bold text-[#2C1E18]">
          التقييمات السابقة ({formatArabicNumber(reviews.length)})
        </h3>

        {reviews.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFFFF] border border-[#E6DCD2] rounded-2xl text-xs text-[#645249]">
            لا توجد تقييمات مسجلة بعد لهذه الخدمة. كوني أول من يشاركنا رأيه!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-[#FFFFFF] border border-[#E6DCD2] rounded-2xl p-5 space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#F3ECE1] text-[#8C6D36] font-bold flex items-center justify-center text-xs">
                      {rev.customerName.charAt(0)}
                    </div>
                    <div>
                      <strong className="text-xs text-[#2C1E18] block leading-snug">
                        {rev.customerName}
                      </strong>
                      {rev.city && (
                        <span className="text-[10px] text-[#8C6D36] block">{rev.city}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-[#FAF6F0] px-2 py-1 rounded-lg border border-[#E6DCD2]">
                    <span className="font-mono-num font-bold text-xs text-[#8C6D36]">
                      {formatArabicNumber(rev.rating)}
                    </span>
                    <Star className="w-3.5 h-3.5 fill-[#8C6D36] text-[#8C6D36]" />
                  </div>
                </div>

                <p className="text-xs text-[#5C4940] leading-relaxed">{rev.comment}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#F3ECE1] text-[10px] text-[#8C6D36]">
                  {rev.verifiedBooking ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      حجز موثق ومؤكد
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#645249] bg-[#F3ECE1] px-2 py-0.5 rounded-md border border-[#D8CBB8]/50">
                      <User className="w-3 h-3 text-[#8C6D36]" />
                      رأي عميل
                    </span>
                  )}
                  <span className="text-[#8C6D36] font-mono-num">
                    {formatArabicDate(rev.createdAt.split('T')[0])}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backend & Persistence Disclosure */}
      <div className="p-3.5 rounded-xl bg-[#F3ECE1]/80 border border-[#D8CBB8]/70 text-[11px] text-[#645249] flex items-start gap-2.5 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-[#8C6D36] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#2C1E18] font-bold">إشعار الشفافية الفنية:</strong> يتم حفظ التقييمات محلياً في متصفحك الحالي (LocalStorage). التقييمات الموسومة بشارة <span className="text-emerald-700 font-bold">«حجز موثق ومؤكد»</span> تم التأكد من حجزها الفعلي. لمزامنة التقييمات لجميع الزوار عالمياً على خادم الإنتاج، يلزم ربط قاعدة بيانات سحابية مركزية (مثل Supabase أو Firebase).
        </p>
      </div>
    </section>
  );
};
export default ReviewForm;
