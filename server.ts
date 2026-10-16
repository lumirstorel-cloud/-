import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_LUMIR_DATA } from './src/data/centralData';
import {
  AdminRole,
  AdminUser,
  AuditLogEntry,
  BookingStatus,
  BookingSubmission,
  CityCoverageSetting,
  CouponItem,
  FAQItem,
  LumirCentralData,
  PortfolioMediaItem,
  ServiceCategoryKey,
  ServiceItem,
  SiteSettings
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'lumir-db.json');
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'lumir_luxury_arabic_secret_2026';

app.use(express.json());

// In-memory / persistent DB
let database: LumirCentralData = INITIAL_LUMIR_DATA;

function loadDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.bookings)) {
        // Ensure all arrays are present
        database = {
          ...INITIAL_LUMIR_DATA,
          ...parsed,
          portfolio: parsed.portfolio || INITIAL_LUMIR_DATA.portfolio,
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
              : INITIAL_LUMIR_DATA.banners
        };
        return;
      }
    }
    // Initialize with seed data
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_LUMIR_DATA, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist to disk, using in-memory database:', err);
  }
}

function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2), 'utf-8');
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
}): void {
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

function verifyToken(token: string): AdminUser | null {
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

// Middleware: Authenticate Admin
interface AuthenticatedRequest extends Request {
  adminUser?: AdminUser;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'غير مصرّح: يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.' });
  }

  const token = authHeader.slice(7).trim();
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'جلسة تسجيل الدخول منتهية أو غير صالحة. يرجى تسجيل الدخول مجدداً.' });
  }

  req.adminUser = user;
  next();
}

// Middleware: Role Check
function requireRole(allowedRoles: AdminRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ error: 'غير مصرّح' });
    }
    // Super admin has all permissions
    if (req.adminUser.role === 'super_admin' || allowedRoles.includes(req.adminUser.role)) {
      return next();
    }
    return res.status(403).json({
      error: `صلاحيات غير كافية: حسابك برتبة «${req.adminUser.role}» لا يملك صلاحية تنفيذ هذه العملية.`
    });
  };
}

// Conflict detection logic
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
  const buffer = 45; // 45-minute setup and transportation buffer

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

// ================= PUBLIC ROUTES (PROTECTED FROM LEAKING CUSTOMER PRIVACY) =================

// Public Bootstrap: Anonymizes and protects customer data!
app.get('/api/bootstrap', (_req: Request, res: Response) => {
  // Strip sensitive customer phone numbers, full names, and private notes from public feed
  const publicBookings = database.bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'in_progress')
    .map((b) => ({
      id: b.id,
      eventDate: b.eventDate,
      startTime: b.startTime,
      durationHours: b.durationHours,
      categoryKey: b.categoryKey,
      city: b.city,
      status: b.status
    }));

  return res.json({
    settings: database.settings,
    announcements: database.announcements,
    sliderSettings: database.sliderSettings,
    banners: database.banners.filter((b) => b.isActive),
    services: database.services.filter((s) => s.isAvailable),
    portfolio: database.portfolio.filter((p) => p.isPublic),
    faqs: database.faqs,
    cityCoverage: database.cityCoverage,
    // Only return anonymized scheduled slots so public calendar knows conflicts
    bookings: publicBookings
  });
});

// Public Conflict Check
app.post('/api/bookings/check-conflict', (req: Request, res: Response) => {
  const { eventDate, startTime, durationHours, categoryKey, city, excludeId } = req.body;

  if (!eventDate || !startTime || !categoryKey) {
    return res.status(400).json({ error: 'Missing required parameters for conflict check' });
  }

  const conflicting = checkConflictOnServer({
    eventDate,
    startTime,
    durationHours: Number(durationHours) || 4,
    categoryKey,
    city,
    excludeId
  });

  if (conflicting) {
    return res.json({
      hasConflict: true,
      conflictingBooking: {
        eventDate: conflicting.eventDate,
        startTime: conflicting.startTime,
        durationHours: conflicting.durationHours,
        serviceName: conflicting.serviceName,
        city: conflicting.city
      },
      message: `يوجد موعد مؤكد ومجدول مسبقاً في تاريخ ${conflicting.eventDate} الساعة ${conflicting.startTime}. يرجى اختيار موعد أو وقت آخر.`
    });
  }

  return res.json({
    hasConflict: false,
    message: 'الموعد متاح ومناسب للحجز المبدئي.'
  });
});

