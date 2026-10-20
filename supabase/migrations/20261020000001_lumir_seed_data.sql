-- ============================================================================
-- LUMIR | لومير — Initial Seed Data for Supabase
-- Target: Supabase PostgreSQL (Project: lumir-bookings)
-- ============================================================================

-- 1. Ensure Super Admin Profile exists (matches Supabase Auth user lumir.store.l@gmail.com)
INSERT INTO public.admin_profiles (id, name, email, phone, role, is_active)
VALUES (
  'f34d6c1a-9220-4913-b5f3-3e7b6b5c11fe',
  'المديرة العامة — لومير',
  'lumir.store.l@gmail.com',
  '0579105700',
  'admin',
  true
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin', is_active = true, updated_at = now();

-- 2. Seed Initial Services
INSERT INTO public.services (
  id, category, slug, name, tagline, description, pricing_model, base_price, min_hours, delivery_timeframe_hours,
  image_url, image_alt, is_available, packages, addons, included_highlights, applicable_cities, display_order
)
VALUES
(
  'srv-mobile-photo',
  'mobile_photography',
  'mobile-photography',
  'تصوير المناسبات بالجوال',
  'توثيق سينمائي فوري لأدق التفاصيل بعدسة جوال رائدة ومثبت احترافي',
  'تغطية خاصة لحفلات الزفاف والمناسبات الخاصة بأحدث أجهزة iPhone Pro مع مثبتات حركة DJI. توثيق تفاصيل القاعة، الكوشة، الضيافة، واللحظات العفوية مع تسليم مباشر ومونتاج ريلز مميز.',
  'per_hour',
  350.00,
  3,
  48,
  '/images/lumir-mobile-photo-1440.jpg',
  'تصوير زفاف بالجوال بأسلوب سينمائي من لومير',
  true,
  '[
    {"id":"pkg-photo-3h","name":"باقة ٣ ساعات تغطية","durationHours":3,"price":350,"deliveryTimeframe":"٤٨ ساعة","features":["تغطية ٣ ساعات متواصلة بمصورة جوال محترفة","تصوير تفاصيل الكوشة والضيافة واللقطات العفوية","مونتاج مقطع ريلز (Reel) احترافي واحد بدقة 4K","تسليم كافة الصور والفيديوهات الأصلية خلال ٤٨ ساعة"]},
    {"id":"pkg-photo-4h","name":"باقة ٤ ساعات تغطية","durationHours":4,"price":400,"deliveryTimeframe":"٤٨ ساعة","popular":true,"features":["تغطية ٤ ساعات متواصلة","تصوير شامل لتفاصيل القاعة واستقبال الضيوف","مونتاج مقطعي ريلز (٢ Reels) سينمائيين","تسليم فوري للملفات الأصلية"]},
    {"id":"pkg-photo-full","name":"باقة السهرة الكاملة (٦ ساعات)","durationHours":6,"price":550,"deliveryTimeframe":"٢٤ إلى ٤٨ ساعة","features":["تغطية ممتدة حتى نهاية السهرة وزفة العروس","مونتاج ٣ مقاطع ريلز احترافية وتغطية حية لستوري إنستغرام","تسليم الأصول كاملة برابط سحابي خاص"]}
  ]'::jsonb,
  '[
    {"id":"add-photo-reel","name":"مونتاج ريلز إضافي احترافي","price":80,"unitLabel":"لكل مقطع","description":"مونتاج سينمائي عالي الدقة لمقطع إضافي مع مؤثرات وانتقالات أنيقة."},
    {"id":"add-photo-express","name":"تسليم فوري ومستعجل (نفس الليلة)","price":120,"unitLabel":"لكامل التغطية","description":"فرز وتسليم جميع اللقطات والريلز خلال أقل من 12 ساعة من انتهاء الحفل."}
  ]'::jsonb,
  '["مصورة جوال سعودية محترفة بخصوصية تامة","تصوير فوتوغرافي وفيديو ومونتاج ريلز بأعلى دقة 4K","تسليم الأصول كاملة عبر رابط سحابي خاص أو AirDrop"]'::jsonb,
  '["مكة المكرمة", "جدة"]'::jsonb,
  1
),
(
  'srv-kids-corner',
  'kids_corner',
  'kids-corner',
  'أركان ألعاب وتلوين الأطفال',
  'بيئة ترفيهية متكاملة تشغل الصغار بأنشطة إبداعية آمنة داخل صالة الفرح',
  'تجهيز ركن مخصص ومستقل للأطفال داخل قاعة الحفل يشمل طاولات وكراسي مريحة، وأنشطة الرسم والتلوين، والصلصال الآمن، وألعاب التفكير والتركيب تحت إشراف مشرفات متفرغات.',
  'fixed',
  400.00,
  4,
  NULL,
  '/images/lumir-kids-corner-1440.jpg',
  'ركن ألعاب وأنشطة الأطفال في مناسبات لومير',
  true,
  '[
    {"id":"pkg-kids-standard","name":"باقة الركن الفضي (حتى ١٥ طفلاً)","durationHours":4,"price":400,"features":["طاولات وكراسي أطفال مخصصة حتى ١٥ طفلاً","كراسات تلوين وألوان خشبية وشمعية غير سامة","صلصال طبي ونماذج تشكيل مبتكرة","مشرفة واحدة متفرغة ومؤهلة طوال الـ ٤ ساعات"]},
    {"id":"pkg-kids-gold","name":"باقة الركن الذهبي (حتى ٢٥ طفلاً)","durationHours":4,"price":650,"popular":true,"features":["تجهيز ركن متكامل يسع حتى ٢٥ طفلاً","أنشطة تلوين وصلصال ورسم على الوجوه بحسب رغبة الأهل","مشرفتان مؤهلتان طوال مدة الحفل"]}
  ]'::jsonb,
  '[
    {"id":"add-kids-facepaint","name":"رسم خفيف وآمن على وجوه الأطفال","price":100,"unitLabel":"لكامل الحفل","description":"ألوان مائية آمنة ومصرحة للبشرة مع رسومات تناسب الصغار."},
    {"id":"add-kids-extra-child","name":"طفل إضافي فوق سعة الباقة","price":20,"unitLabel":"لكل طفل","description":"توفير أدوات ومقعد مخصص لطفل إضافي."}
  ]'::jsonb,
  '["خامات تلوين وصلصال غير سامة مطابقة للمواصفات","مشرفات لومير مؤهلات وحريصات على سلامة وراحة الأطفال","تنظيم تسليم الأطفال للأمهات بنظام الأرقام الخاصة"]'::jsonb,
  '["مكة المكرمة", "جدة"]'::jsonb,
  2
),
(
  'srv-childcare',
  'childcare',
  'childcare',
  'رعاية ومرافقة الأطفال',
  'مرافقة شخصية وإشراف ترفيهي مساند لأطفالكِ أثناء الحفل لراحة بالكِ',
  'خدمة مرافقة فردية أو لمجموعات صغيرة من الأطفال أثناء حفلات الزفاف والمناسبات الخاصة، تشمل متابعة تغذية الطفل، ونظافته، وترفيهه، وحمايته من التوهان أو الاقتراب من منصات الصوت والكوشة.',
  'per_hour',
  250.00,
  3,
  NULL,
  '/images/lumir-childcare-1440.jpg',
  'مشرفة رعاية أطفال مؤهلة في حفلات لومير',
  true,
  '[
    {"id":"pkg-care-single","name":"مرافقة طفل واحد (٤ ساعات)","durationHours":4,"price":250,"features":["مشرفة خاصة مكرسة لطفل واحد فقط","متابعة الوجبات والترفيه والعناية طوال ٤ ساعات","توثيق تحركات الطفل واطمئنان الأم المستمر"]},
    {"id":"pkg-care-two","name":"مرافقة طفلين أخوين (٤ ساعات)","durationHours":4,"price":380,"popular":true,"features":["مشرفة خاصة لطفلين من عائلة واحدة","أنشطة هادئة ومتابعة مستمرة طوال الفعالية"]}
  ]'::jsonb,
  '[
    {"id":"add-care-hour","name":"ساعة مرافقة إضافية","price":60,"unitLabel":"لكل ساعة","description":"تمديد وقت المرافقة بعد انقضاء الساعات المحددة."}
  ]'::jsonb,
  '["إشراف متواصل وأمان تام يمنع اقتراب الصغار من المخاطر","تواصل مستمر مع الأم وتزويدها بالمستجدات لحظة بلحظة","مشرفات سعوديات لبقات وصبورات"]'::jsonb,
  '["مكة المكرمة", "جدة"]'::jsonb,
  3
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  packages = EXCLUDED.packages,
  addons = EXCLUDED.addons,
  updated_at = now();

