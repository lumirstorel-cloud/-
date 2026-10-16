import {
  AdminUser,
  BookingStatus,
  BookingSubmission,
  CityCoverageSetting,
  CouponItem,
  FAQItem,
  LumirCentralData,
  PortfolioMediaItem,
  ServiceCategoryKey,
  ServiceItem,
  SiteSettings
} from '../types';
import { findBookingConflict } from './formatters';

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingBooking?: Partial<BookingSubmission>;
  message: string;
}

// ---------------- PUBLIC API CALLS ----------------

export async function checkServerConflict(
  params: {
    eventDate: string;
    startTime: string;
    durationHours: number;
    categoryKey: ServiceCategoryKey;
    city?: 'مكة المكرمة' | 'جدة';
    excludeId?: string;
  },
  localFallbackBookings: BookingSubmission[]
): Promise<ConflictCheckResult> {
  try {
    const res = await fetch('/api/bookings/check-conflict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (res.ok) {
      const data = await res.json();
      return {
        hasConflict: data.hasConflict,
        conflictingBooking: data.conflictingBooking,
        message: data.message
      };
    }
  } catch (err) {
    console.warn('API conflict check fallback to client:', err);
  }

  const localConflict = findBookingConflict(params, localFallbackBookings);
  if (localConflict) {
    return {
      hasConflict: true,
      conflictingBooking: localConflict,
      message: `يوجد موعد مؤكد ومجدول مسبقاً في تاريخ ${localConflict.eventDate} الساعة ${localConflict.startTime}. يرجى اختيار موعد أو وقت آخر.`
    };
  }

  return {
    hasConflict: false,
    message: 'الموعد متاح ومناسب للحجز المبدئي.'
  };
}

export async function submitBookingToServer(
  booking: BookingSubmission
): Promise<{ success: boolean; booking: BookingSubmission; message?: string }> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    if (res.ok) {
      const data = await res.json();
      return {
        success: true,
        booking: data.booking || booking,
        message: data.message
      };
    }
    const errData = await res.json().catch(() => ({}));
    if (res.status === 409) {
      throw new Error(errData.error || 'تعارض في المواعيد مع حجز مؤكد آخر.');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('تعارض')) {
      throw err;
    }
    console.warn('Could not post to server API, proceeding with client storage:', err);
  }

  return {
    success: true,
    booking,
    message: 'تم تسجيل الطلب مبدئياً وهو الآن بانتظار مراجعة الإدارة.'
  };
}

export async function validateCouponOnServer(
  code: string,
  orderAmount: number
): Promise<{ success: boolean; discountSar?: number; error?: string }> {
  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderAmount })
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, discountSar: data.coupon.discountSar };
    }
    return { success: false, error: data.error };
  } catch (err) {
    return { success: false, error: 'تعذر التحقق من الكوبون' };
  }
}

// ---------------- ADMIN API CALLS (AUTHENTICATED & ROLE CHECKED) ----------------

function getAuthHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

export async function adminLoginApi(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: AdminUser; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, token: data.token, user: data.user };
    }
    return { success: false, error: data.error || 'فشل تسجيل الدخول' };
  } catch (err: any) {
    return { success: false, error: 'تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.' };
  }
}

export async function adminGetFullDataApi(
  token: string
): Promise<{ success: boolean; data?: LumirCentralData; error?: string }> {
  try {
    const res = await fetch('/api/admin/data', {
      headers: getAuthHeaders(token)
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, data };
    }
    const err = await res.json().catch(() => ({}));
    return { success: false, error: err.error || 'تعذر تحميل بيانات الإدارة' };
  } catch (err) {
    return { success: false, error: 'خطأ في الشبكة أثناء جلب بيانات الإدارة' };
  }
}

