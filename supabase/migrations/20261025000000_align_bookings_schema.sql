-- ============================================================================
-- Migration: 20261025000000_align_bookings_schema.sql
-- Project: LUMIR | لومير (lumir-bookings)
-- Description: Comprehensive migration to align the existing production
--              public.bookings table with the complete application model.
--
-- Baseline Physical Schema in Production:
--   id: uuid NOT NULL DEFAULT gen_random_uuid()
--   booking_number: text NOT NULL
--   customer_name: text NOT NULL
--   customer_phone: text NOT NULL
--   service_name: text NOT NULL
--   event_date: date NULL
--   event_time: text NULL
--   event_location: text NULL
--   notes: text NULL
--   total_amount: numeric NULL
--   status: text NOT NULL DEFAULT 'new'
--   created_at: timestamptz NOT NULL DEFAULT now()
--   updated_at: timestamptz NOT NULL DEFAULT now()
--
-- Safety Guarantees:
--   1. Zero destructive actions: no columns dropped or renamed.
--   2. Preserves existing status default ('new') and RLS policies.
--   3. Guarantees column existence before creating dependent indexes.
--   4. Fully idempotent using ADD COLUMN IF NOT EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add all missing application columns safely
-- ----------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS venue_name TEXT,
  ADD COLUMN IF NOT EXISTS service_id TEXT,
  ADD COLUMN IF NOT EXISTS category_key TEXT,
  ADD COLUMN IF NOT EXISTS package_id TEXT,
  ADD COLUMN IF NOT EXISTS package_name TEXT,
  ADD COLUMN IF NOT EXISTS end_time TEXT,
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS children_count INTEGER,
  ADD COLUMN IF NOT EXISTS children_ages TEXT,
  ADD COLUMN IF NOT EXISTS staff_count INTEGER,
  ADD COLUMN IF NOT EXISTS coverage_details TEXT,
  ADD COLUMN IF NOT EXISTS selected_activities JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS selected_addons JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approved_fees NUMERIC(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'whatsapp',
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ----------------------------------------------------------------------------
-- STEP 2: Non-destructive data alignment for legacy rows
-- Only set city if explicitly identified in event_location; otherwise keep NULL
-- ----------------------------------------------------------------------------
UPDATE public.bookings
SET city = CASE
  WHEN event_location ILIKE '%جدة%' THEN 'جدة'
  WHEN event_location ILIKE '%مكة%' THEN 'مكة المكرمة'
  ELSE NULL
END
WHERE city IS NULL;

-- ----------------------------------------------------------------------------
-- STEP 3: Performance and conflict detection indexes
-- (All referenced columns are verified to exist prior to index creation)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_category_key 
  ON public.bookings (category_key);

CREATE INDEX IF NOT EXISTS idx_bookings_date_city_status 
  ON public.bookings (event_date, city, status);

CREATE INDEX IF NOT EXISTS idx_bookings_service_date 
  ON public.bookings (service_id, event_date);

CREATE INDEX IF NOT EXISTS idx_bookings_number 
  ON public.bookings (booking_number);

CREATE INDEX IF NOT EXISTS idx_bookings_created 
  ON public.bookings (created_at DESC);

-- ----------------------------------------------------------------------------
-- STEP 4: Human-readable documentation for database schema auditing
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN public.bookings.city IS 'المدينة: مكة المكرمة أو جدة';
COMMENT ON COLUMN public.bookings.district IS 'الحي';
COMMENT ON COLUMN public.bookings.venue_name IS 'اسم القاعة أو المكان';
COMMENT ON COLUMN public.bookings.service_id IS 'المعرف الفريد للخدمة (مثل srv-mobile-photo)';
COMMENT ON COLUMN public.bookings.category_key IS 'تصنيف الخدمة (ضيافة، تصوير، ترفيه أطفال، صوتيات، صالون)';
COMMENT ON COLUMN public.bookings.package_id IS 'معرف الباقة المختارة';
COMMENT ON COLUMN public.bookings.package_name IS 'اسم الباقة المختارة';
COMMENT ON COLUMN public.bookings.end_time IS 'وقت انتهاء المناسبة';
COMMENT ON COLUMN public.bookings.duration_hours IS 'مدة الخدمة بالساعات';
COMMENT ON COLUMN public.bookings.subtotal_amount IS 'المبلغ الفرعي قبل الرسوم المعتمدة';
COMMENT ON COLUMN public.bookings.approved_fees IS 'الرسوم المعتمدة والمحددة في إعدادات الموقع';
COMMENT ON COLUMN public.bookings.total_amount IS 'المبلغ الإجمالي المعتمد للحجز';
COMMENT ON COLUMN public.bookings.preferred_contact_method IS 'طريقة التواصل المفضلة: whatsapp أو phone أو email';

-- ----------------------------------------------------------------------------
-- STEP 5: Notify PostgREST to reload its schema cache immediately
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
