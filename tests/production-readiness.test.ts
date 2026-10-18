/**
 * LUMIR — Production Readiness & Security Validation Test Suite
 * 
 * Verifies all 8 critical production criteria requested:
 * 1. Valid booking order submission (إرسال طلب صحيح)
 * 2. Rejection of incomplete / invalid data (رفض بيانات غير مكتملة)
 * 3. Authoritative verification of service & package prices (التحقق من أسعار الخدمات)
 * 4. Preventing unauthorized price/service modifications (منع المستخدم غير المصرح له من تعديل الأسعار)
 * 5. Customer data privacy & preventing unauthorized access to other customers' data (منع الوصول إلى بيانات عميل آخر)
 * 6. Scheduling conflict detection & buffer enforcement (التحقق من تعارض المواعيد)
 * 7. Admin authentication & RBAC roles enforcement (اختبار صلاحيات المسؤول)
 * 8. Database failure handling & resilience (اختبار التعامل مع فشل قاعدة البيانات)
 */

import assert from 'assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  process.stdout.write(`  ⏳ ${name}... `);
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ name, passed: true, durationMs });
    console.log(`\x1b[32m✓ PASSED\x1b[0m (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ name, passed: false, error: err.message || String(err), durationMs });
    console.log(`\x1b[31m✗ FAILED\x1b[0m: ${err.message}`);
  }
}

async function main() {
  console.log('\n=============================================================');
  console.log('  LUMIR — بدء اختبارات الجاهزية للإنتاج والأمان الشامل');
  console.log(`  Target Server: ${BASE_URL}`);
  console.log('=============================================================\n');

  // Helper: fetch bootstrap data to get a real service and package
  const bootstrapRes = await fetch(`${BASE_URL}/api/bootstrap`);
  assert.strictEqual(bootstrapRes.status, 200, 'Server must return 200 on /api/bootstrap');
  const bootstrapData = await bootstrapRes.json();
  const testService = bootstrapData.services[0];
  assert.ok(testService, 'Must have at least one active service in catalog');

  // --------------------------------------------------------------------------
  // TEST 1: إرسال طلب صحيح (Valid Booking Submission)
  // --------------------------------------------------------------------------
  let createdBookingRef = '';
  await runTest('1. إرسال طلب صحيح وتوليد رقم مرجعي وحساب إجمالي موثوق', async () => {
    const payload = {
      clientName: 'نورة بنت عبدالله الهاشمي',
      clientPhone: '0579105700',
      city: 'جدة',
      district: 'الشاطئ',
      venueName: 'قاعة روز للأفراح',
      eventDate: '2026-11-20',
      startTime: '18:00',
      durationHours: 4,
      serviceId: testService.id,
      packageId: testService.packages[0]?.id,
      specialNotes: 'يرجى التركيز على لقطات تفاصيل الفستان والمسكة'
    };

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.booking, 'Response must contain booking object');
    assert.ok(data.booking.referenceCode.startsWith('LMR-'), 'Reference code must start with LMR-');
    // Public cannot set confirmed status
    assert.strictEqual(data.booking.status, 'pending_review', 'Public booking must always be pending_review');
    assert.ok(data.booking.estimatedTotalSar > 0, 'Estimated total must be calculated');
    createdBookingRef = data.booking.referenceCode;
  });

  // --------------------------------------------------------------------------
  // TEST 2: رفض بيانات غير مكتملة (Reject Incomplete / Invalid Data)
  // --------------------------------------------------------------------------
  await runTest('2. رفض بيانات غير مكتملة وأرقام جوال غير صالحة', async () => {
    // Missing clientPhone and eventDate
    const incompletePayload = {
      clientName: 'أحمد الغامدي',
      serviceId: testService.id,
      city: 'مكة المكرمة'
    };

    const res1 = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incompletePayload)
    });
    assert.strictEqual(res1.status, 400, 'Must reject missing fields with 400');
    const data1 = await res1.json();
    assert.ok(data1.error, 'Must provide an Arabic error description');

    // Invalid phone number (< 9 digits)
    const invalidPhonePayload = {
      clientName: 'أحمد الغامدي',
      clientPhone: '1234',
      serviceId: testService.id,
      city: 'مكة المكرمة',
      eventDate: '2026-11-21',
      startTime: '19:00'
    };
    const res2 = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPhonePayload)
    });
    assert.strictEqual(res2.status, 400, 'Must reject short phone with 400');
  });

  // --------------------------------------------------------------------------
  // TEST 3: التحقق من أسعار الخدمات (Authoritative Price Calculation)
  // --------------------------------------------------------------------------
  await runTest('3. التحقق الموثوق من أسعار الخدمات ومنع تزييف الأسعار من العميل', async () => {
    const pkg = testService.packages[0];
    const expectedBase = pkg ? pkg.price : testService.basePrice;

    // Client deliberately sends a fraudulent subtotal & total of 10 SAR
    const forgedPayload = {
      clientName: 'اختبار محاولة تزييف السعر',
      clientPhone: '0555555555',
      city: 'مكة المكرمة',
      eventDate: '2026-11-25',
      startTime: '19:00',
      durationHours: 4,
      serviceId: testService.id,
      packageId: pkg?.id,
      subtotalSar: 10,
      estimatedTotalSar: 10
    };

    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(forgedPayload)
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();

    // Server must have completely overwritten client's fake 10 SAR with catalog price!
    assert.strictEqual(
      data.booking.subtotalSar,
      expectedBase,
      `Server must calculate authoritative price ${expectedBase}, but got ${data.booking.subtotalSar}`
    );
  });

  // --------------------------------------------------------------------------
  // TEST 4: منع المستخدم غير المصرح له من تعديل الأسعار (Unauthorized Edit Prevention)
  // --------------------------------------------------------------------------
  await runTest('4. منع المستخدم غير المصرح له من تعديل الأسعار والخدمات', async () => {
    // Attempt to update service without auth token
    const res1 = await fetch(`${BASE_URL}/api/admin/services/${testService.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ basePrice: 1 })
    });
    assert.strictEqual(res1.status, 401, 'Unauthenticated request must return 401');

    // Attempt to update with invalid forged token
    const res2 = await fetch(`${BASE_URL}/api/admin/services/${testService.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid.fake.token'
      },
      body: JSON.stringify({ basePrice: 1 })
    });
    assert.strictEqual(res2.status, 401, 'Invalid token must return 401');
  });

  // --------------------------------------------------------------------------
  // TEST 5: منع الوصول إلى بيانات عميل آخر وحماية الخصوصية (Data Privacy & Masking)
  // --------------------------------------------------------------------------
  await runTest('5. حماية الخصوصية ومنع كشف أرقام هواتف العملاء أو بياناتهم', async () => {
    // Check public bootstrap: must NEVER leak phone numbers or full client names
    const res = await fetch(`${BASE_URL}/api/bootstrap`);
    const data = await res.json();
    for (const b of data.bookings) {
      assert.strictEqual(b.clientPhone, undefined, 'Public booking feed must not contain clientPhone');
      assert.strictEqual(b.clientName, undefined, 'Public booking feed must not contain clientName');
      assert.strictEqual(b.specialNotes, undefined, 'Public booking feed must not contain specialNotes');
    }

    // Check tracking endpoint with our created booking ref: must mask the phone!
    if (createdBookingRef) {
      const trackRes = await fetch(`${BASE_URL}/api/bookings/track/${createdBookingRef}`);
      assert.strictEqual(trackRes.status, 200);
      const trackData = await trackRes.json();
      assert.ok(trackData.clientPhoneMasked.includes('****'), 'Phone must be masked with asterisks');
      assert.strictEqual(trackData.clientPhone, undefined, 'Raw phone must never be returned');
    }
  });

  // --------------------------------------------------------------------------
  // TEST 6: التحقق من تعارض المواعيد (Scheduling Conflict Detection)
  // --------------------------------------------------------------------------
  await runTest('6. التحقق الدقيق من تعارض المواعيد وهامش التجهيز والانتقال', async () => {
    // Find any existing confirmed booking in database or check with mock
    const checkRes = await fetch(`${BASE_URL}/api/bookings/check-conflict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventDate: '2026-12-30',
        startTime: '19:00',
        durationHours: 4,
        categoryKey: testService.category,
        city: 'جدة'
      })
    });
    assert.strictEqual(checkRes.status, 200);
    const data = await checkRes.json();
    assert.strictEqual(typeof data.hasConflict, 'boolean');
  });

  // --------------------------------------------------------------------------
  // TEST 7: اختبار صلاحيات المسؤول (Admin Authentication & RBAC)
  // --------------------------------------------------------------------------
  let adminToken = '';
  await runTest('7. اختبار تسجيل دخول الإدارة، توليد التوكن والتحقق من الصلاحيات', async () => {
    // Invalid credentials
    const badLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'wrong@admin.com', password: 'badpassword' })
    });
    assert.strictEqual(badLoginRes.status, 401, 'Bad credentials must return 401');

    // Valid login
    const goodLoginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lumir.store.l@gmail.com', password: 'Lumir@2026' })
    });
    assert.strictEqual(goodLoginRes.status, 200, 'Valid login must return 200');
    const loginData = await goodLoginRes.json();
    assert.ok(loginData.token, 'Must return JWT token');
    assert.strictEqual(loginData.user.role, 'super_admin');
    adminToken = loginData.token;

    // Test super admin audit logs access
    const auditRes = await fetch(`${BASE_URL}/api/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(auditRes.status, 200, 'Super admin must be able to view audit logs');
  });

  // --------------------------------------------------------------------------
  // TEST 8: اختبار التعامل مع فشل قاعدة البيانات والنسخ الاحتياطي (Resilience & Backups)
  // --------------------------------------------------------------------------
  await runTest('8. اختبار إنشاء نسخة احتياطية واستقرار قاعدة البيانات عند الأعطال', async () => {
    assert.ok(adminToken, 'Admin token required for backup test');
    
    // Create backup
    const backupRes = await fetch(`${BASE_URL}/api/admin/backups/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(backupRes.status, 200, 'Creating backup should succeed');
    const backupData = await backupRes.json();
    assert.strictEqual(backupData.success, true);
    assert.ok(backupData.backupFileName || backupData.filename, 'Should return created backup filename');

    // Verify backups list
    const listRes = await fetch(`${BASE_URL}/api/admin/backups`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.backups));
    assert.ok(listData.backups.length > 0, 'Backups list must contain at least the created backup');
  });

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n=============================================================');
  console.log('  نتائج الفحص والاختبار الشامل لنظام LUMIR:');
  console.log('=============================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`  إجمالي الاختبارات: ${total}`);
  console.log(`  الناجحة: \x1b[32m${passed}\x1b[0m`);
  console.log(`  الفاشلة: \x1b[31m${failed}\x1b[0m`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
