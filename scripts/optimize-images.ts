/**
 * Generates the published image set in public/images:
 *   - <name>-1440.webp / .jpg  (desktop)
 *   - <name>-768.webp  / .jpg  (mobile)
 *   - lumir-og-1200x630.jpg    (Open Graph share image)
 *   - favicon-48.png / favicon-180.png
 *
 * Run: npx tsx scripts/optimize-images.ts
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src', 'assets', 'images');
const OUT_DIR = path.join(ROOT, 'public', 'images');

const SOURCES: { file: string; out: string }[] = [
  { file: 'lumir_hero_1792039742181.jpg', out: 'lumir-hero' },
  { file: 'lumir_mobile_photo_1792039742936.jpg', out: 'lumir-mobile-photo' },
  { file: 'lumir_kids_corner_1792039743563.jpg', out: 'lumir-kids-corner' },
  { file: 'lumir_childcare_1792039744226.jpg', out: 'lumir-childcare' },
  { file: 'lumir_wedding_support_1792039744775.jpg', out: 'lumir-wedding-support' }
];

const WIDTHS = [1440, 768];

/** Wordmark favicon drawn as geometry so it renders without font dependencies. */
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#231712"/>
  <path d="M186 108 h74 v214 h112 v72 H186 z" fill="#C8A96E"/>
  <rect x="186" y="416" width="186" height="10" rx="5" fill="#C8A96E" opacity="0.75"/>
</svg>`;

function fmt(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let before = 0;
  let after = 0;

  for (const { file, out } of SOURCES) {
    const src = path.join(SRC_DIR, file);
    if (!fs.existsSync(src)) {
      console.warn(`skip (missing): ${file}`);
      continue;
    }
    before += fs.statSync(src).size;

    for (const width of WIDTHS) {
      const base = path.join(OUT_DIR, `${out}-${width}`);

      const webpPath = `${base}.webp`;
      await sharp(src)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 72, effort: 6 })
        .toFile(webpPath);

      const jpgPath = `${base}.jpg`;
      await sharp(src)
        .resize({ width, withoutEnlargement: true })
        .jpeg({ quality: 78, mozjpeg: true, progressive: true })
        .toFile(jpgPath);

      after += fs.statSync(webpPath).size + fs.statSync(jpgPath).size;
      console.log(
        `${path.basename(webpPath)} ${fmt(fs.statSync(webpPath).size)} · ${path.basename(
          jpgPath
        )} ${fmt(fs.statSync(jpgPath).size)}`
      );
    }
  }

  // Open Graph share image (1200x630)
  const hero = path.join(SRC_DIR, SOURCES[0].file);
  if (fs.existsSync(hero)) {
    const ogPath = path.join(OUT_DIR, 'lumir-og-1200x630.jpg');
    await sharp(hero)
      .resize(1200, 630, { fit: 'cover', position: 'attention' })
      .jpeg({ quality: 80, mozjpeg: true, progressive: true })
      .toFile(ogPath);
    after += fs.statSync(ogPath).size;
    console.log(`lumir-og-1200x630.jpg ${fmt(fs.statSync(ogPath).size)}`);
  }

  // Icons
  const favicon = await sharp(Buffer.from(FAVICON_SVG)).png().toBuffer();
  for (const size of [48, 180]) {
    const outPath = path.join(OUT_DIR, `favicon-${size}.png`);
    await sharp(favicon).resize(size, size).png({ compressionLevel: 9 }).toFile(outPath);
    after += fs.statSync(outPath).size;
    console.log(`favicon-${size}.png ${fmt(fs.statSync(outPath).size)}`);
  }

  console.log(`\nSource photos: ${fmt(before)} → published set: ${fmt(after)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
