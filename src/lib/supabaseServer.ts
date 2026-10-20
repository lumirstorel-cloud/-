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
    const dbPayload = {
      booking_number: booking.referenceCode,
      customer_name: booking.clientName,
      customer_phone: booking.clientPhone,
      city: booking.city,
      district: booking.district || null,
      venue_name: booking.venueName || null,
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
      approved_fees: booking.approvedFeesSar,
      total_amount: booking.estimatedTotalSar,
      status: 'pending_review',
      preferred_contact_method: booking.preferredContactMethod || 'whatsapp'
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      console.error('Supabase booking insert error:', error);
      return { success: false, error: error.message };
    }

    // Insert first event into booking_events
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

    const { data: bookings, error } = await query;
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
      if (b.category_key === params.categoryKey) {
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
      .select('id, booking_number, client_name, service_name, status')
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

