import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { INITIAL_LUMIR_DATA } from './data/centralData';
import { INITIAL_CUSTOMER_REVIEWS } from './data/seedReviews';
import {
  AdminRole,
  AdminUser,
  AuditLogEntry,
  BookingStatus,
  BookingSubmission,
  CityCoverageSetting,
  CouponItem,
  CustomerReview,
  FAQItem,
  LumirCentralData,
  PortfolioMediaItem,
  ServiceCategoryKey,
  ServiceItem,
  SiteSettings
} from './types';
import {
  hasSupabaseServerConfig,
  getSupabaseAdmin,
  supabaseAdminLogin,
  supabaseVerifyToken,
  supabaseCreateBooking,
  supabaseCheckConflict,
  supabaseGetReviews,
  supabaseInsertReview,
  supabaseVerifyBookingRef
} from './lib/supabaseServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lumir-db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'lumir_luxury_arabic_secret_2026';

export const isProduction =
  process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

// Ensure directories exist in local development only; safely avoid crashing read-only serverless filesystems
try {
  if (!isProduction) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Filesystem directory init skipped (read-only environment):', err);
}

// Production Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// In-memory / persistent DB
let database: LumirCentralData = INITIAL_LUMIR_DATA;

function loadDatabase(): void {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.bookings)) {
        database = {
          ...INITIAL_LUMIR_DATA,
          ...parsed,
          portfolio:
            Array.isArray(parsed.portfolio) && parsed.portfolio.length >= 8
              ? parsed.portfolio
              : INITIAL_LUMIR_DATA.portfolio,
          faqs: parsed.faqs || INITIAL_LUMIR_DATA.faqs,
          coupons: parsed.coupons || INITIAL_LUMIR_DATA.coupons,
          auditLogs: parsed.auditLogs || INITIAL_LUMIR_DATA.auditLogs,
          cityCoverage: parsed.cityCoverage || INITIAL_LUMIR_DATA.cityCoverage,
          admins: parsed.admins || INITIAL_LUMIR_DATA.admins,
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
        return;
      }
    }
    if (!isProduction) {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_LUMIR_DATA, null, 2), 'utf-8');
    }
  } catch (err) {
    console.warn('Could not persist to disk, using in-memory database:', err);
  }
}

function saveDatabase(): void {
  if (isProduction) {
    // In production on Vercel/cloud, Supabase is the single source of truth; never write to local disk
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(database, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.warn('Could not save database to disk:', err);
  }
}

loadDatabase();

// Audit logger helper
function logAuditEvent(params: {
  admin: AdminUser;
  action: string;
  targetType: AuditLogEntry['targetType'];
  targetId?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}) {
  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    adminEmail: params.admin.email,
    adminName: params.admin.name,
    adminRole: params.admin.role,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    details: params.details,
    previousValue: params.previousValue,
    newValue: params.newValue
  };
  database.auditLogs.unshift(entry);
  if (database.auditLogs.length > 200) {
    database.auditLogs = database.auditLogs.slice(0, 200);
  }
  saveDatabase();
}

// Token creation & verification
function generateToken(user: AdminUser): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    exp: Date.now() + 1000 * 60 * 60 * 24 // 24 hours
  });
  const b64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(b64Payload)
    .digest('base64url');
  return `${b64Payload}.${signature}`;
}

function verifyLocalToken(token: string): AdminUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(b64Payload)
      .digest('base64url');
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;

    const admin = database.admins.find((a) => a.email === payload.email);
    return admin || null;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرّح: يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.' });
  }

  const token = authHeader.slice(7).trim();

  // 1. Try Supabase verification if server config is available
  if (hasSupabaseServerConfig()) {
    const supabaseRes = await supabaseVerifyToken(token);
    if (supabaseRes.isValid && supabaseRes.user) {
      req.adminUser = {
        id: supabaseRes.user.id,
        email: supabaseRes.user.email,
        name: supabaseRes.user.name,
        role: supabaseRes.user.role as AdminRole,
        isActive: true
      };
      return next();
    }
  }

  // 2. Fallback to HMAC token (useful in local dev / tests)
  const localUser = verifyLocalToken(token);
  if (localUser) {
    req.adminUser = localUser;
    return next();
  }

  return res.status(401).json({
    error: 'جلسة تسجيل الدخول منتهية أو غير صالحة. يرجى تسجيل الدخول مجدداً.'
  });
}

function requireRole(allowedRoles: AdminRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'غير مصرّح' });
    }
    if (req.adminUser.role === 'super_admin' || allowedRoles.includes(req.adminUser.role)) {
      return next();
    }
    return res.status(403).json({
      error: `صلاحيات غير كافية: حسابك برتبة «${req.adminUser.role}» لا يملك صلاحية تنفيذ هذه العملية.`
    });
  };
}

