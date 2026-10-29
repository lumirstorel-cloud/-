import { LumirCentralData, ServiceItem } from '../types';
import { INITIAL_CUSTOMER_REVIEWS } from './seedReviews';

export const HERO_IMAGE = '/images/lumir-hero-1440.jpg';
export const MOBILE_PHOTO_IMAGE = '/images/lumir-mobile-photo-1440.jpg';
export const KIDS_CORNER_IMAGE = '/images/lumir-kids-corner-1440.jpg';
export const CHILDCARE_IMAGE = '/images/lumir-childcare-1440.jpg';
export const WEDDING_SUPPORT_IMAGE = '/images/lumir-wedding-support-1440.jpg';

export const INITIAL_SERVICES: ServiceItem[] = [
  // 1. تصوير المناسبات بالجوال
  {
    id: 'srv-mobile-photo',
    category: 'mobile_photography',
    slug: 'mobile-photography',
    name: 'تصوير المناسبات بالجوال',
    tagline: 'توثيق سينمائي فوري لأدق التفاصيل بعدسة جوال رائدة ومثبت احترافي',
    description:
      'تغطية خاصة لحفلات الزفاف والمناسبات الخاصة بأحدث أجهزة iPhone Pro مع عدسات احترافية ومثبتات حركة DJI. توثيق تفاصيل القاعة، الكوشة، الضيافة، واللحظات العفوية مع تسليم مباشر ومونتاج ريلز مميز.',
    pricingModel: 'per_hour',
    basePrice: 350,
    hourlyRateSar: 100,
    isHourlyEnabled: true,
    minHours: 3,
    maxHours: 10,
    defaultHours: 4,
    fixedFeeSar: 0,
    deliveryTimeframeHours: 48,
    imageUrl: MOBILE_PHOTO_IMAGE,
    imageAlt: 'تصوير زفاف بالجوال بأسلوب سينمائي من لومير',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: false,
    requiresParentConsent: false,
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'مصورة جوال سعودية محترفة بخصوصية تامة',
      'تصوير فوتوغرافي وفيديو ومونتاج ريلز بأعلى دقة 4K',
      'مدة التسليم المبدئية: 48 ساعة فقط (قابلة للتعديل من الإدارة)',
      'تسليم الملفات الأصلية عبر رابط سحابي خاص أو AirDrop'
    ],
    packages: [
      {
        id: 'pkg-photo-3h',
        name: 'باقة ٣ ساعات تغطية',
        durationHours: 3,
        price: 350,
        deliveryTimeframe: '٤٨ ساعة',
        features: [
          'تغطية ٣ ساعات متواصلة بمصورة جوال محترفة',
          'تصوير تفاصيل الكوشة والضيافة واللقطات العفوية',
          'مونتاج مقطع ريلز (Reel) احترافي واحد بدقة 4K',
          'تسليم كافة الصور والفيديوهات الأصلية خلال ٤٨ ساعة'
        ]
      },
      {
        id: 'pkg-photo-4h',
        name: 'باقة ٤ ساعات تغطية',
        durationHours: 4,
        price: 400,
        deliveryTimeframe: '٤٨ ساعة',
        popular: true,
        features: [
          'تغطية ٤ ساعات متواصلة',
          'تصوير شامل لتفاصيل القاعة واستقبال الضيوف',
          'مونتاج مقطعي ريلز (٢ Reels) سينمائيين',
          'تسليم الملفات خلال ٤٨ ساعة'
        ]
      },
      {
        id: 'pkg-photo-5h',
        name: 'باقة ٥ ساعات تغطية',
        durationHours: 5,
        price: 500,
        deliveryTimeframe: '٤٨ ساعة',
        popular: true,
        features: [
          'تغطية ٥ ساعات تشمل استقبال العروس وتفاصيل الحفل',
          'مونتاج ٣ مقاطع ريلز مع تصحيح ألوان وإضاءة متقدمة',
          'تسليم سريع عبر AirDrop ورابط سحابي مشفر'
        ]
      },
      {
        id: 'pkg-photo-6h',
        name: 'باقة ٦ ساعات تغطية شاملة',
        durationHours: 6,
        price: 600,
        deliveryTimeframe: '٤٨ ساعة',
        features: [
          'تغطية ٦ ساعات كاملة من جلسة ما قبل الحفل حتى الزفة',
          'مونتاج ٤ مقاطع ريلز وتغطية فيديو مكثفة',
          'تسليم خلال ٤٨ ساعة بخصوصية مطلقة'
        ]
      },
      {
        id: 'pkg-photo-7h',
        name: 'باقة ٧ ساعات VIP الملكية',
        durationHours: 7,
        price: 700,
        deliveryTimeframe: '٤٨ ساعة',
        features: [
          'تغطية ممتدة لمدة ٧ ساعات لكافة تفاصيل الحفل والمقتنيات',
          'أولوية مونتاج وتسليم المقاطع بجودة سينمائية',
          'تسليم كامل الأصول بجودة ProRes / 4K'
        ]
      }
    ],
    addons: [
      {
        id: 'add-photo-reel',
        name: 'مقطع ريلز إضافي ممنتج',
        price: 150,
        description: 'تصميم مقطع ريلز إضافي بموسيقى ومؤثرات حسب طلب العميلة.'
      },
      {
        id: 'add-photo-same-night',
        name: 'تسليم فوري ومستعجل في نفس الليلة',
        price: 200,
        description: 'أولوية معالجة فورية لتسليم مقطع فيديو قبل صباح اليوم التالي.'
      },
      {
        id: 'add-photo-hour',
        name: 'ساعة تصوير إضافية',
        price: 100,
        unitLabel: 'لكل ساعة إضافية',
        description: 'تمديد تواجد المصورة ساعة إضافية في القاعة.'
      }
    ]
  },

  // 2. ركن الأطفال
  {
    id: 'srv-kids-corner',
    category: 'kids_corner',
    slug: 'kids-corner',
    name: 'ركن الأطفال والأنشطة الإبداعية',
    tagline: 'مساحة مبهجة وراقية تجمع بين الفنون واللعب التفاعلي الآمن',
    description:
      'تجهيز ركن أطفال فاخر بألوان هادئة (العاجي، الوردي الهادئ، والتركوازي) يضم الرسم والتلوين على الأوراق، اللعب بالطين التفاعلي، رسومات الوجه، ونقش الحناء اللطيف تحت إشراف متخصص.',
    pricingModel: 'per_child',
    basePrice: 500,
    hourlyRateSar: 150,
    isHourlyEnabled: true,
    minHours: 3,
    maxHours: 8,
    defaultHours: 4,
    fixedFeeSar: 0,
    imageUrl: KIDS_CORNER_IMAGE,
    imageAlt: 'ركن أنشطة إبداعية للأطفال في المناسبات',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: true,
    spaceRequirements: 'مساحة ٣×٣ متر أو ٤×٣ متر داخل صالة الأطفال أو القاعة مع مقبس كهربائي للإضاءة الناعمة.',
    requiresParentConsent: true,
    priceNotice: 'السعر النهائي بعد مراجعة تفاصيل المناسبة والمساحة وعدد الأطفال',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'ركن الرسم والتلوين على الورق وخامات فنية نظيفة وآمنة',
      'اللعب بالطين والصلصال الصحي غير القابل للالتصاق',
      'رسومات الوجه بألوان لطيفة مصرحة للبشرة الحساسة',
      'نقش الحناء عند توفر مقدمة الخدمة وموافقة العميل المسبقة'
    ],
    packages: [
      {
        id: 'pkg-kids-basic',
        name: 'باقة الإبداع (رسم وتلوين + لعب بالطين)',
        durationHours: 3,
        price: 500,
        features: [
          'مناسبة حتى ١٥ طفلاً لمدة ٣ ساعات',
          'طاولات وكراسي خشبية وخيمة قطنية عاجية أنيقة',
          'أوراق رسم، كراسات، وألوان خشبية ومائية نظيفة',
          'طين وصلصال تشكيل بأشكال مبهجة',
          'مشرفة مسؤولة عن إدارة الأنشطة'
        ]
      },
      {
        id: 'pkg-kids-colors',
        name: 'باقة الفرحة المجمعة (رسم + طين + رسومات الوجه)',
        durationHours: 4,
        price: 750,
        popular: true,
        features: [
          'مناسبة حتى ٢٠ طفلاً لمدة ٤ ساعات',
          'تشمل الرسم والتلوين + اللعب بالطين التفاعلي',
          'ركن رسومات الوجه اللطيفة (فراشات، أبطال، نجوم)',
          'مشرفتان لإدارة الأنشطة والحرص على نظافة الصغار'
        ]
      },
      {
        id: 'pkg-kids-royal',
        name: 'باقة لومير الملكية الشاملة (مع نقش الحناء)',
        durationHours: 5,
        price: 950,
        features: [
          'مناسبة حتى ٢٥ طفلاً لمدة ٥ ساعات',
          'تشمل: الرسم + الطين + رسومات الوجه',
          'نقش الحناء اللطيف للفتيات (بموافقة مسبقة)',
          'توزيعات وهدايا تشجيعية بسيطة لكل طفل في الختام',
          'مشرفتان متخصصتان طوال ساعات الحفل'
        ]
      }
    ],
    addons: [
      {
        id: 'add-kids-extra-child',
        name: 'إضافة لكل ٥ أطفال إضافيين',
        price: 150,
        description: 'توفير خامات إضافية وأدوات رسم وصلصال تناسب الزيادة.'
      },
      {
        id: 'add-kids-henna-standalone',
        name: 'ركن نقش الحناء الخاص',
        price: 250,
        description: 'نقاشة حناء متخصصة لنقوش ناعمة للفتيات بموافقة الأمهات.'
      },
      {
        id: 'add-kids-extra-hour',
        name: 'ساعة إضافية للركن',
        price: 150,
        description: 'تمديد تشغيل الركن ساعة إضافية بنفس المشرفات.'
      }
    ]
  },

  // 3. رعاية الأطفال أثناء المناسبات
  {
    id: 'srv-childcare',
    category: 'childcare',
    slug: 'childcare',
    name: 'مشرفة أطفال للمناسبات',
    tagline: 'راحة بال للأمهات واهتمام حانٍ بالأطفال طوال ساعات الحفل',
    description:
      'حجز مشرفات مؤهلات للاهتمام بالأطفال ومرافقتهم داخل جناح الأطفال، وتنظيم أوقاتهم وألعابهم الجماعية الهادئة ومنع خروجهم لصالة الزفة لضمان سكينة الحفل.',
    pricingModel: 'per_staff',
    basePrice: 300,
    hourlyRateSar: 75,
    isHourlyEnabled: true,
    minHours: 3,
    maxHours: 12,
    defaultHours: 4,
    fixedFeeSar: 0,
    imageUrl: CHILDCARE_IMAGE,
    imageAlt: 'مشرفة أطفال للمناسبات من لومير',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: false,
    requiresParentConsent: true,
    complianceNotice:
      'تنويه تنظيمي ملزم: هذه الخدمة إشراف ورعاية ترفيهية مساندة للأطفال أثناء مدة المناسبة فقط، وليست حضانة مرخصة أو رعاية طبية أو بديلة عن الولي الشرعي.',
    priceNotice: 'السعر المبدئي يخضع للتأكيد وفق عدد الأطفال والمشرفات وساعات الحفل',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'تحديد عدد المشرفات المطلوب وفق عدد الأطفال وطبيعة المكان (مشرفة لكل ٨-١٠ أطفال)',
      'توثيق بيانات ولي الأمر وتعليمات الحساسية والطوارئ',
      'نظام أساور المعصم المرمزة لضمان الاستلام والتسليم الآمن',
      'إشراف تربوي لطيف وألعاب جماعية وقراءة قصص'
    ],
    packages: [
      {
        id: 'pkg-care-1staff',
        name: 'مشرفة واحدة (حتى ٨ أطفال)',
        durationHours: 3,
        price: 300,
        features: [
          'مشرفة سعودية مؤهلة بالزي الرسمي للومير',
          'رعاية ومرافقة حتى ٨ أطفال لمدة ٣ ساعات',
          'أساور معصم مطابقة بين الأم والطفل',
          'ألعاب هادئة وقصص مصورة'
        ]
      },
      {
        id: 'pkg-care-2staff',
        name: 'مشرفتان للرعاية (حتى ١٦ طفلاً)',
        durationHours: 4,
        price: 550,
        popular: true,
        features: [
          'مشرفتان مؤهلتان لمدة ٤ ساعات',
          'استيعاب حتى ١٦ طفلاً مع تنظيم الدخول والخروج',
          'تنسيق وجبات الأطفال الخفيفة وتوفير مياه الشرب',
          'سجل رسمي لتعليمات الأمهات'
        ]
      },
      {
        id: 'pkg-care-3staff',
        name: 'فريق رعاية متكامل (٣ مشرفات / حتى ٢٥ طفلاً)',
        durationHours: 5,
        price: 800,
        features: [
          '٣ مشرفات متخصصات لمدة ٥ ساعات متواصلة',
          'تنظيم شامل لجناح الأطفال وتأمين البوابات',
          'إشراف دقيق ورعاية للأطفال الصغار (من سنتين ونصف فأكثر)',
          'مناسبة لحفلات الزفاف الكبرى'
        ]
      }
    ],
    addons: [
      {
        id: 'add-care-extra-supervisor',
        name: 'مشرفة رعاية إضافية',
        price: 250,
        description: 'إضافة مشرفة مساندة للمناسبات ذات الأعداد الكبيرة.'
      },
      {
        id: 'add-care-extra-hour',
        name: 'ساعة إضافية لكل مشرفة',
        price: 80,
        unitLabel: 'لكل مشرفة / ساعة',
        description: 'تمديد مدة الإشراف في حال تأخر الحفل.'
      }
    ]
  },

  // 4. خدمات مساندة الأفراح
  // مفرزة جوالات: 400 ريال.
  // حارسة الكوشة: 250 ريال.
  // مرافقة الطفل: 250 ريال.
  // خدمة العبايات: 250 ريال.
  // وصيفة العروس ومرافقة أهلها: 350 ريال.
  // عاملات المباشرة: 200 ريال.
  // قهوة الضيافة: 300 ريال.
  {
    id: 'srv-wedding-support-phones',
    category: 'wedding_support',
    slug: 'phone-supervisor',
    name: 'مفرزة جوالات للمناسبات',
    tagline: 'تنظيم بوابات الدخول ومنع التصوير غير المصرح به لحفظ خصوصية الحفل',
    description:
      'إشراف نسائي حازم ولبق عند بوابات الدخول للتأكد من حجب كاميرات الهواتف وتطبيق اشتراطات أهل الحفل بخصوصية تامة.',
    pricingModel: 'fixed',
    basePrice: 400,
    minHours: 5,
    imageUrl: WEDDING_SUPPORT_IMAGE,
    imageAlt: 'خدمة مفرزة جوالات للمناسبات من لومير',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: false,
    requiresParentConsent: false,
    priceNotice: 'السعر النهائي بعد مراجعة تفاصيل المناسبة وساعات الحضور',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'مشرفة متفرغة بالزي الرسمي عند بوابات الدخول',
      'تطبيق تعليمات العروس بصرامة وأسلوب راقٍ',
      'تغطية حتى ٥ ساعات متواصلة'
    ],
    packages: [
      {
        id: 'pkg-phone-sup-base',
        name: 'مفرزة جوالات أساسية',
        durationHours: 5,
        price: 400,
        features: ['مشرفة واحدة لبوابة الدخول الرئيسية', 'تغطية لمدة ٥ ساعات', 'ملصقات حجب الكاميرا عند الطلب']
      }
    ],
    addons: []
  },
  {
    id: 'srv-wedding-support-kosha',
    category: 'wedding_support',
    slug: 'kosha-guard',
    name: 'حارسة الكوشة',
    tagline: 'حماية وتأمين مساحة الكوشة والعروس لضمان هدوء اللحظات الخاصة',
    description:
      'حارسة متخصصة تتواجد بجانب الكوشة لمنع الازدحام العشوائي، ومساعدة العروس أثناء جلوسها والتقاط الصور التذكارية بسلام وهدوء.',
    pricingModel: 'fixed',
    basePrice: 250,
    minHours: 5,
    imageUrl: WEDDING_SUPPORT_IMAGE,
    imageAlt: 'حارسة الكوشة تحرص على خصوصية العروس أثناء لحظات الزفاف',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: false,
    requiresParentConsent: false,
    priceNotice: 'السعر النهائي بعد مراجعة تفاصيل المناسبة وساعات الحضور',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'حارسة كوشة متمكنة بلباس رسمي لائق',
      'تنظيم صعود المهنئات والتقاط الصور العائلية',
      'تغطية لمدة ٥ ساعات'
    ],
    packages: [
      {
        id: 'pkg-kosha-guard-base',
        name: 'خدمة حارسة الكوشة',
        durationHours: 5,
        price: 250,
        features: ['حارسة كوشة واحدة متفرغة', 'تنظيم مساحة العروس ومنع التزاحم', 'تغطية ٥ ساعات']
      }
    ],
    addons: []
  },
  {
    id: 'srv-wedding-support-abayas',
    category: 'wedding_support',
    slug: 'abaya-service',
    name: 'خدمة العبايات',
    tagline: 'ترقيم واستلام وتسليم عبايات الضيفات بأعلى درجات الأمان والترتيب',
    description:
      'مشرفة مسؤولة عن غرفة العبايات، مزودة بأرقام وقسائم استلام منظمة لمنع الفوضى وضمان تسليم عبايات كل ضيفة بكل سرعة وأناقة.',
    pricingModel: 'fixed',
    basePrice: 250,
    minHours: 5,
    imageUrl: WEDDING_SUPPORT_IMAGE,
    imageAlt: 'ركن ترقيم وتسليم عبايات الضيفات في مناسبة بتنظيم من لومير',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: true,
    spaceRequirements: 'جناح أو غرفة عبايات داخل القاعة مجهزة بشماعات أو طاولات.',
    requiresParentConsent: false,
    priceNotice: 'السعر النهائي بعد مراجعة تفاصيل المناسبة وساعات الحضور',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'أرقام وبطاقات استلام كرتونية أو قماشية فاخرة',
      'مشرفة أمينة ومسؤولة طوال ساعات الحفل',
      'تغطية ٥ ساعات'
    ],
    packages: [
      {
        id: 'pkg-abaya-base',
        name: 'خدمة مشرفة العبايات',
        durationHours: 5,
        price: 250,
        features: ['مشرفة واحدة لغرفة العبايات', 'أرقام استلام وبطاقات منظمة', 'تغطية ٥ ساعات']
      }
    ],
    addons: []
  },
  {
    id: 'srv-wedding-support-child-escort',
    category: 'wedding_support',
    slug: 'child-escort',
    name: 'مرافقة الطفل',
    tagline: 'مرافقة شخصية حانية لطفل محدد (طفل العروس أو الأخت) طوال الحفل',
    description:
      'مشرفة مخصصة لمرافقة طفل معين طوال ساعات المناسبة، تهتم بتغذيته ولبسه ومرافقته عند دخول الصالة والاهتمام بكافة متطلباته.',
    pricingModel: 'fixed',
    basePrice: 250,
    minHours: 4,
    imageUrl: CHILDCARE_IMAGE,
    imageAlt: 'مشرفة ترافق طفلة أثناء فعاليات حفل الزفاف',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: false,
    requiresParentConsent: true,
    complianceNotice: 'مرافقة شخصية أثناء المناسبة، وتتطلب تعليمات واضحة وموافقة الوالدين.',
    priceNotice: 'السعر النهائي بعد مراجعة تفاصيل المناسبة وساعات الحضور',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'مشرفة مكرسة بالكامل لطفل واحد أو طفلين من نفس العائلة',
      'تلبية احتياجات الطفل والتنسيق مع والدته بلطف',
      'تغطية ٤ إلى ٥ ساعات'
    ],
    packages: [
      {
        id: 'pkg-child-escort-base',
        name: 'مرافقة طفل شخصية',
        durationHours: 4,
        price: 250,
        features: ['مشرفة شخصية متفرغة للطفل', 'تنسيق وجبات وتبديل ملابس إن لزم', 'تغطية ٤ ساعات']
      }
    ],
    addons: []
  },
  {
    id: 'srv-wedding-support-bridal-escort',
    category: 'wedding_support',
    slug: 'bridal-escort',
    name: 'وصيفة العروس ومرافقة أهلها',
    tagline: 'المساعد الأيمن للعروس وأهلها لترتيب الفستان، الطرحة، والجدول الزمني',
    description:
      'منسقة ميدانية ترافق العروس لحظة بلحظة: ترتيب الفستان، مسك الطرحة أثناء جلسة التصوير والزفة، حمل حقيبة الطوارئ، والتنسيق مع أهل الحفل.',
    pricingModel: 'fixed',
    basePrice: 350,
    minHours: 5,
    imageUrl: WEDDING_SUPPORT_IMAGE,
    imageAlt: 'إرشاد وصيفة العروس لتنسيق تفاصيل الفستان قبل الزفة',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: false,
    requiresParentConsent: false,
    priceNotice: 'السعر النهائي بعد مراجعة تفاصيل المناسبة وساعات الحضور',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'مرافقة خاصة للعروس طوال ليلة الزفاف',
      'حقيبة طوارئ متكاملة (دبابيس، خيوط، إسعافات، عطور)',
      'التنسيق مع المصورة ومشرفة الصوت قبل الزفة'
    ],
    packages: [
      {
        id: 'pkg-bridal-escort-base',
        name: 'خدمة وصيفة العروس الميدانية',
        durationHours: 5,
        price: 350,
        features: ['منسقة مرافقة للعروس ٥ ساعات', 'حقيبة طوارئ وتثبيت الفستان والطرحة', 'مساعدة أثناء جلسة التصوير والزفة']
      }
    ],
    addons: []
  },
  {
    id: 'srv-wedding-support-servers',
    category: 'wedding_support',
    slug: 'hospitality-servers',
    name: 'عاملات المباشرة والضيافة',
    tagline: 'طاقم نسائي لتقديم المشروبات والحلويات للضيفات بأناقة ولباقة',
    description:
      'عاملات مباشرة سعوديات أو مقيمات مدربات على فن الضيافة وتقديم العصائر، القهوة، الشاي، والمقبلات بطريقة راقية ونظيفة.',
    pricingModel: 'per_staff',
    basePrice: 200,
    minHours: 4,
    imageUrl: WEDDING_SUPPORT_IMAGE,
    imageAlt: 'طاقم نسائي يقدم الضيافة للضيفات في صالة الحفل',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: false,
    requiresParentConsent: false,
    priceNotice: 'السعر التقديري لكل عاملة/مشرفة، ويتحدد الإجمالي بعد مراجعة عدد الضيوف وحجم القاعة',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'زي موحد أنيق ومظهر لائق جداً',
      'خبرة في ضيافة الأفراح والمناسبات الراقية',
      'تحديد عدد العاملات حسب عدد الطاولات وحجم الحفل'
    ],
    packages: [
      {
        id: 'pkg-servers-1',
        name: 'عاملة مباشرة واحدة (٤ ساعات)',
        durationHours: 4,
        price: 200,
        features: ['عاملة مباشرة واحدة مدربة', 'زي رسمي موحد ونظيف', 'تغطية ٤ ساعات في القاعة']
      },
      {
        id: 'pkg-servers-2',
        name: 'عاملتان للمباشرة (٤ ساعات)',
        durationHours: 4,
        price: 400,
        features: ['عاملتان مدربتان على الضيافة', 'تنسيق صواني التقديم وتوزيع المشروبات', 'تغطية ٤ ساعات']
      }
    ],
    addons: [
      {
        id: 'add-server-extra-hour',
        name: 'ساعة إضافية لكل عاملة',
        price: 50,
        unitLabel: 'لكل عاملة / ساعة',
        description: 'تمديد تواجد العاملة ساعة إضافية.'
      }
    ]
  },
  {
    id: 'srv-wedding-support-coffee',
    category: 'wedding_support',
    slug: 'hospitality-coffee',
    name: 'قهوة الضيافة العربية الفاخرة',
    tagline: 'تقديم القهوة السعودية الأصيلة والشاي بمعدات تقديم ذهبية راقية',
    description:
      'ركن وخدمة قهوة الضيافة العربية الفاخرة بالهيل والزعفران مع صواني دلال ذهبية، تمر فاخر، وفناجيل كريستالية لضيافة تليق بحضورك.',
    pricingModel: 'fixed',
    basePrice: 300,
    minHours: 4,
    imageUrl: WEDDING_SUPPORT_IMAGE,
    imageAlt: 'دلة قهوة سعودية وأواني ذهبية على طاولة استقبال الضيافة',
    isDemoImage: true,
    isAvailable: true,
    requiresSpaceAndSetup: true,
    spaceRequirements: 'طاولة ضيافة أو ركن تقديم داخل الصالة.',
    requiresParentConsent: false,
    priceNotice: 'السعر النهائي بعد مراجعة تفاصيل المناسبة وساعات الحضور',
    applicableCities: ['مكة المكرمة', 'جدة'],
    includedHighlights: [
      'دلال ذهبية وفناجيل كريستال فاخرة',
      'قهوة سعودية بالهيل والزعفران + شاي بنعناع',
      'تمر سكري فاخر مع طحينة',
      'تغطية لمدة ٤ ساعات'
    ],
    packages: [
      {
        id: 'pkg-coffee-base',
        name: 'ركن قهوة الضيافة الأساسي (حتى ٧٠ ضيفة)',
        durationHours: 4,
        price: 300,
        features: ['دلال وترامس ذهبية فخمة', 'قهوة شقراء ممتازة وشاي أحمر وأخضر', 'فناجيل واستكانات راقية', 'تغطية ٤ ساعات']
      }
    ],
    addons: []
  }
];

