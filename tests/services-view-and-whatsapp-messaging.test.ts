import assert from 'node:assert/strict';
import {
  sanitizeSaudiPhone,
  generateWhatsAppMessage,
  buildWhatsAppChatUrl,
  WHATSAPP_TEMPLATE_OPTIONS
} from '../src/utils/whatsappTemplates';
import { BookingSubmission } from '../src/types';

console.log('🧪 Starting Services View & WhatsApp Messaging Tests...\n');

// -------------------------------------------------------------
// Test 1: Saudi Phone Sanitization & Validation
// -------------------------------------------------------------
console.log('Test 1: Saudi Phone Sanitization & Validation');

// 1a: Standard local number starting with 05
const res1a = sanitizeSaudiPhone('0551234567');
assert.equal(res1a.valid, true);
assert.equal(res1a.sanitizedPhone, '966551234567');
assert.ok(res1a.formattedDisplay.includes('+966 55'));

// 1b: Number without leading 0
const res1b = sanitizeSaudiPhone('551234567');
assert.equal(res1b.valid, true);
assert.equal(res1b.sanitizedPhone, '966551234567');

// 1c: Number with +966 prefix
const res1c = sanitizeSaudiPhone('+966551234567');
assert.equal(res1c.valid, true);
assert.equal(res1c.sanitizedPhone, '966551234567');

// 1d: Number with 00966 prefix
const res1d = sanitizeSaudiPhone('00966551234567');
assert.equal(res1d.valid, true);
assert.equal(res1d.sanitizedPhone, '966551234567');

// 1e: Number with 966 and leading 0 (e.g. 9660551234567)
const res1e = sanitizeSaudiPhone('9660551234567');
assert.equal(res1e.valid, true);
assert.equal(res1e.sanitizedPhone, '966551234567');

// 1f: Formatted with spaces and dashes
const res1f = sanitizeSaudiPhone(' +966 (55) 123-4567 ');
assert.equal(res1f.valid, true);
assert.equal(res1f.sanitizedPhone, '966551234567');

// 1g: Arabic-Indic numerals
const res1g = sanitizeSaudiPhone('٠٥٥١٢٣٤٥٦٧');
assert.equal(res1g.valid, true);
assert.equal(res1g.sanitizedPhone, '966551234567');

// 1h: Invalid phone numbers
const invalidCases = ['', '   ', '055', '12345', 'abcd', '050000'];
for (const bad of invalidCases) {
  const badRes = sanitizeSaudiPhone(bad);
  assert.equal(badRes.valid, false, `Expected invalid for ${bad}`);
  assert.ok(badRes.error && badRes.error.length > 0);
}

console.log('✓ Test 1 passed: All phone sanitization rules verified.\n');

// -------------------------------------------------------------
// Test 2: Prebuilt WhatsApp Templates & Field Omission
// -------------------------------------------------------------
console.log('Test 2: Prebuilt WhatsApp Templates & Field Omission');

assert.equal(WHATSAPP_TEMPLATE_OPTIONS.length, 5);

const fullOrder: BookingSubmission = {
  id: 'bk-test-1',
  referenceCode: 'LMR-9872',
  createdAt: '2026-03-01T12:00:00Z',
  status: 'pending_review',
  serviceId: 'srv-mobile-photo',
  serviceName: 'تصوير المناسبات بالجوال',
  categoryKey: 'mobile_photography',
  packageId: 'pkg-vip',
  packageName: 'باقة التغطية الذهبية (٤ ساعات)',
  city: 'مكة المكرمة',
  district: 'العزيزية',
  venueName: 'قاعة روز للأفراح',
  eventDate: '2026-05-15',
  startTime: '19:00',
  endTime: '23:00',
  durationHours: 4,
  clientName: 'سارة العتيبي',
  clientPhone: '0551234567',
  preferredContactMethod: 'whatsapp',
  subtotalSar: 650,
  approvedFeesSar: 0,
  estimatedTotalSar: 650,
  isCustomQuoteRequired: false,
  agreedTermsAndPrivacy: true,
  selectedAddonIds: []
};