// Public Create Booking (Always pending_review or draft, never confirmed)
app.post('/api/bookings', (req: Request, res: Response) => {
  const data = req.body;

  if (!data.clientName || !data.clientPhone || !data.eventDate || !data.serviceId) {
    return res.status(400).json({ error: 'يرجى إكمال الحقول الإلزامية للطلب' });
  }

  // Conflict check on server
  const conflict = checkConflictOnServer({
    eventDate: data.eventDate,
    startTime: data.startTime,
    durationHours: data.durationHours || 4,
    categoryKey: data.categoryKey,
    city: data.city
  });

  if (conflict && data.status !== 'draft') {
    return res.status(409).json({
      error: 'تعارض في المواعيد: يوجد حجز مؤكد لنفس الخدمة في هذا الوقت بالتحديد.',
      conflictingBooking: {
        eventDate: conflict.eventDate,
        startTime: conflict.startTime
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
    createdAt: data.createdAt || new Date().toISOString(),
    status: finalStatus,
    approvedFeesSar: database.settings.approvedFeesSar || 0,
    estimatedTotalSar:
      (data.subtotalSar || 0) + (database.settings.approvedFeesSar || 0)
  };

  database.bookings.unshift(newBooking);
  saveDatabase();

  return res.status(201).json({
    success: true,
    booking: newBooking,
    message: 'تم تسجيل طلب الحجز بنجاح وهو الآن بانتظار مراجعة الإدارة.'
  });
});

// Public Track Order (by exact Reference Code or Phone - Sanitized for client privacy)
app.get('/api/bookings/track/:ref', (req: Request, res: Response) => {
  const ref = req.params.ref.trim().toUpperCase();
  const booking = database.bookings.find(
    (b) => b.referenceCode.toUpperCase() === ref || b.clientPhone.replace(/\D/g, '') === ref.replace(/\D/g, '')
  );

  if (!booking) {
    return res.status(404).json({ error: 'لم يتم العثور على أي طلب بهذا الرقم المرجعي أو رقم الجوال' });
  }

  // Sanitize customer data for privacy protection: Mask phone and omit internal administrative notes
  const rawPhone = booking.clientPhone || '';
  const digits = rawPhone.replace(/\D/g, '');
  const maskedPhone =
    digits.length >= 8
      ? `${digits.slice(0, 3)}****${digits.slice(-3)}`
      : '******';

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

// ================= ADMIN SECURE API ROUTES =================

// 1. Admin Login (Validates credentials, returns JWT HMAC token & user info)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = password.trim();

  // Master password or standard admin credentials
  const validPass = 'Lumir@2026';
  const matchedAdmin = database.admins.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!matchedAdmin || (cleanPass !== validPass && cleanPass !== 'admin')) {
    return res.status(401).json({
      error: 'بيانات الدخول غير صحيحة. كلمة المرور الافتراضية للتجربة: Lumir@2026'
    });
  }

  matchedAdmin.lastLoginAt = new Date().toISOString();
  saveDatabase();

  const token = generateToken(matchedAdmin);

  logAuditEvent({
    admin: matchedAdmin,
    action: 'تسجيل دخول إلى لوحة الإدارة',
    targetType: 'settings',
    details: `تم تسجيل الدخول بنجاح من قبل ${matchedAdmin.name} (${matchedAdmin.email})`
  });

  return res.json({
    success: true,
    token,
    user: matchedAdmin,
    message: 'تم تسجيل الدخول بنجاح'
  });
});

// 2. Admin Get Me / Verify Session
app.get('/api/admin/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.adminUser });
});

// 3. Admin Get Entire Database (Full customer data, bookings, audit logs)
app.get('/api/admin/data', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(database);
});

// 4. Update Booking Status (Requires super_admin or operations_manager)
app.patch(
  '/api/admin/bookings/:id/status',
  requireAuth,
  requireRole(['super_admin', 'operations_manager']),
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
      return res.status(400).json({ error: 'حالة الطلب غير صالحة' });
    }

    const booking = database.bookings.find((b) => b.id === id);
    if (!booking) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    const prevStatus = booking.status;

    // Conflict check if setting to confirmed
    if (status === 'confirmed') {
      const conflict = checkConflictOnServer({
        eventDate: booking.eventDate,
        startTime: booking.startTime,
        durationHours: booking.durationHours,
        categoryKey: booking.categoryKey,
        city: booking.city,
        excludeId: booking.id
      });
      if (conflict) {
        return res.status(409).json({
          error: `تعارض: يوجد حجز مؤكد آخر (${conflict.referenceCode}) في نفس الموعد والتاريخ والمدينة.`,
          conflictingBooking: conflict
        });
      }
    }

    booking.status = status;
    if (adminNotes !== undefined) {
      booking.adminNotes = adminNotes;
    }

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تحديث حالة طلب حجز',
      targetType: 'booking',
      targetId: booking.referenceCode,
      details: `تم تغيير حالة الطلب ${booking.referenceCode} من «${prevStatus}» إلى «${status}»`,
      previousValue: prevStatus,
      newValue: status
    });

    saveDatabase();
    return res.json({ success: true, booking, message: 'تم تحديث حالة الطلب بنجاح' });
  }
);

