import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  isDemo?: boolean;
  demoCaption?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = 'relative overflow-hidden bg-[#F3ECE1]',
  isDemo = false,
  demoCaption = 'صورة توضيحية تجريبية — قابلة للتحديث بأعمال لومير الأصلية'
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={containerClassName}>
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={className}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#F3ECE1] via-[#FAF6F0] to-[#E8DEC8] text-[#645249]">
          <Sparkles className="w-7 h-7 text-[#A8874A] mb-2 opacity-80" />
          <p className="font-display text-base text-[#2C1E18]">{alt}</p>
          <p className="text-xs text-[#645249] mt-1">LUMIR | لومير — مكة المكرمة وجدة</p>
        </div>
      )}
      {isDemo && (
        <div className="bg-[#FAF6F0]/95 border-t border-[#E6DCD2] px-3 py-1.5 text-[11px] text-[#645249] flex items-center justify-between">
          <span>{demoCaption}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#8C6D36]">نموذج تصميمي</span>
        </div>
      )}
    </div>
  );
};