// 2a: Template 1 - Welcome & Order Receipt
const msg1 = generateWhatsAppMessage('welcome_receipt', fullOrder);
assert.ok(msg1.includes('أهلاً بك سارة العتيبي ✨'));
assert.ok(msg1.includes('تم استلام طلبك في لومير LUMIR'));
assert.ok(msg1.includes('رقم الطلب: LMR-9872'));
assert.ok(msg1.includes('الخدمة: تصوير المناسبات بالجوال'));
assert.ok(msg1.includes('المدينة: مكة المكرمة'));
assert.ok(msg1.includes('شكراً لاختيارك لومير!'));

// 2b: Template 2 - Confirmation Approval
const msg2 = generateWhatsAppMessage('confirmation_approval', fullOrder);
assert.ok(msg2.includes('تم تأكيد واعتماد طلب حجزك في لومير LUMIR بنجاح!'));
assert.ok(msg2.includes('رقم الطلب: LMR-9872'));
assert.ok(msg2.includes('باقة التغطية الذهبية'));
assert.ok(msg2.includes('مكة المكرمة - حي العزيزية - (قاعة روز للأفراح)'));
assert.ok(msg2.includes('المبلغ التقديري:'));

// 2c: Template 3 - Missing details
const msg3 = generateWhatsAppMessage('missing_details', fullOrder);
assert.ok(msg3.includes('بخصوص طلب حجزك'));
assert.ok(msg3.includes('LMR-9872'));
assert.ok(msg3.includes('استكمال الإجراءات واعتماد الحجز'));

// 2d: Template 4 - Event Reminder
const msg4 = generateWhatsAppMessage('event_reminder', fullOrder);
assert.ok(msg4.includes('تذكير لطيف بموعد مناسبتكِ القادمة'));
assert.ok(msg4.includes('LMR-9872'));
assert.ok(msg4.includes('فريق لومير على أتم الاستعداد'));

// 2e: Template 5 - Apology when unavailable
const msg5 = generateWhatsAppMessage('apology_unavailable', fullOrder);
assert.ok(msg5.includes('نعتذر منكِ بكل أسف عن عدم إمكانية قبول طلب الحجز'));
assert.ok(msg5.includes('LMR-9872'));
assert.ok(msg5.includes('لاكتمال جدول الحجوزات'));

// 2f: Field omission verification when venue and package are absent
const minimalOrder: BookingSubmission = {
  id: 'bk-test-2',
  referenceCode: 'LMR-1122',
  createdAt: '2026-03-01T12:00:00Z',
  status: 'pending_review',
  serviceId: 'srv-childcare',
  serviceName: 'مشرفة أطفال للمناسبات',
  categoryKey: 'childcare',
  city: 'جدة',
  district: 'الروضة',
  eventDate: '2026-06-20',
  startTime: '20:00',
  durationHours: 5,
  clientName: 'نورة',
  clientPhone: '0509876543',
  preferredContactMethod: 'whatsapp',
  subtotalSar: 450,
  approvedFeesSar: 0,
  estimatedTotalSar: 450,
  isCustomQuoteRequired: false,
  agreedTermsAndPrivacy: true,
  selectedAddonIds: []
};

const minMsg2 = generateWhatsAppMessage('confirmation_approval', minimalOrder);
assert.ok(!minMsg2.includes('الباقة:'));
assert.ok(!minMsg2.includes('undefined'));
assert.ok(!minMsg2.includes('null'));
assert.ok(!minMsg2.includes('NaN'));
assert.ok(minMsg2.includes('المدينة والموقع: جدة - حي الروضة'));

console.log('✓ Test 2 passed: All 5 templates format correctly and cleanly omit missing fields.\n');

// -------------------------------------------------------------
// Test 3: WhatsApp Click to Chat URL Generation
// -------------------------------------------------------------
console.log('Test 3: WhatsApp Click to Chat URL Generation');

const chatUrl = buildWhatsAppChatUrl('0551234567', 'مرحباً بك سارة');
assert.ok(chatUrl.startsWith('https://wa.me/966551234567?text='));
assert.ok(chatUrl.includes(encodeURIComponent('مرحباً بك سارة')));

console.log('✓ Test 3 passed: WhatsApp wa.me link generation verified.\n');

console.log('🎉 ALL SERVICE PRESENTATION & WHATSAPP TESTS PASSED SUCCESSFULLY!');
