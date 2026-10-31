import {
  AdminRole,
  AdminUser,
  BookingStatus,
  BookingSubmission,
  CityCoverageSetting,
  CouponItem,
  CustomerReview,
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

/**
 * Safely parses any fetch Response, guaranteeing that non-JSON responses
 * (like Vercel HTML/plain text 404 "The page could not be found")
 * never trigger "Unexpected token 'T', "The page c"... is not valid JSON".
 */
export async function safeParseJsonResponse<T = any>(
  res: Response
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  const contentType = res.headers.get('content-type') || '';
  let data: any = {};
  let parseSuccess = false;
  const isJson = contentType.includes('application/json');

  try {
    if (isJson) {
      data = await res.json();
      parseSuccess = true;
    } else {
      const text = await res.text();
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        data = JSON.parse(text);
        parseSuccess = true;
      }
    }
  } catch {
    parseSuccess = false;
    data = {};
  }

  // A response is only successful if HTTP status is 2xx AND either JSON parsed or 204 No Content
  const isOk = res.ok && (parseSuccess || res.status === 204);

  const errorMsg =
    data?.error ||
    data?.message ||
    (!isOk
      ? res.status === 404
        ? 'المسار المطلوب غير متوفر في الخادم (404 Not Found)'
        : res.status >= 500
        ? 'خطأ مؤقت في خدمة الخادم (5xx)'
        : !parseSuccess
        ? 'تعذر قراءة استجابة الخادم بصيغة صالحة'
        : `فشل الطلب من الخادم (رمز ${res.status})`
      : undefined);

  return {
    ok: isOk,
    status: res.status,
    data,
    error: errorMsg
  };
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
      const parsed = await safeParseJsonResponse<any>(res);
      if (parsed.ok && parsed.data) {
        return {
          hasConflict: parsed.data.hasConflict,
          conflictingBooking: parsed.data.conflictingBooking,
          message: parsed.data.message
        };
      }
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
): Promise<{ success: boolean; booking?: BookingSubmission; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });

    const parsed = await safeParseJsonResponse<any>(res);
    const data = parsed.data || {};

    if (res.ok && data.success) {
      return {
        success: true,
        booking: data.booking || booking,
        message: data.message || 'تم تسجيل طلب الحجز بنجاح وهو الآن بانتظار مراجعة الإدارة.'
      };
    }

    if (res.status === 409) {
      throw new Error(data.error || 'تعارض في المواعيد مع حجز مؤكد آخر في نفس الوقت.');
    }

    throw new Error(parsed.error || data.error || `فشل تسجيل الحجز في قاعدة البيانات (رمز الخطأ: ${res.status}).`);
  } catch (err: any) {
    console.error('Booking submission failed:', err);
    throw new Error(
      err.message || 'تعذر الاتصال بخادم الحجوزات. يرجى التحقق من اتصال الإنترنت أو التواصل مباشرة عبر واتساب.'
    );
  }
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok && parsed.data?.coupon) {
      return { success: true, discountSar: parsed.data.coupon.discountSar };
    }
    return { success: false, error: parsed.error || 'تعذر التحقق من الكوبون' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok && parsed.data?.token) {
      return { success: true, token: parsed.data.token, user: parsed.data.user };
    }
    return { success: false, error: parsed.error || 'فشل تسجيل الدخول' };
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
    const parsed = await safeParseJsonResponse<LumirCentralData>(res);
    if (parsed.ok) {
      return { success: true, data: parsed.data };
    }
    return { success: false, error: parsed.error || 'تعذر تحميل بيانات الإدارة' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الشبكة أثناء جلب بيانات الإدارة' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, booking: parsed.data?.booking };
    }
    return { success: false, error: parsed.error || 'تعذر تحديث حالة الطلب' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر حذف الطلب' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, service: parsed.data?.service };
    }
    return { success: false, error: parsed.error || 'تعذر تعديل الخدمة' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر تعديل الباقة' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminAddPackageApi(
  token: string,
  serviceId: string,
  pkgData: any
): Promise<{ success: boolean; package?: any; error?: string }> {
  try {
    const res = await fetch(`/api/admin/services/${serviceId}/packages`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(pkgData)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, package: parsed.data?.package };
    }
    return { success: false, error: parsed.error || 'تعذر إضافة الباقة' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminDeletePackageApi(
  token: string,
  serviceId: string,
  packageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/services/${serviceId}/packages/${packageId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر حذف الباقة' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, item: parsed.data?.item };
    }
    return { success: false, error: parsed.error || 'تعذر إضافة العمل' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر حذف العمل' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdatePortfolioApi(
  token: string,
  id: string,
  item: Partial<PortfolioMediaItem>
): Promise<{ success: boolean; item?: PortfolioMediaItem; error?: string }> {
  try {
    const res = await fetch(`/api/admin/portfolio/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(item)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, item: parsed.data?.item };
    }
    return { success: false, error: parsed.error || 'تعذر تعديل العمل' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, faq: parsed.data?.faq };
    }
    return { success: false, error: parsed.error || 'تعذر إضافة السؤال' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateFAQApi(
  token: string,
  id: string,
  faq: Partial<FAQItem>
): Promise<{ success: boolean; faq?: FAQItem; error?: string }> {
  try {
    const res = await fetch(`/api/admin/faqs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(faq)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, faq: parsed.data?.faq };
    }
    return { success: false, error: parsed.error || 'تعذر تعديل السؤال' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر حذف السؤال' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, coupon: parsed.data?.coupon };
    }
    return { success: false, error: parsed.error || 'تعذر إنشاء الكوبون' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateCouponApi(
  token: string,
  id: string,
  coupon: Partial<CouponItem>
): Promise<{ success: boolean; coupon?: CouponItem; error?: string }> {
  try {
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(coupon)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, coupon: parsed.data?.coupon };
    }
    return { success: false, error: parsed.error || 'تعذر تعديل الكوبون' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر حذف الكوبون' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

// ---------------- USER & ROLES MANAGEMENT APIS ----------------

export async function adminGetUsersApi(
  token: string
): Promise<{ success: boolean; users?: AdminUser[]; error?: string }> {
  try {
    const res = await fetch('/api/admin/users', {
      headers: getAuthHeaders(token)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, users: parsed.data?.users };
    }
    return { success: false, error: parsed.error || 'تعذر جلب قائمة المسؤولين' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminAddUserApi(
  token: string,
  user: { name: string; email: string; role: AdminRole; phone?: string }
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(user)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, user: parsed.data?.user };
    }
    return { success: false, error: parsed.error || 'تعذر إنشاء حساب المسؤول' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminUpdateUserApi(
  token: string,
  id: string,
  user: Partial<AdminUser>
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(user)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, user: parsed.data?.user };
    }
    return { success: false, error: parsed.error || 'تعذر تحديث بيانات المسؤول' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function adminDeleteUserApi(
  token: string,
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر حذف حساب المسؤول' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, settings: parsed.data?.settings };
    }
    return { success: false, error: parsed.error || 'تعذر حفظ الإعدادات' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر تحديث تغطية المدن' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, announcements: parsed.data?.announcements };
    }
    return { success: false, error: parsed.error || 'تعذر تحديث الشريط الإعلاني' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, banner: parsed.data?.banner };
    }
    return { success: false, error: parsed.error || 'تعذر إضافة البنر' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, banner: parsed.data?.banner };
    }
    return { success: false, error: parsed.error || 'تعذر تعديل البنر' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true };
    }
    return { success: false, error: parsed.error || 'تعذر حذف البنر' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, sliderSettings: parsed.data?.sliderSettings };
    }
    return { success: false, error: parsed.error || 'تعذر تحديث إعدادات السلايدر' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
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
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, data: parsed.data?.data || fullData };
    }
    return { success: false, error: parsed.error || 'تعذر مزامنة البيانات' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

// ---------------- CUSTOMER SERVICE RATINGS & REVIEWS API ----------------

export async function fetchReviewsApi(
  serviceId?: string
): Promise<{ success: boolean; reviews: CustomerReview[]; error?: string }> {
  try {
    const url = serviceId
      ? `/api/reviews?serviceId=${encodeURIComponent(serviceId)}`
      : '/api/reviews';
    const res = await fetch(url);
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, reviews: parsed.data?.reviews || [] };
    }
    return { success: false, reviews: [], error: parsed.error };
  } catch (err: any) {
    return { success: false, reviews: [], error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

export async function submitReviewApi(
  review: CustomerReview
): Promise<{ success: boolean; review?: CustomerReview; isVerified?: boolean; error?: string }> {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return {
        success: true,
        review: parsed.data?.review || review,
        isVerified: parsed.data?.isVerified
      };
    }
    return { success: false, error: parsed.error || 'فشل إرسال التقييم' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}

/**
 * Admin: Update service hourly pricing and duration rules
 */
export async function adminUpdateServicePricingApi(
  token: string,
  serviceId: string,
  pricing: {
    hourlyRateSar?: number;
    isHourlyEnabled?: boolean;
    minHours?: number;
    maxHours?: number;
    defaultHours?: number;
    fixedFeeSar?: number;
  }
): Promise<{ success: boolean; service?: ServiceItem; error?: string }> {
  try {
    const res = await fetch(`/api/admin/services/${serviceId}/pricing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(pricing)
    });
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok) {
      return { success: true, service: parsed.data?.service };
    }
    return { success: false, error: parsed.error || 'فشل تحديث أسعار الخدمة' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطأ في الاتصال بالخادم' };
  }
}



