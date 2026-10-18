/**
 * Post-build SEO prerender.
 *
 * Vite emits a single SPA shell. This script writes one HTML document per route
 * so every indexable URL returns its own unique <title>, meta description,
 * canonical URL, social tags and JSON-LD — then emits sitemap.xml.
 *
 * Run automatically after `vite build` (see the `build` script in package.json).
 */
import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_LUMIR_DATA, INITIAL_SERVICES } from '../src/data/centralData';
import { SEO_RECORDS, buildJsonLd, getSeoMeta, SITE_URL } from '../src/data/seo';
import { canonicalFor } from '../src/utils/routes';

const DIST = path.join(process.cwd(), 'dist');
const SHELL = path.join(DIST, 'index.html');

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setAttr(html: string, tagRe: RegExp, attr: string, value: string): string {
  if (!tagRe.test(html)) return html;
  return html.replace(tagRe, (tag) => {
    const re = new RegExp(`${attr}="[^"]*"`);
    if (re.test(tag)) return tag.replace(re, `${attr}="${escapeAttr(value)}"`);
    return tag.replace(/(\/?>)$/, ` ${attr}="${escapeAttr(value)}"$1`);
  });
}

function setTitle(html: string, title: string): string {
  return html.replace(/<title([^>]*)>[\s\S]*?<\/title>/, `<title$1>${escapeAttr(title)}</title>`);
}

function setJsonLd(html: string, route: string): string {
  const payload = JSON.stringify(buildJsonLd(route), null, 2);
  if (!/<script[^>]*data-seo="jsonld"[^>]*>[\s\S]*?<\/script>/.test(html)) {
    throw new Error('JSON-LD marker missing from built index.html');
  }
  return html.replace(
    /(<script[^>]*data-seo="jsonld"[^>]*>)[\s\S]*?(<\/script>)/,
    (_m, open, close) => `${open}\n      ${payload}\n    ${close}`
  );
}

function setRobots(html: string, noindex: boolean): string {
  const withRobots = html.replace(/\s*<meta name="robots"[^>]*>/g, '');
  if (!noindex) return withRobots;
  const tag = '<meta name="robots" content="noindex, follow" />';
  if (withRobots.includes('name="robots"')) return withRobots;
  if (/<link[^>]*data-seo="canonical"[^>]*>/.test(withRobots)) {
    return withRobots.replace(/(<link[^>]*data-seo="canonical"[^>]*>)/, `$1\n    ${tag}`);
  }
  return withRobots.replace('</head>', `  ${tag}\n  </head>`);
}

function buildPage(route: string): string {
  const seo = getSeoMeta(route);
  const canonical = canonicalFor(route);

  let html = fs.readFileSync(SHELL, 'utf8');

  for (const marker of ['title', 'description', 'canonical', 'jsonld']) {
    if (!html.includes(`data-seo="${marker}"`)) {
      throw new Error(`Missing data-seo="${marker}" marker in dist/index.html`);
    }
  }

  html = setTitle(html, seo.title);
  html = setAttr(html, /<meta[^>]*data-seo="description"[^>]*>/, 'content', seo.description);
  html = setAttr(html, /<link[^>]*data-seo="canonical"[^>]*>/, 'href', canonical);
  html = setAttr(html, /<meta[^>]*data-seo="og:url"[^>]*>/, 'content', canonical);
  html = setAttr(html, /<meta[^>]*data-seo="og:title"[^>]*>/, 'content', seo.title);
  html = setAttr(html, /<meta[^>]*data-seo="og:description"[^>]*>/, 'content', seo.description);
  html = setAttr(html, /<meta[^>]*data-seo="twitter:title"[^>]*>/, 'content', seo.title);
  html = setAttr(html, /<meta[^>]*data-seo="twitter:description"[^>]*>/, 'content', seo.description);
  html = setJsonLd(html, route);
  html = setRobots(html, Boolean(seo.noindex));

  return html;
}

function writeRoute(route: string, html: string): string {
  const rel = route === '/' ? 'index.html' : `${route.replace(/^\//, '')}/index.html`;
  const outFile = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, 'utf-8');
  return rel;
}

