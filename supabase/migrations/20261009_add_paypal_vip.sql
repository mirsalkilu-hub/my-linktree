ALTER TABLE public.vip_subscriptions
  ADD COLUMN IF NOT EXISTS paypal_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS paypal_payer_id text,
  ADD COLUMN IF NOT EXISTS payment_provider text;

CREATE OR REPLACE FUNCTION public.enforce_vip_ads_setting()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ads_enabled IS FALSE AND NOT EXISTS (
    SELECT 1
    FROM public.vip_subscriptions
    WHERE user_id = NEW.user_id
      AND status IN ('active', 'trialing')
      AND current_period_end > now()
  ) THEN
    RAISE EXCEPTION 'An active VIP subscription is required to disable ads.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
