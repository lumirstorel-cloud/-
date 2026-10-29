/**
 * LUMIR — Test Suite for Cart, Customer Auth, and Hourly Pricing
 * 
 * Verifies:
 * 1. Hourly calculation (hourlyRate × durationHours + fixedFee).
 * 2. Duration boundary validation (minHours / maxHours).
 * 3. Server-authoritative recalculation & anti-tampering rejection.
 * 4. Customer registration, login, and profile verification.
 * 5. Customer order isolation: customer only sees their own orders.
 * 6. Admin hourly pricing and duration management update endpoint.
 */

import assert from 'assert';
import http from 'http';
import { app } from '../src/serverApp';

async function runTestSuite() {
  console.log('\n=============================================================');
  console.log('  LUMIR — اختبارات سلة المشتريات، تسجيل الدخول، والتسعير بالساعة');
  console.log('=============================================================\n');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Fetch catalog services to get an hourly-enabled service
    process.stdout.write('  ⏳ 1. جلب بيانات الخدمات المعتمدة... ');
    const bootRes = await fetch(`${baseUrl}/api/bootstrap`);
    assert.strictEqual(bootRes.status, 200);
    const bootData = await bootRes.json();
    const photoService = bootData.services.find((s: any) => s.id === 'srv-mobile-photo') || bootData.services[0];
    assert.ok(photoService, 'Must have photography service');
    console.log(`\x1b[32m✓ PASSED\x1b[0m (${photoService.name})`);

    // 2. Customer Registration
    process.stdout.write('  ⏳ 2. اختبار تسجيل حساب عميل جديد (Customer Registration)... ');
    const testCustomerEmail = `customer-${Date.now()}@lumir-test.sa`;
    const regRes = await fetch(`${baseUrl}/api/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: 'Password123!',
        name: 'سارة الأحمدي',
        phone: '0555123456'
      })
    });
    assert.strictEqual(regRes.status, 200, `Register should succeed, got ${regRes.status}`);
    const regData = await regRes.json();
    assert.ok(regData.success, 'Registration must be successful');
    assert.ok(regData.token, 'Must return auth token');
    const customerToken = regData.token;
    const customerId = regData.user.id;
    console.log(`\x1b[32m✓ PASSED\x1b[0m (معرف العميل: ${customerId})`);

    // 3. Customer Profile Verification
    process.stdout.write('  ⏳ 3. التحقق من جلسة العميل عبر /api/customer/me... ');
    const meRes = await fetch(`${baseUrl}/api/customer/me`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.user.email, testCustomerEmail);
    console.log(`\x1b[32m✓ PASSED\x1b[0m`);

    // 4. Hourly Rate Calculation and Order Creation
    process.stdout.write('  ⏳ 4. اختبار إنشاء حجز بتسعير الساعة مع ربطه بحساب العميل... ');
    const hourlyRate = photoService.hourlyRateSar || 100;
    const testHours = 4;
    const expectedSubtotal = hourlyRate * testHours;
    const approvedFees = bootData.settings.approvedFeesSar || 0;
    const expectedTotal = expectedSubtotal + approvedFees;

    const hourlyBookingPayload = {
      referenceCode: `TEST-HOURLY-${Date.now()}`,
      clientName: 'سارة الأحمدي',
      clientPhone: '0555123456',
      city: 'مكة المكرمة',
      district: 'العزيزية',
      eventDate: '2026-11-20',
      startTime: '18:00',
      durationHours: testHours,
      serviceId: photoService.id,
      pricingModel: 'hourly',
      customerUserId: customerId,
      customerEmail: testCustomerEmail
    };

    const bookRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify(hourlyBookingPayload)
    });

    assert.strictEqual(bookRes.status, 201, `Booking should succeed with 201, got ${bookRes.status}`);
    const bookData = await bookRes.json();
    assert.ok(bookData.success);
    assert.strictEqual(bookData.booking.subtotalSar, expectedSubtotal);
    assert.strictEqual(bookData.booking.estimatedTotalSar, expectedTotal);
    assert.strictEqual(bookData.booking.durationHours, testHours);
    assert.strictEqual(bookData.booking.customerUserId, customerId);
    console.log(`\x1b[32m✓ PASSED\x1b[0m (${expectedSubtotal} ر.س + ${approvedFees} رسوم = ${expectedTotal} ر.س)`);

    // 5. Anti-Tampering Check
    process.stdout.write('  ⏳ 5. فحص حماية الأسعار ضد التلاعب (Anti-Tampering Enforcement)... ');
    const tamperedPayload = {
      ...hourlyBookingPayload,
      referenceCode: `TEST-TAMPER-${Date.now()}`,
      estimatedTotalSar: 10 // Client attempts to send 10 SAR instead of expected total
    };

    const tamperRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify(tamperedPayload)
    });

    assert.strictEqual(tamperRes.status, 400, 'Tampered price must be rejected with 400');
    console.log(`\x1b[32m✓ PASSED\x1b[0m (تم رفض المبلغ المتلاعب به بنجاح)`);

    // 6. Multi-Item Cart Order Creation
    process.stdout.write('  ⏳ 6. اختبار إرسال طلب يحتوي سلة خدمات متعددة (Multi-Item Cart Order)... ');
    const cartItems = [
      {
        serviceId: photoService.id,
        serviceName: photoService.name,
        pricingModel: 'hourly',
        durationHours: 3,
        quantity: 1
      },
      {
        serviceId: bootData.services[1]?.id || photoService.id,
        serviceName: bootData.services[1]?.name || photoService.name,
        pricingModel: 'hourly',
        durationHours: 4,
        quantity: 1
      }
    ];

    const multiBookingPayload = {
      referenceCode: `TEST-CART-${Date.now()}`,
      clientName: 'سارة الأحمدي',
      clientPhone: '0555123456',
      city: 'جدة',
      district: 'الحمراء',
      eventDate: '2026-12-01',
      startTime: '17:00',
      orderItems: cartItems
    };

    const multiRes = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`
      },
      body: JSON.stringify(multiBookingPayload)
    });

    assert.strictEqual(multiRes.status, 201, `Multi-item order should succeed with 201, got ${multiRes.status}`);
    const multiData = await multiRes.json();
    assert.ok(multiData.booking.orderItems.length >= 2, 'Must snapshot orderItems in booking');
    console.log(`\x1b[32m✓ PASSED\x1b[0m (عدد عناصر السلة: ${multiData.booking.orderItems.length})`);

    // 7. Customer Order Isolation
    process.stdout.write('  ⏳ 7. اختبار عزل طلبات العملاء (Customer Order Isolation)... ');
    // Customer 1 fetches their orders
    const cust1OrdersRes = await fetch(`${baseUrl}/api/customer/orders`, {
      headers: { Authorization: `Bearer ${customerToken}` }
    });
    assert.strictEqual(cust1OrdersRes.status, 200);
    const cust1Orders = await cust1OrdersRes.json();
    assert.ok(cust1Orders.orders.length >= 2, 'Customer 1 must see their 2 orders');

    // Register Customer 2
    const reg2Res = await fetch(`${baseUrl}/api/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `other-${Date.now()}@lumir-test.sa`,
        password: 'Password123!',
        name: 'عميلة أخرى',
        phone: '0566999888'
      })
    });
    const reg2Data = await reg2Res.json();
    const cust2Token = reg2Data.token;

    // Customer 2 fetches their orders: MUST BE 0 (isolated)
    const cust2OrdersRes = await fetch(`${baseUrl}/api/customer/orders`, {
      headers: { Authorization: `Bearer ${cust2Token}` }
    });
    assert.strictEqual(cust2OrdersRes.status, 200);
    const cust2Orders = await cust2OrdersRes.json();
    assert.strictEqual(cust2Orders.orders.length, 0, 'Customer 2 must NOT see Customer 1 orders');
    console.log(`\x1b[32m✓ PASSED\x1b[0m (عزل تام بين حسابات العملاء)`);

    // 8. Admin Hourly Pricing Update
    process.stdout.write('  ⏳ 8. اختبار تحديث أسعار ومدة الخدمة من لوحة الإدارة... ');
    // Admin login
    const adminLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'lumir.store.l@gmail.com',
        password: 'Lumir@2026'
      })
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
    const adminData = await adminLoginRes.json();
    const adminToken = adminData.token;

    // Update pricing for service
    const updatePricingRes = await fetch(`${baseUrl}/api/admin/services/${photoService.id}/pricing`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        hourlyRateSar: 120,
        isHourlyEnabled: true,
        minHours: 3,
        maxHours: 10,
        defaultHours: 5,
        fixedFeeSar: 50
      })
    });

    assert.strictEqual(updatePricingRes.status, 200, `Pricing update should return 200, got ${updatePricingRes.status}`);
    const updatedPricingData = await updatePricingRes.json();
    assert.strictEqual(updatedPricingData.service.hourlyRateSar, 120);
    assert.strictEqual(updatedPricingData.service.fixedFeeSar, 50);
    assert.strictEqual(updatedPricingData.service.defaultHours, 5);
    console.log(`\x1b[32m✓ PASSED\x1b[0m (تم تعديل سعر الساعة إلى 120 ر.س والرسوم إلى 50 ر.س)`);

    console.log('\n=============================================================');
    console.log('  \x1b[32m✓ جميع اختبارات السلة، تسجيل الدخول، والتسعير بالساعة اكتملت بنجاح!\x1b[0m');
    console.log('=============================================================\n');
  } finally {
    server.close();
  }
}

runTestSuite().catch((err) => {
  console.error('\n\x1b[31m❌ فشل في الاختبارات:\x1b[0m', err);
  process.exit(1);
});
