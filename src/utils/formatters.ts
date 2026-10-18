import { BookingSubmission, PricingModel, ServiceCategoryKey } from '../types';

export function formatSar(amount: number): string {
  const formatted = new Intl.NumberFormat('ar-SA', {
    maximumFractionDigits: 0
  }).format(amount);
  return `${formatted} ر.س`;
}

export function formatArabicNumber(num: number): string {
  return new Intl.NumberFormat('ar-SA').format(num);
}

export function formatArabicDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatArabicTime(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  const h = Number(hStr);
  const m = Number(mStr || 0);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? 'مساءً' : 'صباحاً';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const hourAr = formatArabicNumber(hour12);
  const minAr = m === 0 ? '٠٠' : formatArabicNumber(m).padStart(2, '٠');
  return `${hourAr}:${minAr} ${period}`;
}

export function normalizeSaudiWhatsAppNumber(rawPhone: string): string {
  const digits = (rawPhone || '0579105700').replace(/\D/g, '');
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('00966')) return digits.slice(2);
  if (digits.startsWith('05')) return `966${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `966${digits}`;
  return digits || '966579105700';
}

export function buildWhatsAppLink(rawPhone: string, message?: string): string {
  const intl = normalizeSaudiWhatsAppNumber(rawPhone);
  const defaultMsg =
    message ||
    'مرحباً فريق لومير (LUMIR)، أود الاستفسار عن خدماتكم وحجز موعد لمناسبتي في مكة أو جدة.';
  return `https://wa.me/${intl}?text=${encodeURIComponent(defaultMsg)}`;
}

export function getCategoryLabel(cat: ServiceCategoryKey): string {
  switch (cat) {
    case 'mobile_photography':
      return 'تصوير المناسبات بالجوال';
    case 'kids_corner':
      return 'ركن الأطفال والأنشطة';
    case 'childcare':
      return 'رعاية الأطفال أثناء المناسبات';
    case 'wedding_support':
      return 'خدمات مساندة الأفراح';
    default:
      return cat;
  }
}

export function getGalleryCategoryLabel(cat: string): string {
  switch (cat) {
    case 'mobile_photography':
      return 'تصوير المناسبات بالجوال';
    case 'kids_corner':
      return 'أركان الأطفال';
    case 'kids_activities':
    case 'childcare':
      return 'أنشطة الأطفال';
    case 'wedding_support':
      return 'خدمات الأفراح';
    case 'event_setups':
      return 'تجهيزات المناسبات';
    default:
      return cat;
  }
}

export function getPricingModelLabel(model: PricingModel): string {
  switch (model) {
    case 'fixed':
      return 'سعر ثابت';
    case 'per_hour':
      return 'حسب ساعات التغطية';
    case 'per_staff':
      return 'لكل عاملة / مشرفة';
    case 'per_child':
      return 'حسب عدد الأطفال';
    case 'custom_quote':
      return 'تسعير مخصص بعد المراجعة';
    default:
      return model;
  }
}

export function calculateEndTime(startTime: string, durationHours: number): string {
  const [hStr, mStr] = (startTime || '19:00').split(':');
  const startH = Number(hStr) || 19;
  const startM = Number(mStr) || 0;
  const totalMinutes = startH * 60 + startM + Math.round(durationHours * 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function getStatusLabel(status: BookingSubmission['status']): string {
  switch (status) {
    case 'draft':
      return 'مسودة';
    case 'pending_review':
      return 'بانتظار المراجعة';
    case 'pending_client_confirmation':
      return 'بانتظار تأكيد العميل';
    case 'confirmed':
      return 'مؤكد';
    case 'in_progress':
      return 'جارٍ التنفيذ';
    case 'completed':
      return 'مكتمل';
    case 'cancelled':
      return 'ملغي';
    default:
      return status;
  }
}

export function getStatusBadgeStyle(status: BookingSubmission['status']): string {
  switch (status) {
    case 'draft':
      return 'bg-[#F3ECE1] text-[#645249] border-[#D8CBB8]';
    case 'pending_review':
      return 'bg-[#FFF7E6] text-[#B76E00] border-[#FFE0A3]';
    case 'pending_client_confirmation':
      return 'bg-[#EBF5FF] text-[#1B64B0] border-[#B9DCFF]';
    case 'confirmed':
      return 'bg-[#EDF7F0] text-[#1F5E3B] border-[#B6DFC2]';
    case 'in_progress':
      return 'bg-[#F2EDFB] text-[#6B32B3] border-[#DAC3F9]';
    case 'completed':
      return 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]';
    case 'cancelled':
      return 'bg-[#FDF2F2] text-[#8A2626] border-[#E5B8B8]';
    default:
      return 'bg-[#F3ECE1] text-[#2C1E18] border-[#D8CBB8]';
  }
}

/**
 * WhatsApp message containing only non-sensitive order metadata:
 * - رقم الطلب (Reference code)
 * - الخدمة والباقة (Service & package)
 * - التاريخ والوقت (Date & time)
 * - المدينة (City)
 * - السعر التقديري (Estimated price)
 * Zero sensitive/private child data in the URL!
 */
export function buildBookingWhatsAppSummary(
  b: BookingSubmission,
  adminWhatsApp: string
): string {
  const endTimeStr = b.endTime || calculateEndTime(b.startTime, b.durationHours);
  const lines = [
    `مرحباً فريق لومير (LUMIR) ✨`,
    `أود متابعة طلب الحجز الخاص بي:`,
    `• رقم الطلب: ${b.referenceCode}`,
    `• الخدمة: ${b.serviceName}`,
    b.packageName ? `• الباقة: ${b.packageName}` : '',
    `• المدينة: ${b.city}`,
    `• التاريخ: ${b.eventDate}`,
    `• الوقت: من ${formatArabicTime(b.startTime)} إلى ${formatArabicTime(endTimeStr)} (${b.durationHours} ساعات)`,
    `• السعر التقديري: ${formatSar(b.estimatedTotalSar || b.subtotalSar)}`,
    b.isCustomQuoteRequired ? `• ملاحظة: السعر النهائي بعد مراجعة تفاصيل المناسبة` : ''
  ].filter(Boolean);

  return buildWhatsAppLink(adminWhatsApp, lines.join('\n'));
}

export function parseTimeToMinutes(time24: string): number {
  const [h, m] = (time24 || '19:00').split(':').map(Number);
  return (Number.isNaN(h) ? 19 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

export function findBookingConflict(
  req: {
    eventDate: string;
    startTime: string;
    durationHours: number;
    categoryKey: ServiceCategoryKey;
    city?: 'مكة المكرمة' | 'جدة';
    excludeId?: string;
  },
  existingBookings: BookingSubmission[]
): BookingSubmission | null {
  const reqStart = parseTimeToMinutes(req.startTime);
  const reqEnd = reqStart + req.durationHours * 60;
  const buffer = 45; // 45 min setup & transport buffer

  for (const b of existingBookings) {
    if (req.excludeId && b.id === req.excludeId) continue;
    // Conflict only with confirmed or in-progress bookings
    if (b.status !== 'confirmed' && b.status !== 'in_progress') continue;
    if (b.eventDate !== req.eventDate) continue;
    if (b.categoryKey !== req.categoryKey) continue;
    if (req.city && b.city !== req.city) continue;

    const bStart = parseTimeToMinutes(b.startTime);
    const bEnd = bStart + b.durationHours * 60;

    if (reqStart < bEnd + buffer && reqEnd + buffer > bStart) {
      return b;
    }
  }
  return null;
}
