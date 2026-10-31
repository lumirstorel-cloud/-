/**
 * LUMIR — Invalid Response & Safe JSON Parsing Test Suite
 * 
 * Verifies:
 * 1. safeParseJsonResponse safely handles Vercel 404 plain text "The page could not be found"
 *    without throwing SyntaxError ("Unexpected token 'T', 'The page c'... is not valid JSON").
 * 2. safeParseJsonResponse safely handles HTML error pages (502/504 Bad Gateway, Cloudflare, etc.).
 * 3. safeParseJsonResponse safely handles malformed JSON responses.
 * 4. safeParseJsonResponse properly parses valid JSON success responses.
 * 5. safeParseJsonResponse preserves backend error messages when status >= 400.
 * 6. Express serverApp handles unhandled /api/* routes with JSON 404 (not HTML).
 * 7. vercel.json contains explicit /api/(.*) -> /api/index rewrite rules.
 */

import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { safeParseJsonResponse } from '../src/utils/apiClient';
import { app } from '../src/serverApp';

async function main() {
  console.log('\n=============================================================');
  console.log('  LUMIR — اختبار معالجة الاستجابات غير الصالحة ومنع انهيار JSON');
  console.log('=============================================================\n');

  // Test 1: Vercel 404 "The page could not be found" (The exact reported error)
  process.stdout.write('  ⏳ 1. اختبار استجابة Vercel 404 النصية ("The page could not be found")... ');
  const vercel404Response = new Response('The page could not be found', {
    status: 404,
    statusText: 'Not Found',
    headers: { 'content-type': 'text/plain; charset=utf-8' }
  });

  // Must not throw "SyntaxError: Unexpected token 'T', 'The page c'... is not valid JSON"
  let parsedVercel404;
  try {
    parsedVercel404 = await safeParseJsonResponse(vercel404Response);
  } catch (err: any) {
    assert.fail(`safeParseJsonResponse threw an unexpected error: ${err.message}`);
  }

  assert.strictEqual(parsedVercel404.ok, false);
  assert.strictEqual(parsedVercel404.status, 404);
  assert.ok(
    parsedVercel404.error && (parsedVercel404.error.includes('404') || parsedVercel404.error.includes('غير متوفر')),
    `Expected Arabic 404 error message, got: ${parsedVercel404.error}`
  );
  console.log('\x1b[32m✓ PASSED\x1b[0m (تم التعامل مع نص 404 بأمان دون انهيار أو رمي استثناء)');

  // Test 2: HTML Error page (e.g. 502 Bad Gateway / Proxy Error)
  process.stdout.write('  ⏳ 2. اختبار استجابة بوابة الخادم الفاشلة بتنسيق HTML (502 Bad Gateway)... ');
  const html502Response = new Response('<!DOCTYPE html><html><body><h1>502 Bad Gateway</h1></body></html>', {
    status: 502,
    statusText: 'Bad Gateway',
    headers: { 'content-type': 'text/html; charset=utf-8' }
  });

  const parsed502 = await safeParseJsonResponse(html502Response);
  assert.strictEqual(parsed502.ok, false);
  assert.strictEqual(parsed502.status, 502);
  assert.ok(
    parsed502.error && (parsed502.error.includes('5xx') || parsed502.error.includes('الخادم')),
    `Expected Arabic server error message, got: ${parsed502.error}`
  );
  console.log('\x1b[32m✓ PASSED\x1b[0m (تم التقاط صفحة HTML وعرض رسالة عربية واضحة)');

  // Test 3: Malformed JSON with application/json header
  process.stdout.write('  ⏳ 3. اختبار استجابة JSON تالفة أو غير مكتملة... ');
  const malformedJsonResponse = new Response('{ "incomplete": true, ', {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });

  const parsedMalformed = await safeParseJsonResponse(malformedJsonResponse);
  assert.strictEqual(parsedMalformed.ok, false);
  assert.ok(
    parsedMalformed.error && parsedMalformed.error.includes('تعذر قراءة استجابة الخادم'),
    `Expected Arabic malformed response message, got: ${parsedMalformed.error}`
  );
  console.log('\x1b[32m✓ PASSED\x1b[0m (تم تفادي SyntaxError بأمان)');

  // Test 4: Valid JSON success response
  process.stdout.write('  ⏳ 4. اختبار استجابة JSON سليمة وناجحة... ');
  const validResponse = new Response(JSON.stringify({ success: true, bookingId: 'LMR-999', amount: 450 }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  });

  const parsedValid = await safeParseJsonResponse<any>(validResponse);
  assert.strictEqual(parsedValid.ok, true);
  assert.strictEqual(parsedValid.status, 200);
  assert.strictEqual(parsedValid.data?.bookingId, 'LMR-999');
  assert.strictEqual(parsedValid.data?.amount, 450);
  console.log('\x1b[32m✓ PASSED\x1b[0m');

  // Test 5: Valid JSON error response with Arabic error payload
  process.stdout.write('  ⏳ 5. اختبار استجابة خطأ خادم مصحوبة برسالة JSON عربية... ');
  const customErrorResponse = new Response(JSON.stringify({ success: false, error: 'رمز الكوبون غير سارٍ أو منتهي الصلاحية' }), {
    status: 400,
    headers: { 'content-type': 'application/json' }
  });

  const parsedCustomError = await safeParseJsonResponse<any>(customErrorResponse);
  assert.strictEqual(parsedCustomError.ok, false);
  assert.strictEqual(parsedCustomError.status, 400);
  assert.strictEqual(parsedCustomError.error, 'رمز الكوبون غير سارٍ أو منتهي الصلاحية');
  console.log('\x1b[32m✓ PASSED\x1b[0m');

  // Test 6: Server catch-all for unknown /api/* routes returns JSON 404 (not HTML)
  process.stdout.write('  ⏳ 6. اختبار معالج مسارات API المجهولة في Express لضمان إعادة JSON 404... ');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const unknownRes = await fetch(`${baseUrl}/api/some-non-existent-route-999`);
    assert.strictEqual(unknownRes.status, 404);
    assert.ok(
      unknownRes.headers.get('content-type')?.includes('application/json'),
      `Expected JSON content-type, got: ${unknownRes.headers.get('content-type')}`
    );
    const unknownData = await unknownRes.json();
    assert.strictEqual(unknownData.success, false);
    assert.ok(
      unknownData.error && unknownData.error.includes('غير موجود') && unknownData.error.includes('404'),
      `Expected 404 error text, got: ${unknownData.error}`
    );
    console.log('\x1b[32m✓ PASSED\x1b[0m');
  } finally {
    server.close();
  }

  // Test 7: vercel.json rewrite configuration
  process.stdout.write('  ⏳ 7. فحص قواعد التوجيه في vercel.json لضمان توجيه مسارات /api/* إلى /api/index... ');
  const vercelConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf-8'));
  const apiRewrites = vercelConfig.rewrites.filter((r: any) => r.destination === '/api/index');
  assert.ok(apiRewrites.length >= 2, 'vercel.json must have rewrites for /api/(.*) and /api targeting /api/index');
  
  const hasWildcardApiRewrite = apiRewrites.some((r: any) => r.source === '/api/(.*)');
  const hasBareApiRewrite = apiRewrites.some((r: any) => r.source === '/api');
  assert.ok(hasWildcardApiRewrite, 'Missing /api/(.*) -> /api/index rewrite in vercel.json');
  assert.ok(hasBareApiRewrite, 'Missing /api -> /api/index rewrite in vercel.json');

  // Ensure API rewrites are placed BEFORE the SPA catch-all rewrite
  const spaIndex = vercelConfig.rewrites.findIndex((r: any) => r.destination === '/index.html');
  const apiWildcardIndex = vercelConfig.rewrites.findIndex((r: any) => r.source === '/api/(.*)');
  assert.ok(apiWildcardIndex < spaIndex, 'API rewrites must appear BEFORE the SPA rewrite rule');
  console.log('\x1b[32m✓ PASSED\x1b[0m');

  console.log('\n=============================================================');
  console.log('  جميع اختبارات معالجة الاستجابات غير الصالحة نجحت بنسبة 100%');
  console.log('=============================================================\n');
}

main().catch((err) => {
  console.error('\x1b[31mFatal test error:\x1b[0m', err);
  process.exit(1);
});
