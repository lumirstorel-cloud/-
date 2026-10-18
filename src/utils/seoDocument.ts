import { buildJsonLd, getSeoMeta } from '../data/seo';
import { canonicalFor } from './routes';

function setHeadAttribute(selector: string, attribute: string, value: string): void {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attribute, value);
}

function setRobots(noindex: boolean): void {
  const existing = document.head.querySelector('meta[name="robots"]');
  if (!noindex) {
    if (existing) existing.remove();
    return;
  }
  const meta =
    existing ||
    (() => {
      const created = document.createElement('meta');
      created.setAttribute('name', 'robots');
      document.head.appendChild(created);
      return created;
    })();
  meta.setAttribute('content', 'noindex, follow');
}

/** Keeps title / description / canonical / social tags in sync while navigating client-side. */
export function applySeoToDocument(path: string): void {
  const seo = getSeoMeta(path);
  const canonical = canonicalFor(path);

  document.title = seo.title;
  setHeadAttribute('meta[name="description"]', 'content', seo.description);
  setHeadAttribute('link[data-seo="canonical"]', 'href', canonical);

  setHeadAttribute('meta[property="og:url"]', 'content', canonical);
  setHeadAttribute('meta[property="og:title"]', 'content', seo.title);
  setHeadAttribute('meta[property="og:description"]', 'content', seo.description);
  setHeadAttribute('meta[name="twitter:title"]', 'content', seo.title);
  setHeadAttribute('meta[name="twitter:description"]', 'content', seo.description);

  setRobots(Boolean(seo.noindex));

  const jsonLd = document.head.querySelector('script[data-seo="jsonld"]');
  if (jsonLd) {
    jsonLd.textContent = JSON.stringify(buildJsonLd(path), null, 2);
  }
}