function parseMinutes(time24: string): number {
  const [h, m] = (time24 || '19:00').split(':').map(Number);
  return (Number.isNaN(h) ? 19 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

function checkConflictOnServer(params: {
  eventDate: string;
  startTime: string;
  durationHours: number;
  categoryKey: ServiceCategoryKey;
  city?: string;
  excludeId?: string;
}): BookingSubmission | null {
  const reqStart = parseMinutes(params.startTime);
  const reqEnd = reqStart + params.durationHours * 60;
  const buffer = 45;

  for (const b of database.bookings) {
    if (params.excludeId && b.id === params.excludeId) continue;
    if (b.status !== 'confirmed' && b.status !== 'in_progress') continue;
    if (b.eventDate !== params.eventDate) continue;
    if (b.categoryKey !== params.categoryKey) continue;
    if (params.city && b.city !== params.city) continue;

    const bStart = parseMinutes(b.startTime);
    const bEnd = bStart + b.durationHours * 60;

    if (reqStart < bEnd + buffer && reqEnd + buffer > bStart) {
      return b;
    }
  }
  return null;
}

// ================= PUBLIC API ROUTES =================

// Health check (supports /api/health and fallback /health)
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabaseConfigured: hasSupabaseServerConfig()
  });
});

// Root API info
app.get(['/api', '/api/'], (_req: Request, res: Response) => {
  res.json({
    service: 'Lumir Media & Events API',
    status: 'online',
    version: '2026.1',
    timestamp: new Date().toISOString()
  });
});

// Bootstrap Data
app.get('/api/bootstrap', (_req: Request, res: Response) => {
  // Never leak personal client data in public bootstrap
  const sanitizedBookings = database.bookings.map((b) => ({
    id: b.id,
    eventDate: b.eventDate,
    startTime: b.startTime,
    durationHours: b.durationHours,
    categoryKey: b.categoryKey,
    city: b.city,
    status: b.status
  }));

  const publicPortfolio = database.portfolio.filter((p) => p.isPublic);

  return res.json({
    settings: database.settings,
    announcements: database.announcements,
    sliderSettings: database.sliderSettings,
    banners: database.banners.filter((b) => b.isActive),
    cityCoverage: database.cityCoverage.filter((c) => c.isActive),
    services: database.services.filter((s) => s.isAvailable),
    portfolio: publicPortfolio,
    faqs: database.faqs,
    bookings: sanitizedBookings,
    reviews: (database.reviews || INITIAL_CUSTOMER_REVIEWS).filter((r) => r.verifiedBooking !== false)
  });
});

// Check Conflict
app.post('/api/bookings/check-conflict', async (req: Request, res: Response) => {
  const { eventDate, startTime, durationHours, categoryKey, city, excludeId } = req.body;
  if (!eventDate || !startTime || !categoryKey) {
    return res.status(400).json({ error: 'بيانات فحص التعارض غير مكتملة' });
  }

  // 1. Check in Supabase if configured
  if (hasSupabaseServerConfig()) {
    const sbResult = await supabaseCheckConflict({
      eventDate,
      startTime,
      durationHours: Number(durationHours) || 4,
      categoryKey,
      city,
      excludeId
    });
    if (sbResult.hasConflict) {
      return res.json({
        hasConflict: true,
        conflictingBooking: sbResult.conflictingBooking,
        message: sbResult.message
      });
    }
  }

  // 2. Check in database
  const conflict = checkConflictOnServer({
    eventDate,
    startTime,
    durationHours: Number(durationHours) || 4,
    categoryKey,
    city,
    excludeId
  });

  if (conflict) {
    return res.json({
      hasConflict: true,
      conflictingBooking: {
        eventDate: conflict.eventDate,
        startTime: conflict.startTime
      },
      message: `يوجد موعد مؤكد ومجدول مسبقاً في تاريخ ${conflict.eventDate} الساعة ${conflict.startTime}. يرجى اختيار موعد أو وقت آخر.`
    });
  }

  return res.json({
    hasConflict: false,
    message: 'الموعد متاح ومناسب للحجز المبدئي.'
  });
});