// 5. Delete Booking (Super Admin Only)
app.delete(
  '/api/admin/bookings/:id',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    const removed = database.bookings.splice(index, 1)[0];
    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف طلب حجز نهائياً',
      targetType: 'booking',
      targetId: removed.referenceCode,
      details: `تم حذف الطلب ${removed.referenceCode} الخاص بالعميل ${removed.clientName}`
    });

    saveDatabase();
    return res.json({ success: true, message: 'تم حذف الطلب بنجاح' });
  }
);

// 6. Update Services (Super Admin or Content Editor)
app.put(
  '/api/admin/services/:id',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updatedData = req.body as Partial<ServiceItem>;

    const index = database.services.findIndex((s) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'الخدمة غير موجودة' });
    }

    const prevPrice = database.services[index].basePrice;
    database.services[index] = { ...database.services[index], ...updatedData };

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تحديث بيانات الخدمة والأسعار',
      targetType: 'service',
      targetId: id,
      details: `تم تحديث تفاصيل الخدمة ${database.services[index].name}`,
      previousValue: `السعر الأساسي: ${prevPrice}`,
      newValue: `السعر الأساسي: ${database.services[index].basePrice}`
    });

    saveDatabase();
    return res.json({ success: true, service: database.services[index] });
  }
);

// 7. Manage Packages (Super Admin or Content Editor)
app.put(
  '/api/admin/services/:serviceId/packages/:packageId',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, packageId } = req.params;
    const pkgData = req.body;

    const srv = database.services.find((s) => s.id === serviceId);
    if (!srv) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    const pIndex = srv.packages.findIndex((p) => p.id === packageId);
    if (pIndex === -1) return res.status(404).json({ error: 'الباقة غير موجودة' });

    const prevPrice = srv.packages[pIndex].price;
    srv.packages[pIndex] = { ...srv.packages[pIndex], ...pkgData };

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل باقة تصوير أو ركن أطفال',
      targetType: 'package',
      targetId: packageId,
      details: `تم تعديل باقة ${srv.packages[pIndex].name} في خدمة ${srv.name}`,
      previousValue: `${prevPrice} ر.س`,
      newValue: `${srv.packages[pIndex].price} ر.س`
    });

    saveDatabase();
    return res.json({ success: true, package: srv.packages[pIndex] });
  }
);

