import { BookingSubmission } from '../types';
import { calculateEndTime, formatArabicDate, formatArabicNumber, formatArabicTime, formatSar } from './formatters';

export type WhatsAppTemplateType =
  | 'welcome_receipt'
  | 'confirmation_approval'
  | 'missing_details'
  | 'event_reminder'
  | 'apology_unavailable';

export interface WhatsAppTemplateOption {
  type: WhatsAppTemplateType;
  title: string;
  description: string;
  icon?: string;
}

export const WHATSAPP_TEMPLATE_OPTIONS: WhatsAppTemplateOption[] = [
  {
    type: 'welcome_receipt',
    title: 'رسالة ترحيب واستلام الطلب',
    description: 'إشعار فوري للعميل باستلام طلبه وجارٍ مراجعته للتأكيد'
  },
  {
    type: 'confirmation_approval',
    title: 'رسالة تأكيد الطلب بعد موافقة الإدارة',
    description: 'تأكيد اعتماد الموعد وتفاصيل المناسبة والمبلغ التقديري'
  },
  {
    type: 'missing_details',
    title: 'رسالة طلب استكمال البيانات',
    description: 'طلب تفاصيل إضافية مثل موقع القاعة أو التوقيت النهائي'
  },
  {
    type: 'event_reminder',
    title: 'رسالة تذكير بتفاصيل المناسبة',
    description: 'تذكير لطيف بموعد وتوقيت وموقع المناسبة قبل الفعالية'
  },
  {
    type: 'apology_unavailable',
    title: 'رسالة اعتذار عند تعذر تقديم الخدمة',
    description: 'اعتذار راقٍ عند اكتمال الطاقة الاستيعابية للتاريخ المطلوب'
  }
];

export interface PhoneValidationResult {
  valid: boolean;
  sanitizedPhone: string; // e.g. 966501234567
  formattedDisplay: string; // e.g. +966 50 123 4567
  error?: string;
}

/**
 * Normalizes and validates a Saudi phone number for WhatsApp wa.me link.
 * Handles Arabic numerals, leading zeros, +966 prefix, 00966, etc.
 */
export function sanitizeSaudiPhone(rawPhone?: string | null): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      valid: false,
      sanitizedPhone: '',
      formattedDisplay: '',
      error: 'لم يتم إدخال رقم جوال العميل في تفاصيل هذا الطلب'
    };
  }

  // Convert Arabic-Indic digits to standard western digits
  const westernized = rawPhone.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));

  // Extract all digit characters
  let digits = westernized.replace(/\D/g, '');

  if (!digits) {
    return {
      valid: false,
      sanitizedPhone: '',
      formattedDisplay: '',
      error: 'رقم الجوال لا يحتوي على أرقام صالحة'
    };
  }

  // Handle prefix combinations:
  // e.g. 00966... -> 966...
  if (digits.startsWith('00966')) {
    digits = digits.slice(2);
  }

  // If starts with 966:
  if (digits.startsWith('966')) {
    let local = digits.slice(3);
    // If local starts with 0 (e.g. 96605XXXXXXXX), strip the leading 0
    if (local.startsWith('0')) {
      local = local.slice(1);
    }
    digits = `966${local}`;
  } else if (digits.startsWith('0')) {
    // Local format e.g. 05XXXXXXXX -> strip 0 and prepend 966
    digits = `966${digits.slice(1)}`;
  } else if (digits.length === 9 && digits.startsWith('5')) {
    // Format e.g. 5XXXXXXXX -> prepend 966
    digits = `966${digits}`;
  } else if (digits.length >= 9) {
    // Any other number of 9+ digits without country code -> prepend 966
    digits = `966${digits}`;
  }

  const localPart = digits.slice(3);

  // Check validity: Saudi mobile number with 966 must have at least 9 digits after 966
  if (localPart.length < 9) {
    return {
      valid: false,
      sanitizedPhone: digits,
      formattedDisplay: digits,
      error: `رقم جوال العميل غير مكتمل (${rawPhone})، يتطلب ٩ أرقام على الأقل لفتح محادثة واتساب.`
    };
  }

  // Format for display e.g. +966 50 123 4567
  const formattedDisplay = `+966 ${localPart.slice(0, 2)} ${localPart.slice(2, 5)} ${localPart.slice(5)}`;

  return {
    valid: true,
    sanitizedPhone: digits,
    formattedDisplay
  };
}

/**
 * Builds the official WhatsApp wa.me URL
 */
