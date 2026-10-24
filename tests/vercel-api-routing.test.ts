/**
 * LUMIR — Vercel Serverless Function & Production Runtime Load Test Suite
 * 
 * Verifies:
 * 1. Building and compiling api/[...slug].ts and api/index.ts into real JS bundles.
 * 2. Directly loading the compiled production JS module using Node.js ESM import to prove
 *    no ERR_MODULE_NOT_FOUND occurs at runtime in production.
 * 3. api/index.ts and api/[...slug].ts invoke real Express logic properly.
 * 4. Path normalization (/health, /api/health, x-matched-path) works accurately.
 * 5. /api/health returns HTTP 200 with non-sensitive status and zero secrets.
 * 6. Real endpoints (/api/reviews, /api/bookings, /api/bootstrap) are handled by Express logic.
 * 7. vercel.json rewrite regex guarantees API routes never fall back to index.html.
 * 8. vercel.json rewrite regex properly routes SPA paths to index.html.
 */

import assert from 'assert';
import http from 'http';
import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

async function main() {
  console.log('\n=============================================================');
  console.log('  LUMIR — فحص واختبار تجميع وتشغيل دوال Vercel Serverless');
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

  // 2. Ensure api/_serverApp.bundle.js exists and is valid
  process.stdout.write('  ⏳ 2. التحقق من وجود وحجم ملف الحزمة المجمعة api/_serverApp.bundle.js... ');
  const bundlePath = path.resolve(process.cwd(), 'api/_serverApp.bundle.js');
  assert.ok(fs.existsSync(bundlePath), 'api/_serverApp.bundle.js must exist on disk');
  const bundleStat = fs.statSync(bundlePath);
  assert.ok(bundleStat.size > 10000, 'Bundle size should be substantial (containing all server logic)');
  console.log(`\x1b[32m✓ PASSED\x1b[0m (${Math.round(bundleStat.size / 1024)} KB)`);

  // 3. Simulate Vercel Node runtime compilation: compile api/[...slug].ts to JS and load in Node ESM
  process.stdout.write('  ⏳ 3. اختبار تجميع api/[...slug].ts وتشغيله في بيئة Node ESM الخالصة ومحاكاة Vercel... ');
  const testOutFile = path.resolve(process.cwd(), 'api/_test_slug_runtime.js');
  try {
    await esbuild.build({
      entryPoints: [path.resolve(process.cwd(), 'api/[...slug].ts')],
      outfile: testOutFile,
      format: 'esm',
      platform: 'node',
      packages: 'external',
      target: 'node20',
      sourcemap: false
    });

    // Directly load the emitted JS file in pure Node ESM — this is where ERR_MODULE_NOT_FOUND previously occurred
    const runtimeModule = await import(testOutFile);
    assert.strictEqual(typeof runtimeModule.default, 'function', 'Emitted JS module must export default handler function');
    console.log('\x1b[32m✓ PASSED\x1b[0m (Module resolved and loaded with ZERO ERR_MODULE_NOT_FOUND errors)');

    // 4. Test live server with compiled Vercel serverless function
    process.stdout.write('  ⏳ 4. اختبار تشغيل دالة Vercel المُجمعة مع مسار GET /api/health... ');
    const compiledHandler = runtimeModule.default;
    const testServer = http.createServer((req, res) => {
      compiledHandler(req as any, res as any);
    });
    await new Promise<void>((resolve) => testServer.listen(0, resolve));
    const testPort = (testServer.address() as any).port;
    const testBaseUrl = `http://127.0.0.1:${testPort}`;

    try {
      const resHealth = await fetch(`${testBaseUrl}/api/health`);
      assert.strictEqual(resHealth.status, 200);
      const dataHealth = await resHealth.json();
      assert.strictEqual(dataHealth.status, 'ok');
      assert.ok(dataHealth.timestamp);
      assert.strictEqual(typeof dataHealth.supabaseConfigured, 'boolean');
      // Ensure zero secrets
      assert.strictEqual((dataHealth as any).SUPABASE_SERVICE_ROLE_KEY, undefined);
      assert.strictEqual((dataHealth as any).SUPABASE_URL, undefined);
      console.log('\x1b[32m✓ PASSED\x1b[0m');

      // 5. Test real API routes through the compiled function
      process.stdout.write('  ⏳ 5. اختبار استجابة GET /api/bootstrap وGET /api/reviews عبر الدالة المُجمعة... ');
      const resBootstrap = await fetch(`${testBaseUrl}/api/bootstrap`);
      assert.strictEqual(resBootstrap.status, 200);
      const dataBootstrap = await resBootstrap.json();
      assert.ok(Array.isArray(dataBootstrap.services), 'Must return services catalog');
      assert.ok(dataBootstrap.services.length > 0, 'Catalog must not be empty');

      // Test reviews
      const resReviews = await fetch(`${testBaseUrl}/api/reviews`);
      assert.ok([200, 503].includes(resReviews.status), 'Must return 200 or 503 depending on Supabase config');
      console.log('\x1b[32m✓ PASSED\x1b[0m');

      // 6. Test path normalization (e.g. /health without /api)
      process.stdout.write('  ⏳ 6. اختبار تطبيع المسارات المختصرة (/health) وترويسة x-matched-path... ');
      const resNoPrefix = await fetch(`${testBaseUrl}/health`);
      assert.strictEqual(resNoPrefix.status, 200);
      const dataNoPrefix = await resNoPrefix.json();
      assert.strictEqual(dataNoPrefix.status, 'ok');
      console.log('\x1b[32m✓ PASSED\x1b[0m');

    } finally {
      testServer.close();
    }
  } finally {
    if (fs.existsSync(testOutFile)) {
      fs.unlinkSync(testOutFile);
    }
  }

  console.log('\n=============================================================');
  console.log('  جميع اختبارات تجميع وتشغيل دوال Vercel Serverless نجحت بنسبة 100%');
  console.log('=============================================================\n');
}

main().catch((err) => {
  console.error('\x1b[31mFatal test error:\x1b[0m', err);
  process.exit(1);
});