export const INITIAL_LUMIR_DATA: LumirCentralData = {
  settings: {
    brandNameAr: 'لومير',
    brandNameEn: 'LUMIR',
    slogan: 'نضيء لياليك وفرحة صغارك',
    heroHeadline: 'تفاصيل صغيرة تصنع فرحة لا تُنسى',
    heroSubheadline:
      'من تصوير أجمل اللحظات بالجوال إلى عالم الأطفال الآمن وخدمات مساندة الأفراح، نهتم بتفاصيل مناسبتكم في مكة المكرمة وجدة.',
    whatsappLocal: '0579105700',
    whatsappInternational: '966579105700',
    email: 'lumir.store.l@gmail.com',
    workingHours: 'يومياً من ١٠:٠٠ ص حتى ١١:٠٠ م',
    mobilePhotoDefaultDelivery: '٤٨ ساعة',
    demoNotice:
      'الصور المعروضة تُمثّل أسلوب الإخراج والتجهيز المعتمد لدى لومير، وتُحدَّث بالأعمال الأصلية فور توفر موافقات النشر.',
    privacyPledge:
      'نلتزم التزاماً صارماً بخصوصية العائلات والأطفال: لا يتم تصوير أي طفل أو نشر أي صورة أو مقطع دون موافقة خطية صريحة من صاحب المناسبة.',
    childcareDisclaimer:
      'تنويه نظامي: خدمات رعاية ومرافقة الأطفال هي إشراف ترفيهي مساند أثناء ساعات المناسبة فقط، وليست حضانة مرخصة أو رعاية طبية.',
    approvedFeesSar: 0,
    bookingNotice:
      'تنبيه إداري: يعتبر هذا الطلب مبدئياً ولا يتم تأكيد الموعد نهائياً إلا بعد مراجعة فريق الإدارة والتحقق من التوفر وجدولة الموعد رسمياً.',
    allowPublicCoupons: true,
    instagramUrl: '',
    tiktokUrl: '',
    snapchatUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    telegramUrl: ''
  },
  announcements: {
    isEnabled: true,
    bgColor: '#2C1E18',
    textColor: '#FAF6F0',
    accentColor: '#C8A96E',
    intervalSeconds: 3.5,
    isTicker: true,
    speed: 'normal',
    pauseOnHover: true,
    messages: [
      {
        id: 'msg-1',
        text: 'موسم مناسبات ٢٠٢٦ في مكة المكرمة وجدة — احجزي موعدكِ الآن بأسعار خاصة',
        badge: '✨ عرض حصري',
        linkText: 'احجزي الآن',
        linkTarget: 'booking',
        isActive: true
      },
      {
        id: 'msg-2',
        text: 'تغطية تصوير بالجوال سينمائية مع تسليم الملفات والريلز خلال ٤٨ ساعة فقط بخصوصية تامة',
        badge: '📸 تسليم فوري',
        linkText: 'استكشفي الباقات',
        linkTarget: 'mobile-photography',
        isActive: true
      },
      {
        id: 'msg-3',
        text: 'استخدمي الكود LUMIR10 للحصول على خصم ١٠٪ على حجوزات المناسبات هذا الشهر',
        badge: '🎁 كود خصم',
        linkText: 'تطبيق الخصم',
        linkTarget: 'booking',
        isActive: true
      },
      {
        id: 'msg-4',
        text: 'أركان إبداعية وأنشطة تلوين وطين للأطفال مع مشرفات مؤهلات لراحة بال الأمهات',
        badge: '🎨 أركان الأطفال',
        linkText: 'شاهدي الأركان',
        linkTarget: 'kids-corner',
        isActive: true
      }
    ]
  },
  sliderSettings: {
    autoPlay: true,
    intervalSeconds: 3,
    pauseOnHover: true,
    showArrows: true,
    showIndicators: true
  },
  banners: [
    {
      id: 'banner-1',
      title: 'توثيق سينمائي فاخر لأدق تفاصيل زفافكِ بعدسة الجوال',
      subtitle:
        'لقطات عفوية ومقاطع ريلز احترافية بأيدي مصورات سعوديات مع خصوصية تامة وتسليم سريع خلال ٤٨ ساعة في مكة وجدة.',
      badge: '✨ الباقة الأكثر طلباً لموسم ٢٠٢٦',
      desktopImageUrl: HERO_IMAGE,
      mobileImageUrl: MOBILE_PHOTO_IMAGE,
      ctaText: 'احجزي تغطيتكِ الآن',
      ctaLink: 'booking',
      secondaryCtaText: 'مقارنة الباقات والأسعار',
      secondaryCtaLink: 'mobile-photography',
      textPosition: 'right',
      overlayDarkness: 0.45,
      displayOrder: 1,
      isActive: true
    },
    {
      id: 'banner-2',
      title: 'ركن الفرحة والإبداع لصغاركِ بأرقى معايير الأمان والبهجة',
      subtitle:
        'أنشطة تلوين وتشكيل بالطين ورسومات الوجه مع مشرفات متخصصات يضمنّ سلامة الأطفال وراحة بال الأمهات طوال الحفل.',
      badge: '🎨 عالم آمن وممتع للأطفال',
      desktopImageUrl: KIDS_CORNER_IMAGE,
      mobileImageUrl: KIDS_CORNER_IMAGE,
      ctaText: 'استكشفي ركن الأطفال',
      ctaLink: 'kids-corner',
      secondaryCtaText: 'حجز الركن لمناسبتكِ',
      secondaryCtaLink: 'booking',
      textPosition: 'right',
      overlayDarkness: 0.45,
      displayOrder: 2,
      isActive: true
    },
    {
      id: 'banner-3',
      title: 'خدمات مساندة وتنظيم الأفراح بفخامة الضيافة السعودية الأصيلة',
      subtitle:
        'تنظيم استقبال الضيوف، ركن العبايات، التبخير بالعود، ومتابعة دقيقة لكل تفاصيل القاعة ليخرج يومكِ بأبهى صورة.',
      badge: '👑 تنظيم متكامل للأفراح',
      desktopImageUrl: WEDDING_SUPPORT_IMAGE,
      mobileImageUrl: WEDDING_SUPPORT_IMAGE,
      ctaText: 'تفاصيل تنظيم الأفراح',
      ctaLink: 'wedding-support',
      secondaryCtaText: 'تواصل مباشر عبر واتساب',
      secondaryCtaLink: 'contact',
      textPosition: 'right',
      overlayDarkness: 0.45,
      displayOrder: 3,
      isActive: true
    },
    {
      id: 'banner-4',
      title: 'مشرفات ومرافقات الأطفال في الأفراح لراحة بال تامة وأمان لأطفالكِ',
      subtitle:
        'إشراف ترفيهي نسائي متخصص، رعاية مساندة طوال ساعات المناسبة، وأنشطة هادئة تضمن فرحة الصغار واستمتاع الأمهات.',
      badge: '🧸 رعاية وترفيه مساند',
      desktopImageUrl: CHILDCARE_IMAGE,
      mobileImageUrl: CHILDCARE_IMAGE,
      ctaText: 'استكشفي خدمات الرعاية',
      ctaLink: 'childcare',
      secondaryCtaText: 'طلب مرافقة لمناسبتكِ',
      secondaryCtaLink: 'booking',
      textPosition: 'right',
      overlayDarkness: 0.45,
      displayOrder: 4,
      isActive: true
    }
  ],
  services: INITIAL_SERVICES,
  bookings: [
    {
      id: 'bk-101',
      referenceCode: 'LMR-2610-101',
      createdAt: '2026-10-12T16:00:00.000Z',
      status: 'confirmed',
      serviceId: 'srv-mobile-photo',
      serviceName: 'تصوير المناسبات بالجوال',
      categoryKey: 'mobile_photography',
      packageId: 'pkg-photo-4h',
      packageName: 'باقة ٤ ساعات تغطية',
      city: 'مكة المكرمة',
      district: 'العوالي',
      venueName: 'قاعة اللؤلؤة',
      eventDate: '2026-10-24',
      startTime: '19:00',
      endTime: '23:00',
      durationHours: 4,
      coverageDetails: 'التركيز على تفاصيل الكوشة والضيافة والزفة مع مقطعي ريلز',
      selectedAddonIds: ['add-photo-same-night'],
      subtotalSar: 600,
      approvedFeesSar: 0,
      estimatedTotalSar: 600,
      payableAmountSar: 600,
      isCustomQuoteRequired: false,
      clientName: 'نورة المطيري',
      clientPhone: '0551234567',
      preferredContactMethod: 'whatsapp',
      agreedTermsAndPrivacy: true,
      agreedPhotoPrivacy: true,
      specialNotes: 'يرجى الحضور قبل الموعد بـ ٤٥ دقيقة.'
    },
    {
      id: 'bk-102',
      referenceCode: 'LMR-2610-102',
      createdAt: '2026-10-13T18:30:00.000Z',
      status: 'pending_review',
      serviceId: 'srv-kids-corner',
      serviceName: 'ركن الأطفال والأنشطة الإبداعية',
      categoryKey: 'kids_corner',
      packageId: 'pkg-kids-colors',
      packageName: 'باقة الفرحة المجمعة (رسم + طين + رسومات الوجه)',
      city: 'جدة',
      district: 'الشاطئ',
      venueName: 'فندق هيلتون',
      eventDate: '2026-10-28',
      startTime: '20:00',
      endTime: '00:00',
      durationHours: 4,
      childrenCount: 18,
      childrenAges: 'من ٣ إلى ٨ سنوات',
      selectedActivities: ['الرسم والتلوين على الأوراق', 'اللعب بالطين', 'رسومات الوجه'],
      selectedAddonIds: [],
      subtotalSar: 750,
      approvedFeesSar: 0,
      estimatedTotalSar: 750,
      isCustomQuoteRequired: true,
      clientName: 'ريم السليمان',
      clientPhone: '0509876543',
      preferredContactMethod: 'whatsapp',
      agreedTermsAndPrivacy: true,
      specialNotes: 'تنسيق ألوان الركن مع ورد الصالة العاجي والوردي الهادئ.'
    }
  ],
  portfolio: [
    {
      id: 'port-1',
      title: 'توثيق كوشة زفاف وتفاصيل الضيافة الفاخرة',
      categoryKey: 'mobile_photography',
      mediaType: 'image',
      mediaUrl: MOBILE_PHOTO_IMAGE,
      caption: 'لقطات سينمائية بكاميرا iPhone 16 Pro مع إضاءة دافئة وتركيز على أدق التفاصيل',
      city: 'مكة المكرمة',
      isFeatured: true,
      isPublic: true,
      displayOrder: 1,
    },
    {
      id: 'port-2',
      title: 'ريلز سينمائي لدخول العروس وتفاصيل الفستان',
      categoryKey: 'mobile_photography',
      mediaType: 'video',
      mediaUrl: HERO_IMAGE,
      caption: 'مقطع ريلز طولي عالي الدقة 4K تم تسليمه خلال ٤٨ ساعة بجودة احترافية',
      city: 'جدة',
      isFeatured: true,
      isPublic: true,
      displayOrder: 2,
    },
    {
      id: 'port-3',
      title: 'ركن الفرحة والإبداع للصغار بألوان الباستيل',
      categoryKey: 'kids_corner',
      mediaType: 'image',
      mediaUrl: KIDS_CORNER_IMAGE,
      caption: 'خيمة قطنية وطاولات خشبية صغيرة مجهزة بألعاب فنية متقنة',
      city: 'جدة',
      isFeatured: true,
      isPublic: true,
      displayOrder: 3,
      parentConsentApproved: true
    },
    {
      id: 'port-4',
      title: 'تنسيق ركن الأطفال بالقاعات الكبرى',
      categoryKey: 'kids_corner',
      mediaType: 'image',
      mediaUrl: KIDS_CORNER_IMAGE,
      caption: 'مساحة منظمة تفصل الأطفال عن صالة الزفة بأمان وهدوء',
      city: 'مكة المكرمة',
      isFeatured: false,
      isPublic: true,
      displayOrder: 4,
      parentConsentApproved: true
    },
    {
      id: 'port-5',
      title: 'ورشة التلوين والألعاب الفنية الهادئة',
      categoryKey: 'kids_activities',
      mediaType: 'image',
      mediaUrl: CHILDCARE_IMAGE,
      caption: 'أنشطة تلوين وتركيب بأدوات آمنة مع مشرفات متخصصات لحفظ هدوء الصالة',
      city: 'مكة المكرمة',
      isFeatured: true,
      isPublic: true,
      displayOrder: 5,
      parentConsentApproved: true
    },
    {
      id: 'port-6',
      title: 'نشاط التشكيل بالطين والصلصال الصحي',
      categoryKey: 'kids_activities',
      mediaType: 'video',
      mediaUrl: CHILDCARE_IMAGE,
      caption: 'صغار يستمتعون بتشكيل مجسمات فنية مبهجة بإشراف تربوي راقٍ',
      city: 'جدة',
      isFeatured: false,
      isPublic: true,
      displayOrder: 6,
      parentConsentApproved: true
    },
    {
      id: 'port-7',
      title: 'استقبال ضيفات الحفل وبخور العود الملكي',
      categoryKey: 'wedding_support',
      mediaType: 'image',
      mediaUrl: WEDDING_SUPPORT_IMAGE,
      caption: 'مشرفات سعوديات بلباس موحد راقٍ وتنسيق مبهر لمراسم الاستقبال',
      city: 'جدة',
      isFeatured: true,
      isPublic: true,
      displayOrder: 7,
    },
    {
      id: 'port-8',
      title: 'تنظيم جناح العبايات وترقيم القسائم',
      categoryKey: 'wedding_support',
      mediaType: 'image',
      mediaUrl: WEDDING_SUPPORT_IMAGE,
      caption: 'تسليم واستلام منظم يضمن راحة ضيفات الحفل وسرعة المغادرة',
      city: 'مكة المكرمة',
      isFeatured: false,
      isPublic: true,
      displayOrder: 8,
    },
    {
      id: 'port-9',
      title: 'تجهيزات ضيافة القهوة والشاي بالأواني الذهبية',
      categoryKey: 'event_setups',
      mediaType: 'image',
      mediaUrl: HERO_IMAGE,
      caption: 'دلال شقراء فاخرة، كاسات واستكانات كريستالية راقية تنسجم مع هوية العرس',
      city: 'مكة المكرمة',
      isFeatured: true,
      isPublic: true,
      displayOrder: 9,
    },
    {
      id: 'port-10',
      title: 'تجهيز طاولات ضيافة الاستقبال والمباخر',
      categoryKey: 'event_setups',
      mediaType: 'image',
      mediaUrl: WEDDING_SUPPORT_IMAGE,
      caption: 'مباخر نحاسية مطلية بالذهب ومرشات العطر والورد لتجربة ترحيبية لا تُنسى',
      city: 'جدة',
      isFeatured: false,
      isPublic: true,
      displayOrder: 10,
    }
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'ما هي المدن التي تغطيها لومير؟',
      answer:
        'نخدم حصرياً مدينتي مكة المكرمة وجدة، لنضمن أعلى درجات الانضباط في المواعيد وجودة التنسيق الفوري.',
      category: 'عام',
      order: 1
    },
    {
      id: 'faq-2',
      question: 'كم تستغرق مدة تسليم تغطية التصوير بالجوال؟',
      answer:
        'مدة التسليم المبدئية هي ٤٨ ساعة فقط، ويتم تسليم المقاطع والصور عبر رابط سحابي آمن أو AirDrop مباشر.',
      category: 'تصوير',
      order: 2
    },
    {
      id: 'faq-3',
      question: 'هل يتم تأكيد الموعد فور إرسال الطلب في الموقع؟',
      answer:
        'لا، يعتبر طلب الحجز مبدئياً ولا يتم اعتماده وتأكيده إلا بعد مراجعة فريق الإدارة والتحقق من عدم وجود تعارض في المواعيد وجاهزية الفريق.',
      category: 'الحجوزات',
      order: 3
    },
    {
      id: 'faq-4',
      question: 'ما هي شروط وإقرار خدمة رعاية الأطفال؟',
      answer:
        'خدماتنا هي إشراف ترفيهي ومرافقة مساندة للأطفال أثناء ساعات المناسبة فقط وليست حضانة مرخصة أو رعاية طبية، مع التزامنا التام بسلامة وراحة الأطفال.',
      category: 'الأطفال',
      order: 4
    }
  ],
  coupons: [
    {
      id: 'cp-1',
      code: 'LUMIR10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmountSar: 400,
      maxDiscountSar: 150,
      maxUses: 100,
      timesUsed: 14,
      isActive: true,
      expiresAt: '2026-12-31'
    },
    {
      id: 'cp-2',
      code: 'MAKKAH50',
      discountType: 'fixed_sar',
      discountValue: 50,
      minOrderAmountSar: 350,
      maxUses: 50,
      timesUsed: 8,
      isActive: true,
      expiresAt: '2026-11-30'
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: '2026-10-14T20:00:00.000Z',
      adminEmail: 'lumir.store.l@gmail.com',
      adminName: 'المديرة العامة — لومير',
      adminRole: 'super_admin',
      action: 'اعتماد باقات تصوير الجوال الرسمية',
      targetType: 'package',
      details: 'تثبيت أسعار باقات التصوير من ٣٥٠ إلى ٧٠٠ ريال ومدة تسليم ٤٨ ساعة.'
    },
    {
      id: 'log-2',
      timestamp: '2026-10-14T20:30:00.000Z',
      adminEmail: 'ops@lumir.sa',
      adminName: 'مشرفة العمليات والمواعيد',
      adminRole: 'operations_manager',
      action: 'تأكيد موعد حجز',
      targetType: 'booking',
      targetId: 'bk-101',
      details: 'تأكيد موعد الحجز LMR-2610-101 لمناسبة العوالي في مكة المكرمة.'
    }
  ],
  cityCoverage: [
    {
      cityName: 'مكة المكرمة',
      isActive: true,
      districts: [
        'العوالي',
        'الشوقية',
        'العزيزية',
        'بطحاء قريش',
        'النوارية',
        'الزايدي',
        'الشرائع',
        'الخالدية',
        'الرصيفة'
      ],
      transportFeeSar: 0,
      availableServiceKeys: [
        'mobile_photography',
        'kids_corner',
        'childcare',
        'wedding_support'
      ],
      notice: 'تغطية شاملة لكافة قاعات وفنادق مكة المكرمة بدون رسوم انتقال إضافية.'
    },
    {
      cityName: 'جدة',
      isActive: true,
      districts: [
        'الشاطئ',
        'الروضة',
        'الحمراء',
        'أبحر الشمالية',
        'الزهراء',
        'الخالدية',
        'السلامة',
        'المحمدية',
        'المرجان'
      ],
      transportFeeSar: 0,
      availableServiceKeys: [
        'mobile_photography',
        'kids_corner',
        'childcare',
        'wedding_support'
      ],
      notice: 'تغطية كاملة لجميع صالات وفنادق كورنيش وأحياء جدة.'
    }
  ],
  admins: [
    {
      id: 'adm-1',
      name: 'المديرة العامة — لومير',
      email: 'lumir.store.l@gmail.com',
      role: 'super_admin',
      phone: '0579105700',
      lastLoginAt: '2026-10-14T21:00:00.000Z',
      isActive: true
    },
    {
      id: 'adm-2',
      name: 'مشرفة العمليات والمواعيد',
      email: 'ops@lumir.sa',
      role: 'operations_manager',
      phone: '0550001122',
      lastLoginAt: '2026-10-14T20:30:00.000Z',
      isActive: true
    },
    {
      id: 'adm-3',
      name: 'مسؤولة المحتوى والكتالوج',
      email: 'media@lumir.sa',
      role: 'content_editor',
      phone: '0550003344',
      lastLoginAt: '2026-10-14T19:00:00.000Z',
      isActive: true
    }
  ],
  reviews: INITIAL_CUSTOMER_REVIEWS
};

