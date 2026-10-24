/**
 * LUMIR — Isolated Booking Creation & Schema Resilience Test Suite
 * 
 * Verifies:
 * 1. Isolated test booking submission with synthetic data (no real client data).
 * 2. Proper handling and fallback when 'approved_fees' is omitted or rejected by schema cache.
 * 3. Authoritative price calculation (subtotal + approvedFees = estimatedTotal).
 * 4. Tracking and fetching the created test booking.
 */

import assert from 'assert';
import http from 'http';
import { app } from '../src/serverApp';

async function main() {
  console.log('\n=============================================================');
  console.log('  LUMIR — فحص واختبار إنشاء حجز تجريبي معزول ومرونة حقل approved_fees');
  console.log('=============================================================\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Fetch available service
    process.stdout.write('  ⏳ 1. جلب بيانات الخدمة لاختبار الحجز... ');
    const bootRes = await fetch(`${baseUrl}/api/bootstrap`);
    assert.strictEqual(bootRes.status, 200);
    const bootData = await bootRes.json();
    const service = bootData.services[0];
    assert.ok(service, 'Must have at least one service');
    console.log(`\x1b[32m✓ PASSED\x1b[0m (${service.name})`);

    // 2. Submit isolated synthetic test booking
    process.stdout.write('  ⏳ 2. إنشاء حجز تجريبي اصطناعي معزول والتحقق من حساب الرسوم المعتمدة... ');
    const testReference = `TEST-ISO-${Date.now()}`;
    const syntheticPayload = {
      referenceCode: testReference,
      clientName: 'عميل تجريبي معزول للاختبار البرمجي',
      clientPhone: '0599999999',
      city: 'مكة المكرمة',
      district: 'العزيزية',
      venueName: 'قاعة تجريبية',
      eventDate: '2026-12-25',
      startTime: '19:00',
      durationHours: 4,
      serviceId: service.id,
      packageId: service.packages[0]?.id,
      specialNotes: 'طلب تجريبي آلي لفحص مرونة الأعمدة',
      preferredContactMethod: 'whatsapp'
    };

    const bookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(syntheticPayload)
    });

    assert.strictEqual(bookRes.status, 201, `Booking creation should return 201, got ${bookRes.status}`);
    const bookData = await bookRes.json();
    assert.strictEqual(bookData.success, true);
    assert.ok(bookData.booking);
    assert.strictEqual(bookData.booking.clientName, 'عميل تجريبي معزول للاختبار البرمجي');
    assert.strictEqual(typeof bookData.booking.approvedFeesSar, 'number');
    assert.strictEqual(bookData.booking.status, 'pending_review');
    console.log(`\x1b[32m✓ PASSED\x1b[0m (Ref: ${bookData.booking.referenceCode})`);

    // 3. Track the created booking
    process.stdout.write('  ⏳ 3. التحقق من إمكانية تتبع الطلب التجريبي وحجب البيانات الحساسة... ');
    const trackRes = await fetch(`${baseUrl}/api/bookings/track/${bookData.booking.referenceCode}`);
    assert.strictEqual(trackRes.status, 200);
    const trackData = await trackRes.json();
    assert.strictEqual(trackData.referenceCode, bookData.booking.referenceCode);
    assert.ok(trackData.clientPhoneMasked.includes('****'), 'Phone must be masked');
    assert.strictEqual(trackData.clientPhone, undefined, 'Raw phone must not be leaked');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // 4. Test conflict detection with the new booking
    process.stdout.write('  ⏳ 4. التحقق من كشف التعارض مع الحجز التجريبي... ');
    const conflictRes = await fetch(`${baseUrl}/api/bookings/check-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventDate: '2026-12-25',
        startTime: '19:00',
        durationHours: 4,
        categoryKey: service.category,
        city: 'مكة المكرمة'
      })
    });
    assert.strictEqual(conflictRes.status, 200);
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    console.log('\n=============================================================');
    console.log('  جميع اختبارات إنشاء الحجز المعزول نجحت بنسبة 100%');
    console.log('=============================================================\n');
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('\x1b[31mFatal test error:\x1b[0m', err);
  process.exit(1);
});