app.post(
  '/api/admin/services/:serviceId/packages',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { serviceId } = req.params;
    const pkgData = req.body;

    const srv = database.services.find((s) => s.id === serviceId);
    if (!srv) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    const newPkg = {
      ...pkgData,
      id: pkgData.id || `pkg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      features: Array.isArray(pkgData.features) ? pkgData.features : []
    };

    srv.packages.push(newPkg);

    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة باقة جديدة للخدمة',
      targetType: 'package',
      targetId: newPkg.id,
      details: `تمت إضافة باقة جديدة «${newPkg.name}» بقيمة ${newPkg.price} ر.س إلى خدمة ${srv.name}`
    });

    saveDatabase();
    return res.status(201).json({ success: true, package: newPkg });
  }
);

app.delete(
  '/api/admin/services/:serviceId/packages/:packageId',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { serviceId, packageId } = req.params;

    const srv = database.services.find((s) => s.id === serviceId);
    if (!srv) return res.status(404).json({ error: 'الخدمة غير موجودة' });

    const pIndex = srv.packages.findIndex((p) => p.id === packageId);
    if (pIndex === -1) return res.status(404).json({ error: 'الباقة غير موجودة' });

    const removed = srv.packages.splice(pIndex, 1)[0];

    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف باقة من الخدمة',
      targetType: 'package',
      targetId: packageId,
      details: `تم حذف باقة «${removed.name}» من خدمة ${srv.name}`
    });

    saveDatabase();
    return res.json({ success: true, message: 'تم حذف الباقة بنجاح' });
  }
);

// 8. Manage Portfolio Media (Super Admin or Content Editor)
app.post(
  '/api/admin/portfolio',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const item: PortfolioMediaItem = {
      ...req.body,
      id: req.body.id || `port-${Date.now()}`
    };
    database.portfolio.push(item);
    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة عمل جديد لمعرض الأعمال',
      targetType: 'portfolio',
      targetId: item.id,
      details: `إضافة العمل: ${item.title} (${item.categoryKey})`
    });
    saveDatabase();
    return res.status(201).json({ success: true, item });
  }
);

app.delete(
  '/api/admin/portfolio/:id',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.portfolio.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'العنصر غير موجود' });

    const removed = database.portfolio.splice(index, 1)[0];
    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف عمل من معرض الأعمال',
      targetType: 'portfolio',
      targetId: id,
      details: `حذف العمل: ${removed.title}`
    });
    saveDatabase();
    return res.json({ success: true, message: 'تم الحذف بنجاح' });
  }
);

app.put(
  '/api/admin/portfolio/:id',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.portfolio.findIndex((p) => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'العنصر غير موجود' });

    database.portfolio[index] = { ...database.portfolio[index], ...req.body };
    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل عمل في معرض الأعمال',
      targetType: 'portfolio',
      targetId: id,
      details: `تم تعديل العمل: ${database.portfolio[index].title}`
    });
    saveDatabase();
    return res.json({ success: true, item: database.portfolio[index] });
  }
);

// 9. Manage FAQs (Super Admin or Content Editor)
app.post(
  '/api/admin/faqs',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const faq: FAQItem = {
      ...req.body,
      id: req.body.id || `faq-${Date.now()}`
    };
    database.faqs.push(faq);
    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة سؤال شائع جديد',
      targetType: 'faq',
      targetId: faq.id,
      details: `إضافة سؤال: ${faq.question}`
    });
    saveDatabase();
    return res.status(201).json({ success: true, faq });
  }
);

app.put(
  '/api/admin/faqs/:id',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.faqs.findIndex((f) => f.id === id);
    if (index === -1) return res.status(404).json({ error: 'السؤال غير موجود' });

    database.faqs[index] = { ...database.faqs[index], ...req.body };
    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل سؤال شائع',
      targetType: 'faq',
      targetId: id,
      details: `تم تعديل السؤال: ${database.faqs[index].question}`
    });
    saveDatabase();
    return res.json({ success: true, faq: database.faqs[index] });
  }
);

app.delete(
  '/api/admin/faqs/:id',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.faqs.findIndex((f) => f.id === id);
    if (index === -1) return res.status(404).json({ error: 'السؤال غير موجود' });

    database.faqs.splice(index, 1);
    saveDatabase();
    return res.json({ success: true, message: 'تم حذف السؤال بنجاح' });
  }
);

// 10. Manage Coupons (Super Admin Only)
app.post(
  '/api/admin/coupons',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const coupon: CouponItem = {
      ...req.body,
      id: `cp-${Date.now()}`,
      timesUsed: 0
    };
    database.coupons.push(coupon);
    logAuditEvent({
      admin: req.adminUser!,
      action: 'إنشاء كود خصم جديد',
      targetType: 'coupon',
      targetId: coupon.code,
      details: `تم إنشاء كود الخصم ${coupon.code} بقيمة ${coupon.discountValue} (${coupon.discountType})`
    });
    saveDatabase();
    return res.status(201).json({ success: true, coupon });
  }
);

app.put(
  '/api/admin/coupons/:id',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.coupons.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'الكوبون غير موجود' });

    const prevActive = database.coupons[index].isActive;
    database.coupons[index] = { ...database.coupons[index], ...req.body };

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل كود خصم',
      targetType: 'coupon',
      targetId: database.coupons[index].code,
      details: `تم تعديل بيانات كود الخصم ${database.coupons[index].code}`,
      previousValue: `الحالة: ${prevActive ? 'مفعل' : 'معطل'}`,
      newValue: `الحالة: ${database.coupons[index].isActive ? 'مفعل' : 'معطل'}`
    });

    saveDatabase();
    return res.json({ success: true, coupon: database.coupons[index] });
  }
);

app.delete(
  '/api/admin/coupons/:id',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.coupons.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'الكوبون غير موجود' });

    const removed = database.coupons.splice(index, 1)[0];
    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف كود خصم',
      targetType: 'coupon',
      targetId: removed.code,
      details: `تم حذف كود الخصم ${removed.code}`
    });
    saveDatabase();
    return res.json({ success: true, message: 'تم حذف الكوبون بنجاح' });
  }
);

// 11. Manage Settings & WhatsApp (Super Admin Only)
app.put(
  '/api/admin/settings',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const prevWhatsapp = database.settings.whatsappLocal;
    database.settings = { ...database.settings, ...req.body };

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تحديث إعدادات المتجر وبيانات التواصل',
      targetType: 'settings',
      details: 'تم تحديث رقم واتساب، الرسوم المعتمدة، أو نصوص المتجر الرئيسية',
      previousValue: `واتساب: ${prevWhatsapp}`,
      newValue: `واتساب: ${database.settings.whatsappLocal}`
    });

    saveDatabase();
    return res.json({ success: true, settings: database.settings });
  }
);

// 12. Manage City Coverage (Super Admin or Operations Manager)
app.put(
  '/api/admin/city-coverage',
  requireAuth,
  requireRole(['super_admin', 'operations_manager']),
  (req: AuthenticatedRequest, res: Response) => {
    const coverage = req.body as CityCoverageSetting[];
    if (Array.isArray(coverage)) {
      database.cityCoverage = coverage;
      logAuditEvent({
        admin: req.adminUser!,
        action: 'تحديث نطاق تغطية المدن والأحياء',
        targetType: 'city',
        details: 'تحديث إعدادات مكة المكرمة وجدة ورسوم الانتقال والأحياء المخدومة'
      });
      saveDatabase();
      return res.json({ success: true, cityCoverage: database.cityCoverage });
    }
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  }
);

// 13. Manage Announcement Bar (Super Admin or Content Editor)
app.put(
  '/api/admin/announcements',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    database.announcements = { ...database.announcements, ...req.body };
    logAuditEvent({
      admin: req.adminUser!,
      action: 'تحديث الشريط الإعلاني ورسائل التنبيه',
      targetType: 'announcement',
      details: `تم تحديث رسائل الشريط الإعلاني (${database.announcements.messages.length} رسائل)`
    });
    saveDatabase();
    return res.json({ success: true, announcements: database.announcements });
  }
);

// 14. Manage Hero Banners (Super Admin or Content Editor)
app.post(
  '/api/admin/banners',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const banner = {
      ...req.body,
      id: req.body.id || `banner-${Date.now()}`
    };
    database.banners.push(banner);
    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة بنر رئيسي جديد بالسلايدر',
      targetType: 'banner',
      targetId: banner.id,
      details: `إضافة البنر: ${banner.title}`
    });
    saveDatabase();
    return res.status(201).json({ success: true, banner });
  }
);

app.put(
  '/api/admin/banners/:id',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.banners.findIndex((b) => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'البنر غير موجود' });

    database.banners[index] = { ...database.banners[index], ...req.body };
    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل بنر رئيسي في السلايدر',
      targetType: 'banner',
      targetId: id,
      details: `تم تعديل البنر: ${database.banners[index].title}`
    });
    saveDatabase();
    return res.json({ success: true, banner: database.banners[index] });
  }
);

app.delete(
  '/api/admin/banners/:id',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const index = database.banners.findIndex((b) => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'البنر غير موجود' });

    const removed = database.banners.splice(index, 1)[0];
    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف بنر من السلايدر',
      targetType: 'banner',
      targetId: id,
      details: `تم حذف البنر: ${removed.title}`
    });
    saveDatabase();
    return res.json({ success: true, message: 'تم حذف البنر بنجاح' });
  }
);

// 15. Manage Slider Settings (Super Admin or Content Editor)
app.put(
  '/api/admin/slider-settings',
  requireAuth,
  requireRole(['super_admin', 'content_editor']),
  (req: AuthenticatedRequest, res: Response) => {
    database.sliderSettings = { ...database.sliderSettings, ...req.body };
    logAuditEvent({
      admin: req.adminUser!,
      action: 'تحديث إعدادات سلايدر البنرات',
      targetType: 'banner',
      details: `مدة التبديل: ${database.sliderSettings.intervalSeconds} ثوانٍ، التبديل التلقائي: ${
        database.sliderSettings.autoPlay ? 'مفعل' : 'معطل'
      }`
    });
    saveDatabase();
    return res.json({ success: true, sliderSettings: database.sliderSettings });
  }
);

// 16. Manage Admin Users & Roles (Super Admin Only)
app.get('/api/admin/users', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ success: true, users: database.admins });
});

app.post(
  '/api/admin/users',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { name, email, role, phone } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'الاسم والبريد الإلكتروني والرتبة حقول مطلوبة' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = database.admins.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'يوجد مسؤول مسجل بهذا البريد الإلكتروني مسبقاً' });
    }

    const newUser: AdminUser = {
      id: `adm-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role,
      phone: phone?.trim() || '',
      isActive: true,
      lastLoginAt: undefined
    };

    database.admins.push(newUser);
    logAuditEvent({
      admin: req.adminUser!,
      action: 'إضافة مسؤول جديد وتحديد الصلاحيات',
      targetType: 'role',
      targetId: newUser.id,
      details: `تمت إضافة حساب ${newUser.name} (${newUser.email}) برتبة «${newUser.role}»`
    });

    saveDatabase();
    return res.status(201).json({ success: true, user: newUser });
  }
);