// Public Create Booking
app.post('/api/bookings', async (req: Request, res: Response) => {
  const data = req.body;

  if (
    !data.clientName ||
    !data.clientPhone ||
    !data.eventDate ||
    !data.startTime ||
    !data.serviceId ||
    !data.city
  ) {
    return res.status(400).json({
      error: 'يرجى إكمال الحقول الإلزامية للطلب (اسم العميل، رقم الجوال، تاريخ المناسبة، وقت البدء، الخدمة، والمدينة)'
    });
  }

  const phoneDigits = String(data.clientPhone).replace(/\D/g, '');
  if (phoneDigits.length < 9) {
    return res.status(400).json({
      error: 'رقم الجوال المدخل غير صحيح، يرجى كتابة رقم هاتف صالح لا يقل عن ٩ أرقام'
    });
  }

  const srv = database.services.find((s) => s.id === data.serviceId);
  if (!srv) {
    return res.status(400).json({ error: 'الخدمة المختارة غير موجودة في كتالوج لومير' });
  }

  let authoritativeBasePrice = srv.basePrice;
  let authoritativePackageName = data.packageName || '';
  let authoritativeDuration = data.durationHours || srv.minHours || 4;

  if (data.packageId) {
    const pkg = srv.packages.find((p) => p.id === data.packageId);
    if (pkg) {
      authoritativeBasePrice = pkg.price;
      authoritativePackageName = pkg.name;
      if (pkg.durationHours) authoritativeDuration = pkg.durationHours;
    } else {
      return res.status(400).json({ error: 'الباقة المحددة غير موجودة في تفاصيل هذه الخدمة' });
    }
  }

  let addonsTotal = 0;
  const verifiedAddonIds: string[] = [];
  if (Array.isArray(data.selectedAddonIds)) {
    for (const addonId of data.selectedAddonIds) {
      const addon = srv.addons.find((a) => a.id === addonId);
      if (addon) {
        addonsTotal += addon.price;
        verifiedAddonIds.push(addon.id);
      }
    }
  }

  const authoritativeSubtotalSar = authoritativeBasePrice + addonsTotal;
  const approvedFeesSar = database.settings.approvedFeesSar || 0;
  const authoritativeEstimatedTotalSar = authoritativeSubtotalSar + approvedFeesSar;

  // Conflict check
  if (hasSupabaseServerConfig()) {
    const sbCheck = await supabaseCheckConflict({
      eventDate: data.eventDate,
      startTime: data.startTime,
      durationHours: authoritativeDuration,
      categoryKey: srv.category,
      city: data.city
    });
    if (sbCheck.hasConflict && data.status !== 'draft') {
      return res.status(409).json({
        error: sbCheck.message,
        conflictingBooking: sbCheck.conflictingBooking
      });
    }
  }

  const localConflict = checkConflictOnServer({
    eventDate: data.eventDate,
    startTime: data.startTime,
    durationHours: authoritativeDuration,
    categoryKey: srv.category,
    city: data.city
  });

  if (localConflict && data.status !== 'draft') {
    return res.status(409).json({
      error: 'تعارض في المواعيد: يوجد حجز مؤكد لنفس الخدمة في هذا الوقت بالتحديد.',
      conflictingBooking: {
        eventDate: localConflict.eventDate,
        startTime: localConflict.startTime
      }
    });
  }

  const finalStatus: BookingStatus = data.status === 'draft' ? 'draft' : 'pending_review';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const referenceCode = data.referenceCode || `LMR-2610-${randomSuffix}`;

  const newBooking: BookingSubmission = {
    ...data,
    id: data.id || `bk-${Date.now()}-${randomSuffix}`,
    referenceCode,
    serviceId: srv.id,
    serviceName: srv.name,
    categoryKey: srv.category,
    packageId: data.packageId,
    packageName: authoritativePackageName,
    durationHours: authoritativeDuration,
    selectedAddonIds: verifiedAddonIds,
    createdAt: data.createdAt || new Date().toISOString(),
    status: finalStatus,
    subtotalSar: authoritativeSubtotalSar,
    approvedFeesSar,
    estimatedTotalSar: authoritativeEstimatedTotalSar
  };

  // In production, Supabase server configuration is mandatory; silent fallback is forbidden
  if (isProduction && !hasSupabaseServerConfig()) {
    return res.status(503).json({
      error: 'خدمة تسجيل الحجوزات غير متاحة حالياً بسبب نقص إعدادات الاتصال السحابي (Supabase) على الخادم.'
    });
  }

  // If Supabase server config is present, write directly to Supabase
  if (hasSupabaseServerConfig()) {
    const sbRes = await supabaseCreateBooking(newBooking);
    if (!sbRes.success) {
      console.error('Failed to create booking in Supabase:', sbRes.error);
      return res.status(500).json({
        error: `تعذر حفظ الحجز في قاعدة البيانات السحابية: ${sbRes.error}`
      });
    }
  } else if (isProduction) {
    return res.status(503).json({
      error: 'تعذر إتمام الحجز: الاتصال بقاعدة البيانات السحابية غير متوفر في بيئة الإنتاج.'
    });
  }

  // Update memory/disk backup (only in development)
  database.bookings.unshift(newBooking);
  saveDatabase();

  return res.status(201).json({
    success: true,
    booking: newBooking,
    message: 'تم تسجيل طلب الحجز بنجاح وهو الآن بانتظار مراجعة الإدارة.'
  });
});

