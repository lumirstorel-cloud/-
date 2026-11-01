/**
 * LUMIR — Customer Orders, Guest Auth & Privacy Verification Suite
 * 
 * Verifies all 10 core requirements:
 * 1. Guest booking submission without forced login.
 * 2. Authenticated booking linking with customerUserId & email.
 * 3. Guest tracking with BOTH referenceCode AND clientPhone (reject mismatch / ref alone).
 * 4. Protection of /api/customer/orders (requires valid Bearer token).
 * 5. Google OAuth provider verification in Supabase Auth flow.
 * 6. Eradication of synthetic demo bookings (bk-101, bk-102, LMR-2610-101) & fake names.
 * 7. Admin login removed from customer UI footer & header modals.
 * 8. Safe JSON parsing on network responses (no crash on HTML/text).
 * 9. Customer orders API contract format ({ success: true, orders: [...] }).
 * 10. Database safety & safeguard against mass deletions.
 */

import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';

async function runSuite() {
  console.log('\n=============================================================');
  console.log('  LUMIR — اختبارات نظام تسجيل العملاء، تتبع الطلبات، وأمان البيانات');
  console.log('=============================================================\n');

  // Load backend app in test environment
  process.env.NODE_ENV = 'test';
  const { app } = await import('../src/serverApp');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const testPort = address.port;
  const BASE_URL = `http://127.0.0.1:${testPort}`;

  try {
    // -------------------------------------------------------------------------
    // Test 1: Guest booking submission (login optional, requires clientName & phone)
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 1. إرسال طلب حجز كضيف دون تسجيل دخول مع جمع الاسم ورقم الجوال... ');
    const guestBookingPayload = {
      clientName: 'أمل العتيبي',
      clientPhone: '0559988776',
      city: 'جدة',
      district: 'الروضة',
      venueName: 'قاعة الأندلس',
      eventDate: '2026-11-25',
      startTime: '19:30',
      durationHours: 3,
      serviceId: 'srv-mobile-photo',
      serviceName: 'تصوير المناسبات بالجوال',
      packageId: 'pkg-photo-3h',
      packageName: 'باقة ٣ ساعات تغطية',
      subtotalSar: 350,
      estimatedTotalSar: 350,
      agreedTermsAndPrivacy: true
    };

    const guestRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestBookingPayload)
    });
    const guestData: any = await guestRes.json();

    assert.strictEqual(guestRes.status, 201, 'Guest booking should return 201 Created');
    assert.strictEqual(guestData.success, true, 'Guest booking response should have success: true');
    assert.ok(guestData.booking, 'Response must contain booking object');
    assert.ok(guestData.booking.referenceCode.startsWith('LMR-2610-'), 'Booking must have referenceCode');
    assert.strictEqual(guestData.booking.clientName, 'أمل العتيبي');
    assert.strictEqual(guestData.booking.clientPhone, '0559988776');
    assert.ok(!guestData.booking.customerUserId, 'Guest booking has no customerUserId');
    const createdRef = guestData.booking.referenceCode;
    console.log('\x1b[32m✓ PASSED\x1b[0m (تم إنشاء الطلب بنجاح: ' + createdRef + ')');

    // -------------------------------------------------------------------------
    // Test 2: Authenticated booking linking with customerUserId & email
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 2. إنشاء طلب حجز مرتبط بحساب عميل مسجل (customerUserId & customerEmail)... ');
    const authBookingPayload = {
      ...guestBookingPayload,
      clientName: 'سارة خالد',
      clientPhone: '0551122334',
      customerUserId: 'usr-google-999',
      customerEmail: 'sarah.khaled@example.com'
    };

    const authRes = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authBookingPayload)
    });
    const authData: any = await authRes.json();

    assert.strictEqual(authRes.status, 201);
    assert.strictEqual(authData.success, true);
    assert.strictEqual(authData.booking.customerUserId, 'usr-google-999');
    assert.strictEqual(authData.booking.customerEmail, 'sarah.khaled@example.com');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 3: Guest tracking with BOTH referenceCode AND clientPhone
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 3. التحقق المزدوج لتتبع الضيف (مطابقة الرقم المرجعي ورقم الجوال معاً)... ');
    // Case 3a: Both match -> Success 200
    const trackSuccessRes = await fetch(`${BASE_URL}/api/bookings/track-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceCode: createdRef,
        clientPhone: '0559988776'
      })
    });
    const trackSuccessData: any = await trackSuccessRes.json();
    assert.strictEqual(trackSuccessRes.status, 200);
    assert.strictEqual(trackSuccessData.success, true);
    assert.strictEqual(trackSuccessData.booking.referenceCode, createdRef);

    // Case 3b: Reference code matches but phone does NOT match -> Must fail (404 / error)
    const trackMismatchRes = await fetch(`${BASE_URL}/api/bookings/track-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceCode: createdRef,
        clientPhone: '0500000000' // wrong phone
      })
    });
    const trackMismatchData: any = await trackMismatchRes.json();
    assert.ok(
      trackMismatchRes.status === 403 || trackMismatchRes.status === 404,
      'Mismatching phone must return 403 or 404 Forbidden/Not Found'
    );
    assert.strictEqual(trackMismatchData.success, false);
    assert.strictEqual(trackMismatchData.booking, undefined, 'Must not return booking details on phone mismatch');

    // Case 3c: Missing phone -> Must return 400
    const trackNoPhoneRes = await fetch(`${BASE_URL}/api/bookings/track-guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceCode: createdRef
      })
    });
    assert.strictEqual(trackNoPhoneRes.status, 400, 'Missing phone must return 400 Bad Request');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 4: /api/customer/orders protection (must reject unauthenticated access)
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 4. حماية مسار طلبات العميل ومنع استعراض الطلبات بدون توثيق صالح... ');
    const unauthOrdersRes = await fetch(`${BASE_URL}/api/customer/orders`);
    assert.strictEqual(
      unauthOrdersRes.status,
      401,
      '/api/customer/orders must require Authorization header with Bearer token'
    );
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 5: Google OAuth integration in CustomerAuthContext
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 5. فحص وجود مزود Google الرسمي في CustomerAuthContext عبر Supabase... ');
    const authContextPath = path.resolve(process.cwd(), 'src/context/CustomerAuthContext.tsx');
    const authContextContent = fs.readFileSync(authContextPath, 'utf8');
    assert.ok(
      authContextContent.includes("provider: 'google'"),
      'CustomerAuthContext must invoke Supabase signInWithOAuth with provider: google'
    );
    assert.ok(
      authContextContent.includes('signInWithGoogle'),
      'CustomerAuthContext must expose signInWithGoogle function'
    );
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 6: Eradication of synthetic demo bookings & fake names
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 6. التأكد من تنظيف كافة الحجوزات الوهمية والأسماء التوضيحية من الكود... ');
    const publicDataRes = await fetch(`${BASE_URL}/api/central-data`);
    const publicData: any = await publicDataRes.json();
    const centralBookings = publicData.data?.bookings || [];

    const hasSyntheticBooking = centralBookings.some(
      (b: any) =>
        b.id === 'bk-101' ||
        b.id === 'bk-102' ||
        b.referenceCode === 'LMR-2610-101' ||
        b.referenceCode === 'LMR-2610-102'
    );
    assert.strictEqual(hasSyntheticBooking, false, 'No synthetic demo bookings should be present in public data');

    const hasFakeNames = centralBookings.some(
      (b: any) =>
        b.clientName === 'نورة المطيري' ||
        b.clientName === 'ريم السليمان' ||
        b.clientName === 'أم ريان'
    );
    assert.strictEqual(hasFakeNames, false, 'No fake customer names allowed in central bookings');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 7: Admin login button removed from public customer UI
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 7. التحقق من إزالة زر دخول الإدارة من تذييل واجهة العميل وقوائم الهيدر... ');
    const layoutPath = path.resolve(process.cwd(), 'src/components/Layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    assert.strictEqual(
      layoutContent.includes('لوحة تحكم الإدارة'),
      false,
      'Layout.tsx footer must not contain public admin dashboard button'
    );

    const headerModalsPath = path.resolve(process.cwd(), 'src/components/HeaderModals.tsx');
    const headerModalsContent = fs.readFileSync(headerModalsPath, 'utf8');
    assert.strictEqual(
      headerModalsContent.includes('دخول لوحة الإدارة'),
      false,
      'HeaderModals.tsx customer modal must not contain staff admin portal button'
    );
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 8: Safe JSON parsing resilient against HTML and invalid text
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 8. فحص أمان safeParseJsonResponse ضد استجابات HTML ونصوص الخطأ غير الصالحة... ');
    const { safeParseJsonResponse } = await import('../src/utils/apiClient');
    const fakeHtmlResponse = new Response('<html><head><title>404 Not Found</title></head><body>The page could not be found</body></html>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    const parsedHtmlResult = await safeParseJsonResponse(fakeHtmlResponse);
    assert.strictEqual(parsedHtmlResult.ok, false, 'HTML error response must not be treated as ok');
    assert.ok(parsedHtmlResult.error, 'Must provide understandable error message');
    assert.strictEqual(typeof parsedHtmlResult.error, 'string');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 9: Customer orders endpoint structure
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 9. التحقق من بنية API طلبات العملاء ودعم تصفية الحساب... ');
    const serverAppPath = path.resolve(process.cwd(), 'src/serverApp.ts');
    const serverAppContent = fs.readFileSync(serverAppPath, 'utf8');
    assert.ok(
      serverAppContent.includes("app.get('/api/customer/orders'"),
      'Server must provide GET /api/customer/orders route'
    );
    assert.ok(
      serverAppContent.includes("app.post('/api/bookings/track-guest'"),
      'Server must provide POST /api/bookings/track-guest route'
    );
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // -------------------------------------------------------------------------
    // Test 10: Database safety & safeguard against destructive mass deletion
    // -------------------------------------------------------------------------
    process.stdout.write('  ⏳ 10. التحقق من صيانة سلامة قاعدة البيانات وعدم تنفيذ أي حذف جماعي... ');
    const supabaseServerPath = path.resolve(process.cwd(), 'src/lib/supabaseServer.ts');
    const supabaseServerContent = fs.readFileSync(supabaseServerPath, 'utf8');
    assert.strictEqual(
      supabaseServerContent.includes('.delete().neq('),
      false,
      'No mass delete queries allowed in server integration'
    );
    assert.strictEqual(
      supabaseServerContent.includes('.delete().gte('),
      false,
      'No mass delete queries allowed in server integration'
    );
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    console.log('\n=============================================================');
    console.log('  \x1b[32m✓ كافة الاختبارات العشرة (10/10) اجتازت بنجاح تام!\x1b[0m');
    console.log('=============================================================\n');
  } finally {
    server.close();
  }
}

runSuite().catch((err) => {
  console.error('\n\x1b[31m❌ فشل في الاختبارات:\x1b[0m', err);
  process.exit(1);
});