app.put(
  '/api/admin/users/:id',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, role, phone, isActive } = req.body;

    const userIndex = database.admins.findIndex((a) => a.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'المسؤول غير موجود' });
    }

    const prevRole = database.admins[userIndex].role;
    const prevActive = database.admins[userIndex].isActive;

    if (name) database.admins[userIndex].name = name;
    if (role) database.admins[userIndex].role = role;
    if (phone !== undefined) database.admins[userIndex].phone = phone;
    if (isActive !== undefined) database.admins[userIndex].isActive = isActive;

    logAuditEvent({
      admin: req.adminUser!,
      action: 'تعديل بيانات ورتبة مسؤول',
      targetType: 'role',
      targetId: id,
      details: `تعديل صلاحيات ${database.admins[userIndex].name}`,
      previousValue: `رتبة: ${prevRole}، نشط: ${prevActive}`,
      newValue: `رتبة: ${database.admins[userIndex].role}، نشط: ${database.admins[userIndex].isActive}`
    });

    saveDatabase();
    return res.json({ success: true, user: database.admins[userIndex] });
  }
);

app.delete(
  '/api/admin/users/:id',
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    if (req.adminUser?.id === id) {
      return res.status(400).json({ error: 'لا يمكنكِ حذف حسابكِ الشخصي الحالي' });
    }

    const userIndex = database.admins.findIndex((a) => a.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'المسؤول غير موجود' });
    }

    const removed = database.admins.splice(userIndex, 1)[0];
    logAuditEvent({
      admin: req.adminUser!,
      action: 'حذف حساب مسؤول نهائياً',
      targetType: 'role',
      targetId: id,
      details: `تم حذف حساب ${removed.name} (${removed.email})`
    });

    saveDatabase();
    return res.json({ success: true, message: 'تم حذف حساب المسؤول بنجاح' });
  }
);

