import { INITIAL_LUMIR_DATA, INITIAL_SERVICES } from './centralData';
import { ServiceItem } from '../types';
import { canonicalFor, normalizePath, SITE_URL } from '../utils/routes';

export { SITE_URL };

export interface SeoMeta {
  /** Full, unique <title> for the page. */
  title: string;
  /** Full, unique meta description for the page. */
  description: string;
  /** Single H1 rendered on the page (when this record owns the heading). */
  h1?: string;
  /** Intro paragraph rendered directly under the H1 (unique per service page). */
  intro?: string;
  /** Short label used in breadcrumbs and schema (must match visible text). */
  breadcrumbLabel?: string;
  /** Block indexing for utility/admin pages. */
  noindex?: boolean;
}

const BRAND = 'LUMIR | لومير';

/**
 * Explicit records for the pages that carry the main search strategy.
 * Every record has a unique title and a unique description — nothing is copied
 * between services.
 */
export const SEO_RECORDS: Record<string, SeoMeta> = {
  '/': {
    title: 'لومير LUMIR | توثيق زفاف سينمائي فاخر بعدسة الجوال في مكة وجدة',
    description:
      'لومير لتوثيق تفاصيل زفافك بعدسة الجوال، بلقطات عفوية ومقاطع ريلز احترافية بلمسة سعودية. اكتشف خدماتنا للمناسبات في مكة وجدة، مع تسليم سريع خلال 48 ساعة وفق شروط الباقة.',
    h1: 'لومير | خدمات احترافية للمناسبات وباقات مرنة في مكة وجدة'
  },

  '/products': {
    title: 'خدمات المناسبات في مكة وجدة | لومير LUMIR',
    description:
      'استعرضي خدمات لومير لمناسبات مكة وجدة: مفرزة جوالات، مشرفة أطفال، ركن أطفال وأنشطة إبداعية، وتصوير مناسبات بالجوال، مع باقات وأسعار أولية وحجز مباشر.',
    h1: 'خدمات المناسبات في مكة وجدة | باقات لومير المتكاملة',
    breadcrumbLabel: 'الخدمات'
  },

  '/services/mobile-photography': {
    title: 'تصوير المناسبات بالجوال | توثيق زفاف سينمائي من لومير',
    description:
      'تصوير مناسبات بالجوال في مكة وجدة: لقطات عفوية ومقاطع ريلز بأسلوب سينمائي، مع تنسيق المحتوى ومدة التغطية وموعد التسليم قبل الحجز من لومير.',
    h1: 'تصوير المناسبات بالجوال | توثيق زفاف سينمائي من لومير',
    intro:
      'وثّقي أجمل تفاصيل يومك بلقطات عفوية ومقاطع قصيرة بأسلوب سينمائي يناسب المشاركة على منصات التواصل الاجتماعي. تقدم لومير خدمة تصوير المناسبات بالجوال للتركيز على التفاصيل والمشاعر واللحظات التي تستحق الاحتفاظ بها، مع إمكانية تنسيق نوع المحتوى وطريقة التسليم وفق الباقة المختارة. تُحدد مدة التغطية وعدد المقاطع وموعد التسليم قبل الحجز، بما في ذلك أي مدة تسليم خاصة متفق عليها. LUMIR | لومير',
    breadcrumbLabel: 'تصوير المناسبات بالجوال'
  },

  '/services/kids-corner': {
    title: 'ركن الأطفال للمناسبات | أنشطة إبداعية وترفيهية للأطفال',
    description:
      'ركن أطفال في مناسبات مكة وجدة بأنشطة تلوين وطين ورسومات وجه مناسبة للأعمار، مع اتفاق مسبق على التجهيزات والمساحة والمدة من لومير.',
    h1: 'ركن الأطفال للمناسبات | أنشطة إبداعية وترفيهية للأطفال',
    intro:
      'أضيفي إلى مناسبتك ركنًا مخصصًا للأطفال يتيح لهم المشاركة في أنشطة إبداعية وترفيهية مناسبة لأعمارهم، مع مراعاة طبيعة المكان وتصميم الحفل. يمكن تنسيق الأنشطة والأدوات المستخدمة بحسب الباقة المتاحة واحتياجات المناسبة. تساعد هذه الخدمة على توفير تجربة ممتعة للأطفال وإضافة لمسة منظمة إلى الحفل، مع الاتفاق مسبقًا على التجهيزات والمساحة والمدة والتفاصيل المطلوبة. LUMIR | لومير',
    breadcrumbLabel: 'ركن الأطفال والأنشطة'
  },

  '/services/childcare': {
    title: 'مشرفة أطفال للمناسبات | تنظيم ورعاية الأطفال أثناء الزفاف',
    description:
      'مشرفة أطفال من لومير تنظم أنشطة وتتابع الأطفال أثناء حفل الزفاف في مكة وجدة، مع تحديد عدد الأطفال وأعمارهم ومدة الإشراف وحدود الخدمة قبل الحجز.',
    h1: 'مشرفة أطفال للمناسبات | تنظيم ورعاية الأطفال أثناء الزفاف',
    intro:
      'وفّري لأطفال ضيوفك مساحة أكثر تنظيمًا وراحة أثناء حفل الزفاف من خلال خدمة الإشراف على الأطفال من لومير. تشمل الخدمة تنظيم الأنشطة المناسبة لأعمارهم ومتابعتهم وفق نطاق الخدمة المتفق عليه مسبقًا. يتم تحديد عدد الأطفال وأعمارهم ومدة الإشراف واحتياجات المكان قبل الحجز، مع توضيح مسؤوليات المشرفة وحدود الخدمة لضمان توقعات واضحة للعائلات. LUMIR | لومير',
    breadcrumbLabel: 'رعاية الأطفال أثناء المناسبات'
  },

  '/services/phone-supervisor': {
    title: 'مفرزة جوالات للمناسبات | حفظ خصوصية الجوالات في مكة وجدة',
    description:
      'مفرزة جوالات من لومير تنظم حفظ جوالات الضيوف في مناسبات مكة وجدة وفق آلية متفق عليها، لدعم الخصوصية وتقليل استخدام الجوالات أثناء اللحظات المهمة.',
    h1: 'مفرزة جوالات للمناسبات | حفظ خصوصية الجوالات في مكة وجدة',
    intro:
      'خدمة مفرزة الجوالات من لومير مخصصة لتنظيم حفظ جوالات الضيوف أثناء المناسبات، وفق آلية متفق عليها مع أصحاب المناسبة. تساعد الخدمة على دعم الخصوصية وتقليل استخدام الجوالات خلال اللحظات المهمة، مما يمنح العروسين والضيوف فرصة أكبر للاستمتاع بالمناسبة. تُحدد تفاصيل الاستلام والحفظ والتسليم حسب الباقة وطبيعة المناسبة. LUMIR | لومير',
    breadcrumbLabel: 'مفرزة جوالات للمناسبات'
  },

  '/services/wedding-support': {
    title: 'خدمات مساندة وتنظيم الأفراح في مكة وجدة | لومير',
    description:
      'مفرزة جوالات، حارسة كوشة، خدمة عبايات، مرافقة طفل ووصيفة عروس، عاملات ضيافة وقهوة عربية ضمن خدمات الأفراح من لومير في مكة وجدة.',
    h1: 'خدمات مساندة وتنظيم الأفراح في مكة وجدة',
    intro:
      'ينظم لومير فريق مساندة ميداني لمناسبتك في مكة المكرمة وجدة: استقبال الضيوف، حفظ خصوصية الجوالات، ترقيم العبايات، مرافقة الأطفال، وتقديم الضيافة العربية. يُحدَّد نطاق كل خدمة وعدد الكادر ومدة الحضور مسبقًا حسب تفاصيل المناسبة والباقة المعتمدة، لتبقى التفاصيل الميدانية واضحة قبل الحجز. LUMIR | لومير',
    breadcrumbLabel: 'خدمات مساندة الأفراح'
  },

  '/gallery': {
    title: 'معرض أسلوب التصوير والتجهيز | لومير في مكة وجدة',
    description:
      'نماذج من أسلوب لومير في توثيق المناسبات بالجوال وأركان الأطفال وتجهيزات الضيافة في مكة المكرمة وجدة، مع الالتزام بخصوصية العائلات والأطفال.'
  },

  '/about': {
    title: 'من نحن — لومير LUMIR | خدمات مناسبات في مكة وجدة',
    description:
      'لومير علامة سعودية لخدمات المناسبات في مكة المكرمة وجدة: توثيق سينمائي بالجوال، أركان أطفال، مشرفات رعاية، ومساندة أفراح بخصوصية تامة وتسليم خلال ٤٨ ساعة.'
  },

  '/faq': {
    title: 'الأسئلة الشائعة عن خدمات لومير | مكة وجدة',
    description:
      'إجابات عن باقات تصوير المناسبات بالجوال، أنشطة ركن الأطفال، إشراف الأطفال، أسعار خدمات الأفراح، وخطوات تأكيد الحجز مع لومير.'
  },

  '/privacy': {
    title: 'سياسة الخصوصية وحماية بيانات الأطفال | لومير',
    description:
      'التزام لومير بخصوصية المناسبات وحماية بيانات العائلات والأطفال، الحد الأدنى من جمع البيانات، وتنويه إخلاء المسؤولية لخدمات الرعاية.'
  },

  '/terms': {
    title: 'الشروط والأحكام وسياسة الحجز والإلغاء | لومير',
    description:
      'شروط حجز خدمات لومير في مكة وجدة: الأسعار الأولية، آلية التأكيد عبر واتساب، سياسة تعديل التاريخ والإلغاء، والنطاق الجغرافي للخدمة.'
  },

  '/contact': {
    title: 'تواصلي مع لومير | حجز واستفسار لخدمات المناسبات في مكة وجدة',
    description:
      'قنوات التواصل الرسمية مع لومير: واتساب مباشر، بريد إلكتروني، وساعات العمل لتنسيق حجز تصوير المناسبات وخدمات الأطفال في مكة وجدة.'
  },

  '/booking': {
    title: 'طلب حجز مناسبة مع لومير | مكة المكرمة وجدة',
    description:
      'أرسلي طلب حجز لخدمات لومير في مكة أو جدة: اختيار الخدمة والباقة، تحديد التاريخ ومدة المناسبة، وتأكيد الموعد عبر واتساب بعد مراجعة الطلب.'
  },

  '/booking-status': {
    title: 'تتبع حالة طلب الحجز | لومير',
    description: 'الاستعلام عن حالة طلب حجزك لدى لومير عبر رقم الطلب أو رقم الجوال.',
    noindex: true
  },

  '/admin': {
    title: 'لوحة الإدارة | LUMIR | لومير',
    description: 'لوحة الإدارة المركزية لعلامة لومير — صفحة داخلية غير مخصصة للاستعلام العام.',
    noindex: true
  }
};

