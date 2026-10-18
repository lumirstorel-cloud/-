import React, { useState } from 'react';
import { FAQItem, PageView, SiteSettings } from '../types';
import { buildWhatsAppLink } from '../utils/formatters';
import {
  FileText,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  Sparkles
} from 'lucide-react';

export const AboutView: React.FC<{
  settings: SiteSettings;
  navigate: (v: PageView) => void;
}> = ({ settings, navigate }) => (
  <div className="max-w-[960px] mx-auto px-6 py-14 space-y-12">
    <div className="space-y-4">
      <div className="text-xs text-[#8C6D36]">من نحن · LUMIR | {settings.brandNameAr}</div>
      <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#2C1E18]">
        «{settings.slogan}»
      </h1>
      <p className="text-base text-[#5C4940] leading-relaxed">
        انطلقت علامة لومير (LUMIR) لتقديم تجربة ضيافة استثنائية في مناسبات مكة المكرمة وجدة. نجمع
        بين التوثيق السينمائي العفوي بالجوال مع تسليم سريع خلال ٤٨ ساعة، وتجهيز أركان أطفال راقية
        بألوان الباستيل الهادئة وخامات فنية آمنة، وتوفير مشرفات رعاية مؤهلات، وخدمات مساندة ميدانية
        شاملة تتيح لأهل الحفل التفرغ لفرحتهم.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#5C4940] leading-relaxed">
      <div className="p-7 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-2.5">
        <strong className="block text-base font-bold text-[#2C1E18]">
          المدن المخدومة حصرياً:
        </strong>
        <p>
          نقدم خدماتنا حصرياً داخل مدينتي <strong>مكة المكرمة وجدة</strong> في المملكة العربية
          السعودية، بما يشمل الفنادق، قاعات الأفراح، والاستراحات والمنازل الخاصة.
        </p>
      </div>

      <div className="p-7 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] space-y-2.5">
        <strong className="block text-base font-bold text-[#2C1E18]">
          ميثاق الخصوصية والأمان:
        </strong>
        <p>{settings.privacyPledge}</p>
      </div>
    </div>

    <div className="p-8 rounded-2xl bg-[#231712] text-[#FAF6F0] flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="space-y-1">
        <h3 className="font-display text-2xl font-bold">هل ترغبين في حجز مناسبتكِ القادمة؟</h3>
        <p className="text-xs text-[#C7B8A8]">
          اطلعي على الكتالوج الكامل والأسعار الأولية لكل خدمة.
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate('catalog')}
        className="px-6 py-3 text-xs font-medium bg-[#C8A96E] text-[#231712] rounded-lg hover:bg-[#D5B982] cursor-pointer"
      >
        استعراض الكتالوج
      </button>
    </div>
  </div>
);

