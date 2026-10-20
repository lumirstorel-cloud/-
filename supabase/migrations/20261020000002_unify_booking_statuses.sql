-- ============================================================================
-- Migration: 20261020000002_unify_booking_statuses.sql
-- Project: LUMIR | لومير (lumir-bookings)
-- Description: Unifies booking status values between TypeScript types and Supabase schema.
-- Note: Reviewable proposed migration. DO NOT execute without review.
-- ============================================================================

-- 1. Safely drop existing status check constraint if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_status_check' 
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

-- 2. Add unified check constraint covering all 7 active frontend/backend statuses
--    plus legacy aliases ('new', 'pending') to prevent breaking any existing rows.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'draft',                        -- مسودة طلب
    'pending_review',               -- بانتظار المراجعة
    'pending_client_confirmation',  -- بانتظار تأكيد العميل
    'confirmed',                    -- مؤكد ومعتمد
    'in_progress',                  -- جارٍ التنفيذ
    'completed',                    -- مكتمل
    'cancelled',                    -- ملغي
    'new',                          -- بديل متوافق مع السجلات السابقة
    'pending'                       -- بديل متوافق مع السجلات السابقة
  ));

-- 3. Update public submission RLS policy to allow initial statuses
DROP POLICY IF EXISTS "Public can submit new booking" ON public.bookings;
CREATE POLICY "Public can submit new booking"
  ON public.bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (status IN ('draft', 'pending_review', 'new', 'pending'));
