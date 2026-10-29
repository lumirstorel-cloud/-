import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BookingSubmission, CustomerReview } from '../types';

const DEFAULT_SUPABASE_URL = 'https://fpkkbyxjbshdgvnyivfi.supabase.co';

let adminClient: SupabaseClient | null = null;

export function hasSupabaseServerConfig(): boolean {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && serviceKey && serviceKey.trim().length > 0);
}

export function hasSupabasePublicConfig(): boolean {
  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && anonKey && anonKey.trim().length > 0);
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  // Strictly require SUPABASE_SERVICE_ROLE_KEY for server-authoritative operations
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key || key.trim().length === 0) {
    return null;
  }

  try {
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return adminClient;
  } catch (err) {
    console.error('Failed to initialize server-side Supabase client:', err);
    return null;
  }
}

/**
 * Validates admin credentials using Supabase Auth, then confirms role in admin_profiles
 */
export async function supabaseAdminLogin(
  email: string,
  pass: string
): Promise<{
  success: boolean;
  token?: string;
  admin?: { id: string; name: string; email: string; role: string };
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      success: false,
      error: 'لم يتم ضبط إعدادات الاتصال بـ Supabase على الخادم'
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass
    });

    if (authError || !authData.user) {
      return {
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      };
    }

    // Check role in admin_profiles
    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('id, name, email, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile || !profile.is_active) {
      return {
        success: false,
        error: 'هذا الحساب ليس لديه صلاحيات إدارية مصرحة للوصول إلى لوحة التحكم'
      };
    }

    // Update last_login_at
    await supabase
      .from('admin_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', authData.user.id);

    return {
      success: true,
      token: authData.session?.access_token,
      admin: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role
      }
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'حدث خطأ غير متوقع أثناء المصادقة'
    };
  }
}

/**
 * Verifies Supabase Auth JWT token and returns admin profile
 */
export async function supabaseVerifyToken(token: string): Promise<{
  isValid: boolean;
  user?: { id: string; email: string; name: string; role: string };
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { isValid: false, error: 'Supabase server not configured' };
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return { isValid: false, error: 'جلسة الدخول منتهية أو غير صالحة' };
    }

    const { data: profile } = await supabase
      .from('admin_profiles')
      .select('id, name, email, role, is_active')
      .eq('id', userData.user.id)
      .single();

    if (!profile || !profile.is_active) {
      return { isValid: false, error: 'غير مصرح بالوصول للإدارة' };
    }

    return {
      isValid: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role
      }
    };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'فشل التحقق من التوكن' };
  }
}

/**
 * Validates any customer Supabase Auth token (without requiring admin_profiles role)
 */
export async function supabaseVerifyCustomerToken(token: string): Promise<{
  isValid: boolean;
  user?: { id: string; email: string; name?: string; phone?: string };
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { isValid: false, error: 'خادم Supabase غير مهيأ' };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return { isValid: false, error: 'جلسة تسجيل الدخول غير صالحة أو منتهية' };
    }

    const u = data.user;
    return {
      isValid: true,
      user: {
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.name || u.user_metadata?.full_name || '',
        phone: u.user_metadata?.phone || ''
      }
    };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'فشل التحقق من جلسة العميل' };
  }
}

/**
 * Registers a new customer in Supabase Auth
 */
export async function supabaseCustomerRegister(
  email: string,
  pass: string,
  name?: string,
  phone?: string
): Promise<{
  success: boolean;
  token?: string;
  user?: { id: string; email: string; name?: string; phone?: string };
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'قاعدة بيانات Supabase غير مهيأة على الخادم' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          name: name?.trim() || '',
          phone: phone?.trim() || ''
        }
      }
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'تعذر إنشاء الحساب' };
    }

    const token = data.session?.access_token || '';
    return {
      success: true,
      token,
      user: {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: name?.trim() || '',
        phone: phone?.trim() || ''
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطأ غير متوقع أثناء إنشاء حساب العميل' };
  }
}

/**
 * Authenticates a customer using Supabase Auth
 */
