-- ============================================================================
-- Migration: 20261024000000_add_approved_fees_to_bookings.sql
-- Project: LUMIR | لومير (lumir-bookings)
-- Description: Adds 'approved_fees' column to 'bookings' table safely.
-- Note: Reviewable proposed migration. DO NOT execute without review.
-- ============================================================================

-- 1. Safely add approved_fees column if it does not already exist
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS approved_fees NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- 2. Add description for documentation
COMMENT ON COLUMN public.bookings.approved_fees IS 'الرسوم المعتمدة والمحددة في إعدادات الموقع المضافة للمجموع الفرعي';

-- 3. Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