function priorityFor(route: string): string {
  if (route === '/') return '1.0';
  if (route === '/products') return '0.9';
  if (['/services/mobile-photography', '/services/kids-corner', '/services/childcare', '/services/phone-supervisor'].includes(route))
    return '0.8';
  if (route.startsWith('/services/')) return '0.7';
  if (['/gallery', '/faq', '/contact', '/booking'].includes(route)) return '0.6';
  return '0.4';
}

function main(): void {
  if (!fs.existsSync(SHELL)) {
    throw new Error('dist/index.html not found — run `vite build` first.');
  }

  const servicePaths = INITIAL_SERVICES.map((s) => `/services/${s.slug}`);
  const routes = Array.from(new Set([...Object.keys(SEO_RECORDS), ...servicePaths])).sort();

  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const written: { route: string; file: string; title: string }[] = [];

  for (const route of routes) {
    const seo = getSeoMeta(route);

    if (!seo.title || !seo.description) throw new Error(`Empty SEO record for ${route}`);
    if (titles.has(seo.title)) {
      throw new Error(`Duplicate title "${seo.title}" for ${route} and ${titles.get(seo.title)}`);
    }
    if (descriptions.has(seo.description)) {
      throw new Error(
        `Duplicate description for ${route} and ${descriptions.get(seo.description)}`
      );
    }
    titles.set(seo.title, route);
    descriptions.set(seo.description, route);

    const html = buildPage(route);

    // JSON-LD must stay parseable
    const jsonLdMatch = html.match(/<script[^>]*data-seo="jsonld"[^>]*>([\s\S]*?)<\/script>/);
    if (!jsonLdMatch) throw new Error(`JSON-LD missing after injection for ${route}`);
    JSON.parse(jsonLdMatch[1]);

    if (!html.includes(`href="${canonicalFor(route)}"`)) {
      throw new Error(`Canonical mismatch for ${route}`);
    }

    written.push({ route, file: writeRoute(route, html), title: seo.title });
  }

  // sitemap.xml — indexable routes only, canonical host, HTTPS
  const lastmod = new Date().toISOString().slice(0, 10);
  const indexable = routes.filter((route) => !getSeoMeta(route).noindex);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...indexable.map((route) => {
      const loc = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`;
      return [
        '  <url>',
        `    <loc>${loc}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        '    <changefreq>monthly</changefreq>',
        `    <priority>${priorityFor(route)}</priority>`,
        '  </url>'
      ].join('\n');
    }),
    '</urlset>',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap, 'utf-8');

  // Brand 404 document (Vercel serves it with a real 404 status when present)
  const notFound = setRobots(
    setTitle(buildPage('/'), 'الصفحة غير موجودة — LUMIR | لومير'),
    true
  )
    .replace(/<link[^>]*data-seo="canonical"[^>]*>\s*/g, '')
    .replace(/<meta[^>]*data-seo="og:url"[^>]*>\s*/g, '');
  fs.writeFileSync(path.join(DIST, '404.html'), notFound, 'utf-8');

  // Static snapshot of the public bootstrap endpoint so the published site never
  // requests a missing /api/bootstrap (identical data to the client defaults).
  const apiDir = path.join(DIST, 'api');
  fs.mkdirSync(apiDir, { recursive: true });
  fs.writeFileSync(
    path.join(apiDir, 'bootstrap'),
    JSON.stringify(
      {
        settings: INITIAL_LUMIR_DATA.settings,
        announcements: INITIAL_LUMIR_DATA.announcements,
        sliderSettings: INITIAL_LUMIR_DATA.sliderSettings,
        banners: INITIAL_LUMIR_DATA.banners,
        services: INITIAL_LUMIR_DATA.services,
        portfolio: INITIAL_LUMIR_DATA.portfolio,
        faqs: INITIAL_LUMIR_DATA.faqs,
        cityCoverage: INITIAL_LUMIR_DATA.cityCoverage
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`\nPrerendered ${written.length} routes:`);
  for (const item of written) {
    console.log(`  ${item.route.padEnd(34)} → ${item.file}`);
  }
  console.log(`\nsitemap.xml: ${indexable.length} indexable URLs on ${SITE_URL}`);
}

main();
