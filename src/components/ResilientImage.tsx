import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { responsiveSrcSet, responsiveWebPSrcSet, webpSrc } from '../utils/images';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Renders the optimized /images asset as <picture> (WebP + responsive 768/1440
 * variants) with a graceful text fallback if the file cannot be loaded.
 */
export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative overflow-hidden bg-[#F3ECE1]',
  loading = 'lazy'
}) => {
  const [hasError, setHasError] = useState(false);

  const webp = webpSrc(src);
  const srcSet = responsiveSrcSet(src);
  const webpSrcSet = responsiveWebPSrcSet(src);
  const sizes = '(max-width: 768px) 100vw, 1440px';

  return (
    <div className={containerClassName}>
      {!hasError && src ? (
        <picture className="block w-full h-full">
          {webp && <source type="image/webp" srcSet={webpSrcSet || webp} sizes={webpSrcSet ? sizes : undefined} />}
          {srcSet && <source srcSet={srcSet} sizes={sizes} />}
          <img
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setHasError(true)}
            className={className}
            loading={loading}
            decoding="async"
          />
        </picture>
      ) : (
        <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F3ECE1] via-[#FAF6F0] to-[#E8DEC8] text-[#645249]">
          <ImageIcon className="w-7 h-7 text-[#A8874A] mb-2 opacity-80" aria-hidden="true" />
          <p className="font-display text-base text-[#2C1E18]">{alt}</p>
          <p className="text-xs text-[#645249] mt-1">LUMIR | لومير — مكة المكرمة وجدة</p>
        </div>
      )}
    </div>
  );
};