-- 3. Seed Initial Reviews
INSERT INTO public.reviews (
  id, service_id, service_name, customer_name, city, rating, comment, verified_booking, booking_reference, criteria, is_published
)
VALUES
(
  'rev-photo-1',
  'srv-mobile-photo',
  'تصوير المناسبات بالجوال',
  'سارة العتيبي',
  'مكة المكرمة',
  5,
  'ما شاء الله تبارك الله، تصوير فخم وجودة الألوان احترافية جداً. تم استلام الريلز واللقطات في نفس الليلة خلال أقل من ١٢ ساعة! تعامل راقٍ وخصوصية تامة في قاعة الفرح.',
  true,
  'LMR-2610-101',
  '{"quality": 5, "punctuality": 5, "professionalism": 5}'::jsonb,
  true
),
(
  'rev-photo-2',
  'srv-mobile-photo',
  'تصوير المناسبات بالجوال',
  'أم ريان الغامدي',
  'جدة',
  5,
  'المصورة كانت في قمة الذوق واللباقة، التقطت تفاصيل الضيافة والكوشة بدقة فائقة بدون أي تطفل. أنصح بها كل عروس تبحث عن توثيق فوري بالآيفون.',
  true,
  'LMR-2610-102',
  '{"quality": 5, "punctuality": 5, "professionalism": 5}'::jsonb,
  true
),
(
  'rev-kids-1',
  'srv-kids-corner',
  'أركان ألعاب وتلوين الأطفال',
  'منيرة الشريف',
  'مكة المكرمة',
  5,
  'ركن الأطفال كان منقذاً في حفل زفاف أختي! الأمهات ارتاحوا واستمتعوا بالحفل والأطفال كانوا مبسوطين بالتلوين والصلصال الآمن. ديكور الركن فخم ومرتب وناسب ثيم القاعة.',
  true,
  'LMR-2610-104',
  '{"quality": 5, "punctuality": 5, "professionalism": 5}'::jsonb,
  true
),
(
  'rev-care-1',
  'srv-childcare',
  'رعاية ومرافقة الأطفال',
  'ابتسام الحربي',
  'جدة',
  5,
  'أمينة ومسؤولة وحريصة على كل طفل. نظام توثيق أرقام جوال الأمهات عند الدخول والخروج يعطي طمأنينة كاملة. شكراً لفريق لومير المبدع على الاحترافية.',
  true,
  'LMR-2610-106',
  '{"quality": 5, "punctuality": 5, "professionalism": 5}'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;