export const FaqView: React.FC<{ settings: SiteSettings; faqs?: FAQItem[] }> = ({
  settings,
  faqs: dynamicFaqs
}) => {
  const defaultFaqs = [
    {
      q: 'ما هي باقات وأسعار تصوير المناسبات بالجوال ومدة التسليم؟',
      a: 'تبدأ باقات تصوير الجوال من ٣٥٠ ر.س (٣ ساعات)، ٤٠٠ ر.س (٤ ساعات)، ٥٠٠ ر.س (٥ ساعات)، ٦٠٠ ر.س (٦ ساعات)، و٧٠٠ ر.س (٧ ساعات). مدة التسليم المبدئية هي ٤٨ ساعة فقط عبر رابط سحابي خاص أو تسليم فوري في نفس الليلة بالقاعة عبر AirDrop.'
    },
    {
      q: 'ما هي الأنشطة المتوفرة في ركن الأطفال وما المساحة المطلوبة؟',
      a: 'يشمل الركن: الرسم والتلوين على الأوراق، اللعب بالطين، رسومات الوجه اللطيفة، ونقش الحناء الاختياري عند توفر مقدمة الخدمة وموافقة الأم. يتطلب الركن مساحة ٣×٣ أو ٤×٣ متر داخل الصالة أو جناح الأطفال.'
    },
    {
      q: 'هل خدمة رعاية الأطفال تعتبر حضانة مرخصة؟',
      a: 'تنويه هام: الخدمة هي إشراف ورعاية ترفيهية مساندة للأطفال أثناء مدة المناسبة فقط لراحة الأمهات وحفظ هدوء الصالة، وليست حضانة مرخصة أو رعاية طبية. نلتزم بنظام أساور الأمان المرمزة للاستلام والتسليم.'
    },
    {
      q: 'ما هي خدمات مساندة الأفراح المتوفرة وأسعارها؟',
      a: 'نوفر: مشرفة جوالات (٤٠٠ ر.س)، حارسة الكوشة (٢٥٠ ر.س)، خدمة العبايات (٢٥٠ ر.س)، مرافقة الطفل (٢٥٠ ر.س)، وصيفة العروس ومرافقة أهلها (٣٥٠ ر.س)، عاملات المباشرة (٢٠٠ ر.س لكل عاملة)، وقهوة الضيافة العربية (٣٠٠ ر.س). وتعتبر هذه الأسعار أولية قابلة للتعديل بحسب تفاصيل المناسبة وساعات الحضور.'
    },
    {
      q: 'كيف يتم تأكيد الحجز بعد إرسال الطلب في الموقع؟',
      a: 'يحصل طلبكِ فور إرساله على رقم مرجعي (مثل LMR-2610-101) وتكون حالته «بانتظار المراجعة». يقوم فريقنا بالتأكد من عدم وجود تعارض بالمواعيد والتواصل معكِ مباشرة عبر واتساب لاعتماد الموعد النهائي.'
    }
  ];

  const itemsToDisplay =
    dynamicFaqs && dynamicFaqs.length > 0
      ? dynamicFaqs.map((f) => ({ q: f.question, a: f.answer, cat: f.category }))
      : defaultFaqs;

  return (
    <div className="max-w-[920px] mx-auto px-6 py-14 space-y-10">
      <div className="space-y-3">
        <div className="text-xs text-[#8C6D36]">الأسئلة الشائعة · LUMIR</div>
        <h1 className="font-display text-4xl font-bold text-[#2C1E18]">
          كل ما تودين معرفته حول خدمات لومير
        </h1>
        <p className="text-sm text-[#5C4940]">
          إجابات واضحة حول باقات التصوير، ركن الأطفال، مشرفات الرعاية، وضوابط تأكيد الحجوزات.
        </p>
      </div>

      <div className="space-y-4">
        {itemsToDisplay.map((f, i) => (
          <div key={i} className="p-6 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-2">
            <h2 className="font-display text-lg font-bold text-[#2C1E18]">{f.q}</h2>
            <p className="text-xs sm:text-sm text-[#5C4940] leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl bg-[#F3ECE1] border border-[#E6DCD2] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#5C4940]">
          لديكِ سؤال إضافي حول مناسبتكِ؟ تواصلي معنا مباشرة عبر واتساب:
        </div>
        <a
          href={buildWhatsAppLink(settings.whatsappLocal)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 text-xs font-medium bg-[#1F5E3B] text-[#FAF6F0] rounded-lg whitespace-nowrap"
        >
          محادثة واتساب
        </a>
      </div>
    </div>
  );
};

export const PrivacyView: React.FC<{ settings: SiteSettings }> = ({ settings }) => (
  <div className="max-w-[880px] mx-auto px-6 py-14 space-y-8">
    <div className="space-y-2">
      <div className="text-xs text-[#8C6D36]">الخصوصية والأمان · LUMIR</div>
      <h1 className="font-display text-4xl font-bold text-[#2C1E18]">
        سياسة الخصوصية وحماية بيانات الأطفال والعائلات
      </h1>
    </div>

    <div className="p-8 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 text-xs sm:text-sm text-[#4A3A32] leading-relaxed">
      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-[#2C1E18]">
          ١. حماية خصوصية المناسبات والصور
        </h2>
        <p>
          تلتزم علامة لومير بخصوصية العائلات والحفلات النسائية التزاماً تاماً. لا يتم تصوير أي طفل
          أو نشر أي صورة أو مقطع في حساباتنا أو معرضنا إلا بموافقة خطية واضحة ومسبقة من صاحب
          المناسبة.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-[#2C1E18]">
          ٢. الحد الأدنى من جمع البيانات
        </h2>
        <p>
          نجمع فقط البيانات الضرورية للتنسيق الميداني (الاسم، رقم الجوال للتواصل عبر واتساب، المدينة
          والحي، وتاريخ ووقت المناسبة). ولا نقوم بمشاركة أي بيانات مع أطراف ثالثة.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-[#2C1E18]">
          ٣. إخلاء مسؤولية خدمات الرعاية
        </h2>
        <p>{settings.childcareDisclaimer}</p>
      </section>
    </div>
  </div>
);

export const TermsView: React.FC<{ settings: SiteSettings }> = ({ settings }) => (
  <div className="max-w-[880px] mx-auto px-6 py-14 space-y-8">
    <div className="space-y-2">
      <div className="text-xs text-[#8C6D36]">اللوائح التنظيمية · LUMIR</div>
      <h1 className="font-display text-4xl font-bold text-[#2C1E18]">
        الشروط والأحكام وسياسة التأكيد والإلغاء
      </h1>
    </div>

    <div className="p-8 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-6 text-xs sm:text-sm text-[#4A3A32] leading-relaxed">
      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-[#2C1E18]">١. النطاق الجغرافي</h2>
        <p>
          تُقدّم جميع خدمات لومير حصرياً داخل مدينتي <strong>مكة المكرمة وجدة</strong> بالمملكة
          العربية السعودية.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-[#2C1E18]">
          ٢. طبيعة الأسعار وتأكيد الحجز
        </h2>
        <p>
          الأسعار المعروضة في الكتالوج هي أسعار أولية تعتمد على تفاصيل المناسبة وساعات العمل، وتظهر
          عبارة «السعر النهائي بعد مراجعة تفاصيل المناسبة» عند الحاجة. إرسال الطلب يضعه في حالة
          «بانتظار المراجعة» ولا يُعد نهائياً إلا بعد تواصل الإدارة عبر واتساب.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-bold text-[#2C1E18]">
          ٣. سياسة التعديل والإلغاء
        </h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>يمكن تعديل تاريخ المناسبة مجاناً لمرة واحدة قبل الموعد بـ ٧ أيام على الأقل.</li>
          <li>
            في حال الإلغاء قبل الموعد بـ ١٠ أيام أو أكثر، يُحفظ المبلغ كرصيد صالح لمدة ٦ أشهر.
          </li>
          <li>الساعات الإضافية تُحتسب بالاتفاق المسبق مع العميلة.</li>
        </ul>
      </section>
    </div>
  </div>
);

export const ContactView: React.FC<{ settings: SiteSettings }> = ({ settings }) => {
  const [name, setName] = useState('');
  const [serviceOfInterest, setServiceOfInterest] = useState('تصوير المناسبات بالجوال');
  const [city, setCity] = useState('مكة المكرمة');
  const [note, setNote] = useState('');

  const handleSendWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      'مرحباً فريق لومير (LUMIR)،',
      name ? `الاسم: ${name}` : '',
      `الخدمة المطلوبة: ${serviceOfInterest}`,
      `المدينة: ${city}`,
      note ? `الاستفسار: ${note}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const url = buildWhatsAppLink(settings.whatsappLocal, text);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-[1140px] mx-auto px-6 py-14 space-y-12">
      <div className="space-y-3 max-w-2xl">
        <div className="text-xs text-[#8C6D36]">تواصلي معنا · مكة المكرمة وجدة</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#2C1E18]">
          نسعد بالتواصل معكِ وتنسيق تفاصيل ليلتكِ
        </h1>
        <p className="text-sm text-[#5C4940] leading-relaxed">
          فريق لومير متاح للرد المباشر عبر واتساب ومساعدتكِ في تحديد الباقة المناسبة لاحتياجكِ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 p-7 rounded-2xl bg-[#F3ECE1] border border-[#D8CBB8] space-y-5">
          <h2 className="font-display text-2xl font-bold text-[#2C1E18]">قنوات التواصل الرسمية</h2>
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2]">
              <div className="text-[#645249]">رقم واتساب التجاري المباشر:</div>
              <div className="font-mono-num font-bold text-base text-[#2C1E18] mt-0.5" dir="ltr">
                {settings.whatsappLocal}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2]">
              <div className="text-[#645249]">البريد الإلكتروني:</div>
              <div className="font-mono-num font-bold text-sm text-[#2C1E18] mt-0.5">
                {settings.email}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#E6DCD2]">
              <div className="text-[#645249]">ساعات العمل:</div>
              <div className="font-bold text-sm text-[#2C1E18] mt-0.5">{settings.workingHours}</div>
            </div>
          </div>
          <a
            href={buildWhatsAppLink(settings.whatsappLocal)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-[#1F5E3B] text-[#FAF6F0] rounded-xl text-xs font-medium flex items-center justify-center gap-2 hover:bg-[#18492E]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>فتح محادثة واتساب الآن</span>
          </a>
        </div>

        <form
          onSubmit={handleSendWhatsApp}
          className="lg:col-span-7 p-8 rounded-2xl bg-[#FAF6F0] border border-[#E6DCD2] space-y-4"
        >
          <h2 className="font-display text-2xl font-bold text-[#2C1E18]">
            إرسال استفسار عبر واتساب
          </h2>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2C1E18]">الاسم الكريم</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اكتبي اسمكِ"
              className="w-full px-4 py-2.5 text-sm bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2C1E18]">الخدمة المستفسر عنها</label>
              <select
                value={serviceOfInterest}
                onChange={(e) => setServiceOfInterest(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
              >
                <option value="تصوير المناسبات بالجوال">تصوير المناسبات بالجوال</option>
                <option value="ركن الأطفال والأنشطة">ركن الأطفال والأنشطة</option>
                <option value="مشرفات رعاية الأطفال">مشرفات رعاية الأطفال</option>
                <option value="خدمات مساندة الأفراح">خدمات مساندة الأفراح</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2C1E18]">المدينة</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
              >
                <option value="مكة المكرمة">مكة المكرمة</option>
                <option value="جدة">جدة</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#2C1E18]">تفاصيل الاستفسار</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اكتبي أي استفسار أو تاريخ مقترح..."
              className="w-full px-4 py-2.5 text-sm bg-[#FAF6F0] border border-[#D8CBB8] rounded-xl"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-[#2C1E18] text-[#FAF6F0] text-xs font-medium rounded-xl hover:bg-[#422E25] cursor-pointer"
          >
            تجهيز الرسالة وفتح واتساب
          </button>
        </form>
      </div>
    </div>
  );
};
