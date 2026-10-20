-- ============================================================================
-- LUMIR | لومير — Production Database Schema & Security Policies (RLS)
-- Target: Supabase PostgreSQL (Project: lumir-bookings)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ADMIN PROFILES TABLE (حسابات وأدوار مسؤولي لومير)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'content_editor')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. BOOKINGS TABLE (جدول الحجوزات وطلبات المناسبات)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  city TEXT NOT NULL CHECK (city IN ('مكة المكرمة', 'جدة')),
  district TEXT,
  venue_name TEXT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  category_key TEXT,
  package_id TEXT,
  package_name TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  end_time TIME,
  duration_hours INTEGER NOT NULL DEFAULT 4,
  children_count INTEGER,
  children_ages TEXT,
  staff_count INTEGER,
  coverage_details TEXT,
  selected_activities JSONB DEFAULT '[]'::jsonb,
  selected_addons JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  admin_notes TEXT,
  subtotal_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  approved_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'pending_client_confirmation', 'confirmed', 'in_progress', 'completed', 'cancelled', 'new', 'pending')),
  preferred_contact_method TEXT DEFAULT 'whatsapp',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and conflict lookups
CREATE INDEX IF NOT EXISTS idx_bookings_date_city_status ON public.bookings (event_date, city, status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_date ON public.bookings (service_id, event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON public.bookings (booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON public.bookings (created_at DESC);

-- ============================================================================
-- 3. BOOKING EVENTS TABLE (سجل تدقيق وتتبع مسار الحجز)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_reference TEXT,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON public.booking_events (booking_id);

-- ============================================================================
-- 4. REVIEWS TABLE (تقييمات وآراء العميلات)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  city TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  verified_booking BOOLEAN NOT NULL DEFAULT false,
  booking_reference TEXT,
  criteria JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_service_published ON public.reviews (service_id, is_published);

-- ============================================================================
-- 5. SERVICES & CATALOG TABLES (كتالوج الخدمات والباقات)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  pricing_model TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  min_hours INTEGER DEFAULT 4,
  delivery_timeframe_hours INTEGER,
  image_url TEXT,
  image_alt TEXT,
  is_demo_image BOOLEAN DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  requires_space_and_setup BOOLEAN DEFAULT false,
  space_requirements TEXT,
  requires_parent_consent BOOLEAN DEFAULT false,
  compliance_notice TEXT,
  packages JSONB DEFAULT '[]'::jsonb,
  addons JSONB DEFAULT '[]'::jsonb,
  included_highlights JSONB DEFAULT '[]'::jsonb,
  applicable_cities JSONB DEFAULT '["مكة المكرمة", "جدة"]'::jsonb,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 6. COUPONS TABLE (أكواد الخصم والعروض)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_sar', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  min_order_amount_sar NUMERIC(10, 2) DEFAULT 0,
  max_discount_sar NUMERIC(10, 2),
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7. PORTFOLIO & FAQ TABLES (معرض الأعمال والأسئلة الشائعة)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.portfolio (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category_key TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  city TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8. SITE SETTINGS & CONFIG TABLE (إعدادات المتجر والسلايدر والمدن)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL,
  announcements JSONB NOT NULL,
  slider_settings JSONB NOT NULL,
  city_coverage JSONB NOT NULL,
  banners JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. AUDIT LOGS TABLE (سجل تدقيق العمليات الإدارية)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security definer function: check if caller is an active admin or manager
CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role IN ('admin', 'manager')
  );
$$;

-- Helper function: check if caller is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = 'admin'
  );
$$;

-- --------------------------------------------------------------------------
-- RLS: admin_profiles
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.admin_profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.admin_profiles FOR SELECT
  TO authenticated
  USING (is_admin_or_manager() OR id = auth.uid());

DROP POLICY IF EXISTS "Super admins can manage admin profiles" ON public.admin_profiles;
CREATE POLICY "Super admins can manage admin profiles"
  ON public.admin_profiles FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- --------------------------------------------------------------------------
-- RLS: bookings
-- --------------------------------------------------------------------------
-- 1. Public can insert new bookings (status must be new or pending_review)
DROP POLICY IF EXISTS "Public can submit new booking" ON public.bookings;
CREATE POLICY "Public can submit new booking"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (status IN ('new', 'pending_review', 'pending'));

-- 2. Staff can read all bookings
DROP POLICY IF EXISTS "Staff can read bookings" ON public.bookings;
CREATE POLICY "Staff can read bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (is_admin_or_manager());

-- 3. Staff can update bookings
DROP POLICY IF EXISTS "Staff can update bookings" ON public.bookings;
CREATE POLICY "Staff can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- 4. Only super admin can delete bookings
DROP POLICY IF EXISTS "Super admin can delete bookings" ON public.bookings;
CREATE POLICY "Super admin can delete bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (is_super_admin());

-- --------------------------------------------------------------------------
-- RLS: booking_events
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Staff can read booking events" ON public.booking_events;
CREATE POLICY "Staff can read booking events"
  ON public.booking_events FOR SELECT
  TO authenticated
  USING (is_admin_or_manager());

DROP POLICY IF EXISTS "Staff can insert booking events" ON public.booking_events;
CREATE POLICY "Staff can insert booking events"
  ON public.booking_events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

-- --------------------------------------------------------------------------
-- RLS: reviews
-- --------------------------------------------------------------------------
-- 1. Public can read ONLY published reviews
DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
CREATE POLICY "Public can view published reviews"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR is_admin_or_manager());

-- 2. Prevent direct anon insert from browser; new reviews must go through /api/reviews backend (service_role) or staff
DROP POLICY IF EXISTS "Public can submit review" ON public.reviews;

-- 3. Staff can view, insert, update or delete reviews
DROP POLICY IF EXISTS "Staff can manage reviews" ON public.reviews;
CREATE POLICY "Staff can manage reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- --------------------------------------------------------------------------
-- RLS: services, coupons, portfolio, faqs, site_settings
-- --------------------------------------------------------------------------
-- Public read access
DROP POLICY IF EXISTS "Public can read services" ON public.services;
CREATE POLICY "Public can read services" ON public.services FOR SELECT TO anon, authenticated USING (is_available = true OR is_admin_or_manager());

DROP POLICY IF EXISTS "Staff can manage services" ON public.services;
CREATE POLICY "Staff can manage services" ON public.services FOR ALL TO authenticated USING (is_admin_or_manager()) WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Public can validate coupons" ON public.coupons;
CREATE POLICY "Public can validate coupons" ON public.coupons FOR SELECT TO anon, authenticated USING (is_active = true OR is_admin_or_manager());

DROP POLICY IF EXISTS "Staff can manage coupons" ON public.coupons;
CREATE POLICY "Staff can manage coupons" ON public.coupons FOR ALL TO authenticated USING (is_admin_or_manager()) WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Public can view portfolio" ON public.portfolio;
CREATE POLICY "Public can view portfolio" ON public.portfolio FOR SELECT TO anon, authenticated USING (is_public = true OR is_admin_or_manager());

DROP POLICY IF EXISTS "Staff can manage portfolio" ON public.portfolio;
CREATE POLICY "Staff can manage portfolio" ON public.portfolio FOR ALL TO authenticated USING (is_admin_or_manager()) WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Public can view faqs" ON public.faqs;
CREATE POLICY "Public can view faqs" ON public.faqs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Staff can manage faqs" ON public.faqs;
CREATE POLICY "Staff can manage faqs" ON public.faqs FOR ALL TO authenticated USING (is_admin_or_manager()) WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Staff can update site settings" ON public.site_settings;
CREATE POLICY "Staff can update site settings" ON public.site_settings FOR ALL TO authenticated USING (is_admin_or_manager()) WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Staff can view audit logs" ON public.audit_logs;
CREATE POLICY "Staff can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (is_admin_or_manager());

DROP POLICY IF EXISTS "Staff can insert audit logs" ON public.audit_logs;
CREATE POLICY "Staff can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (is_admin_or_manager());

-- ============================================================================
-- 11. AUTOMATIC UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_services_updated_at ON public.services;
CREATE TRIGGER trigger_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