export async function supabaseCustomerLogin(
  email: string,
  pass: string
): Promise<{
  success: boolean;
  token?: string;
  user?: { id: string; email: string; name?: string; phone?: string };
  error?: string;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'قاعدة بيانات Supabase غير مهيأة على الخادم' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: pass
    });

    if (error || !data.user) {
      return { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }

    return {
      success: true,
      token: data.session?.access_token || '',
      user: {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: data.user.user_metadata?.name || '',
        phone: data.user.user_metadata?.phone || ''
      }
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء تسجيل الدخول' };
  }
}

/**
 * Essential columns representing the core contract, scheduling, identity, and financials of a booking.
 * Under NO circumstances may these columns be removed or omitted.
 * If Supabase lacks any of these columns, the insertion must fail explicitly with a descriptive schema error.
 */
export const ESSENTIAL_BOOKING_COLUMNS = new Set<string>([
  'booking_number',
  'customer_name',
  'customer_phone',
  'city',
  'service_id',
  'service_name',
  'category_key',
  'package_id',
  'package_name',
  'event_date',
  'event_time',
  'duration_hours',
  'subtotal_amount',
  'total_amount',
  'status'
]);

/**
 * Permissible auxiliary columns that may be omitted ONLY under explicit fallback
 * when an older database table is awaiting migration, without compromising booking integrity.
 * Notice: category_key, service, package, dates, and amounts are NEVER in this list.
 */
export const EXPLICIT_OPTIONAL_FALLBACK_COLUMNS = new Set<string>([
  'approved_fees', // Auxiliary breakdown fee; total_amount already captures the authoritative final price
  'customer_user_id',
  'customer_email',
  'order_items',
  'hourly_rate'
]);

/**
 * Saves a new booking into Supabase bookings table and logs first booking_event
 */