function trimTo(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim().replace(/[.,،؛]$/, '')}…`;
}

function firstSentences(text: string, max: number): string {
  const sentences = text.split(/(?<=\.)\s+/);
  let out = '';
  for (const s of sentences) {
    if (`${out} ${s}`.trim().length > max) break;
    out = `${out} ${s}`.trim();
  }
  return out || trimTo(text, max);
}

/** Service landing pages are derived from the catalog so titles stay unique per service. */
export function getServiceSeo(service: ServiceItem): SeoMeta {
  const explicit = SEO_RECORDS[`/services/${service.slug}`];
  if (explicit) return explicit;
  return {
    title: `${service.name} — خدمات ${BRAND} في مكة وجدة`,
    description: trimTo(
      `${firstSentences(service.description, 150)} ${service.name} ضمن خدمات المناسبات في مكة المكرمة وجدة.`,
      165
    ),
    h1: `${service.name} في مناسبات مكة وجدة`,
    intro: `${service.description} ${BRAND}`,
    breadcrumbLabel: service.name
  };
}

export function findServiceBySlug(slug: string): ServiceItem | undefined {
  return INITIAL_SERVICES.find((s) => s.slug === slug);
}

export function getSeoMeta(pathInput: string): SeoMeta {
  const path = normalizePath(pathInput);
  const explicit = SEO_RECORDS[path];
  if (explicit) return explicit;

  if (path.startsWith('/services/')) {
    const slug = path.slice('/services/'.length);
    const service = findServiceBySlug(slug);
    if (service) return getServiceSeo(service);
  }

  return {
    title: `الصفحة غير موجودة — ${BRAND}`,
    description: 'الصفحة المطلوبة غير متوفرة في موقع لومير.',
    noindex: true
  };
}

const CITY_MAKKAH = { '@type': 'City', name: 'مكة المكرمة' };
const CITY_JEDDAH = { '@type': 'City', name: 'جدة' };

function baseGraph(): Record<string, any>[] {
  const settings = INITIAL_LUMIR_DATA.settings;
  return [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND,
      alternateName: 'لومير',
      url: `${SITE_URL}/`,
      slogan: settings.slogan,
      description:
        'خدمات تصوير المناسبات بالجوال، أركان الأطفال، مشرفات رعاية الأطفال، ومساندة وتنظيم الأفراح في مكة المكرمة وجدة.',
      email: settings.email,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: `+${settings.whatsappInternational}`,
        contactType: 'customer service',
        areaServed: ['ar-SA'],
        availableLanguage: 'Arabic'
      },
      areaServed: [CITY_MAKKAH, CITY_JEDDAH]
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: BRAND,
      inLanguage: 'ar',
      description: SEO_RECORDS['/'].description,
      publisher: { '@id': `${SITE_URL}/#organization` }
    }
  ];
}

