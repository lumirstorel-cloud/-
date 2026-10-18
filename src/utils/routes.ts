import { PageView } from '../types';

/** Canonical origin used for canonical tags, sitemap and schema.org URLs.
 *  The apex domain (https://lumirr.store) issues a 308 redirect to https://www.lumirr.store. */
export const SITE_URL = 'https://www.lumirr.store';

/** Views that represent a whole service category (own landing page). */
export const CATEGORY_SLUG_TO_VIEW: Record<string, PageView> = {
  'mobile-photography': 'mobile-photography',
  'kids-corner': 'kids-corner',
  childcare: 'childcare',
  'wedding-support': 'wedding-support'
};

/** View -> canonical path. `service-detail` is resolved from its slug. */
const VIEW_PATHS: Partial<Record<PageView, string>> = {
  home: '/',
  catalog: '/products',
  gallery: '/gallery',
  'mobile-photography': '/services/mobile-photography',
  'kids-corner': '/services/kids-corner',
  childcare: '/services/childcare',
  'wedding-support': '/services/wedding-support',
  booking: '/booking',
  'booking-status': '/booking-status',
  about: '/about',
  faq: '/faq',
  privacy: '/privacy',
  terms: '/terms',
  contact: '/contact',
  admin: '/admin'
};

/** Legacy `#view` fragments used by the first version of the site (kept as 301-safe aliases). */
const LEGACY_HASH_TO_VIEW: Record<string, PageView> = {
  home: 'home',
  catalog: 'catalog',
  gallery: 'gallery',
  'mobile-photography': 'mobile-photography',
  'kids-corner': 'kids-corner',
  childcare: 'childcare',
  'wedding-support': 'wedding-support',
  booking: 'booking',
  'booking-status': 'booking-status',
  about: 'about',
  faq: 'faq',
  privacy: 'privacy',
  terms: 'terms',
  contact: 'contact',
  admin: 'admin'
};

export function normalizePath(pathname: string): string {
  const trimmed = (pathname || '/').split('?')[0].split('#')[0];
  const withoutSlash = trimmed.replace(/\/+$/, '');
  return withoutSlash === '' ? '/' : withoutSlash;
}

export function pathForView(view: PageView, slug?: string): string {
  if (view === 'service-detail') {
    return slug ? `/services/${slug}` : '/products';
  }
  return VIEW_PATHS[view] || '/';
}

export interface ParsedRoute {
  view: PageView;
  slug?: string;
  path: string;
  notFound?: boolean;
}

/** Resolve a location (pathname + optional legacy hash) to an internal route. */
export function parseRoute(pathname: string, hash?: string): ParsedRoute {
  const path = normalizePath(pathname);

  // Legacy hash URLs: /#catalog -> /products etc. The fragment wins so that old
  // shared links keep working and are rewritten to their canonical path.
  const hashKey = (hash || '').replace(/^#\/?/, '').trim();
  if (hashKey && LEGACY_HASH_TO_VIEW[hashKey]) {
    const legacyView = LEGACY_HASH_TO_VIEW[hashKey];
    return { view: legacyView, path: pathForView(legacyView) };
  }

  if (path === '/') return { view: 'home', path };

  const staticView = Object.entries(VIEW_PATHS).find(([, p]) => p === path);
  if (staticView) return { view: staticView[0] as PageView, path };

  if (path.startsWith('/services/')) {
    const slug = path.slice('/services/'.length).replace(/\/+$/, '');
    if (!slug) return { view: 'catalog', path: '/products' };
    const categoryView = CATEGORY_SLUG_TO_VIEW[slug];
    if (categoryView) return { view: categoryView, path };
    return { view: 'service-detail', slug, path };
  }

  return { view: 'not-found', path, notFound: true };
}

export function canonicalFor(path: string): string {
  const p = normalizePath(path);
  return p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`;
}
