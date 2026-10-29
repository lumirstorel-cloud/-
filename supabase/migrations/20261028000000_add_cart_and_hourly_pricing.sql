-- ============================================================================
-- Migration: 20261028000000_add_cart_and_hourly_pricing.sql
-- Project: LUMIR | لومير (lumir-bookings)
-- Description: Non-destructive migration to support multi-item cart bookings,
--              customer user linking (Supabase Auth), and hourly service pricing.
--
-- Safety Guarantees:
--   1. Zero destructive actions: no columns dropped or renamed.
--   2. Preserves existing bookings and RLS policies.
--   3. All added columns are nullable or have safe defaults.
--   4. Fully idempotent using ADD COLUMN IF NOT EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Add customer account and cart order items to public.bookings
-- ----------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS customer_user_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS order_items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2);

-- ----------------------------------------------------------------------------
-- STEP 2: Index on customer_user_id for rapid user order history lookups
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_bookings_customer_user_id 
  ON public.bookings (customer_user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_email 
  ON public.bookings (customer_email);

-- ----------------------------------------------------------------------------
-- STEP 3: Add hourly pricing and duration controls to public.services (if table exists)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'services'
  ) THEN
    ALTER TABLE public.services
      ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS is_hourly_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS max_hours INTEGER DEFAULT 12,
      ADD COLUMN IF NOT EXISTS default_hours INTEGER DEFAULT 4,
      ADD COLUMN IF NOT EXISTS fixed_fee NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 4: Human-readable documentation for database schema auditing
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN public.bookings.customer_user_id IS 'المعرف الفريد للمستخدم في Supabase Auth';
COMMENT ON COLUMN public.bookings.customer_email IS 'البريد الإلكتروني للعميل المسجل';
COMMENT ON COLUMN public.bookings.order_items IS 'مصفوفة بنود سلة الطلب بتفاصيل الساعات وسعر الساعة وقت الحجز';
COMMENT ON COLUMN public.bookings.hourly_rate IS 'سعر الساعة المعتمد وقت تسجيل الحجز';

-- ----------------------------------------------------------------------------
-- STEP 5: Notify PostgREST to reload its schema cache immediately
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