export function buildWhatsAppChatUrl(phone: string, text: string): string {
  const sanitized = sanitizeSaudiPhone(phone);
  const targetPhone = sanitized.valid ? sanitized.sanitizedPhone : phone.replace(/\D/g, '');
  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generates the pre-filled message text for the given template and order.
 * Strictly adheres to LUMIR templates while cleanly omitting any missing fields.
 */
export function generateWhatsAppMessage(
  type: WhatsAppTemplateType,
  order: BookingSubmission
): string {
  const clientName = (order.clientName || 'عميلتنا العزيزة').trim();
  const refCode = order.referenceCode?.trim();
  const serviceName = order.serviceName?.trim();
  const packageName = order.packageName?.trim();
  const city = order.city?.trim();
  const district = order.district?.trim();
  const venue = order.venueName?.trim();

  // Location string omitting empty segments
  const locationParts = [city, district ? `حي ${district}` : '', venue ? `(${venue})` : ''].filter(Boolean);
  const locationString = locationParts.join(' - ');

  // Event date formatted cleanly
  const formattedDate = order.eventDate ? formatArabicDate(order.eventDate) : '';

  // Time window string
  let timingString = '';
  if (order.startTime) {
    const end = order.endTime || calculateEndTime(order.startTime, order.durationHours || 4);
    timingString = `من ${formatArabicTime(order.startTime)} إلى ${formatArabicTime(end)} (${formatArabicNumber(order.durationHours || 4)} ساعات)`;
  }

  // Amount
  const amountTotal = order.estimatedTotalSar || order.subtotalSar;
  const amountString = amountTotal > 0 ? formatSar(amountTotal) : '';

  switch (type) {
    case 'welcome_receipt': {
      const lines: string[] = [
        `أهلاً بك ${clientName} ✨`,
        `تم استلام طلبك في لومير LUMIR`
      ];
      if (refCode) lines.push(`رقم الطلب: ${refCode}`);
      if (serviceName) lines.push(`الخدمة: ${serviceName}`);
      if (packageName) lines.push(`الباقة: ${packageName}`);
      if (formattedDate) lines.push(`تاريخ المناسبة: ${formattedDate}`);
      if (city) lines.push(`المدينة: ${city}`);
      lines.push(`سنقوم بمراجعة التفاصيل والتواصل معكِ لتأكيد الحجز النهائي. شكراً لاختيارك لومير!`);
      return lines.join('\n');
    }

    case 'confirmation_approval': {
      const lines: string[] = [
        `أهلاً بك ${clientName} ✨`,
        `يسعدنا إبلاغكِ بأنه تم تأكيد واعتماد طلب حجزك في لومير LUMIR بنجاح!`
      ];
      if (refCode) lines.push(`رقم الطلب: ${refCode}`);
      if (serviceName) lines.push(`الخدمة: ${serviceName}`);
      if (packageName) lines.push(`الباقة: ${packageName}`);
      if (formattedDate) lines.push(`تاريخ المناسبة: ${formattedDate}`);
      if (timingString) lines.push(`التوقيت: ${timingString}`);
      if (locationString) lines.push(`المدينة والموقع: ${locationString}`);
      if (amountString) lines.push(`المبلغ التقديري: ${amountString}`);
      lines.push(`نتطلع لتقديم تجربة استثنائية وراقية تليق بمناسبتكِ الغالية. فريق لومير في خدمتكِ دائماً!`);
      return lines.join('\n');
    }

    case 'missing_details': {
      const lines: string[] = [`أهلاً بك ${clientName} ✨`];
      const orderContext = [
        refCode ? `رقم ${refCode}` : '',
        serviceName ? `لخدمة ${serviceName}` : ''
      ].filter(Boolean).join(' ');

      lines.push(
        `بخصوص طلب حجزك ${orderContext ? `${orderContext} ` : ''}لدى لومير LUMIR:`
      );
      lines.push(
        `نرجو منكِ التكرم بتزويدنا ببعض التفاصيل الإضافية لاستكمال الإجراءات واعتماد الحجز (مثل اسم القاعة/الفندق، أو الموقع الدقيق، أو التوقيت النهائي للبدء).`
      );
      lines.push(`شاكرين لكِ حسن تعاونكِ ونسعد بخدمتكِ!`);
      return lines.join('\n');
    }

    case 'event_reminder': {
      const lines: string[] = [
        `أهلاً بك ${clientName} ✨`,
        `تذكير لطيف بموعد مناسبتكِ القادمة مع لومير LUMIR:`
      ];
      if (refCode) lines.push(`رقم الطلب: ${refCode}`);
      if (serviceName) lines.push(`الخدمة: ${serviceName}`);
      if (packageName) lines.push(`الباقة: ${packageName}`);
      if (formattedDate) lines.push(`تاريخ المناسبة: ${formattedDate}`);
      if (order.startTime) lines.push(`التوقيت: ${formatArabicTime(order.startTime)}`);
      if (locationString) lines.push(`الموقع: ${locationString}`);
      lines.push(`فريق لومير على أتم الاستعداد لخدمتكِ ومشاركتكِ أجمل اللحظات. نرجو لكِ مناسبة سعيدة ومميزة!`);
      return lines.join('\n');
    }

    case 'apology_unavailable': {
      const lines: string[] = [
        `أهلاً بك ${clientName} ✨`,
        `نشكركِ لاختيارك لومير LUMIR والاهتمام بخدماتنا.`
      ];
      const bookingRef = [
        refCode ? `رقم ${refCode}` : '',
        formattedDate ? `بتاريخ ${formattedDate}` : ''
      ].filter(Boolean).join(' ');

      lines.push(
        `نعتذر منكِ بكل أسف عن عدم إمكانية قبول طلب الحجز ${bookingRef ? `${bookingRef}، ` : ''}وذلك لاكتمال جدول الحجوزات والطاقة الاستيعابية لهذا اليوم.`
      );
      lines.push(`يسعدنا ويشرفنا خدمتكِ في مناسباتكِ القادمة، ونتمنى لكِ مناسبة سعيدة وموفقة دائماً!`);
      return lines.join('\n');
    }
  }
}