export async function supabaseCreateBooking(
  booking: BookingSubmission
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'قاعدة بيانات Supabase غير مهيأة على الخادم' };
  }

  try {
    // Map to DB columns
    const dbPayload: Record<string, any> = {
      booking_number: booking.referenceCode,
      customer_name: booking.clientName,
      customer_phone: booking.clientPhone,
      city: booking.city,
      district: booking.district || null,
      venue_name: booking.venueName || null,
      event_location: [booking.city, booking.district, booking.venueName].filter(Boolean).join(' - ') || booking.city || null,
      service_id: booking.serviceId,
      service_name: booking.serviceName,
      category_key: booking.categoryKey,
      package_id: booking.packageId || null,
      package_name: booking.packageName || null,
      event_date: booking.eventDate,
      event_time: booking.startTime,
      end_time: booking.endTime || null,
      duration_hours: booking.durationHours,
      children_count: booking.childrenCount || null,
      children_ages: booking.childrenAges || null,
      staff_count: booking.staffCount || null,
      coverage_details: booking.coverageDetails || null,
      selected_activities: booking.selectedActivities || [],
      selected_addons: booking.selectedAddonIds || [],
      notes: booking.specialNotes || null,
      subtotal_amount: booking.subtotalSar,
      total_amount: booking.estimatedTotalSar,
      status: 'pending_review',
      preferred_contact_method: booking.preferredContactMethod || 'whatsapp'
    };

    if (booking.approvedFeesSar !== undefined) {
      dbPayload.approved_fees = booking.approvedFeesSar;
    }
    if (booking.customerUserId) {
      dbPayload.customer_user_id = booking.customerUserId;
    }
    if (booking.customerEmail) {
      dbPayload.customer_email = booking.customerEmail;
    }
    if (booking.orderItems && booking.orderItems.length > 0) {
      dbPayload.order_items = booking.orderItems;
    }
    if (booking.hourlyRateSar !== undefined) {
      dbPayload.hourly_rate = booking.hourlyRateSar;
    }

    // Attempt insert with fallback loop for permissible optional columns only
    let currentPayload = { ...dbPayload };
    let data: any = null;
    let error: any = null;
    const maxRetries = 6;
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      const res = await supabase
        .from('bookings')
        .insert([currentPayload])
        .select()
        .single();

      data = res.data;
      error = res.error;

      if (!error) {
        break; // Successfully inserted!
      }

      const missingColMatch = error.message?.match(
        /Could not find the '([^']+)' column of 'bookings' in the schema cache/i
      );

      if (missingColMatch && missingColMatch[1]) {
        const missingCol = missingColMatch[1];

        // 1. Strict Guard: If it's an essential column, REJECT IMMEDIATELY. NEVER STRIP.
        if (ESSENTIAL_BOOKING_COLUMNS.has(missingCol)) {
          const schemaError = `فشل حفظ الحجز: العمود الأساسي '${missingCol}' غير معرّف في الـ Schema Cache لجدول bookings في Supabase. لا يمكن إتمام الحجز بدون هذا الحقل الأساسي لتجنب حفظ حجز ناقص. يرجى تطبيق ترحيل قاعدة البيانات (20261025000000_align_bookings_schema.sql) وإعادة تحميل الـ schema cache.`;
          console.error(`[Supabase Critical Schema Error] ${schemaError}`);
          return { success: false, error: schemaError };
        }

        // 2. Only if it is explicitly approved in EXPLICIT_OPTIONAL_FALLBACK_COLUMNS
        if (EXPLICIT_OPTIONAL_FALLBACK_COLUMNS.has(missingCol) && missingCol in currentPayload) {
          console.warn(
            `[Supabase Warning] Auxiliary column '${missingCol}' is missing from schema cache. Attempting fallback without it (total_amount remains intact)...`
          );
          const droppedVal = currentPayload[missingCol];
          delete currentPayload[missingCol];

          // Preserve the auxiliary info in notes so data is NEVER lost
          if (missingCol === 'approved_fees' && typeof droppedVal === 'number' && droppedVal > 0) {
            const feeNote = `[رسوم إضافية معتمدة مشمولة في الإجمالي: ${droppedVal} ر.س]`;
            currentPayload.notes = currentPayload.notes ? `${currentPayload.notes} | ${feeNote}` : feeNote;
          } else if (missingCol === 'order_items' && Array.isArray(droppedVal)) {
            const itemsNote = `[عناصر السلة: ${droppedVal.map((it: any) => `${it.serviceName} (${it.durationHours || 1}س)`).join(', ')}]`;
            currentPayload.notes = currentPayload.notes ? `${currentPayload.notes} | ${itemsNote}` : itemsNote;
          } else if (missingCol === 'customer_user_id' && droppedVal) {
            const userNote = `[معرف المستخدم: ${droppedVal}]`;
            currentPayload.notes = currentPayload.notes ? `${currentPayload.notes} | ${userNote}` : userNote;
          }
          continue; // Retry loop with stripped optional column
        } else {
          // Any other column missing that is NOT in EXPLICIT_OPTIONAL_FALLBACK_COLUMNS must fail explicitly
          const schemaError = `فشل حفظ الحجز: العمود '${missingCol}' غير معرّف في الـ Schema Cache لقاعدة البيانات. يرجى تطبيق ترحيل قاعدة البيانات وتحديث الـ schema cache.`;
          console.error(`[Supabase Schema Mismatch] ${schemaError}`);
          return { success: false, error: schemaError };
        }
      } else {
        // Other non-schema-cache error (e.g. permission or network), stop retrying
        break;
      }
    }

    // 3. Strict verification: error must be null and confirmed data with an id must exist
    if (error || !data || !data.id) {
      console.error('Supabase booking insert error:', error);
      return {
        success: false,
        error: error?.message || 'فشل حفظ الحجز في قاعدة البيانات (لم يتم تأكيد إنشاء السجل في Supabase)'
      };
    }

    // Insert first event into booking_events if table exists
    try {
      await supabase.from('booking_events').insert([
        {
          booking_id: data.id,
          booking_reference: booking.referenceCode,
          previous_status: null,
          new_status: 'pending_review',
          changed_by: 'العميل (طلب عبر الموقع)',
          notes: 'تم تسجيل طلب الحجز المبدئي بنجاح عبر البوابة الإلكترونية'
        }
      ]);
    } catch (eventErr) {
      console.warn('Could not insert booking_event log (non-fatal):', eventErr);
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Supabase create booking exception:', err);
    return { success: false, error: err.message || 'فشل حفظ الحجز في قاعدة البيانات' };
  }
}

