/**
 * LUMIR — Production Supabase Safeguards Test Suite
 * 
 * Verifies requirement #5:
 * 1. Missing Supabase config in production MUST NOT allow bookings or reviews to succeed using local JSON.
 * 2. Supabase failures MUST NOT result in false success responses.
 * 3. hasSupabaseServerConfig() MUST reject ANON_KEY for server operations.
 */

import assert from 'assert';
import http from 'http';

async function main() {
  console.log('\n=============================================================');
  console.log('  LUMIR — اختبارات صرامة بيئة الإنتاج ومنع التخزين المحلي الصامت');
  console.log('=============================================================\n');

  // Test 1: Verify hasSupabaseServerConfig requires SUPABASE_SERVICE_ROLE_KEY
  process.stdout.write('  ⏳ 1. فحص عدم قبول SUPABASE_ANON_KEY كبديل إداري في hasSupabaseServerConfig... ');
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_ANON_KEY = 'test_anon_key_only';
  
  const { hasSupabaseServerConfig, getSupabaseAdmin } = await import('../src/lib/supabaseServer');
  assert.strictEqual(
    hasSupabaseServerConfig(),
    false,
    'hasSupabaseServerConfig must return false when only ANON_KEY is present'
  );
  assert.strictEqual(
    getSupabaseAdmin(),
    null,
    'getSupabaseAdmin must return null without SUPABASE_SERVICE_ROLE_KEY'
  );
  console.log('\x1b[32m✓ PASSED\x1b[0m');

  // Set production environment flags
  process.env.NODE_ENV = 'production';
  process.env.VERCEL = '1';

  // Import app with production flags active
  const { app } = await import('../src/serverApp');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const testPort = address.port;
  const TEST_URL = `http://127.0.0.1:${testPort}`;

  try {
    // Test 2: Booking creation must fail with 503 in production if Supabase config is missing
    process.stdout.write('  ⏳ 2. التحقق من رفض الحجز بـ 503 في الإنتاج عند غياب Supabase وعدم التراجع الصامت... ');
    const bookingPayload = {
      clientName: 'سارة خالد',
      clientPhone: '0551234567',
      city: 'مكة المكرمة',
      district: 'العزيزية',
      eventDate: '2026-11-20',
      startTime: '18:00',
      durationHours: 4,
      serviceId: 'srv-mobile-photo'
    };

    const bookRes = await fetch(`${TEST_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload)
    });

    assert.strictEqual(
      bookRes.status,
      503,
      `Expected status 503 in production without Supabase, got ${bookRes.status}`
    );
    const bookData = await bookRes.json();
    assert.ok(bookData.error, 'Must return descriptive error message');
    assert.strictEqual(bookData.success, undefined, 'Must not return false success flag');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // Test 3: Review submission must fail with 503 in production if Supabase config is missing
    process.stdout.write('  ⏳ 3. التحقق من رفض التقييم بـ 503 في الإنتاج عند غياب Supabase وعدم التراجع الصامت... ');
    const reviewPayload = {
      serviceId: 'srv-mobile-photo',
      customerName: 'نورة العتيبي',
      city: 'مكة المكرمة',
      rating: 5,
      comment: 'تجربة ممتازة وخدمة متقنة للتوثيق بالجوال'
    };

    const reviewPostRes = await fetch(`${TEST_URL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewPayload)
    });

    assert.strictEqual(
      reviewPostRes.status,
      503,
      `Expected status 503 in production without Supabase, got ${reviewPostRes.status}`
    );
    const reviewPostData = await reviewPostRes.json();
    assert.ok(reviewPostData.error, 'Must return descriptive error message');
    assert.strictEqual(reviewPostData.success, undefined, 'Must not return false success flag');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // Test 4: Review retrieval must fail with 503 in production if Supabase config is missing
    process.stdout.write('  ⏳ 4. التحقق من رفض استعراض التقييمات بـ 503 في الإنتاج عند غياب Supabase... ');
    const reviewGetRes = await fetch(`${TEST_URL}/api/reviews`);
    assert.strictEqual(
      reviewGetRes.status,
      503,
      `Expected status 503 in production without Supabase, got ${reviewGetRes.status}`
    );
    const reviewGetData = await reviewGetRes.json();
    assert.ok(reviewGetData.error, 'Must return descriptive error message');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    console.log('\n=============================================================');
    console.log('  جميع اختبارات صرامة بيئة الإنتاج نجحت بنسبة 100%');
    console.log('=============================================================\n');
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('\x1b[31mFatal test error:\x1b[0m', err);
  process.exit(1);
});