function breadcrumb(path: string, items: { name: string; path: string }[]): Record<string, any> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonicalFor(item.path)
    }))
  };
}

/**
 * JSON-LD for a route. Structured data mirrors only content that is actually
 * rendered on that page: no invented addresses, coordinates, phone numbers,
 * opening hours, ratings or prices.
 */
export function buildJsonLd(pathInput: string): { '@context': string; '@graph': Record<string, any>[] } {
  const path = normalizePath(pathInput);
  const graph = baseGraph();

  if (path === '/products') {
    graph.push({
      '@type': 'ItemList',
      name: 'خدمات لومير للمناسبات في مكة وجدة',
      numberOfItems: INITIAL_SERVICES.length,
      itemListElement: INITIAL_SERVICES.map((service, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: service.name,
        url: canonicalFor(`/services/${service.slug}`)
      }))
    });
  }

  if (path === '/faq') {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: INITIAL_LUMIR_DATA.faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer }
      }))
    });
  }

  if (path.startsWith('/services/')) {
    const slug = path.slice('/services/'.length);
    const service = findServiceBySlug(slug);
    const seo = getSeoMeta(path);
    const categorySlug = slug;

    graph.push(
      breadcrumb(path, [
        { name: 'الرئيسية', path: '/' },
        { name: 'الكتالوج', path: '/products' },
        { name: seo.breadcrumbLabel || seo.title, path }
      ])
    );

    if (service) {
      graph.push({
        '@type': 'Service',
        '@id': `${canonicalFor(path)}#service`,
        name: service.name,
        serviceType: service.name,
        description: seo.description,
        url: canonicalFor(path),
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: [CITY_MAKKAH, CITY_JEDDAH],
        category: service.category
      });
    } else if (['mobile-photography', 'kids-corner', 'childcare', 'wedding-support'].includes(categorySlug)) {
      const categoryLabel = seo.breadcrumbLabel || seo.title;
      graph.push({
        '@type': 'Service',
        '@id': `${canonicalFor(path)}#service`,
        name: categoryLabel,
        serviceType: categoryLabel,
        description: seo.description,
        url: canonicalFor(path),
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: [CITY_MAKKAH, CITY_JEDDAH]
      });
    }
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Every route that should appear in sitemap.xml (indexable pages only). */
export function indexablePaths(): string[] {
  const staticPaths = Object.keys(SEO_RECORDS).filter((p) => !SEO_RECORDS[p].noindex);
  const servicePaths = INITIAL_SERVICES.map((s) => `/services/${s.slug}`);
  return Array.from(new Set([...staticPaths, ...servicePaths])).sort();
}
