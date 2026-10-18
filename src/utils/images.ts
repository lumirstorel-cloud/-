/**
 * Helpers for the optimized image set published under /images.
 * Source files live in src/assets/images; `scripts/optimize-images.ts` regenerates
 * the /images/*.webp + /images/*.jpg pairs (1440px and 768px wide).
 */

const SIZE_SUFFIX = /^(.*)-1440\.(jpe?g|png)$/;

/** WebP counterpart of a bundled /images/*.jpg URL (undefined for other URLs). */
export function webpSrc(url?: string): string | undefined {
  if (!url) return undefined;
  const match = SIZE_SUFFIX.exec(url);
  if (!match) return undefined;
  return `${match[1]}-1440.webp`;
}

/** Responsive srcSet (1440w + 768w) when both variants exist for this URL. */
export function responsiveSrcSet(url?: string): string | undefined {
  if (!url) return undefined;
  const match = SIZE_SUFFIX.exec(url);
  if (!match) return undefined;
  const base = match[1];
  const ext = match[2].endsWith('png') ? 'png' : 'jpg';
  return `${base}-768.${ext} 768w, ${base}-1440.${ext} 1440w`;
}

export function responsiveWebPSrcSet(url?: string): string | undefined {
  if (!url) return undefined;
  const match = SIZE_SUFFIX.exec(url);
  if (!match) return undefined;
  const base = match[1];
  return `${base}-768.webp 768w, ${base}-1440.webp 1440w`;
}

/** Alt text for gallery/portfolio media, keyed by the actual photo content. */
const FILE_ALT: Record<string, string> = {
  'lumir_hero-1440.jpg': 'قاعة زفاف مجهزة بإضاءة دافئة وطاولات ضيافة وضيوف في مناسبة نسائية',
  'lumir_mobile_photo-1440.jpg':
    'تصوير تفاصيل تجهيزات حفل زفاف بهاتف جوال مثبت على مثبت حركة احترافي',
  'lumir_kids_corner-1440.jpg':
    'ركن أنشطة إبداعية للأطفال داخل المناسبة مع خيمة وطاولات تلوين ورسومات وجه',
  'lumir_childcare-1440.jpg':
    'مشرفة تتابع لعب الأطفال في ركن مخصص بكتب وألعاب آمنة أثناء مناسبة زفاف',
  'lumir_wedding_support-1440.jpg':
    'طاولة استقبال ضيفات بلافتة ترحيب ودلة قهوة وركن ترقيم العبايات في المناسبة'
};

/** Alt derived from the media file itself, falling back to the item title. */
export function altForMediaUrl(url: string, fallback: string): string {
  const fileName = url.split('/').pop() || '';
  const normalized = SIZE_SUFFIX.exec(fileName);
  const key = normalized ? `${normalized[1]}-1440.${normalized[2]}` : fileName;
  return FILE_ALT[key] || FILE_ALT[fileName] || fallback;
}