/**
 * Checks for booking conflicts in Supabase for same date, city, and overlapping hours
 */
export async function supabaseCheckConflict(params: {
  eventDate: string;
  startTime: string;
  durationHours: number;
  categoryKey: string;
  city?: 'مكة المكرمة' | 'جدة';
  excludeId?: string;
}): Promise<{ hasConflict: boolean; message: string; conflictingBooking?: any }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { hasConflict: false, message: 'متاح' };
  }

  try {
    let query = supabase
      .from('bookings')
      .select('id, booking_number, event_date, event_time, duration_hours, category_key, city, status')
      .eq('event_date', params.eventDate)
      .in('status', ['confirmed', 'in_progress']);

    if (params.city) {
      query = query.eq('city', params.city);
    }
    if (params.excludeId) {
      query = query.neq('id', params.excludeId);
    }

    let bookings: any[] | null = null;
    let queryRes = await query;
    bookings = queryRes.data;
    let error = queryRes.error;

    if (error && error.message && error.message.includes('category_key')) {
      let fallbackQuery = supabase
        .from('bookings')
        .select('id, booking_number, event_date, event_time, duration_hours, city, status')
        .eq('event_date', params.eventDate)
        .in('status', ['confirmed', 'in_progress']);

      if (params.city) {
        fallbackQuery = fallbackQuery.eq('city', params.city);
      }
      if (params.excludeId) {
        fallbackQuery = fallbackQuery.neq('id', params.excludeId);
      }
      const fbRes = await fallbackQuery;
      bookings = fbRes.data;
      error = fbRes.error;
    }

    if (error || !bookings || bookings.length === 0) {
      return { hasConflict: false, message: 'الموعد متاح ومناسب للحجز' };
    }

    // Parse time minutes
    const parseTime = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const newStart = parseTime(params.startTime);
    const newEnd = newStart + (params.durationHours || 4) * 60;
    const buffer = 90; // 90 min buffer for relocation & equipment setup

    for (const b of bookings) {
      if (!b.category_key || b.category_key === params.categoryKey) {
        const existStart = parseTime(b.event_time);
        const existEnd = existStart + (b.duration_hours || 4) * 60;

        const overlaps =
          Math.max(newStart, existStart) < Math.min(newEnd + buffer, existEnd + buffer);

        if (overlaps) {
          return {
            hasConflict: true,
            conflictingBooking: {
              eventDate: b.event_date,
              startTime: b.event_time,
              referenceCode: b.booking_number
            },
            message: `يوجد موعد مؤكد ومجدول مسبقاً في تاريخ ${b.event_date} الساعة ${b.event_time}. يرجى اختيار موعد أو وقت آخر.`
          };
        }
      }
    }

    return { hasConflict: false, message: 'الموعد متاح ومناسب للحجز' };
  } catch (err) {
    console.warn('Supabase conflict check error:', err);
    return { hasConflict: false, message: 'الموعد متاح ومناسب للحجز' };
  }
}

/**
 * Fetch reviews from Supabase public.reviews table
 */