export async function adminUpdateBookingStatusApi(
  token: string,
  id: string,
  status: BookingStatus,
  adminNotes?: string
): Promise<{ success: boolean; booking?: BookingSubmission; error?: string }> {
  try {
    const res = await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ status, adminNotes })
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, booking: data.booking };
    }
    return { success: false, error: data.error || 'تعذر تحديث حالة الطلب' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminDeleteBookingApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'تعذر حذف الطلب' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateServiceApi(
  token: string,
  id: string,
  serviceData: Partial<ServiceItem>
): Promise<{ success: boolean; service?: ServiceItem; error?: string }> {
  try {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(serviceData)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, service: data.service };
    }
    return { success: false, error: data.error || 'تعذر تعديل الخدمة' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdatePackageApi(
  token: string,
  serviceId: string,
  packageId: string,
  pkgData: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/services/${serviceId}/packages/${packageId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(pkgData)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'تعذر تعديل الباقة' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminAddPortfolioApi(
  token: string,
  item: Omit<PortfolioMediaItem, 'id'>
): Promise<{ success: boolean; item?: PortfolioMediaItem; error?: string }> {
  try {
    const res = await fetch('/api/admin/portfolio', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(item)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, item: data.item };
    }
    return { success: false, error: data.error || 'تعذر إضافة العمل' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminDeletePortfolioApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/portfolio/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'تعذر حذف العمل' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminAddFAQApi(
  token: string,
  faq: Omit<FAQItem, 'id'>
): Promise<{ success: boolean; faq?: FAQItem; error?: string }> {
  try {
    const res = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(faq)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, faq: data.faq };
    }
    return { success: false, error: data.error || 'تعذر إضافة السؤال' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminDeleteFAQApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/faqs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'تعذر حذف السؤال' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminAddCouponApi(
  token: string,
  coupon: Omit<CouponItem, 'id' | 'timesUsed'>
): Promise<{ success: boolean; coupon?: CouponItem; error?: string }> {
  try {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(coupon)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, coupon: data.coupon };
    }
    return { success: false, error: data.error || 'تعذر إنشاء الكوبون' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminDeleteCouponApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'تعذر حذف الكوبون' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateSettingsApi(
  token: string,
  settings: Partial<SiteSettings>
): Promise<{ success: boolean; settings?: SiteSettings; error?: string }> {
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, settings: data.settings };
    }
    return { success: false, error: data.error || 'تعذر حفظ الإعدادات' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateCityCoverageApi(
  token: string,
  coverage: CityCoverageSetting[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/city-coverage', {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(coverage)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'تعذر تحديث تغطية المدن' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateAnnouncementsApi(
  token: string,
  announcements: any
): Promise<{ success: boolean; announcements?: any; error?: string }> {
  try {
    const res = await fetch('/api/admin/announcements', {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(announcements)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, announcements: data.announcements };
    }
    return { success: false, error: data.error || 'تعذر تحديث الشريط الإعلاني' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminAddBannerApi(
  token: string,
  banner: any
): Promise<{ success: boolean; banner?: any; error?: string }> {
  try {
    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(banner)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, banner: data.banner };
    }
    return { success: false, error: data.error || 'تعذر إضافة البنر' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateBannerApi(
  token: string,
  id: string,
  banner: any
): Promise<{ success: boolean; banner?: any; error?: string }> {
  try {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(banner)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, banner: data.banner };
    }
    return { success: false, error: data.error || 'تعذر تعديل البنر' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminDeleteBannerApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true };
    }
    return { success: false, error: data.error || 'تعذر حذف البنر' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateSliderSettingsApi(
  token: string,
  sliderSettings: any
): Promise<{ success: boolean; sliderSettings?: any; error?: string }> {
  try {
    const res = await fetch('/api/admin/slider-settings', {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(sliderSettings)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, sliderSettings: data.sliderSettings };
    }
    return { success: false, error: data.error || 'تعذر تحديث إعدادات السلايدر' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminSyncAllApi(
  token: string,
  fullData: LumirCentralData
): Promise<{ success: boolean; data?: LumirCentralData; error?: string }> {
  try {
    const res = await fetch('/api/admin/sync-all', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(fullData)
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, data: data.data || fullData };
    }
    return { success: false, error: data.error || 'تعذر مزامنة البيانات' };
  } catch (err) {
    return { success: false, error: 'خطأ في الاتصال بالخادم' };
  }
}