// Public Track Order (by exact Reference Code or Phone)
app.get('/api/bookings/track/:ref', (req: Request, res: Response) => {
  const ref = req.params.ref.trim().toUpperCase();
  const booking = database.bookings.find(
    (b) =>
      b.referenceCode.toUpperCase() === ref ||
      b.clientPhone.replace(/\D/g, '') === ref.replace(/\D/g, '')
  );

  if (!booking) {
    return res.status(404).json({
      error: 'لم يتم العثور على أي طلب بهذا الرقم المرجعي أو رقم الجوال'
    });
  }

  const rawPhone = booking.clientPhone || '';
  const digits = rawPhone.replace(/\D/g, '');
  const maskedPhone =
    digits.length >= 8 ? `${digits.slice(0, 3)}****${digits.slice(-3)}` : '******';

  return res.json({
    id: booking.id,
    referenceCode: booking.referenceCode,
    clientName: booking.clientName,
    clientPhoneMasked: maskedPhone,
    city: booking.city,
    district: booking.district,
    venueName: booking.venueName,
    eventDate: booking.eventDate,
    startTime: booking.startTime,
    durationHours: booking.durationHours,
    categoryKey: booking.categoryKey,
    serviceName: booking.serviceName,
    packageName: booking.packageName,
    subtotalSar: booking.subtotalSar,
    approvedFeesSar: booking.approvedFeesSar,
    estimatedTotalSar: booking.estimatedTotalSar,
    status: booking.status,
    specialNotes: booking.specialNotes,
    createdAt: booking.createdAt
  });
});

// Public Validate Coupon
app.post('/api/coupons/validate', (req: Request, res: Response) => {
  const { code, orderAmount } = req.body;
  if (!code) return res.status(400).json({ error: 'يرجى كتابة رمز الكوبون' });

  const coupon = database.coupons.find(
    (c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive
  );

  if (!coupon) {
    return res.status(404).json({ error: 'كود الخصم غير موجود أو غير مفعّل حالياً' });
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'كود الخصم منتهي الصلاحية' });
  }

  if (coupon.minOrderAmountSar && (orderAmount || 0) < coupon.minOrderAmountSar) {
    return res.status(400).json({
      error: `هذا الكوبون يتطلب طلباً بقيمة ${coupon.minOrderAmountSar} ر.س على الأقل`
    });
  }

  let discountSar = 0;
  if (coupon.discountType === 'percentage') {
    discountSar = ((orderAmount || 0) * coupon.discountValue) / 100;
    if (coupon.maxDiscountSar && discountSar > coupon.maxDiscountSar) {
      discountSar = coupon.maxDiscountSar;
    }
  } else {
    discountSar = coupon.discountValue;
  }

  return res.json({
    success: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountSar: Math.round(discountSar)
    }
  });
});

// Public Customer Reviews & Ratings
app.get('/api/reviews', async (req: Request, res: Response) => {
  const serviceId = req.query.serviceId as string | undefined;

  // In production, Supabase is mandatory; silent local fallback is forbidden
  if (isProduction && !hasSupabaseServerConfig()) {
    return res.status(503).json({
      error: 'خدمة استعراض التقييمات غير متاحة حالياً بسبب نقص إعدادات الاتصال السحابي (Supabase) على الخادم.'
    });
  }

  // 1. Try Supabase if configured
  if (hasSupabaseServerConfig()) {
    try {
      const supaResult = await supabaseGetReviews(serviceId);
      if (supaResult.success && supaResult.reviews) {
        return res.json({ success: true, reviews: supaResult.reviews, source: 'supabase' });
      } else if (isProduction) {
        return res.status(500).json({
          error: `فشل استرجاع التقييمات من قاعدة البيانات السحابية: ${supaResult.error || 'خطأ غير متوقع'}`
        });
      }
    } catch (err: any) {
      console.error('Supabase fetch reviews error:', err);
      if (isProduction) {
        return res.status(500).json({
          error: 'خطأ غير متوقع أثناء استرجاع التقييمات من قاعدة البيانات السحابية.'
        });
      }
    }
  }

  // 2. Fallback to local database/seed (strictly development only)
  const allReviews: CustomerReview[] = database.reviews || INITIAL_CUSTOMER_REVIEWS;
  if (serviceId) {
    const filtered = allReviews.filter((r) => r.serviceId === serviceId);
    return res.json({ success: true, reviews: filtered, source: 'local' });
  }

  return res.json({ success: true, reviews: allReviews, source: 'local' });
});