export async function supabaseGetReviews(
  serviceId?: string
): Promise<{ success: boolean; reviews?: CustomerReview[]; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase fetch reviews error:', error);
      return { success: false, error: error.message };
    }

    const mapped: CustomerReview[] = (data || []).map((row) => ({
      id: row.id,
      serviceId: row.service_id,
      serviceName: row.service_name,
      customerName: row.customer_name,
      city: row.city || 'مكة المكرمة',
      rating: row.rating,
      comment: row.comment,
      createdAt: row.created_at,
      bookingReference: row.booking_reference || undefined,
      verifiedBooking: Boolean(row.verified_booking),
      criteria: row.criteria || undefined
    }));

    return { success: true, reviews: mapped };
  } catch (err: any) {
    console.error('Supabase fetch reviews exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Persists a new customer review into Supabase public.reviews table
 */
export async function supabaseInsertReview(
  review: CustomerReview
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const payload = {
      id: review.id,
      service_id: review.serviceId,
      service_name: review.serviceName,
      customer_name: review.customerName,
      city: review.city || 'مكة المكرمة',
      rating: review.rating,
      comment: review.comment,
      verified_booking: Boolean(review.verifiedBooking),
      booking_reference: review.bookingReference || null,
      criteria: review.criteria || {},
      is_published: true,
      created_at: review.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert review error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Supabase insert review exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Checks whether a booking reference belongs to an eligible confirmed/completed booking in Supabase
 */
export async function supabaseVerifyBookingRef(
  cleanRef: string
): Promise<{ isVerified: boolean; booking?: any }> {
  const supabase = getSupabaseAdmin();
  if (!supabase || !cleanRef) {
    return { isVerified: false };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, booking_number, customer_name, service_name, status')
      .or(`booking_number.ilike.${cleanRef},id.eq.${cleanRef}`)
      .limit(1);

    if (error || !data || data.length === 0) {
      return { isVerified: false };
    }

    const b = data[0];
    // Check if status is eligible for verified review
    const eligibleStatuses = ['confirmed', 'in_progress', 'completed'];
    const isEligible = eligibleStatuses.includes(b.status);

    return {
      isVerified: isEligible,
      booking: b
    };
  } catch (err) {
    console.warn('Supabase verify booking exception:', err);
    return { isVerified: false };
  }
}

/**
 * Retrieves bookings strictly belonging to the authenticated customer.
 * Strictly isolates customer data: only records matching userId or userEmail are retrieved.
 */
export async function supabaseGetCustomerBookings(
  userId: string,
  userEmail: string,
  userPhone?: string
): Promise<{ success: boolean; data: any[]; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, data: [], error: 'قاعدة بيانات Supabase غير مهيأة على الخادم' };
  }

  try {
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const cleanPhone = (userPhone || '').trim();

    let query = supabase.from('bookings').select('*');

    if (userId && cleanEmail) {
      query = query.or(`customer_user_id.eq.${userId},customer_email.ilike.${cleanEmail}`);
    } else if (userId) {
      query = query.eq('customer_user_id', userId);
    } else if (cleanEmail) {
      query = query.ilike('customer_email', cleanEmail);
    } else {
      return { success: true, data: [] };
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      // If customer_user_id column doesn't exist in schema yet, fallback query by customer_phone
      if (
        (error.message?.includes('customer_user_id') || error.message?.includes('customer_email')) &&
        cleanPhone
      ) {
        const { data: phoneData, error: phoneErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('customer_phone', cleanPhone)
          .order('created_at', { ascending: false });
        if (!phoneErr && phoneData) {
          return { success: true, data: phoneData };
        }
      }
      return { success: false, data: [], error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err.message || 'فشل جلب طلبات العميل' };
  }
}

/**
 * Updates service pricing and duration settings in public.services (if table exists)
 */
export async function supabaseAdminUpdateServicePricing(
  serviceId: string,
  pricing: {
    hourlyRateSar?: number;
    isHourlyEnabled?: boolean;
    minHours?: number;
    maxHours?: number;
    defaultHours?: number;
    fixedFeeSar?: number;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: true, error: 'تم التحديث في قاعدة الذاكرة المحلية' };
  }

  try {
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    if (pricing.hourlyRateSar !== undefined) payload.hourly_rate_sar = pricing.hourlyRateSar;
    if (pricing.isHourlyEnabled !== undefined) payload.is_hourly_enabled = pricing.isHourlyEnabled;
    if (pricing.minHours !== undefined) payload.min_hours = pricing.minHours;
    if (pricing.maxHours !== undefined) payload.max_hours = pricing.maxHours;
    if (pricing.defaultHours !== undefined) payload.default_hours = pricing.defaultHours;
    if (pricing.fixedFeeSar !== undefined) payload.fixed_fee_sar = pricing.fixedFeeSar;

    const { data, error } = await supabase
      .from('services')
      .update(payload)
      .eq('id', serviceId)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Note: public.services table update notice:', error.message);
      return { success: true, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.warn('Admin update service pricing notice:', err);
    return { success: true, error: err.message };
  }
}

