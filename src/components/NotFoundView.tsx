import React from 'react';
import { PageView } from '../types';
import { pathForView } from '../utils/routes';
import { ArrowLeft, Home } from 'lucide-react';

export const NotFoundView: React.FC<{
  navigate: (view: PageView, slug?: string) => void;
}> = ({ navigate }) => {
  const go =
    (view: PageView, slug?: string) =>
    (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(view, slug);
    };

  return (
    <div className="max-w-[880px] mx-auto px-6 py-24 text-center space-y-6">
      <div className="text-xs text-[#8C6D36] font-bold">LUMIR | لومير · 404</div>
      <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#2C1E18]">
        الصفحة غير موجودة
      </h1>
      <p className="text-sm text-[#5C4940] leading-relaxed max-w-xl mx-auto">
        ربما تغيّر الرابط أو حُذفت الصفحة. يمكنكِ العودة إلى الرئيسية أو استعراض جميع خدمات لومير
        لمناسبات مكة المكرمة وجدة.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={pathForView('home')}
          onClick={go('home')}
          className="px-6 py-3 text-xs font-bold bg-[#2C1E18] text-[#FAF6F0] rounded-xl hover:bg-[#422E25] inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          الرئيسية
        </a>
        <a
          href={pathForView('catalog')}
          onClick={go('catalog')}
          className="px-6 py-3 text-xs font-bold border border-[#8C6D36] text-[#8C6D36] rounded-xl hover:bg-[#FAF6F0] inline-flex items-center gap-2"
        >
          الخدمات والباقات
          <ArrowLeft className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};

export default NotFoundView;