const STORAGE_KEY = 'lumir_central_db_v5';

export function loadCentralData(): LumirCentralData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveCentralData(INITIAL_LUMIR_DATA);
      return INITIAL_LUMIR_DATA;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.services || !Array.isArray(parsed.services)) {
      saveCentralData(INITIAL_LUMIR_DATA);
      return INITIAL_LUMIR_DATA;
    }
    return {
      ...INITIAL_LUMIR_DATA,
      ...parsed,
      announcements: parsed.announcements || INITIAL_LUMIR_DATA.announcements,
      sliderSettings: parsed.sliderSettings || INITIAL_LUMIR_DATA.sliderSettings,
      banners:
        Array.isArray(parsed.banners) && parsed.banners.length > 0
          ? parsed.banners
          : INITIAL_LUMIR_DATA.banners,
      reviews:
        Array.isArray(parsed.reviews) && parsed.reviews.length > 0
          ? parsed.reviews
          : INITIAL_CUSTOMER_REVIEWS
    };
  } catch {
    return INITIAL_LUMIR_DATA;
  }
}

export function saveCentralData(data: LumirCentralData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function resetCentralDataToFactory(): LumirCentralData {
  saveCentralData(INITIAL_LUMIR_DATA);
  return INITIAL_LUMIR_DATA;
}

