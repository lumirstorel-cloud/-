import { CustomerReview } from '../types';

export const INITIAL_CUSTOMER_REVIEWS: CustomerReview[] = [
  // 1. تصوير المناسبات بالجوال
  {
    id: 'rev-photo-1',
    serviceId: 'srv-mobile-photo',
    serviceName: 'تصوير المناسبات بالجوال',
    customerName: 'سارة العتيبي',
    city: 'مكة المكرمة',
    rating: 5,
    comment:
      'ما شاء الله تبارك الله، تصوير فخم وجودة الألوان احترافية جداً. تم استلام الريلز واللقطات في نفس الليلة خلال أقل من ١٢ ساعة! تعامل راقٍ وخصوصية تامة في قاعة الفرح.',
    createdAt: '2026-03-28T21:30:00Z',
    verifiedBooking: true,
    bookingReference: 'LMR-2610-101',
    criteria: {
      quality: 5,
      punctuality: 5,
      professionalism: 5
    }
  },
  {
    id: 'rev-photo-2',
    serviceId: 'srv-mobile-photo',
    serviceName: 'تصوير المناسبات بالجوال',
    customerName: 'أم ريان الغامدي',
    city: 'جدة',
    rating: 5,
    comment:
      'المصورة كانت في قمة الذوق واللباقة، التقطت تفاصيل الضيافة والكوشة بدقة فائقة بدون أي تطفل. أنصح بها كل عروس تبحث عن توثيق فوري بالآيفون.',
    createdAt: '2026-04-02T19:45:00Z',
    verifiedBooking: true,
    bookingReference: 'LMR-2610-102',
    criteria: {
      quality: 5,
      punctuality: 5,
      professionalism: 5
    }
  },
  {
    id: 'rev-photo-3',
    serviceId: 'srv-mobile-photo',
    serviceName: 'تصوير المناسبات بالجوال',
    customerName: 'ريم الحربي',
    city: 'مكة المكرمة',
    rating: 5,
    comment:
      'لقطات الريلز خيااال والمثبتات حركة سلسة جداً كأنها كاميرا سينمائية، والمونتاج كان متناسق مع الموسيقى والمشاعر.',
    createdAt: '2026-04-10T22:15:00Z',
    verifiedBooking: true,
    bookingReference: 'LMR-2610-103',
    criteria: {
      quality: 5,
      punctuality: 5,
      professionalism: 5
    }
  },

  // 2. أركان ألعاب وتلوين الأطفال
  {
    id: 'rev-kids-1',
    serviceId: 'srv-kids-corner',
    serviceName: 'أركان ألعاب وتلوين الأطفال',
    customerName: 'منيرة الشريف',
    city: 'مكة المكرمة',
    rating: 5,
    comment:
      'ركن الأطفال كان منقذاً في حفل زفاف أختي! الأمهات ارتاحوا واستمتعوا بالحفل والأطفال كانوا مبسوطين بالتلوين والصلصال الآمن. ديكور الركن فخم ومرتب وناسب ثيم القاعة.',
    createdAt: '2026-03-15T20:15:00Z',
    verifiedBooking: true,
    bookingReference: 'LMR-2610-104',
    criteria: {
      quality: 5,
      punctuality: 5,
      professionalism: 5
    }
  },
  {
    id: 'rev-kids-2',
    serviceId: 'srv-kids-corner',
    serviceName: 'أركان ألعاب وتلوين الأطفال',
    customerName: 'هند باوزير',
    city: 'جدة',
    rating: 5,
    comment:
      'تجهيزات نظيفة وألوان متناسقة تناسب القاعة. مشرفات لومير بشوشات وصبورات جداً مع الصغار، وخففوا الإزعاج في الصالة بنسبة ١٠٠٪.',
    createdAt: '2026-04-05T22:00:00Z',
    verifiedBooking: true,
    bookingReference: 'LMR-2610-105',
    criteria: {
      quality: 5,
      punctuality: 5,
      professionalism: 5
    }
  },

  // 3. رعاية ومرافقة الأطفال
  {
    id: 'rev-care-1',
    serviceId: 'srv-childcare',
    serviceName: 'رعاية ومرافقة الأطفال',
    customerName: 'ابتسام الحربي',
    city: 'جدة',
    rating: 5,
    comment:
      'أمينة ومسؤولة وحريصة على كل طفل. نظام توثيق أرقام جوال الأمهات عند الدخول والخروج يعطي طمأنينة كاملة. شكراً لفريق لومير المبدع على الاحترافية.',
    createdAt: '2026-03-20T21:00:00Z',
    verifiedBooking: true,
    bookingReference: 'LMR-2610-106',
    criteria: {
      quality: 5,
      punctuality: 5,
      professionalism: 5
    }
  },

  // 4. مشرفة جوالات وخصوصية الحفل
  {
    id: 'rev-phones-1',
    serviceId: 'srv-wedding-support-phones',
    serviceName: 'مشرفة جوالات وخصوصية الحفل',
    customerName: 'عبير القحطاني',
    city: 'مكة المكرمة',
    rating: 5,
    comment:
      'مشرفة الجوالات التزمت بدقة وسجلت جميع أجهزة الحاضرات بحقائب مرقمة ومحكمة. راحة بال تامة لخصوصية العروسين والمعازيم.',
    createdAt: '2026-04-08T20:30:00Z',
    verifiedBooking: true,
    bookingReference: 'LMR-2610-107',
    criteria: {
      quality: 5,
      punctuality: 5,
      professionalism: 5
    }
  }
];

export const REVIEWS_STORAGE_KEY = 'lumir_service_reviews_v2';

/** Get all reviews from local storage, falling back to initial seed */
export function getStoredReviews(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return INITIAL_CUSTOMER_REVIEWS;
}

/** Save updated reviews list to local storage */
export function saveStoredReviews(reviews: CustomerReview[]): void {
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  } catch (err) {
    console.warn('Could not save reviews to localStorage:', err);
  }
}
