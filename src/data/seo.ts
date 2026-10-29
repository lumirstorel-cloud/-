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
    title: 'لومير LOMIR | خدمات الأفراح وساهر في مكة وجدة',
    description:
      'لومير LOMIR لخدمات الأفراح في مكة وجدة: ساهر لمنع التصوير، وصيفات العروس، حارسات الكوشة، العبايات، الضيافة، ركن الأطفال وتصوير الجوال.',
    h1: 'لومير LOMIR | خدمات الأفراح وساهر في مكة وجدة'
  },

  '/products': {
    title: 'خدمات المناسبات في مكة وجدة | لومير LOMIR',
    description:
      'استعرضي باقات لومير لمناسبات مكة وجدة: خدمة ساهر ومفتشات الجوالات، وصيفات العروس، حراسة الكوشة، العبايات، الضيافة، وركن الأطفال وتصوير الجوال بأسعار مباشرة.',
    h1: 'خدمات المناسبات في مكة وجدة | باقات لومير المتكاملة',
    breadcrumbLabel: 'الخدمات'
  },

  '/services/saher': {
    title: 'خدمة ساهر للأفراح في مكة وجدة | تنظيم ومنع التصوير من لومير',
    description:
      'خدمة ساهر لمنع التصوير وسحب الجوالات في أفراح مكة وجدة، كادر نسائي حازم ومؤهل لحفظ خصوصية قاعة الزفاف وفق اشتراطات أهل الحفل من لومير.',
    h1: 'خدمة ساهر للأفراح في مكة وجدة | تنظيم وسحب الجوالات ومنع التصوير',
    intro:
      'خدمة ساهر من لومير توفر أعلى درجات الانضباط والراحة لليلة العمر في قاعات مكة المكرمة وجدة. يتولى فريق نسائي مدرب تنظيم بوابات الدخول، تطبيق سياسة منع التصوير، وتوفير أظرف وملصقات حجب الكاميرا لضمان خصوصية العروس والمعازيم طوال ساعات الفرح.',
    breadcrumbLabel: 'خدمة ساهر لمنع التصوير'
  },

  '/services/phone-supervisor': {
    title: 'مفتشة جوالات في مكة وجدة | تنظيم بوابات وحفظ الخصوصية لومير',
    description:
      'حجز مفتشة جوالات محترفة لأفراح مكة وجدة: فحص وتأمين الهواتف، توزيع أظرف الخصوصية، ومنع التصوير العشوائي بحزم ولباقة من لومير.',
    h1: 'مفتشات جوالات للأفراح في مكة وجدة | حفظ خصوصية الحفل',
    intro:
      'مفتشات جوالات سعوديات يتمتعن باللباقة واليقظة العالية لاستقبال ضيفاتك عند مداخل الصالة، وتطبيق تعليمات الخصوصية وحجب كاميرات الجوالات بكل رقي وهدوء، لمنح العروس وأسرتها راحة بال تامة طوال الحفل.',
    breadcrumbLabel: 'مفتشة جوالات للأفراح'
  },

  '/services/bridal-escort': {
    title: 'وصيفة عروسة في مكة وجدة | مرافقة وتنسيق فستان وزفة العروس لومير',
    description:
      'حجز وصيفة عروسة ومرافقة ميدانية في مكة وجدة: ترتيب الفستان، مسك الطرحة، حقيبة طوارئ متكاملة، ومساندة العروس وأهلها لحظة بلحظة مع لومير.',
    h1: 'وصيفة عروسة ومرافقة أهل العروس في مكة وجدة',
    intro:
      'المساعد الأيمن لعروس مكة وجدة طوال ليلة الزفاف؛ ترافقك وصيفة لومير خطوة بخطوة لتعديل الفستان والطرحة أثناء جلسة التصوير، وتنسيق موعد الزفة مع مسؤولة الصوت، وتوفير حقيبة طوارئ متكاملة تجعلك مطمئنة وأنيقة دائماً.',
    breadcrumbLabel: 'وصيفة العروس'
  },

  '/services/kosha-guard': {
    title: 'حارسة كوشة للأفراح في جدة ومكة | تنظيم مساحة العروس من لومير',
    description:
      'حارسة كوشة متخصصة لأفراح جدة ومكة لمنع الازدحام العشوائي وتنظيم تهنئة العروس وتصوير المعازيم بهدوء ورقي من لومير.',
    h1: 'حارسة كوشة وقاعة الأفراح في جدة ومكة المكرمة',
    intro:
      'توفر حارسة الكوشة من لومير أجواءً هادئة ومنظمة حول منصة العروس؛ حيث تنظم صعود المهنئات والتقاط الصور التذكارية وتمنع التدافع العشوائي، مما يضمن للعروس الاستمتاع بلحظات الكوشة والزفة بأعلى مستويات الخصوصية والراحة.',
    breadcrumbLabel: 'حارسة الكوشة'
  },

  '/services/abaya-service': {
    title: 'خدمة عبايات للزواجات في مكة وجدة | ترقيم واستلام آمن من لومير',
    description:
      'خدمة تنظيم وترقيم العبايات في أفراح مكة وجدة، كادر نسائي أمين وبطاقات مرقمة أنيقة لمنع الفقد وتسهيل خروج الضيفات بكل انسيابية.',
    h1: 'خدمة العبايات وترقيم المعاطف للزواجات في مكة وجدة',
    intro:
      'خدمة تنظيم جناح العبايات من لومير تمنح ضيفاتك تجربة استقبال استثنائية مع بطاقات ترقيم راقية وآلية تسليم سريعة تحافظ على مقتنياتهن وتمنع أي ازدحام عند المغادرة.',
    breadcrumbLabel: 'خدمة العبايات'
  },

  '/services/hospitality-servers': {
    title: 'قهوجية ومباشرات أفراح في مكة وجدة | عاملات ضيافة لومير',
    description:
      'عاملات ومباشرات أفراح في مكة وجدة: زي موحد فاخر، تقديم القهوة والعصائر والمقبلات بلباقة وأسلوب ضيافة سعودي أصيل مع لومير.',
    h1: 'مباشرات وعاملات ضيافة للأفراح في مكة وجدة',
    intro:
      'فريق نسائي متكامل ومدرب على أصول الضيافة السعودية الملكية في قاعات وقصور أفراح مكة وجدة؛ توزيع المشروبات الساخنة والباردة وخدمة الطاولات بأناقة ونظافة تامة.',
    breadcrumbLabel: 'عاملات ومباشرات الضيافة'
  },

  '/services/hospitality-coffee': {
    title: 'قهوة ضيافة عربية للأفراح في مكة وجدة | دلال ذهبية وتمر فاخر لومير',
    description:
      'ركن قهوة سعودية فاخرة بالهيل والزعفران مع دلال ذهبية وفناجيل كريستال وتمر سكري للمناسبات والأفراح في مكة وجدة من لومير.',
    h1: 'ركن قهوة الضيافة العربية الفاخرة للأفراح في مكة وجدة',
    intro:
      'ضيافة سعودية أصيلة تليق بمقام ضيوفك؛ دلال وترامس ذهبية فخمة، قهوة شقراء ممتازة مع الزعفران، شاي بأنواعه، وتمر سكري فاخر يقدم بأرقى معايير الفخامة.',
    breadcrumbLabel: 'قهوة الضيافة العربية'
  },

  '/services/kids-corner': {
    title: 'ركن أطفال للزواجات في مكة وجدة | أنشطة إبداعية وترفيهية لومير',
    description:
      'ركن أطفال راقٍ في مناسبات مكة وجدة: رسم، تلوين، صلصال آمن، ورسومات وجه تحت إشراف متخصص لضمان هدوء الحفل وابتسامة الصغار.',
    h1: 'ركن أطفال للزواجات والأنشطة الترفيهية في مكة وجدة',
    intro:
      'ركن مخصص ومرتب بأناقة داخل القاعة، يضم أنشطة رسم وتلوين ولعب بالطين الآمن ومسابقات هادئة بإشراف مشرفات سعوديات مؤهلات، مما يتيح للأمهات الاستمتاع بالحفل بينما يقضي الأطفال وقتاً آمناً وممتعاً.',
    breadcrumbLabel: 'ركن أطفال للزواجات'
  },

  '/services/childcare': {
    title: 'مشرفة أطفال للمناسبات في مكة وجدة | رعاية وتنظيم داخل القاعة لومير',
    description:
      'حجز مشرفات أطفال مؤهلات لحفلات الزفاف في مكة وجدة: أساور أمان مرمزة، ألعاب جماعية، ومتابعة الأطفال طوال ساعات المناسبة من لومير.',
    h1: 'مشرفة أطفال للمناسبات والزواجات في مكة وجدة',
    intro:
      'خدمة إشراف ورعاية ترفيهية مساندة للأطفال أثناء ساعات الفرح بنظام أساور الأمان المرمزة لمنع خروج الصغار لصالة الزفة وضمان سكينة الحفل واطمئنان العائلات.',
    breadcrumbLabel: 'مشرفة أطفال للمناسبات'
  },

  '/services/child-escort': {
    title: 'مرافقة طفل شخصية في الأفراح | رعاية خاصة لأبناء العروسين لومير',
    description:
      'مرافقة شخصية متفرغة لطفل العروس أو الأخت أثناء زفاف مكة وجدة، اهتمام بالملابس والوجبات والسلامة طوال ساعات المناسبة من لومير.',
    h1: 'مرافقة شخصية للأطفال في مناسبات مكة وجدة',
    intro:
      'مشرفة مكرسة لمرافقة طفل العروس أو الأطفال المقربين طوال مدة الحفل، لتلبية احتياجاتهم ومرافقتهم بلطف وحنان أثناء لحظات الدخول والتصوير.',
    breadcrumbLabel: 'مرافقة الطفل'
  },

  '/services/mobile-photography': {
    title: 'مصورة جوال في مكة وجدة | تصوير مناسبات وتوثيق زفاف سينمائي لومير',
    description:
      'مصورة جوال محترفة في مكة وجدة: لقطات عفوية ومقاطع ريلز سينمائية بدقة 4K، تغطية تفاصيل الكوشة والقاعة مع تسليم خلال 48 ساعة بخصوصية تامة.',
    h1: 'تصوير مناسبات بالجوال ومقاطع ريلز سينمائية في مكة وجدة',
    intro:
      'توثيق عصري فاخر لأجمل لحظات ليلة العمر بعدسة أحدث الهواتف الذكية مع مثبتات احترافية؛ مونتاج ريلز جاهز للنشر الفوري ولقطات عفوية ناعمة تحافظ على مشاعر اللحظة وتسليم سريع خلال 48 ساعة.',
    breadcrumbLabel: 'تصوير المناسبات بالجوال'
  },

  '/services/wedding-support': {
    title: 'تنظيم أفراح مكة وجدة وخدمات نسائية للمناسبات | باقات لومير',
    description:
      'باقات تنظيم أفراح متكاملة في مكة وجدة: ساهر، مفتشات جوالات، وصيفة عروس، حارسة كوشة، عبايات وضيافة بأسعار منافسة وجودة عالية.',
    h1: 'تنظيم أفراح مكة وجدة وباقات الخدمات النسائية المساندة',
    intro:
      'فريق نسائي مساند ومتكامل يدير تفاصيل مناسبتك باحترافية: من استقبال الضيوف وحفظ الجوالات وترقيم العبايات إلى حراسة الكوشة وخدمات الضيافة وركن الأطفال.',
    breadcrumbLabel: 'خدمات مساندة وتنظيم الأفراح'
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
  if (slug === 'saher') {
    return INITIAL_SERVICES.find((s) => s.slug === 'phone-supervisor');
  }
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
