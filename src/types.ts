export type ServiceCategoryKey =
  | 'mobile_photography'
  | 'kids_corner'
  | 'childcare'
  | 'wedding_support';

export type PricingModel =
  | 'fixed'
  | 'per_hour'
  | 'per_staff'
  | 'per_child'
  | 'custom_quote';

export interface ServicePackage {
  id: string;
  name: string;
  durationHours?: number;
  price: number;
  features: string[];
  deliveryTimeframe?: string; // e.g. "٤٨ ساعة"
  popular?: boolean;
}

export interface ServiceAddonOption {
  id: string;
  name: string;
  price: number;
  unitLabel?: string; // e.g. "لكل طفل إضافي", "لكل ساعة إضافية"
  description: string;
}

export interface ServiceItem {
  id: string;
  category: ServiceCategoryKey;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  pricingModel: PricingModel;
  basePrice: number;
  priceNotice?: string;
  minHours?: number;
  deliveryTimeframeHours?: number; // e.g. 48 hours
  imageUrl: string;
  isDemoImage: boolean;
  isAvailable: boolean; // hide/show
  requiresSpaceAndSetup: boolean;
  spaceRequirements?: string;
  requiresParentConsent: boolean;
  complianceNotice?: string;
  packages: ServicePackage[];
  addons: ServiceAddonOption[];
  includedHighlights: string[];
  applicableCities: string[];
}

export type BookingStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_client_confirmation'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PreferredContactMethod = 'whatsapp' | 'call' | 'sms';

export interface BookingSubmission {
  id: string;
  referenceCode: string;
  createdAt: string;
  status: BookingStatus;
  serviceId: string;
  serviceName: string;
  categoryKey: ServiceCategoryKey;
  packageId?: string;
  packageName?: string;
  city: 'مكة المكرمة' | 'جدة';
  district: string;
  venueName?: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  durationHours: number;
  // Specific fields per service:
  coverageDetails?: string; // For mobile photography
  childrenCount?: number; // For kids & childcare
  childrenAges?: string; // For kids & childcare
  staffCount?: number; // For wedding support / supervisors
  selectedActivities?: string[]; // For kids corner (drawing, clay, face paint, henna)
  parentInstructions?: string; // For childcare
  parentConsentAgreed?: boolean;
  selectedAddonIds: string[];
  subtotalSar: number;
  approvedFeesSar: number; // الرسوم المعتمدة المحددة في الإعدادات
  estimatedTotalSar: number; // السعر التقديري الإجمالي
  payableAmountSar?: number; // المبلغ المستحق إن كان معروفاً
  isCustomQuoteRequired: boolean;
  clientName: string;
  clientPhone: string;
  preferredContactMethod: PreferredContactMethod;
  specialNotes?: string;
  agreedTermsAndPrivacy: boolean;
  agreedNonMedicalDisclaimer?: boolean;
  agreedPhotoPrivacy?: boolean;
  adminNotes?: string;
  isReadByAdmin?: boolean;
}

export interface SiteSettings {
  brandNameAr: string;
  brandNameEn: string;
  slogan: string;
  heroHeadline: string;
  heroSubheadline: string;
  whatsappLocal: string;
  whatsappInternational: string;
  email: string;
  workingHours: string;
  mobilePhotoDefaultDelivery: string;
  demoNotice: string;
  privacyPledge: string;
  childcareDisclaimer: string;
  approvedFeesSar: number; // الرسوم المعتمدة والمحددة في الإعدادات
  bookingNotice: string; // تنبيه مراجعة الإدارة قبل تأكيد الموعد
  allowPublicCoupons: boolean;
}

// Announcement Bar Messages & Settings
export interface AnnouncementMessage {
  id: string;
  text: string;
  badge?: string; // e.g. "عرض خاص", "موسم 2026", "مكة وجدة"
  linkText?: string;
  linkTarget?: string; // PageView name or whatsapp
  isActive: boolean;
}

export interface AnnouncementBarSettings {
  isEnabled: boolean;
  bgColor: string; // e.g. '#2C1E18'
  textColor: string; // e.g. '#FAF6F0'
  accentColor: string; // e.g. '#C8A96E'
  intervalSeconds: number; // rotation duration per message (default 3 or 4)
  isTicker: boolean; // true for scrolling ticker, false for smooth fading carousel
  messages: AnnouncementMessage[];
}

// Hero Banner Item & Slider Settings
export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  badge: string; // e.g. "✨ الأكثر طلباً في مكة وجدة"
  desktopImageUrl: string;
  mobileImageUrl?: string;
  ctaText: string;
  ctaLink: string; // PageView name or external
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  textPosition: 'right' | 'center' | 'left';
  overlayDarkness: number; // 0 to 1
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

export interface HeroSliderSettings {
  autoPlay: boolean;
  intervalSeconds: number; // default 3 seconds
  pauseOnHover: boolean;
  showArrows: boolean;
  showIndicators: boolean;
}

// Portfolio media item
export interface PortfolioMediaItem {
  id: string;
  title: string;
  categoryKey: ServiceCategoryKey;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  city?: 'مكة المكرمة' | 'جدة';
  isFeatured: boolean;
  isPublic: boolean;
  displayOrder: number;
}

// FAQ item
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

// Discount Coupon
export interface CouponItem {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed_sar';
  discountValue: number;
  minOrderAmountSar?: number;
  maxDiscountSar?: number;
  maxUses?: number;
  timesUsed: number;
  expiresAt?: string;
  isActive: boolean;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  adminName: string;
  adminRole: string;
  action: string;
  targetType:
    | 'booking'
    | 'service'
    | 'package'
    | 'settings'
    | 'coupon'
    | 'portfolio'
    | 'faq'
    | 'city'
    | 'banner'
    | 'announcement';
  targetId?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

// City coverage
export interface CityCoverageSetting {
  cityName: 'مكة المكرمة' | 'جدة';
  isActive: boolean;
  districts: string[];
  transportFeeSar: number;
  availableServiceKeys: ServiceCategoryKey[];
  notice?: string;
}

// Admin Role and User
export type AdminRole = 'super_admin' | 'operations_manager' | 'content_editor';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  phone?: string;
  lastLoginAt?: string;
}

export interface LumirCentralData {
  settings: SiteSettings;
  announcements: AnnouncementBarSettings;
  banners: HeroBanner[];
  sliderSettings: HeroSliderSettings;
  services: ServiceItem[];
  bookings: BookingSubmission[];
  portfolio: PortfolioMediaItem[];
  faqs: FAQItem[];
  coupons: CouponItem[];
  auditLogs: AuditLogEntry[];
  cityCoverage: CityCoverageSetting[];
  admins: AdminUser[];
}

export interface CartItem {
  id: string; // unique item id in cart
  serviceId: string;
  serviceName: string;
  categoryKey: ServiceCategoryKey;
  packageId?: string;
  packageName?: string;
  priceSar: number;
  deliveryTimeframe?: string;
  durationHours?: number;
  imageUrl?: string;
  selectedAddonIds?: string[];
  addedAt: string;
}

export interface FavoriteItem {
  id: string; // unique identifier e.g. `${serviceId}-${packageId || 'main'}`
  serviceId: string;
  serviceName: string;
  packageId?: string;
  packageName?: string;
  categoryKey: ServiceCategoryKey;
  priceSar: number;
  imageUrl?: string;
  addedAt: string;
}

export type PageView =
  | 'home'
  | 'catalog'
  | 'mobile-photography'
  | 'kids-corner'
  | 'childcare'
  | 'wedding-support'
  | 'service-detail'
  | 'booking'
  | 'booking-status'
  | 'about'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'admin';