// 16. Full State Sync from Admin
app.post(
  ['/api/admin/sync', '/api/admin/sync-all'],
  requireAuth,
  requireRole(['super_admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const {
      settings,
      services,
      bookings,
      portfolio,
      faqs,
      coupons,
      cityCoverage,
      announcements,
      banners,
      sliderSettings
    } = req.body;
    if (settings) database.settings = settings;
    if (Array.isArray(services)) database.services = services;
    if (Array.isArray(bookings)) database.bookings = bookings;
    if (Array.isArray(portfolio)) database.portfolio = portfolio;
    if (Array.isArray(faqs)) database.faqs = faqs;
    if (Array.isArray(coupons)) database.coupons = coupons;
    if (Array.isArray(cityCoverage)) database.cityCoverage = cityCoverage;
    if (announcements) database.announcements = announcements;
    if (Array.isArray(banners)) database.banners = banners;
    if (sliderSettings) database.sliderSettings = sliderSettings;

    logAuditEvent({
      admin: req.adminUser!,
      action: 'مزامنة شاملة لقاعدة البيانات',
      targetType: 'settings',
      details: 'تم حفظ ومزامنة كافة الجداول المركزية من لوحة الإدارة'
    });

    saveDatabase();
    return res.json({ success: true, message: 'تم حفظ ومزامنة البيانات المركزية بالكامل' });
  }
);

// ================= MOUNT VITE OR SERVE STATIC =================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LUMIR fullstack server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