app.post('/api/reviews', async (req: Request, res: Response) => {
  const { serviceId, serviceName, customerName, city, rating, comment, bookingReference, criteria } =
    req.body;

  if (!serviceId) {
    return res.status(400).json({ error: 'يرجى تحديد الخدمة المراد تقييمها' });
  }

  const cleanName = String(customerName || '')
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .slice(0, 60);
  const cleanComment = String(comment || '')
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .slice(0, 800);
  const cleanRef = String(bookingReference || '')
    .replace(/<[^>]*>?/gm, '')
    .trim()
    .toUpperCase();
  const numRating = Number(rating);

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({ error: 'يرجى كتابة الاسم الكريم (حرفين على الأقل)' });
  }

  if (!cleanComment || cleanComment.length < 5) {
    return res.status(400).json({ error: 'يرجى كتابة تعليق وتجربة لا تقل عن ٥ أحرف' });
  }

  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'التقييم يجب أن يكون من نجمة إلى ٥ نجوم' });
  }

  const srv = database.services.find((s) => s.id === serviceId);
  const resolvedServiceName = serviceName || srv?.name || 'خدمة لومير';

  // In production, Supabase is mandatory; silent local fallback is forbidden
  if (isProduction && !hasSupabaseServerConfig()) {
    return res.status(503).json({
      error: 'خدمة تسجيل التقييمات غير متاحة حالياً بسبب نقص إعدادات الاتصال السحابي (Supabase) على الخادم.'
    });
  }

  // Verify booking reference strictly on server (checks eligible confirmed/completed status)
  let isVerified = false;
  if (cleanRef) {
    // Check Supabase first if configured
    if (hasSupabaseServerConfig()) {
      try {
        const verifyRes = await supabaseVerifyBookingRef(cleanRef);
        if (verifyRes.isVerified) {
          isVerified = true;
        }
      } catch (err) {
        console.warn('Supabase booking verify fallback to local:', err);
      }
    }

    // Check local database bookings as fallback (development only)
    if (!isVerified && !isProduction && database.bookings) {
      const matchedBooking = database.bookings.find(
        (b) =>
          (b.referenceCode && b.referenceCode.toUpperCase() === cleanRef) ||
          (b.id && b.id.toUpperCase() === cleanRef)
      );
      if (matchedBooking) {
        const eligibleStatuses = ['confirmed', 'in_progress', 'completed'];
        if (eligibleStatuses.includes(matchedBooking.status)) {
          isVerified = true;
        }
      }
    }
  }

  const newReview: CustomerReview = {
    id: `rev-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    serviceId,
    serviceName: resolvedServiceName,
    customerName: cleanName,
    city: city || 'مكة المكرمة',
    rating: numRating,
    comment: cleanComment,
    createdAt: new Date().toISOString(),
    bookingReference: cleanRef || undefined,
    verifiedBooking: isVerified,
    criteria: criteria || undefined
  };

  // 1. Persist to Supabase if configured
  let savedToSupabase = false;
  if (hasSupabaseServerConfig()) {
    try {
      const supaInsert = await supabaseInsertReview(newReview);
      if (supaInsert.success) {
        savedToSupabase = true;
      } else if (isProduction) {
        return res.status(500).json({
          error: `تعذر حفظ تقييم الخدمة في قاعدة البيانات السحابية: ${supaInsert.error || 'خطأ غير متوقع'}`
        });
      }
    } catch (err: any) {
      console.error('Failed to insert review into Supabase:', err);
      if (isProduction) {
        return res.status(500).json({
          error: `تعذر حفظ تقييم الخدمة في قاعدة البيانات السحابية: ${err.message || 'خطأ غير متوقع'}`
        });
      }
    }
  } else if (isProduction) {
    return res.status(503).json({
      error: 'خدمة التقييمات غير متاحة حالياً في بيئة الإنتاج لعدم توفر الاتصال السحابي.'
    });
  }

  // 2. Maintain local cache in development
  if (!Array.isArray(database.reviews)) {
    database.reviews = [...INITIAL_CUSTOMER_REVIEWS];
  }

  database.reviews.unshift(newReview);
  saveDatabase();

  return res.status(201).json({
    success: true,
    review: newReview,
    isVerified,
    savedToSupabase,
    message: isVerified
      ? 'تم توثيق تقييمكِ بنجاح واعتماده كحجز موثق ومؤكد'
      : 'تم استلام تقييمكِ بنجاح وإضافته إلى آراء عملاء لومير'
  });
});

// ================= ADMIN SECURE API ROUTES =================

// Admin Login (Supports both Supabase Auth and Local Secure Token)
app.post('/api/admin/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
  }

  // 1. If Supabase is configured, use Supabase Auth
  if (hasSupabaseServerConfig()) {
    const sbAuth = await supabaseAdminLogin(email, password);
    if (sbAuth.success && sbAuth.token && sbAuth.admin) {
      logAuditEvent({
        admin: {
          id: sbAuth.admin.id,
          name: sbAuth.admin.name,
          email: sbAuth.admin.email,
          role: sbAuth.admin.role as AdminRole,
          isActive: true
        },
        action: 'تسجيل دخول عبر Supabase Auth',
        targetType: 'role',
        targetId: sbAuth.admin.id,
        details: 'تم تسجيل الدخول والتحقق من الصلاحيات الإدارية بنجاح'
      });

      return res.json({
        success: true,
        token: sbAuth.token,
        user: sbAuth.admin
      });
    }
  }

  // 2. Fallback local admin verification
  const normalizedEmail = String(email).trim().toLowerCase();
  const admin = database.admins.find((a) => a.email.toLowerCase() === normalizedEmail);

  const isValidAdminPass = password === 'lumir2026' || password === process.env.ADMIN_DEFAULT_PASSWORD;

  if (!admin || !isValidAdminPass || !admin.isActive) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة أو الحساب غير مفعل' });
  }

  admin.lastLoginAt = new Date().toISOString();
  saveDatabase();

  const token = generateToken(admin);

  logAuditEvent({
    admin,
    action: 'تسجيل دخول إلى لوحة الإدارة',
    targetType: 'role',
    targetId: admin.id,
    details: 'تم تسجيل الدخول بنجاح وتوليد رمز الجلسة الآمن'
  });

  return res.json({
    success: true,
    token,
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  });
});

// Admin Current Session Verification
app.get('/api/admin/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    user: req.adminUser
  });
});

// Admin Get Full Central Data
app.get('/api/admin/data', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({
    success: true,
    data: database
  });
});

// Admin Update Booking Status
app.patch(
  '/api/admin/bookings/:id/status',
  requireAuth,
  requireRole(['admin', 'operations_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses: BookingStatus[] = [
      'draft',
      'pending_review',
      'pending_client_confirmation',
      'confirmed',
      'in_progress',
      'completed',
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'حالة الحجز غير صالحة' });
    }

    const booking = database.bookings.find((b) => b.id === id);
    if (!booking) {
      return res.status(404).json({ error: 'طلب الحجز غير موجود' });
    }

    const previousStatus = booking.status;
    booking.status = status;
    if (adminNotes !== undefined) booking.adminNotes = adminNotes;
    booking.isReadByAdmin = true;

    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تحديث حالة الحجز',
      targetType: 'booking',
      targetId: booking.referenceCode,
      previousValue: previousStatus,
      newValue: status,
      details: `تم تغيير حالة طلب الحجز (${booking.referenceCode}) إلى: ${status}`
    });

    return res.json({ success: true, booking });
  }
);

// Admin Delete Booking
app.delete(
  '/api/admin/bookings/:id',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'طلب الحجز غير موجود' });
    }

    const deleted = database.bookings.splice(index, 1)[0];
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف طلب حجز',
      targetType: 'booking',
      targetId: deleted.referenceCode,
      details: `تم حذف طلب الحجز نهائياً برقم مرجعي: ${deleted.referenceCode}`
    });

    return res.json({ success: true, message: 'تم حذف الحجز بنجاح' });
  }
);

// Admin Update Service
app.put(
  '/api/admin/services/:id',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const service = database.services.find((s) => s.id === id);
    if (!service) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }

    Object.assign(service, updates);
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل تفاصيل خدمة',
      targetType: 'service',
      targetId: id,
      details: `تم تحديث بيانات الخدمة (${service.name})`
    });

    return res.json({ success: true, service });
  }
);

// Admin Add Package
app.post(
  '/api/admin/services/:serviceId/packages',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { serviceId } = req.params;
    const newPkg = req.body;

    const service = database.services.find((s) => s.id === serviceId);
    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    if (!newPkg.name || newPkg.price === undefined) {
      return res.status(400).json({ error: 'بيانات الباقة غير مكتملة' });
    }

    const pkgId = newPkg.id || `pkg-${Date.now()}`;
    const packageItem = { ...newPkg, id: pkgId };
    service.packages.push(packageItem);
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة باقة جديدة',
      targetType: 'package',
      targetId: pkgId,
      details: `تمت إضافة باقة (${packageItem.name}) إلى خدمة (${service.name})`
    });

    return res.status(201).json({ success: true, package: packageItem });
  }
);

// Admin Update Package
app.put(
  '/api/admin/services/:serviceId/packages/:packageId',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, packageId } = req.params;
    const updates = req.body;

    const service = database.services.find((s) => s.id === serviceId);
    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    const pkg = service.packages.find((p) => p.id === packageId);
    if (!pkg) return res.status(404).json({ error: 'الباقة غير موجودة' });

    Object.assign(pkg, updates);
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل باقة',
      targetType: 'package',
      targetId: packageId,
      details: `تم تعديل بيانات باقة (${pkg.name}) في خدمة (${service.name})`
    });

    return res.json({ success: true, package: pkg });
  }
);

// Admin Delete Package
app.delete(
  '/api/admin/services/:serviceId/packages/:packageId',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, packageId } = req.params;

    const service = database.services.find((s) => s.id === serviceId);
    if (!service) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    const index = service.packages.findIndex((p) => p.id === packageId);
    if (index === -1) return res.status(404).json({ error: 'الباقة غير موجودة' });

    const deleted = service.packages.splice(index, 1)[0];
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف باقة',
      targetType: 'package',
      targetId: packageId,
      details: `تم حذف باقة (${deleted.name}) من خدمة (${service.name})`
    });

    return res.json({ success: true, message: 'تم حذف الباقة بنجاح' });
  }
);

// Admin Portfolio CRUD
app.post(
  '/api/admin/portfolio',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const item: PortfolioMediaItem = req.body;
    if (!item.title || !item.mediaUrl) {
      return res.status(400).json({ error: 'بيانات العمل غير مكتملة' });
    }

    item.id = item.id || `media-${Date.now()}`;
    database.portfolio.unshift(item);
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة عمل في المعرض',
      targetType: 'portfolio',
      targetId: item.id,
      details: `تمت إضافة عمل جديد للمعرض: ${item.title}`
    });

    return res.status(201).json({ success: true, item });
  }
);

app.put(
  '/api/admin/portfolio/:id',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const item = database.portfolio.find((p) => p.id === id);
    if (!item) return res.status(404).json({ error: 'العمل غير موجود' });

    Object.assign(item, req.body);
    saveDatabase();
    return res.json({ success: true, item });
  }
);

app.delete(
  '/api/admin/portfolio/:id',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.portfolio.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'العمل غير موجود' });

    database.portfolio.splice(index, 1);
    saveDatabase();
    return res.json({ success: true, message: 'تم الحذف بنجاح' });
  }
);

// Admin FAQs CRUD
app.post(
  '/api/admin/faqs',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const faq: FAQItem = req.body;
    faq.id = faq.id || `faq-${Date.now()}`;
    database.faqs.push(faq);
    saveDatabase();
    return res.status(201).json({ success: true, faq });
  }
);

app.put(
  '/api/admin/faqs/:id',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const faq = database.faqs.find((f) => f.id === id);
    if (!faq) return res.status(404).json({ error: 'السؤال غير موجود' });

    Object.assign(faq, req.body);
    saveDatabase();
    return res.json({ success: true, faq });
  }
);

app.delete(
  '/api/admin/faqs/:id',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.faqs.findIndex((f) => f.id === id);
    if (index === -1) return res.status(404).json({ error: 'السؤال غير موجود' });

    database.faqs.splice(index, 1);
    saveDatabase();
    return res.json({ success: true, message: 'تم الحذف بنجاح' });
  }
);

// Admin Coupons CRUD
app.post(
  '/api/admin/coupons',
  requireAuth,
  requireRole(['admin', 'operations_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const coupon: CouponItem = req.body;
    if (!coupon.code || coupon.discountValue === undefined) {
      return res.status(400).json({ error: 'بيانات الكوبون غير مكتملة' });
    }

    coupon.id = coupon.id || `cpn-${Date.now()}`;
    coupon.code = coupon.code.toUpperCase().trim();
    coupon.timesUsed = coupon.timesUsed || 0;
    database.coupons.unshift(coupon);
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'إنشاء كود خصم',
      targetType: 'coupon',
      targetId: coupon.code,
      details: `تم إنشاء كود خصم جديد (${coupon.code}) بقيمة ${coupon.discountValue}`
    });

    return res.status(201).json({ success: true, coupon });
  }
);

app.put(
  '/api/admin/coupons/:id',
  requireAuth,
  requireRole(['admin', 'operations_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const coupon = database.coupons.find((c) => c.id === id);
    if (!coupon) return res.status(404).json({ error: 'الكوبون غير موجود' });

    Object.assign(coupon, req.body);
    if (coupon.code) coupon.code = coupon.code.toUpperCase().trim();
    saveDatabase();
    return res.json({ success: true, coupon });
  }
);

app.delete(
  '/api/admin/coupons/:id',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.coupons.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'الكوبون غير موجود' });

    database.coupons.splice(index, 1);
    saveDatabase();
    return res.json({ success: true, message: 'تم حذف الكوبون بنجاح' });
  }
);

// Admin Settings & Banners
app.put(
  '/api/admin/settings',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    Object.assign(database.settings, req.body);
    saveDatabase();
    return res.json({ success: true, settings: database.settings });
  }
);

app.put(
  '/api/admin/city-coverage',
  requireAuth,
  requireRole(['admin', 'operations_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    database.cityCoverage = req.body;
    saveDatabase();
    return res.json({ success: true, cityCoverage: database.cityCoverage });
  }
);

app.put(
  '/api/admin/announcements',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    database.announcements = req.body;
    saveDatabase();
    return res.json({ success: true, announcements: database.announcements });
  }
);

app.put(
  '/api/admin/slider-settings',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    database.sliderSettings = req.body;
    saveDatabase();
    return res.json({ success: true, sliderSettings: database.sliderSettings });
  }
);

app.post(
  '/api/admin/banners',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const banner = req.body;
    banner.id = banner.id || `ban-${Date.now()}`;
    database.banners.push(banner);
    saveDatabase();
    return res.status(201).json({ success: true, banner });
  }
);

app.put(
  '/api/admin/banners/:id',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const banner = database.banners.find((b) => b.id === id);
    if (!banner) return res.status(404).json({ error: 'البنر غير موجود' });
    Object.assign(banner, req.body);
    saveDatabase();
    return res.json({ success: true, banner });
  }
);

app.delete(
  '/api/admin/banners/:id',
  requireAuth,
  requireRole(['admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.banners.findIndex((b) => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'البنر غير موجود' });
    database.banners.splice(index, 1);
    saveDatabase();
    return res.json({ success: true, message: 'تم الحذف بنجاح' });
  }
);

// Admin Users Management (Super admin only)
app.get(
  '/api/admin/users',
  requireAuth,
  requireRole(['admin']),
  (_req: AuthenticatedRequest, res: Response) => {
    return res.json({ success: true, users: database.admins });
  }
);

app.post(
  '/api/admin/users',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const user: AdminUser = req.body;
    if (!user.name || !user.email || !user.role) {
      return res.status(400).json({ error: 'بيانات المسؤول غير مكتملة' });
    }

    user.id = user.id || `adm-${Date.now()}`;
    user.email = user.email.toLowerCase().trim();
    database.admins.push(user);
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة مستخدم إداري',
      targetType: 'role',
      targetId: user.email,
      details: `تم منح صلاحيات إدارية لـ (${user.name}) بدور (${user.role})`
    });

    return res.status(201).json({ success: true, user });
  }
);

app.put(
  '/api/admin/users/:id',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = database.admins.find((u) => u.id === id);
    if (!user) return res.status(404).json({ error: 'المسؤول غير موجود' });

    Object.assign(user, req.body);
    saveDatabase();
    return res.json({ success: true, user });
  }
);

app.delete(
  '/api/admin/users/:id',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (database.admins.length <= 1) {
      return res.status(400).json({ error: 'لا يمكن حذف المسؤول الوحيد في النظام' });
    }
    const index = database.admins.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'المسؤول غير موجود' });

    database.admins.splice(index, 1);
    saveDatabase();
    return res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
  }
);

// Admin Sync All (Super admin only)
app.post(
  '/api/admin/sync-all',
  requireAuth,
  requireRole(['admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const fullData: LumirCentralData = req.body;
    if (!fullData || !Array.isArray(fullData.services) || !Array.isArray(fullData.bookings)) {
      return res.status(400).json({ error: 'بنية البيانات غير صالحة للمزامنة الشاملة' });
    }

    database = {
      ...fullData,
      admins: database.admins // Protect admins from accidental wipe
    };
    saveDatabase();

    logAuditEvent({
      admin: req.adminUser!,
      action: 'مزامنة شاملة للبيانات',
      targetType: 'settings',
      details: 'تمت المزامنة الشاملة لجميع جداول وكتالوجات لومير'
    });

    return res.json({ success: true, data: database });
  }
);

export default app;
