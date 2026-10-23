/**
 * LUMIR — Vercel Serverless Function & API Routing Test Suite
 * 
 * Verifies:
 * 1. api/index.ts and api/[...slug].ts invoke Express properly.
 * 2. Path normalization (/health, /api/health, x-matched-path) works accurately.
 * 3. /api/health returns HTTP 200 with non-sensitive status and zero secrets.
 * 4. vercel.json rewrite regex guarantees API routes never fall back to index.html.
 * 5. vercel.json rewrite regex properly routes SPA paths to index.html.
 */

import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('\n=============================================================');
  console.log('  LUMIR — فحص واختبار مسارات Vercel Serverless API وهندسة التوجيه');
  console.log('=============================================================\n');

  // 1. Verify vercel.json regex rules
  process.stdout.write('  ⏳ 1. فحص قواعد التوجيه في vercel.json ومنع تحويل API إلى SPA... ');
  const vercelConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf-8'));
  const spaRewrite = vercelConfig.rewrites.find((r: any) => r.destination === '/index.html');
  assert.ok(spaRewrite, 'vercel.json must contain SPA fallback rewrite to /index.html');

  const pattern = new RegExp(`^${spaRewrite.source}$`);

  // API paths must NOT match the SPA rewrite
  assert.strictEqual(pattern.test('/api'), false, '/api must not rewrite to index.html');
  assert.strictEqual(pattern.test('/api/'), false, '/api/ must not rewrite to index.html');
  assert.strictEqual(pattern.test('/api/health'), false, '/api/health must not rewrite to index.html');
  assert.strictEqual(pattern.test('/api/reviews'), false, '/api/reviews must not rewrite to index.html');
  assert.strictEqual(pattern.test('/api/bookings'), false, '/api/bookings must not rewrite to index.html');
  assert.strictEqual(pattern.test('/api/bookings/track/LMR-123'), false, '/api/bookings/track must not rewrite to index.html');

  // Static assets must NOT match the SPA rewrite
  assert.strictEqual(pattern.test('/assets/index.js'), false, '/assets/index.js must not rewrite to index.html');
  assert.strictEqual(pattern.test('/images/logo.webp'), false, '/images/logo.webp must not rewrite to index.html');
  assert.strictEqual(pattern.test('/sitemap.xml'), false, '/sitemap.xml must not rewrite to index.html');
  assert.strictEqual(pattern.test('/robots.txt'), false, '/robots.txt must not rewrite to index.html');

  // Real client routes MUST match the SPA rewrite
  assert.strictEqual(pattern.test('/'), true, '/ must rewrite to index.html');
  assert.strictEqual(pattern.test('/booking'), true, '/booking must rewrite to index.html');
  assert.strictEqual(pattern.test('/services'), true, '/services must rewrite to index.html');
  assert.strictEqual(pattern.test('/portfolio'), true, '/portfolio must rewrite to index.html');
  assert.strictEqual(pattern.test('/track'), true, '/track must rewrite to index.html');
  assert.strictEqual(pattern.test('/admin'), true, '/admin must rewrite to index.html');
  console.log('\x1b[32m✓ PASSED\x1b[0m');

  // 2. Test api/index.ts handler with live requests
  process.stdout.write('  ⏳ 2. اختبار معالج api/index.ts ومعالجة GET /api... ');
  const apiIndexModule = await import('../api/index');
  const indexHandler = apiIndexModule.default;

  const server = http.createServer((req, res) => {
    indexHandler(req as any, res as any);
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const resRoot = await fetch(`${baseUrl}/api`);
    assert.strictEqual(resRoot.status, 200);
    const dataRoot = await resRoot.json();
    assert.strictEqual(dataRoot.service, 'Lumir Media & Events API');
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // 3. Test /api/health via api/index.ts
    process.stdout.write('  ⏳ 3. اختبار GET /api/health وعدم تسريب أي مفاتيح أو أسرار... ');
    const resHealth = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(resHealth.status, 200);
    const dataHealth = await resHealth.json();
    assert.strictEqual(dataHealth.status, 'ok');
    assert.ok(dataHealth.timestamp);
    assert.strictEqual(typeof dataHealth.supabaseConfigured, 'boolean');
    // Ensure no secret keys exist in the response
    assert.strictEqual((dataHealth as any).SUPABASE_SERVICE_ROLE_KEY, undefined);
    assert.strictEqual((dataHealth as any).SUPABASE_URL, undefined);
    assert.strictEqual((dataHealth as any).env, undefined);
    console.log('\x1b[32m✓ PASSED\x1b[0m');

    // 4. Test api/[...slug].ts catch-all handler
    process.stdout.write('  ⏳ 4. اختبار معالج api/[...slug].ts ومسارات /api/health و/api/reviews... ');
    const slugModule = await import('../api/[...slug]');
    const slugHandler = slugModule.default;

    const slugServer = http.createServer((req, res) => {
      slugHandler(req as any, res as any);
    });
    await new Promise<void>((resolve) => slugServer.listen(0, resolve));
    const slugPort = (slugServer.address() as any).port;
    const slugBaseUrl = `http://127.0.0.1:${slugPort}`;

    try {
      const slugRes = await fetch(`${slugBaseUrl}/api/health`);
      assert.strictEqual(slugRes.status, 200);
      const slugData = await slugRes.json();
      assert.strictEqual(slugData.status, 'ok');

      // Test normalized path without /api prefix
      const noPrefixRes = await fetch(`${slugBaseUrl}/health`);
      assert.strictEqual(noPrefixRes.status, 200);
      const noPrefixData = await noPrefixRes.json();
      assert.strictEqual(noPrefixData.status, 'ok');

      console.log('\x1b[32m✓ PASSED\x1b[0m');
    } finally {
      slugServer.close();
    }

    // 5. Test x-matched-path header handling
    process.stdout.write('  ⏳ 5. اختبار استعادة المسار الأصلي عبر ترويسة x-matched-path... ');
    const matchedPathServer = http.createServer((req, res) => {
      // Simulate Vercel setting req.url to /api but passing x-matched-path
      req.url = '/api';
      req.headers['x-matched-path'] = '/api/health';
      indexHandler(req as any, res as any);
    });
    await new Promise<void>((resolve) => matchedPathServer.listen(0, resolve));
    const mpPort = (matchedPathServer.address() as any).port;
    try {
      const mpRes = await fetch(`http://127.0.0.1:${mpPort}/api`);
      assert.strictEqual(mpRes.status, 200);
      const mpData = await mpRes.json();
      assert.strictEqual(mpData.status, 'ok', 'Should route to health endpoint via x-matched-path');
      console.log('\x1b[32m✓ PASSED\x1b[0m');
    } finally {
      matchedPathServer.close();
    }

    console.log('\n=============================================================');
    console.log('  جميع اختبارات توجيه Vercel Serverless Function نجحت بنسبة 100%');
    console.log('=============================================================\n');
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error('\x1b[31mFatal test error:\x1b[0m', err);
  process.exit(1);
});
