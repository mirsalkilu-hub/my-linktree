CREATE TABLE public.qris_payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('monthly', 'annual')),
  amount_idr integer NOT NULL,
  paid_at timestamptz NOT NULL,
  transaction_reference text NOT NULL,
  evidence_path text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (plan = 'monthly' AND amount_idr = 50000)
    OR (plan = 'annual' AND amount_idr = 500000)
  )
);

CREATE UNIQUE INDEX qris_payment_submissions_transaction_reference_key
  ON public.qris_payment_submissions (lower(btrim(transaction_reference)));
CREATE INDEX qris_payment_submissions_user_created_idx
  ON public.qris_payment_submissions (user_id, created_at DESC);
CREATE INDEX qris_payment_submissions_pending_created_idx
  ON public.qris_payment_submissions (created_at)
  WHERE status = 'pending';

ALTER TABLE public.qris_payment_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.qris_payment_submissions FROM anon, authenticated;
GRANT ALL ON public.qris_payment_submissions TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qris-payment-evidence',
  'qris-payment-evidence',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.admin_list_qris_submissions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  usernames text[],
  plan text,
  amount_idr integer,
  paid_at timestamptz,
  transaction_reference text,
  evidence_path text,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    submission.id,
    submission.user_id,
    auth_user.email::text,
    COALESCE(profile.usernames, ARRAY[]::text[]),
    submission.plan,
    submission.amount_idr,
    submission.paid_at,
    submission.transaction_reference,
    submission.evidence_path,
    submission.created_at
  FROM public.qris_payment_submissions AS submission
  JOIN auth.users AS auth_user ON auth_user.id = submission.user_id
  LEFT JOIN LATERAL (
    SELECT array_agg(DISTINCT bio_profile.username ORDER BY bio_profile.username) AS usernames
    FROM public.bio_profiles AS bio_profile
    WHERE bio_profile.user_id = submission.user_id
  ) AS profile ON true
  WHERE submission.status = 'pending'
  ORDER BY submission.created_at
  LIMIT 100;
$$;

REVOKE ALL ON FUNCTION public.admin_list_qris_submissions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_qris_submissions() TO service_role;

CREATE OR REPLACE FUNCTION public.admin_review_qris_submission(
  p_submission_id uuid,
  p_reviewer_id uuid,
  p_approved boolean,
  p_admin_note text DEFAULT NULL
)
RETURNS TABLE (status text, current_period_end timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  selected_submission public.qris_payment_submissions%ROWTYPE;
  current_vip public.vip_subscriptions%ROWTYPE;
  has_current_vip boolean;
  review_time timestamptz := now();
  period_start timestamptz;
  period_end timestamptz;
BEGIN
  SELECT * INTO selected_submission
  FROM public.qris_payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'QRIS_SUBMISSION_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;
  IF selected_submission.status <> 'pending' THEN
    RAISE EXCEPTION 'QRIS_SUBMISSION_ALREADY_REVIEWED' USING ERRCODE = '55000';
  END IF;

  IF NOT p_approved THEN
    IF length(btrim(COALESCE(p_admin_note, ''))) < 3 THEN
      RAISE EXCEPTION 'QRIS_REJECTION_NOTE_REQUIRED' USING ERRCODE = '22023';
    END IF;

    UPDATE public.qris_payment_submissions
    SET status = 'rejected',
        admin_note = left(btrim(p_admin_note), 500),
        reviewed_by = p_reviewer_id,
        reviewed_at = review_time
    WHERE id = p_submission_id;

    RETURN QUERY SELECT 'rejected'::text, NULL::timestamptz;
    RETURN;
  END IF;

  SELECT * INTO current_vip
  FROM public.vip_subscriptions
  WHERE user_id = selected_submission.user_id
  FOR UPDATE;
  has_current_vip := FOUND;

  IF has_current_vip AND (
    (current_vip.payment_provider = 'paypal'
      AND current_vip.paypal_subscription_id IS NOT NULL
      AND current_vip.status NOT IN ('cancelled', 'canceled', 'expired'))
    OR
    (current_vip.stripe_subscription_id IS NOT NULL
      AND current_vip.status NOT IN ('cancelled', 'canceled', 'expired'))
  ) THEN
    RAISE EXCEPTION 'EXTERNAL_SUBSCRIPTION_ACTIVE' USING ERRCODE = '23514';
  END IF;

  period_start := review_time;
  IF has_current_vip
    AND current_vip.status IN ('active', 'trialing')
    AND current_vip.current_period_end > review_time THEN
    period_start := current_vip.current_period_end;
  END IF;

  period_end := period_start + CASE selected_submission.plan
    WHEN 'monthly' THEN interval '1 month'
    ELSE interval '1 year'
  END;

  INSERT INTO public.vip_subscriptions (
    user_id,
    status,
    payment_provider,
    current_period_end,
    updated_at,
    paypal_subscription_id,
    paypal_payer_id,
    stripe_subscription_id
  )
  VALUES (
    selected_submission.user_id,
    'active',
    'manual',
    period_end,
    review_time,
    NULL,
    NULL,
    NULL
  )
  ON CONFLICT (user_id) DO UPDATE
  SET status = EXCLUDED.status,
      payment_provider = EXCLUDED.payment_provider,
      current_period_end = EXCLUDED.current_period_end,
      updated_at = EXCLUDED.updated_at,
      paypal_subscription_id = NULL,
      paypal_payer_id = NULL,
      stripe_subscription_id = NULL;

  UPDATE public.qris_payment_submissions
  SET status = 'approved',
      admin_note = NULLIF(left(btrim(COALESCE(p_admin_note, '')), 500), ''),
      reviewed_by = p_reviewer_id,
      reviewed_at = review_time
  WHERE id = p_submission_id;

  RETURN QUERY SELECT 'approved'::text, period_end;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_qris_submission(uuid, uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_qris_submission(uuid, uuid, boolean, text)
  TO service_role;
